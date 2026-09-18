import { useEffect, useState } from "react";
import { supabase, inviteByEmail } from "../lib/supabase";
import { Sheet } from "../components/bits";

export default function Team({ me }) {
  const [subTeams, setSubTeams] = useState([]);
  const [people, setPeople] = useState([]);
  const [members, setMembers] = useState({});
  const [pending, setPending] = useState([]);
  const [leaveQueue, setLeaveQueue] = useState([]);
  const [limit, setLimit] = useState(5);
  const [sheet, setSheet] = useState(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => { load(); }, [me.unit_id]);

  async function load() {
    if (!me.unit_id) return;
    const { data: ls } = await supabase.from("leave_settings")
      .select("manager_approval_limit").eq("org_id", me.org_id).maybeSingle();
    if (ls) setLimit(ls.manager_approval_limit);
    const { data: st } = await supabase.from("sub_teams")
      .select("id, name, code, position, lead_id, profiles:lead_id(full_name)")
      .eq("unit_id", me.unit_id).eq("active", true).order("position");
    setSubTeams(st || []);
    const { data: m } = await supabase.from("unit_memberships")
      .select("id, role, profile_id, profiles(id, full_name, email, job_title)")
      .eq("unit_id", me.unit_id);
    setPeople(m || []);
    if (st && st.length) {
      const { data: stm } = await supabase.from("sub_team_members")
        .select("sub_team_id, profile_id").in("sub_team_id", st.map((x) => x.id));
      const map = {};
      (stm || []).forEach((r) => {
        if (!map[r.profile_id]) map[r.profile_id] = [];
        map[r.profile_id].push(r.sub_team_id);
      });
      setMembers(map);
    }
    const { data: pi } = await supabase.from("pending_invitations")
      .select("email, full_name, invited_at").eq("unit_id", me.unit_id).is("resolved_at", null);
    setPending(pi || []);
    const { data: lq } = await supabase.from("leave_requests")
      .select("id, kind, start_date, end_date, days, status, reason, profiles(full_name, id)")
      .eq("status", "pending").order("requested_at", { ascending: false });
    setLeaveQueue((lq || []).filter((r) => (m || []).some((mm) => mm.profile_id === (r.profiles && r.profiles.id))));
  }

  async function addSubTeam() {
    setBusy(true);
    try {
      const { error } = await supabase.from("sub_teams").insert({
        org_id: me.org_id, unit_id: me.unit_id, name: name.trim(),
        code: (code.trim() || name.trim().slice(0, 3)).toUpperCase(),
        position: subTeams.length + 1 });
      if (error) throw error;
      setSheet(null); setName(""); setCode(""); await load();
    } catch (e) { setMsg(e.message); }
    finally { setBusy(false); }
  }

  async function toggleMember(profileId, subTeamId) {
    const has = (members[profileId] || []).includes(subTeamId);
    if (has) await supabase.from("sub_team_members").delete().eq("sub_team_id", subTeamId).eq("profile_id", profileId);
    else await supabase.from("sub_team_members").insert({ sub_team_id: subTeamId, profile_id: profileId });
    await load();
  }

  async function setRole(membershipId, role) {
    await supabase.from("unit_memberships").update({ role }).eq("id", membershipId);
    await load();
  }

  async function invite() {
    setBusy(true); setMsg(null);
    try {
      await inviteByEmail({ orgId: me.org_id, invitedBy: me.id, email, fullName, unitId: me.unit_id, role: "staff" });
      setMsg("Sent. They appear here once they sign in.");
      setEmail(""); setFullName(""); await load();
    } catch (e) { setMsg(e.message); }
    finally { setBusy(false); }
  }

  async function decideLeave(r, decision) {
    const escalate = decision === "approved" && r.days > limit;
    const status = decision === "declined" ? "declined" : (escalate ? "escalated" : "approved");
    await supabase.from("leave_requests").update({
      status, decided_by: me.id, decided_at: new Date().toISOString() }).eq("id", r.id);
    await load();
  }

  return (
    <div className="body">
      <div style={{ paddingTop: 26 }}>
        <h1 className="h1">Your team</h1>
        <p className="screen-note">Set up the parts of your team and who is in them. Leave requests from your team also live here.</p>
      </div>

      {leaveQueue.length > 0 && (<>
        <div className="sec"><span>Leave to decide</span><span>{leaveQueue.length}</span></div>
        {leaveQueue.map((r) => (
          <div key={r.id} className="row">
            <div className="row-t">{r.profiles ? r.profiles.full_name : "—"} — {r.days} day{r.days === 1 ? "" : "s"} {r.kind}</div>
            <div className="row-m">{r.start_date} → {r.end_date}</div>
            {r.reason && <div className="row-note">&ldquo;{r.reason}&rdquo;</div>}
            {r.days > limit && <div className="row-note" style={{ color: "var(--amber)" }}>Over {limit} days — approval goes on to admin.</div>}
            <div style={{ display: "flex", gap: 7, marginTop: 10 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => decideLeave(r, "declined")}>Decline</button>
              <button className="btn btn-sm" onClick={() => decideLeave(r, "approved")}>{r.days > limit ? "Send to admin" : "Approve"}</button>
            </div>
          </div>))}
      </>)}

      <div className="split" style={{ marginTop: 20 }}>
        <div className="main-col">
          <div className="sec"><span>People</span><span>{people.length + pending.length}</span></div>
          {people.map((p) => (
            <div key={p.id} className="row">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                <div>
                  <div className="row-t">{p.profiles ? p.profiles.full_name : ""}</div>
                  <div className="row-m">{p.profiles ? (p.profiles.job_title || p.profiles.email) : ""}</div>
                </div>
                <select className="field" style={{ marginTop: 0, width: "auto", padding: "6px 9px", fontSize: 12.5 }}
                  value={p.role} onChange={(e) => setRole(p.id, e.target.value)}>
                  <option value="staff">Staff</option>
                  <option value="sub_team_lead">Team lead</option>
                  <option value="manager">Unit head</option>
                </select>
              </div>
              {subTeams.length > 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                  {subTeams.map((s) => {
                    const on = (members[p.profile_id] || []).includes(s.id);
                    return (
                      <button key={s.id} onClick={() => toggleMember(p.profile_id, s.id)}
                        style={{ fontSize: 11.5, padding: "4px 10px", borderRadius: 20,
                          border: "1px solid " + (on ? "var(--green)" : "var(--line)"),
                          background: on ? "var(--green-soft)" : "var(--card)",
                          color: on ? "var(--green)" : "var(--ink-faint)",
                          fontWeight: on ? 600 : 400 }}>{s.name}</button>);
                  })}
                </div>)}
            </div>))}

          {pending.map((p) => (
            <div key={p.email} className="row">
              <div className="row-t">{p.full_name || p.email}</div>
              <div className="row-m" style={{ color: "var(--amber)" }}>
                Invitation sent to {p.email} — waiting for them to sign in
              </div>
            </div>))}

          <button className="btn btn-ghost wide-auto" style={{ marginTop: 12 }}
            onClick={() => { setSheet("invite"); setMsg(null); }}>Add someone to the team</button>
        </div>

        <div className="side-col">
          <div className="sec"><span>Parts of the team</span><span>{subTeams.length}</span></div>
          {subTeams.map((s) => (
            <div key={s.id} className="row">
              <div className="row-t">{s.name}</div>
              <div className="row-m">
                {s.code} · {Object.values(members).filter((v) => v.includes(s.id)).length} people
                {s.profiles && s.profiles.full_name ? " · led by " + s.profiles.full_name : " · no lead yet"}
              </div>
            </div>))}
          {subTeams.length === 0 && (
            <div className="card small" style={{ lineHeight: 1.5 }}>
              Nothing set up yet. Add the parts your unit is divided into.
            </div>)}
          <button className="btn btn-ghost wide-auto" style={{ marginTop: 10 }}
            onClick={() => setSheet("subteam")}>Add a part of the team</button>
        </div>
      </div>

      {sheet === "subteam" && (
        <Sheet onClose={() => setSheet(null)}>
          <div className="h2">Add a part of the team</div>
          <p className="screen-note">Call it what your team already calls it. It can exist with nobody in it.</p>
          <input className="field" placeholder="What it is called" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="field" placeholder="Short code for job numbers, e.g. GFX" value={code}
            onChange={(e) => setCode(e.target.value)} maxLength={4} />
          {msg && <div className="flag flag-amber" style={{ marginTop: 12 }}>{msg}</div>}
          <button className="btn" style={{ marginTop: 14 }} onClick={addSubTeam} disabled={busy || !name.trim()}>
            {busy ? "Saving..." : "Add it"}</button>
        </Sheet>)}

      {sheet === "invite" && (
        <Sheet onClose={() => { setSheet(null); setMsg(null); }}>
          <div className="h2">Add someone to the team</div>
          <p className="screen-note">They get an email with a sign-in link, and appear here once they use it. Nobody shares a password.</p>
          <input className="field" placeholder="Their full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <input className="field" placeholder="Their work email" type="email" autoCapitalize="none"
            value={email} onChange={(e) => setEmail(e.target.value)} />
          {msg && <div className="flag flag-amber" style={{ marginTop: 12 }}>{msg}</div>}
          <button className="btn" style={{ marginTop: 14 }} onClick={invite}
            disabled={busy || !email.trim() || !fullName.trim()}>
            {busy ? "Sending..." : "Send the invitation"}</button>
          <div className="hint">After they sign in, put them in a part of the team and set their role.</div>
        </Sheet>)}
    </div>);
}
