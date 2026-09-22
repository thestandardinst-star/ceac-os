-- 085 — Stage 5: Work Management 2.0.
-- Adds portfolio/programme structure, mature project metadata, milestones,
-- explicit dependencies, risks/issues and factual delivery reporting inputs.

insert into public.capability_definitions(capability,label,description,sensitive)
values (
  'delivery.manage',
  'Manage organisation delivery',
  'Manage programmes, portfolios and delivery metadata across visible CEAC projects.',
  false
)
on conflict(capability) do nothing;

insert into public.capability_grants(
  org_id,profile_id,capability,scope_unit_id,granted_by,grant_reason
)
select p.org_id,p.id,'delivery.manage',null,null,
       'Stage 5 baseline from existing Administration authority.'
from public.profiles p
where p.is_admin and p.active
  and not exists (
    select 1
    from public.capability_grants cg
    where cg.org_id=p.org_id
      and cg.profile_id=p.id
      and cg.capability='delivery.manage'
      and cg.scope_unit_id is null
      and cg.revoked_at is null
  );

-- Existing project identity remains intact. These fields are explicit management
-- states, never algorithmically inferred.
alter table public.projects
  add column if not exists priority text not null default 'normal',
  add column if not exists health text not null default 'on_track',
  add column if not exists sponsor_profile_id uuid references public.profiles(id) on delete set null,
  add column if not exists delivery_owner_id uuid references public.profiles(id) on delete set null,
  add column if not exists delivery_change_reason text,
  add column if not exists delivery_updated_by uuid references public.profiles(id) on delete set null,
  add column if not exists delivery_updated_at timestamptz;

alter table public.projects
  drop constraint if exists projects_priority_check,
  add constraint projects_priority_check
    check(priority in ('low','normal','high','critical')),
  drop constraint if exists projects_health_check,
  add constraint projects_health_check
    check(health in ('on_track','watch','at_risk','blocked'));

-- Explicit organisation-wide delivery authority participates in project
-- visibility without recreating the projects <-> project_units RLS recursion
-- that migration 006 intentionally removed.
create or replace function public.app_visible_projects()
returns setof uuid
language sql
stable
security definer
set search_path=public
as $$
  select p.id
  from public.projects p
  where p.org_id=public.app_org_id()
    and (
      public.app_is_admin()
      or public.app_is_exec()
      or public.app_has_capability('delivery.manage',null)
      or p.lead_unit_id in (
        select m.unit_id
        from public.unit_memberships m
        where m.profile_id=auth.uid()
      )
      or exists (
        select 1
        from public.project_units pu
        where pu.project_id=p.id
          and pu.unit_id in (
            select m.unit_id
            from public.unit_memberships m
            where m.profile_id=auth.uid()
          )
      )
    );
$$;

drop policy if exists projects_read on public.projects;
create policy projects_read on public.projects
for select to authenticated
using (id in (select public.app_visible_projects()));

drop policy if exists projects_write on public.projects;
create policy projects_write on public.projects
for all to authenticated
using (
  org_id=public.app_org_id()
  and (
    lead_unit_id in (select public.app_managed_units())
    or public.app_is_admin()
    or public.app_is_exec()
    or public.app_has_capability('delivery.manage',null)
  )
)
with check (
  org_id=public.app_org_id()
  and (
    lead_unit_id in (select public.app_managed_units())
    or public.app_is_admin()
    or public.app_is_exec()
    or public.app_has_capability('delivery.manage',null)
  )
);

create or replace function public.app_can_manage_delivery_project(p_project_id uuid)
returns boolean
language sql
stable
security invoker
set search_path=public
as $$
  select exists (
    select 1
    from public.projects p
    where p.id=p_project_id
      and p.org_id=public.app_org_id()
      and (
        p.lead_unit_id in (select public.app_managed_units())
        or public.app_is_admin()
        or public.app_is_exec()
        or public.app_has_capability('delivery.manage',null)
      )
  );
$$;

revoke all on function public.app_can_manage_delivery_project(uuid) from public,anon;
grant execute on function public.app_can_manage_delivery_project(uuid) to authenticated,service_role;

