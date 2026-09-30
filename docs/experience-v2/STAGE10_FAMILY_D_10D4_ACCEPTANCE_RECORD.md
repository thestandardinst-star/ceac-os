# CEAC OS Experience V2 — Stage 10 Family D 10D4 Acceptance Record

Date: 28 September 2026
Stage: 10 — Operational Screen Families
Family: D — Time & Leave / Workforce
Substage: 10D4 — Administration Time & Leave
Status: ACCEPTED AND COMPLETE

## Accepted head

`e7aaf606591f9715c76df8dd27757bc93da67e0f`

This head contains the Administration Workforce V2 migration plus the final factual wording alignment required by cumulative Stage 9 acceptance.

## Exact-head engineering gates

- CI PASS — run `36387409415`;
- Migration Replay PASS — run `36387409412`;
- Account Security PASS — run `36387409396`;
- Complete Quality Gate PASS — run `36387409479` (#1009);
- Vercel PASS.

The complete gate includes the Stage 9 Workforce security/behaviour proof and the dedicated 10D4 Administration viewport matrix.

## Accepted Administration product character

Administration Workforce now uses the shared Experience V2 Workforce family while retaining the established `Workforce` route heading.

The Administration hierarchy is:
1. organisation Time & Leave identity;
2. leave items requiring Administration action;
3. Today across the organisation;
4. Calendar;
5. Sessions;
6. Recorded differences;
7. Leave lifecycle/history;
8. Corrections;
9. schedules, day types and confirmed policy status/configuration.

## Authority and history semantics preserved

No schema, migration, RLS policy, RPC definition, authentication configuration or capability grant changed.

Preserved:
- organisation-wide Administration reads through the existing Stage 9 domain/RLS paths;
- explicit `workforce.manage` authority for schedules, day types and policy administration;
- explicit `attendance.correct` authority for attendance corrections and reversals;
- existing leave action route enforcement;
- append-only schedule versions, attendance corrections/reversals, leave events and policy versions;
- immutable original work-session evidence.

The 10D4 viewport proof verifies Administration can see both Unit A and Unit B fixture records and that explicit Administration controls remain present.

## Factual workforce semantics preserved

The Administration surface preserves:
- “No session recorded” as descriptive context only;
- no automatic absence, lateness, no-show, underwork or performance finding;
- no attendance/productivity score or ranking;
- no payroll-time or salary interpretation;
- no invented leave balance.

Leave requests remain available without a confirmed CEAC leave policy. Seeded defaults are not treated as policy.

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

Direct inspection found no unresolved high-severity hierarchy, typography, touch-target, density or horizontal-overflow issue. Tests enforce at least 12px operational text, at least 44px tab targets and no page-level horizontal overflow.

Full-page phone screenshots can show the fixed bottom navigation crossing the long captured document. This is established screenshot-capture behaviour rather than content overflow.

## Persistent evidence

`CEAC OS / Experience V2 / Evidence / Stage 10 / Family D / 10D4 / e7aaf606591f9715c76df8dd27757bc93da67e0f / stage10d4-e7a-r7-exact-head-evidence.zip`

Quality Gate R7 artifact:
- `redesign-r7-product-inspection` — artifact `10955133966`.

## Exit decision

10D4 — Administration Time & Leave is ACCEPTED AND COMPLETE.

10D5 — Family D final acceptance may begin only after the documentation acceptance head is exact-head green.
Family E — Finance has not started.
PR #72 remains OPEN + DRAFT.
PR #71 remains frozen.
