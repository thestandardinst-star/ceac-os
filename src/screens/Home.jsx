import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { startWork, endWork, reconcileWorkSession } from "../lib/session";
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

function accraDateKey(value) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Accra", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date(value));
  const pick = (type) => parts.find((part) => part.type === type)?.value;
  return `${pick("year")}-${pick("month")}-${pick("day")}`;
}

function nextBirthday(value) {
  const [, month, day] = String(value).slice(0, 10).split("-").map(Number);
  const today = startOfDay();
  const date = new Date(today.getFullYear(), month - 1, day);
  if (date < today) date.setFullYear(date.getFullYear() + 1);
  return date;
}

function WorkRow({ item, openItem, tone = "neutral" }) {
  return <button className={`row home-work-row home-tone-${tone}`} onClick={() => openItem(item.id)}>
    <div className="row-t">{item.title}</div>
    <div className="row-m">{item.ref} · {dueLabel(item.due_at)}</div>
    <div style={{ marginTop: 7 }}>{statusPill(item.status)}</div>
  </button>;
}

export default function Home({ me, session, setSession, openItem, openAnnouncements }) {
  const [items, setItems] = useState([]);
  const [completedThisWeek, setCompletedThisWeek] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [birthdays, setBirthdays] = useState([]);
  const [upcomingLeave, setUpcomingLeave] = useState([]);
  const [leaveUpdates, setLeaveUpdates] = useState([]);
  const [ask, setAsk] = useState(false);
  const [place, setPlace] = useState("office");
  const [sessionWorkItem, setSessionWorkItem] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [drill, setDrill] = useState(null);
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [recoveryEndedAt, setRecoveryEndedAt] = useState("");
  const [recoveryNote, setRecoveryNote] = useState("");
  const [eventDetail, setEventDetail] = useState(null);
  const [, tick] = useState(0);

  useEffect(() => { const timer = setInterval(() => tick((value) => value + 1), 30000); return () => clearInterval(timer); }, []);
  useEffect(() => { load(); }, [me.id, me.unit_id]);

  async function load() {
    setLoading(true);
    setError(null);
    setLoadFailed(false);
    try {
      const rangeStart = startOfDay();
      const rangeEnd = new Date(rangeStart); rangeEnd.setDate(rangeEnd.getDate() + 14);
      const recentStart = new Date(rangeStart); recentStart.setDate(recentStart.getDate() - 14);
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
        supabase.from("announcements")
          .select("id,title,priority,requires_acknowledgement,published_at,profiles!announcements_author_id_fkey(full_name),announcement_receipts(profile_id,read_at,acknowledged_at)")
          .eq("status", "published").order("published_at", { ascending: false }).limit(2),
        supabase.from("ministry_events")
          .select("id,title,kind,scope,unit_id,starts_at,ends_at,all_day,location,notes,cancelled,ministry_event_units(unit_id,note)")
          .lte("starts_at", rangeEnd.toISOString()).order("starts_at"),
        supabase.from("unit_memberships")
          .select("profile_id,profiles!unit_memberships_profile_id_fkey(id,full_name,birthday)")
          .eq("unit_id", me.unit_id),
        supabase.from("leave_requests")
          .select("id,kind,start_date,end_date,status,decided_at,decision_note")
          .eq("profile_id", me.id).order("requested_at", { ascending: false }),
      ];

      const [itemResult, completedResult, alertResult, feedbackResult, announcementResult, eventResult, memberResult, leaveResult] = await Promise.all(requests);
      setItems(requireResult(itemResult, "Your work"));
      setCompletedThisWeek(requireResult(completedResult, "Completed work"));
      setAlerts(requireResult(alertResult, "Alerts"));
      setFeedback(requireResult(feedbackResult, "Feedback"));
      setAnnouncements(requireResult(announcementResult, "Announcements"));
      const events = requireResult(eventResult, "Coming events").filter((event) => {
        const stillCurrent = new Date(event.ends_at || event.starts_at) >= rangeStart;
        const relevant = event.scope === "church" || event.unit_id === me.unit_id
          || (event.ministry_event_units || []).some((unit) => unit.unit_id === me.unit_id);
        return stillCurrent && relevant;
      });
      setCalendarEvents(events.slice(0, 4));
      const birthdayEnd = new Date(rangeStart); birthdayEnd.setDate(birthdayEnd.getDate() + 7);
      setBirthdays(requireResult(memberResult, "Birthdays")
        .map((member) => member.profiles).filter((profile) => profile?.birthday)
        .map((profile) => ({ ...profile, nextBirthday: nextBirthday(profile.birthday) }))
        .filter((profile) => profile.nextBirthday <= birthdayEnd)
        .sort((left, right) => left.nextBirthday - right.nextBirthday));
      const leaveRows = requireResult(leaveResult, "Leave");
      setUpcomingLeave(leaveRows.filter((request) => request.status === "approved"
        && new Date(`${request.start_date}T00:00:00`) >= rangeStart
        && new Date(`${request.start_date}T00:00:00`) <= rangeEnd).slice(0, 2));
      setLeaveUpdates(leaveRows.filter((request) => request.decided_at
        && new Date(request.decided_at) >= recentStart).slice(0, 2));
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
  const dueThisWeek = items.filter((item) => item.due_at && new Date(item.due_at) >= weekStart && new Date(item.due_at) < nextWeek);
  const activeWork = items.filter((item) => item.status === "in_progress" && !dueToday.some((due) => due.id === item.id)).slice(0, 3);
  const announcementAttention = announcements.filter((announcement) => announcement.requires_acknowledgement
    && !(announcement.announcement_receipts || []).some((receipt) => receipt.profile_id === me.id && receipt.acknowledged_at));
  const attention = returned.length + overdue.length + visibleAlerts.length + announcementAttention.length;
  const staleSession = Boolean(session
    && accraDateKey(session.last_confirmed_at || session.started_at) < accraDateKey(new Date()));

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
  async function continueRecoveredSession() {
    if (!session) return;
    setBusy(true); setError(null);
    try {
      const current = await reconcileWorkSession(session.id, "continue");
      setSession(current);
    } catch (err) { setError(err.message || "The work session could not be confirmed."); }
    finally { setBusy(false); }
  }
  async function closeRecoveredSession() {
    if (!session || !recoveryEndedAt) return;
    setBusy(true); setError(null);
    try {
      await reconcileWorkSession(session.id, "close", new Date(recoveryEndedAt).toISOString(), recoveryNote.trim() || null);
      setSession(null); setRecoveryOpen(false); setRecoveryEndedAt(""); setRecoveryNote("");
    } catch (err) { setError(err.message || "The work session could not be reconciled."); }
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
        <div className="s-v">{session ? staleSession ? "Needs reconciliation" : since(session.started_at) : "Start to send work in"}</div>
      </div>
      {session
        ? staleSession
          ? <button className="btn btn-ghost btn-sm" onClick={() => setRecoveryOpen(true)} disabled={busy}>Review session</button>
          : <button className="btn btn-ghost btn-sm" onClick={stop} disabled={busy}>End work</button>
        : <button className="btn btn-sm" onClick={() => setAsk(true)} disabled={busy}>Start work</button>}
    </div>

    {staleSession && <div className="flag flag-amber" style={{ marginTop: 14 }}>
      <h4>You still have a work session open from an earlier day</h4>
      CEAC OS has paused the running duration until you confirm what happened. It will not record continuous overnight work by itself.
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
        <button className="btn btn-sm" onClick={continueRecoveredSession} disabled={busy}>{busy ? "Saving..." : "Continue this session"}</button>
        <button className="btn btn-ghost btn-sm" onClick={() => setRecoveryOpen(true)} disabled={busy}>Close at the actual time</button>
      </div>
    </div>}

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
        {announcementAttention.map((announcement) => <button key={`ack-${announcement.id}`} className="row home-work-row home-tone-attention" onClick={openAnnouncements}>
          <div className="row-t">Acknowledge: {announcement.title}</div><div className="row-m">Organisation announcement</div>
        </button>)}
      </section>}

      <section className="home-panel home-panel-pulse" aria-labelledby="staff-today-heading">
        <div className="home-section-head"><div><div className="home-kicker">Current focus</div><h2 id="staff-today-heading">Today</h2></div><span className="home-count">{dueToday.length}</span></div>
        {dueToday.length ? dueToday.map((item) => <WorkRow key={item.id} item={item} openItem={openItem} tone="info" />) : <div className="home-quiet">No work is due today.</div>}
        {activeWork.length > 0 && <><div className="home-subhead">In progress</div>{activeWork.map((item) => <WorkRow key={`active-${item.id}`} item={item} openItem={openItem} />)}</>}
      </section>

      {(dueSoon.length > 0 || calendarEvents.length > 0 || birthdays.length > 0 || upcomingLeave.length > 0) && <section className="home-panel" aria-labelledby="staff-soon-heading">
        <div className="home-section-head"><div><div className="home-kicker">Next few days</div><h2 id="staff-soon-heading">Coming up</h2></div></div>
        {dueSoon.map((item) => <WorkRow key={item.id} item={item} openItem={openItem} tone="info" />)}
        {calendarEvents.map((event) => <button key={event.id} className="row home-work-row" onClick={() => setEventDetail(event)}>
          <div className="row-t">{event.cancelled ? "Cancelled · " : ""}{event.title}</div>
          <div className="row-m">{new Date(event.starts_at).toLocaleString("en-GB", { timeZone: "Africa/Accra", day: "numeric", month: "short", hour: event.all_day ? undefined : "2-digit", minute: event.all_day ? undefined : "2-digit" })}{event.location ? ` · ${event.location}` : ""}</div>
        </button>)}
        {birthdays.map((profile) => <div className="row" key={`birthday-${profile.id}`}><div className="row-t">{profile.full_name}'s birthday</div><div className="row-m">{profile.nextBirthday.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}</div></div>)}
        {upcomingLeave.map((request) => <div className="row" key={`leave-${request.id}`}><div className="row-t">Your approved {request.kind} leave begins</div><div className="row-m">{new Date(`${request.start_date}T00:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}</div></div>)}
      </section>}

      {waiting.length > 0 && <section className="home-panel home-panel-waiting" aria-labelledby="staff-waiting-heading">
        <div className="home-section-head"><div><div className="home-kicker">Paused dependencies</div><h2 id="staff-waiting-heading">Waiting on</h2></div><span className="home-count">{waiting.length}</span></div>
        {waiting.map((item) => <WorkRow key={item.id} item={item} openItem={openItem} tone="attention" />)}
      </section>}

      {(feedback.length > 0 || completedThisWeek.length > 0 || leaveUpdates.length > 0) && <section className="home-panel" aria-labelledby="staff-feedback-heading">
        <div className="home-section-head"><div><div className="home-kicker">What changed</div><h2 id="staff-feedback-heading">Recent movement</h2></div></div>
        {feedback.map((note) => <div key={note.id} className="row home-feedback-row">
          <div className="row-t">{note.profiles?.full_name || "Manager"}</div><div className="row-m">{new Date(note.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</div><div className="row-note">{note.note}</div>
        </div>)}
        {completedThisWeek.slice(0, 3).map((item) => <WorkRow key={`moved-${item.id}`} item={item} openItem={openItem} tone="success" />)}
        {leaveUpdates.map((request) => <div key={`leave-update-${request.id}`} className="row"><div className="row-t">Leave request {request.status}</div><div className="row-m">{request.kind} leave · {request.start_date} to {request.end_date}</div>{request.decision_note && <div className="row-note">{request.decision_note}</div>}</div>)}
      </section>}

      {announcements.length > 0 && <section className="home-panel" aria-labelledby="staff-announcements-heading">
        <div className="home-section-head"><div><div className="home-kicker">Organisation context</div><h2 id="staff-announcements-heading">Announcements</h2></div><button className="btn btn-ghost btn-sm" onClick={openAnnouncements}>See all</button></div>
        {announcements.map((announcement) => {
          const receipt = (announcement.announcement_receipts || []).find((entry) => entry.profile_id === me.id);
          return <button key={announcement.id} className={`row home-work-row ${!receipt ? "home-tone-info" : ""}`} onClick={openAnnouncements}>
            <div className="row-t">{!receipt ? "New · " : ""}{announcement.title}</div>
            <div className="row-m">{announcement.priority !== "normal" ? `${announcement.priority} · ` : ""}{announcement.profiles?.full_name || "CEAC"}</div>
            {announcement.requires_acknowledgement && !receipt?.acknowledged_at && <div className="row-note">Acknowledgement required</div>}
          </button>;
        })}
      </section>}

      <section className="home-panel home-panel-week" aria-labelledby="staff-week-heading">
        <div className="home-subhead" id="staff-week-heading">This week</div>
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
          {items.filter((item) => ["not_started", "in_progress", "returned"].includes(item.status)).map((item) => <option key={item.id} value={item.id}>{item.ref} · {item.title}</option>)}
        </select>
        <div className="hint">The location is attached to this work when you start. CEAC OS does not track you during the day.</div>
      </>}
      <button className="btn" style={{ marginTop: 16 }} onClick={begin} disabled={busy || (place === "elsewhere" && !sessionWorkItem)}>{busy ? "Starting..." : "Start work"}</button>
    </Sheet>}
    {recoveryOpen && <Sheet onClose={() => !busy && setRecoveryOpen(false)}>
      <div className="h2">Close the earlier work session</div>
      <p className="screen-note">Enter when you actually stopped. The original start, this correction and who made it remain in the history.</p>
      <label className="label" htmlFor="recovery-ended-at">Actual end time</label>
      <input id="recovery-ended-at" className="field" type="datetime-local" value={recoveryEndedAt} onChange={(event) => setRecoveryEndedAt(event.target.value)} />
      <label className="label" htmlFor="recovery-note">Correction note (optional)</label>
      <textarea id="recovery-note" className="field" rows={3} value={recoveryNote} onChange={(event) => setRecoveryNote(event.target.value)} placeholder="Anything useful about this correction" />
      <button className="btn" style={{ marginTop: 14 }} onClick={closeRecoveredSession} disabled={busy || !recoveryEndedAt}>{busy ? "Saving..." : "Close and record correction"}</button>
    </Sheet>}
    {eventDetail && <Sheet onClose={() => setEventDetail(null)}>
      <div className="eyebrow">{eventDetail.kind.replaceAll("_", " ")}</div>
      <div className="h2" style={{ marginTop: 5 }}>{eventDetail.title}</div>
      {eventDetail.cancelled && <div className="flag flag-brick" style={{ marginTop: 12 }}><h4>Cancelled</h4>This stays visible because people may already have planned around it.</div>}
      <div className="card" style={{ marginTop: 14 }}>
        <div className="row-m">{new Date(eventDetail.starts_at).toLocaleString("en-GB", { timeZone: "Africa/Accra", day: "numeric", month: "short", year: "numeric", hour: eventDetail.all_day ? undefined : "2-digit", minute: eventDetail.all_day ? undefined : "2-digit" })}</div>
        {eventDetail.location && <div className="row-note">Location: {eventDetail.location}</div>}
        {eventDetail.notes && <div className="row-note">{eventDetail.notes}</div>}
      </div>
    </Sheet>}
  </div>;
}
