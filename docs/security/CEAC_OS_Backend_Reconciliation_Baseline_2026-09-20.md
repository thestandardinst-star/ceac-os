# CEAC OS — Live Backend Reconciliation and Security Baseline

**Date:** 20 September 2026  
**Supabase project:** `efjljhftsesssumtshvp`  
**Scope:** read-only live reconciliation before any new backend migration  
**Database changes in this baseline:** none

## Migration reconciliation
The live migration registry contains **39 applied migrations, 001–039**, with no numbering gap.

Before this baseline, GitHub contained only 034–039. Supabase still retained the exact SQL for every historical migration in `supabase_migrations.schema_migrations.statements`. Migrations **001–033 were recovered verbatim from that registry** and committed to this branch. No SQL was reconstructed from schema inference.

GitHub now contains all **39** live migration files. This closes the known recoverability gap.

## Live schema posture
- Public tables: **60**
- Public tables with RLS enabled: **60**
- Storage buckets: **none**
- Active cron jobs:
  - every 5 minutes: `SELECT app_heartbeat();`
  - daily at 08:00: `SELECT app_run_daily();`

Supabase reports RLS enabled but no policy on:
- `objective_ref_counters`
- `work_ref_counters`

That is consistent with their current RPC-only use.

## SECURITY DEFINER baseline
Live public schema:
- SECURITY DEFINER functions: **34**
- executable by `authenticated`: **27**
- executable by `anon`: **0**
- executable by `PUBLIC`: **0**

Every inspected SECURITY DEFINER function has explicit `search_path=public`.

The authenticated-executable set includes RLS/read helpers and intended client RPCs. Supabase correctly flags this surface for review, but authenticated EXECUTE must not be blindly revoked from helpers used inside RLS policies.

Background job functions, `app_run_daily`, `finance_request_path` and `handle_new_user` are not executable by ordinary authenticated users.

## Verified protections
- profile self-update trigger blocks changes to official employment/access fields by ordinary users;
- `activity_events` has no client write policy;
- `operation_occurrences` remains append-only from the client;
- anonymous/public execution of SECURITY DEFINER functions is revoked;
- reference-generator RPCs validate caller context;
- project-close, report and finance RPCs contain organisation/authority checks.

## Security findings before typed-work expansion

### BLOCKER A — official unit membership / role authority
`unit_memberships.memberships_manager_write` is currently `FOR ALL` for Administration **or a manager of the unit**.

A unit manager can therefore insert, update or delete official unit memberships in a unit they manage, including the membership `role`.

The approved 20 September architecture makes official **unit membership** an Admin & HR controlled field. The client no longer exposes these controls, but client absence is not a security boundary.

### BLOCKER B — sub-team membership / lead authority
Current live RLS allows unit managers to write `sub_team_members`, and managers can update `sub_teams`, including its lead field.

The newer architecture makes **sub-team membership / lead** HR-controlled, while the older build brief still allows managers to manage the **lane structure** itself.

The next hardening migration should preserve manager create/rename/reorder/remove of sub-team lanes while reserving official membership/lead assignment for Admin & HR.

### BLOCKER C — project-close child rows are writable too broadly
These draft child tables:
- `project_close_objectives`
- `project_close_costs`
- `project_close_deliverables`

currently permit writes when the referenced close is merely a draft.

Because `project_closes.pc_read` permits project-visible users to read close rows, the child write policies do not independently require the caller to be the draft author, responsible unit manager, lead-unit manager or Administration.

The parent draft is more tightly protected than its detail rows. This is a real database-authorisation gap.

## Finance authority question
`decide_finance_request` and `fulfil_finance_request` treat membership in a unit with `handles_finance=true` as Finance authority.

So an ordinary member of that unit can currently satisfy the Finance stage / fulfil an approved request.

Do not silently change this until CEAC confirms whether Finance authority means:
- any Finance-unit member;
- Finance unit head;
- a dedicated capability;
- another named Finance role.

## Supabase advisor findings
1. Two RPC-only reference counter tables have RLS but no direct policies.
2. 27 signed-in callable SECURITY DEFINER functions need deliberate least-privilege review.
3. Leaked-password protection is disabled in Supabase Auth.

## HR/storage baseline
No Storage buckets exist. Protected HR documents therefore are not implemented yet and must not be simulated with public URLs.

## Conclusion
Do **not** begin typed-work, Templates or protected-HR migrations yet.

The next migration should be a narrow authority-hardening package that:
1. makes official unit membership/role Admin & HR controlled;
2. separates manager sub-team lane management from HR-controlled membership/lead assignment;
3. restricts project-close draft child writes to the authorised close owner/manager/Admin;
4. preserves existing client contracts;
5. is followed by rolled-back acceptance tests for staff, manager, Administration and cross-unit cases.

After that passes, proceed to atomic Manager approval / approved-work reopen, then typed-work.
