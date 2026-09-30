# CEAC OS Experience V2 — Stage 15D Acceptance Record

Date: 30 September 2026
Stage: 15 — Performance, Accessibility and CSS-Debt Closure
Substage: 15D — Performance and accessibility closure
Status: ACCEPTED AND COMPLETE

## Exact accepted application head

`f521a9af02609e31bcd67bdb00b74fd3de1d7aa5`

Verification commit:
`[level-b] EV2 15D: verify lazy-route closure exact head`

The immediately preceding deterministic correction was:
- `6df94b5df617795459198e8a0f1159d60976d50f` — `EV2 15D: keep lazy fallback outside route-body contract`.

That correction removed the Suspense route fallback from the ordinary `.body` route-body selector contract. It did not weaken the failing test. The original exact-head Level B failure had 143 passing tests and one strict-locator failure because both the outgoing route body and the lazy fallback used `.body`. After the owning fallback class was corrected, affected CI passed and a fresh exact-head Level B was requested.

## Performance closure

Stage 15 entry baseline:
- production CSS bundle: approximately 506.90 kB / 74.06 kB gzip;
- production JavaScript: one 1,543.05 kB / 380.46 kB gzip application chunk;
- Vite emitted the >500 kB chunk warning.

Accepted 15D production build:
- primary CSS: 463.28 kB / 67.49 kB gzip;
- lazy ReportingFamilyV2 CSS: 10.66 kB / 1.92 kB gzip;
- initial application index chunk: 63.89 kB / 18.12 kB gzip;
- largest emitted JavaScript chunk: Supabase vendor 214.54 kB / 55.04 kB gzip;
- React vendor: 139.83 kB / 45.33 kB gzip;
- Motion vendor: 123.72 kB / 40.15 kB gzip;
- Lucide icon vendor: 17.65 kB / 6.35 kB gzip;
- authenticated route surfaces are split into lazy chunks;
- the previous >500 kB Vite warning is no longer emitted.

The accepted optimisation is evidence-backed route/vendor chunking. It does not claim that the sum of every lazy chunk is an initial-page transfer.

## Accessibility and visual-stability closure

Deterministic 15D contracts verify:
- V2 normal-text semantic colours retain WCAG AA contrast on V2 surfaces;
- semantic action/identity/violet colours retain AA contrast on white;
- V2 brand imagery reserves width and height and decodes asynchronously;
- avatar geometry remains reserved and image-fit behaviour is bounded;
- the existing focus, keyboard, touch and reduced-motion contracts remain present;
- authenticated route surfaces use React lazy/Suspense without changing route authority;
- the loading fallback is a status surface, but is not an ordinary route `.body` and therefore cannot masquerade as the loaded route.

No schema, migration, RLS, RPC, authentication configuration, role grant or capability boundary changed in 15D.

## Exact-head verification

All required exact-head gates passed on `f521a9af02609e31bcd67bdb00b74fd3de1d7aa5`:

- CI PASS — run `36726046999` (#1497);
- Migration Replay PASS — run `36726047040` (#1108);
- Account Security PASS — run `36726047010` (#1280);
- complete Level B Quality Gate PASS — run `36726047037` (#1306);
- Level B SQL/RLS/authority contracts PASS;
- browser shard 1/4 PASS;
- browser shard 2/4 PASS;
- browser shard 3/4 PASS;
- browser shard 4/4 PASS;
- merged exact-head product evidence PASS;
- role-and-RLS coordinator PASS;
- Vercel PASS.

## Exact-head product evidence

Merged artifact:
- `redesign-r7-product-inspection`;
- artifact id: `11103516850`;
- digest: `sha256:bd6ecd7bc648154ff981e897e80a42baf79a5dbaabfd36158e4eb5d5b8b9b57b`.

Foundation artifact:
- `experience-v2-foundation`;
- artifact id: `11103506884`;
- digest: `sha256:cb0ad7b485f5bef1456c4570d2a8a72c2f7b13663ab2ec5a9763fb3f1a04085c`.

Visual-parity inventory:
- artifact id: `11103711861`;
- digest: `sha256:ae6aa885149a6250a367f539c4a375e2cf350981753e5f43a3f0e9829063aba8`.

Direct inspection included exact-head Staff mobile, Manager laptop, Administration intermediate and Executive desktop evidence. The inspected surfaces retain the accepted hierarchy, shell boundaries, readable density and bounded composition after lazy loading and chunking.

## Decision

Stage 15D satisfies its exit criteria and is ACCEPTED AND COMPLETE.

Stage 15E final acceptance may reconcile Stage 15 on this exact accepted application head.