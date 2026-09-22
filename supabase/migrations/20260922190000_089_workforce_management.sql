-- 089 — Stage 9 Workforce Management 2.0.
-- Factual schedules, attendance corrections, auditable leave lifecycle and confirmed-policy gating.

-- ---------------------------------------------------------------------------
-- Authority
-- ---------------------------------------------------------------------------

insert into public.capability_definitions(capability,label,description,sensitive)
values (
  'workforce.manage',
  'Manage workforce',
  'Administer workforce schedules, day types and confirmed leave-policy configuration.',
  true
)
on conflict(capability) do nothing;

insert into public.capability_grants(
  org_id,profile_id,capability,scope_unit_id,granted_by,grant_reason
)
select p.org_id,p.id,'workforce.manage',null,null,
       'Stage 9 baseline from existing active Administration workforce authority.'
from public.profiles p
where p.is_admin and p.active
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Workforce day types and append-only schedule versions.
-- ---------------------------------------------------------------------------

create table public.workforce_day_types(
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete restrict,
  name text not null check(length(btrim(name)) between 2 and 100),
  description text,
  session_expected boolean not null default false,
  leave_overlay_allowed boolean not null default true,
  active boolean not null default true,
  created_by uuid references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique(org_id,name)
);

create table public.workforce_schedule_versions(
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete restrict,
  schedule_key uuid not null,
  version integer not null check(version>0),
  profile_id uuid not null references public.profiles(id) on delete restrict,
  unit_id uuid references public.units(id) on delete restrict,
  effective_from date not null,
  effective_to date,
  source text not null check(source in ('person','unit','working_pattern_translation')),
  day_map jsonb not null check(jsonb_typeof(day_map)='object'),
  expected_start time,
  expected_end time,
  supersedes_id uuid references public.workforce_schedule_versions(id) on delete restrict,
  reason text not null check(length(btrim(reason)) between 3 and 600),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  check(effective_to is null or effective_to>=effective_from),
  unique(schedule_key,version)
);

create unique index workforce_schedule_supersedes_uidx
  on public.workforce_schedule_versions(supersedes_id)
  where supersedes_id is not null;
create index workforce_schedule_profile_idx
  on public.workforce_schedule_versions(org_id,profile_id,effective_from desc,created_at desc);

-- ---------------------------------------------------------------------------
-- Append-only attendance corrections.
-- ---------------------------------------------------------------------------

