
create or replace function public.app_check_project_silence()
returns integer
language plpgsql
security definer
set search_path=public
as $$
declare affected int:=0;
begin
  update public.alerts a
  set resolved_at=now(),resolved_reason='project_activity_restored'
  from public.projects p
  where a.kind='project_no_movement'
    and a.subject_type='project'
    and a.subject_id=p.id
    and a.resolved_at is null
    and (
      p.status<>'active'
      or extract(epoch from (now()-coalesce(
          (select max(w.last_movement_at) from public.work_items w where w.project_id=p.id),
          p.created_at
        )))/604800 < public.app_threshold(p.org_id,'project_no_movement',6)
    );

  insert into public.alerts(org_id,kind,subject_type,subject_id,for_unit_id,message,resolved_at,resolved_reason)
  select p.org_id,'project_no_movement','project',p.id,p.lead_unit_id,
    p.name||' has recorded no work movement for '
      ||floor(extract(epoch from (now()-coalesce(
          (select max(w.last_movement_at) from public.work_items w where w.project_id=p.id),
          p.created_at
        )))/604800)::int::text||' weeks',
    null,null
  from public.projects p
  where p.status='active'
    and extract(epoch from (now()-coalesce(
          (select max(w.last_movement_at) from public.work_items w where w.project_id=p.id),
          p.created_at
        )))/604800 >= public.app_threshold(p.org_id,'project_no_movement',6)
  on conflict(kind,subject_type,subject_id) do update
  set message=excluded.message,for_unit_id=excluded.for_unit_id,last_seen_at=now(),
      resolved_at=null,resolved_reason=null;

  get diagnostics affected=row_count;
  return affected;
end;
$$;

