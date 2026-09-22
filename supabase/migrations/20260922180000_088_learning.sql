-- 088 — Stage 8: focused Learning.
-- Extends the existing training_records completion log with structured learning.

insert into public.capability_definitions(capability,label,description,sensitive)
values (
  'learning.manage',
  'Manage learning',
  'Create structured learning, assignment rules and attributable learning corrections.',
  true
)
on conflict(capability) do nothing;

insert into public.capability_grants(
  org_id,profile_id,capability,scope_unit_id,granted_by,grant_reason
)
select p.org_id,p.id,'learning.manage',null,null,
       'Stage 8 baseline from existing Administration authority.'
from public.profiles p
where p.is_admin and p.active
  and not exists (
    select 1
    from public.capability_grants cg
    where cg.org_id=p.org_id
      and cg.profile_id=p.id
      and cg.capability='learning.manage'
      and cg.scope_unit_id is null
      and cg.revoked_at is null
  );

insert into public.platform_event_definitions(
  event_type,label,description,source_domain,payload_version
) values
  ('learning.course_published','Learning course published',
   'A structured learning course was published.','learning',1),
  ('learning.assignment_created','Learning assignment created',
   'A person-level learning assignment was materialised from an approved rule.','learning',1),
  ('learning.module_completed','Learning module completed',
   'A learner recorded completion of a module.','learning',1),
  ('learning.progress_corrected','Learning progress corrected',
   'Learning Administration reopened a recorded module completion.','learning',1),
  ('learning.course_completed','Learning course completed',
   'All required modules in a learning assignment were completed.','learning',1),
  ('learning.assignment_changed','Learning assignment changed',
   'Learning Administration withdrew or restored a person-level assignment.','learning',1)
on conflict(event_type) do nothing;

create table public.learning_courses(
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete restrict,
  title text not null check(length(btrim(title)) between 3 and 180),
  summary text not null check(length(btrim(summary)) between 3 and 2000),
  estimated_minutes integer check(estimated_minutes is null or estimated_minutes between 1 and 10080),
  state text not null default 'draft' check(state in ('draft','published','archived')),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_by uuid not null references public.profiles(id) on delete restrict,
  updated_at timestamptz not null default now()
);

create index learning_courses_org_state_idx
  on public.learning_courses(org_id,state,created_at desc);

create table public.learning_modules(
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete restrict,
  course_id uuid not null references public.learning_courses(id) on delete restrict,
  position integer not null check(position>0),
  title text not null check(length(btrim(title)) between 2 and 180),
  summary text,
  required boolean not null default true,
  estimated_minutes integer check(estimated_minutes is null or estimated_minutes between 1 and 1440),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_by uuid not null references public.profiles(id) on delete restrict,
  updated_at timestamptz not null default now(),
  unique(course_id,position)
);

create index learning_modules_course_idx
  on public.learning_modules(course_id,position);

create table public.learning_resources(
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete restrict,
  module_id uuid not null references public.learning_modules(id) on delete restrict,
  position integer not null check(position>0),
  resource_type text not null check(resource_type in ('link','video','document','text')),
  title text not null check(length(btrim(title)) between 2 and 180),
  resource_url text,
  body_text text,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_by uuid not null references public.profiles(id) on delete restrict,
  updated_at timestamptz not null default now(),
  unique(module_id,position),
  check(
    (resource_type='text' and length(btrim(coalesce(body_text,'')))>=1 and resource_url is null)
    or
    (resource_type in ('link','video','document')
      and resource_url ~ '^https://'
      and body_text is null)
  )
);

create index learning_resources_module_idx
  on public.learning_resources(module_id,position);

create table public.learning_assignment_rules(
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete restrict,
  course_id uuid not null references public.learning_courses(id) on delete restrict,
  target_kind text not null check(target_kind in ('person','unit','role','onboarding')),
  target_profile_id uuid references public.profiles(id) on delete restrict,
  target_unit_id uuid references public.units(id) on delete restrict,
  target_role text check(target_role in ('manager','sub_team_lead','staff')),
  due_days_after_assignment integer check(due_days_after_assignment is null or due_days_after_assignment between 1 and 3650),
  reason text not null check(length(btrim(reason)) between 3 and 600),
  active boolean not null default true,
  assigned_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_by uuid not null references public.profiles(id) on delete restrict,
  updated_at timestamptz not null default now(),
  check(
    (target_kind='person' and target_profile_id is not null and target_unit_id is null and target_role is null)
    or
    (target_kind='unit' and target_profile_id is null and target_unit_id is not null and target_role is null)
    or
    (target_kind='role' and target_profile_id is null and target_unit_id is null and target_role is not null)
    or
    (target_kind='onboarding' and target_profile_id is null and target_unit_id is null and target_role is null)
  )
);

