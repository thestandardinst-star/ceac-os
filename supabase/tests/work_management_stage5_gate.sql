\set ON_ERROR_STOP on

begin;

-- Stage 5 dependency fixtures are provided by scripts/seed-role-fixtures.mjs.

do $stage5_tables$
declare n integer;
begin
  select count(*) into n
  from pg_class c
  join pg_namespace ns on ns.oid=c.relnamespace
  where ns.nspname='public'
    and c.relname in (
      'delivery_groups',
      'delivery_group_projects',
      'project_milestones',
      'project_dependencies',
      'milestone_dependencies',
      'work_dependencies',
      'project_register_items'
    )
    and c.relkind='r'
    and c.relrowsecurity;

  if n<>7 then
    raise exception 'Stage 5 gate failure: expected 7 Stage 5 tables with RLS, found %.',n;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='projects' and column_name='health'
  ) or not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='projects' and column_name='priority'
  ) then
    raise exception 'Stage 5 gate failure: mature project metadata columns are missing.';
  end if;
end
$stage5_tables$;

do $stage5_privileges$
declare t text;
begin
  foreach t in array array[
    'delivery_groups',
    'delivery_group_projects',
    'project_milestones',
    'project_dependencies',
    'milestone_dependencies',
    'work_dependencies',
    'project_register_items'
  ] loop
    if has_table_privilege('anon','public.'||t,'SELECT')
       or has_table_privilege('anon','public.'||t,'INSERT')
       or has_table_privilege('anon','public.'||t,'UPDATE')
       or has_table_privilege('anon','public.'||t,'DELETE') then
      raise exception 'Stage 5 gate failure: anon has privileges on %.',t;
    end if;

    if has_table_privilege('authenticated','public.'||t,'DELETE') then
      raise exception 'Stage 5 gate failure: browser hard-delete is available on %.',t;
    end if;
  end loop;
end
$stage5_privileges$;

-- Ordinary Staff cannot create delivery-management records.
set local role authenticated;
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000001',true);

do $staff_denied$
begin
  begin
    insert into public.delivery_groups(
      org_id,kind,unit_id,name,purpose,status,change_reason,created_by,updated_by
    ) values (
      '10000000-0000-4000-8000-000000000010',
      'programme',
      '20000000-0000-4000-8000-000000000011',
      'Staff delivery programme',
      'Must be rejected.',
      'active',
      'Stage 5 Staff denial probe',
      '31000000-0000-4000-8000-000000000001',
      '31000000-0000-4000-8000-000000000001'
    );
    raise exception 'Stage 5 gate failure: Staff created a Programme.';
  exception when insufficient_privilege then null;
  end;

  begin
    insert into public.project_milestones(
      org_id,project_id,name,status,change_reason,created_by,updated_by
    ) values (
      '10000000-0000-4000-8000-000000000010',
      '25000000-0000-4000-8000-000000000011',
      'Staff milestone','planned','Stage 5 Staff denial probe',
      '31000000-0000-4000-8000-000000000001',
      '31000000-0000-4000-8000-000000000001'
    );
    raise exception 'Stage 5 gate failure: Staff created a milestone.';
  exception when insufficient_privilege then null;
  end;
end
$staff_denied$;

reset role;

-- Unit manager exercises the full Stage 5 operational path.
set local role authenticated;
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000002',true);

do $manager_delivery$
declare
  v_group uuid;
  v_m1 uuid;
  v_m2 uuid;
  v_register uuid;
  v_count integer;
