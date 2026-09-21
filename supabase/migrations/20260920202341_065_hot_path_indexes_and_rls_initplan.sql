
create index if not exists activity_events_object_at_idx
  on public.activity_events(object_type,object_id,at desc);
create index if not exists checklist_items_work_item_position_idx
  on public.checklist_items(work_item_id,position);
create index if not exists checklist_ticks_profile_active_idx
  on public.checklist_ticks(profile_id,checklist_item_id) where undone_at is null;
create index if not exists submissions_work_submitted_idx
  on public.submissions(work_item_id,submitted_at desc);
create index if not exists submissions_profile_submitted_idx
  on public.submissions(profile_id,submitted_at desc);
create index if not exists alerts_open_unit_resolved_idx
  on public.alerts(for_unit_id,first_seen_at desc) where acknowledged_at is null and resolved_at is null;
create index if not exists alerts_open_profile_resolved_idx
  on public.alerts(for_profile_id,first_seen_at desc) where acknowledged_at is null and resolved_at is null;
create index if not exists blockers_work_state_idx
  on public.blockers(work_item_id,state);
create index if not exists leave_profile_status_dates_idx
  on public.leave_requests(profile_id,status,start_date,end_date);
create index if not exists leave_status_dates_idx
  on public.leave_requests(status,start_date,end_date);
create index if not exists project_units_unit_project_idx
  on public.project_units(unit_id,project_id);
create index if not exists objectives_unit_status_idx
  on public.objectives(unit_id,status);
create index if not exists work_items_objective_status_idx
  on public.work_items(objective_id,status) where objective_id is not null;
create index if not exists work_items_sub_team_idx
  on public.work_items(sub_team_id) where sub_team_id is not null;
create index if not exists work_items_due_active_idx
  on public.work_items(due_at) where status in ('not_started','in_progress','returned');
create index if not exists work_items_movement_active_idx
  on public.work_items(unit_id,last_movement_at) where status in ('not_started','in_progress','returned');
create index if not exists work_sessions_started_profile_idx
  on public.work_sessions(started_at desc,profile_id);
create index if not exists reports_unit_period_status_idx
  on public.reports(unit_id,period_id,status);

drop policy if exists profiles_own_read on public.profiles;
create policy profiles_own_read on public.profiles for select using (id=(select auth.uid()));
drop policy if exists profiles_own_update on public.profiles;
create policy profiles_own_update on public.profiles for update
  using (id=(select auth.uid())) with check (id=(select auth.uid()));
drop policy if exists profiles_admin_write on public.profiles;
create policy profiles_admin_write on public.profiles for all
  using ((select public.app_is_admin()) and org_id=(select public.app_org_id()))
  with check ((select public.app_is_admin()) and org_id=(select public.app_org_id()));

drop policy if exists capabilities_own_read on public.capabilities;
create policy capabilities_own_read on public.capabilities for select
  using (profile_id=(select auth.uid()) or (select public.app_is_admin()));
drop policy if exists capabilities_admin_write on public.capabilities;
create policy capabilities_admin_write on public.capabilities for all
  using ((select public.app_is_admin()) and org_id=(select public.app_org_id()))
  with check ((select public.app_is_admin()) and org_id=(select public.app_org_id()));

drop policy if exists submissions_own_write on public.submissions;
create policy submissions_own_write on public.submissions for insert
  with check (profile_id=(select auth.uid()) and org_id=(select public.app_org_id()));

drop policy if exists submission_files_write on public.submission_files;
create policy submission_files_write on public.submission_files for all
  using (submission_id in (select s.id from public.submissions s where s.profile_id=(select auth.uid())))
  with check (submission_id in (select s.id from public.submissions s where s.profile_id=(select auth.uid())));

drop policy if exists blockers_claim on public.blockers;
create policy blockers_claim on public.blockers for insert
  with check (
    org_id=(select public.app_org_id())
    and claimed_by=(select auth.uid())
    and public.app_can_see_item(work_item_id)
  );
drop policy if exists blockers_read on public.blockers;
create policy blockers_read on public.blockers for select
  using (
    org_id=(select public.app_org_id())
    and (
      public.app_can_see_item(work_item_id)
      or party_unit_id in (select public.app_my_units())
      or (select public.app_is_admin())
      or (select public.app_is_exec())
    )
  );

