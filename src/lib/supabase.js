import { createClient } from "@supabase/supabase-js";
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://efjljhftsesssumtshvp.supabase.co";
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_CVq1sCY0Z4-o9Us4Y6RaUw_53FUHQj-";

export const supabase = createClient(
  supabaseUrl,
  supabaseKey,
  { auth: { persistSession: true, autoRefreshToken: true } }
);
export async function loadMe() {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!auth.user) return null;
  const { data: p, error: profileError } = await supabase.from("profiles")
    .select("id, full_name, preferred_name, email, job_title, phone, is_admin, is_exec, org_id, joined_at, birthday, contract_type")
    .eq("id", auth.user.id).single();
  if (profileError) throw profileError;
  if (!p) return null;
  const { data: memberships, error: membershipError } = await supabase.from("unit_memberships")
    .select("role, unit_id, units(name)")
    .eq("profile_id", auth.user.id);
  if (membershipError) throw membershipError;
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
export async function inviteByEmail({ email, fullName, unitId }) {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = fullName.trim();
  const { error: inviteError } = await supabase.rpc("create_pending_invitation", {
    p_email: cleanEmail,
    p_full_name: cleanName,
    p_unit_id: unitId,
    p_role: "staff",
  });
  if (inviteError) throw inviteError;

  const { error: authError } = await supabase.auth.signInWithOtp({
    email: cleanEmail,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${window.location.origin}/activate`,
    },
  });
  if (authError) throw authError;
}
