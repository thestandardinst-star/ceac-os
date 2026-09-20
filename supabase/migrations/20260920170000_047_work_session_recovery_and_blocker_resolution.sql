-- Work-session recovery and auditable blocker resolution.
-- A session from a previous Accra working day is reconciled explicitly by its
-- owner; CEAC OS never silently treats it as continuous overnight work.

alter table public.work_sessions
  add column if not exists last_confirmed_at timestamptz,
  add column if not exists corrected_by uuid references public.profiles(id) on delete set null,
  add column if not exists corrected_at timestamptz;

update public.work_sessions
set last_confirmed_at = started_at
where last_confirmed_at is null;

alter table public.work_sessions
  alter column last_confirmed_at set default now(),
  alter column last_confirmed_at set not null;

alter table public.work_sessions
  drop constraint if exists work_sessions_end_reason_check;
alter table public.work_sessions
  add constraint work_sessions_end_reason_check
  check (end_reason in ('manual','idle','auto','reconciled'));

create unique index if not exists work_sessions_one_open_per_profile
  on public.work_sessions(profile_id)
  where ended_at is null;

create table public.work_session_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete cascade,
  work_session_id uuid not null references public.work_sessions(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null check (action in ('continued','ended','reconciled')),
  effective_at timestamptz,
  note text,
  created_at timestamptz not null default now()
);

create index work_session_events_session_created_idx
  on public.work_session_events(work_session_id, created_at desc);
create index work_session_events_actor_created_idx
  on public.work_session_events(actor_id, created_at desc);

alter table public.work_session_events enable row level security;

create policy work_session_events_read on public.work_session_events
for select using (
  org_id=public.app_org_id()
  and (
    actor_id=auth.uid()
    or exists (
      select 1 from public.work_sessions s
      where s.id=work_session_events.work_session_id
        and s.profile_id=auth.uid()
    )
    or public.app_is_admin()
    or public.app_is_exec()
    or exists (
      select 1
      from public.work_sessions s
      join public.unit_memberships m on m.profile_id=s.profile_id
      where s.id=work_session_events.work_session_id
        and m.unit_id in (select public.app_managed_units())
    )
  )
);

-- Direct client mutation cannot create unaudited corrections. Staff retain
-- read/insert access to their own sessions; all endings/reconciliations use RPCs.
drop policy if exists sessions_own on public.work_sessions;
create policy sessions_own_read on public.work_sessions
for select using (profile_id=auth.uid() and org_id=public.app_org_id());
create policy sessions_own_insert on public.work_sessions
for insert with check (profile_id=auth.uid() and org_id=public.app_org_id());

create or replace function public.end_work_session(
  p_session_id uuid
)
returns public.work_sessions
language plpgsql
security definer
set search_path=public
as $$
declare
  s public.work_sessions;
begin
  if auth.uid() is null then raise exception 'Sign in to end work.'; end if;

  select * into s from public.work_sessions where id=p_session_id for update;
  if s.id is null then raise exception 'That work session does not exist.'; end if;
  if s.org_id<>public.app_org_id() or s.profile_id<>auth.uid() then
    raise exception 'You can only end your own work session.' using errcode='42501';
  end if;
  if s.ended_at is not null then raise exception 'That work session has already ended.'; end if;

  update public.work_sessions
  set ended_at=now(), end_reason='manual'
  where id=s.id
  returning * into s;

  insert into public.work_session_events(org_id,work_session_id,actor_id,action,effective_at)
  values(s.org_id,s.id,auth.uid(),'ended',s.ended_at);

  insert into public.activity_events(org_id,actor_id,verb,object_type,object_id,meta)
  values(s.org_id,auth.uid(),'session_ended','work_session',s.id,
    jsonb_build_object('effective_at',s.ended_at,'reason','manual'));

  return s;
end;
$$;

create or replace function public.reconcile_work_session(
  p_session_id uuid,
  p_action text,
  p_effective_ended_at timestamptz default null,
  p_note text default null
)
returns public.work_sessions
language plpgsql
security definer
set search_path=public
as $$
declare
  s public.work_sessions;
  v_note text:=nullif(btrim(p_note),'');
begin
  if auth.uid() is null then raise exception 'Sign in to reconcile work.'; end if;
  if p_action not in ('continue','close') then
    raise exception 'Choose continue or close.';
  end if;

  select * into s from public.work_sessions where id=p_session_id for update;
  if s.id is null then raise exception 'That work session does not exist.'; end if;
  if s.org_id<>public.app_org_id() or s.profile_id<>auth.uid() then
    raise exception 'You can only reconcile your own work session.' using errcode='42501';
  end if;
  if s.ended_at is not null then raise exception 'That work session has already ended.'; end if;

  if p_action='continue' then
    update public.work_sessions
    set last_confirmed_at=now()
    where id=s.id
    returning * into s;

    insert into public.work_session_events(org_id,work_session_id,actor_id,action,note)
    values(s.org_id,s.id,auth.uid(),'continued',v_note);

    insert into public.activity_events(org_id,actor_id,verb,object_type,object_id,meta)
    values(s.org_id,auth.uid(),'session_continued','work_session',s.id,'{}'::jsonb);
  else
    if p_effective_ended_at is null then
      raise exception 'Choose when the work session actually ended.';
    end if;
    if p_effective_ended_at<s.started_at or p_effective_ended_at>now() then
      raise exception 'The end time must be after the start and not in the future.';
    end if;

    update public.work_sessions
    set ended_at=p_effective_ended_at,
        end_reason='reconciled',
        corrected_by=auth.uid(),
        corrected_at=now()
    where id=s.id
    returning * into s;

    insert into public.work_session_events(org_id,work_session_id,actor_id,action,effective_at,note)
    values(s.org_id,s.id,auth.uid(),'reconciled',s.ended_at,v_note);

    insert into public.activity_events(org_id,actor_id,verb,object_type,object_id,meta)
    values(s.org_id,auth.uid(),'session_reconciled','work_session',s.id,
      jsonb_build_object('effective_at',s.ended_at,'note',v_note));
  end if;

  return s;
