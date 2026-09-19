import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { dueLabel, dateOnly } from "../lib/time";
import { statusPill } from "../components/bits";

// Units deep-dive. Spec rule: every figure opens its underlying rows.
// Nothing here is a stored total — each number is counted from real rows,
// and pressing it shows exactly those rows.
export default function Units({ me, openItem }) {
  const [units, setUnits] = useState([]);
  const [open, setOpen] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    const [us, mem, items, projs, objs] = await Promise.all([
      supabase.from("units").select("id, name, code, active").eq("active", true).order("name"),
      supabase.from("unit_memberships").select("unit_id, role, profile_id, profiles(id, full_name, job_title)"),
      supabase.from("work_items").select("id, ref, title, unit_id, assignee_id, status, due_at, completed_at, visibility"),
      supabase.from("projects").select("id, name, status, lead_unit_id, starts_on, ends_on"),
      supabase.from("objectives").select("id, name, status, unit_id, project_id"),
    ]);
    const members = mem.data || [], allItems = (items.data || []).filter((i) => i.visibility !== "private");
    const allProjs = projs.data || [], allObjs = objs.data || [];
    setUnits((us.data || []).map((u) => {
      const people = members.filter((m) => m.unit_id === u.id);
      const mine = allItems.filter((i) => i.unit_id === u.id);
      const doneMonth = mine.filter((i) => i.status === "completed" && i.completed_at && new Date(i.completed_at) >= monthStart);
      const uObjs = allObjs.filter((o) => o.unit_id === u.id);
      return {
        ...u, people,
        head: people.find((m) => m.role === "manager") || null,
        items: mine,
        openItems: mine.filter((i) => i.status !== "completed" && i.status !== "cancelled"),
        doneMonth,
        projects: allProjs.filter((p) => p.lead_unit_id === u.id),
        activeProjects: allProjs.filter((p) => p.lead_unit_id === u.id && p.status === "active"),
        objectives: uObjs,
        onTrack: uObjs.filter((o) => o.status === "on_track" || o.status === "met"),
      };
    }));
    setLoading(false);
  }

  if (loading) return <div className="body"><div className="spin">Loading the units...</div></div>;

  if (open) {
    const u = units.find((x) => x.id === open.id);
    if (!u) return null;
    const rows = open.rows || [];
    return (
      <div className="body">
        <button className="back" onClick={() => setOpen(null)}>← All units</button>
        <div className="eyebrow">{u.code || "Unit"}</div>
        <h1 className="h1" style={{ marginTop: 6 }}>{u.name}</h1>
        <p className="screen-note">
          {u.head ? "Led by " + u.head.profiles.full_name : "No head assigned yet"} · {u.people.length} {u.people.length === 1 ? "person" : "people"}
        </p>

        <div className="sec"><span>{open.label}</span><span>{rows.length}</span></div>
        {rows.length === 0 && <div className="card small">Nothing recorded here yet.</div>}
        {open.kind === "work" && rows.map((i) => (
          <button key={i.id} className="row" onClick={() => openItem(i.id)}>
            <div className="row-t">{i.title}</div>
            <div className="row-m">{i.ref} · {i.completed_at ? "finished " + dateOnly(i.completed_at) : dueLabel(i.due_at)}</div>
            <div style={{ marginTop: 7 }}>{statusPill(i.status)}</div>
          </button>))}
        {open.kind === "people" && rows.map((m) => (
          <div key={m.profile_id} className="row">
            <div className="row-t">{m.profiles ? m.profiles.full_name : "—"}</div>
            <div className="row-m">{m.role === "manager" ? "Unit head" : m.role === "sub_team_lead" ? "Team lead" : "Staff"}{m.profiles && m.profiles.job_title ? " · " + m.profiles.job_title : ""}</div>
          </div>))}
        {open.kind === "projects" && rows.map((p) => (
          <div key={p.id} className="row">
            <div className="row-t">{p.name}</div>
            <div className="row-m">{p.status}{p.ends_on ? " · ends " + dateOnly(p.ends_on) : ""}</div>
          </div>))}
        {open.kind === "objectives" && rows.map((o) => (
          <div key={o.id} className="row">
            <div className="row-t">{o.name}</div>
            <div className="row-m">{o.status ? o.status.replace(/_/g, " ") : "no status set"}</div>
          </div>))}
      </div>);
  }

  function Fig({ n, label, unit, kind, rows }) {
    return (
      <button className="metric" style={{ textAlign: "left", width: "100%" }}
        onClick={() => setOpen({ id: unit.id, label, kind, rows })}>
        <b>{n}</b><span>{label}</span>
      </button>);
  }

  return (
    <div className="body">
      <div style={{ paddingTop: 26 }}>
        <h1 className="h1">Units</h1>
        <p className="screen-note">Every department, what it is carrying and what it has finished. Press any number to see the rows behind it.</p>
      </div>
      {units.map((u) => (
        <div key={u.id} className="card" style={{ marginTop: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
            <div>
              <div className="row-t" style={{ fontSize: 16 }}>{u.name}</div>
              <div className="row-m">
                {u.head ? u.head.profiles.full_name : <span style={{ color: "var(--brick)" }}>No head yet</span>}
              </div>
            </div>
            {u.people.length === 1 && <span className="pill p-grey">Unit of one</span>}
          </div>
          <div className="metric-grid" style={{ marginTop: 12 }}>
            <Fig n={u.people.length} label="people" unit={u} kind="people" rows={u.people} />
            <Fig n={u.openItems.length} label="open jobs" unit={u} kind="work" rows={u.openItems} />
            <Fig n={u.doneMonth.length} label="finished this month" unit={u} kind="work" rows={u.doneMonth} />
            <Fig n={u.activeProjects.length} label="active projects" unit={u} kind="projects" rows={u.activeProjects} />
          </div>
          {u.objectives.length > 0 && (
            <button className="row" style={{ marginTop: 10, marginBottom: 0 }}
              onClick={() => setOpen({ id: u.id, label: "Objectives", kind: "objectives", rows: u.objectives })}>
              <div className="row-t">{u.onTrack.length} of {u.objectives.length} objectives on track</div>
              <div className="row-m">Press to see each one</div>
            </button>)}
        </div>))}
      {units.length === 0 && <div className="empty"><h3>No units yet</h3><p>Units are created in Settings.</p></div>}
    </div>);
}
