import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { EmptyState, FieldGroup, LoadingState, ProductNotice } from "../components/bits";
import { humanError } from "../lib/productLanguage";

const ORG_ONLY = new Set(["authority.manage","hr_private.access","payroll.prepare","payroll.approve","audit.view"]);

function stamp(value) {
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

export default function AdminAuthority({ me, refreshMe }) {
  const [people, setPeople] = useState([]);
  const [definitions, setDefinitions] = useState([]);
  const [grants, setGrants] = useState([]);
  const [units, setUnits] = useState([]);
  const [selectedId, setSelectedId] = useState(me.id);
  const [capability, setCapability] = useState("people.manage");
  const [scopeUnitId, setScopeUnitId] = useState("");
  const [reason, setReason] = useState("");
  const [revokeReason, setRevokeReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  useEffect(() => { load(); }, [me.id]);

  async function load() {
    setLoading(true);
    setError(null);
    const [peopleResult, definitionsResult, grantsResult, unitsResult] = await Promise.all([
      supabase.from("profiles").select("id,full_name,email,job_title,active,is_admin,is_exec").eq("org_id", me.org_id).order("full_name"),
      supabase.from("capability_definitions").select("capability,label,description,sensitive").order("label"),
      supabase.from("capability_grants").select("id,profile_id,capability,scope_unit_id,granted_by,granted_at,grant_reason,revoked_by,revoked_at,revoke_reason").eq("org_id", me.org_id).order("granted_at", { ascending: false }),
      supabase.from("units").select("id,name").eq("org_id", me.org_id).eq("active", true).order("name"),
    ]);
    const firstError = peopleResult.error || definitionsResult.error || grantsResult.error || unitsResult.error;
    if (firstError) {
      setError(humanError(firstError, "Authority records could not load."));
      setLoading(false);
      return;
    }
    setPeople(peopleResult.data || []);
    setDefinitions(definitionsResult.data || []);
    setGrants(grantsResult.data || []);
    setUnits(unitsResult.data || []);
    setLoading(false);
  }

  const selected = people.find((person) => person.id === selectedId) || null;
  const selectedGrants = grants.filter((grant) => grant.profile_id === selectedId);
  const activeGrants = selectedGrants.filter((grant) => !grant.revoked_at);
  const peopleById = useMemo(() => Object.fromEntries(people.map((person) => [person.id, person])), [people]);
  const unitsById = useMemo(() => Object.fromEntries(units.map((unit) => [unit.id, unit.name])), [units]);
  const definition = definitions.find((item) => item.capability === capability);

  useEffect(() => {
    if (ORG_ONLY.has(capability)) setScopeUnitId("");
  }, [capability]);

  async function grant() {
    if (!selectedId || !capability || !reason.trim()) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    const { error: grantError } = await supabase.rpc("grant_capability", {
      p_profile_id: selectedId,
      p_capability: capability,
      p_scope_unit_id: scopeUnitId || null,
      p_reason: reason.trim(),
    });
    setBusy(false);
    if (grantError) {
      setError(humanError(grantError, "The capability could not be granted."));
      return;
    }
    setReason("");
    setNotice("Capability granted.");
    await load();
    if (selectedId === me.id) await refreshMe?.();
  }

  async function revoke(grantId) {
    if (!revokeReason.trim()) {
      setError("Enter a reason before revoking authority.");
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    const { error: revokeError } = await supabase.rpc("revoke_capability", {
      p_grant_id: grantId,
      p_reason: revokeReason.trim(),
    });
    setBusy(false);
    if (revokeError) {
      setError(humanError(revokeError, "The capability could not be revoked."));
      return;
    }
    setRevokeReason("");
    setNotice("Capability revoked.");
    await load();
    if (selectedId === me.id) await refreshMe?.();
  }

  if (loading) return <div className="body"><LoadingState label="Loading authority…" /></div>;

  return <div className="body">
    <div style={{ paddingTop: 26 }}>
      <div className="eyebrow">Security & governance</div>
      <h1 className="h1">Authority</h1>
      <p className="screen-note">Sensitive access is granted explicitly. A role title by itself does not grant every Administration capability.</p>
    </div>

    {error && <ProductNotice tone="error" title="Authority">{error}</ProductNotice>}
    {notice && <ProductNotice tone="success" title="Authority updated">{notice}</ProductNotice>}

    <div className="split" style={{ marginTop: 18 }}>
      <div className="main-col">
        <div className="sec"><span>Person</span></div>
        <FieldGroup label="Choose person">
          <select className="field" aria-label="Authority person" value={selectedId} onChange={(event) => { setSelectedId(event.target.value); setNotice(null); setError(null); }}>
            {people.map((person) => <option key={person.id} value={person.id}>{person.full_name} · {person.email}</option>)}
          </select>
        </FieldGroup>

        {selected && <div className="card" style={{ padding: 15, marginTop: 12 }}>
          <strong>{selected.full_name}</strong>
          <div className="small" style={{ marginTop: 4 }}>{selected.job_title || "No job title"} · {selected.active ? "Active" : "Inactive"}</div>
        </div>}

        <div className="sec"><span>Active capabilities</span><span>{activeGrants.length}</span></div>
        {activeGrants.map((grant) => {
          const def = definitions.find((item) => item.capability === grant.capability);
          return <div className="row" key={grant.id}>
            <div className="row-t">{def?.label || grant.capability}</div>
            <div className="row-m">
              {grant.scope_unit_id ? unitsById[grant.scope_unit_id] || "Unit scope" : "Organisation-wide"}
              {" · granted " + stamp(grant.granted_at)}
              {grant.granted_by ? " by " + (peopleById[grant.granted_by]?.full_name || "authorised user") : " · baseline"}
            </div>
            <div className="small" style={{ marginTop: 6 }}>{grant.grant_reason}</div>
            <div style={{ marginTop: 10 }}>
              <button className="btn btn-ghost btn-sm" disabled={busy || !revokeReason.trim()} onClick={() => revoke(grant.id)}>Revoke</button>
            </div>
          </div>;
        })}
        {activeGrants.length === 0 && <EmptyState title="No active capabilities">This person currently has no explicit sensitive capability grants.</EmptyState>}

        <div className="sec"><span>History</span><span>{selectedGrants.length}</span></div>
        {selectedGrants.filter((grant) => grant.revoked_at).map((grant) => <div className="row" key={grant.id}>
          <div className="row-t">{definitions.find((item) => item.capability === grant.capability)?.label || grant.capability}</div>
          <div className="row-m">Revoked {stamp(grant.revoked_at)}{grant.revoked_by ? " by " + (peopleById[grant.revoked_by]?.full_name || "authorised user") : ""}</div>
          <div className="small" style={{ marginTop: 6 }}>{grant.revoke_reason}</div>
        </div>)}
      </div>

      <div className="side-col">
        <div className="sec"><span>Grant capability</span></div>
        <div className="card" style={{ padding: 15 }}>
          <FieldGroup label="Capability">
            <select className="field" aria-label="Capability" value={capability} onChange={(event) => setCapability(event.target.value)}>
              {definitions.map((item) => <option key={item.capability} value={item.capability}>{item.label}</option>)}
            </select>
          </FieldGroup>
          {definition && <p className="small" style={{ lineHeight: 1.5 }}>{definition.description}</p>}
          <FieldGroup label="Scope">
            <select className="field" aria-label="Capability scope" value={scopeUnitId} disabled={ORG_ONLY.has(capability)} onChange={(event) => setScopeUnitId(event.target.value)}>
              <option value="">Organisation-wide</option>
              {units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
            </select>
          </FieldGroup>
          {ORG_ONLY.has(capability) && <p className="small">This capability is organisation-scoped.</p>}
          <FieldGroup label="Grant reason">
            <textarea className="field" aria-label="Grant reason" rows="3" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Why this authority is required" />
          </FieldGroup>
          <button className="btn" disabled={busy || !selectedId || !reason.trim()} onClick={grant}>{busy ? "Saving…" : "Grant capability"}</button>
        </div>

        <div className="sec"><span>Revocation reason</span></div>
        <div className="card" style={{ padding: 15 }}>
          <FieldGroup label="Reason used for the next revocation">
            <textarea className="field" aria-label="Revocation reason" rows="3" value={revokeReason} onChange={(event) => setRevokeReason(event.target.value)} placeholder="Why this authority is being removed" />
          </FieldGroup>
          <p className="small" style={{ lineHeight: 1.5 }}>Revocation preserves the original grant and creates attributable history. The final organisation authority manager cannot be removed through this flow.</p>
        </div>
      </div>
    </div>
  </div>;
}
