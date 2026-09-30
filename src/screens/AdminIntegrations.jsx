import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { EmptyState, FieldGroup, LoadingState, ProductNotice } from "../components/bits";
import { humanError } from "../lib/productLanguage";

export default function AdminIntegrations({ me }) {
  const [connectors,setConnectors]=useState([]);
  const [subscriptions,setSubscriptions]=useState([]);
  const [events,setEvents]=useState([]);
  const [outbox,setOutbox]=useState([]);
  const [name,setName]=useState("");
  const [key,setKey]=useState("");
  const [type,setType]=useState("webhook");
  const [selectedConnector,setSelectedConnector]=useState("");
  const [selectedEvent,setSelectedEvent]=useState("");
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState(null);
  const [notice,setNotice]=useState(null);

  useEffect(()=>{load();},[me.id]);

  async function load(){
    setLoading(true); setError(null);
    const [c,s,e,o]=await Promise.all([
      supabase.from("integration_connectors").select("*").eq("org_id",me.org_id).order("display_name"),
      supabase.from("integration_subscriptions").select("*").eq("org_id",me.org_id).order("created_at",{ascending:false}),
      supabase.from("platform_event_definitions").select("event_type,label").eq("active",true).order("label"),
      supabase.from("integration_outbox").select("id,connector_id,subscription_id,event_id,state,attempt_count,last_error_category,last_error_message,queued_at,delivered_at").eq("org_id",me.org_id).order("queued_at",{ascending:false}).limit(100),
    ]);
    const first=c.error||s.error||e.error||o.error;
    if(first){setError(humanError(first,"Integrations could not load.")); setLoading(false); return;}
    setConnectors(c.data||[]); setSubscriptions(s.data||[]); setEvents(e.data||[]); setOutbox(o.data||[]);
    if(!selectedConnector&&c.data?.length) setSelectedConnector(c.data[0].id);
    if(!selectedEvent&&e.data?.length) setSelectedEvent(e.data[0].event_type);
    setLoading(false);
  }

  const connectorsById=useMemo(()=>Object.fromEntries(connectors.map(c=>[c.id,c])),[connectors]);

  async function createConnector(){
    if(!name.trim()||!key.trim()) return;
    setBusy(true); setError(null); setNotice(null);
    const {error:e}=await supabase.from("integration_connectors").insert({
      org_id:me.org_id,connector_key:key.trim(),connector_type:type,display_name:name.trim(),
      enabled:false,public_config:{},created_by:me.id,updated_by:me.id,
    });
    setBusy(false);
    if(e){setError(humanError(e,"The connector could not be created.")); return;}
    setName(""); setKey(""); setNotice("Connector created."); await load();
  }

  async function toggleConnector(connector){
    setBusy(true); setError(null); setNotice(null);
    const {error:e}=await supabase.from("integration_connectors")
      .update({enabled:!connector.enabled,updated_by:me.id,updated_at:new Date().toISOString()})
      .eq("id",connector.id);
    setBusy(false);
    if(e){setError(humanError(e,"Connector state could not be changed.")); return;}
    setNotice(!connector.enabled?"Connector enabled.":"Connector disabled."); await load();
  }

  async function subscribe(){
    if(!selectedConnector||!selectedEvent) return;
    setBusy(true); setError(null); setNotice(null);
    const {error:e}=await supabase.from("integration_subscriptions").insert({
      org_id:me.org_id,connector_id:selectedConnector,event_type:selectedEvent,active:true,
      created_by:me.id,updated_by:me.id,
    });
    setBusy(false);
    if(e){setError(humanError(e,"The event subscription could not be created.")); return;}
    setNotice("Event subscription created."); await load();
  }

  if(loading) return <div className="body"><LoadingState label="Loading integrations…" /></div>;

  return <div className="body">
    <div style={{paddingTop:26}}>
      <div className="eyebrow">Platform foundation</div>
      <h1 className="h1">Integrations</h1>
      <p className="screen-note">Controlled connector metadata and event delivery queue. Secrets are never stored in the browser-visible integration tables.</p>
    </div>
    {error&&<ProductNotice tone="error" title="Integrations">{error}</ProductNotice>}
    {notice&&<ProductNotice tone="success" title="Integrations">{notice}</ProductNotice>}

    <div className="split" style={{marginTop:18}}>
      <div className="main-col">
        <div className="sec"><span>Connectors</span><span>{connectors.length}</span></div>
        {connectors.map(connector=><div className="row" key={connector.id}>
          <div className="row-t">{connector.display_name}</div>
          <div className="row-m">{connector.connector_type} · {connector.enabled?"Enabled":"Disabled"} · {connector.connector_key}</div>
          <button className="btn btn-ghost btn-sm" style={{marginTop:8}} disabled={busy} onClick={()=>toggleConnector(connector)}>{connector.enabled?"Disable":"Enable"}</button>
        </div>)}
        {!connectors.length&&<EmptyState title="No connectors">Create a non-secret connector record to begin.</EmptyState>}

        <div className="sec"><span>Delivery queue</span><span>{outbox.length}</span></div>
        {outbox.slice(0,30).map(item=><div className="row" key={item.id}>
          <div className="row-t">{connectorsById[item.connector_id]?.display_name||"Connector"} · {item.state}</div>
          <div className="row-m">Attempts {item.attempt_count} · queued {new Date(item.queued_at).toLocaleString("en-GB",{timeZone:"Africa/Accra"})}</div>
          {item.last_error_message&&<div className="small" style={{marginTop:6}}>{item.last_error_category||"Error"}: {item.last_error_message}</div>}
        </div>)}
      </div>

      <div className="side-col">
        <div className="sec"><span>Create connector</span></div>
        <div className="card" style={{padding:15}}>
          <FieldGroup label="Name"><input className="field" aria-label="Integration connector name" value={name} onChange={e=>setName(e.target.value)} /></FieldGroup>
          <FieldGroup label="Key"><input className="field" aria-label="Integration connector key" value={key} onChange={e=>setKey(e.target.value)} placeholder="example-calendar" /></FieldGroup>
          <FieldGroup label="Type">
            <select className="field" aria-label="Integration connector type" value={type} onChange={e=>setType(e.target.value)}>
              <option value="webhook">Webhook</option><option value="email">Email</option><option value="calendar">Calendar</option><option value="drive">Drive</option><option value="custom">Custom</option>
            </select>
          </FieldGroup>
          <button className="btn" disabled={busy||!name.trim()||!key.trim()} onClick={createConnector}>Create connector</button>
        </div>

        <div className="sec"><span>Subscribe to event</span></div>
        <div className="card" style={{padding:15}}>
          <FieldGroup label="Connector">
            <select className="field" aria-label="Integration subscription connector" value={selectedConnector} onChange={e=>setSelectedConnector(e.target.value)}>
              <option value="">Choose connector</option>{connectors.map(c=><option key={c.id} value={c.id}>{c.display_name}</option>)}
            </select>
          </FieldGroup>
          <FieldGroup label="Event">
            <select className="field" aria-label="Integration subscription event" value={selectedEvent} onChange={e=>setSelectedEvent(e.target.value)}>
              <option value="">Choose event</option>{events.map(e=><option key={e.event_type} value={e.event_type}>{e.label}</option>)}
            </select>
          </FieldGroup>
          <button className="btn" disabled={busy||!selectedConnector||!selectedEvent} onClick={subscribe}>Create subscription</button>
        </div>

        <div className="sec"><span>Subscriptions</span><span>{subscriptions.length}</span></div>
        {subscriptions.map(s=><div className="row" key={s.id}>
          <div className="row-t">{connectorsById[s.connector_id]?.display_name||"Connector"}</div>
          <div className="row-m">{s.event_type} · {s.active?"Active":"Inactive"}</div>
        </div>)}
      </div>
    </div>
  </div>;
}
