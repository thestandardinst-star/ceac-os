-- Three fixes to migration 020, two of them my own defects found by Codex.
--
-- 1. pc_insert contained a tautology. The unqualified column names inside
--    the EXISTS resolved to the inner table, so the participation check
--    compiled to (pu.project_id = pu.project_id AND pu.unit_id = pu.unit_id)
--    — always true. A manager could file a unit close for a project their
--    unit has nothing to do with. Columns are now qualified explicitly.
--
-- 2. submit_project_close verified the caller manages the unit but never
--    verified the unit participates in the project. The interface only
--    offered legitimate projects, but the database must not rely on that.
--
-- 3. Architecture v4 §14: "nothing in this system is irreversible, and the
--    way back is stated on the screen that does the thing" — and closed
--    project is listed explicitly: "Reopened by the manager; the close
--    report is versioned, not overwritten." close_project() existed with
--    no way back. Added.

drop policy if exists pc_insert on project_closes;
create policy pc_insert on project_closes for insert
  with check (org_id = app_org_id() and author_id = auth.uid() and (
    (scope = 'unit'
      and unit_id in (select app_managed_units())
      and exists (select 1 from project_units pu
                   where pu.project_id = project_closes.project_id
                     and pu.unit_id   = project_closes.unit_id))
    or (scope = 'overall' and exists (
        select 1 from projects p where p.id = project_closes.project_id
          and p.lead_unit_id in (select app_managed_units())))
    or app_is_admin()));

create or replace function submit_project_close(p_close_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare c record; v_missing int;
begin
  select * into c from project_closes where id = p_close_id;
  if c is null then raise exception 'That close record does not exist.'; end if;
  if c.org_id <> app_org_id() then raise exception 'That belongs to another organisation.'; end if;
  if c.status = 'submitted' then raise exception 'That close has already been submitted.'; end if;

  if c.scope = 'unit' then
    if not (c.unit_id in (select app_managed_units()) or app_is_admin()) then
      raise exception 'Only the head of that unit can submit its close.';
    end if;
    -- The unit must actually be part of the project.
    if not exists (select 1 from project_units pu
                    where pu.project_id = c.project_id and pu.unit_id = c.unit_id) then
      raise exception 'That unit is not part of this project.';
    end if;
  else
    if not (exists (select 1 from projects p where p.id = c.project_id
                    and p.lead_unit_id in (select app_managed_units())) or app_is_admin()) then
      raise exception 'Only the lead unit can submit the overall close.';
    end if;
  end if;

  select count(*) into v_missing
    from objectives o
   where o.project_id = c.project_id
     and (c.scope = 'overall' or o.unit_id = c.unit_id)
     and not exists (select 1 from project_close_objectives x
                     where x.close_id = c.id and x.objective_id = o.id);
  if v_missing > 0 then
    raise exception 'Give a verdict on every objective — % still without one.', v_missing;
  end if;

  if c.deliverables_note is null and not exists (
       select 1 from project_close_deliverables d where d.close_id = c.id) then
    raise exception 'Say what was actually produced.';
  end if;

  if c.scope = 'overall' then
    insert into project_close_participation (close_id, unit_id, unit_close_id, filed)
    select c.id, pu.unit_id, uc.id, (uc.id is not null)
      from project_units pu
      left join lateral (
        select pc.id from project_closes pc
         where pc.project_id = c.project_id and pc.scope = 'unit'
           and pc.unit_id = pu.unit_id and pc.status = 'submitted'
         order by pc.version desc limit 1
      ) uc on true
     where pu.project_id = c.project_id
    on conflict do nothing;
  end if;

  update project_closes set status = 'submitted', submitted_at = now() where id = c.id;
  return c.id;
end; $$;
revoke all on function submit_project_close(uuid) from public;
grant execute on function submit_project_close(uuid) to authenticated;

-- The way back. The close report is kept, never overwritten: reopening
-- leaves every submitted close in place, and a later close becomes the
-- next version.
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
revoke all on function reopen_project(uuid, text) from public;
grant execute on function reopen_project(uuid, text) to authenticated;

-- Reopening must allow a later close to be a new version rather than a
-- collision with the existing one.
create or replace function next_close_version(p_project_id uuid, p_scope text, p_unit_id uuid default null)
returns int language sql stable security definer set search_path = public as $$
  select coalesce(max(version), 0) + 1 from project_closes
   where project_id = p_project_id and scope = p_scope
     and coalesce(unit_id, '00000000-0000-0000-0000-000000000000'::uuid)
       = coalesce(p_unit_id, '00000000-0000-0000-0000-000000000000'::uuid);
$$;
grant execute on function next_close_version(uuid, text, uuid) to authenticated;
