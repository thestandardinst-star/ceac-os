import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const rolePassword = process.env.ROLE_FIXTURE_PASSWORD;
if (!url || !serviceKey || !rolePassword) throw new Error("Missing local role-fixture environment.");

const service = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

const orgId = "10000000-0000-4000-8000-000000000010";
const unitA = "20000000-0000-4000-8000-000000000011";
const unitB = "20000000-0000-4000-8000-000000000012";

const users = [
  { id: "31000000-0000-4000-8000-000000000001", email: "staff@ceac.local.test", name: "Staff Fixture", unit: unitA, role: "staff" },
  { id: "31000000-0000-4000-8000-000000000002", email: "manager@ceac.local.test", name: "Manager Fixture", unit: unitA, role: "manager" },
  { id: "31000000-0000-4000-8000-000000000003", email: "admin@ceac.local.test", name: "Admin Fixture", unit: unitA, role: "staff", isAdmin: true },
  { id: "31000000-0000-4000-8000-000000000004", email: "exec@ceac.local.test", name: "Executive Fixture", unit: unitA, role: "staff", isExec: true },
  { id: "31000000-0000-4000-8000-000000000005", email: "other@ceac.local.test", name: "Other Unit Fixture", unit: unitB, role: "staff" },
  { id: "31000000-0000-4000-8000-000000000006", email: "sameunit@ceac.local.test", name: "Same Unit Fixture", unit: unitA, role: "staff" },
  { id: "31000000-0000-4000-8000-000000000007", email: "managerb@ceac.local.test", name: "Manager B Fixture", unit: unitB, role: "manager" },
];

for (const user of users) {
  const invite = await service.from("pending_invitations").insert({
    org_id: orgId,
    email: user.email,
    full_name: user.name,
    unit_id: user.unit,
    role: "staff",
    invited_by: null,
    expires_at: new Date(Date.now() + 86400000).toISOString(),
  });
  assert.equal(invite.error, null, invite.error?.message);

  const created = await service.auth.admin.createUser({
    id: user.id,
    email: user.email,
    password: rolePassword,
    email_confirm: true,
  });
  assert.equal(created.error, null, created.error?.message);

  if (user.role === "manager") {
    const promoted = await service.from("unit_memberships")
      .update({ role: "manager" })
      .eq("profile_id", user.id)
      .eq("unit_id", user.unit);
    assert.equal(promoted.error, null, promoted.error?.message);
  }

  if (user.isAdmin || user.isExec) {
    const elevated = await service.from("profiles")
      .update({ is_admin: Boolean(user.isAdmin), is_exec: Boolean(user.isExec) })
      .eq("id", user.id);
    assert.equal(elevated.error, null, elevated.error?.message);
  }
}

const subTeamA = "22000000-0000-4000-8000-000000000011";
const subTeam = await service.from("sub_teams").insert({
  id: subTeamA,
  org_id: orgId,
  unit_id: unitA,
  name: "Fixture Video Team",
  code: "VID",
  lead_id: users[1].id,
  position: 1,
  active: true,
});
assert.equal(subTeam.error, null, subTeam.error?.message);

const subTeamMember = await service.from("sub_team_members").insert({
  sub_team_id: subTeamA,
  profile_id: users[0].id,
});
assert.equal(subTeamMember.error, null, subTeamMember.error?.message);

const capability = await service.from("capabilities").insert({
  org_id: orgId,
  profile_id: users[1].id,
  capability: "create_project",
  granted_by: users[2].id,
});
assert.equal(capability.error, null, capability.error?.message);

console.log("Role fixtures seeded.");
