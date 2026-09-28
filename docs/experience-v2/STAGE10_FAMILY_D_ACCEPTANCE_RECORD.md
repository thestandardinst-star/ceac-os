# CEAC OS Experience V2 — Stage 10 Family D Acceptance Record

Date: 28 September 2026
Stage: 10 — Operational Screen Families
Family: D — Time & Leave / Workforce
Status: ACCEPTED AND COMPLETE

## Accepted implementation / closure head

Exact accepted Family D head:

`916760be2bcdcd69ea9cc32f4f587a375f2c78cd`

This head contains the accepted Staff, Manager and Administration Workforce-family implementation plus the 10D4 acceptance documentation. It is exact-head green and changes no schema, migration, RLS policy, RPC definition, authentication configuration or capability grant.

PR state at acceptance:
- PR #72 OPEN;
- PR #72 DRAFT;
- mergeable;
- PR #71 frozen and untouched.

## Exact-head engineering gates

All required gates passed on the exact accepted head:
- CI PASS — run `36389994015`;
- Migration Replay PASS — run `36389993992`;
- Account Security PASS — run `36389993995`;
- Complete Quality Gate PASS — run `36389993996` (#1011);
- Quality Gate result: 308 Playwright tests passed in 10.9 minutes;
- Vercel PASS.

The Quality Gate also passed the cumulative Stage 9 Workforce Management security/behaviour gate.

## Accepted Family D surfaces

### 10D2 — Staff Time & Leave

Accepted Staff character:
- personal Time & Leave facts are primary;
- Staff remains self-scoped;
- Today, My week, Leave, Sessions, Recorded differences and Corrections use the shared V2 Workforce family;
- My Hub remains the leave request/cancel entry rather than duplicating mutation authority;
- missing session activity remains factual context only and does not become absence, lateness, underwork or performance judgement.

Accepted D2 implementation head:
`4be9866e77593065d709c284dd05278be2018f70`

### 10D3 — Manager Workforce context

Accepted Manager character:
- managed-unit Time & Leave identity and routed leave decisions precede team context;
- Today, Leave, Calendar, Sessions, Recorded differences and Corrections use the shared V2 Workforce family;
- managed-unit scope remains intact;
- ordinary Manager receives neither `workforce.manage` nor `attendance.correct` authority merely by role;
- no attendance score, ranking or performance interpretation is generated.

Accepted D3 implementation head:
`b61824834c1374d13527f1157d48035572a22665`

### 10D4 — Administration Time & Leave

Accepted Administration character:
- organisation Time & Leave identity and Administration actions precede organisation context;
- Today, Calendar, Sessions, Recorded differences, Leave, Corrections and Schedules & policy use the shared V2 Workforce family;
- organisation-wide scope remains on existing Stage 9 domain/RLS reads;
- correction/reversal, schedule/day-type and confirmed-policy administration remain protected by explicit capabilities;
- policy-unconfigured state remains truthful and no leave balance is invented.

Accepted D4 implementation head:
`e7aaf606591f9715c76df8dd27757bc93da67e0f`

## Protected Workforce verification

The Stage 9 contract remains intact:
- another Staff user cannot see a colleague's Workforce context;
- Manager remains managed-unit scoped;
- Manager cannot record an attendance correction without `attendance.correct`;
- Staff/Manager cannot administer schedules, day types or policy without `workforce.manage`;
- schedule updates remain superseding versions rather than destructive edits;
- attendance corrections and reversals remain append-only;
- original work-session rows remain unchanged;
- leave requests remain usable without a confirmed policy;
- incomplete policy cannot be activated;
- configured leave routes remain enforced;
- leave decision, cancellation and reversal history remains attributable.

No Family D screen:
- treats a missing session as automatic absence;
- creates lateness/no-show/underwork/productivity findings;
- scores or ranks people/units;
- treats attendance records as payroll time;
- introduces salary logic;
- calculates entitlement, accrual, carry-over or remaining balance from unconfirmed seeded defaults.

## Security and architecture boundary

Across Family D, the changed-file set contains no:
- Supabase migration;
- RLS policy change;
- RPC definition/grant change;
- auth configuration change;
- capability grant change.

Family D remains a presentation/interaction migration over the established Stage 9 Workforce authority and history contracts.

## Responsive and visual acceptance

Exact-head proof covers Staff, Manager and Administration at:
- 320×844;
- 360×800;
- 375×812;
- approximately 390×844;
- 414×896;
- 430×932;
- 900×900;
- 1366×768;
- 1440×900.

The exact-head R7 artifact was directly inspected across the complete role/width matrix. No unresolved high-severity issue remains in:
- first-view hierarchy;
- role-specific composition;
- page-level horizontal overflow;
- operational typography floor;
- practical touch-target geometry;
- narrow-screen tab composition;
- laptop/desktop density;
- factual attendance/leave wording;
- capability visibility.

The family tests enforce:
- at least 12px operational text;
- at least 44px tab targets;
- no page-level horizontal overflow.

Full-page phone screenshots may show the fixed bottom navigation crossing the long captured document. This is established capture behaviour, not viewport overflow.

## Persistent evidence

10D2:
`CEAC OS / Experience V2 / Evidence / Stage 10 / Family D / 10D2 / 4be9866e77593065d709c284dd05278be2018f70 / stage10d2-4be-r7-exact-head-evidence.zip`

10D3:
`CEAC OS / Experience V2 / Evidence / Stage 10 / Family D / 10D3 / b61824834c1374d13527f1157d48035572a22665 / stage10d3-b618-r7-exact-head-evidence.zip`

10D4:
`CEAC OS / Experience V2 / Evidence / Stage 10 / Family D / 10D4 / e7aaf606591f9715c76df8dd27757bc93da67e0f / stage10d4-e7a-r7-exact-head-evidence.zip`

Final exact-head Family D evidence:
`CEAC OS / Experience V2 / Evidence / Stage 10 / Family D / Final / 916760be2bcdcd69ea9cc32f4f587a375f2c78cd / stage10-family-d-final-r7.zip`

Quality Gate artifact:
- `redesign-r7-product-inspection` — artifact `10956422818`.

## Exit decision

Stage 10 Family D — Time & Leave / Workforce is ACCEPTED AND COMPLETE.

Family E — Finance has NOT started. It may open only after the documentation-only commit containing this acceptance record and BUILD_STATE update is itself exact-head green.

PR #72 remains OPEN + DRAFT and must not be merged yet.
PR #71 remains frozen.
