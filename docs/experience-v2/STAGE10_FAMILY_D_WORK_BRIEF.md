# CEAC OS Experience V2 — Stage 10 Family D Work Brief

Date: 28 September 2026
Status: ACTIVE CONTRACT
Stage: 10 — Operational Screen Families
Family: D — Time & Leave / Workforce

## Entry condition

Stage 10 Family C — Projects / Portfolio is accepted and complete.

Accepted Family C runtime head:
`4b10e4f54981d996a164f9024ab37ecbf2806e09`.

Family C acceptance record:
`docs/experience-v2/STAGE10_FAMILY_C_ACCEPTANCE_RECORD.md`.

Current exact-green documentation/entry head:
`06b081d66c49b06aa6d78983069939e4fa4fbdc1`.

Exact-head gates on Family D entry:
- CI PASS — run `36377664199`;
- Migration Replay PASS — run `36377664190`;
- Account Security PASS — run `36377664191`;
- complete Quality Gate PASS — run `36377664171`;
- 278 Playwright tests passed in 9.0 minutes;
- Vercel PASS.

PR #72 remains OPEN + DRAFT.
PR #71 remains frozen.
Chat is the sole active writer.
Stage 13 Payroll remains blocked pending confirmed CEAC payroll rules.

## Canonical family scope

The binding Experience V2 sequence defines Family D as:
- Staff views;
- Manager context;
- Administration operations.

Current route mapping:
- current `attendance` route → `Workforce.jsx`;
- Administration sidebar label `Time & Leave` → `attendance`;
- Staff and Manager can open their current workforce context from `Me.jsx` through the existing `Time & leave` entry;
- Staff leave request/history also remains in `Me.jsx`;
- Executive is explicitly excluded by the current `canUseWorkforce` route gate.

`Attendance.jsx` still exists as legacy source, but the current application route uses `Workforce.jsx`. Family D must not revive a superseded screen merely because the file exists.

Family D is a presentation/interaction migration over the established Stage 9 Workforce Management domain. It is not a workforce-policy or attendance-data rewrite.

Full My Hub/profile visual migration remains Family G. Family D may integrate the existing Staff leave/workforce entry without redesigning unrelated My Hub areas.

## Product character

Time & Leave / Workforce is factual operational context, not surveillance or performance scoring.

The family must answer, using recorded facts:
- what schedule/day type is explicitly configured;
- what work-session activity is recorded;
- whether approved leave overlaps;
- where expected and recorded context differ;
- what attributable correction exists;
- what leave request state/history exists;
- what policy is explicitly confirmed;
- what the current role may act on.

Role character:
- Staff: calm personal time/leave context — my schedule, recorded sessions, corrections and leave;
- Manager: unit context — team schedule/session/leave context and authorised leave decisions, without attendance-correction or organisation-policy authority;
- Administration: organisation operations — workforce calendar/context, corrections, leave lifecycle, schedule/day-type administration and confirmed leave-policy administration.

The family must never convert missing activity into an automatic judgement.

## Binding Stage 9 trust contract

Source:
`docs/architecture/CEAC_OS_STAGE9_WORKFORCE_MANAGEMENT_2026-09-22.md`.

Hard constraints to preserve:
- no session recorded is never an automatic absence finding;
- attendance is operational context, not a performance score;
- existing location/flags remain descriptive only;
- leave requests remain usable without a configured leave-balance policy;
- legacy seeded leave settings are not confirmed CEAC policy;
- entitlement/accrual/carry-over/balance remain unavailable until explicitly configured and activated;
- no payroll or leave-without-pay deduction logic is introduced;
- original work-session evidence is not rewritten by corrections;
- schedules, corrections, leave history and policy history remain attributable/reversible/versioned;
- no hard-delete path is added for workforce history.

Permitted factual labels include:
- Session recorded;
- No session recorded;
- Approved leave;
- Rest/non-session day;
- Schedule not configured;
- Corrected context.

Do not automatically label:
- Absent;
- Late;
- No-show;
- Underworked;
- Poor attendance.

A human-authorised administrative finding may remain visible only where the established correction record explicitly contains it.

## Existing data and action contract

Current `Workforce.jsx` reads:
- `employment_records`;
- `work_sessions`;
- `leave_requests`;
- `leave_request_events`;
- `workforce_day_types`;
- `workforce_schedule_versions`;
- `attendance_corrections`;
- `leave_policy_versions`;
- `leave_policy_rules`;
- `office_locations`;
- `meeting_sessions`;
- `ministry_events`.

Current reviewed mutation paths:
- `workforce_record_day_type`;
- `workforce_record_schedule`;
- `workforce_record_attendance_correction`;
- `workforce_leave_action`;
- `workforce_record_leave_policy`.

Current Staff leave request path in `Me.jsx`:
- `workforce_request_leave`;
- cancellation through `workforce_leave_action`.

Family D must preserve those domain paths unless a concrete defect proves otherwise.

## Current authority contract

### Staff
May:
- see own workforce context through RLS;
- see own schedule/correction/leave history;
- request/cancel eligible leave;
- see policy/balance only when validly configured.

