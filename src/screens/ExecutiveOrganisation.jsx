import { useEffect,useState } from "react";
import { supabase } from "../lib/supabase";
import { LoadingState,ProductNotice } from "../components/bits";
import { humanError } from "../lib/productLanguage";
export default function ExecutiveOrganisation({me}){
 const [units,setUnits]=useState([]),[people,setPeople]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState(null);
 useEffect(()=>{load();},[me.org_id]);
 async function load(){setLoading(true);setError(null);try{const [u,p]=await Promise.all([
  supabase.from("units").select("id,name,code,active").eq("org_id",me.org_id).order("name"),
  supabase.from("unit_memberships").select("unit_id,role,profiles(id,full_name,job_title,active)").eq("org_id",me.org_id)
 ]);if(u.error||p.error)throw u.error||p.error;setUnits(u.data||[]);setPeople(p.data||[]);}catch(e){setError(humanError(e,"Organisation could not be loaded."));}finally{setLoading(false);}}
 return <div className="body premium-exec-page"><header className="exec-page-head"><div><span className="eyebrow">Leadership view</span><h1 className="h1">Organisation</h1><p className="screen-note">Departments, leaders and active people. Administration remains responsible for changing organisation records.</p></div></header>
 {error&&<ProductNotice tone="error" title="Could not load Organisation">{error}</ProductNotice>}{loading?<LoadingState label="Loading organisation…"/>:<section className="exec-org-grid">{units.filter(u=>u.active!==false).map(u=>{const members=people.filter(p=>p.unit_id===u.id&&p.profiles?.active!==false);const leaders=members.filter(p=>p.role==="manager");return <article key={u.id}><div className="exec-org-icon">{u.name.slice(0,1)}</div><div><strong>{u.name}</strong><small>{leaders.map(x=>x.profiles?.full_name).filter(Boolean).join(", ")||"Leader not recorded"}</small></div><b>{members.length}<span> people</span></b></article>})}</section>}
 </div>;
}