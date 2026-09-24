import Icon from "../components/primitives/Icon";
import { useMemo } from "react";

function ControlCard({title,description,action,label,state="Ready",tone="",icon}){
  return <button className={"control-card "+tone} onClick={action}>
    <span className="control-card-icon" aria-hidden="true"><Icon className="premium-icon" name={icon} size={21}/></span>
    <span className="control-card-copy"><strong>{title}</strong><small>{description}</small></span>
    <span className="control-card-side"><b>{state}</b><em>{label||"Open"} →</em></span>
  </button>;
}

export default function ControlCenter({me,go}){
  const caps=useMemo(()=>new Set(me.capabilities||[]),[me.capabilities]);
  const cards=[
    {title:"Organisation",description:"Office location, leave policy and organisation-level configuration.",action:()=>go("office-settings"),icon:"organisation"},
    ...(caps.has("authority.manage")?[{title:"Access & permissions",description:"Grant and revoke explicit capabilities with attributable reasons.",action:()=>go("authority"),icon:"control"}]:[]),
    ...(caps.has("compliance.manage")?[{title:"Policies & compliance",description:"Publish policy versions, requirements, evidence rules and approved exceptions.",action:()=>go("compliance"),icon:"record"}]:[]),
    ...(caps.has("audit.view")||caps.has("people.manage")?[{title:"Checks",description:"Review decisions and confirmations that are waiting for an authorised person.",action:()=>go("workflows"),icon:"control"}]:[]),
    ...(caps.has("integration.manage")?[{title:"Connected Apps",description:"Manage external services and connection status. Technical delivery internals stay in Advanced.",action:()=>go("integrations"),icon:"plus"}]:[]),
    ...(caps.has("audit.view")?[{title:"Activity log",description:"Append-only history of consequential changes across the ordinary platform.",action:()=>go("audit"),icon:"record"}]:[]),
  ];
  const advanced=[
    ...(caps.has("audit.view")?[{title:"System events",description:"Internal event stream for diagnostics, workflows and future intelligence.",action:()=>go("events")}]:[]),
    ...(caps.has("authority.manage")?[{title:"Organisation rules",description:"Low-level versioned rules used by CEAC OS.",action:()=>go("policies")}]:[]),
  ];
  return <div className="body control-center premium-admin-page">
    <header className="admin-page-header">
      <div><span className="eyebrow">Administration</span><h1 className="h1">Control Center</h1><p className="screen-note">Configure how CEAC OS operates. Everyday employee and manager work stays outside this area.</p></div>
    </header>
    <section className="control-grid">{cards.map(c=><ControlCard key={c.title}{...c}/>)}</section>
    {advanced.length>0&&<section className="control-advanced"><div><span className="eyebrow">Advanced</span><h2>Technical & governance tools</h2><p>Use these only when diagnosing or governing the underlying platform.</p></div><div>{advanced.map(c=><button key={c.title} onClick={c.action}><strong>{c.title}</strong><small>{c.description}</small><b>Open →</b></button>)}</div></section>}
  </div>;
}
