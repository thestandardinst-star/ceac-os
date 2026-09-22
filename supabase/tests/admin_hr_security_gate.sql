\set ON_ERROR_STOP on

begin;

-- ---------------------------------------------------------------------------
-- Baseline structural guarantees
-- ---------------------------------------------------------------------------

do $$
declare n integer;
begin
  select count(*) into n
  from pg_class c
  join pg_namespace ns on ns.oid=c.relnamespace
  where ns.nspname='public'
    and c.relkind='r'
    and not c.relrowsecurity;
  if n<>0 then
    raise exception 'Security gate failure: % public table(s) do not have RLS enabled.',n;
  end if;
end $$;

do $$
declare n integer;
begin
  select count(*) into n
  from pg_proc p
  join pg_namespace ns on ns.oid=p.pronamespace
  where ns.nspname='public'
    and p.prosecdef
    and has_function_privilege('anon',p.oid,'EXECUTE');
  if n<>0 then
    raise exception 'Security gate failure: % SECURITY DEFINER function(s) are callable by anon.',n;
  end if;
end $$;

do $$
declare n integer;
begin
  select count(*) into n
  from pg_proc p
  join pg_namespace ns on ns.oid=p.pronamespace
  where ns.nspname='public'
    and p.prosecdef
    and (
      p.proconfig is null
      or not exists (
        select 1 from unnest(p.proconfig) cfg
        where cfg like 'search_path=%'
      )
    );
  if n<>0 then
    raise exception 'Security gate failure: % SECURITY DEFINER function(s) lack a fixed search_path.',n;
  end if;
end $$;

-- The accepted baseline had 68 signed-in callable SECURITY DEFINER functions.
-- Migration 069 added three reviewed Room RPC/helper functions.
-- Migration 071 adds one reviewed meeting-scheduling RPC: schedule_meeting.
-- Migration 072 adds one reviewed participant-aware authority helper:
-- app_can_manage_meeting(uuid). It binds to auth.uid(), the active org, and
-- approved manager/admin/executive/organiser authority; it has a fixed
-- search_path and no anon EXECUTE.
-- Stage 3 adds two reviewed capability-gated protected-HR RPCs:
-- hr_protected_summary(uuid) and hr_protected_record(uuid,text,jsonb,uuid,text).
-- Stage 7 adds nine reviewed performance-development RPCs:
-- open_performance_review_cycle, refresh_performance_evidence,
-- assign_performance_reviewer, record_appraisal_entry,
-- share_performance_review, close_performance_review_cycle,
-- record_development_plan_version, record_performance_feedback,
-- respond_to_performance_feedback.
-- Each is bound to auth.uid() plus explicit performance/reviewer/self authority.
-- Reducing this surface is allowed. Any growth beyond 84 requires another
-- explicit security-gate review in the same PR.
do $$
declare n integer;
begin
  select count(*) into n
  from pg_proc p
  join pg_namespace ns on ns.oid=p.pronamespace
  where ns.nspname='public'
    and p.prosecdef
    and has_function_privilege('authenticated',p.oid,'EXECUTE');
  if n>84 then
    raise exception 'Security gate failure: authenticated SECURITY DEFINER surface grew beyond the reviewed 84-function ceiling to %.',n;
  end if;
end $$;

-- Every signed-in callable definer RPC must visibly bind itself to the caller
-- directly or through an approved authority/visibility helper.
do $rpc_authority$
declare n integer;
begin
  select count(*) into n
  from pg_proc p
  join pg_namespace ns on ns.oid=p.pronamespace
  where ns.nspname='public'
    and p.prosecdef
    and has_function_privilege('authenticated',p.oid,'EXECUTE')
    and pg_get_functiondef(p.oid) not ilike '%auth.uid%'
    and pg_get_functiondef(p.oid) not ilike '%app_is_%'
    and pg_get_functiondef(p.oid) not ilike '%app_managed_units%'
    and pg_get_functiondef(p.oid) not ilike '%app_can_%'
    and pg_get_functiondef(p.oid) not ilike '%app_visible_%'
    and pg_get_functiondef(p.oid) not ilike '%app_my_units%'
    and pg_get_functiondef(p.oid) not ilike '%app_led_sub_teams%';
  if n<>0 then
    raise exception 'Security gate failure: % authenticated SECURITY DEFINER RPC(s) lack an approved actor/authority binding.',n;
  end if;
