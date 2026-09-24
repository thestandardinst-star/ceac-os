-- Experience Stage 8 gate: a rejected Check stops the workflow and the reviewed RPC stays hardened.
\set ON_ERROR_STOP on

do $gate$
declare
  v_def text;
begin
  if to_regprocedure('public.complete_workflow_step(uuid,text,text)') is null then
    raise exception 'Stage 8 interface gate failure: complete_workflow_step is missing.';
  end if;

  select pg_get_functiondef('public.complete_workflow_step(uuid,text,text)'::regprocedure)
    into v_def;

  if v_def not ilike '%not_approved%'
     or v_def not ilike '%state=''cancelled''%'
     or v_def not ilike '%state=''skipped''%'
     or v_def not ilike '%workflow.cancelled%' then
    raise exception 'Stage 8 interface gate failure: rejection does not cancel the run and skip later checks.';
  end if;

  if not (select p.prosecdef from pg_proc p where p.oid='public.complete_workflow_step(uuid,text,text)'::regprocedure) then
    raise exception 'Stage 8 interface gate failure: the reviewed workflow RPC changed security mode.';
  end if;

  if not has_function_privilege('authenticated','public.complete_workflow_step(uuid,text,text)','EXECUTE')
     or has_function_privilege('anon','public.complete_workflow_step(uuid,text,text)','EXECUTE') then
    raise exception 'Stage 8 interface gate failure: workflow RPC execution grants are wrong.';
  end if;
end
$gate$;
