# CEAC OS Experience V2 — Stage 11B Acceptance Record

Date: 29 September 2026
Stage: 11 — Calendar and Data Visualisation
Substage: 11B — Shared Calendar and Data Visualisation Foundation
Status: ACCEPTED AND COMPLETE

## Accepted application head

`b023394eead1d4c575c1fce88be8e36ed7d586b6`

This exact SHA is the accepted 11B application head.

## Accepted scope

11B established isolated Experience V2 foundations for:
- shared calendar page/header/period/filter presentation;
- selected-date state;
- responsive month-grid treatment;
- selected-date agenda/detail treatment;
- chronological calendar timeline treatment;
- shared factual chart language for line, bar, paired bar and donut compositions;
- mandatory chart/table equivalence;
- keyboard-focusable chart marks;
- semantic V2 colour, icon and control usage;
- Executive ministry movement migrated from the one-off `MiniTrend` implementation to the shared V2 data-visualisation contract without changing its authoritative data path.

Implementation:
- `src/experience-v2/calendar/CalendarFamilyV2.jsx`;
- `src/experience-v2/calendar/calendar.css`;
- `src/experience-v2/data-viz/DataVizV2.jsx`;
- `src/experience-v2/data-viz/data-viz.css`;
- `src/experience-v2/ExperienceV2FoundationGallery.jsx`;
- `src/experience-v2/executive-overview/ExecutiveOverviewV2.jsx`;
- `tests/experience-v2-stage11.spec.js`.

## Exact-head Level B

The accepted application SHA passed the complete Level B boundary:

- CI PASS — run `36524380135` (#1362);
- Migration Replay PASS — run `36524380098` (#973);
- Account Security PASS — run `36524380191` (#1145);
- Complete Quality Gate PASS — run `36524380117` (#1171);
- Level B SQL and authority contracts PASS;
- browser shard 1/4 PASS;
- browser shard 2/4 PASS;
- browser shard 3/4 PASS;
- browser shard 4/4 PASS;
- merged exact-head product evidence PASS;
- role-and-RLS coordinator PASS;
- Vercel exact-head deployment PASS.

## Exact-head evidence

Merged closure artifact:
- `redesign-r7-product-inspection`;
- artifact ID `11014092258`;
- digest `sha256:6e8952168076e00ce66a63fa24f228420db22fddf66c767ba56b7f6ba1a518f2`;
- head SHA `b023394eead1d4c575c1fce88be8e36ed7d586b6`.

Dedicated Stage 11 artifact:
- `stage11-product-inspection`;
- artifact ID `11014596827`;
- digest `sha256:2d9601867a81ca876a8208232baa1bd7dec1a79710f47293082b07293a9aa15b`.

Direct product inspection of exact-head screenshots confirmed:
- 320px foundation proof recomposes the month grid into touch-safe date selection with selected-date context below it and no page-level horizontal overflow;
- selected dates visibly carry factual event-presence cues without hiding the agenda/detail relationship;
- the same factual visualisation can switch between chart and table instead of exposing chart-only information;
- 1366px foundation proof preserves readable side-by-side calendar and chart composition without creating excessive card density;
- 1366px Executive Overview remains coherent after replacing the local ministry trend implementation; when comparable ministry records exist, the shared V2 chart contract is used, while no chart is fabricated when comparable records are absent.

## Recovery note

The first 11B Level B attempt exposed two deterministic acceptance-test mismatches rather than product regressions:
1. locale punctuation around the selected-date heading;
2. an unscoped `Reference leave` assertion matching both the month-grid event and selected-date agenda row.

The accepted head corrected only those test locators:
- locale-safe selected-date heading matching;
- selected-date factual assertion scoped to the agenda.

No product behaviour, authority or acceptance requirement was weakened.

## Authority and truth preserved

11B introduced no schema, migration, RLS, RPC definition, authentication configuration or capability grant change.

Preserved:
- existing calendar data authority;
- existing meeting/project/work/ministry/leave visibility;
- existing Executive query paths;
- no invented calendar event;
- no new Executive Calendar route;
- no inferred performance, productivity or attendance score;
- no currency conversion;
- no chart without a factual table/equivalent view;
- no chart-library dependency or competing visual system;
- frozen enterprise PR #71 remains untouched.

## Exit decision

Stage 11B — Shared Calendar and Data Visualisation Foundation is ACCEPTED AND COMPLETE.

The next permitted substage is 11C — Calendar Family Migration:
- Staff Calendar: month + selected day + upcoming context;
- Manager Calendar: month/week + selected day + existing filter/detail/scheduling/Google Calendar truth;
- Administration Calendar: existing chronological 14/30/90-day operating model using the shared V2 calendar language;
- no invented Executive Calendar route.
