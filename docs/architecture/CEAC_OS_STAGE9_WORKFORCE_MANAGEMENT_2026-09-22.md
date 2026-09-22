# CEAC OS — Stage 9 Workforce Management 2.0

**Date:** 22 September 2026
**Status:** IMPLEMENTATION CONTRACT
**Programme stage:** 9 — Workforce Management 2.0
**Base main:** `8dd3b8d50600942f482a7bdb1dde287c1e0a04dc`
**Latest merged migration:** 088 — Learning

## 1. Purpose

Build a factual workforce-planning and attendance/leave administration layer around CEAC's existing employment, work-session, leave and calendar records.

Stage 9 must answer:
- what work pattern/day type was explicitly scheduled for a person or unit;
- what work-session activity was actually recorded;
- where expected context and recorded activity differ, without automatically calling the difference absence or misconduct;
- what attendance correction was requested/approved/reversed and by whom;
- what happened to a leave request through approval, escalation, reversal or cancellation;
- which leave-policy rules CEAC has explicitly configured;
- who is scheduled, on approved leave, or has recorded activity on the organisational workforce calendar.

The system records facts and administrative decisions. It does not infer effort, honesty, productivity, performance or absence from missing activity alone.

## 2. Hard constraints

- **No session recorded is never an automatic absence finding.**
- Attendance is operational context, not a performance score.
- Existing work-session location/flags remain descriptive only.
- Leave requests are never blocked because a person has no work session.
- The legacy seeded values in `leave_settings` are not treated as confirmed CEAC policy unless an attributable policy version has been activated.
- CEAC leave entitlement, accrual, carry-over and balance calculations remain unavailable until policy is formally confirmed.
- No payroll or leave-without-pay deduction logic is introduced.
- No Stage 10 Assets scope is introduced.

## 3. Existing records reused

Stage 9 extends rather than replaces:
- `employment_records.working_pattern`;
- `work_sessions` and `work_session_events`;
- `leave_requests`;
- legacy `leave_settings` and `leave_balances` only as compatibility records;
- `office_locations`;
- organisation/ministry/meeting calendars.

Existing direct leave-decision updates are replaced with reviewed RPC flows so decision history is not silently overwritten.

## 4. Schedules and day types

### Workforce day types

`workforce_day_types` defines named operational day meanings such as:
- Working day;
- Rest day;
- Service/event duty;
- Remote/field day;
- Training/development day;
- Other explicitly named CEAC day type.

Administration may create CEAC-specific labels. Stage 9 does not assume weekends or Sundays are non-working because CEAC units may operate differently.

Each day type records:
- name;
- description;
- whether a work session is ordinarily expected;
- whether approved leave may overlay it;
- active state;
- attribution/audit fields.

"Session ordinarily expected" is context only. Missing session activity still does not create an absence finding.

### Schedule versions

`workforce_schedule_versions` is append-only and records:
- person;
- effective date range;
- source: person / unit / working-pattern translation;
- day-of-week to day-type mapping;
- optional expected start/end clock context;
- reason;
- superseded version;
- actor/time.

Only explicit Administration workforce authority may create/correct schedule versions. Earlier schedules remain history.

## 5. Expected-versus-actual context

A Stage 9 view may show, for a calendar day:
- configured day type;
- expected clock context, if explicitly recorded;
- whether a work session exists;
- first recorded session start;
- final recorded session end;
- approved leave overlap;
- attributable attendance corrections;
- descriptive session differences/flags.

Permitted labels include:
- Session recorded;
- No session recorded;
- Approved leave;
- Rest/non-session day;
- Schedule not configured;
- Corrected context.

Prohibited automatic labels:
- Absent;
- Late;
- No-show;
- Underworked;
- Poor attendance;
unless a human-authorised correction explicitly records such an administrative finding under CEAC policy. Stage 9 itself does not infer these states.

## 6. Attendance corrections

`attendance_corrections` is append-only.

A correction records:
- person;
- date;
- optional work-session reference;
- correction type;
- before/after factual context;
- reason;
- requested/recorded by;
- effective time;
- state and reversal relationship.

Organisation-wide correction authority requires the existing `attendance.correct` capability.

Staff may not silently rewrite sessions. Existing self-reconciliation of an accidentally open session remains available through the current work-session recovery flow.

Managers may inspect unit context but do not gain `attendance.correct` merely by being a manager.

A correction/reversal never rewrites the original work-session record. The effective workforce view overlays the attributable correction history.

## 7. Leave request lifecycle and history

Stage 9 preserves `leave_requests` as the request anchor and adds append-only `leave_request_events`.

Supported actions:
- requested;
- manager_approved;
- escalated;
- admin_approved;
- declined;
- cancelled_by_employee;
- approval_reversed;
- decision_corrected.

The active status on `leave_requests` is maintained through reviewed RPCs, while every action is permanently recorded with actor, time, reason and prior state.

### Approval authority

- Staff creates/cancels their own eligible request.
- Unit Manager may decide requests for people in managed units.
- Administration may decide/escalated requests organisation-wide.
- Stage 9 does not use the legacy seeded `manager_approval_limit` as confirmed policy unless an active configured policy explicitly defines it.
- Until CEAC confirms an approval threshold, manager approval routes may be configured explicitly without guessing a number.

