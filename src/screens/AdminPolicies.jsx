import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { EmptyState, FieldGroup, LoadingState, ProductNotice } from "../components/bits";
import { humanError } from "../lib/productLanguage";
import { Table } from "../components/primitives";

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
        <Table
          rows={defs}
          empty="No policy definitions are active."
          caption="Organisation rule catalogue"
          exportName="ceac-policy-rules"
          onRowClick={(item)=>setSelected(item.rule_key)}
          rowAriaLabel={(item)=>`Open policy rule ${item.label}`}
          rowClassName={(item)=>selected===item.rule_key ? "ledger-selected" : ""}
          columns={[
            { key:"label", label:"Rule", render:(item)=><button type="button" className="text-action" onClick={()=>setSelected(item.rule_key)}>{item.label}</button>, csv:(item)=>item.label },
            { key:"domain", label:"Domain" },
            { key:"current", label:"Current value", render:(item)=>{const latest=versions.find((v)=>v.rule_key===item.rule_key)||null;return formatValue(item,latest?.value);}, sortValue:(item)=>{const latest=versions.find((v)=>v.rule_key===item.rule_key)||null;return formatValue(item,latest?.value);}, csv:(item)=>{const latest=versions.find((v)=>v.rule_key===item.rule_key)||null;return formatValue(item,latest?.value);} },
            { key:"effective", label:"Effective", render:(item)=>versions.find((v)=>v.rule_key===item.rule_key)?.effective_on || "Not configured", sortValue:(item)=>versions.find((v)=>v.rule_key===item.rule_key)?.effective_on || "" },
            { key:"description", label:"Purpose" },
          ]}
        />
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
        <Table
          rows={history.slice(0,10)}
          empty="No versions are recorded for this rule."
          exportName="ceac-policy-rule-history"
          columns={[
            { key:"value", label:"Value", render:(item)=>formatValue(def,item.value), sortValue:(item)=>formatValue(def,item.value), csv:(item)=>formatValue(def,item.value) },
            { key:"effective_on", label:"Effective" },
            { key:"reason", label:"Reason" },
          ]}
        />
      </div>
    </div>
  </div>;
}
