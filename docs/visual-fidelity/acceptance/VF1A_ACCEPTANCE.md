# CEAC OS — VF1A Acceptance Record

Substage: VF1A — Shell / navigation / command layer
Exact application SHA: `2c9600c1e0c18365723dcc7b54c84d21bf52eab0`
Date: 1 October 2026

Target references:
- `docs/visual-fidelity/VISUAL_FIDELITY_CONTRACT.md`
- `docs/visual-fidelity/VF0C_WHOLE_SYSTEM_VISUAL_GAP_MAP.md`
- `docs/visual-fidelity/targets/CEAC_PREMIUM_COMPOSITION_TARGET.html`

Implementation:
- compacted the persistent desktop command bar;
- reduced shell dead space at ordinary laptop widths;
- grouped desktop navigation by existing destination semantics without changing route authority;
- preserved CEAC dark navigation identity, action-blue active state and role-specific destination sets;
- preserved the existing mobile top bar, bottom navigation and More-drawer contract;
- removed newly introduced literal shell colour drift before acceptance and kept shared tokens authoritative.

Level A:
- PASS on the implementation commit preceding exact-head Level B.
- Build and targeted shell browser coverage passed.

Level B — exact head:
- CI: PASS
- Migration Replay: PASS
- Account Security: PASS
- Quality Gate: PASS
- SQL / RLS / authority contracts: PASS
- Browser shards 1–4: PASS
- Exact-head evidence merge: PASS
- role-and-RLS: PASS
- Vercel: PASS

Exact-head evidence:
- Quality Gate run: `36856711925`
- laptop-density artifact: `11159890843`
- redesign-r7 artifact: `11160395512`
- visual-parity-all-pages artifact: `11160175767`

Level C visual inspection:
- desktop/laptop shell inspected at 1180, 1366 and 1440 evidence;
- Staff, Manager, Administration and Executive shell evidence inspected;
- phone and 900px intermediate evidence inspected;
- navigation remains legible and materially more structured;
- command bar is more compact and the working canvas has more usable vertical space;
- no new clipping, accidental overflow, authority exposure or role-route drift was observed;
- the remaining card/surface and role-page composition drift belongs to VF1B and later role stages, not to the shell.

Decision:
- TECHNICALLY ACCEPTED: YES
- VISUALLY / PRODUCT-EXPERIENCE ACCEPTED: YES
- SECURITY / AUTHORITY REGRESSION: NONE OBSERVED
- NEXT SUBSTAGE: VF1B — Typography / spacing / surface discipline
