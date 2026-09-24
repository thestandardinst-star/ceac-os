-- Experience Stage 5 gate: project participant/payment register.
-- This gate checks authority shape, append-only ledgers, slot payment/capacity
-- enforcement and transfer-integrity hooks. Product acceptance covers the
-- end-to-end manager/leadership workflow.

\set ON_ERROR_STOP on

do $gate$
declare
  v_missing text;
  v_def text;
begin
  select string_agg(name, ', ')
    into v_missing
  from (values
    ('project_register_people'),
    ('project_register_payments'),
    ('project_register_custody_events'),
    ('project_slot_types'),
    ('project_slot_allocations')
  ) as expected(name)
  where to_regclass('public.'||name) is null;

  if v_missing is not null then
    raise exception 'Stage 5 register gate failure: missing table(s): %', v_missing;
  end if;

  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public'
      and c.relname in (
        'project_register_people','project_register_payments',
        'project_register_custody_events','project_slot_types',
        'project_slot_allocations'
      )
      and not c.relrowsecurity
  ) then
    raise exception 'Stage 5 register gate failure: every register table must have RLS enabled.';
  end if;

  if has_table_privilege('anon','public.project_register_people','SELECT')
     or has_table_privilege('anon','public.project_register_payments','SELECT')
     or has_table_privilege('anon','public.project_register_custody_events','SELECT')
     or has_table_privilege('anon','public.project_slot_types','SELECT')
     or has_table_privilege('anon','public.project_slot_allocations','SELECT') then
    raise exception 'Stage 5 register gate failure: anon can read the project register.';
  end if;

  if has_table_privilege('authenticated','public.project_register_payments','UPDATE')
     or has_table_privilege('authenticated','public.project_register_payments','DELETE')
     or has_table_privilege('authenticated','public.project_register_custody_events','UPDATE')
     or has_table_privilege('authenticated','public.project_register_custody_events','DELETE') then
    raise exception 'Stage 5 register gate failure: payment/custody ledgers are not append-only.';
  end if;

  if to_regprocedure('public.app_can_manage_project_register(uuid,uuid)') is null then
    raise exception 'Stage 5 register gate failure: project register authority helper is missing.';
  end if;

  if not has_function_privilege('authenticated','public.app_can_manage_project_register(uuid,uuid)','EXECUTE')
     or has_function_privilege('anon','public.app_can_manage_project_register(uuid,uuid)','EXECUTE') then
    raise exception 'Stage 5 register gate failure: project register authority helper grants are wrong.';
  end if;

  if (select p.prosecdef
      from pg_proc p
      where p.oid='public.app_can_manage_project_register(uuid,uuid)'::regprocedure) then
    raise exception 'Stage 5 register gate failure: project register authority helper must remain SECURITY INVOKER.';
  end if;

  if has_function_privilege('authenticated','public.guard_project_register_person()','EXECUTE')
     or has_function_privilege('authenticated','public.guard_project_register_payment()','EXECUTE')
     or has_function_privilege('authenticated','public.guard_project_register_custody()','EXECUTE')
     or has_function_privilege('authenticated','public.guard_project_slot_type()','EXECUTE')
     or has_function_privilege('authenticated','public.guard_project_slot_allocation()','EXECUTE')
     or has_function_privilege('authenticated','public.guard_internal_transfer_project()','EXECUTE')
     or has_function_privilege('authenticated','public.guard_internal_transfer_response()','EXECUTE') then
    raise exception 'Stage 5 register gate failure: trigger-only guard functions became browser-callable.';
  end if;

  select pg_get_functiondef('public.guard_project_slot_allocation()'::regprocedure)
    into v_def;
  if v_def not ilike '%Full payment is required before a slot can be allocated.%'
     or v_def not ilike '%for update%'
     or v_def not ilike '%v_active >= v_slot.capacity%' then
    raise exception 'Stage 5 register gate failure: slot allocation no longer enforces full payment and locked capacity.';
  end if;

  if not exists (
    select 1 from pg_trigger
    where tgrelid='public.internal_transfers'::regclass
      and tgname='internal_transfer_response_guard'
      and not tgisinternal
  ) then
    raise exception 'Stage 5 register gate failure: transfer immutable-facts guard is missing.';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='internal_transfers'
      and column_name='project_id'
  ) or not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='internal_transfers'
      and column_name='evidence_ref'
  ) then
    raise exception 'Stage 5 register gate failure: project/evidence remittance link is missing.';
  end if;

  if not exists (
    select 1 from pg_indexes
    where schemaname='public'
      and indexname='project_register_people_source_uidx'
  ) or not exists (
    select 1 from pg_indexes
    where schemaname='public'
      and indexname='project_register_payments_source_uidx'
  ) then
    raise exception 'Stage 5 register gate failure: later-portal import idempotency seam is missing.';
  end if;
end
$gate$;
