\set ON_ERROR_STOP on

begin;

do $audit_table$
declare
  v_rls boolean;
begin
  select c.relrowsecurity into v_rls
  from pg_class c
  join pg_namespace ns on ns.oid=c.relnamespace
  where ns.nspname='public' and c.relname='platform_audit_events';
  if v_rls is distinct from true then
    raise exception 'Platform audit gate failure: platform_audit_events must have RLS enabled.';
  end if;
end
$audit_table$;

do $audit_privileges$
begin
  if has_table_privilege('anon','public.platform_audit_events','SELECT')
     or has_table_privilege('anon','public.platform_audit_events','INSERT')
     or has_table_privilege('anon','public.platform_audit_events','UPDATE')
     or has_table_privilege('anon','public.platform_audit_events','DELETE') then
    raise exception 'Platform audit gate failure: anon has platform audit privileges.';
  end if;

  if has_table_privilege('authenticated','public.platform_audit_events','INSERT')
     or has_table_privilege('authenticated','public.platform_audit_events','UPDATE')
     or has_table_privilege('authenticated','public.platform_audit_events','DELETE') then
    raise exception 'Platform audit gate failure: authenticated can directly mutate audit history.';
  end if;

  if not has_table_privilege('authenticated','public.platform_audit_events','SELECT') then
    raise exception 'Platform audit gate failure: authenticated lacks reviewed SELECT grant for RLS evaluation.';
  end if;
end
$audit_privileges$;

do $audit_internal_functions$
begin
  if has_function_privilege('authenticated','public.platform_audit_capture()','EXECUTE')
     or has_function_privilege('authenticated','public.platform_audit_immutable()','EXECUTE')
     or has_function_privilege('anon','public.platform_audit_capture()','EXECUTE')
     or has_function_privilege('anon','public.platform_audit_immutable()','EXECUTE') then
    raise exception 'Platform audit gate failure: internal audit trigger function is browser executable.';
  end if;
end
$audit_internal_functions$;

do $audit_policy$
declare n integer;
begin
  select count(*) into n
  from pg_policies
  where schemaname='public'
    and tablename='platform_audit_events'
    and policyname='platform_audit_events_admin_read'
    and cmd='SELECT';
  if n<>1 then
    raise exception 'Platform audit gate failure: expected one Administration read policy, found %.',n;
  end if;
end
$audit_policy$;

do $audit_triggers$
declare n integer;
begin
  select count(*) into n
  from pg_trigger t
  join pg_class c on c.oid=t.tgrelid
  join pg_namespace ns on ns.oid=c.relnamespace
  where ns.nspname='public'
    and not t.tgisinternal
    and t.tgname in (
      'audit_profiles','audit_unit_memberships','audit_capabilities',
      'audit_thresholds','audit_leave_settings','audit_office_locations',
      'audit_employment_records','audit_employment_history','audit_projects',
      'audit_finance_requests','audit_ministry_events','audit_announcements'
    );
  if n<>12 then
    raise exception 'Platform audit gate failure: expected 12 reviewed capture triggers, found %.',n;
  end if;

  if not exists (
    select 1
    from pg_trigger t
    join pg_class c on c.oid=t.tgrelid
    join pg_namespace ns on ns.oid=c.relnamespace
    where ns.nspname='public' and c.relname='platform_audit_events'
      and t.tgname='platform_audit_events_immutable'
      and not t.tgisinternal
  ) then
    raise exception 'Platform audit gate failure: append-only trigger is missing.';
  end if;
end
$audit_triggers$;

do $audit_rows_exist$
declare n integer;
begin
  select count(*) into n from public.platform_audit_events;
  if n<1 then
    raise exception 'Platform audit gate failure: seeded consequential changes produced no audit events.';
  end if;
end
$audit_rows_exist$;

do $audit_is_immutable$
declare v_id uuid;
begin
  select id into v_id
  from public.platform_audit_events
  order by created_at
  limit 1;

  begin
    update public.platform_audit_events
    set action=action
    where id=v_id;
    raise exception 'Platform audit gate failure: audit update unexpectedly succeeded.';
  exception
    when sqlstate '42501' then null;
  end;

  begin
    delete from public.platform_audit_events where id=v_id;
    raise exception 'Platform audit gate failure: audit delete unexpectedly succeeded.';
  exception
    when sqlstate '42501' then null;
  end;
end
$audit_is_immutable$;

rollback;

select 'CEAC OS Stage 1B platform audit gate passed' as result;
