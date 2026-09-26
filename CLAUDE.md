# CEAC OS — Claude continuation instructions

## Stage 12 Integrations is active

The premium product experience is merged and locked. Preserve it.

Before Stage 12 work, read:
1. `AGENTS.md` in full;
2. `docs/architecture/CEAC_OS_STAGE12_INTEGRATIONS_2026-09-26.md`;
3. `docs/architecture/CEAC_OS_STAGE1G_INTEGRATION_GATEWAY_2026-09-22.md`;
4. `docs/handoff/CEAC_OS_ENTERPRISE_EXPANSION_HANDOFF_2026-09-22.md`;
5. `docs/design/CEAC_OS_PREMIUM_REDESIGN_SOURCE_OF_TRUTH_2026-09-23.md`.

Current Stage 12 branch: `chatgpt/enterprise-expansion-stage-12-integrations-2026-09-26`.
Baseline main: `225185e75050085ccc14026b46947eead3e52167`.
Current migration at activation: 096; Stage 12 owns migration 097.

First provider adapter: Telegram. Secrets belong in Supabase Vault and server-side Edge Functions only. Do not build Payroll, Search/Intelligence or Assistive AI.

Before changing this repository, read `AGENTS.md` in full. It contains the binding product, security and build rules for CEAC OS.

For the enterprise expansion, also read:
1. `docs/handoff/CEAC_OS_ENTERPRISE_EXPANSION_HANDOFF_2026-09-22.md`
2. `docs/architecture/CEAC_OS_Enterprise_Expansion_Architecture_2026-09-22.md`
3. the architecture/security document for the current stage.

The stage sequence in `AGENTS.md` is binding. Do not skip, stack or parallelise stages. Inspect GitHub first, treat `main` as the source of truth, and never start stage N+1 until stage N is fully green, product-inspected and merged into `main`.

Do not infer missing CEAC policy. Payroll remains blocked until CEAC's payroll rules are formally confirmed.

After every stage merge, update the enterprise handoff with the exact merged main SHA, latest migration, completed stage, active next stage and any unresolved production blocker.
