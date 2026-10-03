# FPG8 Acceptance — Go-Live Organisation / Staff Reconciliation

Accepted date: 3 October 2026

## Scope accepted

The controlled office-staff source was reconciled using the canonical FPG8 rules without committing private staff rows to Git.

Production-safe apply completed:
- 3 approved organisational units created;
- 2 non-authority additional unit memberships created for one exact existing identity;
- 1 second exact existing identity required no mutation;
- 0 new capability grants;
- 0 fabricated auth identities;
- 0 fabricated email addresses;
- ambiguous identity data remains quarantined;
- unmatched/no-email staff remain roster-only in the private review artifact;
- unresolved programme-only primary-unit context remains roster-only and does not block FPG9;
- all production mutations are represented in platform audit events.

## Authority and safety

FUNCTIONAL CONTRACT PRESERVED: YES
SECURITY/AUTHORITY PRESERVED: YES
PRIVATE STAFF DATA KEPT OUT OF GIT: YES
NO FABRICATED IDENTITIES/EMAILS: YES
AMBIGUOUS RECORDS QUARANTINED: YES
FPG9 UNBLOCKED: YES

The existing valid accounts were preserved. Source position/title wording did not create manager, protected-HR, payroll, approval or other capability authority.

## Evidence

Application verification before apply:
- CI PASS;
- Migration Replay PASS;
- Account Security PASS;
- Level B SQL/authority PASS;
- browser shards 1–4 PASS;
- exact-head evidence merge PASS;
- role-and-RLS closure PASS;
- Quality Gate PASS.

Production verification after safe apply:
- Staff Development, Staff Chaplaincy and Compliance are active units;
- the exact matched manager profile retains its existing manager membership and now has two additional `staff` memberships only;
- the second exact matched profile retains its existing membership/authority unchanged;
- capability grants for the reconciled exact identities were unchanged;
- 3 unit-creation and 2 membership-creation FPG8 audit events were recorded.

The updated private reconciliation workbook remains outside Git.
