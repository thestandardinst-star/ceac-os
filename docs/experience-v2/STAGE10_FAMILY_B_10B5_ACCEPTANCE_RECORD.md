# CEAC OS Experience V2 — Stage 10 Family B 10B5 Acceptance Record

Date: 27 September 2026
Stage: 10 — Operational Screen Families
Family: B — People / Team
Substage: 10B5 — Administration People / employee workspace
Status: ACCEPTED AND COMPLETE

## Accepted implementation

Exact accepted implementation HEAD:

`97370ae1f3d58bf10b616907907229fc9d79201e`

PR state at acceptance:
- PR #72 OPEN;
- PR #72 DRAFT;
- mergeable;
- PR #71 frozen and untouched.

## Exact-head engineering gates

The accepted implementation passed:
- CI PASS — run `36350181102`;
- Migration Replay PASS — run `36350181122`;
- Account Security PASS — run `36350181140`;
- Complete Quality Gate PASS — run `36350181176`;
- Quality Gate result: 251 passed.

Vercel on the accepted implementation is externally blocked by the connected free project's deployment-rate limit (`api-deployments-free-per-day`). This is not an application build failure.

10B6 final Family B acceptance must still obtain an exact-head Vercel PASS before Family C may begin.

## 10B5A — Administration People directory

Accepted outcomes:
- organisation People remains sourced through the existing `admin_people_summary` authority path;
- search and factual filters remain intact;
- people remain grouped by unit;
- employee identity, role, unit and state are primary;
- open/finished work and no-submission context remain secondary factual evidence;
- the interface explicitly states that factual evidence is not a performance score, ranking or disciplinary conclusion;
- no protected-HR or payroll authority was introduced into the directory.

Exact-head directory proof covered:
- 320×844;
- approximately 390×844;
- 1366×768;
- 1440×900.

## 10B5B — Administration employee workspace

Accepted hierarchy:
1. identity + employment state;
2. current employment record;
3. audited employment history and Record change action;
4. factual work/activity context;
5. leave context;
6. protected-HR readiness boundary.

Authority/trust verification:
- `admin_person_detail` remains the person-detail path;
- `admin_employment_detail` remains the employment-history path;
- `admin_update_employment` remains the audited employment-change path;
- effective date, change type, correction linkage, manager/unit/role/working-pattern/status, reason/context and exit-date semantics remain intact;
- activity/session evidence remains explicitly non-scoring and does not determine pay;
- protected HR remains unconfigured where CEAC rules or data fields are unconfirmed;
- Stage 13 Payroll remains blocked;
- no schema, migration, RLS, RPC definition, auth or capability change was introduced.

Exact-head employee-workspace proof covered:
- 320×844;
- approximately 390×844;
- 1366×768;
- 1440×900;
- employment-change editor with correction and exited-state fields.

## 10B5C — acceptance matrix

The final 10B5 acceptance matrix adds deterministic Administration People/employee proof at:
- 360×800;
- 375×812;
- 414×896;
- 430×932;
- 900×900.

It also proves on a 390px phone:
- People search can reach an explicit empty state;
- the directory recovers after clearing search;
- an authorised employee record opens;
- Record employment change remains usable;
- exited status reveals Exit date;
- correction reveals Event being corrected;
- no page-level horizontal overflow is introduced.

Existing cumulative Administration acceptance separately continues to prove primary-surface viewport safety at:
- 320;
- 360;
- 375;
- 390;
- 414;
- 430.

## Visual acceptance

Exact-head rendered evidence was directly inspected across phone, tablet, laptop and desktop.

No unresolved high-severity issue was found in:
- directory hierarchy;
- employee-workspace hierarchy;
- employment-history presentation;
- work/activity explanatory context;
- leave context;
- protected-HR boundary;
- employment-change editor;
- page-level horizontal overflow;
- operational typography floor.

Full-page phone screenshots show the fixed bottom navigation crossing the long captured document. This is the existing full-page screenshot behaviour and not viewport overflow.

## Persistent evidence

10B5B exact-head evidence:

`CEAC OS / Experience V2 / Evidence / Stage 10 / Family B / 10B5B / aaeb209e277a21366f254a25c4f245d5a66d3dd2 / stage10b5b-r7-exact-head-evidence.zip`

10B5C exact-head evidence:

`CEAC OS / Experience V2 / Evidence / Stage 10 / Family B / 10B5C / 97370ae1f3d58bf10b616907907229fc9d79201e / stage10b5c-r7-exact-head-evidence.zip`

## Exit decision

10B5 — Administration People / employee workspace is ACCEPTED AND COMPLETE.

10B6 — Family B final acceptance may now begin.

Family C must not begin until 10B6 has an exact-head Vercel PASS in addition to the engineering/security and visual gates.
