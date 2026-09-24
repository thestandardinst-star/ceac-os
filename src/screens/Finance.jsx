import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { dateOnly } from "../lib/time";
import { Sheet, ProgressMeter, ProductNotice, EmptyState, SectionHeader } from "../components/bits";
import FinanceRequestQueue from "../components/FinanceRequestQueue";
import { Stat, Chart, Table } from "../components/primitives";

// Finance — the whole church in one place. In, out, and what is moving
// between departments.
//
// Nothing here can be edited or deleted. A wrong figure is corrected by
// adding a reversing entry that points at the original, and both stay
// visible. Every entry keeps who recorded it and when, so a question in
// six months has a name and a date attached.
const CURRENCIES = [["GHS","GHS — Ghana cedi"],["USD","USD — US dollar"],["GBP","GBP — Pound sterling"],["EUR","EUR — Euro"],["NGN","NGN — Naira"],["ZAR","ZAR — Rand"],["CAD","CAD — Canadian dollar"]];
// Totals are never converted between currencies. A rate moves daily and a
// converted total is a figure nobody can check afterwards. Amounts are
// grouped by currency and shown side by side instead.
const money = (minor, cur) => (cur || "GHS") + " " + (Number(minor || 0) / 100).toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const toMinor = (s) => Math.round(parseFloat(String(s).replace(/[^0-9.]/g, "")) * 100);
function sumByCurrency(rows, { reversals = false } = {}) {
  const by = {};
  rows.forEach((r) => {
    const c = r.currency || "GHS";
    const amount = Number(r.amount_minor || 0);
    by[c] = (by[c] || 0) + (reversals && r.reverses_id ? -amount : amount);
  });
  return by;
}
function showTotals(by) {
  const keys = Object.keys(by);
  if (!keys.length) return money(0, "GHS");
  return keys.sort().map((c) => money(by[c], c)).join("  ·  ");
}

const TABS = [["overview","Overview"],["in","Money in"],["out","Money out"],["moving","Between departments"]];
const SOURCES = [["offering","Offering"],["partnership","Partnership"],["donation","Donation"],["event","Event"],["other","Other"]];

