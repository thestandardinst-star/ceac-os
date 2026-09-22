-- 083 — Stage 3: protected HR records behind the hr_private boundary.
-- Sensitive values remain outside public profiles and are reachable only through
-- reviewed capability-checked SECURITY DEFINER RPCs.

create table if not exists hr_private.identifiers(
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete restrict,
  profile_id uuid not null references public.profiles(id) on delete restrict,
  identifier_type text not null check(length(btrim(identifier_type)) between 2 and 80),
  identifier_value text not null check(length(btrim(identifier_value)) between 2 and 240),
  issued_on date,
  expires_on date,
  status text not null default 'active' check(status in ('active','replaced')),
  replaces_id uuid references hr_private.identifiers(id) on delete restrict,
  recorded_by uuid not null references public.profiles(id) on delete restrict,
  recorded_at timestamptz not null default now()
);

create table if not exists hr_private.employment_terms(
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete restrict,
  profile_id uuid not null references public.profiles(id) on delete restrict,
  term_type text not null check(length(btrim(term_type)) between 2 and 80),
  summary text not null check(length(btrim(summary)) between 3 and 1200),
  starts_on date not null,
  ends_on date,
  status text not null default 'active' check(status in ('active','replaced')),
  replaces_id uuid references hr_private.employment_terms(id) on delete restrict,
  recorded_by uuid not null references public.profiles(id) on delete restrict,
  recorded_at timestamptz not null default now(),
  check(ends_on is null or ends_on>=starts_on)
);

create table if not exists hr_private.compensation_history(
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete restrict,
  profile_id uuid not null references public.profiles(id) on delete restrict,
  amount_minor bigint not null check(amount_minor>=0),
  currency text not null check(currency ~ '^[A-Z]{3}$'),
  basis_label text not null check(length(btrim(basis_label)) between 2 and 80),
  effective_on date not null,
  ends_on date,
  note text,
  status text not null default 'active' check(status in ('active','replaced')),
  replaces_id uuid references hr_private.compensation_history(id) on delete restrict,
  recorded_by uuid not null references public.profiles(id) on delete restrict,
  recorded_at timestamptz not null default now(),
  check(ends_on is null or ends_on>=effective_on)
);

create table if not exists hr_private.payment_details(
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete restrict,
  profile_id uuid not null references public.profiles(id) on delete restrict,
  payment_type text not null check(length(btrim(payment_type)) between 2 and 80),
  provider_name text not null check(length(btrim(provider_name)) between 2 and 120),
  account_name text not null check(length(btrim(account_name)) between 2 and 160),
  account_reference text not null check(length(btrim(account_reference)) between 2 and 240),
  branch_reference text,
  status text not null default 'active' check(status in ('active','replaced')),
  replaces_id uuid references hr_private.payment_details(id) on delete restrict,
  recorded_by uuid not null references public.profiles(id) on delete restrict,
  recorded_at timestamptz not null default now()
);

alter table hr_private.identifiers enable row level security;
alter table hr_private.employment_terms enable row level security;
alter table hr_private.compensation_history enable row level security;
alter table hr_private.payment_details enable row level security;

create unique index if not exists hr_identifiers_active_uidx
  on hr_private.identifiers(org_id,profile_id,lower(identifier_type))
  where status='active';
create index if not exists hr_terms_profile_idx
  on hr_private.employment_terms(org_id,profile_id,starts_on desc);
create index if not exists hr_comp_profile_idx
  on hr_private.compensation_history(org_id,profile_id,effective_on desc);
create index if not exists hr_payment_profile_idx
  on hr_private.payment_details(org_id,profile_id,recorded_at desc);

revoke all on hr_private.identifiers from public,anon,authenticated;
revoke all on hr_private.employment_terms from public,anon,authenticated;
revoke all on hr_private.compensation_history from public,anon,authenticated;
revoke all on hr_private.payment_details from public,anon,authenticated;

