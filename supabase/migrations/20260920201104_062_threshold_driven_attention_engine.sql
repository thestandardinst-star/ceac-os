
-- Threshold-driven deterministic attention engine.
-- Working days are Monday-Friday until CEAC adds an approved holiday calendar.

insert into public.thresholds(org_id,name,label,value,unit_label)
select o.id,'work_gone_quiet','active work has not moved for',3,'working days'
from public.organisations o
on conflict(org_id,name) do nothing;

insert into public.thresholds(org_id,name,label,value,unit_label)
select o.id,'objective_no_activity','an active objective has no supporting work/activity for',10,'working days'
from public.organisations o
on conflict(org_id,name) do nothing;

insert into public.thresholds(org_id,name,label,value,unit_label)
select o.id,'project_end_window','a project is close to its end with open deliverables',7,'days'
from public.organisations o
on conflict(org_id,name) do nothing;

create or replace function public.app_working_days_between(p_from timestamptz,p_to timestamptz)
returns integer
language sql
stable
set search_path=public
as $$
  select case
    when p_from is null or p_to is null or p_to<=p_from then 0
    else coalesce((
      select count(*)::int
      from generate_series(p_from::date + 1,p_to::date,interval '1 day') d
      where extract(isodow from d) between 1 and 5
    ),0)
  end;
$$;

create or replace function public.app_threshold(p_org_id uuid,p_name text,p_default numeric)
returns numeric
language sql
stable
security definer
set search_path=public
as $$
  select coalesce(
    (select t.value from public.thresholds t where t.org_id=p_org_id and t.name=p_name),
    p_default
  );
$$;

revoke all on function public.app_threshold(uuid,text,numeric) from public,anon;
grant execute on function public.app_threshold(uuid,text,numeric) to authenticated,service_role;
grant execute on function public.app_working_days_between(timestamptz,timestamptz) to authenticated,service_role;

create or replace function public.app_check_gone_quiet()
returns integer
language plpgsql
security definer
set search_path=public
as $$
declare affected int:=0;
begin
  update public.alerts a
  set resolved_at=now(),
      resolved_reason='no_longer_applicable'
  from public.work_items w
  where a.kind='gone_quiet'
    and a.subject_type='work_item'
    and a.subject_id=w.id
    and a.resolved_at is null
    and (
      w.status in ('completed','self_certified','cancelled','in_review','waiting_on')
      or w.last_movement_at is null
      or public.app_working_days_between(w.last_movement_at,now())
         < public.app_threshold(w.org_id,'work_gone_quiet',3)
    );

  insert into public.alerts(org_id,kind,subject_type,subject_id,for_profile_id,for_unit_id,message,resolved_at,resolved_reason)
  select w.org_id,'gone_quiet','work_item',w.id,w.assignee_id,w.unit_id,
    'Nothing has moved on '||w.title||' for '
      ||public.app_working_days_between(w.last_movement_at,now())::text||' working days',
    null,null
  from public.work_items w
  where w.status not in ('completed','self_certified','cancelled','waiting_on','in_review')
    and w.last_movement_at is not null
    and public.app_working_days_between(w.last_movement_at,now())
        >= public.app_threshold(w.org_id,'work_gone_quiet',3)
  on conflict(kind,subject_type,subject_id) do update
  set message=excluded.message,for_profile_id=excluded.for_profile_id,
      for_unit_id=excluded.for_unit_id,last_seen_at=now(),
      resolved_at=null,resolved_reason=null;

  get diagnostics affected=row_count;
  return affected;
end;
$$;

