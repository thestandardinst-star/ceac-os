-- 091 — Stage 11 Compliance & Policy Management.
-- Human policy/evidence/exception workflow. Stage 1F system policy rules remain separate.

insert into public.capability_definitions(capability,label,description,sensitive)
values (
  'compliance.manage',
  'Manage compliance',
  'Publish CEAC compliance policies, review evidence and decide approved exceptions.',
  true
)
on conflict(capability) do nothing;

insert into public.capability_grants(
  org_id,profile_id,capability,scope_unit_id,granted_by,grant_reason
)
select p.org_id,p.id,'compliance.manage',null,null,
       'Stage 11 baseline from existing active Administration compliance authority.'
from public.profiles p
where p.is_admin and p.active
on conflict do nothing;

create table public.compliance_policy_versions(
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete restrict,
  policy_key uuid not null,
  version integer not null check(version>0),
  title text not null check(length(btrim(title)) between 3 and 180),
  category text not null check(length(btrim(category)) between 2 and 100),
  summary text,
  body_text text not null check(length(btrim(body_text))>=3),
  state text not null default 'active' check(state in ('active','retired')),
  effective_on date not null,
  expires_on date,
  source_reference text,
  supersedes_id uuid references public.compliance_policy_versions(id) on delete restrict,
  reason text not null check(length(btrim(reason)) between 3 and 1000),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  check(expires_on is null or expires_on>=effective_on),
  unique(policy_key,version)
);

create unique index compliance_policy_supersedes_uidx
  on public.compliance_policy_versions(supersedes_id)
  where supersedes_id is not null;
create index compliance_policy_org_idx
  on public.compliance_policy_versions(org_id,policy_key,version desc);

create table public.compliance_policy_applicability(
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete restrict,
  policy_version_id uuid not null references public.compliance_policy_versions(id) on delete restrict,
  scope_kind text not null check(scope_kind in ('organisation','unit','person','employment_type')),
  unit_id uuid references public.units(id) on delete restrict,
  profile_id uuid references public.profiles(id) on delete restrict,
  employment_type text,
  created_at timestamptz not null default now(),
  check(
    (scope_kind='organisation' and unit_id is null and profile_id is null and employment_type is null)
    or (scope_kind='unit' and unit_id is not null and profile_id is null and employment_type is null)
    or (scope_kind='person' and unit_id is null and profile_id is not null and employment_type is null)
    or (scope_kind='employment_type' and unit_id is null and profile_id is null and length(btrim(coalesce(employment_type,'')))>=2)
  )
);

