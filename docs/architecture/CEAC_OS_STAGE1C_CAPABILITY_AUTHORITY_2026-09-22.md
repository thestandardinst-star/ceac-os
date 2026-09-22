# CEAC OS — Stage 1C Capability Authority

**Date:** 22 September 2026
**Status:** IMPLEMENTATION CONTRACT
**Programme stage:** 1C — Platform Foundation v2
**Base:** Stage 1B green head `008e8f29508a946bed07a45f8f3a08adaf118237`

## Purpose

CEAC OS must separate high-level role labels from sensitive authority. Being Administration, Executive, Manager or Staff is not itself permission to every protected or consequential capability.

## Users

- Authority managers: explicitly granted `authority.manage`.
- People administrators: explicitly granted `people.manage`.
- Audit viewers: explicitly granted `audit.view`.
- Protected-HR users: explicitly granted `hr_private.access`.
- Attendance correctors: explicitly granted `attendance.correct`.
- Performance administrators: explicitly granted `performance.admin`.
- Payroll preparers and approvers: separate explicit capabilities when payroll is later enabled.

## Authority model

Capabilities are explicit grants with:
- organisation;
- person;
- capability key;
- optional unit scope;
- grantor and grant time;
- grant reason;
- revocation actor/time/reason.

An organisation-wide grant applies across the organisation. A unit-scoped grant applies only to that unit.

Existing role flags may control workspace shape and ordinary role UX, but sensitive functions must check explicit capability authority.

## Capability catalogue

Initial canonical capabilities:
- `authority.manage`
- `people.manage`
- `hr_private.access`
- `attendance.correct`
- `performance.admin`
- `payroll.prepare`
- `payroll.approve`
- `audit.view`

The catalogue is system-defined. Product users cannot invent arbitrary capability keys.

## Data

`capability_definitions` — canonical system catalogue.

`capability_grants` — append-oriented grant/revocation history. Active authority is represented by `revoked_at is null`.

The legacy `capabilities` table remains temporarily for compatibility with existing product functions. Stage 1C authority decisions use `capability_grants`.

## Sensitive data

Capability grants are security metadata. They contain no protected HR content, payroll values or secrets.

## Lifecycle

`granted → active → revoked`.

Revoked grants are not deleted. Re-granting creates a new grant row.

## Audit

Every grant and revocation is attributable and is captured by the Stage 1B platform audit.

## Correction and reversal

Mistaken grants are revoked with a reason. Historical grant rows remain. A replacement grant is a new row.

The final active `authority.manage` grant in an organisation cannot be self-revoked through the normal application flow.

Payroll preparation and payroll approval are deliberately separated; the same person cannot hold both active payroll capabilities at the same scope through the normal grant RPC.

## Integrations

None in Stage 1C.

## UI

Administration gains an Authority screen for authorised authority managers:
- choose a person;
- see active and historical grants;
- grant from the canonical catalogue;
- choose organisation or unit scope where relevant;
- require a reason;
- revoke active grants with a reason.

Audit and People sensitive surfaces are capability-gated rather than implied solely by `is_admin`.

## Tests

Required:
- clean replay;
- RLS on capability catalogue/grants;
- no anonymous authority access;
- no direct browser grant/revoke writes;
- helper/RPC authority checks;
- separation-of-duty payroll rule;
- last-authority-manager protection;
- Audit read requires `audit.view`;
- People employment administration requires `people.manage`;
- Stage 1C authority SQL gate;
- browser role/capability navigation acceptance;
- existing Stage 1A/1B/security/meeting gates.

## Acceptance

Stage 1C passes when an authorised authority manager can grant and revoke a capability, the target account receives/loses the corresponding product access after reload, the history and audit remain, and a high-level role without the capability cannot use the protected operation.

No Stage 1D work begins until Stage 1C is green.
