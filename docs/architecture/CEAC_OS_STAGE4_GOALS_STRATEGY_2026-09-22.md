# CEAC OS — Stage 4 Goals and Strategy

**Date:** 22 September 2026
**Status:** IMPLEMENTATION CONTRACT
**Programme stage:** 4 — Goals and Strategy
**Base:** Stage 3 green head `579eba6bd62dc358e45dbdd68bd1a6d8d49b7c08`

## Purpose

CEAC OS needs a factual strategy chain that explains why work exists without inventing progress. Stage 4 establishes the strategic layers above delivery:

```
Ministry Direction
→ Ministry Objective
→ Unit Objective
→ delivery
```

Stage 5 will add the programme/portfolio and milestone delivery layers between Unit Objective, Project and Work. Stage 4 therefore creates the authoritative strategic hierarchy and an explicit link from a Unit Objective to existing Projects without duplicating the Stage 5 structures.

## Users and authority

- Signed-in CEAC users may read active strategy in their organisation.
- Group Pastor / Executive authority and the explicit `strategy.manage` capability may create or revise Ministry Direction and Ministry Objective records.
- A Unit Manager may create or revise Unit Objectives only for a unit they manage.
- `strategy.manage` may manage Unit Objectives across the organisation.
- Ordinary Staff cannot create or revise strategy.
- Project links require authority over the linked Unit Objective.

## Data

`strategy_nodes` stores:
- Ministry Direction;
- Ministry Objective;
- Unit Objective;
- descriptive or numeric measurement contract;
- target and current result only where numeric;
- dates, ownership and lifecycle state;
- an explicit reason for every creation/change.

`strategy_node_revisions` is append-only history produced automatically for every node version.

`strategy_delivery_links` links a Unit Objective to an existing Project. Stage 5 will extend the delivery hierarchy with programmes/portfolios and milestones.

## Measurement rules

Descriptive goals are statements. CEAC OS must never convert their text into a percentage.

Numeric goals require a target value and target unit. A current numeric result may be recorded, but the product shows the target and result together. It may calculate a factual ratio only for numeric display where useful; it must not reinterpret that ratio as a performance score.

## Lifecycle and correction

Strategy nodes use `draft`, `active`, `met`, or `closed`.

Records are not deleted. Corrections and updates write a new immutable revision snapshot with actor, time and reason. Delivery links are withdrawn rather than deleted.

## Audit

Every node and delivery-link insert/update is captured by the ordinary platform audit trail. Node revisions preserve the complete strategic record history.

## UI

The shared Strategy workspace must:
- show the Ministry Direction → Ministry Objective → Unit Objective hierarchy;
- keep descriptive goals textual;
- show numeric target/current values together;
- allow authorised users to create the correct level;
- allow authorised users to revise status/result with a reason;
- allow Unit Objectives to be linked to visible Projects;
- remain usable on supported phone widths.

## Tests

Required:
- all new public tables have RLS;
- anonymous access is absent;
- Staff cannot write strategy;
- Executive/`strategy.manage` can create ministry-level strategy;
- Unit Manager can manage only their own Unit Objectives;
- descriptive goals cannot contain fake numeric target/current state;
- numeric goals require a target and unit;
- revisions are append-only and attributable;
- project links cannot cross organisation/authority boundaries;
- audit records exist;
- all prior gates remain green;
- browser role/responsive acceptance passes.

## Acceptance

Stage 4 passes when authorised users can build and revise a synthetic Ministry Direction → Ministry Objective → Unit Objective chain, link a visible project, reload the hierarchy, and see factual descriptive/numeric states while unauthorised users cannot change strategy.
