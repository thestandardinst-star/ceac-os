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
  return <svg {...props}><circle cx="12" cy="12" r="2" /></svg>;
}
export function Pill({ tone, children }) {
  return <span className={"pill p-" + tone}>{children}</span>;
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
  const staffSurface = !isAdmin && !isExec && !isManager;
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
            {staffSurface && <Icon name={k} size={17} />}
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
  const items = isExec ? [["home","Home"],["announcements","Announcements"],["me","Me"]] : (isManager ? managerPrimary : tabItems(false));
  const moreActive = isManager && managerMore.some(([key]) => key === tab);
  const staffSurface = !isAdmin && !isExec && !isManager;
  useEffect(() => { setMoreOpen(false); }, [tab, isManager]);
  return (<>
    {isManager && moreOpen && <><button className="menu-bg" aria-label="Close More menu" onClick={() => setMoreOpen(false)} /><div role="menu" aria-label="More Manager destinations" style={{
      position: "fixed", left: 12, right: 12, bottom: "calc(72px + env(safe-area-inset-bottom))",
      maxWidth: 496, margin: "0 auto", background: "var(--card)", border: "1px solid var(--line)",
      borderRadius: 10, padding: 8, zIndex: 12, boxShadow: "0 8px 28px rgba(0,0,0,.12)"
    }}>
      {managerMore.map(([key, label]) => <button role="menuitem" key={key} className="row" style={{ width: "100%", textAlign: "left" }} onClick={() => { setMoreOpen(false); setTab(key); }}>
        <div className="row-t">{label}</div>
      </button>)}
    </div></>}
    <nav className="tabs">
      {items.map(([k, label]) => {
        const active = k === "more" ? moreActive || moreOpen : tab === k;
        return <button key={k} className={"tab " + (active ? "on" : "")} onClick={() => {
          if (k === "more") setMoreOpen((value) => !value);
          else { setMoreOpen(false); setTab(k); }
        }} aria-haspopup={k === "more" ? "menu" : undefined} aria-expanded={k === "more" ? moreOpen : undefined}>
          {staffSurface ? <Icon name={k} size={18} /> : <i />} <span>{label}</span>
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
