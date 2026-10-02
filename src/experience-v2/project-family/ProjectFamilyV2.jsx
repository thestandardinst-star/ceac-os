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


// FPG4 accepted Project/Task gold-standard primitives. Keep visual markup stable unless a new reference is approved.
export function ProjectIssueTable({
  items = [],
  selectedId = null,
  objectiveById = new Map(),
  phaseById = new Map(),
  onSelect,
  formatDue,
  renderStatus,
}) {
  return (
    <div className="fpg-work-table-wrap">
      <table className="fpg-work-table">
        <thead>
          <tr>
            <th scope="col">Done</th>
            <th scope="col">Issue</th>
            <th scope="col">Date</th>
            <th scope="col">Tags</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const done = ["completed", "self_certified"].includes(item.status);
            const objective = objectiveById.get(item.objective_id);
            const phase = phaseById.get(item.phase_id);
            return (
              <tr
                key={item.id}
                className={selectedId === item.id ? "is-selected" : ""}
                onClick={() => onSelect?.(item.id)}
              >
                <td className="fpg-done-cell">
                  <span
                    className={done ? "fpg-readonly-check is-done" : "fpg-readonly-check"}
                    aria-label={done ? "Completed" : "Not completed"}
                  >
                    {done ? "✓" : ""}
                  </span>
                </td>
                <td>
                  <button
                    type="button"
                    className="fpg-work-title"
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelect?.(item.id);
                    }}
                  >
                    <span>
                      <strong>{item.title}</strong>
                      <small>{item.ref} · {item.profiles?.full_name || "Unassigned"}</small>
                    </span>
                  </button>
                </td>
                <td>{formatDue?.(item.due_at)}</td>
                <td>
                  <div className="fpg-tag-stack">
                    {renderStatus?.(item.status)}
                    {phase && <span className="fpg-context-tag">{phase.name}</span>}
                    {objective && <span className="fpg-context-tag">{objective.ref}</span>}
                  </div>
                </td>
              </tr>
            );
          })}
          {!items.length && (
            <tr>
              <td colSpan="4">
                <div className="fpg-table-empty">No project work matches this view.</div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function ProjectWorkDrawer({
  item,
  projectName,
  description,
  onClose,
  onOpen,
  formatDue,
  formatDate,
  renderStatus,
}) {
  if (!item) return null;
  const evidenceCount = (item.submissions || []).reduce(
    (sum, row) => sum + (row.submission_files?.length || 0),
    0,
  );
  return (
    <div className="fpg-work-drawer-bg" role="presentation" onClick={onClose}>
      <aside
        className="fpg-work-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={item.title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="fpg-drawer-top">
          <button type="button" className="fpg-drawer-close" aria-label="Close work preview" onClick={onClose}>×</button>
          <button type="button" className="fpg-drawer-open" onClick={() => onOpen?.(item.id)}>Open full record ↗</button>
        </div>
        <div className="fpg-drawer-title"><span>{item.ref}</span><h2>{item.title}</h2></div>
        <dl className="fpg-drawer-meta">
          <div><dt>Status</dt><dd>{renderStatus?.(item.status)}</dd></div>
          <div><dt>Assignee</dt><dd>{item.profiles?.full_name || "Unassigned"}</dd></div>
          <div><dt>Created context</dt><dd>{projectName}</dd></div>
          <div><dt>Due date</dt><dd>{formatDue?.(item.due_at)}</dd></div>
          <div><dt>Type</dt><dd>{item.kind?.replaceAll("_", " ") || "Work"}</dd></div>
        </dl>
        {description && <section className="fpg-drawer-description"><p>{description}</p></section>}
        <section className="fpg-drawer-section">
          <div className="fpg-drawer-section-head"><h3>Evidence</h3><span>{evidenceCount}</span></div>
          {(item.submissions || []).length
            ? item.submissions.map((submission) => (
              <div className="fpg-evidence-row" key={submission.id}>
                <span>
                  <strong>Submission</strong>
                  <small>{submission.submitted_at ? formatDate?.(submission.submitted_at) : "Date not recorded"}</small>
                </span>
                <b>{submission.submission_files?.length || 0} file{(submission.submission_files?.length || 0) === 1 ? "" : "s"}</b>
              </div>
            ))
            : <p className="fpg-drawer-empty">No submission or evidence is recorded.</p>}
        </section>
        <section className="fpg-drawer-section">
          <div className="fpg-drawer-tabs">
            <button type="button" className="is-active">Subtasks</button>
            <button type="button" disabled title="Project discussion remains in the Project Room">Comments</button>
            <button type="button" disabled title="Open the full record for authoritative activity history">Activity</button>
          </div>
          {(item.checklist_items || []).length
            ? <div className="fpg-subtask-list">
              {[...(item.checklist_items || [])]
                .sort((a, b) => a.position - b.position)
                .map((step) => <div key={step.id}><i aria-hidden="true" /><span>{step.label}</span></div>)}
            </div>
            : <p className="fpg-drawer-empty">No checklist steps are recorded for this work item.</p>}
        </section>
      </aside>
    </div>
  );
}
