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

export default function AdminLifecycle({ me }) {
  const [people,setPeople]=useState([]);
  const [cases,setCases]=useState([]);
  const [steps,setSteps]=useState([]);
  const [profileId,setProfileId]=useState("");
  const [type,setType]=useState("onboarding");
  const [effectiveOn,setEffectiveOn]=useState(new Date().toISOString().slice(0,10));
  const [reason,setReason]=useState("");
  const [selectedCaseId,setSelectedCaseId]=useState(null);
  const [note,setNote]=useState("");
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState(null);
  const [notice,setNotice]=useState(null);

  useEffect(()=>{ load(); },[me.id]);

  async function load(){
    setLoading(true); setError(null);
    const [p,c,s]=await Promise.all([
      supabase.from("profiles").select("id,full_name,email,job_title,active").eq("org_id",me.org_id).order("full_name"),
      supabase.from("employee_lifecycle_cases").select("*").eq("org_id",me.org_id).order("started_at",{ascending:false}).limit(200),
      supabase.from("employee_lifecycle_steps").select("*").eq("org_id",me.org_id).order("created_at",{ascending:false}).limit(800),
    ]);
    const first=p.error||c.error||s.error;
    if(first){ setError(humanError(first,"Employee lifecycle could not load.")); setLoading(false); return; }
    setPeople(p.data||[]); setCases(c.data||[]); setSteps(s.data||[]);
    if(!profileId&&p.data?.length) setProfileId(p.data[0].id);
    if(!selectedCaseId&&c.data?.length) setSelectedCaseId(c.data[0].id);
    setLoading(false);
  }

  const peopleById=useMemo(()=>Object.fromEntries(people.map(p=>[p.id,p])),[people]);
  const selectedCase=cases.find(c=>c.id===selectedCaseId)||null;
  const caseSteps=steps.filter(s=>s.lifecycle_case_id===selectedCaseId).sort((a,b)=>a.position-b.position);
  const readyStep=caseSteps.find(s=>s.state==="ready")||null;

  async function startCase(){
    if(!profileId||!reason.trim()||!effectiveOn) return;
    setBusy(true); setError(null); setNotice(null);
    const {data,error:e}=await supabase.from("employee_lifecycle_cases").insert({
      org_id:me.org_id,
      profile_id:profileId,
      lifecycle_type:type,
      planned_effective_on:effectiveOn,
      reason:reason.trim(),
      state:"active",
      created_by:me.id,
    }).select("id").single();
    setBusy(false);
    if(e){ setError(humanError(e,"The employee lifecycle case could not be started.")); return; }
    setReason("");
    setSelectedCaseId(data?.id||null);
    setNotice("Employee lifecycle case started.");
    await load();
  }

  async function completeReadyStep(){
    if(!readyStep) return;
    setBusy(true); setError(null); setNotice(null);
    const {error:e}=await supabase.from("employee_lifecycle_steps").update({
      state:"completed",
      completed_by:me.id,
      completed_at:new Date().toISOString(),
      note:note.trim()||null,
    }).eq("id",readyStep.id);
    setBusy(false);
    if(e){ setError(humanError(e,"The lifecycle step could not be completed.")); return; }
    setNote("");
    setNotice("Lifecycle step completed.");
    await load();
  }

  if(loading) return <div className="body"><LoadingState label="Loading employee lifecycle…" /></div>;

  return <div className="body">
    <div style={{paddingTop:26}}>
      <div className="eyebrow">People operations</div>
      <h1 className="h1">Employee lifecycle</h1>
      <p className="screen-note">Controlled onboarding and offboarding with ordered steps, employment history, events and audit.</p>
    </div>

    {error&&<ProductNotice tone="error" title="Employee lifecycle">{error}</ProductNotice>}
    {notice&&<ProductNotice tone="success" title="Employee lifecycle">{notice}</ProductNotice>}

    <div className="split" style={{marginTop:18}}>
      <div className="main-col">
        <div className="sec"><span>Cases</span><span>{cases.length}</span></div>
        {cases.map(item=>{
          const person=peopleById[item.profile_id];
          const caseStepRows=steps.filter(s=>s.lifecycle_case_id===item.id);
          const done=caseStepRows.filter(s=>s.state==="completed").length;
          return <button key={item.id} className={"row row-button"+(selectedCaseId===item.id?" on":"")} onClick={()=>setSelectedCaseId(item.id)}>
            <div className="row-t">{person?.full_name||"Employee"} · {humanize(item.lifecycle_type)}</div>
            <div className="row-m">{humanize(item.state)} · effective {item.planned_effective_on} · {done}/{caseStepRows.length} steps</div>
            <div className="small" style={{marginTop:6}}>{item.reason}</div>
          </button>;
        })}
        {!cases.length&&<EmptyState title="No lifecycle cases">Start an onboarding or offboarding case from the form.</EmptyState>}

        {selectedCase&&<>
          <div className="sec"><span>Case steps</span><span>{caseSteps.length}</span></div>
          {caseSteps.map(step=><div className="row" key={step.id}>
            <div className="row-t">{step.position}. {step.label}</div>
            <div className="row-m">{humanize(step.state)} · {step.required_capability}</div>
            {step.completed_at&&<div className="small" style={{marginTop:6}}>Completed {stamp(step.completed_at)}{step.note?" · "+step.note:""}</div>}
          </div>)}
        </>}
      </div>

      <div className="side-col">
        <div className="sec"><span>Start case</span></div>
        <div className="card" style={{padding:15}}>
          <FieldGroup label="Employee">
            <select className="field" aria-label="Lifecycle employee" value={profileId} onChange={e=>setProfileId(e.target.value)}>
              {people.map(p=><option key={p.id} value={p.id}>{p.full_name} · {p.email}</option>)}
            </select>
          </FieldGroup>
          <FieldGroup label="Lifecycle type">
            <select className="field" aria-label="Lifecycle type" value={type} onChange={e=>setType(e.target.value)}>
              <option value="onboarding">Onboarding</option>
              <option value="offboarding">Offboarding</option>
            </select>
          </FieldGroup>
          <FieldGroup label="Effective date"><input className="field" aria-label="Lifecycle effective date" type="date" value={effectiveOn} onChange={e=>setEffectiveOn(e.target.value)} /></FieldGroup>
          <FieldGroup label="Reason"><textarea className="field" aria-label="Lifecycle reason" rows="3" value={reason} onChange={e=>setReason(e.target.value)} /></FieldGroup>
          <button className="btn" disabled={busy||!profileId||!reason.trim()||!effectiveOn} onClick={startCase}>{busy?"Starting…":"Start lifecycle case"}</button>
        </div>

        <div className="sec"><span>Current action</span></div>
        {!selectedCase&&<div className="card" style={{padding:15}}><p className="small" style={{margin:0}}>Choose a lifecycle case to inspect its next step.</p></div>}
        {selectedCase&&<div className="card" style={{padding:15}}>
          <strong>{peopleById[selectedCase.profile_id]?.full_name||"Employee"} · {humanize(selectedCase.lifecycle_type)}</strong>
          <p className="small" style={{lineHeight:1.5}}>Effective {selectedCase.planned_effective_on} · {humanize(selectedCase.state)}</p>
          {readyStep?<>
            <div className="row-t">{readyStep.label}</div>
            <div className="small" style={{marginTop:6}}>Required authority: {readyStep.required_capability}</div>
            <FieldGroup label="Completion note"><textarea className="field" aria-label="Lifecycle completion note" rows="3" value={note} onChange={e=>setNote(e.target.value)} /></FieldGroup>
            <button className="btn" disabled={busy} onClick={completeReadyStep}>{busy?"Completing…":"Complete current step"}</button>
          </>:<p className="small">{selectedCase.state==="completed"?"This lifecycle case is complete.":"No step is currently ready."}</p>}
        </div>}
      </div>
    </div>
  </div>;
}
