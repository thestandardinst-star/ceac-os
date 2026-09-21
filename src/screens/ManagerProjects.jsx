import { useEffect, useState } from "react";
import AssistiveTextarea from "../components/AssistiveTextarea";
import { supabase } from "../lib/supabase";
import { dateOnly, dueLabel } from "../lib/time";
import { Pill, Sheet, statusPill } from "../components/bits";
import ManagerProjectClose from "./ManagerProjectClose";

const OBJECTIVE_STATUSES = [
  ["on_track", "On track"],
  ["at_risk", "At risk"],
  ["met", "Met"],
  ["partly_met", "Partly met"],
  ["not_met", "Not met"],
];

function requireResult(result, label) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data || [];
}

function objectiveStatus(status) {
  return OBJECTIVE_STATUSES.find(([value]) => value === status)?.[1] || status;
}

function objectiveTone(status) {
  if (status === "at_risk" || status === "not_met") return "brick";
  if (status === "partly_met") return "amber";
  return "green";
}

function money(currency, amountMinor) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency", currency, currencyDisplay: "code",
  }).format(Number(amountMinor) / 100);
}

function costRows(budgets, spend) {
  const grouped = new Map();
  budgets.forEach((row) => {
    const value = grouped.get(row.currency) || { currency: row.currency, planned: null, actual: null };
    value.planned = (value.planned ?? 0) + Number(row.amount_minor);
    grouped.set(row.currency, value);
  });
  spend.forEach((row) => {
    const value = grouped.get(row.currency) || { currency: row.currency, planned: null, actual: null };
    value.actual = (value.actual ?? 0) + (row.reverses_id ? -Number(row.amount_minor) : Number(row.amount_minor));
    grouped.set(row.currency, value);
  });
  return [...grouped.values()].sort((a, b) => a.currency.localeCompare(b.currency));
}

function WorkRow({ item, openItem }) {
  const submissions = item.submissions || [];
  const fileCount = submissions.reduce((sum, submission) => sum + (submission.submission_files?.length || 0), 0);
  return <button className="row" onClick={() => openItem(item.id)}>
    <div className="row-t">{item.title}</div>
    <div className="row-m">{item.ref} · {item.profiles?.full_name || "Unassigned"} · {dueLabel(item.due_at)}</div>
    <div style={{ marginTop: 7 }}>{statusPill(item.status)}</div>
    <div className="row-note">{submissions.length
      ? `${submissions.length} submission${submissions.length === 1 ? "" : "s"}${fileCount ? ` · ${fileCount} evidence file${fileCount === 1 ? "" : "s"}` : ""}`
      : "No submission recorded"}</div>
  </button>;
}

function CostSummary({ rows, emptyText = "No project cost has been recorded." }) {
  if (!rows.length) return <div className="card small">{emptyText}</div>;
  return rows.map((row) => <div className="row" key={row.currency}>
    <div className="row-t">{row.currency}</div>
    <div className="row-m">{row.planned === null ? "No planned amount recorded" : `${money(row.currency, row.planned)} planned`}</div>
    <div className="row-m">{row.actual === null ? "No actual spend recorded" : `${money(row.currency, row.actual)} actual`}</div>
  </div>);
}

