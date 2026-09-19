import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

const FILTERS = [["all","All"],["projects","Projects"],["tasks","Tasks"],["leave","Leave"],["activities","Ministry/unit activities"]];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const pad = (n) => String(n).padStart(2, "0");
const dateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const parseDateOnly = (s) => { const [y,m,d] = String(s).slice(0,10).split("-").map(Number); return new Date(y,m-1,d); };
const addDays = (d,n) => { const x=new Date(d); x.setDate(x.getDate()+n); return x; };
const startOfWeek = (d) => { const x=new Date(d.getFullYear(),d.getMonth(),d.getDate()); const day=(x.getDay()+6)%7; x.setDate(x.getDate()-day); return x; };
const labelDate = (s) => parseDateOnly(s).toLocaleDateString("en-GB",{day:"numeric",month:"short"});
const accraDateKey = (value) => {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Accra", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(value));
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${byType.year}-${byType.month}-${byType.day}`;
};

export default function ManagerCalendar({ me, openItem, openProject, openPerson }) {
  const [view,setView]=useState("month");
  const [filter,setFilter]=useState("all");
  const [cursor,setCursor]=useState(new Date());
  const [events,setEvents]=useState([]);
  const [error,setError]=useState(null);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{ load(); },[me.id,me.unit_id]);

  async function load(){
    setLoading(true); setError(null);
    const [projects, work, members, leave, ministry, ministryNeeds] = await Promise.all([
      supabase.from("projects").select("id,name,starts_on,ends_on,status"),
      supabase.from("work_items").select("id,ref,title,due_at,status,project_id").eq("unit_id",me.unit_id).not("due_at","is",null).neq("visibility","private"),
      supabase.from("unit_memberships").select("profile_id").eq("unit_id",me.unit_id).eq("active",true),
      supabase.from("leave_requests").select("id,profile_id,kind,start_date,end_date,status,profiles!leave_requests_profile_id_fkey(full_name)").in("status",["approved","escalated"]),
      supabase.from("ministry_events").select("id,title,kind,scope,unit_id,starts_at,ends_at,all_day,location,notes,cancelled"),
      supabase.from("ministry_event_units").select("event_id,unit_id,note").eq("unit_id",me.unit_id)
    ]);
    const firstError=[projects.error,work.error,members.error,leave.error,ministry.error,ministryNeeds.error].find(Boolean);
    if(firstError){ setError(firstError.message); setLoading(false); return; }
    const memberIds=new Set((members.data||[]).map(x=>x.profile_id));
    const out=[];
    (projects.data||[]).forEach(p=>{
      if(p.starts_on) out.push({id:`project-start-${p.id}`,type:"projects",date:p.starts_on,title:`${p.name} starts`,projectId:p.id});
      if(p.ends_on) out.push({id:`project-end-${p.id}`,type:"projects",date:p.ends_on,title:`${p.name} ends`,projectId:p.id});
    });
    (work.data||[]).forEach(w=>out.push({id:`task-${w.id}`,type:"tasks",date:accraDateKey(w.due_at),title:`${w.ref} · ${w.title}`,itemId:w.id}));
    (leave.data||[]).filter(l=>memberIds.has(l.profile_id)).forEach(l=>{
      let d=parseDateOnly(l.start_date), end=parseDateOnly(l.end_date);
      while(d<=end){ out.push({id:`leave-${l.id}-${dateKey(d)}`,type:"leave",date:dateKey(d),title:`${l.profiles?.full_name||"Team member"} · ${l.kind} leave`,profileId:l.profile_id}); d=addDays(d,1); }
    });
    const needByEvent = new Map((ministryNeeds.data||[]).map((row)=>[row.event_id,row.note]));
    (ministry.data||[]).filter((event)=>event.scope==="church"||event.unit_id===me.unit_id||needByEvent.has(event.id)).forEach((event)=>{
      const needNote=needByEvent.get(event.id);
      let d=parseDateOnly(accraDateKey(event.starts_at));
      const end=parseDateOnly(accraDateKey(event.ends_at||event.starts_at));
      while(d<=end){
        out.push({
          id:`activity-${event.id}-${dateKey(d)}`,
          type:"activities",
          date:dateKey(d),
          title:`${event.cancelled?"Cancelled · ":""}${event.title}${needNote?` · Your unit: ${needNote}`:""}${event.location?` · ${event.location}`:""}`,
        });
        d=addDays(d,1);
      }
    });
    setEvents(out); setLoading(false);
  }

  const days=useMemo(()=>{
    if(view==="week"){ const s=startOfWeek(cursor); return Array.from({length:7},(_,i)=>addDays(s,i)); }
    const first=new Date(cursor.getFullYear(),cursor.getMonth(),1);
    const start=startOfWeek(first);
    return Array.from({length:42},(_,i)=>addDays(start,i));
  },[cursor,view]);
  const visible=filter==="all"?events:events.filter(e=>e.type===filter);
  const move=(n)=>setCursor(view==="month"?new Date(cursor.getFullYear(),cursor.getMonth()+n,1):addDays(cursor,n*7));
  const heading=view==="month"?`${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`:`${labelDate(dateKey(days[0]))} – ${labelDate(dateKey(days[6]))}`;

  return <div className="body">
    <div style={{paddingTop:26}}><div className="eyebrow">{me.unit_name}</div><h1 className="h1" style={{marginTop:6}}>Calendar</h1><p className="screen-note">Project dates, task deadlines, approved team leave and the ministry calendar in one place.</p></div>
    {error&&<div className="flag flag-brick"><h4>Could not load the calendar</h4>{error}</div>}
    <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:14}}>
      <button className={"btn btn-sm "+(view==="month"?"":"btn-ghost")} onClick={()=>setView("month")}>Month</button>
      <button className={"btn btn-sm "+(view==="week"?"":"btn-ghost")} onClick={()=>setView("week")}>Week</button>
      {FILTERS.map(([k,l])=><button key={k} className="btn btn-ghost btn-sm" style={{fontWeight:filter===k?700:400}} onClick={()=>setFilter(k)}>{l}</button>)}
    </div>
    <div className="sec"><button onClick={()=>move(-1)}>←</button><span>{heading}</span><button onClick={()=>move(1)}>→</button></div>
    {loading?<div className="spin">Loading calendar...</div>:<div style={{display:"grid",gridTemplateColumns:"repeat(7,minmax(0,1fr))",gap:6}}>
      {days.map(d=>{const key=dateKey(d); const dayEvents=visible.filter(e=>e.date===key); const muted=view==="month"&&d.getMonth()!==cursor.getMonth(); return <div key={key} className="card" style={{minHeight:view==="month"?110:180,padding:10,opacity:muted ? 0.55 : 1}}>
        <div className="small" style={{fontWeight:700}}>{d.toLocaleDateString("en-GB",{weekday:"short",day:"numeric"})}</div>
        {dayEvents.map(e=><button key={e.id} onClick={()=>e.itemId?openItem(e.itemId):e.projectId?openProject(e.projectId):e.profileId?openPerson(e.profileId,"sessions"):null} style={{display:"block",width:"100%",textAlign:"left",marginTop:7,fontSize:11.5,lineHeight:1.3}}>{e.title}</button>)}
      </div>})}
    </div>}
    {filter==="activities"&&visible.length===0&&<div className="card small" style={{marginTop:12}}>No ministry or unit activity is recorded for this period.</div>}
  </div>;
}
