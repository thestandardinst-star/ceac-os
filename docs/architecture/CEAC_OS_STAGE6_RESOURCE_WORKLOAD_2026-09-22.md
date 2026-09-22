# CEAC OS — Stage 6 Resource & Workload Management

**Date:** 22 September 2026  
**Status:** IMPLEMENTATION CONTRACT  
**Programme stage:** 6 — Resource & Workload  
**Base main:** `d9b8c1703c7f20c233b62553e5e201cc209dacd7`

## 1. Purpose

Give CEAC managers and authorised Administration a factual planning view of known capacity and commitments without turning attendance into performance or inventing a hidden workload score.

The stage answers:
- what working pattern is recorded for a person;
- whether an explicit weekly planning capacity has been recorded;
- what estimated work is due in the selected planning window;
- what recurring responsibilities exist and what their per-occurrence estimates are;
- what project time has been explicitly committed;
- what approved leave overlaps the planning window.

## 2. Users and authority

- Unit Managers may read and plan for active people in units they manage.
- Administration with `resource.manage` may read and plan across the organisation.
- Staff do not receive a team-planning surface; existing ordinary work remains their operational view.
- Executive status alone does not grant resource-management write authority.

UI visibility is not the security boundary. Database RLS enforces the same scope.

## 3. Data contract

### `resource_capacity_versions`
Append-only operational planning capacity:
- organisation;
- person;
- weekly planning minutes;
- effective date;
- reason;
- recorder/time.

This is a planning assumption, not salary, contract terms, attendance or performance data. A correction is another version.

### `resource_project_commitment_versions`
Append-only project allocation history:
- organisation;
- person;
- project;
- planned minutes per week;
- start/end dates;
- state: active/withdrawn;
- optional `supersedes_id`;
- reason;
- recorder/time.

A change or withdrawal is a new version. Previous rows remain history.

## 4. Existing authoritative inputs

Stage 6 reuses rather than duplicates:
- `employment_records.working_pattern`;
- `work_items.estimate_minutes`, assignee, due date and status;
- `recurring_operations` + linked routine work;
- approved `leave_requests`;
- Stage 5 projects.

CEAC OS does **not** infer weekly hours from labels such as “full time”, “part time” or “flexible”. If no planning capacity has been explicitly recorded, the UI says “Not configured”.

## 5. Sensitive-data classification

Ordinary operational planning data only.

Do not store:
- salary or compensation;
- bank/payment data;
- protected employee identifiers/documents;
- medical detail;
- disciplinary material.

Approved leave contributes only the existing authorised leave dates/days. Stage 6 does not expose protected HR content.

## 6. Lifecycle

Capacity:
`version recorded → effective → superseded by a later version`

Project commitment:
`active version → revised active version OR withdrawn version`

No hard delete or browser update of either history table.

## 7. Audit and events

Every inserted version is captured in Platform Audit.

Events:
- `resource.capacity_changed`
- `resource.commitment_changed`

Payloads contain only planning metadata required to identify the change.

## 8. Correction / reversal

Never edit historical capacity or commitment rows.

- capacity correction = append a new effective version with reason;
- commitment correction = append a new version pointing to the prior row;
- commitment reversal = append a `withdrawn` version with zero planned minutes and a reason.

## 9. Workload presentation rules

The UI may show factual components:
- working-pattern label;
- weekly planning capacity, when configured;
- estimated open work due in the selected horizon;
- open work missing estimates;
- recurring responsibilities and per-occurrence estimates;
- explicit project commitment minutes/week;
- approved leave request days/ranges overlapping the horizon.

The UI must **not**:
- calculate an employee score or ranking;
- treat attendance hours as capacity or performance;
- claim an “overloaded” percentage when the underlying units are incomplete;
- convert leave days to hours without an explicit rule;
- guess effort for work with no estimate.

## 10. UI

Add **Workload** for Unit Managers and authorised Administration.

Required:
- selectable planning horizon;
- factual per-person component view;
- record/correct weekly planning capacity;
- record/revise/withdraw a project commitment;
- persistence after reload;
- clear “Not configured” and “No estimate” states.

## 11. Tests

Required:
- clean migration replay;
- RLS on both Stage 6 tables;
- no anonymous access;
- no browser update/delete;
- Staff denied team-planning writes;
- Unit Manager limited to managed-unit people and manageable projects;
- `resource.manage` organisation authority;
- append-only correction history;
- audit + event evidence;
- browser role acceptance;
- desktop/mobile width acceptance;
- all Stage 0–5 gates remain green.

## 12. Acceptance

Stage 6 passes when a Unit Manager can record a planning capacity and project commitment for a member of the managed unit, reload and see the persisted factual components, while another-unit/Staff access is denied and no workload/performance score is produced.

Stage 7 must not begin until Stage 6 is fully green and merged into `main`.
