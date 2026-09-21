
create table if not exists public.blocker_followups (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete cascade,
  blocker_id uuid not null references public.blockers(id) on delete cascade,
  actor_id uuid not null references public.profiles(id) on delete cascade,
  sequence smallint not null check (sequence in (1,2)),
  created_at timestamptz not null default now(),
  unique(blocker_id,sequence)
);

alter table public.blocker_followups enable row level security;

drop policy if exists blocker_followups_read on public.blocker_followups;
create policy blocker_followups_read on public.blocker_followups
for select
using (
  org_id=public.app_org_id()
  and (
    actor_id=auth.uid()
    or exists (
      select 1 from public.blockers b
      join public.work_items w on w.id=b.work_item_id
      where b.id=blocker_id
        and public.app_can_see_item(w.id)
    )
    or public.app_is_admin()
    or public.app_is_exec()
  )
);

create or replace function public.follow_up_blocker(
  p_blocker_id uuid
)
returns public.blocker_followups
language plpgsql
security definer
set search_path=public
as $$
declare
  b public.blockers;
  w public.work_items;
  v_count integer;
  v_next integer;
  v_anchor timestamptz;
  v_followup public.blocker_followups;
  v_name text;
begin
  if auth.uid() is null then
    raise exception 'Sign in to follow up on a dependency.' using errcode='42501';
  end if;

  select * into b
  from public.blockers
  where id=p_blocker_id
  for update;

  if b.id is null then raise exception 'That dependency does not exist.'; end if;
  if b.org_id<>public.app_org_id() or b.claimed_by<>auth.uid() then
    raise exception 'You can only follow up on a dependency you raised.' using errcode='42501';
  end if;
  if b.party_unit_id is null then
    raise exception 'This dependency does not have a CEAC unit to notify.';
  end if;
  if b.state not in ('claimed','acknowledged') then
    raise exception 'This dependency is no longer waiting for follow-up.';
  end if;

  select * into w from public.work_items where id=b.work_item_id;
  if w.id is null then raise exception 'The related work item does not exist.'; end if;

  select count(*) into v_count
  from public.blocker_followups
  where blocker_id=b.id;

  if v_count>=2 then
    raise exception 'The available follow-ups have already been sent.';
  end if;

  v_next:=v_count+1;
  v_anchor:=coalesce(b.responded_at,b.created_at);

  if v_next=1 and now()<v_anchor+interval '1 day' then
    raise exception 'The first follow-up becomes available one day after the latest dependency response or claim.';
  end if;
  if v_next=2 and now()<v_anchor+interval '3 days' then
    raise exception 'The second follow-up becomes available three days after the latest dependency response or claim.';
  end if;

  insert into public.blocker_followups(org_id,blocker_id,actor_id,sequence)
  values(b.org_id,b.id,auth.uid(),v_next)
  returning * into v_followup;

  select full_name into v_name from public.profiles where id=auth.uid();

  perform set_config('ceac.alert_system_update','on',true);
  insert into public.alerts(
    org_id,kind,subject_type,subject_id,for_unit_id,message,
    acknowledged_at,acknowledged_by,resolved_at,resolved_reason
  )
  values(
    b.org_id,'blocker_followup','blocker',b.id,b.party_unit_id,
    coalesce(v_name,'A team member')||' followed up on a dependency for '||w.title||'.',
    null,null,null,null
  )
  on conflict(kind,subject_type,subject_id) do update
  set for_unit_id=excluded.for_unit_id,
      message=excluded.message,
      last_seen_at=now(),
      acknowledged_at=null,
      acknowledged_by=null,
      resolved_at=null,
      resolved_reason=null;

  insert into public.activity_events(org_id,actor_id,verb,object_type,object_id,meta)
  values(
    b.org_id,auth.uid(),'blocker_followed_up','blocker',b.id,
    jsonb_build_object('sequence',v_next,'work_item_id',b.work_item_id)
  );

  return v_followup;
end;
$$;

revoke all on function public.follow_up_blocker(uuid) from public,anon;
grant execute on function public.follow_up_blocker(uuid) to authenticated,service_role;

create or replace function public.resolve_blocker_followup_alert()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  if old.state is distinct from new.state
     and new.state in ('resolved','disputed') then
    perform set_config('ceac.alert_system_update','on',true);
    update public.alerts
    set resolved_at=now(),
        resolved_reason=case when new.state='resolved' then 'blocker_resolved' else 'blocker_disputed' end
    where kind='blocker_followup'
      and subject_type='blocker'
      and subject_id=new.id
      and resolved_at is null;
  end if;
  return new;
end;
$$;

drop trigger if exists blockers_resolve_followup_alert on public.blockers;
create trigger blockers_resolve_followup_alert
after update of state on public.blockers
for each row execute function public.resolve_blocker_followup_alert();

revoke all on function public.resolve_blocker_followup_alert() from public,anon,authenticated;