end;
$$;

revoke all on function public.end_work_session(uuid) from public,anon;
revoke all on function public.reconcile_work_session(uuid,text,timestamptz,text) from public,anon;
grant execute on function public.end_work_session(uuid) to authenticated,service_role;
grant execute on function public.reconcile_work_session(uuid,text,timestamptz,text) to authenticated,service_role;

alter table public.blockers
  add column if not exists resolved_by uuid references public.profiles(id) on delete set null,
  add column if not exists resolution_note text;

-- Blocker state changes are authoritative RPC operations. The claimant can
-- resolve their own claim; only the named unit's managers can answer it.
drop policy if exists blockers_respond on public.blockers;

create or replace function public.respond_to_blocker(
  p_blocker_id uuid,
  p_state text,
  p_note text default null
)
returns public.blockers
language plpgsql
security definer
set search_path=public
as $$
declare
  b public.blockers;
  v_note text:=nullif(btrim(p_note),'');
begin
  if auth.uid() is null then raise exception 'Sign in to answer this blocker.'; end if;
  if p_state not in ('acknowledged','disputed') then
    raise exception 'A blocker response must acknowledge or dispute the claim.';
  end if;
  if p_state='disputed' and v_note is null then
    raise exception 'Explain why the blocker is disputed.';
  end if;

  select * into b from public.blockers where id=p_blocker_id for update;
  if b.id is null then raise exception 'That blocker does not exist.'; end if;
  if b.org_id<>public.app_org_id() then raise exception 'That blocker belongs to another organisation.'; end if;
  if b.state<>'claimed' then raise exception 'That blocker claim has already been answered.'; end if;
  if not (
    b.party_unit_id in (select public.app_managed_units())
    or public.app_is_admin()
  ) then
    raise exception 'Only the named unit manager can answer this blocker.' using errcode='42501';
  end if;

  update public.blockers
  set state=p_state,
      responded_by=auth.uid(),
      response_note=v_note,
      responded_at=now()
  where id=b.id
  returning * into b;

  insert into public.activity_events(org_id,actor_id,verb,object_type,object_id,meta)
  values(b.org_id,auth.uid(),
    case when p_state='acknowledged' then 'blocker_acknowledged' else 'blocker_disputed' end,
    'work_item',b.work_item_id,
    jsonb_build_object('blocker_id',b.id,'note',v_note));

  return b;
end;
$$;

create or replace function public.resolve_blocker(
  p_blocker_id uuid,
  p_note text default null
)
returns public.blockers
language plpgsql
security definer
set search_path=public
as $$
declare
  b public.blockers;
  v_note text:=nullif(btrim(p_note),'');
begin
  if auth.uid() is null then raise exception 'Sign in to resolve this blocker.'; end if;

  select * into b from public.blockers where id=p_blocker_id for update;
  if b.id is null then raise exception 'That blocker does not exist.'; end if;
  if b.org_id<>public.app_org_id() then raise exception 'That blocker belongs to another organisation.'; end if;
  if b.state='resolved' then raise exception 'That blocker is already resolved.'; end if;
  if not (
    b.claimed_by=auth.uid()
    or public.app_can_review_item(b.work_item_id)
    or b.party_unit_id in (select public.app_managed_units())
    or public.app_is_admin()
  ) then
    raise exception 'You are not allowed to resolve this blocker.' using errcode='42501';
  end if;

  update public.blockers
  set state='resolved',
      resolved_at=now(),
      resolved_by=auth.uid(),
      resolution_note=v_note
  where id=b.id
  returning * into b;

  if not exists (
    select 1 from public.blockers other
    where other.work_item_id=b.work_item_id
      and other.id<>b.id
      and other.state in ('claimed','acknowledged')
  ) then
    update public.work_items
    set status='in_progress', last_movement_at=now()
    where id=b.work_item_id and status='waiting_on';
  end if;

  insert into public.activity_events(org_id,actor_id,verb,object_type,object_id,meta)
  values(b.org_id,auth.uid(),'blocker_resolved','work_item',b.work_item_id,
    jsonb_build_object('blocker_id',b.id,'note',v_note));

  return b;
end;
$$;

revoke all on function public.respond_to_blocker(uuid,text,text) from public,anon;
revoke all on function public.resolve_blocker(uuid,text) from public,anon;
grant execute on function public.respond_to_blocker(uuid,text,text) to authenticated,service_role;
grant execute on function public.resolve_blocker(uuid,text) to authenticated,service_role;
