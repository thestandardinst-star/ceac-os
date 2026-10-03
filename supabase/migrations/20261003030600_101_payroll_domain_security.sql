-- 101 — FPG5 / Stage 13 Payroll domain and security.
-- Payroll remains protected inside hr_private and is reachable only through
-- explicit capability-checked RPCs. No attendance-derived or statutory formula
-- is introduced here; unconfirmed deductions remain manual-authoritative inputs.

create table if not exists hr_private.payroll_periods(
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete restrict,
  label text not null check(length(btrim(label)) between 2 and 120),
  period_start date not null,
  period_end date not null,
  pay_date date,
  currency text not null check(currency ~ '^[A-Z]{3}$'),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique(org_id,period_start,period_end,currency),
  check(period_end>=period_start)
);

create table if not exists hr_private.payroll_runs(
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete restrict,
  period_id uuid not null references hr_private.payroll_periods(id) on delete restrict,
  revision integer not null default 1 check(revision>0),
  status text not null default 'draft' check(status in ('draft','in_review','approved')),
  correction_of uuid references hr_private.payroll_runs(id) on delete restrict,
  prepared_by uuid not null references public.profiles(id) on delete restrict,
  prepared_at timestamptz not null default now(),
  submitted_by uuid references public.profiles(id) on delete restrict,
  submitted_at timestamptz,
  approved_by uuid references public.profiles(id) on delete restrict,
  approved_at timestamptz,
  preparation_note text,
  approval_note text,
  total_additions_minor bigint not null default 0,
  total_deductions_minor bigint not null default 0,
  total_net_minor bigint not null default 0,
  locked_at timestamptz,
  created_at timestamptz not null default now(),
  unique(period_id,revision),
  check(
    (status='draft' and approved_by is null and approved_at is null and locked_at is null)
    or
    (status='in_review' and submitted_by is not null and submitted_at is not null and approved_by is null and approved_at is null and locked_at is null)
    or
    (status='approved' and submitted_by is not null and submitted_at is not null and approved_by is not null and approved_at is not null and locked_at is not null)
  )
);

create table if not exists hr_private.payroll_entries(
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete restrict,
  run_id uuid not null references hr_private.payroll_runs(id) on delete restrict,
  profile_id uuid not null references public.profiles(id) on delete restrict,
  employee_name text not null check(length(btrim(employee_name)) between 2 and 180),
  currency text not null check(currency ~ '^[A-Z]{3}$'),
  compensation_record_id uuid references hr_private.compensation_history(id) on delete restrict,
  payment_detail_id uuid references hr_private.payment_details(id) on delete restrict,
  compensation_snapshot jsonb not null default '{}'::jsonb,
  payment_snapshot jsonb not null default '{}'::jsonb,
  additions_minor bigint not null default 0,
  deductions_minor bigint not null default 0,
  net_minor bigint not null default 0,
  flags jsonb not null default '[]'::jsonb,
  note text,
  updated_by uuid not null references public.profiles(id) on delete restrict,
  updated_at timestamptz not null default now(),
  unique(run_id,profile_id)
);

create table if not exists hr_private.payroll_entry_lines(
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete restrict,
  entry_id uuid not null references hr_private.payroll_entries(id) on delete restrict,
  category text not null check(category in (
    'base_salary','transport_allowance','bonus','annual_bonus','reimbursement',
    'other_allowance','loan_advance','penalty_deduction','tax','ssnit',
    'other_deduction','correction'
  )),
  direction text not null check(direction in ('addition','deduction')),
  label text not null check(length(btrim(label)) between 2 and 160),
  amount_minor bigint not null check(amount_minor>=0),
  source text not null default 'manual' check(source in ('compensation','manual','correction')),
  note text,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  check(
    (category in ('base_salary','transport_allowance','bonus','annual_bonus','reimbursement','other_allowance') and direction='addition')
    or (category in ('penalty_deduction','tax','ssnit','other_deduction') and direction='deduction')
    or category in ('loan_advance','correction')
  )
);

create index if not exists payroll_periods_org_idx
  on hr_private.payroll_periods(org_id,period_start desc,period_end desc);
create index if not exists payroll_runs_org_idx
  on hr_private.payroll_runs(org_id,status,created_at desc);
