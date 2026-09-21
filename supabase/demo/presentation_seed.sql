-- CEAC OS presentation fixtures.
-- NOT a migration. Run deliberately with elevated database access only.
-- Every row is visibly marked "Demo ·" and can be removed with presentation_cleanup.sql.

do $$
declare
  v_org uuid;
  v_exec uuid;
  v_media uuid;
  v_announcement uuid;
  v_meeting uuid;
begin
  select id into v_org from public.organisations order by created_at limit 1;
  select id into v_exec
  from public.profiles
  where org_id=v_org and is_exec and active
  order by created_at limit 1;
  select id into v_media
  from public.units
  where org_id=v_org and active and lower(name) like '%media%'
  order by position nulls last,name limit 1;

  if v_org is null or v_exec is null then
    raise exception 'Presentation seed requires an organisation and active Executive profile.';
  end if;

  select id into v_announcement
  from public.announcements
  where org_id=v_org and title='Demo · Sunday Service Coordination'
  limit 1;

  if v_announcement is null then
    insert into public.announcements(
      org_id,author_id,title,body,priority,status,requires_acknowledgement,published_at,expires_at
    ) values(
      v_org,v_exec,
      'Demo · Sunday Service Coordination',
      'For presentation: teams should confirm Sunday service readiness, outstanding dependencies and any support needed before the final coordination window. This is demonstration data for CEAC OS.',
      'important','published',false,now(),now()+interval '14 days'
    ) returning id into v_announcement;

    insert into public.announcement_audiences(announcement_id,audience_type)
    values(v_announcement,'organisation');
  end if;

  if v_media is not null then
    select id into v_meeting
    from public.meeting_sessions
    where org_id=v_org and title='Demo · Sunday Service Readiness'
    limit 1;

    if v_meeting is null then
      insert into public.meeting_sessions(
        org_id,scope,unit_id,title,agenda,starts_at,ends_at,provider,join_url,status,created_by
      ) values(
        v_org,'unit',v_media,
        'Demo · Sunday Service Readiness',
        'Confirm technical readiness, media coverage, unresolved dependencies and owners for final actions. Presentation fixture.',
        date_trunc('day',now())+interval '1 day 16 hours',
        date_trunc('day',now())+interval '1 day 17 hours',
        'external','https://example.com/ceac-demo-meeting','scheduled',v_exec
      ) returning id into v_meeting;

      insert into public.meeting_participants(meeting_id,profile_id,role,source_type,source_id,invited_by)
      select v_meeting,p.id,
             case when p.id=v_exec then 'organiser' else 'participant' end,
             case when p.id=v_exec then 'organiser' else 'unit' end,
             case when p.id=v_exec then null else v_media end,
             v_exec
      from public.profiles p
      where p.org_id=v_org
        and p.active
        and (
          p.id=v_exec
          or exists(
            select 1 from public.unit_memberships um
            where um.profile_id=p.id and um.unit_id=v_media
          )
        )
      on conflict(meeting_id,profile_id) do nothing;
    end if;
  end if;
end;
$$;
