import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { dateOnly } from "../lib/time";
import { EmptyState, LoadingState, ProductNotice, SectionHeader, StatusDistribution } from "../components/bits";
import { humanError } from "../lib/productLanguage";

export default function AdminProjects({ me, scheduleMeeting }) {
  const [projects,setProjects]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(null);

  useEffect(()=>{load();},[me.org_id]);

  async function load(){
    setLoading(true); setError(null);
    try{
      const [projectResult,unitResult,objectiveResult,projectUnitResult]=await Promise.all([
        supabase.from("projects").select("id,name,status,lead_unit_id,starts_on,ends_on,purpose").eq("org_id",me.org_id).order("ends_on",{ascending:true,nullsFirst:false}),
        supabase.from("units").select("id,name").eq("org_id",me.org_id),
        supabase.from("objectives").select("id,project_id,status").eq("org_id",me.org_id),
        supabase.from("project_units").select("project_id,unit_id"),
      ]);
      const failed=[projectResult,unitResult,objectiveResult,projectUnitResult].find((row)=>row.error);
      if(failed) throw failed.error;
      const unitById=Object.fromEntries((unitResult.data||[]).map((unit)=>[unit.id,unit.name]));
      setProjects((projectResult.data||[]).map((project)=>{
        const objectives=(objectiveResult.data||[]).filter((row)=>row.project_id===project.id);
        const participating=(projectUnitResult.data||[]).filter((row)=>row.project_id===project.id).map((row)=>unitById[row.unit_id]).filter(Boolean);
        return {...project,leadUnit:unitById[project.lead_unit_id]||"No lead unit",participating,objectives};
      }));
    }catch(err){setError(humanError(err,"Projects could not be loaded."));}
    finally{setLoading(false);}
  }

  if(loading) return <div className="body"><LoadingState label="Loading organisation projects…" /></div>;

  const active=projects.filter((project)=>project.status==="active");
  const planned=projects.filter((project)=>project.status==="planned");
  const attention=projects.filter((project)=>project.objectives.some((row)=>["at_risk","not_met"].includes(row.status)));

  return <div className="body admin-projects">
    <div className="office-page-intro">
      <div className="eyebrow">Organisation delivery</div>
      <h1 className="h1">Projects</h1>
      <p className="screen-note">Organisation-wide project movement, objective status and participating units. Detailed unit execution remains in the unit workspace.</p>
    </div>
    {error&&<ProductNotice tone="error" title="Projects could not finish loading" action={<button className="btn btn-ghost btn-sm" onClick={load}>Try again</button>}>{error}</ProductNotice>}
    <section className="admin-project-summary">
      <div><b>{active.length}</b><span>active</span></div>
      <div><b>{planned.length}</b><span>planned</span></div>
      <div><b>{attention.length}</b><span>with objective attention</span></div>
      <div><b>{projects.length}</b><span>projects on record</span></div>
    </section>
    <SectionHeader eyebrow="Delivery" title="Project portfolio" count={projects.length} />
    {projects.length===0&&<EmptyState title="No projects recorded">Projects created by authorised managers will appear here.</EmptyState>}
    <div className="admin-project-grid">
      {projects.map((project)=>{
        const onTrack=project.objectives.filter((row)=>["on_track","met"].includes(row.status)).length;
        const atRisk=project.objectives.filter((row)=>row.status==="at_risk").length;
        const notMet=project.objectives.filter((row)=>row.status==="not_met").length;
        const other=Math.max(0,project.objectives.length-onTrack-atRisk-notMet);
        return <article className="admin-project-card" key={project.id}>
          <div className="admin-project-card-head"><div><span>{project.status}</span><strong>{project.name}</strong></div>{project.ends_on&&<small>Ends {dateOnly(project.ends_on)}</small>}</div>
          {project.purpose&&<p>{project.purpose}</p>}
          <div className="admin-project-meta"><span>Lead: {project.leadUnit}</span>{project.participating.length>0&&<span>Also: {project.participating.join(", ")}</span>}</div>
          {project.objectives.length>0?<StatusDistribution label={project.name+" objective status"} segments={[
            {key:"track",label:"On track / met",value:onTrack,tone:"success"},
            {key:"risk",label:"At risk",value:atRisk,tone:"attention"},
            {key:"not-met",label:"Not met",value:notMet,tone:"danger"},
            {key:"other",label:"Other",value:other,tone:"neutral"},
          ]}/>:<small className="admin-project-no-objectives">No objectives recorded for this project.</small>}
          <button className="btn btn-ghost btn-sm" onClick={()=>scheduleMeeting?.({scope:"project",projectId:project.id,title:project.name+" meeting"})}>Schedule project meeting</button>
        </article>;
      })}
    </div>
  </div>;
}
