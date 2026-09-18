import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { dateOnly } from "../lib/time";

export default function StaffTeam({ me }) {
  const [team, setTeam] = useState([]);
  const [onLeave, setOnLeave] = useState([]);
  const [birthdays, setBirthdays] = useState([]);
  useEffect(() => { load(); }, [me.unit_id]);
  async function load() {
    if (!me.unit_id) return;
    const { data: m } = await supabase.from("unit_memberships")
      .select("role, profiles(id, full_name, email, job_title, birthday)")
      .eq("unit_id", me.unit_id);
    setTeam(m || []);
    const today = new Date().toISOString().slice(0, 10);
    const weekEnd = new Date(); weekEnd.setDate(weekEnd.getDate() + 7);
    const { data: lv } = await supabase.from("leave_requests")
      .select("start_date, end_date, kind, profiles(full_name)")
      .eq("status", "approved").lte("start_date", weekEnd.toISOString().slice(0, 10)).gte("end_date", today);
    setOnLeave(lv || []);
    const bdays = (m || []).map((x) => x.profiles).filter((p) => p && p.birthday)
      .map((p) => {
        const bd = new Date(p.birthday);
        const now = new Date();
        const thisYr = new Date(now.getFullYear(), bd.getMonth(), bd.getDate());
        if (thisYr < now) thisYr.setFullYear(thisYr.getFullYear() + 1);
        return { name: p.full_name, date: thisYr, month: bd.getMonth(), day: bd.getDate() };
      })
      .sort((a, b) => a.date - b.date).slice(0, 5);
    setBirthdays(bdays);
  }
  return (
    <div className="body">
      <div style={{ paddingTop: 26 }}>
        <div className="eyebrow">{me.unit_name}</div>
        <h1 className="h1" style={{ marginTop: 6 }}>Team</h1>
        <p className="screen-note">Who is in the unit, who is off, what is coming up. Not about work.</p>
      </div>
      <div className="split" style={{ marginTop: 8 }}>
        <div className="main-col">
          <div className="sec"><span>Away this week</span><span>{onLeave.length}</span></div>
          {onLeave.length === 0 && <div className="card small">Nobody is on leave this week.</div>}
          {onLeave.map((l, i) => (
            <div key={i} className="row">
              <div className="row-t">{l.profiles ? l.profiles.full_name : "—"}</div>
              <div className="row-m">{dateOnly(l.start_date)} — {dateOnly(l.end_date)} · {l.kind} leave</div>
            </div>))}
          <div className="sec"><span>Unit files</span></div>
          <div className="card small" style={{ lineHeight: 1.5 }}>
            Shared files for the unit — house colour profile, run sheets, templates — will live here. Coming next.
          </div>
        </div>
        <div className="side-col">
          <div className="sec"><span>Directory</span><span>{team.length}</span></div>
          {team.map((p) => (
            <div key={p.profiles && p.profiles.id} className="row">
              <div className="row-t">{p.profiles ? p.profiles.full_name : "—"}</div>
              <div className="row-m">{p.role === "manager" ? "Unit head" : p.role === "sub_team_lead" ? "Team lead" : "Staff"} · {p.profiles ? p.profiles.email : ""}</div>
            </div>))}
          <div className="sec"><span>Upcoming birthdays</span></div>
          {birthdays.length === 0 && <div className="card small">No birthdays on record yet. Admin will add them.</div>}
          {birthdays.map((b, i) => (
            <div key={i} className="row">
              <div className="row-t">{b.name}</div>
              <div className="row-m">{new Date(2000, b.month, b.day).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}</div>
            </div>))}
        </div>
      </div>
    </div>);
}
