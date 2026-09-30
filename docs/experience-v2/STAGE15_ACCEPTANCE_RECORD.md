# CEAC OS Experience V2 — Stage 15 Acceptance Record

Date: 30 September 2026
Stage: 15 — Performance, Accessibility and CSS-Debt Closure
Status: ACCEPTED AND COMPLETE

## Final accepted application head

`f521a9af02609e31bcd67bdb00b74fd3de1d7aa5`

Documentation commits after this SHA record acceptance only and do not replace the accepted application head.

## Accepted substages

- 15A — Audit and debt contract: ACCEPTED AND COMPLETE.
- 15B — Evidence-backed CSS cleanup: ACCEPTED AND COMPLETE.
- 15C — Icon and dead visual cleanup: ACCEPTED AND COMPLETE.
- 15D — Performance and accessibility closure: ACCEPTED AND COMPLETE.
- 15E — Stage 15 final reconciliation: ACCEPTED AND COMPLETE by this record.

Acceptance records:
- `docs/experience-v2/STAGE15_15A_ACCEPTANCE_RECORD.md`;
- `docs/experience-v2/STAGE15_15B_ACCEPTANCE_RECORD.md`;
- `docs/experience-v2/STAGE15_15C_ACCEPTANCE_RECORD.md`;
- `docs/experience-v2/STAGE15_15D_ACCEPTANCE_RECORD.md`.

## CSS-debt result

Tracked legacy `!important` debt moved from 1,043 declarations at Stage 15 entry to 615:

- `src/premium-admin.css`: 128 → 83;
- `src/premium-executive.css`: 12 → 2;
- `src/premium-manager.css`: 139 → 68;
- `src/premium-parity.css`: 466 → 228;
- `src/premium-staff.css`: 112 → 63;
- `src/premium.css`: 65 → 50;
- `src/styles.css`: 121 → 121.

Total reduction:
- 428 declarations;
- approximately 41% of the tracked Stage 15 entry baseline.

The remaining legacy CSS is treated as load-bearing compatibility code unless new ownership evidence proves otherwise. Experience V2 CSS remains free of `!important` and hidden global role override selectors.

## Icon and visual-component result

- canonical V2 icon registry remains `src/experience-v2/icons.jsx`;
- unused legacy bits shell/icon exports were removed;
- `src/components/PremiumShell.jsx` and `src/components/ReferenceDashboard.jsx` were removed only after production import-graph proof;
- `src/components/primitives/Icon.jsx` remains intentionally for the protected Administration DesignPrimitives compatibility route and its legacy primitive family;
- no accepted deep/non-V2 compatibility surface was removed merely because it looked old.

## Performance result

Stage 15 entry:
- CSS approximately 506.90 kB / 74.06 kB gzip;
- monolithic application JS 1,543.05 kB / 380.46 kB gzip;
- >500 kB Vite chunk warning.

Final accepted 15D build:
- primary CSS 463.28 kB / 67.49 kB gzip;
- lazy ReportingFamilyV2 CSS 10.66 kB / 1.92 kB gzip;
- initial application index JS 63.89 kB / 18.12 kB gzip;
- largest JS chunk 214.54 kB / 55.04 kB gzip;
- role/domain routes load through lazy route chunks;
- explicit React, Supabase, Motion, Lucide and general vendor splitting is active;
- the previous >500 kB chunk warning is absent.

This is a chunking/load-boundary improvement, not a claim that every emitted lazy chunk is downloaded on initial load.

## Accessibility and stability result

Stage 15 closes with deterministic evidence for:
- semantic focus and keyboard contracts;
- touch parity;
- reduced-motion behaviour;
- WCAG AA V2 semantic-colour contrast;
- reserved brand/avatar media geometry;
- responsive route composition and overflow safety;
- truthful lazy-loading state;
- no replacement global parity stylesheet;
- no hidden role-level V2 override layer.

The one 15D deterministic failure was corrected in the owning lazy fallback rather than weakening the test.

## Final exact-head verification

On `f521a9af02609e31bcd67bdb00b74fd3de1d7aa5`:

- CI PASS — run `36726046999` (#1497);
- Migration Replay PASS — run `36726047040` (#1108);
- Account Security PASS — run `36726047010` (#1280);
- complete Level B Quality Gate PASS — run `36726047037` (#1306);
- complete SQL/RLS/security contracts PASS;
- all four browser shards PASS;
- merged exact-head product evidence PASS;
- role-and-RLS coordinator PASS;
- Vercel PASS.

Final product evidence:
- `redesign-r7-product-inspection` artifact `11103516850`, digest `sha256:bd6ecd7bc648154ff981e897e80a42baf79a5dbaabfd36158e4eb5d5b8b9b57b`;
- `experience-v2-foundation` artifact `11103506884`, digest `sha256:cb0ad7b485f5bef1456c4570d2a8a72c2f7b13663ab2ec5a9763fb3f1a04085c`;
- `visual-parity-all-pages` artifact `11103711861`, digest `sha256:ae6aa885149a6250a367f539c4a375e2cf350981753e5f43a3f0e9829063aba8`.

Direct exact-head inspection covered Staff mobile, Manager laptop, Administration intermediate and Executive desktop after the final lazy-route correction.

## Protected boundaries preserved

Stage 15 introduced no CEAC business-rule inference, schema authority broadening, RLS/RPC weakening, authentication weakening, role/capability broadening, fabricated evidence, replacement global parity layer, Payroll implementation or premature change to frozen PR #71.

## Decision

Stage 15 — Performance, Accessibility and CSS-Debt Closure is ACCEPTED AND COMPLETE.

Stage 16 — Release Candidate and Product Acceptance is now authorised.