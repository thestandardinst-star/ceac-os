# CEAC OS — VF7B Acceptance Record

Substage: VF7B — drawers / sheets / details
Accepted application SHA: `0910e95cfae01d3722b3d4a3a6cb91d2fa472305`
Exact verification head: `b66f7c3376d1221ebc61ac34fddf0b84c1115cac`
Date: 2 October 2026

## Target

Binding references:
- `docs/visual-fidelity/VISUAL_FIDELITY_CONTRACT.md`
- `docs/visual-fidelity/VISUAL_ACCEPTANCE_PROTOCOL.md`
- `docs/visual-fidelity/IMPLEMENTATION_SEQUENCE.md`
- `docs/experience-v2/MOTION_IMPLEMENTATION_CONTRACT.md`
- accepted Calendar, Finance, overlay, focus and accessibility contracts bound by `AGENTS.md`.

VF7B requirement: drawers, sheets and operational details must share one restrained interaction vocabulary, preserve keyboard/focus context, meet the CEAC touch floor and avoid parallel legacy animation behavior.

## Level A

PASS during implementation.

Implementation facts:
- the legacy `Sheet` now uses `AnimatePresence`, `motion`, `useReducedMotion` and the shared `EV2_TRANSITIONS.fast/panel` vocabulary;
- legacy Sheet-specific CSS keyframes were retired instead of running a parallel animation path;
- Escape, focus trapping and focus return are preserved;
- Sheet dismissal waits for exit completion before removing parent state;
- the close target is 44×44px;
- operational `details` summaries retain at least the CEAC 44px interaction floor;
- no route, data, authority, finance, privacy, RLS/RPC or business semantics changed.

The first complete gate exposed two stale Stage 12 assertions that still required the retired CSS keyframe names. Those assertions were reconciled to verify the new semantic Motion contract and reduced-motion behavior; product code was not reverted.

## Level B — exact verification head

PASS.

Evidence:
- CI `37003765206`: PASS
- Migration Replay `37003765167`: PASS
- Account Security `37003765268`: PASS
- Quality Gate `37003765176`: PASS
- Level B SQL and authority contracts: PASS
- browser shards 1–4: PASS
- merged exact-head product evidence: PASS
- role-and-RLS coordinator: PASS
- Vercel exact-head deployment: PASS

The exact verification head differs from the accepted application SHA only by the regression-test reconciliation in `tests/experience-v2-stage12.spec.js`.

## Level C — Product Fidelity

PASS.

Interaction evidence inspected:
- `vf7b-manager-calendar-sheet-phone-390.png`
- `vf7b-manager-calendar-sheet-laptop-1366.png`
- initial application-head browser evidence artifact `11224249999`
- exact verification browser artifacts `11225517177`, `11225620174`, `11225521592`, `11225620111`
- exact verification route-matrix artifact `11225392914`
- exact verification R7 product-inspection artifact `11225238443`

Observed result:
- phone presents the Sheet as a focused bottom surface with the originating Calendar visibly retained behind it;
- laptop presents the same task as a compact focused dialog rather than an oversized page replacement;
- closing remains obvious and reachable;
- Escape dismisses and returns keyboard focus to the invoking control;
- operational disclosure controls remain reachable without oversized card treatment;
- motion is restrained and uses one shared vocabulary rather than decorative or competing animation systems;
- no material layout shift or page overflow is introduced.

Unresolved material drift: none for VF7B.

## Decision

TECHNICALLY ACCEPTED: YES
VISUALLY / PRODUCT-EXPERIENCE ACCEPTED: YES

Next canonical substage: **VF7C — state / success feedback**.
