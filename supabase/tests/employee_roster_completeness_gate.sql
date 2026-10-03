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

  if has_table_privilege('authenticated','public.employee_roster','SELECT')
     or has_table_privilege('authenticated','public.employee_unit_memberships','SELECT')
     or has_table_privilege('anon','public.employee_roster','SELECT')
     or has_table_privilege('anon','public.employee_unit_memberships','SELECT') then
    raise exception 'Employee roster gate failure: browser role gained direct roster-table reads.';
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
    raise exception 'Employee roster gate failure: Administration roster RPC surface is incomplete.';
  end if;

  if has_function_privilege('anon','public.admin_employee_roster_summary()','EXECUTE')
     or has_function_privilege('anon','public.admin_employee_roster_detail(uuid)','EXECUTE')
     or has_function_privilege('anon','public.admin_employee_roster_save(uuid,text,text,text,text,text,jsonb,text,text,text)','EXECUTE')
     or has_function_privilege('anon','public.admin_employee_link_profile(uuid,uuid,text)','EXECUTE')
     or has_function_privilege('anon','public.admin_employee_set_units(uuid,uuid[],uuid)','EXECUTE') then
    raise exception 'Employee roster gate failure: anon can execute an Administration roster RPC.';
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
end
$model_invariant$;

set local role authenticated;
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000001',true);

do $staff_denied$
begin
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

do $admin_roster$
declare
  v_employee uuid;
  v_unit uuid;
  v_detail jsonb;
  v_summary jsonb;
begin
  v_summary:=public.admin_employee_roster_summary();
  if jsonb_array_length(v_summary)<(select count(*) from public.profiles) then
    raise exception 'Employee roster gate failure: Administration roster omitted linked employees.';
  end if;

  v_employee:=public.admin_employee_roster_save(
    null,
    'Roster only acceptance fixture',
    'Operations support',
    'not_recorded',
    'active',
    'roster_only',
    jsonb_build_array('Acceptance responsibility'),
    'acceptance_gate',
    'roster-only-fixture',
    'No account required'
  );

  select id into v_unit
  from public.units
  where org_id=public.app_org_id() and active
  order by name
  limit 1;

  if v_unit is not null then
    perform public.admin_employee_set_units(v_employee,array[v_unit],v_unit);
  end if;

  v_detail:=public.admin_employee_roster_detail(v_employee);
  if v_detail->'employee'->>'identity_state'<>'roster_only'
     or (v_detail->'employee'->>'profile_id') is not null
     or (v_detail->>'operational_data_available')::boolean then
    raise exception 'Employee roster gate failure: roster-only employee incorrectly requires a profile.';
  end if;

  perform public.admin_employee_roster_save(
    v_employee,
    'Roster only acceptance fixture',
    'Operations support',
    'not_recorded',
    'active',
    'needs_review',
    jsonb_build_array('Acceptance responsibility'),
    'acceptance_gate',
    'roster-only-fixture',
    'Identity review required'
  );

  v_detail:=public.admin_employee_roster_detail(v_employee);
  if v_detail->'employee'->>'identity_state'<>'needs_review' then
    raise exception 'Employee roster gate failure: identity-review employee could not remain visible.';
  end if;

  begin
    perform public.admin_employee_link_profile(
      v_employee,
      '31000000-0000-4000-8000-000000000001',
      'Duplicate-link rejection probe'
    );
    raise exception 'Employee roster gate failure: an already-linked profile was linked twice.';
  exception when insufficient_privilege then null;
  end;
end
$admin_roster$;

reset role;

rollback;

select 'CEAC OS ERC1 employee roster gate passed' as result;
