-- A narrow staff-facing view of approved absence for their own unit.
-- Reasons, decision notes and balances remain private to the employee,
-- their manager and Administration under the existing leave policies.

create or replace function public.list_unit_approved_leave(
  p_unit_id uuid,
  p_from date,
  p_to date
)
returns table (
  leave_request_id uuid,
  profile_id uuid,
  full_name text,
  kind text,
  start_date date,
  end_date date
)
language plpgsql
stable
security definer
set search_path=public
as $$
begin
  if auth.uid() is null then
    raise exception 'Sign in to view unit leave.' using errcode='42501';
  end if;
  if p_from is null or p_to is null or p_to<p_from or p_to>p_from+interval '92 days' then
    raise exception 'Choose a valid date window of up to 93 days.';
  end if;
  if not (
    p_unit_id in (select public.app_my_units())
    or p_unit_id in (select public.app_managed_units())
    or public.app_is_admin()
    or public.app_is_exec()
  ) then
    raise exception 'That unit is not available to you.' using errcode='42501';
  end if;

  return query
  select distinct lr.id,lr.profile_id,p.full_name,lr.kind,lr.start_date,lr.end_date
  from public.leave_requests lr
  join public.profiles p on p.id=lr.profile_id
  join public.unit_memberships m on m.profile_id=lr.profile_id and m.unit_id=p_unit_id
  join public.units u on u.id=m.unit_id
  where lr.org_id=public.app_org_id()
    and u.org_id=lr.org_id
    and lr.status='approved'
    and lr.start_date<=p_to
    and lr.end_date>=p_from
  order by lr.start_date,p.full_name;
end;
$$;

revoke execute on function public.list_unit_approved_leave(uuid,date,date) from public,anon;
grant execute on function public.list_unit_approved_leave(uuid,date,date) to authenticated,service_role;
