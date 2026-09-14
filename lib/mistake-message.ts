import { categories, markSchema, type Lesson } from "./mentor.ts";
import { translate, type Language } from "./translations.ts";

/** Share only the chosen lesson's corrections; never a teacher's full register. */
export function mistakeMessage(lesson: Lesson, teacher = "", lang: Language = "en") {
  const t = (text: string) => translate(text, lang);
  const payload = {
    format: "hifz-mentor-feedback", version: 1, lessonId: lesson.id,
    studentName: lesson.studentName, date: lesson.date, teacher,
    from: lesson.from, to: lesson.to,
    marks: lesson.marks.map(mark => markSchema.parse(mark)),
  };
  return [t("Hifz Mentor · Mistakes to review"), `${lesson.studentName} · ${lesson.date}`,
    ...lesson.marks.map((mark, index) => `${index + 1}. ${t("Page")} ${mark.page}${mark.reference ? ` · ${mark.reference}` : ""}: ${t(categories.find(c => c.id === mark.category)!.label)}${mark.selectedText ? ` · “${mark.selectedText}”` : ""}${mark.note ? ` — ${mark.note}` : ""}`),
    lesson.marks.length ? "" : t("No mistakes marked."),
    teacher ? `${t("Ustad")}: ${teacher}` : "",
    t("In Hifz Companion: Progress → Import Feedback → paste this entire message."),
    "[HIFZ_MENTOR_FEEDBACK_V1]", JSON.stringify(payload), "[/HIFZ_MENTOR_FEEDBACK_V1]",
  ].filter(Boolean).join("\n");
}
