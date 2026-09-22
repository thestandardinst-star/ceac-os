-- 082 — Stage 2: controlled employee onboarding/offboarding lifecycle.

insert into public.platform_event_definitions(
  event_type,label,description,source_domain,payload_version
) values
  ('employee.lifecycle_started','Employee lifecycle started',
   'An onboarding or offboarding lifecycle case was opened.','people',1),
  ('employee.lifecycle_completed','Employee lifecycle completed',
   'An onboarding or offboarding lifecycle case completed.','people',1)
on conflict(event_type) do nothing;

create table public.employee_lifecycle_templates (
  lifecycle_type text not null check (lifecycle_type in ('onboarding','offboarding')),
  position integer not null check (position>0),
  step_key text not null,
  label text not null,
  required_capability text not null default 'people.manage'
    references public.capability_definitions(capability) on delete restrict,
  primary key(lifecycle_type,position),
  unique(lifecycle_type,step_key)
);

insert into public.employee_lifecycle_templates(
  lifecycle_type,position,step_key,label,required_capability
) values
  ('onboarding',1,'confirm-employment','Confirm employment record','people.manage'),
  ('onboarding',2,'confirm-unit-manager','Confirm unit & manager','people.manage'),
  ('onboarding',3,'confirm-system-readiness','Confirm system readiness','people.manage'),
  ('onboarding',4,'complete-onboarding','Complete onboarding','people.manage'),
  ('offboarding',1,'confirm-exit','Confirm exit date & reason','people.manage'),
  ('offboarding',2,'confirm-work-handover','Confirm work handover','people.manage'),
  ('offboarding',3,'confirm-access-assets','Confirm access/assets handover','people.manage'),
  ('offboarding',4,'complete-offboarding','Complete offboarding','people.manage')
on conflict do nothing;

create table public.employee_lifecycle_cases (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete restrict,
  profile_id uuid not null references public.profiles(id) on delete restrict,
  lifecycle_type text not null check (lifecycle_type in ('onboarding','offboarding')),
  planned_effective_on date not null,
  reason text not null check (length(btrim(reason)) between 3 and 600),
  state text not null default 'active' check (state in ('active','completed','cancelled')),
  created_by uuid not null references public.profiles(id) on delete restrict,
  started_at timestamptz not null default now(),
  completed_by uuid references public.profiles(id) on delete restrict,
  completed_at timestamptz,
  check (
    (state='completed' and completed_by is not null and completed_at is not null)
    or state<>'completed'
  )
);

create unique index employee_lifecycle_cases_active_uidx
  on public.employee_lifecycle_cases(org_id,profile_id,lifecycle_type)
  where state='active';
create index employee_lifecycle_cases_org_idx
  on public.employee_lifecycle_cases(org_id,state,started_at desc);
create index employee_lifecycle_cases_profile_idx
  on public.employee_lifecycle_cases(profile_id,started_at desc);

create table public.employee_lifecycle_steps (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete restrict,
  lifecycle_case_id uuid not null references public.employee_lifecycle_cases(id) on delete restrict,
  position integer not null check (position>0),
  step_key text not null,
  label text not null,
  required_capability text not null references public.capability_definitions(capability) on delete restrict,
  state text not null default 'pending' check (state in ('pending','ready','completed')),
  completed_by uuid references public.profiles(id) on delete restrict,
  completed_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  unique(lifecycle_case_id,position),
  unique(lifecycle_case_id,step_key),
  check (
    (state='completed' and completed_by is not null and completed_at is not null)
    or state<>'completed'
  )
);

create index employee_lifecycle_steps_org_state_idx
  on public.employee_lifecycle_steps(org_id,state,created_at desc);

alter table public.employee_lifecycle_templates enable row level security;
alter table public.employee_lifecycle_cases enable row level security;
alter table public.employee_lifecycle_steps enable row level security;

revoke all on public.employee_lifecycle_templates from anon;
revoke all on public.employee_lifecycle_cases from anon;
revoke all on public.employee_lifecycle_steps from anon;

revoke insert,update,delete on public.employee_lifecycle_templates from authenticated;
revoke update,delete on public.employee_lifecycle_cases from authenticated;
revoke insert,delete on public.employee_lifecycle_steps from authenticated;
revoke update on public.employee_lifecycle_steps from authenticated;

