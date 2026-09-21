\set ON_ERROR_STOP on

begin;

-- Contextual Rooms test project. Unit Rooms are created by the unit trigger
-- when the quality-gate fixture units are inserted.
insert into public.projects(
  id,org_id,kind,lead_unit_id,name,purpose,status,created_by
) values(
  '49000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000010',
  'project',
  '20000000-0000-4000-8000-000000000011',
  'Rooms Security Fixture',
  'RLS acceptance only',
  'active',
  '31000000-0000-4000-8000-000000000002'
);

insert into public.meeting_sessions(
  id,org_id,scope,unit_id,title,agenda,starts_at,ends_at,provider,join_url,created_by
) values(
  '4a000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000010',
  'unit',
  '20000000-0000-4000-8000-000000000011',
  'Unit Meeting Security Fixture',
  'RLS acceptance only',
  now()+interval '1 day',
  now()+interval '1 day 1 hour',
  'zoom',
  'https://zoom.us/j/123456789',
  '31000000-0000-4000-8000-000000000002'
);

set local role authenticated;
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000001',true);

do $$
begin
  if exists (
    select 1 from public.profiles
    where id='31000000-0000-4000-8000-000000000005'::uuid
  ) then
    raise exception 'RLS failure: Staff can see unrelated-unit profile.';
  end if;
end $$;

do $rooms_staff$
declare
  v_unit_room uuid;
  v_project_room uuid;
  v_message uuid;
begin
  select id into v_unit_room
  from public.rooms
  where kind='unit' and unit_id='20000000-0000-4000-8000-000000000011'::uuid;

  select id into v_project_room
  from public.rooms
  where kind='project' and project_id='49000000-0000-4000-8000-000000000001'::uuid;

  if v_unit_room is null or v_project_room is null then
    raise exception 'Rooms failure: expected Unit and Project Rooms were not bootstrapped.';
  end if;

  v_message:=public.send_room_message(v_unit_room,'Unit Room acceptance message');
  if v_message is null then
    raise exception 'Rooms failure: Staff could not send to their Unit Room.';
  end if;

  perform public.send_room_message(
    v_project_room,
    'Project Room acceptance message',
    null,
    jsonb_build_array(jsonb_build_object(
      'object_type','project',
      'object_id','49000000-0000-4000-8000-000000000001',
      'label','Rooms Security Fixture'
    )),
    array['31000000-0000-4000-8000-000000000002'::uuid]
  );

  perform public.mark_room_read(v_unit_room);

  begin
    insert into public.room_messages(room_id,org_id,author_id,body)
    values(
      v_unit_room,
      '10000000-0000-4000-8000-000000000010',
      '31000000-0000-4000-8000-000000000001',
      'Direct write bypass'
    );
    raise exception 'Rooms failure: Staff inserted a Room message without the RPC.';
  exception when insufficient_privilege then null;
  end;
end
$rooms_staff$;

do $$
begin
  begin
    insert into public.activity_events(org_id,actor_id,verb,object_type,object_id)
    values(
      '10000000-0000-4000-8000-000000000010',
      '31000000-0000-4000-8000-000000000001',
      'forged','work_item',gen_random_uuid()
    );
    raise exception 'RLS failure: Staff inserted activity event.';
  exception when insufficient_privilege then null;
  end;
end $$;

do $meeting_staff$
declare
  v_meeting uuid:='4a000000-0000-4000-8000-000000000001'::uuid;
  v_count integer;
begin
  -- Same-unit Staff may see the meeting and add a factual note.
  insert into public.meeting_records(meeting_id,org_id,kind,body,author_id)
  values(
    v_meeting,
    '10000000-0000-4000-8000-000000000010',
    'note',
    'Staff factual meeting note',
    '31000000-0000-4000-8000-000000000001'
  );

  select count(*) into v_count from public.meeting_sessions where id=v_meeting;
  if v_count<>1 then
    raise exception 'Meeting RLS failure: same-unit Staff cannot read their Unit meeting.';
  end if;

  begin
    insert into public.meeting_records(meeting_id,org_id,kind,body,author_id)
    values(
      v_meeting,
      '10000000-0000-4000-8000-000000000010',
      'decision',
      'Staff forged decision',
      '31000000-0000-4000-8000-000000000001'
    );
    raise exception 'Meeting RLS failure: Staff recorded a Manager-level decision.';
  exception when insufficient_privilege then null;
  end;