create index if not exists payroll_entries_run_idx
  on hr_private.payroll_entries(run_id,profile_id);
create index if not exists payroll_lines_entry_idx
  on hr_private.payroll_entry_lines(entry_id,created_at);

alter table hr_private.payroll_periods enable row level security;
alter table hr_private.payroll_runs enable row level security;
alter table hr_private.payroll_entries enable row level security;
alter table hr_private.payroll_entry_lines enable row level security;

revoke all on hr_private.payroll_periods from public,anon,authenticated;
revoke all on hr_private.payroll_runs from public,anon,authenticated;
revoke all on hr_private.payroll_entries from public,anon,authenticated;
revoke all on hr_private.payroll_entry_lines from public,anon,authenticated;

grant select,insert,update,delete on hr_private.payroll_periods to service_role;
grant select,insert,update,delete on hr_private.payroll_runs to service_role;
grant select,insert,update,delete on hr_private.payroll_entries to service_role;
grant select,insert,update,delete on hr_private.payroll_entry_lines to service_role;

create or replace function public.guard_payroll_capability_grant()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  v_admin boolean;
  v_exec boolean;
  v_opposite text;
begin
  if new.revoked_at is not null or new.capability not in ('payroll.prepare','payroll.approve') then
    return new;
  end if;

  select p.is_admin,p.is_exec into v_admin,v_exec
  from public.profiles p
  where p.id=new.profile_id and p.org_id=new.org_id and p.active;

  if not found then
    raise exception 'Payroll authority requires an active organisation member.' using errcode='42501';
  end if;

  if new.capability='payroll.prepare' and (not coalesce(v_admin,false) or coalesce(v_exec,false)) then
    raise exception 'Payroll preparation is reserved for Administration and cannot be held by the Group Pastor/CEO.'
      using errcode='42501';
  end if;

  if new.capability='payroll.approve' and not coalesce(v_exec,false) then
    raise exception 'Payroll approval is reserved for the Group Pastor/CEO.'
      using errcode='42501';
  end if;

  v_opposite:=case when new.capability='payroll.prepare' then 'payroll.approve' else 'payroll.prepare' end;
  if exists (
    select 1 from public.capability_grants cg
    where cg.org_id=new.org_id
      and cg.profile_id=new.profile_id
      and cg.capability=v_opposite
      and cg.revoked_at is null
      and cg.id is distinct from new.id
  ) then
    raise exception 'Payroll preparation and approval must remain separated.'
      using errcode='42501';
  end if;

  return new;
end;
$$;

revoke all on function public.guard_payroll_capability_grant() from public,anon,authenticated;
drop trigger if exists capability_grants_payroll_guard on public.capability_grants;
create trigger capability_grants_payroll_guard
before insert or update on public.capability_grants
for each row execute function public.guard_payroll_capability_grant();

insert into public.capability_grants(
  org_id,profile_id,capability,scope_unit_id,granted_by,grant_reason
)
select p.org_id,p.id,'payroll.prepare',null,null,
       'FPG5 payroll preparation authority from the approved Administration boundary.'
from public.profiles p
where p.active and p.is_admin and not p.is_exec
  and not exists (
    select 1 from public.capability_grants cg
    where cg.org_id=p.org_id and cg.profile_id=p.id
      and cg.capability in ('payroll.prepare','payroll.approve')
      and cg.revoked_at is null
  );

insert into public.capability_grants(
  org_id,profile_id,capability,scope_unit_id,granted_by,grant_reason
)
select p.org_id,p.id,'hr_private.access',null,null,
       'FPG5 protected-HR visibility for the Group Pastor/CEO.'
from public.profiles p
where p.active and p.is_exec
  and not exists (
    select 1 from public.capability_grants cg
    where cg.org_id=p.org_id and cg.profile_id=p.id
      and cg.capability='hr_private.access' and cg.revoked_at is null
  );

insert into public.capability_grants(
  org_id,profile_id,capability,scope_unit_id,granted_by,grant_reason
)
select p.org_id,p.id,'payroll.approve',null,null,
       'FPG5 payroll approval authority for the Group Pastor/CEO.'
from public.profiles p
where p.active and p.is_exec
  and not exists (
    select 1 from public.capability_grants cg
    where cg.org_id=p.org_id and cg.profile_id=p.id
      and cg.capability in ('payroll.prepare','payroll.approve')
      and cg.revoked_at is null
  );

