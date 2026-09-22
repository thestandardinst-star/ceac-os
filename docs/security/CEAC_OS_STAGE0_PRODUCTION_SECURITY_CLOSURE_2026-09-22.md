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
- Supabase Security Advisor reports 73 signed-in-callable SECURITY DEFINER warnings requiring intentional least-privilege review.
- Security Advisor also reports four RLS-enabled/no-policy tables. Two are `hr_private` tables deliberately outside browser schema access; two are reference counters intentionally accessed through authorised RPCs. These remain explicit review items, not automatic defects.
- GitHub repository rulesets endpoint currently returns no rulesets.
- Classic branch-protection state cannot be read by the connected GitHub App because it lacks administration permission.
- Connected Vercel app currently exposes no team/project to this session, so exact Vercel production-deployment verification remains open.

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

## Hard Stage 0 blockers

1. **Migration-history reconciliation** — determine and document how live 069–073 schema was applied and repair migration bookkeeping safely without replaying destructive SQL.
2. **Repository protection** — enforce PR/required-check rules for `main`; connector cannot perform repository-admin writes.
3. **Privileged RPC semantic review** — review all 73 authenticated-callable SECURITY DEFINER functions; inventory file created.
4. **Supabase Auth production settings** — verify leaked-password protection, email confirmation, password policy and privileged-account MFA. Do not guess from database state.
5. **Secrets review** — verify production/service credentials and least scopes without writing secrets into repository documentation.
6. **Backup/restore** — perform and document one safe restore test.
7. **Deployment identity** — connect/inspect the actual Vercel project and tie production deployment to repository commit and database baseline.

## Rules until Stage 0 closes

Do not:
- create migration 074 or any later enterprise migration;
- add Stage 1 tables;
- add onboarding/device/performance/payroll product features;
- modify live production data to mask migration drift;
- weaken the current Quality Gate or security ceilings.

## Stage 0 exit evidence

Stage 0 closes only when every blocker above has an evidence-backed PASS and the handoff is updated. Stage 1 starts from the reviewed post-Stage-0 main, never from this branch or a stale branch.
