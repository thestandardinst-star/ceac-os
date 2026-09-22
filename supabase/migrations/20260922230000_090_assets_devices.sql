-- 090 — Stage 10 Assets & Devices.
-- Native CEAC asset inventory, custody and service lifecycle. No OS-level MDM.

insert into public.capability_definitions(capability,label,description,sensitive)
values (
  'asset.manage',
  'Manage assets',
  'Create and administer CEAC asset/device inventory, custody and lifecycle records.',
  true
)
on conflict(capability) do nothing;

insert into public.capability_grants(
  org_id,profile_id,capability,scope_unit_id,granted_by,grant_reason
)
select p.org_id,p.id,'asset.manage',null,null,
       'Stage 10 baseline from existing active Administration asset authority.'
from public.profiles p
where p.is_admin and p.active
on conflict do nothing;

create table public.asset_items(
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete restrict,
  asset_code text not null check(length(btrim(asset_code)) between 2 and 80),
  category text not null check(length(btrim(category)) between 2 and 80),
  manufacturer text,
  model text,
  serial_number text,
  purchase_date date,
  purchase_vendor text,
  purchase_cost numeric check(purchase_cost is null or purchase_cost>=0),
  purchase_currency text check(purchase_currency is null or purchase_currency ~ '^[A-Z]{3}$'),
  warranty_expires_on date,
  current_status text not null default 'available'
    check(current_status in ('available','assigned','repair','retired')),
  current_assignee_profile_id uuid references public.profiles(id) on delete restrict,
  current_unit_id uuid references public.units(id) on delete restrict,
  current_location text,
  current_condition_note text,
  notes text,
  created_by uuid not null references public.profiles(id) on delete restrict,
  updated_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id,asset_code),
  check(
    (purchase_cost is null and purchase_currency is null)
    or (purchase_cost is not null and purchase_currency is not null)
  ),
  check(
    current_status='assigned'
    or current_assignee_profile_id is null
  )
);

create unique index asset_items_serial_uidx
  on public.asset_items(org_id,serial_number)
  where serial_number is not null and btrim(serial_number)<>'';

create index asset_items_org_status_idx
  on public.asset_items(org_id,current_status,asset_code);
create index asset_items_assignee_idx
  on public.asset_items(current_assignee_profile_id,current_status);
create index asset_items_unit_idx
  on public.asset_items(current_unit_id,current_status);

create table public.asset_assignment_events(
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete restrict,
  asset_id uuid not null references public.asset_items(id) on delete restrict,
  action text not null check(action in ('assigned','transferred','returned')),
  from_profile_id uuid references public.profiles(id) on delete restrict,
  from_unit_id uuid references public.units(id) on delete restrict,
  from_location text,
  to_profile_id uuid references public.profiles(id) on delete restrict,
  to_unit_id uuid references public.units(id) on delete restrict,
  to_location text,
  expected_return_on date,
  condition_note text,
  reason text not null check(length(btrim(reason)) between 3 and 1000),
  actor_id uuid not null references public.profiles(id) on delete restrict,
  occurred_at timestamptz not null default now()
);

create index asset_assignment_asset_idx
  on public.asset_assignment_events(asset_id,occurred_at desc);
create index asset_assignment_profile_idx
  on public.asset_assignment_events(org_id,to_profile_id,occurred_at desc);
create index asset_assignment_unit_idx
  on public.asset_assignment_events(org_id,to_unit_id,occurred_at desc);

create table public.asset_lifecycle_events(
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete restrict,
  asset_id uuid not null references public.asset_items(id) on delete restrict,
  action text not null check(action in (
    'repair_started','repair_completed','warranty_claimed','retired'
  )),
  from_status text not null check(from_status in ('available','assigned','repair','retired')),
  to_status text not null check(to_status in ('available','assigned','repair','retired')),
  note text,
  reason text not null check(length(btrim(reason)) between 3 and 1000),
  actor_id uuid not null references public.profiles(id) on delete restrict,
  occurred_at timestamptz not null default now()
);

create index asset_lifecycle_asset_idx
  on public.asset_lifecycle_events(asset_id,occurred_at desc);

alter table public.asset_items enable row level security;
alter table public.asset_assignment_events enable row level security;
alter table public.asset_lifecycle_events enable row level security;

revoke all on public.asset_items from anon;
revoke all on public.asset_assignment_events from anon;
revoke all on public.asset_lifecycle_events from anon;

