-- When someone accepts an invitation, their profile is created for them.
-- Organisation comes from the invitation metadata so nobody types it.
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_org uuid;
begin
  v_org := nullif(new.raw_user_meta_data->>'org_id','')::uuid;
  if v_org is null then
    select id into v_org from organisations order by created_at limit 1;
  end if;

  insert into profiles (id, org_id, full_name, email, job_title)
  values (
    new.id,
    v_org,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
    new.email,
    new.raw_user_meta_data->>'job_title'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
