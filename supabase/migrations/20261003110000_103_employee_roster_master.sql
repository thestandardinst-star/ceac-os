-- 103 — ERC1: employee master roster independent of authenticated profiles.
-- Employee identity is now representable without an auth account. Existing profiles
-- are linked into the roster, while roster-only and identity-review records remain valid.
-- Organisational representation is separated from capability/authority grants.

create table if not exists public.employee_roster(
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete restrict,
  profile_id uuid unique references public.profiles(id) on delete set null,
  full_name text not null check(length(btrim(full_name)) between 2 and 180),
  preferred_name text,
  source_display_name text,
  source_department_text text,
  source_position text,
  job_title text,
  employment_type text not null default 'not_recorded'
    check(employment_type in ('permanent','fixed_term','volunteer','not_recorded')),
  employment_status text not null default 'active'
    check(employment_status in ('active','inactive','exited')),
  identity_state text not null default 'roster_only'
    check(identity_state in ('linked','roster_only','needs_review')),
  responsibility_context jsonb not null default '[]'::jsonb
    check(jsonb_typeof(responsibility_context)='array'),
  source_system text,
  source_row_key text,
  review_note text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  check(
    (profile_id is not null and identity_state='linked')
    or
    (profile_id is null and identity_state in ('roster_only','needs_review'))
  )
);

create unique index if not exists employee_roster_source_uidx
  on public.employee_roster(org_id,source_system,source_row_key)
  where source_system is not null and source_row_key is not null;

create index if not exists employee_roster_org_name_idx
  on public.employee_roster(org_id,employment_status,full_name);

create index if not exists employee_roster_identity_idx
  on public.employee_roster(org_id,identity_state,full_name);

create table if not exists public.employee_unit_memberships(
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete restrict,
  employee_id uuid not null references public.employee_roster(id) on delete cascade,
  unit_id uuid not null references public.units(id) on delete restrict,
  is_primary boolean not null default false,
  context_label text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  unique(employee_id,unit_id)
);

create unique index if not exists employee_unit_primary_uidx
  on public.employee_unit_memberships(employee_id)
  where is_primary;

create index if not exists employee_unit_org_unit_idx
  on public.employee_unit_memberships(org_id,unit_id,employee_id);

alter table public.employee_roster enable row level security;
alter table public.employee_unit_memberships enable row level security;

revoke all on public.employee_roster from public,anon,authenticated;
revoke all on public.employee_unit_memberships from public,anon,authenticated;

create policy employee_roster_admin_read
on public.employee_roster
for select
to authenticated
using (org_id=public.app_org_id() and public.app_is_admin());

create policy employee_unit_memberships_admin_read
on public.employee_unit_memberships
for select
to authenticated
using (org_id=public.app_org_id() and public.app_is_admin());

grant select on public.employee_roster to authenticated;
grant select on public.employee_unit_memberships to authenticated;
grant select,insert,update,delete on public.employee_roster to service_role;
grant select,insert,update,delete on public.employee_unit_memberships to service_role;

create or replace function public.employee_roster_validate_unit()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  v_employee_org uuid;
  v_unit_org uuid;
begin
  select org_id into v_employee_org
  from public.employee_roster
  where id=new.employee_id;

  select org_id into v_unit_org
  from public.units
  where id=new.unit_id;

  if v_employee_org is null or v_unit_org is null
     or new.org_id is distinct from v_employee_org
     or new.org_id is distinct from v_unit_org then
    raise exception 'Employee roster membership must stay inside one organisation.'
      using errcode='42501';
  end if;

  return new;
end;
$$;

revoke all on function public.employee_roster_validate_unit() from public,anon,authenticated;

drop trigger if exists employee_unit_memberships_org_guard on public.employee_unit_memberships;
create trigger employee_unit_memberships_org_guard
before insert or update on public.employee_unit_memberships
for each row execute function public.employee_roster_validate_unit();

-- Audit roster changes without treating ordinary employee representation as authority.
drop trigger if exists audit_employee_roster on public.employee_roster;
create trigger audit_employee_roster
after insert or update or delete on public.employee_roster
for each row execute function public.platform_audit_capture('employee_roster','id','profile_id');

