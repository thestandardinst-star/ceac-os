import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Sheet } from "../components/bits";
import { dateOnly } from "../lib/time";

export default function Me({ me, openGoal }) {
  const [profile, setProfile] = useState(me);
  const [balance, setBalance] = useState(null);
  const [settings, setSettings] = useState(null);
  const [myRequests, setMyRequests] = useState([]);
  const [goals, setGoals] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [details, setDetails] = useState({ emergency_contact_name: "", emergency_contact_phone: "", emergency_contact_relationship: "", address_text: "", social_handles: {} });
  const [profileForm, setProfileForm] = useState({ preferred_name: "", phone: "", birthday: "", emergency_contact_name: "", emergency_contact_phone: "", emergency_contact_relationship: "", address_text: "", instagram: "", linkedin: "" });
  const [sheet, setSheet] = useState(null);
  const [kind, setKind] = useState("annual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [goalTitle, setGoalTitle] = useState("");
  const [goalDate, setGoalDate] = useState("");
  const [remindTitle, setRemindTitle] = useState("");
  const [remindAt, setRemindAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => { load(); }, [me.id]);

  async function load() {
    const y = new Date().getFullYear();
    const { data: b } = await supabase.from("leave_balances")
      .select("annual_taken, sick_taken, carryover_from_last_year")
      .eq("profile_id", me.id).eq("year", y).maybeSingle();
    setBalance(b || { annual_taken: 0, sick_taken: 0, carryover_from_last_year: 0 });
    const { data: s } = await supabase.from("leave_settings").select("*").eq("org_id", me.org_id).maybeSingle();
    setSettings(s);
    const { data: rq } = await supabase.from("leave_requests")
      .select("id, kind, start_date, end_date, days, status")
      .eq("profile_id", me.id).order("requested_at", { ascending: false }).limit(10);
    setMyRequests(rq || []);
    const { data: gs } = await supabase.from("personal_goals")
      .select("id, title, target_date, status")
      .eq("profile_id", me.id).order("created_at", { ascending: false });
    setGoals(gs || []);
    const { data: rem } = await supabase.from("personal_reminders")
      .select("id, title, remind_at").eq("profile_id", me.id)
      .is("seen_at", null).order("remind_at", { ascending: true }).limit(10);
    setReminders(rem || []);
    const { data: personal } = await supabase.from("profile_personal_details")
      .select("emergency_contact_name, emergency_contact_phone, emergency_contact_relationship, address_text, social_handles")
      .eq("profile_id", me.id).maybeSingle();
    setDetails(personal || { emergency_contact_name: "", emergency_contact_phone: "", emergency_contact_relationship: "", address_text: "", social_handles: {} });
    const { data: currentProfile } = await supabase.from("profiles")
      .select("full_name, preferred_name, email, phone, birthday, job_title, joined_at, contract_type")
      .eq("id", me.id).single();
    if (currentProfile) setProfile((value) => ({ ...value, ...currentProfile }));
  }

  const annualEntitlement = settings ? settings.annual_days : 15;
  const carryover = balance ? balance.carryover_from_last_year : 0;
  const annualTaken = balance ? balance.annual_taken : 0;
  const annualLeft = annualEntitlement + carryover - annualTaken;
  const sickLeft = (settings ? settings.sick_days : 12) - (balance ? balance.sick_taken : 0);

  function daysBetween(a, b) {
    if (!a || !b) return 0;
    return Math.max(0, Math.round((new Date(b) - new Date(a)) / 86400000) + 1);
  }

  async function requestLeave() {
    setBusy(true);
    try {
      const days = daysBetween(startDate, endDate);
      if (days <= 0) throw new Error("Pick a valid range.");
      const { error } = await supabase.from("leave_requests").insert({
        org_id: me.org_id, profile_id: me.id, kind, start_date: startDate,
        end_date: endDate, days, reason: reason || null });
      if (error) throw error;
      setSheet(null); setKind("annual"); setStartDate(""); setEndDate(""); setReason("");
      await load();
    } catch (e) { alert(e.message); }
    finally { setBusy(false); }
  }

  async function createGoal() {
    setBusy(true);
    try {
      const { data, error } = await supabase.from("personal_goals").insert({
        org_id: me.org_id, profile_id: me.id, title: goalTitle.trim(),
        target_date: goalDate || null }).select("id").single();
      if (error) throw error;
      setSheet(null); setGoalTitle(""); setGoalDate("");
      await load();
      if (openGoal && data) openGoal(data.id);
    } catch (e) { alert(e.message); }
    finally { setBusy(false); }
  }

  async function createReminder() {
    setBusy(true);
    try {
      if (!remindAt) throw new Error("Pick when to be reminded.");
      const { error } = await supabase.from("personal_reminders").insert({
        org_id: me.org_id, profile_id: me.id, title: remindTitle.trim(),
        remind_at: new Date(remindAt).toISOString() });
      if (error) throw error;
      setSheet(null); setRemindTitle(""); setRemindAt("");
      await load();
    } catch (e) { alert(e.message); }
    finally { setBusy(false); }
  }

  async function markReminderSeen(id) {
    await supabase.from("personal_reminders").update({ seen_at: new Date().toISOString() }).eq("id", id);
    await load();
  }

  function openProfile() {
    setMessage(null);
    setProfileForm({
      preferred_name: profile.preferred_name || "", phone: profile.phone || "", birthday: profile.birthday || "",
      emergency_contact_name: details.emergency_contact_name || "", emergency_contact_phone: details.emergency_contact_phone || "",
      emergency_contact_relationship: details.emergency_contact_relationship || "", address_text: details.address_text || "",
      instagram: details.social_handles?.instagram || "", linkedin: details.social_handles?.linkedin || "",
    });
    setSheet("profile");
  }

  async function saveProfile() {
    setBusy(true); setMessage(null);
    try {
      const { error } = await supabase.rpc("update_my_personal_details", {
        p_preferred_name: profileForm.preferred_name.trim() || null,
        p_phone: profileForm.phone.trim() || null,
        p_birthday: profileForm.birthday || null,
        p_emergency_contact_name: profileForm.emergency_contact_name.trim() || null,
        p_emergency_contact_phone: profileForm.emergency_contact_phone.trim() || null,
        p_emergency_contact_relationship: profileForm.emergency_contact_relationship.trim() || null,
        p_address_text: profileForm.address_text.trim() || null,
        p_social_handles: { instagram: profileForm.instagram.trim(), linkedin: profileForm.linkedin.trim() },
      });
      if (error) throw error;
      setMessage("Saved. Your changes are attributable in your record.");
      await load();
    } catch (error) { setMessage(error.message || "Your details could not be saved."); }
    finally { setBusy(false); }
  }

  function Row({ l, v }) {
    return (
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "12px 0", borderTop: "1px solid var(--line-soft)", fontSize: 13.5 }}>
        <span style={{ color: "var(--ink-soft)" }}>{l}</span>
        <span style={{ fontWeight: 500, textAlign: "right" }}>{v}</span>
      </div>);
  }

  return (
    <div className="body">
      <div style={{ paddingTop: 26 }}>
        <h1 className="h1">{profile.preferred_name || profile.full_name}</h1>
        <p className="screen-note">{profile.job_title || "—"}{me.unit_name ? " · " + me.unit_name : ""}</p>
      </div>

      <div className="split" style={{ marginTop: 8 }}>
      <div className="main-col">

      <div className="sec"><span>Leave</span></div>
      <div className="card" style={{ padding: "4px 15px" }}>
        <Row l="Annual leave left" v={annualLeft + " of " + (annualEntitlement + carryover) + " days"} />
        <Row l="Sick days left" v={sickLeft + " of " + (settings ? settings.sick_days : 12)} />
        {carryover > 0 && <Row l="Carried over from last year" v={carryover + " days"} />}
      </div>
      <button className="btn btn-ghost wide-auto" style={{ marginTop: 10 }} onClick={() => setSheet("leave")}>Ask for leave</button>
      {myRequests.length > 0 && (<>
        <div className="sec"><span>Your leave requests</span></div>
        {myRequests.map((r) => (
          <div key={r.id} className="row">
            <div className="row-t">{r.days} day{r.days === 1 ? "" : "s"} {r.kind} leave</div>
            <div className="row-m">{dateOnly(r.start_date)} — {dateOnly(r.end_date)}</div>
            <div style={{ marginTop: 6 }}>
              <span className={"pill " + (r.status === "approved" ? "p-green" : r.status === "declined" ? "p-brick" : "p-amber")}>
                {r.status === "approved" ? "Approved" : r.status === "declined" ? "Declined" : r.status === "escalated" ? "With admin" : "Waiting on your manager"}
              </span>
            </div>
          </div>))}
      </>)}

      <div className="sec"><span>Your goals</span><span>{goals.length}</span></div>
      {goals.length === 0 && <div className="card small" style={{ lineHeight: 1.5 }}>Personal goals are yours alone. Nobody else sees them, no report counts them.</div>}
      {goals.map((g) => (
        <button key={g.id} className="row" onClick={() => openGoal && openGoal(g.id)}>
          <div className="row-t">{g.title}</div>
          <div className="row-m">{g.target_date ? "By " + dateOnly(g.target_date) : "No target date"} · {g.status === "achieved" ? "Achieved" : g.status === "abandoned" ? "Set aside" : "Active"}</div>
        </button>))}
      <button className="btn btn-ghost wide-auto" style={{ marginTop: 10 }} onClick={() => setSheet("goal")}>Add a goal</button>

      </div>

      <div className="side-col">

      <div className="sec"><span>Your details</span></div>
      <div className="card" style={{ padding: "4px 15px" }}>
        {profile.preferred_name && <Row l="Preferred name" v={profile.preferred_name} />}
        <Row l="Official name" v={profile.full_name} />
        <Row l="Email" v={profile.email} />
        <Row l="Phone" v={profile.phone || "Not added"} />
        <Row l="Unit" v={me.unit_name || "—"} />
        <Row l="Position" v={me.is_exec ? "Group Pastor" : me.is_admin ? "Administration & HR" : me.role === "manager" ? "Unit head" : "Staff"} />
        {profile.joined_at && <Row l="Joined" v={dateOnly(profile.joined_at)} />}
        {profile.birthday && <Row l="Birthday" v={new Date(profile.birthday).toLocaleDateString("en-GB", { day: "numeric", month: "long" })} />}
      </div>
      <button className="btn btn-ghost wide-auto" style={{ marginTop: 10 }} onClick={openProfile}>Edit personal details</button>

      <div className="sec"><span>Reminders</span><span>{reminders.length}</span></div>
      {reminders.length === 0 && <div className="card small">Nothing to remind you of.</div>}
      {reminders.map((r) => (
        <div key={r.id} className="row">
          <div className="row-t">{r.title}</div>
          <div className="row-m">{new Date(r.remind_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</div>
          <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => markReminderSeen(r.id)}>Mark seen</button>
        </div>))}
      <button className="btn btn-ghost wide-auto" style={{ marginTop: 10 }} onClick={() => setSheet("remind")}>Add a reminder</button>

      <div className="sec"><span>Protected HR records</span></div>
      <div className="card" style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.55 }}>
        Ghana Card, SSNIT, tax, banking, contracts, payslips and private documents are not stored in ordinary profile details. Protected employee-document access is not enabled here yet.
      </div>

      <button className="btn btn-ghost wide-auto" style={{ marginTop: 24 }} onClick={() => supabase.auth.signOut()}>Sign out</button>
      </div>
      </div>

      {sheet === "leave" && (
        <Sheet onClose={() => setSheet(null)}>
          <div className="h2">Ask for leave</div>
          <p className="screen-note">Your manager will see this and approve it or send it on to admin.</p>
          <div className="sec" style={{ marginTop: 12 }}><span>Kind of leave</span></div>
          {[["annual","Annual"],["sick","Sick"],["bereavement","Bereavement"],["maternity","Maternity"],["other","Other"]].map(([k, l]) => (
            <button key={k} className="opt" onClick={() => setKind(k)}>
              <span className={"rd " + (kind === k ? "on" : "")} /> {l}</button>))}
          <input className="field" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <input className="field" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          <textarea className="field" rows={2} placeholder="A short reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} />
          {startDate && endDate && (
            <div className="small" style={{ marginTop: 8 }}>That is {daysBetween(startDate, endDate)} day{daysBetween(startDate, endDate) === 1 ? "" : "s"}.</div>)}
          <button className="btn" style={{ marginTop: 14 }} onClick={requestLeave} disabled={busy || !startDate || !endDate}>
            {busy ? "Sending..." : "Send request"}</button>
        </Sheet>)}

      {sheet === "goal" && (
        <Sheet onClose={() => setSheet(null)}>
          <div className="h2">Add a personal goal</div>
          <p className="screen-note">Only you see this. Add steps and reminders inside the goal.</p>
          <input className="field" placeholder="What are you aiming for?" value={goalTitle} onChange={(e) => setGoalTitle(e.target.value)} />
          <input className="field" type="date" value={goalDate} onChange={(e) => setGoalDate(e.target.value)} />
          <button className="btn" style={{ marginTop: 14 }} onClick={createGoal} disabled={busy || !goalTitle.trim()}>
            {busy ? "Saving..." : "Add goal"}</button>
        </Sheet>)}

      {sheet === "remind" && (
        <Sheet onClose={() => setSheet(null)}>
          <div className="h2">Add a reminder</div>
          <p className="screen-note">Only you see this. The app shows it when the time comes.</p>
          <input className="field" placeholder="What to remind you of" value={remindTitle} onChange={(e) => setRemindTitle(e.target.value)} />
          <input className="field" type="datetime-local" value={remindAt} onChange={(e) => setRemindAt(e.target.value)} />
          <button className="btn" style={{ marginTop: 14 }} onClick={createReminder} disabled={busy || !remindTitle.trim() || !remindAt}>
            {busy ? "Saving..." : "Set reminder"}</button>
        </Sheet>)}
      {sheet === "profile" && (
        <Sheet onClose={() => !busy && setSheet(null)}>
          <div className="h2">Edit personal details</div>
          <p className="screen-note">Official employment details remain read-only. Emergency contact and address details are visible only to you and Administration.</p>
          <label className="field-label">Preferred name</label>
          <input className="field" value={profileForm.preferred_name} onChange={(event) => setProfileForm((value) => ({ ...value, preferred_name: event.target.value }))} />
          <label className="field-label">Phone</label>
          <input className="field" type="tel" value={profileForm.phone} onChange={(event) => setProfileForm((value) => ({ ...value, phone: event.target.value }))} />
          <label className="field-label">Birthday</label>
          <input className="field" type="date" value={profileForm.birthday} max={new Date().toISOString().slice(0, 10)} onChange={(event) => setProfileForm((value) => ({ ...value, birthday: event.target.value }))} />
          <div className="sec"><span>Emergency contact</span></div>
          <input className="field" placeholder="Contact name" value={profileForm.emergency_contact_name} onChange={(event) => setProfileForm((value) => ({ ...value, emergency_contact_name: event.target.value }))} />
          <input className="field" type="tel" placeholder="Contact phone" value={profileForm.emergency_contact_phone} onChange={(event) => setProfileForm((value) => ({ ...value, emergency_contact_phone: event.target.value }))} />
          <input className="field" placeholder="Relationship" value={profileForm.emergency_contact_relationship} onChange={(event) => setProfileForm((value) => ({ ...value, emergency_contact_relationship: event.target.value }))} />
          <label className="field-label">Address or ordinary contact information</label>
          <textarea className="field" rows="3" value={profileForm.address_text} onChange={(event) => setProfileForm((value) => ({ ...value, address_text: event.target.value }))} />
          <div className="sec"><span>Social handles</span></div>
          <input className="field" placeholder="Instagram" value={profileForm.instagram} onChange={(event) => setProfileForm((value) => ({ ...value, instagram: event.target.value }))} />
          <input className="field" placeholder="LinkedIn" value={profileForm.linkedin} onChange={(event) => setProfileForm((value) => ({ ...value, linkedin: event.target.value }))} />
          {message && <div className="flag flag-amber" style={{ marginTop: 12 }}>{message}</div>}
          <button className="btn" style={{ marginTop: 14 }} onClick={saveProfile} disabled={busy}>{busy ? "Saving..." : "Save personal details"}</button>
        </Sheet>)}
    </div>);
}
