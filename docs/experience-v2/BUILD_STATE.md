# CEAC OS Experience V2 — Build State

Last updated: 26 September 2026

## Current programme state

Programme: Experience V2
Status: ACTIVE
Current stage: Stage 1 — Continuity, source-of-truth and reference lock
Current substage: 1D — Baseline gate verification

Active branch: chatgpt/experience-v2-2026-09-26
Experience V2 baseline SHA: 1a0fb33d3fff18ddae63e6523547b4f4d5d5c883

The branch was created directly from the exact green PR #69 head so that existing fixes and test coverage are retained while the visible product layer is rebuilt safely.

## Repository facts verified before Experience V2 started

Main baseline at inspection: 225185e75050085ccc14026b46947eead3e52167

PR #69:
- state: open;
- draft: no;
- head: chatgpt/design-system-stabilization-2026-09-25;
- exact head: 1a0fb33d3fff18ddae63e6523547b4f4d5d5c883;
- 39 commits ahead of main, 0 behind;
- its known engineering gates were green, but user device evidence showed that the visual/product-quality gate was not sufficient.

PR #71:
- state: open draft;
- head: chatgpt/enterprise-expansion-stage-12-integrations-2026-09-26;
- exact head: bf068f32958134319ea32ecf833748879a163fd2;
- 9 commits ahead of main, 0 behind;
- FROZEN. Do not update, merge, rebuild or discard it while Experience V2 is active.

## Why Experience V2 exists

Real-device inspection exposed design-quality failures on both phone and laptop that were not caught by the earlier acceptance gate: inconsistent typography, card sizing, layout density, icon treatment, responsive composition and interaction quality.

The repository inspection also found structural causes:
- seven cascading CSS layers are currently loaded;
- those layers total roughly 5,661 lines;
- the current design-system ceiling is 1,125 !important declarations;
- a large temporary parity layer is still carrying cross-role overrides;
- at least two independent hand-built icon systems exist;
- the current package has no dedicated motion system and no dedicated production icon library;
- several major screens combine substantial working data/business logic with presentation in very large components.

Therefore the safe decision is NOT a ground-up application rewrite and NOT another CSS patch pass. Experience V2 rebuilds the visible product layer while preserving working domain logic.

## Stage 1 checklist

Completed:
- [x] Inspect current repository and open PR state.
- [x] Confirm PR #69 exact green baseline.
- [x] Confirm PR #71 remains frozen.
- [x] Create isolated Experience V2 branch from PR #69 exact head.
- [x] Add mandatory Chat/Work START_HERE entry point.

Completed:
- [x] Persist Experience V2 source-of-truth.
- [x] Persist implementation sequence.
- [x] Persist acceptance and Chat/Work handoff protocol.
- [x] Persist durable decision log.
- [x] Persist baseline repository audit.
- [x] Persist reference index.
- [x] Store user-supplied quality references, current-gap evidence, motion reference, role mockups and preserved source docs in the persistent Library under CEAC OS / Experience V2 / References.
- [x] Update AGENTS.md so any coding session enters through Experience V2.
- [x] Redirect legacy CLAUDE.md instructions to the Experience V2 entry point.

Completed:
- [x] Open draft PR #72 — Experience V2: rebuild CEAC product experience safely.
- [x] Add portable SESSION_START_PROMPT.md for any new Chat/Work session.

In progress:
- [ ] Run/verify CI, Migration Replay, Account Security, Quality Gate and Vercel status on the final Stage 1 documentation HEAD.
- [ ] Resolve any Stage 1-only gate defect without starting Stage 2.
- [ ] Mark Stage 1 complete and record Stage 2 exact start conditions.

Draft PR: #72

Stage 1 exit:
Stage 1 is complete only when all continuity documents and reference assets are in GitHub, AGENTS.md points to them, the branch builds/tests from the inherited baseline, and a new session can determine the exact current stage without reading any Chat transcript.

## Next stage after Stage 1

Stage 2 — Design Foundation V2:
- semantic design tokens;
- responsive typography;
- spacing/grid rules;
- one icon registry/family;
- base interaction/motion tokens;
- component architecture;
- removal strategy for competing visual primitives.

Do not begin Stage 3 until the Stage 2 foundation is inspected and accepted.

## Handoff rule

At the end of every substage, update this file. Never depend on an agent remembering where it stopped. The incoming Chat or Work session must inspect GitHub and this file before continuing.