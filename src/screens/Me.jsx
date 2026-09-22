import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Sheet, FieldGroup, ProductNotice } from "../components/bits";
import { dateOnly } from "../lib/time";
import { humanError } from "../lib/productLanguage";

export default function Me({ me, openGoal, openRecord, openPerformance, openWorkforce }) {
  const [profile, setProfile] = useState(me);
  const [leavePolicy, setLeavePolicy] = useState(null);
  const [leavePolicyRules, setLeavePolicyRules] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [goals, setGoals] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [details, setDetails] = useState({ emergency_contact_name: "", emergency_contact_phone: "", emergency_contact_relationship: "", address_text: "", social_handles: {} });
  const [profileForm, setProfileForm] = useState({ preferred_name: "", phone: "", birthday: "", emergency_contact_name: "", emergency_contact_phone: "", emergency_contact_relationship: "", address_text: "", instagram: "", linkedin: "" });
  const [area, setArea] = useState("goals");
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
    setMessage(null);
    const { data: requests, error: requestsError } = await supabase.from("leave_requests")
      .select("id, kind, start_date, end_date, days, status, requested_at")
      .eq("profile_id", me.id).order("requested_at", { ascending: false }).limit(100);
    if (requestsError) { setMessage(requestsError.message); return; }
    setMyRequests(requests || []);

    const { data: policy, error: policyError } = await supabase.from("leave_policy_versions")
      .select("*").eq("org_id", me.org_id).eq("state", "active")
      .order("confirmed_at", { ascending: false }).limit(1).maybeSingle();
    if (policyError) { setMessage(policyError.message); return; }
    setLeavePolicy(policy || null);

    if (policy) {
      const { data: rules, error: rulesError } = await supabase.from("leave_policy_rules")
        .select("*").eq("policy_version_id", policy.id).order("leave_kind");
      if (rulesError) { setMessage(rulesError.message); return; }
      setLeavePolicyRules(rules || []);
    } else {
      setLeavePolicyRules([]);
    }

    const { data: goalRows, error: goalsError } = await supabase.from("personal_goals")
      .select("id, title, target_date, status, achieved_at")
      .eq("profile_id", me.id).order("created_at", { ascending: false });
    if (goalsError) { setMessage(goalsError.message); return; }
    setGoals(goalRows || []);

    const { data: reminderRows, error: remindersError } = await supabase.from("personal_reminders")
      .select("id, title, remind_at, linked_goal_id").eq("profile_id", me.id)
      .is("seen_at", null).order("remind_at", { ascending: true }).limit(10);
    if (remindersError) { setMessage(remindersError.message); return; }
    setReminders(reminderRows || []);

    const { data: personal, error: personalError } = await supabase.from("profile_personal_details")
      .select("emergency_contact_name, emergency_contact_phone, emergency_contact_relationship, address_text, social_handles")
      .eq("profile_id", me.id).maybeSingle();
    if (personalError) { setMessage(personalError.message); return; }
    setDetails(personal || { emergency_contact_name: "", emergency_contact_phone: "", emergency_contact_relationship: "", address_text: "", social_handles: {} });

    const { data: currentProfile, error: profileError } = await supabase.from("profiles")
      .select("full_name, preferred_name, email, phone, birthday, job_title, joined_at, contract_type")
      .eq("id", me.id).single();
    if (profileError) { setMessage(profileError.message); return; }
    if (currentProfile) setProfile((value) => ({ ...value, ...currentProfile }));
  }

  const policyConfigured = Boolean(leavePolicy);
  const annualRule = leavePolicyRules.find((rule) => rule.leave_kind === "annual" && rule.complete);
  const sickRule = leavePolicyRules.find((rule) => rule.leave_kind === "sick" && rule.complete);
  const simpleBalanceRule = (rule) => Boolean(
    rule
    && rule.entitlement_unit === "days"
    && !rule.opening_balance_required
    && (rule.accrual_method === "annual" || rule.accrual_method === "none")
    && rule.carryover_method === "none"
  );
  const annualEntitlement = simpleBalanceRule(annualRule) ? Number(annualRule.entitlement_amount || 0) : null;
  const sickEntitlement = simpleBalanceRule(sickRule) ? Number(sickRule.entitlement_amount || 0) : null;
  const currentYear = new Date().getFullYear();
  const approvedThisYear = myRequests.filter((request) =>
    request.status === "approved" && new Date(request.start_date + "T00:00:00").getFullYear() === currentYear
  );
  const annualTaken = approvedThisYear.filter((request) => request.kind === "annual").reduce((sum, request) => sum + Number(request.days || 0), 0);
  const sickTaken = approvedThisYear.filter((request) => request.kind === "sick").reduce((sum, request) => sum + Number(request.days || 0), 0);
  const annualLeft = annualEntitlement === null ? null : annualEntitlement - annualTaken;
  const sickLeft = sickEntitlement === null ? null : sickEntitlement - sickTaken;
  const activeGoals = goals.filter((goal) => goal.status === "active");
  const achievedGoals = goals.filter((goal) => goal.status === "achieved");

  function daysBetween(a, b) {
    if (!a || !b) return 0;
    return Math.max(0, Math.round((new Date(b) - new Date(a)) / 86400000) + 1);
  }

  async function requestLeave() {
    setBusy(true);
    try {
      const days = daysBetween(startDate, endDate);
      if (days <= 0) throw new Error("Pick a valid range.");
      const { error } = await supabase.rpc("workforce_request_leave", {
        p_kind: kind,
        p_start_date: startDate,
        p_end_date: endDate,
        p_reason: reason || null,
      });
      if (error) throw error;
      setSheet(null); setKind("annual"); setStartDate(""); setEndDate(""); setReason("");
      await load();
    } catch (error) { setMessage(humanError(error, "CEAC could not save that change.")); }
    finally { setBusy(false); }
  }

  async function cancelLeave(id) {
    setBusy(true); setMessage(null);
    try {
      const { error } = await supabase.rpc("workforce_leave_action", {
        p_leave_request_id: id,
        p_action: "cancelled_by_employee",
        p_reason: "Cancelled by employee",
      });
      if (error) throw error;
      await load();
    } catch (error) { setMessage(humanError(error, "That leave request could not be cancelled.")); }
    finally { setBusy(false); }
  }

  async function createGoal() {
    setBusy(true);
    try {
      const { data, error } = await supabase.from("personal_goals").insert({
        org_id: me.org_id,
        profile_id: me.id,
        title: goalTitle.trim(),
        target_date: goalDate || null,
      }).select("id").single();
      if (error) throw error;
      setSheet(null); setGoalTitle(""); setGoalDate("");
      await load();
      if (openGoal && data) openGoal(data.id);
    } catch (error) { setMessage(humanError(error, "CEAC could not save that change.")); }
    finally { setBusy(false); }
  }

  async function createReminder() {
    setBusy(true);
    try {
      if (!remindAt) throw new Error("Pick when to be reminded.");
      const { error } = await supabase.from("personal_reminders").insert({
        org_id: me.org_id,
        profile_id: me.id,
        title: remindTitle.trim(),
        remind_at: new Date(remindAt).toISOString(),
      });
      if (error) throw error;
      setSheet(null); setRemindTitle(""); setRemindAt("");
      await load();
    } catch (error) { setMessage(humanError(error, "CEAC could not save that change.")); }
    finally { setBusy(false); }
  }

  async function markReminderSeen(id) {
    setMessage(null);
    const { error } = await supabase.from("personal_reminders").update({ seen_at: new Date().toISOString() }).eq("id", id);
    if (error) { setMessage(error.message); return; }
    await load();
  }

  function openProfile() {
    setMessage(null);
    setProfileForm({
      preferred_name: profile.preferred_name || "",
      phone: profile.phone || "",
      birthday: profile.birthday || "",
      emergency_contact_name: details.emergency_contact_name || "",
      emergency_contact_phone: details.emergency_contact_phone || "",
      emergency_contact_relationship: details.emergency_contact_relationship || "",
      address_text: details.address_text || "",
      instagram: details.social_handles?.instagram || "",
      linkedin: details.social_handles?.linkedin || "",
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
        p_social_handles: {
          instagram: profileForm.instagram.trim(),
          linkedin: profileForm.linkedin.trim(),
        },
      });
      if (error) throw error;
      setMessage("Saved. This change is recorded in your profile history.");
      await load();
    } catch (error) { setMessage(humanError(error, "Your details could not be saved.")); }
    finally { setBusy(false); }
  }

  function InfoRow({ label, value }) {
    return <div className="info-row"><span>{label}</span><strong>{value}</strong></div>;
  }

  return <div className="body staff-me">
    {message && !sheet && <ProductNotice tone={message.startsWith("Saved") ? "success" : "error"} title={message.startsWith("Saved") ? "Saved" : "Could not complete that"}>{message}</ProductNotice>}
    <div className="staff-page-intro">
      <div className="eyebrow">{me.unit_name}</div>
      <h1 className="h1">{profile.preferred_name || profile.full_name}</h1>
      <p className="screen-note">{profile.job_title || "Staff"} · your goals, leave and personal details.</p>
    </div>

    <div className="personal-entry-stack">
      <button className="personal-history-entry" type="button" onClick={() => openRecord?.()}>
        <span><strong>My work history</strong><small>Completed work, feedback and recorded activity by month.</small></span>
        <b aria-hidden="true">→</b>
      </button>
      {!me.is_admin && !me.is_exec && <button className="personal-history-entry" type="button" onClick={() => openPerformance?.()}>
        <span><strong>Reviews & development</strong><small>Your review evidence, reflection, manager assessment, responses and development plan.</small></span>
        <b aria-hidden="true">→</b>
      </button>}
      {!me.is_admin && !me.is_exec && <button className="personal-history-entry" type="button" onClick={() => openWorkforce?.()}>
        <span><strong>My workforce context</strong><small>Your schedule, recorded session context, leave history and attendance corrections.</small></span>
        <b aria-hidden="true">→</b>
      </button>}
    </div>

    <div className="staff-segment" role="tablist" aria-label="Personal area">
      <button role="tab" aria-selected={area === "goals"} className={area === "goals" ? "on" : ""} onClick={() => setArea("goals")}>Goals</button>
      <button role="tab" aria-selected={area === "leave"} className={area === "leave" ? "on" : ""} onClick={() => setArea("leave")}>Leave</button>
      <button role="tab" aria-selected={area === "personal"} className={area === "personal" ? "on" : ""} onClick={() => setArea("personal")}>Personal</button>
    </div>

    {area === "goals" && <div className="personal-area">
      <div className="area-heading">
        <div><span className="eyebrow">Private to you</span><h2>Goals & development</h2></div>
        <button className="btn btn-sm" onClick={() => setSheet("goal")}>Add goal</button>
      </div>
      <p className="context-note">Your personal goals are not counted in CEAC reports. Use them to plan your own development.</p>

      {activeGoals.length > 0 ? <div className="goal-list">
        {activeGoals.map((goal) => <button key={goal.id} className="goal-card" onClick={() => openGoal?.(goal.id)}>
          <strong>{goal.title}</strong>
          <span>{goal.target_date ? `By ${dateOnly(goal.target_date)}` : "No target date"}</span>
          <b aria-hidden="true">→</b>
        </button>)}
      </div> : <div className="quiet-empty compact">
        <strong>No active personal goals</strong>
        <span>Add something you want to develop or accomplish for yourself.</span>
      </div>}

      {achievedGoals.length > 0 && <div className="development-summary">
        <strong>{achievedGoals.length}</strong>
        <span>{achievedGoals.length === 1 ? "goal marked achieved" : "goals marked achieved"}</span>
      </div>}

      <div className="area-heading secondary">
        <div><span className="eyebrow">For yourself</span><h2>Reminders</h2></div>
        <button className="btn btn-ghost btn-sm" onClick={() => setSheet("remind")}>Add reminder</button>
      </div>
      {reminders.length > 0 ? reminders.map((reminder) => <div key={reminder.id} className="reminder-row">
        <div>
          <strong>{reminder.title}</strong>
          <span>{new Date(reminder.remind_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</span>
        </div>
        <button className="text-action" onClick={() => markReminderSeen(reminder.id)}>Done</button>
      </div>) : <div className="context-note">No reminders are waiting.</div>}
    </div>}

    {area === "leave" && <div className="personal-area">
      <div className="area-heading">
        <div><span className="eyebrow">Time away</span><h2>Leave</h2></div>
        <button className="btn btn-sm" onClick={() => setSheet("leave")}>Ask for leave</button>
      </div>

      {!policyConfigured && <ProductNotice tone="attention" title="Leave policy not configured">Your requests remain available, but CEAC OS will not invent leave entitlement or remaining-day figures.</ProductNotice>}
      {policyConfigured && (annualLeft === null || sickLeft === null) && <ProductNotice tone="info" title="Some balances are unavailable">A confirmed policy exists, but CEAC OS only calculates a remaining balance when the relevant rule has explicit day entitlement, a supported accrual method, no carry-over, and no unresolved opening-balance requirement.</ProductNotice>}
      <div className="leave-summary">
        <div><strong>{annualLeft === null ? "—" : annualLeft}</strong><span>{annualLeft === null ? "annual balance unavailable" : "annual days left"}</span></div>
        <div><strong>{sickLeft === null ? "—" : sickLeft}</strong><span>{sickLeft === null ? "sick balance unavailable" : "sick days left"}</span></div>
      </div>

      {myRequests.length > 0 && <>
        <div className="area-heading secondary"><div><h2>Your requests</h2></div></div>
        {myRequests.map((request) => <div key={request.id} className="leave-request-row">
          <div>
            <strong>{request.days} day{request.days === 1 ? "" : "s"} {request.kind} leave</strong>
            <span>{dateOnly(request.start_date)} — {dateOnly(request.end_date)}</span>
          </div>
          <div className="leave-request-actions">
            <span className={`pill ${request.status === "approved" ? "p-green" : request.status === "declined" || request.status === "cancelled" ? "p-brick" : "p-amber"}`}>
              {request.status === "approved" ? "Approved" : request.status === "declined" ? "Declined" : request.status === "cancelled" ? "Cancelled" : request.status === "escalated" ? "With admin" : "Waiting"}
            </span>
            {(request.status === "pending" || request.status === "escalated") && <button className="text-action" disabled={busy} onClick={() => cancelLeave(request.id)}>Cancel</button>}
          </div>
        </div>)}
      </>}
    </div>}

    {area === "personal" && <div className="personal-area">
      <div className="area-heading">
        <div><span className="eyebrow">Your information</span><h2>Personal & employment</h2></div>
        <button className="btn btn-ghost btn-sm" onClick={openProfile}>Edit</button>
      </div>

      <div className="info-list">
        {profile.preferred_name && <InfoRow label="Preferred name" value={profile.preferred_name} />}
        <InfoRow label="Official name" value={profile.full_name} />
        <InfoRow label="Email" value={profile.email} />
        <InfoRow label="Phone" value={profile.phone || "Not added"} />
        <InfoRow label="Unit" value={me.unit_name || "—"} />
        <InfoRow label="Position" value={me.is_exec ? "Group Pastor" : me.is_admin ? "Administration & HR" : me.role === "manager" ? "Unit head" : "Staff"} />
        {profile.joined_at && <InfoRow label="Joined" value={dateOnly(profile.joined_at)} />}
        {profile.birthday && <InfoRow label="Birthday" value={new Date(profile.birthday).toLocaleDateString("en-GB", { day: "numeric", month: "long" })} />}
      </div>

      <div className="protected-boundary">
        <strong>Protected HR records</strong>
        <span>Ghana Card, SSNIT, tax, banking, contracts, payslips and private documents use a separate protected HR system and are not stored in these ordinary profile details.</span>
      </div>

      <button className="text-action signout-action" onClick={() => supabase.auth.signOut()}>Sign out</button>
    </div>}

    {sheet === "leave" && <Sheet onClose={() => setSheet(null)}>
      <div className="h2">Ask for leave</div>
      <p className="screen-note">Your manager will see this and approve it or send it on to Administration where required.</p>
      <div className="sec" style={{ marginTop: 12 }}><span>Kind of leave</span></div>
      {[["annual","Annual"],["sick","Sick"],["bereavement","Bereavement"],["maternity","Maternity"],["other","Other"]].map(([key, label]) => <button key={key} className="opt" onClick={() => setKind(key)}>
        <span className={`rd ${kind === key ? "on" : ""}`} /> {label}
      </button>)}
      <FieldGroup label="Leave starts"><input className="field" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></FieldGroup>
      <FieldGroup label="Leave ends"><input className="field" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></FieldGroup>
      <FieldGroup label="Reason" hint="Optional. Keep it brief."><textarea className="field" rows={2} placeholder="A short reason" value={reason} onChange={(event) => setReason(event.target.value)} /></FieldGroup>
      {startDate && endDate && <div className="small" style={{ marginTop: 8 }}>That is {daysBetween(startDate, endDate)} day{daysBetween(startDate, endDate) === 1 ? "" : "s"}.</div>}
      <button className="btn" style={{ marginTop: 14 }} onClick={requestLeave} disabled={busy || !startDate || !endDate}>{busy ? "Sending..." : "Send request"}</button>
    </Sheet>}

    {sheet === "goal" && <Sheet onClose={() => setSheet(null)}>
      <div className="h2">Add a personal goal</div>
      <p className="screen-note">Only you see this. Add steps inside the goal after creating it.</p>
      <FieldGroup label="Goal"><input className="field" placeholder="What are you aiming for?" value={goalTitle} onChange={(event) => setGoalTitle(event.target.value)} /></FieldGroup>
      <FieldGroup label="Target date" hint="Optional."><input className="field" type="date" value={goalDate} onChange={(event) => setGoalDate(event.target.value)} /></FieldGroup>
      <button className="btn" style={{ marginTop: 14 }} onClick={createGoal} disabled={busy || !goalTitle.trim()}>{busy ? "Saving..." : "Add goal"}</button>
    </Sheet>}

    {sheet === "remind" && <Sheet onClose={() => setSheet(null)}>
      <div className="h2">Add a reminder</div>
      <p className="screen-note">Only you see this reminder.</p>
      <FieldGroup label="Reminder"><input className="field" placeholder="What to remind you of" value={remindTitle} onChange={(event) => setRemindTitle(event.target.value)} /></FieldGroup>
      <FieldGroup label="When"><input className="field" type="datetime-local" value={remindAt} onChange={(event) => setRemindAt(event.target.value)} /></FieldGroup>
      <button className="btn" style={{ marginTop: 14 }} onClick={createReminder} disabled={busy || !remindTitle.trim() || !remindAt}>{busy ? "Saving..." : "Set reminder"}</button>
    </Sheet>}

    {sheet === "profile" && <Sheet onClose={() => !busy && setSheet(null)}>
      <div className="h2">Edit personal details</div>
      <p className="screen-note">Official employment details remain read-only. Emergency contact and address details are visible only to you and Administration.</p>
      <label className="field-label" htmlFor="profile-preferred-name">Preferred name</label>
      <input id="profile-preferred-name" className="field" value={profileForm.preferred_name} onChange={(event) => setProfileForm((value) => ({ ...value, preferred_name: event.target.value }))} />
      <label className="field-label" htmlFor="profile-phone">Phone</label>
      <input id="profile-phone" className="field" type="tel" value={profileForm.phone} onChange={(event) => setProfileForm((value) => ({ ...value, phone: event.target.value }))} />
      <label className="field-label" htmlFor="profile-birthday">Birthday</label>
      <input id="profile-birthday" className="field" type="date" value={profileForm.birthday} max={new Date().toISOString().slice(0, 10)} onChange={(event) => setProfileForm((value) => ({ ...value, birthday: event.target.value }))} />

      <div className="sec"><span>Emergency contact</span></div>
      <label className="field-label" htmlFor="profile-emergency-name">Contact name</label>
      <input id="profile-emergency-name" className="field" placeholder="Contact name" value={profileForm.emergency_contact_name} onChange={(event) => setProfileForm((value) => ({ ...value, emergency_contact_name: event.target.value }))} />
      <label className="field-label" htmlFor="profile-emergency-phone">Contact phone</label>
      <input id="profile-emergency-phone" className="field" type="tel" placeholder="Contact phone" value={profileForm.emergency_contact_phone} onChange={(event) => setProfileForm((value) => ({ ...value, emergency_contact_phone: event.target.value }))} />
      <label className="field-label" htmlFor="profile-emergency-relationship">Relationship</label>
      <input id="profile-emergency-relationship" className="field" placeholder="Relationship" value={profileForm.emergency_contact_relationship} onChange={(event) => setProfileForm((value) => ({ ...value, emergency_contact_relationship: event.target.value }))} />

      <label className="field-label" htmlFor="profile-address">Address or ordinary contact information</label>
      <textarea id="profile-address" className="field" rows="3" value={profileForm.address_text} onChange={(event) => setProfileForm((value) => ({ ...value, address_text: event.target.value }))} />

      <div className="sec"><span>Social handles</span></div>
      <FieldGroup label="Instagram"><input className="field" placeholder="Username or profile link" value={profileForm.instagram} onChange={(event) => setProfileForm((value) => ({ ...value, instagram: event.target.value }))} /></FieldGroup>
      <FieldGroup label="LinkedIn"><input className="field" placeholder="Profile link" value={profileForm.linkedin} onChange={(event) => setProfileForm((value) => ({ ...value, linkedin: event.target.value }))} /></FieldGroup>

      {message && <ProductNotice tone={message.startsWith("Saved") ? "success" : "attention"} title={message.startsWith("Saved") ? "Saved" : "Could not save"}>{message}</ProductNotice>}
      <button className="btn" style={{ marginTop: 14 }} onClick={saveProfile} disabled={busy}>{busy ? "Saving..." : "Save personal details"}</button>
    </Sheet>}
  </div>;
}
