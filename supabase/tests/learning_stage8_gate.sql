\set ON_ERROR_STOP on

begin;

do $stage8_structure$
declare n integer;
begin
  select count(*) into n
  from pg_class c
  join pg_namespace ns on ns.oid=c.relnamespace
  where ns.nspname='public'
    and c.relname in (
      'learning_courses','learning_modules','learning_resources',
      'learning_assignment_rules','learning_assignments',
      'learning_module_progress','learning_progress_history'
    )
    and c.relkind='r'
    and c.relrowsecurity;

  if n<>7 then
    raise exception 'Stage 8 gate failure: expected 7 Stage 8 RLS tables, found %.',n;
  end if;

  if not exists(
    select 1 from public.capability_definitions where capability='learning.manage'
  ) then
    raise exception 'Stage 8 gate failure: learning.manage capability is missing.';
  end if;

  if has_table_privilege('anon','public.learning_courses','SELECT')
     or has_table_privilege('anon','public.learning_assignments','SELECT')
     or has_table_privilege('anon','public.training_records','SELECT') then
    raise exception 'Stage 8 gate failure: anonymous learning access exists.';
  end if;

  if has_table_privilege('authenticated','public.learning_assignments','UPDATE')
     or has_table_privilege('authenticated','public.learning_module_progress','INSERT')
     or has_table_privilege('authenticated','public.learning_progress_history','INSERT')
     or has_table_privilege('authenticated','public.training_records','UPDATE') then
    raise exception 'Stage 8 gate failure: learning progress or completion evidence can bypass reviewed correction paths.';
  end if;
end
$stage8_structure$;

-- Administration creates and publishes one real course through RLS-authorised authoring.
set local role authenticated;
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000003',true);

do $stage8_admin_build$
declare
  v_course uuid;
  v_module uuid;
  v_rule_person uuid;
  v_rule_unit uuid;
  v_rule_role uuid;
  v_rule_onboarding uuid;
begin
  if not public.app_has_capability('learning.manage',null) then
    raise exception 'Stage 8 gate failure: baseline Administration learning capability is missing.';
  end if;

  insert into public.learning_courses(
    org_id,title,summary,estimated_minutes,state,created_by,updated_by
  ) values (
    '10000000-0000-4000-8000-000000000010',
    'Stage 8 acceptance learning',
    'A factual Stage 8 learning course used to prove catalogue, assignment and completion.',
    45,'draft',
    '31000000-0000-4000-8000-000000000003',
    '31000000-0000-4000-8000-000000000003'
  ) returning id into v_course;

  insert into public.learning_modules(
    org_id,course_id,position,title,summary,required,estimated_minutes,created_by,updated_by
  ) values (
    '10000000-0000-4000-8000-000000000010',
    v_course,1,'Stage 8 required module','Complete the reviewed learning resource.',true,45,
    '31000000-0000-4000-8000-000000000003',
    '31000000-0000-4000-8000-000000000003'
  ) returning id into v_module;

  insert into public.learning_resources(
    org_id,module_id,position,resource_type,title,resource_url,created_by,updated_by
  ) values (
    '10000000-0000-4000-8000-000000000010',
    v_module,1,'link','Stage 8 reference','https://example.com/stage8',
    '31000000-0000-4000-8000-000000000003',
    '31000000-0000-4000-8000-000000000003'
  );

  update public.learning_courses
  set state='published',updated_by='31000000-0000-4000-8000-000000000003'
  where id=v_course;

  insert into public.learning_assignment_rules(
    org_id,course_id,target_kind,target_profile_id,reason,assigned_by,updated_by
  ) values (
    '10000000-0000-4000-8000-000000000010',
    v_course,'person','31000000-0000-4000-8000-000000000001',
    'Direct person assignment for Stage 8 acceptance.',
    '31000000-0000-4000-8000-000000000003',
    '31000000-0000-4000-8000-000000000003'
  ) returning id into v_rule_person;

  insert into public.learning_assignment_rules(
    org_id,course_id,target_kind,target_unit_id,reason,assigned_by,updated_by
  ) values (
    '10000000-0000-4000-8000-000000000010',
    v_course,'unit','20000000-0000-4000-8000-000000000011',
    'Unit assignment for Stage 8 acceptance.',
    '31000000-0000-4000-8000-000000000003',
    '31000000-0000-4000-8000-000000000003'
  ) returning id into v_rule_unit;

  insert into public.learning_assignment_rules(
    org_id,course_id,target_kind,target_role,reason,assigned_by,updated_by
  ) values (
    '10000000-0000-4000-8000-000000000010',
    v_course,'role','staff',
    'Role assignment for Stage 8 acceptance.',
    '31000000-0000-4000-8000-000000000003',
    '31000000-0000-4000-8000-000000000003'
  ) returning id into v_rule_role;

  insert into public.learning_assignment_rules(
    org_id,course_id,target_kind,reason,assigned_by,updated_by
  ) values (
    '10000000-0000-4000-8000-000000000010',
    v_course,'onboarding',
    'Onboarding-template assignment for Stage 8 acceptance.',
    '31000000-0000-4000-8000-000000000003',
    '31000000-0000-4000-8000-000000000003'
  ) returning id into v_rule_onboarding;

  if (
    select count(*) from public.learning_assignments
    where course_id=v_course
      and profile_id='31000000-0000-4000-8000-000000000001'
  )<>1 then
    raise exception 'Stage 8 gate failure: overlapping person/unit/role rules created duplicate staff assignments.';
  end if;

  if not exists(
    select 1 from public.learning_assignments
    where course_id=v_course
      and profile_id='31000000-0000-4000-8000-000000000006'
  ) then
    raise exception 'Stage 8 gate failure: role rule did not materialise for another staff profile.';
  end if;

  insert into public.employee_lifecycle_cases(
    org_id,profile_id,lifecycle_type,planned_effective_on,reason,state,created_by
  ) values (
    '10000000-0000-4000-8000-000000000010',
    '31000000-0000-4000-8000-000000000007',
    'onboarding',current_date,
    'Stage 8 onboarding learning rule probe.',
    'active',
    '31000000-0000-4000-8000-000000000003'
  );

  if not exists(
    select 1 from public.learning_assignments
    where course_id=v_course
      and profile_id='31000000-0000-4000-8000-000000000007'
  ) then
    raise exception 'Stage 8 gate failure: onboarding assignment rule did not materialise.';
  end if;

  perform set_config('ceac.stage8_course_id',v_course::text,true);
  perform set_config('ceac.stage8_module_id',v_module::text,true);
