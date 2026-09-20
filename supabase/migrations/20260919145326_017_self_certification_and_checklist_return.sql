-- Manager self-certification, and returning specific checklist items.
--
-- Inspected first. Three things differ from the request:
--
--  * work_items_assignee_update currently permits the assignee to set ANY
--    column, so adding self_certified to the check constraint alone would
--    let any client set it directly. Closed by tightening both update
--    policies rather than by adding a trigger — a policy is declarative
--    and cannot be bypassed by a later code path.
--
--  * checklist_ticks policy is FOR ALL, so staff can DELETE their own
--    ticks today. Tick history is therefore already destructible. Closed.
--
--  * reviews policy is FOR ALL, so a reviewer can edit or delete their own
--    review. "Review history remains intact" is not true today. Closed.

-- ---------- 1. self_certified ----------
alter table work_items drop constraint if exists work_items_status_check;
alter table work_items add constraint work_items_status_check
  check (status in ('not_started','in_progress','waiting_on','in_review',
                    'completed','returned','cancelled','self_certified'));

-- Only the controlled RPC may move work into self_certified. Security
-- definer functions bypass RLS, so excluding it here leaves the RPC as
-- the single route in.
drop policy if exists work_items_assignee_update on work_items;
create policy work_items_assignee_update on work_items for update
  using (assignee_id = auth.uid() and org_id = app_org_id())
  with check (assignee_id = auth.uid() and org_id = app_org_id()
              and status <> 'self_certified');

drop policy if exists work_items_manager_update on work_items;
create policy work_items_manager_update on work_items for update
  using (org_id = app_org_id() and visibility <> 'private'
         and (unit_id in (select app_managed_units())
              or sub_team_id in (select app_led_sub_teams())
              or app_is_admin() or app_is_exec()))
  with check (org_id = app_org_id() and status <> 'self_certified'
              and (unit_id in (select app_managed_units())
                   or sub_team_id in (select app_led_sub_teams())
                   or app_is_admin() or app_is_exec()));

-- ---------- 2. tick history becomes append-only ----------
drop policy if exists ticks_own_write on checklist_ticks;
create policy ticks_insert on checklist_ticks for insert
  with check (profile_id = auth.uid());
create policy ticks_undo on checklist_ticks for update
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());
-- No delete policy: a tick is undone by setting undone_at, never removed.

-- ---------- 3. reviews become immutable ----------
drop policy if exists reviews_write on reviews;
create policy reviews_insert on reviews for insert
  with check (org_id = app_org_id() and reviewer_id = auth.uid()
              and submission_id in (select s.id from submissions s
                                    where app_can_review_item(s.work_item_id)));
-- No update or delete policy: a review stands as written.

-- ---------- 4. which checklist items a return flagged ----------
create table if not exists review_checklist_items (
  review_id uuid not null references reviews(id) on delete cascade,
  checklist_item_id uuid not null references checklist_items(id) on delete cascade,
  primary key (review_id, checklist_item_id)
);
alter table review_checklist_items enable row level security;

create policy rci_read on review_checklist_items for select
  using (review_id in (select r.id from reviews r
                       join submissions s on s.id = r.submission_id
                       where app_can_see_item(s.work_item_id)));
create policy rci_insert on review_checklist_items for insert
  with check (review_id in (select r.id from reviews r
                            join submissions s on s.id = r.submission_id
                            where app_can_review_item(s.work_item_id)));
-- No update or delete policy.
