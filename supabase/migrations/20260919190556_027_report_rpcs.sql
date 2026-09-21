-- Draft save, submission, correction and confirmation.

create or replace function save_report_draft(
  p_period_id uuid, p_scope text, p_unit_id uuid default null,
  p_project_id uuid default null, p_narrative text default null,
  p_challenges text default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_period record; v_version int;
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

  insert into reports (org_id, period_id, scope, unit_id, project_id,
                       narrative, challenges, status, version)
  values (v_period.org_id, p_period_id, p_scope, p_unit_id, p_project_id,
          p_narrative, p_challenges, 'draft', v_version)
  returning id into v_id;
  return v_id;
end; $$;
revoke all on function save_report_draft(uuid, text, uuid, uuid, text, text) from public;
grant execute on function save_report_draft(uuid, text, uuid, uuid, text, text) to authenticated;


-- Submission freezes the evidence. After this the report is what it said
-- it said, regardless of later edits to the underlying work.
create or replace function submit_report(p_report_id uuid, p_evidence jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare r record; v_period record;
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

  update reports
     set status = 'submitted', evidence = p_evidence,
         submitted_by = auth.uid(), submitted_at = now()
   where id = r.id;
  return r.id;
end; $$;
revoke all on function submit_report(uuid, jsonb) from public;
grant execute on function submit_report(uuid, jsonb) to authenticated;


-- A correction is a new version. The submitted one stays exactly as it was.
create or replace function correct_report(p_report_id uuid, p_reason text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare r record; v_new uuid; v_version int;
begin
  select * into r from reports where id = p_report_id;
  if r is null then raise exception 'That report does not exist.'; end if;
  if r.org_id <> app_org_id() then raise exception 'That belongs to another organisation.'; end if;
  if r.status = 'draft' then raise exception 'That report is still a draft — edit it directly.'; end if;
  if not (r.unit_id in (select app_managed_units()) or app_is_admin()) then
    raise exception 'You do not lead that unit.';
  end if;
  if p_reason is null or length(btrim(p_reason)) = 0 then
    raise exception 'Say why a correction is needed. The reason is kept with the report.';
  end if;

  select coalesce(max(version),0) + 1 into v_version from reports
   where period_id = r.period_id and scope = r.scope
     and coalesce(unit_id,'00000000-0000-0000-0000-000000000000'::uuid)
       = coalesce(r.unit_id,'00000000-0000-0000-0000-000000000000'::uuid)
     and coalesce(project_id,'00000000-0000-0000-0000-000000000000'::uuid)
       = coalesce(r.project_id,'00000000-0000-0000-0000-000000000000'::uuid);

  insert into reports (org_id, period_id, scope, unit_id, project_id,
                       narrative, challenges, status, version,
                       supersedes_report_id, correction_reason)
  values (r.org_id, r.period_id, r.scope, r.unit_id, r.project_id,
          r.narrative, r.challenges, 'draft', v_version,
          r.id, btrim(p_reason))
  returning id into v_new;
  return v_new;
end; $$;
revoke all on function correct_report(uuid, text) from public;
grant execute on function correct_report(uuid, text) to authenticated;


-- Administration confirms. A manager cannot confirm their own report, and
-- nobody can confirm a report they submitted.
create or replace function confirm_report(p_report_id uuid)
returns uuid
language plpgsql security definer set search_path = public as $$
declare r record;
begin
  select * into r from reports where id = p_report_id;
  if r is null then raise exception 'That report does not exist.'; end if;
  if r.org_id <> app_org_id() then raise exception 'That belongs to another organisation.'; end if;
  if r.status <> 'submitted' then raise exception 'Only a submitted report can be confirmed.'; end if;
  if not (app_is_admin() or app_is_exec()) then
    raise exception 'Only Administration or the Group Pastor confirms a report.';
  end if;
  if r.submitted_by = auth.uid() then
    raise exception 'You cannot confirm a report you submitted yourself.';
  end if;

  update reports set status = 'confirmed', confirmed_by = auth.uid(), confirmed_at = now()
   where id = r.id;
  return r.id;
end; $$;
revoke all on function confirm_report(uuid) from public;
grant execute on function confirm_report(uuid) to authenticated;
