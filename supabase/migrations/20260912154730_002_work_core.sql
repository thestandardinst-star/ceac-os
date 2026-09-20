-- Projects, campaigns and events are one table with a kind.
create table projects (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references organisations(id) on delete cascade,
  kind            text not null default 'project'
                  check (kind in ('project','campaign','event')),
  lead_unit_id    uuid not null references units(id) on delete restrict,
  called_by       uuid references profiles(id),
  trigger_source  text not null default 'internal'
                  check (trigger_source in ('internal','external')),
  name            text not null,
  purpose         text,
  starts_on       date,
  ends_on         date,
  follow_up_ends_on date,
  status          text not null default 'active'
                  check (status in ('planned','active','closed','paused')),
  created_by      uuid references profiles(id),
  created_at      timestamptz not null default now()
);
create index on projects (org_id, status);
create index on projects (lead_unit_id);

create table project_units (
  project_id uuid not null references projects(id) on delete cascade,
  unit_id    uuid not null references units(id) on delete cascade,
  role       text not null default 'participating'
             check (role in ('lead','participating')),
  primary key (project_id, unit_id)
);

-- A campaign runs in stages. Healing Streams is a three-day event inside a
-- fourteen-week campaign, and the result is produced in the last stage.
create table project_phases (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name       text not null,
  position   int not null default 0,
  starts_on  date,
  ends_on    date,
  closed_at  timestamptz
);

-- Objectives are sentences by default. A target is optional, and where one
-- exists the result is never shown without it.
create table objectives (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organisations(id) on delete cascade,
  project_id    uuid not null references projects(id) on delete cascade,
  unit_id       uuid not null references units(id) on delete cascade,
  phase_id      uuid references project_phases(id) on delete set null,
  ref           text not null,
  name          text not null,
  statement     text,
  target_value  numeric,
  target_unit   text,
  achieved_value numeric,
  status        text not null default 'on_track'
                check (status in ('on_track','at_risk','met','partly_met','not_met')),
  closed_note   text,
  created_at    timestamptz not null default now()
);
create index on objectives (project_id, unit_id);

-- A unit's ongoing responsibilities. Routine work answers to these, not to
-- a strategic objective.
create table responsibilities (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references organisations(id) on delete cascade,
  unit_id    uuid not null references units(id) on delete cascade,
  name       text not null,
  position   int not null default 0,
  active     boolean not null default true
);

