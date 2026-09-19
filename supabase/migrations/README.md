# Migrations

The live schema lives in Supabase project `efjljhftsesssumtshvp`.
Migrations 001–029 are applied there.

## This directory is currently empty, and that is a real gap

The schema exists only in Supabase. It is not reviewable in git, not
diffable in a pull request, and not restorable from this repository.

That is the same failure that cost this project several days in
September: the application source existed only on Vercel, so when a
session ended the code was gone. The schema is in that position now.

## Filling it — one command, run locally

Claude applies migrations through the Supabase connector and cannot run
the Supabase CLI: its sandbox has no network route to supabase.com.
Pulling them down has to happen on a machine that does.

```bash
npx supabase login
npx supabase link --project-ref efjljhftsesssumtshvp
npx supabase db pull          # writes every applied migration into this folder
git add supabase/migrations && git commit -m "Export applied migrations" && git push
```

`db pull` is read-only. It does not change the database.

## After that

Claude keeps applying migrations through the connector, because that is
where the checks happen — inspecting live policies and data before
changing them. Re-run `db pull` after a batch of migrations so the
repository keeps up.

Ask Claude before adding a migration. Two agents numbering independently
will collide.
