# Database contract for the Manager panel

Written for Codex. Migrations 013–020. Claude owns all migrations.

## Available now

### Work references
`next_work_ref(p_unit_id uuid, p_sub_team_id uuid default null) → text`
Returns `MED-014` / `MED-GFX-014`. Atomic, never reuses a number.

### Manager self-certification
`self_certify_work(p_work_item_id uuid, p_session_id uuid default null,
                   p_note text default null, p_link text default null) → uuid`
Returns the submission id. Requires the caller to be the assignee **and**
an active manager of that unit (or admin/exec). Enforces checklist
completion server-side for `task` kind. Sets `self_certified`,
`completed_at`, `last_movement_at`.

Clients cannot set `self_certified` directly — both work_items update
policies exclude it. This RPC is the only route.

**Review queues must filter on `in_review`.** Self-certified work must
never appear in one. Any "completed" count should include both
`completed` and `self_certified`, or managers' own finished work vanishes.

### Checklist-specific return
`return_work_for_correction(p_submission_id uuid, p_comment text,
                            p_checklist_item_ids uuid[] default null) → uuid`
Returns the review id. Rejects an empty comment. Flagged ids are filtered
to the submission's own work item. Sets `undone_at` on active ticks —
never deletes. Sets `returned`, `first_time_approved = false`, clears
`completed_at`.

Read which items were flagged:
`review_checklist_items(review_id, checklist_item_id)` — staff can read
this for their own work through the review → submission → work-item chain.

Tick history and reviews are now append-only: no delete policy on either.

### Objective references
`next_objective_ref(p_project_id uuid default null, p_unit_id uuid default null) → text`
Returns `PRJ-OBJ-01`. Unique index on
`(org_id, project_id, unit_id, ref)`. New nullable column `objectives.measure`
— objectives are descriptive first; numeric target is optional.

### Project close
Tables: `project_closes`, `project_close_objectives`,
`project_close_costs`, `project_close_deliverables`.

Create a draft row in `project_closes` (`scope` = `unit` or `overall`),
fill the three child tables, then:

`submit_project_close(p_close_id uuid) → uuid`
Refuses unless every relevant objective has a verdict
(`met` / `partly_met` / `not_met`) and something is recorded as produced.
Objective verdicts are never inferred from task completion.

`close_project(p_project_id uuid) → uuid`
Refuses unless a submitted **overall** close exists. Only the lead unit.
A project is not closed by setting its status.

Submitted closes are immutable — the update policy matches drafts only.
Corrections are a new `version`, not an edit.

Costs are one row per currency: `planned_amount_minor`,
`actual_amount_minor`. Never summed across currencies.

### Project-wide work visibility
`app_can_see_item` now also allows a manager of a **lead or participating**
unit to see that project's work. Private and confidential work stay
excluded. Staff visibility is unchanged — the clause requires
`app_managed_units()`, which is empty for staff.

**You may drop the "visible-unit work only" qualifier** on project totals
for a manager, for non-private non-confidential work on projects where
their unit leads or participates.

### Budgets
`bg_read` was `org_id = app_org_id()` — every user could read every
budget. Now: admin/exec, the finance unit, managers of the budget's unit,
and budgets on visible projects. Writes unchanged: Administration only.
Manager Finance stays read-only.

### Transfers
Unchanged. Only the **receiving** unit's manager or admin may confirm or
dispute; a sender cannot confirm their own. Managers see transfers
involving their unit.

## Not built — no legitimate source exists

**Project discussion / Messages.** No message, thread or room table
exists. Not created, to avoid a project-only table conflicting with the
later unified Messages module. Recommended contract when that task comes:
`threads(id, org_id, scope['task'|'project'|'direct'], subject_id,
created_by)` plus `thread_messages(id, thread_id, author_id, body,
sent_at)` and `thread_participants`. One model, three scopes.
Keep showing the unavailable state.

**Ministry calendar.** `activity_events` exists but is an audit log
(`actor_id`, `verb`, `object_type`, `object_id`) — not a calendar. No
migration made. CEAC must decide who owns the ministry calendar and what
an entry is before a contract can be written. Keep saying the ministry
source is not connected.

**Finance requests.** No request or approval model exists, and
`spend_lines`, `budgets` and `internal_transfers` are not requests. No
migration made. CEAC must first answer: what counts as a request, who
submits, who approves, whether approval has stages, whether an approved
amount becomes committed cost, and how Finance turns an approved request
into actual spend. Keep showing the unavailable state.