revoke insert,update,delete on public.asset_items from authenticated;
revoke insert,update,delete on public.asset_assignment_events from authenticated;
revoke insert,update,delete on public.asset_lifecycle_events from authenticated;

grant select on public.asset_items to authenticated;
grant select on public.asset_assignment_events to authenticated;
grant select on public.asset_lifecycle_events to authenticated;

create policy asset_items_read
on public.asset_items
for select
to authenticated
using(
  org_id=public.app_org_id()
  and (
    public.app_has_capability('asset.manage',null)
    or current_assignee_profile_id=auth.uid()
    or current_unit_id in (select public.app_managed_units())
  )
);

create policy asset_assignment_events_read
on public.asset_assignment_events
for select
to authenticated
using(
  org_id=public.app_org_id()
  and (
    public.app_has_capability('asset.manage',null)
    or from_profile_id=auth.uid()
    or to_profile_id=auth.uid()
    or from_unit_id in (select public.app_managed_units())
    or to_unit_id in (select public.app_managed_units())
  )
);

create policy asset_lifecycle_events_read
on public.asset_lifecycle_events
for select
to authenticated
using(
  org_id=public.app_org_id()
  and exists(
    select 1
    from public.asset_items a
    where a.id=asset_lifecycle_events.asset_id
      and a.org_id=asset_lifecycle_events.org_id
      and (
        public.app_has_capability('asset.manage',null)
        or a.current_assignee_profile_id=auth.uid()
        or a.current_unit_id in (select public.app_managed_units())
      )
  )
);

create or replace function public.asset_record_item(
  p_asset_id uuid,
  p_asset_code text,
  p_category text,
  p_manufacturer text,
  p_model text,
  p_serial_number text,
  p_purchase_date date,
  p_purchase_vendor text,
  p_purchase_cost numeric,
  p_purchase_currency text,
  p_warranty_expires_on date,
  p_unit_id uuid,
  p_location text,
  p_condition_note text,
  p_notes text
)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  v_org uuid:=public.app_org_id();
  v_actor uuid:=auth.uid();
  v_id uuid:=coalesce(p_asset_id,gen_random_uuid());
  v_existing public.asset_items;
  v_event_type text;
begin
  if v_actor is null or not public.app_has_capability('asset.manage',null) then
    raise exception 'You do not have authority to manage assets.' using errcode='42501';
  end if;

  if length(btrim(coalesce(p_asset_code,'')))<2
     or length(btrim(coalesce(p_category,'')))<2 then
    raise exception 'Asset code and category are required.';
  end if;

  if p_purchase_cost is not null and p_purchase_cost<0 then
    raise exception 'Purchase cost cannot be negative.';
  end if;

  if (p_purchase_cost is null) is distinct from (nullif(btrim(coalesce(p_purchase_currency,'')),'') is null) then
    raise exception 'Purchase amount and three-letter currency must be recorded together.';
  end if;

  if p_purchase_currency is not null
     and upper(btrim(p_purchase_currency)) !~ '^[A-Z]{3}$' then
    raise exception 'Purchase currency must be a three-letter code.';
  end if;

  if p_warranty_expires_on is not null
     and p_purchase_date is not null
     and p_warranty_expires_on<p_purchase_date then
    raise exception 'Warranty expiry cannot be before purchase date.';
  end if;

  if p_unit_id is not null and not exists(
    select 1 from public.units u
    where u.id=p_unit_id and u.org_id=v_org and u.active
  ) then
    raise exception 'Choose an active unit in your organisation.' using errcode='42501';
  end if;

  if p_asset_id is null then
    insert into public.asset_items(
      id,org_id,asset_code,category,manufacturer,model,serial_number,
      purchase_date,purchase_vendor,purchase_cost,purchase_currency,
      warranty_expires_on,current_status,current_unit_id,current_location,
      current_condition_note,notes,created_by,updated_by
    ) values (
      v_id,v_org,btrim(p_asset_code),btrim(p_category),
      nullif(btrim(coalesce(p_manufacturer,'')),''),
      nullif(btrim(coalesce(p_model,'')),''),
      nullif(btrim(coalesce(p_serial_number,'')),''),
      p_purchase_date,nullif(btrim(coalesce(p_purchase_vendor,'')),''),
      p_purchase_cost,
      case when p_purchase_cost is null then null else upper(btrim(p_purchase_currency)) end,
      p_warranty_expires_on,'available',p_unit_id,
      nullif(btrim(coalesce(p_location,'')),''),
      nullif(btrim(coalesce(p_condition_note,'')),''),
      nullif(btrim(coalesce(p_notes,'')),''),
      v_actor,v_actor
    );
    v_event_type:='asset.created';
  else
    select * into v_existing
    from public.asset_items
    where id=p_asset_id and org_id=v_org
    for update;

    if v_existing.id is null then
      raise exception 'Asset not found.' using errcode='42501';
    end if;

    update public.asset_items
    set asset_code=btrim(p_asset_code),
        category=btrim(p_category),
        manufacturer=nullif(btrim(coalesce(p_manufacturer,'')),''),
        model=nullif(btrim(coalesce(p_model,'')),''),
        serial_number=nullif(btrim(coalesce(p_serial_number,'')),''),
        purchase_date=p_purchase_date,
        purchase_vendor=nullif(btrim(coalesce(p_purchase_vendor,'')),''),
        purchase_cost=p_purchase_cost,
        purchase_currency=case when p_purchase_cost is null then null else upper(btrim(p_purchase_currency)) end,
        warranty_expires_on=p_warranty_expires_on,
        current_unit_id=case
          when current_status='available' and current_assignee_profile_id is null then p_unit_id
          else current_unit_id
        end,
        current_location=case
          when current_status='available' and current_assignee_profile_id is null
          then nullif(btrim(coalesce(p_location,'')),'')
          else current_location
        end,
        current_condition_note=case
          when current_status='available' and current_assignee_profile_id is null
          then nullif(btrim(coalesce(p_condition_note,'')),'')
          else current_condition_note
        end,
        notes=nullif(btrim(coalesce(p_notes,'')),''),
        updated_by=v_actor,
        updated_at=now()
    where id=v_existing.id;

    v_event_type:='asset.updated';
  end if;

  perform public.platform_emit_event(
    v_org,v_event_type,v_actor,null,
    'asset',v_id,
    jsonb_build_object('asset_code',btrim(p_asset_code),'category',btrim(p_category)),
    v_event_type||':'||v_id::text||':'||extract(epoch from clock_timestamp())::text,
    null,null,now()
  );

  return v_id;
