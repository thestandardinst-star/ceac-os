-- 075 — Stage 1A: ordinary employment current state + immutable history.
-- Protected HR/payroll data deliberately remains outside this model.

create table public.employment_records (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  org_id uuid not null references public.organisations(id) on delete cascade,
  employment_type text not null,
  job_title text,
  unit_id uuid references public.units(id) on delete set null,
  manager_profile_id uuid references public.profiles(id) on delete set null,
  membership_role text not null check (membership_role in ('manager','sub_team_lead','staff')),
  working_pattern jsonb not null default '{"kind":"not_recorded"}'::jsonb
    check (jsonb_typeof(working_pattern)='object'),
  employment_status text not null check (employment_status in ('active','inactive','exited')),
  joined_on date,
  exited_on date,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,
  check (employment_status<>'exited' or exited_on is not null)
);

create index employment_records_org_unit_idx
  on public.employment_records(org_id,unit_id);
create index employment_records_manager_idx
  on public.employment_records(manager_profile_id);

create table public.employment_history (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  change_type text not null check (change_type in (
    'baseline_import','joined','employment_details_changed','transferred','promoted',
    'manager_changed','role_changed','working_pattern_changed','status_changed',
    'exit_recorded','correction'
  )),
  effective_on date not null,
  employment_type text not null,
  job_title text,
  unit_id uuid references public.units(id) on delete set null,
  manager_profile_id uuid references public.profiles(id) on delete set null,
  membership_role text not null check (membership_role in ('manager','sub_team_lead','staff')),
  working_pattern jsonb not null default '{"kind":"not_recorded"}'::jsonb
    check (jsonb_typeof(working_pattern)='object'),
  employment_status text not null check (employment_status in ('active','inactive','exited')),
  joined_on date,
  exited_on date,
  reason text,
  actor_id uuid references public.profiles(id) on delete set null,
  correction_of uuid references public.employment_history(id) on delete restrict,
  created_at timestamptz not null default now(),
  check (employment_status<>'exited' or exited_on is not null)
);

create index employment_history_profile_effective_idx
  on public.employment_history(profile_id,effective_on desc,created_at desc);
create index employment_history_org_idx
  on public.employment_history(org_id,created_at desc);

alter table public.employment_records enable row level security;
alter table public.employment_history enable row level security;

create policy employment_records_read
on public.employment_records
for select
to authenticated
using (
  org_id=public.app_org_id()
  and (
    profile_id=auth.uid()
    or public.app_is_admin()
    or unit_id in (select public.app_managed_units())
  )
);

create policy employment_history_read
on public.employment_history
for select
to authenticated
using (
  org_id=public.app_org_id()
  and (
    profile_id=auth.uid()
    or public.app_is_admin()
    or unit_id in (select public.app_managed_units())
  )
);

revoke all on public.employment_records from anon;
revoke all on public.employment_history from anon;
revoke insert,update,delete on public.employment_records from authenticated;
revoke insert,update,delete on public.employment_history from authenticated;
grant select on public.employment_records to authenticated;
grant select on public.employment_history to authenticated;

create or replace function public.employment_manager_for_unit(
  p_org_id uuid,
  p_unit_id uuid,
  p_profile_id uuid default null
)
returns uuid
language sql
stable
security definer
set search_path=public
as $$
  select um.profile_id
  from public.unit_memberships um
  join public.profiles p on p.id=um.profile_id
  where um.org_id=p_org_id
    and um.unit_id=p_unit_id
    and um.role='manager'
    and p.active
    and (p_profile_id is null or um.profile_id<>p_profile_id)
  order by um.created_at,um.profile_id
  limit 1;
$$;

