import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function SignIn() {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  async function signIn() {
    setBusy(true); setMessage(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (error) setMessage("That email and password did not match. Please try again.");
    setBusy(false);
  }

  async function recover() {
    setBusy(true); setMessage(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) {
      setMessage(error.message || "The recovery email could not be sent.");
      return;
    }
    setMessage("If that address belongs to a CEAC account, a password-recovery email is on its way.");
  }

  return <div className="signin-wrap">
    <div className="eyebrow">CEAC</div>
    <h1 className="h1" style={{ marginTop: 6 }}>{mode === "signin" ? "Sign in" : "Reset your password"}</h1>
    <p className="screen-note">
      {mode === "signin"
        ? "Use the work email your manager or Administration invited."
        : "Enter your CEAC work email. We will send a secure recovery link."}
    </p>

    <div style={{ marginTop: 26 }}>
      <input className="field" placeholder="Work email" type="email" autoCapitalize="none" autoComplete="email"
        value={email} onChange={(event) => setEmail(event.target.value)} />
      {mode === "signin" && <input className="field" placeholder="Password" type="password" autoComplete="current-password"
        value={password} onChange={(event) => setPassword(event.target.value)}
        onKeyDown={(event) => event.key === "Enter" && signIn()} />}
    </div>

    {message && <div className={`flag ${message.startsWith("If that") ? "flag-green" : "flag-brick"}`} style={{ marginTop: 14 }}>{message}</div>}

    <button className="btn" style={{ marginTop: 18 }}
      onClick={mode === "signin" ? signIn : recover}
      disabled={busy || !email || (mode === "signin" && !password)}>
      {busy ? "Please wait..." : mode === "signin" ? "Sign in" : "Send recovery link"}
    </button>

    <button className="text-action" style={{ marginTop: 16 }}
      onClick={() => { setMode(mode === "signin" ? "recover" : "signin"); setMessage(null); setPassword(""); }}>
      {mode === "signin" ? "Forgot password?" : "Back to sign in"}
    </button>
  </div>;
}
