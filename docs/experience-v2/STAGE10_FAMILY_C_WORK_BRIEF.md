# CEAC OS Experience V2 — Stage 10 Family C Work Brief

Date: 27 September 2026
Status: ACTIVE CONTRACT
Stage: 10 — Operational Screen Families
Family: C — Projects / Portfolio

## Entry condition

Stage 10 Family B — People / Team is accepted and complete.

Accepted Family B runtime head:
`2efd54803789ed0d8f92bb700c034149debc5e88`.

Family B acceptance record:
`docs/experience-v2/STAGE10_FAMILY_B_ACCEPTANCE_RECORD.md`.

Current documentation-only branch head at Family C entry:
`442abd8b69e7e97c52e58f12382695c47eff87c0`.

On this documentation head:
- CI PASS;
- Migration Replay PASS;
- Account Security PASS;
- complete Quality Gate PASS;
- Vercel is blocked only by the connected free-project deployment-rate limit.

The Family B accepted runtime itself already passed exact-head Vercel. Family C may begin audit/contract from the documentation head, but Family C acceptance still requires an exact-head Vercel PASS.

PR #72 remains OPEN + DRAFT.
PR #71 remains frozen.
Chat is the sole active writer.
Stage 13 Payroll remains blocked pending confirmed CEAC payroll rules.

## Canonical family scope

The binding Experience V2 sequence defines Family C as:
- Manager Projects;
- Administration Projects;
- Executive Portfolio;
- project detail/workspace.

Current route mapping:
- Manager `Projects` → `ManagerProjects.jsx`;
- Administration `Projects` → `AdminProjects.jsx`;
- Executive `Portfolio` → `Delivery.jsx`;
- Manager project drill-in/workspace → `ManagerProjects.jsx` with `initialProjectId`;
- project close/history → `ManagerProjectClose.jsx`;
- project participant/payment/custody register → `ProjectParticipantRegister.jsx`.

Family C is a presentation/interaction migration over the existing project and delivery domain. It is not a project-data rewrite.

## Product character

Projects should make purpose, ownership, movement, evidence and coordination clear without inventing project scores.

Role character:
- Manager Projects: operating workspace for projects in the manager’s current unit, including purpose, objectives, work, participating units, cost context, collaboration and close-out;
- Administration Projects: organisation-wide delivery context and objective movement, without replacing unit execution;
- Executive Portfolio: ministry-level portfolio/programme view with explicitly recorded health, milestones, dependencies, risks and issues;
- project workspace: one traceable place for overview, execution, objectives, register, collaboration and close/record.

Explicit health/status data may be displayed when it is stored. CEAC OS must not derive a hidden composite project score.

## Current-state audit

### Manager Projects

Current data/actions include:
- project proposals for the current unit;
- approval/rejection through `decide_project_proposal`;
- projects where the unit is lead or participating;
- project creation through `create_project_with_participants`;
- project participants and project-unit roles;
- operational phases;
- objectives;
- non-private project work;
- objective-linked work;
- unit-specific budget and spend context;
- Project Room;
- project meetings;
- participant/payment/custody register;
- close/reopen and close history.

Current authority rules include:
- project detail is rejected when the current unit is neither lead nor participant;
- project management is lead-unit scoped;
- objective management follows current participating/lead-unit rules;
- private work is excluded;
- unit cost is read-only in this workspace;
- project close/reopen is controlled by existing project authority and stored close history.

Observed presentation issues:
- list and workspace still use legacy page/header/card geometry;
- overview, work, objectives, register, collaboration and close feel like separate legacy modules rather than one project workspace;
- project status/purpose/ownership and next operational context need stronger hierarchy;
- project cost, objective state and work counts need descriptive context so they are not read as scores;
- workspace navigation must recompose deliberately on phones instead of becoming a dense horizontal strip.

### Administration Projects

Current data includes:
- organisation-wide projects;
- project status;
- lead unit;
- participating units;
- objective-status distribution;
- project purpose;
- project dates;
- project meeting scheduling.

The current surface is intentionally not the detailed unit execution workspace.

