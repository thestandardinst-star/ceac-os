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

### Who filed, and who did not (migration 021)

CEAC's decision on the previously unresolved gate: **the lead unit may
close at any time — no department blocks the project — but the overall
close permanently records which participating departments had filed and
which had not.**

Before closing, show the lead where the gaps are:
`project_close_readiness(p_project_id uuid) → (unit_id, unit_name, filed, submitted_at)`

`submit_project_close` now snapshots participation into
`project_close_participation(close_id, unit_id, unit_close_id, filed)`
for an overall close. It is a snapshot, not a live query: a department
filing three weeks later does not retroactively make the overall close
look as though they filed on time. The table has a read policy only —
it is written solely by the function, so the snapshot cannot be edited.

**Display the non-filers on the closed project.** Not as a complaint —
as the record. Suggested wording: "Facility did not file a return."

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

---

## Finance requests (migrations 022, 023)

CEAC's rules: department heads only may ask. Up to GHS 1,000
Administration decides; 1,001–10,000 Finance; above 10,000 Finance **then**
the Group Pastor, both required. Approved money counts against the budget
immediately. Finance turns an approved request into spend.

`finance_request_path(amount_minor, currency, org_id) → text[]`
Returns the authorities needed in order, e.g. `{finance,exec}`.
Thresholds are per currency in `finance_approval_rules`, because the
limits are cedi figures and conversion is forbidden. **A currency with no
row escalates to the Group Pastor** — over-approving is recoverable.

`decide_finance_request(p_request_id, p_decision, p_note) → text`
Returns `approved`, `declined`, or `awaiting finance`/`awaiting exec`.
Rejects a caller who is not the authority required at that stage, and
rejects a second decision from the same person on one request.

`fulfil_finance_request(p_request_id, p_spent_on, p_source_note) → uuid`
Finance or Administration only. Creates the spend line from the request —
same amount, currency and unit — and links the two. No retyping.

`unit_budget_position(p_unit_id, p_year) → (currency, budget_minor,
spent_minor, committed_minor, remaining_minor)`
Per currency, never summed. `committed_minor` is approved-but-unpaid.
**Show remaining, not budget minus spent** — otherwise a head commits
money that is already promised.

Raising a request: insert into `finance_requests`. RLS restricts it to a
head of that unit. A requester may cancel their own only while state is
`submitted`.

The floor is `no_request_below_minor`, currently **0 — every purchase
needs a request**, as instructed. Recommend raising it (~GHS 200): if a
head must raise a request for batteries they will stop using the system
for the large purchases too.

## Ministry calendar (migration 024)

Ownership settled: Administration and the head of Programs maintain it,
the Group Pastor oversees. `units.owns_calendar` marks the owning unit —
a flag, not the name 'Programs', so it survives a rename. Currently set
on PRG.

`ministry_events(id, org_id, title, kind, scope, unit_id, starts_at,
ends_at, all_day, location, notes, cancelled)`
kind: service | special_service | convention | training | meeting |
outreach | other. scope: church | unit.

`ministry_event_units(event_id, unit_id, note)` — which departments the
event needs, and what for. **This is the part Media and Facility
actually use**: surface it on their calendar, not just the event title.

Everyone reads. Only Administration, the calendar unit's head, and the
Group Pastor write.

`cancel_ministry_event(p_event_id, p_reason) → uuid`
Cancelling is not deleting — departments planned around it and must see
that it is off. Cancelled events stay visible.

**Manager Calendar may now connect the ministry source.** Remove the
"not connected" state and show ministry events alongside project dates,
task deadlines and leave, flagging events that need that manager's unit.

## Project close — authority fix and reversibility (migration 025)

Two defects in 020, found by Codex during PR #4 review. Both were mine.

**Tautology in `pc_insert`.** The unqualified names inside the EXISTS
resolved to the inner table, so the participation check compiled to
`pu.project_id = pu.project_id` — always true. A manager could file a unit
close for a project their unit had nothing to do with. Columns are now
qualified as `project_closes.project_id` / `project_closes.unit_id`.

**`submit_project_close` never checked participation.** It verified the
caller manages the unit but not that the unit is part of the project. It
does now and raises "That unit is not part of this project."

