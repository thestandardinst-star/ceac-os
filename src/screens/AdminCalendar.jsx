import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { EmptyState, LoadingState, ProductNotice, SectionHeader } from "../components/bits";
import { humanError } from "../lib/productLanguage";

function dateKey(value){
  const parts=new Intl.DateTimeFormat("en-CA",{timeZone:"Africa/Accra",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date(value));
  const by=Object.fromEntries(parts.map((part)=>[part.type,part.value]));
  return `${by.year}-${by.month}-${by.day}`;
}
function labelDate(value){return new Date(value).toLocaleString("en-GB",{timeZone:"Africa/Accra",weekday:"short",day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"});}

export default function AdminCalendar({ me, openMeeting, scheduleMeeting }) {
  const [events,setEvents]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(null);
  const [windowDays,setWindowDays]=useState(30);

  useEffect(()=>{load();},[me.org_id]);

  async function load(){
    setLoading(true); setError(null);
    try{
      const now=new Date();
      const end=new Date(now.getTime()+90*864e5);
      const [meetings,projects,ministry,leave]=await Promise.all([
        supabase.from("meeting_sessions").select("id,title,starts_at,ends_at,status,scope,provider").gte("starts_at",now.toISOString()).lte("starts_at",end.toISOString()).neq("status","cancelled"),
        supabase.from("projects").select("id,name,starts_on,ends_on,status").eq("org_id",me.org_id),
        supabase.from("ministry_events").select("id,title,starts_at,ends_at,location,cancelled").gte("starts_at",now.toISOString()).lte("starts_at",end.toISOString()),
        supabase.from("leave_requests").select("id,profile_id,start_date,end_date,status,profiles(full_name)").eq("status","approved").gte("end_date",now.toISOString().slice(0,10)).lte("start_date",end.toISOString().slice(0,10)),
      ]);
      const failed=[meetings,projects,ministry,leave].find((row)=>row.error);
      if(failed) throw failed.error;
      const rows=[];
      (meetings.data||[]).forEach((meeting)=>rows.push({id:"m-"+meeting.id,type:"Meeting",at:meeting.starts_at,title:meeting.title,meta:`${meeting.scope} · ${meeting.provider}`,meetingId:meeting.id}));
      (ministry.data||[]).filter((event)=>!event.cancelled).forEach((event)=>rows.push({id:"e-"+event.id,type:"Ministry activity",at:event.starts_at,title:event.title,meta:event.location||"Location not recorded"}));
      (projects.data||[]).forEach((project)=>{
        if(project.starts_on&&new Date(project.starts_on)>=now) rows.push({id:"ps-"+project.id,type:"Project",at:project.starts_on+"T00:00:00Z",title:project.name+" starts",meta:project.status});
        if(project.ends_on&&new Date(project.ends_on)>=now) rows.push({id:"pe-"+project.id,type:"Project",at:project.ends_on+"T00:00:00Z",title:project.name+" ends",meta:project.status});
      });
      (leave.data||[]).forEach((request)=>rows.push({id:"l-"+request.id,type:"Approved leave",at:request.start_date+"T00:00:00Z",title:request.profiles?.full_name||"CEAC member",meta:`${request.start_date} → ${request.end_date}`}));
      setEvents(rows.sort((a,b)=>new Date(a.at)-new Date(b.at)));
    }catch(err){setError(humanError(err,"Organisation calendar could not be loaded."));}
    finally{setLoading(false);}
  }

  const visible=useMemo(()=>{
    const cutoff=Date.now()+windowDays*864e5;
    return events.filter((event)=>new Date(event.at).getTime()<=cutoff);
  },[events,windowDays]);
  const grouped=useMemo(()=>{
    const map={};
    visible.forEach((event)=>{const key=dateKey(event.at);(map[key]=map[key]||[]).push(event);});
    return Object.entries(map);
  },[visible]);

  if(loading)return <div className="body"><LoadingState label="Loading organisation calendar…" /></div>;

  return <div className="body admin-calendar">
    <div className="office-page-intro admin-page-title-row">
      <div><div className="eyebrow">Organisation schedule</div><h1 className="h1">Calendar</h1><p className="screen-note">Upcoming meetings, ministry activities, project dates and approved leave in one chronological operating view.</p></div>
      <button className="btn btn-sm" onClick={()=>scheduleMeeting?.({scope:"organisation",organisation:true})}>Schedule meeting</button>
    </div>
    {error&&<ProductNotice tone="error" title="Calendar could not finish loading" action={<button className="btn btn-ghost btn-sm" onClick={load}>Try again</button>}>{error}</ProductNotice>}
    <div className="calendar-window-switch" role="group" aria-label="Calendar range">
      {[14,30,90].map((days)=><button key={days} className={windowDays===days?"on":""} onClick={()=>setWindowDays(days)}>Next {days} days</button>)}
    </div>
    <SectionHeader eyebrow="Upcoming" title="Organisation timeline" count={visible.length} />
    {visible.length===0&&<EmptyState title="Nothing upcoming in this range">Meetings, project dates, ministry activities and approved leave will appear here.</EmptyState>}
    <div className="admin-calendar-timeline">
      {grouped.map(([day,rows])=><section key={day} className="admin-calendar-day">
        <time>{new Date(day+"T00:00:00Z").toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"})}</time>
        <div>{rows.map((event)=><button key={event.id} className="admin-calendar-event" onClick={()=>event.meetingId&&openMeeting?.(event.meetingId)}>
          <span className="admin-calendar-event-type">{event.type}</span>
          <strong>{event.title}</strong>
          <small>{event.type==="Meeting"?labelDate(event.at):event.meta}</small>
        </button>)}</div>
      </section>)}
    </div>
  </div>;
}
