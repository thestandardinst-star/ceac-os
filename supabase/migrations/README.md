# Migrations

The live schema lives in Supabase project `efjljhftsesssumtshvp`.

Repository migrations **001–073** are the canonical application history.

## Repository coverage

The repository contains immutable migration files through **073 — private meeting notes**. The live schema contains the effects of 073, but the live Supabase migration ledger currently records alternate timestamps for 069–072 and has no 073 row. This is a bookkeeping drift, not missing live schema.

Do not add migration 074 until the ledger is reconciled using Supabase's supported migration-history repair mechanism. See `docs/security/CEAC_OS_STAGE0_MIGRATION_HISTORY_REPAIR_RUNBOOK_2026-09-22.md`.

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

The migration-history reconciliation is now complete and verified through 073. Migration **074** is the current Stage 0 hardening migration on PR #19; no later migration should be created until 074 passes all gates and is applied/verified.


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


### 069–073 — collaboration and meeting authority

- **069** — contextual Unit/Project Rooms with inherited access, append-only messages, object references, mentions, reads and realtime message delivery.
- **070** — secure meeting workspace with organisation/unit/project scope, provider join context, attributable records and links back to Work Engine items.
- **071** — collaboration audiences, including Sub-team Rooms and explicit meeting audiences.
- **072** — meeting participant authority hardening.
- **073** — private meeting notes separated from shared decision records; shared meeting records are decision-only.

The repository timestamps for 069–073 are canonical. Production currently has the correct 073 schema state but its migration ledger does not yet match those canonical timestamps. No migration SQL should be replayed merely to repair that ledger.


### 074 — reduce internal privileged RPC surface

Migration `20260922032000_074_reduce_internal_rpc_surface.sql` removes direct `authenticated` EXECUTE from six reviewed internal-only SECURITY DEFINER helpers while preserving service-role/owner execution:

- `app_can_publish_announcements()`
- `app_threshold(uuid,text,numeric)`
- `next_close_version(uuid,text,uuid)`
- `next_work_ref(uuid,uuid)`
- `submit_project_close(uuid)`
- `submit_report(uuid,jsonb)`

The Platform Kernel gate now requires the reviewed authenticated SECURITY DEFINER surface to be exactly 67 and explicitly fails if any of those six helpers remains directly executable by `authenticated`.
