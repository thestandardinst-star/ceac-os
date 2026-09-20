
alter table public.operation_occurrences
  add constraint operation_occurrences_operation_date_key unique (operation_id,occurred_on);

alter table public.work_request_responses
  drop constraint if exists work_request_responses_outcome_check;
alter table public.work_request_responses
  add constraint work_request_responses_outcome_check
  check (outcome in ('fulfilled','declined','clarification','clarification_provided','cancelled'));

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

  if tg_op = 'UPDATE' and old.kind='case'
     and new.status='completed' and old.status<>'completed'
     and coalesce(current_setting('ceac.case_resolve',true),'') <> 'on' then
    raise exception 'Resolve a case through its case outcome action.'
      using errcode='42501';
  end if;

  if tg_op = 'UPDATE' and old.kind='request'
     and new.status is distinct from old.status
     and new.status in ('completed','returned','cancelled','waiting_on')
     and coalesce(current_setting('ceac.request_transition',true),'') <> 'on' then
    raise exception 'Change a request through its request response action.'
      using errcode='42501';
  end if;

  if tg_op = 'UPDATE' and old.kind='decision'
     and new.status='completed' and old.status<>'completed'
     and coalesce(current_setting('ceac.decision_record',true),'') <> 'on' then
    raise exception 'Record the decision through its decision action.'
      using errcode='42501';
  end if;

  return new;
end;
$$;

