\set ON_ERROR_STOP on

begin;

do $structure$
declare n integer;
begin
  select count(*) into n
  from pg_class c join pg_namespace ns on ns.oid=c.relnamespace
  where ns.nspname='public'
    and c.relname in ('strategy_nodes','strategy_node_revisions','strategy_delivery_links')
    and c.relkind='r' and c.relrowsecurity;
  if n<>3 then
    raise exception 'Stage 4 strategy gate failure: expected 3 RLS strategy tables, found %.',n;
  end if;

  if has_table_privilege('anon','public.strategy_nodes','SELECT')
     or has_table_privilege('anon','public.strategy_nodes','INSERT')
     or has_table_privilege('authenticated','public.strategy_nodes','DELETE')
     or has_table_privilege('authenticated','public.strategy_node_revisions','INSERT')
     or has_table_privilege('authenticated','public.strategy_delivery_links','DELETE') then
    raise exception 'Stage 4 strategy gate failure: unexpected strategy privileges.';
  end if;
end
$structure$;

-- Ordinary Staff cannot author strategy.
set local role authenticated;
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000001',true);

do $staff_denied$
begin
  begin
    insert into public.strategy_nodes(
      org_id,node_type,name,statement,measurement_kind,status,change_reason,created_by,updated_by
    ) values (
      '10000000-0000-4000-8000-000000000010','ministry_direction',
      'Staff strategy denial','Must not be created','descriptive','active',
      'Staff denial probe','31000000-0000-4000-8000-000000000001','31000000-0000-4000-8000-000000000001'
    );
    raise exception 'Stage 4 strategy gate failure: Staff created ministry strategy.';
  exception when insufficient_privilege then null;
  end;
end
$staff_denied$;

reset role;

-- Administration fixture has the explicit strategy.manage capability.
set local role authenticated;
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000003',true);

do $ministry_strategy$
declare
  v_direction uuid;
  v_ministry uuid;
begin
  insert into public.strategy_nodes(
    org_id,node_type,name,statement,measurement_kind,status,change_reason,created_by,updated_by
  ) values (
    '10000000-0000-4000-8000-000000000010','ministry_direction',
    'Reach and strengthen people',
    'Reach more people while strengthening the ministry systems that serve them.',
    'descriptive','active','Stage 4 ministry direction fixture',
    '31000000-0000-4000-8000-000000000003','31000000-0000-4000-8000-000000000003'
  )
  returning id into v_direction;

  insert into public.strategy_nodes(
    org_id,node_type,parent_id,name,statement,measurement_kind,status,change_reason,created_by,updated_by
  ) values (
    '10000000-0000-4000-8000-000000000010','ministry_objective',v_direction,
    'Strengthen weekly ministry delivery',
    'Make weekly ministry delivery more reliable across participating units.',
    'descriptive','active','Stage 4 ministry objective fixture',
    '31000000-0000-4000-8000-000000000003','31000000-0000-4000-8000-000000000003'
  )
  returning id into v_ministry;

  insert into public.strategy_nodes(
    org_id,node_type,name,statement,measurement_kind,status,change_reason,created_by,updated_by
  ) values (
    '10000000-0000-4000-8000-000000000010','ministry_direction',
    'Stage 4 hidden draft','Draft strategy must not be visible to ordinary Staff.',
    'descriptive','draft','Stage 4 draft visibility fixture',
    '31000000-0000-4000-8000-000000000003','31000000-0000-4000-8000-000000000003'
  );

  perform set_config('ceac.stage4_ministry_objective',v_ministry::text,true);
end
$ministry_strategy$;

reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000001',true);

do $draft_visibility$
begin
  if exists(
    select 1 from public.strategy_nodes
    where name='Stage 4 hidden draft'
  ) then
    raise exception 'Stage 4 strategy gate failure: ordinary Staff can read draft ministry strategy.';
  end if;
end
$draft_visibility$;

reset role;

-- Unit A manager can author its Unit Objective and link a Unit A project.
set local role authenticated;
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000002',true);

do $unit_strategy$
declare
  v_parent uuid:=current_setting('ceac.stage4_ministry_objective')::uuid;
  v_unit_objective uuid;
  v_project uuid;
