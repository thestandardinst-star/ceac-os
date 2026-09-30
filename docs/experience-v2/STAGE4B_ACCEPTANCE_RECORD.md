# Experience V2 — Stage 4B Acceptance Record

Date: 26 September 2026

## Accepted implementation

Stage 4B — V2 shared shell structure

Accepted exact implementation SHA:
`99a380e42083153ce627eccad9f412bfad5f0a2a`

## Engineering gates

Exact-head status:
- CI — PASS
- Migration Replay — PASS
- Account Security — PASS
- Complete Quality Gate — PASS
- Vercel — PASS

Quality Gate run:
- `36266918061`

## Accepted shell changes

- Production shell moved from the legacy PremiumShell implementation to isolated `src/experience-v2/shell/`.
- Four-role navigation is driven by one central role/destination policy.
- Administration People is capability-gated by `people.manage`.
- The protected Primitives diagnostic route is absent from ordinary production navigation.
- Quick actions are centralised with role policy; Staff is not offered work creation, while Manager, Administration and Executive retain the existing authorised assignment path.
- Desktop navigation has an independently scrollable middle region while identity and account remain stable.
- Destination search is truthfully scoped to navigation.
- The Create action uses the accepted Stage 3 PopoverMenu primitive.
- Mobile More uses the accepted Stage 3 Drawer primitive with focus restoration.
- Dual-unit switching is integrated into shell context rather than rendered as a detached strip.
- Accra date/time is explicitly formatted using `Africa/Accra`.
- V2 shell chrome uses the shared Lucide registry.
- Shell CSS is isolated and adds no `!important` declarations.
- The shared small Avatar now respects the ratified 12px operational text floor.

## Verification defects found and corrected

The first full verification pass exposed migration defects caused by the shell replacement rather than business/data defects:

1. legacy acceptance suites still targeted `.premium-*` shell selectors;
2. the shared small Avatar initials rendered at 11px;
3. legacy visual regression compared deliberately replaced shell chrome against the old shell baseline.

Corrections were made at the appropriate shared/test-contract layer without weakening role, authority, accessibility or navigation assertions. The visual-regression tolerance itself was not raised.

## Rendered evidence inspected

The exact-head Quality Gate produced and persisted rendered evidence. The following Stage 4B shell views were inspected directly:

- `redesign-r7-staff-desktop.png`
- `redesign-r7-manager-desktop.png`
- `redesign-r7-administration-desktop.png`
- `redesign-r7-executive-desktop.png`
- `redesign-r7-staff-mobile.png`

The inspected evidence shows the intended deep shell / light workspace composition, V2 icon language, truthful destination search, stable account region, compact desktop shell, integrated mobile identity, and five-control mobile navigation.

## Boundary confirmation

Stage 4B did not change:
- Supabase schema;
- migrations;
- RLS;
- RPC authority;
- authentication/session rules;
- role-screen business content;
- frozen PR #71.

## Next gate

Proceed to Stage 4C — responsive and interaction hardening.

Stage 4C must pressure-test:
- 320, 360, 375, 390, 414 and 430px phone widths;
- 1366×768 laptop;
- 1440px+ desktop;
- all four roles;
- dense navigation;
- long person/unit names;
- capability-limited Administration;
- dual-unit context;
- More Drawer / Escape / focus restoration;
- search / keyboard behaviour;
- overlay and back behaviour;
- no horizontal overflow or clipped essential labels.

Do not start Stage 5 until Stage 4C and Stage 4D are accepted.
