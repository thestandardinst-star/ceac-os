# CEAC OS Experience V2 — Stage 10 Family F Reports Work Brief

Date: 28 September 2026
Stage: 10 — Operational Screen Families
Family: F — Reports
Substage: 10F1 — audit and contract
Status: LOCKED FOR IMPLEMENTATION

## Entry state

Stage 10 Family E — Finance is accepted and complete.

Family F opens after the Family E documentation checkpoint:
`99198071c8d8b7378993526d00d3d71ed883a032`

PR #72 remains OPEN + DRAFT.
PR #71 remains frozen.
Payroll remains blocked pending confirmed CEAC payroll rules.

## Scope

Family F migrates the existing reporting surfaces into one Experience V2 reporting family without changing the established report domain, authority or evidence model.

Covered:
- Manager Reports;
- Administration Reports;
- Executive Reports;
- reporting period identity and status;
- reporting coverage and outstanding-unit context;
- Manager unit/project report drafting and submission;
- frozen submitted-report evidence;
- correction/version history;
- traceable evidence references;
- existing recurring Ministry Numbers context where already embedded in Manager reporting.

Not in Family F:
- a new Staff Reports destination;
- person-scope reports;
- report confirmation/sign-off;
- predictive reporting;
- performance scoring or rankings;
- invented ministry/people/productivity scores;
- new report-domain schema/RLS/RPC/auth/capability work unless a separately proven defect requires it;
- new chart capability beyond the existing factual presentation. Stage 11 owns dedicated data-visualisation refinement.

## Canonical authority to preserve

### Reporting periods

`report_periods`:
- all authenticated users in the organisation may read reporting periods;
- Administration owns period create/open/close/reopen authority;
- Manager and Executive must not receive period-configuration controls.

### Manager reporting

Managers may author only reports inside their existing managed-unit/project authority.

Preserve:
- `save_report_draft` accepts only `unit` or `project` scope;
- the unit must be managed by the caller unless Administration is acting;
- project scope additionally requires an existing visible project;
- a reporting period must exist and be open;
- only one draft exists per report identity/version context;
- report data remains managed-unit scoped through RLS.

The Manager UI may preview current live evidence before an exact matching period exists, but save/submit remains blocked until Administration opens the applicable period.

### Submitted reports are final

CEAC has explicitly decided there is no report sign-off workflow.

Preserve:
- `confirm_report` is removed and must not be reintroduced;
- submitted is final for that version;
- direct non-draft update/delete is unavailable;
- no Manager, Administration or Executive screen should imply a required confirmation step.

### Corrections create new versions

`correct_report`:
- only a submitted/final report may be corrected;
- a correction requires an attributable reason;
- correction creates a new draft version;
- the prior submitted version remains unchanged;
- `supersedes_report_id` and `correction_reason` remain visible/traceable where relevant.

Do not visually rewrite history into one mutable report.

### Frozen evidence and traceability

Submission freezes the evidence snapshot carried by the report.

Preserve:
- submitted counts remain the counts at submission time even if underlying work changes later;
- every non-zero claimed evidence count must match real `report_evidence_refs` rows for that section;
- evidence references remain drillable/traceable to the underlying object;
- no unsupported number may be created merely to complete a report presentation.

### Administration reporting

Administration owns:
- period creation/open/close/reopen;
- organisation reporting coverage;
- identification of filed, draft and not-yet-filed units by name;
- reading organisation-visible unit narratives/challenges.

Do not hide outstanding units behind a bare percentage. Coverage may be shown, but named follow-up remains primary operational evidence.

Person-scope reports remain deliberately unbuilt; employee records remain in People.

### Executive reporting

Executive Reports is read-only leadership context.

Preserve:
- Executive can read organisation reporting context through established RLS;
- Executive receives no reporting-period write control;
- Executive receives no draft/save/submit/correct mutation controls;
- the view should show factual coverage and named outstanding units without inventing judgement, scoring or performance ranking.

## Data integrity rules

Do not:
- infer a report where none exists;
- count a draft as filed/submitted;
- silently convert missing report state into zero achievement;
- use current live data to rewrite a submitted frozen report;
- create a percentage that masquerades as staff/unit performance;
- rank units based on reporting completeness or work counts;
- treat recorded work-session days as an attendance/productivity score;
- expose private work in report evidence.

The underlying report model contains no agreed overall score/rating and Family F must keep it that way.

## Existing surfaces and design audit

### Manager Reports

Strengths:
- week/month/project modes;
- evidence is built from real work, submissions, work sessions, objectives and visible projects;
- live preview versus frozen submitted evidence is already distinguished;
- report evidence references are traceable;
- corrections preserve history;
- submitted versions keep their original figures;
- recurring Ministry Numbers already sits in this workspace.

Observed issues:
- legacy `.metric`, `.card`, `.row`, ad-hoc tabs/selects and hand-built charts make the hierarchy fragmented;
- evidence metrics and writing/submission controls are not composed as one report workspace;
- current Trend/Bars/ActivityHeat geometry belongs in later Stage 11 refinement rather than being expanded now;
- mobile density/touch-target behaviour needs explicit Family F proof.

