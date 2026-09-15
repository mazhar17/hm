# Hifz Mentor asset attribution

Word-by-word English and Bengali glosses are supplied by Quran.com / Quran Foundation through its API v4, using the requested word language. These glosses are separate from the Saheeh International and Sheikh Mujibur Rahman full-ayah translations. Arabic word text is checked against the displayed verse before aligning a gloss. Source: https://api-docs.quran.foundation/ and https://quran.com/.

The 604 unmodified Madinah Mushaf page images and Quran metadata in `public/quran/` were extracted from the user-supplied Hifz Companion archive (`hc.zip`).

The source archive attributes the page images to the King Fahd Glorious Qur’an Printing Complex and describes their terms as free non-commercial distribution, no modification. Hifz Mentor retains the original image bytes and stores the Ustad’s annotations separately. Exported correction records combine these images with a distinct annotation overlay.

The supplied metadata identifies quran-meta (Tanzil-derived) as its source. The source archive identifies quran-meta as MIT licensed. Its provenance note is preserved in `public/quran/metadata.json`.

Hifz Companion’s source archive identifies its application as © 2026, CC BY-NC-ND 4.0. Hifz Mentor’s teaching interface, lesson record model, and server routes are newly authored for this project; the original Hifz Companion application code is not included.

Frameworks and installed libraries retain their respective upstream licenses. The bundled Sites build plugin includes its own license in `build/`.

Text view uses Quran.com API v4 Uthmani Arabic text (6,236 ayahs), downloaded 2026-09-13 from https://api.quran.com/api/v4/quran/verses/uthmani and split by the existing Madinah page metadata without altering the text. Amiri Quran font extracted from the supplied Hifz Companion index.html. Highlights are separate annotations.
