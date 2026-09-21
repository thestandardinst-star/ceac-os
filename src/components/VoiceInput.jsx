import { useEffect, useRef, useState } from "react";

function MicIcon({ size = 17 }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <rect x="8" y="3" width="8" height="12" rx="4" />
    <path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6" />
  </svg>;
}

function messageForError(code) {
  if (code === "not-allowed" || code === "service-not-allowed") return "Microphone access is off for this site.";
  if (code === "no-speech") return "I did not hear anything. Try again.";
  if (code === "audio-capture") return "No microphone is available.";
  if (code === "network") return "Speech recognition could not connect.";
  return "Voice input stopped. You can try again.";
}

export default function VoiceInput({
  onResult,
  onInterim,
  onError,
  label = "Speak",
  compact = false,
  disabled = false,
  language = "en-GB",
  className = "",
}) {
  const [state, setState] = useState("idle");
  const [supported, setSupported] = useState(true);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState("");
  const recRef = useRef(null);
  const finalRef = useRef("");
  const errorRef = useRef(false);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      return undefined;
    }

    const recognition = new SR();
    recognition.lang = language;
    const isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    recognition.continuous = !isiOS;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      finalRef.current = "";
      setInterim("");
      setError("");
      errorRef.current = false;
      setState("listening");
    };

    recognition.onresult = (event) => {
      let finalText = finalRef.current;
      let interimText = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const text = event.results[index][0]?.transcript || "";
        if (event.results[index].isFinal) finalText += (finalText ? " " : "") + text.trim();
        else interimText += (interimText ? " " : "") + text.trim();
      }

      finalRef.current = finalText.trim();
      setInterim(interimText.trim());
      onInterim?.(interimText.trim(), finalRef.current);
    };

    recognition.onerror = (event) => {
      const message = messageForError(event.error);
      setError(message);
      errorRef.current = true;
      setState("error");
      onError?.(message, event.error);
    };

    recognition.onend = () => {
      const finalText = finalRef.current.trim();
      const hadError = errorRef.current;
      setInterim("");
      if (finalText) onResult?.(finalText);
      setState(hadError ? "error" : "idle");
    };

    recRef.current = recognition;

    return () => {
      try { recognition.abort(); } catch {}
      recRef.current = null;
    };
  }, [language, onError, onInterim, onResult]);

  if (!supported) {
    if (compact) return null;
    return <div className={"voice-unavailable " + className}>
      Voice transcription is not available in this browser. You can still type normally.
    </div>;
  }

  function toggle() {
    const recognition = recRef.current;
    if (!recognition || disabled) return;

    if (state === "listening") {
      try { recognition.stop(); } catch {}
      return;
    }

    finalRef.current = "";
    setInterim("");
    setError("");
    errorRef.current = false;
    try {
      recognition.start();
    } catch {
      setState("idle");
    }
  }

  const live = state === "listening";
  const title = live ? "Stop listening" : label;

  return <div className={"voice-input " + (compact ? "compact " : "") + className}>
    <button
      type="button"
      className={"voice-button " + (live ? "live " : "") + (state === "error" ? "error " : "")}
      onClick={toggle}
      disabled={disabled}
      aria-pressed={live}
      aria-label={title}
      title={title}
    >
      <MicIcon />
      {!compact && <span>{live ? "Listening — tap to stop" : label}</span>}
      {live && <i aria-hidden="true" />}
    </button>
    {!compact && live && interim && <div className="voice-live-transcript">{interim}</div>}
    {!compact && error && <div className="voice-error">{error}</div>}
  </div>;
}
