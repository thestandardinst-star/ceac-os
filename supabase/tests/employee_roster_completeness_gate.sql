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
     or to_regprocedure('public.admin_employee_roster_detail(uuid)') is null then
    raise exception 'Employee roster gate failure: roster read RPC surface is incomplete.';
  end if;

  if has_function_privilege('anon','public.admin_employee_roster_summary()','EXECUTE')
     or has_function_privilege('anon','public.admin_employee_roster_detail(uuid)','EXECUTE') then
    raise exception 'Employee roster gate failure: anon can execute an Administration roster read RPC.';
  end if;

end
$rpc_surface$;

do $auth_is_not_employment$
declare
  n integer;
begin
  select count(*) into n from public.employee_roster;
  if n<>0 then
    raise exception 'Employee roster gate failure: auth profiles were automatically treated as employees.';
  end if;
end
$auth_is_not_employment$;

do $model_invariant$
declare
  v_linked uuid;
  v_roster uuid;
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
    org_id,profile_id,full_name,employment_type,employment_status,identity_state,
    source_system,source_row_key
  ) values (
    '10000000-0000-4000-8000-000000000010',
    '31000000-0000-4000-8000-000000000001',
    'Linked acceptance fixture',
    'not_recorded','active','linked',
    'acceptance_gate','linked-fixture'
  ) returning id into v_linked;

  begin
    insert into public.employee_roster(
      org_id,profile_id,full_name,employment_type,employment_status,identity_state
    ) values (
      '10000000-0000-4000-8000-000000000010',
      '31000000-0000-4000-8000-000000000001',
      'Duplicate linked fixture',
      'not_recorded','active','linked'
    );
    raise exception 'Employee roster gate failure: one profile linked to multiple employees.';
  exception when unique_violation then null;
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
  ) returning id into v_roster;

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
      v_roster,v_unit,false,'Acceptance roster membership'
    );
  end if;

  perform set_config('ceac.test.employee_roster',v_roster::text,true);
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
  if n<>2 then
    raise exception 'Employee roster gate failure: Administration should see both linked and roster-only employees, found %.',n;
  end if;

  v_summary:=public.admin_employee_roster_summary();
  if jsonb_array_length(v_summary)<>2 then
    raise exception 'Employee roster gate failure: Administration roster summary did not return both employee states.';
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
