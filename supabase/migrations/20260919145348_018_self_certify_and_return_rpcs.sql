-- A manager certifying their own work, and a manager returning specific
-- checklist items. Both transactional: either everything lands or nothing
-- does, so no work item is left in a state no screen expects.

create or replace function self_certify_work(
  p_work_item_id uuid,
  p_session_id uuid default null,
  p_note text default null,
  p_link text default null
) returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  w record;
  v_submission uuid;
  v_outstanding int;
begin
  select * into w from work_items where id = p_work_item_id;
  if w is null then raise exception 'That work item does not exist.'; end if;

  if w.org_id <> app_org_id() then
    raise exception 'That work item belongs to another organisation.';
  end if;
  if w.assignee_id <> auth.uid() then
    raise exception 'Only the person the work is assigned to can certify it.';
  end if;

  -- A manager certifies their own work because there is no one inside the
  -- unit above them to review it. Anyone else must go through review.
  if not exists (
    select 1 from unit_memberships m
    where m.profile_id = auth.uid() and m.unit_id = w.unit_id and m.role = 'manager'
  ) and not app_is_admin() and not app_is_exec() then
    raise exception 'Only a unit head can certify their own work. Send it for review instead.';
  end if;

  if w.status in ('completed','cancelled','self_certified') then
    raise exception 'That work is already finished.';
  end if;
  if w.status = 'in_review' then
    raise exception 'That work is already with a reviewer.';
  end if;

  -- Checklist completion is enforced here, not only in the interface.
  if w.kind = 'task' then
    select count(*) into v_outstanding
    from checklist_items ci
    where ci.work_item_id = w.id
      and not exists (select 1 from checklist_ticks t
                      where t.checklist_item_id = ci.id and t.undone_at is null);
    if v_outstanding > 0 then
      raise exception 'Finish the checklist first — % item(s) outstanding.', v_outstanding;
    end if;
  end if;

  insert into submissions (org_id, work_item_id, profile_id, session_id, note, outside_session)
  values (w.org_id, w.id, auth.uid(), p_session_id, p_note, p_session_id is null)
  returning id into v_submission;

  if p_link is not null and length(btrim(p_link)) > 0 then
    insert into submission_files (submission_id, kind, url)
    values (v_submission, 'link', btrim(p_link));
  end if;

  update work_items
     set status = 'self_certified',
         completed_at = now(),
         last_movement_at = now()
   where id = w.id;

  return v_submission;
end;
$$;

revoke all on function self_certify_work(uuid, uuid, text, text) from public;
grant execute on function self_certify_work(uuid, uuid, text, text) to authenticated;


create or replace function return_work_for_correction(
  p_submission_id uuid,
  p_comment text,
  p_checklist_item_ids uuid[] default null
) returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  s record;
  v_review uuid;
begin
  select * into s from submissions where id = p_submission_id;
  if s is null then raise exception 'That submission does not exist.'; end if;
  if s.org_id <> app_org_id() then
    raise exception 'That submission belongs to another organisation.';
  end if;
  if not app_can_review_item(s.work_item_id) then
    raise exception 'You are not the reviewer for that work.';
  end if;
  if p_comment is null or length(btrim(p_comment)) = 0 then
    raise exception 'Say what needs to change. A return without a reason is not actionable.';
  end if;

  insert into reviews (org_id, submission_id, reviewer_id, decision, comment, seen_at)
  values (s.org_id, s.id, auth.uid(), 'returned', btrim(p_comment), now())
  returning id into v_review;

  if p_checklist_item_ids is not null and array_length(p_checklist_item_ids, 1) > 0 then
    -- Record which parts were flagged.
    insert into review_checklist_items (review_id, checklist_item_id)
    select v_review, ci.id
      from checklist_items ci
     where ci.id = any(p_checklist_item_ids)
       and ci.work_item_id = s.work_item_id   -- cannot flag another item's checklist
    on conflict do nothing;

    -- Untick the flagged ones so the staff member must redo them.
    -- History is preserved: undone_at is set, the row is never deleted.
    update checklist_ticks t
       set undone_at = now()
      from checklist_items ci
     where ci.id = t.checklist_item_id
       and ci.work_item_id = s.work_item_id
       and t.checklist_item_id = any(p_checklist_item_ids)
       and t.undone_at is null;
  end if;

  update work_items
     set status = 'returned',
         first_time_approved = false,
         completed_at = null,
         last_movement_at = now()
   where id = s.work_item_id;

  return v_review;
end;
$$;

revoke all on function return_work_for_correction(uuid, text, uuid[]) from public;
grant execute on function return_work_for_correction(uuid, text, uuid[]) to authenticated;
