
create or replace function public.reconcile_work_session(
  p_session_id uuid,
  p_action text,
  p_effective_ended_at timestamptz default null,
  p_note text default null
)
returns public.work_sessions
language plpgsql
security definer
set search_path=public
as $$
declare
  s public.work_sessions;
  v_new public.work_sessions;
  v_note text:=nullif(btrim(p_note),'');
  v_effective timestamptz;
begin
  if auth.uid() is null then raise exception 'Sign in to reconcile work.'; end if;
  if p_action not in ('continue','close') then
    raise exception 'Choose continue or close.';
  end if;

  select * into s from public.work_sessions where id=p_session_id for update;
  if s.id is null then raise exception 'That work session does not exist.'; end if;
  if s.org_id<>public.app_org_id() or s.profile_id<>auth.uid() then
    raise exception 'You can only reconcile your own work session.' using errcode='42501';
  end if;
  if s.ended_at is not null then raise exception 'That work session has already ended.'; end if;

  if p_action='continue' then
    if (coalesce(s.last_confirmed_at,s.started_at) at time zone 'Africa/Accra')::date
       >= (now() at time zone 'Africa/Accra')::date then
      raise exception 'This session is already current and does not need recovery.';
    end if;

    v_effective:=greatest(s.started_at,coalesce(s.last_confirmed_at,s.started_at));

    update public.work_sessions
    set ended_at=v_effective,
        end_reason='reconciled',
        corrected_by=auth.uid(),
        corrected_at=now()
    where id=s.id
    returning * into s;

    insert into public.work_session_events(org_id,work_session_id,actor_id,action,effective_at,note)
    values(s.org_id,s.id,auth.uid(),'reconciled',v_effective,
      coalesce(v_note,'Closed at the last confirmed point before continuing on a new day.'));

    insert into public.work_sessions(
      org_id,profile_id,work_item_id,place,started_at,last_confirmed_at,
      lat,lng,device_time,flags
    )
    values(
      s.org_id,s.profile_id,s.work_item_id,s.place,now(),now(),
      null,null,now(),jsonb_build_object('continued_from_session_id',s.id)
    )
    returning * into v_new;

    insert into public.work_session_events(org_id,work_session_id,actor_id,action,note)
    values(v_new.org_id,v_new.id,auth.uid(),'continued',
      coalesce(v_note,'Continued from a reconciled previous-day session.'));

    insert into public.activity_events(org_id,actor_id,verb,object_type,object_id,meta)
    values(s.org_id,auth.uid(),'session_reconciled','work_session',s.id,
      jsonb_build_object('effective_at',v_effective,'continued_as_session_id',v_new.id));

    return v_new;
  else
    if p_effective_ended_at is null then
      raise exception 'Choose when the work session actually ended.';
    end if;
    if p_effective_ended_at<s.started_at or p_effective_ended_at>now() then
      raise exception 'The end time must be after the start and not in the future.';
    end if;

    update public.work_sessions
    set ended_at=p_effective_ended_at,
        end_reason='reconciled',
        corrected_by=auth.uid(),
        corrected_at=now()
    where id=s.id
    returning * into s;

    insert into public.work_session_events(org_id,work_session_id,actor_id,action,effective_at,note)
    values(s.org_id,s.id,auth.uid(),'reconciled',s.ended_at,v_note);

    insert into public.activity_events(org_id,actor_id,verb,object_type,object_id,meta)
    values(s.org_id,auth.uid(),'session_reconciled','work_session',s.id,
      jsonb_build_object('effective_at',s.ended_at,'note',v_note));

    return s;
  end if;
end;
$$;

revoke all on function public.reconcile_work_session(uuid,text,timestamptz,text) from public,anon;
grant execute on function public.reconcile_work_session(uuid,text,timestamptz,text) to authenticated,service_role;
