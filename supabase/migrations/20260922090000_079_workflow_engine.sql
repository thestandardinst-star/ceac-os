-- 079 — Stage 1E: durable event-driven workflow engine.

insert into public.platform_event_definitions(
  event_type,label,description,source_domain,payload_version
) values
  ('workflow.started','Workflow started','A durable workflow run was started from a platform event.','workflow',1),
  ('workflow.completed','Workflow completed','A durable workflow run completed its required steps.','workflow',1)
on conflict(event_type) do nothing;

create table public.workflow_definitions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organisations(id) on delete restrict,
  workflow_key text not null,
  label text not null,
  description text not null,
  trigger_event_type text not null references public.platform_event_definitions(event_type) on delete restrict,
  version integer not null default 1 check (version > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(org_id,workflow_key,version)
);

create table public.workflow_definition_steps (
  id uuid primary key default gen_random_uuid(),
  workflow_definition_id uuid not null references public.workflow_definitions(id) on delete restrict,
  position integer not null check (position > 0),
  step_key text not null,
  label text not null,
  step_type text not null default 'review' check (step_type in ('review','system')),
  required_capability text references public.capability_definitions(capability) on delete restrict,
  created_at timestamptz not null default now(),
  unique(workflow_definition_id,position),
  unique(workflow_definition_id,step_key)
);

create table public.workflow_runs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete restrict,
  workflow_definition_id uuid not null references public.workflow_definitions(id) on delete restrict,
  source_event_id uuid not null references public.platform_events(id) on delete restrict,
  subject_profile_id uuid,
  aggregate_type text not null,
  aggregate_id uuid,
  state text not null default 'queued' check (state in ('queued','active','completed','cancelled','failed')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  unique(workflow_definition_id,source_event_id),
  check ((state='completed' and completed_at is not null) or (state<>'completed'))
);

create index workflow_runs_org_state_idx
  on public.workflow_runs(org_id,state,started_at desc);
create index workflow_runs_subject_idx
  on public.workflow_runs(subject_profile_id,started_at desc);

create table public.workflow_run_steps (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete restrict,
  workflow_run_id uuid not null references public.workflow_runs(id) on delete restrict,
  definition_step_id uuid not null references public.workflow_definition_steps(id) on delete restrict,
  position integer not null check (position > 0),
  step_key text not null,
  label text not null,
  step_type text not null check (step_type in ('review','system')),
  required_capability text references public.capability_definitions(capability) on delete restrict,
  state text not null default 'pending' check (state in ('pending','ready','completed','skipped','failed')),
  completed_by uuid,
  completed_at timestamptz,
  outcome text,
  note text,
  created_at timestamptz not null default now(),
  unique(workflow_run_id,position),
  unique(workflow_run_id,step_key),
  check (
    (state='completed' and completed_at is not null and completed_by is not null)
    or state<>'completed'
  )
);

create index workflow_run_steps_org_state_idx
  on public.workflow_run_steps(org_id,state,created_at desc);
create index workflow_run_steps_run_idx
  on public.workflow_run_steps(workflow_run_id,position);

alter table public.workflow_definitions enable row level security;
alter table public.workflow_definition_steps enable row level security;
alter table public.workflow_runs enable row level security;
alter table public.workflow_run_steps enable row level security;

revoke all on public.workflow_definitions from anon;
revoke all on public.workflow_definition_steps from anon;
revoke all on public.workflow_runs from anon;
revoke all on public.workflow_run_steps from anon;

revoke insert,update,delete on public.workflow_definitions from authenticated;
revoke insert,update,delete on public.workflow_definition_steps from authenticated;
revoke insert,update,delete on public.workflow_runs from authenticated;
revoke insert,update,delete on public.workflow_run_steps from authenticated;

grant select on public.workflow_definitions to authenticated;
grant select on public.workflow_definition_steps to authenticated;
grant select on public.workflow_runs to authenticated;
grant select on public.workflow_run_steps to authenticated;

create policy workflow_definitions_read
on public.workflow_definitions
for select
to authenticated
using (
  (org_id is null or org_id=public.app_org_id())
  and (
    public.app_has_capability('audit.view',null)
    or public.app_has_capability('people.manage',null)
    or public.app_has_capability('authority.manage',null)
  )
);