export default function ManagerProjects({ me, initialProjectId = null, openItem, goAssign, openRoom, openMeeting, scheduleMeeting, back }) {
  const [projects, setProjects] = useState([]);
  const [selectedId, setSelectedId] = useState(initialProjectId);
  const [detail, setDetail] = useState(null);
  const [canCreate, setCanCreate] = useState(false);
  const [units, setUnits] = useState([]);
  const [sheet, setSheet] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { loadList(); }, [me.id, me.unit_id]);
  useEffect(() => { setSelectedId(initialProjectId); }, [initialProjectId]);
  useEffect(() => { if (selectedId) loadDetail(selectedId); else setDetail(null); }, [selectedId, me.unit_id]);

  async function loadList() {
    setLoadingList(true);
    setError(null);
    try {
      const [projectResult, capabilityResult, unitResult] = await Promise.all([
        supabase.from("projects")
          .select("id, kind, name, purpose, starts_on, ends_on, status, lead_unit_id, units!projects_lead_unit_id_fkey(name)")
          .order("starts_on", { ascending: false, nullsFirst: false }),
        supabase.from("capabilities").select("id").eq("profile_id", me.id).eq("capability", "create_project").maybeSingle(),
        supabase.from("units").select("id, name").eq("org_id", me.org_id).order("name"),
      ]);
      const visibleProjects = requireResult(projectResult, "Projects");
      if (capabilityResult.error) throw new Error(`Project capability: ${capabilityResult.error.message}`);
      setCanCreate(Boolean(capabilityResult.data));
      setUnits(requireResult(unitResult, "Units"));
      const ids = visibleProjects.map((project) => project.id);
      if (!ids.length) { setProjects([]); setLoadingList(false); return; }
      const [unitResultRows, objectiveResult, workResult, budgetResult, spendResult] = await Promise.all([
        supabase.from("project_units").select("project_id, unit_id, role").in("project_id", ids),
        supabase.from("objectives").select("id, project_id, status").in("project_id", ids),
        supabase.from("work_items").select("id, project_id, kind, status").in("project_id", ids),
        supabase.from("budgets").select("id, project_id, currency, amount_minor").in("project_id", ids).eq("unit_id", me.unit_id),
        supabase.from("spend_lines").select("id, project_id, currency, amount_minor, reverses_id").in("project_id", ids).eq("unit_id", me.unit_id),
      ]);
      const projectUnits = requireResult(unitResultRows, "Project units");
      const objectives = requireResult(objectiveResult, "Objectives");
      const work = requireResult(workResult, "Project work");
      const budgets = requireResult(budgetResult, "Project budgets");
      const spend = requireResult(spendResult, "Project spend");
      const currentUnitProjects = visibleProjects.filter((project) => project.lead_unit_id === me.unit_id || projectUnits.some((row) => row.project_id === project.id && row.unit_id === me.unit_id));
      setProjects(currentUnitProjects.map((project) => {
        const tasks = work.filter((item) => item.project_id === project.id && item.kind === "task");
        return {
          ...project,
          role: project.lead_unit_id === me.unit_id ? "lead" : projectUnits.find((row) => row.project_id === project.id && row.unit_id === me.unit_id)?.role,
          objectives: objectives.filter((objective) => objective.project_id === project.id),
          taskCount: tasks.length,
          completedTasks: tasks.filter((task) => ["completed", "self_certified"].includes(task.status)).length,
          costs: costRows(budgets.filter((row) => row.project_id === project.id), spend.filter((row) => row.project_id === project.id)),
        };
      }));
    } catch (err) { setError(err.message || "Projects could not be loaded."); }
    finally { setLoadingList(false); }
  }

  async function loadDetail(projectId) {
    setError(null); setDetail(null);
    try {
      const projectResult = await supabase.from("projects")
        .select("id, org_id, kind, name, purpose, starts_on, ends_on, follow_up_ends_on, status, lead_unit_id, units!projects_lead_unit_id_fkey(name)")
        .eq("id", projectId).single();
      if (projectResult.error) throw new Error(`Project: ${projectResult.error.message}`);
      const [participantResult, phaseResult, objectiveResult, workResult, budgetResult, spendResult] = await Promise.all([
        supabase.from("project_units")
          .select("project_id, unit_id, role, units!project_units_unit_id_fkey(name)").eq("project_id", projectId),
        supabase.from("project_phases").select("id, name, position, starts_on, ends_on, closed_at")
          .eq("project_id", projectId).order("position"),
        supabase.from("objectives")
          .select("id, project_id, unit_id, phase_id, ref, name, statement, measure, status, target_value, target_unit, achieved_value, closed_note, units!objectives_unit_id_fkey(name)")
          .eq("project_id", projectId).order("ref"),
        supabase.from("work_items")
          .select("id, ref, title, kind, status, due_at, objective_id, phase_id, unit_id, assignee_id, profiles!work_items_assignee_id_fkey(full_name), submissions(id, submitted_at, submission_files(id, url))")
          .eq("project_id", projectId).neq("visibility", "private").order("due_at", { ascending: true, nullsFirst: false }),
        supabase.from("budgets").select("id, currency, amount_minor, year, note")
          .eq("project_id", projectId).eq("unit_id", me.unit_id),
        supabase.from("spend_lines").select("id, currency, amount_minor, reverses_id, spent_on, description")
          .eq("project_id", projectId).eq("unit_id", me.unit_id),
      ]);
      const participants = requireResult(participantResult, "Participating units");
      if (projectResult.data.lead_unit_id !== me.unit_id && !participants.some((row) => row.unit_id === me.unit_id)) throw new Error("This project is not part of your current unit.");
      const phases = requireResult(phaseResult, "Project phases");
      const objectives = requireResult(objectiveResult, "Objectives");
      const work = requireResult(workResult, "Project work");
      const budgets = requireResult(budgetResult, "Project budgets");
      const spend = requireResult(spendResult, "Project spend");
      setDetail({
        ...projectResult.data, participants, phases, objectives, work,
        costs: costRows(budgets, spend),
        canManageProject: projectResult.data.lead_unit_id === me.unit_id,
        canManageObjectives: participants.some((row) => row.unit_id === me.unit_id) || projectResult.data.lead_unit_id === me.unit_id,
      });
    } catch (err) { setError(err.message || "Project detail could not be loaded."); }
  }

  async function createProject(form) {
    setBusy(true); setError(null);
    try {
      const { data: projectId, error: createError } = await supabase.rpc("create_project_with_participants", {
        p_lead_unit_id: me.unit_id,
        p_name: form.name.trim(),
        p_purpose: form.purpose.trim() || null,
        p_starts_on: form.startsOn || null,
        p_ends_on: form.endsOn || null,
        p_participant_unit_ids: [...new Set(form.participants || [])],
      });
      if (createError) throw createError;
      setSelectedId(projectId);
      setSheet({ type: "created", projectId });
      await loadList();
    } catch (err) { setError(err.message || "The project could not be created."); }
    finally { setBusy(false); }
  }

  async function saveObjective(form) {
    setBusy(true); setError(null);
    try {
      let objectiveRef = form.ref?.trim() || null;
      if (!form.id) {
        const refResult = await supabase.rpc("next_objective_ref", {
          p_project_id: detail.id,
          p_unit_id: me.unit_id,
        });
        if (refResult.error) throw new Error(`Objective reference: ${refResult.error.message}`);
        objectiveRef = refResult.data;
      }
      const payload = {
        org_id: me.org_id, project_id: detail.id, unit_id: me.unit_id,
        ref: objectiveRef, name: form.name.trim(), statement: form.statement.trim() || null,
        measure: form.measure.trim() || null,
        status: form.status, target_value: form.targetValue === "" ? null : Number(form.targetValue),
        target_unit: form.targetUnit.trim() || null,
        achieved_value: form.achievedValue === "" ? null : Number(form.achievedValue),
        closed_note: form.closedNote.trim() || null,
      };
      const result = form.id
        ? await supabase.from("objectives").update(payload).eq("id", form.id).eq("unit_id", me.unit_id).select("id").single()
        : await supabase.from("objectives").insert(payload).select("id").single();
      if (result.error) throw result.error;
      await loadDetail(detail.id); await loadList();
      setSheet({ type: "objective-saved", objectiveId: result.data.id, projectId: detail.id });
    } catch (err) { setError(err.message || "The objective could not be saved."); }
    finally { setBusy(false); }
  }

  if (selectedId) {
    if (!detail) return <div className="body manager-projects"><button className="back" onClick={() => initialProjectId && back ? back() : setSelectedId(null)}>← Projects</button>{error ? <div className="flag flag-brick"><h4>Could not open project</h4>{error}</div> : <div className="spin">Loading...</div>}</div>;
    const team = [...new Set(detail.work.map((item) => item.profiles?.full_name).filter(Boolean))];
    const unattached = detail.work.filter((item) => !item.objective_id);
    return <div className="body manager-projects">
      <button className="back" onClick={() => initialProjectId && back ? back() : setSelectedId(null)}>← Projects</button>
      <div className="eyebrow">{detail.kind} · {detail.status}</div>
      <h1 className="h1" style={{ marginTop: 6 }}>{detail.name}</h1>
      {detail.purpose ? <p className="screen-note">{detail.purpose}</p> : <p className="screen-note">No purpose has been recorded.</p>}
      {error && <div className="flag flag-brick" style={{ marginTop: 14 }}><h4>Could not complete that</h4>{error}</div>}

      <div className="sec"><span>Purpose and context</span></div>
      <div className="card">
        <div className="row-t">{detail.units?.name || "Lead unit not recorded"}</div>
        <div className="row-m">Lead unit</div>
        <div className="row-note">{detail.starts_on ? dateOnly(`${detail.starts_on}T00:00:00`) : "No start date"} → {detail.ends_on ? dateOnly(`${detail.ends_on}T00:00:00`) : "No end date"}</div>
        <div className="row-note">Participating: {detail.participants.filter((row) => row.role === "participating").map((row) => row.units?.name).filter(Boolean).join(", ") || "No additional unit recorded"}</div>
        <div className="row-note">Assigned people: {team.join(", ") || "No work holder recorded"}</div>
      </div>

      {(detail.kind !== "project" || detail.phases.length > 0) && <>
        <div className="sec"><span>Operational phases</span><span>{detail.phases.length}</span></div>
        {detail.phases.map((phase) => <div className="row" key={phase.id}><div className="row-t">{phase.name}</div><div className="row-m">{phase.starts_on ? dateOnly(`${phase.starts_on}T00:00:00`) : "No start date"} → {phase.ends_on ? dateOnly(`${phase.ends_on}T00:00:00`) : "No end date"}</div>{phase.closed_at && <div className="row-note">Closed {dateOnly(phase.closed_at)}</div>}</div>)}
        {!detail.phases.length && <div className="card small">No operational phases have been recorded.</div>}
      </>}

      <div className="sec"><span>Objectives</span><span>{detail.objectives.length}</span></div>
      {detail.canManageObjectives && <button className="btn wide-auto" style={{ marginBottom: 10 }} onClick={() => setSheet({ type: "objective", value: null })}>Add objective</button>}
      {detail.objectives.map((objective) => {
        const work = detail.work.filter((item) => item.objective_id === objective.id);
        const tasks = work.filter((item) => item.kind === "task");
        const completed = tasks.filter((item) => ["completed", "self_certified"].includes(item.status)).length;
        return <div className="card" style={{ marginBottom: 10 }} key={objective.id}>
          <div className="eyebrow">{objective.ref} · {objective.units?.name || "Unit not recorded"}</div>
          <div className="row-t" style={{ marginTop: 4 }}>{objective.name}</div>
          {objective.statement && <div className="row-note">{objective.statement}</div>}
          {objective.measure && <div className="row-note">Measure: {objective.measure}</div>}
          <div style={{ marginTop: 8 }}><Pill tone={objectiveTone(objective.status)}>{objectiveStatus(objective.status)}</Pill></div>
          <div className="row-note">{completed} of {tasks.length} project tasks completed</div>
          {objective.target_value !== null && <div className="row-note">Target: {objective.target_value} {objective.target_unit || ""}{objective.achieved_value !== null ? ` · Result: ${objective.achieved_value} ${objective.target_unit || ""}` : " · No result recorded"}</div>}
          {objective.closed_note && <div className="row-note">Close note: {objective.closed_note}</div>}
          {objective.unit_id === me.unit_id && <div style={{ display: "flex", gap: 7, marginTop: 10, flexWrap: "wrap" }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setSheet({ type: "objective", value: objective })}>Edit objective</button>
            <button className="btn btn-sm" onClick={() => goAssign({ projectId: detail.id, objectiveId: objective.id, phaseId: objective.phase_id })}>Add work</button>
          </div>}
          <div style={{ marginTop: 10 }}>{work.map((item) => <WorkRow key={item.id} item={item} openItem={openItem} />)}{work.length === 0 && <div className="small">No work has been attached to this objective.</div>}</div>
        </div>;
      })}
      {detail.objectives.length === 0 && <div className="card small">No objectives have been recorded for this project.</div>}

      <div className="sec"><span>Work not attached to an objective</span><span>{unattached.length}</span></div>
      <p className="screen-note">Non-private project work is shown across participating units. Confidential work stays restricted.</p>
      {unattached.map((item) => <WorkRow key={item.id} item={item} openItem={openItem} />)}
      {unattached.length === 0 && <div className="card small">All recorded project work is attached to an objective.</div>}
      {detail.canManageObjectives && <button className="btn btn-ghost wide-auto" style={{ marginTop: 10 }} onClick={() => goAssign({ projectId: detail.id })}>Add project work</button>}

      <div className="sec"><span>Your unit cost · read only</span></div>
      <p className="screen-note">Currencies are shown separately. No conversion is applied.</p>
      <div style={{ marginTop: 8 }}><CostSummary rows={detail.costs} /></div>

      <div className="sec"><span>Communication</span></div>
      <div className="project-collaboration-grid">
        <button className="project-room-entry" onClick={() => openRoom?.(detail.id, { object_type: "project", object_id: detail.id, label: detail.name })}>
          <span><strong>Project Room</strong><small>Discussion, replies and linked work stay with this project.</small></span>
          <b aria-hidden="true">Open →</b>
        </button>
        <button className="project-room-entry" onClick={() => scheduleMeeting?.({ scope:"project", projectId:detail.id })}>
          <span><strong>Project meeting</strong><small>Schedule a Zoom-backed meeting and keep its operational record here.</small></span>
          <b aria-hidden="true">Schedule →</b>
        </button>
      </div>

      <ManagerProjectClose
        me={me}
        project={detail}
        objectives={detail.objectives}
        work={detail.work}
        costs={detail.costs}
        onRefresh={async () => { await loadDetail(detail.id); await loadList(); }}
      />

      {sheet?.type === "objective" && <ObjectiveSheet value={sheet.value} busy={busy} onClose={() => setSheet(null)} onSave={saveObjective} />}
      {sheet?.type === "objective-saved" && <Sheet onClose={() => setSheet(null)}><div className="h2">Objective saved</div><p className="screen-note">The next step is to assign work through the existing work flow.</p><button className="btn" style={{ marginTop: 14 }} onClick={() => goAssign({ projectId: sheet.projectId, objectiveId: sheet.objectiveId })}>Add work under this objective</button><button className="btn btn-ghost" style={{ marginTop: 8 }} onClick={() => setSheet(null)}>Not now</button></Sheet>}
      {sheet?.type === "created" && <Sheet onClose={() => setSheet(null)}><div className="eyebrow">Step 2 of 3</div><div className="h2">Add objectives</div><p className="screen-note">The project basics are saved. Add objectives next, then assign work under them.</p><button className="btn" style={{ marginTop: 14 }} onClick={() => setSheet({ type: "objective", value: null })}>Add first objective</button><button className="btn btn-ghost" style={{ marginTop: 8 }} onClick={() => setSheet(null)}>Not now</button></Sheet>}
    </div>;
  }

  return <div className="body manager-projects">
    <div style={{ paddingTop: 26 }}>
      <div className="eyebrow">{me.unit_name}</div>
      <h1 className="h1" style={{ marginTop: 6 }}>Projects</h1>
      <p className="screen-note">Purpose, objectives, work, people, evidence and cost in one place.</p>
    </div>
    {canCreate && <button className="btn wide-auto" style={{ marginTop: 16 }} onClick={() => setSheet({ type: "project" })}>Create project</button>}
    {error && <div className="flag flag-brick" style={{ marginTop: 14 }}><h4>Could not complete that</h4>{error}</div>}
    {loadingList && <div className="spin">Loading projects...</div>}
    {!loadingList && <><div className="sec"><span>Your unit’s projects</span><span>{projects.length}</span></div>
    {projects.map((project) => <button className="row" key={project.id} onClick={() => setSelectedId(project.id)}>
      <div className="eyebrow">{project.role === "lead" ? "Lead unit" : "Participating unit"}</div>
      <div className="row-t" style={{ marginTop: 3 }}>{project.name}</div>
      <div className="row-m">{project.objectives.length} objective{project.objectives.length === 1 ? "" : "s"} · {project.completedTasks} of {project.taskCount} project tasks completed</div>
      {project.costs.length ? <div className="row-note">{project.costs.map((row) => `${row.currency}: ${row.planned === null ? "no planned amount" : `${money(row.currency, row.planned)} planned`} · ${row.actual === null ? "no actual spend" : `${money(row.currency, row.actual)} actual`}`).join(" | ")}</div> : <div className="row-note">No project cost has been recorded for your unit.</div>}
      <div style={{ marginTop: 7 }}><Pill tone={project.status === "active" ? "green" : "grey"}>{project.status}</Pill></div>
    </button>)}
    {projects.length === 0 && <div className="card small">No project currently involves your unit.</div>}
    </>}
    {sheet?.type === "project" && <ProjectSheet units={units.filter((unit) => unit.id !== me.unit_id)} busy={busy} onClose={() => setSheet(null)} onCreate={createProject} />}
  </div>;
}

