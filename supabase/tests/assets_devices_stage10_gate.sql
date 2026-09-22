\set ON_ERROR_STOP on

begin;

do $stage10_tables$
declare n integer;
begin
  select count(*) into n
  from pg_class c
  join pg_namespace ns on ns.oid=c.relnamespace
  where ns.nspname='public'
    and c.relname in ('asset_items','asset_assignment_events','asset_lifecycle_events')
    and c.relkind='r'
    and c.relrowsecurity;

  if n<>3 then
    raise exception 'Stage 10 gate failure: expected 3 Stage 10 RLS tables, found %.',n;
  end if;

  if not exists(select 1 from public.capability_definitions where capability='asset.manage') then
    raise exception 'Stage 10 gate failure: asset.manage capability is missing.';
  end if;
end
$stage10_tables$;

do $stage10_privileges$
begin
  if has_table_privilege('anon','public.asset_items','SELECT')
     or has_table_privilege('anon','public.asset_assignment_events','SELECT')
     or has_table_privilege('anon','public.asset_lifecycle_events','SELECT') then
    raise exception 'Stage 10 gate failure: anon can read asset data.';
  end if;

  if has_table_privilege('authenticated','public.asset_items','INSERT')
     or has_table_privilege('authenticated','public.asset_items','UPDATE')
     or has_table_privilege('authenticated','public.asset_assignment_events','INSERT')
     or has_table_privilege('authenticated','public.asset_lifecycle_events','INSERT') then
    raise exception 'Stage 10 gate failure: browser can bypass reviewed asset RPCs.';
  end if;
end
$stage10_privileges$;

set local role authenticated;
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000003',true);

do $stage10_admin_create_assign$
declare
  v_asset uuid;
  v_assign uuid;
begin
  if not public.app_has_capability('asset.manage',null) then
    raise exception 'Stage 10 gate failure: Admin fixture lacks asset.manage.';
  end if;

  v_asset:=public.asset_record_item(
    null,
    'CEAC-ST10-001',
    'Laptop',
    'Lenovo',
    'ThinkPad T14',
    'ST10-SERIAL-001',
    current_date-30,
    'Acceptance Vendor',
    5000,
    'GHS',
    current_date+335,
    '20000000-0000-4000-8000-000000000011',
    'Administration store',
    'New',
    'Stage 10 acceptance asset'
  );

  v_assign:=public.asset_assign(
    v_asset,
    '31000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000011',
    'Staff custody',
    current_date+90,
    'Issued in good condition',
    'Stage 10 acceptance assignment'
  );

  if not exists(
    select 1 from public.asset_items
    where id=v_asset
      and asset_code='CEAC-ST10-001'
      and category='Laptop'
      and serial_number='ST10-SERIAL-001'
      and purchase_cost=5000
      and purchase_currency='GHS'
      and current_status='assigned'
      and current_assignee_profile_id='31000000-0000-4000-8000-000000000001'
  ) then
    raise exception 'Stage 10 gate failure: asset creation/assignment did not persist.';
  end if;

  if not exists(
    select 1 from public.asset_assignment_events
    where id=v_assign and asset_id=v_asset and action='assigned'
  ) then
    raise exception 'Stage 10 gate failure: assignment history missing.';
  end if;

  perform set_config('ceac.stage10_asset_id',v_asset::text,true);
end
$stage10_admin_create_assign$;

reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000001',true);

do $stage10_staff_own$
declare
  v_asset uuid:=nullif(current_setting('ceac.stage10_asset_id',true),'')::uuid;
  n integer;
begin
  select count(*) into n from public.asset_items where id=v_asset;
  if n<>1 then
    raise exception 'Stage 10 gate failure: assigned Staff cannot read own asset.';
  end if;

  select count(*) into n
  from public.asset_assignment_events
  where asset_id=v_asset and to_profile_id=auth.uid();
  if n<1 then
    raise exception 'Stage 10 gate failure: Staff cannot read own custody history.';
  end if;

  begin
    perform public.asset_return(
      v_asset,'Staff custody','Attempted unauthorised return','Stage 10 denial check'
    );
    raise exception 'Stage 10 gate failure: Staff mutated asset without asset.manage.';
  exception when insufficient_privilege then null;
  end;
end
$stage10_staff_own$;

reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000002',true);

do $stage10_manager_unit$
declare
  v_asset uuid:=nullif(current_setting('ceac.stage10_asset_id',true),'')::uuid;
  n integer;
begin
  select count(*) into n from public.asset_items where id=v_asset;
  if n<>1 then
    raise exception 'Stage 10 gate failure: unit Manager cannot read unit asset.';
  end if;

  begin
    perform public.asset_lifecycle_action(
      v_asset,'warranty_claimed','Manager must not record this','Stage 10 denial check'
    );
    raise exception 'Stage 10 gate failure: Manager mutated asset without asset.manage.';
  exception when insufficient_privilege then null;
  end;
