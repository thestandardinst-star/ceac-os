# CEAC OS Experience V2 — Stage 11 Work Brief

Date: 28 September 2026
Status: ACTIVE CONTRACT
Stage: 11 — Calendar and Data Visualisation
Substage: 11A — Audit and contract

## 1. Entry condition

Stage 10 — Operational Screen Families is accepted and complete.

Exact accepted Stage 10 application code:
`910878c2298713c1fa75aba909d43deda2341c87`

Stage 10 Family G and Family H were formally reconciled after that exact application head passed:
- CI;
- clean Migration Replay;
- Account Security;
- complete Level B Quality Gate #1154;
- all four isolated browser shards;
- SQL/RLS/authority contracts;
- merged exact-head product evidence;
- Vercel.

Stage 11 must preserve the accepted Stage 1–10 product, security, data, authority and visual contracts.

## 2. Binding Stage 11 purpose

Stage 11 raises calendar and factual data visualisation to the Experience V2 quality bar.

Binding scope from `IMPLEMENTATION_SEQUENCE.md`:

Calendar:
- month/week/day behaviour only where underlying CEAC data and current role workflow support it;
- selected-date state;
- schedule detail;
- event/meeting relationship;
- responsive layout;
- keyboard and touch states;
- restrained transitions required to clarify selection and period changes.

Charts/data:
- one coherent CEAC chart language;
- useful tooltip/focus states;
- chart/table parity where required;
- finance/workload/reporting visualisations where a visual comparison is genuinely faster than reading rows;
- no decorative data;
- no invented trends, projections, scores or inferred performance.

Stage 12 remains responsible for richer motion and interaction polish after Stage 11 geometry and data behaviour are stable.

## 3. Product and authority rules

Stage 11 is presentation and interaction work over existing authoritative records.

It must not:
- add or weaken RLS;
- broaden RPC grants;
- change authentication/session boundaries;
- invent calendar events;
- create unsupported day/week/month views merely for visual completeness;
- infer attendance, effort, productivity, competence or performance from calendar/workload data;
- combine different currencies into one chart or total;
- convert reporting completeness into performance;
- add charts where rows answer the question more clearly;
- remove row-level drill-down behind authoritative figures;
- unfreeze enterprise PR #71;
- start Payroll or another enterprise expansion stage.

A calendar or chart UI issue is not a reason to add a schema migration.

## 4. Current calendar audit

### 4.1 Staff Calendar

Implementation:
- `src/screens/StaffCalendar.jsx`.

Current authoritative inputs:
- own non-private `work_items` with due dates;
- visible `meeting_sessions`;
- visible `ministry_events`;
- own approved `leave_requests`.

Current behaviour:
- month grid only;
- All / Meetings / Work / Ministry / Leave filters;
- upcoming list;
- Work and Meeting entries drill into their existing records;
- leave/ministry entries are factual but currently render as non-actionable disabled event controls;
- no selected-date state;
- no dedicated day detail;
- legacy button/icon/calendar geometry.

Stage 11 rule:
- keep the month view because it is already supported;
- add selected-date context and deliberate day agenda/detail without inventing records;
- preserve existing Work/Meeting drill-in authority;
- show leave/ministry facts as factual context rather than pretending they are actionable records when no authorised destination exists.

### 4.2 Manager Calendar

Implementation:
- `src/screens/ManagerCalendar.jsx`.

Current authoritative inputs:
- managed/participating projects;
- unit work deadlines;
- approved leave for managed-unit members;
- visible ministry events and `ministry_event_units`;
- visible `meeting_sessions`.

Current behaviour:
- month and week views;
- layer filter;
- meeting scheduling through the existing handler;
- Project, Work and Meeting drill-ins;
- factual leave and ministry detail in Sheets;
- manual Google Calendar entry points;
- explicit truth that automatic personal Google sync is not connected because CEAC OS does not currently hold that authorisation;
- no selected-date state;
- legacy period/filter/icon treatment.

Stage 11 rule:
- preserve month/week only;
- preserve the existing Google Calendar truth and links;
- preserve schedule-meeting authority;
- add selected-date context, clearer event/detail relationship and V2 control language;
- no provider or integration authority change.

### 4.3 Administration Calendar

