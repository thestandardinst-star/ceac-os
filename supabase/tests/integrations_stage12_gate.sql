\set ON_ERROR_STOP on

begin;

do $stage12_structure$
declare n integer;
begin
  select count(*) into n
  from pg_class c
  join pg_namespace ns on ns.oid=c.relnamespace
  where ns.nspname='public'
    and c.relname in (
      'integration_provider_definitions',
      'integration_connection_events',
      'integration_delivery_attempts',
      'integration_inbound_events'
    )
    and c.relkind='r'
    and c.relrowsecurity;
  if n<>4 then
    raise exception 'Stage 12 gate failure: expected 4 Stage 12 public RLS tables, found %.',n;
  end if;

  if not exists(select 1 from pg_namespace where nspname='integration_private') then
    raise exception 'Stage 12 gate failure: integration_private schema is missing.';
  end if;

  if has_schema_privilege('anon','integration_private','USAGE')
     or has_schema_privilege('authenticated','integration_private','USAGE') then
    raise exception 'Stage 12 gate failure: browser roles can use integration_private.';
  end if;
end
$stage12_structure$;

do $stage12_secret_surface$
declare n integer;
begin
  select count(*) into n
  from information_schema.columns
  where table_schema='public'
    and table_name like 'integration_%'
    and column_name ~* '(secret|token|password|api.?key|private.?key|credential)';
  if n<>0 then
    raise exception 'Stage 12 gate failure: public integration table contains secret-like columns.';
  end if;

  if has_function_privilege('authenticated','public.integration_service_store_secret(uuid,text,text,text)','EXECUTE')
     or has_function_privilege('authenticated','public.integration_service_read_secret(uuid)','EXECUTE')
     or has_function_privilege('authenticated','public.integration_service_delete_secret(uuid)','EXECUTE')
     or has_function_privilege('authenticated','public.integration_service_claim_outbox(integer)','EXECUTE')
     or has_function_privilege('authenticated','public.integration_service_finish_delivery(uuid,uuid,boolean,boolean,integer,text,text)','EXECUTE')
     or has_function_privilege('anon','public.integration_service_read_secret(uuid)','EXECUTE') then
    raise exception 'Stage 12 gate failure: browser role can execute service-owned integration function.';
  end if;

  if has_table_privilege('authenticated','public.integration_connectors','INSERT')
     or has_table_privilege('authenticated','public.integration_connectors','UPDATE')
     or has_table_privilege('authenticated','public.integration_subscriptions','INSERT')
     or has_table_privilege('authenticated','public.integration_subscriptions','UPDATE')
     or has_table_privilege('authenticated','public.integration_outbox','UPDATE') then
    raise exception 'Stage 12 gate failure: browser can mutate hardened connector/subscription/queue state directly.';
  end if;
end
$stage12_secret_surface$;

-- Staff cannot see provider administration.
set local role authenticated;
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000001',true);

do $stage12_staff_denied$
declare n integer;
begin
  select count(*) into n from public.integration_provider_definitions;
  if n<>0 then
    raise exception 'Stage 12 gate failure: Staff can read provider administration catalogue.';
  end if;

  begin
    insert into public.integration_connectors(
      org_id,connector_key,connector_type,display_name,enabled,public_config,
      provider_key,created_by,updated_by
    ) values (
      '10000000-0000-4000-8000-000000000010',
      'staff-stage12-probe','custom','Staff probe',false,'{}','telegram',
      '31000000-0000-4000-8000-000000000001',
      '31000000-0000-4000-8000-000000000001'
    );
    raise exception 'Stage 12 gate failure: Staff created a connector directly.';
  exception when insufficient_privilege then null;
  end;
end
$stage12_staff_denied$;

reset role;

-- Administration can read the provider catalogue but still cannot bypass the Edge/service boundary.
set local role authenticated;
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000003',true);

do $stage12_admin_boundary$
declare n integer;
begin
  select count(*) into n
  from public.integration_provider_definitions
  where provider_key='telegram' and active;
  if n<>1 then
    raise exception 'Stage 12 gate failure: Telegram provider definition is not visible to integration manager.';
  end if;

  begin
    update public.integration_connectors
    set connection_state='connected'
    where org_id='10000000-0000-4000-8000-000000000010';
    raise exception 'Stage 12 gate failure: Administration bypassed service-owned connection transition.';
  exception when insufficient_privilege then null;
  end;
end
$stage12_admin_boundary$;

reset role;

-- Service runtime creates, verifies and queues a real provider-shaped connection.
set local role service_role;

do $stage12_service_connection$
declare
  v_connector uuid;
  v_secret uuid;
  v_subscription uuid;
  v_event uuid;
  v_worker_key text;
  v_claim record;
  v_second record;
  v_inbound1 uuid;
  v_inbound2 uuid;
