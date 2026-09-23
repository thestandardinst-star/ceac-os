import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { LoadingState, ProductNotice } from "../components/bits";
import { humanError } from "../lib/productLanguage";

function roomName(room){if(!room)return "Room";if(room.kind==="project")return room.projects?.name||"Project Room";if(room.kind==="sub_team")return room.sub_teams?.name||"Sub-team Room";return room.units?.name||"Unit Room";}
function contextFor(room){if(room?.kind==="project")return{kind:"project",projectId:room.project_id};if(room?.kind==="sub_team")return{kind:"sub_team",subTeamId:room.sub_team_id};return{kind:"unit",unitId:room?.unit_id};}

export default function Inbox({me,openRoom,openAnnouncements}){
  const [view,setView]=useState("all"),[messages,setMessages]=useState([]),[mentions,setMentions]=useState(new Set()),[reads,setReads]=useState(new Map()),[announcements,setAnnouncements]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState(null);
  useEffect(()=>{load();},[me.id,me.unit_id]);
  async function load(){
    setLoading(true);setError(null);
    try{
      const [messageResult,mentionResult,readResult,announcementResult]=await Promise.all([
        supabase.from("room_messages").select("id,room_id,author_id,body,created_at,profiles!room_messages_author_id_fkey(full_name),room_message_refs(id,object_type,object_id,label),rooms(id,kind,unit_id,sub_team_id,project_id,units(name),sub_teams(name),projects(name))").order("created_at",{ascending:false}).limit(120),
        supabase.from("room_mentions").select("message_id").eq("profile_id",me.id).order("created_at",{ascending:false}).limit(120),
        supabase.from("room_reads").select("room_id,last_read_at").eq("profile_id",me.id),
        supabase.from("announcements").select("id,title,body,priority,requires_acknowledgement,published_at,profiles!announcements_author_id_fkey(full_name),announcement_receipts(profile_id,read_at,acknowledged_at)").order("published_at",{ascending:false}).limit(40)
      ]);
      const first=[messageResult.error,mentionResult.error,readResult.error,announcementResult.error].find(Boolean);if(first)throw first;
      setMessages(messageResult.data||[]);setMentions(new Set((mentionResult.data||[]).map(row=>row.message_id)));setReads(new Map((readResult.data||[]).map(row=>[row.room_id,row.last_read_at])));setAnnouncements(announcementResult.data||[]);
    }catch(err){setError(humanError(err,"Messages could not be loaded."));}finally{setLoading(false);}
  }
  const rows=useMemo(()=>{
    const messageRows=messages.map(message=>({type:"message",at:message.created_at,message,mentioned:mentions.has(message.id),work:(message.room_message_refs||[]).some(ref=>ref.object_type==="work_item"),unread:message.author_id!==me.id&&(!reads.get(message.room_id)||new Date(message.created_at)>new Date(reads.get(message.room_id)))}));
    const announcementRows=announcements.map(announcement=>({type:"announcement",at:announcement.published_at,announcement,unread:!(announcement.announcement_receipts||[]).some(receipt=>receipt.profile_id===me.id&&receipt.read_at)}));
    const combined=view==="announcements"?announcementRows:view==="mentions"?messageRows.filter(row=>row.mentioned):view==="work"?messageRows.filter(row=>row.work):view==="rooms"?messageRows:[...messageRows,...announcementRows];
    return combined.sort((a,b)=>new Date(b.at)-new Date(a.at));
  },[messages,announcements,mentions,reads,view,me.id]);
  const unread=rows.filter(row=>row.unread).length;
  return <div className="body premium-page inbox-page">
    <header className="premium-page-head"><div><span className="eyebrow">Communication</span><h1 className="h1">Messages</h1><p className="screen-note">Rooms, mentions, work context and announcements. CEAC OS does not provide unrestricted direct messages.</p></div><span className="premium-count-badge">{unread} unread</span></header>
    <div className="premium-filter-row" role="tablist" aria-label="Message views">{[["all","All"],["rooms","Rooms"],["mentions","Mentions"],["work","Work"],["announcements","Announcements"]].map(([key,label])=><button key={key} role="tab" aria-selected={view===key} className={view===key?"on":""} onClick={()=>setView(key)}>{label}</button>)}</div>
    {error&&<ProductNotice tone="error" title="Could not load Messages">{error}</ProductNotice>}
    {loading?<LoadingState label="Loading Messages…"/>:<section className="premium-surface inbox-list">{rows.length?rows.map(row=>row.type==="announcement"
      ?<button key={`announcement-${row.announcement.id}`} className={`inbox-row ${row.unread?"unread":""}`} onClick={openAnnouncements}><span className="inbox-icon announcement">A</span><span className="inbox-copy"><span className="inbox-meta"><strong>Announcement</strong><time>{new Date(row.at).toLocaleString("en-GB",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</time></span><b>{row.announcement.title}</b><small>{row.announcement.profiles?.full_name||"CEAC"}{row.announcement.requires_acknowledgement?" · acknowledgement may be required":""}</small></span></button>
      :<button key={row.message.id} className={`inbox-row ${row.unread?"unread":""}`} onClick={()=>openRoom?.(contextFor(row.message.rooms))}><span className={`inbox-icon ${row.mentioned?"mention":"room"}`}>{row.mentioned?"@":"#"}</span><span className="inbox-copy"><span className="inbox-meta"><strong>{roomName(row.message.rooms)}</strong><time>{new Date(row.at).toLocaleString("en-GB",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</time></span><b>{row.message.profiles?.full_name||"CEAC member"}</b><small>{row.message.body}</small>{row.work&&<span className="inbox-context">Linked work</span>}</span></button>)
      :<div className="premium-empty">Nothing is waiting in this view.</div>}</section>}
  </div>;
}