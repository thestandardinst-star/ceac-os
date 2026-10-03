# Employee Roster & Payroll Completeness — Build State

Programme: ERC
Status: IMPLEMENTATION ACCEPTED / MERGE PENDING

Branch: `chatgpt/employee-roster-payroll-completeness-2026-10-03`
PR: #94
Baseline protected main: `a46232edff481868d764a3ece9c241e36b5282fb`
Accepted application head: `06992356fa9194a81e1eed05244e3ae1159ccb20`

## Verified baseline

- supplied staff source rows: 18
- live auth profiles at baseline: 6
- confirmed exact employee/profile links: 2
- identity-review rows: 1
- unmatched/no-account rows: 15
- source rows with email: 0
- payroll periods/runs/entries/lines at baseline: 0
- compensation records at baseline: 0
- payment-detail records at baseline: 0

## ERC0 — ACCEPTED

Control lock and staged repair sequence committed.

## ERC1 — ACCEPTED

Implemented the employee master independently of authentication:

- `public.employee_roster` is the canonical employee representation;
- `profile_id` is optional and never fabricated;
- identity states are `linked`, `roster_only`, and `needs_review`;
- employee organisational memberships are separate from capability authority;
- Administration roster reads are RLS-bound;
- auth profiles are not automatically treated as employees;
- source context is preserved without overwriting linked-account data;
- employee-roster changes are attributable through platform audit evidence.

## ERC2 — ACCEPTED / PRODUCTION ROSTER VERIFIED

The supplied private staff structure was reconciled outside Git and production now contains:

- 18 employee roster records;
- 2 confirmed linked profiles;
- 15 roster-only employees;
- 1 employee marked `needs_review`;
- 18/18 source rows represented;
- 0 source rows without a source key;
- 27 organisational membership rows;
- 17 employees with recorded office-unit membership;
- the remaining programme-only employee preserved without inventing a department;
- 0 fabricated emails;
- 0 fabricated auth users;
- no job-title-derived capability grants.

Unresolved account identity does not remove an employee from CEAC.

## ERC3 — ACCEPTED

Administration People now operates from the employee roster instead of a profile-only population.

Accepted behavior:

- all employees remain visible whether or not they have a login;
- linked-account state is explicit;
- ambiguous identity is visible rather than quarantined out of the product;
- roster-only employee workspaces remain factual;
- operational work/attendance/submission evidence appears only for a real linked profile;
- unit, source-position and programme/responsibility context remain visible without granting authority.

## ERC4 — ACCEPTED

Protected HR now supports employee-roster subjects, including roster-only employees.

Implemented:

- protected identifiers;
- employment terms;
- compensation history;
- payment details;
- protected documents;
- employee-subject audit evidence;
- Administration People controls to record authoritative salary/compensation, payment details and identifiers;
- missing protected data remains explicitly `Not recorded` rather than inferred.

The existing protected-HR capability boundary remains intact.

## ERC5 — ACCEPTED

Payroll population now uses canonical employee IDs rather than requiring auth profiles.

Implemented:

- payroll entries carry `employee_id`;
- linked `profile_id` is optional compatibility context;
- a draft payroll run snapshots every active employee in the roster;
- roster-only employees are not silently omitted;
- salary/payment lookups use employee-subject protected HR;
- missing base salary/payment data becomes a factual review flag;
- prepare/approve separation and approved-run immutability remain intact;
- corrections preserve employee identity.

No salary, deduction, tax, SSNIT, allowance, loan, reimbursement or bonus value is invented.

## ERC6 — ACCEPTED

Administration Payroll now has an explicit readiness surface before the first payroll run.

It shows:

- active employee count;
- linked-account versus roster-only population;
- identity-review count;
- compensation recorded versus missing;
- payment details recorded versus missing;
- truthful setup guidance before creating the first run.

The readiness RPC exposes configuration completeness, not salary or bank values.

## ERC7 — ACCEPTED

Exact-head acceptance at `06992356fa9194a81e1eed05244e3ae1159ccb20`:

- CI #1920 — PASS
- Migration Replay #1523 — PASS
- Account Security #1695 — PASS
- Quality Gate #1721 — PASS
- Level B SQL and authority contracts — PASS
- browser shards 1/4, 2/4, 3/4 and 4/4 — PASS
- exact-head product evidence merge — PASS

Hard contracts now cover:

- employee roster independence from auth;
- explicit browser fixture employees;
- roster-only People behavior;
- protected HR for roster-only employees;
- Payroll population by employee ID;
- Payroll readiness completeness;
- no stale blocked-Payroll placeholder acceptance.

## Production state before merge

Already present:
- roster migration `employee_roster_master`;
- reconciled 18-person employee roster.

Still pending until the accepted branch is merged:
- employee-subject protected-HR migration;
- employee-based Payroll population migration;
- Payroll readiness migration;
- new Administration People and Payroll UI deployment.

## Release corridor

1. merge PR #94 according to protected-main rules;
2. verify exact merged-main CI, Migration Replay, Account Security and Quality Gate;
3. apply the remaining accepted production migrations in canonical order;
4. verify production employee counts remain 18/18 with 0 unaccounted rows;
5. verify production Payroll readiness reports all 18 active employees and missing protected values truthfully;
6. perform authenticated Administration People + Payroll smoke verification against the deployed merged main;
7. close ERC only after those checks pass.
