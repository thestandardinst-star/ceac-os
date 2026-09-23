\set ON_ERROR_STOP on

begin;

-- Closure hardening: finance authority helpers may never reveal another org.
do $$
declare body text;
begin
  select pg_get_functiondef('public.finance_request_path(bigint,text,uuid)'::regprocedure) into body;
  if body not ilike '%app_org_id()%' then
    raise exception 'Hardening gate: finance_request_path is not bound to the caller organisation.';
  end if;
end $$;

do $$
begin
  if has_function_privilege('authenticated','public.finance_request_path(bigint,text,uuid)','EXECUTE') then
    raise exception 'Hardening gate: finance_request_path must remain server-internal.';
  end if;
end $$;

-- Cancelling a request is a state transition, not permission to rewrite facts.
do $$
begin
  if not exists (
    select 1
    from pg_trigger t
    join pg_class c on c.oid=t.tgrelid
    join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public'
      and c.relname='finance_requests'
      and t.tgname='finance_request_cancel_guard'
      and not t.tgisinternal
  ) then
    raise exception 'Hardening gate: finance request cancellation immutability trigger is missing.';
  end if;
end $$;

-- Budget position must net append-only reversal entries.
do $$
declare body text;
begin
  select pg_get_functiondef('public.unit_budget_position(uuid,integer)'::regprocedure) into body;
  if body not ilike '%reverses_id%' then
    raise exception 'Hardening gate: unit_budget_position does not account for spend reversals.';
  end if;
end $$;

-- Browser security boundary: no anonymous SECURITY DEFINER RPC.
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
    raise exception 'Hardening gate: % SECURITY DEFINER function(s) are callable by anon.',n;
  end if;
end $$;

rollback;
