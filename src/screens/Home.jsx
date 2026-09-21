import { useEffect, useState } from "react";
import AssistiveTextarea from "../components/AssistiveTextarea";
import { supabase } from "../lib/supabase";
import { startWork, endWork, reconcileWorkSession } from "../lib/session";
import { since, dueLabel, isOverdue } from "../lib/time";
import { Icon, Sheet, statusPill, ProductNotice, LoadingState } from "../components/bits";
import { humanError } from "../lib/productLanguage";

function startOfDay(date = new Date()) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function startOfWeek(date = new Date()) {
  const value = startOfDay(date);
  value.setDate(value.getDate() - ((value.getDay() + 6) % 7));
  return value;
}

function requireResult(result, label) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data || [];
}

function accraDateKey(value) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Accra", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date(value));
  const pick = (type) => parts.find((part) => part.type === type)?.value;
  return `${pick("year")}-${pick("month")}-${pick("day")}`;
}

function nextBirthday(value) {
  const [, month, day] = String(value).slice(0, 10).split("-").map(Number);
  const today = startOfDay();
  const date = new Date(today.getFullYear(), month - 1, day);
  if (date < today) date.setFullYear(date.getFullYear() + 1);
  return date;
}

function WorkRow({ item, openItem, tone = "neutral" }) {
  return <button className={`row home-work-row home-tone-${tone}`} onClick={() => openItem(item.id)}>
    <div className="row-t">{item.title}</div>
    <div className="row-m">{item.ref} · {dueLabel(item.due_at)}</div>
    <div style={{ marginTop: 7 }}>{statusPill(item.status)}</div>
  </button>;
}

