import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { EmptyState, FieldGroup, ProductNotice, SectionHeader, Sheet } from "./bits";
import { Table } from "./primitives";

const todayKey = () => new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Accra" });

export default function MinistryNumbers({ me, allowConfigure = false, compact = false }) {
  const [operations, setOperations] = useState([]);
  const [occurrences, setOccurrences] = useState([]);
  const [recording, setRecording] = useState(null);
  const [configuring, setConfiguring] = useState(false);
  const [value, setValue] = useState("");
  const [occurredOn, setOccurredOn] = useState(todayKey());
  const [note, setNote] = useState("");
  const [name, setName] = useState("");
  const [valueLabel, setValueLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => { load(); }, [me.id, me.unit_id]);

  async function load() {
    setError(null);
    const operationResult = await supabase
      .from("recurring_operations")
      .select("id,name,cadence,records_value,value_label,active")
      .eq("unit_id", me.unit_id)
      .eq("active", true)
      .eq("records_value", true)
      .order("name");
    if (operationResult.error) { setError(operationResult.error.message); return; }
    const rows = operationResult.data || [];
    setOperations(rows);
    if (!rows.length) { setOccurrences([]); return; }

    const occurrenceResult = await supabase
      .from("operation_occurrences")
      .select("id,operation_id,occurred_on,value,note,created_at,recorded_by")
      .in("operation_id", rows.map((row) => row.id))
      .order("occurred_on", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(150);
    if (occurrenceResult.error) { setError(occurrenceResult.error.message); return; }
    setOccurrences(occurrenceResult.data || []);
  }

  const operationById = useMemo(
    () => new Map(operations.map((operation) => [operation.id, operation])),
    [operations],
  );

  const latestByOperation = useMemo(() => {
    const map = new Map();
    occurrences.forEach((row) => {
      if (!map.has(row.operation_id)) map.set(row.operation_id, row);
    });
    return map;
  }, [occurrences]);

  async function saveOccurrence() {
    if (!recording || value === "") return;
    setBusy(true); setError(null); setNotice(null);
    try {
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) throw new Error("Enter a valid number.");
      const { error: insertError } = await supabase.from("operation_occurrences").insert({
        org_id: me.org_id,
        operation_id: recording.id,
        occurred_on: occurredOn,
        value: numeric,
        note: note.trim() || null,
        recorded_by: me.id,
      });
      if (insertError) throw insertError;
      setRecording(null); setValue(""); setNote(""); setOccurredOn(todayKey());
      setNotice(`${recording.name} recorded.`);
      await load();
    } catch (err) {
      setError(err.message || "The ministry number could not be recorded.");
    } finally {
      setBusy(false);
    }
  }

  async function saveOperation() {
    if (!allowConfigure || !name.trim() || !valueLabel.trim()) return;
    setBusy(true); setError(null); setNotice(null);
    try {
      const { error: createError } = await supabase.rpc("create_ministry_number", {
        p_unit_id: me.unit_id,
        p_name: name.trim(),
        p_value_label: valueLabel.trim(),
      });
      if (createError) throw createError;
      setConfiguring(false); setName(""); setValueLabel("");
      setNotice("Ministry number added.");
      await load();
    } catch (err) {
      setError(err.message || "The ministry number could not be added.");
    } finally {
      setBusy(false);
    }
  }

  if (!operations.length && !allowConfigure && !error) return null;

  const tableRows = occurrences.map((row) => ({
    ...row,
    operation_name: operationById.get(row.operation_id)?.name || "Recorded number",
    value_label: operationById.get(row.operation_id)?.value_label || "Value",
  }));

  return <section className={compact ? "home-panel home-panel-secondary" : "card"} style={{ marginTop: 16 }}>
    <SectionHeader
      eyebrow="Ministry record"
      title="Recurring numbers"
      count={operations.length || undefined}
      action={allowConfigure ? <button className="btn btn-ghost btn-sm" onClick={() => setConfiguring(true)}>Add number</button> : null}
    />
    <p className="screen-note">Record what the unit actually did. CEAC OS does not infer a score or invent a reporting cadence.</p>

    {error && <ProductNotice tone="error" title="Ministry record could not load">{error}</ProductNotice>}
    {notice && <ProductNotice tone="success" title="Saved">{notice}</ProductNotice>}

    {!error && operations.length === 0 && <EmptyState compact title="No recurring ministry numbers yet">
      {allowConfigure ? "Add the first number this unit needs to record." : "Your Unit Head can add the numbers this unit records."}
    </EmptyState>}

    {operations.length > 0 && <div className="admin-unit-summary-grid" style={{ marginTop: 10 }}>
      {operations.map((operation) => {
        const latest = latestByOperation.get(operation.id);
        return <div className="admin-unit-summary" key={operation.id}>
          <div><strong>{operation.name}</strong></div>
          <span>{operation.value_label}</span>
          <small>{latest
            ? `Latest: ${Number(latest.value).toLocaleString("en-GH")} · ${latest.occurred_on}`
            : "Nothing recorded yet"}</small>
          <button className="text-action" onClick={() => { setRecording(operation); setValue(""); setNote(""); setOccurredOn(todayKey()); }}>Record</button>
        </div>;
      })}
    </div>}

    {!compact && operations.length > 0 && <div style={{ marginTop: 14 }}>
      <Table
        rows={tableRows}
        empty="No ministry numbers have been recorded yet."
        exportName="ceac-ministry-numbers"
        columns={[
          { key: "occurred_on", label: "Date", width: 110 },
          { key: "operation_name", label: "Number" },
          { key: "value", label: "Value", align: "right", sortValue: (row) => Number(row.value) || 0,
            render: (row) => `${Number(row.value).toLocaleString("en-GH")} ${row.value_label}`,
            csv: (row) => row.value },
          { key: "note", label: "Context", render: (row) => row.note || "—" },
        ]}
      />
    </div>}

    {recording && <Sheet onClose={() => !busy && setRecording(null)}>
      <div className="eyebrow">Ministry record</div>
      <div className="h2">{recording.name}</div>
      <p className="screen-note">Record the number CEAC actually observed. Earlier entries remain unchanged.</p>
      <FieldGroup label={recording.value_label || "Value"}>
        <input className="field" type="number" step="any" inputMode="decimal" value={value} onChange={(event) => setValue(event.target.value)} />
      </FieldGroup>
      <FieldGroup label="Date">
        <input className="field" type="date" value={occurredOn} onChange={(event) => setOccurredOn(event.target.value)} />
      </FieldGroup>
      <FieldGroup label="Context" hint="Optional. Add only what helps someone interpret this entry later.">
        <textarea className="field" rows={3} value={note} onChange={(event) => setNote(event.target.value)} />
      </FieldGroup>
      <button className="btn" style={{ marginTop: 14 }} disabled={busy || value === "" || !occurredOn} onClick={saveOccurrence}>{busy ? "Saving…" : "Record number"}</button>
    </Sheet>}

    {configuring && <Sheet onClose={() => !busy && setConfiguring(false)}>
      <div className="eyebrow">Ministry record</div>
      <div className="h2">Add a recurring number</div>
      <p className="screen-note">Name the thing the unit already records. Do not create a score. CEAC OS learns the rhythm from actual entries.</p>
      <FieldGroup label="What are you recording?">
        <input className="field" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. First timers" />
      </FieldGroup>
      <FieldGroup label="What does the number mean?">
        <input className="field" value={valueLabel} onChange={(event) => setValueLabel(event.target.value)} placeholder="e.g. People received" />
      </FieldGroup>
      <button className="btn" style={{ marginTop: 14 }} disabled={busy || !name.trim() || !valueLabel.trim()} onClick={saveOperation}>{busy ? "Saving…" : "Add number"}</button>
    </Sheet>}
  </section>;
}
