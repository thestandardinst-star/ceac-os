revoke execute on function public.app_can_review_item(uuid) from public, anon;
revoke execute on function public.app_can_see_item(uuid) from public, anon;
revoke execute on function public.app_is_admin() from public, anon;
revoke execute on function public.app_is_exec() from public, anon;
revoke execute on function public.app_led_sub_teams() from public, anon;
revoke execute on function public.app_managed_units() from public, anon;
revoke execute on function public.app_my_units() from public, anon;
revoke execute on function public.app_org_id() from public, anon;
revoke execute on function public.app_visible_projects() from public, anon;

grant execute on function public.app_can_review_item(uuid) to authenticated, service_role;
grant execute on function public.app_can_see_item(uuid) to authenticated, service_role;
grant execute on function public.app_is_admin() to authenticated, service_role;
grant execute on function public.app_is_exec() to authenticated, service_role;
grant execute on function public.app_led_sub_teams() to authenticated, service_role;
grant execute on function public.app_managed_units() to authenticated, service_role;
grant execute on function public.app_my_units() to authenticated, service_role;
grant execute on function public.app_org_id() to authenticated, service_role;
grant execute on function public.app_visible_projects() to authenticated, service_role;

revoke execute on function public.guard_profile_self_update() from public, anon, authenticated;
