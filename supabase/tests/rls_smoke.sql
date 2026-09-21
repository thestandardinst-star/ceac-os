\set ON_ERROR_STOP on

begin;

set local role authenticated;
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000001',true);

do $$
begin
  if exists (
    select 1 from public.profiles
    where id='31000000-0000-4000-8000-000000000005'::uuid
  ) then
    raise exception 'RLS failure: Staff can see unrelated-unit profile.';
  end if;
end $$;

do $$
begin
  begin
    insert into public.activity_events(org_id,actor_id,verb,object_type,object_id)
    values(
      '10000000-0000-4000-8000-000000000010',
      '31000000-0000-4000-8000-000000000001',
      'forged','work_item',gen_random_uuid()
    );
    raise exception 'RLS failure: Staff inserted activity event.';
  exception when insufficient_privilege then null;
  end;
end $$;

do $$
begin
  begin
    insert into public.pending_invitations(org_id,email,full_name,unit_id,role,invited_by,expires_at)
    values(
      '10000000-0000-4000-8000-000000000010',
      'forged@example.invalid','Forged',
      '20000000-0000-4000-8000-000000000011','staff',
      '31000000-0000-4000-8000-000000000001',now()+interval '1 day'
    );
    raise exception 'RLS failure: Staff inserted invitation directly.';
  exception when insufficient_privilege then null;
  end;
end $$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000002',true);

do $$
begin
  begin
    perform public.create_pending_invitation(
      'escalation@example.invalid','Escalation Attempt',
      '20000000-0000-4000-8000-000000000011','manager'
    );
    raise exception 'Authority failure: Manager invitation created Manager.';
  exception when insufficient_privilege then null;
  end;
end $$;

do $$
begin
  begin
    perform public.assign_unit_head(
      '20000000-0000-4000-8000-000000000011',
      '31000000-0000-4000-8000-000000000001'
    );
    raise exception 'Authority failure: Manager assigned Unit Head.';
  exception when insufficient_privilege then null;
  end;
end $$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000004',true);

do $$
begin
  begin
    perform public.assign_unit_head(
      '20000000-0000-4000-8000-000000000011',
      '31000000-0000-4000-8000-000000000001'
    );
    raise exception 'Authority failure: Executive assigned Unit Head.';
  exception when insufficient_privilege then null;
  end;
end $$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','31000000-0000-4000-8000-000000000003',true);
select public.assign_unit_head(
  '20000000-0000-4000-8000-000000000011',
  '31000000-0000-4000-8000-000000000001'
);

do $$
begin
  if not exists (
    select 1 from public.unit_memberships
    where unit_id='20000000-0000-4000-8000-000000000011'::uuid
      and profile_id='31000000-0000-4000-8000-000000000001'::uuid
      and role='manager'
  ) then
    raise exception 'Authority failure: Admin assignment did not persist in transaction.';
  end if;
end $$;

rollback;

select 'RLS role smoke tests passed' as result;