Implementation:
- `src/screens/AdminCalendar.jsx`.

Current authoritative inputs:
- organisation-visible meetings;
- projects;
- ministry events;
- approved leave.

Current behaviour:
- chronological operating timeline rather than month grid;
- 14 / 30 / 90-day range;
- meeting drill-in;
- meeting scheduling through the existing organisation handler.

Stage 11 rule:
- keep the timeline/range model because it matches the existing Administration use case and data contract;
- do not invent month/week/day calendar modes solely for parity;
- bring it into the shared V2 calendar-family hierarchy, controls, date grouping and responsive behaviour.

### 4.4 Executive calendar boundary

There is no dedicated Executive Calendar route.

Executive currently receives upcoming meeting/schedule context from the accepted Executive Overview.

Stage 11 must not invent a new Executive Calendar destination. Executive meeting/schedule presentation may receive only shared calendar/data visual refinements needed for consistency.

## 5. Current data-visualisation audit

### 5.1 Legacy Chart primitive

Implementation:
- `src/components/primitives/Chart.jsx`.

Useful contracts already present:
- inline SVG;
- four chart kinds only: line, bar, paired bar, donut;
- mandatory chart/table toggle;
- accessible SVG label;
- row/table equivalent;
- no charting-library dependency.

Presentation debt:
- legacy `Icon`;
- legacy colour tokens;
- legacy control/table language;
- limited keyboard/focus semantics;
- no Experience V2 data-visualisation family.

Stage 11 should preserve the useful API principles while moving new/accepted visualisation work onto a dedicated Experience V2 implementation.

### 5.2 Executive ministry movement

Implementation:
- `src/experience-v2/executive-overview/ExecutiveOverviewV2.jsx`;
- source data prepared in `src/screens/ExecutiveHome.jsx`.

Current state:
- a local hand-written `MiniTrend` SVG renders actual ministry-operation occurrence values;
- arithmetic movement is explicitly not a performance judgement;
- the visual has no shared V2 chart/table implementation.

Stage 11 rule:
- replace the one-off chart implementation with the shared V2 data-visualisation contract;
- retain factual values, wording and no-performance-inference boundary;
- retain accessible equivalent values/table access.

### 5.3 Reports

Family F deliberately deferred dedicated visualisation refinement to Stage 11.

Manager Reports currently contains local factual supporting-analysis views:
- completed-work trend;
- completed-by-project bars;
- current work-status distribution;
- recorded work-session activity heat view.

Every supporting visual remains secondary to the report evidence and must keep drill-down to the actual rows/evidence.

Administration and Executive Reports use factual coverage/named filing states. A chart is not required when the named rows communicate the question better.

### 5.4 Finance

Accepted Family E rules remain binding:
- currencies are separate;
- no currency conversion;
- no bank-balance claim;
- append-only/reversal truth remains visible;
- no forecast, score, estimate or unsupported KPI.

Stage 11 may add a visual only where comparison within a single currency is clearer than existing rows/cards and remains drillable to authoritative records.

### 5.5 Workload

`src/screens/ResourceWorkload.jsx` already exposes factual components and row-level drill-down:
- recorded planning capacity;
- due work and estimates;
- missing estimates;
- recurring responsibilities;
- explicit project commitments;
- approved leave-request days.

Stage 11 must not collapse these components into utilisation, productivity or performance scores. A workload visual is optional and must be factual, component-level and drillable if added.

## 6. Shared Experience V2 contracts to preserve

Use:
- Instrument Sans and semantic V2 tokens;
- Lucide-backed `CeacIcon` registry;
- V2 Buttons/segmented controls/state/data primitives;
- 12px minimum operational text;
- responsive phone-first recomposition;
- page-level zero-horizontal-overflow;
- chart/table equivalence where a chart exists;
- focus-visible and keyboard behaviour;
- reduced-motion support.

Do not:
- introduce another global parity stylesheet;
- increase `!important` debt;
- create another icon family;
- use emoji or Unicode arrows/carets/checkmarks as operational icons where a V2 icon exists;
- add a chart library with its own visual system.

## 7. Stage 11 implementation sequence

### 11A — Audit and contract

This document.