May not:
- see colleagues' workforce records;
- record organisation attendance corrections;
- administer schedules/day types/policy;
- decide other people's leave.

### Manager
May:
- see managed-unit workforce context through existing RLS/domain authority;
- inspect unit schedule/session/leave/correction context;
- act on leave only through the established configured route.

May not:
- receive `attendance.correct` merely from the manager role;
- create organisation policy/day types/schedules without explicit `workforce.manage`;
- infer absence/performance from missing sessions.

### Administration
Administration operations require explicit capability:
- `workforce.manage` for schedule/day-type/policy administration;
- `attendance.correct` for attendance correction/reversal.

Do not broaden authority because a control is visually convenient.

### Executive
Current route gate excludes Executive from Workforce. Family D does not introduce an Executive Workforce surface.

## Current acceptance evidence

The cumulative exact-green Quality Gate on Family D entry proves:
- Stage 9 Workforce SQL/security gate PASS;
- staff self-scope and colleague isolation;
- manager cannot attendance-correct without explicit capability;
- Administration correction/reversal keeps original session evidence unchanged;
- schedule versions preserve superseded history;
- leave request remains usable with no confirmed policy;
- incomplete policy cannot be activated;
- confirmed manager-then-admin route is enforced;
- leave approval reversal is attributable;
- Staff cancellation remains available in eligible state;
- no workforce scoring/ranking fields were introduced;
- end-to-end Staff/Manager/Admin Workforce browser journey passes.

Current browser acceptance also proves:
- Administration can record day type and schedule;
- Staff can request/cancel leave;
- Manager can act on leave within the route;
- Administration can reverse an approval;
- Staff Workforce mobile at approximately 390×844 has no page-level horizontal overflow.

## Current-state product audit

### Shared Workforce surface

The current page is one shared `Workforce.jsx` controller/view for Staff, Manager and Administration, with RLS/capabilities determining visible records and controls.

Tabs:
- Today;
- Calendar;
- Sessions;
- Recorded differences;
- Leave;
- Corrections;
- Schedules & policy for `workforce.manage` only.

This is functionally useful but not yet an Experience V2 family.

Observed issues:
- all roles receive the same generic `Workforce` hierarchy instead of role-appropriate composition;
- six or seven legacy tabs compete at the top of the page;
- the tab strip wraps into multiple rows on phone instead of using a deliberate V2 narrow-screen pattern;
- old `.card`, `.row`, `.sec`, `.pill` and `.btn` presentation remains mixed into the V2 shell;
- the current Workforce-specific CSS still contains operational text at approximately 9–11.5px, below the V2 12px floor;
- factual person context is displayed as a dense six-cell card, which becomes vertically heavy on narrow phones;
- the seven-day calendar is readable but visually legacy; richer month/week/day interaction remains Stage 11 and must not be prematurely invented here;
- loading/error/empty/policy-unconfigured states need to feel like one family rather than separate legacy components.

### Staff

Current Staff evidence shows:
- one self-scoped person on Today;
- schedule/day type;
- first/final recorded session;
- approved leave;
- effective corrections;
- access to Sessions, Recorded differences, Leave and Corrections;
- leave request/cancel in My Hub.

Observed presentation issue:
- personal context looks like an organisation workforce card reduced to one person instead of a calm personal view;
- the large stacked fact treatment consumes too much phone height;
- tabs wrap and dominate the first viewport.

Family D should make Staff's own facts primary without hiding history.

### Manager

The current Manager Workforce route uses the same shared page, with managed-unit RLS scope and no setup tab unless explicitly granted.

Existing behaviour:
- team Today context;
- seven-day calendar;
- sessions/differences;
- leave queue/history;
- read-only correction history;
- authorised manager leave decisions.

The V2 manager shell does not currently expose Time & Leave as a primary sidebar destination; the existing My Hub entry opens the route. Family D must not change navigation in 10D1. If D3 proves discoverability is a real product defect, any navigation change must be checked against the ratified shell/destination contract before implementation.

### Administration

Current Administration screenshot/evidence shows:
- V2 shell around a legacy Workforce page;
- seven top tabs;
- policy-not-configured notice;
- setup status;
- day-type/schedule/policy actions;
- day-type and policy status rows.

Observed presentation issues:
- setup/operational context lacks clear hierarchy;
- primary versus secondary administrative actions are weakly differentiated;
- significant empty canvas remains at laptop width;
- dense tabs and legacy section rows make the screen read like a long settings form rather than an operations console.

## Behaviour and authority contract to preserve

Preserve:
- RLS-driven role scope;
- explicit capabilities;
- append-only schedule versions;
- append-only attendance corrections and linked reversals;
- immutable original work-session evidence;
- append-only leave event history;
- explicit leave route state machine;
- policy activation completeness rules;
- existing Staff leave request/cancel flow;
- organisation/unit/person calendar filters;
- meeting/ministry-event factual context;
- dataset-specific load/error handling;
- policy-unconfigured truthfulness.

