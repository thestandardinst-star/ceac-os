import { supabase } from "./supabase";
export async function openSession(orgId, userId) {
  const { data } = await supabase.from("work_sessions")
    .select("id, started_at, place, work_item_id")
    .eq("profile_id", userId).is("ended_at", null)
    .order("started_at", { ascending: false }).limit(1).maybeSingle();
  return data || null;
}
export async function startWork(orgId, userId, place, workItemId) {
  const pos = await getPositionOnce();
  const { data, error } = await supabase.from("work_sessions").insert({
    org_id: orgId, profile_id: userId, place, work_item_id: workItemId,
    lat: pos ? pos.lat : null, lng: pos ? pos.lng : null,
    device_time: new Date().toISOString(),
  }).select("id, started_at, place, work_item_id").single();
  if (error) throw error;
  return data;
}
export async function endWork(sessionId) {
  await supabase.from("work_sessions")
    .update({ ended_at: new Date().toISOString(), end_reason: "manual" }).eq("id", sessionId);
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
