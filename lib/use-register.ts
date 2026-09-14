"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import {emptyRecords,Records,recordSchema} from "./mentor";
type Reply={error:string;records:Records;revision:number;owner:string};
export function useRegister(){
 const [records,setRecords]=useState<Records>(emptyRecords),[ready,setReady]=useState(false),[status,setStatus]=useState("Loading register…"),[error,setError]=useState(""),[unauthorized,setUnauthorized]=useState(false),[recovery,setRecovery]=useState<Records|null>(null);
 const current=useRef(records),revision=useRef(0),serial=useRef(0),saved=useRef(0),busy=useRef(false),locked=useRef(false),draftKey=useRef("");
 const retain=()=>{if(!draftKey.current)return;try{localStorage.setItem(draftKey.current,JSON.stringify({revision:revision.current,records:current.current}));}catch{/* The visible unsaved indicator and backup remain available. */}};
 const load=useCallback(async()=>{try{
   setError("");const r=await fetch('/api/records');const j=await r.json() as Reply;
   if(!r.ok){setUnauthorized(r.status===401);throw Error(j.error);}
   revision.current=j.revision;current.current=j.records;draftKey.current=`hifz-mentor-pending-${j.owner}`;
   try{const raw=localStorage.getItem(draftKey.current);if(raw){const pending=JSON.parse(raw);const checked=recordSchema.safeParse(pending.records);if(checked.success){if(JSON.stringify(checked.data)===JSON.stringify(j.records))localStorage.removeItem(draftKey.current);else if(pending.revision===j.revision){current.current=checked.data;serial.current=1;}else setRecovery(checked.data);}}}catch{/* Malformed local drafts never replace the server register. */}
   setRecords(current.current);setReady(true);setStatus(serial.current?"Recovered unsaved changes":"All changes saved");
 }catch(e){setError((e as Error).message);setStatus("Register unavailable");}},[]);
 useEffect(()=>{void load();},[load]);
 const save=useCallback(async()=>{
   if(busy.current||locked.current||serial.current===saved.current)return;
   busy.current=true;const version=serial.current;setStatus("Saving…");
   try{const r=await fetch('/api/records',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({records:current.current,revision:revision.current})});const j=await r.json() as Reply;
     if(!r.ok){if(r.status===409)locked.current=true;throw Error(j.error);}
     revision.current=j.revision;saved.current=version;setError("");setStatus(serial.current===version?"All changes saved":"Unsaved changes");
     if(serial.current===version){try{localStorage.removeItem(draftKey.current)}catch{}}else retain();
   }catch(e){setError((e as Error).message);setStatus("Changes not saved");retain();}finally{busy.current=false;}
 },[]);
 useEffect(()=>{const t=setInterval(()=>{if(!error&&!recovery)void save();},1000);return()=>clearInterval(t)},[save,error,recovery]);
 useEffect(()=>{const guard=(e:BeforeUnloadEvent)=>{if(serial.current!==saved.current){retain();e.preventDefault();e.returnValue="";}};window.addEventListener("beforeunload",guard);return()=>window.removeEventListener("beforeunload",guard);},[]);
 function change(next:Records){if(!ready||locked.current||recovery)return;current.current=next;setRecords(next);serial.current++;retain();setStatus("Unsaved changes");}
 function dismissRecovery(){try{localStorage.removeItem(draftKey.current)}catch{}setRecovery(null)}
 return {records,change,ready,status,error,unauthorized,retry:ready?save:load,locked:locked.current||!!recovery,recovery,dismissRecovery};
}
