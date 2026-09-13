# Hifz Mentor

A private teaching workspace for an Ustad to listen to Quran lessons, mark corrections on the Madinah Mushaf, and share a personal lesson record.

## Features

- Student profiles, class/group, optional WhatsApp contact, and private teaching notes.
- Sabaq, Sabqi, and Manzil sessions across any of the 604 supplied Mushaf pages.
- Six correction categories, numbered page marks, optional ayah references, notes, self-correction, and later recheck status.
- Autosaved lesson drafts, assessment, next assignment, and preserved lesson history.
- WhatsApp message preparation, clipboard/native sharing, printable PDF correction sheets, and marked-page PNG download.
- Private per-user D1 records with optimistic revision checks. Conflicting writes never overwrite unseen changes.
- JSON export and validated, additive backup import. Existing record IDs are kept on import.
- Temporary unsaved-change recovery on the same browser, separate from the authoritative server register.
- Explicit sample workspace whose data is never saved.

## Development

Node.js 22.13 or newer. Install the locked dependencies using `npm run install:ci`, then `npm run dev`. The preview listens on port 5173. The Sites execution profile is portable on this Windows checkout.

The local preview simulates sign-in through `/signin-with-chatgpt?return_to=/`. Production identity comes from the Sites authentication gateway; no local mock identity is included in production.

D1 schema: `db/schema.ts`. Generated migrations: `drizzle/`. The configured logical binding is `DB`; production resources are provisioned by Sites. Apply the migration to the local preview D1 before testing database writes.

Build with `npm run build`. Type-check with `node node_modules/typescript/bin/tsc --noEmit`. Domain tests run with `node --experimental-strip-types --test tests/mentor.test.ts`.

## Data and privacy

Each authenticated user has a separate register. The server derives ownership from the trusted platform identity header and never accepts a client-supplied owner. Writes require the current revision. Profile notes and phone numbers are excluded from lesson message/PDF content; the optional phone number is used only to address a user-initiated WhatsApp message.

Browser storage holds only pending changes for recovery, keyed by authenticated owner. The D1 register remains authoritative. If the connection drops during an open session, keep working on screen and retry saving. A same-browser pending draft is recovered after reconnecting and signing in; conflicting recovered changes can be exported separately. This release does not support opening the complete app offline.

## Sharing and scope

WhatsApp opens a message for the Ustad to review and send. It does not send messages automatically or confirm delivery. The Ustad attaches a downloaded PDF/image manually. PDF export uses the browser’s Print / Save as PDF dialog. PNG export downloads the first marked page (or the first lesson page); the PDF includes all marked pages.

This release supports page-range lessons, with optional exact ayah references on corrections. Full recitation audio recording, automated recitation assessment, institutional administration, and direct import into the separate Hifz Companion app are not implemented.

See `ATTRIBUTION.md` for the provenance of the supplied Quran assets.
