create or replace function public.guard_profile_self_update()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.uid() is null or public.app_is_admin() then
    return new;
  end if;

  if old.id = auth.uid() then
    if new.id is distinct from old.id
       or new.org_id is distinct from old.org_id
       or new.full_name is distinct from old.full_name
       or new.email is distinct from old.email
       or new.job_title is distinct from old.job_title
       or new.started_on is distinct from old.started_on
       or new.joined_at is distinct from old.joined_at
       or new.contract_type is distinct from old.contract_type
       or new.is_admin is distinct from old.is_admin
       or new.is_exec is distinct from old.is_exec
       or new.active is distinct from old.active
       or new.created_at is distinct from old.created_at then
      raise exception 'Only Administration can change official employment or access details.'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_guard_self_update on public.profiles;
create trigger profiles_guard_self_update
before update on public.profiles
for each row execute function public.guard_profile_self_update();
