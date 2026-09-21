import { useEffect, useState } from "react";
import { supabase, inviteByEmail } from "../lib/supabase";
import { dueLabel } from "../lib/time";
import { Sheet } from "../components/bits";

export default function AdminHome({ me, openItem, openMeeting, scheduleMeeting, openSettings, openUnits }) {
  const [units, setUnits] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [blockers, setBlockers] = useState([]);
  const [leaveQueue, setLeaveQueue] = useState([]);
  const [mine, setMine] = useState([]);
  const [office, setOffice] = useState(null);
  const [today, setToday] = useState({ working: 0, leave: 0, notStarted: 0, headcount: 0 });
  const [delivery, setDelivery] = useState({ active: 0, closedThisMonth: 0, onTrack: 0, objectives: 0 });
  const [reporting, setReporting] = useState(null);
  const [watch, setWatch] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [inviting, setInviting] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => { load(); }, []);

  async function must(query, label) {
    const result = await query;
    if (result.error) throw new Error(`${label}: ${result.error.message}`);
    return result.data;
  }

  async function load() {
    setLoadError(null);
    try {
      const now = Date.now();
      const weekAgo = new Date(now - 7 * 864e5).toISOString();
      const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0);
      const todayStr = new Date().toISOString().slice(0, 10);

      const [us, mgrs, done7, openAlerts, pi, al, bl, lq, my, o, staff, sessToday, sessWeek, away, projs, objs, period, subs, memberships, meetingRows] = await Promise.all([
        must(supabase.from("units").select("id,name").order("name"), "Units"),
        must(supabase.from("unit_memberships").select("unit_id,profile_id,profiles(id,full_name,email)").eq("role","manager"), "Unit heads"),
        must(supabase.from("completed_outputs").select("unit_id").gte("completed_at", weekAgo), "Completed outputs"),
        must(supabase.from("alerts").select("for_unit_id").is("acknowledged_at",null).is("resolved_at",null).not("for_unit_id","is",null), "Unit alerts"),
        must(supabase.from("pending_invitations").select("unit_id,email,full_name,invited_at,expires_at").is("resolved_at",null).gt("expires_at",new Date().toISOString()), "Pending invitations"),
        must(supabase.from("alerts")
          .select("id,kind,subject_id,subject_type,message,first_seen_at,for_unit_id,for_profile_id")
          .is("acknowledged_at",null).is("resolved_at",null)
          .or("for_profile_id.eq."+me.id+",and(for_unit_id.is.null,for_profile_id.is.null)")
          .order("first_seen_at",{ascending:false}).limit(30), "Administration alerts"),
        must(supabase.from("blockers")
          .select("id,party_text,since,state,party_unit_id,work_items(id,title,unit_id),profiles(full_name),units(name)")
          .neq("state","resolved").limit(20), "Cross-unit blockers"),
        must(supabase.from("leave_requests")
          .select("id,kind,start_date,end_date,days,status,profiles(full_name)")
          .in("status",["pending","escalated"]).order("requested_at",{ascending:false}).limit(20), "Leave queue"),
        must(supabase.from("work_items")
          .select("id,ref,title,status,due_at").eq("assignee_id",me.id)
          .not("status","in","(completed,self_certified,cancelled)"), "Administration work"),
        must(supabase.from("office_locations").select("id").eq("is_primary",true).limit(1).maybeSingle(), "Office location"),
        must(supabase.from("profiles").select("id,full_name").eq("active",true), "Active people"),
        must(supabase.from("work_sessions").select("profile_id,ended_at,started_at").gte("started_at",dayStart.toISOString()), "Today's sessions"),
        must(supabase.from("work_sessions").select("profile_id,started_at").gte("started_at",weekAgo), "Recent sessions"),
        must(supabase.from("leave_requests").select("profile_id").eq("status","approved").lte("start_date",todayStr).gte("end_date",todayStr), "Today's leave"),
        must(supabase.from("projects").select("id,name,status,lead_unit_id,ends_on,updated_at"), "Projects"),
        must(supabase.from("objectives").select("id,name,status,unit_id,project_id"), "Objectives"),
        must(supabase.from("report_periods").select("id,label").eq("status","open").order("starts_on",{ascending:false}).limit(1).maybeSingle(), "Open reporting period"),
        must(supabase.from("submissions").select("profile_id,submitted_at").gte("submitted_at",weekAgo), "Recent submissions"),
        must(supabase.from("unit_memberships").select("profile_id,unit_id"), "Memberships"),
        must(supabase.from("meeting_sessions")
          .select("id,title,scope,starts_at,ends_at,provider,status,units(name),projects(name)")
          .gte("starts_at",new Date().toISOString())
          .lte("starts_at",new Date(now + 14*864e5).toISOString())
          .neq("status","cancelled").order("starts_at").limit(6), "Upcoming meetings"),
      ]);

      const headByUnit = {};
      (mgrs || []).forEach((row) => { if (row.profiles) headByUnit[row.unit_id] = row.profiles; });
      const doneByUnit = {};
      (done7 || []).forEach((row) => { doneByUnit[row.unit_id] = (doneByUnit[row.unit_id] || 0) + 1; });
      const alertsByUnit = {};
      (openAlerts || []).forEach((row) => { alertsByUnit[row.for_unit_id] = (alertsByUnit[row.for_unit_id] || 0) + 1; });
      const pendByUnit = {};
      (pi || []).forEach((row) => { if (row.unit_id) pendByUnit[row.unit_id] = row; });
      setUnits((us || []).map((unit) => ({
        ...unit,
        head: headByUnit[unit.id] || null,
        pending: pendByUnit[unit.id] || null,
        done7: doneByUnit[unit.id] || 0,
        alerts: alertsByUnit[unit.id] || 0,
      })));

      setAlerts(al || []);
      setBlockers((bl || []).filter((blocker) => blocker.work_items && blocker.party_unit_id && blocker.work_items.unit_id !== blocker.party_unit_id));
      setLeaveQueue(lq || []);
      setMine(my || []);
      setOffice(o || null);

      const awayIds = new Set((away || []).map((row) => row.profile_id));
      const startedIds = new Set((sessToday || []).map((row) => row.profile_id));
      setToday({
        working: (sessToday || []).filter((row) => !row.ended_at).length,
        leave: awayIds.size,
        notStarted: (staff || []).filter((person) => !startedIds.has(person.id) && !awayIds.has(person.id)).length,
        headcount: (staff || []).length,
      });

      const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0);
      setDelivery({
        active: (projs || []).filter((project) => project.status === "active").length,
        closedThisMonth: (projs || []).filter((project) => project.status === "closed" && project.updated_at && new Date(project.updated_at) >= monthStart).length,
        onTrack: (objs || []).filter((objective) => objective.status === "on_track" || objective.status === "met").length,
        objectives: (objs || []).length,
      });

      if (period) {
        const submitted = await must(supabase.from("reports").select("unit_id").eq("period_id",period.id).in("status",["submitted","confirmed"]), "Submitted reports");
        const inIds = new Set((submitted || []).map((row) => row.unit_id));
        setReporting({
          label: period.label,
          total: (us || []).length,
          submitted: inIds.size,
          missing: (us || []).filter((unit) => !inIds.has(unit.id)),
        });
      } else setReporting(null);

      const lastSub = {};
      (subs || []).forEach((row) => {
        const at = new Date(row.submitted_at).getTime();
        if (!lastSub[row.profile_id] || at > lastSub[row.profile_id]) lastSub[row.profile_id] = at;
      });
      const memberOf = {};
      (memberships || []).forEach((membership) => {
        (memberOf[membership.unit_id] = memberOf[membership.unit_id] || []).push(membership.profile_id);
      });

      const rules = [];
      const eightDaysAgo = now - 8 * 864e5;
      (us || []).forEach((unit) => {
        const ids = memberOf[unit.id] || [];
        if (!ids.length) return;
        const latest = Math.max(...ids.map((id) => lastSub[id] || 0));
        if (latest < eightDaysAgo) rules.push({
          k: "u"+unit.id,
          who: unit.name,
          why: latest === 0 ? "nothing submitted in the last 7 days" : "no submission in "+Math.floor((now-latest)/864e5)+" days",
        });
      });

      (staff || []).forEach((person) => {
        const days = new Set((sessWeek || []).filter((row) => row.profile_id === person.id).map((row) => new Date(row.started_at).toDateString())).size;
        if (days >= 3 && !lastSub[person.id]) rules.push({
          k: "p"+person.id,
          who: person.full_name,
          why: "present on "+days+" days this week, nothing submitted",
        });
      });
      (objs || []).filter((objective) => objective.status === "at_risk").forEach((objective) => rules.push({
        k:"o"+objective.id, who:objective.name, why:"objective at risk",
      }));
      setWatch(rules.slice(0,12));
      setMeetings(meetingRows || []);
    } catch (error) {
      setLoadError(error.message || "Administration could not load.");
    }
  }

  async function sendInvite() {
    if (!inviting) return;
    setBusy(true); setMsg(null);
    try {
      await inviteByEmail({ email, fullName:name, unitId:inviting.id });
      setMsg("Invitation sent. New accounts begin as Staff. After they activate, open Units to assign the Unit Head role.");
      setName(""); setEmail("");
      await load();
    } catch (error) { setMsg(error.message); }
    finally { setBusy(false); }
  }

  async function decideLeave(request, decision) {
    setBusy(true); setMsg(null);
    try {
      const { error } = await supabase.from("leave_requests").update({
        status:decision, decided_by:me.id, decided_at:new Date().toISOString(),
      }).eq("id",request.id);
      if (error) throw error;
      await load();
    } catch (error) { setMsg(error.message || "The leave decision could not be saved."); }
    finally { setBusy(false); }
  }

  const withoutHead = units.filter((unit) => !unit.head).length;
  const adminDate = new Date().toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"});
  const adminAttention = alerts.length + leaveQueue.length + withoutHead + (reporting?.missing?.length || 0);

  return <div className="body admin-home">
    <section className="admin-command-surface">
      <div className="admin-command-context"><span>Administration &amp; HR</span><time>{adminDate}</time></div>
      <div className="eyebrow">Organisation operations</div>
      <h1 className="h1">Administration</h1>
      <p className="screen-note">Organisation-wide exceptions, staffing, reporting and administrative action — without pulling unit-level work into HR unnecessarily.</p>
      <div className="admin-command-stats" aria-label="Administration overview">
        <div><strong>{adminAttention}</strong><span>Need attention</span></div>
        <div><strong>{units.length}</strong><span>Units</span></div>
        <div><strong>{today.headcount}</strong><span>People on record</span></div>
      </div>
    </section>

    <section className="office-meeting-strip">
      <div className="office-meeting-strip-head">
        <div><span>Next 14 days</span><strong>Meetings</strong></div>
        <button className="btn btn-sm" onClick={() => scheduleMeeting?.({ scope:"organisation", organisation:true })}>Schedule</button>
      </div>
      {meetings.length === 0 ? <div className="office-meeting-empty">No organisation, unit or project meetings are currently visible here.</div>
        : meetings.slice(0,3).map((meeting) => <button className="office-meeting-row" key={meeting.id} onClick={() => openMeeting?.(meeting.id)}>
          <span><strong>{meeting.title}</strong><small>{new Date(meeting.starts_at).toLocaleString("en-GB",{timeZone:"Africa/Accra",weekday:"short",day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</small></span>
          <b aria-hidden="true">→</b>
        </button>)}
    </section>

    {loadError && <div className="flag flag-brick" style={{marginTop:14}}><h4>Administration could not finish loading</h4>{loadError}<button className="btn btn-ghost btn-sm" style={{marginTop:8}} onClick={load}>Try again</button></div>}
    {msg && !inviting && <div className="flag flag-amber" style={{marginTop:14}}>{msg}</div>}

    {!office && <div className="flag flag-amber" style={{marginTop:14}}>
      <h4>Set the office location</h4>
      Attendance cannot distinguish the office until its location is saved.
      <button className="btn btn-ghost btn-sm" style={{marginTop:8}} onClick={openSettings}>Open Settings</button>
    </div>}

    {withoutHead > 0 && <div className="flag flag-amber" style={{marginTop:14}}>
      <h4>{withoutHead} unit{withoutHead===1?"":"s"} without a head</h4>
      Invite the person if necessary, then open Units and assign an existing unit member as Unit Head.
      <button className="btn btn-ghost btn-sm" style={{marginTop:8}} onClick={openUnits}>Open Units</button>
    </div>}

    <div className="split" style={{marginTop:8}}>
      <div className="main-col">
        {leaveQueue.length>0 && <>
          <div className="sec"><span>Leave to review</span><span>{leaveQueue.length}</span></div>
          {leaveQueue.map((request)=><div key={request.id} className="row">
            <div className="row-t">{request.profiles?.full_name||"—"} — {request.days} day{request.days===1?"":"s"} {request.kind}</div>
            <div className="row-m">{request.start_date} → {request.end_date} · {request.status==="escalated"?"Sent up from a manager":"Waiting for review"}</div>
            <div style={{display:"flex",gap:7,marginTop:10}}>
              <button className="btn btn-ghost btn-sm" disabled={busy} onClick={()=>decideLeave(request,"declined")}>Decline</button>
              <button className="btn btn-sm" disabled={busy} onClick={()=>decideLeave(request,"approved")}>Approve</button>
            </div>
          </div>)}
        </>}

        <div className="sec"><span>Needs you</span><span>{alerts.length}</span></div>
        {alerts.length===0 && <div className="card small">Nothing needs Administration right now.</div>}
        {alerts.map((alert)=><button key={alert.id} className="row" onClick={()=>alert.subject_type==="work_item"&&alert.subject_id&&openItem(alert.subject_id)}>
          <div className="row-t">{alert.message}</div>
          <div className="row-m">Since {new Date(alert.first_seen_at).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}</div>
        </button>)}

        {reporting && <>
          <div className="sec"><span>Reporting</span><span>{reporting.label}</span></div>
          <div className="row"><div className="row-t">{reporting.submitted} of {reporting.total} units submitted</div>
            <div className="row-m">{reporting.missing.length ? "Missing: "+reporting.missing.map((unit)=>unit.name).join(", ") : "Everyone is in."}</div>
          </div>
        </>}

        <div className="sec"><span>The office today</span></div>
        <div className="metric-grid">
          <div className="metric"><b>{today.working}</b><span>working</span></div>
          <div className="metric"><b>{today.leave}</b><span>on leave</span></div>
          <div className="metric"><b>{today.notStarted}</b><span>not started</span></div>
          <div className="metric"><b>{today.headcount}</b><span>on the books</span></div>
        </div>

        <div className="sec"><span>Delivery</span></div>
        <div className="row">
          <div className="row-t">{delivery.active} project{delivery.active===1?"":"s"} active · {delivery.closedThisMonth} closed this month</div>
          <div className="row-m">{delivery.onTrack} of {delivery.objectives} objectives on track</div>
        </div>

        {watch.length>0 && <>
          <div className="sec"><span>Watch</span><span>{watch.length}</span></div>
          <p className="small" style={{marginBottom:6}}>Fixed factual rules. Each line says exactly why it appeared.</p>
          {watch.map((row)=><div key={row.k} className="row"><div className="row-t">{row.who}</div><div className="row-m">{row.why}</div></div>)}
        </>}

        {blockers.length>0 && <>
          <div className="sec"><span>Stuck between units</span><span>{blockers.length}</span></div>
          {blockers.map((blocker)=><button key={blocker.id} className="row" onClick={()=>blocker.work_items&&openItem(blocker.work_items.id)}>
            <div className="row-t">{blocker.work_items?.title||"—"}</div>
            <div className="row-m">{blocker.profiles?.full_name||""} waiting on {blocker.units?.name||blocker.party_text}</div>
          </button>)}
        </>}

        {mine.length>0 && <>
          <div className="sec"><span>Your own work</span><span>{mine.length}</span></div>
          {mine.map((item)=><button key={item.id} className="row" onClick={()=>openItem(item.id)}>
            <div className="row-t">{item.title}</div><div className="row-m">{item.ref} · {dueLabel(item.due_at)}</div>
          </button>)}
        </>}
      </div>

      <div className="side-col">
        <div className="sec"><span>All units</span><span>{units.length}</span></div>
        {units.map((unit)=><div key={unit.id} className="row">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",gap:10}}>
            <div className="row-t">{unit.name}</div>{unit.alerts>0&&<span className="pill p-amber">{unit.alerts}</span>}
          </div>
          {unit.head
            ? <div className="row-m">{unit.head.full_name} · {unit.head.email}</div>
            : unit.pending
              ? <div className="row-m" style={{color:"var(--amber)"}}>Staff invitation sent to {unit.pending.email}. Assign Unit Head after activation.</div>
              : <><div className="row-m" style={{color:"var(--brick)"}}>No Unit Head</div>
                <button className="btn btn-ghost btn-sm" style={{marginTop:8}} onClick={()=>{setInviting(unit);setMsg(null);}}>Invite prospective head</button></>}
          <div className="row-m" style={{marginTop:4}}>{unit.done7} finished outputs this week
            <button className="btn btn-ghost btn-sm" style={{marginLeft:8}} onClick={openUnits}>Open unit</button>
          </div>
        </div>)}
      </div>
    </div>

    {inviting && <Sheet onClose={()=>{setInviting(null);setMsg(null);}}>
      <div className="h2">Invite someone to {inviting.name}</div>
      <p className="screen-note">For security, every invited account begins as Staff. After they activate, Administration assigns Unit Head authority from the Units screen.</p>
      <input className="field" placeholder="Their full name" value={name} onChange={(event)=>setName(event.target.value)} />
      <input className="field" placeholder="Their work email" type="email" autoCapitalize="none" value={email} onChange={(event)=>setEmail(event.target.value)} />
      {msg&&<div className="flag flag-amber" style={{marginTop:12}}>{msg}</div>}
      <button className="btn" style={{marginTop:14}} onClick={sendInvite} disabled={busy||!name.trim()||!email.trim()}>{busy?"Sending...":"Send Staff invitation"}</button>
    </Sheet>}
  </div>;
}
