# CEAC OS — Current Ownership and Handoff Checkpoint

**Date:** 20 September 2026
**Repository:** `thestandardinst-star/ceac-os`
**Working PR:** #4
**Working branch:** `codex/manager-home-my-work-foundation`
**Checkpoint head before 045:** `d2b37dbefceb00ff101bd705c37f15b6311fa935`
**Current main/base:** `bfbcebad33c680a953ce01acc63a49a0f1cce3a0`

## Purpose

This file is the coordination boundary between the current ChatGPT/Codex work and Claude's existing work. It exists to prevent either agent from recreating, overwriting or silently changing the other's contracts.

The user has explicitly authorised the current agent to continue the backend work that was previously reserved for Claude. That is an ownership handoff for the backend packages described below; it is **not** permission to redesign Claude-owned Admin/Executive screens.

## File ownership

### Claude-owned UI — do not modify without a new explicit handoff

- `src/screens/AdminHome.jsx`
- `src/screens/Units.jsx`
- `src/screens/People.jsx`
- `src/screens/Attendance.jsx`
- `src/screens/Cost.jsx`
- `src/screens/OfficeSettings.jsx`
- `src/screens/ExecutiveHome.jsx`

### Current agent / Manager + Staff ownership

- `src/screens/ManagerHome.jsx`
- `src/screens/ManagerDelivery.jsx`
- `src/screens/ManagerProjects.jsx`
- `src/screens/Assign.jsx`
- `src/screens/Team.jsx`
- `src/screens/Home.jsx`
- `src/screens/Work.jsx`
- `src/screens/Item.jsx`
- `src/screens/Record.jsx`
- `src/screens/Me.jsx`
- `src/screens/StaffTeam.jsx`
- `src/screens/Goals.jsx`

### Shared files

`src/App.jsx` and `src/components/bits.jsx` are shared. Make additive/minimal edits only; do not reorder or rewrite unrelated Claude routing/navigation.

## Applied database state

Live Supabase migrations are **001–044** and GitHub contains all 44 migration files.

Do not recreate or amend an applied migration.

Key completed packages:

- **034–039** — emergency security hardening.
- **040** — official membership/sub-team/project-close authority hardening.
- **041** — atomic Manager approval/return + approved-work reopen.
- **042** — typed-work extension schema.
- **043** — typed-work behavioural RPCs.
- **044** — Routine schedule-version bug fix found during rollback acceptance.

Next migration number is **045**.

## Contracts Claude must not recreate

Already live:

- profile self-update guard;
- authoritative `activity_events` boundary;
- append-only Routine occurrence history;
- protected background-job execution;
- hardened reference/version/helper RPCs;
- finance request persistence and decision/fulfil RPCs;
- ministry calendar persistence;
- project close/readiness/reopen;
- report draft/submit/correct/frozen evidence;
- atomic work approval and return;
- approved-work reopen with retained reason/history;
- typed-work tables and RPCs for Routine, Case, Request, Decision, Meeting outcome and Deliverable.

## Typed-work backend inspection findings still open at this checkpoint

Migration 045 is intentionally limited to four verified defects:

1. **Legacy Routine reconciliation** — five pre-typed `recurring_operations` rows have no `work_item_id` and therefore are stranded from the shared Work Engine.
2. **Lifecycle bypass** — Routine, Case, Request and Decision can still be moved directly to generic `in_review`, bypassing their type-specific actions.
3. **Named cross-unit Request** — the typed-work base assignee check requires the responsible person to belong to the requesting unit, which blocks a legitimate cross-unit Request to a named person.
4. **Sub-team deletion cascade** — a manager can delete a populated sub-team lane and `ON DELETE CASCADE` removes HR-controlled membership rows. Lane removal must refuse until memberships/work are explicitly moved/cleared.

No other feature or policy belongs in 045.

## Explicitly unresolved policy

Finance authority still means membership in a unit where `handles_finance=true`.

Do not silently reinterpret this as Finance unit head or a dedicated capability until CEAC makes that operating decision.

## Work after 045

Only after 045 passes rollback acceptance:

1. integrate Routine client behaviour;
2. test it;
3. integrate Case;
4. test it;
5. integrate Request;
6. test it;
7. integrate Decision;
8. test it;
9. integrate Meeting outcome;
10. test it;
11. integrate Deliverable;
12. test it.

Do not enable all six forms at once.

## Still outside this sequence

Do not pull these into 045 or the typed-work client pass:

