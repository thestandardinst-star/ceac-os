import { useEffect } from "react";
import Icon from "./Icon";

const iconFor = {
  success: "check",
  attention: "warning",
  risk: "warning",
  info: "control",
};

export default function Toast({
  message,
  tone = "info",
  actionLabel,
  onAction,
  onDismiss,
  duration = 4000,
}) {
  useEffect(() => {
    if (!onDismiss || !duration) return undefined;
    const timer = window.setTimeout(onDismiss, duration);
    return () => window.clearTimeout(timer);
  }, [duration, onDismiss]);

  if (!message) return null;

  return (
    <div className={"ceac-toast ceac-toast-" + tone} role="status" aria-live="polite">
      <span className="ceac-toast-icon" aria-hidden="true">
        <Icon name={iconFor[tone] || "control"} size={17} />
      </span>
      <span className="ceac-toast-message">{message}</span>
      {actionLabel && onAction
        ? <button type="button" className="ceac-toast-action" onClick={onAction}>{actionLabel}</button>
        : onDismiss
          ? <button type="button" className="ceac-toast-action" onClick={onDismiss} aria-label="Dismiss">Close</button>
          : null}
    </div>
  );
}
