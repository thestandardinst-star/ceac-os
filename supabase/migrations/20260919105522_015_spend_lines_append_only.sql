-- Correcting an inconsistency in migration 012. spend_lines was created
-- with a FOR ALL policy, which permits update and delete. Income and
-- transfers are append-only; spend must be too, or the weakest record is
-- the one that gets disputed.
--
-- A wrong spend line is corrected by adding a reversing line that points
-- at the original. Both stay visible.

alter table spend_lines add column if not exists reverses_id uuid references spend_lines(id);

drop policy if exists sp_write on spend_lines;

create policy sp_insert on spend_lines for insert
  with check (org_id = app_org_id() and entered_by = auth.uid() and (
    app_is_admin()
    or exists (select 1 from unit_memberships m
               join units u on u.id = m.unit_id
               where m.profile_id = auth.uid() and u.handles_finance)
  ));

-- No update policy and no delete policy: entries stand as recorded.
