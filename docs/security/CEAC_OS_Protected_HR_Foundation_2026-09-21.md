# CEAC OS — Protected HR Foundation

**Date:** 21 September 2026
**Branch:** `codex/admin-hr-completion`

This is a security foundation, not the Admin/HR product build.

The canonical build brief requires HR/pay data, employee documents, immutable pay history/corrections, database-enforced access, a permanent record of sensitive changes, and a practice environment before payroll goes live. It also leaves salary structure and non-statutory allowances/deductions as product decisions.

## What is established now

### Non-exposed HR database area

`hr_private` is deliberately outside the browser-exposed `public` schema.

`anon` and `authenticated` have no schema usage or direct table access.

Initial protected tables:

- `hr_private.documents` — document metadata and private Storage path;
- `hr_private.audit_events` — append-only sensitive-access/change history.

No salary, bank, national-ID, SSNIT/tax identifier, or payroll calculation table is invented at this stage.

### Protected document storage

Private Storage bucket:

`ceac-hr-private`

It is not public and intentionally has no direct browser object policy yet.

The Admin/HR document feature must later introduce explicit path/role rules and tests in the same PR that enables access.

### Immutable HR audit history

The HR audit table accepts additions but rejects update/delete attempts through an immutability trigger.

Future protected HR RPCs must write attributable audit events for sensitive reads, writes, approvals, reversals, document access, and role/pay changes where applicable.

### Privileged RPC rule

Every authenticated SECURITY DEFINER RPC must bind itself to the signed-in actor directly or through approved authority/visibility helpers.

The GitHub security gate now enforces this structurally.

## Deliberately deferred until product decisions are confirmed

- individual salary versus grade structure;
- allowances/deductions beyond statutory items;
- payroll approval details;
- protected identifier fields;
- direct Staff/Admin document access policies;
- Group Pastor document/private-HR drilldown rules;
- payroll practice-copy implementation.

These are not security gaps in the foundation because no feature currently stores or exposes those data classes.

They must be designed on top of this boundary rather than placed in `public.profiles` or a public Storage bucket.
