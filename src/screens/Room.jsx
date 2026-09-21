import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

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

export default function Room({ me, context, back, openItem, openProject }) {
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const endRef = useRef(null);

  useEffect(() => { loadRoom(); }, [context?.kind, context?.unitId, context?.projectId]);
  useEffect(() => {
    if (!room?.id) return undefined;
    const channel = supabase.channel(`ceac-room-${room.id}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "room_messages", filter: `room_id=eq.${room.id}`,
      }, () => loadMessages(false))
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

  async function loadRoom() {
    setLoading(true); setError(null); setRoom(null); setMessages([]);
    try {
      let query = supabase.from("rooms")
        .select("id,kind,unit_id,project_id,created_at,units(name),projects(name,status)")
        .eq("org_id", me.org_id);
      if (context?.kind === "project") query = query.eq("kind", "project").eq("project_id", context.projectId);
      else query = query.eq("kind", "unit").eq("unit_id", context?.unitId || me.unit_id);

      const result = await query.maybeSingle();
      if (result.error) throw result.error;
      if (!result.data) throw new Error("This Room is not available to your account.");
      setRoom(result.data);
      await loadMessages(true, result.data.id);
    } catch (err) {
      setError(err.message || "This Room could not be opened.");
      setLoading(false);
    }
  }

  async function loadMessages(showLoading = false, explicitRoomId = null) {
    const roomId = explicitRoomId || room?.id;
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

  const title = room?.kind === "project" ? room.projects?.name : room?.units?.name;
  const roomLabel = room?.kind === "project" ? "Project Room" : "Unit Room";
  const parentById = useMemo(() => new Map(messages.map((message) => [message.id, message])), [messages]);
  const contextualRefs = context?.reference ? [context.reference] : [];

  async function send() {
    const clean = body.trim();
    if (!clean || !room?.id) return;
    setSending(true); setError(null);
    try {
      const result = await supabase.rpc("send_room_message", {
        p_room_id: room.id,
        p_body: clean,
        p_reply_to_id: replyTo?.id || null,
        p_refs: contextualRefs,
        p_mention_ids: [],
      });
      if (result.error) throw result.error;
      setBody(""); setReplyTo(null);
      await loadMessages(false);
    } catch (err) {
      setError(err.message || "Your message could not be sent.");
    } finally {
      setSending(false);
    }
  }

  function openRef(ref) {
    if (ref.object_type === "work_item") openItem?.(ref.object_id);
    if (ref.object_type === "project") openProject?.(ref.object_id);
  }

  let previousDay = null;

  return <div className="body room-screen">
    <header className="room-head">
      <button className="room-back" onClick={back}>←</button>
      <div className="room-head-copy">
        <span>{roomLabel}</span>
        <h1>{title || "Room"}</h1>
      </div>
      <span className="room-live-dot" title="Live updates" aria-label="Live updates" />
    </header>

    {error && <div className="flag flag-brick room-error"><h4>Room could not complete that</h4>{error}<button className="btn btn-ghost btn-sm" onClick={loadRoom}>Try again</button></div>}

    <div className="room-context-note">
      {room?.kind === "project"
        ? "Messages stay with this project so decisions and work context are not split across separate group chats."
        : "Operational communication for this unit. Protected HR and private records do not belong here."}
    </div>

    <main className="room-feed" aria-live="polite">
      {loading && <div className="spin">Opening Room...</div>}
      {!loading && !messages.length && !error && <div className="room-empty">
        <strong>No messages yet</strong>
        <span>Start with the work or decision that needs coordination.</span>
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
      {contextualRefs.length > 0 && <div className="room-composer-context">
        <span>Linked to</span><strong>{contextualRefs[0].label || contextualRefs[0].object_type.replaceAll("_", " ")}</strong>
      </div>}
      <div className="room-composer-row">
        <textarea
          rows={1}
          value={body}
          maxLength={8000}
          placeholder={room?.kind === "project" ? "Message the project team" : "Message your unit"}
          onChange={(event) => setBody(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
              event.preventDefault(); send();
            }
          }}
        />
        <button className="room-send" disabled={sending || !body.trim()} onClick={send}>{sending ? "…" : "Send"}</button>
      </div>
      <small>Work communication only · messages remain attributable</small>
    </footer>
  </div>;
}
