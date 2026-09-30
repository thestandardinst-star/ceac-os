# CEAC OS Experience V2 — Stage 10 Family B Work Brief

Date: 27 September 2026
Status: ACTIVE CONTRACT
Stage: 10 — Operational Screen Families
Family: B — People / Team

## Entry condition

Stage 10 Family A — Work is accepted and complete.

Family A final acceptance head:
`09305e679bca08edb08881d90991f1e4b45b25c3`

Acceptance record:
`docs/experience-v2/STAGE10_FAMILY_A_ACCEPTANCE_RECORD.md`

Family B must inherit the accepted Experience V2 system without reopening Family A generically.

## Canonical family scope

The binding Stage 10 sequence defines Family B as:
- Staff Team;
- Manager Team;
- Person workspace;
- Administration People / employee workspace.

Existing route mapping:
- Staff `Team` → `StaffTeam.jsx`;
- Manager `Team` → `Team.jsx`;
- Manager person drill-in → `PersonDetail.jsx`;
- authorised Administration `People` → `People.jsx`.

This family is a presentation/interaction migration over existing people/team authority and data contracts. It is not an HR model rewrite.

## Product character

People/Team must make human context clearer without turning people into scores.

Role character:
- Staff Team: collaboration, availability, leadership context and shared unit references;
- Manager Team: unit command context, factual work/activity evidence, work-lane setup and team coordination;
- Manager Person workspace: current responsibilities, recent outcomes, submissions, objective context, activity context and visible factual feedback;
- Administration People: organisation employee record, employment history, work/activity context, leave context and protected-HR configuration boundaries.

The same factual record can be presented differently by role, but authority must not drift across roles.

## Current-state audit

### Staff Team

Current data/actions include:
- unit membership;
- unit head and sub-team leadership;
- approved leave in the coming week;
- recent joiners;
- people directory within the unit;
- upcoming birthdays;
- authorised unit resources;
- Unit Room entry.

Observed presentation issues:
- legacy intro/summary/tabs compete with expandable sections;
- section anatomy is bespoke and does not yet use the V2 family language;
- phone composition is functional but vertically repetitive;
- people, availability, leadership and resources need clearer priority without adding private personnel detail.

### Manager Team

Current data/actions include:
- unit-scoped membership;
- current non-private work;
- work-session factual context;
- submissions;
- approved leave;
- current presence label;
- recent completed Task/Deliverable count;
- overdue open work excluding waiting work;
- work awaiting manager review;
- pending invitations;
- sub-team setup;
- sub-team rename/reorder/removal with work reassignment protection;
- unit resources;
- Unit Room entry;
- Give out work preselection by sub-team;
- drill-in to the Manager Person workspace.

The screen explicitly states that presence/work facts are not judgments.

Observed presentation issues:
- operational people evidence and secondary setup are visually mixed;
- setup/resources consume similar visual weight to daily people context;
- person rows use legacy geometry and understate the path into the person workspace;
- count links need one coherent evidence language rather than dashboard-like scoring.

### Manager Person workspace

Current scope is unit-scoped and explicitly excludes private work.

Current data/actions include:
- current non-private work;
- work sessions;
- submissions;
- visible feedback;
- sub-team membership;
- objective context and related non-private task work;
- recent completed outcomes;
- review history;
- factual activity context;
- visible factual feedback recorded through `record_performance_feedback`.

The screen explicitly says work sessions are operational context only and do not measure productivity or work quality.

Feedback is visible to the staff member, manager and authorised Administration/HR users; there are no private manager notes.

Observed presentation issues:
- current responsibilities, outcomes, submissions, objectives, activity and feedback read as one long legacy document;
- evidence drill-down is useful but hierarchy is weak;
- the design must resist turning factual counts into a performance scorecard.

### Administration People / employee workspace

Current data/actions include:
- organisation People summary via `admin_people_summary`;
- person detail via `admin_person_detail`;
- employment record/history via `admin_employment_detail`;
- audited employment changes via `admin_update_employment`;
- unit assignment/manager/role/working pattern/status;
- work context;
- session context;
- leave history/balance against configured leave policy;
- protected-HR placeholders/boundaries for payroll, bank/identifier data, contracts/documents and payslips.

Current filters include everyone, active, on leave, no submissions in 14 days and no unit.

Observed presentation issues:
- the employee workspace mixes operational evidence, identity/employment and protected-HR readiness in a dense legacy split layout;
- current metrics need stronger descriptive context so they are not read as ratings;
- employment history/change actions need a clearer administrative hierarchy;
- payroll/protected-HR placeholders must remain truthful and must not imply configured fields or salary rules that CEAC has not confirmed.

## Behaviour and data contract to preserve

### Staff Team

Preserve:
- only unit-authorised people/context;
- approved leave visibility already authorised by the existing RPC;
- birthday visibility already present in the Staff Team surface;
- sub-team leadership;
- unit resources and external links;
- Unit Room navigation;
- no manager-only operational counts;
- no protected employment/HR record.

### Manager Team

Preserve:
- unit scope;
- exclusion of private work;
- factual current-work context;
- factual session/presence context;
- reviewed/completed/overdue/awaiting/submitted counts exactly as currently derived;
- approved leave context;
- invitation path;
- sub-team setup and safe work reassignment before sub-team removal;
- resource create/edit/archive;
- Unit Room and Give out work integrations.

Do not reinterpret current counts as productivity, performance or ranking.

