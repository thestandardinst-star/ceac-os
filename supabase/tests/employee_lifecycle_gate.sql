\set ON_ERROR_STOP on

begin;

do $lifecycle_tables$
declare n integer;
begin
  select count(*) into n
  from pg_class c
  join pg_namespace ns on ns.oid=c.relnamespace
  where ns.nspname='public'
    and c.relname in ('employee_lifecycle_templates','employee_lifecycle_cases','employee_lifecycle_steps')
    and c.relkind='r'
    and c.relrowsecurity;
  if n<>3 then
    raise exception 'Employee lifecycle gate failure: expected 3 lifecycle tables with RLS, found %.',n;
  end if;

  select count(*) into n from public.employee_lifecycle_templates;
  if n<>8 then
    raise exception 'Employee lifecycle gate failure: expected 8 lifecycle template steps, found %.',n;
  end if;
end
$lifecycle_tables$;

do $lifecycle_privileges$
begin
  if has_table_privilege('anon','public.employee_lifecycle_cases','SELECT')
     or has_table_privilege('anon','public.employee_lifecycle_cases','INSERT')
     or has_table_privilege('anon','public.employee_lifecycle_steps','UPDATE') then
    raise exception 'Employee lifecycle gate failure: anon has lifecycle privileges.';
  end if;

  if has_table_privilege('authenticated','public.employee_lifecycle_cases','UPDATE')
     or has_table_privilege('authenticated','public.employee_lifecycle_cases','DELETE')
     or has_table_privilege('authenticated','public.employee_lifecycle_steps','INSERT')
     or has_table_privilege('authenticated','public.employee_lifecycle_steps','DELETE') then
    raise exception 'Employee lifecycle gate failure: authenticated has direct lifecycle rewrite privileges.';
  end if;

  if has_function_privilege('authenticated','public.employee_lifecycle_case_start()','EXECUTE')
     or has_function_privilege('authenticated','public.employee_lifecycle_step_guard()','EXECUTE')
     or has_function_privilege('anon','public.employee_lifecycle_case_start()','EXECUTE')
     or has_function_privilege('anon','public.employee_lifecycle_step_guard()','EXECUTE') then
    raise exception 'Employee lifecycle gate failure: internal lifecycle trigger function is browser executable.';
  end if;
end
$lifecycle_privileges$;

-- Staff cannot open an offboarding case.
set local role authenticated;
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000001',true);

do $staff_denied$
begin
  begin
    insert into public.employee_lifecycle_cases(
      org_id,profile_id,lifecycle_type,planned_effective_on,reason,state,created_by
    ) values (
      '10000000-0000-4000-8000-000000000010',
      '31000000-0000-4000-8000-000000000006',
      'offboarding',current_date,'Staff denial probe','active',
      '31000000-0000-4000-8000-000000000001'
    );
    raise exception 'Employee lifecycle gate failure: Staff opened a lifecycle case.';
  exception when insufficient_privilege then null;
  end;
end
$staff_denied$;

reset role;

-- People administrator opens and completes offboarding.
set local role authenticated;
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000003',true);

do $offboarding_flow$
declare
  v_case uuid;
  v_step uuid;
  v_pos integer;
  v_state text;
  v_event_count integer;
  v_audit_count integer;
  v_history_count integer;
begin
  insert into public.employee_lifecycle_cases(
    org_id,profile_id,lifecycle_type,planned_effective_on,reason,state,created_by
  ) values (
    '10000000-0000-4000-8000-000000000010',
    '31000000-0000-4000-8000-000000000006',
    'offboarding',current_date,'Stage 2 offboarding gate','active',
    '31000000-0000-4000-8000-000000000003'
  )
  returning id into v_case;

  for v_pos in 1..4 loop
    select id into v_step
    from public.employee_lifecycle_steps
    where lifecycle_case_id=v_case and position=v_pos;

    update public.employee_lifecycle_steps
    set state='completed',
        completed_by='31000000-0000-4000-8000-000000000003',
        completed_at=now(),
        note='Stage 2 gate step '||v_pos
    where id=v_step;

    if v_pos<4 then
      if not exists (
        select 1 from public.employee_lifecycle_steps
        where lifecycle_case_id=v_case and position=v_pos+1 and state='ready'
      ) then
        raise exception 'Employee lifecycle gate failure: step % did not advance to ready.',v_pos+1;
      end if;
    end if;
  end loop;

  select state into v_state
  from public.employee_lifecycle_cases where id=v_case;
  if v_state<>'completed' then
    raise exception 'Employee lifecycle gate failure: final step did not complete the case.';
  end if;

  if exists (
    select 1 from public.profiles
    where id='31000000-0000-4000-8000-000000000006' and active
  ) then
    raise exception 'Employee lifecycle gate failure: offboarding did not deactivate the employee.';
  end if;

  if not exists (
    select 1 from public.employment_records
    where profile_id='31000000-0000-4000-8000-000000000006'
      and employment_status='exited'
      and exited_on=current_date
  ) then
    raise exception 'Employee lifecycle gate failure: offboarding current employment state is incorrect.';
  end if;

  select count(*) into v_history_count
  from public.employment_history
  where profile_id='31000000-0000-4000-8000-000000000006'
    and change_type='exit_recorded'
    and effective_on=current_date
    and reason='Stage 2 offboarding gate';
  if v_history_count<>1 then
    raise exception 'Employee lifecycle gate failure: expected 1 exit history snapshot, found %.',v_history_count;
  end if;

  select count(*) into v_event_count
  from public.platform_events
  where aggregate_type='employee_lifecycle_case'
    and aggregate_id=v_case
    and event_type in ('employee.lifecycle_started','employee.lifecycle_completed');
  if v_event_count<>2 then
    raise exception 'Employee lifecycle gate failure: expected 2 lifecycle events, found %.',v_event_count;
  end if;

  select count(*) into v_audit_count
  from public.platform_audit_events
  where resource_type='employee_lifecycle_case' and resource_id=v_case;
  if v_audit_count<2 then
    raise exception 'Employee lifecycle gate failure: expected lifecycle case audit history.';
  end if;
end
$offboarding_flow$;

reset role;

rollback;

select 'CEAC OS Stage 2 employee lifecycle gate passed' as result;
