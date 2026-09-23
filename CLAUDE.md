# CEAC OS — Claude continuation instructions

## Premium redesign is the active UI programme

Before any UI work, read:
1. `docs/design/CEAC_OS_PREMIUM_REDESIGN_SOURCE_OF_TRUTH_2026-09-23.md`
2. `docs/handoff/CEAC_OS_PREMIUM_REDESIGN_HANDOFF_2026-09-23.md`
3. `AGENTS.md` in full.

Do not rebuild from the old sidebar or old screen composition. Do not invent a different icon family, color direction, role shell or visual system. The premium redesign source of truth supersedes conflicting older UX/navigation/visual text on this redesign branch while all existing security/data contracts remain binding.

Do not touch the frozen Stage 11 branch from redesign work. Do not start Stage 12 unless the product owner explicitly resumes enterprise expansion. Continue only the active redesign tranche recorded in the handoff.


Before changing this repository, read `AGENTS.md` in full. It contains the binding product, security and build rules for CEAC OS.

For the enterprise expansion, also read:
1. `docs/handoff/CEAC_OS_ENTERPRISE_EXPANSION_HANDOFF_2026-09-22.md`
2. `docs/architecture/CEAC_OS_Enterprise_Expansion_Architecture_2026-09-22.md`
3. the architecture/security document for the current stage.

The stage sequence in `AGENTS.md` is binding. Do not skip, stack or parallelise stages. Inspect GitHub first, treat `main` as the source of truth, and never start stage N+1 until stage N is fully green, product-inspected and merged into `main`.

Do not infer missing CEAC policy. Payroll remains blocked until CEAC's payroll rules are formally confirmed.

After every stage merge, update the enterprise handoff with the exact merged main SHA, latest migration, completed stage, active next stage and any unresolved production blocker.
