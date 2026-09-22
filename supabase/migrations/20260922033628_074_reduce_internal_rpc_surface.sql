-- 074 — Reduce direct authenticated access to internal privileged helpers.
--
-- These SECURITY DEFINER functions are implementation helpers used by
-- browser-facing RPCs or background privileged routines. They do not need to
-- be directly executable through PostgREST by the authenticated browser role.
--
-- Keep service_role execution. Function owners retain implicit execution
-- ability required by SECURITY DEFINER callers.

revoke execute on function public.app_can_publish_announcements() from authenticated;
revoke execute on function public.app_threshold(uuid,text,numeric) from authenticated;
revoke execute on function public.next_close_version(uuid,text,uuid) from authenticated;
revoke execute on function public.next_work_ref(uuid,uuid) from authenticated;
revoke execute on function public.submit_project_close(uuid) from authenticated;
revoke execute on function public.submit_report(uuid,jsonb) from authenticated;

grant execute on function public.app_can_publish_announcements() to service_role;
grant execute on function public.app_threshold(uuid,text,numeric) to service_role;
grant execute on function public.next_close_version(uuid,text,uuid) to service_role;
grant execute on function public.next_work_ref(uuid,uuid) to service_role;
grant execute on function public.submit_project_close(uuid) to service_role;
grant execute on function public.submit_report(uuid,jsonb) to service_role;
