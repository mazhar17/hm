"use client";
import { LanguageProvider, useLanguage } from "../lib/language";
import { useEffect, useRef, useState, ReactNode } from "react";
import { BookOpen, Users, ClipboardList, Settings, Plus, ArrowUpRight, Feather, Search, ChevronLeft, ChevronRight, Check, X, Undo2, Download, Share2, Printer, MessageCircle, Pencil, CircleHelp, ShieldCheck, ArrowLeft, CheckCircle2, Copy, FileText, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { useRegister } from "../lib/use-register";
import { categories, emptyRecords, Lesson, Mark, Records, Student, uid, today, recordSchema, lessonMessage } from "../lib/mentor";
import { download, pageImage, printLesson } from "../lib/exports";
import { LessonReader } from "../components/lesson-reader";
type View = "students" | "lesson" | "history" | "settings";
type Meta = {
    surahs: [
        number,
        string,
        string,
        string,
        number,
        number,
        number
    ][];
    pages: [
        number,
        number,
        number,
        number,
        number,
        number,
        number
    ][];
};
const nav = [{ id: "students", label: "Students", icon: Users }, { id: "lesson", label: "Take lesson", icon: BookOpen }, { id: "history", label: "Lesson history", icon: ClipboardList }, { id: "settings", label: "Settings", icon: Settings }] as const;
const initials = (s: string) => s.trim().split(/\s+/).slice(0, 2).map(x => x[0]).join("").toUpperCase();
function newLesson(s: Student, from = 562, to = 562, type: Lesson["type"] = "Sabqi"): Lesson { return { id: uid(), studentId: s.id, studentName: s.name, date: today(), type, from, to, status: "draft", outcome: "Passed with revision", notes: "", assignment: "", marks: [] }; }
function sampleRecords(): Records { const s: Student = { id: "sample-ahmed", name: "Ahmed Rahman", contact: "", group: "Morning hifz", notes: "Example student — practice freely.", created: today() }; const l = newLesson(s); l.id = "sample-lesson"; l.marks = [{ id: "sample-mark", page: 562, x: .38, y: .401, category: "prompt", reference: "Al-Mulk 4", note: "Repeat the phrase without prompting.", selfCorrected: false, resolved: false }]; return { teacher: "", students: [s, { ...s, id: "sample-yusuf", name: "Yusuf Abdullah" }, { ...s, id: "sample-maryam", name: "Maryam Hasan", group: "Afternoon hifz" }], lessons: [l] }; }
function Modal({ title, children, onClose, wide = false }: {
    title: string;
    children: ReactNode;
    onClose: () => void;
    wide?: boolean;
}) { const { t } = useLanguage(); const ref = useRef<HTMLDialogElement>(null); useEffect(() => { ref.current?.showModal(); const d = ref.current; return () => d?.close(); }, []); return <dialog ref={ref} className={wide ? "modal wide" : "modal"} onCancel={onClose} onClick={e => { if (e.target === e.currentTarget)
    onClose(); }}><div className="modal-head"><h2>{t(title)}</h2><button className="icon" aria-label={t("Close dialog")} onClick={onClose}><X size={20}/></button></div>{children}</dialog>; }
function Field({ label, children }: {
    label: string;
    children: ReactNode;
}) { const { t } = useLanguage(); return <label className="field"><span>{t(label)}</span>{children}</label>; }
export default function Home() { return <LanguageProvider><HomeContent /></LanguageProvider>; }
function HomeContent() {
    const { t, lang, setLanguage } = useLanguage();
    const register = useRegister();
    const [demo, setDemo] = useState<Records | null>(null);
    const records = demo ?? register.records;
    const [view, setView] = useState<View>("students"), [meta, setMeta] = useState<Meta | null>(null), [metaError, setMetaError] = useState(false), [query, setQuery] = useState(""), [studentFilter, setStudentFilter] = useState("all"), [activeId, setActiveId] = useState<string | null>(null), [page, setPage] = useState(562), [zoom, setZoom] = useState(1), [category, setCategory] = useState<Mark["category"]>("prompt"), [notice, setNotice] = useState("");
    const [studentForm, setStudentForm] = useState<Student | null | "new">(null), [startFor, setStartFor] = useState<string | null>(null), [markId, setMarkId] = useState<string | null>(null), [finish, setFinish] = useState(false), [shareId, setShareId] = useState<string | null>(null), [help, setHelp] = useState(false), [imageError, setImageError] = useState(false), [imageLoaded, setImageLoaded] = useState(false), [exporting, setExporting] = useState(false);
    const current = records.lessons.find(l => l.id === activeId), selectedMark = current?.marks.find(m => m.id === markId), shared = records.lessons.find(l => l.id === shareId);
    const writable = !!demo || (register.ready && !register.locked);
    const fileInput = useRef<HTMLInputElement>(null);
    const completed = records.lessons.filter(l => l.status === "complete");
    const unresolved = completed.flatMap(l => l.marks).filter(m => !m.resolved && !m.selfCorrected).length;
    function change(next: Records) { if (demo)
        setDemo(next);
    else
        register.change(next); }
    function updateLesson(next: Lesson) { change({ ...records, lessons: records.lessons.map(l => l.id === next.id ? next : l) }); }
    function openLesson(l: Lesson) { setActiveId(l.id); setPage(l.from); setZoom(1); setView("lesson"); setImageLoaded(false); setImageError(false); }
    function goto(p: number) { if (!current || p === page)
        return; setPage(Math.max(current.from, Math.min(current.to, p))); setImageError(false); setImageLoaded(false); }
    function addMark(x = .5, y = .5, referenceOnly = false) { if (!current || current.status !== "draft" || !writable)
        return; const m: Mark = { id: uid(), page, x: Math.max(.015, Math.min(.985, x)), y: Math.max(.015, Math.min(.985, y)), category, location: referenceOnly ? "reference" : "point", reference: "", note: "", selfCorrected: false, resolved: false }; updateLesson({ ...current, marks: [...current.marks, m] }); return m.id; }
    function toast(message: string) { setNotice(t(message)); }
    function backup() { download(JSON.stringify({ format: "hifz-mentor-backup-v1", exportedAt: new Date().toISOString(), records }, null, 2), `hifz-mentor-${today()}.json`); toast("Backup downloaded. Keep it in a safe place."); }
    useEffect(() => { fetch("/quran/metadata.json").then(r => { if (!r.ok)
        throw Error(); return r.json() as Promise<Meta>; }).then(setMeta).catch(() => setMetaError(true)); }, []);
    useEffect(() => { if (!notice)
        return; const t = setTimeout(() => setNotice(""), 6000); return () => clearTimeout(t); }, [notice]);
    useEffect(() => { const key = (e: KeyboardEvent) => { if (view !== "lesson" || !current || document.querySelector('dialog[open]') || /INPUT|SELECT|TEXTAREA/.test((e.target as HTMLElement).tagName))
        return; if (e.key === "ArrowRight") {
        e.preventDefault();
        goto(page + 1);
    } if (e.key === "ArrowLeft") {
        e.preventDefault();
        goto(page - 1);
    } }; window.addEventListener("keydown", key); return () => window.removeEventListener("keydown", key); }, [page, current, view]);
    useEffect(() => { const context = (document as Document & {
        modelContext?: {
            registerTool: (tool: unknown, opts: unknown) => void;
        };
    }).modelContext; if (!context?.registerTool)
        return; const lifecycle = new AbortController(); try {
        context.registerTool({ name: "list_mentor_students", description: "List the students visible in the current Hifz Mentor register.", inputSchema: { type: "object", properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true, untrustedContentHint: true }, execute: (input: unknown) => { if (!input || typeof input !== "object" || Object.keys(input).length)
                throw Error("Expected an empty object"); return records.students.map(s => ({ id: s.id, name: s.name, group: s.group })); } }, { signal: lifecycle.signal });
    }
    catch { } return () => lifecycle.abort(); }, [records.students]);
    const pageMeta = meta?.pages.find(p => p[0] === page);
    const pageLabel = (p: number) => { const pg = meta?.pages.find(x => x[0] === p); if (!pg)
        return `Page ${p}`; const a = meta?.surahs.find(s => s[0] === pg[1])?.[2]; const b = meta?.surahs.find(s => s[0] === pg[3])?.[2]; return `${a} ${pg[2]}–${pg[1] === pg[3] ? "" : b + " "}${pg[4]}`; };
    const ayahs = (p: number) => { const pg = meta?.pages.find(x => x[0] === p); if (!pg || !meta)
        return []; const result: string[] = []; for (let s = pg[1]; s <= pg[3]; s++) {
        const sr = meta.surahs.find(x => x[0] === s)!;
        for (let a = s === pg[1] ? pg[2] : 1; a <= (s === pg[3] ? pg[4] : sr[4]); a++)
            result.push(`${sr[2]} ${a}`);
    } return result; };
    return <div className="shell"><aside className="sidebar"><a className="brand" href="#" onClick={e => { e.preventDefault(); setView("students"); }}><BookOpen /><span>{t("Hifz Mentor")}<small>{t("THE USTAD\u2019S WORKSPACE")}</small></span></a><div className="nav-label">{t("TEACH & GUIDE")}</div><nav>{nav.map(n => <button title={t(n.label)} key={n.id} className={view === n.id ? "active" : ""} onClick={() => setView(n.id)}><n.icon /><span>{t(n.label)}</span>{n.id === "students" && records.students.length > 0 && <b>{records.students.length}</b>}</button>)}</nav><div className="sidebar-note"><Feather /><p>{t("Every correction is a step")}<br />{t("toward confident recitation.")}</p><button onClick={() => setHelp(true)}><CircleHelp size={17}/>{t("A little guidance")}</button></div><div className="teacher"><div className="avatar small">{records.teacher ? initials(records.teacher) : t("HM")}</div><div><strong>{records.teacher || t("Your teaching desk")}</strong><small>{t("Ustad workspace")}</small></div></div></aside>
 <main><header><div className="breadcrumb">{t("Workspace ")}<span>/</span> <strong>{t(nav.find(n => n.id === view)?.label)}</strong></div><div className="header-right"><label className="language-control"><span>{t("Language")}</span><select className="language-switch" aria-label={t("Interface language")} value={lang} onChange={e => setLanguage(e.target.value as "en" | "bn")}><option value="en">{t("English")}</option><option value="bn">বাংলা</option></select></label><span className="saved"><ShieldCheck size={15}/>{demo ? t("Practice · not saved") : t(register.status)}</span><button className="icon" onClick={() => setHelp(true)} aria-label={t("How to use Hifz Mentor")}><CircleHelp size={19}/></button></div></header>
 {demo && <div className="demo-banner"><span><strong>{t("Practice workspace.")}</strong>{t(" These are example students; changes here are not saved.")}</span><button onClick={() => { setDemo(null); setActiveId(null); setView("students"); }}>{t("Return to my register ")}<X size={15}/></button></div>}
 {!demo && register.error && <div className="error-banner" role="alert"><span>{t(register.error)}</span><div>{register.unauthorized ? <a className="button primary" href="/signin-with-chatgpt?return_to=/" target="_top">{t("Sign in")}</a> : <button onClick={() => register.retry()}>{t("Retry")}</button>}{register.ready && <button onClick={backup}>{t("Download backup")}</button>}</div></div>}
 {!demo && register.recovery && <div className="error-banner"><span>{t("Earlier unsaved changes were found. Your saved register has also changed. Download the earlier changes before continuing.")}</span><button onClick={() => download(JSON.stringify({ format: "hifz-mentor-backup-v1", records: register.recovery }, null, 2), "recovered-hifz-mentor.json")}>{t("Download recovered changes")}</button><button onClick={register.dismissRecovery}>{t("Keep saved register")}</button></div>}<section className={`content ${view === "lesson" && current ? "lesson-content" : ""}`}>
 {view === "students" && <><div className="eyebrow">{t("BISMILLAH \u00B7 LET\u2019S BEGIN")}</div><div className="page-title"><div><h1>{t("Your students")}</h1><p>{t("A little guidance. Lasting progress.")}</p></div><button className="primary" disabled={!writable} onClick={() => setStudentForm("new")}><Plus size={18}/>{t("Add student")}</button></div>
 <div className="stats"><div><span>{t("Students in your care")}</span><strong>{records.students.length.toString().padStart(2, "0")}</strong><Users /></div><div><span>{t("Lessons completed")}</span><strong>{completed.length.toString().padStart(2, "0")}</strong><BookOpen /></div><div><span>{t("Corrections to revisit")}</span><strong>{unresolved.toString().padStart(2, "0")}</strong><RotateCcw /></div></div>
 {records.students.length > 0 ? <><div className="section-top"><h2>{t("Student register ")}<span>{records.students.length}</span></h2><label className="search"><Search size={18}/><input placeholder={t("Find a student…")} aria-label={t("Find a student")} value={query} onChange={e => setQuery(e.target.value)}/></label></div><div className="student-list"><div className="table-head"><span>{t("STUDENT")}</span><span>{t("LAST LESSON")}</span><span>{t("TO REVISIT")}</span><span></span></div>{records.students.filter(s => `${s.name} ${s.group}`.toLowerCase().includes(query.toLowerCase())).map((s, i) => { const lessons = records.lessons.filter(l => l.studentId === s.id); const last = lessons.filter(l => l.status === "complete").at(-1); const draft = lessons.find(l => l.status === "draft"); const marks = lessons.filter(l => l.status === "complete").flatMap(l => l.marks).filter(m => !m.resolved && !m.selfCorrected).length; return <div className="student-row" key={s.id}><button className="student-identity" onClick={() => setStudentForm(s)}><span className={`avatar tone-${i % 3}`}>{initials(s.name)}</span><span><strong>{s.name}</strong><small>{s.group || t("Individual student")}</small></span></button><div className="last-lesson">{last ? <><strong>{t(last.type)}{t(" \u00B7 pp. ")}{last.from}–{last.to}</strong><small>{last.date}</small></> : <span className="muted">{t("Ready for a first lesson")}</span>}</div><button className="correction-count" onClick={() => { setStudentFilter(s.id); setView("history"); }}>{marks ? <><span className="amber-number">{marks}</span>{t(" corrections")}</> : <span className="muted">—</span>}</button><button className="lesson-button" onClick={() => draft ? openLesson(draft) : setStartFor(s.id)}>{draft ? t("Resume lesson") : t("Take lesson")}<ArrowUpRight size={17}/></button></div>; })}{!records.students.some(s => `${s.name} ${s.group}`.toLowerCase().includes(query.toLowerCase())) && <div className="empty-inline">{t("No students match \u201C")}{query}”.</div>}</div><div className="register-foot"><ShieldCheck size={15}/>{t("Your register is private. Share only the lesson record you choose.")}</div></> : <div className="welcome"><span className="welcome-icon"><BookOpen size={36}/></span><h2>{t("A new chapter starts here.")}</h2><p>{t("Add your first student to take a lesson, mark mistakes,")}<br className="desktop"/>{t(" and send a personal correction record.")}</p><div className="actions center"><button className="primary" disabled={!writable} onClick={() => setStudentForm("new")}><Plus size={18}/>{t("Add your first student")}</button><button onClick={() => { const d = sampleRecords(); setDemo(d); openLesson(d.lessons[0]); }}>{t("Try a sample lesson ")}<ArrowUpRight size={18}/></button></div></div>}
 <div className="quiet-tip"><span>01</span><div><strong>{t("Begin each lesson with the last correction.")}</strong><p>{t("A quick recheck helps turn a difficult passage into confident recall.")}</p></div></div></>}

 {view === "lesson" && !current && <><div className="eyebrow">{t("LISTEN \u00B7 MARK \u00B7 GUIDE")}</div><div className="page-title"><div><h1>{t("Take a lesson")}</h1><p>{t("Choose a student and give the recitation your full attention.")}</p></div></div><div className="welcome"><BookOpen size={36}/><h2>{t("Whose lesson is next?")}</h2>{records.students.length ? <><div className="student-picker">{records.students.map(s => <button key={s.id} onClick={() => { const d = records.lessons.find(l => l.studentId === s.id && l.status === "draft"); d ? openLesson(d) : setStartFor(s.id); }}><span className="avatar small">{initials(s.name)}</span>{s.name}<ArrowUpRight size={18}/></button>)}</div></> : <><p>{t("Your student register is ready for its first name.")}</p><button className="primary" disabled={!writable} onClick={() => setStudentForm("new")}>{t("Add student")}</button></>}</div></>}
 {view === "lesson" && current && <><div className="lesson-heading"><div><button className="text-button back" onClick={() => { setActiveId(null); setView("students"); }}><ArrowLeft size={15}/>{t("Back to students")}</button><div className="title-line"><h1>{current.studentName}</h1><span className="pill">{t(current.type)}</span><span className={`pill ${current.status === "complete" ? "success" : "neutral"}`}>{current.status === "draft" ? t("Lesson in progress") : t("Completed lesson")}</span></div><p>{current.date} <span className="dot-separator">·</span>{t(" Pages ")}{current.from}–{current.to} <span className="dot-separator">·</span> {current.marks.length} {current.marks.length === 1 ? t("correction") : t("corrections")}</p></div><div className="actions">{current.status === "complete" && <button disabled={!writable} onClick={() => { setActiveId(null); setView("lesson"); }}><Plus size={18}/>{t("Start new lesson")}</button>}<button className="primary" disabled={!writable} onClick={() => current.status === "draft" ? setFinish(true) : setShareId(current.id)}>{current.status === "draft" ? <Check size={18}/> : <Share2 size={18}/>} {current.status === "draft" ? t("Finish lesson") : t("Share record")}</button></div></div>
 <div className="lesson-grid"><LessonReader lesson={current} page={page} goto={goto} meta={meta} writable={writable} category={category} onAdd={marks => updateLesson({ ...current, marks: [...current.marks, ...marks].slice(0, 500) })} onOpen={setMarkId}/>
 <aside className="lesson-panel">{current.status === "draft" && <div className="panel"><div className="panel-title"><h3>{t("Mark a correction")}</h3><span className="step">01</span></div><div className="category-grid">{categories.map(c => <button key={c.id} className={category === c.id ? "selected" : ""} style={{ "--mark-color": c.color } as React.CSSProperties} onClick={() => setCategory(c.id)}><span className="category-symbol">{c.short}</span>{t(c.label)}</button>)}</div><div className="actions compact"><button disabled={!writable} onClick={() => { const id = addMark(.5, .5, true); if (id)
            setMarkId(id); }}><Plus size={15}/>{t("Add by reference")}</button><button aria-label={t("Undo last correction")} title={t("Undo last correction")} disabled={!current.marks.length || !writable} onClick={() => updateLesson({ ...current, marks: current.marks.slice(0, -1) })}><Undo2 size={16}/></button></div></div>}
 <div className="panel"><div className="panel-title"><h3>{t("Lesson corrections")}</h3><span className="count">{current.marks.length}</span></div>{current.marks.length ? <div className="mark-list">{current.marks.map((m, i) => { const c = categories.find(c => c.id === m.category)!; return <button className="mark-row" key={m.id} onClick={() => { goto(m.page); setMarkId(m.id); }}><span className="mark-number" style={{ background: c.color + "18", color: c.color }}>{i + 1}</span><span><strong>{t(c.label)}</strong><small>{t("p. ")}{m.page}{m.reference ? ` · ${m.reference}` : (m.location === "reference" ? " · Reference note" : " · Page position")}</small>{(m.resolved || m.selfCorrected) && <small className="green">{m.resolved ? t("Correct on recheck") : t("Self-corrected")}</small>}</span><ChevronRight size={15}/></button>; })}</div> : <div className="no-marks"><Pencil size={24}/><p>{t("No corrections yet.")}</p><small>{t("Your marks will appear here as you listen.")}</small></div>}</div>
 {current.status === "draft" ? <div className="panel"><h3>{t("Lesson notes")}</h3><textarea aria-label={t("Lesson notes")} maxLength={4000} placeholder={t("Encouragement, fluency, or a reminder…")} rows={3} value={current.notes} onChange={e => updateLesson({ ...current, notes: e.target.value })}/><p className="small-muted">{t("Included in the student\u2019s correction record.")}</p></div> : <div className="panel"><h3>{t(current.outcome)}</h3><p>{current.notes || t("No additional feedback.")}</p>{current.assignment && <><h4>{t("Next assignment")}</h4><p>{current.assignment}</p></>}</div>}
 <div className="panel previous"><RotateCcw size={18}/><div><h3>{t("From previous lessons")}</h3><p>{records.lessons.filter(l => l.studentId === current.studentId && l.id !== current.id && l.status === "complete").flatMap(l => l.marks).filter(m => !m.resolved && !m.selfCorrected).length}{t(" corrections to revisit")}</p><button className="text-button" onClick={() => { setStudentFilter(current.studentId); setView("history"); }}>{t("Open student history ")}<ArrowUpRight size={14}/></button></div></div></aside></div></>}

 {view === "history" && <><div className="eyebrow">{t("A RECORD OF PROGRESS")}</div><div className="page-title"><div><h1>{t("Lesson history")}</h1><p>{t("Keep the lesson. See the improvement.")}</p></div><select aria-label={t("Filter history by student")} value={studentFilter} onChange={e => setStudentFilter(e.target.value)}><option value="all">{t("All students")}</option>{records.students.map(s => <option value={s.id} key={s.id}>{s.name}</option>)}</select></div><div className="history-list">{[...records.lessons].reverse().filter(l => studentFilter === "all" || l.studentId === studentFilter).map(l => <article className="history-card" key={l.id}><div className="history-date"><BookOpen size={22}/><span>{l.date}</span></div><div className="history-main"><div className="title-line"><h2>{l.studentName}</h2><span className="pill neutral">{t(l.type)}</span></div><p>{t("Pages ")}{l.from}–{l.to} · {l.marks.length}{t(" corrections \u00B7 ")}{l.status === "draft" ? t("In progress") : t(l.outcome)}</p>{l.assignment && <p className="assignment-preview"><strong>{t("Next:")}</strong> {l.assignment}</p>}<div className="actions compact"><button onClick={() => openLesson(l)}>{l.status === "draft" ? t("Resume lesson") : t("Review corrections")}<ArrowUpRight size={15}/></button>{l.status === "complete" && <button onClick={() => setShareId(l.id)}><Share2 size={15}/>{t("Share record")}</button>}</div></div><span className={`pill ${l.status === "draft" ? "neutral" : "success"}`}>{l.status === "draft" ? t("Draft") : t("Completed")}</span></article>)}{!records.lessons.some(l => studentFilter === "all" || l.studentId === studentFilter) && <div className="welcome"><ClipboardList size={34}/><h2>{t("Every lesson has a place.")}</h2><p>{t("Completed lessons and saved drafts will appear here.")}</p><button className="primary" onClick={() => { setActiveId(null); setView("lesson"); }}>{t("Take a lesson")}</button></div>}</div></>}

 {view === "settings" && <><div className="eyebrow">{t("YOUR WORKSPACE")}</div><div className="page-title"><div><h1>{t("Settings & records")}</h1><p>{t("A few details that make this teaching desk yours.")}</p></div></div><div className="settings-grid"><div className="panel"><h2>{t("Teaching profile")}</h2><Field label={t("Ustad’s name")}><input placeholder={t("Your name")} maxLength={100} value={records.teacher} disabled={!writable} onChange={e => change({ ...records, teacher: e.target.value })}/></Field><p className="small-muted">{t("Appears on the correction records you share.")}</p></div><div className="panel"><h2>{t("Your records, in your hands")}</h2><p>{t("Download a backup of students, lessons, and every mark. Importing adds records with new IDs and keeps existing records unchanged.")}</p><div className="actions"><button disabled={!writable} onClick={backup}><Download size={17}/>{t("Export backup")}</button><button disabled={!writable} onClick={() => fileInput.current?.click()}>{t("Import backup")}</button></div><input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (!f)
        return; try {
        if (f.size > 4000000)
            throw Error("Choose a Hifz Mentor backup smaller than 4 MB.");
        const j = JSON.parse(await f.text());
        if (j.format !== "hifz-mentor-backup-v1")
            throw Error("Choose a Hifz Mentor backup file.");
        const incoming = recordSchema.parse(j.records);
        const students = incoming.students.filter(s => !records.students.some(x => x.id === s.id));
        const lessons = incoming.lessons.filter(l => !records.lessons.some(x => x.id === l.id));
        const next = recordSchema.parse({ ...records, students: [...records.students, ...students], lessons: [...records.lessons, ...lessons] });
        change(next);
        toast(`Imported ${students.length} students and ${lessons.length} lessons. Existing records were kept.`);
    }
    catch {
        toast("Could not import this backup. Check its format and size; your register has not changed.");
    } e.target.value = ""; }}/></div><div className="panel"><ShieldCheck className="teal"/><h2>{t("Private by default")}</h2><p>{t("Student records are saved in your private workspace. A WhatsApp message, exported image, or PDF contains only the selected student\u2019s lesson. Sending remains your choice.")}</p><h4>{t("When the connection drops")}</h4><p>{t("Keep the app open. Changes stay on screen until you retry saving. Download a backup before closing if saving is unavailable.")}</p></div><div className="panel"><h2>{t("About Hifz Mentor")}</h2><p>{t("Designed for the Ustad: listen, mark, and guide.")}</p><p className="small-muted">{t("Madinah Mushaf (Hafs), 604 pages. Page images and Quran metadata supplied with Hifz Companion. The original Quran page files remain unchanged; corrections are stored separately.")}</p><button className="text-button" onClick={() => setHelp(true)}>{t("Read the quick guide ")}<ArrowUpRight size={15}/></button></div></div></>}
 </section><footer>{t("Hifz Mentor ")}<span>{t("With care, one lesson at a time.")}</span></footer></main>
 {notice && <div className="toast" role="status">{notice}<button className="icon" onClick={() => setNotice("")} aria-label={t("Dismiss message")}><X size={16}/></button></div>}
 {metaError && view === "lesson" && <div className="toast" role="status">{t("Quran references could not load. Page marking is still available.")}</div>}

 {studentForm && <Modal title={studentForm === "new" ? t("Welcome a student") : t("Student details")} onClose={() => setStudentForm(null)}><form onSubmit={e => { e.preventDefault(); const f = new FormData(e.currentTarget); const s: Student = { id: studentForm === "new" ? uid() : studentForm.id, name: String(f.get("name")).trim(), contact: String(f.get("contact")), group: String(f.get("group")), notes: String(f.get("notes")), created: studentForm === "new" ? today() : studentForm.created }; if (!s.name)
        return; change({ ...records, students: studentForm === "new" ? [...records.students, s] : records.students.map(x => x.id === s.id ? s : x) }); setStudentForm(null); toast("Student details updated."); }}><Field label={t("Student’s name")}><input name="name" required autoFocus maxLength={100} defaultValue={studentForm === "new" ? "" : studentForm.name} placeholder={t("e.g. Ahmed Rahman")}/></Field><Field label={t("Class or group")}><input name="group" maxLength={300} defaultValue={studentForm === "new" ? "" : studentForm.group} placeholder={t("e.g. Morning hifz")}/></Field><Field label={t("Student / guardian WhatsApp (optional)")}><input name="contact" type="tel" maxLength={40} defaultValue={studentForm === "new" ? "" : studentForm.contact} placeholder={t("International format, e.g. +880…")}/></Field><Field label={t("Private teaching notes")}><textarea name="notes" maxLength={3000} rows={3} defaultValue={studentForm === "new" ? "" : studentForm.notes} placeholder={t("Background, learning goals, or reminders…")}/></Field><p className="small-muted">{t("Private notes are not included in shared lesson records.")}</p><div className="modal-actions"><button type="button" onClick={() => setStudentForm(null)}>{t("Cancel")}</button><button className="primary" disabled={!writable} type="submit">{t("Save student ")}<Check size={16}/></button></div></form></Modal>}
 {startFor && <Modal title={t("New lesson")} onClose={() => setStartFor(null)}><form onSubmit={e => { e.preventDefault(); if (!writable) return; const f = new FormData(e.currentTarget); const s = records.students.find(s => s.id === startFor); if (!s) return; const l = { ...newLesson(s), date: String(f.get("date")) }; change({ ...records, lessons: [...records.lessons, l] }); openLesson(l); setStartFor(null); }}><div className="student-label"><span className="avatar">{initials(records.students.find(s => s.id === startFor)?.name || "")}</span><strong>{records.students.find(s => s.id === startFor)?.name}</strong></div><Field label={t("Date")}><input name="date" type="date" required defaultValue={today()}/></Field><div className="modal-actions"><button type="button" onClick={() => setStartFor(null)}>{t("Cancel")}</button><button type="submit" className="primary" disabled={!writable}>{t("Start ")}<ArrowUpRight size={17}/></button></div></form></Modal>}
 {selectedMark && current && <Modal title={`Correction ${current.marks.indexOf(selectedMark) + 1}`} onClose={() => setMarkId(null)}><div className="mark-detail"><p className="small-muted">{t("Mushaf page ")}{selectedMark.page} · {pageLabel(selectedMark.page)}</p><Field label={t("Mistake type")}><select disabled={current.status !== "draft"} value={selectedMark.category} onChange={e => updateLesson({ ...current, marks: current.marks.map(m => m.id === selectedMark.id ? { ...m, category: e.target.value as Mark["category"] } : m) })}>{categories.map(c => <option key={c.id} value={c.id}>{t(c.label)}</option>)}</select></Field><Field label={t("Ayah reference (optional)")}><select disabled={current.status !== "draft" || selectedMark.location === "text"} value={selectedMark.reference} onChange={e => updateLesson({ ...current, marks: current.marks.map(m => m.id === selectedMark.id ? { ...m, reference: e.target.value } : m) })}><option value="">{t("Page position only")}</option>{ayahs(selectedMark.page).map(a => <option key={a}>{a}</option>)}</select></Field>{selectedMark.selectedText && <blockquote className="selected-arabic" lang="ar" dir="rtl">{selectedMark.selectedText}</blockquote>}<Field label={t("Correction / practice instruction")}><textarea disabled={current.status !== "draft"} rows={3} maxLength={1000} value={selectedMark.note} onChange={e => updateLesson({ ...current, marks: current.marks.map(m => m.id === selectedMark.id ? { ...m, note: e.target.value } : m) })} placeholder={t("What should the student practise?")}/></Field><label className="checkbox"><input type="checkbox" disabled={current.status !== "draft"} checked={selectedMark.selfCorrected} onChange={e => updateLesson({ ...current, marks: current.marks.map(m => m.id === selectedMark.id ? { ...m, selfCorrected: e.target.checked } : m) })}/>{t("Student self-corrected")}</label>{current.status === "complete" && <label className="checkbox"><input type="checkbox" checked={selectedMark.resolved} onChange={e => updateLesson({ ...current, marks: current.marks.map(m => m.id === selectedMark.id ? { ...m, resolved: e.target.checked } : m) })}/>{t("Correct on recheck \u2014 keep the original record")}</label>}<div className="modal-actions">{current.status === "draft" && <button className="danger" onClick={() => { updateLesson({ ...current, marks: current.marks.filter(m => m.id !== selectedMark.id) }); setMarkId(null); }}>{t("Remove mark")}</button>}<button className="primary" onClick={() => setMarkId(null)}>{t("Done ")}<Check size={17}/></button></div></div></Modal>}
 {finish && current && <Modal title={t("A lesson worth keeping")} onClose={() => setFinish(false)}><p>{current.studentName} · {t(current.type)} · {current.marks.length}{t(" corrections")}</p><form onSubmit={e => { e.preventDefault(); const f = new FormData(e.currentTarget); updateLesson({ ...current, status: "complete", outcome: f.get("outcome") as Lesson["outcome"], notes: String(f.get("notes")), assignment: String(f.get("assignment")) }); setFinish(false); setShareId(current.id); }}><Field label={t("Lesson outcome")}><select name="outcome" defaultValue={current.marks.length ? "Passed with revision" : "Passed"}><option value="Passed">{t("Passed")}</option><option value="Passed with revision">{t("Passed with revision")}</option><option value="Repeat">{t("Repeat")}</option></select></Field><Field label={t("Feedback for the student")}><textarea name="notes" maxLength={4000} rows={3} defaultValue={current.notes} placeholder={t("A word of encouragement and what to focus on…")}/></Field><Field label={t("Next lesson / revision assignment")}><textarea name="assignment" maxLength={2000} rows={3} defaultValue={current.assignment} placeholder={t("Passage to prepare, practice instructions, and due date…")}/></Field><div className="modal-actions"><button type="button" onClick={() => setFinish(false)}>{t("Keep listening")}</button><button className="primary" type="submit">{t("Complete & review ")}<Check size={17}/></button></div></form></Modal>}
 {shared && <Modal title={t("Share the lesson record")} wide onClose={() => setShareId(null)}><div className="share-heading"><CheckCircle2 size={28}/><div><strong>{shared.studentName}</strong><p>{t(shared.type)} · {shared.date} · {t(shared.outcome)}</p></div></div><pre className="message-preview">{lessonMessage(shared, records.teacher, lang)}</pre><div className="share-options"><button className="primary" onClick={() => { const c = records.students.find(s => s.id === shared.studentId)?.contact.replace(/\D/g, "") || ""; window.open(`https://wa.me/${c}?text=${encodeURIComponent(lessonMessage(shared, records.teacher, lang))}`, "_blank", "noopener,noreferrer"); }}><MessageCircle size={18}/>{t("Open WhatsApp")}</button><button onClick={async () => { try {
        await navigator.clipboard.writeText(lessonMessage(shared, records.teacher, lang));
        toast("Lesson message copied.");
    }
    catch {
        download(lessonMessage(shared, records.teacher, lang), "lesson-record.txt", "text/plain");
        toast("Message downloaded as text.");
    } }}><Copy size={17}/>{t("Copy message")}</button><button onClick={() => { try {
        printLesson(shared, records.teacher, lang);
    }
    catch (e) {
        toast((e as Error).message);
    } }}><Printer size={18}/>{t("Print / Save PDF")}</button><button disabled={exporting} onClick={async () => { setExporting(true); try {
        const p = shared.marks[0]?.page ?? shared.from;
        const b = await pageImage(shared, p);
        download(b, `${shared.studentName.replace(/[^a-zA-Z0-9]/g, "-")}-page-${p}.png`);
        toast(`Marked page ${p} downloaded. The PDF includes all marked pages.`);
    }
    catch {
        toast("The page image could not be created. Check your connection and retry.");
    }
    finally {
        setExporting(false);
    } }}><Download size={18}/>{exporting ? t("Preparing image…") : t("Download marked page")}</button><button onClick={async () => { try {
        if (navigator.share)
            await navigator.share({ title: "Hifz Mentor lesson record", text: lessonMessage(shared, records.teacher, lang) });
        else {
            download(lessonMessage(shared, records.teacher, lang), "lesson-record.txt", "text/plain");
            toast("Message downloaded for sharing.");
        }
    }
    catch (e) {
        if ((e as Error).name !== "AbortError")
            toast("Sharing unavailable here. Use Copy message or download the record.");
    } }}><Share2 size={17}/>{t("More sharing options")}</button></div><p className="small-muted">{t("WhatsApp opens a message for you to review and send. Attach the downloaded PDF or image yourself. No message is sent automatically.")}</p><div className="modal-actions"><button onClick={() => setShareId(null)}>{t("Done")}</button><button className="primary" disabled={!writable} onClick={() => { setShareId(null); setActiveId(null); setView("lesson"); }}><Plus size={18}/>{t("Start new lesson")}</button></div></Modal>}
 {help && <Modal title={t("A little guidance")} onClose={() => setHelp(false)}><ol className="guide"><li><strong>{t("Add your students.")}</strong><p>{t("Keep a class name and optional guardian contact in each profile.")}</p></li><li><strong>{t("Listen and mark.")}</strong><p>{t("Select a student and date to begin. Choose Text to highlight words, selected phrases, or a whole ayah in yellow. Choose Mushaf to drag a yellow highlight across a line or place a point mark. Open any correction to add instructions.")}</p></li><li><strong>{t("Finish with direction.")}</strong><p>{t("Record the outcome, encouragement, and next assignment.")}</p></li><li><strong>{t("Share and revisit.")}</strong><p>{t("Send a message, PDF, or marked image. At the next lesson, open the old correction and tick \u201CCorrect on recheck\u201D.")}</p></li></ol><div className="notice">{t("The Ustad makes every assessment. Hifz Mentor does not automatically judge recitation.")}</div><div className="modal-actions"><button className="primary" onClick={() => setHelp(false)}>{t("Ready to begin")}</button></div></Modal>}
 </div>;
}




