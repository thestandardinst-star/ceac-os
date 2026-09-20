
-- A pending invitation carries the who-should-be-where until the person
-- actually confirms their email. The trigger consumes it on their first
-- sign-in, so the inviter never has to touch memberships by hand.
CREATE TABLE IF NOT EXISTS pending_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'staff',
  invited_by UUID REFERENCES profiles(id),
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  UNIQUE(email, org_id)
);

ALTER TABLE pending_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pi_read ON pending_invitations;
CREATE POLICY pi_read ON pending_invitations FOR SELECT USING (
  org_id = app_org_id() AND (
    app_is_admin()
    OR (unit_id IS NOT NULL AND unit_id IN (SELECT app_managed_units()))
  )
);

DROP POLICY IF EXISTS pi_write ON pending_invitations;
CREATE POLICY pi_write ON pending_invitations FOR ALL USING (
  org_id = app_org_id() AND (
    app_is_admin()
    OR (unit_id IS NOT NULL AND unit_id IN (SELECT app_managed_units()))
  )
) WITH CHECK (
  org_id = app_org_id() AND (
    app_is_admin()
    OR (unit_id IS NOT NULL AND unit_id IN (SELECT app_managed_units()))
  )
);

-- Extend the new-user handler: create the profile, and if the email
-- has a pending invitation, place them in the right unit with the
-- right role and mark the invitation resolved.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_org UUID;
  v_invite pending_invitations%ROWTYPE;
BEGIN
  SELECT * INTO v_invite FROM pending_invitations
    WHERE email = new.email AND resolved_at IS NULL
    ORDER BY invited_at DESC LIMIT 1;

  v_org := NULLIF(new.raw_user_meta_data->>'org_id','')::uuid;
  IF v_org IS NULL THEN v_org := v_invite.org_id; END IF;
  IF v_org IS NULL THEN
    SELECT id INTO v_org FROM organisations ORDER BY created_at LIMIT 1;
  END IF;

  INSERT INTO profiles (id, org_id, full_name, email, job_title)
  VALUES (
    new.id, v_org,
    COALESCE(new.raw_user_meta_data->>'full_name', v_invite.full_name, split_part(new.email,'@',1)),
    new.email,
    new.raw_user_meta_data->>'job_title'
  )
  ON CONFLICT (id) DO NOTHING;

  IF v_invite.id IS NOT NULL THEN
    IF v_invite.unit_id IS NOT NULL THEN
      INSERT INTO unit_memberships (org_id, unit_id, profile_id, role)
      VALUES (v_invite.org_id, v_invite.unit_id, new.id, v_invite.role)
      ON CONFLICT DO NOTHING;
    END IF;
    UPDATE pending_invitations SET resolved_at = NOW() WHERE id = v_invite.id;
  END IF;

  RETURN new;
END $$;
