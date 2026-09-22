-- 086 — Stage 6: Resource & Workload Management.
-- Adds append-only planning capacity and project commitment history.
-- Attendance is deliberately not used as a capacity/performance measure.

insert into public.capability_definitions(capability,label,description,sensitive)
values (
  'resource.manage',
  'Manage resource planning',
  'Manage organisation-wide planning capacity and project commitments.',
  false
)
on conflict(capability) do nothing;

insert into public.capability_grants(
  org_id,profile_id,capability,scope_unit_id,granted_by,grant_reason
)
select p.org_id,p.id,'resource.manage',null,null,
       'Stage 6 baseline from existing Administration authority.'
from public.profiles p
where p.is_admin and p.active
  and not exists (
    select 1
    from public.capability_grants cg
    where cg.org_id=p.org_id
      and cg.profile_id=p.id
      and cg.capability='resource.manage'
      and cg.scope_unit_id is null
      and cg.revoked_at is null
  );

insert into public.platform_event_definitions(
  event_type,label,description,source_domain,payload_version
) values
  ('resource.capacity_changed','Resource capacity changed',
   'An operational weekly planning-capacity version was recorded.','resource',1),
  ('resource.commitment_changed','Resource commitment changed',
   'A project commitment planning version was recorded.','resource',1)
on conflict(event_type) do nothing;

create table public.resource_capacity_versions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete restrict,
  profile_id uuid not null references public.profiles(id) on delete restrict,
  weekly_minutes integer not null check (weekly_minutes between 1 and 10080),
  effective_on date not null,
  reason text not null check (length(btrim(reason)) between 3 and 600),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index resource_capacity_versions_profile_idx
  on public.resource_capacity_versions(org_id,profile_id,effective_on desc,created_at desc);

create table public.resource_project_commitment_versions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete restrict,
  profile_id uuid not null references public.profiles(id) on delete restrict,
  project_id uuid not null references public.projects(id) on delete restrict,
  planned_minutes_per_week integer not null
    check (planned_minutes_per_week between 0 and 10080),
  starts_on date not null,
  ends_on date,
  state text not null default 'active'
    check (state in ('active','withdrawn')),
  supersedes_id uuid references public.resource_project_commitment_versions(id) on delete restrict,
  reason text not null check (length(btrim(reason)) between 3 and 600),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  check (ends_on is null or ends_on>=starts_on),
  check (state<>'withdrawn' or planned_minutes_per_week=0)
);

create unique index resource_project_commitment_supersedes_uidx
  on public.resource_project_commitment_versions(supersedes_id)
  where supersedes_id is not null;

create index resource_project_commitment_profile_idx
  on public.resource_project_commitment_versions(
    org_id,profile_id,project_id,created_at desc
  );
create index resource_project_commitment_project_idx
  on public.resource_project_commitment_versions(project_id,state,starts_on,ends_on);

alter table public.resource_capacity_versions enable row level security;
alter table public.resource_project_commitment_versions enable row level security;

revoke all on public.resource_capacity_versions from anon;
revoke all on public.resource_project_commitment_versions from anon;

revoke update,delete on public.resource_capacity_versions from authenticated;
revoke update,delete on public.resource_project_commitment_versions from authenticated;

grant select,insert on public.resource_capacity_versions to authenticated;
grant select,insert on public.resource_project_commitment_versions to authenticated;

create or replace function public.app_can_manage_resource_profile(p_profile_id uuid)
returns boolean
language sql
stable
security invoker
set search_path=public
as $$
  select
    p_profile_id is not null
    and exists (
      select 1
      from public.profiles p
      where p.id=p_profile_id
        and p.org_id=public.app_org_id()
    )
    and (
      public.app_has_capability('resource.manage',null)
      or p_profile_id in (
        select um.profile_id
        from public.unit_memberships um
        where um.org_id=public.app_org_id()
          and um.unit_id in (select public.app_managed_units())
      )
    );
$$;

revoke all on function public.app_can_manage_resource_profile(uuid) from public,anon;
grant execute on function public.app_can_manage_resource_profile(uuid) to authenticated,service_role;

create policy resource_capacity_versions_read
on public.resource_capacity_versions
for select to authenticated
using (
  org_id=public.app_org_id()
  and (
    profile_id=auth.uid()
    or public.app_can_manage_resource_profile(profile_id)
  )
);

create policy resource_capacity_versions_insert
on public.resource_capacity_versions
for insert to authenticated
with check (
  org_id=public.app_org_id()
  and created_by=auth.uid()
  and public.app_can_manage_resource_profile(profile_id)
);

create policy resource_project_commitment_versions_read
on public.resource_project_commitment_versions
for select to authenticated
using (
  org_id=public.app_org_id()
  and (
    profile_id=auth.uid()
    or public.app_can_manage_resource_profile(profile_id)
  )
);

