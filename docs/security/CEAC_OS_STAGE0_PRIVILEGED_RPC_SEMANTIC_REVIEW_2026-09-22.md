# CEAC OS — Stage 0 Privileged RPC Semantic Review

**Date:** 22 September 2026
**Status:** REVIEWED — permission changes deferred until migration-history repair
**Production project:** `efjljhftsesssumtshvp`
**Repository baseline reviewed:** `main` at `c17edf2dacc0f554f12a7ed2834ecc2afde1b0ce`

## Review method

The review cross-checked:

- all 73 `public` SECURITY DEFINER functions executable by `authenticated`;
- live function definitions and fixed `search_path`;
- direct `supabase.rpc(...)` calls in the current React application;
- references from live RLS policies;
- calls between privileged functions;
- organisation and actor binding;
- write behaviour and audit/event signals.

This is a least-privilege review, not permission changes. No production grants, functions, policies or data were modified.

## Result

All 73 reviewed functions have a fixed `search_path`. None is executable by `anon`.

The surface divides into four classes.

### A. Browser-facing application RPCs — retain authenticated EXECUTE

The current application directly calls these functions:

`admin_people_summary`, `admin_person_detail`, `announcement_audience_counts`,
`approve_work_submission`, `assign_unit_head`, `change_routine_schedule`,
`close_project`, `correct_report`, `create_announcement`,
`create_pending_invitation`, `create_project_with_participants`,
`create_task_with_checklist`, `create_typed_work`, `end_work_session`,
`follow_up_blocker`, `follow_up_work_review`, `list_unit_approved_leave`,
`mark_announcement_read`, `mark_room_read`, `next_objective_ref`,
`project_close_readiness`, `provide_request_clarification`,
`raise_work_blocker`, `reconcile_closed_work_session`,
`reconcile_work_session`, `record_routine_occurrence`,
`record_work_decision`, `reopen_approved_work`, `reopen_project`,
`resolve_blocker`, `resolve_work_case`, `respond_to_blocker`,
`respond_work_request`, `return_work_for_correction`,
`save_and_submit_project_close`, `save_and_submit_report`,
`save_report_draft`, `save_unit_resource`, `schedule_meeting`,
`self_certify_work`, `send_room_message`, `set_routine_paused`,
`set_unit_resource_active`, `submit_work_for_review`,
`swap_sub_team_positions`, `unit_budget_position`,
`update_announcement`, `update_my_personal_details`.

These remain part of the browser RPC contract. Their definitions bind the request to the signed-in actor and/or approved authority helpers. Write endpoints validate organisation scope and role/capability conditions in their live definitions.

### B. RLS/visibility authority helpers — retain authenticated EXECUTE

These functions are referenced by live RLS policies and therefore remain part of the row-authority layer:

- `app_can_access_room`
- `app_can_manage_meeting`
- `app_can_review_item`
- `app_can_see_item`
- `app_is_admin`
- `app_is_exec`
- `app_led_sub_teams`
- `app_managed_units`
- `app_my_units`
- `app_org_id`
- `app_visible_profiles`
- `app_visible_projects`
- `app_visible_units`

Direct browser use is not required for these to remain executable by the authenticated role because RLS evaluation depends on them.

### C. Internal subroutines — candidates to remove from direct authenticated execution

These are not called by the current browser and are used as implementation helpers by other database functions:

- `app_can_publish_announcements` — used by announcement create/update/publish/close/count logic.
- `app_threshold` — used by background attention/silence/check functions.
- `next_close_version` — called by `save_and_submit_project_close`.
- `next_work_ref` — called by work-creation functions.
- `submit_project_close` — called by `save_and_submit_project_close`.
- `submit_report` — called by `save_and_submit_report`.

These are the strongest least-privilege candidates for revoking direct `authenticated` EXECUTE while preserving owner/internal execution.

No such change may be made until the live migration ledger is repaired. Any later revocation must be introduced as a normal reviewed migration with clean replay, RLS/security tests and browser acceptance.

### D. Dormant product actions — keep under review, do not remove yet

These are legitimate authority-checked product operations but are not called by the current browser build:

- `cancel_ministry_event`
- `close_announcement`
- `decide_finance_request`
- `fulfil_finance_request`
- `link_work_items`
- `publish_announcement`

Their definitions enforce organisation and role/capability checks. Some represent product workflows that may not yet have a current UI entry point. Removing execution now could break an intended workflow or external client that is not visible in the React source. They remain reviewed-but-retained until product-use confirmation is made during the relevant feature stage.

## Security observations

- No reviewed function is executable by `anon`.
- All reviewed SECURITY DEFINER functions have a fixed `search_path`.
- The current RLS authority helpers are intentionally privileged because they centralise organisation/role visibility checks.
- The internal-only helpers in Class C unnecessarily enlarge the direct authenticated RPC surface even though their callers can execute them internally.
- Dormant product actions are not classified as vulnerabilities merely because the current UI does not call them.

## Required next action

After migration history 069–073 is reconciled with Supabase's supported `migration repair` mechanism:

1. create the next normal Stage 0 migration;
2. revoke direct `authenticated` EXECUTE from the confirmed Class C internal helpers;
3. keep required owner/service execution;
4. update the Platform Kernel gate to assert the reduced authenticated SECURITY DEFINER count and explicitly deny direct authenticated execution for the internal-only helpers;
5. run clean migration replay, SQL security gates and Playwright role acceptance;
6. verify the live database after deployment.

Until the ledger is repaired, no migration 074 or later is permitted.
