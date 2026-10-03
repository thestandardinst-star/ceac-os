# Employee Roster & Payroll Completeness — Implementation Sequence

## ERC0 — Control lock and live audit
Reconfirm source staff row count, current profile count and Payroll row counts. Lock the completeness invariant and no-fabrication rules.

Acceptance: source count recorded; omission quantified; branch created from exact protected main.

## ERC1 — Employee master roster independent of auth
Create an employee roster domain whose primary key is independent of `auth.users` / `profiles`.

Required: optional `profile_id` link; identity state (`linked`, `roster_only`, `needs_review`); ordinary employment context; canonical unit memberships independent of authority; programme/responsibility context separate from units; Administration-only mutation path; RLS/RPC boundary.

Acceptance: existing profiles can be backfilled as linked employees; roster-only employee is valid without email/profile; identity ambiguity does not grant or duplicate authority.

## ERC2 — Private staff reconciliation into the employee roster
Use the supplied private workbook outside Git. Create one employee roster record per real staff row; link only confirmed profiles; keep ambiguous identity visible with `needs_review`; keep unmatched/no-email staff as `roster_only`; preserve reviewed unit mappings and programme/responsibility distinctions; do not fabricate emails or auth identities.

Acceptance: source rows = 18; represented employees = 18; unaccounted source rows = 0; fabricated emails = 0; fabricated auth users = 0; capability changes = 0 unless separately owner-authorised.

## ERC3 — Administration People uses the employee roster
Replace profile-only population assumptions on the Administration People surface. Roster shows all employees, linked-account state, unit/title/responsibility context, and truthful operational states when no profile exists.

Acceptance: Admin People count reconciles to roster count; roster-only employees open a factual employee workspace; no login account is required merely to represent an employee.

## ERC4 — Protected HR subject model supports roster-only employees
Extend identifiers, employment terms, compensation, payment details and documents so the canonical subject can be an employee roster record, with optional linked profile for compatibility.

Acceptance: protected HR can be recorded for a roster-only employee; direct browser table access remains denied; linked-profile behavior remains compatible.

## ERC5 — Payroll population uses employees, not profiles
Repair Payroll so a run includes the employee roster population. Payroll entries reference employee IDs; compensation/payment lookup uses employee subject; missing values become factual flags; roster-only employees are not silently omitted; prepare/approve separation and approved-run immutability remain intact.

Acceptance: a draft run contains the complete active employee roster population; no employee is skipped because they lack an account; unresolved compensation/payment details are visible as flags, not invented.

## ERC6 — Administration Payroll workspace completeness
Make the Admin Payroll workspace useful before any run exists and while protected data is incomplete. Show roster readiness, employee count, compensation/payment completeness and identity-review count.

Acceptance: empty Payroll does not look like missing functionality; Administration can see exactly what is configured and what remains unrecorded.

## ERC7 — Hard completeness gates and release verification
Add tests that fail if employee completeness can regress.

Required gates: employee roster independent from profiles; no-fabrication rule; Payroll uses employee IDs; People uses employee roster RPC; protected HR supports employee subjects; exact counts verified after private import; Staff/Manager authority remains unchanged.

Production acceptance: source staff rows 18; employee roster records 18; linked profiles = confirmed links only; ambiguous rows visibly flagged; roster-only rows retained; unaccounted rows 0; all core technical gates green.
