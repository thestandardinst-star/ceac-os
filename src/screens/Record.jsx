import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
export default function Record({ me }) {
  const [s, setS] = useState(null);
  useEffect(() => { load(); }, [me.id]);
  async function load() {
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0);
    const { data: items } = await supabase.from("work_items")
      .select("id, status, origin, due_at, completed_at, first_time_approved")
      .eq("assignee_id", me.id).eq("visibility", "unit");
    const { data: sessions } = await supabase.from("work_sessions")
      .select("started_at, ended_at, place").eq("profile_id", me.id).gte("started_at", monthStart.toISOString());
    const { data: blocked } = await supabase.from("blockers").select("id").eq("claimed_by", me.id);
    const done = (items || []).filter((i) => i.status === "completed");
    const minutes = (sessions || []).reduce((sum, x) => {
      const end = x.ended_at ? new Date(x.ended_at).getTime() : Date.now();
      return sum + Math.max(0, (end - new Date(x.started_at).getTime()) / 60000);
    }, 0);
    setS({
      completed: done.length,
      assigned: done.filter((i) => i.origin === "assigned").length,
      self: done.filter((i) => i.origin === "self_created").length,
      onTime: done.filter((i) => i.due_at && i.completed_at && new Date(i.completed_at) <= new Date(i.due_at)).length,
      firstTime: done.filter((i) => i.first_time_approved).length,
      blocked: blocked ? blocked.length : 0,
      days: new Set((sessions || []).map((x) => new Date(x.started_at).toDateString())).size,
      hours: Math.floor(minutes / 60), mins: Math.round(minutes % 60),
      office: (sessions || []).filter((x) => x.place === "office").length,
    });
  }
  if (!s) return <div className="spin">Loading...</div>;
  function Row({ l, v }) {
    return (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "11px 0", borderTop: "1px solid var(--line-soft)" }}>
        <span style={{ fontSize: 13.5, color: "var(--ink-soft)" }}>{l}</span>
        <span style={{ fontSize: 16, fontWeight: 600 }}>{v}</span>
      </div>);
  }
  return (
    <div className="body">
      <div style={{ paddingTop: 26 }}>
        <h1 className="h1">My record</h1>
        <p className="screen-note">Your own evidence, built from work you actually did. Nobody is compared with anybody.</p>
      </div>
      <div className="split" style={{ marginTop: 4 }}>
        <div className="main-col">
          <div className="sec"><span>Work</span></div>
          <div className="card" style={{ padding: "4px 15px" }}>
            <Row l="Finished" v={s.completed} />
            <Row l="  given to you" v={s.assigned} />
            <Row l="  you added yourself" v={s.self} />
            <Row l="On time" v={s.onTime + " of " + s.completed} />
            <Row l="Approved first time" v={s.firstTime + " of " + s.completed} />
            <Row l="Times you were stuck on someone" v={s.blocked} />
          </div>
        </div>
        <div className="side-col">
          <div className="sec"><span>Time this month</span></div>
          <div className="card" style={{ padding: "4px 15px" }}>
            <Row l="Days worked" v={s.days} />
            <Row l="Hours on the platform" v={s.hours + "h " + s.mins + "m"} />
            <Row l="Sessions started at the office" v={s.office} />
          </div>
          <p className="small" style={{ marginTop: 10, lineHeight: 1.5 }}>
            Hours are a record of activity, not a basis for pay. Your location is recorded once,
            when you tap Start work, and not again until the next time you start.
          </p>
        </div>
      </div>
    </div>);
}
