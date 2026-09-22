\set ON_ERROR_STOP on

begin;

do $workflow_tables$
declare n integer;
begin
  select count(*) into n
  from pg_class c
  join pg_namespace ns on ns.oid=c.relnamespace
  where ns.nspname='public'
    and c.relname in (
      'workflow_definitions','workflow_definition_steps',
      'workflow_runs','workflow_run_steps'
    )
    and c.relkind='r'
    and c.relrowsecurity;
  if n<>4 then
    raise exception 'Workflow gate failure: expected 4 workflow tables with RLS, found %.',n;
  end if;
end
$workflow_tables$;

do $workflow_privileges$
begin
  if has_table_privilege('anon','public.workflow_runs','SELECT')
     or has_table_privilege('anon','public.workflow_run_steps','SELECT') then
    raise exception 'Workflow gate failure: anon can read workflow state.';
  end if;

  if has_table_privilege('authenticated','public.workflow_runs','INSERT')
     or has_table_privilege('authenticated','public.workflow_runs','UPDATE')
     or has_table_privilege('authenticated','public.workflow_runs','DELETE')
     or has_table_privilege('authenticated','public.workflow_run_steps','INSERT')
     or has_table_privilege('authenticated','public.workflow_run_steps','UPDATE')
     or has_table_privilege('authenticated','public.workflow_run_steps','DELETE') then
    raise exception 'Workflow gate failure: authenticated can directly mutate workflow state.';
  end if;

  if has_function_privilege('authenticated','public.workflow_start_for_event()','EXECUTE')
     or has_function_privilege('anon','public.workflow_start_for_event()','EXECUTE') then
    raise exception 'Workflow gate failure: internal workflow starter is browser executable.';
  end if;

  if not has_function_privilege('authenticated','public.complete_workflow_step(uuid,text,text)','EXECUTE')
     or has_function_privilege('anon','public.complete_workflow_step(uuid,text,text)','EXECUTE') then
    raise exception 'Workflow gate failure: reviewed completion RPC privilege is incorrect.';
  end if;
end
$workflow_privileges$;

do $workflow_triggers$
declare n integer;
begin
  if not exists (
    select 1 from pg_trigger t
    join pg_class c on c.oid=t.tgrelid
    join pg_namespace ns on ns.oid=c.relnamespace
    where ns.nspname='public'
      and c.relname='platform_events'
      and t.tgname='platform_events_start_workflows'
      and not t.tgisinternal
  ) then
    raise exception 'Workflow gate failure: event-to-workflow trigger is missing.';
  end if;

  select count(*) into n
  from pg_trigger t
  join pg_class c on c.oid=t.tgrelid
  join pg_namespace ns on ns.oid=c.relnamespace
  where ns.nspname='public'
    and not t.tgisinternal
    and t.tgname in ('audit_workflow_runs','audit_workflow_run_steps');
  if n<>2 then
    raise exception 'Workflow gate failure: workflow audit triggers are incomplete.';
  end if;
end
$workflow_triggers$;

do $workflow_autostart$
declare
  v_org uuid:='10000000-0000-4000-8000-000000000010';
  v_actor uuid:='31000000-0000-4000-8000-000000000003';
  v_subject uuid:='31000000-0000-4000-8000-000000000001';
  v_event uuid;
  v_run uuid;
  v_step uuid;
  v_count integer;
begin
  v_event:=public.platform_emit_event(
    v_org,'employment.changed',v_actor,v_subject,'profile',v_subject,
    '{"change_type":"working_pattern_changed","effective_on":"2026-09-22"}'::jsonb,
    'stage-1e-employment-event',null,null,now()
  );

  select wr.id into v_run
  from public.workflow_runs wr
  join public.workflow_definitions wd on wd.id=wr.workflow_definition_id
  where wr.source_event_id=v_event
    and wd.workflow_key='employment-change-review';

  if v_run is null then
    raise exception 'Workflow gate failure: employment event did not start a workflow.';
  end if;

  select wrs.id into v_step
  from public.workflow_run_steps wrs
  where wrs.workflow_run_id=v_run
    and wrs.state='ready'
    and wrs.required_capability='people.manage';

  if v_step is null then
    raise exception 'Workflow gate failure: first employment workflow step is not ready.';
  end if;

  select count(*) into v_count
  from public.workflow_runs
  where workflow_definition_id=(
    select workflow_definition_id from public.workflow_runs where id=v_run
  )
    and source_event_id=v_event;

  if v_count<>1 then
    raise exception 'Workflow gate failure: source event created % workflow runs instead of 1.',v_count;
  end if;
end
$workflow_autostart$;

-- Staff cannot complete a people.manage workflow step.
set local role authenticated;
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000001',true);

do $workflow_denied$
declare v_step uuid;
begin
  select wrs.id into v_step
  from public.workflow_run_steps wrs
  join public.workflow_runs wr on wr.id=wrs.workflow_run_id
  join public.workflow_definitions wd on wd.id=wr.workflow_definition_id
  where wd.workflow_key='employment-change-review'
    and wrs.state='ready'
  order by wr.started_at desc
  limit 1;

  begin
    perform public.complete_workflow_step(v_step,'reviewed','Staff denial probe');
    raise exception 'Workflow gate failure: Staff completed a people.manage workflow.';
  exception when insufficient_privilege then
    null;
  end;
end
$workflow_denied$;

reset role;

-- Explicit people.manage authority can complete the step.
set local role authenticated;
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000003',true);

do $workflow_complete$
declare
  v_step uuid;
  v_run_id uuid;
  v_run public.workflow_runs;
  v_completed_event_count integer;
begin
  select wrs.id,wrs.workflow_run_id into v_step,v_run_id
  from public.workflow_run_steps wrs
  join public.workflow_runs wr on wr.id=wrs.workflow_run_id
  join public.workflow_definitions wd on wd.id=wr.workflow_definition_id
  where wd.workflow_key='employment-change-review'
    and wrs.state='ready'
  order by wr.started_at desc
  limit 1;

  v_run:=public.complete_workflow_step(v_step,'reviewed','Stage 1E workflow review');

  if v_run.state<>'completed' or v_run.completed_at is null then
    raise exception 'Workflow gate failure: completing the final ready step did not complete the workflow.';
  end if;

  if not exists (
    select 1 from public.workflow_run_steps
    where id=v_step
      and state='completed'
      and completed_by='31000000-0000-4000-8000-000000000003'
      and outcome='reviewed'
  ) then
    raise exception 'Workflow gate failure: completed step history is incomplete.';
  end if;

  select count(*) into v_completed_event_count
  from public.platform_events
  where event_type='workflow.completed'
    and aggregate_type='workflow_run'
    and aggregate_id=v_run_id;

  if v_completed_event_count<>1 then
    raise exception 'Workflow gate failure: completion emitted % workflow.completed events.',v_completed_event_count;
  end if;
end
$workflow_complete$;

reset role;

rollback;

select 'CEAC OS Stage 1E workflow engine gate passed' as result;
