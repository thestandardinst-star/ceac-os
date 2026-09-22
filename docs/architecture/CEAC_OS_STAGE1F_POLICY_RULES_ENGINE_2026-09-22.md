# CEAC OS — Stage 1F Policy & Rules Engine

**Date:** 22 September 2026
**Status:** IMPLEMENTATION CONTRACT
**Programme stage:** 1F — Platform Foundation v2
**Base:** Stage 1E green head `2f767120eb89d6b0d66939d464a24ba024f85daa`

## Purpose

CEAC OS needs one versioned source for operational rules so later workforce, performance, attendance, leave, workflow and compliance features do not hard-code organisation policy inside screens or migrations.

## Authority

Policy definitions are system-owned. Organisation rule values are versioned records.

Only users with `authority.manage` may create a new rule version for their organisation. Browser roles cannot update or delete prior rule versions.

## Data

`policy_rule_definitions`
- stable rule key;
- domain;
- label/description;
- value type;
- optional minimum/maximum numeric boundaries;
- active flag.

`policy_rule_versions`
- organisation;
- rule key;
- JSON value;
- effective date;
- reason;
- recorder;
- recorded time.

The latest effective version is the current rule. Older versions remain historical.

## Initial rule catalogue

- `attendance.grace_minutes`
- `attendance.late_after_minutes`
- `work.quiet_days`
- `reporting.overdue_days`
- `leave.manager_approval_limit`
- `performance.review_cycle_months`

No organisation values are invented by Stage 1F. Rules show as “not configured” until an authorised person records a value.

## Sensitive data

Rules contain policy configuration only. They do not store protected HR, payroll values, personal identifiers, secrets or employee-specific data.

## Lifecycle

`definition → version recorded → effective → superseded by later version`

History is append-only. A correction is a new version with a reason.

## Events and audit

Every rule version is captured by the ordinary platform audit and emits `policy.rule_changed`.

## UI

Administration gains Policies & Rules:
- browse the catalogue;
- see current value/effective date;
- inspect history;
- record a new version;
- require effective date and reason.

The screen is visible only to `authority.manage`.

## Tests

Required:
- clean replay;
- RLS;
- no anonymous access;
- authority-managed inserts only;
- no authenticated update/delete;
- type and numeric-bound validation;
- append-only history;
- event/audit capture;
- browser acceptance;
- all earlier gates remain green.

## Acceptance

Stage 1F passes when an authority manager records a rule value, reloads and sees the current value plus history, the change creates audit/event evidence, and a user without `authority.manage` cannot create or mutate rule versions.

No Stage 1G work begins until Stage 1F is green.