end
$stage8_admin_build$;

reset role;

-- Staff reads and completes only their own assignment.
set local role authenticated;
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000001',true);

do $stage8_staff_complete$
declare
  v_course uuid:=nullif(current_setting('ceac.stage8_course_id',true),'')::uuid;
  v_module uuid:=nullif(current_setting('ceac.stage8_module_id',true),'')::uuid;
  v_assignment uuid;
  v_progress uuid;
begin
  select id into v_assignment
  from public.learning_assignments
  where course_id=v_course
    and profile_id='31000000-0000-4000-8000-000000000001';

  if v_assignment is null then
    raise exception 'Stage 8 gate failure: staff cannot read own assignment.';
  end if;

  if not exists(
    select 1 from public.learning_courses where id=v_course and state='published'
  ) or not exists(
    select 1 from public.learning_modules where id=v_module
  ) or not exists(
    select 1 from public.learning_resources where module_id=v_module
  ) then
    raise exception 'Stage 8 gate failure: staff cannot read published course content.';
  end if;

  v_progress:=public.learning_complete_module(v_assignment,v_module);

  if v_progress is null then
    raise exception 'Stage 8 gate failure: module completion was not recorded.';
  end if;

  if not exists(
    select 1 from public.learning_assignments
    where id=v_assignment and state='completed' and completed_at is not null
  ) then
    raise exception 'Stage 8 gate failure: required module completion did not complete the course.';
  end if;

  if not exists(
    select 1 from public.training_records
    where profile_id='31000000-0000-4000-8000-000000000001'
      and learning_assignment_id=v_assignment
      and source='learning_course'
      and completed_on is not null
      and voided_at is null
  ) then
    raise exception 'Stage 8 gate failure: structured course completion did not reach training history.';
  end if;

  perform set_config('ceac.stage8_assignment_id',v_assignment::text,true);
end
$stage8_staff_complete$;

reset role;

-- Another staff member cannot read or complete Staff Fixture's assignment.
set local role authenticated;
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000005',true);

do $stage8_other_staff_denied$
declare
  v_assignment uuid:=nullif(current_setting('ceac.stage8_assignment_id',true),'')::uuid;
  v_module uuid:=nullif(current_setting('ceac.stage8_module_id',true),'')::uuid;
  n integer;