end
$rpc_authority$;

-- Migration 067 changes default privileges. Prove a new function is not
-- silently exposed to signed-in or anonymous users.
create function public.security_gate_default_probe()
returns integer
language sql
as $$ select 1 $$;

do $gate$
declare v_oid oid:='public.security_gate_default_probe()'::regprocedure::oid;
begin
  if has_function_privilege('anon',v_oid,'EXECUTE')
     or has_function_privilege('authenticated',v_oid,'EXECUTE')
     or exists (
       select 1
       from pg_proc p
       cross join lateral aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a
       where p.oid=v_oid
         and a.grantee=0
         and a.privilege_type='EXECUTE'
     ) then
    raise exception 'Security gate failure: newly created public functions still receive broad EXECUTE by default.';
  end if;
end
$gate$;

drop function public.security_gate_default_probe();

-- ---------------------------------------------------------------------------
-- HR-data boundary
-- ---------------------------------------------------------------------------

do $$
declare n integer;
begin
  select count(*) into n
  from information_schema.columns
  where table_schema='public'
    and table_name='profiles'
    and column_name ~* '(ghana|ssnit|tax|tin|bank|salary|payroll|payslip|national_id|passport|contract_(file|document)|account_number)';
  if n<>0 then
    raise exception 'Security gate failure: protected HR field(s) were added to public.profiles.';
  end if;
end $$;

do $$
declare n integer;
begin
  select count(*) into n
  from storage.buckets
  where public
    and name ~* '(hr|human.?resources|contract|payslip|payroll|salary|employee.?document|staff.?document)';
  if n<>0 then
    raise exception 'Security gate failure: an HR/protected-document Storage bucket is public.';
  end if;
end $$;

-- Protected HR foundation must remain outside the browser-exposed public schema.
do $hr_schema$
begin
  if not exists(select 1 from pg_namespace where nspname='hr_private') then
    raise exception 'Security gate failure: hr_private schema is missing.';
  end if;

  if has_schema_privilege('anon','hr_private','USAGE')
     or has_schema_privilege('authenticated','hr_private','USAGE') then
    raise exception 'Security gate failure: anon/authenticated has USAGE on hr_private.';
  end if;

  if has_table_privilege('anon','hr_private.documents','SELECT')
     or has_table_privilege('authenticated','hr_private.documents','SELECT')
     or has_table_privilege('anon','hr_private.audit_events','SELECT')
     or has_table_privilege('authenticated','hr_private.audit_events','SELECT') then
    raise exception 'Security gate failure: protected HR tables are directly readable by browser roles.';
  end if;
end
$hr_schema$;

do $hr_bucket$
declare v_public boolean;
begin
  select public into v_public
  from storage.buckets
  where id='ceac-hr-private';

  if v_public is null then
    raise exception 'Security gate failure: ceac-hr-private bucket is missing.';
  end if;
  if v_public then
    raise exception 'Security gate failure: ceac-hr-private bucket is public.';
  end if;
end
$hr_bucket$;

-- Stage 3 explicitly reviews private HR Storage access. The bucket stays
-- private; browser access is capability-gated and constrained to the caller's
-- organisation path. No generic/public policy is permitted.
do $hr_storage_policy$
declare
  n integer;
  unsafe integer;
begin
  select count(*) into n
  from pg_policies
  where schemaname='storage'
    and tablename='objects'
    and policyname in (
      'ceac_hr_private_select',
      'ceac_hr_private_insert',
      'ceac_hr_private_delete'
    );

  if n<>3 then
    raise exception 'Security gate failure: expected 3 reviewed ceac-hr-private Storage policies, found %.',n;
  end if;

  select count(*) into unsafe
  from pg_policies
  where schemaname='storage'
    and tablename='objects'
    and (
      coalesce(qual,'') ilike '%ceac-hr-private%'
      or coalesce(with_check,'') ilike '%ceac-hr-private%'
    )
    and (
      (coalesce(qual,'')||' '||coalesce(with_check,'')) not ilike '%hr_private.access%'
      or (coalesce(qual,'')||' '||coalesce(with_check,'')) not ilike '%foldername%'
      or (coalesce(qual,'')||' '||coalesce(with_check,'')) not ilike '%app_org_id%'
    );

  if unsafe<>0 then
    raise exception 'Security gate failure: protected HR Storage policy is not capability + organisation-path constrained.';
  end if;
