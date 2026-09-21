import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { StatusDistribution, ProgressMeter, ProductNotice, EmptyState, SectionHeader } from "../components/bits";

export default function ExecutiveHome({ me, openMeeting, scheduleMeeting }) {
  const [x, setX] = useState({ doneWeek: 0, donePreviousWeek: 0, objectives: 0, objectiveAttention: 0, projects: 0, blocked: 0, review: 0 });
  const [loading, setLoading] = useState(true);
  const [meetings, setMeetings] = useState([]);
  const [objectiveMix, setObjectiveMix] = useState({ onTrack:0, met:0, atRisk:0, notMet:0, other:0 });
  const [reporting, setReporting] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => { load(); }, [me.org_id]);

  async function count(table, fn) {
    let query = supabase.from(table).select("id", { count: "exact", head: true }).eq("org_id", me.org_id);
    if (fn) query = fn(query);
    const result = await query;
    if (result.error) throw new Error(`${table}: ${result.error.message}`);
    return result.count ?? 0;
  }

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const now = new Date();
      const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
      const previousMonday = new Date(monday); previousMonday.setUTCDate(previousMonday.getUTCDate() - 7);
      const [doneWeek, donePreviousWeek, objectives, objectiveAttention, projects, blocked, review, meetingRows, objectiveRows, periodRows, unitRows] = await Promise.all([
        count("work_items", (query) => query.in("kind", ["task", "deliverable"]).in("status", ["completed", "self_certified"]).gte("completed_at", monday.toISOString())),
        count("work_items", (query) => query.in("kind", ["task", "deliverable"]).in("status", ["completed", "self_certified"]).gte("completed_at", previousMonday.toISOString()).lt("completed_at", monday.toISOString())),
        count("objectives"),
        count("objectives", (query) => query.in("status", ["at_risk", "not_met"])),
        count("projects", (query) => query.eq("status", "active")),
        count("blockers", (query) => query.neq("state", "resolved")),
        count("work_items", (query) => query.eq("status", "in_review")),
        supabase.from("meeting_sessions")
          .select("id,title,starts_at,status,provider")
          .gte("starts_at",new Date().toISOString())
          .lte("starts_at",new Date(Date.now()+14*864e5).toISOString())
          .neq("status","cancelled").order("starts_at").limit(5),
        supabase.from("objectives").select("status").eq("org_id",me.org_id),
        supabase.from("report_periods").select("id,label,status,starts_on").eq("status","open").order("starts_on",{ascending:false}).limit(1),
        supabase.from("units").select("id").eq("active",true),
      ]);
      if (meetingRows.error) throw new Error(`meeting_sessions: ${meetingRows.error.message}`);
      if (objectiveRows.error) throw new Error(`objectives: ${objectiveRows.error.message}`);
      if (periodRows.error) throw new Error(`report_periods: ${periodRows.error.message}`);
      if (unitRows.error) throw new Error(`units: ${unitRows.error.message}`);
      const mixRows=objectiveRows.data||[];
      const onTrack=mixRows.filter((row)=>row.status==="on_track").length;
      const met=mixRows.filter((row)=>row.status==="met").length;
      const atRisk=mixRows.filter((row)=>row.status==="at_risk").length;
      const notMet=mixRows.filter((row)=>row.status==="not_met").length;
      setObjectiveMix({onTrack,met,atRisk,notMet,other:Math.max(0,mixRows.length-onTrack-met-atRisk-notMet)});
      const openPeriod=(periodRows.data||[])[0]||null;
      if(openPeriod){
        const reportRows=await supabase.from("reports").select("unit_id,status,version").eq("period_id",openPeriod.id).eq("scope","unit");
        if(reportRows.error) throw new Error(`reports: ${reportRows.error.message}`);
        const latest={};
        (reportRows.data||[]).forEach((row)=>{if(!latest[row.unit_id]||Number(row.version)>Number(latest[row.unit_id].version))latest[row.unit_id]=row;});
        const filed=Object.values(latest).filter((row)=>row.status!=="draft").length;
        setReporting({label:openPeriod.label,filed,total:(unitRows.data||[]).length});
      }else setReporting(null);
      setX({ doneWeek, donePreviousWeek, objectives, objectiveAttention, projects, blocked, review });
      setMeetings(meetingRows.data || []);
    } catch (loadError) {
      setError(loadError.message || "The ministry overview could not load.");
    } finally {
      setLoading(false);
    }
  }

  const executiveDate = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  return <div className="body executive-home">
    <section className="executive-command-surface">
      <div className="executive-command-context"><span>Group Pastor</span><time>{executiveDate}</time></div>
      <div className="eyebrow">Ministry pulse</div>
      <h1 className="h1">Ministry overview</h1>
      <p className="screen-note">Objectives, delivery and ministry-level exceptions. Administration authoring stays with Administration &amp; HR.</p>
      {!loading && !error && <div className="executive-command-stats" aria-label="Ministry pulse">
        <div><strong>{x.projects}</strong><span>Active projects</span></div>
        <div><strong>{x.objectiveAttention}</strong><span>Objectives attention</span></div>
        <div><strong>{x.blocked}</strong><span>Open blockers</span></div>
      </div>}
    </section>

    {!loading && !error && <section className="executive-intelligence-grid">
      <article className="executive-intelligence-card">
        <div className="executive-intelligence-head"><div><span>Objectives</span><strong>Current ministry direction</strong></div><small>{x.objectives} recorded</small></div>
        <StatusDistribution label="Ministry objective status" segments={[
          {key:"met",label:"Met",value:objectiveMix.met,tone:"success"},
          {key:"track",label:"On track",value:objectiveMix.onTrack,tone:"info"},
          {key:"risk",label:"At risk",value:objectiveMix.atRisk,tone:"attention"},
          {key:"not-met",label:"Not met",value:objectiveMix.notMet,tone:"danger"},
          {key:"other",label:"Other",value:objectiveMix.other,tone:"neutral"},
        ]}/>
      </article>
      <article className="executive-intelligence-card">
        <div className="executive-intelligence-head"><div><span>Reporting</span><strong>{reporting?reporting.label:"No open period"}</strong></div><small>Unit coverage</small></div>
        {reporting?<ProgressMeter value={reporting.filed} max={reporting.total} label="Reports filed" detail={`${reporting.filed} of ${reporting.total} units`}/>:<EmptyState compact title="No reporting period is open">Administration controls reporting periods.</EmptyState>}
      </article>
    </section>}

    <section className="office-meeting-strip executive-meeting-strip">
      <div className="office-meeting-strip-head">
        <div><span>Next 14 days</span><strong>Meetings</strong></div>
        <button className="btn btn-sm" onClick={() => scheduleMeeting?.({ scope:"organisation", organisation:true })}>Schedule</button>
      </div>
      {meetings.length === 0 ? <div className="office-meeting-empty">No upcoming meetings are visible in the current record.</div>
        : meetings.slice(0,3).map((meeting) => <button className="office-meeting-row" key={meeting.id} onClick={() => openMeeting?.(meeting.id)}>
          <span><strong>{meeting.title}</strong><small>{new Date(meeting.starts_at).toLocaleString("en-GB",{timeZone:"Africa/Accra",weekday:"short",day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</small></span>
          <b aria-hidden="true">→</b>
        </button>)}
    </section>

    {error && <div className="flag flag-brick" style={{ marginTop: 14 }}>
      <h4>The ministry overview could not finish loading</h4>
      {error}
      <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={load}>Try again</button>
    </div>}

    {loading ? <div className="card" style={{ marginTop: 14 }}>Loading the record…</div> : !error && <>
      <div className="sec"><span>Change over time</span><span>This week vs last week</span></div>
      <div className="executive-change-card">
        <div><strong>{x.doneWeek}</strong><span>Task/Deliverable outputs completed this week</span></div>
        <p>{x.doneWeek === x.donePreviousWeek
          ? `Same completed-output count as last week (${x.donePreviousWeek}).`
          : x.doneWeek > x.donePreviousWeek
            ? `${x.doneWeek - x.donePreviousWeek} more completed output${x.doneWeek - x.donePreviousWeek === 1 ? "" : "s"} than last week (${x.donePreviousWeek}).`
            : `${x.donePreviousWeek - x.doneWeek} fewer completed output${x.donePreviousWeek - x.doneWeek === 1 ? "" : "s"} than last week (${x.donePreviousWeek}).`}</p>
        <small>This is a factual volume comparison, not a performance score.</small>
      </div>

      <div className="sec"><span>The record</span></div>
      <div className="metric-grid">
        <div className="metric"><b>{x.doneWeek}</b><span>completed outputs this week</span></div>
        <div className="metric"><b>{x.objectiveAttention}</b><span>objectives at risk / not met</span></div>
        <div className="metric"><b>{x.objectives}</b><span>objectives recorded</span></div>
        <div className="metric"><b>{x.projects}</b><span>active projects</span></div>
      </div>
      <div className="sec"><span>Exceptions</span><span>{x.review + x.blocked + x.objectiveAttention}</span></div>
      <div className="row">
        <div className="row-t">{x.review} in review</div>
        <div className="row-m">These remain with the authorised manager unless escalated by rule.</div>
      </div>
      <div className="row">
        <div className="row-t">{x.blocked} unresolved hold-ups</div>
        <div className="row-m">The count is factual; open the underlying work before drawing a conclusion.</div>
      </div>
      <div className="row">
        <div className="row-t">{x.objectiveAttention} objectives at risk or not met</div>
        <div className="row-m">Objective status is recorded explicitly; this does not infer why an objective is in that state.</div>
      </div>
    </>}

    <p className="screen-note">The figures above come from recorded CEAC work. Finished output uses the canonical Task/Deliverable completion contract.</p>
  </div>;
}
