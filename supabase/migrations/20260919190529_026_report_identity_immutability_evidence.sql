-- Reporting persistence. Three verified defects in migration 010, plus the
-- pieces the Manager Reports surface needs.
--
-- Verified live before changing anything:
--   * UNIQUE (period_id, scope, unit_id, profile_id, project_id) — for a unit
--     report profile_id and project_id are NULL, and NULLs are distinct in a
--     Postgres unique constraint, so duplicate unit reports were insertable.
--   * rpt_write was FOR ALL — a manager could edit or delete their own
--     submitted report. Submitted history was not immutable.
--   * No evidence snapshot, no version, no challenges field, no RPCs.
--   * 0 rows in report_periods, reports and report_targets. Nothing to migrate.
--
-- No period is seeded here. Administration opens periods; inventing one
-- would put fake production data in front of a real church.

-- ---------- identity and versioning ----------
alter table reports add column if not exists version int not null default 1;
alter table reports add column if not exists challenges text;
alter table reports add column if not exists correction_reason text;
alter table reports add column if not exists supersedes_report_id uuid references reports(id);
-- Frozen at submission. Null while a draft.
alter table reports add column if not exists evidence jsonb;

-- Project reports are a distinct scope from unit reports.
alter table reports drop constraint if exists reports_scope_check;
alter table reports add constraint reports_scope_check
  check (scope in ('person','unit','project','office','leadership'));

-- The old constraint could not stop duplicates. Replaced by a scope-aware
-- index that treats NULL as a real value and still allows version 2.
alter table reports drop constraint if exists reports_period_id_scope_unit_id_profile_id_project_id_key;
create unique index if not exists reports_identity_idx on reports (
  period_id, scope,
  coalesce(unit_id,    '00000000-0000-0000-0000-000000000000'::uuid),
  coalesce(profile_id, '00000000-0000-0000-0000-000000000000'::uuid),
  coalesce(project_id, '00000000-0000-0000-0000-000000000000'::uuid),
  version
);
-- At most one draft per identity, so concurrent saves cannot fork.
create unique index if not exists reports_one_draft_idx on reports (
  period_id, scope,
  coalesce(unit_id,    '00000000-0000-0000-0000-000000000000'::uuid),
  coalesce(profile_id, '00000000-0000-0000-0000-000000000000'::uuid),
  coalesce(project_id, '00000000-0000-0000-0000-000000000000'::uuid)
) where status = 'draft';

-- ---------- drill-down from a frozen report to real rows ----------
create table if not exists report_evidence_refs (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references reports(id) on delete cascade,
  section text not null,                    -- 'completed' | 'submissions' | 'overdue' | 'sessions' | ...
  object_type text not null check (object_type in
    ('work_item','submission','work_session','objective','project','leave_request')),
  object_id uuid not null,
  label text
);
create index if not exists rer_report_idx on report_evidence_refs(report_id);
alter table report_evidence_refs enable row level security;

-- ---------- factual adjustments stay attributable ----------
create table if not exists report_corrections (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references reports(id) on delete cascade,
  what text not null,
  note text not null,
  author_id uuid not null references profiles(id),
  created_at timestamptz not null default now()
);
alter table report_corrections enable row level security;

-- ---------- policies ----------
-- Submitted and confirmed reports become immutable. rpt_write FOR ALL is
-- replaced by insert plus a draft-only update; there is no delete policy.
drop policy if exists rpt_write on reports;

create policy rpt_insert on reports for insert
  with check (org_id = app_org_id() and status = 'draft' and (
    app_is_admin()
    or (scope = 'unit' and unit_id in (select app_managed_units()))
    or (scope = 'project' and unit_id in (select app_managed_units())
        and project_id in (select app_visible_projects()))));

create policy rpt_update_draft on reports for update
  using (org_id = app_org_id() and status = 'draft' and (
    app_is_admin()
    or (scope in ('unit','project') and unit_id in (select app_managed_units()))))
  with check (org_id = app_org_id() and status = 'draft' and (
    app_is_admin()
    or (scope in ('unit','project') and unit_id in (select app_managed_units()))));
-- Submission, correction and confirmation happen only through the RPCs
-- below, which are definer functions and bypass this.

create policy rer_read on report_evidence_refs for select
  using (report_id in (select id from reports));
create policy rer_write on report_evidence_refs for all
  using (report_id in (select id from reports where status = 'draft'))
  with check (report_id in (select id from reports where status = 'draft'));

create policy rc_read on report_corrections for select
  using (report_id in (select id from reports));
create policy rc_insert on report_corrections for insert
  with check (author_id = auth.uid() and report_id in (select id from reports));
