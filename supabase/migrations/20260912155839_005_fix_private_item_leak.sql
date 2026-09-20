-- A "for all" policy includes SELECT, and policies combine with OR — so the
-- manager's write rule was granting read on private items, overriding the
-- privacy rule. Reading is now governed by exactly one rule, and nothing else.

drop policy if exists work_items_manager_write on work_items;
drop policy if exists work_items_assignee_update on work_items;

create policy work_items_manager_insert on work_items
  for insert with check (
    org_id = app_org_id()
    and (unit_id in (select app_managed_units())
         or sub_team_id in (select app_led_sub_teams())
         or app_is_admin() or app_is_exec())
  );

create policy work_items_manager_update on work_items
  for update using (
    org_id = app_org_id()
    and visibility <> 'private'
    and (unit_id in (select app_managed_units())
         or sub_team_id in (select app_led_sub_teams())
         or app_is_admin() or app_is_exec())
  )
  with check (
    org_id = app_org_id()
    and (unit_id in (select app_managed_units())
         or sub_team_id in (select app_led_sub_teams())
         or app_is_admin() or app_is_exec())
  );

create policy work_items_manager_delete on work_items
  for delete using (
    org_id = app_org_id()
    and visibility <> 'private'
    and (unit_id in (select app_managed_units()) or app_is_admin())
  );

create policy work_items_assignee_update on work_items
  for update using (assignee_id = auth.uid() and org_id = app_org_id())
  with check (assignee_id = auth.uid() and org_id = app_org_id());

-- A private item is never reviewable by anyone, so its checklist and any
-- submission stay closed too.
create or replace function app_can_review_item(item_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from work_items w
    where w.id = item_id
      and w.org_id = app_org_id()
      and w.visibility <> 'private'
      and (
        w.unit_id in (select app_managed_units())
        or w.sub_team_id in (select app_led_sub_teams())
        or app_is_admin()
      )
  );
$$;
