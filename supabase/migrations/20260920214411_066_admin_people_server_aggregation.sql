
-- Server-side Administration People aggregation.
-- Prevents the People screen from downloading organisation-wide work/session/leave tables.

create or replace function public.admin_people_summary()
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_org uuid:=public.app_org_id();
  v_today date:=current_date;
  v_month_start date:=date_trunc('month',current_date)::date;
  v_year int:=extract(year from current_date)::int;
begin
  if auth.uid() is null or not public.app_is_admin() then
    raise exception 'Only Administration & HR can view organisation People summaries.'
      using errcode='42501';
  end if;

  return coalesce((
    select jsonb_agg(to_jsonb(x) order by x.full_name)
    from (
      select
        p.id,p.full_name,p.email,p.job_title,p.phone,p.started_on,p.contract_type,
        p.active,p.birthday,p.is_admin,p.is_exec,
        um.unit_id,u.name as unit_name,um.role,
        coalesce(w.done_count,0) as done_count,
        coalesce(w.assigned_done_count,0) as assigned_done_count,
        coalesce(w.self_done_count,0) as self_done_count,
        coalesce(w.on_time_count,0) as on_time_count,
        coalesce(w.first_time_count,0) as first_time_count,
        coalesce(w.open_count,0) as open_count,
        coalesce(s.days_this_month,0) as days_this_month,
        s.avg_start_minutes,
        coalesce(l.on_leave_now,false) as on_leave_now,
        coalesce(l.leave_count,0) as leave_count,
        lb.annual_taken,lb.sick_taken,lb.carryover_from_last_year,
        sub.last_submission,
        (sub.last_submission is null or sub.last_submission < now()-interval '14 days') as quiet
      from public.profiles p
      left join lateral (
        select um1.unit_id,um1.role
        from public.unit_memberships um1
        where um1.profile_id=p.id and um1.org_id=v_org
        order by case when um1.role='manager' then 0 else 1 end,um1.created_at
        limit 1
      ) um on true
      left join public.units u on u.id=um.unit_id
      left join lateral (
        select
          count(*) filter(where wi.status in ('completed','self_certified') and wi.kind in ('task','deliverable'))::int done_count,
          count(*) filter(where wi.status in ('completed','self_certified') and wi.kind in ('task','deliverable') and wi.origin='assigned')::int assigned_done_count,
          count(*) filter(where wi.status in ('completed','self_certified') and wi.kind in ('task','deliverable') and wi.origin='self_created')::int self_done_count,
          count(*) filter(where wi.status in ('completed','self_certified') and wi.kind in ('task','deliverable') and wi.due_at is not null and wi.completed_at<=wi.due_at)::int on_time_count,
          count(*) filter(where wi.status in ('completed','self_certified') and wi.kind in ('task','deliverable') and wi.first_time_approved is true)::int first_time_count,
          count(*) filter(where wi.status not in ('completed','self_certified','cancelled'))::int open_count
        from public.work_items wi
        where wi.assignee_id=p.id and wi.visibility<>'private'
      ) w on true
      left join lateral (
        select
          count(distinct ws.started_at::date) filter(where ws.started_at>=v_month_start)::int days_this_month,
          round(avg(extract(hour from ws.started_at)*60+extract(minute from ws.started_at)))::int avg_start_minutes
        from public.work_sessions ws
        where ws.profile_id=p.id
      ) s on true
      left join lateral (
        select
          bool_or(lr.status='approved' and lr.start_date<=v_today and lr.end_date>=v_today) as on_leave_now,
          count(*)::int leave_count
        from public.leave_requests lr
        where lr.profile_id=p.id
      ) l on true
      left join public.leave_balances lb on lb.profile_id=p.id and lb.year=v_year
      left join lateral (
        select max(sb.submitted_at) last_submission
        from public.submissions sb
        where sb.profile_id=p.id
      ) sub on true
      where p.org_id=v_org
    ) x
  ),'[]'::jsonb);
end;
$$;

create or replace function public.admin_person_detail(p_profile_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_org uuid:=public.app_org_id();
begin
  if auth.uid() is null or not public.app_is_admin() then
    raise exception 'Only Administration & HR can view this employee detail.'
      using errcode='42501';
  end if;
  if not exists(select 1 from public.profiles p where p.id=p_profile_id and p.org_id=v_org) then
    raise exception 'That employee does not belong to your organisation.' using errcode='42501';
  end if;

  return jsonb_build_object(
    'work',coalesce((
      select jsonb_agg(to_jsonb(x) order by x.created_at desc)
      from (
        select wi.id,wi.ref,wi.title,wi.status,wi.origin,wi.due_at,wi.completed_at,
               wi.first_time_approved,wi.visibility,wi.project_id,pr.name as project_name,wi.created_at
        from public.work_items wi
        left join public.projects pr on pr.id=wi.project_id
        where wi.assignee_id=p_profile_id and wi.visibility<>'private'
      ) x
    ),'[]'::jsonb),
    'sessions',coalesce((
      select jsonb_agg(to_jsonb(x) order by x.started_at desc)
      from (
        select ws.id,ws.started_at,ws.ended_at,ws.place
        from public.work_sessions ws
        where ws.profile_id=p_profile_id
        order by ws.started_at desc
        limit 120
      ) x
    ),'[]'::jsonb),
    'leave',coalesce((
      select jsonb_agg(to_jsonb(x) order by x.start_date desc)
      from (
        select lr.id,lr.kind,lr.start_date,lr.end_date,lr.days,lr.status
        from public.leave_requests lr
        where lr.profile_id=p_profile_id
        order by lr.start_date desc
        limit 120
      ) x
    ),'[]'::jsonb)
  );
end;
$$;

revoke all on function public.admin_people_summary() from public,anon;
revoke all on function public.admin_person_detail(uuid) from public,anon;
grant execute on function public.admin_people_summary() to authenticated,service_role;
grant execute on function public.admin_person_detail(uuid) to authenticated,service_role;
