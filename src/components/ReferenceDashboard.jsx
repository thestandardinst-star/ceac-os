import Icon from "./primitives/Icon";

function monthMatrix(date) {
  const year=date.getFullYear();
  const month=date.getMonth();
  const first=new Date(year,month,1);
  const days=new Date(year,month+1,0).getDate();
  const mondayOffset=(first.getDay()+6)%7;
  const cells=[];
  for(let i=0;i<mondayOffset;i++) cells.push(null);
  for(let d=1;d<=days;d++) cells.push(d);
  while(cells.length%7) cells.push(null);
  return {year,month,cells};
}

function dateKey(value){
  if(!value) return "";
  const d=new Date(value);
  return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");
}

export function DashboardCalendar({ meetings=[], events=[], leave=[] }) {
  const now=new Date();
  const {year,month,cells}=monthMatrix(now);
  const activeKeys=new Set([
    ...meetings.map(row=>dateKey(row.starts_at)),
    ...events.map(row=>dateKey(row.starts_at)),
    ...leave.map(row=>String(row.start_date||"")),
  ]);
  const today=now.getDate();
  const monthLabel=new Intl.DateTimeFormat("en-GB",{month:"long",year:"numeric"}).format(now);
  const schedule=[
    ...meetings.map(row=>({id:"m-"+row.id,title:row.title,when:row.starts_at,kind:"Meeting"})),
    ...events.map(row=>({id:"e-"+row.id,title:row.title,when:row.starts_at,kind:row.kind||"Event"})),
  ].sort((a,b)=>new Date(a.when)-new Date(b.when)).slice(0,4);

  return <aside className="reference-rail" aria-label="Calendar and upcoming schedule">
    <section className="reference-calendar-card">
      <div className="reference-calendar-head"><strong>{monthLabel}</strong><span>Today</span></div>
      <div className="reference-calendar-week">{["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(day=><small key={day}>{day}</small>)}</div>
      <div className="reference-calendar-grid">
        {cells.map((day,index)=>{
          const key=day ? [year,String(month+1).padStart(2,"0"),String(day).padStart(2,"0")].join("-") : "";
          return <span key={index} className={(day===today?"today ":"")+(activeKeys.has(key)?"has-event":"")}>{day||""}</span>;
        })}
      </div>
    </section>
    <section className="reference-schedule-card">
      <div className="reference-card-head"><strong>Later this week</strong><small>{schedule.length?"Upcoming":"Clear"}</small></div>
      {schedule.length ? schedule.map((item,index)=><div className="reference-schedule-row" key={item.id}>
        <span className={"reference-schedule-icon tone-"+(index%4)}><Icon className="premium-icon" name={item.kind==="Meeting"?"calendar":"projects"} size={15}/></span>
        <div><strong>{item.title}</strong><small>{new Date(item.when).toLocaleString("en-GB",{timeZone:"Africa/Accra",weekday:"short",day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</small></div>
      </div>) : <div className="reference-empty">Nothing recorded for the next few days.</div>}
      {leave.slice(0,2).map((item,index)=><div className="reference-schedule-row" key={"leave-"+item.id}>
        <span className={"reference-schedule-icon tone-"+((index+2)%4)}><Icon className="premium-icon" name="time" size={15}/></span>
        <div><strong>{item.kind||"Leave"}</strong><small>{item.start_date} → {item.end_date}</small></div>
      </div>)}
    </section>
  </aside>;
}

export function ReferenceModuleStrip({ items=[] }) {
  if(!items.length) return null;
  return <section className="reference-module-strip">
    <div className="reference-strip-head"><div><strong>Explore CEAC OS</strong><small>Everything you need in one place.</small></div></div>
    <div className="reference-module-grid">
      {items.map((item,index)=><button key={item.label} onClick={item.onClick}>
        <span className={"reference-module-icon tone-"+(index%5)}><Icon className="premium-icon" name={item.icon||"work"} size={20}/></span>
        <span><strong>{item.label}</strong><small>{item.note||"Open workspace"}</small></span>
        <b>→</b>
      </button>)}
    </div>
  </section>;
}


export function ReferenceFocus({ item, meeting, onOpenItem, onOpenMeeting, dueText }) {
  return <section className="reference-focus-grid">
    <article className="reference-focus-card">
      <div className="reference-focus-art" aria-hidden="true"><span>Next up</span></div>
      <div className="reference-focus-copy">
        <small>Next up</small>
        <strong>{item?.title || "Your next CEAC work"}</strong>
        <span>{item?.ref || "No urgent work is recorded right now."}</span>
        {item && <div className="reference-focus-progress"><i/><i/><i/></div>}
        <div className="reference-focus-meta">{item ? (dueText || "Open your work record") : "You are clear for the moment."}</div>
      </div>
      {item && <button onClick={()=>onOpenItem?.(item.id)}>Continue work <b>→</b></button>}
    </article>
    <article className="reference-today-card">
      <div className="reference-card-head"><strong>Today's schedule</strong><small>{meeting ? "Next" : "Clear"}</small></div>
      {meeting ? <button className="reference-today-row" onClick={()=>onOpenMeeting?.(meeting.id)}>
        <span className="reference-schedule-icon tone-2"><Icon className="premium-icon" name="calendar" size={15}/></span>
        <span><strong>{meeting.title}</strong><small>{new Date(meeting.starts_at).toLocaleString("en-GB",{timeZone:"Africa/Accra",hour:"2-digit",minute:"2-digit"})}{meeting.provider ? " · "+meeting.provider.replaceAll("_"," ") : ""}</small></span>
        <b>Join</b>
      </button> : <div className="reference-empty">No upcoming meeting is recorded.</div>}
    </article>
  </section>;
}


export function ReferenceFocusPanel({ item=null, meetings=[], openItem, openMeeting }) {
  const schedule=(meetings||[]).slice(0,4);
  const due=item?.due_at ? new Date(item.due_at).toLocaleString("en-GB",{timeZone:"Africa/Accra",weekday:"short",day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}) : "No due date";
  const statusLabel=(item?.status||"not_started").replaceAll("_"," ");
  const progress=item?.status==="completed"||item?.status==="self_certified" ? 100
    : item?.status==="in_review" ? 84
      : item?.status==="in_progress" ? 58
        : item?.status==="returned" ? 42
          : item?.status==="waiting_on" ? 36 : 18;
  return <section className="reference-focus-row" aria-label="Next work and today's schedule">
    <article className="reference-focus-card">
      <div className="reference-focus-media" aria-hidden="true">
        <Icon className="premium-icon" name="work" size={28}/>
        <span>CEAC</span>
      </div>
      <div className="reference-focus-main">
        <div className="reference-focus-label">Next up</div>
        <h2>{item?.title || "Your next CEAC work"}</h2>
        <p>{item ? (item.ref ? item.ref+" · "+due : due) : "Nothing urgent is assigned right now."}</p>
        <div className="reference-focus-progress"><span style={{width:progress+"%"}}/></div>
        <small>{item ? statusLabel : "Clear"}</small>
      </div>
      <div className="reference-focus-actions">
        {item ? <button onClick={()=>openItem?.(item.id)}>Continue work <b>→</b></button> : <span>You're clear</span>}
      </div>
    </article>
    <article className="reference-today-card">
      <div className="reference-card-head"><strong>Today's schedule</strong><small>{schedule.length ? schedule.length+" items" : "Clear"}</small></div>
      {schedule.length ? schedule.map((meeting,index)=><button key={meeting.id} onClick={()=>openMeeting?.(meeting.id)} className="reference-today-row">
        <time>{new Date(meeting.starts_at).toLocaleTimeString("en-GB",{timeZone:"Africa/Accra",hour:"2-digit",minute:"2-digit"})}</time>
        <span className={"reference-schedule-icon tone-"+(index%4)}><Icon className="premium-icon" name="calendar" size={14}/></span>
        <span><strong>{meeting.title}</strong><small>{meeting.provider==="zoom"?"Zoom":meeting.provider==="google_meet"?"Google Meet":"Meeting"}</small></span>
      </button>) : <div className="reference-empty">No meetings recorded today.</div>}
    </article>
  </section>;
}
