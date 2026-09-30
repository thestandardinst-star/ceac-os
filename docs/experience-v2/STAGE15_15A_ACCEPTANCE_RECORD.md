# CEAC OS Experience V2 — Stage 15A Acceptance Record

Date: 30 September 2026
Stage: 15 — Performance, Accessibility and CSS-Debt Closure
Substage: 15A — Audit and debt contract
Status: ACCEPTED AND COMPLETE

## Exact accepted application head

`e1751ad2089bb38cd8b3d93cd0fe4f957536e9d1`

Commit:
`[level-b] EV2 15A: bind Stage 15 verification scope`

## Accepted baseline

The Stage 15 work brief and deterministic debt/accessibility contract are persisted at:

- `docs/experience-v2/STAGE15_WORK_BRIEF.md`;
- `tests/experience-v2-stage15-debt.spec.js`.

Verified production baseline from the accepted Stage 14 build:
- CSS bundle: 506.90 kB minified / 74.06 kB gzip;
- JS bundle: 1,543.05 kB minified / 380.46 kB gzip;
- Vite reports the JS chunk above its 500 kB warning threshold.

Verified legacy CSS debt baseline:
- `premium-admin.css`: 128 `!important`;
- `premium-executive.css`: 12;
- `premium-manager.css`: 139;
- `premium-parity.css`: 466;
- `premium-staff.css`: 112;
- `premium.css`: 65;
- `styles.css`: 121;
- total: 1,043.

Verified V2 boundary:
- zero `!important` declarations in Experience V2 CSS;
- no hidden `.staff-app`, `.manager-app`, `.office-app` or `.executive-app` override layer in Experience V2 CSS;
- Lucide remains centralised through `src/experience-v2/icons.jsx`;
- accepted focus, keyboard, touch and reduced-motion contracts remain protected.

Verified media baseline:
- repository-owned visual assets are small and bounded: Apple touch icon, 192px/512px PWA icons and the lightweight CEAC hero SVG;
- no heavyweight stock/generated media bundle was found;
- V2 Avatar is the live responsive image-capable primitive and retains fallback behaviour.

## Exact-head verification

On `e1751ad2089bb38cd8b3d93cd0fe4f957536e9d1`:

- CI PASS — run `36684288530` (#1459);
- Migration Replay PASS — run `36684288531` (#1070);
- Account Security PASS — run `36684288455` (#1242);
- complete Quality Gate PASS — run `36684288460` (#1268);
- Level B SQL and authority contracts PASS;
- browser shard 1/4 PASS;
- browser shard 2/4 PASS;
- browser shard 3/4 PASS;
- browser shard 4/4 PASS;
- merged exact-head product evidence PASS;
- Vercel PASS.

Merged product evidence:
- `redesign-r7-product-inspection`;
- artifact id `11083159889`;
- digest `sha256:a47309c094d3b10439b12e531a7edf58e6a92e71d88a0331f60f789a6ba0c4b0`.

## Cleanup ownership proven for first 15B slice

Read-only source inspection found that the active application shell is imported from `src/experience-v2/shell`.

The obsolete PremiumShell-specific selectors in `premium-parity.css` are referenced only by the superseded `src/components/PremiumShell.jsx` shell implementation and are absent from the active screens/components inspected across Staff, Manager, Administration and Executive.

The first authorised 15B slice is therefore:
- remove only the dead PremiumShell-specific parity selectors;
- preserve all live generic page/content parity rules;
- tighten the `premium-parity.css` debt ceiling to the measured post-removal count;
- run the Stage 15 Level A product/route/visual contract before any next cleanup slice.

## Decision

15A satisfies its exit criteria and is ACCEPTED AND COMPLETE.

Stage 15B — Evidence-backed CSS cleanup is authorised.