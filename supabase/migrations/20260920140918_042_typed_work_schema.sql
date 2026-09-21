
alter table public.recurring_operations
  add column if not exists work_item_id uuid references public.work_items(id) on delete cascade,
  add column if not exists starts_on date,
  add column if not exists ends_on date,
  add column if not exists paused_at timestamptz,
  add column if not exists schedule_kind text,
  add column if not exists weekdays smallint[],
  add column if not exists day_of_month smallint;

create unique index if not exists recurring_operations_work_item_uidx
  on public.recurring_operations(work_item_id)
  where work_item_id is not null;

alter table public.recurring_operations
  drop constraint if exists recurring_operations_schedule_kind_check,
  add constraint recurring_operations_schedule_kind_check
    check (schedule_kind is null or schedule_kind in ('daily','weekly','monthly','weekdays')),
  drop constraint if exists recurring_operations_day_of_month_check,
  add constraint recurring_operations_day_of_month_check
    check (day_of_month is null or day_of_month between 1 and 31),
  drop constraint if exists recurring_operations_date_order_check,
  add constraint recurring_operations_date_order_check
    check (ends_on is null or starts_on is null or ends_on >= starts_on);

create table if not exists public.routine_schedule_versions (
  id uuid primary key default gen_random_uuid(),
  operation_id uuid not null references public.recurring_operations(id) on delete cascade,
  version integer not null,
  effective_from date not null,
  effective_to date,
  schedule_kind text not null check (schedule_kind in ('daily','weekly','monthly','weekdays')),
  weekdays smallint[],
  day_of_month smallint,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(operation_id,version),
  check (effective_to is null or effective_to >= effective_from),
  check (day_of_month is null or day_of_month between 1 and 31)
);

create table if not exists public.work_cases (
  work_item_id uuid primary key references public.work_items(id) on delete cascade,
  opened_on date not null default current_date,
  target_resolution_on date,
  case_state text not null default 'open' check (case_state in ('open','resolved')),
  resolution_note text,
  resolved_at timestamptz,
  resolved_by uuid references public.profiles(id) on delete set null,
  check (target_resolution_on is null or target_resolution_on >= opened_on),
  check (
    (case_state='open' and resolved_at is null)
    or
    (case_state='resolved' and resolved_at is not null and resolution_note is not null and length(btrim(resolution_note))>0)
  )
);

create table if not exists public.work_requests (
  work_item_id uuid primary key references public.work_items(id) on delete cascade,
  requester_id uuid not null references public.profiles(id) on delete restrict,
  responsible_profile_id uuid references public.profiles(id) on delete set null,
  responsible_unit_id uuid references public.units(id) on delete set null,
  request_state text not null default 'waiting'
    check (request_state in ('waiting','fulfilled','declined','clarification','cancelled')),
  responded_at timestamptz,
  responded_by uuid references public.profiles(id) on delete set null,
  response_note text,
  check (responsible_profile_id is not null or responsible_unit_id is not null)
);

create table if not exists public.work_request_responses (
  id uuid primary key default gen_random_uuid(),
  work_item_id uuid not null references public.work_requests(work_item_id) on delete cascade,
  actor_id uuid not null references public.profiles(id) on delete restrict,
  outcome text not null check (outcome in ('fulfilled','declined','clarification','cancelled')),
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.work_decisions (
  work_item_id uuid primary key references public.work_items(id) on delete cascade,
  authority_profile_id uuid not null references public.profiles(id) on delete restrict,
  question text not null,
  decision_text text,
  rationale text,
  decided_at timestamptz,
  decided_by uuid references public.profiles(id) on delete set null,
  check (
    (decided_at is null and decision_text is null and rationale is null)
    or
    (decided_at is not null and decision_text is not null and length(btrim(decision_text))>0
      and rationale is not null and length(btrim(rationale))>0)
  )
);

create table if not exists public.work_meeting_outcomes (
  work_item_id uuid primary key references public.work_items(id) on delete cascade,
  meeting_title text not null,
  meeting_on date not null,
  meeting_note text,
  source_event_id uuid references public.ministry_events(id) on delete set null
);

create table if not exists public.work_deliverables (
  work_item_id uuid primary key references public.work_items(id) on delete cascade,
  evidence_required boolean not null default true,
  evidence_kind text not null default 'file_or_link'
    check (evidence_kind in ('file_or_link','file','link','none')),
  check (evidence_required or evidence_kind='none')
);

create table if not exists public.work_item_links (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete cascade,
  parent_work_item_id uuid not null references public.work_items(id) on delete cascade,
  child_work_item_id uuid not null references public.work_items(id) on delete cascade,
  relation text not null check (relation in ('case_action','follow_up','related')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(parent_work_item_id,child_work_item_id,relation),
  check (parent_work_item_id <> child_work_item_id)
);

alter table public.routine_schedule_versions enable row level security;
alter table public.work_cases enable row level security;
alter table public.work_requests enable row level security;
alter table public.work_request_responses enable row level security;
alter table public.work_decisions enable row level security;
alter table public.work_meeting_outcomes enable row level security;
alter table public.work_deliverables enable row level security;
alter table public.work_item_links enable row level security;

drop policy if exists routine_schedule_versions_read on public.routine_schedule_versions;
create policy routine_schedule_versions_read on public.routine_schedule_versions
for select using (
  operation_id in (select id from public.recurring_operations)
);

drop policy if exists work_cases_read on public.work_cases;
create policy work_cases_read on public.work_cases
for select using (public.app_can_see_item(work_item_id));

drop policy if exists work_requests_read on public.work_requests;
create policy work_requests_read on public.work_requests
for select using (public.app_can_see_item(work_item_id));

drop policy if exists work_request_responses_read on public.work_request_responses;
create policy work_request_responses_read on public.work_request_responses
for select using (public.app_can_see_item(work_item_id));

drop policy if exists work_decisions_read on public.work_decisions;
create policy work_decisions_read on public.work_decisions
for select using (public.app_can_see_item(work_item_id));

drop policy if exists work_meeting_outcomes_read on public.work_meeting_outcomes;
create policy work_meeting_outcomes_read on public.work_meeting_outcomes
for select using (public.app_can_see_item(work_item_id));

drop policy if exists work_deliverables_read on public.work_deliverables;
create policy work_deliverables_read on public.work_deliverables
for select using (public.app_can_see_item(work_item_id));

drop policy if exists work_item_links_read on public.work_item_links;
create policy work_item_links_read on public.work_item_links
for select using (
  org_id = public.app_org_id()
  and public.app_can_see_item(parent_work_item_id)
  and public.app_can_see_item(child_work_item_id)
);

revoke insert,update,delete,truncate,references,trigger on
  public.routine_schedule_versions,
  public.work_cases,
  public.work_requests,
  public.work_request_responses,
  public.work_decisions,
  public.work_meeting_outcomes,
  public.work_deliverables,
  public.work_item_links
from anon, authenticated;

grant select on
  public.routine_schedule_versions,
  public.work_cases,
  public.work_requests,
  public.work_request_responses,
  public.work_decisions,
  public.work_meeting_outcomes,
  public.work_deliverables,
  public.work_item_links
to authenticated;
