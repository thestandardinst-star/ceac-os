# CEAC OS — Emergency Security Hardening

**Date:** 20 September 2026  
**Live Supabase:** `efjljhftsesssumtshvp`  
**Status:** migrations 034–039 applied and acceptance-tested  
**Reason for exception:** Claude was unavailable and a live privilege-escalation defect was verified. Security was prioritised before further client building.

## What was verified before the patch

The pressure test found:

1. A normal signed-in user could update their own `profiles.is_admin` flag and become an administrator.
2. `activity_events` was organisation-readable and accepted client inserts with an arbitrary `actor_id`, allowing activity impersonation/fabrication.
3. `operation_occurrences` used a broad ALL policy, so routine history could be changed or deleted.
4. Project report read policy could expose another participating unit's project report merely because the project was visible.
5. Background security-definer jobs were callable by normal authenticated users and several had mutable `search_path`.
6. Public/anonymous users retained EXECUTE on several RLS helper functions.
7. Reference/version helper RPCs could be called outside the caller's authorised unit/project context.
8. The auth trigger helper and finance approval-path helper were unnecessarily callable by authenticated users.

All destructive/security tests were run in transactions and rolled back.

## Applied migrations

### 034 — profile self-update guard

Adds a BEFORE UPDATE guard on `profiles`.

A normal user may not change official identity/employment/access fields such as:

- organisation
- official full name
- email
- job title
- start/joined dates
- contract type
- `is_admin`
- `is_exec`
- active state
- created timestamp

Administration retains its existing authorised write path. The current ordinary self-editable profile fields are phone and birthday.

**Important:** do not add sensitive HR fields to `profiles`. New columns are not magically classified by this trigger. The approved employee/HR architecture requires protected HR data in separate contracts/tables.

### 035 — profile visibility and authoritative activity

Removes the previous shared-project profile-row path. It was described as "names only" but row-level security exposed the entire profile row.

`activity_events` is now read only when the caller is entitled to the underlying work/project/objective/unit/sub-team, is the actor, or is Administration.

There is no authenticated client INSERT policy for `activity_events`. Authoritative activity must be written by server-side RPCs/triggers.

### 036 — append-only routine history and project-report scope

Application users may insert routine occurrences for their authorised unit, attributed to themselves.

Application users cannot directly update or delete occurrence history.

Project reports are readable by a manager only for the manager's own unit. Project visibility alone no longer reveals another unit's report.

### 037 — background job security

The daily checks and heartbeat now have fixed `search_path`.

Normal authenticated users and anonymous users cannot invoke:

- `app_check_blockers`
- `app_check_gone_quiet`
- `app_check_overdue`
- `app_heartbeat`
- `app_run_daily`

They remain executable by the service role / trusted scheduled context.

The exposed `test_as` helper was removed from normal API execution.

### 038 — anonymous helper execution

Anonymous execution was removed from RLS helper functions. Authenticated/service execution remains where those helpers are required by policy evaluation.

### 039 — reference/helper RPC authorisation

`next_work_ref`, `next_objective_ref` and `next_close_version` now validate the caller's unit/project authority before reading/updating counters.

`finance_request_path` and `handle_new_user` are no longer callable directly by normal authenticated users.

## Acceptance results

After the patch:

- attempted self-promotion to Admin → **blocked (SQLSTATE 42501)**; user remained non-admin;
- direct client insert into `activity_events` → **blocked**;
- unrelated private Admin activity event read by normal staff → **0 rows visible**;
- authorised project manager can still read the project's authoritative reopen event → **works**;
- authorised routine occurrence insert → **works**;
- direct routine occurrence update → **0 rows updated**;
- direct routine occurrence delete → **0 rows deleted**;
- Frank/Media can still see Media profiles required by the current UI → **works**;
- Frank cannot see Facility profiles → **0 rows**;
- own-unit work reference generation → **works**;
- another-unit reference generation → **blocked**;
- background job EXECUTE for authenticated users → **removed**;
- anonymous EXECUTE on the audited RLS helpers → **removed**.

## Supabase security advisor after patch

The previous mutable-search-path warnings for the background functions were cleared.

Remaining advisor categories:

1. `work_ref_counters` and `objective_ref_counters` have RLS enabled with no direct policies. This is intentional: application access is through the now-authorised definer reference functions, not direct table access.
2. The advisor still lists authenticated SECURITY DEFINER functions. Many are intentionally callable application RPCs or RLS helpers and contain their own authority checks. They still need a formal least-privilege review before final production sign-off.
3. Leaked-password protection remains disabled in Supabase Auth. The current connector cannot change this Auth setting; enable it in the Supabase Auth password-security settings before real-user rollout.

## What still belongs to Claude

Claude should not recreate migrations 034–039. They are already live and committed to the repository.

When Claude returns, its security/backend pass should:

1. reconcile/export the still-missing exact live SQL for migrations 001–033, especially 031–033;
2. perform a formal least-privilege audit of every remaining authenticated SECURITY DEFINER function;
3. design the approved employee/HR data split before Ghana Card, SSNIT, tax or banking fields are added;
4. build protected Storage/RLS for HR documents;
5. create an attributable correction/reversal path for routine occurrences rather than re-enabling direct UPDATE/DELETE;
6. define server-side activity logging for new typed-work/template/HR events;
7. complete the already-known approved-work reopen/reversal, Messages, report semantic-scope validation and Finance reversal contracts.

## Build rule after this patch

Client-only work may continue against the existing authorised contracts.

Do not build UI that depends on:

- sensitive HR fields in `profiles`;
- direct client writes to `activity_events`;
- direct routine-history editing/deletion;
- another unit's project report;
- direct background-job RPC calls.

Security remains a database contract, not a UI convention.
