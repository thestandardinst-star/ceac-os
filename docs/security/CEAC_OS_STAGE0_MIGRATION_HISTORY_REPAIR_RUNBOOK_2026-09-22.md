# CEAC OS — Stage 0 Migration History Repair Runbook

**Date:** 22 September 2026
**Status:** READY FOR CONTROLLED EXECUTION
**Scope:** Supabase migration-history bookkeeping only
**Production project:** `efjljhftsesssumtshvp`

## Why this repair is required

The repository and live database contain the same executable SQL for migrations 069–072, but the live migration ledger recorded those migrations under later timestamps.

Repository timestamps:

- `20260921100000` — 069 contextual_rooms
- `20260921103000` — 070 meeting_workspace
- `20260921120000` — 071 collaboration_audiences
- `20260921144500` — 072 meeting_participant_authority
- `20260921211500` — 073 private_meeting_notes

Current live ledger timestamps:

- `20260921104504` — contextual_rooms
- `20260921104507` — meeting_workspace
- `20260921122506` — collaboration_audiences
- `20260921153116` — meeting_participant_authority
- no migration-history row for 073

## Evidence collected before repair

### 069–071

The SQL stored in `supabase_migrations.schema_migrations.statements[1]` is an exact normalized text match with the corresponding repository migration file.

### 072

After removing comments and normalizing whitespace/case, the live executable SQL is an exact match with the repository migration.

### 073

Although its migration-history row is absent, the live database already contains the expected 073 state:

- `public.meeting_private_notes` exists;
- author index exists;
- unique meeting/author constraint exists;
- exactly three private-note RLS policies exist;
- authenticated has SELECT/INSERT/UPDATE but not DELETE;
- shared `meeting_records` are decision-only;
- no non-decision shared meeting rows remain.

Therefore this repair must change migration bookkeeping only. It must not execute 069–073 SQL again.

## Supported Supabase repair mechanism

Supabase's documented recovery mechanism is:

```bash
supabase migration repair --status applied <migration-timestamp>
supabase migration repair --status reverted <migration-timestamp>
```

`migration repair` updates migration history only. It does not run or roll back the migration SQL.

Do not repair this by manually editing `supabase_migrations.schema_migrations`.

## Preconditions

Before executing:

1. Use a machine/session authenticated to the CEAC Supabase account.
2. Check CLI version with `supabase --version`.
3. Run `supabase migration repair --help` and confirm current syntax.
4. Link to the production project explicitly.
5. Run `supabase migration list` and save the output as evidence.
6. Confirm the linked project ref is exactly `efjljhftsesssumtshvp`.
7. Do not run `supabase db push` before the ledger is repaired.

## Repair sequence

Mark the incorrectly timestamped live history rows as reverted:

```bash
supabase migration repair --status reverted 20260921104504
supabase migration repair --status reverted 20260921104507
supabase migration repair --status reverted 20260921122506
supabase migration repair --status reverted 20260921153116
```

Mark the repository-canonical timestamps as applied:

```bash
supabase migration repair --status applied 20260921100000
supabase migration repair --status applied 20260921103000
supabase migration repair --status applied 20260921120000
supabase migration repair --status applied 20260921144500
supabase migration repair --status applied 20260921211500
```

Do not run the migration SQL during this repair.

## Immediate verification

After the repair:

```bash
supabase migration list
```

Required result:

- repository and remote migration timestamps align through 073;
- no extra 069–072 alternate timestamps remain;
- 073 is shown as applied remotely;
- no migration is unexpectedly pending.

Then re-run the live read-only checks:

- `meeting_private_notes` still exists;
- three private-note policies remain;
- shared meeting records remain decision-only;
- protected HR boundary remains unchanged;
- authenticated SECURITY DEFINER count is unchanged until the later Stage 0 hardening migration.

## Failure handling

If any repair command produces a result different from the expected ledger-only change:

- stop;
- do not run `db push`;
- do not manually edit the migration table;
- capture `supabase migration list`;
- compare repository and remote state again before taking another action.

## Stage 0 consequence

No new migration number may be created until this repair is completed and verified.

Once the ledger is aligned, the next Stage 0 database change may be created as a normal reviewed migration to reduce direct authenticated execution of internal-only privileged helper functions.
