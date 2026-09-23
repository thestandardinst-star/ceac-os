import { useEffect, useMemo, useRef, useState } from "react";

export function PremiumIcon({ name, size = 20, className = "" }) {
  const p = { width:size, height:size, viewBox:"0 0 24 24", fill:"none", stroke:"currentColor", strokeWidth:"1.75", strokeLinecap:"round", strokeLinejoin:"round", className:`premium-icon ${className}`, "aria-hidden":"true" };
  const paths = {
    home:<><path d="M3.5 10.3 12 3.5l8.5 6.8"/><path d="M5.5 9.5V20h13V9.5"/><path d="M9.5 20v-5.5h5V20"/></>,
    work:<><rect x="4" y="3.5" width="16" height="17" rx="3"/><path d="m8 12 2.4 2.4L16.5 8.5"/><path d="M8 18h8"/></>,
    team:<><circle cx="9" cy="8" r="3.2"/><path d="M3.8 19c.4-3.1 2.3-5 5.2-5s4.8 1.9 5.2 5"/><path d="M15 6.4a3.1 3.1 0 0 1 0 6"/><path d="M16.7 14.5c2.1.6 3.3 2.1 3.5 4.5"/></>,
    people:<><circle cx="9" cy="8" r="3.2"/><path d="M3.5 19c.5-3.2 2.3-5 5.5-5s5 1.8 5.5 5"/><circle cx="17.5" cy="8.5" r="2.2"/><path d="M16.5 14.5c2.4.2 3.8 1.7 4 4.5"/></>,
    projects:<><path d="M3.5 6.5h6l2 2h9v10.2a1.8 1.8 0 0 1-1.8 1.8H5.3a1.8 1.8 0 0 1-1.8-1.8z"/><path d="M3.5 6.5V5.3a1.8 1.8 0 0 1 1.8-1.8h5l2 2h5.4a1.8 1.8 0 0 1 1.8 1.8v1.2"/></>,
    calendar:<><rect x="3.5" y="5.5" width="17" height="15" rx="2.5"/><path d="M7.5 3.5v4M16.5 3.5v4M3.5 10h17"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 17.5h.01M12 17.5h.01"/></>,
    finance:<><path d="M4 19.5V10M9.3 19.5V5.5M14.7 19.5v-7M20 19.5V8"/><path d="M2.5 20.5h19"/></>,
    reports:<><rect x="4" y="3.5" width="16" height="17" rx="2.5"/><path d="M8 16v-4M12 16V8M16 16v-6"/></>,
    messages:<><path d="M4 5.5h16v11H9l-5 4z"/><path d="M8 10h8M8 13.5h5"/></>,
    hub:<><circle cx="12" cy="8" r="3.4"/><path d="M5 20c.6-4.1 3-6.2 7-6.2s6.4 2.1 7 6.2"/></>,
    ministry:<><path d="M12 3.5 20 7v5.5c0 4.1-2.7 6.9-8 8-5.3-1.1-8-3.9-8-8V7z"/><path d="m8.5 12 2.3 2.3 4.7-5"/></>,
    portfolio:<><rect x="3.5" y="6" width="17" height="13" rx="2.4"/><path d="M8 6V4h8v2M3.5 11h17M9.5 14h5"/></>,
    organisation:<><rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1.5"/><rect x="14" y="3.5" width="6.5" height="6.5" rx="1.5"/><rect x="3.5" y="14" width="6.5" height="6.5" rx="1.5"/><rect x="14" y="14" width="6.5" height="6.5" rx="1.5"/></>,
    control:<><path d="M4 7h10M18 7h2M10 12h10M4 12h2M4 17h6M14 17h6"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="12" cy="17" r="2"/></>,
    time:<><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v5l3 2"/></>,
    search:<><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/></>,
    plus:<><path d="M12 5v14M5 12h14"/></>,
    bell:<><path d="M6.5 9a5.5 5.5 0 0 1 11 0c0 6 2 6 2 7.5h-15C4.5 15 6.5 15 6.5 9z"/><path d="M10 20h4"/></>,
    chevron:<><path d="m9 6 6 6-6 6"/></>,
    more:<><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
    close:<><path d="m6 6 12 12M18 6 6 18"/></>,
    record:<><path d="M5 4.5h14v15H5z"/><path d="M8 9h8M8 13h8M8 17h5"/></>,
  };
  return <svg {...p}>{paths[name] || paths.more}</svg>;
}