Official role and sub-team membership changes remain Administration/HR responsibilities where the current product says so.

### Manager Person workspace

Preserve:
- unit membership gate;
- private-work exclusion;
- current/recent work and submission drill-ins;
- objective context;
- session context;
- visible feedback only;
- `record_performance_feedback` authority and attribution;
- no hidden/private manager notes;
- no productivity score;
- no pay inference from activity/session data.

### Administration People

Preserve:
- existing capability gate (`people.manage`);
- `admin_people_summary`;
- `admin_person_detail`;
- `admin_employment_detail`;
- `admin_update_employment`;
- effective-date/change-type/reason/correction semantics;
- leave configuration context;
- employment history;
- current protected-HR boundaries;
- payroll blocked until CEAC rules are confirmed.

Do not expose Administration-only employment controls to Staff or Manager.

## Protected trust boundaries

Family B must not:
- expose private work;
- expose protected HR data to Staff/Manager;
- add productivity scores, rankings, performance grades or inferred judgments;
- treat presence/session duration as productivity;
- use absence or submission quietness as a disciplinary conclusion;
- invent salary/payroll fields or policy;
- add private manager notes;
- broaden `people.manage`, manager unit scope, RLS or RPC grants;
- convert birthday/leave context into broader personal data exposure;
- touch frozen PR #71;
- introduce unrestricted direct messaging.

A visual problem is not a reason to add a migration.

## Experience contract

### Shared People/Team language

Use:
- Instrument Sans;
- V2 semantic tokens;
- CEAC Lucide icon registry;
- V2 rows/cards/status/state/field primitives where appropriate;
- 12px minimum operational text;
- 44px practical touch target floor;
- deliberate 1366×768 composition;
- mobile recomposition rather than a squeezed desktop split.

Do not add another global parity/override stylesheet or increase `!important` debt.

### Staff Team hierarchy

Recommended hierarchy, using only current data:
1. unit identity and Unit Room;
2. immediate availability/attention — approved leave and recent joiners when present;
3. leadership;
4. people;
5. birthdays;
6. unit resources.

Sections may collapse where useful, but the page should not feel like a stack of unrelated accordions.

### Manager Team hierarchy

Recommended hierarchy:
1. unit identity and coordination action;
2. people needing operational attention/context;
3. team people list with factual evidence;
4. sub-team/work-lane context;
5. secondary team setup and resources.

Setup is important but should not visually dominate normal daily people work.

### Manager Person workspace hierarchy

Recommended hierarchy:
1. person identity + current unit/role context;
2. current responsibilities;
3. recent outcomes/submissions/review history;
4. objective context;
5. activity/session context with explicit non-productivity language;
6. visible factual feedback.

Counts remain drill-in evidence, not scores.

### Administration employee workspace hierarchy

Recommended hierarchy:
1. person identity/employment state;
2. current employment record;
3. employment change/history;
4. current work/activity context;
5. leave context;
6. protected HR readiness/configuration boundaries.

Administration may be dense, but mobile must become a deliberate sequence rather than a compressed split.

## Family B implementation sequence

### 10B1 — audit and contract
- lock this brief;
- inspect exact-head rendered evidence for Staff Team, Manager Team, Manager Person and Administration People;
- inspect current functional/security coverage;
- identify shared family primitives.

### 10B2 — Staff Team
- migrate Staff Team onto the People/Team family language;
- preserve unit-level collaboration/availability scope;
- prove phone/laptop/desktop.

### 10B3 — Manager Team
- migrate people/evidence rows and secondary setup;
- preserve invitations, sub-team operations, resources and room/work integrations;
- prove no scoring/ranking drift.

### 10B4 — Manager Person workspace
- migrate identity, responsibilities, outcomes, submissions, objective/activity context and visible feedback;
- preserve private-work exclusion and visible-feedback rules.

### 10B5 — Administration People / employee workspace
- migrate People list and employee detail;
- preserve employment-history authority, protected HR boundaries and payroll block;
- prove capability-limited behaviour.

### 10B6 — Family acceptance
- run complete engineering/security gates;
- inspect all role surfaces and required widths/states;
- persist exact-head evidence;
- commit acceptance record;
- update BUILD_STATE.

Do not begin Family C — Projects/Portfolio before Family B is accepted.

## Required verification

Functional/security:
- Staff Team data remains unit-scoped;
- Manager Team excludes private work;
- Manager Person excludes private work;
- Manager factual feedback remains visible/attributable;
- Administration employment changes stay Administration-only and auditable;
- sub-team removal retains/moves attached work safely;
- unit resource authority is unchanged;
- current leave/birthday visibility remains within existing authorised surfaces;
- cumulative RLS/security gates stay green.

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
- error;
- on leave/away;
- new joiner where data exists;
- no unit / inactive where authorised;
- long person/unit/title names;
- setup open/closed;
- employment history present/empty;
- protected-HR unconfigured;
- capability-limited Administration;
- keyboard/touch/focus.

## Family B exit gate

Family B is complete only when:
- Staff Team, Manager Team, Manager Person and Administration People visibly belong to the accepted V2 system;
- existing people/team/HR behaviours remain intact;
- no authority or privacy boundary is broadened;
- no productivity/performance ranking is introduced;
- no high-severity phone/laptop/desktop defect remains;
- exact-head CI, Migration Replay, Account Security, Quality Gate and Vercel pass;
- exact-head People/Team evidence is inspected and persisted;
- acceptance record and BUILD_STATE are current.