create table public.delivery_groups(
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete restrict,
  kind text not null check(kind in ('programme','portfolio')),
  parent_group_id uuid references public.delivery_groups(id) on delete restrict,
  unit_id uuid references public.units(id) on delete restrict,
  strategy_node_id uuid references public.strategy_nodes(id) on delete set null,
  name text not null check(length(btrim(name)) between 3 and 180),
  purpose text check(purpose is null or length(btrim(purpose))<=2000),
  owner_profile_id uuid references public.profiles(id) on delete set null,
  starts_on date,
  ends_on date,
  status text not null default 'active' check(status in ('active','paused','closed')),
  change_reason text not null check(length(btrim(change_reason)) between 3 and 600),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_by uuid not null references public.profiles(id) on delete restrict,
  updated_at timestamptz not null default now(),
  check(ends_on is null or starts_on is null or ends_on>=starts_on)
);

create index delivery_groups_org_idx
  on public.delivery_groups(org_id,status,kind,created_at desc);
create index delivery_groups_unit_idx
  on public.delivery_groups(unit_id,status)
  where unit_id is not null;
create index delivery_groups_parent_idx
  on public.delivery_groups(parent_group_id,status)
  where parent_group_id is not null;

create table public.delivery_group_projects(
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete restrict,
  delivery_group_id uuid not null references public.delivery_groups(id) on delete restrict,
  project_id uuid not null references public.projects(id) on delete restrict,
  state text not null default 'active' check(state in ('active','withdrawn')),
  change_reason text not null check(length(btrim(change_reason)) between 3 and 600),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_by uuid not null references public.profiles(id) on delete restrict,
  updated_at timestamptz not null default now()
);

create unique index delivery_group_projects_active_uidx
  on public.delivery_group_projects(delivery_group_id,project_id)
  where state='active';
create index delivery_group_projects_project_idx
  on public.delivery_group_projects(project_id,state);

create table public.project_milestones(
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete restrict,
  project_id uuid not null references public.projects(id) on delete restrict,
  name text not null check(length(btrim(name)) between 3 and 180),
  description text check(description is null or length(btrim(description))<=2000),
  owner_profile_id uuid references public.profiles(id) on delete set null,
  target_on date,
  status text not null default 'planned'
    check(status in ('planned','in_progress','achieved','missed','cancelled')),
  completed_at timestamptz,
  change_reason text not null check(length(btrim(change_reason)) between 3 and 600),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_by uuid not null references public.profiles(id) on delete restrict,
  updated_at timestamptz not null default now(),
  check((status='achieved' and completed_at is not null) or status<>'achieved')
);

create index project_milestones_project_idx
  on public.project_milestones(project_id,status,target_on);

create table public.project_dependencies(
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete restrict,
  project_id uuid not null references public.projects(id) on delete restrict,
  depends_on_project_id uuid not null references public.projects(id) on delete restrict,
  state text not null default 'active' check(state in ('active','resolved','withdrawn')),
  note text,
  change_reason text not null check(length(btrim(change_reason)) between 3 and 600),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_by uuid not null references public.profiles(id) on delete restrict,
  updated_at timestamptz not null default now(),
  check(project_id<>depends_on_project_id)
);

create unique index project_dependencies_active_uidx
  on public.project_dependencies(project_id,depends_on_project_id)
  where state='active';

create table public.milestone_dependencies(
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete restrict,
  milestone_id uuid not null references public.project_milestones(id) on delete restrict,
  depends_on_milestone_id uuid not null references public.project_milestones(id) on delete restrict,
  state text not null default 'active' check(state in ('active','resolved','withdrawn')),
  note text,
  change_reason text not null check(length(btrim(change_reason)) between 3 and 600),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_by uuid not null references public.profiles(id) on delete restrict,
  updated_at timestamptz not null default now(),
  check(milestone_id<>depends_on_milestone_id)
);

create unique index milestone_dependencies_active_uidx
  on public.milestone_dependencies(milestone_id,depends_on_milestone_id)
  where state='active';

create table public.work_dependencies(
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete restrict,
  work_item_id uuid not null references public.work_items(id) on delete restrict,
  depends_on_work_item_id uuid not null references public.work_items(id) on delete restrict,
  state text not null default 'active' check(state in ('active','resolved','withdrawn')),
  note text,
  change_reason text not null check(length(btrim(change_reason)) between 3 and 600),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_by uuid not null references public.profiles(id) on delete restrict,
  updated_at timestamptz not null default now(),
  check(work_item_id<>depends_on_work_item_id)
);

create unique index work_dependencies_active_uidx
  on public.work_dependencies(work_item_id,depends_on_work_item_id)
  where state='active';

