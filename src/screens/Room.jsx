import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import VoiceInput from "../components/VoiceInput";

function timeLabel(value) {
  return new Date(value).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function dayLabel(value) {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const key = date.toDateString();
  if (key === today.toDateString()) return "Today";
  if (key === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

function roomTitle(room) {
  if (!room) return "Room";
  if (room.kind === "project") return room.projects?.name || "Project";
  if (room.kind === "sub_team") return room.sub_teams?.name || "Sub-team";
  return room.units?.name || "Unit";
}

function roomLabel(room) {
  if (room?.kind === "project") return "Project Room";
  if (room?.kind === "sub_team") return "Sub-team Room";
  return "Unit Room";
}

function uniqueById(rows) {
  const byId = new Map();
  rows.filter(Boolean).forEach((row) => row.id && byId.set(row.id, row));
  return [...byId.values()].sort((a,b) => a.full_name.localeCompare(b.full_name));
}

export default function Room({
  me,
  context,
  back,
  openItem,
  openProject,
  scheduleMeeting,
  openAnnouncements,
}) {
  const [room, setRoom] = useState(null);
  const [scopeRooms, setScopeRooms] = useState([]);
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [mentions, setMentions] = useState([]);
  const [selectedRefs, setSelectedRefs] = useState(() => context?.reference ? [context.reference] : []);
  const [workOptions, setWorkOptions] = useState([]);
  const [projectOptions, setProjectOptions] = useState([]);
  const [panel, setPanel] = useState(null);
  const [mentionQuery, setMentionQuery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const endRef = useRef(null);

  const canCoordinate = Boolean(me.is_admin || me.is_exec || me.role === "manager");

  useEffect(() => { loadInitialRoom(); }, [context?.kind, context?.unitId, context?.subTeamId, context?.projectId]);

  useEffect(() => {
    if (!room?.id) return undefined;
    const channel = supabase.channel(`ceac-room-${room.id}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "room_messages", filter: `room_id=eq.${room.id}`,
      }, () => loadMessages(room.id, false))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [room?.id]);

  useEffect(() => {
    if (!room?.id) return;
    supabase.rpc("mark_room_read", { p_room_id: room.id });
  }, [room?.id, messages.length]);

  useEffect(() => {
    if (!loading) endRef.current?.scrollIntoView({ block: "end" });
  }, [loading, messages.length]);

  async function roomQueryForContext() {
    let query = supabase.from("rooms")
      .select("id,kind,unit_id,sub_team_id,project_id,created_at,units(name),sub_teams(name,unit_id),projects(name,status)")
      .eq("org_id", me.org_id);

    if (context?.kind === "project") return query.eq("kind", "project").eq("project_id", context.projectId).maybeSingle();
    if (context?.kind === "sub_team") return query.eq("kind", "sub_team").eq("sub_team_id", context.subTeamId).maybeSingle();
    return query.eq("kind", "unit").eq("unit_id", context?.unitId || me.unit_id).maybeSingle();
  }

  async function loadInitialRoom() {
    setLoading(true); setError(null); setRoom(null); setMessages([]);
    try {
      const result = await roomQueryForContext();
      if (result.error) throw result.error;
      if (!result.data) throw new Error("This Room is not available to your account.");
      await selectRoom(result.data, true);
    } catch (err) {
      setError(err.message || "This Room could not be opened.");
      setLoading(false);
    }
  }

  async function selectRoom(nextRoom, initial = false) {
    setRoom(nextRoom);
    setPanel(null);
    setReplyTo(null);
    setMentions([]);
    setMentionQuery(null);
    if (!initial) setSelectedRefs([]);
    await Promise.all([
      loadMessages(nextRoom.id, true),
      loadParticipants(nextRoom),
      loadScopeRooms(nextRoom),
      loadReferenceOptions(nextRoom),
    ]);
  }

  async function loadScopeRooms(currentRoom) {
    if (!currentRoom?.unit_id || currentRoom.kind === "project") {
      setScopeRooms([]);
      return;
    }
    const result = await supabase.from("rooms")
      .select("id,kind,unit_id,sub_team_id,project_id,created_at,units(name),sub_teams(name,unit_id),projects(name,status)")
      .eq("unit_id", currentRoom.unit_id)
      .in("kind", ["unit","sub_team"]);
    if (result.error) { setScopeRooms([]); return; }
    setScopeRooms((result.data || []).sort((a,b) => {
      if (a.kind === "unit") return -1;
      if (b.kind === "unit") return 1;
      return roomTitle(a).localeCompare(roomTitle(b));
    }));
  }

  async function loadParticipants(currentRoom) {
    try {
      if (currentRoom.kind === "sub_team") {
        const [membersResult, teamResult, managersResult] = await Promise.all([
          supabase.from("sub_team_members")
            .select("profile_id,profiles!sub_team_members_profile_id_fkey(id,full_name,active)")
            .eq("sub_team_id", currentRoom.sub_team_id),
          supabase.from("sub_teams").select("lead_id,profiles!sub_teams_lead_id_fkey(id,full_name,active)")
            .eq("id", currentRoom.sub_team_id).single(),
          supabase.from("unit_memberships")
            .select("profile_id,profiles!unit_memberships_profile_id_fkey(id,full_name,active)")
            .eq("unit_id", currentRoom.unit_id).eq("role", "manager"),
        ]);
        if (membersResult.error) throw membersResult.error;
        if (teamResult.error) throw teamResult.error;
        if (managersResult.error) throw managersResult.error;
        const rows = [
          ...(membersResult.data || []).map((row) => row.profiles),
          teamResult.data?.profiles,
          ...(managersResult.data || []).map((row) => row.profiles),
        ].filter((row) => row?.active && row.id !== me.id);
        setParticipants(uniqueById(rows));
        return;
      }

      let unitIds = [];
      if (currentRoom.kind === "unit") unitIds = [currentRoom.unit_id];
      if (currentRoom.kind === "project") {
        const projectResult = await supabase.from("projects")
          .select("lead_unit_id,project_units(unit_id)").eq("id", currentRoom.project_id).single();
        if (projectResult.error) throw projectResult.error;
        unitIds = [...new Set([
          projectResult.data.lead_unit_id,
          ...(projectResult.data.project_units || []).map((row) => row.unit_id),
        ].filter(Boolean))];
      }
      if (!unitIds.length) { setParticipants([]); return; }

      const memberResult = await supabase.from("unit_memberships")
        .select("profile_id,profiles!unit_memberships_profile_id_fkey(id,full_name,active)")
        .in("unit_id", unitIds);
      if (memberResult.error) throw memberResult.error;
      setParticipants(uniqueById((memberResult.data || [])
        .map((row) => row.profiles)
        .filter((row) => row?.active && row.id !== me.id)));
    } catch {
      setParticipants([]);
    }
  }

  async function loadReferenceOptions(currentRoom) {
    try {
      let workQuery = supabase.from("work_items")
        .select("id,ref,title,status,unit_id,sub_team_id,project_id")
        .neq("status","completed").order("created_at", { ascending:false }).limit(40);
      if (currentRoom.kind === "project") workQuery = workQuery.eq("project_id", currentRoom.project_id);
      else if (currentRoom.kind === "sub_team") workQuery = workQuery.eq("sub_team_id", currentRoom.sub_team_id);
      else workQuery = workQuery.eq("unit_id", currentRoom.unit_id);

      let projectQuery = supabase.from("projects")
        .select("id,name,status,lead_unit_id,project_units(unit_id)")
        .in("status",["planned","active"]).order("name");

      const [workResult, projectResult] = await Promise.all([workQuery, projectQuery]);
      if (workResult.error) throw workResult.error;
      if (projectResult.error) throw projectResult.error;
      setWorkOptions(workResult.data || []);

      if (currentRoom.kind === "project") setProjectOptions([]);
      else setProjectOptions((projectResult.data || []).filter((project) =>
        project.lead_unit_id === currentRoom.unit_id
        || (project.project_units || []).some((unit) => unit.unit_id === currentRoom.unit_id)
      ));
    } catch {
      setWorkOptions([]);
      setProjectOptions([]);
    }
  }

  async function loadMessages(roomId, showLoading = false) {
    if (!roomId) return;
    if (showLoading) setLoading(true);
    try {
      const result = await supabase.from("room_messages")
        .select("id,room_id,author_id,body,reply_to_id,created_at,profiles!room_messages_author_id_fkey(full_name),room_message_refs(id,object_type,object_id,label)")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true })
        .limit(250);
      if (result.error) throw result.error;
      setMessages(result.data || []);
    } catch (err) {
      setError(err.message || "Room messages could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  const parentById = useMemo(() => new Map(messages.map((message) => [message.id, message])), [messages]);

  const mentionMatches = useMemo(() => {
    const query = String(mentionQuery || "").toLowerCase();
    if (!query) return participants.slice(0,6);
    return participants.filter((person) => person.full_name.toLowerCase().includes(query)).slice(0,6);
  }, [mentionQuery, participants]);

  function updateBody(value) {
    setBody(value);
    const match = value.match(/(?:^|\s)@([^\n@]*)$/);
    setMentionQuery(match ? match[1].trim() : null);
  }

  function chooseMention(person) {
    setBody((current) => {
      const match = current.match(/(?:^|\s)@([^\n@]*)$/);
      if (!match) return current + (current ? " " : "") + "@" + person.full_name + " ";
      const start = match.index + (match[0].startsWith(" ") ? 1 : 0);
      return current.slice(0,start) + "@" + person.full_name + " ";
    });
    setMentions((current) => current.includes(person.id) ? current : [...current, person.id]);
    setMentionQuery(null);
  }

  function typedMentionIds() {
    const lower = body.toLowerCase();
    const ids = [];
    for (const person of participants) {
      const full = "@" + person.full_name.toLowerCase();
      const first = "@" + person.full_name.split(" ")[0].toLowerCase();
      if (lower.includes(full) || lower.includes(first)) ids.push(person.id);
    }
    return ids;
  }

  async function send() {
    const clean = body.trim();
    if (!clean || !room?.id) return;
    setSending(true); setError(null);
    try {
      const mentionIds = [...new Set([...mentions, ...typedMentionIds()])];
      const result = await supabase.rpc("send_room_message", {
        p_room_id: room.id,
        p_body: clean,
        p_reply_to_id: replyTo?.id || null,
        p_refs: selectedRefs,
        p_mention_ids: mentionIds,
      });
      if (result.error) throw result.error;
      setBody(""); setReplyTo(null); setMentions([]); setMentionQuery(null); setSelectedRefs([]);
      await loadMessages(room.id, false);
    } catch (err) {
      setError(err.message || "Your message could not be sent.");
    } finally {
      setSending(false);
    }
  }

  function appendVoice(text) {
    setBody((current) => current.trim() ? current.trim() + " " + text : text);
  }

  function addRef(ref) {
    setSelectedRefs((current) => current.some((row) => row.object_type === ref.object_type && row.object_id === ref.object_id)
      ? current
      : [...current, ref]);
    setPanel(null);
  }

  function openRef(ref) {
    if (ref.object_type === "work_item") openItem?.(ref.object_id);
    if (ref.object_type === "project") openProject?.(ref.object_id);
  }

  function meetingContext() {
    if (room.kind === "project") {
      return {
        scope:"project",
        projectId:room.project_id,
        title:"",
      };
    }
    return {
      scope:"unit",
      unitId:room.unit_id,
      unitName:room.units?.name,
      subTeamId:room.kind === "sub_team" ? room.sub_team_id : null,
      subTeamName:room.kind === "sub_team" ? room.sub_teams?.name : null,
      title:"",
    };
  }

  let previousDay = null;

  return <div className="body room-screen">
    <header className="room-head">
      <button className="room-back" onClick={back}>←</button>
      <div className="room-head-copy">
        <span>{roomLabel(room)}</span>
        <h1>{roomTitle(room)}</h1>
      </div>
      <span className="room-live-dot" title="Live updates" aria-label="Live updates" />
    </header>

    {error && <div className="flag flag-brick room-error"><h4>Room could not complete that</h4>{error}<button className="btn btn-ghost btn-sm" onClick={loadInitialRoom}>Try again</button></div>}

    {scopeRooms.length > 1 && <nav className="room-scope-strip" aria-label="Unit conversations">
      {scopeRooms.map((entry) => <button key={entry.id} className={entry.id === room?.id ? "on" : ""} onClick={() => selectRoom(entry)}>
        {entry.kind === "unit" ? "Everyone" : roomTitle(entry)}
      </button>)}
    </nav>}

    <div className="room-context-note">
      {room?.kind === "project"
        ? "Project coordination stays attached to the work and its record."
        : room?.kind === "sub_team"
          ? `This conversation is for ${roomTitle(room)}. The Unit Manager can coordinate here; it is not a private DM.`
          : "Operational communication for this unit. Use a sub-team conversation when the message is only for that lane."}
    </div>

    <main className="room-feed" aria-live="polite">
      {loading && <div className="spin">Opening Room...</div>}
      {!loading && !messages.length && !error && <div className="room-empty">
        <strong>No messages yet</strong>
        <span>Start with the work, decision or coordination that belongs in this context.</span>
      </div>}
      {!loading && messages.map((message) => {
        const currentDay = new Date(message.created_at).toDateString();
        const showDay = currentDay !== previousDay;
        previousDay = currentDay;
        const mine = message.author_id === me.id;
        const parent = message.reply_to_id ? parentById.get(message.reply_to_id) : null;
        return <div key={message.id}>
          {showDay && <div className="room-day"><span>{dayLabel(message.created_at)}</span></div>}
          <article className={`room-message ${mine ? "mine" : ""}`}>
            <div className="room-message-meta">
              <strong>{mine ? "You" : message.profiles?.full_name || "CEAC member"}</strong>
              <time>{timeLabel(message.created_at)}</time>
            </div>
            {parent && <div className="room-reply-context">
              <strong>{parent.author_id === me.id ? "You" : parent.profiles?.full_name || "Earlier message"}</strong>
              <span>{parent.body}</span>
            </div>}
            <p>{message.body}</p>
            {(message.room_message_refs || []).length > 0 && <div className="room-ref-list">
              {message.room_message_refs.map((ref) => <button key={ref.id} onClick={() => openRef(ref)}>
                <span>{ref.object_type.replaceAll("_", " ")}</span>
                <strong>{ref.label || "Open record"}</strong>
              </button>)}
            </div>}
            <button className="room-reply-action" onClick={() => setReplyTo(message)}>Reply</button>
          </article>
        </div>;
      })}
      <div ref={endRef} />
    </main>

    <footer className="room-composer">
      {replyTo && <div className="room-composer-reply">
        <span>Replying to {replyTo.author_id === me.id ? "your message" : replyTo.profiles?.full_name || "message"}</span>
        <button onClick={() => setReplyTo(null)}>×</button>
      </div>}

      {selectedRefs.length > 0 && <div className="room-composer-context-list">
        {selectedRefs.map((ref) => <button key={ref.object_type + ref.object_id} onClick={() => setSelectedRefs((current) => current.filter((row) => !(row.object_type === ref.object_type && row.object_id === ref.object_id)))}>
          <span>{ref.object_type.replaceAll("_"," ")}</span><strong>{ref.label || "Linked record"}</strong><b>×</b>
        </button>)}
      </div>}

      {mentionQuery !== null && mentionMatches.length > 0 && <div className="room-inline-mentions">
        <div className="room-inline-label">Mention someone in this Room</div>
        {mentionMatches.map((person) => <button key={person.id} onClick={() => chooseMention(person)}>
          <span className="room-person-avatar">{person.full_name.charAt(0)}</span>
          <strong>{person.full_name}</strong>
        </button>)}
      </div>}

      {panel === "actions" && <div className="room-plus-panel">
        {scopeRooms.length > 1 && <button onClick={() => setPanel("scope")}><span>◎</span><div><strong>Choose conversation</strong><small>Everyone or a sub-team</small></div></button>}
        {workOptions.length > 0 && <button onClick={() => setPanel("work")}><span>✓</span><div><strong>Link work</strong><small>Keep the task in the conversation</small></div></button>}
        {projectOptions.length > 0 && <button onClick={() => setPanel("project")}><span>▱</span><div><strong>Link project</strong><small>Add project context</small></div></button>}
        {canCoordinate && <button onClick={() => { setPanel(null); scheduleMeeting?.(meetingContext()); }}><span>◷</span><div><strong>Schedule meeting</strong><small>Invite the right CEAC audience</small></div></button>}
        {(me.is_admin || me.is_exec) && openAnnouncements && <button onClick={() => { setPanel(null); openAnnouncements(); }}><span>◉</span><div><strong>Make announcement</strong><small>Publish through the announcement system</small></div></button>}
      </div>}

      {panel === "scope" && <div className="room-picker-panel">
        <div className="room-picker-head"><strong>Choose conversation</strong><button onClick={() => setPanel("actions")}>Back</button></div>
        {scopeRooms.map((entry) => <button key={entry.id} className={entry.id === room?.id ? "on" : ""} onClick={() => selectRoom(entry)}>
          <span>{entry.kind === "unit" ? "Everyone in " + roomTitle(entry) : roomTitle(entry)}</span><b>{entry.id === room?.id ? "✓" : "→"}</b>
        </button>)}
      </div>}

      {panel === "work" && <div className="room-picker-panel">
        <div className="room-picker-head"><strong>Link work</strong><button onClick={() => setPanel("actions")}>Back</button></div>
        {workOptions.slice(0,12).map((item) => <button key={item.id} onClick={() => addRef({object_type:"work_item",object_id:item.id,label:`${item.ref} · ${item.title}`})}>
          <span><small>{item.ref}</small>{item.title}</span><b>+</b>
        </button>)}
      </div>}

      {panel === "project" && <div className="room-picker-panel">
        <div className="room-picker-head"><strong>Link project</strong><button onClick={() => setPanel("actions")}>Back</button></div>
        {projectOptions.slice(0,12).map((project) => <button key={project.id} onClick={() => addRef({object_type:"project",object_id:project.id,label:project.name})}>
          <span>{project.name}</span><b>+</b>
        </button>)}
      </div>}

      <div className="room-composer-row room-composer-v2">
        <button className={"room-plus " + (panel ? "on" : "")} aria-label="Add context or action" onClick={() => setPanel((current) => current ? null : "actions")}>+</button>
        <div className="room-text-wrap">
          <textarea
            rows={1}
            value={body}
            maxLength={8000}
            placeholder={room?.kind === "project" ? "Message the project team" : room?.kind === "sub_team" ? `Message ${roomTitle(room)}` : "Message your unit"}
            onChange={(event) => updateBody(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                event.preventDefault(); send();
              }
            }}
          />
          <VoiceInput compact label="Speak message" onResult={appendVoice} />
        </div>
        <button className="room-send" disabled={sending || !body.trim()} onClick={send}>{sending ? "…" : "Send"}</button>
      </div>
      <small>Work communication only · @ mentions notify people inside this Room</small>
    </footer>
  </div>;
}
