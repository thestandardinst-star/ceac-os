-- Stage 3 ministry layer: define recurring ministry numbers without reopening
-- direct recurring_operations writes or forcing a ministry number to be a
-- scheduled typed-work Routine.
--
-- Recording occurrences remains append-only under migration 036.

create or replace function public.create_ministry_number(
  p_unit_id uuid,
  p_name text,
  p_value_label text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if p_unit_id is null then
    raise exception 'Choose the unit that owns this ministry number.';
  end if;

  if p_name is null or length(btrim(p_name)) < 2 then
    raise exception 'Name the ministry number.';
  end if;

  if p_value_label is null or length(btrim(p_value_label)) < 2 then
    raise exception 'Describe what the number counts.';
  end if;

  if not (
    p_unit_id in (select app_managed_units())
    or app_is_admin()
  ) then
    raise exception 'Only the Unit Head or Administration can define a ministry number for that unit.';
  end if;

  if exists (
    select 1
    from recurring_operations ro
    where ro.org_id = app_org_id()
      and ro.unit_id = p_unit_id
      and ro.active
      and lower(btrim(ro.name)) = lower(btrim(p_name))
  ) then
    raise exception 'That ministry number already exists for this unit.';
  end if;

  insert into recurring_operations(
    org_id,
    unit_id,
    name,
    cadence,
    records_value,
    value_label,
    active,
    work_item_id,
    starts_on,
    ends_on,
    paused_at,
    schedule_kind,
    weekdays,
    day_of_month
  )
  values(
    app_org_id(),
    p_unit_id,
    btrim(p_name),
    null,
    true,
    btrim(p_value_label),
    true,
    null,
    null,
    null,
    null,
    null,
    null,
    null
  )
  returning id into v_id;

  insert into activity_events(org_id,actor_id,verb,object_type,object_id,meta)
  values(
    app_org_id(),
    auth.uid(),
    'ministry_number_created',
    'recurring_operation',
    v_id,
    jsonb_build_object('unit_id',p_unit_id,'name',btrim(p_name),'value_label',btrim(p_value_label))
  );

  return v_id;
end;
$$;

revoke all on function public.create_ministry_number(uuid,text,text) from public, anon;
grant execute on function public.create_ministry_number(uuid,text,text) to authenticated, service_role;
