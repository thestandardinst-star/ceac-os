-- Keep the audience predicate outside the exposed API schema so announcement
-- and audience policies do not recursively query each other.

create schema if not exists private;
revoke all on schema private from public,anon;
grant usage on schema private to authenticated,service_role;

create or replace function private.can_read_announcement(p_announcement_id uuid)
returns boolean
language sql
stable
security definer
set search_path=public,private
as $$
  select exists (
    select 1 from public.announcements a
    where a.id=p_announcement_id
      and a.org_id=public.app_org_id()
      and a.status='published'
      and a.published_at<=now()
      and (a.expires_at is null or a.expires_at>now())
      and exists (
        select 1 from public.announcement_audiences aa
        where aa.announcement_id=a.id
          and (
            aa.audience_type='organisation'
            or (aa.audience_type='unit' and aa.unit_id in (select public.app_my_units()))
            or (aa.audience_type='role' and (
              (aa.audience_role in ('staff','sub_team_lead','manager') and exists (
                select 1 from public.unit_memberships m
                where m.profile_id=auth.uid() and m.role=aa.audience_role
              ))
              or (aa.audience_role='admin' and public.app_is_admin())
              or (aa.audience_role='exec' and public.app_is_exec())
            ))
          )
      )
  );
$$;

revoke all on function private.can_read_announcement(uuid) from public,anon;
grant execute on function private.can_read_announcement(uuid) to authenticated,service_role;

drop policy if exists announcements_read on public.announcements;
create policy announcements_read on public.announcements
for select using (
  org_id=public.app_org_id()
  and (
    public.app_is_admin()
    or public.app_is_exec()
    or private.can_read_announcement(id)
  )
);

drop policy if exists announcement_audiences_read on public.announcement_audiences;
create policy announcement_audiences_read on public.announcement_audiences
for select using (
  public.app_is_admin()
  or public.app_is_exec()
  or private.can_read_announcement(announcement_id)
);

create or replace function public.app_can_read_announcement(p_announcement_id uuid)
returns boolean
language sql
stable
security definer
set search_path=public,private
as $$
  select private.can_read_announcement(p_announcement_id);
$$;

revoke all on function public.app_can_read_announcement(uuid) from public,anon,authenticated;
