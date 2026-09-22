# CEAC OS — Stage 5 Work Management 2.0

**Date:** 22 September 2026
**Status:** IMPLEMENTATION CONTRACT
**Programme stage:** 5 — Work Management 2.0
**Base:** consolidated Stage 4 main `115c23dfa100c39f7aeab8f9a9b46e55862d7d81`

## Purpose

Stage 5 matures CEAC delivery management without replacing the existing Work Engine.

The existing `projects`, `work_items`, project close, evidence, review and Rooms contracts remain authoritative. Stage 5 adds the missing structure around them:

- portfolios/programmes;
- richer project metadata;
- milestones;
- explicit project, milestone and work dependencies;
- project risks and issues;
- factual portfolio reporting.

This stage does not build a generic project-scheduling engine or calculate hidden project-health scores.

## Users

- Staff continue to execute work through the existing Work Engine.
- Unit managers manage delivery for projects led by units they manage.
- Administration can manage delivery across the organisation.
- Group Pastor / Executive can inspect organisation-wide delivery and manage ministry-level portfolios/programmes.
- `delivery.manage` grants explicit organisation-wide delivery-management authority without making the holder Administration.

## Authority

Organisation-wide portfolio/programme creation and management requires one of:

- `delivery.manage`;
- Group Pastor / Executive authority.

A unit manager may create and manage a portfolio/programme only when it is owned by a unit they manage.

Project metadata, milestones, risks/issues and dependencies may be changed only by:

- a manager of the project's lead unit;
- `delivery.manage`;
- Administration;
- Group Pastor / Executive.

Visibility never expands existing project/work visibility. Work dependencies require both work items to be visible to the reader.

## Data

### Delivery groups

`delivery_groups` represents a Programme or Portfolio.

Fields include:

- kind: `programme | portfolio`;
- optional parent portfolio;
- optional owning unit;
- optional linked strategy node;
- name/purpose;
- owner;
- dates;
- status;
- reason/history metadata.

A Programme may sit under a Portfolio. A Portfolio cannot sit under another Programme/Portfolio in Stage 5.

### Project membership

`delivery_group_projects` links projects into Programmes/Portfolios without rewriting project identity.

Links are attributable and withdrawable rather than deletable through normal application authority.

### Mature project metadata

Stage 5 extends `projects` with:

- explicit priority;
- explicit health;
- sponsor;
- delivery owner;
- updated-by/time;
- change reason.

Health is entered as a factual management state (`on_track | watch | at_risk | blocked`). CEAC OS does not infer or score it.

### Milestones

`project_milestones` records significant delivery checkpoints with:

- target date;
- owner;
- status;
- completion time;
- reason/history.

### Dependencies

Three explicit dependency tables preserve real foreign keys:

- `project_dependencies`;
- `milestone_dependencies`;
- `work_dependencies`.

Dependencies are directional: the successor depends on the predecessor.

They are never hard-deleted by browser roles. Correction uses `resolved` or `withdrawn`.

### Risks and issues

`project_register_items` records project risks and issues with:

- kind;
- severity;
- likelihood for risks;
- owner;
- factual description/impact;
- response plan;
- target date;
- state;
- resolution metadata.

## Sensitive data

Stage 5 stores operational delivery information only.

It must not contain:

- protected HR;
- salary or payroll;
- bank/payment details;
- national identifiers;
- credentials/secrets;
- private employee notes.

Confidential/private work-item visibility remains governed by the existing Work Engine.

## Lifecycle

Delivery group:
`active → paused → closed`

Project health:
explicit manager state only; no automatic scoring.

Milestone:
`planned → in_progress → achieved`
with `missed` and `cancelled` as explicit terminal/management states.

Dependency:
`active → resolved | withdrawn`

Risk/issue:
`open → monitoring/in_progress/accepted → resolved`

Resolved/withdrawn records remain history.

## Audit

The ordinary Stage 1B platform audit captures:

- delivery group insert/update;
- group/project link insert/update;
- project metadata update;
- milestone insert/update;
- dependency insert/update;
- risk/issue insert/update.

## Correction and reversal

No browser delete is required for Stage 5 delivery records.

Mistakes are corrected by:

- revising project metadata with a reason;
- withdrawing a project/group link;
- revising a milestone;
- resolving/withdrawing a dependency;
- resolving/revising a risk or issue.

## Strategy integration

A delivery group may link to an existing Stage 4 strategy node.

Existing `strategy_delivery_links` continue to link Unit Objectives directly to projects; Stage 5 does not rewrite that contract.

## UI

Stage 5 adds a **Delivery** workspace for managers, Administration and Executive users.

It provides:

- Programmes/Portfolios;
- linked project overview;
- explicit project health/priority;
- milestone management;
- risk/issue register;
- project dependencies;
- milestone dependencies;
- work dependencies;
- factual portfolio reporting.

Portfolio reporting contains counts and explicit states only. It does not produce a synthetic score.

## Tests

Required:

- clean migration replay;
- all Stage 0–4 gates remain green;
- RLS on every new table;
- no anonymous access;
- no browser hard-delete of Stage 5 records;
- authority boundary for organisation-level vs unit-level groups;
- project metadata authority;
- milestone authority;
- project/milestone/work dependency visibility and mutation authority;
- risk/issue lifecycle;
- append/reversal semantics;
- audit capture;
- browser acceptance for manager/Admin/Executive;
- Staff cannot access the Delivery workspace;
- phone-width acceptance where applicable.

## Acceptance

Stage 5 passes when:

1. an authorised manager creates a unit Programme;
2. links a visible project;
3. records explicit project health and priority;
4. creates and completes a milestone;
5. records a risk/issue;
6. creates at least one dependency;
7. reloads and sees the same records;
8. portfolio reporting reflects those explicit records;
9. ordinary Staff cannot access or mutate the Delivery workspace;
10. all earlier security, migration and browser gates remain green.

No Stage 6 work begins until Stage 5 is green and merged to main.