create table public.project_register_items(
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete restrict,
  project_id uuid not null references public.projects(id) on delete restrict,
  kind text not null check(kind in ('risk','issue')),
  title text not null check(length(btrim(title)) between 3 and 180),
  description text not null check(length(btrim(description)) between 3 and 2000),
  impact text,
  severity text not null check(severity in ('low','medium','high','critical')),
  likelihood text check(likelihood in ('low','medium','high')),
  owner_profile_id uuid references public.profiles(id) on delete set null,
  response_plan text,
  target_on date,
  state text not null default 'open'
    check(state in ('open','monitoring','in_progress','accepted','resolved')),
  resolution_note text,
  resolved_by uuid references public.profiles(id) on delete set null,
  resolved_at timestamptz,
  change_reason text not null check(length(btrim(change_reason)) between 3 and 600),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_by uuid not null references public.profiles(id) on delete restrict,
  updated_at timestamptz not null default now(),
  check(
    (kind='risk' and likelihood is not null and state in ('open','monitoring','accepted','resolved'))
    or
    (kind='issue' and likelihood is null and state in ('open','in_progress','resolved'))
  ),
  check(
    (state='resolved' and resolved_by is not null and resolved_at is not null
      and resolution_note is not null and length(btrim(resolution_note))>0)
    or state<>'resolved'
  )
);

create index project_register_items_project_idx
  on public.project_register_items(project_id,state,kind,severity);

alter table public.delivery_groups enable row level security;
alter table public.delivery_group_projects enable row level security;
alter table public.project_milestones enable row level security;
alter table public.project_dependencies enable row level security;
alter table public.milestone_dependencies enable row level security;
alter table public.work_dependencies enable row level security;
alter table public.project_register_items enable row level security;

revoke all on public.delivery_groups from anon;
revoke all on public.delivery_group_projects from anon;
revoke all on public.project_milestones from anon;
revoke all on public.project_dependencies from anon;
revoke all on public.milestone_dependencies from anon;
revoke all on public.work_dependencies from anon;
revoke all on public.project_register_items from anon;

revoke delete on public.delivery_groups from authenticated;
revoke delete on public.delivery_group_projects from authenticated;
revoke delete on public.project_milestones from authenticated;
revoke delete on public.project_dependencies from authenticated;
revoke delete on public.milestone_dependencies from authenticated;
revoke delete on public.work_dependencies from authenticated;
revoke delete on public.project_register_items from authenticated;

grant select,insert,update on public.delivery_groups to authenticated;
grant select,insert,update on public.delivery_group_projects to authenticated;
grant select,insert,update on public.project_milestones to authenticated;
grant select,insert,update on public.project_dependencies to authenticated;
grant select,insert,update on public.milestone_dependencies to authenticated;
grant select,insert,update on public.work_dependencies to authenticated;
grant select,insert,update on public.project_register_items to authenticated;

-- Programmes/Portfolios are organisational operating structures and are visible
-- within the organisation; linked project visibility is still constrained.
create policy delivery_groups_read
on public.delivery_groups
for select to authenticated
using(org_id=public.app_org_id());

create policy delivery_groups_insert
on public.delivery_groups
for insert to authenticated
with check(
  org_id=public.app_org_id()
  and created_by=auth.uid()
  and updated_by=auth.uid()
  and (
    public.app_is_admin()
    or public.app_is_exec()
    or public.app_has_capability('delivery.manage',null)
    or (unit_id is not null and unit_id in (select public.app_managed_units()))
  )
);

create policy delivery_groups_update
on public.delivery_groups
for update to authenticated
using(
  org_id=public.app_org_id()
  and (
    public.app_is_admin()
    or public.app_is_exec()
    or public.app_has_capability('delivery.manage',null)
    or (unit_id is not null and unit_id in (select public.app_managed_units()))
  )
)
with check(
  org_id=public.app_org_id()
  and updated_by=auth.uid()
  and (
    public.app_is_admin()
    or public.app_is_exec()
    or public.app_has_capability('delivery.manage',null)
    or (unit_id is not null and unit_id in (select public.app_managed_units()))
  )
);

create policy delivery_group_projects_read
on public.delivery_group_projects
for select to authenticated
using(
  org_id=public.app_org_id()
  and project_id in (select id from public.projects)
);

create policy delivery_group_projects_insert
on public.delivery_group_projects
for insert to authenticated
with check(
  org_id=public.app_org_id()
  and created_by=auth.uid()
  and updated_by=auth.uid()
  and public.app_can_manage_delivery_project(project_id)
  and exists(
    select 1 from public.delivery_groups g
    where g.id=delivery_group_id
      and g.org_id=public.app_org_id()
      and (
        public.app_is_admin()
        or public.app_is_exec()
        or public.app_has_capability('delivery.manage',null)
        or (g.unit_id is not null and g.unit_id in (select public.app_managed_units()))
      )
  )
);

