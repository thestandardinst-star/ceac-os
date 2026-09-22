import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { EmptyState, FieldGroup, LoadingState, ProductNotice } from "../components/bits";
import { humanError } from "../lib/productLanguage";

function humanize(value = "") {
  return String(value)
    .replaceAll("_", " ")
    .replaceAll(".", " · ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function auditTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB", {
    timeZone: "Africa/Accra",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminAudit({ me }) {
  const [events, setEvents] = useState([]);
  const [actors, setActors] = useState({});
  const [resource, setResource] = useState("all");
  const [action, setAction] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { load(); }, [me.id]);

  async function load() {
    setLoading(true);
    setError(null);

    const { data, error: auditError } = await supabase
      .from("platform_audit_events")
      .select("id,actor_id,action,resource_type,resource_id,subject_profile_id,source_table,changed_fields,created_at")
      .eq("org_id", me.org_id)
      .order("created_at", { ascending: false })
      .limit(250);

    if (auditError) {
      setError(humanError(auditError, "The audit record could not load."));
      setLoading(false);
      return;
    }

    const rows = data || [];
    const actorIds = [...new Set(rows.map((event) => event.actor_id).filter(Boolean))];
    let actorMap = {};

    if (actorIds.length) {
      const { data: profiles, error: actorError } = await supabase
        .from("profiles")
        .select("id,full_name")
        .in("id", actorIds);
      if (actorError) {
        setError(humanError(actorError, "Audit actors could not be resolved."));
        setLoading(false);
        return;
      }
      actorMap = Object.fromEntries((profiles || []).map((profile) => [profile.id, profile.full_name]));
    }

    setEvents(rows);
    setActors(actorMap);
    setLoading(false);
  }

  const resources = useMemo(
    () => [...new Set(events.map((event) => event.resource_type).filter(Boolean))].sort(),
    [events]
  );
  const actions = useMemo(
    () => [...new Set(events.map((event) => event.action).filter(Boolean))].sort(),
    [events]
  );

  const cleanSearch = searchText.trim().toLowerCase();
  const shown = events.filter((event) => {
    if (resource !== "all" && event.resource_type !== resource) return false;
    if (action !== "all" && event.action !== action) return false;
    if (!cleanSearch) return true;
    const actor = actors[event.actor_id] || "System";
    return [
      actor,
      event.action,
      event.resource_type,
      event.resource_id,
      event.subject_profile_id,
      ...(event.changed_fields || []),
    ].filter(Boolean).some((value) => String(value).toLowerCase().includes(cleanSearch));
  });

  if (loading) return <div className="body"><LoadingState label="Loading audit history…" /></div>;

  return <div className="body">
    <div style={{ paddingTop: 26 }}>
      <div className="eyebrow">Governance</div>
      <h1 className="h1">Audit</h1>
      <p className="screen-note">Append-only record of consequential ordinary-platform changes. Protected HR keeps a separate protected audit boundary.</p>
    </div>

    {error && <ProductNotice tone="error" title="Audit could not finish loading" action={<button className="btn btn-ghost btn-sm" onClick={load}>Try again</button>}>{error}</ProductNotice>}

    <div className="split" style={{ marginTop: 18 }}>
      <div className="main-col">
        <div className="sec"><span>Recent changes</span><span>{shown.length}</span></div>
        {shown.map((event) => <div className="row" key={event.id}>
          <div className="row-t">{humanize(event.action)}</div>
          <div className="row-m">
            {actors[event.actor_id] || "System"} · {auditTime(event.created_at)}
          </div>
          <div className="row-m" style={{ marginTop: 5 }}>
            {humanize(event.resource_type)}
            {event.resource_id ? " · " + event.resource_id.slice(0, 8) : ""}
          </div>
          {(event.changed_fields || []).length > 0 && <div className="small" style={{ marginTop: 7 }}>
            Changed: {event.changed_fields.map(humanize).join(", ")}
          </div>}
        </div>)}
        {shown.length === 0 && <EmptyState title="No audit events match">Change the filters or search term.</EmptyState>}
      </div>

      <div className="side-col">
        <div className="sec"><span>Filter</span></div>
        <div className="card" style={{ padding: 15 }}>
          <FieldGroup label="Search">
            <input className="field" aria-label="Search audit" type="search" placeholder="Actor, action, field or record" value={searchText} onChange={(event) => setSearchText(event.target.value)} />
          </FieldGroup>
          <FieldGroup label="Resource">
            <select className="field" aria-label="Audit resource" value={resource} onChange={(event) => setResource(event.target.value)}>
              <option value="all">All resources</option>
              {resources.map((value) => <option value={value} key={value}>{humanize(value)}</option>)}
            </select>
          </FieldGroup>
          <FieldGroup label="Action">
            <select className="field" aria-label="Audit action" value={action} onChange={(event) => setAction(event.target.value)}>
              <option value="all">All actions</option>
              {actions.map((value) => <option value={value} key={value}>{humanize(value)}</option>)}
            </select>
          </FieldGroup>
          <button className="btn btn-ghost" style={{ marginTop: 10 }} onClick={load}>Refresh audit</button>
        </div>

        <div className="sec"><span>Audit contract</span></div>
        <div className="card" style={{ padding: 15 }}>
          <p className="small" style={{ lineHeight: 1.6, margin: 0 }}>
            Audit rows cannot be edited or deleted through CEAC OS. The log stores who changed what, when, and which fields changed without copying arbitrary record contents into a shadow data store.
          </p>
        </div>
      </div>
    </div>
  </div>;
}
