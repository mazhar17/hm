import { env } from "cloudflare:workers";
import { emptyRecords, recordSchema } from "../../../lib/mentor";
export const dynamic="force-dynamic";
function db(){if(!env.DB)throw Error("Storage unavailable");return env.DB;}
function owner(r:Request){return r.headers.get("oai-authenticated-user-id");}
export async function GET(request:Request){
  const user=owner(request);if(!user)return Response.json({error:"Sign in to open your private register."},{status:401});
  try{const row=await db().prepare("SELECT data, revision FROM mentor_records WHERE owner = ?").bind(user).first<{data:string;revision:number}>();return Response.json({records:row?JSON.parse(row.data):emptyRecords,revision:row?.revision??0,owner:user},{headers:{"Cache-Control":"no-store"}});}catch(e){console.error("Record load failed",e);return Response.json({error:"Your register could not be loaded. Please retry."},{status:503});}
}
export async function PUT(request:Request){
  const user=owner(request);if(!user)return Response.json({error:"Sign in before saving."},{status:401});
  const origin=request.headers.get("origin");if(origin&&origin!==new URL(request.url).origin)return Response.json({error:"Invalid request origin"},{status:403});
  try{
    const raw=await request.text();if(raw.length>4_000_000)return Response.json({error:"This register is too large. Export a backup before continuing."},{status:413});
    const payload=JSON.parse(raw);const result=recordSchema.safeParse(payload.records);
    if(!result.success||!Number.isInteger(payload.revision)||payload.revision<0)return Response.json({error:"The record contains invalid fields."},{status:400});
    const data=JSON.stringify(result.data);let saved;
    if(payload.revision===0)saved=await db().prepare("INSERT INTO mentor_records (owner,data,revision) VALUES (?,?,1) ON CONFLICT(owner) DO NOTHING RETURNING revision").bind(user,data).first<{revision:number}>();
    else saved=await db().prepare("UPDATE mentor_records SET data = ?, revision = revision + 1 WHERE owner = ? AND revision = ? RETURNING revision").bind(data,user,payload.revision).first<{revision:number}>();
    if(!saved)return Response.json({error:"This register changed on another device. Download your current backup, then reload before editing further."},{status:409});
    return Response.json({revision:saved.revision});
  }catch(e){console.error("Record save failed",e);return Response.json({error:"Could not save. Your changes are still on this screen; retry or download a backup."},{status:503});}
}