create policy delivery_group_projects_update
on public.delivery_group_projects
for update to authenticated
using(
  org_id=public.app_org_id()
  and public.app_can_manage_delivery_project(project_id)
  and exists(
    select 1 from public.delivery_groups g
    where g.id=delivery_group_id
      and g.org_id=public.app_org_id()
      and (
        public.app_is_admin()
        or public.app_is_exec()
        or public.app_has_capability('delivery.manage',null)
        or (g.unit_id is not null and g.unit_id in (select public.app_managed_units()))
      )
  )
)
with check(
  org_id=public.app_org_id()
  and updated_by=auth.uid()
  and public.app_can_manage_delivery_project(project_id)
);

create policy project_milestones_read
on public.project_milestones
for select to authenticated
using(org_id=public.app_org_id() and project_id in (select id from public.projects));

create policy project_milestones_insert
on public.project_milestones
for insert to authenticated
with check(
  org_id=public.app_org_id()
  and created_by=auth.uid()
  and updated_by=auth.uid()
  and public.app_can_manage_delivery_project(project_id)
);

create policy project_milestones_update
on public.project_milestones
for update to authenticated
using(org_id=public.app_org_id() and public.app_can_manage_delivery_project(project_id))
with check(
  org_id=public.app_org_id()
  and updated_by=auth.uid()
  and public.app_can_manage_delivery_project(project_id)
);

create policy project_dependencies_read
on public.project_dependencies
for select to authenticated
using(
  org_id=public.app_org_id()
  and project_id in (select id from public.projects)
  and depends_on_project_id in (select id from public.projects)
);

create policy project_dependencies_insert
on public.project_dependencies
for insert to authenticated
with check(
  org_id=public.app_org_id()
  and created_by=auth.uid()
  and updated_by=auth.uid()
  and public.app_can_manage_delivery_project(project_id)
  and depends_on_project_id in (select id from public.projects)
);

create policy project_dependencies_update
on public.project_dependencies
for update to authenticated
using(org_id=public.app_org_id() and public.app_can_manage_delivery_project(project_id))
with check(
  org_id=public.app_org_id()
  and updated_by=auth.uid()
  and public.app_can_manage_delivery_project(project_id)
);

create policy milestone_dependencies_read
on public.milestone_dependencies
for select to authenticated
using(
  org_id=public.app_org_id()
  and milestone_id in (select id from public.project_milestones)
  and depends_on_milestone_id in (select id from public.project_milestones)
);

create policy milestone_dependencies_insert
on public.milestone_dependencies
for insert to authenticated
with check(
  org_id=public.app_org_id()
  and created_by=auth.uid()
  and updated_by=auth.uid()
  and exists(
    select 1 from public.project_milestones m
    where m.id=milestone_id
      and public.app_can_manage_delivery_project(m.project_id)
  )
  and depends_on_milestone_id in (select id from public.project_milestones)
);

create policy milestone_dependencies_update
on public.milestone_dependencies
for update to authenticated
using(
  org_id=public.app_org_id()
  and exists(
    select 1 from public.project_milestones m
    where m.id=milestone_id
      and public.app_can_manage_delivery_project(m.project_id)
  )
)
with check(
  org_id=public.app_org_id()
  and updated_by=auth.uid()
);

create policy work_dependencies_read
on public.work_dependencies
for select to authenticated
using(
  org_id=public.app_org_id()
  and public.app_can_see_item(work_item_id)
  and public.app_can_see_item(depends_on_work_item_id)
);

create policy work_dependencies_insert
on public.work_dependencies
for insert to authenticated
with check(
  org_id=public.app_org_id()
  and created_by=auth.uid()
  and updated_by=auth.uid()
  and public.app_can_see_item(work_item_id)
  and public.app_can_see_item(depends_on_work_item_id)
  and (
    public.app_can_review_item(work_item_id)
    or public.app_is_exec()
    or public.app_has_capability('delivery.manage',null)
  )
);

create policy work_dependencies_update
on public.work_dependencies
for update to authenticated
using(
  org_id=public.app_org_id()
  and public.app_can_see_item(work_item_id)
  and (
    public.app_can_review_item(work_item_id)
    or public.app_is_exec()
    or public.app_has_capability('delivery.manage',null)
  )
)
with check(
  org_id=public.app_org_id()
  and updated_by=auth.uid()
  and public.app_can_see_item(work_item_id)
  and public.app_can_see_item(depends_on_work_item_id)
);

