# CEAC OS — Stage 2 Employee Lifecycle

**Date:** 22 September 2026
**Status:** IMPLEMENTATION CONTRACT
**Programme stage:** 2 — Employee Lifecycle
**Base:** Stage 1G green head `3862c7088de7d6e7d4a630618d7c94801e40c562`

## Purpose

CEAC OS must manage employee joining and exit as controlled operational processes rather than ad-hoc profile edits.

## Authority

- `people.manage` may open and progress employee lifecycle cases.
- Staff and ordinary Managers cannot create or complete lifecycle cases.
- Protected HR remains outside this stage.
- Lifecycle changes remain attributable, auditable and reversible by recording a new corrective lifecycle/employment event rather than rewriting history.

## Data

`employee_lifecycle_templates`
- lifecycle type;
- ordered step key/label;
- required capability.

`employee_lifecycle_cases`
- organisation;
- person;
- lifecycle type: `onboarding` or `offboarding`;
- planned effective date;
- reason;
- state;
- creator/start/completion metadata.

`employee_lifecycle_steps`
- copied step contract;
- order;
- state;
- completion actor/time/note.

## Initial templates

Onboarding:
1. Confirm employment record
2. Confirm unit & manager
3. Confirm system readiness
4. Complete onboarding

Offboarding:
1. Confirm exit date & reason
2. Confirm work handover
3. Confirm access/assets handover
4. Complete offboarding

## Lifecycle

Case: `active → completed`.

Step: `pending → ready → completed`.

Only the current ready step can be completed. Completing the final step completes the case.

Onboarding completion ensures the ordinary employment record is active and preserves the resulting employment-history snapshot.

Offboarding completion marks the ordinary employment record exited, records the exit date, makes the profile inactive, and appends an `exit_recorded` employment event.

## Events and audit

- `employee.lifecycle_started`
- `employee.lifecycle_completed`

Case and step changes are captured by ordinary platform audit. Employment completion also flows through Stage 1A history.

## Sensitive data

No salary, banking, national identifiers, protected documents, disciplinary material or payroll content.

## UI

Administration gains Employee lifecycle:
- open onboarding/offboarding case for an employee;
- see active/recent cases;
- see ordered steps;
- complete the ready step with a note;
- reload and preserve state/history.

## Tests

Required:
- clean replay;
- RLS;
- no anonymous access;
- people.manage-only case creation/step completion;
- ordered step progression;
- offboarding updates current ordinary employment and immutable history;
- lifecycle events/audit;
- browser acceptance;
- all earlier gates remain green.

## Acceptance

Stage 2 passes when an authorised People administrator can open and complete a lifecycle case, the final employment state/history is correct and persists, and unauthorised users cannot create or progress the case.
