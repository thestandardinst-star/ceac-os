import { useEffect, useMemo, useState } from "react";
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

function Section({ title, meta, open, onToggle, children, tone = "" }) {
  return <section className={`team-section ${tone}`}>
    <button className="team-section-toggle" onClick={onToggle} aria-expanded={open}>
      <span>
        <strong>{title}</strong>
        {meta && <small>{meta}</small>}
      </span>
      <b aria-hidden="true">{open ? "−" : "+"}</b>
    </button>
    {open && <div className="team-section-body">{children}</div>}
  </section>;
}

export default function StaffTeam({ me, openRoom }) {
  const [team, setTeam] = useState([]);
  const [onLeave, setOnLeave] = useState([]);
  const [birthdays, setBirthdays] = useState([]);
  const [subTeamLeads, setSubTeamLeads] = useState([]);
  const [resources, setResources] = useState([]);
  const [open, setOpen] = useState({ away: true, new: true, leadership: false, people: false, birthdays: true, resources: false });
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
      if (membershipResult.error) throw new Error(`People: ${membershipResult.error.message}`);
      const members = membershipResult.data || [];
      const today = new Date();
      const todayKey = today.toISOString().slice(0, 10);
      const weekEnd = new Date(today); weekEnd.setDate(weekEnd.getDate() + 7);

      const [leaveResult, subTeamResult, resourceResult] = await Promise.all([
        supabase.rpc("list_unit_approved_leave", {
          p_unit_id: me.unit_id, p_from: todayKey, p_to: weekEnd.toISOString().slice(0, 10),
        }),
        supabase.from("sub_teams")
          .select("id, name, lead_id, profiles!sub_teams_lead_fk(id, full_name, job_title)")
          .eq("unit_id", me.unit_id).eq("active", true).order("position"),
        supabase.from("unit_resources")
          .select("id, title, category, reference_url, description, pinned")
          .eq("unit_id", me.unit_id).eq("active", true)
          .order("pinned", { ascending: false }).order("sort_order").order("title"),
      ]);
      if (leaveResult.error) throw new Error(`Approved leave: ${leaveResult.error.message}`);
      if (subTeamResult.error) throw new Error(`Leadership: ${subTeamResult.error.message}`);
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
      setError(err.message || "Your unit context could not be loaded.");
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

  const leadership = useMemo(() => {
    const map = new Map();
    unitHeads.forEach((row) => {
      if (!row.profiles?.id) return;
      map.set(row.profiles.id, {
        id: row.profiles.id,
        name: row.profiles.full_name,
        jobTitle: row.profiles.job_title,
        unitHead: true,
        lanes: [],
      });
    });
    subTeamLeads.forEach((row) => {
      const existing = map.get(row.profiles.id) || {
        id: row.profiles.id,
        name: row.profiles.full_name,
        jobTitle: row.profiles.job_title,
        unitHead: false,
        lanes: [],
      };
      existing.lanes.push(row.name);
      map.set(row.profiles.id, existing);
    });
    return [...map.values()];
  }, [team, subTeamLeads]);

  function toggle(key) {
    setOpen((current) => ({ ...current, [key]: !current[key] }));
  }

  return <div className="body staff-team">
    <div className="staff-page-intro">
      <div className="eyebrow">{me.unit_name}</div>
      <h1 className="h1">Team</h1>
      <p className="screen-note">People, leadership, availability and the shared references your unit uses.</p>
      <div className="team-summary">
        <strong>{team.length}</strong><span>people</span>
        {unitHeads[0]?.profiles && <><i /> <span>{unitHeads[0].profiles.full_name}, Unit Head</span></>}
      </div>
      {openRoom && <button className="team-room-entry" onClick={openRoom}>
        <span><strong>Unit Room</strong><small>Coordinate with {me.unit_name}</small></span>
        <b aria-hidden="true">→</b>
      </button>}
    </div>

    {error && <div className="flag flag-brick" style={{ marginTop: 14 }}>
      <h4>Team could not finish loading</h4>{error}
      <button className="btn btn-ghost btn-sm" style={{ marginTop: 10 }} onClick={load}>Try again</button>
    </div>}
    {loading && <div className="spin">Loading your team...</div>}

    {!loading && !error && <div className="team-stack">
      {onLeave.length > 0 && <Section
        title="Away this week"
        meta={`${onLeave.length} ${onLeave.length === 1 ? "person" : "people"}`}
        open={open.away}
        onToggle={() => toggle("away")}
        tone="team-section-attention"
      >
        {onLeave.map((leave, index) => <div key={`${leave.profile_id}-${leave.start_date}-${index}`} className="team-compact-row">
          <div><strong>{leave.full_name || "—"}</strong><span>{leave.kind} leave</span></div>
          <time>{dateLabel(leave.start_date)} — {dateLabel(leave.end_date)}</time>
        </div>)}
      </Section>}

      {newJoiners.length > 0 && <Section
        title="New to the unit"
        meta={`${newJoiners.length} joined recently`}
        open={open.new}
        onToggle={() => toggle("new")}
      >
        {newJoiners.map((row) => <div key={`new-${row.profiles.id}`} className="team-compact-row">
          <div><strong>{row.profiles.full_name}</strong><span>{row.profiles.job_title || roleLabel(row.role)}</span></div>
          <time>Joined {dateLabel(row.profiles.joined_at || row.profiles.started_on)}</time>
        </div>)}
      </Section>}

      {leadership.length > 0 && <Section
        title="Leadership"
        meta={leadership.length === 1 ? leadership[0].name : `${leadership.length} people`}
        open={open.leadership}
        onToggle={() => toggle("leadership")}
      >
        {leadership.map((person) => <div key={person.id} className="team-person-row">
          <div>
            <strong>{person.name}</strong>
            <span>{person.unitHead ? "Unit Head" : "Team lead"}{person.jobTitle ? ` · ${person.jobTitle}` : ""}</span>
          </div>
          {person.lanes.length > 0 && <p>{person.lanes.length === 1 ? `Leads ${person.lanes[0]}` : `Leads ${person.lanes.length} work lanes: ${person.lanes.join(", ")}`}</p>}
        </div>)}
      </Section>}

      <Section
        title="People"
        meta={`${team.length} in ${me.unit_name}`}
        open={open.people}
        onToggle={() => toggle("people")}
      >
        {team.map((row) => <div key={row.profiles?.id} className="team-person-row">
          <div>
            <strong>{row.profiles?.full_name || "—"}</strong>
            <span>{row.profiles?.job_title || roleLabel(row.role)}</span>
          </div>
        </div>)}
      </Section>

      {birthdays.length > 0 && <Section
        title="Birthdays"
        meta={`${birthdays.length} in the next 30 days`}
        open={open.birthdays}
        onToggle={() => toggle("birthdays")}
      >
        {birthdays.map((birthday) => <div key={birthday.id} className="team-compact-row">
          <div><strong>{birthday.full_name}</strong><span>Birthday</span></div>
          <time>{birthday.nextBirthday.toLocaleDateString("en-GB", { day: "numeric", month: "long" })}</time>
        </div>)}
      </Section>}

      {resources.length > 0 && <Section
        title="Unit resources"
        meta={`${resources.length} shared ${resources.length === 1 ? "reference" : "references"}`}
        open={open.resources}
        onToggle={() => toggle("resources")}
      >
        {resources.map((resource) => <a key={resource.id} className="team-resource-row" href={resource.reference_url} target="_blank" rel="noreferrer noopener">
          <div>
            <strong>{resource.pinned ? "Pinned · " : ""}{resource.title}</strong>
            <span>{resource.category.replace("_", " ")}</span>
          </div>
          <b aria-hidden="true">↗</b>
          {resource.description && <p>{resource.description}</p>}
        </a>)}
      </Section>}
    </div>}
  </div>;
}