grant select,insert,update on hr_private.identifiers to service_role;
grant select,insert,update on hr_private.employment_terms to service_role;
grant select,insert,update on hr_private.compensation_history to service_role;
grant select,insert,update on hr_private.payment_details to service_role;

-- Protected files remain in the private Storage bucket. Authenticated users may
-- touch only their organisation's path and only when explicitly granted protected-HR access.
drop policy if exists ceac_hr_private_select on storage.objects;
drop policy if exists ceac_hr_private_insert on storage.objects;
drop policy if exists ceac_hr_private_delete on storage.objects;

create policy ceac_hr_private_select
on storage.objects
for select to authenticated
using (
  bucket_id='ceac-hr-private'
  and public.app_has_capability('hr_private.access',null)
  and (storage.foldername(name))[1]=public.app_org_id()::text
);

create policy ceac_hr_private_insert
on storage.objects
for insert to authenticated
with check (
  bucket_id='ceac-hr-private'
  and public.app_has_capability('hr_private.access',null)
  and (storage.foldername(name))[1]=public.app_org_id()::text
);

create policy ceac_hr_private_delete
on storage.objects
for delete to authenticated
using (
  bucket_id='ceac-hr-private'
  and public.app_has_capability('hr_private.access',null)
  and (storage.foldername(name))[1]=public.app_org_id()::text
);