## 8. Leave policy engine

`leave_policy_versions` and `leave_policy_rules` provide an attributable, versioned policy structure.

A policy may explicitly define:
- leave kind;
- employment/contract applicability;
- entitlement amount;
- entitlement unit;
- accrual method/rate;
- carry-over rule/limit;
- approval route;
- effective dates;
- reason/source document reference.

A policy version is **not active merely because rows exist**. Activation requires explicit Administration confirmation with a reason.

### Balance gate

Leave balance calculation is disabled unless:
1. an active confirmed policy version exists;
2. the relevant leave kind has complete entitlement/accrual/carry-over rules;
3. any opening balance/source-of-truth required for migration is explicitly recorded.

Until then the UI must say policy/balance is not configured and continue allowing leave requests.

Stage 9 will build the engine and configuration surface but will not invent CEAC values.

## 9. Organisational workforce calendar

The workforce calendar combines only recorded facts:
- scheduled day types;
- approved leave;
- recorded work-session context;
- existing ministry/meeting calendar events where relevant.

It supports organisation, unit and person filters.

The calendar must visually distinguish:
- scheduled expectation;
- recorded activity;
- approved leave;
- no recorded session;
- unconfigured schedule.

It must never visually imply that "no recorded session" equals absence.

## 10. Authority

### Administration workforce authority
Existing capability:
- `attendance.correct` — attendance correction/correction review.

Stage 9 adds:
- `workforce.manage` — schedule/day-type and confirmed leave-policy administration.

Baseline active Administration users receive the new capability explicitly. Role label alone is not authority after baseline migration.

### Manager
May:
- see managed-unit workforce calendar/context;
- see/decide leave requests under the configured approval route;
- see correction history for managed-unit people.

May not:
- alter organisation schedule policy;
- perform attendance correction without `attendance.correct`;
- edit policy/balance rules;
- infer absence from missing sessions.

### Staff
May:
- see own schedule/context;
- see own correction history;
- request/cancel leave;
- see own leave decision history;
- see balance only when a confirmed policy makes it valid.

## 11. Audit and semantic events

Audit:
- day types;
- schedule versions;
- attendance corrections;
- leave policy versions/rules;
- leave request events.

Semantic events:
- `workforce.schedule_changed`;
- `workforce.attendance_corrected`;
- `workforce.attendance_correction_reversed`;
- `workforce.leave_requested`;
- `workforce.leave_decision_recorded`;
- `workforce.leave_decision_reversed`;
- `workforce.leave_policy_activated`.

Payloads contain identifiers and factual state, not sensitive free-text reasons where unnecessary.

## 12. Product experience

### Staff
Under Me / Workforce:
- My schedule;
- attendance context by day;
- correction history;
- leave request/history;
- balance area that explicitly says unavailable until confirmed policy where applicable.

### Manager
- unit workforce calendar;
- scheduled vs recorded context;
- leave queue/history;
- no-session-recorded wording;
- read-only attendance correction history.

### Administration
Extend Attendance & Leave into Workforce:
- Today;
- calendar;
- sessions;
- recorded differences;
- attendance corrections;
- leave queue/history;
- schedule/day-type administration;
- leave policy configuration/status.

## 13. Corrections and reversibility

- Schedule correction: append a superseding schedule version.
- Attendance correction: append correction; reversal is a new linked correction.
- Leave decision correction/reversal: append event and update current request state through reviewed RPC.
- Policy change: create a new version; never silently edit an active historical policy.
- No hard-delete path for workforce history.

## 14. Security

- All new tables use RLS.
- Anonymous access revoked.
- Browser cannot directly mutate attendance-correction or leave-decision history.
- Workforce policy/schedule administration requires `workforce.manage`.
- Attendance correction requires `attendance.correct`.
- Staff access limited to self.
- Manager access limited to managed units.
- Administration access requires explicit capabilities, not `is_admin` alone.
- Original work-session evidence remains immutable through Stage 9 correction flows.

## 15. Tests

Required:
- migration replay;
- capability inventory updated;
- no anonymous workforce access;
- direct correction/history mutation blocked;
- schedule versions append-only;
- staff sees only own workforce context;
- manager limited to managed units;
- no-session-recorded does not create absence;
- attendance correction/reversal history attributable;
- leave request decision/reversal history attributable;
- leave request remains usable without configured balance policy;
- no balance is calculated from unconfirmed legacy defaults;
- confirmed policy activation requires explicit authority/reason;
- organisational workforce calendar uses recorded rows only;
- audit/event evidence;
- persistence after reload;
- Staff/Manager/Admin browser acceptance;
- desktop/mobile responsive acceptance;
- every cumulative Stage 0–8 gate remains green.

## 16. Acceptance

Stage 9 passes when CEAC can explicitly schedule day types, compare those expectations to recorded session/leave context without inferring absence, make and reverse attributable attendance corrections, process leave through an auditable lifecycle, inspect an organisation workforce calendar, and configure the leave-policy engine without inventing balances.

Stage 10 must not begin until Stage 9 is fully green, product-inspected and merged into `main`.