create index learning_assignment_rules_org_idx
  on public.learning_assignment_rules(org_id,active,target_kind,created_at desc);
create index learning_assignment_rules_course_idx
  on public.learning_assignment_rules(course_id,active);

create table public.learning_assignments(
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete restrict,
  course_id uuid not null references public.learning_courses(id) on delete restrict,
  profile_id uuid not null references public.profiles(id) on delete restrict,
  source_rule_id uuid references public.learning_assignment_rules(id) on delete restrict,
  assigned_by uuid references public.profiles(id) on delete restrict,
  assigned_at timestamptz not null default now(),
  due_on date,
  assignment_reason text not null check(length(btrim(assignment_reason)) between 3 and 600),
  state text not null default 'assigned' check(state in ('assigned','in_progress','completed','withdrawn')),
  completed_at timestamptz,
  withdrawn_at timestamptz,
  withdrawn_by uuid references public.profiles(id) on delete restrict,
  withdrawal_reason text,
  check(
    (state='completed' and completed_at is not null)
    or state<>'completed'
  ),
  check(
    (state='withdrawn' and withdrawn_at is not null and withdrawn_by is not null and length(btrim(coalesce(withdrawal_reason,'')))>=3)
    or state<>'withdrawn'
  ),
  unique(course_id,profile_id)
);

create index learning_assignments_profile_idx
  on public.learning_assignments(org_id,profile_id,state,assigned_at desc);
create index learning_assignments_course_idx
  on public.learning_assignments(course_id,state,assigned_at desc);

create table public.learning_module_progress(
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete restrict,
  assignment_id uuid not null references public.learning_assignments(id) on delete restrict,
  module_id uuid not null references public.learning_modules(id) on delete restrict,
  state text not null default 'not_started' check(state in ('not_started','completed')),
  completed_at timestamptz,
  updated_by uuid not null references public.profiles(id) on delete restrict,
  updated_at timestamptz not null default now(),
  check((state='completed' and completed_at is not null) or state<>'completed'),
  unique(assignment_id,module_id)
);

create index learning_module_progress_assignment_idx
  on public.learning_module_progress(assignment_id,module_id);

create table public.learning_progress_history(
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete restrict,
  assignment_id uuid not null references public.learning_assignments(id) on delete restrict,
  module_id uuid not null references public.learning_modules(id) on delete restrict,
  action text not null check(action in ('completed','reopened')),
  reason text,
  actor_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  check(action<>'reopened' or length(btrim(coalesce(reason,'')))>=3)
);

create index learning_progress_history_assignment_idx
  on public.learning_progress_history(assignment_id,created_at desc);

alter table public.training_records
  add column if not exists source text not null default 'historical'
    check(source in ('historical','learning_course')),
  add column if not exists learning_assignment_id uuid references public.learning_assignments(id) on delete restrict,
  add column if not exists recorded_by uuid references public.profiles(id) on delete restrict,
  add column if not exists voided_at timestamptz,
  add column if not exists voided_by uuid references public.profiles(id) on delete restrict,
  add column if not exists void_reason text;

create unique index if not exists training_records_learning_assignment_uidx
  on public.training_records(learning_assignment_id)
  where learning_assignment_id is not null;

alter table public.learning_courses enable row level security;
alter table public.learning_modules enable row level security;
alter table public.learning_resources enable row level security;
alter table public.learning_assignment_rules enable row level security;
alter table public.learning_assignments enable row level security;
alter table public.learning_module_progress enable row level security;
alter table public.learning_progress_history enable row level security;

revoke all on public.learning_courses from anon;
revoke all on public.learning_modules from anon;
revoke all on public.learning_resources from anon;
revoke all on public.learning_assignment_rules from anon;
revoke all on public.learning_assignments from anon;
revoke all on public.learning_module_progress from anon;
revoke all on public.learning_progress_history from anon;
revoke all on public.training_records from anon;

revoke all on public.learning_courses from authenticated;
revoke all on public.learning_modules from authenticated;
revoke all on public.learning_resources from authenticated;
revoke all on public.learning_assignment_rules from authenticated;
revoke all on public.learning_assignments from authenticated;
revoke all on public.learning_module_progress from authenticated;
revoke all on public.learning_progress_history from authenticated;
revoke insert,update,delete on public.training_records from authenticated;

grant select,insert,update on public.learning_courses to authenticated;
grant select,insert,update,delete on public.learning_modules to authenticated;
grant select,insert,update,delete on public.learning_resources to authenticated;
grant select,insert,update on public.learning_assignment_rules to authenticated;
grant select on public.learning_assignments to authenticated;
grant select on public.learning_module_progress to authenticated;
grant select on public.learning_progress_history to authenticated;
grant select,insert,update on public.training_records to authenticated;

