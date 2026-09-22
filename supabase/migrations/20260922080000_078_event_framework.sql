-- 078 — Stage 1D: durable internal platform event framework.

create table public.platform_event_definitions (
  event_type text primary key,
  label text not null,
  description text not null,
  source_domain text not null,
  payload_version integer not null default 1 check (payload_version > 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.platform_event_definitions(
  event_type,label,description,source_domain,payload_version
) values
  ('activity.recorded','Activity recorded','A reviewed CEAC product activity event was recorded.','activity',1),
  ('employment.changed','Employment changed','An ordinary employment-history event was recorded.','people',1),
  ('authority.granted','Authority granted','An explicit capability grant became active.','authority',1),
  ('authority.revoked','Authority revoked','An explicit capability grant was revoked.','authority',1);

create table public.platform_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete restrict,
  event_type text not null references public.platform_event_definitions(event_type) on delete restrict,
  actor_id uuid,
  subject_profile_id uuid,
  aggregate_type text not null,
  aggregate_id uuid,
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload)='object'),
  payload_version integer not null check (payload_version > 0),
  correlation_id uuid not null default gen_random_uuid(),
  causation_event_id uuid references public.platform_events(id) on delete restrict,
  idempotency_key text,
  occurred_at timestamptz not null default now(),
  recorded_at timestamptz not null default now()
);

create unique index platform_events_org_idempotency_uidx
  on public.platform_events(org_id,idempotency_key)
  where idempotency_key is not null;

create index platform_events_org_recorded_idx
  on public.platform_events(org_id,recorded_at desc);
create index platform_events_type_recorded_idx
  on public.platform_events(event_type,recorded_at desc);
create index platform_events_aggregate_idx
  on public.platform_events(aggregate_type,aggregate_id,recorded_at desc);
create index platform_events_correlation_idx
  on public.platform_events(correlation_id,recorded_at);

alter table public.platform_event_definitions enable row level security;
alter table public.platform_events enable row level security;

revoke all on public.platform_event_definitions from anon;
revoke all on public.platform_events from anon;
revoke insert,update,delete on public.platform_event_definitions from authenticated;
revoke insert,update,delete on public.platform_events from authenticated;
grant select on public.platform_event_definitions to authenticated;
grant select on public.platform_events to authenticated;

create policy platform_event_definitions_read
on public.platform_event_definitions
for select
to authenticated
using (true);

create policy platform_events_audit_read
on public.platform_events
for select
to authenticated
using (
  org_id=public.app_org_id()
  and public.app_has_capability('audit.view',null)
);

create or replace function public.platform_event_immutable()
returns trigger
language plpgsql
security invoker
set search_path=public
as $$
begin
  raise exception 'Platform events are append-only.' using errcode='42501';
end;
$$;

revoke all on function public.platform_event_immutable() from public,anon,authenticated;

create trigger platform_events_immutable
before update or delete on public.platform_events
for each row execute function public.platform_event_immutable();

create or replace function public.platform_emit_event(
  p_org_id uuid,
  p_event_type text,
  p_actor_id uuid,
  p_subject_profile_id uuid,
  p_aggregate_type text,
  p_aggregate_id uuid,
  p_payload jsonb default '{}'::jsonb,
  p_idempotency_key text default null,
  p_correlation_id uuid default null,
  p_causation_event_id uuid default null,
  p_occurred_at timestamptz default now()
)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  v_definition public.platform_event_definitions;
  v_id uuid;