Observed presentation issues:
- organisation delivery is presented as a legacy card grid;
- project identity, lead/participants, dates and objective movement compete at similar visual weight;
- the page needs one clear organisation-project scan pattern while preserving its read/context nature;
- Administration should not silently inherit Manager project-edit controls.

### Executive Portfolio / Delivery

Current data/actions include:
- projects;
- programmes and portfolios;
- programme/portfolio-project links;
- explicit project priority and health;
- milestones;
- project dependencies;
- milestone dependencies;
- work dependencies;
- risk/issue register;
- project participant register;
- owners/sponsors;
- delivery groups and links.

Authority is determined by existing role/capability and managed-unit scope:
- organisation management for Administration/Executive or `delivery.manage`;
- selected-project management also follows current managed-unit lead-unit rules.

Current acceptance already proves:
- programme/portfolio creation;
- explicit project health/priority updates;
- project-to-programme linking;
- milestone creation/revision;
- risk recording;
- project/milestone/work dependency recording;
- persistence after reload;
- no hidden scoring.

Observed presentation issues:
- the Executive route exposes a very dense legacy Delivery management page;
- portfolio structure, project selection, milestones, risks/dependencies and edit forms compete on one long surface;
- executive briefing and management configuration are insufficiently separated;
- repeated row/card patterns do not yet use the ratified V2 family language;
- the surface needs to remain truthful about explicit health rather than converting health/risk counts into a synthetic score.

### Project close and project register

Existing close/record behaviour includes:
- unit returns;
- objective outcomes and notes;
- deliverable evidence/detail;
- cost snapshot;
- challenge and next-time learning;
- formal overall close;
- reopen with reason;
- immutable prior close versions.

Existing project register behaviour includes:
- participants;
- append-only payments/reversals;
- custody events;
- slot inventory/allocation/release;
- two-sided remittance confirmation through the finance record.

These behaviours are mature domain logic. Family C must improve presentation without weakening their auditability.

## Behaviour and authority contract to preserve

### Manager Projects

Preserve:
- unit-scoped visibility;
- lead/participating-unit logic;
- private-work exclusion;
- proposal approval path;
- project creation path;
- objective creation/edit path;
- project work hand-off to the existing Work flow;
- project room and meeting integrations;
- participant register authority;
- unit-specific cost context;
- close/reopen history and auditability.

Do not broaden project management merely because a project is visible.

### Administration Projects

Preserve:
- organisation project visibility already authorised by current data/RLS;
- objective-status context;
- lead/participating unit context;
- meeting scheduling;
- read/context character unless an existing Administration capability explicitly permits another action.

Do not add Manager-only project objective/work controls here.

### Executive Portfolio / Delivery

Preserve:
- existing `delivery.manage` / role / managed-unit rules;
- explicit priority and health;
- programme/portfolio hierarchy;
- milestone lifecycle;
- risk/issue register;
- project/milestone/work dependencies;
- sponsor/owner metadata;
- participant register authority;
- all existing reason/change-context fields.

Do not:
- derive hidden health;
- invent project risk probability;
- rank projects;
- convert milestone/risk counts into a composite score.

### Project close/register

Preserve:
- append-only/reversible financial evidence;
- two-sided remittance confirmation;
- project/unit scope;
- close versions;
- reopen reason;
- objective outcomes;
- factual cost snapshots;
- previous close records unchanged.

## Protected trust boundaries

Family C must not:
- expose private work;
- broaden project visibility or management scope;
- bypass existing RLS/RPC/domain checks;
- turn project health/risk into generated scoring/ranking;
- treat missing objective/result data as zero;
- treat unfiled unit returns as zero;
- invent budgets, spend or cost completeness;
- invent delegation/ownership history;
- weaken append-only/reversal semantics in the project register;
- weaken two-sided transfer/remittance confirmation;
- overwrite historical project close records;
- add a schema/migration merely to solve presentation;
- touch frozen PR #71.

## Experience contract

Use:
- Instrument Sans;
- Experience V2 semantic tokens;
- CEAC semantic Lucide registry;
- shared V2 page/row/status/state/field patterns;
- 12px minimum operational text;
- 44px practical touch target floor;
- deliberate 1366×768 density;
- mobile recomposition rather than compressed desktop grids;
- explicit descriptive labels around counts and state.