create policy project_register_items_read
on public.project_register_items
for select to authenticated
using(org_id=public.app_org_id() and project_id in (select id from public.projects));

create policy project_register_items_insert
on public.project_register_items
for insert to authenticated
with check(
  org_id=public.app_org_id()
  and created_by=auth.uid()
  and updated_by=auth.uid()
  and public.app_can_manage_delivery_project(project_id)
);

create policy project_register_items_update
on public.project_register_items
for update to authenticated
using(org_id=public.app_org_id() and public.app_can_manage_delivery_project(project_id))
with check(
  org_id=public.app_org_id()
  and updated_by=auth.uid()
  and public.app_can_manage_delivery_project(project_id)
);

create or replace function public.delivery_group_guard()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  v_actor uuid:=auth.uid();
  v_parent_kind text;
  v_parent_org uuid;
begin
  if v_actor is null then
    raise exception 'Sign in to change delivery groups.' using errcode='42501';
  end if;
  if new.org_id is distinct from public.app_org_id() then
    raise exception 'Delivery groups must stay in your organisation.' using errcode='42501';
  end if;

  if tg_op='INSERT' then
    new.created_by:=v_actor;
    new.updated_by:=v_actor;
  else
    if old.org_id is distinct from new.org_id
       or old.created_by is distinct from new.created_by
       or old.created_at is distinct from new.created_at then
      raise exception 'Delivery group identity fields are immutable.' using errcode='42501';
    end if;
    new.updated_by:=v_actor;
    new.updated_at:=now();
  end if;

  if new.unit_id is not null and not exists(
    select 1 from public.units u where u.id=new.unit_id and u.org_id=new.org_id
  ) then
    raise exception 'That delivery-group unit does not belong to this organisation.' using errcode='42501';
  end if;

  if new.owner_profile_id is not null and not exists(
    select 1 from public.profiles p where p.id=new.owner_profile_id and p.org_id=new.org_id
  ) then
    raise exception 'That delivery-group owner does not belong to this organisation.' using errcode='42501';
  end if;

  if new.strategy_node_id is not null and not exists(
    select 1 from public.strategy_nodes n where n.id=new.strategy_node_id and n.org_id=new.org_id
  ) then
    raise exception 'That strategy record does not belong to this organisation.' using errcode='42501';
  end if;

  if new.kind='portfolio' and new.parent_group_id is not null then
    raise exception 'A Portfolio cannot have a parent in Stage 5.';
  end if;

  if new.parent_group_id is not null then
    select g.kind,g.org_id into v_parent_kind,v_parent_org
    from public.delivery_groups g where g.id=new.parent_group_id;
    if v_parent_kind is distinct from 'portfolio' or v_parent_org is distinct from new.org_id then
      raise exception 'A Programme parent must be a Portfolio in the same organisation.';
    end if;
    if new.kind<>'programme' then
      raise exception 'Only a Programme can sit under a Portfolio.';
    end if;
  end if;

  if not (
    public.app_is_admin()
    or public.app_is_exec()
    or public.app_has_capability('delivery.manage',null)
    or (new.unit_id is not null and new.unit_id in (select public.app_managed_units()))
  ) then
    raise exception 'You do not have authority to manage that Programme or Portfolio.' using errcode='42501';
  end if;

  return new;
end;
$$;

revoke all on function public.delivery_group_guard() from public,anon,authenticated;

create trigger delivery_groups_guard
before insert or update on public.delivery_groups
for each row execute function public.delivery_group_guard();

create or replace function public.delivery_group_project_guard()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  v_actor uuid:=auth.uid();
  v_group_org uuid;
  v_project_org uuid;
begin
  if v_actor is null then
    raise exception 'Sign in to change delivery membership.' using errcode='42501';
  end if;

  select org_id into v_group_org from public.delivery_groups where id=new.delivery_group_id;
  select org_id into v_project_org from public.projects where id=new.project_id;

  if v_group_org is null or v_project_org is null
     or v_group_org is distinct from new.org_id
     or v_project_org is distinct from new.org_id
     or new.org_id is distinct from public.app_org_id() then
    raise exception 'Programme/Portfolio project links must stay inside one organisation.' using errcode='42501';
  end if;

  if tg_op='INSERT' then
    new.created_by:=v_actor;
    new.updated_by:=v_actor;
  else
    if old.org_id is distinct from new.org_id
       or old.delivery_group_id is distinct from new.delivery_group_id
       or old.project_id is distinct from new.project_id
       or old.created_by is distinct from new.created_by
       or old.created_at is distinct from new.created_at then
      raise exception 'Delivery membership identity is immutable.' using errcode='42501';
    end if;
    if old.state='withdrawn' and new.state<>'withdrawn' then
      raise exception 'A withdrawn delivery link cannot be reactivated. Create a new link instead.';
    end if;
    new.updated_by:=v_actor;
    new.updated_at:=now();
  end if;
  return new;