export default function Finance({ me, openExpenses }) {
  const [tab, setTab] = useState("overview");
  const [units, setUnits] = useState([]);
  const [income, setIncome] = useState([]);
  const [spend, setSpend] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [canEnter, setCanEnter] = useState(false);
  const [myUnits, setMyUnits] = useState([]);
  const [sheet, setSheet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const year = new Date().getFullYear();

  const [iDate, setIDate] = useState("");
  const [iKind, setIKind] = useState("offering");
  const [iDesc, setIDesc] = useState("");
  const [iAmount, setIAmount] = useState("");
  const [iSource, setISource] = useState("");
  const [iCur, setICur] = useState("GHS");

  const [tFrom, setTFrom] = useState("");
  const [tTo, setTTo] = useState("");
  const [tAmount, setTAmount] = useState("");
  const [tPurpose, setTPurpose] = useState("");
  const [tDate, setTDate] = useState("");
  const [tCur, setTCur] = useState("GHS");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const [us, inc, sp, tr, bg, mem] = await Promise.all([
      supabase.from("units").select("id, name, code, handles_finance").eq("active", true).order("name"),
      supabase.from("income_lines").select("id, received_on, source_kind, description, amount_minor, source_note, reverses_id, entered_at, currency"),
      supabase.from("spend_lines").select("id, unit_id, spent_on, description, amount_minor, source_note, reverses_id, currency"),
      supabase.from("internal_transfers").select("id, from_unit_id, to_unit_id, amount_minor, sent_on, purpose, state, response_note, sent_at, currency"),
      supabase.from("budgets").select("unit_id, project_id, year, amount_minor, currency").eq("year", year),
      supabase.from("unit_memberships").select("unit_id, role, units(name, handles_finance)").eq("profile_id", me.id),
    ]);
    setUnits(us.data || []); setIncome(inc.data || []); setSpend(sp.data || []);
    setTransfers(tr.data || []); setBudgets(bg.data || []);
    const mine = (mem.data || []);
    setMyUnits(mine.filter((m) => m.role === "manager").map((m) => m.unit_id));
    setCanEnter(me.is_admin || mine.some((m) => m.units && m.units.handles_finance));
    setLoading(false);
  }

  const nameOf = (id) => { const u = units.find((x) => x.id === id); return u ? u.name : "Central church funds"; };
  const inBy = sumByCurrency(income), outBy = sumByCurrency(spend, { reversals: true }), budBy = sumByCurrency(budgets);
  const diffBy = {};
  [...new Set([...Object.keys(inBy), ...Object.keys(outBy)])].forEach((c) => { diffBy[c] = (inBy[c] || 0) - (outBy[c] || 0); });
  const unconfirmed = transfers.filter((t) => t.state === "sent");
  const disputed = transfers.filter((t) => t.state === "disputed");
  const financeCurrencies = [...new Set([...Object.keys(inBy), ...Object.keys(outBy), ...Object.keys(budBy)])].sort();

  async function saveIncome() {
    setBusy(true); setMsg(null);
    try {
      if (!iDesc.trim()) throw new Error("Say what this money was.");
      const amount = toMinor(iAmount);
      if (!amount) throw new Error("Enter an amount in cedis.");
      const { error } = await supabase.from("income_lines").insert({
        org_id: me.org_id, received_on: iDate || new Date().toISOString().slice(0, 10),
        source_kind: iKind, description: iDesc.trim(), amount_minor: amount,
        source_note: iSource.trim() || null, currency: iCur, entered_by: me.id });
      if (error) throw error;
      setSheet(null); setIDesc(""); setIAmount(""); setISource(""); await load();
    } catch (e) { setMsg(e.message); } finally { setBusy(false); }
  }

  async function saveTransfer() {
    setBusy(true); setMsg(null);
    try {
      if (!tTo) throw new Error("Choose which department is receiving.");
      if (tFrom && tFrom === tTo) throw new Error("A department cannot send money to itself.");
      const amount = toMinor(tAmount);
      if (!amount) throw new Error("Enter an amount in cedis.");
      if (!tPurpose.trim()) throw new Error("Say what the money is for.");
      const { error } = await supabase.from("internal_transfers").insert({
        org_id: me.org_id, from_unit_id: tFrom || null, to_unit_id: tTo,
        amount_minor: amount, sent_on: tDate || new Date().toISOString().slice(0, 10),
        purpose: tPurpose.trim(), currency: tCur, sent_by: me.id });
      if (error) throw error;
      setSheet(null); setTAmount(""); setTPurpose(""); await load();
    } catch (e) { setMsg(e.message); } finally { setBusy(false); }
  }

  async function respond(t, state, note) {
    const { error } = await supabase.from("internal_transfers").update({
      state, responded_by: me.id, responded_at: new Date().toISOString(),
      response_note: note || null }).eq("id", t.id);
    if (error) {
      setMsg(error.message || "The transfer decision could not be saved.");
      return;
    }
    await load();
  }

  if (loading) return <div className="body"><div className="spin">Loading finance...</div></div>;

  return (
    <div className="body">
      <div className="finance-page-intro">
        <div className="eyebrow">Organisation finance</div>
        <h1 className="h1">Finance</h1>
        <p className="screen-note">See recorded income, spend, budgets and unresolved transfers without combining currencies or pretending the ledger is a bank balance.</p>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 16 }}>
        {TABS.map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            fontSize: 12.5, padding: "6px 12px", borderRadius: 20, border: "1px solid var(--line)",
            background: tab === k ? "var(--ink)" : "var(--card)",
            color: tab === k ? "#fff" : "var(--ink-soft)", fontWeight: tab === k ? 600 : 400,
          }}>{label}</button>))}
      </div>

      {(unconfirmed.length > 0 || disputed.length > 0) && tab === "overview" && (
        <div className={"flag " + (disputed.length ? "flag-brick" : "flag-amber")}>
          <h4>{unconfirmed.length} transfer{unconfirmed.length === 1 ? "" : "s"} not yet confirmed{disputed.length ? ", " + disputed.length + " disputed" : ""}</h4>
          Money is only properly recorded once the receiving department confirms it. Open Between departments.
        </div>)}

      {tab === "overview" && (<>
        <FinanceRequestQueue me={me} authority="admin" canFulfil title="Requests needing Administration" />
        <SectionHeader eyebrow={String(year)} title="Financial position by currency" />
        <div className="finance-currency-grid">
          {financeCurrencies.length === 0 && <EmptyState compact title="No finance records yet">Income, spend and budget records will build this view automatically.</EmptyState>}
          {financeCurrencies.map((currency) => {
            const received = Number(inBy[currency] || 0);
            const spent = Number(outBy[currency] || 0);
            const budgeted = Number(budBy[currency] || 0);
            const difference = received - spent;
            return <article className="finance-currency-card" key={currency}>
              <div className="finance-currency-card-head"><div><span>Currency</span><strong>{currency}</strong></div><small>{year}</small></div>
              <div className="finance-currency-facts">
                <Stat icon="money" label="Received" value={money(received,currency)} onOpen={() => setTab("in")} />
                <Stat icon="money" label="Spent" value={money(spent,currency)} onOpen={() => setTab("out")} />
                <Stat icon="chart" label="Budgeted" value={money(budgeted,currency)} onOpen={() => setTab("overview")} />
                <Stat icon="chart" label="Recorded in minus out" value={money(difference,currency)}
                      tone={difference < 0 ? "late" : "ink"} onOpen={() => setTab("overview")} />
              </div>
              {budgeted > 0 && <ProgressMeter value={spent} max={budgeted} label="Spend against recorded budget" detail={money(spent,currency) + " of " + money(budgeted,currency)} />}
              {budgeted > 0 && spent > budgeted && <ProductNotice tone="attention" title="Recorded spend is above recorded budget">Open the department rows below before drawing a conclusion.</ProductNotice>}
            </article>;
          })}
        </div>
        <p className="screen-note">Recorded in minus recorded out is not a bank balance and does not include opening balances or unrecorded activity. Currencies are never converted into one another.</p>

        <SectionHeader eyebrow="Departments" title="Where money is moving" />
        <div className="finance-unit-grid">
        {units.map((u) => {
          const outB = sumByCurrency(spend.filter((s) => s.unit_id === u.id), { reversals: true });
          const gotB = sumByCurrency(transfers.filter((x) => x.to_unit_id === u.id && x.state === "confirmed"));
          const budB = sumByCurrency(budgets.filter((b) => b.unit_id === u.id));
          const out = Object.keys(outB).length, got = Object.keys(gotB).length, bud = Object.keys(budB).length;
          if (!out && !got && !bud) return null;
          return (
            <article key={u.id} className="finance-unit-card">
              <div className="finance-unit-card-head"><strong>{u.name}</strong><span>{showTotals(outB)} spent</span></div>
              <div className="finance-unit-card-meta">
                <span>{bud ? showTotals(budB) + " budget recorded" : "No budget recorded"}</span>
                {got ? <span>{showTotals(gotB)} confirmed transfers received</span> : <span>No confirmed transfers received</span>}
              </div>
            </article>);
        })}
        </div>
        {units.every((u) => !spend.some((s) => s.unit_id === u.id)) &&
          <EmptyState compact title="No department spend recorded">Expense entries will appear here once they are recorded against a department.</EmptyState>}
      </>)}

      {tab === "in" && (<>
        {canEnter && <button className="btn wide-auto" style={{ marginTop: 14 }} onClick={() => { setSheet("income"); setMsg(null); }}>Record money received</button>}
        <div className="sec"><span>Money received</span><span>{showTotals(inBy)}</span></div>
        {income.length === 0 && <div className="card small">Nothing recorded yet. Finance records offerings, partnerships, donations and event income here.</div>}
        {income.sort((a, b) => b.received_on.localeCompare(a.received_on)).map((r) => (
          <div key={r.id} className="row">
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <div className="row-t">{r.description}</div>
              <div className="row-t">{money(r.amount_minor, r.currency)}</div>
            </div>
            <div className="row-m">
              {dateOnly(r.received_on)} · {(SOURCES.find((s) => s[0] === r.source_kind) || ["", r.source_kind])[1]}
              {r.source_note ? " · from " + r.source_note : ""}
              {r.reverses_id ? " · correction" : ""}
            </div>
          </div>))}
      </>)}

      {tab === "out" && (<>
        <div className="sec"><span>Money spent</span><span>{showTotals(outBy)}</span></div>
        <div className="finance-expense-intro"><p className="small">Actual spend stays separate from requests and transfers. Record an expense against the department and source record it belongs to.</p>{openExpenses&&<button className="btn btn-ghost btn-sm" onClick={openExpenses}>Open Expenses</button>}</div>
        <Table exportName="ceac-spending" rows={spend} empty="Nothing recorded yet."
          columns={[
            { key: "spent_on", label: "Date", width: 104, render: (r) => dateOnly(r.spent_on) },
            { key: "description", label: "What for" },
            { key: "unit_id", label: "Department", render: (r) => nameOf(r.unit_id) },
            { key: "source_note", label: "From", render: (r) => r.source_note || "—" },
            { key: "amount_minor", label: "Amount", align: "right",
              render: (r) => money(r.amount_minor, r.currency),
              sortValue: (r) => Number(r.amount_minor) || 0,
              csv: (r) => (Number(r.amount_minor) / 100).toFixed(2) },
          ]} />
      </>)}

      {tab === "moving" && (<>
        {(canEnter || myUnits.length > 0) &&
          <button className="btn wide-auto" style={{ marginTop: 14 }} onClick={() => { setSheet("transfer"); setMsg(null); }}>Record money sent</button>}
        <div className="flag flag-green">
          <h4>Why this has two sides</h4>
          The department sending records it. Only the department receiving can confirm it. Until both agree it stands as unconfirmed, and both can see it. One person's word is not a record where money is concerned.
        </div>
        <div className="sec"><span>Between departments</span><span>{transfers.length}</span></div>
        {transfers.length === 0 && <div className="card small">Nothing recorded yet.</div>}
        {transfers.sort((a, b) => b.sent_on.localeCompare(a.sent_on)).map((t) => {
          const mineToConfirm = t.state === "sent" && (me.is_admin || myUnits.includes(t.to_unit_id));
          return (
            <div key={t.id} className="row">
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <div className="row-t">{nameOf(t.from_unit_id)} → {nameOf(t.to_unit_id)}</div>
                <div className="row-t">{money(t.amount_minor, t.currency)}</div>
              </div>
              <div className="row-m">{dateOnly(t.sent_on)} · {t.purpose}</div>
              {t.response_note && <div className="row-note">They said: {t.response_note}</div>}
              <div style={{ marginTop: 7 }}>
                <span className={"pill " + (t.state === "confirmed" ? "p-green" : t.state === "disputed" ? "p-brick" : "p-amber")}>
                  {t.state === "confirmed" ? "Confirmed by them" : t.state === "disputed" ? "They disagree" : "Waiting for them to confirm"}
                </span>
              </div>
              {mineToConfirm && (
                <div style={{ display: "flex", gap: 7, marginTop: 10 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => { const n = prompt("What is different? Both accounts stay visible."); if (n) respond(t, "disputed", n); }}>That is not right</button>
                  <button className="btn btn-sm" onClick={() => respond(t, "confirmed")}>We received this</button>
                </div>)}
            </div>);
        })}
      </>)}

      {sheet === "income" && (
        <Sheet onClose={() => setSheet(null)}>
          <div className="h2">Record money received</div>
          <p className="screen-note">Money coming into the church from outside. This cannot be edited afterwards, so check the amount.</p>
          <select className="field" value={iKind} onChange={(e) => setIKind(e.target.value)}>
            {SOURCES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          <input className="field" placeholder="What this money was" value={iDesc} onChange={(e) => setIDesc(e.target.value)} />
          <div style={{ display: "flex", gap: 8 }}>
            <input className="field" type="date" value={iDate} onChange={(e) => setIDate(e.target.value)} />
            <input className="field" inputMode="decimal" placeholder="Amount" value={iAmount} onChange={(e) => setIAmount(e.target.value)} />
            <select className="field" value={iCur} onChange={(e) => setICur(e.target.value)} style={{ maxWidth: 110 }}>
              {CURRENCIES.map(([c]) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <input className="field" placeholder="Which book or record this came from" value={iSource} onChange={(e) => setISource(e.target.value)} />
          {msg && <div className="flag flag-brick" style={{ marginTop: 12 }}>{msg}</div>}
          <button className="btn" style={{ marginTop: 14 }} onClick={saveIncome} disabled={busy}>{busy ? "Saving..." : "Record it"}</button>
        </Sheet>)}

      {sheet === "transfer" && (
        <Sheet onClose={() => setSheet(null)}>
          <div className="h2">Record money sent</div>
          <p className="screen-note">The receiving department will be asked to confirm. This cannot be edited afterwards.</p>
          <select className="field" value={tFrom} onChange={(e) => setTFrom(e.target.value)}>
            <option value="">From central church funds</option>
            {units.filter((u) => me.is_admin || canEnter || myUnits.includes(u.id)).map((u) => <option key={u.id} value={u.id}>From {u.name}</option>)}
          </select>
          <select className="field" value={tTo} onChange={(e) => setTTo(e.target.value)}>
            <option value="">Which department is receiving</option>
            {units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <input className="field" placeholder="What the money is for" value={tPurpose} onChange={(e) => setTPurpose(e.target.value)} />
          <div style={{ display: "flex", gap: 8 }}>
            <input className="field" type="date" value={tDate} onChange={(e) => setTDate(e.target.value)} />
            <input className="field" inputMode="decimal" placeholder="Amount" value={tAmount} onChange={(e) => setTAmount(e.target.value)} />
            <select className="field" value={tCur} onChange={(e) => setTCur(e.target.value)} style={{ maxWidth: 110 }}>
              {CURRENCIES.map(([c]) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {msg && <div className="flag flag-brick" style={{ marginTop: 12 }}>{msg}</div>}
          <button className="btn" style={{ marginTop: 14 }} onClick={saveTransfer} disabled={busy}>{busy ? "Saving..." : "Record it"}</button>
        </Sheet>)}
    </div>);
}
