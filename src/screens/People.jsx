import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { dateOnly, dueLabel } from "../lib/time";
import { statusPill, ProductNotice, LoadingState, FieldGroup, EmptyState, Avatar, ProgressMeter } from "../components/bits";
import { humanError } from "../lib/productLanguage";

const FILTERS = [["all","Everyone"],["active","Active"],["on_leave","On leave"],["quiet","No submissions in 14 days"],["no_unit","No unit"]];

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
  const [person, setPerson] = useState(null);
  const [drill, setDrill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => { load(); }, [me.id]);

  async function load() {
    setLoading(true);
    setError(null);
    const [peopleResult, leaveResult] = await Promise.all([
      supabase.rpc("admin_people_summary"),
      supabase.from("leave_settings").select("annual_days,sick_days,max_carryover,updated_by,updated_at").eq("org_id", me.org_id).maybeSingle(),
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
    setRows(Array.isArray(peopleResult.data) ? peopleResult.data : []);
    setLeavePolicy(leaveResult.data?.updated_by ? leaveResult.data : null);
    setLoading(false);
  }

  async function openPerson(summary) {
    setDetailLoading(true);
    setError(null);
    setDrill(null);
    const { data, error: detailError } = await supabase.rpc("admin_person_detail", { p_profile_id: summary.id });
    setDetailLoading(false);
    if (detailError) {
      setError(humanError(detailError, "That employee record could not load."));
      return;
    }
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
      balance: {
        annual_taken: summary.annual_taken || 0,
        sick_taken: summary.sick_taken || 0,
        carryover_from_last_year: summary.carryover_from_last_year || 0,
      },
    });
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
          <div className="eyebrow">{person.unit_name || "No unit"}{person.role === "manager" ? " · Unit head" : ""}</div>
          <h1 className="h1">{person.full_name}</h1>
          <p className="screen-note">{person.job_title || "No job title recorded"}</p>
        </div>
        <div className="person-identity-state">
          <span>{person.active ? "Active" : "Inactive"}</span>
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
    {groups.map((group) => <div key={group.name}>
      <div className="sec" style={{ marginBottom: 6 }}><span style={{ color: "var(--ink)" }}>{group.name}</span><span>{group.people.length}</span></div>
      {group.people.map((p) => <button key={p.id} className="people-directory-row" disabled={detailLoading} onClick={() => openPerson(p)}>
        <Avatar name={p.full_name} size="md" />
        <div className="people-directory-main">
          <div className="people-directory-name"><strong>{p.full_name}</strong>{p.on_leave_now && <span className="pill p-amber">On leave</span>}{!p.active && <span className="pill p-grey">Inactive</span>}</div>
          <span>{rankLabel(p)}{p.job_title ? " · " + p.job_title : ""}</span>
          <small>{p.unit_name || "No unit assigned"}</small>
        </div>
        <div className="people-directory-context">
          {p.quiet
            ? <><strong>Review context</strong><span>No submission recorded in 14 days</span></>
            : <><strong>{p.open_count || 0} open</strong><span>{p.done_count || 0} finished on record</span></>}
        </div>
        <b className="people-directory-arrow" aria-hidden="true">→</b>
      </button>)}
    </div>)}
    {shown.length === 0 && <EmptyState title="Nobody matches">Try a different filter or search term.</EmptyState>}
  </div>;
}
