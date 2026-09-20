-- Policies follow the pattern already in this database: app_org_id(),
-- app_is_admin(), app_is_exec(), app_managed_units().

-- Periods: everyone in the org can see the calendar of periods.
create policy rp_read on report_periods for select
  using (org_id = app_org_id());
create policy rp_write on report_periods for all
  using (org_id = app_org_id() and app_is_admin())
  with check (org_id = app_org_id() and app_is_admin());

-- Reports: admin and exec see all. A person sees their own. A manager
-- sees their own units'. Office and leadership scope is admin/exec only.
create policy rpt_read on reports for select
  using (org_id = app_org_id() and (
    app_is_admin() or app_is_exec()
    or (scope = 'person' and profile_id = auth.uid())
    or (scope = 'unit' and unit_id in (select app_managed_units()))
  ));
create policy rpt_write on reports for all
  using (org_id = app_org_id() and (
    app_is_admin() or (scope = 'unit' and unit_id in (select app_managed_units()))
  ))
  with check (org_id = app_org_id() and (
    app_is_admin() or (scope = 'unit' and unit_id in (select app_managed_units()))
  ));

-- Targets inherit their report's visibility.
create policy rt_read on report_targets for select
  using (report_id in (select id from reports));
create policy rt_write on report_targets for all
  using (report_id in (select id from reports))
  with check (report_id in (select id from reports));

-- Appraisal cycles: visible to all, opened and closed by admin.
create policy ac_read on appraisal_cycles for select
  using (org_id = app_org_id());
create policy ac_write on appraisal_cycles for all
  using (org_id = app_org_id() and app_is_admin())
  with check (org_id = app_org_id() and app_is_admin());

-- Appraisals: the staff member sees their own once shared; admin sees
-- all; a manager sees their own unit members'.
create policy ap_read on appraisals for select
  using (org_id = app_org_id() and (
    app_is_admin()
    or (profile_id = auth.uid() and status = 'shared')
    or profile_id in (select profile_id from unit_memberships
                      where unit_id in (select app_managed_units()))
  ));
create policy ap_write on appraisals for all
  using (org_id = app_org_id() and (
    app_is_admin()
    or profile_id in (select profile_id from unit_memberships
                      where unit_id in (select app_managed_units()))
  ))
  with check (org_id = app_org_id() and (
    app_is_admin()
    or profile_id in (select profile_id from unit_memberships
                      where unit_id in (select app_managed_units()))
  ));

-- Feedback: the person it is about can always read it. Nothing is
-- recorded about someone that they cannot see.
create policy fn_read on feedback_notes for select
  using (org_id = app_org_id() and (
    profile_id = auth.uid() or author_id = auth.uid() or app_is_admin()
    or profile_id in (select profile_id from unit_memberships
                      where unit_id in (select app_managed_units()))
  ));
create policy fn_write on feedback_notes for all
  using (org_id = app_org_id() and (
    app_is_admin()
    or profile_id in (select profile_id from unit_memberships
                      where unit_id in (select app_managed_units()))
  ))
  with check (org_id = app_org_id() and author_id = auth.uid() and (
    app_is_admin()
    or profile_id in (select profile_id from unit_memberships
                      where unit_id in (select app_managed_units()))
  ));

-- Training: the person sees their own, admin maintains it.
create policy tr_read on training_records for select
  using (org_id = app_org_id() and (
    profile_id = auth.uid() or app_is_admin()
    or profile_id in (select profile_id from unit_memberships
                      where unit_id in (select app_managed_units()))
  ));
create policy tr_write on training_records for all
  using (org_id = app_org_id() and app_is_admin())
  with check (org_id = app_org_id() and app_is_admin());
