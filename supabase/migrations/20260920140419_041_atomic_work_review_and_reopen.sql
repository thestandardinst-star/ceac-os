
drop policy if exists reviews_insert on public.reviews;

create or replace function public.guard_work_review_transitions()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if old.status = 'in_review'
     and new.status = 'completed'
     and coalesce(current_setting('ceac.work_approve', true), '') <> 'on' then
    raise exception 'Approve work through the review action so the review and completion are recorded together.'
      using errcode = '42501';
  end if;

  if old.status = 'in_review'
     and new.status = 'returned'
     and coalesce(current_setting('ceac.work_return', true), '') <> 'on' then
    raise exception 'Return work through the review action so the reason is recorded.'
      using errcode = '42501';
  end if;

  if old.status in ('completed','self_certified')
     and (
       new.status is distinct from old.status
       or new.completed_at is distinct from old.completed_at
       or new.first_time_approved is distinct from old.first_time_approved
     )
     and coalesce(current_setting('ceac.work_reopen', true), '') <> 'on' then
    raise exception 'Finished work must be reopened with a reason before its completion state can change.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists work_items_guard_review_transitions on public.work_items;
create trigger work_items_guard_review_transitions
before update on public.work_items
for each row execute function public.guard_work_review_transitions();

create or replace function public.approve_work_submission(
  p_submission_id uuid,
  p_comment text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  s record;
  w record;
  v_latest_submission uuid;
  v_review uuid;
  v_first_time boolean;
begin
  select * into s
  from submissions
  where id = p_submission_id
  for update;

  if s is null then
    raise exception 'That submission does not exist.';
  end if;
  if s.org_id <> app_org_id() then
    raise exception 'That submission belongs to another organisation.';
  end if;

  select * into w
  from work_items
  where id = s.work_item_id
  for update;

  if w is null then
    raise exception 'That work item does not exist.';
  end if;
  if w.status <> 'in_review' then
    raise exception 'That work is not waiting for review.';
  end if;
  if s.profile_id = auth.uid() then
    raise exception 'You cannot approve your own submission.';
  end if;
  if not app_can_review_item(w.id) then
    raise exception 'You are not the reviewer for that work.';
  end if;

  select id into v_latest_submission
  from submissions
  where work_item_id = w.id
  order by submitted_at desc, id desc
  limit 1;

  if v_latest_submission is distinct from s.id then
    raise exception 'A newer submission exists. Review the latest submission instead.';
  end if;

  if exists (select 1 from reviews where submission_id = s.id) then
    raise exception 'That submission already has a review decision.';
  end if;

  select not exists (
    select 1
    from reviews r
    join submissions prior on prior.id = r.submission_id
    where prior.work_item_id = w.id
      and r.decision = 'returned'
  ) into v_first_time;

  insert into reviews (org_id, submission_id, reviewer_id, decision, comment, seen_at)
  values (w.org_id, s.id, auth.uid(), 'completed', nullif(btrim(p_comment),''), now())
  returning id into v_review;

  perform set_config('ceac.work_approve','on',true);

  update work_items
  set status = 'completed',
      first_time_approved = v_first_time,
      completed_at = now(),
      last_movement_at = now()
  where id = w.id;

  insert into activity_events (org_id,actor_id,verb,object_type,object_id,meta)
  values (
    w.org_id,
    auth.uid(),
    'approved',
    'work_item',
    w.id,
    jsonb_build_object('submission_id',s.id,'review_id',v_review)
  );

  return v_review;
end;
$$;

create or replace function public.return_work_for_correction(
  p_submission_id uuid,
  p_comment text,
  p_checklist_item_ids uuid[] default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  s record;
  w record;
  v_latest_submission uuid;
  v_review uuid;
begin
  select * into s from submissions where id = p_submission_id for update;
  if s is null then raise exception 'That submission does not exist.'; end if;
  if s.org_id <> app_org_id() then
    raise exception 'That submission belongs to another organisation.';
  end if;

  select * into w from work_items where id = s.work_item_id for update;
  if w is null then raise exception 'That work item does not exist.'; end if;
  if w.status <> 'in_review' then
    raise exception 'That work is not waiting for review.';
  end if;
  if s.profile_id = auth.uid() then
    raise exception 'You cannot review your own submission.';
  end if;
  if not app_can_review_item(w.id) then
    raise exception 'You are not the reviewer for that work.';
  end if;
  if p_comment is null or length(btrim(p_comment)) = 0 then
    raise exception 'Say what needs to change. A return without a reason is not actionable.';
  end if;

  select id into v_latest_submission
  from submissions
  where work_item_id = w.id
  order by submitted_at desc, id desc
  limit 1;

  if v_latest_submission is distinct from s.id then
    raise exception 'A newer submission exists. Review the latest submission instead.';
  end if;

  if exists (select 1 from reviews where submission_id = s.id) then
    raise exception 'That submission already has a review decision.';
  end if;

  insert into reviews (org_id,submission_id,reviewer_id,decision,comment,seen_at)
  values (w.org_id,s.id,auth.uid(),'returned',btrim(p_comment),now())
  returning id into v_review;

  if p_checklist_item_ids is not null and array_length(p_checklist_item_ids,1) > 0 then
    insert into review_checklist_items (review_id,checklist_item_id)
    select v_review,ci.id
    from checklist_items ci
    where ci.id = any(p_checklist_item_ids)
      and ci.work_item_id = w.id
    on conflict do nothing;

    update checklist_ticks t
    set undone_at = now()
    from checklist_items ci
    where ci.id = t.checklist_item_id
      and ci.work_item_id = w.id
      and t.checklist_item_id = any(p_checklist_item_ids)
      and t.undone_at is null;
  end if;

  perform set_config('ceac.work_return','on',true);

  update work_items
  set status = 'returned',
      first_time_approved = false,
      completed_at = null,
      last_movement_at = now()
  where id = w.id;

  insert into activity_events (org_id,actor_id,verb,object_type,object_id,meta)
  values (
    w.org_id,
    auth.uid(),
    'returned',
    'work_item',
    w.id,
    jsonb_build_object('submission_id',s.id,'review_id',v_review)
  );

  return v_review;
end;
$$;

create or replace function public.reopen_approved_work(
  p_work_item_id uuid,
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  w record;
  v_previous_status text;
  v_previous_completed_at timestamptz;
begin
  select * into w
  from work_items
  where id = p_work_item_id
  for update;

  if w is null then
    raise exception 'That work item does not exist.';
  end if;
  if w.org_id <> app_org_id() then
    raise exception 'That work belongs to another organisation.';
  end if;
  if w.status not in ('completed','self_certified') then
    raise exception 'Only finished work can be reopened.';
  end if;
  if p_reason is null or length(btrim(p_reason)) = 0 then
    raise exception 'Say why the work is being reopened. The reason is kept permanently.';
  end if;

  if w.status = 'completed' then
    if not app_can_review_item(w.id) then
      raise exception 'Only the authorised reviewer or Administration can reopen approved work.';
    end if;
  else
    if not (
      app_is_admin()
      or (
        w.assignee_id = auth.uid()
        and (
          exists (
            select 1 from unit_memberships m
            where m.profile_id = auth.uid()
              and m.unit_id = w.unit_id
              and m.role = 'manager'
          )
          or app_is_exec()
        )
      )
    ) then
      raise exception 'Only the person who self-certified this work or Administration can reopen it.';
    end if;
  end if;

  v_previous_status := w.status;
  v_previous_completed_at := w.completed_at;

  insert into activity_events (org_id,actor_id,verb,object_type,object_id,meta)
  values (
    w.org_id,
    auth.uid(),
    'reopened',
    'work_item',
    w.id,
    jsonb_build_object(
      'reason',btrim(p_reason),
      'previous_status',v_previous_status,
      'previous_completed_at',v_previous_completed_at
    )
  );

  perform set_config('ceac.work_reopen','on',true);

  update work_items
  set status = 'in_progress',
      completed_at = null,
      last_movement_at = now()
  where id = w.id;

  return w.id;
end;
$$;

revoke all on function public.guard_work_review_transitions() from public, anon, authenticated;
revoke all on function public.approve_work_submission(uuid,text) from public, anon;
revoke all on function public.return_work_for_correction(uuid,text,uuid[]) from public, anon;
revoke all on function public.reopen_approved_work(uuid,text) from public, anon;

grant execute on function public.approve_work_submission(uuid,text) to authenticated, service_role;
grant execute on function public.return_work_for_correction(uuid,text,uuid[]) to authenticated, service_role;
grant execute on function public.reopen_approved_work(uuid,text) to authenticated, service_role;
