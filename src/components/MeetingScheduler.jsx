import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import VoiceInput from "./VoiceInput";

function audienceKey(row) {
  return row.type + ":" + (row.id || "");
}

function addUnique(list, entry) {
  const key = audienceKey(entry);
  return list.some((item) => audienceKey(item) === key) ? list : [...list, entry];
}

function removeEntry(list, entry) {
  const key = audienceKey(entry);
  return list.filter((item) => audienceKey(item) !== key);
}

export default function MeetingScheduler({
  me,
  context = {},
  onClose,
  onCreated,
}) {
  const managedUnitIds = useMemo(
    () => (me.memberships || []).filter((row) => row.role === "manager").map((row) => row.unit_id),
    [me.memberships],
  );
  const privileged = Boolean(me.is_admin || me.is_exec);
  const initialScope = context.scope || (context.projectId ? "project" : privileged && context.organisation ? "organisation" : "unit");

  const [scope, setScope] = useState(initialScope);
  const [unitId, setUnitId] = useState(context.unitId || me.unit_id || "");
  const [projectId, setProjectId] = useState(context.projectId || "");
  const [title, setTitle] = useState(context.title || "");
  const [agenda, setAgenda] = useState(context.agenda || "");
  const [startsAt, setStartsAt] = useState(context.startsAt || "");
  const [endsAt, setEndsAt] = useState(context.endsAt || "");
  const [joinUrl, setJoinUrl] = useState(context.joinUrl || "");
  const [location, setLocation] = useState("");
  const [provider, setProvider] = useState("zoom");
  const [units, setUnits] = useState([]);
  const [projects, setProjects] = useState([]);
  const [subTeams, setSubTeams] = useState([]);
  const [people, setPeople] = useState([]);
  const [projectManagers, setProjectManagers] = useState([]);
  const [audience, setAudience] = useState(() => {
    if (context.subTeamId) return [{ type: "sub_team", id: context.subTeamId, label: context.subTeamName || "Sub-team" }];
    if (context.projectId) return [{ type: "project_managers", id: context.projectId, label: "Project unit managers" }];
    if (context.unitId) return [{ type: "unit", id: context.unitId, label: context.unitName || me.unit_name || "Unit" }];
    return [];
  });
  const [busy, setBusy] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { loadBase(); }, []);
  useEffect(() => { loadUnitOptions(); }, [unitId]);
  useEffect(() => { loadProjectPeople(); }, [projectId]);

  async function loadBase() {
    setLoadingOptions(true);
    try {
      const [unitResult, projectResult] = await Promise.all([
        supabase.from("units").select("id,name,active").eq("active", true).order("name"),
        supabase.from("projects")
          .select("id,name,status,lead_unit_id,project_units(unit_id)")
          .in("status", ["planned","active"]).order("name"),
      ]);
      if (unitResult.error) throw unitResult.error;
      if (projectResult.error) throw projectResult.error;

      const visibleUnits = privileged
        ? unitResult.data || []
        : (unitResult.data || []).filter((row) => managedUnitIds.includes(row.id));
      setUnits(visibleUnits);

      const manageableProjects = privileged
        ? projectResult.data || []
        : (projectResult.data || []).filter((row) =>
            managedUnitIds.includes(row.lead_unit_id)
            || (row.project_units || []).some((unit) => managedUnitIds.includes(unit.unit_id))
          );
      setProjects(manageableProjects);
    } catch (err) {
      setError(err.message || "Meeting options could not be loaded.");
    } finally {
      setLoadingOptions(false);
    }
  }

  async function loadUnitOptions() {
    if (!unitId) { setSubTeams([]); setPeople([]); return; }
    try {
      const [teamResult, peopleResult] = await Promise.all([
        supabase.from("sub_teams")
          .select("id,name,unit_id,active").eq("unit_id", unitId).eq("active", true).order("position"),
        supabase.from("unit_memberships")
          .select("profile_id,role,profiles!unit_memberships_profile_id_fkey(id,full_name,active)")
          .eq("unit_id", unitId),
      ]);
      if (teamResult.error) throw teamResult.error;
      if (peopleResult.error) throw peopleResult.error;
      setSubTeams(teamResult.data || []);
      setPeople((peopleResult.data || [])
        .filter((row) => row.profiles?.active)
        .map((row) => ({ id: row.profile_id, name: row.profiles.full_name, role: row.role }))
        .sort((a,b) => a.name.localeCompare(b.name)));
    } catch (err) {
      setError(err.message || "Audience options could not be loaded.");
    }
  }

  async function loadProjectPeople() {
    if (!projectId) { setProjectManagers([]); return; }
    try {
      const project = projects.find((row) => row.id === projectId)
        || (await supabase.from("projects").select("id,lead_unit_id,project_units(unit_id)").eq("id", projectId).single()).data;
      if (!project) return;
      const unitIds = [...new Set([
        project.lead_unit_id,
        ...(project.project_units || []).map((row) => row.unit_id),
      ].filter(Boolean))];
      if (!unitIds.length) return;
      const result = await supabase.from("unit_memberships")
        .select("profile_id,unit_id,role,profiles!unit_memberships_profile_id_fkey(id,full_name,active),units(name)")
        .in("unit_id", unitIds).eq("role", "manager");
      if (result.error) throw result.error;
      setProjectManagers((result.data || [])
        .filter((row) => row.profiles?.active)
        .map((row) => ({ id: row.profile_id, name: row.profiles.full_name, unit: row.units?.name || "Unit" }))
        .sort((a,b) => a.name.localeCompare(b.name)));
    } catch (err) {
      setError(err.message || "Project collaborators could not be loaded.");
    }
  }

  function toggle(entry) {
    const on = audience.some((item) => audienceKey(item) === audienceKey(entry));
    setAudience((current) => on ? removeEntry(current, entry) : addUnique(current, entry));
  }

  function isOn(entry) {
    return audience.some((item) => audienceKey(item) === audienceKey(entry));
  }

  async function schedule() {
    if (!title.trim() || !startsAt || !audience.length) return;
    setBusy(true); setError("");
    try {
      const result = await supabase.rpc("schedule_meeting", {
        p_scope: scope,
        p_unit_id: scope === "unit" ? unitId || null : null,
        p_project_id: scope === "project" ? projectId || null : null,
        p_title: title.trim(),
        p_agenda: agenda.trim() || null,
        p_starts_at: new Date(startsAt).toISOString(),
        p_ends_at: endsAt ? new Date(endsAt).toISOString() : null,
        p_provider: provider,
        p_join_url: joinUrl.trim() || null,
        p_location: location.trim() || null,
        p_audience: audience.map(({ type, id }) => ({ type, id: id || null })),
      });
      if (result.error) throw result.error;
      onCreated?.(result.data);
    } catch (err) {
      setError(err.message || "The meeting could not be scheduled.");
    } finally {
      setBusy(false);
    }
  }

  const canSubmit = title.trim() && startsAt && audience.length
    && (scope !== "unit" || unitId)
    && (scope !== "project" || projectId);

  return <div className="meeting-scheduler" role="dialog" aria-modal="true" aria-label="Schedule meeting">
    <button className="meeting-scheduler-bg" aria-label="Close meeting scheduler" onClick={onClose} />
    <section className="meeting-scheduler-sheet">
      <header className="meeting-scheduler-head">
        <div><span>CEAC meeting</span><h2>Schedule meeting</h2></div>
        <button className="sheet-close" onClick={onClose}>×</button>
      </header>

      {error && <div className="flag flag-brick"><h4>Could not schedule meeting</h4>{error}</div>}

      <div className="meeting-scheduler-grid">
        <div className="meeting-scheduler-main">
          <label className="assistive-field-label">
            <span>Meeting title</span>
            <div className="assistive-field">
              <input className="field" value={title} placeholder="What is this meeting for?" onChange={(e) => setTitle(e.target.value)} />
              <VoiceInput compact label="Speak meeting title" onResult={(text) => setTitle((current) => current ? current + " " + text : text)} />
            </div>
          </label>

          <div className="meeting-context-switch">
            {privileged && <button className={scope === "organisation" ? "on" : ""} onClick={() => { setScope("organisation"); setAudience([]); }}>Organisation</button>}
            <button className={scope === "unit" ? "on" : ""} onClick={() => { setScope("unit"); setAudience([]); }}>Unit</button>
            <button className={scope === "project" ? "on" : ""} onClick={() => { setScope("project"); setAudience([]); }}>Project</button>
          </div>

          {scope === "unit" && <select className="field" value={unitId} onChange={(e) => { setUnitId(e.target.value); setAudience([]); }}>
            <option value="">Choose unit</option>
            {units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
          </select>}

          {scope === "project" && <select className="field" value={projectId} onChange={(e) => { setProjectId(e.target.value); setAudience([]); }}>
            <option value="">Choose project</option>
            {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </select>}

          <div className="meeting-time-grid">
            <label className="small">Starts<input className="field" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} /></label>
            <label className="small">Ends (optional)<input className="field" type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} /></label>
          </div>

          <label className="assistive-field-label">
            <span>Agenda (optional)</span>
            <div className="assistive-field textarea">
              <textarea className="field" rows={4} value={agenda} placeholder="What should this meeting cover?" onChange={(e) => setAgenda(e.target.value)} />
              <VoiceInput compact label="Speak agenda" onResult={(text) => setAgenda((current) => current ? current + " " + text : text)} />
            </div>
          </label>

          <div className="meeting-provider-grid">
            <select className="field" value={provider} onChange={(e) => setProvider(e.target.value)}>
              <option value="zoom">Zoom</option>
              <option value="external">Other meeting link</option>
            </select>
            <input className="field" type="url" value={joinUrl} placeholder="Join link (optional)" onChange={(e) => setJoinUrl(e.target.value)} />
          </div>
          <input className="field" value={location} placeholder="Physical location (optional)" onChange={(e) => setLocation(e.target.value)} />
        </div>

        <aside className="meeting-audience">
          <div className="meeting-audience-head"><span>Invite</span><strong>{audience.length} audience selection{audience.length === 1 ? "" : "s"}</strong></div>

          {loadingOptions && <div className="spin">Loading audience…</div>}

          {!loadingOptions && scope === "organisation" && <button className={"meeting-audience-option " + (isOn({type:"organisation",id:null}) ? "on" : "")}
            onClick={() => toggle({ type:"organisation", id:null, label:"Everyone in CEAC" })}>
            <span><strong>Everyone in CEAC</strong><small>Organisation-wide meeting</small></span><b>{isOn({type:"organisation",id:null}) ? "✓" : "+"}</b>
          </button>}

          {!loadingOptions && scope === "unit" && unitId && <>
            <button className={"meeting-audience-option " + (isOn({type:"unit",id:unitId}) ? "on" : "")}
              onClick={() => toggle({ type:"unit", id:unitId, label:"Everyone in unit" })}>
              <span><strong>Everyone in this unit</strong><small>All active unit members</small></span><b>{isOn({type:"unit",id:unitId}) ? "✓" : "+"}</b>
            </button>
            {subTeams.map((team) => <button key={team.id} className={"meeting-audience-option " + (isOn({type:"sub_team",id:team.id}) ? "on" : "")}
              onClick={() => toggle({ type:"sub_team", id:team.id, label:team.name })}>
              <span><strong>{team.name}</strong><small>Sub-team only</small></span><b>{isOn({type:"sub_team",id:team.id}) ? "✓" : "+"}</b>
            </button>)}
            <div className="meeting-audience-subhead">Specific people</div>
            {people.map((person) => <button key={person.id} className={"meeting-audience-option person " + (isOn({type:"selected",id:person.id}) ? "on" : "")}
              onClick={() => toggle({ type:"selected", id:person.id, label:person.name })}>
              <span><strong>{person.name}</strong><small>{person.role === "manager" ? "Manager" : "Staff"}</small></span><b>{isOn({type:"selected",id:person.id}) ? "✓" : "+"}</b>
            </button>)}
          </>}

          {!loadingOptions && scope === "project" && projectId && <>
            <button className={"meeting-audience-option " + (isOn({type:"project",id:projectId}) ? "on" : "")}
              onClick={() => toggle({ type:"project", id:projectId, label:"All project collaborators" })}>
              <span><strong>All project collaborators</strong><small>Members of participating units</small></span><b>{isOn({type:"project",id:projectId}) ? "✓" : "+"}</b>
            </button>
            <button className={"meeting-audience-option " + (isOn({type:"project_managers",id:projectId}) ? "on" : "")}
              onClick={() => toggle({ type:"project_managers", id:projectId, label:"Project unit managers" })}>
              <span><strong>Unit managers only</strong><small>Managers of collaborating units</small></span><b>{isOn({type:"project_managers",id:projectId}) ? "✓" : "+"}</b>
            </button>
            {projectManagers.length > 0 && <div className="meeting-audience-subhead">Specific collaborating managers</div>}
            {projectManagers.map((person) => <button key={person.id} className={"meeting-audience-option person " + (isOn({type:"selected",id:person.id}) ? "on" : "")}
              onClick={() => toggle({ type:"selected", id:person.id, label:person.name })}>
              <span><strong>{person.name}</strong><small>{person.unit}</small></span><b>{isOn({type:"selected",id:person.id}) ? "✓" : "+"}</b>
            </button>)}
          </>}

          {audience.length > 0 && <div className="meeting-audience-selected">
            {audience.map((entry) => <button key={audienceKey(entry)} onClick={() => toggle(entry)}>{entry.label || entry.type} ×</button>)}
          </div>}
        </aside>
      </div>

      <footer className="meeting-scheduler-actions">
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn" disabled={busy || !canSubmit} onClick={schedule}>{busy ? "Scheduling…" : "Schedule and notify"}</button>
      </footer>
      <p className="meeting-scheduler-note">Participants will see this meeting inside CEAC OS automatically. External email/calendar delivery is not implied.</p>
    </section>
  </div>;
}
