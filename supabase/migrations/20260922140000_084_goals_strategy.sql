-- 084 — Stage 4: Goals and Strategy.
-- Establishes the strategic hierarchy above delivery without inventing progress.

insert into public.capability_definitions(capability,label,description,sensitive)
values (
  'strategy.manage',
  'Manage ministry strategy',
  'Create and revise ministry direction, ministry objectives and unit objectives across CEAC.',
  false
)
on conflict(capability) do nothing;

create table public.strategy_nodes(
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete restrict,
  node_type text not null check(node_type in ('ministry_direction','ministry_objective','unit_objective')),
  parent_id uuid references public.strategy_nodes(id) on delete restrict,
  unit_id uuid references public.units(id) on delete restrict,
  name text not null check(length(btrim(name)) between 3 and 180),
  statement text not null check(length(btrim(statement)) between 3 and 2000),
  measurement_kind text not null default 'descriptive'
    check(measurement_kind in ('descriptive','numeric')),
  measure_label text,
  target_value numeric,
  target_unit text,
  current_value numeric,
  starts_on date,
  target_on date,
  status text not null default 'active'
    check(status in ('draft','active','met','closed')),
  owner_profile_id uuid references public.profiles(id) on delete restrict,
  change_reason text not null check(length(btrim(change_reason)) between 3 and 600),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_by uuid not null references public.profiles(id) on delete restrict,
  updated_at timestamptz not null default now(),
  check(target_on is null or starts_on is null or target_on>=starts_on),
  check(
    (measurement_kind='descriptive'
      and target_value is null and target_unit is null and current_value is null)
    or
    (measurement_kind='numeric'
      and target_value is not null
      and target_unit is not null
      and length(btrim(target_unit)) between 1 and 80)
  ),
  check(
    (node_type='ministry_direction' and parent_id is null and unit_id is null)
    or
    (node_type='ministry_objective' and parent_id is not null and unit_id is null)
    or
    (node_type='unit_objective' and parent_id is not null and unit_id is not null)
  )
);

create index strategy_nodes_org_type_idx
  on public.strategy_nodes(org_id,node_type,status,created_at desc);
create index strategy_nodes_parent_idx
  on public.strategy_nodes(parent_id,status);
create index strategy_nodes_unit_idx
  on public.strategy_nodes(unit_id,status)
  where unit_id is not null;

create table public.strategy_node_revisions(
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete restrict,
  strategy_node_id uuid not null references public.strategy_nodes(id) on delete restrict,
  revision integer not null check(revision>0),
  node_type text not null,
  parent_id uuid,
  unit_id uuid,
  name text not null,
  statement text not null,
  measurement_kind text not null,
  measure_label text,
  target_value numeric,
  target_unit text,
  current_value numeric,
  starts_on date,
  target_on date,
  status text not null,
  owner_profile_id uuid,
  change_reason text not null,
  changed_by uuid not null references public.profiles(id) on delete restrict,
  changed_at timestamptz not null default now(),
  unique(strategy_node_id,revision)
);

create index strategy_node_revisions_node_idx
  on public.strategy_node_revisions(strategy_node_id,revision desc);

create table public.strategy_delivery_links(
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete restrict,
  strategy_node_id uuid not null references public.strategy_nodes(id) on delete restrict,
  project_id uuid not null references public.projects(id) on delete restrict,
  status text not null default 'active' check(status in ('active','withdrawn')),
  change_reason text not null check(length(btrim(change_reason)) between 3 and 600),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_by uuid not null references public.profiles(id) on delete restrict,
  updated_at timestamptz not null default now()
);

create unique index strategy_delivery_links_active_uidx
  on public.strategy_delivery_links(strategy_node_id,project_id)
  where status='active';
create index strategy_delivery_links_project_idx
  on public.strategy_delivery_links(project_id,status);

alter table public.strategy_nodes enable row level security;
alter table public.strategy_node_revisions enable row level security;
alter table public.strategy_delivery_links enable row level security;

revoke all on public.strategy_nodes from anon;
revoke all on public.strategy_node_revisions from anon;
revoke all on public.strategy_delivery_links from anon;

revoke delete on public.strategy_nodes from authenticated;
revoke insert,update,delete on public.strategy_node_revisions from authenticated;
revoke delete on public.strategy_delivery_links from authenticated;

grant select,insert,update on public.strategy_nodes to authenticated;
grant select on public.strategy_node_revisions to authenticated;
grant select,insert,update on public.strategy_delivery_links to authenticated;

create policy strategy_nodes_read
on public.strategy_nodes
for select to authenticated
using(
  org_id=public.app_org_id()
  and (
    status<>'draft'
    or public.app_is_exec()
    or public.app_has_capability('strategy.manage',null)
    or (
      node_type='unit_objective'
      and unit_id in (select public.app_managed_units())
    )
  )
);