create unique index compliance_policy_applicability_uidx
  on public.compliance_policy_applicability(
    policy_version_id,scope_kind,
    coalesce(unit_id,'00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(profile_id,'00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(employment_type,'')
  );

create table public.compliance_requirements(
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete restrict,
  policy_version_id uuid not null references public.compliance_policy_versions(id) on delete restrict,
  requirement_code text not null check(length(btrim(requirement_code)) between 2 and 80),
  title text not null check(length(btrim(title)) between 3 and 180),
  description text,
  acknowledgement_required boolean not null default false,
  evidence_required boolean not null default false,
  evidence_kind text,
  evidence_valid_days integer check(evidence_valid_days is null or evidence_valid_days>0),
  created_at timestamptz not null default now(),
  unique(policy_version_id,requirement_code),
  check(not evidence_required or length(btrim(coalesce(evidence_kind,'')))>=2)
);

create table public.compliance_acknowledgements(
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete restrict,
  policy_version_id uuid not null references public.compliance_policy_versions(id) on delete restrict,
  profile_id uuid not null references public.profiles(id) on delete restrict,
  statement text not null default 'I acknowledge this policy version.',
  acknowledged_at timestamptz not null default now(),
  unique(policy_version_id,profile_id)
);

create index compliance_ack_profile_idx
  on public.compliance_acknowledgements(org_id,profile_id,acknowledged_at desc);

create table public.compliance_evidence_versions(
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete restrict,
  evidence_key uuid not null,
  version integer not null check(version>0),
  profile_id uuid not null references public.profiles(id) on delete restrict,
  requirement_id uuid not null references public.compliance_requirements(id) on delete restrict,
  state text not null check(state in ('submitted','verified','rejected')),
  evidence_reference text not null check(length(btrim(evidence_reference)) between 2 and 1000),
  note text,
  issued_on date,
  expires_on date,
  supersedes_id uuid references public.compliance_evidence_versions(id) on delete restrict,
  reviewer_id uuid references public.profiles(id) on delete restrict,
  reviewer_note text,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  check(expires_on is null or issued_on is null or expires_on>=issued_on),
  check(
    (state='submitted' and reviewer_id is null)
    or (state in ('verified','rejected') and reviewer_id is not null)
  ),
  unique(evidence_key,version)
);

create unique index compliance_evidence_supersedes_uidx
  on public.compliance_evidence_versions(supersedes_id)
  where supersedes_id is not null;
create index compliance_evidence_profile_idx
  on public.compliance_evidence_versions(org_id,profile_id,created_at desc);
create index compliance_evidence_requirement_idx
  on public.compliance_evidence_versions(requirement_id,created_at desc);

create table public.compliance_exception_versions(
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete restrict,
  exception_key uuid not null,
  version integer not null check(version>0),
  profile_id uuid not null references public.profiles(id) on delete restrict,
  requirement_id uuid not null references public.compliance_requirements(id) on delete restrict,
  state text not null check(state in ('requested','approved','declined','resolved')),
  requested_until date,
  approved_until date,
  reason text not null check(length(btrim(reason)) between 3 and 1000),
  note text,
  supersedes_id uuid references public.compliance_exception_versions(id) on delete restrict,
  actor_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  check(approved_until is null or requested_until is null or approved_until>=current_date - interval '100 years'),
  unique(exception_key,version)
);

create unique index compliance_exception_supersedes_uidx
  on public.compliance_exception_versions(supersedes_id)
  where supersedes_id is not null;
create index compliance_exception_profile_idx
  on public.compliance_exception_versions(org_id,profile_id,created_at desc);
create index compliance_exception_requirement_idx
  on public.compliance_exception_versions(requirement_id,created_at desc);

alter table public.compliance_policy_versions enable row level security;
alter table public.compliance_policy_applicability enable row level security;
alter table public.compliance_requirements enable row level security;
alter table public.compliance_acknowledgements enable row level security;
alter table public.compliance_evidence_versions enable row level security;
alter table public.compliance_exception_versions enable row level security;

revoke all on public.compliance_policy_versions from anon;
revoke all on public.compliance_policy_applicability from anon;
revoke all on public.compliance_requirements from anon;
revoke all on public.compliance_acknowledgements from anon;
revoke all on public.compliance_evidence_versions from anon;
revoke all on public.compliance_exception_versions from anon;

revoke insert,update,delete on public.compliance_policy_versions from authenticated;
revoke insert,update,delete on public.compliance_policy_applicability from authenticated;
revoke insert,update,delete on public.compliance_requirements from authenticated;
revoke insert,update,delete on public.compliance_acknowledgements from authenticated;
revoke insert,update,delete on public.compliance_evidence_versions from authenticated;
revoke insert,update,delete on public.compliance_exception_versions from authenticated;

grant select on public.compliance_policy_versions to authenticated;
grant select on public.compliance_policy_applicability to authenticated;
grant select on public.compliance_requirements to authenticated;
grant select on public.compliance_acknowledgements to authenticated;
grant select on public.compliance_evidence_versions to authenticated;
grant select on public.compliance_exception_versions to authenticated;

-- Policy visibility is determined by the immutable applicability rows on that version.
create policy compliance_policy_versions_read
on public.compliance_policy_versions
for select to authenticated
using(
  org_id=public.app_org_id()
  and (
    public.app_has_capability('compliance.manage',null)
    or exists(
      select 1
      from public.compliance_policy_applicability a
      where a.policy_version_id=compliance_policy_versions.id
        and a.org_id=compliance_policy_versions.org_id
        and (
          a.scope_kind='organisation'
          or (a.scope_kind='person' and a.profile_id=auth.uid())
          or (
            a.scope_kind='unit'
            and (
              a.unit_id in (
                select er.unit_id from public.employment_records er
                where er.profile_id=auth.uid() and er.org_id=public.app_org_id()
              )
              or a.unit_id in (select public.app_managed_units())
            )
          )
          or (
            a.scope_kind='employment_type'
            and exists(
              select 1 from public.employment_records er
              where er.profile_id=auth.uid()
                and er.org_id=public.app_org_id()
                and er.employment_type=a.employment_type
            )
          )
          or (
            a.scope_kind='person'
            and exists(
              select 1 from public.employment_records er
              where er.profile_id=a.profile_id
                and er.org_id=public.app_org_id()
                and er.unit_id in (select public.app_managed_units())
            )
          )
        )
    )
  )
);

create policy compliance_applicability_read
on public.compliance_policy_applicability
for select to authenticated
using(
  org_id=public.app_org_id()
  and exists(
    select 1 from public.compliance_policy_versions p
    where p.id=compliance_policy_applicability.policy_version_id
  )
);

create policy compliance_requirements_read
on public.compliance_requirements
for select to authenticated
using(
  org_id=public.app_org_id()
  and exists(
    select 1 from public.compliance_policy_versions p
    where p.id=compliance_requirements.policy_version_id
  )
);

create policy compliance_acknowledgements_read
on public.compliance_acknowledgements
for select to authenticated
using(
  org_id=public.app_org_id()
  and (
    profile_id=auth.uid()
    or public.app_has_capability('compliance.manage',null)
    or exists(
      select 1 from public.employment_records er
      where er.profile_id=compliance_acknowledgements.profile_id
        and er.org_id=public.app_org_id()
        and er.unit_id in (select public.app_managed_units())
    )
  )
);

create policy compliance_evidence_read
on public.compliance_evidence_versions
for select to authenticated
using(
  org_id=public.app_org_id()
  and (
    profile_id=auth.uid()
    or public.app_has_capability('compliance.manage',null)
    or exists(
      select 1 from public.employment_records er
      where er.profile_id=compliance_evidence_versions.profile_id
        and er.org_id=public.app_org_id()
        and er.unit_id in (select public.app_managed_units())
    )
  )
);

create policy compliance_exception_read
on public.compliance_exception_versions
for select to authenticated
using(
  org_id=public.app_org_id()
  and (
    profile_id=auth.uid()
    or public.app_has_capability('compliance.manage',null)
    or exists(
      select 1 from public.employment_records er
      where er.profile_id=compliance_exception_versions.profile_id
        and er.org_id=public.app_org_id()
        and er.unit_id in (select public.app_managed_units())
    )
  )
);

create or replace function public.compliance_record_policy(
  p_policy_key uuid,
  p_title text,
  p_category text,
  p_summary text,
  p_body_text text,
  p_state text,
  p_effective_on date,
  p_expires_on date,
  p_source_reference text,
  p_reason text,
  p_applicability jsonb,
  p_requirements jsonb,
  p_supersedes_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  v_org uuid:=public.app_org_id();
  v_actor uuid:=auth.uid();
  v_prior public.compliance_policy_versions;
  v_key uuid;
  v_version integer;
  v_id uuid;
  v_item jsonb;
  v_kind text;
  v_unit uuid;
  v_profile uuid;
  v_employment_type text;
begin
  if v_actor is null or not public.app_has_capability('compliance.manage',null) then
    raise exception 'You do not have authority to manage compliance policies.' using errcode='42501';
  end if;
  if length(btrim(coalesce(p_title,'')))<3
     or length(btrim(coalesce(p_category,'')))<2
     or length(btrim(coalesce(p_body_text,'')))<3
     or length(btrim(coalesce(p_reason,'')))<3 then
    raise exception 'Title, category, policy text and reason are required.';
  end if;
  if p_state not in ('active','retired') then
    raise exception 'Choose a valid policy state.';
  end if;
  if p_effective_on is null or (p_expires_on is not null and p_expires_on<p_effective_on) then
    raise exception 'Choose a valid policy date range.';
  end if;
  if jsonb_typeof(coalesce(p_applicability,'[]'::jsonb))<>'array'
     or jsonb_typeof(coalesce(p_requirements,'[]'::jsonb))<>'array' then
    raise exception 'Applicability and requirements must be arrays.';
  end if;
  if p_state='active' and jsonb_array_length(coalesce(p_applicability,'[]'::jsonb))=0 then
    raise exception 'An active policy needs at least one applicability rule.';
  end if;

  if p_supersedes_id is not null then
    select * into v_prior
    from public.compliance_policy_versions
    where id=p_supersedes_id and org_id=v_org;
    if v_prior.id is null then raise exception 'Policy version being superseded was not found.'; end if;
    if exists(select 1 from public.compliance_policy_versions where supersedes_id=v_prior.id) then
      raise exception 'That policy version has already been superseded.';
    end if;
    v_key:=v_prior.policy_key;
    v_version:=v_prior.version+1;
  else
    v_key:=coalesce(p_policy_key,gen_random_uuid());
    v_version:=1;
    if exists(select 1 from public.compliance_policy_versions where org_id=v_org and policy_key=v_key) then
      raise exception 'That policy key already exists; revise the current version instead.';
    end if;
  end if;

  insert into public.compliance_policy_versions(
    org_id,policy_key,version,title,category,summary,body_text,state,
    effective_on,expires_on,source_reference,supersedes_id,reason,created_by
  ) values (
    v_org,v_key,v_version,btrim(p_title),btrim(p_category),
    nullif(btrim(coalesce(p_summary,'')),''),
    btrim(p_body_text),p_state,p_effective_on,p_expires_on,
    nullif(btrim(coalesce(p_source_reference,'')),''),
    p_supersedes_id,btrim(p_reason),v_actor
  )
  returning id into v_id;

  for v_item in select value from jsonb_array_elements(coalesce(p_applicability,'[]'::jsonb))
  loop
    v_kind:=v_item->>'scope_kind';
    v_unit:=nullif(v_item->>'unit_id','')::uuid;
    v_profile:=nullif(v_item->>'profile_id','')::uuid;
    v_employment_type:=nullif(btrim(coalesce(v_item->>'employment_type','')),'');

    if v_kind not in ('organisation','unit','person','employment_type') then
      raise exception 'Choose a supported compliance applicability scope.';
    end if;
    if v_kind='unit' and not exists(
      select 1 from public.units u where u.id=v_unit and u.org_id=v_org and u.active
    ) then
      raise exception 'Applicability unit is not active in this organisation.' using errcode='42501';
    end if;
    if v_kind='person' and not exists(
      select 1 from public.profiles p where p.id=v_profile and p.org_id=v_org and p.active
    ) then
      raise exception 'Applicability person is not active in this organisation.' using errcode='42501';
    end if;
    if v_kind='employment_type' and v_employment_type is null then
      raise exception 'Employment type applicability requires a value.';
    end if;

    insert into public.compliance_policy_applicability(
      org_id,policy_version_id,scope_kind,unit_id,profile_id,employment_type
    ) values (
      v_org,v_id,v_kind,
      case when v_kind='unit' then v_unit else null end,
      case when v_kind='person' then v_profile else null end,
      case when v_kind='employment_type' then v_employment_type else null end
    );
  end loop;

  for v_item in select value from jsonb_array_elements(coalesce(p_requirements,'[]'::jsonb))
  loop
    if length(btrim(coalesce(v_item->>'requirement_code','')))<2
       or length(btrim(coalesce(v_item->>'title','')))<3 then
      raise exception 'Each compliance requirement needs a code and title.';
    end if;

    insert into public.compliance_requirements(
      org_id,policy_version_id,requirement_code,title,description,
      acknowledgement_required,evidence_required,evidence_kind,evidence_valid_days
    ) values (
      v_org,v_id,btrim(v_item->>'requirement_code'),btrim(v_item->>'title'),
      nullif(btrim(coalesce(v_item->>'description','')),''),
      coalesce((v_item->>'acknowledgement_required')::boolean,false),
      coalesce((v_item->>'evidence_required')::boolean,false),
      nullif(btrim(coalesce(v_item->>'evidence_kind','')),''),
      nullif(v_item->>'evidence_valid_days','')::integer
    );
  end loop;

  perform public.platform_emit_event(
    v_org,
    case when p_state='retired' then 'compliance.policy_retired' else 'compliance.policy_published' end,
    v_actor,null,'compliance_policy',v_key,
    jsonb_build_object('policy_version_id',v_id,'version',v_version,'title',btrim(p_title),'state',p_state),
    'compliance-policy:'||v_id::text,null,null,now()
  );

  return v_id;
end;
$$;

revoke all on function public.compliance_record_policy(
  uuid,text,text,text,text,text,date,date,text,text,jsonb,jsonb,uuid
) from public,anon;
grant execute on function public.compliance_record_policy(
  uuid,text,text,text,text,text,date,date,text,text,jsonb,jsonb,uuid
) to authenticated,service_role;

create or replace function public.compliance_acknowledge_policy(
  p_policy_version_id uuid,
  p_statement text default 'I acknowledge this policy version.'
)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  v_org uuid:=public.app_org_id();
  v_actor uuid:=auth.uid();
  v_policy public.compliance_policy_versions;
  v_id uuid;
  v_applies boolean:=false;
begin
  if v_actor is null then raise exception 'Sign in to acknowledge a policy.' using errcode='42501'; end if;

  select * into v_policy
  from public.compliance_policy_versions
  where id=p_policy_version_id and org_id=v_org and state='active';

  if v_policy.id is null
     or v_policy.effective_on>current_date
     or (v_policy.expires_on is not null and v_policy.expires_on<current_date) then
    raise exception 'This policy version is not currently active.';
  end if;

  select exists(
    select 1
    from public.compliance_policy_applicability a
    left join public.employment_records er
      on er.profile_id=v_actor and er.org_id=v_org
    where a.policy_version_id=v_policy.id
      and (
        a.scope_kind='organisation'
        or (a.scope_kind='person' and a.profile_id=v_actor)
        or (a.scope_kind='unit' and a.unit_id=er.unit_id)
        or (a.scope_kind='employment_type' and a.employment_type=er.employment_type)
      )
  ) into v_applies;

  if not v_applies then
    raise exception 'This policy version is not applicable to your current record.' using errcode='42501';
  end if;

  insert into public.compliance_acknowledgements(
    org_id,policy_version_id,profile_id,statement
  ) values (
    v_org,v_policy.id,v_actor,
    coalesce(nullif(btrim(coalesce(p_statement,'')),''),'I acknowledge this policy version.')
  )
  returning id into v_id;

  perform public.platform_emit_event(
    v_org,'compliance.policy_acknowledged',v_actor,v_actor,
    'compliance_policy',v_policy.policy_key,
    jsonb_build_object('policy_version_id',v_policy.id,'acknowledgement_id',v_id),
    'compliance-ack:'||v_id::text,null,null,now()
  );

  return v_id;
exception
  when unique_violation then
    raise exception 'You already acknowledged this policy version.';
end;
$$;

revoke all on function public.compliance_acknowledge_policy(uuid,text) from public,anon;
grant execute on function public.compliance_acknowledge_policy(uuid,text)
to authenticated,service_role;

create or replace function public.compliance_submit_evidence(
  p_requirement_id uuid,
  p_evidence_reference text,
  p_note text,
  p_issued_on date,
  p_expires_on date,
  p_supersedes_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  v_org uuid:=public.app_org_id();
  v_actor uuid:=auth.uid();
  v_req public.compliance_requirements;
  v_policy public.compliance_policy_versions;
  v_prior public.compliance_evidence_versions;
  v_key uuid;
  v_version integer;
  v_id uuid;
  v_applies boolean:=false;
begin
  if v_actor is null then raise exception 'Sign in to submit compliance evidence.' using errcode='42501'; end if;
  if length(btrim(coalesce(p_evidence_reference,'')))<2 then
    raise exception 'Evidence reference is required.';
  end if;
  if p_expires_on is not null and p_issued_on is not null and p_expires_on<p_issued_on then
    raise exception 'Evidence expiry cannot be before the issue date.';
  end if;

  select * into v_req
  from public.compliance_requirements
  where id=p_requirement_id and org_id=v_org and evidence_required;

  if v_req.id is null then
    raise exception 'This requirement does not accept evidence.';
  end if;

  select * into v_policy
  from public.compliance_policy_versions
  where id=v_req.policy_version_id and org_id=v_org and state='active';

  if v_policy.id is null
     or v_policy.effective_on>current_date
     or (v_policy.expires_on is not null and v_policy.expires_on<current_date) then
    raise exception 'The requirement is not on a current active policy.';
  end if;

  select exists(
    select 1
    from public.compliance_policy_applicability a
    left join public.employment_records er
      on er.profile_id=v_actor and er.org_id=v_org
    where a.policy_version_id=v_policy.id
      and (
        a.scope_kind='organisation'
        or (a.scope_kind='person' and a.profile_id=v_actor)
        or (a.scope_kind='unit' and a.unit_id=er.unit_id)
        or (a.scope_kind='employment_type' and a.employment_type=er.employment_type)
      )
  ) into v_applies;

  if not v_applies then
    raise exception 'This requirement is not applicable to your current record.' using errcode='42501';
  end if;

  if p_supersedes_id is not null then
    select * into v_prior
    from public.compliance_evidence_versions
    where id=p_supersedes_id and org_id=v_org
      and profile_id=v_actor and requirement_id=v_req.id;
    if v_prior.id is null then raise exception 'Evidence version being superseded was not found.'; end if;
    if exists(select 1 from public.compliance_evidence_versions where supersedes_id=v_prior.id) then
      raise exception 'That evidence version has already been superseded.';
    end if;
    v_key:=v_prior.evidence_key;
    v_version:=v_prior.version+1;
  else
    v_key:=gen_random_uuid();
    v_version:=1;
  end if;

  insert into public.compliance_evidence_versions(
    org_id,evidence_key,version,profile_id,requirement_id,state,
    evidence_reference,note,issued_on,expires_on,supersedes_id,created_by
  ) values (
    v_org,v_key,v_version,v_actor,v_req.id,'submitted',
    btrim(p_evidence_reference),nullif(btrim(coalesce(p_note,'')),''),
    p_issued_on,p_expires_on,p_supersedes_id,v_actor
  )
  returning id into v_id;

  perform public.platform_emit_event(
    v_org,'compliance.evidence_submitted',v_actor,v_actor,
    'compliance_evidence',v_key,
    jsonb_build_object('evidence_version_id',v_id,'requirement_id',v_req.id,'version',v_version),
    'compliance-evidence:'||v_id::text,null,null,now()
  );

  return v_id;
end;
$$;

revoke all on function public.compliance_submit_evidence(uuid,text,text,date,date,uuid) from public,anon;
grant execute on function public.compliance_submit_evidence(uuid,text,text,date,date,uuid)
to authenticated,service_role;

create or replace function public.compliance_review_evidence(
  p_evidence_version_id uuid,
  p_action text,
  p_reviewer_note text
)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  v_org uuid:=public.app_org_id();
  v_actor uuid:=auth.uid();
  v_prior public.compliance_evidence_versions;
  v_id uuid;
begin
  if v_actor is null or not public.app_has_capability('compliance.manage',null) then
    raise exception 'You do not have authority to review compliance evidence.' using errcode='42501';
  end if;
  if p_action not in ('verified','rejected') then raise exception 'Choose verified or rejected.'; end if;
  if length(btrim(coalesce(p_reviewer_note,'')))<3 then raise exception 'A reviewer note is required.'; end if;

  select * into v_prior
  from public.compliance_evidence_versions
  where id=p_evidence_version_id and org_id=v_org and state='submitted';

  if v_prior.id is null then raise exception 'Submitted evidence version not found.'; end if;
  if exists(select 1 from public.compliance_evidence_versions where supersedes_id=v_prior.id) then
    raise exception 'That evidence version already has a later decision.';
  end if;

  insert into public.compliance_evidence_versions(
    org_id,evidence_key,version,profile_id,requirement_id,state,
    evidence_reference,note,issued_on,expires_on,supersedes_id,
    reviewer_id,reviewer_note,created_by
  ) values (
    v_org,v_prior.evidence_key,v_prior.version+1,v_prior.profile_id,v_prior.requirement_id,p_action,
    v_prior.evidence_reference,v_prior.note,v_prior.issued_on,v_prior.expires_on,v_prior.id,
    v_actor,btrim(p_reviewer_note),v_actor
  )
  returning id into v_id;

  perform public.platform_emit_event(
    v_org,
    case when p_action='verified' then 'compliance.evidence_verified' else 'compliance.evidence_rejected' end,
    v_actor,v_prior.profile_id,'compliance_evidence',v_prior.evidence_key,
    jsonb_build_object('evidence_version_id',v_id,'requirement_id',v_prior.requirement_id,'version',v_prior.version+1),
    'compliance-evidence-review:'||v_id::text,null,null,now()
  );

  return v_id;
end;
$$;

revoke all on function public.compliance_review_evidence(uuid,text,text) from public,anon;
grant execute on function public.compliance_review_evidence(uuid,text,text)
to authenticated,service_role;

create or replace function public.compliance_request_exception(
  p_requirement_id uuid,
  p_reason text,
  p_requested_until date default null
)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  v_org uuid:=public.app_org_id();
  v_actor uuid:=auth.uid();
  v_req public.compliance_requirements;
  v_policy public.compliance_policy_versions;
  v_key uuid:=gen_random_uuid();
  v_id uuid;
  v_applies boolean:=false;
begin
  if v_actor is null then raise exception 'Sign in to request an exception.' using errcode='42501'; end if;
  if length(btrim(coalesce(p_reason,'')))<3 then raise exception 'A reason is required.'; end if;

  select * into v_req
  from public.compliance_requirements
  where id=p_requirement_id and org_id=v_org;
  if v_req.id is null then raise exception 'Compliance requirement not found.'; end if;

  select * into v_policy
  from public.compliance_policy_versions
  where id=v_req.policy_version_id and org_id=v_org and state='active';
  if v_policy.id is null then raise exception 'The requirement is not on an active policy.'; end if;

  select exists(
    select 1
    from public.compliance_policy_applicability a
    left join public.employment_records er
      on er.profile_id=v_actor and er.org_id=v_org
    where a.policy_version_id=v_policy.id
      and (
        a.scope_kind='organisation'
        or (a.scope_kind='person' and a.profile_id=v_actor)
        or (a.scope_kind='unit' and a.unit_id=er.unit_id)
        or (a.scope_kind='employment_type' and a.employment_type=er.employment_type)
      )
  ) into v_applies;

  if not v_applies then
    raise exception 'This requirement is not applicable to your current record.' using errcode='42501';
  end if;

  insert into public.compliance_exception_versions(
    org_id,exception_key,version,profile_id,requirement_id,state,
    requested_until,reason,actor_id
  ) values (
    v_org,v_key,1,v_actor,v_req.id,'requested',
    p_requested_until,btrim(p_reason),v_actor
  )
  returning id into v_id;

  perform public.platform_emit_event(
    v_org,'compliance.exception_requested',v_actor,v_actor,
    'compliance_exception',v_key,
    jsonb_build_object('exception_version_id',v_id,'requirement_id',v_req.id,'requested_until',p_requested_until),
    'compliance-exception:'||v_id::text,null,null,now()
  );

  return v_id;
end;
$$;

revoke all on function public.compliance_request_exception(uuid,text,date) from public,anon;
grant execute on function public.compliance_request_exception(uuid,text,date)
to authenticated,service_role;

create or replace function public.compliance_exception_action(
  p_exception_version_id uuid,
  p_action text,
  p_note text,
  p_approved_until date default null
)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  v_org uuid:=public.app_org_id();
  v_actor uuid:=auth.uid();
  v_prior public.compliance_exception_versions;
  v_id uuid;
begin
  if v_actor is null or not public.app_has_capability('compliance.manage',null) then
    raise exception 'You do not have authority to decide compliance exceptions.' using errcode='42501';
  end if;
  if p_action not in ('approved','declined','resolved') then raise exception 'Choose a valid exception action.'; end if;
  if length(btrim(coalesce(p_note,'')))<3 then raise exception 'A decision note is required.'; end if;

  select * into v_prior
  from public.compliance_exception_versions
  where id=p_exception_version_id and org_id=v_org;
  if v_prior.id is null then raise exception 'Exception version not found.'; end if;
  if exists(select 1 from public.compliance_exception_versions where supersedes_id=v_prior.id) then
    raise exception 'That exception version already has a later state.';
  end if;

  if p_action in ('approved','declined') and v_prior.state<>'requested' then
    raise exception 'Only a requested exception can be approved or declined.';
  end if;
  if p_action='resolved' and v_prior.state<>'approved' then
    raise exception 'Only an approved exception can be resolved.';
  end if;

  insert into public.compliance_exception_versions(
    org_id,exception_key,version,profile_id,requirement_id,state,
    requested_until,approved_until,reason,note,supersedes_id,actor_id
  ) values (
    v_org,v_prior.exception_key,v_prior.version+1,v_prior.profile_id,v_prior.requirement_id,p_action,
    v_prior.requested_until,
    case when p_action='approved' then p_approved_until else v_prior.approved_until end,
    v_prior.reason,btrim(p_note),v_prior.id,v_actor
  )
  returning id into v_id;

  perform public.platform_emit_event(
    v_org,
    case p_action
      when 'approved' then 'compliance.exception_approved'
      when 'declined' then 'compliance.exception_declined'
      else 'compliance.exception_resolved'
    end,
    v_actor,v_prior.profile_id,'compliance_exception',v_prior.exception_key,
    jsonb_build_object('exception_version_id',v_id,'requirement_id',v_prior.requirement_id,'state',p_action,'approved_until',p_approved_until),
    'compliance-exception-action:'||v_id::text,null,null,now()
  );

  return v_id;
end;
$$;

revoke all on function public.compliance_exception_action(uuid,text,text,date) from public,anon;
grant execute on function public.compliance_exception_action(uuid,text,text,date)
to authenticated,service_role;

create trigger audit_compliance_policy_versions
after insert on public.compliance_policy_versions
for each row execute function public.platform_audit_capture('compliance_policy','id','');

create trigger audit_compliance_policy_applicability
after insert on public.compliance_policy_applicability
for each row execute function public.platform_audit_capture('compliance_applicability','id','profile_id');

create trigger audit_compliance_requirements
after insert on public.compliance_requirements
for each row execute function public.platform_audit_capture('compliance_requirement','id','');

create trigger audit_compliance_acknowledgements
after insert on public.compliance_acknowledgements
for each row execute function public.platform_audit_capture('compliance_acknowledgement','id','profile_id');

create trigger audit_compliance_evidence_versions
after insert on public.compliance_evidence_versions
for each row execute function public.platform_audit_capture('compliance_evidence','id','profile_id');

create trigger audit_compliance_exception_versions
after insert on public.compliance_exception_versions
for each row execute function public.platform_audit_capture('compliance_exception','id','profile_id');

insert into public.platform_event_definitions(
  event_type,label,description,source_domain,payload_version
) values
  ('compliance.policy_published','Compliance policy published','A compliance policy version became the recorded active version.','compliance',1),
  ('compliance.policy_retired','Compliance policy retired','A retirement version was recorded for a compliance policy.','compliance',1),
  ('compliance.policy_acknowledged','Compliance policy acknowledged','An employee acknowledged an applicable policy version.','compliance',1),
  ('compliance.evidence_submitted','Compliance evidence submitted','An employee submitted evidence for an applicable requirement.','compliance',1),
  ('compliance.evidence_verified','Compliance evidence verified','An authorised reviewer verified submitted evidence.','compliance',1),
  ('compliance.evidence_rejected','Compliance evidence rejected','An authorised reviewer rejected submitted evidence.','compliance',1),
  ('compliance.exception_requested','Compliance exception requested','An employee requested an exception for an applicable requirement.','compliance',1),
  ('compliance.exception_approved','Compliance exception approved','An authorised reviewer approved a compliance exception.','compliance',1),
  ('compliance.exception_declined','Compliance exception declined','An authorised reviewer declined a compliance exception.','compliance',1),
  ('compliance.exception_resolved','Compliance exception resolved','An approved compliance exception was resolved.','compliance',1)
on conflict(event_type) do nothing;
