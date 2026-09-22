\set ON_ERROR_STOP on

begin;

-- CEAC OS Platform Kernel gate.
-- This gate protects whole-system invariants before the enterprise expansion
-- programme may proceed past Stage 0.

do $public_rls$
declare n integer;
begin
  select count(*) into n
  from pg_class c
  join pg_namespace ns on ns.oid=c.relnamespace
  where ns.nspname='public'
    and c.relkind='r'
    and not c.relrowsecurity;
  if n<>0 then
    raise exception 'Platform Kernel gate failure: % public application table(s) lack RLS.',n;
  end if;
end
$public_rls$;

do $definer_anonymous$
declare n integer;
begin
  select count(*) into n
  from pg_proc p
  join pg_namespace ns on ns.oid=p.pronamespace
  where ns.nspname='public'
    and p.prosecdef
    and has_function_privilege('anon',p.oid,'EXECUTE');
  if n<>0 then
    raise exception 'Platform Kernel gate failure: % public SECURITY DEFINER function(s) are executable by anon.',n;
  end if;
end
$definer_anonymous$;

do $definer_search_path$
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
    raise exception 'Platform Kernel gate failure: % public SECURITY DEFINER function(s) lack a fixed search_path.',n;
  end if;
end
$definer_search_path$;

-- 73 signed-in callable definers is the reviewed ceiling inherited from the
-- Admin/HR + Rooms/Meeting security gates. Reductions are welcome. Growth is
-- blocked until the same PR deliberately updates the security review.
do $definer_ceiling$
declare n integer;
begin
  select count(*) into n
  from pg_proc p
  join pg_namespace ns on ns.oid=p.pronamespace
  where ns.nspname='public'
    and p.prosecdef
    and has_function_privilege('authenticated',p.oid,'EXECUTE');
  if n>73 then
    raise exception 'Platform Kernel gate failure: authenticated SECURITY DEFINER surface grew from the reviewed ceiling of 73 to %.',n;
  end if;
end
$definer_ceiling$;

-- Protected HR is deliberately outside browser-exposed public data.
do $hr_boundary$
begin
  if not exists(select 1 from pg_namespace where nspname='hr_private') then
    raise exception 'Platform Kernel gate failure: hr_private schema is missing.';
  end if;

  if has_schema_privilege('anon','hr_private','USAGE')
     or has_schema_privilege('authenticated','hr_private','USAGE') then
    raise exception 'Platform Kernel gate failure: browser roles have USAGE on hr_private.';
  end if;

  if has_table_privilege('anon','hr_private.documents','SELECT')
     or has_table_privilege('authenticated','hr_private.documents','SELECT')
     or has_table_privilege('anon','hr_private.audit_events','SELECT')
     or has_table_privilege('authenticated','hr_private.audit_events','SELECT') then
    raise exception 'Platform Kernel gate failure: protected HR tables are directly browser-readable.';
  end if;
end
$hr_boundary$;

do $hr_bucket$
declare v_public boolean;
begin
  select public into v_public from storage.buckets where id='ceac-hr-private';
  if v_public is null then
    raise exception 'Platform Kernel gate failure: ceac-hr-private bucket is missing.';
  end if;
  if v_public then
    raise exception 'Platform Kernel gate failure: ceac-hr-private bucket is public.';
  end if;
end
$hr_bucket$;

-- Sensitive HCM/payroll data must not leak into ordinary profiles as the
-- enterprise programme expands.
do $profile_boundary$
declare n integer;
begin
  select count(*) into n
  from information_schema.columns
  where table_schema='public'
    and table_name='profiles'
    and column_name ~* '(ghana|ssnit|tax|tin|bank|salary|compensation|payroll|payslip|national_id|passport|account_number)';
  if n<>0 then
    raise exception 'Platform Kernel gate failure: protected HCM/payroll field(s) were added to public.profiles.';
  end if;
end
$profile_boundary$;

-- The locked Platform Kernel includes migration 073/private Meeting notes.
do $meeting_private_notes$
declare n integer;
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema='public' and table_name='meeting_private_notes'
  ) then
    raise exception 'Platform Kernel gate failure: meeting_private_notes is missing.';
  end if;

  select count(*) into n
  from pg_policies
  where schemaname='public'
    and tablename='meeting_private_notes'
    and policyname in (
      'meeting_private_notes_read',
      'meeting_private_notes_insert',
      'meeting_private_notes_update'
    );
  if n<>3 then
    raise exception 'Platform Kernel gate failure: expected 3 private Meeting-note policies, found %.',n;
  end if;

  if not exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid=c.conrelid
    join pg_namespace ns on ns.oid=t.relnamespace
    where ns.nspname='public'
      and t.relname='meeting_records'
      and c.conname='meeting_records_kind_check'
      and pg_get_constraintdef(c.oid) like '%decision%'
  ) then
    raise exception 'Platform Kernel gate failure: shared Meeting records are not decision-only.';
  end if;
end
$meeting_private_notes$;

-- Clean replay must record the current immutable migration in the local
-- migration ledger. This protects future work from accidentally omitting 073.
do $migration_073$
begin
  if not exists (
    select 1
    from supabase_migrations.schema_migrations
    where version='20260921211500'
  ) then
    raise exception 'Platform Kernel gate failure: local migration history does not contain 073 private meeting notes.';
  end if;
end
$migration_073$;

rollback;

select 'CEAC OS Platform Kernel gate passed' as result;
