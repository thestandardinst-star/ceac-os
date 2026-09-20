-- Deciding a request, and turning an approved one into actual spending.

create or replace function decide_finance_request(
  p_request_id uuid, p_decision text, p_note text default null
) returns text
language plpgsql security definer set search_path = public as $$
declare
  r record; v_path text[]; v_stage int; v_needed text; v_mine text;
begin
  select * into r from finance_requests where id = p_request_id;
  if r is null then raise exception 'That request does not exist.'; end if;
  if r.org_id <> app_org_id() then raise exception 'That belongs to another organisation.'; end if;
  if r.state <> 'submitted' then raise exception 'That request is already %.', r.state; end if;
  if p_decision not in ('approved','declined') then raise exception 'Decision must be approved or declined.'; end if;

  v_path := finance_request_path(r.amount_minor, r.currency, r.org_id);
  select coalesce(max(stage), 0) + 1 into v_stage from finance_request_decisions where request_id = r.id;
  if v_stage > array_length(v_path, 1) then raise exception 'That request has all the decisions it needs.'; end if;
  v_needed := v_path[v_stage];

  -- Which authority is this caller acting as?
  v_mine := case
    when v_needed = 'admin'   and app_is_admin() then 'admin'
    when v_needed = 'exec'    and app_is_exec()  then 'exec'
    when v_needed = 'finance' and exists (
      select 1 from unit_memberships m join units u on u.id = m.unit_id
       where m.profile_id = auth.uid() and u.handles_finance) then 'finance'
    else null end;

  if v_mine is null then
    raise exception 'This request needs % at this stage.',
      case v_needed when 'admin' then 'Administration'
                    when 'finance' then 'Finance'
                    else 'the Group Pastor' end;
  end if;

  -- A person may not provide two decisions on the same request.
  if exists (select 1 from finance_request_decisions d
              where d.request_id = r.id and d.decider_id = auth.uid()) then
    raise exception 'You have already decided on this request.';
  end if;

  insert into finance_request_decisions (request_id, stage, authority, decider_id, decision, note)
  values (r.id, v_stage, v_mine, auth.uid(), p_decision, p_note);

  if p_decision = 'declined' then
    update finance_requests set state = 'declined', decided_at = now() where id = r.id;
    return 'declined';
  end if;

  if v_stage = array_length(v_path, 1) then
    update finance_requests set state = 'approved', decided_at = now() where id = r.id;
    return 'approved';
  end if;

  return 'awaiting ' || v_path[v_stage + 1];
end; $$;
revoke all on function decide_finance_request(uuid, text, text) from public;
grant execute on function decide_finance_request(uuid, text, text) to authenticated;


-- Finance turns an approved request into a real spend line. One click,
-- no retyping, and the two records stay linked.
create or replace function fulfil_finance_request(
  p_request_id uuid, p_spent_on date default null, p_source_note text default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare r record; v_spend uuid;
begin
  select * into r from finance_requests where id = p_request_id;
  if r is null then raise exception 'That request does not exist.'; end if;
  if r.org_id <> app_org_id() then raise exception 'That belongs to another organisation.'; end if;
  if r.state <> 'approved' then raise exception 'Only an approved request can be paid out.'; end if;

  if not (app_is_admin() or exists (
      select 1 from unit_memberships m join units u on u.id = m.unit_id
       where m.profile_id = auth.uid() and u.handles_finance)) then
    raise exception 'Only Finance or Administration can pay out a request.';
  end if;

  insert into spend_lines (org_id, unit_id, project_id, spent_on, description,
                           amount_minor, currency, source_note, entered_by)
  values (r.org_id, r.unit_id, r.project_id,
          coalesce(p_spent_on, current_date), r.title,
          r.amount_minor, r.currency,
          coalesce(p_source_note, 'Approved request'), auth.uid())
  returning id into v_spend;

  update finance_requests
     set state = 'fulfilled', fulfilled_spend_id = v_spend
   where id = r.id;
  return v_spend;
end; $$;
revoke all on function fulfil_finance_request(uuid, date, text) from public;
grant execute on function fulfil_finance_request(uuid, date, text) to authenticated;


-- Budget remaining, with approved-but-unpaid money already counted
-- against it. Per currency; never summed across currencies.
create or replace function unit_budget_position(p_unit_id uuid, p_year int default null)
returns table (currency text, budget_minor bigint, spent_minor bigint,
               committed_minor bigint, remaining_minor bigint)
language sql stable security definer set search_path = public as $$
  with y as (select coalesce(p_year, extract(year from current_date)::int) as yr),
  cur as (
    select currency from budgets where unit_id = p_unit_id and year = (select yr from y)
    union select currency from spend_lines where unit_id = p_unit_id
    union select currency from finance_requests where unit_id = p_unit_id and state = 'approved'
  )
  select c.currency,
    coalesce((select sum(amount_minor) from budgets b
               where b.unit_id = p_unit_id and b.year = (select yr from y) and b.currency = c.currency), 0),
    coalesce((select sum(amount_minor) from spend_lines s
               where s.unit_id = p_unit_id and s.currency = c.currency), 0),
    coalesce((select sum(amount_minor) from finance_requests fr
               where fr.unit_id = p_unit_id and fr.state = 'approved' and fr.currency = c.currency), 0),
    coalesce((select sum(amount_minor) from budgets b
               where b.unit_id = p_unit_id and b.year = (select yr from y) and b.currency = c.currency), 0)
    - coalesce((select sum(amount_minor) from spend_lines s
               where s.unit_id = p_unit_id and s.currency = c.currency), 0)
    - coalesce((select sum(amount_minor) from finance_requests fr
               where fr.unit_id = p_unit_id and fr.state = 'approved' and fr.currency = c.currency), 0)
  from cur c
  where p_unit_id in (select app_managed_units())
     or app_is_admin() or app_is_exec()
     or exists (select 1 from unit_memberships m join units u on u.id = m.unit_id
                where m.profile_id = auth.uid() and u.handles_finance);
$$;
grant execute on function unit_budget_position(uuid, int) to authenticated;
