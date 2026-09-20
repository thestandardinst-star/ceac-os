-- Hardening pass. All four database issues confirmed live before changing
-- anything.

-- 1. A manager could create a project report and then not read it back:
--    rpt_read had no 'project' clause. Confirmed.
drop policy if exists rpt_read on reports;
create policy rpt_read on reports for select
  using (org_id = app_org_id() and (
    app_is_admin() or app_is_exec()
    or (scope = 'person'  and profile_id = auth.uid())
    or (scope = 'unit'    and unit_id in (select app_managed_units()))
    or (scope = 'project' and (unit_id in (select app_managed_units())
                               or project_id in (select app_visible_projects())))
  ));

-- 2. `revoke all from public` does not remove Supabase's role-specific
--    grants: anon still held EXECUTE on all four. Confirmed via proacl.
--    Swept across every definer function this project has added, not only
--    the four reported.
do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as sig
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.prosecdef
       and p.proname in (
         'save_report_draft','submit_report','correct_report','confirm_report',
         'self_certify_work','return_work_for_correction','next_work_ref',
         'next_objective_ref','submit_project_close','close_project',
         'reopen_project','next_close_version','project_close_readiness',
         'decide_finance_request','fulfil_finance_request','unit_budget_position',
         'finance_request_path','cancel_ministry_event')
  loop
    execute format('revoke execute on function %s from anon, public', f.sig);
    execute format('grant  execute on function %s to authenticated', f.sig);
  end loop;
end $$;

-- 3. Evidence traceability. A frozen figure with nothing behind it is
--    exactly the invented number the brief forbids. The contract is now
--    explicit: evidence.counts is an object of section -> integer, and
--    every non-zero count must be matched by that many rows in
--    report_evidence_refs for the same section.
create or replace function submit_report(p_report_id uuid, p_evidence jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare r record; v_period record; k text; v_claimed int; v_actual int;
begin
  select * into r from reports where id = p_report_id;
  if r is null then raise exception 'That report does not exist.'; end if;
  if r.org_id <> app_org_id() then raise exception 'That belongs to another organisation.'; end if;
  if r.status <> 'draft' then raise exception 'That report has already been submitted.'; end if;
  if not (r.unit_id in (select app_managed_units()) or app_is_admin()) then
    raise exception 'You do not lead that unit.';
  end if;
  select * into v_period from report_periods where id = r.period_id;
  if v_period.status <> 'open' then raise exception 'That reporting period is closed.'; end if;
  if p_evidence is null then
    raise exception 'The report must carry the figures it was submitted with.';
  end if;

  if jsonb_typeof(p_evidence -> 'counts') = 'object' then
    for k in select jsonb_object_keys(p_evidence -> 'counts') loop
      if jsonb_typeof(p_evidence -> 'counts' -> k) = 'number' then
        v_claimed := (p_evidence -> 'counts' ->> k)::int;
        select count(*) into v_actual from report_evidence_refs
         where report_id = r.id and section = k;
        if v_claimed > 0 and v_actual <> v_claimed then
          raise exception
            'The figure for % says % but % supporting record(s) were attached. Every number must trace to real rows.',
            k, v_claimed, v_actual;
        end if;
      end if;
    end loop;
  end if;

  update reports
     set status = 'submitted', evidence = p_evidence,
         submitted_by = auth.uid(), submitted_at = now()
   where id = r.id;
  return r.id;
end; $$;
revoke execute on function submit_report(uuid, jsonb) from anon, public;
grant execute on function submit_report(uuid, jsonb) to authenticated;

-- 4. First-draft save could race two simultaneous callers into a unique
--    violation. Now retried cleanly: whoever loses re-reads and updates
--    the draft the winner created.
create or replace function save_report_draft(
  p_period_id uuid, p_scope text, p_unit_id uuid default null,
  p_project_id uuid default null, p_narrative text default null,
  p_challenges text default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_period record; v_version int; v_tries int := 0;
begin
  select * into v_period from report_periods where id = p_period_id;
  if v_period is null then raise exception 'That reporting period does not exist.'; end if;
  if v_period.org_id <> app_org_id() then raise exception 'That belongs to another organisation.'; end if;
  if v_period.status <> 'open' then raise exception 'That reporting period is closed.'; end if;
  if p_scope not in ('unit','project') then
    raise exception 'A manager saves a unit or project report.';
  end if;
  if p_unit_id is null then raise exception 'Say which unit this report is for.'; end if;
  if not (p_unit_id in (select app_managed_units()) or app_is_admin()) then
    raise exception 'You do not lead that unit.';
  end if;
  if p_scope = 'project' then
    if p_project_id is null then raise exception 'Say which project this report is for.'; end if;
    if p_project_id not in (select app_visible_projects()) then
      raise exception 'That project is not one of yours.';
    end if;
  end if;

  loop
    v_tries := v_tries + 1;
    select id into v_id from reports
     where period_id = p_period_id and scope = p_scope and status = 'draft'
       and coalesce(unit_id,'00000000-0000-0000-0000-000000000000'::uuid)
         = coalesce(p_unit_id,'00000000-0000-0000-0000-000000000000'::uuid)
       and coalesce(project_id,'00000000-0000-0000-0000-000000000000'::uuid)
         = coalesce(p_project_id,'00000000-0000-0000-0000-000000000000'::uuid);

    if v_id is not null then
      update reports set narrative = p_narrative, challenges = p_challenges where id = v_id;
      return v_id;
    end if;

    select coalesce(max(version),0) + 1 into v_version from reports
     where period_id = p_period_id and scope = p_scope
       and coalesce(unit_id,'00000000-0000-0000-0000-000000000000'::uuid)
         = coalesce(p_unit_id,'00000000-0000-0000-0000-000000000000'::uuid)
       and coalesce(project_id,'00000000-0000-0000-0000-000000000000'::uuid)
         = coalesce(p_project_id,'00000000-0000-0000-0000-000000000000'::uuid);

    begin
      insert into reports (org_id, period_id, scope, unit_id, project_id,
                           narrative, challenges, status, version)
      values (v_period.org_id, p_period_id, p_scope, p_unit_id, p_project_id,
              p_narrative, p_challenges, 'draft', v_version)
      returning id into v_id;
      return v_id;
    exception when unique_violation then
      if v_tries >= 3 then raise; end if;
      -- Someone else created it a moment ago; go round and update theirs.
    end;
  end loop;
end; $$;
revoke execute on function save_report_draft(uuid, text, uuid, uuid, text, text) from anon, public;
grant execute on function save_report_draft(uuid, text, uuid, uuid, text, text) to authenticated;
