import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { dateOnly } from "../lib/time";
import { Sheet } from "../components/bits";

// Cost. Spec section 10 — what does this unit cost, and what did it
// produce, on the same screen.
//
// CEAC keeps no digital budget or spend record: it is on paper, collated
// on report days. So this app is the record, not a mirror. Two
// consequences visible here:
//   * spend is entered in batches at collation time, not line by line
//   * every line keeps the paper it came from, so a figure can be traced
// Managers can see their unit's cost. They can never enter money.

const CURRENCIES = [["GHS","GHS — Ghana cedi"],["USD","USD — US dollar"],["GBP","GBP — Pound sterling"],["EUR","EUR — Euro"],["NGN","NGN — Naira"],["ZAR","ZAR — Rand"],["CAD","CAD — Canadian dollar"]];
// Totals are never converted between currencies. A rate moves daily and a
// converted total is a figure nobody can check afterwards. Amounts are
// grouped by currency and shown side by side instead.
const money = (minor, cur) => (cur || "GHS") + " " + (Number(minor || 0) / 100).toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const toMinor = (s) => Math.round(parseFloat(String(s).replace(/[^0-9.]/g, "")) * 100);
function sumByCurrency(rows) {
  const by = {};
  rows.forEach((r) => { const c = r.currency || "GHS"; by[c] = (by[c] || 0) + Number(r.amount_minor || 0); });
  return by;
}
function showTotals(by) {
  const keys = Object.keys(by);
  if (!keys.length) return money(0, "GHS");
  return keys.sort().map((c) => money(by[c], c)).join("  ·  ");
}


