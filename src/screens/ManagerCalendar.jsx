import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { Sheet } from "../components/bits";

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

export default function ManagerCalendar({ me, openItem, openProject, openMeeting, openPerson }) {
  const [view,setView]=useState("month");
  const [filter,setFilter]=useState("all");
  const [cursor,setCursor]=useState(new Date());
  const [events,setEvents]=useState([]);
  const [selectedActivity,setSelectedActivity]=useState(null);
  const [selectedLeave,setSelectedLeave]=useState(null);
  const [meetingSheet,setMeetingSheet]=useState(false);
  const [meetingForm,setMeetingForm]=useState({ title:"", starts_at:"", ends_at:"", join_url:"", agenda:"" });
  const [savingMeeting,setSavingMeeting]=useState(false);
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
      supabase.from("meeting_sessions").select("id,title,scope,unit_id,project_id,starts_at,ends_at,status,provider,join_url").order("starts_at")
    ]);
    const firstError=[projects.error,work.error,members.error,leave.error,ministry.error,ministryNeeds.error,meetings.error].find(Boolean);
    if(firstError){ setError(firstError.message); setLoading(false); return; }
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
      out.push({
        id:`meeting-${meeting.id}`,
        type:"meetings",
        date:accraDateKey(meeting.starts_at),
        title:`${meeting.status==="cancelled"?"Cancelled · ":""}${meeting.title}`,
        meetingId:meeting.id,
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

  async function saveMeeting(){
    if(!meetingForm.title.trim() || !meetingForm.starts_at) return;
    setSavingMeeting(true); setError(null);
    try{
      const result=await supabase.from("meeting_sessions").insert({
        org_id:me.org_id,
        scope:"unit",
        unit_id:me.unit_id,
        title:meetingForm.title.trim(),
        agenda:meetingForm.agenda.trim()||null,
        starts_at:new Date(meetingForm.starts_at).toISOString(),
        ends_at:meetingForm.ends_at?new Date(meetingForm.ends_at).toISOString():null,
        provider:"zoom",
        join_url:meetingForm.join_url.trim()||null,
        created_by:me.id,
      }).select("id").single();
      if(result.error) throw result.error;
      setMeetingSheet(false);
      setMeetingForm({ title:"", starts_at:"", ends_at:"", join_url:"", agenda:"" });
      await load();
      openMeeting?.(result.data.id);
    }catch(err){ setError(err.message||"Meeting could not be scheduled."); }
    finally{ setSavingMeeting(false); }
  }

  return <div className="body manager-calendar">
    <div style={{paddingTop:26}}><div className="eyebrow">{me.unit_name}</div><h1 className="h1" style={{marginTop:6}}>Calendar</h1><p className="screen-note">Meetings, project dates, task deadlines, approved leave and ministry activity in one place.</p></div>
    <button className="btn wide-auto manager-calendar-create" onClick={()=>setMeetingSheet(true)}>Schedule meeting</button>
    {error&&<div className="flag flag-brick"><h4>Could not load the calendar</h4>{error}</div>}
    <div className="manager-calendar-controls">
      <button className={"btn btn-sm "+(view==="month"?"":"btn-ghost")} onClick={()=>setView("month")}>Month</button>
      <button className={"btn btn-sm "+(view==="week"?"":"btn-ghost")} onClick={()=>setView("week")}>Week</button>
      {FILTERS.map(([k,l])=><button key={k} className={"btn btn-ghost btn-sm "+(filter===k?"on":"")} onClick={()=>setFilter(k)}>{l}</button>)}
    </div>
    <div className="manager-calendar-period"><button aria-label="Previous period" onClick={()=>move(-1)}>←</button><strong>{heading}</strong><button aria-label="Next period" onClick={()=>move(1)}>→</button></div>
    {loading?<div className="spin">Loading calendar...</div>:<div className={`manager-calendar-grid manager-calendar-${view}`}>
      {days.map(d=>{const key=dateKey(d); const dayEvents=visible.filter(e=>e.date===key); const muted=view==="month"&&d.getMonth()!==cursor.getMonth(); return <div key={key} className={`manager-calendar-day ${dayEvents.length?"has-events":"is-empty"} ${muted?"is-muted":""}`}>
        <div className="manager-calendar-date">{d.toLocaleDateString("en-GB",{weekday:"short",day:"numeric"})}</div>
        <div className="manager-calendar-events">{dayEvents.map(e=><button className="manager-calendar-event" key={e.id} onClick={()=>e.itemId?openItem(e.itemId):e.meetingId?openMeeting?.(e.meetingId):e.projectId?openProject(e.projectId):e.leave?setSelectedLeave(e.leave):e.activity?setSelectedActivity(e.activity):null}>{e.title}</button>)}</div>
      </div>})}
    </div>}
    {!loading&&visible.length===0&&<div className="card small manager-calendar-empty">No events are recorded for this view and period.</div>}
    {meetingSheet&&<Sheet onClose={()=>setMeetingSheet(false)}>
      <div className="eyebrow">Unit meeting</div>
      <div className="h2" style={{marginTop:5}}>Schedule meeting</div>
      <p className="screen-note">CEAC keeps the agenda, notes, decisions and resulting work. Zoom remains the video provider.</p>
      <input className="field" placeholder="Meeting title" value={meetingForm.title} onChange={(e)=>setMeetingForm(v=>({...v,title:e.target.value}))}/>
      <label className="small">Starts<input className="field" type="datetime-local" value={meetingForm.starts_at} onChange={(e)=>setMeetingForm(v=>({...v,starts_at:e.target.value}))}/></label>
      <label className="small">Ends (optional)<input className="field" type="datetime-local" value={meetingForm.ends_at} onChange={(e)=>setMeetingForm(v=>({...v,ends_at:e.target.value}))}/></label>
      <input className="field" type="url" placeholder="Zoom join link (optional)" value={meetingForm.join_url} onChange={(e)=>setMeetingForm(v=>({...v,join_url:e.target.value}))}/>
      <textarea className="field" rows={4} placeholder="Agenda (optional)" value={meetingForm.agenda} onChange={(e)=>setMeetingForm(v=>({...v,agenda:e.target.value}))}/>
      <button className="btn" disabled={savingMeeting||!meetingForm.title.trim()||!meetingForm.starts_at} onClick={saveMeeting}>{savingMeeting?"Scheduling...":"Schedule meeting"}</button>
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
