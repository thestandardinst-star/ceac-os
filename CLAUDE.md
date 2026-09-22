# CEAC OS — Claude continuation instructions

Before changing this repository, read `AGENTS.md` in full. It contains the binding product, security and build rules for CEAC OS.

For the enterprise expansion, also read:
1. `docs/handoff/CEAC_OS_ENTERPRISE_EXPANSION_HANDOFF_2026-09-22.md`
2. `docs/architecture/CEAC_OS_Enterprise_Expansion_Architecture_2026-09-22.md`
3. the architecture/security document for the current stage.

The stage sequence in `AGENTS.md` is binding. Do not skip, stack or parallelise stages. Inspect GitHub first, treat `main` as the source of truth, and never start stage N+1 until stage N is fully green, product-inspected and merged into `main`.

Do not infer missing CEAC policy. Payroll remains blocked until CEAC's payroll rules are formally confirmed.

After every stage merge, update the enterprise handoff with the exact merged main SHA, latest migration, completed stage, active next stage and any unresolved production blocker.
