# CEAC OS Experience V2 — Stage 10 Family D 10D2 Acceptance Record

Date: 28 September 2026
Stage: 10 — Operational Screen Families
Family: D — Time & Leave / Workforce
Substage: 10D2 — Staff Time & Leave
Status: ACCEPTED AND COMPLETE

## Accepted head

`4be9866e77593065d709c284dd05278be2018f70`

This head includes the Staff Workforce V2 migration, the scoped Staff identity-style correction, and the route-body compatibility fix required by the cumulative visual inventory.

## Exact-head engineering gates

- CI PASS — run `36380977271`;
- Migration Replay PASS — run `36380977226`;
- Account Security PASS — run `36380977225`;
- Complete Quality Gate PASS — run `36380977272`;
- Quality Gate result: 288 passed in 9.3 minutes;
- Vercel PASS.

The cumulative Quality Gate also passed the Stage 9 Workforce Management SQL/security gate and the existing cross-role Workforce browser acceptance.

## Accepted Staff product character

The Staff Workforce route now uses the Experience V2 Workforce family while retaining the established route heading `Workforce`.

The first view is explicitly personal:
- “My time & leave” identity;
- factual Today status;
- configured day type and clock context;
- first/final recorded session context;
- approved leave;
- effective corrections;
- explanatory configured-versus-recorded context.

Secondary personal views remain available for:
- My week;
- Leave;
- Sessions;
- Recorded differences;
- Corrections.

The Staff page no longer presents the person as a reduced organisation-admin card. It uses V2 page, tab, fact, record-row, state and empty patterns.

## Stage 9 authority and truthfulness preserved

No schema, migration, RLS policy, RPC definition, authentication configuration or capability grant changed.

Preserved:
- Staff self-only Workforce scope;
- existing `workforce_request_leave` request path in My Hub;
- cancellation through `workforce_leave_action`;
- existing Stage 9 schedule/session/correction/leave/policy reads;
- append-only correction/history semantics;
- unconfigured-policy truthfulness.

The presentation explicitly preserves:
- “No session recorded” as context, not an automatic absence finding;
- no automatic late/no-show/underworked finding;
- no attendance/performance score;
- no payroll-time interpretation;
- no invented leave entitlement, accrual, carry-over or remaining balance.

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

The exact-head R7 screenshots were directly inspected. No unresolved high-severity issue remains in:
- Staff first-view hierarchy;
- narrow-screen tab composition;
- operational typography;
- touch-target geometry;
- personal factual context;
- desktop/laptop density;
- page-level horizontal overflow.

The full-page phone screenshots can show the fixed bottom navigation crossing a long captured document. This is the established full-page capture behaviour rather than content overflow.

## Persistent evidence

`CEAC OS / Experience V2 / Evidence / Stage 10 / Family D / 10D2 / 4be9866e77593065d709c284dd05278be2018f70 / stage10d2-4be-r7-exact-head-evidence.zip`

Quality Gate R7 artifact:
- `redesign-r7-product-inspection` — artifact `10953151502`.

## Exit decision

10D2 — Staff Time & Leave is ACCEPTED AND COMPLETE.

10D3 — Manager Workforce context may begin.
10D4 Administration and 10D5 Family D final acceptance have not started.
PR #72 remains OPEN + DRAFT.
PR #71 remains frozen.
