# CEAC OS — Stage 1B Platform Audit

**Date:** 22 September 2026
**Status:** IMPLEMENTATION CONTRACT
**Programme stage:** 1B — Platform Foundation v2
**Base:** Stage 1A green head `a2c7ecdbd5502c822887af9b018289ea5651e294`

## Purpose

CEAC OS needs one append-only, attributable ordinary-platform audit trail for consequential system changes. Existing activity feeds are product context, not a complete governance record, and protected-HR audit remains separately contained in `hr_private`.

## Users

- Administration & HR: may inspect ordinary-platform audit records for the organisation during Stage 1B.
- Other roles: no ordinary audit-log access in Stage 1B.
- Stage 1C will move audit viewing from broad role checks to explicit capability authority.

## Authority

Browser users cannot insert, update or delete audit rows directly.

Audit rows are produced only by trusted database triggers attached to reviewed consequential tables. The trigger records the authenticated actor when available. System/bootstrap actions may have a null actor and are labelled as system-originated.

## Data

`platform_audit_events` contains:
- organisation;
- actor;
- action;
- resource type and resource id;
- optional subject person;
- source table;
- changed field names;
- safe contextual metadata;
- event time.

The audit record deliberately avoids copying arbitrary before/after row payloads. That prevents ordinary audit from becoming a shadow store of protected or unnecessary personal data.

## Sensitive data

No salary, bank details, national identifiers, payroll data, protected documents, secrets, passwords, tokens or arbitrary row snapshots are copied into the ordinary platform audit.

Protected-HR operations continue using `hr_private.audit_events`.

## Lifecycle

Audit events are append-only. There is no normal edit/delete lifecycle.

A correction to business data creates another business event; it does not rewrite the historical audit row.

## Audit

Stage 1B instruments consequential ordinary-platform changes to:
- employee profiles;
- unit memberships;
- capability grants;
- organisation thresholds;
- leave settings;
- office locations;
- employment current-state/history;
- projects;
- finance requests;
- ministry events;
- announcements.

The event records insert/update/delete, changed fields, actor, resource and organisation. Only safe identifiers/state labels are permitted in metadata.

## Correction and reversal

Audit events themselves cannot be corrected or deleted by normal application authority. Corrections/reversals happen in the underlying domain and produce additional audit events.

## Integrations

None in Stage 1B.

## UI

Administration gains an Audit screen with:
- recent attributable changes;
- actor;
- action;
- resource;
- changed fields;
- time;
- filters for resource/action/search.

It is an inspection surface only.

## Tests

Required:
- clean migration replay;
- RLS enabled;
- no anonymous access;
- authenticated read only through Administration policy;
- no direct authenticated writes;
- append-only trigger blocks update/delete;
- reviewed audit triggers exist on the configured consequential tables;
- no new authenticated SECURITY DEFINER surface;
- Stage 1B audit gate;
- existing Stage 1A/Admin/HR/Meeting gates;
- full browser role/responsive acceptance.

## Acceptance

Stage 1B passes when an Administration action produces an attributable audit event visible in the Audit screen after reload, while non-Admin roles cannot navigate to or read the audit table and ordinary users cannot mutate audit history.

No Stage 1C work begins until Stage 1B is green.
