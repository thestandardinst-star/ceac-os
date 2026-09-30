import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  Button,
  ConfirmDialog,
  DataPanel,
  InputField,
  ModalDialog,
  QueueRow,
  SelectField,
  Skeleton,
  StatePanel,
  StatTile,
  StatusBadge,
  Surface,
} from "../experience-v2/components";
import { CeacIcon } from "../experience-v2/icons";
import { humanError } from "../lib/productLanguage";

function human(value = "") {
  return String(value).replaceAll("_", " ").replace(/\b\w/g, (match) => match.toUpperCase());
}

function stamp(value) {
  if (!value) return "Not checked yet";
  return new Date(value).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Accra",
  });
}

function stateTone(state) {
  if (state === "connected") return "success";
  if (state === "connecting") return "action";
  if (state === "needs_reconnect" || state === "error") return "warning";
  return "neutral";
}

function stateLabel(state) {
  const labels = {
    not_connected: "Not connected",
    connecting: "Connecting",
    connected: "Connected",
    needs_reconnect: "Reconnect required",
    disabled: "Disabled",
    revoked: "Disconnected",
    error: "Needs attention",
  };
  return labels[state] || human(state || "not_connected");
}

export default function AdminIntegrations({ me }) {
  const [providers, setProviders] = useState([]);
  const [connectors, setConnectors] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [events, setEvents] = useState([]);
  const [outbox, setOutbox] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [connectionEvents, setConnectionEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [connectProvider, setConnectProvider] = useState(null);
  const [disconnectTarget, setDisconnectTarget] = useState(null);
  const [botToken, setBotToken] = useState("");
  const [chatId, setChatId] = useState("");
  const [selectedEvent, setSelectedEvent] = useState("");
  const [advanced, setAdvanced] = useState(false);

  useEffect(() => { load(); }, [me.id]);

  async function load() {
    setLoading(true);
    setError(null);
    const results = await Promise.all([
      supabase.from("integration_provider_definitions").select("*").eq("active", true).order("display_name"),
      supabase.from("integration_connectors").select("*").eq("org_id", me.org_id).order("display_name"),
      supabase.from("integration_subscriptions").select("*").eq("org_id", me.org_id).order("created_at", { ascending: false }),
      supabase.from("platform_event_definitions").select("event_type,label,source_domain").eq("active", true).order("source_domain").order("label"),
      supabase.from("integration_outbox").select("id,connector_id,subscription_id,event_id,state,attempt_count,next_attempt_at,last_error_category,last_error_message,queued_at,delivered_at").eq("org_id", me.org_id).order("queued_at", { ascending: false }).limit(100),
      supabase.from("integration_delivery_attempts").select("*").eq("org_id", me.org_id).order("started_at", { ascending: false }).limit(80),
      supabase.from("integration_connection_events").select("*").eq("org_id", me.org_id).order("created_at", { ascending: false }).limit(80),
    ]);
    const failed = results.find((row) => row.error);
    if (failed) {
      setError(humanError(failed.error, "Connected Apps could not finish loading."));
      setLoading(false);
      return;
    }
    setProviders(results[0].data || []);
    setConnectors(results[1].data || []);
    setSubscriptions(results[2].data || []);
    setEvents(results[3].data || []);
    setOutbox(results[4].data || []);
    setAttempts(results[5].data || []);
    setConnectionEvents(results[6].data || []);
    if (!selectedEvent && results[3].data?.length) setSelectedEvent(results[3].data[0].event_type);
    setLoading(false);
  }

  const connectorByProvider = useMemo(
    () => Object.fromEntries(connectors.map((row) => [row.provider_key, row])),
    [connectors]
  );
  const connectorsById = useMemo(
    () => Object.fromEntries(connectors.map((row) => [row.id, row])),
    [connectors]
  );
  const eventsByType = useMemo(
    () => Object.fromEntries(events.map((row) => [row.event_type, row])),
    [events]
  );
  const queueCounts = useMemo(
    () => outbox.reduce((acc, row) => {
      acc[row.state] = (acc[row.state] || 0) + 1;
      return acc;
    }, {}),
    [outbox]
  );

  async function invoke(action, body = {}, success) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("integration-runtime", {
        body: { action, ...body },
      });
      if (invokeError) throw invokeError;
      if (data?.error) throw new Error(data.error);
      if (success) setNotice(success);
      await load();
      return data;
    } catch (invokeError) {
      setError(humanError(invokeError, "That Connected Apps action could not be completed."));
      return null;
    } finally {
      setBusy(false);
    }
  }

  function openConnect(provider) {
    setConnectProvider(provider);
    const existing = connectorByProvider[provider.provider_key];
    setChatId(existing?.public_config?.chat_id || "");
    setBotToken("");
    setError(null);
    setNotice(null);
  }

  function closeConnect() {
    if (busy) return;
    setBotToken("");
    setConnectProvider(null);
  }

  async function connect() {
    if (connectProvider?.provider_key !== "telegram") return;
    const data = await invoke(
      "connect.telegram",
      { token: botToken, chat_id: chatId },
      "Telegram connected and verified."
    );
    setBotToken("");
    if (data?.ok) setConnectProvider(null);
  }

  async function health(connector) {
    await invoke("health." + connector.provider_key, {}, "Connection check completed.");
  }

  async function disconnect(connector) {
    setDisconnectTarget(null);
    await invoke("disconnect." + connector.provider_key, {}, "Provider disconnected.");
  }

  async function setSubscription(connector, eventType, active) {
    await invoke(
      "subscription.set",
      { connector_id: connector.id, event_type: eventType, active },
      active ? "Notification enabled." : "Notification disabled."
    );
  }

  const eventOptions = events.map((event) => ({
    value: event.event_type,
    label: event.label + " · " + human(event.source_domain),
  }));

  if (loading) {
    return <div className="body ev2i-page" aria-label="Loading Connected Apps" aria-busy="true">
      <header className="ev2i-header">
        <div>
          <span className="eyebrow">Control Center</span>
          <h1 className="h1">Connected Apps</h1>
          <p className="screen-note">Checking approved provider connections and secure delivery state.</p>
        </div>
      </header>
      <div className="ev2i-provider-grid">
        <Skeleton variant="block" height="18rem" />
        <Skeleton variant="block" height="18rem" />
      </div>
    </div>;
  }

  return <div className="body ev2i-page connected-apps">
    <header className="ev2i-header">
      <div>
        <span className="eyebrow">Control Center</span>
        <h1 className="h1">Connected Apps</h1>
        <p className="screen-note">Connect approved external services without exposing provider credentials to the browser. Provider permissions never broaden CEAC OS authority.</p>
      </div>
      <StatusBadge tone="neutral">Server-secured connections</StatusBadge>
    </header>

    {error ? <StatePanel
      state="error"
      title="Connected Apps needs attention"
      description={error}
      actionLabel="Try again"
      onAction={load}
    /> : null}

    {notice ? <Surface variant="soft" padding="standard" className="ev2i-notice" role="status">
      <CeacIcon name="checkCircle" size="row" decorative />
      <span>{notice}</span>
    </Surface> : null}

    <section className="ev2i-provider-grid" aria-label="Approved providers">
      {providers.map((provider) => {
        const connector = connectorByProvider[provider.provider_key];
        const state = connector?.connection_state || "not_connected";
        const connected = state === "connected";
        const providerSubscriptions = connector
          ? subscriptions.filter((row) => row.connector_id === connector.id)
          : [];
        const canNotify = connected && connector.advertised_capabilities?.includes("send_notification");

        return <Surface
          as="article"
          variant="plain"
          padding="standard"
          className="ev2i-provider-card connected-provider-card"
          key={provider.provider_key}
        >
          <div className="ev2i-provider-top">
            <span className="ev2i-provider-icon">
              <CeacIcon name={provider.provider_key === "telegram" ? "messages" : "link"} size="feature" decorative />
            </span>
            <div className="ev2i-provider-title">
              <strong>{provider.display_name}</strong>
              <span>{provider.description}</span>
            </div>
            <StatusBadge tone={stateTone(state)}>{stateLabel(state)}</StatusBadge>
          </div>

          <div className="ev2i-provider-facts">
            <div><span>Connected account</span><strong>{connector?.connected_account_label || "Not connected"}</strong></div>
            <div><span>What CEAC OS can do</span><strong>{connected ? (connector.advertised_capabilities || []).map(human).join(", ") || "No verified capability" : "Connect to verify capability"}</strong></div>
            <div><span>Granted permission</span><strong>{connected ? (connector.granted_scopes || []).map(human).join(", ") || "None" : "None granted"}</strong></div>
            <div><span>Last health check</span><strong>{stamp(connector?.last_health_at)}</strong></div>
          </div>

          {connector?.last_error_message && state !== "connected" ? <Surface variant="soft" padding="compact" className="ev2i-provider-warning">
            <CeacIcon name="warning" size="row" decorative />
            <span><strong>{human(connector.last_error_category || "Provider issue")}</strong>{connector.last_error_message}</span>
          </Surface> : null}

          <div className="ev2i-provider-actions">
            {!connected ? <Button disabled={busy} onClick={() => openConnect(provider)} icon="link">
              {state === "not_connected" || state === "revoked" ? "Connect" : "Reconnect"}
            </Button> : null}
            {connected ? <Button variant="secondary" disabled={busy} onClick={() => health(connector)} icon="refresh">
              Check connection
            </Button> : null}
            {connected ? <Button variant="quiet" disabled={busy} onClick={() => setDisconnectTarget(connector)}>
              Disconnect
            </Button> : null}
          </div>

          {canNotify ? <DataPanel
            eyebrow="Notifications"
            title="CEAC notifications"
            supporting="Telegram receives only the event label and a prompt to open CEAC OS. Raw event payloads stay inside CEAC OS."
            className="ev2i-notifications"
          >
            <div className="ev2i-subscribe-form">
              <SelectField
                label="Event"
                aria-label={provider.display_name + " notification event"}
                value={selectedEvent}
                onChange={(event) => setSelectedEvent(event.target.value)}
                options={eventOptions}
              />
              <Button
                size="compact"
                disabled={busy || !selectedEvent || providerSubscriptions.some((row) => row.event_type === selectedEvent && row.active)}
                onClick={() => setSubscription(connector, selectedEvent, true)}
              >
                Enable notification
              </Button>
            </div>
            <div className="ev2i-subscription-list">
              {providerSubscriptions.filter((row) => row.active).map((row) => (
                <div key={row.id}>
                  <span>{eventsByType[row.event_type]?.label || human(row.event_type)}</span>
                  <Button variant="quiet" size="compact" disabled={busy} onClick={() => setSubscription(connector, row.event_type, false)}>
                    Turn off
                  </Button>
                </div>
              ))}
              {!providerSubscriptions.some((row) => row.active) ? <span className="ev2i-empty-copy">No event notifications enabled yet.</span> : null}
            </div>
          </DataPanel> : null}
        </Surface>;
      })}

      {!providers.length ? <StatePanel
        state="configuration"
        title="No provider adapters are enabled"
        description="Approved provider definitions will appear here when the secure server adapter is available."
      /> : null}
    </section>

    <DataPanel
      eyebrow="Advanced"
      title="Connection and delivery diagnostics"
      supporting="Connection history, delivery queue and retry evidence are available for authorised troubleshooting."
      action={<Button variant="secondary" icon={advanced ? "collapse" : "expand"} onClick={() => setAdvanced((value) => !value)} aria-expanded={advanced}>
        {advanced ? "Hide diagnostics" : "Advanced diagnostics"}
      </Button>}
      className="ev2i-advanced"
    >
      {advanced ? <>
        <div className="ev2i-diagnostic-stats">
          <StatTile label="Pending" value={String(queueCounts.pending || 0)} icon="pending" />
          <StatTile label="Processing" value={String(queueCounts.processing || 0)} icon="refresh" />
          <StatTile label="Retry / failed" value={String(queueCounts.failed || 0)} icon="warning" tone="action" />
          <StatTile label="Delivered" value={String(queueCounts.delivered || 0)} icon="checkCircle" tone="success" />
        </div>

        <div className="ev2i-diagnostic-columns">
          <DataPanel title="Connection history" supporting="Attributable provider lifecycle events.">
            {connectionEvents.slice(0, 20).map((row) => <QueueRow
              key={row.id}
              icon="link"
              title={(connectorsById[row.connector_id]?.display_name || human(row.provider_key)) + " · " + stateLabel(row.to_state)}
              meta={stamp(row.created_at) + " · " + row.action + (row.safe_detail ? " · " + row.safe_detail : "")}
            />)}
            {!connectionEvents.length ? <StatePanel state="empty" title="No connection history yet" description="Provider lifecycle events will appear after an authorised connection action." /> : null}
          </DataPanel>

          <DataPanel title="Recent delivery attempts" supporting="Safe provider delivery evidence; raw CEAC event payloads are not exposed here.">
            {attempts.slice(0, 20).map((row) => <QueueRow
              key={row.id}
              icon="notification"
              title={(connectorsById[row.connector_id]?.display_name || "Provider") + " · " + human(row.outcome)}
              meta={"Attempt " + row.attempt_number + " · " + stamp(row.started_at) + (row.safe_message ? " · " + human(row.error_category || "Provider issue") + ": " + row.safe_message : "")}
            />)}
            {!attempts.length ? <StatePanel state="empty" title="No delivery attempts yet" description="Delivery evidence will appear after a subscribed CEAC event is processed." /> : null}
          </DataPanel>
        </div>
      </> : <StatePanel state="info" title="Diagnostics are collapsed" description="Open Advanced diagnostics only when connection or delivery troubleshooting is required." />}
    </DataPanel>

    <ModalDialog
      open={Boolean(connectProvider)}
      onClose={closeConnect}
      title={connectProvider ? "Connect " + connectProvider.display_name : "Connect provider"}
      description="Verify the Telegram bot and destination. The bot token is sent directly to the server flow and is never saved in browser-visible CEAC tables."
      footer={<>
        <Button variant="secondary" disabled={busy} onClick={closeConnect}>Cancel</Button>
        <Button busy={busy} disabled={busy || botToken.trim().length < 20 || !chatId.trim()} onClick={connect}>
          Verify & connect
        </Button>
      </>}
    >
      <div className="ev2i-connect-form">
        <InputField
          label="Bot token"
          help="Stored encrypted in Supabase Vault only after Telegram verifies the bot and destination. CEAC OS does not display it again."
          aria-label="Telegram bot token"
          type="password"
          autoComplete="off"
          value={botToken}
          onChange={(event) => setBotToken(event.target.value)}
        />
        <InputField
          label="Chat ID"
          help="The approved Telegram chat that should receive CEAC notifications."
          aria-label="Telegram chat ID"
          value={chatId}
          onChange={(event) => setChatId(event.target.value)}
        />
        <Surface variant="soft" padding="standard" className="ev2i-security-note">
          <CeacIcon name="lock" size="row" decorative />
          <span><strong>What will be sent</strong>A successful connection sends one test message. Future notifications contain a short CEAC event label and direct recipients back to CEAC OS for details.</span>
        </Surface>
      </div>
    </ModalDialog>

    <ConfirmDialog
      open={Boolean(disconnectTarget)}
      onClose={() => setDisconnectTarget(null)}
      onConfirm={() => disconnect(disconnectTarget)}
      title={disconnectTarget ? "Disconnect " + (disconnectTarget.display_name || "provider") + "?" : "Disconnect provider?"}
      description="CEAC OS will stop sending new provider notifications until this connection is verified again."
      confirmLabel="Disconnect"
      cancelLabel="Keep connected"
      danger
    />
  </div>;
}
