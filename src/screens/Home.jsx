import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { startWork, endWork } from "../lib/session";
import { since, dueLabel, isOverdue } from "../lib/time";
import { Sheet, statusPill } from "../components/bits";

export default function Home({ me, session, setSession, openItem }) {
  const [items, setItems] = useState([]);
  const [returned, setReturned] = useState([]);
  const [forMe, setForMe] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [ask, setAsk] = useState(false);
  const [place, setPlace] = useState("office");
  const [busy, setBusy] = useState(false);
  const [, tick] = useState(0);

  useEffect(() => { const t = setInterval(() => tick((n) => n + 1), 30000); return () => clearInterval(t); }, []);
  useEffect(() => { load(); }, [me.id]);

  async function load() {
    const { data } = await supabase.from("work_items")
      .select("id, ref, title, status, due_at, visibility")
      .eq("assignee_id", me.id).not("status", "in", "(completed,cancelled)")
      .order("due_at", { ascending: true, nullsFirst: false });
    setItems(data || []);
    const { data: r } = await supabase.from("work_items").select("id, ref, title")
      .eq("assignee_id", me.id).eq("status", "returned");
    setReturned(r || []);
    if (me.unit_id) {
      const { data: b } = await supabase.from("blockers")
        .select("id, party_text, note, since, state")
        .eq("party_unit_id", me.unit_id).eq("state", "claimed");
      setForMe(b || []);
    }
    const { data: a } = await supabase.from("alerts")
      .select("id, kind, subject_id, message, first_seen_at")
      .eq("for_profile_id", me.id).is("acknowledged_at", null);
    setAlerts(a || []);
  }

  const dueToday = items.filter((i) => i.due_at && new Date(i.due_at).toDateString() === new Date().toDateString());
  const overdue = items.filter((i) => isOverdue(i.due_at) && i.status !== "waiting_on");
  const waiting = items.filter((i) => i.status === "waiting_on");
  const attention = returned.length + forMe.length + overdue.length + alerts.length;

  async function begin() {
    setBusy(true);
    try { const s = await startWork(me.org_id, me.id, place, null); setSession(s); setAsk(false); }
    finally { setBusy(false); }
  }
  async function stop() {
    if (!session) return;
    setBusy(true);
    try { await endWork(session.id); setSession(null); } finally { setBusy(false); }
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="body">
      <div style={{ paddingTop: 26 }}>
        <div className="eyebrow">{me.unit_name} · {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</div>
        <h1 className="h1" style={{ marginTop: 6 }}>{greeting}, {me.full_name.split(" ")[0]}</h1>
      </div>

      <div className={"sess " + (session ? "live" : "")} style={{ marginTop: 18 }}>
        <div>
          <div className="s-l">{session
            ? "Working since " + new Date(session.started_at).toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit" }) + ", " + (session.place === "office" ? "at the office" : "elsewhere")
            : "Not working"}</div>
          <div className="s-v">{session ? since(session.started_at) : "Start to send work in"}</div>
        </div>
        {session
          ? <button className="btn btn-ghost btn-sm" onClick={stop} disabled={busy}>End work</button>
          : <button className="btn btn-sm" onClick={() => setAsk(true)} disabled={busy}>Start work</button>}
      </div>

      <div className="split" style={{ marginTop: 4 }}>
      <div className="main-col">
      {attention > 0 && (<>
        <div className="sec"><span>Needs your attention</span><span>{attention}</span></div>
        {returned.map((r) => (
          <button key={r.id} className="row" onClick={() => openItem(r.id)}>
            <div className="row-t">{r.title} — sent back</div>
            <div className="row-m">{r.ref} · your manager left a note</div>
          </button>))}
        {alerts.map((a) => (
          <button key={a.id} className="row" onClick={() => a.subject_id && openItem(a.subject_id)}>
            <div className="row-t">{a.message}</div>
            <div className="row-m">Since {new Date(a.first_seen_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</div>
          </button>))}
        {forMe.map((b) => (
          <div key={b.id} className="row">
            <div className="row-t">Someone is waiting on your unit</div>
            <div className="row-m">{b.party_text}</div>
            {b.note && <div className="row-note">&ldquo;{b.note}&rdquo;</div>}
          </div>))}
        {overdue.map((i) => (
          <button key={i.id} className="row" onClick={() => openItem(i.id)}>
            <div className="row-t">{i.title}</div>
            <div className="row-m">{dueLabel(i.due_at)}</div>
          </button>))}
      </>)}

      {dueToday.length > 0 && (<>
        <div className="sec"><span>Due today</span><span>{dueToday.length}</span></div>
        {dueToday.map((i) => (
          <button key={i.id} className="row" onClick={() => openItem(i.id)}>
            <div className="row-t">{i.title}</div>
            <div className="row-m">{i.ref} · {dueLabel(i.due_at)}</div>
            <div style={{ marginTop: 7 }}>{statusPill(i.status)}</div>
          </button>))}
      </>)}
      </div>

      <div className="side-col">
      {waiting.length > 0 && (<>
        <div className="sec"><span>Waiting on someone else</span><span>{waiting.length}</span></div>
        {waiting.map((i) => (
          <button key={i.id} className="row" onClick={() => openItem(i.id)}>
            <div className="row-t">{i.title}</div>
            <div className="row-m">{i.ref} · not counting as late</div>
          </button>))}
      </>)}
      </div>
      </div>

      {items.length === 0 && attention === 0 && (
        <div className="empty">
          <h3>No work assigned yet</h3>
          <p>When your manager gives you something it will appear here, with what it is for and what finished looks like.</p>
        </div>)}

      {ask && (
        <Sheet onClose={() => setAsk(false)}>
          <div className="h2">Where are you working?</div>
          <p className="screen-note" style={{ marginBottom: 10 }}>We record where you start. We do not track you during the day.</p>
          <button className="opt" onClick={() => setPlace("office")}>
            <span className={"rd " + (place === "office" ? "on" : "")} /> At the office</button>
          <button className="opt" onClick={() => setPlace("elsewhere")}>
            <span className={"rd " + (place === "elsewhere" ? "on" : "")} /> Somewhere else</button>
          <button className="btn" style={{ marginTop: 16 }} onClick={begin} disabled={busy}>
            {busy ? "Starting..." : "Start work"}</button>
        </Sheet>)}
    </div>);
}
