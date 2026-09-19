import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

const money=(minor,cur)=>`${cur} ${(Number(minor||0)/100).toLocaleString("en-GH",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
function totals(rows){const out={}; rows.forEach(r=>{if(!r.currency)return; out[r.currency]=(out[r.currency]||0)+Number(r.amount_minor||0);}); return out;}
function spendTotals(rows){const out={}; rows.forEach(r=>{if(!r.currency)return; out[r.currency]=(out[r.currency]||0)+(r.reverses_id?-Number(r.amount_minor||0):Number(r.amount_minor||0));}); return out;}
function MoneyLines({title,values,empty}){const keys=Object.keys(values).sort(); return <div className="metric"><span>{title}</span>{keys.length?keys.map(k=><b key={k} style={{fontSize:15}}>{money(values[k],k)}</b>):<b style={{fontSize:14}}>{empty}</b>}</div>;}

export default function ManagerFinance({me,openProject}){
 const [budgets,setBudgets]=useState([]),[spend,setSpend]=useState([]),[transfers,setTransfers]=useState([]),[projects,setProjects]=useState([]),[positions,setPositions]=useState([]),[requests,setRequests]=useState([]);
 const [error,setError]=useState(null),[loading,setLoading]=useState(true);
 const year=new Date().getFullYear();
 useEffect(()=>{load();},[me.id,me.unit_id]);
 async function load(){
  setLoading(true);setError(null);
  const [b,s,t,p,pos,req]=await Promise.all([
   supabase.from("budgets").select("id,unit_id,project_id,year,amount_minor,currency,note").eq("unit_id",me.unit_id).eq("year",year),
   supabase.from("spend_lines").select("id,unit_id,project_id,spent_on,description,amount_minor,currency,reverses_id").eq("unit_id",me.unit_id),
   supabase.from("internal_transfers").select("id,from_unit_id,to_unit_id,amount_minor,currency,sent_on,purpose,state,response_note").or(`from_unit_id.eq.${me.unit_id},to_unit_id.eq.${me.unit_id}`),
   supabase.from("projects").select("id,name"),
   supabase.rpc("unit_budget_position",{p_unit_id:me.unit_id,p_year:year}),
   supabase.from("finance_requests").select("id,project_id,title,justification,amount_minor,currency,needed_by,state,created_at,decided_at,fulfilled_spend_id").eq("unit_id",me.unit_id).order("created_at",{ascending:false})
  ]);
  const e=[b.error,s.error,t.error,p.error,pos.error,req.error].find(Boolean); if(e){setError(e.message);setLoading(false);return;}
  setBudgets(b.data||[]);setSpend(s.data||[]);setTransfers(t.data||[]);setProjects(p.data||[]);setPositions(pos.data||[]);setRequests(req.data||[]);setLoading(false);
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
 if(loading)return <div className="body"><div className="spin">Loading finance...</div></div>;
 return <div className="body">
  <div style={{paddingTop:26}}><div className="eyebrow">{me.unit_name}</div><h1 className="h1" style={{marginTop:6}}>Finance</h1><p className="screen-note">Read-only view of your unit's recorded budget, spending, project costs and transfers. Different currencies are kept separate and never converted.</p></div>
  {error&&<div className="flag flag-brick"><h4>Could not load finance</h4>{error}</div>}
  <div className="sec"><span>Unit position</span><span>{year}</span></div>
  <div className="metric-grid"><MoneyLines title="Planned" values={planned} empty="No unit budget recorded"/><MoneyLines title="Recorded spend" values={recorded} empty="No unit spend recorded"/><MoneyLines title="Approved, not yet spent" values={committed} empty="No approved requests waiting to be spent"/><MoneyLines title="Remaining" values={remaining} empty="No comparable budget recorded"/></div>
  {positions.some(row=>!budgetCurrencies.has(row.currency))&&<p className="small">A currency can have recorded spend or an approved request without a recorded budget. Missing budget is not treated as zero.</p>}
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
 </div>;
}
