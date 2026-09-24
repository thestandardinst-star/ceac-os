-- Reconciled from the applied production migration history.
-- 1. A second holder of authority.manage.
--
-- Rebecca held all thirteen capabilities and was the only person who could
-- grant any of them. If her account were lost or compromised, CEAC would
-- have no way to restore administrative control of its own system without
-- direct database access.
--
-- Pastor Claude gets authority.manage only — the recovery path, not the
-- data. He can re-grant what is needed; he does not thereby gain
-- hr_private.access or anything else.
insert into capability_grants (org_id, profile_id, capability, granted_by, grant_reason)
select p.org_id, p.id, 'authority.manage', null,
       'Second holder of authority.manage so the organisation is not locked out if the sole administrator is unavailable. Applied as a migration at the owner''s instruction; no individual granted it.'
  from profiles p
 where p.is_exec and p.active
   and not exists (
     select 1 from capability_grants cg
      where cg.profile_id = p.id and cg.capability = 'authority.manage'
        and cg.revoked_at is null);

-- Keep it that way: the last active authority.manage cannot be revoked.
-- Without this, the single-point-of-failure can simply reappear.
create or replace function guard_last_authority()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_left int;
begin
  if new.revoked_at is not null and old.revoked_at is null
     and old.capability = 'authority.manage' then
    select count(*) into v_left from capability_grants
     where org_id = old.org_id and capability = 'authority.manage'
       and revoked_at is null and id <> old.id;
    if v_left = 0 then
      raise exception 'This is the last person who can manage authority. Grant it to someone else before revoking it.';
    end if;
  end if;
  return new;
end; $$;

drop trigger if exists trg_guard_last_authority on capability_grants;
create trigger trg_guard_last_authority
  before update on capability_grants
  for each row execute function guard_last_authority();

-- 2. budgets.bg_write was FOR ALL — the only destructive money policy
-- left. An administrator could delete a budget outright, leaving recorded
-- spend pointing at a budget that no longer exists. Three budget rows
-- already exist, so this was live rather than theoretical.
--
-- A budget still needs to be changeable: Cost.jsx updates the amount when
-- Rebecca revises it. Insert and update are kept; delete is removed.
drop policy if exists bg_write on budgets;
create policy bg_insert on budgets for insert
  with check (org_id = app_org_id() and app_is_admin());
create policy bg_update on budgets for update
  using (org_id = app_org_id() and app_is_admin())
  with check (org_id = app_org_id() and app_is_admin());
-- No delete policy. A budget that was set and later withdrawn is part of
-- the record, the same as every other money row in this system.

-- 3. capability_definitions read as `true` — the only policy in the
-- system with no boundary at all. It is a catalogue of capability names
-- with no personal data, but an unauthenticated reader has no business
-- enumerating the authority model.
drop policy if exists capability_definitions_read on capability_definitions;
create policy capability_definitions_read on capability_definitions for select
  to authenticated using (true);
