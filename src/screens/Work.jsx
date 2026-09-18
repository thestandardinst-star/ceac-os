import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { dueLabel } from "../lib/time";
import { statusPill } from "../components/bits";
const FILTERS = [["active","Active"],["waiting_on","Waiting on"],["in_review","In review"],["completed","Completed"],["private","Private"]];
export default function Work({ me, openItem }) {
  const [filter, setFilter] = useState("active");
  const [items, setItems] = useState([]);
  useEffect(() => { load(); }, [filter, me.id]);
  async function load() {
    let q = supabase.from("work_items")
      .select("id, ref, title, status, due_at, visibility, projects(name)").eq("assignee_id", me.id);
    if (filter === "active") q = q.in("status", ["not_started", "in_progress", "returned"]).eq("visibility", "unit");
    else if (filter === "private") q = q.eq("visibility", "private");
    else q = q.eq("status", filter);
    const { data } = await q.order("due_at", { ascending: true, nullsFirst: false });
    setItems(data || []);
  }
  const grouped = {};
  items.forEach((i) => {
    const k = i.projects ? i.projects.name : "Other work";
    if (!grouped[k]) grouped[k] = [];
    grouped[k].push(i);
  });
  return (
    <div className="body">
      <div style={{ paddingTop: 26 }}>
        <h1 className="h1">My work</h1>
        <p className="screen-note">Everything assigned to you, and anything you added yourself.</p>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 16 }}>
        {FILTERS.map(([k, label]) => (
          <button key={k} onClick={() => setFilter(k)} style={{
            fontSize: 12.5, padding: "6px 12px", borderRadius: 20, border: "1px solid var(--line)",
            background: filter === k ? "var(--ink)" : "var(--card)",
            color: filter === k ? "#fff" : "var(--ink-soft)", fontWeight: filter === k ? 600 : 400,
          }}>{label}</button>))}
      </div>
      {Object.keys(grouped).map((project) => (
        <div key={project}>
          <div className="sec"><span>{project}</span><span>{grouped[project].length}</span></div>
          {grouped[project].map((i) => (
            <button key={i.id} className="row" onClick={() => openItem(i.id)}>
              <div className="row-t">{i.title}</div>
              <div className="row-m">{i.ref} · {dueLabel(i.due_at)}</div>
              <div style={{ marginTop: 7, display: "flex", gap: 6 }}>
                {statusPill(i.status)}
                {i.visibility === "private" && <span className="pill p-grey">Only you can see this</span>}
              </div>
            </button>))}
        </div>))}
      {items.length === 0 && (
        <div className="empty"><h3>Nothing here</h3>
          <p>{filter === "private" ? "Private items are yours alone â they appear in no report and nobody else can see them." : "Nothing in this list at the moment."}</p>
        </div>)}
    </div>);
}
