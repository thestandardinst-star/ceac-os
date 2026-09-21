
create table if not exists public.work_followups (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete cascade,
  work_item_id uuid not null references public.work_items(id) on delete cascade,
  actor_id uuid not null references public.profiles(id) on delete cascade,
  sequence smallint not null check (sequence in (1,2)),
  created_at timestamptz not null default now(),
  unique(work_item_id,sequence)
);

alter table public.work_followups enable row level security;

drop policy if exists work_followups_read on public.work_followups;
create policy work_followups_read on public.work_followups
for select
using (
  org_id=public.app_org_id()
  and (
    actor_id=auth.uid()
    or public.app_can_review_item(work_item_id)
    or public.app_is_admin()
    or public.app_is_exec()
  )
);

create or replace function public.guard_alert_client_update()
returns trigger
language plpgsql
security invoker
set search_path=public
as $$
begin
  if auth.uid() is null
     or coalesce(current_setting('ceac.alert_system_update',true),'')='on' then
    return new;
  end if;

  if new.id is distinct from old.id
     or new.org_id is distinct from old.org_id
     or new.kind is distinct from old.kind
     or new.subject_type is distinct from old.subject_type
     or new.subject_id is distinct from old.subject_id
     or new.for_profile_id is distinct from old.for_profile_id
     or new.for_unit_id is distinct from old.for_unit_id
     or new.message is distinct from old.message
     or new.first_seen_at is distinct from old.first_seen_at
     or new.last_seen_at is distinct from old.last_seen_at
     or new.resolved_at is distinct from old.resolved_at
     or new.resolved_reason is distinct from old.resolved_reason then
    raise exception 'Only acknowledgement can be changed directly on an alert.'
      using errcode='42501';
  end if;

  if new.acknowledged_at is distinct from old.acknowledged_at
     or new.acknowledged_by is distinct from old.acknowledged_by then
    if new.acknowledged_at is null or new.acknowledged_by<>auth.uid() then
      raise exception 'You can only acknowledge an alert as yourself.'
        using errcode='42501';
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.follow_up_work_review(
  p_work_item_id uuid
)
returns public.work_followups
language plpgsql
security definer
set search_path=public
as $$
declare
  w public.work_items;
  s public.submissions;
  v_count integer;
  v_next integer;
  v_followup public.work_followups;
  v_name text;
begin
  if auth.uid() is null then
    raise exception 'Sign in to follow up on work.' using errcode='42501';
  end if;

  select * into w
  from public.work_items
  where id=p_work_item_id
  for update;

  if w.id is null then raise exception 'That work item does not exist.'; end if;
  if w.org_id<>public.app_org_id() or w.assignee_id<>auth.uid() then
    raise exception 'You can only follow up on your own submitted work.' using errcode='42501';
  end if;
  if w.status<>'in_review' then
    raise exception 'This work is no longer waiting for review.';
  end if;
  if w.kind not in ('task','meeting_outcome','deliverable') then
    raise exception 'This work type does not use the review follow-up path.';
  end if;

  select * into s
  from public.submissions
  where work_item_id=w.id
  order by submitted_at desc,id desc
  limit 1;

  if s.id is null then raise exception 'No submitted work was found.'; end if;

  select count(*) into v_count
  from public.work_followups
  where work_item_id=w.id;

  if v_count>=2 then
    raise exception 'The available follow-ups have already been sent.';
  end if;

  v_next:=v_count+1;

  if v_next=1 and now()<s.submitted_at+interval '1 day' then
    raise exception 'The first follow-up becomes available one day after submission.';
  end if;
  if v_next=2 and now()<s.submitted_at+interval '3 days' then
    raise exception 'The second follow-up becomes available three days after submission.';
  end if;

  insert into public.work_followups(org_id,work_item_id,actor_id,sequence)
  values(w.org_id,w.id,auth.uid(),v_next)
  returning * into v_followup;

  select full_name into v_name from public.profiles where id=auth.uid();

  perform set_config('ceac.alert_system_update','on',true);
  insert into public.alerts(
    org_id,kind,subject_type,subject_id,for_unit_id,message,
    acknowledged_at,acknowledged_by,resolved_at,resolved_reason
  )
  values(
    w.org_id,'review_followup','work_item',w.id,w.unit_id,
    coalesce(v_name,'A team member')||' followed up on '||w.title||' review.',
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
    w.org_id,auth.uid(),'review_followed_up','work_item',w.id,
    jsonb_build_object('sequence',v_next,'submission_id',s.id)
  );

  return v_followup;
end;
$$;

revoke all on function public.follow_up_work_review(uuid) from public,anon;
grant execute on function public.follow_up_work_review(uuid) to authenticated,service_role;

create or replace function public.resolve_review_followup_alert()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  if old.status='in_review' and new.status<>'in_review' then
    perform set_config('ceac.alert_system_update','on',true);
    update public.alerts
    set resolved_at=now(),
        resolved_reason='review_finished'
    where kind='review_followup'
      and subject_type='work_item'
      and subject_id=new.id
      and resolved_at is null;
  end if;
  return new;
end;
$$;

drop trigger if exists work_items_resolve_review_followup on public.work_items;
create trigger work_items_resolve_review_followup
after update of status on public.work_items
for each row execute function public.resolve_review_followup_alert();

revoke all on function public.resolve_review_followup_alert() from public,anon,authenticated;
