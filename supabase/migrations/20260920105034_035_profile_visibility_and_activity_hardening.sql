create or replace function public.app_visible_profiles()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.id
  from profiles p
  where p.org_id = app_org_id()
    and (app_is_admin() or app_is_exec())
  union
  select auth.uid()
  where auth.uid() is not null
  union
  select m.profile_id
  from unit_memberships m
  where m.unit_id in (select app_my_units())
  union
  select m.profile_id
  from unit_memberships m
  where m.unit_id in (select app_managed_units());
$$;

drop policy if exists activity_insert on public.activity_events;
drop policy if exists activity_read on public.activity_events;

create policy activity_read on public.activity_events
for select
using (
  org_id = app_org_id()
  and (
    app_is_admin()
    or actor_id = auth.uid()
    or (
      object_type = 'work_item'
      and object_id is not null
      and app_can_see_item(object_id)
    )
    or (
      object_type = 'project'
      and object_id is not null
      and object_id in (select app_visible_projects())
    )
    or (
      object_type = 'objective'
      and object_id is not null
      and exists (
        select 1
        from objectives o
        where o.id = activity_events.object_id
          and o.project_id in (select app_visible_projects())
      )
    )
    or (
      object_type = 'unit'
      and object_id is not null
      and object_id in (select app_visible_units())
    )
    or (
      object_type = 'sub_team'
      and object_id is not null
      and exists (
        select 1
        from sub_teams st
        where st.id = activity_events.object_id
          and st.unit_id in (select app_visible_units())
      )
    )
  )
);
