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
  if (name === "projects" || name === "admin-projects" || name === "delivery") return <svg {...props}><path d="M3 7h7l2 2h9v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M3 7V5a2 2 0 0 1 2-2h5l2 2h5a2 2 0 0 1 2 2v2" /></svg>;
  if (name === "calendar" || name === "admin-calendar") return <svg {...props}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4M17 3v4M3 10h18" /><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" /></svg>;
  if (name === "manager-finance" || name === "finance") return <svg {...props}><path d="M4 20V9M9 20V4M14 20v-7M19 20V7" /><path d="M2 20h20" /></svg>;
  if (name === "manager-reports" || name === "reports" || name === "strategy") return <svg {...props}><path d="M5 3h14v18H5z" /><path d="M9 8h6M9 12h6M9 16h4" /></svg>;
  if (name === "more") return <svg {...props}><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" /></svg>;
  if (name === "announcements") return <svg {...props}><path d="M3 11v2l12 4V7z" /><path d="M15 9l5-2v10l-5-2" /><path d="M6 14l1 6h4l-2-5" /></svg>;
  if (name === "people") return <svg {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M17 11h5M19.5 8.5v5" /></svg>;
  if (name === "units") return <svg {...props}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>;
  if (name === "attendance") return <svg {...props}><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></svg>;
  if (name === "reporting") return <svg {...props}><path d="M5 3h14v18H5z" /><path d="M9 16v-4M12 16V8M15 16v-6" /></svg>;
  if (name === "cost") return <svg {...props}><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" /><path d="M9 8h6M9 12h6M9 16h4" /></svg>;
  if (name === "audit" || name === "authority" || name === "events" || name === "workflows" || name === "policies" || name === "protected-hr") return <svg {...props}><path d="M5 4h14v16H5z" /><path d="M8 8h8M8 12h8M8 16h5" /></svg>;
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

export function LoadingState({ label = "Loading…" }) {
  return <div className="loading-state" role="status" aria-live="polite">
    <span className="loading-state-dot" aria-hidden="true" />
    <span>{label}</span>
  </div>;
}

export function Avatar({ name = "", src = null, size = "md" }) {
  const initials = String(name || "?").trim().split(/\s+/).filter(Boolean).slice(0,2).map((part) => part[0]?.toUpperCase()).join("") || "?";
  return <span className={`avatar avatar-${size}`} aria-hidden="true">
    {src ? <img src={src} alt="" /> : initials}
  </span>;
}

export function StatusDistribution({ segments = [], label = "Status distribution" }) {
  const safe = segments.filter((segment) => Number(segment.value) > 0);
  const total = safe.reduce((sum, segment) => sum + Number(segment.value || 0), 0);
  return <div className="status-distribution" aria-label={label}>
    <div className="status-distribution-track">
      {total > 0 ? safe.map((segment) => <span
        key={segment.key || segment.label}
        className={`status-distribution-segment tone-${segment.tone || "neutral"}`}
        style={{ width:`${(Number(segment.value) / total) * 100}%` }}
        title={`${segment.label}: ${segment.value}`}
      />) : <span className="status-distribution-empty" />}
    </div>
    <div className="status-distribution-legend">
      {segments.map((segment) => <span key={segment.key || segment.label}><i className={`tone-${segment.tone || "neutral"}`} />{segment.label}<b>{segment.value}</b></span>)}
    </div>
  </div>;
}

export function ProgressMeter({ value = 0, max = 0, label, detail }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (Number(value) / Number(max)) * 100)) : 0;
  return <div className="progress-meter">
    <div className="progress-meter-head"><strong>{label}</strong>{detail && <span>{detail}</span>}</div>
    <div className="progress-meter-track"><span style={{ width:`${pct}%` }} /></div>
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
  if (isManager) return [["home","Home"],["work","My work"],["team","Team"],["projects","Projects"],["calendar","Calendar"],["strategy","Strategy"],["delivery","Delivery"],["manager-finance","Finance"],["manager-reports","Reports"],["me","Me"]];
  return [["home","Home"],["work","Work"],["team","Team"],["strategy","Strategy"],["me","Me"]];
}

