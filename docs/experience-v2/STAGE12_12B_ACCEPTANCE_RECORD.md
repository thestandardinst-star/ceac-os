# CEAC OS Experience V2 — Stage 12B Acceptance Record

Date: 29 September 2026
Stage: 12 — Motion and Interaction Quality
Substage: 12B — Shared Motion Primitives
Status: ACCEPTED AND COMPLETE

## Accepted application head

`105ec059f1dc8d7f1995b4b469edea67b45620cc`

This exact SHA is the accepted 12B application head.

## Accepted scope

12B extended the already-ratified Experience V2 motion system rather than adding a competing motion layer.

Accepted shared behaviour:
- `SegmentedControl` now uses one moving selection indicator with Motion layout continuity;
- the indicator preserves native tab/button semantics and horizontal-scroll behaviour;
- `MotionDisclosure` provides shared enter/exit height + opacity reflow for existing conditional content;
- hidden disclosure content is unmounted rather than left focusable;
- the shared Calendar family uses a moving selected-date indicator;
- calendar period labels transition through the ratified V2 timing/easing contract;
- reduced-motion users receive the same functional state changes with effectively immediate movement;
- the protected foundation proof uses the shared disclosure rather than a one-off local enter/exit implementation.

No route, role, data query, schema, RLS, RPC or capability authority changed.

## Recovery notes

The first 12B Level B candidate exposed deterministic acceptance-contract mismatches rather than product/security regressions:
1. the disclosure trigger changes its accessible name from “Reference state compact” to “Reference state expanded” after activation;
2. the older Stage 2 gallery source contract still expected `AnimatePresence` to live directly in the gallery even after enter/exit behaviour moved into the shared `MotionDisclosure` primitive.

Corrections:
- assertions now follow the current accessible trigger name after the state change;
- the Stage 2 gallery contract now verifies `MotionDisclosure` in the gallery and verifies `AnimatePresence` inside that shared primitive;
- no motion, accessibility, security or authority requirement was weakened.

## Exact-head Level B

The accepted application SHA passed the complete Level B boundary:

- CI PASS — run `36549329310` (#1404);
- Migration Replay PASS — run `36549329811` (#1015);
- Account Security PASS — run `36549329755` (#1187);
- Complete Quality Gate PASS — run `36549329067` (#1213);
- Level B SQL and authority contracts PASS;
- browser shard 1/4 PASS;
- browser shard 2/4 PASS;
- browser shard 3/4 PASS;
- browser shard 4/4 PASS;
- merged exact-head product evidence PASS;
- role-and-RLS coordinator PASS;
- Vercel exact-head deployment PASS.

## Exact-head evidence

Merged product evidence:
- `redesign-r7-product-inspection`;
- artifact ID `11024490813`;
- digest `sha256:98587c5d720a6033cc2f3424e9652d4dabbeb570106c9e7eb85f37c0dd470314`;
- head SHA `105ec059f1dc8d7f1995b4b469edea67b45620cc`.

Foundation evidence:
- `experience-v2-foundation`;
- artifact ID `11024485783`;
- digest `sha256:5eb11f393f1a25866d0a313c4756acb6ef091cec695ad9d6a78fc63387af8196`.

Direct exact-head inspection confirmed:
- 390px foundation proof remains composed after shared segment/disclosure motion;
- the shared selection indicator follows the active segment without changing control geometry;
- expanded reference detail reflows the surrounding content instead of abrupt redraw;
- 390px Manager Calendar under reduced-motion keeps month/week selection, selected date and period controls functional and readable;
- reduced-motion proof retains the selected-date indicator without requiring movement;
- 1366px foundation proof preserves the accepted wide composition with the same shared motion contract;
- no inspected proof introduced page-level horizontal overflow.

## Protected boundaries

12B preserved:
- one Motion dependency and one V2 motion-token system;
- app-level `MotionConfig reducedMotion="user"`;
- no autoplay decoration;
- no scroll hijacking;
- no action delay for decorative animation;
- no increase in V2 `!important` debt;
- no schema/migration/RLS/RPC/auth/capability change;
- frozen PR #71;
- blocked Payroll scope.

## Exit decision

Stage 12B — Shared Motion Primitives is ACCEPTED AND COMPLETE.

The next permitted substage is 12C — Apply motion to accepted high-value flows.
