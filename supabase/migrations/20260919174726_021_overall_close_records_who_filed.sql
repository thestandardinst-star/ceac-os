-- CEAC's decision on the unresolved gate: the lead unit may submit the
-- overall close at any time — no department blocks the project — but the
-- overall close permanently records which participating departments had
-- filed their own return and which had not.
--
-- Nobody is blocked. Nobody's silence is hidden.
--
-- The record is a snapshot taken at the moment of submission, not a live
-- query. A department filing three weeks later must not quietly make the
-- overall close look as though they filed on time; their late return
-- stands on its own.

create table if not exists project_close_participation (
  close_id uuid not null references project_closes(id) on delete cascade,
  unit_id uuid not null references units(id) on delete restrict,
  unit_close_id uuid references project_closes(id) on delete set null,
  filed boolean not null,
  primary key (close_id, unit_id)
);
alter table project_close_participation enable row level security;

create policy pcp_read on project_close_participation for select
  using (close_id in (select id from project_closes));
-- No insert, update or delete policy: written only by the definer
-- function below, so the snapshot cannot be edited after the fact.

-- Who has and has not filed, for the lead to see BEFORE they close.
create or replace function project_close_readiness(p_project_id uuid)
returns table (unit_id uuid, unit_name text, filed boolean, submitted_at timestamptz)
language sql stable security definer set search_path = public as $$
  select u.id, u.name,
         (c.id is not null) as filed,
         c.submitted_at
    from project_units pu
    join units u on u.id = pu.unit_id
    left join lateral (
      select pc.id, pc.submitted_at from project_closes pc
       where pc.project_id = p_project_id and pc.scope = 'unit'
         and pc.unit_id = pu.unit_id and pc.status = 'submitted'
       order by pc.version desc limit 1
    ) c on true
   where pu.project_id = p_project_id
     and p_project_id in (select app_visible_projects())
   order by u.name;
$$;
revoke all on function project_close_readiness(uuid) from public;
grant execute on function project_close_readiness(uuid) to authenticated;

-- Extend submission: an overall close now snapshots participation.
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

  -- The participation snapshot. A department that has not filed is
  -- recorded as not having filed, rather than omitted.
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
