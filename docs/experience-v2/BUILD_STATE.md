# CEAC OS Experience V2 — Build State

Last updated: 26 September 2026

## Current programme state

Programme: Experience V2
Status: ACTIVE
Current stage: Stage 1 — Continuity, source-of-truth and reference lock
Current substage: 1B — Persist design/quality contract and reference package

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

In progress:
- [ ] Commit Experience V2 source-of-truth.
- [ ] Commit implementation sequence.
- [ ] Commit acceptance and handoff protocol.
- [ ] Commit reference index and design/motion evidence.
- [ ] Update AGENTS.md so any coding session enters through Experience V2.
- [ ] Verify all reference files exist at the documented paths.
- [ ] Run the baseline quality gate on the Experience V2 branch after documentation/reference import.

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