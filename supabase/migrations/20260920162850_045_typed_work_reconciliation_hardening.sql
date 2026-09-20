
create or replace function public.guard_typed_work_contract()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if tg_op = 'INSERT'
     and new.kind <> 'task'
     and coalesce(current_setting('ceac.typed_create',true),'') <> 'on' then
    raise exception 'Create this work type through its typed-work contract.'
      using errcode='42501';
  end if;

  if tg_op = 'UPDATE' and new.kind is distinct from old.kind then
    raise exception 'A work type cannot be relabelled after creation.'
      using errcode='42501';
  end if;

  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    if old.kind = 'routine' then
      raise exception 'A routine does not use the generic work-status flow. Record occurrences or pause/resume the routine.'
        using errcode='42501';
    elsif old.kind = 'case'
      and coalesce(current_setting('ceac.case_resolve',true),'') <> 'on' then
      raise exception 'Resolve a case through its case outcome action.'
        using errcode='42501';
    elsif old.kind = 'request'
      and coalesce(current_setting('ceac.request_transition',true),'') <> 'on' then
      raise exception 'Change a request through its request response action.'
        using errcode='42501';
    elsif old.kind = 'decision'
      and coalesce(current_setting('ceac.decision_record',true),'') <> 'on' then
      raise exception 'Record the decision through its decision action.'
        using errcode='42501';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.guard_typed_work_contract() from public, anon, authenticated;

create or replace function public.guard_sub_team_safe_delete()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() is null then
    return old;
  end if;

  if exists (select 1 from public.sub_team_members m where m.sub_team_id = old.id) then
    raise exception 'Move or remove the official sub-team memberships in Administration & HR before removing this work lane.'
      using errcode='42501';
  end if;

  if exists (select 1 from public.work_items w where w.sub_team_id = old.id) then
    raise exception 'Move this lane''s work before removing the work lane.'
      using errcode='42501';
  end if;

  if exists (select 1 from public.recurring_operations ro where ro.sub_team_id = old.id) then
    raise exception 'Move this lane''s routines before removing the work lane.'
      using errcode='42501';
  end if;

  return old;
end;
$$;

drop trigger if exists sub_teams_guard_safe_delete on public.sub_teams;
create trigger sub_teams_guard_safe_delete
before delete on public.sub_teams
for each row execute function public.guard_sub_team_safe_delete();

revoke all on function public.guard_sub_team_safe_delete() from public, anon, authenticated;

do $$
declare
  r record;
  v_item uuid;
  v_number integer;
  v_ref text;
  v_unit_code text;
  v_sub_code text;
  v_start date;
begin
  for r in
    select ro.*
    from public.recurring_operations ro
    where ro.work_item_id is null
    order by ro.created_at, ro.id
    for update
  loop
    select u.code into v_unit_code
    from public.units u
    where u.id = r.unit_id and u.org_id = r.org_id;

    if v_unit_code is null then
      raise exception 'Cannot reconcile routine % because its unit has no code.', r.id;
    end if;

    v_sub_code := null;
    if r.sub_team_id is not null then
      select st.code into v_sub_code
      from public.sub_teams st
      where st.id = r.sub_team_id
        and st.unit_id = r.unit_id
        and st.org_id = r.org_id;

      if v_sub_code is null then
        raise exception 'Cannot reconcile routine % because its work lane has no code.', r.id;
      end if;
    end if;

    insert into public.work_ref_counters(unit_id,next_number)
    values(r.unit_id,2)
    on conflict(unit_id) do update
      set next_number = public.work_ref_counters.next_number + 1
    returning case when xmax = 0 then 1 else public.work_ref_counters.next_number - 1 end
      into v_number;

    v_ref := upper(v_unit_code)
      || case when v_sub_code is not null then '-' || upper(v_sub_code) else '' end
      || '-' || lpad(v_number::text,3,'0');

    v_item := gen_random_uuid();
    v_start := r.created_at::date;

    insert into public.work_items(
      id, org_id, ref, kind, unit_id, sub_team_id, responsibility_id,
      assignee_id, assigned_by, title, origin, visibility, confidential,
      status, last_movement_at, created_at
    )
    values(
      v_item, r.org_id, v_ref, 'routine', r.unit_id, r.sub_team_id, r.responsibility_id,
      null, null, r.name, 'assigned', 'unit', false,
      'in_progress', r.created_at, r.created_at
    );

    update public.recurring_operations
    set work_item_id = v_item,
        starts_on = coalesce(starts_on, v_start),
        schedule_kind = case
          when lower(coalesce(cadence,'')) = 'weekly, sunday' then 'weekly'
          else schedule_kind
        end,
        weekdays = case
          when lower(coalesce(cadence,'')) = 'weekly, sunday' then array[7]::smallint[]
          else weekdays
        end
    where id = r.id;

    if lower(coalesce(r.cadence,'')) = 'weekly, sunday' then
      insert into public.routine_schedule_versions(
        operation_id, version, effective_from, schedule_kind, weekdays, day_of_month, created_by
      )
      values(r.id, 1, v_start, 'weekly', array[7]::smallint[], null, null)
      on conflict(operation_id,version) do nothing;
    end if;
  end loop;