function desktopGroups({ isAdmin, isExec, isManager, canPeople = false, canProtectedHR = false, canAudit = false, canAuthority = false, canWorkflows = false, canIntegrations = false }) {
  if (isExec) return [
    { label:"Ministry", items:[["home","Home"],["strategy","Strategy"],["delivery","Delivery"]] },
    { label:"Communication", items:[["announcements","Announcements"]] },
    { label:"Personal", items:[["me","Me"]] },
  ];
  if (isAdmin) return [
    { label:"Organisation", items:[["home","Home"],["strategy","Strategy"],["delivery","Delivery"],["units","Units"],["admin-projects","Projects"],["admin-calendar","Calendar"]] },
    { label:"People", items:[...(canPeople ? [["people","People"],["lifecycle","Employee lifecycle"]] : []),...(canProtectedHR ? [["protected-hr","Protected HR"]] : []),["attendance","Attendance"]] },
    { label:"Insight", items:[["reporting","Reports"],["finance","Finance"],["cost","Cost"]] },
    { label:"Communication", items:[["announcements","Announcements"]] },
    { label:"System", items:[...(canAudit ? [["audit","Audit"],["events","Events"]] : []),...(canWorkflows ? [["workflows","Workflows"]] : []),...(canAuthority ? [["authority","Authority"],["policies","Policies & rules"]] : []),...(canIntegrations ? [["integrations","Integrations"]] : []),["settings","Settings"],["me","Me"]] },
  ];
  if (isManager) return [
    { label:"Your unit", items:[["home","Home"],["work","My work"],["team","Team"],["strategy","Strategy"],["delivery","Delivery"],["projects","Projects"],["calendar","Calendar"]] },
    { label:"Insight", items:[["manager-finance","Finance"],["manager-reports","Reports"]] },
    { label:"Personal", items:[["me","Me"]] },
  ];
  return [{ label:null, items:tabItems(false) }];
}

export function AppTopBar({ me, roleLabel, tab, onProfile }) {
  const titleMap = {
    home: roleLabel === "Administration" ? "Organisation" : roleLabel === "Group Pastor" ? "Ministry" : "Workspace",
    units:"Units", people:"People", lifecycle:"Employee lifecycle", "protected-hr":"Protected HR", attendance:"Attendance & leave", reporting:"Reports",
    finance:"Finance", cost:"Cost", strategy:"Strategy", delivery:"Delivery", announcements:"Announcements", audit:"Audit", events:"System events", workflows:"Workflows", authority:"Authority", policies:"Policies & rules", integrations:"Integrations", settings:"Settings", "admin-projects":"Projects", "admin-calendar":"Calendar",
    work:"Work", team:"Team", projects:"Projects", calendar:"Calendar",
    "manager-finance":"Finance", "manager-reports":"Reports", record:"My work history", me:"Me",
  };
  const section = titleMap[tab] || "Workspace";
  const initial = (me?.full_name || "C").trim().charAt(0).toUpperCase();
  return <header className="desktop-topbar" aria-label="Workspace context">
    <div className="desktop-topbar-context">
      <span>{roleLabel}</span>
      <b aria-hidden="true">/</b>
      <strong>{section}</strong>
    </div>
    <div className="desktop-topbar-actions">
      <button type="button" className="desktop-profile" onClick={onProfile} aria-label={`Open ${me?.full_name || "your"} workspace`}>
        <span className="desktop-profile-avatar" aria-hidden="true">{initial}</span>
        <span className="desktop-profile-copy"><strong>{me?.full_name || "Account"}</strong><small>{me?.unit_name || roleLabel}</small></span>
      </button>
    </div>
  </header>;
}

export function SideNav({ tab, setTab, me, isAdmin, isExec, isManager, onUnitChange }) {
  const label = me.is_exec ? "Group Pastor" : me.is_admin ? "Administration & HR" : (me.unit_name || "—");
  const capabilities = me.capabilities || [];
  const groups = desktopGroups({
    isAdmin, isExec, isManager,
    canPeople: capabilities.includes("people.manage"),
    canProtectedHR: capabilities.includes("hr_private.access"),
    canAudit: capabilities.includes("audit.view"),
    canAuthority: capabilities.includes("authority.manage"),
    canWorkflows: capabilities.includes("audit.view") || capabilities.includes("people.manage") || capabilities.includes("authority.manage"),
    canIntegrations: capabilities.includes("integration.manage"),
  });
  return (
    <aside className="side">
      <div className="brand"><span className="brand-mark">C</span><span className="brand-copy"><strong>CEAC OS</strong><small>{label}</small></span></div>
      {!isAdmin && (me.memberships?.length || 0) > 1 && <select
        className="side-unit-switch"
        aria-label="Current unit"
        value={me.unit_id || ""}
        onChange={(event) => onUnitChange?.(event.target.value)}>
        {me.memberships.map((membership) => <option key={membership.unit_id} value={membership.unit_id}>
          {membership.unit_name || "Unit"} · {membership.role === "manager" ? "Manager" : "Staff"}
        </option>)}
      </select>}
      <nav aria-label="Primary navigation">
        {groups.map((group, index) => <div className="side-nav-group" key={group.label || index}>
          {group.label && <div className="side-nav-label">{group.label}</div>}
          {group.items.map(([k, l]) => (
            <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>
              <Icon name={k} size={17} />
              <span>{l}</span>
            </button>))}
        </div>)}
      </nav>
      <div className="who"><span>{me.full_name}</span><small>Signed in</small></div>
    </aside>);
}

