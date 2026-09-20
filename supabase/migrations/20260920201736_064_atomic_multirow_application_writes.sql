
-- Transaction-safe application write paths for multi-row operations.

create or replace function public.create_task_with_checklist(
  p_unit_id uuid,
  p_assignee_id uuid,
  p_title text,
  p_expected_outcome text,
  p_sub_team_id uuid default null,
  p_project_id uuid default null,
  p_objective_id uuid default null,
  p_phase_id uuid default null,
  p_purpose text default null,
  p_instructions text default null,
  p_due_at timestamptz default null,
  p_origin text default 'assigned',
  p_visibility text default 'unit',
  p_steps text[] default '{}'::text[]
)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_org uuid:=public.app_org_id();
  v_ref text;
  v_id uuid:=gen_random_uuid();
  v_step text;
  v_pos int:=0;
begin
  if auth.uid() is null then raise exception 'Sign in to create work.' using errcode='42501'; end if;
  if v_org is null then raise exception 'Your organisation could not be identified.' using errcode='42501'; end if;
  if nullif(btrim(coalesce(p_title,'')),'') is null then raise exception 'Enter what needs to happen.'; end if;
  if nullif(btrim(coalesce(p_expected_outcome,'')),'') is null then raise exception 'Enter the expected result.'; end if;
  if p_origin not in ('assigned','self_created') then raise exception 'Unsupported Task origin.'; end if;
  if p_visibility not in ('unit','private') then raise exception 'Unsupported visibility.'; end if;

  if not exists(select 1 from public.units u where u.id=p_unit_id and u.org_id=v_org and u.active) then
    raise exception 'That unit is not active in your organisation.' using errcode='42501';
  end if;

  if p_origin='self_created' then
    if p_assignee_id<>auth.uid() then raise exception 'Self-created work must belong to you.' using errcode='42501'; end if;
    if not exists(select 1 from public.unit_memberships um where um.unit_id=p_unit_id and um.profile_id=auth.uid() and um.org_id=v_org) then
      raise exception 'You are not a member of that unit.' using errcode='42501';
    end if;
  else
    if not (p_unit_id in(select public.app_managed_units()) or public.app_is_admin()) then
      raise exception 'Only the Unit Head can assign this Task.' using errcode='42501';
    end if;
    if not exists(
      select 1 from public.unit_memberships um join public.profiles p on p.id=um.profile_id
      where um.unit_id=p_unit_id and um.profile_id=p_assignee_id and um.org_id=v_org and p.active
    ) then raise exception 'The assignee is not an active member of this unit.' using errcode='42501'; end if;
    if p_visibility='private' then raise exception 'Assigned work cannot be private.' using errcode='42501'; end if;
  end if;

  if p_sub_team_id is not null and not exists(
    select 1 from public.sub_teams s where s.id=p_sub_team_id and s.unit_id=p_unit_id and s.org_id=v_org and s.active
  ) then raise exception 'That team part does not belong to this unit.'; end if;

  if p_project_id is not null then
    if not exists(
      select 1 from public.projects p
      where p.id=p_project_id and p.org_id=v_org and p.status in ('planned','active')
        and (p.lead_unit_id=p_unit_id or exists(select 1 from public.project_units pu where pu.project_id=p.id and pu.unit_id=p_unit_id))
    ) then raise exception 'That project is not active for this unit.'; end if;
  elsif p_objective_id is not null or p_phase_id is not null then
    raise exception 'Objective or phase requires a project.';
  end if;

  if p_objective_id is not null and not exists(
    select 1 from public.objectives o where o.id=p_objective_id and o.project_id=p_project_id and o.unit_id=p_unit_id
  ) then raise exception 'That objective does not belong to this unit and project.'; end if;

  if p_phase_id is not null and not exists(
    select 1 from public.project_phases ph where ph.id=p_phase_id and ph.project_id=p_project_id
  ) then raise exception 'That phase does not belong to this project.'; end if;

  v_ref:=public.next_work_ref(p_unit_id,p_sub_team_id);

  insert into public.work_items(
    id,org_id,ref,kind,unit_id,sub_team_id,project_id,objective_id,phase_id,
    assignee_id,assigned_by,title,purpose,instructions,expected_outcome,
    original_due_at,due_at,origin,visibility,status
  ) values(
    v_id,v_org,v_ref,'task',p_unit_id,p_sub_team_id,p_project_id,p_objective_id,p_phase_id,
    p_assignee_id,auth.uid(),btrim(p_title),nullif(btrim(coalesce(p_purpose,'')),''),
    nullif(btrim(coalesce(p_instructions,'')),''),btrim(p_expected_outcome),
    p_due_at,p_due_at,p_origin,p_visibility,'not_started'
  );

  foreach v_step in array coalesce(p_steps,'{}'::text[]) loop
    if nullif(btrim(v_step),'') is not null then
      v_pos:=v_pos+1;
      insert into public.checklist_items(work_item_id,label,position)
      values(v_id,btrim(v_step),v_pos);
    end if;
  end loop;

  insert into public.activity_events(org_id,actor_id,verb,object_type,object_id,meta)
  values(v_org,auth.uid(),'work_created','work_item',v_id,
    jsonb_build_object('kind','task','origin',p_origin,'assignee_id',p_assignee_id,'checklist_count',v_pos));

  return jsonb_build_object('id',v_id,'ref',v_ref);
