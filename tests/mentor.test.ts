import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import ts from "typescript";
import {bengali,translate} from "../lib/translations.ts";
import {categories,lessonMessage,recordSchema} from "../lib/mentor.ts";
import type {Records} from "../lib/mentor.ts";

const fixture:Records={teacher:"Ustad Test",students:[{id:"a",name:"Student A",contact:"+8801000000000",group:"Morning",notes:"Private background",created:"2026-09-12"},{id:"b",name:"Student B",contact:"+8802000000000",group:"Evening",notes:"Not for sharing",created:"2026-09-12"}],lessons:[{id:"lesson-a",studentId:"a",studentName:"Student A",date:"2026-09-12",type:"Sabqi",from:562,to:563,status:"complete",outcome:"Passed with revision",notes:"Good effort",assignment:"Repeat the marked passage",marks:[{id:"mark-a",page:562,x:.4,y:.5,category:"tajwid",reference:"Al-Mulk 4",note:"Slow down here",selfCorrected:false,resolved:false}]}]};
test("a complete register retains precise marks and lesson history",()=>{const result=recordSchema.parse(JSON.parse(JSON.stringify(fixture)));assert.deepEqual(result,fixture);assert.equal(categories.length,6)});
test("a share message contains only the chosen lesson, never private profiles",()=>{const message=lessonMessage(fixture.lessons[0],fixture.teacher);assert.match(message,/Student A/);assert.match(message,/Al-Mulk 4/);for(const privateText of ["Student B","Private background","Not for sharing","+8801000000000","+8802000000000"])assert.ok(!message.includes(privateText));});
test("bad ranges and marks outside the lesson cannot be imported",()=>{for(const change of [(r:Records)=>{r.lessons[0].to=561},(r:Records)=>{r.lessons[0].marks[0].page=564},(r:Records)=>{r.lessons[0].marks[0].x=1.5},(r:Records)=>{r.lessons[0].from=0}]){const r=structuredClone(fixture);change(r);assert.equal(recordSchema.safeParse(r).success,false)}});
test("duplicate and orphan lesson records cannot be imported",()=>{const r=structuredClone(fixture);r.lessons.push(r.lessons[0]);assert.equal(recordSchema.safeParse(r).success,false);r.lessons.pop();r.lessons[0].studentId="missing";assert.equal(recordSchema.safeParse(r).success,false)});
test("rechecking retains the original correction and adds its resolution",()=>{const r=structuredClone(fixture);r.lessons[0].marks[0].resolved=true;assert.equal(recordSchema.parse(r).lessons[0].marks[0].note,"Slow down here");assert.match(lessonMessage(r.lessons[0]),/Correct on recheck/)});
test("reference-only notes are distinct from marked image positions",()=>{const r=structuredClone(fixture);r.lessons[0].marks[0].location="reference";assert.equal(recordSchema.parse(r).lessons[0].marks[0].location,"reference")});
test("yellow text and area highlights survive save and backup round trips",()=>{
 const r=structuredClone(fixture),base=r.lessons[0].marks[0];
 r.lessons[0].marks=[{...base,location:"text",verseKey:"67:4",wordStart:1,wordEnd:3,selectedText:"ثُمَّ ٱرْجِعِ ٱلْبَصَرَ"},{...base,id:"area",location:"area",x:.1,y:.2,width:.3,height:.05}];
 assert.deepEqual(recordSchema.parse(JSON.parse(JSON.stringify(r))),r);
 assert.ok(lessonMessage(r.lessons[0]).includes("ثُمَّ ٱرْجِعِ ٱلْبَصَرَ"));
 r.lessons[0].marks[0].wordEnd=0;assert.equal(recordSchema.safeParse(r).success,false);
 r.lessons[0].marks.shift();r.lessons[0].marks[0].width=1;assert.equal(recordSchema.safeParse(r).success,false);
});
test("all 604 text pages cover every ayah once in Quran order",()=>{
 const meta=JSON.parse(fs.readFileSync('public/quran/metadata.json','utf8'));
 const seen:string[]=[];
 for(const p of meta.pages){const verses=JSON.parse(fs.readFileSync(`public/quran/text/${p[0]}.json`,'utf8'));assert.equal(verses[0].key,`${p[1]}:${p[2]}`);assert.equal(verses.at(-1).key,`${p[3]}:${p[4]}`);for(const v of verses){assert.ok(v.text.trim());seen.push(v.key)}}
 assert.equal(seen.length,6236);assert.equal(new Set(seen).size,6236);
 const expected=meta.surahs.flatMap((s:number[])=>Array.from({length:s[4]},(_,i)=>`${s[0]}:${i+1}`));assert.deepEqual(seen,expected);
});
test("a dated test retains its type and date in saved and shared records",()=>{
 const r=structuredClone(fixture);r.lessons[0].type="Test";r.lessons[0].date="2026-08-20";
 const saved=recordSchema.parse(JSON.parse(JSON.stringify(r))).lessons[0];
 assert.equal(saved.type,"Test");assert.equal(saved.date,"2026-08-20");
 assert.match(lessonMessage(saved),/Test/);assert.match(lessonMessage(saved),/2026-08-20/);
 const bn=lessonMessage(saved,r.teacher,"bn");assert.match(bn,/পরীক্ষা/);assert.match(bn,/তাজবিদ/);assert.match(bn,/Student A/);assert.match(bn,/2026-08-20/);assert.ok(!bn.includes("Private background"));
});
test("English stays the default and Bengali labels preserve stored enum values",()=>{
 assert.equal(translate("Test","en"),"Test");assert.equal(translate("Test","bn"),"পরীক্ষা");assert.equal(translate("Student A","bn"),"Student A");
 const page=fs.readFileSync('app/page.tsx','utf8');assert.match(page,/<option value="Test">\{t\("Test"\)\}/);assert.match(page,/<option value="Passed">\{t\("Passed"\)\}/);assert.match(page,/name="date" type="date" required/);
});
test("every static translated interface string has a Bengali translation",()=>{
 for(const file of ['app/page.tsx','components/lesson-reader.tsx']){
  const source=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const visit=(node:ts.Node)=>{if(ts.isCallExpression(node)&&ts.isIdentifier(node.expression)&&node.expression.text==='t'&&node.arguments[0]&&ts.isStringLiteral(node.arguments[0])){const key=node.arguments[0].text.trim();if(/[A-Za-z]/.test(key))assert.ok(bengali[key],`Missing Bengali: ${key}`)}ts.forEachChild(node,visit)};visit(source);
 }
});
