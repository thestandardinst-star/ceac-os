import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { dueLabel, isOverdue } from "../lib/time";
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

function dateKey(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function requireResult(result, label) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data || [];
}

function ActionRow({ item, openItem, tone = "neutral" }) {
  return (
    <button className={`row home-work-row home-tone-${tone}`} onClick={() => openItem(item.id)}>
      <div className="row-t">{item.title}</div>
      <div className="row-m">{item.ref} · {dueLabel(item.due_at)}</div>
      <div style={{ marginTop: 7 }}>{statusPill(item.status)}</div>
    </button>
  );
}

export default function ManagerHome({ me, openItem, openProject, openPerson, goAssign }) {
  const [submissions, setSubmissions] = useState([]);
  const [leave, setLeave] = useState([]);
  const [blockers, setBlockers] = useState([]);
  const [team, setTeam] = useState({ present: [], leave: [], notStarted: [], completed: [], submitted: [] });
  const [mine, setMine] = useState([]);
  const [projects, setProjects] = useState([]);
  const [upcomingProjects, setUpcomingProjects] = useState([]);
  const [week, setWeek] = useState({ due: [], completed: [], overdue: [] });
  const [leaveLimit, setLeaveLimit] = useState(5);
  const [sheet, setSheet] = useState(null);
  const [drill, setDrill] = useState(null);
  const [comment, setComment] = useState("");
  const [returnItems, setReturnItems] = useState([]);
  const [selectedReturnItems, setSelectedReturnItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => { load(); }, [me.id, me.unit_id]);

  async function load() {
    if (!me.unit_id) return;
    setLoading(true);
    setError(null);
    setLoadFailed(false);
    try {
      const today = startOfDay();
      const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
      const weekStart = startOfWeek();
      const nextWeek = new Date(weekStart); nextWeek.setDate(nextWeek.getDate() + 7);

      const [memberResult, submissionResult, leaveResult, incomingBlockerResult, outgoingBlockerResult, mineResult,
        settingResult, sessionResult, weekResult, projectUnitResult, activeProjectResult,
        todayOutputResult, todaySubmissionResult] = await Promise.all([
        supabase.from("unit_memberships")
          .select("profile_id, profiles!unit_memberships_profile_id_fkey(id, full_name)")
          .eq("unit_id", me.unit_id),
        supabase.from("submissions")
          .select("id, note, submitted_at, profiles!submissions_profile_id_fkey(full_name), work_items!inner(id, ref, title, unit_id, status, due_at), submission_files(url)")
          .eq("work_items.unit_id", me.unit_id).eq("work_items.status", "in_review")
          .neq("profile_id", me.id)
          .order("submitted_at", { ascending: true }),
        supabase.from("leave_requests")
          .select("id, profile_id, kind, start_date, end_date, days, status, reason, profiles!leave_requests_profile_id_fkey(full_name)")
          .eq("status", "pending").order("requested_at", { ascending: true }),
        supabase.from("blockers")
          .select("id, party_text, note, since, state, work_item_id, party_unit_id, profiles!blockers_claimed_by_fkey(full_name), units(name), work_items!inner(id, ref, title)")
          .eq("party_unit_id", me.unit_id).in("state", ["claimed", "acknowledged"])
          .order("since", { ascending: true }),
        supabase.from("blockers")
          .select("id, party_text, note, since, state, work_item_id, party_unit_id, profiles!blockers_claimed_by_fkey(full_name), units(name), work_items!inner(id, ref, title, unit_id)")
          .eq("work_items.unit_id", me.unit_id).neq("party_unit_id", me.unit_id)
          .in("state", ["claimed", "acknowledged"])
          .order("since", { ascending: true }),
        supabase.from("work_items")
          .select("id, ref, title, status, due_at").eq("assignee_id", me.id)
          .not("status", "in", "(completed,self_certified,cancelled)"),
        supabase.from("leave_settings").select("manager_approval_limit").eq("org_id", me.org_id).maybeSingle(),
        supabase.from("work_sessions").select("profile_id, started_at")
          .gte("started_at", today.toISOString()).lt("started_at", tomorrow.toISOString()),
        supabase.from("work_items")
          .select("id, ref, title, status, due_at, completed_at, assignee_id")
          .eq("unit_id", me.unit_id).eq("kind", "task"),
        supabase.from("project_units").select("project_id").eq("unit_id", me.unit_id),
        supabase.from("projects").select("id, name, lead_unit_id, ends_on, status").eq("status", "active"),
        supabase.from("work_items").select("id, ref, title, status, due_at, assignee_id, completed_at")
          .eq("unit_id", me.unit_id).in("kind", ["task", "deliverable"])
          .eq("status", "completed")
          .gte("completed_at", today.toISOString()).lt("completed_at", tomorrow.toISOString()),
        supabase.from("submissions").select("id, profile_id, submitted_at, work_items!inner(id, ref, title, status, due_at, unit_id)")
          .eq("work_items.unit_id", me.unit_id)
          .gte("submitted_at", today.toISOString()).lt("submitted_at", tomorrow.toISOString()),
      ]);

      const members = requireResult(memberResult, "Team").filter((member) => member.profile_id !== me.id);
      const memberIds = new Set(members.map((member) => member.profile_id));
      setSubmissions(requireResult(submissionResult, "Submissions"));
      setLeave(requireResult(leaveResult, "Leave requests").filter((request) => memberIds.has(request.profile_id)));
      const blockerMap = new Map();
      requireResult(incomingBlockerResult, "Blockers waiting on your unit")
        .forEach((blocker) => blockerMap.set(blocker.id, { ...blocker, direction: "incoming" }));
      requireResult(outgoingBlockerResult, "Work waiting on another unit")
        .forEach((blocker) => {
          if (!blockerMap.has(blocker.id)) blockerMap.set(blocker.id, { ...blocker, direction: "outgoing" });
        });
      setBlockers([...blockerMap.values()]);
      setMine(requireResult(mineResult, "Your work").filter((item) => {
        const dueToday = item.due_at && new Date(item.due_at) >= today && new Date(item.due_at) < tomorrow;
        return dueToday || isOverdue(item.due_at) || item.status === "returned" || item.status === "waiting_on";
      }));
      if (settingResult.error) throw new Error(`Leave settings: ${settingResult.error.message}`);
      if (settingResult.data) setLeaveLimit(settingResult.data.manager_approval_limit);

      const sessions = requireResult(sessionResult, "Presence");
      const presentIds = new Set(sessions.map((session) => session.profile_id));
      const approvedLeaveResult = memberIds.size ? await supabase.from("leave_requests")
        .select("profile_id").in("profile_id", [...memberIds]).eq("status", "approved")
        .lte("start_date", dateKey(today)).gte("end_date", dateKey(today)) : { data: [], error: null };
      const leaveIds = new Set(requireResult(approvedLeaveResult, "Today’s leave").map((request) => request.profile_id));
      const todayOutput = requireResult(todayOutputResult, "Today’s completed work");
      const todaySubmissions = requireResult(todaySubmissionResult, "Today’s submissions");
      const submittedWorkMap = new Map();
      todaySubmissions.forEach((submission) => {
        if (submission.work_items?.id && !submittedWorkMap.has(submission.work_items.id)) {
          submittedWorkMap.set(submission.work_items.id, submission.work_items);
        }
      });
      const submittedWork = [...submittedWorkMap.values()];
      const people = members.map((member) => ({
        id: member.profile_id,
        name: member.profiles?.full_name || "—",
        completed: todayOutput.filter((item) => item.assignee_id === member.profile_id).length,
        submitted: todaySubmissions.filter((submission) => submission.profile_id === member.profile_id).length,
      }));
      setTeam({
        leave: people.filter((person) => leaveIds.has(person.id)),
        present: people.filter((person) => !leaveIds.has(person.id) && presentIds.has(person.id)),
        notStarted: people.filter((person) => !leaveIds.has(person.id) && !presentIds.has(person.id)),
        completed: todayOutput,
        submitted: submittedWork,
      });

      const tasks = requireResult(weekResult, "This week");
      setWeek({
        due: tasks.filter((item) => item.due_at && new Date(item.due_at) >= weekStart && new Date(item.due_at) < nextWeek),
        completed: tasks.filter((item) => ["completed", "self_certified"].includes(item.status) && item.completed_at && new Date(item.completed_at) >= weekStart && new Date(item.completed_at) < nextWeek),
        overdue: tasks.filter((item) => isOverdue(item.due_at) && !["completed", "self_certified", "cancelled", "waiting_on"].includes(item.status)),
      });

      const participatingIds = new Set(requireResult(projectUnitResult, "Project units").map((row) => row.project_id));
      const relevantProjects = requireResult(activeProjectResult, "Projects")
        .filter((project) => project.lead_unit_id === me.unit_id || participatingIds.has(project.id));
      const upcomingCutoff = new Date(today); upcomingCutoff.setDate(upcomingCutoff.getDate() + 14);
      setUpcomingProjects(relevantProjects
        .filter((project) => project.ends_on && project.ends_on >= dateKey(today) && project.ends_on < dateKey(upcomingCutoff))
        .sort((left, right) => left.ends_on.localeCompare(right.ends_on)));
      const projectIds = relevantProjects.map((project) => project.id);
      const [objectiveResult, projectTaskResult] = projectIds.length ? await Promise.all([
        supabase.from("objectives").select("id, project_id, name, status").in("project_id", projectIds),
        supabase.from("work_items").select("id, ref, title, project_id, status, due_at, kind").in("project_id", projectIds).in("kind", ["task", "deliverable"]),
      ]) : [{ data: [], error: null }, { data: [], error: null }];
      const objectives = requireResult(objectiveResult, "Project objectives");
      const projectTasks = requireResult(projectTaskResult, "Project tasks");
      setProjects(relevantProjects.map((project) => {
        const atRisk = objectives.filter((objective) => objective.project_id === project.id && ["at_risk", "not_met"].includes(objective.status));
        const closesThisWeek = project.ends_on && project.ends_on >= dateKey(today) && project.ends_on < dateKey(nextWeek);
        const projectWork = projectTasks.filter((item) => item.project_id === project.id);
        const tasksForProject = projectWork.filter((item) => item.kind === "task");
        const openDeliverables = projectWork.filter((item) => item.kind === "deliverable" && !["completed", "self_certified", "cancelled"].includes(item.status));
        return { ...project, atRisk, closesThisWeek, tasks: tasksForProject,
          openDeliverables,
          completedTasks: tasksForProject.filter((task) => ["completed", "self_certified"].includes(task.status)).length,
          taskCount: tasksForProject.length };
      }).filter((project) => project.atRisk.length > 0 || project.closesThisWeek || project.openDeliverables.length > 0));
    } catch (err) {
      setLoadFailed(true);
      setError(err.message || "Manager Home could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  async function openReturn(submission) {
    setError(null);
    setReturnItems([]);
    setSelectedReturnItems([]);
    const result = await supabase.from("checklist_items")
      .select("id,label,position")
      .eq("work_item_id", submission.work_items.id)
      .order("position");
    if (result.error) {
      setError(`Checklist: ${result.error.message}`);
      return;
    }
    setReturnItems(result.data || []);
    setSheet({ type: "work", item: submission, decision: "returned" });
  }

  function toggleReturnItem(id) {
    setSelectedReturnItems((current) => current.includes(id)
      ? current.filter((itemId) => itemId !== id)
      : [...current, id]);
  }

  async function decideWork(submission, decision) {
    setBusy(true); setError(null);
    try {
      if (decision === "returned" && !comment.trim()) throw new Error("Add a comment explaining what needs changing.");
      if (decision === "returned") {
        const { error: returnError } = await supabase.rpc("return_work_for_correction", {
          p_submission_id: submission.id,
          p_comment: comment.trim(),
          p_checklist_item_ids: selectedReturnItems.length ? selectedReturnItems : null,
        });
        if (returnError) throw returnError;
        setSheet(null); setComment(""); setReturnItems([]); setSelectedReturnItems([]); await load();
        return;
      }
      const { error: reviewError } = await supabase.from("reviews").insert({
        org_id: me.org_id, submission_id: submission.id, reviewer_id: me.id,
        decision, comment: comment.trim() || null, seen_at: new Date().toISOString(),
      });
      if (reviewError) throw reviewError;
      let firstTimeApproved = false;
      if (decision === "completed") {
        const submissionResult = await supabase.from("submissions").select("id").eq("work_item_id", submission.work_items.id);
        const ids = requireResult(submissionResult, "Submission history").map((row) => row.id);
        const reviewResult = await supabase.from("reviews").select("id", { count: "exact", head: true })
          .eq("decision", "returned").in("submission_id", ids);
        if (reviewResult.error) throw reviewResult.error;
        firstTimeApproved = (reviewResult.count || 0) === 0;
      }
      const { error: updateError } = await supabase.from("work_items").update({
        status: decision, first_time_approved: decision === "completed" ? firstTimeApproved : false,
        completed_at: decision === "completed" ? new Date().toISOString() : null,
        last_movement_at: new Date().toISOString(),
      }).eq("id", submission.work_items.id);
      if (updateError) throw updateError;
      setSheet(null); setComment(""); await load();
    } catch (err) { setError(err.message || "The review could not be saved."); }
    finally { setBusy(false); }
  }

  async function decideLeave(request, decision) {
    setBusy(true); setError(null);
    try {
      const status = decision === "declined" ? "declined" : Number(request.days) > leaveLimit ? "escalated" : "approved";
      const { error: updateError } = await supabase.from("leave_requests").update({
        status, decided_by: me.id, decided_at: new Date().toISOString(), decision_note: comment.trim() || null,
      }).eq("id", request.id);
      if (updateError) throw updateError;
      setSheet(null); setComment(""); await load();
    } catch (err) { setError(err.message || "The leave decision could not be saved."); }
    finally { setBusy(false); }
  }

  async function answerBlocker(blocker, state) {
    setBusy(true); setError(null);
    try {
      const { error: updateError } = await supabase.from("blockers").update({
        state, responded_by: me.id, response_note: comment.trim() || null, responded_at: new Date().toISOString(),
      }).eq("id", blocker.id);
      if (updateError) throw updateError;
      setSheet(null); setComment(""); await load();
    } catch (err) { setError(err.message || "The blocker response could not be saved."); }
    finally { setBusy(false); }
  }

  const waitingCount = submissions.length + leave.length;
  const drillRows = drill?.rows || [];
  const ownTone = (item) => item.status === "returned" || isOverdue(item.due_at)
    ? "danger"
    : item.status === "waiting_on" ? "attention" : "info";

  return (
    <div className="body">
      <div style={{ paddingTop: 26 }}>
        <div className="eyebrow">{me.unit_name}</div>
        <h1 className="h1" style={{ marginTop: 6 }}>{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</h1>
        <p className="screen-note">Start with anything waiting for your decision, then check your team and your own work.</p>
      </div>
      <button className="btn wide-auto" style={{ marginTop: 16 }} onClick={goAssign}>Give out work</button>
      {error && <div className="flag flag-brick" style={{ marginTop: 14 }}><h4>Could not complete that</h4>{error}{loadFailed && <button className="btn btn-ghost btn-sm" style={{ marginTop: 10 }} onClick={load}>Try again</button>}</div>}
      {loading && <div className="spin">Loading Manager Home...</div>}

      {!loading && !loadFailed && <div className="home-dashboard">
      <section className="home-panel home-panel-priority" aria-labelledby="manager-waiting-heading">
      <div className="home-section-head">
        <div><div className="home-kicker">Decisions first</div><h2 id="manager-waiting-heading">Waiting on you</h2></div>
        <span className="home-count home-count-attention">{waitingCount}</span>
      </div>
      {waitingCount === 0 && <div className="home-quiet home-quiet-success">Nothing needs your decision right now.</div>}
      {submissions.map((submission) => (
        <div key={submission.id} className="row home-action-row">
          <div className="home-row-label">Work review</div>
          <div className="row-t">{submission.work_items.title}</div>
          <div className="row-m">{submission.work_items.ref} · {submission.profiles?.full_name || "—"} · work to review</div>
          {submission.note && <div className="row-note">&ldquo;{submission.note}&rdquo;</div>}
          {submission.submission_files?.map((file) => <a key={file.url} className="row-note" href={file.url} target="_blank" rel="noreferrer">Open submitted link</a>)}
          <div style={{ display: "flex", gap: 7, marginTop: 11, flexWrap: "wrap" }}>
            <button className="btn btn-ghost btn-sm" onClick={() => openItem(submission.work_items.id)}>Open</button>
            <button className="btn btn-ghost btn-sm" onClick={() => openReturn(submission)}>Return</button>
            <button className="btn btn-sm" onClick={() => setSheet({ type: "work", item: submission, decision: "completed" })}>Approve</button>
          </div>
        </div>
      ))}
      {leave.map((request) => (
        <div key={request.id} className="row home-action-row">
          <div className="home-row-label">Leave decision</div>
          <div className="row-t">{request.profiles?.full_name || "—"} · {request.days} day{Number(request.days) === 1 ? "" : "s"} {request.kind} leave</div>
          <div className="row-m">{request.start_date} → {request.end_date}</div>
          {request.reason && <div className="row-note">&ldquo;{request.reason}&rdquo;</div>}
          {Number(request.days) > leaveLimit && <div className="row-note" style={{ color: "var(--amber)" }}>Over {leaveLimit} days — approval escalates to Administration.</div>}
          <div style={{ display: "flex", gap: 7, marginTop: 11 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setSheet({ type: "leave", item: request, decision: "declined" })}>Decline</button>
            <button className="btn btn-sm" onClick={() => setSheet({ type: "leave", item: request, decision: "approved" })}>{Number(request.days) > leaveLimit ? "Escalate" : "Approve"}</button>
          </div>
        </div>
      ))}
      </section>

      <section className="home-panel home-panel-pulse" aria-labelledby="manager-team-heading">
      <div className="home-section-head">
        <div><div className="home-kicker">Team pulse</div><h2 id="manager-team-heading">Your team today</h2></div>
      </div>
      <div className="home-subhead">Availability</div>
      <div className="home-stat-grid">
        <button className="home-stat home-tone-success" onClick={() => setDrill({ zone: "team", title: "Present today", people: true, rows: team.present })}><b>{team.present.length}</b><span>Present</span></button>
        <button className="home-stat home-tone-info" onClick={() => setDrill({ zone: "team", title: "On approved leave today", people: true, rows: team.leave })}><b>{team.leave.length}</b><span>Approved leave</span></button>
        <button className="home-stat" onClick={() => setDrill({ zone: "team", title: "Not started today", people: true, rows: team.notStarted })}><b>{team.notStarted.length}</b><span>Not started</span></button>
      </div>
      <div className="home-subhead home-subhead-spaced">Work movement today</div>
      <div className="home-stat-grid">
        <button className="home-stat home-tone-success" onClick={() => setDrill({ zone: "team", title: "Work completed today", rows: team.completed })}><b>{team.completed.length}</b><span>Completed</span></button>
        <button className="home-stat home-tone-info" onClick={() => setDrill({ zone: "team", title: "Work submitted today", rows: team.submitted })}><b>{team.submitted.length}</b><span>Work submitted</span></button>
        <button className="home-stat home-tone-attention" onClick={() => setDrill({ zone: "team", title: "Awaiting your review", rows: submissions.map((submission) => submission.work_items) })}><b>{submissions.length}</b><span>Awaiting review</span></button>
      </div>
      {drill?.zone === "team" && <div className="home-drill">
        <div className="home-drill-head"><strong>{drill.title}</strong><span>{drillRows.length}</span></div>
        {drill.people && (drillRows.length ? drillRows.map((person) => <button key={person.id} className="row" onClick={() => openPerson(person.id, "current")}>
          <div className="row-t">{person.name}</div>
          <div className="row-m">{person.completed} completed today · {person.submitted} submitted today</div>
        </button>) : <div className="home-quiet">No people in this group.</div>)}
        {!drill.people && (drillRows.length ? drillRows.map((item) => <ActionRow key={item.id} item={item} openItem={openItem} tone="info" />) : <div className="home-quiet">No work in this group.</div>)}
      </div>}
      </section>

      <section className="home-panel home-panel-waiting" aria-labelledby="manager-stuck-heading">
        <div className="home-section-head">
          <div><div className="home-kicker">Dependencies</div><h2 id="manager-stuck-heading">Stuck / waiting</h2></div>
          <span className="home-count">{blockers.length}</span>
        </div>
        {blockers.length === 0 && <div className="home-quiet">No acknowledged or unanswered unit blockers are open.</div>}
        {blockers.map((blocker) => (
          <div key={blocker.id} className={`row home-blocker-row ${blocker.direction === "incoming" ? "home-tone-attention" : "home-tone-info"}`}>
            <div className="home-direction">{blocker.state === "claimed"
              ? blocker.direction === "incoming" ? "Claim needs your response" : "Waiting claim sent"
              : blocker.direction === "incoming" ? "Waiting on your unit" : "Your unit is waiting"}</div>
            <div className="row-t">{blocker.work_items.title}</div>
            <div className="row-m">{blocker.direction === "incoming"
              ? blocker.state === "acknowledged"
                ? `${blocker.profiles?.full_name || "Someone"} is waiting on your unit · acknowledged`
                : `${blocker.profiles?.full_name || "Someone"} says they are waiting on your unit · waiting for your reply`
              : blocker.state === "acknowledged"
                ? `Your unit is waiting on ${blocker.units?.name || blocker.party_text} · acknowledged`
                : `Your unit says it is waiting on ${blocker.units?.name || blocker.party_text} · waiting for their reply`}</div>
            <div className="row-note">{blocker.party_text}{blocker.note ? ` — ${blocker.note}` : ""}</div>
            <div style={{ display: "flex", gap: 7, marginTop: 11, flexWrap: "wrap" }}>
              <button className="btn btn-ghost btn-sm" onClick={() => openItem(blocker.work_item_id)}>Open</button>
              {blocker.direction === "incoming" && blocker.state === "claimed" && <>
                <button className="btn btn-ghost btn-sm" onClick={() => setSheet({ type: "blocker", item: blocker })}>Disagree</button>
                <button className="btn btn-sm" onClick={() => answerBlocker(blocker, "acknowledged")}>Acknowledge</button>
              </>}
            </div>
          </div>
        ))}
      </section>

      <section className="home-panel" aria-labelledby="manager-own-heading">
      <div className="home-section-head">
        <div><div className="home-kicker">Personal focus</div><h2 id="manager-own-heading">Your own work</h2></div>
        <span className="home-count">{mine.length}</span>
      </div>
      {mine.length ? mine.map((item) => <ActionRow key={item.id} item={item} openItem={openItem} tone={ownTone(item)} />) : <div className="home-quiet">No due, overdue, returned or waiting work.</div>}
      </section>

      <section className="home-panel home-panel-projects" aria-labelledby="manager-projects-heading">
      <div className="home-section-head">
        <div><div className="home-kicker">Delivery</div><h2 id="manager-projects-heading">Projects needing attention</h2></div>
        <span className="home-count home-count-attention">{projects.length}</span>
      </div>
      {projects.length ? projects.map((project) => (
        <div key={project.id} className="row home-project-row">
          <button className="row-t" style={{ textDecoration: "underline", textAlign: "left" }} onClick={() => openProject(project.id)}>{project.name}</button>
          <div className="home-chip-row">
            {project.atRisk.length > 0 && <span className="home-chip home-chip-attention">{project.atRisk.length} objective{project.atRisk.length === 1 ? "" : "s"} need attention</span>}
            {project.closesThisWeek && <span className="home-chip home-chip-info">Ends this week</span>}
            {project.openDeliverables.length > 0 && <span className="home-chip">{project.openDeliverables.length} open deliverable{project.openDeliverables.length === 1 ? "" : "s"}</span>}
          </div>
          {project.atRisk.map((objective) => <div key={objective.id} className="row-note">{objective.status === "not_met" ? "Not met" : "At risk"}: {objective.name}</div>)}
          {project.atRisk.length > 0 && project.closesThisWeek && <div className="row-note">Closes {new Date(`${project.ends_on}T00:00:00`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" })}</div>}
          {project.taskCount > 0 && <button className="home-progress-link" onClick={() => setDrill({ zone: "project", title: `${project.name} tasks`, rows: project.tasks })}>
            <span>{project.completedTasks} of {project.taskCount} tasks completed</span>
            <span className="home-progress" aria-hidden="true"><span style={{ width: `${Math.round((project.completedTasks / project.taskCount) * 100)}%` }} /></span>
          </button>}
          {project.openDeliverables.length > 0 && <button className="row-note" style={{ textDecoration: "underline" }} onClick={() => setDrill({ zone: "project", title: `${project.name} open deliverables`, rows: project.openDeliverables })}>Open deliverables</button>}
          <div><button className="btn btn-ghost btn-sm" style={{ marginTop: 10 }} onClick={() => openProject(project.id)}>Open project</button></div>
        </div>
      )) : <div className="home-quiet home-quiet-success">No active project has an at-risk or not-met objective, an open deliverable, or an end date this week.</div>}
      {drill?.zone === "project" && <div className="home-drill">
        <div className="home-drill-head"><strong>{drill.title}</strong><span>{drillRows.length}</span></div>
        {drillRows.map((item) => <ActionRow key={item.id} item={item} openItem={openItem} tone="attention" />)}
      </div>}
      </section>

      <section className="home-panel home-panel-week" aria-labelledby="manager-week-heading">
      <div className="home-section-head">
        <div><div className="home-kicker">Current week</div><h2 id="manager-week-heading">This week / upcoming</h2></div>
      </div>
      <div className="home-stat-grid">
        <button className="home-stat home-tone-info" onClick={() => setDrill({ zone: "week", title: "Tasks due this week", rows: week.due })}><b>{week.due.length}</b><span>Due this week</span></button>
        <button className="home-stat home-tone-success" onClick={() => setDrill({ zone: "week", title: "Tasks completed this week", rows: week.completed })}><b>{week.completed.length}</b><span>Completed</span></button>
        <button className="home-stat home-tone-danger" onClick={() => setDrill({ zone: "week", title: "Tasks overdue", rows: week.overdue })}><b>{week.overdue.length}</b><span>Overdue</span></button>
      </div>
      {upcomingProjects.length > 0 && <div className="home-upcoming">
        <div className="home-subhead">Project dates in the next 14 days</div>
        {upcomingProjects.map((project) => <button key={project.id} className="home-date-row" onClick={() => openProject(project.id)}>
          <span>{project.name}</span><time dateTime={project.ends_on}>{new Date(`${project.ends_on}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</time>
        </button>)}
      </div>}
      {upcomingProjects.length === 0 && <div className="home-quiet" style={{ marginTop: 14 }}>No project end dates are recorded in the next 14 days.</div>}
      {drill?.zone === "week" && <div className="home-drill">
        <div className="home-drill-head"><strong>{drill.title}</strong><span>{drillRows.length}</span></div>
        {drillRows.length ? drillRows.map((item) => <ActionRow key={item.id} item={item} openItem={openItem} />) : <div className="home-quiet">No tasks in this group.</div>}
      </div>}
      </section>

      {sheet?.type === "work" && <Sheet onClose={() => { setSheet(null); setComment(""); setReturnItems([]); setSelectedReturnItems([]); }}>
        <div className="h2">{sheet.decision === "completed" ? "Approve this work" : "Return this work"}</div>
        <p className="screen-note">{sheet.decision === "completed" ? "The approval is added to the submission history." : "Explain exactly what needs changing. Select any checklist points that must be done again."}</p>
        {sheet.decision === "returned" && returnItems.length > 0 && <>
          <div className="sec" style={{ marginTop: 14 }}><span>Checklist points to redo</span></div>
          <div className="card" style={{ padding: "2px 15px" }}>
            {returnItems.map((item) => (
              <button key={item.id} className={"ck " + (selectedReturnItems.includes(item.id) ? "done" : "")} onClick={() => toggleReturnItem(item.id)}>
                <span className={"box " + (selectedReturnItems.includes(item.id) ? "on" : "")} />
                <span className="ck-l">{item.label}</span>
              </button>
            ))}
          </div>
          <div className="hint">Leave these unselected if the correction is not tied to a checklist point.</div>
        </>}
        <textarea className="field" rows={3} placeholder={sheet.decision === "completed" ? "Note (optional)" : "What needs changing"} value={comment} onChange={(event) => setComment(event.target.value)} />
        <button className="btn" style={{ marginTop: 14 }} disabled={busy || (sheet.decision === "returned" && !comment.trim())} onClick={() => decideWork(sheet.item, sheet.decision)}>{busy ? "Saving..." : sheet.decision === "completed" ? "Approve" : "Return"}</button>
      </Sheet>}
      {sheet?.type === "leave" && <Sheet onClose={() => { setSheet(null); setComment(""); }}>
        <div className="h2">{sheet.decision === "declined" ? "Decline leave" : Number(sheet.item.days) > leaveLimit ? "Escalate leave" : "Approve leave"}</div>
        <textarea className="field" rows={3} placeholder="Decision note (optional)" value={comment} onChange={(event) => setComment(event.target.value)} />
        <button className="btn" style={{ marginTop: 14 }} disabled={busy} onClick={() => decideLeave(sheet.item, sheet.decision)}>{busy ? "Saving..." : "Save decision"}</button>
      </Sheet>}
      {sheet?.type === "blocker" && <Sheet onClose={() => { setSheet(null); setComment(""); }}>
        <div className="h2">Why does your unit disagree?</div>
        <textarea className="field" rows={3} placeholder="What is actually needed" value={comment} onChange={(event) => setComment(event.target.value)} />
        <button className="btn" style={{ marginTop: 14 }} disabled={busy || !comment.trim()} onClick={() => answerBlocker(sheet.item, "disputed")}>{busy ? "Saving..." : "Send response"}</button>
      </Sheet>}
      </div>}
    </div>
  );
}
