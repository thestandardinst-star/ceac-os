# CEAC OS Experience V2 — Session Start Prompt

Use this exact instruction when starting a new Chat or Work session if the previous conversation is no longer available:

Continue CEAC OS Experience V2 in repository thestandardinst-star/ceac-os.

Do not assume prior session memory is current.

First inspect GitHub:
- main;
- open PRs;
- branch chatgpt/experience-v2-2026-09-26;
- its exact HEAD;
- workflow/check status;
- PR #72;
- PR #69;
- frozen PR #71.

Then read in order:
1. docs/experience-v2/START_HERE.md
2. docs/experience-v2/BUILD_STATE.md
3. docs/experience-v2/CEAC_OS_EXPERIENCE_V2_SOURCE_OF_TRUTH.md
4. docs/experience-v2/IMPLEMENTATION_SEQUENCE.md
5. docs/experience-v2/REFERENCE_INDEX.md
6. docs/experience-v2/ACCEPTANCE_AND_HANDOFF.md
7. docs/experience-v2/DECISION_LOG.md
8. docs/experience-v2/BASELINE_AUDIT.md
9. AGENTS.md
10. the relevant current architecture/security contract for the active stage.

The persistent visual, motion, current-gap and source-mockup references are in the user's Library under:
CEAC OS / Experience V2 / References

Determine the current stage/substage from BUILD_STATE.md and compare it to actual branch HEAD before editing.

Continue ONLY the unfinished work in the current stage.

Rules:
- one active writer at a time;
- do not modify frozen PR #71;
- do not merge PR #72 until release acceptance;
- do not weaken RLS/security/data contracts;
- do not invent CEAC data or policy;
- do not expand legacy CSS override debt;
- commit/push every meaningful substage;
- update BUILD_STATE.md before handing off;
- if a previous Work session has unpushed changes, do not overwrite/recreate them.

The quality bar is binding. Use the stored references for typography, spacing, iconography, responsive composition and motion. Passing automated tests alone is not product acceptance.

At the start of your response/report, state:
- exact branch HEAD;
- current Experience V2 stage/substage;
- what is already complete;
- what you will do next;
- whether any blocker or unpushed state exists.