revoke all on function public.employment_manager_for_unit(uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function public.employment_manager_for_unit(uuid,uuid,uuid) to service_role;

create or replace function public.employment_append_snapshot(
  p_profile_id uuid,
  p_change_type text,
  p_effective_on date,
  p_reason text,
  p_actor_id uuid,
  p_correction_of uuid default null
)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  v_record public.employment_records;
  v_id uuid;
begin
  select * into v_record
  from public.employment_records
  where profile_id=p_profile_id;

  if v_record.profile_id is null then
    raise exception 'Employment record not found.';
  end if;

  insert into public.employment_history(
    org_id,profile_id,change_type,effective_on,employment_type,job_title,
    unit_id,manager_profile_id,membership_role,working_pattern,
    employment_status,joined_on,exited_on,reason,actor_id,correction_of
  ) values (
    v_record.org_id,v_record.profile_id,p_change_type,p_effective_on,
    v_record.employment_type,v_record.job_title,v_record.unit_id,
    v_record.manager_profile_id,v_record.membership_role,v_record.working_pattern,
    v_record.employment_status,v_record.joined_on,v_record.exited_on,
    nullif(btrim(coalesce(p_reason,'')),''),p_actor_id,p_correction_of
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.employment_append_snapshot(uuid,text,date,text,uuid,uuid) from public,anon,authenticated;
grant execute on function public.employment_append_snapshot(uuid,text,date,text,uuid,uuid) to service_role;

create or replace function public.bootstrap_employment_profile()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  v_joined date:=coalesce(new.started_on,new.joined_at);
begin
  insert into public.employment_records(
    profile_id,org_id,employment_type,job_title,unit_id,manager_profile_id,
    membership_role,working_pattern,employment_status,joined_on,exited_on,
    updated_by
  ) values (
    new.id,new.org_id,coalesce(nullif(btrim(new.contract_type),''),'not_recorded'),
    new.job_title,null,null,'staff','{"kind":"not_recorded"}'::jsonb,
    case when new.active then 'active' else 'inactive' end,
    v_joined,null,new.id
  )
  on conflict(profile_id) do nothing;

  if found then
    perform public.employment_append_snapshot(
      new.id,
      case when v_joined is not null then 'joined' else 'baseline_import' end,
      coalesce(v_joined,current_date),
      'Employment record created from CEAC profile.',
      new.id,
      null
    );
  end if;
  return new;
end;
$$;

revoke all on function public.bootstrap_employment_profile() from public,anon,authenticated;

drop trigger if exists profiles_bootstrap_employment on public.profiles;
create trigger profiles_bootstrap_employment
after insert on public.profiles
for each row execute function public.bootstrap_employment_profile();

-- Bootstrap the current ordinary-employment state for existing profiles.
insert into public.employment_records(
  profile_id,org_id,employment_type,job_title,unit_id,manager_profile_id,
  membership_role,working_pattern,employment_status,joined_on,exited_on,updated_by
)
select
  p.id,
  p.org_id,
  coalesce(nullif(btrim(p.contract_type),''),'not_recorded'),
  p.job_title,
  primary_membership.unit_id,
  case
    when primary_membership.role='manager' then null
    else public.employment_manager_for_unit(p.org_id,primary_membership.unit_id,p.id)
  end,
  coalesce(primary_membership.role,'staff'),
  '{"kind":"not_recorded"}'::jsonb,
  case when p.active then 'active' else 'inactive' end,
  coalesce(p.started_on,p.joined_at),
  null,
  null
from public.profiles p
left join lateral (
  select um.unit_id,um.role
  from public.unit_memberships um
  where um.profile_id=p.id and um.org_id=p.org_id
  order by case when um.role='manager' then 0 else 1 end,um.created_at
  limit 1
) primary_membership on true
on conflict(profile_id) do nothing;

insert into public.employment_history(
  org_id,profile_id,change_type,effective_on,employment_type,job_title,unit_id,
  manager_profile_id,membership_role,working_pattern,employment_status,
  joined_on,exited_on,reason,actor_id
)
select
  er.org_id,er.profile_id,'baseline_import',
  coalesce(er.joined_on,current_date),er.employment_type,er.job_title,er.unit_id,
  er.manager_profile_id,er.membership_role,er.working_pattern,er.employment_status,
  er.joined_on,er.exited_on,
  'Stage 1A baseline imported from the existing CEAC employee record.',
  null
from public.employment_records er
where not exists (
  select 1 from public.employment_history eh where eh.profile_id=er.profile_id
);

create or replace function public.sync_employment_from_profile()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  v_actor uuid:=auth.uid();
  v_kind text:='employment_details_changed';
begin
  if current_setting('ceac.employment_sync',true)='skip' then
    return new;
  end if;

  if old.job_title is not distinct from new.job_title
     and old.contract_type is not distinct from new.contract_type
     and old.active is not distinct from new.active
     and old.started_on is not distinct from new.started_on
     and old.joined_at is not distinct from new.joined_at then
    return new;
  end if;

  if old.active is distinct from new.active then
    v_kind:='status_changed';
  elsif old.job_title is distinct from new.job_title then
    v_kind:='promoted';
  end if;

  update public.employment_records er
  set employment_type=coalesce(nullif(btrim(new.contract_type),''),'not_recorded'),
      job_title=new.job_title,
      employment_status=case when new.active then 'active' else 'inactive' end,
      joined_on=coalesce(new.started_on,new.joined_at,er.joined_on),
      updated_at=now(),
      updated_by=v_actor
  where er.profile_id=new.id;

  perform public.employment_append_snapshot(
    new.id,v_kind,current_date,
    'Employment history synchronised from an existing official profile change.',
    v_actor,null
  );

  return new;
end;
$$;

revoke all on function public.sync_employment_from_profile() from public,anon,authenticated;

drop trigger if exists profiles_sync_employment_history on public.profiles;
create trigger profiles_sync_employment_history
after update of job_title,contract_type,active,started_on,joined_at on public.profiles
for each row execute function public.sync_employment_from_profile();

create or replace function public.refresh_employment_managers(
  p_org_id uuid,
  p_unit_id uuid,
  p_actor_id uuid
)
returns void
language plpgsql
security definer
set search_path=public
as $$
declare
  r record;
  v_manager uuid;
begin
  if p_unit_id is null then return; end if;
  for r in
    select er.profile_id,er.manager_profile_id
    from public.employment_records er
    where er.org_id=p_org_id and er.unit_id=p_unit_id
  loop
    v_manager:=public.employment_manager_for_unit(p_org_id,p_unit_id,r.profile_id);
    if r.manager_profile_id is distinct from v_manager then
      update public.employment_records
      set manager_profile_id=v_manager,updated_at=now(),updated_by=p_actor_id
      where profile_id=r.profile_id;
      perform public.employment_append_snapshot(
        r.profile_id,'manager_changed',current_date,
        'Manager changed with the unit authority record.',p_actor_id,null
      );
    end if;
  end loop;
end;
$$;

revoke all on function public.refresh_employment_managers(uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function public.refresh_employment_managers(uuid,uuid,uuid) to service_role;

create or replace function public.sync_employment_from_membership()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  v_actor uuid:=auth.uid();
  v_profile uuid:=coalesce(new.profile_id,old.profile_id);
  v_org uuid:=coalesce(new.org_id,old.org_id);
  v_current public.employment_records;
  v_next_unit uuid;
  v_next_role text;
  v_kind text:='role_changed';
begin
  if current_setting('ceac.employment_sync',true)='skip' then
    if tg_op='DELETE' then return old; end if;
    return new;
  end if;

  select * into v_current
  from public.employment_records
  where profile_id=v_profile
  for update;

  if tg_op='INSERT' then
    if v_current.profile_id is not null
       and (v_current.unit_id is null or v_current.unit_id=new.unit_id) then
      update public.employment_records
      set unit_id=new.unit_id,
          membership_role=new.role,
          manager_profile_id=case
            when new.role='manager' then null
            else public.employment_manager_for_unit(v_org,new.unit_id,v_profile)
          end,
          updated_at=now(),updated_by=v_actor
      where profile_id=v_profile;
      perform public.employment_append_snapshot(
        v_profile,
        case when v_current.unit_id is distinct from new.unit_id then 'transferred' else 'role_changed' end,
        current_date,'Employment history synchronised from unit membership.',v_actor,null
      );
    end if;
    perform public.refresh_employment_managers(v_org,new.unit_id,v_actor);
    return new;
  end if;

  if tg_op='UPDATE' then
    if v_current.profile_id is not null and v_current.unit_id=old.unit_id then
      v_kind:=case
        when old.unit_id is distinct from new.unit_id then 'transferred'
        when old.role is distinct from new.role then 'role_changed'
        else 'employment_details_changed'
      end;
      update public.employment_records
      set unit_id=new.unit_id,
          membership_role=new.role,
          manager_profile_id=case
            when new.role='manager' then null
            else public.employment_manager_for_unit(v_org,new.unit_id,v_profile)
          end,
          updated_at=now(),updated_by=v_actor
      where profile_id=v_profile;
      perform public.employment_append_snapshot(
        v_profile,v_kind,current_date,
        'Employment history synchronised from unit membership.',v_actor,null
      );
    end if;
    perform public.refresh_employment_managers(v_org,old.unit_id,v_actor);
    if new.unit_id is distinct from old.unit_id then
      perform public.refresh_employment_managers(v_org,new.unit_id,v_actor);
    end if;
    return new;
  end if;

  if tg_op='DELETE' then
    if v_current.profile_id is not null and v_current.unit_id=old.unit_id then
      select um.unit_id,um.role into v_next_unit,v_next_role
      from public.unit_memberships um
      where um.profile_id=v_profile and um.org_id=v_org and um.id<>old.id
      order by case when um.role='manager' then 0 else 1 end,um.created_at
      limit 1;

      update public.employment_records
      set unit_id=v_next_unit,
          membership_role=coalesce(v_next_role,'staff'),
          manager_profile_id=case
            when v_next_role='manager' then null
            else public.employment_manager_for_unit(v_org,v_next_unit,v_profile)
          end,
          updated_at=now(),updated_by=v_actor
      where profile_id=v_profile;
      perform public.employment_append_snapshot(
        v_profile,'transferred',current_date,
        'Primary unit membership changed.',v_actor,null
      );
    end if;
    perform public.refresh_employment_managers(v_org,old.unit_id,v_actor);
    return old;
  end if;

  if tg_op='DELETE' then return old; end if;
  return new;
end;
$$;

revoke all on function public.sync_employment_from_membership() from public,anon,authenticated;

drop trigger if exists unit_memberships_sync_employment_history_insert on public.unit_memberships;
drop trigger if exists unit_memberships_sync_employment_history_update on public.unit_memberships;
drop trigger if exists unit_memberships_sync_employment_history_delete on public.unit_memberships;

create trigger unit_memberships_sync_employment_history_insert
after insert on public.unit_memberships
for each row execute function public.sync_employment_from_membership();

create trigger unit_memberships_sync_employment_history_update
after update of unit_id,role on public.unit_memberships
for each row execute function public.sync_employment_from_membership();

create trigger unit_memberships_sync_employment_history_delete
after delete on public.unit_memberships
for each row execute function public.sync_employment_from_membership();

create or replace function public.admin_employment_detail(p_profile_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_org uuid:=public.app_org_id();
begin
  if auth.uid() is null or not public.app_is_admin() then
    raise exception 'Only Administration & HR can view the employment record.'
      using errcode='42501';
  end if;
  if not exists (
    select 1 from public.profiles p where p.id=p_profile_id and p.org_id=v_org
  ) then
    raise exception 'That employee does not belong to your organisation.'
      using errcode='42501';
  end if;

  return jsonb_build_object(
    'current',(
      select to_jsonb(x)
      from (
        select er.profile_id,er.employment_type,er.job_title,er.unit_id,
               u.name as unit_name,er.manager_profile_id,
               mp.full_name as manager_name,er.membership_role,
               er.working_pattern,er.employment_status,
               er.joined_on,er.exited_on,er.updated_at
        from public.employment_records er
        left join public.units u on u.id=er.unit_id
        left join public.profiles mp on mp.id=er.manager_profile_id
        where er.profile_id=p_profile_id
      ) x
    ),
    'history',coalesce((
      select jsonb_agg(to_jsonb(x) order by x.effective_on desc,x.created_at desc)
      from (
        select eh.id,eh.change_type,eh.effective_on,eh.employment_type,
               eh.job_title,eh.unit_id,u.name as unit_name,
               eh.manager_profile_id,mp.full_name as manager_name,
               eh.membership_role,eh.working_pattern,eh.employment_status,
               eh.joined_on,eh.exited_on,eh.reason,eh.actor_id,
               ap.full_name as actor_name,eh.correction_of,eh.created_at
        from public.employment_history eh
        left join public.units u on u.id=eh.unit_id
        left join public.profiles mp on mp.id=eh.manager_profile_id
        left join public.profiles ap on ap.id=eh.actor_id
        where eh.profile_id=p_profile_id and eh.org_id=v_org
      ) x
    ),'[]'::jsonb)
  );
end;
$$;

revoke all on function public.admin_employment_detail(uuid) from public,anon;
grant execute on function public.admin_employment_detail(uuid) to authenticated,service_role;

create or replace function public.admin_update_employment(
  p_profile_id uuid,
  p_employment_type text,
  p_job_title text,
  p_unit_id uuid,
  p_manager_profile_id uuid,
  p_membership_role text,
  p_working_pattern jsonb,
  p_employment_status text,
  p_joined_on date,
  p_exited_on date,
  p_change_type text,
  p_effective_on date,
  p_reason text,
  p_correction_of uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_org uuid:=public.app_org_id();
  v_actor uuid:=auth.uid();
  v_current public.employment_records;
  v_event_id uuid;
begin
  if v_actor is null or not public.app_is_admin() then
    raise exception 'Only Administration & HR can record employment changes.'
      using errcode='42501';
  end if;

  if not exists (
    select 1 from public.profiles p where p.id=p_profile_id and p.org_id=v_org
  ) then
    raise exception 'That employee does not belong to your organisation.'
      using errcode='42501';
  end if;

  if nullif(btrim(coalesce(p_employment_type,'')),'') is null then
    raise exception 'Employment type is required.';
  end if;
  if p_membership_role not in ('manager','sub_team_lead','staff') then
    raise exception 'Choose a valid employment role.';
  end if;
  if p_employment_status not in ('active','inactive','exited') then
    raise exception 'Choose a valid employment status.';
  end if;
  if p_change_type not in (
    'joined','employment_details_changed','transferred','promoted',
    'manager_changed','role_changed','working_pattern_changed','status_changed',
    'exit_recorded','correction'
  ) then
    raise exception 'Choose a valid employment change type.';
  end if;
  if p_effective_on is null then
    raise exception 'Effective date is required.';
  end if;
  if jsonb_typeof(coalesce(p_working_pattern,'{}'::jsonb))<>'object' then
    raise exception 'Working pattern must be an object.';
  end if;
  if p_employment_status='exited' and p_exited_on is null then
    raise exception 'Exit date is required when employment is exited.';
  end if;
  if p_employment_status<>'exited' and p_exited_on is not null then
    raise exception 'Exit date is only valid for an exited employment record.';
  end if;

  if p_unit_id is not null and not exists (
    select 1 from public.units u where u.id=p_unit_id and u.org_id=v_org and u.active
  ) then
    raise exception 'Choose an active unit in this organisation.' using errcode='42501';
  end if;

  if p_manager_profile_id=p_profile_id then
    raise exception 'A person cannot be their own manager.';
  end if;
  if p_manager_profile_id is not null and (
    p_unit_id is null
    or not exists (
      select 1
      from public.profiles p
      join public.unit_memberships um on um.profile_id=p.id
      where p.id=p_manager_profile_id and p.org_id=v_org and p.active
        and um.unit_id=p_unit_id and um.org_id=v_org
    )
  ) then
    raise exception 'Choose a manager who belongs to the selected unit.'
      using errcode='42501';
  end if;

  if p_membership_role='manager' and p_unit_id is not null and exists (
    select 1 from public.unit_memberships um
    where um.org_id=v_org and um.unit_id=p_unit_id and um.role='manager'
      and um.profile_id<>p_profile_id
  ) then
    raise exception 'That unit already has a Unit Head. Use the Unit Head authority flow first.'
      using errcode='42501';
  end if;

  if p_correction_of is not null then
    if p_change_type<>'correction' then
      raise exception 'A corrected event must use the correction change type.';
    end if;
    if not exists (
      select 1 from public.employment_history eh
      where eh.id=p_correction_of and eh.profile_id=p_profile_id and eh.org_id=v_org
    ) then
      raise exception 'The corrected employment event was not found.'
        using errcode='42501';
    end if;
  end if;

  select * into v_current
  from public.employment_records
  where profile_id=p_profile_id
  for update;

  perform set_config('ceac.employment_sync','skip',true);

  if v_current.unit_id is distinct from p_unit_id then
    if v_current.unit_id is not null then
      delete from public.unit_memberships
      where profile_id=p_profile_id and unit_id=v_current.unit_id and org_id=v_org;
    end if;
    if p_unit_id is not null then
      insert into public.unit_memberships(org_id,profile_id,unit_id,role)
      values(v_org,p_profile_id,p_unit_id,p_membership_role)
      on conflict(profile_id,unit_id) do update set role=excluded.role;
    end if;
  elsif p_unit_id is not null then
    insert into public.unit_memberships(org_id,profile_id,unit_id,role)
    values(v_org,p_profile_id,p_unit_id,p_membership_role)
    on conflict(profile_id,unit_id) do update set role=excluded.role;
  end if;

  update public.profiles
  set job_title=nullif(btrim(coalesce(p_job_title,'')),''),
      contract_type=btrim(p_employment_type),
      active=(p_employment_status='active'),
      started_on=coalesce(started_on,p_joined_on),
      joined_at=coalesce(joined_at,p_joined_on)
  where id=p_profile_id;

  insert into public.employment_records(
    profile_id,org_id,employment_type,job_title,unit_id,manager_profile_id,
    membership_role,working_pattern,employment_status,joined_on,exited_on,
    updated_at,updated_by
  ) values (
    p_profile_id,v_org,btrim(p_employment_type),
    nullif(btrim(coalesce(p_job_title,'')),''),
    p_unit_id,p_manager_profile_id,p_membership_role,
    coalesce(p_working_pattern,'{"kind":"not_recorded"}'::jsonb),
    p_employment_status,p_joined_on,p_exited_on,now(),v_actor
  )
  on conflict(profile_id) do update set
    employment_type=excluded.employment_type,
    job_title=excluded.job_title,
    unit_id=excluded.unit_id,
    manager_profile_id=excluded.manager_profile_id,
    membership_role=excluded.membership_role,
    working_pattern=excluded.working_pattern,
    employment_status=excluded.employment_status,
    joined_on=excluded.joined_on,
    exited_on=excluded.exited_on,
    updated_at=now(),
    updated_by=v_actor;

  v_event_id:=public.employment_append_snapshot(
    p_profile_id,p_change_type,p_effective_on,p_reason,v_actor,p_correction_of
  );

  insert into public.activity_events(org_id,actor_id,verb,object_type,object_id,meta)
  values(
    v_org,v_actor,'employment_changed','profile',p_profile_id,
    jsonb_build_object(
      'employment_event_id',v_event_id,
      'change_type',p_change_type,
      'effective_on',p_effective_on
    )
  );

  return public.admin_employment_detail(p_profile_id);
end;
$$;

revoke all on function public.admin_update_employment(
  uuid,text,text,uuid,uuid,text,jsonb,text,date,date,text,date,text,uuid
) from public,anon;
grant execute on function public.admin_update_employment(
  uuid,text,text,uuid,uuid,text,jsonb,text,date,date,text,date,text,uuid
) to authenticated,service_role;
