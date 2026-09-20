-- TASK A. Verified live: profiles_org_read, memberships_read,
-- sub_teams_read and sub_team_members_read were all `org_id =
-- app_org_id()`. Any authenticated person could read the entire staff
-- directory, every membership and every sub-team in the church. The
-- screens filtered correctly, but a filtered screen is not a boundary.
--
-- One helper rather than the same logic copied into four policies.
-- SECURITY DEFINER so it reads unit_memberships without re-entering the
-- policies it is used by.

create or replace function app_visible_profiles()
returns setof uuid
language sql stable security definer set search_path = public as $$
  -- Administration and the Group Pastor see everyone.
  select p.id from profiles p
   where p.org_id = app_org_id() and (app_is_admin() or app_is_exec())
  union
  -- Yourself, always.
  select auth.uid()
  union
  -- Anyone in a unit you belong to — your own team. Covers dual-role
  -- membership, because app_my_units() returns every unit you are in.
  select m.profile_id from unit_memberships m
   where m.unit_id in (select app_my_units())
  union
  -- Anyone in a unit you manage.
  select m.profile_id from unit_memberships m
   where m.unit_id in (select app_managed_units())
  union
  -- People in units that share a project with a unit you manage. Names
  -- only — this grants no access to their work, finance or record.
  select m.profile_id from unit_memberships m
   where m.unit_id in (
     select pu.unit_id from project_units pu
      where pu.project_id in (select app_visible_projects())
     union
     select p.lead_unit_id from projects p
      where p.id in (select app_visible_projects()) and p.lead_unit_id is not null)
     and exists (select 1 from app_managed_units());
$$;
revoke execute on function app_visible_profiles() from anon, public;
grant execute on function app_visible_profiles() to authenticated;

-- Which units you may see at all.
create or replace function app_visible_units()
returns setof uuid
language sql stable security definer set search_path = public as $$
  select u.id from units u
   where u.org_id = app_org_id() and (app_is_admin() or app_is_exec())
  union select unnest(array(select app_my_units()))
  union select unnest(array(select app_managed_units()))
  union select pu.unit_id from project_units pu
         where pu.project_id in (select app_visible_projects())
  union select p.lead_unit_id from projects p
         where p.id in (select app_visible_projects()) and p.lead_unit_id is not null;
$$;
revoke execute on function app_visible_units() from anon, public;
grant execute on function app_visible_units() to authenticated;

drop policy if exists profiles_org_read on profiles;
create policy profiles_visible_read on profiles for select
  using (org_id = app_org_id() and id in (select app_visible_profiles()));
-- profiles_own_read, profiles_own_update and profiles_admin_write are
-- unchanged.

drop policy if exists memberships_read on unit_memberships;
create policy memberships_read on unit_memberships for select
  using (org_id = app_org_id() and (
    profile_id = auth.uid()
    or unit_id in (select app_visible_units())));

drop policy if exists sub_teams_read on sub_teams;
create policy sub_teams_read on sub_teams for select
  using (org_id = app_org_id() and unit_id in (select app_visible_units()));

drop policy if exists sub_team_members_read on sub_team_members;
create policy sub_team_members_read on sub_team_members for select
  using (sub_team_id in (select id from sub_teams));
