-- Participant-aware Meeting authority and private-notes checks through migration 073.
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
    and (
      (tablename in ('meeting_sessions','meeting_records','meeting_work_links')
       and policyname in ('meeting_sessions_update','meeting_records_insert','meeting_work_links_insert'))
      or
      (tablename='meeting_private_notes'
       and policyname in ('meeting_private_notes_read','meeting_private_notes_insert','meeting_private_notes_update'))
    );
  if n<>6 then
    raise exception 'Meeting authority gate failure: expected 6 Meeting/private-note policies, found %.',n;
  end if;

  if not exists (
    select 1 from information_schema.tables
    where table_schema='public' and table_name='meeting_private_notes'
  ) then
    raise exception 'Meeting authority gate failure: private meeting-note storage is missing.';
  end if;

  if not exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid=c.conrelid
    join pg_namespace nsp on nsp.oid=t.relnamespace
    where nsp.nspname='public'
      and t.relname='meeting_records'
      and c.conname='meeting_records_kind_check'
      and pg_get_constraintdef(c.oid) like '%decision%'
  ) then
    raise exception 'Meeting authority gate failure: shared Meeting records are not decision-only.';
  end if;

  if exists (
    select 1 from public.meeting_records where kind<>'decision'
  ) then
    raise exception 'Meeting authority gate failure: a shared non-decision Meeting record remains.';
  end if;
end
$gate$;

rollback;