create or replace function public.app_check_review_waiting()
returns integer
language plpgsql
security definer
set search_path=public
as $$
declare affected int:=0;
begin
  update public.alerts a
  set resolved_at=now(),resolved_reason='no_longer_in_review'
  from public.work_items w
  where a.kind='review_waiting'
    and a.subject_type='work_item'
    and a.subject_id=w.id
    and a.resolved_at is null
    and w.status<>'in_review';

  insert into public.alerts(org_id,kind,subject_type,subject_id,for_unit_id,message,resolved_at,resolved_reason)
  select w.org_id,'review_waiting','work_item',w.id,w.unit_id,
    w.title||' has waited for review for '
      ||public.app_working_days_between(s.submitted_at,now())::text||' working days',
    null,null
  from public.work_items w
  join lateral (
    select max(s1.submitted_at) submitted_at
    from public.submissions s1
    where s1.work_item_id=w.id
  ) s on s.submitted_at is not null
  where w.status='in_review'
    and public.app_working_days_between(s.submitted_at,now())
        >= public.app_threshold(w.org_id,'review_waiting',5)
  on conflict(kind,subject_type,subject_id) do update
  set message=excluded.message,for_unit_id=excluded.for_unit_id,
      last_seen_at=now(),resolved_at=null,resolved_reason=null;

  get diagnostics affected=row_count;
  return affected;
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
  update public.alerts a
  set resolved_at=now(),
      resolved_reason=case
        when b.state='resolved' then 'blocker_resolved'
        when b.state='disputed' then 'blocker_disputed'
        when b.state='claimed' then 'waiting_for_reply'
        else 'no_longer_applicable'
      end
  from public.blockers b
  where a.kind='blocker_aged'
    and a.subject_type='blocker'
    and a.subject_id=b.id
    and a.resolved_at is null
    and (
      b.state<>'acknowledged'
      or public.app_working_days_between(coalesce(b.responded_at,b.created_at),now())
         < public.app_threshold(b.org_id,'blocker_unanswered',5)
    );

  insert into public.alerts(org_id,kind,subject_type,subject_id,for_unit_id,message,resolved_at,resolved_reason)
  select b.org_id,'blocker_aged','blocker',b.id,w.unit_id,
    'Acknowledged dependency on '||coalesce(u.name,b.party_text)
      ||' has remained unresolved for '
      ||public.app_working_days_between(coalesce(b.responded_at,b.created_at),now())::text
      ||' working days',
    null,null
  from public.blockers b
  join public.work_items w on w.id=b.work_item_id
  left join public.units u on u.id=b.party_unit_id
  where b.state='acknowledged'
    and public.app_working_days_between(coalesce(b.responded_at,b.created_at),now())
        >= public.app_threshold(b.org_id,'blocker_unanswered',5)
  on conflict(kind,subject_type,subject_id) do update
  set message=excluded.message,for_unit_id=excluded.for_unit_id,
      last_seen_at=now(),resolved_at=null,resolved_reason=null;

  get diagnostics affected=row_count;
  return affected;
end;
$$;

create or replace function public.app_check_project_attention()
returns integer
language plpgsql
security definer
set search_path=public
as $$
declare affected int:=0;
begin
  update public.alerts a
  set resolved_at=now(),resolved_reason='project_attention_cleared'
  from public.projects p
  where a.kind='project_open_deliverables_near_end'
    and a.subject_type='project'
    and a.subject_id=p.id
    and a.resolved_at is null
    and (
      p.status<>'active'
      or p.ends_on is null
      or p.ends_on-current_date > public.app_threshold(p.org_id,'project_end_window',7)
      or not exists (
        select 1 from public.work_items w
        where w.project_id=p.id and w.kind='deliverable'
          and w.status not in ('completed','self_certified','cancelled')
      )
    );

  insert into public.alerts(org_id,kind,subject_type,subject_id,for_unit_id,message,resolved_at,resolved_reason)
  select p.org_id,'project_open_deliverables_near_end','project',p.id,p.lead_unit_id,
    p.name||' ends in '||greatest(p.ends_on-current_date,0)::text
      ||' days with '
      ||(select count(*) from public.work_items w where w.project_id=p.id and w.kind='deliverable'
          and w.status not in ('completed','self_certified','cancelled'))::text
      ||' open deliverable(s)',
    null,null
  from public.projects p
  where p.status='active'
    and p.ends_on is not null
    and p.ends_on>=current_date
    and p.ends_on-current_date <= public.app_threshold(p.org_id,'project_end_window',7)
    and exists (
      select 1 from public.work_items w
      where w.project_id=p.id and w.kind='deliverable'
        and w.status not in ('completed','self_certified','cancelled')
    )
  on conflict(kind,subject_type,subject_id) do update
  set message=excluded.message,for_unit_id=excluded.for_unit_id,
      last_seen_at=now(),resolved_at=null,resolved_reason=null;

  get diagnostics affected=row_count;
  return affected;
end;
$$;

create or replace function public.app_check_objective_silence()
returns integer
language plpgsql
security definer
set search_path=public
as $$
declare affected int:=0;
begin
  update public.alerts a
  set resolved_at=now(),resolved_reason='objective_activity_restored'
  from public.objectives o
  where a.kind='objective_no_activity'
    and a.subject_type='objective'
    and a.subject_id=o.id
    and a.resolved_at is null
    and (
      o.status in ('met','partly_met','not_met')
      or exists (
        select 1 from public.work_items w
        where w.objective_id=o.id
          and w.status not in ('completed','self_certified','cancelled')
          and public.app_working_days_between(w.last_movement_at,now())
             < public.app_threshold(o.org_id,'objective_no_activity',10)
      )
    );

  insert into public.alerts(org_id,kind,subject_type,subject_id,for_unit_id,message,resolved_at,resolved_reason)
  select o.org_id,'objective_no_activity','objective',o.id,o.unit_id,
    o.name||' has no active supporting work or recent work movement within '
      ||public.app_threshold(o.org_id,'objective_no_activity',10)::int::text||' working days',
    null,null
  from public.objectives o
  join public.projects p on p.id=o.project_id
  where p.status='active'
    and o.status in ('on_track','at_risk')
    and not exists (
      select 1 from public.work_items w
      where w.objective_id=o.id
        and w.status not in ('completed','self_certified','cancelled')
        and public.app_working_days_between(w.last_movement_at,now())
           < public.app_threshold(o.org_id,'objective_no_activity',10)
    )
    and public.app_working_days_between(o.created_at,now())
        >= public.app_threshold(o.org_id,'objective_no_activity',10)
  on conflict(kind,subject_type,subject_id) do update
  set message=excluded.message,for_unit_id=excluded.for_unit_id,
      last_seen_at=now(),resolved_at=null,resolved_reason=null;

  get diagnostics affected=row_count;
  return affected;
