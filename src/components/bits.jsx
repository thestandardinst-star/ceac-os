import { useEffect, useState } from "react";
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
          <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>))}
      </nav>
      <div className="who">{me.full_name}</div>
    </aside>);
}
export function Tabs({ tab, setTab, isManager, isExec = false }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const managerMore = [["calendar","Calendar"],["manager-finance","Finance"],["manager-reports","Reports"],["me","Me"]];
  const managerPrimary = [["home","Home"],["work","Work"],["team","Team"],["projects","Projects"],["more","More"]];
  const items = isExec ? [["home","Home"],["announcements","Announcements"],["me","Me"]] : (isManager ? managerPrimary : tabItems(false));
  const moreActive = isManager && managerMore.some(([key]) => key === tab);
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
          <i /> {label}
        </button>;
      })}
    </nav>
  </>);
}
export function Sheet({ children, onClose }) {
  useEffect(() => {
    function onKeyDown(event) { if (event.key === "Escape") onClose?.(); }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);
  return (<><div className="sheet-bg" onClick={onClose} /><div className="sheet" role="dialog" aria-modal="true">{children}</div></>);
}
