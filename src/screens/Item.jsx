import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { dueLabel } from "../lib/time";
import { Sheet, statusPill } from "../components/bits";

export default function Item({ id, me, session, back }) {
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

  useEffect(() => { load(); }, [id]);

  async function load() {
    const { data: w } = await supabase.from("work_items")
      .select("*, projects(name), sub_teams(name)").eq("id", id).single();
    setItem(w);
    const { data: c } = await supabase.from("checklist_items")
      .select("id,label,position").eq("work_item_id", id).order("position");
    setChecks(c || []);
    if (c && c.length) {
      const { data: t } = await supabase.from("checklist_ticks")
        .select("checklist_item_id, undone_at").in("checklist_item_id", c.map((x) => x.id));
      const map = {};
      (t || []).forEach((x) => { if (!x.undone_at) map[x.checklist_item_id] = true; });
      setTicks(map);
    }
    const { data: b } = await supabase.from("blockers").select("*, units(name)")
      .eq("work_item_id", id).neq("state", "resolved").maybeSingle();
    setBlocker(b);
    const { data: subs } = await supabase.from("submissions")
      .select("id, submitted_at, reviews(decision, comment)")
      .eq("work_item_id", id).order("submitted_at", { ascending: false }).limit(1);
    const last = subs && subs[0];
    setReview(last && last.reviews && last.reviews[0] ? last.reviews[0] : null);
    const { data: u } = await supabase.from("units").select("id,name").order("name");
    setUnits(u || []);
  }

  const done = checks.filter((c) => ticks[c.id]).length;
  const allDone = checks.length > 0 && done === checks.length;
  const gated = !session;

  async function toggle(cid) {
    if (gated) return;
    if (ticks[cid]) {
      await supabase.from("checklist_ticks").update({ undone_at: new Date().toISOString() })
        .eq("checklist_item_id", cid).eq("profile_id", me.id).is("undone_at", null);
      setTicks((t) => ({ ...t, [cid]: false }));
    } else {
      await supabase.from("checklist_ticks")
        .insert({ checklist_item_id: cid, profile_id: me.id, session_id: session ? session.id : null });
      setTicks((t) => ({ ...t, [cid]: true }));
      if (item.status === "not_started") {
        await supabase.from("work_items").update({ status: "in_progress", last_movement_at: new Date().toISOString() }).eq("id", id);
        setItem((i) => ({ ...i, status: "in_progress" }));
      }
    }
  }

  async function submit() {
    setBusy(true);
    try {
      const { data: s } = await supabase.from("submissions").insert({
        org_id: me.org_id, work_item_id: id, profile_id: me.id,
        session_id: session ? session.id : null, note, outside_session: !session,
      }).select("id").single();
      if (link.trim() && s) await supabase.from("submission_files").insert({ submission_id: s.id, kind: "link", url: link.trim() });
      await supabase.from("work_items").update({ status: "in_review", last_movement_at: new Date().toISOString() }).eq("id", id);
      setSheet(null); setNote(""); setLink(""); await load();
    } finally { setBusy(false); }
  }

  async function markWaiting() {
    setBusy(true);
    try {
      await supabase.from("blockers").insert({
        org_id: me.org_id, work_item_id: id, claimed_by: me.id,
        party_unit_id: partyUnit, party_text: party, note });
      await supabase.from("work_items").update({ status: "waiting_on", last_movement_at: new Date().toISOString() }).eq("id", id);
      setSheet(null); setParty(""); setNote(""); setPartyUnit(null); await load();
    } finally { setBusy(false); }
  }

  if (!item) return <div className="spin">Loading...</div>;

  return (
    <div className="body">
      <button className="back" onClick={back}>← Back</button>
      <div className="eyebrow">{item.ref}{item.projects ? " · " + item.projects.name : ""}{item.sub_teams ? " · " + item.sub_teams.name : ""}</div>
      <h1 className="h2" style={{ marginTop: 6, fontSize: 22 }}>{item.title}</h1>
      <div className="screen-note">{dueLabel(item.due_at)}</div>
      <div style={{ marginTop: 10 }}>{statusPill(item.status)}</div>

      {review && review.decision === "returned" && (
        <div className="flag flag-brick"><h4>Sent back by your manager</h4>{review.comment}</div>)}

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

      {checks.length > 0 && (<>
        <div className="sec"><span>Completion checklist</span><span>{done} of {checks.length}</span></div>
        <div className="card" style={{ padding: "2px 15px" }}>
          {checks.map((c) => (
            <button key={c.id} className={"ck " + (ticks[c.id] ? "done" : "")} onClick={() => toggle(c.id)} disabled={gated}>
              <span className={"box " + (ticks[c.id] ? "on" : "")} />
              <span className="ck-l">{c.label}</span>
            </button>))}
        </div></>)}

      {item.status !== "in_review" && item.status !== "completed" && (<>
        <button className="btn" style={{ marginTop: 20 }} onClick={() => setSheet("submit")}
          disabled={gated || (checks.length > 0 && !allDone)}>Send for review</button>
        {gated && <div className="hint">Start work to send this in</div>}
        {!gated && checks.length > 0 && !allDone && <div className="hint">Finish the checklist to send it in</div>}
        {!blocker && (
          <button className="btn btn-ghost" style={{ marginTop: 10 }} onClick={() => setSheet("waiting")} disabled={gated}>
            I am waiting on someone</button>)}
      </>)}

      {item.status === "in_review" &&
        <div className="flag flag-amber" style={{ marginTop: 20 }}><h4>Sent in</h4>Waiting on your manager to check it.</div>}

      {sheet === "submit" && (
        <Sheet onClose={() => setSheet(null)}>
          <div className="h2">Send for review</div>
          <p className="screen-note">Your manager will be told.</p>
          <textarea className="field" rows={3} placeholder="Anything they should know (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
          <input className="field" placeholder="Paste a link to the file (optional)" value={link} onChange={(e) => setLink(e.target.value)} />
          <p className="small" style={{ marginTop: 8 }}>Large files — video especially — should be a link rather than an upload.</p>
          <button className="btn" style={{ marginTop: 14 }} onClick={submit} disabled={busy}>{busy ? "Sending..." : "Send"}</button>
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