create policy workflow_definition_steps_read
on public.workflow_definition_steps
for select
to authenticated
using (
  exists (
    select 1
    from public.workflow_definitions wd
    where wd.id=workflow_definition_id
      and (wd.org_id is null or wd.org_id=public.app_org_id())
      and (
        public.app_has_capability('audit.view',null)
        or (required_capability is not null and public.app_has_capability(required_capability,null))
      )
  )
);

create policy workflow_runs_read
on public.workflow_runs
for select
to authenticated
using (
  org_id=public.app_org_id()
  and (
    public.app_has_capability('audit.view',null)
    or exists (
      select 1
      from public.workflow_run_steps wrs
      where wrs.workflow_run_id=id
        and wrs.state='ready'
        and (
          wrs.required_capability is null
          or public.app_has_capability(wrs.required_capability,null)
        )
    )
  )
);

create policy workflow_run_steps_read
on public.workflow_run_steps
for select
to authenticated
using (
  org_id=public.app_org_id()
  and (
    public.app_has_capability('audit.view',null)
    or (
      required_capability is not null
      and public.app_has_capability(required_capability,null)
    )
  )
);

insert into public.workflow_definitions(
  org_id,workflow_key,label,description,trigger_event_type,version,active
) values
  (null,'employment-change-review','Employment change review',
   'Review an ordinary employment change after it is recorded.',
   'employment.changed',1,true),
  (null,'authority-grant-review','Authority grant review',
   'Review an explicit authority grant after it is recorded.',
   'authority.granted',1,true),
  (null,'authority-revocation-review','Authority revocation review',
   'Review an explicit authority revocation after it is recorded.',
   'authority.revoked',1,true)
on conflict(org_id,workflow_key,version) do nothing;

insert into public.workflow_definition_steps(
  workflow_definition_id,position,step_key,label,step_type,required_capability
)
select id,1,'review-change','Review employment change','review','people.manage'
from public.workflow_definitions
where org_id is null and workflow_key='employment-change-review' and version=1
on conflict(workflow_definition_id,position) do nothing;

insert into public.workflow_definition_steps(
  workflow_definition_id,position,step_key,label,step_type,required_capability
)
select id,1,'review-grant','Review authority grant','review','authority.manage'
from public.workflow_definitions
where org_id is null and workflow_key='authority-grant-review' and version=1
on conflict(workflow_definition_id,position) do nothing;

insert into public.workflow_definition_steps(
  workflow_definition_id,position,step_key,label,step_type,required_capability
)
select id,1,'review-revocation','Review authority revocation','review','authority.manage'
from public.workflow_definitions
where org_id is null and workflow_key='authority-revocation-review' and version=1
on conflict(workflow_definition_id,position) do nothing;

create or replace function public.workflow_start_for_event()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  v_definition public.workflow_definitions;
  v_run_id uuid;
  v_inserted boolean;
begin
  for v_definition in
    select wd.*
    from public.workflow_definitions wd
    where wd.active
      and wd.trigger_event_type=new.event_type
      and (wd.org_id is null or wd.org_id=new.org_id)
    order by wd.version desc,wd.created_at
  loop
    v_inserted:=false;
    insert into public.workflow_runs(
      org_id,workflow_definition_id,source_event_id,subject_profile_id,
      aggregate_type,aggregate_id,state,started_at
    ) values (
      new.org_id,v_definition.id,new.id,new.subject_profile_id,
      new.aggregate_type,new.aggregate_id,'queued',now()
    )
    on conflict(workflow_definition_id,source_event_id) do nothing
    returning id into v_run_id;

    if v_run_id is null then
      continue;
    end if;

    v_inserted:=true;

    insert into public.workflow_run_steps(
      org_id,workflow_run_id,definition_step_id,position,step_key,label,
      step_type,required_capability,state
    )
    select
      new.org_id,v_run_id,wds.id,wds.position,wds.step_key,wds.label,
      wds.step_type,wds.required_capability,'pending'
    from public.workflow_definition_steps wds
    where wds.workflow_definition_id=v_definition.id
    order by wds.position;

    if not exists (
      select 1 from public.workflow_run_steps where workflow_run_id=v_run_id
    ) then
      update public.workflow_runs
      set state='completed',completed_at=now()
      where id=v_run_id;
    else
      update public.workflow_runs
      set state='active'
      where id=v_run_id;

      update public.workflow_run_steps
      set state='ready'
      where id=(
        select id
        from public.workflow_run_steps
        where workflow_run_id=v_run_id
        order by position
        limit 1
      );
    end if;

    if v_inserted then
      perform public.platform_emit_event(
        new.org_id,
        'workflow.started',
        new.actor_id,
        new.subject_profile_id,
        'workflow_run',
        v_run_id,
        jsonb_build_object(
          'workflow_key',v_definition.workflow_key,
          'source_event_type',new.event_type
        ),
        'workflow-start:'||v_run_id::text,
        new.correlation_id,
        new.id,
        now()
      );
    end if;
  end loop;

  return new;
