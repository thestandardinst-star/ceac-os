// For anything waiting on a decision.
//
// Age is the first column and the most important fact on the screen — a
// nine-day-old leave request and a one-day-old one must never look alike.
// Dense enough that twelve fit where the old card layout fit four.
// Actions sit inline; nothing here needs a second screen to act on.
import Icon from "./Icon";

export function ageOf(iso) {
  if (!iso) return { text: "—", tone: "quiet", days: 0 };
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  const text = days < 1 ? "today" : days === 1 ? "1 day" : days + " days";
  return { text, days, tone: days >= 7 ? "late" : days >= 3 ? "slow" : "quiet" };
}

export default function QueueRow({ since, title, meta, amount, actions, onOpen }) {
  const age = ageOf(since);
  return (
    <div className="qrow">
      <span className={"qrow-age age-" + age.tone} title={since ? new Date(since).toLocaleString("en-GB") : ""}>
        {age.tone === "late" && <Icon name="clock" size={13} />}
        {age.text}
      </span>
      <button type="button" className="qrow-main" onClick={onOpen} disabled={!onOpen}
              aria-label={onOpen ? String(title || "Open queue item") : undefined}>
        <span className="qrow-t">{title}</span>
        {meta && <span className="qrow-m">{meta}</span>}
      </button>
      {amount && <span className="qrow-amt">{amount}</span>}
      {actions && <span className="qrow-act">{actions}</span>}
    </div>);
}

// Oldest first, always. A queue sorted any other way hides the problem.
export function byOldest(rows, key = "since") {
  return [...rows].sort((a, b) => new Date(a[key] || 0) - new Date(b[key] || 0));
}