- protected Employee/HR storage/model;
- Templates;
- Messages/project discussion;
- report semantic expansion beyond the current contract;
- Finance reversal convention;
- Admin/Executive redesign.

## Merge boundary

PR #4 remains unmerged until the new typed-work client flows have been exercised with real authenticated Manager/Staff accounts on phone and laptop and no blocking regression remains.


## Execution update after this checkpoint

Migration **045 — typed-work reconciliation hardening** is now live and committed.

Rollback acceptance confirmed:

- five legacy routines are linked to `work_items`;
- explicit Sunday routines retained Sunday schedules;
- ambiguous legacy `Weekly` routines were not assigned invented weekdays and can be configured from today;
- Routine, Case, Request and Decision cannot enter the generic review lifecycle;
- named cross-unit Request responsibility works;
- populated sub-team lanes cannot be deleted by Manager or Admin until memberships/work/routines are cleared;
- empty lanes remain removable;
- Meeting outcome and Deliverable retain the normal review transition.

### Client integration state

Typed-work client integration has begun **one type at a time**.

**Routine — connected**
- Manager Assign has a Routine-specific creation form;
- schedule supports daily, weekly, selected weekdays and monthly;
- optional start/end dates;
- optional recorded numeric value + label;
- Routine detail shows schedule and occurrence history;
- occurrence recording uses the authoritative RPC;
- Manager can pause/resume and change only future schedules;
- legacy routines with ambiguous old cadence clearly show that schedule setup is required;
- Manager Home surfaces the unit's routines, including the five reconciled legacy records;
- generic Task submission/waiting actions are suppressed for Routine.

**Still disabled in Assign**
- Case
- Request
- Decision
- Meeting outcome
- Deliverable

Do not enable the next type until the current Routine flow has been inspected with authenticated Manager/Staff accounts.


## Typed-work client integration — completed

The one-type-at-a-time client sequence is now complete.

### Routine
- type-specific creation;
- daily/weekly/selected-weekday/monthly schedules;
- occurrence history and occurrence recording;
- optional numeric value;
- pause/resume;
- future schedule changes;
- legacy ambiguous schedules require explicit setup rather than guessed weekdays;
- Manager Home routine access.

### Case
- type-specific creation with owner/opened date/optional target resolution;
- generic submission/review flow suppressed;
- only the case owner or Administration records the permanent resolution.

### Request
- type-specific creation;
- responsible unit is selectable across the organisation;
- named person is selectable only where People RLS already permits that manager to see the person;
- cross-unit unit-level Requests are supported without weakening People visibility;
- response history;
- fulfil / decline / ask for clarification / provide clarification / cancel;
- responsible-unit Manager Home surfaces incoming unit Requests;
- generic submission/review flow suppressed.

### Decision
- type-specific creation with named decision-maker and explicit question;
- permanent decision + rationale recording;
- generic submission/review flow suppressed.

### Meeting outcome
- type-specific creation;
- meeting title/date/note preserved as source;
- follows the normal submission/review path;
- manager-owned meeting outcomes may self-certify under the existing manager-own-work rule.

### Deliverable
- explicit finished-output contract;
- no Task checklist semantics;
- optional/required evidence setting;
- current client uses evidence links because no general upload pipeline exists;
- normal submission/review flow;
- Manager approval and manager self-certification both enforce required evidence.

### Final lifecycle boundary

Generic Task-style submission controls are shown only for:

- Task
- Meeting outcome
- Deliverable

Routine, Case, Request and Decision expose only their own lifecycle actions.

Claude-owned Admin/Executive screen files remain untouched by this typed-work client integration.

## Staff experience continuation — completed

The Staff-strengthening sequence was continued after the typed-work pass.

### Live database

Live migrations are now **001–054**. Next migration number: **055**.

Added in this continuation:

- 047 work-session recovery + blocker resolution
- 048 announcements
- 049 announcement policy-recursion fix
- 050 unit resources
- 051 same-unit approved-leave visibility
- 052 employee ordinary personal details
- 053 stale-session continue correction
- 054 attributable personal-profile update enforcement

### Staff navigation

Staff navigation is now:

- Home
- Work
- Team
- Record
- Me

### Staff Home

Home now keeps the operational core while adding relevant employee context:

- current/stale work-session state;
- returned, overdue and actionable work;
- announcement acknowledgement attention;
- due-today and in-progress work;
- upcoming ministry/calendar events;
- near-term birthdays;
- upcoming approved leave;
- recent leave decisions;
- current announcements;
- recent feedback;
- factual weekly completion.

Empty secondary sections remain suppressed.

