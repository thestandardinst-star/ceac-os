import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Avatar, EmptyState, FieldGroup, LoadingState, Pill, ProductNotice, Sheet } from "../components/bits";
import { humanError } from "../lib/productLanguage";

const DAY_KEYS=["sun","mon","tue","wed","thu","fri","sat"];
const DAY_LABELS={sun:"Sun",mon:"Mon",tue:"Tue",wed:"Wed",thu:"Thu",fri:"Fri",sat:"Sat"};

function isoDay(value){ return new Date(value).toISOString().slice(0,10); }
function niceDay(value){ return new Date(value+"T00:00:00").toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short"}); }
function human(value=""){ return String(value).replaceAll("_"," ").replace(/\b\w/g,(m)=>m.toUpperCase()); }

export default function Workforce({ me }) {
  const caps=me.capabilities||[];
  const canManage=caps.includes("workforce.manage");
  const canCorrect=caps.includes("attendance.correct");
  const isManager=(me.managed_units||[]).length>0;
  const [tab,setTab]=useState("today");
  const [people,setPeople]=useState([]);
  const [sessions,setSessions]=useState([]);
  const [leave,setLeave]=useState([]);
  const [leaveEvents,setLeaveEvents]=useState([]);
  const [dayTypes,setDayTypes]=useState([]);
  const [schedules,setSchedules]=useState([]);
  const [corrections,setCorrections]=useState([]);
  const [policies,setPolicies]=useState([]);
  const [policyRules,setPolicyRules]=useState([]);
  const [office,setOffice]=useState(null);
  const [meetings,setMeetings]=useState([]);
  const [ministryEvents,setMinistryEvents]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(null);
  const [datasetErrors,setDatasetErrors]=useState({});
  const [notice,setNotice]=useState(null);
  const [busy,setBusy]=useState(false);

  const [scheduleSheet,setScheduleSheet]=useState(false);
  const [schedulePerson,setSchedulePerson]=useState("");
  const [scheduleDayType,setScheduleDayType]=useState("");
  const [scheduleDay,setScheduleDay]=useState("mon");
  const [scheduleFrom,setScheduleFrom]=useState(isoDay(new Date()));
  const [scheduleTo,setScheduleTo]=useState("");
  const [scheduleStart,setScheduleStart]=useState("");
  const [scheduleEnd,setScheduleEnd]=useState("");
  const [scheduleReason,setScheduleReason]=useState("");

  const [correctionSheet,setCorrectionSheet]=useState(false);
  const [correctionPerson,setCorrectionPerson]=useState("");
  const [correctionDate,setCorrectionDate]=useState(isoDay(new Date()));
  const [correctionType,setCorrectionType]=useState("context_note");
  const [correctionNote,setCorrectionNote]=useState("");
  const [correctionReason,setCorrectionReason]=useState("");

  const [dayTypeSheet,setDayTypeSheet]=useState(false);
  const [dayTypeName,setDayTypeName]=useState("");
  const [dayTypeDescription,setDayTypeDescription]=useState("");
  const [dayTypeExpected,setDayTypeExpected]=useState(true);

  const [policySheet,setPolicySheet]=useState(false);
  const [policyName,setPolicyName]=useState("");
  const [policyFrom,setPolicyFrom]=useState(isoDay(new Date()));
  const [policySource,setPolicySource]=useState("");
  const [policyReason,setPolicyReason]=useState("");
  const [policyKind,setPolicyKind]=useState("annual");
  const [policyEntitlement,setPolicyEntitlement]=useState("");
  const [policyRoute,setPolicyRoute]=useState("manager_then_admin");

  useEffect(()=>{ load(); },[me.id]);

  async function load(){
    setLoading(true); setError(null);
    const since=new Date(Date.now()-31*86400000).toISOString();
    const datasets=[
      ["people", supabase.from("employment_records").select("profile_id,unit_id,manager_profile_id,working_pattern,profiles!employment_records_profile_id_fkey(full_name,job_title,active),units(name)").eq("org_id",me.org_id).eq("employment_status","active")],
      ["sessions", supabase.from("work_sessions").select("id,profile_id,started_at,ended_at,place,end_reason,flags,lat,lng,ip").gte("started_at",since).order("started_at",{ascending:false})],
      ["leave", supabase.from("leave_requests").select("id,profile_id,kind,start_date,end_date,days,status,reason,requested_at,decided_by,decided_at,decision_note,profiles(full_name)").order("start_date",{ascending:false})],
      ["leave history", supabase.from("leave_request_events").select("*").order("created_at",{ascending:false})],
      ["day types", supabase.from("workforce_day_types").select("*").eq("active",true).order("name")],
      ["schedules", supabase.from("workforce_schedule_versions").select("*").order("created_at",{ascending:false})],
      ["corrections", supabase.from("attendance_corrections").select("*").order("created_at",{ascending:false})],
      ["leave policies", supabase.from("leave_policy_versions").select("*").order("created_at",{ascending:false})],
      ["leave policy rules", supabase.from("leave_policy_rules").select("*").order("leave_kind")],
      ["office location", supabase.from("office_locations").select("name,lat,lng,radius_meters").eq("is_primary",true).limit(1).maybeSingle()],
      ["meetings", supabase.from("meeting_sessions").select("id,title,starts_at,ends_at,status,scope,unit_id").gte("starts_at",new Date().toISOString()).lte("starts_at",new Date(Date.now()+7*86400000).toISOString()).neq("status","cancelled")],
      ["ministry events", supabase.from("ministry_events").select("id,title,starts_at,ends_at,location,cancelled,scope,unit_id").gte("starts_at",new Date().toISOString()).lte("starts_at",new Date(Date.now()+7*86400000).toISOString())],
    ];
    const results=await Promise.all(datasets.map(async ([name,query])=>({name,...await query})));
    const errors={};
    const byName=Object.fromEntries(results.map((row)=>[row.name,row]));
    for(const row of results){
      if(row.error) errors[row.name]=humanError(row.error, row.name+" could not load.");
    }

    if(!byName.people.error) setPeople((byName.people.data||[]).filter((row)=>row.profiles?.active!==false));
    if(!byName.sessions.error) setSessions(byName.sessions.data||[]);
    if(!byName.leave.error) setLeave(byName.leave.data||[]);
    if(!byName["leave history"].error) setLeaveEvents(byName["leave history"].data||[]);
    if(!byName["day types"].error) setDayTypes(byName["day types"].data||[]);
    if(!byName.schedules.error) setSchedules(byName.schedules.data||[]);
    if(!byName.corrections.error) setCorrections(byName.corrections.data||[]);
    if(!byName["leave policies"].error) setPolicies(byName["leave policies"].data||[]);
    if(!byName["leave policy rules"].error) setPolicyRules(byName["leave policy rules"].data||[]);
    if(!byName["office location"].error) setOffice(byName["office location"].data||null);
    if(!byName.meetings.error) setMeetings(byName.meetings.data||[]);
    if(!byName["ministry events"].error) setMinistryEvents((byName["ministry events"].data||[]).filter((row)=>!row.cancelled));

    setDatasetErrors(errors);
    if(Object.keys(errors).length) setError("Some workforce data could not load. The affected dataset is identified below; available datasets remain usable.");
    setLoading(false);
    return {errors};
  }

  const today=isoDay(new Date());
  const peopleById=Object.fromEntries(people.map((p)=>[p.profile_id,p]));
  const dayTypesById=Object.fromEntries(dayTypes.map((d)=>[d.id,d]));
  const activePolicy=policies.find((p)=>p.state==="active")||null;
  const activeRules=activePolicy?policyRules.filter((r)=>r.policy_version_id===activePolicy.id):[];

  function latestSchedule(profileId,date=today){
    const rows=schedules.filter((s)=>s.profile_id===profileId && s.effective_from<=date && (!s.effective_to || s.effective_to>=date));
    const superseded=new Set(rows.map((s)=>s.supersedes_id).filter(Boolean));
    return rows.find((s)=>!superseded.has(s.id))||rows[0]||null;
  }
  function sessionsOn(profileId,date=today){
    return sessions.filter((s)=>s.profile_id===profileId && s.started_at?.slice(0,10)===date);
  }
  function approvedLeave(profileId,date=today){
    return leave.find((l)=>l.profile_id===profileId && l.status==="approved" && l.start_date<=date && l.end_date>=date)||null;
  }
  function currentDayType(profileId,date=today){
    const schedule=latestSchedule(profileId,date);
    const key=DAY_KEYS[new Date(date+"T00:00:00").getDay()];
    const id=schedule?.day_map?.[key];
    return id?dayTypesById[id]||null:null;
  }
  function contextFor(profileId,date=today){
    const leaveRow=approvedLeave(profileId,date);
    if(leaveRow) return {label:"Approved leave",tone:"blue",detail:human(leaveRow.kind)+" leave"};
    const rows=sessionsOn(profileId,date);
    if(rows.length) return {label:"Session recorded",tone:"green",detail:rows.length+" recorded session"+(rows.length===1?"":"s")};
    const dayType=currentDayType(profileId,date);
    if(!dayType) return {label:"Schedule not configured",tone:"grey",detail:"No workforce schedule is recorded for this date."};
    if(dayType.session_expected) return {label:"No session recorded",tone:"amber",detail:"This is recorded context only, not an absence judgement."};
    return {label:dayType.name,tone:"grey",detail:"A work session is not ordinarily expected for this configured day type."};
  }

  async function runRpc(name,args,success,requiredDatasets=[]){
    setBusy(true); setError(null); setNotice(null);
    const {error:e}=await supabase.rpc(name,args);
    if(e){ setBusy(false); setError(humanError(e,"That workforce change could not be recorded.")); return false; }
    const reload=await load();
    const missing=requiredDatasets.filter((name)=>reload.errors[name]);
    setBusy(false);
    if(missing.length){
      setError("The change was recorded, but these required datasets failed to reload: "+missing.join(", ")+".");
      return false;
    }
    setNotice(success);
    return true;
  }

  async function recordDayType(){
    const ok=await runRpc("workforce_record_day_type",{
      p_id:null,p_name:dayTypeName.trim(),p_description:dayTypeDescription.trim()||null,
      p_session_expected:dayTypeExpected,p_leave_overlay_allowed:true,p_active:true,
    },"Day type recorded.",["people","day types"]);
    if(ok){ setDayTypeSheet(false); setDayTypeName(""); setDayTypeDescription(""); }
  }

  async function recordSchedule(){
    const ok=await runRpc("workforce_record_schedule",{
      p_profile_id:schedulePerson,p_unit_id:peopleById[schedulePerson]?.unit_id||null,
      p_effective_from:scheduleFrom,p_effective_to:scheduleTo||null,p_source:"person",
      p_day_map:{[scheduleDay]:scheduleDayType},
      p_expected_start:scheduleStart||null,p_expected_end:scheduleEnd||null,
      p_reason:scheduleReason.trim(),p_supersedes_id:null,
    },"Workforce schedule recorded.",["people","day types","schedules"]);
    if(ok){ setScheduleSheet(false); setScheduleReason(""); }
  }

  async function recordCorrection(){
    const ok=await runRpc("workforce_record_attendance_correction",{
      p_profile_id:correctionPerson,p_work_date:correctionDate,p_work_session_id:null,
      p_correction_type:correctionType,p_before_context:{},
      p_after_context:{note:correctionNote.trim()},p_reason:correctionReason.trim(),p_reverses_id:null,
    },"Attendance context correction recorded.");
    if(ok){ setCorrectionSheet(false); setCorrectionNote(""); setCorrectionReason(""); }
  }

  async function leaveAction(id,action){
    const reason=window.prompt(action==="manager_approved"?"Reason for approval":"Reason for this leave decision");
    if(!reason) return;
    await runRpc("workforce_leave_action",{p_leave_request_id:id,p_action:action,p_reason:reason},"Leave decision recorded.");
  }

  async function recordPolicy(){
    const entitlement=Number(policyEntitlement);
    const rules=[{
      leave_kind:policyKind,
      entitlement_amount:Number.isFinite(entitlement)?entitlement:null,
      entitlement_unit:"days",
      accrual_method:"annual",
      carryover_method:"none",
      approval_route:policyRoute,
      opening_balance_required:false,
      complete:Number.isFinite(entitlement)&&entitlement>0,
    }];
    const ok=await runRpc("workforce_record_leave_policy",{
      p_name:policyName.trim(),p_effective_from:policyFrom,p_effective_to:null,
      p_source_reference:policySource.trim()||null,p_reason:policyReason.trim(),
      p_rules:rules,p_activate:true,p_supersedes_id:activePolicy?.id||null,
    },"Confirmed leave policy activated.");
    if(ok){ setPolicySheet(false); setPolicyReason(""); }
  }

  const waitingLeave=leave.filter((l)=>["pending","escalated"].includes(l.status));
  const tabs=[["today","Today"],["calendar","Calendar"],["leave","Leave"],["corrections","Corrections"],...(canManage?[["setup","Schedules & policy"]]:[])];

  if(loading) return <div className="body"><LoadingState label="Loading workforce…" /></div>;

  return <div className="body workforce-page">
    <div style={{paddingTop:26}}>
      <div className="eyebrow">Workforce management</div>
      <h1 className="h1">Workforce</h1>
      <p className="screen-note">Schedules, recorded sessions, approved leave and attributable corrections. “No session recorded” is context only and never an automatic absence finding.</p>
    </div>
    {error&&<ProductNotice tone="error" title="Workforce">{error}</ProductNotice>}
    {notice&&<ProductNotice tone="success" title="Recorded">{notice}</ProductNotice>}

    <div className="workforce-tabs" role="tablist" aria-label="Workforce sections">
      {tabs.map(([key,label])=><button key={key} role="tab" aria-selected={tab===key} className={tab===key?"on":""} onClick={()=>setTab(key)}>{label}</button>)}
    </div>

    {!activePolicy&&<ProductNotice tone="attention" title="Leave policy not configured">Leave requests remain available. CEAC OS will not calculate entitlement, accrual, carry-over or remaining balance from the old seeded defaults.</ProductNotice>}

    {tab==="today"&&<>
      <div className="sec"><span>Today</span><span>{people.length} people in your visible workforce scope</span></div>
      <div className="workforce-grid">
        {people.map((row)=>{
          const ctx=contextFor(row.profile_id);
          const schedule=latestSchedule(row.profile_id);
          const dayType=currentDayType(row.profile_id);
          return <article className="card workforce-person" key={row.profile_id}>
            <div className="workforce-person-head"><Avatar name={row.profiles?.full_name} size="sm"/><div><strong>{row.profiles?.full_name}</strong><span>{row.units?.name||"Unit not recorded"} · {row.profiles?.job_title||"Position not recorded"}</span></div><Pill tone={ctx.tone}>{ctx.label}</Pill></div>
            <p>{ctx.detail}</p>
            <div className="workforce-facts">
              <span>Day type <b>{dayType?.name||"Not configured"}</b></span>
              <span>Expected context <b>{schedule?.expected_start?String(schedule.expected_start).slice(0,5):"Not recorded"}{schedule?.expected_end?"–"+String(schedule.expected_end).slice(0,5):""}</b></span>
              <span>Recorded sessions <b>{sessionsOn(row.profile_id).length}</b></span>
            </div>
          </article>;
        })}
      </div>
      {!people.length&&<EmptyState title="No workforce records in scope">Your authorised people will appear here.</EmptyState>}
    </>}

    {tab==="calendar"&&<>
      <div className="sec"><span>Seven-day workforce context</span></div>
      <div className="workforce-calendar">
        {Array.from({length:7},(_,i)=>{
          const d=new Date(); d.setDate(d.getDate()+i); const date=isoDay(d);
          return <section key={date}><header><strong>{niceDay(date)}</strong></header>{people.map((p)=>{const ctx=contextFor(p.profile_id,date);return <div key={p.profile_id}><span>{p.profiles?.full_name}</span><Pill tone={ctx.tone}>{ctx.label}</Pill></div>})}</section>
        })}
      </div>
    </>}

    {tab==="leave"&&<>
      <div className="sec"><span>Waiting on a decision</span><span>{waitingLeave.length}</span></div>
      {waitingLeave.map((l)=><div className="row" key={l.id}>
        <div className="row-t">{l.profiles?.full_name||peopleById[l.profile_id]?.profiles?.full_name||"Employee"} · {l.days} day{Number(l.days)===1?"":"s"} {human(l.kind)}</div>
        <div className="row-m">{niceDay(l.start_date)} → {niceDay(l.end_date)} · {human(l.status)}</div>
        {(isManager||canManage)&&<div className="workforce-row-actions">
          {l.status==="pending"&&<button className="btn btn-ghost btn-sm" onClick={()=>leaveAction(l.id,"manager_approved")}>Approve</button>}
          {l.status==="pending"&&<button className="btn btn-ghost btn-sm" onClick={()=>leaveAction(l.id,"escalated")}>Escalate</button>}
          {canManage&&l.status==="escalated"&&<button className="btn btn-sm" onClick={()=>leaveAction(l.id,"admin_approved")}>Admin approve</button>}
          <button className="btn btn-ghost btn-sm" onClick={()=>leaveAction(l.id,"declined")}>Decline</button>
        </div>}
      </div>)}
      {!waitingLeave.length&&<EmptyState compact title="No leave requests are waiting">New requests will appear here with their recorded history.</EmptyState>}

      <div className="sec"><span>Decision history</span></div>
      {leaveEvents.slice(0,80).map((e)=><div className="row" key={e.id}><div className="row-t">{human(e.action)}</div><div className="row-m">{peopleById[e.profile_id]?.profiles?.full_name||"Employee"} · {human(e.from_status||"new")} → {human(e.to_status)} · {new Date(e.created_at).toLocaleString("en-GB")}</div></div>)}
    </>}

    {tab==="corrections"&&<>
      <div className="sec"><span>Attendance correction history</span>{canCorrect&&<button className="btn btn-sm" onClick={()=>{setCorrectionPerson(people[0]?.profile_id||"");setCorrectionSheet(true)}}>Record correction</button>}</div>
      <p className="screen-note">Corrections overlay the factual record. Original work-session rows are not rewritten.</p>
      {corrections.map((c)=><div className="row" key={c.id}><div className="row-t">{peopleById[c.profile_id]?.profiles?.full_name||"Employee"} · {human(c.correction_type)}</div><div className="row-m">{niceDay(c.work_date)} · {c.reason}</div></div>)}
      {!corrections.length&&<EmptyState compact title="No attendance corrections recorded">Nothing has been corrected in your visible scope.</EmptyState>}
    </>}

    {tab==="setup"&&canManage&&<>
      {Object.keys(datasetErrors).length>0&&<ProductNotice tone="error" title="Workforce data status">{Object.entries(datasetErrors).map(([name,message])=><div key={name}><strong>{human(name)}</strong>: {message}</div>)}</ProductNotice>}
      <div className="card small workforce-data-status">Visible people: <strong>{people.length}</strong> · Active day types: <strong>{dayTypes.length}</strong></div>
      <div className="workforce-setup-actions">
        <button className="btn btn-ghost" onClick={()=>setDayTypeSheet(true)}>Add day type</button>
        <button className="btn btn-ghost" disabled={busy||!dayTypes.length||!people.length} title={!people.length?"No visible active people loaded":!dayTypes.length?"No active day types loaded":""} onClick={()=>{setSchedulePerson(people[0]?.profile_id||"");setScheduleDayType(dayTypes[0]?.id||"");setScheduleSheet(true)}}>Record schedule</button>
        <button className="btn" onClick={()=>setPolicySheet(true)}>{activePolicy?"Create policy revision":"Configure leave policy"}</button>
      </div>
      <div className="sec"><span>Day types</span><span>{dayTypes.length}</span></div>
      {dayTypes.map((d)=><div className="row" key={d.id}><div className="row-t">{d.name}</div><div className="row-m">{d.session_expected?"Session ordinarily expected":"Session not ordinarily expected"} · {d.description||"No description"}</div></div>)}
      <div className="sec"><span>Leave policy status</span></div>
      {activePolicy?<div className="card workforce-policy"><strong>{activePolicy.name}</strong><span>Confirmed {new Date(activePolicy.confirmed_at).toLocaleString("en-GB")}</span>{activeRules.map((r)=><small key={r.id}>{human(r.leave_kind)} · {r.complete?(String(r.entitlement_amount)+" "+r.entitlement_unit):"rule incomplete"} · {human(r.approval_route)}</small>)}</div>:<div className="card small">No confirmed CEAC leave policy is active. Legacy seeded defaults are not used as policy.</div>}
    </>}

    {dayTypeSheet&&<Sheet onClose={()=>!busy&&setDayTypeSheet(false)}>
      <div className="h2">Add workforce day type</div>
      <FieldGroup label="Name"><input className="field" aria-label="Day type name" value={dayTypeName} onChange={e=>setDayTypeName(e.target.value)}/></FieldGroup>
      <FieldGroup label="Description"><textarea className="field" aria-label="Day type description" rows="2" value={dayTypeDescription} onChange={e=>setDayTypeDescription(e.target.value)}/></FieldGroup>
      <label className="check-row"><input type="checkbox" checked={dayTypeExpected} onChange={e=>setDayTypeExpected(e.target.checked)}/><span>A work session is ordinarily expected on this day type</span></label>
      <button className="btn" style={{marginTop:14}} disabled={busy||dayTypeName.trim().length<2} onClick={recordDayType}>Record day type</button>
    </Sheet>}

    {scheduleSheet&&<Sheet onClose={()=>!busy&&setScheduleSheet(false)}>
      <div className="h2">Record workforce schedule</div>
      <FieldGroup label="Person"><select className="field" aria-label="Schedule person" value={schedulePerson} onChange={e=>setSchedulePerson(e.target.value)}>{people.map(p=><option key={p.profile_id} value={p.profile_id}>{p.profiles?.full_name}</option>)}</select></FieldGroup>
      <div className="form-grid two"><FieldGroup label="Day"><select className="field" aria-label="Schedule weekday" value={scheduleDay} onChange={e=>setScheduleDay(e.target.value)}>{DAY_KEYS.map(k=><option key={k} value={k}>{DAY_LABELS[k]}</option>)}</select></FieldGroup><FieldGroup label="Day type"><select className="field" aria-label="Schedule day type" value={scheduleDayType} onChange={e=>setScheduleDayType(e.target.value)}>{dayTypes.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select></FieldGroup></div>
      <div className="form-grid two"><FieldGroup label="Effective from"><input className="field" type="date" value={scheduleFrom} onChange={e=>setScheduleFrom(e.target.value)}/></FieldGroup><FieldGroup label="Effective to"><input className="field" type="date" value={scheduleTo} onChange={e=>setScheduleTo(e.target.value)}/></FieldGroup></div>
      <div className="form-grid two"><FieldGroup label="Expected start"><input className="field" type="time" value={scheduleStart} onChange={e=>setScheduleStart(e.target.value)}/></FieldGroup><FieldGroup label="Expected end"><input className="field" type="time" value={scheduleEnd} onChange={e=>setScheduleEnd(e.target.value)}/></FieldGroup></div>
      <FieldGroup label="Reason"><textarea className="field" aria-label="Schedule reason" rows="2" value={scheduleReason} onChange={e=>setScheduleReason(e.target.value)}/></FieldGroup>
      <button className="btn" style={{marginTop:14}} disabled={busy||!schedulePerson||!scheduleDayType||scheduleReason.trim().length<3} onClick={recordSchedule}>Record schedule</button>
    </Sheet>}

    {correctionSheet&&<Sheet onClose={()=>!busy&&setCorrectionSheet(false)}>
      <div className="h2">Record attendance context correction</div>
      <p className="screen-note">This adds an attributable correction. It does not rewrite the original work session.</p>
      <FieldGroup label="Person"><select className="field" aria-label="Correction person" value={correctionPerson} onChange={e=>setCorrectionPerson(e.target.value)}>{people.map(p=><option key={p.profile_id} value={p.profile_id}>{p.profiles?.full_name}</option>)}</select></FieldGroup>
      <div className="form-grid two"><FieldGroup label="Date"><input className="field" type="date" value={correctionDate} onChange={e=>setCorrectionDate(e.target.value)}/></FieldGroup><FieldGroup label="Type"><select className="field" value={correctionType} onChange={e=>setCorrectionType(e.target.value)}><option value="context_note">Context note</option><option value="start_time">Start time</option><option value="end_time">End time</option><option value="day_type">Day type</option><option value="administrative_finding">Human administrative finding</option></select></FieldGroup></div>
      <FieldGroup label="Corrected context"><textarea className="field" aria-label="Corrected context" rows="3" value={correctionNote} onChange={e=>setCorrectionNote(e.target.value)}/></FieldGroup>
      <FieldGroup label="Reason"><textarea className="field" aria-label="Correction reason" rows="2" value={correctionReason} onChange={e=>setCorrectionReason(e.target.value)}/></FieldGroup>
      <button className="btn" style={{marginTop:14}} disabled={busy||!correctionPerson||correctionReason.trim().length<3} onClick={recordCorrection}>Record correction</button>
    </Sheet>}

    {policySheet&&<Sheet onClose={()=>!busy&&setPolicySheet(false)}>
      <div className="h2">{activePolicy?"Create leave policy revision":"Configure confirmed leave policy"}</div>
      <p className="screen-note">Enter only CEAC-confirmed values. Activating this version makes it the organisation policy record.</p>
      <FieldGroup label="Policy name"><input className="field" aria-label="Policy name" value={policyName} onChange={e=>setPolicyName(e.target.value)}/></FieldGroup>
      <FieldGroup label="Effective from"><input className="field" type="date" value={policyFrom} onChange={e=>setPolicyFrom(e.target.value)}/></FieldGroup>
      <FieldGroup label="Source reference"><input className="field" aria-label="Policy source reference" value={policySource} onChange={e=>setPolicySource(e.target.value)} placeholder="Document, approval or reference"/></FieldGroup>
      <div className="form-grid two"><FieldGroup label="Leave kind"><input className="field" value={policyKind} onChange={e=>setPolicyKind(e.target.value)}/></FieldGroup><FieldGroup label="Confirmed entitlement days"><input className="field" type="number" min="0" value={policyEntitlement} onChange={e=>setPolicyEntitlement(e.target.value)}/></FieldGroup></div>
      <FieldGroup label="Approval route"><select className="field" value={policyRoute} onChange={e=>setPolicyRoute(e.target.value)}><option value="manager">Manager</option><option value="admin">Administration</option><option value="manager_then_admin">Manager then Administration</option></select></FieldGroup>
      <FieldGroup label="Reason for this policy version"><textarea className="field" aria-label="Policy reason" rows="2" value={policyReason} onChange={e=>setPolicyReason(e.target.value)}/></FieldGroup>
      <button className="btn" style={{marginTop:14}} disabled={busy||policyName.trim().length<3||Number(policyEntitlement)<=0||policyReason.trim().length<3} onClick={recordPolicy}>Activate confirmed policy</button>
    </Sheet>}
  </div>;
}