drop trigger if exists audit_employee_unit_memberships on public.employee_unit_memberships;
create trigger audit_employee_unit_memberships
after insert or update or delete on public.employee_unit_memberships
for each row execute function public.platform_audit_capture('employee_unit_membership','id','');

-- Existing authenticated people become linked employees. This backfill is idempotent
-- and does not change any account, membership, capability or authority.
insert into public.employee_roster(
  org_id,profile_id,full_name,preferred_name,job_title,employment_type,
  employment_status,identity_state,source_system,source_row_key
)
select
  p.org_id,
  p.id,
  p.full_name,
  p.preferred_name,
  p.job_title,
  case
    when lower(replace(coalesce(p.contract_type,''),'-','_'))='permanent' then 'permanent'
    when lower(replace(coalesce(p.contract_type,''),'-','_')) in ('fixed_term','fixed term') then 'fixed_term'
    when lower(coalesce(p.contract_type,''))='volunteer' then 'volunteer'
    else 'not_recorded'
  end,
  case when p.active then 'active' else 'inactive' end,
  'linked',
  'profile_backfill',
  p.id::text
from public.profiles p
on conflict(profile_id) do update set
  full_name=excluded.full_name,
  preferred_name=excluded.preferred_name,
  job_title=excluded.job_title,
  employment_type=excluded.employment_type,
  employment_status=excluded.employment_status,
  identity_state='linked',
  updated_at=now();

with ranked as (
  select
    er.org_id,
    er.id employee_id,
    um.unit_id,
    row_number() over (
      partition by er.id
      order by
        case when emp.unit_id=um.unit_id then 0 else 1 end,
        case when um.role='manager' then 0 else 1 end,
        um.created_at,
        um.id
    ) as rn
  from public.employee_roster er
  join public.unit_memberships um
    on um.profile_id=er.profile_id and um.org_id=er.org_id
  left join public.employment_records emp
    on emp.profile_id=er.profile_id and emp.org_id=er.org_id
  where er.profile_id is not null
)
insert into public.employee_unit_memberships(
  org_id,employee_id,unit_id,is_primary,context_label
)
select org_id,employee_id,unit_id,(rn=1),'Linked profile membership'
from ranked
on conflict(employee_id,unit_id) do update set
  is_primary=excluded.is_primary,
  context_label=excluded.context_label,
  updated_at=now();

create or replace function public.admin_employee_roster_summary()
returns jsonb
language plpgsql
security invoker
set search_path=public
as $$
declare
  v_org uuid:=public.app_org_id();
begin
  if auth.uid() is null or not public.app_is_admin() then
    raise exception 'Only Administration & HR can view the employee roster.'
      using errcode='42501';
  end if;

  return coalesce((
    select jsonb_agg(to_jsonb(x) order by x.full_name)
    from (
      select
        er.id,
        er.profile_id,
        er.full_name,
        er.preferred_name,
        er.source_display_name,
        er.source_department_text,
        er.source_position,
        er.job_title,
        er.employment_type,
        er.employment_status,
        er.identity_state,
        er.responsibility_context,
        er.review_note,
        p.email as account_email,
        p.active as account_active,
        coalesce(p.is_admin,false) as is_admin,
        coalesce(p.is_exec,false) as is_exec,
        exists(select 1 from public.unit_memberships um where um.profile_id=er.profile_id and um.role='manager') as is_operational_manager,
        coalesce((
          select jsonb_agg(
            jsonb_build_object(
              'unit_id',eum.unit_id,
              'unit_name',u.name,
              'is_primary',eum.is_primary,
              'context_label',eum.context_label
            )
            order by eum.is_primary desc,u.name
          )
          from public.employee_unit_memberships eum
          join public.units u on u.id=eum.unit_id
          where eum.employee_id=er.id and eum.org_id=er.org_id
        ),'[]'::jsonb) as units
      from public.employee_roster er
      left join public.profiles p on p.id=er.profile_id and p.org_id=er.org_id
      where er.org_id=v_org
    ) x
  ),'[]'::jsonb);
end;
$$;

revoke all on function public.admin_employee_roster_summary() from public,anon;
grant execute on function public.admin_employee_roster_summary() to authenticated,service_role;

