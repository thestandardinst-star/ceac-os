import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { EmptyState, FieldGroup, LoadingState, Pill, ProductNotice, Sheet } from "../components/bits";
import Icon from "../components/primitives/Icon";
import { humanError } from "../lib/productLanguage";

function human(value=""){
  return String(value).replaceAll("_"," ").replace(/\b\w/g,(m)=>m.toUpperCase());
}
function stamp(value){
  if(!value) return "Not checked yet";
  return new Date(value).toLocaleString("en-GB",{dateStyle:"medium",timeStyle:"short",timeZone:"Africa/Accra"});
}
function stateTone(state){
  if(state==="connected") return "green";
  if(state==="connecting") return "blue";
  if(state==="needs_reconnect"||state==="error") return "amber";
  return "grey";
}
function stateLabel(state){
  const labels={
    not_connected:"Not connected",
    connecting:"Connecting",
    connected:"Connected",
    needs_reconnect:"Reconnect required",
    disabled:"Disabled",
    revoked:"Disconnected",
    error:"Needs attention",
  };
  return labels[state]||human(state||"not_connected");
}

export default function AdminIntegrations({ me }) {
  const [providers,setProviders]=useState([]);
  const [connectors,setConnectors]=useState([]);
  const [subscriptions,setSubscriptions]=useState([]);
  const [events,setEvents]=useState([]);
  const [outbox,setOutbox]=useState([]);
  const [attempts,setAttempts]=useState([]);
  const [connectionEvents,setConnectionEvents]=useState([]);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState(null);
  const [notice,setNotice]=useState(null);
  const [connectProvider,setConnectProvider]=useState(null);
  const [botToken,setBotToken]=useState("");
  const [chatId,setChatId]=useState("");
  const [selectedEvent,setSelectedEvent]=useState("");
  const [advanced,setAdvanced]=useState(false);

  useEffect(()=>{load();},[me.id]);

  async function load(){
    setLoading(true); setError(null);
    const results=await Promise.all([
      supabase.from("integration_provider_definitions").select("*").eq("active",true).order("display_name"),
      supabase.from("integration_connectors").select("*").eq("org_id",me.org_id).order("display_name"),
      supabase.from("integration_subscriptions").select("*").eq("org_id",me.org_id).order("created_at",{ascending:false}),
      supabase.from("platform_event_definitions").select("event_type,label,source_domain").eq("active",true).order("source_domain").order("label"),
      supabase.from("integration_outbox").select("id,connector_id,subscription_id,event_id,state,attempt_count,next_attempt_at,last_error_category,last_error_message,queued_at,delivered_at").eq("org_id",me.org_id).order("queued_at",{ascending:false}).limit(100),
      supabase.from("integration_delivery_attempts").select("*").eq("org_id",me.org_id).order("started_at",{ascending:false}).limit(80),
      supabase.from("integration_connection_events").select("*").eq("org_id",me.org_id).order("created_at",{ascending:false}).limit(80),
    ]);
    const failed=results.find((row)=>row.error);
    if(failed){
      setError(humanError(failed.error,"Connected Apps could not finish loading."));
      setLoading(false); return;
    }
    setProviders(results[0].data||[]);
    setConnectors(results[1].data||[]);
    setSubscriptions(results[2].data||[]);
    setEvents(results[3].data||[]);
    setOutbox(results[4].data||[]);
    setAttempts(results[5].data||[]);
    setConnectionEvents(results[6].data||[]);
    if(!selectedEvent&&results[3].data?.length) setSelectedEvent(results[3].data[0].event_type);
    setLoading(false);
  }

  const connectorByProvider=useMemo(()=>Object.fromEntries(connectors.map((row)=>[row.provider_key,row])),[connectors]);
  const connectorsById=useMemo(()=>Object.fromEntries(connectors.map((row)=>[row.id,row])),[connectors]);
  const eventsByType=useMemo(()=>Object.fromEntries(events.map((row)=>[row.event_type,row])),[events]);

  async function invoke(action,body={},success){
    setBusy(true); setError(null); setNotice(null);
    try{
      const {data,error:e}=await supabase.functions.invoke("integration-runtime",{body:{action,...body}});
      if(e) throw e;
      if(data?.error) throw new Error(data.error);
      if(success) setNotice(success);
      await load();
      return data;
    }catch(e){
      setError(humanError(e,"That Connected Apps action could not be completed."));
      return null;
    }finally{
      setBusy(false);
    }
  }

  function openConnect(provider){
    setConnectProvider(provider);
    const existing=connectorByProvider[provider.provider_key];
    setChatId(existing?.public_config?.chat_id||"");
    setBotToken("");
    setError(null); setNotice(null);
  }

  async function connect(){
    if(connectProvider?.provider_key!=="telegram") return;
    const data=await invoke("connect.telegram",{token:botToken,chat_id:chatId},"Telegram connected and verified.");
    setBotToken("");
    if(data?.ok) setConnectProvider(null);
  }

  async function health(connector){
    await invoke("health."+connector.provider_key,{},"Connection check completed.");
  }

  async function disconnect(connector){
    const confirmed=window.confirm("Disconnect this provider? CEAC OS will stop sending new provider notifications until it is connected again.");
    if(!confirmed) return;
    await invoke("disconnect."+connector.provider_key,{},"Provider disconnected.");
  }

  async function setSubscription(connector,eventType,active){
    await invoke("subscription.set",{connector_id:connector.id,event_type:eventType,active},active?"Notification enabled.":"Notification disabled.");
  }

  const queueCounts=useMemo(()=>outbox.reduce((acc,row)=>{
    acc[row.state]=(acc[row.state]||0)+1; return acc;
  },{}),[outbox]);

  if(loading) return <div className="body"><LoadingState label="Loading Connected Apps…" /></div>;

  return <div className="body connected-apps premium-admin-page">
    <header className="admin-page-header connected-apps-header">
      <div>
        <span className="eyebrow">Control Center</span>
        <h1 className="h1">Connected Apps</h1>
        <p className="screen-note">Connect approved external services without exposing provider credentials to the browser. Provider permissions never broaden CEAC OS authority.</p>
      </div>
    </header>

    {error&&<ProductNotice tone="error" title="Connected Apps">{error}</ProductNotice>}
    {notice&&<ProductNotice tone="success" title="Connected Apps">{notice}</ProductNotice>}

    <section className="connected-provider-grid">
      {providers.map((provider)=>{
        const connector=connectorByProvider[provider.provider_key];
        const state=connector?.connection_state||"not_connected";
        const connected=state==="connected";
        const providerSubscriptions=connector?subscriptions.filter((row)=>row.connector_id===connector.id):[];
        return <article className="connected-provider-card" key={provider.provider_key}>
          <div className="connected-provider-top">
            <span className="connected-provider-icon"><Icon className="premium-icon" name={provider.provider_key==="telegram"?"messages":"plus"} size={22}/></span>
            <div className="connected-provider-title"><strong>{provider.display_name}</strong><small>{provider.description}</small></div>
            <Pill tone={stateTone(state)}>{stateLabel(state)}</Pill>
          </div>

          <div className="connected-provider-facts">
            <div><span>Connected account</span><strong>{connector?.connected_account_label||"Not connected"}</strong></div>
            <div><span>What CEAC OS can do</span><strong>{connected?(connector.advertised_capabilities||[]).map(human).join(", ")||"No verified capability":"Connect to verify capability"}</strong></div>
            <div><span>Granted permission</span><strong>{connected?(connector.granted_scopes||[]).map(human).join(", ")||"None":"None granted"}</strong></div>
            <div><span>Last health check</span><strong>{stamp(connector?.last_health_at)}</strong></div>
          </div>

          {connector?.last_error_message&&state!=="connected"&&<div className="connected-provider-warning"><strong>{human(connector.last_error_category||"Provider issue")}</strong><span>{connector.last_error_message}</span></div>}

          <div className="connected-provider-actions">
            {!connected&&<button className="btn" disabled={busy} onClick={()=>openConnect(provider)}>{state==="not_connected"||state==="revoked"?"Connect":"Reconnect"}</button>}
            {connected&&<button className="btn btn-ghost" disabled={busy} onClick={()=>health(connector)}>Check connection</button>}
            {connected&&<button className="btn btn-ghost" disabled={busy} onClick={()=>disconnect(connector)}>Disconnect</button>}
          </div>

          {connected&&connector.advertised_capabilities?.includes("send_notification")&&<div className="connected-notifications">
            <div className="connected-section-head"><div><strong>CEAC notifications</strong><span>Telegram receives only the event label and a prompt to open CEAC OS. Raw event payloads stay inside CEAC OS.</span></div></div>
            <div className="connected-subscribe-form">
              <select className="field" aria-label={provider.display_name+" notification event"} value={selectedEvent} onChange={e=>setSelectedEvent(e.target.value)}>
                {events.map((event)=><option key={event.event_type} value={event.event_type}>{event.label} · {human(event.source_domain)}</option>)}
              </select>
              <button className="btn btn-sm" disabled={busy||!selectedEvent||providerSubscriptions.some((row)=>row.event_type===selectedEvent&&row.active)} onClick={()=>setSubscription(connector,selectedEvent,true)}>Enable notification</button>
            </div>
            <div className="connected-subscription-list">
              {providerSubscriptions.filter((row)=>row.active).map((row)=><div key={row.id}><span>{eventsByType[row.event_type]?.label||human(row.event_type)}</span><button className="text-action" disabled={busy} onClick={()=>setSubscription(connector,row.event_type,false)}>Turn off</button></div>)}
              {!providerSubscriptions.some((row)=>row.active)&&<span className="connected-empty-copy">No event notifications enabled yet.</span>}
            </div>
          </div>}
        </article>;
      })}
      {!providers.length&&<EmptyState title="No provider adapters are enabled">Stage 12 provider definitions will appear here when approved.</EmptyState>}
    </section>

    <section className="connected-advanced">
      <button className="connected-advanced-toggle" aria-expanded={advanced} onClick={()=>setAdvanced((value)=>!value)}>
        <span><strong>Advanced diagnostics</strong><small>Connection history, delivery queue and retry evidence for authorised troubleshooting.</small></span>
        <b>{advanced?"Hide":"Open"} →</b>
      </button>
      {advanced&&<div className="connected-advanced-body">
        <div className="connected-diagnostic-stats">
          <div><span>Pending</span><strong>{queueCounts.pending||0}</strong></div>
          <div><span>Processing</span><strong>{queueCounts.processing||0}</strong></div>
          <div><span>Retry / failed</span><strong>{queueCounts.failed||0}</strong></div>
          <div><span>Delivered</span><strong>{queueCounts.delivered||0}</strong></div>
        </div>

        <div className="connected-diagnostic-columns">
          <div>
            <div className="sec"><span>Connection history</span></div>
            {connectionEvents.slice(0,20).map((row)=><div className="row" key={row.id}>
              <div className="row-t">{connectorsById[row.connector_id]?.display_name||human(row.provider_key)} · {stateLabel(row.to_state)}</div>
              <div className="row-m">{stamp(row.created_at)} · {row.action}</div>
              {row.safe_detail&&<div className="row-note">{row.safe_detail}</div>}
            </div>)}
            {!connectionEvents.length&&<div className="connected-empty-copy">No connection history yet.</div>}
          </div>
          <div>
            <div className="sec"><span>Recent delivery attempts</span></div>
            {attempts.slice(0,20).map((row)=><div className="row" key={row.id}>
              <div className="row-t">{connectorsById[row.connector_id]?.display_name||"Provider"} · {human(row.outcome)}</div>
              <div className="row-m">Attempt {row.attempt_number} · {stamp(row.started_at)}</div>
              {row.safe_message&&<div className="row-note">{human(row.error_category||"Provider issue")}: {row.safe_message}</div>}
            </div>)}
            {!attempts.length&&<div className="connected-empty-copy">No delivery attempts yet.</div>}
          </div>
        </div>
      </div>}
    </section>

    {connectProvider&&<Sheet onClose={()=>{if(!busy){setBotToken("");setConnectProvider(null);}}}>
      <div className="eyebrow">Connect {connectProvider.display_name}</div>
      <div className="h2">Verify the Telegram bot and destination</div>
      <p className="screen-note">The bot token is sent directly to the server connection flow and stored encrypted in Supabase Vault only after Telegram verifies the bot and destination. It is never saved in browser-visible CEAC tables.</p>
      <FieldGroup label="Bot token" hint="Create or copy the token from Telegram BotFather. CEAC OS does not display it again after connection.">
        <input className="field" aria-label="Telegram bot token" type="password" autoComplete="off" value={botToken} onChange={e=>setBotToken(e.target.value)} />
      </FieldGroup>
      <FieldGroup label="Chat ID" hint="The approved Telegram chat that should receive CEAC notifications.">
        <input className="field" aria-label="Telegram chat ID" value={chatId} onChange={e=>setChatId(e.target.value)} />
      </FieldGroup>
      <ProductNotice tone="info" title="What will be sent">A successful connection sends one test message. Future notifications contain a short CEAC event label and direct recipients back to CEAC OS for details.</ProductNotice>
      <button className="btn" style={{marginTop:14}} disabled={busy||botToken.trim().length<20||!chatId.trim()} onClick={connect}>{busy?"Verifying…":"Verify & connect"}</button>
    </Sheet>}
  </div>;
}