drop trigger if exists work_items_guard_typed_contract on public.work_items;
create trigger work_items_guard_typed_contract
before insert or update on public.work_items
for each row execute function public.guard_typed_work_contract();

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

  if p_assignee_id is not null and not exists (
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

create or replace function public.app_can_see_item(item_id uuid)
returns boolean
language sql
stable
security definer
set search_path=public
as $$
  select exists (
    select 1
    from work_items w
    where w.id=item_id
      and w.org_id=app_org_id()
      and (
        w.assignee_id=auth.uid()
        or (
          w.visibility<>'private'
          and (
            (w.confidential=false and (
              w.unit_id in (select app_my_units())
              or app_is_admin()
              or app_is_exec()
            ))
            or (w.confidential=true and (app_is_admin() or app_is_exec()))
          )
        )
        or (
          w.visibility<>'private'
          and w.confidential=false
          and w.project_id is not null
          and exists (
            select 1 from projects p
            where p.id=w.project_id
              and (
                p.lead_unit_id in (select app_managed_units())
                or exists (
                  select 1 from project_units pu
                  where pu.project_id=p.id and pu.unit_id in (select app_managed_units())
                )
              )
          )
        )
        or (
          w.kind='request'
          and w.visibility<>'private'
          and w.confidential=false
          and exists (
            select 1 from work_requests wr
            where wr.work_item_id=w.id
              and (
                wr.responsible_profile_id=auth.uid()
                or wr.responsible_unit_id in (select app_managed_units())
              )
          )
        )
      )
  );
$$;

create or replace function public.app_can_review_item(item_id uuid)
returns boolean
language sql
stable
security definer
set search_path=public
as $$
  select exists (
    select 1 from work_items w
    where w.id=item_id
      and w.org_id=app_org_id()
      and w.kind in ('task','deliverable','meeting_outcome')
      and w.visibility<>'private'
      and (
        app_is_admin()
        or (
          w.confidential=false
          and (
            w.unit_id in (select app_managed_units())
            or w.sub_team_id in (select app_led_sub_teams())
          )
        )
      )
  );
$$;

create or replace function public.record_routine_occurrence(
  p_work_item_id uuid,
  p_occurred_on date,
  p_value numeric default null,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  ro record;
  sv record;
  v_id uuid;
  v_dow integer;
begin
  select r.* into ro
  from recurring_operations r
  where r.work_item_id=p_work_item_id
  for update;

  if ro is null then raise exception 'That routine does not exist.'; end if;
  if ro.org_id<>app_org_id() then raise exception 'That routine belongs to another organisation.'; end if;
  if p_occurred_on is null or p_occurred_on>current_date then
    raise exception 'Record an occurrence for today or an earlier date.';
  end if;
  if ro.starts_on is not null and p_occurred_on<ro.starts_on then
    raise exception 'That date is before the routine started.';
  end if;
  if ro.ends_on is not null and p_occurred_on>ro.ends_on then
    raise exception 'That date is after the routine ended.';
  end if;
  if not (
    ro.unit_id in (select app_my_units())
    or ro.unit_id in (select app_managed_units())
    or app_is_admin()
  ) then
    raise exception 'You cannot record this routine.';
  end if;

  select * into sv
  from routine_schedule_versions
  where operation_id=ro.id
    and effective_from<=p_occurred_on
    and (effective_to is null or effective_to>=p_occurred_on)
  order by version desc
  limit 1;

  if sv is null then raise exception 'No schedule version covers that date.'; end if;

  v_dow := extract(isodow from p_occurred_on)::int;
  if sv.schedule_kind in ('weekly','weekdays') and not (v_dow=any(sv.weekdays)) then
    raise exception 'That date is not scheduled for this routine.';
  end if;
  if sv.schedule_kind='monthly' and extract(day from p_occurred_on)::int<>sv.day_of_month then
    raise exception 'That date is not the scheduled monthly day.';
  end if;

  if ro.records_value and p_value is null then
    raise exception 'Record the % for this occurrence.',coalesce(ro.value_label,'value');
  end if;
  if not ro.records_value and p_value is not null then
    raise exception 'This routine is not configured to record a number.';
  end if;

  insert into operation_occurrences(org_id,operation_id,occurred_on,value,note,recorded_by)
  values(ro.org_id,ro.id,p_occurred_on,p_value,nullif(btrim(p_note),''),auth.uid())
  returning id into v_id;

  insert into activity_events(org_id,actor_id,verb,object_type,object_id,meta)
  values(ro.org_id,auth.uid(),'routine_recorded','work_item',p_work_item_id,
         jsonb_build_object('occurrence_id',v_id,'occurred_on',p_occurred_on,'value',p_value));

  return v_id;
end;
$$;

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
  if p_effective_from is null or p_effective_from<=current_date then
    raise exception 'A schedule change must start on a future date.';
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

  if v_latest is not null and p_effective_from<=v_latest.effective_from then
    raise exception 'The new schedule must start after the current schedule version.';
  end if;

  if v_latest is not null then
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
      ends_on=p_ends_on
  where id=ro.id;

  insert into activity_events(org_id,actor_id,verb,object_type,object_id,meta)
  values(ro.org_id,auth.uid(),'routine_schedule_changed','work_item',p_work_item_id,
         jsonb_build_object('version',v_version,'effective_from',p_effective_from));

  return v_version;
end;
$$;

create or replace function public.set_routine_paused(
  p_work_item_id uuid,
  p_paused boolean,
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare ro record;
begin
  select * into ro from recurring_operations where work_item_id=p_work_item_id for update;
  if ro is null then raise exception 'That routine does not exist.'; end if;
  if ro.org_id<>app_org_id() then raise exception 'That belongs to another organisation.'; end if;
  if not (ro.unit_id in (select app_managed_units()) or app_is_admin()) then
    raise exception 'Only the unit head or Administration can pause or resume this routine.';
  end if;
  if p_reason is null or length(btrim(p_reason))=0 then
    raise exception 'Record why the routine is being paused or resumed.';
  end if;

  update recurring_operations
  set active=not p_paused,
      paused_at=case when p_paused then now() else null end
  where id=ro.id;

  insert into activity_events(org_id,actor_id,verb,object_type,object_id,meta)
  values(ro.org_id,auth.uid(),case when p_paused then 'routine_paused' else 'routine_resumed' end,
         'work_item',p_work_item_id,jsonb_build_object('reason',btrim(p_reason)));

  return p_work_item_id;
end;
$$;

create or replace function public.resolve_work_case(
  p_work_item_id uuid,
  p_resolution_note text
)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare w record; c record;
begin
  select * into w from work_items where id=p_work_item_id for update;
  select * into c from work_cases where work_item_id=p_work_item_id for update;
  if w is null or c is null or w.kind<>'case' then raise exception 'That case does not exist.'; end if;
  if w.org_id<>app_org_id() then raise exception 'That belongs to another organisation.'; end if;
  if not (w.assignee_id=auth.uid() or app_is_admin()) then
    raise exception 'Only the case owner or Administration can record the resolution.';
  end if;
  if c.case_state='resolved' then raise exception 'That case is already resolved.'; end if;
  if p_resolution_note is null or length(btrim(p_resolution_note))=0 then
    raise exception 'Record how the case ended.';
  end if;

  update work_cases
  set case_state='resolved',resolution_note=btrim(p_resolution_note),resolved_at=now(),resolved_by=auth.uid()
  where work_item_id=w.id;

  perform set_config('ceac.case_resolve','on',true);
  update work_items set status='completed',completed_at=now(),last_movement_at=now() where id=w.id;

  insert into activity_events(org_id,actor_id,verb,object_type,object_id,meta)
  values(w.org_id,auth.uid(),'resolved','work_item',w.id,jsonb_build_object('kind','case'));

  return w.id;
end;
$$;

create or replace function public.respond_work_request(
  p_work_item_id uuid,
  p_outcome text,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare w record; r record; v_final boolean;
begin
  select * into w from work_items where id=p_work_item_id for update;
  select * into r from work_requests where work_item_id=p_work_item_id for update;
  if w is null or r is null or w.kind<>'request' then raise exception 'That request does not exist.'; end if;
  if w.org_id<>app_org_id() then raise exception 'That belongs to another organisation.'; end if;
  if p_outcome not in ('fulfilled','declined','clarification','cancelled') then
    raise exception 'Request outcome is not supported.';
  end if;

  if p_outcome='cancelled' then
    if not (r.requester_id=auth.uid() or app_is_admin()) then
      raise exception 'Only the requester or Administration can cancel this request.';
    end if;
  else
    if not (
      r.responsible_profile_id=auth.uid()
      or r.responsible_unit_id in (select app_managed_units())
      or app_is_admin()
    ) then
      raise exception 'You are not responsible for answering this request.';
    end if;
  end if;

  if p_outcome in ('declined','clarification') and (p_note is null or length(btrim(p_note))=0) then
    raise exception 'Record the reason for this response.';
  end if;
  if r.request_state in ('fulfilled','declined','cancelled') then
    raise exception 'That request already has a final outcome.';
  end if;

  update work_requests
  set request_state=p_outcome,
      responded_at=now(),
      responded_by=auth.uid(),
      response_note=nullif(btrim(p_note),'')
  where work_item_id=w.id;

  insert into work_request_responses(work_item_id,actor_id,outcome,note)
  values(w.id,auth.uid(),p_outcome,nullif(btrim(p_note),''));

  perform set_config('ceac.request_transition','on',true);

  if p_outcome in ('fulfilled','declined') then
    update work_items set status='completed',completed_at=now(),last_movement_at=now() where id=w.id;
  elsif p_outcome='clarification' then
    update work_items set status='returned',completed_at=null,last_movement_at=now() where id=w.id;
  else
    update work_items set status='cancelled',completed_at=null,last_movement_at=now() where id=w.id;
  end if;

  insert into activity_events(org_id,actor_id,verb,object_type,object_id,meta)
  values(w.org_id,auth.uid(),'request_'||p_outcome,'work_item',w.id,jsonb_build_object('note',nullif(btrim(p_note),'')));

  return w.id;
end;
$$;

create or replace function public.provide_request_clarification(
  p_work_item_id uuid,
  p_note text
)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare w record; r record;
begin
  select * into w from work_items where id=p_work_item_id for update;
  select * into r from work_requests where work_item_id=p_work_item_id for update;
  if w is null or r is null or w.kind<>'request' then raise exception 'That request does not exist.'; end if;
  if w.org_id<>app_org_id() then raise exception 'That belongs to another organisation.'; end if;
  if not (r.requester_id=auth.uid() or app_is_admin()) then
    raise exception 'Only the requester or Administration can provide the clarification.';
  end if;
  if r.request_state<>'clarification' then raise exception 'That request is not waiting for clarification.'; end if;
  if p_note is null or length(btrim(p_note))=0 then raise exception 'Provide the clarification.'; end if;

  update work_requests
  set request_state='waiting',responded_at=null,responded_by=null,response_note=null
  where work_item_id=w.id;

  insert into work_request_responses(work_item_id,actor_id,outcome,note)
  values(w.id,auth.uid(),'clarification_provided',btrim(p_note));

  perform set_config('ceac.request_transition','on',true);
  update work_items set status='waiting_on',completed_at=null,last_movement_at=now() where id=w.id;

  insert into activity_events(org_id,actor_id,verb,object_type,object_id,meta)
  values(w.org_id,auth.uid(),'request_clarified','work_item',w.id,jsonb_build_object('note',btrim(p_note)));

  return w.id;
end;
$$;

create or replace function public.record_work_decision(
  p_work_item_id uuid,
  p_decision text,
  p_rationale text
)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare w record; d record;
begin
  select * into w from work_items where id=p_work_item_id for update;
  select * into d from work_decisions where work_item_id=p_work_item_id for update;
  if w is null or d is null or w.kind<>'decision' then raise exception 'That decision does not exist.'; end if;
  if w.org_id<>app_org_id() then raise exception 'That belongs to another organisation.'; end if;
  if not (d.authority_profile_id=auth.uid() or app_is_admin()) then
    raise exception 'You are not the named decision-maker.';
  end if;
  if d.decided_at is not null then raise exception 'That decision is already recorded.'; end if;
  if p_decision is null or length(btrim(p_decision))=0 then raise exception 'Record the decision.'; end if;
  if p_rationale is null or length(btrim(p_rationale))=0 then raise exception 'Record the rationale for the decision.'; end if;

  update work_decisions
  set decision_text=btrim(p_decision),rationale=btrim(p_rationale),decided_at=now(),decided_by=auth.uid()
  where work_item_id=w.id;

  perform set_config('ceac.decision_record','on',true);
  update work_items set status='completed',completed_at=now(),last_movement_at=now() where id=w.id;

  insert into activity_events(org_id,actor_id,verb,object_type,object_id,meta)
  values(w.org_id,auth.uid(),'decided','work_item',w.id,jsonb_build_object('decision',btrim(p_decision)));

  return w.id;
end;
$$;

create or replace function public.link_work_items(
  p_parent_work_item_id uuid,
  p_child_work_item_id uuid,
  p_relation text
)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare p record; c record; v_id uuid;
begin
  select * into p from work_items where id=p_parent_work_item_id;
  select * into c from work_items where id=p_child_work_item_id;
  if p is null or c is null then raise exception 'Both work items must exist.'; end if;
  if p.org_id<>app_org_id() or c.org_id<>app_org_id() then raise exception 'Both work items must belong to this organisation.'; end if;
  if p_relation not in ('case_action','follow_up','related') then raise exception 'That work relationship is not supported.'; end if;
  if not (
    p.assignee_id=auth.uid()
    or p.unit_id in (select app_managed_units())
    or app_is_admin()
  ) then
    raise exception 'You cannot change links on that work.';
  end if;
  if not app_can_see_item(c.id) then raise exception 'You cannot link work you are not allowed to see.'; end if;
  if p_relation='case_action' and p.kind<>'case' then raise exception 'Only a Case can contain case actions.'; end if;

  insert into work_item_links(org_id,parent_work_item_id,child_work_item_id,relation,created_by)
  values(p.org_id,p.id,c.id,p_relation,auth.uid())
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.approve_work_submission(
  p_submission_id uuid,
  p_comment text default null
)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  s record;
  w record;
  v_latest_submission uuid;
  v_review uuid;
  v_first_time boolean;
  v_deliverable record;
  v_file_count integer;
begin
  select * into s from submissions where id=p_submission_id for update;
  if s is null then raise exception 'That submission does not exist.'; end if;
  if s.org_id<>app_org_id() then raise exception 'That submission belongs to another organisation.'; end if;

  select * into w from work_items where id=s.work_item_id for update;
  if w is null then raise exception 'That work item does not exist.'; end if;
  if w.kind not in ('task','deliverable','meeting_outcome') then
    raise exception 'This work type does not use the approval loop.';
  end if;
  if w.status<>'in_review' then raise exception 'That work is not waiting for review.'; end if;
  if s.profile_id=auth.uid() then raise exception 'You cannot approve your own submission.'; end if;
  if not app_can_review_item(w.id) then raise exception 'You are not the reviewer for that work.'; end if;

  select id into v_latest_submission
  from submissions where work_item_id=w.id
  order by submitted_at desc,id desc limit 1;
  if v_latest_submission is distinct from s.id then
    raise exception 'A newer submission exists. Review the latest submission instead.';
  end if;
  if exists(select 1 from reviews where submission_id=s.id) then
    raise exception 'That submission already has a review decision.';
  end if;

  if w.kind='deliverable' then
    select * into v_deliverable from work_deliverables where work_item_id=w.id;
    if v_deliverable is null then raise exception 'Deliverable configuration is missing.'; end if;
    if v_deliverable.evidence_required then
      select count(*) into v_file_count from submission_files where submission_id=s.id;
      if v_file_count=0 then raise exception 'This deliverable requires evidence before it can be approved.'; end if;
      if v_deliverable.evidence_kind='link' and not exists (
        select 1 from submission_files where submission_id=s.id and kind='link'
      ) then raise exception 'This deliverable requires a link.'; end if;
      if v_deliverable.evidence_kind='file' and not exists (
        select 1 from submission_files where submission_id=s.id and kind='upload'
      ) then raise exception 'This deliverable requires an uploaded file.'; end if;
    end if;
  end if;

  select not exists (
    select 1 from reviews r
    join submissions prior on prior.id=r.submission_id
    where prior.work_item_id=w.id and r.decision='returned'
  ) into v_first_time;

  insert into reviews(org_id,submission_id,reviewer_id,decision,comment,seen_at)
  values(w.org_id,s.id,auth.uid(),'completed',nullif(btrim(p_comment),''),now())
  returning id into v_review;

  perform set_config('ceac.work_approve','on',true);
  update work_items
  set status='completed',first_time_approved=v_first_time,completed_at=now(),last_movement_at=now()
  where id=w.id;

  insert into activity_events(org_id,actor_id,verb,object_type,object_id,meta)
  values(w.org_id,auth.uid(),'approved','work_item',w.id,jsonb_build_object('submission_id',s.id,'review_id',v_review));

  return v_review;
end;
$$;

create or replace function public.return_work_for_correction(
  p_submission_id uuid,
  p_comment text,
  p_checklist_item_ids uuid[] default null
)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare s record; w record; v_latest_submission uuid; v_review uuid;
begin
  select * into s from submissions where id=p_submission_id for update;
  if s is null then raise exception 'That submission does not exist.'; end if;
  if s.org_id<>app_org_id() then raise exception 'That submission belongs to another organisation.'; end if;
  select * into w from work_items where id=s.work_item_id for update;
  if w is null then raise exception 'That work item does not exist.'; end if;
  if w.kind not in ('task','deliverable','meeting_outcome') then
    raise exception 'This work type does not use the approval loop.';
  end if;
  if w.status<>'in_review' then raise exception 'That work is not waiting for review.'; end if;
  if s.profile_id=auth.uid() then raise exception 'You cannot review your own submission.'; end if;
  if not app_can_review_item(w.id) then raise exception 'You are not the reviewer for that work.'; end if;
  if p_comment is null or length(btrim(p_comment))=0 then
    raise exception 'Say what needs to change. A return without a reason is not actionable.';
  end if;
  select id into v_latest_submission from submissions where work_item_id=w.id order by submitted_at desc,id desc limit 1;
  if v_latest_submission is distinct from s.id then raise exception 'A newer submission exists. Review the latest submission instead.'; end if;
  if exists(select 1 from reviews where submission_id=s.id) then raise exception 'That submission already has a review decision.'; end if;

  insert into reviews(org_id,submission_id,reviewer_id,decision,comment,seen_at)
  values(w.org_id,s.id,auth.uid(),'returned',btrim(p_comment),now())
  returning id into v_review;

  if w.kind='task' and p_checklist_item_ids is not null and array_length(p_checklist_item_ids,1)>0 then
    insert into review_checklist_items(review_id,checklist_item_id)
    select v_review,ci.id from checklist_items ci
    where ci.id=any(p_checklist_item_ids) and ci.work_item_id=w.id
    on conflict do nothing;

    update checklist_ticks t set undone_at=now()
    from checklist_items ci
    where ci.id=t.checklist_item_id and ci.work_item_id=w.id
      and t.checklist_item_id=any(p_checklist_item_ids) and t.undone_at is null;
  end if;

  perform set_config('ceac.work_return','on',true);
  update work_items set status='returned',first_time_approved=false,completed_at=null,last_movement_at=now() where id=w.id;

  insert into activity_events(org_id,actor_id,verb,object_type,object_id,meta)
  values(w.org_id,auth.uid(),'returned','work_item',w.id,jsonb_build_object('submission_id',s.id,'review_id',v_review));

  return v_review;
end;
$$;

drop policy if exists operations_write on public.recurring_operations;
drop policy if exists occurrences_insert on public.operation_occurrences;

revoke all on function public.guard_typed_work_contract() from public,anon,authenticated;
revoke all on function public.create_typed_work_base(text,uuid,text,uuid,uuid,uuid,uuid,uuid,uuid,text,text,timestamptz,text,boolean,text) from public,anon,authenticated;
revoke all on function public.create_typed_work(text,uuid,text,uuid,uuid,uuid,uuid,uuid,uuid,text,text,timestamptz,text,boolean,jsonb) from public,anon;
revoke all on function public.record_routine_occurrence(uuid,date,numeric,text) from public,anon;
revoke all on function public.change_routine_schedule(uuid,date,text,smallint[],integer,date) from public,anon;
revoke all on function public.set_routine_paused(uuid,boolean,text) from public,anon;
revoke all on function public.resolve_work_case(uuid,text) from public,anon;
revoke all on function public.respond_work_request(uuid,text,text) from public,anon;
revoke all on function public.provide_request_clarification(uuid,text) from public,anon;
revoke all on function public.record_work_decision(uuid,text,text) from public,anon;
revoke all on function public.link_work_items(uuid,uuid,text) from public,anon;

grant execute on function public.create_typed_work(text,uuid,text,uuid,uuid,uuid,uuid,uuid,uuid,text,text,timestamptz,text,boolean,jsonb) to authenticated,service_role;
grant execute on function public.record_routine_occurrence(uuid,date,numeric,text) to authenticated,service_role;
grant execute on function public.change_routine_schedule(uuid,date,text,smallint[],integer,date) to authenticated,service_role;
grant execute on function public.set_routine_paused(uuid,boolean,text) to authenticated,service_role;
grant execute on function public.resolve_work_case(uuid,text) to authenticated,service_role;
grant execute on function public.respond_work_request(uuid,text,text) to authenticated,service_role;
grant execute on function public.provide_request_clarification(uuid,text) to authenticated,service_role;
grant execute on function public.record_work_decision(uuid,text,text) to authenticated,service_role;
grant execute on function public.link_work_items(uuid,uuid,text) to authenticated,service_role;