begin
  insert into public.delivery_groups(
    org_id,kind,unit_id,name,purpose,owner_profile_id,starts_on,status,
    change_reason,created_by,updated_by
  ) values (
    '10000000-0000-4000-8000-000000000010',
    'programme',
    '20000000-0000-4000-8000-000000000011',
    'Stage 5 Unit A Programme',
    'Synthetic programme for Stage 5 acceptance.',
    '31000000-0000-4000-8000-000000000002',
    current_date,
    'active',
    'Stage 5 manager programme',
    '31000000-0000-4000-8000-000000000002',
    '31000000-0000-4000-8000-000000000002'
  )
  returning id into v_group;

  insert into public.delivery_group_projects(
    org_id,delivery_group_id,project_id,state,change_reason,created_by,updated_by
  ) values (
    '10000000-0000-4000-8000-000000000010',
    v_group,
    '25000000-0000-4000-8000-000000000011',
    'active',
    'Stage 5 manager project link',
    '31000000-0000-4000-8000-000000000002',
    '31000000-0000-4000-8000-000000000002'
  );

  update public.projects
  set priority='high',
      health='watch',
      sponsor_profile_id='31000000-0000-4000-8000-000000000003',
      delivery_owner_id='31000000-0000-4000-8000-000000000002',
      delivery_change_reason='Stage 5 explicit project management state'
  where id='25000000-0000-4000-8000-000000000011';

  if not exists (
    select 1 from public.projects
    where id='25000000-0000-4000-8000-000000000011'
      and priority='high'
      and health='watch'
      and delivery_updated_by='31000000-0000-4000-8000-000000000002'
  ) then
    raise exception 'Stage 5 gate failure: project delivery metadata did not persist.';
  end if;

  insert into public.project_milestones(
    org_id,project_id,name,description,owner_profile_id,target_on,status,
    change_reason,created_by,updated_by
  ) values (
    '10000000-0000-4000-8000-000000000010',
    '25000000-0000-4000-8000-000000000011',
    'Stage 5 Foundation milestone',
    'First synthetic delivery checkpoint.',
    '31000000-0000-4000-8000-000000000002',
    current_date + 7,
    'in_progress',
    'Stage 5 milestone creation',
    '31000000-0000-4000-8000-000000000002',
    '31000000-0000-4000-8000-000000000002'
  ) returning id into v_m1;

  insert into public.project_milestones(
    org_id,project_id,name,description,owner_profile_id,target_on,status,
    change_reason,created_by,updated_by
  ) values (
    '10000000-0000-4000-8000-000000000010',
    '25000000-0000-4000-8000-000000000011',
    'Stage 5 Launch milestone',
    'Second synthetic delivery checkpoint.',
    '31000000-0000-4000-8000-000000000002',
    current_date + 14,
    'planned',
    'Stage 5 milestone creation',
    '31000000-0000-4000-8000-000000000002',
    '31000000-0000-4000-8000-000000000002'
  ) returning id into v_m2;

  update public.project_milestones
  set status='achieved',
      change_reason='Stage 5 milestone achieved',
      updated_by='31000000-0000-4000-8000-000000000002'
  where id=v_m1;

  if not exists (
    select 1 from public.project_milestones
    where id=v_m1 and status='achieved' and completed_at is not null
  ) then
    raise exception 'Stage 5 gate failure: achieved milestone completion time was not recorded.';
  end if;

  insert into public.project_dependencies(
    org_id,project_id,depends_on_project_id,state,note,change_reason,created_by,updated_by
  ) values (
    '10000000-0000-4000-8000-000000000010',
    '25000000-0000-4000-8000-000000000011',
    '25000000-0000-4000-8000-000000000012',
    'active',
    'Browser project depends on Stage 5 predecessor project.',
    'Stage 5 project dependency',
    '31000000-0000-4000-8000-000000000002',
    '31000000-0000-4000-8000-000000000002'
  );

  insert into public.milestone_dependencies(
    org_id,milestone_id,depends_on_milestone_id,state,note,change_reason,created_by,updated_by
  ) values (
    '10000000-0000-4000-8000-000000000010',
    v_m2,v_m1,'active',
    'Launch follows foundation.',
    'Stage 5 milestone dependency',
    '31000000-0000-4000-8000-000000000002',
    '31000000-0000-4000-8000-000000000002'
  );

  insert into public.work_dependencies(
    org_id,work_item_id,depends_on_work_item_id,state,note,change_reason,created_by,updated_by
  ) values (
    '10000000-0000-4000-8000-000000000010',
    '26000000-0000-4000-8000-000000000012',
    '26000000-0000-4000-8000-000000000011',
    'active',
    'Dependent work follows predecessor.',
    'Stage 5 work dependency',
    '31000000-0000-4000-8000-000000000002',
    '31000000-0000-4000-8000-000000000002'
  );

  insert into public.project_register_items(
    org_id,project_id,kind,title,description,impact,severity,likelihood,
    owner_profile_id,response_plan,target_on,state,change_reason,created_by,updated_by
  ) values (
    '10000000-0000-4000-8000-000000000010',
    '25000000-0000-4000-8000-000000000011',
    'risk',
    'Stage 5 delivery dependency risk',
    'A predecessor delay could affect the launch milestone.',
    'Launch timing may move.',
    'high','medium',
    '31000000-0000-4000-8000-000000000002',
    'Track predecessor weekly and escalate movement.',
    current_date + 10,
    'monitoring',
    'Stage 5 risk recorded',
    '31000000-0000-4000-8000-000000000002',
    '31000000-0000-4000-8000-000000000002'
  ) returning id into v_register;

  update public.project_register_items
  set state='resolved',
      resolution_note='Predecessor completed and launch dependency cleared.',
      change_reason='Stage 5 risk resolved',
      updated_by='31000000-0000-4000-8000-000000000002'
  where id=v_register;

  if not exists (
    select 1 from public.project_register_items
    where id=v_register
      and state='resolved'
      and resolved_by='31000000-0000-4000-8000-000000000002'
      and resolved_at is not null
  ) then
    raise exception 'Stage 5 gate failure: risk resolution history is incomplete.';
  end if;

end
$manager_delivery$;

reset role;

-- Audit evidence is checked as the test owner because manager RLS correctly
-- hides the organisation-wide audit feed from users without audit.view.
do $stage5_audit$
declare v_count integer;
begin
  select count(*) into v_count
  from public.platform_audit_events
  where resource_type in (
    'delivery_group',
    'delivery_group_project',
    'project_delivery_metadata',
    'project_milestone',
    'project_dependency',
    'milestone_dependency',
    'work_dependency',
    'project_register_item'
  );

  if v_count<9 then
    raise exception 'Stage 5 gate failure: expected Stage 5 audit evidence, found % event(s).',v_count;
  end if;
end
$stage5_audit$;

-- Executive can create ministry-level Portfolio without a unit.
set local role authenticated;
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000004',true);

do $exec_portfolio$
declare v_id uuid;
begin
  insert into public.delivery_groups(
    org_id,kind,unit_id,name,purpose,status,change_reason,created_by,updated_by
  ) values (
    '10000000-0000-4000-8000-000000000010',
    'portfolio',
    null,
    'Stage 5 Ministry Portfolio',
    'Synthetic ministry-level delivery portfolio.',
    'active',
    'Stage 5 executive portfolio',
    '31000000-0000-4000-8000-000000000004',
    '31000000-0000-4000-8000-000000000004'
  ) returning id into v_id;

  if v_id is null then
    raise exception 'Stage 5 gate failure: Executive could not create a ministry Portfolio.';
  end if;
end
$exec_portfolio$;

reset role;

rollback;

select 'CEAC OS Stage 5 Work Management 2.0 gate passed' as result;
