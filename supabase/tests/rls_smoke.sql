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

insert into public.project_units(project_id,unit_id,role)
values(
  '49000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000012',
  'participant'
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

insert into public.meeting_participants(meeting_id,profile_id,role,source_type,source_id,invited_by)
values
(
  '4a000000-0000-4000-8000-000000000001',
  '31000000-0000-4000-8000-000000000002',
  'organiser','organiser',null,
  '31000000-0000-4000-8000-000000000002'
),
(
  '4a000000-0000-4000-8000-000000000001',
  '31000000-0000-4000-8000-000000000001',
  'participant','selected',
  '31000000-0000-4000-8000-000000000001',
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

  declare
    v_sub_room uuid;
    v_sub_message uuid;
  begin
    select id into v_sub_room
    from public.rooms
    where kind='sub_team'
      and sub_team_id='22000000-0000-4000-8000-000000000011'::uuid;

    if v_sub_room is null then
      raise exception 'Rooms failure: Staff sub-team Room was not bootstrapped or visible.';
    end if;

    v_sub_message:=public.send_room_message(
      v_sub_room,
      'Sub-team Room acceptance message',
      null,
      '[]'::jsonb,
      array['31000000-0000-4000-8000-000000000002'::uuid]
    );
    if v_sub_message is null then
      raise exception 'Rooms failure: Staff could not send in their Sub-team Room.';
    end if;

    begin
      perform public.send_room_message(
        v_sub_room,
        'Invalid sub-team mention',
        null,
        '[]'::jsonb,
        array['31000000-0000-4000-8000-000000000006'::uuid]
      );
      raise exception 'Rooms failure: non-member mention was accepted in Sub-team Room.';
    exception when others then
      if sqlerrm='Rooms failure: non-member mention was accepted in Sub-team Room.' then raise; end if;
    end;
  end;

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

do $$
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
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000006',true);

do $subteam_same_unit$
declare
  v_count integer;
begin
  select count(*) into v_count
  from public.rooms
  where kind='sub_team'
    and sub_team_id='22000000-0000-4000-8000-000000000011'::uuid;
  if v_count<>0 then
    raise exception 'Rooms RLS failure: same-unit non-member can read Sub-team Room.';
  end if;
end
$subteam_same_unit$;

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

do $meeting_schedule_manager$
declare
  v_selected uuid;
  v_project_managers uuid;
begin
  begin
    insert into public.meeting_sessions(
      org_id,scope,unit_id,title,starts_at,provider,created_by
    ) values(
      '10000000-0000-4000-8000-000000000010',
      'unit',
      '20000000-0000-4000-8000-000000000011',
      'Direct meeting bypass',
      now()+interval '2 days',
      'zoom',
      '31000000-0000-4000-8000-000000000002'
    );
    raise exception 'Meeting security failure: Manager directly inserted meeting_sessions.';
  exception when insufficient_privilege then null;
  end;

  v_selected:=public.schedule_meeting(
    'unit',
    '20000000-0000-4000-8000-000000000011',
    null,
    'Selected Audience Security Fixture',
    'Only the selected Staff member should see this.',
    now()+interval '2 days',
    now()+interval '2 days 1 hour',
    'zoom',
    'https://zoom.us/j/111111111',
    null,
    jsonb_build_array(jsonb_build_object(
      'type','selected',
      'id','31000000-0000-4000-8000-000000000001'
    ))
  );

  if v_selected is null then
    raise exception 'Meeting failure: schedule_meeting did not return an id.';
  end if;

  v_project_managers:=public.schedule_meeting(
    'project',
    null,
    '49000000-0000-4000-8000-000000000001',
    'Project Managers Security Fixture',
    'Managers from collaborating project units.',
    now()+interval '3 days',
    now()+interval '3 days 1 hour',
    'zoom',
    'https://zoom.us/j/222222222',
    null,
    jsonb_build_array(jsonb_build_object(
      'type','project_managers',
      'id','49000000-0000-4000-8000-000000000001'
    ))
  );

  if v_project_managers is null then
    raise exception 'Meeting failure: project-manager meeting was not created.';
  end if;
end
$meeting_schedule_manager$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000001',true);

do $meeting_selected_staff$
declare n integer;
begin
  select count(*) into n
  from public.meeting_sessions
  where title='Selected Audience Security Fixture';
  if n<>1 then
    raise exception 'Meeting audience failure: selected Staff participant cannot see meeting.';
  end if;
end
$meeting_selected_staff$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000006',true);

do $meeting_omitted_staff$
declare n integer;
begin
  select count(*) into n
  from public.meeting_sessions
  where title='Selected Audience Security Fixture';
  if n<>0 then
    raise exception 'Meeting audience failure: omitted same-unit Staff can see selected meeting.';
  end if;
end
$meeting_omitted_staff$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000007',true);

do $meeting_project_manager$
declare n integer;
begin
  select count(*) into n
  from public.meeting_sessions
  where title='Project Managers Security Fixture';
  if n<>1 then
    raise exception 'Meeting audience failure: collaborating unit Manager cannot see project-manager meeting.';
  end if;
end
$meeting_project_manager$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000005',true);

do $meeting_project_staff_omitted$
declare n integer;
begin
  select count(*) into n
  from public.meeting_sessions
  where title='Project Managers Security Fixture';
  if n<>0 then
    raise exception 'Meeting audience failure: non-manager project-unit Staff can see manager-only meeting.';
  end if;
end
$meeting_project_staff_omitted$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000002',true);

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
