import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function ExecutiveHome({ me }) {
  const [x, setX] = useState({ done: 0, objectives: 0, projects: 0, working: 0, blocked: 0, review: 0 });
  const [loading, setLoading] = useState(true);
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
      const [done, objectives, projects, working, blocked, review] = await Promise.all([
        count("completed_outputs"),
        count("objectives"),
        count("projects", (query) => query.eq("status", "active")),
        count("work_sessions", (query) => query.is("ended_at", null)),
        count("blockers", (query) => query.neq("state", "resolved")),
        count("work_items", (query) => query.eq("status", "in_review")),
      ]);
      setX({ done, objectives, projects, working, blocked, review });
    } catch (loadError) {
      setError(loadError.message || "The ministry overview could not load.");
    } finally {
      setLoading(false);
    }
  }

  return <div className="body">
    <div style={{ paddingTop: 26 }}>
      <div className="eyebrow">Group Pastor</div>
      <h1 className="h1" style={{ marginTop: 6 }}>Ministry overview</h1>
      <p className="screen-note">Objectives, movement and ministry-level exceptions. Administration authoring stays with Administration &amp; HR.</p>
    </div>

    {error && <div className="flag flag-brick" style={{ marginTop: 14 }}>
      <h4>The ministry overview could not finish loading</h4>
      {error}
      <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={load}>Try again</button>
    </div>}

    {loading ? <div className="card" style={{ marginTop: 14 }}>Loading the record…</div> : !error && <>
      <div className="sec"><span>The record</span></div>
      <div className="metric-grid">
        <div className="metric"><b>{x.done}</b><span>Task/Deliverable outputs finished</span></div>
        <div className="metric"><b>{x.objectives}</b><span>objectives</span></div>
        <div className="metric"><b>{x.projects}</b><span>active projects</span></div>
        <div className="metric"><b>{x.working}</b><span>working now</span></div>
      </div>
      <div className="sec"><span>Exceptions</span><span>{x.review + x.blocked}</span></div>
      <div className="row">
        <div className="row-t">{x.review} in review</div>
        <div className="row-m">These remain with the authorised manager unless escalated by rule.</div>
      </div>
      <div className="row">
        <div className="row-t">{x.blocked} unresolved hold-ups</div>
        <div className="row-m">The count is factual; open the underlying work before drawing a conclusion.</div>
      </div>
    </>}

    <p className="screen-note">The figures above come from recorded CEAC work. Finished output uses the canonical Task/Deliverable completion contract.</p>
  </div>;
}
