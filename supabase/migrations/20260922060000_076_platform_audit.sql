-- 076 — Stage 1B: append-only ordinary-platform audit.
-- Protected HR remains in hr_private.audit_events.

create table public.platform_audit_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id uuid,
  subject_profile_id uuid references public.profiles(id) on delete set null,
  source_table text not null,
  changed_fields text[] not null default '{}',
  context jsonb not null default '{}'::jsonb check (jsonb_typeof(context)='object'),
  created_at timestamptz not null default now()
);

create index platform_audit_events_org_created_idx
  on public.platform_audit_events(org_id,created_at desc);
create index platform_audit_events_actor_idx
  on public.platform_audit_events(actor_id,created_at desc);
create index platform_audit_events_resource_idx
  on public.platform_audit_events(resource_type,resource_id,created_at desc);
create index platform_audit_events_subject_idx
  on public.platform_audit_events(subject_profile_id,created_at desc);

alter table public.platform_audit_events enable row level security;

create policy platform_audit_events_admin_read
on public.platform_audit_events
for select
to authenticated
using (
  org_id=public.app_org_id()
  and public.app_is_admin()
);

revoke all on public.platform_audit_events from anon;
revoke insert,update,delete on public.platform_audit_events from authenticated;
grant select on public.platform_audit_events to authenticated;

create or replace function public.platform_audit_immutable()
returns trigger
language plpgsql
security invoker
set search_path=public
as $$
begin
  raise exception 'Platform audit history is append-only.' using errcode='42501';
end;
$$;

revoke all on function public.platform_audit_immutable() from public,anon,authenticated;

create trigger platform_audit_events_immutable
before update or delete on public.platform_audit_events
for each row execute function public.platform_audit_immutable();

create or replace function public.platform_audit_capture()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  v_row jsonb;
  v_old jsonb;
  v_new jsonb;
  v_org uuid;
  v_resource_id uuid;
  v_subject_id uuid;
  v_changed text[]:='{}';
  v_resource_type text:=coalesce(nullif(tg_argv[0],''),tg_table_name);
  v_resource_key text:=coalesce(nullif(tg_argv[1],''),'id');
  v_subject_key text:=nullif(tg_argv[2],'');
begin
  if tg_op='DELETE' then
    v_row:=to_jsonb(old);
  else
    v_row:=to_jsonb(new);
  end if;

  begin
    v_org:=nullif(v_row->>'org_id','')::uuid;
  exception when others then
    v_org:=null;
  end;

  if v_org is null and tg_table_name='organisations' then
    begin v_org:=nullif(v_row->>'id','')::uuid; exception when others then v_org:=null; end;
  end if;

  if v_org is null then
    return case when tg_op='DELETE' then old else new end;
  end if;

  begin
    v_resource_id:=nullif(v_row->>v_resource_key,'')::uuid;
  exception when others then
    v_resource_id:=null;
  end;

  if v_subject_key is not null then
    begin
      v_subject_id:=nullif(v_row->>v_subject_key,'')::uuid;
    exception when others then
      v_subject_id:=null;
    end;
  end if;

  if tg_op='UPDATE' then
    v_old:=to_jsonb(old);
    v_new:=to_jsonb(new);
    select coalesce(array_agg(k order by k),'{}'::text[])
    into v_changed
    from (
      select key as k
      from jsonb_object_keys(v_new) key
      where (v_old->key) is distinct from (v_new->key)
    ) changed;
  end if;

  insert into public.platform_audit_events(
    org_id,actor_id,action,resource_type,resource_id,subject_profile_id,
    source_table,changed_fields,context
  ) values (
    v_org,
    auth.uid(),
    v_resource_type||'.'||lower(tg_op),
    v_resource_type,
    v_resource_id,
    v_subject_id,
    tg_table_schema||'.'||tg_table_name,
    coalesce(v_changed,'{}'::text[]),
    '{}'::jsonb
  );

  if tg_op='DELETE' then return old; end if;
  return new;
end;
$$;

revoke all on function public.platform_audit_capture() from public,anon,authenticated;

-- Consequential ordinary-platform records. The arguments are:
-- resource type, resource-id field, subject-profile field (optional).
create trigger audit_profiles
after insert or update or delete on public.profiles
for each row execute function public.platform_audit_capture('profile','id','id');

create trigger audit_unit_memberships
after insert or update or delete on public.unit_memberships
for each row execute function public.platform_audit_capture('unit_membership','id','profile_id');

create trigger audit_capabilities
after insert or update or delete on public.capabilities
for each row execute function public.platform_audit_capture('capability','id','profile_id');

create trigger audit_thresholds
after insert or update or delete on public.thresholds
for each row execute function public.platform_audit_capture('threshold','id','');

create trigger audit_leave_settings
after insert or update or delete on public.leave_settings
for each row execute function public.platform_audit_capture('leave_policy','org_id','');

create trigger audit_office_locations
after insert or update or delete on public.office_locations
for each row execute function public.platform_audit_capture('office_location','id','');

create trigger audit_employment_records
after insert or update or delete on public.employment_records
for each row execute function public.platform_audit_capture('employment_record','profile_id','profile_id');

create trigger audit_employment_history
after insert or update or delete on public.employment_history
for each row execute function public.platform_audit_capture('employment_history','id','profile_id');

create trigger audit_projects
after insert or update or delete on public.projects
for each row execute function public.platform_audit_capture('project','id','');

create trigger audit_finance_requests
after insert or update or delete on public.finance_requests
for each row execute function public.platform_audit_capture('finance_request','id','');

create trigger audit_ministry_events
after insert or update or delete on public.ministry_events
for each row execute function public.platform_audit_capture('ministry_event','id','');

create trigger audit_announcements
after insert or update or delete on public.announcements
for each row execute function public.platform_audit_capture('announcement','id','');
