import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { dateOnly, dueLabel, isOverdue } from "../lib/time";
import { ProductNotice, LoadingState, FieldGroup } from "../components/bits";
import { Button, StatusBadge } from "../experience-v2/components";
import { WorkRow } from "../experience-v2/work-family/WorkFamilyV2";
import {
  PeopleBackButton,
  PeopleEvidenceSummary,
  PeoplePersonHeader,
  PeopleWorkspaceSection,
  PeopleEmpty,
} from "../experience-v2/people-family/PeopleFamilyV2";
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

  if (!person) return <div className="body manager-person-detail ev2-people-page ev2-person-workspace">
    <PeopleBackButton onClick={back} label="Team" />
    {error ? <ProductNotice tone="error" title="Could not open person detail">{error}</ProductNotice> : <LoadingState label="Loading person…" />}
  </div>;

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

  const personName = person.profiles?.full_name || "—";
  const personRole = person.profiles?.job_title || person.role;
  const personContext = subTeams.length ? subTeams.join(", ") : null;
  const outcomeTone = (status) => status === "at_risk" || status === "partly_met"
    ? "warning"
    : status === "met" || status === "on_track"
      ? "success"
      : "neutral";

  const renderWorkRows = (rows) => rows.map((item) => <WorkRow
    key={item.id}
    title={item.title}
    refCode={item.ref}
    kind={item.kind}
    due={dueLabel(item.due_at)}
    status={item.status}
    onClick={() => openItem(item.id)}
  />);

  return <div className="body manager-person-detail ev2-people-page ev2-person-workspace">
    <PeopleBackButton onClick={back} label="Team" />

    {error && <ProductNotice tone="error" title="Could not complete that">{error}</ProductNotice>}

    <div className="ev2p-person-layout">
      <aside className="ev2p-person-context-rail" aria-label="Selected person context">
        <PeoplePersonHeader
          name={personName}
          eyebrow={`Operational view · ${me.unit_name}`}
          subtitle={personRole}
          context={personContext}
        />

        <PeopleEvidenceSummary
          facts={[
            { value: current.length, label: "current responsibilities" },
            { value: needsSupport, label: "need support or follow-up", tone: needsSupport ? "attention" : undefined },
            { value: completed.length, label: "recent completed outcomes" },
          ]}
          note="These counts are factual operating context. They are not a productivity score, ranking or judgement about this person."
        />
      </aside>

      <div className="ev2p-person-detail-stack">
        <PeopleWorkspaceSection
      id="current-work"
      title="Current responsibilities"
      description="Current non-private work in this unit. Open an item for the full work record and evidence."
      meta={`${current.length} open`}
    >
      <div className="ev2p-filter-tabs" role="tablist" aria-label="Current responsibility filters">
        {filters.map(([key, label]) => <button
          key={key}
          type="button"
          role="tab"
          aria-selected={currentFilter === key}
          className={`ev2p-filter-tab ${currentFilter === key ? "is-selected" : ""}`}
          onClick={() => setCurrentFilter(key)}
        >
          <span>{label}</span><b>{currentGroups[key].length}</b>
        </button>)}
      </div>
      {currentGroups[currentFilter].length
        ? <div className="ev2w-list">{renderWorkRows(currentGroups[currentFilter])}</div>
        : <PeopleEmpty title="No work in this group" description="Choose another factual work state to inspect this person’s current responsibilities." />}
    </PeopleWorkspaceSection>

    <PeopleWorkspaceSection
      id="completed"
      title="Recent outcomes"
      description="Task and Deliverable outcomes recorded in the selected period. These are evidence counts, not a performance score."
      meta={<select aria-label="Outcome period" value={periodDays} onChange={(event) => setPeriodDays(Number(event.target.value))}>
        <option value={7}>Last 7 days</option>
        <option value={30}>Last 30 days</option>
        <option value={90}>Last 90 days</option>
      </select>}
    >
      <div className="ev2p-outcome-grid">
        <button type="button" onClick={() => setShowCompleted((value) => !value)}>
          <b>{completed.length}</b><span>completed outcomes</span>
        </button>
        <button type="button" onClick={() => setShowCompleted(true)}>
          <b>{onTime.length} of {completedWithDue.length}</b><span>completed on time where a due date exists</span>
        </button>
        <button type="button" onClick={() => setShowReviewed((value) => !value)}>
          <b>{reviewed.length}</b><span>reviewed outcomes</span><small>Open review history</small>
        </button>
      </div>
      {showCompleted && <div style={{ marginTop: 10 }}>
        {completed.length ? <div className="ev2w-list">{renderWorkRows(completed)}</div> : <PeopleEmpty title="No completed work" description="No Task or Deliverable outcome is recorded in this period." />}
      </div>}
      {showReviewed && <div style={{ marginTop: 10 }}>
        {reviewed.length ? <div className="ev2p-link-list">{reviewed.map((item) => <button key={item.id} type="button" className="ev2p-link-row" onClick={() => openItem(item.id)}>
          <span className="ev2p-link-row-main">
            <strong>{item.title}</strong>
            <span>{item.first_time_approved ? "Approved without a return" : "Returned for correction before final approval"}</span>
          </span>
          <span className="ev2p-link-row-tail">›</span>
        </button>)}</div> : <PeopleEmpty title="No reviewed work" description="No reviewed Task or Deliverable outcome is recorded in this period." />}
      </div>}
    </PeopleWorkspaceSection>

    <PeopleWorkspaceSection
      id="submissions"
      title="Submissions"
      description="Submission records in the selected period. Open one to inspect the underlying work."
      meta={`${submissions.length} recorded`}
    >
      {submissions.length ? <div className="ev2p-link-list">{submissions.map((submission) => <button key={submission.id} type="button" className="ev2p-link-row" onClick={() => openItem(submission.work_items.id)}>
        <span className="ev2p-link-row-main">
          <strong>{submission.work_items.title}</strong>
          <span>{submission.work_items.ref} · submitted {dateOnly(submission.submitted_at)}</span>
          {submission.note ? <small>{submission.note}</small> : null}
        </span>
        <span className="ev2p-link-row-tail">›</span>
      </button>)}</div> : <PeopleEmpty title="No submissions in this period" description="No submission record is available for this person in the selected period." />}
    </PeopleWorkspaceSection>

    <PeopleWorkspaceSection
      title="Projects & objectives"
      description="Objective context connected to this person’s current non-private unit work."
      meta={`${objectives.length} connected`}
    >
      {objectives.map((objective) => {
        const tasks = objectiveTasks.filter((task) => task.objective_id === objective.id);
        const done = tasks.filter((task) => ["completed", "self_certified"].includes(task.status)).length;
        return <article key={objective.id} className="ev2p-objective">
          <div className="ev2p-objective-main">
            <div className="ev2p-objective-ref">{objective.ref}{objective.projects?.name ? ` · ${objective.projects.name}` : ""}</div>
            <h3>{objective.name}</h3>
            {objective.statement ? <p>{objective.statement}</p> : null}
            <div className="ev2p-objective-meta">
              <StatusBadge tone={outcomeTone(objective.status)} icon={false}>{formatObjectiveStatus(objective.status)}</StatusBadge>
              <button type="button" className="ev2p-objective-toggle" onClick={() => setOpenObjective(openObjective === objective.id ? null : objective.id)}>
                {done} of {tasks.length} tasks completed
              </button>
              {objective.project_id ? <Button variant="secondary" size="compact" onClick={() => openProject(objective.project_id)}>Open project</Button> : null}
            </div>
            {objective.target_value !== null && objective.achieved_value !== null ? <p>Target: {objective.target_value} {objective.target_unit || ""} · Result: {objective.achieved_value} {objective.target_unit || ""}</p> : null}
          </div>
          {openObjective === objective.id ? <div className="ev2p-objective-tasks">
            {tasks.length ? <div className="ev2w-list">{renderWorkRows(tasks)}</div> : <PeopleEmpty title="No tasks attached" description="This objective currently has no non-private task attached in the unit." />}
          </div> : null}
        </article>;
      })}
      {objectives.length === 0 ? <PeopleEmpty title="No connected objective" description="No objective is connected to this person’s current non-private unit work." /> : null}
    </PeopleWorkspaceSection>

    <PeopleWorkspaceSection
      id="sessions"
      title="Activity context"
      description="Work sessions are operational context only. They do not measure productivity or determine the quality of this person’s work."
      meta={`${sessions.length} records`}
    >
      {sessions.length ? <div className="ev2p-session-list">{sessions.map((session) => <div key={session.id} className="ev2p-session-row">
        <strong>{new Date(session.started_at).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}</strong>
        <span>Started {new Date(session.started_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} · {durationLabel(session)} · {session.place}</span>
        {session.end_reason ? <small>Ended: {session.end_reason}</small> : null}
      </div>)}</div> : <PeopleEmpty title="No session records" description="No factual work-session record exists for this person in the selected period." />}
    </PeopleWorkspaceSection>

    <PeopleWorkspaceSection
      title="Visible feedback"
      description="Feedback saved here is visible to this staff member, you, and authorised Administration & HR users. There are no private manager notes."
      meta={`${feedback.length} recorded`}
    >
      {feedback.length ? <div className="ev2p-feedback-list">{feedback.map((entry) => <div key={entry.id} className="ev2p-feedback-row">
        <strong>{entry.profiles?.full_name || "Manager"}</strong>
        <span>{dateOnly(entry.created_at)}</span>
        <p>{entry.note}</p>
      </div>)}</div> : <PeopleEmpty title="No visible feedback recorded" description="Any feedback added here will be attributable and visible to the staff member." />}
      <div className="ev2p-feedback-compose">
        <FieldGroup label="Feedback visible to this staff member" hint="Keep it factual and tied to work, support or an agreed development point.">
          <textarea className="field" rows={3} placeholder="Write factual, visible feedback" value={note} onChange={(event) => setNote(event.target.value)} />
        </FieldGroup>
        <Button onClick={addFeedback} disabled={busy || !note.trim()}>{busy ? "Saving..." : "Save visible feedback"}</Button>
      </div>
        </PeopleWorkspaceSection>
      </div>
    </div>
  </div>;

}
