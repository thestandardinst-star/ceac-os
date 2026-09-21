# Migrations

The live schema lives in Supabase project `efjljhftsesssumtshvp`.

Live migrations **001–066** are currently applied.

## Repository coverage

The repository now contains the historical SQL for **all live migrations 001–066**.

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

The next migration number is **071**.


## 20 September backend continuation

Applied and committed after the reconciliation baseline:

- **040** — authority hardening for official unit membership/roles, sub-team membership/lead authority, and project-close child writes.
- **041** — atomic Manager approval/return path, authoritative work activity, and reasoned approved-work reopen.
- **042** — typed-work extension schema and RLS.
- **043** — typed-work creation/state contracts for Routine, Case, Request, Decision, Meeting outcome and Deliverable.
- **044** — routine schedule-version fix found by rollback acceptance.

All typed-work acceptance data was created inside transactions that ended with `ROLLBACK`.


### 045 — typed-work reconciliation hardening

- linked all five legacy recurring operations into the shared Work Engine;
- preserved explicit Sunday schedules without inventing weekdays for ambiguous legacy `Weekly` records;
- blocked generic status transitions for Routine, Case, Request and Decision;
- enabled legitimate named cross-unit Requests;
- blocked deletion of populated sub-team lanes until HR memberships/work/routines are explicitly moved or cleared.

Rollback acceptance passed before Routine client integration began.


### 046 — review contract hardening

- non-review kinds cannot create generic submission rows;
- Manager approval re-checks Task checklist completion server-side;
- manager self-certification is limited to Task, Meeting outcome and Deliverable;
- Deliverable self-certification enforces required evidence;
- authoritative self-certification activity is recorded.

Rollback acceptance passed before Deliverable client integration.

## Staff experience continuation — migrations 047–054

- **047** — stale work-session recovery plus auditable blocker acknowledgement/dispute/resolution.
- **048** — first-class targeted announcements, read/acknowledgement state and publishing RPCs.
- **049** — announcement policy-recursion correction found during acceptance.
- **050** — unit resources / approved shared reference links with manager/Admin authority.
- **051** — privacy-safe approved-leave visibility for members of the same unit.
- **052** — employee-maintained ordinary personal details with private emergency/address storage.
- **053** — corrected stale-session "continue" semantics: the previous-day session closes at its last confirmed point and a fresh current-day session is created, so overnight gaps are never counted as work.
- **054** — employee personal profile changes must use the attributable personal-details RPC; direct self-update bypass is blocked.

All acceptance records for these migrations were created inside transactions that ended with `ROLLBACK`.

## Staff operating-surface correction — migrations 055–059

- **055** — authoritative attention-state semantics. Stale gone-quiet, overdue and blocker-response alerts retire when the source no longer requires action.
- **056** — historical closed-session reconciliation. Implausible legacy multi-day manual sessions are flagged for employee correction instead of being trusted as working time.
- **057** — session-event compatibility fix found during rollback acceptance.
- **058** — disciplined work-review follow-up: first follow-up after one day, final follow-up after three days, then stop.
- **059** — disciplined blocker/dependency follow-up using the same two-step cadence and attributable activity history.

All acceptance records for 055–059 were created inside transactions ending with `ROLLBACK`.


## Stabilisation gate — migrations 060–066

- **060** — invitation authority hardening and invite-only account creation. Managers may invite Staff only; organisation/unit come from a valid unexpired invitation; direct invitation writes are blocked.
- **061** — canonical Task/Deliverable completed-output view and Admin-only Unit Head assignment.
- **062** — threshold-driven deterministic attention rules with Monday–Friday working-day semantics.
- **063** — project-silence and factual Falling rules based only on explicit comparable report target values.
- **064** — transaction-safe multi-row application writes for Task creation, submission, blockers, project creation, project close, report submission and sub-team reorder.
- **065** — observed hot-path indexes and targeted RLS init-plan optimisations.
- **066** — server-side Administration People aggregation with lazy per-person detail.

Repository timestamps for migrations 047–052 were reconciled to the exact live Supabase registry versions. The SQL bodies matched Supabase's stored migration statements exactly.

A clean local Supabase replay workflow now rebuilds the application schema from the recovered migration history. The one documented pre-ledger live-only test helper required by immutable migration 037 is restored from `supabase/replay/legacy-live-artifacts.sql` before replay.


### 069–070 — collaboration and meeting foundation

- **069** — contextual Unit/Project Rooms with inherited access, append-only messages, object references, mentions, reads and realtime message delivery.
- **070** — secure meeting workspace with organisation/unit/project scope, provider join context, attributable notes/decisions and links back to Work Engine items.

Both migrations preserve the existing Work Engine and role/security boundaries. Provider secrets are not stored in browser-readable tables.
