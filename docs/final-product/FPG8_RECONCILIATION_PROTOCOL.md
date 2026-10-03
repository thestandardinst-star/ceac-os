# FPG8 — Go-Live Organisation / Staff Reconciliation Protocol

Status: SAFE SUBSET APPLIED / COMPLETE FOR GO-LIVE RECONCILIATION
Source authority: `CEAC OFFICE-STAFF STRUCTURE.xlsx` supplied privately by the product owner.
Repository privacy rule: staff rows from that workbook must not be committed to Git.

## Purpose

FPG8 reconciles the controlled office-staff source against existing CEAC OS identities and organisation structure without duplicating valid accounts, inventing emails, turning programmes into departments, or granting authority from job-title wording.

This is a reconciliation process, not a bulk-user import.

## Canonical classification rules

Use `GO_LIVE_ORG_MAPPING.md` as the only organisational classification authority.

- Staff Development → unit.
- Staff Chaplaincy → unit.
- Compliance → unit.
- Leadership Academy → programme, not unit.
- Healing Streams → programme/campaign, not unit.
- Model Church → branch responsibility under PFCC context, not unit.
- Wonder Church → branch responsibility under PFCC context, not unit.
- OFGP Action Manager → role/responsibility under the appropriate secretariat context, not unit.
- Multiple real unit relationships become multiple unit memberships; never create compound departments.

## Identity matching

1. Normalise only harmless title/punctuation differences.
2. Exact normalised name → existing-profile candidate.
3. Same-surname non-exact match → possible duplicate for human review, never automatic merge.
4. No credible match → unmatched roster row.
5. Existing valid accounts are preserved and reconciled; they are not recreated.

Email is not inferred from a name, unit, existing naming convention, or domain.

## Authority rule

Source position/title is context only.

Words such as Manager, Head, Supervisor, Officer, Assistant or Admin do not grant:
- role elevation;
- capability grants;
- protected-HR access;
- payroll authority;
- approval authority.

Existing `unit_memberships`, `capability_grants`, protected-HR rules and audited employment-change RPCs remain authoritative.

## Dry-run output

For every source row, the private review artifact must show:
- identity status;
- existing candidate(s), if any;
- proposed canonical unit memberships;
- programme/branch/role responsibility context;
- source-email state;
- auth action;
- authority action;
- approved new-unit requirements;
- blockers;
- reviewer decision.

The repository module `scripts/final-product/fpg8-reconciliation.mjs` only builds this plan. It deliberately exports no production-apply function.

## Apply gate

Production mutation is prohibited until the reviewed apply step resolves all applicable items:

1. confirm exact identity matches;
2. resolve possible duplicates;
3. provide real work email for any account to be activated/invited;
4. confirm a primary office unit where source data contains programme/responsibility context only;
5. approve creation of any approved-but-not-yet-live unit;
6. review all proposed multiple-unit memberships;
7. review employment/job-title changes separately from authority;
8. explicitly confirm production apply scope.

Any unresolved row remains roster-only.

## Current private dry-run summary

The current source contains:
- 18 staff rows;
- 2 exact production profile matches;
- 1 possible duplicate requiring review;
- 15 rows without an exact production profile match;
- 0 source email addresses;
- 3 approved unit classifications not yet live;
- 1 row without a confirmed primary office unit because the source supplies programme context only;
- 0 new auth accounts proposed now.

The actual staff-row review workbook remains outside Git.

## Acceptance boundary

FPG8 implementation is accepted only when:
- the dry-run engine and safety tests pass;
- no staff private data is committed;
- the private dry-run has been reviewed;
- any production apply is limited to explicitly reviewed rows;
- no authority is inferred from job title;
- no fake email/auth identity is created.

Until the private review is approved, the apply portion of FPG8 remains blocked by design.


## Owner-authorized safe apply — 3 October 2026

The product owner explicitly authorised every FPG8 change already covered by canonical rules, required genuinely ambiguous identities to remain quarantined, prohibited fabricated identities/emails, and authorised FPG9 to proceed without waiting on unresolved individual roster rows.

Applied production-safe subset:
- three already-approved units were created: Staff Development, Staff Chaplaincy and Compliance;
- one exact existing profile received two additional unit memberships as `staff` only; its pre-existing manager authority was preserved;
- the second exact existing profile required no production mutation because its canonical unit/authority already matched;
- zero capability grants were added, removed or inferred from source title wording;
- zero auth identities or email addresses were fabricated;
- the genuinely ambiguous identity row remains quarantined with no merge/update;
- unmatched no-email rows remain roster-only in the private reconciliation evidence;
- the programme-only row with no confirmed primary office unit remains roster-only and does not block FPG9;
- production mutations were recorded in `platform_audit_events`.

The repository reconciliation module intentionally remains dry-run only; this controlled apply was performed as a reviewed, explicitly scoped production operation rather than by introducing a generic bulk-import function.
