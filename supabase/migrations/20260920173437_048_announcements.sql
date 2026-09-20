-- First-class organisational announcements with explicit audiences and
-- attributable read/acknowledgement state.

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete restrict,
  title text not null check (length(btrim(title)) between 1 and 180),
  body text not null check (length(btrim(body)) between 1 and 12000),
  priority text not null default 'normal' check (priority in ('normal','important','urgent')),
  status text not null default 'draft' check (status in ('draft','published','closed')),
  requires_acknowledgement boolean not null default false,
  published_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (expires_at is null or published_at is null or expires_at>published_at)
);

create table public.announcement_audiences (
  id uuid primary key default gen_random_uuid(),
  announcement_id uuid not null references public.announcements(id) on delete cascade,
  audience_type text not null check (audience_type in ('organisation','unit','role')),
  unit_id uuid references public.units(id) on delete cascade,
  audience_role text check (audience_role in ('staff','sub_team_lead','manager','admin','exec')),
  created_at timestamptz not null default now(),
  check (
    (audience_type='organisation' and unit_id is null and audience_role is null)
    or (audience_type='unit' and unit_id is not null and audience_role is null)
    or (audience_type='role' and unit_id is null and audience_role is not null)
  )
);

create unique index announcement_audience_org_unique
  on public.announcement_audiences(announcement_id,audience_type)
  where audience_type='organisation';
create unique index announcement_audience_unit_unique
  on public.announcement_audiences(announcement_id,unit_id)
  where audience_type='unit';
create unique index announcement_audience_role_unique
  on public.announcement_audiences(announcement_id,audience_role)
  where audience_type='role';

