import { useEffect, useState } from "react";
import { supabase, loadMe } from "./lib/supabase";
import { openSession } from "./lib/session";
import SignIn from "./screens/SignIn";
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
import { Tabs, SideNav } from "./components/bits";

export default function App() {
  const [me, setMe] = useState(null);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState("home");
  const [itemId, setItemId] = useState(null);
  const [goalId, setGoalId] = useState(null);
  const [assigning, setAssigning] = useState(null);
  const [person, setPerson] = useState(null);
  const [projectId, setProjectId] = useState(null);
  const [session, setSession] = useState(null);

  useEffect(() => {
    boot();
    const { data: sub } = supabase.auth.onAuthStateChange(() => boot());
    return () => sub.subscription.unsubscribe();
  }, []);

  async function boot() {
    const m = await loadMe();
    setMe(m);
    if (m) setSession(await openSession(m.org_id, m.id));
    setReady(true);
  }

  function go(t) { setItemId(null); setGoalId(null); setAssigning(null); setPerson(null); setProjectId(null); setTab(t); }

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

  if (!ready) return <div className="spin">Loading...</div>;
  if (!me) return <SignIn />;

  const isAdmin = me.is_admin || me.is_exec;
  const isUnitManager = !isAdmin && me.role === "manager";
  const isManager = isAdmin || isUnitManager;
  const overlay = itemId || assigning || goalId || person || projectId;

  function startAssignment(context = {}) {
    if (context.projectId) setProjectId(context.projectId);
    setAssigning(context);
  }

  function pageForTab() {
    if (tab === "home") {
      if (me.is_exec) return <ExecutiveHome me={me} />;
      if (me.is_admin) return <AdminHome me={me} openItem={setItemId} openSettings={() => go("settings")} openUnits={() => go("units")} />;
      if (isManager) return <ManagerHome me={me} openItem={setItemId} openProject={setProjectId} openPerson={(id, focus) => setPerson({ id, focus })} goAssign={() => startAssignment()} />;
      return <Home me={me} session={session} setSession={setSession} openItem={setItemId} />;
    }
    if (tab === "team") return isManager ? <Team me={me} openPerson={(id, focus) => setPerson({ id, focus })} goAssign={startAssignment} /> : <StaffTeam me={me} />;
    if (tab === "work") return <Work me={me} isManager={isUnitManager} openItem={setItemId} />;
    if (tab === "projects" && isUnitManager) return <ManagerProjects me={me} openItem={setItemId} goAssign={startAssignment} />;
    if (tab === "calendar" && isUnitManager) return <ManagerCalendar me={me} openItem={setItemId} openProject={setProjectId} openPerson={(id, focus) => setPerson({ id, focus })} />;
    if (tab === "manager-finance" && isUnitManager) return <ManagerFinance me={me} openProject={setProjectId} />;
    if (tab === "manager-reports" && isUnitManager) return <ManagerReports me={me} openItem={setItemId} openProject={setProjectId} />;
    if (tab === "record") return <Record me={me} />;
    if (tab === "cost") return <Cost me={me} />;
    if (tab === "finance") return <Finance me={me} />;
    if (tab === "reporting" && isAdmin) return <Reports me={me} />;
    if (tab === "attendance" && isAdmin) return <Attendance me={me} />;
    if (tab === "people" && isAdmin) return <People me={me} openItem={setItemId} />;
    if (tab === "units" && isAdmin) return <Units me={me} openItem={setItemId} />;
    if (tab === "settings" && isAdmin) return <OfficeSettings me={me} />;
    return <MeScreen me={me} openGoal={setGoalId} />;
  }

  const appModeClass = isUnitManager ? "manager-app" : !isAdmin ? "staff-app" : "office-app";

  return (
    <div className={`app ${appModeClass}`}>
      <SideNav tab={tab} setTab={go} me={me} isAdmin={isAdmin} isManager={isUnitManager} onUnitChange={switchUnit} />
      {!isAdmin && (me.memberships?.length || 0) > 1 && <div className="mobile-unit-switch">
        <select aria-label="Current unit" value={me.unit_id || ""} onChange={(event) => switchUnit(event.target.value)}>
          {me.memberships.map((membership) => <option key={membership.unit_id} value={membership.unit_id}>
            {membership.unit_name || "Unit"} · {membership.role === "manager" ? "Manager" : "Staff"}
          </option>)}
        </select>
      </div>}
      {itemId ? <Item id={itemId} me={me} session={session} isManager={isUnitManager} back={() => setItemId(null)} />
        : assigning ? <Assign me={me} initialProjectId={assigning.projectId} initialObjectiveId={assigning.objectiveId} initialPhaseId={assigning.phaseId} initialSubTeamId={assigning.subTeamId} back={() => setAssigning(null)} />
        : projectId && isUnitManager ? <ManagerProjects me={me} initialProjectId={projectId} openItem={setItemId} goAssign={startAssignment} back={() => setProjectId(null)} />
        : goalId ? <Goals id={goalId} me={me} back={() => setGoalId(null)} />
        : person && isManager ? <PersonDetail me={me} profileId={person.id} focus={person.focus} openItem={setItemId} openProject={setProjectId} back={() => setPerson(null)} />
        : pageForTab()}
      {!overlay && <Tabs tab={tab} setTab={go} isManager={isUnitManager} />}
    </div>);
}
