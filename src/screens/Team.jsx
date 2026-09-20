import { useEffect, useState } from "react";
import { supabase, inviteByEmail } from "../lib/supabase";
import { isOverdue } from "../lib/time";
import { Pill, Sheet } from "../components/bits";

function weekStart() {
  const value = new Date();
  value.setHours(0, 0, 0, 0);
  value.setDate(value.getDate() - ((value.getDay() + 6) % 7));
  return value;
}

function dayKey(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function requireResult(result, label) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data || [];
}

function CountLink({ children, onClick }) {
  return <button onClick={(event) => { event.stopPropagation(); onClick(); }} style={{ textDecoration: "underline", color: "var(--ink-soft)" }}>{children}</button>;
}

export default function Team({ me, openPerson }) {
  const [people, setPeople] = useState([]);
  const [subTeams, setSubTeams] = useState([]);
  const [members, setMembers] = useState({});
  const [pending, setPending] = useState([]);
  const [showSetup, setShowSetup] = useState(false);
  const [sheet, setSheet] = useState(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [editName, setEditName] = useState("");
  const [moveWorkTo, setMoveWorkTo] = useState("");
  const [removeWorkCount, setRemoveWorkCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => { load(); }, [me.id, me.unit_id]);

  async function load() {
    if (!me.unit_id) return;
    setLoading(true);
    setError(null);
    try {
      const start = weekStart();
      const today = dayKey();
      const [membershipResult, subTeamResult, workResult, sessionResult,
        submissionResult, leaveResult, pendingResult] = await Promise.all([
        supabase.from("unit_memberships")
          .select("id, role, profile_id, profiles!unit_memberships_profile_id_fkey(id, full_name, email, job_title)")
          .eq("unit_id", me.unit_id),
        supabase.from("sub_teams")
          .select("id, name, code, position, lead_id, profiles!sub_teams_lead_fk(full_name)")
          .eq("unit_id", me.unit_id).eq("active", true).order("position"),
        supabase.from("work_items")
          .select("id, ref, title, kind, assignee_id, status, due_at, completed_at")
          .eq("unit_id", me.unit_id).neq("visibility", "private"),
        supabase.from("work_sessions").select("id, profile_id, started_at")
          .gte("started_at", start.toISOString()),
        supabase.from("submissions").select("id, profile_id, submitted_at, work_items!inner(unit_id)")
          .eq("work_items.unit_id", me.unit_id).gte("submitted_at", start.toISOString()),
        supabase.from("leave_requests").select("profile_id, start_date, end_date, status")
          .eq("status", "approved").lte("start_date", today).gte("end_date", today),
        supabase.from("pending_invitations").select("email, full_name, invited_at")
          .eq("unit_id", me.unit_id).is("resolved_at", null),
      ]);

      const memberships = requireResult(membershipResult, "Team members");
      const staff = memberships.filter((membership) => membership.profile_id !== me.id);
      const staffIds = new Set(staff.map((membership) => membership.profile_id));
      const work = requireResult(workResult, "Team work").filter((item) => staffIds.has(item.assignee_id));
      const sessions = requireResult(sessionResult, "Team attendance").filter((session) => staffIds.has(session.profile_id));
      const submissions = requireResult(submissionResult, "Team submissions").filter((submission) => staffIds.has(submission.profile_id));
      const leaveIds = new Set(requireResult(leaveResult, "Team leave").filter((request) => staffIds.has(request.profile_id)).map((request) => request.profile_id));

      setPeople(staff.map((membership) => {
        const personWork = work.filter((item) => item.assignee_id === membership.profile_id);
        const personSessions = sessions.filter((session) => session.profile_id === membership.profile_id);
        const presenceDays = new Set(personSessions.map((session) => dayKey(new Date(session.started_at)))).size;
        const submitted = submissions.filter((submission) => submission.profile_id === membership.profile_id).length;
        const current = personWork.filter((item) => !["completed", "self_certified", "cancelled"].includes(item.status));
        return {
          ...membership,
          presence: leaveIds.has(membership.profile_id) ? "On leave" : personSessions.some((session) => dayKey(new Date(session.started_at)) === today) ? "Present" : "Not started",
          presenceDays,
          submitted,
          completed: personWork.filter((item) => ["task", "deliverable"].includes(item.kind) && ["completed", "self_certified"].includes(item.status) && item.completed_at && new Date(item.completed_at) >= start).length,
          overdue: current.filter((item) => isOverdue(item.due_at) && item.status !== "waiting_on").length,
          awaiting: current.filter((item) => item.status === "in_review").length,
          current,
        };
      }));

      const teams = requireResult(subTeamResult, "Parts of the team");
      setSubTeams(teams);
      if (teams.length) {
        const memberResult = await supabase.from("sub_team_members")
          .select("sub_team_id, profile_id").in("sub_team_id", teams.map((team) => team.id));
        const map = {};
        requireResult(memberResult, "Team assignments").forEach((row) => {
          if (!map[row.profile_id]) map[row.profile_id] = [];
          map[row.profile_id].push(row.sub_team_id);
        });
        setMembers(map);
      } else setMembers({});
      setPending(requireResult(pendingResult, "Pending invitations"));
    } catch (err) { setError(err.message || "The team could not be loaded."); }
    finally { setLoading(false); }
  }

  async function addSubTeam() {
    setBusy(true); setMsg(null);
    try {
      const { error: insertError } = await supabase.from("sub_teams").insert({
        org_id: me.org_id, unit_id: me.unit_id, name: name.trim(),
        code: (code.trim() || name.trim().slice(0, 3)).toUpperCase(), position: subTeams.length + 1,
      });
      if (insertError) throw insertError;
      setSheet(null); setName(""); setCode(""); await load();
    } catch (err) { setMsg(err.message || "That part of the team could not be added."); }
    finally { setBusy(false); }
  }

  async function renameSubTeam(team) {
    if (!editName.trim()) return;
    setBusy(true); setMsg(null);
    try {
      const { error: updateError } = await supabase.from("sub_teams")
        .update({ name: editName.trim() }).eq("id", team.id).eq("unit_id", me.unit_id);
      if (updateError) throw updateError;
      setSheet(null); setEditName(""); await load();
    } catch (err) { setMsg(err.message || "That part could not be renamed."); }
    finally { setBusy(false); }
  }

  async function moveSubTeam(team, direction) {
    const index = subTeams.findIndex((row) => row.id === team.id);
    const other = subTeams[index + direction];
    if (!other) return;
    setError(null);
    const first = await supabase.from("sub_teams").update({ position: other.position }).eq("id", team.id).eq("unit_id", me.unit_id);
    if (first.error) { setError(first.error.message); return; }
    const second = await supabase.from("sub_teams").update({ position: team.position }).eq("id", other.id).eq("unit_id", me.unit_id);
    if (second.error) { setError(second.error.message); return; }
    await load();
  }

  async function openRemoveSubTeam(team) {
    setMsg(null); setMoveWorkTo("");
    const result = await supabase.from("work_items").select("id", { count: "exact", head: true }).eq("sub_team_id", team.id);
    if (result.error) { setError(result.error.message); return; }
    setRemoveWorkCount(result.count || 0);
    setSheet({ type: "remove-subteam", team });
  }

  async function removeSubTeam(team) {
    setBusy(true); setMsg(null);
    try {
      if (removeWorkCount > 0) {
        const { error: workError } = await supabase.from("work_items")
          .update({ sub_team_id: moveWorkTo || null })
          .eq("sub_team_id", team.id);
        if (workError) throw new Error(`Work could not be moved: ${workError.message}`);
      }
      const { error: deleteError } = await supabase.from("sub_teams").delete().eq("id", team.id).eq("unit_id", me.unit_id);
      if (deleteError) throw deleteError;
      setSheet(null); setMoveWorkTo(""); setRemoveWorkCount(0); await load();
    } catch (err) { setMsg(err.message || "That part could not be removed."); }
    finally { setBusy(false); }
  }

  async function toggleMember(profileId, subTeamId) {
    setError(null);
    const has = (members[profileId] || []).includes(subTeamId);
    const result = has
      ? await supabase.from("sub_team_members").delete().eq("sub_team_id", subTeamId).eq("profile_id", profileId)
      : await supabase.from("sub_team_members").insert({ sub_team_id: subTeamId, profile_id: profileId });
    if (result.error) { setError(result.error.message); return; }
    await load();
  }

  async function setRole(membershipId, role) {
    setError(null);
    const { error: updateError } = await supabase.from("unit_memberships").update({ role }).eq("id", membershipId).eq("unit_id", me.unit_id);
    if (updateError) { setError(updateError.message); return; }
    await load();
  }

  async function invite() {
    setBusy(true); setMsg(null);
    try {
      await inviteByEmail({ orgId: me.org_id, invitedBy: me.id, email, fullName, unitId: me.unit_id, role: "staff" });
      setMsg("Sent. They appear here once they sign in.");
      setEmail(""); setFullName(""); await load();
    } catch (err) { setMsg(err.message || "The invitation could not be sent."); }
    finally { setBusy(false); }
  }

  return (
    <div className="body">
      <div style={{ paddingTop: 26 }}>
        <div className="eyebrow">{me.unit_name}</div>
        <h1 className="h1" style={{ marginTop: 6 }}>Your team</h1>
        <p className="screen-note">Presence and work are shown side by side as facts. They are not a judgement about a person.</p>
      </div>
      {error && <div className="flag flag-brick" style={{ marginTop: 14 }}><h4>Could not complete that</h4>{error}</div>}
      {loading && <div className="spin">Loading your team...</div>}

      {!loading && <><div className="sec"><span>People</span><span>{people.length}</span></div>
      {people.map((person) => (
        <div key={person.id} className="row">
          <button onClick={() => openPerson(person.profile_id, "current")} style={{ width: "100%", textAlign: "left" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
            <div className="row-t">{person.profiles?.full_name || "—"}</div>
            <Pill tone={person.presence === "Present" ? "green" : person.presence === "On leave" ? "amber" : "grey"}>{person.presence}</Pill>
            </div>
            <div className="row-m">{person.profiles?.job_title || person.role}</div>
            {person.current.length > 0 && <div className="row-note">Currently: {person.current.slice(0, 2).map((item) => item.title).join(" · ")}{person.current.length > 2 ? ` · ${person.current.length - 2} more` : ""}</div>}
          </button>
          <div className="row-note" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <CountLink onClick={() => openPerson(person.profile_id, "sessions")}>Present {person.presenceDays} day{person.presenceDays === 1 ? "" : "s"}</CountLink>
            <span>·</span><CountLink onClick={() => openPerson(person.profile_id, "completed")}>{person.completed} completed</CountLink>
            <span>·</span><CountLink onClick={() => openPerson(person.profile_id, "overdue")}>{person.overdue} overdue</CountLink>
            <span>·</span><CountLink onClick={() => openPerson(person.profile_id, "review")}>{person.awaiting} awaiting you</CountLink>
            <span>·</span><CountLink onClick={() => openPerson(person.profile_id, "submitted")}>{person.submitted} submitted</CountLink>
          </div>
        </div>
      ))}
      {people.length === 0 && <div className="card small">There are no other staff members in this unit yet. Your own work remains under My work.</div>}

      <div className="sec"><span>Team setup</span><span>{showSetup ? "Open" : "Secondary"}</span></div>
      <button className="btn btn-ghost wide-auto" onClick={() => setShowSetup((value) => !value)}>{showSetup ? "Hide team setup" : "Open team setup"}</button>
      <p className="screen-note">Invitations, roles and parts of the team live here. Leave decisions remain on Home.</p>

      {showSetup && <div className="split" style={{ marginTop: 12 }}>
        <div className="main-col">
          <div className="sec"><span>Staff and invitations</span><span>{people.length + pending.length}</span></div>
          {people.map((person) => (
            <div key={person.id} className="row">
              <div className="row-t">{person.profiles?.full_name || "—"}</div>
              <select className="field" value={person.role} onChange={(event) => setRole(person.id, event.target.value)}>
                <option value="staff">Staff</option><option value="sub_team_lead">Team lead</option><option value="manager">Unit head</option>
              </select>
              {subTeams.length > 0 && <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                {subTeams.map((team) => {
                  const on = (members[person.profile_id] || []).includes(team.id);
                  return <button key={team.id} onClick={() => toggleMember(person.profile_id, team.id)} className={"pill " + (on ? "p-green" : "p-grey")}>{team.name}</button>;
                })}
              </div>}
            </div>
          ))}
          {pending.map((person) => <div key={person.email} className="row"><div className="row-t">{person.full_name || person.email}</div><div className="row-m">Invitation sent — waiting for sign-in</div></div>)}
          <button className="btn btn-ghost wide-auto" onClick={() => { setSheet("invite"); setMsg(null); }}>Add someone</button>
        </div>
        <div className="side-col">
          <div className="sec"><span>Parts of the team</span><span>{subTeams.length}</span></div>
          {subTeams.map((team, index) => <div key={team.id} className="row">
            <div className="row-t">{team.name}</div>
            <div className="row-m">{team.code} · {Object.values(members).filter((value) => value.includes(team.id)).length} people{team.profiles?.full_name ? ` · led by ${team.profiles.full_name}` : " · no lead yet"}</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 9 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => { setEditName(team.name); setMsg(null); setSheet({ type: "rename-subteam", team }); }}>Rename</button>
              <button className="btn btn-ghost btn-sm" disabled={index === 0} onClick={() => moveSubTeam(team, -1)}>Move up</button>
              <button className="btn btn-ghost btn-sm" disabled={index === subTeams.length - 1} onClick={() => moveSubTeam(team, 1)}>Move down</button>
              <button className="btn btn-ghost btn-sm" onClick={() => openRemoveSubTeam(team)}>Remove</button>
            </div>
          </div>)}
          {subTeams.length === 0 && <div className="card small">No parts have been set up. Empty parts are allowed.</div>}
          <button className="btn btn-ghost wide-auto" style={{ marginTop: 10 }} onClick={() => { setSheet("subteam"); setMsg(null); }}>Add a part</button>
        </div>
      </div>}

      {sheet === "subteam" && <Sheet onClose={() => setSheet(null)}>
        <div className="h2">Add a part of the team</div>
        <p className="screen-note">It can exist before anybody is placed in it.</p>
        <input className="field" placeholder="What it is called" value={name} onChange={(event) => setName(event.target.value)} />
        <input className="field" placeholder="Short code, e.g. GFX" value={code} onChange={(event) => setCode(event.target.value)} maxLength={4} />
        {msg && <div className="flag flag-brick" style={{ marginTop: 12 }}>{msg}</div>}
        <button className="btn" style={{ marginTop: 14 }} onClick={addSubTeam} disabled={busy || !name.trim()}>{busy ? "Saving..." : "Add it"}</button>
      </Sheet>}
      {sheet?.type === "rename-subteam" && <Sheet onClose={() => !busy && setSheet(null)}>
        <div className="h2">Rename this part</div>
        <p className="screen-note">Existing work references stay unchanged. New work will use the same short code unless you set up a different part.</p>
        <input className="field" value={editName} onChange={(event) => setEditName(event.target.value)} />
        {msg && <div className="flag flag-brick" style={{ marginTop: 12 }}>{msg}</div>}
        <button className="btn" style={{ marginTop: 14 }} disabled={busy || !editName.trim()} onClick={() => renameSubTeam(sheet.team)}>{busy ? "Saving..." : "Rename"}</button>
      </Sheet>}
      {sheet?.type === "remove-subteam" && <Sheet onClose={() => !busy && setSheet(null)}>
        <div className="h2">Remove {sheet.team.name}?</div>
        <p className="screen-note">{removeWorkCount > 0 ? `${removeWorkCount} work item${removeWorkCount === 1 ? "" : "s"} currently sit in this part. Choose where that work should go before removing it.` : "No work is currently attached to this part."}</p>
        {removeWorkCount > 0 && <select className="field" value={moveWorkTo} onChange={(event) => setMoveWorkTo(event.target.value)}>
          <option value="">General unit work — no part</option>
          {subTeams.filter((team) => team.id !== sheet.team.id).map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
        </select>}
        <div className="hint">Removing the part does not delete its work. Existing work references are kept.</div>
        {msg && <div className="flag flag-brick" style={{ marginTop: 12 }}>{msg}</div>}
        <button className="btn" style={{ marginTop: 14 }} disabled={busy} onClick={() => removeSubTeam(sheet.team)}>{busy ? "Moving work..." : "Move work and remove part"}</button>
      </Sheet>}
      {sheet === "invite" && <Sheet onClose={() => { setSheet(null); setMsg(null); }}>
        <div className="h2">Add someone to the team</div>
        <input className="field" placeholder="Their full name" value={fullName} onChange={(event) => setFullName(event.target.value)} />
        <input className="field" placeholder="Their work email" type="email" autoCapitalize="none" value={email} onChange={(event) => setEmail(event.target.value)} />
        {msg && <div className="flag flag-amber" style={{ marginTop: 12 }}>{msg}</div>}
        <button className="btn" style={{ marginTop: 14 }} onClick={invite} disabled={busy || !email.trim() || !fullName.trim()}>{busy ? "Sending..." : "Send invitation"}</button>
      </Sheet>}
      </>}
    </div>
  );
}
