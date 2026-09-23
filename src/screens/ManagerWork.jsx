import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { dueLabel, isOverdue } from "../lib/time";
import { ProductNotice, LoadingState, statusPill } from "../components/bits";
import { humanError } from "../lib/productLanguage";

const COMPLETE=new Set(["completed","self_certified","cancelled"]);

function WorkRow({item,openItem,showAssignee=true}){
  const tone=isOverdue(item.due_at)&&!COMPLETE.has(item.status)?"attention":"";
  return <button className={"manager-work-row "+tone} onClick={()=>openItem(item.id)}>
    <div className="manager-work-main">
      <strong>{item.title}</strong>
      <span>{item.ref} · {String(item.kind||"work").replaceAll("_"," ")}</span>
      {item.projects?.name&&<small>{item.projects.name}</small>}
    </div>
    <div className="manager-work-owner">
      {showAssignee&&<span>{item.profiles?.full_name||"Unassigned"}</span>}
      <small>{dueLabel(item.due_at)}</small>
    </div>
    <div className="manager-work-state">{statusPill(item.status)}</div>
  </button>;
}

export default function ManagerWork({me,openItem,goAssign}){
  const [view,setView]=useState("given");
  const [mine,setMine]=useState([]);
  const [given,setGiven]=useState([]);
  const [team,setTeam]=useState([]);
  const [reviews,setReviews]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(null);

  useEffect(()=>{load();},[me.id,me.unit_id]);

  async function load(){
    setLoading(true);setError(null);
    try{
      const [mineResult,givenResult,teamResult,reviewResult]=await Promise.all([
        supabase.from("work_items")
          .select("id,ref,title,kind,status,due_at,assigned_by,assignee_id,projects(name),profiles!work_items_assignee_id_fkey(full_name)")
          .eq("assignee_id",me.id).order("created_at",{ascending:false}),
        supabase.from("work_items")
          .select("id,ref,title,kind,status,due_at,assigned_by,assignee_id,projects(name),profiles!work_items_assignee_id_fkey(full_name)")
          .eq("assigned_by",me.id).neq("assignee_id",me.id).order("created_at",{ascending:false}),
        supabase.from("work_items")
          .select("id,ref,title,kind,status,due_at,assigned_by,assignee_id,projects(name),profiles!work_items_assignee_id_fkey(full_name)")
          .eq("unit_id",me.unit_id).neq("assignee_id",me.id).order("created_at",{ascending:false}),
        supabase.from("submissions")
          .select("id,submitted_at,note,profiles!submissions_profile_id_fkey(full_name),work_items!inner(id,ref,title,kind,status,due_at,unit_id,assignee_id,projects(name))")
          .eq("work_items.unit_id",me.unit_id).eq("work_items.status","in_review")
          .order("submitted_at",{ascending:true}),
      ]);
      const err=[mineResult.error,givenResult.error,teamResult.error,reviewResult.error].find(Boolean);
      if(err) throw err;
      setMine(mineResult.data||[]);
      setGiven(givenResult.data||[]);
      setTeam(teamResult.data||[]);
      const latest=new Map();
      (reviewResult.data||[]).forEach(row=>{
        const id=row.work_items?.id;
        if(!id)return;
        const existing=latest.get(id);
        if(!existing||new Date(row.submitted_at)>new Date(existing.submitted_at)) latest.set(id,row);
      });
      setReviews([...latest.values()]);
    }catch(err){setError(humanError(err,"Manager work could not be loaded."));}
    finally{setLoading(false);}
  }

  const activeMine=useMemo(()=>mine.filter(item=>!COMPLETE.has(item.status)),[mine]);
  const activeGiven=useMemo(()=>given.filter(item=>!COMPLETE.has(item.status)),[given]);
  const activeTeam=useMemo(()=>team.filter(item=>!COMPLETE.has(item.status)),[team]);
  const views=[
    ["given","Given out",activeGiven.length],
    ["reviews","Needs review",reviews.length],
    ["team","Team work",activeTeam.length],
    ["mine","Mine",activeMine.length],
  ];
  const rows=view==="given"?activeGiven:view==="team"?activeTeam:activeMine;

  return <div className="body manager-work premium-manager-page">
    <header className="manager-page-header">
      <div><span className="eyebrow">{me.unit_name}</span><h1 className="h1">Work</h1><p className="screen-note">Delegate, follow progress and review what comes back without losing sight of your own work.</p></div>
      <button className="btn" onClick={()=>goAssign?.()}>Give out work</button>
    </header>

    <div className="manager-work-tabs" role="tablist" aria-label="Manager work views">
      {views.map(([key,label,count])=><button key={key} role="tab" aria-selected={view===key} className={view===key?"on":""} onClick={()=>setView(key)}>
        <span>{label}</span><b>{count}</b>
      </button>)}
    </div>

    {error&&<ProductNotice tone="error" title="Could not load Manager Work">{error}</ProductNotice>}
    {loading&&<LoadingState label="Loading manager work…" />}

    {!loading&&view==="reviews"&&<section className="manager-work-list">
      {reviews.map(row=><button className="manager-review-row" key={row.id} onClick={()=>openItem(row.work_items.id)}>
        <span className="manager-review-avatar">{(row.profiles?.full_name||"?").slice(0,1).toUpperCase()}</span>
        <span><strong>{row.work_items.title}</strong><small>{row.profiles?.full_name||"Team member"} · submitted {new Date(row.submitted_at).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}</small>{row.note&&<em>{row.note}</em>}</span>
        <span>{statusPill("in_review")}</span>
      </button>)}
      {reviews.length===0&&<div className="manager-work-empty"><strong>Nothing waiting for review</strong><span>New submissions from your team will appear here.</span></div>}
    </section>}

    {!loading&&view!=="reviews"&&<section className="manager-work-list">
      {rows.map(item=><WorkRow key={item.id} item={item} openItem={openItem} showAssignee={view!=="mine"}/>)}
      {rows.length===0&&<div className="manager-work-empty"><strong>{view==="given"?"No delegated work is open":view==="team"?"No other team work is open":"Nothing is waiting in your own work"}</strong><span>{view==="given"?"Use Give out work when you delegate something.":view==="team"?"Active work carried by your unit will appear here.":"Your personal responsibilities will appear here."}</span></div>}
    </section>}

    {view==="given"&&<p className="manager-work-footnote">This view uses the recorded assigner on the current work item. A complete multi-step delegation chain will require explicit assignment-history records; CEAC OS does not invent that history.</p>}
  </div>;
}
