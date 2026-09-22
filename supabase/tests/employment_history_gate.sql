\set ON_ERROR_STOP on

begin;

do $employment_tables$
declare n integer;
begin
  select count(*) into n
  from pg_class c
  join pg_namespace ns on ns.oid=c.relnamespace
  where ns.nspname='public'
    and c.relname in ('employment_records','employment_history')
    and c.relkind='r'
    and c.relrowsecurity;
  if n<>2 then
    raise exception 'Employment history gate failure: expected both employment tables with RLS, found %.',n;
  end if;
end
$employment_tables$;

do $employment_browser_privileges$
begin
  if has_table_privilege('anon','public.employment_records','SELECT')
     or has_table_privilege('anon','public.employment_history','SELECT') then
    raise exception 'Employment history gate failure: anon can read employment data.';
  end if;

  if has_table_privilege('authenticated','public.employment_records','INSERT')
     or has_table_privilege('authenticated','public.employment_records','UPDATE')
     or has_table_privilege('authenticated','public.employment_records','DELETE')
     or has_table_privilege('authenticated','public.employment_history','INSERT')
     or has_table_privilege('authenticated','public.employment_history','UPDATE')
     or has_table_privilege('authenticated','public.employment_history','DELETE') then
    raise exception 'Employment history gate failure: authenticated has direct employment write privileges.';
  end if;
end
$employment_browser_privileges$;

do $employment_rpc_privileges$
begin
  if has_function_privilege('anon','public.admin_employment_detail(uuid)','EXECUTE')
     or has_function_privilege(
       'anon',
       'public.admin_update_employment(uuid,text,text,uuid,uuid,text,jsonb,text,date,date,text,date,text,uuid)',
       'EXECUTE'
     ) then
    raise exception 'Employment history gate failure: anon can execute Administration employment RPCs.';
  end if;

  if not has_function_privilege('authenticated','public.admin_employment_detail(uuid)','EXECUTE')
     or not has_function_privilege(
       'authenticated',
       'public.admin_update_employment(uuid,text,text,uuid,uuid,text,jsonb,text,date,date,text,date,text,uuid)',
       'EXECUTE'
     ) then
    raise exception 'Employment history gate failure: reviewed Administration employment RPC is unavailable.';
  end if;
end
$employment_rpc_privileges$;

do $employment_internal_helpers$
begin
  if has_function_privilege('authenticated','public.employment_manager_for_unit(uuid,uuid,uuid)','EXECUTE')
     or has_function_privilege('authenticated','public.employment_append_snapshot(uuid,text,date,text,uuid,uuid)','EXECUTE')
     or has_function_privilege('authenticated','public.bootstrap_employment_profile()','EXECUTE')
     or has_function_privilege('authenticated','public.sync_employment_from_profile()','EXECUTE')
     or has_function_privilege('authenticated','public.refresh_employment_managers(uuid,uuid,uuid)','EXECUTE')
     or has_function_privilege('authenticated','public.sync_employment_from_membership()','EXECUTE') then
    raise exception 'Employment history gate failure: an internal Stage 1A helper is browser executable.';
  end if;
end
$employment_internal_helpers$;

do $employment_contract$
declare n integer;
begin
  select count(*) into n
  from public.profiles p
  left join public.employment_records er on er.profile_id=p.id
  where er.profile_id is null;
  if n<>0 then
    raise exception 'Employment history gate failure: % profile(s) have no current employment record.',n;
  end if;

  select count(*) into n
  from public.profiles p
  where not exists (
    select 1 from public.employment_history eh where eh.profile_id=p.id
  );
  if n<>0 then
    raise exception 'Employment history gate failure: % profile(s) have no employment history.',n;
  end if;

  if not exists (
    select 1 from pg_trigger t
    join pg_class c on c.oid=t.tgrelid
    join pg_namespace ns on ns.oid=c.relnamespace
    where ns.nspname='public' and c.relname='profiles'
      and t.tgname='profiles_bootstrap_employment' and not t.tgisinternal
  ) then
    raise exception 'Employment history gate failure: profile bootstrap trigger is missing.';
  end if;

  if not exists (
    select 1 from pg_trigger t
    join pg_class c on c.oid=t.tgrelid
    join pg_namespace ns on ns.oid=c.relnamespace
    where ns.nspname='public' and c.relname='unit_memberships'
      and t.tgname='unit_memberships_sync_employment_history' and not t.tgisinternal
  ) then
    raise exception 'Employment history gate failure: membership history trigger is missing.';
  end if;
end
$employment_contract$;

rollback;

select 'CEAC OS Stage 1A employment history gate passed' as result;
