# CEAC OS — Stage 3 Protected HR

**Date:** 22 September 2026
**Status:** IMPLEMENTATION CONTRACT
**Programme stage:** 3 — Protected HR
**Base:** Stage 2 green head `48bbbf0f2e9ae4bc5d89ffc01766659f5775649e`

## Purpose

CEAC OS needs a usable protected employee-record boundary for identifiers, employment terms, compensation history, payment details and protected documents without moving those values into ordinary profiles or exposing the private schema to browser roles.

## Authority

- `hr_private.access` is the explicit read/write authority for this stage.
- Administration status alone is not sufficient at the database boundary.
- Group Pastor / executive status does not imply protected-HR access.
- Browser roles retain no `USAGE` on `hr_private` and no direct table privileges there.
- Two reviewed public SECURITY DEFINER RPCs are the only browser entry points: protected summary and protected record/version creation.

## Data

Stage 3 adds private records for:
- identifiers;
- employment terms;
- compensation history;
- payment details.

It reuses the existing protected document table and `ceac-hr-private` Storage bucket.

Money remains `amount_minor + currency`. Stage 3 records compensation history only; it does not calculate payroll.

## Sensitive data

All values live under `hr_private` or the private Storage bucket. No Ghana Card, SSNIT/tax, bank, salary/compensation, payroll or payslip field is added to `public.profiles`.

## Lifecycle / correction

Protected records are append-oriented. Corrections create a new record that references the prior record; the prior record becomes `replaced` rather than being deleted. Protected documents use the same replace/archive model already established in the HR foundation.

## Audit

Every protected-HR read through the product records `protected_hr_viewed`. Every protected record/version creation records `protected_hr_recorded`. Audit detail deliberately excludes the sensitive value itself.

## Storage

The HR bucket remains private. Capability-gated Storage policies permit protected-HR users to read/upload only beneath their organisation path. Public access remains prohibited.

## UI

A capability-gated Protected HR screen provides:
- employee selection;
- protected record summary;
- identifiers;
- employment terms;
- compensation history;
- payment details;
- protected document upload and signed download;
- append/replacement recording with a reason.

## Tests

Required:
- private schema remains inaccessible directly to browser roles;
- anon cannot call protected RPCs;
- Staff without `hr_private.access` cannot read/write;
- authorised protected-HR user can record/read synthetic protected data;
- replacement preserves history;
- sensitive read/write events are audited;
- protected Storage policies are present;
- Platform Kernel reviewed SECURITY DEFINER count updated;
- browser acceptance and mobile width checks;
- all previous gates remain green.

## Acceptance

Stage 3 passes when an authorised protected-HR user can record, reload and retrieve synthetic protected employee records and private documents, while an ordinary Staff account cannot access the protected RPCs or private schema.
