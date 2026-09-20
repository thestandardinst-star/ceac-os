import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { startWork, endWork } from "../lib/session";
import { since, dueLabel, isOverdue } from "../lib/time";
import { Sheet, statusPill } from "../components/bits";

function startOfDay(date = new Date()) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function startOfWeek(date = new Date()) {
  const value = startOfDay(date);
  value.setDate(value.getDate() - ((value.getDay() + 6) % 7));
  return value;
}

function requireResult(result, label) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data || [];
}

function WorkRow({ item, openItem, tone = "neutral" }) {
  return <button className={`row home-work-row home-tone-${tone}`} onClick={() => openItem(item.id)}>
    <div className="row-t">{item.title}</div>
    <div className="row-m">{item.ref} · {dueLabel(item.due_at)}</div>
    <div style={{ marginTop: 7 }}>{statusPill(item.status)}</div>
  </button>;
}

export default function Home({ me, session, setSession, openItem }) {
  const [items, setItems] = useState([]);
  const [completedThisWeek, setCompletedThisWeek] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [ask, setAsk] = useState(false);
  const [place, setPlace] = useState("office");
  const [sessionWorkItem, setSessionWorkItem] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [drill, setDrill] = useState(null);
  const [, tick] = useState(0);

  useEffect(() => { const timer = setInterval(() => tick((value) => value + 1), 30000); return () => clearInterval(timer); }, []);
  useEffect(() => { load(); }, [me.id, me.unit_id]);

  async function load() {
    setLoading(true);
    setError(null);
    setLoadFailed(false);
    try {
      const requests = [
        supabase.from("work_items")
          .select("id, ref, title, status, due_at, visibility, completed_at")
          .eq("assignee_id", me.id).not("status", "in", "(completed,self_certified,cancelled)")
          .order("due_at", { ascending: true, nullsFirst: false }),
        supabase.from("work_items")
          .select("id, ref, title, status, due_at, completed_at")
          .eq("assignee_id", me.id).in("kind", ["task", "deliverable"])
          .in("status", ["completed", "self_certified"])
          .gte("completed_at", startOfWeek().toISOString())
          .order("completed_at", { ascending: false }),
        supabase.from("alerts")
          .select("id, kind, subject_id, message, first_seen_at")
          .eq("for_profile_id", me.id).is("acknowledged_at", null),
        supabase.from("feedback_notes")
          .select("id,note,created_at,profiles!feedback_notes_author_id_fkey(full_name)")
          .eq("profile_id", me.id).order("created_at", { ascending: false }).limit(3),
      ];

      const [itemResult, completedResult, alertResult, feedbackResult] = await Promise.all(requests);
      setItems(requireResult(itemResult, "Your work"));
      setCompletedThisWeek(requireResult(completedResult, "Completed work"));
      setAlerts(requireResult(alertResult, "Alerts"));
      setFeedback(requireResult(feedbackResult, "Feedback"));
    } catch (err) {
      setLoadFailed(true);
      setError(err.message || "Home could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  const today = startOfDay();
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const soon = new Date(today); soon.setDate(soon.getDate() + 7);
  const weekStart = startOfWeek();
  const nextWeek = new Date(weekStart); nextWeek.setDate(nextWeek.getDate() + 7);
  const returned = items.filter((item) => item.status === "returned");
  const returnedIds = new Set(returned.map((item) => item.id));
  const visibleAlerts = alerts.filter((alert) => !alert.subject_id || !returnedIds.has(alert.subject_id));
  const dueToday = items.filter((item) => item.due_at && new Date(item.due_at) >= today && new Date(item.due_at) < tomorrow && !["waiting_on", "returned"].includes(item.status));
  const overdue = items.filter((item) => isOverdue(item.due_at) && item.status !== "waiting_on" && item.status !== "returned");
  const waiting = items.filter((item) => item.status === "waiting_on");
  const dueSoon = items.filter((item) => item.due_at && new Date(item.due_at) >= tomorrow && new Date(item.due_at) < soon && !["waiting_on", "returned"].includes(item.status));
  const upcoming = items.filter((item) => item.due_at && new Date(item.due_at) >= soon && !["waiting_on", "returned"].includes(item.status)).slice(0, 4);
  const dueThisWeek = items.filter((item) => item.due_at && new Date(item.due_at) >= weekStart && new Date(item.due_at) < nextWeek);
  const attention = returned.length + overdue.length + visibleAlerts.length;

  async function begin() {
    setBusy(true); setError(null);
    try {
      if (place === "elsewhere" && !sessionWorkItem) throw new Error("Choose the work you are doing off-site before you start.");
      const current = await startWork(me.org_id, me.id, place, place === "elsewhere" ? sessionWorkItem : null);
      setSession(current); setAsk(false); setSessionWorkItem("");
    }
    catch (err) { setError(err.message || "Work could not be started."); }
    finally { setBusy(false); }
  }
  async function stop() {
    if (!session) return;
    setBusy(true); setError(null);
    try { await endWork(session.id); setSession(null); }
    catch (err) { setError(err.message || "Work could not be ended."); }
    finally { setBusy(false); }
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const drillRows = drill?.rows || [];

  return <div className="body">
    <div style={{ paddingTop: 26 }}>
      <div className="eyebrow">{me.unit_name} · {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</div>
      <h1 className="h1" style={{ marginTop: 6 }}>{greeting}, {me.full_name.split(" ")[0]}</h1>
      <p className="screen-note">Start with anything that needs attention, then choose the next piece of work to move.</p>
    </div>

    <div className={`sess home-session ${session ? "live" : ""}`} style={{ marginTop: 18 }}>
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

    {error && <div className="flag flag-brick" style={{ marginTop: 14 }}><h4>{loadFailed ? "Home could not finish loading" : "Could not complete that"}</h4>{error}{loadFailed && <button className="btn btn-ghost btn-sm" style={{ marginTop: 10 }} onClick={load}>Try again</button>}</div>}
    {loading && <div className="spin">Loading Home...</div>}

    {!loading && !loadFailed && <div className="home-dashboard staff-home-dashboard">
      {attention > 0 && <section className="home-panel home-panel-priority" aria-labelledby="staff-attention-heading">
        <div className="home-section-head"><div><div className="home-kicker">Deal with these first</div><h2 id="staff-attention-heading">Needs attention</h2></div><span className="home-count home-count-attention">{attention}</span></div>
        {returned.map((item) => <WorkRow key={item.id} item={item} openItem={openItem} tone="danger" />)}
        {visibleAlerts.map((alert) => alert.subject_id
          ? <button key={alert.id} className="row home-work-row home-tone-attention" onClick={() => openItem(alert.subject_id)}>
              <div className="row-t">{alert.message}</div><div className="row-m">Since {new Date(alert.first_seen_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</div>
            </button>
          : <div key={alert.id} className="row home-tone-attention">
              <div className="row-t">{alert.message}</div><div className="row-m">Since {new Date(alert.first_seen_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</div>
            </div>)}
        {overdue.map((item) => <WorkRow key={item.id} item={item} openItem={openItem} tone="danger" />)}
      </section>}

      <section className="home-panel home-panel-pulse" aria-labelledby="staff-today-heading">
        <div className="home-section-head"><div><div className="home-kicker">Current focus</div><h2 id="staff-today-heading">Today</h2></div><span className="home-count">{dueToday.length}</span></div>
        {dueToday.length ? dueToday.map((item) => <WorkRow key={item.id} item={item} openItem={openItem} tone="info" />) : <div className="home-quiet">No work is due today.</div>}
      </section>

      {dueSoon.length > 0 && <section className="home-panel" aria-labelledby="staff-soon-heading">
        <div className="home-section-head"><div><div className="home-kicker">Next seven days</div><h2 id="staff-soon-heading">Due soon</h2></div><span className="home-count">{dueSoon.length}</span></div>
        {dueSoon.map((item) => <WorkRow key={item.id} item={item} openItem={openItem} tone="info" />)}
      </section>}

      {waiting.length > 0 && <section className="home-panel home-panel-waiting" aria-labelledby="staff-waiting-heading">
        <div className="home-section-head"><div><div className="home-kicker">Paused dependencies</div><h2 id="staff-waiting-heading">Waiting on</h2></div><span className="home-count">{waiting.length}</span></div>
        {waiting.map((item) => <WorkRow key={item.id} item={item} openItem={openItem} tone="attention" />)}
      </section>}

      {feedback.length > 0 && <section className="home-panel" aria-labelledby="staff-feedback-heading">
        <div className="home-section-head"><div><div className="home-kicker">Visible to you</div><h2 id="staff-feedback-heading">Recent feedback</h2></div></div>
        {feedback.map((note) => <div key={note.id} className="row home-feedback-row">
          <div className="row-t">{note.profiles?.full_name || "Manager"}</div><div className="row-m">{new Date(note.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</div><div className="row-note">{note.note}</div>
        </div>)}
      </section>}

      <section className="home-panel home-panel-week" aria-labelledby="staff-week-heading">
        {upcoming.length > 0 && <>
          <div className="home-section-head"><div><div className="home-kicker">Further ahead</div><h2 id="staff-upcoming-heading">Upcoming</h2></div></div>
          {upcoming.map((item) => <WorkRow key={item.id} item={item} openItem={openItem} />)}
        </>}
        <div className={`home-subhead ${upcoming.length ? "home-subhead-spaced" : ""}`} id="staff-week-heading">This week</div>
        <div className="home-stat-grid">
          <button className="home-stat home-tone-info" onClick={() => setDrill({ title: "Work due this week", rows: dueThisWeek })}><b>{dueThisWeek.length}</b><span>Due</span></button>
          <button className="home-stat home-tone-success" onClick={() => setDrill({ title: "Work completed this week", rows: completedThisWeek })}><b>{completedThisWeek.length}</b><span>Completed</span></button>
          <button className="home-stat home-tone-danger" onClick={() => setDrill({ title: "Overdue work", rows: overdue })}><b>{overdue.length}</b><span>Overdue</span></button>
        </div>
        {drill && <div className="home-drill"><div className="home-drill-head"><strong>{drill.title}</strong><span>{drillRows.length}</span></div>
          {drillRows.length ? drillRows.map((item) => <WorkRow key={item.id} item={item} openItem={openItem} />) : <div className="home-quiet">No work in this group.</div>}
        </div>}
      </section>
    </div>}

    {ask && <Sheet onClose={() => setAsk(false)}>
      <div className="h2">Where are you working?</div>
      <p className="screen-note" style={{ marginBottom: 10 }}>We record where you start. We do not track you during the day.</p>
      <button className="opt" onClick={() => { setPlace("office"); setSessionWorkItem(""); }}><span className={`rd ${place === "office" ? "on" : ""}`} /> At the office</button>
      <button className="opt" onClick={() => setPlace("elsewhere")}><span className={`rd ${place === "elsewhere" ? "on" : ""}`} /> Somewhere else</button>
      {place === "elsewhere" && <>
        <select className="field" aria-label="Work being done off-site" value={sessionWorkItem} onChange={(event) => setSessionWorkItem(event.target.value)}>
          <option value="">Choose the work you are doing</option>
          {items.filter((item) => !["waiting_on", "returned"].includes(item.status)).map((item) => <option key={item.id} value={item.id}>{item.ref} · {item.title}</option>)}
        </select>
        <div className="hint">The location is attached to this work when you start. CEAC OS does not track you during the day.</div>
      </>}
      <button className="btn" style={{ marginTop: 16 }} onClick={begin} disabled={busy || (place === "elsewhere" && !sessionWorkItem)}>{busy ? "Starting..." : "Start work"}</button>
    </Sheet>}
  </div>;
}