function MobileMenuGroup({ label, items, tab, setTab, close }) {
  return <section className="mobile-more-group">
    <div className="mobile-more-label">{label}</div>
    {items.map(([key, name]) => <button role="menuitem" key={key} className={"mobile-more-item " + (tab === key ? "on" : "")} onClick={() => { close(); setTab(key); }}>
      <Icon name={key} size={17} />
      <span>{name}</span>
    </button>)}
  </section>;
}

export function Tabs({ tab, setTab, isManager, isExec = false, isAdmin = false, me = null }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const managerGroups = [
    { label:"Planning", items:[["strategy","Strategy"],["delivery","Delivery"]] },
    { label:"Schedule", items:[["calendar","Calendar"]] },
    { label:"Insight", items:[["manager-finance","Finance"],["manager-reports","Reports"]] },
    { label:"Personal", items:[["me","Me"]] },
  ];
  const capabilities = me?.capabilities || [];
  const adminGroups = [
    { label:"Organisation", items:[["strategy","Strategy"],["delivery","Delivery"],["units","Units"],["admin-projects","Projects"],["admin-calendar","Calendar"]] },
    { label:"People", items:[...(capabilities.includes("people.manage") ? [["lifecycle","Employee lifecycle"]] : []),...(capabilities.includes("hr_private.access") ? [["protected-hr","Protected HR"]] : [])] },
    { label:"Insight", items:[["cost","Cost"],["finance","Finance"]] },
    { label:"Communication", items:[["announcements","Announcements"]] },
    { label:"System", items:[
      ...(capabilities.includes("audit.view") ? [["audit","Audit"],["events","Events"]] : []),
      ...((capabilities.includes("audit.view") || capabilities.includes("people.manage") || capabilities.includes("authority.manage")) ? [["workflows","Workflows"]] : []),
      ...(capabilities.includes("authority.manage") ? [["authority","Authority"],["policies","Policies & rules"]] : []),
      ...(capabilities.includes("integration.manage") ? [["integrations","Integrations"]] : []),
      ["settings","Settings"],["me","Me"]
    ] },
  ];
  const managerPrimary = [["home","Home"],["work","Work"],["team","Team"],["projects","Projects"],["more","More"]];
  const adminPrimary = [["home","Home"],...(capabilities.includes("people.manage") ? [["people","People"]] : []),["attendance","Attendance"],["reporting","Reports"],["more","More"]];
  const items = isExec
    ? [["home","Home"],["delivery","Delivery"],["announcements","Announcements"],["me","Me"]]
    : isAdmin ? adminPrimary : isManager ? managerPrimary : tabItems(false);
  const moreGroups = isAdmin ? adminGroups : managerGroups;
  const moreKeys = moreGroups.flatMap((group) => group.items.map(([key]) => key));
  const moreActive = (isManager || isAdmin) && moreKeys.includes(tab);
  useEffect(() => { setMoreOpen(false); }, [tab, isManager, isAdmin]);
  return (<>
    {(isManager || isAdmin) && moreOpen && <><button className="menu-bg" aria-label="Close More menu" onClick={() => setMoreOpen(false)} /><div role="menu" className="mobile-more-menu" aria-label={isAdmin ? "More Administration destinations" : "More Manager destinations"}>
      <div className="mobile-more-head"><strong>More</strong><span>{isAdmin ? "Administration" : "Manager"} workspace</span></div>
      {moreGroups.map((group) => <MobileMenuGroup key={group.label} label={group.label} items={group.items} tab={tab} setTab={setTab} close={() => setMoreOpen(false)} />)}
    </div></>}
    <nav className="tabs" aria-label="Mobile navigation">
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
