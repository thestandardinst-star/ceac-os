# CEAC OS — Stage 1E Workflow Engine

**Date:** 22 September 2026
**Status:** IMPLEMENTATION CONTRACT
**Programme stage:** 1E — Platform Foundation v2
**Base:** Stage 1D green head `7a14a0a8b6b6a5059af29efff36378dd7a6dff61`

## Purpose

CEAC OS needs a durable workflow engine that can turn business events into explicit, reviewable process runs without burying process logic inside individual screens.

## Users

- Users only see workflow steps they are authorised to act on.
- Administration users with `audit.view` may inspect workflow runs.
- A step may require an explicit capability such as `people.manage` or `authority.manage`.

## Authority

Workflow definitions are system-owned in Stage 1E.

Browser users cannot directly insert, update or delete workflow definitions, runs or steps.

A reviewed RPC completes a ready workflow step only when:
- the caller belongs to the organisation;
- the step is ready;
- the caller has the required capability;
- the run is active.

## Data

`workflow_definitions`
- stable key;
- label;
- triggering platform event type;
- active/version.

`workflow_definition_steps`
- ordered step key;
- label;
- step type;
- required capability.

`workflow_runs`
- definition;
- source event;
- organisation;
- subject/aggregate;
- state;
- started/completed time.

`workflow_run_steps`
- copied step contract for a specific run;
- state;
- capability requirement;
- completion actor/outcome/note/time.

## Sensitive data

Workflow context contains identifiers and safe event context only. It must not duplicate protected HR, payroll values, secrets, national identifiers, bank data or arbitrary source rows.

## Lifecycle

Workflow run:
`queued → active → completed`

Step:
`pending → ready → completed`

A failed or cancelled state is reserved in the contract for later automation/integration stages, but Stage 1E does not expose uncontrolled browser failure/cancellation actions.

## Event handling

The Stage 1D event stream starts matching workflow definitions automatically.

Stage 1E seeds two real workflows:
- Employment change review — triggered by `employment.changed`, reviewed by `people.manage`.
- Authority change review — triggered by `authority.granted` and `authority.revoked`, reviewed by `authority.manage`.

Starting and completing workflows emits `workflow.started` / `workflow.completed` platform events.

## Audit

Workflow run/step state changes are captured by the Stage 1B ordinary platform audit.

Step completion records actor, time, outcome and note.

## Correction and reversal

Completed workflow history is not rewritten. A corrected business event starts a new workflow run.

## Integrations

None in Stage 1E. Stage 1G may consume workflow events and may later add controlled integration actions.

## UI

Administration gains a Workflow inbox, capability-aware, with:
- ready steps;
- process name;
- source event;
- subject/aggregate context;
- required authority;
- complete action with outcome/note;
- recent completed workflow runs.

## Tests

Required:
- clean replay;
- RLS on workflow tables;
- no anonymous access;
- no direct authenticated mutation;
- internal event-start function unavailable to browser roles;
- unique run per workflow definition/source event;
- ordered step progression;
- required capability enforcement;
- workflow start/completion events;
- audit capture;
- Stage 1E workflow SQL gate;
- browser completion acceptance;
- all prior Stage 1 gates remain green.

## Acceptance

Stage 1E passes when an employment event automatically creates a workflow run, an authorised user can complete its ready review step, the run becomes completed, the history survives reload, and unauthorised roles cannot mutate it.

No Stage 1F work begins until Stage 1E is green.
