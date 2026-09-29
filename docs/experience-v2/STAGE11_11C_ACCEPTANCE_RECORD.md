# CEAC OS Experience V2 — Stage 11C Acceptance Record

Date: 29 September 2026
Stage: 11 — Calendar and Data Visualisation
Substage: 11C — Calendar Family Migration
Status: ACCEPTED AND COMPLETE

## Accepted application head

`5cfc6997b4f161be6165e450c04a9dda514ec27b`

This exact SHA is the accepted 11C application head.

## Accepted scope

11C migrated the existing role calendars into the shared Experience V2 calendar family while preserving the canonical data and authority boundaries.

Staff Calendar:
- retains the month view;
- adds deliberate selected-date context;
- retains upcoming context;
- preserves own work, meeting, ministry and approved-leave queries;
- work and meetings continue to open their authoritative records;
- leave and ministry remain factual schedule context rather than invented actions.

Manager Calendar:
- retains month/week modes;
- adds selected-date context;
- preserves the existing layer filter;
- preserves project/work/meeting/leave/ministry drill-down;
- preserves meeting scheduling;
- preserves the explicit Google Calendar truth that automatic personal sync is not connected and manual links are available;
- introduces no new calendar authority.

Administration Calendar:
- retains the existing chronological 14/30/90-day operating model;
- uses shared V2 hierarchy and timeline treatment rather than inventing month/week/day modes;
- preserves meeting scheduling and factual organisation context;
- explicitly disambiguates the existing leave-to-profile relationship through `leave_requests_profile_id_fkey`, matching the already established Manager relationship contract.

No Executive Calendar route was introduced.

## Exact-head Level B

The accepted application SHA passed the complete Level B boundary:

- CI PASS — run `36533302019` (#1375);
- Migration Replay PASS — run `36533302155` (#986);
- Account Security PASS — run `36533302067` (#1158);
- Complete Quality Gate PASS — run `36533302125` (#1184);
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
- artifact ID `11017594419`;
- digest `sha256:6ea92d4d9296b9af0818e695a615bad5e3f0005efd06d1045c20dfa4b39c3432`;
- head SHA `5cfc6997b4f161be6165e450c04a9dda514ec27b`.

Dedicated Stage 11 artifact:
- `stage11-product-inspection`;
- artifact ID `11017992930`;
- digest `sha256:4da40423de28282e5475391bef2f71634c635affff26f7bb736d18373ef22c91`.

Direct exact-head screenshot inspection confirmed:
- Staff Calendar at 320px and 1366px preserves a usable month/select-date/upcoming composition without page-level horizontal overflow;
- Manager Calendar at 390px and 1366px preserves schedule action, Google Calendar truth, month/week controls, filter access, selected-date context and readable month geometry;
- Administration Calendar at 320px, 390px and 1366px remains a chronological range/timeline surface, not an invented grid calendar;
- the Administration range selector is intentionally horizontally scrollable at the narrowest phone widths rather than forcing clipped page overflow;
- empty calendar states remain explicit and factual rather than implying missing records exist.

The required 320/360/375/390/414/430/900/1366/1440 responsive matrix passed for Staff, Manager and Administration calendars.

## Recovery and correctness note

The 11C acceptance suite was strengthened to fail if the Administration Calendar reports a load error. That deterministic guard exposed an ambiguous PostgREST relationship for `leave_requests -> profiles`. The accepted head fixes the query at the data-selection layer by naming the existing `leave_requests_profile_id_fkey` relationship.

The correction:
- did not add a migration;
- did not change schema;
- did not widen RLS;
- did not change RPC authority;
- did not weaken acceptance assertions;
- preserved the existing approved-leave visibility contract.

## Authority and truth preserved

11C introduced no schema, migration, RLS, RPC definition, authentication configuration or capability grant change.

Protected:
- no fabricated calendar events;
- no unsupported view modes;
- no Executive Calendar route;
- no new schedule authority;
- no Google Calendar sync claim;
- no attendance, productivity or performance inference;
- no changes to frozen enterprise PR #71;
- Payroll remains blocked.

## Exit decision

Stage 11C — Calendar Family Migration is ACCEPTED AND COMPLETE.

The next permitted substage is 11D — Factual Visualisation Migration:
1. preserve the already migrated Executive ministry movement;
2. migrate Manager Reports supporting analysis to the shared V2 factual chart language;
3. add no optional Finance/Workload visual unless it demonstrably improves comprehension without weakening row traceability.
