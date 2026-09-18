import { useEffect, useRef, useState } from "react";
// Uses the browser's own speech recognition. No account, no key, no cost.
export default function VoiceInput({ onResult, label = "Say what needs doing" }) {
  const [state, setState] = useState("idle");
  const [supported, setSupported] = useState(true);
  const recRef = useRef(null);
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setSupported(false); return; }
    const r = new SR();
    r.lang = "en-GB"; r.continuous = false; r.interimResults = false; r.maxAlternatives = 1;
    r.onresult = (e) => { onResult(e.results[0][0].transcript); };
    r.onerror = () => setState("idle");
    r.onend = () => setState((s) => (s === "listening" ? "idle" : s));
    recRef.current = r;
    return () => { try { r.abort(); } catch {} };
  }, [onResult]);
  if (!supported) return null;
  function toggle() {
    if (!recRef.current) return;
    if (state === "listening") { try { recRef.current.stop(); } catch {}; setState("idle"); return; }
    try { setState("listening"); recRef.current.start(); } catch { setState("idle"); }
  }
  return (
    <button type="button" onClick={toggle} className={"mic " + (state === "listening" ? "live" : "")}>
      {state === "listening" ? "● Listening — tap to stop" : "🎙 " + label}
    </button>);
}
