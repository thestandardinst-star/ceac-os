import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { dueLabel } from "../lib/time";
import { Sheet, statusPill } from "../components/bits";
const FILTERS = [["active","Active"],["waiting_on","Waiting on"],["in_review","In review"],["completed","Completed"],["private","Private"]];
export default function Work({ me, isManager = false, openItem }) {
  const [filter, setFilter] = useState("active");
  const [items, setItems] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [projects, setProjects] = useState([]);
  const [sheet, setSheet] = useState(null);
  const [projectId, setProjectId] = useState("");
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [steps, setSteps] = useState([""]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  useEffect(() => { load(); }, [filter, me.id, isManager]);
  useEffect(() => { loadProjects(); }, [me.id, me.unit_id]);
  async function load() {
    setLoadError(null);
    setItems([]);
    let q = supabase.from("work_items")
      .select("id, ref, title, status, due_at, visibility, projects(name)").eq("assignee_id", me.id);
    if (filter === "active") q = q.in("status", ["not_started", "in_progress", "returned"]).eq("visibility", "unit");
    else if (filter === "private") q = q.eq("visibility", "private");
    else if (filter === "completed" && isManager) q = q.in("status", ["completed", "self_certified"]);
    else q = q.eq("status", filter);
    const { data, error } = await q.order("due_at", { ascending: true, nullsFirst: false });
    if (error) { setLoadError(error.message); return; }
    setItems(data || []);
  }

  async function loadProjects() {
    if (!me.unit_id) return;
    const { data, error } = await supabase.from("projects")
      .select("id,name,project_units!inner(unit_id)")
      .eq("project_units.unit_id", me.unit_id)
      .in("status", ["planned", "active"])
      .order("name");
    if (error) { setLoadError(error.message); return; }
    setProjects(data || []);
  }

  async function createOwnTask() {
    const clean = steps.map((step) => step.trim()).filter(Boolean);
    if (!projectId || !title.trim() || !due || !clean.length) return;
    setBusy(true); setLoadError(null); setNotice(null);
    try {
      const { data: ref, error: refError } = await supabase.rpc("next_work_ref", {
        p_unit_id: me.unit_id, p_sub_team_id: null,
      });
      if (refError) throw refError;
      const dueIso = new Date(due).toISOString();
      const itemId = crypto.randomUUID();
      const { error: itemError } = await supabase.from("work_items").insert({
        id: itemId,
        org_id: me.org_id,
        ref,
        kind: "task",
        unit_id: me.unit_id,
        project_id: projectId,
        assignee_id: me.id,
        assigned_by: me.id,
        title: title.trim(),
        original_due_at: dueIso,
        due_at: dueIso,
        origin: "self_created",
        status: "not_started",
      });
      if (itemError) throw itemError;
      const { error: checklistError } = await supabase.from("checklist_items").insert(
        clean.map((label, index) => ({ work_item_id: itemId, label, position: index + 1 }))
      );
      if (checklistError) throw new Error(`Task ${ref} was created but its checklist could not be saved. Tell your manager before using it: ${checklistError.message}`);
      setSheet(null); setProjectId(""); setTitle(""); setDue(""); setSteps([""]);
      setNotice(`${ref} added to your work. Your manager can see it without approving it first.`);
      await load();
    } catch (error) {
      setLoadError(error.message || "The work could not be added.");
    } finally {
      setBusy(false);
    }
  }
  const grouped = {};
  items.forEach((i) => {
    const k = i.projects ? i.projects.name : "Other work";
    if (!grouped[k]) grouped[k] = [];
    grouped[k].push(i);
  });
  return (
    <div className="body">
      <div style={{ paddingTop: 26 }}>
        <h1 className="h1">My work</h1>
        <p className="screen-note">Everything assigned to you, and anything you added yourself.</p>
      </div>
      <button className="btn wide-auto" style={{ marginTop: 16 }} onClick={() => { setSheet("self"); setNotice(null); }}>Add agreed work</button>
      <p className="small" style={{ marginTop: 7 }}>For work you already agreed to carry. It appears immediately; your manager does not approve it first.</p>
      {notice && <div className="flag flag-green" style={{ marginTop: 10 }}>{notice}</div>}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 16 }}>
        {FILTERS.map(([k, label]) => (
          <button key={k} onClick={() => setFilter(k)} style={{
            fontSize: 12.5, padding: "6px 12px", borderRadius: 20, border: "1px solid var(--line)",
            background: filter === k ? "var(--ink)" : "var(--card)",
            color: filter === k ? "#fff" : "var(--ink-soft)", fontWeight: filter === k ? 600 : 400,
          }}>{label}</button>))}
      </div>
      {loadError && <div className="flag flag-brick" style={{ marginTop: 14 }}><h4>Could not load your work</h4>{loadError}</div>}
      {Object.keys(grouped).map((project) => (
        <div key={project}>
          <div className="sec"><span>{project}</span><span>{grouped[project].length}</span></div>
          {grouped[project].map((i) => (
            <button key={i.id} className="row" onClick={() => openItem(i.id)}>
              <div className="row-t">{i.title}</div>
              <div className="row-m">{i.ref} · {dueLabel(i.due_at)}</div>
              <div style={{ marginTop: 7, display: "flex", gap: 6 }}>
                {statusPill(i.status)}
                {i.visibility === "private" && <span className="pill p-grey">Only you can see this</span>}
              </div>
            </button>))}
        </div>))}
      {items.length === 0 && (
        <div className="empty"><h3>Nothing here</h3>
          <p>{filter === "private" ? "Private items are yours alone — they appear in no report and nobody else can see them." : "Nothing in this list at the moment."}</p>
        </div>)}
      {sheet === "self" && <Sheet onClose={() => !busy && setSheet(null)}>
        <div className="h2">Add agreed work</div>
        <p className="screen-note">For a task you already agreed to carry. Choose the project, say what you are doing, when it is due, and one clear completion point.</p>
        <select className="field" value={projectId} onChange={(event) => setProjectId(event.target.value)}>
          <option value="">Project</option>
          {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
        </select>
        <input className="field" placeholder="What I am doing" value={title} onChange={(event) => setTitle(event.target.value)} />
        <input className="field" type="datetime-local" value={due} onChange={(event) => setDue(event.target.value)} />
        <div className="small" style={{ marginTop: 12 }}>Completion checklist</div>
        {steps.map((step, index) => <input key={index} className="field" placeholder={index === 0 ? "What must be true when this is finished?" : "Another completion point (optional)"} value={step}
          onChange={(event) => setSteps((current) => current.map((value, i) => i === index ? event.target.value : value))}
          onBlur={() => { if (step.trim() && index === steps.length - 1 && steps.length < 4) setSteps((current) => [...current, ""]); }} />)}
        {projects.length === 0 && <div className="flag flag-amber" style={{ marginTop: 10 }}>No active project in your unit is available. This task cannot be added as agreed project work yet.</div>}
        <button className="btn" style={{ marginTop: 14 }} disabled={busy || !projectId || !title.trim() || !due || !steps.some((step) => step.trim())} onClick={createOwnTask}>
          {busy ? "Adding..." : "Add to my work"}
        </button>
      </Sheet>}
    </div>);
}
