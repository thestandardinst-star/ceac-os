-- 077 — Stage 1C: capability-based authority.

create table public.capability_definitions (
  capability text primary key,
  label text not null,
  description text not null,
  sensitive boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.capability_definitions(capability,label,description,sensitive) values
  ('authority.manage','Manage authority','Grant and revoke reviewed CEAC OS capabilities.',true),
  ('people.manage','Manage people','Administer ordinary employee records and employment authority.',true),
  ('hr_private.access','Access protected HR','Access protected HR records when the protected HR product surface is enabled.',true),
  ('attendance.correct','Correct attendance','Approve and correct attendance records with attributable history.',true),
  ('performance.admin','Administer performance','Administer review cycles and performance-development processes.',true),
  ('payroll.prepare','Prepare payroll','Prepare payroll inputs and draft runs when payroll is enabled.',true),
  ('payroll.approve','Approve payroll','Approve reviewed payroll runs when payroll is enabled.',true),
  ('audit.view','View audit','Inspect ordinary-platform audit history.',true);

create table public.capability_grants (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete restrict,
  profile_id uuid not null references public.profiles(id) on delete restrict,
  capability text not null references public.capability_definitions(capability) on delete restrict,
  scope_unit_id uuid references public.units(id) on delete restrict,
  granted_by uuid references public.profiles(id) on delete restrict,
  granted_at timestamptz not null default now(),
  grant_reason text not null check (length(btrim(grant_reason)) between 3 and 600),
  revoked_by uuid references public.profiles(id) on delete restrict,
  revoked_at timestamptz,
  revoke_reason text,
  check (
    (revoked_at is null and revoked_by is null and revoke_reason is null)
    or
    (revoked_at is not null and revoked_by is not null and length(btrim(coalesce(revoke_reason,''))) between 3 and 600)
  )
);

create unique index capability_grants_active_uidx
  on public.capability_grants(
    org_id,profile_id,capability,coalesce(scope_unit_id,'00000000-0000-0000-0000-000000000000'::uuid)
  )
  where revoked_at is null;

create index capability_grants_profile_idx
  on public.capability_grants(profile_id,revoked_at,granted_at desc);
create index capability_grants_org_idx
  on public.capability_grants(org_id,capability,revoked_at);

alter table public.capability_definitions enable row level security;
alter table public.capability_grants enable row level security;

revoke all on public.capability_definitions from anon;
revoke all on public.capability_grants from anon;
revoke insert,update,delete on public.capability_definitions from authenticated;
revoke insert,update,delete on public.capability_grants from authenticated;
grant select on public.capability_definitions to authenticated;
grant select on public.capability_grants to authenticated;

create policy capability_definitions_read
on public.capability_definitions
for select
to authenticated
using (true);

create or replace function public.app_has_capability(
  p_capability text,
  p_unit_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path=public
as $$
  select exists (
    select 1
    from public.profiles p
    join public.capability_grants cg
      on cg.profile_id=p.id
     and cg.org_id=p.org_id
    where p.id=auth.uid()
      and p.active
      and cg.revoked_at is null
      and cg.capability=p_capability
      and (
        cg.scope_unit_id is null
        or (p_unit_id is not null and cg.scope_unit_id=p_unit_id)
      )
  );
$$;

revoke all on function public.app_has_capability(text,uuid) from public,anon;
grant execute on function public.app_has_capability(text,uuid) to authenticated,service_role;

-- One-time bootstrap of explicit authority from the already-reviewed
-- Administration & HR baseline. Future role changes do not auto-grant capability.
insert into public.capability_grants(
  org_id,profile_id,capability,scope_unit_id,granted_by,grant_reason
)
select p.org_id,p.id,c.capability,null,null,
       'Stage 1C baseline from existing Administration & HR authority.'
from public.profiles p
cross join (
  values
    ('authority.manage'::text),
    ('people.manage'::text),
    ('hr_private.access'::text),
    ('attendance.correct'::text),
    ('performance.admin'::text),
    ('audit.view'::text)
) c(capability)
where p.is_admin and p.active
on conflict do nothing;

create policy capability_grants_read
on public.capability_grants
for select
to authenticated
using (
  org_id=public.app_org_id()
  and (
    profile_id=auth.uid()
    or public.app_has_capability('authority.manage',null)
  )
);

create or replace function public.grant_capability(
  p_profile_id uuid,
  p_capability text,
  p_scope_unit_id uuid default null,
  p_reason text default null
)
returns public.capability_grants
language plpgsql
security definer
set search_path=public
as $$
declare
  v_org uuid:=public.app_org_id();
  v_actor uuid:=auth.uid();
  v_grant public.capability_grants;
  v_opposite text;
begin
  if v_actor is null or not public.app_has_capability('authority.manage',null) then
    raise exception 'You do not have authority to manage capabilities.' using errcode='42501';
  end if;

  if nullif(btrim(coalesce(p_reason,'')),'') is null
     or length(btrim(p_reason))<3 then
    raise exception 'A reason is required for capability changes.';
  end if;

  if not exists (
    select 1 from public.profiles p
    where p.id=p_profile_id and p.org_id=v_org and p.active
  ) then
    raise exception 'Choose an active person in your organisation.' using errcode='42501';
  end if;

  if not exists (
    select 1 from public.capability_definitions d where d.capability=p_capability
  ) then
    raise exception 'That capability is not part of the approved catalogue.';
  end if;

  if p_scope_unit_id is not null and not exists (
    select 1 from public.units u
    where u.id=p_scope_unit_id and u.org_id=v_org and u.active
  ) then
    raise exception 'Choose an active unit in your organisation.' using errcode='42501';
  end if;

  if p_capability in ('authority.manage','hr_private.access','payroll.prepare','payroll.approve','audit.view')
     and p_scope_unit_id is not null then
    raise exception 'That capability is organisation-scoped.';
  end if;

  if exists (
    select 1 from public.capability_grants cg
    where cg.org_id=v_org
      and cg.profile_id=p_profile_id
      and cg.capability=p_capability
      and cg.scope_unit_id is not distinct from p_scope_unit_id
      and cg.revoked_at is null
  ) then
    raise exception 'That capability is already active for this scope.';
  end if;

  v_opposite:=case
    when p_capability='payroll.prepare' then 'payroll.approve'
    when p_capability='payroll.approve' then 'payroll.prepare'
    else null
  end;

  if v_opposite is not null and exists (
    select 1 from public.capability_grants cg
    where cg.org_id=v_org
      and cg.profile_id=p_profile_id
      and cg.capability=v_opposite
      and cg.revoked_at is null
      and (
        cg.scope_unit_id is null
        or p_scope_unit_id is null
        or cg.scope_unit_id=p_scope_unit_id
      )
  ) then
    raise exception 'Payroll preparation and approval must remain separated.'
      using errcode='42501';
  end if;

  insert into public.capability_grants(
    org_id,profile_id,capability,scope_unit_id,granted_by,grant_reason
  ) values (
    v_org,p_profile_id,p_capability,p_scope_unit_id,v_actor,btrim(p_reason)
  )
  returning * into v_grant;

  return v_grant;
end;
$$;

revoke all on function public.grant_capability(uuid,text,uuid,text) from public,anon;
grant execute on function public.grant_capability(uuid,text,uuid,text) to authenticated,service_role;

create or replace function public.revoke_capability(
  p_grant_id uuid,
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
  v_grant public.capability_grants;
  v_remaining integer;
begin
  if v_actor is null or not public.app_has_capability('authority.manage',null) then
    raise exception 'You do not have authority to manage capabilities.' using errcode='42501';
  end if;

  if nullif(btrim(coalesce(p_reason,'')),'') is null
     or length(btrim(p_reason))<3 then
    raise exception 'A reason is required for capability changes.';
  end if;

  select * into v_grant
  from public.capability_grants
  where id=p_grant_id and org_id=v_org and revoked_at is null
  for update;

  if v_grant.id is null then
    raise exception 'That active capability grant was not found.' using errcode='42501';
  end if;

  if v_grant.capability='authority.manage' and v_grant.scope_unit_id is null then
    select count(*) into v_remaining
    from public.capability_grants cg
    where cg.org_id=v_org
      and cg.capability='authority.manage'
      and cg.scope_unit_id is null
      and cg.revoked_at is null
      and cg.id<>v_grant.id;

    if v_remaining=0 then
      raise exception 'The organisation must retain at least one authority manager.'
        using errcode='42501';
    end if;
  end if;

  update public.capability_grants
  set revoked_by=v_actor,
      revoked_at=now(),
      revoke_reason=btrim(p_reason)
  where id=v_grant.id;
end;
$$;

revoke all on function public.revoke_capability(uuid,text) from public,anon;
grant execute on function public.revoke_capability(uuid,text) to authenticated,service_role;

create trigger audit_capability_grants
after insert or update or delete on public.capability_grants
for each row execute function public.platform_audit_capture('capability_grant','id','profile_id');

drop policy if exists platform_audit_events_admin_read on public.platform_audit_events;
drop policy if exists platform_audit_events_capability_read on public.platform_audit_events;

create policy platform_audit_events_capability_read
on public.platform_audit_events
for select
to authenticated
using (
  org_id=public.app_org_id()
  and public.app_has_capability('audit.view',null)
);

comment on table public.capabilities is
  'Legacy product capability table retained for compatibility. Sensitive Stage 1C authority uses capability_grants.';

-- Sensitive People authority moves from role-label implication to explicit capability.


create or replace function public.admin_people_summary()
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_org uuid:=public.app_org_id();
  v_today date:=current_date;
  v_month_start date:=date_trunc('month',current_date)::date;
  v_year int:=extract(year from current_date)::int;
begin
  if auth.uid() is null or not public.app_has_capability('people.manage',null) then
    raise exception 'Only Administration & HR can view organisation People summaries.'
      using errcode='42501';
  end if;

  return coalesce((
    select jsonb_agg(to_jsonb(x) order by x.full_name)
    from (
      select
        p.id,p.full_name,p.email,p.job_title,p.phone,p.started_on,p.contract_type,
        p.active,p.birthday,p.is_admin,p.is_exec,
        um.unit_id,u.name as unit_name,um.role,
        coalesce(w.done_count,0) as done_count,
        coalesce(w.assigned_done_count,0) as assigned_done_count,
        coalesce(w.self_done_count,0) as self_done_count,
        coalesce(w.on_time_count,0) as on_time_count,
        coalesce(w.first_time_count,0) as first_time_count,
        coalesce(w.open_count,0) as open_count,
        coalesce(s.days_this_month,0) as days_this_month,
        s.avg_start_minutes,
        coalesce(l.on_leave_now,false) as on_leave_now,
        coalesce(l.leave_count,0) as leave_count,
        lb.annual_taken,lb.sick_taken,lb.carryover_from_last_year,
        sub.last_submission,
        (sub.last_submission is null or sub.last_submission < now()-interval '14 days') as quiet
      from public.profiles p
      left join lateral (
        select um1.unit_id,um1.role
        from public.unit_memberships um1
        where um1.profile_id=p.id and um1.org_id=v_org
        order by case when um1.role='manager' then 0 else 1 end,um1.created_at
        limit 1
      ) um on true
      left join public.units u on u.id=um.unit_id
      left join lateral (
        select
          count(*) filter(where wi.status in ('completed','self_certified') and wi.kind in ('task','deliverable'))::int done_count,
          count(*) filter(where wi.status in ('completed','self_certified') and wi.kind in ('task','deliverable') and wi.origin='assigned')::int assigned_done_count,
          count(*) filter(where wi.status in ('completed','self_certified') and wi.kind in ('task','deliverable') and wi.origin='self_created')::int self_done_count,
          count(*) filter(where wi.status in ('completed','self_certified') and wi.kind in ('task','deliverable') and wi.due_at is not null and wi.completed_at<=wi.due_at)::int on_time_count,
          count(*) filter(where wi.status in ('completed','self_certified') and wi.kind in ('task','deliverable') and wi.first_time_approved is true)::int first_time_count,
          count(*) filter(where wi.status not in ('completed','self_certified','cancelled'))::int open_count
        from public.work_items wi
        where wi.assignee_id=p.id and wi.visibility<>'private'
      ) w on true
      left join lateral (
        select
          count(distinct ws.started_at::date) filter(where ws.started_at>=v_month_start)::int days_this_month,
          round(avg(extract(hour from ws.started_at)*60+extract(minute from ws.started_at)))::int avg_start_minutes
        from public.work_sessions ws
        where ws.profile_id=p.id
      ) s on true
      left join lateral (
        select
          bool_or(lr.status='approved' and lr.start_date<=v_today and lr.end_date>=v_today) as on_leave_now,
          count(*)::int leave_count
        from public.leave_requests lr
        where lr.profile_id=p.id
      ) l on true
      left join public.leave_balances lb on lb.profile_id=p.id and lb.year=v_year
      left join lateral (
        select max(sb.submitted_at) last_submission
        from public.submissions sb
        where sb.profile_id=p.id
      ) sub on true
      where p.org_id=v_org
    ) x
  ),'[]'::jsonb);
end;
$$;

create or replace function public.admin_person_detail(p_profile_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_org uuid:=public.app_org_id();
begin
  if auth.uid() is null or not public.app_has_capability('people.manage',null) then
    raise exception 'Only Administration & HR can view this employee detail.'
      using errcode='42501';
  end if;
  if not exists(select 1 from public.profiles p where p.id=p_profile_id and p.org_id=v_org) then
    raise exception 'That employee does not belong to your organisation.' using errcode='42501';
  end if;

  return jsonb_build_object(
    'work',coalesce((
      select jsonb_agg(to_jsonb(x) order by x.created_at desc)
      from (
        select wi.id,wi.ref,wi.title,wi.status,wi.origin,wi.due_at,wi.completed_at,
               wi.first_time_approved,wi.visibility,wi.project_id,pr.name as project_name,wi.created_at
        from public.work_items wi
        left join public.projects pr on pr.id=wi.project_id
        where wi.assignee_id=p_profile_id and wi.visibility<>'private'
      ) x
    ),'[]'::jsonb),
    'sessions',coalesce((
      select jsonb_agg(to_jsonb(x) order by x.started_at desc)
      from (
        select ws.id,ws.started_at,ws.ended_at,ws.place
        from public.work_sessions ws
        where ws.profile_id=p_profile_id
        order by ws.started_at desc
        limit 120
      ) x
    ),'[]'::jsonb),
    'leave',coalesce((
      select jsonb_agg(to_jsonb(x) order by x.start_date desc)
      from (
        select lr.id,lr.kind,lr.start_date,lr.end_date,lr.days,lr.status
        from public.leave_requests lr
        where lr.profile_id=p_profile_id
        order by lr.start_date desc
        limit 120
      ) x
    ),'[]'::jsonb)
  );
end;
$$;

revoke all on function public.admin_people_summary() from public,anon;
revoke all on function public.admin_person_detail(uuid) from public,anon;
grant execute on function public.admin_people_summary() to authenticated,service_role;
grant execute on function public.admin_person_detail(uuid) to authenticated,service_role;

create or replace function public.admin_employment_detail(p_profile_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_org uuid:=public.app_org_id();
begin
  if auth.uid() is null or not public.app_has_capability('people.manage',null) then
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
  if v_actor is null or not public.app_has_capability('people.manage',null) then
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

create or replace function public.assign_unit_head(
  p_unit_id uuid,
  p_profile_id uuid
)
returns void
language plpgsql
security definer
set search_path=public
as $$
declare
  v_org uuid;
  v_old_head uuid;
begin
  if auth.uid() is null or not public.app_has_capability('people.manage',null) then
    raise exception 'Only Administration & HR can assign a Unit Head.'
      using errcode='42501';
  end if;

  v_org:=public.app_org_id();

  if not exists (
    select 1 from public.units
    where id=p_unit_id and org_id=v_org and active
  ) then
    raise exception 'That unit is not an active unit in your organisation.'
      using errcode='42501';
  end if;

  if not exists (
    select 1
    from public.unit_memberships um
    join public.profiles p on p.id=um.profile_id
    where um.unit_id=p_unit_id
      and um.profile_id=p_profile_id
      and um.org_id=v_org
      and p.org_id=v_org
      and p.active
  ) then
    raise exception 'The person must already be an active member of that unit.'
      using errcode='42501';
  end if;

  select profile_id into v_old_head
  from public.unit_memberships
  where org_id=v_org and unit_id=p_unit_id and role='manager'
  order by created_at
  limit 1
  for update;

  update public.unit_memberships
  set role='staff'
  where org_id=v_org
    and unit_id=p_unit_id
    and role='manager'
    and profile_id<>p_profile_id;

  update public.unit_memberships
  set role='manager'
  where org_id=v_org
    and unit_id=p_unit_id
    and profile_id=p_profile_id;

  insert into public.activity_events(org_id,actor_id,verb,object_type,object_id,meta)
  values(
    v_org,auth.uid(),'unit_head_assigned','unit',p_unit_id,
    jsonb_build_object('profile_id',p_profile_id,'previous_head_id',v_old_head)
  );
end;
$$;

revoke all on function public.assign_unit_head(uuid,uuid) from public,anon;
grant execute on function public.assign_unit_head(uuid,uuid) to authenticated,service_role;
