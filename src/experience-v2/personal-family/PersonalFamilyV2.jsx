import { SegmentedControl, StatusBadge } from "../components";

export function PersonalPageHeader({ eyebrow, title = "My Hub", description, statusLabel = "Personal workspace" }) {
  return (
    <header className="ev2pf-header">
      <div className="ev2pf-header-copy">
        {eyebrow ? <span className="ev2pf-eyebrow">{eyebrow}</span> : null}
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {statusLabel ? <StatusBadge tone="neutral" icon={false}>{statusLabel}</StatusBadge> : null}
    </header>
  );
}

export function PersonalDestinationGrid({ children }) {
  return <div className="ev2pf-destinations">{children}</div>;
}

export function PersonalDestinationCard({ title, description, onClick, ariaLabel }) {
  return (
    <button type="button" className="ev2pf-destination" aria-label={ariaLabel || title} onClick={onClick}>
      <span>
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
      <b aria-hidden="true">→</b>
    </button>
  );
}

export function PersonalTabs({ value, onChange }) {
  return (
    <SegmentedControl
      className="ev2pf-tabs"
      ariaLabel="My Hub sections"
      value={value}
      onChange={onChange}
      items={[
        { value: "goals", label: "Goals" },
        { value: "leave", label: "Leave" },
        { value: "personal", label: "Personal" },
      ]}
    />
  );
}

export function PersonalSection({ eyebrow, title, description, action, children, className = "" }) {
  return (
    <section className={`ev2pf-section ${className}`.trim()}>
      <div className="ev2pf-section-head">
        <div>
          {eyebrow ? <span className="ev2pf-eyebrow">{eyebrow}</span> : null}
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
        {action ? <div className="ev2pf-section-action">{action}</div> : null}
      </div>
      <div className="ev2pf-section-body">{children}</div>
    </section>
  );
}

export function PersonalRecordRow({ title, meta, detail, action, onClick, className = "" }) {
  const Tag = onClick ? "button" : "article";
  return (
    <Tag type={onClick ? "button" : undefined} className={`ev2pf-row ${onClick ? "is-action" : ""} ${className}`.trim()} onClick={onClick}>
      <span className="ev2pf-row-copy">
        <strong>{title}</strong>
        {meta ? <span>{meta}</span> : null}
        {detail ? <small>{detail}</small> : null}
      </span>
      {action ? <span className="ev2pf-row-action">{action}</span> : null}
      {onClick ? <b className="ev2pf-row-arrow" aria-hidden="true">→</b> : null}
    </Tag>
  );
}

export function PersonalEmpty({ title, description }) {
  return (
    <div className="ev2pf-empty">
      <strong>{title}</strong>
      {description ? <span>{description}</span> : null}
    </div>
  );
}

export function PersonalFact({ value, label }) {
  return (
    <div className="ev2pf-fact">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

export function PersonalDetailGrid({ items = [] }) {
  return (
    <div className="ev2pf-details">
      {items.filter((item) => item && item.value !== undefined && item.value !== null).map((item) => (
        <div key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  );
}

export function PersonalBoundary({ title, children }) {
  return (
    <div className="ev2pf-boundary">
      <strong>{title}</strong>
      <span>{children}</span>
    </div>
  );
}