end;
$$;

revoke all on function public.workflow_start_for_event() from public,anon,authenticated;

create trigger platform_events_start_workflows
after insert on public.platform_events
for each row execute function public.workflow_start_for_event();

create or replace function public.complete_workflow_step(
  p_run_step_id uuid,
  p_outcome text,
  p_note text default null
)
returns public.workflow_runs
language plpgsql
security definer
set search_path=public
as $$
declare
  v_actor uuid:=auth.uid();
  v_org uuid:=public.app_org_id();
  v_step public.workflow_run_steps;
  v_run public.workflow_runs;
  v_next_id uuid;
  v_definition public.workflow_definitions;
  v_source public.platform_events;
begin
  if v_actor is null then
    raise exception 'Sign in to complete a workflow step.' using errcode='42501';
  end if;

  if nullif(btrim(coalesce(p_outcome,'')),'') is null then
    raise exception 'Outcome is required.';
  end if;

  select * into v_step
  from public.workflow_run_steps
  where id=p_run_step_id and org_id=v_org
  for update;

  if v_step.id is null then
    raise exception 'That workflow step was not found.' using errcode='42501';
  end if;

  if v_step.state<>'ready' then
    raise exception 'Only a ready workflow step can be completed.';
  end if;

  if v_step.required_capability is not null
     and not public.app_has_capability(v_step.required_capability,null) then
    raise exception 'You do not have the capability required for this workflow step.'
      using errcode='42501';
  end if;

  select * into v_run
  from public.workflow_runs
  where id=v_step.workflow_run_id and org_id=v_org
  for update;

  if v_run.id is null or v_run.state<>'active' then
    raise exception 'That workflow run is not active.';
  end if;

  update public.workflow_run_steps
  set state='completed',
      completed_by=v_actor,
      completed_at=now(),
      outcome=btrim(p_outcome),
      note=nullif(btrim(coalesce(p_note,'')),'')
  where id=v_step.id;

  select id into v_next_id
  from public.workflow_run_steps
  where workflow_run_id=v_run.id
    and state='pending'
  order by position
  limit 1
  for update;

  if v_next_id is not null then
    update public.workflow_run_steps
    set state='ready'
    where id=v_next_id;
  else
    update public.workflow_runs
    set state='completed',completed_at=now()
    where id=v_run.id
    returning * into v_run;

    select * into v_definition
    from public.workflow_definitions
    where id=v_run.workflow_definition_id;

    select * into v_source
    from public.platform_events
    where id=v_run.source_event_id;

    perform public.platform_emit_event(
      v_run.org_id,
      'workflow.completed',
      v_actor,
      v_run.subject_profile_id,
      'workflow_run',
      v_run.id,
      jsonb_build_object(
        'workflow_key',v_definition.workflow_key,
        'source_event_type',v_source.event_type
      ),
      'workflow-complete:'||v_run.id::text,
      v_source.correlation_id,
      v_source.id,
      now()
    );
  end if;

  if v_run.state<>'completed' then
    select * into v_run from public.workflow_runs where id=v_run.id;
  end if;

  return v_run;
end;
$$;

revoke all on function public.complete_workflow_step(uuid,text,text) from public,anon;
grant execute on function public.complete_workflow_step(uuid,text,text) to authenticated,service_role;

create trigger audit_workflow_runs
after insert or update or delete on public.workflow_runs
for each row execute function public.platform_audit_capture('workflow_run','id','subject_profile_id');

create trigger audit_workflow_run_steps
after insert or update or delete on public.workflow_run_steps
for each row execute function public.platform_audit_capture('workflow_run_step','id','completed_by');
