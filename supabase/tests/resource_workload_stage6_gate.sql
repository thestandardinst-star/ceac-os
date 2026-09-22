\set ON_ERROR_STOP on

begin;

do $stage6_tables$
declare n integer;
begin
  select count(*) into n
  from pg_class c
  join pg_namespace ns on ns.oid=c.relnamespace
  where ns.nspname='public'
    and c.relname in (
      'resource_capacity_versions',
      'resource_project_commitment_versions'
    )
    and c.relkind='r'
    and c.relrowsecurity;

  if n<>2 then
    raise exception 'Stage 6 gate failure: expected 2 resource tables with RLS, found %.',n;
  end if;

  if not exists (
    select 1 from public.capability_definitions
    where capability='resource.manage'
  ) then
    raise exception 'Stage 6 gate failure: resource.manage capability is missing.';
  end if;
end
$stage6_tables$;

do $stage6_privileges$
begin
  if has_table_privilege('anon','public.resource_capacity_versions','SELECT')
     or has_table_privilege('anon','public.resource_capacity_versions','INSERT')
     or has_table_privilege('anon','public.resource_project_commitment_versions','SELECT')
     or has_table_privilege('anon','public.resource_project_commitment_versions','INSERT') then
    raise exception 'Stage 6 gate failure: anon has resource-planning privileges.';
  end if;

  if has_table_privilege('authenticated','public.resource_capacity_versions','UPDATE')
     or has_table_privilege('authenticated','public.resource_capacity_versions','DELETE')
     or has_table_privilege('authenticated','public.resource_project_commitment_versions','UPDATE')
     or has_table_privilege('authenticated','public.resource_project_commitment_versions','DELETE') then
    raise exception 'Stage 6 gate failure: authenticated can rewrite append-only resource history.';
  end if;
end
$stage6_privileges$;

-- Temporary other-unit project for cross-unit denial.
insert into public.projects(
  id,org_id,kind,lead_unit_id,name,purpose,status,created_by
) values (
  '25000000-0000-4000-8000-000000000099',
  '10000000-0000-4000-8000-000000000010',
  'project',
  '20000000-0000-4000-8000-000000000012',
  'Stage 6 other-unit project',
  'Cross-unit authority probe.',
  'active',
  '31000000-0000-4000-8000-000000000007'
);

-- Staff cannot write team resource planning.
set local role authenticated;
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000001',true);

do $stage6_staff_denied$
begin
  begin
    insert into public.resource_capacity_versions(
      org_id,profile_id,weekly_minutes,effective_on,reason,created_by
    ) values (
      '10000000-0000-4000-8000-000000000010',
      '31000000-0000-4000-8000-000000000001',
      1800,current_date,'Staff write denial probe',
      '31000000-0000-4000-8000-000000000001'
    );
    raise exception 'Stage 6 gate failure: Staff recorded planning capacity.';
  exception when insufficient_privilege then null;
  end;
end
$stage6_staff_denied$;

reset role;

-- Unit Manager can plan only for their unit and manageable projects.
set local role authenticated;
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000002',true);

do $stage6_manager_flow$
declare
  v_capacity uuid;
  v_commitment uuid;
  v_revision uuid;
