# Employee Roster & Payroll Completeness — Build State

Programme: ERC
Status: ACTIVE

Branch: `chatgpt/employee-roster-payroll-completeness-2026-10-03`
Baseline protected main: `a46232edff481868d764a3ece9c241e36b5282fb`

## Verified baseline

- staff source rows: 18
- live auth profiles at baseline: 6
- confirmed exact employee/profile links: 2
- identity-review rows: 1
- unmatched rows: 15
- staff source rows with email: 0
- payroll periods/runs/entries/lines: 0
- compensation records: 0
- payment-detail records: 0

## ERC0 — ACCEPTED

Control lock and staged repair sequence committed.

## ERC1 — ACCEPTED

Accepted head: `d3fbea4fef3e07aed309727644a4553ab9fe58ff`

Implemented:
- employee roster independent of auth;
- optional linked profile;
- linked / roster_only / needs_review identity states;
- employee unit membership separate from capability authority;
- Administration-only RLS read path;
- no automatic profile-to-employee backfill;
- source context fields for reconciliation;
- platform audit coverage;
- employee roster completeness/security gate.

Exact-head verification:
- CI PASS
- Migration Replay PASS
- Account Security PASS
- Quality Gate PASS
- SQL/authority contracts PASS
- browser shards 1–4 PASS

## Current stage

ERC2 — Staff reconciliation into employee roster: ACTIVE

Rules:
- represent all 18 staff rows;
- link only confirmed profile matches;
- keep ambiguous identity visible as needs_review;
- keep staff without account as roster_only;
- do not invent email or auth users;
- do not infer system authority from workbook titles;
- preserve unit/programme/responsibility distinctions;
- unaccounted source rows must equal 0.