end;
$$;

create or replace function public.submit_work_for_review(
  p_work_item_id uuid,
  p_session_id uuid default null,
  p_note text default null,
  p_link text default null
)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  w public.work_items;
  v_submission uuid;
  v_link text:=nullif(btrim(coalesce(p_link,'')),'');
begin
  if auth.uid() is null then raise exception 'Sign in to submit work.' using errcode='42501'; end if;
  select * into w from public.work_items where id=p_work_item_id for update;
  if w.id is null then raise exception 'That work item does not exist.'; end if;
  if w.org_id<>public.app_org_id() or w.assignee_id<>auth.uid() then
    raise exception 'Only the assignee can submit this work.' using errcode='42501';
  end if;
  if w.kind not in ('task','meeting_outcome','deliverable') then
    raise exception 'This work type does not use the review submission flow.';
  end if;
  if w.status not in ('not_started','in_progress','returned') then
    raise exception 'This work is not currently ready to submit.';
  end if;

  if w.kind='task' and exists(
    select 1 from public.checklist_items ci
    where ci.work_item_id=w.id
      and not exists(
        select 1 from public.checklist_ticks ct
        where ct.checklist_item_id=ci.id and ct.profile_id=auth.uid() and ct.undone_at is null
      )
  ) then raise exception 'Complete the Task checklist before submitting.'; end if;

  if w.kind='deliverable'
     and coalesce((select wd.evidence_required from public.work_deliverables wd where wd.work_item_id=w.id),false)
     and v_link is null
  then raise exception 'This Deliverable requires evidence before submission.'; end if;

  if p_session_id is not null and not exists(
    select 1 from public.work_sessions ws where ws.id=p_session_id and ws.profile_id=auth.uid()
  ) then raise exception 'That work session does not belong to you.' using errcode='42501'; end if;

  insert into public.submissions(org_id,work_item_id,profile_id,session_id,note,outside_session)
  values(w.org_id,w.id,auth.uid(),p_session_id,nullif(btrim(coalesce(p_note,'')),''),p_session_id is null)
  returning id into v_submission;

  if v_link is not null then
    insert into public.submission_files(submission_id,kind,url)
    values(v_submission,'link',v_link);
  end if;

  update public.work_items set status='in_review',last_movement_at=now() where id=w.id;

  insert into public.activity_events(org_id,actor_id,verb,object_type,object_id,meta)
  values(w.org_id,auth.uid(),'work_submitted','work_item',w.id,
    jsonb_build_object('submission_id',v_submission,'has_link',v_link is not null));

  return v_submission;
end;
$$;

