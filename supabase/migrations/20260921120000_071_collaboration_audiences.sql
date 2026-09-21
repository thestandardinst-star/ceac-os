-- 071 — Rooms 2.0 scopes and explicit meeting audiences.
--
-- Adds Sub-team Rooms without introducing direct messages.
-- Meetings become participant/audience based so scheduled meetings distribute
-- automatically through CEAC visibility rather than relying on copied links.
-- Consequential scheduling is atomic through schedule_meeting().

-- ---------------------------------------------------------------------------
-- Sub-team Rooms
-- ---------------------------------------------------------------------------

alter table public.rooms
  add column sub_team_id uuid references public.sub_teams(id) on delete cascade;

alter table public.rooms drop constraint rooms_kind_check;
alter table public.rooms drop constraint rooms_check;

alter table public.rooms
  add constraint rooms_kind_check
  check (kind in ('unit','sub_team','project'));

alter table public.rooms
  add constraint rooms_check
  check (
    (kind='unit' and unit_id is not null and sub_team_id is null and project_id is null)
    or
    (kind='sub_team' and unit_id is not null and sub_team_id is not null and project_id is null)
    or
    (kind='project' and project_id is not null and unit_id is null and sub_team_id is null)
  );

create unique index rooms_sub_team_unique
  on public.rooms(sub_team_id) where kind='sub_team';

create index rooms_unit_kind_idx
  on public.rooms(unit_id,kind)
  where unit_id is not null;