end
$stage10_manager_unit$;

reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000005',true);

do $stage10_other_staff$
declare
  v_asset uuid:=nullif(current_setting('ceac.stage10_asset_id',true),'')::uuid;
  n integer;
begin
  select count(*) into n from public.asset_items where id=v_asset;
  if n<>0 then
    raise exception 'Stage 10 gate failure: unrelated Staff can read another person/unit asset.';
  end if;

  select count(*) into n from public.asset_assignment_events where asset_id=v_asset;
  if n<>0 then
    raise exception 'Stage 10 gate failure: unrelated Staff can read custody history.';
  end if;
end
$stage10_other_staff$;

reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000003',true);

do $stage10_admin_lifecycle$
declare
  v_asset uuid:=nullif(current_setting('ceac.stage10_asset_id',true),'')::uuid;
begin
  perform public.asset_assign(
    v_asset,
    '31000000-0000-4000-8000-000000000006',
    '20000000-0000-4000-8000-000000000011',
    'Same unit custody',
    current_date+120,
    'Transferred in good condition',
    'Stage 10 acceptance transfer'
  );

  perform public.asset_return(
    v_asset,
    'Administration store',
    'Returned in good condition',
    'Stage 10 acceptance return'
  );

  perform public.asset_lifecycle_action(
    v_asset,'repair_started','Battery inspection','Stage 10 acceptance repair start'
  );

  perform public.asset_lifecycle_action(
    v_asset,'warranty_claimed','Warranty case AC-10','Stage 10 acceptance warranty'
  );

  perform public.asset_lifecycle_action(
    v_asset,'repair_completed','Battery replaced','Stage 10 acceptance repair complete'
  );

  perform public.asset_lifecycle_action(
    v_asset,'retired','Lifecycle complete','Stage 10 acceptance retirement'
  );

  if not exists(
    select 1 from public.asset_items
    where id=v_asset
      and current_status='retired'
      and current_assignee_profile_id is null
      and purchase_cost=5000
      and purchase_currency='GHS'
  ) then
    raise exception 'Stage 10 gate failure: final retirement state/facts are incorrect.';
  end if;

  if (select count(*) from public.asset_assignment_events where asset_id=v_asset)<>3 then
    raise exception 'Stage 10 gate failure: expected assign + transfer + return custody history.';
  end if;

  if (select count(*) from public.asset_lifecycle_events where asset_id=v_asset)<>4 then
    raise exception 'Stage 10 gate failure: expected repair/warranty/retirement lifecycle history.';
  end if;
end
$stage10_admin_lifecycle$;

reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000001',true);

do $stage10_staff_history_after_transfer$
declare
  v_asset uuid:=nullif(current_setting('ceac.stage10_asset_id',true),'')::uuid;
  n integer;
begin
  select count(*) into n from public.asset_items where id=v_asset;
  if n<>0 then
    raise exception 'Stage 10 gate failure: former custodian can still read retired/current asset record.';
  end if;

  select count(*) into n
  from public.asset_assignment_events
  where asset_id=v_asset
    and (from_profile_id=auth.uid() or to_profile_id=auth.uid());
  if n<2 then
    raise exception 'Stage 10 gate failure: former custodian lost own custody history.';
  end if;
end
$stage10_staff_history_after_transfer$;

reset role;

do $stage10_evidence$
declare n integer;
begin
  select count(*) into n
  from public.platform_events
  where event_type in (
    'asset.created','asset.assigned','asset.transferred','asset.returned',
    'asset.repair_started','asset.repair_completed','asset.warranty_claimed','asset.retired'
  );
  if n<8 then
    raise exception 'Stage 10 gate failure: expected asset semantic events, found %.',n;
  end if;

  if exists(
    select 1 from information_schema.columns
    where table_schema='public'
      and table_name in ('asset_items','asset_assignment_events','asset_lifecycle_events')
      and (
        column_name ilike '%remote_wipe%'
        or column_name ilike '%mdm%'
        or column_name ilike '%encryption_enforce%'
        or column_name ilike '%endpoint_config%'
        or column_name ilike '%employee_score%'
        or column_name ilike '%performance_score%'
      )
  ) then
    raise exception 'Stage 10 gate failure: prohibited MDM/scoring field exists.';
  end if;

  if not exists(
    select 1 from pg_trigger t
    join pg_class c on c.oid=t.tgrelid
    join pg_namespace ns on ns.oid=c.relnamespace
    where ns.nspname='public' and c.relname='asset_items'
      and t.tgname='audit_asset_items' and not t.tgisinternal
  ) then
    raise exception 'Stage 10 gate failure: asset audit trigger missing.';
  end if;
end
$stage10_evidence$;

rollback;

select 'CEAC OS Stage 10 Assets & Devices gate passed' as result;
