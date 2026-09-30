# CEAC OS Experience V2 — Stage 11D Acceptance Record

Date: 29 September 2026
Stage: 11 — Calendar and Data Visualisation
Substage: 11D — Factual Visualisation Migration
Status: ACCEPTED AND COMPLETE

## Accepted application head

`b1867b91fda28722bd8ae8f3555b6212f3180256`

This exact SHA is the accepted 11D application head.

## Accepted scope

11D preserves the already accepted Executive ministry-movement shared V2 visualisation and migrates Manager Reports supporting analysis away from local one-off visuals into the shared Experience V2 data-visualisation family.

Accepted Manager Reports visuals:
- Completed work trend — factual completed work by date;
- Completed by project — factual completed work grouped by visible project;
- Current work composition — current recorded work-status composition, explicitly contextual and not a performance/productivity/ranking score;
- Recorded work-session activity — unique recorded team-member work-session days by date, explicitly operational context and not an attendance/performance score.

The shared `DataVizChart` contract now preserves:
- chart/table equivalence;
- authoritative drill-down from chart marks;
- authoritative drill-down from table records;
- keyboard activation with Enter/Space where drill-down exists;
- focusable marks and explicit actionable semantics;
- long-series axis-label restraint without dropping factual table values;
- responsive chart composition;
- the existing V2 token, icon and control language.

No optional Finance or Workload visual was added because the existing factual row/card presentation remains clearer and avoids unnecessary aggregation.

## Exact-head Level B

The accepted application SHA passed the complete Level B boundary:

- CI PASS — run `36540064019` (#1385);
- Migration Replay PASS — run `36540066084` (#996);
- Account Security PASS — run `36540064127` (#1168);
- Complete Quality Gate PASS — run `36540064139` (#1194);
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
- artifact ID `11020896046`;
- digest `sha256:6c649a3a989d93331ef6a8a745f880f4a18e0a38af6eebabfdc940aecce3238e`;
- head SHA `b1867b91fda28722bd8ae8f3555b6212f3180256`.

Dedicated Stage 11 artifact:
- `stage11-product-inspection`;
- artifact ID `11020626704`;
- digest `sha256:5d18e625da535cd280733e5f76639014a1fa1a44483b7e9b4800dff89b7942e`.

Direct exact-head screenshot inspection confirmed:
- Manager Reports at 390px keeps the four factual visuals readable inside the phone composition with no page-level horizontal overflow;
- chart/table controls remain visible without crowding the evidence cards and report-authoring flow;
- contextual no-score/no-ranking language remains visible next to status/work-session visuals;
- 1366px retains a deliberate wide composition with traceable charts and restrained density;
- the line/bar/donut language is visually coherent and remains secondary to factual report evidence rather than becoming decorative dashboard chrome.

## Failure recovery note

The first 11D Level A attempt exposed two deterministic test-contract defects:
1. the Stage 11B source assertion still expected inline `tabIndex={0}` after focusability moved into the shared mark-interaction helper;
2. the factual Manager Reports fixture broadly intercepted `unit_memberships`, which replaced the manager authority bootstrap on navigation.

The corrections:
- updated the older source contract to the equivalent shared-helper representation `tabIndex: 0`;
- stopped intercepting the manager's authoritative membership bootstrap;
- did not weaken role, RLS, data, visual or keyboard assertions.

A superseded Level A run was cancelled by repository concurrency after the recovery commits; the exact accepted head then passed CI and the complete Level B boundary.

## Authority and truth preserved

11D introduced no schema, migration, RLS, RPC definition, authentication configuration or capability grant change.

Protected:
- live report evidence remains live until submission;
- frozen submitted report snapshots remain frozen;
- report-evidence references remain traceable;
- chart/table values use the same factual source rows;
- different currencies remain separate;
- no employee/unit performance score, rank, forecast or productivity inference;
- no attendance score;
- no decorative invented chart;
- frozen enterprise PR #71 remains untouched;
- Payroll remains blocked.

## Exit decision

Stage 11D — Factual Visualisation Migration is ACCEPTED AND COMPLETE.

The next permitted substage is 11E — Stage 11 Final Acceptance. It must reconcile the complete Stage 11 exact-head evidence across calendars, Executive ministry movement and Manager Reports, then close Stage 11 before Stage 12 opens.