create policy learning_courses_read
on public.learning_courses
for select to authenticated
using(
  org_id=public.app_org_id()
  and (state<>'draft' or public.app_has_capability('learning.manage',null))
);

create policy learning_courses_insert
on public.learning_courses
for insert to authenticated
with check(
  org_id=public.app_org_id()
  and state='draft'
  and created_by=auth.uid()
  and updated_by=auth.uid()
  and public.app_has_capability('learning.manage',null)
);

create policy learning_courses_update
on public.learning_courses
for update to authenticated
using(org_id=public.app_org_id() and public.app_has_capability('learning.manage',null))
with check(
  org_id=public.app_org_id()
  and updated_by=auth.uid()
  and public.app_has_capability('learning.manage',null)
);

create policy learning_modules_read
on public.learning_modules
for select to authenticated
using(
  org_id=public.app_org_id()
  and exists(
    select 1 from public.learning_courses c
    where c.id=course_id
      and c.org_id=public.app_org_id()
      and (c.state<>'draft' or public.app_has_capability('learning.manage',null))
  )
);

create policy learning_modules_write
on public.learning_modules
for all to authenticated
using(
  org_id=public.app_org_id()
  and public.app_has_capability('learning.manage',null)
)
with check(
  org_id=public.app_org_id()
  and created_by is not null
  and updated_by=auth.uid()
  and public.app_has_capability('learning.manage',null)
);

create policy learning_resources_read
on public.learning_resources
for select to authenticated
using(
  org_id=public.app_org_id()
  and exists(
    select 1
    from public.learning_modules m
    join public.learning_courses c on c.id=m.course_id
    where m.id=module_id
      and c.org_id=public.app_org_id()
      and (c.state<>'draft' or public.app_has_capability('learning.manage',null))
  )
);

create policy learning_resources_write
on public.learning_resources
for all to authenticated
using(
  org_id=public.app_org_id()
  and public.app_has_capability('learning.manage',null)
)
with check(
  org_id=public.app_org_id()
  and created_by is not null
  and updated_by=auth.uid()
  and public.app_has_capability('learning.manage',null)
);

create policy learning_assignment_rules_read
on public.learning_assignment_rules
for select to authenticated
using(org_id=public.app_org_id() and public.app_has_capability('learning.manage',null));

create policy learning_assignment_rules_insert
on public.learning_assignment_rules
for insert to authenticated
with check(
  org_id=public.app_org_id()
  and assigned_by=auth.uid()
  and updated_by=auth.uid()
  and public.app_has_capability('learning.manage',null)
);

create policy learning_assignment_rules_update
on public.learning_assignment_rules
for update to authenticated
using(org_id=public.app_org_id() and public.app_has_capability('learning.manage',null))
with check(
  org_id=public.app_org_id()
  and updated_by=auth.uid()
  and public.app_has_capability('learning.manage',null)
);

create policy learning_assignments_read
on public.learning_assignments
for select to authenticated
using(
  org_id=public.app_org_id()
  and (
    profile_id=auth.uid()
    or public.app_has_capability('learning.manage',null)
    or profile_id in (
      select er.profile_id
      from public.employment_records er
      where er.org_id=public.app_org_id()
        and er.unit_id in (select public.app_managed_units())
    )
  )
);

create policy learning_module_progress_read
on public.learning_module_progress
for select to authenticated
using(
  org_id=public.app_org_id()
  and assignment_id in (select id from public.learning_assignments)
);

create policy learning_progress_history_read
on public.learning_progress_history
for select to authenticated
using(
  org_id=public.app_org_id()
  and assignment_id in (select id from public.learning_assignments)
);

drop policy if exists tr_read on public.training_records;
drop policy if exists tr_write on public.training_records;

create policy stage8_training_records_read
on public.training_records
for select to authenticated
using(
  org_id=public.app_org_id()
  and (
    profile_id=auth.uid()
    or public.app_has_capability('learning.manage',null)
    or profile_id in (
      select er.profile_id
      from public.employment_records er
      where er.org_id=public.app_org_id()
        and er.unit_id in (select public.app_managed_units())
    )
  )
);

create policy stage8_training_records_insert
on public.training_records
for insert to authenticated
with check(
  org_id=public.app_org_id()
  and source='historical'
  and learning_assignment_id is null
  and recorded_by=auth.uid()
  and public.app_has_capability('learning.manage',null)
);

create policy stage8_training_records_update
on public.training_records
for update to authenticated
using(
  org_id=public.app_org_id()
  and source='historical'
  and learning_assignment_id is null
  and public.app_has_capability('learning.manage',null)
)
with check(
  org_id=public.app_org_id()
  and source='historical'
  and learning_assignment_id is null
  and public.app_has_capability('learning.manage',null)
);

