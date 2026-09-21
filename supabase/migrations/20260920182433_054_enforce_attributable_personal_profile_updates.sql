
create or replace function public.guard_profile_self_update()
returns trigger
language plpgsql
security invoker
set search_path=public
as $$
begin
  if auth.uid() is null or public.app_is_admin() then
    return new;
  end if;

  if old.id=auth.uid() then
    if coalesce(current_setting('ceac.profile_personal_update',true),'')='on' then
      if (to_jsonb(new)-array['preferred_name','phone','birthday'])
           is distinct from
         (to_jsonb(old)-array['preferred_name','phone','birthday']) then
        raise exception 'Only Administration can change official employment or access details.'
          using errcode='42501';
      end if;
      return new;
    end if;

    if new is distinct from old then
      raise exception 'Update personal details through the personal-details action so the change is recorded.'
        using errcode='42501';
    end if;
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
  if auth.uid() is null then
    raise exception 'Sign in to update your details.' using errcode='42501';
  end if;

  select * into v_profile
  from public.profiles
  where id=auth.uid() and active;

  if v_profile.id is null then
    raise exception 'Your active profile was not found.' using errcode='42501';
  end if;

  v_org:=v_profile.org_id;

  if p_birthday>current_date then
    raise exception 'Birthday cannot be in the future.';
  end if;

  if jsonb_typeof(coalesce(p_social_handles,'{}'::jsonb))<>'object'
     or length(coalesce(p_social_handles,'{}'::jsonb)::text)>2000 then
    raise exception 'Social handles must be a small object.';
  end if;

  if v_profile.preferred_name is distinct from nullif(btrim(coalesce(p_preferred_name,'')),'') then
    v_changed:=array_append(v_changed,'preferred_name');
  end if;
  if v_profile.phone is distinct from nullif(btrim(coalesce(p_phone,'')),'') then
    v_changed:=array_append(v_changed,'phone');
  end if;
  if v_profile.birthday is distinct from p_birthday then
    v_changed:=array_append(v_changed,'birthday');
  end if;

  select * into v_details
  from public.profile_personal_details
  where profile_id=auth.uid();

  if v_details.emergency_contact_name is distinct from nullif(btrim(coalesce(p_emergency_contact_name,'')),'')
     or v_details.emergency_contact_phone is distinct from nullif(btrim(coalesce(p_emergency_contact_phone,'')),'')
     or v_details.emergency_contact_relationship is distinct from nullif(btrim(coalesce(p_emergency_contact_relationship,'')),'') then
    v_changed:=array_append(v_changed,'emergency_contact');
  end if;

  if v_details.address_text is distinct from nullif(btrim(coalesce(p_address_text,'')),'') then
    v_changed:=array_append(v_changed,'address');
  end if;

  if coalesce(v_details.social_handles,'{}'::jsonb) is distinct from coalesce(p_social_handles,'{}'::jsonb) then
    v_changed:=array_append(v_changed,'social_handles');
  end if;

  perform set_config('ceac.profile_personal_update','on',true);

  update public.profiles
  set preferred_name=nullif(btrim(coalesce(p_preferred_name,'')),''),
      phone=nullif(btrim(coalesce(p_phone,'')),''),
      birthday=p_birthday
  where id=auth.uid();

  insert into public.profile_personal_details(
    profile_id,org_id,emergency_contact_name,emergency_contact_phone,
    emergency_contact_relationship,address_text,social_handles,updated_by
  ) values (
    auth.uid(),v_org,
    nullif(btrim(coalesce(p_emergency_contact_name,'')),''),
    nullif(btrim(coalesce(p_emergency_contact_phone,'')),''),
    nullif(btrim(coalesce(p_emergency_contact_relationship,'')),''),
    nullif(btrim(coalesce(p_address_text,'')),''),
    coalesce(p_social_handles,'{}'::jsonb),
    auth.uid()
  )
  on conflict(profile_id) do update
  set emergency_contact_name=excluded.emergency_contact_name,
      emergency_contact_phone=excluded.emergency_contact_phone,
      emergency_contact_relationship=excluded.emergency_contact_relationship,
      address_text=excluded.address_text,
      social_handles=excluded.social_handles,
      updated_at=now(),
      updated_by=auth.uid();

  if cardinality(v_changed)>0 then
    insert into public.profile_personal_detail_events(org_id,profile_id,actor_id,changed_fields)
    values(v_org,auth.uid(),auth.uid(),v_changed);
  end if;
end;
$$;

revoke all on function public.update_my_personal_details(text,text,date,text,text,text,text,jsonb) from public,anon;
grant execute on function public.update_my_personal_details(text,text,date,text,text,text,text,jsonb) to authenticated,service_role;
