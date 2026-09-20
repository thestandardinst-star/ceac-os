-- Employee-maintained ordinary details. Emergency contacts and addresses are
-- deliberately separated from profiles because profile rows are visible to
-- colleagues in the same unit under the people-directory contract.

alter table public.profiles
  add column if not exists preferred_name text
    check (preferred_name is null or length(preferred_name)<=120);

create table public.profile_personal_details (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  org_id uuid not null references public.organisations(id) on delete cascade,
  emergency_contact_name text check (emergency_contact_name is null or length(emergency_contact_name)<=180),
  emergency_contact_phone text check (emergency_contact_phone is null or length(emergency_contact_phone)<=60),
  emergency_contact_relationship text check (emergency_contact_relationship is null or length(emergency_contact_relationship)<=100),
  address_text text check (address_text is null or length(address_text)<=600),
  social_handles jsonb not null default '{}'::jsonb check (jsonb_typeof(social_handles)='object'),
  updated_at timestamptz not null default now(),
  updated_by uuid not null references public.profiles(id) on delete restrict
);

create table public.profile_personal_detail_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid not null references public.profiles(id) on delete restrict,
  changed_fields text[] not null,
  created_at timestamptz not null default now()
);

create index profile_personal_detail_events_profile_idx
  on public.profile_personal_detail_events(profile_id,created_at desc);

alter table public.profile_personal_details enable row level security;
alter table public.profile_personal_detail_events enable row level security;

create policy profile_personal_details_read on public.profile_personal_details
for select using (
  org_id=public.app_org_id()
  and (profile_id=auth.uid() or public.app_is_admin())
);

create policy profile_personal_detail_events_read on public.profile_personal_detail_events
for select using (
  org_id=public.app_org_id()
  and (profile_id=auth.uid() or public.app_is_admin())
);

-- Future profile columns are official by default. Only this explicit ordinary
-- set may be changed by the employee under the existing self-update policy.
create or replace function public.guard_profile_self_update()
returns trigger
language plpgsql
security invoker
set search_path=public
as $$
begin
  if auth.uid() is null or public.app_is_admin() then return new; end if;
  if old.id=auth.uid() and
     (to_jsonb(new)-array['preferred_name','phone','birthday'])
       is distinct from
     (to_jsonb(old)-array['preferred_name','phone','birthday']) then
    raise exception 'Only Administration can change official employment or access details.'
      using errcode='42501';
  end if;
  return new;
end;
$$;

create or replace function public.update_my_personal_details(
  p_preferred_name text,
  p_phone text,
  p_birthday date,
  p_emergency_contact_name text,
  p_emergency_contact_phone text,
  p_emergency_contact_relationship text,
  p_address_text text,
  p_social_handles jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path=public
as $$
declare
  v_org uuid;
  v_changed text[] := '{}';
  v_profile public.profiles;
  v_details public.profile_personal_details;
begin
  if auth.uid() is null then raise exception 'Sign in to update your details.' using errcode='42501'; end if;
  select * into v_profile from public.profiles where id=auth.uid() and active;
  if v_profile.id is null then raise exception 'Your active profile was not found.' using errcode='42501'; end if;
  v_org:=v_profile.org_id;
  if p_birthday>current_date then raise exception 'Birthday cannot be in the future.'; end if;
  if jsonb_typeof(coalesce(p_social_handles,'{}'::jsonb))<>'object'
     or length(coalesce(p_social_handles,'{}'::jsonb)::text)>2000 then
    raise exception 'Social handles must be a small object.';
  end if;

  if v_profile.preferred_name is distinct from nullif(btrim(coalesce(p_preferred_name,'')),'') then v_changed:=array_append(v_changed,'preferred_name'); end if;
  if v_profile.phone is distinct from nullif(btrim(coalesce(p_phone,'')),'') then v_changed:=array_append(v_changed,'phone'); end if;
  if v_profile.birthday is distinct from p_birthday then v_changed:=array_append(v_changed,'birthday'); end if;
  select * into v_details from public.profile_personal_details where profile_id=auth.uid();
  if v_details.emergency_contact_name is distinct from nullif(btrim(coalesce(p_emergency_contact_name,'')),'')
     or v_details.emergency_contact_phone is distinct from nullif(btrim(coalesce(p_emergency_contact_phone,'')),'')
     or v_details.emergency_contact_relationship is distinct from nullif(btrim(coalesce(p_emergency_contact_relationship,'')),'') then
    v_changed:=array_append(v_changed,'emergency_contact');
  end if;
  if v_details.address_text is distinct from nullif(btrim(coalesce(p_address_text,'')),'') then v_changed:=array_append(v_changed,'address'); end if;
  if coalesce(v_details.social_handles,'{}'::jsonb) is distinct from coalesce(p_social_handles,'{}'::jsonb) then v_changed:=array_append(v_changed,'social_handles'); end if;

  update public.profiles set
    preferred_name=nullif(btrim(coalesce(p_preferred_name,'')),''),
    phone=nullif(btrim(coalesce(p_phone,'')),''),
    birthday=p_birthday
  where id=auth.uid();

  insert into public.profile_personal_details(
    profile_id,org_id,emergency_contact_name,emergency_contact_phone,
    emergency_contact_relationship,address_text,social_handles,updated_by
  ) values (
    auth.uid(),v_org,nullif(btrim(coalesce(p_emergency_contact_name,'')),''),
    nullif(btrim(coalesce(p_emergency_contact_phone,'')),''),
    nullif(btrim(coalesce(p_emergency_contact_relationship,'')),''),
    nullif(btrim(coalesce(p_address_text,'')),''),coalesce(p_social_handles,'{}'::jsonb),auth.uid()
  ) on conflict(profile_id) do update set
    emergency_contact_name=excluded.emergency_contact_name,
    emergency_contact_phone=excluded.emergency_contact_phone,
    emergency_contact_relationship=excluded.emergency_contact_relationship,
    address_text=excluded.address_text,social_handles=excluded.social_handles,
    updated_at=now(),updated_by=auth.uid();

  if cardinality(v_changed)>0 then
    insert into public.profile_personal_detail_events(org_id,profile_id,actor_id,changed_fields)
    values(v_org,auth.uid(),auth.uid(),v_changed);
  end if;
end;
$$;

revoke all on table public.profile_personal_details from anon;
revoke all on table public.profile_personal_detail_events from anon;
revoke insert,update,delete on table public.profile_personal_details from authenticated;
revoke insert,update,delete on table public.profile_personal_detail_events from authenticated;
grant select on table public.profile_personal_details to authenticated;
grant select on table public.profile_personal_detail_events to authenticated;
revoke execute on function public.update_my_personal_details(text,text,date,text,text,text,text,jsonb) from public,anon;
grant execute on function public.update_my_personal_details(text,text,date,text,text,text,text,jsonb) to authenticated,service_role;
