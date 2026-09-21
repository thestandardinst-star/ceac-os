-- Removes only CEAC OS presentation fixtures created by presentation_seed.sql.

delete from public.meeting_sessions
where title like 'Demo · %';

delete from public.announcements
where title like 'Demo · %';
