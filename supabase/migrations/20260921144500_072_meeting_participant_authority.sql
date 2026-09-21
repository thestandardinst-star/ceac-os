-- 072 — Participant-aware meeting authority.
--
-- Aligns Meeting contribution and management rights with the participant/audience
-- model introduced in 071. Scope alone must not grant contribution authority.

create or replace function public.app_can_manage_meeting(p_meeting_id uuid)
returns boolean
language sql
stable
security definer
set search_path=public
as $$
  select auth.uid() is not null
    and exists (
      select 1
      from public.meeting_sessions m
      where m.id=p_meeting_id
        and m.org_id=public.app_org_id()
        and (
          public.app_is_admin()
          or public.app_is_exec()
          or m.created_by=auth.uid()
          or exists (
            select 1
            from public.meeting_participants mp
            where mp.meeting_id=m.id
              and mp.profile_id=auth.uid()
              and mp.role='organiser'
          )
          or (
            m.scope='unit'
            and m.unit_id in (select public.app_managed_units())
          )
          or (
            m.scope='project'
            and exists (
              select 1
              from public.projects p
              where p.id=m.project_id
                and (
                  p.lead_unit_id in (select public.app_managed_units())
                  or exists (
                    select 1
                    from public.project_units pu
                    where pu.project_id=p.id
                      and pu.unit_id in (select public.app_managed_units())
                  )
                )
            )
          )
        )
    );
$$;

revoke all on function public.app_can_manage_meeting(uuid) from public,anon,authenticated;
grant execute on function public.app_can_manage_meeting(uuid) to authenticated,service_role;

drop policy if exists meeting_sessions_update on public.meeting_sessions;
create policy meeting_sessions_update on public.meeting_sessions
for update
using (
  org_id=public.app_org_id()
  and public.app_can_manage_meeting(id)
)
with check (
  org_id=public.app_org_id()
  and public.app_can_manage_meeting(id)
);

drop policy if exists meeting_records_insert on public.meeting_records;
create policy meeting_records_insert on public.meeting_records
for insert with check (
  auth.uid() is not null
  and org_id=public.app_org_id()
  and author_id=auth.uid()
  and exists (
    select 1
    from public.meeting_sessions m
    where m.id=meeting_id
      and m.org_id=public.app_org_id()
      and (
        (
          kind='note'
          and exists (
            select 1
            from public.meeting_participants mp
            where mp.meeting_id=m.id
              and mp.profile_id=auth.uid()
          )
        )
        or (
          kind='decision'
          and public.app_can_manage_meeting(m.id)
        )
      )
  )
);

drop policy if exists meeting_work_links_insert on public.meeting_work_links;
create policy meeting_work_links_insert on public.meeting_work_links
for insert with check (
  linked_by=auth.uid()
  and public.app_can_see_item(work_item_id)
  and public.app_can_manage_meeting(meeting_id)
);
