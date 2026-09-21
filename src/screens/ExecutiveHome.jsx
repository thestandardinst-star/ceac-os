import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function ExecutiveHome({ me }) {
  const [x, setX] = useState({ doneWeek: 0, donePreviousWeek: 0, objectives: 0, objectiveAttention: 0, projects: 0, blocked: 0, review: 0 });
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
      const now = new Date();
      const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
      const previousMonday = new Date(monday); previousMonday.setUTCDate(previousMonday.getUTCDate() - 7);
      const [doneWeek, donePreviousWeek, objectives, objectiveAttention, projects, blocked, review] = await Promise.all([
        count("work_items", (query) => query.in("kind", ["task", "deliverable"]).in("status", ["completed", "self_certified"]).gte("completed_at", monday.toISOString())),
        count("work_items", (query) => query.in("kind", ["task", "deliverable"]).in("status", ["completed", "self_certified"]).gte("completed_at", previousMonday.toISOString()).lt("completed_at", monday.toISOString())),
        count("objectives"),
        count("objectives", (query) => query.in("status", ["at_risk", "not_met"])),
        count("projects", (query) => query.eq("status", "active")),
        count("blockers", (query) => query.neq("state", "resolved")),
        count("work_items", (query) => query.eq("status", "in_review")),
      ]);
      setX({ doneWeek, donePreviousWeek, objectives, objectiveAttention, projects, blocked, review });
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
