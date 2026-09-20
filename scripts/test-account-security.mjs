import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceKey) {
  throw new Error("Missing local Supabase credentials.");
}

const email = "new.employee@ceac.local.test";
const initialPassword = "CEAC-local-test-2026!";
const recoveredPassword = "CEAC-local-recovered-2026!";
const expectedUnit = "20000000-0000-4000-8000-000000000001";

const publicClient = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});
const adminClient = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

const otpStart = await publicClient.auth.signInWithOtp({
  email,
  options: { shouldCreateUser: true, emailRedirectTo: "http://localhost:4173/activate" },
});
assert.equal(otpStart.error, null, otpStart.error?.message);

const magic = await adminClient.auth.admin.generateLink({ type: "magiclink", email });
assert.equal(magic.error, null, magic.error?.message);
assert.ok(magic.data?.properties?.hashed_token, "Magic-link token was not generated.");

const firstSession = await publicClient.auth.verifyOtp({
  token_hash: magic.data.properties.hashed_token,
  type: "magiclink",
});
assert.equal(firstSession.error, null, firstSession.error?.message);
assert.ok(firstSession.data.session, "First invited session was not established.");

const profile = await publicClient.from("profiles")
  .select("id,org_id,full_name,email")
  .eq("id", firstSession.data.user.id)
  .single();
assert.equal(profile.error, null, profile.error?.message);
assert.equal(profile.data.full_name, "New Employee");
assert.equal(profile.data.email, email);

const membership = await publicClient.from("unit_memberships")
  .select("unit_id,role")
  .eq("profile_id", firstSession.data.user.id)
  .single();
assert.equal(membership.error, null, membership.error?.message);
assert.equal(membership.data.unit_id, expectedUnit);
assert.equal(membership.data.role, "staff");

const setInitial = await publicClient.auth.updateUser({ password: initialPassword });
assert.equal(setInitial.error, null, setInitial.error?.message);
await publicClient.auth.signOut();

const passwordLogin = await publicClient.auth.signInWithPassword({ email, password: initialPassword });
assert.equal(passwordLogin.error, null, passwordLogin.error?.message);
assert.ok(passwordLogin.data.session, "Password sign-in after activation failed.");
await publicClient.auth.signOut();

const recovery = await adminClient.auth.admin.generateLink({ type: "recovery", email });
assert.equal(recovery.error, null, recovery.error?.message);
assert.ok(recovery.data?.properties?.hashed_token, "Recovery token was not generated.");

const recoveredSession = await publicClient.auth.verifyOtp({
  token_hash: recovery.data.properties.hashed_token,
  type: "recovery",
});
assert.equal(recoveredSession.error, null, recoveredSession.error?.message);
assert.ok(recoveredSession.data.session, "Recovery session was not established.");

const setRecovered = await publicClient.auth.updateUser({ password: recoveredPassword });
assert.equal(setRecovered.error, null, setRecovered.error?.message);
await publicClient.auth.signOut();

const recoveredLogin = await publicClient.auth.signInWithPassword({ email, password: recoveredPassword });
assert.equal(recoveredLogin.error, null, recoveredLogin.error?.message);
assert.ok(recoveredLogin.data.session, "Sign-in with recovered password failed.");

console.log("Account security flow passed: invitation -> first session -> password -> recovery -> password.");
