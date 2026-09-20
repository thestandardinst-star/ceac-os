
-- Invitation authority and invite-only account creation.
-- Every application-created account begins as staff in one authorised CEAC unit.
-- Administration may promote official roles after onboarding through the
-- protected unit-membership authority path.

alter table public.pending_invitations
  add column if not exists expires_at timestamptz;

update public.pending_invitations
set email=lower(btrim(email)),
    role='staff',
    expires_at=coalesce(expires_at, invited_at + interval '7 days')
where resolved_at is null;

alter table public.pending_invitations
  alter column unit_id set not null,
  alter column invited_by set not null,
  alter column expires_at set default (now() + interval '7 days'),
  alter column expires_at set not null;

alter table public.pending_invitations
  drop constraint if exists pending_invitations_role_check;

alter table public.pending_invitations
  add constraint pending_invitations_role_check
  check (role='staff');

create unique index if not exists pending_invitations_org_email_lower_uidx
  on public.pending_invitations(org_id,lower(email));

drop policy if exists pi_read on public.pending_invitations;
drop policy if exists pi_write on public.pending_invitations;
drop policy if exists pending_invitations_read on public.pending_invitations;

create policy pending_invitations_read
on public.pending_invitations
for select
to authenticated
using (
  org_id=public.app_org_id()
  and (
    public.app_is_admin()
    or unit_id in (select public.app_managed_units())
  )
);

revoke insert,update,delete on public.pending_invitations from authenticated;
grant select on public.pending_invitations to authenticated;

create or replace function public.create_pending_invitation(
  p_email text,
  p_full_name text,
  p_unit_id uuid,
  p_role text default 'staff'
)
returns public.pending_invitations
language plpgsql
security definer
set search_path=public
as $$
declare
  v_org uuid;
  v_invite public.pending_invitations;
  v_email text:=lower(btrim(coalesce(p_email,'')));
  v_name text:=nullif(btrim(coalesce(p_full_name,'')),'');
begin
  if auth.uid() is null then
    raise exception 'Sign in to invite someone.' using errcode='42501';
  end if;

  v_org:=public.app_org_id();
  if v_org is null then
    raise exception 'Your organisation could not be identified.' using errcode='42501';
  end if;

  if v_email='' or position('@' in v_email)<2 then
    raise exception 'Enter a valid email address.';
  end if;
  if v_name is null then
    raise exception 'Enter the person''s name.';
  end if;
  if p_unit_id is null then
    raise exception 'Choose a unit.';
  end if;
  if coalesce(p_role,'staff')<>'staff' then
    raise exception 'New accounts are invited as Staff. Administration can assign official authority after onboarding.'
      using errcode='42501';
  end if;

  if not exists (
    select 1 from public.units u
    where u.id=p_unit_id and u.org_id=v_org and u.active
  ) then
    raise exception 'That unit is not an active unit in your organisation.' using errcode='42501';
  end if;

  if not public.app_is_admin()
     and p_unit_id not in (select public.app_managed_units()) then
    raise exception 'You can only invite Staff into a unit you manage.' using errcode='42501';
  end if;

  if exists (
    select 1 from public.profiles p
    where lower(p.email)=v_email and p.org_id=v_org
  ) then
    raise exception 'That email already has a CEAC account.';
  end if;

  insert into public.pending_invitations(
    org_id,email,full_name,unit_id,role,invited_by,invited_at,resolved_at,expires_at
  )
  values(
    v_org,v_email,v_name,p_unit_id,'staff',auth.uid(),now(),null,now()+interval '7 days'
  )
  on conflict (org_id,lower(email)) do update
  set full_name=excluded.full_name,
      unit_id=excluded.unit_id,
      role='staff',
      invited_by=auth.uid(),
      invited_at=now(),
      resolved_at=null,
      expires_at=now()+interval '7 days'
  returning * into v_invite;

  insert into public.activity_events(org_id,actor_id,verb,object_type,object_id,meta)
  values(
    v_org,auth.uid(),'staff_invited','pending_invitation',v_invite.id,
    jsonb_build_object('unit_id',p_unit_id)
  );

  return v_invite;
end;
$$;

revoke all on function public.create_pending_invitation(text,text,uuid,text) from public,anon;
grant execute on function public.create_pending_invitation(text,text,uuid,text) to authenticated,service_role;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  v_invite public.pending_invitations%rowtype;
begin
  if new.email is null then
    raise exception 'A valid CEAC invitation is required.';
  end if;

  select *
  into v_invite
  from public.pending_invitations
  where lower(email)=lower(new.email)
    and resolved_at is null
    and expires_at>now()
  order by invited_at desc
  limit 1
  for update;

  if v_invite.id is null then
    raise exception 'A valid, unexpired CEAC invitation is required.';
  end if;

  if v_invite.role<>'staff' then
    raise exception 'Invited accounts must begin as Staff.' using errcode='42501';
  end if;

  if not exists (
    select 1 from public.units u
    where u.id=v_invite.unit_id
      and u.org_id=v_invite.org_id
      and u.active
  ) then
    raise exception 'The invitation unit is no longer active.' using errcode='42501';
  end if;

  insert into public.profiles(id,org_id,full_name,email,job_title)
  values(
    new.id,
    v_invite.org_id,
    coalesce(nullif(btrim(v_invite.full_name),''),split_part(lower(new.email),'@',1)),
    lower(new.email),
    null
  );

  insert into public.unit_memberships(org_id,unit_id,profile_id,role)
  values(v_invite.org_id,v_invite.unit_id,new.id,'staff');

  update public.pending_invitations
  set resolved_at=now()
  where id=v_invite.id;

  insert into public.activity_events(org_id,actor_id,verb,object_type,object_id,meta)
  values(
    v_invite.org_id,new.id,'account_activated','profile',new.id,
    jsonb_build_object('invitation_id',v_invite.id,'unit_id',v_invite.unit_id)
  );

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public,anon,authenticated;
