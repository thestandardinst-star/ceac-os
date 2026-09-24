import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { EmptyState, FieldGroup, ProductNotice, SectionHeader, Sheet } from "./bits";
import { Stat, StatRow, Table } from "./primitives";

const CURRENCIES = ["GHS","USD","GBP","EUR","NGN","ZAR","CAD"];

function minor(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}
function money(value, currency) {
  return `${currency} ${(Number(value || 0) / 100).toLocaleString("en-GH", { maximumFractionDigits: 2 })}`;
}
function day() { return new Date().toISOString().slice(0,10); }

export default function ProjectParticipantRegister({ me, project }) {
  const [people,setPeople]=useState([]);
  const [payments,setPayments]=useState([]);
  const [custody,setCustody]=useState([]);
  const [slotTypes,setSlotTypes]=useState([]);
  const [allocations,setAllocations]=useState([]);
  const [transfers,setTransfers]=useState([]);
  const [projectUnits,setProjectUnits]=useState([]);
  const [allUnits,setAllUnits]=useState([]);
  const [sheet,setSheet]=useState(null);
  const [busy,setBusy]=useState(false);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(null);
  const [notice,setNotice]=useState(null);

  useEffect(()=>{ load(); },[project.id,me.id]);

  async function load() {
    setLoading(true); setError(null);
    const [personResult,paymentResult,custodyResult,slotResult,allocationResult,transferResult,projectUnitResult,unitResult]=await Promise.all([
      supabase.from("project_register_people").select("*").eq("project_id",project.id).order("display_name"),
      supabase.from("project_register_payments").select("*").eq("project_id",project.id).order("paid_on",{ascending:false}).order("entered_at",{ascending:false}),
      supabase.from("project_register_custody_events").select("*").eq("project_id",project.id).order("occurred_at",{ascending:false}),
      supabase.from("project_slot_types").select("*").eq("project_id",project.id).order("label"),
      supabase.from("project_slot_allocations").select("*").eq("project_id",project.id).order("allocated_at",{ascending:false}),
      supabase.from("internal_transfers").select("id,from_unit_id,to_unit_id,amount_minor,currency,sent_on,purpose,state,evidence_ref,responded_at,response_note").eq("project_id",project.id).order("sent_on",{ascending:false}),
      supabase.from("project_units").select("unit_id,role,units(id,name)").eq("project_id",project.id),
      supabase.from("units").select("id,name").eq("org_id",me.org_id).eq("active",true).order("name"),
    ]);
    const failed=[personResult,paymentResult,custodyResult,slotResult,allocationResult,transferResult,projectUnitResult,unitResult].find(r=>r.error);
    if(failed){setError(failed.error.message||"The project register could not load.");setLoading(false);return;}
    setPeople(personResult.data||[]);
    setPayments(paymentResult.data||[]);
    setCustody(custodyResult.data||[]);
    setSlotTypes(slotResult.data||[]);
    setAllocations(allocationResult.data||[]);
    setTransfers(transferResult.data||[]);
    const pUnits=projectUnitResult.data||[];
    if(project.lead_unit_id && !pUnits.some(r=>r.unit_id===project.lead_unit_id)){
      const lead=(unitResult.data||[]).find(u=>u.id===project.lead_unit_id);
      if(lead)pUnits.unshift({unit_id:lead.id,role:"lead",units:lead});
    }
    setProjectUnits(pUnits);
    setAllUnits(unitResult.data||[]);
    setLoading(false);
  }

  const capabilities=me.capabilities||[];
  const managedUnits=useMemo(()=>{
    const ids=(me.memberships||[]).filter(r=>r.role==="manager").map(r=>r.unit_id);
    if(me.role==="manager"&&me.unit_id&&!ids.includes(me.unit_id))ids.push(me.unit_id);
    return ids;
  },[me]);
  const canManageProject=Boolean(me.is_admin||me.is_exec||capabilities.includes("delivery.manage")||managedUnits.includes(project.lead_unit_id));
  const canManagePerson=(person)=>canManageProject||managedUnits.includes(person.unit_id);

  const paidByPerson=useMemo(()=>{
    const out={};
    payments.forEach(p=>{out[p.register_person_id]=(out[p.register_person_id]||0)+(p.reverses_id?-Number(p.amount_minor):Number(p.amount_minor));});
    return out;
  },[payments]);
  const latestCustody=useMemo(()=>{
    const out={}; custody.forEach(row=>{if(!out[row.register_person_id])out[row.register_person_id]=row;}); return out;
  },[custody]);
  const activeAllocation=useMemo(()=>{
    const out={}; allocations.filter(a=>!a.released_at).forEach(a=>{if(!out[a.register_person_id])out[a.register_person_id]=a;});return out;
  },[allocations]);
  const unitsById=useMemo(()=>Object.fromEntries(allUnits.map(u=>[u.id,u])),[allUnits]);
  const slotsById=useMemo(()=>Object.fromEntries(slotTypes.map(s=>[s.id,s])),[slotTypes]);

  const totals=useMemo(()=>{
    const map={};
    people.forEach(p=>{
      map[p.currency] ||= {currency:p.currency,due:0,paid:0};
      map[p.currency].due+=Number(p.amount_due_minor||0);
      map[p.currency].paid+=Number(paidByPerson[p.id]||0);
    });
    return Object.values(map);
  },[people,paidByPerson]);

  const reconciliation=useMemo(()=>{
    const map={};
    people.forEach(p=>{
      const key=`${p.unit_id}|${p.currency}`;
      map[key] ||= {id:key,unit_id:p.unit_id,currency:p.currency,collected:0,remitted:0,pending:0};
      map[key].collected+=Number(paidByPerson[p.id]||0);
    });
    transfers.forEach(t=>{
      if(!t.from_unit_id)return;
      const key=`${t.from_unit_id}|${t.currency}`;
      map[key] ||= {id:key,unit_id:t.from_unit_id,currency:t.currency,collected:0,remitted:0,pending:0};
      if(t.state==="confirmed")map[key].remitted+=Number(t.amount_minor||0);
      else map[key].pending+=Number(t.amount_minor||0);
    });
    return Object.values(map).map(r=>({...r,gap:r.collected-r.remitted}));
  },[people,paidByPerson,transfers]);

  async function addPerson(form){
    setBusy(true);setError(null);setNotice(null);
    const {error:e}=await supabase.from("project_register_people").insert({
      org_id:me.org_id,project_id:project.id,unit_id:form.unitId,profile_id:null,
      display_name:form.name.trim(),contact_ref:form.contact.trim()||null,
      amount_due_minor:minor(form.due),currency:form.currency,
      source_kind:"manual",source_ref:null,note:form.note.trim()||null,
      created_by:me.id,updated_by:me.id,
    });
    setBusy(false);if(e){setError(e.message);return;}
    setSheet(null);setNotice("Participant added to the project register.");await load();
  }

  async function updatePerson(person,form){
    setBusy(true);setError(null);setNotice(null);
    const {error:e}=await supabase.from("project_register_people").update({
      display_name:form.name.trim(),contact_ref:form.contact.trim()||null,
      amount_due_minor:minor(form.due),currency:form.currency,note:form.note.trim()||null,updated_by:me.id,
    }).eq("id",person.id);
    setBusy(false);if(e){setError(e.message);return;}
    setSheet(null);setNotice("Participant register row updated.");await load();
  }

  async function recordPayment(person,form,reversal=null){
    setBusy(true);setError(null);setNotice(null);
    const amount=reversal?Number(reversal.amount_minor):minor(form.amount);
    const {error:e}=await supabase.from("project_register_payments").insert({
      org_id:me.org_id,project_id:project.id,register_person_id:person.id,unit_id:person.unit_id,
      amount_minor:amount,currency:person.currency,paid_on:form.paidOn||day(),
      evidence_ref:form.evidence.trim()||null,source_kind:"manual",source_ref:null,
      reverses_id:reversal?.id||null,entered_by:me.id,
    });
    setBusy(false);if(e){setError(e.message);return;}
    setSheet(null);setNotice(reversal?"Payment correction recorded.":"Payment recorded.");await load();
  }

  async function recordCustody(person,form){
    setBusy(true);setError(null);setNotice(null);
    const {error:e}=await supabase.from("project_register_custody_events").insert({
      org_id:me.org_id,project_id:project.id,register_person_id:person.id,
      stage:form.stage.trim(),custodian_unit_id:form.unitId||null,note:form.note.trim()||null,
      occurred_at:new Date().toISOString(),source_kind:"manual",source_ref:null,recorded_by:me.id,
    });
    setBusy(false);if(e){setError(e.message);return;}
    setSheet(null);setNotice("Custody stage recorded.");await load();
  }

  async function addSlotType(form){
    setBusy(true);setError(null);setNotice(null);
    const {error:e}=await supabase.from("project_slot_types").insert({
      org_id:me.org_id,project_id:project.id,label:form.label.trim(),capacity:Number(form.capacity),
      active:true,created_by:me.id,updated_by:me.id,
    });
    setBusy(false);if(e){setError(e.message);return;}
    setSheet(null);setNotice("Slot inventory added.");await load();
  }

  async function allocateSlot(person,slotTypeId){
    setBusy(true);setError(null);setNotice(null);
    const {error:e}=await supabase.from("project_slot_allocations").insert({
      org_id:me.org_id,project_id:project.id,register_person_id:person.id,
      slot_type_id:slotTypeId,allocated_by:me.id,
    });
    setBusy(false);if(e){setError(e.message);return;}
    setSheet(null);setNotice("Slot allocated.");await load();
  }

  async function releaseSlot(allocation,reason){
    setBusy(true);setError(null);setNotice(null);
    const {error:e}=await supabase.from("project_slot_allocations").update({
      released_by:me.id,released_at:new Date().toISOString(),release_reason:reason.trim(),
    }).eq("id",allocation.id);
    setBusy(false);if(e){setError(e.message);return;}
    setSheet(null);setNotice("Slot released.");await load();
  }

  async function recordRemittance(form){
    setBusy(true);setError(null);setNotice(null);
    const {error:e}=await supabase.from("internal_transfers").insert({
      org_id:me.org_id,from_unit_id:form.fromUnit,to_unit_id:form.toUnit,
      amount_minor:minor(form.amount),sent_on:form.sentOn||day(),
      purpose:form.purpose.trim()||`${project.name} register remittance`,
      state:"sent",sent_by:me.id,currency:form.currency,
      project_id:project.id,evidence_ref:form.evidence.trim()||null,
    });
    setBusy(false);if(e){setError(e.message);return;}
    setSheet(null);setNotice("Remittance recorded. The receiving unit must confirm it.");await load();
  }

  if(loading)return <div className="card small">Loading project register…</div>;

  const rows=people.map(person=>{
    const paid=Number(paidByPerson[person.id]||0);
    const custodyRow=latestCustody[person.id];
    const allocation=activeAllocation[person.id];
    return {...person,paid,balance:Number(person.amount_due_minor||0)-paid,
      unit_name:unitsById[person.unit_id]?.name||"Unit",
      custody_stage:custodyRow?.stage||"Not recorded",
      slot_label:allocation?slotsById[allocation.slot_type_id]?.label||"Allocated":"—",
      allocation,
    };
  });

  return <section className="project-register">
    <SectionHeader eyebrow="Project register" title="People, payments and custody"
      count={people.length}
      action={<div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
        {(canManageProject||managedUnits.length>0)&&<button className="btn btn-sm" onClick={()=>setSheet({type:"person"})}>Add participant</button>}
        {canManageProject&&<button className="btn btn-ghost btn-sm" onClick={()=>setSheet({type:"slot-type"})}>Add slot type</button>}
        {(canManageProject||managedUnits.length>0)&&<button className="btn btn-ghost btn-sm" onClick={()=>setSheet({type:"remittance"})}>Record remittance</button>}
      </div>} />
    <p className="screen-note">This register belongs to the project. Payments are append-only; remittance is confirmed by the receiving unit through the existing two-sided finance record.</p>
    {error&&<ProductNotice tone="error" title="Project register">{error}</ProductNotice>}
    {notice&&<ProductNotice tone="success" title="Project register">{notice}</ProductNotice>}

    {totals.map(t=><div key={t.currency} style={{marginTop:10}}>
      <StatRow>
        <Stat icon="money" label={`${t.currency} due`} value={money(t.due,t.currency)} onOpen={()=>document.getElementById("project-register-people")?.scrollIntoView({behavior:"smooth",block:"start"})} />
        <Stat icon="money" label={`${t.currency} paid`} value={money(t.paid,t.currency)} onOpen={()=>document.getElementById("project-register-people")?.scrollIntoView({behavior:"smooth",block:"start"})} />
        <Stat icon="warning" label={`${t.currency} unpaid`} value={money(Math.max(0,t.due-t.paid),t.currency)}
          tone={t.due>t.paid?"slow":"ink"} onOpen={()=>document.getElementById("project-register-people")?.scrollIntoView({behavior:"smooth",block:"start"})} />
      </StatRow>
    </div>)}

    {rows.length===0?<EmptyState compact title="No participants in this project register">Add people only when this project needs a participant/payment register.</EmptyState>:
    <div id="project-register-people"><Table rows={rows} exportName="ceac-project-register" columns={[
      {key:"display_name",label:"Person"},
      {key:"unit_name",label:"Unit"},
      {key:"amount_due_minor",label:"Owes",align:"right",sortValue:r=>Number(r.amount_due_minor)||0,render:r=>money(r.amount_due_minor,r.currency),csv:r=>Number(r.amount_due_minor)/100},
      {key:"paid",label:"Paid",align:"right",sortValue:r=>r.paid,render:r=>money(r.paid,r.currency),csv:r=>r.paid/100},
      {key:"balance",label:"Balance",align:"right",sortValue:r=>r.balance,render:r=>money(r.balance,r.currency),csv:r=>r.balance/100},
      {key:"custody_stage",label:"Custody"},
      {key:"slot_label",label:"Slot"},
      {key:"actions",label:"Actions",render:r=>canManagePerson(r)?<div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
        <button className="btn btn-ghost btn-sm" onClick={e=>{e.stopPropagation();setSheet({type:"payment",person:r});}}>Payment</button>
        <button className="btn btn-ghost btn-sm" onClick={e=>{e.stopPropagation();setSheet({type:"custody",person:r});}}>Custody</button>
        {!r.allocation&&slotTypes.some(s=>s.active)&&<button className="btn btn-ghost btn-sm" disabled={r.balance>0} onClick={e=>{e.stopPropagation();setSheet({type:"allocate",person:r});}}>Allocate slot</button>}
        {r.allocation&&<button className="btn btn-ghost btn-sm" onClick={e=>{e.stopPropagation();setSheet({type:"release",person:r,allocation:r.allocation});}}>Release slot</button>}
        <button className="btn btn-ghost btn-sm" onClick={e=>{e.stopPropagation();setSheet({type:"edit-person",person:r});}}>Edit</button>
      </div>:<span className="small">Read only</span>,csv:()=>""},
    ]}/></div>}
    
    <div className="sec"><span>Collection and remittance</span><span>{reconciliation.length}</span></div>
    <Table rows={reconciliation} empty="No payment/remittance movement yet." exportName="ceac-project-reconciliation" columns={[
      {key:"unit_id",label:"Collecting unit",render:r=>unitsById[r.unit_id]?.name||"Unit",csv:r=>unitsById[r.unit_id]?.name||""},
      {key:"currency",label:"Currency"},
      {key:"collected",label:"Collected",align:"right",render:r=>money(r.collected,r.currency),sortValue:r=>r.collected,csv:r=>r.collected/100},
      {key:"remitted",label:"Confirmed remitted",align:"right",render:r=>money(r.remitted,r.currency),sortValue:r=>r.remitted,csv:r=>r.remitted/100},
      {key:"pending",label:"Awaiting confirmation",align:"right",render:r=>money(r.pending,r.currency),sortValue:r=>r.pending,csv:r=>r.pending/100},
      {key:"gap",label:"Gap",align:"right",render:r=>money(r.gap,r.currency),sortValue:r=>r.gap,csv:r=>r.gap/100},
    ]}/>

    {slotTypes.length>0&&<>
      <div className="sec"><span>Slot inventory</span><span>{slotTypes.length}</span></div>
      <Table rows={slotTypes.map(s=>({...s,used:allocations.filter(a=>a.slot_type_id===s.id&&!a.released_at).length,available:s.capacity-allocations.filter(a=>a.slot_type_id===s.id&&!a.released_at).length}))}
        columns={[
          {key:"label",label:"Type"},
          {key:"capacity",label:"Capacity",align:"right"},
          {key:"used",label:"Allocated",align:"right"},
          {key:"available",label:"Available",align:"right"},
        ]}/>
    </>}

    {sheet?.type==="person"&&<PersonSheet projectUnits={projectUnits} me={me} canManageProject={canManageProject} managedUnits={managedUnits} busy={busy} onClose={()=>setSheet(null)} onSave={addPerson}/>}
    {sheet?.type==="edit-person"&&<PersonSheet value={sheet.person} projectUnits={projectUnits} me={me} canManageProject={canManageProject} managedUnits={managedUnits} busy={busy} onClose={()=>setSheet(null)} onSave={form=>updatePerson(sheet.person,form)}/>}
    {sheet?.type==="payment"&&<PaymentSheet person={sheet.person} payments={payments.filter(p=>p.register_person_id===sheet.person.id)} busy={busy} onClose={()=>setSheet(null)} onSave={form=>recordPayment(sheet.person,form)} onReverse={(payment,form)=>recordPayment(sheet.person,form,payment)}/>}
    {sheet?.type==="custody"&&<CustodySheet person={sheet.person} units={allUnits} busy={busy} onClose={()=>setSheet(null)} onSave={form=>recordCustody(sheet.person,form)}/>}
    {sheet?.type==="slot-type"&&<SlotTypeSheet busy={busy} onClose={()=>setSheet(null)} onSave={addSlotType}/>}
    {sheet?.type==="allocate"&&<AllocateSheet person={sheet.person} slotTypes={slotTypes.filter(s=>s.active)} allocations={allocations} busy={busy} onClose={()=>setSheet(null)} onSave={slotId=>allocateSlot(sheet.person,slotId)}/>}
    {sheet?.type==="release"&&<ReleaseSheet person={sheet.person} allocation={sheet.allocation} busy={busy} onClose={()=>setSheet(null)} onSave={reason=>releaseSlot(sheet.allocation,reason)}/>}
    {sheet?.type==="remittance"&&<RemittanceSheet project={project} units={allUnits} projectUnits={projectUnits} managedUnits={managedUnits} canManageProject={canManageProject} busy={busy} onClose={()=>setSheet(null)} onSave={recordRemittance}/>}
  </section>;
}

