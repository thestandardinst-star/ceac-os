import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function localDate(value) {
  return new Date(`${String(value).slice(0, 10)}T00:00:00`);
}

function dateLabel(value) {
  return localDate(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function roleLabel(role) {
  if (role === "manager") return "Unit head";
  if (role === "sub_team_lead") return "Team lead";
  return "Staff";
}

function nextBirthday(value) {
  const [, month, day] = String(value).slice(0, 10).split("-").map(Number);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const date = new Date(today.getFullYear(), month - 1, day);
  if (date < today) date.setFullYear(date.getFullYear() + 1);
  return date;
}

export default function StaffTeam({ me }) {
  const [team, setTeam] = useState([]);
  const [onLeave, setOnLeave] = useState([]);
  const [birthdays, setBirthdays] = useState([]);
  const [subTeamLeads, setSubTeamLeads] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => { load(); }, [me.unit_id]);
  async function load() {
    if (!me.unit_id) return;
    setLoading(true); setError(null);
    try {
      const membershipResult = await supabase.from("unit_memberships")
        .select("role, created_at, profiles!unit_memberships_profile_id_fkey(id, full_name, email, job_title, birthday, joined_at, started_on)")
        .eq("unit_id", me.unit_id);
      if (membershipResult.error) throw new Error(`Directory: ${membershipResult.error.message}`);
      const members = membershipResult.data || [];
      const profileIds = members.map((row) => row.profiles?.id).filter(Boolean);
      const today = new Date();
      const todayKey = today.toISOString().slice(0, 10);
      const weekEnd = new Date(today); weekEnd.setDate(weekEnd.getDate() + 7);
      const [leaveResult, subTeamResult, resourceResult] = await Promise.all([
        profileIds.length ? supabase.from("leave_requests")
          .select("profile_id, start_date, end_date, kind, profiles!leave_requests_profile_id_fkey(full_name)")
          .in("profile_id", profileIds).eq("status", "approved")
          .lte("start_date", weekEnd.toISOString().slice(0, 10)).gte("end_date", todayKey)
          : Promise.resolve({ data: [], error: null }),
        supabase.from("sub_teams")
          .select("id, name, lead_id, profiles!sub_teams_lead_fk(id, full_name, job_title)")
          .eq("unit_id", me.unit_id).eq("active", true).order("position"),
        supabase.from("unit_resources")
          .select("id, title, category, reference_url, description, pinned")
          .eq("unit_id", me.unit_id).eq("active", true)
          .order("pinned", { ascending: false }).order("sort_order").order("title"),
      ]);
      if (leaveResult.error) throw new Error(`Approved leave: ${leaveResult.error.message}`);
      if (subTeamResult.error) throw new Error(`Team leads: ${subTeamResult.error.message}`);
      if (resourceResult.error) throw new Error(`Unit resources: ${resourceResult.error.message}`);
      setTeam(members);
      setOnLeave(leaveResult.data || []);
      setSubTeamLeads((subTeamResult.data || []).filter((row) => row.lead_id && row.profiles));
      setResources(resourceResult.data || []);
      const birthdayCutoff = new Date(today); birthdayCutoff.setDate(birthdayCutoff.getDate() + 30);
      setBirthdays(members.map((row) => row.profiles).filter((profile) => profile?.birthday)
        .map((profile) => ({ ...profile, nextBirthday: nextBirthday(profile.birthday) }))
        .filter((profile) => profile.nextBirthday <= birthdayCutoff)
        .sort((left, right) => left.nextBirthday - right.nextBirthday));
    } catch (err) {
      setError(err.message || "The unit directory could not be loaded.");
      setTeam([]); setOnLeave([]); setBirthdays([]); setSubTeamLeads([]); setResources([]);
    } finally { setLoading(false); }
  }
  const now = new Date();
  const newJoinerCutoff = new Date(now); newJoinerCutoff.setDate(newJoinerCutoff.getDate() - 90);
  const newJoiners = team.filter((row) => {
    const joined = row.profiles?.joined_at || row.profiles?.started_on;
    return joined && localDate(joined) >= newJoinerCutoff;
  });
  const unitHeads = team.filter((row) => row.role === "manager");
  return (
    <div className="body">
      <div style={{ paddingTop: 26 }}>
        <div className="eyebrow">{me.unit_name}</div>
        <h1 className="h1" style={{ marginTop: 6 }}>Team</h1>
        <p className="screen-note">People, availability and useful unit context. This screen does not measure anyone's work.</p>
      </div>
      {error && <div className="flag flag-brick" style={{ marginTop: 14 }}><h4>Team could not finish loading</h4>{error}<button className="btn btn-ghost btn-sm" style={{ marginTop: 10 }} onClick={load}>Try again</button></div>}
      {loading && <div className="spin">Loading your team...</div>}
      {!loading && !error && <>
      <div className="split" style={{ marginTop: 8 }}>
        <div className="main-col">
          <div className="sec"><span>Unit leadership</span><span>{unitHeads.length + subTeamLeads.length} roles</span></div>
          {unitHeads.map((row) => <div key={`head-${row.profiles?.id}`} className="row">
            <div className="row-t">{row.profiles?.full_name || "—"}</div>
            <div className="row-m">Unit head{row.profiles?.job_title ? ` · ${row.profiles.job_title}` : ""}</div>
          </div>)}
          {subTeamLeads.map((row) => <div key={`lead-${row.id}`} className="row">
            <div className="row-t">{row.profiles.full_name}</div>
            <div className="row-m">{row.name} team lead{row.profiles.job_title ? ` · ${row.profiles.job_title}` : ""}</div>
          </div>)}
          {unitHeads.length + subTeamLeads.length === 0 && <div className="card small">No unit or team lead is recorded here yet.</div>}

          <div className="sec"><span>Away this week</span><span>{onLeave.length}</span></div>
          {onLeave.length === 0 && <div className="card small">No approved leave is currently visible for this week.</div>}
          {onLeave.map((l, i) => (
            <div key={`${l.profile_id}-${l.start_date}-${i}`} className="row">
              <div className="row-t">{l.profiles ? l.profiles.full_name : "—"}</div>
              <div className="row-m">{dateLabel(l.start_date)} — {dateLabel(l.end_date)} · {l.kind} leave</div>
            </div>))}

          {newJoiners.length > 0 && <>
            <div className="sec"><span>Joined in the last 90 days</span><span>{newJoiners.length}</span></div>
            {newJoiners.map((row) => <div key={`new-${row.profiles.id}`} className="row">
              <div className="row-t">Welcome {row.profiles.full_name}</div>
              <div className="row-m">{row.profiles.job_title || roleLabel(row.role)} · joined {dateLabel(row.profiles.joined_at || row.profiles.started_on)}</div>
            </div>)}
          </>}
        </div>
        <div className="side-col">
          <div className="sec"><span>Directory</span><span>{team.length}</span></div>
          {team.map((p) => (
            <div key={p.profiles && p.profiles.id} className="row">
              <div className="row-t">{p.profiles ? p.profiles.full_name : "—"}</div>
              <div className="row-m">{roleLabel(p.role)}{p.profiles?.job_title ? ` · ${p.profiles.job_title}` : ""}</div>
              {p.profiles?.email && <div className="row-note">{p.profiles.email}</div>}
            </div>))}
          {team.length === 0 && <div className="card small">No active unit members are visible yet.</div>}
          <div className="sec"><span>Birthdays in the next 30 days</span><span>{birthdays.length}</span></div>
          {birthdays.length === 0 && <div className="card small">No recorded birthday falls in the next 30 days.</div>}
          {birthdays.map((birthday) => (
            <div key={birthday.id} className="row">
              <div className="row-t">{birthday.full_name}</div>
              <div className="row-m">{birthday.nextBirthday.toLocaleDateString("en-GB", { day: "numeric", month: "long" })}</div>
            </div>))}
          <div className="sec"><span>Unit resources</span><span>{resources.length}</span></div>
          {resources.length === 0 && <div className="card small">No shared unit resources have been added yet.</div>}
          {resources.map((resource) => <a key={resource.id} className="row" href={resource.reference_url} target="_blank" rel="noreferrer noopener">
            <div className="row-t">{resource.pinned ? "Pinned · " : ""}{resource.title}</div>
            <div className="row-m">{resource.category.replace("_", " ")}</div>
            {resource.description && <div className="row-note">{resource.description}</div>}
          </a>)}
        </div>
      </div>
      </>}
    </div>);
}
