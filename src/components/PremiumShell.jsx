import { useEffect, useMemo, useRef, useState } from "react";
import Icon from "./primitives/Icon";

const staffNav = [
  { key:"home", label:"Today", icon:"home" },
  { key:"work", label:"Work", icon:"work" },
  { key:"team", label:"Team", icon:"team" },
  { key:"staff-calendar", label:"Calendar", icon:"calendar" },
  { key:"messages", label:"Messages", icon:"messages" },
  { key:"me", label:"My Hub", icon:"hub" },
  { key:"account", label:"Your account", icon:"hub" },
];
const managerNav = [
  { key:"home", label:"Overview", icon:"home" },
  { key:"work", label:"Work", icon:"work" },
  { key:"team", label:"Team", icon:"team" },
  { key:"projects", label:"Projects", icon:"projects" },
  { key:"calendar", label:"Calendar", icon:"calendar" },
  { key:"manager-finance", label:"Finance", icon:"finance" },
  { key:"manager-reports", label:"Reports", icon:"reports" },
  { key:"messages", label:"Messages", icon:"messages" },
  { key:"me", label:"My Hub", icon:"hub" },
  { key:"account", label:"Your account", icon:"hub" },
];
const execNav = [
  { key:"home", label:"Overview", icon:"home" },
  { key:"work", label:"Work", icon:"work" },
  { key:"strategy", label:"Ministry", icon:"ministry" },
  { key:"delivery", label:"Portfolio", icon:"portfolio" },
  { key:"exec-organisation", label:"Organisation", icon:"organisation" },
  { key:"exec-finance", label:"Finance", icon:"finance" },
  { key:"exec-reports", label:"Reports", icon:"reports" },
  { key:"messages", label:"Messages", icon:"messages" },
  { key:"me", label:"My Hub", icon:"hub" },
  { key:"account", label:"Your account", icon:"hub" },
];

function adminNav(me) {
  const capabilities = me?.capabilities || [];
  return [
    { key:"home", label:"Overview", icon:"home" },
    ...(capabilities.includes("people.manage") ? [{ key:"people", label:"People", icon:"people" }] : []),
    { key:"work", label:"Work", icon:"work" },
    { key:"attendance", label:"Time & Leave", icon:"time" },
    { key:"finance", label:"Finance", icon:"finance" },
    { key:"reporting", label:"Reports", icon:"reports" },
    { key:"settings", label:"Control Center", icon:"control" },
    { key:"messages", label:"Messages", icon:"messages" },
    { key:"me", label:"My Hub", icon:"hub" },
    { key:"primitives", label:"Primitives", icon:"control" },
    { key:"account", label:"Your account", icon:"hub" },
  ];
}

function navFor({ me, isAdmin, isExec, isManager }) {
  if (isExec) return execNav;
  if (isAdmin) return adminNav(me);
  if (isManager) return managerNav;
  return staffNav;
}

function roleName({ isAdmin, isExec, isManager }) {
  if (isExec) return "Group Pastor / CEO";
  if (isAdmin) return "Administration & HR";
  if (isManager) return "Manager";
  return "Staff";
}

function PremiumMark() {
  return <span className="premium-brand-mark" aria-hidden="true">
    <span className="premium-brand-mark-core">C</span>
    <span className="premium-brand-mark-dot" />
  </span>;
}

