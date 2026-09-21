-- TASK B. pc_update allowed a draft author to set status = 'submitted'
-- directly, bypassing submit_project_close and all its checks. Confirmed.
drop policy if exists pc_update on project_closes;
create policy pc_update on project_closes for update
  using (org_id = app_org_id() and status = 'draft'
         and (author_id = auth.uid() or app_is_admin()))
  with check (org_id = app_org_id() and status = 'draft'
              and (author_id = auth.uid() or app_is_admin()));
-- with check now also requires status = 'draft', so an UPDATE cannot move
-- a row out of draft. Only submit_project_close (definer) can.

-- TASK C. Child rows of a submitted close were still deletable: the
-- policies were FOR ALL with a USING clause that did not test the parent
-- status, and USING governs DELETE. Confirmed by Codex in a rolled-back
-- live test. Split into read and draft-only write for all four.
drop policy if exists pco_rw on project_close_objectives;
create policy pco_read on project_close_objectives for select
  using (close_id in (select id from project_closes));
create policy pco_write on project_close_objectives for all
  using (close_id in (select id from project_closes where status = 'draft'))
  with check (close_id in (select id from project_closes where status = 'draft'));

drop policy if exists pcc_rw on project_close_costs;
create policy pcc_read on project_close_costs for select
  using (close_id in (select id from project_closes));
create policy pcc_write on project_close_costs for all
  using (close_id in (select id from project_closes where status = 'draft'))
  with check (close_id in (select id from project_closes where status = 'draft'));

drop policy if exists pcd_rw on project_close_deliverables;
create policy pcd_read on project_close_deliverables for select
  using (close_id in (select id from project_closes));
create policy pcd_write on project_close_deliverables for all
  using (close_id in (select id from project_closes where status = 'draft'))
  with check (close_id in (select id from project_closes where status = 'draft'));

-- participation is written only by submit_project_close and already had
-- read-only policy; restated for clarity, no client write at all.
drop policy if exists pcp_read on project_close_participation;
create policy pcp_read on project_close_participation for select
  using (close_id in (select id from project_closes));

-- TASK E. One draft per identity, and versions cannot collide.
create unique index if not exists project_closes_one_draft_idx
  on project_closes (project_id, scope,
    coalesce(unit_id,'00000000-0000-0000-0000-000000000000'::uuid))
  where status = 'draft';

-- TASK D. A close submitted before the latest reopen is stale. Closing
-- against it would let a manager close a reopened project using the
-- report from the previous cycle.
create or replace function close_project(p_project_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_close uuid; v_reopened timestamptz; v_submitted timestamptz;
begin
  if not exists (select 1 from projects where id = p_project_id and org_id = app_org_id()) then
    raise exception 'That project does not exist.';
  end if;
  if not (exists (select 1 from projects p where p.id = p_project_id
                  and p.lead_unit_id in (select app_managed_units())) or app_is_admin()) then
    raise exception 'Only the lead unit can close the project.';
  end if;

  select max(occurred_at) into v_reopened from activity_events
   where object_type = 'project' and object_id = p_project_id and verb = 'reopened';

  select id, submitted_at into v_close, v_submitted from project_closes
   where project_id = p_project_id and scope = 'overall' and status = 'submitted'
   order by version desc limit 1;

  if v_close is null then
    raise exception 'Submit the overall close first. A project is not closed by changing its status.';
  end if;
  if v_reopened is not null and v_submitted <= v_reopened then
    raise exception 'That close was submitted before the project was reopened. Submit a new close for this cycle.';
  end if;

  update projects set status = 'closed' where id = p_project_id and org_id = app_org_id();
  return v_close;
end; $$;
revoke execute on function close_project(uuid) from anon, public;
grant execute on function close_project(uuid) to authenticated;