end;
$$;

revoke all on function public.delivery_group_project_guard() from public,anon,authenticated;

create trigger delivery_group_projects_guard
before insert or update on public.delivery_group_projects
for each row execute function public.delivery_group_project_guard();

create or replace function public.project_delivery_metadata_guard()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare v_actor uuid:=auth.uid();
begin
  if v_actor is null then return new; end if;

  if new.priority is distinct from old.priority
     or new.health is distinct from old.health
     or new.sponsor_profile_id is distinct from old.sponsor_profile_id
     or new.delivery_owner_id is distinct from old.delivery_owner_id then

    if not public.app_can_manage_delivery_project(new.id) then
      raise exception 'You do not have authority to change delivery metadata for this project.'
        using errcode='42501';
    end if;

    if length(btrim(coalesce(new.delivery_change_reason,'')))<3 then
      raise exception 'A reason is required for project delivery metadata changes.';
    end if;

    if new.sponsor_profile_id is not null and not exists(
      select 1 from public.profiles p where p.id=new.sponsor_profile_id and p.org_id=new.org_id
    ) then
      raise exception 'That project sponsor does not belong to this organisation.' using errcode='42501';
    end if;

    if new.delivery_owner_id is not null and not exists(
      select 1 from public.profiles p where p.id=new.delivery_owner_id and p.org_id=new.org_id
    ) then
      raise exception 'That delivery owner does not belong to this organisation.' using errcode='42501';
    end if;

    new.delivery_updated_by:=v_actor;
    new.delivery_updated_at:=now();
  end if;

  return new;
end;
$$;

revoke all on function public.project_delivery_metadata_guard() from public,anon,authenticated;

create trigger projects_delivery_metadata_guard
before update on public.projects
for each row execute function public.project_delivery_metadata_guard();

create or replace function public.project_milestone_guard()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  v_actor uuid:=auth.uid();
  v_project_org uuid;
begin
  if v_actor is null then
    raise exception 'Sign in to change project milestones.' using errcode='42501';
  end if;
  select org_id into v_project_org from public.projects where id=new.project_id;
  if v_project_org is null or v_project_org is distinct from new.org_id
     or new.org_id is distinct from public.app_org_id() then
    raise exception 'Milestone project must belong to this organisation.' using errcode='42501';
  end if;
  if not public.app_can_manage_delivery_project(new.project_id) then
    raise exception 'You do not have authority to manage milestones for this project.' using errcode='42501';
  end if;
  if new.owner_profile_id is not null and not exists(
    select 1 from public.profiles p where p.id=new.owner_profile_id and p.org_id=new.org_id
  ) then
    raise exception 'That milestone owner does not belong to this organisation.' using errcode='42501';
  end if;

  if tg_op='INSERT' then
    new.created_by:=v_actor;
    new.updated_by:=v_actor;
  else
    if old.org_id is distinct from new.org_id
       or old.project_id is distinct from new.project_id
       or old.created_by is distinct from new.created_by
       or old.created_at is distinct from new.created_at then
      raise exception 'Milestone identity fields are immutable.' using errcode='42501';
    end if;
    new.updated_by:=v_actor;
    new.updated_at:=now();
  end if;

  if new.status='achieved' and old.status is distinct from 'achieved' then
    new.completed_at:=coalesce(new.completed_at,now());
  elsif new.status<>'achieved' then
    new.completed_at:=null;
  end if;

  return new;
end;
$$;

revoke all on function public.project_milestone_guard() from public,anon,authenticated;

create trigger project_milestones_guard
before insert or update on public.project_milestones
for each row execute function public.project_milestone_guard();

create or replace function public.project_dependency_guard()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  v_actor uuid:=auth.uid();
  v_org_a uuid;
  v_org_b uuid;