create table public.attendance_corrections(
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete restrict,
  profile_id uuid not null references public.profiles(id) on delete restrict,
  work_date date not null,
  work_session_id uuid references public.work_sessions(id) on delete restrict,
  correction_type text not null check(correction_type in (
    'context_note','start_time','end_time','day_type','administrative_finding','reversal'
  )),
  before_context jsonb not null default '{}'::jsonb check(jsonb_typeof(before_context)='object'),
  after_context jsonb not null default '{}'::jsonb check(jsonb_typeof(after_context)='object'),
  reason text not null check(length(btrim(reason)) between 3 and 1000),
  reverses_id uuid references public.attendance_corrections(id) on delete restrict,
  state text not null default 'effective' check(state in ('effective','reversed')),
  recorded_by uuid not null references public.profiles(id) on delete restrict,
  effective_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create unique index attendance_corrections_reversal_uidx
  on public.attendance_corrections(reverses_id)
  where reverses_id is not null;
create index attendance_corrections_profile_idx
  on public.attendance_corrections(org_id,profile_id,work_date desc,created_at desc);

-- ---------------------------------------------------------------------------
-- Auditable leave lifecycle.
-- ---------------------------------------------------------------------------

create table public.leave_request_events(
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete restrict,
  leave_request_id uuid not null references public.leave_requests(id) on delete restrict,
  profile_id uuid not null references public.profiles(id) on delete restrict,
  action text not null check(action in (
    'requested','manager_approved','escalated','admin_approved','declined',
    'cancelled_by_employee','approval_reversed','decision_corrected'
  )),
  from_status text,
  to_status text not null,
  reason text,
  actor_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index leave_request_events_request_idx
  on public.leave_request_events(leave_request_id,created_at);
create index leave_request_events_profile_idx
  on public.leave_request_events(org_id,profile_id,created_at desc);

-- ---------------------------------------------------------------------------
-- Versioned leave-policy engine. No policy is active by default.
-- ---------------------------------------------------------------------------

create table public.leave_policy_versions(
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete restrict,
  policy_key uuid not null,
  version integer not null check(version>0),
  name text not null check(length(btrim(name)) between 3 and 140),
  effective_from date not null,
  effective_to date,
  state text not null default 'draft' check(state in ('draft','active','retired')),
  supersedes_id uuid references public.leave_policy_versions(id) on delete restrict,
  source_reference text,
  reason text not null check(length(btrim(reason)) between 3 and 1000),
  confirmed_by uuid references public.profiles(id) on delete restrict,
  confirmed_at timestamptz,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  check(effective_to is null or effective_to>=effective_from),
  check(
    (state='active' and confirmed_by is not null and confirmed_at is not null)
    or state<>'active'
  ),
  unique(policy_key,version)
);

create unique index leave_policy_supersedes_uidx
  on public.leave_policy_versions(supersedes_id)
  where supersedes_id is not null;
create unique index leave_policy_one_active_org
  on public.leave_policy_versions(org_id)
  where state='active';

create table public.leave_policy_rules(
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete restrict,
  policy_version_id uuid not null references public.leave_policy_versions(id) on delete restrict,
  leave_kind text not null check(length(btrim(leave_kind)) between 2 and 60),
  employment_type text,
  entitlement_amount numeric,
  entitlement_unit text check(entitlement_unit is null or entitlement_unit in ('days','weeks','hours')),
  accrual_method text check(accrual_method is null or accrual_method in ('none','monthly','annual','manual')),
  accrual_rate numeric,
  carryover_method text check(carryover_method is null or carryover_method in ('none','limited','full','manual')),
  carryover_limit numeric,
  approval_route text not null check(approval_route in ('manager','admin','manager_then_admin')),
  opening_balance_required boolean not null default false,
  complete boolean not null default false,
  created_at timestamptz not null default now(),
  unique(policy_version_id,leave_kind,coalesce(employment_type,''))
);

-- ---------------------------------------------------------------------------
-- RLS and privileges.
-- ---------------------------------------------------------------------------

alter table public.workforce_day_types enable row level security;
alter table public.workforce_schedule_versions enable row level security;
alter table public.attendance_corrections enable row level security;
alter table public.leave_request_events enable row level security;
alter table public.leave_policy_versions enable row level security;
alter table public.leave_policy_rules enable row level security;

revoke all on public.workforce_day_types from anon;
revoke all on public.workforce_schedule_versions from anon;
revoke all on public.attendance_corrections from anon;
revoke all on public.leave_request_events from anon;
revoke all on public.leave_policy_versions from anon;
revoke all on public.leave_policy_rules from anon;

revoke insert,update,delete on public.workforce_day_types from authenticated;
revoke insert,update,delete on public.workforce_schedule_versions from authenticated;
revoke insert,update,delete on public.attendance_corrections from authenticated;
revoke insert,update,delete on public.leave_request_events from authenticated;
revoke insert,update,delete on public.leave_policy_versions from authenticated;
revoke insert,update,delete on public.leave_policy_rules from authenticated;

grant select on public.workforce_day_types to authenticated;
grant select on public.workforce_schedule_versions to authenticated;
grant select on public.attendance_corrections to authenticated;
grant select on public.leave_request_events to authenticated;
grant select on public.leave_policy_versions to authenticated;
grant select on public.leave_policy_rules to authenticated;

create policy workforce_day_types_read
on public.workforce_day_types for select to authenticated
using(org_id=public.app_org_id());

create policy workforce_schedule_read
on public.workforce_schedule_versions for select to authenticated
using(
  org_id=public.app_org_id()
  and (
    profile_id=auth.uid()
    or public.app_has_capability('workforce.manage',null)
    or unit_id in (select public.app_managed_units())
  )
);

create policy attendance_corrections_read
on public.attendance_corrections for select to authenticated
using(
  org_id=public.app_org_id()
  and (
    profile_id=auth.uid()
    or public.app_has_capability('attendance.correct',null)
    or exists(
      select 1 from public.employment_records er
      where er.profile_id=attendance_corrections.profile_id
        and er.org_id=public.app_org_id()
        and er.unit_id in (select public.app_managed_units())
    )
  )
);

create policy leave_request_events_read
on public.leave_request_events for select to authenticated
using(
  org_id=public.app_org_id()
  and (
    profile_id=auth.uid()
    or public.app_has_capability('workforce.manage',null)
    or exists(
      select 1 from public.employment_records er
      where er.profile_id=leave_request_events.profile_id
        and er.org_id=public.app_org_id()
        and er.unit_id in (select public.app_managed_units())
    )
  )
);

create policy leave_policy_versions_read
on public.leave_policy_versions for select to authenticated
using(org_id=public.app_org_id());

create policy leave_policy_rules_read
on public.leave_policy_rules for select to authenticated
using(org_id=public.app_org_id());

-- Legacy leave values are compatibility-only; browser writes and decisions now use RPCs.
drop policy if exists ls_write on public.leave_settings;
drop policy if exists lb_write on public.leave_balances;
drop policy if exists lr_insert on public.leave_requests;
drop policy if exists lr_update on public.leave_requests;

revoke insert,update,delete on public.leave_settings from authenticated;
revoke insert,update,delete on public.leave_balances from authenticated;
revoke insert,update,delete on public.leave_requests from authenticated;
grant select on public.leave_requests to authenticated;
grant select on public.leave_settings to authenticated;
grant select on public.leave_balances to authenticated;

-- ---------------------------------------------------------------------------
-- Day type + schedule administration.
-- ---------------------------------------------------------------------------

create or replace function public.workforce_record_day_type(
  p_id uuid,
  p_name text,
  p_description text,
  p_session_expected boolean,
  p_leave_overlay_allowed boolean,
  p_active boolean
)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  v_org uuid:=public.app_org_id();
  v_actor uuid:=auth.uid();
  v_id uuid:=coalesce(p_id,gen_random_uuid());
begin
  if v_actor is null or not public.app_has_capability('workforce.manage',null) then
    raise exception 'You do not have authority to manage workforce day types.' using errcode='42501';
  end if;
  if length(btrim(coalesce(p_name,'')))<2 then
    raise exception 'Day type name is required.';
  end if;

  if p_id is null then
    insert into public.workforce_day_types(
      id,org_id,name,description,session_expected,leave_overlay_allowed,active,created_by
    ) values (
      v_id,v_org,btrim(p_name),nullif(btrim(coalesce(p_description,'')),''),
      coalesce(p_session_expected,false),coalesce(p_leave_overlay_allowed,true),
      coalesce(p_active,true),v_actor
    );
  else
    update public.workforce_day_types
    set name=btrim(p_name),
        description=nullif(btrim(coalesce(p_description,'')),''),
        session_expected=coalesce(p_session_expected,false),
        leave_overlay_allowed=coalesce(p_leave_overlay_allowed,true),
        active=coalesce(p_active,true)
    where id=p_id and org_id=v_org;
    if not found then raise exception 'Day type not found.' using errcode='42501'; end if;
  end if;

  return v_id;
end;
$$;

revoke all on function public.workforce_record_day_type(uuid,text,text,boolean,boolean,boolean) from public,anon;
grant execute on function public.workforce_record_day_type(uuid,text,text,boolean,boolean,boolean)
to authenticated,service_role;

create or replace function public.workforce_record_schedule(
  p_profile_id uuid,
  p_unit_id uuid,
  p_effective_from date,
  p_effective_to date,
  p_source text,
  p_day_map jsonb,
  p_expected_start time,
  p_expected_end time,
  p_reason text,
  p_supersedes_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  v_org uuid:=public.app_org_id();
  v_actor uuid:=auth.uid();
  v_prior public.workforce_schedule_versions;
  v_key uuid;
  v_version integer;
  v_id uuid;
begin
  if v_actor is null or not public.app_has_capability('workforce.manage',null) then
    raise exception 'You do not have authority to manage workforce schedules.' using errcode='42501';
  end if;
  if not exists(select 1 from public.profiles p where p.id=p_profile_id and p.org_id=v_org and p.active) then
    raise exception 'Choose an active person in your organisation.' using errcode='42501';
  end if;
  if p_unit_id is not null and not exists(select 1 from public.units u where u.id=p_unit_id and u.org_id=v_org) then
    raise exception 'Choose a unit in your organisation.' using errcode='42501';
  end if;
  if p_effective_from is null or (p_effective_to is not null and p_effective_to<p_effective_from) then
    raise exception 'Choose a valid schedule date range.';
  end if;
  if p_source not in ('person','unit','working_pattern_translation') then
    raise exception 'Choose a valid schedule source.';
  end if;
  if jsonb_typeof(coalesce(p_day_map,'{}'::jsonb))<>'object' then
    raise exception 'Day map must be an object.';
  end if;
  if length(btrim(coalesce(p_reason,'')))<3 then raise exception 'A reason is required.'; end if;

  if p_supersedes_id is not null then
    select * into v_prior
    from public.workforce_schedule_versions
    where id=p_supersedes_id and org_id=v_org and profile_id=p_profile_id;
    if v_prior.id is null then raise exception 'Schedule version being revised was not found.'; end if;
    if exists(select 1 from public.workforce_schedule_versions where supersedes_id=v_prior.id) then
      raise exception 'That schedule version has already been superseded.';
    end if;
    v_key:=v_prior.schedule_key;
    v_version:=v_prior.version+1;
  else
    v_key:=gen_random_uuid();
    v_version:=1;
  end if;

  insert into public.workforce_schedule_versions(
    org_id,schedule_key,version,profile_id,unit_id,effective_from,effective_to,
    source,day_map,expected_start,expected_end,supersedes_id,reason,created_by
  ) values (
    v_org,v_key,v_version,p_profile_id,p_unit_id,p_effective_from,p_effective_to,
    p_source,p_day_map,p_expected_start,p_expected_end,p_supersedes_id,btrim(p_reason),v_actor
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.workforce_record_schedule(uuid,uuid,date,date,text,jsonb,time,time,text,uuid) from public,anon;
grant execute on function public.workforce_record_schedule(uuid,uuid,date,date,text,jsonb,time,time,text,uuid)
to authenticated,service_role;

-- ---------------------------------------------------------------------------
-- Attendance correction + reversal. Original work_sessions are never rewritten.
-- ---------------------------------------------------------------------------

create or replace function public.workforce_record_attendance_correction(
  p_profile_id uuid,
  p_work_date date,
  p_work_session_id uuid,
  p_correction_type text,
  p_before_context jsonb,
  p_after_context jsonb,
  p_reason text,
  p_reverses_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  v_org uuid:=public.app_org_id();
  v_actor uuid:=auth.uid();
  v_prior public.attendance_corrections;
  v_id uuid;
begin
  if v_actor is null or not public.app_has_capability('attendance.correct',null) then
    raise exception 'You do not have authority to correct attendance context.' using errcode='42501';
  end if;
  if not exists(select 1 from public.profiles p where p.id=p_profile_id and p.org_id=v_org) then
    raise exception 'Employee not found.' using errcode='42501';
  end if;
  if p_work_session_id is not null and not exists(
    select 1 from public.work_sessions ws
    where ws.id=p_work_session_id and ws.org_id=v_org and ws.profile_id=p_profile_id
  ) then
    raise exception 'That work session is not recorded for this employee.' using errcode='42501';
  end if;
  if p_correction_type not in ('context_note','start_time','end_time','day_type','administrative_finding','reversal') then
    raise exception 'Choose a valid correction type.';
  end if;
  if length(btrim(coalesce(p_reason,'')))<3 then raise exception 'A reason is required.'; end if;

  if p_reverses_id is not null then
    select * into v_prior
    from public.attendance_corrections
    where id=p_reverses_id and org_id=v_org and profile_id=p_profile_id and state='effective';
    if v_prior.id is null then raise exception 'Correction to reverse was not found.'; end if;
    if exists(select 1 from public.attendance_corrections where reverses_id=v_prior.id) then
      raise exception 'That correction has already been reversed.';
    end if;
    p_correction_type:='reversal';
  end if;

  insert into public.attendance_corrections(
    org_id,profile_id,work_date,work_session_id,correction_type,
    before_context,after_context,reason,reverses_id,recorded_by
  ) values (
    v_org,p_profile_id,p_work_date,p_work_session_id,p_correction_type,
    coalesce(p_before_context,'{}'::jsonb),coalesce(p_after_context,'{}'::jsonb),
    btrim(p_reason),p_reverses_id,v_actor
  )
  returning id into v_id;

  if p_reverses_id is not null then
    update public.attendance_corrections set state='reversed' where id=p_reverses_id;
  end if;

  return v_id;
end;
$$;

revoke all on function public.workforce_record_attendance_correction(uuid,date,uuid,text,jsonb,jsonb,text,uuid) from public,anon;
grant execute on function public.workforce_record_attendance_correction(uuid,date,uuid,text,jsonb,jsonb,text,uuid)
to authenticated,service_role;

-- ---------------------------------------------------------------------------
-- Leave request + decision lifecycle.
-- ---------------------------------------------------------------------------

create or replace function public.workforce_request_leave(
  p_kind text,
  p_start_date date,
  p_end_date date,
  p_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  v_org uuid:=public.app_org_id();
  v_actor uuid:=auth.uid();
  v_days numeric;
  v_id uuid;
begin
  if v_actor is null then raise exception 'Sign in to request leave.' using errcode='42501'; end if;
  if p_start_date is null or p_end_date is null or p_end_date<p_start_date then
    raise exception 'Choose a valid leave date range.';
  end if;
  if length(btrim(coalesce(p_kind,'')))<2 then raise exception 'Choose a leave kind.'; end if;

  v_days:=(p_end_date-p_start_date)+1;

  insert into public.leave_requests(
    org_id,profile_id,kind,start_date,end_date,days,reason,status,requested_at
  ) values (
    v_org,v_actor,btrim(p_kind),p_start_date,p_end_date,v_days,
    nullif(btrim(coalesce(p_reason,'')),''),'pending',now()
  )
  returning id into v_id;

  insert into public.leave_request_events(
    org_id,leave_request_id,profile_id,action,from_status,to_status,reason,actor_id
  ) values (
    v_org,v_id,v_actor,'requested',null,'pending',nullif(btrim(coalesce(p_reason,'')),''),v_actor
  );

  return v_id;
end;
$$;

revoke all on function public.workforce_request_leave(text,date,date,text) from public,anon;
grant execute on function public.workforce_request_leave(text,date,date,text)
to authenticated,service_role;

create or replace function public.workforce_leave_action(
  p_leave_request_id uuid,
  p_action text,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path=public
as $$
declare
  v_org uuid:=public.app_org_id();
  v_actor uuid:=auth.uid();
  v_request public.leave_requests;
  v_record public.employment_records;
  v_from text;
  v_to text;
  v_allowed boolean:=false;
begin
  if v_actor is null then raise exception 'Sign in to update leave.' using errcode='42501'; end if;
  if p_action not in ('manager_approved','escalated','admin_approved','declined','cancelled_by_employee','approval_reversed','decision_corrected') then
    raise exception 'Choose a supported leave action.';
  end if;
  if p_action<>'cancelled_by_employee' and length(btrim(coalesce(p_reason,'')))<3 then
    raise exception 'A reason is required.';
  end if;

  select * into v_request
  from public.leave_requests
  where id=p_leave_request_id and org_id=v_org
  for update;
  if v_request.id is null then raise exception 'Leave request not found.' using errcode='42501'; end if;

  select * into v_record
  from public.employment_records
  where profile_id=v_request.profile_id and org_id=v_org;

  if p_action='cancelled_by_employee' then
    v_allowed:=v_actor=v_request.profile_id and v_request.status in ('pending','escalated');
    v_to:='cancelled';
  elsif p_action in ('admin_approved','approval_reversed','decision_corrected') then
    v_allowed:=public.app_has_capability('workforce.manage',null);
    v_to:=case p_action when 'admin_approved' then 'approved' when 'approval_reversed' then 'pending' else v_request.status end;
  else
    v_allowed:=public.app_has_capability('workforce.manage',null)
      or (v_record.unit_id is not null and v_record.unit_id in (select public.app_managed_units()));
    v_to:=case p_action
      when 'manager_approved' then 'approved'
      when 'escalated' then 'escalated'
      when 'declined' then 'declined'
      else v_request.status end;
  end if;

  if not v_allowed then
    raise exception 'You do not have authority for this leave action.' using errcode='42501';
  end if;

  v_from:=v_request.status;

  update public.leave_requests
  set status=v_to,
      decided_by=case when p_action='cancelled_by_employee' then decided_by else v_actor end,
      decided_at=case when p_action='cancelled_by_employee' then decided_at else now() end,
      decision_note=case when p_action='cancelled_by_employee' then decision_note else btrim(p_reason) end
  where id=v_request.id;

  insert into public.leave_request_events(
    org_id,leave_request_id,profile_id,action,from_status,to_status,reason,actor_id
  ) values (
    v_org,v_request.id,v_request.profile_id,p_action,v_from,v_to,
    nullif(btrim(coalesce(p_reason,'')),''),v_actor
  );
end;
$$;

revoke all on function public.workforce_leave_action(uuid,text,text) from public,anon;
grant execute on function public.workforce_leave_action(uuid,text,text)
to authenticated,service_role;

-- ---------------------------------------------------------------------------
-- Leave policy version + activation.
-- Rules arrive as a reviewed JSON array; no legacy defaults are imported.
-- ---------------------------------------------------------------------------

create or replace function public.workforce_record_leave_policy(
  p_name text,
  p_effective_from date,
  p_effective_to date,
  p_source_reference text,
  p_reason text,
  p_rules jsonb,
  p_activate boolean default false,
  p_supersedes_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  v_org uuid:=public.app_org_id();
  v_actor uuid:=auth.uid();
  v_prior public.leave_policy_versions;
  v_key uuid;
  v_version integer;
  v_id uuid;
  v_rule jsonb;
begin
  if v_actor is null or not public.app_has_capability('workforce.manage',null) then
    raise exception 'You do not have authority to configure leave policy.' using errcode='42501';
  end if;
  if length(btrim(coalesce(p_name,'')))<3 or length(btrim(coalesce(p_reason,'')))<3 then
    raise exception 'Policy name and reason are required.';
  end if;
  if p_effective_from is null or (p_effective_to is not null and p_effective_to<p_effective_from) then
    raise exception 'Choose a valid policy date range.';
  end if;
  if jsonb_typeof(coalesce(p_rules,'[]'::jsonb))<>'array' then
    raise exception 'Policy rules must be a JSON array.';
  end if;

  if p_supersedes_id is not null then
    select * into v_prior
    from public.leave_policy_versions
    where id=p_supersedes_id and org_id=v_org;
    if v_prior.id is null then raise exception 'Policy version being superseded was not found.'; end if;
    if exists(select 1 from public.leave_policy_versions where supersedes_id=v_prior.id) then
      raise exception 'That policy version has already been superseded.';
    end if;
    v_key:=v_prior.policy_key;
    v_version:=v_prior.version+1;
  else
    v_key:=gen_random_uuid();
    v_version:=1;
  end if;

  if p_activate then
    update public.leave_policy_versions
    set state='retired'
    where org_id=v_org and state='active';
  end if;

  insert into public.leave_policy_versions(
    org_id,policy_key,version,name,effective_from,effective_to,state,supersedes_id,
    source_reference,reason,confirmed_by,confirmed_at,created_by
  ) values (
    v_org,v_key,v_version,btrim(p_name),p_effective_from,p_effective_to,
    case when p_activate then 'active' else 'draft' end,p_supersedes_id,
    nullif(btrim(coalesce(p_source_reference,'')),''),btrim(p_reason),
    case when p_activate then v_actor else null end,
    case when p_activate then now() else null end,
    v_actor
  )
  returning id into v_id;

  for v_rule in select value from jsonb_array_elements(p_rules)
  loop
    insert into public.leave_policy_rules(
      org_id,policy_version_id,leave_kind,employment_type,
      entitlement_amount,entitlement_unit,accrual_method,accrual_rate,
      carryover_method,carryover_limit,approval_route,opening_balance_required,complete
    ) values (
      v_org,v_id,btrim(v_rule->>'leave_kind'),nullif(btrim(coalesce(v_rule->>'employment_type','')),''),
      nullif(v_rule->>'entitlement_amount','')::numeric,nullif(v_rule->>'entitlement_unit',''),
      nullif(v_rule->>'accrual_method',''),nullif(v_rule->>'accrual_rate','')::numeric,
      nullif(v_rule->>'carryover_method',''),nullif(v_rule->>'carryover_limit','')::numeric,
      coalesce(nullif(v_rule->>'approval_route',''),'manager_then_admin'),
      coalesce((v_rule->>'opening_balance_required')::boolean,false),
      coalesce((v_rule->>'complete')::boolean,false)
    );
  end loop;

  if p_activate and exists(
    select 1 from public.leave_policy_rules
    where policy_version_id=v_id and not complete
  ) then
    raise exception 'Only complete leave rules can be activated.';
  end if;

  return v_id;
end;
$$;

revoke all on function public.workforce_record_leave_policy(text,date,date,text,text,jsonb,boolean,uuid) from public,anon;
grant execute on function public.workforce_record_leave_policy(text,date,date,text,text,jsonb,boolean,uuid)
to authenticated,service_role;

-- ---------------------------------------------------------------------------
-- Audit + semantic events.
-- ---------------------------------------------------------------------------

create trigger audit_workforce_day_types
after insert or update on public.workforce_day_types
for each row execute function public.platform_audit_capture('workforce_day_type','id','');

create trigger audit_workforce_schedule_versions
after insert on public.workforce_schedule_versions
for each row execute function public.platform_audit_capture('workforce_schedule_version','id','profile_id');

create trigger audit_attendance_corrections
after insert or update on public.attendance_corrections
for each row execute function public.platform_audit_capture('attendance_correction','id','profile_id');

create trigger audit_leave_request_events
after insert on public.leave_request_events
for each row execute function public.platform_audit_capture('leave_request_event','id','profile_id');

create trigger audit_leave_policy_versions
after insert or update on public.leave_policy_versions
for each row execute function public.platform_audit_capture('leave_policy_version','id','');

create trigger audit_leave_policy_rules
after insert on public.leave_policy_rules
for each row execute function public.platform_audit_capture('leave_policy_rule','id','');

insert into public.platform_event_definitions(event_type,label,description,source_domain,payload_version)
values
  ('workforce.schedule_changed','Workforce schedule changed','A workforce schedule version was recorded.','workforce',1),
  ('workforce.attendance_corrected','Attendance context corrected','An attributable attendance-context correction was recorded.','workforce',1),
  ('workforce.attendance_correction_reversed','Attendance correction reversed','An attendance correction was reversed without rewriting the original session.','workforce',1),
  ('workforce.leave_requested','Leave requested','An employee submitted a leave request.','workforce',1),
  ('workforce.leave_decision_recorded','Leave decision recorded','A leave lifecycle decision was recorded.','workforce',1),
  ('workforce.leave_decision_reversed','Leave decision reversed','A prior leave approval was reversed.','workforce',1),
  ('workforce.leave_policy_activated','Leave policy activated','A confirmed leave-policy version was activated.','workforce',1)
on conflict(event_type) do nothing;

create or replace function public.workforce_emit_schedule_event()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  perform public.platform_emit_event(
    new.org_id,'workforce.schedule_changed',new.created_by,new.profile_id,
    'workforce_schedule',new.schedule_key,
    jsonb_build_object('version',new.version,'effective_from',new.effective_from,'effective_to',new.effective_to),
    'workforce-schedule:'||new.id::text,null,null,new.created_at
  );
  return new;
end;
$$;
revoke all on function public.workforce_emit_schedule_event() from public,anon,authenticated;
create trigger workforce_schedule_emit_event
after insert on public.workforce_schedule_versions
for each row execute function public.workforce_emit_schedule_event();

create or replace function public.workforce_emit_attendance_event()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  if tg_op='INSERT' then
    perform public.platform_emit_event(
      new.org_id,
      case when new.correction_type='reversal' then 'workforce.attendance_correction_reversed' else 'workforce.attendance_corrected' end,
      new.recorded_by,new.profile_id,
      'attendance_correction',new.id,
      jsonb_build_object('work_date',new.work_date,'correction_type',new.correction_type,'reverses_id',new.reverses_id),
      'workforce-attendance:'||new.id::text,null,null,new.created_at
    );
  end if;
  return new;
end;
$$;
revoke all on function public.workforce_emit_attendance_event() from public,anon,authenticated;
create trigger workforce_attendance_emit_event
after insert on public.attendance_corrections
for each row execute function public.workforce_emit_attendance_event();

create or replace function public.workforce_emit_leave_event()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  perform public.platform_emit_event(
    new.org_id,
    case
      when new.action='requested' then 'workforce.leave_requested'
      when new.action='approval_reversed' then 'workforce.leave_decision_reversed'
      else 'workforce.leave_decision_recorded'
    end,
    new.actor_id,new.profile_id,
    'leave_request',new.leave_request_id,
    jsonb_build_object('action',new.action,'from_status',new.from_status,'to_status',new.to_status),
    'workforce-leave-event:'||new.id::text,null,null,new.created_at
  );
  return new;
end;
$$;
revoke all on function public.workforce_emit_leave_event() from public,anon,authenticated;
create trigger workforce_leave_emit_event
after insert on public.leave_request_events
for each row execute function public.workforce_emit_leave_event();

create or replace function public.workforce_emit_policy_event()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  if new.state='active' then
    perform public.platform_emit_event(
      new.org_id,'workforce.leave_policy_activated',new.confirmed_by,null,
      'leave_policy',new.policy_key,
      jsonb_build_object('version',new.version,'effective_from',new.effective_from,'effective_to',new.effective_to),
      'workforce-policy-active:'||new.id::text,null,null,coalesce(new.confirmed_at,new.created_at)
    );
  end if;
  return new;
end;
$$;
revoke all on function public.workforce_emit_policy_event() from public,anon,authenticated;
create trigger workforce_policy_emit_event
after insert on public.leave_policy_versions
for each row execute function public.workforce_emit_policy_event();
