begin;

revoke all on table public.objective_ref_counters from anon, authenticated;
revoke all on table public.work_ref_counters from anon, authenticated;

commit;
