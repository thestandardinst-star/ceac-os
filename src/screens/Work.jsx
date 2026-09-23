import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { dueLabel } from "../lib/time";
import { humanError } from "../lib/productLanguage";
import { Sheet, statusPill, FieldGroup, ProductNotice, LoadingState } from "../components/bits";

const MODES = [
  ["assigned", "Assigned"],
  ["agreed", "Agreed"],
  ["private", "Private"],
];

const STATUS_FILTERS = [
  ["active", "Active"],
  ["waiting_on", "Waiting"],
  ["in_review", "In review"],
  ["completed", "Completed"],
];

export default function Work({ me, isManager = false, openItem }) {
  const viewKey = `ceac-work-view:${me.id}`;
  let savedView = null;
  try { savedView = JSON.parse(sessionStorage.getItem(viewKey) || "null"); } catch { savedView = null; }
  const [mode, setMode] = useState(savedView?.mode || "assigned");
  const [statusFilter, setStatusFilter] = useState(savedView?.statusFilter || "active");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [projects, setProjects] = useState([]);
  const [sheet, setSheet] = useState(null);
  const [createVisibility, setCreateVisibility] = useState("unit");
  const [projectId, setProjectId] = useState("");
  const [title, setTitle] = useState("");
  const [purpose, setPurpose] = useState("");
  const [expectedOutcome, setExpectedOutcome] = useState("");
  const [due, setDue] = useState("");
  const [steps, setSteps] = useState([""]);
  const [noStepsNeeded, setNoStepsNeeded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [queryText, setQueryText] = useState("");
  const [sortMode, setSortMode] = useState("due");

  useEffect(() => { load(); }, [mode, statusFilter, me.id, isManager]);
  useEffect(() => { loadProjects(); }, [me.id, me.unit_id]);
  useEffect(() => {
    sessionStorage.setItem(viewKey, JSON.stringify({ mode, statusFilter }));
  }, [viewKey, mode, statusFilter]);

  async function load(nextMode = mode, nextStatusFilter = statusFilter) {
    setLoading(true);
    setLoadError(null);
    setItems([]);

    let query = supabase.from("work_items")
      .select("id,ref,title,kind,status,due_at,visibility,origin,expected_outcome,projects(name)")
      .eq("assignee_id", me.id);

    if (nextMode === "assigned") query = query.eq("visibility", "unit").eq("origin", "assigned");
    if (nextMode === "agreed") query = query.eq("visibility", "unit").eq("origin", "self_created");
    if (nextMode === "private") query = query.eq("visibility", "private");

    if (nextStatusFilter === "active") query = query.in("status", ["not_started", "in_progress", "returned"]);
    else if (nextStatusFilter === "completed") query = query.in("status", ["completed", "self_certified"]);
    else query = query.eq("status", nextStatusFilter);

    const { data, error } = await query.order("due_at", { ascending: true, nullsFirst: false });
    if (error) {
      setLoadError(error.message);
      setLoading(false);
      return;
    }
    setItems(data || []);
    setLoading(false);
  }

  async function loadProjects() {
    if (!me.unit_id) return;
    const { data, error } = await supabase.from("projects")
      .select("id,name,lead_unit_id,project_units(unit_id)")
      .in("status", ["planned", "active"])
      .order("name");
    if (error) { setLoadError(error.message); return; }
    setProjects((data || []).filter((project) =>
      project.lead_unit_id === me.unit_id || (project.project_units || []).some((unit) => unit.unit_id === me.unit_id)
    ));
  }

  function openCreate(visibility) {
    setCreateVisibility(visibility);
    setProjectId("");
    setTitle("");
    setPurpose("");
    setExpectedOutcome("");
    setDue("");
    setSteps([""]);
    setNoStepsNeeded(false);
    setNotice(null);
    setSheet("self");
  }

  async function createOwnTask() {
    const clean = noStepsNeeded ? [] : steps.map((step) => step.trim()).filter(Boolean);
    if (!title.trim() || !expectedOutcome.trim() || (!noStepsNeeded && !clean.length)) return;

    setBusy(true);
    setLoadError(null);
    setNotice(null);
    try {
      const dueIso = due ? new Date(due).toISOString() : null;
      const { data: created, error: createError } = await supabase.rpc("create_task_with_checklist", {
        p_unit_id: me.unit_id,
        p_assignee_id: me.id,
        p_title: title.trim(),
        p_expected_outcome: expectedOutcome.trim(),
        p_sub_team_id: null,
        p_project_id: projectId || null,
        p_objective_id: null,
        p_phase_id: null,
        p_purpose: purpose.trim() || null,
        p_instructions: null,
        p_due_at: dueIso,
        p_origin: "self_created",
        p_visibility: createVisibility,
        p_steps: clean,
      });
      if (createError) throw createError;

      setSheet(null);
      setMode(createVisibility === "private" ? "private" : "agreed");
      setStatusFilter("active");
      setNotice(createVisibility === "private"
        ? `${created.ref} added as private work. Only you can see it.`
        : `${created.ref} added to your agreed work. It appears immediately in your record.`);
      await load(createVisibility === "private" ? "private" : "agreed", "active");
    } catch (error) {
      setLoadError(humanError(error, "The work could not be added."));
    } finally {
      setBusy(false);
    }
  }

  const cleanQuery = queryText.trim().toLowerCase();
  const visibleItems = items
    .filter((item) => !cleanQuery || [item.title,item.ref,item.kind,item.projects?.name,item.expected_outcome].filter(Boolean).some((value) => String(value).toLowerCase().includes(cleanQuery)))
    .sort((left,right) => {
      if (sortMode === "title") return left.title.localeCompare(right.title);
      if (sortMode === "status") return String(left.status).localeCompare(String(right.status)) || left.title.localeCompare(right.title);
      const a = left.due_at ? new Date(left.due_at).getTime() : Number.MAX_SAFE_INTEGER;
      const b = right.due_at ? new Date(right.due_at).getTime() : Number.MAX_SAFE_INTEGER;
      return a-b || left.title.localeCompare(right.title);
    });

  const grouped = {};
  visibleItems.forEach((item) => {
    const key = item.projects ? item.projects.name : "Not attached to a project";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(item);
  });

  const modeNote = mode === "assigned"
    ? "Formal work given to you."
    : mode === "agreed"
      ? "Work you already agreed to carry and recorded yourself."
      : "Personal work visible only to you. It is not counted in formal CEAC reports.";

  return <div className="body staff-work">
    <div className="staff-page-intro">
      <div className="eyebrow">{me.unit_name}</div>
      <h1 className="h1">My work</h1>
      <p className="screen-note">Everything you are carrying, organised by where it came from and what needs to happen next.</p>
    </div>

    <div className="staff-segment" role="tablist" aria-label="Work source">
      {MODES.map(([key, label]) => <button
        key={key}
        role="tab"
        aria-selected={mode === key}
        className={mode === key ? "on" : ""}
        onClick={() => { setMode(key); setStatusFilter("active"); }}
      >{label}</button>)}
    </div>
    <p className="context-note">{modeNote}</p>

    <div className="work-actions">
      <button className="btn btn-sm" onClick={() => openCreate("unit")}>Add agreed work</button>
      <button className="btn btn-ghost btn-sm" onClick={() => openCreate("private")}>Add private work</button>
    </div>

    {notice && <ProductNotice tone="success" title="Work updated">{notice}</ProductNotice>}

    <div className="status-filter" aria-label="Work status">
      {STATUS_FILTERS.map(([key, label]) => <button
        key={key}
        className={statusFilter === key ? "on" : ""}
        onClick={() => setStatusFilter(key)}
      >{label}</button>)}
    </div>

    {items.length > 10 && <div className="work-scale-tools">
      <FieldGroup label="Find work"><input className="field" type="search" placeholder="Search title, reference or project" value={queryText} onChange={(event) => setQueryText(event.target.value)} /></FieldGroup>
      <FieldGroup label="Sort by"><select className="field" value={sortMode} onChange={(event) => setSortMode(event.target.value)}><option value="due">Due date</option><option value="title">Title</option><option value="status">Status</option></select></FieldGroup>
    </div>}
    {loadError && <ProductNotice tone="error" title="Could not load your work">{loadError}</ProductNotice>}
    {loading && <LoadingState label="Loading your work…" />}

    {!loading && Object.keys(grouped).map((project) => <section key={project} className="work-group">
      <div className="work-group-head"><strong>{project}</strong><span>{grouped[project].length}</span></div>
      <div className="work-list">
        {grouped[project].map((item) => <button key={item.id} className="work-list-row" onClick={() => openItem(item.id)}>
          <div className="work-list-main">
            <strong>{item.title}</strong>
            <span>{item.ref} · {item.kind.replaceAll("_", " ")}</span>
            {item.expected_outcome && <small>{item.expected_outcome}</small>}
          </div>
          <div className="work-list-side">
            {statusPill(item.status)}
            <span>{dueLabel(item.due_at)}</span>
          </div>
        </button>)}
      </div>
    </section>)}

    {!loading && !loadError && items.length > 0 && visibleItems.length === 0 && <div className="quiet-empty"><strong>No matching work</strong><span>Try a different search.</span></div>}
    {!loading && !loadError && items.length === 0 && <div className="quiet-empty">
      <strong>Nothing here right now</strong>
      <span>{mode === "private"
        ? "Private work you add will stay here and remain visible only to you."
        : statusFilter === "active"
          ? "There is no active work in this view."
          : "There is no work in this status."}</span>
    </div>}

    {sheet === "self" && <Sheet onClose={() => !busy && setSheet(null)}>
      <div className="eyebrow">{createVisibility === "private" ? "Only you can see this" : "Your agreed CEAC work"}</div>
      <div className="h2" style={{ marginTop: 5 }}>{createVisibility === "private" ? "Add private work" : "Add agreed work"}</div>
      <p className="screen-note">
        {createVisibility === "private"
          ? "Use this for work or planning you want to keep to yourself."
          : "Record work you already agreed to carry. You can attach it to a project, but you do not have to."}
      </p>

      <FieldGroup label="Work to carry"><input className="field" placeholder="What are you doing?" value={title} onChange={(event) => setTitle(event.target.value)} /></FieldGroup>
      <FieldGroup label="Why it matters" hint="Optional context."><textarea className="field" rows={2} placeholder="Why it matters" value={purpose} onChange={(event) => setPurpose(event.target.value)} /></FieldGroup>
      <FieldGroup label="Finished result"><textarea className="field" rows={3} placeholder="What should be true when this is finished?" value={expectedOutcome} onChange={(event) => setExpectedOutcome(event.target.value)} /></FieldGroup>

      <select className="field" value={projectId} onChange={(event) => setProjectId(event.target.value)}>
        <option value="">No project attached</option>
        {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
      </select>

      <label className="field-label">Due date (optional)</label>
      <input className="field" type="datetime-local" value={due} onChange={(event) => setDue(event.target.value)} />

      <label className="card small no-steps-option">
        <input type="checkbox" checked={noStepsNeeded} onChange={(event) => setNoStepsNeeded(event.target.checked)} />
        <span>No steps needed — I will determine the method.</span>
      </label>

      {!noStepsNeeded && <>
        <div className="small" style={{ marginTop: 12 }}>Completion steps</div>
        {steps.map((step, index) => <div className="inline-step" key={index}>
          <input
            className="field"
            placeholder={index === 0 ? "What must be done?" : "Another step (optional)"}
            value={step}
            onChange={(event) => setSteps((current) => current.map((value, i) => i === index ? event.target.value : value))}
          />
          {steps.length > 1 && <button type="button" className="text-action" onClick={() => setSteps((current) => current.filter((_, i) => i !== index))}>Remove</button>}
        </div>)}
        {steps.length < 6 && <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 8 }}
          disabled={!steps[steps.length - 1]?.trim()}
          onClick={() => setSteps((current) => [...current, ""])}>Add another step</button>}
      </>}

      <button
        className="btn"
        style={{ marginTop: 16 }}
        disabled={busy || !title.trim() || !expectedOutcome.trim() || (!noStepsNeeded && !steps.some((step) => step.trim()))}
        onClick={createOwnTask}
      >{busy ? "Adding..." : createVisibility === "private" ? "Add private work" : "Add to my work"}</button>
    </Sheet>}
  </div>;
}
