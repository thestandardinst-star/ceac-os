# CEAC OS — Stage 1A Employment History

**Date:** 22 September 2026
**Status:** IMPLEMENTATION CONTRACT
**Programme stage:** 1A — Platform Foundation v2
**Base:** Stage 0 reviewed head `8d2fb7cd472b1209836472318ba92086ec268313`

## Purpose

CEAC OS must preserve the factual history of a person's employment instead of treating the current profile row as the only truth. Joining, employment type, title, unit, manager, role, working pattern, transfers, promotions, status changes and exit must remain attributable and reviewable after later changes.

## Users

- Employee: may read their own ordinary employment record/history.
- Unit manager: may read ordinary employment history for people currently within units they manage.
- Administration & HR: may read and record ordinary employment changes for the organisation.
- Executive status alone does not grant protected-HR authority.

## Authority

Current employment state and history are not directly writable by browser roles. Administration records changes through an authority-checked RPC. Existing official-profile and membership writes remain synchronised into employment history so older product flows cannot silently destroy history.

## Data

`employment_records` stores one current ordinary-employment snapshot per profile.

`employment_history` stores immutable snapshots with:
- change type;
- effective date;
- employment type;
- title;
- primary unit;
- manager;
- role;
- working pattern;
- employment status;
- joining/exit dates;
- reason;
- actor;
- optional corrected event reference.

Existing `profiles` and `unit_memberships` remain compatibility/current-operating surfaces during the staged expansion.

## Sensitive data

Stage 1A contains ordinary employment context only. It must not contain compensation, bank details, Ghana Card/national identifiers, tax/SSNIT identifiers, protected documents, disciplinary material or payroll data.

## Lifecycle

Employment status is one of `active`, `inactive`, or `exited`.

History change types are:
`baseline_import`, `joined`, `employment_details_changed`, `transferred`, `promoted`, `manager_changed`, `role_changed`, `working_pattern_changed`, `status_changed`, `exit_recorded`, `correction`.

An exited state requires an exit date. A correction creates a new event and references the earlier event; it never rewrites history.

## Audit

Every Administration employment change records:
- actor;
- time recorded;
- effective date;
- full resulting ordinary-employment snapshot;
- reason/change type;
- correction reference where applicable.

An organisation activity event is also emitted for the authoritative change.

## Correction and reversal

Employment history rows are append-only to application roles. Incorrect history is corrected by recording a new `correction` event referencing the earlier event and making the corrected snapshot the current state.

## Integrations

None in Stage 1A.

## UI

Administration People detail gains:
- current employment summary;
- employment-history timeline;
- guided Record employment change flow.

The UI writes only through the Stage 1A RPC.

## Tests

Required:
- clean migration replay;
- RLS on both tables;
- no anonymous access;
- no direct authenticated writes;
- reviewed authenticated SECURITY DEFINER surface updated deliberately;
- Platform Kernel gate;
- Stage 1A employment-history gate;
- existing Admin/HR, Meeting authority and role acceptance suites;
- browser build/acceptance through the full Quality Gate.

## Acceptance

Stage 1A passes when an authorised administrator can record a factual employment change, reload the employee record, see the new current state and immutable history, while an unauthorised browser role cannot directly mutate either employment table.

No Stage 1B work begins until Stage 1A migration, security gate, UI and acceptance are green.
