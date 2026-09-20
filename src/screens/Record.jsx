import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function accraDateKey(value) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Accra", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date(value));
  const pick = (type) => parts.find((part) => part.type === type)?.value;
  return `${pick("year")}-${pick("month")}-${pick("day")}`;
}

function when(value) {
  return new Date(value).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function kindLabel(value) {
  return value === "meeting_outcome" ? "Meeting outcome" : value ? value[0].toUpperCase() + value.slice(1) : "Work";
}

export default function Record({ me, openItem }) {
  const [s, setS] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [view, setView] = useState("completed");
  const [error, setError] = useState(null);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  useEffect(() => { load(); }, [me.id, month]);
  async function load() {
    setError(null);
    setS(null);
    const [year, monthNumber] = month.split("-").map(Number);
    const monthStart = new Date(year, monthNumber - 1, 1);
    const nextMonth = new Date(year, monthNumber, 1);
    const itemResult = await supabase.from("work_items")
      .select("id, ref, title, kind, status, origin, due_at, completed_at, first_time_approved, created_at")
      .eq("assignee_id", me.id);
    const sessionResult = await supabase.from("work_sessions")
      .select("id, started_at, ended_at, last_confirmed_at, place, end_reason, corrected_at")
      .eq("profile_id", me.id).gte("started_at", monthStart.toISOString()).lt("started_at", nextMonth.toISOString()).order("started_at", { ascending: false });
    const blockerResult = await supabase.from("blockers")
      .select("id, work_item_id, party_text, since, note, state, response_note, resolved_at, resolution_note, created_at, work_items(ref,title)")
      .eq("claimed_by", me.id).gte("created_at", monthStart.toISOString()).lt("created_at", nextMonth.toISOString()).order("created_at", { ascending: false });
    const feedbackResult = await supabase.from("feedback_notes")
      .select("id,note,created_at,profiles!feedback_notes_author_id_fkey(full_name)")
      .eq("profile_id", me.id).order("created_at", { ascending: false });
    const submissionResult = await supabase.from("submissions")
      .select("id, work_item_id, submitted_at, note, reviews(id, decision, comment, reviewed_at), work_items(ref,title,kind)")
      .eq("profile_id", me.id).gte("submitted_at", monthStart.toISOString()).lt("submitted_at", nextMonth.toISOString()).order("submitted_at", { ascending: false });
    const failed = [itemResult, sessionResult, blockerResult, feedbackResult, submissionResult].find((result) => result.error);
    if (failed) { setError(failed.error.message); return; }
    const items = itemResult.data || [];
    const sessions = sessionResult.data || [];
    const blocked = blockerResult.data || [];
    const notes = feedbackResult.data || [];
    const submissions = submissionResult.data || [];
    const sessionEventResult = sessions.length ? await supabase.from("work_session_events")
      .select("id, work_session_id, action, effective_at, note, created_at")
      .in("work_session_id", sessions.map((entry) => entry.id)).order("created_at", { ascending: false })
      : { data: [], error: null };
    if (sessionEventResult.error) { setError(sessionEventResult.error.message); return; }
    const sessionEvents = sessionEventResult.data || [];
    setFeedback(notes || []);
    const done = (items || []).filter((i) => ["task", "deliverable"].includes(i.kind)
      && ["completed", "self_certified"].includes(i.status)
      && i.completed_at
      && new Date(i.completed_at) >= monthStart
      && new Date(i.completed_at) < nextMonth);
    const dueDone = done.filter((i) => i.due_at && i.completed_at);
    const reviewedDone = done.filter((i) => i.first_time_approved !== null);
    const todayKey = accraDateKey(new Date());
    const sessionsNeedingRecovery = sessions.filter((entry) => !entry.ended_at
      && accraDateKey(entry.last_confirmed_at || entry.started_at) < todayKey);
    const minutes = (sessions || []).reduce((sum, x) => {
      if (!x.ended_at && accraDateKey(x.last_confirmed_at || x.started_at) < todayKey) return sum;
      const end = x.ended_at ? new Date(x.ended_at).getTime() : Date.now();
      return sum + Math.max(0, (end - new Date(x.started_at).getTime()) / 60000);
    }, 0);
    setS({
      completed: done.length,
      assigned: done.filter((i) => i.origin === "assigned").length,
      self: done.filter((i) => i.origin === "self_created").length,
      onTime: dueDone.filter((i) => new Date(i.completed_at) <= new Date(i.due_at)).length,
      dueCompleted: dueDone.length,
      firstTime: reviewedDone.filter((i) => i.first_time_approved === true).length,
      reviewedCompleted: reviewedDone.length,
      blocked: blocked ? blocked.length : 0,
      days: new Set((sessions || []).map((x) => accraDateKey(x.started_at))).size,
      hours: Math.floor(minutes / 60), mins: Math.round(minutes % 60),
      office: (sessions || []).filter((x) => x.place === "office").length,
      sessionsNeedingRecovery: sessionsNeedingRecovery.length,
      completedItems: done.sort((left, right) => new Date(right.completed_at) - new Date(left.completed_at)),
      sessions: sessions.map((entry) => ({ ...entry, events: sessionEvents.filter((event) => event.work_session_id === entry.id) })),
      blockers: blocked,
      corrections: submissions.flatMap((submission) => (submission.reviews || [])
        .filter((review) => review.decision === "returned")
        .map((review) => ({ ...review, submission })))
        .sort((left, right) => new Date(right.reviewed_at) - new Date(left.reviewed_at)),
    });
  }
  if (!s) return error
    ? <div className="body"><div className="flag flag-brick" style={{ marginTop: 24 }}><h4>Could not load your record</h4>{error}</div></div>
    : <div className="spin">Loading...</div>;
  function Row({ l, v, onClick }) {
    const content = <>
      <span style={{ fontSize: 13.5, color: "var(--ink-soft)" }}>{l}</span>
      <span style={{ fontSize: 16, fontWeight: 600 }}>{v}</span>
    </>;
    if (onClick) return <button onClick={onClick} style={{ display: "flex", width: "100%", justifyContent: "space-between", alignItems: "baseline", padding: "11px 0", borderTop: "1px solid var(--line-soft)", textAlign: "left" }}>{content}</button>;
    return (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "11px 0", borderTop: "1px solid var(--line-soft)" }}>
        {content}
      </div>);
  }
  const [year, monthNumber] = month.split("-").map(Number);
  const monthLabel = new Date(year, monthNumber - 1, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  return (
    <div className="body">
      <div style={{ paddingTop: 26 }}>
        <h1 className="h1">My record</h1>
        <p className="screen-note">Your own evidence, built from work you actually did. Nobody is compared with anybody.</p>
        <input className="field" type="month" aria-label="Record month" value={month} onChange={(event) => setMonth(event.target.value)} style={{ maxWidth: 190, marginTop: 12 }} />
      </div>
      <div className="split" style={{ marginTop: 4 }}>
        <div className="main-col">
          <div className="sec"><span>Work · {monthLabel}</span></div>
          <div className="card" style={{ padding: "4px 15px" }}>
            <Row l="Finished" v={s.completed} onClick={() => setView("completed")} />
            <Row l="  given to you" v={s.assigned} onClick={() => setView("assigned")} />
            <Row l="  you added yourself" v={s.self} onClick={() => setView("self")} />
            <Row l="On time where a due date exists" v={s.onTime + " of " + s.dueCompleted} onClick={() => setView("completed")} />
            <Row l="Approved first time where reviewed" v={s.firstTime + " of " + s.reviewedCompleted} onClick={() => setView("completed")} />
            <Row l="Times you were stuck on someone" v={s.blocked} onClick={() => setView("blockers")} />
          </div>
          <div className="sec"><span>{view === "blockers" ? "Blocker history" : view === "corrections" ? "Returned and corrected" : "Completed work timeline"}</span></div>
          {view !== "blockers" && view !== "corrections" && s.completedItems
            .filter((item) => view === "assigned" ? item.origin === "assigned" : view === "self" ? item.origin === "self_created" : true)
            .map((item) => <button key={item.id} className="row" style={{ width: "100%", textAlign: "left" }} onClick={() => openItem?.(item.id)}>
              <div className="row-t">{item.ref} · {item.title}</div>
              <div className="row-m">{kindLabel(item.kind)} · completed {new Date(item.completed_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</div>
              <div className="row-note">{item.due_at ? new Date(item.completed_at) <= new Date(item.due_at) ? "Completed on time" : "Completed after its due date" : "No due date was recorded"}</div>
            </button>)}
          {view !== "blockers" && view !== "corrections" && s.completedItems.filter((item) => view === "assigned" ? item.origin === "assigned" : view === "self" ? item.origin === "self_created" : true).length === 0 && <div className="card small">No matching completed Task or Deliverable is recorded for this month.</div>}
          {view === "blockers" && s.blockers.map((blocker) => <button key={blocker.id} className="row" style={{ width: "100%", textAlign: "left" }} onClick={() => openItem?.(blocker.work_item_id)}>
            <div className="row-t">{blocker.work_items?.ref || "Work"} · {blocker.party_text}</div>
            <div className="row-m">{blocker.state} · since {new Date(`${blocker.since}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</div>
            <div className="row-note">{blocker.resolution_note || blocker.response_note || blocker.note || "No additional note."}</div>
          </button>)}
          {view === "blockers" && s.blockers.length === 0 && <div className="card small">No blocker was raised in this month.</div>}
          {view === "corrections" && s.corrections.map((entry) => <button key={entry.id} className="row" style={{ width: "100%", textAlign: "left" }} onClick={() => openItem?.(entry.submission.work_item_id)}>
            <div className="row-t">{entry.submission.work_items?.ref} · {entry.submission.work_items?.title}</div>
            <div className="row-m">Returned {when(entry.reviewed_at)}</div>
            <div className="row-note">{entry.comment || "No return comment was recorded."}</div>
          </button>)}
          {view === "corrections" && s.corrections.length === 0 && <div className="card small">No returned submission is recorded for this month.</div>}
          <button className="btn btn-ghost btn-sm" style={{ marginTop: 10 }} onClick={() => setView(view === "corrections" ? "completed" : "corrections")}>{view === "corrections" ? "Show completed work" : "Show returned and corrected work"}</button>
        </div>
        <div className="side-col">
          <div className="sec"><span>Feedback from your manager</span><span>{feedback.length}</span></div>
          {feedback.map((note) => <div className="row" key={note.id}>
            <div className="row-t">{note.profiles?.full_name || "Manager"}</div>
            <div className="row-m">{new Date(note.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</div>
            <div className="row-note">{note.note}</div>
          </div>)}
          {feedback.length === 0 && <div className="card small">No manager feedback has been recorded for you yet.</div>}

          <div className="sec"><span>Time · {monthLabel}</span></div>
          <div className="card" style={{ padding: "4px 15px" }}>
            <Row l="Days with a work session" v={s.days} />
            <Row l="Recorded session time" v={s.hours + "h " + s.mins + "m"} />
            <Row l="Sessions started at the office" v={s.office} />
            {s.sessionsNeedingRecovery > 0 && <Row l="Sessions waiting for correction" v={s.sessionsNeedingRecovery} />}
          </div>
          <p className="small" style={{ marginTop: 10, lineHeight: 1.5 }}>
            Hours are a record of activity, not a basis for pay. Your location is recorded once,
            when you tap Start work, and not again until the next time you start.
          </p>
          <div className="sec"><span>Session history</span><span>{s.sessions.length}</span></div>
          {s.sessions.map((entry) => <div key={entry.id} className="row">
            <div className="row-t">{when(entry.started_at)}</div>
            <div className="row-m">{entry.place === "office" ? "Started at the office" : "Started elsewhere"} · {entry.ended_at ? `ended ${when(entry.ended_at)}` : "still open"}</div>
            {entry.end_reason && <div className="row-note">End reason: {entry.end_reason}</div>}
            {entry.events.map((event) => <div className="row-note" key={event.id}>{kindLabel(event.action)} {when(event.created_at)}{event.effective_at ? ` · effective ${when(event.effective_at)}` : ""}{event.note ? ` · ${event.note}` : ""}</div>)}
          </div>)}
          {s.sessions.length === 0 && <div className="card small">No work session was recorded in this month.</div>}
        </div>
      </div>
    </div>);
}
