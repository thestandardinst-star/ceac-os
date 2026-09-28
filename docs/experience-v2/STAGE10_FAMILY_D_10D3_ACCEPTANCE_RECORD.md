# CEAC OS Experience V2 — Stage 10 Family D 10D3 Acceptance Record

Date: 28 September 2026
Stage: 10 — Operational Screen Families
Family: D — Time & Leave / Workforce
Substage: 10D3 — Manager Workforce context
Status: ACCEPTED AND COMPLETE

## Accepted head

`b61824834c1374d13527f1157d48035572a22665`

This head contains the Manager Workforce V2 migration plus the final static factual-wording contract alignment. The latter changes no product behaviour.

## Exact-head engineering gates

- CI PASS — run `36383865432`;
- Migration Replay PASS — run `36383865430`;
- Account Security PASS — run `36383865428`;
- Complete Quality Gate PASS — run `36383865439` (#1006);
- Quality Gate result: 298 passed in 12.9 minutes;
- Vercel PASS.

The cumulative Quality Gate also passed:
- the Stage 9 Workforce Management SQL/security gate;
- existing cross-role Workforce browser acceptance;
- all nine Manager D3 viewport tests.

## Quality Gate #1005 reconciliation

Prior head:
`5b590e18d900bb73be0ce82ef0d04d449afff392`

Quality Gate #1005 produced:
- 297 passing Playwright tests;
- 1 failing static D3 source-contract assertion.

The failed test expected:
`not converted into an automatic absence or performance judgement`

The Manager product source already contained the stronger wording:
`never converted into an automatic absence or performance judgement`

All nine D3 rendered viewport tests continued and passed in #1005. The only corrective commit, `b618248...`, changed the stale static assertion to match the existing product wording. It did not:
- weaken the factual requirement;
- add retries;
- increase timeouts;
- skip a test;
- lower viewport, typography, touch or overflow thresholds;
- change application behaviour.

## Accepted Manager product character

Manager Workforce now uses the Experience V2 Workforce family while retaining the established route heading `Workforce`.

The Manager hierarchy is:
1. Team Time & Leave identity and managed-scope count;
2. routed leave decisions requiring an authorised step;
3. Today across the team;
4. Calendar;
5. Sessions;
6. Recorded differences;
7. Corrections.

The page presents schedule, recorded session, leave and correction evidence as separate facts. It does not turn missing activity into a human-performance conclusion.

## Authority and privacy preserved

No schema, migration, RLS policy, RPC definition, authentication configuration or capability grant changed.

Preserved:
- existing managed-unit RLS/domain scope;
- configured leave-route decisions through `workforce_leave_action`;
- read-only correction history for ordinary Managers;
- existing schedule/policy/correction RPC paths when an explicit capability is present.

Exact acceptance verifies:
- `Staff Fixture` is visible in Manager scope;
- `Other Unit Fixture` is not visible;
- `Schedules & policy` is absent for the ordinary Manager fixture;
- `Record correction` is absent without `attendance.correct`.

Manager role alone therefore does not grant:
- `workforce.manage`;
- `attendance.correct`;
- organisation-wide workforce administration.

## Factual workforce semantics preserved

The Manager surface explicitly preserves:
- “No session recorded” as descriptive context;
- no automatic absence finding;
- no automatic late/no-show/underworked finding;
- no attendance/performance score;
- no ranking or probability;
- no payroll-time or salary interpretation;
- original work-session evidence unchanged.

The Stage 9 Workforce Management gate passed on the exact accepted head.

## Responsive and visual acceptance

Exact-head proof covers:
- 320×844;
- 360×800;
- 375×812;
- approximately 390×844;
- 414×896;
- 430×932;
- 900×900;
- 1366×768;
- 1440×900.

Direct inspection found no unresolved high-severity issue in:
- first-view hierarchy;
- Manager role character;
- narrow-screen tab composition;
- operational typography;
- practical touch targets;
- managed-unit factual rows;
- leave-decision placement;
- laptop/desktop density;
- page-level horizontal overflow.

The acceptance tests enforce:
- at least 12px operational text;
- at least 44px tab targets;
- no page-level horizontal overflow.

Full-page phone screenshots may show the fixed bottom navigation crossing the long captured document. This is the established capture behaviour rather than content overflow.

## Persistent evidence

`CEAC OS / Experience V2 / Evidence / Stage 10 / Family D / 10D3 / b61824834c1374d13527f1157d48035572a22665 / stage10d3-b618-r7-exact-head-evidence.zip`

Quality Gate R7 artifact:
- `redesign-r7-product-inspection` — artifact `10954635383`.

## Exit decision

10D3 — Manager Workforce context is ACCEPTED AND COMPLETE.

10D4 — Administration Time & Leave may begin only after the documentation-only acceptance commit containing this record and BUILD_STATE update is exact-head green.

10D5 Family D final acceptance has not started.
Family E — Finance has not started.
PR #72 remains OPEN + DRAFT.
PR #71 remains frozen.
