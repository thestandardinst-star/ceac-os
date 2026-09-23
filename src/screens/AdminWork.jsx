import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { dueLabel, isOverdue } from "../lib/time";
import { LoadingState, ProductNotice, statusPill } from "../components/bits";
import { humanError } from "../lib/productLanguage";

const CLOSED=new Set(["completed","self_certified","cancelled"]);

function Row({item,openItem,showUnit=true}){
  const attention=isOverdue(item.due_at)&&!CLOSED.has(item.status);
  return <button className={"admin-work-row "+(attention?"attention":"")} onClick={()=>openItem(item.id)}>
    <span className="admin-work-main"><strong>{item.title}</strong><small>{item.ref} · {String(item.kind||"work").replaceAll("_"," ")}</small>{item.projects?.name&&<em>{item.projects.name}</em>}</span>
    {showUnit&&<span className="admin-work-unit"><strong>{item.units?.name||"Unit"}</strong><small>{item.profiles?.full_name||"Unassigned"}</small></span>}
    <span className="admin-work-due">{dueLabel(item.due_at)}</span>
    <span>{statusPill(item.status)}</span>
  </button>;
}

export default function AdminWork({me,openItem,goAssign}){
  const [view,setView]=useState("given");
  const [mine,setMine]=useState([]);
  const [given,setGiven]=useState([]);
  const [org,setOrg]=useState([]);
  const [reviews,setReviews]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(null);

  useEffect(()=>{load();},[me.id,me.org_id]);
  async function load(){
    setLoading(true);setError(null);
    try{
      const fields="id,ref,title,kind,status,due_at,assigned_by,assignee_id,unit_id,projects(name),units(name),profiles!work_items_assignee_id_fkey(full_name)";
      const [mineR,givenR,orgR,reviewR]=await Promise.all([
        supabase.from("work_items").select(fields).eq("org_id",me.org_id).eq("assignee_id",me.id).order("created_at",{ascending:false}),
        supabase.from("work_items").select(fields).eq("org_id",me.org_id).eq("assigned_by",me.id).neq("assignee_id",me.id).order("created_at",{ascending:false}),
        supabase.from("work_items").select(fields).eq("org_id",me.org_id).order("last_movement_at",{ascending:false}).limit(250),
        supabase.from("submissions").select("id,submitted_at,note,profiles!submissions_profile_id_fkey(full_name),work_items!inner(id,ref,title,status,due_at,org_id,units(name))").eq("work_items.org_id",me.org_id).eq("work_items.status","in_review").order("submitted_at",{ascending:false}).limit(120)
      ]);
      const err=[mineR.error,givenR.error,orgR.error,reviewR.error].find(Boolean); if(err) throw err;
      setMine(mineR.data||[]);setGiven(givenR.data||[]);setOrg(orgR.data||[]);
      const latest=new Map();
      (reviewR.data||[]).forEach(r=>{const id=r.work_items?.id;if(!id)return;if(!latest.has(id))latest.set(id,r);});
      setReviews([...latest.values()]);
    }catch(e){setError(humanError(e,"Administration work could not be loaded."));}
    finally{setLoading(false);}
  }
  const active=(rows)=>rows.filter(x=>!CLOSED.has(x.status));
  const views=[
    ["given","Given out",active(given).length],
    ["reviews","Needs review",reviews.length],
    ["organisation","Organisation",active(org).length],
    ["mine","Mine",active(mine).length],
  ];
  const rows=view==="given"?active(given):view==="organisation"?active(org):active(mine);
  return <div className="body admin-work premium-admin-page">
    <header className="admin-page-header">
      <div><span className="eyebrow">Organisation operations</span><h1 className="h1">Work</h1><p className="screen-note">Follow work Administration delegated, review what is waiting, or inspect organisation work without turning every operational engine into a separate menu.</p></div>
      <button className="btn" onClick={()=>goAssign?.()}>Give out work</button>
    </header>
    <div className="admin-work-tabs" role="tablist" aria-label="Administration work views">
      {views.map(([key,label,count])=><button key={key} role="tab" aria-selected={view===key} className={view===key?"on":""} onClick={()=>setView(key)}><span>{label}</span><b>{count}</b></button>)}
    </div>
    {error&&<ProductNotice tone="error" title="Could not load Work">{error}</ProductNotice>}
    {loading&&<LoadingState label="Loading organisation work…" />}
    {!loading&&view==="reviews"&&<section className="admin-work-list">
      {reviews.map(r=><button className="admin-review-row" key={r.id} onClick={()=>openItem(r.work_items.id)}><span className="admin-review-avatar">{(r.profiles?.full_name||"?").slice(0,1).toUpperCase()}</span><span><strong>{r.work_items.title}</strong><small>{r.profiles?.full_name||"Team member"} · {r.work_items.units?.name||"Unit"}</small></span><span>{statusPill("in_review")}</span></button>)}
      {reviews.length===0&&<div className="admin-work-empty"><strong>Nothing waiting for review</strong><span>Organisation submissions visible to Administration will appear here.</span></div>}
    </section>}
    {!loading&&view!=="reviews"&&<section className="admin-work-list">
      {rows.map(x=><Row key={x.id} item={x} openItem={openItem}/>)}
      {rows.length===0&&<div className="admin-work-empty"><strong>No open work in this view</strong><span>The list will update when work is created or delegated.</span></div>}
    </section>}
    {view==="given"&&<p className="admin-work-footnote">“Given out” uses the current recorded assigner. CEAC OS does not invent delegation history that is not stored.</p>}
  </div>;
}
