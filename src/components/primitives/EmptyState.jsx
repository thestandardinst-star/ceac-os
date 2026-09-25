import Icon from "./Icon";

export default function EmptyState({ icon = "check", title, body, action, compact = false }) {
  return (
    <div className={"ceac-empty-state" + (compact ? " compact" : "")}>
      <span className="ceac-empty-icon" aria-hidden="true"><Icon name={icon} size={18} /></span>
      <strong>{title}</strong>
      {body && <p>{body}</p>}
      {action && <div className="ceac-empty-action">{action}</div>}
    </div>
  );
}
