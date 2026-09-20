-- Safe work reference generation.
--
-- Replaces the client-side "count the rows and add one" approach, which
-- gives two managers the same reference if they assign at the same moment,
-- and reuses a number whenever work is cancelled or deleted.
--
-- One counter per unit. A reference is handed out once and never again,
-- even if the work it belonged to is later deleted.

create table if not exists work_ref_counters (
  unit_id uuid primary key references units(id) on delete cascade,
  next_number int not null default 1
);

alter table work_ref_counters enable row level security;
-- No direct policies: this table is only ever touched through the
-- function below, which runs with definer rights.

create or replace function next_work_ref(p_unit_id uuid, p_sub_team_id uuid default null)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_unit_code text;
  v_sub_code  text;
  v_number    int;
begin
  select code into v_unit_code from units where id = p_unit_id;
  if v_unit_code is null then
    raise exception 'Unit % has no code set. Set units.code before assigning work.', p_unit_id;
  end if;

  if p_sub_team_id is not null then
    select code into v_sub_code from sub_teams
     where id = p_sub_team_id and unit_id = p_unit_id;
    if v_sub_code is null then
      raise exception 'Sub-team % does not belong to unit %.', p_sub_team_id, p_unit_id;
    end if;
  end if;

  -- Atomic: the row is locked by the upsert, so two callers at the same
  -- instant get two different numbers.
  insert into work_ref_counters (unit_id, next_number)
  values (p_unit_id, 2)
  on conflict (unit_id) do update
    set next_number = work_ref_counters.next_number + 1
  returning case when xmax = 0 then 1 else work_ref_counters.next_number - 1 end
  into v_number;

  return upper(v_unit_code)
         || case when v_sub_code is not null then '-' || upper(v_sub_code) else '' end
         || '-' || lpad(v_number::text, 3, '0');
end;
$$;

revoke all on function next_work_ref(uuid, uuid) from public;
grant execute on function next_work_ref(uuid, uuid) to authenticated;

-- Start each unit's counter above any reference already issued, so no
-- existing reference can ever be handed out a second time.
insert into work_ref_counters (unit_id, next_number)
select u.id,
       coalesce(max((regexp_match(w.ref, '([0-9]+)$'))[1]::int), 0) + 1
  from units u
  left join work_items w on w.unit_id = u.id and w.ref ~ '[0-9]+$'
 group by u.id
on conflict (unit_id) do nothing;
