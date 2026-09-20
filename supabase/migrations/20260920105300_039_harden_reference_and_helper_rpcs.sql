create or replace function public.next_work_ref(p_unit_id uuid, p_sub_team_id uuid default null)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_unit_code text;
  v_sub_code text;
  v_number int;
begin
  if not (
    p_unit_id in (select app_my_units())
    or p_unit_id in (select app_managed_units())
    or (p_sub_team_id is not null and p_sub_team_id in (select app_led_sub_teams()))
    or app_is_admin()
    or app_is_exec()
  ) then
    raise exception 'You cannot create a work reference for that unit.';
  end if;

  select code into v_unit_code
  from units
  where id = p_unit_id and org_id = app_org_id();

  if v_unit_code is null then
    raise exception 'That unit does not exist here or has no code set.';
  end if;

  if p_sub_team_id is not null then
    select code into v_sub_code
    from sub_teams
    where id = p_sub_team_id
      and unit_id = p_unit_id
      and org_id = app_org_id();

    if v_sub_code is null then
      raise exception 'That sub-team does not belong to this unit.';
    end if;
  end if;

  insert into work_ref_counters(unit_id,next_number)
  values(p_unit_id,2)
  on conflict(unit_id) do update
    set next_number = work_ref_counters.next_number + 1
  returning case when xmax = 0 then 1 else work_ref_counters.next_number - 1 end
  into v_number;

  return upper(v_unit_code)
    || case when v_sub_code is not null then '-' || upper(v_sub_code) else '' end
    || '-' || lpad(v_number::text,3,'0');
end;
$$;

create or replace function public.next_objective_ref(p_project_id uuid default null, p_unit_id uuid default null)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prefix text;
  v_key text;
  v_n int;
begin
  if p_unit_id is not null
     and not (p_unit_id in (select app_managed_units()) or app_is_admin() or app_is_exec()) then
    raise exception 'You cannot create an objective reference for that unit.';
  end if;

  if p_project_id is not null then
    if p_project_id not in (select app_visible_projects()) then
      raise exception 'That project is not one you can use.';
    end if;
    select coalesce(nullif(btrim(p.code),''),'PRJ')
      into v_prefix
    from projects p
    where p.id = p_project_id and p.org_id = app_org_id();
    if v_prefix is null then raise exception 'That project does not exist.'; end if;
  elsif p_unit_id is not null then
    select u.code into v_prefix
    from units u
    where u.id = p_unit_id and u.org_id = app_org_id();
    if v_prefix is null then raise exception 'That unit has no code set.'; end if;
  else
    raise exception 'An objective must belong to a project or a unit.';
  end if;

  v_key := coalesce(p_project_id::text,'-') || '|' || coalesce(p_unit_id::text,'-');

  insert into objective_ref_counters(scope_key,next_number)
  values(v_key,2)
  on conflict(scope_key) do update
    set next_number = objective_ref_counters.next_number + 1
  returning case when xmax = 0 then 1 else objective_ref_counters.next_number - 1 end
  into v_n;

  return upper(v_prefix) || '-OBJ-' || lpad(v_n::text,2,'0');
end;
$$;

create or replace function public.next_close_version(p_project_id uuid, p_scope text, p_unit_id uuid default null)
returns integer
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_next integer;
begin
  if p_scope not in ('unit','overall') then
    raise exception 'Close scope must be unit or overall.';
  end if;

  if not exists (
    select 1 from projects
    where id = p_project_id and org_id = app_org_id()
  ) then
    raise exception 'That project does not exist.';
  end if;

  if p_scope = 'unit' then
    if p_unit_id is null then
      raise exception 'A unit close needs a unit.';
    end if;
    if not (p_unit_id in (select app_managed_units()) or app_is_admin()) then
      raise exception 'Only the head of that unit can prepare its close.';
    end if;
    if not exists (
      select 1 from project_units
      where project_id = p_project_id and unit_id = p_unit_id
    ) then
      raise exception 'That unit is not part of this project.';
    end if;
  else
    if p_unit_id is not null then
      raise exception 'An overall close does not carry a unit.';
    end if;
    if not (
      exists (
        select 1 from projects p
        where p.id = p_project_id
          and p.lead_unit_id in (select app_managed_units())
      )
      or app_is_admin()
    ) then
      raise exception 'Only the lead unit can prepare the overall close.';
    end if;
  end if;

  select coalesce(max(version),0) + 1
    into v_next
  from project_closes
  where project_id = p_project_id
    and scope = p_scope
    and coalesce(unit_id,'00000000-0000-0000-0000-000000000000'::uuid)
      = coalesce(p_unit_id,'00000000-0000-0000-0000-000000000000'::uuid);

  return v_next;
end;
$$;

revoke execute on function public.finance_request_path(bigint,text,uuid) from public, anon, authenticated;
grant execute on function public.finance_request_path(bigint,text,uuid) to service_role;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.handle_new_user() to service_role;
