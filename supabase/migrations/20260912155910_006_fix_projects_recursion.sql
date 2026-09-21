-- projects_read asked project_units, and project_units_read asked projects.
-- Each waits for the other. One helper that answers the question once,
-- outside the rules, breaks the loop.
create or replace function app_visible_projects()
returns setof uuid language sql stable security definer set search_path = public as $$
  select p.id
  from projects p
  where p.org_id = app_org_id()
    and (
      app_is_admin()
      or app_is_exec()
      or p.lead_unit_id in (select unit_id from unit_memberships where profile_id = auth.uid())
      or exists (
        select 1 from project_units pu
        where pu.project_id = p.id
          and pu.unit_id in (select unit_id from unit_memberships where profile_id = auth.uid())
      )
    );
$$;

drop policy if exists projects_read      on projects;
drop policy if exists project_units_read on project_units;
drop policy if exists phases_read        on project_phases;
drop policy if exists objectives_read    on objectives;

create policy projects_read on projects
  for select using (id in (select app_visible_projects()));

create policy project_units_read on project_units
  for select using (project_id in (select app_visible_projects()));

create policy phases_read on project_phases
  for select using (project_id in (select app_visible_projects()));

create policy objectives_read on objectives
  for select using (
    org_id = app_org_id() and project_id in (select app_visible_projects())
  );