const staffNav = [
  { key:"home", label:"Today", icon:"home" },
  { key:"work", label:"Work", icon:"work" },
  { key:"team", label:"Team", icon:"team" },
  { key:"staff-calendar", label:"Calendar", icon:"calendar" },
  { key:"messages", label:"Messages", icon:"messages" },
  { key:"me", label:"My Hub", icon:"hub" },
];
const managerNav = [
  { key:"home", label:"Overview", icon:"home" },
  { key:"work", label:"Work", icon:"work" },
  { key:"team", label:"Team", icon:"team" },
  { key:"projects", label:"Projects", icon:"projects" },
  { key:"calendar", label:"Calendar", icon:"calendar" },
  { key:"manager-finance", label:"Budget", icon:"finance" },
  { key:"manager-reports", label:"Reports", icon:"reports" },
];
const execNav = [
  { key:"home", label:"Overview", icon:"home" },
  { key:"work", label:"Work", icon:"work" },
  { key:"strategy", label:"Ministry", icon:"ministry" },
  { key:"delivery", label:"Portfolio", icon:"portfolio" },
  { key:"exec-organisation", label:"Organisation", icon:"organisation" },
  { key:"exec-finance", label:"Finance", icon:"finance" },
  { key:"exec-reports", label:"Reports", icon:"reports" },
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
  return <span className="premium-brand-mark" aria-hidden="true"><i/><i/></span>;
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
        <PremiumIcon name={item.icon}/><span>{item.label}</span>
      </button>)}
      {onMessages && !nav.some((item)=>item.key==="messages") && <button className="premium-nav-message" onClick={onMessages}><PremiumIcon name="messages"/><span>Messages</span></button>}
    </nav>
    {(onCreateWork || onCreateMeeting || onMessages) && <section className="reference-quick-create" aria-label="Quick create">
      <small>Quick create</small>
      <div className="reference-quick-grid">
        {onCreateWork && <button onClick={onCreateWork}><PremiumIcon name="work" size={15}/><span>New work</span></button>}
        {onCreateMeeting && <button onClick={onCreateMeeting}><PremiumIcon name="calendar" size={15}/><span>New meeting</span></button>}
        {onMessages && <button onClick={onMessages}><PremiumIcon name="messages" size={15}/><span>Open room</span></button>}
        <button onClick={()=>setTab(isAdmin ? "people" : isManager ? "projects" : "me")}><PremiumIcon name={isAdmin ? "people" : isManager ? "projects" : "hub"} size={15}/><span>{isAdmin ? "Person" : isManager ? "Project" : "Profile"}</span></button>
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
  const items=[
    ...nav.map(item=>({ label:item.label, icon:item.icon, action:()=>onNavigate(item.key) })),
    ...(onMessages && !nav.some(item=>item.key==="messages") ? [{ label:"Messages", icon:"messages", action:onMessages }] : []),
  ].filter(item=>!q || item.label.toLowerCase().includes(q));
  return <div className="premium-search-popover" role="listbox">
    <div className="premium-search-label">{q ? "Go to" : "Quick navigation"}</div>
    {items.length ? items.map((item)=><button key={item.label} onClick={()=>{ item.action(); close(); }}><PremiumIcon name={item.icon} size={18}/><span>{item.label}</span><PremiumIcon name="chevron" size={15}/></button>)
      : <div className="premium-search-empty">No matching destination.</div>}
  </div>;
}

export function AppTopBar({ me, roleLabel, tab, onProfile, onNavigate, isAdmin=false, isExec=false, isManager=false, onMessages, onComposeMessage, onCreateWork, onCreateMeeting }) {
  const [query,setQuery]=useState("");
  const [searchOpen,setSearchOpen]=useState(false);
  const [createOpen,setCreateOpen]=useState(false);
  const rootRef=useRef(null);
  const nav=useMemo(()=>navFor({ me, isAdmin, isExec, isManager }),[me,isAdmin,isExec,isManager]);
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
      <PremiumIcon name="search" size={19}/>
      <input value={query} onFocus={()=>setSearchOpen(true)} onChange={(e)=>{setQuery(e.target.value);setSearchOpen(true);}} placeholder="Search your workspace…" aria-label="Search your workspace"/>
      <kbd>⌘ K</kbd>
      {searchOpen && <SearchPalette query={query} nav={nav} onNavigate={onNavigate} onMessages={onMessages} close={()=>setSearchOpen(false)}/>}
    </div>
    <div className="premium-topbar-context"><span>{roleLabel}</span>{current && <><b>/</b><strong>{current.label}</strong></>}</div>
    <div className="premium-topbar-actions">
      {(onCreateWork || onCreateMeeting || onMessages || onComposeMessage) && <div className="premium-create-wrap">
        <button className="premium-create" onClick={()=>setCreateOpen(v=>!v)}><PremiumIcon name="plus" size={18}/><span>Create</span></button>
        {createOpen && <div className="premium-create-menu">
          {onCreateWork && <button onClick={()=>{setCreateOpen(false);onCreateWork();}}><PremiumIcon name="work" size={18}/><span>New work</span></button>}
          {onCreateMeeting && <button onClick={()=>{setCreateOpen(false);onCreateMeeting();}}><PremiumIcon name="calendar" size={18}/><span>Meeting</span></button>}
          {(onComposeMessage || onMessages) && <button onClick={()=>{setCreateOpen(false);(onComposeMessage || onMessages)?.();}}><PremiumIcon name="messages" size={18}/><span>Message room</span></button>}
        </div>}
      </div>}
      {onMessages && <button className="premium-icon-button" aria-label="Open messages" onClick={onMessages}><PremiumIcon name="messages"/></button>}
      <button className="premium-icon-button" aria-label="Notifications"><PremiumIcon name="bell"/></button>
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
      {onMessages && <button aria-label="Messages" onClick={onMessages}><PremiumIcon name="messages"/></button>}
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
      {onMessages && !more.some((item)=>item.key==="messages") && <button role="menuitem" onClick={()=>{setMoreOpen(false);onMessages();}}><PremiumIcon name="messages"/><span>Messages</span></button>}
      {more.map(item=><button role="menuitem" key={item.key} className={tab===item.key?"on":""} onClick={()=>{setMoreOpen(false);setTab(item.key);}}><PremiumIcon name={item.icon}/><span>{item.label}</span></button>)}
    </div></>}
    <nav className="tabs premium-tabs" aria-label="Mobile navigation">
      {primary.map(item=><button key={item.key} aria-label={item.key === "home" ? "Home" : item.key === "me" ? "Me" : item.label} className={tab===item.key?"on":""} onClick={()=>setTab(item.key)}><PremiumIcon name={item.icon}/><span aria-hidden={item.key === "home" || item.key === "me" ? "true" : undefined}>{item.label}</span></button>)}
      <button className={moreOpen || more.some(item=>item.key===tab) ? "on" : ""} onClick={()=>setMoreOpen(v=>!v)}><PremiumIcon name="more"/><span>More</span></button>
    </nav>
  </>;
}
