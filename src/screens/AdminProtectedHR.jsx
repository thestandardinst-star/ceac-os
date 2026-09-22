import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { EmptyState, FieldGroup, LoadingState, ProductNotice } from "../components/bits";
import { humanError } from "../lib/productLanguage";

const TYPES = [
  ["identifier","Identifier"],
  ["employment_term","Employment term"],
  ["compensation","Compensation history"],
  ["payment_detail","Payment detail"],
  ["document","Protected document"],
];

function dateLabel(value) {
  if (!value) return "—";
  return new Date(value + (value.length === 10 ? "T00:00:00Z" : "")).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric", timeZone:"UTC" });
}

function statusText(value) {
  return value === "replaced" ? "Replaced" : "Active";
}

function safeFileName(name = "document") {
  return name.toLowerCase().replace(/[^a-z0-9._-]+/g,"-").replace(/^-+|-+$/g,"") || "document";
}

export default function AdminProtectedHR({ me }) {
  const [people,setPeople]=useState([]);
  const [profileId,setProfileId]=useState("");
  const [summary,setSummary]=useState(null);
  const [recordType,setRecordType]=useState("identifier");
  const [replaceId,setReplaceId]=useState("");
  const [reason,setReason]=useState("");
  const [fields,setFields]=useState({});
  const [file,setFile]=useState(null);
  const [loading,setLoading]=useState(true);
  const [detailLoading,setDetailLoading]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState(null);
  const [notice,setNotice]=useState(null);

  useEffect(()=>{ loadPeople(); },[me.id]);
  useEffect(()=>{ if(profileId) loadSummary(profileId); },[profileId]);

  async function loadPeople() {
    setLoading(true); setError(null);
    const {data,error:e}=await supabase.from("profiles")
      .select("id,full_name,email,job_title,active")
      .eq("org_id",me.org_id)
      .order("full_name");
    if(e){ setError(humanError(e,"Protected HR could not load the employee directory.")); setLoading(false); return; }
    setPeople(data||[]);
    if(!profileId && data?.length) setProfileId(data[0].id);
    setLoading(false);
  }

  async function loadSummary(id=profileId) {
    if(!id) return;
    setDetailLoading(true); setError(null);
    const {data,error:e}=await supabase.rpc("hr_protected_summary",{p_profile_id:id});
    setDetailLoading(false);
    if(e){ setError(humanError(e,"Protected HR records could not be opened.")); return; }
    setSummary(data||{identifiers:[],employment_terms:[],compensation:[],payment_details:[],documents:[]});
  }

  const selectedPerson=people.find(p=>p.id===profileId)||null;
  const collections=useMemo(()=>({
    identifier: summary?.identifiers||[],
    employment_term: summary?.employment_terms||[],
    compensation: summary?.compensation||[],
    payment_detail: summary?.payment_details||[],
    document: summary?.documents||[],
  }),[summary]);
  const activeReplacements=(collections[recordType]||[]).filter(row=>row.status==="active");

  function resetForm(nextType=recordType) {
    setFields({});
    setReason("");
    setReplaceId("");
    setFile(null);
    setRecordType(nextType);
  }

  function payloadForType() {
    if(recordType==="identifier") return {
      identifier_type:fields.identifierType||"",
      identifier_value:fields.identifierValue||"",
      issued_on:fields.issuedOn||"",
      expires_on:fields.expiresOn||"",
    };
    if(recordType==="employment_term") return {
      term_type:fields.termType||"",
      summary:fields.summary||"",
      starts_on:fields.startsOn||"",
      ends_on:fields.endsOn||"",
    };
    if(recordType==="compensation") return {
      amount_minor:fields.amountMinor||"",
      currency:(fields.currency||"").toUpperCase(),
      basis_label:fields.basisLabel||"",
      effective_on:fields.effectiveOn||"",
      ends_on:fields.endsOn||"",
      note:fields.note||"",
    };
    if(recordType==="payment_detail") return {
      payment_type:fields.paymentType||"",
      provider_name:fields.providerName||"",
      account_name:fields.accountName||"",
      account_reference:fields.accountReference||"",
      branch_reference:fields.branchReference||"",
    };
    return {};
  }

  async function saveRecord() {
    if(!profileId || !reason.trim()) return;
    setBusy(true); setError(null); setNotice(null);
    let uploadedPath=null;
    let payload=payloadForType();

    if(recordType==="document") {
      if(!file || !fields.documentType?.trim() || !fields.title?.trim()){
        setBusy(false);
        setError("Choose a file and record its document type and title.");
        return;
      }
      uploadedPath=`${me.org_id}/${profileId}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
      const upload=await supabase.storage.from("ceac-hr-private").upload(uploadedPath,file,{upsert:false});
      if(upload.error){
        setBusy(false);
        setError(humanError(upload.error,"The protected document could not be uploaded."));
        return;
      }
      payload={
        document_type:fields.documentType,
        title:fields.title,
        storage_path:uploadedPath,
        issued_on:fields.issuedOn||"",
        expires_on:fields.expiresOn||"",
      };
    }

    const {error:e}=await supabase.rpc("hr_protected_record",{
      p_profile_id:profileId,
      p_record_type:recordType,
      p_payload:payload,
      p_replaces_id:replaceId||null,
      p_reason:reason.trim(),
    });

    if(e){
      if(uploadedPath) await supabase.storage.from("ceac-hr-private").remove([uploadedPath]);
      setBusy(false);
      setError(humanError(e,"The protected HR record could not be saved."));
      return;
    }

    setBusy(false);
    setNotice("Protected HR record saved.");
    resetForm(recordType);
    await loadSummary();
  }

  async function openDocument(row) {
    setError(null);
    const {data,error:e}=await supabase.storage.from("ceac-hr-private").createSignedUrl(row.storage_path,60);
    if(e || !data?.signedUrl){
      setError(humanError(e,"The protected document could not be opened."));
      return;
    }
    window.open(data.signedUrl,"_blank","noopener,noreferrer");
  }

  const set=(key,value)=>setFields(current=>({...current,[key]:value}));

  if(loading) return <div className="body"><LoadingState label="Loading protected HR…" /></div>;

  return <div className="body">
    <div style={{paddingTop:26}}>
      <div className="eyebrow">Protected employee records</div>
      <h1 className="h1">Protected HR</h1>
      <p className="screen-note">Sensitive identifiers, terms, compensation, payment details and documents. Access is separately granted and every read/write is recorded.</p>
    </div>

    {error&&<ProductNotice tone="error" title="Protected HR">{error}</ProductNotice>}
    {notice&&<ProductNotice tone="success" title="Protected HR">{notice}</ProductNotice>}

    <div className="split" style={{marginTop:18}}>
      <div className="main-col">
        <div className="card" style={{padding:15}}>
          <FieldGroup label="Employee">
            <select className="field" aria-label="Protected HR employee" value={profileId} onChange={e=>{setProfileId(e.target.value);resetForm(recordType);}}>
              {people.map(person=><option key={person.id} value={person.id}>{person.full_name} · {person.email}</option>)}
            </select>
          </FieldGroup>
          {selectedPerson&&<p className="small" style={{margin:"8px 0 0"}}>{selectedPerson.job_title||"No job title recorded"} · {selectedPerson.active?"Active":"Inactive"}</p>}
        </div>

        {detailLoading?<LoadingState label="Opening protected record…"/>:<>
          <div className="sec"><span>Identifiers</span><span>{summary?.identifiers?.length||0}</span></div>
          {(summary?.identifiers||[]).map(row=><div className="row" key={row.id}>
            <div className="row-t">{row.identifier_type} · {statusText(row.status)}</div>
            <div className="row-m">{row.identifier_value}{row.expires_on?" · expires "+dateLabel(row.expires_on):""}</div>
          </div>)}
          {!(summary?.identifiers||[]).length&&<EmptyState compact title="No protected identifiers">Nothing recorded for this employee.</EmptyState>}

          <div className="sec"><span>Employment terms</span><span>{summary?.employment_terms?.length||0}</span></div>
          {(summary?.employment_terms||[]).map(row=><div className="row" key={row.id}>
            <div className="row-t">{row.term_type} · {statusText(row.status)}</div>
            <div className="row-m">{dateLabel(row.starts_on)}{row.ends_on?" — "+dateLabel(row.ends_on):""}</div>
            <div className="small" style={{marginTop:6}}>{row.summary}</div>
          </div>)}
          {!(summary?.employment_terms||[]).length&&<EmptyState compact title="No protected employment terms">Nothing recorded for this employee.</EmptyState>}

          <div className="sec"><span>Compensation history</span><span>{summary?.compensation?.length||0}</span></div>
          {(summary?.compensation||[]).map(row=><div className="row" key={row.id}>
            <div className="row-t">{row.currency} {row.amount_minor} smallest units · {row.basis_label}</div>
            <div className="row-m">Effective {dateLabel(row.effective_on)} · {statusText(row.status)}</div>
            {row.note&&<div className="small" style={{marginTop:6}}>{row.note}</div>}
          </div>)}
          {!(summary?.compensation||[]).length&&<EmptyState compact title="No compensation history">Nothing recorded for this employee.</EmptyState>}

          <div className="sec"><span>Payment details</span><span>{summary?.payment_details?.length||0}</span></div>
          {(summary?.payment_details||[]).map(row=><div className="row" key={row.id}>
            <div className="row-t">{row.payment_type} · {statusText(row.status)}</div>
            <div className="row-m">{row.provider_name} · {row.account_name} · {row.account_reference}</div>
            {row.branch_reference&&<div className="small" style={{marginTop:6}}>{row.branch_reference}</div>}
          </div>)}
          {!(summary?.payment_details||[]).length&&<EmptyState compact title="No payment details">Nothing recorded for this employee.</EmptyState>}

          <div className="sec"><span>Protected documents</span><span>{summary?.documents?.length||0}</span></div>
          {(summary?.documents||[]).map(row=><button className="row row-button" key={row.id} onClick={()=>openDocument(row)}>
            <div className="row-t">{row.title} · {statusText(row.status)}</div>
            <div className="row-m">{row.document_type}{row.expires_on?" · expires "+dateLabel(row.expires_on):""}</div>
          </button>)}
          {!(summary?.documents||[]).length&&<EmptyState compact title="No protected documents">Upload a protected document from the form.</EmptyState>}
        </>}
      </div>

      <div className="side-col">
        <div className="sec"><span>Record protected information</span></div>
        <div className="card" style={{padding:15}}>
          <FieldGroup label="Record type">
            <select className="field" aria-label="Protected HR record type" value={recordType} onChange={e=>resetForm(e.target.value)}>
              {TYPES.map(([key,label])=><option key={key} value={key}>{label}</option>)}
            </select>
          </FieldGroup>

          {activeReplacements.length>0&&<FieldGroup label="Replace an existing active record (optional)">
            <select className="field" aria-label="Protected HR replacement" value={replaceId} onChange={e=>setReplaceId(e.target.value)}>
              <option value="">Add a new record</option>
              {activeReplacements.map(row=><option key={row.id} value={row.id}>
                {row.identifier_type||row.term_type||row.basis_label||row.payment_type||row.title||"Active record"}
              </option>)}
            </select>
          </FieldGroup>}

          {recordType==="identifier"&&<>
            <FieldGroup label="Identifier type"><input className="field" aria-label="Identifier type" value={fields.identifierType||""} onChange={e=>set("identifierType",e.target.value)} placeholder="Ghana Card, SSNIT, tax identifier…" /></FieldGroup>
            <FieldGroup label="Identifier value"><input className="field" aria-label="Identifier value" value={fields.identifierValue||""} onChange={e=>set("identifierValue",e.target.value)} /></FieldGroup>
            <FieldGroup label="Issued on"><input className="field" aria-label="Identifier issued on" type="date" value={fields.issuedOn||""} onChange={e=>set("issuedOn",e.target.value)} /></FieldGroup>
            <FieldGroup label="Expires on"><input className="field" aria-label="Identifier expires on" type="date" value={fields.expiresOn||""} onChange={e=>set("expiresOn",e.target.value)} /></FieldGroup>
          </>}

          {recordType==="employment_term"&&<>
            <FieldGroup label="Term type"><input className="field" aria-label="Employment term type" value={fields.termType||""} onChange={e=>set("termType",e.target.value)} placeholder="Contract term, probation, appointment…" /></FieldGroup>
            <FieldGroup label="Summary"><textarea className="field" aria-label="Employment term summary" rows="4" value={fields.summary||""} onChange={e=>set("summary",e.target.value)} /></FieldGroup>
            <FieldGroup label="Starts on"><input className="field" aria-label="Employment term start date" type="date" value={fields.startsOn||""} onChange={e=>set("startsOn",e.target.value)} /></FieldGroup>
            <FieldGroup label="Ends on"><input className="field" aria-label="Employment term end date" type="date" value={fields.endsOn||""} onChange={e=>set("endsOn",e.target.value)} /></FieldGroup>
          </>}

          {recordType==="compensation"&&<>
            <FieldGroup label="Amount in the smallest currency unit"><input className="field" aria-label="Compensation amount" inputMode="numeric" value={fields.amountMinor||""} onChange={e=>set("amountMinor",e.target.value.replace(/[^0-9]/g,""))} placeholder="For GHS 6,500.00 enter 650000" /></FieldGroup>
            <FieldGroup label="Currency"><input className="field" aria-label="Compensation currency" maxLength="3" value={fields.currency||""} onChange={e=>set("currency",e.target.value.toUpperCase())} placeholder="GHS" /></FieldGroup>
            <FieldGroup label="Basis"><input className="field" aria-label="Compensation basis" value={fields.basisLabel||""} onChange={e=>set("basisLabel",e.target.value)} placeholder="Monthly, annual, hourly…" /></FieldGroup>
            <FieldGroup label="Effective on"><input className="field" aria-label="Compensation effective date" type="date" value={fields.effectiveOn||""} onChange={e=>set("effectiveOn",e.target.value)} /></FieldGroup>
            <FieldGroup label="Ends on"><input className="field" aria-label="Compensation end date" type="date" value={fields.endsOn||""} onChange={e=>set("endsOn",e.target.value)} /></FieldGroup>
            <FieldGroup label="Note"><textarea className="field" aria-label="Compensation note" rows="3" value={fields.note||""} onChange={e=>set("note",e.target.value)} /></FieldGroup>
          </>}

          {recordType==="payment_detail"&&<>
            <FieldGroup label="Payment type"><input className="field" aria-label="Payment type" value={fields.paymentType||""} onChange={e=>set("paymentType",e.target.value)} placeholder="Bank transfer, mobile money…" /></FieldGroup>
            <FieldGroup label="Provider"><input className="field" aria-label="Payment provider" value={fields.providerName||""} onChange={e=>set("providerName",e.target.value)} /></FieldGroup>
            <FieldGroup label="Account name"><input className="field" aria-label="Payment account name" value={fields.accountName||""} onChange={e=>set("accountName",e.target.value)} /></FieldGroup>
            <FieldGroup label="Account reference"><input className="field" aria-label="Payment account reference" value={fields.accountReference||""} onChange={e=>set("accountReference",e.target.value)} /></FieldGroup>
            <FieldGroup label="Branch / routing detail"><input className="field" aria-label="Payment branch reference" value={fields.branchReference||""} onChange={e=>set("branchReference",e.target.value)} /></FieldGroup>
          </>}

          {recordType==="document"&&<>
            <FieldGroup label="Document type"><input className="field" aria-label="Protected document type" value={fields.documentType||""} onChange={e=>set("documentType",e.target.value)} placeholder="Contract, ID copy, appointment letter…" /></FieldGroup>
            <FieldGroup label="Title"><input className="field" aria-label="Protected document title" value={fields.title||""} onChange={e=>set("title",e.target.value)} /></FieldGroup>
            <FieldGroup label="Issued on"><input className="field" aria-label="Protected document issued on" type="date" value={fields.issuedOn||""} onChange={e=>set("issuedOn",e.target.value)} /></FieldGroup>
            <FieldGroup label="Expires on"><input className="field" aria-label="Protected document expires on" type="date" value={fields.expiresOn||""} onChange={e=>set("expiresOn",e.target.value)} /></FieldGroup>
            <FieldGroup label="File"><input className="field" aria-label="Protected document file" type="file" onChange={e=>setFile(e.target.files?.[0]||null)} /></FieldGroup>
          </>}

          <FieldGroup label="Reason / context"><textarea className="field" aria-label="Protected HR reason" rows="3" value={reason} onChange={e=>setReason(e.target.value)} placeholder="Why this protected record is being created or corrected" /></FieldGroup>
          <button className="btn" style={{marginTop:14}} disabled={busy||!profileId||!reason.trim()} onClick={saveRecord}>{busy?"Saving…":"Save protected record"}</button>
        </div>
        <p className="screen-note">Corrections replace the active record with a new version. Earlier protected history is retained and is not deleted.</p>
      </div>
    </div>
  </div>;
}
