import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import VoiceInput from "../components/VoiceInput";
import { parseTask } from "../lib/parseTask";

const WORK_KINDS = [
  ["task", "Task"],
  ["routine", "Routine"],
  ["case", "Case"],
  ["request", "Request"],
  ["decision", "Decision"],
  ["meeting_outcome", "Meeting outcome"],
  ["deliverable", "Deliverable"],
];

export default function Assign({ me, back, initialProjectId = "", initialObjectiveId = "", initialPhaseId = "" }) {
  const [people, setPeople] = useState([]);
  const [subTeams, setSubTeams] = useState([]);
  const [projects, setProjects] = useState([]);
  const [objectives, setObjectives] = useState([]);
  const [phases, setPhases] = useState([]);
  const [title, setTitle] = useState("");
  const [purpose, setPurpose] = useState("");
  const [instructions, setInstructions] = useState("");
  const [expectedOutcome, setExpectedOutcome] = useState("");
  const [kind, setKind] = useState("task");
  const [assignee, setAssignee] = useState("");
  const [subTeam, setSubTeam] = useState("");
  const [project, setProject] = useState(initialProjectId);
  const [objective, setObjective] = useState(initialObjectiveId);
  const [phase, setPhase] = useState(initialPhaseId);
  const [due, setDue] = useState("");
  const [steps, setSteps] = useState([""]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const [voiceHint, setVoiceHint] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => { load(); }, [me.unit_id]);
  useEffect(() => {
    setProject(initialProjectId);
    setObjective(initialObjectiveId);
    setPhase(initialPhaseId);
  }, [initialProjectId, initialObjectiveId, initialPhaseId]);
  useEffect(() => { loadProjectContext(); }, [project]);

  async function load() {
    if (!me.unit_id) return;
    setErr(null);
    const { data: m, error: peopleError } = await supabase.from("unit_memberships")
      .select("profile_id, profiles(full_name)").eq("unit_id", me.unit_id);
    if (peopleError) { setErr(peopleError.message); return; }
    setPeople(m || []);
    const { data: st, error: teamError } = await supabase.from("sub_teams")
      .select("id,name,code").eq("unit_id", me.unit_id).eq("active", true).order("position");
    if (teamError) { setErr(teamError.message); return; }
    setSubTeams(st || []);
    const { data: p, error: projectError } = await supabase.from("projects").select("id,name").in("status", ["planned", "active"]).order("name");
    if (projectError) { setErr(projectError.message); return; }
    setProjects(p || []);
  }

  async function loadProjectContext() {
    if (!project) { setObjectives([]); setPhases([]); setObjective(""); setPhase(""); return; }
    const [objectiveResult, phaseResult] = await Promise.all([
      supabase.from("objectives").select("id, ref, name, unit_id").eq("project_id", project).order("ref"),
      supabase.from("project_phases").select("id, name, position").eq("project_id", project).order("position"),
    ]);
    if (objectiveResult.error) { setErr(`Project objectives: ${objectiveResult.error.message}`); return; }
    if (phaseResult.error) { setErr(`Project phases: ${phaseResult.error.message}`); return; }
    setObjectives(objectiveResult.data || []);
    setPhases(phaseResult.data || []);
    if (objective && !(objectiveResult.data || []).some((row) => row.id === objective)) setObjective("");
    if (phase && !(phaseResult.data || []).some((row) => row.id === phase)) setPhase("");
  }

  function handleVoice(text) {
    const parsed = parseTask(text, people);
    setTitle(parsed.title || text);
    if (parsed.due_at) {
      const d = new Date(parsed.due_at);
      const pad = (n) => String(n).padStart(2, "0");
      setDue(d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + "T" + pad(d.getHours()) + ":" + pad(d.getMinutes()));
    }
    if (parsed.assignee_id) setAssignee(parsed.assignee_id);
    const bits = [];
    if (parsed.due_at) bits.push("a date");
    if (parsed.assignee_id) bits.push("who it is for");
    setVoiceHint("Heard that" + (bits.length ? ", and picked up " + bits.join(" and ") : "") + ". Check it before you send.");
  }

  async function create() {
    setBusy(true); setErr(null);
    try {
      const { data: ref, error: refError } = await supabase
        .rpc("next_work_ref", { p_unit_id: me.unit_id, p_sub_team_id: subTeam || null });
      if (refError) throw refError;
      const dueIso = due ? new Date(due).toISOString() : null;
      const { data: wi, error } = await supabase.from("work_items").insert({
        org_id: me.org_id, ref, kind, unit_id: me.unit_id,
        sub_team_id: subTeam || null, project_id: project || null,
        objective_id: project && objective ? objective : null,
        phase_id: project && phase ? phase : null,
        assignee_id: assignee, assigned_by: me.id,
        title, purpose: purpose || null, instructions: instructions || null,
        expected_outcome: expectedOutcome || null,
        original_due_at: dueIso, due_at: dueIso, origin: "assigned", status: "not_started" })
        .select("id, ref").single();
      if (error) throw error;
      const clean = steps.map((s) => s.trim()).filter(Boolean);
      if (kind === "task" && clean.length) {
        const { error: checklistError } = await supabase.from("checklist_items")
          .insert(clean.map((label, i) => ({ work_item_id: wi.id, label, position: i + 1 })));
        if (checklistError) throw checklistError;
      }
      setDone(wi.ref);
      setTitle(""); setPurpose(""); setInstructions(""); setExpectedOutcome("");
      setKind("task"); setDue(""); setSteps([""]); setVoiceHint(null);
    } catch (e) { setErr(e.message || "Something went wrong. Nothing was sent."); }
    finally { setBusy(false); }
  }

  if (done) {
    return (
      <div className="body">
        <button className="back" onClick={back}>← Back</button>
        <div className="empty">
          <h3>{done} is with them</h3>
          <p>They will see what it is for and what finished looks like.</p>
          <button className="btn" onClick={() => setDone(null)}>Give out something else</button>
          <button className="btn btn-ghost" style={{ marginTop: 10 }} onClick={back}>Back to home</button>
        </div>
      </div>);
  }

  return (
    <div className="body">
      <button className="back" onClick={back}>← Back</button>
      <h1 className="h1">Give out work</h1>
      <p className="screen-note">What it is for and what finished looks like matter more than the title. Say it out loud if that is faster.</p>

      <VoiceInput onResult={handleVoice} label="Say what needs doing" />
      {voiceHint && <div className="flag flag-green" style={{ marginTop: 10 }}>{voiceHint}</div>}
      {err && <div className="flag flag-brick" style={{ marginTop: 10 }}>{err}</div>}

      <div className="split" style={{ marginTop: 10 }}>
        <div className="main-col">
          <div className="sec"><span>What needs doing</span></div>
          <select className="field" value={kind} onChange={(e) => setKind(e.target.value)}>
            {WORK_KINDS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <input className="field" placeholder="What needs doing" value={title} onChange={(e) => setTitle(e.target.value)} />
          <textarea className="field" rows={3} placeholder="Why this matters — who it is for, what happens if it is late" value={purpose} onChange={(e) => setPurpose(e.target.value)} />
          <textarea className="field" rows={3} placeholder="How it is done here (optional)" value={instructions} onChange={(e) => setInstructions(e.target.value)} />
          <div className="sec"><span>What finished looks like</span></div>
          <textarea className="field" rows={3} placeholder="Describe the finished result" value={expectedOutcome}
            onChange={(e) => setExpectedOutcome(e.target.value)} />
          {kind === "task" && (<>
            <p className="small" style={{ margin: "12px 0 4px" }}>Optional task checklist</p>
            {steps.map((s, i) => (
              <input key={i} className="field" placeholder={"Step " + (i + 1)} value={s}
                onChange={(e) => setSteps((x) => x.map((v, j) => (j === i ? e.target.value : v)))}
                onBlur={() => { if (s.trim() && i === steps.length - 1) setSteps((x) => [...x, ""]); }} />))}
          </>)}
        </div>
        <div className="side-col">
          <div className="sec"><span>Who is doing it</span></div>
          <select className="field" value={assignee} onChange={(e) => setAssignee(e.target.value)}>
            <option value="">Choose someone</option>
            {people.map((p) => (<option key={p.profile_id} value={p.profile_id}>{p.profiles ? p.profiles.full_name : "—"}</option>))}
          </select>
          <select className="field" value={subTeam} onChange={(e) => setSubTeam(e.target.value)}>
            <option value="">Which part of the team (optional)</option>
            {subTeams.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select className="field" value={project} onChange={(e) => { setProject(e.target.value); setObjective(""); setPhase(""); }}>
            <option value="">Part of a project (optional)</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          {project && <select className="field" value={objective} onChange={(e) => setObjective(e.target.value)}>
            <option value="">Project objective (optional)</option>
            {objectives.map((row) => <option key={row.id} value={row.id}>{row.ref} · {row.name}</option>)}
          </select>}
          {project && phases.length > 0 && <select className="field" value={phase} onChange={(e) => setPhase(e.target.value)}>
            <option value="">Project phase (optional)</option>
            {phases.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
          </select>}
          <div className="sec"><span>When</span></div>
          <input className="field" type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} />
          <button className="btn" style={{ marginTop: 20 }} onClick={create} disabled={busy || !title.trim() || !assignee}>
            {busy ? "Sending..." : "Give it out"}</button>
        </div>
      </div>
    </div>);
}
