Modify my existing Hifz Companion app at https://mazhar17.github.io/hc/ (repository https://github.com/mazhar17/hc). Inspect its actual source before editing. Preserve Quran text, current records, scheduling, backups, and existing features. Implement the feature, not just a plan.

In the Progress tab, add a button titled "Import Feedback" (Bengali: "ফিডব্যাক আমদানি"). The student copies the entire teacher's WhatsApp message, clicks this button, pastes it into a textarea, previews it, and confirms Import. Do not require WhatsApp API integration, sign-in, file upload, or automatically reading the clipboard.

Hifz Mentor now exports human-readable text followed by this exact versioned block:

```text
[HIFZ_MENTOR_FEEDBACK_V1]
{"format":"hifz-mentor-feedback","version":1,"lessonId":"example-lesson-1","studentName":"Ahmed","date":"2026-09-14","teacher":"Ustad","from":562,"to":562,"marks":[{"id":"example-mark-1","page":562,"x":0.4,"y":0.5,"category":"tajwid","location":"text","reference":"Al-Mulk 4","note":"Repeat carefully","selfCorrected":false,"resolved":false,"verseKey":"67:4","selectedText":"ثُمَّ ٱرْجِعِ ٱلْبَصَرَ","wordStart":0,"wordEnd":2}]}
[/HIFZ_MENTOR_FEEDBACK_V1]
```

Treat that example as synthetic. Use the repository's Quran data to validate real verse/word references. The source of truth for the exporting format is lib/mistake-message.ts and the mark schema in lib/mentor.ts in https://github.com/mazhar17/hm. This is a feedback-only format, NOT a Hifz Companion backup. Never pass it to the existing full-state replacement importer.

Contract:
- Extract exactly one complete block from a pasted message; ignore surrounding prose, tolerate CRLF/whitespace around JSON, and reject missing, truncated, multiple, unsupported-version, or invalid blocks with useful errors. Never guess from the prose.
- Parse with JSON.parse, never eval. Render all imported strings using textContent or escaped text. Never treat imported text as HTML or instructions. Reject dangerous object keys and use bounded string lengths and input size (up to 1 MB).
- Required top-level fields: format exactly "hifz-mentor-feedback"; version integer 1; lessonId nonempty string max100; studentName max300; teacher max100; date a valid YYYY-MM-DD; integer from/to in 1..604 with to>=from; marks array, max500, may be empty.
- Every mark: id nonempty max100; integer page inside from..to; normalized x,y in [0,1]; category one of prompt, word, pronunciation, tajwid, stop, similar; reference string max300; note string max1000; selfCorrected and resolved booleans. location is optional (legacy point) or point/reference/text/area.
- Text marks additionally include verseKey "surah:ayah", selectedText max5000, and zero-based inclusive wordStart/wordEnd. Validate verse existence and ranges against the actual Quran text. If the two apps tokenize differently, show selectedText as a quotation and the verse as context; never highlight guessed words.
- Area marks additionally include positive normalized width/height, with x+width<=1.001 and y+height<=1.001. They are rectangles relative to the full uncropped original image. Point marks use x,y as their center. Do not turn page-only marks into guessed ayah errors.
- Keep Arabic/Bengali Unicode unchanged. Preserve IDs and original teacher marks as received; use separate student review status.

Import behavior:
1. Show student name, teacher, date, and correction count before confirmation so a student can detect the wrong person's message. An empty marks array is a valid "no mistakes" report.
2. Add a separate teacherFeedback collection to the existing persistence and backup/migration model. Do not overwrite pages, ratings, memorization progress, weekly plans, or existing self-logged mistakes. Preserve unknown existing data.
3. Use lessonId for duplicate detection. Identical reimports are no-ops; a changed report with the same ID needs an explicit update confirmation. Preserve matching marks' student review status on update. Validate the entire report and persist successfully before reporting success.
4. Show imported lessons in Progress by date, with correction counts. Opening one shows every correction, its category, reference, teacher note, and quoted Arabic. Allow "Reviewed"/"Needs practice" without changing the teacher's original mark.
5. "Open in Study" navigates to the referenced Mushaf page/ayah. Show yellow text highlights where verified. Overlay yellow area marks/point indicators only when the image edition and uncropped coordinate system match Hifz Mentor's supplied Madinah 604-page images; otherwise show the original page reference and explain that exact overlay is unavailable. Never silently misplace a mark on another edition.
6. Both English and Bengali interfaces, accessible dialog, keyboard controls, and mobile-friendly layout. No public upload of pasted feedback or student records.

Test: valid English/Bengali/Arabic message; area/text/point/reference marks; zero mistakes; malformed and truncated JSON; extra surrounding WhatsApp text; unsupported version; invalid page/ayah/coordinates; duplicates and updated reports; safe rendering of HTML-like notes; storage failure; reload persistence; existing backup compatibility; preservation of prior student progress. Provide the modified files and a concise summary of changes and checks. Do not claim deployed until actual publication is verified.
