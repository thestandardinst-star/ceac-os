import { useEffect, useRef, useState } from "react";


export function Icon({ name, size = 18, strokeWidth = 1.8, className = "" }) {
  const props = {
    width: size, height: size, viewBox: "0 0 24 24", fill: "none",
    stroke: "currentColor", strokeWidth, strokeLinecap: "round", strokeLinejoin: "round",
    className: `ui-icon ${className}`, "aria-hidden": "true",
  };
  if (name === "home") return <svg {...props}><path d="M3 10.5 12 3l9 7.5" /><path d="M5.5 9.5V21h13V9.5" /><path d="M9.5 21v-6h5v6" /></svg>;
  if (name === "work") return <svg {...props}><rect x="3" y="6.5" width="18" height="13" rx="2" /><path d="M8 6.5V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1.5" /><path d="M3 11.5h18" /><path d="M10 11.5v2h4v-2" /></svg>;
  if (name === "team") return <svg {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
  if (name === "record") return <svg {...props}><path d="M6 3h9l3 3v15H6z" /><path d="M14 3v4h4" /><path d="M9 11h6M9 15h6M9 19h4" /></svg>;
  if (name === "me") return <svg {...props}><circle cx="12" cy="8" r="4" /><path d="M4.5 21a7.5 7.5 0 0 1 15 0" /></svg>;
  if (name === "projects") return <svg {...props}><path d="M3 7h7l2 2h9v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M3 7V5a2 2 0 0 1 2-2h5l2 2h5a2 2 0 0 1 2 2v2" /></svg>;
  if (name === "calendar") return <svg {...props}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4M17 3v4M3 10h18" /><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" /></svg>;
  if (name === "manager-finance" || name === "finance") return <svg {...props}><path d="M4 20V9M9 20V4M14 20v-7M19 20V7" /><path d="M2 20h20" /></svg>;
  if (name === "manager-reports" || name === "reports") return <svg {...props}><path d="M5 3h14v18H5z" /><path d="M9 8h6M9 12h6M9 16h4" /></svg>;
  if (name === "more") return <svg {...props}><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" /></svg>;
  if (name === "announcements") return <svg {...props}><path d="M3 11v2l12 4V7z" /><path d="M15 9l5-2v10l-5-2" /><path d="M6 14l1 6h4l-2-5" /></svg>;
  if (name === "people") return <svg {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M17 11h5M19.5 8.5v5" /></svg>;
  if (name === "units") return <svg {...props}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>;
  if (name === "attendance") return <svg {...props}><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></svg>;
  if (name === "reporting") return <svg {...props}><path d="M5 3h14v18H5z" /><path d="M9 16v-4M12 16V8M15 16v-6" /></svg>;
  if (name === "cost") return <svg {...props}><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" /><path d="M9 8h6M9 12h6M9 16h4" /></svg>;
  if (name === "settings") return <svg {...props}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1V21H9.6v-.09a1.7 1.7 0 0 0-1.4-1.67 1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 3.8 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1-.4H2V9.6h.09A1.7 1.7 0 0 0 3.76 8.2a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 8.2 3.8a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1V2h4v.09A1.7 1.7 0 0 0 15 3.76a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 8.2a1.7 1.7 0 0 0 .6 1 1.7 1.7 0 0 0 1 .4H21v4h-.09A1.7 1.7 0 0 0 19.4 15z" /></svg>;
  return <svg {...props}><circle cx="12" cy="12" r="2" /></svg>;
}
export function MobileTopBar({ me, roleLabel = "Staff", onProfile }) {
  const initial = (me?.full_name || "C").trim().charAt(0).toUpperCase();
  return <header className="mobile-topbar" aria-label="CEAC OS">
    <div className="mobile-topbar-brand">
      <span className="mobile-topbar-mark" aria-hidden="true">C</span>
      <span className="mobile-topbar-copy">
        <strong>CEAC OS</strong>
        <small>{me?.unit_name || "Airport City"} · {roleLabel}</small>
      </span>
    </div>
    <button className="mobile-topbar-person" type="button" onClick={onProfile} aria-label={`Open ${me?.full_name || "your"} workspace`}>
      <span>{initial}</span>
    </button>
  </header>;
}

export function Pill({ tone, children }) {
  return <span className={"pill p-" + tone}>{children}</span>;
}

export function FieldGroup({ label, hint, children, className = "" }) {
  return <label className={`field-group ${className}`.trim()}>
    <span className="field-label">{label}</span>
    {children}
    {hint && <span className="field-hint">{hint}</span>}
  </label>;
}

export function ProductNotice({ tone = "info", title, children, action = null }) {
  return <div className={`product-notice product-notice-${tone}`} role={tone === "error" ? "alert" : "status"}>
    {title && <strong>{title}</strong>}
    {children && <span>{children}</span>}
    {action}
  </div>;
}

export function EmptyState({ title, children, action = null, compact = false }) {
  return <div className={`empty-state ${compact ? "compact" : ""}`}>
    <strong>{title}</strong>
    {children && <span>{children}</span>}
    {action}
  </div>;
}

export function SectionHeader({ eyebrow, title, count, action = null }) {
  return <div className="section-header">
    <div>{eyebrow && <span>{eyebrow}</span>}<h2>{title}</h2></div>
    <div className="section-header-actions">{count !== undefined && count !== null && <b>{count}</b>}{action}</div>
  </div>;
}
export function statusPill(status) {
  if (status === "in_progress") return <Pill tone="green">In progress</Pill>;
  if (status === "in_review") return <Pill tone="amber">In review</Pill>;
  if (status === "waiting_on") return <Pill tone="amber">Waiting on</Pill>;
  if (status === "returned") return <Pill tone="brick">Sent back</Pill>;
  if (status === "completed") return <Pill tone="green">Completed</Pill>;
  if (status === "self_certified") return <Pill tone="green">Self-certified</Pill>;
  return <Pill tone="grey">Not started</Pill>;
}
function tabItems(isManager = false) {
  if (isManager) return [["home","Home"],["work","My work"],["team","Team"],["projects","Projects"],["calendar","Calendar"],["manager-finance","Finance"],["manager-reports","Reports"],["me","Me"]];
  return [["home","Home"],["work","Work"],["team","Team"],["record","Record"],["me","Me"]];
}
export function SideNav({ tab, setTab, me, isAdmin, isExec, isManager, onUnitChange }) {
  const label = me.is_exec ? "Group Pastor" : me.is_admin ? "Administration" : (me.unit_name || "—");
  const items = isExec ? [["home","Home"],["announcements","Announcements"],["me","Me"]] : tabItems(isManager);
  const operatingSurface = !isAdmin && !isExec;
  if (isAdmin) { items.splice(1, 0, ["announcements","Announcements"], ["units","Units"], ["people","People"], ["attendance","Attendance"], ["cost","Cost"], ["finance","Finance"], ["reporting","Reporting"]); items.push(["settings","Settings"]); }
  return (
    <aside className="side">
      <div className="brand">CEAC<span>{label}</span></div>
      {!isAdmin && (me.memberships?.length || 0) > 1 && <select
        aria-label="Current unit"
        value={me.unit_id || ""}
        onChange={(event) => onUnitChange?.(event.target.value)}
        style={{ width: "100%", margin: "10px 0 14px", fontSize: 12.5, padding: "7px 8px", border: "1px solid var(--line)", borderRadius: 6, background: "var(--card)", color: "var(--ink)" }}>
        {me.memberships.map((membership) => <option key={membership.unit_id} value={membership.unit_id}>
          {membership.unit_name || "Unit"} · {membership.role === "manager" ? "Manager" : "Staff"}
        </option>)}
      </select>}
      <nav>
        {items.map(([k, l]) => (
          <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>
            <Icon name={k} size={17} />
            <span>{l}</span>
          </button>))}
      </nav>
      <div className="who">{me.full_name}</div>
    </aside>);
}
export function Tabs({ tab, setTab, isManager, isExec = false, isAdmin = false }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const managerMore = [["calendar","Calendar"],["manager-finance","Finance"],["manager-reports","Reports"],["me","Me"]];
  const managerPrimary = [["home","Home"],["work","Work"],["team","Team"],["projects","Projects"],["more","More"]];
  const adminMore = [["announcements","Announcements"],["units","Units"],["cost","Cost"],["finance","Finance"],["settings","Settings"],["me","Me"]];
  const adminPrimary = [["home","Home"],["people","People"],["attendance","Attendance"],["reporting","Reports"],["more","More"]];
  const items = isExec
    ? [["home","Home"],["announcements","Announcements"],["me","Me"]]
    : isAdmin ? adminPrimary : isManager ? managerPrimary : tabItems(false);
  const moreItems = isAdmin ? adminMore : managerMore;
  const moreActive = (isManager || isAdmin) && moreItems.some(([key]) => key === tab);
  useEffect(() => { setMoreOpen(false); }, [tab, isManager, isAdmin]);
  return (<>
    {(isManager || isAdmin) && moreOpen && <><button className="menu-bg" aria-label="Close More menu" onClick={() => setMoreOpen(false)} /><div role="menu" className="mobile-more-menu" aria-label={isAdmin ? "More Administration destinations" : "More Manager destinations"}>
      {moreItems.map(([key, label]) => <button role="menuitem" key={key} className="mobile-more-item" onClick={() => { setMoreOpen(false); setTab(key); }}>
        <Icon name={key} size={17} />
        <span>{label}</span>
      </button>)}
    </div></>}
    <nav className="tabs">
      {items.map(([k, label]) => {
        const active = k === "more" ? moreActive || moreOpen : tab === k;
        return <button key={k} className={"tab " + (active ? "on" : "")} onClick={() => {
          if (k === "more") setMoreOpen((value) => !value);
          else { setMoreOpen(false); setTab(k); }
        }} aria-haspopup={k === "more" ? "menu" : undefined} aria-expanded={k === "more" ? moreOpen : undefined}>
          <Icon name={k} size={18} /> <span>{label}</span>
        </button>;
      })}
    </nav>
  </>);
}
export function Sheet({ children, onClose }) {
  const dialogRef = useRef(null);
  useEffect(() => {
    const previousFocus = document.activeElement;
    dialogRef.current?.focus();
    function onKeyDown(event) {
      if (event.key === "Escape") { onClose?.(); return; }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = [...dialogRef.current.querySelectorAll("button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), a[href], [tabindex]:not([tabindex='-1'])")];
      if (!focusable.length) { event.preventDefault(); return; }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => { document.removeEventListener("keydown", onKeyDown); previousFocus?.focus?.(); };
  }, [onClose]);
  return (<><div className="sheet-bg" onClick={onClose} /><div ref={dialogRef} className="sheet" role="dialog" aria-modal="true" tabIndex={-1}>
    <button className="sheet-close" aria-label="Close dialog" onClick={onClose}>×</button>{children}
  </div></>);
}
