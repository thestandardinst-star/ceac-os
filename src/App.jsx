import { useEffect, useState } from "react";
import { supabase, loadMe } from "./lib/supabase";
import { openSession } from "./lib/session";
import SignIn from "./screens/SignIn";
import AccountPassword from "./screens/AccountPassword";
import Home from "./screens/Home";
import Work from "./screens/Work";
import Item from "./screens/Item";
import Record from "./screens/Record";
import MeScreen from "./screens/Me";
import ManagerHome from "./screens/ManagerHome";
import ManagerWork from "./screens/ManagerWork";
import AdminHome from "./screens/AdminHome";
import AdminWork from "./screens/AdminWork";
import Units from "./screens/Units";
import People from "./screens/People";
import Workforce from "./screens/Workforce";
import Cost from "./screens/Cost";
import Finance from "./screens/Finance";
import Reports from "./screens/Reports";
import ExecutiveHome from "./screens/ExecutiveHome";
import ExecutiveWork from "./screens/ExecutiveWork";
import ExecutiveOrganisation from "./screens/ExecutiveOrganisation";
import ExecutiveFinance from "./screens/ExecutiveFinance";
import ExecutiveReports from "./screens/ExecutiveReports";
import Assign from "./screens/Assign";
import Team from "./screens/Team";
import PersonDetail from "./screens/PersonDetail";
import StaffTeam from "./screens/StaffTeam";
import StaffCalendar from "./screens/StaffCalendar";
import Inbox from "./screens/Inbox";
import OfficeSettings from "./screens/OfficeSettings";
import ControlCenter from "./screens/ControlCenter";
import AdminProjects from "./screens/AdminProjects";
import AdminCalendar from "./screens/AdminCalendar";
import AdminAudit from "./screens/AdminAudit";
import AdminAuthority from "./screens/AdminAuthority";
import AdminEvents from "./screens/AdminEvents";
import AdminWorkflows from "./screens/AdminWorkflows";
import AdminPolicies from "./screens/AdminPolicies";
import AdminIntegrations from "./screens/AdminIntegrations";
import AdminLifecycle from "./screens/AdminLifecycle";
import AdminProtectedHR from "./screens/AdminProtectedHR";
import Goals from "./screens/Goals";
import Strategy from "./screens/Strategy";
import Delivery from "./screens/Delivery";
import ResourceWorkload from "./screens/ResourceWorkload";
import Performance from "./screens/Performance";
import Learning from "./screens/Learning";
import Assets from "./screens/Assets";
import Compliance from "./screens/Compliance";
import ManagerProjects from "./screens/ManagerProjects";
import ManagerCalendar from "./screens/ManagerCalendar";
import ManagerFinance from "./screens/ManagerFinance";
import ManagerReports from "./screens/ManagerReports";
import Announcements from "./screens/Announcements";
import Room from "./screens/Room";
import Meeting from "./screens/Meeting";
import MeetingScheduler from "./components/MeetingScheduler";
import { AppTopBar, MobileTopBar, Tabs, SideNav } from "./components/PremiumShell";
import AuthFrame from "./components/AuthFrame";

function routeFromLocation() {
  const params = new URLSearchParams(window.location.search);
  const roomKind = params.get("roomKind");
  const roomId = params.get("room");
  let roomContext = null;
  if (roomKind && roomId) {
    if (roomKind === "unit") roomContext = { kind: "unit", unitId: roomId };
    if (roomKind === "sub_team") roomContext = { kind: "sub_team", subTeamId: roomId };
    if (roomKind === "project") roomContext = { kind: "project", projectId: roomId };
  }
  return {
    tab: params.get("tab") || "home",
    itemId: params.get("item"),
    projectId: params.get("project"),
    meetingId: params.get("meeting"),
    roomContext,
  };
}

