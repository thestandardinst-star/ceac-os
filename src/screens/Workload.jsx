import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { EmptyState, FieldGroup, LoadingState, ProductNotice } from "../components/bits";
import { humanError } from "../lib/productLanguage";

function minutesLabel(value) {
  if (value === null || value === undefined) return "Not configured";
  const minutes = Number(value);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!rest) return hours + "h/week";
  return hours + "h " + rest + "m/week";
}

function patternLabel(pattern) {
  if (!pattern || pattern.kind === "not_recorded") return "Working pattern not recorded";
  return String(pattern.label || pattern.kind || "Recorded").replaceAll("_"," ");
}

export default function Workload({ me }) {
  const [people,setPeople]=useState([]);
  const [employment,setEmployment]=useState([]);
  const [capacities,setCapacities]=useState([]);
  const [commitments,setCommitments]=useState([]);
  const [projects,setProjects]=useState([]);
  const [work,setWork]=useState([]);
  const [leave,setLeave]=useState([]);
  const [horizonDays,setHorizonDays]=useState(30);
  const [selectedPerson,setSelectedPerson]=useState("");
  const [capacityMinutes,setCapacityMinutes]=useState("");
  const [capacityReason,setCapacityReason]=useState("");
  const [commitProject,setCommitProject]=useState("");
  const [commitMinutes,setCommitMinutes]=useState("");
  const [commitStarts,setCommitStarts]=useState(new Date().toISOString().slice(0,10));
  const [commitEnds,setCommitEnds]=useState("");
  const [commitReason,setCommitReason]=useState("");
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState(null);
  const [notice,setNotice]=useState(null);

  useEffect(()=>{ load(); },[me.id]);

  async function load(){
    setLoading(true); setError(null);
    const horizon = new Date(Date.now()+Number(horizonDays)*864e5).toISOString();
    const today = new Date().toISOString().slice(0,10);
    const [p,e,c,pc,pr,w,l]=await Promise.all([
      supabase.from("profiles").select("id,full_name,email,job_title,active").eq("org_id",me.org_id).eq("active",true).order("full_name"),
      supabase.from("employment_records").select("profile_id,unit_id,working_pattern,employment_status").eq("org_id",me.org_id),
      supabase.from("resource_capacity_versions").select("*").eq("org_id",me.org_id).lte("effective_on",today).order("effective_on",{ascending:false}).order("created_at",{ascending:false}),
      supabase.from("resource_project_commitment_versions").select("*").eq("org_id",me.org_id).order("created_at",{ascending:false}),
      supabase.from("projects").select("id,name,lead_unit_id,status").in("status",["planned","active"]).order("name"),
      supabase.from("work_items").select("id,title,kind,assignee_id,project_id,estimate_minutes,due_at,status").in("status",["not_started","in_progress","waiting_on","returned","in_review"]).lte("due_at",horizon),
      supabase.from("leave_requests").select("id,profile_id,start_date,end_date,days,status").eq("status","approved").lte("start_date",horizon.slice(0,10)).gte("end_date",today),
    ]);
    const first=p.error||e.error||c.error||pc.error||pr.error||w.error||l.error;
    if(first){setError(humanError(first,"Workload planning could not load.")); setLoading(false); return;}
    setPeople(p.data||[]); setEmployment(e.data||[]); setCapacities(c.data||[]); setCommitments(pc.data||[]);
    setProjects(pr.data||[]); setWork(w.data||[]); setLeave(l.data||[]);
    if(!selectedPerson && p.data?.length) setSelectedPerson(p.data[0].id);
    if(!commitProject && pr.data?.length) setCommitProject(pr.data[0].id);
    setLoading(false);
  }

  useEffect(()=>{ if(!loading) load(); },[horizonDays]);

  const capacityByPerson=useMemo(()=>{
    const out={};
    capacities.forEach(row=>{ if(!out[row.profile_id]) out[row.profile_id]=row; });
    return out;
  },[capacities]);

  const currentCommitments=useMemo(()=>{
    const superseded=new Set(commitments.map(row=>row.supersedes_id).filter(Boolean));
    return commitments.filter(row=>!superseded.has(row.id) && row.state==="active");
  },[commitments]);

  const employmentByPerson=useMemo(()=>Object.fromEntries(employment.map(row=>[row.profile_id,row])),[employment]);

  const rows=people.map(person=>{
    const personWork=work.filter(item=>item.assignee_id===person.id);
    const estimated=personWork.filter(item=>item.estimate_minutes!==null && item.estimate_minutes!==undefined);
    const dueMinutes=estimated.reduce((sum,item)=>sum+Number(item.estimate_minutes||0),0);
    const missing=personWork.length-estimated.length;
    const personCommitments=currentCommitments.filter(item=>item.profile_id===person.id);
    const committedMinutes=personCommitments.reduce((sum,item)=>sum+Number(item.planned_minutes_per_week||0),0);
    const personLeave=leave.filter(item=>item.profile_id===person.id);
    return {
      ...person,
      employment:employmentByPerson[person.id],
      capacity:capacityByPerson[person.id]||null,
      dueMinutes,
      missing,
      workCount:personWork.length,
      committedMinutes,
      commitments:personCommitments,
      leave:personLeave,
    };
  });

  const selected=rows.find(row=>row.id===selectedPerson)||null;
  const availableProjects=projects;

  async function recordCapacity(){
    if(!selectedPerson||!capacityMinutes||!capacityReason.trim()) return;
    setBusy(true); setError(null); setNotice(null);
    const {error:e}=await supabase.from("resource_capacity_versions").insert({
      org_id:me.org_id,
      profile_id:selectedPerson,
      weekly_minutes:Number(capacityMinutes),
      effective_on:new Date().toISOString().slice(0,10),
      reason:capacityReason.trim(),
      created_by:me.id,
    });
    setBusy(false);
    if(e){setError(humanError(e,"Planning capacity could not be recorded.")); return;}
    setCapacityMinutes(""); setCapacityReason(""); setNotice("Planning capacity recorded."); await load();
  }

  async function recordCommitment(){
    if(!selectedPerson||!commitProject||commitMinutes===""||!commitReason.trim()) return;
    const prior=currentCommitments.find(row=>row.profile_id===selectedPerson && row.project_id===commitProject)||null;
    setBusy(true); setError(null); setNotice(null);
    const {error:e}=await supabase.from("resource_project_commitment_versions").insert({
      org_id:me.org_id,
      profile_id:selectedPerson,
      project_id:commitProject,
      planned_minutes_per_week:Number(commitMinutes),
      starts_on:commitStarts,
      ends_on:commitEnds||null,
      state:"active",
      supersedes_id:prior?.id||null,
      reason:commitReason.trim(),
      created_by:me.id,
    });
    setBusy(false);
    if(e){setError(humanError(e,"Project commitment could not be recorded.")); return;}
    setCommitMinutes(""); setCommitReason(""); setNotice(prior?"Project commitment revised.":"Project commitment recorded."); await load();
  }

  if(loading) return <div className="body"><LoadingState label="Loading workload planning…" /></div>;

  return <div className="body">
    <div style={{paddingTop:26}}>
      <div className="eyebrow">Resource planning</div>
      <h1 className="h1">Workload</h1>
      <p className="screen-note">Factual planning components only. Attendance is not used as capacity or performance, and missing estimates are not guessed.</p>
    </div>

    {error&&<ProductNotice tone="error" title="Workload">{error}</ProductNotice>}
    {notice&&<ProductNotice tone="success" title="Workload updated">{notice}</ProductNotice>}

    <div className="work-scale-tools" style={{marginTop:16}}>
      <FieldGroup label="Planning horizon">
        <select className="field" aria-label="Workload planning horizon" value={horizonDays} onChange={e=>setHorizonDays(Number(e.target.value))}>
          <option value={14}>Next 14 days</option>
          <option value={30}>Next 30 days</option>
          <option value={60}>Next 60 days</option>
        </select>
      </FieldGroup>
      <FieldGroup label="Person">
        <select className="field" aria-label="Workload person" value={selectedPerson} onChange={e=>setSelectedPerson(e.target.value)}>
          {rows.map(row=><option key={row.id} value={row.id}>{row.full_name}</option>)}
        </select>
      </FieldGroup>
    </div>

    <div className="sec"><span>People</span><span>{rows.length}</span></div>
    <div className="workload-grid">
      {rows.map(row=><button key={row.id} className={"card row-button"+(selectedPerson===row.id?" on":"")} style={{padding:14,textAlign:"left"}} onClick={()=>setSelectedPerson(row.id)}>
        <div className="row-t">{row.full_name}</div>
        <div className="row-m">{patternLabel(row.employment?.working_pattern)} · capacity {minutesLabel(row.capacity?.weekly_minutes)}</div>
        <div className="small" style={{marginTop:6}}>
          Due estimates: {minutesLabel(row.dueMinutes).replace("/week","")} over {horizonDays} days · {row.missing} without estimate
        </div>
        <div className="small" style={{marginTop:3}}>Project commitments: {minutesLabel(row.committedMinutes)} · approved leave entries: {row.leave.length}</div>
      </button>)}
    </div>
    {!rows.length&&<EmptyState title="No people available">No people are visible in your planning scope.</EmptyState>}

    {selected&&<div className="split" style={{marginTop:18}}>
      <div className="main-col">
        <div className="sec"><span>{selected.full_name}</span></div>
        <div className="card" style={{padding:15}}>
          <div className="row-t">Recorded planning facts</div>
          <div className="row-m">{patternLabel(selected.employment?.working_pattern)}</div>
          <div className="small" style={{marginTop:8}}>Weekly planning capacity: {minutesLabel(selected.capacity?.weekly_minutes)}</div>
          <div className="small" style={{marginTop:4}}>Open work due within {horizonDays} days: {selected.workCount}</div>
          <div className="small" style={{marginTop:4}}>Estimated minutes attached to that work: {selected.dueMinutes}</div>
          <div className="small" style={{marginTop:4}}>Open work without estimate: {selected.missing}</div>
          <div className="small" style={{marginTop:4}}>Explicit project commitments: {minutesLabel(selected.committedMinutes)}</div>
          <div className="small" style={{marginTop:4}}>Approved leave overlapping horizon: {selected.leave.length} request{selected.leave.length===1?"":"s"}</div>
        </div>

        <div className="sec"><span>Project commitments</span><span>{selected.commitments.length}</span></div>
        {selected.commitments.map(item=><div className="row" key={item.id}>
          <div className="row-t">{projects.find(p=>p.id===item.project_id)?.name||"Project"}</div>
          <div className="row-m">{minutesLabel(item.planned_minutes_per_week)} · from {item.starts_on}{item.ends_on?" to "+item.ends_on:""}</div>
          <div className="small" style={{marginTop:6}}>{item.reason}</div>
        </div>)}
      </div>

      <div className="side-col">
        <div className="sec"><span>Record capacity</span></div>
        <div className="card" style={{padding:15}}>
          <FieldGroup label="Weekly planning minutes"><input className="field" aria-label="Weekly planning minutes" type="number" min="1" max="10080" value={capacityMinutes} onChange={e=>setCapacityMinutes(e.target.value)} /></FieldGroup>
          <FieldGroup label="Reason"><textarea className="field" aria-label="Capacity reason" rows="3" value={capacityReason} onChange={e=>setCapacityReason(e.target.value)} /></FieldGroup>
          <button className="btn" disabled={busy||!capacityMinutes||!capacityReason.trim()} onClick={recordCapacity}>Record planning capacity</button>
        </div>

        <div className="sec"><span>Record project commitment</span></div>
        <div className="card" style={{padding:15}}>
          <FieldGroup label="Project"><select className="field" aria-label="Workload project" value={commitProject} onChange={e=>setCommitProject(e.target.value)}>{availableProjects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></FieldGroup>
          <FieldGroup label="Minutes per week"><input className="field" aria-label="Project commitment minutes" type="number" min="0" max="10080" value={commitMinutes} onChange={e=>setCommitMinutes(e.target.value)} /></FieldGroup>
          <FieldGroup label="Starts"><input className="field" aria-label="Project commitment start" type="date" value={commitStarts} onChange={e=>setCommitStarts(e.target.value)} /></FieldGroup>
          <FieldGroup label="Ends"><input className="field" aria-label="Project commitment end" type="date" value={commitEnds} onChange={e=>setCommitEnds(e.target.value)} /></FieldGroup>
          <FieldGroup label="Reason"><textarea className="field" aria-label="Project commitment reason" rows="3" value={commitReason} onChange={e=>setCommitReason(e.target.value)} /></FieldGroup>
          <button className="btn" disabled={busy||!commitProject||commitMinutes===""||!commitReason.trim()} onClick={recordCommitment}>Record project commitment</button>
        </div>
      </div>
    </div>}
  </div>;
}
