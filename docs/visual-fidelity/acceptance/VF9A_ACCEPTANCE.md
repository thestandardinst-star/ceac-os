# CEAC OS — VF9A Acceptance Record

Substage: VF9A — accessibility / focus / contrast / reflow / touch
Accepted application / verification SHA: `ad2b067866c3f4f55c8c32557dfd7f6d4b1b51ea`
Date: 2 October 2026

## Target

Binding references:
- `docs/visual-fidelity/VISUAL_FIDELITY_CONTRACT.md`
- `docs/visual-fidelity/VISUAL_ACCEPTANCE_PROTOCOL.md`
- `docs/visual-fidelity/IMPLEMENTATION_SEQUENCE.md`
- accepted accessibility, responsive, motion, security and authority contracts bound by `AGENTS.md`.

VF9A requirement: preserve the accepted CEAC visual system while closing accessibility regressions in focus visibility, contrast, 320px reflow, touch-target sizing and announced loading/error states.

## Level A

PASS during implementation.

Verified/corrected:
- shared error StatePanel semantics use an assertive atomic alert only for error state;
- Staff, Manager, Administration and Executive loading surfaces expose polite live status plus `aria-busy`;
- accepted CEAC text/action/status token pairs meet the 4.5:1 contrast floor tested by the closure contract;
- representative 320px role surfaces reflow without horizontal document/body overflow;
- mobile navigation and each role's primary action retain the 44px CEAC touch floor;
- keyboard navigation exposes a visible focus indicator in the desktop command layer;
- data-viz labels no longer use sub-12px text and interactive chart controls retain the shared control minimum;
- reduced-motion semantics remain unchanged.

No authentication, RLS/RPC/capability, Work Engine, finance, reporting, HR, integration or factual/no-inference semantics changed.

## Level B — exact head

PASS.

Exact-head evidence:
- CI `37026170244`: PASS
- Migration Replay `37026170742`: PASS
- Account Security `37026170434`: PASS
- Quality Gate `37026170280`: PASS
- SQL/RLS/security contracts: PASS
- browser shards 1–4: PASS
- merged exact-head product evidence: PASS
- role-and-RLS coordinator: PASS

Vercel status:
- routine non-main Preview for this Level B head is intentionally controlled by the repository VF deployment policy;
- the Vercel status lane continues to report the external free-plan deployment-rate limit and is **not** recorded as a deployment PASS;
- VF9A acceptance does not depend on deployed-product inspection; actual deployed-product inspection remains a mandatory VF10D gate and may not be waived.

## Level C — Product Fidelity

PASS.

Representative exact-head evidence:
- `vf9a-staff-reflow-phone-320.png`
- `vf9a-manager-reflow-phone-320.png`
- `vf9a-administration-reflow-phone-320.png`
- `vf9a-executive-reflow-phone-320.png`
- `vf9a-manager-focus-laptop-1366.png`
- browser shard 4 artifact `11234739351`
- full route matrix artifact `11236125888`
- R7 product inspection artifact `11236066020`
- laptop density artifact `11234964683`

Observed result:
- 320px role surfaces remain deliberate rather than compressed desktop layouts;
- primary actions are reachable and visually obvious;
- desktop keyboard focus is visibly distinct without altering layout geometry;
- the four role characters remain intact;
- no horizontal page overflow, unreadable micro-text, inaccessible primary target or material visual regression is visible.

Unresolved material drift: none for VF9A.

## Decision

TECHNICALLY ACCEPTED: YES
VISUALLY / PRODUCT-EXPERIENCE ACCEPTED: YES

Next canonical substage: **VF9B — CSS debt and cascade regression**.
