# CEAC OS Experience V2 — Verification Protocol

Status: ACTIVE
Owner: the single active Experience V2 writer
Applies to: PR #72 and every remaining Experience V2 stage

This protocol shortens feedback time without reducing product, security or acceptance coverage.

## 1. The two verification levels

### Level A — fast development gate

Level A is the default for implementation commits inside an active substage.

It runs:
- changed-line hygiene;
- dependency audit and production build;
- deterministic changed-file classification;
- the affected Experience V2 browser/source contracts and role-routing coverage;
- migration replay or Account Security when the changed boundary requires them.

The classifier defaults to the stronger scope when a change cannot be mapped safely. Shared shell, test-harness, workflow, package, database, authentication and security changes are never treated as a narrow family-only change.

Level A answers: “Is this implementation commit safe enough to continue the same substage?”

Level A does **not** accept a substage, family, major stage, release candidate or merge.

### Level B — complete acceptance gate

Level B preserves the complete Quality Gate:
- every cumulative SQL, RLS and security contract;
- the complete Playwright role and acceptance suite;
- exact-head product evidence;
- CI build and dependency audit;
- clean Migration Replay;
- Account Security;
- Vercel exact-head deployment status;
- direct visual/product inspection required by `ACCEPTANCE_AND_HANDOFF.md`.

Level B is mandatory before accepting:
- every Experience V2 substage;
- every Stage 10 family;
- every subsequent major stage;
- the release candidate;
- final merge/reconciliation.

Mark the final application commit for a boundary with `[level-b]` in the commit subject. A manual Quality Gate dispatch is also Level B. Database, security, workflow, test-harness and package-contract changes force Level B automatically.

An acceptance record must cite the exact application SHA and the complete Level B run. A green lightweight workflow summary is not a substitute.

## 2. Canonical sequence

`implementation commit → Level A → continue the same substage → [level-b] exact-head commit → complete Level B → inspect exact-head evidence → acceptance checkpoint → next substage`

Do not begin or commit the next substage before the current substage is accepted.

## 3. Documentation-only fast path

A change is documentation-only only when every changed file is `AGENTS.md`, a repository Markdown file or a file under `docs/`.

For a documentation-only checkpoint:
- run changed-line and documentation integrity checks;
- do not start Supabase, replay migrations or run browser suites merely because an acceptance record or `BUILD_STATE.md` changed;
- record acceptance only when the immediately preceding application SHA already passed Level B and visual/product inspection;
- cite that application SHA and run explicitly.

If classification is uncertain, the classifier selects the stronger gate.

## 4. Complete-gate architecture

The complete Quality Gate separates independent work:
- one isolated runner replays the database, seeds role fixtures and runs the complete SQL/RLS/security suite;
- four isolated runners each replay and seed their own database, then run one Playwright shard;
- a final job merges shard screenshots and republishes the established evidence artifacts;
- the preserved `role-and-rls` coordinator fails unless every required Level B job succeeds.

No runner shares mutable database or browser state with another runner. Test retries remain disabled. Playwright tests are not removed or weakened.

Baseline before sharding:
- Quality Gate #1026, run `36405249475`;
- 329 Playwright tests passed;
- Playwright duration: 14.2 minutes;
- workflow wall clock: approximately 17 minutes.

Record the first successful sharded Level B duration in `BUILD_STATE.md` and compare it with this baseline.

First validated sharded result:
- Quality Gate #1027, run `36408710547`;
- exact head `d0f20aee8d18fc3ba3ab50911903ab4dc9861ca4`;
- 329/329 Playwright tests passed across four isolated shards;
- slowest shard: 86 tests in 6.2 minutes;
- workflow wall clock: approximately 10 minutes 9 seconds;
- improvement from the 17-minute baseline: approximately 40%;
- complete SQL/RLS/security contracts and merged exact-head evidence also passed.

## 5. Productive work while Level B runs

The sole writer may perform read-only preparation for the next approved substage:
- inspect implementation, queries, RPCs and tests;
- inspect authority and security boundaries;
- inspect responsive states and likely shared-component reuse;
- prepare an implementation plan.

Do not commit next-substage implementation until the current acceptance checkpoint is complete.

## 6. Failure handling

For every failed gate:
1. inspect the exact failed job, test and log;
2. classify it as product defect, security defect, deterministic test defect, infrastructure/external failure or demonstrated flake;
3. record evidence for the classification;
4. fix the root cause at the lowest correct layer;
5. rerun the appropriate gate;
6. continue when green.

Never weaken an assertion to hide a defect, skip a legitimate failure, add arbitrary retries, inflate timeouts as the default response, suppress a security failure or mark a failed gate accepted.

## 7. One-writer and recovery rules

- GitHub HEAD, `BUILD_STATE.md` and acceptance records are authoritative.
- Only one writer may mutate the Experience V2 branch.
- Parallelise CI, isolated tests and read-only investigation, not competing code changes.
- Never reset, force-push or overwrite newer canonical work.
- Persist every meaningful implementation and acceptance checkpoint.
