# CEAC OS Experience V2 — Stage 14 Whole-System Responsive and State Pass Work Brief

Date: 29 September 2026
Status: ACTIVE CONTRACT
Stage: 14 — Whole-System Responsive and State Pass

## 1. Purpose

Stage 14 is the cumulative responsive/state pass after the role families, calendar/data-visualisation, motion and identity layers are accepted.

It does not redesign authorised workflows.

It proves that the current product remains usable and truthful across the complete role surface at the required phone, intermediate, laptop and desktop widths, and that state changes do not collapse the accepted hierarchy.

## 2. Binding sources

This stage follows:
- `docs/experience-v2/IMPLEMENTATION_SEQUENCE.md`;
- `docs/experience-v2/VERIFICATION_PROTOCOL.md`;
- `docs/experience-v2/ACCEPTANCE_AND_HANDOFF.md`;
- `docs/experience-v2/CEAC_OS_EXPERIENCE_V2_SOURCE_OF_TRUTH.md`;
- accepted Stage 10–13 records;
- `src/experience-v2/shell/navigation.js`;
- the capability guards and contextual-route ownership in `src/App.jsx`.

Canonical code + acceptance records + exact-head evidence take precedence over stale summary text.

## 3. Required responsive matrix

Whole-system route inspection must cover:
- 320×844;
- 360×800;
- 375×812;
- 390×844;
- 414×896;
- 430×932;
- 900×900 representative intermediate/tablet;
- 1366×768;
- 1440×900 or larger.

Page-level horizontal overflow is not acceptable.

A deliberately scrollable inner control, table or segmented strip may scroll only inside its own bounded container.

## 4. Canonical shell-visible route inventory

### Staff
- Today — `home`;
- Work — `work`;
- Team — `team`;
- Calendar — `staff-calendar`;
- Messages — `messages`;
- My Hub — `me`;
- Your account — `account`.

### Manager
- Overview — `home`;
- Work — `work`;
- Team — `team`;
- Projects — `projects`;
- Calendar — `calendar`;
- Finance — `manager-finance`;
- Reports — `manager-reports`;
- Messages — `messages`;
- My Hub — `me`;
- Your account — `account`.

### Administration & HR
- Overview — `home`;
- People — `people` when `people.manage` is present;
- Work — `work`;
- Time & Leave — `attendance`;
- Finance — `finance`;
- Reports — `reporting`;
- Control Center — `settings`;
- Messages — `messages`;
- My Hub — `me`;
- Your account — `account`.

### Group Pastor / CEO
- Overview — `home`;
- Work — `work`;
- Ministry — `strategy`;
- Portfolio — `delivery`;
- Organisation — `exec-organisation`;
- Finance — `exec-finance`;
- Reports — `exec-reports`;
- Messages — `messages`;
- My Hub — `me`;
- Your account — `account`.

## 5. Contextual authorised surfaces

Stage 14 must also preserve the already accepted contextual/internal routes and overlays governed by App capability checks, including where applicable:
- work detail;
- assignment;
- person detail;
- project workspace;
- meeting detail/scheduler;
- message room;
- announcements;
- personal record;
- Delivery/Portfolio;
- Resource & Workload;
- Performance & Development;
- Learning;
- Assets;
- Compliance;
- Expenses/cost;
- Administration Units;
- Administration Projects;
- Administration Calendar;
- Employee lifecycle;
- Protected HR;
- Audit;
- Events;
- Workflows;
- Policies;
- Integrations;
- Authority;
- Office settings.

These surfaces already have family/security contracts. Stage 14 must not broaden who can reach them.

## 6. Existing accepted responsive evidence to preserve

The repository already contains strong family-specific matrix coverage.