function PersonSheet({value=null,projectUnits,me,canManageProject,managedUnits,busy,onClose,onSave}){
  const allowed=projectUnits.filter(r=>canManageProject||managedUnits.includes(r.unit_id));
  const [unitId,setUnitId]=useState(value?.unit_id||allowed[0]?.unit_id||me.unit_id||"");
  const [name,setName]=useState(value?.display_name||"");
  const [contact,setContact]=useState(value?.contact_ref||"");
  const [due,setDue]=useState(value?String(Number(value.amount_due_minor||0)/100):"");
  const [currency,setCurrency]=useState(value?.currency||"GHS");
  const [note,setNote]=useState(value?.note||"");
  return <Sheet onClose={onClose}><div className="h2">{value?"Edit participant":"Add participant"}</div>
    <FieldGroup label="Project unit"><select className="field" aria-label="Register participant unit" value={unitId} disabled={Boolean(value)} onChange={e=>setUnitId(e.target.value)}>{allowed.map(r=><option key={r.unit_id} value={r.unit_id}>{r.units?.name||"Unit"}</option>)}</select></FieldGroup>
    <FieldGroup label="Name"><input className="field" aria-label="Register participant name" value={name} onChange={e=>setName(e.target.value)}/></FieldGroup>
    <FieldGroup label="Contact / reference"><input className="field" aria-label="Register participant contact" value={contact} onChange={e=>setContact(e.target.value)}/></FieldGroup>
    <FieldGroup label="Amount owed"><div style={{display:"flex",gap:7}}><input className="field" aria-label="Register amount due" inputMode="decimal" value={due} onChange={e=>setDue(e.target.value)}/><select className="field" aria-label="Register currency" value={currency} disabled={Boolean(value)} onChange={e=>setCurrency(e.target.value)}>{CURRENCIES.map(c=><option key={c}>{c}</option>)}</select></div></FieldGroup>
    <FieldGroup label="Context"><textarea className="field" aria-label="Register participant context" value={note} onChange={e=>setNote(e.target.value)} rows="3"/></FieldGroup>
    <button className="btn" disabled={busy||!unitId||!name.trim()||Number(due)<0} onClick={()=>onSave({unitId,name,contact,due,currency,note})}>{busy?"Saving…":value?"Save participant":"Add participant"}</button>
  </Sheet>;
}
function PaymentSheet({person,payments,busy,onClose,onSave,onReverse}){
  const [amount,setAmount]=useState("");
  const [paidOn,setPaidOn]=useState(day());
  const [evidence,setEvidence]=useState("");
  return <Sheet onClose={onClose}><div className="h2">Payment · {person.display_name}</div>
    <FieldGroup label={`Amount (${person.currency})`}><input className="field" aria-label="Register payment amount" inputMode="decimal" value={amount} onChange={e=>setAmount(e.target.value)}/></FieldGroup>
    <FieldGroup label="Paid on"><input className="field" aria-label="Register payment date" type="date" value={paidOn} onChange={e=>setPaidOn(e.target.value)}/></FieldGroup>
    <FieldGroup label="Proof / receipt reference"><input className="field" aria-label="Register payment evidence" value={evidence} onChange={e=>setEvidence(e.target.value)}/></FieldGroup>
    <button className="btn" disabled={busy||minor(amount)<=0} onClick={()=>onSave({amount,paidOn,evidence})}>{busy?"Saving…":"Record payment"}</button>
    {payments.filter(p=>!p.reverses_id&&!payments.some(r=>r.reverses_id===p.id)).length>0&&<><div className="sec"><span>Correct a payment</span></div>{payments.filter(p=>!p.reverses_id&&!payments.some(r=>r.reverses_id===p.id)).slice(0,8).map(p=><div className="row" key={p.id}><div className="row-t">{money(p.amount_minor,p.currency)}</div><div className="row-m">{p.paid_on}{p.evidence_ref?" · "+p.evidence_ref:""}</div><button className="btn btn-ghost btn-sm" onClick={()=>onReverse(p,{paidOn:day(),evidence:`Reversal of ${p.evidence_ref||p.id.slice(0,8)}`})}>Reverse</button></div>)}</>}
  </Sheet>;
}
function CustodySheet({person,units,busy,onClose,onSave}){
  const [stage,setStage]=useState("");
  const [unitId,setUnitId]=useState(person.unit_id||"");
  const [note,setNote]=useState("");
  return <Sheet onClose={onClose}><div className="h2">Custody · {person.display_name}</div>
    <FieldGroup label="Stage"><input className="field" aria-label="Register custody stage" placeholder="e.g. Collected by church representative" value={stage} onChange={e=>setStage(e.target.value)}/></FieldGroup>
    <FieldGroup label="Custodian unit"><select className="field" aria-label="Register custody unit" value={unitId} onChange={e=>setUnitId(e.target.value)}><option value="">No unit recorded</option>{units.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select></FieldGroup>
    <FieldGroup label="Context"><textarea className="field" aria-label="Register custody context" rows="3" value={note} onChange={e=>setNote(e.target.value)}/></FieldGroup>
    <button className="btn" disabled={busy||!stage.trim()} onClick={()=>onSave({stage,unitId,note})}>{busy?"Saving…":"Record custody stage"}</button>
  </Sheet>;
}
function SlotTypeSheet({busy,onClose,onSave}){
  const [label,setLabel]=useState("");const [capacity,setCapacity]=useState("");
  return <Sheet onClose={onClose}><div className="h2">Add slot inventory</div>
    <FieldGroup label="Type"><input className="field" aria-label="Register slot type" placeholder="e.g. Dormitory" value={label} onChange={e=>setLabel(e.target.value)}/></FieldGroup>
    <FieldGroup label="Capacity"><input className="field" aria-label="Register slot capacity" type="number" min="1" value={capacity} onChange={e=>setCapacity(e.target.value)}/></FieldGroup>
    <button className="btn" disabled={busy||!label.trim()||Number(capacity)<=0} onClick={()=>onSave({label,capacity})}>{busy?"Saving…":"Add slot type"}</button>
  </Sheet>;
}
function AllocateSheet({person,slotTypes,allocations,busy,onClose,onSave}){
  const available=slotTypes.map(s=>({...s,remaining:s.capacity-allocations.filter(a=>a.slot_type_id===s.id&&!a.released_at).length})).filter(s=>s.remaining>0);
  const [slot,setSlot]=useState(available[0]?.id||"");
  return <Sheet onClose={onClose}><div className="h2">Allocate slot · {person.display_name}</div>
    <p className="screen-note">The database will reject this unless the participant is fully paid and inventory remains.</p>
    <FieldGroup label="Slot type"><select className="field" aria-label="Register slot allocation" value={slot} onChange={e=>setSlot(e.target.value)}>{available.map(s=><option key={s.id} value={s.id}>{s.label} · {s.remaining} available</option>)}</select></FieldGroup>
    <button className="btn" disabled={busy||!slot} onClick={()=>onSave(slot)}>{busy?"Allocating…":"Allocate slot"}</button>
  </Sheet>;
}
function ReleaseSheet({person,busy,onClose,onSave}){
  const [reason,setReason]=useState("");
  return <Sheet onClose={onClose}><div className="h2">Release slot · {person.display_name}</div>
    <FieldGroup label="Reason"><textarea className="field" aria-label="Register slot release reason" rows="3" value={reason} onChange={e=>setReason(e.target.value)}/></FieldGroup>
    <button className="btn" disabled={busy||!reason.trim()} onClick={()=>onSave(reason)}>{busy?"Releasing…":"Release slot"}</button>
  </Sheet>;
}
function RemittanceSheet({project,units,projectUnits,managedUnits,canManageProject,busy,onClose,onSave}){
  const allowedFrom=projectUnits.filter(r=>canManageProject||managedUnits.includes(r.unit_id)).map(r=>r.unit_id);
  const [fromUnit,setFromUnit]=useState(allowedFrom[0]||"");
  const [toUnit,setToUnit]=useState("");
  const [amount,setAmount]=useState("");
  const [currency,setCurrency]=useState("GHS");
  const [sentOn,setSentOn]=useState(day());
  const [evidence,setEvidence]=useState("");
  const [purpose,setPurpose]=useState(`${project.name} register remittance`);
  return <Sheet onClose={onClose}><div className="h2">Record remittance</div>
    <p className="screen-note">The receiving unit must confirm this transfer before it counts as remitted.</p>
    <FieldGroup label="From"><select className="field" aria-label="Register remittance from" value={fromUnit} onChange={e=>setFromUnit(e.target.value)}>{units.filter(u=>allowedFrom.includes(u.id)).map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select></FieldGroup>
    <FieldGroup label="To"><select className="field" aria-label="Register remittance to" value={toUnit} onChange={e=>setToUnit(e.target.value)}><option value="">Choose receiving unit</option>{units.filter(u=>u.id!==fromUnit).map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select></FieldGroup>
    <FieldGroup label="Purpose"><input className="field" aria-label="Register remittance purpose" value={purpose} onChange={e=>setPurpose(e.target.value)}/></FieldGroup>
    <FieldGroup label="Amount"><div style={{display:"flex",gap:7}}><input className="field" aria-label="Register remittance amount" inputMode="decimal" value={amount} onChange={e=>setAmount(e.target.value)}/><select className="field" aria-label="Register remittance currency" value={currency} onChange={e=>setCurrency(e.target.value)}>{CURRENCIES.map(c=><option key={c}>{c}</option>)}</select></div></FieldGroup>
    <FieldGroup label="Sent on"><input className="field" aria-label="Register remittance date" type="date" value={sentOn} onChange={e=>setSentOn(e.target.value)}/></FieldGroup>
    <FieldGroup label="Proof / transfer reference"><input className="field" aria-label="Register remittance evidence" value={evidence} onChange={e=>setEvidence(e.target.value)}/></FieldGroup>
    <button className="btn" disabled={busy||!fromUnit||!toUnit||minor(amount)<=0||!purpose.trim()} onClick={()=>onSave({fromUnit,toUnit,amount,currency,sentOn,evidence,purpose})}>{busy?"Saving…":"Record remittance"}</button>
  </Sheet>;
}
