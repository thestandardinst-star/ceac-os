-- Correcting 032: activity_events names its timestamp column `at`, not
-- `occurred_at`. plpgsql resolves column names at execution, so the
-- function was created successfully and would have raised
-- "column occurred_at does not exist" the first time a manager closed a
-- project. Caught by inspecting the live column list rather than by the
-- migration succeeding.

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

  select max(a.at) into v_reopened from activity_events a
   where a.object_type = 'project' and a.object_id = p_project_id and a.verb = 'reopened';

  select pc.id, pc.submitted_at into v_close, v_submitted from project_closes pc
   where pc.project_id = p_project_id and pc.scope = 'overall' and pc.status = 'submitted'
   order by pc.version desc limit 1;

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

-- Same check on reopen_project, which also writes to activity_events.
create or replace function reopen_project(p_project_id uuid, p_reason text)
returns uuid language plpgsql security definer set search_path = public as $$
declare p record;
begin
  select * into p from projects where id = p_project_id;
  if p is null then raise exception 'That project does not exist.'; end if;
  if p.org_id <> app_org_id() then raise exception 'That belongs to another organisation.'; end if;
  if p.status <> 'closed' then raise exception 'That project is not closed.'; end if;
  if p_reason is null or length(btrim(p_reason)) = 0 then
    raise exception 'Say why it is being reopened. The reason is kept with the project.';
  end if;
  if not (p.lead_unit_id in (select app_managed_units()) or app_is_admin()) then
    raise exception 'Only the lead unit or Administration can reopen this project.';
  end if;

  update projects set status = 'active' where id = p_project_id;

  insert into activity_events (org_id, actor_id, verb, object_type, object_id, meta)
  values (p.org_id, auth.uid(), 'reopened', 'project', p_project_id,
          jsonb_build_object('reason', btrim(p_reason)));
  return p_project_id;
end; $$;
revoke execute on function reopen_project(uuid, text) from anon, public;
grant execute on function reopen_project(uuid, text) to authenticated;
