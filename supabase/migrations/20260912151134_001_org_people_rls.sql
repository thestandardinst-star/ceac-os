create extension if not exists "pgcrypto";

create table organisations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  short_code  text not null unique,
  created_at  timestamptz not null default now()
);

create table units (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references organisations(id) on delete cascade,
  name         text not null,
  code         text not null,
  parent_id    uuid references units(id) on delete set null,
  review_mode  text not null default 'task_review'
               check (review_mode in ('task_review','weekly_return')),
  active       boolean not null default true,
  position     int not null default 0,
  created_at   timestamptz not null default now(),
  unique (org_id, code)
);

create table sub_teams (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organisations(id) on delete cascade,
  unit_id       uuid not null references units(id) on delete cascade,
  name          text not null,
  code          text not null,
  lead_id       uuid,
  position      int not null default 0,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  unique (unit_id, code)
);

create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  org_id      uuid not null references organisations(id) on delete cascade,
  full_name   text not null,
  email       text not null,
  job_title   text,
  phone       text,
  started_on  date,
  is_admin    boolean not null default false,
  is_exec     boolean not null default false,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);
create index on profiles (org_id);

create table unit_memberships (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organisations(id) on delete cascade,
  profile_id  uuid not null references profiles(id) on delete cascade,
  unit_id     uuid not null references units(id) on delete cascade,
  role        text not null default 'staff'
              check (role in ('manager','sub_team_lead','staff')),
  created_at  timestamptz not null default now(),
  unique (profile_id, unit_id)
);
create index on unit_memberships (unit_id);
create index on unit_memberships (profile_id);

create table sub_team_members (
  sub_team_id uuid not null references sub_teams(id) on delete cascade,
  profile_id  uuid not null references profiles(id) on delete cascade,
  primary key (sub_team_id, profile_id)
);

alter table sub_teams
  add constraint sub_teams_lead_fk
  foreign key (lead_id) references profiles(id) on delete set null;

create table capabilities (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organisations(id) on delete cascade,
  profile_id  uuid not null references profiles(id) on delete cascade,
  capability  text not null
              check (capability in (
                'create_project','create_campaign','create_event',
                'post_announcement','run_payroll','manage_people'
              )),
  granted_by  uuid references profiles(id),
  granted_at  timestamptz not null default now(),
  unique (profile_id, capability)
);

create table thresholds (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organisations(id) on delete cascade,
  name        text not null,
  label       text not null,
  value       numeric not null,
  unit_label  text not null,
  updated_by  uuid references profiles(id),
  updated_at  timestamptz not null default now(),
  unique (org_id, name)
);

create or replace function app_org_id()
returns uuid language sql stable security definer set search_path = public as $$
  select org_id from profiles where id = auth.uid();
$$;

create or replace function app_is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from profiles where id = auth.uid()), false);
$$;

create or replace function app_is_exec()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_exec from profiles where id = auth.uid()), false);
$$;

create or replace function app_my_units()
returns setof uuid language sql stable security definer set search_path = public as $$
  select unit_id from unit_memberships where profile_id = auth.uid();
$$;

create or replace function app_managed_units()
returns setof uuid language sql stable security definer set search_path = public as $$
  select unit_id from unit_memberships where profile_id = auth.uid() and role = 'manager';
$$;

create or replace function app_led_sub_teams()
returns setof uuid language sql stable security definer set search_path = public as $$
  select id from sub_teams where lead_id = auth.uid();
$$;

alter table organisations    enable row level security;
alter table units            enable row level security;
alter table sub_teams        enable row level security;
alter table profiles         enable row level security;
alter table unit_memberships enable row level security;
alter table sub_team_members enable row level security;
alter table capabilities     enable row level security;
alter table thresholds       enable row level security;

create policy profiles_own_read on profiles
  for select using (id = auth.uid());
create policy profiles_org_read on profiles
  for select using (org_id = app_org_id());
create policy profiles_own_update on profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_admin_write on profiles
  for all using (app_is_admin() and org_id = app_org_id())
  with check (app_is_admin() and org_id = app_org_id());

create policy org_read on organisations
  for select using (id = app_org_id());

create policy units_read on units
  for select using (org_id = app_org_id());
create policy units_admin_write on units
  for all using (app_is_admin() and org_id = app_org_id())
  with check (app_is_admin() and org_id = app_org_id());

create policy sub_teams_read on sub_teams
  for select using (org_id = app_org_id());
create policy sub_teams_manager_write on sub_teams
  for all using (org_id = app_org_id() and (app_is_admin() or unit_id in (select app_managed_units())))
  with check (org_id = app_org_id() and (app_is_admin() or unit_id in (select app_managed_units())));

create policy memberships_read on unit_memberships
  for select using (org_id = app_org_id());
create policy memberships_manager_write on unit_memberships
  for all using (org_id = app_org_id() and (app_is_admin() or unit_id in (select app_managed_units())))
  with check (org_id = app_org_id() and (app_is_admin() or unit_id in (select app_managed_units())));

create policy sub_team_members_read on sub_team_members
  for select using (sub_team_id in (select id from sub_teams where org_id = app_org_id()));
create policy sub_team_members_manager_write on sub_team_members
  for all using (sub_team_id in (select id from sub_teams where org_id = app_org_id() and unit_id in (select app_managed_units())) or app_is_admin())
  with check (sub_team_id in (select id from sub_teams where org_id = app_org_id() and unit_id in (select app_managed_units())) or app_is_admin());

create policy capabilities_own_read on capabilities
  for select using (profile_id = auth.uid() or app_is_admin());
create policy capabilities_admin_write on capabilities
  for all using (app_is_admin() and org_id = app_org_id())
  with check (app_is_admin() and org_id = app_org_id());

create policy thresholds_read on thresholds
  for select using (org_id = app_org_id());
create policy thresholds_admin_write on thresholds
  for all using (app_is_admin() and org_id = app_org_id())
  with check (app_is_admin() and org_id = app_org_id());
