import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Chart, EmptyState, Icon, MapPin, QueueRow, Skeleton, Stat, StatRow, Table, Toast, byOldest } from "../components/primitives";
import ExperienceV2FoundationGallery from "../experience-v2/ExperienceV2FoundationGallery";

// Demonstration route for the design primitives.
//
// Everything below is loaded from the live database. Nothing is invented:
// a primitive proved with placeholder numbers is not proved at all, and
// the whole point of this route is that Gabriel can judge the direction
// against real CEAC data before any screen is rebuilt.
const money = (minor, cur) => (cur || "GHS") + " " +
  (Number(minor || 0) / 100).toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function DesignPrimitives({ me }) {
  const [d, setD] = useState(null);
  const [opened, setOpened] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const [units, people, work, leave, spend, office, sessions] = await Promise.all([
      supabase.from("units").select("id, name, code").eq("active", true).order("name"),
      supabase.from("profiles").select("id, full_name, active"),
      supabase.from("work_items").select("id, ref, title, status, due_at, created_at, unit_id, assignee_id"),
      supabase.from("leave_requests").select("id, kind, days, status, requested_at, start_date, profile_id"),
      supabase.from("spend_lines").select("id, unit_id, description, amount_minor, currency, spent_on"),
      supabase.from("office_locations").select("name, lat, lng, radius_meters").eq("is_primary", true).maybeSingle(),
      supabase.from("work_sessions").select("id, profile_id, started_at, ended_at, place"),
    ]);
    setD({
      units: units.data || [], people: people.data || [], work: work.data || [],
      leave: leave.data || [], spend: spend.data || [], office: office.data || null,
      sessions: sessions.data || [],
    });
  }

  if (!d) return <div className="body" style={{ paddingTop: 26 }}>
    <Skeleton block label="Loading CEAC design primitives" />
    <div style={{ marginTop: 12 }}><Skeleton lines={4} label="Loading CEAC data" /></div>
  </div>;

  const nameOf = (id) => (d.people.find((p) => p.id === id) || {}).full_name || "—";
  const unitOf = (id) => (d.units.find((u) => u.id === id) || {}).name || "—";
  const openWork = d.work.filter((w) => w !== null && w.status !== "completed" && w.status !== "cancelled");
  const pending = d.leave.filter((l) => l.status === "pending" || l.status === "escalated");
  const working = d.sessions.filter((s) => !s.ended_at);

  // Queue: leave awaiting a decision, plus work awaiting review. Oldest first.
  const queue = byOldest([
    ...pending.map((l) => ({ id: "l" + l.id, since: l.requested_at,
      title: nameOf(l.profile_id) + " · leave, " + l.days + " day" + (l.days === 1 ? "" : "s"),
      meta: l.kind + " · from " + l.start_date })),
    ...d.work.filter((w) => w.status === "in_review").map((w) => ({ id: "w" + w.id,
      since: w.created_at, title: w.title, meta: (w.ref || "") + " · " + nameOf(w.assignee_id) })),
  ]);

  // Work finished per unit — counted, never invented.
  const byUnit = d.units.map((u) => ({
    label: u.code || u.name.slice(0, 6),
    open: d.work.filter((w) => w.unit_id === u.id && w.status !== "completed" && w.status !== "cancelled").length,
    done: d.work.filter((w) => w.unit_id === u.id && w.status === "completed").length,
  })).filter((r) => r.open || r.done);

  const statusMix = ["not_started", "in_progress", "in_review", "waiting_on", "completed"]
    .map((s) => ({ label: s.replace(/_/g, " "), n: d.work.filter((w) => w.status === s).length }))
    .filter((r) => r.n);

  return (
    <div className="body">
      <div style={{ paddingTop: 26 }}>
        <h1 className="h1">Design primitives</h1>
        <p className="screen-note">
          Every figure, row and chart below is live CEAC data. Nothing here is a placeholder.
        </p>
      </div>

      <ExperienceV2FoundationGallery />

      <div className="sec"><span>Legacy/live CEAC primitive inspection</span></div>
      <div className="sec"><span>Stat — always a link</span></div>
      <StatRow>
        <Stat icon="gavel" label="Needs a decision" value={queue.length}
              tone={queue.length ? "late" : "ink"} onOpen={() => setOpened("queue")} />
        <Stat icon="work" label="Open work" value={openWork.length} onOpen={() => setOpened("work")} />
        <Stat icon="people" label="Working now" value={working.length}
              sub={"of " + d.people.filter((p) => p.active).length} onOpen={() => setOpened("who")} />
        <Stat icon="unit" label="Units" value={d.units.length} onOpen={() => setOpened("units")} />
      </StatRow>
      {opened && <Toast message={"Opened " + opened + " — this proves the interaction behind the figure or row."}
        tone="success" duration={0} onDismiss={() => setOpened(null)} />}

      <div className="sec"><span>Queue — age first, oldest first</span><span>{queue.length}</span></div>
      {queue.length === 0
        ? <EmptyState icon="check" title="Nothing is waiting on a decision right now." compact />
        : <div className="qlist">
            {queue.map((q) => (
              <QueueRow key={q.id} since={q.since} title={q.title} meta={q.meta}
                actions={<>
                  <button className="btn btn-ghost btn-sm">Decline</button>
                  <button className="btn btn-sm">Approve</button>
                </>} />))}
          </div>}

      <div className="sec"><span>Chart — paired bars, with a table toggle</span></div>
      <Chart kind="pairedBar" title="Unit" height={230}
        data={byUnit} series={[{ key: "open", label: "Open" }, { key: "done", label: "Finished" }]}
        ariaLabel="Open and finished work by unit"
        note="Counted from work items. A unit with open work and nothing finished is the thing to look at." />

      <div className="sec"><span>Chart — composition</span></div>
      <Chart kind="donut" title="Status" data={statusMix} series={[{ key: "n", label: "Work items" }]}
        ariaLabel="Work items by status" />

      <div className="sec"><span>Table — sortable, exportable</span></div>
      <Table exportName="ceac-work" rows={d.work.slice(0, 40)}
        empty="No work recorded yet."
        onRowClick={(row) => setOpened(row.ref || row.title || "work")}
        rowAriaLabel={(row) => "Open " + (row.ref || row.title || "work")}
        columns={[
          { key: "ref", label: "Ref", width: 110 },
          { key: "title", label: "Work" },
          { key: "unit_id", label: "Unit", render: (r) => unitOf(r.unit_id) },
          { key: "assignee_id", label: "Who", render: (r) => nameOf(r.assignee_id) },
          { key: "status", label: "Status", render: (r) => String(r.status).replace(/_/g, " ") },
        ]} />

      <div className="sec"><span>Table — money, right-aligned</span></div>
      <Table exportName="ceac-spend" rows={d.spend} empty="No spending recorded yet."
        columns={[
          { key: "spent_on", label: "Date", width: 110 },
          { key: "description", label: "What for" },
          { key: "unit_id", label: "Unit", render: (r) => unitOf(r.unit_id) },
          { key: "amount_minor", label: "Amount", align: "right",
            render: (r) => money(r.amount_minor, r.currency),
            sortValue: (r) => Number(r.amount_minor) || 0,
            csv: (r) => (Number(r.amount_minor) / 100).toFixed(2) },
        ]} />

      <div className="sec"><span>Icons — one weight, carrying meaning</span></div>
      <div className="card" style={{ display: "flex", gap: 16, flexWrap: "wrap", color: "var(--ink-soft)" }}>
        {["unit", "person", "people", "money", "project", "service", "work", "clock",
          "warning", "calendar", "location", "chart"].map((n) => (
          <span key={n} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12 }}>
            <Icon name={n} size={17} />{n}
          </span>))}
      </div>

      <div className="sec"><span>Map — where location is the point</span></div>
      <MapPin lat={d.office && d.office.lat} lng={d.office && d.office.lng}
        radius={d.office && d.office.radius_meters}
        label={d.office && d.office.name} />
    </div>);
}
