import { useState } from "react";
import { supabase } from "../lib/supabase";
export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  async function go() {
    setBusy(true); setErr(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) setErr("That email and password did not match. Please try again.");
    setBusy(false);
  }
  return (
    <div className="signin-wrap">
      <div className="eyebrow">CEAC</div>
      <h1 className="h1" style={{ marginTop: 6 }}>Sign in</h1>
      <p className="screen-note">Use the work email your manager invited.</p>
      <div style={{ marginTop: 26 }}>
        <input className="field" placeholder="Work email" type="email" autoCapitalize="none"
          value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="field" placeholder="Password" type="password"
          value={password} onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && go()} />
      </div>
      {err && <div className="flag flag-brick" style={{ marginTop: 14 }}>{err}</div>}
      <button className="btn" style={{ marginTop: 18 }} onClick={go} disabled={busy || !email || !password}>
        {busy ? "Signing in..." : "Sign in"}
      </button>
    </div>);
}