create table public.announcement_receipts (
  id uuid primary key default gen_random_uuid(),
  announcement_id uuid not null references public.announcements(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  read_at timestamptz not null default now(),
  acknowledged_at timestamptz,
  unique(announcement_id,profile_id)
);

create index announcements_org_published_idx
  on public.announcements(org_id,status,published_at desc);
create index announcement_audiences_unit_idx
  on public.announcement_audiences(unit_id,announcement_id);
create index announcement_receipts_profile_idx
  on public.announcement_receipts(profile_id,read_at desc);

alter table public.announcements enable row level security;
alter table public.announcement_audiences enable row level security;
alter table public.announcement_receipts enable row level security;

create policy announcements_read on public.announcements
for select using (
  org_id=public.app_org_id()
  and (
    public.app_is_admin()
    or public.app_is_exec()
    or (
      status='published'
      and published_at<=now()
      and (expires_at is null or expires_at>now())
      and exists (
        select 1 from public.announcement_audiences aa
        where aa.announcement_id=announcements.id
          and (
            aa.audience_type='organisation'
            or (aa.audience_type='unit' and aa.unit_id in (select public.app_my_units()))
            or (aa.audience_type='role' and (
              (aa.audience_role in ('staff','sub_team_lead','manager') and exists (
                select 1 from public.unit_memberships m
                where m.profile_id=auth.uid() and m.role=aa.audience_role
              ))
              or (aa.audience_role='admin' and public.app_is_admin())
              or (aa.audience_role='exec' and public.app_is_exec())
            ))
          )
      )
    )
  )
);

create policy announcement_audiences_read on public.announcement_audiences
for select using (announcement_id in (select id from public.announcements));

create policy announcement_receipts_read on public.announcement_receipts
for select using (
  profile_id=auth.uid()
  or public.app_is_admin()
  or public.app_is_exec()
);

create or replace function public.app_can_publish_announcements()
returns boolean
language sql
stable
security definer
set search_path=public
as $$
  select auth.uid() is not null and (
    public.app_is_admin()
    or public.app_is_exec()
    or exists (
      select 1 from public.capabilities c
      where c.profile_id=auth.uid()
        and c.org_id=public.app_org_id()
        and c.capability='post_announcement'
    )
  );
$$;

create or replace function public.app_can_read_announcement(p_announcement_id uuid)
returns boolean
language sql
stable
security definer
set search_path=public
as $$
  select exists (
    select 1 from public.announcements a
    where a.id=p_announcement_id
      and a.org_id=public.app_org_id()
      and a.status='published'
      and a.published_at<=now()
      and (a.expires_at is null or a.expires_at>now())
      and exists (
        select 1 from public.announcement_audiences aa
        where aa.announcement_id=a.id
          and (
            aa.audience_type='organisation'
            or (aa.audience_type='unit' and aa.unit_id in (select public.app_my_units()))
            or (aa.audience_type='role' and (
              (aa.audience_role in ('staff','sub_team_lead','manager') and exists (
                select 1 from public.unit_memberships m
                where m.profile_id=auth.uid() and m.role=aa.audience_role
              ))
              or (aa.audience_role='admin' and public.app_is_admin())
              or (aa.audience_role='exec' and public.app_is_exec())
            ))
          )
      )
  );
$$;

create or replace function public.create_announcement(
  p_title text,
  p_body text,
  p_priority text default 'normal',
  p_requires_acknowledgement boolean default false,
  p_expires_at timestamptz default null,
  p_all_org boolean default true,
  p_unit_ids uuid[] default '{}'::uuid[],
  p_roles text[] default '{}'::text[]
)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  v_id uuid;
  v_unit uuid;
  v_role text;
begin
  if not public.app_can_publish_announcements() then
    raise exception 'You are not allowed to publish announcements.' using errcode='42501';
  end if;
  if nullif(btrim(p_title),'') is null or nullif(btrim(p_body),'') is null then
    raise exception 'Add a title and message.';
  end if;
  if p_priority not in ('normal','important','urgent') then raise exception 'Choose a valid priority.'; end if;
  if not p_all_org and coalesce(cardinality(p_unit_ids),0)=0 and coalesce(cardinality(p_roles),0)=0 then
    raise exception 'Choose at least one audience.';
  end if;
  if exists (
    select 1 from unnest(coalesce(p_unit_ids,'{}'::uuid[])) requested(id)
    left join public.units u on u.id=requested.id and u.org_id=public.app_org_id()
    where u.id is null
  ) then raise exception 'An audience unit is not available in your organisation.'; end if;
  if exists (
    select 1 from unnest(coalesce(p_roles,'{}'::text[])) requested(role)
    where requested.role not in ('staff','sub_team_lead','manager','admin','exec')
  ) then raise exception 'Choose a valid audience role.'; end if;

  insert into public.announcements(org_id,author_id,title,body,priority,requires_acknowledgement,expires_at)
  values(public.app_org_id(),auth.uid(),btrim(p_title),btrim(p_body),p_priority,p_requires_acknowledgement,p_expires_at)
  returning id into v_id;

  if p_all_org then
    insert into public.announcement_audiences(announcement_id,audience_type)
    values(v_id,'organisation');
  end if;
  foreach v_unit in array coalesce(p_unit_ids,'{}'::uuid[]) loop
    insert into public.announcement_audiences(announcement_id,audience_type,unit_id)
    values(v_id,'unit',v_unit) on conflict do nothing;
  end loop;
  foreach v_role in array coalesce(p_roles,'{}'::text[]) loop
    insert into public.announcement_audiences(announcement_id,audience_type,audience_role)
    values(v_id,'role',v_role) on conflict do nothing;
  end loop;

  return v_id;
end;
$$;

create or replace function public.update_announcement(
  p_announcement_id uuid,
  p_title text,
  p_body text,
  p_priority text,
  p_requires_acknowledgement boolean,
  p_expires_at timestamptz,
  p_all_org boolean,
  p_unit_ids uuid[],
  p_roles text[]
)
returns void
language plpgsql
security definer
set search_path=public
as $$
declare
  a public.announcements;
  v_unit uuid;
  v_role text;
begin
  if not public.app_can_publish_announcements() then
    raise exception 'You are not allowed to edit announcements.' using errcode='42501';
  end if;
  select * into a from public.announcements where id=p_announcement_id for update;
  if a.id is null or a.org_id<>public.app_org_id() then raise exception 'That announcement is not available.'; end if;
  if a.status<>'draft' then raise exception 'Only a draft announcement can be edited.'; end if;
  if nullif(btrim(p_title),'') is null or nullif(btrim(p_body),'') is null then raise exception 'Add a title and message.'; end if;
  if p_priority not in ('normal','important','urgent') then raise exception 'Choose a valid priority.'; end if;
  if not p_all_org and coalesce(cardinality(p_unit_ids),0)=0 and coalesce(cardinality(p_roles),0)=0 then
    raise exception 'Choose at least one audience.';
  end if;
  if exists (
    select 1 from unnest(coalesce(p_unit_ids,'{}'::uuid[])) requested(id)
    left join public.units u on u.id=requested.id and u.org_id=public.app_org_id()
    where u.id is null
  ) then raise exception 'An audience unit is not available in your organisation.'; end if;
  if exists (
    select 1 from unnest(coalesce(p_roles,'{}'::text[])) requested(role)
    where requested.role not in ('staff','sub_team_lead','manager','admin','exec')
  ) then raise exception 'Choose a valid audience role.'; end if;

  update public.announcements
  set title=btrim(p_title),body=btrim(p_body),priority=p_priority,
      requires_acknowledgement=p_requires_acknowledgement,
      expires_at=p_expires_at,updated_at=now()
  where id=a.id;

  delete from public.announcement_audiences where announcement_id=a.id;
  if p_all_org then
    insert into public.announcement_audiences(announcement_id,audience_type)
    values(a.id,'organisation');
  end if;
  foreach v_unit in array coalesce(p_unit_ids,'{}'::uuid[]) loop
    insert into public.announcement_audiences(announcement_id,audience_type,unit_id)
    values(a.id,'unit',v_unit) on conflict do nothing;
  end loop;
  foreach v_role in array coalesce(p_roles,'{}'::text[]) loop
    insert into public.announcement_audiences(announcement_id,audience_type,audience_role)
    values(a.id,'role',v_role) on conflict do nothing;
  end loop;
end;
$$;

create or replace function public.publish_announcement(p_announcement_id uuid)
returns void
language plpgsql
security definer
set search_path=public
as $$
declare a public.announcements;
begin
  if not public.app_can_publish_announcements() then raise exception 'You are not allowed to publish announcements.' using errcode='42501'; end if;
  select * into a from public.announcements where id=p_announcement_id for update;
  if a.id is null or a.org_id<>public.app_org_id() then raise exception 'That announcement is not available.'; end if;
  if a.status<>'draft' then raise exception 'Only a draft announcement can be published.'; end if;
  if not exists(select 1 from public.announcement_audiences where announcement_id=a.id) then raise exception 'Choose an audience before publishing.'; end if;
  if a.expires_at is not null and a.expires_at<=now() then raise exception 'The expiry must be in the future.'; end if;

  update public.announcements set status='published',published_at=now(),updated_at=now() where id=a.id;
  insert into public.activity_events(org_id,actor_id,verb,object_type,object_id,meta)
  values(a.org_id,auth.uid(),'announcement_published','announcement',a.id,
    jsonb_build_object('requires_acknowledgement',a.requires_acknowledgement));
end;
$$;

create or replace function public.close_announcement(p_announcement_id uuid)
returns void
language plpgsql
security definer
set search_path=public
as $$
declare a public.announcements;
begin
  if not public.app_can_publish_announcements() then raise exception 'You are not allowed to close announcements.' using errcode='42501'; end if;
  select * into a from public.announcements where id=p_announcement_id for update;
  if a.id is null or a.org_id<>public.app_org_id() then raise exception 'That announcement is not available.'; end if;
  if a.status='closed' then raise exception 'That announcement is already closed.'; end if;
  update public.announcements set status='closed',updated_at=now() where id=a.id;
  insert into public.activity_events(org_id,actor_id,verb,object_type,object_id,meta)
  values(a.org_id,auth.uid(),'announcement_closed','announcement',a.id,'{}'::jsonb);
end;
$$;

create or replace function public.mark_announcement_read(
  p_announcement_id uuid,
  p_acknowledge boolean default false
)
returns public.announcement_receipts
language plpgsql
security definer
set search_path=public
as $$
declare
  a public.announcements;
  r public.announcement_receipts;
begin
  if auth.uid() is null or not public.app_can_read_announcement(p_announcement_id) then
    raise exception 'That announcement is not available to you.' using errcode='42501';
  end if;
  select * into a from public.announcements where id=p_announcement_id;
  if p_acknowledge and not a.requires_acknowledgement then
    raise exception 'This announcement does not require acknowledgement.';
  end if;

  insert into public.announcement_receipts(announcement_id,profile_id,read_at,acknowledged_at)
  values(a.id,auth.uid(),now(),case when p_acknowledge then now() else null end)
  on conflict(announcement_id,profile_id) do update
    set read_at=least(announcement_receipts.read_at,excluded.read_at),
        acknowledged_at=case
          when p_acknowledge then coalesce(announcement_receipts.acknowledged_at,now())
          else announcement_receipts.acknowledged_at
        end
  returning * into r;

  return r;
end;
$$;

create or replace function public.announcement_audience_counts(p_announcement_id uuid)
returns table(target_count bigint,read_count bigint,acknowledged_count bigint)
language plpgsql
stable
security definer
set search_path=public
as $$
begin
  if not public.app_can_publish_announcements() then
    raise exception 'You are not allowed to view announcement counts.' using errcode='42501';
  end if;
  if not exists(select 1 from public.announcements where id=p_announcement_id and org_id=public.app_org_id()) then
    raise exception 'That announcement is not available.';
  end if;

  return query
  with targets as (
    select distinct p.id
    from public.profiles p
    where p.org_id=public.app_org_id() and p.active
      and exists (
        select 1 from public.announcement_audiences aa
        where aa.announcement_id=p_announcement_id
          and (
            aa.audience_type='organisation'
            or (aa.audience_type='unit' and exists (
              select 1 from public.unit_memberships m where m.profile_id=p.id and m.unit_id=aa.unit_id
            ))
            or (aa.audience_type='role' and (
              (aa.audience_role in ('staff','sub_team_lead','manager') and exists (
                select 1 from public.unit_memberships m where m.profile_id=p.id and m.role=aa.audience_role
              ))
              or (aa.audience_role='admin' and p.is_admin)
              or (aa.audience_role='exec' and p.is_exec)
            ))
          )
      )
  )
  select count(t.id),count(r.id),count(r.acknowledged_at)
  from targets t
  left join public.announcement_receipts r
    on r.announcement_id=p_announcement_id and r.profile_id=t.id;
end;
$$;

revoke all on function public.app_can_publish_announcements() from public,anon;
revoke all on function public.app_can_read_announcement(uuid) from public,anon,authenticated;
revoke all on function public.create_announcement(text,text,text,boolean,timestamptz,boolean,uuid[],text[]) from public,anon;
revoke all on function public.update_announcement(uuid,text,text,text,boolean,timestamptz,boolean,uuid[],text[]) from public,anon;
revoke all on function public.publish_announcement(uuid) from public,anon;
revoke all on function public.close_announcement(uuid) from public,anon;
revoke all on function public.mark_announcement_read(uuid,boolean) from public,anon;
revoke all on function public.announcement_audience_counts(uuid) from public,anon;

grant execute on function public.app_can_publish_announcements() to authenticated,service_role;
grant execute on function public.create_announcement(text,text,text,boolean,timestamptz,boolean,uuid[],text[]) to authenticated,service_role;
grant execute on function public.update_announcement(uuid,text,text,text,boolean,timestamptz,boolean,uuid[],text[]) to authenticated,service_role;
grant execute on function public.publish_announcement(uuid) to authenticated,service_role;
grant execute on function public.close_announcement(uuid) to authenticated,service_role;
grant execute on function public.mark_announcement_read(uuid,boolean) to authenticated,service_role;
grant execute on function public.announcement_audience_counts(uuid) to authenticated,service_role;
