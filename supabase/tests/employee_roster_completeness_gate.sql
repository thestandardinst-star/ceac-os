\set ON_ERROR_STOP on

begin;

do $tables$
declare
  n integer;
begin
  select count(*) into n
  from pg_class c
  join pg_namespace ns on ns.oid=c.relnamespace
  where ns.nspname='public'
    and c.relname in ('employee_roster','employee_unit_memberships')
    and c.relkind='r'
    and c.relrowsecurity;

  if n<>2 then
    raise exception 'Employee roster gate failure: expected two RLS-protected roster tables, found %.',n;
  end if;

  if not has_table_privilege('authenticated','public.employee_roster','SELECT')
     or not has_table_privilege('authenticated','public.employee_unit_memberships','SELECT') then
    raise exception 'Employee roster gate failure: authenticated read path is not available for RLS enforcement.';
  end if;

  if has_table_privilege('anon','public.employee_roster','SELECT')
     or has_table_privilege('anon','public.employee_unit_memberships','SELECT') then
    raise exception 'Employee roster gate failure: anon gained roster-table reads.';
  end if;
end
$tables$;

do $rpc_surface$
begin
  if to_regprocedure('public.admin_employee_roster_summary()') is null
     or to_regprocedure('public.admin_employee_roster_detail(uuid)') is null
     or to_regprocedure('public.admin_employee_roster_save(uuid,text,text,text,text,text,jsonb,text,text,text)') is null
     or to_regprocedure('public.admin_employee_link_profile(uuid,uuid,text)') is null
     or to_regprocedure('public.admin_employee_set_units(uuid,uuid[],uuid)') is null then
    raise exception 'Employee roster gate failure: roster RPC surface is incomplete.';
  end if;

  if has_function_privilege('anon','public.admin_employee_roster_summary()','EXECUTE')
     or has_function_privilege('anon','public.admin_employee_roster_detail(uuid)','EXECUTE') then
    raise exception 'Employee roster gate failure: anon can execute an Administration roster read RPC.';
  end if;

  if has_function_privilege('authenticated','public.admin_employee_roster_save(uuid,text,text,text,text,text,jsonb,text,text,text)','EXECUTE')
     or has_function_privilege('authenticated','public.admin_employee_link_profile(uuid,uuid,text)','EXECUTE')
     or has_function_privilege('authenticated','public.admin_employee_set_units(uuid,uuid[],uuid)','EXECUTE') then
    raise exception 'Employee roster gate failure: browser roles gained direct roster mutation RPC access.';
  end if;

  if not has_function_privilege('service_role','public.admin_employee_roster_save(uuid,text,text,text,text,text,jsonb,text,text,text)','EXECUTE')
     or not has_function_privilege('service_role','public.admin_employee_link_profile(uuid,uuid,text)','EXECUTE')
     or not has_function_privilege('service_role','public.admin_employee_set_units(uuid,uuid[],uuid)','EXECUTE') then
    raise exception 'Employee roster gate failure: controlled service mutation path is incomplete.';
  end if;
end
$rpc_surface$;

do $backfill$
declare
  profile_count integer;
  linked_count integer;
begin
  select count(*) into profile_count from public.profiles;
  select count(*) into linked_count
  from public.employee_roster
  where profile_id is not null and identity_state='linked';

  if linked_count<>profile_count then
    raise exception 'Employee roster gate failure: linked employee backfill % does not equal profile count %.',
      linked_count,profile_count;
  end if;

  if exists(
    select profile_id
    from public.employee_roster
    where profile_id is not null
    group by profile_id
    having count(*)>1
  ) then
    raise exception 'Employee roster gate failure: a profile is linked to more than one employee.';
  end if;
end
$backfill$;

do $model_invariant$
declare
  v_employee uuid;
  v_unit uuid;
begin
  begin
    insert into public.employee_roster(
      org_id,full_name,identity_state,employment_type,employment_status
    ) values (
      '10000000-0000-4000-8000-000000000010',
      'Invalid linked fixture','linked','not_recorded','active'
    );
    raise exception 'Employee roster gate failure: linked employee without profile was accepted.';
  exception when check_violation then null;
  end;

  insert into public.employee_roster(
    org_id,full_name,job_title,employment_type,employment_status,identity_state,
    responsibility_context,source_system,source_row_key,review_note
  ) values (
    '10000000-0000-4000-8000-000000000010',
    'Roster only acceptance fixture',
    'Operations support',
    'not_recorded',
    'active',
    'roster_only',
    jsonb_build_array('Acceptance responsibility'),
    'acceptance_gate',
    'roster-only-fixture',
    'No account required'
  ) returning id into v_employee;

  select id into v_unit
  from public.units
  where org_id='10000000-0000-4000-8000-000000000010'
  order by name
  limit 1;

  if v_unit is not null then
    insert into public.employee_unit_memberships(
      org_id,employee_id,unit_id,is_primary,context_label
    ) values (
      '10000000-0000-4000-8000-000000000010',
      v_employee,v_unit,true,'Acceptance roster membership'
    );
  end if;

  perform set_config('ceac.test.employee_roster',v_employee::text,true);
end
$model_invariant$;

set local role authenticated;
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000001',true);

do $staff_denied$
declare
  n integer;
begin
  select count(*) into n from public.employee_roster;
  if n<>0 then
    raise exception 'Employee roster gate failure: Staff read Administration employee rows through RLS.';
  end if;

  begin
    perform public.admin_employee_roster_summary();
    raise exception 'Employee roster gate failure: Staff listed the Administration employee roster.';
  exception when insufficient_privilege then null;
  end;
end
$staff_denied$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000003',true);

do $admin_read$
declare
  v_employee uuid:=current_setting('ceac.test.employee_roster')::uuid;
  v_detail jsonb;
  v_summary jsonb;
  n integer;
begin
  select count(*) into n from public.employee_roster;
  if n<(select count(*) from public.profiles) then
    raise exception 'Employee roster gate failure: Administration direct RLS read omitted linked employees.';
  end if;

  v_summary:=public.admin_employee_roster_summary();
  if jsonb_array_length(v_summary)<(select count(*) from public.profiles) then
    raise exception 'Employee roster gate failure: Administration roster summary omitted linked employees.';
  end if;

  v_detail:=public.admin_employee_roster_detail(v_employee);
  if v_detail->'employee'->>'identity_state'<>'roster_only'
     or (v_detail->'employee'->>'profile_id') is not null
     or (v_detail->>'operational_data_available')::boolean then
    raise exception 'Employee roster gate failure: roster-only employee incorrectly requires a profile.';
  end if;
end
$admin_read$;

reset role;

rollback;

select 'CEAC OS ERC1 employee roster gate passed' as result;
