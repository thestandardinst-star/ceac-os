# CEAC OS Experience V2 — Stage 10 Family F 10F2 Acceptance Record

Date: 28 September 2026
Stage: 10 — Operational Screen Families
Family: F — Reports
Substage: 10F2 — Manager Reports
Status: ACCEPTED AND COMPLETE

## Accepted application head

`067d138042e5a3c4c78678e997e32ef745c801c5`

This is the exact Level B Manager Reports application SHA.

## Exact-head Level B gates

- CI PASS — run `36421502181` (#1242);
- Migration Replay PASS — run `36421502210` (#853);
- Account Security PASS — run `36421502179` (#1025);
- Complete Quality Gate PASS — run `36421502186` (#1051);
- Level B SQL/RLS/authority contracts PASS;
- all four browser shards PASS;
- merged exact-head product evidence PASS;
- role-and-RLS coordinator PASS.

## Vercel reconciliation

The exact application SHA initially received Vercel's external build-rate-limit status.

Documentation-only checkpoint `c6ffc20e8208f1010e18c7ffddb85d45891adfbb` subsequently received Vercel PASS and changes only `docs/experience-v2/BUILD_STATE.md`.

Therefore the successfully deployed application code is exactly the already-Level-B-passed application code above.

No Vercel billing, environment variable, domain, project setting or application configuration was changed.

Documentation-head verification:
- CI PASS — run `36426292846` (#1243);
- Migration Replay PASS — run `36426292268` (#854);
- Account Security PASS — run `36426292282` (#1026);
- Quality Gate PASS — run `36426292368` (#1052);
- documentation contract PASS;
- role-and-RLS coordinator PASS;
- Level B browser/SQL jobs correctly skipped by the documentation fast path.

## Accepted Manager Reports character

Manager Reports now uses the shared Experience V2 reporting family while preserving the existing reporting domain and authority model.

Accepted hierarchy:
1. unit reporting identity;
2. period/scope mode;
3. live-preview versus frozen/submitted state;
4. factual evidence counts and traceable drill-down;
5. narrative/challenges context;
6. save/submit/correction behaviour only when a valid reporting period exists;
7. supporting analysis kept secondary pending Stage 11;
8. version/evidence history;
9. recurring Ministry Numbers remains separate factual ministry context.

## Authority and reporting semantics preserved

No schema, migration, RLS policy, RPC definition, authentication configuration or capability grant changed.

Preserved:
- Manager reporting remains managed-unit/project scoped;
- no Staff Reports route was introduced;
- person-scope reports remain unbuilt;
- submitted versions remain final/frozen;
- corrections create new attributable draft versions instead of rewriting prior submissions;
- evidence references remain traceable;
- current live data does not rewrite a frozen submitted report;
- a missing reporting period remains missing and blocks save/submit rather than silently creating a report;
- factual evidence counts remain evidence, not scores/rankings/performance measures;
- recorded work-session days remain factual context only;
- no unsupported KPI, estimate, probability or overall rating was introduced.

## Responsive and product acceptance

Exact-head evidence was directly inspected at:
- 320×844;
- 360×800;
- 375×812;
- approximately 390×844;
- 414×896;
- 430×932;
- 900×900;
- 1366×768;
- 1440×900.

Direct inspection found:
- no page-level horizontal overflow;
- mobile recomposition rather than squeezed desktop geometry;
- readable hierarchy at 1366×768 and 1440×900;
- live preview clearly distinguished from submitted/frozen state;
- truthful no-period state;
- no clipped authoring/report controls;
- no invented reporting values.

Quality Gate evidence:
- `redesign-r7-product-inspection`;
- artifact ID `10969938061`;
- digest `sha256:182f52592f9bf34f8c51f473482fad33c28ce650bd7ae67c3c2c1e1b7ee32ea2`;
- exact application head `067d138042e5a3c4c78678e997e32ef745c801c5`.

## Exit decision

10F2 — Manager Reports is ACCEPTED AND COMPLETE.

10F3 — Administration Reports may begin after this documentation checkpoint is persisted.
10F4 Executive Reports and 10F5 Family F final acceptance have not started.
Family G has not started.
PR #72 remains OPEN + DRAFT.
PR #71 remains frozen.
