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

  if has_table_privilege('authenticated','public.integration_connectors','INSERT')
     or has_table_privilege('authenticated','public.integration_connectors','UPDATE')
     or has_table_privilege('authenticated','public.integration_subscriptions','INSERT')
     or has_table_privilege('authenticated','public.integration_subscriptions','UPDATE')
     or has_table_privilege('authenticated','public.integration_outbox','INSERT')
     or has_table_privilege('authenticated','public.integration_outbox','UPDATE')
     or has_table_privilege('authenticated','public.integration_outbox','DELETE') then
    raise exception 'Integration gateway gate failure: hardened gateway has browser mutation privileges.';
  end if;

  if has_function_privilege('authenticated','public.integration_enqueue_event()','EXECUTE')
     or has_function_privilege('anon','public.integration_enqueue_event()','EXECUTE') then
    raise exception 'Integration gateway gate failure: internal event enqueue helper is browser executable.';
  end if;
end
$integration_privileges$;

set local role authenticated;
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000001',true);

do $integration_denied$
begin
  begin
    insert into public.integration_connectors(
      org_id,connector_key,connector_type,display_name,enabled,public_config,
      provider_key,created_by,updated_by
    ) values (
      '10000000-0000-4000-8000-000000000010',
      'staff-probe','custom','Staff Probe',false,'{}','telegram',
      '31000000-0000-4000-8000-000000000001',
      '31000000-0000-4000-8000-000000000001'
    );
    raise exception 'Integration gateway gate failure: Staff created an integration connector.';
  exception when insufficient_privilege then null;
  end;
end
$integration_denied$;

reset role;

set local role service_role;

do $integration_flow$
declare
  v_connector uuid;
  v_subscription uuid;
  v_event uuid;
  v_count integer;
begin
  v_connector:=public.integration_service_upsert_connector(
    '10000000-0000-4000-8000-000000000010',
    'telegram','Telegram','{"chat_id":"-1001"}'::jsonb,
    '31000000-0000-4000-8000-000000000003'
  );
  perform public.integration_service_transition_connection(
    v_connector,'connecting','Stage 1G hardened gateway probe',
    '31000000-0000-4000-8000-000000000003',
    null,null,'{}','{}',null,'Gateway probe.'
  );
  perform public.integration_service_transition_connection(
    v_connector,'connected','Stage 1G hardened gateway connected',
    '31000000-0000-4000-8000-000000000003',
    '@gateway_probe','1',array['send_messages']::text[],
    array['send_notification']::text[],null,'Gateway probe connected.'
  );

  v_subscription:=public.integration_service_set_subscription(
    v_connector,'policy.rule_changed',true,
    '31000000-0000-4000-8000-000000000003'
  );

  v_event:=public.platform_emit_event(
    '10000000-0000-4000-8000-000000000010',
    'policy.rule_changed',
    '31000000-0000-4000-8000-000000000003',
    null,'policy_rule',gen_random_uuid(),'{}'::jsonb,
    'stage1g-hardened-probe',null,null,now()
  );

  select count(*) into v_count
  from public.integration_outbox
  where subscription_id=v_subscription and event_id=v_event and state='pending';
  if v_count<>1 then
    raise exception 'Integration gateway gate failure: expected 1 queued delivery, found %.',v_count;
  end if;

  begin
    update public.integration_connectors
    set public_config='{"api_key":"do-not-store"}'::jsonb
    where id=v_connector;
    raise exception 'Integration gateway gate failure: secret-like config was accepted.';
  exception when insufficient_privilege then null;
  end;
end
$integration_flow$;

reset role;

rollback;

select 'CEAC OS Stage 1G integration gateway gate passed' as result;
