-- Found while auditing grants for the report RPCs: fifteen functions from
-- the original migrations still grant EXECUTE to anon. Not reported by
-- Codex — it only checked the four new ones.
--
-- The job functions are the ones that matter: they write alerts and job
-- runs, so an unauthenticated caller could trigger real work. Revoked.
--
-- The read-only helpers (app_org_id, app_is_admin, app_can_see_item and
-- friends) are deliberately left alone. They are called from inside RLS
-- policies, and removing anon's execute would turn a clean empty result
-- into a permission error on any unauthenticated read. They return
-- nothing useful without a session: auth.uid() is null, so app_org_id()
-- is null and every check collapses to false.

revoke execute on function app_run_daily()        from anon, public;
revoke execute on function app_heartbeat()        from anon, public;
revoke execute on function app_check_gone_quiet() from anon, public;
revoke execute on function app_check_overdue()    from anon, public;
revoke execute on function app_check_blockers()   from anon, public;
revoke execute on function handle_new_user()      from anon, public;

grant execute on function app_run_daily()        to service_role;
grant execute on function app_heartbeat()        to service_role;
grant execute on function app_check_gone_quiet() to service_role;
grant execute on function app_check_overdue()    to service_role;
grant execute on function app_check_blockers()   to service_role;
