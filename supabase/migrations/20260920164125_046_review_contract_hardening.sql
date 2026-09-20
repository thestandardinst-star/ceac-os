
create or replace function public.guard_submission_contract()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  w record;
begin
  if auth.uid() is null then
    return new;
  end if;

  select * into w
  from public.work_items
  where id=new.work_item_id;

  if w is null then
    raise exception 'That work item does not exist.';
  end if;
  if w.org_id<>public.app_org_id() or new.org_id<>w.org_id then
    raise exception 'That submission belongs to another organisation.';
  end if;
  if new.profile_id<>auth.uid() or w.assignee_id<>auth.uid() then
    raise exception 'Only the assigned person can submit this work.';
  end if;
  if w.kind not in ('task','meeting_outcome','deliverable') then
    raise exception 'This work type does not use the submission/review loop.'
      using errcode='42501';
  end if;
  if w.status in ('completed','self_certified','cancelled','in_review') then
    raise exception 'That work is not available for a new submission.';
  end if;

  return new;
end;
$$;

drop trigger if exists submissions_guard_contract on public.submissions;
create trigger submissions_guard_contract
before insert on public.submissions
for each row execute function public.guard_submission_contract();

revoke all on function public.guard_submission_contract() from public,anon,authenticated;

create or replace function public.self_certify_work(
  p_work_item_id uuid,
  p_session_id uuid default null,
  p_note text default null,
  p_link text default null
)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  w record;
  v_submission uuid;
  v_outstanding integer;
  v_deliverable record;
begin
  select * into w
  from work_items
  where id=p_work_item_id
  for update;

  if w is null then raise exception 'That work item does not exist.'; end if;
  if w.org_id<>app_org_id() then raise exception 'That work item belongs to another organisation.'; end if;
  if w.assignee_id<>auth.uid() then raise exception 'Only the person the work is assigned to can certify it.'; end if;
  if w.kind not in ('task','meeting_outcome','deliverable') then
    raise exception 'This work type does not use self-certification.';
  end if;

  if not exists (
    select 1 from unit_memberships m
    where m.profile_id=auth.uid()
      and m.unit_id=w.unit_id
      and m.role='manager'
  ) and not app_is_admin() and not app_is_exec() then
    raise exception 'Only a unit head can certify their own work. Send it for review instead.';
  end if;

  if w.status in ('completed','cancelled','self_certified') then
    raise exception 'That work is already finished.';
  end if;
  if w.status='in_review' then
    raise exception 'That work is already with a reviewer.';
  end if;

  if w.kind='task' then
    select count(*) into v_outstanding
    from checklist_items ci
    where ci.work_item_id=w.id
      and not exists (
        select 1 from checklist_ticks t
        where t.checklist_item_id=ci.id and t.undone_at is null
      );
    if v_outstanding>0 then
      raise exception 'Finish the checklist first — % item(s) outstanding.',v_outstanding;
    end if;
  end if;

  if w.kind='deliverable' then
    select * into v_deliverable
    from work_deliverables
    where work_item_id=w.id;

    if v_deliverable is null then
      raise exception 'Deliverable configuration is missing.';
    end if;

    if v_deliverable.evidence_required then
      if v_deliverable.evidence_kind='file' then
        raise exception 'This deliverable requires an uploaded file. It cannot be self-certified with a link-only submission.';
      end if;
      if v_deliverable.evidence_kind in ('link','file_or_link')
         and (p_link is null or length(btrim(p_link))=0) then
        raise exception 'Add the required evidence link before finishing this deliverable.';
      end if;
    end if;
  end if;

  insert into submissions(org_id,work_item_id,profile_id,session_id,note,outside_session)
  values(w.org_id,w.id,auth.uid(),p_session_id,p_note,p_session_id is null)
  returning id into v_submission;

  if p_link is not null and length(btrim(p_link))>0 then
    insert into submission_files(submission_id,kind,url)
    values(v_submission,'link',btrim(p_link));
  end if;

  update work_items
  set status='self_certified',
      completed_at=now(),
      last_movement_at=now()
  where id=w.id;

  insert into activity_events(org_id,actor_id,verb,object_type,object_id,meta)
  values(
    w.org_id,
    auth.uid(),
    'self_certified',
    'work_item',
    w.id,
    jsonb_build_object('submission_id',v_submission,'kind',w.kind)
  );

  return v_submission;
