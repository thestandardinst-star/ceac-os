import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { Sheet } from "../components/bits";

const money=(minor,cur)=>`${cur} ${(Number(minor||0)/100).toLocaleString("en-GH",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
function totals(rows){const out={}; rows.forEach(r=>{if(!r.currency)return; out[r.currency]=(out[r.currency]||0)+Number(r.amount_minor||0);}); return out;}
function spendTotals(rows){const out={}; rows.forEach(r=>{if(!r.currency)return; out[r.currency]=(out[r.currency]||0)+(r.reverses_id?-Number(r.amount_minor||0):Number(r.amount_minor||0));}); return out;}
function MoneyLines({title,values,empty,onOpen}){const keys=Object.keys(values).sort(); return <div className="metric"><span>{title}</span>{keys.length?keys.map(k=><button key={k} onClick={()=>onOpen?.(k)} style={{display:"block",width:"100%",textAlign:"left"}}><b style={{fontSize:15,textDecoration:"underline"}}>{money(values[k],k)}</b></button>):<b style={{fontSize:14}}>{empty}</b>}</div>;}

export default function ManagerFinance({me,openProject}){
 const [budgets,setBudgets]=useState([]),[spend,setSpend]=useState([]),[transfers,setTransfers]=useState([]),[projects,setProjects]=useState([]),[positions,setPositions]=useState([]),[requests,setRequests]=useState([]);
 const [error,setError]=useState(null),[loading,setLoading]=useState(true),[drill,setDrill]=useState(null);
 const [sheet,setSheet]=useState(null),[busy,setBusy]=useState(false),[notice,setNotice]=useState(null);
 const [requestTitle,setRequestTitle]=useState(""),[requestJustification,setRequestJustification]=useState(""),[requestAmount,setRequestAmount]=useState(""),[requestCurrency,setRequestCurrency]=useState("GHS"),[requestNeededBy,setRequestNeededBy]=useState(""),[requestProject,setRequestProject]=useState("");
 const year=new Date().getFullYear();
 useEffect(()=>{load();},[me.id,me.unit_id]);
 async function load(){
  setLoading(true);setError(null);
  const [b,s,t,p,pos,req]=await Promise.all([
   supabase.from("budgets").select("id,unit_id,project_id,year,amount_minor,currency,note").eq("unit_id",me.unit_id).eq("year",year),
   supabase.from("spend_lines").select("id,unit_id,project_id,spent_on,description,amount_minor,currency,reverses_id").eq("unit_id",me.unit_id),
   supabase.from("internal_transfers").select("id,from_unit_id,to_unit_id,amount_minor,currency,sent_on,purpose,state,response_note").or(`from_unit_id.eq.${me.unit_id},to_unit_id.eq.${me.unit_id}`),
   supabase.from("projects").select("id,name,lead_unit_id,project_units(unit_id)"),
   supabase.rpc("unit_budget_position",{p_unit_id:me.unit_id,p_year:year}),
   supabase.from("finance_requests").select("id,project_id,title,justification,amount_minor,currency,needed_by,state,created_at,decided_at,fulfilled_spend_id").eq("unit_id",me.unit_id).order("created_at",{ascending:false})
  ]);
  const e=[b.error,s.error,t.error,p.error,pos.error,req.error].find(Boolean); if(e){setError(e.message);setLoading(false);return;}
  setBudgets(b.data||[]);setSpend(s.data||[]);setTransfers(t.data||[]);setProjects((p.data||[]).filter(project=>project.lead_unit_id===me.unit_id||(project.project_units||[]).some(row=>row.unit_id===me.unit_id)));setPositions(pos.data||[]);setRequests(req.data||[]);setLoading(false);
 }

 function amountToMinor(value){
  const clean=String(value||"").trim();
  if(!/^\d+(\.\d{1,2})?$/.test(clean)) return null;
  const [whole,fraction=""]=clean.split(".");
  const minor=Number(whole)*100+Number((fraction+"00").slice(0,2));
  return Number.isSafeInteger(minor)&&minor>0?minor:null;
 }

 async function createRequest(){
  const amountMinor=amountToMinor(requestAmount);
  if(!requestTitle.trim()||!amountMinor) return;
  setBusy(true);setError(null);setNotice(null);
  try{
   const {error:insertError}=await supabase.from("finance_requests").insert({
    org_id:me.org_id,
    unit_id:me.unit_id,
    project_id:requestProject||null,
    requested_by:me.id,
    title:requestTitle.trim(),
    justification:requestJustification.trim()||null,
    amount_minor:amountMinor,
    currency:requestCurrency,
    needed_by:requestNeededBy||null
   });
   if(insertError) throw insertError;
   setSheet(null);setRequestTitle("");setRequestJustification("");setRequestAmount("");setRequestCurrency("GHS");setRequestNeededBy("");setRequestProject("");
   setNotice("Finance request submitted. It is now waiting for the authorised CEAC decision path.");
   await load();
  }catch(err){setError(err.message||"The finance request could not be submitted.");}
  finally{setBusy(false);}
 }
 const unitBudget=useMemo(()=>totals(budgets.filter(x=>!x.project_id)),[budgets]);
 const budgetCurrencies=new Set(Object.keys(unitBudget));
 const planned={},recorded={},committed={},remaining={};
 positions.forEach(row=>{
  if(budgetCurrencies.has(row.currency)) planned[row.currency]=Number(row.budget_minor||0);
  recorded[row.currency]=Number(row.spent_minor||0);
  committed[row.currency]=Number(row.committed_minor||0);
  if(budgetCurrencies.has(row.currency)) remaining[row.currency]=Number(row.remaining_minor||0);
 });
 if(loading)return <div className="body manager-finance"><div className="spin">Loading finance...</div></div>;
 return <div className="body manager-finance">
  <div style={{paddingTop:26}}><div className="eyebrow">{me.unit_name}</div><h1 className="h1" style={{marginTop:6}}>Finance</h1><p className="screen-note">Your unit's budget, spending, commitments, transfers and finance requests. Managers can request funds here; recorded Finance entries remain read-only.</p></div>
  <button className="btn wide-auto" style={{marginTop:16}} onClick={()=>{setSheet("request");setError(null);setNotice(null);}}>Request funds</button>
  {error&&<div className="flag flag-brick"><h4>Could not complete that</h4>{error}</div>}
  {notice&&<div className="flag flag-green" style={{marginTop:12}}>{notice}</div>}
  <div className="sec"><span>Unit position</span><span>{year}</span></div>
  <div className="metric-grid"><MoneyLines title="Planned" values={planned} empty="No unit budget recorded" onOpen={(currency)=>setDrill({kind:"planned",currency,title:`Planned · ${currency}`})}/><MoneyLines title="Recorded spend" values={recorded} empty="No unit spend recorded" onOpen={(currency)=>setDrill({kind:"spend",currency,title:`Recorded spend · ${currency}`})}/><MoneyLines title="Approved, not yet spent" values={committed} empty="No approved requests waiting to be spent" onOpen={(currency)=>setDrill({kind:"committed",currency,title:`Approved, not yet spent · ${currency}`})}/><MoneyLines title="Remaining" values={remaining} empty="No comparable budget recorded" onOpen={(currency)=>setDrill({kind:"remaining",currency,title:`Remaining · ${currency}`})}/></div>
  {positions.some(row=>!budgetCurrencies.has(row.currency))&&<p className="small">A currency can have recorded spend or an approved request without a recorded budget. Missing budget is not treated as zero.</p>}
  {drill&&<div style={{marginTop:10}}>
   <div className="sec"><span>{drill.title}</span></div>
   {(drill.kind==="planned"||drill.kind==="remaining")&&budgets.filter(x=>x.currency===drill.currency).map(x=><div className="row" key={"b-"+x.id}><div className="row-t">{money(x.amount_minor,x.currency)} budget</div><div className="row-m">{x.project_id?"Project budget":"Unit budget"} · {year}</div>{x.note&&<div className="row-note">{x.note}</div>}</div>)}
   {(drill.kind==="spend"||drill.kind==="remaining")&&spend.filter(x=>x.currency===drill.currency).map(x=><div className="row" key={"s-"+x.id}><div className="row-t">{x.description} · {money(x.reverses_id?-Number(x.amount_minor):x.amount_minor,x.currency)}</div><div className="row-m">{x.spent_on}{x.project_id?" · project spend":""}{x.reverses_id?" · correction":""}</div></div>)}
   {(drill.kind==="committed"||drill.kind==="remaining")&&requests.filter(x=>x.currency===drill.currency&&x.state==="approved").map(x=><div className="row" key={"r-"+x.id}><div className="row-t">{x.title} · {money(x.amount_minor,x.currency)}</div><div className="row-m">Approved, not yet spent{x.needed_by?` · needed by ${x.needed_by}`:""}</div></div>)}
   {drill.kind==="remaining"&&<div className="card small">Remaining is the recorded budget minus recorded spend and approved requests that have not yet been spent.</div>}
  </div>}
  <div className="sec"><span>Projects</span><span>{projects.length}</span></div>
  {projects.map(p=>{const pb=totals(budgets.filter(x=>x.project_id===p.id));const ps=spendTotals(spend.filter(x=>x.project_id===p.id));const pc=totals(requests.filter(x=>x.project_id===p.id&&x.state==="approved"));const keys=[...new Set([...Object.keys(pb),...Object.keys(pc),...Object.keys(ps)])].sort();return <button key={p.id} className="row" onClick={()=>openProject(p.id)} style={{width:"100%",textAlign:"left"}}>
   <div className="row-t">{p.name}</div>
   {keys.length?keys.map(c=><div key={c} className="row-m">{c}: {pb[c]!=null?`planned ${money(pb[c],c)}`:"no budget recorded"} · {pc[c]!=null?`committed ${money(pc[c],c)}`:"no approved commitment"} · {ps[c]!=null?`actual ${money(ps[c],c)}`:"no spend recorded"}</div>):<div className="row-m">No project cost has been recorded.</div>}
  </button>})}
  {projects.length===0&&<div className="card small">No projects are visible for this unit.</div>}
  <div className="sec"><span>Between departments</span><span>{transfers.length}</span></div>
  {transfers.sort((a,b)=>String(b.sent_on).localeCompare(String(a.sent_on))).map(t=><div key={t.id} className="row">
   <div className="row-t">{t.from_unit_id===me.unit_id?"Sent":"Received"} · {money(t.amount_minor,t.currency)}</div>
   <div className="row-m">{t.sent_on} · {t.purpose}</div>
   <div className="row-note">{t.state==="sent"?"Awaiting confirmation":t.state==="disputed"?"Disputed":t.state==="confirmed"?"Confirmed":t.state}</div>
  </div>)}
  {transfers.length===0&&<div className="card small">No transfers involving this unit are visible.</div>}
  <div className="sec"><span>Requests</span><span>{requests.length}</span></div>
  {requests.map(r=><div key={r.id} className="row">
   <div className="row-t">{r.title} · {money(r.amount_minor,r.currency)}</div>
   <div className="row-m">{r.state==="submitted"?"Awaiting decision":r.state==="approved"?"Approved — not yet spent":r.state==="fulfilled"?"Fulfilled":r.state==="declined"?"Declined":r.state==="cancelled"?"Cancelled":r.state}{r.needed_by?` · needed by ${r.needed_by}`:""}</div>
   {r.justification&&<div className="row-note">{r.justification}</div>}
  </div>)}
  {requests.length===0&&<div className="card small">No finance requests are recorded for this unit.</div>}
  <p className="small" style={{marginTop:12}}>These figures are CEAC OS records, not a bank balance. Managers cannot post or edit Finance entries from this screen.</p>

  {sheet==="request"&&<Sheet onClose={()=>!busy&&setSheet(null)}>
   <div className="eyebrow">Finance request</div>
   <div className="h2" style={{marginTop:5}}>Request funds</div>
   <p className="screen-note">Submit what your unit needs. CEAC OS records the request and the authorised approval workflow handles the decision.</p>
   <input className="field" placeholder="What is the money for?" value={requestTitle} onChange={e=>setRequestTitle(e.target.value)} />
   <textarea className="field" rows={3} placeholder="Why is it needed? (optional)" value={requestJustification} onChange={e=>setRequestJustification(e.target.value)} />
   <div style={{display:"grid",gridTemplateColumns:"1fr 120px",gap:8}}>
    <input className="field" inputMode="decimal" placeholder="Amount, e.g. 850.00" value={requestAmount} onChange={e=>setRequestAmount(e.target.value)} />
    <select className="field" value={requestCurrency} onChange={e=>setRequestCurrency(e.target.value)}>
     {["GHS","USD","GBP","EUR","NGN","ZAR","CAD"].map(currency=><option key={currency} value={currency}>{currency}</option>)}
    </select>
   </div>
   <select className="field" value={requestProject} onChange={e=>setRequestProject(e.target.value)}>
    <option value="">No project / general unit request</option>
    {projects.map(project=><option key={project.id} value={project.id}>{project.name}</option>)}
   </select>
   <label className="small" style={{display:"block",marginTop:10}}>Needed by (optional)</label>
   <input className="field" type="date" value={requestNeededBy} onChange={e=>setRequestNeededBy(e.target.value)} />
   <div className="hint">Amounts are stored in the selected currency. CEAC OS does not convert currencies or treat this request as money already spent.</div>
   <button className="btn" style={{marginTop:14}} disabled={busy||!requestTitle.trim()||!amountToMinor(requestAmount)} onClick={createRequest}>{busy?"Submitting...":"Submit request"}</button>
  </Sheet>}
 </div>;
}