export function SideNav({ tab, setTab, me, isAdmin, isExec, isManager, onUnitChange, onMessages, onCreateWork, onCreateMeeting }) {
  const nav = navFor({ me, isAdmin, isExec, isManager });
  const role = roleName({ isAdmin, isExec, isManager });
  return <aside className="side premium-side">
    <div className="premium-brand">
      <PremiumMark/>
      <div><strong>CEAC OS</strong><span>People. Work. Ministry. Impact.</span></div>
    </div>
    {!isAdmin && (me.memberships?.length || 0) > 1 && <select className="premium-unit-switch" aria-label="Current unit" value={me.unit_id || ""} onChange={(e)=>onUnitChange?.(e.target.value)}>
      {me.memberships.map((membership)=><option key={membership.unit_id} value={membership.unit_id}>{membership.unit_name || "Unit"} · {membership.role === "manager" ? "Manager" : "Staff"}</option>)}
    </select>}
    <nav className="premium-nav" aria-label="Primary navigation">
      {nav.map((item)=><button key={item.key} className={tab === item.key ? "on" : ""} onClick={()=>setTab(item.key)}>
        <Icon className="premium-icon" name={item.icon}/><span>{item.label}</span>
      </button>)}
    </nav>
    {(onCreateWork || onCreateMeeting || onMessages) && <section className="reference-quick-create" aria-label="Quick create">
      <small>Quick create</small>
      <div className="reference-quick-grid">
        {onCreateWork && <button onClick={onCreateWork}><Icon className="premium-icon" name="work" size={15}/><span>New work</span></button>}
        {onCreateMeeting && <button onClick={onCreateMeeting}><Icon className="premium-icon" name="calendar" size={15}/><span>New meeting</span></button>}
        <button onClick={()=>setTab(isAdmin ? "people" : isManager ? "projects" : "me")}><Icon className="premium-icon" name={isAdmin ? "people" : isManager ? "projects" : "hub"} size={15}/><span>{isAdmin ? "Person" : isManager ? "Project" : "Profile"}</span></button>
      </div>
    </section>}
    <div className="premium-side-spacer"/>
    <div className="premium-side-profile">
      <span className="premium-avatar">{(me.full_name || "C").trim().slice(0,1).toUpperCase()}</span>
      <div><strong>{me.full_name}</strong><small>{me.unit_name || role}</small></div>
    </div>
  </aside>;
}

function SearchPalette({ query, nav, onNavigate, onMessages, close }) {
  const q=query.trim().toLowerCase();
  const items=nav.map(item=>({ label:item.label, icon:item.icon, action:()=>onNavigate(item.key) }))
    .filter(item=>!q || item.label.toLowerCase().includes(q));
  return <div className="premium-search-popover" role="listbox">
    <div className="premium-search-label">{q ? "Go to" : "Quick navigation"}</div>
    {items.length ? items.map((item)=><button key={item.label} onClick={()=>{ item.action(); close(); }}><Icon className="premium-icon" name={item.icon} size={18}/><span>{item.label}</span><Icon className="premium-icon" name="chevron" size={15}/></button>)
      : <div className="premium-search-empty">No matching destination.</div>}
  </div>;
}

