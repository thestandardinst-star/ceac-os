import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

// Your own account, and nobody else's. Both database functions filter on
// the signed-in person and take no parameter naming anyone, so this cannot
// become a way of watching colleagues.
//
// This exists because prevention eventually fails. A stolen password is
// only as damaging as the time it goes unnoticed, and until now nobody at
// CEAC could see where their account was signed in.
function friendlyDevice(ua) {
  if (!ua || ua === "Unknown device") return "Unknown device";
  const browser = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome"
    : /Safari\//.test(ua) ? "Safari" : /Firefox\//.test(ua) ? "Firefox" : "Browser";
  const os = /Android/.test(ua) ? "Android" : /iPhone|iPad|iOS/.test(ua) ? "iPhone or iPad"
    : /Windows/.test(ua) ? "Windows" : /Mac OS X|Macintosh/.test(ua) ? "Mac"
    : /Linux/.test(ua) ? "Linux" : "";
  return os ? browser + " on " + os : browser;
}
const when = (t) => new Date(t).toLocaleString("en-GB",
  { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default function AccountActivity({ me }) {
  const [sessions, setSessions] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true); setErr(null);
    const [s, a] = await Promise.all([
      supabase.rpc("my_sessions"),
      supabase.rpc("my_account_activity", { p_limit: 50 }),
    ]);
    if (s.error) setErr(s.error.message);
    setSessions(s.data || []); setEvents(a.data || []);
    setLoading(false);
  }

  // Ends every session everywhere, including this one.
  async function signOutEverywhere() {
    if (!confirm("Sign out on every device, including this one? You will need to sign in again.")) return;
    setBusy(true);
    try { await supabase.auth.signOut({ scope: "global" }); }
    finally { setBusy(false); }
  }

  if (loading) return <div className="body"><div className="spin">Loading your account...</div></div>;

  return (
    <div className="body">
      <div style={{ paddingTop: 26 }}>
        <h1 className="h1">Your account</h1>
        <p className="screen-note">Where you are signed in, and what has happened under your name. Only you can see this.</p>
      </div>

      {err && <div className="flag flag-brick"><h4>Could not load sessions</h4>{err}</div>}

      <div className="sec"><span>Signed in on</span><span>{sessions.length}</span></div>
      {sessions.length === 0 && <div className="card small">No other device is signed in.</div>}
      {sessions.map((s) => (
        <div key={s.session_id} className="row">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
            <div className="row-t">{friendlyDevice(s.device)}</div>
            {s.is_current && <span className="pill p-green">This device</span>}
          </div>
          <div className="row-m">last used {when(s.last_seen)} · signed in {when(s.signed_in_at)}</div>
          <div className="row-m">from {s.ip}</div>
        </div>))}

      {sessions.length > 1 && (
        <div className="flag flag-amber">
          <h4>More than one device is signed in</h4>
          That is normal if you use a phone and a computer. If you do not recognise one of them, sign out everywhere below and change your password.
        </div>)}

      <button className="btn btn-ghost wide-auto" style={{ marginTop: 12 }}
        onClick={signOutEverywhere} disabled={busy}>
        {busy ? "Signing out..." : "Sign out on every device"}</button>

      <div className="sec"><span>Recent activity</span><span>{events.length}</span></div>
      {events.length === 0 && <div className="card small">Nothing recorded yet.</div>}
      {events.map((e, i) => (
        <div key={i} className="row">
          <div className="row-t">{String(e.action).replace(/[._]/g, " ")}</div>
          <div className="row-m">
            {when(e.at)} · {e.by_me ? "by you" : "by " + e.actor_name}
            {e.resource_type ? " · " + String(e.resource_type).replace(/_/g, " ") : ""}
          </div>
        </div>))}

      <div className="sec"><span>Staying safe</span></div>
      <div className="card small" style={{ lineHeight: 1.6 }}>
        Nobody from CEAC will ever email or message you asking you to sign in, confirm your password,
        or open a link to &ldquo;verify your account&rdquo;. If you receive one, it is not from us.
        Tell Administration rather than replying to it.
      </div>
    </div>);
}
