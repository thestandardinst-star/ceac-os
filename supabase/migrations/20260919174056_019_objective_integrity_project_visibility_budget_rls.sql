-- C. Objectives: descriptive first, numeric optional.
alter table objectives add column if not exists measure text;

-- Reference uniqueness. Checked first: 1 objective row, 0 duplicate
-- (project_id, unit_id, ref) groups, so this cannot fail against data.
-- coalesce because both project_id and unit_id are nullable and NULLs do
-- not collide in a plain unique index.
create unique index if not exists objectives_ref_scope_idx
  on objectives (org_id,
                 coalesce(project_id, '00000000-0000-0000-0000-000000000000'::uuid),
                 coalesce(unit_id,    '00000000-0000-0000-0000-000000000000'::uuid),
                 ref)
  where ref is not null;

create table if not exists objective_ref_counters (
  scope_key text primary key,
  next_number int not null default 1
);
alter table objective_ref_counters enable row level security;
-- No policies: reached only through the definer function below.

create or replace function next_objective_ref(p_project_id uuid default null, p_unit_id uuid default null)
returns text language plpgsql security definer set search_path = public as $$
declare v_prefix text; v_key text; v_n int;
begin
  if p_project_id is not null then
    select coalesce(nullif(btrim(p.code), ''), 'PRJ') into v_prefix from projects p where p.id = p_project_id;
    if v_prefix is null then raise exception 'That project does not exist.'; end if;
  elsif p_unit_id is not null then
    select u.code into v_prefix from units u where u.id = p_unit_id;
    if v_prefix is null then raise exception 'That unit has no code set.'; end if;
  else
    raise exception 'An objective must belong to a project or a unit.';
  end if;

  v_key := coalesce(p_project_id::text, '-') || '|' || coalesce(p_unit_id::text, '-');
  insert into objective_ref_counters (scope_key, next_number) values (v_key, 2)
  on conflict (scope_key) do update set next_number = objective_ref_counters.next_number + 1
  returning case when xmax = 0 then 1 else objective_ref_counters.next_number - 1 end into v_n;

  return upper(v_prefix) || '-OBJ-' || lpad(v_n::text, 2, '0');
end; $$;
revoke all on function next_objective_ref(uuid, uuid) from public;
grant execute on function next_objective_ref(uuid, uuid) to authenticated;

-- Seed counters above anything already issued so no ref is reused.
insert into objective_ref_counters (scope_key, next_number)
select coalesce(project_id::text,'-')||'|'||coalesce(unit_id::text,'-'),
       coalesce(max((regexp_match(ref,'([0-9]+)$'))[1]::int),0) + 1
  from objectives where ref ~ '[0-9]+$'
 group by 1
on conflict (scope_key) do nothing;

-- D. Project-wide work visibility, for managers only.
-- The existing function is preserved verbatim and one clause added. Staff
-- visibility is untouched: the new clause requires app_managed_units(),
-- which is empty for a staff member. Private and confidential work stay
-- excluded.
create or replace function app_can_see_item(item_id uuid)
returns boolean language sql stable security definer set search_path to 'public' as $function$
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
        or (
          -- Manager of a lead or participating unit, project work only.
          w.visibility <> 'private'
          and w.confidential = false
          and w.project_id is not null
          and exists (
            select 1 from projects p
            where p.id = w.project_id
              and (
                p.lead_unit_id in (select app_managed_units())
                or exists (select 1 from project_units pu
                           where pu.project_id = p.id
                             and pu.unit_id in (select app_managed_units()))
              )
          )
        )
      )
  );
$function$;

-- E. Budget read isolation. bg_read was (org_id = app_org_id()), so every
-- authenticated user including ordinary staff could read every budget in
-- the church. That is a real leak, not a UI concern.
drop policy if exists bg_read on budgets;
create policy bg_read on budgets for select
  using (org_id = app_org_id() and (
    app_is_admin() or app_is_exec()
    or exists (select 1 from unit_memberships m join units u on u.id = m.unit_id
               where m.profile_id = auth.uid() and u.handles_finance)
    or unit_id in (select app_managed_units())
    or project_id in (select app_visible_projects())
  ));
-- bg_write is unchanged: Administration only.
