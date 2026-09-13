import { z } from "zod";
export const categories = [
  { id: "prompt", label: "Prompt needed", short: "P", color: "#b07813" },
  { id: "word", label: "Word error", short: "W", color: "#bb4452" },
  { id: "pronunciation", label: "Pronunciation", short: "H", color: "#8a58ad" },
  { id: "tajwid", label: "Tajwid", short: "T", color: "#2874a5" },
  { id: "stop", label: "Stop / start", short: "S", color: "#bd6437" },
  { id: "similar", label: "Similar passage", short: "M", color: "#57733c" },
] as const;
const id = z.string().min(1).max(100);
const short = z.string().max(300);
export const studentSchema = z.object({ id, name:z.string().trim().min(1).max(100), contact:z.string().max(40), group:short, notes:z.string().max(3000), created:z.string().max(40) });
export const markSchema = z.object({id, page:z.number().int().min(1).max(604), x:z.number().min(0).max(1), y:z.number().min(0).max(1), category:z.enum(["prompt","word","pronunciation","tajwid","stop","similar"]), location:z.enum(["point","reference","text","area"]).optional(), reference:short, note:z.string().max(1000), selfCorrected:z.boolean(), resolved:z.boolean(), verseKey:z.string().regex(/^\d{1,3}:\d{1,3}$/).optional(), selectedText:z.string().max(5000).optional(), wordStart:z.number().int().min(0).max(1000).optional(), wordEnd:z.number().int().min(0).max(1000).optional(), width:z.number().positive().max(1).optional(), height:z.number().positive().max(1).optional()}).superRefine((m,ctx)=>{
 if(m.location==="text"&&(!m.verseKey||!m.selectedText||m.wordStart===undefined||m.wordEnd===undefined||m.wordEnd<m.wordStart))ctx.addIssue({code:"custom",message:"A text highlight needs an ayah and valid word range"});
 if(m.location==="area"&&(!m.width||!m.height||m.x+m.width>1.001||m.y+m.height>1.001))ctx.addIssue({code:"custom",message:"A page highlight must stay inside the page"});
});
export const lessonSchema = z.object({id, studentId:id, studentName:short, date:z.string().max(40), type:z.enum(["Sabaq","Sabqi","Manzil"]), from:z.number().int().min(1).max(604), to:z.number().int().min(1).max(604), status:z.enum(["draft","complete"]), outcome:z.enum(["Passed","Passed with revision","Repeat"]), notes:z.string().max(4000), assignment:z.string().max(2000), marks:z.array(markSchema).max(500)}).refine(l=>l.to>=l.from,"The last page must follow the first page");
export const recordSchema = z.object({students:z.array(studentSchema).max(500), lessons:z.array(lessonSchema).max(3000), teacher:z.string().max(100)}).superRefine((r,ctx)=>{
  if(new Set(r.students.map(s=>s.id)).size!==r.students.length || new Set(r.lessons.map(l=>l.id)).size!==r.lessons.length)ctx.addIssue({code:"custom",message:"Duplicate record identifiers"});
  for(const l of r.lessons){if(!r.students.some(s=>s.id===l.studentId))ctx.addIssue({code:"custom",message:"Lesson student is missing"});if(l.marks.some(m=>m.page<l.from||m.page>l.to))ctx.addIssue({code:"custom",message:"A mark is outside the lesson range"});}
});
export type Student=z.infer<typeof studentSchema>;
export type Mark=z.infer<typeof markSchema>;
export type Lesson=z.infer<typeof lessonSchema>;
export type Records=z.infer<typeof recordSchema>;
export const emptyRecords:Records={students:[],lessons:[],teacher:""};
export const uid=()=>crypto.randomUUID();
export const today=()=>new Date().toLocaleDateString("en-CA");
export function lessonMessage(l:Lesson,teacher="") {return [`HIFZ MENTOR · LESSON RECORD`,`${l.studentName} · ${l.date}`,`${l.type} · Mushaf pages ${l.from}${l.to!==l.from?`–${l.to}`:""}`,`Outcome: ${l.outcome}`,"",...l.marks.map((m,i)=>`${i+1}. Page ${m.page}${m.reference?` · ${m.reference}`:""}: ${categories.find(c=>c.id===m.category)?.label}${m.selectedText?` · “${m.selectedText}”`:""}${m.selfCorrected?" (self-corrected)":""}${m.resolved?" · Correct on recheck":""}${m.note?` — ${m.note}`:""}`),l.marks.length?"":"No mistakes marked.",l.notes?`Feedback: ${l.notes}`:"",l.assignment?`Next lesson: ${l.assignment}`:"",teacher?`Ustad: ${teacher}`:""].filter((s,i,a)=>s||a[i-1]).join("\n");}

