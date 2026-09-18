import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { dueLabel, isOverdue } from "../lib/time";
import { Sheet } from "../components/bits";

export default function ManagerHome({ me, openItem, goAssign }) {
  const [queue, setQueue] = useState([]);
  const [team, setTeam] = useState([]);
  const [blocked, setBlocked] = useState([]);
  const [forUs, setForUs] = useState([]);
  const [mine, setMine] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [open, setOpen] = useState(null);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { load(); }, [me.unit_id]);

  async function load() {
    if (!me.unit_id) return;
    const { data: subs } = await supabase.from("submissions")
      .select("id, note, submitted_at, profiles(full_name), work_items!inner(id, ref, title, unit_id, status), submission_files(url)")
      .eq("work_items.unit_id", me.unit_id).eq("work_items.status", "in_review")
      .order("submitted_at", { ascending: true });
    setQueue(subs || []);
    const { data: members } = await supabase.from("unit_memberships")
      .select("profile_id, profiles(full_name)").eq("unit_id", me.unit_id);
    const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
    const rows = [];
    for (const m of members || []) {
      const { data: items } = await supabase.from("work_items")
        .select("status, due_at").eq("assignee_id", m.profile_id).eq("visibility", "unit");
      const { data: sess } = await supabase.from("work_sessions")
        .select("started_at, ended_at").eq("profile_id", m.profile_id).gte("started_at", weekAgo);
      rows.push({
        name: m.profiles ? m.profiles.full_name : "—",
        working: (sess || []).some((s) => !s.ended_at),
        days: new Set((sess || []).map((s) => new Date(s.started_at).toDateString())).size,
        done: (items || []).filter((i) => i.status === "completed").length,
        waiting: (items || []).filter((i) => i.status === "waiting_on").length,
        overdue: (items || []).filter((i) => isOverdue(i.due_at) && i.status !== "completed" && i.status !== "waiting_on").length,
      });
    }
    setTeam(rows);
    const { data: b } = await supabase.from("blockers")
      .select("id, party_text, since, state, work_items!inner(id, title, unit_id), profiles(full_name), units(name)")
      .eq("work_items.unit_id", me.unit_id).neq("state", "resolved");
    setBlocked(b || []);
    const { data: f } = await supabase.from("blockers")
      .select("id, party_text, note, since, profiles(full_name)")
      .eq("party_unit_id", me.unit_id).eq("state", "claimed");
    setForUs(f || []);
    const { data: my } = await supabase.from("work_items")
      .select("id, ref, title, status, due_at").eq("assignee_id", me.id)
      .not("status", "in", "(completed,cancelled)");
    setMine(my || []);
    const { data: a } = await supabase.from("alerts")
      .select("id, kind, subject_id, message, first_seen_at")
      .eq("for_unit_id", me.unit_id).is("acknowledged_at", null);
    setAlerts(a || []);
  }

  async function decide(sub, decision) {
    setBusy(true);
    try {
      await supabase.from("reviews").insert({
        org_id: me.org_id, submission_id: sub.id, reviewer_id: me.id,
        decision, comment: comment || null, seen_at: new Date().toISOString() });
      const wi = sub.work_items;
      if (decision === "completed") {
        const r = await supabase.from("submissions").select("id").eq("work_item_id", wi.id);
        const ids = (r.data || []).map((x) => x.id);
        const { count } = await supabase.from("reviews").select("id", { count: "exact", head: true })
          .eq("decision", "returned").in("submission_id", ids);
        await supabase.from("work_items").update({
          status: "completed", completed_at: new Date().toISOString(),
          first_time_approved: (count || 0) === 0, last_movement_at: new Date().toISOString() }).eq("id", wi.id);
      } else {
        await supabase.from("work_items").update({
          status: "returned", first_time_approved: false, last_movement_at: new Date().toISOString() }).eq("id", wi.id);
      }
      setOpen(null); setComment(""); await load();
    } finally { setBusy(false); }
  }

  async function answer(b, state) {
    await supabase.from("blockers").update({
      state, responded_by: me.id, response_note: comment || null,
      responded_at: new Date().toISOString() }).eq("id", b.id);
    setOpen(null); setComment(""); await load();
  }

  return (
    <div className="body">
      <div style={{ paddingTop: 26 }}>
        <div className="eyebrow">{me.unit_name}</div>
        <h1 className="h1" style={{ marginTop: 6 }}>{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</h1>
        <p className="screen-note">Everything waiting on you, then how your team is doing, then your own work.</p>
      </div>
      <button className="btn wide-auto" style={{ marginTop: 16 }} onClick={goAssign}>Give out work</button>
      <div className="split" style={{ marginTop: 4 }}>
      <div className="main-col">
      <div className="sec"><span>Waiting on you</span><span>{queue.length}</span></div>
      {queue.length === 0 && <div className="card small">Nothing to check right now.</div>}
      {queue.map((s) => (
        <div key={s.id} className="row">
          <div className="row-t">{s.work_items.title}</div>
          <div className="row-m">{s.work_items.ref} · {s.profiles ? s.profiles.full_name : ""}</div>
          {s.note && <div className="row-note">&ldquo;{s.note}&rdquo;</div>}
          {s.submission_files && s.submission_files[0] && <div className="row-note" style={{ wordBreak: "break-all" }}>{s.submission_files[0].url}</div>}
          <div style={{ display: "flex", gap: 7, marginTop: 11 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setOpen({ ...s, mode: "returned" })}>Send back</button>
            <button className="btn btn-sm" onClick={() => setOpen({ ...s, mode: "completed" })}>Approve</button>
          </div>
        </div>))}
      {alerts.length > 0 && (<>
        <div className="sec"><span>Things to look at</span><span>{alerts.length}</span></div>
        {alerts.map((a) => (
          <button key={a.id} className="row" onClick={() => a.subject_id && openItem(a.subject_id)}>
            <div className="row-t">{a.message}</div>
            <div className="row-m">Since {new Date(a.first_seen_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</div>
          </button>))}
      </>)}
      {forUs.length > 0 && (<>
        <div className="sec"><span>Someone is waiting on your unit</span><span>{forUs.length}</span></div>
        {forUs.map((b) => (
          <div key={b.id} className="row">
            <div className="row-t">{b.party_text}</div>
            <div className="row-m">{b.profiles ? b.profiles.full_name : ""}</div>
            {b.note && <div className="row-note">&ldquo;{b.note}&rdquo;</div>}
            <div style={{ display: "flex", gap: 7, marginTop: 11 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setOpen({ ...b, mode: "dispute" })}>We disagree</button>
              <button className="btn btn-sm" onClick={() => answer(b, "acknowledged")}>Yes, it is with us</button>
            </div>
          </div>))}
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
      <div className="sec"><span>Your team</span></div>
      {team.map((t) => (
        <div key={t.name} className="row">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div className="row-t">{t.name}</div>
            <span className={"pill " + (t.working ? "p-green" : "p-grey")}>{t.working ? "Working" : "Not started"}</span>
          </div>
          <div className="row-m">present {t.days} day{t.days === 1 ? "" : "s"} · {t.done} finished{t.waiting > 0 ? " · " + t.waiting + " waiting on others" : ""}{t.overdue > 0 ? " · " + t.overdue + " overdue" : ""}</div>
        </div>))}
      {blocked.length > 0 && (<>
        <div className="sec"><span>Stuck on other people</span><span>{blocked.length}</span></div>
        {blocked.map((b) => (
          <button key={b.id} className="row" onClick={() => openItem(b.work_items.id)}>
            <div className="row-t">{b.work_items.title}</div>
            <div className="row-m">{b.profiles ? b.profiles.full_name : ""} waiting on {b.units ? b.units.name : b.party_text}</div>
            <div style={{ marginTop: 7 }}>
              <span className={"pill " + (b.state === "acknowledged" ? "p-green" : b.state === "disputed" ? "p-brick" : "p-amber")}>
                {b.state === "acknowledged" ? "They confirmed" : b.state === "disputed" ? "They disagree" : "No reply yet"}</span>
            </div>
          </button>))}
      </>)}
      </div>
      </div>
      {open && (
        <Sheet onClose={() => { setOpen(null); setComment(""); }}>
          <div className="h2">{open.mode === "completed" ? "Approve this work" : open.mode === "returned" ? "Send it back" : "Why do you disagree?"}</div>
          <p className="screen-note">{open.mode === "completed"
            ? "They will be told it was approved."
            : open.mode === "returned" ? "Say what needs changing. They will see this above the checklist."
            : "Say what is actually needed. Both accounts stay visible."}</p>
          <textarea className="field" rows={3} placeholder={open.mode === "completed" ? "A note (optional)" : "What needs to happen"}
            value={comment} onChange={(e) => setComment(e.target.value)} />
          <button className="btn" style={{ marginTop: 14 }} disabled={busy}
            onClick={() => open.mode === "dispute" ? answer(open, "disputed") : decide(open, open.mode)}>
            {busy ? "Saving..." : open.mode === "completed" ? "Approve" : open.mode === "returned" ? "Send back" : "Send our answer"}</button>
        </Sheet>)}
    </div>);
}