create or replace function public.admin_employee_roster_detail(p_employee_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path=public
as $$
declare
  v_org uuid:=public.app_org_id();
  v_employee jsonb;
  v_profile uuid;
begin
  if auth.uid() is null or not public.app_is_admin() then
    raise exception 'Only Administration & HR can view the employee roster.'
      using errcode='42501';
  end if;

  select er.profile_id,to_jsonb(x)
  into v_profile,v_employee
  from (
    select
      er.id,
      er.profile_id,
      er.full_name,
      er.preferred_name,
      er.source_display_name,
      er.source_department_text,
      er.source_position,
      er.job_title,
      er.employment_type,
      er.employment_status,
      er.identity_state,
      er.responsibility_context,
      er.review_note,
      p.email as account_email,
      p.phone as account_phone,
      p.active as account_active,
      p.is_admin,
      p.is_exec
    from public.employee_roster er
    left join public.profiles p on p.id=er.profile_id and p.org_id=er.org_id
    where er.id=p_employee_id and er.org_id=v_org
  ) x
  join public.employee_roster er on er.id=x.id;

  if v_employee is null then
    raise exception 'Employee roster record not found.' using errcode='42501';
  end if;

  return jsonb_build_object(
    'employee',v_employee,
    'units',coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'unit_id',eum.unit_id,
          'unit_name',u.name,
          'is_primary',eum.is_primary,
          'context_label',eum.context_label
        )
        order by eum.is_primary desc,u.name
      )
      from public.employee_unit_memberships eum
      join public.units u on u.id=eum.unit_id
      where eum.employee_id=p_employee_id and eum.org_id=v_org
    ),'[]'::jsonb),
    'operational_profile_id',v_profile,
    'operational_data_available',(v_profile is not null)
  );
end;
$$;

revoke all on function public.admin_employee_roster_detail(uuid) from public,anon;
grant execute on function public.admin_employee_roster_detail(uuid) to authenticated,service_role;

create or replace function public.admin_employee_roster_save(
  p_employee_id uuid,
  p_full_name text,
  p_job_title text default null,
  p_employment_type text default 'not_recorded',
  p_employment_status text default 'active',
  p_identity_state text default 'roster_only',
  p_responsibility_context jsonb default '[]'::jsonb,
  p_source_system text default null,
  p_source_row_key text default null,
  p_review_note text default null
)
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  v_org uuid:=public.app_org_id();
  v_actor uuid:=auth.uid();
  v_id uuid:=p_employee_id;
begin
  if v_actor is null or not public.app_is_admin() then
    raise exception 'Only Administration & HR can change the employee roster.'
      using errcode='42501';
  end if;

  if nullif(btrim(coalesce(p_full_name,'')),'') is null then
    raise exception 'Employee name is required.';
  end if;
  if p_identity_state not in ('roster_only','needs_review') then
    raise exception 'Use the explicit profile-link action to create a linked employee.';
  end if;
  if p_employment_type not in ('permanent','fixed_term','volunteer','not_recorded')
     or p_employment_status not in ('active','inactive','exited')
     or jsonb_typeof(coalesce(p_responsibility_context,'[]'::jsonb))<>'array' then
    raise exception 'Employee roster state is invalid.';
  end if;

  if v_id is null then
    insert into public.employee_roster(
      org_id,full_name,job_title,employment_type,employment_status,identity_state,
      responsibility_context,source_system,source_row_key,review_note,created_by,updated_by
    ) values (
      v_org,btrim(p_full_name),nullif(btrim(coalesce(p_job_title,'')),''),
      p_employment_type,p_employment_status,p_identity_state,
      coalesce(p_responsibility_context,'[]'::jsonb),
      nullif(btrim(coalesce(p_source_system,'')),''),
      nullif(btrim(coalesce(p_source_row_key,'')),''),
      nullif(btrim(coalesce(p_review_note,'')),''),
      v_actor,v_actor
    ) returning id into v_id;
  else
    update public.employee_roster
    set full_name=btrim(p_full_name),
        job_title=nullif(btrim(coalesce(p_job_title,'')),''),
        employment_type=p_employment_type,
        employment_status=p_employment_status,
        identity_state=p_identity_state,
        responsibility_context=coalesce(p_responsibility_context,'[]'::jsonb),
        source_system=coalesce(nullif(btrim(coalesce(p_source_system,'')),''),source_system),
        source_row_key=coalesce(nullif(btrim(coalesce(p_source_row_key,'')),''),source_row_key),
        review_note=nullif(btrim(coalesce(p_review_note,'')),''),
        updated_by=v_actor,
        updated_at=now()
    where id=v_id and org_id=v_org and profile_id is null;

    if not found then
      raise exception 'Roster-only employee record not found or already linked.'
        using errcode='42501';
    end if;
  end if;

  return v_id;
