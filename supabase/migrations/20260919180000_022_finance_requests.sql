-- Money asked for before it moves. Until now the system only recorded
-- money after the fact.
--
-- CEAC's rules, as given:
--   who may ask      department heads only
--   up to 1,000      Administration decides
--   1,001 - 10,000   Finance decides
--   above 10,000     Finance, then the Group Pastor — both required
--   approved money   counts against the budget immediately
--   fulfilment       Finance turns an approved request into actual spend
--
-- Thresholds are per currency because the limits are cedi figures and
-- converting currencies is forbidden elsewhere in this system. A currency
-- with no thresholds configured escalates to the Group Pastor: over-
-- approving is recoverable, under-approving is not.

create table if not exists finance_approval_rules (
  org_id uuid not null references organisations(id) on delete cascade,
  currency text not null check (currency in ('GHS','USD','GBP','EUR','NGN','ZAR','CAD')),
  no_request_below_minor bigint not null default 0,   -- 0 = every purchase needs a request
  admin_limit_minor bigint not null,
  finance_limit_minor bigint not null,
  primary key (org_id, currency)
);

insert into finance_approval_rules (org_id, currency, no_request_below_minor, admin_limit_minor, finance_limit_minor)
select id, 'GHS', 0, 100000, 1000000 from organisations
on conflict do nothing;

create table if not exists finance_requests (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organisations(id) on delete cascade,
  unit_id uuid not null references units(id) on delete restrict,
  project_id uuid references projects(id) on delete set null,
  requested_by uuid not null references profiles(id),
  title text not null,
  justification text,
  amount_minor bigint not null check (amount_minor > 0),
  currency text not null default 'GHS'
    check (currency in ('GHS','USD','GBP','EUR','NGN','ZAR','CAD')),
  needed_by date,
  state text not null default 'submitted'
    check (state in ('submitted','approved','declined','cancelled','fulfilled')),
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  fulfilled_spend_id uuid references spend_lines(id) on delete set null
);

-- Each decision is its own row. A request above 10,000 needs two.
create table if not exists finance_request_decisions (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references finance_requests(id) on delete cascade,
  stage int not null,
  authority text not null check (authority in ('admin','finance','exec')),
  decider_id uuid not null references profiles(id),
  decision text not null check (decision in ('approved','declined')),
  note text,
  decided_at timestamptz not null default now(),
  unique (request_id, stage)
);

create index if not exists freq_unit_idx on finance_requests(unit_id);
create index if not exists freq_state_idx on finance_requests(state);

-- Which authorities a request needs, in order.
create or replace function finance_request_path(p_amount_minor bigint, p_currency text, p_org uuid)
returns text[] language sql stable security definer set search_path = public as $$
  select case
    when r.currency is null then array['finance','exec']      -- unconfigured currency escalates
    when p_amount_minor <= r.admin_limit_minor then array['admin']
    when p_amount_minor <= r.finance_limit_minor then array['finance']
    else array['finance','exec']
  end
  from (select 1) z
  left join finance_approval_rules r on r.org_id = p_org and r.currency = p_currency;
$$;
grant execute on function finance_request_path(bigint, text, uuid) to authenticated;

alter table finance_requests          enable row level security;
alter table finance_request_decisions enable row level security;
alter table finance_approval_rules    enable row level security;

create policy far_read on finance_approval_rules for select using (org_id = app_org_id());
create policy far_write on finance_approval_rules for all
  using (org_id = app_org_id() and app_is_admin())
  with check (org_id = app_org_id() and app_is_admin());

-- A head raises a request for their own unit. Nobody else may.
create policy freq_insert on finance_requests for insert
  with check (org_id = app_org_id() and requested_by = auth.uid()
              and unit_id in (select app_managed_units()));

create policy freq_read on finance_requests for select
  using (org_id = app_org_id() and (
    app_is_admin() or app_is_exec()
    or unit_id in (select app_managed_units())
    or requested_by = auth.uid()
    or exists (select 1 from unit_memberships m join units u on u.id = m.unit_id
               where m.profile_id = auth.uid() and u.handles_finance)));

-- The requester may only withdraw their own, and only before a decision.
create policy freq_cancel on finance_requests for update
  using (org_id = app_org_id() and requested_by = auth.uid() and state = 'submitted')
  with check (org_id = app_org_id() and state = 'cancelled');

create policy frd_read on finance_request_decisions for select
  using (request_id in (select id from finance_requests));
-- Decisions are written only through the function below.
