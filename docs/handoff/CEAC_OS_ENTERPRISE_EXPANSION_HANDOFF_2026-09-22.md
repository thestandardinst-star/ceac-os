# CEAC OS — Enterprise Expansion Programme Handoff

**Date:** 26 September 2026
**Status:** ACTIVE
**Repository:** `thestandardinst-star/ceac-os`
**Baseline main:** `225185e75050085ccc14026b46947eead3e52167`
**Active branch:** `chatgpt/enterprise-expansion-stage-12-integrations-2026-09-26`
**Current stage:** Stage 12 — Integrations
**Latest merged migration on main:** 096 — Experience Stage 6 finance corrections; Stage 12 owns migration 097

## 1. Governing architecture

The newest approved whole-system expansion contract is:

`docs/architecture/CEAC_OS_Enterprise_Expansion_Architecture_2026-09-22.md`

Future builders must treat that file as binding for enterprise-expansion sequencing and definition of done.

It supplements, and does not weaken:
- 20 September approved architecture amendment;
- Product Intelligence & Experience amendment;
- Product Experience / Collaboration / PWA amendment;
- Assistive Input & Collaboration amendment;
- Administration/HR security gate;
- protected HR foundation;
- Product Intelligence security handoff;
- existing Work Engine, finance, reporting and meeting authority contracts.

## 2. What is locked

CEAC OS will expand sequentially through:

0. Platform baseline/security closure
1. Platform Foundation v2
2. Employee Lifecycle
3. Protected HR
4. Goals and Strategy
5. Work Management 2.0
6. Resource & Workload
7. Performance & Development
8. Learning
9. Workforce Management 2.0
10. Assets & Devices
11. Compliance & Policy
12. Integrations
13. Payroll
14. Search & Intelligence
15. Assistive AI

Stages are gates, not a backlog that may be built in parallel.

## 3. Stage 0 current facts

Verified at programme start:
- exact baseline main is `c17edf2dacc0f554f12a7ed2834ecc2afde1b0ce`;
- PR #18 Product Intelligence & Experience redesign is merged;
- PR #17 Administration & HR foundation is merged;
- repository rulesets endpoint currently returns no rulesets;
- classic branch-protection read is unavailable to the connected GitHub App because it lacks the required administration permission;
- current security documentation still lists branch protection, leaked-password protection, formal least-privilege review and backup/restore as production tasks;
- protected HR boundary already exists in `hr_private`;
- HR protected Storage bucket is private;
- HR audit events are append-only;
- 073 private meeting notes is the latest migration visible on the baseline.

## 4. Stage 0 required work

### 0A Baseline record
Document:
- repository;
- exact main SHA;
- live Supabase project;
- live deployment;
- migration range;
- CI/security gates;
- production ownership;
- known intentionally deferred capabilities.

### 0B Repository protection
Required target:
- pull request required for main;
- required checks before merge;
- force pushes disabled;
- branch deletion disabled;
- no silent bypass for ordinary contributors.

If connector permissions cannot configure this, record the exact GitHub Settings action required and keep Stage 0 open until confirmed.

### 0C Privileged-account security
Confirm MFA and recovery ownership for GitHub, Supabase, deployment provider and connected production services.

Do not store passwords, recovery codes or secrets in repository documentation.

### 0D Supabase/Auth hardening
Confirm leaked-password protection and other production auth settings appropriate to the current login model.

### 0E SECURITY DEFINER least-privilege review
Inventory every authenticated-callable SECURITY DEFINER function and record:
- function;
- purpose;
- expected caller;
- authority validation;
- reads/writes;
- audit behaviour;
- whether SECURITY DEFINER remains necessary.

Any unnecessary execution privilege must be removed by migration with corresponding tests.

### 0F Secrets and integration credentials
Verify:
- no service-role/provider secret in browser source;
- no committed secret;
- server-side credentials have minimum scope;
- production credentials have named CEAC ownership/recovery.

### 0G Backup/restore
Document and execute at least one non-destructive restore test using an appropriate safe target.

### 0H Exact release verification
Stage 0 closes only when the tested code/database/deployment baseline can be tied together unambiguously.

## 5. Build constraints during Stage 0

Do not:
- add Stage 1 enterprise tables;
- add payroll/salary/bank/national-ID fields;
- add device-management product screens;
- add onboarding product UI;
- weaken RLS;
- broaden authenticated RPC execution for convenience;
- modify production data merely to make tests pass.

