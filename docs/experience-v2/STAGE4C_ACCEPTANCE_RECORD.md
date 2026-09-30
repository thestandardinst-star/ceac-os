# Experience V2 — Stage 4C Acceptance Record

Date: 27 September 2026

## Accepted implementation

Stage 4C — responsive and interaction hardening

Accepted exact implementation SHA:
`2768fafc78f59fc31eafb373d45d295c7acbbea3`

## Engineering gates

Exact-head status:
- CI — PASS
- Migration Replay — PASS
- Account Security — PASS
- Complete Quality Gate — PASS
- Vercel — PASS

Quality Gate:
- run `36291398713`
- successful attempt: 3

The first two attempts failed on different unrelated legacy `acceptance-core.spec.js` scenarios. The third attempt passed the complete gate on the same exact product head without another product-code change.

## Stage 4C proof

The exact-head Stage 4C browser matrix verifies:

- Staff at 320, 360, 375, 390, 414 and 430px;
- Staff, Manager, Administration/HR and Executive at 390px;
- all four roles at 1366×768;
- all four roles at 1440×900;
- 320px Administration bottom-navigation labels remain readable;
- the 320px Staff More Drawer stays inside the viewport;
- Escape closes the More Drawer and restores focus to the More trigger;
- desktop navigation keeps a independently scrollable middle region while account chrome remains stable;
- long identity and unit names truncate rather than widening the shell;
- capability-limited Administration removes People rather than leaving a dummy slot;
- multi-unit visibility remains an explicit policy boundary;
- destination search is truthful, keyboard-usable and routes to the selected destination;
- canonical mobile overlays hide bottom navigation and browser/back closure restores the shell;
- no tested page-level horizontal overflow or clipped essential shell controls.

## Rendered evidence inspected

The successful exact-head Quality Gate produced `redesign-r7-product-inspection` artifact ID `10923251132`.

Direct visual inspection covered:
- the six Staff phone widths;
- 320px Administration navigation;
- 320px open More Drawer;
- four-role 390px composition;
- four-role 1366×768 shell composition;
- four-role 1440×900 shell composition.

Persistent evidence package:
`CEAC OS / Experience V2 / Evidence / Stage 4 / 4C / 2768fafc78f59fc31eafb373d45d295c7acbbea3 / stage4c-r7-exact-head-evidence.zip`

## Defects corrected during Stage 4C

- Administration “Time & Leave” clipped at 320px; narrow mobile labels now wrap without dropping below the 12px operational floor.
- The final mobile label rule was hardened so all role labels remain readable instead of relying on ellipsis.
- Existing Administration Finance text below the ratified 12px floor was corrected in the already-existing parity hardening layer after the visual inventory exposed it.

The Finance floor correction is not a V2 role-screen rebuild and introduces no new data, authority or navigation behaviour.

## Boundary confirmation

Stage 4C did not change:
- Supabase schema;
- migrations;
- RLS;
- RPC authority;
- authentication/session rules;
- authorised route guards;
- frozen PR #71.

## Next gate

Proceed to Stage 4D — shell acceptance.

Stage 4D must prove every authorised production destination is reachable for Staff, Manager, Administration/HR and Executive, preserve capability boundaries, persist exact-head evidence, and close Stage 4 only when all exact-head gates are green.

Do not start Stage 5 before Stage 4D acceptance.
