import { useEffect,useState } from "react";
import { supabase } from "../lib/supabase";
import { LoadingState,ProductNotice,statusPill } from "../components/bits";
import { dueLabel } from "../lib/time";
import { humanError } from "../lib/productLanguage";
const CLOSED=new Set(["completed","self_certified","cancelled"]);
export default function ExecutiveWork({me,openItem,goAssign}){
  const [view,setView]=useState("given"),[mine,setMine]=useState([]),[given,setGiven]=useState([]),[reviews,setReviews]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState(null);
  useEffect(()=>{load();},[me.id,me.org_id]);
  async function load(){setLoading(true);setError(null);try{
    const fields="id,ref,title,status,due_at,assignee_id,assigned_by,units(name),profiles!work_items_assignee_id_fkey(full_name),projects(name)";
    const [m,g,r]=await Promise.all([
      supabase.from("work_items").select(fields).eq("org_id",me.org_id).eq("assignee_id",me.id).order("due_at",{ascending:true,nullsFirst:false}),
      supabase.from("work_items").select(fields).eq("org_id",me.org_id).eq("assigned_by",me.id).neq("assignee_id",me.id).order("due_at",{ascending:true,nullsFirst:false}),
      supabase.from("submissions").select("id,work_items!inner(id,ref,title,status,due_at,org_id,units(name)),profiles!submissions_profile_id_fkey(full_name)").eq("work_items.org_id",me.org_id).eq("work_items.status","in_review").order("submitted_at",{ascending:false}).limit(80)
    ]);const first=[m.error,g.error,r.error].find(Boolean);if(first)throw first;setMine(m.data||[]);setGiven(g.data||[]);
    const seen=new Set();setReviews((r.data||[]).filter(x=>x.work_items&&!seen.has(x.work_items.id)&&(seen.add(x.work_items.id),true)));
  }catch(e){setError(humanError(e,"Executive work could not be loaded."));}finally{setLoading(false);}}
  const active=rows=>rows.filter(x=>!CLOSED.has(x.status));
  const tabs=[["given","Given out",active(given).length],["reviews","Needs review",reviews.length],["mine","Mine",active(mine).length]];
  const rows=view==="given"?active(given):active(mine);
  return <div className="body executive-work premium-exec-page">
    <header className="exec-page-head"><div><span className="eyebrow">Leadership work</span><h1 className="h1">Work</h1><p className="screen-note">What you have given out, what needs review and what you personally carry.</p></div><button className="btn" onClick={()=>goAssign?.()}>Give out work</button></header>
    <div className="exec-tabs" role="tablist">{tabs.map(([k,l,n])=><button role="tab" aria-selected={view===k} className={view===k?"on":""} key={k} onClick={()=>setView(k)}><span>{l}</span><b>{n}</b></button>)}</div>
    {error&&<ProductNotice tone="error" title="Could not load Work">{error}</ProductNotice>}{loading&&<LoadingState label="Loading leadership work…"/>}
    {!loading&&view==="reviews"&&<section className="exec-list">{reviews.length?reviews.map(x=><button key={x.id} onClick={()=>openItem(x.work_items.id)}><span><strong>{x.work_items.title}</strong><small>{x.profiles?.full_name||"Team member"} · {x.work_items.units?.name||"Unit"}</small></span>{statusPill("in_review")}</button>):<div className="premium-empty">Nothing is waiting for review.</div>}</section>}
    {!loading&&view!=="reviews"&&<section className="exec-list">{rows.length?rows.map(x=><button key={x.id} onClick={()=>openItem(x.id)}><span><strong>{x.title}</strong><small>{x.profiles?.full_name||x.projects?.name||x.units?.name||x.ref}</small></span><em>{dueLabel(x.due_at)}</em>{statusPill(x.status)}</button>):<div className="premium-empty">No open work in this view.</div>}</section>}
    {view==="given"&&<p className="exec-footnote">“Given out” reflects the current recorded assigner. CEAC OS does not invent a delegation chain that is not stored.</p>}
  </div>;
}