import { useEffect, useState } from "react";
import { supabase, inviteByEmail } from "../lib/supabase";
import { dueLabel } from "../lib/time";
import { Sheet } from "../components/bits";

export default function AdminHome({ me, openItem, openSettings }) {
  const [units, setUnits] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [blockers, setBlockers] = useState([]);
  const [leaveQueue, setLeaveQueue] = useState([]);
  const [mine, setMine] = useState([]);
  const [office, setOffice] = useState(null);
  const [inviting, setInviting] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
    const { data: us } = await supabase.from("units").select("id, name").order("name");
    const { data: mgrs } = await supabase.from("unit_memberships")
      .select("unit_id, profile_id, profiles(id, full_name, email)").eq("role", "manager");
    const headByUnit = {};
    (mgrs || []).forEach((m) => { if (m.profiles) headByUnit[m.unit_id] = m.profiles; });
    const { data: done7 } = await supabase.from("work_items")
      .select("unit_id").eq("status", "completed").gte("completed_at", weekAgo);
    const doneByUnit = {};
    (done7 || []).forEach((r) => { doneByUnit[r.unit_id] = (doneByUnit[r.unit_id] || 0) + 1; });
    const { data: openAlerts } = await supabase.from("alerts")
      .select("for_unit_id").is("acknowledged_at", null).not("for_unit_id", "is", null);
    const alertsByUnit = {};
    (openAlerts || []).forEach((r) => { alertsByUnit[r.for_unit_id] = (alertsByUnit[r.for_unit_id] || 0) + 1; });
    const { data: pi } = await supabase.from("pending_invitations")
      .select("unit_id, email, full_name, invited_at").is("resolved_at", null);
    const pendByUnit = {};
    (pi || []).forEach((r) => { if (r.unit_id) pendByUnit[r.unit_id] = r; });
    setUnits((us || []).map((u) => ({
      ...u, head: headByUnit[u.id] || null, pending: pendByUnit[u.id] || null,
      done7: doneByUnit[u.id] || 0, alerts: alertsByUnit[u.id] || 0,
    })));
    const { data: al } = await supabase.from("alerts")
      .select("id, kind, subject_id, subject_type, message, first_seen_at")
      .is("acknowledged_at", null).order("first_seen_at", { ascending: false }).limit(30);
    setAlerts(al || []);
    const { data: bl } = await supabase.from("blockers")
      .select("id, party_text, since, state, work_items(id, title, unit_id), profiles(full_name), units(name)")
      .neq("state", "resolved").limit(20);
    setBlockers(bl || []);
    const { data: lq } = await supabase.from("leave_requests")
      .select("id, kind, start_date, end_date, days, status, profiles(full_name)")
      .in("status", ["pending", "escalated"]).order("requested_at", { ascending: false }).limit(20);
    setLeaveQueue(lq || []);
    const { data: my } = await supabase.from("work_items")
      .select("id, ref, title, status, due_at").eq("assignee_id", me.id)
      .not("status", "in", "(completed,cancelled)");
    setMine(my || []);
    const { data: o } = await supabase.from("office_locations").select("id").eq("is_primary", true).limit(1).maybeSingle();
    setOffice(o);
  }

  async function sendInvite() {
    if (!inviting) return;
    setBusy(true); setMsg(null);
    try {
      await inviteByEmail({ orgId: me.org_id, invitedBy: me.id,
        email, fullName: name, unitId: inviting.id, role: "manager" });
      setMsg("Sent. " + email.trim() + " will get a link, and appears as head of " + inviting.name + " once they sign in.");
      setName(""); setEmail(""); setInviting(null); await load();
    } catch (e) { setMsg(e.message); }
    finally { setBusy(false); }
  }

  // Approve and decline are separate decisions. Decline sets "declined";
  // it must never fall through to "escalated", which would push the request
  // straight back into this same queue.
  async function decideLeave(r, decision) {
    await supabase.from("leave_requests").update({
      status: decision, decided_by: me.id, decided_at: new Date().toISOString() }).eq("id", r.id);
    await load();
  }

  const withoutHead = units.filter((u) => !u.head && !u.pending).length;

  return (
    <div className="body">
      <div style={{ paddingTop: 26 }}>
        <div className="eyebrow">Administration &amp; HR</div>
        <h1 className="h1" style={{ marginTop: 6 }}>
          {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
        </h1>
        <p className="screen-note">The whole church at a glance. Every unit, everything open, every job stuck.</p>
      </div>

      {!office && (
        <div className="flag flag-amber" style={{ marginTop: 14 }}>
          <h4>Set the office location</h4>
          Attendance cannot tell the office from anywhere else until the office pin is placed.
          <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={openSettings}>Open Settings</button>
        </div>)}

      {withoutHead > 0 && (
        <div className="flag flag-amber" style={{ marginTop: 14 }}>
          <h4>{withoutHead} unit{withoutHead === 1 ? "" : "s"} without a head yet</h4>
          Add each one below. They get a link by email and appear here once they sign in.
        </div>)}

      <div className="split" style={{ marginTop: 8 }}>
      <div className="main-col">

      {leaveQueue.length > 0 && (<>
        <div className="sec"><span>Leave to review</span><span>{leaveQueue.length}</span></div>
        {leaveQueue.map((r) => (
          <div key={r.id} className="row">
            <div className="row-t">{r.profiles ? r.profiles.full_name : "—"} — {r.days} day{r.days === 1 ? "" : "s"} {r.kind}</div>
            <div className="row-m">{r.start_date} → {r.end_date} · {r.status === "escalated" ? "Sent up from a manager" : "Waiting for review"}</div>
            <div style={{ display: "flex", gap: 7, marginTop: 10 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => decideLeave(r, "declined")}>Decline</button>
              <button className="btn btn-sm" onClick={() => decideLeave(r, "approved")}>Approve</button>
            </div>
          </div>))}
      </>)}

      <div className="sec"><span>Things to look at</span><span>{alerts.length}</span></div>
      {alerts.length === 0 && <div className="card small">Nothing across the church needs you right now.</div>}
      {alerts.map((a) => (
        <button key={a.id} className="row" onClick={() => a.subject_type === "work_item" && a.subject_id && openItem(a.subject_id)}>
          <div className="row-t">{a.message}</div>
          <div className="row-m">Since {new Date(a.first_seen_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</div>
        </button>))}

      {blockers.length > 0 && (<>
        <div className="sec"><span>Stuck across the church</span><span>{blockers.length}</span></div>
        {blockers.map((b) => (
          <button key={b.id} className="row" onClick={() => b.work_items && openItem(b.work_items.id)}>
            <div className="row-t">{b.work_items ? b.work_items.title : "—"}</div>
            <div className="row-m">{b.profiles ? b.profiles.full_name : ""} waiting on {b.units ? b.units.name : b.party_text}</div>
            <div style={{ marginTop: 7 }}>
              <span className={"pill " + (b.state === "acknowledged" ? "p-green" : b.state === "disputed" ? "p-brick" : "p-amber")}>
                {b.state === "acknowledged" ? "They confirmed" : b.state === "disputed" ? "They disagree" : "No reply yet"}
              </span>
            </div>
          </button>))}
      </>)}

      {mine.length > 0 && (<>
        <div className="sec"><span>Your own work</span><span>{mine.length}</span></div>
        {mine.map((i) => (
          <button key={i.id} className="row" onClick={() => openItem(i.id)}>
            <div className="row-t">{i.title}</div>
            <div className="row-m">{i.ref} · {dueLabel(i.due_at)}</div>
          </button>))}
      </>)}

      </div>

      <div className="side-col">
      <div className="sec"><span>All units</span><span>{units.length}</span></div>
      {units.map((u) => (
        <div key={u.id} className="row">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
            <div className="row-t">{u.name}</div>
            {u.alerts > 0 && <span className="pill p-amber">{u.alerts}</span>}
          </div>
          {u.head ? (
            <div className="row-m">{u.head.full_name} · {u.head.email}</div>
          ) : u.pending ? (
            <div className="row-m" style={{ color: "var(--amber)" }}>
              Invitation sent to {u.pending.email} — waiting for them to sign in
            </div>
          ) : (
            <>
              <div className="row-m" style={{ color: "var(--brick)" }}>No head yet</div>
              <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }}
                onClick={() => { setInviting(u); setMsg(null); }}>Add a head</button>
            </>)}
          <div className="row-m" style={{ marginTop: 4 }}>{u.done7} finished this week</div>
        </div>))}
      </div>
      </div>

      {inviting && (
        <Sheet onClose={() => { setInviting(null); setMsg(null); }}>
          <div className="h2">Add head of {inviting.name}</div>
          <p className="screen-note">They get an email with a sign-in link, and appear as head of this unit once they use it. Nobody shares a password.</p>
          <input className="field" placeholder="Their full name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="field" placeholder="Their work email" type="email" autoCapitalize="none"
            value={email} onChange={(e) => setEmail(e.target.value)} />
          {msg && <div className="flag flag-amber" style={{ marginTop: 12 }}>{msg}</div>}
          <button className="btn" style={{ marginTop: 14 }} onClick={sendInvite}
            disabled={busy || !name.trim() || !email.trim()}>
            {busy ? "Sending..." : "Send the invitation"}</button>
        </Sheet>)}
    </div>);
}
