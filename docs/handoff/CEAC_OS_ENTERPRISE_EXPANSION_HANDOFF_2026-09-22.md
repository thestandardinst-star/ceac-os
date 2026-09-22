# CEAC OS — Enterprise Expansion Programme Handoff

**Date:** 22 September 2026
**Status:** ACTIVE
**Repository:** `thestandardinst-star/ceac-os`
**Baseline main:** `d9b8c1703c7f20c233b62553e5e201cc209dacd7`
**Active branch:** `chatgpt/enterprise-expansion-stage-6-resource-workload-2026-09-22`
**Current stage:** Stage 6 — Resource & Workload
**Latest merged migration on main:** 085 — Work Management 2.0; Stage 6 migration 086 is under review

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
- Stage 3 Protected HR via clean main-based rebuild;
- Stage 4 Goals and Strategy via clean main-based rebuild;
- Stage 5 Work Management 2.0 via PR #33.

Current merged main after Stage 5: `d9b8c1703c7f20c233b62553e5e201cc209dacd7`.

Active work is Stage 6 only:
- PR #34 — Stage 6: Resource and Workload Management;
- branch `chatgpt/enterprise-expansion-stage-6-resource-workload-2026-09-22`;
- migration 086 adds append-only planning-capacity and project-commitment history;
- Stage 7 must not begin until Stage 6 is fully green, product-inspected and merged into `main`.

Stage 6 exit evidence must include:
- CI;
- clean Migration Replay;
- Account Security;
- every cumulative SQL/security gate through Stage 6;
- Stage 6 audit and semantic-event evidence;
- browser role acceptance;
- persistence after reload;
- desktop/mobile responsive acceptance;
- deployment validation and a real preview/product inspection;
- confirmation that no workload score, employee ranking or attendance-derived performance inference has been introduced.

After Stage 6 the mandatory order is:

`7 Performance & Development → 8 Learning → 9 Workforce Management 2.0 → 10 Assets & Devices → 11 Compliance & Policy → 12 Integrations → 13 Payroll (only after CEAC rules are confirmed) → 14 Search & Intelligence → 15 Assistive AI → whole-system inspection → production closure.`

Every stage must branch from the latest merged `main`, complete its architecture/security contract, migrations, cumulative automated gates, UI, browser/responsive acceptance and handoff, then merge before the next branch is created.

Stage 13 is a hard policy gate. Do not infer salary basis, allowances, deductions, SSNIT/PAYE treatment, approval authority, payment process, pay periods, payslip requirements or reversal rules. If those are not formally confirmed, stop before Payroll and request them.

The enterprise programme is not complete merely because Stage 15 code exists. Completion requires the final whole-system product inspection, role-by-role acceptance, migration/security verification, deployment inspection, operational recovery/ownership evidence and production closure.