function ProjectSheet({ units, busy, onClose, onCreate }) {
  const [name, setName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [startsOn, setStartsOn] = useState("");
  const [endsOn, setEndsOn] = useState("");
  const [participants, setParticipants] = useState([]);
  return <Sheet onClose={onClose}>
    <div className="eyebrow">Step 1 of 3</div><div className="h2">Project basics</div>
    <input className="field" placeholder="Project name" value={name} onChange={(event) => setName(event.target.value)} />
    <AssistiveTextarea className="field" rows={3} placeholder="Purpose" value={purpose} onChange={(event) => setPurpose(event.target.value)} />
    <input className="field" type="date" value={startsOn} onChange={(event) => setStartsOn(event.target.value)} />
    <input className="field" type="date" value={endsOn} min={startsOn || undefined} onChange={(event) => setEndsOn(event.target.value)} />
    <div className="sec" style={{ marginTop: 18 }}><span>Participating units</span></div>
    {units.map((unit) => <label className="ck" key={unit.id}><input type="checkbox" checked={participants.includes(unit.id)} onChange={() => setParticipants((current) => current.includes(unit.id) ? current.filter((id) => id !== unit.id) : [...current, unit.id])} /><span className="ck-l">{unit.name}</span></label>)}
    <button className="btn" style={{ marginTop: 14 }} disabled={busy || !name.trim() || (startsOn && endsOn && endsOn < startsOn)} onClick={() => onCreate({ name, purpose, startsOn, endsOn, participants })}>{busy ? "Creating..." : "Create and add objectives"}</button>
  </Sheet>;
}

function ObjectiveSheet({ value, busy, onClose, onSave }) {
  const [ref, setRef] = useState(value?.ref || "");
  const [name, setName] = useState(value?.name || "");
  const [statement, setStatement] = useState(value?.statement || "");
  const [measure, setMeasure] = useState(value?.measure || "");
  const [status, setStatus] = useState(value?.status || "on_track");
  const [targetValue, setTargetValue] = useState(value?.target_value ?? "");
  const [targetUnit, setTargetUnit] = useState(value?.target_unit || "");
  const [achievedValue, setAchievedValue] = useState(value?.achieved_value ?? "");
  const [closedNote, setClosedNote] = useState(value?.closed_note || "");
  return <Sheet onClose={onClose}>
    <div className="eyebrow">Step 2 of 3</div><div className="h2">{value ? "Edit objective" : "Add objective"}</div>
    {value ? <div className="card small">Reference: {ref}</div> : <div className="card small">A reference will be assigned automatically when you save.</div>}
    <input className="field" placeholder="Objective name" value={name} onChange={(event) => setName(event.target.value)} />
    <AssistiveTextarea className="field" rows={3} placeholder="What should change or be achieved?" value={statement} onChange={(event) => setStatement(event.target.value)} />
    <input className="field" placeholder="How will you know? (optional)" value={measure} onChange={(event) => setMeasure(event.target.value)} />
    <select className="field" value={status} onChange={(event) => setStatus(event.target.value)}>{OBJECTIVE_STATUSES.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
    <p className="small" style={{ marginTop: 12 }}>Numeric target and result are optional. Descriptive objectives do not need them.</p>
    <input className="field" type="number" step="any" placeholder="Target value (optional)" value={targetValue} onChange={(event) => setTargetValue(event.target.value)} />
    <input className="field" placeholder="Target unit (optional)" value={targetUnit} onChange={(event) => setTargetUnit(event.target.value)} />
    <input className="field" type="number" step="any" placeholder="Result value (optional)" value={achievedValue} onChange={(event) => setAchievedValue(event.target.value)} />
    {["met", "partly_met", "not_met"].includes(status) && <AssistiveTextarea className="field" rows={3} placeholder="Outcome note" value={closedNote} onChange={(event) => setClosedNote(event.target.value)} />}
    <button className="btn" style={{ marginTop: 14 }} disabled={busy || !name.trim() || (targetValue !== "" && !targetUnit.trim()) || (achievedValue !== "" && targetValue === "")} onClick={() => onSave({ id: value?.id, ref, name, statement, measure, status, targetValue, targetUnit, achievedValue, closedNote })}>{busy ? "Saving..." : value ? "Save objective" : "Save and add work"}</button>
  </Sheet>;
}
