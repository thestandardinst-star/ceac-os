import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { LoadingState, ProductNotice } from "../components/bits";
import {
  PeopleEmpty,
  PeopleFactRow,
  PeoplePageHeader,
  PeoplePersonRow,
  PeopleResourceRow,
  PeopleRoomCard,
  PeopleSection,
} from "../experience-v2/people-family/PeopleFamilyV2";

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

export default function StaffTeam({ me, openRoom }) {
  const [team, setTeam] = useState([]);
  const [onLeave, setOnLeave] = useState([]);
  const [birthdays, setBirthdays] = useState([]);
  const [subTeamLeads, setSubTeamLeads] = useState([]);
  const [resources, setResources] = useState([]);
  const [open, setOpen] = useState({ away: true, new: true, leadership: true, people: true, birthdays: false, resources: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { load(); }, [me.unit_id]);

  async function load() {
    if (!me.unit_id) {
      setTeam([]);
      setOnLeave([]);
      setBirthdays([]);
      setSubTeamLeads([]);
      setResources([]);
      setError(null);
      setLoading(false);
      return;
    }
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

  return <div className="body staff-team ev2-people-page ev2-people-staff">
    <PeoplePageHeader
      eyebrow={me.unit_name}
      title="Team"
      description="People, leadership, availability and the shared references your unit uses."
      count={team.length}
      countLabel={team.length === 1 ? "person" : "people"}
    />

    {openRoom && <PeopleRoomCard
      title="Unit Room"
      description={`Messages, mentions and coordination for ${me.unit_name}`}
      onClick={openRoom}
    />}

    {error && <ProductNotice tone="error" title="Team could not finish loading">
      {error}
      <button className="btn btn-ghost btn-sm" style={{ marginTop: 10 }} onClick={load}>Try again</button>
    </ProductNotice>}
    {loading && <LoadingState label="Loading your team…" />}

    {!loading && !error && !me.unit_id && <PeopleEmpty
      title="No unit context"
      description="Your Team surface will appear when your authorised unit membership is available."
    />}

    {!loading && !error && me.unit_id && <>
      {(onLeave.length > 0 || newJoiners.length > 0) && <div className="ev2p-attention-grid">
        {onLeave.length > 0 && <PeopleSection
          title="Away this week"
          meta={`${onLeave.length} ${onLeave.length === 1 ? "person" : "people"}`}
          open={open.away}
          onToggle={() => toggle("away")}
          tone="attention"
        >
          {onLeave.map((leave, index) => <PeopleFactRow
            key={`${leave.profile_id}-${leave.start_date}-${index}`}
            icon="calendar"
            title={leave.full_name || "—"}
            subtitle={`${leave.kind} leave`}
            meta={`${dateLabel(leave.start_date)} — ${dateLabel(leave.end_date)}`}
            tone="warning"
          />)}
        </PeopleSection>}

        {newJoiners.length > 0 && <PeopleSection
          title="New to the unit"
          meta={`${newJoiners.length} joined recently`}
          open={open.new}
          onToggle={() => toggle("new")}
        >
          {newJoiners.map((row) => <PeopleFactRow
            key={`new-${row.profiles.id}`}
            icon="people"
            title={row.profiles.full_name}
            subtitle={row.profiles.job_title || roleLabel(row.role)}
            meta={`Joined ${dateLabel(row.profiles.joined_at || row.profiles.started_on)}`}
          />)}
        </PeopleSection>}
      </div>}

      <div className="ev2p-stack">
        {leadership.length > 0 && <PeopleSection
          title="Leadership"
          meta={leadership.length === 1 ? leadership[0].name : `${leadership.length} people`}
          open={open.leadership}
          onToggle={() => toggle("leadership")}
        >
          {leadership.map((person) => <PeoplePersonRow
            key={person.id}
            name={person.name}
            subtitle={`${person.unitHead ? "Unit Head" : "Team lead"}${person.jobTitle ? ` · ${person.jobTitle}` : ""}`}
            context={person.lanes.length > 0
              ? person.lanes.length === 1
                ? `Leads ${person.lanes[0]}`
                : `Leads ${person.lanes.length} work lanes: ${person.lanes.join(", ")}`
              : null}
          />)}
        </PeopleSection>}

        <div id="team-people" className="team-scroll-anchor" />
        <PeopleSection
          title="People"
          meta={`${team.length} in ${me.unit_name}`}
          open={open.people}
          onToggle={() => toggle("people")}
        >
          {team.length > 0 ? team.map((row) => <PeoplePersonRow
            key={row.profiles?.id}
            name={row.profiles?.full_name || "—"}
            subtitle={row.profiles?.job_title || roleLabel(row.role)}
          />) : <PeopleEmpty
            title="No people are listed in this unit"
            description="People will appear here when they are part of your current unit."
          />}
        </PeopleSection>

        {birthdays.length > 0 && <PeopleSection
          title="Birthdays"
          meta={`${birthdays.length} in the next 30 days`}
          open={open.birthdays}
          onToggle={() => toggle("birthdays")}
        >
          {birthdays.map((birthday) => <PeopleFactRow
            key={birthday.id}
            icon="calendar"
            title={birthday.full_name}
            subtitle="Birthday"
            meta={birthday.nextBirthday.toLocaleDateString("en-GB", { day: "numeric", month: "long" })}
          />)}
        </PeopleSection>}

        <div id="team-resources" className="team-scroll-anchor" />
        {resources.length > 0 && <PeopleSection
          title="Unit resources"
          meta={`${resources.length} shared ${resources.length === 1 ? "reference" : "references"}`}
          open={open.resources}
          onToggle={() => toggle("resources")}
        >
          {resources.map((resource) => <PeopleResourceRow
            key={resource.id}
            title={resource.title}
            category={resource.category.replace("_", " ")}
            description={resource.description}
            href={resource.reference_url}
            pinned={resource.pinned}
          />)}
        </PeopleSection>}
      </div>
    </>}
  </div>;
}