Exit:
- calendar role/data boundaries mapped;
- data-visualisation consumers mapped;
- exact implementation sequence persisted;
- no product code changed.

### 11B — Shared Calendar and Data Visualisation foundation

Build isolated Experience V2 primitives under:
- `src/experience-v2/calendar/`;
- `src/experience-v2/data-viz/`.

Calendar-family foundation should provide:
- V2 page/header/period controls;
- selected-date treatment;
- calendar grid/date-cell/event treatment;
- agenda/detail relationship;
- responsive selected-day presentation;
- accessible event/date button semantics.

Data-visualisation foundation should provide:
- line;
- bar;
- paired bar;
- donut only where composition is appropriate;
- mandatory chart/table toggle for every chart;
- accessible values and keyboard/focus handling;
- consistent legends/tooltips/labels;
- V2 tokens/icons/controls only.

11B may migrate the local Executive `MiniTrend` to prove the shared primitive with real data, but must not change Executive data queries or authority.

Acceptance:
- component/source contracts;
- responsive proof;
- exact-head Level B before 11C.

### 11C — Calendar family migration

Migrate:
- Staff Calendar;
- Manager Calendar;
- Administration Calendar.

Preserve every current query/action and role boundary.

Staff:
- month + selected day + upcoming context.

Manager:
- month/week + selected day + existing filter/detail/schedule/Google Calendar truth.

Administration:
- existing chronological 14/30/90-day model using shared V2 family language; no invented month/week mode.

Required responsive matrix:
- 320×844;
- 360×800;
- 375×812;
- approximately 390×844;
- 414×896;
- 430×932;
- 900×900;
- 1366×768;
- 1440×900.

Acceptance:
- interaction and route tests;
- keyboard/touch/overflow coverage;
- exact-head Level B before 11D.

### 11D — Factual visualisation migration

Prioritise existing factual visuals before inventing new ones:
1. Executive ministry movement;
2. Manager Reports supporting analysis;
3. any Finance/Workload/Reporting comparison where the visual demonstrably improves comprehension without weakening row traceability.

Rules:
- no decorative chart requirement;
- named rows remain when they are clearer;
- chart/table equivalence remains mandatory;
- authoritative figures remain drillable;
- different currencies remain separate;
- no employee/unit score/rank/performance inference.

Acceptance:
- chart/table and drill-down tests;
- focus/keyboard/responsive tests;
- exact-head Level B before final Stage 11 acceptance.

### 11E — Stage 11 final acceptance

Run complete Level B on the exact application head.

Inspect exact-head evidence across:
- Staff Calendar;
- Manager Calendar;
- Administration Calendar;
- Executive ministry movement;
- Manager Reports supporting visuals;
- any additional accepted Finance/Workload visualisation introduced in 11D.

Record:
- exact application SHA;
- CI;
- Migration Replay;
- Account Security;
- complete Quality Gate;
- Vercel;
- artifact IDs/digests;
- direct phone/laptop/desktop product inspection.

Only then open Stage 12 — Motion and Interaction Quality.

## 8. Verification protocol

`docs/experience-v2/VERIFICATION_PROTOCOL.md` is binding.

- implementation commits use Level A affected-scope verification;
- final application commit for each acceptance boundary uses `[level-b]`;
- every substage acceptance requires complete Level B and exact-head product evidence;
- documentation-only acceptance checkpoints may use the integrity fast path only after the cited application SHA passed Level B;
- while Level B runs, the sole writer may prepare the next substage read-only but must not commit it before the current acceptance boundary is complete.

No retries, timeout inflation, assertion deletion or security weakening may be used to manufacture a pass.

## 9. Stage 11 exit definition

Stage 11 is complete only when:
- the three existing role calendars feel native to V2;
- selected-date/detail relationships are deliberate where supported;
- Manager month/week and Administration timeline contracts remain truthful;
- shared V2 chart language replaces Stage 11-targeted one-off/legacy visuals;
- every chart has a table/equivalent factual view;
- authoritative values remain traceable;
- responsive matrices pass;
- keyboard/touch/focus behaviour passes;
- no invented data, score, ranking or currency conversion appears;
- exact-head Level B and Vercel pass;
- direct product inspection passes;
- acceptance record and BUILD_STATE are current.