create or replace function hr_private.payroll_recalculate(p_run_id uuid)
returns void
language plpgsql
security definer
set search_path=''
as $$
begin
  update hr_private.payroll_entries e
  set additions_minor=coalesce((
        select sum(l.amount_minor)
        from hr_private.payroll_entry_lines l
        where l.entry_id=e.id and l.direction='addition'
      ),0),
      deductions_minor=coalesce((
        select sum(l.amount_minor)
        from hr_private.payroll_entry_lines l
        where l.entry_id=e.id and l.direction='deduction'
      ),0),
      net_minor=coalesce((
        select sum(case when l.direction='addition' then l.amount_minor else -l.amount_minor end)
        from hr_private.payroll_entry_lines l
        where l.entry_id=e.id
      ),0),
      flags=to_jsonb(array_remove(array[
        case when not exists(
          select 1 from hr_private.payroll_entry_lines l
          where l.entry_id=e.id and l.category='base_salary' and l.direction='addition'
        ) then 'missing_base_salary' end,
        case when e.payment_detail_id is null then 'missing_payment_detail' end,
        case when coalesce((
          select sum(case when l.direction='addition' then l.amount_minor else -l.amount_minor end)
          from hr_private.payroll_entry_lines l where l.entry_id=e.id
        ),0)<0 then 'negative_net' end
      ]::text[],null)),
      updated_at=now()
  where e.run_id=p_run_id;

  update hr_private.payroll_runs r
  set total_additions_minor=coalesce(x.additions,0),
      total_deductions_minor=coalesce(x.deductions,0),
      total_net_minor=coalesce(x.net,0)
  from (
    select e.run_id,
           sum(e.additions_minor)::bigint additions,
           sum(e.deductions_minor)::bigint deductions,
           sum(e.net_minor)::bigint net
    from hr_private.payroll_entries e
    where e.run_id=p_run_id
    group by e.run_id
  ) x
  where r.id=p_run_id and r.id=x.run_id;

  update hr_private.payroll_runs
  set total_additions_minor=0,total_deductions_minor=0,total_net_minor=0
  where id=p_run_id
    and not exists(select 1 from hr_private.payroll_entries e where e.run_id=p_run_id);
end;
$$;

revoke all on function hr_private.payroll_recalculate(uuid) from public,anon,authenticated;

create or replace function hr_private.payroll_guard_run()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  if old.status='approved' then
    raise exception 'Approved payroll runs are immutable. Create an attributable correction run instead.'
      using errcode='42501';
  end if;
  return case when tg_op='DELETE' then old else new end;
end;
$$;
revoke all on function hr_private.payroll_guard_run() from public,anon,authenticated;

drop trigger if exists payroll_runs_approved_immutable on hr_private.payroll_runs;
create trigger payroll_runs_approved_immutable
before update or delete on hr_private.payroll_runs
for each row execute function hr_private.payroll_guard_run();

create or replace function hr_private.payroll_guard_child()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  v_run_id uuid;
  v_status text;
begin
  if tg_table_name='payroll_entries' then
    v_run_id:=coalesce(new.run_id,old.run_id);
  else
    select e.run_id into v_run_id
    from hr_private.payroll_entries e
    where e.id=coalesce(new.entry_id,old.entry_id);
  end if;

  select r.status into v_status from hr_private.payroll_runs r where r.id=v_run_id;
  if v_status='approved' then
    raise exception 'Approved payroll entries are immutable. Create an attributable correction run instead.'
      using errcode='42501';
  end if;
  return case when tg_op='DELETE' then old else new end;
end;
$$;
revoke all on function hr_private.payroll_guard_child() from public,anon,authenticated;

drop trigger if exists payroll_entries_approved_immutable on hr_private.payroll_entries;
create trigger payroll_entries_approved_immutable
before insert or update or delete on hr_private.payroll_entries
for each row execute function hr_private.payroll_guard_child();

drop trigger if exists payroll_lines_approved_immutable on hr_private.payroll_entry_lines;
create trigger payroll_lines_approved_immutable
before insert or update or delete on hr_private.payroll_entry_lines
for each row execute function hr_private.payroll_guard_child();

