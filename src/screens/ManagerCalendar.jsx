import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { Sheet, ProductNotice, LoadingState } from "../components/bits";
import { humanError } from "../lib/productLanguage";

const FILTERS = [["all","All"],["meetings","Meetings"],["projects","Projects"],["tasks","Tasks"],["leave","Leave"],["activities","Ministry/unit activities"]];
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

export default function ManagerCalendar({ me, openItem, openProject, openMeeting, scheduleMeeting, openPerson }) {
  const [view,setView]=useState("month");
  const [filter,setFilter]=useState("all");
  const [cursor,setCursor]=useState(new Date());
  const [events,setEvents]=useState([]);
  const [selectedActivity,setSelectedActivity]=useState(null);
  const [selectedLeave,setSelectedLeave]=useState(null);
  const [filterSheet,setFilterSheet]=useState(false);
  const [error,setError]=useState(null);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{ load(); },[me.id,me.unit_id]);

  async function load(){
    setLoading(true); setError(null);
    const [projects, work, members, leave, ministry, ministryNeeds, meetings] = await Promise.all([
      supabase.from("projects").select("id,name,starts_on,ends_on,status,lead_unit_id,project_units(unit_id)"),
      supabase.from("work_items").select("id,ref,title,due_at,status,project_id").eq("unit_id",me.unit_id).not("due_at","is",null).neq("visibility","private"),
      supabase.from("unit_memberships").select("profile_id").eq("unit_id",me.unit_id),
      supabase.from("leave_requests").select("id,profile_id,kind,start_date,end_date,status,profiles!leave_requests_profile_id_fkey(full_name)").eq("status","approved"),
      supabase.from("ministry_events").select("id,title,kind,scope,unit_id,starts_at,ends_at,all_day,location,notes,cancelled"),
      supabase.from("ministry_event_units").select("event_id,unit_id,note").eq("unit_id",me.unit_id),
      supabase.from("meeting_sessions").select("id,title,scope,unit_id,project_id,starts_at,ends_at,status,provider,join_url,meeting_participants(profile_id,role)").order("starts_at")
    ]);
    const firstError=[projects.error,work.error,members.error,leave.error,ministry.error,ministryNeeds.error,meetings.error].find(Boolean);
    if(firstError){ setError(humanError(firstError,"Calendar could not be loaded.")); setLoading(false); return; }
    const memberIds=new Set((members.data||[]).map(x=>x.profile_id));
    const out=[];
    (projects.data||[]).filter((p)=>p.lead_unit_id===me.unit_id||(p.project_units||[]).some((row)=>row.unit_id===me.unit_id)).forEach(p=>{
      if(p.starts_on) out.push({id:`project-start-${p.id}`,type:"projects",date:p.starts_on,title:`${p.name} starts`,projectId:p.id});
      if(p.ends_on) out.push({id:`project-end-${p.id}`,type:"projects",date:p.ends_on,title:`${p.name} ends`,projectId:p.id});
    });
    (work.data||[]).forEach(w=>out.push({id:`task-${w.id}`,type:"tasks",date:accraDateKey(w.due_at),title:`${w.ref} · ${w.title}`,itemId:w.id}));
    (leave.data||[]).filter(l=>memberIds.has(l.profile_id)).forEach(l=>{
      let d=parseDateOnly(l.start_date), end=parseDateOnly(l.end_date);
      while(d<=end){ out.push({
        id:`leave-${l.id}-${dateKey(d)}`,
        type:"leave",
        date:dateKey(d),
        title:`${l.profiles?.full_name||"Team member"} · ${l.kind} leave`,
        leave:{ id:l.id, profile_id:l.profile_id, full_name:l.profiles?.full_name||"Team member", kind:l.kind, start_date:l.start_date, end_date:l.end_date, status:l.status }
      }); d=addDays(d,1); }
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
          activity: {
            id: event.id,
            title: event.title,
            kind: event.kind,
            scope: event.scope,
            starts_at: event.starts_at,
            ends_at: event.ends_at,
            all_day: event.all_day,
            location: event.location,
            notes: event.notes,
            cancelled: event.cancelled,
            unit_note: needNote || null,
          },
        });
        d=addDays(d,1);
      }
    });
    (meetings.data||[]).forEach((meeting)=>{
      const participantCount=(meeting.meeting_participants||[]).length;
      const scopeLabel=meeting.scope==="project"?"Project":meeting.scope==="unit"?"Unit":"Organisation";
      const providerLabel=meeting.provider==="zoom"?"Zoom":"External";
      out.push({
        id:`meeting-${meeting.id}`,
        type:"meetings",
        date:accraDateKey(meeting.starts_at),
        title:meeting.title,
        meetingId:meeting.id,
        meetingStatus:meeting.status,
        meta:`${scopeLabel} meeting · ${participantCount} participant${participantCount===1?"":"s"} · ${providerLabel}`,
      });
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

  return <div className="body manager-calendar">
    <div style={{paddingTop:26}}><div className="eyebrow">{me.unit_name}</div><h1 className="h1" style={{marginTop:6}}>Calendar</h1><p className="screen-note">Meetings, project dates, task deadlines, approved leave and ministry activity in one place.</p></div>
    <button className="btn wide-auto manager-calendar-create" onClick={()=>scheduleMeeting?.({ scope:"unit", unitId:me.unit_id, unitName:me.unit_name })}>Schedule meeting</button>
    {error&&<ProductNotice tone="error" title="Could not load the calendar">{error}</ProductNotice>}
    <div className="manager-calendar-toolbar">
      <div className="calendar-view-toggle" role="group" aria-label="Calendar view">
        <button className={view==="month"?"on":""} onClick={()=>setView("month")}>Month</button>
        <button className={view==="week"?"on":""} onClick={()=>setView("week")}>Week</button>
      </div>
      <button className="calendar-filter-trigger" onClick={()=>setFilterSheet(true)}>
        <span>View</span><strong>{FILTERS.find(([key])=>key===filter)?.[1]||"All"}</strong><b aria-hidden="true">⌄</b>
      </button>
    </div>
    <div className="manager-calendar-period"><button aria-label="Previous period" onClick={()=>move(-1)}>←</button><strong>{heading}</strong><button aria-label="Next period" onClick={()=>move(1)}>→</button></div>
    {loading?<LoadingState label="Loading calendar…" />:<div className={`manager-calendar-grid manager-calendar-${view}`}>
      {days.map(d=>{const key=dateKey(d); const dayEvents=visible.filter(e=>e.date===key); const muted=view==="month"&&d.getMonth()!==cursor.getMonth(); return <div key={key} className={`manager-calendar-day ${dayEvents.length?"has-events":"is-empty"} ${muted?"is-muted":""}`}>
        <div className="manager-calendar-date">{d.toLocaleDateString("en-GB",{weekday:"short",day:"numeric"})}</div>
        <div className="manager-calendar-events">{dayEvents.map(e=><button className={`manager-calendar-event ${e.type==="meetings"?"is-meeting":""} ${e.meetingStatus==="cancelled"?"is-cancelled":""}`} key={e.id} onClick={()=>e.itemId?openItem(e.itemId):e.meetingId?openMeeting?.(e.meetingId):e.projectId?openProject(e.projectId):e.leave?setSelectedLeave(e.leave):e.activity?setSelectedActivity(e.activity):null}><span>{e.title}</span>{e.type==="meetings"&&e.meta&&<small>{e.meta}</small>}</button>)}</div>
      </div>})}
    </div>}
    {!loading&&visible.length===0&&<div className="card small manager-calendar-empty">No events are recorded for this view and period.</div>}
    {filterSheet&&<Sheet onClose={()=>setFilterSheet(false)}>
      <div className="eyebrow">Calendar view</div>
      <div className="h2" style={{marginTop:5}}>Show on calendar</div>
      <p className="screen-note">Choose one layer. Your Month or Week setting stays unchanged.</p>
      <div className="calendar-filter-sheet">
        {FILTERS.map(([key,label])=><button key={key} className={filter===key?"on":""} onClick={()=>{setFilter(key);setFilterSheet(false);}}>
          <span>{label}</span><b>{filter===key?"✓":""}</b>
        </button>)}
      </div>
    </Sheet>}
    {selectedLeave&&<Sheet onClose={()=>setSelectedLeave(null)}>
      <div className="eyebrow">Approved leave</div>
      <div className="h2" style={{marginTop:5}}>{selectedLeave.full_name}</div>
      <div className="card" style={{marginTop:14}}>
        <div className="row-t">{selectedLeave.kind} leave</div>
        <div className="row-m">{selectedLeave.start_date} → {selectedLeave.end_date}</div>
        <div className="row-note">Status: approved</div>
      </div>
      <button className="btn btn-ghost" style={{marginTop:12}} onClick={()=>{ const personId=selectedLeave.profile_id; setSelectedLeave(null); openPerson(personId,"current"); }}>Open team member</button>
      <button className="btn btn-ghost" style={{marginTop:8}} onClick={()=>setSelectedLeave(null)}>Close</button>
    </Sheet>}
    {selectedActivity&&<Sheet onClose={()=>setSelectedActivity(null)}>
      <div className="eyebrow">{selectedActivity.kind.replaceAll("_"," ")} · {selectedActivity.scope==="church"?"Church-wide":"Unit activity"}</div>
      <div className="h2" style={{marginTop:5}}>{selectedActivity.title}</div>
      {selectedActivity.cancelled&&<div className="flag flag-brick"><h4>Cancelled</h4>This event remains on the calendar because teams may already have planned around it.</div>}
      <div className="card" style={{marginTop:14}}>
        <div className="row-m">{selectedActivity.all_day?"All day":new Date(selectedActivity.starts_at).toLocaleString("en-GB",{timeZone:"Africa/Accra",day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}{selectedActivity.ends_at&&!selectedActivity.all_day?` → ${new Date(selectedActivity.ends_at).toLocaleString("en-GB",{timeZone:"Africa/Accra",day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}`:""}</div>
        {selectedActivity.location&&<div className="row-note">Location: {selectedActivity.location}</div>}
        {selectedActivity.unit_note&&<div className="row-note"><b>Your unit:</b> {selectedActivity.unit_note}</div>}
        {selectedActivity.notes&&<div className="row-note">{selectedActivity.notes}</div>}
      </div>
      <button className="btn btn-ghost" style={{marginTop:12}} onClick={()=>setSelectedActivity(null)}>Close</button>
    </Sheet>}
  </div>;
}
