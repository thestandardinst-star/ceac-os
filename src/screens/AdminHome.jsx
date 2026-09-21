import { useEffect, useState } from "react";
import { supabase, inviteByEmail } from "../lib/supabase";
import { dueLabel } from "../lib/time";
import { Sheet, FieldGroup, ProductNotice, EmptyState, SectionHeader } from "../components/bits";
import { humanError } from "../lib/productLanguage";

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
          .select("id,party_text,since,state,party_unit_id,work_items(id,title,unit_id),claimant:profiles!blockers_claimed_by_fkey(full_name),units(name)")
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
    } catch (error) { setMsg(humanError(error, "The leave decision could not be saved.")); }
    finally { setBusy(false); }
  }

  const withoutHead = units.filter((unit) => !unit.head).length;
  const adminDate = new Date().toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"});
  const adminAttention = alerts.length + leaveQueue.length + withoutHead + (reporting?.missing?.length || 0);

  const reportingGap = reporting?.missing?.length || 0;
  const deliveryRisk = watch.length + blockers.length;
  const needsYou = alerts.length + leaveQueue.length + withoutHead;

  return <div className="body admin-home">
    <section className="admin-command-surface">
      <div className="admin-command-context"><span>Administration &amp; HR</span><time>{adminDate}</time></div>
      <div className="eyebrow">Organisation command surface</div>
      <h1 className="h1">Administration</h1>
      <p className="screen-note">Decisions, gaps and office-wide exceptions first. Unit-level work stays with managers unless Administration deliberately drills into it.</p>
      <div className="admin-command-stats" aria-label="Administration overview">
        <div><strong>{needsYou}</strong><span>Need your action</span></div>
        <div><strong>{reportingGap}</strong><span>Reporting gaps</span></div>
        <div><strong>{deliveryRisk}</strong><span>Delivery risks</span></div>
        <div><strong>{today.headcount}</strong><span>People on record</span></div>
      </div>
    </section>

    {loadError && <ProductNotice tone="error" title="Administration could not finish loading" action={<button className="btn btn-ghost btn-sm" onClick={load}>Try again</button>}>{loadError}</ProductNotice>}
    {msg && !inviting && <ProductNotice tone={msg.includes("sent") || msg.includes("saved") ? "success" : "attention"} title={msg.includes("sent") ? "Done" : "Administration update"}>{msg}</ProductNotice>}

    <section className="admin-home-section admin-home-priority">
      <SectionHeader eyebrow="Action" title="Needs you" count={needsYou} />
      {needsYou === 0 && <EmptyState compact title="Nothing requires Administration right now">Leave decisions, access/setup exceptions and administrative alerts will appear here.</EmptyState>}

      {!office && <ProductNotice tone="attention" title="Set the office location" action={<button className="btn btn-ghost btn-sm" onClick={openSettings}>Open Settings</button>}>Attendance cannot distinguish the office from another work location until this is configured.</ProductNotice>}

      {withoutHead > 0 && <ProductNotice tone="attention" title={`${withoutHead} unit${withoutHead === 1 ? "" : "s"} without a head`} action={<button className="btn btn-ghost btn-sm" onClick={openUnits}>Open Units</button>}>Assign an existing unit member after their account is active. New invitations always begin as Staff.</ProductNotice>}

      {leaveQueue.map((request) => <div key={request.id} className="admin-action-row">
        <div>
          <strong>{request.profiles?.full_name || "—"} · {request.days} day{request.days === 1 ? "" : "s"} {request.kind} leave</strong>
          <span>{request.start_date} → {request.end_date} · {request.status === "escalated" ? "Escalated by manager" : "Waiting for Administration"}</span>
        </div>
        <div className="admin-row-actions">
          <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => decideLeave(request, "declined")}>Decline</button>
          <button className="btn btn-sm" disabled={busy} onClick={() => decideLeave(request, "approved")}>Approve</button>
        </div>
      </div>)}

      {alerts.map((alert) => <button key={alert.id} className="admin-action-row admin-action-button" onClick={() => alert.subject_type === "work_item" && alert.subject_id && openItem(alert.subject_id)}>
        <div><strong>{alert.message}</strong><span>Since {new Date(alert.first_seen_at).toLocaleDateString("en-GB", { day:"numeric", month:"short" })}</span></div>
        <b aria-hidden="true">→</b>
      </button>)}
    </section>

    <section className="admin-home-section">
      <SectionHeader eyebrow="Reporting" title="Who is missing" count={reportingGap} />
      {!reporting && <EmptyState compact title="No open reporting period">When Administration opens a reporting period, missing units will be named here.</EmptyState>}
      {reporting && <div className="admin-reporting-card">
        <div><strong>{reporting.submitted} of {reporting.total} units submitted</strong><span>{reporting.label}</span></div>
        {reporting.missing.length > 0
          ? <div className="admin-missing-units">{reporting.missing.map((unit) => <span key={unit.id}>{unit.name}</span>)}</div>
          : <span className="admin-all-in">Everyone is in.</span>}
      </div>}
    </section>

    <section className="admin-home-section">
      <SectionHeader eyebrow="Delivery risk" title="Needs attention" count={deliveryRisk} />
      {deliveryRisk === 0 && <EmptyState compact title="No current delivery exceptions">Rule-based silence, at-risk objectives and cross-unit blockers will appear here.</EmptyState>}
      {watch.map((row) => <div key={row.k} className="admin-evidence-row"><strong>{row.who}</strong><span>{row.why}</span></div>)}
      {blockers.map((blocker) => <button key={blocker.id} className="admin-evidence-row admin-action-button" onClick={() => blocker.work_items && openItem(blocker.work_items.id)}>
        <div><strong>{blocker.work_items?.title || "—"}</strong><span>{blocker.claimant?.full_name || ""} waiting on {blocker.units?.name || blocker.party_text}</span></div>
        <b aria-hidden="true">→</b>
      </button>)}
    </section>

    <div className="admin-home-grid">
      <section className="admin-home-section">
        <SectionHeader eyebrow="Today" title="Office context" />
        <p className="screen-note">Session and leave facts are operational context only. They do not measure output or performance.</p>
        <div className="admin-fact-grid">
          <div><strong>{today.working}</strong><span>working now</span></div>
          <div><strong>{today.leave}</strong><span>on approved leave</span></div>
          <div><strong>{today.notStarted}</strong><span>no session started</span></div>
          <div><strong>{today.headcount}</strong><span>people on record</span></div>
        </div>
      </section>

      <section className="admin-home-section">
        <SectionHeader eyebrow="Delivery" title="Organisation movement" />
        <div className="admin-fact-grid">
          <div><strong>{delivery.active}</strong><span>active projects</span></div>
          <div><strong>{delivery.closedThisMonth}</strong><span>closed this month</span></div>
          <div><strong>{delivery.onTrack}</strong><span>objectives on track</span></div>
          <div><strong>{delivery.objectives}</strong><span>objectives recorded</span></div>
        </div>
      </section>
    </div>

    <section className="admin-home-section">
      <div className="office-meeting-strip-head">
        <div><span>Next 14 days</span><strong>Meetings</strong></div>
        <button className="btn btn-sm" onClick={() => scheduleMeeting?.({ scope:"organisation", organisation:true })}>Schedule</button>
      </div>
      {meetings.length === 0 ? <EmptyState compact title="No upcoming meetings">Organisation, unit and project meetings visible to Administration will appear here.</EmptyState>
        : meetings.slice(0, 4).map((meeting) => <button className="office-meeting-row" key={meeting.id} onClick={() => openMeeting?.(meeting.id)}>
          <span><strong>{meeting.title}</strong><small>{new Date(meeting.starts_at).toLocaleString("en-GB",{timeZone:"Africa/Accra",weekday:"short",day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</small></span>
          <b aria-hidden="true">→</b>
        </button>)}
    </section>

    {mine.length > 0 && <section className="admin-home-section">
      <SectionHeader eyebrow="Personal" title="Your own work" count={mine.length} />
      {mine.map((item) => <button key={item.id} className="admin-evidence-row admin-action-button" onClick={() => openItem(item.id)}>
        <div><strong>{item.title}</strong><span>{item.ref} · {dueLabel(item.due_at)}</span></div><b aria-hidden="true">→</b>
      </button>)}
    </section>}

    <section className="admin-home-section">
      <SectionHeader eyebrow="Organisation" title="Units" count={units.length} action={<button className="text-action" onClick={openUnits}>Open all units</button>} />
      <div className="admin-unit-summary-grid">
        {units.map((unit) => <div key={unit.id} className="admin-unit-summary">
          <div><strong>{unit.name}</strong>{unit.alerts > 0 && <span className="pill p-amber">{unit.alerts}</span>}</div>
          {unit.head
            ? <span>{unit.head.full_name}</span>
            : unit.pending
              ? <span>Invitation sent to {unit.pending.email}</span>
              : <span className="admin-unit-missing">No Unit Head</span>}
          <small>{unit.done7} finished output{unit.done7 === 1 ? "" : "s"} this week</small>
          {!unit.head && !unit.pending && <button className="text-action" onClick={() => { setInviting(unit); setMsg(null); }}>Invite prospective head</button>}
        </div>)}
      </div>
    </section>

    {inviting && <Sheet onClose={() => { setInviting(null); setMsg(null); }}>
      <div className="eyebrow">People & access</div>
      <div className="h2">Invite someone to {inviting.name}</div>
      <p className="screen-note">Every invited account begins as Staff. After activation, Administration may explicitly assign Unit Head authority from Units.</p>
      <FieldGroup label="Full name"><input className="field" value={name} onChange={(event) => setName(event.target.value)} /></FieldGroup>
      <FieldGroup label="Work email"><input className="field" type="email" autoCapitalize="none" value={email} onChange={(event) => setEmail(event.target.value)} /></FieldGroup>
      {msg && <ProductNotice tone="attention" title="Invitation">{msg}</ProductNotice>}
      <button className="btn" style={{ marginTop:14 }} onClick={sendInvite} disabled={busy || !name.trim() || !email.trim()}>{busy ? "Sending…" : "Send Staff invitation"}</button>
    </Sheet>}
  </div>;

}