create or replace function hr_private.payroll_guard_period()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  if exists(
    select 1 from hr_private.payroll_runs r
    where r.period_id=old.id and r.status='approved'
  ) then
    raise exception 'A payroll period with an approved run is immutable.'
      using errcode='42501';
  end if;
  return case when tg_op='DELETE' then old else new end;
end;
$$;
revoke all on function hr_private.payroll_guard_period() from public,anon,authenticated;

drop trigger if exists payroll_periods_approved_immutable on hr_private.payroll_periods;
create trigger payroll_periods_approved_immutable
before update or delete on hr_private.payroll_periods
for each row execute function hr_private.payroll_guard_period();

create or replace function public.payroll_list_runs()
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_org uuid:=public.app_org_id();
begin
  if auth.uid() is null or not (
    public.app_has_capability('payroll.prepare',null)
    or public.app_has_capability('payroll.approve',null)
  ) then
    raise exception 'You do not have authority to view payroll.' using errcode='42501';
  end if;

  return coalesce((
    select jsonb_agg(to_jsonb(x) order by x.period_start desc,x.revision desc)
    from (
      select r.id,r.revision,r.status,r.correction_of,
             p.label,p.period_start,p.period_end,p.pay_date,p.currency,
             r.total_additions_minor,r.total_deductions_minor,r.total_net_minor,
             r.prepared_at,r.submitted_at,r.approved_at,
             prep.full_name prepared_by_name,
             approver.full_name approved_by_name
      from hr_private.payroll_runs r
      join hr_private.payroll_periods p on p.id=r.period_id
      left join public.profiles prep on prep.id=r.prepared_by
      left join public.profiles approver on approver.id=r.approved_by
      where r.org_id=v_org
    ) x
  ),'[]'::jsonb);
end;
$$;
revoke all on function public.payroll_list_runs() from public,anon;
grant execute on function public.payroll_list_runs() to authenticated,service_role;

create or replace function public.payroll_run_detail(p_run_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_org uuid:=public.app_org_id();
  v_run jsonb;
begin
  if auth.uid() is null or not (
    public.app_has_capability('payroll.prepare',null)
    or public.app_has_capability('payroll.approve',null)
  ) then
    raise exception 'You do not have authority to view payroll.' using errcode='42501';
  end if;

  select to_jsonb(x) into v_run
  from (
    select r.id,r.revision,r.status,r.correction_of,r.prepared_by,r.prepared_at,
           r.submitted_by,r.submitted_at,r.approved_by,r.approved_at,
           r.preparation_note,r.approval_note,r.total_additions_minor,
           r.total_deductions_minor,r.total_net_minor,r.locked_at,
           p.label,p.period_start,p.period_end,p.pay_date,p.currency
    from hr_private.payroll_runs r
    join hr_private.payroll_periods p on p.id=r.period_id
    where r.id=p_run_id and r.org_id=v_org
  ) x;

  if v_run is null then
    raise exception 'Payroll run not found.' using errcode='42501';
  end if;

  insert into hr_private.audit_events(
    org_id,actor_id,action,resource_type,resource_id,detail
  ) values (
    v_org,auth.uid(),'payroll_viewed','payroll_run',p_run_id,
    jsonb_build_object('surface','payroll')
  );

  return jsonb_build_object(
    'run',v_run,
    'entries',coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id',e.id,
          'profile_id',e.profile_id,
          'employee_name',e.employee_name,
          'currency',e.currency,
          'compensation_record_id',e.compensation_record_id,
          'payment_detail_id',e.payment_detail_id,
          'compensation_snapshot',e.compensation_snapshot,
          'payment_snapshot',e.payment_snapshot,
          'additions_minor',e.additions_minor,
          'deductions_minor',e.deductions_minor,
          'net_minor',e.net_minor,
          'flags',e.flags,
          'note',e.note,
          'lines',coalesce((
            select jsonb_agg(to_jsonb(lx) order by lx.created_at,lx.id)
            from (
              select l.id,l.category,l.direction,l.label,l.amount_minor,l.source,l.note,l.created_at
              from hr_private.payroll_entry_lines l
              where l.entry_id=e.id
            ) lx
          ),'[]'::jsonb)
        )
        order by e.employee_name
      )
      from hr_private.payroll_entries e
      where e.run_id=p_run_id and e.org_id=v_org
    ),'[]'::jsonb)
  );