export function AppTopBar({ me, roleLabel, tab, onProfile, onNavigate, isAdmin=false, isExec=false, isManager=false, onMessages, onComposeMessage, onCreateWork, onCreateMeeting }) {
  const [query,setQuery]=useState("");
  const [searchOpen,setSearchOpen]=useState(false);
  const [createOpen,setCreateOpen]=useState(false);
  const [clock,setClock]=useState(()=>new Date());
  const rootRef=useRef(null);
  const nav=useMemo(()=>navFor({ me, isAdmin, isExec, isManager }),[me,isAdmin,isExec,isManager]);
  useEffect(()=>{ const timer=setInterval(()=>setClock(new Date()),60000); return ()=>clearInterval(timer); },[]);
  useEffect(()=>{
    function down(e){ if(rootRef.current && !rootRef.current.contains(e.target)){ setSearchOpen(false); setCreateOpen(false); } }
    function keydown(e){
      if((e.metaKey||e.ctrlKey) && e.key.toLowerCase()==="k"){
        e.preventDefault();
        setSearchOpen(true);
        rootRef.current?.querySelector(".premium-search-wrap input")?.focus();
      }
      if(e.key==="Escape"){ setSearchOpen(false); setCreateOpen(false); }
    }
    document.addEventListener("pointerdown",down);
    document.addEventListener("keydown",keydown);
    return ()=>{document.removeEventListener("pointerdown",down);document.removeEventListener("keydown",keydown);};
  },[]);
  const current=nav.find(item=>item.key===tab);
  return <header className="desktop-topbar premium-topbar" ref={rootRef}>
    <div className="premium-search-wrap">
      <Icon className="premium-icon" name="search" size={19}/>
      <input value={query} onFocus={()=>setSearchOpen(true)} onChange={(e)=>{setQuery(e.target.value);setSearchOpen(true);}} placeholder="Search your workspace…" aria-label="Search your workspace"/>
      <kbd>⌘ K</kbd>
      {searchOpen && <SearchPalette query={query} nav={nav} onNavigate={onNavigate} onMessages={onMessages} close={()=>setSearchOpen(false)}/>}
    </div>
    <div className="premium-topbar-context"><span>{roleLabel}</span>{current && <><b>/</b><strong>{current.label}</strong></>}</div>
    <div className="premium-topbar-actions">
      {(onCreateWork || onCreateMeeting || onMessages || onComposeMessage) && <div className="premium-create-wrap">
        <button className="premium-create" onClick={()=>setCreateOpen(v=>!v)}><Icon className="premium-icon" name="plus" size={18}/><span>Create</span></button>
        {createOpen && <div className="premium-create-menu">
          {onCreateWork && <button onClick={()=>{setCreateOpen(false);onCreateWork();}}><Icon className="premium-icon" name="work" size={18}/><span>New work</span></button>}
          {onCreateMeeting && <button onClick={()=>{setCreateOpen(false);onCreateMeeting();}}><Icon className="premium-icon" name="calendar" size={18}/><span>Meeting</span></button>}
          {(onComposeMessage || onMessages) && <button onClick={()=>{setCreateOpen(false);(onComposeMessage || onMessages)?.();}}><Icon className="premium-icon" name="messages" size={18}/><span>Message room</span></button>}
        </div>}
      </div>}
      <div className="premium-topbar-date" aria-label="Current date and time">
        <strong>{clock.toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</strong>
        <small>Accra · {clock.toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}</small>
      </div>
      <button className="premium-profile-button" onClick={onProfile} aria-label="Open profile">
        <span className="premium-avatar">{(me?.full_name || "C").trim().slice(0,1).toUpperCase()}</span>
        <span><strong>{me?.full_name || "Account"}</strong><small>{me?.unit_name || roleLabel}</small></span>
      </button>
    </div>
  </header>;
}

export function MobileTopBar({ me, roleLabel="Staff", onProfile, onMessages }) {
  return <header className="mobile-topbar premium-mobile-topbar">
    <div className="premium-mobile-brand"><PremiumMark/><strong>CEAC OS</strong></div>
    <div className="premium-mobile-actions">
      <button aria-label="Open profile" onClick={onProfile}><span className="premium-avatar">{(me?.full_name || "C").trim().slice(0,1).toUpperCase()}</span></button>
    </div>
  </header>;
}

export function Tabs({ tab, setTab, isManager, isExec=false, isAdmin=false, me=null, onMessages }) {
  const [moreOpen,setMoreOpen]=useState(false);
  const nav=navFor({ me, isAdmin, isExec, isManager });
  const preferred=isAdmin ? ["home","people","attendance","finance"] : isExec ? ["home","work","strategy","delivery"] : isManager ? ["home","work","team","projects"] : ["home","work","team","me"];
  const primary=preferred.map(key=>nav.find(item=>item.key===key)).filter(Boolean);
  // R6: secondary mobile navigation is derived only from the approved role shell.
  // Legacy architecture routes remain reachable contextually, not as a duplicate catalogue in More.
  const transitional = [];
  const more=[...nav.filter(item=>!primary.some(p=>p.key===item.key)), ...transitional].filter((item,index,list)=>list.findIndex(other=>other.key===item.key)===index);
  useEffect(()=>setMoreOpen(false),[tab,isAdmin,isExec,isManager]);
  return <>
    {moreOpen && <><button className="premium-mobile-menu-bg" aria-label="Close menu" onClick={()=>setMoreOpen(false)}/><div className="premium-mobile-menu" role="menu">
      <div className="premium-mobile-menu-head"><strong>More</strong><span>{roleName({isAdmin,isExec,isManager})}</span></div>
      {more.map(item=><button role="menuitem" key={item.key} className={tab===item.key?"on":""} onClick={()=>{setMoreOpen(false);setTab(item.key);}}><Icon className="premium-icon" name={item.icon}/><span>{item.label}</span></button>)}
    </div></>}
    <nav className="tabs premium-tabs" aria-label="Mobile navigation">
      {primary.map(item=><button key={item.key} aria-label={item.key === "home" ? "Home" : item.key === "me" ? "Me" : item.label} className={tab===item.key?"on":""} onClick={()=>setTab(item.key)}><Icon className="premium-icon" name={item.icon}/><span aria-hidden={item.key === "home" || item.key === "me" ? "true" : undefined}>{item.label}</span></button>)}
      <button className={moreOpen || more.some(item=>item.key===tab) ? "on" : ""} onClick={()=>setMoreOpen(v=>!v)}><Icon className="premium-icon" name="more"/><span>More</span></button>
    </nav>
  </>;
}
