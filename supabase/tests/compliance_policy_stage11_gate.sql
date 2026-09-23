\set ON_ERROR_STOP on

begin;

do $stage11_tables$
declare n integer;
begin
  select count(*) into n
  from pg_class c
  join pg_namespace ns on ns.oid=c.relnamespace
  where ns.nspname='public'
    and c.relname in (
      'compliance_policy_versions','compliance_policy_applicability',
      'compliance_requirements','compliance_acknowledgements',
      'compliance_evidence_versions','compliance_exception_versions'
    )
    and c.relkind='r'
    and c.relrowsecurity;

  if n<>6 then
    raise exception 'Stage 11 gate failure: expected 6 Stage 11 RLS tables, found %.',n;
  end if;

  if not exists(select 1 from public.capability_definitions where capability='compliance.manage') then
    raise exception 'Stage 11 gate failure: compliance.manage capability is missing.';
  end if;
end
$stage11_tables$;

do $stage11_privileges$
begin
  if has_table_privilege('anon','public.compliance_policy_versions','SELECT')
     or has_table_privilege('anon','public.compliance_acknowledgements','SELECT')
     or has_table_privilege('anon','public.compliance_evidence_versions','SELECT')
     or has_table_privilege('anon','public.compliance_exception_versions','SELECT') then
    raise exception 'Stage 11 gate failure: anon can read compliance data.';
  end if;

  if has_table_privilege('authenticated','public.compliance_policy_versions','INSERT')
     or has_table_privilege('authenticated','public.compliance_acknowledgements','INSERT')
     or has_table_privilege('authenticated','public.compliance_evidence_versions','INSERT')
     or has_table_privilege('authenticated','public.compliance_exception_versions','INSERT') then
    raise exception 'Stage 11 gate failure: browser can bypass reviewed compliance RPCs.';
  end if;
end
$stage11_privileges$;

set local role authenticated;
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000003',true);

do $stage11_admin_publish$
declare
  v_policy uuid;
begin
  if not public.app_has_capability('compliance.manage',null) then
    raise exception 'Stage 11 gate failure: Admin fixture lacks compliance.manage.';
  end if;

  v_policy:=public.compliance_record_policy(
    null,
    'Stage 11 Unit A Safety Policy',
    'Safety',
    'Acceptance compliance policy',
    'Staff in Test Unit A must acknowledge this policy and maintain the required safety evidence.',
    'active',
    current_date-1,
    current_date+365,
    'Stage 11 acceptance reference',
    'Stage 11 acceptance publication',
    jsonb_build_array(
      jsonb_build_object(
        'scope_kind','unit',
        'unit_id','20000000-0000-4000-8000-000000000011'
      )
    ),
    jsonb_build_array(
      jsonb_build_object(
        'requirement_code','ACK',
        'title','Acknowledge safety policy',
        'description','Read and acknowledge the current policy version.',
        'acknowledgement_required',true,
        'evidence_required',false
      ),
      jsonb_build_object(
        'requirement_code','CERT',
        'title','Safety certificate',
        'description','Provide the recorded safety certificate reference.',
        'acknowledgement_required',false,
        'evidence_required',true,
        'evidence_kind','certificate',
        'evidence_valid_days',365
      )
    ),
    null
  );

  if not exists(
    select 1 from public.compliance_policy_versions
    where id=v_policy and version=1 and state='active'
  ) then
    raise exception 'Stage 11 gate failure: policy version did not persist.';
  end if;

  if (select count(*) from public.compliance_requirements where policy_version_id=v_policy)<>2 then
    raise exception 'Stage 11 gate failure: policy requirements did not persist.';
  end if;

  perform set_config('ceac.stage11_policy_id',v_policy::text,true);
  perform set_config(
    'ceac.stage11_evidence_req_id',
    (select id::text from public.compliance_requirements where policy_version_id=v_policy and requirement_code='CERT'),
    true
  );
end
$stage11_admin_publish$;

reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000001',true);

do $stage11_staff_self$
declare
  v_policy uuid:=nullif(current_setting('ceac.stage11_policy_id',true),'')::uuid;
  v_req uuid:=nullif(current_setting('ceac.stage11_evidence_req_id',true),'')::uuid;
  v_ack uuid;
  v_evidence uuid;
  v_exception uuid;
  n integer;
begin
  select count(*) into n from public.compliance_policy_versions where id=v_policy;
  if n<>1 then
    raise exception 'Stage 11 gate failure: applicable Staff cannot read policy.';
  end if;

  v_ack:=public.compliance_acknowledge_policy(v_policy,'I acknowledge the Stage 11 acceptance policy.');
  if not exists(
    select 1 from public.compliance_acknowledgements
    where id=v_ack and profile_id=auth.uid()
  ) then
    raise exception 'Stage 11 gate failure: self acknowledgement did not persist.';
  end if;

  v_evidence:=public.compliance_submit_evidence(
    v_req,
    'CERT-STAFF-001',
    'Acceptance evidence reference',
    current_date-400,
    current_date-1,
    null
  );

  if not exists(
    select 1 from public.compliance_evidence_versions
    where id=v_evidence and profile_id=auth.uid() and state='submitted' and expires_on<current_date
  ) then
    raise exception 'Stage 11 gate failure: factual expired evidence did not persist.';
  end if;

  v_exception:=public.compliance_request_exception(
    v_req,
    'Temporary acceptance exception request',
    current_date+30
  );

  if not exists(
    select 1 from public.compliance_exception_versions
    where id=v_exception and profile_id=auth.uid() and state='requested'
  ) then
    raise exception 'Stage 11 gate failure: exception request did not persist.';
  end if;

  perform set_config('ceac.stage11_evidence_id',v_evidence::text,true);
  perform set_config('ceac.stage11_exception_id',v_exception::text,true);
