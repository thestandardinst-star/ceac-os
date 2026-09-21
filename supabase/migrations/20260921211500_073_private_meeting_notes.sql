-- 073 — Private meeting notes and time-aware meeting records.
--
-- Personal notes belong to their author only. Shared meeting_records now hold
-- decisions only. During-meeting writing opens at the scheduled start time.

create table public.meeting_private_notes (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meeting_sessions(id) on delete cascade,
  org_id uuid not null references public.organisations(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete restrict,
  body text not null default '' check (length(body)<=12000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(meeting_id,author_id)
);

create index meeting_private_notes_author_idx
  on public.meeting_private_notes(author_id,updated_at desc);

alter table public.meeting_private_notes enable row level security;

create policy meeting_private_notes_read on public.meeting_private_notes
for select using (
  org_id=public.app_org_id()
  and author_id=auth.uid()
);

create policy meeting_private_notes_insert on public.meeting_private_notes
for insert with check (
  auth.uid() is not null
  and org_id=public.app_org_id()
  and author_id=auth.uid()
  and exists (
    select 1
    from public.meeting_sessions m
    join public.meeting_participants mp on mp.meeting_id=m.id
    where m.id=meeting_id
      and m.org_id=public.app_org_id()
      and mp.profile_id=auth.uid()
      and now()>=m.starts_at
      and m.status<>'cancelled'
  )
);

create policy meeting_private_notes_update on public.meeting_private_notes
for update
using (
  org_id=public.app_org_id()
  and author_id=auth.uid()
)
with check (
  org_id=public.app_org_id()
  and author_id=auth.uid()
  and exists (
    select 1
    from public.meeting_sessions m
    join public.meeting_participants mp on mp.meeting_id=m.id
    where m.id=meeting_id
      and m.org_id=public.app_org_id()
      and mp.profile_id=auth.uid()
      and now()>=m.starts_at
      and m.status<>'cancelled'
  )
);

-- Preserve historical shared notes by moving each author's note history into
-- their private note before removing note rows from the shared record.
insert into public.meeting_private_notes(meeting_id,org_id,author_id,body,created_at,updated_at)
select
  meeting_id,
  org_id,
  author_id,
  string_agg(body,E'\n\n' order by created_at),
  min(created_at),
  max(created_at)
from public.meeting_records
where kind='note'
group by meeting_id,org_id,author_id
on conflict(meeting_id,author_id) do update
set body=excluded.body,
    updated_at=excluded.updated_at;

alter table public.meeting_records disable trigger meeting_records_immutable;
delete from public.meeting_records where kind='note';
alter table public.meeting_records enable trigger meeting_records_immutable;

alter table public.meeting_records drop constraint if exists meeting_records_kind_check;
alter table public.meeting_records
  add constraint meeting_records_kind_check check (kind='decision');

drop policy if exists meeting_records_read on public.meeting_records;
create policy meeting_records_read on public.meeting_records
for select using (
  org_id=public.app_org_id()
  and (
    public.app_can_manage_meeting(meeting_id)
    or exists (
      select 1 from public.meeting_participants mp
      where mp.meeting_id=meeting_records.meeting_id
        and mp.profile_id=auth.uid()
    )
  )
);

drop policy if exists meeting_records_insert on public.meeting_records;
create policy meeting_records_insert on public.meeting_records
for insert with check (
  auth.uid() is not null
  and org_id=public.app_org_id()
  and author_id=auth.uid()
  and kind='decision'
  and public.app_can_manage_meeting(meeting_id)
  and exists (
    select 1 from public.meeting_sessions m
    where m.id=meeting_id
      and m.org_id=public.app_org_id()
      and now()>=m.starts_at
      and m.status<>'cancelled'
  )
);

revoke all on public.meeting_private_notes from public,anon,authenticated;
grant select,insert,update on public.meeting_private_notes to authenticated,service_role;
