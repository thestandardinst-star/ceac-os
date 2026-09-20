alter function public.app_check_blockers() set search_path = public;
alter function public.app_check_gone_quiet() set search_path = public;
alter function public.app_check_overdue() set search_path = public;
alter function public.app_heartbeat() set search_path = public;
alter function public.app_run_daily() set search_path = public;

revoke execute on function public.app_check_blockers() from public, anon, authenticated;
revoke execute on function public.app_check_gone_quiet() from public, anon, authenticated;
revoke execute on function public.app_check_overdue() from public, anon, authenticated;
revoke execute on function public.app_heartbeat() from public, anon, authenticated;
revoke execute on function public.app_run_daily() from public, anon, authenticated;

grant execute on function public.app_check_blockers() to service_role;
grant execute on function public.app_check_gone_quiet() to service_role;
grant execute on function public.app_check_overdue() to service_role;
grant execute on function public.app_heartbeat() to service_role;
grant execute on function public.app_run_daily() to service_role;

alter function public.test_as(text) set search_path = public;
revoke execute on function public.test_as(text) from public, anon, authenticated;
grant execute on function public.test_as(text) to service_role;

alter function public.work_item_carried_over(public.work_items) set search_path = public;
revoke execute on function public.work_item_carried_over(public.work_items) from anon;
