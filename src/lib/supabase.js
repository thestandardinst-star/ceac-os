import { createClient } from "@supabase/supabase-js";
export const supabase = createClient(
  "https://efjljhftsesssumtshvp.supabase.co",
  "sb_publishable_CVq1sCY0Z4-o9Us4Y6RaUw_53FUHQj-",
  { auth: { persistSession: true, autoRefreshToken: true } }
);
export async function loadMe() {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data: p } = await supabase.from("profiles")
    .select("id, full_name, email, job_title, is_admin, is_exec, org_id, joined_at, birthday, contract_type")
    .eq("id", auth.user.id).single();
  if (!p) return null;
  const { data: memberships } = await supabase.from("unit_memberships")
    .select("role, unit_id, units(name)")
    .eq("profile_id", auth.user.id);
  const options = (memberships || []).map((m) => ({
    unit_id: m.unit_id,
    unit_name: m.units ? m.units.name : null,
    role: m.role,
  }));
  const savedUnitId = localStorage.getItem(`ceac-unit:${auth.user.id}`);
  const selected = options.find((m) => m.unit_id === savedUnitId)
    || options.find((m) => m.role === "manager")
    || options[0]
    || null;
  return { ...p,
    unit_id: selected ? selected.unit_id : null,
    unit_name: selected ? selected.unit_name : null,
    role: selected ? selected.role : null,
    memberships: options };
}
export async function inviteByEmail({ orgId, invitedBy, email, fullName, unitId, role }) {
  const clean = { org_id: orgId, email: email.trim(), full_name: fullName.trim(),
    unit_id: unitId || null, role: role || "staff", invited_by: invitedBy };
  const { error: pErr } = await supabase.from("pending_invitations")
    .upsert(clean, { onConflict: "email,org_id" });
  if (pErr) throw pErr;
  const { error: oErr } = await supabase.auth.signInWithOtp({
    email: clean.email,
    options: { shouldCreateUser: true,
      data: { full_name: clean.full_name, org_id: orgId },
      emailRedirectTo: window.location.origin },
  });
  if (oErr) throw oErr;
}
