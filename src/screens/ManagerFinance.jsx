import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

const money=(minor,cur)=>`${cur} ${(Number(minor||0)/100).toLocaleString("en-GH",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
function totals(rows){const out={}; rows.forEach(r=>{if(!r.currency)return; out[r.currency]=(out[r.currency]||0)+Number(r.amount_minor||0);}); return out;}
function spendTotals(rows){const out={}; rows.forEach(r=>{if(!r.currency)return; out[r.currency]=(out[r.currency]||0)+(r.reverses_id?-Number(r.amount_minor||0):Number(r.amount_minor||0));}); return out;}
function MoneyLines({title,values,empty}){const keys=Object.keys(values).sort(); return <div className="metric"><span>{title}</span>{keys.length?keys.map(k=><b key={k} style={{fontSize:15}}>{money(values[k],k)}</b>):<b style={{fontSize:14}}>{empty}</b>}</div>;}

export default function ManagerFinance({me,openProject}){
 const [budgets,setBudgets]=useState([]),[spend,setSpend]=useState([]),[transfers,setTransfers]=useState([]),[projects,setProjects]=useState([]);
 const [error,setError]=useState(null),[loading,setLoading]=useState(true);
 const year=new Date().getFullYear();
 useEffect(()=>{load();},[me.id,me.unit_id]);
 async function load(){
  setLoading(true);setError(null);
  const [b,s,t,p]=await Promise.all([
   supabase.from("budgets").select("id,unit_id,project_id,year,amount_minor,currency,note").eq("unit_id",me.unit_id).eq("year",year),
   supabase.from("spend_lines").select("id,unit_id,project_id,spent_on,description,amount_minor,currency,reverses_id").eq("unit_id",me.unit_id),
   supabase.from("internal_transfers").select("id,from_unit_id,to_unit_id,amount_minor,currency,sent_on,purpose,state,response_note").or(`from_unit_id.eq.${me.unit_id},to_unit_id.eq.${me.unit_id}`),
   supabase.from("projects").select("id,name")
  ]);
  const e=[b.error,s.error,t.error,p.error].find(Boolean); if(e){setError(e.message);setLoading(false);return;}
  setBudgets(b.data||[]);setSpend(s.data||[]);setTransfers(t.data||[]);setProjects(p.data||[]);setLoading(false);
 }
 const unitBudget=useMemo(()=>totals(budgets.filter(x=>!x.project_id)),[budgets]);
 const unitSpend=useMemo(()=>spendTotals(spend.filter(x=>!x.project_id)),[spend]);
 const currencies=[...new Set([...Object.keys(unitBudget),...Object.keys(unitSpend)])].sort();
 const difference={}; currencies.forEach(c=>{if(unitBudget[c]!=null)difference[c]=unitBudget[c]-(unitSpend[c]||0);});
 if(loading)return <div className="body"><div className="spin">Loading finance...</div></div>;
 return <div className="body">
  <div style={{paddingTop:26}}><div className="eyebrow">{me.unit_name}</div><h1 className="h1" style={{marginTop:6}}>Finance</h1><p className="screen-note">Read-only view of your unit's recorded budget, spending, project costs and transfers. Different currencies are kept separate and never converted.</p></div>
  {error&&<div className="flag flag-brick"><h4>Could not load finance</h4>{error}</div>}
  <div className="sec"><span>Unit position</span><span>{year}</span></div>
  <div className="metric-grid"><MoneyLines title="Planned" values={unitBudget} empty="No unit budget recorded"/><MoneyLines title="Recorded spend" values={unitSpend} empty="No unit spend recorded"/><MoneyLines title="Difference" values={difference} empty="No comparable budget recorded"/></div>
  {currencies.some(c=>unitBudget[c]==null)&&<p className="small">A currency can have recorded spend without a recorded budget. Missing budget is not treated as zero.</p>}
  <div className="sec"><span>Projects</span><span>{projects.length}</span></div>
  {projects.map(p=>{const pb=totals(budgets.filter(x=>x.project_id===p.id));const ps=spendTotals(spend.filter(x=>x.project_id===p.id));const keys=[...new Set([...Object.keys(pb),...Object.keys(ps)])].sort();return <button key={p.id} className="row" onClick={()=>openProject(p.id)} style={{width:"100%",textAlign:"left"}}>
   <div className="row-t">{p.name}</div>
   {keys.length?keys.map(c=><div key={c} className="row-m">{c}: {pb[c]!=null?`planned ${money(pb[c],c)}`:"no budget recorded"} · {ps[c]!=null?`actual ${money(ps[c],c)}`:"no spend recorded"}</div>):<div className="row-m">No project cost has been recorded.</div>}
  </button>})}
  {projects.length===0&&<div className="card small">No projects are visible for this unit.</div>}
  <div className="sec"><span>Between departments</span><span>{transfers.length}</span></div>
  {transfers.sort((a,b)=>String(b.sent_on).localeCompare(String(a.sent_on))).map(t=><div key={t.id} className="row">
   <div className="row-t">{t.from_unit_id===me.unit_id?"Sent":"Received"} · {money(t.amount_minor,t.currency)}</div>
   <div className="row-m">{t.sent_on} · {t.purpose}</div>
   <div className="row-note">{t.state==="sent"?"Awaiting confirmation":t.state==="disputed"?"Disputed":t.state==="confirmed"?"Confirmed":t.state}</div>
  </div>)}
  {transfers.length===0&&<div className="card small">No transfers involving this unit are visible.</div>}
  <div className="sec"><span>Requests</span></div>
  <div className="card small">A separate Manager finance-request/approval record is not present in the current schema. Spend, budgets and transfers are not being relabelled as requests.</div>
  <p className="small" style={{marginTop:12}}>These figures are CEAC OS records, not a bank balance. Managers cannot post or edit Finance entries from this screen.</p>
 </div>;
}
