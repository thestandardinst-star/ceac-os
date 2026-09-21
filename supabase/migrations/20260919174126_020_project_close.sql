-- F. Project close — the manager's accountability record.
--
-- Checked first whether the reporting tables from 010 could carry this.
-- They cannot: reports hold a narrative and named targets against a
-- reporting period, with no objective verdicts, no planned-versus-actual
-- cost by currency, and no unit-versus-overall distinction. A separate
-- model is warranted rather than bending that one.
--
-- Corrections are new versions, never edits. A submitted close is
-- immutable: the update policy only matches drafts.

create table if not exists project_closes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organisations(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  scope text not null check (scope in ('unit','overall')),
  unit_id uuid references units(id) on delete restrict,   -- null only for overall
  version int not null default 1,
  status text not null check (status in ('draft','submitted')) default 'draft',
  deliverables_note text,
  challenges text,
  do_differently text,
  author_id uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  submitted_at timestamptz,
  check ((scope = 'unit' and unit_id is not null) or (scope = 'overall' and unit_id is null))
);
create unique index if not exists project_closes_version_idx
  on project_closes (project_id, scope,
                     coalesce(unit_id,'00000000-0000-0000-0000-000000000000'::uuid), version);

create table if not exists project_close_objectives (
  close_id uuid not null references project_closes(id) on delete cascade,
  objective_id uuid not null references objectives(id) on delete restrict,
  outcome text not null check (outcome in ('met','partly_met','not_met')),
  note text,
  primary key (close_id, objective_id)
);

-- One row per currency. Never summed across currencies.
create table if not exists project_close_costs (
  close_id uuid not null references project_closes(id) on delete cascade,
  currency text not null check (currency in ('GHS','USD','GBP','EUR','NGN','ZAR','CAD')),
  planned_amount_minor bigint not null default 0,
  actual_amount_minor bigint not null default 0,
  primary key (close_id, currency)
);

-- Deliverables point at real records where they exist, so they are
-- traceable rather than retyped.
create table if not exists project_close_deliverables (
  id uuid primary key default gen_random_uuid(),
  close_id uuid not null references project_closes(id) on delete cascade,
  work_item_id uuid references work_items(id) on delete set null,
  submission_id uuid references submissions(id) on delete set null,
  description text not null,
  position int not null default 1
);

alter table project_closes             enable row level security;
alter table project_close_objectives   enable row level security;
alter table project_close_costs        enable row level security;
alter table project_close_deliverables enable row level security;

-- Read: project participants, Administration, Group Pastor.
create policy pc_read on project_closes for select
  using (org_id = app_org_id() and (
    app_is_admin() or app_is_exec() or project_id in (select app_visible_projects())));

-- Write: a participating manager writes their own unit's close. The
-- lead-unit manager writes the overall close. Drafts only — a submitted
-- close cannot be edited, which is what makes it a record.
create policy pc_insert on project_closes for insert
  with check (org_id = app_org_id() and author_id = auth.uid() and (
    (scope = 'unit' and unit_id in (select app_managed_units())
      and exists (select 1 from project_units pu where pu.project_id = project_id and pu.unit_id = unit_id))
    or (scope = 'overall' and exists (
        select 1 from projects p where p.id = project_id
          and p.lead_unit_id in (select app_managed_units())))
    or app_is_admin()));

create policy pc_update on project_closes for update
  using (org_id = app_org_id() and status = 'draft' and (author_id = auth.uid() or app_is_admin()))
  with check (org_id = app_org_id() and (author_id = auth.uid() or app_is_admin()));

create policy pco_rw on project_close_objectives for all
  using (close_id in (select id from project_closes))
  with check (close_id in (select id from project_closes where status = 'draft'));
create policy pcc_rw on project_close_costs for all
  using (close_id in (select id from project_closes))
  with check (close_id in (select id from project_closes where status = 'draft'));
create policy pcd_rw on project_close_deliverables for all
  using (close_id in (select id from project_closes))
  with check (close_id in (select id from project_closes where status = 'draft'));

-- Submitting is a transition, not a field edit.
create or replace function submit_project_close(p_close_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare c record; v_missing int;
begin
  select * into c from project_closes where id = p_close_id;
  if c is null then raise exception 'That close record does not exist.'; end if;
  if c.org_id <> app_org_id() then raise exception 'That belongs to another organisation.'; end if;
  if c.status = 'submitted' then raise exception 'That close has already been submitted.'; end if;

  if c.scope = 'unit' then
    if not (c.unit_id in (select app_managed_units()) or app_is_admin()) then
      raise exception 'Only the head of that unit can submit its close.';
    end if;
  else
    if not (exists (select 1 from projects p where p.id = c.project_id
                    and p.lead_unit_id in (select app_managed_units())) or app_is_admin()) then
      raise exception 'Only the lead unit can submit the overall close.';
    end if;
  end if;

  -- Every relevant objective needs a verdict. Task completion is evidence,
  -- not the verdict, so it is never inferred.
  select count(*) into v_missing
    from objectives o
   where o.project_id = c.project_id
     and (c.scope = 'overall' or o.unit_id = c.unit_id)
     and not exists (select 1 from project_close_objectives x
                     where x.close_id = c.id and x.objective_id = o.id);
  if v_missing > 0 then
    raise exception 'Give a verdict on every objective — % still without one.', v_missing;
  end if;

  if c.deliverables_note is null and not exists (
       select 1 from project_close_deliverables d where d.close_id = c.id) then
    raise exception 'Say what was actually produced.';
  end if;

  update project_closes set status = 'submitted', submitted_at = now() where id = c.id;
  return c.id;
end; $$;
revoke all on function submit_project_close(uuid) from public;
grant execute on function submit_project_close(uuid) to authenticated;

-- Only a submitted overall close may move the project itself to closed.
create or replace function close_project(p_project_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_close uuid;
begin
  select id into v_close from project_closes
   where project_id = p_project_id and scope = 'overall' and status = 'submitted'
   order by version desc limit 1;
  if v_close is null then
    raise exception 'Submit the overall close first. A project is not closed by changing its status.';
  end if;
  if not (exists (select 1 from projects p where p.id = p_project_id
                  and p.lead_unit_id in (select app_managed_units())) or app_is_admin()) then
    raise exception 'Only the lead unit can close the project.';
  end if;
  update projects set status = 'closed' where id = p_project_id and org_id = app_org_id();
  return v_close;
end; $$;
revoke all on function close_project(uuid) from public;
grant execute on function close_project(uuid) to authenticated;
