# CEAC OS Experience V2 — Stage 15 Work Brief

Date: 30 September 2026
Stage: 15 — Performance, Accessibility and CSS-Debt Closure
Status: ACTIVE
Entry checkpoint: `5c53d962a2fcaa12d1daa73377562dbad5fe3e6e`
Final accepted Stage 14 application SHA: `5a1a024ada851646a8e86f4f38cc02f92851cac6`

## Purpose

Reduce the remaining implementation debt and production weight without changing CEAC authority, behaviour or accepted product quality.

Stage 15 is a measured cleanup corridor, not a redesign and not a broad rewrite.

## Verified production baseline

Accepted Stage 14 CI build output:

- `dist/index.html`: 1.20 kB, 0.53 kB gzip;
- production CSS bundle: 506.90 kB, 74.06 kB gzip;
- production JS bundle: 1,543.05 kB, 380.46 kB gzip;
- Vite emitted the production warning that the JS chunk is larger than 500 kB after minification.

The bundle baseline comes from CI run `36677743731` on the exact accepted Stage 14 application SHA.

## Verified CSS-debt baseline

The legacy CSS layers remain globally loaded before Experience V2.

Measured `!important` declarations:

- `src/premium-admin.css`: 128;
- `src/premium-executive.css`: 12;
- `src/premium-manager.css`: 139;
- `src/premium-parity.css`: 466;
- `src/premium-staff.css`: 112;
- `src/premium.css`: 65;
- `src/styles.css`: 121.

Total verified legacy debt baseline: **1,043 `!important` declarations**.

The largest single debt layer is `premium-parity.css` with 466.

The active stylesheet order in `src/main.jsx` is:

1. `styles.css`;
2. legacy premium role/parity CSS;
3. `experience-v2.css`;
4. scoped V2 component/shell/family CSS.

## Verified V2 boundary

The inspected V2 CSS files currently contain:

- zero `!important` declarations;
- zero `.staff-app`, `.manager-app`, `.office-app` or `.executive-app` global role selectors.

This includes the V2 foundation, shell and operational-family styles inspected at Stage 15 entry.

Stage 15 must preserve that boundary. No cleanup may move legacy override behaviour into a hidden V2 global layer.

## Verified icon duplication

The canonical production V2 registry is:

- `src/experience-v2/icons.jsx`;
- Lucide-backed;
- semantic CEAC icon names and sizes.

Legacy hand-built icon implementations still exist in:

- `src/components/primitives/Icon.jsx`;
- `src/components/bits.jsx`.

These are candidates for consolidation only after current import/use ownership is proven. Do not delete them merely because a V2 replacement exists.

## Stage 15 execution sequence

### 15A — Audit and debt contract

Persist deterministic baselines and regression guards for:

- bundle weight;
- legacy `!important` debt;
- V2 override-free boundary;
- duplicate icon implementations;
- active stylesheet order;
- existing focus/keyboard and reduced-motion contracts;
- layout/overflow/responsive-image ownership.

Exit:
- measured debt is documented;
- regression tests prevent new V2 override debt;
- cleanup candidates are separated from still-load-bearing legacy code.

### 15B — Evidence-backed CSS cleanup

Work in small ownership slices.

For each slice:

1. prove the selector/rule is obsolete, duplicated or superseded;
2. remove or simplify only that slice;
3. run affected Level A;
4. inspect visual evidence at phone/laptop/desktop when presentation can change;
5. commit only after the slice is green.

Priorities:
- reduce `premium-parity.css` first where V2 already owns the rendered surface;
- then role premium files;
- then generic legacy selectors in `styles.css`.

Do not remove an entire legacy stylesheet until import/use evidence and product tests prove it is no longer load-bearing.

### 15C — Icon and dead visual cleanup

- identify production imports of the two legacy hand-built icon systems;
- migrate only proven V2-owned usage to `CeacIcon`;
- remove a legacy icon implementation only when no production import remains;
- identify dead visual components by import graph and accepted route coverage;
- do not delete compatibility code still used by non-V2 deep surfaces.

### 15D — Performance and accessibility closure

Verify and improve, without weakening behaviour:

- production chunking / bundle weight;
- semantic focus and keyboard operation;
- contrast;
- reduced-motion behaviour;
- layout shift;
- responsive image/media behaviour;
- no hidden role-level global override layer.

Performance changes must preserve deterministic route loading and existing security/auth boundaries.

### 15E — Stage 15 final acceptance

Require one exact application SHA with:

- CI PASS;
- Migration Replay PASS;
- Account Security PASS;
- complete Level B Quality Gate PASS;
- all browser shards PASS;
- SQL/RLS/security contracts PASS;
- Vercel PASS;
- direct phone/laptop/desktop inspection;
- recorded before/after bundle and CSS-debt measurements;
- no unresolved high-severity accessibility/performance/CSS regression.

## Protected boundaries

Stage 15 must not:

- broaden route, role or capability authority;
- alter RLS/RPC/auth/schema merely for cleanup;
- weaken security or tests;
- create a replacement global parity stylesheet;
- move legacy override debt into V2;
- remove a confirmation or truthful state;
- change CEAC business rules;
- modify frozen PR #71;
- open Payroll;
- force-push or rewrite accepted canonical history.

## Immediate next action

Add a deterministic Stage 15 debt/a11y contract that locks the verified baseline and prevents regression, then begin the smallest proven CSS-debt reduction slice.