Stage 0 is hardening and documentation, not enterprise feature expansion.

## 6. Completion evidence

Stage 0 may be marked complete only with evidence for:
- repository protection;
- CI/required checks;
- privileged account controls;
- Supabase Auth hardening;
- SECURITY DEFINER review;
- secrets review;
- private Storage verification;
- backup/restore test;
- exact baseline/deployment verification;
- updated handoff.

Once complete, create a fresh Stage 1 branch from the reviewed main and begin Platform Foundation v2 in the order 1A–1G.


## Stage 0 progress update — 22 September 2026

Completed and evidenced on PR #19:

- Enterprise Expansion Architecture locked.
- Platform Kernel SQL gate added and passing.
- CI, Quality Gate, Migration Replay and Account Security all pass on the current Stage 0 branch.
- Main-branch protection has been created manually in GitHub by the repository owner.
- All 73 authenticated-callable SECURITY DEFINER functions have completed semantic review.
- Six internal-only privileged helpers are identified for later direct-EXECUTE revocation after migration-history repair.
- Repository and live-database secret-surface scans found no application-level embedded production-secret pattern.
- Supabase project is verified ACTIVE_HEALTHY on the Free plan with no database branches.
- Supabase current plan limitations documented: leaked-password protection requires Pro; automatic daily backups are not provided on Free.
- GitHub records a successful Vercel deployment for exact main SHA `c17edf2dacc0f554f12a7ed2834ecc2afde1b0ce`. Direct Vercel connector inspection remains unavailable in this session.
- Migration-history repair has been fully analysed and documented. Live 069–072 SQL matches repository migrations, while 073 schema state is already present live despite its missing ledger row.

### Immediate next gate

Repository/database reconciliation is complete through 074. The remaining Stage 0 exit work is operational evidence: privileged production-account controls, backup/restore evidence, and exact deployed-product inspection. Stage 1 remains blocked until those exit gates are closed.


### Migration history reconciliation — completed

Production migration history was repaired using Supabase's supported `migration repair` mechanism. The alternate live-only timestamps for 069–072 were marked reverted in the ledger, and the canonical repository timestamps for 069–073 were marked applied. A post-repair `migration list` and the connected Supabase migration API both confirm local/remote alignment through `20260921211500` (073).

No migration SQL was rerun as part of the repair.

Migration 074 is the current Stage 0 hardening change. Production already contains the migration, and the exact production SQL has been recovered into the repository. It reduces direct authenticated execution of six reviewed internal-only privileged helpers. The Platform Kernel gate now enforces the post-074 authenticated SECURITY DEFINER surface of 67.

The current PR head has passed CI, Migration Replay, Account Security and the full Quality Gate. Vercel deployment for the current head is presently blocked by the provider's build-rate limit; deployed-product inspection therefore remains open.


## Current linear-build checkpoint — 22 September 2026

Merged into `main`:
- Stage 0 through Stage 2 via consolidation;
- Stage 3 Protected HR;
- Stage 4 Goals and Strategy;
- Stage 5 Work Management 2.0;
- Stage 6 Resource & Workload;
- Stage 7 Performance & Development;
- Stage 8 Learning and its closure handoff.

Current canonical main after Stage 8 closure: `8dd3b8d50600942f482a7bdb1dde287c1e0a04dc`.
Latest merged migration: 088.

Active work is Stage 9 only:
- branch `chatgpt/enterprise-expansion-stage-9-workforce-management-2026-09-22`;
- governing contract `docs/architecture/CEAC_OS_STAGE9_WORKFORCE_MANAGEMENT_2026-09-22.md`;
- planned migration 089 extends existing employment/work-session/leave records rather than creating duplicate attendance or leave systems;
- no-session-recorded must never automatically mean absence;
- leave policy/balance calculations remain blocked until CEAC entitlement/accrual/carry-over/opening-balance rules are formally confirmed;
- Stage 10 must not begin until Stage 9 is fully green, product-inspected and merged.

