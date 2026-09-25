import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { dateOnly, dueLabel, isOverdue } from "../lib/time";
import { Pill, statusPill, ProductNotice, LoadingState, FieldGroup } from "../components/bits";
import { humanError } from "../lib/productLanguage";

function requireResult(result, label) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data || [];
}

function durationLabel(session) {
  if (!session.ended_at) return "Still open";
  const minutes = Math.max(0, Math.round((new Date(session.ended_at) - new Date(session.started_at)) / 60000));
  const hours = Math.floor(minutes / 60);
  return hours ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
}

function formatObjectiveStatus(status) {
  return ({ on_track: "On track", at_risk: "At risk", met: "Met", partly_met: "Partly met", not_met: "Not met" })[status] || status;
}

function WorkRow({ item, openItem }) {
  return <button className="row" onClick={() => openItem(item.id)}>
    <div className="row-t">{item.title}</div>
    <div className="row-m">{item.ref} · {dueLabel(item.due_at)}</div>
    <div style={{ marginTop: 7 }}>{statusPill(item.status)}</div>
  </button>;
}

export default function PersonDetail({ me, profileId, focus, openItem, openProject, back }) {
  const [person, setPerson] = useState(null);
  const [items, setItems] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [objectives, setObjectives] = useState([]);
  const [objectiveTasks, setObjectiveTasks] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [subTeams, setSubTeams] = useState([]);
  const [periodDays, setPeriodDays] = useState(30);
  const [currentFilter, setCurrentFilter] = useState(focus === "overdue" ? "overdue" : focus === "review" ? "in_review" : "active");
  const [showCompleted, setShowCompleted] = useState(false);
  const [showReviewed, setShowReviewed] = useState(false);
  const [openObjective, setOpenObjective] = useState(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setCurrentFilter(focus === "overdue" ? "overdue" : focus === "review" ? "in_review" : "active");
    if (focus === "completed") setShowCompleted(true);
  }, [focus, profileId]);
  useEffect(() => { load(); }, [profileId, periodDays, me.unit_id]);
  useEffect(() => {
    if (!person || !focus) return;
    const section = focus === "sessions" ? "sessions" : focus === "submitted" ? "submissions" : focus === "completed" ? "completed" : "current-work";
    document.getElementById(section)?.scrollIntoView({ block: "start" });
  }, [person, focus]);

  async function load() {
    setError(null);
    setPerson(null);
    try {
      const membershipResult = await supabase.from("unit_memberships")
        .select("id, role, profile_id, profiles!unit_memberships_profile_id_fkey(id, full_name, email, job_title)")
        .eq("unit_id", me.unit_id).eq("profile_id", profileId).maybeSingle();
      if (membershipResult.error) throw membershipResult.error;
      if (!membershipResult.data) throw new Error("This person is not in your current unit.");
      setPerson(membershipResult.data);

      const since = new Date(); since.setDate(since.getDate() - periodDays);
      const [workResult, sessionResult, submissionResult, feedbackResult, subTeamResult] = await Promise.all([
        supabase.from("work_items")
          .select("id, ref, title, kind, status, due_at, original_due_at, completed_at, first_time_approved, objective_id, visibility")
          .eq("unit_id", me.unit_id).eq("assignee_id", profileId).neq("visibility", "private")
          .order("due_at", { ascending: true, nullsFirst: false }),
        supabase.from("work_sessions")
          .select("id, place, started_at, ended_at, end_reason")
          .eq("profile_id", profileId).gte("started_at", since.toISOString()).order("started_at", { ascending: false }),
        supabase.from("submissions")
          .select("id, submitted_at, note, work_items!inner(id, ref, title, unit_id)")
          .eq("profile_id", profileId).eq("work_items.unit_id", me.unit_id)
          .gte("submitted_at", since.toISOString()).order("submitted_at", { ascending: false }),
        supabase.from("feedback_notes")
          .select("id, note, kind, occurred_on, created_at, profiles!feedback_notes_author_id_fkey(full_name)")
          .eq("profile_id", profileId).order("created_at", { ascending: false }),
        supabase.from("sub_team_members").select("sub_team_id, sub_teams!inner(name, unit_id)")
          .eq("profile_id", profileId).eq("sub_teams.unit_id", me.unit_id),
      ]);
      const work = requireResult(workResult, "Work");
      setItems(work);
      setSessions(requireResult(sessionResult, "Attendance records"));
      setSubmissions(requireResult(submissionResult, "Submissions"));
      setFeedback(requireResult(feedbackResult, "Feedback"));
      setSubTeams(requireResult(subTeamResult, "Parts of the team").map((row) => row.sub_teams?.name).filter(Boolean));

      const objectiveIds = [...new Set(work.map((item) => item.objective_id).filter(Boolean))];
      if (objectiveIds.length) {
        const [objectiveResult, taskResult] = await Promise.all([
          supabase.from("objectives")
            .select("id, project_id, ref, name, statement, status, target_value, target_unit, achieved_value, projects(name)")
            .eq("unit_id", me.unit_id).in("id", objectiveIds).order("ref"),
          supabase.from("work_items")
            .select("id, ref, title, status, due_at, objective_id, kind")
            .eq("unit_id", me.unit_id).in("objective_id", objectiveIds).eq("kind", "task").neq("visibility", "private"),
        ]);
        setObjectives(requireResult(objectiveResult, "Objectives"));
        setObjectiveTasks(requireResult(taskResult, "Objective tasks"));
      } else {
        setObjectives([]); setObjectiveTasks([]);
      }
    } catch (err) { setError(humanError(err, "This person could not be loaded.")); }
  }

  async function addFeedback() {
    setBusy(true); setError(null);
    try {
      const { error: insertError } = await supabase.rpc("record_performance_feedback", {
        p_profile_id: profileId,
        p_kind: "observation",
        p_note: note.trim(),
        p_occurred_on: new Date().toISOString().slice(0, 10),
        p_work_item_id: null,
        p_project_id: null,
        p_strategy_node_id: null,
      });
      if (insertError) throw insertError;
      setNote(""); await load();
    } catch (err) { setError(humanError(err, "The feedback could not be saved.")); }
    finally { setBusy(false); }
  }

  if (!person) return <div className="body manager-person-detail"><button className="back" onClick={back}>← Team</button>{error ? <ProductNotice tone="error" title="Could not open person detail">{error}</ProductNotice> : <LoadingState label="Loading person…" />}</div>;

  const periodStart = new Date(); periodStart.setDate(periodStart.getDate() - periodDays);
  const current = items.filter((item) => !["completed", "self_certified", "cancelled"].includes(item.status));
  const currentGroups = {
    active: current.filter((item) => ["not_started", "in_progress"].includes(item.status)),
    waiting_on: current.filter((item) => item.status === "waiting_on"),
    returned: current.filter((item) => item.status === "returned"),
    overdue: current.filter((item) => isOverdue(item.due_at) && item.status !== "waiting_on"),
    in_review: current.filter((item) => item.status === "in_review"),
  };
  const completed = items.filter((item) => ["task", "deliverable"].includes(item.kind) && ["completed", "self_certified"].includes(item.status) && item.completed_at && new Date(item.completed_at) >= periodStart);
  const completedWithDue = completed.filter((item) => item.due_at);
  const onTime = completedWithDue.filter((item) => new Date(item.completed_at) <= new Date(item.due_at));
  const reviewed = completed.filter((item) => item.first_time_approved !== null);
  const needsSupport = new Set([
    ...currentGroups.waiting_on,
    ...currentGroups.returned,
    ...currentGroups.overdue,
  ].map((item) => item.id)).size;
  const filters = [["active", "Active"], ["waiting_on", "Waiting"], ["returned", "Returned"], ["overdue", "Overdue"], ["in_review", "Awaiting review"]];

  return <div className="body manager-person-detail ceac-record">
    <button className="back" onClick={back}>← Team</button>
    <header className="ceac-record-header">
      <div className="ceac-record-header-row">
        <div className="ceac-record-identity">
          <div className="ceac-record-kicker">Operational view · {me.unit_name}</div>
          <h1 className="ceac-record-title">{person.profiles?.full_name || "—"}</h1>
          <p className="ceac-record-subtitle">{person.profiles?.job_title || person.role}{subTeams.length ? ` · ${subTeams.join(", ")}` : ""}</p>
        </div>
      </div>
    </header>
    {error && <div className="flag flag-brick" style={{ marginTop: 14 }}><h4>Could not complete that</h4>{error}</div>}

    <div className="ceac-record-layout">
      <main className="ceac-record-main">
    <div className="person-orientation-grid" aria-label="Current operational context">
      <div><strong>{current.length}</strong><span>current responsibilities</span></div>
      <div className={needsSupport ? "attention" : ""}><strong>{needsSupport}</strong><span>need support or follow-up</span></div>
      <div><strong>{completed.length}</strong><span>recent completed outcomes</span></div>
    </div>

    <div id="current-work" className="sec"><span>Current responsibilities</span><span>{current.length}</span></div>
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {filters.map(([key, label]) => <button key={key} className={"pill " + (currentFilter === key ? "p-green" : "p-grey")} onClick={() => setCurrentFilter(key)}>{label} {currentGroups[key].length}</button>)}
    </div>
    <div style={{ marginTop: 10 }}>
      {currentGroups[currentFilter].map((item) => <WorkRow key={item.id} item={item} openItem={openItem} />)}
      {currentGroups[currentFilter].length === 0 && <div className="card small">No work in this group.</div>}
    </div>

    <div id="completed" className="sec"><span>Recent outcomes</span><select value={periodDays} onChange={(event) => setPeriodDays(Number(event.target.value))} style={{ color: "var(--ink-soft)" }}><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option></select></div>
    <div className="metric-grid person-outcome-grid">
      <button className="metric" onClick={() => setShowCompleted((value) => !value)}><b>{completed.length}</b><span>completed outcomes</span></button>
      <button className="metric" onClick={() => setShowCompleted(true)}><b>{onTime.length} of {completedWithDue.length}</b><span>completed on time where a due date exists</span></button>
      <button className="metric" onClick={() => setShowReviewed((value) => !value)}><b>{reviewed.length}</b><span>reviewed outcomes</span><small>Open review history</small></button>
    </div>
    {showCompleted && <div style={{ marginTop: 10 }}>{completed.length ? completed.map((item) => <WorkRow key={item.id} item={item} openItem={openItem} />) : <div className="card small">No completed work in this period.</div>}</div>}
    {showReviewed && <div style={{ marginTop: 10 }}>{reviewed.length ? reviewed.map((item) => <button key={item.id} className="row" onClick={() => openItem(item.id)}><div className="row-t">{item.title}</div><div className="row-m">{item.first_time_approved ? "Approved without a return" : "Returned for correction before final approval"}</div></button>) : <div className="card small">No reviewed work in this period.</div>}</div>}

    <div id="submissions" className="sec"><span>Submissions in selected period</span><span>{submissions.length}</span></div>
    {submissions.map((submission) => <button key={submission.id} className="row" onClick={() => openItem(submission.work_items.id)}><div className="row-t">{submission.work_items.title}</div><div className="row-m">{submission.work_items.ref} · submitted {dateOnly(submission.submitted_at)}</div>{submission.note && <div className="row-note">{submission.note}</div>}</button>)}
    {submissions.length === 0 && <div className="card small">No submissions in this period.</div>}

    <div className="sec"><span>Projects & objectives</span><span>{objectives.length}</span></div>
    {objectives.map((objective) => {
      const tasks = objectiveTasks.filter((task) => task.objective_id === objective.id);
      const done = tasks.filter((task) => ["completed", "self_certified"].includes(task.status)).length;
      return <div key={objective.id} className="row">
        <div className="eyebrow">{objective.ref}{objective.projects?.name ? ` · ${objective.projects.name}` : ""}</div>
        <div className="row-t" style={{ marginTop: 3 }}>{objective.name}</div>
        {objective.statement && <div className="row-note">{objective.statement}</div>}
        <div style={{ marginTop: 8 }}><Pill tone={objective.status === "at_risk" ? "brick" : "green"}>{formatObjectiveStatus(objective.status)}</Pill></div>
        <button className="row-note" style={{ textDecoration: "underline" }} onClick={() => setOpenObjective(openObjective === objective.id ? null : objective.id)}>{done} of {tasks.length} tasks completed</button>
        {objective.target_value !== null && objective.achieved_value !== null && <div className="row-note">Target: {objective.target_value} {objective.target_unit || ""} · Result: {objective.achieved_value} {objective.target_unit || ""}</div>}
        {objective.project_id && <button className="btn btn-ghost btn-sm" style={{ marginTop: 10 }} onClick={() => openProject(objective.project_id)}>Open project</button>}
        {openObjective === objective.id && <div style={{ marginTop: 10 }}>{tasks.map((task) => <WorkRow key={task.id} item={task} openItem={openItem} />)}{tasks.length === 0 && <div className="small">No tasks are attached.</div>}</div>}
      </div>;
    })}
    {objectives.length === 0 && <div className="card small">No objective is connected to this person’s work.</div>}

    <div id="sessions" className="sec"><span>Activity context</span><span>{sessions.length}</span></div>
    <p className="screen-note">Work sessions are operational context only. They do not measure productivity or determine the quality of this person’s work.</p>
    <div style={{ marginTop: 8 }}>
      {sessions.map((session) => <div key={session.id} className="row"><div className="row-t">{new Date(session.started_at).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}</div><div className="row-m">Started {new Date(session.started_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} · {durationLabel(session)} · {session.place}</div>{session.end_reason && <div className="row-note">Ended: {session.end_reason}</div>}</div>)}
      {sessions.length === 0 && <div className="card small">No session records in this period.</div>}
    </div>

    <div className="sec"><span>Visible feedback</span><span>{feedback.length}</span></div>
    <p className="screen-note">Feedback saved here is visible to this staff member, you, and authorised Administration & HR users. There are no private manager notes.</p>
    {feedback.map((entry) => <div key={entry.id} className="row"><div className="row-t">{entry.profiles?.full_name || "Manager"}</div><div className="row-m">{dateOnly(entry.created_at)}</div><div className="row-note">{entry.note}</div></div>)}
    {feedback.length === 0 && <div className="card small">No feedback has been recorded.</div>}
    <FieldGroup label="Feedback visible to this staff member" hint="Keep it factual and tied to work, support or an agreed development point."><textarea className="field" rows={3} placeholder="Write factual, visible feedback" value={note} onChange={(event) => setNote(event.target.value)} /></FieldGroup>
    <button className="btn wide-auto" style={{ marginTop: 10 }} onClick={addFeedback} disabled={busy || !note.trim()}>{busy ? "Saving..." : "Save visible feedback"}</button>
      </main>
      <aside className="ceac-record-rail" aria-label="Person context">
        <section className="ceac-record-panel">
          <strong className="ceac-record-panel-title">Current context</strong>
          <dl className="ceac-record-facts" style={{ marginTop: 10 }}>
            <div className="ceac-record-fact"><dt>Role</dt><dd>{person.profiles?.job_title || person.role || "—"}</dd></div>
            <div className="ceac-record-fact"><dt>Current work</dt><dd>{current.length}</dd></div>
            <div className="ceac-record-fact"><dt>Needs follow-up</dt><dd>{needsSupport}</dd></div>
            <div className="ceac-record-fact"><dt>Recent outcomes</dt><dd>{completed.length}</dd></div>
          </dl>
        </section>
        <section className="ceac-record-panel person-record-activity">
          <strong className="ceac-record-panel-title">Recent activity context</strong>
          <span className="ceac-record-panel-copy">Work sessions are context only, not a productivity score.</span>
          <div className="ceac-record-timeline" style={{ marginTop: 12 }}>
            {sessions.slice(0, 5).map((session) => <div className="ceac-record-event" key={session.id}>
              {durationLabel(session)} · {session.place}
              <time>{new Date(session.started_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} · {new Date(session.started_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</time>
            </div>)}
            {sessions.length === 0 && <span className="ceac-record-panel-copy">No session records in this period.</span>}
          </div>
        </section>
      </aside>
    </div>
  </div>;
}