-- Routine jobs. The manager decides whether each one records a number.
create table recurring_operations (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organisations(id) on delete cascade,
  unit_id       uuid not null references units(id) on delete cascade,
  sub_team_id   uuid references sub_teams(id) on delete set null,
  responsibility_id uuid references responsibilities(id) on delete set null,
  name          text not null,
  cadence       text,
  records_value boolean not null default false,
  value_label   text,
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

create table operation_occurrences (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references organisations(id) on delete cascade,
  operation_id uuid not null references recurring_operations(id) on delete cascade,
  occurred_on  date not null,
  value        numeric,
  note         text,
  recorded_by  uuid references profiles(id),
  created_at   timestamptz not null default now()
);
create index on operation_occurrences (operation_id, occurred_on);

-- Not everything is a task.
create table work_items (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references organisations(id) on delete cascade,
  ref             text not null,
  kind            text not null default 'task'
                  check (kind in ('task','routine','case','request','decision','meeting_outcome','deliverable')),
  unit_id         uuid not null references units(id) on delete cascade,
  sub_team_id     uuid references sub_teams(id) on delete set null,
  project_id      uuid references projects(id) on delete set null,
  phase_id        uuid references project_phases(id) on delete set null,
  objective_id    uuid references objectives(id) on delete set null,
  responsibility_id uuid references responsibilities(id) on delete set null,
  assignee_id     uuid references profiles(id) on delete set null,
  assigned_by     uuid references profiles(id) on delete set null,
  title           text not null,
  purpose         text,
  instructions    text,
  expected_outcome text,
  outcome_note    text,
  original_due_at timestamptz,
  due_at          timestamptz,
  reschedule_count int not null default 0,
  estimate_minutes int,
  origin          text not null default 'assigned'
                  check (origin in ('assigned','self_created','assigned_by_exec')),
  visibility      text not null default 'unit'
                  check (visibility in ('unit','private')),
  confidential    boolean not null default false,
  status          text not null default 'not_started'
                  check (status in ('not_started','in_progress','waiting_on','in_review','completed','returned','cancelled')),
  first_time_approved boolean,
  last_movement_at timestamptz not null default now(),
  completed_at    timestamptz,
  created_at      timestamptz not null default now(),
  unique (org_id, ref)
);
create index on work_items (unit_id, status);
create index on work_items (assignee_id, status);
create index on work_items (project_id);

-- carried_over is derived, never typed.
create or replace function work_item_carried_over(w work_items)
returns boolean language sql immutable as $$
  select w.original_due_at is not null
     and w.due_at is not null
     and date_trunc('week', w.original_due_at) <> date_trunc('week', w.due_at);
$$;

create table checklist_items (
  id           uuid primary key default gen_random_uuid(),
  work_item_id uuid not null references work_items(id) on delete cascade,
  label        text not null,
  position     int not null default 0
);

-- Each tick is its own row, so two phones offline never overwrite each other.
create table checklist_ticks (
  id                uuid primary key default gen_random_uuid(),
  checklist_item_id uuid not null references checklist_items(id) on delete cascade,
  profile_id        uuid not null references profiles(id) on delete cascade,
  session_id        uuid,
  ticked_at         timestamptz not null default now(),
  undone_at         timestamptz,
  device_id         text
);
create index on checklist_ticks (checklist_item_id);

create table work_sessions (
  id                 uuid primary key default gen_random_uuid(),
  org_id             uuid not null references organisations(id) on delete cascade,
  profile_id         uuid not null references profiles(id) on delete cascade,
  work_item_id       uuid references work_items(id) on delete set null,
  place              text not null default 'office'
                     check (place in ('office','elsewhere')),
  started_at         timestamptz not null default now(),
  ended_at           timestamptz,
  end_reason         text check (end_reason in ('manual','idle','auto')),
  lat                double precision,
  lng                double precision,
  ip                 text,
  device_time        timestamptz,
  server_received_at timestamptz not null default now(),
  flags              jsonb not null default '{}'::jsonb
);
create index on work_sessions (profile_id, started_at desc);

alter table checklist_ticks
  add constraint checklist_ticks_session_fk
  foreign key (session_id) references work_sessions(id) on delete set null;

create table submissions (
  id               uuid primary key default gen_random_uuid(),
  org_id           uuid not null references organisations(id) on delete cascade,
  work_item_id     uuid not null references work_items(id) on delete cascade,
  profile_id       uuid not null references profiles(id) on delete cascade,
  session_id       uuid references work_sessions(id) on delete set null,
  note             text,
  outside_session  boolean not null default false,
  submitted_at     timestamptz not null default now()
);
create index on submissions (work_item_id);

create table submission_files (
  id            uuid primary key default gen_random_uuid(),
  submission_id uuid not null references submissions(id) on delete cascade,
  kind          text not null check (kind in ('upload','link')),
  url           text,
  filename      text,
  drive_file_id text,
  mime          text,
  size_bytes    bigint
);

create table reviews (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organisations(id) on delete cascade,
  submission_id uuid not null references submissions(id) on delete cascade,
  reviewer_id   uuid not null references profiles(id) on delete cascade,
  decision      text not null check (decision in ('completed','returned')),
  comment       text,
  seen_at       timestamptz,
  reviewed_at   timestamptz not null default now()
);
create index on reviews (submission_id);

-- Saying you are stuck is a claim. The other side answers.
create table blockers (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references organisations(id) on delete cascade,
  work_item_id   uuid not null references work_items(id) on delete cascade,
  claimed_by     uuid not null references profiles(id) on delete cascade,
  party_unit_id  uuid references units(id) on delete set null,
  party_text     text not null,
  since          date not null default current_date,
  note           text,
  state          text not null default 'claimed'
                 check (state in ('claimed','acknowledged','disputed','resolved')),
  responded_by   uuid references profiles(id),
  response_note  text,
  responded_at   timestamptz,
  resolved_at    timestamptz,
  created_at     timestamptz not null default now()
);
create index on blockers (work_item_id);
create index on blockers (party_unit_id, state);

create table activity_events (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organisations(id) on delete cascade,
  actor_id    uuid references profiles(id) on delete set null,
  verb        text not null,
  object_type text not null,
  object_id   uuid,
  meta        jsonb not null default '{}'::jsonb,
  at          timestamptz not null default now()
);
create index on activity_events (org_id, at desc);

create table job_runs (
  id            uuid primary key default gen_random_uuid(),
  job_name      text not null,
  scheduled_for timestamptz,
  ran_at        timestamptz not null default now(),
  status        text not null check (status in ('ok','failed')),
  error         text,
  meta          jsonb not null default '{}'::jsonb
);
create index on job_runs (job_name, ran_at desc);
