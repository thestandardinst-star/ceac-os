
-- Extend profiles with employment details
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS joined_at DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS contract_type TEXT DEFAULT 'permanent';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS birthday DATE;

-- Leave policy for the whole church, editable by Rebecca in Settings
CREATE TABLE IF NOT EXISTS leave_settings (
  org_id UUID PRIMARY KEY REFERENCES organisations(id) ON DELETE CASCADE,
  annual_days INTEGER NOT NULL DEFAULT 15,
  monthly_accrual NUMERIC NOT NULL DEFAULT 1.25,
  max_carryover INTEGER NOT NULL DEFAULT 5,
  sick_days INTEGER NOT NULL DEFAULT 12,
  bereavement_days INTEGER NOT NULL DEFAULT 3,
  maternity_weeks INTEGER NOT NULL DEFAULT 12,
  manager_approval_limit INTEGER NOT NULL DEFAULT 5,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id)
);

CREATE TABLE IF NOT EXISTS leave_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  annual_taken NUMERIC NOT NULL DEFAULT 0,
  sick_taken NUMERIC NOT NULL DEFAULT 0,
  carryover_from_last_year INTEGER NOT NULL DEFAULT 0,
  UNIQUE(profile_id, year)
);

CREATE TABLE IF NOT EXISTS leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'annual',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days NUMERIC NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  decided_by UUID REFERENCES profiles(id),
  decided_at TIMESTAMPTZ,
  decision_note TEXT
);

-- The office (or offices) — Rebecca drops the pin, the app checks
-- whether a session's coordinates fall inside the radius.
CREATE TABLE IF NOT EXISTS office_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  lat NUMERIC NOT NULL,
  lng NUMERIC NOT NULL,
  radius_meters INTEGER NOT NULL DEFAULT 100,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  set_by UUID REFERENCES profiles(id),
  set_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Personal goals — private to the person, in no report
CREATE TABLE IF NOT EXISTS personal_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_date DATE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  achieved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS goal_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES personal_goals(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  done BOOLEAN NOT NULL DEFAULT false,
  position INTEGER NOT NULL DEFAULT 1,
  due_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS personal_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  remind_at TIMESTAMPTZ NOT NULL,
  linked_goal_id UUID REFERENCES personal_goals(id) ON DELETE SET NULL,
  seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE leave_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE office_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_reminders ENABLE ROW LEVEL SECURITY;

-- Leave settings: everyone in the org reads, admins write
DROP POLICY IF EXISTS ls_read ON leave_settings;
CREATE POLICY ls_read ON leave_settings FOR SELECT USING (org_id = app_org_id());
DROP POLICY IF EXISTS ls_write ON leave_settings;
CREATE POLICY ls_write ON leave_settings FOR ALL
  USING (org_id = app_org_id() AND app_is_admin())
  WITH CHECK (org_id = app_org_id() AND app_is_admin());

-- Leave balances: person reads own, managers see their unit, admin sees all
DROP POLICY IF EXISTS lb_read ON leave_balances;
CREATE POLICY lb_read ON leave_balances FOR SELECT USING (
  org_id = app_org_id() AND (
    profile_id = auth.uid()
    OR app_is_admin()
    OR profile_id IN (SELECT profile_id FROM unit_memberships WHERE unit_id IN (SELECT app_managed_units()))
  )
);
DROP POLICY IF EXISTS lb_write ON leave_balances;
CREATE POLICY lb_write ON leave_balances FOR ALL
  USING (org_id = app_org_id() AND app_is_admin())
  WITH CHECK (org_id = app_org_id() AND app_is_admin());

-- Leave requests: person creates/reads own, manager/admin approve
DROP POLICY IF EXISTS lr_read ON leave_requests;
CREATE POLICY lr_read ON leave_requests FOR SELECT USING (
  org_id = app_org_id() AND (
    profile_id = auth.uid()
    OR app_is_admin()
    OR profile_id IN (SELECT profile_id FROM unit_memberships WHERE unit_id IN (SELECT app_managed_units()))
  )
);
DROP POLICY IF EXISTS lr_insert ON leave_requests;
CREATE POLICY lr_insert ON leave_requests FOR INSERT WITH CHECK (
  org_id = app_org_id() AND profile_id = auth.uid()
);
DROP POLICY IF EXISTS lr_update ON leave_requests;
CREATE POLICY lr_update ON leave_requests FOR UPDATE USING (
  org_id = app_org_id() AND (
    app_is_admin()
    OR profile_id IN (SELECT profile_id FROM unit_memberships WHERE unit_id IN (SELECT app_managed_units()))
  )
) WITH CHECK (
  org_id = app_org_id() AND (
    app_is_admin()
    OR profile_id IN (SELECT profile_id FROM unit_memberships WHERE unit_id IN (SELECT app_managed_units()))
  )
);

-- Office locations: everyone reads, admin writes
DROP POLICY IF EXISTS ol_read ON office_locations;
CREATE POLICY ol_read ON office_locations FOR SELECT USING (org_id = app_org_id());
DROP POLICY IF EXISTS ol_write ON office_locations;
CREATE POLICY ol_write ON office_locations FOR ALL
  USING (org_id = app_org_id() AND app_is_admin())
  WITH CHECK (org_id = app_org_id() AND app_is_admin());

-- Personal goals: only the owner sees or writes
DROP POLICY IF EXISTS pg_all ON personal_goals;
CREATE POLICY pg_all ON personal_goals FOR ALL
  USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());

DROP POLICY IF EXISTS gs_all ON goal_steps;
CREATE POLICY gs_all ON goal_steps FOR ALL
  USING (goal_id IN (SELECT id FROM personal_goals WHERE profile_id = auth.uid()))
  WITH CHECK (goal_id IN (SELECT id FROM personal_goals WHERE profile_id = auth.uid()));

DROP POLICY IF EXISTS pr_all ON personal_reminders;
CREATE POLICY pr_all ON personal_reminders FOR ALL
  USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());

-- Seed the church's leave defaults
INSERT INTO leave_settings (org_id) 
SELECT id FROM organisations 
ON CONFLICT (org_id) DO NOTHING;
