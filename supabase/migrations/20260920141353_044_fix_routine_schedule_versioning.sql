
create or replace function public.change_routine_schedule(
  p_work_item_id uuid,
  p_effective_from date,
  p_schedule_kind text,
  p_weekdays smallint[] default null,
  p_day_of_month integer default null,
  p_ends_on date default null
)
returns integer
language plpgsql
security definer
set search_path=public
as $$
declare
  ro record;
  v_latest record;
  v_version integer;
begin
  select * into ro from recurring_operations where work_item_id=p_work_item_id for update;
  if ro is null then raise exception 'That routine does not exist.'; end if;
  if ro.org_id<>app_org_id() then raise exception 'That belongs to another organisation.'; end if;
  if not (ro.unit_id in (select app_managed_units()) or app_is_admin()) then
    raise exception 'Only the unit head or Administration can change this routine.';
  end if;
  if p_effective_from is null or p_effective_from<=current_date then
    raise exception 'A schedule change must start on a future date.';
  end if;
  if p_schedule_kind not in ('daily','weekly','monthly','weekdays') then
    raise exception 'Routine schedule must be daily, weekly, monthly or selected weekdays.';
  end if;
  if p_weekdays is not null and exists (select 1 from unnest(p_weekdays) d where d<1 or d>7) then
    raise exception 'Routine weekdays use ISO days 1 to 7.';
  end if;
  if p_schedule_kind in ('weekly','weekdays') and coalesce(array_length(p_weekdays,1),0)=0 then
    raise exception 'Choose the scheduled weekday(s).';
  end if;
  if p_schedule_kind='monthly' and (p_day_of_month is null or p_day_of_month not between 1 and 31) then
    raise exception 'Monthly routines need a day from 1 to 31.';
  end if;
  if p_ends_on is not null and p_ends_on<p_effective_from then
    raise exception 'Routine end date cannot be before the new schedule starts.';
  end if;

  select * into v_latest
  from routine_schedule_versions
  where operation_id=ro.id
  order by version desc
  limit 1;

  if v_latest.id is not null and p_effective_from<=v_latest.effective_from then
    raise exception 'The new schedule must start after the current schedule version.';
  end if;

  if v_latest.id is not null then
    update routine_schedule_versions
    set effective_to=p_effective_from-1
    where id=v_latest.id;
    v_version:=v_latest.version+1;
  else
    v_version:=1;
  end if;

  insert into routine_schedule_versions(
    operation_id,version,effective_from,schedule_kind,weekdays,day_of_month,created_by
  ) values(ro.id,v_version,p_effective_from,p_schedule_kind,p_weekdays,p_day_of_month,auth.uid());

  update recurring_operations
  set cadence=p_schedule_kind,
      schedule_kind=p_schedule_kind,
      weekdays=p_weekdays,
      day_of_month=p_day_of_month,
      ends_on=p_ends_on
  where id=ro.id;

  insert into activity_events(org_id,actor_id,verb,object_type,object_id,meta)
  values(ro.org_id,auth.uid(),'routine_schedule_changed','work_item',p_work_item_id,
         jsonb_build_object('version',v_version,'effective_from',p_effective_from));

  return v_version;
end;
$$;

revoke all on function public.change_routine_schedule(uuid,date,text,smallint[],integer,date) from public,anon;
grant execute on function public.change_routine_schedule(uuid,date,text,smallint[],integer,date) to authenticated,service_role;
