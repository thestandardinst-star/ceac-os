# Employee Roster & Payroll Completeness — Build State

Programme: ERC
Status: PRODUCTION DATA + DEPLOYMENT VERIFIED / AUTHENTICATED LIVE UI SMOKE PENDING

Corrective implementation PR: #94 — MERGED
Merged protected main: `17d95773a1d46af98bb71e17db23f965ce336939`
Accepted application head before merge: `06992356fa9194a81e1eed05244e3ae1159ccb20`
Baseline protected main before ERC: `a46232edff481868d764a3ece9c241e36b5282fb`

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

Production contains:

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
- ambiguous identity is visible rather than removed from the product;
- roster-only employee workspaces remain factual;
- operational work/attendance/submission evidence appears only for a real linked profile;
- unit, source-position and programme/responsibility context remain visible without granting authority.

## ERC4 — ACCEPTED / PRODUCTION MIGRATION APPLIED

Protected HR now supports employee-roster subjects, including roster-only employees.

Production migration:
- `104_employee_protected_hr_subject` — APPLIED.

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

## ERC5 — ACCEPTED / PRODUCTION MIGRATION APPLIED

Payroll population now uses canonical employee IDs rather than requiring auth profiles.

Production migration:
- `105_payroll_employee_population` — APPLIED.

Implemented:

- payroll entries carry required `employee_id`;
- linked `profile_id` is optional compatibility context;
- a draft payroll run snapshots every active employee in the roster;
- roster-only employees are not silently omitted;
- salary/payment lookups use employee-subject protected HR;
- missing base salary/payment data becomes a factual review flag;
- prepare/approve separation and approved-run immutability remain intact;
- corrections preserve employee identity.

No salary, deduction, tax, SSNIT, allowance, loan, reimbursement or bonus value is invented.

## ERC6 — ACCEPTED / PRODUCTION MIGRATION APPLIED

Administration Payroll has an explicit readiness surface before the first payroll run.

Production migration:
- `106_payroll_readiness_summary` — APPLIED.

Production readiness verification as Administration:

- active employees: 18;
- Payroll employee population: 18;
- compensation recorded: 0;
- compensation missing: 18;
- payment details recorded: 0;
- payment details missing: 18;
- identity-review employees: 1.

These are truthful missing-data states, not omissions.

## ERC7 — ACCEPTED

Pre-merge exact-head acceptance at `06992356fa9194a81e1eed05244e3ae1159ccb20`:

- CI #1920 — PASS;
- Migration Replay #1523 — PASS;
- Account Security #1695 — PASS;
- Quality Gate #1721 — PASS;
- Level B SQL and authority contracts — PASS;
- browser shards 1/4, 2/4, 3/4 and 4/4 — PASS;
- exact-head product evidence merge — PASS.

Merged-main verification at `17d95773a1d46af98bb71e17db23f965ce336939`:

- CI #1922 — PASS;
- Migration Replay #1525 — PASS;
- Account Security #1697 — PASS;
- Quality Gate #1723 — PASS;
- Level B SQL and authority contracts — PASS;
- browser shards 1/4, 2/4, 3/4 and 4/4 — PASS;
- evidence merge — PASS;
- role-and-RLS closure — PASS.

## Production deployment

GitHub's Vercel status for exact merged main `17d95773a1d46af98bb71e17db23f965ce336939` reports:

- Vercel — SUCCESS;
- deployment completed for exact merged main.

The current Vercel connector is not authorized for the project's team/deployment and returns 403 when attempting direct protected-deployment access. Therefore this document does not claim an independent authenticated live-browser smoke that was not actually performed.

## Remaining closure item

Only one ERC closure item remains:

- authenticated Administration People + Payroll smoke against the protected deployed Vercel product, confirming the live UI shows the 18-person roster, roster-only states, protected-HR controls and Payroll readiness surface.

This is an access/evidence blocker only. The code, protected-main merge, full exact-main gate, production migrations, production employee counts and production Payroll readiness are verified.