export default function App() {
  const [me, setMe] = useState(null);
  const [ready, setReady] = useState(false);
  const [bootError, setBootError] = useState(null);
  const initialRoute = routeFromLocation();
  const [tab, setTab] = useState(initialRoute.tab);
  const [itemId, setItemId] = useState(initialRoute.itemId);
  const [goalId, setGoalId] = useState(null);
  const [assigning, setAssigning] = useState(null);
  const [person, setPerson] = useState(null);
  const [projectId, setProjectId] = useState(initialRoute.projectId);
  const [roomContext, setRoomContext] = useState(initialRoute.roomContext);
  const [meetingId, setMeetingId] = useState(initialRoute.meetingId);
  const [meetingDraft, setMeetingDraft] = useState(null);
  const [session, setSession] = useState(null);

  useEffect(() => {
    boot();
    const { data: sub } = supabase.auth.onAuthStateChange(() => boot());
    const onPopState = () => applyRoute(routeFromLocation());
    window.addEventListener("popstate", onPopState);
    return () => {
      sub.subscription.unsubscribe();
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  async function boot() {
    setBootError(null);
    try {
      const m = await loadMe();
      setMe(m);
      if (m) setSession(await openSession(m.org_id, m.id));
      else setSession(null);
    } catch (error) {
      setMe(null);
      setSession(null);
      setBootError(error.message || "CEAC could not load your account.");
    } finally {
      setReady(true);
    }
  }

  function applyRoute(route) {
    setTab(route.tab || "home");
    setItemId(route.itemId || null);
    setProjectId(route.projectId || null);
    setMeetingId(route.meetingId || null);
    setRoomContext(route.roomContext || null);
    setGoalId(null);
    setAssigning(null);
    setPerson(null);
    setMeetingDraft(null);
  }

  function navigate(route, { replace = false } = {}) {
    const next = {
      tab: route.tab || tab || "home",
      itemId: route.itemId || null,
      projectId: route.projectId || null,
      meetingId: route.meetingId || null,
      roomContext: route.roomContext || null,
    };
    const params = new URLSearchParams();
    if (next.tab !== "home") params.set("tab", next.tab);
    if (next.itemId) params.set("item", next.itemId);
    if (next.projectId) params.set("project", next.projectId);
    if (next.meetingId) params.set("meeting", next.meetingId);
    if (next.roomContext) {
      const kind = next.roomContext.kind;
      const id = kind === "unit" ? next.roomContext.unitId
        : kind === "sub_team" ? next.roomContext.subTeamId
        : next.roomContext.projectId;
      if (kind && id) {
        params.set("roomKind", kind);
        params.set("room", id);
      }
    }
    const query = params.toString();
    const url = window.location.pathname + (query ? `?${query}` : "");
    window.history[replace ? "replaceState" : "pushState"]({ ceacRoute: true }, "", url);
    applyRoute(next);
  }

  function closeUrlOverlay() {
    if (window.history.state?.ceacRoute) window.history.back();
    else navigate({ tab }, { replace: true });
  }

  function go(t) { navigate({ tab: t }); }
  function openItem(id) { navigate({ tab, itemId: id }); }
  function openProject(id) { navigate({ tab, projectId: id }); }
  function openMeeting(id) { navigate({ tab, meetingId: id }); }

  function openRoom(context) {
    navigate({ tab, roomContext: context });
  }

  function closeRoom() { closeUrlOverlay(); }

  function switchUnit(unitId) {
    const membership = me?.memberships?.find((entry) => entry.unit_id === unitId);
    if (!membership || membership.unit_id === me.unit_id) return;
    localStorage.setItem(`ceac-unit:${me.id}`, membership.unit_id);
    setMe((current) => ({
      ...current,
      unit_id: membership.unit_id,
      unit_name: membership.unit_name,
      role: membership.role,
    }));
    go("home");
  }

  const authPath = window.location.pathname;
  if (authPath === "/activate" || authPath === "/reset-password") {
    return <AccountPassword
      mode={authPath === "/activate" ? "activate" : "recover"}
      onDone={() => {
        window.history.replaceState({}, "", "/");
        boot();
      }}
    />;
  }

  if (!ready) return <div className="auth-boot"><span className="auth-boot-mark">CEAC</span><span>Opening your workspace…</span></div>;
  if (bootError && !me) return <AuthFrame eyebrow="Connection problem" title="Could not load your account" description="CEAC OS could not finish opening your secure workspace.">
    <div className="auth-message error">{bootError}</div>
    <button className="auth-primary" onClick={boot}><span>Try again</span><span aria-hidden="true">→</span></button>
  </AuthFrame>;
  if (!me) return <SignIn />;

  const isAdmin = Boolean(me.is_admin);
  const isExec = Boolean(me.is_exec);
  const isUnitManager = !isAdmin && !isExec && me.role === "manager";
  const isStaff = !isAdmin && !isExec && !isUnitManager;
  const isManager = isAdmin || isUnitManager;
  const hasCapability = (capability) => (me.capabilities || []).includes(capability);
  const hasOrgCapability = (capability) => (me.capability_grants || []).some((grant) =>
    grant.capability === capability && !grant.scope_unit_id
  );
  const canManagePeople = hasCapability("people.manage");
  const canViewAudit = hasCapability("audit.view");
  const canManageAuthority = hasCapability("authority.manage");
  const canUseWorkflows = canViewAudit || canManagePeople || canManageAuthority;
  const canManageIntegrations = hasCapability("integration.manage");
  const canAccessProtectedHR = hasCapability("hr_private.access");
  const canUseDelivery = isAdmin || isExec || isUnitManager || hasCapability("delivery.manage");
  const canUseWorkload = isUnitManager || hasCapability("resource.manage");
  const canUsePerformance = !isExec && (isStaff || isUnitManager || hasOrgCapability("performance.admin"));
  const canUseLearning = !isExec && (isStaff || isUnitManager || hasOrgCapability("learning.manage"));
  const canUseWorkforce = !isExec && (isStaff || isUnitManager || hasOrgCapability("workforce.manage") || hasOrgCapability("attendance.correct"));
  const canUseAssets = !isExec && (isStaff || isUnitManager || hasOrgCapability("asset.manage"));
  const canUseCompliance = !isExec && (isStaff || isUnitManager || hasOrgCapability("compliance.manage"));
  const overlay = itemId || assigning || goalId || person || projectId || roomContext || meetingId || meetingDraft;

  function startAssignment(context = {}) {
    if (context.projectId) setProjectId(context.projectId);
    setAssigning(context);
  }

  function startMeeting(context = {}) {
    setMeetingDraft(context);
  }

  function pageForTab() {
    if (tab === "home") {
      if (me.is_exec) return <ExecutiveHome me={me} openMeeting={openMeeting} scheduleMeeting={startMeeting} />;
      if (me.is_admin) return <AdminHome me={me} openItem={openItem} openMeeting={openMeeting} scheduleMeeting={startMeeting} openSettings={() => go("settings")} openUnits={() => go("units")} />;
      if (isManager) return <ManagerHome me={me} openItem={openItem} openProject={openProject} openMeeting={openMeeting} scheduleMeeting={startMeeting} openPerson={(id, focus) => setPerson({ id, focus })} goAssign={() => startAssignment()} />;
      return <Home me={me} session={session} setSession={setSession} openItem={openItem} openMeeting={openMeeting} openRoom={openRoom} openWork={() => go("work")} openMe={() => go("me")} openAnnouncements={() => go("announcements")} />;
    }
    if (tab === "team") return isManager
      ? <Team me={me} openPerson={(id, focus) => setPerson({ id, focus })} goAssign={startAssignment} openRoom={() => openRoom({ kind: "unit", unitId: me.unit_id })} />
      : <StaffTeam me={me} openRoom={() => openRoom({ kind: "unit", unitId: me.unit_id })} />;
    if (tab === "work") {
      if (isExec) return <ExecutiveWork me={me} openItem={openItem} goAssign={startAssignment} />;
      if (isAdmin) return <AdminWork me={me} openItem={openItem} goAssign={startAssignment} />;
      if (isUnitManager) return <ManagerWork me={me} openItem={openItem} goAssign={startAssignment} />;
      return <Work me={me} isManager={false} openItem={openItem} />;
    }
    if (tab === "staff-calendar" && isStaff) return <StaffCalendar me={me} openItem={openItem} openMeeting={openMeeting} />;
    if (tab === "messages") return <Inbox me={me} openRoom={openRoom} openAnnouncements={() => go("announcements")} />;
    if (tab === "projects" && isUnitManager) return <ManagerProjects me={me} openItem={openItem} goAssign={startAssignment} openMeeting={openMeeting} scheduleMeeting={startMeeting} openRoom={(projectId, reference) => openRoom({ kind: "project", projectId, reference })} />;
    if (tab === "calendar" && isUnitManager) return <ManagerCalendar me={me} openItem={openItem} openProject={openProject} openMeeting={openMeeting} scheduleMeeting={startMeeting} openPerson={(id, focus) => setPerson({ id, focus })} />;
    if (tab === "manager-finance" && isUnitManager) return <ManagerFinance me={me} openProject={openProject} />;
    if (tab === "manager-reports" && isUnitManager) return <ManagerReports me={me} openItem={openItem} openProject={openProject} />;
    if (tab === "exec-organisation" && isExec) return <ExecutiveOrganisation me={me} />;
    if (tab === "exec-finance" && isExec) return <ExecutiveFinance me={me} />;
    if (tab === "exec-reports" && isExec) return <ExecutiveReports me={me} />;
    if (tab === "record") return <Record me={me} openItem={openItem} />;
    if (tab === "announcements") return <Announcements me={me} back={() => go("home")} />;
    if (tab === "strategy") return <Strategy me={me} />;
    if (tab === "delivery" && canUseDelivery) return <Delivery me={me} />;
    if (tab === "workload" && canUseWorkload) return <ResourceWorkload me={me} />;
    if (tab === "performance" && canUsePerformance) return <Performance me={me} />;
    if (tab === "learning" && canUseLearning) return <Learning me={me} />;
    if (tab === "assets" && canUseAssets) return <Assets me={me} />;
    if (tab === "compliance" && canUseCompliance) return <Compliance me={me} />;
    if (tab === "cost" && isAdmin) return <Cost me={me} />;
    if (tab === "finance" && isAdmin) return <Finance me={me} openExpenses={() => go("cost")} />;
    if (tab === "reporting" && isAdmin) return <Reports me={me} />;
    if (tab === "attendance" && canUseWorkforce) return <Workforce me={me} />;
    if (tab === "people" && canManagePeople) return <People me={me} openItem={openItem} />;
    if (tab === "lifecycle" && canManagePeople) return <AdminLifecycle me={me} />;
    if (tab === "protected-hr" && canAccessProtectedHR) return <AdminProtectedHR me={me} />;
    if (tab === "units" && isAdmin) return <Units me={me} openItem={openItem} />;
    if (tab === "admin-projects" && isAdmin) return <AdminProjects me={me} scheduleMeeting={startMeeting} />;
    if (tab === "admin-calendar" && isAdmin) return <AdminCalendar me={me} openMeeting={openMeeting} scheduleMeeting={startMeeting} />;
    if (tab === "audit" && canViewAudit) return <AdminAudit me={me} />;
    if (tab === "events" && canViewAudit) return <AdminEvents me={me} />;
    if (tab === "workflows" && canUseWorkflows) return <AdminWorkflows me={me} />;
    if (tab === "policies" && canManageAuthority) return <AdminPolicies me={me} />;
    if (tab === "integrations" && canManageIntegrations) return <AdminIntegrations me={me} />;
    if (tab === "authority" && canManageAuthority) return <AdminAuthority me={me} refreshMe={boot} />;
    if (tab === "settings" && isAdmin) return <ControlCenter me={me} go={go} />;
    if (tab === "office-settings" && isAdmin) return <OfficeSettings me={me} openWorkforce={() => go("attendance")} />;
    return <MeScreen me={me} openGoal={setGoalId} openRecord={() => go("record")} openPerformance={() => go("performance")} openWorkforce={() => go("attendance")} openLearning={() => go("learning")} openAssets={() => go("assets")} openCompliance={() => go("compliance")} />;
  }

  const appModeClass = isExec ? "executive-app" : isUnitManager ? "manager-app" : (!isAdmin ? "staff-app" : "office-app");
  const roleLabel = isExec ? "Group Pastor" : isAdmin ? "Administration" : isUnitManager ? "Manager" : "Staff";

  return (
    <div className={`app ${appModeClass}`}>
      <SideNav tab={tab} setTab={go} me={me} isAdmin={isAdmin} isExec={isExec} isManager={isUnitManager} onUnitChange={switchUnit} onMessages={() => go("messages")} />
      <div className="app-workspace">
        <MobileTopBar me={me} roleLabel={roleLabel} onProfile={() => go("me")} onMessages={() => go("messages")} />
        <AppTopBar me={me} roleLabel={roleLabel} tab={tab} onProfile={() => go("me")} onNavigate={go} isAdmin={isAdmin} isExec={isExec} isManager={isUnitManager} onMessages={() => go("messages")} onComposeMessage={() => me.unit_id ? openRoom({ kind:"unit", unitId:me.unit_id }) : go("messages")} onCreateWork={isManager ? () => startAssignment() : () => go("work")} onCreateMeeting={() => startMeeting(isAdmin || isExec ? { scope:"organisation", organisation:true } : { scope:"unit", unitId:me.unit_id, unitName:me.unit_name })} />
        {!isAdmin && (me.memberships?.length || 0) > 1 && <div className="mobile-unit-switch">
          <select aria-label="Current unit" value={me.unit_id || ""} onChange={(event) => switchUnit(event.target.value)}>
            {me.memberships.map((membership) => <option key={membership.unit_id} value={membership.unit_id}>
              {membership.unit_name || "Unit"} · {membership.role === "manager" ? "Manager" : "Staff"}
            </option>)}
          </select>
        </div>}
        <main className="app-content">
          {itemId ? <Item id={itemId} me={me} session={session} isManager={isUnitManager} openRoom={openRoom} back={closeUrlOverlay} />
            : assigning ? <Assign me={me}
                initialProjectId={assigning.projectId}
                initialObjectiveId={assigning.objectiveId}
                initialPhaseId={assigning.phaseId}
                initialSubTeamId={assigning.subTeamId}
                initialMeetingId={assigning.meetingId}
                initialKind={assigning.kind}
                initialMeetingTitle={assigning.meetingTitle}
                initialMeetingOn={assigning.meetingOn}
                initialMeetingNote={assigning.meetingNote}
                back={() => setAssigning(null)} />
            : projectId && isUnitManager ? <ManagerProjects me={me} initialProjectId={projectId} openItem={openItem} goAssign={startAssignment} openMeeting={openMeeting} scheduleMeeting={startMeeting} openRoom={(id, reference) => openRoom({ kind: "project", projectId: id, reference })} back={closeUrlOverlay} />
            : goalId ? <Goals id={goalId} me={me} back={() => setGoalId(null)} />
            : person && isManager ? <PersonDetail me={me} profileId={person.id} focus={person.focus} openItem={openItem} openProject={openProject} back={() => setPerson(null)} />
            : roomContext ? <Room me={me} context={roomContext} back={closeRoom} openItem={openItem} openProject={openProject} scheduleMeeting={startMeeting} openAnnouncements={() => go("announcements")} onRoomChange={openRoom} />
            : meetingDraft ? <MeetingScheduler me={me} context={meetingDraft} onClose={() => setMeetingDraft(null)} onCreated={(id) => { setMeetingDraft(null); openMeeting(id); }} />
            : meetingId ? <Meeting me={me} meetingId={meetingId} back={closeUrlOverlay} goAssign={startAssignment} openItem={openItem} openProject={openProject} openRoom={openRoom} />
            : pageForTab()}
        </main>
        {!overlay && <Tabs tab={tab} setTab={go} isManager={isUnitManager} isExec={isExec} isAdmin={isAdmin} me={me} onMessages={() => go("messages")} />}
      </div>
    </div>);
}
