# Inquiry Email Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Route artwork and artist-contact inquiries through a Netlify API that saves them under the requester's own Firestore permissions and emails the artist (reply-to requester) and the requester (receipt) through Resend.

**Architecture:** `POST /api/inquiries` verifies the Firebase ID token, reads the published profile anonymously, writes the inquiry with a Firestore REST `commit` authorised by the requester's token (existing rules still apply), then sends mail best-effort. Orchestration lives in a dependency-injected handler so every failure path is unit-tested with fakes; the route wires in the real dependencies.

**Tech Stack:** Next.js 14 Pages API, Firestore REST v1, firebase-admin Auth (`getUser`), Resend REST API via `fetch`, `node:test` with the repo's `ts.transpileModule` loader.

**Spec:** `docs/superpowers/specs/2026-10-23-inquiry-email-design.md`

## Global Constraints

- Firestore rules are not changed. Stored fields stay within the existing `work_inquiries` allow-list.
- Message length 10–2000 characters after trim (matches rules).
- `requesterUid`, `requesterEmail`, `requesterName`, `recipientUid` and work details come from the token and the published profile, never from the request body.
- Mail failures never fail the request: the inquiry is saved and the response is `{ ok: true, id, emailed: false }`.
- No new npm dependencies.
- Env: `RESEND_API_KEY`, `INQUIRY_EMAIL_FROM`, `INQUIRY_COPY_EMAIL` (optional bcc), `FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY`.
- Artist subject `[u.a.u] 새 문의 — {작품명 또는 문의 목적}`; requester subject `[u.a.u] {작가명} 작가에게 문의가 전달되었습니다`.
- All user text is HTML-escaped in mail; newlines become `<br>`.

## Review Focus

- Requester signed in without an email (token has no `email`) → 400 "Sign in with an account that has an email address", nothing saved. Test in Task 2.
- Work deleted or unpublished between page load and submit → 404, nothing saved. Test in Task 2.
- Message containing `<script>` / `&` / newlines → escaped in HTML, preserved in text. Test in Task 1.
- `FIREBASE_ADMIN_PRIVATE_KEY` stored with literal `\n` sequences → converted to newlines before `cert()`. Handled in Task 3 (one-line replace; covered by manual check).
- Firestore rules rejecting the write (403 from REST) → 403 to the client, no mail sent. Test in Task 2.

---

### Task 1: Mail content builder

**Files:**
- Create: `app/server/inquiry-email.ts`
- Test: `tests/inquiry-email.test.cjs`

**Interfaces:**
- Produces:
  - `type InquiryMailInput = { artistName: string; artistSlug: string; subjectLabel: string; workTitle?: string; workMeta?: string; imageUrl?: string; message: string; requesterName: string; requesterEmail: string }`
  - `type MailMessage = { from: string; to: string[]; subject: string; html: string; text: string; reply_to?: string; bcc?: string[] }`
  - `buildArtistMail(input: InquiryMailInput, opts: { from: string; to: string; copyTo?: string; siteUrl: string }): MailMessage`
  - `buildRequesterMail(input: InquiryMailInput, opts: { from: string; siteUrl: string }): MailMessage`
  - `escapeHtml(value: string): string`
- No imports (keeps the test loader simple).

- [ ] **Step 1: Write failing tests** (loader copied from `tests/ux-data.test.cjs`)
  - `artist mail replies to requester and links the dashboard`: `reply_to === "a@b.com"`, `to` is `["artist@x.com"]`, subject `"[u.a.u] 새 문의 — Blue Room"`, html includes `${siteUrl}/dashboard/inquiries`.
  - `copy address becomes bcc only when configured`: with `copyTo: "ops@x.com"` → `bcc` deep-equals `["ops@x.com"]`; without → `bcc` is `undefined`.
  - `user text is escaped and newlines kept`: message `"<script>x</script>\nline & two"` → html contains `&lt;script&gt;` and `<br>` and `&amp;`, not `<script>`; text contains the raw message.
  - `requester receipt names the artist`: subject `"[u.a.u] 프링 작가에게 문의가 전달되었습니다"`, `to` is requester, html links `${siteUrl}/artist/pring`, no `reply_to`.
- [ ] **Step 2:** `node --test tests/inquiry-email.test.cjs` → FAIL (module missing).
- [ ] **Step 3:** Implement. Inline-styled HTML table layout: paper `#F4F0E8`, ink `#171817`, blue `#1438EE`; Korean body plus one English line; image only when `imageUrl` starts with `https://`.
- [ ] **Step 4:** Re-run → PASS.
- [ ] **Step 5:** Commit `Add inquiry email content builder`.

### Task 2: Inquiry handler orchestration

**Files:**
- Create: `app/server/inquiry-handler.ts`, `app/inquiry-purposes.ts`
- Test: `tests/inquiry-handler.test.cjs`

**Interfaces:**
- Consumes: Task 1 `buildArtistMail`, `buildRequesterMail` (injected via deps to keep the module import-free for the loader).
- Produces:
  - `app/inquiry-purposes.ts`: `export const inquiryPurposes: Array<{ id: "work" | "curation" | "collaboration" | "other"; en: string; ko: string }>` (moved verbatim from `artist-contact.tsx`).
  - `type InquiryRequest = { artistSlug: string; message: string; workId?: string; purpose?: string; locale?: "en" | "ko" }`
  - `type InquiryDeps = { verifyToken(token: string): Promise<{ uid: string; email?: string; name?: string }>; readProfile(slug: string): Promise<Record<string, unknown> | null>; saveInquiry(token: string, data: Record<string, unknown>): Promise<{ id: string } | { status: 403 }>; lookupEmail(uid: string): Promise<string | null>; send(message: MailMessage): Promise<boolean>; buildArtistMail; buildRequesterMail; purposes: typeof inquiryPurposes; config: { from?: string; copyTo?: string; siteUrl: string; mailEnabled: boolean } }`
  - `handleInquiry(token: string | undefined, body: unknown, deps: InquiryDeps): Promise<{ status: number; body: { ok?: true; id?: string; emailed?: boolean; error?: string } }>`