end;
$$;

revoke all on function public.self_certify_work(uuid,uuid,text,text) from public,anon;
grant execute on function public.self_certify_work(uuid,uuid,text,text) to authenticated,service_role;

create or replace function public.approve_work_submission(
  p_submission_id uuid,
  p_comment text default null
)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  s record;
  w record;
  v_latest_submission uuid;
  v_review uuid;
  v_first_time boolean;
  v_deliverable record;
  v_file_count integer;
  v_outstanding integer;
begin
  select * into s from submissions where id=p_submission_id for update;
  if s is null then raise exception 'That submission does not exist.'; end if;
  if s.org_id<>app_org_id() then raise exception 'That submission belongs to another organisation.'; end if;

  select * into w from work_items where id=s.work_item_id for update;
  if w is null then raise exception 'That work item does not exist.'; end if;
  if w.kind not in ('task','deliverable','meeting_outcome') then
    raise exception 'This work type does not use the approval loop.';
  end if;
  if w.status<>'in_review' then raise exception 'That work is not waiting for review.'; end if;
  if s.profile_id=auth.uid() then raise exception 'You cannot approve your own submission.'; end if;
  if not app_can_review_item(w.id) then raise exception 'You are not the reviewer for that work.'; end if;

  select id into v_latest_submission
  from submissions
  where work_item_id=w.id
  order by submitted_at desc,id desc
  limit 1;

  if v_latest_submission is distinct from s.id then
    raise exception 'A newer submission exists. Review the latest submission instead.';
  end if;
  if exists(select 1 from reviews where submission_id=s.id) then
    raise exception 'That submission already has a review decision.';
  end if;

  if w.kind='task' then
    select count(*) into v_outstanding
    from checklist_items ci
    where ci.work_item_id=w.id
      and not exists (
        select 1 from checklist_ticks t
        where t.checklist_item_id=ci.id and t.undone_at is null
      );
    if v_outstanding>0 then
      raise exception 'This Task still has % checklist item(s) outstanding.',v_outstanding;
    end if;
  end if;

  if w.kind='deliverable' then
    select * into v_deliverable from work_deliverables where work_item_id=w.id;
    if v_deliverable is null then raise exception 'Deliverable configuration is missing.'; end if;
    if v_deliverable.evidence_required then
      select count(*) into v_file_count from submission_files where submission_id=s.id;
      if v_file_count=0 then raise exception 'This deliverable requires evidence before it can be approved.'; end if;
      if v_deliverable.evidence_kind='link' and not exists (
        select 1 from submission_files where submission_id=s.id and kind='link'
      ) then raise exception 'This deliverable requires a link.'; end if;
      if v_deliverable.evidence_kind='file' and not exists (
        select 1 from submission_files where submission_id=s.id and kind='upload'
      ) then raise exception 'This deliverable requires an uploaded file.'; end if;
    end if;
  end if;

  select not exists (
    select 1 from reviews r
    join submissions prior on prior.id=r.submission_id
    where prior.work_item_id=w.id and r.decision='returned'
  ) into v_first_time;

  insert into reviews(org_id,submission_id,reviewer_id,decision,comment,seen_at)
  values(w.org_id,s.id,auth.uid(),'completed',nullif(btrim(p_comment),''),now())
  returning id into v_review;

  perform set_config('ceac.work_approve','on',true);
  update work_items
  set status='completed',
      first_time_approved=v_first_time,
      completed_at=now(),
      last_movement_at=now()
  where id=w.id;

  insert into activity_events(org_id,actor_id,verb,object_type,object_id,meta)
  values(w.org_id,auth.uid(),'approved','work_item',w.id,jsonb_build_object('submission_id',s.id,'review_id',v_review));

  return v_review;
end;
$$;

revoke all on function public.approve_work_submission(uuid,text) from public,anon;
grant execute on function public.approve_work_submission(uuid,text) to authenticated,service_role;
