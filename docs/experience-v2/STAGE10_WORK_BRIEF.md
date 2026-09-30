# CEAC OS Experience V2 — Stage 10 Work Brief

Date: 27 September 2026
Status: ACTIVE CONTRACT
Stage: 10 — Operational Screen Families
Family: A — Work

## Entry condition

Stage 9 — Keystone Quality Gate and System Ratification is accepted and complete.

Accepted Stage 9 visual implementation:
`b87a0552dd8408f962d8d999494cdefeada773b2`

Post-ratification deterministic test-hardening head:
`7ca495a211e614c31a5fed80d71f527a77dd3390`

The latter changed regression-test determinism only and passed:
- CI;
- Migration Replay;
- Account Security;
- Complete Quality Gate, run `36325853986`;
- Vercel.

Stage 10 must not reopen accepted Stage 5–9 visual direction unless a concrete shared-family defect requires a lower-layer correction.

## Canonical family scope

The binding Stage 10 sequence defines Family A — Work as:
- lists/queues;
- Work Detail;
- assignment;
- review;
- return;
- dependency states.

This family spans the existing role surfaces rather than rebuilding one role at a time:
- Staff Work;
- Manager Work;
- Administration Work;
- Executive Work;
- shared Work Detail;
- Give out work / assignment;
- manager review/return/approval interactions;
- blocker/dependency handling;
- typed-work states and actions.

## Product character

Work is the accountable execution layer of CEAC OS.

The redesign must make the next action and current state obvious without turning work into a scorecard or generic task manager.

Role emphasis:
- Staff: personal execution — Assigned / Agreed / Private, clear status, due context and next action.
- Manager: delegation command centre — Given out / Needs review / Team work / Mine.
- Administration: organisation operations oversight without inventing operational authority.
- Executive: delegation and decision context, not an organisation-wide task-management console.

## Current-state audit

Exact pre-work evidence inspected from Quality Gate run `36325853986`:
- R1 Staff Work artifact `10933758539`;
- R2 Manager Work artifact `10933918142`;
- R3 Administration Work artifact `10934376041`;
- R4 Executive Work artifact `10934465802`;
- full visual inventory artifact `10934405943`.

Observed product issues:
1. Staff Work is functionally rich but visually remains a legacy flat register. The header, mode controls, status filters, action row and grouped list do not yet inherit the accepted V2 hierarchy.
2. Manager Work is usable but visually overweights a full-width primary action and under-differentiates queue urgency, ownership and review state.
3. Administration and Executive Work use sparse generic list geometry that does not yet communicate their different oversight roles.
4. Work Detail remains a legacy mixed working surface rather than a V2 composition.
5. The current Manager "Needs review" list drills into Work Detail, but the approve/return interaction currently lives in Manager Overview. The Work-family path therefore has a review-flow continuity gap. Stage 10 may expose the same existing manager review authority from the Work flow, but must not expand who is authorised to approve/return work.
6. Assignment supports the full CEAC work model but repeats legacy form geometry and context selectors across work kinds.

## Behaviour and data contract to preserve

### Staff Work
Preserve:
- Assigned = unit-visible work with origin `assigned`;
- Agreed = unit-visible self-created work;
- Private = self-created work with private visibility;
- status filters: Active, Waiting, In review, Completed;
- search and sorting;
- grouping by project / unattached work;
- self-created agreed work;
- private work;
- project proposal flow;
- session storage of the chosen Work view;
- deep-link and browser-back behaviour.

Private work must remain invisible to other users.

### Manager Work
Preserve:
- Mine;
- Given out;
- Needs review;
- Team work;
- existing unit scope;
- current-recorded-assigner semantics for Given out;
- the explicit caveat that `assigned_by` is not a complete historical delegation chain;
- Give out work entry.

Do not invent delegation history.

### Administration Work
Preserve:
- Mine;
- Given out;
- Needs review;
- Organisation;
- organisation-scope visibility currently authorised by RLS;
- oversight context without creating new review/write authority.

### Executive Work
Preserve:
- Mine;
- Given out;
- Needs review context;
- Executive delegation/decision emphasis;
- existing Executive read/write authority only.

Do not convert Executive Work into unrestricted operational administration.

### Work Detail
Preserve all existing work kinds:
- task;
- routine;
- case;
- request;
- decision;
- meeting outcome;
- deliverable.

Preserve:
- work identity/ref/status/due context;
- project/sub-team/unit context;
- room trace/discussion entry;
- purpose;
- instructions;
- expected outcome;
- checklist and staff-owned breakdown;
- recipe suggestion from the unit's recorded prior method;
- submission notes/evidence links;
- return comments and checklist points to redo;
- blocker state and acknowledgement/dispute/resolution history;
- routine schedule, occurrences, value recording and pause/resume;
- request state and response history;
- decision record and rationale;
- case resolution;
- deliverable evidence requirement;
- reopen history;
- meeting-source context.

### Assignment
Preserve the seven current intents/kinds and their existing RPC/data paths.

For ordinary task assignment, the approved minimum remains:
- what needs doing;
- why it matters;
- who owns it;
- when it is due.