end
$stage11_staff_self$;

reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000005',true);

do $stage11_other_unit$
declare
  v_policy uuid:=nullif(current_setting('ceac.stage11_policy_id',true),'')::uuid;
  n integer;
begin
  select count(*) into n from public.compliance_policy_versions where id=v_policy;
  if n<>0 then
    raise exception 'Stage 11 gate failure: other-unit Staff can read unit-scoped policy.';
  end if;
end
$stage11_other_unit$;

reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000002',true);

do $stage11_manager$
declare
  v_evidence uuid:=nullif(current_setting('ceac.stage11_evidence_id',true),'')::uuid;
  v_exception uuid:=nullif(current_setting('ceac.stage11_exception_id',true),'')::uuid;
  n integer;
begin
  select count(*) into n from public.compliance_evidence_versions where id=v_evidence;
  if n<>1 then
    raise exception 'Stage 11 gate failure: Manager cannot read managed-unit evidence.';
  end if;

  select count(*) into n from public.compliance_exception_versions where id=v_exception;
  if n<>1 then
    raise exception 'Stage 11 gate failure: Manager cannot read managed-unit exception.';
  end if;

  begin
    perform public.compliance_review_evidence(v_evidence,'verified','Manager must not verify.');
    raise exception 'Stage 11 gate failure: Manager verified evidence without compliance.manage.';
  exception when insufficient_privilege then null;
  end;
end
$stage11_manager$;

reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000003',true);

do $stage11_admin_decisions$
declare
  v_evidence uuid:=nullif(current_setting('ceac.stage11_evidence_id',true),'')::uuid;
  v_exception uuid:=nullif(current_setting('ceac.stage11_exception_id',true),'')::uuid;
  v_verified uuid;
  v_approved uuid;
  v_resolved uuid;
begin
  v_verified:=public.compliance_review_evidence(
    v_evidence,'verified','Acceptance reviewer verified the submitted reference.'
  );

  if not exists(
    select 1 from public.compliance_evidence_versions
    where id=v_verified and supersedes_id=v_evidence and version=2 and state='verified'
  ) then
    raise exception 'Stage 11 gate failure: evidence review history is incomplete.';
  end if;

  v_approved:=public.compliance_exception_action(
    v_exception,'approved','Temporary exception approved for acceptance.',current_date+14
  );

  v_resolved:=public.compliance_exception_action(
    v_approved,'resolved','Acceptance exception resolved.',null
  );

  if not exists(
    select 1 from public.compliance_exception_versions
    where id=v_resolved and supersedes_id=v_approved and version=3 and state='resolved'
  ) then
    raise exception 'Stage 11 gate failure: exception resolution history is incomplete.';
  end if;

  perform set_config('ceac.stage11_verified_id',v_verified::text,true);
end
$stage11_admin_decisions$;

do $stage11_retirement$
declare
  v_policy uuid:=nullif(current_setting('ceac.stage11_policy_id',true),'')::uuid;
  v_retired uuid;
begin
  v_retired:=public.compliance_record_policy(
    null,
    'Stage 11 Unit A Safety Policy',
    'Safety',
    'Retired acceptance policy',
    'This retirement version preserves the prior applicability and requirements.',
    'retired',
    current_date,
    null,
    'Stage 11 retirement reference',
    'Stage 11 acceptance retirement',
    '[]'::jsonb,
    '[]'::jsonb,
    v_policy
  );

  if not exists(
    select 1 from public.compliance_policy_versions
    where id=v_retired and supersedes_id=v_policy and version=2 and state='retired'
  ) then
    raise exception 'Stage 11 gate failure: retirement version missing.';
  end if;

  if (select count(*) from public.compliance_policy_applicability where policy_version_id=v_retired)<>1
     or (select count(*) from public.compliance_requirements where policy_version_id=v_retired)<>2 then
    raise exception 'Stage 11 gate failure: retirement did not preserve applicability/requirements.';
  end if;
end
$stage11_retirement$;

reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000001',true);

do $stage11_staff_history$
declare
  n integer;
begin
  select count(*) into n
  from public.compliance_evidence_versions
  where profile_id=auth.uid()
    and evidence_key=(select evidence_key from public.compliance_evidence_versions where id=nullif(current_setting('ceac.stage11_verified_id',true),'')::uuid);

  if n<>2 then
    raise exception 'Stage 11 gate failure: Staff evidence history is not preserved.';
  end if;

  select count(*) into n
  from public.compliance_exception_versions
  where profile_id=auth.uid();

  if n<3 then
    raise exception 'Stage 11 gate failure: Staff exception history is not preserved.';
  end if;
end
$stage11_staff_history$;

reset role;

do $stage11_evidence$
declare n integer;
begin
  select count(*) into n
  from public.platform_events
  where event_type in (
    'compliance.policy_published','compliance.policy_acknowledged',
    'compliance.evidence_submitted','compliance.evidence_verified',
    'compliance.exception_requested','compliance.exception_approved',
    'compliance.exception_resolved','compliance.policy_retired'
  );
  if n<8 then
    raise exception 'Stage 11 gate failure: expected compliance semantic events, found %.',n;
  end if;

  if exists(
    select 1 from information_schema.columns
    where table_schema='public'
      and table_name like 'compliance_%'
      and column_name in ('score','rating','rank','compliance_score','employee_score')
  ) then
    raise exception 'Stage 11 gate failure: prohibited compliance scoring field exists.';
  end if;
end
$stage11_evidence$;

rollback;

select 'CEAC OS Stage 11 Compliance & Policy gate passed' as result;
