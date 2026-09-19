import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { Pill, Sheet } from "../components/bits";

const pad = (value) => String(value).padStart(2, "0");
const dateKey = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const parseDateOnly = (value) => { const [y, m, d] = String(value).slice(0, 10).split("-").map(Number); return new Date(y, m - 1, d); };
const addDays = (date, days) => { const next = new Date(date); next.setDate(next.getDate() + days); return next; };
const localDate = (value) => value ? dateKey(new Date(value)) : null;
const within = (value, start, end) => Boolean(value && value >= start && value <= end);
const COMPLETE = new Set(["completed", "self_certified"]);

function weekRange(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return { start: dateKey(start), end: dateKey(addDays(start, 6)), label: "This week" };
}

function monthRange(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start: dateKey(start), end: dateKey(end), label: now.toLocaleDateString("en-GB", { month: "long", year: "numeric" }) };
}

function countBy(rows, key) {
  const out = {};
  rows.forEach((row) => { const value = typeof key === "function" ? key(row) : row[key]; out[value || "Other"] = (out[value || "Other"] || 0) + 1; });
  return out;
}

function EvidenceMetric({ value, label, onClick }) {
  return <button className="metric" onClick={onClick}><b>{value}</b><span>{label}</span><span className="small" style={{ marginTop: 3 }}>Why?</span></button>;
}

function Bars({ rows, onOpen }) {
  const max = Math.max(1, ...rows.map((row) => row.value));
  return <div className="card">
    {rows.map((row) => <button key={row.label} onClick={() => onOpen(row)} style={{ display: "grid", gridTemplateColumns: "120px 1fr 34px", gap: 8, width: "100%", alignItems: "center", margin: "8px 0", textAlign: "left" }}>
      <span className="small">{row.label}</span>
      <span style={{ height: 8, background: "var(--line)", borderRadius: 99, overflow: "hidden" }}><span style={{ display: "block", height: "100%", width: `${(row.value / max) * 100}%`, background: "var(--ink)" }} /></span>
      <b className="small">{row.value}</b>
    </button>)}
  </div>;
}

function Donut({ rows, onOpen }) {
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  if (!total) return <div className="card small">No work is recorded for this view.</div>;
  let used = 0;
  const stops = rows.map((row, index) => {
    const start = (used / total) * 360;
    used += row.value;
    const end = (used / total) * 360;
    const shade = index % 3 === 0 ? "var(--ink)" : index % 3 === 1 ? "var(--amber)" : "var(--line)";
    return `${shade} ${start}deg ${end}deg`;
  }).join(",");
  return <div className="card" style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
    <div aria-label="Work composition" style={{ width: 118, height: 118, borderRadius: "50%", background: `conic-gradient(${stops})`, position: "relative" }}>
      <div style={{ position: "absolute", inset: 28, borderRadius: "50%", background: "var(--paper)" }} />
    </div>
    <div style={{ flex: 1, minWidth: 180 }}>
      {rows.map((row) => <button key={row.label} onClick={() => onOpen(row)} className="row" style={{ width: "100%", textAlign: "left" }}>
        <div className="row-t">{row.label}</div><div className="row-m">{row.value} work item{row.value === 1 ? "" : "s"}</div>
      </button>)}
    </div>
  </div>;
}

function Trend({ points, onOpen }) {
  const max = Math.max(1, ...points.map((point) => point.value));
  const width = 560, height = 120, padX = 8, padY = 10;
  const denom = Math.max(1, points.length - 1);
  const path = points.map((point, index) => {
    const x = padX + (index / denom) * (width - padX * 2);
    const y = height - padY - (point.value / max) * (height - padY * 2);
    return `${index === 0 ? "M" : "L"} ${x} ${y}`;
  }).join(" ");
  return <div className="card" style={{ overflowX: "auto" }}>
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", minWidth: 420, display: "block" }} role="img" aria-label="Completed work trend">
      <path d={path} fill="none" stroke="currentColor" strokeWidth="3" />
      {points.map((point, index) => {
        const x = padX + (index / denom) * (width - padX * 2);
        const y = height - padY - (point.value / max) * (height - padY * 2);
        return <circle key={point.date} cx={x} cy={y} r="4" fill="currentColor" onClick={() => onOpen(point)} style={{ cursor: "pointer" }} />;
      })}
    </svg>
    <div className="small">Each point opens the completed work behind that day.</div>
  </div>;
}

