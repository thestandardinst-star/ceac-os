# CEAC OS — VF7D Acceptance Record

Substage: VF7D — reduced-motion verification
Accepted application SHA: `0bb18af90f346686e482fa03ad3e15616caf4eb6`
Application-equivalent deployed checkpoint: `bef7085685b3975a167418b872a8ead238e5a9de`
Date: 2 October 2026

## Target

Binding references:
- `docs/visual-fidelity/VISUAL_FIDELITY_CONTRACT.md`
- `docs/visual-fidelity/VISUAL_ACCEPTANCE_PROTOCOL.md`
- `docs/visual-fidelity/IMPLEMENTATION_SEQUENCE.md`
- `docs/experience-v2/MOTION_IMPLEMENTATION_CONTRACT.md`
- accepted accessibility, Calendar, route/context, Sheet/modal/drawer and feedback contracts bound by `AGENTS.md`.

VF7D requirement: the complete accepted interaction layer must preserve destination, selected state, focus, factual feedback and operational actions when the user requests reduced motion. Reduced motion may remove choreography but may not remove information or capability.

## Level A

PASS during implementation and correction.

Verification facts:
- the global MotionConfig continues to use `reducedMotion="user"`;
- route/context transitions use the shared reduced-motion path;
- Calendar period and selected-date state remain visible under reduced motion;
- legacy Sheet and V2 overlays retain content, Escape dismissal and focus return;
- success/error feedback retains identical factual text and live-region semantics;
- Room jump-to-latest switches from smooth to immediate scrolling when reduced motion is requested;
- no routing, data, finance, privacy, RLS/RPC, capability, audit or business semantics changed.

A first full gate exposed a test-only scoping error: the VF7C static test referenced `room` without defining it. The assertion was moved into the correct VF7D reduced-motion contract. No production behavior was weakened to satisfy the test.

## Level B

PASS.

Exact application-head evidence:
- CI `37008866378`: PASS
- Migration Replay `37008866425`: PASS
- Account Security `37008866479`: PASS
- Quality Gate `37008866381`: PASS
- SQL/RLS/security contracts: PASS
- browser shards 1–4: PASS
- merged exact-head product evidence: PASS
- role-and-RLS coordinator: PASS

Vercel:
- deliberate application-equivalent checkpoint `bef7085685b3975a167418b872a8ead238e5a9de`: PASS;
- checkpoint changes documentation only and explicitly records the technically green application SHA.

## Level C — Product Fidelity

PASS.

Evidence inspected:
- `vf7d-reduced-motion-manager-calendar-phone-390.png`
- `vf7d-reduced-motion-manager-calendar-laptop-1366.png`
- browser shard artifact `11226608896`
- cumulative exact-head product evidence from Quality Gate `37008866381`.

Observed result:
- route destination remains clear with no transform-heavy transition dependency;
- Calendar month/week controls, period label and selected-date indicator remain visible and immediately responsive;
- Sheet open/close state preserves the same content, Escape behavior and focus return;
- phone retains reachable controls and no page overflow;
- laptop retains deliberate Calendar/agenda hierarchy with no desktop-compressed mobile layout;
- factual state, status and action availability are unchanged by reduced motion.

Unresolved material drift: none for VF7D.

## Decision

TECHNICALLY ACCEPTED: YES
VISUALLY / PRODUCT-EXPERIENCE ACCEPTED: YES

VF7 family exit: ACCEPTED.
Next canonical substage: **VF8A — 320–430 phone matrix**.