begin
  if v_actor is null then
    raise exception 'Sign in to change project dependencies.' using errcode='42501';
  end if;
  select org_id into v_org_a from public.projects where id=new.project_id;
  select org_id into v_org_b from public.projects where id=new.depends_on_project_id;
  if new.project_id=new.depends_on_project_id then
    raise exception 'A project cannot depend on itself.';
  end if;
  if v_org_a is null or v_org_b is null
     or v_org_a is distinct from new.org_id
     or v_org_b is distinct from new.org_id
     or new.org_id is distinct from public.app_org_id() then
    raise exception 'Project dependencies must stay inside one organisation.' using errcode='42501';
  end if;
  if not public.app_can_manage_delivery_project(new.project_id) then
    raise exception 'You do not manage the dependent project.' using errcode='42501';
  end if;
  if tg_op='INSERT' then
    new.created_by:=v_actor; new.updated_by:=v_actor;
  else
    if old.org_id is distinct from new.org_id
       or old.project_id is distinct from new.project_id
       or old.depends_on_project_id is distinct from new.depends_on_project_id
       or old.created_by is distinct from new.created_by
       or old.created_at is distinct from new.created_at then
      raise exception 'Project dependency identity is immutable.' using errcode='42501';
    end if;
    if old.state in ('resolved','withdrawn') and new.state='active' then
      raise exception 'A resolved/withdrawn project dependency cannot be reactivated. Create a new dependency.';
    end if;
    new.updated_by:=v_actor; new.updated_at:=now();
  end if;
  return new;
end;
$$;

revoke all on function public.project_dependency_guard() from public,anon,authenticated;

create trigger project_dependencies_guard
before insert or update on public.project_dependencies
for each row execute function public.project_dependency_guard();

create or replace function public.milestone_dependency_guard()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  v_actor uuid:=auth.uid();
  v_project_a uuid;
  v_project_b uuid;
  v_org_a uuid;
  v_org_b uuid;
begin
  if v_actor is null then
    raise exception 'Sign in to change milestone dependencies.' using errcode='42501';
  end if;
  select project_id,org_id into v_project_a,v_org_a
  from public.project_milestones where id=new.milestone_id;
  select project_id,org_id into v_project_b,v_org_b
  from public.project_milestones where id=new.depends_on_milestone_id;
  if new.milestone_id=new.depends_on_milestone_id then
    raise exception 'A milestone cannot depend on itself.';
  end if;
  if v_project_a is null or v_project_b is null
     or v_org_a is distinct from new.org_id
     or v_org_b is distinct from new.org_id
     or new.org_id is distinct from public.app_org_id() then
    raise exception 'Milestone dependencies must stay inside one organisation.' using errcode='42501';
  end if;
  if not public.app_can_manage_delivery_project(v_project_a) then
    raise exception 'You do not manage the dependent milestone project.' using errcode='42501';
  end if;
  if tg_op='INSERT' then
    new.created_by:=v_actor; new.updated_by:=v_actor;
  else
    if old.org_id is distinct from new.org_id
       or old.milestone_id is distinct from new.milestone_id
       or old.depends_on_milestone_id is distinct from new.depends_on_milestone_id
       or old.created_by is distinct from new.created_by
       or old.created_at is distinct from new.created_at then
      raise exception 'Milestone dependency identity is immutable.' using errcode='42501';
    end if;
    if old.state in ('resolved','withdrawn') and new.state='active' then
      raise exception 'A resolved/withdrawn milestone dependency cannot be reactivated.';
    end if;
    new.updated_by:=v_actor; new.updated_at:=now();
  end if;
  return new;
end;
$$;

revoke all on function public.milestone_dependency_guard() from public,anon,authenticated;

create trigger milestone_dependencies_guard
before insert or update on public.milestone_dependencies
for each row execute function public.milestone_dependency_guard();

create or replace function public.work_dependency_guard()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  v_actor uuid:=auth.uid();
  v_org_a uuid;
  v_org_b uuid;