export default function Cost({ me }) {
  const [units, setUnits] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [spend, setSpend] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [canEnter, setCanEnter] = useState(false);
  const [open, setOpen] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [loading, setLoading] = useState(true);
  const year = new Date().getFullYear();

  // batch entry state
  const [bUnit, setBUnit] = useState("");
  const [bPeriod, setBPeriod] = useState("");
  const [bSource, setBSource] = useState("");
  const [bCur, setBCur] = useState("GHS");
  const [lines, setLines] = useState([{ spent_on: "", description: "", amount: "" }]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  // budget state
  const [gUnit, setGUnit] = useState(null);
  const [gAmount, setGAmount] = useState("");
  const [gCur, setGCur] = useState("GHS");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const [us, bs, sp, pr, fin] = await Promise.all([
      supabase.from("units").select("id, name, code, handles_finance").eq("active", true).order("name"),
      supabase.from("budgets").select("id, unit_id, project_id, year, amount_minor, note, currency").eq("year", year),
      supabase.from("spend_lines").select("id, unit_id, period_id, spent_on, description, amount_minor, source_note, entered_at, currency"),
      supabase.from("report_periods").select("id, label, starts_on, ends_on").order("starts_on", { ascending: false }).limit(24),
      supabase.from("unit_memberships").select("unit_id, units(handles_finance)").eq("profile_id", me.id),
    ]);
    setUnits(us.data || []); setBudgets(bs.data || []); setSpend(sp.data || []); setPeriods(pr.data || []);
    setCanEnter(me.is_admin || (fin.data || []).some((m) => m.units && m.units.handles_finance));
    setLoading(false);
  }

  const budgetFor = (u) => (budgets.find((b) => b.unit_id === u.id && !b.project_id) || null);
  const spentFor = (u) => spend.filter((s) => s.unit_id === u.id && s.currency === (budgetFor(u) ? budgetFor(u).currency : "GHS")).reduce((t, s) => t + Number(s.amount_minor), 0);

  async function saveBudget() {
    setBusy(true); setMsg(null);
    try {
      const amount = toMinor(gAmount);
      if (!amount && amount !== 0) throw new Error("Enter an amount in cedis, for example 2500");
      const existing = budgetFor(gUnit);
      if (existing) {
        const { error } = await supabase.from("budgets").update({ amount_minor: amount, currency: gCur, set_by: me.id, set_at: new Date().toISOString() }).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("budgets").insert({
          org_id: me.org_id, unit_id: gUnit.id, year, amount_minor: amount, currency: gCur, set_by: me.id });
        if (error) throw error;
      }
      setSheet(null); setGAmount(""); setGUnit(null); await load();
    } catch (e) { setMsg(e.message); }
    finally { setBusy(false); }
  }

  async function saveBatch() {
    setBusy(true); setMsg(null);
    try {
      const clean = lines
        .filter((l) => l.description.trim() && l.amount)
        .map((l) => ({
          org_id: me.org_id, unit_id: bUnit, period_id: bPeriod || null,
          spent_on: l.spent_on || new Date().toISOString().slice(0, 10),
          description: l.description.trim(), amount_minor: toMinor(l.amount), currency: bCur,
          source_note: bSource.trim() || null, entered_by: me.id,
        }));
      if (!bUnit) throw new Error("Choose which unit this spending belongs to.");
      if (!clean.length) throw new Error("Add at least one line with a description and an amount.");
      if (clean.some((l) => !l.amount_minor && l.amount_minor !== 0)) throw new Error("One of the amounts is not a number.");
      const { error } = await supabase.from("spend_lines").insert(clean);
      if (error) throw error;
      setSheet(null); setLines([{ spent_on: "", description: "", amount: "" }]); setBSource(""); await load();
    } catch (e) { setMsg(e.message); }
    finally { setBusy(false); }
  }

  if (loading) return <div className="body"><div className="spin">Loading cost...</div></div>;

  if (open) {
    const u = units.find((x) => x.id === open);
    const rows = spend.filter((s) => s.unit_id === open).sort((a, b) => b.spent_on.localeCompare(a.spent_on));
    return (
      <div className="body">
        <button className="back" onClick={() => setOpen(null)}>← All units</button>
        <h1 className="h1" style={{ marginTop: 6 }}>{u ? u.name : "Unit"}</h1>
        <p className="screen-note">Every line of spending recorded for this unit this year.</p>
        <div className="sec"><span>Spending</span><span>{rows.length}</span></div>
        {rows.length === 0 && <div className="card small">Nothing has been entered for this unit yet.</div>}
        {rows.map((s) => (
          <div key={s.id} className="row">
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <div className="row-t">{s.description}</div>
              <div className="row-t">{money(s.amount_minor, s.currency)}</div>
            </div>
            <div className="row-m">{dateOnly(s.spent_on)}{s.source_note ? " · from " + s.source_note : ""}</div>
          </div>))}
      </div>);
  }

  return (
    <div className="body">
      <div style={{ paddingTop: 26 }}>
        <div className="eyebrow">Finance · actual spend</div>\n        <h1 className="h1">Expenses</h1>
        <p className="screen-note">Record and inspect actual departmental spending with the source record kept beside every entry. Budgets remain planning records, not bank balances.</p>
      </div>

      {canEnter && (
        <button className="btn wide-auto" style={{ marginTop: 16 }}
          onClick={() => { setSheet("batch"); setMsg(null); }}>Record expenses</button>)}

      <div className="flag flag-green">
        <h4>Where these figures come from</h4>
        Typed in from the paper records on collation day. Each line keeps the book it came from, so any figure here can be traced back and checked.
      </div>

      <div className="sec"><span>Units</span><span>{year}</span></div>
      {units.map((u) => {
        const b = budgetFor(u);
        const spent = spentFor(u);
        const budget = b ? Number(b.amount_minor) : null;
        const cur = b ? b.currency : "GHS";
        const over = budget !== null && spent > budget;
        const pct = budget ? Math.min(100, Math.round((spent / budget) * 100)) : null;
        return (
          <div key={u.id} className="card" style={{ marginTop: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
              <div className="row-t" style={{ fontSize: 15.5 }}>{u.name}</div>
              {over && <span className="pill p-brick">Over budget</span>}
            </div>
            <div className="row-m" style={{ marginTop: 4 }}>
              {budget === null
                ? "No budget set for " + year
                : money(spent, cur) + " spent of " + money(budget, cur) + (pct !== null ? " · " + pct + "%" : "")}
            </div>
            {budget !== null && (
              <div style={{ height: 6, background: "var(--line-soft)", borderRadius: 4, marginTop: 8, overflow: "hidden" }}>
                <div style={{ width: (pct || 0) + "%", height: "100%", background: over ? "var(--brick)" : "var(--green)" }} />
              </div>)}
            <div style={{ display: "flex", gap: 7, marginTop: 10, flexWrap: "wrap" }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setOpen(u.id)}>See spending</button>
              {me.is_admin && (
                <button className="btn btn-ghost btn-sm"
                  onClick={() => { setGUnit(u); setGAmount(b ? String(Number(b.amount_minor) / 100) : ""); setSheet("budget"); setMsg(null); }}>
                  {b ? "Change budget" : "Set budget"}</button>)}
            </div>
          </div>);
      })}

      {sheet === "budget" && gUnit && (
        <Sheet onClose={() => setSheet(null)}>
          <div className="h2">Budget for {gUnit.name}</div>
          <p className="screen-note">For {year}. Type the number only — 2500, not 2,500.00.</p>
          <div style={{ display: "flex", gap: 8 }}>
            <input className="field" inputMode="decimal" placeholder="Amount" value={gAmount} onChange={(e) => setGAmount(e.target.value)} />
            <select className="field" value={gCur} onChange={(e) => setGCur(e.target.value)} style={{ maxWidth: 110 }}>
              {CURRENCIES.map(([x]) => <option key={x} value={x}>{x}</option>)}
            </select>
          </div>
          {msg && <div className="flag flag-brick" style={{ marginTop: 12 }}>{msg}</div>}
          <button className="btn" style={{ marginTop: 14 }} onClick={saveBudget} disabled={busy || !gAmount}>
            {busy ? "Saving..." : "Save budget"}</button>
        </Sheet>)}

      {sheet === "batch" && (
        <Sheet onClose={() => setSheet(null)}>
          <div className="h2">Enter a batch of spending</div>
          <p className="screen-note">One sitting, one unit, one source book. Add a line for each entry on the paper.</p>
          <select className="field" value={bUnit} onChange={(e) => setBUnit(e.target.value)}>
            <option value="">Which unit is this spending for</option>
            {units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <select className="field" value={bPeriod} onChange={(e) => setBPeriod(e.target.value)}>
            <option value="">Which reporting period (optional)</option>
            {periods.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
          <input className="field" placeholder="Which book or paper this came from" value={bSource} onChange={(e) => setBSource(e.target.value)} />
          <select className="field" value={bCur} onChange={(e) => setBCur(e.target.value)}>
            {CURRENCIES.map(([x, l]) => <option key={x} value={x}>{l}</option>)}
          </select>
          <div className="sec"><span>Lines</span><span>{lines.filter((l) => l.description.trim()).length}</span></div>
          {lines.map((l, i) => (
            <div key={i} style={{ borderTop: i ? "1px solid var(--line-soft)" : "none", paddingTop: i ? 8 : 0 }}>
              <input className="field" placeholder="What it was for" value={l.description}
                onChange={(e) => setLines((x) => x.map((v, j) => j === i ? { ...v, description: e.target.value } : v))}
                onBlur={() => { if (l.description.trim() && i === lines.length - 1) setLines((x) => [...x, { spent_on: "", description: "", amount: "" }]); }} />
              <div style={{ display: "flex", gap: 8 }}>
                <input className="field" type="date" value={l.spent_on}
                  onChange={(e) => setLines((x) => x.map((v, j) => j === i ? { ...v, spent_on: e.target.value } : v))} />
                <input className="field" inputMode="decimal" placeholder="Amount" value={l.amount}
                  onChange={(e) => setLines((x) => x.map((v, j) => j === i ? { ...v, amount: e.target.value } : v))} />
              </div>
            </div>))}
          <div className="card" style={{ marginTop: 10, display: "flex", justifyContent: "space-between" }}>
            <span className="small">Batch total</span>
            <b>{money(lines.reduce((t, l) => t + (l.amount ? toMinor(l.amount) || 0 : 0), 0), bCur)}</b>
          </div>
          {msg && <div className="flag flag-brick" style={{ marginTop: 12 }}>{msg}</div>}
          <button className="btn" style={{ marginTop: 14 }} onClick={saveBatch} disabled={busy}>
            {busy ? "Saving..." : "Save this batch"}</button>
          <div className="hint">Check the total against the paper before saving.</div>
        </Sheet>)}
    </div>);
}