Do not:
- add another global parity/override stylesheet;
- increase `!important` debt;
- create another icon language;
- solve narrow layouts with tiny text;
- add decorative charts or invented progress.

### Manager Projects hierarchy

Recommended hierarchy, using current data:
1. unit/project identity and project state;
2. current project list/proposals requiring action;
3. project purpose, lead/participating units and time context;
4. objectives and project work;
5. participant/register context where used;
6. collaboration;
7. cost context;
8. close/record.

The detail workspace should feel like one coherent working surface with clear sub-navigation.

### Administration Projects hierarchy

Recommended hierarchy:
1. organisation delivery identity;
2. factual project summary;
3. project rows/cards prioritising project name + state + lead unit;
4. objective movement and participating units;
5. schedule-project-meeting action as secondary context.

### Executive Portfolio hierarchy

Recommended hierarchy:
1. portfolio/programme briefing;
2. projects requiring attention from explicit health/risk state;
3. portfolio/programme structure;
4. selected project milestones and risks/issues;
5. dependencies;
6. management metadata and configuration.

Executive first view should read as leadership context before exposing configuration controls.

## Family C implementation sequence

### 10C1 — audit and contract
- lock this brief;
- inspect exact-head Manager Projects, Administration Projects, Executive Portfolio and project workspace source/evidence;
- inspect project close/register authority paths and existing acceptance;
- identify shared Projects/Portfolio family primitives;
- no product-code migration before this contract is persisted.

### 10C2 — Manager Projects + project workspace
- migrate project list/proposals and project workspace shell;
- preserve project creation/proposal/objective/work/collaboration/close behaviour;
- keep project register and close logic intact while integrating them into the V2 workspace hierarchy;
- prove phone/laptop/desktop.

### 10C3 — Administration Projects
- migrate organisation project scan surface;
- preserve read/context authority and meeting scheduling;
- prove no Manager edit-authority leakage.

### 10C4 — Executive Portfolio / Delivery
- migrate portfolio briefing, portfolio structure, selected-project state, milestones, risks/issues and dependencies;
- separate leadership context from configuration without removing authorised controls;
- preserve all explicit-state/reason/audit semantics;
- prove no hidden scoring.

### 10C5 — Family acceptance
- run complete engineering/security gates;
- inspect required widths and relevant states;
- verify close/register workflows remain intact;
- persist exact-head evidence;
- commit Family C acceptance record;
- update BUILD_STATE.

Do not begin Family D — Time & Leave / Workforce before Family C is accepted.

## Required verification

Functional/security:
- Manager project visibility remains current-unit lead/participant scoped;
- private project work remains excluded;
- project proposal approval remains unit-head scoped;
- objective management remains within current authority;
- Administration does not gain Manager project editing;
- Executive/Delivery controls remain behind current role/capability/managed-unit logic;
- project health remains explicit stored state, not generated scoring;
- project register payment/reversal/custody/slot/remittance flows remain intact;
- project close/reopen/history remains versioned and auditable;
- cumulative RLS/security gates remain green.

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
- planned/active/closed where present;
- project with/without objectives;
- project with/without participants;
- explicit on-track/watch/at-risk/blocked health;
- milestone states;
- risk/issue present/empty;
- project dependency present/empty;
- close history present/empty;
- long project/unit/objective names;
- permission-limited management controls;
- keyboard/touch/focus;
- narrow workspace navigation.

## Family C exit gate

Family C is complete only when:
- Manager Projects, Administration Projects, Executive Portfolio and the project workspace visibly belong to Experience V2;
- existing project/delivery behaviours remain intact;
- no authority/privacy/audit boundary is broadened or weakened;
- no hidden project scoring/ranking is introduced;
- project register and close flows still pass;
- no high-severity phone/laptop/desktop defect remains;
- exact-head CI, Migration Replay, Account Security, Quality Gate and Vercel pass;
- exact-head Projects/Portfolio evidence is inspected and persisted;
- Family C acceptance record and BUILD_STATE are current.
