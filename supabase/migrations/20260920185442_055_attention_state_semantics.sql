
alter table public.alerts
  add column if not exists resolved_at timestamptz,
  add column if not exists resolved_reason text;

create or replace function public.guard_alert_client_update()
returns trigger
language plpgsql
security invoker
set search_path=public
as $$
begin
  if auth.uid() is null then
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

drop trigger if exists alerts_guard_client_update on public.alerts;
create trigger alerts_guard_client_update
before update on public.alerts
for each row execute function public.guard_alert_client_update();

revoke all on function public.guard_alert_client_update() from public,anon,authenticated;

create or replace function public.app_check_gone_quiet()
returns integer
language plpgsql
security definer
set search_path=public
as $$
declare affected int:=0;
begin
  update alerts a
  set resolved_at=now(),
      resolved_reason=case
        when w.status in ('completed','self_certified','cancelled') then 'work_finished'
        when w.status in ('in_review','waiting_on') then 'waiting_elsewhere'
        when w.last_movement_at >= now()-interval '3 days' then 'work_moved'
        else 'no_longer_applicable'
      end
  from work_items w
  where a.kind='gone_quiet'
    and a.subject_type='work_item'
    and a.subject_id=w.id
    and a.resolved_at is null
    and (
      w.status in ('completed','self_certified','cancelled','in_review','waiting_on')
      or w.last_movement_at is null
      or w.last_movement_at >= now()-interval '3 days'
    );

  insert into alerts(org_id,kind,subject_type,subject_id,for_profile_id,for_unit_id,message,resolved_at,resolved_reason)
  select w.org_id,'gone_quiet','work_item',w.id,w.assignee_id,w.unit_id,
    'Nothing has moved on '||w.title||' since '||to_char(w.last_movement_at,'DD Mon'),
    null,null
  from work_items w
  where w.status not in ('completed','self_certified','cancelled','waiting_on','in_review')
    and w.last_movement_at is not null
    and w.last_movement_at < now()-interval '3 days'
  on conflict(kind,subject_type,subject_id) do update
    set message=excluded.message,
        for_profile_id=excluded.for_profile_id,
        for_unit_id=excluded.for_unit_id,
        last_seen_at=now(),
        resolved_at=null,
        resolved_reason=null;

  get diagnostics affected=row_count;
  return affected;
end;
$$;

create or replace function public.app_check_overdue()
returns integer
language plpgsql
security definer
set search_path=public
as $$
declare a1 int:=0; a2 int:=0;
begin
  update alerts a
  set resolved_at=now(),
      resolved_reason=case
        when w.status in ('completed','self_certified','cancelled') then 'work_finished'
        when w.status in ('in_review','waiting_on') then 'waiting_elsewhere'
        when w.due_at is null or w.due_at >= now()-interval '1 day' then 'not_overdue'
        else 'no_longer_applicable'
      end
  from work_items w
  where a.kind in ('overdue_first','overdue_second')
    and a.subject_type='work_item'
    and a.subject_id=w.id
    and a.resolved_at is null
    and (
      w.status in ('completed','self_certified','cancelled','in_review','waiting_on')
      or w.due_at is null
      or w.due_at >= now()-interval '1 day'
    );

  insert into alerts(org_id,kind,subject_type,subject_id,for_profile_id,message,resolved_at,resolved_reason)
  select w.org_id,'overdue_first','work_item',w.id,w.assignee_id,
    w.title||' — due date passed on '||to_char(w.due_at,'DD Mon'),null,null
  from work_items w
  where w.status not in ('completed','self_certified','cancelled','waiting_on','in_review')
    and w.due_at is not null
    and w.due_at < now()-interval '1 day'
  on conflict(kind,subject_type,subject_id) do update
    set message=excluded.message,
        for_profile_id=excluded.for_profile_id,
        last_seen_at=now(),
        resolved_at=null,
        resolved_reason=null;
  get diagnostics a1=row_count;

  insert into alerts(org_id,kind,subject_type,subject_id,for_unit_id,message,resolved_at,resolved_reason)
  select w.org_id,'overdue_second','work_item',w.id,w.unit_id,
    coalesce((select full_name from profiles where id=w.assignee_id),'Someone')
      ||': '||w.title||' — '||extract(day from now()-w.due_at)::text||' days late',
    null,null
  from work_items w
  where w.status not in ('completed','self_certified','cancelled','waiting_on','in_review')
    and w.due_at is not null
    and w.due_at < now()-interval '3 days'
  on conflict(kind,subject_type,subject_id) do update
    set message=excluded.message,
        for_unit_id=excluded.for_unit_id,
        last_seen_at=now(),
        resolved_at=null,
        resolved_reason=null;
  get diagnostics a2=row_count;

  return a1+a2;
