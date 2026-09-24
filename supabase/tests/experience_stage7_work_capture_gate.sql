-- Experience Stage 7 gate: four-field work capture, staff-owned subtasks and project proposals.
\set ON_ERROR_STOP on

do $gate$
declare
  v_def text;
begin
  if to_regclass('public.project_proposals') is null then
    raise exception 'Stage 7 work-capture gate failure: project_proposals is missing.';
  end if;

  if not (select relrowsecurity from pg_class where oid='public.project_proposals'::regclass) then
    raise exception 'Stage 7 work-capture gate failure: project_proposals RLS is disabled.';
  end if;

  if has_table_privilege('anon','public.project_proposals','SELECT')
     or has_table_privilege('anon','public.project_proposals','INSERT')
     or has_table_privilege('anon','public.project_proposals','UPDATE')
     or has_table_privilege('anon','public.project_proposals','DELETE') then
    raise exception 'Stage 7 work-capture gate failure: anon can access project proposals.';
  end if;

  if exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='project_proposals' and cmd='DELETE'
  ) then
    raise exception 'Stage 7 work-capture gate failure: project proposals became deletable.';
  end if;

  if exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='checklist_items' and policyname='checklist_items_write'
  ) then
    raise exception 'Stage 7 work-capture gate failure: broad checklist mutation policy still exists.';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='checklist_items'
      and policyname='checklist_items_assignee_insert' and cmd='INSERT'
  ) then
    raise exception 'Stage 7 work-capture gate failure: assignee append-only checklist policy is missing.';
  end if;

  if exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='checklist_items'
      and policyname ilike '%assignee%' and cmd in ('UPDATE','DELETE','ALL')
  ) then
    raise exception 'Stage 7 work-capture gate failure: assignee can rewrite checklist history.';
  end if;

  if to_regprocedure('public.decide_project_proposal(uuid,text,text)') is null then
    raise exception 'Stage 7 work-capture gate failure: project proposal decision function is missing.';
  end if;

  if (select p.prosecdef from pg_proc p where p.oid='public.decide_project_proposal(uuid,text,text)'::regprocedure) then
    raise exception 'Stage 7 work-capture gate failure: project proposal decision must remain SECURITY INVOKER.';
  end if;

  if not has_function_privilege('authenticated','public.decide_project_proposal(uuid,text,text)','EXECUTE')
     or has_function_privilege('anon','public.decide_project_proposal(uuid,text,text)','EXECUTE') then
    raise exception 'Stage 7 work-capture gate failure: proposal decision grants are wrong.';
  end if;

  if has_function_privilege('authenticated','public.guard_project_proposal_update()','EXECUTE') then
    raise exception 'Stage 7 work-capture gate failure: trigger-only proposal guard became browser-callable.';
  end if;

  select pg_get_functiondef('public.create_task_with_checklist(uuid,uuid,text,text,uuid,uuid,uuid,uuid,text,text,timestamptz,text,text,text[])'::regprocedure)
    into v_def;

  if v_def not ilike '%Explain why this work matters.%'
     or v_def not ilike '%Choose when this work is due.%'
     or v_def not ilike '%Choose who is responsible.%'
     or v_def ilike '%Enter the expected result.%'
     or v_def not ilike '%nullif(btrim(coalesce(p_expected_outcome%' then
    raise exception 'Stage 7 work-capture gate failure: assigned Task no longer follows the four-field contract or expected outcome became mandatory again.';
  end if;
end
$gate$;