Do not:
- make missing sessions equal absence;
- create lateness/productivity/attendance scores;
- rank people or units;
- use attendance as payroll time;
- calculate leave balance from unconfirmed defaults;
- expose policy/correction controls to Staff/Manager without capability;
- let Manager bypass a confirmed manager-then-admin route;
- rewrite historical correction/leave/schedule/policy rows;
- change Stage 9 schema/RLS/RPC rules merely for presentation;
- introduce payroll assumptions;
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
- phone recomposition rather than wrapped desktop controls;
- descriptive labels around all attendance/leave state.

Do not:
- add another global parity/override stylesheet;
- expand `!important` debt;
- create another icon language;
- solve mobile density with smaller text;
- convert the seven-day context into invented calendar capability;
- add decorative charts or inferred attendance metrics.

### Staff hierarchy

Recommended hierarchy from existing data:
1. my time/leave identity and today's factual state;
2. schedule/day type and configured clock context;
3. recorded session context;
4. approved/current leave;
5. corrections;
6. history/navigation to Sessions, Leave and Recorded differences.

The first phone viewport should answer “what is recorded for me today?” without requiring a six-cell administrative card.

### Manager hierarchy

Recommended hierarchy:
1. unit Time & Leave identity;
2. leave items requiring an authorised decision;
3. today's team factual context;
4. seven-day team context;
5. sessions/differences;
6. correction history read-only.

Manager must see facts before configuration-like detail and must never receive a performance interpretation.

### Administration hierarchy

Recommended hierarchy:
1. organisation Time & Leave identity;
2. items requiring Administration action;
3. today/organisation context;
4. calendar and session/difference evidence;
5. corrections;
6. leave lifecycle/history;
7. schedules/day types;
8. confirmed policy status/configuration.

Administration operations should read as an operations console, not a collection of unrelated forms.

## Family D implementation sequence

### 10D1 — audit and contract
- lock this brief;
- inspect exact-head `Workforce.jsx`, Staff `Me.jsx` leave/workforce entry, Stage 9 SQL gate and browser acceptance;
- inspect current Staff/Admin Workforce evidence and responsive shortcomings;
- identify shared Time & Leave / Workforce family primitives;
- no product-code migration before this contract is persisted.

### 10D2 — Staff Time & Leave
- establish shared V2 Workforce family presentation primitives;
- migrate Staff own-context hierarchy in `Workforce.jsx`;
- preserve self-only RLS and My Hub leave request/cancel flow;
- preserve all factual wording and unconfigured-policy behaviour;
- prove supported phone widths plus laptop/desktop.

### 10D3 — Manager Workforce context
- migrate managed-unit Today, leave queue/history, calendar context, sessions/differences and correction history;
- preserve configured leave-route decisions;
- prove no attendance-correction/policy authority leakage;
- decide navigation discoverability only from evidence, not convenience.

### 10D4 — Administration Time & Leave
- migrate organisation operations, action hierarchy, correction workflows and schedule/day-type/policy administration;
- preserve explicit capability checks and version/reversal semantics;
- maintain no-policy/no-balance truthfulness;
- prove laptop-first density plus all supported phone widths.

### 10D5 — Family acceptance
- run complete engineering/security gates;
- inspect required widths and key role states;
- re-run Stage 9 workforce security/behaviour proof;
- persist exact-head Family D evidence;
- commit Family D acceptance record;
- update BUILD_STATE.

Do not begin Family E — Finance before Family D is accepted.

## Required verification

Functional/security:
- another Staff user cannot see a colleague's workforce context;
- Manager remains managed-unit scoped;
- Manager cannot record attendance correction without `attendance.correct`;
- Staff/Manager cannot administer schedules/day types/policy without `workforce.manage`;
- schedule correction remains a superseding version;
- attendance correction/reversal remains append-only;
- original work session remains unchanged;
- leave request works without confirmed policy;
- policy activation requires complete explicit rules;
- configured leave route is enforced;
- leave decision/cancellation/reversal history remains attributable;
- no absent/late/no-show/underworked inference is introduced;
- no payroll-time or salary logic is introduced.

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
- partial dataset error;
- empty;
- populated;
- policy unconfigured;
- active confirmed policy;
- schedule configured/unconfigured;
- session recorded/no session recorded;
- approved leave;
- correction history empty/populated/reversed;
- leave waiting/resolved/history;
- permission-limited actions;
- long person/unit/day-type/policy names;
- keyboard/touch/focus;
- narrow tab/navigation behaviour.

## Family D exit gate

Family D is complete only when:
- Staff, Manager and Administration Workforce surfaces visibly belong to Experience V2;
- current Stage 9 workforce behaviour and audit history remain intact;
- no role/privacy/capability boundary is broadened;
- missing session remains factual context, not an absence/performance conclusion;
- leave policy/balance remains truthful when unconfigured;
- no payroll assumptions are introduced;
- no high-severity phone/laptop/desktop defect remains;
- exact-head CI, Migration Replay, Account Security, Quality Gate and Vercel pass;
- exact-head Workforce evidence is inspected and persisted;
- Family D acceptance record and BUILD_STATE are current.