create policy strategy_nodes_insert
on public.strategy_nodes
for insert to authenticated
with check(
  org_id=public.app_org_id()
  and created_by=auth.uid()
  and updated_by=auth.uid()
  and (
    (
      node_type in ('ministry_direction','ministry_objective')
      and (public.app_is_exec() or public.app_has_capability('strategy.manage',null))
    )
    or
    (
      node_type='unit_objective'
      and (
        public.app_has_capability('strategy.manage',null)
        or unit_id in (select public.app_managed_units())
      )
    )
  )
);

create policy strategy_nodes_update
on public.strategy_nodes
for update to authenticated
using(
  org_id=public.app_org_id()
  and (
    (
      node_type in ('ministry_direction','ministry_objective')
      and (public.app_is_exec() or public.app_has_capability('strategy.manage',null))
    )
    or
    (
      node_type='unit_objective'
      and (
        public.app_has_capability('strategy.manage',null)
        or unit_id in (select public.app_managed_units())
      )
    )
  )
)
with check(
  org_id=public.app_org_id()
  and updated_by=auth.uid()
  and (
    (
      node_type in ('ministry_direction','ministry_objective')
      and (public.app_is_exec() or public.app_has_capability('strategy.manage',null))
    )
    or
    (
      node_type='unit_objective'
      and (
        public.app_has_capability('strategy.manage',null)
        or unit_id in (select public.app_managed_units())
      )
    )
  )
);

create policy strategy_revisions_read
on public.strategy_node_revisions
for select to authenticated
using(
  org_id=public.app_org_id()
  and exists(
    select 1
    from public.strategy_nodes n
    where n.id=strategy_node_id
      and n.org_id=public.app_org_id()
      and (
        public.app_is_exec()
        or public.app_has_capability('strategy.manage',null)
        or (
          n.node_type='unit_objective'
          and n.unit_id in (select public.app_managed_units())
        )
      )
  )
);

create policy strategy_delivery_links_read
on public.strategy_delivery_links
for select to authenticated
using(
  org_id=public.app_org_id()
  and (
    public.app_has_capability('strategy.manage',null)
    or project_id in (select id from public.projects)
  )
);

create policy strategy_delivery_links_insert
on public.strategy_delivery_links
for insert to authenticated
with check(
  org_id=public.app_org_id()
  and created_by=auth.uid()
  and updated_by=auth.uid()
  and exists(
    select 1
    from public.strategy_nodes n
    where n.id=strategy_node_id
      and n.org_id=public.app_org_id()
      and n.node_type='unit_objective'
      and (
        public.app_has_capability('strategy.manage',null)
        or n.unit_id in (select public.app_managed_units())
      )
  )
  and project_id in (select id from public.projects)
);

create policy strategy_delivery_links_update
on public.strategy_delivery_links
for update to authenticated
using(
  org_id=public.app_org_id()
  and exists(
    select 1
    from public.strategy_nodes n
    where n.id=strategy_node_id
      and n.org_id=public.app_org_id()
      and (
        public.app_has_capability('strategy.manage',null)
        or n.unit_id in (select public.app_managed_units())
      )
  )
)
with check(
  org_id=public.app_org_id()
  and updated_by=auth.uid()
  and exists(
    select 1
    from public.strategy_nodes n
    where n.id=strategy_node_id
      and n.org_id=public.app_org_id()
      and (
        public.app_has_capability('strategy.manage',null)
        or n.unit_id in (select public.app_managed_units())
      )
  )
);

create or replace function public.strategy_node_guard()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  v_actor uuid:=auth.uid();
  v_parent_type text;
  v_parent_org uuid;
begin
  if v_actor is null then
    raise exception 'Sign in to change strategy.' using errcode='42501';
  end if;

  if new.org_id is distinct from public.app_org_id() then
    raise exception 'Strategy must belong to your organisation.' using errcode='42501';
  end if;

  if tg_op='INSERT' then
    new.created_by:=v_actor;
    new.updated_by:=v_actor;
    new.created_at:=coalesce(new.created_at,now());
  else
    if old.org_id is distinct from new.org_id
       or old.created_by is distinct from new.created_by
       or old.created_at is distinct from new.created_at then
      raise exception 'Strategy record identity fields are immutable.' using errcode='42501';
    end if;
    new.updated_by:=v_actor;
    new.updated_at:=now();
  end if;

  if length(btrim(coalesce(new.change_reason,'')))<3 then
    raise exception 'A reason is required for every strategy change.';
  end if;

  if new.node_type in ('ministry_direction','ministry_objective') then
    if not (public.app_is_exec() or public.app_has_capability('strategy.manage',null)) then
      raise exception 'You do not have authority to change ministry-level strategy.' using errcode='42501';
    end if;
  elsif new.node_type='unit_objective' then
    if not (
      public.app_has_capability('strategy.manage',null)
      or new.unit_id in (select public.app_managed_units())
    ) then
      raise exception 'You do not manage that unit objective.' using errcode='42501';
    end if;
  end if;

  if new.node_type='ministry_direction' then
    if new.parent_id is not null or new.unit_id is not null then
      raise exception 'A Ministry Direction cannot have a parent or unit.';
    end if;
  else
    select node_type,org_id into v_parent_type,v_parent_org
    from public.strategy_nodes
    where id=new.parent_id;

    if v_parent_type is null or v_parent_org is distinct from new.org_id then
      raise exception 'The strategy parent is not available in this organisation.' using errcode='42501';
    end if;

    if new.node_type='ministry_objective' and v_parent_type<>'ministry_direction' then
      raise exception 'A Ministry Objective must sit under a Ministry Direction.';
    end if;

    if new.node_type='unit_objective' and v_parent_type<>'ministry_objective' then
      raise exception 'A Unit Objective must sit under a Ministry Objective.';
    end if;

    if new.node_type='unit_objective' and not exists(
      select 1 from public.units u where u.id=new.unit_id and u.org_id=new.org_id
    ) then
      raise exception 'That unit does not belong to this organisation.' using errcode='42501';
    end if;
  end if;

  if new.owner_profile_id is not null and not exists(
    select 1 from public.profiles p
    where p.id=new.owner_profile_id and p.org_id=new.org_id
  ) then
    raise exception 'The strategy owner does not belong to this organisation.' using errcode='42501';
  end if;

  return new;
