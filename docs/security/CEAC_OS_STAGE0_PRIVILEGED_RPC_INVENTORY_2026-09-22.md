# CEAC OS — Stage 0 Privileged RPC Inventory

**Date:** 22 September 2026
**Source:** live Supabase project `efjljhftsesssumtshvp`
**Purpose:** formal starting inventory for Stage 0 least-privilege review.

This file is an inventory, not an approval of every function. Each row must be reviewed before Stage 0 closes. Static authority-binding signals below indicate whether the function definition visibly references `auth.uid()` and/or one of the currently approved authority helpers; they do not substitute for function-by-function semantic review.

## Current totals

- Authenticated-callable public SECURITY DEFINER functions: **73**
- Anonymous-callable functions in this inventory: **0**
- Missing fixed search_path in this inventory: **0**

## Review inventory

| Function | Arguments | Lang | auth.uid | authority helper | fixed search_path | Review status |
|---|---|---|---:|---:|---:|---|
| `admin_people_summary` | `` | plpgsql | yes | yes | yes | pending semantic review |
| `admin_person_detail` | `p_profile_id uuid` | plpgsql | yes | yes | yes | pending semantic review |
| `announcement_audience_counts` | `p_announcement_id uuid` | plpgsql | no | yes | yes | pending semantic review |
| `app_can_access_room` | `p_room_id uuid` | sql | yes | yes | yes | pending semantic review |
| `app_can_manage_meeting` | `p_meeting_id uuid` | sql | yes | yes | yes | pending semantic review |
| `app_can_publish_announcements` | `` | sql | yes | yes | yes | pending semantic review |
| `app_can_review_item` | `item_id uuid` | sql | no | yes | yes | pending semantic review |
| `app_can_see_item` | `item_id uuid` | sql | yes | yes | yes | pending semantic review |
| `app_is_admin` | `` | sql | yes | yes | yes | pending semantic review |
| `app_is_exec` | `` | sql | yes | yes | yes | pending semantic review |
| `app_led_sub_teams` | `` | sql | yes | yes | yes | pending semantic review |
| `app_managed_units` | `` | sql | yes | yes | yes | pending semantic review |
| `app_my_units` | `` | sql | yes | yes | yes | pending semantic review |
| `app_org_id` | `` | sql | yes | no | yes | pending semantic review |
| `app_threshold` | `p_org_id uuid, p_name text, p_default numeric` | plpgsql | yes | no | yes | pending semantic review |
| `app_visible_profiles` | `` | sql | yes | yes | yes | pending semantic review |
| `app_visible_projects` | `` | sql | yes | yes | yes | pending semantic review |
| `app_visible_units` | `` | sql | no | yes | yes | pending semantic review |
| `approve_work_submission` | `p_submission_id uuid, p_comment text` | plpgsql | yes | yes | yes | pending semantic review |
| `assign_unit_head` | `p_unit_id uuid, p_profile_id uuid` | plpgsql | yes | yes | yes | pending semantic review |
| `cancel_ministry_event` | `p_event_id uuid, p_reason text` | plpgsql | yes | yes | yes | pending semantic review |
| `change_routine_schedule` | `p_work_item_id uuid, p_effective_from date, p_schedule_kind text, p_weekdays smallint[], p_day_of_month integer, p_ends_on date` | plpgsql | yes | yes | yes | pending semantic review |
| `close_announcement` | `p_announcement_id uuid` | plpgsql | yes | yes | yes | pending semantic review |
| `close_project` | `p_project_id uuid` | plpgsql | no | yes | yes | pending semantic review |
| `correct_report` | `p_report_id uuid, p_reason text` | plpgsql | no | yes | yes | pending semantic review |
| `create_announcement` | `p_title text, p_body text, p_priority text, p_requires_acknowledgement boolean, p_expires_at timestamp with time zone, p_all_org boolean, p_unit_ids uuid[], p_roles text[]` | plpgsql | yes | yes | yes | pending semantic review |
| `create_pending_invitation` | `p_email text, p_full_name text, p_unit_id uuid, p_role text` | plpgsql | yes | yes | yes | pending semantic review |
| `create_project_with_participants` | `p_lead_unit_id uuid, p_name text, p_purpose text, p_starts_on date, p_ends_on date, p_participant_unit_ids uuid[]` | plpgsql | yes | yes | yes | pending semantic review |
| `create_task_with_checklist` | `p_unit_id uuid, p_assignee_id uuid, p_title text, p_expected_outcome text, p_sub_team_id uuid, p_project_id uuid, p_objective_id uuid, p_phase_id uuid, p_purpose text, p_instructions text, p_due_at timestamp with time zone, p_origin text, p_visibility text, p_steps text[]` | plpgsql | yes | yes | yes | pending semantic review |
| `create_typed_work` | `p_kind text, p_unit_id uuid, p_title text, p_assignee_id uuid, p_sub_team_id uuid, p_project_id uuid, p_phase_id uuid, p_objective_id uuid, p_responsibility_id uuid, p_purpose text, p_expected_outcome text, p_due_at timestamp with time zone, p_visibility text, p_confidential boolean, p_details jsonb` | plpgsql | yes | no | yes | pending semantic review |
| `decide_finance_request` | `p_request_id uuid, p_decision text, p_note text` | plpgsql | yes | yes | yes | pending semantic review |
| `end_work_session` | `p_session_id uuid` | plpgsql | yes | no | yes | pending semantic review |
| `follow_up_blocker` | `p_blocker_id uuid` | plpgsql | yes | no | yes | pending semantic review |
| `follow_up_work_review` | `p_work_item_id uuid` | plpgsql | yes | no | yes | pending semantic review |
| `fulfil_finance_request` | `p_request_id uuid, p_spent_on date, p_source_note text` | plpgsql | yes | yes | yes | pending semantic review |
| `link_work_items` | `p_parent_work_item_id uuid, p_child_work_item_id uuid, p_relation text` | plpgsql | yes | yes | yes | pending semantic review |
| `list_unit_approved_leave` | `p_unit_id uuid, p_from date, p_to date` | plpgsql | yes | yes | yes | pending semantic review |
| `mark_announcement_read` | `p_announcement_id uuid, p_acknowledge boolean` | plpgsql | yes | yes | yes | pending semantic review |
| `mark_room_read` | `p_room_id uuid` | plpgsql | yes | yes | yes | pending semantic review |
| `next_close_version` | `p_project_id uuid, p_scope text, p_unit_id uuid` | plpgsql | no | yes | yes | pending semantic review |
| `next_objective_ref` | `p_project_id uuid, p_unit_id uuid` | plpgsql | no | yes | yes | pending semantic review |
| `next_work_ref` | `p_unit_id uuid, p_sub_team_id uuid` | plpgsql | no | yes | yes | pending semantic review |
| `project_close_readiness` | `p_project_id uuid` | sql | no | yes | yes | pending semantic review |
| `provide_request_clarification` | `p_work_item_id uuid, p_note text` | plpgsql | yes | yes | yes | pending semantic review |
| `publish_announcement` | `p_announcement_id uuid` | plpgsql | yes | yes | yes | pending semantic review |
| `raise_work_blocker` | `p_work_item_id uuid, p_party_unit_id uuid, p_party_text text, p_note text` | plpgsql | yes | yes | yes | pending semantic review |
| `reconcile_closed_work_session` | `p_session_id uuid, p_effective_ended_at timestamp with time zone, p_note text` | plpgsql | yes | no | yes | pending semantic review |
| `reconcile_work_session` | `p_session_id uuid, p_action text, p_effective_ended_at timestamp with time zone, p_note text` | plpgsql | yes | no | yes | pending semantic review |
| `record_routine_occurrence` | `p_work_item_id uuid, p_occurred_on date, p_value numeric, p_note text` | plpgsql | yes | yes | yes | pending semantic review |
| `record_work_decision` | `p_work_item_id uuid, p_decision text, p_rationale text` | plpgsql | yes | yes | yes | pending semantic review |
| `reopen_approved_work` | `p_work_item_id uuid, p_reason text` | plpgsql | yes | yes | yes | pending semantic review |
| `reopen_project` | `p_project_id uuid, p_reason text` | plpgsql | yes | yes | yes | pending semantic review |
| `resolve_blocker` | `p_blocker_id uuid, p_note text` | plpgsql | yes | yes | yes | pending semantic review |
| `resolve_work_case` | `p_work_item_id uuid, p_resolution_note text` | plpgsql | yes | yes | yes | pending semantic review |
| `respond_to_blocker` | `p_blocker_id uuid, p_state text, p_note text` | plpgsql | yes | yes | yes | pending semantic review |
| `respond_work_request` | `p_work_item_id uuid, p_outcome text, p_note text` | plpgsql | yes | yes | yes | pending semantic review |
| `return_work_for_correction` | `p_submission_id uuid, p_comment text, p_checklist_item_ids uuid[]` | plpgsql | yes | yes | yes | pending semantic review |
| `save_and_submit_project_close` | `p_project_id uuid, p_scope text, p_unit_id uuid, p_deliverables_note text, p_challenges text, p_do_differently text, p_objectives jsonb, p_deliverables jsonb, p_costs jsonb` | plpgsql | yes | no | yes | pending semantic review |
| `save_and_submit_report` | `p_period_id uuid, p_scope text, p_unit_id uuid, p_project_id uuid, p_narrative text, p_challenges text, p_evidence jsonb, p_refs jsonb` | plpgsql | yes | no | yes | pending semantic review |
| `save_report_draft` | `p_period_id uuid, p_scope text, p_unit_id uuid, p_project_id uuid, p_narrative text, p_challenges text` | plpgsql | no | yes | yes | pending semantic review |
| `save_unit_resource` | `p_resource_id uuid, p_unit_id uuid, p_title text, p_category text, p_reference_url text, p_description text, p_visibility text, p_pinned boolean, p_sort_order integer` | plpgsql | yes | yes | yes | pending semantic review |
| `schedule_meeting` | `p_scope text, p_unit_id uuid, p_project_id uuid, p_title text, p_agenda text, p_starts_at timestamp with time zone, p_ends_at timestamp with time zone, p_provider text, p_join_url text, p_location text, p_audience jsonb` | plpgsql | yes | yes | yes | pending semantic review |
| `self_certify_work` | `p_work_item_id uuid, p_session_id uuid, p_note text, p_link text` | plpgsql | yes | yes | yes | pending semantic review |
| `send_room_message` | `p_room_id uuid, p_body text, p_reply_to_id uuid, p_refs jsonb, p_mention_ids uuid[]` | plpgsql | yes | yes | yes | pending semantic review |
| `set_routine_paused` | `p_work_item_id uuid, p_paused boolean, p_reason text` | plpgsql | yes | yes | yes | pending semantic review |
| `set_unit_resource_active` | `p_resource_id uuid, p_active boolean` | plpgsql | yes | yes | yes | pending semantic review |
| `submit_project_close` | `p_close_id uuid` | plpgsql | no | yes | yes | pending semantic review |
| `submit_report` | `p_report_id uuid, p_evidence jsonb` | plpgsql | yes | yes | yes | pending semantic review |
| `submit_work_for_review` | `p_work_item_id uuid, p_session_id uuid, p_note text, p_link text` | plpgsql | yes | no | yes | pending semantic review |
| `swap_sub_team_positions` | `p_first_id uuid, p_second_id uuid` | plpgsql | yes | yes | yes | pending semantic review |
| `unit_budget_position` | `p_unit_id uuid, p_year integer` | sql | yes | yes | yes | pending semantic review |
| `update_announcement` | `p_announcement_id uuid, p_title text, p_body text, p_priority text, p_requires_acknowledgement boolean, p_expires_at timestamp with time zone, p_all_org boolean, p_unit_ids uuid[], p_roles text[]` | plpgsql | no | yes | yes | pending semantic review |
| `update_my_personal_details` | `p_preferred_name text, p_phone text, p_birthday date, p_emergency_contact_name text, p_emergency_contact_phone text, p_emergency_contact_relationship text, p_address_text text, p_social_handles jsonb` | plpgsql | yes | no | yes | pending semantic review |

## Stage 0 review rule

For every row, verify purpose, legitimate caller, exact read/write scope, caller binding, cross-organisation resistance, audit behaviour, reversibility where applicable, and whether SECURITY DEFINER is still required. Any privilege reduction must be delivered by a reviewed migration plus acceptance tests; do not edit production functions manually.
