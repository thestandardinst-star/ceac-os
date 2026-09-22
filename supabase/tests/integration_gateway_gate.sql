\set ON_ERROR_STOP on

begin;

do $integration_tables$
declare n integer;
begin
  select count(*) into n
  from pg_class c
  join pg_namespace ns on ns.oid=c.relnamespace
  where ns.nspname='public'
    and c.relname in ('integration_connectors','integration_subscriptions','integration_outbox')
    and c.relkind='r'
    and c.relrowsecurity;
  if n<>3 then
    raise exception 'Integration gateway gate failure: expected 3 integration tables with RLS, found %.',n;
  end if;
end
$integration_tables$;

do $integration_secret_surface$
declare n integer;
begin
  select count(*) into n
  from information_schema.columns
  where table_schema='public'
    and table_name in ('integration_connectors','integration_subscriptions','integration_outbox')
    and column_name ~* '(secret|token|password|api.?key|private.?key|credential)';
  if n<>0 then
    raise exception 'Integration gateway gate failure: browser-visible integration table contains secret-like columns.';
  end if;
end
$integration_secret_surface$;

do $integration_privileges$
begin
  if has_table_privilege('anon','public.integration_connectors','SELECT')
     or has_table_privilege('anon','public.integration_outbox','SELECT') then
    raise exception 'Integration gateway gate failure: anon has integration privileges.';
  end if;

  if has_table_privilege('authenticated','public.integration_outbox','INSERT')
     or has_table_privilege('authenticated','public.integration_outbox','UPDATE')
     or has_table_privilege('authenticated','public.integration_outbox','DELETE') then
    raise exception 'Integration gateway gate failure: authenticated can mutate service-owned outbox.';
  end if;

  if has_function_privilege('authenticated','public.integration_enqueue_event()','EXECUTE')
     or has_function_privilege('anon','public.integration_enqueue_event()','EXECUTE') then
    raise exception 'Integration gateway gate failure: internal event enqueue helper is browser executable.';
  end if;
end
$integration_privileges$;

-- Staff cannot create connectors.
set local role authenticated;
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000001',true);

do $integration_denied$
begin
  begin
    insert into public.integration_connectors(
      org_id,connector_key,connector_type,display_name,enabled,public_config,created_by,updated_by
    ) values (
      '10000000-0000-4000-8000-000000000010',
      'staff-probe','custom','Staff Probe',false,'{}',
      '31000000-0000-4000-8000-000000000001',
      '31000000-0000-4000-8000-000000000001'
    );
    raise exception 'Integration gateway gate failure: Staff created an integration connector.';
  exception when insufficient_privilege then null;
  end;
end
$integration_denied$;

reset role;

-- Integration manager configures a connector/subscription and matching event queues once.
set local role authenticated;
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000003',true);

do $integration_flow$
declare
  v_connector uuid;
  v_subscription uuid;
  v_event uuid;
  v_count integer;
begin
  insert into public.integration_connectors(
    org_id,connector_key,connector_type,display_name,enabled,public_config,created_by,updated_by
  ) values (
    '10000000-0000-4000-8000-000000000010',
    'stage-1g-probe','webhook','Stage 1G Probe',true,
    '{"destination_label":"Acceptance endpoint"}'::jsonb,
    '31000000-0000-4000-8000-000000000003',
    '31000000-0000-4000-8000-000000000003'
  ) returning id into v_connector;

  insert into public.integration_subscriptions(
    org_id,connector_id,event_type,active,created_by,updated_by
  ) values (
    '10000000-0000-4000-8000-000000000010',
    v_connector,'policy.rule_changed',true,
    '31000000-0000-4000-8000-000000000003',
    '31000000-0000-4000-8000-000000000003'
  ) returning id into v_subscription;

  v_event:=public.platform_emit_event(
    '10000000-0000-4000-8000-000000000010',
    'policy.rule_changed',
    '31000000-0000-4000-8000-000000000003',
    null,
    'policy_rule',
    gen_random_uuid(),
    '{"rule_key":"work.quiet_days"}'::jsonb,
    'stage-1g-event',
    null,null,now()
  );

  select count(*) into v_count
  from public.integration_outbox
  where subscription_id=v_subscription and event_id=v_event and state='pending';

  if v_count<>1 then
    raise exception 'Integration gateway gate failure: expected 1 queued delivery, found %.',v_count;
  end if;

  begin
    update public.integration_outbox
    set state='delivered',delivered_at=now()
    where subscription_id=v_subscription and event_id=v_event;
    raise exception 'Integration gateway gate failure: browser updated service-owned outbox.';
  exception when insufficient_privilege then null;
  end;

  begin
    update public.integration_connectors
    set public_config='{"api_key":"do-not-store"}'::jsonb,
        updated_by='31000000-0000-4000-8000-000000000003'
    where id=v_connector;
    raise exception 'Integration gateway gate failure: secret-like config was accepted.';
  exception when insufficient_privilege then null;
  end;
end
$integration_flow$;

reset role;

rollback;

select 'CEAC OS Stage 1G integration gateway gate passed' as result;
