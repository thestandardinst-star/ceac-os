-- Legacy live-only artifact required to replay immutable migration 037.
-- This helper exists in the live project but was created outside the recovered
-- migration ledger before 037 hardened its execution privileges.
-- It is test-only and is not used by the CEAC application.

create or replace function public.test_as(p_email text)
returns void
language plpgsql
set search_path=public
as $$
declare
  v uuid := (select id from profiles where email = p_email);
begin
  perform set_config('request.jwt.claims', json_build_object('sub', v::text, 'role','authenticated')::text, true);
  perform set_config('role','authenticated', true);
end
$$;