grant select on public.employee_lifecycle_templates to authenticated;
grant select,insert on public.employee_lifecycle_cases to authenticated;
grant select on public.employee_lifecycle_steps to authenticated;
grant update(state,completed_by,completed_at,note)
  on public.employee_lifecycle_steps to authenticated;

create policy employee_lifecycle_templates_read
on public.employee_lifecycle_templates
for select to authenticated
using (true);

create policy employee_lifecycle_cases_read
on public.employee_lifecycle_cases
for select to authenticated
using (
  org_id=public.app_org_id()
  and (
    public.app_has_capability('people.manage',null)
    or profile_id=auth.uid()
  )
);

create policy employee_lifecycle_cases_insert
on public.employee_lifecycle_cases
for insert to authenticated
with check (
  org_id=public.app_org_id()
  and created_by=auth.uid()
  and state='active'
  and public.app_has_capability('people.manage',null)
  and exists (
    select 1 from public.profiles p
    where p.id=profile_id and p.org_id=public.app_org_id()
  )
);

create policy employee_lifecycle_steps_read
on public.employee_lifecycle_steps
for select to authenticated
using (
  org_id=public.app_org_id()
  and (
    public.app_has_capability('people.manage',null)
    or exists (
      select 1 from public.employee_lifecycle_cases c
      where c.id=lifecycle_case_id and c.profile_id=auth.uid()
    )
  )
);

create policy employee_lifecycle_steps_update
on public.employee_lifecycle_steps
for update to authenticated
using (
  org_id=public.app_org_id()
  and public.app_has_capability(required_capability,null)
)
with check (
  org_id=public.app_org_id()
  and public.app_has_capability(required_capability,null)
);

create or replace function public.employee_lifecycle_case_start()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  v_first uuid;
begin
  if auth.uid() is null
     or new.created_by<>auth.uid()
     or not public.app_has_capability('people.manage',null) then
    raise exception 'Only authorised People administrators can start employee lifecycle cases.'
      using errcode='42501';
  end if;

  if not exists (
    select 1 from public.profiles p
    where p.id=new.profile_id and p.org_id=new.org_id
  ) then
    raise exception 'The employee does not belong to this organisation.'
      using errcode='42501';
  end if;

  insert into public.employee_lifecycle_steps(
    org_id,lifecycle_case_id,position,step_key,label,required_capability,state
  )
  select
    new.org_id,new.id,t.position,t.step_key,t.label,t.required_capability,'pending'
  from public.employee_lifecycle_templates t
  where t.lifecycle_type=new.lifecycle_type
  order by t.position;

  select id into v_first
  from public.employee_lifecycle_steps
  where lifecycle_case_id=new.id
  order by position
  limit 1;

  perform set_config('ceac.lifecycle_internal','advance',true);
  update public.employee_lifecycle_steps
  set state='ready'
  where id=v_first;
  perform set_config('ceac.lifecycle_internal','',true);

  perform public.platform_emit_event(
    new.org_id,
    'employee.lifecycle_started',
    new.created_by,
    new.profile_id,
    'employee_lifecycle_case',
    new.id,
    jsonb_build_object(
      'lifecycle_type',new.lifecycle_type,
      'planned_effective_on',new.planned_effective_on
    ),
    'employee-lifecycle-start:'||new.id::text,
    null,null,new.started_at
  );

  return new;
end;
$$;

revoke all on function public.employee_lifecycle_case_start() from public,anon,authenticated;

create trigger employee_lifecycle_cases_start
after insert on public.employee_lifecycle_cases
for each row execute function public.employee_lifecycle_case_start();

create or replace function public.employee_lifecycle_step_guard()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  v_case public.employee_lifecycle_cases;
  v_next uuid;
  v_actor uuid:=auth.uid();
  v_change text;
