import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { dateOnly, dueLabel } from "../lib/time";
import { statusPill, ProductNotice, LoadingState, FieldGroup, EmptyState, Avatar, ProgressMeter, Sheet } from "../components/bits";
import { humanError } from "../lib/productLanguage";
import { Table } from "../components/primitives";

const FILTERS = [["all","Everyone"],["active","Active"],["on_leave","On leave"],["quiet","No submissions in 14 days"],["no_unit","No unit"]];
const EMPLOYMENT_CHANGES = [
  ["employment_details_changed","Employment details changed"],
  ["transferred","Transfer"],
  ["promoted","Promotion / title change"],
  ["manager_changed","Manager changed"],
  ["role_changed","Role changed"],
  ["working_pattern_changed","Working pattern changed"],
  ["status_changed","Status changed"],
  ["exit_recorded","Exit recorded"],
  ["correction","Correction"],
];

function employmentChangeLabel(value) {
  return EMPLOYMENT_CHANGES.find(([key]) => key === value)?.[1]
    || (value === "joined" ? "Joined" : value === "baseline_import" ? "Baseline record" : value);
}

function avgStartLabel(minutes) {
  if (minutes == null || Number.isNaN(Number(minutes))) return "—";
  const value = Number(minutes);
  return String(Math.floor(value / 60)).padStart(2, "0") + ":" + String(value % 60).padStart(2, "0");
}

