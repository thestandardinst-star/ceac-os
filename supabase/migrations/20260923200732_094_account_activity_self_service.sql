-- Reconciled from the applied production migration history.
-- Somewhere for a person to see their own account activity.
--
-- Prevention eventually fails; what limits the damage is someone noticing.
-- Right now nobody at CEAC can see where their account is signed in, so a
-- stolen password could be used for months unnoticed.
--
-- Own data only. The functions filter on auth.uid() and there is no
-- parameter to ask about anyone else, so this cannot become a way to watch
-- colleagues.

-- Devices currently signed in as you.
create or replace function my_sessions()
returns table (session_id uuid, signed_in_at timestamptz, last_seen timestamptz,
               device text, ip text, is_current boolean)
language sql stable security definer set search_path = public, auth as $$
  select s.id, s.created_at, coalesce(s.refreshed_at, s.updated_at, s.created_at),
         coalesce(s.user_agent, 'Unknown device'),
         coalesce(host(s.ip), 'unknown'),
         (s.id::text = current_setting('request.jwt.claims', true)::jsonb ->> 'session_id')
    from auth.sessions s
   where s.user_id = auth.uid()
   order by coalesce(s.refreshed_at, s.updated_at, s.created_at) desc;
$$;
revoke execute on function my_sessions() from anon, public;
grant execute on function my_sessions() to authenticated;

-- What has been done under your name, and what was done to your record.
create or replace function my_account_activity(p_limit int default 50)
returns table (at timestamptz, action text, resource_type text,
               by_me boolean, actor_name text)
language sql stable security definer set search_path = public as $$
  select e.created_at, e.action, e.resource_type,
         (e.actor_id = auth.uid()),
         coalesce(p.full_name, 'the system')
    from platform_audit_events e
    left join profiles p on p.id = e.actor_id
   where e.actor_id = auth.uid() or e.subject_profile_id = auth.uid()
   order by e.created_at desc
   limit greatest(1, least(coalesce(p_limit, 50), 200));
$$;
revoke execute on function my_account_activity(int) from anon, public;
grant execute on function my_account_activity(int) to authenticated;
