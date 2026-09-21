-- 070 — Meeting workspace foundation.
--
-- Meetings are operational objects around an external meeting provider.
-- This migration keeps provider credentials out of the browser and stores only
-- the join location/context that authorised CEAC users may see.
-- Notes and decisions are attributable. Work created from a meeting is linked
-- back to the meeting without changing the existing Work Engine contracts.

create table public.meeting_sessions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete cascade,
  scope text not null check (scope in ('organisation','unit','project')),
  unit_id uuid references public.units(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  title text not null check (length(btrim(title)) between 1 and 220),
  agenda text check (agenda is null or length(agenda)<=12000),
  starts_at timestamptz not null,
  ends_at timestamptz,
  provider text not null default 'zoom' check (provider in ('zoom','external')),
  provider_meeting_id text,
  join_url text check (join_url is null or join_url ~ '^https://'),
  location text,
  status text not null default 'scheduled' check (status in ('scheduled','completed','cancelled')),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz,
  check (ends_at is null or ends_at>=starts_at),
  check (
    (scope='organisation' and unit_id is null and project_id is null)
    or
    (scope='unit' and unit_id is not null and project_id is null)
    or
    (scope='project' and project_id is not null and unit_id is null)
  )
);

create index meeting_sessions_org_starts_idx
  on public.meeting_sessions(org_id,starts_at);
create index meeting_sessions_unit_starts_idx
  on public.meeting_sessions(unit_id,starts_at)
  where unit_id is not null;
create index meeting_sessions_project_starts_idx
  on public.meeting_sessions(project_id,starts_at)
  where project_id is not null;

create table public.meeting_records (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meeting_sessions(id) on delete cascade,
  org_id uuid not null references public.organisations(id) on delete cascade,
  kind text not null check (kind in ('note','decision')),
  body text not null check (length(btrim(body)) between 1 and 12000),
  author_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index meeting_records_meeting_created_idx
  on public.meeting_records(meeting_id,created_at);

create table public.meeting_work_links (
  meeting_id uuid not null references public.meeting_sessions(id) on delete cascade,
  work_item_id uuid not null references public.work_items(id) on delete cascade,
  relation text not null default 'action' check (relation in ('action','outcome','related')),
  linked_by uuid not null references public.profiles(id) on delete restrict,
  linked_at timestamptz not null default now(),
  primary key(meeting_id,work_item_id)
);

create index meeting_work_links_work_idx
  on public.meeting_work_links(work_item_id);

alter table public.meeting_sessions enable row level security;
alter table public.meeting_records enable row level security;
alter table public.meeting_work_links enable row level security;

create policy meeting_sessions_read on public.meeting_sessions
for select using (
  org_id=public.app_org_id()
  and (
    scope='organisation'
    or public.app_is_admin()
    or public.app_is_exec()
    or (scope='unit' and unit_id in (select public.app_my_units()))
    or (scope='project' and project_id in (select public.app_visible_projects()))
  )
);

create policy meeting_sessions_insert on public.meeting_sessions
for insert with check (
  auth.uid() is not null
  and org_id=public.app_org_id()
  and created_by=auth.uid()
  and (
    (scope='organisation' and (public.app_is_admin() or public.app_is_exec()))
    or (scope='unit' and unit_id in (select public.app_managed_units()))
    or (
      scope='project'
      and exists (
        select 1 from public.projects p
        where p.id=project_id
          and p.org_id=public.app_org_id()
          and p.lead_unit_id in (select public.app_managed_units())
      )
    )
  )
);

create policy meeting_sessions_update on public.meeting_sessions
for update
using (
  org_id=public.app_org_id()
  and (
    public.app_is_admin()
    or public.app_is_exec()
    or (scope='unit' and unit_id in (select public.app_managed_units()))
    or (
      scope='project'
      and exists (
        select 1 from public.projects p
        where p.id=project_id
          and p.org_id=public.app_org_id()
          and p.lead_unit_id in (select public.app_managed_units())
      )
    )
  )
)
with check (
  org_id=public.app_org_id()
  and (
    public.app_is_admin()
    or public.app_is_exec()
    or (scope='unit' and unit_id in (select public.app_managed_units()))
    or (
      scope='project'
      and exists (
        select 1 from public.projects p
        where p.id=project_id
          and p.org_id=public.app_org_id()
          and p.lead_unit_id in (select public.app_managed_units())
      )
    )
  )
);

create policy meeting_records_read on public.meeting_records
for select using (
  org_id=public.app_org_id()
  and exists (
    select 1 from public.meeting_sessions m
    where m.id=meeting_id
  )
);

create policy meeting_records_insert on public.meeting_records
for insert with check (
  auth.uid() is not null
  and org_id=public.app_org_id()
  and author_id=auth.uid()
  and exists (
    select 1
    from public.meeting_sessions m
    where m.id=meeting_id
      and (
        kind='note'
        or public.app_is_admin()
        or public.app_is_exec()
        or (m.scope='unit' and m.unit_id in (select public.app_managed_units()))
        or (
          m.scope='project'
          and exists (
            select 1 from public.projects p
            where p.id=m.project_id
              and p.lead_unit_id in (select public.app_managed_units())
          )
        )
      )
  )
);

create policy meeting_work_links_read on public.meeting_work_links
for select using (
  public.app_can_see_item(work_item_id)
  and exists (
    select 1 from public.meeting_sessions m
    where m.id=meeting_id
  )
);

create policy meeting_work_links_insert on public.meeting_work_links
for insert with check (
  linked_by=auth.uid()
  and public.app_can_see_item(work_item_id)
  and exists (
    select 1
    from public.meeting_sessions m
    where m.id=meeting_id
      and (
        public.app_is_admin()
        or public.app_is_exec()
        or (m.scope='unit' and m.unit_id in (select public.app_managed_units()))
        or (
          m.scope='project'
          and exists (
            select 1 from public.projects p
            where p.id=m.project_id
              and p.lead_unit_id in (select public.app_managed_units())
          )
        )
      )
  )
);

create or replace function public.guard_meeting_session_identity()
returns trigger
language plpgsql
set search_path=public
as $$
begin
  if tg_op='UPDATE' then
    if new.org_id is distinct from old.org_id
       or new.scope is distinct from old.scope
       or new.unit_id is distinct from old.unit_id
       or new.project_id is distinct from old.project_id
       or new.created_by is distinct from old.created_by
       or new.created_at is distinct from old.created_at then
      raise exception 'Meeting identity and scope cannot be changed after creation.'
        using errcode='42501';
    end if;
    new.updated_by:=auth.uid();
    new.updated_at:=now();
  end if;
  return new;
end;
$$;

create trigger meeting_sessions_identity_guard
before update on public.meeting_sessions
for each row execute function public.guard_meeting_session_identity();

create or replace function public.reject_meeting_record_mutation()
returns trigger
language plpgsql
set search_path=public
as $$
begin
  raise exception 'Meeting notes and decisions are append-only.' using errcode='42501';
end;
$$;

create trigger meeting_records_immutable
before update or delete on public.meeting_records
for each row execute function public.reject_meeting_record_mutation();

revoke all on public.meeting_sessions,public.meeting_records,public.meeting_work_links
  from public,anon,authenticated;

grant select,insert,update on public.meeting_sessions to authenticated,service_role;
grant select,insert on public.meeting_records,public.meeting_work_links to authenticated,service_role;
