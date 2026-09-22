# CEAC OS — Stage 4 Goals and Strategy Handoff

**Date:** 22 September 2026
**Status:** ACTIVE / STACKED
**Repository:** `thestandardinst-star/ceac-os`
**Base:** Stage 3 green head `579eba6bd62dc358e45dbdd68bd1a6d8d49b7c08`
**Branch:** `chatgpt/enterprise-expansion-stage-4-goals-strategy-2026-09-22`
**Migration:** 084 — Goals and Strategy

## Implemented

- Ministry Direction → Ministry Objective → Unit Objective hierarchy;
- explicit `strategy.manage` authority;
- Executive authority for ministry-level strategy;
- Unit Manager authority limited to managed Unit Objectives;
- descriptive goals that cannot carry numeric target/current state;
- numeric goals with target + unit and factual current result;
- immutable attributable strategy revisions;
- Unit Objective → Project delivery links with attributable withdrawal;
- draft visibility restricted to authorised strategy owners;
- ordinary-platform audit capture for nodes and delivery links;
- shared Strategy workspace across Staff, Manager, Administration and Group Pastor shells;
- Stage 4 SQL security/authority gate;
- browser acceptance for creation, manager revision, project linking, reload persistence and Staff read-only access;
- responsive Administration coverage includes Strategy.

## Boundaries preserved

- descriptive text is never converted into an invented percentage;
- Staff can read published strategy but cannot author or revise it;
- draft strategy is not exposed to ordinary Staff;
- managers cannot author another unit's Unit Objective;
- revisions are append-only; current records are corrected through attributable new revisions;
- delivery links are withdrawn, not deleted;
- Stage 4 does not duplicate Stage 5 programme/portfolio or milestone objects;
- personal goals remain private and separate from organisational strategy.

## Stage 5 handoff

Stage 5 should extend the delivery chain from the Stage 4 Unit Objective into:

```
Unit Objective
→ Programme / Portfolio
→ Project
→ Milestone
→ Work
```

It should add mature project metadata, milestones, dependencies, risks, issues and portfolio reporting without turning CEAC OS into a generic scheduling engine.

## Acceptance correction

- Staff mobile Strategy acceptance uses the mobile tab navigation rather than the hidden desktop sidebar at phone widths.

## Exit gate

Stage 4 is ready only when:
- CI passes;
- clean Migration Replay passes;
- Account Security passes;
- all prior SQL gates remain green;
- Stage 4 Goals and Strategy gate passes;
- Playwright role/browser acceptance passes;
- supported phone-width acceptance passes.
