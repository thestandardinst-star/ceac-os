import { PremiumIcon } from "./PremiumShell";

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
        <span className={"reference-schedule-icon tone-"+(index%4)}><PremiumIcon name={item.kind==="Meeting"?"calendar":"projects"} size={15}/></span>
        <div><strong>{item.title}</strong><small>{new Date(item.when).toLocaleString("en-GB",{timeZone:"Africa/Accra",weekday:"short",day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</small></div>
      </div>) : <div className="reference-empty">Nothing recorded for the next few days.</div>}
      {leave.slice(0,2).map((item,index)=><div className="reference-schedule-row" key={"leave-"+item.id}>
        <span className={"reference-schedule-icon tone-"+((index+2)%4)}><PremiumIcon name="time" size={15}/></span>
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
        <span className={"reference-module-icon tone-"+(index%5)}><PremiumIcon name={item.icon||"work"} size={20}/></span>
        <span><strong>{item.label}</strong><small>{item.note||"Open workspace"}</small></span>
        <b>→</b>
      </button>)}
    </div>
  </section>;
}
