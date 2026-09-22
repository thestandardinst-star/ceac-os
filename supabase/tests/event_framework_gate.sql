\set ON_ERROR_STOP on

begin;

do $event_tables$
declare n integer;
begin
  select count(*) into n
  from pg_class c
  join pg_namespace ns on ns.oid=c.relnamespace
  where ns.nspname='public'
    and c.relname in ('platform_event_definitions','platform_events')
    and c.relkind='r'
    and c.relrowsecurity;
  if n<>2 then
    raise exception 'Event framework gate failure: expected both event tables with RLS, found %.',n;
  end if;

  select count(*) into n from public.platform_event_definitions where active;
  if n<4 then
    raise exception 'Event framework gate failure: canonical event catalogue is incomplete.';
  end if;
end
$event_tables$;

do $event_privileges$
begin
  if has_table_privilege('anon','public.platform_events','SELECT')
     or has_table_privilege('anon','public.platform_events','INSERT')
     or has_table_privilege('anon','public.platform_events','UPDATE')
     or has_table_privilege('anon','public.platform_events','DELETE') then
    raise exception 'Event framework gate failure: anon has platform event privileges.';
  end if;

  if has_table_privilege('authenticated','public.platform_events','INSERT')
     or has_table_privilege('authenticated','public.platform_events','UPDATE')
     or has_table_privilege('authenticated','public.platform_events','DELETE') then
    raise exception 'Event framework gate failure: authenticated can directly mutate platform events.';
  end if;

  if has_function_privilege(
       'authenticated',
       'public.platform_emit_event(uuid,text,uuid,uuid,text,uuid,jsonb,text,uuid,uuid,timestamptz)',
       'EXECUTE'
     )
     or has_function_privilege(
       'anon',
       'public.platform_emit_event(uuid,text,uuid,uuid,text,uuid,jsonb,text,uuid,uuid,timestamptz)',
       'EXECUTE'
     ) then
    raise exception 'Event framework gate failure: internal emitter is browser executable.';
  end if;
end
$event_privileges$;

do $event_triggers$
declare n integer;
begin
  select count(*) into n
  from pg_trigger t
  join pg_class c on c.oid=t.tgrelid
  join pg_namespace ns on ns.oid=c.relnamespace
  where ns.nspname='public'
    and not t.tgisinternal
    and t.tgname in (
      'activity_events_emit_platform_event',
      'employment_history_emit_platform_event',
      'capability_grants_emit_platform_event'
    );
  if n<>3 then
    raise exception 'Event framework gate failure: expected 3 semantic event bridges, found %.',n;
  end if;

  if not exists (
    select 1 from pg_trigger t
    join pg_class c on c.oid=t.tgrelid
    join pg_namespace ns on ns.oid=c.relnamespace
    where ns.nspname='public'
      and c.relname='platform_events'
      and t.tgname='platform_events_immutable'
      and not t.tgisinternal
  ) then
    raise exception 'Event framework gate failure: event immutability trigger is missing.';
  end if;
end
$event_triggers$;

do $event_semantics$
declare
  v_org uuid:='10000000-0000-4000-8000-000000000010';
  v_actor uuid:='31000000-0000-4000-8000-000000000003';
  v_profile uuid:='31000000-0000-4000-8000-000000000001';
  v_activity uuid:=gen_random_uuid();
  v_count integer;
begin
  insert into public.activity_events(id,org_id,actor_id,verb,object_type,object_id,meta)
  values(
    v_activity,v_org,v_actor,'stage_1d_probe','profile',v_profile,'{}'::jsonb
  );

  select count(*) into v_count
  from public.platform_events
  where org_id=v_org
    and event_type='activity.recorded'
    and idempotency_key='activity:'||v_activity::text
    and actor_id=v_actor
    and subject_profile_id=v_profile;

  if v_count<>1 then
    raise exception 'Event framework gate failure: activity bridge produced % events instead of 1.',v_count;
  end if;
end
$event_semantics$;

do $event_idempotency$
declare
  v_org uuid:='10000000-0000-4000-8000-000000000010';
  v_one uuid;
  v_two uuid;
begin
  v_one:=public.platform_emit_event(
    v_org,'activity.recorded',null,null,'probe',null,
    '{"verb":"idempotency_probe"}'::jsonb,
    'stage-1d-idempotency-probe',null,null,now()
  );

  v_two:=public.platform_emit_event(
    v_org,'activity.recorded',null,null,'probe',null,
    '{"verb":"idempotency_probe"}'::jsonb,
    'stage-1d-idempotency-probe',null,null,now()
  );

  if v_one is null or v_two is null or v_one<>v_two then
    raise exception 'Event framework gate failure: idempotent emit did not return the original event.';
  end if;
end
$event_idempotency$;

do $event_immutable$
declare v_id uuid;
begin
  select id into v_id
  from public.platform_events
  order by recorded_at
  limit 1;

  begin
    update public.platform_events
    set payload=payload
    where id=v_id;
    raise exception 'Event framework gate failure: platform event update unexpectedly succeeded.';
  exception when sqlstate '42501' then
    null;
  end;

  begin
    delete from public.platform_events where id=v_id;
    raise exception 'Event framework gate failure: platform event delete unexpectedly succeeded.';
  exception when sqlstate '42501' then
    null;
  end;
end
$event_immutable$;

-- Explicit audit.view boundary.
set local role authenticated;
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000003',true);

do $admin_can_read_events$
declare n integer;
begin
  select count(*) into n
  from public.platform_events;
  if n<1 then
    raise exception 'Event framework gate failure: audit.viewer cannot read event stream.';
  end if;
end
$admin_can_read_events$;

reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000001',true);

do $staff_cannot_read_events$
declare n integer;
begin
  select count(*) into n
  from public.platform_events;
  if n<>0 then
    raise exception 'Event framework gate failure: staff without audit.view read % event(s).',n;
  end if;
end
$staff_cannot_read_events$;

reset role;

rollback;

select 'CEAC OS Stage 1D event framework gate passed' as result;
