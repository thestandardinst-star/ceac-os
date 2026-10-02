# CEAC OS — Final Product Parity & Go-Live — Build State

Last updated: 2 October 2026

Programme: FPG
Status: ACTIVE
Branch: `chatgpt/final-product-parity-go-live-2026-10-02`
Baseline protected main: `b475e9e3d09c757cd42f0e0e0e075c588641b2b2`

## Reconciliation
- latest observed protected main verified at baseline above;
- PR #92 inspected: its workflow intent is already present on protected main via #90 and must not be merged blindly;
- provisional VF PRs #81 and #83–#89 inspected; they are stale/diverged from current main and remain unmerged pending explicit redundancy closure;
- no pre-existing FPG branch was found before branch creation;
- older VF build state remains historical and is not the active visual programme.

## FPG0 — COMPLETE
- new FPG branch created from latest protected main;
- AGENTS.md precedence block activated;
- complete FPG control-plane document set created;
- payroll owner rules recorded;
- go-live organisation rules recorded;
- reference map/component matrix created;
- remaining owner inputs recorded;
- protected V2/Stage17 technical/security foundations explicitly retained.

## FPG1 — LITERAL REFERENCE LOCK: COMPLETE FOR GOLD-STANDARD INPUTS
Exact owner sources recovered and directly inspected:
- PROJECT-A `file_000000004d6081f4893761af8099a1a8` — Kanban Team Management Dashboard;
- PROJECT-B `file_00000000cb288210aee8667caf2f3135` — Task Management selected-record drawer;
- PROJECT-C `file_00000000d3508243bfedf133e8c2479c` — BrandBook task dashboard;
- FINANCE-A `file_00000000a13c820a9b0bedfc85d7dc8b` — Finexa finance dashboard;
- PEOPLE-A `file_00000000d6988210aec6b733d9fb089d` — Employee Management/workforce dashboard;
- HOME-A remains repository-addressable under `docs/visual-fidelity/references/`.

Binary-copy continuity into GitHub remains a tooling task; source identity is locked and no substitute may be used.

## Current stage
FPG2 — Project/Task gold-standard implementation: ACTIVE

Implementation contract:
- preserve ManagerProjects queries, RLS/capability authority and project/work semantics;
- recompose the selected project workspace toward PROJECT-A;
- add selected work preview/drawer treatment toward PROJECT-B without inventing comments, attachments or progress data;
- use only real phases, work items, assignees, status, due dates, submissions/evidence and other authoritative records;
- disabled/unavailable view controls must be visibly honest until their behavior is implemented;
- direct visual acceptance remains pending screenshot comparison.

## Protected foundations
Experience V2 / Stage 17 remains the functional/security base. Preserve RLS, capability_grants, platform_audit_events, hr_private, Work Engine semantics, finance authority, integration security, accessibility, responsive foundations and real-data rules.


## FPG2 / FPG3 acceptance checkpoint — exact-head Level B requested
Candidate implementation head includes:
- FPG2 literal Project/Task workspace + selected-record drawer;
- FPG3 truthful Finexa-style Administration Finance overview;
- authenticated browser evidence capture for both surfaces in `tests/acceptance-core.spec.js`.

The previous affected-scope checks showed CI/Migration Replay/Account Security green where completed. This checkpoint explicitly requests the complete Level B browser/authority gate because FPG2/FPG3 are meaningful visual acceptance boundaries. Vercel deployment remains externally rate-limited and is not treated as a code defect.


## FPG2 — Project/Task gold standard: ACCEPTED

Accepted exact head: `433334304e66212a65ab565e1354ee12c96be8fc`

Evidence:
- CI PASS
- Migration Replay PASS
- Account Security PASS
- full Level B Quality Gate PASS
- exact-head Project desktop and selected-record drawer screenshots inspected against PROJECT-A / PROJECT-B.

The accepted surface preserves CEAC data/authority truth. Reference-only fields without authoritative CEAC data are not invented.

## FPG3 — Finance gold standard: ACCEPTED

Accepted exact head: `433334304e66212a65ab565e1354ee12c96be8fc`

Evidence:
- same exact-head full gate PASS;
- exact-head Finance screenshot inspected against FINANCE-A;
- multi-currency separation, operational-finance boundary and factual empty states preserved.

## Current stage

FPG4 — Extract only proven reusable components: ACTIVE

Next:
1. extract the accepted Project issue-table and selected-record drawer composition into the existing Project Family V2 layer without changing data queries or authority;
2. keep the accepted ManagerProjects screen visually unchanged;
3. run affected tests/build;
4. proceed directly to FPG5 Payroll domain/security after FPG4 is green.
