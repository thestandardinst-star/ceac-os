# CEAC OS — Enterprise Expansion Programme Handoff

**Date:** 22 September 2026  
**Status:** ACTIVE  
**Repository:** `thestandardinst-star/ceac-os`  
**Baseline main:** `c17edf2dacc0f554f12a7ed2834ecc2afde1b0ce`  
**Active branch:** `chatgpt/enterprise-expansion-stage-0-2026-09-22`  
**Current stage:** Stage 0 — Platform baseline and production security closure  
**Latest known migration on baseline:** 073 — private meeting notes

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

