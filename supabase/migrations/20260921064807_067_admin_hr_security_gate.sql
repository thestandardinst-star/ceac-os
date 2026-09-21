-- 067 — Admin/HR security gate foundation.
--
-- This migration deliberately does not add protected HR fields or files.
-- It hardens the privileged RPC surface before Administration & HR expands.

create or replace function public.app_threshold(
  p_org_id uuid,
  p_name text,
  p_default numeric
)
returns numeric
language plpgsql
stable
security definer
set search_path=public
as $$
declare
  v_actor uuid:=auth.uid();
  v_actor_org uuid;
  v_value numeric;
begin
  -- Scheduled/service contexts have no end-user auth.uid() and are allowed to
  -- evaluate thresholds for the organisation being processed.
  -- A signed-in user must never use this definer RPC to read another
  -- organisation's configuration.
  if v_actor is not null then
    v_actor_org:=public.app_org_id();
    if v_actor_org is null or v_actor_org<>p_org_id then
      raise exception 'You cannot read another organisation''s threshold configuration.'
        using errcode='42501';
    end if;
  end if;

  select t.value into v_value
  from public.thresholds t
  where t.org_id=p_org_id
    and t.name=p_name;

  return coalesce(v_value,p_default);
end;
$$;

revoke all on function public.app_threshold(uuid,text,numeric) from public,anon;
grant execute on function public.app_threshold(uuid,text,numeric) to authenticated,service_role;

-- Future public-schema functions must be explicitly granted. This does not
-- change the privileges of existing RPCs; it prevents accidental exposure of
-- functions added after this migration.
alter default privileges for role postgres in schema public
  revoke execute on functions from public;
alter default privileges for role postgres in schema public
  revoke execute on functions from anon;
alter default privileges for role postgres in schema public
  revoke execute on functions from authenticated;
