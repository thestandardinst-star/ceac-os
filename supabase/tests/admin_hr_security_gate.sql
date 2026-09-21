\set ON_ERROR_STOP on

begin;

-- ---------------------------------------------------------------------------
-- Baseline structural guarantees
-- ---------------------------------------------------------------------------

do $$
declare n integer;
begin
  select count(*) into n
  from pg_class c
  join pg_namespace ns on ns.oid=c.relnamespace
  where ns.nspname='public'
    and c.relkind='r'
    and not c.relrowsecurity;
  if n<>0 then
    raise exception 'Security gate failure: % public table(s) do not have RLS enabled.',n;
  end if;
end $$;

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
    raise exception 'Security gate failure: % SECURITY DEFINER function(s) are callable by anon.',n;
  end if;
end $$;

do $$
declare n integer;
begin
  select count(*) into n
  from pg_proc p
  join pg_namespace ns on ns.oid=p.pronamespace
  where ns.nspname='public'
    and p.prosecdef
    and (
      p.proconfig is null
      or not exists (
        select 1 from unnest(p.proconfig) cfg
        where cfg like 'search_path=%'
      )
    );
  if n<>0 then
    raise exception 'Security gate failure: % SECURITY DEFINER function(s) lack a fixed search_path.',n;
  end if;
end $$;

-- The accepted baseline has 68 signed-in callable SECURITY DEFINER functions.
-- Reducing this surface is allowed. Expanding it must be deliberate and this
-- gate must be reviewed/updated in the same PR.
do $$
declare n integer;
begin
  select count(*) into n
  from pg_proc p
  join pg_namespace ns on ns.oid=p.pronamespace
  where ns.nspname='public'
    and p.prosecdef
    and has_function_privilege('authenticated',p.oid,'EXECUTE');
  if n>68 then
    raise exception 'Security gate failure: authenticated SECURITY DEFINER surface grew from 68 to % without security-gate review.',n;
  end if;
end $$;

-- Migration 067 changes default privileges. Prove a new function is not
-- silently exposed to signed-in or anonymous users.
create function public.security_gate_default_probe()
returns integer
language sql
as $$ select 1 $$;

do $gate$
declare v_oid oid:='public.security_gate_default_probe()'::regprocedure::oid;
begin
  if has_function_privilege('anon',v_oid,'EXECUTE')
     or has_function_privilege('authenticated',v_oid,'EXECUTE')
     or exists (
       select 1
       from pg_proc p
       cross join lateral aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a
       where p.oid=v_oid
         and a.grantee=0
         and a.privilege_type='EXECUTE'
     ) then
    raise exception 'Security gate failure: newly created public functions still receive broad EXECUTE by default.';
  end if;
end
$gate$;

drop function public.security_gate_default_probe();

-- ---------------------------------------------------------------------------
-- HR-data boundary
-- ---------------------------------------------------------------------------

do $$
declare n integer;
begin
  select count(*) into n
  from information_schema.columns
  where table_schema='public'
    and table_name='profiles'
    and column_name ~* '(ghana|ssnit|tax|tin|bank|salary|payroll|payslip|national_id|passport|contract_(file|document)|account_number)';
  if n<>0 then
    raise exception 'Security gate failure: protected HR field(s) were added to public.profiles.';
  end if;
end $$;

do $$
declare n integer;
begin
  select count(*) into n
  from storage.buckets
  where public
    and name ~* '(hr|human.?resources|contract|payslip|payroll|salary|employee.?document|staff.?document)';
  if n<>0 then
    raise exception 'Security gate failure: an HR/protected-document Storage bucket is public.';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Role matrix using the local fixture organisation
-- ---------------------------------------------------------------------------

insert into public.organisations(id,name,short_code)
values('10000000-0000-4000-8000-000000000099','Other Security Test Org','OTHERQ');

insert into public.thresholds(org_id,name,label,value,unit_label)
values(
  '10000000-0000-4000-8000-000000000099',
  'security_probe',
  'security probe',
  777,
  'units'
);

insert into public.profile_personal_details(
  profile_id,org_id,emergency_contact_name,address_text,updated_by
) values(
  '31000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000010',
  'Private Emergency Contact',
  'Private Fixture Address',
  '31000000-0000-4000-8000-000000000001'
)
on conflict(profile_id) do update
set emergency_contact_name=excluded.emergency_contact_name,
    address_text=excluded.address_text,
    updated_by=excluded.updated_by,
    updated_at=now();

-- Staff
set local role authenticated;
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000001',true);

do $$
begin
  begin
    perform public.app_threshold(
      '10000000-0000-4000-8000-000000000099',
      'security_probe',
      0
    );
    raise exception 'Security gate failure: Staff read another organisation''s threshold.';
  exception when insufficient_privilege then null;
  end;
end $$;

do $$
begin
  begin
    perform public.admin_people_summary();
    raise exception 'Security gate failure: Staff called admin_people_summary().';
  exception when insufficient_privilege then null;
  end;
end $$;

do $$
begin
  begin
    update public.profiles
    set is_admin=true
    where id='31000000-0000-4000-8000-000000000001';
    raise exception 'Security gate failure: Staff self-promoted to Administration.';
  exception when insufficient_privilege then null;
  end;
end $$;

do $$
declare n integer;
begin
  select count(*) into n
  from public.profile_personal_details
  where profile_id='31000000-0000-4000-8000-000000000001';
  if n<>1 then
    raise exception 'Security gate failure: Staff cannot read their own private personal details.';
  end if;
end $$;

reset role;

-- Manager
set local role authenticated;
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000002',true);

do $$
begin
  begin
    perform public.admin_people_summary();
    raise exception 'Security gate failure: Manager called admin_people_summary().';
  exception when insufficient_privilege then null;
  end;
end $$;

do $$
declare n integer;
begin
  select count(*) into n
  from public.profile_personal_details
  where profile_id='31000000-0000-4000-8000-000000000001';
  if n<>0 then
    raise exception 'Security gate failure: Manager read a Staff member''s private personal details.';
  end if;
end $$;

reset role;

-- Group Pastor / Executive: leadership access must not silently become HR-private access.
set local role authenticated;
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000004',true);

do $$
begin
  begin
    perform public.admin_people_summary();
    raise exception 'Security gate failure: Executive called Administration-only People RPC.';
  exception when insufficient_privilege then null;
  end;
end $$;

do $$
declare n integer;
begin
  select count(*) into n
  from public.profile_personal_details
  where profile_id='31000000-0000-4000-8000-000000000001';
  if n<>0 then
    raise exception 'Security gate failure: Executive read HR-private personal details by default.';
  end if;
end $$;

reset role;

-- Administration & HR
set local role authenticated;
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000003',true);

do $$
declare summary jsonb;
begin
  summary:=public.admin_people_summary();
  if summary is null then
    raise exception 'Security gate failure: Administration People summary did not return.';
  end if;
end $$;

do $$
declare n integer;
begin
  select count(*) into n
  from public.profile_personal_details
  where profile_id='31000000-0000-4000-8000-000000000001';
  if n<>1 then
    raise exception 'Security gate failure: Administration cannot read protected personal details.';
  end if;
end $$;

rollback;

select 'Admin & HR security gate passed' as result;
