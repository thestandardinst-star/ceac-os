# Migrations

The live schema lives in Supabase project `efjljhftsesssumtshvp`.

Live migrations **001–039** are currently applied.

## Repository coverage

The repository still does **not** contain the historical SQL for migrations 001–033. That remains a recoverability gap and must be reconciled/exported.

Emergency security migrations 034–039 were applied on 20 September 2026 after a live privilege-escalation defect was verified. Their exact applied SQL is committed in this directory:

- 034 profile self-update guard
- 035 profile visibility and activity hardening
- 036 append-only routines and report scope
- 037 background job security
- 038 revoke public helper execution
- 039 harden reference/helper RPCs

See `docs/security/CEAC_OS_Security_Hardening_2026-09-20.md` for the verified findings and acceptance results.

## Filling the historical gap

When a machine/session has appropriate Supabase CLI access:

```bash
npx supabase login
npx supabase link --project-ref efjljhftsesssumtshvp
npx supabase db pull
git add supabase/migrations
git commit -m "Reconcile applied Supabase migrations"
git push
```

Do not blindly overwrite the committed 034–039 files. Compare exported SQL with the recorded migration history and reconcile intentionally.

## Migration ownership

Claude remains the normal migration owner.

The 20 September 034–039 batch was an explicit emergency exception because a live privilege-escalation vulnerability had been verified while Claude was unavailable.

Before adding another migration, inspect the live migration list first. Never reuse a migration number or recreate 031–039.
