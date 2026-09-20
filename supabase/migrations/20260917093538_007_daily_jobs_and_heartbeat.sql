
CREATE EXTENSION IF NOT EXISTS pg_cron;

ALTER TABLE job_runs ADD COLUMN IF NOT EXISTS detail JSONB;
ALTER TABLE job_runs ADD COLUMN IF NOT EXISTS duration_ms INT;

CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  subject_type TEXT NOT NULL,
  subject_id UUID NOT NULL,
  for_profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  for_unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES profiles(id),
  UNIQUE(kind, subject_type, subject_id)
);

CREATE INDEX IF NOT EXISTS alerts_open_person_idx
  ON alerts(for_profile_id, acknowledged_at) WHERE acknowledged_at IS NULL;
CREATE INDEX IF NOT EXISTS alerts_open_unit_idx
  ON alerts(for_unit_id, acknowledged_at) WHERE acknowledged_at IS NULL;

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS alerts_select ON alerts;
CREATE POLICY alerts_select ON alerts FOR SELECT USING (
  org_id = app_org_id() AND (
    for_profile_id = auth.uid()
    OR app_is_admin() OR app_is_exec()
    OR (for_unit_id IS NOT NULL AND for_unit_id IN (SELECT app_managed_units()))
  )
);

DROP POLICY IF EXISTS alerts_ack ON alerts;
CREATE POLICY alerts_ack ON alerts FOR UPDATE USING (
  org_id = app_org_id() AND (
    for_profile_id = auth.uid()
    OR app_is_admin() OR app_is_exec()
    OR (for_unit_id IS NOT NULL AND for_unit_id IN (SELECT app_managed_units()))
  )
);

ALTER TABLE job_runs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS job_runs_select ON job_runs;
CREATE POLICY job_runs_select ON job_runs FOR SELECT USING (
  app_is_admin() OR app_is_exec()
);

CREATE OR REPLACE FUNCTION app_heartbeat() RETURNS void
  LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO job_runs(job_name, status, detail)
  VALUES ('heartbeat', 'ok', jsonb_build_object('at', NOW()));
END $$;

CREATE OR REPLACE FUNCTION app_check_gone_quiet() RETURNS INT
  LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE affected INT := 0;
BEGIN
  INSERT INTO alerts(org_id, kind, subject_type, subject_id, for_profile_id, for_unit_id, message)
  SELECT w.org_id, 'gone_quiet', 'work_item', w.id, w.assignee_id, w.unit_id,
    'Nothing has moved on ' || w.title || ' since ' || to_char(w.last_movement_at, 'DD Mon')
  FROM work_items w
  WHERE w.status NOT IN ('completed', 'cancelled', 'waiting_on')
    AND w.last_movement_at IS NOT NULL
    AND w.last_movement_at < NOW() - INTERVAL '3 days'
  ON CONFLICT (kind, subject_type, subject_id) DO UPDATE SET last_seen_at = NOW();
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END $$;

CREATE OR REPLACE FUNCTION app_check_overdue() RETURNS INT
  LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE a1 INT := 0; a2 INT := 0;
BEGIN
  INSERT INTO alerts(org_id, kind, subject_type, subject_id, for_profile_id, message)
  SELECT w.org_id, 'overdue_first', 'work_item', w.id, w.assignee_id,
    w.title || ' — due date passed on ' || to_char(w.due_at, 'DD Mon')
  FROM work_items w
  WHERE w.status NOT IN ('completed', 'cancelled', 'waiting_on')
    AND w.due_at IS NOT NULL
    AND w.due_at < NOW() - INTERVAL '1 day'
  ON CONFLICT (kind, subject_type, subject_id) DO NOTHING;
  GET DIAGNOSTICS a1 = ROW_COUNT;

  INSERT INTO alerts(org_id, kind, subject_type, subject_id, for_unit_id, message)
  SELECT w.org_id, 'overdue_second', 'work_item', w.id, w.unit_id,
    COALESCE((SELECT full_name FROM profiles WHERE id = w.assignee_id), 'Someone')
      || ': ' || w.title || ' — ' || EXTRACT(DAY FROM NOW() - w.due_at)::TEXT || ' days late'
  FROM work_items w
  WHERE w.status NOT IN ('completed', 'cancelled', 'waiting_on')
    AND w.due_at IS NOT NULL
    AND w.due_at < NOW() - INTERVAL '3 days'
  ON CONFLICT (kind, subject_type, subject_id) DO NOTHING;
  GET DIAGNOSTICS a2 = ROW_COUNT;

  RETURN a1 + a2;
END $$;

CREATE OR REPLACE FUNCTION app_check_blockers() RETURNS INT
  LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE affected INT := 0;
BEGIN
  INSERT INTO alerts(org_id, kind, subject_type, subject_id, for_unit_id, message)
  SELECT b.org_id, 'blocker_no_response', 'blocker', b.id, b.party_unit_id,
    'You have not answered a request from '
      || COALESCE((SELECT u.name FROM units u JOIN work_items w ON w.unit_id = u.id WHERE w.id = b.work_item_id), 'another unit')
      || ' since ' || to_char(b.since, 'DD Mon')
  FROM blockers b
  WHERE b.state = 'claimed'
    AND b.since < NOW() - INTERVAL '2 days'
    AND b.party_unit_id IS NOT NULL
  ON CONFLICT (kind, subject_type, subject_id) DO NOTHING;
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END $$;

CREATE OR REPLACE FUNCTION app_run_daily() RETURNS void
  LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  t0 TIMESTAMPTZ := NOW();
  n_quiet INT := 0; n_over INT := 0; n_block INT := 0;
BEGIN
  BEGIN n_quiet := app_check_gone_quiet(); EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN n_over  := app_check_overdue();    EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN n_block := app_check_blockers();   EXCEPTION WHEN OTHERS THEN NULL; END;
  INSERT INTO job_runs(job_name, status, detail, duration_ms)
  VALUES ('daily_checks', 'ok',
    jsonb_build_object('gone_quiet', n_quiet, 'overdue', n_over, 'blockers', n_block),
    (EXTRACT(EPOCH FROM NOW() - t0) * 1000)::INT);
EXCEPTION WHEN OTHERS THEN
  INSERT INTO job_runs(job_name, status, error)
  VALUES ('daily_checks', 'error', SQLERRM);
  RAISE;
END $$;

SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname IN ('ceac-heartbeat','ceac-daily');
SELECT cron.schedule('ceac-heartbeat', '*/5 * * * *', 'SELECT app_heartbeat();');
SELECT cron.schedule('ceac-daily',     '0 8 * * *',   'SELECT app_run_daily();');
