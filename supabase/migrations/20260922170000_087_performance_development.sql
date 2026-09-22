-- 087 — Stage 7: Performance & Development.
-- Extends the existing appraisal/feedback foundation. No scores, rankings or hidden judgement.

-- ---------------------------------------------------------------------------
-- Existing review anchors: add explicit Stage 7 lifecycle/authority metadata.
-- ---------------------------------------------------------------------------

alter table public.appraisal_cycles
  add column if not exists opened_reason text,
  add column if not exists closed_by uuid references public.profiles(id) on delete restrict,
  add column if not exists closed_at timestamptz,
  add column if not exists close_reason text;

alter table public.appraisals
  add column if not exists unit_id uuid references public.units(id) on delete restrict,
  add column if not exists opened_by uuid references public.profiles(id) on delete restrict,
  add column if not exists reviewer_assigned_by uuid references public.profiles(id) on delete restrict,
  add column if not exists reviewer_assigned_at timestamptz,
  add column if not exists reviewer_assignment_reason text,
  add column if not exists shared_by uuid references public.profiles(id) on delete restrict,
  add column if not exists closed_by uuid references public.profiles(id) on delete restrict,
  add column if not exists closed_at timestamptz;

update public.appraisals a
set unit_id=e.unit_id
from public.employment_records e
where e.profile_id=a.profile_id
  and a.unit_id is null;

alter table public.appraisals drop constraint if exists appraisals_status_check;
alter table public.appraisals
  add constraint appraisals_status_check
  check(status in (
    'evidence',
    'reflection_submitted',
    'manager_draft',
    'conversation_recorded',
    'shared',
    'closed'
  ));

create index if not exists appraisals_manager_status_idx
  on public.appraisals(org_id,manager_id,status,created_at desc);
create index if not exists appraisals_unit_status_idx
  on public.appraisals(org_id,unit_id,status,created_at desc);

-- ---------------------------------------------------------------------------
-- Stable evidence packs.
-- ---------------------------------------------------------------------------

create table public.appraisal_evidence_items(
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete restrict,
  appraisal_id uuid not null references public.appraisals(id) on delete restrict,
  profile_id uuid not null references public.profiles(id) on delete restrict,
  category text not null check(category in (
    'work','objective','feedback','activity_context','learning_history'
  )),
  source_type text not null check(length(btrim(source_type)) between 2 and 80),
  source_id uuid not null,
  occurred_on date,
  label text not null check(length(btrim(label)) between 1 and 240),
  detail jsonb not null default '{}'::jsonb check(jsonb_typeof(detail)='object'),
  generated_by uuid references public.profiles(id) on delete restrict,
  generated_at timestamptz not null default now(),
  unique(appraisal_id,source_type,source_id)
);

create index appraisal_evidence_appraisal_idx
  on public.appraisal_evidence_items(appraisal_id,category,occurred_on desc,generated_at desc);
create index appraisal_evidence_profile_idx
  on public.appraisal_evidence_items(org_id,profile_id,generated_at desc);

alter table public.appraisal_evidence_items enable row level security;
revoke all on public.appraisal_evidence_items from anon;
revoke insert,update,delete on public.appraisal_evidence_items from authenticated;
grant select on public.appraisal_evidence_items to authenticated;

-- ---------------------------------------------------------------------------
-- Append-only review writing.
-- ---------------------------------------------------------------------------