create or replace function public.learning_course_guard()
returns trigger
language plpgsql
set search_path=public
as $$
declare n integer;
begin
  if old.state='draft' and new.state not in ('draft','published') then
    raise exception 'Draft learning may only stay draft or be published.';
  end if;

  if old.state='published' then
    if new.state not in ('published','archived') then
      raise exception 'Published learning may only stay published or be archived.';
    end if;
    if new.title is distinct from old.title
       or new.summary is distinct from old.summary
       or new.estimated_minutes is distinct from old.estimated_minutes then
      raise exception 'Published learning content is immutable. Archive it and create a corrected course.';
    end if;
  end if;

  if old.state='archived' then
    if new.state<>'archived'
       or new.title is distinct from old.title
       or new.summary is distinct from old.summary
       or new.estimated_minutes is distinct from old.estimated_minutes then
      raise exception 'Archived learning is immutable.';
    end if;
  end if;

  if old.state='draft' and new.state='published' then
    select count(*) into n
    from public.learning_modules m
    where m.course_id=new.id and m.required;

    if n<1 then
      raise exception 'A course needs at least one required module before publication.';
    end if;

    if exists(
      select 1
      from public.learning_modules m
      where m.course_id=new.id
        and not exists(
          select 1 from public.learning_resources r where r.module_id=m.id
        )
    ) then
      raise exception 'Every course module needs at least one resource before publication.';
    end if;
  end if;

  new.updated_by:=coalesce(auth.uid(),new.updated_by);
  new.updated_at:=now();
  return new;
end;
$$;

revoke all on function public.learning_course_guard() from public,anon,authenticated;

create trigger learning_course_guard
before update on public.learning_courses
for each row execute function public.learning_course_guard();

create or replace function public.learning_draft_content_guard()
returns trigger
language plpgsql
set search_path=public
as $$
declare v_course_state text;
begin
  if tg_table_name='learning_modules' then
    select c.state into v_course_state
    from public.learning_courses c
    where c.id=coalesce(new.course_id,old.course_id);
  else
    select c.state into v_course_state
    from public.learning_modules m
    join public.learning_courses c on c.id=m.course_id
    where m.id=coalesce(new.module_id,old.module_id);
  end if;

  if v_course_state is distinct from 'draft' then
    raise exception 'Published or archived learning content cannot be edited.';
  end if;

  if tg_op='DELETE' then return old; end if;
  if tg_op='INSERT' then
    new.created_by:=coalesce(auth.uid(),new.created_by);
  end if;
  new.updated_by:=coalesce(auth.uid(),new.updated_by);
  new.updated_at:=now();
  return new;
end;
$$;

revoke all on function public.learning_draft_content_guard() from public,anon,authenticated;

create trigger learning_modules_draft_guard
before insert or update or delete on public.learning_modules
for each row execute function public.learning_draft_content_guard();

create trigger learning_resources_draft_guard
before insert or update or delete on public.learning_resources
for each row execute function public.learning_draft_content_guard();

create or replace function public.learning_assignment_rule_guard()
returns trigger
language plpgsql
set search_path=public
as $$
declare v_course public.learning_courses;
begin
  select * into v_course
  from public.learning_courses
  where id=new.course_id and org_id=new.org_id;

  if v_course.id is null then
    raise exception 'Learning course not found.';
  end if;

  if tg_op='UPDATE' then
    if new.course_id is distinct from old.course_id
       or new.target_kind is distinct from old.target_kind
       or new.target_profile_id is distinct from old.target_profile_id
       or new.target_unit_id is distinct from old.target_unit_id
       or new.target_role is distinct from old.target_role then
      raise exception 'Create a new assignment rule to change its target.';
    end if;
  end if;

  if new.active and v_course.state<>'published' then
    raise exception 'Only a published course can have an active assignment rule.';
  end if;

  if new.target_kind='person' and not exists(
    select 1 from public.profiles p
    where p.id=new.target_profile_id and p.org_id=new.org_id and p.active and not p.is_exec
  ) then
    raise exception 'Choose an active non-Executive person in this organisation.';
  end if;

  if new.target_kind='unit' and not exists(
    select 1 from public.units u where u.id=new.target_unit_id and u.org_id=new.org_id
  ) then
    raise exception 'Choose a unit in this organisation.';
  end if;

  new.updated_by:=coalesce(auth.uid(),new.updated_by);
  new.updated_at:=now();
  return new;
end;
$$;

revoke all on function public.learning_assignment_rule_guard() from public,anon,authenticated;