export default function Home({ me, session, setSession, openItem, openMeeting, openRoom, openWork, openMe, openAnnouncements }) {
  const [items, setItems] = useState([]);
  const [completedThisWeek, setCompletedThisWeek] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const [roomMentions, setRoomMentions] = useState([]);
  const [birthdays, setBirthdays] = useState([]);
  const [upcomingLeave, setUpcomingLeave] = useState([]);
  const [leaveUpdates, setLeaveUpdates] = useState([]);
  const [reviewSubmissions, setReviewSubmissions] = useState([]);
  const [reviewFollowups, setReviewFollowups] = useState([]);
  const [myBlockers, setMyBlockers] = useState([]);
  const [blockerFollowups, setBlockerFollowups] = useState([]);
  const [ask, setAsk] = useState(false);
  const [place, setPlace] = useState("office");
  const [sessionWorkItem, setSessionWorkItem] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [drill, setDrill] = useState(null);
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [recoveryEndedAt, setRecoveryEndedAt] = useState("");
  const [recoveryNote, setRecoveryNote] = useState("");
  const [eventDetail, setEventDetail] = useState(null);
  const [, tick] = useState(0);

  useEffect(() => { const timer = setInterval(() => tick((value) => value + 1), 30000); return () => clearInterval(timer); }, []);
  useEffect(() => { load(); }, [me.id, me.unit_id]);

  async function load() {
    setLoading(true);
    setError(null);
    setLoadFailed(false);
    try {
      const rangeStart = startOfDay();
      const rangeEnd = new Date(rangeStart); rangeEnd.setDate(rangeEnd.getDate() + 14);
      const recentStart = new Date(rangeStart); recentStart.setDate(recentStart.getDate() - 14);
      const requests = [
        supabase.from("work_items")
          .select("id, ref, title, status, due_at, visibility, completed_at")
          .eq("assignee_id", me.id).not("status", "in", "(completed,self_certified,cancelled)")
          .order("due_at", { ascending: true, nullsFirst: false }),
        supabase.from("work_items")
          .select("id, ref, title, status, due_at, completed_at")
          .eq("assignee_id", me.id).in("kind", ["task", "deliverable"])
          .in("status", ["completed", "self_certified"])
          .gte("completed_at", startOfWeek().toISOString())
          .order("completed_at", { ascending: false }),
        supabase.from("alerts")
          .select("id, kind, subject_id, message, first_seen_at,resolved_at")
          .eq("for_profile_id", me.id).is("acknowledged_at", null).is("resolved_at", null),
        supabase.from("feedback_notes")
          .select("id,note,created_at,profiles!feedback_notes_author_id_fkey(full_name)")
          .eq("profile_id", me.id).order("created_at", { ascending: false }).limit(3),
        supabase.from("announcements")
          .select("id,title,priority,requires_acknowledgement,published_at,profiles!announcements_author_id_fkey(full_name),announcement_receipts(profile_id,read_at,acknowledged_at)")
          .eq("status", "published").order("published_at", { ascending: false }).limit(2),
        supabase.from("ministry_events")
          .select("id,title,kind,scope,unit_id,starts_at,ends_at,all_day,location,notes,cancelled,ministry_event_units(unit_id,note)")
          .lte("starts_at", rangeEnd.toISOString()).order("starts_at"),
        supabase.from("meeting_sessions")
          .select("id,title,scope,unit_id,project_id,starts_at,ends_at,provider,join_url,status,projects(name),units(name)")
          .gte("starts_at", rangeStart.toISOString()).lte("starts_at", rangeEnd.toISOString())
          .neq("status","cancelled").order("starts_at"),
        supabase.from("unit_memberships")
          .select("profile_id,profiles!unit_memberships_profile_id_fkey(id,full_name,birthday)")
          .eq("unit_id", me.unit_id),
        supabase.from("leave_requests")
          .select("id,kind,start_date,end_date,status,decided_at,decision_note")
          .eq("profile_id", me.id).order("requested_at", { ascending: false }),
        supabase.from("submissions")
          .select("id,work_item_id,submitted_at")
          .eq("profile_id", me.id).order("submitted_at", { ascending: false }),
        supabase.from("work_followups")
          .select("id,work_item_id,sequence,created_at")
          .eq("actor_id", me.id).order("created_at", { ascending: false }),
        supabase.from("blockers")
          .select("id,work_item_id,party_text,party_unit_id,state,responded_at,created_at,units:party_unit_id(name),work_items(id,ref,title,status)")
          .eq("claimed_by", me.id).in("state", ["claimed","acknowledged"]),
        supabase.from("blocker_followups")
          .select("id,blocker_id,sequence,created_at")
          .eq("actor_id", me.id).order("created_at", { ascending: false }),
        supabase.from("room_mentions")
          .select("id,message_id,created_at")
          .eq("profile_id", me.id).gte("created_at", recentStart.toISOString())
          .order("created_at", { ascending: false }).limit(5),
      ];

      const [itemResult, completedResult, alertResult, feedbackResult, announcementResult, eventResult, meetingResult, memberResult, leaveResult, submissionResult, reviewFollowupResult, blockerResult, blockerFollowupResult, mentionResult] = await Promise.all(requests);
      setItems(requireResult(itemResult, "Your work"));
      setCompletedThisWeek(requireResult(completedResult, "Completed work"));
      setAlerts(requireResult(alertResult, "Alerts"));
      setFeedback(requireResult(feedbackResult, "Feedback"));
      setAnnouncements(requireResult(announcementResult, "Announcements"));
      setReviewSubmissions(requireResult(submissionResult, "Submitted work"));
      setReviewFollowups(requireResult(reviewFollowupResult, "Review follow-ups"));
      setMyBlockers(requireResult(blockerResult, "Dependencies"));
      setBlockerFollowups(requireResult(blockerFollowupResult, "Dependency follow-ups"));
      const mentionRows = requireResult(mentionResult, "Room mentions");
      if (mentionRows.length) {
        const messageResult = await supabase.from("room_messages")
          .select("id,room_id,body,created_at,author_id,profiles!room_messages_author_id_fkey(full_name),rooms(id,kind,unit_id,sub_team_id,project_id,units(name),sub_teams(name),projects(name))")
          .in("id", mentionRows.map((row) => row.message_id));
        const messageRows = requireResult(messageResult, "Room mention messages");
        const byId = new Map(messageRows.map((row) => [row.id,row]));
        setRoomMentions(mentionRows.map((row) => byId.get(row.message_id)).filter(Boolean));
      } else setRoomMentions([]);

      const events = requireResult(eventResult, "Coming events").filter((event) => {
        const stillCurrent = new Date(event.ends_at || event.starts_at) >= rangeStart;
        const relevant = event.scope === "church" || event.unit_id === me.unit_id
          || (event.ministry_event_units || []).some((unit) => unit.unit_id === me.unit_id);
        return stillCurrent && relevant;
      });
      setCalendarEvents(events.slice(0, 4));
      setUpcomingMeetings(requireResult(meetingResult, "Meetings").slice(0, 4));
      const birthdayEnd = new Date(rangeStart); birthdayEnd.setDate(birthdayEnd.getDate() + 7);
      setBirthdays(requireResult(memberResult, "Birthdays")
        .map((member) => member.profiles).filter((profile) => profile?.birthday)
        .map((profile) => ({ ...profile, nextBirthday: nextBirthday(profile.birthday) }))
        .filter((profile) => profile.nextBirthday <= birthdayEnd)
        .sort((left, right) => left.nextBirthday - right.nextBirthday));
      const leaveRows = requireResult(leaveResult, "Leave");
      setUpcomingLeave(leaveRows.filter((request) => request.status === "approved"
        && new Date(`${request.start_date}T00:00:00`) >= rangeStart
        && new Date(`${request.start_date}T00:00:00`) <= rangeEnd).slice(0, 2));
      setLeaveUpdates(leaveRows.filter((request) => request.decided_at
        && new Date(request.decided_at) >= recentStart).slice(0, 2));
    } catch (err) {
      setLoadFailed(true);
      setError(humanError(err, "Home could not be loaded."));
    } finally {
      setLoading(false);
    }
  }

  const today = startOfDay();
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const soon = new Date(today); soon.setDate(soon.getDate() + 7);
  const weekStart = startOfWeek();
  const nextWeek = new Date(weekStart); nextWeek.setDate(nextWeek.getDate() + 7);
  const returned = items.filter((item) => item.status === "returned");
  const returnedIds = new Set(returned.map((item) => item.id));
  const visibleAlerts = alerts.filter((alert) =>
    alert.kind !== "overdue_first"
    && (!alert.subject_id || !returnedIds.has(alert.subject_id))
  );
  const dueToday = items.filter((item) => item.due_at
    && new Date(item.due_at) >= today && new Date(item.due_at) < tomorrow
    && !["waiting_on","returned","in_review"].includes(item.status));
  const overdue = items.filter((item) => isOverdue(item.due_at)
    && !["waiting_on","returned","in_review"].includes(item.status));
  const waitingDependencies = items.filter((item) => item.status === "waiting_on");
  const waitingReviews = items.filter((item) => item.status === "in_review");
  const dueSoon = items.filter((item) => item.due_at
    && new Date(item.due_at) >= tomorrow && new Date(item.due_at) < soon
    && !["waiting_on","returned","in_review"].includes(item.status));
  const dueThisWeek = items.filter((item) => item.due_at
    && new Date(item.due_at) >= weekStart && new Date(item.due_at) < nextWeek
    && !["waiting_on","in_review"].includes(item.status));
  const activeWork = items.filter((item) => item.status === "in_progress"
    && !dueToday.some((due) => due.id === item.id)
    && !overdue.some((due) => due.id === item.id)).slice(0, 3);
  const announcementAttention = announcements.filter((announcement) => announcement.requires_acknowledgement
    && !(announcement.announcement_receipts || []).some((receipt) => receipt.profile_id === me.id && receipt.acknowledged_at));

  const actionMap = new Map();
  [...returned, ...overdue, ...dueToday].forEach((item) => actionMap.set(item.id, item));
  const nextMoveItems = [...actionMap.values()];
  const attention = nextMoveItems.length + visibleAlerts.length + announcementAttention.length;
  const staleSession = Boolean(session
    && accraDateKey(session.last_confirmed_at || session.started_at) < accraDateKey(new Date()));

  function reviewFollowupState(item) {
    const submission = reviewSubmissions.find((row) => row.work_item_id === item.id);
    const count = reviewFollowups.filter((row) => row.work_item_id === item.id).length;
    if (!submission) return { count, canFollowUp: false, label: "Waiting for review" };
    if (count >= 2) return { count, canFollowUp: false, label: "2 follow-ups sent" };
    const delayDays = count === 0 ? 1 : 3;
    const availableAt = new Date(new Date(submission.submitted_at).getTime() + delayDays * 86400000);
    return {
      count,
      canFollowUp: new Date() >= availableAt,
      availableAt,
      label: new Date() >= availableAt
        ? (count === 0 ? "Follow up" : "Send final follow-up")
        : `Follow-up available ${availableAt.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`,
    };
  }

  function blockerFor(item) {
    return myBlockers.find((blocker) => blocker.work_item_id === item.id);
  }

  function blockerFollowupState(blocker) {
    if (!blocker) return { canFollowUp: false, label: "Waiting on another unit" };
    const count = blockerFollowups.filter((row) => row.blocker_id === blocker.id).length;
    if (count >= 2) return { count, canFollowUp: false, label: "2 follow-ups sent" };
    const anchor = new Date(blocker.responded_at || blocker.created_at);
    const delayDays = count === 0 ? 1 : 3;
    const availableAt = new Date(anchor.getTime() + delayDays * 86400000);
    return {
      count,
      canFollowUp: new Date() >= availableAt,
      availableAt,
      label: new Date() >= availableAt
        ? (count === 0 ? "Follow up" : "Send final follow-up")
        : `Follow-up available ${availableAt.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`,
    };
  }

  async function followUpReview(itemId) {
    setBusy(true); setError(null);
    try {
      const { error: followError } = await supabase.rpc("follow_up_work_review", { p_work_item_id: itemId });
      if (followError) throw followError;
      await load();
    } catch (err) { setError(humanError(err, "The follow-up could not be sent.")); }
    finally { setBusy(false); }
  }

  async function followUpDependency(blockerId) {
    setBusy(true); setError(null);
    try {
      const { error: followError } = await supabase.rpc("follow_up_blocker", { p_blocker_id: blockerId });
      if (followError) throw followError;
      await load();
    } catch (err) { setError(humanError(err, "The follow-up could not be sent.")); }
    finally { setBusy(false); }
  }

  async function begin() {
    setBusy(true); setError(null);
    try {
      if (place === "elsewhere" && !sessionWorkItem) throw new Error("Choose the work you are doing off-site before you start.");
      const current = await startWork(me.org_id, me.id, place, place === "elsewhere" ? sessionWorkItem : null);
      setSession(current); setAsk(false); setSessionWorkItem("");
    }
    catch (err) { setError(humanError(err, "Work could not be started.")); }
    finally { setBusy(false); }
  }
  async function stop() {
    if (!session) return;
    setBusy(true); setError(null);
    try { await endWork(session.id); setSession(null); }
    catch (err) { setError(humanError(err, "Work could not be ended.")); }
    finally { setBusy(false); }
  }
  async function continueRecoveredSession() {
    if (!session) return;
    setBusy(true); setError(null);
    try {
      const current = await reconcileWorkSession(session.id, "continue");
      setSession(current);
    } catch (err) { setError(humanError(err, "The work session could not be confirmed.")); }
    finally { setBusy(false); }
  }
  async function closeRecoveredSession() {
    if (!session || !recoveryEndedAt) return;
    setBusy(true); setError(null);
    try {
      await reconcileWorkSession(session.id, "close", new Date(recoveryEndedAt).toISOString(), recoveryNote.trim() || null);
      setSession(null); setRecoveryOpen(false); setRecoveryEndedAt(""); setRecoveryNote("");
    } catch (err) { setError(humanError(err, "The work session could not be reconciled.")); }
    finally { setBusy(false); }
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const drillRows = drill?.rows || [];
  const primaryNextItem = nextMoveItems[0] || activeWork[0] || dueSoon[0] || null;
  const nextMeeting = upcomingMeetings[0] || null;
  const todayLabel = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  return <div className="body staff-home">
    <section className="staff-command-surface">
    <header className="staff-home-intro">
      <div className="staff-home-context">
        <span>{me.unit_name}</span>
        <time>{todayLabel}</time>
      </div>
      <h1 className="h1">{greeting}, {me.full_name.split(" ")[0]}</h1>
      <p className="screen-note">Your work, updates and next steps in one place.</p>
    </header>

    <section className={`staff-work-status ${session ? "live" : ""} ${staleSession ? "needs-review" : ""}`} aria-label="Work session">
      <div className="staff-work-status-icon"><Icon name="work" size={20} /></div>
      <div className="staff-work-status-copy">
        <span>{session
          ? "Working since " + new Date(session.started_at).toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit" })
          : "Work session"}</span>
        <strong>{session ? staleSession ? "Needs reconciliation" : since(session.started_at) : "Not working"}</strong>
        {session && !staleSession && <small>{session.place === "office" ? "At the office" : "Working off-site"}</small>}
        {!session && <small>Start when you begin CEAC work.</small>}
      </div>
      {session
        ? staleSession
          ? <button className="btn btn-ghost btn-sm staff-status-action" onClick={() => setRecoveryOpen(true)} disabled={busy}>Review</button>
          : <button className="btn btn-ghost btn-sm staff-status-action" onClick={stop} disabled={busy}>End work</button>
        : <button className="btn btn-sm staff-status-action" onClick={() => setAsk(true)} disabled={busy}>Start work</button>}
    </section>

    <nav className="staff-quick-actions" aria-label="Quick actions">
      {nextMeeting && <button className="staff-quick-action primary" onClick={() => openMeeting?.(nextMeeting.id)}>
        <span className="staff-quick-icon"><Icon name="calendar" size={17} /></span>
        <span><strong>Next meeting</strong><small>{nextMeeting.title}</small></span>
      </button>}
      {!nextMeeting && primaryNextItem && <button className="staff-quick-action primary" onClick={() => openItem(primaryNextItem.id)}>
        <span className="staff-quick-icon"><Icon name="work" size={17} /></span>
        <span><strong>Open next</strong><small>{primaryNextItem.title}</small></span>
      </button>}
      <button className="staff-quick-action" onClick={openWork}>
        <span className="staff-quick-icon"><Icon name="record" size={17} /></span>
        <span><strong>My work</strong><small>See all work</small></span>
      </button>
      <button className="staff-quick-action" onClick={openMe}>
        <span className="staff-quick-icon"><Icon name="me" size={17} /></span>
        <span><strong>My space</strong><small>Goals, leave, personal</small></span>
      </button>
    </nav>
    </section>

    {staleSession && <div className="flag flag-amber" style={{ marginTop: 14 }}>
      <h4>You still have a work session open from an earlier day</h4>
      CEAC OS has paused the running duration until you confirm what happened. It will not record continuous overnight work by itself.
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
        <button className="btn btn-sm" onClick={continueRecoveredSession} disabled={busy}>{busy ? "Saving..." : "Continue this session"}</button>
        <button className="btn btn-ghost btn-sm" onClick={() => setRecoveryOpen(true)} disabled={busy}>Close at the actual time</button>
      </div>
    </div>}

    {error && <ProductNotice tone="error" title={loadFailed ? "Home could not finish loading" : "Could not complete that"} action={loadFailed ? <button className="btn btn-ghost btn-sm" onClick={load}>Try again</button> : null}>{error}</ProductNotice>}
    {loading && <LoadingState label="Loading Home…" />}

    {!loading && !loadFailed && <div className="home-dashboard staff-home-dashboard">
      {(feedback.length > 0 || completedThisWeek.length > 0 || leaveUpdates.length > 0 || roomMentions.length > 0) && <section className="home-panel home-panel-movement" aria-labelledby="staff-changed-heading">
        <div className="home-section-head"><div><div className="home-kicker">Since you last checked</div><h2 id="staff-changed-heading">Updates</h2></div></div>
        {roomMentions.slice(0, 3).map((message) => {
          const room = message.rooms;
          const roomName = room?.kind === "project" ? room.projects?.name : room?.kind === "sub_team" ? room.sub_teams?.name : room?.units?.name;
          return <button key={`mention-${message.id}`} className="row home-work-row home-room-mention" onClick={() => openRoom?.({
            kind: room?.kind,
            unitId: room?.unit_id,
            subTeamId: room?.sub_team_id,
            projectId: room?.project_id,
          })}>
            <div className="row-t">{message.profiles?.full_name || "A teammate"} mentioned you</div>
            <div className="row-m">{roomName || "Room"} · {new Date(message.created_at).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}</div>
            <div className="row-note">{message.body}</div>
          </button>;
        })}
        {feedback.slice(0, 2).map((note) => <div key={note.id} className="row home-feedback-row">
          <div className="row-t">{note.profiles?.full_name || "Manager"} left feedback</div>
          <div className="row-m">{new Date(note.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</div>
          <div className="row-note">{note.note}</div>
        </div>)}
        {completedThisWeek.slice(0, 3).map((item) => <WorkRow key={`moved-${item.id}`} item={item} openItem={openItem} tone="success" />)}
        {leaveUpdates.slice(0, 2).map((request) => <div key={`leave-update-${request.id}`} className="row">
          <div className="row-t">Your leave request was {request.status}</div>
          <div className="row-m">{request.kind} leave · {request.start_date} to {request.end_date}</div>
          {request.decision_note && <div className="row-note">{request.decision_note}</div>}
        </div>)}
      </section>}

      <section className={`home-panel ${attention > 0 ? "home-panel-priority" : "home-panel-pulse home-panel-empty"}`} aria-labelledby="staff-next-heading">
        <div className="home-section-head">
          <div><div className="home-kicker">Actionable now</div><h2 id="staff-next-heading">Your next move</h2></div>
          {attention > 0 && <span className="home-count home-count-attention">{attention}</span>}
        </div>
        {nextMoveItems.map((item) => <WorkRow key={item.id} item={item} openItem={openItem} tone={item.status === "returned" || isOverdue(item.due_at) ? "danger" : "info"} />)}
        {visibleAlerts.map((alert) => alert.subject_id
          ? <button key={alert.id} className="row home-work-row home-tone-attention" onClick={() => openItem(alert.subject_id)}>
              <div className="row-t">{alert.message}</div>
              <div className="row-m">Since {new Date(alert.first_seen_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</div>
            </button>
          : <div key={alert.id} className="row home-tone-attention">
              <div className="row-t">{alert.message}</div>
              <div className="row-m">Since {new Date(alert.first_seen_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</div>
            </div>)}
        {announcementAttention.map((announcement) => <button key={`ack-${announcement.id}`} className="row home-work-row home-tone-attention" onClick={openAnnouncements}>
          <div className="row-t">Acknowledge: {announcement.title}</div>
          <div className="row-m">Organisation announcement</div>
        </button>)}
        {attention === 0 && activeWork.length === 0 && <div className="home-quiet home-quiet-success">Nothing urgent is waiting on you right now.</div>}
        {activeWork.length > 0 && <>
          <div className="home-subhead home-subhead-spaced">Continue</div>
          {activeWork.map((item) => <WorkRow key={`active-${item.id}`} item={item} openItem={openItem} />)}
        </>}
      </section>

      {(waitingReviews.length > 0 || waitingDependencies.length > 0) && <section className="home-panel home-panel-waiting" aria-labelledby="staff-waiting-heading">
        <div className="home-section-head">
          <div><div className="home-kicker">Already moved from your side</div><h2 id="staff-waiting-heading">Waiting on others</h2></div>
          <span className="home-count">{waitingReviews.length + waitingDependencies.length}</span>
        </div>

        {waitingReviews.length > 0 && <div className="home-subhead">Waiting for manager review</div>}
        {waitingReviews.map((item) => {
          const follow = reviewFollowupState(item);
          const submission = reviewSubmissions.find((row) => row.work_item_id === item.id);
          return <div className="row home-work-row" key={`review-${item.id}`}>
            <button style={{ width: "100%", textAlign: "left" }} onClick={() => openItem(item.id)}>
              <div className="row-t">{item.title}</div>
              <div className="row-m">{item.ref} · sent {submission ? new Date(submission.submitted_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "for review"}</div>
              <div className="row-note">Waiting for your manager to check it.</div>
            </button>
            <div className="waiting-action">
              {follow.canFollowUp
                ? <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => followUpReview(item.id)}>{follow.label}</button>
                : <span className="waiting-note">{follow.label}</span>}
            </div>
          </div>;
        })}

        {waitingDependencies.length > 0 && <div className="home-subhead home-subhead-spaced">Waiting on another unit or dependency</div>}
        {waitingDependencies.map((item) => {
          const blocker = blockerFor(item);
          const follow = blockerFollowupState(blocker);
          return <div className="row home-work-row" key={`waiting-${item.id}`}>
            <button style={{ width: "100%", textAlign: "left" }} onClick={() => openItem(item.id)}>
              <div className="row-t">{item.title}</div>
              <div className="row-m">{item.ref}{blocker ? ` · ${blocker.units?.name || blocker.party_text}` : ""}</div>
              <div className="row-note">{blocker?.state === "acknowledged" ? "The dependency has been acknowledged." : "Waiting for a response."}</div>
            </button>
            <div className="waiting-action">
              {follow.canFollowUp
                ? <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => followUpDependency(blocker.id)}>{follow.label}</button>
                : <span className="waiting-note">{follow.label}</span>}
            </div>
          </div>;
        })}
      </section>}

      {(dueSoon.length > 0 || upcomingMeetings.length > 0 || calendarEvents.length > 0 || birthdays.length > 0 || upcomingLeave.length > 0) && <section className="home-panel" aria-labelledby="staff-soon-heading">
        <div className="home-section-head"><div><div className="home-kicker">Next few days</div><h2 id="staff-soon-heading">Coming up</h2></div></div>
        {dueSoon.map((item) => <WorkRow key={item.id} item={item} openItem={openItem} tone="info" />)}
        {upcomingMeetings.map((meeting) => <button key={meeting.id} className="row home-work-row home-meeting-row" onClick={() => openMeeting?.(meeting.id)}>
          <div className="row-t">{meeting.title}</div>
          <div className="row-m">{new Date(meeting.starts_at).toLocaleString("en-GB", { timeZone: "Africa/Accra", weekday:"short", day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" })} · {meeting.provider === "zoom" ? "Zoom" : "Meeting"}</div>
          <div className="row-note">{meeting.scope === "project" ? meeting.projects?.name : meeting.scope === "unit" ? meeting.units?.name : "CEAC"}</div>
        </button>)}
        {calendarEvents.map((event) => <button key={event.id} className="row home-work-row" onClick={() => setEventDetail(event)}>
          <div className="row-t">{event.cancelled ? "Cancelled · " : ""}{event.title}</div>
          <div className="row-m">{new Date(event.starts_at).toLocaleString("en-GB", { timeZone: "Africa/Accra", day: "numeric", month: "short", hour: event.all_day ? undefined : "2-digit", minute: event.all_day ? undefined : "2-digit" })}{event.location ? ` · ${event.location}` : ""}</div>
        </button>)}
        {birthdays.map((profile) => <div className="row compact-context-row" key={`birthday-${profile.id}`}>
          <div className="row-t">{profile.full_name}'s birthday</div>
          <div className="row-m">{profile.nextBirthday.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}</div>
        </div>)}
        {upcomingLeave.map((request) => <div className="row compact-context-row" key={`leave-${request.id}`}>
          <div className="row-t">Your approved {request.kind} leave begins</div>
          <div className="row-m">{new Date(`${request.start_date}T00:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}</div>
        </div>)}
      </section>}

      {announcements.length > 0 && <details className="home-panel home-panel-secondary">
        <summary className="home-secondary-summary">
          <span><small>From CEAC</small><strong>Announcements</strong></span>
          <b>{announcements.length}</b>
        </summary>
        <div className="home-secondary-body">
          {announcements.slice(0, 2).map((announcement) => {
            const receipt = (announcement.announcement_receipts || []).find((entry) => entry.profile_id === me.id);
            return <button key={announcement.id} className={`row home-work-row ${!receipt ? "home-tone-info" : ""}`} onClick={openAnnouncements}>
              <div className="row-t">{!receipt ? "New · " : ""}{announcement.title}</div>
              <div className="row-m">{announcement.priority !== "normal" ? `${announcement.priority} · ` : ""}{announcement.profiles?.full_name || "CEAC"}</div>
              {announcement.requires_acknowledgement && !receipt?.acknowledged_at && <div className="row-note">Acknowledgement required</div>}
            </button>;
          })}
          <button className="text-action" onClick={openAnnouncements}>See all announcements</button>
        </div>
      </details>}

      <details className="home-panel home-panel-week home-panel-secondary">
        <summary className="home-secondary-summary">
          <span><small>Your factual record</small><strong>This week</strong></span>
          <b>{completedThisWeek.length}</b>
        </summary>
        <div className="home-secondary-body">
        <div className="home-stat-grid">
          <button className="home-stat home-tone-info" onClick={() => setDrill({ title: "Work due this week", rows: dueThisWeek })}><b>{dueThisWeek.length}</b><span>Due</span></button>
          <button className="home-stat home-tone-success" onClick={() => setDrill({ title: "Work completed this week", rows: completedThisWeek })}><b>{completedThisWeek.length}</b><span>Completed</span></button>
          <button className="home-stat home-tone-danger" onClick={() => setDrill({ title: "Overdue work", rows: overdue })}><b>{overdue.length}</b><span>Overdue</span></button>
        </div>
        {drill && <div className="home-drill"><div className="home-drill-head"><strong>{drill.title}</strong><span>{drillRows.length}</span></div>
          {drillRows.length ? drillRows.map((item) => <WorkRow key={item.id} item={item} openItem={openItem} />) : <div className="home-quiet">No work in this group.</div>}
        </div>}
        </div>
      </details>
    </div>}

    {ask && <Sheet onClose={() => setAsk(false)}>
      <div className="h2">Where are you working?</div>
      <p className="screen-note" style={{ marginBottom: 10 }}>We record where you start. We do not track you during the day.</p>
      <button className="opt" onClick={() => { setPlace("office"); setSessionWorkItem(""); }}><span className={`rd ${place === "office" ? "on" : ""}`} /> At the office</button>
      <button className="opt" onClick={() => setPlace("elsewhere")}><span className={`rd ${place === "elsewhere" ? "on" : ""}`} /> Somewhere else</button>
      {place === "elsewhere" && <>
        <select className="field" aria-label="Work being done off-site" value={sessionWorkItem} onChange={(event) => setSessionWorkItem(event.target.value)}>
          <option value="">Choose the work you are doing</option>
          {items.filter((item) => ["not_started", "in_progress", "returned"].includes(item.status)).map((item) => <option key={item.id} value={item.id}>{item.ref} · {item.title}</option>)}
        </select>
        <div className="hint">The location is attached to this work when you start. CEAC OS does not track you during the day.</div>
      </>}
      <button className="btn" style={{ marginTop: 16 }} onClick={begin} disabled={busy || (place === "elsewhere" && !sessionWorkItem)}>{busy ? "Starting..." : "Start work"}</button>
    </Sheet>}
    {recoveryOpen && <Sheet onClose={() => !busy && setRecoveryOpen(false)}>
      <div className="h2">Close the earlier work session</div>
      <p className="screen-note">Enter when you actually stopped. The original start, this correction and who made it remain in the history.</p>
      <label className="label" htmlFor="recovery-ended-at">Actual end time</label>
      <input id="recovery-ended-at" className="field" type="datetime-local" value={recoveryEndedAt} onChange={(event) => setRecoveryEndedAt(event.target.value)} />
      <label className="label" htmlFor="recovery-note">Correction note (optional)</label>
      <AssistiveTextarea id="recovery-note" className="field" rows={3} value={recoveryNote} onChange={(event) => setRecoveryNote(event.target.value)} placeholder="Anything useful about this correction" />
      <button className="btn" style={{ marginTop: 14 }} onClick={closeRecoveredSession} disabled={busy || !recoveryEndedAt}>{busy ? "Saving..." : "Close and record correction"}</button>
    </Sheet>}
    {eventDetail && <Sheet onClose={() => setEventDetail(null)}>
      <div className="eyebrow">{eventDetail.kind.replaceAll("_", " ")}</div>
      <div className="h2" style={{ marginTop: 5 }}>{eventDetail.title}</div>
      {eventDetail.cancelled && <div className="flag flag-brick" style={{ marginTop: 12 }}><h4>Cancelled</h4>This stays visible because people may already have planned around it.</div>}
      <div className="card" style={{ marginTop: 14 }}>
        <div className="row-m">{new Date(eventDetail.starts_at).toLocaleString("en-GB", { timeZone: "Africa/Accra", day: "numeric", month: "short", year: "numeric", hour: eventDetail.all_day ? undefined : "2-digit", minute: eventDetail.all_day ? undefined : "2-digit" })}</div>
        {eventDetail.location && <div className="row-note">Location: {eventDetail.location}</div>}
        {eventDetail.notes && <div className="row-note">{eventDetail.notes}</div>}
      </div>
    </Sheet>}
  </div>;
}
