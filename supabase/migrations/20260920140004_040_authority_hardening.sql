
drop policy if exists memberships_manager_write on public.unit_memberships;
create policy memberships_admin_write
on public.unit_memberships
for all
using (
  public.app_is_admin()
  and org_id = public.app_org_id()
)
with check (
  public.app_is_admin()
  and org_id = public.app_org_id()
);

drop policy if exists sub_team_members_manager_write on public.sub_team_members;
create policy sub_team_members_admin_write
on public.sub_team_members
for all
using (
  public.app_is_admin()
  and exists (
    select 1
    from public.sub_teams st
    where st.id = sub_team_id
      and st.org_id = public.app_org_id()
  )
)
with check (
  public.app_is_admin()
  and exists (
    select 1
    from public.sub_teams st
    where st.id = sub_team_id
      and st.org_id = public.app_org_id()
  )
);

create or replace function public.guard_sub_team_hr_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() is null or public.app_is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' and new.lead_id is not null then
    raise exception 'Only Administration & HR can assign a sub-team lead.'
      using errcode = '42501';
  end if;

  if tg_op = 'UPDATE' and new.lead_id is distinct from old.lead_id then
    raise exception 'Only Administration & HR can change a sub-team lead.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists sub_teams_guard_hr_fields on public.sub_teams;
create trigger sub_teams_guard_hr_fields
before insert or update on public.sub_teams
for each row execute function public.guard_sub_team_hr_fields();

drop policy if exists pco_write on public.project_close_objectives;
create policy pco_write_authorised
on public.project_close_objectives
for all
using (
  exists (
    select 1
    from public.project_closes pc
    where pc.id = close_id
      and pc.org_id = public.app_org_id()
      and pc.status = 'draft'
      and (pc.author_id = auth.uid() or public.app_is_admin())
  )
)
with check (
  exists (
    select 1
    from public.project_closes pc
    where pc.id = close_id
      and pc.org_id = public.app_org_id()
      and pc.status = 'draft'
      and (pc.author_id = auth.uid() or public.app_is_admin())
  )
);

drop policy if exists pcc_write on public.project_close_costs;
create policy pcc_write_authorised
on public.project_close_costs
for all
using (
  exists (
    select 1
    from public.project_closes pc
    where pc.id = close_id
      and pc.org_id = public.app_org_id()
      and pc.status = 'draft'
      and (pc.author_id = auth.uid() or public.app_is_admin())
  )
)
with check (
  exists (
    select 1
    from public.project_closes pc
    where pc.id = close_id
      and pc.org_id = public.app_org_id()
      and pc.status = 'draft'
      and (pc.author_id = auth.uid() or public.app_is_admin())
  )
);

drop policy if exists pcd_write on public.project_close_deliverables;
create policy pcd_write_authorised
on public.project_close_deliverables
for all
using (
  exists (
    select 1
    from public.project_closes pc
    where pc.id = close_id
      and pc.org_id = public.app_org_id()
      and pc.status = 'draft'
      and (pc.author_id = auth.uid() or public.app_is_admin())
  )
)
with check (
  exists (
    select 1
    from public.project_closes pc
    where pc.id = close_id
      and pc.org_id = public.app_org_id()
      and pc.status = 'draft'
      and (pc.author_id = auth.uid() or public.app_is_admin())
  )
);