create or replace function public.hr_protected_summary(p_profile_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=public,hr_private
as $$
declare
  v_org uuid:=public.app_org_id();
  v_actor uuid:=auth.uid();
  v_result jsonb;
begin
  if v_actor is null or not public.app_has_capability('hr_private.access',null) then
    raise exception 'You do not have authority to access protected HR records.' using errcode='42501';
  end if;
  if not exists(select 1 from public.profiles where id=p_profile_id and org_id=v_org) then
    raise exception 'That employee does not belong to your organisation.' using errcode='42501';
  end if;

  v_result:=jsonb_build_object(
    'identifiers',coalesce((
      select jsonb_agg(to_jsonb(x) order by x.recorded_at desc)
      from (
        select id,identifier_type,identifier_value,issued_on,expires_on,status,replaces_id,recorded_at
        from hr_private.identifiers
        where org_id=v_org and profile_id=p_profile_id
      ) x
    ),'[]'::jsonb),
    'employment_terms',coalesce((
      select jsonb_agg(to_jsonb(x) order by x.starts_on desc,x.recorded_at desc)
      from (
        select id,term_type,summary,starts_on,ends_on,status,replaces_id,recorded_at
        from hr_private.employment_terms
        where org_id=v_org and profile_id=p_profile_id
      ) x
    ),'[]'::jsonb),
    'compensation',coalesce((
      select jsonb_agg(to_jsonb(x) order by x.effective_on desc,x.recorded_at desc)
      from (
        select id,amount_minor,currency,basis_label,effective_on,ends_on,note,status,replaces_id,recorded_at
        from hr_private.compensation_history
        where org_id=v_org and profile_id=p_profile_id
      ) x
    ),'[]'::jsonb),
    'payment_details',coalesce((
      select jsonb_agg(to_jsonb(x) order by x.recorded_at desc)
      from (
        select id,payment_type,provider_name,account_name,account_reference,branch_reference,status,replaces_id,recorded_at
        from hr_private.payment_details
        where org_id=v_org and profile_id=p_profile_id
      ) x
    ),'[]'::jsonb),
    'documents',coalesce((
      select jsonb_agg(to_jsonb(x) order by x.created_at desc)
      from (
        select id,document_type,title,storage_bucket,storage_path,issued_on,expires_on,status,replaces_document_id,created_at
        from hr_private.documents
        where org_id=v_org and profile_id=p_profile_id
      ) x
    ),'[]'::jsonb)
  );

  insert into hr_private.audit_events(
    org_id,actor_id,action,resource_type,subject_profile_id,detail
  ) values (
    v_org,v_actor,'protected_hr_viewed','profile',p_profile_id,
    jsonb_build_object('surface','protected_hr')
  );

  return v_result;
end;
$$;

revoke all on function public.hr_protected_summary(uuid) from public,anon;
grant execute on function public.hr_protected_summary(uuid) to authenticated,service_role;

create or replace function public.hr_protected_record(
  p_profile_id uuid,
  p_record_type text,
  p_payload jsonb,
  p_replaces_id uuid default null,
  p_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path=public,hr_private
as $$
declare
  v_org uuid:=public.app_org_id();
  v_actor uuid:=auth.uid();
  v_id uuid;
  v_reason text:=nullif(btrim(coalesce(p_reason,'')),'');
  v_type text:=lower(btrim(coalesce(p_record_type,'')));
  v_currency text;
  v_amount bigint;
begin
  if v_actor is null or not public.app_has_capability('hr_private.access',null) then
    raise exception 'You do not have authority to change protected HR records.' using errcode='42501';
  end if;
  if not exists(select 1 from public.profiles where id=p_profile_id and org_id=v_org) then
    raise exception 'That employee does not belong to your organisation.' using errcode='42501';
  end if;
  if v_reason is null or length(v_reason)<3 then
    raise exception 'A reason is required for protected HR changes.';
  end if;
  if jsonb_typeof(coalesce(p_payload,'{}'::jsonb))<>'object' then
    raise exception 'Protected HR record details must be an object.';
  end if;

  if v_type='identifier' then
    if nullif(btrim(coalesce(p_payload->>'identifier_type','')),'') is null
       or nullif(btrim(coalesce(p_payload->>'identifier_value','')),'') is null then
      raise exception 'Identifier type and value are required.';
    end if;
    if p_replaces_id is not null then
      update hr_private.identifiers
      set status='replaced'
      where id=p_replaces_id and org_id=v_org and profile_id=p_profile_id and status='active';
      if not found then raise exception 'The identifier being replaced was not found.' using errcode='42501'; end if;
    end if;
    insert into hr_private.identifiers(
      org_id,profile_id,identifier_type,identifier_value,issued_on,expires_on,replaces_id,recorded_by
    ) values (
      v_org,p_profile_id,btrim(p_payload->>'identifier_type'),btrim(p_payload->>'identifier_value'),
      nullif(p_payload->>'issued_on','')::date,nullif(p_payload->>'expires_on','')::date,p_replaces_id,v_actor
    ) returning id into v_id;

  elsif v_type='employment_term' then
    if nullif(btrim(coalesce(p_payload->>'term_type','')),'') is null
       or nullif(btrim(coalesce(p_payload->>'summary','')),'') is null
       or nullif(p_payload->>'starts_on','') is null then
      raise exception 'Employment term, summary and start date are required.';
    end if;
    if p_replaces_id is not null then
      update hr_private.employment_terms set status='replaced'
      where id=p_replaces_id and org_id=v_org and profile_id=p_profile_id and status='active';
      if not found then raise exception 'The employment term being replaced was not found.' using errcode='42501'; end if;
    end if;
    insert into hr_private.employment_terms(
      org_id,profile_id,term_type,summary,starts_on,ends_on,replaces_id,recorded_by
    ) values (
      v_org,p_profile_id,btrim(p_payload->>'term_type'),btrim(p_payload->>'summary'),
      (p_payload->>'starts_on')::date,nullif(p_payload->>'ends_on','')::date,p_replaces_id,v_actor
    ) returning id into v_id;

  elsif v_type='compensation' then
    v_currency:=upper(btrim(coalesce(p_payload->>'currency','')));
    begin
      v_amount:=(p_payload->>'amount_minor')::bigint;
    exception when others then
      raise exception 'Compensation amount must be recorded in the smallest currency unit.';
    end;
    if v_amount<0 or v_currency!~'^[A-Z]{3}$'
       or nullif(btrim(coalesce(p_payload->>'basis_label','')),'') is null
       or nullif(p_payload->>'effective_on','') is null then
      raise exception 'Compensation amount, currency, basis and effective date are required.';
    end if;
    if p_replaces_id is not null then
      update hr_private.compensation_history set status='replaced'
      where id=p_replaces_id and org_id=v_org and profile_id=p_profile_id and status='active';
      if not found then raise exception 'The compensation record being replaced was not found.' using errcode='42501'; end if;
    end if;
    insert into hr_private.compensation_history(
      org_id,profile_id,amount_minor,currency,basis_label,effective_on,ends_on,note,replaces_id,recorded_by
    ) values (
      v_org,p_profile_id,v_amount,v_currency,btrim(p_payload->>'basis_label'),
      (p_payload->>'effective_on')::date,nullif(p_payload->>'ends_on','')::date,
      nullif(btrim(coalesce(p_payload->>'note','')),''),p_replaces_id,v_actor
    ) returning id into v_id;

  elsif v_type='payment_detail' then
    if nullif(btrim(coalesce(p_payload->>'payment_type','')),'') is null
       or nullif(btrim(coalesce(p_payload->>'provider_name','')),'') is null
       or nullif(btrim(coalesce(p_payload->>'account_name','')),'') is null
       or nullif(btrim(coalesce(p_payload->>'account_reference','')),'') is null then
      raise exception 'Payment type, provider, account name and account reference are required.';
    end if;
    if p_replaces_id is not null then
      update hr_private.payment_details set status='replaced'
      where id=p_replaces_id and org_id=v_org and profile_id=p_profile_id and status='active';
      if not found then raise exception 'The payment detail being replaced was not found.' using errcode='42501'; end if;
    end if;
    insert into hr_private.payment_details(
      org_id,profile_id,payment_type,provider_name,account_name,account_reference,branch_reference,replaces_id,recorded_by
    ) values (
      v_org,p_profile_id,btrim(p_payload->>'payment_type'),btrim(p_payload->>'provider_name'),
      btrim(p_payload->>'account_name'),btrim(p_payload->>'account_reference'),
      nullif(btrim(coalesce(p_payload->>'branch_reference','')),''),p_replaces_id,v_actor
    ) returning id into v_id;

  elsif v_type='document' then
    if nullif(btrim(coalesce(p_payload->>'document_type','')),'') is null
       or nullif(btrim(coalesce(p_payload->>'title','')),'') is null
       or nullif(btrim(coalesce(p_payload->>'storage_path','')),'') is null then
      raise exception 'Document type, title and protected storage path are required.';
    end if;
    if split_part(p_payload->>'storage_path','/',1)<>v_org::text then
      raise exception 'Protected document path must belong to your organisation.' using errcode='42501';
    end if;
    if p_replaces_id is not null then
      update hr_private.documents set status='replaced',archived_at=now()
      where id=p_replaces_id and org_id=v_org and profile_id=p_profile_id and status='active';
      if not found then raise exception 'The document being replaced was not found.' using errcode='42501'; end if;
    end if;
    insert into hr_private.documents(
      org_id,profile_id,document_type,title,storage_bucket,storage_path,issued_on,expires_on,status,
      replaces_document_id,created_by,metadata
    ) values (
      v_org,p_profile_id,btrim(p_payload->>'document_type'),btrim(p_payload->>'title'),
      'ceac-hr-private',btrim(p_payload->>'storage_path'),nullif(p_payload->>'issued_on','')::date,
      nullif(p_payload->>'expires_on','')::date,'active',p_replaces_id,v_actor,'{}'::jsonb
    ) returning id into v_id;
  else
    raise exception 'Choose a supported protected HR record type.';
  end if;

  insert into hr_private.audit_events(
    org_id,actor_id,action,resource_type,resource_id,subject_profile_id,reason,detail
  ) values (
    v_org,v_actor,'protected_hr_recorded',v_type,v_id,p_profile_id,v_reason,
    jsonb_build_object('replaces_id',p_replaces_id)
  );

  return v_id;
end;
$$;

revoke all on function public.hr_protected_record(uuid,text,jsonb,uuid,text) from public,anon;
grant execute on function public.hr_protected_record(uuid,text,jsonb,uuid,text) to authenticated,service_role;
