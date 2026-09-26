# CEAC OS Experience V2 — START HERE

Status: ACTIVE. This file is the mandatory entry point for every Chat or Work session that touches Experience V2.

## Source of truth

GitHub is the continuity source of truth. Chat history, Work session memory, screenshots in a temporary browser, and an agent's internal state are not authoritative.

Active branch: chatgpt/experience-v2-2026-09-26
Baseline: 1a0fb33d3fff18ddae63e6523547b4f4d5d5c883
Repository: thestandardinst-star/ceac-os

Experience V2 is a controlled rebuild of the visible product experience. It preserves the proven CEAC data, security, RLS, capability, audit, workflow and business-rule contracts unless a later stage explicitly requires an approved change.

## Mandatory start procedure

Before editing anything, every Chat or Work session must:

1. Inspect GitHub first: main, this branch HEAD, open PRs, changed files, workflow/check status and latest Experience V2 handoff.
2. Read, in this order:
   - docs/experience-v2/BUILD_STATE.md
   - docs/experience-v2/CEAC_OS_EXPERIENCE_V2_SOURCE_OF_TRUTH.md
   - docs/experience-v2/IMPLEMENTATION_SEQUENCE.md
   - docs/experience-v2/REFERENCE_INDEX.md
   - docs/experience-v2/ACCEPTANCE_AND_HANDOFF.md
   - AGENTS.md
   - the current domain/security contract for any functional surface being touched.
3. State the current Experience V2 stage and substage from BUILD_STATE.md.
4. Compare the branch HEAD with the recorded handoff. If they disagree, stop and reconcile the repository state before editing.
5. Continue only the unfinished work in the current stage. Do not jump ahead because another mode or agent is temporarily unavailable.

## Chat ↔ Work continuity rule

Chat and Work may alternate. They must never edit the same branch at the same time.

When Work reaches a usage limit:
- if its changes are committed and pushed, Chat may inspect that exact HEAD and continue safely;
- if changes exist only inside the Work environment and are not pushed, Chat must not guess or recreate them. Chat may review, plan or prepare the next brief, but implementation waits until the unfinished work is recovered and pushed.

When Work resumes after Chat has changed the branch:
- Work must inspect/fetch the latest branch HEAD first;
- Work must not resume from stale local assumptions;
- Work must read BUILD_STATE.md and the latest commits before changing files.

One active writer. One branch. One canonical history.

## Required checkpoint discipline

At every meaningful substage:
- commit and push;
- run the required tests for that substage;
- update BUILD_STATE.md with what is complete, what remains and any blocker;
- record any design/product decision that changes the contract;
- store visual evidence or reference additions in the repository, not only in a conversation.

No important TODO, decision, visual reference, acceptance failure or unresolved blocker may exist only in Chat or Work memory.

## Protected programme boundaries

- PR #69 remains a recovery/reference line until Experience V2 supersedes it.
- PR #71 Stage 12 remains frozen until Experience V2 is accepted and merged.
- Stage 13 Payroll remains blocked until CEAC payroll rules are formally confirmed.
- Do not alter Supabase, migrations, RLS, production data, environment variables or provider configuration merely to achieve visual parity.
- Do not delete working functionality because it is no longer a top-level navigation item. Recompose it contextually.

## Quality rule

The user-supplied visual references and motion reference define the required craftsmanship level. They are not loose inspiration.

The rebuild must deliberately match their standard of:
- typography hierarchy;
- spacing rhythm;
- icon consistency;
- component geometry;
- information density;
- responsive composition;
- calendar/data visualisation quality;
- interaction feedback;
- purposeful motion;
- desktop/laptop and mobile coherence.

CEAC identity, data and product architecture remain CEAC's. Do not copy another product's branding or content.

Passing tests is necessary but not sufficient. A stage does not pass until product-quality inspection passes.