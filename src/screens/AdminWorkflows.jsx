import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { EmptyState, FieldGroup, LoadingState, ProductNotice } from "../components/bits";
import { humanError } from "../lib/productLanguage";

function stamp(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB", {
    timeZone: "Africa/Accra",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function humanize(value = "") {
  return String(value).replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function AdminWorkflows({ me }) {
  const [definitions, setDefinitions] = useState([]);
  const [runs, setRuns] = useState([]);
  const [steps, setSteps] = useState([]);
  const [people, setPeople] = useState({});
  const [selectedStepId, setSelectedStepId] = useState(null);
  const [outcome, setOutcome] = useState("reviewed");
  const [note, setNote] = useState("");
  const [filter, setFilter] = useState("ready");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  useEffect(() => { load(); }, [me.id]);

  async function load() {
    setLoading(true);
    setError(null);
    const [definitionsResult, runsResult, stepsResult] = await Promise.all([
      supabase.from("workflow_definitions")
        .select("id,workflow_key,label,description,trigger_event_type,version,active")
        .eq("active", true),
      supabase.from("workflow_runs")
        .select("id,workflow_definition_id,source_event_id,subject_profile_id,aggregate_type,aggregate_id,state,started_at,completed_at")
        .eq("org_id", me.org_id)
        .order("started_at", { ascending: false })
        .limit(200),
      supabase.from("workflow_run_steps")
        .select("id,workflow_run_id,position,step_key,label,step_type,required_capability,state,completed_by,completed_at,outcome,note,created_at")
        .eq("org_id", me.org_id)
        .order("created_at", { ascending: false })
        .limit(400),
    ]);

    const firstError = definitionsResult.error || runsResult.error || stepsResult.error;
    if (firstError) {
      setError(humanError(firstError, "Workflow inbox could not load."));
      setLoading(false);
      return;
    }

    const runRows = runsResult.data || [];
    const stepRows = stepsResult.data || [];
    const profileIds = [...new Set([
      ...runRows.map((run) => run.subject_profile_id),
      ...stepRows.map((step) => step.completed_by),
    ].filter(Boolean))];

    let profileMap = {};
    if (profileIds.length) {
      const { data: profileRows, error: profileError } = await supabase
        .from("profiles")
        .select("id,full_name")
        .in("id", profileIds);
      if (profileError) {
        setError(humanError(profileError, "Workflow people could not be resolved."));
        setLoading(false);
        return;
      }
      profileMap = Object.fromEntries((profileRows || []).map((person) => [person.id, person.full_name]));
    }

    setDefinitions(definitionsResult.data || []);
    setRuns(runRows);
    setSteps(stepRows);
    setPeople(profileMap);
    setLoading(false);
  }

  const definitionsById = useMemo(
    () => Object.fromEntries(definitions.map((definition) => [definition.id, definition])),
    [definitions]
  );
  const runsById = useMemo(
    () => Object.fromEntries(runs.map((run) => [run.id, run])),
    [runs]
  );

  const shownSteps = steps.filter((step) => {
    if (filter === "ready") return step.state === "ready";
    if (filter === "completed") return step.state === "completed";
    return true;
  });

  const selectedStep = steps.find((step) => step.id === selectedStepId) || null;
  const selectedRun = selectedStep ? runsById[selectedStep.workflow_run_id] : null;
  const selectedDefinition = selectedRun ? definitionsById[selectedRun.workflow_definition_id] : null;

  async function completeStep() {
    if (!selectedStep || !outcome.trim()) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    const { error: completeError } = await supabase.rpc("complete_workflow_step", {
      p_run_step_id: selectedStep.id,
      p_outcome: outcome.trim(),
      p_note: note.trim() || null,
    });
    setBusy(false);
    if (completeError) {
      setError(humanError(completeError, "The workflow step could not be completed."));
      return;
    }
    setSelectedStepId(null);
    setNote("");
    setNotice("Workflow step completed.");
    await load();
  }

  if (loading) return <div className="body"><LoadingState label="Loading workflows…" /></div>;

  return <div className="body">
    <div style={{ paddingTop: 26 }}>
      <div className="eyebrow">Platform foundation</div>
      <h1 className="h1">Workflows</h1>
      <p className="screen-note">Event-driven process runs with explicit review authority and durable completion history.</p>
    </div>

    {error && <ProductNotice tone="error" title="Workflows">{error}</ProductNotice>}
    {notice && <ProductNotice tone="success" title="Workflow updated">{notice}</ProductNotice>}

    <div className="split" style={{ marginTop: 18 }}>
      <div className="main-col">
        <div className="sec"><span>Workflow inbox</span><span>{shownSteps.length}</span></div>
        <div className="seg" style={{ marginBottom: 12 }}>
          {[["ready","Ready"],["completed","Completed"],["all","All"]].map(([key,label]) =>
            <button key={key} className={filter === key ? "on" : ""} onClick={() => setFilter(key)}>{label}</button>
          )}
        </div>

        {shownSteps.map((step) => {
          const run = runsById[step.workflow_run_id];
          const definition = run ? definitionsById[run.workflow_definition_id] : null;
          return <button className="row row-button" key={step.id} onClick={() => setSelectedStepId(step.id)}>
            <div className="row-t">{step.label}</div>
            <div className="row-m">
              {definition?.label || "Workflow"} · {humanize(step.state)}
              {step.required_capability ? " · " + step.required_capability : ""}
            </div>
            <div className="row-m" style={{ marginTop: 5 }}>
              {run?.subject_profile_id ? people[run.subject_profile_id] || "Person" : humanize(run?.aggregate_type || "record")}
              {" · started " + stamp(run?.started_at)}
            </div>
            {step.state === "completed" && <div className="small" style={{ marginTop: 6 }}>
              {step.outcome || "Completed"} · {stamp(step.completed_at)}
              {step.completed_by ? " · " + (people[step.completed_by] || "Authorised user") : ""}
            </div>}
          </button>;
        })}
        {shownSteps.length === 0 && <EmptyState title={filter === "ready" ? "No workflow action is waiting" : "No workflows match"}>New matching business events will appear here automatically.</EmptyState>}
      </div>

      <div className="side-col">
        <div className="sec"><span>Review</span></div>
        {!selectedStep && <div className="card" style={{ padding: 15 }}><p className="small" style={{ margin: 0 }}>Choose a workflow step to inspect it.</p></div>}
        {selectedStep && <div className="card" style={{ padding: 15 }}>
          <strong>{selectedDefinition?.label || "Workflow"}</strong>
          <p className="small" style={{ lineHeight: 1.5 }}>
            {selectedDefinition?.description || "Review the workflow step."}
          </p>
          <div className="small">Step: {selectedStep.label}</div>
          <div className="small">Authority: {selectedStep.required_capability || "Signed-in user"}</div>
          <div className="small">State: {humanize(selectedStep.state)}</div>
          {selectedStep.state === "ready" && <>
            <FieldGroup label="Outcome">
              <input className="field" aria-label="Workflow outcome" value={outcome} onChange={(event) => setOutcome(event.target.value)} />
            </FieldGroup>
            <FieldGroup label="Review note">
              <textarea className="field" aria-label="Workflow review note" rows="3" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Optional review context" />
            </FieldGroup>
            <button className="btn" disabled={busy || !outcome.trim()} onClick={completeStep}>{busy ? "Completing…" : "Complete step"}</button>
          </>}
          {selectedStep.state === "completed" && <p className="small" style={{ lineHeight: 1.5 }}>
            Outcome: {selectedStep.outcome || "Completed"}{selectedStep.note ? " · " + selectedStep.note : ""}
          </p>}
        </div>}

        <div className="sec"><span>Engine</span></div>
        <div className="card" style={{ padding: 15 }}>
          <p className="small" style={{ lineHeight: 1.6, margin: 0 }}>
            Workflow runs are started from durable platform events. Users cannot directly rewrite workflow state; reviewed completion actions advance the process and preserve history.
          </p>
        </div>
      </div>
    </div>
  </div>;
}
