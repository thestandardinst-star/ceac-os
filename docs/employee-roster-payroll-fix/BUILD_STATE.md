# Employee Roster & Payroll Completeness — Build State

Programme: ERC
Status: ACTIVE

Branch: `chatgpt/employee-roster-payroll-completeness-2026-10-03`
Baseline protected main: `a46232edff481868d764a3ece9c241e36b5282fb`

## Verified starting state

- supplied staff rows: 18
- live profiles: 6
- exact source/profile matches from prior reconciliation: 2
- ambiguous identity rows: 1
- no exact profile match rows: 15
- source rows with email: 0
- payroll periods/runs/entries/lines: 0
- compensation records: 0
- payment-detail records: 0

Root cause: authenticated profiles are being used as the effective employee master in Administration People and Payroll population logic. Employees without linked accounts therefore disappear from operational surfaces.

## ERC0 — ACCEPTED

- corrective branch created from exact protected main;
- staged implementation sequence committed;
- completeness invariant locked at 18 source staff rows and 0 unaccounted rows;
- no-fabrication and no-authority-inference rules locked.

## Current stage

ERC1 — Employee master roster independent of auth: IMPLEMENTED / GATES PENDING

Implemented:
- `public.employee_roster` with optional linked `profile_id`;
- explicit identity states: `linked`, `roster_only`, `needs_review`;
- `public.employee_unit_memberships` independent of capability authority;
- RLS + no direct browser table access;
- backfill of existing profiles as linked employee records;
- backfill of existing organisational memberships;
- Administration roster summary/detail/save/link/unit RPCs;
- platform audit triggers;
- SQL security/completeness gate wired into the cumulative contract suite.

Pending:
1. open the corrective PR;
2. pass CI, Migration Replay, Account Security and Quality Gate;
3. only then advance to ERC2 private workbook reconciliation.

No workbook employee rows are committed to Git.