end
$hr_storage_policy$;

do $hr_audit_trigger$
begin
  if not exists(
    select 1
    from pg_trigger t
    join pg_class c on c.oid=t.tgrelid
    join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='hr_private'
      and c.relname='audit_events'
      and t.tgname='hr_audit_events_immutable'
      and not t.tgisinternal
  ) then
    raise exception 'Security gate failure: HR audit immutability trigger is missing.';
  end if;
end
$hr_audit_trigger$;

-- ---------------------------------------------------------------------------
-- Role matrix using the local fixture organisation
-- ---------------------------------------------------------------------------

insert into public.organisations(id,name,short_code)
values('10000000-0000-4000-8000-000000000099','Other Security Test Org','OTHERQ');

insert into public.thresholds(org_id,name,label,value,unit_label)
values(
  '10000000-0000-4000-8000-000000000099',
  'security_probe',
  'security probe',
  777,
  'units'
);

insert into public.profile_personal_details(
  profile_id,org_id,emergency_contact_name,address_text,updated_by
) values(
  '31000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000010',
  'Private Emergency Contact',
  'Private Fixture Address',
  '31000000-0000-4000-8000-000000000001'
)
on conflict(profile_id) do update
set emergency_contact_name=excluded.emergency_contact_name,
    address_text=excluded.address_text,
    updated_by=excluded.updated_by,
    updated_at=now();

-- Staff
set local role authenticated;
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000001',true);

do $$
begin
  begin
    perform public.app_threshold(
      '10000000-0000-4000-8000-000000000099',
      'security_probe',
      0
    );
    raise exception 'Security gate failure: Staff read another organisation''s threshold.';
  exception when insufficient_privilege then null;
  end;
end $$;

do $$
begin
  begin
    perform public.admin_people_summary();
    raise exception 'Security gate failure: Staff called admin_people_summary().';
  exception when insufficient_privilege then null;
  end;
end $$;

do $$
begin
  begin
    update public.profiles
    set is_admin=true
    where id='31000000-0000-4000-8000-000000000001';
    raise exception 'Security gate failure: Staff self-promoted to Administration.';
  exception when insufficient_privilege then null;
  end;
end $$;

do $$
declare n integer;
begin
  select count(*) into n
  from public.profile_personal_details
  where profile_id='31000000-0000-4000-8000-000000000001';
  if n<>1 then
    raise exception 'Security gate failure: Staff cannot read their own private personal details.';
  end if;
end $$;

reset role;

-- Manager
set local role authenticated;
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000002',true);

do $$
begin
  begin
    perform public.admin_people_summary();
    raise exception 'Security gate failure: Manager called admin_people_summary().';
  exception when insufficient_privilege then null;
  end;
end $$;

do $$
declare n integer;
begin
  select count(*) into n
  from public.profile_personal_details
  where profile_id='31000000-0000-4000-8000-000000000001';
  if n<>0 then
    raise exception 'Security gate failure: Manager read a Staff member''s private personal details.';
  end if;
end $$;

reset role;

-- Group Pastor / Executive: leadership access must not silently become HR-private access.
set local role authenticated;
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000004',true);

do $$
begin
  begin
    perform public.admin_people_summary();
    raise exception 'Security gate failure: Executive called Administration-only People RPC.';
  exception when insufficient_privilege then null;
  end;
end $$;

do $$
declare n integer;
begin
  select count(*) into n
  from public.profile_personal_details
  where profile_id='31000000-0000-4000-8000-000000000001';
  if n<>0 then
    raise exception 'Security gate failure: Executive read HR-private personal details by default.';
  end if;
end $$;

reset role;

-- Administration & HR
set local role authenticated;
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000003',true);

do $$
declare summary jsonb;
begin
  summary:=public.admin_people_summary();
  if summary is null then
    raise exception 'Security gate failure: Administration People summary did not return.';
  end if;
end $$;

do $$
declare n integer;
begin
  select count(*) into n
  from public.profile_personal_details
  where profile_id='31000000-0000-4000-8000-000000000001';
  if n<>1 then
    raise exception 'Security gate failure: Administration cannot read protected personal details.';
  end if;
end $$;

rollback;

select 'Admin & HR security gate passed' as result;
