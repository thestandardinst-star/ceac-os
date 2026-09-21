import { useEffect, useMemo, useState } from "react";
import AssistiveTextarea from "../components/AssistiveTextarea";
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

function distinctAttendanceDays(rows) {
  const seen = new Set();
  const kept = [];
  rows.forEach((row) => {
    const key = `${row.profile_id}:${localDate(row.started_at)}`;
    if (!seen.has(key)) { seen.add(key); kept.push(row); }
  });
  return kept;
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
    <div className="small">Each point opens the work behind that day.</div>
  </div>;
}

function ActivityHeat({ days, onOpen }) {
  const max = Math.max(1, ...days.map((day) => day.value));
  return <div className="card">
    <div style={{ display: "grid", gridTemplateColumns: "repeat(7,minmax(28px,1fr))", gap: 5 }}>
      {days.map((day) => <button key={day.date} title={`${day.date}: ${day.value} team attendance day${day.value === 1 ? "" : "s"}`} onClick={() => onOpen(day)} style={{ minHeight: 34, borderRadius: 5, opacity: 0.25 + 0.75 * (day.value / max), background: "var(--ink)", color: "var(--paper)", fontSize: 10 }}>{parseDateOnly(day.date).getDate()}</button>)}
    </div>
    <div className="small" style={{ marginTop: 8 }}>Darker days have more team members with a recorded work session. Tap a day for the underlying sessions.</div>
  </div>;
}

