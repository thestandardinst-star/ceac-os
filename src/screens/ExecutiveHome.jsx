import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

// Ported from ChatGPT's recovery package (ExecutiveHome.tsx) to JSX.
// Fix applied: blockers.state "open" is not a permitted value in the CEAC
// schema. The check constraint allows claimed | acknowledged | disputed |
// resolved. Counting "open" returned a silent zero forever.
export default function ExecutiveHome({ me }) {
  const [x, setX] = useState({ done: 0, objectives: 0, projects: 0, working: 0, blocked: 0, review: 0 });
  const [loading, setLoading] = useState(true);
  useEffect(() => { load(); }, [me.org_id]);
  async function c(table, fn) {
    let q = supabase.from(table).select("id", { count: "exact", head: true }).eq("org_id", me.org_id);
    if (fn) q = fn(q);
    const r = await q;
    return r.error ? 0 : (r.count ?? 0);
  }
  async function load() {
    setLoading(true);
    const [done, objectives, projects, working, blocked, review] = await Promise.all([
      c("work_items", (q) => q.eq("status", "completed")),
      c("objectives"),
      c("projects", (q) => q.eq("status", "active")),
      c("work_sessions", (q) => q.is("ended_at", null)),
      c("blockers", (q) => q.neq("state", "resolved")),
      c("work_items", (q) => q.eq("status", "in_review")),
    ]);
    setX({ done, objectives, projects, working, blocked, review });
    setLoading(false);
  }
  return (
    <div className="body">
      <div style={{ paddingTop: 26 }}>
        <div className="eyebrow">Group Pastor</div>
        <h1 className="h1" style={{ marginTop: 6 }}>Ministry overview</h1>
        <p className="screen-note">Objectives, movement and decisions. Task-level detail stays below this level unless you open it.</p>
      </div>
      {loading ? <div className="card" style={{ marginTop: 14 }}>Loading the record…</div> : (<>
        <div className="sec"><span>The record</span></div>
        <div className="metric-grid">
          <div className="metric"><b>{x.done}</b><span>work finished</span></div>
          <div className="metric"><b>{x.objectives}</b><span>objectives</span></div>
          <div className="metric"><b>{x.projects}</b><span>active projects</span></div>
          <div className="metric"><b>{x.working}</b><span>working now</span></div>
        </div>
        <div className="sec"><span>Needs you</span><span>{x.review + x.blocked}</span></div>
        <div className="row">
          <div className="row-t">{x.review} waiting to be checked</div>
          <div className="row-m">Approvals stay with the manager responsible.</div>
        </div>
        <div className="row">
          <div className="row-t">{x.blocked} unresolved hold-ups</div>
          <div className="row-m">Open the job itself before drawing a conclusion.</div>
        </div>
      </>)}
      <div className="sec"><span>Still to come</span></div>
      <div className="card module-list">
        <span>Objectives &amp; projects</span><span>Presence &amp; pay</span>
        <span>Cost against delivery</span><span>Announcements</span><span>Reports</span>
      </div>
      <p className="screen-note">Nothing on this page is invented. Every number is counted from work already recorded.</p>
    </div>);
}
