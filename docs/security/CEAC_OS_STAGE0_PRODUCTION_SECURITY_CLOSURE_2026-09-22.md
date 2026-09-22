# CEAC OS — Stage 0 Production Security Closure

**Date:** 22 September 2026
**Status:** OPEN — enterprise feature expansion remains blocked
**Baseline main:** `c17edf2dacc0f554f12a7ed2834ecc2afde1b0ce`
**Active branch:** `chatgpt/enterprise-expansion-stage-0-2026-09-22`

## Verified live baseline

- Supabase project: `efjljhftsesssumtshvp` (`ceac-os`), status ACTIVE_HEALTHY.
- Database: PostgreSQL 17.6, region eu-west-1.
- Repository baseline includes migrations through `073_private_meeting_notes`.
- Live Supabase migration history currently ends at `meeting_participant_authority` (072).
- Live schema nevertheless contains the 073 `meeting_private_notes` table and the decision-only `meeting_records` constraint.
- Live migration-history versions for contextual Rooms through meeting authority do not match the timestamped filenames currently stored in GitHub. This is migration-history drift and must be reconciled before any new migration is introduced.
- Every public application table inspected has RLS enabled.
- Public SECURITY DEFINER functions: 96 total.
- Authenticated-callable public SECURITY DEFINER functions: 73.
- Anonymous-callable public SECURITY DEFINER functions: 0.
- Public SECURITY DEFINER functions without fixed `search_path`: 0.
- `ceac-hr-private` exists and is private.
- `anon` and `authenticated` have no USAGE on `hr_private` and no direct SELECT on `hr_private.documents` or `hr_private.audit_events`.
- No direct browser Storage policy currently grants access to `ceac-hr-private`.
- `hr_private.audit_events` has its immutable trigger present.
- No protected-HCM/payroll-like columns are present in `public.profiles`.
- Supabase Security Advisor reports 73 signed-in-callable SECURITY DEFINER warnings. Their semantic review is complete; permission reduction remains deferred until migration-history repair.
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
- growth beyond the reviewed 73 authenticated-callable definer ceiling without explicit review;
- browser access to `hr_private`;
- a public protected-HR bucket;
- protected HCM/payroll fields in `public.profiles`;
- loss of private Meeting-note policies;
- loss of the decision-only Meeting record contract;
- omission of migration 073 during clean replay.

## CI evidence

- PR #19 reached a head with both CI and the full Quality Gate green after changed-line hygiene correction.
- The Platform Kernel gate passes on clean local migration replay.
- Existing RLS, Admin & HR security, Meeting authority and Playwright role acceptance gates pass in the full Quality Gate.
- New documentation-only commits on this branch must still retain green CI/Quality Gate before merge.

## Hard Stage 0 blockers

1. **Migration-history reconciliation** — determine and document how live 069–073 schema was applied and repair migration bookkeeping safely without replaying destructive SQL.
2. **Repository protection** — enforce PR/required-check rules for `main`; connector cannot perform repository-admin writes.
3. **Privileged RPC remediation** — semantic review is complete. Six internal-only helpers are candidates for direct authenticated EXECUTE revocation, but no permission migration may be created until migration-history repair is complete.
4. **Supabase Auth/plan decision** — Security Advisor confirms leaked-password protection is disabled. The organisation is on Free, and Supabase documents leaked-password protection as Pro-and-above. Email/password configuration and privileged-account MFA still require dashboard/account verification.
5. **Secrets/ownership review** — repository and live database source scans found no application secret pattern; there are no Edge Functions and the two cron jobs contain no detected embedded secret pattern. Account-level production credential ownership/recovery still requires human verification.
6. **Backup/restore** — the organisation is on Free; Supabase does not provide automatic daily backups on this plan and recommends off-site CLI database exports. The runbook is ready, but one real production dump and safe non-production restore still must be executed.
7. **Deployment inspection** — exact main SHA is tied to a successful Vercel deployment through GitHub status metadata. The connected Vercel account lacks authorisation to the deployment team scope, so exact deployment metadata and browser product inspection remain open.

## Rules until Stage 0 closes

Do not:
- create migration 074 or any later enterprise migration;
- add Stage 1 tables;
- add onboarding/device/performance/payroll product features;
- modify live production data to mask migration drift;
- weaken the current Quality Gate or security ceilings.

## Stage 0 exit evidence

Stage 0 closes only when every blocker above has an evidence-backed PASS and the handoff is updated. Stage 1 starts from the reviewed post-Stage-0 main, never from this branch or a stale branch.
