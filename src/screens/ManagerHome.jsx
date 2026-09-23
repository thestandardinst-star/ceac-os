import { useEffect, useState } from "react";
import AssistiveTextarea from "../components/AssistiveTextarea";
import { supabase } from "../lib/supabase";
import { dueLabel, isOverdue } from "../lib/time";
import { Sheet, statusPill, ProductNotice, LoadingState } from "../components/bits";
import { humanError } from "../lib/productLanguage";
import { DashboardCalendar, ReferenceModuleStrip } from "../components/ReferenceDashboard";

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

export default function ManagerHome({ me, openItem, openProject, openMeeting, scheduleMeeting, openPerson, goAssign, go }) {
  const [submissions, setSubmissions] = useState([]);
  const [leave, setLeave] = useState([]);
  const [blockers, setBlockers] = useState([]);
  const [team, setTeam] = useState({ present: [], leave: [], notStarted: [], completed: [], submitted: [] });
  const [mine, setMine] = useState([]);
  const [projects, setProjects] = useState([]);
  const [upcomingProjects, setUpcomingProjects] = useState([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const [week, setWeek] = useState({ due: [], completed: [], overdue: [] });
  const [recentMovement, setRecentMovement] = useState([]);
  const [routines, setRoutines] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [followupAlerts, setFollowupAlerts] = useState([]);
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

      const recentSince = new Date(today); recentSince.setDate(recentSince.getDate() - 7);
      const [memberResult, submissionResult, leaveResult, incomingBlockerResult, outgoingBlockerResult, mineResult,
        settingResult, sessionResult, weekResult, projectUnitResult, activeProjectResult,
        todayOutputResult, todaySubmissionResult, recentCompletedResult, recentSubmissionResult, followupAlertResult, meetingResult] = await Promise.all([
        supabase.from("unit_memberships")
          .select("profile_id, profiles!unit_memberships_profile_id_fkey(id, full_name)")
          .eq("unit_id", me.unit_id),
        supabase.from("submissions")
          .select("id, note, submitted_at, profiles!submissions_profile_id_fkey(full_name), work_items!inner(id, ref, title, kind, purpose, expected_outcome, unit_id, status, due_at), submission_files(url)")
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
        supabase.from("submissions").select("id, profile_id, submitted_at, profiles!submissions_profile_id_fkey(full_name), work_items!inner(id, ref, title, status, due_at, unit_id)")
          .eq("work_items.unit_id", me.unit_id)
          .gte("submitted_at", today.toISOString()).lt("submitted_at", tomorrow.toISOString()),
        supabase.from("work_items").select("id,ref,title,completed_at,assignee_id,profiles!work_items_assignee_id_fkey(full_name)")
          .eq("unit_id", me.unit_id).in("kind", ["task", "deliverable"]).in("status", ["completed", "self_certified"])
          .gte("completed_at", recentSince.toISOString()).order("completed_at", { ascending: false }).limit(8),
        supabase.from("submissions").select("id,profile_id,submitted_at,profiles!submissions_profile_id_fkey(full_name),work_items!inner(id,ref,title,unit_id)")
          .eq("work_items.unit_id", me.unit_id).gte("submitted_at", recentSince.toISOString())
          .order("submitted_at", { ascending: false }).limit(8),
        supabase.from("alerts")
          .select("id,kind,subject_type,subject_id,message,last_seen_at")
          .eq("for_unit_id", me.unit_id)
          .is("resolved_at", null)
          .in("kind", ["review_followup","blocker_followup"])
          .order("last_seen_at", { ascending: false }),
        supabase.from("meeting_sessions")
          .select("id,title,starts_at,ends_at,provider,status,scope,unit_id,project_id,projects(name)")
          .gte("starts_at", today.toISOString())
          .lt("starts_at", new Date(today.getTime() + 14 * 86400000).toISOString())
          .neq("status", "cancelled")
          .order("starts_at", { ascending: true })
          .limit(8),
      ]);

      const members = requireResult(memberResult, "Team").filter((member) => member.profile_id !== me.id);
      const memberIds = new Set(members.map((member) => member.profile_id));
      const submissionRows = requireResult(submissionResult, "Submissions");
      const latestSubmissionByWork = new Map();
      submissionRows.forEach((submission) => {
        const workId = submission.work_items?.id;
        if (!workId) return;
        const existing = latestSubmissionByWork.get(workId);
        if (!existing || new Date(submission.submitted_at) > new Date(existing.submitted_at)) {
          latestSubmissionByWork.set(workId, submission);
        }
      });
      setSubmissions([...latestSubmissionByWork.values()]
        .sort((left, right) => new Date(left.submitted_at) - new Date(right.submitted_at)));
      setFollowupAlerts(requireResult(followupAlertResult, "Follow-ups"));
      setUpcomingMeetings(requireResult(meetingResult, "Upcoming meetings"));
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

      const recentCompleted = requireResult(recentCompletedResult, "Recent completed work")
        .map((item) => ({ key: `completed-${item.id}`, type: "completed", at: item.completed_at, itemId: item.id, title: `${item.ref} · ${item.title}`, detail: `${item.profiles?.full_name || "Team member"} completed this work` }));
      const recentSubmitted = requireResult(recentSubmissionResult, "Recent submissions")
        .map((row) => ({ key: `submitted-${row.id}`, type: "submitted", at: row.submitted_at, itemId: row.work_items.id, title: `${row.work_items.ref} · ${row.work_items.title}`, detail: `${row.profiles?.full_name || "Team member"} submitted this work` }));
      setRecentMovement([...recentCompleted, ...recentSubmitted]
        .sort((left, right) => new Date(right.at) - new Date(left.at))
        .slice(0, 6));

      const requestResult = await supabase.from("work_requests")
        .select("work_item_id,request_state,responsible_unit_id, work_items!inner(id,ref,title,due_at,status,assigned_by)")
        .eq("responsible_unit_id", me.unit_id)
        .in("request_state", ["waiting", "clarification"])
        .order("responded_at", { ascending: true, nullsFirst: true });
      setIncomingRequests(requireResult(requestResult, "Incoming requests"));

      const routineResult = await supabase.from("recurring_operations")
        .select("id,name,work_item_id,active,schedule_kind,weekdays,day_of_month,records_value,value_label,starts_on,ends_on")
        .eq("unit_id", me.unit_id)
        .not("work_item_id", "is", null)
        .order("name");
      setRoutines(requireResult(routineResult, "Routines"));

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
        supabase.from("work_items").select("id, ref, title, project_id, objective_id, status, due_at, kind").in("project_id", projectIds),
      ]) : [{ data: [], error: null }, { data: [], error: null }];
      const objectives = requireResult(objectiveResult, "Project objectives");
      const projectTasks = requireResult(projectTaskResult, "Project tasks");
      setProjects(relevantProjects.map((project) => {
        const atRisk = objectives.filter((objective) => objective.project_id === project.id && ["at_risk", "not_met"].includes(objective.status));
        const closesThisWeek = project.ends_on && project.ends_on >= dateKey(today) && project.ends_on < dateKey(nextWeek);
        const projectWork = projectTasks.filter((item) => item.project_id === project.id);
        const tasksForProject = projectWork.filter((item) => item.kind === "task");
        const openDeliverables = projectWork.filter((item) => item.kind === "deliverable" && !["completed", "self_certified", "cancelled"].includes(item.status));
        const objectivesWithoutActiveWork = objectives.filter((objective) =>
          objective.project_id === project.id
          && ["on_track", "at_risk"].includes(objective.status)
          && !projectWork.some((item) => item.objective_id === objective.id && !["completed", "self_certified", "cancelled"].includes(item.status))
        );
        return { ...project, atRisk, closesThisWeek, tasks: tasksForProject,
          openDeliverables, objectivesWithoutActiveWork,
          completedTasks: tasksForProject.filter((task) => ["completed", "self_certified"].includes(task.status)).length,
          taskCount: tasksForProject.length };
      }).filter((project) => project.atRisk.length > 0 || project.closesThisWeek || project.openDeliverables.length > 0 || project.objectivesWithoutActiveWork.length > 0));
    } catch (err) {
      setLoadFailed(true);
      setError(humanError(err, "Manager Home could not be loaded."));
    } finally {
      setLoading(false);
    }
  }

  async function openReview(submission) {
    setError(null);
    setComment("");
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
    setSheet({ type: "work-review", item: submission, decision: null });
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
      const { error: approveError } = await supabase.rpc("approve_work_submission", {
        p_submission_id: submission.id,
        p_comment: comment.trim() || null,
      });
      if (approveError) throw approveError;
      setSheet(null); setComment(""); await load();
    } catch (err) { setError(humanError(err, "The review could not be saved.")); }
    finally { setBusy(false); }
  }

  async function decideLeave(request, decision) {
    setBusy(true); setError(null);
    try {
      const status = decision === "declined" ? "declined" : Number(request.days) > leaveLimit ? "escalated" : "approved";
      const action = status === "escalated" ? "escalated" : status === "declined" ? "declined" : "manager_approved";
      const { error: updateError } = await supabase.rpc("workforce_leave_action", {
        p_leave_request_id: request.id,
        p_action: action,
        p_reason: comment.trim() || "Manager dashboard decision",
      });
      if (updateError) throw updateError;
      setSheet(null); setComment(""); await load();
    } catch (err) { setError(humanError(err, "The leave decision could not be saved.")); }
    finally { setBusy(false); }
  }

  async function answerBlocker(blocker, state) {
    setBusy(true); setError(null);
    try {
      const { error: responseError } = await supabase.rpc("respond_to_blocker", {
        p_blocker_id: blocker.id, p_state: state, p_note: comment.trim() || null,
      });
      if (responseError) throw responseError;
      setSheet(null); setComment(""); await load();
    } catch (err) { setError(humanError(err, "The blocker response could not be saved.")); }
    finally { setBusy(false); }
  }

  async function resolveBlocker(blocker) {
    setBusy(true); setError(null);
    try {
      const { error: resolveError } = await supabase.rpc("resolve_blocker", {
        p_blocker_id: blocker.id, p_note: null,
      });
      if (resolveError) throw resolveError;
      await load();
    } catch (err) { setError(humanError(err, "The blocker could not be resolved.")); }
    finally { setBusy(false); }
  }

  const reviewFollowupByWork = new Map(followupAlerts.filter((alert) => alert.kind === "review_followup").map((alert) => [alert.subject_id, alert]));
  const blockerFollowupAlerts = followupAlerts.filter((alert) => alert.kind === "blocker_followup");
  const waitingCount = submissions.length + leave.length + blockerFollowupAlerts.length;
  const incomingBlockers = blockers.filter((blocker) => blocker.direction === "incoming");
  const outgoingBlockers = blockers.filter((blocker) => blocker.direction === "outgoing");
  const drillRows = drill?.rows || [];
  const ownTone = (item) => item.status === "returned" || isOverdue(item.due_at)
    ? "danger"
    : item.status === "waiting_on" ? "attention" : "info";
  const managerHour = new Date().getHours();
  const managerGreeting = managerHour < 12 ? "Good morning" : managerHour < 17 ? "Good afternoon" : "Good evening";
  const managerDate = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="body manager-home">
      <section className="manager-command-surface">
        <div className="manager-command-head">
          <div>
            <div className="manager-command-context"><span>{me.unit_name}</span><time>{managerDate}</time></div>
            <div className="eyebrow">Unit command</div>
            <h1 className="h1">{managerGreeting}, {me.full_name.split(" ")[0]}</h1>
            <p className="screen-note">Decisions first. Then check team movement, delivery and dependencies.</p>
          </div>
          <button className="btn manager-command-action" onClick={goAssign}>Give out work</button>
        </div>
        <div className="manager-command-stats" aria-label="Current manager attention">
          <div><strong>{waitingCount}</strong><span>Need decision</span></div>
          <div><strong>{blockers.length}</strong><span>Open blockers</span></div>
          <div><strong>{projects.length}</strong><span>Projects attention</span></div>
        </div>
      </section>
      <DashboardCalendar meetings={upcomingMeetings} />

      {error && <ProductNotice tone="error" title="Could not complete that" action={loadFailed ? <button className="btn btn-ghost btn-sm" onClick={load}>Try again</button> : null}>{error}</ProductNotice>}
      {loading && <LoadingState label="Loading Manager Home…" />}

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
          {reviewFollowupByWork.has(submission.work_items.id) && <div className="followup-note">Follow-up received · {new Date(reviewFollowupByWork.get(submission.work_items.id).last_seen_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</div>}
          {submission.note && <div className="row-note">&ldquo;{submission.note}&rdquo;</div>}
          {submission.submission_files?.map((file) => <a key={file.url} className="row-note" href={file.url} target="_blank" rel="noreferrer">Open submitted link</a>)}
          <div style={{ display: "flex", gap: 7, marginTop: 11, flexWrap: "wrap" }}>
            <button className="btn btn-ghost btn-sm" onClick={() => openItem(submission.work_items.id)}>Open full work</button>
            <button className="btn btn-sm" onClick={() => openReview(submission)}>Review</button>
          </div>
        </div>
      ))}
      {blockerFollowupAlerts.map((alert) => {
        const blocker = blockers.find((row) => row.id === alert.subject_id);
        return <div key={alert.id} className="row home-action-row">
          <div className="home-row-label">Dependency follow-up</div>
          <div className="row-t">{alert.message}</div>
          <div className="row-m">{new Date(alert.last_seen_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</div>
          {blocker && <button className="btn btn-ghost btn-sm" style={{ marginTop: 10 }} onClick={() => openItem(blocker.work_item_id)}>Open related work</button>}
        </div>;
      })}
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

      <section className="home-panel home-panel-projects" aria-labelledby="manager-projects-heading">
      <div className="home-section-head">
        <div><div className="home-kicker">Delivery risk</div><h2 id="manager-projects-heading">Projects needing attention</h2></div>
        <span className="home-count home-count-attention">{projects.length}</span>
      </div>
      {projects.length ? projects.map((project) => (
        <div key={project.id} className="row home-project-row">
          <button className="row-t" style={{ textDecoration: "underline", textAlign: "left" }} onClick={() => openProject(project.id)}>{project.name}</button>
          <div className="home-chip-row">
            {project.atRisk.length > 0 && <button className="home-chip home-chip-attention" onClick={() => openProject(project.id)}>{project.atRisk.length} objective{project.atRisk.length === 1 ? "" : "s"} need attention</button>}
            {project.objectivesWithoutActiveWork.length > 0 && <button className="home-chip home-chip-attention" onClick={() => openProject(project.id)}>{project.objectivesWithoutActiveWork.length} active objective{project.objectivesWithoutActiveWork.length === 1 ? "" : "s"} with no active work</button>}
            {project.closesThisWeek && <button className="home-chip home-chip-info" onClick={() => openProject(project.id)}>Ends this week</button>}
            {project.openDeliverables.length > 0 && <button className="home-chip" onClick={() => setDrill({ zone: "project", title: `${project.name} open deliverables`, rows: project.openDeliverables })}>{project.openDeliverables.length} open deliverable{project.openDeliverables.length === 1 ? "" : "s"}</button>}
          </div>
          {project.atRisk.map((objective) => <div key={objective.id} className="row-note">{objective.status === "not_met" ? "Not met" : "At risk"}: {objective.name}</div>)}
          {project.objectivesWithoutActiveWork.map((objective) => <div key={`no-work-${objective.id}`} className="row-note">No active work attached: {objective.name}</div>)}
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

      <section className="home-panel home-panel-waiting" aria-labelledby="manager-stuck-heading">
        <div className="home-section-head">
          <div><div className="home-kicker">Delivery risk</div><h2 id="manager-stuck-heading">Dependencies needing attention</h2></div>
          <span className="home-count">{blockers.length}</span>
        </div>
        {blockers.length === 0 && <div className="home-quiet">No acknowledged or unanswered blockers are open.</div>}
        {[{ label: "Waiting on us", rows: incomingBlockers }, { label: "Waiting on others", rows: outgoingBlockers }].map((group) => group.rows.length > 0 && <div key={group.label}>
          <div className="home-subhead">{group.label}</div>
          {group.rows.map((blocker) => <div key={blocker.id} className={`row home-blocker-row ${blocker.direction === "incoming" ? "home-tone-attention" : "home-tone-info"}`}>
              <div className="home-direction">{blocker.state === "claimed" ? "Unanswered claim" : "Acknowledged blocker"}</div>
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
                <button className="btn btn-ghost btn-sm" onClick={() => resolveBlocker(blocker)} disabled={busy}>Mark resolved</button>
              </div>
            </div>)}
        </div>)}
      </section>

      <section className="home-panel home-panel-pulse" aria-labelledby="manager-team-heading">
      <div className="home-section-head">
        <div><div className="home-kicker">Today</div><h2 id="manager-team-heading">Team context</h2></div>
      </div>
      <p className="home-context-note">Availability is context, not a performance measure.</p>
      <div className="home-subhead">Availability</div>
      <div className="home-stat-grid home-stat-grid-two">
        <button className="home-stat home-tone-success" onClick={() => setDrill({ zone: "team", title: "Present today", people: true, rows: team.present })}><b>{team.present.length}</b><span>Present</span></button>
        <button className="home-stat home-tone-info" onClick={() => setDrill({ zone: "team", title: "On approved leave today", people: true, rows: team.leave })}><b>{team.leave.length}</b><span>Approved leave</span></button>
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

      <section className="home-panel home-panel-week" aria-labelledby="manager-week-heading">
      <div className="home-section-head">
        <div><div className="home-kicker">Today & next</div><h2 id="manager-week-heading">Coming up</h2></div>
      </div>
      <div className="home-stat-grid">
        <button className="home-stat home-tone-info" onClick={() => setDrill({ zone: "week", title: "Tasks due this week", rows: week.due })}><b>{week.due.length}</b><span>Due this week</span></button>
        <button className="home-stat home-tone-success" onClick={() => setDrill({ zone: "week", title: "Tasks completed this week", rows: week.completed })}><b>{week.completed.length}</b><span>Completed</span></button>
        <button className="home-stat home-tone-danger" onClick={() => setDrill({ zone: "week", title: "Tasks overdue", rows: week.overdue })}><b>{week.overdue.length}</b><span>Overdue</span></button>
      </div>
      <div className="home-upcoming">
        <div className="home-subhead">Meetings in the next 14 days</div>
        {upcomingMeetings.length > 0 ? upcomingMeetings.map((meeting) => <button key={meeting.id} className="home-date-row home-meeting-row" onClick={() => openMeeting?.(meeting.id)}>
          <span><strong>{meeting.title}</strong><small>{meeting.scope === "project" && meeting.projects?.name ? meeting.projects.name : meeting.scope === "unit" ? me.unit_name : "CEAC"}</small></span>
          <time dateTime={meeting.starts_at}>{new Date(meeting.starts_at).toLocaleString("en-GB",{timeZone:"Africa/Accra",day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</time>
        </button>) : <div className="home-quiet">No meeting invitations are recorded in the next 14 days.</div>}
        {scheduleMeeting && <button className="text-action" style={{marginTop:10}} onClick={() => scheduleMeeting({scope:"unit",unitId:me.unit_id,unitName:me.unit_name})}>Schedule meeting</button>}
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

      <section className="home-panel" aria-labelledby="manager-own-heading">
      <div className="home-section-head">
        <div><div className="home-kicker">Personal focus</div><h2 id="manager-own-heading">Your own work</h2></div>
        <span className="home-count">{mine.length}</span>
      </div>
      {mine.length ? mine.map((item) => <ActionRow key={item.id} item={item} openItem={openItem} tone={ownTone(item)} />) : <div className="home-quiet">No due, overdue, returned or waiting work.</div>}
      </section>

      {incomingRequests.length > 0 && <section className="home-panel home-panel-waiting" aria-labelledby="manager-requests-heading">
        <div className="home-section-head">
          <div><div className="home-kicker">Other units are waiting</div><h2 id="manager-requests-heading">Requests to your unit</h2></div>
          <span className="home-count home-count-attention">{incomingRequests.length}</span>
        </div>
        {incomingRequests.map((request) => <button className="row" key={request.work_item_id} onClick={() => openItem(request.work_item_id)}>
          <div className="row-t">{request.work_items.title}</div>
          <div className="row-m">{request.work_items.ref}{request.work_items.due_at ? ` · due ${new Date(request.work_items.due_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : ""}</div>
          <div className="row-note">{request.request_state === "clarification" ? "Waiting for clarification" : "Waiting for your unit"}</div>
        </button>)}
      </section>}

      {routines.length > 0 && <section className="home-panel" aria-labelledby="manager-routines-heading">
        <div className="home-section-head">
          <div><div className="home-kicker">Recurring operations</div><h2 id="manager-routines-heading">Routines</h2></div>
          <span>{routines.length}</span>
        </div>
        {routines.map((routine) => <button className="row" key={routine.id} onClick={() => openItem(routine.work_item_id)}>
          <div className="row-t">{routine.name}</div>
          <div className="row-m">{!routine.schedule_kind
            ? "Schedule needs to be set"
            : routine.schedule_kind === "daily" ? "Daily"
              : routine.schedule_kind === "monthly" ? `Monthly · day ${routine.day_of_month}`
                : `${routine.schedule_kind === "weekly" ? "Weekly" : "Selected weekdays"} · ${(routine.weekdays || []).map((day) => ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][day - 1]).join(", ")}`}</div>
          <div className="row-note">{routine.active ? "Active" : "Paused"}{routine.records_value ? ` · records ${routine.value_label}` : ""}</div>
        </button>)}
      </section>}

      {recentMovement.length > 0 && <section className="home-panel home-panel-week" aria-labelledby="manager-recent-heading">
        <div className="home-section-head">
          <div><div className="home-kicker">Last seven days</div><h2 id="manager-recent-heading">Recent movement</h2></div>
        </div>
        {recentMovement.map((movement) => <button key={movement.key} className="row" onClick={() => openItem(movement.itemId)}>
          <div className="row-t">{movement.title}</div>
          <div className="row-m">{movement.detail}</div>
          <div className="row-note">{new Date(movement.at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</div>
        </button>)}
      </section>}

      <ReferenceModuleStrip items={[
        {label:"Work",icon:"work",note:"Assigned and delegated work.",onClick:()=>go?.("work")},
        {label:"Team",icon:"team",note:"People, workload and context.",onClick:()=>go?.("team")},
        {label:"Projects",icon:"projects",note:"Delivery and milestones.",onClick:()=>go?.("projects")},
        {label:"Budget",icon:"finance",note:"Requests and unit position.",onClick:()=>go?.("manager-finance")},
        {label:"Reports",icon:"reports",note:"Evidence and reporting.",onClick:()=>go?.("manager-reports")},
      ]}/>

      {sheet?.type === "work-review" && <Sheet onClose={() => { setSheet(null); setComment(""); setReturnItems([]); setSelectedReturnItems([]); }}>
        <div className="eyebrow">Evidence-first review</div>
        <div className="h2" style={{ marginTop: 5 }}>{sheet.item.work_items.title}</div>
        <p className="screen-note">{sheet.item.work_items.ref} · {sheet.item.profiles?.full_name || "Team member"} · submitted {new Date(sheet.item.submitted_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
        {sheet.item.work_items.purpose && <div className="review-evidence-block"><span>Why this work matters</span><strong>{sheet.item.work_items.purpose}</strong></div>}
        {sheet.item.work_items.expected_outcome && <div className="review-evidence-block"><span>Expected result</span><strong>{sheet.item.work_items.expected_outcome}</strong></div>}
        {sheet.item.note && <div className="review-evidence-block"><span>Submission note</span><strong>{sheet.item.note}</strong></div>}
        {sheet.item.submission_files?.length > 0 && <div className="review-evidence-links">
          {sheet.item.submission_files.map((file) => <a key={file.url} href={file.url} target="_blank" rel="noreferrer">Open submitted evidence ↗</a>)}
        </div>}
        {returnItems.length > 0 && <div className="review-checklist-summary">
          <span>Checklist</span>
          {returnItems.map((item) => <div key={item.id}>{item.label}</div>)}
        </div>}
        {!sheet.decision && <div className="review-decision-row">
          <button className="btn btn-ghost" onClick={() => setSheet((current) => ({ ...current, decision: "returned" }))}>Return for correction</button>
          <button className="btn" onClick={() => setSheet((current) => ({ ...current, decision: "completed" }))}>Approve</button>
        </div>}
        {sheet.decision === "returned" && <>
          <div className="sec" style={{ marginTop: 14 }}><span>What needs changing</span></div>
          {returnItems.length > 0 && <div className="card" style={{ padding: "2px 15px" }}>
            {returnItems.map((item) => (
              <button key={item.id} className={"ck " + (selectedReturnItems.includes(item.id) ? "done" : "")} onClick={() => toggleReturnItem(item.id)}>
                <span className={"box " + (selectedReturnItems.includes(item.id) ? "on" : "")} />
                <span className="ck-l">{item.label}</span>
              </button>
            ))}
          </div>}
          <AssistiveTextarea className="field" rows={3} placeholder="Explain exactly what needs changing" value={comment} onChange={(event) => setComment(event.target.value)} />
          <button className="btn" style={{ marginTop: 14 }} disabled={busy || !comment.trim()} onClick={() => decideWork(sheet.item, "returned")}>{busy ? "Saving..." : "Return work"}</button>
        </>}
        {sheet.decision === "completed" && <>
          <AssistiveTextarea className="field" rows={3} placeholder="Approval note (optional)" value={comment} onChange={(event) => setComment(event.target.value)} />
          <button className="btn" style={{ marginTop: 14 }} disabled={busy} onClick={() => decideWork(sheet.item, "completed")}>{busy ? "Saving..." : "Confirm approval"}</button>
        </>}
        {sheet.decision && <button className="text-action" style={{ marginTop: 12 }} onClick={() => { setComment(""); setSelectedReturnItems([]); setSheet((current) => ({ ...current, decision: null })); }}>Choose another decision</button>}
      </Sheet>}
      {sheet?.type === "leave" && <Sheet onClose={() => { setSheet(null); setComment(""); }}>
        <div className="h2">{sheet.decision === "declined" ? "Decline leave" : Number(sheet.item.days) > leaveLimit ? "Escalate leave" : "Approve leave"}</div>
        <AssistiveTextarea className="field" rows={3} placeholder="Decision note (optional)" value={comment} onChange={(event) => setComment(event.target.value)} />
        <button className="btn" style={{ marginTop: 14 }} disabled={busy} onClick={() => decideLeave(sheet.item, sheet.decision)}>{busy ? "Saving..." : "Save decision"}</button>
      </Sheet>}
      {sheet?.type === "blocker" && <Sheet onClose={() => { setSheet(null); setComment(""); }}>
        <div className="h2">Why does your unit disagree?</div>
        <AssistiveTextarea className="field" rows={3} placeholder="What is actually needed" value={comment} onChange={(event) => setComment(event.target.value)} />
        <button className="btn" style={{ marginTop: 14 }} disabled={busy || !comment.trim()} onClick={() => answerBlocker(sheet.item, "disputed")}>{busy ? "Saving..." : "Send response"}</button>
      </Sheet>}
      </div>}
    </div>
  );
}
