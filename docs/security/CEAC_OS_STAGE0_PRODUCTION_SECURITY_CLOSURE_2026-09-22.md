# CEAC OS — Stage 0 Production Security Closure

**Date:** 22 September 2026
**Status:** OPEN — enterprise feature expansion remains blocked
**Baseline main:** `c17edf2dacc0f554f12a7ed2834ecc2afde1b0ce`
**Active branch:** `chatgpt/enterprise-expansion-stage-0-2026-09-22`

## Verified live baseline

- Supabase project: `efjljhftsesssumtshvp` (`ceac-os`), status ACTIVE_HEALTHY.
- Database: PostgreSQL 17.6, region eu-west-1.
- Repository baseline includes migrations through `073_private_meeting_notes`.
- Live Supabase migration history is reconciled through `20260922033628` — `074_reduce_internal_rpc_surface`.
- The repository contains the same canonical history through 074; the earlier 069–073 bookkeeping drift is repaired without replaying migration SQL.
- Every public application table inspected has RLS enabled.
- Public SECURITY DEFINER functions: 96 total.
- Authenticated-callable public SECURITY DEFINER functions: 67 after migration 074.
- Anonymous-callable public SECURITY DEFINER functions: 0.
- Public SECURITY DEFINER functions without fixed `search_path`: 0.
- `ceac-hr-private` exists and is private.
- `anon` and `authenticated` have no USAGE on `hr_private` and no direct SELECT on `hr_private.documents` or `hr_private.audit_events`.
- No direct browser Storage policy currently grants access to `ceac-hr-private`.
- `hr_private.audit_events` has its immutable trigger present.
- No protected-HCM/payroll-like columns are present in `public.profiles`.
- Supabase Security Advisor reports 67 signed-in-callable SECURITY DEFINER warnings after migration 074. Their semantic review is complete and the six internal-only helpers identified in Stage 0 no longer have direct authenticated EXECUTE.
- Supabase Security Advisor also reports leaked-password protection disabled. Current Supabase documentation makes that control available on Pro and above.
- Security Advisor also reports four RLS-enabled/no-policy tables. Two are `hr_private` tables deliberately outside browser schema access; two are reference counters intentionally accessed through authorised RPCs. These remain explicit review items, not automatic defects.
- GitHub repository rulesets endpoint currently returns no rulesets.
- Classic branch-protection state cannot be read by the connected GitHub App because it lacks administration permission.
- GitHub status for exact baseline main `c17edf2dacc0f554f12a7ed2834ecc2afde1b0ce` records a successful Vercel deployment completed at 2026-09-21T23:56:18Z and points to deployment `3eLwR9ZHG6dRELVN2mXP356y2zQb` under scope `thestandardinst-6345s-projects`. The Vercel connector is not authorised to that team scope, so deployment metadata/browser inspection remains open.
- Repository-source credential scan found no committed service-role, Vercel, OpenAI, Anthropic, Google-client-secret or Telegram-bot secret patterns. Live application/database source scanning found no application functions/views with detected embedded secret patterns; the only source matches were Supabase extension helper functions. Both active cron jobs were also checked for common embedded-secret patterns with zero matches. The browser client contains only the expected Supabase publishable key, which is not a server secret.
- The 73 authenticated-callable SECURITY DEFINER functions have now completed semantic classification against current browser RPC use, live RLS-policy references and live function call relationships. See `CEAC_OS_STAGE0_PRIVILEGED_RPC_SEMANTIC_REVIEW_2026-09-22.md`. Six internal-only helpers are candidates for later EXECUTE revocation after migration-history repair; six dormant authority-checked product actions remain retained pending product-use confirmation.

## Code hardening added on this branch

A new `supabase/tests/platform_kernel_gate.sql` is wired into `Quality Gate`.

