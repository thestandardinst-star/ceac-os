-- Link-based unit resources. This deliberately stores references, not files,
-- so ordinary operating documents do not create a second public storage silo.

create table public.unit_resources (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete cascade,
  unit_id uuid not null references public.units(id) on delete cascade,
  title text not null check (length(btrim(title)) between 1 and 180),
  category text not null default 'reference'
    check (category in ('brand','run_sheet','template','guide','reference','other')),
  reference_url text not null check (reference_url ~ '^https://'),
  description text check (description is null or length(description)<=1000),
  visibility text not null default 'unit' check (visibility in ('unit','organisation')),
  active boolean not null default true,
  pinned boolean not null default false,
  sort_order integer not null default 0,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index unit_resources_unit_active_idx
  on public.unit_resources(unit_id,active,pinned desc,sort_order,title);

alter table public.unit_resources enable row level security;

create policy unit_resources_read on public.unit_resources
for select using (
  org_id=public.app_org_id()
  and (
    public.app_is_admin()
    or public.app_is_exec()
    or unit_id in (select public.app_managed_units())
    or (
      active
      and (
        visibility='organisation'
        or unit_id in (select public.app_my_units())
      )
    )
  )
);

create or replace function public.save_unit_resource(
  p_resource_id uuid,
  p_unit_id uuid,
  p_title text,
  p_category text,
  p_reference_url text,
  p_description text default null,
  p_visibility text default 'unit',
  p_pinned boolean default false,
  p_sort_order integer default 0
)
returns public.unit_resources
language plpgsql
security definer
set search_path=public
as $$
declare
  v_unit public.units;
  v_resource public.unit_resources;
  v_is_admin boolean;
begin
  if auth.uid() is null then
    raise exception 'Sign in to manage unit resources.' using errcode='42501';
  end if;

  select public.app_is_admin() into v_is_admin;
  select * into v_unit from public.units where id=p_unit_id and org_id=public.app_org_id();
  if v_unit.id is null then raise exception 'That unit is not available.' using errcode='42501'; end if;
  if not (v_is_admin or p_unit_id in (select public.app_managed_units())) then
    raise exception 'You are not allowed to manage resources for that unit.' using errcode='42501';
  end if;
  if p_visibility not in ('unit','organisation') then raise exception 'Choose a valid visibility.'; end if;
  if p_visibility='organisation' and not v_is_admin then
    raise exception 'Only Administration may publish an organisation-wide resource.' using errcode='42501';
  end if;
  if p_category not in ('brand','run_sheet','template','guide','reference','other') then
    raise exception 'Choose a valid resource category.';
  end if;
  if btrim(coalesce(p_title,''))='' then raise exception 'Give the resource a title.'; end if;
  if coalesce(p_reference_url,'') !~ '^https://' then raise exception 'Use a secure https link.'; end if;

  if p_resource_id is null then
    insert into public.unit_resources(
      org_id,unit_id,title,category,reference_url,description,visibility,pinned,sort_order,created_by
    ) values (
      v_unit.org_id,p_unit_id,btrim(p_title),p_category,btrim(p_reference_url),
      nullif(btrim(coalesce(p_description,'')),''),p_visibility,coalesce(p_pinned,false),
      coalesce(p_sort_order,0),auth.uid()
    ) returning * into v_resource;
    insert into public.activity_events(org_id,actor_id,verb,object_type,object_id,meta)
    values(v_unit.org_id,auth.uid(),'unit_resource_created','unit_resource',v_resource.id,
      jsonb_build_object('unit_id',p_unit_id,'visibility',p_visibility));
  else
    select * into v_resource from public.unit_resources where id=p_resource_id for update;
    if v_resource.id is null or v_resource.unit_id<>p_unit_id or v_resource.org_id<>v_unit.org_id then
      raise exception 'That resource is not available.' using errcode='42501';
    end if;
    update public.unit_resources
    set title=btrim(p_title),category=p_category,reference_url=btrim(p_reference_url),
        description=nullif(btrim(coalesce(p_description,'')),''),visibility=p_visibility,
        pinned=coalesce(p_pinned,false),sort_order=coalesce(p_sort_order,0),updated_at=now()
    where id=p_resource_id returning * into v_resource;
    insert into public.activity_events(org_id,actor_id,verb,object_type,object_id,meta)
    values(v_unit.org_id,auth.uid(),'unit_resource_updated','unit_resource',v_resource.id,
      jsonb_build_object('unit_id',p_unit_id,'visibility',p_visibility));
  end if;
  return v_resource;
end;
$$;

create or replace function public.set_unit_resource_active(
  p_resource_id uuid,
  p_active boolean
)
returns public.unit_resources
language plpgsql
security definer
set search_path=public
as $$
declare
  v_resource public.unit_resources;
begin
  if auth.uid() is null then raise exception 'Sign in to manage unit resources.' using errcode='42501'; end if;
  select * into v_resource from public.unit_resources where id=p_resource_id for update;
  if v_resource.id is null or v_resource.org_id<>public.app_org_id() then
    raise exception 'That resource is not available.' using errcode='42501';
  end if;
  if not (public.app_is_admin() or v_resource.unit_id in (select public.app_managed_units())) then
    raise exception 'You are not allowed to manage that resource.' using errcode='42501';
  end if;
  update public.unit_resources set active=coalesce(p_active,false),updated_at=now()
  where id=p_resource_id returning * into v_resource;
  insert into public.activity_events(org_id,actor_id,verb,object_type,object_id,meta)
  values(v_resource.org_id,auth.uid(),
    case when v_resource.active then 'unit_resource_restored' else 'unit_resource_archived' end,
    'unit_resource',v_resource.id,jsonb_build_object('unit_id',v_resource.unit_id));
  return v_resource;
end;
$$;

revoke all on table public.unit_resources from anon;
revoke insert,update,delete on table public.unit_resources from authenticated;
grant select on table public.unit_resources to authenticated;

revoke execute on function public.save_unit_resource(uuid,uuid,text,text,text,text,text,boolean,integer) from public,anon;
revoke execute on function public.set_unit_resource_active(uuid,boolean) from public,anon;
grant execute on function public.save_unit_resource(uuid,uuid,text,text,text,text,text,boolean,integer) to authenticated,service_role;
grant execute on function public.set_unit_resource_active(uuid,boolean) to authenticated,service_role;
