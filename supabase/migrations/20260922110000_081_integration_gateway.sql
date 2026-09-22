-- 081 — Stage 1G: controlled integration gateway and event outbox.

insert into public.capability_definitions(capability,label,description,sensitive)
values (
  'integration.manage',
  'Manage integrations',
  'Configure non-secret connector metadata and event subscriptions.',
  true
)
on conflict(capability) do nothing;

insert into public.capability_grants(
  org_id,profile_id,capability,scope_unit_id,granted_by,grant_reason
)
select p.org_id,p.id,'integration.manage',null,null,
       'Stage 1G baseline from existing Administration & HR authority.'
from public.profiles p
where p.is_admin and p.active
  and not exists (
    select 1 from public.capability_grants cg
    where cg.org_id=p.org_id
      and cg.profile_id=p.id
      and cg.capability='integration.manage'
      and cg.scope_unit_id is null
      and cg.revoked_at is null
  );

create table public.integration_connectors (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete restrict,
  connector_key text not null,
  connector_type text not null check (connector_type in ('webhook','email','calendar','drive','custom')),
  display_name text not null,
  enabled boolean not null default false,
  public_config jsonb not null default '{}'::jsonb check (jsonb_typeof(public_config)='object'),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_by uuid not null references public.profiles(id) on delete restrict,
  updated_at timestamptz not null default now(),
  unique(org_id,connector_key)
);

create index integration_connectors_org_idx
  on public.integration_connectors(org_id,enabled,display_name);

create table public.integration_subscriptions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete restrict,
  connector_id uuid not null references public.integration_connectors(id) on delete restrict,
  event_type text not null references public.platform_event_definitions(event_type) on delete restrict,
  active boolean not null default true,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_by uuid not null references public.profiles(id) on delete restrict,
  updated_at timestamptz not null default now(),
  unique(connector_id,event_type)
);

create index integration_subscriptions_org_event_idx
  on public.integration_subscriptions(org_id,event_type,active);

create table public.integration_outbox (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete restrict,
  connector_id uuid not null references public.integration_connectors(id) on delete restrict,
  subscription_id uuid not null references public.integration_subscriptions(id) on delete restrict,
  event_id uuid not null references public.platform_events(id) on delete restrict,
  state text not null default 'pending'
    check (state in ('pending','processing','delivered','failed')),
  attempt_count integer not null default 0 check (attempt_count>=0),
  next_attempt_at timestamptz,
  last_error_category text,
  last_error_message text,
  queued_at timestamptz not null default now(),
  delivered_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(subscription_id,event_id),
  check (
    (state='delivered' and delivered_at is not null)
    or (state<>'delivered' and delivered_at is null)
  )
);

create index integration_outbox_org_state_idx
  on public.integration_outbox(org_id,state,queued_at);
create index integration_outbox_connector_idx
  on public.integration_outbox(connector_id,queued_at desc);

alter table public.integration_connectors enable row level security;
alter table public.integration_subscriptions enable row level security;
alter table public.integration_outbox enable row level security;

revoke all on public.integration_connectors from anon;
revoke all on public.integration_subscriptions from anon;
revoke all on public.integration_outbox from anon;

revoke insert,update,delete on public.integration_connectors from authenticated;
revoke insert,update,delete on public.integration_subscriptions from authenticated;
revoke insert,update,delete on public.integration_outbox from authenticated;

grant select,insert on public.integration_connectors to authenticated;
grant update(display_name,enabled,public_config,updated_by,updated_at)
  on public.integration_connectors to authenticated;
grant select,insert on public.integration_subscriptions to authenticated;
grant update(active,updated_by,updated_at)
  on public.integration_subscriptions to authenticated;
grant select on public.integration_outbox to authenticated;

create policy integration_connectors_read
on public.integration_connectors
for select to authenticated
using (
  org_id=public.app_org_id()
  and public.app_has_capability('integration.manage',null)
);

create policy integration_connectors_insert
on public.integration_connectors
for insert to authenticated
with check (
  org_id=public.app_org_id()
  and created_by=auth.uid()
  and updated_by=auth.uid()
  and public.app_has_capability('integration.manage',null)
);

create policy integration_connectors_update
on public.integration_connectors
for update to authenticated
using (
  org_id=public.app_org_id()
  and public.app_has_capability('integration.manage',null)
)
with check (
  org_id=public.app_org_id()
  and updated_by=auth.uid()
  and public.app_has_capability('integration.manage',null)
);