export default function ManagerReports({ me, openItem }) {
  const [mode, setMode] = useState("week");
  const [projectId, setProjectId] = useState("");
  const [selectedPeriodId, setSelectedPeriodId] = useState("");
  const [projects, setProjects] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [work, setWork] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [memberIds, setMemberIds] = useState([]);
  const [objectives, setObjectives] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [reportRefs, setReportRefs] = useState([]);
  const [narrative, setNarrative] = useState("");
  const [challenges, setChallenges] = useState("");
  const [correctionReason, setCorrectionReason] = useState("");
  const [sheet, setSheet] = useState(null);
  const [drill, setDrill] = useState(null);
  const [notice, setNotice] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => { loadBase(); }, [me.id, me.unit_id]);

  async function loadBase() {
    setLoading(true); setError(null);
    const [projectResult, periodResult, workResult, memberResult, objectiveResult] = await Promise.all([
      supabase.from("projects").select("id,name,starts_on,ends_on,status,lead_unit_id,project_units(unit_id)").order("starts_on", { ascending: false, nullsFirst: false }),
      supabase.from("report_periods").select("id,kind,label,starts_on,ends_on,status").order("starts_on", { ascending: false }),
      supabase.from("work_items").select("id,ref,title,kind,status,due_at,completed_at,project_id,assignee_id,origin,projects(name),profiles!work_items_assignee_id_fkey(full_name)").eq("unit_id", me.unit_id).neq("visibility", "private"),
      supabase.from("unit_memberships").select("profile_id").eq("unit_id", me.unit_id),
      supabase.from("objectives").select("id,project_id,unit_id,ref,name,status").eq("unit_id", me.unit_id),
    ]);
    const first = [projectResult.error, periodResult.error, workResult.error, memberResult.error, objectiveResult.error].find(Boolean);
    if (first) { setError(first.message); setLoading(false); return; }
    setProjects((projectResult.data || []).filter((project) => project.lead_unit_id === me.unit_id || (project.project_units || []).some((row) => row.unit_id === me.unit_id)));
    setPeriods(periodResult.data || []);
    setWork(workResult.data || []);
    setObjectives(objectiveResult.data || []);

    setMemberIds((memberResult.data || []).map((row) => row.profile_id));
    setSessions([]);
    setSubmissions([]);
    setLoading(false);
  }

  const baseRange = useMemo(() => mode === "week" ? weekRange() : mode === "month" ? monthRange() : null, [mode]);
  const kindPeriods = useMemo(() => periods.filter((period) => period.kind === mode), [periods, mode]);

  const matchingPeriod = useMemo(() => {
    if (selectedPeriodId) return periods.find((period) => period.id === selectedPeriodId && period.kind === mode) || null;
    if (mode === "project" || !baseRange) return null;
    return periods.find((period) => period.kind === mode && period.starts_on === baseRange.start && period.ends_on === baseRange.end && period.status === "open")
      || periods.find((period) => period.kind === mode && period.starts_on === baseRange.start && period.ends_on === baseRange.end)
      || null;
  }, [mode, selectedPeriodId, periods, baseRange]);

  const range = useMemo(() => {
    if (mode !== "project") {
      if (matchingPeriod) return { start: matchingPeriod.starts_on, end: matchingPeriod.ends_on, label: matchingPeriod.label };
      return baseRange;
    }
    const project = projects.find((row) => row.id === projectId);
    if (!project) return null;
    if (matchingPeriod) return { start: matchingPeriod.starts_on, end: matchingPeriod.ends_on, label: `${project.name} · ${matchingPeriod.label}` };
    const dates = work.filter((row) => row.project_id === project.id).flatMap((row) => [row.due_at ? localDate(row.due_at) : null, row.completed_at ? localDate(row.completed_at) : null]).filter(Boolean).sort();
    return {
      start: project.starts_on || dates[0] || dateKey(new Date()),
      end: project.ends_on || dates[dates.length - 1] || dateKey(new Date()),
      label: project.name,
    };
  }, [mode, baseRange, matchingPeriod, projectId, projects, work]);

  useEffect(() => {
    if (!range || !memberIds.length) {
      setSessions([]);
      setSubmissions([]);
      return;
    }
    let cancelled = false;
    async function loadPeriodRows() {
      const start = new Date(range.start + "T00:00:00");
      const endExclusive = new Date(range.end + "T00:00:00");
      endExclusive.setDate(endExclusive.getDate() + 1);
      const relevantWorkIds = work
        .filter((row) => mode !== "project" || row.project_id === projectId)
        .map((row) => row.id);

      const [sessionResult, submissionResult] = await Promise.all([
        supabase.from("work_sessions")
          .select("id,profile_id,work_item_id,started_at,ended_at,end_reason,profiles!work_sessions_profile_id_fkey(full_name)")
          .in("profile_id", memberIds)
          .gte("started_at", start.toISOString())
          .lt("started_at", endExclusive.toISOString()),
        relevantWorkIds.length
          ? supabase.from("submissions")
              .select("id,work_item_id,profile_id,submitted_at,note,profiles!submissions_profile_id_fkey(full_name)")
              .in("work_item_id", relevantWorkIds)
              .gte("submitted_at", start.toISOString())
              .lt("submitted_at", endExclusive.toISOString())
          : Promise.resolve({ data: [], error: null }),
      ]);
      if (cancelled) return;
      const periodError = sessionResult.error || submissionResult.error;
      if (periodError) {
        setError(periodError.message);
        return;
      }
      setSessions(sessionResult.data || []);
      setSubmissions(submissionResult.data || []);
    }
    loadPeriodRows();
    return () => { cancelled = true; };
  }, [range?.start, range?.end, mode, projectId, memberIds.join(","), work]);

  const evidence = useMemo(() => {
    if (!range) return null;
    const projectFilter = mode === "project" ? (row) => row.project_id === projectId : () => true;
    const relevantWork = work.filter(projectFilter);
    const completed = relevantWork.filter((row) => ["task", "deliverable"].includes(row.kind) && COMPLETE.has(row.status) && within(localDate(row.completed_at), range.start, range.end));
    const due = relevantWork.filter((row) => within(localDate(row.due_at), range.start, range.end));
    const overdue = due.filter((row) => !COMPLETE.has(row.status) && row.status !== "waiting_on" && row.due_at && new Date(row.due_at) < new Date());
    const workIds = new Set(relevantWork.map((row) => row.id));
    const periodSubmissions = submissions.filter((row) => workIds.has(row.work_item_id) && within(localDate(row.submitted_at), range.start, range.end));
    const periodSessions = sessions.filter((row) => within(localDate(row.started_at), range.start, range.end) && (mode !== "project" || (row.work_item_id && workIds.has(row.work_item_id))));
    const attendanceDays = distinctAttendanceDays(periodSessions);
    const activeProjects = projects.filter((project) => relevantWork.some((row) => row.project_id === project.id));
    const relevantObjectives = objectives.filter((objective) => mode !== "project" || objective.project_id === projectId);
    return { relevantWork, completed, due, overdue, periodSubmissions, periodSessions, attendanceDays, activeProjects, relevantObjectives };
  }, [range, mode, projectId, work, submissions, sessions, projects, objectives]);

  const daily = useMemo(() => {
    if (!range || !evidence) return [];
    const rows = [];
    let day = parseDateOnly(range.start), end = parseDateOnly(range.end);
    while (day <= end && rows.length < 62) {
      const key = dateKey(day);
      const items = evidence.completed.filter((row) => localDate(row.completed_at) === key);
      rows.push({ date: key, label: key, value: items.length, rows: items, section: `completed_day:${key}` });
      day = addDays(day, 1);
    }
    return rows;
  }, [range, evidence]);

  const attendanceHeat = useMemo(() => {
    if (!range || !evidence) return [];
    const rows = [];
    let day = parseDateOnly(range.start), end = parseDateOnly(range.end);
    while (day <= end && rows.length < 62) {
      const key = dateKey(day);
      const dayRows = distinctAttendanceDays(evidence.periodSessions.filter((row) => localDate(row.started_at) === key));
      rows.push({ date: key, label: key, value: dayRows.length, rows: dayRows, section: `attendance_day:${key}` });
      day = addDays(day, 1);
    }
    return rows;
  }, [range, evidence]);

  const statusRows = useMemo(() => {
    if (!evidence) return [];
    const labels = { completed: "Completed", self_certified: "Self-certified", in_review: "In review", returned: "Returned", waiting_on: "Waiting on", in_progress: "In progress", not_started: "Not started" };
    const groups = countBy(evidence.relevantWork, "status");
    return Object.entries(groups).map(([status, value]) => ({
      label: labels[status] || status, value, rows: evidence.relevantWork.filter((row) => row.status === status), section: `status:${status}`,
    })).sort((a, b) => b.value - a.value);
  }, [evidence]);

  const projectRows = useMemo(() => {
    if (!evidence) return [];
    return evidence.activeProjects.map((project) => {
      const rows = evidence.completed.filter((row) => row.project_id === project.id);
      return { label: project.name, value: rows.length, rows, projectId: project.id, section: `project:${project.id}` };
    }).filter((row) => row.value > 0).sort((a, b) => b.value - a.value);
  }, [evidence]);

  const scope = mode === "project" ? "project" : "unit";

  useEffect(() => {
    setSelectedReportId(null);
    setReportRefs([]);
    setHistory([]);
    setNotice(null);
    if (matchingPeriod && (scope === "unit" || projectId)) loadHistory();
  }, [matchingPeriod?.id, scope, projectId]);

  async function loadHistory(preferDraft = true) {
    if (!matchingPeriod) return;
    let query = supabase.from("reports")
      .select("id,period_id,scope,unit_id,project_id,narrative,challenges,status,version,correction_reason,supersedes_report_id,evidence,submitted_at,submitted_by")
      .eq("period_id", matchingPeriod.id)
      .eq("scope", scope)
      .eq("unit_id", me.unit_id)
      .order("version", { ascending: false });
    query = scope === "project" ? query.eq("project_id", projectId) : query.is("project_id", null);
    const result = await query;
    if (result.error) { setError(result.error.message); return; }
    const rows = result.data || [];
    setHistory(rows);
    const draft = rows.find((row) => row.status === "draft");
    const latestSubmitted = rows.find((row) => row.status === "submitted");
    if (preferDraft && draft) {
      setSelectedReportId(null);
      setNarrative(draft.narrative || "");
      setChallenges(draft.challenges || "");
      setReportRefs([]);
    } else if (latestSubmitted) {
      setSelectedReportId(latestSubmitted.id);
      setNarrative(latestSubmitted.narrative || "");
      setChallenges(latestSubmitted.challenges || "");
    } else {
      setSelectedReportId(null);
      setNarrative("");
      setChallenges("");
      setReportRefs([]);
    }
  }

  useEffect(() => {
    if (!selectedReportId) { setReportRefs([]); return; }
    loadRefs(selectedReportId);
  }, [selectedReportId]);

  async function loadRefs(reportId) {
    const result = await supabase.from("report_evidence_refs")
      .select("id,report_id,section,object_type,object_id,label")
      .eq("report_id", reportId);
    if (result.error) { setError(result.error.message); return; }
    setReportRefs(result.data || []);
  }

  const draft = history.find((row) => row.status === "draft") || null;
  const latestSubmitted = history.find((row) => row.status === "submitted") || null;
  const frozenReport = selectedReportId ? history.find((row) => row.id === selectedReportId) || null : (!draft ? latestSubmitted : null);
  const frozen = frozenReport?.evidence || null;
  const viewingFrozen = Boolean(frozenReport && frozen);

  const liveCounts = evidence ? {
    completed: evidence.completed.length,
    submissions: evidence.periodSubmissions.length,
    overdue: evidence.overdue.length,
    attendance_days: evidence.attendanceDays.length,
  } : { completed: 0, submissions: 0, overdue: 0, attendance_days: 0 };

  const displayCounts = viewingFrozen ? (frozen.counts || liveCounts) : liveCounts;
  const displayDaily = viewingFrozen ? (frozen.daily || []) : daily;
  const displayProjects = viewingFrozen ? (frozen.by_project || []) : projectRows;
  const displayStatus = viewingFrozen ? (frozen.status_mix || []) : statusRows;
  const displayAttendance = viewingFrozen ? (frozen.attendance || []) : attendanceHeat;
  const displayObjectives = viewingFrozen ? (frozen.objectives || []) : (evidence?.relevantObjectives || []);

  function rowsForSection(section) {
    return reportRefs.filter((row) => row.section === section);
  }

  function openFrozenSection(section, title) {
    setDrill({ title, rows: rowsForSection(section), kind: "ref" });
  }

  function openLive(section, title, rows, kind) {
    setDrill({ title, rows, kind, section });
  }

  async function saveDraft(showNotice = true) {
    if (!matchingPeriod || matchingPeriod.status !== "open") throw new Error("Administration must open this reporting period before you can save a report.");
    const result = await supabase.rpc("save_report_draft", {
      p_period_id: matchingPeriod.id,
      p_scope: scope,
      p_unit_id: me.unit_id,
      p_project_id: scope === "project" ? projectId : null,
      p_narrative: narrative.trim() || null,
      p_challenges: challenges.trim() || null,
    });
    if (result.error) throw result.error;
    if (showNotice) setNotice("Draft saved.");
    await loadHistory(true);
    return result.data;
  }

  function buildRefs(reportId) {
    if (!evidence) return [];
    const refs = [];
    const add = (section, objectType, rows, labelFor) => rows.forEach((row) => refs.push({
      report_id: reportId,
      section,
      object_type: objectType,
      object_id: row.id,
      label: labelFor(row),
    }));
    add("completed", "work_item", evidence.completed, (row) => `${row.ref} · ${row.title}`);
    add("submissions", "submission", evidence.periodSubmissions, (row) => `${row.profiles?.full_name || "Team member"} · ${new Date(row.submitted_at).toLocaleString("en-GB")}`);
    add("overdue", "work_item", evidence.overdue, (row) => `${row.ref} · ${row.title}`);
    add("attendance_days", "work_session", evidence.attendanceDays, (row) => `${row.profiles?.full_name || "Team member"} · ${localDate(row.started_at)}`);
    daily.forEach((day) => add(day.section, "work_item", day.rows, (row) => `${row.ref} · ${row.title}`));
    projectRows.forEach((row) => add(row.section, "work_item", row.rows, (item) => `${item.ref} · ${item.title}`));
    statusRows.forEach((row) => add(row.section, "work_item", row.rows, (item) => `${item.ref} · ${item.title}`));
    attendanceHeat.forEach((day) => add(day.section, "work_session", day.rows, (row) => `${row.profiles?.full_name || "Team member"} · ${localDate(row.started_at)}`));
    return refs;
  }

  function buildSnapshot() {
    return {
      counts: liveCounts,
      range: { start: range.start, end: range.end, label: range.label },
      scope,
      project_id: scope === "project" ? projectId : null,
      daily: daily.map(({ date, label, value, section }) => ({ date, label, value, section })),
      by_project: projectRows.map(({ label, value, projectId: id, section }) => ({ label, value, projectId: id, section })),
      status_mix: statusRows.map(({ label, value, section }) => ({ label, value, section })),
      attendance: attendanceHeat.map(({ date, label, value, section }) => ({ date, label, value, section })),
      objectives: (evidence?.relevantObjectives || []).map((row) => ({ id: row.id, ref: row.ref, name: row.name, status: row.status })),
    };
  }

  async function handleSave() {
    setBusy(true); setError(null); setNotice(null);
    try { await saveDraft(true); }
    catch (err) { setError(err.message || "The report draft could not be saved."); }
    finally { setBusy(false); }
  }

  async function submitReport() {
    if (!evidence) return;
    setBusy(true); setError(null); setNotice(null);
    try {
      if (!matchingPeriod || matchingPeriod.status !== "open") throw new Error("Administration must open this reporting period before you can submit a report.");
      const refs = buildRefs("pending").map(({ report_id, ...ref }) => ref);
      const submitted = await supabase.rpc("save_and_submit_report", {
        p_period_id: matchingPeriod.id,
        p_scope: scope,
        p_unit_id: me.unit_id,
        p_project_id: scope === "project" ? projectId : null,
        p_narrative: narrative.trim() || null,
        p_challenges: challenges.trim() || null,
        p_evidence: buildSnapshot(),
        p_refs: refs,
      });
      if (submitted.error) throw submitted.error;
      setNotice("Report submitted. This version is now fixed; later corrections create a new version.");
      await loadHistory(false);
    } catch (err) {
      setError(err.message || "The report could not be submitted.");
    } finally {
      setBusy(false);
    }
  }

  async function startCorrection() {
    if (!frozenReport || !correctionReason.trim()) return;
    setBusy(true); setError(null);
    try {
      const result = await supabase.rpc("correct_report", { p_report_id: frozenReport.id, p_reason: correctionReason.trim() });
      if (result.error) throw result.error;
      setSheet(null); setCorrectionReason(""); setSelectedReportId(null);
      setNotice("A new draft version has been opened. The submitted version remains unchanged.");
      await loadHistory(true);
    } catch (err) {
      setError(err.message || "A correction draft could not be opened.");
    } finally {
      setBusy(false);
    }
  }

  function printReport() { window.print(); }

  if (loading) return <div className="body manager-reports"><div className="spin">Preparing reports...</div></div>;

  return <div className="body manager-reports report-print">
    <div className="print-only report-print-brand">
      <b>CEAC</b>
      <span>{me.unit_name} · Manager report</span>
    </div>
    <div style={{ paddingTop: 26 }}>
      <div className="eyebrow">{me.unit_name}</div>
      <h1 className="h1" style={{ marginTop: 6 }}>Reports</h1>
      <p className="screen-note">Built from work, submissions, projects and attendance already recorded in CEAC OS. Submitted versions keep the figures they were filed with.</p>
    </div>

    {error && <div className="flag flag-brick" style={{ marginTop: 14 }}><h4>Could not complete reporting</h4>{error}</div>}
    {notice && <div className="flag flag-green" style={{ marginTop: 14 }}>{notice}</div>}

    <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 14 }}>
      {[["week","Weekly"],["month","Monthly"],["project","Project"]].map(([key, label]) => <button key={key} className={"btn btn-sm " + (mode === key ? "" : "btn-ghost")} onClick={() => { setMode(key); setProjectId(""); setSelectedPeriodId(""); setSelectedReportId(null); setDrill(null); }}>{label}</button>)}
    </div>

    {mode !== "project" && kindPeriods.length > 0 && <select className="field" value={matchingPeriod?.id || ""} onChange={(event) => { setSelectedPeriodId(event.target.value); setSelectedReportId(null); setDrill(null); }}>
      <option value="">Current {mode === "week" ? "week" : "month"} preview</option>
      {kindPeriods.map((period) => <option key={period.id} value={period.id}>{period.label} · {period.starts_on} → {period.ends_on} · {period.status}</option>)}
    </select>}

    {mode === "project" && <>
      <select className="field" value={projectId} onChange={(event) => { setProjectId(event.target.value); setSelectedPeriodId(""); setSelectedReportId(null); setDrill(null); }}>
        <option value="">Choose a project</option>
        {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
      </select>
      {projectId && <select className="field" value={selectedPeriodId} onChange={(event) => { setSelectedPeriodId(event.target.value); setSelectedReportId(null); setDrill(null); }}>
        <option value="">Choose a reporting period</option>
        {kindPeriods.map((period) => <option key={period.id} value={period.id}>{period.label} · {period.starts_on} → {period.ends_on} · {period.status}</option>)}
      </select>}
    </>}

    {!range && <div className="card small" style={{ marginTop: 14 }}>Choose a project to prepare its report.</div>}

    {range && evidence && <>
      <div className="sec"><span>{viewingFrozen ? (frozen.range?.label || range.label) : range.label}</span><span>{viewingFrozen ? `${frozen.range?.start || range.start} → ${frozen.range?.end || range.end}` : `${range.start} → ${range.end}`}</span></div>

      {viewingFrozen && <div className="flag flag-green">
        <h4>Submitted report · version {frozenReport.version}</h4>
        These are the figures saved when this version was submitted{frozenReport.submitted_at ? ` on ${new Date(frozenReport.submitted_at).toLocaleString("en-GB")}` : ""}. Later activity does not rewrite them.
      </div>}

      <div className="metric-grid">
        <EvidenceMetric value={displayCounts.completed || 0} label="completed in period" onClick={() => viewingFrozen ? openFrozenSection("completed", "Completed work") : openLive("completed", "Completed work", evidence.completed, "work")} />
        <EvidenceMetric value={displayCounts.submissions || 0} label="submissions" onClick={() => viewingFrozen ? openFrozenSection("submissions", "Submissions") : openLive("submissions", "Submissions", evidence.periodSubmissions, "submission")} />
        <EvidenceMetric value={displayCounts.overdue || 0} label="overdue from this period" onClick={() => viewingFrozen ? openFrozenSection("overdue", "Overdue work") : openLive("overdue", "Overdue work", evidence.overdue, "work")} />
        <EvidenceMetric value={displayCounts.attendance_days || 0} label={mode === "project" ? "project work-session days" : "recorded attendance days"} onClick={() => viewingFrozen ? openFrozenSection("attendance_days", "Attendance days") : openLive("attendance_days", "Attendance days", evidence.attendanceDays, "session")} />
      </div>

      {drill && <div style={{ marginTop: 12 }}>
        <div className="sec"><span>{drill.title}</span><span>{drill.rows.length}</span></div>
        {drill.rows.map((row) => drill.kind === "work"
          ? <button className="row" key={row.id} onClick={() => openItem(row.id)}><div className="row-t">{row.title}</div><div className="row-m">{row.ref} · {row.profiles?.full_name || "Unassigned"}</div></button>
          : drill.kind === "submission"
            ? <button className="row" key={row.id} onClick={() => openItem(row.work_item_id)}><div className="row-t">{row.profiles?.full_name || "Team member"} submitted work</div><div className="row-m">{new Date(row.submitted_at).toLocaleString("en-GB")}</div>{row.note && <div className="row-note">{row.note}</div>}</button>
            : drill.kind === "session"
              ? <div className="row" key={row.id}><div className="row-t">{row.profiles?.full_name || "Team member"}</div><div className="row-m">{new Date(row.started_at).toLocaleString("en-GB")}</div></div>
              : <button className="row" key={row.id} onClick={() => {
                  if (row.object_type === "work_item") openItem(row.object_id);
                  if (row.object_type === "submission") {
                    const submission = submissions.find((item) => item.id === row.object_id);
                    if (submission) openItem(submission.work_item_id);
                  }
                }}><div className="row-t">{row.label || "Recorded evidence"}</div><div className="row-m">{row.object_type.replaceAll("_", " ")}</div></button>)}
        {drill.rows.length === 0 && <div className="card small">No supporting rows are attached to this figure.</div>}
      </div>}

      <div className="sec"><span>Completed work trend</span></div>
      <Trend points={displayDaily} onOpen={(point) => viewingFrozen ? openFrozenSection(point.section, `Completed on ${point.date}`) : openLive(point.section, `Completed on ${point.date}`, point.rows, "work")} />

      <div className="sec"><span>Completed by project</span></div>
      {displayProjects.length ? <Bars rows={displayProjects} onOpen={(row) => viewingFrozen ? openFrozenSection(row.section, row.label) : openLive(row.section, row.label, row.rows, "work")} /> : <div className="card small">No completed project work is recorded in this view.</div>}

      <div className="sec"><span>Current work composition</span></div>
      <Donut rows={displayStatus} onOpen={(row) => viewingFrozen ? openFrozenSection(row.section, row.label) : openLive(row.section, row.label, row.rows, "work")} />
      <p className="small" style={{ marginTop: 8 }}>This is the current status of visible work in this report scope. It is separate from the completed-work figures for the selected period.</p>

      <div className="sec"><span>Attendance activity</span></div>
      <ActivityHeat days={displayAttendance} onOpen={(day) => viewingFrozen ? openFrozenSection(day.section, `Attendance · ${day.date}`) : openLive(day.section, `Attendance · ${day.date}`, day.rows, "session")} />

      <div className="sec"><span>Objectives</span><span>{displayObjectives.length}</span></div>
      {displayObjectives.map((objective) => <div className="row" key={objective.id}>
        <div className="row-t">{objective.ref} · {objective.name}</div>
        <div style={{ marginTop: 6 }}><Pill tone={objective.status === "at_risk" || objective.status === "not_met" ? "brick" : objective.status === "partly_met" ? "amber" : "green"}>{String(objective.status).replaceAll("_", " ")}</Pill></div>
        <div className="row-note">Work completion is shown separately; it does not determine whether this objective was met.</div>
      </div>)}
      {displayObjectives.length === 0 && <div className="card small">No objectives are recorded for this view.</div>}

      <div className="sec"><span>Manager's summary</span></div>
      <AssistiveTextarea className="field" rows={4} disabled={viewingFrozen} placeholder="What should leadership understand about this period?" value={viewingFrozen ? (frozenReport.narrative || "") : narrative} onChange={(event) => setNarrative(event.target.value)} />
      <AssistiveTextarea className="field" rows={3} disabled={viewingFrozen} placeholder="Challenges or context to explain (optional)" value={viewingFrozen ? (frozenReport.challenges || "") : challenges} onChange={(event) => setChallenges(event.target.value)} />

      <div className="sec"><span>Report record</span></div>
      {!matchingPeriod && <div className="flag flag-amber"><h4>No matching reporting period is open</h4>Administration must open this {mode === "project" ? "project" : mode} period before you can save or submit. The factual preview above remains available.</div>}
      {matchingPeriod && <div className="card">
        <div className="row-t">{matchingPeriod.label}</div>
        <div className="row-m">{matchingPeriod.starts_on} → {matchingPeriod.ends_on} · {matchingPeriod.status}</div>
        {matchingPeriod.status === "closed" && <div className="hint">This period is closed. Existing versions remain visible, but a new draft cannot be filed until Administration reopens it.</div>}
      </div>}

      {history.length > 0 && <>
        <div className="sec"><span>Version history</span><span>{history.length}</span></div>
        {history.map((row) => <button className="row" key={row.id} onClick={() => {
          if (row.status === "draft") { setSelectedReportId(null); setNarrative(row.narrative || ""); setChallenges(row.challenges || ""); }
          else setSelectedReportId(row.id);
          setDrill(null);
        }} style={{ width: "100%", textAlign: "left" }}>
          <div className="row-t">Version {row.version} · {row.status === "draft" ? "Draft" : "Submitted"}</div>
          <div className="row-m">{row.submitted_at ? new Date(row.submitted_at).toLocaleString("en-GB") : "Not submitted yet"}</div>
          {row.correction_reason && <div className="row-note">Correction: {row.correction_reason}</div>}
        </button>)}
      </>}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
        <button className="btn btn-ghost" onClick={printReport}>Print / save PDF</button>
        {!viewingFrozen && matchingPeriod?.status === "open" && <>
          <button className="btn btn-ghost" disabled={busy} onClick={handleSave}>{busy ? "Saving..." : "Save draft"}</button>
          <button className="btn" disabled={busy} onClick={submitReport}>{busy ? "Submitting..." : "Submit report"}</button>
        </>}
        {viewingFrozen && !draft && frozenReport?.status === "submitted" && frozenReport.id === latestSubmitted?.id && matchingPeriod?.status === "open" && <button className="btn btn-ghost" onClick={() => { setCorrectionReason(""); setSheet("correct"); }}>Correct this report</button>}
        {viewingFrozen && draft && <button className="btn btn-ghost" onClick={() => { setSelectedReportId(null); setNarrative(draft.narrative || ""); setChallenges(draft.challenges || ""); }}>Return to draft</button>}
      </div>

      <div className="hint">Submitted reports use frozen figures and evidence links. Later activity does not rewrite them.</div>
    </>}

    {sheet === "correct" && <Sheet onClose={() => !busy && setSheet(null)}>
      <div className="h2">Open a correction</div>
      <p className="screen-note">The submitted version will stay unchanged. A new draft version will be created with your reason recorded.</p>
      <AssistiveTextarea className="field" rows={3} placeholder="Why is a correction needed?" value={correctionReason} onChange={(event) => setCorrectionReason(event.target.value)} />
      <button className="btn" style={{ marginTop: 14 }} disabled={busy || !correctionReason.trim()} onClick={startCorrection}>{busy ? "Opening..." : "Create correction draft"}</button>
    </Sheet>}
  </div>;
}
