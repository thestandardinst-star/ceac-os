# CEAC OS — Stage 11 Compliance & Policy Management Architecture

**Date:** 22 September 2026
**Stage:** 11 — Compliance & Policy Management
**Baseline main:** `ec2801895c66dfec082d04901b4743bfeb9a2c4c`
**Branch:** `chatgpt/enterprise-expansion-stage-11-compliance-policy-2026-09-22`

## Purpose

Stage 11 builds compliance as rules + evidence + exceptions. It does not replace the Stage 1F `Policies & rules` configuration engine.

Stage 1F remains the system-rule catalogue for operational settings such as thresholds. Stage 11 is the human compliance product for:
- versioned policies;
- applicability;
- acknowledgements;
- requirements;
- evidence;
- expiries;
- approved exceptions;
- resolution.

There is no employee compliance score, ranking, percentage grade or hidden compliance judgement.

## Authority

New explicit capability:

`compliance.manage`

Authority:
- Administration with organisation-scoped `compliance.manage` may publish/retire policy versions, define applicability/requirements, review evidence and decide/resolve exceptions.
- Unit managers may read compliance records for people in managed units and policies applicable to those units, but cannot decide evidence or exceptions without `compliance.manage`.
- Staff may read policies applicable to themselves, acknowledge their own policies, submit their own evidence and request their own exceptions.
- Executive status alone grants no compliance-management write authority.
- Anonymous users have no compliance access.

## Versioning model

### Policy versions

`compliance_policy_versions` is append-only.

Each version records:
- stable `policy_key`;
- version number;
- title/category;
- summary/body text;
- state: `active` or `retired`;
- effective date and optional expiry;
- source reference;
- superseded version;
- reason;
- actor/time.

A retirement is a new `retired` version. Existing policy rows are not rewritten.

### Applicability

`compliance_policy_applicability` is immutable for a published version.

Supported scopes:
- organisation;
- unit;
- person;
- employment type.

A policy may contain multiple applicability rows. Organisation scope means every active person in the organisation.

### Requirements

`compliance_requirements` is immutable for a published version.

Each requirement may specify:
- title/description;
- whether acknowledgement is required;
- whether evidence is required;
- evidence kind;
- optional evidence validity/expiry guidance in days.

The system does not invent missing requirement values.

## Human evidence

### Acknowledgements

`compliance_acknowledgements` records the signed-in employee acknowledging one applicable policy version.

Acknowledgement is self-bound to `auth.uid()`. Administration cannot silently acknowledge on behalf of an employee.

### Evidence versions

`compliance_evidence_versions` is append-only.

A stable evidence key can progress through versions:
- submitted;
- verified;
- rejected.

Evidence records may include:
- reference;
- note;
- issued date;
- expiry date;
- reviewer note.

A new review state is a new version. Previous evidence is never overwritten.

Expiry is factual: when `expires_on` is before today the product may label the evidence expired. It must not convert that fact into an employee score.

### Exception versions

`compliance_exception_versions` is append-only.

A stable exception key can progress through:
- requested;
- approved;
- declined;
- resolved.

Staff create requests for their own applicable requirements. Administration decides and resolves them. Every transition preserves reason/note/actor/time.

## Product surfaces

### Administration — Compliance

Tabs:
- Policies;
- Requirements;
- Evidence;
- Exceptions.

Actions:
- publish policy/version;
- retire policy;
- review evidence;
- approve/decline/resolve exceptions.

### Manager — Compliance

Read-only unit view:
- policies relevant to the unit;
- factual employee acknowledgement/evidence/exception records within managed units.

No score or league table.

### Staff — Compliance

Shows:
- active applicable policies;
- acknowledgement state;
- requirements;
- own evidence/history;
- own exception requests/history.

Actions:
- acknowledge applicable policy;
- submit evidence;
- request an exception.

## Existing Policies & rules screen

The existing `AdminPolicies.jsx` remains a distinct **System rules** surface. Stage 11 does not move human compliance evidence into `policy_rule_versions`.

Navigation should distinguish:
- `System rules` — operational platform configuration;
- `Compliance` — policy/evidence/exception workflow.

## Security

All Stage 11 tables:
- RLS enabled;
- no anonymous privileges;
- no direct authenticated writes;
- reviewed RPC mutation only.

Reviewed browser-callable RPCs:
1. `compliance_record_policy`
2. `compliance_acknowledge_policy`
3. `compliance_submit_evidence`
4. `compliance_review_evidence`
5. `compliance_request_exception`
6. `compliance_exception_action`

Each SECURITY DEFINER RPC:
- binds actor to `auth.uid()`;
- validates org and applicability/authority;
- has fixed `search_path`;
- has no anonymous EXECUTE;
- emits audit/platform events where consequential.

## Guardrails

Never:
- calculate an employee compliance score;
- rank people or units by compliance;
- infer acknowledgement;
- mark evidence verified without an authorised human decision;
- hide rejected/expired/superseded evidence history;
- silently rewrite an approved exception;
- infer that a missing record proves misconduct.

## Stage 11 exit gate

Stage 11 closes only when:
- migration 091 replays cleanly;
- Staff applicability/RLS is proven;
- Manager managed-unit read boundaries are proven;
- Administration policy/evidence/exception authority is proven;
- policy/evidence/exception histories remain append-only;
- acknowledgement is self-bound;
- evidence expiry is factual and visible;
- approved exception + resolution history persists;
- no compliance-score field or UI exists;
- cumulative security/capability/Platform Kernel gates pass;
- Staff/Manager/Admin browser acceptance passes;
- desktop/mobile product-inspection artifacts are generated;
- Stage 11 is merged before Stage 12 begins.
