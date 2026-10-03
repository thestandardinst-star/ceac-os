\set ON_ERROR_STOP on

begin;

do $schema$
declare n integer;
begin
  select count(*) into n
  from information_schema.columns
  where table_schema='hr_private'
    and table_name in ('identifiers','employment_terms','compensation_history','payment_details','documents')
    and column_name='employee_id';
  if n<>5 then
    raise exception 'Employee protected-HR gate failure: expected employee_id on five protected tables, found %.',n;
  end if;

  if to_regprocedure('public.hr_employee_protected_summary(uuid)') is null
     or to_regprocedure('public.hr_employee_protected_record(uuid,text,jsonb,uuid,text)') is null then
    raise exception 'Employee protected-HR gate failure: employee-subject RPC surface is incomplete.';
  end if;

  if has_function_privilege('anon','public.hr_employee_protected_summary(uuid)','EXECUTE')
     or has_function_privilege('anon','public.hr_employee_protected_record(uuid,text,jsonb,uuid,text)','EXECUTE') then
    raise exception 'Employee protected-HR gate failure: anon can execute employee protected-HR RPCs.';
  end if;

  if has_schema_privilege('authenticated','hr_private','USAGE') then
    raise exception 'Employee protected-HR gate failure: authenticated gained hr_private schema usage.';
  end if;
end
$schema$;

do $fixture$
declare v_employee uuid;
begin
  insert into public.employee_roster(
    org_id,full_name,source_display_name,source_position,employment_type,
    employment_status,identity_state,source_system,source_row_key
  ) values (
    '10000000-0000-4000-8000-000000000010',
    'Roster-only HR acceptance fixture',
    'Roster-only HR acceptance fixture',
    'Operations Officer',
    'not_recorded','active','roster_only',
    'acceptance_gate','protected-hr-fixture'
  ) returning id into v_employee;

  perform set_config('ceac.test.employee_protected_hr',v_employee::text,true);
end
$fixture$;

set local role authenticated;
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000001',true);

do $staff_denied$
declare v_employee uuid:=current_setting('ceac.test.employee_protected_hr')::uuid;
begin
  begin
    perform public.hr_employee_protected_summary(v_employee);
    raise exception 'Employee protected-HR gate failure: Staff viewed protected HR.';
  exception when insufficient_privilege then null;
  end;

  begin
    perform public.hr_employee_protected_record(
      v_employee,'compensation',
      jsonb_build_object(
        'amount_minor',100000,
        'currency','GHS',
        'basis_label','Monthly salary',
        'effective_on','2026-10-01'
      ),
      null,'Invalid Staff write probe'
    );
    raise exception 'Employee protected-HR gate failure: Staff wrote protected HR.';
  exception when insufficient_privilege then null;
  end;
end
$staff_denied$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000003',true);

do $admin_records_roster_only$
declare
  v_employee uuid:=current_setting('ceac.test.employee_protected_hr')::uuid;
  v_comp uuid;
  v_payment uuid;
  v_summary jsonb;
begin
  if not public.app_has_capability('hr_private.access',null) then
    raise exception 'Employee protected-HR gate failure: Administration fixture lacks hr_private.access.';
  end if;

  v_comp:=public.hr_employee_protected_record(
    v_employee,'compensation',
    jsonb_build_object(
      'amount_minor',250000,
      'currency','GHS',
      'basis_label','Monthly salary',
      'effective_on','2026-10-01'
    ),
    null,'Roster-only compensation fixture'
  );

  v_payment:=public.hr_employee_protected_record(
    v_employee,'payment_detail',
    jsonb_build_object(
      'payment_type','bank',
      'provider_name','Fixture Bank',
      'account_name','Roster Only Fixture',
      'account_reference','0000000000'
    ),
    null,'Roster-only payment fixture'
  );

  if v_comp is null or v_payment is null then
    raise exception 'Employee protected-HR gate failure: roster-only protected records were not created.';
  end if;

  v_summary:=public.hr_employee_protected_summary(v_employee);
  if jsonb_array_length(v_summary->'compensation')<>1
     or jsonb_array_length(v_summary->'payment_details')<>1 then
    raise exception 'Employee protected-HR gate failure: roster-only protected summary omitted records.';
  end if;

  if not exists(
    select 1 from hr_private.compensation_history
    where id=v_comp and employee_id=v_employee and profile_id is null
  ) then
    raise exception 'Employee protected-HR gate failure: compensation still requires profile_id.';
  end if;

  if not exists(
    select 1 from hr_private.payment_details
    where id=v_payment and employee_id=v_employee and profile_id is null
  ) then
    raise exception 'Employee protected-HR gate failure: payment detail still requires profile_id.';
  end if;
end
$admin_records_roster_only$;

reset role;

do $audit$
declare
  v_employee uuid:=current_setting('ceac.test.employee_protected_hr')::uuid;
  n integer;
begin
  select count(*) into n
  from hr_private.audit_events
  where subject_employee_id=v_employee
    and action in ('protected_hr_recorded','protected_hr_viewed');

  if n<3 then
    raise exception 'Employee protected-HR gate failure: employee-level protected audit evidence is incomplete.';
  end if;
end
$audit$;

rollback;

select 'CEAC OS ERC4 employee protected-HR gate passed' as result;
