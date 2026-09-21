-- Can the signed-in person see this work item at all?
-- Private items belong to their owner alone. Confidential cases stop at
-- Administration and the Group Pastor.
create or replace function app_can_see_item(item_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from work_items w
    where w.id = item_id
      and w.org_id = app_org_id()
      and (
        w.assignee_id = auth.uid()
        or (
          w.visibility <> 'private'
          and (
            (w.confidential = false and (
                w.unit_id in (select app_my_units())
                or app_is_admin() or app_is_exec()
            ))
            or (w.confidential = true and (app_is_admin() or app_is_exec()))
          )
        )
      )
  );
$$;

create or replace function app_can_review_item(item_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from work_items w
    where w.id = item_id
      and w.org_id = app_org_id()
      and (
        w.unit_id in (select app_managed_units())
        or w.sub_team_id in (select app_led_sub_teams())
        or app_is_admin()
      )
  );
$$;

alter table projects              enable row level security;
alter table project_units         enable row level security;
alter table project_phases        enable row level security;
alter table objectives            enable row level security;
alter table responsibilities      enable row level security;
alter table recurring_operations  enable row level security;
alter table operation_occurrences enable row level security;
alter table work_items            enable row level security;
alter table checklist_items       enable row level security;
alter table checklist_ticks       enable row level security;
alter table work_sessions         enable row level security;
alter table submissions           enable row level security;
alter table submission_files      enable row level security;
alter table reviews               enable row level security;
alter table blockers              enable row level security;
alter table activity_events       enable row level security;
alter table job_runs              enable row level security;

-- projects: everyone in the organisation sees that they exist; only the
-- units taking part, Administration and the Group Pastor see the detail.
create policy projects_read on projects
  for select using (
    org_id = app_org_id()
    and (
      lead_unit_id in (select app_my_units())
      or id in (select project_id from project_units where unit_id in (select app_my_units()))
      or app_is_admin() or app_is_exec()
    )
  );

create policy projects_write on projects
  for all using (
    org_id = app_org_id()
    and (lead_unit_id in (select app_managed_units()) or app_is_admin() or app_is_exec())
  )
  with check (
    org_id = app_org_id()
    and (lead_unit_id in (select app_managed_units()) or app_is_admin() or app_is_exec())
  );

create policy project_units_read on project_units
  for select using (project_id in (select id from projects));
create policy project_units_write on project_units
  for all using (app_is_admin() or app_is_exec()
                 or project_id in (select id from projects where lead_unit_id in (select app_managed_units())))
  with check (app_is_admin() or app_is_exec()
                 or project_id in (select id from projects where lead_unit_id in (select app_managed_units())));

create policy phases_read on project_phases
  for select using (project_id in (select id from projects));
create policy phases_write on project_phases
  for all using (app_is_admin() or app_is_exec()
                 or project_id in (select id from projects where lead_unit_id in (select app_managed_units())))
  with check (app_is_admin() or app_is_exec()
                 or project_id in (select id from projects where lead_unit_id in (select app_managed_units())));

-- objectives: each unit owns its own slice of a shared project.
create policy objectives_read on objectives
  for select using (org_id = app_org_id() and project_id in (select id from projects));
create policy objectives_write on objectives
  for all using (org_id = app_org_id()
                 and (unit_id in (select app_managed_units()) or app_is_admin() or app_is_exec()))
  with check (org_id = app_org_id()
                 and (unit_id in (select app_managed_units()) or app_is_admin() or app_is_exec()));

create policy responsibilities_read on responsibilities
  for select using (org_id = app_org_id());
create policy responsibilities_write on responsibilities
  for all using (org_id = app_org_id() and (unit_id in (select app_managed_units()) or app_is_admin()))
  with check (org_id = app_org_id() and (unit_id in (select app_managed_units()) or app_is_admin()));

create policy operations_read on recurring_operations
  for select using (org_id = app_org_id()
                    and (unit_id in (select app_my_units()) or app_is_admin() or app_is_exec()));
create policy operations_write on recurring_operations
  for all using (org_id = app_org_id() and (unit_id in (select app_managed_units()) or app_is_admin()))
  with check (org_id = app_org_id() and (unit_id in (select app_managed_units()) or app_is_admin()));

create policy occurrences_read on operation_occurrences
  for select using (org_id = app_org_id() and operation_id in (select id from recurring_operations));