end;
$$;

revoke all on function public.strategy_node_guard() from public,anon,authenticated;

create trigger strategy_nodes_guard
before insert or update on public.strategy_nodes
for each row execute function public.strategy_node_guard();

create or replace function public.strategy_node_revision_capture()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare v_revision integer;
begin
  select coalesce(max(r.revision),0)+1 into v_revision
  from public.strategy_node_revisions r
  where r.strategy_node_id=new.id;

  insert into public.strategy_node_revisions(
    org_id,strategy_node_id,revision,node_type,parent_id,unit_id,name,statement,
    measurement_kind,measure_label,target_value,target_unit,current_value,
    starts_on,target_on,status,owner_profile_id,change_reason,changed_by,changed_at
  ) values (
    new.org_id,new.id,v_revision,new.node_type,new.parent_id,new.unit_id,new.name,new.statement,
    new.measurement_kind,new.measure_label,new.target_value,new.target_unit,new.current_value,
    new.starts_on,new.target_on,new.status,new.owner_profile_id,new.change_reason,new.updated_by,now()
  );
  return new;
end;
$$;

revoke all on function public.strategy_node_revision_capture() from public,anon,authenticated;

create trigger strategy_nodes_revision
after insert or update on public.strategy_nodes
for each row execute function public.strategy_node_revision_capture();

create or replace function public.strategy_delivery_link_guard()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  v_actor uuid:=auth.uid();
  v_unit uuid;
  v_node_org uuid;
  v_project_org uuid;
begin
  if v_actor is null then
    raise exception 'Sign in to change strategy delivery links.' using errcode='42501';
  end if;

  select n.unit_id,n.org_id into v_unit,v_node_org
  from public.strategy_nodes n
  where n.id=new.strategy_node_id and n.node_type='unit_objective';

  select p.org_id into v_project_org
  from public.projects p
  where p.id=new.project_id;

  if v_node_org is null or v_project_org is null
     or v_node_org is distinct from new.org_id
     or v_project_org is distinct from new.org_id
     or new.org_id is distinct from public.app_org_id() then
    raise exception 'Strategy delivery links must stay inside the same organisation.' using errcode='42501';
  end if;

  if not (
    public.app_has_capability('strategy.manage',null)
    or v_unit in (select public.app_managed_units())
  ) then
    raise exception 'You do not have authority to link delivery for that Unit Objective.' using errcode='42501';
  end if;

  if length(btrim(coalesce(new.change_reason,'')))<3 then
    raise exception 'A reason is required for every strategy delivery change.';
  end if;

  if tg_op='INSERT' then
    new.created_by:=v_actor;
    new.updated_by:=v_actor;
  else
    if old.org_id is distinct from new.org_id
       or old.strategy_node_id is distinct from new.strategy_node_id
       or old.project_id is distinct from new.project_id
       or old.created_by is distinct from new.created_by
       or old.created_at is distinct from new.created_at then
      raise exception 'Strategy delivery-link identity is immutable.' using errcode='42501';
    end if;
    if old.status='withdrawn' and new.status<>'withdrawn' then
      raise exception 'A withdrawn delivery link cannot be reactivated. Create a new attributable link instead.';
    end if;
    new.updated_by:=v_actor;
    new.updated_at:=now();
  end if;

  return new;
end;
$$;

revoke all on function public.strategy_delivery_link_guard() from public,anon,authenticated;

create trigger strategy_delivery_links_guard
before insert or update on public.strategy_delivery_links
for each row execute function public.strategy_delivery_link_guard();

create trigger audit_strategy_nodes
after insert or update on public.strategy_nodes
for each row execute function public.platform_audit_capture('strategy_node','id','');

create trigger audit_strategy_delivery_links
after insert or update on public.strategy_delivery_links
for each row execute function public.platform_audit_capture('strategy_delivery_link','id','');
