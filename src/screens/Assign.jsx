import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import VoiceInput from "../components/VoiceInput";
import { parseTask } from "../lib/parseTask";

const WORK_KINDS = [
  ["task", "Task", "A specific action for someone to complete.", true],
  ["routine", "Routine", "Work that repeats on a schedule.", true],
  ["case", "Case", "A matter that stays open while several actions or follow-ups happen around it.", false],
  ["request", "Request", "Something you need another person or unit to provide, arrange or resolve.", false],
  ["decision", "Decision", "A choice that someone needs to make and record.", false],
  ["meeting_outcome", "Meeting outcome", "An action or commitment agreed in a meeting.", false],
  ["deliverable", "Deliverable", "A finished output that must be produced and shown.", false],
];

export default function Assign({ me, back, initialProjectId = "", initialObjectiveId = "", initialPhaseId = "", initialSubTeamId = "" }) {
  const [people, setPeople] = useState([]);
  const [subTeams, setSubTeams] = useState([]);
  const [approvedLeave, setApprovedLeave] = useState([]);
  const [projects, setProjects] = useState([]);
  const [objectives, setObjectives] = useState([]);
  const [phases, setPhases] = useState([]);
  const [title, setTitle] = useState("");
  const [purpose, setPurpose] = useState("");
  const [instructions, setInstructions] = useState("");
  const [expectedOutcome, setExpectedOutcome] = useState("");
  const [kind, setKind] = useState("task");
  const [assignee, setAssignee] = useState("");
  const [subTeam, setSubTeam] = useState(initialSubTeamId);
  const [project, setProject] = useState(initialProjectId);
  const [objective, setObjective] = useState(initialObjectiveId);
  const [phase, setPhase] = useState(initialPhaseId);
  const [due, setDue] = useState("");
  const [steps, setSteps] = useState([""]);
  const [noStepsNeeded, setNoStepsNeeded] = useState(false);
  const [routineSchedule, setRoutineSchedule] = useState("weekly");
  const [routineWeeklyDay, setRoutineWeeklyDay] = useState("7");
  const [routineWeekdays, setRoutineWeekdays] = useState([]);
  const [routineDayOfMonth, setRoutineDayOfMonth] = useState("");
  const [routineStart, setRoutineStart] = useState("");
  const [routineEnd, setRoutineEnd] = useState("");
  const [routineRecordsValue, setRoutineRecordsValue] = useState(false);
  const [routineValueLabel, setRoutineValueLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const [voiceHint, setVoiceHint] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => { load(); }, [me.unit_id]);
  useEffect(() => {
    setProject(initialProjectId);
    setObjective(initialObjectiveId);
    setPhase(initialPhaseId);
    setSubTeam(initialSubTeamId);
  }, [initialProjectId, initialObjectiveId, initialPhaseId, initialSubTeamId]);
  useEffect(() => { loadProjectContext(); }, [project]);

  async function load() {
    if (!me.unit_id) return;
    setErr(null);
    const [peopleResult, leaveResult] = await Promise.all([
      supabase.from("unit_memberships")
        .select("profile_id, profiles(full_name,active)").eq("unit_id", me.unit_id),
      supabase.from("leave_requests")
        .select("id,profile_id,kind,start_date,end_date,status")
        .eq("status", "approved"),
    ]);
    if (peopleResult.error) { setErr(peopleResult.error.message); return; }
    if (leaveResult.error) { setErr(leaveResult.error.message); return; }
    setPeople(peopleResult.data || []);
    const memberIds = new Set((peopleResult.data || []).map((row) => row.profile_id));
    setApprovedLeave((leaveResult.data || []).filter((row) => memberIds.has(row.profile_id)));
    const { data: st, error: teamError } = await supabase.from("sub_teams")
      .select("id,name,code").eq("unit_id", me.unit_id).eq("active", true).order("position");
    if (teamError) { setErr(teamError.message); return; }
    setSubTeams(st || []);
    const { data: p, error: projectError } = await supabase.from("projects").select("id,name,starts_on,ends_on,status,lead_unit_id,project_units(unit_id)").order("name");
    if (projectError) { setErr(projectError.message); return; }
    setProjects((p || []).filter((row) => row.lead_unit_id === me.unit_id || (row.project_units || []).some((unit) => unit.unit_id === me.unit_id)));
  }

  async function loadProjectContext() {
    if (!project) { setObjectives([]); setPhases([]); setObjective(""); setPhase(""); return; }
    const [objectiveResult, phaseResult] = await Promise.all([
      supabase.from("objectives").select("id, ref, name, unit_id, status").eq("project_id", project).eq("unit_id", me.unit_id).order("ref"),
      supabase.from("project_phases").select("id, name, position").eq("project_id", project).order("position"),
    ]);
    if (objectiveResult.error) { setErr(`Project objectives: ${objectiveResult.error.message}`); return; }
    if (phaseResult.error) { setErr(`Project phases: ${phaseResult.error.message}`); return; }
    setObjectives(objectiveResult.data || []);
    setPhases(phaseResult.data || []);
    if (objective && !(objectiveResult.data || []).some((row) => row.id === objective)) setObjective("");
    if (phase && !(phaseResult.data || []).some((row) => row.id === phase)) setPhase("");
  }

  const selectedProject = projects.find((row) => row.id === project) || null;
  const selectedObjective = objectives.find((row) => row.id === objective) || null;
  const selectedPerson = people.find((row) => row.profile_id === assignee) || null;
  const dueDate = due ? due.slice(0, 10) : null;
  const assignmentWarnings = [];
  if (selectedPerson?.profiles?.active === false) {
    assignmentWarnings.push({ key: "inactive", title: "This person is marked inactive", detail: "CEAC OS is showing the profile status already recorded for this person. Check that the intended assignee is correct before sending." });
  }
  if (assignee && dueDate) {
    approvedLeave.filter((row) => row.profile_id === assignee && row.start_date <= dueDate && row.end_date >= dueDate)
      .forEach((row) => assignmentWarnings.push({ key: `leave-${row.id}`, title: "Due date falls during approved leave", detail: `${row.kind} leave is recorded from ${row.start_date} to ${row.end_date}. This is a factual warning; change the assignee/date or proceed if the work has already been agreed.` }));
  }
  if (selectedProject?.status === "closed") {
    assignmentWarnings.push({ key: "closed-project", title: "This project is closed", detail: "The selected project is recorded as closed. Confirm that this work should still be attached here." });
  }
  if (selectedProject && dueDate && selectedProject.starts_on && dueDate < selectedProject.starts_on) {
    assignmentWarnings.push({ key: "before-project", title: "Due date is before the project starts", detail: `Project start: ${selectedProject.starts_on} · task due: ${dueDate}.` });
  }
  if (selectedProject && dueDate && selectedProject.ends_on && dueDate > selectedProject.ends_on) {
    assignmentWarnings.push({ key: "after-project", title: "Due date is after the project ends", detail: `Project end: ${selectedProject.ends_on} · task due: ${dueDate}.` });
  }
  if (selectedObjective && ["met", "partly_met", "not_met"].includes(selectedObjective.status)) {
    assignmentWarnings.push({ key: "finished-objective", title: "This objective already has an outcome recorded", detail: `${selectedObjective.ref} is marked ${selectedObjective.status.replaceAll("_", " ")}. Confirm that new work should still sit under it.` });
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
      const selectedKind = WORK_KINDS.find(([value]) => value === kind);
      if (!selectedKind?.[3]) throw new Error("This work type is not connected yet. CEAC OS will not save it with the wrong behaviour.");

      if (kind === "routine") {
        const details = {
          schedule_kind: routineSchedule,
          records_value: routineRecordsValue,
        };
        if (routineStart) details.starts_on = routineStart;
        if (routineEnd) details.ends_on = routineEnd;
        if (routineSchedule === "weekly") details.weekdays = [Number(routineWeeklyDay)];
        if (routineSchedule === "weekdays") details.weekdays = routineWeekdays.map(Number);
        if (routineSchedule === "monthly") details.day_of_month = Number(routineDayOfMonth);
        if (routineRecordsValue) details.value_label = routineValueLabel.trim();

        const { data: workId, error: routineError } = await supabase.rpc("create_typed_work", {
          p_kind: "routine",
          p_unit_id: me.unit_id,
          p_title: title.trim(),
          p_assignee_id: assignee || null,
          p_sub_team_id: subTeam || null,
          p_project_id: project || null,
          p_phase_id: project && phase ? phase : null,
          p_objective_id: project && objective ? objective : null,
          p_responsibility_id: null,
          p_purpose: purpose.trim() || null,
          p_expected_outcome: expectedOutcome.trim() || null,
          p_due_at: null,
          p_visibility: "unit",
          p_confidential: false,
          p_details: details,
        });
        if (routineError) throw routineError;
        const createdResult = await supabase.from("work_items").select("ref").eq("id", workId).single();
        if (createdResult.error) throw createdResult.error;
        setDone(createdResult.data.ref);
        setTitle(""); setPurpose(""); setInstructions(""); setExpectedOutcome("");
        setKind("task"); setAssignee(""); setDue(""); setSteps([""]); setNoStepsNeeded(false);
        setRoutineSchedule("weekly"); setRoutineWeeklyDay("7"); setRoutineWeekdays([]);
        setRoutineDayOfMonth(""); setRoutineStart(""); setRoutineEnd("");
        setRoutineRecordsValue(false); setRoutineValueLabel(""); setVoiceHint(null);
        return;
      }

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
      if (kind === "task" && !noStepsNeeded && clean.length) {
        const { error: checklistError } = await supabase.from("checklist_items")
          .insert(clean.map((label, i) => ({ work_item_id: wi.id, label, position: i + 1 })));
        if (checklistError) throw checklistError;
      }
      setDone(wi.ref);
      setTitle(""); setPurpose(""); setInstructions(""); setExpectedOutcome("");
      setKind("task"); setDue(""); setSteps([""]); setNoStepsNeeded(false); setVoiceHint(null);
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
      <p className="screen-note">Describe what needs to happen and what result you expect.</p>

      <VoiceInput onResult={handleVoice} label="Say what needs doing" />
      {voiceHint && <div className="flag flag-green" style={{ marginTop: 10 }}>{voiceHint}</div>}
      {err && <div className="flag flag-brick" style={{ marginTop: 10 }}>{err}</div>}

      <div className="split" style={{ marginTop: 10 }}>
        <div className="main-col">
          <div className="sec"><span>What needs doing</span></div>
          <select className="field" value={kind} onChange={(e) => setKind(e.target.value)}>
            {WORK_KINDS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <div className="hint">{WORK_KINDS.find(([value]) => value === kind)?.[2]}</div>
          {!WORK_KINDS.find(([value]) => value === kind)?.[3] && <div className="flag flag-amber" style={{ marginTop: 10 }}>
            <h4>{WORK_KINDS.find(([value]) => value === kind)?.[1]} is not connected yet</h4>
            Its approved behaviour is not connected to this screen yet. CEAC OS will not save it with Task behaviour.
          </div>}
          {kind === "routine" && <>
            <input className="field" placeholder="What repeats?" value={title} onChange={(e) => setTitle(e.target.value)} />
            <textarea className="field" rows={3} placeholder="Why this routine matters (optional)" value={purpose} onChange={(e) => setPurpose(e.target.value)} />
            <textarea className="field" rows={3} placeholder="What a good occurrence records or produces (optional)" value={expectedOutcome} onChange={(e) => setExpectedOutcome(e.target.value)} />
            <div className="sec"><span>Schedule</span></div>
            <select className="field" value={routineSchedule} onChange={(e) => setRoutineSchedule(e.target.value)}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="weekdays">Selected weekdays</option>
              <option value="monthly">Monthly</option>
            </select>
            {routineSchedule === "weekly" && <select className="field" value={routineWeeklyDay} onChange={(e) => setRoutineWeeklyDay(e.target.value)}>
              {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map((day, index) => <option key={day} value={index + 1}>{day}</option>)}
            </select>}
            {routineSchedule === "weekdays" && <div className="card small" style={{ marginTop: 10 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Which days?</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((day, index) => {
                  const value = index + 1;
                  const on = routineWeekdays.includes(value);
                  return <button type="button" key={day} className={`btn btn-sm ${on ? "" : "btn-ghost"}`}
                    onClick={() => setRoutineWeekdays((current) => on ? current.filter((d) => d !== value) : [...current, value].sort())}>{day}</button>;
                })}
              </div>
            </div>}
            {routineSchedule === "monthly" && <input className="field" type="number" min="1" max="31" placeholder="Day of month (1–31)"
              value={routineDayOfMonth} onChange={(e) => setRoutineDayOfMonth(e.target.value)} />}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <label className="small">Starts<input className="field" type="date" value={routineStart} onChange={(e) => setRoutineStart(e.target.value)} /></label>
              <label className="small">Ends (optional)<input className="field" type="date" value={routineEnd} onChange={(e) => setRoutineEnd(e.target.value)} /></label>
            </div>
            <label className="card small" style={{ display: "flex", alignItems: "flex-start", gap: 9, marginTop: 10 }}>
              <input type="checkbox" checked={routineRecordsValue} onChange={(e) => setRoutineRecordsValue(e.target.checked)} />
              <span>Record a number each time this routine happens.</span>
            </label>
            {routineRecordsValue && <input className="field" placeholder="What number? e.g. Peak online viewers" value={routineValueLabel} onChange={(e) => setRoutineValueLabel(e.target.value)} />}
          </>}
          {kind === "task" && <>
          <input className="field" placeholder="What needs doing" value={title} onChange={(e) => setTitle(e.target.value)} />
          <textarea className="field" rows={3} placeholder="Why this matters — who it is for, what happens if it is late" value={purpose} onChange={(e) => setPurpose(e.target.value)} />
          <textarea className="field" rows={3} placeholder="How it is done here (optional)" value={instructions} onChange={(e) => setInstructions(e.target.value)} />
          <div className="sec"><span>What finished looks like</span></div>
          <textarea className="field" rows={3} placeholder="Describe the finished result" value={expectedOutcome}
            onChange={(e) => setExpectedOutcome(e.target.value)} />
            <p className="small" style={{ margin: "12px 0 4px" }}>Optional task checklist</p>
            {steps.map((s, i) => (
              <input key={i} className="field" placeholder={"Step " + (i + 1)} value={s}
                disabled={noStepsNeeded}
                onChange={(e) => setSteps((x) => x.map((v, j) => (j === i ? e.target.value : v)))} />))}
            {!noStepsNeeded && <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 8 }}
              disabled={!steps[steps.length - 1]?.trim()}
              onClick={() => setSteps((current) => [...current, ""])}>+ Add another step</button>}
            <label className="card small" style={{ display: "flex", alignItems: "flex-start", gap: 9, marginTop: 10 }}>
              <input type="checkbox" checked={noStepsNeeded} onChange={(event) => setNoStepsNeeded(event.target.checked)} />
              <span>No steps needed — let the assignee determine the method.</span>
            </label>
          </>}
        </div>
        {kind === "routine" && <div className="side-col">
          <div className="sec"><span>Who owns it</span></div>
          <select className="field" value={assignee} onChange={(e) => setAssignee(e.target.value)}>
            <option value="">Choose someone</option>
            {people.map((p) => (<option key={p.profile_id} value={p.profile_id}>{p.profiles ? p.profiles.full_name : "—"}</option>))}
          </select>
          <select className="field" value={subTeam} onChange={(e) => setSubTeam(e.target.value)}>
            <option value="">Which part of the team (optional)</option>
            {subTeams.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
          </select>
          <select className="field" value={project} onChange={(e) => { setProject(e.target.value); setObjective(""); setPhase(""); }}>
            <option value="">Part of a project (optional)</option>
            {projects.map((row) => <option key={row.id} value={row.id}>{row.name}{!["planned","active"].includes(row.status) ? ` · ${row.status}` : ""}</option>)}
          </select>
          {project && <select className="field" value={objective} onChange={(e) => setObjective(e.target.value)}>
            <option value="">Project objective (optional)</option>
            {objectives.map((row) => <option key={row.id} value={row.id}>{row.ref} · {row.name}</option>)}
          </select>}
          {project && phases.length > 0 && <select className="field" value={phase} onChange={(e) => setPhase(e.target.value)}>
            <option value="">Project phase (optional)</option>
            {phases.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
          </select>}
          <button className="btn" style={{ marginTop: 20 }} onClick={create}
            disabled={busy || !title.trim() || !assignee
              || (routineSchedule === "weekdays" && routineWeekdays.length === 0)
              || (routineSchedule === "monthly" && !(Number(routineDayOfMonth) >= 1 && Number(routineDayOfMonth) <= 31))
              || (routineRecordsValue && !routineValueLabel.trim())}>
            {busy ? "Saving..." : "Create routine"}</button>
          <div className="hint">Routine history is recorded occurrence by occurrence. Changing its schedule later does not rewrite earlier records.</div>
        </div>}
        {kind === "task" && <div className="side-col">
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
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}{!["planned","active"].includes(p.status) ? ` · ${p.status}` : ""}</option>)}
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
          {assignmentWarnings.length > 0 && <div style={{ marginTop: 12 }}>
            {assignmentWarnings.map((warning) => <div key={warning.key} className="flag flag-amber" style={{ marginTop: 8 }}>
              <h4>{warning.title}</h4>{warning.detail}
            </div>)}
          </div>}
          <button className="btn" style={{ marginTop: 20 }} onClick={create} disabled={busy || !title.trim() || !assignee}>
            {busy ? "Sending..." : "Give it out"}</button>
        </div>}
      </div>
    </div>);
}