create policy resource_project_commitment_versions_insert
on public.resource_project_commitment_versions
for insert to authenticated
with check (
  org_id=public.app_org_id()
  and created_by=auth.uid()
  and public.app_can_manage_resource_profile(profile_id)
  and (
    public.app_has_capability('resource.manage',null)
    or public.app_can_manage_delivery_project(project_id)
  )
);

create or replace function public.resource_capacity_version_guard()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  if not exists (
    select 1 from public.profiles p
    where p.id=new.profile_id and p.org_id=new.org_id
  ) then
    raise exception 'Resource capacity person must belong to the same organisation.'
      using errcode='42501';
  end if;

  if auth.uid() is not null then
    if new.org_id is distinct from public.app_org_id()
       or new.created_by is distinct from auth.uid()
       or not public.app_can_manage_resource_profile(new.profile_id) then
      raise exception 'You do not have authority to record this planning capacity.'
        using errcode='42501';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.resource_capacity_version_guard() from public,anon,authenticated;

create trigger resource_capacity_versions_guard
before insert on public.resource_capacity_versions
for each row execute function public.resource_capacity_version_guard();

create or replace function public.resource_project_commitment_version_guard()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  v_prior public.resource_project_commitment_versions;
begin
  if not exists (
    select 1 from public.profiles p
    where p.id=new.profile_id and p.org_id=new.org_id
  ) then
    raise exception 'Resource commitment person must belong to the same organisation.'
      using errcode='42501';
  end if;

  if not exists (
    select 1 from public.projects p
    where p.id=new.project_id and p.org_id=new.org_id
  ) then
    raise exception 'Resource commitment project must belong to the same organisation.'
      using errcode='42501';
  end if;

  if new.supersedes_id is not null then
    select * into v_prior
    from public.resource_project_commitment_versions
    where id=new.supersedes_id;

    if v_prior.id is null
       or v_prior.org_id is distinct from new.org_id
       or v_prior.profile_id is distinct from new.profile_id
       or v_prior.project_id is distinct from new.project_id then
      raise exception 'A resource commitment may only supersede the same person/project history.';
    end if;
  end if;

  if auth.uid() is not null then
    if new.org_id is distinct from public.app_org_id()
       or new.created_by is distinct from auth.uid()
       or not public.app_can_manage_resource_profile(new.profile_id)
       or not (
         public.app_has_capability('resource.manage',null)
         or public.app_can_manage_delivery_project(new.project_id)
       ) then
      raise exception 'You do not have authority to record this project commitment.'
        using errcode='42501';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.resource_project_commitment_version_guard() from public,anon,authenticated;

create trigger resource_project_commitment_versions_guard
before insert on public.resource_project_commitment_versions
for each row execute function public.resource_project_commitment_version_guard();

create trigger audit_resource_capacity_versions
after insert on public.resource_capacity_versions
for each row execute function public.platform_audit_capture(
  'resource_capacity_version','id','profile_id'
);

create trigger audit_resource_project_commitment_versions
after insert on public.resource_project_commitment_versions
for each row execute function public.platform_audit_capture(
  'resource_project_commitment_version','id','profile_id'
);

create or replace function public.resource_capacity_event_bridge()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  perform public.platform_emit_event(
    new.org_id,
    'resource.capacity_changed',
    new.created_by,
    new.profile_id,
    'resource_capacity_version',
    new.id,
    jsonb_build_object(
      'profile_id',new.profile_id,
      'weekly_minutes',new.weekly_minutes,
      'effective_on',new.effective_on
    ),
    'resource-capacity:'||new.id::text,
    null,
    null,
    new.created_at
  );
  return new;
end;
$$;

revoke all on function public.resource_capacity_event_bridge() from public,anon,authenticated;

create trigger resource_capacity_versions_emit_event
after insert on public.resource_capacity_versions
for each row execute function public.resource_capacity_event_bridge();

create or replace function public.resource_commitment_event_bridge()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  perform public.platform_emit_event(
    new.org_id,
    'resource.commitment_changed',
    new.created_by,
    new.profile_id,
    'resource_project_commitment_version',
    new.id,
    jsonb_build_object(
      'profile_id',new.profile_id,
      'project_id',new.project_id,
      'planned_minutes_per_week',new.planned_minutes_per_week,
      'state',new.state,
      'starts_on',new.starts_on,
      'ends_on',new.ends_on,
      'supersedes_id',new.supersedes_id
    ),
    'resource-commitment:'||new.id::text,
    null,
    null,
    new.created_at
  );
  return new;
end;
$$;

revoke all on function public.resource_commitment_event_bridge() from public,anon,authenticated;

create trigger resource_project_commitment_versions_emit_event
after insert on public.resource_project_commitment_versions
for each row execute function public.resource_commitment_event_bridge();
