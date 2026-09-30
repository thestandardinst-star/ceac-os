# CEAC OS Experience V2 — Stage 15B Acceptance Record

Date: 30 September 2026
Stage: 15 — Performance, Accessibility and CSS-Debt Closure
Substage: 15B — Evidence-backed CSS cleanup
Status: ACCEPTED AND COMPLETE

## Exact accepted application head

`a739d4846d4ff9a71cf3b010fa43d90c18646a70`

Commit:
`[level-b] EV2 15B: verify retired overview debt exact head`

PR:
- #72 — OPEN + DRAFT + mergeable
- branch: `chatgpt/experience-v2-2026-09-26`

## Accepted implementation

15B removed only CSS slices whose ownership was proven superseded by Experience V2. The cleanup preserved accepted product behaviour, role/capability authority, security and factual state semantics.

The deterministic debt contract at `tests/experience-v2-stage15-debt.spec.js` records the accepted ceilings:

- `src/premium-admin.css`: 128 → 83;
- `src/premium-executive.css`: 12 → 2;
- `src/premium-manager.css`: 139 → 68;
- `src/premium-parity.css`: 466 → 228;
- `src/premium-staff.css`: 112 → 63;
- `src/premium.css`: 65 → 50;
- `src/styles.css`: 121 → 121.

Tracked total:
- baseline: 1,043 `!important` declarations;
- accepted 15B ceiling: 615;
- reduction: 428 declarations;
- reduction rate: approximately 41%.

The V2 CSS boundary remains protected:
- zero `!important` declarations in `src/experience-v2/**/*.css`;
- no hidden global `.staff-app`, `.manager-app`, `.office-app` or `.executive-app` V2 override layer.

Remaining legacy CSS is treated as load-bearing unless later import/use or route evidence proves a smaller removable ownership slice. 15B does not authorise speculative deletion.

## Exact-head verification

On application head `a739d4846d4ff9a71cf3b010fa43d90c18646a70`:

- CI PASS — run `36705355890` (#1480);
- Migration Replay PASS — run `36705355789` (#1091);
- Account Security PASS — run `36705356033` (#1263);
- complete Level B Quality Gate PASS — run `36705355880` (#1289);
- Level B SQL and authority contracts PASS;
- browser shard 1/4 PASS;
- browser shard 2/4 PASS;
- browser shard 3/4 PASS;
- browser shard 4/4 PASS;
- merged exact-head product evidence PASS;
- role-and-RLS coordinator PASS;
- Vercel PASS.

## Product evidence

Primary cumulative artifact:
- `redesign-r7-product-inspection`;
- artifact id: `11091639391`;
- digest: `sha256:522752a0f5b0da90009cd07878249d11d5a0b55a59d23894766e56edfe420fa0`.

Foundation artifact:
- `experience-v2-foundation`;
- artifact id: `11092595604`;
- digest: `sha256:11b5c4401703dcd9350abdb1ab83eac2cb69ddddbe00d913ef6ce5bc1edbe41e`.

Direct inspection of exact-head cumulative evidence included representative:
- Staff phone at 390px;
- Manager laptop at 1366px;
- Administration desktop at 1440px;
- Executive phone at 390px.

The inspected surfaces retained:
- coherent shell/navigation;
- readable hierarchy and spacing;
- bounded responsive composition;
- truthful empty/recorded states;
- no page-level horizontal escape;
- no obvious regression from retirement of the superseded overview CSS.

No unresolved deterministic 15B visual or functional regression remained after exact-head verification.

## Protected boundaries preserved

15B introduced no:
- fabricated evidence or data;
- authority broadening;
- RLS/RPC/auth/schema change;
- security weakening;
- replacement parity stylesheet;
- V2 `!important` debt;
- removal of factual state semantics or confirmations;
- modification to frozen PR #71;
- Payroll implementation.

## Decision

Stage 15B is ACCEPTED AND COMPLETE.

Stage 15C — Icon and dead visual cleanup is authorised to begin from the live canonical branch.