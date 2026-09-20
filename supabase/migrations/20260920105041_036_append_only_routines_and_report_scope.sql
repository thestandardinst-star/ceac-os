drop policy if exists occurrences_write on public.operation_occurrences;
drop policy if exists occurrences_insert on public.operation_occurrences;

create policy occurrences_insert on public.operation_occurrences
for insert
with check (
  org_id = app_org_id()
  and recorded_by = auth.uid()
  and exists (
    select 1
    from recurring_operations ro
    where ro.id = operation_occurrences.operation_id
      and ro.org_id = app_org_id()
      and (
        ro.unit_id in (select app_my_units())
        or ro.unit_id in (select app_managed_units())
        or app_is_admin()
      )
  )
);

drop policy if exists rpt_read on public.reports;
create policy rpt_read on public.reports
for select
using (
  org_id = app_org_id()
  and (
    app_is_admin()
    or app_is_exec()
    or (scope = 'person' and profile_id = auth.uid())
    or (scope = 'unit' and unit_id in (select app_managed_units()))
    or (
      scope = 'project'
      and unit_id in (select app_managed_units())
      and project_id in (select app_visible_projects())
    )
  )
);
