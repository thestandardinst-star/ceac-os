# Employee Roster & Payroll Completeness Fix

## Purpose

Repair the gap where CEAC treated authenticated `profiles` as the employee master record, causing roster-only staff to disappear from Administration People and Payroll.

This corridor is corrective. It must preserve the accepted FPG security, authority, audit, Work, Finance and visual foundations.

## Non-negotiable rules

- An employee record does not require a login account.
- Never fabricate emails or auth users.
- Existing valid profiles/accounts are linked, never duplicated.
- Ambiguous identity matches remain visible as employees and are flagged for review; ambiguity must not erase the employee.
- Job-title wording never grants system authority.
- Payroll authority remains Administration prepares -> Group Pastor approves.
- Protected HR/payroll data remains behind capability-checked RPCs and protected storage.
- Source staff rows remain private and are not committed to Git.
- No employee source row may disappear merely because identity/email is unresolved.
- No salary, bank, identifier or other protected value is invented.

## Canonical completeness invariant

For the supplied CEAC staff structure:

- source staff rows: 18;
- every source row must map to exactly one employee roster record or an explicitly quarantined duplicate candidate;
- unresolved login/email state is allowed;
- unaccounted source rows must equal 0.

The product must distinguish employee identity, optional linked login/profile, organisational memberships, authority/capabilities, and protected HR/payroll records.

## Writer rule

One active writer on this branch. GitHub is canonical. Re-fetch before writes and reconcile forward; never reset, force-push, or revert newer work.