end
$meeting_staff$;

do $
begin
  begin
    insert into public.pending_invitations(org_id,email,full_name,unit_id,role,invited_by,expires_at)
    values(
      '10000000-0000-4000-8000-000000000010',
      'forged@example.invalid','Forged',
      '20000000-0000-4000-8000-000000000011','staff',
      '31000000-0000-4000-8000-000000000001',now()+interval '1 day'
    );
    raise exception 'RLS failure: Staff inserted invitation directly.';
  exception when insufficient_privilege then null;
  end;
end $$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000005',true);

do $meeting_other_unit$
declare
  v_count integer;
begin
  select count(*) into v_count
  from public.meeting_sessions
  where id='4a000000-0000-4000-8000-000000000001'::uuid;
  if v_count<>0 then
    raise exception 'Meeting RLS failure: unrelated-unit Staff can read another Unit meeting.';
  end if;
end
$meeting_other_unit$;

do $rooms_other_unit$
declare
  v_unit_room uuid;
  v_hidden_count integer;
begin
  select id into v_unit_room
  from public.rooms
  where kind='unit' and unit_id='20000000-0000-4000-8000-000000000011'::uuid;

  select count(*) into v_hidden_count
  from public.rooms
  where id=v_unit_room;

  if v_hidden_count<>0 then
    raise exception 'Rooms RLS failure: unrelated-unit Staff can read another Unit Room.';
  end if;

  begin
    perform public.send_room_message(v_unit_room,'Cross-unit write attempt');
    raise exception 'Rooms RLS failure: unrelated-unit Staff sent to another Unit Room.';
  exception
    when insufficient_privilege then null;
  end;
end
$rooms_other_unit$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000002',true);

do $meeting_manager$
declare
  v_meeting uuid:='4a000000-0000-4000-8000-000000000001'::uuid;
begin
  update public.meeting_sessions
  set agenda='Updated by the Unit Head'
  where id=v_meeting;

  insert into public.meeting_records(meeting_id,org_id,kind,body,author_id)
  values(
    v_meeting,
    '10000000-0000-4000-8000-000000000010',
    'decision',
    'Manager decision recorded',
    '31000000-0000-4000-8000-000000000002'
  );
end
$meeting_manager$;

do $
begin
  begin
    perform public.create_pending_invitation(
      'escalation@example.invalid','Escalation Attempt',
      '20000000-0000-4000-8000-000000000011','manager'
    );
    raise exception 'Authority failure: Manager invitation created Manager.';
  exception when insufficient_privilege then null;
  end;
end $$;

do $$
begin
  begin
    perform public.assign_unit_head(
      '20000000-0000-4000-8000-000000000011',
      '31000000-0000-4000-8000-000000000001'
    );
    raise exception 'Authority failure: Manager assigned Unit Head.';
  exception when insufficient_privilege then null;
  end;
end $$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000004',true);

do $$
begin
  begin
    perform public.assign_unit_head(
      '20000000-0000-4000-8000-000000000011',
      '31000000-0000-4000-8000-000000000001'
    );
    raise exception 'Authority failure: Executive assigned Unit Head.';
  exception when insufficient_privilege then null;
  end;
end $$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000003',true);
select public.assign_unit_head(
  '20000000-0000-4000-8000-000000000011',
  '31000000-0000-4000-8000-000000000001'
);

do $$
begin
  if not exists (
    select 1 from public.unit_memberships
    where unit_id='20000000-0000-4000-8000-000000000011'::uuid
      and profile_id='31000000-0000-4000-8000-000000000001'::uuid
      and role='manager'
  ) then
    raise exception 'Authority failure: Admin assignment did not persist in transaction.';
  end if;
end $$;

rollback;

select 'RLS role smoke tests passed' as result;
