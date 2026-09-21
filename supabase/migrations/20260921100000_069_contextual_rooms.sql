-- 069 — Contextual Rooms foundation.
--
-- Rooms are work-context communication, not general chat. Unit Rooms inherit
-- active unit membership. Project Rooms inherit project-unit participation.
-- Administration/Executive flags alone do not grant ambient Room access.
-- Messages are append-only and can only be created through the validated RPC.

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete cascade,
  kind text not null check (kind in ('unit','project')),
  unit_id uuid references public.units(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  check (
    (kind='unit' and unit_id is not null and project_id is null)
    or
    (kind='project' and project_id is not null and unit_id is null)
  )
);

create unique index rooms_unit_unique
  on public.rooms(unit_id) where kind='unit';
create unique index rooms_project_unique
  on public.rooms(project_id) where kind='project';
create index rooms_org_kind_idx on public.rooms(org_id,kind);

create table public.room_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  org_id uuid not null references public.organisations(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete restrict,
  body text not null check (length(btrim(body)) between 1 and 8000),
  reply_to_id uuid references public.room_messages(id) on delete restrict,
  created_at timestamptz not null default now()
);
create index room_messages_room_created_idx
  on public.room_messages(room_id,created_at desc);

create table public.room_message_refs (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.room_messages(id) on delete cascade,
  object_type text not null check (object_type in ('work_item','project','objective','blocker')),
  object_id uuid not null,
  label text check (label is null or length(label)<=240),
  created_at timestamptz not null default now(),
  unique(message_id,object_type,object_id)
);
create index room_message_refs_message_idx on public.room_message_refs(message_id);

create table public.room_mentions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.room_messages(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(message_id,profile_id)
);
create index room_mentions_profile_created_idx
  on public.room_mentions(profile_id,created_at desc);

create table public.room_reads (
  room_id uuid not null references public.rooms(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key(room_id,profile_id)
);
create index room_reads_profile_idx on public.room_reads(profile_id,last_read_at desc);

alter table public.rooms enable row level security;
alter table public.room_messages enable row level security;
alter table public.room_message_refs enable row level security;
alter table public.room_mentions enable row level security;
alter table public.room_reads enable row level security;

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
            select 1 from public.unit_memberships um
            join public.units u on u.id=um.unit_id
            where um.profile_id=auth.uid()
              and um.unit_id=r.unit_id
              and um.org_id=r.org_id
              and u.active
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

create policy rooms_read on public.rooms
for select using (public.app_can_access_room(id));

create policy room_messages_read on public.room_messages
for select using (
  org_id=public.app_org_id()
  and public.app_can_access_room(room_id)
);

create policy room_message_refs_read on public.room_message_refs
for select using (
  exists (
    select 1
    from public.room_messages m
    where m.id=message_id
      and public.app_can_access_room(m.room_id)
  )
);

create policy room_mentions_read on public.room_mentions
for select using (
  exists (
    select 1
    from public.room_messages m
    where m.id=message_id
      and public.app_can_access_room(m.room_id)
  )
);

create policy room_reads_self_read on public.room_reads
for select using (
  profile_id=auth.uid()
  and public.app_can_access_room(room_id)
);

create or replace function public.guard_room_message_integrity()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  if new.reply_to_id is not null and not exists (
    select 1 from public.room_messages parent
    where parent.id=new.reply_to_id
      and parent.room_id=new.room_id
  ) then
    raise exception 'A Room reply must point to a message in the same Room.';
  end if;

  if new.org_id is distinct from (select r.org_id from public.rooms r where r.id=new.room_id) then
    raise exception 'Room message organisation does not match its Room.';
  end if;

  return new;
end;
$$;

create trigger room_message_integrity
before insert on public.room_messages
for each row execute function public.guard_room_message_integrity();

create or replace function public.reject_room_message_mutation()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  raise exception 'Room messages are append-only.' using errcode='42501';
end;
$$;

create trigger room_messages_immutable
before update or delete on public.room_messages
for each row execute function public.reject_room_message_mutation();

create or replace function public.bootstrap_unit_room()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  insert into public.rooms(org_id,kind,unit_id,created_by)
  values(new.org_id,'unit',new.id,null)
  on conflict(unit_id) where kind='unit' do nothing;
  return new;
end;
$$;

create trigger units_create_room
after insert on public.units
for each row execute function public.bootstrap_unit_room();

create or replace function public.bootstrap_project_room()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  insert into public.rooms(org_id,kind,project_id,created_by)
  values(new.org_id,'project',new.id,new.created_by)
  on conflict(project_id) where kind='project' do nothing;
  return new;
end;
$$;

create trigger projects_create_room
after insert on public.projects
for each row execute function public.bootstrap_project_room();

insert into public.rooms(org_id,kind,unit_id,created_by)
select u.org_id,'unit',u.id,null
from public.units u
on conflict(unit_id) where kind='unit' do nothing;

insert into public.rooms(org_id,kind,project_id,created_by)
select p.org_id,'project',p.id,p.created_by
from public.projects p
on conflict(project_id) where kind='project' do nothing;

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
    select 1 from public.units u where u.id=r.unit_id and u.org_id=r.org_id and u.active
  ) then
    raise exception 'This Unit Room is not active.';
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
              r.kind='unit'
              and (
                p.lead_unit_id=r.unit_id
                or exists(select 1 from public.project_units pu where pu.project_id=p.id and pu.unit_id=r.unit_id)
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
            or (r.kind='unit' and o.unit_id=r.unit_id)
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
            r.kind='project'
            and exists (
              select 1 from public.unit_memberships um
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

create or replace function public.mark_room_read(p_room_id uuid)
returns void
language plpgsql
security definer
set search_path=public
as $$
begin
  if auth.uid() is null or not public.app_can_access_room(p_room_id) then
    raise exception 'That Room is not available to you.' using errcode='42501';
  end if;

  insert into public.room_reads(room_id,profile_id,last_read_at)
  values(p_room_id,auth.uid(),now())
  on conflict(room_id,profile_id) do update
    set last_read_at=excluded.last_read_at;
end;
$$;

revoke all on function public.app_can_access_room(uuid) from public,anon,authenticated;
revoke all on function public.send_room_message(uuid,text,uuid,jsonb,uuid[]) from public,anon,authenticated;
revoke all on function public.mark_room_read(uuid) from public,anon,authenticated;
revoke all on function public.guard_room_message_integrity() from public,anon,authenticated;
revoke all on function public.reject_room_message_mutation() from public,anon,authenticated;
revoke all on function public.bootstrap_unit_room() from public,anon,authenticated;
revoke all on function public.bootstrap_project_room() from public,anon,authenticated;

grant select on public.rooms,public.room_messages,public.room_message_refs,public.room_mentions,public.room_reads
  to authenticated,service_role;
grant execute on function public.app_can_access_room(uuid) to authenticated,service_role;
grant execute on function public.send_room_message(uuid,text,uuid,jsonb,uuid[]) to authenticated,service_role;
grant execute on function public.mark_room_read(uuid) to authenticated,service_role;

do $$
begin
  if exists(select 1 from pg_publication where pubname='supabase_realtime')
     and not exists(
       select 1 from pg_publication_tables
       where pubname='supabase_realtime' and schemaname='public' and tablename='room_messages'
     ) then
    alter publication supabase_realtime add table public.room_messages;
  end if;
end;
$$;
