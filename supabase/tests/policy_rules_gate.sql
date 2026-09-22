\set ON_ERROR_STOP on

begin;

do $policy_tables$
declare n integer;
begin
  select count(*) into n
  from pg_class c
  join pg_namespace ns on ns.oid=c.relnamespace
  where ns.nspname='public'
    and c.relname in ('policy_rule_definitions','policy_rule_versions')
    and c.relkind='r'
    and c.relrowsecurity;
  if n<>2 then
    raise exception 'Policy rules gate failure: expected both policy tables with RLS, found %.',n;
  end if;

  select count(*) into n from public.policy_rule_definitions where active;
  if n<6 then
    raise exception 'Policy rules gate failure: initial catalogue is incomplete.';
  end if;
end
$policy_tables$;

do $policy_privileges$
begin
  if has_table_privilege('anon','public.policy_rule_definitions','SELECT')
     or has_table_privilege('anon','public.policy_rule_versions','SELECT')
     or has_table_privilege('anon','public.policy_rule_versions','INSERT') then
    raise exception 'Policy rules gate failure: anon has policy privileges.';
  end if;

  if has_table_privilege('authenticated','public.policy_rule_versions','UPDATE')
     or has_table_privilege('authenticated','public.policy_rule_versions','DELETE') then
    raise exception 'Policy rules gate failure: authenticated can rewrite policy history.';
  end if;

  if not has_table_privilege('authenticated','public.policy_rule_versions','INSERT') then
    raise exception 'Policy rules gate failure: reviewed INSERT grant is missing.';
  end if;
end
$policy_privileges$;

do $policy_triggers$
declare n integer;
begin
  select count(*) into n
  from pg_trigger t
  join pg_class c on c.oid=t.tgrelid
  join pg_namespace ns on ns.oid=c.relnamespace
  where ns.nspname='public'
    and c.relname='policy_rule_versions'
    and not t.tgisinternal
    and t.tgname in (
      'policy_rule_versions_validate',
      'policy_rule_versions_immutable',
      'audit_policy_rule_versions',
      'policy_rule_versions_emit_event'
    );
  if n<>4 then
    raise exception 'Policy rules gate failure: expected 4 policy triggers, found %.',n;
  end if;
end
$policy_triggers$;

-- Staff cannot record a rule version.
set local role authenticated;
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000001',true);

do $policy_denied$
begin
  begin
    insert into public.policy_rule_versions(
      org_id,rule_key,value,effective_on,reason,recorded_by
    ) values (
      '10000000-0000-4000-8000-000000000010',
      'work.quiet_days',
      '5'::jsonb,
      current_date,
      'Staff denial probe',
      '31000000-0000-4000-8000-000000000001'
    );
    raise exception 'Policy rules gate failure: Staff inserted a policy version.';
  exception when insufficient_privilege then
    null;
  end;
end
$policy_denied$;

reset role;

-- Authority manager can record a valid policy version.
set local role authenticated;
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000003',true);

do $policy_insert$
declare v_id uuid; v_events integer; v_audits integer;
begin
  insert into public.policy_rule_versions(
    org_id,rule_key,value,effective_on,reason,recorded_by
  ) values (
    '10000000-0000-4000-8000-000000000010',
    'work.quiet_days',
    '7'::jsonb,
    current_date,
    'Stage 1F configured work quiet threshold',
    '31000000-0000-4000-8000-000000000003'
  )
  returning id into v_id;

  if v_id is null then
    raise exception 'Policy rules gate failure: authority-managed insert returned no row.';
  end if;

  select count(*) into v_events
  from public.platform_events
  where event_type='policy.rule_changed'
    and aggregate_id=v_id;

  if v_events<>1 then
    raise exception 'Policy rules gate failure: expected 1 policy event, found %.',v_events;
  end if;

  select count(*) into v_audits
  from public.platform_audit_events
  where resource_type='policy_rule_version'
    and resource_id=v_id;

  if v_audits<>1 then
    raise exception 'Policy rules gate failure: expected 1 policy audit row, found %.',v_audits;
  end if;

  begin
    update public.policy_rule_versions set reason=reason where id=v_id;
    raise exception 'Policy rules gate failure: policy history update unexpectedly succeeded.';
  exception when sqlstate '42501' then null;
  end;
end
$policy_insert$;

do $policy_validation$
begin
  begin
    insert into public.policy_rule_versions(
      org_id,rule_key,value,effective_on,reason,recorded_by
    ) values (
      '10000000-0000-4000-8000-000000000010',
      'work.quiet_days',
      '0'::jsonb,
      current_date,
      'Below minimum probe',
      '31000000-0000-4000-8000-000000000003'
    );
    raise exception 'Policy rules gate failure: below-minimum value was accepted.';
  exception
    when others then
      if sqlerrm like 'Policy rules gate failure:%' then raise; end if;
  end;
end
$policy_validation$;

reset role;

rollback;

select 'CEAC OS Stage 1F policy rules gate passed' as result;
