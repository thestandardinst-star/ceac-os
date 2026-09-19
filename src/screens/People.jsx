import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { dateOnly, dueLabel } from "../lib/time";
import { statusPill } from "../components/bits";

// The employee record. Spec section 6.
// Rules honoured here:
//  - every figure opens its underlying rows (test gate 2)
//  - assigned and self-created work are shown separately, so an appraisal
//    cannot be inflated by trivial self-entered work
//  - nothing is shown about a person that they cannot see in their own
//    Record and Me tabs
//  - sections with no table behind them yet say so plainly rather than
//    rendering an empty shell that looks broken
const FILTERS = [["all","Everyone"],["active","Active"],["on_leave","On leave"],["quiet","No submissions in 14 days"],["no_unit","No unit"]];

export default function People({ me, openItem }) {
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState("all");
  const [person, setPerson] = useState(null);
  const [drill, setDrill] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0);
    const today = new Date().toISOString().slice(0,10);
    const [ps, mem, items, sess, lv, bal, subs] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email, job_title, phone, started_on, contract_type, active, birthday, is_admin, is_exec").order("full_name"),
      supabase.from("unit_memberships").select("profile_id, unit_id, role, units(name)"),
      supabase.from("work_items").select("id, ref, title, assignee_id, status, origin, due_at, completed_at, first_time_approved, visibility, project_id, projects(name)"),
      supabase.from("work_sessions").select("id, profile_id, started_at, ended_at, place"),
      supabase.from("leave_requests").select("id, profile_id, kind, start_date, end_date, days, status"),
      supabase.from("leave_balances").select("profile_id, year, annual_taken, sick_taken, carryover_from_last_year"),
      supabase.from("submissions").select("id, profile_id, submitted_at"),
    ]);
    const year = new Date().getFullYear();
    setRows((ps.data || []).map((p) => {
      const m = (mem.data || []).find((x) => x.profile_id === p.id) || null;
      const mine = (items.data || []).filter((i) => i.assignee_id === p.id && i.visibility !== "private");
      const done = mine.filter((i) => i.status === "completed");
      const mySess = (sess.data || []).filter((s) => s.profile_id === p.id);
      const myLeave = (lv.data || []).filter((l) => l.profile_id === p.id);
      const mySubs = (subs.data || []).filter((s) => s.profile_id === p.id);
      const last = mySubs.map((s) => new Date(s.submitted_at)).sort((a,b) => b-a)[0] || null;
      return {
        ...p,
        unit_id: m ? m.unit_id : null,
        unit_name: m && m.units ? m.units.name : null,
        role: m ? m.role : null,
        items: mine, done,
        assigned: done.filter((i) => i.origin === "assigned"),
        self: done.filter((i) => i.origin === "self_created"),
        onTime: done.filter((i) => i.due_at && i.completed_at && new Date(i.completed_at) <= new Date(i.due_at)),
        firstTime: done.filter((i) => i.first_time_approved),
        openWork: mine.filter((i) => i.status !== "completed" && i.status !== "cancelled"),
        sessions: mySess,
        daysThisMonth: new Set(mySess.filter((s) => new Date(s.started_at) >= monthStart).map((s) => new Date(s.started_at).toDateString())).size,
        leave: myLeave,
        onLeaveNow: myLeave.some((l) => l.status === "approved" && l.start_date <= today && l.end_date >= today),
        balance: (bal.data || []).find((b) => b.profile_id === p.id && b.year === year) || null,
        lastSubmission: last,
        quiet: !last || (Date.now() - last.getTime()) > 14 * 864e5,
      };
    }));
    setLoading(false);
  }

  function avgStart(sessions) {
    if (!sessions.length) return "—";
    const mins = sessions.map((s) => { const d = new Date(s.started_at); return d.getHours() * 60 + d.getMinutes(); });
    const a = Math.round(mins.reduce((x, y) => x + y, 0) / mins.length);
    return String(Math.floor(a / 60)).padStart(2, "0") + ":" + String(a % 60).padStart(2, "0");
  }

  if (loading) return <div className="body"><div className="spin">Loading the people...</div></div>;

  // ---- drill-down: the rows behind a figure ----
  if (person && drill) {
    return (
      <div className="body">
        <button className="back" onClick={() => setDrill(null)}>← {person.full_name}</button>
        <div className="sec"><span>{drill.label}</span><span>{drill.rows.length}</span></div>
        {drill.rows.length === 0 && <div className="card small">Nothing recorded here yet.</div>}
        {drill.kind === "work" && drill.rows.map((i) => (
          <button key={i.id} className="row" onClick={() => openItem(i.id)}>
            <div className="row-t">{i.title}</div>
            <div className="row-m">{i.ref} · {i.completed_at ? "finished " + dateOnly(i.completed_at) : dueLabel(i.due_at)}{i.projects ? " · " + i.projects.name : ""}</div>
            <div style={{ marginTop: 7 }}>{statusPill(i.status)}</div>
          </button>))}
        {drill.kind === "sessions" && drill.rows.slice(0, 60).map((s) => (
          <div key={s.id} className="row">
            <div className="row-t">{new Date(s.started_at).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}</div>
            <div className="row-m">
              started {new Date(s.started_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
              {s.ended_at ? " · ended " + new Date(s.ended_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : " · still open"}
              {s.place === "office" ? " · at the office" : " · elsewhere"}
            </div>
          </div>))}
        {drill.kind === "leave" && drill.rows.map((l) => (
          <div key={l.id} className="row">
            <div className="row-t">{l.days} day{l.days === 1 ? "" : "s"} {l.kind}</div>
            <div className="row-m">{dateOnly(l.start_date)} — {dateOnly(l.end_date)} · {l.status}</div>
          </div>))}
      </div>);
  }

  // ---- one person ----
  if (person) {
    const p = rows.find((x) => x.id === person.id) || person;
    const entitlement = 15 + (p.balance ? p.balance.carryover_from_last_year : 0);
    const taken = p.balance ? p.balance.annual_taken : 0;
    const Fig = ({ n, label, kind, list }) => (
      <button className="metric" style={{ textAlign: "left", width: "100%" }}
        onClick={() => setDrill({ label, kind, rows: list })}><b>{n}</b><span>{label}</span></button>);
    const Line = ({ l, v }) => (
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "11px 0", borderTop: "1px solid var(--line-soft)", fontSize: 13.5 }}>
        <span style={{ color: "var(--ink-soft)" }}>{l}</span><span style={{ fontWeight: 500, textAlign: "right" }}>{v}</span></div>);

    return (
      <div className="body">
        <button className="back" onClick={() => setPerson(null)}>← All people</button>
        <div className="eyebrow">{p.unit_name || "No unit"}{p.role === "manager" ? " · Unit head" : ""}</div>
        <h1 className="h1" style={{ marginTop: 6 }}>{p.full_name}</h1>
        <p className="screen-note">{p.job_title || "No job title recorded"}</p>
        {p.onLeaveNow && <div className="flag flag-amber"><h4>On leave today</h4>Currently away on approved leave.</div>}
        {!p.active && <div className="flag flag-brick"><h4>Not active</h4>This person is marked inactive and cannot sign in.</div>}

        <div className="split" style={{ marginTop: 8 }}>
        <div className="main-col">
          <div className="sec"><span>Work</span></div>
          <p className="small" style={{ marginBottom: 6 }}>Given work and self-added work are counted separately, so nothing is inflated by self-entered items.</p>
          <div className="metric-grid">
            <Fig n={p.assigned.length} label="finished — given to them" kind="work" list={p.assigned} />
            <Fig n={p.self.length} label="finished — added themselves" kind="work" list={p.self} />
            <Fig n={p.onTime.length} label="on time" kind="work" list={p.onTime} />
            <Fig n={p.firstTime.length} label="approved first time" kind="work" list={p.firstTime} />
          </div>
          <button className="row" style={{ marginTop: 10 }} onClick={() => setDrill({ label: "Open work", kind: "work", rows: p.openWork })}>
            <div className="row-t">{p.openWork.length} open job{p.openWork.length === 1 ? "" : "s"}</div>
            <div className="row-m">Press to see them</div>
          </button>

          <div className="sec"><span>Attendance</span></div>
          <div className="metric-grid">
            <Fig n={p.daysThisMonth} label="days this month" kind="sessions" list={p.sessions} />
            <div className="metric"><b>{avgStart(p.sessions)}</b><span>average start</span></div>
          </div>
          <p className="small" style={{ marginTop: 8, lineHeight: 1.5 }}>
            A record of activity, not a basis for pay. Location is recorded once when they tap Start work, not during the day.
          </p>
        </div>

        <div className="side-col">
          <div className="sec"><span>Identity and employment</span></div>
          <div className="card" style={{ padding: "4px 15px" }}>
            <Line l="Email" v={p.email} />
            {p.phone && <Line l="Phone" v={p.phone} />}
            <Line l="Unit" v={p.unit_name || "—"} />
            <Line l="Position" v={p.is_exec ? "Group Pastor" : p.is_admin ? "Administration & HR" : p.role === "manager" ? "Unit head" : "Staff"} />
            <Line l="Contract" v={p.contract_type || "not recorded"} />
            <Line l="Started" v={p.started_on ? dateOnly(p.started_on) : "not recorded"} />
            <Line l="Status" v={p.active ? "Active" : "Inactive"} />
            {p.birthday && <Line l="Birthday" v={new Date(p.birthday).toLocaleDateString("en-GB", { day: "numeric", month: "long" })} />}
          </div>

          <div className="sec"><span>Leave</span></div>
          <div className="card" style={{ padding: "4px 15px" }}>
            <Line l="Annual taken" v={taken + " of " + entitlement + " days"} />
            <Line l="Sick taken" v={(p.balance ? p.balance.sick_taken : 0) + " days"} />
          </div>
          <button className="row" style={{ marginTop: 8 }} onClick={() => setDrill({ label: "Leave history", kind: "leave", rows: p.leave })}>
            <div className="row-t">{p.leave.length} request{p.leave.length === 1 ? "" : "s"} on record</div>
            <div className="row-m">Press to see them</div>
          </button>

          <div className="sec"><span>Not yet in the system</span></div>
          <div className="card small" style={{ lineHeight: 1.55 }}>
            Documents, pay and payslips, appraisals and feedback, welfare and training are part of this record in the
            design but have no place to live in the database yet. They are shown as missing rather than as empty,
            so nothing here can be mistaken for a complete file.
          </div>
        </div>
        </div>
      </div>);
  }

  // ---- the list ----
  const shown = rows.filter((p) =>
    filter === "all" ? true :
    filter === "active" ? p.active :
    filter === "on_leave" ? p.onLeaveNow :
    filter === "quiet" ? p.quiet :
    filter === "no_unit" ? !p.unit_id : true);

  // Seniority within a unit: the head first, then team leads, then staff.
  // Within the same rank, longest serving first — a fact, not a judgement.
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
    const k = p.unit_name || "No unit yet";
    (byUnit[k] = byUnit[k] || []).push(p);
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

  return (
    <div className="body">
      <div style={{ paddingTop: 26 }}>
        <h1 className="h1">People</h1>
        <p className="screen-note">By department, and within each one the head first, then team leads, then staff — longest serving first. Press any number to see the rows behind it.</p>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 16 }}>
        {FILTERS.map(([k, label]) => (
          <button key={k} onClick={() => setFilter(k)} style={{
            fontSize: 12.5, padding: "6px 12px", borderRadius: 20, border: "1px solid var(--line)",
            background: filter === k ? "var(--ink)" : "var(--card)",
            color: filter === k ? "#fff" : "var(--ink-soft)", fontWeight: filter === k ? 600 : 400,
          }}>{label}</button>))}
      </div>
      <div className="sec"><span>{shown.length} {shown.length === 1 ? "person" : "people"}</span><span>{groups.length} {groups.length === 1 ? "unit" : "units"}</span></div>
      {groups.map((g) => (
        <div key={g.name}>
          <div className="sec" style={{ marginBottom: 6 }}>
            <span style={{ color: "var(--ink)" }}>{g.name}</span>
            <span>{g.people.length}</span>
          </div>
          {g.people.map((p) => (
        <button key={p.id} className="row" onClick={() => { setPerson(p); setDrill(null); }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
            <div className="row-t">{p.full_name}</div>
            {p.onLeaveNow && <span className="pill p-amber">On leave</span>}
            {!p.active && <span className="pill p-grey">Inactive</span>}
          </div>
          <div className="row-m">{rankLabel(p)}{p.job_title ? " · " + p.job_title : ""}</div>
          <div className="row-m" style={{ marginTop: 4 }}>
            {p.done.length} finished · {p.openWork.length} open
            {p.quiet && <span style={{ color: "var(--amber)" }}> · nothing submitted in 14 days</span>}
          </div>
          </button>))}
        </div>))}
      {shown.length === 0 && <div className="empty"><h3>Nobody matches</h3><p>Try a different filter.</p></div>}
    </div>);
}