create trigger learning_assignment_rule_guard
before insert or update on public.learning_assignment_rules
for each row execute function public.learning_assignment_rule_guard();

create or replace function public.learning_materialise_assignment(
  p_rule_id uuid,
  p_profile_id uuid
)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  v_rule public.learning_assignment_rules;
  v_profile public.profiles;
  v_id uuid;
begin
  select * into v_rule
  from public.learning_assignment_rules
  where id=p_rule_id and active;

  if v_rule.id is null then return null; end if;

  if not exists(
    select 1 from public.learning_courses c
    where c.id=v_rule.course_id and c.org_id=v_rule.org_id and c.state='published'
  ) then return null; end if;

  select * into v_profile
  from public.profiles
  where id=p_profile_id and org_id=v_rule.org_id and active and not is_exec;

  if v_profile.id is null then return null; end if;

  insert into public.learning_assignments(
    org_id,course_id,profile_id,source_rule_id,assigned_by,due_on,assignment_reason
  ) values (
    v_rule.org_id,v_rule.course_id,v_profile.id,v_rule.id,v_rule.assigned_by,
    case when v_rule.due_days_after_assignment is null then null
         else current_date+v_rule.due_days_after_assignment end,
    v_rule.reason
  )
  on conflict(course_id,profile_id) do nothing
  returning id into v_id;

  if v_id is not null then
    perform public.platform_emit_event(
      v_rule.org_id,'learning.assignment_created',v_rule.assigned_by,v_profile.id,
      'learning_assignment',v_id,
      jsonb_build_object('course_id',v_rule.course_id,'source_rule_id',v_rule.id,'target_kind',v_rule.target_kind),
      'learning-assignment:'||v_id::text,null,null,now()
    );
  else
    select id into v_id
    from public.learning_assignments
    where course_id=v_rule.course_id and profile_id=v_profile.id;
  end if;

  return v_id;
end;
$$;

revoke all on function public.learning_materialise_assignment(uuid,uuid)
  from public,anon,authenticated;
grant execute on function public.learning_materialise_assignment(uuid,uuid)
  to service_role;

create or replace function public.learning_apply_rule_internal(
  p_rule_id uuid
)
returns integer
language plpgsql
security definer
set search_path=public
as $$
declare
  v_rule public.learning_assignment_rules;
  v_profile_id uuid;
  v_count integer:=0;
  v_assignment uuid;
begin
  select * into v_rule
  from public.learning_assignment_rules
  where id=p_rule_id and active;

  if v_rule.id is null then return 0; end if;

  if v_rule.target_kind='person' then
    v_assignment:=public.learning_materialise_assignment(v_rule.id,v_rule.target_profile_id);
    if v_assignment is not null then v_count:=v_count+1; end if;
    return v_count;
  end if;

  if v_rule.target_kind='unit' then
    for v_profile_id in
      select er.profile_id
      from public.employment_records er
      join public.profiles p on p.id=er.profile_id and p.org_id=er.org_id
      where er.org_id=v_rule.org_id
        and er.unit_id=v_rule.target_unit_id
        and er.employment_status='active'
        and p.active and not p.is_exec
    loop
      v_assignment:=public.learning_materialise_assignment(v_rule.id,v_profile_id);
      if v_assignment is not null then v_count:=v_count+1; end if;
    end loop;
    return v_count;
  end if;

  if v_rule.target_kind='role' then
    for v_profile_id in
      select er.profile_id
      from public.employment_records er
      join public.profiles p on p.id=er.profile_id and p.org_id=er.org_id
      where er.org_id=v_rule.org_id
        and er.membership_role=v_rule.target_role
        and er.employment_status='active'
        and p.active and not p.is_exec
    loop
      v_assignment:=public.learning_materialise_assignment(v_rule.id,v_profile_id);
      if v_assignment is not null then v_count:=v_count+1; end if;
    end loop;
    return v_count;
  end if;

  if v_rule.target_kind='onboarding' then
    for v_profile_id in
      select distinct c.profile_id
      from public.employee_lifecycle_cases c
      join public.profiles p on p.id=c.profile_id and p.org_id=c.org_id
      where c.org_id=v_rule.org_id
        and c.lifecycle_type='onboarding'
        and c.state='active'
        and p.active and not p.is_exec
    loop
      v_assignment:=public.learning_materialise_assignment(v_rule.id,v_profile_id);
      if v_assignment is not null then v_count:=v_count+1; end if;
    end loop;
  end if;

  return v_count;
end;
$$;

revoke all on function public.learning_apply_rule_internal(uuid)
  from public,anon,authenticated;
grant execute on function public.learning_apply_rule_internal(uuid)
  to service_role;

