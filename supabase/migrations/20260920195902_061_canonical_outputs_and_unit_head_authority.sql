
create or replace view public.completed_outputs
with (security_invoker=true)
as
select
  id,org_id,ref,kind,unit_id,sub_team_id,project_id,objective_id,phase_id,
  assignee_id,assigned_by,title,origin,visibility,status,due_at,completed_at,
  first_time_approved,created_at
from public.work_items
where kind in ('task','deliverable')
  and status in ('completed','self_certified')
  and completed_at is not null;

revoke all on public.completed_outputs from public,anon;
grant select on public.completed_outputs to authenticated,service_role;

create or replace function public.assign_unit_head(
  p_unit_id uuid,
  p_profile_id uuid
)
returns void
language plpgsql
security definer
set search_path=public
as $$
declare
  v_org uuid;
  v_old_head uuid;
begin
  if auth.uid() is null or not public.app_is_admin() then
    raise exception 'Only Administration & HR can assign a Unit Head.'
      using errcode='42501';
  end if;

  v_org:=public.app_org_id();

  if not exists (
    select 1 from public.units
    where id=p_unit_id and org_id=v_org and active
  ) then
    raise exception 'That unit is not an active unit in your organisation.'
      using errcode='42501';
  end if;

  if not exists (
    select 1
    from public.unit_memberships um
    join public.profiles p on p.id=um.profile_id
    where um.unit_id=p_unit_id
      and um.profile_id=p_profile_id
      and um.org_id=v_org
      and p.org_id=v_org
      and p.active
  ) then
    raise exception 'The person must already be an active member of that unit.'
      using errcode='42501';
  end if;

  select profile_id into v_old_head
  from public.unit_memberships
  where org_id=v_org and unit_id=p_unit_id and role='manager'
  order by created_at
  limit 1
  for update;

  update public.unit_memberships
  set role='staff'
  where org_id=v_org
    and unit_id=p_unit_id
    and role='manager'
    and profile_id<>p_profile_id;

  update public.unit_memberships
  set role='manager'
  where org_id=v_org
    and unit_id=p_unit_id
    and profile_id=p_profile_id;

  insert into public.activity_events(org_id,actor_id,verb,object_type,object_id,meta)
  values(
    v_org,auth.uid(),'unit_head_assigned','unit',p_unit_id,
    jsonb_build_object('profile_id',p_profile_id,'previous_head_id',v_old_head)
  );
end;
$$;

revoke all on function public.assign_unit_head(uuid,uuid) from public,anon;
grant execute on function public.assign_unit_head(uuid,uuid) to authenticated,service_role;
