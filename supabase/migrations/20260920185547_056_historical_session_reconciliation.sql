
create or replace function public.reconcile_closed_work_session(
  p_session_id uuid,
  p_effective_ended_at timestamptz,
  p_note text default null
)
returns public.work_sessions
language plpgsql
security definer
set search_path=public
as $$
declare
  s public.work_sessions;
  v_note text:=nullif(btrim(p_note),'');
begin
  if auth.uid() is null then
    raise exception 'Sign in to correct a work session.' using errcode='42501';
  end if;
  if p_effective_ended_at is null then
    raise exception 'Choose when the session actually ended.';
  end if;

  select * into s
  from public.work_sessions
  where id=p_session_id
  for update;

  if s.id is null then raise exception 'That work session does not exist.'; end if;
  if s.org_id<>public.app_org_id() or s.profile_id<>auth.uid() then
    raise exception 'You can only correct your own work session.' using errcode='42501';
  end if;
  if s.ended_at is null then
    raise exception 'Use the open-session recovery action for a session that is still open.';
  end if;
  if coalesce((s.flags->>'needs_reconciliation')::boolean,false) is not true then
    raise exception 'That session is not waiting for historical correction.';
  end if;
  if p_effective_ended_at<s.started_at or p_effective_ended_at>s.ended_at then
    raise exception 'The corrected end time must be between the recorded start and recorded end.';
  end if;

  update public.work_sessions
  set ended_at=p_effective_ended_at,
      end_reason='reconciled',
      corrected_by=auth.uid(),
      corrected_at=now(),
      flags=(coalesce(flags,'{}'::jsonb)-'needs_reconciliation'-'reconciliation_reason')
  where id=s.id
  returning * into s;

  insert into public.work_session_events(org_id,work_session_id,actor_id,action,effective_at,note)
  values(s.org_id,s.id,auth.uid(),'historical_reconciled',s.ended_at,
    coalesce(v_note,'Historical multi-day session corrected by the employee.'));

  insert into public.activity_events(org_id,actor_id,verb,object_type,object_id,meta)
  values(s.org_id,auth.uid(),'session_reconciled','work_session',s.id,
    jsonb_build_object('effective_at',s.ended_at,'historical',true,'note',v_note));

  return s;
end;
$$;

revoke all on function public.reconcile_closed_work_session(uuid,timestamptz,text) from public,anon;
grant execute on function public.reconcile_closed_work_session(uuid,timestamptz,text) to authenticated,service_role;

update public.work_sessions
set flags=coalesce(flags,'{}'::jsonb)
          ||jsonb_build_object(
            'needs_reconciliation',true,
            'reconciliation_reason','multi_day_manual_session'
          )
where ended_at is not null
  and corrected_at is null
  and coalesce(end_reason,'manual')='manual'
  and ended_at-started_at>interval '24 hours'
  and coalesce((flags->>'needs_reconciliation')::boolean,false) is not true;