It blocks:
- public tables without RLS;
- anonymous execution of public SECURITY DEFINER functions;
- SECURITY DEFINER functions without fixed `search_path`;
- deviation from the reviewed post-074 authenticated-callable SECURITY DEFINER surface of 67;
- renewed authenticated execution of the six internal-only helpers removed by 074;
- browser access to `hr_private`;
- a public protected-HR bucket;
- protected HCM/payroll fields in `public.profiles`;
- loss of private Meeting-note policies;
- loss of the decision-only Meeting record contract;
- omission of migration 074 during clean replay.

## CI evidence

- PR #19 reached a head with both CI and the full Quality Gate green after changed-line hygiene correction.
- The Platform Kernel gate passes on clean local migration replay.
- Existing RLS, Admin & HR security, Meeting authority and Playwright role acceptance gates pass in the full Quality Gate.
- New documentation-only commits on this branch must still retain green CI/Quality Gate before merge.

## Hard Stage 0 blockers

Repository/database hardening is complete and all automated gates pass on the current Stage 0 head. The remaining blockers are operational controls that cannot be truthfully closed by repository code alone:

1. **Privileged application-account MFA** — two privileged CEAC OS profiles currently have no verified MFA factor. The affected account holders must enroll MFA; this must then be re-verified.
2. **Backup/restore evidence** — on the current Supabase Free plan, one real production logical dump and a safe non-production restore test still need to be executed and recorded. Storage objects require separate backup handling.
3. **Deployment product inspection** — Vercel reports the current Stage 0 preview as Ready, but the connected Vercel tool is not authorised to the owning team scope, and direct preview fetch is blocked by that protection boundary. A browser inspection by an authorised account is still required.
4. **Credential ownership/recovery evidence** — repository/database scans are clean, but named human ownership/recovery for production credentials remains an account-level verification item.

## Rules until Stage 0 closes

Do not:
- create migration 075 or any Stage 1 enterprise migration;
- add Stage 1 tables;
- add onboarding/device/performance/payroll product features;
- modify live production data to mask migration drift;
- weaken the current Quality Gate or security ceilings.

## Stage 0 exit evidence

Stage 0 closes only when every blocker above has an evidence-backed PASS and the handoff is updated. Stage 1 starts from the reviewed post-Stage-0 main, never from this branch or a stale branch.


## Post-074 live verification

Production migration 074 has been applied and independently verified.

- live migration ledger records `074_reduce_internal_rpc_surface`;
- authenticated-callable public SECURITY DEFINER count is now **67**;
- direct authenticated EXECUTE is false for all six reviewed internal-only helpers;
- Supabase Security Advisor now reports 67 signed-in-callable SECURITY DEFINER warnings instead of 73;
- current final branch gates pass clean replay, Account Security, Platform Kernel/RLS, Meeting authority and Playwright role acceptance.

## Privileged-account MFA finding

Live Auth/profile inspection shows:

- total Auth users: 6;
- confirmed-email users: 6;
- privileged profiles (`is_admin` or `is_exec`): 2;
- privileged profiles with a verified MFA factor: 0;
- privileged profiles without a verified MFA factor: 2.

Stage 0 therefore cannot claim privileged-account MFA closure yet. MFA enrollment must be completed by the affected account holders and then re-verified. This is an account-holder action, not a database migration.

The project remains on Supabase Free. Leaked-password protection remains unavailable on the current plan; this is a documented plan limitation rather than an unverified setting.


## Current automated evidence — 22 September 2026

Current Stage 0 head `033786f2866e855b90291d3b8cc9b613d922a060` has:
- CI — PASS;
- Migration Replay — PASS;
- Account Security — PASS;
- Quality Gate — PASS;
- Vercel deployment status — SUCCESS / Ready.

A fresh Supabase Security Advisor check after 074 confirms 67 authenticated-callable SECURITY DEFINER functions and the four previously-reviewed RLS-enabled/no-policy informational findings. No new Stage 0 database security regression was introduced by 074.
