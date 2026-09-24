// Dense decision rows. Age stays prominent because old work must not be
// visually equivalent to new work.
import Icon from "./Icon";

export function ageOf(iso) {
  if (!iso) return { text: "—", tone: "quiet", days: 0 };
  const days = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));
  const text = days < 1 ? "today" : days === 1 ? "1 day" : days + " days";
  const tone = days >= 14 ? "very-late" : days >= 7 ? "late" : days >= 3 ? "slow" : "quiet";
  return { text, tone, days };
}

export default function QueueRow({ since, title, meta, amount, actions, onOpen, openLabel }) {
  const age = ageOf(since);
  return (
    <div className={"qrow" + (age.tone === "very-late" ? " qrow-very-late" : "")}>
      <span className={"qrow-age age-" + age.tone}
        title={since ? new Date(since).toLocaleString("en-GB") : ""}>
        {(age.tone === "late" || age.tone === "very-late") && <Icon name="clock" size={13} />}
        {age.text}
      </span>
      <button type="button" className="qrow-main" onClick={onOpen} disabled={!onOpen}
        aria-label={onOpen ? (openLabel || "Open queue item") : undefined}>
        <span className="qrow-t">{title}</span>
        {meta && <span className="qrow-m">{meta}</span>}
      </button>
      {amount && <span className="qrow-amt">{amount}</span>}
      {actions && <span className="qrow-act">{actions}</span>}
    </div>
  );
}

// Oldest first, always. A queue sorted any other way hides the problem.
export function byOldest(rows, key = "since") {
  return [...rows].sort((a, b) => new Date(a[key] || 0) - new Date(b[key] || 0));
}
