import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function AccountPassword({ mode, onDone }) {
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function check() {
      const { data, error } = await supabase.auth.getSession();
      if (!mounted) return;
      if (error) {
        setMessage(error.message || "This secure link could not be verified.");
        setHasSession(false);
        setReady(true);
        return;
      }
      setHasSession(Boolean(data.session));
      setReady(true);
    }
    check();
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setHasSession(Boolean(session));
      setReady(true);
    });
    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  async function save() {
    setMessage(null);
    if (password.length < 12) {
      setMessage("Use at least 12 characters.");
      return;
    }
    if (password !== confirm) {
      setMessage("The passwords do not match.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      setMessage(error.message || "Your password could not be saved.");
      return;
    }
    setMessage(mode === "activate" ? "Your CEAC account is ready." : "Your password has been changed.");
    setTimeout(() => onDone?.(), 350);
  }

  if (!ready) return <div className="spin">Opening your secure link...</div>;

  return <div className="signin-wrap">
    <div className="eyebrow">CEAC</div>
    <h1 className="h1" style={{ marginTop: 6 }}>{mode === "activate" ? "Set your password" : "Choose a new password"}</h1>
    <p className="screen-note">
      {mode === "activate"
        ? "Your invitation has been verified. Set the password you will use to sign in from now on."
        : "Your recovery link has been verified. Choose a new password for your CEAC account."}
    </p>

    {!hasSession ? <div className="flag flag-brick" style={{ marginTop: 22 }}>
      <h4>This link is no longer active</h4>
      Open the newest CEAC email link. If it has expired, request another recovery link from the sign-in page.
    </div> : <>
      <div style={{ marginTop: 26 }}>
        <input className="field" type="password" autoComplete="new-password"
          placeholder="New password · at least 12 characters"
          value={password} onChange={(event) => setPassword(event.target.value)} />
        <input className="field" type="password" autoComplete="new-password"
          placeholder="Confirm password"
          value={confirm} onChange={(event) => setConfirm(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && save()} />
      </div>
      {message && <div className={`flag ${message.includes("ready") || message.includes("changed") ? "flag-green" : "flag-brick"}`} style={{ marginTop: 14 }}>{message}</div>}
      <button className="btn" style={{ marginTop: 18 }} onClick={save}
        disabled={busy || !password || !confirm}>
        {busy ? "Saving..." : mode === "activate" ? "Finish account setup" : "Save new password"}
      </button>
    </>}
  </div>;
}
