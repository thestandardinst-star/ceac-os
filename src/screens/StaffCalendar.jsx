import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { LoadingState, ProductNotice } from "../components/bits";
import { humanError } from "../lib/productLanguage";
import {
  CalendarAgenda,
  CalendarFilters,
  CalendarMonthGrid,
  CalendarPageHeader,
  CalendarPeriodControls,
} from "../experience-v2/calendar/CalendarFamilyV2";

const pad=(v)=>String(v).padStart(2,"0");
const dayKey=(d)=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x;};
const startOfWeek=(d)=>{const x=new Date(d.getFullYear(),d.getMonth(),d.getDate());x.setDate(x.getDate()-((x.getDay()+6)%7));return x;};
const accraDay=(value)=>{const parts=new Intl.DateTimeFormat("en-CA",{timeZone:"Africa/Accra",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date(value));const map=Object.fromEntries(parts.map(p=>[p.type,p.value]));return `${map.year}-${map.month}-${map.day}`;};
const labelDay=(key)=>new Date(`${key}T12:00:00`).toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"});

const FILTER_ITEMS = [
  { value:"all", label:"All", icon:"calendar" },
  { value:"meeting", label:"Meetings", icon:"meeting" },
  { value:"work", label:"Work", icon:"work" },
  { value:"ministry", label:"Ministry", icon:"ministry" },
  { value:"leave", label:"Leave", icon:"time" },
];

export default function StaffCalendar({me,openItem,openMeeting}){
  const today=new Date();
  const [cursor,setCursor]=useState(today);
  const [selectedDate,setSelectedDate]=useState(dayKey(today));
  const [events,setEvents]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(null);
  const [filter,setFilter]=useState("all");

  useEffect(()=>{load();},[me.id,me.unit_id,cursor.getFullYear(),cursor.getMonth()]);

  async function load(){
    setLoading(true);setError(null);
    try{
      const from=new Date(cursor.getFullYear(),cursor.getMonth()-1,1).toISOString();
      const to=new Date(cursor.getFullYear(),cursor.getMonth()+2,1).toISOString();
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
    }catch(err){setError(humanError(err,"Your calendar could not be loaded."));setEvents([]);}
    finally{setLoading(false);}
  }

  const first=new Date(cursor.getFullYear(),cursor.getMonth(),1);
  const gridStart=startOfWeek(first);
  const days=useMemo(()=>Array.from({length:42},(_,i)=>addDays(gridStart,i)),[cursor.getFullYear(),cursor.getMonth()]);
  const visible=filter==="all"?events:events.filter(e=>e.kind===filter);

  const open=(event)=>event.itemId?openItem?.(event.itemId):event.meetingId?openMeeting?.(event.meetingId):null;
  const displayEvent=(event,includeDate=false)=>({
    ...event,
    icon:event.kind==="meeting"?"meeting":event.kind==="work"?"work":event.kind==="ministry"?"ministry":"time",
    meta:`${includeDate?new Date(`${event.date}T12:00:00`).toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short"})+" · ":""}${event.meta||""}`,
    status:event.kind==="leave"?"Approved":event.kind==="meeting"?"Meeting":event.kind==="work"?"Due":"Ministry",
    statusTone:event.kind==="leave"?"success":event.kind==="meeting"?"action":"neutral",
    onClick:event.itemId||event.meetingId?()=>open(event):undefined,
  });

  const selectedEvents=visible.filter(event=>event.date===selectedDate).map(event=>displayEvent(event));
  const upcoming=[...visible]
    .filter(event=>event.date>=dayKey(new Date()))
    .sort((a,b)=>a.date.localeCompare(b.date))
    .slice(0,10)
    .map(event=>displayEvent(event,true));

  const moveMonth=(amount)=>{
    const next=new Date(cursor.getFullYear(),cursor.getMonth()+amount,1);
    setCursor(next);
    setSelectedDate(dayKey(next));
  };
  const goToday=()=>{
    const now=new Date();
    setCursor(now);
    setSelectedDate(dayKey(now));
  };

  return <div className="body ev2cal-role-page ev2cal-staff-page">
    <CalendarPageHeader
      eyebrow="Your schedule"
      title="Calendar"
      description="Your deadlines, meetings, approved leave and ministry commitments in one place."
      status="Personal schedule"
      statusTone="action"
    />

    <CalendarFilters value={filter} onChange={setFilter} items={FILTER_ITEMS} ariaLabel="Calendar filters" />

    {error&&<ProductNotice tone="error" title="Could not load Calendar">{error}</ProductNotice>}

    {loading?<LoadingState label="Loading your calendar…"/>:<>
      <CalendarPeriodControls
        label={cursor.toLocaleDateString("en-GB",{month:"long",year:"numeric"})}
        onPrevious={()=>moveMonth(-1)}
        onNext={()=>moveMonth(1)}
        onToday={goToday}
      />

      <div className="ev2cal-role-layout">
        <CalendarMonthGrid
          days={days}
          currentMonth={cursor.getMonth()}
          selectedDateKey={selectedDate}
          onSelectDate={(key)=>setSelectedDate(key)}
          getEvents={(key)=>visible.filter(event=>event.date===key).map(event=>displayEvent(event))}
          ariaLabel="Personal month calendar"
        />

        <div className="ev2cal-side-stack">
          <CalendarAgenda
            title={labelDay(selectedDate)}
            description="Recorded items for the selected date. Work and meetings open their authoritative records; leave and ministry remain factual schedule context."
            events={selectedEvents}
          />
          <CalendarAgenda
            eyebrow="Next up"
            title="Coming up"
            description="The next recorded items in this filtered view."
            events={upcoming}
            emptyTitle="Nothing coming up"
            emptyDescription="Nothing is recorded in this view."
          />
        </div>
      </div>
    </>}
  </div>;
}