function ActivityHeat({ days, onOpen }) {
  const max = Math.max(1, ...days.map((day) => day.value));
  return <div className="card">
    <div style={{ display: "grid", gridTemplateColumns: "repeat(7,minmax(28px,1fr))", gap: 5 }}>
      {days.map((day) => <button key={day.date} title={`${day.date}: ${day.value} recorded attendance day${day.value === 1 ? "" : "s"}`} onClick={() => onOpen(day)} style={{ minHeight: 34, borderRadius: 5, opacity: 0.25 + 0.75 * (day.value / max), background: "var(--ink)", color: "var(--paper)", fontSize: 10 }}>{parseDateOnly(day.date).getDate()}</button>)}
    </div>
    <div className="small" style={{ marginTop: 8 }}>Darker days have more team members with a recorded work session. Tap a day for the underlying sessions.</div>
  </div>;
}

export default function ManagerReports({ me, openItem, openProject }) {
  const [mode, setMode] = useState("week");
  const [projectId, setProjectId] = useState("");
  const [projects, setProjects] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [work, setWork] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [objectives, setObjectives] = useState([]);
  const [members, setMembers] = useState([]);
  const [narrative, setNarrative] = useState("");
  const [challenges, setChallenges] = useState("");
  const [drill, setDrill] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadBase(); }, [me.id, me.unit_id]);

  async function loadBase() {
    setLoading(true); setError(null);
    const [projectResult, periodResult, workResult, memberResult, objectiveResult] = await Promise.all([
      supabase.from("projects").select("id,name,starts_on,ends_on,status").order("starts_on", { ascending: false, nullsFirst: false }),
      supabase.from("report_periods").select("id,kind,label,starts_on,ends_on,status").order("starts_on", { ascending: false }),
      supabase.from("work_items").select("id,ref,title,kind,status,due_at,completed_at,project_id,assignee_id,origin,projects(name),profiles!work_items_assignee_id_fkey(full_name)").eq("unit_id", me.unit_id).neq("visibility", "private"),
      supabase.from("unit_memberships").select("profile_id,profiles!unit_memberships_profile_id_fkey(full_name)").eq("unit_id", me.unit_id).eq("active", true),
      supabase.from("objectives").select("id,project_id,unit_id,ref,name,status").eq("unit_id", me.unit_id),
    ]);
    const first = [projectResult.error, periodResult.error, workResult.error, memberResult.error, objectiveResult.error].find(Boolean);
    if (first) { setError(first.message); setLoading(false); return; }
    setProjects(projectResult.data || []);
    setPeriods(periodResult.data || []);
    setWork(workResult.data || []);
    setMembers(memberResult.data || []);
    setObjectives(objectiveResult.data || []);

    const memberIds = (memberResult.data || []).map((row) => row.profile_id);
    const workIds = (workResult.data || []).map((row) => row.id);
    const [sessionResult, submissionResult] = await Promise.all([
      memberIds.length
        ? supabase.from("work_sessions").select("id,profile_id,started_at,ended_at,end_reason,profiles!work_sessions_profile_id_fkey(full_name)").in("profile_id", memberIds)
        : Promise.resolve({ data: [], error: null }),
      workIds.length
        ? supabase.from("submissions").select("id,work_item_id,profile_id,submitted_at,note,profiles!submissions_profile_id_fkey(full_name)").in("work_item_id", workIds)
        : Promise.resolve({ data: [], error: null }),
    ]);
    const second = [sessionResult.error, submissionResult.error].find(Boolean);
    if (second) { setError(second.message); setLoading(false); return; }
    setSessions(sessionResult.data || []);
    setSubmissions(submissionResult.data || []);
    setLoading(false);
  }

  const range = useMemo(() => {
    if (mode === "week") return weekRange();
    if (mode === "month") return monthRange();
    const project = projects.find((row) => row.id === projectId);
    if (!project) return null;
    const dates = work.filter((row) => row.project_id === project.id).flatMap((row) => [row.due_at ? localDate(row.due_at) : null, row.completed_at ? localDate(row.completed_at) : null]).filter(Boolean).sort();
    return {
      start: project.starts_on || dates[0] || dateKey(new Date()),
      end: project.ends_on || dates[dates.length - 1] || dateKey(new Date()),
      label: project.name,
    };
  }, [mode, projectId, projects, work]);

  const evidence = useMemo(() => {
    if (!range) return null;
    const projectFilter = mode === "project" ? (row) => row.project_id === projectId : () => true;
    const relevantWork = work.filter(projectFilter);
    const completed = relevantWork.filter((row) => COMPLETE.has(row.status) && within(localDate(row.completed_at), range.start, range.end));
    const due = relevantWork.filter((row) => within(localDate(row.due_at), range.start, range.end));
    const overdue = due.filter((row) => !COMPLETE.has(row.status) && row.status !== "waiting_on" && row.due_at && new Date(row.due_at) < new Date());
    const periodSubmissions = submissions.filter((row) => projectFilter(relevantWork.find((item) => item.id === row.work_item_id) || {}) && within(localDate(row.submitted_at), range.start, range.end));
    const periodSessions = sessions.filter((row) => within(localDate(row.started_at), range.start, range.end));
    const activeProjects = projects.filter((project) => relevantWork.some((row) => row.project_id === project.id));
    const relevantObjectives = objectives.filter((objective) => mode !== "project" || objective.project_id === projectId);
    return { relevantWork, completed, due, overdue, periodSubmissions, periodSessions, activeProjects, relevantObjectives };
  }, [range, mode, projectId, work, submissions, sessions, projects, objectives]);

  const matchingPeriod = useMemo(() => {
    if (!range) return null;
    return periods.find((period) => period.kind === mode && period.starts_on === range.start && period.ends_on === range.end && period.status === "open") || null;
  }, [periods, mode, range]);

  const daily = useMemo(() => {
    if (!range || !evidence) return [];
    const rows = [];
    let day = parseDateOnly(range.start), end = parseDateOnly(range.end);
    while (day <= end && rows.length < 62) {
      const key = dateKey(day);
      const items = evidence.completed.filter((row) => localDate(row.completed_at) === key);
      rows.push({ date: key, label: key, value: items.length, rows: items });
      day = addDays(day, 1);
    }
    return rows;
  }, [range, evidence]);

  const attendanceDays = useMemo(() => {
    if (!range || !evidence) return [];
    const rows = [];
    let day = parseDateOnly(range.start), end = parseDateOnly(range.end);
    while (day <= end && rows.length < 62) {
      const key = dateKey(day);
      const daySessions = evidence.periodSessions.filter((row) => localDate(row.started_at) === key);
      const people = new Set(daySessions.map((row) => row.profile_id));
      rows.push({ date: key, label: key, value: people.size, rows: daySessions });
      day = addDays(day, 1);
    }
    return rows;
  }, [range, evidence]);

  const statusRows = useMemo(() => {
    if (!evidence) return [];
    const labels = { completed: "Completed", self_certified: "Self-certified", in_review: "In review", returned: "Returned", waiting_on: "Waiting on", in_progress: "In progress", not_started: "Not started" };
    const groups = countBy(evidence.relevantWork, "status");
    return Object.entries(groups).map(([status, value]) => ({ label: labels[status] || status, value, rows: evidence.relevantWork.filter((row) => row.status === status) })).sort((a, b) => b.value - a.value);
  }, [evidence]);

  const projectRows = useMemo(() => {
    if (!evidence) return [];
    return evidence.activeProjects.map((project) => {
      const rows = evidence.relevantWork.filter((row) => row.project_id === project.id);
      return { label: project.name, value: rows.filter((row) => COMPLETE.has(row.status)).length, rows, projectId: project.id };
    }).sort((a, b) => b.value - a.value);
  }, [evidence]);

  function printReport() {
    window.print();
  }

  if (loading) return <div className="body"><div className="spin">Preparing reports...</div></div>;

  return <div className="body">
    <div style={{ paddingTop: 26 }}>
      <div className="eyebrow">{me.unit_name}</div>
      <h1 className="h1" style={{ marginTop: 6 }}>Reports</h1>
      <p className="screen-note">A factual unit report built from work, submissions, projects and attendance already recorded in CEAC OS. Nothing here invents progress.</p>
    </div>

    {error && <div className="flag flag-brick" style={{ marginTop: 14 }}><h4>Could not prepare reports</h4>{error}</div>}

    <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 14 }}>
      {[["week","Weekly"],["month","Monthly"],["project","Project"]].map(([key, label]) => <button key={key} className={"btn btn-sm " + (mode === key ? "" : "btn-ghost")} onClick={() => { setMode(key); setDrill(null); }}>{label}</button>)}
    </div>

    {mode === "project" && <select className="field" value={projectId} onChange={(event) => { setProjectId(event.target.value); setDrill(null); }}>
      <option value="">Choose a project</option>
      {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
    </select>}

    {!range && <div className="card small" style={{ marginTop: 14 }}>Choose a project to prepare its report.</div>}

    {range && evidence && <>
      <div className="sec"><span>{range.label}</span><span>{range.start} → {range.end}</span></div>

      <div className="metric-grid">
        <EvidenceMetric value={evidence.completed.length} label="completed in period" onClick={() => setDrill({ title: "Completed work", rows: evidence.completed, kind: "work" })} />
        <EvidenceMetric value={evidence.periodSubmissions.length} label="submissions" onClick={() => setDrill({ title: "Submissions", rows: evidence.periodSubmissions, kind: "submission" })} />
        <EvidenceMetric value={evidence.overdue.length} label="overdue from this period" onClick={() => setDrill({ title: "Overdue work", rows: evidence.overdue, kind: "work" })} />
        <EvidenceMetric value={new Set(evidence.periodSessions.map((row) => `${row.profile_id}:${localDate(row.started_at)}`)).size} label="recorded attendance days" onClick={() => setDrill({ title: "Attendance sessions", rows: evidence.periodSessions, kind: "session" })} />
      </div>

      {drill && <div style={{ marginTop: 12 }}>
        <div className="sec"><span>{drill.title}</span><span>{drill.rows.length}</span></div>
        {drill.rows.map((row) => drill.kind === "work"
          ? <button className="row" key={row.id} onClick={() => openItem(row.id)}><div className="row-t">{row.title}</div><div className="row-m">{row.ref} · {row.profiles?.full_name || "Unassigned"}</div></button>
          : drill.kind === "submission"
            ? <button className="row" key={row.id} onClick={() => openItem(row.work_item_id)}><div className="row-t">{row.profiles?.full_name || "Team member"} submitted work</div><div className="row-m">{new Date(row.submitted_at).toLocaleString("en-GB")}</div>{row.note && <div className="row-note">{row.note}</div>}</button>
            : <div className="row" key={row.id}><div className="row-t">{row.profiles?.full_name || "Team member"}</div><div className="row-m">{new Date(row.started_at).toLocaleString("en-GB")} {row.ended_at ? `→ ${new Date(row.ended_at).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}` : "· still open"}</div></div>)}
        {drill.rows.length === 0 && <div className="card small">No underlying rows.</div>}
      </div>}

      <div className="sec"><span>Completed work trend</span></div>
      <Trend points={daily} onOpen={(point) => setDrill({ title: `Completed on ${point.date}`, rows: point.rows, kind: "work" })} />

      <div className="sec"><span>Completed by project</span></div>
      {projectRows.length ? <Bars rows={projectRows} onOpen={(row) => row.projectId ? openProject(row.projectId) : setDrill({ title: row.label, rows: row.rows, kind: "work" })} /> : <div className="card small">No project work is recorded in this view.</div>}

      <div className="sec"><span>Work composition</span></div>
      <Donut rows={statusRows} onOpen={(row) => setDrill({ title: row.label, rows: row.rows, kind: "work" })} />

      <div className="sec"><span>Attendance activity</span></div>
      <ActivityHeat days={attendanceDays} onOpen={(day) => setDrill({ title: `Attendance · ${day.date}`, rows: day.rows, kind: "session" })} />

      <div className="sec"><span>Objectives</span><span>{evidence.relevantObjectives.length}</span></div>
      {evidence.relevantObjectives.map((objective) => <div className="row" key={objective.id}>
        <div className="row-t">{objective.ref} · {objective.name}</div>
        <div style={{ marginTop: 6 }}><Pill tone={objective.status === "at_risk" || objective.status === "not_met" ? "brick" : objective.status === "partly_met" ? "amber" : "green"}>{objective.status.replaceAll("_", " ")}</Pill></div>
        <div className="row-note">{evidence.relevantWork.filter((row) => row.project_id === objective.project_id && COMPLETE.has(row.status)).length} completed project work item(s) visible. This does not determine whether the objective was met.</div>
      </div>)}
      {evidence.relevantObjectives.length === 0 && <div className="card small">No objectives are recorded for this view.</div>}

      <div className="sec"><span>Manager narrative</span></div>
      <textarea className="field" rows={4} placeholder="What matters in this period? Add context supported by the work above." value={narrative} onChange={(event) => setNarrative(event.target.value)} />
      <textarea className="field" rows={3} placeholder="Challenges or corrections to explain (optional)" value={challenges} onChange={(event) => setChallenges(event.target.value)} />

      <div className="sec"><span>Report record</span></div>
      {matchingPeriod
        ? <div className="flag flag-amber"><h4>Draft persistence needs one database integrity fix</h4>This reporting period is open, but the current reports uniqueness rule treats empty person/project fields as distinct. Creating a report from the client could therefore create duplicate unit reports under concurrent saves. The evidence preview is safe; submission is intentionally withheld until the database makes one unit report per period collision-safe.</div>
        : <div className="card small">Administration has not opened a matching {mode} reporting period for these dates. You can review and print the factual preview, but it cannot yet be submitted as a report record.</div>}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
        <button className="btn btn-ghost" onClick={printReport}>Print / save PDF</button>
        <button className="btn" disabled title="Report submission is waiting for collision-safe report persistence.">Submit report</button>
      </div>
      <div className="hint">The print view uses the evidence currently shown. AI interpretation is not connected because no report AI function exists yet.</div>
    </>}
  </div>;
}
