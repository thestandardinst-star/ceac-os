# CEAC OS — Stage 0 Backup and Restore Runbook

**Date:** 22 September 2026
**Status:** PROCEDURE READY — execution blocked by current production-access/plan constraints
**Production project:** `efjljhftsesssumtshvp`

## Current platform fact

The Supabase organisation is currently on the **Free** plan.

Supabase's current backup documentation states:

- automatic daily platform backups are provided for Pro, Team and Enterprise projects;
- Free projects should regularly export their database using the Supabase CLI and keep an off-site copy;
- Storage objects are not contained in a database backup and must be protected separately.

CEAC OS therefore must not treat Supabase-managed daily backup/restore as available while the production project remains on Free.

## Stage 0 backup requirement

Before Stage 0 closes, CEAC OS needs evidence that a recoverable production snapshot can be created and restored without touching production.

For the current Free-plan architecture, the minimum acceptable procedure is:

1. create a logical dump of the production database using the supported Supabase/Postgres tooling;
2. store the dump outside the production project;
3. restore the dump into a disposable local Postgres/Supabase environment or another explicitly approved non-production target;
4. verify critical application objects after restore;
5. destroy the disposable restore target;
6. record date, source project, backup method, restore target and verification result without storing credentials in the repository.

## Restore verification

The restore test must verify at least:

- application migrations/schema are present;
- `public.organisations`, `profiles`, `units`, `work_items`, `projects` and reporting structures are readable;
- protected `hr_private` schema exists and remains outside browser-role access;
- `meeting_private_notes` exists;
- shared `meeting_records` remain decision-only;
- the `ceac-hr-private` Storage bucket configuration is documented separately because database backup does not restore Storage objects;
- no production credentials are copied into the restore target.

The restore test is a recovery test, not a staging environment and not a place for real-user activity.

## Current blocker

The connected Supabase tool can inspect the live database but does not expose the supported database-dump/backup-management operation needed for this test.

The existing GitHub Actions workflows run only local Supabase instances and do not contain a production Supabase access path. They therefore cannot safely produce a production backup today.

Do not solve this by embedding production passwords or access tokens in a workflow, source file, issue, PR or chat.

## Paid-plan alternative

If CEAC later upgrades the production Supabase organisation, Supabase-managed scheduled backups become available according to the selected plan. A restore test should still be performed against a safe non-production target before relying on the process operationally.

## Completion evidence

This Stage 0 item remains OPEN until one real production dump and one successful non-production restore have been completed and recorded.
