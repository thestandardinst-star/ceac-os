# Migrations

The live schema lives in Supabase project `efjljhftsesssumtshvp`.

Live migrations **001–044** are currently applied.

## Repository coverage

The repository now contains the historical SQL for **all live migrations 001–044**.

On 20 September 2026, migrations 001–033 were recovered directly from Supabase's own `supabase_migrations.schema_migrations.statements` registry. They were not reconstructed from the current schema; repository-only trailing whitespace was normalised where required by CI. Migrations 034–039 were already committed as the emergency security-hardening batch.

This closes the previous migration-recoverability gap.

See:
- `docs/security/CEAC_OS_Security_Hardening_2026-09-20.md`
- `docs/security/CEAC_OS_Backend_Reconciliation_Baseline_2026-09-20.md`

## Migration rule

Before adding another migration:
1. inspect the live migration list;
2. confirm the repository contains the same latest migration;
3. never reuse a migration number;
4. never recreate or overwrite an applied migration;
5. apply new DDL only through a new migration file;
6. run RLS/security acceptance after every security-sensitive migration.

The next migration number is **045**.


## 20 September backend continuation

Applied and committed after the reconciliation baseline:

- **040** — authority hardening for official unit membership/roles, sub-team membership/lead authority, and project-close child writes.
- **041** — atomic Manager approval/return path, authoritative work activity, and reasoned approved-work reopen.
- **042** — typed-work extension schema and RLS.
- **043** — typed-work creation/state contracts for Routine, Case, Request, Decision, Meeting outcome and Deliverable.
- **044** — routine schedule-version fix found by rollback acceptance.

All typed-work acceptance data was created inside transactions that ended with `ROLLBACK`.