begin
  v_connector:=public.integration_service_upsert_connector(
    '10000000-0000-4000-8000-000000000010',
    'telegram','Telegram',
    '{"chat_id":"-100123456"}'::jsonb,
    '31000000-0000-4000-8000-000000000003'
  );

  perform public.integration_service_transition_connection(
    v_connector,'connecting','Acceptance connection initiated',
    '31000000-0000-4000-8000-000000000003',
    null,null,'{}','{}',null,'Provider verification started.'
  );

  v_secret:=public.integration_service_store_secret(
    v_connector,'telegram','123456:abcdefghijklmnopqrstuvwxyz123456','bot_token'
  );

  if v_secret is null or public.integration_service_read_secret(v_connector)
     <>'123456:abcdefghijklmnopqrstuvwxyz123456' then
    raise exception 'Stage 12 gate failure: Vault credential storage/read failed.';
  end if;

  perform public.integration_service_transition_connection(
    v_connector,'connected','Acceptance provider connected',
    '31000000-0000-4000-8000-000000000003',
    '@ceac_acceptance_bot','999',
    array['send_messages']::text[],
    array['send_notification']::text[],
    null,'Provider and destination verified.'
  );

  if not exists(
    select 1 from public.integration_connectors
    where id=v_connector
      and connection_state='connected'
      and enabled
      and advertised_capabilities=array['send_notification']::text[]
      and granted_scopes=array['send_messages']::text[]
      and public_config->>'chat_id'='-100123456'
  ) then
    raise exception 'Stage 12 gate failure: verified connection state did not persist.';
  end if;

  if not exists(
    select 1 from public.integration_connection_events
    where connector_id=v_connector
      and from_state='connecting'
      and to_state='connected'
  ) then
    raise exception 'Stage 12 gate failure: connection history is missing.';
  end if;

  v_subscription:=public.integration_service_set_subscription(
    v_connector,'policy.rule_changed',true,
    '31000000-0000-4000-8000-000000000003'
  );

  v_event:=public.platform_emit_event(
    '10000000-0000-4000-8000-000000000010',
    'policy.rule_changed',
    '31000000-0000-4000-8000-000000000003',
    null,
    'policy_rule',
    gen_random_uuid(),
    '{"sensitive_example":"must stay inside CEAC OS"}'::jsonb,
    'stage12-gate-event',
    null,null,now()
  );

  if (select count(*) from public.integration_outbox
      where connector_id=v_connector and event_id=v_event and state='pending')<>1 then
    raise exception 'Stage 12 gate failure: connected subscription did not enqueue exactly once.';
  end if;

  select * into v_claim
  from public.integration_service_claim_outbox(5)
  where connector_id=v_connector
  limit 1;

  if v_claim.outbox_id is null or v_claim.attempt_number<>1 then
    raise exception 'Stage 12 gate failure: worker could not atomically claim first attempt.';
  end if;

  perform public.integration_service_finish_delivery(
    v_claim.attempt_id,v_claim.outbox_id,false,true,503,
    'provider_unavailable','Telegram is temporarily unavailable.'
  );

  if not exists(
    select 1 from public.integration_outbox
    where id=v_claim.outbox_id and state='failed' and next_attempt_at is not null
  ) or not exists(
    select 1 from public.integration_delivery_attempts
    where id=v_claim.attempt_id and outcome='retry'
  ) then
    raise exception 'Stage 12 gate failure: retryable delivery did not preserve retry evidence.';
  end if;

  update public.integration_outbox
  set next_attempt_at=now()-interval '1 second'
  where id=v_claim.outbox_id;

  select * into v_second
  from public.integration_service_claim_outbox(5)
  where outbox_id=v_claim.outbox_id
  limit 1;

  if v_second.attempt_id is null or v_second.attempt_number<>2 then
    raise exception 'Stage 12 gate failure: retry claim did not advance attempt number.';
  end if;

  perform public.integration_service_finish_delivery(
    v_second.attempt_id,v_second.outbox_id,true,false,200,null,null
  );

  if not exists(
    select 1 from public.integration_outbox
    where id=v_claim.outbox_id and state='delivered' and delivered_at is not null
  ) or (select count(*) from public.integration_delivery_attempts where outbox_id=v_claim.outbox_id)<>2 then
    raise exception 'Stage 12 gate failure: successful retry did not close delivery with full attempt history.';
  end if;

  v_inbound1:=public.integration_service_record_inbound(
    v_connector,'tg-update-1','telegram.update','accepted',
    '{"kind":"message_received"}'::jsonb,null
  );
  v_inbound2:=public.integration_service_record_inbound(
    v_connector,'tg-update-1','telegram.update','accepted',
    '{"kind":"message_received"}'::jsonb,null
  );

  if v_inbound1<>v_inbound2
     or (select count(*) from public.integration_inbound_events
         where connector_id=v_connector and provider_event_id='tg-update-1')<>1 then
    raise exception 'Stage 12 gate failure: inbound duplicate suppression failed.';
  end if;

  select decrypted_secret into v_worker_key
  from vault.decrypted_secrets
  where name='ceac_integration_worker_key';

  if v_worker_key is null
     or not public.integration_service_verify_worker_key(v_worker_key)
     or public.integration_service_verify_worker_key('definitely-wrong') then
    raise exception 'Stage 12 gate failure: worker authentication secret verification failed.';
  end if;

  perform public.integration_service_transition_connection(
    v_connector,'revoked','Acceptance disconnect',
    '31000000-0000-4000-8000-000000000003',
    null,null,array['send_messages']::text[],
    array['send_notification']::text[],
    null,'Provider disconnected by administrator.'
  );
  perform public.integration_service_delete_secret(v_connector);

  if public.integration_service_read_secret(v_connector) is not null then
    raise exception 'Stage 12 gate failure: provider credential survived disconnect.';
  end if;

  if not exists(
    select 1 from public.integration_connectors
    where id=v_connector and connection_state='revoked' and not enabled
  ) then
    raise exception 'Stage 12 gate failure: disconnect state is not truthful.';
  end if;
end
$stage12_service_connection$;

reset role;

-- Former ordinary users still cannot inspect the connector or private credential mapping.
set local role authenticated;
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000001',true);

do $stage12_post_disconnect_isolation$
declare n integer;
begin
  select count(*) into n from public.integration_connectors
  where provider_key='telegram';
  if n<>0 then
    raise exception 'Stage 12 gate failure: Staff can inspect organisation provider connection.';
  end if;
end
$stage12_post_disconnect_isolation$;

reset role;

rollback;

select 'CEAC OS Stage 12 secure integrations gate passed' as result;
