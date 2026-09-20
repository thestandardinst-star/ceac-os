-- Money coming in, and money moving between parts of the church.
--
-- Two kinds, because they carry different risk:
--
--  income_lines      — money entering the church from outside. Offerings,
--                      partnerships, donations, events. Finance collates
--                      and records it centrally. One party, because there
--                      is no second party inside the church to confirm it.
--
--  internal_transfers — money moving from one part of the church to
--                      another. Two-sided: the sender records it, the
--                      receiver confirms it. Until both agree it stands
--                      as unconfirmed and both sides can see it. One
--                      person's word is not a record where money is
--                      concerned.
--
-- Nothing here is ever edited or deleted. A wrong figure is corrected by
-- adding a reversing entry that points at the original, so both remain
-- visible. There are deliberately no delete policies below: a money
-- record that can be silently altered is worthless in the dispute it
-- exists to settle.
--
-- Amounts in pesewas as integers, as elsewhere.

create table if not exists income_lines (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organisations(id) on delete cascade,
  received_on date not null,
  source_kind text not null check (source_kind in ('offering','partnership','donation','event','other')),
  description text not null,
  amount_pesewas bigint not null,
  period_id uuid references report_periods(id) on delete set null,
  source_note text,                      -- which book or record this came from
  reverses_id uuid references income_lines(id),   -- a correction, not an edit
  entered_by uuid not null references profiles(id),
  entered_at timestamptz not null default now()
);

create table if not exists internal_transfers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organisations(id) on delete cascade,
  from_unit_id uuid references units(id) on delete restrict,  -- null = central church funds
  to_unit_id uuid not null references units(id) on delete restrict,
  amount_pesewas bigint not null check (amount_pesewas > 0),
  sent_on date not null,
  purpose text not null,
  state text not null default 'sent' check (state in ('sent','confirmed','disputed')),
  sent_by uuid not null references profiles(id),
  sent_at timestamptz not null default now(),
  responded_by uuid references profiles(id),
  responded_at timestamptz,
  response_note text,
  reverses_id uuid references internal_transfers(id),
  check (from_unit_id is null or from_unit_id <> to_unit_id)
);

create index if not exists income_date_idx on income_lines(received_on);
create index if not exists transfer_to_idx on internal_transfers(to_unit_id);
create index if not exists transfer_from_idx on internal_transfers(from_unit_id);

alter table income_lines       enable row level security;
alter table internal_transfers enable row level security;

-- Income: Finance and Administration record it; leadership can see it.
create policy inc_read on income_lines for select
  using (org_id = app_org_id() and (
    app_is_admin() or app_is_exec()
    or exists (select 1 from unit_memberships m join units u on u.id = m.unit_id
               where m.profile_id = auth.uid() and u.handles_finance)
  ));
create policy inc_insert on income_lines for insert
  with check (org_id = app_org_id() and entered_by = auth.uid() and (
    app_is_admin()
    or exists (select 1 from unit_memberships m join units u on u.id = m.unit_id
               where m.profile_id = auth.uid() and u.handles_finance)
  ));

-- Transfers: both sides see their own, plus Finance, Administration and
-- the Group Pastor.
create policy tf_read on internal_transfers for select
  using (org_id = app_org_id() and (
    app_is_admin() or app_is_exec()
    or to_unit_id in (select app_managed_units())
    or from_unit_id in (select app_managed_units())
    or exists (select 1 from unit_memberships m join units u on u.id = m.unit_id
               where m.profile_id = auth.uid() and u.handles_finance)
  ));

-- The sender records it: Finance, Administration, or the head of the
-- unit the money is leaving.
create policy tf_insert on internal_transfers for insert
  with check (org_id = app_org_id() and sent_by = auth.uid() and (
    app_is_admin()
    or from_unit_id in (select app_managed_units())
    or exists (select 1 from unit_memberships m join units u on u.id = m.unit_id
               where m.profile_id = auth.uid() and u.handles_finance)
  ));

-- Only the receiving side confirms or disputes. The sender cannot mark
-- their own transfer as received — that would defeat the point of it.
create policy tf_respond on internal_transfers for update
  using (org_id = app_org_id() and (
    app_is_admin() or to_unit_id in (select app_managed_units())
  ))
  with check (org_id = app_org_id() and (
    app_is_admin() or to_unit_id in (select app_managed_units())
  ));