begin
  if tg_op<>'UPDATE' then return new; end if;

  -- Internal ordered-step advancement changes only pending -> ready.
  -- Keep it narrow and reset the marker immediately after the nested update.
  if current_setting('ceac.lifecycle_internal',true)='advance'
     and old.state='pending' and new.state='ready' then
    return new;
  end if;

  if old.org_id is distinct from new.org_id
     or old.lifecycle_case_id is distinct from new.lifecycle_case_id
     or old.position is distinct from new.position
     or old.step_key is distinct from new.step_key
     or old.label is distinct from new.label
     or old.required_capability is distinct from new.required_capability
     or old.created_at is distinct from new.created_at then
    raise exception 'Lifecycle step identity fields are immutable.' using errcode='42501';
  end if;

  if old.state=new.state then
    return new;
  end if;

  if old.state<>'ready' or new.state<>'completed' then
    raise exception 'Only the current ready lifecycle step can be completed.'
      using errcode='42501';
  end if;

  if v_actor is null
     or new.completed_by is distinct from v_actor
     or new.completed_at is null
     or not public.app_has_capability(new.required_capability,null) then
    raise exception 'You do not have authority to complete this lifecycle step.'
      using errcode='42501';
  end if;

  select * into v_case
  from public.employee_lifecycle_cases
  where id=new.lifecycle_case_id and org_id=new.org_id
  for update;

  if v_case.id is null or v_case.state<>'active' then
    raise exception 'The employee lifecycle case is not active.';
  end if;

  select id into v_next
  from public.employee_lifecycle_steps
  where lifecycle_case_id=new.lifecycle_case_id
    and position>new.position
    and state='pending'
  order by position
  limit 1;

  if v_next is not null then
    perform set_config('ceac.lifecycle_internal','advance',true);
    update public.employee_lifecycle_steps
    set state='ready'
    where id=v_next;
    perform set_config('ceac.lifecycle_internal','',true);
    return new;
  end if;

  if v_case.planned_effective_on>current_date then
    raise exception 'The final lifecycle step cannot complete before the planned effective date.';
  end if;

  perform set_config('ceac.employment_sync','skip',true);

  if v_case.lifecycle_type='offboarding' then
    update public.profiles
    set active=false
    where id=v_case.profile_id and org_id=v_case.org_id;

    update public.employment_records
    set employment_status='exited',
        exited_on=v_case.planned_effective_on,
        updated_by=v_actor,
        updated_at=now()
    where profile_id=v_case.profile_id and org_id=v_case.org_id;

    v_change:='exit_recorded';
  else
    update public.profiles
    set active=true,
        started_on=coalesce(started_on,v_case.planned_effective_on),
        joined_at=coalesce(joined_at,v_case.planned_effective_on)
    where id=v_case.profile_id and org_id=v_case.org_id;

    update public.employment_records
    set employment_status='active',
        joined_on=coalesce(joined_on,v_case.planned_effective_on),
        exited_on=null,
        updated_by=v_actor,
        updated_at=now()
    where profile_id=v_case.profile_id and org_id=v_case.org_id;

    v_change:='joined';
  end if;

  perform public.employment_append_snapshot(
    v_case.profile_id,
    v_change,
    v_case.planned_effective_on,
    v_case.reason,
    v_actor,
    null
  );

  update public.employee_lifecycle_cases
  set state='completed',
      completed_by=v_actor,
      completed_at=now()
  where id=v_case.id;

  perform public.platform_emit_event(
    v_case.org_id,
    'employee.lifecycle_completed',
    v_actor,
    v_case.profile_id,
    'employee_lifecycle_case',
    v_case.id,
    jsonb_build_object(
      'lifecycle_type',v_case.lifecycle_type,
      'effective_on',v_case.planned_effective_on
    ),
    'employee-lifecycle-complete:'||v_case.id::text,
    null,null,now()
  );

  return new;
end;
$$;

revoke all on function public.employee_lifecycle_step_guard() from public,anon,authenticated;

create trigger employee_lifecycle_steps_guard
before update on public.employee_lifecycle_steps
for each row execute function public.employee_lifecycle_step_guard();

create trigger audit_employee_lifecycle_cases
after insert or update on public.employee_lifecycle_cases
for each row execute function public.platform_audit_capture('employee_lifecycle_case','id','profile_id');

create trigger audit_employee_lifecycle_steps
after insert or update on public.employee_lifecycle_steps
for each row execute function public.platform_audit_capture('employee_lifecycle_step','id','completed_by');
