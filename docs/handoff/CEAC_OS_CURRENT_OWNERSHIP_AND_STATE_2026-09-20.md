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
