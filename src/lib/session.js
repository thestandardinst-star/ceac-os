import { supabase } from "./supabase";
export async function openSession(orgId, userId) {
  const { data, error } = await supabase.from("work_sessions")
    .select("id, started_at, last_confirmed_at, place, work_item_id")
    .eq("profile_id", userId).is("ended_at", null)
    .order("started_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return data || null;
}
export async function startWork(orgId, userId, place, workItemId) {
  const pos = await getPositionOnce();
  const { data, error } = await supabase.from("work_sessions").insert({
    org_id: orgId, profile_id: userId, place, work_item_id: workItemId,
    lat: pos ? pos.lat : null, lng: pos ? pos.lng : null,
    device_time: new Date().toISOString(),
  }).select("id, started_at, last_confirmed_at, place, work_item_id").single();
  if (error) throw error;
  return data;
}
export async function endWork(sessionId) {
  const { data, error } = await supabase.rpc("end_work_session", { p_session_id: sessionId });
  if (error) throw error;
  return data;
}
export async function reconcileWorkSession(sessionId, action, effectiveEndedAt = null, note = null) {
  const { data, error } = await supabase.rpc("reconcile_work_session", {
    p_session_id: sessionId,
    p_action: action,
    p_effective_ended_at: effectiveEndedAt,
    p_note: note,
  });
  if (error) throw error;
  return data;
}
function getPositionOnce() {
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) return resolve(null);
    const done = setTimeout(() => resolve(null), 6000);
    navigator.geolocation.getCurrentPosition(
      (p) => { clearTimeout(done); resolve({ lat: p.coords.latitude, lng: p.coords.longitude }); },
      () => { clearTimeout(done); resolve(null); },
      { timeout: 6000, maximumAge: 0 });
  });
}
