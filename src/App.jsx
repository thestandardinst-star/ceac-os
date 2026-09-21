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
import AdminHome from "./screens/AdminHome";
import Units from "./screens/Units";
import People from "./screens/People";
import Attendance from "./screens/Attendance";
import Cost from "./screens/Cost";
import Finance from "./screens/Finance";
import Reports from "./screens/Reports";
import ExecutiveHome from "./screens/ExecutiveHome";
import Assign from "./screens/Assign";
import Team from "./screens/Team";
import PersonDetail from "./screens/PersonDetail";
import StaffTeam from "./screens/StaffTeam";
import OfficeSettings from "./screens/OfficeSettings";
import Goals from "./screens/Goals";
import ManagerProjects from "./screens/ManagerProjects";
import ManagerCalendar from "./screens/ManagerCalendar";
import ManagerFinance from "./screens/ManagerFinance";
import ManagerReports from "./screens/ManagerReports";
import Announcements from "./screens/Announcements";
import Room from "./screens/Room";
import Meeting from "./screens/Meeting";
import MeetingScheduler from "./components/MeetingScheduler";
import { MobileTopBar, Tabs, SideNav } from "./components/bits";
import AuthFrame from "./components/AuthFrame";

export default function App() {
  const [me, setMe] = useState(null);
  const [ready, setReady] = useState(false);
  const [bootError, setBootError] = useState(null);
  const [tab, setTab] = useState("home");
  const [itemId, setItemId] = useState(null);
  const [goalId, setGoalId] = useState(null);
  const [assigning, setAssigning] = useState(null);
  const [person, setPerson] = useState(null);
  const [projectId, setProjectId] = useState(null);
  const [roomContext, setRoomContext] = useState(null);
  const [meetingId, setMeetingId] = useState(null);
  const [meetingDraft, setMeetingDraft] = useState(null);
  const [session, setSession] = useState(null);

  useEffect(() => {
    boot();
    const { data: sub } = supabase.auth.onAuthStateChange(() => boot());
    return () => sub.subscription.unsubscribe();
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

  function go(t) { setItemId(null); setGoalId(null); setAssigning(null); setPerson(null); setProjectId(null); setRoomContext(null); setMeetingId(null); setMeetingDraft(null); setTab(t); }

  function openRoom(context, returnTo = null) {
    setRoomContext({ ...context, returnTo });
    if (returnTo?.type === "item") setItemId(null);
    if (returnTo?.type === "project") setProjectId(null);
  }

  function closeRoom() {
    const returnTo = roomContext?.returnTo;
    setRoomContext(null);
    if (returnTo?.type === "item") setItemId(returnTo.id);
    if (returnTo?.type === "project") setProjectId(returnTo.id);
  }

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
      if (me.is_exec) return <ExecutiveHome me={me} openMeeting={setMeetingId} scheduleMeeting={startMeeting} />;
      if (me.is_admin) return <AdminHome me={me} openItem={setItemId} openMeeting={setMeetingId} scheduleMeeting={startMeeting} openSettings={() => go("settings")} openUnits={() => go("units")} />;
      if (isManager) return <ManagerHome me={me} openItem={setItemId} openProject={setProjectId} openMeeting={setMeetingId} openPerson={(id, focus) => setPerson({ id, focus })} goAssign={() => startAssignment()} />;
      return <Home me={me} session={session} setSession={setSession} openItem={setItemId} openMeeting={setMeetingId} openRoom={(context) => openRoom(context)} openWork={() => go("work")} openMe={() => go("me")} openAnnouncements={() => go("announcements")} />;
    }
    if (tab === "team") return isManager
      ? <Team me={me} openPerson={(id, focus) => setPerson({ id, focus })} goAssign={startAssignment} openRoom={() => openRoom({ kind: "unit", unitId: me.unit_id })} />
      : <StaffTeam me={me} openRoom={() => openRoom({ kind: "unit", unitId: me.unit_id })} />;
    if (tab === "work") return <Work me={me} isManager={isUnitManager} openItem={setItemId} />;
    if (tab === "projects" && isUnitManager) return <ManagerProjects me={me} openItem={setItemId} goAssign={startAssignment} openMeeting={setMeetingId} scheduleMeeting={startMeeting} openRoom={(projectId, reference) => openRoom({ kind: "project", projectId, reference }, { type: "project", id: projectId })} />;
    if (tab === "calendar" && isUnitManager) return <ManagerCalendar me={me} openItem={setItemId} openProject={setProjectId} openMeeting={setMeetingId} scheduleMeeting={startMeeting} openPerson={(id, focus) => setPerson({ id, focus })} />;
    if (tab === "manager-finance" && isUnitManager) return <ManagerFinance me={me} openProject={setProjectId} />;
    if (tab === "manager-reports" && isUnitManager) return <ManagerReports me={me} openItem={setItemId} openProject={setProjectId} />;
    if (tab === "record") return <Record me={me} openItem={setItemId} />;
    if (tab === "announcements") return <Announcements me={me} back={() => go("home")} />;
    if (tab === "cost" && isAdmin) return <Cost me={me} />;
    if (tab === "finance" && isAdmin) return <Finance me={me} />;
    if (tab === "reporting" && isAdmin) return <Reports me={me} />;
    if (tab === "attendance" && isAdmin) return <Attendance me={me} />;
    if (tab === "people" && isAdmin) return <People me={me} openItem={setItemId} />;
    if (tab === "units" && isAdmin) return <Units me={me} openItem={setItemId} />;
    if (tab === "settings" && isAdmin) return <OfficeSettings me={me} />;
    return <MeScreen me={me} openGoal={setGoalId} />;
  }

  const appModeClass = isExec ? "executive-app" : isUnitManager ? "manager-app" : (!isAdmin ? "staff-app" : "office-app");

  return (
    <div className={`app ${appModeClass}`}>
      <MobileTopBar me={me} roleLabel={isExec ? "Group Pastor" : isAdmin ? "Administration" : isUnitManager ? "Manager" : "Staff"} />
      <SideNav tab={tab} setTab={go} me={me} isAdmin={isAdmin} isExec={isExec} isManager={isUnitManager} onUnitChange={switchUnit} />
      {!isAdmin && (me.memberships?.length || 0) > 1 && <div className="mobile-unit-switch">
        <select aria-label="Current unit" value={me.unit_id || ""} onChange={(event) => switchUnit(event.target.value)}>
          {me.memberships.map((membership) => <option key={membership.unit_id} value={membership.unit_id}>
            {membership.unit_name || "Unit"} · {membership.role === "manager" ? "Manager" : "Staff"}
          </option>)}
        </select>
      </div>}
      {itemId ? <Item id={itemId} me={me} session={session} isManager={isUnitManager} openRoom={(context) => openRoom(context, { type: "item", id: itemId })} back={() => setItemId(null)} />
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
        : projectId && isUnitManager ? <ManagerProjects me={me} initialProjectId={projectId} openItem={setItemId} goAssign={startAssignment} openMeeting={setMeetingId} scheduleMeeting={startMeeting} openRoom={(id, reference) => openRoom({ kind: "project", projectId: id, reference }, { type: "project", id })} back={() => setProjectId(null)} />
        : goalId ? <Goals id={goalId} me={me} back={() => setGoalId(null)} />
        : person && isManager ? <PersonDetail me={me} profileId={person.id} focus={person.focus} openItem={setItemId} openProject={setProjectId} back={() => setPerson(null)} />
        : roomContext ? <Room me={me} context={roomContext} back={closeRoom} openItem={setItemId} openProject={setProjectId} scheduleMeeting={startMeeting} openAnnouncements={() => go("announcements")} />
        : meetingDraft ? <MeetingScheduler me={me} context={meetingDraft} onClose={() => setMeetingDraft(null)} onCreated={(id) => { setMeetingDraft(null); setMeetingId(id); }} />
        : meetingId ? <Meeting me={me} meetingId={meetingId} back={() => setMeetingId(null)} goAssign={startAssignment} openItem={setItemId} openProject={setProjectId} />
        : pageForTab()}
      {!overlay && <Tabs tab={tab} setTab={go} isManager={isUnitManager} isExec={isExec} isAdmin={isAdmin} />}
    </div>);
}