Recommended Manager hierarchy:
1. unit reporting identity;
2. period/scope selector;
3. current/frozen report status;
4. core factual evidence counts with traceability;
5. narrative/challenges authoring when editable;
6. submit/save/correction actions;
7. supporting factual analysis;
8. version/evidence history;
9. recurring Ministry Numbers context remains available without becoming a report score.

### Administration Reports

Strengths:
- factual period operations;
- visible filed/draft/missing unit coverage;
- names outstanding units rather than hiding them;
- narratives/challenges remain inspectable.

Observed issues:
- legacy cards/stats/chart patterns compete with the operational action hierarchy;
- period creation and period coverage need a clearer console hierarchy;
- loading/error/empty states are not yet one V2 family;
- the current donut belongs to Stage 11 refinement and must not drive Family F design.

Recommended Administration hierarchy:
1. organisation Reports identity;
2. primary period action;
3. open-period/configuration state;
4. period list and factual coverage;
5. selected period: submitted units;
6. selected period: named outstanding/draft units;
7. narratives/challenges;
8. explicit period status/change controls.

### Executive Reports

Strengths:
- read-only;
- latest-period coverage;
- named unit filing status;
- clear statement that Administration controls configuration.

Observed issues:
- legacy premium Executive geometry;
- sparse leadership composition;
- loading/error/no-period states are not yet shared V2 reporting states.

Recommended Executive hierarchy:
1. leadership Reports identity;
2. latest recorded period;
3. factual filed/outstanding context;
4. named unit status list;
5. provenance/truth footnote.

## Experience V2 presentation contract

Use:
- Instrument Sans and V2 semantic tokens;
- one shared reporting family under `src/experience-v2/reporting-family/`;
- V2 status/state/button/row/surface patterns;
- at least 12px operational text;
- practical 44px controls;
- 320–430 phone recomposition;
- deliberate 900/1366/1440 composition;
- traceable evidence labels;
- factual counts before decorative visualisation.

Do not:
- add a global override stylesheet;
- increase `!important` debt;
- shrink text to solve density;
- expand chart vocabulary before Stage 11;
- add scores, rankings, predictions or report “health” labels;
- create a new report workflow or Staff Reports route;
- touch payroll;
- touch frozen PR #71.

## Family F implementation sequence

### 10F1 — audit and contract
- lock this brief;
- confirm existing report schema/RLS/RPC/version/evidence contracts;
- inspect Manager, Administration and Executive surfaces;
- identify shared reporting-family primitives;
- no product-code migration before this contract is persisted and exact-head green.

### 10F2 — Manager Reports
- establish the shared V2 reporting-family presentation layer;
- migrate Manager unit/project reporting first;
- preserve live preview versus frozen submitted evidence;
- preserve save/submit/correction/version behaviour;
- preserve evidence-reference drill-down;
- preserve existing recurring Ministry Numbers context;
- do not expand chart capability before Stage 11;
- prove full viewport matrix.

### 10F3 — Administration Reports
- migrate period operations and organisation coverage;
- keep period action/configuration ahead of coverage context;
- preserve filed/draft/missing unit truth by name;
- preserve existing period create/open/close/reopen authority;
- preserve report read scope and narratives/challenges;
- prove full viewport matrix.

### 10F4 — Executive Reports
- migrate read-only leadership reporting;
- preserve latest-period factual context and named unit status;
- expose no period/report mutation authority;
- prove full viewport matrix.

### 10F5 — Family F final acceptance
- run complete Level B engineering/security gate;
- verify report RLS/RPC/version/evidence contracts;
- verify Manager authoring/correction remains scoped and immutable after submission;
- verify Administration period authority;
- verify Executive read-only boundary;
- inspect Manager/Admin/Executive evidence at all required widths;
- persist final family evidence;
- create Family F acceptance record;
- update BUILD_STATE.

Do not begin Family G before Family F is accepted.

## Required verification

Functional/security:
- report periods remain Administration-write only;
- Manager can read/write only managed unit/project reports;
- Manager cannot create person/office/leadership report scope through the report RPC;
- submitted report is immutable/final;
- correction creates a new attributable draft version;
- frozen evidence is not rewritten by later activity;
- non-zero evidence counts require matching evidence references;
- Executive cannot mutate report periods or reports;
- anonymous users cannot execute report definer RPCs;
- no schema/RLS/RPC/auth/capability change unless separately justified.

Viewport/product:
- 320×844;
- 360×800;
- 375×812;
- approximately 390×844;
- 414×896;
- 430×932;
- 900×900;
- 1366×768;
- 1440×900.

At each applicable role state verify:
- no page-level horizontal overflow;
- at least 12px operational text;
- practical 44px targets;
- no clipped period/report/evidence controls;
- long report labels/narratives do not break layout;
- empty/no-period/error states remain truthful;
- live preview cannot be mistaken for a submitted frozen report;
- coverage cannot be mistaken for performance.