begin
  select count(*) into n
  from public.learning_assignments
  where id=v_assignment;

  if n<>0 then
    raise exception 'Stage 8 gate failure: another staff member can read Staff Fixture learning.';
  end if;

  begin
    perform public.learning_complete_module(v_assignment,v_module);
    raise exception 'Stage 8 gate failure: another staff member completed Staff Fixture learning.';
  exception when insufficient_privilege then null;
  end;
end
$stage8_other_staff_denied$;

reset role;

-- Unit manager sees factual team learning but cannot use learning administration.
set local role authenticated;
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000002',true);

do $stage8_manager_read$
declare
  v_assignment uuid:=nullif(current_setting('ceac.stage8_assignment_id',true),'')::uuid;
  n integer;
begin
  select count(*) into n
  from public.learning_assignments
  where id=v_assignment;

  if n<>1 then
    raise exception 'Stage 8 gate failure: assigned unit manager cannot read team learning.';
  end if;

  if public.app_has_capability('learning.manage',null) then
    raise exception 'Stage 8 gate failure: manager unexpectedly has learning.manage.';
  end if;

  begin
    perform public.learning_admin_action(v_assignment,'withdraw',null,'Manager should not correct learning.');
    raise exception 'Stage 8 gate failure: manager used learning administration action.';
  exception when insufficient_privilege then null;
  end;
end
$stage8_manager_read$;

reset role;

-- Administration corrects and staff can complete again.
set local role authenticated;
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000003',true);

do $stage8_admin_correction$
declare
  v_assignment uuid:=nullif(current_setting('ceac.stage8_assignment_id',true),'')::uuid;
  v_module uuid:=nullif(current_setting('ceac.stage8_module_id',true),'')::uuid;
begin
  perform public.learning_admin_action(
    v_assignment,'reopen_module',v_module,'Corrected mistaken completion in Stage 8 acceptance.'
  );

  if not exists(
    select 1 from public.learning_assignments
    where id=v_assignment and state in ('assigned','in_progress') and completed_at is null
  ) then
    raise exception 'Stage 8 gate failure: correction did not reopen course assignment.';
  end if;

  if not exists(
    select 1 from public.training_records
    where learning_assignment_id=v_assignment
      and completed_on is null
      and voided_at is not null
  ) then
    raise exception 'Stage 8 gate failure: corrected course completion was not voided in training history.';
  end if;
end
$stage8_admin_correction$;

reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000001',true);

select public.learning_complete_module(
  nullif(current_setting('ceac.stage8_assignment_id',true),'')::uuid,
  nullif(current_setting('ceac.stage8_module_id',true),'')::uuid
);

reset role;

do $stage8_evidence$
declare
  v_course uuid:=nullif(current_setting('ceac.stage8_course_id',true),'')::uuid;
  v_assignment uuid:=nullif(current_setting('ceac.stage8_assignment_id',true),'')::uuid;
  n integer;
begin
  select count(*) into n
  from public.platform_events
  where event_type='learning.course_published'
    and aggregate_id=v_course;
  if n<>1 then
    raise exception 'Stage 8 gate failure: expected one course-published event, found %.',n;
  end if;

  select count(*) into n
  from public.platform_events
  where event_type='learning.course_completed'
    and aggregate_id=v_assignment;
  if n<>2 then
    raise exception 'Stage 8 gate failure: expected initial completion plus attributable recompletion after correction, found %.',n;
  end if;

  select count(*) into n
  from public.platform_events
  where event_type='learning.progress_corrected'
    and aggregate_id=v_assignment;
  if n<>1 then
    raise exception 'Stage 8 gate failure: expected one progress-correction event, found %.',n;
  end if;

  select count(*) into n
  from public.learning_progress_history
  where assignment_id=v_assignment;
  if n<3 then
    raise exception 'Stage 8 gate failure: completion/correction history is incomplete (%).',n;
  end if;

  select count(*) into n
  from public.platform_audit_events
  where resource_type in ('learning_assignment','learning_module_progress','training_record');
  if n<3 then
    raise exception 'Stage 8 gate failure: ordinary audit evidence is incomplete (%).',n;
  end if;

  if exists(
    select 1
    from information_schema.tables
    where table_schema='public'
      and table_name in ('learning_quizzes','learning_certificates','employee_skill_scores')
  ) then
    raise exception 'Stage 8 gate failure: deferred quiz/certificate/skill scoring was introduced.';
  end if;
end
$stage8_evidence$;

rollback;

select 'CEAC OS Stage 8 learning gate passed' as result;
