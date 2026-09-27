# Experience V2 — Stage 8 Acceptance Record

Date: 27 September 2026

## Accepted implementation

Stage 8 — Keystone 4: Executive Overview

Accepted exact implementation SHA:
`6b555613bde7f2d9b257f9c417af1cc11514a81a`

## Engineering gates

Exact-head status:
- CI — PASS
- Migration Replay — PASS
- Account Security — PASS
- Complete Quality Gate — PASS
- Vercel — PASS

Quality Gate:
- run `36313554437`
- Playwright role/acceptance suite: 179 passed

## Accepted Executive architecture

The Executive Overview migration keeps `src/screens/ExecutiveHome.jsx` as the authoritative Executive query/derivation/action container and moves the visible V2 composition into:

- `src/experience-v2/executive-overview/ExecutiveOverviewV2.jsx`
- `src/experience-v2/executive-overview/executive-overview.css`

This preserves the current organisation-scoped data/security boundary while replacing the legacy scenic dashboard composition.

## Authority and behaviour preserved

The accepted exact head retains:
- organisation-scoped completed Task/Deliverable movement for this and the previous week;
- objective totals and explicit objective statuses;
- active-project context and Portfolio drill-in;
- unresolved blocker context;
- manager-owned review context without reframing it as Executive approval;
- the next 14 days of visible non-cancelled meetings;
- meeting opening and organisation-meeting scheduling through the existing handlers;
- active recurring ministry measures and their append-only occurrence history;
- current reporting-period coverage by unit;
- Executive drill-ins to Work, Ministry, Portfolio, Organisation, Finance and Reports;
- current auth, session, RLS and RPC authority.

No new Executive write path, RLS rule, RPC, schema or migration was introduced.

## Product hierarchy accepted

The visible Executive hierarchy is now:

1. Executive/date context and restrained schedule action;
2. Senior attention;
3. Ministry movement;
4. Direction and portfolio;
5. Reporting and Finance context;
6. Organisation delivery movement;
7. Upcoming meetings;
8. Latest ministry records as supporting evidence.

The legacy scenic hero, fixed calendar rail and duplicate module/navigation strip are absent from the accepted Overview.

## Recurring ministry-number regression correction

The first Stage 8B Quality Gate exposed a real presentation regression in the recurring ministry-number workflow.

The authoritative write/read path remained correct: the Executive surface loaded the recorded operation and value, but the V2 record markup rendered the numeric value and its value label without a separating text node. The browser text therefore did not expose the factual record as `17 People received`.

The correction:
- changed presentation markup only;
- restored the factual value + label text relationship;
- did not change the recurring-operation query, occurrence write/read authority, RLS, RPC or data model;
- preserved the existing acceptance assertion rather than weakening it.

The next complete Quality Gate passed the recurring ministry-number workflow.

## Executive visual baseline acceptance

The intentional Executive V2 redesign changed the role-content fingerprint, so the pre-V2 Executive baseline correctly failed.

Before re-recording:
- fresh Stage 8 Executive proof was inspected directly;
- the screen was compared with the Stage 8 work brief, accepted Stages 5–7 and the persistent V2 quality references;
- 320px, approximately 390×844, 1366×768 and 1440×900 were reviewed;
- no high-severity Stage 8 layout, hierarchy, density, overflow or clipping defect remained.

Only the Executive visual fingerprint was re-recorded.

The regression threshold remains unchanged at mean RGB error <= 6.

Staff, Manager and Administration baselines were not re-recorded in Stage 8.

## Responsive acceptance

Direct visual inspection covered:
- 320px phone;
- 390×844 phone;
- 1366×768 laptop;
- 1440×900 desktop.

The accepted proof shows:
- intentionally single-column Executive briefing flow on phone;
- no legacy desktop rail or scenic hero on mobile;
- no page-level horizontal overflow;
- practical mobile actions;
- no clipped essential labels/actions;
- clear senior-attention and ministry-movement hierarchy;
- restrained laptop/desktop density;
- no duplicate shell navigation inside page content;
- finance/reporting context remains factual and separate;
- meetings remain accessible without dominating the briefing.

## Rendered evidence

Successful exact-head Quality Gate artifact:
- `redesign-r7-product-inspection`
- artifact ID `10930196769`

Key exact-head screenshots:
- `redesign-r7-stage8-executive-320.png`;
- `redesign-r7-stage8-executive-390.png`;
- `redesign-r7-stage8-executive-laptop.png`;
- `redesign-r7-stage8-executive-desktop.png`.

Persistent evidence package:
`CEAC OS / Experience V2 / Evidence / Stage 8 / 6b555613bde7f2d9b257f9c417af1cc11514a81a / stage8-r7-exact-head-evidence.zip`

## Boundary confirmation

Stage 8 did not change:
- database schema;
- migrations;
- RLS;
- RPC authority;
- authentication/session rules;
- data ownership;
- frozen PR #71;
- Staff Today, Manager Overview or Administration Overview authority architecture.

Stage 13 Payroll remains blocked pending confirmed CEAC payroll rules.

## Exit decision

Stage 8 exit gate is satisfied.

Stage 8 — Executive Overview is accepted and complete at exact implementation SHA `6b555613bde7f2d9b257f9c417af1cc11514a81a`.

Stage 9 may begin only from the canonical live branch state after the incoming writer reads the Stage 9 contract/sequence and confirms exact-head continuity.