**Reversibility.** Architecture v4 §14: nothing is irreversible, and the
way back is stated on the screen that does the thing. Closed project is
listed explicitly — reopened by the manager, the close report versioned
not overwritten. `close_project()` had no way back.

`reopen_project(p_project_id uuid, p_reason text) → uuid`
Lead unit or Administration. Requires a reason, which is written to
`activity_events`. Sets the project back to `active`. **Every submitted
close is kept** — nothing is deleted.

`next_close_version(p_project_id, p_scope, p_unit_id) → int`
Use this when creating a close row after a reopen, so a later close
becomes version 2 rather than colliding with version 1.

**Codex: the close button can now be exposed.** §14 also requires the way
back to be stated on the screen that does the thing — so the close
confirmation should say the project can be reopened by the lead unit, and
the closed project should show the reopen action rather than hiding it.

Still unreversed elsewhere, not in scope here: an approved submission has
no reopen path (§14 lists "Manager reopens with a reason; recorded in the
activity log"). Flagging rather than building it unasked.

---

## Manager reports (migrations 026, 027)

Three verified defects in 010, now fixed. The old UNIQUE on
`(period_id, scope, unit_id, profile_id, project_id)` could not prevent
duplicates — `profile_id` and `project_id` are NULL on a unit report, and
NULLs are distinct in a Postgres unique constraint. `rpt_write` was
`FOR ALL`, so a manager could edit their own submitted report. There was
no evidence snapshot, no version, no challenges field, no RPCs.

`reports` gained: `version`, `challenges`, `correction_reason`,
`supersedes_report_id`, `evidence jsonb`. Scope now includes `project`.

Two indexes replace the old constraint: `reports_identity_idx` (coalesced,
including version — allows v2, forbids two v1s) and
`reports_one_draft_idx` (at most one draft per identity, so concurrent
saves cannot fork).

Policies: insert and draft-only update. **No delete policy.** Submitted
and confirmed reports cannot be changed by any client.

### Load the open period
```js
const { data: period } = await supabase.from("report_periods")
  .select("id, label, kind, starts_on, ends_on")
  .eq("status", "open").order("starts_on", { ascending: false })
  .limit(1).maybeSingle();
// none → Administration has not opened one. Say so; do not create one.
```

### Save a draft (creates or updates — safe to call repeatedly)
```js
const { data: reportId } = await supabase.rpc("save_report_draft", {
  p_period_id: period.id, p_scope: "unit",       // or "project"
  p_unit_id: me.unit_id, p_project_id: null,
  p_narrative: narrative, p_challenges: challenges });
```
Refuses a closed period, a unit you do not lead, or a project outside
`app_visible_projects()`.

### Submit — freezes the figures
```js
await supabase.rpc("submit_report", {
  p_report_id: reportId,
  p_evidence: { completed: 12, submissions: 18, overdue: 3,
                sessions: 41, by_project: [...], status_mix: {...} } });
```
Whatever you pass as `p_evidence` is **what the report will say forever**.
Pass exactly the figures on screen at submission. Do not re-query later —
the whole point is that a late submission or an edited work item cannot
silently change a submitted report.

Write `report_evidence_refs(report_id, section, object_type, object_id,
label)` while still a draft, for drill-down from the frozen report to the
real rows. Sections are yours; suggested: `completed`, `submissions`,
`overdue`, `sessions`.

### History and corrections
```js
// every version, newest first
supabase.from("reports").select("*")
  .eq("period_id", pid).eq("unit_id", uid).order("version", { ascending: false });

// a correction is a NEW draft version; the submitted one is untouched
const { data: newId } = await supabase.rpc("correct_report",
  { p_report_id: submittedId, p_reason: "Undercounted Sunday setup" });
```

### Confirmation
`confirm_report(p_report_id)` — Administration or Group Pastor only, and
**never the person who submitted it**. Both checks are in the database.

### Not built
No AI interpretation function exists and none was created. When one is
added it must read `reports.evidence` of **submitted** rows only, state
what moved, fell or is stuck, never predict, never invent a figure, and
never run in the render path. The frozen snapshot is what makes that
possible.

No PDF service. Browser print stays the output; `evidence` plus
`report_evidence_refs` make a branded PDF reproducible later.

No reporting period was seeded. Administration opens periods.
