# CEAC OS — VF9C Acceptance Record

Substage: VF9C — bundle / performance regression
Accepted application / verification SHA: `f3ee60a7aaabedf90db73eb18681ea97e1173d4d`
Date: 2 October 2026

## Target

Binding references:
- `docs/visual-fidelity/VISUAL_FIDELITY_CONTRACT.md`
- `docs/visual-fidelity/VISUAL_ACCEPTANCE_PROTOCOL.md`
- `docs/visual-fidelity/IMPLEMENTATION_SEQUENCE.md`
- accepted V2 routing, security, authority and responsive contracts bound by `AGENTS.md`.

VF9C requirement: close production-bundle and route-loading regression risk against a measured exact-head baseline without removing product capability, weakening accessibility or performing a risky late-stage architecture rewrite.

## Level A / production build evidence

PASS.

Exact production build at the accepted head:
- core CSS: 518.47 kB raw / 74.27 kB gzip;
- main index JS: 65.18 kB raw / 18.48 kB gzip;
- largest non-vendor route chunk: Workforce at 91.59 kB raw;
- motion vendor: 123.72 kB raw;
- React vendor: 139.83 kB raw;
- Supabase vendor: 214.54 kB raw;
- icons vendor: 17.65 kB raw;
- production build: PASS;
- `npm audit --audit-level=high`: 0 vulnerabilities.

Regression budgets are deliberately above the measured baseline and are guards, not optimisation targets:
- core CSS <= 530 KiB raw / 78 KiB gzip;
- aggregate CSS <= 550 KiB raw;
- main JS <= 72 KiB raw;
- largest route chunk <= 100 KiB raw;
- motion / React / Supabase / icons vendor limits remain bounded at 130 / 145 / 220 / 20 KiB raw.

Route-level React lazy loading remains present for the heavy product destinations, vendor splitting remains explicit, and the route fallback stays announced with status/live/busy semantics.

No production application code changed between accepted VF9B application state and VF9C; VF9C adds exact regression verification only.

## Level B — exact head

PASS.

- CI `37031642067`: PASS
- Migration Replay `37031641884`: PASS
- Account Security `37031641786`: PASS
- Quality Gate `37031641778`: PASS after one isolated shard-1 retry
- Level B SQL and authority contracts: PASS
- browser shards 1–4: PASS
- merged exact-head product evidence: PASS
- role-and-RLS coordinator: PASS

The first shard-1 attempt timed out at the 30-second Playwright ceiling inside the unchanged long-form Staff/Manager work-loop test. The same exact application head was retried without weakening assertions or changing product code, and the complete shard passed. This is classified as a transient test-execution timeout, not a product or performance-budget defect.

Vercel:
- the routine VF9C commit was intentionally skipped by the branch preview-control policy;
- the skipped preview is not recorded as a deployment PASS;
- actual deployed-product acceptance remains mandatory at VF10D.

## Level C — Product Fidelity

PASS for VF9C.

Exact-head visual evidence:
- full route matrix artifact `11237749385`;
- R7 product inspection artifact `11237914243`;
- laptop-density artifact `11238727667`;
- browser shard evidence including successful retry artifact `11238767475`.

Observed result:
- bundle/performance verification introduced no visible composition change;
- accepted Staff, Manager, Administration and Executive role character remains intact;
- no loading-state regression was introduced by route splitting;
- no material shell, responsive, typography or hierarchy drift is visible at the exact head.

Unresolved material drift: none for VF9C.

## Decision

TECHNICALLY ACCEPTED: YES
VISUALLY / PRODUCT-EXPERIENCE ACCEPTED: YES

Next canonical substage: **VF9D — final empty / loading / error / unconfigured state audit**.
