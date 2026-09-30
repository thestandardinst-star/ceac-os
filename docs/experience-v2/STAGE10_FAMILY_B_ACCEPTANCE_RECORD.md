# CEAC OS Experience V2 — Stage 10 Family B Acceptance Record

Date: 27 September 2026
Stage: 10 — Operational Screen Families
Family: B — People / Team
Status: ACCEPTED AND COMPLETE

## Accepted implementation / closure head

Exact accepted Family B head:

`2efd54803789ed0d8f92bb700c034149debc5e88`

This head contains the accepted People/Team implementation plus the 10B5 acceptance record. It changes no schema, migration, RLS, RPC definition, auth configuration or capability grant.

PR state at acceptance:
- PR #72 OPEN;
- PR #72 DRAFT;
- mergeable;
- PR #71 frozen and untouched.

## Exact-head gates

All required gates passed on the exact accepted head:
- CI PASS — run `36351269890`;
- Migration Replay PASS — run `36351269898`;
- Account Security PASS — run `36351269929`;
- Complete Quality Gate PASS — run `36351269909`;
- Quality Gate result: 251 passed;
- Vercel PASS — exact-head deployment `2pZ9DVYqrVrspKkvBj35vvKnHqWX`.

The Quality Gate's initial localhost curl miss occurred during normal app-start readiness polling; the app subsequently started and the complete suite passed. No assertion, timeout or coverage was weakened.

## Accepted Family B surfaces

### 10B2 — Staff Team
Accepted People/Team character:
- unit identity and Unit Room are primary;
- approved leave/recent-joiner context remains factual and unit-authorised;
- leadership and people stay collaboration context rather than personnel files;
- birthdays and unit resources remain within their existing authorised surface;
- no manager-only metrics or protected HR data were introduced.

### 10B3 — Manager Team
Accepted People/Team character:
- daily people context precedes setup/resources;
- current work, presence/session, submission and review counts remain factual drill-in evidence;
- private work remains excluded;
- sub-team setup, safe work reassignment, invitations, unit resources, room entry and Give out work integrations remain on existing authority paths;
- no score, ranking or inferred performance judgement was introduced.

### 10B4 — Manager Person workspace
Accepted hierarchy:
1. identity and unit/role context;
2. current responsibilities;
3. recent outcomes;
4. submissions;
5. projects/objectives;
6. factual activity/session context;
7. attributable visible feedback.

Trust boundary:
- unit-scoped;
- private work excluded;
- feedback remains visible and attributable;
- no private manager notes;
- no Administration/HR or payroll authority leaked into Manager.

### 10B5 — Administration People / employee workspace
Accepted directory:
- organisation People remains sourced through `admin_people_summary`;
- search and factual filters remain intact;
- identity/role/unit/state are primary;
- operational evidence is secondary and explicitly non-scoring.

Accepted employee hierarchy:
1. identity + employment state;
2. current employment record;
3. audited employment history/change;
4. factual work/activity context;
5. leave context;
6. protected-HR readiness boundary.

Administration authority remains on:
- `admin_person_detail`;
- `admin_employment_detail`;
- `admin_update_employment`;
- existing `people.manage` capability boundary.

Payroll remains blocked pending confirmed CEAC rules.

## Responsive and interaction acceptance

Family B evidence covers:
- 320;
- 360;
- 375;
- approximately 390×844;
- 414;
- 430;
- representative intermediate/tablet;
- 1366×768;
- 1440×900.

The final 10B5 acceptance matrix specifically proves Administration employee workflow at 360, 375, 414, 430 and 900 widths, plus a 390px employment-change editor state.

Cumulative role coverage also proves Staff Team and Manager Team across the supported narrow-phone widths.

No unresolved high-severity issue remains in:
- page-level horizontal overflow;
- operational typography floor;
- touch-target geometry;
- People/Team hierarchy;
- People drill-in continuity;
- employment-history/change flow;
- protected-HR truthfulness;
- role/capability privacy boundaries.

Full-page mobile screenshots may show the fixed bottom navigation crossing the long captured document. This is the existing full-page capture behaviour, not viewport overflow.

## Architecture and trust boundary

Family B did not change:
- database schema;
- migrations;
- RLS policies;
- RPC definitions or grants;
- auth configuration;
- role capability model;
- payroll policy.

The family remains a presentation/interaction migration over established authority and factual data contracts.

## Persistent evidence

10B4 evidence:
`CEAC OS / Experience V2 / Evidence / Stage 10 / Family B / 10B4 / 8817477f1eec19a36eb951999c129a2a8a1f8438 / stage10b4-r7-exact-head-evidence.zip`

10B5C evidence:
`CEAC OS / Experience V2 / Evidence / Stage 10 / Family B / 10B5C / 97370ae1f3d58bf10b616907907229fc9d79201e / stage10b5c-r7-exact-head-evidence.zip`

Final technical/visual Family B evidence:
`CEAC OS / Experience V2 / Evidence / Stage 10 / Family B / Final / 97370ae1f3d58bf10b616907907229fc9d79201e / stage10-family-b-technical-final-r7.zip`

## Exit decision

Stage 10 Family B — People / Team is ACCEPTED AND COMPLETE.

Family C — Projects / Portfolio may now open from the canonical Stage 10 sequence.

Do not reopen accepted Family A or Family B surfaces unless a concrete cross-family defect is found.

PR #72 remains OPEN + DRAFT and must not be merged yet.
