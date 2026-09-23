-- Production hardening after Stage 11 / premium R7.
-- This is not Stage 12 scope. It closes three verified finance integrity gaps:
-- 1) finance_request_path must not reveal another organisation's approval rules;
-- 2) request cancellation must not permit rewriting request facts;
-- 3) reversing spend lines must reduce spend totals instead of increasing them.

create or replace function finance_request_path(p_amount_minor bigint, p_currency text, p_org uuid)
returns text[]
language plpgsql
stable
security definer
set search_path = public
as $$
declare v_path text[];
begin
  if p_org is distinct from app_org_id() then
    raise insufficient_privilege using message = 'That organisation is outside your access.';
  end if;

  select case
    when r.currency is null then array['finance','exec']
    when p_amount_minor <= r.admin_limit_minor then array['admin']
    when p_amount_minor <= r.finance_limit_minor then array['finance']
    else array['finance','exec']
  end
  into v_path
  from (select 1) z
  left join finance_approval_rules r
    on r.org_id = p_org and r.currency = p_currency;

  return v_path;
end;
$$;

revoke all on function finance_request_path(bigint, text, uuid) from public;
revoke execute on function finance_request_path(bigint, text, uuid) from authenticated;

create or replace function guard_finance_request_cancel()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.state = 'submitted' and new.state = 'cancelled' then
    if new.org_id is distinct from old.org_id
       or new.unit_id is distinct from old.unit_id
       or new.project_id is distinct from old.project_id
       or new.requested_by is distinct from old.requested_by
       or new.title is distinct from old.title
       or new.justification is distinct from old.justification
       or new.amount_minor is distinct from old.amount_minor
       or new.currency is distinct from old.currency
       or new.needed_by is distinct from old.needed_by
       or new.created_at is distinct from old.created_at
       or new.decided_at is distinct from old.decided_at
       or new.fulfilled_spend_id is distinct from old.fulfilled_spend_id then
      raise exception 'Cancelling a finance request cannot rewrite its recorded facts.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists finance_request_cancel_guard on finance_requests;
create trigger finance_request_cancel_guard
before update on finance_requests
for each row execute function guard_finance_request_cancel();

create or replace function unit_budget_position(p_unit_id uuid, p_year int default null)
returns table (currency text, budget_minor bigint, spent_minor bigint,
               committed_minor bigint, remaining_minor bigint)
language sql stable security definer set search_path = public as $$
  with y as (select coalesce(p_year, extract(year from current_date)::int) as yr),
  cur as (
    select currency from budgets where unit_id = p_unit_id and year = (select yr from y)
    union select currency from spend_lines where unit_id = p_unit_id
    union select currency from finance_requests where unit_id = p_unit_id and state = 'approved'
  ),
  spend as (
    select s.currency,
           coalesce(sum(case when s.reverses_id is null then s.amount_minor else -s.amount_minor end),0)::bigint as amount_minor
    from spend_lines s
    where s.unit_id = p_unit_id
    group by s.currency
  )
  select c.currency,
    coalesce((select sum(amount_minor) from budgets b
               where b.unit_id = p_unit_id and b.year = (select yr from y) and b.currency = c.currency), 0)::bigint,
    coalesce((select amount_minor from spend s where s.currency = c.currency), 0)::bigint,
    coalesce((select sum(amount_minor) from finance_requests fr
               where fr.unit_id = p_unit_id and fr.state = 'approved' and fr.currency = c.currency), 0)::bigint,
    (
      coalesce((select sum(amount_minor) from budgets b
                 where b.unit_id = p_unit_id and b.year = (select yr from y) and b.currency = c.currency), 0)
      - coalesce((select amount_minor from spend s where s.currency = c.currency), 0)
      - coalesce((select sum(amount_minor) from finance_requests fr
                   where fr.unit_id = p_unit_id and fr.state = 'approved' and fr.currency = c.currency), 0)
    )::bigint
  from cur c
  where p_unit_id in (select app_managed_units())
     or app_is_admin() or app_is_exec()
     or exists (
       select 1 from unit_memberships m
       join units u on u.id = m.unit_id
       where m.profile_id = auth.uid() and u.handles_finance
     );
$$;

revoke all on function unit_budget_position(uuid, int) from public;
grant execute on function unit_budget_position(uuid, int) to authenticated;
