import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { dateOnly, dueLabel, isOverdue } from "../lib/time";
import { Sheet, statusPill } from "../components/bits";

const CLOSED_WORK = ["completed", "cancelled"];

function dayStart(date = new Date()) {
  const d = new Date(date); d.setHours(0, 0, 0, 0); return d;
}

function nextDay(date = new Date()) {
  const d = dayStart(date); d.setDate(d.getDate() + 1); return d;
}

function weekBounds() {
  const start = dayStart();
  const day = start.getDay();
  start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
  const end = new Date(start); end.setDate(end.getDate() + 7);
  return { start, end };
}

export default function ManagerHome({ me, openItem, goAssign }) {
  const [queue, setQueue] = useState([]);
  const [leaveQueue, setLeaveQueue] = useState([]);
  const [approvalLimit, setApprovalLimit] = useState(null);
  const [team, setTeam] = useState([]);
  const [mine, setMine] = useState([]);
  const [projects, setProjects] = useState([]);
  const [weekItems, setWeekItems] = useState([]);
  const [open, setOpen] = useState(null);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => { load(); }, [me.unit_id]);

  async function load() {
    if (!me.unit_id) return;
    setLoading(true); setErr(null);
    try {
      const membersResult = await supabase.from("unit_memberships")
        .select("profile_id, profiles(full_name)").eq("unit_id", me.unit_id);
      if (membersResult.error) throw membersResult.error;
      const members = membersResult.data || [];
      const memberIds = members.map((m) => m.profile_id);
      const today = new Date().toISOString().slice(0, 10);
      const todayStart = dayStart();
      const tomorrow = nextDay();
      const { start: weekStart, end: weekEnd } = weekBounds();
      const soon = dayStart(); soon.setDate(soon.getDate() + 7);

      const memberQuery = (table, select) => {
        const q = supabase.from(table).select(select);
        return memberIds.length ? q.in("profile_id", memberIds) : null;
      };

      const results = await Promise.all([
        supabase.from("submissions")
          .select("id, note, submitted_at, profiles(full_name), work_items!inner(id, ref, title, unit_id, status), submission_files(url)")
          .eq("work_items.unit_id", me.unit_id).eq("work_items.status", "in_review")
          .order("submitted_at", { ascending: true }),
        memberQuery("leave_requests", "id, profile_id, kind, start_date, end_date, days, status, reason, profiles(full_name)"),
        memberQuery("work_sessions", "id, profile_id, started_at, ended_at"),
        supabase.from("work_items")
          .select("id, ref, title, status, due_at").eq("assignee_id", me.id)
          .not("status", "in", "(completed,cancelled)").lt("due_at", tomorrow.toISOString())
          .order("due_at", { ascending: true }),
        supabase.from("projects")
          .select("id, name, status, lead_unit_id, ends_on").eq("lead_unit_id", me.unit_id).eq("status", "active")
          .order("ends_on", { ascending: true, nullsFirst: false }),
        supabase.from("objectives")
          .select("id, ref, name, statement, status, project_id, unit_id").eq("unit_id", me.unit_id),
        supabase.from("work_items")
          .select("id, ref, title, status, due_at, completed_at, assignee_id")
          .eq("unit_id", me.unit_id).eq("kind", "task")
          .gte("due_at", weekStart.toISOString()).lt("due_at", weekEnd.toISOString())
          .order("due_at", { ascending: true }),
        supabase.from("leave_settings").select("manager_approval_limit").eq("org_id", me.org_id).maybeSingle(),
      ]);

      for (const result of results) if (result && result.error) throw result.error;
      const [subs, leavesResult, sessionsResult, myWork, projectResult, objectiveResult, weekResult, settings] = results;
      const leaves = leavesResult ? leavesResult.data || [] : [];
      const sessions = sessionsResult ? sessionsResult.data || [] : [];
      const onLeaveIds = new Set(leaves
        .filter((l) => l.status === "approved" && l.start_date <= today && l.end_date >= today)
        .map((l) => l.profile_id));
      const presentIds = new Set(sessions
        .filter((s) => new Date(s.started_at) >= todayStart && new Date(s.started_at) < tomorrow)
        .map((s) => s.profile_id));

      setQueue(subs.data || []);
      setLeaveQueue(leaves.filter((l) => l.status === "pending"));
      if (settings.data) setApprovalLimit(settings.data.manager_approval_limit);
      setTeam(members.map((m) => ({
        id: m.profile_id,
        name: m.profiles ? m.profiles.full_name : "—",
        state: onLeaveIds.has(m.profile_id) ? "on_leave" : presentIds.has(m.profile_id) ? "present" : "not_started",
      })));
      setMine((myWork.data || []).filter((i) => i.due_at && (isOverdue(i.due_at) || new Date(i.due_at).toDateString() === new Date().toDateString())));
      const objectives = objectiveResult.data || [];
      setProjects((projectResult.data || []).map((p) => {
        const projectObjectives = objectives.filter((o) => o.project_id === p.id);
        const atRisk = projectObjectives.filter((o) => o.status === "at_risk");
        const closesSoon = !!p.ends_on && new Date(p.ends_on + "T23:59:59") <= soon;
        return { ...p, objectives: projectObjectives, atRisk, closesSoon };
      }).filter((p) => p.atRisk.length || p.closesSoon));
      setWeekItems((weekResult.data || []).map((i) => ({
        ...i,
        assigneeName: (members.find((m) => m.profile_id === i.assignee_id) || {}).profiles?.full_name || "—",
      })));
    } catch (e) {
      setErr(e.message || "The manager home could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  async function decide(sub, decision) {
    setBusy(true); setErr(null);
    try {
      const review = await supabase.from("reviews").insert({
        org_id: me.org_id, submission_id: sub.id, reviewer_id: me.id,
        decision, comment: comment || null, seen_at: new Date().toISOString(),
      });
      if (review.error) throw review.error;
      const wi = sub.work_items;
      if (decision === "completed") {
        const submissions = await supabase.from("submissions").select("id").eq("work_item_id", wi.id);
        if (submissions.error) throw submissions.error;
        const ids = (submissions.data || []).map((x) => x.id);
        let returnedCount = 0;
        if (ids.length) {
          const returned = await supabase.from("reviews").select("id", { count: "exact", head: true })
            .eq("decision", "returned").in("submission_id", ids);
          if (returned.error) throw returned.error;
          returnedCount = returned.count || 0;
        }
        const update = await supabase.from("work_items").update({
          status: "completed", completed_at: new Date().toISOString(),
          first_time_approved: returnedCount === 0, last_movement_at: new Date().toISOString(),
        }).eq("id", wi.id);
        if (update.error) throw update.error;
      } else {
        const update = await supabase.from("work_items").update({
          status: "returned", first_time_approved: false, last_movement_at: new Date().toISOString(),
        }).eq("id", wi.id);
        if (update.error) throw update.error;
      }
      setOpen(null); setComment(""); await load();
    } catch (e) {
      setErr(e.message || "That review could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  async function decideLeave(request, decision) {
    setBusy(true); setErr(null);
    try {
      if (decision === "approved" && approvalLimit === null) {
        throw new Error("The leave approval limit has not been set. Admin must set it before leave can be approved.");
      }
      const escalates = decision === "approved" && request.days > approvalLimit;
      const status = decision === "declined" ? "declined" : escalates ? "escalated" : "approved";
      const result = await supabase.from("leave_requests").update({
        status, decided_by: me.id, decided_at: new Date().toISOString(),
      }).eq("id", request.id);
      if (result.error) throw result.error;
      await load();
    } catch (e) {
      setErr(e.message || "That leave decision could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  const waitingCount = queue.length + leaveQueue.length;
  const present = team.filter((m) => m.state === "present");
  const onLeave = team.filter((m) => m.state === "on_leave");
  const notStarted = team.filter((m) => m.state === "not_started");
  const weekCompleted = weekItems.filter((i) => i.status === "completed");
  const weekOverdue = weekItems.filter((i) => isOverdue(i.due_at) && !CLOSED_WORK.includes(i.status));

  if (loading) return <div className="body"><div className="spin">Loading your unit...</div></div>;

  return (
    <div className="body">
      <div style={{ paddingTop: 26 }}>
        <div className="eyebrow">{me.unit_name}</div>
        <h1 className="h1" style={{ marginTop: 6 }}>{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</h1>
        <p className="screen-note">Clear what is waiting on you first. Then look at the team, your own work and the week ahead.</p>
      </div>
      <button className="btn wide-auto" style={{ marginTop: 16 }} onClick={goAssign}>Give out work</button>
      {err && <div className="flag flag-brick" style={{ marginTop: 12 }}>{err}</div>}

      <div className="sec"><span>Waiting on you</span><span>{waitingCount}</span></div>
      {waitingCount === 0 && <div className="card small">Nothing is waiting for your decision.</div>}
      {leaveQueue.length > 0 && approvalLimit === null && (
        <div className="flag flag-amber">The leave approval limit has not been set. Leave can be declined here, but Admin must set the limit before it can be approved or sent up.</div>)}
      {queue.map((s) => (
        <div key={s.id} className="row">
          <div className="row-t">{s.work_items.title}</div>
          <div className="row-m">{s.work_items.ref} · {s.profiles ? s.profiles.full_name : "—"}</div>
          {s.note && <div className="row-note">&ldquo;{s.note}&rdquo;</div>}
          <div style={{ display: "flex", gap: 7, marginTop: 11, flexWrap: "wrap" }}>
            <button className="btn btn-ghost btn-sm" onClick={() => openItem(s.work_items.id)}>Open</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setOpen({ type: "review", item: s, decision: "returned" })}>Return</button>
            <button className="btn btn-sm" onClick={() => setOpen({ type: "review", item: s, decision: "completed" })}>Approve</button>
          </div>
        </div>))}
      {leaveQueue.map((r) => (
        <div key={r.id} className="row">
          <div className="row-t">{r.profiles ? r.profiles.full_name : "—"} · {r.days} day{r.days === 1 ? "" : "s"} leave</div>
          <div className="row-m">{dateOnly(r.start_date)} — {dateOnly(r.end_date)}{r.reason ? " · " + r.reason : ""}</div>
          <div style={{ display: "flex", gap: 7, marginTop: 11 }}>
            <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => decideLeave(r, "declined")}>Decline</button>
            <button className="btn btn-sm" disabled={busy || approvalLimit === null} onClick={() => decideLeave(r, "approved")}>
              {approvalLimit === null ? "Approval limit not set" : r.days > approvalLimit ? "Send to Admin" : "Approve"}</button>
          </div>
        </div>))}

      <div className="sec"><span>Your team today</span><span>{team.length}</span></div>
      <button className="row" onClick={() => setOpen({ type: "team" })}>
        <div className="row-t">{present.length} present · {onLeave.length} on leave · {notStarted.length} not started</div>
        <div className="row-m">Open to see the names behind these figures</div>
      </button>

      <div className="sec"><span>Your own work</span><span>{mine.length}</span></div>
      {mine.length === 0 && <div className="card small">Nothing due today or overdue.</div>}
      {mine.map((i) => (
        <button key={i.id} className="row" onClick={() => openItem(i.id)}>
          <div className="row-t">{i.title}</div>
          <div className="row-m">{i.ref} · {dueLabel(i.due_at)}</div>
        </button>))}

      <div className="sec"><span>Projects needing attention</span><span>{projects.length}</span></div>
      {projects.length === 0 && <div className="card small">No active project is closing in the next seven days or has an objective at risk.</div>}
      {projects.map((p) => (
        <button key={p.id} className="row" onClick={() => setOpen({ type: "project", project: p })}>
          <div className="row-t">{p.name}</div>
          <div className="row-m">
            {p.atRisk.length ? p.atRisk.length + " objective" + (p.atRisk.length === 1 ? "" : "s") + " at risk" : ""}
            {p.atRisk.length && p.closesSoon ? " · " : ""}{p.closesSoon ? "closes " + dateOnly(p.ends_on) : ""}
          </div>
        </button>))}

      <div className="sec"><span>This week</span></div>
      <button className="row" onClick={() => setOpen({ type: "week" })}>
        <div className="row-t">{weekItems.length} tasks due · {weekCompleted.length} completed · {weekOverdue.length} overdue</div>
        <div className="row-m">Open to see every task behind these figures</div>
      </button>

      {open && (
        <Sheet onClose={() => { setOpen(null); setComment(""); }}>
          {open.type === "review" && (<>
            <div className="h2">{open.decision === "completed" ? "Approve this work" : "Return this work"}</div>
            <p className="screen-note">{open.decision === "completed" ? "The staff member will see that it was approved." : "Say what needs changing. The staff member will see your note."}</p>
            <textarea className="field" rows={3} placeholder={open.decision === "completed" ? "A note (optional)" : "What needs to change"}
              value={comment} onChange={(e) => setComment(e.target.value)} />
            <button className="btn" style={{ marginTop: 14 }} disabled={busy || (open.decision === "returned" && !comment.trim())}
              onClick={() => decide(open.item, open.decision)}>{busy ? "Saving..." : open.decision === "completed" ? "Approve" : "Return"}</button>
          </>)}
          {open.type === "team" && (<>
            <div className="h2">Your team today</div>
            {team.map((m) => (
              <div key={m.id} className="row">
                <div className="row-t">{m.name}</div>
                <div className="row-m">{m.state === "present" ? "Present" : m.state === "on_leave" ? "On leave" : "Not started"}</div>
              </div>))}
          </>)}
          {open.type === "project" && (<>
            <div className="h2">{open.project.name}</div>
            <p className="screen-note">{open.project.ends_on ? "Closes " + dateOnly(open.project.ends_on) : "No closing date recorded"}</p>
            <div className="sec"><span>Objectives</span><span>{open.project.objectives.length}</span></div>
            {open.project.objectives.length === 0 && <div className="card small">No objectives are recorded for this project.</div>}
            {open.project.objectives.map((o) => (
              <div key={o.id} className="row">
                <div className="row-t">{o.ref ? o.ref + " · " : ""}{o.name}</div>
                <div className="row-m">{o.status ? o.status.replace(/_/g, " ") : "No status set"}</div>
              </div>))}
          </>)}
          {open.type === "week" && (<>
            <div className="h2">Tasks due this week</div>
            {weekItems.length === 0 && <div className="card small">No tasks are due this week.</div>}
            {weekItems.map((i) => (
              <button key={i.id} className="row" onClick={() => { setOpen(null); openItem(i.id); }}>
                <div className="row-t">{i.title}</div>
                <div className="row-m">{i.ref} · {i.assigneeName} · {dueLabel(i.due_at)}</div>
                <div style={{ marginTop: 7 }}>{statusPill(i.status)}</div>
              </button>))}
          </>)}
        </Sheet>)}
    </div>);
}
