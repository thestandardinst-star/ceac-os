-- Cost module. Built only after confirming the source of the numbers:
-- CEAC keeps no digital budget or spend record. It is kept on paper,
-- individually, and collated on report days.
--
-- Consequences for the design:
--  * The app is the system of record, not a mirror of something else.
--  * Entry happens in batches at collation time, tied to a report period,
--    rather than as a live ledger nobody would keep up with.
--  * Every line keeps a note of which paper it came from, so a figure can
--    be traced back to its source when it is questioned.
--  * Amounts are Ghana cedis, stored in the minor unit (pesewas) as an
--    integer so no rounding error can creep into a money total.

-- Which unit is allowed to enter spend. A flag rather than a hardcoded
-- unit name, so this stays generic across CEAC's units.
alter table units add column if not exists handles_finance boolean not null default false;

create table if not exists budgets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organisations(id) on delete cascade,
  unit_id uuid references units(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  year int not null,
  amount_pesewas bigint not null check (amount_pesewas >= 0),
  note text,
  set_by uuid references profiles(id),
  set_at timestamptz not null default now(),
  check (unit_id is not null or project_id is not null)
);

create unique index if not exists budgets_unit_year_idx
  on budgets(unit_id, year) where project_id is null;
create unique index if not exists budgets_project_idx
  on budgets(project_id) where project_id is not null;

create table if not exists spend_lines (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organisations(id) on delete cascade,
  unit_id uuid not null references units(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  period_id uuid references report_periods(id) on delete set null,
  spent_on date not null,
  description text not null,
  amount_pesewas bigint not null check (amount_pesewas >= 0),
  source_note text,                 -- which paper or book this came from
  entered_by uuid not null references profiles(id),
  entered_at timestamptz not null default now()
);

create index if not exists spend_unit_idx on spend_lines(unit_id);
create index if not exists spend_period_idx on spend_lines(period_id);
create index if not exists spend_date_idx on spend_lines(spent_on);

alter table budgets     enable row level security;
alter table spend_lines enable row level security;

-- Budgets: everyone in the org can see them; only Admin & HR sets them.
create policy bg_read on budgets for select
  using (org_id = app_org_id());
create policy bg_write on budgets for all
  using (org_id = app_org_id() and app_is_admin())
  with check (org_id = app_org_id() and app_is_admin());

-- Spend: visible to admin, exec, the unit's manager, and the finance
-- unit. Managers are read-only by design — they never enter money.
create policy sp_read on spend_lines for select
  using (org_id = app_org_id() and (
    app_is_admin() or app_is_exec()
    or unit_id in (select app_managed_units())
    or exists (select 1 from unit_memberships m
               join units u on u.id = m.unit_id
               where m.profile_id = auth.uid() and u.handles_finance)
  ));
create policy sp_write on spend_lines for all
  using (org_id = app_org_id() and (
    app_is_admin()
    or exists (select 1 from unit_memberships m
               join units u on u.id = m.unit_id
               where m.profile_id = auth.uid() and u.handles_finance)
  ))
  with check (org_id = app_org_id() and entered_by = auth.uid() and (
    app_is_admin()
    or exists (select 1 from unit_memberships m
               join units u on u.id = m.unit_id
               where m.profile_id = auth.uid() and u.handles_finance)
  ));
