# Experience V2 — Stage 5 Acceptance Record

Date: 27 September 2026

## Accepted implementation

Stage 5 — Keystone 1: Staff Today

Accepted exact implementation SHA:
`69eb0ca509f9b15047e4277667ea3016150b726e`

## Engineering gates

Exact-head status:
- CI — PASS
- Migration Replay — PASS
- Account Security — PASS
- Complete Quality Gate — PASS
- Vercel — PASS

Quality Gate:
- run `36298098841`
- Playwright role/acceptance suite: 164 passed

## Accepted Staff Today architecture

The Staff Today migration keeps `src/screens/Home.jsx` as the authoritative data/workflow container and moves the new visible composition into:

- `src/experience-v2/staff-today/StaffTodayV2.jsx`
- `src/experience-v2/staff-today/staff-today.css`

This keeps visual migration separate from Supabase/RLS/RPC authority.

The new Today screen uses accepted V2 components and the central Lucide-backed CEAC icon registry.

## Behaviour preserved

The exact-head gate confirms the broader CEAC role journeys remain green while Staff Today preserves:

- current work-session Start work and End work behaviour;
- stale-session recovery/reconciliation;
- authoritative work-item drill-in;
- manager-created meeting visibility and meeting workspace opening;
- room mentions;
- completed-work updates;
- leave decisions/updates;
- bounded work-review follow-ups;
- bounded dependency follow-ups;
- announcements/acknowledgement paths;
- factual recurring Ministry-number capture;
- current role, auth, RLS and RPC boundaries.

No Staff ranking, comparison or overall score was introduced.

## Product hierarchy accepted

The visible Staff Today hierarchy is now:

1. Staff/unit/date context and greeting;
2. work-session state and immediate action;
3. one dominant Next up action;
4. Today schedule;
5. Needs your attention when present;
6. Updates when present;
7. Waiting on others when present;
8. Coming up;
9. This week factual record;
10. lower-priority recurring Ministry record when configured;
11. Announcements when present.

The old duplicate Explore/module navigation strip is removed from Staff Today because the accepted Stage 4 shell already owns navigation.

## Defects corrected during Stage 5

Stage 5 verification found and corrected:

- stale acceptance selectors that targeted the removed legacy meeting-row class;
- an accidental loss of the recurring Ministry-number capability during the first composition pass;
- duplicate display of the dominant Next up work inside Coming up;
- mobile spacing/density issues on the week summary;
- local-time greeting/date logic, now explicitly evaluated in `Africa/Accra`;
- an obsolete Staff-home pixel fingerprint that correctly failed after the intentional V2 migration.

The visual regression threshold was not loosened. The Staff baseline itself was re-recorded for the accepted V2 composition, while the other role-home baselines remained unchanged.

## Infrastructure note

One verification attempt was interrupted by GitHub-runner/Supabase container infrastructure:
- registry rate limiting;
- an inbucket host-port conflict.

The exact accepted implementation head subsequently completed Migration Replay and the full Quality Gate successfully, so this did not require a product-code workaround.

## Rendered evidence inspected

Successful exact-head Quality Gate artifact:
- `redesign-r7-product-inspection`
- artifact ID `10924812946`

Direct inspection covered:
- 320px phone;
- 390×844 phone;
- 1366×768 laptop;
- 1440×900 desktop.

The accepted proof shows:
- no page-level horizontal overflow;
- practical mobile touch geometry;
- clear work-session action;
- one dominant next action;
- calmer conditional secondary sections;
- deliberate laptop density;
- no duplicated in-page navigation;
- Ministry record retained without dominating the daily workspace.

Persistent evidence package:
`CEAC OS / Experience V2 / Evidence / Stage 5 / 69eb0ca509f9b15047e4277667ea3016150b726e / stage5-r7-exact-head-evidence.zip`

## Boundary confirmation

Stage 5 did not change:
- database schema;
- migrations;
- RLS;
- RPC authority;
- authentication/session rules;
- frozen PR #71;
- Manager, Administration or Executive content architecture.

## Exit decision

Stage 5 exit gate is satisfied.

Proceed to Stage 6 — Keystone 2: Manager Overview.

Stage 6 must preserve manager decision authority and existing data semantics while rebuilding the command-centre composition. Do not start Stage 7 until Manager Overview has exact-head engineering and direct visual acceptance.