export default function People({ me, openItem }) {
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [leavePolicy, setLeavePolicy] = useState(null);
  const [units, setUnits] = useState([]);
  const [person, setPerson] = useState(null);
  const [employmentEditor, setEmploymentEditor] = useState(false);
  const [employmentForm, setEmploymentForm] = useState(null);
  const [savingEmployment, setSavingEmployment] = useState(false);
  const [drill, setDrill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => { load(); }, [me.id]);

  async function load() {
    setLoading(true);
    setError(null);
    const [peopleResult, leaveResult, unitsResult] = await Promise.all([
      supabase.rpc("admin_people_summary"),
      supabase.from("leave_settings").select("annual_days,sick_days,max_carryover,updated_by,updated_at").eq("org_id", me.org_id).maybeSingle(),
      supabase.from("units").select("id,name").eq("org_id", me.org_id).eq("active", true).order("name"),
    ]);
    if (peopleResult.error) {
      setError(humanError(peopleResult.error, "The People record could not load."));
      setLoading(false);
      return;
    }
    if (leaveResult.error) {
      setError(humanError(leaveResult.error, "Leave policy status could not load."));
      setLoading(false);
      return;
    }
    if (unitsResult.error) {
      setError(humanError(unitsResult.error, "Organisation units could not load."));
      setLoading(false);
      return;
    }
    setRows(Array.isArray(peopleResult.data) ? peopleResult.data : []);
    setLeavePolicy(leaveResult.data?.updated_by ? leaveResult.data : null);
    setUnits(unitsResult.data || []);
    setLoading(false);
  }

  async function openPerson(summary) {
    setDetailLoading(true);
    setError(null);
    setDrill(null);
    const [detailResult, employmentResult] = await Promise.all([
      supabase.rpc("admin_person_detail", { p_profile_id: summary.id }),
      supabase.rpc("admin_employment_detail", { p_profile_id: summary.id }),
    ]);
    setDetailLoading(false);
    if (detailResult.error || employmentResult.error) {
      setError(humanError(detailResult.error || employmentResult.error, "That employee record could not load."));
      return;
    }
    const data = detailResult.data;
    const work = Array.isArray(data?.work) ? data.work.map((item) => ({
      ...item,
      projects: item.project_name ? { name: item.project_name } : null,
    })) : [];
    const sessions = Array.isArray(data?.sessions) ? data.sessions : [];
    const leave = Array.isArray(data?.leave) ? data.leave : [];
    const done = work.filter((item) => ["completed","self_certified"].includes(item.status));
    setPerson({
      ...summary,
      items: work,
      done,
      assigned: done.filter((item) => item.origin === "assigned"),
      self: done.filter((item) => item.origin === "self_created"),
      onTime: done.filter((item) => item.due_at && item.completed_at && new Date(item.completed_at) <= new Date(item.due_at)),
      openWork: work.filter((item) => !["completed","self_certified","cancelled"].includes(item.status)),
      sessions,
      leave,
      employment: employmentResult.data || { current: null, history: [] },
      balance: {
        annual_taken: summary.annual_taken || 0,
        sick_taken: summary.sick_taken || 0,
        carryover_from_last_year: summary.carryover_from_last_year || 0,
      },
    });
  }

  function openEmploymentEditor() {
    if (!person) return;
    const current = person.employment?.current || {};
    setEmploymentForm({
      changeType: "employment_details_changed",
      effectiveOn: new Date().toISOString().slice(0, 10),
      employmentType: current.employment_type || person.contract_type || "not_recorded",
      jobTitle: current.job_title ?? person.job_title ?? "",
      unitId: current.unit_id || person.unit_id || "",
      managerId: current.manager_profile_id || "",
      role: current.membership_role || person.role || "staff",
      workingPattern: current.working_pattern?.kind || "not_recorded",
      status: current.employment_status || (person.active ? "active" : "inactive"),
      joinedOn: current.joined_on || person.started_on || "",
      exitedOn: current.exited_on || "",
      reason: "",
      correctionOf: "",
    });
    setEmploymentEditor(true);
  }

  async function saveEmployment() {
    if (!person || !employmentForm) return;
    setSavingEmployment(true);
    setError(null);
    const { data, error: saveError } = await supabase.rpc("admin_update_employment", {
      p_profile_id: person.id,
      p_employment_type: employmentForm.employmentType,
      p_job_title: employmentForm.jobTitle || null,
      p_unit_id: employmentForm.unitId || null,
      p_manager_profile_id: employmentForm.managerId || null,
      p_membership_role: employmentForm.role,
      p_working_pattern: { kind: employmentForm.workingPattern || "not_recorded" },
      p_employment_status: employmentForm.status,
      p_joined_on: employmentForm.joinedOn || null,
      p_exited_on: employmentForm.status === "exited" ? (employmentForm.exitedOn || null) : null,
      p_change_type: employmentForm.changeType,
      p_effective_on: employmentForm.effectiveOn,
      p_reason: employmentForm.reason || null,
      p_correction_of: employmentForm.changeType === "correction" ? (employmentForm.correctionOf || null) : null,
    });
    setSavingEmployment(false);
    if (saveError) {
      setError(humanError(saveError, "The employment change could not be recorded."));
      return;
    }
    const current = data?.current || {};
    setPerson((value) => ({
      ...value,
      employment: data,
      unit_id: current.unit_id,
      unit_name: current.unit_name,
      role: current.membership_role,
      job_title: current.job_title,
      contract_type: current.employment_type,
      started_on: current.joined_on,
      active: current.employment_status === "active",
    }));
    setEmploymentEditor(false);
    setEmploymentForm(null);
    load();
  }

  if (loading) return <div className="body"><LoadingState label="Loading People…" /></div>;

  if (person && drill) {
    return <div className="body">
      <button className="back" onClick={() => setDrill(null)}>← {person.full_name}</button>
      <div className="sec"><span>{drill.label}</span><span>{drill.rows.length}</span></div>
      {drill.rows.length === 0 && <div className="card small">Nothing recorded here yet.</div>}
      {drill.kind === "work" && drill.rows.map((item) => <button key={item.id} className="row" onClick={() => openItem(item.id)}>
        <div className="row-t">{item.title}</div>
        <div className="row-m">{item.ref} · {item.completed_at ? "finished " + dateOnly(item.completed_at) : dueLabel(item.due_at)}{item.projects ? " · " + item.projects.name : ""}</div>
        <div style={{ marginTop: 7 }}>{statusPill(item.status)}</div>
      </button>)}
      {drill.kind === "sessions" && drill.rows.map((session) => <div key={session.id} className="row">
        <div className="row-t">{new Date(session.started_at).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}</div>
        <div className="row-m">
          started {new Date(session.started_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
          {session.ended_at ? " · ended " + new Date(session.ended_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : " · still open"}
          {session.place === "office" ? " · at the office" : " · elsewhere"}
        </div>
      </div>)}
      {drill.kind === "leave" && drill.rows.map((request) => <div key={request.id} className="row">
        <div className="row-t">{request.days} day{request.days === 1 ? "" : "s"} {request.kind}</div>
        <div className="row-m">{dateOnly(request.start_date)} — {dateOnly(request.end_date)} · {request.status}</div>
      </div>)}
    </div>;
  }

  if (person) {
    const employmentCurrent = person.employment?.current || null;
    const employmentHistory = Array.isArray(person.employment?.history) ? person.employment.history : [];
    const taken = Number(person.balance?.annual_taken || 0);
    const entitlement = leavePolicy ? Number(leavePolicy.annual_days || 0) + Number(person.balance?.carryover_from_last_year || 0) : null;
    const Fig = ({ n, label, kind, list }) => <button className="metric" style={{ textAlign: "left", width: "100%" }}
      onClick={() => setDrill({ label, kind, rows: list })}><b>{n}</b><span>{label}</span></button>;
    const Line = ({ l, v }) => <div style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "11px 0", borderTop: "1px solid var(--line-soft)", fontSize: 13.5 }}>
      <span style={{ color: "var(--ink-soft)" }}>{l}</span><span style={{ fontWeight: 500, textAlign: "right" }}>{v}</span>
    </div>;

    return <div className="body">
      <button className="back" onClick={() => { setPerson(null); setDrill(null); }}>← All people</button>
      {error && <div className="flag flag-brick" style={{ marginTop: 12 }}>{error}</div>}
      <section className="person-identity-header">
        <Avatar name={person.full_name} size="lg" />
        <div className="person-identity-copy">
          <div className="eyebrow">{employmentCurrent?.unit_name || person.unit_name || "No unit"}{(employmentCurrent?.membership_role || person.role) === "manager" ? " · Unit head" : ""}</div>
          <h1 className="h1">{person.full_name}</h1>
          <p className="screen-note">{employmentCurrent?.job_title || person.job_title || "No job title recorded"}</p>
        </div>
        <div className="person-identity-state">
          <span>{employmentCurrent?.employment_status || (person.active ? "Active" : "Inactive")}</span>
          {person.on_leave_now && <b>On approved leave</b>}
        </div>
      </section>
      {person.on_leave_now && <div className="flag flag-amber"><h4>On leave today</h4>Currently away on approved leave.</div>}
      {!person.active && <div className="flag flag-brick"><h4>Not active</h4>This person is marked inactive and cannot sign in.</div>}

      <div className="split" style={{ marginTop: 8 }}>
        <div className="main-col">
          <div className="sec"><span>Work</span></div>
          <p className="small" style={{ marginBottom: 6 }}>Given work and self-added work are counted separately. Formal output uses Task and Deliverable only.</p>
          <div className="metric-grid">
            <Fig n={person.assigned.length} label="finished — given to them" kind="work" list={person.assigned} />
            <Fig n={person.self.length} label="finished — added themselves" kind="work" list={person.self} />
            <Fig n={person.onTime.length} label="completed on time" kind="work" list={person.onTime} />
            <Fig n={person.done.length} label="completed outcomes" kind="work" list={person.done} />
          </div>
          <button className="row" style={{ marginTop: 10 }} onClick={() => setDrill({ label: "Open work", kind: "work", rows: person.openWork })}>
            <div className="row-t">{person.openWork.length} open job{person.openWork.length === 1 ? "" : "s"}</div>
            <div className="row-m">Press to see them</div>
          </button>

          <div className="sec"><span>Activity context</span></div>
          <div className="metric-grid">
            <Fig n={person.days_this_month || 0} label="days with a recorded session this month" kind="sessions" list={person.sessions} />
            <div className="metric"><b>{avgStartLabel(person.avg_start_minutes)}</b><span>average recorded start</span></div>
          </div>
          <p className="small" style={{ marginTop: 8, lineHeight: 1.5 }}>These are factual work-session records only. They are not a productivity measure and are never a basis for pay.</p>
        </div>

        <div className="side-col">
          <div className="sec"><span>Identity and employment</span></div>
          <div className="card" style={{ padding: "4px 15px" }}>
            <Line l="Email" v={person.email} />
            {person.phone && <Line l="Phone" v={person.phone} />}
            <Line l="Unit" v={person.unit_name || "—"} />
            <Line l="Position" v={person.is_exec ? "Group Pastor" : person.is_admin ? "Administration & HR" : person.role === "manager" ? "Unit head" : "Staff"} />
            <Line l="Contract" v={person.contract_type || "not recorded"} />
            <Line l="Started" v={person.started_on ? dateOnly(person.started_on) : "not recorded"} />
            <Line l="Status" v={person.active ? "Active" : "Inactive"} />
            {person.birthday && <Line l="Birthday" v={new Date(person.birthday).toLocaleDateString("en-GB", { day: "numeric", month: "long" })} />}
          </div>


          <div className="sec"><span>Employment record</span><button className="text-action" onClick={openEmploymentEditor}>Record change</button></div>
          <div className="card" style={{ padding: "4px 15px" }}>
            <Line l="Employment type" v={employmentCurrent?.employment_type || person.contract_type || "not recorded"} />
            <Line l="Title" v={employmentCurrent?.job_title || person.job_title || "not recorded"} />
            <Line l="Primary unit" v={employmentCurrent?.unit_name || person.unit_name || "not recorded"} />
            <Line l="Manager" v={employmentCurrent?.manager_name || "not recorded"} />
            <Line l="Role" v={(employmentCurrent?.membership_role || person.role || "staff").replaceAll("_", " ")} />
            <Line l="Working pattern" v={(employmentCurrent?.working_pattern?.kind || "not recorded").replaceAll("_", " ")} />
            <Line l="Joined" v={employmentCurrent?.joined_on ? dateOnly(employmentCurrent.joined_on) : "not recorded"} />
            <Line l="Status" v={(employmentCurrent?.employment_status || (person.active ? "active" : "inactive")).replaceAll("_", " ")} />
            {employmentCurrent?.exited_on && <Line l="Exit" v={dateOnly(employmentCurrent.exited_on)} />}
          </div>

          <div className="sec"><span>Employment history</span><span>{employmentHistory.length}</span></div>
          {employmentHistory.length === 0
            ? <div className="card small">No employment history has been recorded yet.</div>
            : employmentHistory.slice(0, 12).map((event) => <div className="row" key={event.id}>
                <div className="row-t">{employmentChangeLabel(event.change_type)}</div>
                <div className="row-m">
                  Effective {dateOnly(event.effective_on)}
                  {event.job_title ? " · " + event.job_title : ""}
                  {event.unit_name ? " · " + event.unit_name : ""}
                  {event.actor_name ? " · recorded by " + event.actor_name : " · system baseline"}
                </div>
                {event.reason && <div className="small" style={{ marginTop: 6 }}>{event.reason}</div>}
              </div>)}

          <div className="sec"><span>Leave</span></div>
          <div className="card person-leave-card">
            {leavePolicy
              ? <ProgressMeter value={taken} max={entitlement} label="Annual leave used" detail={taken + " of " + entitlement + " configured days"} />
              : <Line l="Annual taken" v={taken + " days recorded · entitlement not configured"} />}
            <Line l="Sick taken" v={Number(person.balance?.sick_taken || 0) + " days recorded"} />
          </div>
          <button className="row" style={{ marginTop: 8 }} onClick={() => setDrill({ label: "Leave history", kind: "leave", rows: person.leave })}>
            <div className="row-t">{person.leave.length} request{person.leave.length === 1 ? "" : "s"} on record</div>
            <div className="row-m">Press to see them</div>
          </button>

          <div className="sec"><span>Protected HR</span></div>
          <div className="protected-hr-shell">
            <div><span>Salary & payroll</span><strong>Awaiting CEAC salary structure</strong></div>
            <div><span>Identifiers & bank details</span><strong>Protected storage ready · fields not yet confirmed</strong></div>
            <div><span>Contracts & documents</span><strong>Protected storage ready · access rules not yet configured</strong></div>
            <div><span>Payslips</span><strong>Available after payroll is configured</strong></div>
          </div>
          <p className="screen-note">These records are deliberately not stored in the ordinary employee profile. CEAC policy must be confirmed before protected fields or payroll calculations are introduced.</p>
        </div>
      </div>

      {employmentEditor && employmentForm && <Sheet onClose={() => { if (!savingEmployment) { setEmploymentEditor(false); setEmploymentForm(null); } }}>
        <div className="eyebrow">People & employment</div>
        <div className="h2">Record employment change</div>
        <p className="screen-note">This writes a new historical snapshot. Earlier employment history is not overwritten.</p>

        <FieldGroup label="Change">
          <select className="field" aria-label="Change" value={employmentForm.changeType} onChange={(event) => setEmploymentForm({ ...employmentForm, changeType: event.target.value })}>
            {EMPLOYMENT_CHANGES.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </FieldGroup>
        {employmentForm.changeType === "correction" && <FieldGroup label="Event being corrected">
          <select className="field" aria-label="Event being corrected" value={employmentForm.correctionOf} onChange={(event) => setEmploymentForm({ ...employmentForm, correctionOf: event.target.value })}>
            <option value="">Choose history event</option>
            {employmentHistory.map((event) => <option key={event.id} value={event.id}>{dateOnly(event.effective_on)} · {employmentChangeLabel(event.change_type)}</option>)}
          </select>
        </FieldGroup>}
        <FieldGroup label="Effective date"><input className="field" aria-label="Effective date" type="date" value={employmentForm.effectiveOn} onChange={(event) => setEmploymentForm({ ...employmentForm, effectiveOn: event.target.value })} /></FieldGroup>
        <FieldGroup label="Employment type"><input className="field" aria-label="Employment type" value={employmentForm.employmentType} onChange={(event) => setEmploymentForm({ ...employmentForm, employmentType: event.target.value })} placeholder="Permanent, contract, volunteer…" /></FieldGroup>
        <FieldGroup label="Job title"><input className="field" aria-label="Job title" value={employmentForm.jobTitle} onChange={(event) => setEmploymentForm({ ...employmentForm, jobTitle: event.target.value })} /></FieldGroup>
        <FieldGroup label="Primary unit">
          <select className="field" aria-label="Primary unit" value={employmentForm.unitId} onChange={(event) => setEmploymentForm({ ...employmentForm, unitId: event.target.value, managerId: "" })}>
            <option value="">No primary unit</option>
            {units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
          </select>
        </FieldGroup>
        <FieldGroup label="Role">
          <select className="field" aria-label="Role" value={employmentForm.role} onChange={(event) => setEmploymentForm({ ...employmentForm, role: event.target.value })}>
            <option value="staff">Staff</option>
            <option value="sub_team_lead">Team lead</option>
            <option value="manager">Unit head</option>
          </select>
        </FieldGroup>
        <FieldGroup label="Manager">
          <select className="field" aria-label="Manager" value={employmentForm.managerId} onChange={(event) => setEmploymentForm({ ...employmentForm, managerId: event.target.value })}>
            <option value="">No manager recorded</option>
            {rows.filter((entry) => entry.id !== person.id && entry.active && entry.unit_id === employmentForm.unitId)
              .map((entry) => <option key={entry.id} value={entry.id}>{entry.full_name}</option>)}
          </select>
        </FieldGroup>
        <FieldGroup label="Working pattern">
          <select className="field" aria-label="Working pattern" value={employmentForm.workingPattern} onChange={(event) => setEmploymentForm({ ...employmentForm, workingPattern: event.target.value })}>
            <option value="not_recorded">Not recorded</option>
            <option value="full_time">Full time</option>
            <option value="part_time">Part time</option>
            <option value="flexible">Flexible</option>
          </select>
        </FieldGroup>
        <FieldGroup label="Employment status">
          <select className="field" aria-label="Employment status" value={employmentForm.status} onChange={(event) => setEmploymentForm({ ...employmentForm, status: event.target.value, exitedOn: event.target.value === "exited" ? employmentForm.exitedOn : "" })}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="exited">Exited</option>
          </select>
        </FieldGroup>
        <FieldGroup label="Joined"><input className="field" aria-label="Joined" type="date" value={employmentForm.joinedOn} onChange={(event) => setEmploymentForm({ ...employmentForm, joinedOn: event.target.value })} /></FieldGroup>
        {employmentForm.status === "exited" && <FieldGroup label="Exit date"><input className="field" aria-label="Exit date" type="date" value={employmentForm.exitedOn} onChange={(event) => setEmploymentForm({ ...employmentForm, exitedOn: event.target.value })} /></FieldGroup>}
        <FieldGroup label="Reason / context"><textarea className="field" aria-label="Reason / context" rows="3" value={employmentForm.reason} onChange={(event) => setEmploymentForm({ ...employmentForm, reason: event.target.value })} placeholder="Why this employment record changed" /></FieldGroup>

        {error && <ProductNotice tone="error" title="Employment change">{error}</ProductNotice>}
        <button className="btn" style={{ marginTop: 14 }} onClick={saveEmployment}
          disabled={savingEmployment || !employmentForm.effectiveOn || !employmentForm.employmentType.trim() || (employmentForm.status === "exited" && !employmentForm.exitedOn) || (employmentForm.changeType === "correction" && !employmentForm.correctionOf)}>
          {savingEmployment ? "Recording…" : "Record employment change"}
        </button>
      </Sheet>}
    </div>;
  }

  const cleanSearch = searchText.trim().toLowerCase();
  const shown = rows.filter((p) => {
    const matchesFilter =
      filter === "all" ? true :
      filter === "active" ? p.active :
      filter === "on_leave" ? p.on_leave_now :
      filter === "quiet" ? p.quiet :
      filter === "no_unit" ? !p.unit_id : true;
    const matchesSearch = !cleanSearch || [p.full_name,p.email,p.job_title,p.unit_name].filter(Boolean).some((value) => String(value).toLowerCase().includes(cleanSearch));
    return matchesFilter && matchesSearch;
  });

  function rank(p) {
    if (p.is_exec) return 0;
    if (p.is_admin) return 1;
    if (p.role === "manager") return 2;
    if (p.role === "sub_team_lead") return 3;
    return 4;
  }
  function rankLabel(p) {
    if (p.is_exec) return "Group Pastor";
    if (p.is_admin) return "Administration & HR";
    if (p.role === "manager") return "Unit head";
    if (p.role === "sub_team_lead") return "Team lead";
    return "Staff";
  }

  const byUnit = {};
  shown.forEach((p) => {
    const key = p.unit_name || "No unit yet";
    (byUnit[key] = byUnit[key] || []).push(p);
  });
  const groups = Object.keys(byUnit)
    .sort((a, b) => (a === "No unit yet" ? 1 : b === "No unit yet" ? -1 : a.localeCompare(b)))
    .map((name) => ({
      name,
      people: byUnit[name].sort((a, b) =>
        rank(a) - rank(b)
        || String(a.started_on || "9999").localeCompare(String(b.started_on || "9999"))
        || a.full_name.localeCompare(b.full_name)),
    }));

  return <div className="body">
    <div style={{ paddingTop: 26 }}>
      <div className="eyebrow">Employee record</div>
      <h1 className="h1">People</h1>
      <p className="screen-note">One factual employee record for identity, employment, work, leave and activity context. Protected HR remains behind a separate security boundary.</p>
    </div>
    {error && <ProductNotice tone="error" title="People could not finish loading" action={<button className="btn btn-ghost btn-sm" onClick={load}>Try again</button>}>{error}</ProductNotice>}
    {detailLoading && <LoadingState label="Opening employee record…" />}
    {!leavePolicy && <ProductNotice tone="attention" title="Leave policy not configured">People records show leave actually taken, but CEAC OS will not calculate entitlement or remaining leave until Administration confirms the policy.</ProductNotice>}
    <div className="people-search-row">
      <FieldGroup label="Find a person"><input className="field" type="search" placeholder="Name, email, job title or unit" value={searchText} onChange={(event) => setSearchText(event.target.value)} /></FieldGroup>
    </div>
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 16 }}>
      {FILTERS.map(([key, label]) => <button key={key} onClick={() => setFilter(key)} style={{
        fontSize: 12.5, padding: "6px 12px", borderRadius: 20, border: "1px solid var(--line)",
        background: filter === key ? "var(--ink)" : "var(--card)",
        color: filter === key ? "#fff" : "var(--ink-soft)", fontWeight: filter === key ? 600 : 400,
      }}>{label}</button>)}
    </div>
    <div className="sec"><span>{shown.length} {shown.length === 1 ? "person" : "people"}</span><span>{groups.length} {groups.length === 1 ? "unit" : "units"}</span></div>
    <Table
      rows={shown}
      empty="Nobody matches this filter."
      caption="Employee register"
      exportName="ceac-people"
      onRowClick={(row) => !detailLoading && openPerson(row)}
      rowAriaLabel={(row) => `Open employee record for ${row.full_name}`}
      columns={[
        { key:"full_name", label:"Person", render:(p)=><button type="button" className="text-action ledger-person-open" disabled={detailLoading} onClick={()=>openPerson(p)}><span style={{display:"inline-flex",alignItems:"center",gap:9}}><Avatar name={p.full_name} size="sm"/><strong>{p.full_name}</strong></span></button>, csv:(p)=>p.full_name },
        { key:"rank", label:"Role", render:(p)=>rankLabel(p)+(p.job_title ? " · "+p.job_title : ""), sortValue:(p)=>rank(p) },
        { key:"unit_name", label:"Unit", render:(p)=>p.unit_name || "No unit assigned" },
        { key:"state", label:"State", render:(p)=><span className={"pill "+(p.on_leave_now?"p-amber":p.active?"p-green":"p-grey")}>{p.on_leave_now?"On leave":p.active?"Active":"Inactive"}</span>, sortValue:(p)=>p.on_leave_now?"on leave":p.active?"active":"inactive", csv:(p)=>p.on_leave_now?"On leave":p.active?"Active":"Inactive" },
        { key:"open_count", label:"Open", align:"right", sortValue:(p)=>Number(p.open_count)||0, render:(p)=>Number(p.open_count)||0 },
        { key:"done_count", label:"Finished", align:"right", sortValue:(p)=>Number(p.done_count)||0, render:(p)=>Number(p.done_count)||0 },
        { key:"context", label:"Context", render:(p)=>p.quiet?"No submission recorded in 14 days":"Recorded work activity", csv:(p)=>p.quiet?"No submission recorded in 14 days":"Recorded work activity" },
      ]}
    />
  </div>;
}