Stage 9 exit evidence must include:
- CI;
- clean Migration Replay;
- Account Security;
- every cumulative SQL/security gate through Stage 9;
- workforce authority/RLS tests;
- append-only schedule and attendance-correction history;
- attributable leave decision/reversal history;
- proof that unconfirmed legacy leave defaults do not generate balances;
- Staff/Manager/Admin browser acceptance;
- persistence after reload;
- desktop/mobile responsive acceptance;
- exact-head product inspection;
- deployment validation or explicit provider-only blocker documentation.

After Stage 9 the mandatory order remains:

`10 Assets & Devices → 11 Compliance & Policy → 12 Integrations → 13 Payroll (only after CEAC rules are confirmed) → 14 Search & Intelligence → 15 Assistive AI → whole-system inspection → production closure.`

Stage 13 remains a hard policy gate. Do not infer payroll rules.

The enterprise programme is not complete merely because Stage 15 code exists. Completion still requires whole-system inspection and production closure.


## Stage 9 closure / Stage 10 activation — 22 September 2026

Stage 9 Workforce Management 2.0 merged through PR #39.

- merged main: `b8d32f0a6a28716b1eb178feab160ca45bad1e17`;
- migration 089 is now canonical on main;
- CI, Migration Replay, Account Security, all cumulative SQL/security gates through Stage 9 and the 27-test Playwright role/acceptance suite passed on the final Stage 9 head;
- Stage 9 desktop Administration and Staff-mobile product-inspection artifacts were generated;
- exact-head Vercel deployment reached Ready;
- the product owner explicitly waived the protected-preview inspection because that preview is accessible to Codex rather than this ChatGPT connector;
- the older preview URL `ceac-os-git-chatgpt-produ-e6b68f-...` was traced to merged PR #18 and is not the Stage 9 deployment.

Stage 10 is now the only active enterprise-expansion stage.

Stage 10 contract:
`docs/architecture/CEAC_OS_STAGE10_ASSETS_DEVICES_2026-09-22.md`

No Stage 11 work may begin until Stage 10 is green and merged.


## Stage 10 closure / Stage 11 activation — 22 September 2026

Stage 10 Assets & Devices merged through PR #40.

- merged main: `ec2801895c66dfec082d04901b4743bfeb9a2c4c`;
- migration 090 is canonical on main;
- CI, Migration Replay, Account Security, all cumulative SQL/security gates through Stage 10 and the full Playwright role/acceptance suite passed on the final Stage 10 head;
- Stage 10 Administration desktop and Staff-mobile product-inspection artifacts were generated and inspected;
- Vercel preview generation was provider-rate-limited; the product owner has explicitly instructed that inaccessible Vercel preview inspection must not block programme progression;
- Stage 10 added a visible Assets & devices workspace with inventory, purchase/warranty, custody and service/retirement lifecycle while deliberately excluding OS-level MDM.

Stage 11 is now the only active enterprise-expansion stage.

Stage 11 contract:
`docs/architecture/CEAC_OS_STAGE11_COMPLIANCE_POLICY_2026-09-22.md`

The existing Stage 1F Policies & rules engine remains system configuration; Stage 11 Compliance is a separate human policy/evidence/exception workflow.

No Stage 12 work may begin until Stage 11 is green and merged.


## Stage 12 clean restart — 26 September 2026

Enterprise expansion has been explicitly resumed by the product owner.

Current source of truth:
- main: `225185e75050085ccc14026b46947eead3e52167`;
- Stages 10 and 11 are merged;
- live Supabase project `efjljhftsesssumtshvp` is ACTIVE_HEALTHY;
- live migration head is 096;
- Supabase Vault is installed;
- no Edge Functions are deployed at Stage 12 activation;
- Stage 1G connector/subscription/outbox tables are live;
- stale PR #45 was documentation-only, diverged from current main, and was closed without merge.

Fresh Stage 12 branch:
`chatgpt/enterprise-expansion-stage-12-integrations-2026-09-26`

Governing contract:
`docs/architecture/CEAC_OS_STAGE12_INTEGRATIONS_2026-09-26.md`

Implementation order:
common secure connection contract → Vault secret boundary → provider capabilities → delivery worker/retry/idempotency → inbound normalisation → premium Connected Apps → Telegram adapter → cumulative closure.

Telegram is the first provider adapter. Google Calendar/Meet, Drive and Zoom must not be built in parallel before the common contract and Telegram pass.

Stage 13 remains blocked until Stage 12 is merged and CEAC payroll rules are formally confirmed.
