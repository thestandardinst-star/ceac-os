import { CeacIcon } from "../icons";
import { Button, StatusBadge } from "../components";

const STATUS_META = {
  not_started: ["Not started", "neutral"],
  in_progress: ["In progress", "action"],
  waiting_on: ["Waiting", "warning"],
  returned: ["Returned", "warning"],
  in_review: ["In review", "action"],
  completed: ["Completed", "success"],
  self_certified: ["Completed", "success"],
  cancelled: ["Cancelled", "neutral"],
};

const KIND_ICONS = {
  task: "task",
  routine: "refresh",
  case: "folder",
  request: "messages",
  decision: "checkCircle",
  meeting_outcome: "meeting",
  deliverable: "file",
};

export function workKindLabel(kind = "work") {
  return String(kind || "work").replaceAll("_", " ");
}

export function WorkStateBadge({ status }) {
  const [label, tone] = STATUS_META[status] || [workKindLabel(status || "Open"), "neutral"];
  return <StatusBadge tone={tone} icon={false}>{label}</StatusBadge>;
}

export function WorkPageHeader({
  eyebrow,
  title = "Work",
  description,
  actionLabel,
  onAction,
  actionIcon = "create",
}) {
  return (
    <header className="ev2w-header">
      <div className="ev2w-header-copy">
        {eyebrow ? <span className="ev2w-eyebrow">{eyebrow}</span> : null}
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {actionLabel ? (
        <Button className="ev2w-header-action" icon={actionIcon} onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </header>
  );
}

export function WorkTabs({ items, value, onChange, ariaLabel, compact = false }) {
  return (
    <div className={`ev2w-tabs ${compact ? "ev2w-tabs-compact" : ""}`} role="tablist" aria-label={ariaLabel}>
      {items.map((item) => {
        const key = Array.isArray(item) ? item[0] : item.value;
        const label = Array.isArray(item) ? item[1] : item.label;
        const count = Array.isArray(item) ? item[2] : item.count;
        const selected = key === value;
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={selected}
            className={selected ? "is-selected" : ""}
            onClick={() => onChange(key)}
          >
            <span>{label}</span>
            {Number.isFinite(count) ? <b aria-label={`${count} items`}>{count}</b> : null}
          </button>
        );
      })}
    </div>
  );
}

export function WorkActionStrip({ actions = [] }) {
  if (!actions.length) return null;
  return (
    <div className="ev2w-actions" aria-label="Work actions">
      {actions.map((action, index) => (
        <Button
          key={action.label}
          variant={index === 0 ? "primary" : "secondary"}
          size="compact"
          icon={action.icon}
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      ))}
    </div>
  );
}

export function WorkToolbar({ children }) {
  return <div className="ev2w-toolbar">{children}</div>;
}

export function WorkGroup({ title, count, children }) {
  return (
    <section className="ev2w-group">
      <div className="ev2w-group-head">
        <strong>{title}</strong>
        {Number.isFinite(count) ? <span>{count}</span> : null}
      </div>
      <div className="ev2w-list">{children}</div>
    </section>
  );
}

export function WorkRow({
  title,
  refCode,
  kind,
  context,
  owner,
  due,
  status,
  note,
  attention = false,
  onClick,
  icon,
}) {
  return (
    <button
      type="button"
      className={`ev2w-row ${attention ? "is-attention" : ""}`}
      onClick={onClick}
    >
      <span className="ev2w-row-icon">
        <CeacIcon name={icon || KIND_ICONS[kind] || "work"} size="row" decorative />
      </span>
      <span className="ev2w-row-main">
        <strong>{title}</strong>
        <span className="ev2w-row-meta">
          {[refCode, kind ? workKindLabel(kind) : null, context].filter(Boolean).join(" · ")}
        </span>
        {note ? <small>{note}</small> : null}
      </span>
      <span className="ev2w-row-context">
        {owner ? <span>{owner}</span> : null}
        {due ? <small>{due}</small> : null}
      </span>
      <span className="ev2w-row-state">
        <WorkStateBadge status={status} />
        <CeacIcon name="chevronRight" size="meta" decorative />
      </span>
    </button>
  );
}

export function WorkReviewRow({
  title,
  person,
  context,
  submitted,
  note,
  onClick,
}) {
  return (
    <button type="button" className="ev2w-row ev2w-review-row" onClick={onClick}>
      <span className="ev2w-row-icon ev2w-review-icon">
        <CeacIcon name="checkCircle" size="row" decorative />
      </span>
      <span className="ev2w-row-main">
        <strong>{title}</strong>
        <span className="ev2w-row-meta">
          {[person, context, submitted].filter(Boolean).join(" · ")}
        </span>
        {note ? <small>{note}</small> : null}
      </span>
      <span className="ev2w-row-context"><span>Review submitted work</span></span>
      <span className="ev2w-row-state">
        <WorkStateBadge status="in_review" />
        <CeacIcon name="chevronRight" size="meta" decorative />
      </span>
    </button>
  );
}

export function WorkEmpty({ title, description, actionLabel, onAction }) {
  return (
    <div className="ev2w-empty">
      <span className="ev2w-empty-icon"><CeacIcon name="work" size="feature" decorative /></span>
      <div>
        <strong>{title}</strong>
        {description ? <p>{description}</p> : null}
      </div>
      {actionLabel ? <Button variant="secondary" size="compact" onClick={onAction}>{actionLabel}</Button> : null}
    </div>
  );
}

export function WorkFootnote({ children }) {
  return <p className="ev2w-footnote">{children}</p>;
}