end;
$$;

create or replace function public.create_typed_work_base(
  p_kind text,
  p_unit_id uuid,
  p_title text,
  p_assignee_id uuid,
  p_sub_team_id uuid,
  p_project_id uuid,
  p_phase_id uuid,
  p_objective_id uuid,
  p_responsibility_id uuid,
  p_purpose text,
  p_expected_outcome text,
  p_due_at timestamptz,
  p_visibility text,
  p_confidential boolean,
  p_initial_status text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_ref text;
begin
  if p_kind not in ('routine','case','request','decision','meeting_outcome','deliverable') then
    raise exception 'Use the typed-work contract only for a non-Task work type.';
  end if;
  if p_title is null or length(btrim(p_title))=0 then
    raise exception 'Give the work a short name.';
  end if;
  if p_visibility not in ('unit','private') then
    raise exception 'Visibility must be unit or private.';
  end if;

  if not (
    p_unit_id in (select app_managed_units())
    or (p_sub_team_id is not null and p_sub_team_id in (select app_led_sub_teams()))
    or app_is_admin()
    or app_is_exec()
  ) then
    raise exception 'You cannot create work in that unit.';
  end if;

  if p_sub_team_id is not null and not exists (
    select 1 from sub_teams st
    where st.id=p_sub_team_id and st.unit_id=p_unit_id and st.org_id=app_org_id()
  ) then
    raise exception 'That work lane does not belong to this unit.';
  end if;

  if p_kind <> 'request'
     and p_assignee_id is not null
     and not exists (
       select 1
       from unit_memberships m
       join profiles p on p.id=m.profile_id
       where m.profile_id=p_assignee_id
         and m.unit_id=p_unit_id
         and m.org_id=app_org_id()
         and p.active
     ) then
    raise exception 'The assignee is not an active member of this unit.';
  end if;

  if app_is_exec() and not app_is_admin()
     and p_unit_id not in (select app_managed_units()) then
    if p_assignee_id is null or not (
      exists (select 1 from profiles p where p.id=p_assignee_id and p.org_id=app_org_id() and p.is_admin)
      or exists (select 1 from unit_memberships m where m.profile_id=p_assignee_id and m.unit_id=p_unit_id and m.role='manager')
      or p_kind='request'
    ) then
      raise exception 'The Group Pastor gives work to unit heads and Administration, not directly to staff.';
    end if;
  end if;

  if p_project_id is not null then
    if not exists (
      select 1 from projects p
      where p.id=p_project_id and p.org_id=app_org_id()
        and (
          p.lead_unit_id=p_unit_id
          or exists (select 1 from project_units pu where pu.project_id=p.id and pu.unit_id=p_unit_id)
        )
    ) then
      raise exception 'That project is not attached to this unit.';
    end if;
  end if;

  if p_phase_id is not null and not exists (
    select 1 from project_phases ph
    where ph.id=p_phase_id and ph.project_id=p_project_id
  ) then
    raise exception 'That phase does not belong to the selected project.';
  end if;

  if p_objective_id is not null and not exists (
    select 1 from objectives o
    where o.id=p_objective_id
      and o.project_id=p_project_id
      and o.unit_id=p_unit_id
  ) then
    raise exception 'That objective does not belong to this unit and project.';
  end if;

  if p_responsibility_id is not null and not exists (
    select 1 from responsibilities r
    where r.id=p_responsibility_id and r.unit_id=p_unit_id and r.org_id=app_org_id()
  ) then
    raise exception 'That responsibility does not belong to this unit.';
  end if;

  v_ref := next_work_ref(p_unit_id,p_sub_team_id);
  v_id := gen_random_uuid();

  perform set_config('ceac.typed_create','on',true);

  insert into work_items(
    id,org_id,ref,kind,unit_id,sub_team_id,project_id,phase_id,objective_id,
    responsibility_id,assignee_id,assigned_by,title,purpose,expected_outcome,
    original_due_at,due_at,origin,visibility,confidential,status
  )
  values(
    v_id,app_org_id(),v_ref,p_kind,p_unit_id,p_sub_team_id,p_project_id,p_phase_id,p_objective_id,
    p_responsibility_id,p_assignee_id,auth.uid(),btrim(p_title),nullif(btrim(p_purpose),''),
    nullif(btrim(p_expected_outcome),''),p_due_at,p_due_at,'assigned',p_visibility,
    coalesce(p_confidential,false),p_initial_status
  );

  return v_id;
end;
$$;

revoke all on function public.create_typed_work_base(text,uuid,text,uuid,uuid,uuid,uuid,uuid,uuid,text,text,timestamptz,text,boolean,text)
  from public, anon, authenticated;

create or replace function public.create_typed_work(
  p_kind text,
  p_unit_id uuid,
  p_title text,
  p_assignee_id uuid default null,
  p_sub_team_id uuid default null,
  p_project_id uuid default null,
  p_phase_id uuid default null,
  p_objective_id uuid default null,
  p_responsibility_id uuid default null,
  p_purpose text default null,
  p_expected_outcome text default null,
  p_due_at timestamptz default null,
  p_visibility text default 'unit',
  p_confidential boolean default false,
  p_details jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item uuid;
  v_operation uuid;
  v_schedule text;
  v_weekdays smallint[];
  v_day integer;
  v_starts date;
  v_ends date;
  v_records_value boolean;
  v_value_label text;
  v_target date;
  v_responsible_unit uuid;
  v_question text;
  v_meeting_title text;
  v_meeting_on date;
  v_event uuid;
  v_evidence_required boolean;
  v_evidence_kind text;
begin
  p_details := coalesce(p_details,'{}'::jsonb);

  if p_kind='routine' then
    v_schedule := nullif(p_details->>'schedule_kind','');
    if v_schedule not in ('daily','weekly','monthly','weekdays') then
      raise exception 'Routine schedule must be daily, weekly, monthly or selected weekdays.';
    end if;
    v_starts := coalesce(nullif(p_details->>'starts_on','')::date,current_date);
    v_ends := nullif(p_details->>'ends_on','')::date;
    if v_ends is not null and v_ends < v_starts then
      raise exception 'Routine end date cannot be before its start date.';
    end if;

    if p_details ? 'weekdays' then
      select array_agg(x::smallint order by ord)
      into v_weekdays
      from jsonb_array_elements_text(p_details->'weekdays') with ordinality as a(x,ord);
    end if;

    if v_weekdays is not null and exists (
      select 1 from unnest(v_weekdays) d where d < 1 or d > 7
    ) then
      raise exception 'Routine weekdays use ISO days 1 to 7.';
    end if;

    if v_schedule='weekly' and coalesce(array_length(v_weekdays,1),0)=0 then
      v_weekdays := array[extract(isodow from v_starts)::smallint];
    end if;
    if v_schedule='weekdays' and coalesce(array_length(v_weekdays,1),0)=0 then
      raise exception 'Choose at least one weekday for this routine.';
    end if;

    if v_schedule='monthly' then
      v_day := coalesce(nullif(p_details->>'day_of_month','')::int,extract(day from v_starts)::int);
      if v_day not between 1 and 31 then raise exception 'Monthly day must be 1 to 31.'; end if;
    end if;

    v_records_value := coalesce((p_details->>'records_value')::boolean,false);
    v_value_label := nullif(btrim(p_details->>'value_label'),'');
    if v_records_value and v_value_label is null then
      raise exception 'Name the number this routine records.';
    end if;

    v_item := create_typed_work_base(
      p_kind,p_unit_id,p_title,p_assignee_id,p_sub_team_id,p_project_id,p_phase_id,p_objective_id,
      p_responsibility_id,p_purpose,p_expected_outcome,null,p_visibility,p_confidential,'in_progress'
    );

    insert into recurring_operations(
      org_id,unit_id,sub_team_id,responsibility_id,name,cadence,records_value,value_label,active,
      work_item_id,starts_on,ends_on,paused_at,schedule_kind,weekdays,day_of_month
    )
    values(
      app_org_id(),p_unit_id,p_sub_team_id,p_responsibility_id,btrim(p_title),v_schedule,
      v_records_value,v_value_label,true,v_item,v_starts,v_ends,null,v_schedule,v_weekdays,v_day
    )
    returning id into v_operation;

    insert into routine_schedule_versions(
      operation_id,version,effective_from,schedule_kind,weekdays,day_of_month,created_by
    )
    values(v_operation,1,v_starts,v_schedule,v_weekdays,v_day,auth.uid());

  elsif p_kind='case' then
    if p_assignee_id is null then raise exception 'A case needs a named owner.'; end if;
    v_target := nullif(p_details->>'target_resolution_on','')::date;
    v_starts := coalesce(nullif(p_details->>'opened_on','')::date,current_date);
    if v_target is not null and v_target < v_starts then
      raise exception 'Case target date cannot be before it opened.';
    end if;

    v_item := create_typed_work_base(
      p_kind,p_unit_id,p_title,p_assignee_id,p_sub_team_id,p_project_id,p_phase_id,p_objective_id,
      p_responsibility_id,p_purpose,p_expected_outcome,p_due_at,p_visibility,p_confidential,'in_progress'
    );
    insert into work_cases(work_item_id,opened_on,target_resolution_on)
    values(v_item,v_starts,v_target);

  elsif p_kind='request' then
    if p_details ? 'responsible_unit_id' and nullif(p_details->>'responsible_unit_id','') is not null then
      v_responsible_unit := (p_details->>'responsible_unit_id')::uuid;
    end if;
    if p_assignee_id is null and v_responsible_unit is null then
      raise exception 'A request needs a responsible person or unit.';
    end if;
    if v_responsible_unit is not null and not exists (
      select 1 from units u where u.id=v_responsible_unit and u.org_id=app_org_id()
    ) then
      raise exception 'That responsible unit does not belong to this organisation.';
    end if;
    if p_assignee_id is not null and not exists (
      select 1
      from profiles p
      where p.id=p_assignee_id
        and p.org_id=app_org_id()
        and p.active
    ) then
      raise exception 'That responsible person is not active in this organisation.';
    end if;
    if p_assignee_id is not null and v_responsible_unit is not null and not exists (
      select 1 from unit_memberships m
      where m.profile_id=p_assignee_id and m.unit_id=v_responsible_unit and m.org_id=app_org_id()
    ) then
      raise exception 'That responsible person is not a member of the selected responsible unit.';
    end if;
    if p_confidential and p_assignee_id is null then
      raise exception 'A confidential request needs a named responsible person.';
    end if;

    v_item := create_typed_work_base(
      p_kind,p_unit_id,p_title,p_assignee_id,p_sub_team_id,p_project_id,p_phase_id,p_objective_id,
      p_responsibility_id,p_purpose,p_expected_outcome,p_due_at,p_visibility,p_confidential,'waiting_on'
    );
    insert into work_requests(work_item_id,requester_id,responsible_profile_id,responsible_unit_id)
    values(v_item,auth.uid(),p_assignee_id,v_responsible_unit);

  elsif p_kind='decision' then
    if p_assignee_id is null then raise exception 'A decision needs a named decision-maker.'; end if;
    v_question := coalesce(nullif(btrim(p_details->>'question'),''),btrim(p_title));

    v_item := create_typed_work_base(
      p_kind,p_unit_id,p_title,p_assignee_id,p_sub_team_id,p_project_id,p_phase_id,p_objective_id,
      p_responsibility_id,p_purpose,p_expected_outcome,p_due_at,p_visibility,p_confidential,'not_started'
    );
    insert into work_decisions(work_item_id,authority_profile_id,question)
    values(v_item,p_assignee_id,v_question);

  elsif p_kind='meeting_outcome' then
    if p_assignee_id is null then raise exception 'A meeting outcome needs an owner.'; end if;
    v_meeting_title := nullif(btrim(p_details->>'meeting_title'),'');
    v_meeting_on := nullif(p_details->>'meeting_on','')::date;
    if v_meeting_title is null or v_meeting_on is null then
      raise exception 'Record the meeting title and date.';
    end if;
    if p_details ? 'source_event_id' and nullif(p_details->>'source_event_id','') is not null then
      v_event := (p_details->>'source_event_id')::uuid;
      if not exists (select 1 from ministry_events e where e.id=v_event and e.org_id=app_org_id()) then
        raise exception 'That calendar event does not belong to this organisation.';
      end if;
    end if;

    v_item := create_typed_work_base(
      p_kind,p_unit_id,p_title,p_assignee_id,p_sub_team_id,p_project_id,p_phase_id,p_objective_id,
      p_responsibility_id,p_purpose,p_expected_outcome,p_due_at,p_visibility,p_confidential,'not_started'
    );
    insert into work_meeting_outcomes(work_item_id,meeting_title,meeting_on,meeting_note,source_event_id)
    values(v_item,v_meeting_title,v_meeting_on,nullif(btrim(p_details->>'meeting_note'),''),v_event);

  elsif p_kind='deliverable' then
    if p_assignee_id is null then raise exception 'A deliverable needs an owner.'; end if;
    if p_expected_outcome is null or length(btrim(p_expected_outcome))=0 then
      raise exception 'State what the finished deliverable must be.';
    end if;
    v_evidence_required := coalesce((p_details->>'evidence_required')::boolean,true);
    v_evidence_kind := coalesce(nullif(p_details->>'evidence_kind',''),case when v_evidence_required then 'file_or_link' else 'none' end);
    if v_evidence_kind not in ('file_or_link','file','link','none') then
      raise exception 'Deliverable evidence type is not supported.';
    end if;
    if not v_evidence_required then v_evidence_kind := 'none'; end if;

    v_item := create_typed_work_base(
      p_kind,p_unit_id,p_title,p_assignee_id,p_sub_team_id,p_project_id,p_phase_id,p_objective_id,
      p_responsibility_id,p_purpose,p_expected_outcome,p_due_at,p_visibility,p_confidential,'not_started'
    );
    insert into work_deliverables(work_item_id,evidence_required,evidence_kind)
    values(v_item,v_evidence_required,v_evidence_kind);

  else
    raise exception 'Unsupported typed work kind.';
  end if;

  insert into activity_events(org_id,actor_id,verb,object_type,object_id,meta)
  values(app_org_id(),auth.uid(),'created','work_item',v_item,jsonb_build_object('kind',p_kind));

  return v_item;
end;
$$;

revoke all on function public.create_typed_work(text,uuid,text,uuid,uuid,uuid,uuid,uuid,uuid,text,text,timestamptz,text,boolean,jsonb)
  from public, anon;
grant execute on function public.create_typed_work(text,uuid,text,uuid,uuid,uuid,uuid,uuid,uuid,text,text,timestamptz,text,boolean,jsonb)
  to authenticated, service_role;

create or replace function public.change_routine_schedule(
  p_work_item_id uuid,
  p_effective_from date,
  p_schedule_kind text,
  p_weekdays smallint[] default null,
  p_day_of_month integer default null,
  p_ends_on date default null
)
returns integer
language plpgsql
security definer
set search_path=public
as $$
declare
  ro record;
  v_latest record;
  v_version integer;
begin
  select * into ro from recurring_operations where work_item_id=p_work_item_id for update;
  if ro is null then raise exception 'That routine does not exist.'; end if;
  if ro.org_id<>app_org_id() then raise exception 'That belongs to another organisation.'; end if;
  if not (ro.unit_id in (select app_managed_units()) or app_is_admin()) then
    raise exception 'Only the unit head or Administration can change this routine.';
  end if;
  if p_effective_from is null then
    raise exception 'Choose when the schedule starts.';
  end if;
  if p_schedule_kind not in ('daily','weekly','monthly','weekdays') then
    raise exception 'Routine schedule must be daily, weekly, monthly or selected weekdays.';
  end if;
  if p_weekdays is not null and exists (select 1 from unnest(p_weekdays) d where d<1 or d>7) then
    raise exception 'Routine weekdays use ISO days 1 to 7.';
  end if;
  if p_schedule_kind in ('weekly','weekdays') and coalesce(array_length(p_weekdays,1),0)=0 then
    raise exception 'Choose the scheduled weekday(s).';
  end if;
  if p_schedule_kind='monthly' and (p_day_of_month is null or p_day_of_month not between 1 and 31) then
    raise exception 'Monthly routines need a day from 1 to 31.';
  end if;
  if p_ends_on is not null and p_ends_on<p_effective_from then
    raise exception 'Routine end date cannot be before the new schedule starts.';
  end if;

  select * into v_latest
  from routine_schedule_versions
  where operation_id=ro.id
  order by version desc
  limit 1;

  if v_latest.id is null then
    if p_effective_from < current_date then
      raise exception 'The first configured schedule cannot start in the past.';
    end if;
  else
    if p_effective_from <= current_date then
      raise exception 'A schedule change must start on a future date.';
    end if;
    if p_effective_from <= v_latest.effective_from then
      raise exception 'The new schedule must start after the current schedule version.';
    end if;
  end if;

  if v_latest.id is not null then
    update routine_schedule_versions
    set effective_to=p_effective_from-1
    where id=v_latest.id;
    v_version:=v_latest.version+1;
  else
    v_version:=1;
  end if;

  insert into routine_schedule_versions(
    operation_id,version,effective_from,schedule_kind,weekdays,day_of_month,created_by
  ) values(ro.id,v_version,p_effective_from,p_schedule_kind,p_weekdays,p_day_of_month,auth.uid());

  update recurring_operations
  set cadence=p_schedule_kind,
      schedule_kind=p_schedule_kind,
      weekdays=p_weekdays,
      day_of_month=p_day_of_month,
      starts_on=coalesce(starts_on,p_effective_from),
      ends_on=p_ends_on
  where id=ro.id;

  insert into activity_events(org_id,actor_id,verb,object_type,object_id,meta)
  values(ro.org_id,auth.uid(),'routine_schedule_changed','work_item',p_work_item_id,
         jsonb_build_object('version',v_version,'effective_from',p_effective_from));

  return v_version;
end;
$$;

revoke all on function public.change_routine_schedule(uuid,date,text,smallint[],integer,date) from public,anon;
grant execute on function public.change_routine_schedule(uuid,date,text,smallint[],integer,date) to authenticated,service_role;