end;
$$;

revoke all on function public.asset_record_item(
  uuid,text,text,text,text,text,date,text,numeric,text,date,uuid,text,text,text
) from public,anon;
grant execute on function public.asset_record_item(
  uuid,text,text,text,text,text,date,text,numeric,text,date,uuid,text,text,text
) to authenticated,service_role;

create or replace function public.asset_assign(
  p_asset_id uuid,
  p_profile_id uuid,
  p_unit_id uuid,
  p_location text,
  p_expected_return_on date,
  p_condition_note text,
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  v_org uuid:=public.app_org_id();
  v_actor uuid:=auth.uid();
  v_asset public.asset_items;
  v_target_unit uuid:=p_unit_id;
  v_action text;
  v_event_id uuid;
begin
  if v_actor is null or not public.app_has_capability('asset.manage',null) then
    raise exception 'You do not have authority to assign assets.' using errcode='42501';
  end if;

  if p_profile_id is null and p_unit_id is null then
    raise exception 'Choose a person, a unit, or both for custody.';
  end if;

  if length(btrim(coalesce(p_reason,'')))<3 then
    raise exception 'A reason is required.';
  end if;

  select * into v_asset
  from public.asset_items
  where id=p_asset_id and org_id=v_org
  for update;
  if v_asset.id is null then raise exception 'Asset not found.' using errcode='42501'; end if;

  if v_asset.current_status in ('repair','retired') then
    raise exception 'This asset cannot be assigned from its current state.';
  end if;

  if p_profile_id is not null then
    if not exists(
      select 1 from public.profiles p
      where p.id=p_profile_id and p.org_id=v_org and p.active
    ) then
      raise exception 'Choose an active person in your organisation.' using errcode='42501';
    end if;

    if v_target_unit is null then
      select er.unit_id into v_target_unit
      from public.employment_records er
      where er.profile_id=p_profile_id and er.org_id=v_org;
    end if;
  end if;

  if v_target_unit is not null and not exists(
    select 1 from public.units u
    where u.id=v_target_unit and u.org_id=v_org and u.active
  ) then
    raise exception 'Choose an active unit in your organisation.' using errcode='42501';
  end if;

  if p_profile_id is not null and v_target_unit is not null and not exists(
    select 1 from public.employment_records er
    where er.profile_id=p_profile_id and er.org_id=v_org and er.unit_id=v_target_unit
  ) then
    raise exception 'That person is not currently recorded in the selected unit.';
  end if;

  v_action:=case when v_asset.current_status='assigned' then 'transferred' else 'assigned' end;

  insert into public.asset_assignment_events(
    org_id,asset_id,action,
    from_profile_id,from_unit_id,from_location,
    to_profile_id,to_unit_id,to_location,
    expected_return_on,condition_note,reason,actor_id
  ) values (
    v_org,v_asset.id,v_action,
    v_asset.current_assignee_profile_id,v_asset.current_unit_id,v_asset.current_location,
    p_profile_id,v_target_unit,nullif(btrim(coalesce(p_location,'')),''),
    p_expected_return_on,nullif(btrim(coalesce(p_condition_note,'')),''),
    btrim(p_reason),v_actor
  )
  returning id into v_event_id;

  update public.asset_items
  set current_status='assigned',
      current_assignee_profile_id=p_profile_id,
      current_unit_id=v_target_unit,
      current_location=nullif(btrim(coalesce(p_location,'')),''),
      current_condition_note=nullif(btrim(coalesce(p_condition_note,'')),''),
      updated_by=v_actor,
      updated_at=now()
  where id=v_asset.id;

  perform public.platform_emit_event(
    v_org,
    case when v_action='transferred' then 'asset.transferred' else 'asset.assigned' end,
    v_actor,p_profile_id,'asset',v_asset.id,
    jsonb_build_object(
      'assignment_event_id',v_event_id,
      'from_profile_id',v_asset.current_assignee_profile_id,
      'from_unit_id',v_asset.current_unit_id,
      'to_profile_id',p_profile_id,
      'to_unit_id',v_target_unit,
      'expected_return_on',p_expected_return_on
    ),
    'asset-assignment:'||v_event_id::text,null,null,now()
  );

  return v_event_id;
end;
$$;

revoke all on function public.asset_assign(uuid,uuid,uuid,text,date,text,text) from public,anon;
grant execute on function public.asset_assign(uuid,uuid,uuid,text,date,text,text)
to authenticated,service_role;

create or replace function public.asset_return(
  p_asset_id uuid,
  p_location text,
  p_condition_note text,
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  v_org uuid:=public.app_org_id();
  v_actor uuid:=auth.uid();
  v_asset public.asset_items;
  v_event_id uuid;
begin
  if v_actor is null or not public.app_has_capability('asset.manage',null) then
    raise exception 'You do not have authority to return assets.' using errcode='42501';
  end if;
  if length(btrim(coalesce(p_reason,'')))<3 then raise exception 'A reason is required.'; end if;

  select * into v_asset
  from public.asset_items
  where id=p_asset_id and org_id=v_org
  for update;
  if v_asset.id is null then raise exception 'Asset not found.' using errcode='42501'; end if;
  if v_asset.current_status<>'assigned' then
    raise exception 'Only an assigned asset can be returned.';
  end if;

  insert into public.asset_assignment_events(
    org_id,asset_id,action,
    from_profile_id,from_unit_id,from_location,
    to_profile_id,to_unit_id,to_location,
    condition_note,reason,actor_id
  ) values (
    v_org,v_asset.id,'returned',
    v_asset.current_assignee_profile_id,v_asset.current_unit_id,v_asset.current_location,
    null,v_asset.current_unit_id,nullif(btrim(coalesce(p_location,'')),''),
    nullif(btrim(coalesce(p_condition_note,'')),''),
    btrim(p_reason),v_actor
  )
  returning id into v_event_id;

  update public.asset_items
  set current_status='available',
      current_assignee_profile_id=null,
      current_location=nullif(btrim(coalesce(p_location,'')),''),
      current_condition_note=nullif(btrim(coalesce(p_condition_note,'')),''),
      updated_by=v_actor,
      updated_at=now()
  where id=v_asset.id;

  perform public.platform_emit_event(
    v_org,'asset.returned',v_actor,v_asset.current_assignee_profile_id,
    'asset',v_asset.id,
    jsonb_build_object('assignment_event_id',v_event_id,'unit_id',v_asset.current_unit_id),
    'asset-return:'||v_event_id::text,null,null,now()
  );

  return v_event_id;
end;
$$;

revoke all on function public.asset_return(uuid,text,text,text) from public,anon;
grant execute on function public.asset_return(uuid,text,text,text)
to authenticated,service_role;

create or replace function public.asset_lifecycle_action(
  p_asset_id uuid,
  p_action text,
  p_note text,
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  v_org uuid:=public.app_org_id();
  v_actor uuid:=auth.uid();
  v_asset public.asset_items;
  v_to text;
  v_event_id uuid;
  v_event_type text;
begin
  if v_actor is null or not public.app_has_capability('asset.manage',null) then
    raise exception 'You do not have authority to manage asset lifecycle.' using errcode='42501';
  end if;
  if p_action not in ('repair_started','repair_completed','warranty_claimed','retired') then
    raise exception 'Choose a supported asset lifecycle action.';
  end if;
  if length(btrim(coalesce(p_reason,'')))<3 then raise exception 'A reason is required.'; end if;

  select * into v_asset
  from public.asset_items
  where id=p_asset_id and org_id=v_org
  for update;
  if v_asset.id is null then raise exception 'Asset not found.' using errcode='42501'; end if;

  if p_action='repair_started' then
    if v_asset.current_status<>'available' then
      raise exception 'Return the asset before starting a repair.';
    end if;
    v_to:='repair';
    v_event_type:='asset.repair_started';
  elsif p_action='repair_completed' then
    if v_asset.current_status<>'repair' then
      raise exception 'Only an asset in repair can be marked repair complete.';
    end if;
    v_to:='available';
    v_event_type:='asset.repair_completed';
  elsif p_action='warranty_claimed' then
    if v_asset.current_status='retired' then
      raise exception 'A retired asset cannot start a warranty claim.';
    end if;
    v_to:=v_asset.current_status;
    v_event_type:='asset.warranty_claimed';
  elsif p_action='retired' then
    if v_asset.current_status='assigned' then
      raise exception 'Return the asset before retirement.';
    end if;
    if v_asset.current_status='retired' then
      raise exception 'This asset is already retired.';
    end if;
    v_to:='retired';
    v_event_type:='asset.retired';
  end if;

  insert into public.asset_lifecycle_events(
    org_id,asset_id,action,from_status,to_status,note,reason,actor_id
  ) values (
    v_org,v_asset.id,p_action,v_asset.current_status,v_to,
    nullif(btrim(coalesce(p_note,'')),''),
    btrim(p_reason),v_actor
  )
  returning id into v_event_id;

  if v_to is distinct from v_asset.current_status then
    update public.asset_items
    set current_status=v_to,
        current_assignee_profile_id=case when v_to='retired' then null else current_assignee_profile_id end,
        updated_by=v_actor,
        updated_at=now()
    where id=v_asset.id;
  else
    update public.asset_items
    set updated_by=v_actor,updated_at=now()
    where id=v_asset.id;
  end if;

  perform public.platform_emit_event(
    v_org,v_event_type,v_actor,v_asset.current_assignee_profile_id,
    'asset',v_asset.id,
    jsonb_build_object(
      'lifecycle_event_id',v_event_id,
      'from_status',v_asset.current_status,
      'to_status',v_to
    ),
    v_event_type||':'||v_event_id::text,null,null,now()
  );

  return v_event_id;
end;
$$;

revoke all on function public.asset_lifecycle_action(uuid,text,text,text) from public,anon;
grant execute on function public.asset_lifecycle_action(uuid,text,text,text)
to authenticated,service_role;

create trigger audit_asset_items
after insert or update on public.asset_items
for each row execute function public.platform_audit_capture('asset','id','current_assignee_profile_id');

create trigger audit_asset_assignment_events
after insert on public.asset_assignment_events
for each row execute function public.platform_audit_capture('asset_assignment','id','to_profile_id');

create trigger audit_asset_lifecycle_events
after insert on public.asset_lifecycle_events
for each row execute function public.platform_audit_capture('asset_lifecycle','id','');

insert into public.platform_event_definitions(
  event_type,label,description,source_domain,payload_version
) values
  ('asset.created','Asset created','A CEAC asset/device record was created.','assets',1),
  ('asset.updated','Asset updated','A CEAC asset/device factual record was updated.','assets',1),
  ('asset.assigned','Asset assigned','Custody of an asset/device was assigned.','assets',1),
  ('asset.transferred','Asset transferred','Custody of an asset/device was transferred.','assets',1),
  ('asset.returned','Asset returned','An assigned asset/device was returned.','assets',1),
  ('asset.repair_started','Asset repair started','A returned asset/device entered repair.','assets',1),
  ('asset.repair_completed','Asset repair completed','An asset/device left repair and became available.','assets',1),
  ('asset.warranty_claimed','Asset warranty claim recorded','A warranty claim was recorded for an asset/device.','assets',1),
  ('asset.retired','Asset retired','An asset/device was retired from active inventory.','assets',1)
on conflict(event_type) do nothing;
