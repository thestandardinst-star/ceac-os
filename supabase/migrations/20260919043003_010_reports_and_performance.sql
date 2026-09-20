-- Additive only. Creates nothing that already exists, alters no existing
-- table, drops nothing, and changes no existing policy.
--
-- Cost is deliberately NOT included: the Admin & HR spec says the module
-- needs an answer on where budget and spend data comes from before build.
--
-- Deliberately absent everywhere below: any overall score, percentage or
-- rating column. The spec is explicit that an invented weighted number
-- attached to a person is the most damaging thing this system could
-- produce. Components are stored; judgement stays human.

-- ---------- Reports ----------
create table if not exists report_periods (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organisations(id) on delete cascade,
  kind text not null check (kind in ('week','month','project','year')),
  label text not null,              -- e.g. 'Week 34 — 17 Aug – 22 Aug'
  starts_on date not null,
  ends_on date not null,
  status text not null default 'open' check (status in ('open','closed')),
  created_at timestamptz not null default now()
);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organisations(id) on delete cascade,
  period_id uuid not null references report_periods(id) on delete cascade,
  scope text not null check (scope in ('person','unit','office','leadership')),
  unit_id uuid references units(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  narrative text,                   -- what the numbers cannot say
  status text not null default 'draft' check (status in ('draft','submitted','confirmed')),
  prepared_at timestamptz not null default now(),
  submitted_by uuid references profiles(id),
  submitted_at timestamptz,
  confirmed_by uuid references profiles(id),
  confirmed_at timestamptz,
  unique (period_id, scope, unit_id, profile_id, project_id)
);

-- Targets are always shown with results, and next period's proposed
-- target sits beside this period's achievement.
create table if not exists report_targets (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references reports(id) on delete cascade,
  name text not null,
  target_value numeric,
  target_unit text,
  achieved_value numeric,
  next_target_value numeric,
  note text,
  position int not null default 1
);

-- ---------- Performance ----------
create table if not exists appraisal_cycles (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organisations(id) on delete cascade,
  name text not null,
  starts_on date not null,
  ends_on date not null,
  status text not null default 'open' check (status in ('open','closed')),
  opened_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists appraisals (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organisations(id) on delete cascade,
  cycle_id uuid not null references appraisal_cycles(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  manager_id uuid references profiles(id),
  assessment text,
  development_notes text,
  status text not null default 'evidence' check (status in ('evidence','manager_draft','shared')),
  shared_at timestamptz,
  created_at timestamptz not null default now(),
  unique (cycle_id, profile_id)
);

-- Manager feedback log with dates. Visible to the staff member by
-- default: the spec forbids recording anything about a person that they
-- cannot see in their own Record and Me tabs.
create table if not exists feedback_notes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organisations(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  author_id uuid not null references profiles(id) on delete cascade,
  note text not null,
  created_at timestamptz not null default now()
);

create table if not exists training_records (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organisations(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  completed_on date,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists reports_period_idx on reports(period_id);
create index if not exists reports_unit_idx on reports(unit_id);
create index if not exists appraisals_profile_idx on appraisals(profile_id);
create index if not exists feedback_profile_idx on feedback_notes(profile_id);
create index if not exists training_profile_idx on training_records(profile_id);

alter table report_periods   enable row level security;
alter table reports          enable row level security;
alter table report_targets   enable row level security;
alter table appraisal_cycles enable row level security;
alter table appraisals       enable row level security;
alter table feedback_notes   enable row level security;
alter table training_records enable row level security;