create or replace function public.learning_rule_materialise_trigger()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  if new.active and (tg_op='INSERT' or old.active is distinct from new.active) then
    perform public.learning_apply_rule_internal(new.id);
  end if;
  return new;
end;
$$;

revoke all on function public.learning_rule_materialise_trigger()
  from public,anon,authenticated;

create trigger learning_rule_materialise
after insert or update of active on public.learning_assignment_rules
for each row execute function public.learning_rule_materialise_trigger();

create or replace function public.learning_employment_rule_trigger()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare v_rule_id uuid;
begin
  if new.employment_status='active' then
    for v_rule_id in
      select r.id
      from public.learning_assignment_rules r
      where r.org_id=new.org_id
        and r.active
        and (
          (r.target_kind='person' and r.target_profile_id=new.profile_id)
          or (r.target_kind='unit' and r.target_unit_id=new.unit_id)
          or (r.target_kind='role' and r.target_role=new.membership_role)
        )
    loop
      perform public.learning_materialise_assignment(v_rule_id,new.profile_id);
    end loop;
  end if;
  return new;
end;
$$;

revoke all on function public.learning_employment_rule_trigger()
  from public,anon,authenticated;

create trigger learning_employment_rule_apply
after insert or update of unit_id,membership_role,employment_status
on public.employment_records
for each row execute function public.learning_employment_rule_trigger();

create or replace function public.learning_onboarding_rule_trigger()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare v_rule_id uuid;
begin
  if new.lifecycle_type='onboarding' and new.state='active' then
    for v_rule_id in
      select r.id
      from public.learning_assignment_rules r
      where r.org_id=new.org_id
        and r.active
        and r.target_kind='onboarding'
    loop
      perform public.learning_materialise_assignment(v_rule_id,new.profile_id);
    end loop;
  end if;
  return new;
end;
$$;

revoke all on function public.learning_onboarding_rule_trigger()
  from public,anon,authenticated;

create trigger learning_onboarding_rule_apply
after insert on public.employee_lifecycle_cases
for each row execute function public.learning_onboarding_rule_trigger();

create or replace function public.learning_course_publish_event()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  if old.state is distinct from new.state and new.state='published' then
    perform public.platform_emit_event(
      new.org_id,'learning.course_published',auth.uid(),null,
      'learning_course',new.id,
      jsonb_build_object('estimated_minutes',new.estimated_minutes),
      'learning-course-published:'||new.id::text,null,null,now()
    );
  end if;

  if old.state is distinct from new.state and new.state='archived' then
    update public.learning_assignment_rules
    set active=false,
        updated_by=coalesce(auth.uid(),updated_by),
        updated_at=now()
    where course_id=new.id and active;
  end if;

  return new;
end;
$$;

revoke all on function public.learning_course_publish_event()
  from public,anon,authenticated;

create trigger learning_course_publish_event
after update on public.learning_courses
for each row execute function public.learning_course_publish_event();

create or replace function public.learning_progress_history_immutable()
returns trigger
language plpgsql
set search_path=public
as $$
begin
  raise exception 'Learning progress history is append-only.' using errcode='42501';
end;
$$;

revoke all on function public.learning_progress_history_immutable()
  from public,anon,authenticated;

create trigger learning_progress_history_immutable
before update or delete on public.learning_progress_history
for each row execute function public.learning_progress_history_immutable();

create or replace function public.learning_complete_module(
  p_assignment_id uuid,
  p_module_id uuid
)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  v_actor uuid:=auth.uid();
  v_org uuid:=public.app_org_id();
  v_assignment public.learning_assignments;
  v_module public.learning_modules;
  v_progress public.learning_module_progress;
  v_progress_id uuid;
  v_history_id uuid;
  v_required integer;
  v_completed integer;
  v_was_completed boolean:=false;
  v_course public.learning_courses;
