import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { LoadingState, ProductNotice } from "../components/bits";
import { humanError } from "../lib/productLanguage";

const pad=(v)=>String(v).padStart(2,"0");
const dayKey=(d)=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x;};
const startOfWeek=(d)=>{const x=new Date(d.getFullYear(),d.getMonth(),d.getDate());x.setDate(x.getDate()-((x.getDay()+6)%7));return x;};
const accraDay=(value)=>{const parts=new Intl.DateTimeFormat("en-CA",{timeZone:"Africa/Accra",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date(value));const map=Object.fromEntries(parts.map(p=>[p.type,p.value]));return `${map.year}-${map.month}-${map.day}`;};

export default function StaffCalendar({me,openItem,openMeeting}){
  const [cursor,setCursor]=useState(new Date()),[events,setEvents]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState(null),[filter,setFilter]=useState("all");
  useEffect(()=>{load();},[me.id,me.unit_id,cursor.getFullYear(),cursor.getMonth()]);
  async function load(){
    setLoading(true);setError(null);
    try{
      const from=new Date(cursor.getFullYear(),cursor.getMonth()-1,1).toISOString(),to=new Date(cursor.getFullYear(),cursor.getMonth()+2,1).toISOString();
      const [work,meetings,ministry,leave]=await Promise.all([
        supabase.from("work_items").select("id,ref,title,status,due_at,projects(name)").eq("assignee_id",me.id).not("due_at","is",null).neq("visibility","private"),
        supabase.from("meeting_sessions").select("id,title,scope,unit_id,project_id,starts_at,ends_at,status,provider,projects(name),units(name)").gte("starts_at",from).lt("starts_at",to).order("starts_at"),
        supabase.from("ministry_events").select("id,title,kind,scope,unit_id,starts_at,ends_at,all_day,location,cancelled").gte("starts_at",from).lt("starts_at",to).order("starts_at"),
        supabase.from("leave_requests").select("id,kind,start_date,end_date,status").eq("profile_id",me.id).eq("status","approved").order("start_date")
      ]);
      const first=[work.error,meetings.error,ministry.error,leave.error].find(Boolean);if(first)throw first;
      const rows=[];
      (work.data||[]).forEach(item=>rows.push({id:`work-${item.id}`,kind:"work",date:accraDay(item.due_at),title:item.title,meta:`${item.ref}${item.projects?.name?` · ${item.projects.name}`:""}`,itemId:item.id}));
      (meetings.data||[]).filter(row=>row.status!=="cancelled").forEach(row=>rows.push({id:`meeting-${row.id}`,kind:"meeting",date:accraDay(row.starts_at),title:row.title,meta:new Date(row.starts_at).toLocaleTimeString("en-GB",{timeZone:"Africa/Accra",hour:"2-digit",minute:"2-digit"}),meetingId:row.id}));
      (ministry.data||[]).filter(row=>row.scope==="church"||row.unit_id===me.unit_id).forEach(row=>rows.push({id:`ministry-${row.id}`,kind:"ministry",date:accraDay(row.starts_at),title:`${row.cancelled?"Cancelled · ":""}${row.title}`,meta:row.location||"Ministry activity"}));
      (leave.data||[]).forEach(row=>{let d=new Date(`${row.start_date}T00:00:00`),end=new Date(`${row.end_date}T00:00:00`);while(d<=end){rows.push({id:`leave-${row.id}-${dayKey(d)}`,kind:"leave",date:dayKey(d),title:`${row.kind} leave`,meta:"Approved"});d=addDays(d,1);}});
      setEvents(rows);
    }catch(err){setError(humanError(err,"Your calendar could not be loaded."));setEvents([]);}finally{setLoading(false);}
  }
  const first=new Date(cursor.getFullYear(),cursor.getMonth(),1),gridStart=startOfWeek(first);
  const days=useMemo(()=>Array.from({length:42},(_,i)=>addDays(gridStart,i)),[cursor.getFullYear(),cursor.getMonth()]);
  const visible=filter==="all"?events:events.filter(e=>e.kind===filter);
  const upcoming=[...visible].filter(e=>e.date>=dayKey(new Date())).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,10);
  const open=(event)=>event.itemId?openItem?.(event.itemId):event.meetingId?openMeeting?.(event.meetingId):null;
  return <div className="body premium-page staff-calendar-page">
    <header className="premium-page-head"><div><span className="eyebrow">Your schedule</span><h1 className="h1">Calendar</h1><p className="screen-note">Your deadlines, meetings, approved leave and ministry commitments in one place.</p></div></header>
    <div className="premium-filter-row" role="tablist" aria-label="Calendar filters">{[["all","All"],["meeting","Meetings"],["work","Work"],["ministry","Ministry"],["leave","Leave"]].map(([key,label])=><button key={key} role="tab" aria-selected={filter===key} className={filter===key?"on":""} onClick={()=>setFilter(key)}>{label}</button>)}</div>
    {error&&<ProductNotice tone="error" title="Could not load Calendar">{error}</ProductNotice>}
    {loading?<LoadingState label="Loading your calendar…"/>:<div className="staff-calendar-layout">
      <section className="premium-surface staff-month-card">
        <div className="staff-calendar-toolbar"><button aria-label="Previous month" onClick={()=>setCursor(new Date(cursor.getFullYear(),cursor.getMonth()-1,1))}>←</button><strong>{cursor.toLocaleDateString("en-GB",{month:"long",year:"numeric"})}</strong><button aria-label="Next month" onClick={()=>setCursor(new Date(cursor.getFullYear(),cursor.getMonth()+1,1))}>→</button></div>
        <div className="staff-calendar-weekdays">{["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(day=><span key={day}>{day}</span>)}</div>
        <div className="staff-calendar-grid">{days.map(date=>{const key=dayKey(date),dayEvents=visible.filter(e=>e.date===key),muted=date.getMonth()!==cursor.getMonth(),today=key===dayKey(new Date());return <div className={`staff-calendar-day ${muted?"muted":""} ${today?"today":""}`} key={key}><span className="staff-calendar-number">{date.getDate()}</span><div>{dayEvents.slice(0,3).map(event=><button key={event.id} className={`staff-calendar-event ${event.kind}`} onClick={()=>open(event)} disabled={!event.itemId&&!event.meetingId}><span>{event.title}</span></button>)}{dayEvents.length>3&&<small>+{dayEvents.length-3} more</small>}</div></div>;})}</div>
      </section>
      <aside className="premium-surface staff-calendar-agenda"><div className="premium-section-head"><div><span className="eyebrow">Next up</span><h2>Coming up</h2></div><span>{upcoming.length}</span></div>{upcoming.length?upcoming.map(event=><button key={event.id} className="premium-list-row" onClick={()=>open(event)} disabled={!event.itemId&&!event.meetingId}><span className={`premium-dot ${event.kind}`}/><span><strong>{event.title}</strong><small>{new Date(`${event.date}T00:00:00`).toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short"})} · {event.meta}</small></span></button>):<div className="premium-empty">Nothing is recorded in this view.</div>}</aside>
    </div>}
  </div>;
}