create or replace function public.app_check_falling_targets()
returns integer
language plpgsql
security definer
set search_path=public
as $$
declare affected int:=0; affected2 int:=0;
begin
  update public.alerts a
  set resolved_at=now(),resolved_reason='falling_pattern_cleared'
  where a.kind in ('target_falling_periods','target_below_last_year')
    and a.subject_type='report_target'
    and a.resolved_at is null;

  with comparable as (
    select
      rt.id as target_id,r.org_id,r.unit_id,r.profile_id,r.project_id,r.scope,
      lower(btrim(rt.name)) as target_name,coalesce(rt.target_unit,'') as target_unit,
      rt.name as display_name,rt.achieved_value,rp.starts_on,
      row_number() over(
        partition by r.org_id,r.scope,coalesce(r.unit_id,'00000000-0000-0000-0000-000000000000'::uuid),
          coalesce(r.profile_id,'00000000-0000-0000-0000-000000000000'::uuid),
          coalesce(r.project_id,'00000000-0000-0000-0000-000000000000'::uuid),
          lower(btrim(rt.name)),coalesce(rt.target_unit,'')
        order by rp.starts_on desc,r.version desc
      ) rn
    from public.report_targets rt
    join public.reports r on r.id=rt.report_id and r.status in ('submitted','confirmed')
    join public.report_periods rp on rp.id=r.period_id
    where rt.achieved_value is not null
  ),
  latest as (
    select c.* from comparable c where c.rn=1
  ),
  qualifying as (
    select l.*,public.app_threshold(l.org_id,'falling_periods',3)::int as needed
    from latest l
    where public.app_threshold(l.org_id,'falling_periods',3)>=2
      and (
        select count(*) from comparable c2
        where c2.org_id=l.org_id
          and c2.scope=l.scope
          and c2.unit_id is not distinct from l.unit_id
          and c2.profile_id is not distinct from l.profile_id
          and c2.project_id is not distinct from l.project_id
          and c2.target_name=l.target_name
          and c2.target_unit=l.target_unit
          and c2.rn<=public.app_threshold(l.org_id,'falling_periods',3)
      ) >= public.app_threshold(l.org_id,'falling_periods',3)
      and not exists (
        select 1
        from comparable newer
        join comparable older
          on older.org_id=newer.org_id
         and older.scope=newer.scope
         and older.unit_id is not distinct from newer.unit_id
         and older.profile_id is not distinct from newer.profile_id
         and older.project_id is not distinct from newer.project_id
         and older.target_name=newer.target_name
         and older.target_unit=newer.target_unit
         and older.rn=newer.rn+1
        where newer.org_id=l.org_id
          and newer.scope=l.scope
          and newer.unit_id is not distinct from l.unit_id
          and newer.profile_id is not distinct from l.profile_id
          and newer.project_id is not distinct from l.project_id
          and newer.target_name=l.target_name
          and newer.target_unit=l.target_unit
          and newer.rn<public.app_threshold(l.org_id,'falling_periods',3)
          and newer.achieved_value>=older.achieved_value
      )
  )
  insert into public.alerts(org_id,kind,subject_type,subject_id,for_unit_id,message,resolved_at,resolved_reason)
  select q.org_id,'target_falling_periods','report_target',q.target_id,q.unit_id,
    q.display_name||' has fallen across the latest '||q.needed::text||' reported periods',
    null,null
  from qualifying q
  on conflict(kind,subject_type,subject_id) do update
  set message=excluded.message,for_unit_id=excluded.for_unit_id,last_seen_at=now(),
      resolved_at=null,resolved_reason=null;

  get diagnostics affected=row_count;

  with current_targets as (
    select rt.id as target_id,r.org_id,r.unit_id,r.profile_id,r.project_id,r.scope,
           lower(btrim(rt.name)) target_name,coalesce(rt.target_unit,'') target_unit,
           rt.name display_name,rt.achieved_value,rp.starts_on
    from public.report_targets rt
    join public.reports r on r.id=rt.report_id and r.status in ('submitted','confirmed')
    join public.report_periods rp on rp.id=r.period_id
    where rt.achieved_value is not null
  ),
  latest as (
    select distinct on(org_id,scope,unit_id,profile_id,project_id,target_name,target_unit) *
    from current_targets
    order by org_id,scope,unit_id,profile_id,project_id,target_name,target_unit,starts_on desc
  ),
  year_pairs as (
    select l.*,prior.achieved_value prior_value
    from latest l
    join current_targets prior
      on prior.org_id=l.org_id
     and prior.scope=l.scope
     and prior.unit_id is not distinct from l.unit_id
     and prior.profile_id is not distinct from l.profile_id
     and prior.project_id is not distinct from l.project_id
     and prior.target_name=l.target_name
     and prior.target_unit=l.target_unit
     and prior.starts_on=(l.starts_on-interval '1 year')::date
    where prior.achieved_value<>0
      and ((prior.achieved_value-l.achieved_value)/abs(prior.achieved_value))*100
          >= public.app_threshold(l.org_id,'falling_vs_last_year',20)
  )
  insert into public.alerts(org_id,kind,subject_type,subject_id,for_unit_id,message,resolved_at,resolved_reason)
  select y.org_id,'target_below_last_year','report_target',y.target_id,y.unit_id,
    y.display_name||' is '
      ||round(((y.prior_value-y.achieved_value)/abs(y.prior_value))*100,1)::text
      ||'% below the same reported period last year',
    null,null
  from year_pairs y
  on conflict(kind,subject_type,subject_id) do update
  set message=excluded.message,for_unit_id=excluded.for_unit_id,last_seen_at=now(),
      resolved_at=null,resolved_reason=null;

  get diagnostics affected2=row_count;
  return affected+affected2;
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
  n_project int:=0;n_project_silence int:=0;n_objective int:=0;n_report int:=0;n_falling int:=0;
begin
  n_quiet:=public.app_check_gone_quiet();
  n_over:=public.app_check_overdue();
  n_block:=public.app_check_blockers();
  n_review:=public.app_check_review_waiting();
  n_project:=public.app_check_project_attention();
  n_project_silence:=public.app_check_project_silence();
  n_objective:=public.app_check_objective_silence();
  n_report:=public.app_check_reporting_silence();
  n_falling:=public.app_check_falling_targets();

  insert into public.job_runs(job_name,status,detail,duration_ms)
  values('daily_checks','ok',
    jsonb_build_object(
      'gone_quiet',n_quiet,'overdue',n_over,'blockers',n_block,
      'review_waiting',n_review,'project_attention',n_project,
      'project_silence',n_project_silence,'objective_silence',n_objective,
      'reporting_silence',n_report,'falling',n_falling
    ),
    (extract(epoch from now()-t0)*1000)::int);
exception when others then
  insert into public.job_runs(job_name,status,error)
  values('daily_checks','error',sqlerrm);
  raise;
end;
$$;

alter function public.app_check_project_silence() set search_path=public;
alter function public.app_check_falling_targets() set search_path=public;
revoke execute on function public.app_check_project_silence() from public,anon,authenticated;
revoke execute on function public.app_check_falling_targets() from public,anon,authenticated;
grant execute on function public.app_check_project_silence() to service_role;
grant execute on function public.app_check_falling_targets() to service_role;
