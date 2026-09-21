-- Participant-aware Meeting authority checks for migration 072.
-- This file is intended for the local role/RLS gate.

begin;

do $gate$
declare
  n integer;
begin
  if not exists (
    select 1
    from pg_proc p
    join pg_namespace nsp on nsp.oid=p.pronamespace
    where nsp.nspname='public'
      and p.proname='app_can_manage_meeting'
      and p.prosecdef
      and position('search_path=public' in lower(array_to_string(p.proconfig,','))) > 0
  ) then
    raise exception 'Meeting authority gate failure: app_can_manage_meeting is missing or not hardened.';
  end if;

  select count(*) into n
  from pg_policies
  where schemaname='public'
    and tablename in ('meeting_sessions','meeting_records','meeting_work_links')
    and policyname in ('meeting_sessions_update','meeting_records_insert','meeting_work_links_insert');
  if n<>3 then
    raise exception 'Meeting authority gate failure: expected 3 participant-aware Meeting policies, found %.',n;
  end if;
end
$gate$;

rollback;