begin
  insert into public.resource_capacity_versions(
    org_id,profile_id,weekly_minutes,effective_on,reason,created_by
  ) values (
    '10000000-0000-4000-8000-000000000010',
    '31000000-0000-4000-8000-000000000001',
    2100,current_date,'Stage 6 manager planning capacity',
    '31000000-0000-4000-8000-000000000002'
  ) returning id into v_capacity;

  begin
    insert into public.resource_capacity_versions(
      org_id,profile_id,weekly_minutes,effective_on,reason,created_by
    ) values (
      '10000000-0000-4000-8000-000000000010',
      '31000000-0000-4000-8000-000000000005',
      1800,current_date,'Other-unit denial probe',
      '31000000-0000-4000-8000-000000000002'
    );
    raise exception 'Stage 6 gate failure: Manager planned capacity for another unit.';
  exception when insufficient_privilege then null;
  end;

  insert into public.resource_project_commitment_versions(
    org_id,profile_id,project_id,planned_minutes_per_week,
    starts_on,ends_on,state,supersedes_id,reason,created_by
  ) values (
    '10000000-0000-4000-8000-000000000010',
    '31000000-0000-4000-8000-000000000001',
    '25000000-0000-4000-8000-000000000011',
    600,current_date,current_date+30,'active',null,
    'Stage 6 initial project commitment',
    '31000000-0000-4000-8000-000000000002'
  ) returning id into v_commitment;

  insert into public.resource_project_commitment_versions(
    org_id,profile_id,project_id,planned_minutes_per_week,
    starts_on,ends_on,state,supersedes_id,reason,created_by
  ) values (
    '10000000-0000-4000-8000-000000000010',
    '31000000-0000-4000-8000-000000000001',
    '25000000-0000-4000-8000-000000000011',
    720,current_date,current_date+30,'active',v_commitment,
    'Stage 6 revised project commitment',
    '31000000-0000-4000-8000-000000000002'
  ) returning id into v_revision;

  begin
    insert into public.resource_project_commitment_versions(
      org_id,profile_id,project_id,planned_minutes_per_week,
      starts_on,state,reason,created_by
    ) values (
      '10000000-0000-4000-8000-000000000010',
      '31000000-0000-4000-8000-000000000001',
      '25000000-0000-4000-8000-000000000099',
      300,current_date,'active','Other-unit project denial probe',
      '31000000-0000-4000-8000-000000000002'
    );
    raise exception 'Stage 6 gate failure: Manager committed capacity to an unmanaged project.';
  exception when insufficient_privilege then null;
  end;

  begin
    update public.resource_capacity_versions
    set weekly_minutes=2200
    where id=v_capacity;
    raise exception 'Stage 6 gate failure: resource capacity history was rewritten.';
  exception when insufficient_privilege then null;
  end;

  if not exists (
    select 1
    from public.resource_project_commitment_versions
    where id=v_revision and supersedes_id=v_commitment
  ) then
    raise exception 'Stage 6 gate failure: commitment revision did not preserve supersession history.';
  end if;

  perform set_config('ceac.stage6_capacity_id',v_capacity::text,true);
  perform set_config('ceac.stage6_commitment_id',v_commitment::text,true);
  perform set_config('ceac.stage6_revision_id',v_revision::text,true);
end
$stage6_manager_flow$;

reset role;

-- Audit/event evidence is verified outside the Manager RLS boundary.
do $stage6_evidence$
declare
  v_capacity uuid:=nullif(current_setting('ceac.stage6_capacity_id',true),'')::uuid;
  v_commitment uuid:=nullif(current_setting('ceac.stage6_commitment_id',true),'')::uuid;
  v_revision uuid:=nullif(current_setting('ceac.stage6_revision_id',true),'')::uuid;
  v_count integer;
begin
  select count(*) into v_count
  from public.platform_events
  where event_type='resource.capacity_changed'
    and aggregate_id=v_capacity;
  if v_count<>1 then
    raise exception 'Stage 6 gate failure: expected one resource.capacity_changed event, found %.',v_count;
  end if;

  select count(*) into v_count
  from public.platform_events
  where event_type='resource.commitment_changed'
    and aggregate_id in (v_commitment,v_revision);
  if v_count<>2 then
    raise exception 'Stage 6 gate failure: expected two resource commitment events, found %.',v_count;
  end if;

  select count(*) into v_count
  from public.platform_audit_events
  where resource_type='resource_capacity_version'
    and resource_id=v_capacity;
  if v_count<>1 then
    raise exception 'Stage 6 gate failure: capacity audit event is missing.';
  end if;
end
$stage6_evidence$;

-- The person may read their own recorded planning history, but still cannot edit it.
set local role authenticated;
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000001',true);

do $stage6_self_read$
declare n integer;
begin
  select count(*) into n
  from public.resource_capacity_versions
  where profile_id='31000000-0000-4000-8000-000000000001'
    and reason='Stage 6 manager planning capacity';

  if n<>1 then
    raise exception 'Stage 6 gate failure: employee cannot read own planning capacity history.';
  end if;
end
$stage6_self_read$;

reset role;

rollback;

select 'CEAC OS Stage 6 resource and workload gate passed' as result;
