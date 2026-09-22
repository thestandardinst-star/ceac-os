import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { EmptyState, FieldGroup, LoadingState, ProductNotice } from "../components/bits";
import { humanError } from "../lib/productLanguage";

function formatValue(def, value) {
  if (value === null || value === undefined) return "Not configured";
  if (def?.value_type === "boolean") return value ? "Yes" : "No";
  return String(value);
}

export default function AdminPolicies({ me }) {
  const [defs,setDefs]=useState([]);
  const [versions,setVersions]=useState([]);
  const [selected,setSelected]=useState(null);
  const [value,setValue]=useState("");
  const [effectiveOn,setEffectiveOn]=useState(new Date().toISOString().slice(0,10));
  const [reason,setReason]=useState("");
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState(null);
  const [notice,setNotice]=useState(null);

  useEffect(()=>{ load(); },[me.id]);

  async function load(){
    setLoading(true); setError(null);
    const [d,v]=await Promise.all([
      supabase.from("policy_rule_definitions").select("*").eq("active",true).order("domain").order("label"),
      supabase.from("policy_rule_versions").select("*").eq("org_id",me.org_id).order("effective_on",{ascending:false}).order("recorded_at",{ascending:false}),
    ]);
    const e=d.error||v.error;
    if(e){setError(humanError(e,"Policies and rules could not load.")); setLoading(false); return;}
    setDefs(d.data||[]); setVersions(v.data||[]);
    if(!selected && d.data?.length) setSelected(d.data[0].rule_key);
    setLoading(false);
  }

  const def=defs.find((item)=>item.rule_key===selected)||null;
  const history=versions.filter((item)=>item.rule_key===selected);
  const current=history.find((item)=>new Date(item.effective_on+"T00:00:00")<=new Date())||history[0]||null;

  async function save(){
    if(!def||!reason.trim()||value==="") return;
    let jsonValue;
    if(def.value_type==="integer") jsonValue=Number.parseInt(value,10);
    else if(def.value_type==="numeric") jsonValue=Number(value);
    else if(def.value_type==="boolean") jsonValue=value==="true";
    else jsonValue=value;
    setBusy(true); setError(null); setNotice(null);
    const {error:insertError}=await supabase.from("policy_rule_versions").insert({
      org_id:me.org_id,rule_key:def.rule_key,value:jsonValue,effective_on:effectiveOn,
      reason:reason.trim(),recorded_by:me.id,
    });
    setBusy(false);
    if(insertError){setError(humanError(insertError,"The rule version could not be recorded.")); return;}
    setReason(""); setValue(""); setNotice("Policy rule recorded."); await load();
  }

  if(loading) return <div className="body"><LoadingState label="Loading policies and rules…" /></div>;

  return <div className="body">
    <div style={{paddingTop:26}}>
      <div className="eyebrow">Platform foundation</div>
      <h1 className="h1">Policies & rules</h1>
      <p className="screen-note">Versioned organisation rules. Existing versions are never overwritten.</p>
    </div>
    {error&&<ProductNotice tone="error" title="Policies & rules">{error}</ProductNotice>}
    {notice&&<ProductNotice tone="success" title="Policy updated">{notice}</ProductNotice>}
    <div className="split" style={{marginTop:18}}>
      <div className="main-col">
        <div className="sec"><span>Rule catalogue</span><span>{defs.length}</span></div>
        {defs.map((item)=>{
          const rows=versions.filter((v)=>v.rule_key===item.rule_key);
          const latest=rows[0]||null;
          return <button key={item.rule_key} className={"row row-button"+(selected===item.rule_key?" on":"")} onClick={()=>setSelected(item.rule_key)}>
            <div className="row-t">{item.label}</div>
            <div className="row-m">{item.domain+" · "+formatValue(item,latest?.value)+(latest?" · effective "+latest.effective_on:"")}</div>
            <div className="small" style={{marginTop:6}}>{item.description}</div>
          </button>;
        })}
        {!defs.length&&<EmptyState title="No policy definitions">No policy definitions are active.</EmptyState>}
      </div>
      <div className="side-col">
        <div className="sec"><span>Record version</span></div>
        {def&&<div className="card" style={{padding:15}}>
          <strong>{def.label}</strong>
          <p className="small" style={{lineHeight:1.5}}>{def.description}</p>
          <div className="small">Current: {formatValue(def,current?.value)}</div>
          <FieldGroup label="New value">
            {def.value_type==="boolean"
              ? <select className="field" aria-label="Policy rule value" value={value} onChange={(e)=>setValue(e.target.value)}><option value="">Choose</option><option value="true">Yes</option><option value="false">No</option></select>
              : <input className="field" aria-label="Policy rule value" type={def.value_type==="text"?"text":"number"} value={value} min={def.min_numeric??undefined} max={def.max_numeric??undefined} onChange={(e)=>setValue(e.target.value)} />}
          </FieldGroup>
          <FieldGroup label="Effective date"><input className="field" aria-label="Policy effective date" type="date" value={effectiveOn} onChange={(e)=>setEffectiveOn(e.target.value)} /></FieldGroup>
          <FieldGroup label="Reason"><textarea className="field" aria-label="Policy reason" rows="3" value={reason} onChange={(e)=>setReason(e.target.value)} /></FieldGroup>
          <button className="btn" disabled={busy||value===""||!reason.trim()} onClick={save}>{busy?"Recording…":"Record new version"}</button>
        </div>}
        <div className="sec"><span>History</span><span>{history.length}</span></div>
        {history.slice(0,10).map((item)=><div className="row" key={item.id}>
          <div className="row-t">{formatValue(def,item.value)}</div>
          <div className="row-m">Effective {item.effective_on}</div>
          <div className="small" style={{marginTop:6}}>{item.reason}</div>
        </div>)}
      </div>
    </div>
  </div>;
}
