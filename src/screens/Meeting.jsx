import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { statusPill } from "../components/bits";
import VoiceInput from "../components/VoiceInput";

function whenLabel(value) {
  return new Date(value).toLocaleString("en-GB", {
    timeZone: "Africa/Accra",
    weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

export default function Meeting({ me, meetingId, back, goAssign, openItem, openProject }) {
  const [meeting, setMeeting] = useState(null);
  const [records, setRecords] = useState([]);
  const [links, setLinks] = useState([]);
  const [note, setNote] = useState("");
  const [recordKind, setRecordKind] = useState("note");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { load(); }, [meetingId]);

  async function load() {
    setLoading(true); setError(null);
    try {
      const [meetingResult, recordResult, linkResult] = await Promise.all([
        supabase.from("meeting_sessions")
          .select("id,org_id,scope,unit_id,project_id,title,agenda,starts_at,ends_at,provider,provider_meeting_id,join_url,location,status,created_by,units(name),projects(name)")
          .eq("id", meetingId).single(),
        supabase.from("meeting_records")
          .select("id,kind,body,author_id,created_at,profiles!meeting_records_author_id_fkey(full_name)")
          .eq("meeting_id", meetingId).order("created_at", { ascending: true }),
        supabase.from("meeting_work_links")
          .select("meeting_id,work_item_id,relation,linked_at,work_items(id,ref,title,status,due_at,project_id)")
          .eq("meeting_id", meetingId).order("linked_at", { ascending: false }),
      ]);
      if (meetingResult.error) throw meetingResult.error;
      if (recordResult.error) throw recordResult.error;
      if (linkResult.error) throw linkResult.error;
      setMeeting(meetingResult.data);
      setRecords(recordResult.data || []);
      setLinks(linkResult.data || []);
    } catch (err) {
      setError(err.message || "Meeting could not be opened.");
    } finally {
      setLoading(false);
    }
  }

  const canManage = Boolean(me?.is_admin || me?.is_exec || me?.role === "manager");
  const decisions = useMemo(() => records.filter((row) => row.kind === "decision"), [records]);
  const notes = useMemo(() => records.filter((row) => row.kind === "note"), [records]);

  async function addRecord() {
    const clean = note.trim();
    if (!clean || !meeting) return;
    setBusy(true); setError(null);
    try {
      const result = await supabase.from("meeting_records").insert({
        meeting_id: meeting.id,
        org_id: me.org_id,
        kind: recordKind,
        body: clean,
        author_id: me.id,
      });
      if (result.error) throw result.error;
      setNote("");
      await load();
    } catch (err) {
      setError(err.message || "Meeting record could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  function createAction(kind = "task") {
    goAssign?.({
      meetingId: meeting.id,
      meetingTitle: meeting.title,
      meetingOn: String(meeting.starts_at).slice(0, 10),
      meetingNote: "From " + meeting.title,
      projectId: meeting.project_id || "",
      kind,
    });
  }

  if (loading) return <div className="body meeting-screen"><div className="spin">Opening meeting...</div></div>;

  if (!meeting) return <div className="body meeting-screen">
    <button className="back" onClick={back}>← Back</button>
    <div className="flag flag-brick"><h4>Meeting unavailable</h4>{error || "This meeting is not available to your account."}</div>
  </div>;

  const context = meeting.scope === "project"
    ? meeting.projects?.name || "Project meeting"
    : meeting.scope === "unit"
      ? meeting.units?.name || "Unit meeting"
      : "Organisation meeting";

  return <div className="body meeting-screen">
    <button className="back meeting-back" onClick={back}>← Back</button>

    <header className="meeting-hero">
      <div className="eyebrow">{context}</div>
      <h1>{meeting.title}</h1>
      <div className="meeting-time">{whenLabel(meeting.starts_at)}{meeting.ends_at ? ` → ${whenLabel(meeting.ends_at)}` : ""}</div>
      <div className="meeting-status-row">
        {statusPill(meeting.status)}
        <span>{meeting.provider === "zoom" ? "Zoom" : "External meeting"}</span>
      </div>
      {meeting.location && <div className="meeting-location">{meeting.location}</div>}
      {meeting.join_url && meeting.status !== "cancelled" && <a className="meeting-join" href={meeting.join_url} target="_blank" rel="noreferrer">
        Join {meeting.provider === "zoom" ? "Zoom" : "meeting"} <span aria-hidden="true">↗</span>
      </a>}
    </header>

    {error && <div className="flag flag-brick"><h4>Could not complete that</h4>{error}</div>}

    <section className="meeting-panel">
      <div className="meeting-section-head"><div><span>Before</span><h2>Agenda</h2></div></div>
      {meeting.agenda ? <p className="meeting-agenda">{meeting.agenda}</p> : <div className="quiet-empty compact"><strong>No agenda recorded</strong><span>The meeting can still proceed; this is simply not on the record yet.</span></div>}
    </section>

    <section className="meeting-panel">
      <div className="meeting-section-head">
        <div><span>During</span><h2>Notes & decisions</h2></div>
        <small>{notes.length} note{notes.length === 1 ? "" : "s"} · {decisions.length} decision{decisions.length === 1 ? "" : "s"}</small>
      </div>
      {records.length === 0 && <div className="quiet-empty compact"><strong>Nothing recorded yet</strong><span>Add factual notes as the meeting progresses. Managers may separately record decisions.</span></div>}
      {records.map((row) => <article className={`meeting-record meeting-record-${row.kind}`} key={row.id}>
        <div className="meeting-record-meta">
          <strong>{row.kind === "decision" ? "Decision" : "Note"}</strong>
          <span>{row.profiles?.full_name || "CEAC member"} · {new Date(row.created_at).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}</span>
        </div>
        <p>{row.body}</p>
      </article>)}

      <div className="meeting-record-form">
        {canManage && <div className="meeting-record-kind">
          <button className={recordKind === "note" ? "on" : ""} onClick={() => setRecordKind("note")}>Note</button>
          <button className={recordKind === "decision" ? "on" : ""} onClick={() => setRecordKind("decision")}>Decision</button>
        </div>}
        <div className="assistive-field textarea">
          <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder={recordKind === "decision" ? "Record the decision exactly as agreed" : "Add a factual meeting note"} />
          <VoiceInput compact label={recordKind === "decision" ? "Speak decision" : "Speak note"} onResult={(text) => setNote((current) => current ? current + " " + text : text)} />
        </div>
        <button className="btn" disabled={busy || !note.trim()} onClick={addRecord}>{busy ? "Saving..." : recordKind === "decision" ? "Record decision" : "Add note"}</button>
      </div>
    </section>

    <section className="meeting-panel">
      <div className="meeting-section-head">
        <div><span>After</span><h2>Actions & outcomes</h2></div>
        <small>{links.length} linked</small>
      </div>
      {links.map((link) => <button className="meeting-work-row" key={link.work_item_id} onClick={() => openItem?.(link.work_item_id)}>
        <span><strong>{link.work_items?.title || "Work item"}</strong><small>{link.work_items?.ref} · {link.relation.replaceAll("_"," ")}</small></span>
        {link.work_items && statusPill(link.work_items.status)}
      </button>)}
      {links.length === 0 && <div className="quiet-empty compact"><strong>No actions linked yet</strong><span>Turn agreed actions into real CEAC work instead of leaving them buried in notes.</span></div>}
      {canManage && <div className="meeting-action-buttons">
        <button className="btn" onClick={() => createAction("task")}>Create action</button>
        <button className="btn btn-ghost" onClick={() => createAction("meeting_outcome")}>Record meeting outcome</button>
      </div>}
    </section>

    {meeting.project_id && openProject && <button className="meeting-project-link" onClick={() => openProject(meeting.project_id)}>Open project →</button>}

    <div className="meeting-provider-note">
      <strong>Meeting provider boundary</strong>
      <span>CEAC stores the operational record. Video transport remains with {meeting.provider === "zoom" ? "Zoom" : "the external provider"}. Provider secrets are not exposed in this page.</span>
    </div>
  </div>;
}