end;
$$;

revoke all on function public.admin_employee_roster_save(uuid,text,text,text,text,text,jsonb,text,text,text) from public,anon,authenticated;
grant execute on function public.admin_employee_roster_save(uuid,text,text,text,text,text,jsonb,text,text,text) to service_role;

create or replace function public.admin_employee_link_profile(
  p_employee_id uuid,
  p_profile_id uuid,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare
  v_org uuid:=public.app_org_id();
  v_actor uuid:=auth.uid();
begin
  if v_actor is null or not public.app_is_admin() then
    raise exception 'Only Administration & HR can link an employee to an account.'
      using errcode='42501';
  end if;
  if nullif(btrim(coalesce(p_reason,'')),'') is null or length(btrim(p_reason))<3 then
    raise exception 'A link reason is required.';
  end if;
  if not exists(select 1 from public.profiles p where p.id=p_profile_id and p.org_id=v_org) then
    raise exception 'That account does not belong to this organisation.'
      using errcode='42501';
  end if;
  if exists(
    select 1 from public.employee_roster er
    where er.profile_id=p_profile_id and er.id<>p_employee_id
  ) then
    raise exception 'That account is already linked to another employee record.'
      using errcode='42501';
  end if;

  update public.employee_roster er
  set profile_id=p_profile_id,
      identity_state='linked',
      review_note=nullif(btrim(p_reason),''),
      updated_by=v_actor,
      updated_at=now()
  where er.id=p_employee_id and er.org_id=v_org and er.profile_id is null;

  if not found then
    raise exception 'Employee roster record was not available for linking.'
      using errcode='42501';
  end if;
end;
$$;

revoke all on function public.admin_employee_link_profile(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.admin_employee_link_profile(uuid,uuid,text) to service_role;

create or replace function public.admin_employee_set_units(
  p_employee_id uuid,
  p_unit_ids uuid[],
  p_primary_unit_id uuid default null
)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare
  v_org uuid:=public.app_org_id();
  v_actor uuid:=auth.uid();
  v_unit uuid;
begin
  if v_actor is null or not public.app_is_admin() then
    raise exception 'Only Administration & HR can change employee organisational memberships.'
      using errcode='42501';
  end if;
  if not exists(select 1 from public.employee_roster er where er.id=p_employee_id and er.org_id=v_org) then
    raise exception 'Employee roster record not found.' using errcode='42501';
  end if;
  if p_primary_unit_id is not null and not (p_primary_unit_id=any(coalesce(p_unit_ids,'{}'::uuid[]))) then
    raise exception 'Primary unit must be included in the employee unit list.';
  end if;

  foreach v_unit in array coalesce(p_unit_ids,'{}'::uuid[])
  loop
    if not exists(select 1 from public.units u where u.id=v_unit and u.org_id=v_org and u.active) then
      raise exception 'Employee unit selection contains an invalid organisation unit.'
        using errcode='42501';
    end if;
  end loop;

  delete from public.employee_unit_memberships
  where employee_id=p_employee_id and org_id=v_org;

  foreach v_unit in array coalesce(p_unit_ids,'{}'::uuid[])
  loop
    insert into public.employee_unit_memberships(
      org_id,employee_id,unit_id,is_primary,context_label,created_by,updated_by
    ) values (
      v_org,p_employee_id,v_unit,(v_unit=p_primary_unit_id),'Roster organisational membership',v_actor,v_actor
    );
  end loop;
end;
$$;

revoke all on function public.admin_employee_set_units(uuid,uuid[],uuid) from public,anon,authenticated;
grant execute on function public.admin_employee_set_units(uuid,uuid[],uuid) to service_role;

comment on table public.employee_roster is
  'Canonical employee representation independent of authentication. profile_id is optional and never fabricated.';
comment on table public.employee_unit_memberships is
  'Employee organisational membership for roster representation only. This table does not grant application authority.';