begin
  insert into public.strategy_nodes(
    org_id,node_type,parent_id,unit_id,name,statement,measurement_kind,measure_label,
    target_value,target_unit,current_value,status,change_reason,created_by,updated_by
  ) values (
    '10000000-0000-4000-8000-000000000010','unit_objective',v_parent,
    '20000000-0000-4000-8000-000000000011',
    'Complete weekly production readiness',
    'Record completed production-readiness outcomes for the agreed weekly schedule.',
    'numeric','Completed readiness outcomes',12,'outcomes',3,'active',
    'Stage 4 Unit A objective fixture',
    '31000000-0000-4000-8000-000000000002','31000000-0000-4000-8000-000000000002'
  )
  returning id into v_unit_objective;

  update public.strategy_nodes
  set current_value=5,
      change_reason='Stage 4 factual result update',
      updated_by='31000000-0000-4000-8000-000000000002'
  where id=v_unit_objective;

  begin
    insert into public.strategy_nodes(
      org_id,node_type,parent_id,unit_id,name,statement,measurement_kind,target_value,target_unit,
      status,change_reason,created_by,updated_by
    ) values (
      '10000000-0000-4000-8000-000000000010','unit_objective',v_parent,
      '20000000-0000-4000-8000-000000000012',
      'Other unit objective','Manager A must not author this objective.',
      'numeric',1,'outcome','active','Cross-unit denial probe',
      '31000000-0000-4000-8000-000000000002','31000000-0000-4000-8000-000000000002'
    );
    raise exception 'Stage 4 strategy gate failure: Manager authored another unit objective.';
  exception when insufficient_privilege then null;
  end;

  begin
    insert into public.strategy_nodes(
      org_id,node_type,parent_id,unit_id,name,statement,measurement_kind,target_value,target_unit,
      current_value,status,change_reason,created_by,updated_by
    ) values (
      '10000000-0000-4000-8000-000000000010','unit_objective',v_parent,
      '20000000-0000-4000-8000-000000000011',
      'Invalid descriptive objective','Descriptive goals must stay descriptive.',
      'descriptive',100,'percent',50,'active','Invalid descriptive goal probe',
      '31000000-0000-4000-8000-000000000002','31000000-0000-4000-8000-000000000002'
    );
    raise exception 'Stage 4 strategy gate failure: descriptive goal accepted numeric progress.';
  exception when check_violation then null;
  end;

  insert into public.projects(
    org_id,kind,lead_unit_id,name,purpose,status,created_by
  ) values (
    '10000000-0000-4000-8000-000000000010','project',
    '20000000-0000-4000-8000-000000000011',
    'Stage 4 delivery fixture','Synthetic strategy delivery link project.','active',
    '31000000-0000-4000-8000-000000000002'
  )
  returning id into v_project;

  insert into public.strategy_delivery_links(
    org_id,strategy_node_id,project_id,status,change_reason,created_by,updated_by
  ) values (
    '10000000-0000-4000-8000-000000000010',v_unit_objective,v_project,'active',
    'Stage 4 project supports this Unit Objective',
    '31000000-0000-4000-8000-000000000002','31000000-0000-4000-8000-000000000002'
  );

  perform set_config('ceac.stage4_unit_objective',v_unit_objective::text,true);
end
$unit_strategy$;

reset role;

do $history_and_audit$
declare
  v_node uuid:=current_setting('ceac.stage4_unit_objective')::uuid;
  v_revisions integer;
  v_audit integer;
begin
  select count(*) into v_revisions
  from public.strategy_node_revisions
  where strategy_node_id=v_node;

  if v_revisions<>2 then
    raise exception 'Stage 4 strategy gate failure: expected 2 Unit Objective revisions, found %.',v_revisions;
  end if;

  if exists(
    select 1 from public.strategy_node_revisions
    where strategy_node_id=v_node
      and measurement_kind='descriptive'
      and (target_value is not null or current_value is not null)
  ) then
    raise exception 'Stage 4 strategy gate failure: descriptive revision contains invented numeric progress.';
  end if;

  select count(*) into v_audit
  from public.platform_audit_events
  where resource_type in ('strategy_node','strategy_delivery_link')
    and org_id='10000000-0000-4000-8000-000000000010';

  if v_audit<5 then
    raise exception 'Stage 4 strategy gate failure: strategy audit history is incomplete.';
  end if;
end
$history_and_audit$;

rollback;

select 'CEAC OS Stage 4 Goals and Strategy gate passed' as result;