begin
  if v_actor is null then
    raise exception 'Sign in to change work dependencies.' using errcode='42501';
  end if;
  select org_id into v_org_a from public.work_items where id=new.work_item_id;
  select org_id into v_org_b from public.work_items where id=new.depends_on_work_item_id;
  if new.work_item_id=new.depends_on_work_item_id then
    raise exception 'A work item cannot depend on itself.';
  end if;
  if v_org_a is null or v_org_b is null
     or v_org_a is distinct from new.org_id
     or v_org_b is distinct from new.org_id
     or new.org_id is distinct from public.app_org_id() then
    raise exception 'Work dependencies must stay inside one organisation.' using errcode='42501';
  end if;
  if not public.app_can_see_item(new.work_item_id)
     or not public.app_can_see_item(new.depends_on_work_item_id)
     or not (
       public.app_can_review_item(new.work_item_id)
       or public.app_is_exec()
       or public.app_has_capability('delivery.manage',null)
     ) then
    raise exception 'You do not have authority to manage that work dependency.' using errcode='42501';
  end if;
  if tg_op='INSERT' then
    new.created_by:=v_actor; new.updated_by:=v_actor;
  else
    if old.org_id is distinct from new.org_id
       or old.work_item_id is distinct from new.work_item_id
       or old.depends_on_work_item_id is distinct from new.depends_on_work_item_id
       or old.created_by is distinct from new.created_by
       or old.created_at is distinct from new.created_at then
      raise exception 'Work dependency identity is immutable.' using errcode='42501';
    end if;
    if old.state in ('resolved','withdrawn') and new.state='active' then
      raise exception 'A resolved/withdrawn work dependency cannot be reactivated.';
    end if;
    new.updated_by:=v_actor; new.updated_at:=now();
  end if;
  return new;
end;
$$;

revoke all on function public.work_dependency_guard() from public,anon,authenticated;

create trigger work_dependencies_guard
before insert or update on public.work_dependencies
for each row execute function public.work_dependency_guard();

create or replace function public.project_register_item_guard()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  v_actor uuid:=auth.uid();
  v_project_org uuid;
begin
  if v_actor is null then
    raise exception 'Sign in to change the project risk/issue register.' using errcode='42501';
  end if;
  select org_id into v_project_org from public.projects where id=new.project_id;
  if v_project_org is null or v_project_org is distinct from new.org_id
     or new.org_id is distinct from public.app_org_id() then
    raise exception 'Risk/issue project must belong to this organisation.' using errcode='42501';
  end if;
  if not public.app_can_manage_delivery_project(new.project_id) then
    raise exception 'You do not have authority to manage this project register.' using errcode='42501';
  end if;
  if new.owner_profile_id is not null and not exists(
    select 1 from public.profiles p where p.id=new.owner_profile_id and p.org_id=new.org_id
  ) then
    raise exception 'That risk/issue owner does not belong to this organisation.' using errcode='42501';
  end if;

  if tg_op='INSERT' then
    new.created_by:=v_actor; new.updated_by:=v_actor;
  else
    if old.org_id is distinct from new.org_id
       or old.project_id is distinct from new.project_id
       or old.kind is distinct from new.kind
       or old.created_by is distinct from new.created_by
       or old.created_at is distinct from new.created_at then
      raise exception 'Risk/issue identity is immutable.' using errcode='42501';
    end if;
    new.updated_by:=v_actor; new.updated_at:=now();
  end if;

  if new.state='resolved' then
    if length(btrim(coalesce(new.resolution_note,'')))<3 then
      raise exception 'A resolution note is required to resolve a risk or issue.';
    end if;
    new.resolved_by:=coalesce(new.resolved_by,v_actor);
    new.resolved_at:=coalesce(new.resolved_at,now());
  else
    new.resolved_by:=null;
    new.resolved_at:=null;
  end if;

  return new;
end;
$$;

revoke all on function public.project_register_item_guard() from public,anon,authenticated;

create trigger project_register_items_guard
before insert or update on public.project_register_items
for each row execute function public.project_register_item_guard();

-- Ordinary platform audit for every consequential Stage 5 record.
create trigger audit_delivery_groups
after insert or update on public.delivery_groups
for each row execute function public.platform_audit_capture('delivery_group','id','');

create trigger audit_delivery_group_projects
after insert or update on public.delivery_group_projects
for each row execute function public.platform_audit_capture('delivery_group_project','id','');

create trigger audit_project_delivery_metadata
after update of priority,health,sponsor_profile_id,delivery_owner_id on public.projects
for each row execute function public.platform_audit_capture('project_delivery_metadata','id','');

create trigger audit_project_milestones
after insert or update on public.project_milestones
for each row execute function public.platform_audit_capture('project_milestone','id','owner_profile_id');

create trigger audit_project_dependencies
after insert or update on public.project_dependencies
for each row execute function public.platform_audit_capture('project_dependency','id','');

create trigger audit_milestone_dependencies
after insert or update on public.milestone_dependencies
for each row execute function public.platform_audit_capture('milestone_dependency','id','');

create trigger audit_work_dependencies
after insert or update on public.work_dependencies
for each row execute function public.platform_audit_capture('work_dependency','id','');

create trigger audit_project_register_items
after insert or update on public.project_register_items
for each row execute function public.platform_audit_capture('project_register_item','id','owner_profile_id');