create policy occurrences_write on operation_occurrences
  for all using (org_id = app_org_id() and operation_id in (select id from recurring_operations))
  with check (org_id = app_org_id() and operation_id in (select id from recurring_operations));

-- work items
create policy work_items_read on work_items
  for select using (app_can_see_item(id));

create policy work_items_assignee_update on work_items
  for update using (assignee_id = auth.uid() and org_id = app_org_id())
  with check (assignee_id = auth.uid() and org_id = app_org_id());

create policy work_items_manager_write on work_items
  for all using (
    org_id = app_org_id()
    and (unit_id in (select app_managed_units())
         or sub_team_id in (select app_led_sub_teams())
         or app_is_admin() or app_is_exec())
  )
  with check (
    org_id = app_org_id()
    and (unit_id in (select app_managed_units())
         or sub_team_id in (select app_led_sub_teams())
         or app_is_admin() or app_is_exec())
  );

-- Staff may create their own work, but only for themselves and only in a
-- unit they belong to.
create policy work_items_self_create on work_items
  for insert with check (
    org_id = app_org_id()
    and assignee_id = auth.uid()
    and unit_id in (select app_my_units())
    and origin = 'self_created'
  );

create policy checklist_items_read on checklist_items
  for select using (app_can_see_item(work_item_id));
create policy checklist_items_write on checklist_items
  for all using (app_can_review_item(work_item_id)
                 or work_item_id in (select id from work_items where assignee_id = auth.uid()))
  with check (app_can_review_item(work_item_id)
                 or work_item_id in (select id from work_items where assignee_id = auth.uid()));

create policy ticks_read on checklist_ticks
  for select using (
    checklist_item_id in (select id from checklist_items)
  );
create policy ticks_own_write on checklist_ticks
  for all using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- sessions: your own, plus your team's if you manage them.
create policy sessions_own on work_sessions
  for all using (profile_id = auth.uid() and org_id = app_org_id())
  with check (profile_id = auth.uid() and org_id = app_org_id());

create policy sessions_manager_read on work_sessions
  for select using (
    org_id = app_org_id()
    and (app_is_admin() or app_is_exec()
         or profile_id in (
              select profile_id from unit_memberships
              where unit_id in (select app_managed_units())
         ))
  );

create policy submissions_read on submissions
  for select using (app_can_see_item(work_item_id));
create policy submissions_own_write on submissions
  for insert with check (profile_id = auth.uid() and org_id = app_org_id());

create policy submission_files_read on submission_files
  for select using (submission_id in (select id from submissions));
create policy submission_files_write on submission_files
  for all using (submission_id in (select id from submissions where profile_id = auth.uid()))
  with check (submission_id in (select id from submissions where profile_id = auth.uid()));

create policy reviews_read on reviews
  for select using (submission_id in (select id from submissions));
create policy reviews_write on reviews
  for all using (
    org_id = app_org_id()
    and submission_id in (select s.id from submissions s where app_can_review_item(s.work_item_id))
  )
  with check (
    org_id = app_org_id()
    and reviewer_id = auth.uid()
    and submission_id in (select s.id from submissions s where app_can_review_item(s.work_item_id))
  );

-- blockers: the person who is stuck, and the unit named, both see it.
create policy blockers_read on blockers
  for select using (
    org_id = app_org_id()
    and (
      app_can_see_item(work_item_id)
      or party_unit_id in (select app_my_units())
      or app_is_admin() or app_is_exec()
    )
  );

create policy blockers_claim on blockers
  for insert with check (
    org_id = app_org_id() and claimed_by = auth.uid()
    and app_can_see_item(work_item_id)
  );

-- Only the named unit, a manager, or Administration may answer a claim.
create policy blockers_respond on blockers
  for update using (
    org_id = app_org_id()
    and (party_unit_id in (select app_my_units())
         or app_can_review_item(work_item_id)
         or app_is_admin())
  )
  with check (
    org_id = app_org_id()
    and (party_unit_id in (select app_my_units())
         or app_can_review_item(work_item_id)
         or app_is_admin())
  );

create policy activity_read on activity_events
  for select using (org_id = app_org_id());
create policy activity_insert on activity_events
  for insert with check (org_id = app_org_id());

-- job_runs: only Administration needs to see whether the machinery ran.
create policy job_runs_admin_read on job_runs
  for select using (app_is_admin() or app_is_exec());
