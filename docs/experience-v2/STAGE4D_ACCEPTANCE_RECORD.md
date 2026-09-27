# Experience V2 — Stage 4D Acceptance Record

Date: 27 September 2026

## Accepted implementation

Stage 4D — Shell acceptance

Accepted exact implementation SHA:
`e6b26a07bf522ec63824bbaa9158fdd0b1d06ed4`

Stage 4 — Shell V2 is complete at this accepted implementation checkpoint.

## Engineering gates

Exact-head status:
- CI — PASS
- Migration Replay — PASS
- Account Security — PASS
- Complete Quality Gate — PASS
- Vercel — PASS

Quality Gate:
- run `36293860529`

## Stage 4D route and interaction proof

The exact-head Stage 4D matrix verifies:

- the approved destination model matches the runtime route contract;
- every authorised desktop destination is reachable for Staff, Manager, Administration/HR and Executive;
- every mobile primary destination is reachable and reports the correct active state;
- every mobile More-drawer destination is reachable and role-specific;
- More closes correctly after navigation;
- Escape closes More and returns focus to its trigger;
- protected `Primitives` diagnostics are absent from ordinary navigation;
- Administration `People` remains capability-gated;
- desktop and mobile route transitions do not create page-level horizontal overflow in the tested matrix.

The Stage 4D tests executed inside the successful full Quality Gate as:
- `Stage 4D approved destination model matches the runtime route contract`;
- `Stage 4D every authorised desktop destination is reachable for all four roles`;
- `Stage 4D mobile primary and More destinations remain reachable and role-specific`.

## Defect found and corrected during Stage 4D

The first Stage 4D Quality Gate exposed real visible text below the ratified 12px operational floor on legacy surfaces reached by the new all-route inventory:

- Staff/Manager Performance metadata;
- Manager Finance position metadata.

The correction was deliberately limited to the existing transitional rendered-text-floor selector block in `src/premium-parity.css`.

No new `!important` rule was added by the correction, and no route, data, security or authority behaviour changed.

The corrected exact head passed the complete Quality Gate.

## Rendered evidence inspected

Successful exact-head Quality Gate artifact:
- `redesign-r7-product-inspection`
- artifact ID `10923521832`

Direct inspection covered:
- Staff desktop shell;
- Manager desktop shell;
- Administration/HR desktop shell;
- Executive desktop shell;
- Staff mobile More drawer;
- Manager mobile More drawer;
- Administration/HR mobile More drawer;
- Executive mobile More drawer.

Persistent evidence package:
`CEAC OS / Experience V2 / Evidence / Stage 4 / 4D / e6b26a07bf522ec63824bbaa9158fdd0b1d06ed4 / stage4d-r7-exact-head-evidence.zip`

## Stage 4 exit decision

Stage 4 exit gate is satisfied.

The accepted shell provides:
- one coherent V2 desktop/laptop navigation shell;
- one separately composed mobile shell;
- truthful destination search;
- authorised role navigation;
- authorised quick actions;
- stable account context;
- safe mobile More navigation;
- accepted responsive behaviour from narrow phone through laptop and wide desktop.

## Boundary confirmation

Stage 4D did not change:
- Supabase schema;
- migrations;
- RLS;
- RPC authority;
- authentication/session rules;
- frozen PR #71;
- Manager, Administration or Executive content architecture.

## Next stage

Proceed to Stage 5 — Keystone 1: Staff Today.

Stage 5 begins with an audit/contract substage before product-code migration. It must preserve the current Staff data and work-session behaviour, alerts, work, meetings, announcements, dependencies and authority/security while rebuilding the visible Staff Today experience with V2 components, Lucide icons and V2 composition rules.

Do not start Stage 6 until Staff Today is visually and functionally accepted.
