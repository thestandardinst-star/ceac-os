import VoiceInput from "./VoiceInput";

export default function AssistiveTextarea({
  value,
  onChange,
  voiceLabel = "Speak text",
  className = "",
  disabled = false,
  ...props
}) {
  function appendVoice(text) {
    const next = String(value || "").trim()
      ? String(value || "").trimEnd() + " " + text
      : text;
    onChange?.({ target: { value: next } });
  }

  return <div className={"assistive-field textarea " + className}>
    <textarea
      {...props}
      disabled={disabled}
      value={value}
      onChange={onChange}
    />
    {!disabled && <VoiceInput compact label={voiceLabel} onResult={appendVoice} />}
  </div>;
}
