import { CeacIcon } from "../icons";
import { Button, StatusBadge } from "../components";

const PROJECT_STATUS = {
  planned: ["Planned", "neutral"],
  active: ["Active", "success"],
  paused: ["Paused", "warning"],
  closed: ["Closed", "neutral"],
  cancelled: ["Cancelled", "neutral"],
};

const HEALTH = {
  on_track: ["On track", "success"],
  watch: ["Watch", "warning"],
  at_risk: ["At risk", "warning"],
  blocked: ["Blocked", "danger"],
};

export function projectLabel(value = "") {
  return String(value || "").replaceAll("_", " ");
}

export function ProjectStatusBadge({ status }) {
  const [label, tone] = PROJECT_STATUS[status] || [projectLabel(status || "Open"), "neutral"];
  return <StatusBadge tone={tone} icon={false}>{label}</StatusBadge>;
}

export function ProjectHealthBadge({ health }) {
  const [label, tone] = HEALTH[health] || [projectLabel(health || "Not recorded"), "neutral"];
  return <StatusBadge tone={tone} icon={false}>{label}</StatusBadge>;
}

export function ProjectPageHeader({
  eyebrow,
  title,
  description,
  actionLabel,
  onAction,
}) {
  return (
    <header className="ev2p-header">
      <div className="ev2p-header-copy">
        {eyebrow ? <span className="ev2p-eyebrow">{eyebrow}</span> : null}
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {actionLabel ? <Button icon="create" onClick={onAction}>{actionLabel}</Button> : null}
    </header>
  );
}

export function ProjectBackButton({ onClick, label = "Projects" }) {
  return (
    <button type="button" className="ev2p-back" aria-label={`Back to ${label}`} onClick={onClick}>
      <CeacIcon name="chevronLeft" size="control" decorative />
      <span>{label}</span>
    </button>
  );
}

export function ProjectWorkspaceHeader({
  kind,
  status,
  title,
  purpose,
  context,
  onBack,
}) {
  return (
    <>
      <ProjectBackButton onClick={onBack} />
      <header className="ev2p-workspace-header">
        <div className="ev2p-workspace-kicker">
          {[kind ? projectLabel(kind) : null, context].filter(Boolean).join(" · ")}
        </div>
        <div className="ev2p-workspace-title-row">
          <h1>{title}</h1>
          <ProjectStatusBadge status={status} />
        </div>
        <p>{purpose || "No purpose has been recorded."}</p>
      </header>
    </>
  );
}

export function ProjectTabs({ items, value, onChange, ariaLabel = "Project workspace" }) {
  return (
    <nav className="ev2p-tabs" role="tablist" aria-label={ariaLabel}>
      {items.map(([key, label, count]) => (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={value === key}
          className={value === key ? "is-selected" : ""}
          onClick={() => onChange(key)}
        >
          <span>{label}</span>
          {Number.isFinite(count) ? <b>{count}</b> : null}
        </button>
      ))}
    </nav>
  );
}

export function ProjectListRow({
  eyebrow,
  title,
  meta,
  note,
  status,
  health,
  selected = false,
  onClick,
  trailing,
}) {
  return (
    <button
      type="button"
      className={`ev2p-row${selected ? " is-selected" : ""}`}
      aria-pressed={selected || undefined}
      onClick={onClick}
    >
      <span className="ev2p-row-icon"><CeacIcon name="projects" size="row" decorative /></span>
      <span className="ev2p-row-main">
        {eyebrow ? <small>{eyebrow}</small> : null}
        <strong>{title}</strong>
        {meta ? <span>{meta}</span> : null}
        {note ? <span className="ev2p-row-note">{note}</span> : null}
      </span>
      <span className="ev2p-row-state">
        {health ? <ProjectHealthBadge health={health} /> : status ? <ProjectStatusBadge status={status} /> : null}
        {trailing || <CeacIcon name="chevronRight" size="meta" decorative />}
      </span>
    </button>
  );
}


export function ProjectContextRow({
  eyebrow,
  title,
  meta,
  note,
  status,
  health,
  facts = [],
  actions = [],
}) {
  return (
    <article className="ev2p-context-row">
      <span className="ev2p-context-row-icon"><CeacIcon name="projects" size="row" decorative /></span>
      <div className="ev2p-context-row-main">
        {eyebrow ? <small>{eyebrow}</small> : null}
        <strong>{title}</strong>
        {meta ? <span>{meta}</span> : null}
        {note ? <p>{note}</p> : null}
        {facts.length ? <div className="ev2p-context-facts" aria-label={`${title} factual context`}>
          {facts.map((fact) => (
            <span key={fact.label}>
              <b>{fact.value}</b>
              <small>{fact.label}</small>
            </span>
          ))}
        </div> : null}
      </div>
      <div className="ev2p-context-row-state">
        {health ? <ProjectHealthBadge health={health} /> : status ? <ProjectStatusBadge status={status} /> : null}
        {actions.length ? <div className="ev2p-context-actions">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant="secondary"
              size="compact"
              onClick={action.onClick}
              disabled={action.disabled}
            >
              {action.label}
            </Button>
          ))}
        </div> : null}
      </div>
    </article>
  );
}

export function ProjectAttentionCard({
  eyebrow,
  title,
  meta,
  description,
  actions = [],
}) {
  return (
    <article className="ev2p-attention">
      <div className="ev2p-attention-copy">
        {eyebrow ? <span>{eyebrow}</span> : null}
        <strong>{title}</strong>
        {meta ? <small>{meta}</small> : null}
        {description ? <p>{description}</p> : null}
      </div>
      {actions.length ? <div className="ev2p-attention-actions">
        {actions.map((action, index) => (
          <Button
            key={action.label}
            variant={index === actions.length - 1 ? "primary" : "secondary"}
            size="compact"
            onClick={action.onClick}
            disabled={action.disabled}
          >
            {action.label}
          </Button>
        ))}
      </div> : null}
    </article>
  );
}

export function ProjectSectionHeader({ eyebrow, title, count, actionLabel, onAction, action = null }) {
  return (
    <div className="ev2p-section-head">
      <div>
        {eyebrow ? <span>{eyebrow}</span> : null}
        <h2>{title}</h2>
      </div>
      <div className="ev2p-section-actions">
        {Number.isFinite(count) ? <b>{count}</b> : null}
        {actionLabel ? <Button variant="secondary" size="compact" onClick={onAction}>{actionLabel}</Button> : null}
        {action}
      </div>
    </div>
  );
}

export function ProjectSummary({ items }) {
  return (
    <div className="ev2p-summary">
      {items.map((item) => (
        <div key={item.label}>
          <strong>{item.value}</strong>
          <span>{item.label}</span>
          {item.detail ? <small>{item.detail}</small> : null}
        </div>
      ))}
    </div>
  );
}

export function ProjectEmpty({ title, description }) {
  return (
    <div className="ev2p-empty">
      <span><CeacIcon name="projects" size="feature" decorative /></span>
      <div>
        <strong>{title}</strong>
        {description ? <p>{description}</p> : null}
      </div>
    </div>
  );
}