end;
$$;
revoke all on function public.payroll_run_detail(uuid) from public,anon;
grant execute on function public.payroll_run_detail(uuid) to authenticated,service_role;

create or replace function public.payroll_create_run(
  p_label text,
  p_period_start date,
  p_period_end date,
  p_currency text,
  p_pay_date date default null,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  v_org uuid:=public.app_org_id();
  v_actor uuid:=auth.uid();
  v_period uuid;
  v_run uuid;
  v_entry uuid;
  v_row record;
  v_currency text:=upper(btrim(coalesce(p_currency,'')));
begin
  if v_actor is null
     or not public.app_has_capability('payroll.prepare',null)
     or public.app_is_exec() then
    raise exception 'Only Administration with payroll preparation authority can create a payroll run.'
      using errcode='42501';
  end if;

  if nullif(btrim(coalesce(p_label,'')),'') is null
     or p_period_start is null or p_period_end is null or p_period_end<p_period_start
     or v_currency!~'^[A-Z]{3}$' then
    raise exception 'Payroll label, valid period dates and a three-letter currency are required.';
  end if;

  select p.id into v_period
  from hr_private.payroll_periods p
  where p.org_id=v_org and p.period_start=p_period_start
    and p.period_end=p_period_end and p.currency=v_currency
  for update;

  if v_period is null then
    insert into hr_private.payroll_periods(
      org_id,label,period_start,period_end,pay_date,currency,created_by
    ) values (
      v_org,btrim(p_label),p_period_start,p_period_end,p_pay_date,v_currency,v_actor
    ) returning id into v_period;
  else
    if exists(select 1 from hr_private.payroll_runs r where r.period_id=v_period) then
      raise exception 'This payroll period already has a run. Use the correction flow after approval.';
    end if;
  end if;

  insert into hr_private.payroll_runs(
    org_id,period_id,revision,status,prepared_by,preparation_note
  ) values (
    v_org,v_period,1,'draft',v_actor,nullif(btrim(coalesce(p_note,'')),'')
  ) returning id into v_run;

  for v_row in
    select p.id profile_id,p.full_name,
           c.id compensation_id,c.amount_minor,c.currency compensation_currency,
           c.basis_label,c.effective_on,c.ends_on,
           pd.id payment_id,pd.payment_type,pd.provider_name,
           pd.account_name,pd.account_reference,pd.branch_reference
    from public.profiles p
    left join lateral (
      select ch.*
      from hr_private.compensation_history ch
      where ch.org_id=v_org and ch.profile_id=p.id and ch.status='active'
        and ch.effective_on<=p_period_end
        and (ch.ends_on is null or ch.ends_on>=p_period_start)
      order by ch.effective_on desc,ch.recorded_at desc
      limit 1
    ) c on true
    left join lateral (
      select pay.*
      from hr_private.payment_details pay
      where pay.org_id=v_org and pay.profile_id=p.id and pay.status='active'
      order by pay.recorded_at desc
      limit 1
    ) pd on true
    where p.org_id=v_org and p.active
    order by p.full_name
  loop
    insert into hr_private.payroll_entries(
      org_id,run_id,profile_id,employee_name,currency,
      compensation_record_id,payment_detail_id,compensation_snapshot,payment_snapshot,
      updated_by
    ) values (
      v_org,v_run,v_row.profile_id,v_row.full_name,v_currency,
      v_row.compensation_id,v_row.payment_id,
      case when v_row.compensation_id is null then '{}'::jsonb else jsonb_build_object(
        'amount_minor',v_row.amount_minor,'currency',v_row.compensation_currency,
        'basis_label',v_row.basis_label,'effective_on',v_row.effective_on,'ends_on',v_row.ends_on
      ) end,
      case when v_row.payment_id is null then '{}'::jsonb else jsonb_build_object(
        'payment_type',v_row.payment_type,'provider_name',v_row.provider_name,
        'account_name',v_row.account_name,'account_reference',v_row.account_reference,
        'branch_reference',v_row.branch_reference
      ) end,
      v_actor
    ) returning id into v_entry;

    if v_row.compensation_id is not null and v_row.compensation_currency=v_currency then
      insert into hr_private.payroll_entry_lines(
        org_id,entry_id,category,direction,label,amount_minor,source,note,created_by
      ) values (
        v_org,v_entry,'base_salary','addition','Base salary',v_row.amount_minor,
        'compensation','Recorded protected compensation for this payroll period.',v_actor
      );
    end if;
  end loop;

  perform hr_private.payroll_recalculate(v_run);

  insert into hr_private.audit_events(
    org_id,actor_id,action,resource_type,resource_id,reason,detail
  ) values (
    v_org,v_actor,'payroll_run_created','payroll_run',v_run,
    nullif(btrim(coalesce(p_note,'')),''),
    jsonb_build_object('period_id',v_period,'currency',v_currency)
  );

  return v_run;
end;
$$;
revoke all on function public.payroll_create_run(text,date,date,text,date,text) from public,anon;
grant execute on function public.payroll_create_run(text,date,date,text,date,text) to authenticated,service_role;

create or replace function public.payroll_set_line(
  p_run_id uuid,
  p_profile_id uuid,
  p_line_id uuid,
  p_category text,
  p_direction text,
  p_label text,
  p_amount_minor bigint,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  v_org uuid:=public.app_org_id();
  v_actor uuid:=auth.uid();
  v_entry uuid;
  v_line uuid;
  v_status text;
begin
  if v_actor is null
     or not public.app_has_capability('payroll.prepare',null)
     or public.app_is_exec() then
    raise exception 'Only Administration with payroll preparation authority can change a draft payroll run.'
      using errcode='42501';
  end if;

  select r.status,e.id into v_status,v_entry
  from hr_private.payroll_runs r
  join hr_private.payroll_entries e on e.run_id=r.id
  where r.id=p_run_id and r.org_id=v_org
    and e.profile_id=p_profile_id and e.org_id=v_org
  for update of r,e;

  if v_entry is null then
    raise exception 'Payroll employee entry not found.' using errcode='42501';
  end if;
  if v_status<>'draft' then
    raise exception 'Only draft payroll runs can be changed.' using errcode='42501';
  end if;

  if p_line_id is not null and p_amount_minor is null then
    delete from hr_private.payroll_entry_lines
    where id=p_line_id and entry_id=v_entry and org_id=v_org;
    if not found then raise exception 'Payroll line not found.' using errcode='42501'; end if;
    v_line:=p_line_id;
  else
    if p_amount_minor is null or p_amount_minor<0
       or nullif(btrim(coalesce(p_label,'')),'') is null then
      raise exception 'Payroll line label and non-negative amount are required.';
    end if;

    if p_category='base_salary' then
      delete from hr_private.payroll_entry_lines
      where entry_id=v_entry and category='base_salary'
        and (p_line_id is null or id<>p_line_id);
    end if;

    if p_line_id is null then
      insert into hr_private.payroll_entry_lines(
        org_id,entry_id,category,direction,label,amount_minor,source,note,created_by
      ) values (
        v_org,v_entry,p_category,p_direction,btrim(p_label),p_amount_minor,
        'manual',nullif(btrim(coalesce(p_note,'')),''),v_actor
      ) returning id into v_line;
    else
      update hr_private.payroll_entry_lines
      set category=p_category,direction=p_direction,label=btrim(p_label),
          amount_minor=p_amount_minor,source='manual',
          note=nullif(btrim(coalesce(p_note,'')),'')
      where id=p_line_id and entry_id=v_entry and org_id=v_org
      returning id into v_line;
      if v_line is null then raise exception 'Payroll line not found.' using errcode='42501'; end if;
    end if;
  end if;

  update hr_private.payroll_entries
  set updated_by=v_actor,updated_at=now()
  where id=v_entry;

  perform hr_private.payroll_recalculate(p_run_id);

  insert into hr_private.audit_events(
    org_id,actor_id,action,resource_type,resource_id,subject_profile_id,reason,detail
  ) values (
    v_org,v_actor,
    case when p_amount_minor is null then 'payroll_line_removed' else 'payroll_line_recorded' end,
    'payroll_line',v_line,p_profile_id,
    nullif(btrim(coalesce(p_note,'')),''),
    jsonb_build_object('run_id',p_run_id,'category',p_category,'direction',p_direction)
  );

  return v_line;
end;
$$;
revoke all on function public.payroll_set_line(uuid,uuid,uuid,text,text,text,bigint,text) from public,anon;
grant execute on function public.payroll_set_line(uuid,uuid,uuid,text,text,text,bigint,text) to authenticated,service_role;

create or replace function public.payroll_submit_run(
  p_run_id uuid,
  p_note text
)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare
  v_org uuid:=public.app_org_id();
  v_actor uuid:=auth.uid();
  v_status text;
begin
  if v_actor is null
     or not public.app_has_capability('payroll.prepare',null)
     or public.app_is_exec() then
    raise exception 'Only Administration with payroll preparation authority can submit payroll.'
      using errcode='42501';
  end if;
  if nullif(btrim(coalesce(p_note,'')),'') is null or length(btrim(p_note))<3 then
    raise exception 'A review note is required before payroll submission.';
  end if;

  select status into v_status
  from hr_private.payroll_runs
  where id=p_run_id and org_id=v_org
  for update;

  if v_status is null then raise exception 'Payroll run not found.' using errcode='42501'; end if;
  if v_status<>'draft' then raise exception 'Only a draft payroll run can be submitted.'; end if;

  perform hr_private.payroll_recalculate(p_run_id);

  if not exists(select 1 from hr_private.payroll_entries e where e.run_id=p_run_id) then
    raise exception 'Payroll cannot be submitted without employee entries.';
  end if;
  if exists(
    select 1 from hr_private.payroll_entries e
    where e.run_id=p_run_id
      and (e.flags ? 'missing_base_salary' or e.flags ? 'negative_net')
  ) then
    raise exception 'Resolve missing base salary or negative net-pay flags before submission.';
  end if;

  update hr_private.payroll_runs
  set status='in_review',submitted_by=v_actor,submitted_at=now(),
      preparation_note=btrim(p_note)
  where id=p_run_id;

  insert into hr_private.audit_events(
    org_id,actor_id,action,resource_type,resource_id,reason,detail
  ) values (
    v_org,v_actor,'payroll_submitted','payroll_run',p_run_id,btrim(p_note),'{}'::jsonb
  );
end;
$$;
revoke all on function public.payroll_submit_run(uuid,text) from public,anon;
grant execute on function public.payroll_submit_run(uuid,text) to authenticated,service_role;

create or replace function public.payroll_approve_run(
  p_run_id uuid,
  p_note text
)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare
  v_org uuid:=public.app_org_id();
  v_actor uuid:=auth.uid();
  v_status text;
  v_prepared_by uuid;
begin
  if v_actor is null
     or not public.app_has_capability('payroll.approve',null)
     or not public.app_is_exec()
     or public.app_has_capability('payroll.prepare',null) then
    raise exception 'Only the Group Pastor/CEO with payroll approval authority can approve payroll.'
      using errcode='42501';
  end if;
  if nullif(btrim(coalesce(p_note,'')),'') is null or length(btrim(p_note))<3 then
    raise exception 'An approval note is required.';
  end if;

  select status,prepared_by into v_status,v_prepared_by
  from hr_private.payroll_runs
  where id=p_run_id and org_id=v_org
  for update;

  if v_status is null then raise exception 'Payroll run not found.' using errcode='42501'; end if;
  if v_status<>'in_review' then raise exception 'Only payroll in review can be approved.'; end if;
  if v_prepared_by=v_actor then
    raise exception 'Payroll preparation and approval must be performed by different people.'
      using errcode='42501';
  end if;

  perform hr_private.payroll_recalculate(p_run_id);
  if exists(
    select 1 from hr_private.payroll_entries e
    where e.run_id=p_run_id
      and (e.flags ? 'missing_base_salary' or e.flags ? 'negative_net')
  ) then
    raise exception 'Payroll still contains blocking employee flags.';
  end if;

  update hr_private.payroll_runs
  set status='approved',approved_by=v_actor,approved_at=now(),
      approval_note=btrim(p_note),locked_at=now()
  where id=p_run_id;

  insert into hr_private.audit_events(
    org_id,actor_id,action,resource_type,resource_id,reason,detail
  ) values (
    v_org,v_actor,'payroll_approved','payroll_run',p_run_id,btrim(p_note),'{}'::jsonb
  );
end;
$$;
revoke all on function public.payroll_approve_run(uuid,text) from public,anon;
grant execute on function public.payroll_approve_run(uuid,text) to authenticated,service_role;

create or replace function public.payroll_create_correction(
  p_source_run_id uuid,
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  v_org uuid:=public.app_org_id();
  v_actor uuid:=auth.uid();
  v_source hr_private.payroll_runs;
  v_new_run uuid;
  v_new_entry uuid;
  v_entry record;
  v_revision integer;
begin
  if v_actor is null
     or not public.app_has_capability('payroll.prepare',null)
     or public.app_is_exec() then
    raise exception 'Only Administration with payroll preparation authority can create a payroll correction.'
      using errcode='42501';
  end if;
  if nullif(btrim(coalesce(p_reason,'')),'') is null or length(btrim(p_reason))<3 then
    raise exception 'A correction reason is required.';
  end if;

  select * into v_source
  from hr_private.payroll_runs
  where id=p_source_run_id and org_id=v_org
  for share;

  if v_source.id is null then raise exception 'Approved payroll run not found.' using errcode='42501'; end if;
  if v_source.status<>'approved' then raise exception 'Corrections can only be created from an approved payroll run.'; end if;
  if exists(
    select 1 from hr_private.payroll_runs r
    where r.correction_of=p_source_run_id and r.status in ('draft','in_review')
  ) then
    raise exception 'An open correction already exists for this approved payroll run.';
  end if;

  select coalesce(max(r.revision),0)+1 into v_revision
  from hr_private.payroll_runs r
  where r.period_id=v_source.period_id;

  insert into hr_private.payroll_runs(
    org_id,period_id,revision,status,correction_of,prepared_by,preparation_note
  ) values (
    v_org,v_source.period_id,v_revision,'draft',p_source_run_id,v_actor,btrim(p_reason)
  ) returning id into v_new_run;

  for v_entry in
    select e.* from hr_private.payroll_entries e
    where e.run_id=p_source_run_id
    order by e.employee_name
  loop
    insert into hr_private.payroll_entries(
      org_id,run_id,profile_id,employee_name,currency,
      compensation_record_id,payment_detail_id,compensation_snapshot,payment_snapshot,
      additions_minor,deductions_minor,net_minor,flags,note,updated_by
    ) values (
      v_org,v_new_run,v_entry.profile_id,v_entry.employee_name,v_entry.currency,
      v_entry.compensation_record_id,v_entry.payment_detail_id,
      v_entry.compensation_snapshot,v_entry.payment_snapshot,
      v_entry.additions_minor,v_entry.deductions_minor,v_entry.net_minor,
      v_entry.flags,v_entry.note,v_actor
    ) returning id into v_new_entry;

    insert into hr_private.payroll_entry_lines(
      org_id,entry_id,category,direction,label,amount_minor,source,note,created_by,created_at
    )
    select v_org,v_new_entry,l.category,l.direction,l.label,l.amount_minor,
           l.source,l.note,v_actor,l.created_at
    from hr_private.payroll_entry_lines l
    where l.entry_id=v_entry.id
    order by l.created_at,l.id;
  end loop;

  perform hr_private.payroll_recalculate(v_new_run);

  insert into hr_private.audit_events(
    org_id,actor_id,action,resource_type,resource_id,reason,detail
  ) values (
    v_org,v_actor,'payroll_correction_created','payroll_run',v_new_run,btrim(p_reason),
    jsonb_build_object('correction_of',p_source_run_id)
  );

  return v_new_run;
end;
$$;
revoke all on function public.payroll_create_correction(uuid,text) from public,anon;
grant execute on function public.payroll_create_correction(uuid,text) to authenticated,service_role;

comment on table hr_private.payroll_periods is
  'Protected payroll periods. Browser roles have no direct access.';
comment on table hr_private.payroll_runs is
  'Protected payroll runs. Approved rows are immutable; corrections use successor runs.';
comment on table hr_private.payroll_entries is
  'Protected per-employee payroll snapshots and calculated totals.';
comment on table hr_private.payroll_entry_lines is
  'Manual-authoritative payroll additions and deductions. No attendance-derived formula is implied.';
