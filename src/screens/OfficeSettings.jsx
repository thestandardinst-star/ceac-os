import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { dateOnly } from "../lib/time";
import { FieldGroup, ProductNotice, SectionHeader } from "../components/bits";
import { humanError } from "../lib/productLanguage";

export default function OfficeSettings({ me }) {
  const [office, setOffice] = useState(null);
  const [name, setName] = useState("CEAC main office");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [radius, setRadius] = useState(100);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locErr, setLocErr] = useState(null);
  const [message, setMessage] = useState(null);

  const [leaveConfigured, setLeaveConfigured] = useState(false);
  const [annualDays, setAnnualDays] = useState("");
  const [sickDays, setSickDays] = useState("");
  const [carryOver, setCarryOver] = useState("");
  const [managerLimit, setManagerLimit] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    setMessage(null);
    const [officeResult, leaveResult] = await Promise.all([
      supabase.from("office_locations").select("*").eq("is_primary", true).limit(1).maybeSingle(),
      supabase.from("leave_settings").select("*").eq("org_id", me.org_id).maybeSingle(),
    ]);

    if (officeResult.error) {
      setMessage({ tone: "error", title: "Office settings could not load", body: humanError(officeResult.error) });
      return;
    }
    if (leaveResult.error) {
      setMessage({ tone: "error", title: "Leave settings could not load", body: humanError(leaveResult.error) });
      return;
    }

    const o = officeResult.data;
    if (o) {
      setOffice(o);
      setName(o.name);
      setLat(String(o.lat));
      setLng(String(o.lng));
      setRadius(o.radius_meters);
    }

    const policy = leaveResult.data;
    const configured = Boolean(policy?.updated_by);
    setLeaveConfigured(configured);
    if (configured) {
      setAnnualDays(String(policy.annual_days ?? ""));
      setSickDays(String(policy.sick_days ?? ""));
      setCarryOver(String(policy.max_carryover ?? ""));
      setManagerLimit(String(policy.manager_approval_limit ?? ""));
    } else {
      setAnnualDays("");
      setSickDays("");
      setCarryOver("");
      setManagerLimit("");
    }
  }

  function pickHere() {
    setLocErr(null);
    if (!("geolocation" in navigator)) {
      setLocErr("This device cannot report its location. Open CEAC OS on a phone inside the building.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(String(pos.coords.latitude));
        setLng(String(pos.coords.longitude));
        setLocating(false);
      },
      () => {
        setLocating(false);
        setLocErr("Could not read this device location. Allow location access for CEAC OS and try again.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  async function saveOffice() {
    setSaving(true);
    setMessage(null);
    try {
      const lt = Number.parseFloat(lat);
      const ln = Number.parseFloat(lng);
      if (!Number.isFinite(lt) || !Number.isFinite(ln)) throw new Error("Enter both latitude and longitude.");

      const payload = {
        name: name.trim() || "CEAC main office",
        lat: lt,
        lng: ln,
        radius_meters: Number(radius) || 100,
        set_by: me.id,
        set_at: new Date().toISOString(),
      };

      const result = office
        ? await supabase.from("office_locations").update(payload).eq("id", office.id)
        : await supabase.from("office_locations").insert({ ...payload, org_id: me.org_id, is_primary: true });

      if (result.error) throw result.error;
      await load();
      setMessage({ tone: "success", title: "Office location saved", body: "Attendance can now distinguish the office from other work locations." });
    } catch (error) {
      setMessage({ tone: "error", title: "Office location was not saved", body: humanError(error) });
    } finally {
      setSaving(false);
    }
  }

  async function saveLeave() {
    setSaving(true);
    setMessage(null);
    try {
      const annual = Number.parseInt(annualDays, 10);
      const sick = Number.parseInt(sickDays, 10);
      const carry = Number.parseInt(carryOver, 10);
      const limit = Number.parseInt(managerLimit, 10);
      if (![annual, sick, carry, limit].every(Number.isFinite)) {
        throw new Error("Complete all four leave-rule fields before confirming the policy.");
      }

      const result = await supabase.from("leave_settings").update({
        annual_days: annual,
        sick_days: sick,
        max_carryover: carry,
        manager_approval_limit: limit,
        updated_by: me.id,
        updated_at: new Date().toISOString(),
      }).eq("org_id", me.org_id);

      if (result.error) throw result.error;
      await load();
      setMessage({ tone: "success", title: "Leave policy confirmed", body: "CEAC OS will use these values only from this confirmation onward." });
    } catch (error) {
      setMessage({ tone: "error", title: "Leave policy was not saved", body: humanError(error) });
    } finally {
      setSaving(false);
    }
  }

  const mapSrc = lat && lng ? `https://www.google.com/maps?q=${lat},${lng}&z=17&output=embed` : null;

  return <div className="body office-settings">
    <div className="office-page-intro">
      <div className="eyebrow">Control room</div>
      <h1 className="h1">Settings</h1>
      <p className="screen-note">Organisation rules CEAC can maintain without a developer. Unconfirmed policy stays visibly unconfigured rather than being guessed.</p>
    </div>

    {message && <ProductNotice tone={message.tone} title={message.title}>{message.body}</ProductNotice>}

    <div className="office-settings-grid">
      <section className="office-settings-card">
        <SectionHeader eyebrow="Attendance context" title="Office location" />
        <p className="screen-note">This location tells CEAC OS whether a work session began at the office or elsewhere. It does not determine productivity.</p>
        <FieldGroup label="Location name">
          <input className="field" value={name} onChange={(event) => setName(event.target.value)} placeholder="CEAC main office" />
        </FieldGroup>
        <button className="btn btn-ghost" onClick={pickHere} disabled={locating}>
          {locating ? "Finding this device…" : lat && lng ? "Use where I am standing now instead" : "Use where I am standing now"}
        </button>
        {locErr && <ProductNotice tone="error" title="Location unavailable">{locErr}</ProductNotice>}
        <FieldGroup label="Office radius" hint="The distance around the saved point that still counts as the office.">
          <div className="office-inline-field"><input className="field" type="number" min="10" value={radius} onChange={(event) => setRadius(event.target.value)} /><span>metres</span></div>
        </FieldGroup>
        {mapSrc && <iframe title="Office location" src={mapSrc} className="office-settings-map" />}
        <button className="btn" onClick={saveOffice} disabled={saving || !lat || !lng}>
          {saving ? "Saving…" : office ? "Update office location" : "Save office location"}
        </button>
        {office && <div className="office-setting-footnote">Last confirmed {dateOnly(office.set_at)}.</div>}
      </section>

      <section className="office-settings-card">
        <SectionHeader eyebrow="Policy" title="Leave rules" />
        {!leaveConfigured && <ProductNotice tone="attention" title="Leave policy not configured">
          The database contains old prototype defaults, but CEAC has not confirmed its actual leave rules. Those values are not being presented as CEAC policy.
        </ProductNotice>}
        {leaveConfigured && <ProductNotice tone="success" title="Leave policy configured">
          These values were explicitly confirmed by Administration. Change them only when CEAC policy changes.
        </ProductNotice>}

        <div className="office-policy-grid">
          <FieldGroup label="Annual leave days"><input className="field" type="number" min="0" value={annualDays} onChange={(event) => setAnnualDays(event.target.value)} placeholder="Not configured" /></FieldGroup>
          <FieldGroup label="Sick leave days"><input className="field" type="number" min="0" value={sickDays} onChange={(event) => setSickDays(event.target.value)} placeholder="Not configured" /></FieldGroup>
          <FieldGroup label="Maximum carry-over"><input className="field" type="number" min="0" value={carryOver} onChange={(event) => setCarryOver(event.target.value)} placeholder="Not configured" /></FieldGroup>
          <FieldGroup label="Manager approval limit" hint="Requests above this number of days come to Administration."><input className="field" type="number" min="0" value={managerLimit} onChange={(event) => setManagerLimit(event.target.value)} placeholder="Not configured" /></FieldGroup>
        </div>
        <button className="btn" onClick={saveLeave} disabled={saving}>
          {saving ? "Saving…" : leaveConfigured ? "Update confirmed leave policy" : "Confirm leave policy"}
        </button>
      </section>

      <section className="office-settings-card office-settings-wide">
        <SectionHeader eyebrow="Administration & HR" title="Configuration status" />
        <div className="office-config-status">
          <div><span>Office location</span><strong>{office ? "Configured" : "Needs setup"}</strong></div>
          <div><span>Leave policy</span><strong>{leaveConfigured ? "Configured" : "Awaiting CEAC policy"}</strong></div>
          <div><span>Salary structure</span><strong>Awaiting CEAC policy</strong></div>
          <div><span>Payroll approval chain</span><strong>Awaiting CEAC policy</strong></div>
          <div><span>Protected HR storage</span><strong>Security foundation ready</strong></div>
          <div><span>People & access</span><strong>Available through Units / invitations</strong></div>
        </div>
      </section>
    </div>
  </div>;
}