begin
  select * into v_definition
  from public.platform_event_definitions
  where event_type=p_event_type and active;

  if v_definition.event_type is null then
    raise exception 'Unknown or inactive platform event type: %',p_event_type;
  end if;

  if not exists (
    select 1 from public.organisations o where o.id=p_org_id
  ) then
    raise exception 'Platform event organisation was not found.';
  end if;

  if nullif(btrim(coalesce(p_aggregate_type,'')),'') is null then
    raise exception 'Platform event aggregate type is required.';
  end if;

  if jsonb_typeof(coalesce(p_payload,'{}'::jsonb))<>'object' then
    raise exception 'Platform event payload must be a JSON object.';
  end if;

  insert into public.platform_events(
    org_id,event_type,actor_id,subject_profile_id,
    aggregate_type,aggregate_id,payload,payload_version,
    correlation_id,causation_event_id,idempotency_key,occurred_at
  ) values (
    p_org_id,p_event_type,p_actor_id,p_subject_profile_id,
    btrim(p_aggregate_type),p_aggregate_id,coalesce(p_payload,'{}'::jsonb),
    v_definition.payload_version,
    coalesce(p_correlation_id,gen_random_uuid()),p_causation_event_id,
    nullif(btrim(coalesce(p_idempotency_key,'')),''),
    coalesce(p_occurred_at,now())
  )
  returning id into v_id;

  return v_id;
exception
  when unique_violation then
    if p_idempotency_key is not null then
      select id into v_id
      from public.platform_events
      where org_id=p_org_id and idempotency_key=p_idempotency_key;
      return v_id;
    end if;
    raise;
end;
$$;

revoke all on function public.platform_emit_event(
  uuid,text,uuid,uuid,text,uuid,jsonb,text,uuid,uuid,timestamptz
) from public,anon,authenticated;
grant execute on function public.platform_emit_event(
  uuid,text,uuid,uuid,text,uuid,jsonb,text,uuid,uuid,timestamptz
) to service_role;

create or replace function public.platform_event_from_activity()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  perform public.platform_emit_event(
    new.org_id,
    'activity.recorded',
    new.actor_id,
    case when new.object_type='profile' then new.object_id else null end,
    coalesce(nullif(new.object_type,''),'activity'),
    new.object_id,
    jsonb_build_object(
      'verb',new.verb,
      'object_type',new.object_type,
      'object_id',new.object_id
    ),
    'activity:'||new.id::text,
    null,
    null,
    new.at
  );
  return new;
end;
$$;

revoke all on function public.platform_event_from_activity() from public,anon,authenticated;

create trigger activity_events_emit_platform_event
after insert on public.activity_events
for each row execute function public.platform_event_from_activity();

create or replace function public.platform_event_from_employment_history()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  perform public.platform_emit_event(
    new.org_id,
    'employment.changed',
    new.actor_id,
    new.profile_id,
    'profile',
    new.profile_id,
    jsonb_build_object(
      'change_type',new.change_type,
      'effective_on',new.effective_on
    ),
    'employment:'||new.id::text,
    null,
    null,
    new.created_at
  );
  return new;
end;
$$;

revoke all on function public.platform_event_from_employment_history() from public,anon,authenticated;

create trigger employment_history_emit_platform_event
after insert on public.employment_history
for each row execute function public.platform_event_from_employment_history();

create or replace function public.platform_event_from_capability_grant()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  v_type text;
  v_actor uuid;
  v_key text;
  v_time timestamptz;
begin
  if tg_op='INSERT' then
    v_type:='authority.granted';
    v_actor:=new.granted_by;
    v_key:='capability-grant:'||new.id::text||':granted';
    v_time:=new.granted_at;
  elsif tg_op='UPDATE'
        and old.revoked_at is null
        and new.revoked_at is not null then
    v_type:='authority.revoked';
    v_actor:=new.revoked_by;
    v_key:='capability-grant:'||new.id::text||':revoked';
    v_time:=new.revoked_at;
  else
    return new;
  end if;

  perform public.platform_emit_event(
    new.org_id,
    v_type,
    v_actor,
    new.profile_id,
    'capability_grant',
    new.id,
    jsonb_build_object(
      'capability',new.capability,
      'scope_unit_id',new.scope_unit_id
    ),
    v_key,
    null,
    null,
    v_time
  );

  return new;
end;
$$;

revoke all on function public.platform_event_from_capability_grant() from public,anon,authenticated;

create trigger capability_grants_emit_platform_event
after insert or update of revoked_at on public.capability_grants
for each row execute function public.platform_event_from_capability_grant();
