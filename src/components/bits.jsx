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
  if (isManager) return [["home","Home"],["work","My work"],["team","Team"],["projects","Projects"],["me","Me"]];
  return [["home","Home"],["work","Work"],["team","Team"],["record","Record"],["me","Me"]];
}
export function SideNav({ tab, setTab, me, isAdmin, isManager }) {
  const label = me.is_exec ? "Group Pastor" : me.is_admin ? "Administration" : (me.unit_name || "—");
  const items = tabItems(isManager);
  if (isAdmin) { items.splice(1, 0, ["units","Units"], ["people","People"], ["attendance","Attendance"], ["cost","Cost"], ["finance","Finance"]); items.push(["settings","Settings"]); }
  return (
    <aside className="side">
      <div className="brand">CEAC<span>{label}</span></div>
      <nav>
        {items.map(([k, l]) => (
          <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>))}
      </nav>
      <div className="who">{me.full_name}</div>
    </aside>);
}
export function Tabs({ tab, setTab, isManager }) {
  return (
    <nav className="tabs">
      {tabItems(isManager).map(([k, label]) => (
        <button key={k} className={"tab " + (tab === k ? "on" : "")} onClick={() => setTab(k)}>
          <i /> {label}
        </button>))}
    </nav>);
}
export function Sheet({ children, onClose }) {
  return (<><div className="sheet-bg" onClick={onClose} /><div className="sheet">{children}</div></>);
}
