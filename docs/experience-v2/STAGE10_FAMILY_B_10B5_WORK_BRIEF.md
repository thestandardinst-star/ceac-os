# CEAC OS Experience V2 — Stage 10 Family B 10B5 Work Brief

Date: 27 September 2026
Status: ACTIVE
Stage: 10 — Operational Screen Families
Family: B — People / Team
Substage: 10B5 — Administration People / employee workspace

## Entry condition

10B4 — Manager Person workspace is formally accepted and complete.

Accepted 10B4 implementation:
`8817477f1eec19a36eb951999c129a2a8a1f8438`

10B4 acceptance record:
`docs/experience-v2/STAGE10_FAMILY_B_10B4_ACCEPTANCE_RECORD.md`

10B5 may now begin.

## Purpose

10B5 migrates the authorised Administration People directory and employee workspace onto the accepted Experience V2 People/Team system without changing the HR/employment/security model.

This is a presentation and interaction migration over existing Administration authority.

No schema, migration, RLS, RPC, auth, capability or payroll-policy change is expected unless a separate concrete defect proves one is required.

## Existing Administration authority to preserve

The current screen relies on existing authorised paths including:
- `admin_people_summary`;
- `admin_person_detail`;
- `admin_employment_detail`;
- `admin_update_employment`;
- organisation-scoped active unit lookup;
- configured leave policy context;
- audited employment history;
- current employee state;
- factual work/session/leave context.

Existing capability/routing boundary remains:
- Administration People remains behind the existing `people.manage` authority;
- Staff and Manager surfaces must not receive Administration employment controls;
- capability-limited Administration must remain capability-limited.

## Existing actions to preserve

10B5 must preserve the current actions and semantics:
- search/filter the organisation People directory;
- open an authorised employee record;
- inspect identity/employment context;
- inspect work/activity/leave evidence;
- inspect employment history;
- record an employment change;
- preserve effective date;
- preserve change type;
- preserve correction-of-history semantics;
- preserve manager/unit/role/working-pattern/status fields;
- preserve reason/context;
- preserve exit date requirement when status is exited.

No existing action may silently disappear during the presentation migration.

## Protected employee information

Administration can see employee information already exposed by the current authorised employee-detail RPCs.

10B5 must not:
- expose additional protected fields beyond existing authorised data;
- introduce bank/identifier fields that are not yet confirmed/configured;
- invent contracts/documents data;
- invent payslips;
- invent salary values;
- infer salary from role, attendance or work records;
- move protected-HR data into ordinary Staff/Manager surfaces.

The existing protected-HR placeholders/boundaries remain truthful:
- Salary & payroll — awaiting confirmed CEAC salary structure;
- identifiers/bank details — protected storage readiness only;
- contracts/documents — protected storage readiness only;
- payslips — unavailable until payroll is configured.

Stage 13 Payroll remains blocked.

## Current-state audit

### People directory

Current data and behaviour:
- organisation-wide employee summary from `admin_people_summary`;
- filters: Everyone, Active, On leave, No submissions in 14 days, No unit;
- search by name, email, job title or unit;
- grouping by unit;
- role/status context;
- current open/finished factual work context.

Observed presentation issues:
- directory header/filter/search/list anatomy remains legacy and does not yet use the accepted V2 People family;
- rows mix identity, role, unit and activity context without a strong shared hierarchy;
- “No submissions in 14 days” is factual context and must not visually become a warning score or disciplinary label;
- mobile composition is functional but needs deliberate V2 sequence and 12px floor protection.

### Employee workspace

Current hierarchy is a dense legacy split:
- identity/state;
- work evidence;
- activity context;
- identity/employment;
- employment record;
- employment history;
- leave;
- protected-HR readiness.

Observed presentation issues:
- current work/activity evidence and formal employment record compete visually;
- desktop split density is high;
- mobile becomes a long compressed administrative document;
- formal employment change/history needs clearer administrative prominence;
- protected-HR placeholders need to remain obviously unconfigured rather than appearing as available payroll features.

## Accepted 10B5 hierarchy

Administration employee workspace should read in this order:

1. identity + employment state;
2. current employment record;
3. employment change action + employment history;
4. current work/activity context;
5. leave context;
6. protected-HR readiness/configuration boundary.

The People directory should prioritise:

1. People page identity and organisation scope;
2. search + factual filters;
3. people grouped by unit;
4. employee identity/role/unit/state;
5. factual operational context as secondary evidence.

## No-scoring rule

Administration may see factual operational evidence already authorised by current RPCs.

Do not convert:
- open work count;
- finished work count;
- no-submission context;
- session count;
- average recorded start;
- leave;
- on-time completion;

into a score, ranking, grade, risk label or inferred performance judgement.

Any explanatory copy must make clear that activity/work-session context is factual operational evidence only.

## Shared V2 implementation strategy

Use the existing People-family primitives where they fit:
- `PeoplePageHeader`;
- `PeoplePersonHeader`;
- `PeopleWorkspaceSection`;
- `PeopleEvidenceSummary`;
- `PeopleFactRow`;
- `PeoplePersonRow`;
- `PeopleEmpty`;
- existing V2 fields, buttons, status badges and state primitives.

Extend the People family only where Administration employee-record structure genuinely needs a shared primitive.

Do not create a separate global Administration parity stylesheet.

Do not increase `!important` debt.

## Responsive contract

Required proof:
- 320;
- 360;
- 375;
- approximately 390×844;
- 414;
- 430;
- representative intermediate/tablet;
- 1366×768;
- 1440×900 or larger.

At phone widths:
- no page-level horizontal overflow;
- employee detail becomes a deliberate single-column sequence;
- no compressed desktop split;
- search/filter controls remain usable;
- employment-change controls remain understandable;
- protected-HR boundaries remain readable;
- operational text remains at least 12px;
- practical interactive targets remain at least 44px where required.

## Required states

Prove where fixture/current data permits:
- directory loading;
- populated directory;
- search/filter empty result;
- on leave;
- inactive;
- no unit;
- employee detail loading;
- employment history present;
- employment history empty;
- protected-HR unconfigured;
- leave policy configured/unconfigured;
- employment-change sheet;
- capability-limited Administration;
- error state.

## Regression/security contract

Existing acceptance must remain green for:
- policy-safe HR states and real employee records;
- audited employment changes;
- capability boundaries;
- no payroll calculation without confirmed policy;
- complete RLS/security gates;
- Administration phone-width coverage;
- existing Staff/Manager privacy and authority boundaries.

No test weakening, timeout inflation, retry masking or assertion removal.

## Implementation sequence

### 10B5A — directory
- migrate People page header/search/filter/grouped rows;
- preserve existing summary/filter/search semantics;
- prove phone/laptop/desktop.

### 10B5B — employee workspace
- migrate identity/employment state;
- current employment;
- employment history/change;
- work/activity;
- leave;
- protected-HR readiness;
- preserve every current action and RPC.

### 10B5C — acceptance
- complete exact-head engineering/security gates;
- inspect all required widths and states;
- persist exact-head evidence;
- record 10B5 acceptance;
- update BUILD_STATE.

Do not begin 10B6 until 10B5 is green and visually accepted.
Do not begin Family C until final Family B acceptance is complete.