- [ ] **Step 1: Write failing tests** with fake deps (record calls):
  - missing token → 401, `saveInquiry` not called.
  - token without email → 400, not saved.
  - message of 9 chars → 400; 2001 chars → 400.
  - `readProfile` returns null → 404.
  - `workId` not in `siteWorks` (or work lacks title/imageUrl) → 404.
  - work inquiry saves exactly the allow-listed fields: `requesterUid/Email/Name` from token, `recipientUid` = profile `ownerUid`, `workTitle/artworkImageUrl/Year/Medium/Dimensions` from the profile work, `status: "new"`; body `workTitle` is ignored.
  - contact inquiry (no `workId`) saves `workId: "artist-profile"` and `workTitle` = purpose label in request locale; unknown purpose → 400.
  - `saveInquiry` returns `{status: 403}` → 403 and `send` never called.
  - happy path → 200 `{ok, id, emailed: true}`, `send` called twice (artist then requester).
  - `lookupEmail` → null → artist mail skipped, requester mail sent, `emailed: false`.
  - `send` throws → still 200, `emailed: false`.
  - `mailEnabled: false` → 200, `send` not called, `emailed: false`.
- [ ] **Step 2:** `node --test tests/inquiry-handler.test.cjs` → FAIL.
- [ ] **Step 3:** Implement `handleInquiry`. `requesterName` = token `name` || email. `emailed` is true only when both mails were sent.
- [ ] **Step 4:** Re-run → PASS.
- [ ] **Step 5:** Commit `Add inquiry handler with best-effort email`.

### Task 3: Real dependencies and API route

**Files:**
- Modify: `app/server/firebase-token.ts` (return `{ uid, email?, name? }` from payload `email`/`name`)
- Modify: `app/server/public-firestore.ts` (export `documentsUrl`)
- Create: `app/server/inquiry-store.ts`, `app/server/resend.ts`
- Modify: `app/server/firebase-admin.ts`
- Create: `pages/api/inquiries.ts`
- Modify: `.env.example`

**Interfaces:**
- Consumes: Task 2 `handleInquiry`, `InquiryDeps`; Task 1 builders; `readPublicDocument` from `public-firestore.ts`.
- Produces:
  - `saveInquiry(idToken: string, data: Record<string, unknown>): Promise<{ id: string } | { status: 403 }>`: POST `${documentsUrl()}:commit` with `Authorization: Bearer`, one write `{ update: { name, fields }, updateTransforms: [{ fieldPath: "createdAt", setToServerValue: "REQUEST_TIME" }], currentDocument: { exists: false } }`, random 20-char id. Non-2xx 403/400 from rules → `{status: 403}`; other errors throw.
  - `getUserEmail(uid: string): Promise<string | null>`: separate firebase-admin app named `"uau-credentialed"` using `cert({ projectId, clientEmail, privateKey: key.replace(/\\n/g, "\n") })`, or no credential when `FIREBASE_AUTH_EMULATOR_HOST` is set; returns null when neither is configured or on any error.
  - `sendEmail(message: MailMessage): Promise<boolean>`: POST `${RESEND_API_BASE || "https://api.resend.com"}/emails`, bearer `RESEND_API_KEY`, 8s timeout.
  - Route: POST only (405 otherwise), passes `authorization` bearer token and `request.body` to `handleInquiry`; `mailEnabled = Boolean(RESEND_API_KEY && INQUIRY_EMAIL_FROM)`; logs mail failures with `console.error` (no keys or message text).

- [ ] **Step 1:** Implement the four modules and the route.
- [ ] **Step 2:** `npx tsc --noEmit -p .` → no errors; existing `node --test tests/*.test.cjs` (excluding the rules test) → PASS.
- [ ] **Step 3:** Commit `Add inquiries API with Firestore REST write and Resend delivery`.

### Task 4: Client forms call the API

**Files:**
- Modify: `app/works/[id]/work-inquiry.tsx`, `app/components/artist-contact.tsx`
- Create: `app/inquiry-client.ts`

**Interfaces:**
- Consumes: route from Task 3; `inquiryPurposes` from Task 2.
- Produces: `submitInquiry(user: User, payload: InquiryRequest): Promise<{ id: string; emailed: boolean }>` — gets `await user.getIdToken()`, POSTs JSON, throws `Error(body.error)` on non-2xx.

- [ ] **Step 1:** Replace `addDoc` calls with `submitInquiry`; `artist-contact.tsx` imports `inquiryPurposes` instead of its local list. Success/error UI unchanged.
- [ ] **Step 2:** `npx tsc --noEmit -p .` → clean.
- [ ] **Step 3:** Commit `Send inquiries through the inquiries API`.

### Task 5: End-to-end verification

- [ ] **Step 1:** Mock server (scratchpad) implementing: Firestore `GET …/public_profiles/{slug}`, `POST …:commit` (records body, returns `{}`), Auth emulator `POST /identitytoolkit.googleapis.com/v1/projects/{p}/accounts:lookup`, Resend `POST /emails` (records body).
- [ ] **Step 2:** Call `handleInquiry` with real `saveInquiry`, `getUserEmail`, `sendEmail` against the mock and a stub `verifyToken`; assert commit body fields/transform, artist mail `reply_to`, requester mail recipient.
- [ ] **Step 3:** `npx next build` → success, `/api/inquiries` listed.
- [ ] **Step 4:** Browser: open a work page, confirm form still renders; signed-out state unchanged.
