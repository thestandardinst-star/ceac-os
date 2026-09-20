import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { dueLabel } from "../lib/time";
import { Sheet, statusPill } from "../components/bits";

const MANAGER_SELF_CERTIFICATION_READY = true;

export default function Item({ id, me, session, isManager = false, back }) {
  const [item, setItem] = useState(null);
  const [checks, setChecks] = useState([]);
  const [ticks, setTicks] = useState({});
  const [blocker, setBlocker] = useState(null);
  const [review, setReview] = useState(null);
  const [units, setUnits] = useState([]);
  const [sheet, setSheet] = useState(null);
  const [note, setNote] = useState("");
  const [link, setLink] = useState("");
  const [party, setParty] = useState("");
  const [partyUnit, setPartyUnit] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => { load(); }, [id]);

  async function load() {
    setErr(null);
    const { data: w, error: workError } = await supabase.from("work_items")
      .select("*, projects(name), sub_teams(name)").eq("id", id).single();
    if (workError) { setErr(workError.message); return; }
    setItem(w);
    const { data: c, error: checklistError } = await supabase.from("checklist_items")
      .select("id,label,position").eq("work_item_id", id).order("position");
    if (checklistError) { setErr(checklistError.message); return; }
    setChecks(c || []);
    if (c && c.length) {
      const { data: t, error: tickError } = await supabase.from("checklist_ticks")
        .select("checklist_item_id, undone_at").in("checklist_item_id", c.map((x) => x.id));
      if (tickError) { setErr(tickError.message); return; }
      const map = {};
      (t || []).forEach((x) => { if (!x.undone_at) map[x.checklist_item_id] = true; });
      setTicks(map);
    }
    const { data: b, error: blockerError } = await supabase.from("blockers").select("*, units(name)")
      .eq("work_item_id", id).neq("state", "resolved").maybeSingle();
    if (blockerError) { setErr(blockerError.message); return; }
    setBlocker(b);
    const { data: subs, error: submissionError } = await supabase.from("submissions")
      .select("id, submitted_at, reviews(id, decision, comment, review_checklist_items(checklist_item_id))")
      .eq("work_item_id", id).order("submitted_at", { ascending: false }).limit(1);
    if (submissionError) { setErr(submissionError.message); return; }
    const last = subs && subs[0];
    setReview(last && last.reviews && last.reviews[0] ? last.reviews[0] : null);
    const { data: u, error: unitError } = await supabase.from("units").select("id,name").order("name");
    if (unitError) { setErr(unitError.message); return; }
    setUnits(u || []);
  }

  const done = checks.filter((c) => ticks[c.id]).length;
  const allDone = checks.length > 0 && done === checks.length;
  const gated = !session;
  const managerOwnWork = isManager && item && item.assignee_id === me.id;
  const managerSubmissionBlocked = managerOwnWork && !MANAGER_SELF_CERTIFICATION_READY;

  async function toggle(cid) {
    if (gated) return;
    setErr(null);
    if (ticks[cid]) {
      const { error } = await supabase.from("checklist_ticks").update({ undone_at: new Date().toISOString() })
        .eq("checklist_item_id", cid).eq("profile_id", me.id).is("undone_at", null);
      if (error) { setErr(error.message); return; }
      setTicks((t) => ({ ...t, [cid]: false }));
    } else {
      const { error } = await supabase.from("checklist_ticks")
        .insert({ checklist_item_id: cid, profile_id: me.id, session_id: session ? session.id : null });
      if (error) { setErr(error.message); return; }
      setTicks((t) => ({ ...t, [cid]: true }));
      if (item.status === "not_started") {
        const { error: statusError } = await supabase.from("work_items").update({ status: "in_progress", last_movement_at: new Date().toISOString() }).eq("id", id);
        if (statusError) { setErr(statusError.message); return; }
        setItem((i) => ({ ...i, status: "in_progress" }));
      }
    }
  }

  async function submit() {
    if (managerSubmissionBlocked) {
      setErr("Manager self-certification needs the pending database migration. Nothing was submitted.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      if (managerOwnWork) {
        const { error: selfCertificationError } = await supabase.rpc("self_certify_work", {
          p_work_item_id: id,
          p_session_id: session ? session.id : null,
          p_note: note.trim() || null,
          p_link: link.trim() || null,
        });
        if (selfCertificationError) throw selfCertificationError;
        setSheet(null); setNote(""); setLink(""); await load();
        return;
      }
      const { data: s, error: submissionError } = await supabase.from("submissions").insert({
        org_id: me.org_id, work_item_id: id, profile_id: me.id,
        session_id: session ? session.id : null, note, outside_session: !session,
      }).select("id").single();
      if (submissionError) throw submissionError;
      if (link.trim() && s) {
        const { error: fileError } = await supabase.from("submission_files").insert({ submission_id: s.id, kind: "link", url: link.trim() });
        if (fileError) throw fileError;
      }
      const { error: statusError } = await supabase.from("work_items")
        .update({ status: "in_review", last_movement_at: new Date().toISOString() }).eq("id", id);
      if (statusError) throw statusError;
      setSheet(null); setNote(""); setLink(""); await load();
    } catch (e) { setErr(e.message || "The work could not be submitted."); }
    finally { setBusy(false); }
  }

  async function reopenFinishedWork() {
    if (!note.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      const { error } = await supabase.rpc("reopen_approved_work", {
        p_work_item_id: id,
        p_reason: note.trim(),
      });
      if (error) throw error;
      setSheet(null); setNote(""); await load();
    } catch (e) { setErr(e.message || "The work could not be reopened."); }
    finally { setBusy(false); }
  }

  async function markWaiting() {
    setBusy(true);
    setErr(null);
    try {
      const { error: blockerError } = await supabase.from("blockers").insert({
        org_id: me.org_id, work_item_id: id, claimed_by: me.id,
        party_unit_id: partyUnit, party_text: party, note });
      if (blockerError) throw blockerError;
      const { error: statusError } = await supabase.from("work_items")
        .update({ status: "waiting_on", last_movement_at: new Date().toISOString() }).eq("id", id);
      if (statusError) throw statusError;
      setSheet(null); setParty(""); setNote(""); setPartyUnit(null); await load();
    } catch (e) { setErr(e.message || "The blocker could not be saved."); }
    finally { setBusy(false); }
  }

  if (!item) return err
    ? <div className="body"><button className="back" onClick={back}>← Back</button><div className="flag flag-brick"><h4>Could not load this work</h4>{err}</div></div>
    : <div className="spin">Loading...</div>;

  return (
    <div className="body">
      <button className="back" onClick={back}>← Back</button>
      <div className="eyebrow">{item.ref}{item.projects ? " · " + item.projects.name : ""}{item.sub_teams ? " · " + item.sub_teams.name : ""}</div>
      <h1 className="h2" style={{ marginTop: 6, fontSize: 22 }}>{item.title}</h1>
      <div className="screen-note">{dueLabel(item.due_at)}</div>
      <div style={{ marginTop: 10 }}>{statusPill(item.status)}</div>

      {err && <div className="flag flag-brick" style={{ marginTop: 14 }}>{err}</div>}

      {review && review.decision === "returned" && (
        <div className="flag flag-brick">
          <h4>Sent back by your manager</h4>
          {review.comment}
          {review.review_checklist_items?.length > 0 && <div style={{ marginTop: 8 }}>
            <div className="small" style={{ fontWeight: 700 }}>Checklist points to redo</div>
            {review.review_checklist_items.map((row) => {
              const item = checks.find((check) => check.id === row.checklist_item_id);
              return item ? <div className="small" key={row.checklist_item_id}>• {item.label}</div> : null;
            })}
          </div>}
        </div>)}

      {blocker && (
        <div className="flag flag-amber">
          <h4>Waiting on {blocker.units ? blocker.units.name : blocker.party_text}
            {blocker.state === "acknowledged" ? " — they have confirmed" : ""}
            {blocker.state === "disputed" ? " — they disagree" : ""}</h4>
          {blocker.party_text}
          {blocker.note && <div style={{ marginTop: 5 }}>&ldquo;{blocker.note}&rdquo;</div>}
          {blocker.state === "claimed" && <div style={{ marginTop: 6, fontSize: 12.5 }}>Waiting for them to reply. This is not counting as late.</div>}
          {blocker.state === "disputed" && blocker.response_note && <div style={{ marginTop: 6 }}>They said: &ldquo;{blocker.response_note}&rdquo;</div>}
        </div>)}

      {item.purpose && (<><div className="sec"><span>Why this matters</span></div>
        <div className="card" style={{ fontSize: 13.5, lineHeight: 1.55, color: "var(--ink-soft)" }}>{item.purpose}</div></>)}

      {item.instructions && (<><div className="sec"><span>What to do</span></div>
        <div className="card" style={{ fontSize: 13.5, lineHeight: 1.55, color: "var(--ink-soft)" }}>{item.instructions}</div></>)}

      {item.expected_outcome && (<><div className="sec"><span>What finished looks like</span></div>
        <div className="card" style={{ fontSize: 13.5, lineHeight: 1.55, color: "var(--ink-soft)" }}>{item.expected_outcome}</div></>)}

      {checks.length > 0 && (<>
        <div className="sec"><span>Completion checklist</span><span>{done} of {checks.length}</span></div>
        <div className="card" style={{ padding: "2px 15px" }}>
          {checks.map((c) => (
            <button key={c.id} className={"ck " + (ticks[c.id] ? "done" : "")} onClick={() => toggle(c.id)} disabled={gated}>
              <span className={"box " + (ticks[c.id] ? "on" : "")} />
              <span className="ck-l">{c.label}</span>
            </button>))}
        </div></>)}

      {!(["in_review", "completed", "self_certified"].includes(item.status)) && (<>
        <button className="btn" style={{ marginTop: 20 }} onClick={() => setSheet("submit")}
          disabled={managerSubmissionBlocked || (checks.length > 0 && !allDone)}>
          {managerOwnWork ? "Finish this work" : "Send for review"}</button>
        {gated && <div className="hint">No work session is open. You can still send this in; it will be recorded as outside a session.</div>}
        {managerSubmissionBlocked && <div className="hint">Manager self-certification is waiting on the database migration. This work will not enter your review queue.</div>}
        {!gated && checks.length > 0 && !allDone && <div className="hint">Finish the checklist to send it in</div>}
        {!blocker && (
          <button className="btn btn-ghost" style={{ marginTop: 10 }} onClick={() => setSheet("waiting")} disabled={gated}>
            I am waiting on someone</button>)}
      </>)}

      {item.status === "in_review" &&
        <div className="flag flag-amber" style={{ marginTop: 20 }}><h4>Sent in</h4>Waiting on your manager to check it.</div>}

      {isManager && ["completed", "self_certified"].includes(item.status) &&
        <button className="btn btn-ghost" style={{ marginTop: 20 }} onClick={() => { setNote(""); setSheet("reopen"); }}>
          Reopen this work
        </button>}

      {sheet === "submit" && (
        <Sheet onClose={() => setSheet(null)}>
          <div className="h2">{managerOwnWork ? "Finish this work" : "Send for review"}</div>
          <p className="screen-note">{managerOwnWork
            ? "This records your submission as self-certified. It will not enter your review queue."
            : "Your manager will be told."}</p>
          {gated && <div className="flag flag-amber"><h4>No work session is open</h4>This submission will still be accepted and recorded as outside a session.</div>}
          <textarea className="field" rows={3} placeholder="Anything they should know (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
          <input className="field" placeholder="Paste a link to the file (optional)" value={link} onChange={(e) => setLink(e.target.value)} />
          <p className="small" style={{ marginTop: 8 }}>Large files — video especially — should be a link rather than an upload.</p>
          <button className="btn" style={{ marginTop: 14 }} onClick={submit} disabled={busy}>{busy ? "Saving..." : gated ? (managerOwnWork ? "Finish outside session" : "Send outside session") : managerOwnWork ? "Finish work" : "Send"}</button>
        </Sheet>)}

      {sheet === "reopen" && (
        <Sheet onClose={() => !busy && setSheet(null)}>
          <div className="h2">Reopen this work</div>
          <p className="screen-note">The existing approval/completion record stays in history. State why more work is required.</p>
          <textarea className="field" rows={3} placeholder="Why is this work being reopened?" value={note} onChange={(e) => setNote(e.target.value)} />
          <button className="btn" style={{ marginTop: 14 }} onClick={reopenFinishedWork} disabled={busy || !note.trim()}>
            {busy ? "Reopening..." : "Reopen work"}
          </button>
        </Sheet>)}

      {sheet === "waiting" && (
        <Sheet onClose={() => setSheet(null)}>
          <div className="h2">What are you waiting on?</div>
          <p className="screen-note">This stops the job counting as late, and shows your manager where the hold-up really is.</p>
          <input className="field" placeholder="What you need, and from whom" value={party} onChange={(e) => setParty(e.target.value)} />
          <div className="sec" style={{ marginTop: 14 }}><span>Which unit?</span></div>
          <div style={{ maxHeight: 148, overflowY: "auto" }}>
            {units.map((u) => (
              <button key={u.id} className="opt" onClick={() => setPartyUnit(u.id)}>
                <span className={"rd " + (partyUnit === u.id ? "on" : "")} /> {u.name}</button>))}
          </div>
          <textarea className="field" rows={2} placeholder="Anything worth noting (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
          <button className="btn" style={{ marginTop: 14 }} onClick={markWaiting} disabled={busy || !party.trim()}>
            {busy ? "Saving..." : "Mark as waiting"}</button>
          <div className="hint">They will be asked to confirm or disagree.</div>
        </Sheet>)}
    </div>);
}
