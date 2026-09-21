-- The ministry calendar. Ownership settled by CEAC: Administration and
-- the head of Programs maintain it, the Group Pastor oversees it.
--
-- A calendar is only useful if it is trustworthy, so a small number of
-- named people keep it rather than every department adding its own
-- version of the same weekend. Anyone in the church can read it.
--
-- Which departments an event needs is a first-class part of the record,
-- not a note. It is the reason Media and Facility look at the calendar
-- at all: they need to know the convention needs sound and chairs before
-- the week it happens.

-- A flag rather than the word 'Programs', so this survives a rename or a
-- reorganisation, as with units.handles_finance.
alter table units add column if not exists owns_calendar boolean not null default false;

update units set owns_calendar = true
 where owns_calendar = false and (code = 'PRG' or name ilike '%program%');

create table if not exists ministry_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organisations(id) on delete cascade,
  title text not null,
  kind text not null default 'service'
    check (kind in ('service','special_service','convention','training','meeting','outreach','other')),
  scope text not null default 'church' check (scope in ('church','unit')),
  unit_id uuid references units(id) on delete cascade,   -- set when scope = 'unit'
  starts_at timestamptz not null,
  ends_at timestamptz,
  all_day boolean not null default false,
  location text,
  notes text,
  cancelled boolean not null default false,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_by uuid references profiles(id),
  updated_at timestamptz,
  check (scope = 'church' or unit_id is not null),
  check (ends_at is null or ends_at >= starts_at)
);

-- Which departments an event needs, and what for.
create table if not exists ministry_event_units (
  event_id uuid not null references ministry_events(id) on delete cascade,
  unit_id uuid not null references units(id) on delete cascade,
  note text,
  primary key (event_id, unit_id)
);

create index if not exists mev_starts_idx on ministry_events(starts_at);
create index if not exists mev_unit_idx on ministry_events(unit_id);

alter table ministry_events      enable row level security;
alter table ministry_event_units enable row level security;

-- Everyone in the church can read the calendar. That is the point of it.
create policy mev_read on ministry_events for select
  using (org_id = app_org_id());
create policy meu_read on ministry_event_units for select
  using (event_id in (select id from ministry_events));

-- Kept by Administration, the calendar-owning unit's head, and the
-- Group Pastor.
create policy mev_write on ministry_events for all
  using (org_id = app_org_id() and (
    app_is_admin() or app_is_exec()
    or exists (select 1 from unit_memberships m join units u on u.id = m.unit_id
               where m.profile_id = auth.uid() and u.owns_calendar and m.role = 'manager')))
  with check (org_id = app_org_id() and (
    app_is_admin() or app_is_exec()
    or exists (select 1 from unit_memberships m join units u on u.id = m.unit_id
               where m.profile_id = auth.uid() and u.owns_calendar and m.role = 'manager')));

create policy meu_write on ministry_event_units for all
  using (event_id in (select id from ministry_events))
  with check (event_id in (select id from ministry_events));

-- Cancelling is not deleting: a cancelled event stays visible, because
-- departments planned around it and need to see that it is off.
create or replace function cancel_ministry_event(p_event_id uuid, p_reason text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare e record;
begin
  select * into e from ministry_events where id = p_event_id;
  if e is null then raise exception 'That event does not exist.'; end if;
  if e.org_id <> app_org_id() then raise exception 'That belongs to another organisation.'; end if;
  if not (app_is_admin() or app_is_exec() or exists (
      select 1 from unit_memberships m join units u on u.id = m.unit_id
       where m.profile_id = auth.uid() and u.owns_calendar and m.role = 'manager')) then
    raise exception 'Only Administration, Programs or the Group Pastor can change the calendar.';
  end if;
  update ministry_events
     set cancelled = true, updated_by = auth.uid(), updated_at = now(),
         notes = coalesce(notes || E'\n', '') || 'Cancelled' ||
                 coalesce(': ' || p_reason, '')
   where id = p_event_id;
  return p_event_id;
end; $$;
revoke all on function cancel_ministry_event(uuid, text) from public;
grant execute on function cancel_ministry_event(uuid, text) to authenticated;
