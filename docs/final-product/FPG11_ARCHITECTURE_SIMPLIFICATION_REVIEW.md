# FPG11 — Selective Architecture Simplification Review

Decision: ACCEPTED — no destructive pre-release deletion.

The programme requires simplification only where no dependency exists and full verification proves removal safe. Current production inspection does not justify destructive cleanup before release.

## Keep decisions
- `public.capabilities` and `public.capability_grants`: both have live rows and function dependencies. Keep.
- `public.platform_events` and `public.platform_audit_events`: both are live and serve different event/audit responsibilities. Keep.
- `public.appraisals`, `public.appraisal_entries`, and appraisal evidence structures: function dependencies remain even where some detail tables are currently empty. Keep.
- `public.employment_records` and `public.employment_history`: current snapshot and attributable history are distinct. Keep.
- workflow/policy engine structures: protected architecture; keep.
- `ceac_reconcile_backup_20260923`: no live function/view dependency was found, but it contains retained reconciliation rollback data. Keep through release; review retention after production closure.
- protected HR, capability authority, platform audit, RLS, integration gateway, Work Engine and finance authority remain protected foundations.

## Simplification already achieved safely
FPG9 removed the old global Manager parity CSS dependency and route-loads the Manager Home parity layer. FPG10 propagated reference grammar through existing Work/People families rather than introducing a new generic component framework.

## Release rule
No schema/table/engine removal will be performed in FPG11. Any future deletion requires a separate post-release dependency proof, retention decision and full verification.