Method/instructions, expected outcome and checklist remain optional unless the selected work type requires more.

Preserve:
- unit membership assignee choices;
- sub-team/project/objective/phase context;
- assignment warnings for inactive profile, approved leave, closed/out-of-window project and completed objective;
- room-message trace-back;
- meeting-work links;
- unit recipe suggestions;
- voice input as assistive proposal only, requiring human review before save.

### Review / return / dependency
Preserve the existing authority and RPC paths, including:
- `submit_work_for_review`;
- `approve_work_submission`;
- `return_work_for_correction`;
- `reopen_approved_work`;
- `raise_work_blocker`;
- `resolve_blocker`;
- existing request/decision/case/routine RPCs.

Stage 10 may move or reuse presentation around those paths. It must not weaken or broaden database authority.

## Protected trust boundaries

Family A must not:
- add or weaken RLS;
- broaden RPC grants;
- change authentication/session boundaries;
- expose private work;
- expose protected HR data;
- invent work, progress, evidence, scores or delegation history;
- create productivity rankings;
- alter payroll policy;
- touch frozen PR #71;
- introduce unrestricted direct messaging.

A UI problem is not a reason to add a migration.

## Experience contract

### Shared family language
Use the accepted V2 foundation and shared components:
- Instrument Sans;
- semantic V2 tokens;
- CEAC Lucide icon registry only;
- 12px minimum operational text;
- V2 buttons, segmented controls, badges, rows, state panels, overlays and fields where they fit;
- no new global parity/override stylesheet.

Role screens may differ in density and emphasis, but must share the same Work-family anatomy.

### Lists / queues
Every Work list should make these easy to scan:
- title;
- work type/ref;
- owner/context where authorised;
- due context;
- current state;
- next meaningful action or drill-in.

Do not fill space with decorative KPIs.

Empty states should explain what will appear and, where authorised, expose the correct creation action.

### Work Detail hierarchy
The approved hierarchy remains:
1. work identity and status;
2. returned/dependency state if present;
3. why this matters;
4. what finished looks like;
5. instructions/type-specific contract;
6. checklist or type-specific action;
7. submit/resolve/respond/review action;
8. supporting history.

The detail page is a working surface, not a report.

### Assignment
Use progressive disclosure:
- choose intent;
- capture the minimum required work contract;
- then show only context/type-specific fields that matter;
- review warnings before save;
- keep the primary action after the form.

Do not force optional fields merely to make the UI look complete.

### Review
Manager review must be evidence-first and attributable:
- work context;
- expected outcome;
- submission note;
- submitted evidence;
- checklist context;
- explicit Approve or Return for correction;
- return requires a concrete comment;
- selected checklist points may identify what needs redo.

Administration/Executive surfaces must not receive manager review actions unless existing authority already permits them.

### Dependency
Waiting/blocker states must show:
- what is needed;
- from whom/unit;
- current acknowledgement/dispute state;
- whether lateness is paused by the blocker;
- resolution action only to an authorised actor.

## Implementation sequence inside Family A

### 10A1 — Work lists and queues
Rebuild shared list/queue anatomy across Staff, Manager, Administration and Executive while preserving queries/actions.

### 10A2 — Work Detail
Recompose the shared detail surface using V2 hierarchy without changing work-type behaviour.

### 10A3 — Assignment, review, return and dependency
Recompose Give out work and the state-changing review/dependency interactions. Close the Manager Work review-flow continuity gap by exposing the already-authorised review path from the Work family.

### 10A4 — Family acceptance
Run the full acceptance protocol, inspect all four roles, and accept Family A before beginning Family B — People/Team.

No 10B product code may start before 10A acceptance.

## Required verification

Functional:
- existing Staff ↔ Manager review/return/approval journey;
- blocker acknowledgement/resolution journey;
- typed-work creation;
- Staff private-work isolation;
- Staff-owned breakdown;
- room-to-work trace;
- deep-link/browser Back;
- Manager role Work views;
- Administration/Executive Work views.

Security/authority:
- Stage 5 Work Management SQL gate;
- Experience Stage 7 work-capture gate;
- cumulative RLS/security gates;
- no new migration/RLS/RPC changes unless separately justified and approved.

Viewport proof:
- 320;
- 360;
- 375;
- approximately 390×844;
- 414;
- 430;
- representative intermediate/tablet;
- 1366×768;
- 1440×900 or larger.

States:
- loading;
- empty;
- populated;
- returned;
- waiting/dependency;
- in review;
- completed;
- error;
- permission-limited where applicable;
- busy/submitting;
- long title/name/content.

## Family A exit gate

Family A is complete only when:
- Work lists, Work Detail and assignment/review/return/dependency states visibly inherit the accepted V2 system;
- the current work-engine behaviours remain intact;
- no authority boundary is broadened;
- no high-severity phone/laptop/desktop defect remains;
- full exact-head CI, Migration Replay, Account Security, Quality Gate and Vercel pass;
- exact-head Work-family evidence is inspected and persisted;
- an acceptance record is committed;
- BUILD_STATE is current.
