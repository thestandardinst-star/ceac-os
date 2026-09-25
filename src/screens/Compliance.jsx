import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { EmptyState, FieldGroup, LoadingState, Pill, ProductNotice, Sheet } from "../components/bits";
import { humanError } from "../lib/productLanguage";
import { Table } from "../components/primitives";

function human(value=""){ return String(value||"").replaceAll("_"," ").replace(/\b\w/g,(m)=>m.toUpperCase()); }
function day(value){
  if(!value) return "Not recorded";
  return new Date(value+"T00:00:00").toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"});
}
function dateTime(value){
  if(!value) return "Not recorded";
  return new Date(value).toLocaleString("en-GB",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});
}
function latestVersions(rows,keyField){
  const superseded=new Set(rows.map((row)=>row.supersedes_id).filter(Boolean));
  return rows.filter((row)=>!superseded.has(row.id)).sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at)));
}
function stateTone(state,expired=false){
  if(expired) return "amber";
  if(["verified","approved","active"].includes(state)) return "green";
  if(["rejected","declined"].includes(state)) return "brick";
  if(["submitted","requested"].includes(state)) return "blue";
  return "grey";
}

export default function Compliance({ me }) {
  const canManage=(me.capabilities||[]).includes("compliance.manage");
  const isManager=me.role==="manager";
  const [tab,setTab]=useState("policies");
  const [policies,setPolicies]=useState([]);
  const [applicability,setApplicability]=useState([]);
  const [requirements,setRequirements]=useState([]);
  const [acknowledgements,setAcknowledgements]=useState([]);
  const [evidence,setEvidence]=useState([]);
  const [exceptions,setExceptions]=useState([]);
  const [people,setPeople]=useState([]);
  const [units,setUnits]=useState([]);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState(null);
  const [notice,setNotice]=useState(null);

  const [policySheet,setPolicySheet]=useState(false);
  const [policyEdit,setPolicyEdit]=useState(null);
  const [policyTitle,setPolicyTitle]=useState("");
  const [policyCategory,setPolicyCategory]=useState("");
  const [policySummary,setPolicySummary]=useState("");
  const [policyBody,setPolicyBody]=useState("");
  const [policyEffective,setPolicyEffective]=useState(new Date().toISOString().slice(0,10));
  const [policyExpires,setPolicyExpires]=useState("");
  const [policySource,setPolicySource]=useState("");
  const [policyReason,setPolicyReason]=useState("");
  const [scopes,setScopes]=useState([]);
  const [scopeKind,setScopeKind]=useState("organisation");
  const [scopeValue,setScopeValue]=useState("");
  const [reqs,setReqs]=useState([]);
  const [reqCode,setReqCode]=useState("");
  const [reqTitle,setReqTitle]=useState("");
  const [reqDescription,setReqDescription]=useState("");
  const [reqAck,setReqAck]=useState(true);
  const [reqEvidence,setReqEvidence]=useState(false);
  const [reqEvidenceKind,setReqEvidenceKind]=useState("");
  const [reqValidDays,setReqValidDays]=useState("");

  const [evidenceSheet,setEvidenceSheet]=useState(null);
  const [evidenceReference,setEvidenceReference]=useState("");
  const [evidenceNote,setEvidenceNote]=useState("");
  const [evidenceIssued,setEvidenceIssued]=useState("");
  const [evidenceExpires,setEvidenceExpires]=useState("");

  const [exceptionSheet,setExceptionSheet]=useState(null);
  const [exceptionReason,setExceptionReason]=useState("");
  const [exceptionUntil,setExceptionUntil]=useState("");

  const [reviewSheet,setReviewSheet]=useState(null);
  const [reviewAction,setReviewAction]=useState("verified");
  const [reviewNote,setReviewNote]=useState("");

  const [decisionSheet,setDecisionSheet]=useState(null);
  const [decisionAction,setDecisionAction]=useState("approved");
  const [decisionNote,setDecisionNote]=useState("");
  const [decisionUntil,setDecisionUntil]=useState("");

  useEffect(()=>{load();},[me.id]);

  async function load(){
    setLoading(true); setError(null);
    const queries=[
      supabase.from("compliance_policy_versions").select("*").order("created_at",{ascending:false}),
      supabase.from("compliance_policy_applicability").select("*").order("created_at"),
      supabase.from("compliance_requirements").select("*").order("created_at"),
      supabase.from("compliance_acknowledgements").select("*, profile:profiles!compliance_acknowledgements_profile_id_fkey(full_name)").order("acknowledged_at",{ascending:false}),
      supabase.from("compliance_evidence_versions").select("*, profile:profiles!compliance_evidence_versions_profile_id_fkey(full_name), requirement:compliance_requirements!compliance_evidence_versions_requirement_id_fkey(title,requirement_code,policy_version_id)").order("created_at",{ascending:false}),
      supabase.from("compliance_exception_versions").select("*, profile:profiles!compliance_exception_versions_profile_id_fkey(full_name), requirement:compliance_requirements!compliance_exception_versions_requirement_id_fkey(title,requirement_code,policy_version_id)").order("created_at",{ascending:false}),
    ];
    if(canManage){
      queries.push(
        supabase.from("profiles").select("id,full_name,email,active").eq("org_id",me.org_id).eq("active",true).order("full_name"),
        supabase.from("units").select("id,name,active").eq("org_id",me.org_id).eq("active",true).order("name")
      );
    }
    const results=await Promise.all(queries);
    const failed=results.find((r)=>r.error);
    if(failed){setError(humanError(failed.error,"Compliance could not finish loading."));setLoading(false);return;}
    setPolicies(results[0].data||[]);
    setApplicability(results[1].data||[]);
    setRequirements(results[2].data||[]);
    setAcknowledgements(results[3].data||[]);
    setEvidence(results[4].data||[]);
    setExceptions(results[5].data||[]);
    if(canManage){setPeople(results[6].data||[]);setUnits(results[7].data||[]);}
    setLoading(false);
  }

  const currentPolicies=useMemo(()=>{
    const superseded=new Set(policies.map((p)=>p.supersedes_id).filter(Boolean));
    return policies.filter((p)=>!superseded.has(p.id)).sort((a,b)=>a.title.localeCompare(b.title));
  },[policies]);
  const evidenceLatest=useMemo(()=>latestVersions(evidence,"evidence_key"),[evidence]);
  const exceptionLatest=useMemo(()=>latestVersions(exceptions,"exception_key"),[exceptions]);
  const policyById=Object.fromEntries(policies.map((p)=>[p.id,p]));
  const today=new Date().toISOString().slice(0,10);

  function policyReqs(policyId){return requirements.filter((r)=>r.policy_version_id===policyId);}
  function policyScopes(policyId){return applicability.filter((r)=>r.policy_version_id===policyId);}
  function ackFor(policyId,profileId=me.id){return acknowledgements.find((a)=>a.policy_version_id===policyId&&a.profile_id===profileId)||null;}
  function latestEvidenceFor(reqId,profileId=me.id){return evidenceLatest.find((row)=>row.requirement_id===reqId&&row.profile_id===profileId)||null;}
  function latestExceptionFor(reqId,profileId=me.id){return exceptionLatest.find((row)=>row.requirement_id===reqId&&row.profile_id===profileId)||null;}

  async function rpc(name,args,success){
    setBusy(true);setError(null);setNotice(null);
    const {error:e}=await supabase.rpc(name,args);
    if(e){setBusy(false);setError(humanError(e,"That compliance change could not be recorded."));return false;}
    await load();setBusy(false);setNotice(success);return true;
  }

  function scopeLabel(row){
    if(row.scope_kind==="organisation") return "Entire organisation";
    if(row.scope_kind==="unit") return units.find((u)=>u.id===row.unit_id)?.name||"Unit";
    if(row.scope_kind==="person") return people.find((p)=>p.id===row.profile_id)?.full_name||"Named person";
    return human(row.employment_type);
  }

  function openNewPolicy(){
    setPolicyEdit(null);setPolicyTitle("");setPolicyCategory("");setPolicySummary("");setPolicyBody("");
    setPolicyEffective(today);setPolicyExpires("");setPolicySource("");setPolicyReason("");
    setScopes([]);setReqs([]);setScopeKind("organisation");setScopeValue("");
    setReqCode("");setReqTitle("");setReqDescription("");setReqAck(true);setReqEvidence(false);setReqEvidenceKind("");setReqValidDays("");
    setPolicySheet(true);
  }
  function openRevision(policy){
    setPolicyEdit(policy);setPolicyTitle(policy.title);setPolicyCategory(policy.category);
    setPolicySummary(policy.summary||"");setPolicyBody(policy.body_text);setPolicyEffective(today);
    setPolicyExpires(policy.expires_on||"");setPolicySource(policy.source_reference||"");setPolicyReason("");
    setScopes(policyScopes(policy.id).map((r)=>({
      scope_kind:r.scope_kind,unit_id:r.unit_id||null,profile_id:r.profile_id||null,employment_type:r.employment_type||null,
      label:scopeLabel(r)
    })));
    setReqs(policyReqs(policy.id).map((r)=>({
      requirement_code:r.requirement_code,title:r.title,description:r.description||"",
      acknowledgement_required:r.acknowledgement_required,evidence_required:r.evidence_required,
      evidence_kind:r.evidence_kind||"",evidence_valid_days:r.evidence_valid_days||null
    })));
    setPolicySheet(true);
  }
  function addScope(){
    let row={scope_kind:scopeKind,unit_id:null,profile_id:null,employment_type:null,label:"Entire organisation"};
    if(scopeKind==="unit"){
      if(!scopeValue)return;
      row={...row,unit_id:scopeValue,label:units.find((u)=>u.id===scopeValue)?.name||"Unit"};
    }else if(scopeKind==="person"){
      if(!scopeValue)return;
      row={...row,profile_id:scopeValue,label:people.find((p)=>p.id===scopeValue)?.full_name||"Person"};
    }else if(scopeKind==="employment_type"){
      if(scopeValue.trim().length<2)return;
      row={...row,employment_type:scopeValue.trim(),label:human(scopeValue.trim())};
    }
    if(!scopes.some((x)=>JSON.stringify(x)===JSON.stringify(row))) setScopes([...scopes,row]);
    setScopeValue("");
  }
  function addRequirement(){
    if(reqCode.trim().length<2||reqTitle.trim().length<3)return;
    if(reqEvidence&&reqEvidenceKind.trim().length<2)return;
    setReqs([...reqs,{
      requirement_code:reqCode.trim(),title:reqTitle.trim(),description:reqDescription.trim(),
      acknowledgement_required:reqAck,evidence_required:reqEvidence,
      evidence_kind:reqEvidence?reqEvidenceKind.trim():"",
      evidence_valid_days:reqEvidence&&reqValidDays?Number(reqValidDays):null
    }]);
    setReqCode("");setReqTitle("");setReqDescription("");setReqAck(true);setReqEvidence(false);setReqEvidenceKind("");setReqValidDays("");
  }
  async function savePolicy(){
    const ok=await rpc("compliance_record_policy",{
      p_policy_key:policyEdit?.policy_key||null,p_title:policyTitle.trim(),p_category:policyCategory.trim(),
      p_summary:policySummary.trim()||null,p_body_text:policyBody.trim(),p_state:"active",
      p_effective_on:policyEffective,p_expires_on:policyExpires||null,p_source_reference:policySource.trim()||null,
      p_reason:policyReason.trim(),p_applicability:scopes,p_requirements:reqs,p_supersedes_id:policyEdit?.id||null,
    },policyEdit?"Compliance policy revision published.":"Compliance policy published.");
    if(ok)setPolicySheet(false);
  }
  async function retirePolicy(policy){
    const reason=window.prompt("Reason for retiring this policy version");
    if(!reason)return;
    await rpc("compliance_record_policy",{
      p_policy_key:policy.policy_key,p_title:policy.title,p_category:policy.category,p_summary:policy.summary,
      p_body_text:policy.body_text,p_state:"retired",p_effective_on:today,p_expires_on:null,
      p_source_reference:policy.source_reference,p_reason:reason,p_applicability:[],p_requirements:[],
      p_supersedes_id:policy.id,
    },"Compliance policy retired.");
  }
  async function acknowledge(policy){
    await rpc("compliance_acknowledge_policy",{p_policy_version_id:policy.id,p_statement:"I acknowledge this policy version."},"Policy acknowledgement recorded.");
  }
  async function submitEvidence(){
    const prior=latestEvidenceFor(evidenceSheet.id);
    const ok=await rpc("compliance_submit_evidence",{
      p_requirement_id:evidenceSheet.id,p_evidence_reference:evidenceReference.trim(),p_note:evidenceNote.trim()||null,
      p_issued_on:evidenceIssued||null,p_expires_on:evidenceExpires||null,p_supersedes_id:prior?.id||null,
    },"Compliance evidence submitted.");
    if(ok){setEvidenceSheet(null);setEvidenceReference("");setEvidenceNote("");setEvidenceIssued("");setEvidenceExpires("");}
  }
  async function requestException(){
    const ok=await rpc("compliance_request_exception",{
      p_requirement_id:exceptionSheet.id,p_reason:exceptionReason.trim(),p_requested_until:exceptionUntil||null
    },"Compliance exception requested.");
    if(ok){setExceptionSheet(null);setExceptionReason("");setExceptionUntil("");}
  }
  async function reviewEvidence(){
    const ok=await rpc("compliance_review_evidence",{
      p_evidence_version_id:reviewSheet.id,p_action:reviewAction,p_reviewer_note:reviewNote.trim()
    },"Evidence review recorded.");
    if(ok){setReviewSheet(null);setReviewNote("");}
  }
  async function decideException(){
    const ok=await rpc("compliance_exception_action",{
      p_exception_version_id:decisionSheet.id,p_action:decisionAction,p_note:decisionNote.trim(),
      p_approved_until:decisionAction==="approved"?(decisionUntil||null):null
    },"Exception decision recorded.");
    if(ok){setDecisionSheet(null);setDecisionNote("");setDecisionUntil("");}
  }

  const tabs=canManage||isManager
    ? [["policies","Policies"],["requirements","Requirements"],["evidence","Evidence"],["exceptions","Exceptions"]]
    : [["policies","Policies"],["evidence","My evidence"],["exceptions","My exceptions"]];

  if(loading)return <div className="body"><LoadingState label="Loading compliance…" /></div>;

  return <div className="body compliance-page">
    <div style={{paddingTop:26}}>
      <div className="eyebrow">Rules + evidence + exceptions</div>
      <h1 className="h1">Compliance</h1>
      <p className="screen-note">Policy applicability, acknowledgement, evidence, expiry and approved exceptions are recorded as facts. CEAC OS does not calculate an employee compliance score.</p>
    </div>
    {error&&<ProductNotice tone="error" title="Compliance">{error}</ProductNotice>}
    {notice&&<ProductNotice tone="success" title="Recorded">{notice}</ProductNotice>}

    <div className="compliance-tabs" role="tablist" aria-label="Compliance sections">
      {tabs.map(([key,label])=><button key={key} role="tab" aria-selected={tab===key} className={tab===key?"on":""} onClick={()=>setTab(key)}>{label}</button>)}
    </div>

    {tab==="policies"&&<>
      <div className="sec"><span>{canManage?"Policy register":"Policies applicable in your scope"}</span>{canManage&&<button className="btn btn-sm" onClick={openNewPolicy}>Publish policy</button>}</div>
      <Table
        rows={currentPolicies}
        empty={canManage?"No compliance policies are recorded.":"No compliance policies apply in your scope."}
        caption="Compliance policy register"
        exportName="ceac-compliance-policies"
        columns={[
          { key:"title",label:"Policy",render:(policy)=><span><strong>{policy.title}</strong><small style={{display:"block",marginTop:2,color:"var(--ceac-ink-400)"}}>{policy.category} · v{policy.version}{policy.summary?" · "+policy.summary:""}</small><details className="compliance-history" style={{marginTop:6}}><summary>Policy text</summary><div className="compliance-policy-body">{policy.body_text}</div></details>{policies.filter((row)=>row.policy_key===policy.policy_key).length>1&&<details className="compliance-history"><summary>Version history · {policies.filter((row)=>row.policy_key===policy.policy_key).length}</summary>{policies.filter((row)=>row.policy_key===policy.policy_key).sort((a,b)=>b.version-a.version).map((row)=><div key={row.id}><strong>Version {row.version} · {human(row.state)}</strong><span>Effective {day(row.effective_on)} · {row.reason}</span></div>)}</details>}</span>,csv:(policy)=>policy.title },
          { key:"state",label:"State",render:(policy)=>{const active=policy.state==="active"&&policy.effective_on<=today&&(!policy.expires_on||policy.expires_on>=today);return <Pill tone={active?"green":"grey"}>{active?"Active":human(policy.state)}</Pill>;},sortValue:(policy)=>policy.state,csv:(policy)=>human(policy.state) },
          { key:"effective_on",label:"Effective",render:(policy)=>day(policy.effective_on) },
          { key:"expires_on",label:"Expires",render:(policy)=>policy.expires_on?day(policy.expires_on):"No expiry" },
          { key:"scope",label:"Applies to",render:(policy)=>policyScopes(policy.id).map(scopeLabel).join(", ")||"Not recorded",sortValue:(policy)=>policyScopes(policy.id).map(scopeLabel).join(", "),csv:(policy)=>policyScopes(policy.id).map(scopeLabel).join(", ") },
          { key:"requirements",label:"Requirements",align:"right",render:(policy)=>policyReqs(policy.id).length,sortValue:(policy)=>policyReqs(policy.id).length,csv:(policy)=>policyReqs(policy.id).length },
          { key:"acknowledgement",label:"Acknowledgement",render:(policy)=>{const reqRows=policyReqs(policy.id);const active=policy.state==="active"&&policy.effective_on<=today&&(!policy.expires_on||policy.expires_on>=today);const needsAck=reqRows.some((r)=>r.acknowledgement_required);const ack=ackFor(policy.id);return !canManage&&!isManager&&active&&needsAck?(ack?<Pill tone="green">Acknowledged {day(ack.acknowledged_at.slice(0,10))}</Pill>:<button className="btn btn-sm" disabled={busy} onClick={()=>acknowledge(policy)}>Acknowledge policy</button>):needsAck?"Required":"Not required";},csv:(policy)=>policyReqs(policy.id).some((r)=>r.acknowledgement_required)?"Required":"Not required" },
          ...(canManage ? [{ key:"actions",label:"Actions",render:(policy)=><div className="compliance-actions"><button className="btn btn-ghost btn-sm" onClick={()=>openRevision(policy)}>Publish revision</button>{policy.state==="active"&&<button className="btn btn-ghost btn-sm" onClick={()=>retirePolicy(policy)}>Retire policy</button>}</div>,csv:()=>"" }] : []),
        ]}
      />
    </>}

    {tab==="requirements"&&(canManage||isManager)&&<>
      <div className="sec"><span>Visible requirements</span><span>{requirements.length}</span></div>
      <Table rows={requirements} empty="No requirements are visible in this scope."
        exportName="ceac-compliance-requirements"
        columns={[
          {key:"title",label:"Requirement"},
          {key:"requirement_code",label:"Code"},
          {key:"policy",label:"Policy",render:(req)=>policyById[req.policy_version_id]?.title||"Policy",sortValue:(req)=>policyById[req.policy_version_id]?.title||""},
          {key:"acknowledgement_required",label:"Acknowledgement",render:(req)=>req.acknowledgement_required?"Required":"Not required",sortValue:(req)=>req.acknowledgement_required?1:0},
          {key:"evidence_required",label:"Evidence",render:(req)=>req.evidence_required?(req.evidence_kind||"Required"):"Not required",sortValue:(req)=>req.evidence_required?1:0},
          {key:"evidence_valid_days",label:"Validity guidance",align:"right",render:(req)=>req.evidence_valid_days?req.evidence_valid_days+" days":"—",sortValue:(req)=>Number(req.evidence_valid_days)||0},
        ]}/>
    </>}

    {tab==="evidence"&&<>
      <div className="sec"><span>{canManage||isManager?"Evidence records":"Your evidence"}</span><span>{evidenceLatest.length}</span></div>
      {!canManage&&!isManager&&currentPolicies.filter((p)=>p.state==="active").flatMap((policy)=>policyReqs(policy.id)).filter((r)=>r.evidence_required).map((req)=>{
        const row=latestEvidenceFor(req.id);
        const expired=Boolean(row?.expires_on&&row.expires_on<today);
        return <div className="card compliance-self-item" key={req.id}>
          <div><strong>{req.title}</strong><span>{policyById[req.policy_version_id]?.title}</span></div>
          {row?<Pill tone={stateTone(row.state,expired)}>{expired?human(row.state)+" · Expired":human(row.state)}</Pill>:<Pill tone="grey">No evidence submitted</Pill>}
          {row&&<small>{row.evidence_reference}{row.expires_on?" · expires "+day(row.expires_on):" · no expiry recorded"}</small>}
          {row&&evidence.filter((item)=>item.evidence_key===row.evidence_key).length>1&&<details className="compliance-history"><summary>Evidence history · {evidence.filter((item)=>item.evidence_key===row.evidence_key).length}</summary>{evidence.filter((item)=>item.evidence_key===row.evidence_key).sort((a,b)=>b.version-a.version).map((item)=><div key={item.id}><strong>Version {item.version} · {human(item.state)}{item.expires_on&&item.expires_on<today?" · expired":""}</strong><span>{item.evidence_reference} · {dateTime(item.created_at)}{item.reviewer_note?" · "+item.reviewer_note:""}</span></div>)}</details>}
          <button className="btn btn-ghost btn-sm" onClick={()=>{setEvidenceSheet(req);setEvidenceReference(row?.evidence_reference||"");setEvidenceNote("");setEvidenceIssued(row?.issued_on||"");setEvidenceExpires(row?.expires_on||"");}}>{row?"Submit replacement evidence":"Submit evidence"}</button>
        </div>;
      })}
      {(canManage||isManager)&&<Table rows={evidenceLatest} empty="No evidence records are visible in your authorised scope."
        exportName="ceac-compliance-evidence"
        columns={[
          {key:"profile",label:"Person",render:(row)=>row.profile?.full_name||"Employee",sortValue:(row)=>row.profile?.full_name||""},
          {key:"requirement",label:"Requirement",render:(row)=>row.requirement?.title||"Requirement",sortValue:(row)=>row.requirement?.title||""},
          {key:"evidence_reference",label:"Evidence",render:(row)=><span>{row.evidence_reference}{evidence.filter((item)=>item.evidence_key===row.evidence_key).length>1&&<details className="compliance-history"><summary>History · {evidence.filter((item)=>item.evidence_key===row.evidence_key).length}</summary>{evidence.filter((item)=>item.evidence_key===row.evidence_key).sort((a,b)=>b.version-a.version).map((item)=><div key={item.id}><strong>Version {item.version} · {human(item.state)}</strong><span>{dateTime(item.created_at)}{item.reviewer_note?" · "+item.reviewer_note:""}</span></div>)}</details>}</span>,csv:(row)=>row.evidence_reference},
          {key:"state",label:"State",render:(row)=>{const expired=Boolean(row.expires_on&&row.expires_on<today);return <Pill tone={stateTone(row.state,expired)}>{expired?human(row.state)+" · expired":human(row.state)}</Pill>;},sortValue:(row)=>row.state,csv:(row)=>human(row.state)},
          {key:"expires_on",label:"Expires",render:(row)=>row.expires_on?day(row.expires_on):"No expiry"},
          {key:"reviewer_note",label:"Reviewer note",render:(row)=>row.reviewer_note||"—"},
          ...(canManage?[{key:"actions",label:"Actions",render:(row)=>row.state==="submitted"?<button className="btn btn-ghost btn-sm" onClick={()=>{setReviewSheet(row);setReviewAction("verified");setReviewNote("");}}>Review evidence</button>:"—",csv:()=>""}]:[]),
        ]}/>} 
    </>}

    {tab==="exceptions"&&<>
      <div className="sec"><span>{canManage||isManager?"Exception records":"Your exceptions"}</span><span>{exceptionLatest.length}</span></div>
      {!canManage&&!isManager&&currentPolicies.filter((p)=>p.state==="active").flatMap((policy)=>policyReqs(policy.id)).map((req)=>{
        const row=latestExceptionFor(req.id);
        return <div className="card compliance-self-item" key={req.id}>
          <div><strong>{req.title}</strong><span>{policyById[req.policy_version_id]?.title}</span></div>
          {row?<Pill tone={stateTone(row.state)}>{human(row.state)}</Pill>:<Pill tone="grey">No exception requested</Pill>}
          {row?.approved_until&&<small>Approved until {day(row.approved_until)}</small>}
          {row&&exceptions.filter((item)=>item.exception_key===row.exception_key).length>1&&<details className="compliance-history"><summary>Exception history · {exceptions.filter((item)=>item.exception_key===row.exception_key).length}</summary>{exceptions.filter((item)=>item.exception_key===row.exception_key).sort((a,b)=>b.version-a.version).map((item)=><div key={item.id}><strong>Version {item.version} · {human(item.state)}</strong><span>{dateTime(item.created_at)}{item.note?" · "+item.note:""}</span></div>)}</details>}
          {!row&&<button className="btn btn-ghost btn-sm" onClick={()=>setExceptionSheet(req)}>Request exception</button>}
        </div>;
      })}
      {(canManage||isManager)&&<Table rows={exceptionLatest} empty="No exception records are visible in your authorised scope."
        exportName="ceac-compliance-exceptions"
        columns={[
          {key:"profile",label:"Person",render:(row)=>row.profile?.full_name||"Employee",sortValue:(row)=>row.profile?.full_name||""},
          {key:"requirement",label:"Requirement",render:(row)=>row.requirement?.title||"Requirement",sortValue:(row)=>row.requirement?.title||""},
          {key:"state",label:"State",render:(row)=><Pill tone={stateTone(row.state)}>{human(row.state)}</Pill>,sortValue:(row)=>row.state,csv:(row)=>human(row.state)},
          {key:"requested_until",label:"Requested until",render:(row)=>row.requested_until?day(row.requested_until):"—"},
          {key:"approved_until",label:"Approved until",render:(row)=>row.approved_until?day(row.approved_until):"—"},
          {key:"reason",label:"Reason",render:(row)=><span>{row.reason}{row.note&&<small style={{display:"block",marginTop:3,color:"var(--ceac-ink-400)"}}>{row.note}</small>}{exceptions.filter((item)=>item.exception_key===row.exception_key).length>1&&<details className="compliance-history"><summary>History · {exceptions.filter((item)=>item.exception_key===row.exception_key).length}</summary>{exceptions.filter((item)=>item.exception_key===row.exception_key).sort((a,b)=>b.version-a.version).map((item)=><div key={item.id}><strong>Version {item.version} · {human(item.state)}</strong><span>{dateTime(item.created_at)}{item.note?" · "+item.note:""}</span></div>)}</details>}</span>,csv:(row)=>row.reason},
          ...(canManage?[{key:"actions",label:"Actions",render:(row)=>(row.state==="requested"||row.state==="approved")?<button className="btn btn-ghost btn-sm" onClick={()=>{setDecisionSheet(row);setDecisionAction(row.state==="approved"?"resolved":"approved");setDecisionNote("");setDecisionUntil("");}}>{row.state==="approved"?"Resolve exception":"Decide exception"}</button>:"—",csv:()=>""}]:[]),
        ]}/>} 
    </>}

    {policySheet&&<Sheet onClose={()=>!busy&&setPolicySheet(false)}>
      <div className="eyebrow">{policyEdit?"Policy revision":"New compliance policy"}</div>
      <div className="h2">{policyEdit?"Publish a new version":"Publish policy"}</div>
      <FieldGroup label="Title"><input className="field" aria-label="Compliance policy title" value={policyTitle} onChange={e=>setPolicyTitle(e.target.value)}/></FieldGroup>
      <div className="form-grid two"><FieldGroup label="Category"><input className="field" aria-label="Compliance policy category" value={policyCategory} onChange={e=>setPolicyCategory(e.target.value)}/></FieldGroup><FieldGroup label="Effective date"><input className="field" aria-label="Compliance policy effective date" type="date" value={policyEffective} onChange={e=>setPolicyEffective(e.target.value)}/></FieldGroup></div>
      <FieldGroup label="Summary"><textarea className="field" aria-label="Compliance policy summary" rows="2" value={policySummary} onChange={e=>setPolicySummary(e.target.value)}/></FieldGroup>
      <FieldGroup label="Policy text"><textarea className="field" aria-label="Compliance policy body" rows="6" value={policyBody} onChange={e=>setPolicyBody(e.target.value)}/></FieldGroup>
      <div className="form-grid two"><FieldGroup label="Expiry"><input className="field" aria-label="Compliance policy expiry" type="date" value={policyExpires} onChange={e=>setPolicyExpires(e.target.value)}/></FieldGroup><FieldGroup label="Source reference"><input className="field" aria-label="Compliance policy source" value={policySource} onChange={e=>setPolicySource(e.target.value)}/></FieldGroup></div>

      <div className="sec"><span>Applicability</span><span>{scopes.length}</span></div>
      <div className="form-grid two"><FieldGroup label="Scope"><select className="field" aria-label="Compliance applicability kind" value={scopeKind} onChange={e=>{setScopeKind(e.target.value);setScopeValue("");}}><option value="organisation">Organisation</option><option value="unit">Unit</option><option value="person">Person</option><option value="employment_type">Employment type</option></select></FieldGroup>
      <FieldGroup label="Value">{scopeKind==="unit"?<select className="field" aria-label="Compliance applicability value" value={scopeValue} onChange={e=>setScopeValue(e.target.value)}><option value="">Choose unit</option>{units.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select>:scopeKind==="person"?<select className="field" aria-label="Compliance applicability value" value={scopeValue} onChange={e=>setScopeValue(e.target.value)}><option value="">Choose person</option>{people.map(p=><option key={p.id} value={p.id}>{p.full_name}</option>)}</select>:scopeKind==="employment_type"?<input className="field" aria-label="Compliance applicability value" value={scopeValue} onChange={e=>setScopeValue(e.target.value)} placeholder="e.g. full_time"/>:<input className="field" disabled value="All active people"/>}</FieldGroup></div>
      <button className="btn btn-ghost btn-sm" onClick={addScope}>Add applicability</button>
      <div className="compliance-chip-list">{scopes.map((row,index)=><button type="button" key={index} onClick={()=>setScopes(scopes.filter((_,i)=>i!==index))}>{human(row.scope_kind)} · {row.label} ×</button>)}</div>

      <div className="sec"><span>Requirements</span><span>{reqs.length}</span></div>
      <div className="form-grid two"><FieldGroup label="Code"><input className="field" aria-label="Compliance requirement code" value={reqCode} onChange={e=>setReqCode(e.target.value)}/></FieldGroup><FieldGroup label="Title"><input className="field" aria-label="Compliance requirement title" value={reqTitle} onChange={e=>setReqTitle(e.target.value)}/></FieldGroup></div>
      <FieldGroup label="Description"><textarea className="field" aria-label="Compliance requirement description" rows="2" value={reqDescription} onChange={e=>setReqDescription(e.target.value)}/></FieldGroup>
      <label className="check-row"><input type="checkbox" checked={reqAck} onChange={e=>setReqAck(e.target.checked)}/><span>Acknowledgement required</span></label>
      <label className="check-row"><input type="checkbox" checked={reqEvidence} onChange={e=>setReqEvidence(e.target.checked)}/><span>Evidence required</span></label>
      {reqEvidence&&<div className="form-grid two"><FieldGroup label="Evidence kind"><input className="field" aria-label="Compliance evidence kind" value={reqEvidenceKind} onChange={e=>setReqEvidenceKind(e.target.value)}/></FieldGroup><FieldGroup label="Validity guidance (days)"><input className="field" aria-label="Compliance evidence valid days" type="number" min="1" value={reqValidDays} onChange={e=>setReqValidDays(e.target.value)}/></FieldGroup></div>}
      <button className="btn btn-ghost btn-sm" onClick={addRequirement}>Add requirement</button>
      <div className="compliance-chip-list">{reqs.map((row,index)=><button type="button" key={index} onClick={()=>setReqs(reqs.filter((_,i)=>i!==index))}>{row.requirement_code} · {row.title} ×</button>)}</div>

      <FieldGroup label="Reason for this version"><textarea className="field" aria-label="Compliance policy reason" rows="3" value={policyReason} onChange={e=>setPolicyReason(e.target.value)}/></FieldGroup>
      <button className="btn" style={{marginTop:14}} disabled={busy||policyTitle.trim().length<3||policyCategory.trim().length<2||policyBody.trim().length<3||!policyEffective||scopes.length===0||policyReason.trim().length<3} onClick={savePolicy}>{busy?"Publishing…":policyEdit?"Publish revision":"Publish policy"}</button>
    </Sheet>}

    {evidenceSheet&&<Sheet onClose={()=>!busy&&setEvidenceSheet(null)}>
      <div className="eyebrow">Compliance evidence</div><div className="h2">{evidenceSheet.title}</div>
      <FieldGroup label="Evidence reference"><input className="field" aria-label="Compliance evidence reference" value={evidenceReference} onChange={e=>setEvidenceReference(e.target.value)} placeholder="Certificate number, document reference or approved record"/></FieldGroup>
      <FieldGroup label="Note"><textarea className="field" aria-label="Compliance evidence note" rows="3" value={evidenceNote} onChange={e=>setEvidenceNote(e.target.value)}/></FieldGroup>
      <div className="form-grid two"><FieldGroup label="Issued on"><input className="field" aria-label="Compliance evidence issued date" type="date" value={evidenceIssued} onChange={e=>setEvidenceIssued(e.target.value)}/></FieldGroup><FieldGroup label="Expires on"><input className="field" aria-label="Compliance evidence expiry date" type="date" value={evidenceExpires} onChange={e=>setEvidenceExpires(e.target.value)}/></FieldGroup></div>
      <button className="btn" style={{marginTop:14}} disabled={busy||evidenceReference.trim().length<2} onClick={submitEvidence}>Submit evidence</button>
    </Sheet>}

    {exceptionSheet&&<Sheet onClose={()=>!busy&&setExceptionSheet(null)}>
      <div className="eyebrow">Request exception</div><div className="h2">{exceptionSheet.title}</div>
      <FieldGroup label="Reason"><textarea className="field" aria-label="Compliance exception reason" rows="4" value={exceptionReason} onChange={e=>setExceptionReason(e.target.value)}/></FieldGroup>
      <FieldGroup label="Requested until" hint="Optional."><input className="field" aria-label="Compliance exception requested until" type="date" value={exceptionUntil} onChange={e=>setExceptionUntil(e.target.value)}/></FieldGroup>
      <button className="btn" style={{marginTop:14}} disabled={busy||exceptionReason.trim().length<3} onClick={requestException}>Request exception</button>
    </Sheet>}

    {reviewSheet&&<Sheet onClose={()=>!busy&&setReviewSheet(null)}>
      <div className="eyebrow">Human evidence review</div><div className="h2">{reviewSheet.profile?.full_name||"Employee"} · {reviewSheet.requirement?.title}</div>
      <FieldGroup label="Decision"><select className="field" aria-label="Compliance evidence decision" value={reviewAction} onChange={e=>setReviewAction(e.target.value)}><option value="verified">Verified</option><option value="rejected">Rejected</option></select></FieldGroup>
      <FieldGroup label="Reviewer note"><textarea className="field" aria-label="Compliance evidence reviewer note" rows="4" value={reviewNote} onChange={e=>setReviewNote(e.target.value)}/></FieldGroup>
      <button className="btn" style={{marginTop:14}} disabled={busy||reviewNote.trim().length<3} onClick={reviewEvidence}>Record evidence decision</button>
    </Sheet>}

    {decisionSheet&&<Sheet onClose={()=>!busy&&setDecisionSheet(null)}>
      <div className="eyebrow">Exception decision</div><div className="h2">{decisionSheet.profile?.full_name||"Employee"} · {decisionSheet.requirement?.title}</div>
      {decisionSheet.state==="requested"&&<FieldGroup label="Decision"><select className="field" aria-label="Compliance exception decision" value={decisionAction} onChange={e=>setDecisionAction(e.target.value)}><option value="approved">Approve</option><option value="declined">Decline</option></select></FieldGroup>}
      {decisionSheet.state==="approved"&&<div className="card small">This approved exception will be marked resolved. The approval version remains in history.</div>}
      {decisionAction==="approved"&&decisionSheet.state==="requested"&&<FieldGroup label="Approved until" hint="Optional."><input className="field" aria-label="Compliance exception approved until" type="date" value={decisionUntil} onChange={e=>setDecisionUntil(e.target.value)}/></FieldGroup>}
      <FieldGroup label="Decision note"><textarea className="field" aria-label="Compliance exception decision note" rows="4" value={decisionNote} onChange={e=>setDecisionNote(e.target.value)}/></FieldGroup>
      <button className="btn" style={{marginTop:14}} disabled={busy||decisionNote.trim().length<3} onClick={decideException}>{decisionSheet.state==="approved"?"Resolve exception":"Record exception decision"}</button>
    </Sheet>}
  </div>;
}
