# CEAC OS Experience V2 — Build State

Last updated: 26 September 2026

## Current programme state

Programme: Experience V2
Status: ACTIVE
Current stage: Stage 2 — Design Foundation V2
Current substage: 2B — Dependency installation and shared implementation

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

Stage 1 exit evidence:
- [x] CI passed on exact Stage 1 reference head dcd18540accb60e19a95c90fd633aab351bbfbba.
- [x] Migration Replay passed on exact Stage 1 reference head dcd18540accb60e19a95c90fd633aab351bbfbba.
- [x] Account Security passed on exact Stage 1 reference head dcd18540accb60e19a95c90fd633aab351bbfbba.
- [x] Complete Quality Gate passed on exact Stage 1 reference head dcd18540accb60e19a95c90fd633aab351bbfbba.
- [x] Vercel status succeeded on exact Stage 1 reference head dcd18540accb60e19a95c90fd633aab351bbfbba.
- [x] Persistent Library reference inventory verified from a fresh files listing.
- [x] PR #69 and frozen PR #71 cross-linked to Experience V2.

Stage 1 status: COMPLETE.

Stage 2 completed:
- [x] Inspect/ratify the V2 token schema against the stored references.
- [x] Lock Instrument Sans as the Stage 2 UI type family.
- [x] Select Lucide React as the single production icon family.
- [x] Select Motion for React as the production motion implementation.
- [x] Persist the binding Stage 2 design-foundation contract at docs/experience-v2/DESIGN_FOUNDATION_V2.md.
- [x] Add semantic typography, spacing, radius, elevation, colour, responsive and motion tokens in isolated src/experience-v2.css.
- [x] Load the V2 foundation after premium-parity.css without restyling legacy role screens.
- [x] Add Stage 2 foundation contract tests.
- [x] Fix the test-harness regex defect found by the first Quality Gate attempt.
- [x] Re-run the complete engineering gate on exact head b947f8c88e73eccc46a3a470760b6e546ddbfe5a: CI PASS; Migration Replay PASS; Account Security PASS; Quality Gate PASS; Vercel PASS.
- [x] Persist the exact Stage 2 Work brief at docs/experience-v2/STAGE2_WORK_BRIEF.md.
- [x] Lock the visual migration boundary at docs/experience-v2/VISUAL_MIGRATION_BOUNDARY.md so V2 cannot become another global parity layer.
- [x] Lock the reference-based Stage 2 visual gate at docs/experience-v2/STAGE2_VISUAL_ACCEPTANCE.md.

Stage 2 in progress:
- [ ] Install and lock lucide-react using npm so package.json and package-lock.json remain consistent.
- [ ] Install and lock motion using npm so package.json and package-lock.json remain consistent.
- [ ] Build the single semantic CEAC V2 icon registry.
- [ ] Add the app-level MotionConfig and reusable V2 motion constants.
- [ ] Build the contained V2 primitive/gallery proof without rebuilding role screens.
- [ ] Verify the documented migration boundary in the actual icon/component implementation.
- [ ] Run Stage 2 desktop/laptop + mobile visual inspection against the persistent references before Stage 3.

Draft PR: #72

Stage 1 exit:
Stage 1 is complete only when all continuity documents and reference assets are in GitHub, AGENTS.md points to them, the branch builds/tests from the inherited baseline, and a new session can determine the exact current stage without reading any Chat transcript.

## Stage 2 current handoff

Exact verified engineering-green foundation checkpoint:
b947f8c88e73eccc46a3a470760b6e546ddbfe5a

Subsequent Stage 2 commits add only the migration-boundary and visual-acceptance documentation. Their exact current HEAD must be rechecked before dependency installation.

No unpushed Work state is known from this Chat handoff.

Next safe action:
use npm on the current Experience V2 branch to install the two ratified dependencies together, then commit package.json + package-lock.json before creating the icon registry or Motion provider. Do not hand-edit lockfile dependency records.

Do not rebuild role screens yet. The first objective remains to prove the shared visual foundation against the stored quality references. Do not begin Stage 3 until the Stage 2 foundation is visually inspected and accepted.

## Handoff rule

At the end of every substage, update this file. Never depend on an agent remembering where it stopped. The incoming Chat or Work session must inspect GitHub and this file before continuing.