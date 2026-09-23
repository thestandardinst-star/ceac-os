import { useEffect,useMemo,useState } from "react";
import { supabase } from "../lib/supabase";
import { LoadingState,ProductNotice } from "../components/bits";
import { humanError } from "../lib/productLanguage";
import FinanceRequestQueue from "../components/FinanceRequestQueue";

const money=(minor,currency)=>(currency||"GHS")+" "+(Number(minor||0)/100).toLocaleString("en-GH",{minimumFractionDigits:2,maximumFractionDigits:2});
function totals(rows){
  const out={};
  rows.forEach(row=>{const c=row.currency||"GHS";out[c]=(out[c]||0)+Number(row.amount_minor||0);});
  return out;
}

export default function ExecutiveFinance({me}){
 const [requests,setRequests]=useState([]),[spend,setSpend]=useState([]),[budgets,setBudgets]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState(null);
 useEffect(()=>{load();},[me.org_id]);
 async function load(){
   setLoading(true);setError(null);
   try{
     const [r,s,b]=await Promise.all([
       supabase.from("finance_requests").select("id,amount_minor,currency,state,unit_id,units(name)").eq("org_id",me.org_id).order("created_at",{ascending:false}).limit(250),
       supabase.from("spend_lines").select("id,amount_minor,currency,unit_id,units(name),spent_on,reverses_id").eq("org_id",me.org_id).order("spent_on",{ascending:false}).limit(400),
       supabase.from("budgets").select("id,amount_minor,currency,unit_id,project_id,units(name)").eq("org_id",me.org_id)
     ]);
     const first=[r.error,s.error,b.error].find(Boolean);if(first)throw first;
     setRequests(r.data||[]);setSpend(s.data||[]);setBudgets(b.data||[]);
   }catch(e){setError(humanError(e,"Finance could not be loaded."));}
   finally{setLoading(false);}
 }
 const budgetTotals=useMemo(()=>totals(budgets),[budgets]);
 const spendTotals=useMemo(()=>totals(spend.map(x=>({...x,amount_minor:x.reverses_id?-Number(x.amount_minor||0):Number(x.amount_minor||0)}))),[spend]);
 const approvedTotals=useMemo(()=>totals(requests.filter(x=>["approved","fulfilled"].includes(x.state))),[requests]);
 const currencies=useMemo(()=>Array.from(new Set([...Object.keys(budgetTotals),...Object.keys(spendTotals),...Object.keys(approvedTotals),...requests.map(x=>x.currency||"GHS")])).sort(),[budgetTotals,spendTotals,approvedTotals,requests]);
 const pendingByCurrency=useMemo(()=>{const out={};requests.filter(x=>x.state==="submitted").forEach(x=>{const c=x.currency||"GHS";out[c]=(out[c]||0)+1});return out;},[requests]);
 const byUnit=useMemo(()=>{
   const out={};
   spend.forEach(x=>{const c=x.currency||"GHS",n=x.units?.name||"Unassigned",amount=x.reverses_id?-Number(x.amount_minor||0):Number(x.amount_minor||0);(out[c]=out[c]||{});out[c][n]=(out[c][n]||0)+amount});
   return out;
 },[spend]);

 return <div className="body premium-exec-page">
   <header className="exec-page-head"><div><span className="eyebrow">Financial context</span><h1 className="h1">Finance</h1><p className="screen-note">Leadership context from recorded budgets, requests and actual spend. Currencies stay separate. Requests that specifically require Group Pastor authority appear below.</p></div></header>
   {error&&<ProductNotice tone="error" title="Could not load Finance">{error}</ProductNotice>}
   <FinanceRequestQueue me={me} authority="exec" title="Requests needing Group Pastor" />
   {loading?<LoadingState label="Loading financial context…"/>:<>
     {currencies.length===0?<div className="premium-empty">No financial records are visible yet.</div>:<section className="exec-currency-grid">
       {currencies.map(currency=><article className="exec-currency-card" key={currency}>
         <div className="exec-currency-head"><span>{currency}</span><small>No currency conversion</small></div>
         <div className="exec-currency-facts">
           <div><span>Budget recorded</span><strong>{money(budgetTotals[currency]||0,currency)}</strong></div>
           <div><span>Actual spend</span><strong>{money(spendTotals[currency]||0,currency)}</strong></div>
           <div><span>Approved requests</span><strong>{money(approvedTotals[currency]||0,currency)}</strong></div>
           <div><span>Requests waiting</span><strong>{pendingByCurrency[currency]||0}</strong></div>
         </div>
         <div className="exec-bars">{Object.entries(byUnit[currency]||{}).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([name,value])=>{
           const total=spendTotals[currency]||0;
           return <div key={name}><span>{name}</span><i><b style={{width:total?Math.max(4,(value/total)*100)+"%":"4%"}}/></i><strong>{money(value,currency)}</strong></div>;
         })}</div>
       </article>)}
     </section>}
     <p className="exec-footnote">Recorded spend is not a bank balance. CEAC OS does not convert currencies or infer unrecorded balances.</p>
   </>}
 </div>;
}
