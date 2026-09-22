-- 080 — Stage 1F: versioned organisation policy/rules engine.

insert into public.platform_event_definitions(
  event_type,label,description,source_domain,payload_version
) values (
  'policy.rule_changed',
  'Policy rule changed',
  'An organisation policy/rule version was recorded.',
  'policy',
  1
)
on conflict(event_type) do nothing;

create table public.policy_rule_definitions (
  rule_key text primary key,
  domain text not null,
  label text not null,
  description text not null,
  value_type text not null check (value_type in ('integer','numeric','boolean','text')),
  min_numeric numeric,
  max_numeric numeric,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  check (min_numeric is null or max_numeric is null or min_numeric<=max_numeric)
);

insert into public.policy_rule_definitions(
  rule_key,domain,label,description,value_type,min_numeric,max_numeric
) values
  ('attendance.grace_minutes','attendance','Attendance grace minutes',
   'Minutes allowed after a scheduled start before lateness rules may apply.','integer',0,180),
  ('attendance.late_after_minutes','attendance','Late after minutes',
   'Minutes after scheduled start at which a recorded attendance is classified late.','integer',0,360),
  ('work.quiet_days','work','Work quiet days',
   'Working days without movement before active work is considered quiet.','integer',1,90),
  ('reporting.overdue_days','reporting','Reporting overdue days',
   'Days after a due date before a required report is treated as overdue.','integer',0,90),
  ('leave.manager_approval_limit','leave','Manager approval limit',
   'Maximum leave days a manager may approve without higher review.','integer',0,90),
  ('performance.review_cycle_months','performance','Performance review cycle',
   'Months between configured formal performance review cycles.','integer',1,24)
on conflict(rule_key) do nothing;

create table public.policy_rule_versions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete restrict,
  rule_key text not null references public.policy_rule_definitions(rule_key) on delete restrict,
  value jsonb not null,
  effective_on date not null,
  reason text not null check (length(btrim(reason)) between 3 and 600),
  recorded_by uuid not null references public.profiles(id) on delete restrict,
  recorded_at timestamptz not null default now()
);

create index policy_rule_versions_current_idx
  on public.policy_rule_versions(org_id,rule_key,effective_on desc,recorded_at desc);
create index policy_rule_versions_org_idx
  on public.policy_rule_versions(org_id,recorded_at desc);

alter table public.policy_rule_definitions enable row level security;
alter table public.policy_rule_versions enable row level security;

revoke all on public.policy_rule_definitions from anon;
revoke all on public.policy_rule_versions from anon;
revoke insert,update,delete on public.policy_rule_definitions from authenticated;
revoke update,delete on public.policy_rule_versions from authenticated;
grant select on public.policy_rule_definitions to authenticated;
grant select,insert on public.policy_rule_versions to authenticated;

create policy policy_rule_definitions_read
on public.policy_rule_definitions
for select
to authenticated
using (active);

create policy policy_rule_versions_read
on public.policy_rule_versions
for select
to authenticated
using (org_id=public.app_org_id());

create policy policy_rule_versions_insert
on public.policy_rule_versions
for insert
to authenticated
with check (
  org_id=public.app_org_id()
  and recorded_by=auth.uid()
  and public.app_has_capability('authority.manage',null)
);

create or replace function public.validate_policy_rule_version()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  v_def public.policy_rule_definitions;
  v_number numeric;
begin
  select * into v_def
  from public.policy_rule_definitions
  where rule_key=new.rule_key and active;

  if v_def.rule_key is null then
    raise exception 'Unknown or inactive policy rule.';
  end if;

  if new.recorded_by is distinct from auth.uid() and auth.role()<>'service_role' then
    raise exception 'Policy rule recorder must be the signed-in actor.' using errcode='42501';
  end if;

  if v_def.value_type='integer' then
    if jsonb_typeof(new.value)<>'number'
       or (new.value #>> '{}') !~ '^-?[0-9]+$' then
      raise exception 'Policy rule % requires an integer value.',new.rule_key;
    end if;
    v_number:=(new.value #>> '{}')::numeric;
  elsif v_def.value_type='numeric' then
    if jsonb_typeof(new.value)<>'number' then
      raise exception 'Policy rule % requires a numeric value.',new.rule_key;
    end if;
    v_number:=(new.value #>> '{}')::numeric;
  elsif v_def.value_type='boolean' then
    if jsonb_typeof(new.value)<>'boolean' then
      raise exception 'Policy rule % requires a boolean value.',new.rule_key;
    end if;
  elsif v_def.value_type='text' then
    if jsonb_typeof(new.value)<>'string'
       or length(btrim(new.value #>> '{}'))=0 then
      raise exception 'Policy rule % requires a non-empty text value.',new.rule_key;
    end if;
  end if;

  if v_number is not null and v_def.min_numeric is not null and v_number<v_def.min_numeric then
    raise exception 'Policy rule % cannot be below %.',new.rule_key,v_def.min_numeric;
  end if;
  if v_number is not null and v_def.max_numeric is not null and v_number>v_def.max_numeric then
    raise exception 'Policy rule % cannot exceed %.',new.rule_key,v_def.max_numeric;
  end if;

  return new;
end;
$$;

revoke all on function public.validate_policy_rule_version() from public,anon,authenticated;

create trigger policy_rule_versions_validate
before insert on public.policy_rule_versions
for each row execute function public.validate_policy_rule_version();

create or replace function public.policy_rule_version_immutable()
returns trigger
language plpgsql
security invoker
set search_path=public
as $$
begin
  raise exception 'Policy rule history is append-only.' using errcode='42501';
end;
$$;

revoke all on function public.policy_rule_version_immutable() from public,anon,authenticated;

create trigger policy_rule_versions_immutable
before update or delete on public.policy_rule_versions
for each row execute function public.policy_rule_version_immutable();

create trigger audit_policy_rule_versions
after insert on public.policy_rule_versions
for each row execute function public.platform_audit_capture('policy_rule_version','id','recorded_by');

create or replace function public.policy_rule_event_bridge()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  perform public.platform_emit_event(
    new.org_id,
    'policy.rule_changed',
    new.recorded_by,
    null,
    'policy_rule',
    new.id,
    jsonb_build_object(
      'rule_key',new.rule_key,
      'effective_on',new.effective_on
    ),
    'policy-rule:'||new.id::text,
    null,
    null,
    new.recorded_at
  );
  return new;
end;
$$;

revoke all on function public.policy_rule_event_bridge() from public,anon,authenticated;

create trigger policy_rule_versions_emit_event
after insert on public.policy_rule_versions
for each row execute function public.policy_rule_event_bridge();
