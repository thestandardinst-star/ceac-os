# CEAC OS — VF9B Acceptance Record

Substage: VF9B — CSS debt and cascade regression
Accepted verification SHA: `e4d920b8851bc9afa00c882478714f98776d7645`
Date: 2 October 2026

## Target

Binding references:
- `docs/visual-fidelity/VISUAL_FIDELITY_CONTRACT.md`
- `docs/visual-fidelity/VISUAL_ACCEPTANCE_PROTOCOL.md`
- `docs/visual-fidelity/IMPLEMENTATION_SEQUENCE.md`
- accepted Experience V2 shell, role, responsive, accessibility, motion, security and authority contracts bound by `AGENTS.md`.

VF9B requirement: close material cascade debt without replacing the accepted CEAC design system or pursuing raw legacy-selector counts that do not affect the live product.

## Level A

PASS.

Verified:
- legacy compatibility CSS remains imported before the low-specificity Experience V2 family cascade;
- every imported Experience V2/VF family stylesheet remains free of `!important`;
- legacy `!important` declarations do not directly target Experience V2/VF selectors;
- accepted Manager laptop composition wins the live cascade at 1366×768;
- accepted Administration mobile composition wins the live cascade at 390px;
- shared shell seam, working measure, control minimum and no-overflow contracts remain intact;
- the live VF9B diff required no production CSS rewrite because no material stale override was proven.

The closure deliberately treats the remaining legacy CSS as compatibility debt rather than deleting working rules without evidence. No authentication, RLS/RPC/capability, Work Engine, finance, reporting, HR, integration or factual/no-inference semantics changed.

## Level B — exact head

PASS.

Exact-head evidence:
- CI `37029835677`: PASS
- Migration Replay `37029835330`: PASS
- Account Security `37029835275`: PASS
- Quality Gate `37029835243`: PASS
- SQL/RLS/security contracts: PASS
- browser shards 1–4: PASS
- merged exact-head product evidence: PASS
- role-and-RLS coordinator: PASS

Vercel status:
- routine non-main Preview remains controlled by the VF deployment policy;
- the Vercel status lane continues to report the external free-plan deployment-rate limit and is **not** recorded as a deployment PASS;
- VF9B acceptance does not waive the mandatory deployed-product inspection at VF10D.

## Level C — Product Fidelity

PASS.

Representative exact-head evidence:
- `vf9b-manager-cascade-laptop-1366.png`
- `vf9b-administration-cascade-phone-390.png`
- browser shard 4 artifact `11236199752`
- full route matrix artifact `11237223091`
- R7 product inspection artifact `11236973231`
- laptop density artifact `11237003337`

Observed result:
- Manager retains the accepted flat, decision-led command-centre composition without shadow/card regression;
- Administration mobile retains its deliberate operations-console hierarchy and 44px mobile navigation floor;
- shell geometry, typography, role character and responsive behavior remain unchanged;
- no horizontal overflow or material cascade-induced visual drift is visible.

Unresolved material drift: none for VF9B.

## Decision

TECHNICALLY ACCEPTED: YES
VISUALLY / PRODUCT-EXPERIENCE ACCEPTED: YES

Next canonical substage: **VF9C — bundle/performance regression**.
