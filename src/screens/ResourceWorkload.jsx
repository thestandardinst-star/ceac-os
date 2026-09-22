import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { EmptyState, FieldGroup, LoadingState, ProductNotice } from "../components/bits";
import { humanError } from "../lib/productLanguage";

const CLOSED_WORK = new Set(["completed","cancelled","self_certified"]);

function isoDate(date) {
  return date.toISOString().slice(0,10);
}
function addDays(date, days) {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate()+days);
  return copy;
}
function hours(minutes) {
  if (minutes === null || minutes === undefined) return "Not configured";
  const value = Number(minutes)/60;
  return Number.isInteger(value) ? `${value} h` : `${value.toFixed(1)} h`;
}
function human(value="") {
  return String(value).replaceAll("_"," ").replace(/\b\w/g,(m)=>m.toUpperCase());
}
function overlaps(startA,endA,startB,endB) {
  const a1 = startA || "0000-01-01";
  const a2 = endA || "9999-12-31";
  return a1 <= endB && a2 >= startB;
}
function latestApplicable(rows, predicate=()=>true) {
  return [...rows].filter(predicate).sort((a,b)=>{
    const ae=a.effective_on||a.starts_on||"";
    const be=b.effective_on||b.starts_on||"";
    if(ae!==be) return be.localeCompare(ae);
    return String(b.created_at||"").localeCompare(String(a.created_at||""));
  })[0]||null;
}