end;
$$;

create or replace function public.app_check_blockers()
returns integer
language plpgsql
security definer
set search_path=public
as $$
declare affected int:=0;
begin
  update alerts a
  set resolved_at=now(),
      resolved_reason=case
        when b.state='resolved' then 'blocker_resolved'
        when b.state='acknowledged' then 'blocker_answered'
        when b.state='disputed' then 'blocker_disputed'
        else 'no_longer_waiting_for_reply'
      end
  from blockers b
  where a.kind='blocker_no_response'
    and a.subject_type='blocker'
    and a.subject_id=b.id
    and a.resolved_at is null
    and b.state<>'claimed';

  insert into alerts(org_id,kind,subject_type,subject_id,for_unit_id,message,resolved_at,resolved_reason)
  select b.org_id,'blocker_no_response','blocker',b.id,b.party_unit_id,
    'You have not answered a request from '
      ||coalesce((select u.name from units u join work_items w on w.unit_id=u.id where w.id=b.work_item_id),'another unit')
      ||' since '||to_char(b.since,'DD Mon'),
    null,null
  from blockers b
  where b.state='claimed'
    and b.since < now()-interval '2 days'
    and b.party_unit_id is not null
  on conflict(kind,subject_type,subject_id) do update
    set for_unit_id=excluded.for_unit_id,
        message=excluded.message,
        last_seen_at=now(),
        resolved_at=null,
        resolved_reason=null;
  get diagnostics affected=row_count;
  return affected;
end;
$$;

revoke all on function public.app_check_gone_quiet() from public,anon,authenticated;
revoke all on function public.app_check_overdue() from public,anon,authenticated;
revoke all on function public.app_check_blockers() from public,anon,authenticated;
grant execute on function public.app_check_gone_quiet() to service_role;
grant execute on function public.app_check_overdue() to service_role;
grant execute on function public.app_check_blockers() to service_role;

update alerts a
set resolved_at=now(),
    resolved_reason=case
      when w.status in ('completed','self_certified','cancelled') then 'work_finished'
      when w.status in ('in_review','waiting_on') then 'waiting_elsewhere'
      when a.kind='gone_quiet' and w.last_movement_at>=now()-interval '3 days' then 'work_moved'
      when a.kind in ('overdue_first','overdue_second') and (w.due_at is null or w.due_at>=now()-interval '1 day') then 'not_overdue'
      else 'no_longer_applicable'
    end
from work_items w
where a.subject_type='work_item'
  and a.subject_id=w.id
  and a.kind in ('gone_quiet','overdue_first','overdue_second')
  and a.resolved_at is null
  and (
    w.status in ('completed','self_certified','cancelled','in_review','waiting_on')
    or (a.kind='gone_quiet' and w.last_movement_at>=now()-interval '3 days')
    or (a.kind in ('overdue_first','overdue_second') and (w.due_at is null or w.due_at>=now()-interval '1 day'))
  );

update alerts a
set resolved_at=now(),
    resolved_reason=case b.state
      when 'resolved' then 'blocker_resolved'
      when 'acknowledged' then 'blocker_answered'
      when 'disputed' then 'blocker_disputed'
      else 'no_longer_waiting_for_reply'
    end
from blockers b
where a.kind='blocker_no_response'
  and a.subject_type='blocker'
  and a.subject_id=b.id
  and a.resolved_at is null
  and b.state<>'claimed';