create table public.appraisal_entries(
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete restrict,
  appraisal_id uuid not null references public.appraisals(id) on delete restrict,
  profile_id uuid not null references public.profiles(id) on delete restrict,
  entry_type text not null check(entry_type in (
    'employee_reflection','manager_assessment','conversation_record','staff_response'
  )),
  body text not null check(length(btrim(body)) between 3 and 6000),
  supersedes_id uuid references public.appraisal_entries(id) on delete restrict,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create unique index appraisal_entries_supersedes_uidx
  on public.appraisal_entries(supersedes_id)
  where supersedes_id is not null;
create index appraisal_entries_appraisal_idx
  on public.appraisal_entries(appraisal_id,entry_type,created_at desc);
create index appraisal_entries_profile_idx
  on public.appraisal_entries(org_id,profile_id,created_at desc);

alter table public.appraisal_entries enable row level security;
revoke all on public.appraisal_entries from anon;
revoke insert,update,delete on public.appraisal_entries from authenticated;
grant select on public.appraisal_entries to authenticated;

-- ---------------------------------------------------------------------------
-- Append-only development plans. Learning catalogue/assignments remain Stage 8.
-- ---------------------------------------------------------------------------

create table public.development_plan_versions(
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete restrict,
  plan_key uuid not null,
  version integer not null check(version>0),
  appraisal_id uuid not null references public.appraisals(id) on delete restrict,
  profile_id uuid not null references public.profiles(id) on delete restrict,
  manager_id uuid references public.profiles(id) on delete restrict,
  focus text not null check(length(btrim(focus)) between 3 and 1000),
  desired_outcome text not null check(length(btrim(desired_outcome)) between 3 and 2000),
  next_steps text not null check(length(btrim(next_steps)) between 3 and 4000),
  starts_on date,
  target_on date,
  state text not null default 'active' check(state in ('active','completed','closed')),
  supersedes_id uuid references public.development_plan_versions(id) on delete restrict,
  change_reason text not null check(length(btrim(change_reason)) between 3 and 600),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  check(target_on is null or starts_on is null or target_on>=starts_on),
  unique(plan_key,version)
);

create unique index development_plan_supersedes_uidx
  on public.development_plan_versions(supersedes_id)
  where supersedes_id is not null;
create index development_plan_profile_idx
  on public.development_plan_versions(org_id,profile_id,created_at desc);
create index development_plan_appraisal_idx
  on public.development_plan_versions(appraisal_id,created_at desc);

alter table public.development_plan_versions enable row level security;
revoke all on public.development_plan_versions from anon;
revoke insert,update,delete on public.development_plan_versions from authenticated;
grant select on public.development_plan_versions to authenticated;

-- ---------------------------------------------------------------------------
-- Continuous factual feedback + employee right of reply.
-- ---------------------------------------------------------------------------

alter table public.feedback_notes
  add column if not exists kind text not null default 'observation',
  add column if not exists occurred_on date,
  add column if not exists work_item_id uuid references public.work_items(id) on delete restrict,
  add column if not exists project_id uuid references public.projects(id) on delete restrict,
  add column if not exists strategy_node_id uuid references public.strategy_nodes(id) on delete restrict;

alter table public.feedback_notes drop constraint if exists feedback_notes_kind_check;
alter table public.feedback_notes
  add constraint feedback_notes_kind_check
  check(kind in ('observation','recognition','guidance'));

create table public.feedback_responses(
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete restrict,
  feedback_note_id uuid not null references public.feedback_notes(id) on delete restrict,
  profile_id uuid not null references public.profiles(id) on delete restrict,
  response text not null check(length(btrim(response)) between 1 and 4000),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index feedback_responses_note_idx
  on public.feedback_responses(feedback_note_id,created_at);
create index feedback_responses_profile_idx
  on public.feedback_responses(org_id,profile_id,created_at desc);

alter table public.feedback_responses enable row level security;
revoke all on public.feedback_responses from anon;
revoke insert,update,delete on public.feedback_responses from authenticated;
grant select on public.feedback_responses to authenticated;

-- Stage 7 turns legacy direct appraisal/feedback mutation into reviewed RPC flows.
drop policy if exists ac_write on public.appraisal_cycles;
drop policy if exists ap_read on public.appraisals;
drop policy if exists ap_write on public.appraisals;
drop policy if exists fn_read on public.feedback_notes;
drop policy if exists fn_write on public.feedback_notes;

revoke all on public.appraisal_cycles from anon;
revoke all on public.appraisals from anon;
revoke all on public.feedback_notes from anon;
revoke insert,update,delete on public.appraisal_cycles from authenticated;
revoke insert,update,delete on public.appraisals from authenticated;
revoke insert,update,delete on public.feedback_notes from authenticated;
grant select on public.appraisal_cycles to authenticated;
grant select on public.appraisals to authenticated;
grant select on public.feedback_notes to authenticated;

-- Review periods are ordinary workflow context and may be named/read across the org.
drop policy if exists ac_read on public.appraisal_cycles;
create policy stage7_appraisal_cycles_read
on public.appraisal_cycles
for select to authenticated
using(org_id=public.app_org_id());

create policy stage7_appraisals_read
on public.appraisals
for select to authenticated
using(
  org_id=public.app_org_id()
  and (
    profile_id=auth.uid()
    or manager_id=auth.uid()
    or public.app_has_capability('performance.admin',null)
  )
);

create policy stage7_evidence_read
on public.appraisal_evidence_items
for select to authenticated
using(
  org_id=public.app_org_id()
  and exists(
    select 1
    from public.appraisals a
    where a.id=appraisal_id
      and a.org_id=public.app_org_id()
      and (
        a.profile_id=auth.uid()
        or a.manager_id=auth.uid()
        or public.app_has_capability('performance.admin',null)
      )
  )
);

create policy stage7_entries_read
on public.appraisal_entries
for select to authenticated
using(
  org_id=public.app_org_id()
  and exists(
    select 1
    from public.appraisals a
    where a.id=appraisal_id
      and a.org_id=public.app_org_id()
      and (
        a.profile_id=auth.uid()
        or a.manager_id=auth.uid()
        or public.app_has_capability('performance.admin',null)
      )
  )
);

create policy stage7_development_read
on public.development_plan_versions
for select to authenticated
using(
  org_id=public.app_org_id()
  and (
    profile_id=auth.uid()
    or manager_id=auth.uid()
    or public.app_has_capability('performance.admin',null)
  )
);

create policy stage7_feedback_read
on public.feedback_notes
for select to authenticated
using(
  org_id=public.app_org_id()
  and (
    profile_id=auth.uid()
    or author_id=auth.uid()
    or public.app_has_capability('performance.admin',null)
    or profile_id in (
      select er.profile_id
      from public.employment_records er
      where er.org_id=public.app_org_id()
        and (
          er.manager_profile_id=auth.uid()
          or er.unit_id in (select public.app_managed_units())
        )
    )
  )
);

create policy stage7_feedback_responses_read
on public.feedback_responses
for select to authenticated
using(
  org_id=public.app_org_id()
  and exists(
    select 1
    from public.feedback_notes f
    where f.id=feedback_note_id
      and f.org_id=public.app_org_id()
      and (
        f.profile_id=auth.uid()
        or f.author_id=auth.uid()
        or public.app_has_capability('performance.admin',null)
        or f.profile_id in (
          select er.profile_id
          from public.employment_records er
          where er.org_id=public.app_org_id()
            and (
              er.manager_profile_id=auth.uid()
              or er.unit_id in (select public.app_managed_units())
            )
        )
      )
  )
);

-- ---------------------------------------------------------------------------
-- Evidence assembly.
-- ---------------------------------------------------------------------------

create or replace function public.performance_generate_evidence_internal(
  p_appraisal_id uuid,
  p_actor_id uuid
)
returns integer
language plpgsql
security definer
set search_path=public
as $$
declare
  v_appraisal public.appraisals;
  v_cycle public.appraisal_cycles;
  v_inserted integer:=0;
  v_count integer:=0;
begin
  select * into v_appraisal
  from public.appraisals
  where id=p_appraisal_id;

  if v_appraisal.id is null then
    raise exception 'Review case not found.';
  end if;

  select * into v_cycle
  from public.appraisal_cycles
  where id=v_appraisal.cycle_id and org_id=v_appraisal.org_id;

  if v_cycle.id is null then
    raise exception 'Review period not found.';
  end if;

  insert into public.appraisal_evidence_items(
    org_id,appraisal_id,profile_id,category,source_type,source_id,
    occurred_on,label,detail,generated_by
  )
  select
    v_appraisal.org_id,v_appraisal.id,v_appraisal.profile_id,
    'work','work_item',w.id,
    w.completed_at::date,w.title,
    jsonb_strip_nulls(jsonb_build_object(
      'ref',w.ref,
      'kind',w.kind,
      'origin',w.origin,
      'status',w.status,
      'due_at',w.due_at,
      'completed_at',w.completed_at,
      'first_time_approved',w.first_time_approved,
      'project_id',w.project_id,
      'objective_id',w.objective_id
    )),
    p_actor_id
  from public.work_items w
  where w.org_id=v_appraisal.org_id
    and w.assignee_id=v_appraisal.profile_id
    and w.kind in ('task','deliverable')
    and w.status in ('completed','self_certified')
    and w.completed_at is not null
    and w.completed_at::date between v_cycle.starts_on and v_cycle.ends_on
  on conflict(appraisal_id,source_type,source_id) do nothing;
  get diagnostics v_count=row_count;
  v_inserted:=v_inserted+v_count;

  insert into public.appraisal_evidence_items(
    org_id,appraisal_id,profile_id,category,source_type,source_id,
    occurred_on,label,detail,generated_by
  )
  select
    v_appraisal.org_id,v_appraisal.id,v_appraisal.profile_id,
    'objective','strategy_node',s.id,
    coalesce(s.target_on,s.starts_on,s.created_at::date),s.name,
    jsonb_strip_nulls(jsonb_build_object(
      'node_type',s.node_type,
      'statement',s.statement,
      'measurement_kind',s.measurement_kind,
      'measure_label',s.measure_label,
      'target_value',s.target_value,
      'target_unit',s.target_unit,
      'current_value',s.current_value,
      'status',s.status,
      'starts_on',s.starts_on,
      'target_on',s.target_on
    )),
    p_actor_id
  from public.strategy_nodes s
  where s.org_id=v_appraisal.org_id
    and s.owner_profile_id=v_appraisal.profile_id
    and s.status<>'draft'
    and coalesce(s.starts_on,s.created_at::date)<=v_cycle.ends_on
    and coalesce(s.target_on,v_cycle.ends_on)>=v_cycle.starts_on
  on conflict(appraisal_id,source_type,source_id) do nothing;
  get diagnostics v_count=row_count;
  v_inserted:=v_inserted+v_count;

  insert into public.appraisal_evidence_items(
    org_id,appraisal_id,profile_id,category,source_type,source_id,
    occurred_on,label,detail,generated_by
  )
  select
    v_appraisal.org_id,v_appraisal.id,v_appraisal.profile_id,
    'feedback','feedback_note',f.id,
    coalesce(f.occurred_on,f.created_at::date),
    initcap(replace(f.kind,'_',' '))||' feedback',
    jsonb_strip_nulls(jsonb_build_object(
      'kind',f.kind,
      'note',f.note,
      'occurred_on',f.occurred_on,
      'work_item_id',f.work_item_id,
      'project_id',f.project_id,
      'strategy_node_id',f.strategy_node_id,
      'author_id',f.author_id
    )),
    p_actor_id
  from public.feedback_notes f
  where f.org_id=v_appraisal.org_id
    and f.profile_id=v_appraisal.profile_id
    and coalesce(f.occurred_on,f.created_at::date) between v_cycle.starts_on and v_cycle.ends_on
  on conflict(appraisal_id,source_type,source_id) do nothing;
  get diagnostics v_count=row_count;
  v_inserted:=v_inserted+v_count;

  insert into public.appraisal_evidence_items(
    org_id,appraisal_id,profile_id,category,source_type,source_id,
    occurred_on,label,detail,generated_by
  )
  select
    v_appraisal.org_id,v_appraisal.id,v_appraisal.profile_id,
    'activity_context','work_session',ws.id,
    ws.started_at::date,
    'Recorded work session · '||to_char(ws.started_at::date,'DD Mon YYYY'),
    jsonb_strip_nulls(jsonb_build_object(
      'started_at',ws.started_at,
      'ended_at',ws.ended_at,
      'place',ws.place,
      'end_reason',ws.end_reason
    )),
    p_actor_id
  from public.work_sessions ws
  where ws.org_id=v_appraisal.org_id
    and ws.profile_id=v_appraisal.profile_id
    and ws.started_at::date between v_cycle.starts_on and v_cycle.ends_on
  on conflict(appraisal_id,source_type,source_id) do nothing;
  get diagnostics v_count=row_count;
  v_inserted:=v_inserted+v_count;

  insert into public.appraisal_evidence_items(
    org_id,appraisal_id,profile_id,category,source_type,source_id,
    occurred_on,label,detail,generated_by
  )
  select
    v_appraisal.org_id,v_appraisal.id,v_appraisal.profile_id,
    'learning_history','training_record',tr.id,
    tr.completed_on,tr.name,
    jsonb_strip_nulls(jsonb_build_object(
      'completed_on',tr.completed_on,
      'note',tr.note
    )),
    p_actor_id
  from public.training_records tr
  where tr.org_id=v_appraisal.org_id
    and tr.profile_id=v_appraisal.profile_id
    and tr.completed_on is not null
    and tr.completed_on between v_cycle.starts_on and v_cycle.ends_on
  on conflict(appraisal_id,source_type,source_id) do nothing;
  get diagnostics v_count=row_count;
  v_inserted:=v_inserted+v_count;

  return v_inserted;
end;
$$;

revoke all on function public.performance_generate_evidence_internal(uuid,uuid)
  from public,anon,authenticated;
grant execute on function public.performance_generate_evidence_internal(uuid,uuid)
  to service_role;

-- ---------------------------------------------------------------------------
-- Review-period administration.
-- ---------------------------------------------------------------------------

create or replace function public.open_performance_review_cycle(
  p_name text,
  p_starts_on date,
  p_ends_on date,
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  v_org uuid:=public.app_org_id();
  v_actor uuid:=auth.uid();
  v_cycle_id uuid;
  v_appraisal_id uuid;
begin
  if v_actor is null or not public.app_has_capability('performance.admin',null) then
    raise exception 'You do not have authority to open review periods.' using errcode='42501';
  end if;
  if length(btrim(coalesce(p_name,'')))<3 then
    raise exception 'Review period name is required.';
  end if;
  if p_starts_on is null or p_ends_on is null or p_ends_on<p_starts_on then
    raise exception 'Choose a valid review period.';
  end if;
  if length(btrim(coalesce(p_reason,'')))<3 then
    raise exception 'A reason is required.';
  end if;

  insert into public.appraisal_cycles(
    org_id,name,starts_on,ends_on,status,opened_by,opened_reason
  ) values (
    v_org,btrim(p_name),p_starts_on,p_ends_on,'open',v_actor,btrim(p_reason)
  )
  returning id into v_cycle_id;

  for v_appraisal_id in
    insert into public.appraisals(
      org_id,cycle_id,profile_id,manager_id,unit_id,status,opened_by,
      reviewer_assigned_by,reviewer_assigned_at,reviewer_assignment_reason
    )
    select
      er.org_id,v_cycle_id,er.profile_id,er.manager_profile_id,er.unit_id,
      'evidence',v_actor,
      case when er.manager_profile_id is not null then v_actor else null end,
      case when er.manager_profile_id is not null then now() else null end,
      case when er.manager_profile_id is not null
        then 'Reviewer copied from the current employment record when the review period opened.'
        else null end
    from public.employment_records er
    join public.profiles p on p.id=er.profile_id and p.org_id=er.org_id
    where er.org_id=v_org
      and er.employment_status='active'
      and p.active
      and not p.is_admin
      and not p.is_exec
    on conflict(cycle_id,profile_id) do nothing
    returning id
  loop
    perform public.performance_generate_evidence_internal(v_appraisal_id,v_actor);
  end loop;

  return v_cycle_id;
end;
$$;

revoke all on function public.open_performance_review_cycle(text,date,date,text)
  from public,anon;
grant execute on function public.open_performance_review_cycle(text,date,date,text)
  to authenticated,service_role;

create or replace function public.refresh_performance_evidence(
  p_appraisal_id uuid
)
returns integer
language plpgsql
security definer
set search_path=public
as $$
declare
  v_org uuid:=public.app_org_id();
  v_actor uuid:=auth.uid();
  v_appraisal public.appraisals;
begin
  select * into v_appraisal
  from public.appraisals
  where id=p_appraisal_id and org_id=v_org;

  if v_appraisal.id is null then
    raise exception 'Review case not found.' using errcode='42501';
  end if;

  if not (
    public.app_has_capability('performance.admin',null)
    or v_appraisal.manager_id=v_actor
  ) then
    raise exception 'You do not have authority to refresh this evidence pack.' using errcode='42501';
  end if;

  return public.performance_generate_evidence_internal(v_appraisal.id,v_actor);
end;
$$;

revoke all on function public.refresh_performance_evidence(uuid) from public,anon;
grant execute on function public.refresh_performance_evidence(uuid)
  to authenticated,service_role;

create or replace function public.assign_performance_reviewer(
  p_appraisal_id uuid,
  p_reviewer_id uuid,
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
  v_appraisal public.appraisals;
  v_ok boolean:=false;
begin
  if v_actor is null or not public.app_has_capability('performance.admin',null) then
    raise exception 'You do not have authority to assign review responsibility.' using errcode='42501';
  end if;
  if length(btrim(coalesce(p_reason,'')))<3 then
    raise exception 'A reason is required.';
  end if;

  select * into v_appraisal
  from public.appraisals
  where id=p_appraisal_id and org_id=v_org;

  if v_appraisal.id is null then
    raise exception 'Review case not found.' using errcode='42501';
  end if;

  select exists(
    select 1
    from public.profiles p
    where p.id=p_reviewer_id
      and p.org_id=v_org
      and p.active
      and (
        p.is_admin
        or exists(
          select 1 from public.unit_memberships um
          where um.profile_id=p.id
            and um.org_id=v_org
            and um.unit_id=v_appraisal.unit_id
            and um.role='manager'
        )
      )
  ) into v_ok;

  if not v_ok then
    raise exception 'Choose an active Administration user or manager for this employee''s unit.'
      using errcode='42501';
  end if;

  update public.appraisals
  set manager_id=p_reviewer_id,
      reviewer_assigned_by=v_actor,
      reviewer_assigned_at=now(),
      reviewer_assignment_reason=btrim(p_reason)
  where id=v_appraisal.id;
end;
$$;

revoke all on function public.assign_performance_reviewer(uuid,uuid,text) from public,anon;
grant execute on function public.assign_performance_reviewer(uuid,uuid,text)
  to authenticated,service_role;

-- ---------------------------------------------------------------------------
-- Append-only review entries.
-- ---------------------------------------------------------------------------

create or replace function public.record_appraisal_entry(
  p_appraisal_id uuid,
  p_entry_type text,
  p_body text,
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
  v_appraisal public.appraisals;
  v_prior public.appraisal_entries;
  v_id uuid;
begin
  select * into v_appraisal
  from public.appraisals
  where id=p_appraisal_id and org_id=v_org;

  if v_appraisal.id is null then
    raise exception 'Review case not found.' using errcode='42501';
  end if;
  if p_entry_type not in (
    'employee_reflection','manager_assessment','conversation_record','staff_response'
  ) then
    raise exception 'That review entry type is not supported.';
  end if;
  if length(btrim(coalesce(p_body,'')))<3 then
    raise exception 'Write at least a short review note.';
  end if;

  if p_entry_type in ('employee_reflection','staff_response') then
    if v_actor is distinct from v_appraisal.profile_id then
      raise exception 'Only the employee can write this part of the review.' using errcode='42501';
    end if;
  else
    if v_actor is distinct from v_appraisal.manager_id then
      raise exception 'Only the assigned reviewer can write this part of the review.' using errcode='42501';
    end if;
  end if;

  if p_supersedes_id is not null then
    select * into v_prior
    from public.appraisal_entries
    where id=p_supersedes_id
      and appraisal_id=v_appraisal.id
      and entry_type=p_entry_type;

    if v_prior.id is null then
      raise exception 'The review entry being revised was not found.';
    end if;
    if exists(select 1 from public.appraisal_entries where supersedes_id=v_prior.id) then
      raise exception 'That review entry has already been revised.';
    end if;
  end if;

  insert into public.appraisal_entries(
    org_id,appraisal_id,profile_id,entry_type,body,supersedes_id,created_by
  ) values (
    v_org,v_appraisal.id,v_appraisal.profile_id,p_entry_type,btrim(p_body),
    p_supersedes_id,v_actor
  )
  returning id into v_id;

  if p_entry_type='employee_reflection'
     and v_appraisal.status='evidence' then
    update public.appraisals
    set status='reflection_submitted'
    where id=v_appraisal.id;
  elsif p_entry_type='manager_assessment'
     and v_appraisal.status in ('evidence','reflection_submitted') then
    update public.appraisals
    set status='manager_draft'
    where id=v_appraisal.id;
  elsif p_entry_type='conversation_record'
     and v_appraisal.status in ('evidence','reflection_submitted','manager_draft') then
    update public.appraisals
    set status='conversation_recorded'
    where id=v_appraisal.id;
  end if;

  return v_id;
end;
$$;

revoke all on function public.record_appraisal_entry(uuid,text,text,uuid) from public,anon;
grant execute on function public.record_appraisal_entry(uuid,text,text,uuid)
  to authenticated,service_role;

create or replace function public.share_performance_review(
  p_appraisal_id uuid
)
returns void
language plpgsql
security definer
set search_path=public
as $$
declare
  v_org uuid:=public.app_org_id();
  v_actor uuid:=auth.uid();
  v_appraisal public.appraisals;
begin
  select * into v_appraisal
  from public.appraisals
  where id=p_appraisal_id and org_id=v_org;

  if v_appraisal.id is null then
    raise exception 'Review case not found.' using errcode='42501';
  end if;
  if v_actor is distinct from v_appraisal.manager_id then
    raise exception 'Only the assigned reviewer can share this review.' using errcode='42501';
  end if;

  update public.appraisals
  set status='shared',shared_at=now(),shared_by=v_actor
  where id=v_appraisal.id;
end;
$$;

revoke all on function public.share_performance_review(uuid) from public,anon;
grant execute on function public.share_performance_review(uuid)
  to authenticated,service_role;

create or replace function public.close_performance_review_cycle(
  p_cycle_id uuid,
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
begin
  if v_actor is null or not public.app_has_capability('performance.admin',null) then
    raise exception 'You do not have authority to close review periods.' using errcode='42501';
  end if;
  if length(btrim(coalesce(p_reason,'')))<3 then
    raise exception 'A reason is required.';
  end if;

  update public.appraisal_cycles
  set status='closed',closed_by=v_actor,closed_at=now(),close_reason=btrim(p_reason)
  where id=p_cycle_id and org_id=v_org and status='open';

  if not found then
    raise exception 'Open review period not found.' using errcode='42501';
  end if;

  update public.appraisals
  set status='closed',closed_by=v_actor,closed_at=now()
  where cycle_id=p_cycle_id and org_id=v_org and status='shared';
end;
$$;

revoke all on function public.close_performance_review_cycle(uuid,text) from public,anon;
grant execute on function public.close_performance_review_cycle(uuid,text)
  to authenticated,service_role;

-- ---------------------------------------------------------------------------
-- Development plan versioning.
-- ---------------------------------------------------------------------------

create or replace function public.record_development_plan_version(
  p_appraisal_id uuid,
  p_focus text,
  p_desired_outcome text,
  p_next_steps text,
  p_starts_on date,
  p_target_on date,
  p_state text,
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
  v_appraisal public.appraisals;
  v_prior public.development_plan_versions;
  v_plan_key uuid;
  v_version integer;
  v_id uuid;
begin
  select * into v_appraisal
  from public.appraisals
  where id=p_appraisal_id and org_id=v_org;

  if v_appraisal.id is null then
    raise exception 'Review case not found.' using errcode='42501';
  end if;
  if v_actor is distinct from v_appraisal.manager_id then
    raise exception 'Only the assigned reviewer can record this development plan.' using errcode='42501';
  end if;
  if length(btrim(coalesce(p_focus,'')))<3
     or length(btrim(coalesce(p_desired_outcome,'')))<3
     or length(btrim(coalesce(p_next_steps,'')))<3 then
    raise exception 'Focus, desired outcome and next steps are required.';
  end if;
  if p_state not in ('active','completed','closed') then
    raise exception 'Choose a valid development-plan state.';
  end if;
  if p_target_on is not null and p_starts_on is not null and p_target_on<p_starts_on then
    raise exception 'Target date cannot be before the start date.';
  end if;
  if length(btrim(coalesce(p_reason,'')))<3 then
    raise exception 'A reason is required for development-plan changes.';
  end if;

  if p_supersedes_id is not null then
    select * into v_prior
    from public.development_plan_versions
    where id=p_supersedes_id
      and appraisal_id=v_appraisal.id
      and org_id=v_org;

    if v_prior.id is null then
      raise exception 'The development-plan version being revised was not found.';
    end if;
    if exists(select 1 from public.development_plan_versions where supersedes_id=v_prior.id) then
      raise exception 'That development-plan version has already been superseded.';
    end if;

    v_plan_key:=v_prior.plan_key;
    v_version:=v_prior.version+1;
  else
    v_plan_key:=gen_random_uuid();
    v_version:=1;
  end if;

  insert into public.development_plan_versions(
    org_id,plan_key,version,appraisal_id,profile_id,manager_id,
    focus,desired_outcome,next_steps,starts_on,target_on,state,
    supersedes_id,change_reason,created_by
  ) values (
    v_org,v_plan_key,v_version,v_appraisal.id,v_appraisal.profile_id,v_appraisal.manager_id,
    btrim(p_focus),btrim(p_desired_outcome),btrim(p_next_steps),
    p_starts_on,p_target_on,p_state,p_supersedes_id,btrim(p_reason),v_actor
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.record_development_plan_version(
  uuid,text,text,text,date,date,text,text,uuid
) from public,anon;
grant execute on function public.record_development_plan_version(
  uuid,text,text,text,date,date,text,text,uuid
) to authenticated,service_role;

-- ---------------------------------------------------------------------------
-- Continuous factual feedback.
-- ---------------------------------------------------------------------------

create or replace function public.record_performance_feedback(
  p_profile_id uuid,
  p_kind text,
  p_note text,
  p_occurred_on date default current_date,
  p_work_item_id uuid default null,
  p_project_id uuid default null,
  p_strategy_node_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  v_org uuid:=public.app_org_id();
  v_actor uuid:=auth.uid();
  v_record public.employment_records;
  v_id uuid;
begin
  select * into v_record
  from public.employment_records
  where profile_id=p_profile_id and org_id=v_org;

  if v_record.profile_id is null then
    raise exception 'Employee record not found.' using errcode='42501';
  end if;

  if not (
    public.app_has_capability('performance.admin',null)
    or v_record.manager_profile_id=v_actor
    or v_record.unit_id in (select public.app_managed_units())
  ) then
    raise exception 'You do not have authority to record feedback for this person.' using errcode='42501';
  end if;

  if p_kind not in ('observation','recognition','guidance') then
    raise exception 'Choose a valid feedback type.';
  end if;
  if length(btrim(coalesce(p_note,'')))<3 then
    raise exception 'Feedback is required.';
  end if;

  if p_work_item_id is not null and not exists(
    select 1 from public.work_items w
    where w.id=p_work_item_id and w.org_id=v_org and w.assignee_id=p_profile_id
  ) then
    raise exception 'That work item is not recorded for this person.' using errcode='42501';
  end if;

  if p_project_id is not null and not exists(
    select 1 from public.projects p where p.id=p_project_id and p.org_id=v_org
  ) then
    raise exception 'That project is not in your organisation.' using errcode='42501';
  end if;

  if p_strategy_node_id is not null and not exists(
    select 1 from public.strategy_nodes s
    where s.id=p_strategy_node_id and s.org_id=v_org and s.owner_profile_id=p_profile_id
  ) then
    raise exception 'That objective is not recorded as owned by this person.' using errcode='42501';
  end if;

  insert into public.feedback_notes(
    org_id,profile_id,author_id,note,kind,occurred_on,
    work_item_id,project_id,strategy_node_id
  ) values (
    v_org,p_profile_id,v_actor,btrim(p_note),p_kind,coalesce(p_occurred_on,current_date),
    p_work_item_id,p_project_id,p_strategy_node_id
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.record_performance_feedback(
  uuid,text,text,date,uuid,uuid,uuid
) from public,anon;
grant execute on function public.record_performance_feedback(
  uuid,text,text,date,uuid,uuid,uuid
) to authenticated,service_role;

create or replace function public.respond_to_performance_feedback(
  p_feedback_note_id uuid,
  p_response text
)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  v_org uuid:=public.app_org_id();
  v_actor uuid:=auth.uid();
  v_feedback public.feedback_notes;
  v_id uuid;
begin
  select * into v_feedback
  from public.feedback_notes
  where id=p_feedback_note_id and org_id=v_org;

  if v_feedback.id is null then
    raise exception 'Feedback not found.' using errcode='42501';
  end if;
  if v_feedback.profile_id is distinct from v_actor then
    raise exception 'Only the person this feedback is about can reply.' using errcode='42501';
  end if;
  if length(btrim(coalesce(p_response,'')))<1 then
    raise exception 'Write a response first.';
  end if;

  insert into public.feedback_responses(
    org_id,feedback_note_id,profile_id,response,created_by
  ) values (
    v_org,v_feedback.id,v_feedback.profile_id,btrim(p_response),v_actor
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.respond_to_performance_feedback(uuid,text) from public,anon;
grant execute on function public.respond_to_performance_feedback(uuid,text)
  to authenticated,service_role;

-- ---------------------------------------------------------------------------
-- Audit capture.
-- ---------------------------------------------------------------------------

create trigger audit_appraisal_cycles_stage7
after insert or update on public.appraisal_cycles
for each row execute function public.platform_audit_capture('appraisal_cycle','id','');

create trigger audit_appraisals_stage7
after insert or update on public.appraisals
for each row execute function public.platform_audit_capture('appraisal','id','profile_id');

create trigger audit_appraisal_evidence_stage7
after insert on public.appraisal_evidence_items
for each row execute function public.platform_audit_capture('appraisal_evidence','id','profile_id');

create trigger audit_appraisal_entries_stage7
after insert on public.appraisal_entries
for each row execute function public.platform_audit_capture('appraisal_entry','id','profile_id');

create trigger audit_development_plan_versions_stage7
after insert on public.development_plan_versions
for each row execute function public.platform_audit_capture('development_plan_version','id','profile_id');

create trigger audit_feedback_notes_stage7
after insert on public.feedback_notes
for each row execute function public.platform_audit_capture('feedback_note','id','profile_id');

create trigger audit_feedback_responses_stage7
after insert on public.feedback_responses
for each row execute function public.platform_audit_capture('feedback_response','id','profile_id');

-- ---------------------------------------------------------------------------
-- Semantic events. Narrative text is deliberately excluded from event payloads.
-- ---------------------------------------------------------------------------

insert into public.platform_event_definitions(
  event_type,label,description,source_domain,payload_version
) values
  ('performance.review_cycle_opened','Review period opened',
   'A performance-development review period was opened.','performance',1),
  ('performance.evidence_generated','Review evidence generated',
   'A factual review-evidence item was generated.','performance',1),
  ('performance.review_entry_recorded','Review entry recorded',
   'An append-only review entry was recorded.','performance',1),
  ('performance.review_shared','Review shared',
   'An assigned reviewer marked a review as shared.','performance',1),
  ('performance.development_changed','Development plan changed',
   'A new development-plan version was recorded.','performance',1),
  ('performance.feedback_recorded','Feedback recorded',
   'Continuous factual feedback was recorded.','performance',1),
  ('performance.feedback_response_recorded','Feedback response recorded',
   'The employee recorded a response to feedback.','performance',1)
on conflict(event_type) do nothing;

create or replace function public.performance_event_cycle()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  if tg_op='INSERT' then
    perform public.platform_emit_event(
      new.org_id,'performance.review_cycle_opened',new.opened_by,null,
      'appraisal_cycle',new.id,
      jsonb_build_object('starts_on',new.starts_on,'ends_on',new.ends_on),
      'performance-cycle:'||new.id::text,null,null,new.created_at
    );
  end if;
  return new;
end;
$$;
revoke all on function public.performance_event_cycle() from public,anon,authenticated;
create trigger performance_cycle_emit_event
after insert on public.appraisal_cycles
for each row execute function public.performance_event_cycle();

create or replace function public.performance_event_evidence()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  perform public.platform_emit_event(
    new.org_id,'performance.evidence_generated',new.generated_by,new.profile_id,
    'appraisal',new.appraisal_id,
    jsonb_build_object('category',new.category,'source_type',new.source_type,'source_id',new.source_id),
    'performance-evidence:'||new.id::text,null,null,new.generated_at
  );
  return new;
end;
$$;
revoke all on function public.performance_event_evidence() from public,anon,authenticated;
create trigger performance_evidence_emit_event
after insert on public.appraisal_evidence_items
for each row execute function public.performance_event_evidence();

create or replace function public.performance_event_entry()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  perform public.platform_emit_event(
    new.org_id,'performance.review_entry_recorded',new.created_by,new.profile_id,
    'appraisal',new.appraisal_id,
    jsonb_build_object('entry_type',new.entry_type,'supersedes_id',new.supersedes_id),
    'performance-entry:'||new.id::text,null,null,new.created_at
  );
  return new;
end;
$$;
revoke all on function public.performance_event_entry() from public,anon,authenticated;
create trigger performance_entry_emit_event
after insert on public.appraisal_entries
for each row execute function public.performance_event_entry();

create or replace function public.performance_event_shared()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  if old.status is distinct from new.status and new.status='shared' then
    perform public.platform_emit_event(
      new.org_id,'performance.review_shared',new.shared_by,new.profile_id,
      'appraisal',new.id,
      jsonb_build_object('cycle_id',new.cycle_id),
      'performance-shared:'||new.id::text,null,null,coalesce(new.shared_at,now())
    );
  end if;
  return new;
end;
$$;
revoke all on function public.performance_event_shared() from public,anon,authenticated;
create trigger performance_shared_emit_event
after update on public.appraisals
for each row execute function public.performance_event_shared();

create or replace function public.performance_event_development()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  perform public.platform_emit_event(
    new.org_id,'performance.development_changed',new.created_by,new.profile_id,
    'development_plan',new.plan_key,
    jsonb_build_object('version',new.version,'state',new.state,'appraisal_id',new.appraisal_id),
    'performance-development:'||new.id::text,null,null,new.created_at
  );
  return new;
end;
$$;
revoke all on function public.performance_event_development() from public,anon,authenticated;
create trigger performance_development_emit_event
after insert on public.development_plan_versions
for each row execute function public.performance_event_development();

create or replace function public.performance_event_feedback()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  perform public.platform_emit_event(
    new.org_id,'performance.feedback_recorded',new.author_id,new.profile_id,
    'feedback_note',new.id,
    jsonb_build_object(
      'kind',new.kind,
      'occurred_on',new.occurred_on,
      'work_item_id',new.work_item_id,
      'project_id',new.project_id,
      'strategy_node_id',new.strategy_node_id
    ),
    'performance-feedback:'||new.id::text,null,null,new.created_at
  );
  return new;
end;
$$;
revoke all on function public.performance_event_feedback() from public,anon,authenticated;
create trigger performance_feedback_emit_event
after insert on public.feedback_notes
for each row execute function public.performance_event_feedback();

create or replace function public.performance_event_feedback_response()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  perform public.platform_emit_event(
    new.org_id,'performance.feedback_response_recorded',new.created_by,new.profile_id,
    'feedback_note',new.feedback_note_id,
    jsonb_build_object('response_id',new.id),
    'performance-feedback-response:'||new.id::text,null,null,new.created_at
  );
  return new;
end;
$$;
revoke all on function public.performance_event_feedback_response() from public,anon,authenticated;
create trigger performance_feedback_response_emit_event
after insert on public.feedback_responses
for each row execute function public.performance_event_feedback_response();