begin
  if v_actor is null then
    raise exception 'Sign in to record learning progress.' using errcode='42501';
  end if;

  select * into v_assignment
  from public.learning_assignments
  where id=p_assignment_id
    and org_id=v_org
    and profile_id=v_actor;

  if v_assignment.id is null then
    raise exception 'Learning assignment not found.' using errcode='42501';
  end if;

  if v_assignment.state='withdrawn' then
    raise exception 'This learning assignment has been withdrawn.' using errcode='42501';
  end if;

  select * into v_module
  from public.learning_modules
  where id=p_module_id
    and org_id=v_org
    and course_id=v_assignment.course_id;

  if v_module.id is null then
    raise exception 'That module is not part of this learning assignment.' using errcode='42501';
  end if;

  select * into v_progress
  from public.learning_module_progress
  where assignment_id=v_assignment.id and module_id=v_module.id;

  if v_progress.id is not null and v_progress.state='completed' then
    return v_progress.id;
  end if;

  if v_progress.id is null then
    insert into public.learning_module_progress(
      org_id,assignment_id,module_id,state,completed_at,updated_by
    ) values (
      v_org,v_assignment.id,v_module.id,'completed',now(),v_actor
    )
    returning id into v_progress_id;
  else
    update public.learning_module_progress
    set state='completed',completed_at=now(),updated_by=v_actor,updated_at=now()
    where id=v_progress.id
    returning id into v_progress_id;
  end if;

  insert into public.learning_progress_history(
    org_id,assignment_id,module_id,action,reason,actor_id
  ) values (
    v_org,v_assignment.id,v_module.id,'completed',null,v_actor
  )
  returning id into v_history_id;

  perform public.platform_emit_event(
    v_org,'learning.module_completed',v_actor,v_actor,
    'learning_assignment',v_assignment.id,
    jsonb_build_object('module_id',v_module.id,'course_id',v_assignment.course_id),
    'learning-module-completed:'||v_history_id::text,null,null,now()
  );

  if v_assignment.state='assigned' then
    update public.learning_assignments
    set state='in_progress'
    where id=v_assignment.id;
  end if;

  select count(*) into v_required
  from public.learning_modules
  where course_id=v_assignment.course_id and required;

  select count(*) into v_completed
  from public.learning_modules m
  join public.learning_module_progress p
    on p.module_id=m.id
   and p.assignment_id=v_assignment.id
   and p.state='completed'
  where m.course_id=v_assignment.course_id and m.required;

  if v_required>0 and v_completed=v_required then
    v_was_completed:=v_assignment.state='completed';

    update public.learning_assignments
    set state='completed',completed_at=coalesce(completed_at,now()),
        withdrawn_at=null,withdrawn_by=null,withdrawal_reason=null
    where id=v_assignment.id;

    select * into v_course
    from public.learning_courses
    where id=v_assignment.course_id;

    insert into public.training_records(
      org_id,profile_id,name,completed_on,note,source,
      learning_assignment_id,recorded_by,voided_at,voided_by,void_reason
    ) values (
      v_org,v_actor,v_course.title,current_date,
      'Completed through CEAC OS structured learning.',
      'learning_course',v_assignment.id,v_actor,null,null,null
    )
    on conflict(learning_assignment_id) where learning_assignment_id is not null do update
    set completed_on=excluded.completed_on,
        name=excluded.name,
        note=excluded.note,
        source='learning_course',
        voided_at=null,
        voided_by=null,
        void_reason=null;

    if not v_was_completed then
      perform public.platform_emit_event(
        v_org,'learning.course_completed',v_actor,v_actor,
        'learning_assignment',v_assignment.id,
        jsonb_build_object('course_id',v_assignment.course_id,'required_modules',v_required),
        'learning-course-completed:'||v_assignment.id::text||':'||v_history_id::text,null,null,now()
      );
    end if;
  end if;

  return v_progress_id;
end;
$$;

revoke all on function public.learning_complete_module(uuid,uuid) from public,anon;
grant execute on function public.learning_complete_module(uuid,uuid)
  to authenticated,service_role;

