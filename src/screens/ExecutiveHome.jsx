import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { DashboardCalendar, ReferenceModuleStrip } from "../components/ReferenceDashboard";
import { StatusDistribution, ProgressMeter, ProductNotice, EmptyState, SectionHeader } from "../components/bits";
import { Chart, Stat, StatRow, Table } from "../components/primitives";

function dateKey(date) {
  return new Date(date).toLocaleDateString("en-CA", { timeZone: "Africa/Accra" });
}

function jump(id) {
  const el = typeof document !== "undefined" && document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function ExecutiveHome({ me, openMeeting, scheduleMeeting, go }) {
  const [x, setX] = useState({ doneWeek: 0, donePreviousWeek: 0, objectives: 0, objectiveAttention: 0, projects: 0, blocked: 0, review: 0 });
  const [loading, setLoading] = useState(true);
  const [meetings, setMeetings] = useState([]);
  const [objectiveMix, setObjectiveMix] = useState({ onTrack:0, met:0, atRisk:0, notMet:0, other:0 });
  const [reporting, setReporting] = useState(null);
  const [ministryOperations, setMinistryOperations] = useState([]);
  const [ministryOccurrences, setMinistryOccurrences] = useState([]);
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
      const ministryStart = new Date(now); ministryStart.setDate(ministryStart.getDate() - 90);

      const [doneWeek, donePreviousWeek, objectives, objectiveAttention, projects, blocked, review, meetingRows, objectiveRows, periodRows, unitRows, operationRows] = await Promise.all([
        count("work_items", (query) => query.in("kind", ["task", "deliverable"]).in("status", ["completed", "self_certified"]).gte("completed_at", monday.toISOString())),
        count("work_items", (query) => query.in("kind", ["task", "deliverable"]).in("status", ["completed", "self_certified"]).gte("completed_at", previousMonday.toISOString()).lt("completed_at", monday.toISOString())),
        count("objectives"),
        count("objectives", (query) => query.in("status", ["at_risk", "not_met"])),
        count("projects", (query) => query.eq("status", "active")),
        count("blockers", (query) => query.neq("state", "resolved")),
        count("work_items", (query) => query.eq("status", "in_review")),
        supabase.from("meeting_sessions")
          .select("id,title,starts_at,status,provider")
          .gte("starts_at",now.toISOString())
          .lte("starts_at",new Date(Date.now()+14*864e5).toISOString())
          .neq("status","cancelled").order("starts_at").limit(5),
        supabase.from("objectives").select("status").eq("org_id",me.org_id),
        supabase.from("report_periods").select("id,label,status,starts_on").eq("status","open").order("starts_on",{ascending:false}).limit(1),
        supabase.from("units").select("id").eq("active",true),
        supabase.from("recurring_operations")
          .select("id,name,value_label,unit_id,units(name)")
          .eq("org_id",me.org_id).eq("active",true).eq("records_value",true)
          .order("name"),
      ]);

      const firstError = [meetingRows.error, objectiveRows.error, periodRows.error, unitRows.error, operationRows.error].find(Boolean);
      if (firstError) throw new Error(firstError.message);

      const operations = operationRows.data || [];
      let occurrenceRows = [];
      if (operations.length) {
        const occurrenceResult = await supabase.from("operation_occurrences")
          .select("id,operation_id,occurred_on,value,note,created_at,recorded_by")
          .in("operation_id",operations.map((row)=>row.id))
          .gte("occurred_on",dateKey(ministryStart))
          .order("occurred_on",{ascending:true})
          .order("created_at",{ascending:true});
        if (occurrenceResult.error) throw new Error(`operation_occurrences: ${occurrenceResult.error.message}`);
        occurrenceRows = occurrenceResult.data || [];
      }
      setMinistryOperations(operations);
      setMinistryOccurrences(occurrenceRows);

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
  const mondayKey = useMemo(() => {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    return dateKey(monday);
  }, []);

  const operationById = useMemo(
    () => new Map(ministryOperations.map((operation) => [operation.id, operation])),
    [ministryOperations],
  );

  const occurrencesThisWeek = ministryOccurrences.filter((row) => row.occurred_on >= mondayKey);
  const unitsThisWeek = new Set(occurrencesThisWeek.map((row) => operationById.get(row.operation_id)?.unit_id).filter(Boolean)).size;

  const ministryLatestRows = useMemo(() => {
    const latest = new Map();
    ministryOccurrences.forEach((row) => {
      const current = latest.get(row.operation_id);
      if (!current || row.occurred_on > current.occurred_on || (row.occurred_on === current.occurred_on && row.created_at > current.created_at)) latest.set(row.operation_id,row);
    });
    return ministryOperations.map((operation) => {
      const row = latest.get(operation.id);
      return {
        id: operation.id,
        unit: operation.units?.name || "Unit",
        name: operation.name,
        value_label: operation.value_label || "Value",
        occurred_on: row?.occurred_on || null,
        value: row?.value ?? null,
        note: row?.note || null,
      };
    }).sort((a,b)=>String(b.occurred_on||"").localeCompare(String(a.occurred_on||"")));
  }, [ministryOperations, ministryOccurrences]);

  const ministryCharts = useMemo(() => {
    return ministryOperations.map((operation) => {
      const rows = ministryOccurrences
        .filter((row) => row.operation_id === operation.id)
        .map((row) => ({ label: row.occurred_on.slice(5), value: Number(row.value) || 0, occurred_on: row.occurred_on }));
      return { operation, rows };
    }).filter((entry) => entry.rows.length >= 2)
      .sort((a,b)=>String(b.rows[b.rows.length-1]?.occurred_on||"").localeCompare(String(a.rows[a.rows.length-1]?.occurred_on||"")))
      .slice(0,6);
  }, [ministryOperations,ministryOccurrences]);

  return <div className="body executive-home">
    <section className="executive-command-surface">
      <div className="executive-command-context"><span>Group Pastor</span><time>{executiveDate}</time></div>
      <div className="eyebrow">Ministry pulse</div>
      <h1 className="h1">Ministry overview</h1>
      <p className="screen-note">Recorded ministry activity first. Office delivery and administrative evidence sit beneath it.</p>
      {!loading && !error && <StatRow>
        {ministryOperations.length > 0 && <Stat icon="ministry" label="Tracked ministry numbers" value={ministryOperations.length} onOpen={() => jump("executive-ministry-record")} />}
        {occurrencesThisWeek.length > 0 && <Stat icon="record" label="Records this week" value={occurrencesThisWeek.length} onOpen={() => jump("executive-ministry-record")} />}
        {unitsThisWeek > 0 && <Stat icon="unit" label="Units recording this week" value={unitsThisWeek} onOpen={() => jump("executive-ministry-record")} />}
      </StatRow>}
    </section>

    {error && <ProductNotice tone="error" title="The ministry overview could not finish loading" action={<button className="btn btn-ghost btn-sm" onClick={load}>Try again</button>}>{error}</ProductNotice>}

    {!loading && !error && <section id="executive-ministry-record" className="home-panel">
      <SectionHeader eyebrow="Ministry record" title="What CEAC recorded" count={ministryOccurrences.length || undefined} />
      <p className="screen-note">These are unit-entered numbers. They are not scores and CEAC OS does not infer why a number moved.</p>
      {ministryOperations.length === 0
        ? <EmptyState compact title="No ministry numbers have been configured yet">Unit Heads can add the recurring numbers their units already record from Reports.</EmptyState>
        : <>
          <Table
            rows={ministryLatestRows}
            empty="No ministry numbers have been recorded yet."
            exportName="ceac-ministry-latest"
            columns={[
              { key:"unit",label:"Unit" },
              { key:"name",label:"Number" },
              { key:"occurred_on",label:"Latest date",width:110,render:(row)=>row.occurred_on||"—" },
              { key:"value",label:"Latest value",align:"right",sortValue:(row)=>Number(row.value)||0,
                render:(row)=>row.value===null?"—":`${Number(row.value).toLocaleString("en-GH")} ${row.value_label}`,
                csv:(row)=>row.value??"" },
              { key:"note",label:"Context",render:(row)=>row.note||"—" },
            ]}
          />
          {ministryCharts.length > 0 && <div style={{ display:"grid", gap:14, marginTop:16 }}>
            {ministryCharts.map(({operation,rows}) => <Chart
              key={operation.id}
              kind="line"
              title={`${operation.units?.name || "Unit"} · ${operation.name}`}
              data={rows}
              series={[{ key:"value",label:operation.value_label || "Value" }]}
              ariaLabel={`${operation.name} recorded values over time`}
            />)}
          </div>}
        </>}
    </section>}

    <DashboardCalendar meetings={meetings} />

    {!loading && !error && <section className="executive-intelligence-grid">
      <article className="executive-intelligence-card">
        <div className="executive-intelligence-head"><div><span>Objectives</span><strong>Current ministry direction</strong></div><small>Recorded status</small></div>
        <Stat icon="chart" label="Objectives recorded" value={x.objectives} onOpen={() => go?.("strategy")} />
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

    {loading ? <div className="card" style={{ marginTop: 14 }}>Loading the record…</div> : !error && <>
      <div className="sec"><span>Office delivery</span><span>This week</span></div>
      <StatRow>
        <Stat icon="work" label="Completed outputs" value={x.doneWeek} sub={x.donePreviousWeek === x.doneWeek ? "same as last week" : x.doneWeek > x.donePreviousWeek ? `+${x.doneWeek-x.donePreviousWeek} vs last week` : `-${x.donePreviousWeek-x.doneWeek} vs last week`} onOpen={() => go?.("work")} />
        <Stat icon="warning" label="Objectives needing attention" value={x.objectiveAttention} tone={x.objectiveAttention ? "slow" : "ink"} onOpen={() => go?.("strategy")} />
        <Stat icon="project" label="Active projects" value={x.projects} onOpen={() => go?.("delivery")} />
        <Stat icon="hand" label="Open blockers" value={x.blocked} tone={x.blocked ? "slow" : "ink"} onOpen={() => go?.("work")} />
      </StatRow>

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

    <ReferenceModuleStrip items={[
      {label:"Work",icon:"work",note:"Delegated work and decisions.",onClick:()=>go?.("work")},
      {label:"Ministry",icon:"ministry",note:"Goals and strategy.",onClick:()=>go?.("strategy")},
      {label:"Portfolio",icon:"portfolio",note:"Projects and delivery.",onClick:()=>go?.("delivery")},
      {label:"Organisation",icon:"organisation",note:"Organisation overview.",onClick:()=>go?.("exec-organisation")},
      {label:"Finance",icon:"finance",note:"Financial oversight.",onClick:()=>go?.("exec-finance")},
      {label:"Reports",icon:"reports",note:"Leadership reporting.",onClick:()=>go?.("exec-reports")},
    ]}/>

    <p className="screen-note">Ministry figures above are recorded by units. Office-delivery figures use the canonical Task/Deliverable completion contract.</p>
  </div>;
}