create policy integration_subscriptions_read
on public.integration_subscriptions
for select to authenticated
using (
  org_id=public.app_org_id()
  and public.app_has_capability('integration.manage',null)
);

create policy integration_subscriptions_insert
on public.integration_subscriptions
for insert to authenticated
with check (
  org_id=public.app_org_id()
  and created_by=auth.uid()
  and updated_by=auth.uid()
  and public.app_has_capability('integration.manage',null)
  and exists (
    select 1
    from public.integration_connectors ic
    where ic.id=connector_id
      and ic.org_id=public.app_org_id()
  )
);

create policy integration_subscriptions_update
on public.integration_subscriptions
for update to authenticated
using (
  org_id=public.app_org_id()
  and public.app_has_capability('integration.manage',null)
)
with check (
  org_id=public.app_org_id()
  and updated_by=auth.uid()
  and public.app_has_capability('integration.manage',null)
);

create policy integration_outbox_read
on public.integration_outbox
for select to authenticated
using (
  org_id=public.app_org_id()
  and public.app_has_capability('integration.manage',null)
);

create or replace function public.integration_connector_guard()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  if tg_op='UPDATE' then
    if old.org_id is distinct from new.org_id
       or old.connector_key is distinct from new.connector_key
       or old.connector_type is distinct from new.connector_type
       or old.created_by is distinct from new.created_by
       or old.created_at is distinct from new.created_at then
      raise exception 'Connector identity fields are immutable.' using errcode='42501';
    end if;
  end if;

  if new.public_config::text ~* '"(secret|token|password|api[_ -]?key|apikey|private[_ -]?key|credential)[^"]*"\s*:' then
    raise exception 'Integration secrets must not be stored in browser-visible configuration.'
      using errcode='42501';
  end if;

  new.updated_at:=now();
  return new;
end;
$$;

revoke all on function public.integration_connector_guard() from public,anon,authenticated;

create trigger integration_connectors_guard
before insert or update on public.integration_connectors
for each row execute function public.integration_connector_guard();

create or replace function public.integration_subscription_guard()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare v_org uuid;
begin
  select org_id into v_org
  from public.integration_connectors
  where id=new.connector_id;

  if v_org is null or v_org<>new.org_id then
    raise exception 'Integration subscription connector must belong to the same organisation.'
      using errcode='42501';
  end if;

  if tg_op='UPDATE' then
    if old.org_id is distinct from new.org_id
       or old.connector_id is distinct from new.connector_id
       or old.event_type is distinct from new.event_type
       or old.created_by is distinct from new.created_by
       or old.created_at is distinct from new.created_at then
      raise exception 'Subscription identity fields are immutable.' using errcode='42501';
    end if;
  end if;

  new.updated_at:=now();
  return new;
end;
$$;

revoke all on function public.integration_subscription_guard() from public,anon,authenticated;

create trigger integration_subscriptions_guard
before insert or update on public.integration_subscriptions
for each row execute function public.integration_subscription_guard();

create trigger audit_integration_connectors
after insert or update on public.integration_connectors
for each row execute function public.platform_audit_capture('integration_connector','id','created_by');

create trigger audit_integration_subscriptions
after insert or update on public.integration_subscriptions
for each row execute function public.platform_audit_capture('integration_subscription','id','created_by');

create or replace function public.integration_enqueue_event()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  insert into public.integration_outbox(
    org_id,connector_id,subscription_id,event_id,state,queued_at,updated_at
  )
  select
    new.org_id,
    s.connector_id,
    s.id,
    new.id,
    'pending',
    now(),
    now()
  from public.integration_subscriptions s
  join public.integration_connectors c on c.id=s.connector_id
  where s.org_id=new.org_id
    and s.event_type=new.event_type
    and s.active
    and c.enabled
    and c.org_id=new.org_id
  on conflict(subscription_id,event_id) do nothing;

  return new;
end;
$$;

revoke all on function public.integration_enqueue_event() from public,anon,authenticated;

create trigger platform_events_enqueue_integrations
after insert on public.platform_events
for each row execute function public.integration_enqueue_event();

create or replace function public.integration_outbox_immutable_browser()
returns trigger
language plpgsql
security invoker
set search_path=public
as $$
begin
  if current_user in ('anon','authenticated') then
    raise exception 'Integration delivery state is service-owned.' using errcode='42501';
  end if;
  return new;
end;
$$;

revoke all on function public.integration_outbox_immutable_browser() from public,anon,authenticated;

create trigger integration_outbox_browser_guard
before update or delete on public.integration_outbox
for each row execute function public.integration_outbox_immutable_browser();