end;
$$;

create or replace function public.app_check_reporting_silence()
returns integer
language plpgsql
security definer
set search_path=public
as $$
declare affected int:=0;
begin
  update public.alerts a
  set resolved_at=now(),resolved_reason='report_filed_or_period_closed'
  where a.kind='unit_report_missing'
    and a.resolved_at is null
    and not exists (
      select 1
      from public.report_periods rp
      cross join public.units u
      where md5(rp.id::text||':'||u.id::text)::uuid=a.subject_id
        and rp.org_id=a.org_id and u.org_id=a.org_id
        and rp.status='open'
        and current_date>=rp.starts_on
        and current_date-rp.starts_on >= public.app_threshold(rp.org_id,'unit_not_reported',14)
        and not exists (
          select 1 from public.reports r
          where r.period_id=rp.id and r.unit_id=u.id
            and r.scope='unit' and r.status in ('submitted','confirmed')
        )
    );

  insert into public.alerts(org_id,kind,subject_type,subject_id,for_unit_id,message,resolved_at,resolved_reason)
  select rp.org_id,'unit_report_missing','unit_report_period',
    md5(rp.id::text||':'||u.id::text)::uuid,u.id,
    u.name||' has not filed the '||rp.label||' unit report after '
      ||(current_date-rp.starts_on)::text||' days',
    null,null
  from public.report_periods rp
  join public.units u on u.org_id=rp.org_id and u.active
  where rp.status='open'
    and current_date>=rp.starts_on
    and current_date-rp.starts_on >= public.app_threshold(rp.org_id,'unit_not_reported',14)
    and not exists (
      select 1 from public.reports r
      where r.period_id=rp.id and r.unit_id=u.id
        and r.scope='unit' and r.status in ('submitted','confirmed')
    )
  on conflict(kind,subject_type,subject_id) do update
  set message=excluded.message,for_unit_id=excluded.for_unit_id,
      last_seen_at=now(),resolved_at=null,resolved_reason=null;

  get diagnostics affected=row_count;
  return affected;
end;
$$;

create or replace function public.app_run_daily()
returns void
language plpgsql
security definer
set search_path=public
as $$
declare
  t0 timestamptz:=now();
  n_quiet int:=0;n_over int:=0;n_block int:=0;n_review int:=0;
  n_project int:=0;n_objective int:=0;n_report int:=0;
begin
  n_quiet:=public.app_check_gone_quiet();
  n_over:=public.app_check_overdue();
  n_block:=public.app_check_blockers();
  n_review:=public.app_check_review_waiting();
  n_project:=public.app_check_project_attention();
  n_objective:=public.app_check_objective_silence();
  n_report:=public.app_check_reporting_silence();

  insert into public.job_runs(job_name,status,detail,duration_ms)
  values('daily_checks','ok',
    jsonb_build_object(
      'gone_quiet',n_quiet,'overdue',n_over,'blockers',n_block,
      'review_waiting',n_review,'project_attention',n_project,
      'objective_silence',n_objective,'reporting_silence',n_report
    ),
    (extract(epoch from now()-t0)*1000)::int);
exception when others then
  insert into public.job_runs(job_name,status,error)
  values('daily_checks','error',sqlerrm);
  raise;
end;
$$;

alter function public.app_check_review_waiting() set search_path=public;
alter function public.app_check_project_attention() set search_path=public;
alter function public.app_check_objective_silence() set search_path=public;
alter function public.app_check_reporting_silence() set search_path=public;

revoke execute on function public.app_check_review_waiting() from public,anon,authenticated;
revoke execute on function public.app_check_project_attention() from public,anon,authenticated;
revoke execute on function public.app_check_objective_silence() from public,anon,authenticated;
revoke execute on function public.app_check_reporting_silence() from public,anon,authenticated;
grant execute on function public.app_check_review_waiting() to service_role;
grant execute on function public.app_check_project_attention() to service_role;
grant execute on function public.app_check_objective_silence() to service_role;
grant execute on function public.app_check_reporting_silence() to service_role;
