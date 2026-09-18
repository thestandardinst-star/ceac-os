import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { dateOnly } from "../lib/time";

export default function OfficeSettings({ me }) {
  const [office, setOffice] = useState(null);
  const [name, setName] = useState("CEAC main office");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [radius, setRadius] = useState(100);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(null);
  const [ann, setAnn] = useState(15);
  const [sick, setSick] = useState(12);
  const [carry, setCarry] = useState(5);
  const [mLimit, setMLimit] = useState(5);
  useEffect(() => { load(); }, []);
  async function load() {
    const { data: o } = await supabase.from("office_locations")
      .select("*").eq("is_primary", true).limit(1).maybeSingle();
    if (o) { setOffice(o); setName(o.name); setLat(String(o.lat)); setLng(String(o.lng)); setRadius(o.radius_meters); }
    const { data: s } = await supabase.from("leave_settings").select("*").eq("org_id", me.org_id).maybeSingle();
    if (s) { setAnn(s.annual_days); setSick(s.sick_days); setCarry(s.max_carryover); setMLimit(s.manager_approval_limit); }
  }
  async function saveOffice() {
    setSaving(true); setSaved(null);
    try {
      const lt = parseFloat(lat), ln = parseFloat(lng);
      if (!lt || !ln) throw new Error("Enter both latitude and longitude.");
      if (office) {
        await supabase.from("office_locations").update({
          name, lat: lt, lng: ln, radius_meters: radius,
          set_by: me.id, set_at: new Date().toISOString() }).eq("id", office.id);
      } else {
        await supabase.from("office_locations").insert({
          org_id: me.org_id, name, lat: lt, lng: ln,
          radius_meters: radius, is_primary: true, set_by: me.id });
      }
      setSaved("Office location saved."); await load();
    } catch (e) { setSaved(e.message); }
    finally { setSaving(false); }
  }
  async function saveLeave() {
    setSaving(true); setSaved(null);
    try {
      await supabase.from("leave_settings").update({
        annual_days: ann, sick_days: sick, max_carryover: carry,
        manager_approval_limit: mLimit, updated_by: me.id,
        updated_at: new Date().toISOString() }).eq("org_id", me.org_id);
      setSaved("Leave rules saved."); await load();
    } catch (e) { setSaved(e.message); }
    finally { setSaving(false); }
  }
  const mapSrc = (lat && lng) ? "https://www.google.com/maps?q=" + lat + "," + lng + "&z=17&output=embed" : null;
  const numStyle = { marginTop: 0, width: 80, padding: 6, textAlign: "right" };
  const rowStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderTop: "1px solid var(--line-soft)", fontSize: 13.5 };
  return (
    <div className="body">
      <div style={{ paddingTop: 26 }}>
        <h1 className="h1">Settings</h1>
        <p className="screen-note">Church-wide rules. Anyone in the office follows these.</p>
      </div>
      <div className="split" style={{ marginTop: 8 }}>
        <div className="main-col">
          <div className="sec"><span>Office location</span></div>
          <p className="small" style={{ lineHeight: 1.5, marginBottom: 6 }}>
            Open the church in Google Maps, press and hold the exact spot, and copy the coordinates it shows. Paste them here.
          </p>
          <input className="field" placeholder="Name of this location" value={name} onChange={(e) => setName(e.target.value)} />
          <div style={{ display: "flex", gap: 8 }}>
            <input className="field" placeholder="Latitude" value={lat} onChange={(e) => setLat(e.target.value)} />
            <input className="field" placeholder="Longitude" value={lng} onChange={(e) => setLng(e.target.value)} />
          </div>
          <input className="field" type="number" placeholder="Radius in metres (default 100)"
            value={radius} onChange={(e) => setRadius(parseInt(e.target.value, 10) || 100)} />
          <p className="small" style={{ marginTop: 6 }}>Anyone whose Start work happens inside this radius counts as at the office.</p>
          {mapSrc && <iframe title="Office location" src={mapSrc} style={{ width: "100%", height: 260, border: 0, borderRadius: 8, marginTop: 12 }} />}
          <button className="btn" style={{ marginTop: 14 }} onClick={saveOffice} disabled={saving || !lat || !lng}>
            {saving ? "Saving..." : office ? "Update office location" : "Save office location"}
          </button>
          {office && <div className="small" style={{ marginTop: 8 }}>Last set on {dateOnly(office.set_at)}.</div>}
        </div>
        <div className="side-col">
          <div className="sec"><span>Leave rules</span></div>
          <p className="small" style={{ marginBottom: 4 }}>Applies to every staff member. The Ghana Labour Act minimum is 15 days annual leave.</p>
          <div className="card" style={{ padding: "4px 15px" }}>
            <label style={rowStyle}><span style={{ color: "var(--ink-soft)" }}>Annual leave days</span>
              <input type="number" className="field" style={numStyle} value={ann} onChange={(e) => setAnn(parseInt(e.target.value, 10) || 0)} /></label>
            <label style={rowStyle}><span style={{ color: "var(--ink-soft)" }}>Sick days</span>
              <input type="number" className="field" style={numStyle} value={sick} onChange={(e) => setSick(parseInt(e.target.value, 10) || 0)} /></label>
            <label style={rowStyle}><span style={{ color: "var(--ink-soft)" }}>Max carry-over</span>
              <input type="number" className="field" style={numStyle} value={carry} onChange={(e) => setCarry(parseInt(e.target.value, 10) || 0)} /></label>
            <label style={rowStyle}><span style={{ color: "var(--ink-soft)" }}>Manager can approve up to</span>
              <input type="number" className="field" style={numStyle} value={mLimit} onChange={(e) => setMLimit(parseInt(e.target.value, 10) || 0)} /></label>
          </div>
          <p className="small" style={{ marginTop: 6 }}>Anything beyond the manager&rsquo;s limit comes to you.</p>
          <button className="btn" style={{ marginTop: 12 }} onClick={saveLeave} disabled={saving}>
            {saving ? "Saving..." : "Save leave rules"}</button>
        </div>
      </div>
      {saved && <div className="flag flag-green" style={{ marginTop: 16 }}>{saved}</div>}
    </div>);
}
