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
  const { data: m } = await supabase.from("unit_memberships")
    .select("role, unit_id, units(name)")
    .eq("profile_id", auth.user.id).limit(1).maybeSingle();
  return { ...p, unit_id: m ? m.unit_id : null,
    unit_name: m && m.units ? m.units.name : null, role: m ? m.role : null };
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
