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
import ExecutiveHome from "./screens/ExecutiveHome";
import Assign from "./screens/Assign";
import Team from "./screens/Team";
import StaffTeam from "./screens/StaffTeam";
import OfficeSettings from "./screens/OfficeSettings";
import Goals from "./screens/Goals";
import { Tabs, SideNav } from "./components/bits";

export default function App() {
  const [me, setMe] = useState(null);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState("home");
  const [itemId, setItemId] = useState(null);
  const [goalId, setGoalId] = useState(null);
  const [assigning, setAssigning] = useState(false);
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

  function go(t) { setItemId(null); setGoalId(null); setAssigning(false); setTab(t); }

  if (!ready) return <div className="spin">Loading...</div>;
  if (!me) return <SignIn />;

  const isAdmin = me.is_admin || me.is_exec;
  const isUnitManager = !isAdmin && me.role === "manager";
  const isManager = isAdmin || isUnitManager;
  const overlay = itemId || assigning || goalId;

  function pageForTab() {
    if (tab === "home") {
      if (me.is_exec) return <ExecutiveHome me={me} />;
      if (me.is_admin) return <AdminHome me={me} openItem={setItemId} openSettings={() => go("settings")} openUnits={() => go("units")} />;
      if (isManager) return <ManagerHome me={me} openItem={setItemId} goAssign={() => setAssigning(true)} />;
      return <Home me={me} session={session} setSession={setSession} openItem={setItemId} />;
    }
    if (tab === "team") return isManager ? <Team me={me} /> : <StaffTeam me={me} />;
    if (tab === "work") return <Work me={me} isManager={isUnitManager} openItem={setItemId} />;
    if (tab === "record") return <Record me={me} />;
    if (tab === "cost") return <Cost me={me} />;
    if (tab === "finance") return <Finance me={me} />;
    if (tab === "attendance" && isAdmin) return <Attendance me={me} />;
    if (tab === "people" && isAdmin) return <People me={me} openItem={setItemId} />;
    if (tab === "units" && isAdmin) return <Units me={me} openItem={setItemId} />;
    if (tab === "settings" && isAdmin) return <OfficeSettings me={me} />;
    return <MeScreen me={me} openGoal={setGoalId} />;
  }

  return (
    <div className="app">
      <SideNav tab={tab} setTab={go} me={me} isAdmin={isAdmin} isManager={isUnitManager} />
      {itemId ? <Item id={itemId} me={me} session={session} isManager={isUnitManager} back={() => setItemId(null)} />
        : goalId ? <Goals id={goalId} me={me} back={() => setGoalId(null)} />
        : assigning ? <Assign me={me} back={() => setAssigning(false)} />
        : pageForTab()}
      {!overlay && <Tabs tab={tab} setTab={go} isManager={isUnitManager} />}
    </div>);
}
