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

function ActionRow({ item, openItem }) {
  return (
    <button className="row" onClick={() => openItem(item.id)}>
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
  const [team, setTeam] = useState({ present: [], leave: [], notStarted: [] });
  const [mine, setMine] = useState([]);
  const [projects, setProjects] = useState([]);
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

  useEffect(() => { load(); }, [me.id, me.unit_id]);

  async function load() {
    if (!me.unit_id) return;
    setLoading(true);
    setError(null);
    try {
      const today = startOfDay();
      const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
      const weekStart = startOfWeek();
      const nextWeek = new Date(weekStart); nextWeek.setDate(nextWeek.getDate() + 7);

      const [memberResult, submissionResult, leaveResult, blockerResult, mineResult,
        settingResult, sessionResult, weekResult, projectUnitResult, activeProjectResult,
        todayOutputResult, todaySubmissionResult] = await Promise.all([
        supabase.from("unit_memberships")
          .select("profile_id, profiles!unit_memberships_profile_id_fkey(id, full_name)")
          .eq("unit_id", me.unit_id),
        supabase.from("submissions")
          .select("id, note, submitted_at, profiles!submissions_profile_id_fkey(full_name), work_items!inner(id, ref, title, unit_id, status), submission_files(url)")
          .eq("work_items.unit_id", me.unit_id).eq("work_items.status", "in_review")
          .neq("profile_id", me.id)
          .order("submitted_at", { ascending: true }),
        supabase.from("leave_requests")
          .select("id, profile_id, kind, start_date, end_date, days, status, reason, profiles!leave_requests_profile_id_fkey(full_name)")
          .eq("status", "pending").order("requested_at", { ascending: true }),
        supabase.from("blockers")
          .select("id, party_text, note, since, state, work_item_id, profiles!blockers_claimed_by_fkey(full_name), work_items!inner(id, ref, title)")
          .eq("party_unit_id", me.unit_id).in("state", ["claimed", "acknowledged"])
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
        supabase.from("work_items").select("id, assignee_id, completed_at")
          .eq("unit_id", me.unit_id).in("kind", ["task", "deliverable"])
          .eq("status", "completed")
          .gte("completed_at", today.toISOString()).lt("completed_at", tomorrow.toISOString()),
        supabase.from("submissions").select("id, profile_id, submitted_at, work_items!inner(unit_id)")
          .eq("work_items.unit_id", me.unit_id)
          .gte("submitted_at", today.toISOString()).lt("submitted_at", tomorrow.toISOString()),
      ]);

      const members = requireResult(memberResult, "Team").filter((member) => member.profile_id !== me.id);
      const memberIds = new Set(members.map((member) => member.profile_id));
      setSubmissions(requireResult(submissionResult, "Submissions"));
      setLeave(requireResult(leaveResult, "Leave requests").filter((request) => memberIds.has(request.profile_id)));
      setBlockers(requireResult(blockerResult, "Blockers"));
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
      const projectIds = relevantProjects.map((project) => project.id);
      const [objectiveResult, projectTaskResult] = projectIds.length ? await Promise.all([
        supabase.from("objectives").select("id, project_id, name, status").in("project_id", projectIds),
        supabase.from("work_items").select("id, ref, title, project_id, status, due_at, kind").in("project_id", projectIds).eq("kind", "task"),
      ]) : [{ data: [], error: null }, { data: [], error: null }];
      const objectives = requireResult(objectiveResult, "Project objectives");
      const projectTasks = requireResult(projectTaskResult, "Project tasks");
      setProjects(relevantProjects.map((project) => {
        const atRisk = objectives.filter((objective) => objective.project_id === project.id && objective.status === "at_risk");
        const closesThisWeek = project.ends_on && project.ends_on >= dateKey(today) && project.ends_on < dateKey(nextWeek);
        const tasksForProject = projectTasks.filter((task) => task.project_id === project.id);
        return { ...project, atRisk, closesThisWeek, tasks: tasksForProject,
          completedTasks: tasksForProject.filter((task) => ["completed", "self_certified"].includes(task.status)).length,
          taskCount: tasksForProject.length };
      }).filter((project) => project.atRisk.length > 0 || project.closesThisWeek));
    } catch (err) {
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

  const waitingCount = submissions.length + leave.length + blockers.length;
  const drillRows = drill?.rows || [];

  return (
    <div className="body">
      <div style={{ paddingTop: 26 }}>
        <div className="eyebrow">{me.unit_name}</div>
        <h1 className="h1" style={{ marginTop: 6 }}>{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</h1>
        <p className="screen-note">Unblock other people first, then see your team and your own work.</p>
      </div>
      <button className="btn wide-auto" style={{ marginTop: 16 }} onClick={goAssign}>Give out work</button>
      {error && <div className="flag flag-brick" style={{ marginTop: 14 }}><h4>Could not complete that</h4>{error}</div>}
      {loading && <div className="spin">Loading Manager Home...</div>}

      {!loading && <><div className="sec"><span>Waiting on you</span><span>{waitingCount}</span></div>
      {waitingCount === 0 && <div className="card small">Nothing is waiting on you.</div>}
      {submissions.map((submission) => (
        <div key={submission.id} className="row">
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
        <div key={request.id} className="row">
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
      {blockers.map((blocker) => (
        <div key={blocker.id} className="row">
          <div className="row-t">{blocker.work_items.title}</div>
          <div className="row-m">{blocker.profiles?.full_name || "Someone"} is waiting on your unit · {blocker.state}</div>
          <div className="row-note">{blocker.party_text}{blocker.note ? ` — ${blocker.note}` : ""}</div>
          <div style={{ display: "flex", gap: 7, marginTop: 11, flexWrap: "wrap" }}>
            <button className="btn btn-ghost btn-sm" onClick={() => openItem(blocker.work_item_id)}>Open</button>
            {blocker.state === "claimed" && <>
              <button className="btn btn-ghost btn-sm" onClick={() => setSheet({ type: "blocker", item: blocker })}>Disagree</button>
              <button className="btn btn-sm" onClick={() => answerBlocker(blocker, "acknowledged")}>Acknowledge</button>
            </>}
          </div>
        </div>
      ))}

      <div className="sec"><span>Your team today</span></div>
      <div className="metric-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <button className="metric" onClick={() => setDrill({ title: "Present today", people: true, rows: team.present })}><b>{team.present.length}</b><span>present</span></button>
        <button className="metric" onClick={() => setDrill({ title: "On leave today", people: true, rows: team.leave })}><b>{team.leave.length}</b><span>on leave</span></button>
        <button className="metric" onClick={() => setDrill({ title: "Not started today", people: true, rows: team.notStarted })}><b>{team.notStarted.length}</b><span>not started</span></button>
      </div>
      {drill?.people && <div style={{ marginTop: 8 }}>
        <div className="sec" style={{ marginTop: 12 }}><span>{drill.title}</span><span>{drillRows.length}</span></div>
        {drillRows.length ? drillRows.map((person) => <button key={person.id} className="row" onClick={() => openPerson(person.id, "current")}>
          <div className="row-t">{person.name}</div>
          <div className="row-m">{person.completed} completed today · {person.submitted} submitted today</div>
        </button>) : <div className="card small">Nobody in this group.</div>}
      </div>}

      <div className="sec"><span>Your own work</span><span>{mine.length}</span></div>
      {mine.length ? mine.map((item) => <ActionRow key={item.id} item={item} openItem={openItem} />) : <div className="card small">No due, overdue, returned or waiting work.</div>}

      <div className="sec"><span>Projects needing attention</span><span>{projects.length}</span></div>
      {projects.length ? projects.map((project) => (
        <div key={project.id} className="row">
          <button className="row-t" style={{ textDecoration: "underline", textAlign: "left" }} onClick={() => openProject(project.id)}>{project.name}</button>
          <div className="row-m">{project.atRisk.length > 0
            ? `${project.atRisk.length} objective${project.atRisk.length === 1 ? "" : "s"} at risk`
            : `closes ${new Date(`${project.ends_on}T00:00:00`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" })}`}</div>
          {project.atRisk.map((objective) => <div key={objective.id} className="row-note">At risk: {objective.name}</div>)}
          {project.atRisk.length > 0 && project.closesThisWeek && <div className="row-note">Closes {new Date(`${project.ends_on}T00:00:00`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" })}</div>}
          {project.taskCount > 0 && <button className="row-note" style={{ textDecoration: "underline" }} onClick={() => setDrill({ title: `${project.name} tasks`, rows: project.tasks })}>{project.completedTasks} of {project.taskCount} tasks completed</button>}
          <div><button className="btn btn-ghost btn-sm" style={{ marginTop: 10 }} onClick={() => openProject(project.id)}>Open project</button></div>
        </div>
      )) : <div className="card small">No active project has an at-risk objective or closes this week.</div>}

      <div className="sec"><span>This week</span></div>
      <div className="metric-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <button className="metric" onClick={() => setDrill({ title: "Tasks due this week", rows: week.due })}><b>{week.due.length}</b><span>tasks due</span></button>
        <button className="metric" onClick={() => setDrill({ title: "Tasks completed this week", rows: week.completed })}><b>{week.completed.length}</b><span>completed</span></button>
        <button className="metric" onClick={() => setDrill({ title: "Tasks overdue", rows: week.overdue })}><b>{week.overdue.length}</b><span>overdue</span></button>
      </div>
      {drill && !drill.people && <div style={{ marginTop: 8 }}>
        <div className="sec" style={{ marginTop: 12 }}><span>{drill.title}</span><span>{drillRows.length}</span></div>
        {drillRows.length ? drillRows.map((item) => <ActionRow key={item.id} item={item} openItem={openItem} />) : <div className="card small">No tasks in this group.</div>}
      </div>}

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
      </>}
    </div>
  );
}