export default function ResourceWorkload({ me }) {
  const today = new Date();
  const [from,setFrom]=useState(isoDate(today));
  const [to,setTo]=useState(isoDate(addDays(today,13)));
  const [profiles,setProfiles]=useState([]);
  const [employment,setEmployment]=useState([]);
  const [capacityVersions,setCapacityVersions]=useState([]);
  const [commitmentVersions,setCommitmentVersions]=useState([]);
  const [projects,setProjects]=useState([]);
  const [work,setWork]=useState([]);
  const [routines,setRoutines]=useState([]);
  const [leave,setLeave]=useState([]);
  const [units,setUnits]=useState([]);
  const [selectedProfileId,setSelectedProfileId]=useState("");
  const [capacityHours,setCapacityHours]=useState("");
  const [capacityEffective,setCapacityEffective]=useState(isoDate(today));
  const [capacityReason,setCapacityReason]=useState("");
  const [commitmentProjectId,setCommitmentProjectId]=useState("");
  const [commitmentHours,setCommitmentHours]=useState("");
  const [commitmentState,setCommitmentState]=useState("active");
  const [commitmentStart,setCommitmentStart]=useState(isoDate(today));
  const [commitmentEnd,setCommitmentEnd]=useState("");
  const [commitmentReason,setCommitmentReason]=useState("");
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState(null);
  const [notice,setNotice]=useState(null);

  const capabilities=me.capabilities||[];
  const orgAuthority=capabilities.includes("resource.manage");
  const managedUnitIds=(me.memberships||[]).filter((row)=>row.role==="manager").map((row)=>row.unit_id);
  if(me.role==="manager" && me.unit_id && !managedUnitIds.includes(me.unit_id)) managedUnitIds.push(me.unit_id);

  useEffect(()=>{ load(); },[me.id]);

  async function load(){
    setLoading(true); setError(null);
    const rows=await Promise.all([
      supabase.from("profiles").select("id,full_name,email,active").eq("org_id",me.org_id).eq("active",true).order("full_name"),
      supabase.from("employment_records").select("profile_id,unit_id,manager_profile_id,working_pattern,employment_status").eq("org_id",me.org_id),
      supabase.from("resource_capacity_versions").select("*").eq("org_id",me.org_id).order("effective_on",{ascending:false}).order("created_at",{ascending:false}),
      supabase.from("resource_project_commitment_versions").select("*").eq("org_id",me.org_id).order("created_at",{ascending:false}),
      supabase.from("projects").select("id,name,lead_unit_id,status").eq("org_id",me.org_id).order("name"),
      supabase.from("work_items").select("id,title,assignee_id,project_id,unit_id,kind,status,estimate_minutes,due_at,visibility").eq("org_id",me.org_id).limit(1000),
      supabase.from("recurring_operations").select("id,name,work_item_id,unit_id,active,schedule_kind,cadence").eq("org_id",me.org_id).eq("active",true),
      supabase.from("leave_requests").select("id,profile_id,start_date,end_date,days,status").eq("org_id",me.org_id).eq("status","approved"),
      supabase.from("units").select("id,name").eq("org_id",me.org_id).order("name"),
    ]);
    const failed=rows.find((row)=>row.error);
    if(failed){ setError(humanError(failed.error,"Workload planning could not finish loading.")); setLoading(false); return; }
    const [p,e,c,pc,pr,w,r,l,u]=rows.map((row)=>row.data||[]);
    setProfiles(p); setEmployment(e); setCapacityVersions(c); setCommitmentVersions(pc); setProjects(pr);
    setWork(w); setRoutines(r); setLeave(l); setUnits(u);
    if(!selectedProfileId && p.length) setSelectedProfileId(p[0].id);
    if(!commitmentProjectId && pr.length) setCommitmentProjectId(pr[0].id);
    setLoading(false);
  }

  const employmentByProfile=useMemo(()=>Object.fromEntries(employment.map((row)=>[row.profile_id,row])),[employment]);
  const profilesById=useMemo(()=>Object.fromEntries(profiles.map((row)=>[row.id,row])),[profiles]);
  const projectsById=useMemo(()=>Object.fromEntries(projects.map((row)=>[row.id,row])),[projects]);
  const unitsById=useMemo(()=>Object.fromEntries(units.map((row)=>[row.id,row])),[units]);
  const workById=useMemo(()=>Object.fromEntries(work.map((row)=>[row.id,row])),[work]);

  const visiblePeople=useMemo(()=>profiles.filter((profile)=>{
    const record=employmentByProfile[profile.id];
    if(!record || record.employment_status!=="active") return false;
    if(orgAuthority) return true;
    return managedUnitIds.includes(record.unit_id);
  }),[profiles,employmentByProfile,orgAuthority,managedUnitIds.join("|")]);

  useEffect(()=>{
    if(visiblePeople.length && !visiblePeople.some((row)=>row.id===selectedProfileId)){
      setSelectedProfileId(visiblePeople[0].id);
    }
  },[visiblePeople.map((row)=>row.id).join("|")]);

  const manageableProjects=projects.filter((project)=>project.status!=="closed" && (orgAuthority||managedUnitIds.includes(project.lead_unit_id)));

  useEffect(()=>{
    if(manageableProjects.length && !manageableProjects.some((row)=>row.id===commitmentProjectId)){
      setCommitmentProjectId(manageableProjects[0].id);
    }
  },[manageableProjects.map((row)=>row.id).join("|")]);

  function latestCapacity(profileId){
    return latestApplicable(
      capacityVersions.filter((row)=>row.profile_id===profileId),
      (row)=>row.effective_on<=from
    );
  }

  function commitmentHistory(profileId,projectId){
    return commitmentVersions
      .filter((row)=>row.profile_id===profileId && row.project_id===projectId)
      .sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at)));
  }

  function currentCommitments(profileId){
    const groups=new Map();
    commitmentVersions.filter((row)=>row.profile_id===profileId).forEach((row)=>{
      const key=row.project_id;
      if(!groups.has(key)) groups.set(key,[]);
      groups.get(key).push(row);
    });
    return [...groups.values()].map((rows)=>latestApplicable(rows,(row)=>row.starts_on<=to))
      .filter(Boolean)
      .filter((row)=>row.state==="active" && overlaps(row.starts_on,row.ends_on,from,to));
  }

  function personFacts(profile){
    const record=employmentByProfile[profile.id];
    const cap=latestCapacity(profile.id);
    const commitments=currentCommitments(profile.id);
    const openWork=work.filter((item)=>item.assignee_id===profile.id && !CLOSED_WORK.has(item.status));
    const dueWork=openWork.filter((item)=>item.due_at && item.due_at.slice(0,10)>=from && item.due_at.slice(0,10)<=to);
    const estimatedDueMinutes=dueWork.reduce((sum,item)=>sum+(Number(item.estimate_minutes)||0),0);
    const missingEstimate=dueWork.filter((item)=>!item.estimate_minutes).length;
    const routineRows=routines.filter((routine)=>workById[routine.work_item_id]?.assignee_id===profile.id);
    const routineEstimatedPerOccurrence=routineRows.reduce((sum,row)=>sum+(Number(workById[row.work_item_id]?.estimate_minutes)||0),0);
    const leaveRows=leave.filter((row)=>row.profile_id===profile.id && overlaps(row.start_date,row.end_date,from,to));
    const leaveDays=leaveRows.reduce((sum,row)=>sum+(Number(row.days)||0),0);
    const commitmentMinutes=commitments.reduce((sum,row)=>sum+(Number(row.planned_minutes_per_week)||0),0);
    return {record,cap,commitments,dueWork,estimatedDueMinutes,missingEstimate,routineRows,routineEstimatedPerOccurrence,leaveRows,leaveDays,commitmentMinutes};
  }

  const selected=profilesById[selectedProfileId]||null;
  const selectedFacts=selected?personFacts(selected):null;
  const selectedCommitmentHistory=selectedProfileId&&commitmentProjectId?commitmentHistory(selectedProfileId,commitmentProjectId):[];
  const selectedPriorCommitment=selectedCommitmentHistory[0]||null;

  async function recordCapacity(){
    const numeric=Number(capacityHours);
    if(!selectedProfileId || !numeric || numeric<=0 || !capacityReason.trim()) return;
    setBusy(true); setError(null); setNotice(null);
    const {error:e}=await supabase.from("resource_capacity_versions").insert({
      org_id:me.org_id,
      profile_id:selectedProfileId,
      weekly_minutes:Math.round(numeric*60),
      effective_on:capacityEffective,
      reason:capacityReason.trim(),
      created_by:me.id,
    });
    setBusy(false);
    if(e){ setError(humanError(e,"Planning capacity could not be recorded.")); return; }
    setCapacityHours(""); setCapacityReason(""); setNotice("Planning capacity recorded."); await load();
  }

  async function recordCommitment(){
    const numeric=Number(commitmentHours);
    if(!selectedProfileId || !commitmentProjectId || !commitmentReason.trim()) return;
    if(commitmentState==="active" && (!numeric || numeric<=0)) return;
    if(commitmentState==="withdrawn" && !selectedPriorCommitment){
      setError("There is no existing commitment to withdraw."); return;
    }
    setBusy(true); setError(null); setNotice(null);
    const {error:e}=await supabase.from("resource_project_commitment_versions").insert({
      org_id:me.org_id,
      profile_id:selectedProfileId,
      project_id:commitmentProjectId,
      planned_minutes_per_week:commitmentState==="withdrawn"?0:Math.round(numeric*60),
      starts_on:commitmentStart,
      ends_on:commitmentEnd||null,
      state:commitmentState,
      supersedes_id:selectedPriorCommitment?.id||null,
      reason:commitmentReason.trim(),
      created_by:me.id,
    });
    setBusy(false);
    if(e){ setError(humanError(e,"Project commitment could not be recorded.")); return; }
    setCommitmentHours(""); setCommitmentReason(""); setNotice(commitmentState==="withdrawn"?"Project commitment withdrawn.":"Project commitment recorded."); await load();
  }

  if(loading) return <div className="body"><LoadingState label="Loading workload planning…" /></div>;

  return <div className="body">
    <div style={{paddingTop:26}}>
      <div className="eyebrow">Resource & workload</div>
      <h1 className="h1">Workload</h1>
      <p className="screen-note">Planning capacity, estimated work, recurring responsibilities, project commitments and approved leave. CEAC OS does not turn these components into an employee score.</p>
    </div>

    {error&&<ProductNotice tone="error" title="Workload">{error}</ProductNotice>}
    {notice&&<ProductNotice tone="success" title="Workload">{notice}</ProductNotice>}

    <section className="card" style={{padding:15,marginTop:18}}>
      <div className="sec" style={{marginTop:0}}><span>Planning horizon</span></div>
      <div className="form-grid two">
        <FieldGroup label="From"><input className="field" aria-label="Workload from date" type="date" value={from} onChange={(e)=>setFrom(e.target.value)} /></FieldGroup>
        <FieldGroup label="To"><input className="field" aria-label="Workload to date" type="date" value={to} min={from} onChange={(e)=>setTo(e.target.value)} /></FieldGroup>
      </div>
      <p className="small" style={{marginBottom:0}}>Estimated work is counted only when a recorded due date falls inside this horizon. Work without an estimate remains visible as “No estimate”. Approved leave days are shown from the leave request; they are not converted into hours.</p>
    </section>

    <div className="split" style={{marginTop:18}}>
      <div className="main-col">
        <div className="sec"><span>People</span><span>{visiblePeople.length}</span></div>
        {visiblePeople.map((profile)=>{
          const facts=personFacts(profile);
          const pattern=facts.record?.working_pattern?.kind||"not_recorded";
          return <button key={profile.id} className={"row row-button"+(selectedProfileId===profile.id?" on":"")} onClick={()=>setSelectedProfileId(profile.id)}>
            <div className="row-t">{profile.full_name}</div>
            <div className="row-m">{unitsById[facts.record?.unit_id]?.name||"Unit not recorded"} · {human(pattern)}</div>
            <div className="project-overview-summary" style={{marginTop:10}}>
              <div><strong>{hours(facts.cap?.weekly_minutes)}</strong><span>weekly planning capacity</span></div>
              <div><strong>{hours(facts.estimatedDueMinutes)}</strong><span>estimated due work</span></div>
              <div><strong>{hours(facts.commitmentMinutes)}</strong><span>project commitments / week</span></div>
              <div><strong>{facts.leaveDays||0}</strong><span>approved leave days</span></div>
            </div>
            {facts.missingEstimate>0&&<div className="small" style={{marginTop:8}}>{facts.missingEstimate} due item{facts.missingEstimate===1?"":"s"} with no estimate.</div>}
          </button>;
        })}
        {!visiblePeople.length&&<EmptyState title="No people in planning scope">People in units you manage will appear here.</EmptyState>}

        {selected&&selectedFacts&&<>
          <div className="sec"><span>Factual components</span></div>
          <div className="card" style={{padding:15}}>
            <div className="row-t">{selected.full_name}</div>
            <div className="row-m">Working pattern: {human(selectedFacts.record?.working_pattern?.kind||"not_recorded")}</div>
            <div className="project-overview-summary" style={{marginTop:12}}>
              <div><strong>{hours(selectedFacts.cap?.weekly_minutes)}</strong><span>weekly planning capacity</span></div>
              <div><strong>{selectedFacts.dueWork.length}</strong><span>open items due in horizon</span></div>
              <div><strong>{hours(selectedFacts.estimatedDueMinutes)}</strong><span>recorded estimate total</span></div>
              <div><strong>{selectedFacts.missingEstimate}</strong><span>due items without estimate</span></div>
              <div><strong>{selectedFacts.routineRows.length}</strong><span>active routines</span></div>
              <div><strong>{hours(selectedFacts.routineEstimatedPerOccurrence)}</strong><span>routine estimate / occurrence</span></div>
              <div><strong>{hours(selectedFacts.commitmentMinutes)}</strong><span>project commitment / week</span></div>
              <div><strong>{selectedFacts.leaveDays||0}</strong><span>approved leave request days</span></div>
            </div>
          </div>

          <div className="sec"><span>Project commitments</span><span>{selectedFacts.commitments.length}</span></div>
          {selectedFacts.commitments.map((row)=><div className="row" key={row.id}>
            <div className="row-t">{projectsById[row.project_id]?.name||"Project"}</div>
            <div className="row-m">{hours(row.planned_minutes_per_week)} / week · {row.starts_on}{row.ends_on?" → "+row.ends_on:""}</div>
            <div className="small" style={{marginTop:6}}>{row.reason}</div>
          </div>)}
          {!selectedFacts.commitments.length&&<div className="card small">No active project commitment has been recorded for this horizon.</div>}

          <div className="sec"><span>Approved leave in horizon</span><span>{selectedFacts.leaveRows.length}</span></div>
          {selectedFacts.leaveRows.map((row)=><div className="row" key={row.id}>
            <div className="row-t">{row.start_date} → {row.end_date}</div>
            <div className="row-m">{row.days} approved day{Number(row.days)===1?"":"s"}</div>
          </div>)}
          {!selectedFacts.leaveRows.length&&<div className="card small">No approved leave request overlaps this horizon.</div>}
        </>}
      </div>

      <div className="side-col">
        <div className="sec"><span>Record planning capacity</span></div>
        <div className="card" style={{padding:15}}>
          <FieldGroup label="Person">
            <select className="field" aria-label="Workload person" value={selectedProfileId} onChange={(e)=>setSelectedProfileId(e.target.value)}>
              {visiblePeople.map((profile)=><option key={profile.id} value={profile.id}>{profile.full_name}</option>)}
            </select>
          </FieldGroup>
          <FieldGroup label="Hours per week"><input className="field" aria-label="Planning hours per week" type="number" min="0.25" max="168" step="0.25" value={capacityHours} onChange={(e)=>setCapacityHours(e.target.value)} /></FieldGroup>
          <FieldGroup label="Effective date"><input className="field" aria-label="Planning capacity effective date" type="date" value={capacityEffective} onChange={(e)=>setCapacityEffective(e.target.value)} /></FieldGroup>
          <FieldGroup label="Reason"><textarea className="field" aria-label="Planning capacity reason" rows="3" value={capacityReason} onChange={(e)=>setCapacityReason(e.target.value)} placeholder="Why this planning capacity applies" /></FieldGroup>
          <button className="btn" disabled={busy||!selectedProfileId||!capacityHours||!capacityReason.trim()} onClick={recordCapacity}>{busy?"Recording…":"Record capacity version"}</button>
          <p className="small" style={{marginBottom:0}}>This is an operational planning assumption. It does not change the employment contract or attendance record.</p>
        </div>

        <div className="sec"><span>Project commitment</span></div>
        <div className="card" style={{padding:15}}>
          <FieldGroup label="Project">
            <select className="field" aria-label="Workload project" value={commitmentProjectId} onChange={(e)=>setCommitmentProjectId(e.target.value)}>
              {manageableProjects.map((project)=><option key={project.id} value={project.id}>{project.name}</option>)}
            </select>
          </FieldGroup>
          <FieldGroup label="Change">
            <select className="field" aria-label="Project commitment state" value={commitmentState} onChange={(e)=>setCommitmentState(e.target.value)}>
              <option value="active">Record / revise active commitment</option>
              <option value="withdrawn">Withdraw commitment</option>
            </select>
          </FieldGroup>
          {commitmentState==="active"&&<FieldGroup label="Hours per week"><input className="field" aria-label="Project commitment hours per week" type="number" min="0.25" max="168" step="0.25" value={commitmentHours} onChange={(e)=>setCommitmentHours(e.target.value)} /></FieldGroup>}
          <div className="form-grid two">
            <FieldGroup label="Starts"><input className="field" aria-label="Project commitment start date" type="date" value={commitmentStart} onChange={(e)=>setCommitmentStart(e.target.value)} /></FieldGroup>
            <FieldGroup label="Ends"><input className="field" aria-label="Project commitment end date" type="date" min={commitmentStart} value={commitmentEnd} onChange={(e)=>setCommitmentEnd(e.target.value)} /></FieldGroup>
          </div>
          <FieldGroup label="Reason"><textarea className="field" aria-label="Project commitment reason" rows="3" value={commitmentReason} onChange={(e)=>setCommitmentReason(e.target.value)} placeholder="Why this commitment changed" /></FieldGroup>
          <button className="btn" disabled={busy||!selectedProfileId||!commitmentProjectId||!commitmentReason.trim()||(commitmentState==="active"&&!commitmentHours)} onClick={recordCommitment}>{busy?"Recording…":commitmentState==="withdrawn"?"Record withdrawal":"Record commitment version"}</button>
          {selectedPriorCommitment&&<p className="small" style={{marginBottom:0}}>Latest history for this person/project: {human(selectedPriorCommitment.state)} · {hours(selectedPriorCommitment.planned_minutes_per_week)} / week.</p>}
        </div>
      </div>
    </div>
  </div>;
}
