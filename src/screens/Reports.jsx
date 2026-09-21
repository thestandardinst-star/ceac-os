import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { dateOnly } from "../lib/time";
import { Sheet, ProgressMeter, StatusDistribution, ProductNotice, EmptyState, SectionHeader } from "../components/bits";

// Administration's reporting screen. Two jobs, both Rebecca's:
//
//   1. Open and close reporting periods. Nobody can file a report until a
//      period exists, so this is the tap that turns reporting on.
//   2. See who has filed and who has not — by name, never a bare count.
//
// The office-wide report lives here too, because "the whole church" is
// Administration's altitude, not a manager's.
//
// Person-scope reports are deliberately absent. The employee record in
// People already covers what one person did, and no separate workflow was
// ever defined for a person report.
const KINDS = [["week","Weekly"],["month","Monthly"],["project","Project"],["year","Yearly"]];

export default function Reports({ me }) {
  const [periods, setPeriods] = useState([]);
  const [reports, setReports] = useState([]);
  const [units, setUnits] = useState([]);
  const [open, setOpen] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const [kind, setKind] = useState("week");
  const [label, setLabel] = useState("");
  const [starts, setStarts] = useState("");
  const [ends, setEnds] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const [ps, rs, us] = await Promise.all([
      supabase.from("report_periods").select("*").order("starts_on", { ascending: false }).limit(40),
      supabase.from("reports").select("id, period_id, scope, unit_id, project_id, status, version, narrative, challenges, submitted_at, submitted_by, evidence"),
      supabase.from("units").select("id, name").eq("active", true).order("name"),
    ]);
    const loadError = ps.error || rs.error || us.error;
    if (loadError) {
      setMsg(loadError.message);
      setLoading(false);
      return;
    }
    setPeriods(ps.data || []); setReports(rs.data || []); setUnits(us.data || []);
    setLoading(false);
  }

  // Suggest a sensible label and dates so opening a week is one tap.
  function prefill(k) {
    setKind(k);
    const now = new Date();
    if (k === "week") {
      const d = new Date(now); const day = (d.getDay() + 6) % 7;      // Monday start
      const mon = new Date(d); mon.setDate(d.getDate() - day);
      const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
      const wk = Math.ceil((((mon - new Date(mon.getFullYear(), 0, 1)) / 86400000) + 1) / 7);
      setStarts(mon.toISOString().slice(0, 10));
      setEnds(sun.toISOString().slice(0, 10));
      setLabel("Week " + wk + " — " + mon.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
        + " – " + sun.toLocaleDateString("en-GB", { day: "numeric", month: "short" }));
    } else if (k === "month") {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setStarts(first.toISOString().slice(0, 10));
      setEnds(last.toISOString().slice(0, 10));
      setLabel(first.toLocaleDateString("en-GB", { month: "long", year: "numeric" }));
    } else if (k === "year") {
      setStarts(now.getFullYear() + "-01-01"); setEnds(now.getFullYear() + "-12-31");
      setLabel(String(now.getFullYear()));
    } else { setStarts(""); setEnds(""); setLabel(""); }
  }

  async function openPeriod() {
    setBusy(true); setMsg(null);
    try {
      if (!label.trim()) throw new Error("Give the period a name people will recognise.");
      if (!starts || !ends) throw new Error("Set the start and end dates.");
      if (ends < starts) throw new Error("The end date is before the start date.");
      const { error } = await supabase.from("report_periods").insert({
        org_id: me.org_id, kind, label: label.trim(), starts_on: starts, ends_on: ends, status: "open" });
      if (error) throw error;
      setSheet(null); setLabel(""); await load();
    } catch (e) { setMsg(e.message); } finally { setBusy(false); }
  }

  async function setStatus(p, status) {
    if (status === "closed" && !confirm("Close " + p.label + "? Managers will no longer be able to file or change reports for it.")) return;
    setBusy(true); setMsg(null);
    const { error } = await supabase.from("report_periods").update({ status }).eq("id", p.id);
    setBusy(false);
    if (error) { setMsg(error.message); return; }
    await load();
  }

  if (loading) return <div className="body"><div className="spin">Loading reporting...</div></div>;

  const nameOf = (id) => { const u = units.find((x) => x.id === id); return u ? u.name : "—"; };

  // Latest version per unit for a period — history is kept, this is the current one.
  function latestFor(periodId) {
    const inPeriod = reports.filter((r) => r.period_id === periodId && r.scope === "unit");
    const byUnit = {};
    inPeriod.forEach((r) => {
      if (!byUnit[r.unit_id] || r.version > byUnit[r.unit_id].version) byUnit[r.unit_id] = r;
    });
    return byUnit;
  }

  if (open) {
    const p = periods.find((x) => x.id === open);
    const byUnit = latestFor(open);
    const filed = units.filter((u) => byUnit[u.id] && byUnit[u.id].status !== "draft");
    const drafting = units.filter((u) => byUnit[u.id] && byUnit[u.id].status === "draft");
    const missing = units.filter((u) => !byUnit[u.id]);
    return (
      <div className="body">
        <button className="back" onClick={() => setOpen(null)}>← All periods</button>
        <div className="eyebrow">{(KINDS.find((k) => k[0] === p.kind) || ["","" ])[1]} · {p.status}</div>
        <h1 className="h1" style={{ marginTop: 6 }}>{p.label}</h1>
        <p className="screen-note">{dateOnly(p.starts_on)} — {dateOnly(p.ends_on)}</p>

        <section className="report-leadership-overview">
          <div className="report-period-title">
            <div><span>Leadership view</span><strong>Reporting coverage</strong></div>
            <small>{p.status === "open" ? "Period still open" : "Period closed"}</small>
          </div>
          <ProgressMeter value={filed.length} max={units.length} label="Submitted" detail={`${filed.length} of ${units.length} units`} />
          <StatusDistribution label="Reporting status by unit" segments={[
            { key:"filed", label:"Filed", value:filed.length, tone:"success" },
            { key:"draft", label:"Started", value:drafting.length, tone:"attention" },
            { key:"missing", label:"Nothing yet", value:missing.length, tone:"neutral" },
          ]} />
          <div className="report-leadership-facts">
            <div><b>{filed.length}</b><span>submitted</span></div>
            <div><b>{drafting.length}</b><span>drafts</span></div>
            <div><b>{missing.length}</b><span>outstanding</span></div>
            <div><b>{filed.filter((u) => byUnit[u.id]?.challenges).length}</b><span>reports with challenges</span></div>
          </div>
        </section>

        <SectionHeader eyebrow="Submitted reports" title="What units reported" count={filed.length} />
        {filed.length === 0 && <EmptyState compact title="Nobody has filed yet">Submitted unit reports will appear here with their narrative and recorded challenges.</EmptyState>}
        <div className="report-unit-grid">
          {filed.map((u) => {
            const r = byUnit[u.id];
            return <article key={u.id} className="report-unit-card">
              <div className="report-unit-card-head">
                <div><strong>{u.name}</strong><span>Submitted {r.submitted_at ? dateOnly(r.submitted_at) : "—"}{r.version > 1 ? ` · version ${r.version}` : ""}</span></div>
                <span className="pill p-green">Filed</span>
              </div>
              {r.narrative ? <p>{r.narrative}</p> : <small>No narrative was recorded.</small>}
              {r.challenges && <div className="report-challenge"><strong>Challenge recorded</strong><span>{r.challenges}</span></div>}
            </article>;
          })}
        </div>

        <section className="report-outstanding-section">
          <SectionHeader eyebrow="Follow-up" title="Still outstanding" count={drafting.length + missing.length} />
          {drafting.length === 0 && missing.length === 0
            ? <EmptyState compact title="Every unit has filed">There is no reporting follow-up required for this period.</EmptyState>
            : <div className="report-outstanding-grid">
                {drafting.map((u) => <div key={u.id} className="report-outstanding-row"><div><strong>{u.name}</strong><span>Draft saved, not submitted</span></div><span className="pill p-amber">Started</span></div>)}
                {missing.map((u) => <div key={u.id} className="report-outstanding-row"><div><strong>{u.name}</strong><span>No report recorded for this period</span></div><span className="pill p-grey">Nothing yet</span></div>)}
              </div>}
          <p className="screen-note">CEAC OS names the units that need follow-up rather than hiding them behind a single completion percentage.</p>
        </section>
      </div>);
  }

  const openPeriods = periods.filter((p) => p.status === "open");

  return (
    <div className="body">
      <div className="reporting-page-intro">
        <div className="eyebrow">Leadership reporting</div>
        <h1 className="h1">Reports</h1>
        <p className="screen-note">Open reporting periods, see coverage immediately, identify who still owes a report, and read unit narratives without rebuilding the picture elsewhere.</p>
      </div>

      {msg && !sheet && <ProductNotice tone="error" title="Reporting update">{msg}</ProductNotice>}
      <button className="btn wide-auto" style={{ marginTop: 16 }}
        onClick={() => { prefill("week"); setSheet("new"); setMsg(null); }}>Open a reporting period</button>

      {openPeriods.length === 0 && (
        <div className="flag flag-amber">
          <h4>No period is open</h4>
          Managers cannot file a report right now. Open a week or a month above.
        </div>)}

      <div className="sec"><span>Periods</span><span>{periods.length}</span></div>
      {periods.length === 0 && <div className="card small">None yet.</div>}
      {periods.map((p) => {
        const byUnit = latestFor(p.id);
        const filed = units.filter((u) => byUnit[u.id] && byUnit[u.id].status !== "draft").length;
        return (
          <article key={p.id} className="report-period-card">
            <div className="report-period-card-head">
              <div>
                <span>{(KINDS.find((k) => k[0] === p.kind) || ["",""])[1]}</span>
                <strong>{p.label}</strong>
                <small>{dateOnly(p.starts_on)} — {dateOnly(p.ends_on)}</small>
              </div>
              <span className={"pill " + (p.status === "open" ? "p-green" : "p-grey")}>{p.status}</span>
            </div>
            <ProgressMeter value={filed} max={units.length} label="Reporting coverage" detail={`${filed} of ${units.length} filed`} />
            <div className="report-period-actions">
              <button className="btn btn-ghost btn-sm" onClick={() => setOpen(p.id)}>Open report</button>
              {p.status === "open"
                ? <button className="btn btn-ghost btn-sm" onClick={() => setStatus(p, "closed")}>Close period</button>
                : <button className="btn btn-ghost btn-sm" onClick={() => setStatus(p, "open")}>Reopen</button>}
            </div>
          </article>);
      })}

      {sheet === "new" && (
        <Sheet onClose={() => setSheet(null)}>
          <div className="h2">Open a reporting period</div>
          <p className="screen-note">Managers file against this. The name is what they will see.</p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
            {KINDS.map(([k, l]) => (
              <button key={k} onClick={() => prefill(k)} style={{
                fontSize: 12.5, padding: "6px 12px", borderRadius: 20, border: "1px solid var(--line)",
                background: kind === k ? "var(--ink)" : "var(--card)",
                color: kind === k ? "#fff" : "var(--ink-soft)", fontWeight: kind === k ? 600 : 400 }}>{l}</button>))}
          </div>
          <input className="field" placeholder="What to call it" value={label} onChange={(e) => setLabel(e.target.value)} />
          <div style={{ display: "flex", gap: 8 }}>
            <input className="field" type="date" value={starts} onChange={(e) => setStarts(e.target.value)} />
            <input className="field" type="date" value={ends} onChange={(e) => setEnds(e.target.value)} />
          </div>
          {msg && <div className="flag flag-brick" style={{ marginTop: 12 }}>{msg}</div>}
          <button className="btn" style={{ marginTop: 14 }} onClick={openPeriod} disabled={busy}>
            {busy ? "Opening..." : "Open it"}</button>
        </Sheet>)}
    </div>);
}