create or replace function public.learning_admin_action(
  p_assignment_id uuid,
  p_action text,
  p_module_id uuid default null,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path=public
as $$
declare
  v_actor uuid:=auth.uid();
  v_org uuid:=public.app_org_id();
  v_assignment public.learning_assignments;
  v_progress public.learning_module_progress;
  v_required integer;
  v_completed integer;
begin
  if v_actor is null or not public.app_has_capability('learning.manage',null) then
    raise exception 'You do not have authority to correct learning records.' using errcode='42501';
  end if;

  if length(btrim(coalesce(p_reason,'')))<3 then
    raise exception 'A reason is required.';
  end if;

  select * into v_assignment
  from public.learning_assignments
  where id=p_assignment_id and org_id=v_org;

  if v_assignment.id is null then
    raise exception 'Learning assignment not found.' using errcode='42501';
  end if;

  if p_action='withdraw' then
    if v_assignment.state='withdrawn' then return; end if;

    update public.learning_assignments
    set state='withdrawn',withdrawn_at=now(),withdrawn_by=v_actor,
        withdrawal_reason=btrim(p_reason)
    where id=v_assignment.id;

    perform public.platform_emit_event(
      v_org,'learning.assignment_changed',v_actor,v_assignment.profile_id,
      'learning_assignment',v_assignment.id,
      jsonb_build_object('action','withdrawn','course_id',v_assignment.course_id),
      null,null,null,now()
    );
    return;
  end if;

  if p_action='restore' then
    if v_assignment.state<>'withdrawn' then
      raise exception 'Only a withdrawn assignment can be restored.';
    end if;

    select count(*) into v_completed
    from public.learning_module_progress
    where assignment_id=v_assignment.id and state='completed';

    select count(*) into v_required
    from public.learning_modules
    where course_id=v_assignment.course_id and required;

    if v_required>0 and (
      select count(*)
      from public.learning_modules m
      join public.learning_module_progress p
        on p.module_id=m.id
       and p.assignment_id=v_assignment.id
       and p.state='completed'
      where m.course_id=v_assignment.course_id and m.required
    )=v_required then
      update public.learning_assignments
      set state='completed',completed_at=coalesce(completed_at,now()),
          withdrawn_at=null,withdrawn_by=null,withdrawal_reason=null
      where id=v_assignment.id;
    else
      update public.learning_assignments
      set state=case when v_completed>0 then 'in_progress' else 'assigned' end,
          completed_at=null,withdrawn_at=null,withdrawn_by=null,withdrawal_reason=null
      where id=v_assignment.id;
    end if;

    perform public.platform_emit_event(
      v_org,'learning.assignment_changed',v_actor,v_assignment.profile_id,
      'learning_assignment',v_assignment.id,
      jsonb_build_object('action','restored','course_id',v_assignment.course_id),
      null,null,null,now()
    );
    return;
  end if;

  if p_action='reopen_module' then
    if p_module_id is null then
      raise exception 'Choose the completed module to correct.';
    end if;

    select p.* into v_progress
    from public.learning_module_progress p
    join public.learning_modules m on m.id=p.module_id
    where p.assignment_id=v_assignment.id
      and p.module_id=p_module_id
      and p.state='completed'
      and m.course_id=v_assignment.course_id;

    if v_progress.id is null then
      raise exception 'Completed module progress not found.';
    end if;

    update public.learning_module_progress
    set state='not_started',completed_at=null,updated_by=v_actor,updated_at=now()
    where id=v_progress.id;

    insert into public.learning_progress_history(
      org_id,assignment_id,module_id,action,reason,actor_id
    ) values (
      v_org,v_assignment.id,p_module_id,'reopened',btrim(p_reason),v_actor
    );

    select count(*) into v_required
    from public.learning_modules
    where course_id=v_assignment.course_id and required;

    select count(*) into v_completed
    from public.learning_modules m
    join public.learning_module_progress p
      on p.module_id=m.id
     and p.assignment_id=v_assignment.id
     and p.state='completed'
    where m.course_id=v_assignment.course_id and m.required;

    if v_assignment.state='completed' and v_completed<v_required then
      update public.learning_assignments
      set state=case when exists(
            select 1 from public.learning_module_progress
            where assignment_id=v_assignment.id and state='completed'
          ) then 'in_progress' else 'assigned' end,
          completed_at=null
      where id=v_assignment.id;

      update public.training_records
      set completed_on=null,voided_at=now(),voided_by=v_actor,
          void_reason=btrim(p_reason)
      where learning_assignment_id=v_assignment.id;
    end if;

    perform public.platform_emit_event(
      v_org,'learning.progress_corrected',v_actor,v_assignment.profile_id,
      'learning_assignment',v_assignment.id,
      jsonb_build_object('module_id',p_module_id,'course_id',v_assignment.course_id),
      null,null,null,now()
    );
    return;
  end if;

  raise exception 'Unsupported learning administration action.';
end;
$$;

revoke all on function public.learning_admin_action(uuid,text,uuid,text) from public,anon;
grant execute on function public.learning_admin_action(uuid,text,uuid,text)
  to authenticated,service_role;

create trigger audit_learning_courses
after insert or update on public.learning_courses
for each row execute function public.platform_audit_capture('learning_course','id','');

create trigger audit_learning_modules
after insert or update or delete on public.learning_modules
for each row execute function public.platform_audit_capture('learning_module','id','');

create trigger audit_learning_resources
after insert or update or delete on public.learning_resources
for each row execute function public.platform_audit_capture('learning_resource','id','');

create trigger audit_learning_assignment_rules
after insert or update on public.learning_assignment_rules
for each row execute function public.platform_audit_capture('learning_assignment_rule','id','target_profile_id');

create trigger audit_learning_assignments
after insert or update on public.learning_assignments
for each row execute function public.platform_audit_capture('learning_assignment','id','profile_id');

create trigger audit_learning_module_progress
after insert or update on public.learning_module_progress
for each row execute function public.platform_audit_capture('learning_module_progress','id','');

create trigger audit_learning_progress_history
after insert on public.learning_progress_history
for each row execute function public.platform_audit_capture('learning_progress_history','id','');

create trigger audit_training_records_stage8
after insert or update on public.training_records
for each row execute function public.platform_audit_capture('training_record','id','profile_id');