create or replace function public.app_can_access_room(p_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path=public
as $$
  select auth.uid() is not null and exists (
    select 1
    from public.rooms r
    where r.id=p_room_id
      and r.org_id=public.app_org_id()
      and (
        (
          r.kind='unit'
          and exists (
            select 1
            from public.unit_memberships um
            join public.units u on u.id=um.unit_id
            where um.profile_id=auth.uid()
              and um.unit_id=r.unit_id
              and um.org_id=r.org_id
              and u.active
          )
        )
        or
        (
          r.kind='sub_team'
          and exists (
            select 1
            from public.sub_teams st
            where st.id=r.sub_team_id
              and st.unit_id=r.unit_id
              and st.org_id=r.org_id
              and st.active
              and (
                st.lead_id=auth.uid()
                or exists (
                  select 1 from public.sub_team_members stm
                  where stm.sub_team_id=st.id and stm.profile_id=auth.uid()
                )
                or exists (
                  select 1 from public.unit_memberships um
                  where um.unit_id=st.unit_id
                    and um.profile_id=auth.uid()
                    and um.role='manager'
                )
              )
          )
        )
        or
        (
          r.kind='project'
          and exists (
            select 1
            from public.unit_memberships um
            join public.projects p on p.id=r.project_id
            where um.profile_id=auth.uid()
              and um.org_id=r.org_id
              and (
                um.unit_id=p.lead_unit_id
                or exists (
                  select 1 from public.project_units pu
                  where pu.project_id=p.id and pu.unit_id=um.unit_id
                )
              )
          )
        )
      )
  );
$$;

create or replace function public.bootstrap_sub_team_room()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  insert into public.rooms(org_id,kind,unit_id,sub_team_id,created_by)
  values(new.org_id,'sub_team',new.unit_id,new.id,null)
  on conflict(sub_team_id) where kind='sub_team' do nothing;
  return new;
end;
$$;

create trigger sub_teams_create_room
after insert on public.sub_teams
for each row execute function public.bootstrap_sub_team_room();

insert into public.rooms(org_id,kind,unit_id,sub_team_id,created_by)
select st.org_id,'sub_team',st.unit_id,st.id,null
from public.sub_teams st
where st.active
on conflict(sub_team_id) where kind='sub_team' do nothing;

create or replace function public.send_room_message(
  p_room_id uuid,
  p_body text,
  p_reply_to_id uuid default null,
  p_refs jsonb default '[]'::jsonb,
  p_mention_ids uuid[] default '{}'::uuid[]
)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  r public.rooms;
  v_id uuid:=gen_random_uuid();
  j jsonb;
  v_type text;
  v_object uuid;
  v_mention uuid;
begin
  if auth.uid() is null then
    raise exception 'Sign in to send a Room message.' using errcode='42501';
  end if;

  select * into r from public.rooms where id=p_room_id;
  if r.id is null or not public.app_can_access_room(r.id) then
    raise exception 'That Room is not available to you.' using errcode='42501';
  end if;

  if r.kind='unit' and not exists (
    select 1 from public.units u
    where u.id=r.unit_id and u.org_id=r.org_id and u.active
  ) then
    raise exception 'This Unit Room is not active.';
  end if;

  if r.kind='sub_team' and not exists (
    select 1 from public.sub_teams st
    where st.id=r.sub_team_id
      and st.unit_id=r.unit_id
      and st.org_id=r.org_id
      and st.active
  ) then
    raise exception 'This Sub-team Room is not active.';
  end if;

  if r.kind='project' and not exists (
    select 1 from public.projects p
    where p.id=r.project_id and p.org_id=r.org_id and p.status in ('planned','active')
  ) then
    raise exception 'This Project Room is read-only because the project is not active.';
  end if;

  if nullif(btrim(coalesce(p_body,'')),'') is null then
    raise exception 'Write a message before sending.';
  end if;
  if length(btrim(p_body))>8000 then
    raise exception 'Room messages can be up to 8000 characters.';
  end if;

  if p_reply_to_id is not null and not exists (
    select 1 from public.room_messages m
    where m.id=p_reply_to_id and m.room_id=r.id
  ) then
    raise exception 'That reply target is not in this Room.';
  end if;

  insert into public.room_messages(id,room_id,org_id,author_id,body,reply_to_id)
  values(v_id,r.id,r.org_id,auth.uid(),btrim(p_body),p_reply_to_id);

  for j in select * from jsonb_array_elements(coalesce(p_refs,'[]'::jsonb)) loop
    v_type:=j->>'object_type';
    v_object:=nullif(j->>'object_id','')::uuid;

    if v_type='work_item' then
      if v_object is null
         or not public.app_can_see_item(v_object)
         or not exists (
           select 1 from public.work_items w
           where w.id=v_object
             and (
               (r.kind='unit' and w.unit_id=r.unit_id)
               or (r.kind='sub_team' and w.sub_team_id=r.sub_team_id)
               or (r.kind='project' and w.project_id=r.project_id)
             )
         )
      then raise exception 'That work item cannot be referenced in this Room.'; end if;

    elsif v_type='project' then
      if v_object is null or not exists (
        select 1 from public.projects p
        where p.id=v_object
          and p.org_id=r.org_id
          and (
            (r.kind='project' and p.id=r.project_id)
            or (
              r.kind in ('unit','sub_team')
              and (
                p.lead_unit_id=r.unit_id
                or exists(
                  select 1 from public.project_units pu
                  where pu.project_id=p.id and pu.unit_id=r.unit_id
                )
              )
            )
          )
      ) then raise exception 'That project cannot be referenced in this Room.'; end if;

    elsif v_type='objective' then
      if v_object is null or not exists (
        select 1 from public.objectives o
        where o.id=v_object
          and o.org_id=r.org_id
          and (
            (r.kind='project' and o.project_id=r.project_id)
            or (r.kind in ('unit','sub_team') and o.unit_id=r.unit_id)
          )
      ) then raise exception 'That objective cannot be referenced in this Room.'; end if;

    elsif v_type='blocker' then
      if v_object is null or not exists (
        select 1 from public.blockers b
        join public.work_items w on w.id=b.work_item_id
        where b.id=v_object
          and b.org_id=r.org_id
          and public.app_can_see_item(w.id)
          and (
            (r.kind='project' and w.project_id=r.project_id)
            or (r.kind='unit' and w.unit_id=r.unit_id)
            or (r.kind='sub_team' and w.sub_team_id=r.sub_team_id)
          )
      ) then raise exception 'That dependency cannot be referenced in this Room.'; end if;

    else
      raise exception 'Unsupported Room reference type.';
    end if;

    insert into public.room_message_refs(message_id,object_type,object_id,label)
    values(v_id,v_type,v_object,nullif(btrim(coalesce(j->>'label','')),''))
    on conflict do nothing;
  end loop;

  foreach v_mention in array coalesce(p_mention_ids,'{}'::uuid[]) loop
    if not exists (
      select 1
      from public.profiles p
      where p.id=v_mention
        and p.org_id=r.org_id
        and p.active
        and (
          (
            r.kind='unit'
            and exists (
              select 1 from public.unit_memberships um
              where um.profile_id=p.id and um.unit_id=r.unit_id and um.org_id=r.org_id
            )
          )
          or
          (
            r.kind='sub_team'
            and (
              exists (
                select 1 from public.sub_team_members stm
                where stm.profile_id=p.id and stm.sub_team_id=r.sub_team_id
              )
              or exists (
                select 1
                from public.sub_teams st
                where st.id=r.sub_team_id and st.lead_id=p.id
              )
              or exists (
                select 1 from public.unit_memberships um
                where um.profile_id=p.id
                  and um.unit_id=r.unit_id
                  and um.role='manager'
              )
            )
          )
          or
          (
            r.kind='project'
            and exists (
              select 1
              from public.unit_memberships um
              join public.projects pr on pr.id=r.project_id
              where um.profile_id=p.id
                and um.org_id=r.org_id
                and (
                  um.unit_id=pr.lead_unit_id
                  or exists (
                    select 1 from public.project_units pu
                    where pu.project_id=pr.id and pu.unit_id=um.unit_id
                  )
                )
            )
          )
        )
    ) then
      raise exception 'A mentioned person is not part of this Room.';
    end if;

    insert into public.room_mentions(message_id,profile_id)
    values(v_id,v_mention)
    on conflict do nothing;
  end loop;

  return v_id;
end;
$$;

revoke all on function public.bootstrap_sub_team_room() from public,anon,authenticated;
grant execute on function public.bootstrap_sub_team_room() to service_role;

-- ---------------------------------------------------------------------------
-- Meeting participants and audience distribution
-- ---------------------------------------------------------------------------

create table public.meeting_participants(
  meeting_id uuid not null references public.meeting_sessions(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'participant' check(role in ('organiser','participant')),
  source_type text not null default 'selected'
    check(source_type in ('organiser','organisation','unit','sub_team','project','project_managers','selected')),
  source_id uuid,
  invited_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key(meeting_id,profile_id)
);

create index meeting_participants_profile_idx
  on public.meeting_participants(profile_id,created_at desc);

alter table public.meeting_participants enable row level security;

create policy meeting_participants_read
on public.meeting_participants
for select using (
  profile_id=auth.uid()
  or invited_by=auth.uid()
  or public.app_is_admin()
  or public.app_is_exec()
);

-- Backfill all existing meetings according to their current visibility contract.
insert into public.meeting_participants(meeting_id,profile_id,role,source_type,source_id,invited_by)
select m.id,p.id,
       case when p.id=m.created_by then 'organiser' else 'participant' end,
       case
         when p.id=m.created_by then 'organiser'
         when m.scope='organisation' then 'organisation'
         when m.scope='unit' then 'unit'
         else 'project'
       end,
       case
         when m.scope='unit' then m.unit_id
         when m.scope='project' then m.project_id
         else null
       end,
       m.created_by
from public.meeting_sessions m
join public.profiles p
  on p.org_id=m.org_id and p.active
where p.id=m.created_by
   or m.scope='organisation'
   or (
     m.scope='unit'
     and exists (
       select 1 from public.unit_memberships um
       where um.profile_id=p.id and um.unit_id=m.unit_id
     )
   )
   or (
     m.scope='project'
     and exists (
       select 1
       from public.projects pr
       left join public.project_units pu on pu.project_id=pr.id
       join public.unit_memberships um on um.profile_id=p.id
       where pr.id=m.project_id
         and (um.unit_id=pr.lead_unit_id or um.unit_id=pu.unit_id)
     )
   )
on conflict(meeting_id,profile_id) do nothing;

drop policy meeting_sessions_read on public.meeting_sessions;
create policy meeting_sessions_read
on public.meeting_sessions
for select using (
  org_id=public.app_org_id()
  and (
    created_by=auth.uid()
    or public.app_is_admin()
    or public.app_is_exec()
    or exists (
      select 1
      from public.meeting_participants mp
      where mp.meeting_id=id
        and mp.profile_id=auth.uid()
    )
  )
);

drop policy meeting_sessions_insert on public.meeting_sessions;
revoke insert on public.meeting_sessions from authenticated;

create or replace function public.schedule_meeting(
  p_scope text,
  p_unit_id uuid,
  p_project_id uuid,
  p_title text,
  p_agenda text,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_provider text,
  p_join_url text,
  p_location text,
  p_audience jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  v_actor uuid:=auth.uid();
  v_org uuid:=public.app_org_id();
  v_meeting uuid:=gen_random_uuid();
  v_audience jsonb:=coalesce(p_audience,'[]'::jsonb);
  v_entry jsonb;
  v_type text;
  v_id uuid;
  v_count integer:=0;
begin
  if v_actor is null or v_org is null then
    raise exception 'Sign in to schedule a meeting.' using errcode='42501';
  end if;

  if p_scope not in ('organisation','unit','project') then
    raise exception 'Choose a valid meeting context.';
  end if;

  if nullif(btrim(coalesce(p_title,'')),'') is null then
    raise exception 'Add a meeting title.';
  end if;

  if p_ends_at is not null and p_ends_at<p_starts_at then
    raise exception 'Meeting end time cannot be before its start.';
  end if;

  if p_provider not in ('zoom','external') then
    raise exception 'Choose a supported meeting provider.';
  end if;

  if p_join_url is not null and p_join_url !~ '^https://' then
    raise exception 'Meeting link must use https.';
  end if;

  if p_scope='organisation' then
    if not (public.app_is_admin() or public.app_is_exec()) then
      raise exception 'Only Administration or the Group Pastor can schedule an organisation meeting.'
        using errcode='42501';
    end if;
    p_unit_id:=null;
    p_project_id:=null;

  elsif p_scope='unit' then
    if p_unit_id is null or not exists(
      select 1 from public.units u
      where u.id=p_unit_id and u.org_id=v_org and u.active
    ) then
      raise exception 'Choose an active unit.';
    end if;

    if not (
      public.app_is_admin()
      or public.app_is_exec()
      or p_unit_id in (select public.app_managed_units())
    ) then
      raise exception 'You cannot schedule for that unit.' using errcode='42501';
    end if;
    p_project_id:=null;

  else
    if p_project_id is null or not exists(
      select 1 from public.projects p
      where p.id=p_project_id and p.org_id=v_org and p.status in ('planned','active')
    ) then
      raise exception 'Choose an active project.';
    end if;

    if not (
      public.app_is_admin()
      or public.app_is_exec()
      or exists(
        select 1 from public.projects p
        where p.id=p_project_id
          and (
            p.lead_unit_id in (select public.app_managed_units())
            or exists(
              select 1 from public.project_units pu
              where pu.project_id=p.id
                and pu.unit_id in (select public.app_managed_units())
            )
          )
      )
    ) then
      raise exception 'You cannot schedule for that project.' using errcode='42501';
    end if;
    p_unit_id:=null;
  end if;

  insert into public.meeting_sessions(
    id,org_id,scope,unit_id,project_id,title,agenda,starts_at,ends_at,
    provider,join_url,location,status,created_by
  ) values(
    v_meeting,v_org,p_scope,p_unit_id,p_project_id,btrim(p_title),
    nullif(btrim(coalesce(p_agenda,'')),''),
    p_starts_at,p_ends_at,p_provider,
    nullif(btrim(coalesce(p_join_url,'')),''),
    nullif(btrim(coalesce(p_location,'')),''),
    'scheduled',v_actor
  );

  insert into public.meeting_participants(
    meeting_id,profile_id,role,source_type,source_id,invited_by
  ) values(v_meeting,v_actor,'organiser','organiser',null,v_actor)
  on conflict do nothing;

  if jsonb_array_length(v_audience)=0 then
    if p_scope='organisation' then
      v_audience:=jsonb_build_array(jsonb_build_object('type','organisation','id',null));
    elsif p_scope='unit' then
      v_audience:=jsonb_build_array(jsonb_build_object('type','unit','id',p_unit_id));
    else
      v_audience:=jsonb_build_array(jsonb_build_object('type','project','id',p_project_id));
    end if;
  end if;

  for v_entry in select * from jsonb_array_elements(v_audience) loop
    v_type:=v_entry->>'type';
    v_id:=nullif(v_entry->>'id','')::uuid;

    if v_type='organisation' then
      if p_scope<>'organisation' or not (public.app_is_admin() or public.app_is_exec()) then
        raise exception 'Organisation audience is not available here.' using errcode='42501';
      end if;
      insert into public.meeting_participants(meeting_id,profile_id,source_type,source_id,invited_by)
      select v_meeting,p.id,'organisation',null,v_actor
      from public.profiles p
      where p.org_id=v_org and p.active
      on conflict do nothing;

    elsif v_type='unit' then
      if v_id is null or not exists(
        select 1 from public.units u where u.id=v_id and u.org_id=v_org and u.active
      ) then
        raise exception 'A selected unit is not available.';
      end if;

      if not (
        public.app_is_admin()
        or public.app_is_exec()
        or v_id in (select public.app_managed_units())
        or (
          p_scope='project'
          and exists(
            select 1
            from public.projects pr
            where pr.id=p_project_id
              and (
                pr.lead_unit_id=v_id
                or exists(select 1 from public.project_units pu where pu.project_id=pr.id and pu.unit_id=v_id)
              )
          )
        )
      ) then
        raise exception 'You cannot invite that unit.' using errcode='42501';
      end if;

      insert into public.meeting_participants(meeting_id,profile_id,source_type,source_id,invited_by)
      select v_meeting,um.profile_id,'unit',v_id,v_actor
      from public.unit_memberships um
      join public.profiles p on p.id=um.profile_id
      where um.org_id=v_org and um.unit_id=v_id and p.active
      on conflict do nothing;

    elsif v_type='sub_team' then
      if v_id is null or not exists(
        select 1 from public.sub_teams st
        where st.id=v_id and st.org_id=v_org and st.active
      ) then
        raise exception 'A selected sub-team is not available.';
      end if;

      if not (
        public.app_is_admin()
        or public.app_is_exec()
        or exists(
          select 1 from public.sub_teams st
          where st.id=v_id and st.unit_id in (select public.app_managed_units())
        )
      ) then
        raise exception 'You cannot invite that sub-team.' using errcode='42501';
      end if;

      insert into public.meeting_participants(meeting_id,profile_id,source_type,source_id,invited_by)
      select v_meeting,stm.profile_id,'sub_team',v_id,v_actor
      from public.sub_team_members stm
      join public.profiles p on p.id=stm.profile_id
      where stm.sub_team_id=v_id and p.org_id=v_org and p.active
      union
      select v_meeting,st.lead_id,'sub_team',v_id,v_actor
      from public.sub_teams st
      join public.profiles p on p.id=st.lead_id
      where st.id=v_id and st.lead_id is not null and p.active
      on conflict do nothing;

    elsif v_type='project' then
      if p_scope<>'project' or v_id is distinct from p_project_id then
        raise exception 'Project audience must match the meeting project.';
      end if;

      insert into public.meeting_participants(meeting_id,profile_id,source_type,source_id,invited_by)
      select distinct v_meeting,um.profile_id,'project',p_project_id,v_actor
      from public.projects pr
      join public.unit_memberships um
        on um.org_id=pr.org_id
       and (
         um.unit_id=pr.lead_unit_id
         or exists(
           select 1 from public.project_units pu
           where pu.project_id=pr.id and pu.unit_id=um.unit_id
         )
       )
      join public.profiles p on p.id=um.profile_id and p.active
      where pr.id=p_project_id
      on conflict do nothing;

    elsif v_type='project_managers' then
      if p_scope<>'project' or v_id is distinct from p_project_id then
        raise exception 'Project manager audience must match the meeting project.';
      end if;

      insert into public.meeting_participants(meeting_id,profile_id,source_type,source_id,invited_by)
      select distinct v_meeting,um.profile_id,'project_managers',p_project_id,v_actor
      from public.projects pr
      join public.unit_memberships um
        on um.org_id=pr.org_id
       and um.role='manager'
       and (
         um.unit_id=pr.lead_unit_id
         or exists(
           select 1 from public.project_units pu
           where pu.project_id=pr.id and pu.unit_id=um.unit_id
         )
       )
      join public.profiles p on p.id=um.profile_id and p.active
      where pr.id=p_project_id
      on conflict do nothing;

    elsif v_type='selected' then
      if v_id is null or not exists(
        select 1 from public.profiles p
        where p.id=v_id and p.org_id=v_org and p.active
      ) then
        raise exception 'A selected person is not available.';
      end if;

      if not (
        public.app_is_admin()
        or public.app_is_exec()
        or exists(
          select 1 from public.unit_memberships um
          where um.profile_id=v_id
            and um.unit_id in (select public.app_managed_units())
        )
        or (
          p_scope='project'
          and exists(
            select 1
            from public.unit_memberships invitee
            join public.projects pr on pr.id=p_project_id
            where invitee.profile_id=v_id
              and invitee.role='manager'
              and (
                invitee.unit_id=pr.lead_unit_id
                or exists(
                  select 1 from public.project_units pu
                  where pu.project_id=pr.id and pu.unit_id=invitee.unit_id
                )
              )
          )
        )
      ) then
        raise exception 'You cannot invite that person.' using errcode='42501';
      end if;

      insert into public.meeting_participants(meeting_id,profile_id,source_type,source_id,invited_by)
      values(v_meeting,v_id,'selected',v_id,v_actor)
      on conflict do nothing;

    else
      raise exception 'Unsupported meeting audience type.';
    end if;
  end loop;

  select count(*) into v_count
  from public.meeting_participants
  where meeting_id=v_meeting;

  if v_count<1 then
    raise exception 'A meeting must have at least one participant.';
  end if;

  return v_meeting;
end;
$$;

revoke all on function public.schedule_meeting(text,uuid,uuid,text,text,timestamptz,timestamptz,text,text,text,jsonb)
  from public,anon,authenticated;
grant execute on function public.schedule_meeting(text,uuid,uuid,text,text,timestamptz,timestamptz,text,text,text,jsonb)
  to authenticated,service_role;

grant select on public.meeting_participants to authenticated,service_role;

-- Existing direct insert grant is intentionally removed. Meeting creation is
-- now atomic through schedule_meeting(), which resolves and persists audience.