### Team

Staff Team now includes:

- directory;
- unit leadership and sub-team leads;
- who is away on approved leave;
- recent joiners;
- birthdays in the next 30 days;
- approved unit resources.

The Team surface remains explicitly non-performance-related.

Managers can manage ordinary unit resource links from their existing Team setup area. No protected file storage was added.

### Announcements

A standalone Announcements surface is now routed additively through shared navigation.

It supports:

- organisation/unit/role targeting;
- draft/publish/close;
- normal/important/urgent priority;
- optional expiry;
- read receipts;
- required acknowledgement;
- factual audience/read/acknowledgement counts.

Admin/Group Pastor and explicit announcement capability holders may author. Ordinary Staff cannot publish.

### My Record

Staff Record now provides source-based factual history:

- completed Task/Deliverable timeline;
- assigned vs self-created;
- due-date/on-time facts;
- first-time approval facts;
- blocker history;
- returned/corrected submission history;
- manager feedback;
- work-session history and reconciliation events.

There is no employee score, rank or colleague comparison.

### Me

Me now supports employee-maintained ordinary personal details:

- preferred name;
- phone;
- birthday;
- emergency contact;
- ordinary address;
- Instagram/LinkedIn handles.

Private ordinary details are separated from the colleague-visible profile row. Changes use an attributable RPC.

### Protected HR boundary

Protected HR remains intentionally deferred because it needs the approved protected-storage + verification workflow and intersects Claude-owned Administration & HR UI.

Not implemented in this Staff tranche:

- Ghana Card;
- SSNIT/tax;
- banking;
- salary;
- contracts;
- payslips;
- protected HR documents.

The Staff Me screen explicitly states that these are not stored in ordinary profile details.

### Acceptance defects found and corrected

1. Announcement RLS recursion discovered during the 048 acceptance pass → corrected in 049.
2. A stale session continued from the previous day would have started counting the overnight gap again → corrected in 053 by splitting stale history from the new current-day session.
3. Employee profile fields added by 052 could still be directly self-updated without an audit event → corrected in 054 by forcing employee edits through the attributable RPC.

Claude-owned Admin/Executive screen files were not modified.

## Staff operating-surface correction — completed

Following authenticated mobile review, the Staff surface was corrected again to match the intended operating-system architecture rather than presenting raw database state.

### Live database

Live migrations are now **001–059**. Next migration number: **060**.

New migrations:

- 055 authoritative attention-state semantics
- 056 historical multi-day session reconciliation
- 057 session-event compatibility fix found by rollback testing
- 058 disciplined Manager review follow-up
- 059 disciplined dependency/blocker follow-up

### Home information architecture

Staff Home now follows:

1. work-session state;
2. What changed;
3. Your next move;
4. Waiting on others;
5. Coming up;
6. Announcements;
7. This week.

Completed or in-review work no longer remains in Staff attention simply because an older alert exists. Submitted work waiting for Manager review is explicitly separated from employee-action work.

### Follow-up discipline

Staff can follow up on submitted work awaiting Manager review and on a dependency/blocker targeting another CEAC unit.

The server enforces: first follow-up after one day, final follow-up after three days, then stop. Manager Home surfaces these follow-ups in the existing Waiting on you decision area.

### Team

Staff Team now uses progressive disclosure. Leadership is deduplicated by person, away/recent/birthday/resource sections only appear when meaningful, and People is compact/collapsible rather than a wall of contact cards.

### Work

Staff Work now exposes Assigned, My agreed work and Private.

Self-recorded work can be unattached to a project and may omit a due date. Checklist steps are optional when the employee intentionally chooses to determine the method. Expected result remains explicit.

Private work is RLS-isolated from colleagues and managers and excluded from formal Staff Record evidence.

### Goals and Me

Me now opens as an employee workspace with Goals & development, Leave and Personal. Personal goals/reminders are no longer buried below profile settings.

### Record

My Record now opens on evidence rather than statistics: Highlights, Work history and Time & activity.

Highlights are derived from completed Task/Deliverable records and factual manager feedback.

The legacy 179-hour session found during mobile acceptance is flagged for reconciliation and excluded from totals until the employee enters the actual end time. The system does not invent a correction.

### Visual hierarchy

The Staff visual pass reduces repeated large-card treatment: informational sections use grouped rows/dividers, actions retain stronger containers, Team uses collapsible sections, Work uses compact lists, Record uses timelines/highlights and Me uses segmented employee-service areas.

Claude-owned Administration/Executive UI files remain untouched.