Examples:
- Work family acceptance covers phone/intermediate/laptop/desktop widths in `tests/experience-v2-work-family.spec.js`;
- People family covers Staff Team, Manager Team/Person and Administration People/employee states in `tests/experience-v2-people-family.spec.js`;
- Project family covers Manager Projects, Administration Projects and Executive Portfolio through the full 320/360/375/390/414/430/900/1366/1440 matrix in `tests/experience-v2-project-family.spec.js`;
- Calendar family covers Staff/Manager/Administration through that same full matrix in `tests/experience-v2-workforce-calendar.spec.js`;
- Manager/Admin Finance use the full matrix in `tests/experience-v2-finance-*.spec.js`;
- Stage 11–13 preserve data-visualisation, motion/reduced-motion and identity evidence.

Stage 14 does not discard this evidence. It adds a cumulative route-level pass and fills state gaps.

## 7. Required state coverage

The cumulative pass must verify representative, authoritative examples of:
- loading;
- empty;
- partial/unconfigured;
- populated;
- error;
- permission-limited;
- completed/success;
- destructive/action confirmation;
- long names/content;
- keyboard behaviour;
- touch behaviour.

Rules:
- empty must not masquerade as an error;
- error must not masquerade as empty;
- permission-limited must not masquerade as no data;
- completed/success must remain factual;
- confirmation must not weaken destructive-action protection;
- long text must wrap/recompose rather than create page overflow;
- keyboard and touch must operate the same authorised actions.

Existing deterministic state tests may be reused as cumulative evidence. Stage 14 adds only missing whole-system contracts.

## 8. Implementation sequence

### 14A — Audit and contract

This document.

Acceptance:
- route matrix persisted;
- contextual/capability boundary persisted;
- existing responsive/state evidence mapped;
- missing cumulative checks identified;
- no product code changes.

### 14B — Whole-system route matrix

Add a cumulative route-level browser contract for every shell-visible destination across all four roles at the required width matrix.

Requirements:
- sign in through real role fixtures;
- navigate through the accepted shell/router;
- assert intended role shell;
- assert route body renders;
- assert no page-level horizontal overflow;
- keep intentional inner scrolling bounded;
- preserve mobile More navigation and desktop sidebar behaviour;
- do not mutate data merely to make screenshots populated.

Use existing family tests as the deeper contextual-route evidence rather than duplicating every workflow action inside this route sweep.

Acceptance:
- Level A;
- exact-head Level B;
- merged product evidence;
- direct inspection of representative phone/intermediate/laptop/desktop samples.

### 14C — State and interaction matrix

Fill only cumulative state gaps not already proven by accepted family tests.

Required cumulative evidence must include:
- loading;
- empty;
- partial/unconfigured;
- populated;
- error;
- permission-limited;
- completed/success;
- confirmation;
- long-content wrapping;
- keyboard/touch.

If a deterministic defect appears, fix the smallest owning component/screen. Do not add a parity stylesheet.

Acceptance:
- state semantics remain truthful;
- no authority broadening;
- no page-level overflow;
- keyboard/touch proof;
- exact-head Level B.

### 14D — Stage 14 final acceptance

Reconcile all route/state evidence on one exact application head.

Record:
- exact application SHA;
- CI;
- Migration Replay;
- Account Security;
- complete Quality Gate;
- Vercel;
- merged product artifact IDs/digests;
- direct product inspection.

Only then open Stage 15.

## 9. Protected boundaries

Stage 14 must not:
- invent records;
- widen route authority;
- hide permission limitations;
- treat errors as empty data;
- remove confirmations;
- weaken role/RLS/security assertions;
- add presentation-only schema/RPC/RLS/auth changes;
- add a new global override/parity stylesheet;
- accept page overflow because a child control should scroll;
- modify frozen PR #71;
- open Payroll.

## 10. Exit definition

Stage 14 is complete only when:
- all shell-visible role routes pass the full width matrix;
- contextual/internal routes remain covered by their accepted family contracts;
- all required state classes have cumulative deterministic evidence;
- no unresolved responsive/state defect remains;
- exact-head Level B and Vercel pass;
- direct product inspection passes;
- Stage 14 acceptance and BUILD_STATE are current.