drop policy if exists alerts_select on public.alerts;
create policy alerts_select on public.alerts for select
  using (
    org_id=(select public.app_org_id())
    and (
      for_profile_id=(select auth.uid())
      or (select public.app_is_admin())
      or (select public.app_is_exec())
      or (for_unit_id is not null and for_unit_id in (select public.app_managed_units()))
    )
  );
drop policy if exists alerts_ack on public.alerts;
create policy alerts_ack on public.alerts for update
  using (
    org_id=(select public.app_org_id())
    and (
      for_profile_id=(select auth.uid())
      or (select public.app_is_admin())
      or (select public.app_is_exec())
      or (for_unit_id is not null and for_unit_id in (select public.app_managed_units()))
    )
  );

drop policy if exists work_items_self_create on public.work_items;
create policy work_items_self_create on public.work_items for insert
  with check (
    org_id=(select public.app_org_id())
    and assignee_id=(select auth.uid())
    and unit_id in (select public.app_my_units())
    and origin='self_created'
  );
drop policy if exists work_items_assignee_update on public.work_items;
create policy work_items_assignee_update on public.work_items for update
  using (assignee_id=(select auth.uid()) and org_id=(select public.app_org_id()))
  with check (
    assignee_id=(select auth.uid()) and org_id=(select public.app_org_id())
    and status<>'self_certified'
  );
drop policy if exists work_items_manager_insert on public.work_items;
create policy work_items_manager_insert on public.work_items for insert
  with check (
    org_id=(select public.app_org_id())
    and (
      unit_id in (select public.app_managed_units())
      or sub_team_id in (select public.app_led_sub_teams())
      or (select public.app_is_admin())
      or (select public.app_is_exec())
    )
  );
drop policy if exists work_items_manager_update on public.work_items;
create policy work_items_manager_update on public.work_items for update
  using (
    org_id=(select public.app_org_id()) and visibility<>'private'
    and (
      unit_id in (select public.app_managed_units())
      or sub_team_id in (select public.app_led_sub_teams())
      or (select public.app_is_admin())
      or (select public.app_is_exec())
    )
  )
  with check (
    org_id=(select public.app_org_id()) and status<>'self_certified'
    and (
      unit_id in (select public.app_managed_units())
      or sub_team_id in (select public.app_led_sub_teams())
      or (select public.app_is_admin())
      or (select public.app_is_exec())
    )
  );
drop policy if exists work_items_manager_delete on public.work_items;
create policy work_items_manager_delete on public.work_items for delete
  using (
    org_id=(select public.app_org_id()) and visibility<>'private'
    and (unit_id in (select public.app_managed_units()) or (select public.app_is_admin()))
  );

drop policy if exists sessions_own_insert on public.work_sessions;
create policy sessions_own_insert on public.work_sessions for insert
  with check (profile_id=(select auth.uid()) and org_id=(select public.app_org_id()));
drop policy if exists sessions_own_read on public.work_sessions;
create policy sessions_own_read on public.work_sessions for select
  using (profile_id=(select auth.uid()) and org_id=(select public.app_org_id()));
drop policy if exists sessions_manager_read on public.work_sessions;
create policy sessions_manager_read on public.work_sessions for select
  using (
    org_id=(select public.app_org_id())
    and (
      (select public.app_is_admin())
      or (select public.app_is_exec())
      or profile_id in (
        select um.profile_id from public.unit_memberships um
        where um.unit_id in (select public.app_managed_units())
      )
    )
  );

drop policy if exists lr_insert on public.leave_requests;
create policy lr_insert on public.leave_requests for insert
  with check (org_id=(select public.app_org_id()) and profile_id=(select auth.uid()));
drop policy if exists lr_read on public.leave_requests;
create policy lr_read on public.leave_requests for select
  using (
    org_id=(select public.app_org_id())
    and (
      profile_id=(select auth.uid())
      or (select public.app_is_admin())
      or profile_id in (
        select um.profile_id from public.unit_memberships um
        where um.unit_id in (select public.app_managed_units())
      )
    )
  );
drop policy if exists lr_update on public.leave_requests;
create policy lr_update on public.leave_requests for update
  using (
    org_id=(select public.app_org_id())
    and (
      (select public.app_is_admin())
      or profile_id in (
        select um.profile_id from public.unit_memberships um
        where um.unit_id in (select public.app_managed_units())
      )
    )
  )
  with check (
    org_id=(select public.app_org_id())
    and (
      (select public.app_is_admin())
      or profile_id in (
        select um.profile_id from public.unit_memberships um
        where um.unit_id in (select public.app_managed_units())
      )
    )
  );