create or replace function public.raise_work_blocker(
  p_work_item_id uuid,
  p_party_unit_id uuid default null,
  p_party_text text default null,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  w public.work_items;
  v_id uuid;
  v_party text:=nullif(btrim(coalesce(p_party_text,'')),'');
begin
  if auth.uid() is null then raise exception 'Sign in to record a blocker.' using errcode='42501'; end if;
  select * into w from public.work_items where id=p_work_item_id for update;
  if w.id is null then raise exception 'That work item does not exist.'; end if;
  if w.org_id<>public.app_org_id() then raise exception 'That work belongs to another organisation.' using errcode='42501'; end if;
  if not (w.assignee_id=auth.uid() or w.unit_id in(select public.app_managed_units()) or public.app_is_admin()) then
    raise exception 'You are not allowed to mark this work as blocked.' using errcode='42501';
  end if;
  if w.status in ('completed','self_certified','cancelled','in_review') then raise exception 'This work cannot be marked waiting in its current state.'; end if;
  if p_party_unit_id is null and v_party is null then raise exception 'Say who or which unit you are waiting on.'; end if;
  if p_party_unit_id is not null and not exists(select 1 from public.units u where u.id=p_party_unit_id and u.org_id=w.org_id and u.active) then
    raise exception 'That unit is not active in this organisation.';
  end if;
  if exists(select 1 from public.blockers b where b.work_item_id=w.id and b.state in ('claimed','acknowledged')) then
    raise exception 'This work already has an unresolved blocker.';
  end if;

  insert into public.blockers(org_id,work_item_id,claimed_by,party_unit_id,party_text,note)
  values(w.org_id,w.id,auth.uid(),p_party_unit_id,coalesce(v_party,(select name from public.units where id=p_party_unit_id)),nullif(btrim(coalesce(p_note,'')),''))
  returning id into v_id;

  update public.work_items set status='waiting_on',last_movement_at=now() where id=w.id;

  insert into public.activity_events(org_id,actor_id,verb,object_type,object_id,meta)
  values(w.org_id,auth.uid(),'blocker_raised','work_item',w.id,jsonb_build_object('blocker_id',v_id,'party_unit_id',p_party_unit_id));

  return v_id;
end;
$$;

create or replace function public.create_project_with_participants(
  p_lead_unit_id uuid,
  p_name text,
  p_purpose text default null,
  p_starts_on date default null,
  p_ends_on date default null,
  p_participant_unit_ids uuid[] default '{}'::uuid[]
)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  v_org uuid:=public.app_org_id();
  v_id uuid:=gen_random_uuid();
  v_unit uuid;
  v_units uuid[];
begin
  if auth.uid() is null then raise exception 'Sign in to create a project.' using errcode='42501'; end if;
  if not (
    public.app_is_admin()
    or exists(select 1 from public.capabilities c where c.profile_id=auth.uid() and c.org_id=v_org and c.capability='create_project')
  ) then raise exception 'You do not have permission to create projects.' using errcode='42501'; end if;
  if p_lead_unit_id not in(select public.app_managed_units()) and not public.app_is_admin() then
    raise exception 'You must manage the lead unit.' using errcode='42501';
  end if;
  if nullif(btrim(coalesce(p_name,'')),'') is null then raise exception 'Enter a project name.'; end if;
  if p_starts_on is not null and p_ends_on is not null and p_ends_on<p_starts_on then raise exception 'Project end cannot be before its start.'; end if;

  v_units:=array(select distinct x from unnest(array_append(coalesce(p_participant_unit_ids,'{}'::uuid[]),p_lead_unit_id)) x);
  foreach v_unit in array v_units loop
    if not exists(select 1 from public.units u where u.id=v_unit and u.org_id=v_org and u.active) then
      raise exception 'Every participating unit must be active in your organisation.';
    end if;
  end loop;

  insert into public.projects(id,org_id,kind,lead_unit_id,name,purpose,starts_on,ends_on,status,created_by)
  values(v_id,v_org,'project',p_lead_unit_id,btrim(p_name),nullif(btrim(coalesce(p_purpose,'')),''),p_starts_on,p_ends_on,'planned',auth.uid());

  foreach v_unit in array v_units loop
    insert into public.project_units(project_id,unit_id,role)
    values(v_id,v_unit,case when v_unit=p_lead_unit_id then 'lead' else 'participating' end);
  end loop;

  insert into public.activity_events(org_id,actor_id,verb,object_type,object_id,meta)
  values(v_org,auth.uid(),'project_created','project',v_id,jsonb_build_object('participant_count',cardinality(v_units)));

  return v_id;
end;
$$;

create or replace function public.save_and_submit_project_close(
  p_project_id uuid,
  p_scope text,
  p_unit_id uuid default null,
  p_deliverables_note text default null,
  p_challenges text default null,
  p_do_differently text default null,
  p_objectives jsonb default '[]'::jsonb,
  p_deliverables jsonb default '[]'::jsonb,
  p_costs jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  v_org uuid:=public.app_org_id();
  v_close public.project_closes;
  v_version int;
  j jsonb;
  v_obj uuid;
  v_work uuid;
  v_sub uuid;
begin
  if auth.uid() is null then raise exception 'Sign in to submit a project close.' using errcode='42501'; end if;
  if p_scope not in ('unit','overall') then raise exception 'Close scope must be unit or overall.'; end if;
  if nullif(btrim(coalesce(p_challenges,'')),'') is null or nullif(btrim(coalesce(p_do_differently,'')),'') is null then
    raise exception 'Challenges and what to do differently are required.';
  end if;

  select * into v_close
  from public.project_closes
  where project_id=p_project_id and scope=p_scope and status='draft' and author_id=auth.uid()
    and unit_id is not distinct from(case when p_scope='unit' then p_unit_id else null end)
  order by version desc limit 1
  for update;

  if v_close.id is null then
    v_version:=public.next_close_version(p_project_id,p_scope,case when p_scope='unit' then p_unit_id else null end);
    insert into public.project_closes(
      org_id,project_id,scope,unit_id,version,status,deliverables_note,challenges,do_differently,author_id
    ) values(
      v_org,p_project_id,p_scope,case when p_scope='unit' then p_unit_id else null end,v_version,'draft',
      nullif(btrim(coalesce(p_deliverables_note,'')),''),btrim(p_challenges),btrim(p_do_differently),auth.uid()
    ) returning * into v_close;
  else
    update public.project_closes set
      deliverables_note=nullif(btrim(coalesce(p_deliverables_note,'')),''),
      challenges=btrim(p_challenges),do_differently=btrim(p_do_differently)
    where id=v_close.id returning * into v_close;
    delete from public.project_close_objectives where close_id=v_close.id;
    delete from public.project_close_deliverables where close_id=v_close.id;
    delete from public.project_close_costs where close_id=v_close.id;
  end if;

  for j in select * from jsonb_array_elements(coalesce(p_objectives,'[]'::jsonb)) loop
    v_obj:=(j->>'objective_id')::uuid;
    if not exists(
      select 1 from public.objectives o where o.id=v_obj and o.project_id=p_project_id
        and (p_scope='overall' or o.unit_id=p_unit_id)
    ) then raise exception 'A close objective does not belong to this close scope.'; end if;
    insert into public.project_close_objectives(close_id,objective_id,outcome,note)
    values(v_close.id,v_obj,j->>'outcome',nullif(btrim(coalesce(j->>'note','')),''));
  end loop;

  for j in select * from jsonb_array_elements(coalesce(p_deliverables,'[]'::jsonb)) loop
    v_work:=nullif(j->>'work_item_id','')::uuid;
    v_sub:=nullif(j->>'submission_id','')::uuid;
    if v_work is not null and not exists(select 1 from public.work_items w where w.id=v_work and w.project_id=p_project_id) then
      raise exception 'A selected deliverable does not belong to this project.';
    end if;
    if v_sub is not null and not exists(select 1 from public.submissions s where s.id=v_sub and (v_work is null or s.work_item_id=v_work)) then
      raise exception 'A selected submission does not belong to that deliverable.';
    end if;
    insert into public.project_close_deliverables(close_id,work_item_id,submission_id,description,position)
    values(v_close.id,v_work,v_sub,coalesce(nullif(btrim(j->>'description'),''),'Recorded deliverable'),coalesce((j->>'position')::int,1));
  end loop;

  for j in select * from jsonb_array_elements(coalesce(p_costs,'[]'::jsonb)) loop
    insert into public.project_close_costs(close_id,currency,planned_amount_minor,actual_amount_minor)
    values(v_close.id,j->>'currency',coalesce((j->>'planned_amount_minor')::bigint,0),coalesce((j->>'actual_amount_minor')::bigint,0));
  end loop;

  perform public.submit_project_close(v_close.id);

  insert into public.activity_events(org_id,actor_id,verb,object_type,object_id,meta)
  values(v_org,auth.uid(),'project_close_submitted','project',p_project_id,jsonb_build_object('close_id',v_close.id,'scope',p_scope,'unit_id',p_unit_id));

  return v_close.id;
end;
$$;

create or replace function public.save_and_submit_report(
  p_period_id uuid,
  p_scope text,
  p_unit_id uuid,
  p_project_id uuid default null,
  p_narrative text default null,
  p_challenges text default null,
  p_evidence jsonb default null,
  p_refs jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  v_report uuid;
  r public.reports;
  rp public.report_periods;
  j jsonb;
  v_type text;
  v_object uuid;
begin
  v_report:=public.save_report_draft(p_period_id,p_scope,p_unit_id,p_project_id,p_narrative,p_challenges);
  select * into r from public.reports where id=v_report for update;
  select * into rp from public.report_periods where id=p_period_id;

  delete from public.report_evidence_refs where report_id=v_report;

  for j in select * from jsonb_array_elements(coalesce(p_refs,'[]'::jsonb)) loop
    v_type:=j->>'object_type';
    v_object:=(j->>'object_id')::uuid;
    if v_type='work_item' then
      if not exists(
        select 1 from public.work_items w
        where w.id=v_object and w.unit_id=p_unit_id
          and (p_scope<>'project' or w.project_id=p_project_id)
          and w.visibility<>'private'
      ) then raise exception 'A report work reference is outside this report scope.'; end if;
    elsif v_type='submission' then
      if not exists(
        select 1 from public.submissions s join public.work_items w on w.id=s.work_item_id
        where s.id=v_object and w.unit_id=p_unit_id
          and (p_scope<>'project' or w.project_id=p_project_id)
          and w.visibility<>'private'
          and s.submitted_at>=rp.starts_on::timestamptz
          and s.submitted_at<(rp.ends_on+1)::timestamptz
      ) then raise exception 'A report submission reference is outside this report scope or period.'; end if;
    elsif v_type='work_session' then
      if not exists(
        select 1 from public.work_sessions ws
        join public.unit_memberships um on um.profile_id=ws.profile_id and um.unit_id=p_unit_id
        where ws.id=v_object
          and ws.started_at>=rp.starts_on::timestamptz
          and ws.started_at<(rp.ends_on+1)::timestamptz
      ) then raise exception 'A report session reference is outside this unit or period.'; end if;
    else
      raise exception 'Unsupported report evidence type: %',v_type;
    end if;

    insert into public.report_evidence_refs(report_id,section,object_type,object_id,label)
    values(v_report,j->>'section',v_type,v_object,nullif(j->>'label',''));
  end loop;

  perform public.submit_report(v_report,p_evidence);

  insert into public.activity_events(org_id,actor_id,verb,object_type,object_id,meta)
  values(r.org_id,auth.uid(),'report_submitted','report',v_report,
    jsonb_build_object('scope',p_scope,'unit_id',p_unit_id,'project_id',p_project_id,'evidence_ref_count',jsonb_array_length(coalesce(p_refs,'[]'::jsonb))));

  return v_report;
end;
$$;

create or replace function public.swap_sub_team_positions(p_first_id uuid,p_second_id uuid)
returns void
language plpgsql
security definer
set search_path=public
as $$
declare
  a public.sub_teams;
  b public.sub_teams;
  v_temp int;
begin
  if auth.uid() is null then raise exception 'Sign in to reorder the team.' using errcode='42501'; end if;
  select * into a from public.sub_teams where id=p_first_id for update;
  select * into b from public.sub_teams where id=p_second_id for update;
  if a.id is null or b.id is null then raise exception 'One of those team parts no longer exists.'; end if;
  if a.org_id<>public.app_org_id() or b.org_id<>a.org_id or a.unit_id<>b.unit_id then
    raise exception 'Those team parts do not belong to the same unit.' using errcode='42501';
  end if;
  if not (a.unit_id in(select public.app_managed_units()) or public.app_is_admin()) then
    raise exception 'Only the Unit Head can reorder this team.' using errcode='42501';
  end if;
  v_temp:=a.position;
  update public.sub_teams set position=b.position where id=a.id;
  update public.sub_teams set position=v_temp where id=b.id;

  insert into public.activity_events(org_id,actor_id,verb,object_type,object_id,meta)
  values(a.org_id,auth.uid(),'sub_team_reordered','unit',a.unit_id,jsonb_build_object('first_id',a.id,'second_id',b.id));
end;
$$;

revoke all on function public.create_task_with_checklist(uuid,uuid,text,text,uuid,uuid,uuid,uuid,text,text,timestamptz,text,text,text[]) from public,anon;
revoke all on function public.submit_work_for_review(uuid,uuid,text,text) from public,anon;
revoke all on function public.raise_work_blocker(uuid,uuid,text,text) from public,anon;
revoke all on function public.create_project_with_participants(uuid,text,text,date,date,uuid[]) from public,anon;
revoke all on function public.save_and_submit_project_close(uuid,text,uuid,text,text,text,jsonb,jsonb,jsonb) from public,anon;
revoke all on function public.save_and_submit_report(uuid,text,uuid,uuid,text,text,jsonb,jsonb) from public,anon;
revoke all on function public.swap_sub_team_positions(uuid,uuid) from public,anon;

grant execute on function public.create_task_with_checklist(uuid,uuid,text,text,uuid,uuid,uuid,uuid,text,text,timestamptz,text,text,text[]) to authenticated,service_role;
grant execute on function public.submit_work_for_review(uuid,uuid,text,text) to authenticated,service_role;
grant execute on function public.raise_work_blocker(uuid,uuid,text,text) to authenticated,service_role;
grant execute on function public.create_project_with_participants(uuid,text,text,date,date,uuid[]) to authenticated,service_role;
grant execute on function public.save_and_submit_project_close(uuid,text,uuid,text,text,text,jsonb,jsonb,jsonb) to authenticated,service_role;
grant execute on function public.save_and_submit_report(uuid,text,uuid,uuid,text,text,jsonb,jsonb) to authenticated,service_role;
grant execute on function public.swap_sub_team_positions(uuid,uuid) to authenticated,service_role;
