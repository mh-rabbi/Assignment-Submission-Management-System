# Roll Call Frontend — Decision Log

Running log of judgment calls, assumptions, and deviations from the spec docs.

---

## D-01 — Auth stored in `localStorage` (full `AuthResponseDto`)
**Date:** 2026-08-12  
**Context:** The API returns `name` in the login response (`AuthResponseDto`) but the JWT claims only contain `sub`, `email`, `role`, `classId`. There is no `/me` endpoint. Getting a user's name by ID requires `GET /api/users/{id}` which is Admin-only.  
**Decision:** Store the entire `AuthResponseDto` JSON in `localStorage` under key `rc_auth`. This gives us the display name for the sidebar without requiring an Admin-only extra API call.  
**Risk:** `localStorage` is accessible to JavaScript on the page (XSS risk). Acceptable for this demo/school-internal tool — not a banking app. Token is cleared on sign-out.  
**Status:** Confirmed

---

## D-02 — Sign-in and Create Account as tabs on `/auth`
**Date:** 2026-08-12  
**Context:** Design §15 specifies "single route, tabbed."  
**Decision:** One route `/auth` with two tabs. CTAs from the landing page all go to `/auth`. The default active tab is Sign In (since the primary user story is logging in, not registering — registration is described as primarily for testing in `backend_api.md`).  
**Status:** Confirmed

---

## D-03 — `POST /api/teacher-assignments` returns `200 OK`, not `201 Created`
**Date:** 2026-08-12  
**Context:** `backend_api.md` §11 note 4: "Creation status codes are inconsistent by design."  
**Decision:** API client `apiFetch` helper accepts any 2xx as success. No hardcoded `201` check anywhere in teacher-assignment creation code.  
**Status:** Confirmed

---

## D-04 — `POST /api/submissions` returns `200 OK`, not `201 Created`
**Date:** 2026-08-12  
**Context:** Same as D-03. Also, submissions are "create-or-update" (upsert), so a 200 on what might be a first-time create is intentional by the backend.  
**Decision:** Same — accept any 2xx. Success toast: "Submission saved." (not "Submission created." since it could be either).  
**Status:** Confirmed

---

## D-05 — Student "not submitted" status is UI-derived
**Date:** 2026-08-12  
**Context:** `backend_api.md` Business Rules §10 rule 8: "`NotSubmitted` is never stored — it's the absence of a Submission row."  
**Decision:** Student assignments list page will: (1) fetch `GET /api/assignments` (returns their published assignments), (2) fetch `GET /api/submissions/mine` (returns all their submissions), then (3) cross-reference by `assignmentId` to derive a per-assignment display status: Not submitted / Submitted / Late / Graded.  
**Status:** Confirmed

---

## D-06 — Teacher Subject/Class dropdowns constrained client-side
**Date:** 2026-08-12  
**Context:** Design §17 Teacher: "Subject/Class dropdowns are constrained client-side to combinations that exist in their own TeacherSubjectClass rows, so an invalid combination can't even be selected."  
**Decision:** When the Create Assignment form opens, fetch `GET /api/teacher-assignments/teacher/{teacherId}` first. Build a lookup of allowed `(subjectId, classId)` pairs. When user selects a Subject, only show Classes that appear in their rows for that Subject. This means the server's 403 ("combination not in TeacherSubjectClass") should never be reachable via normal UI use.  
**Status:** Confirmed

---

## D-07 — Self-serve sign-up via `/api/auth/register`
**Date:** 2026-08-12  
**Context:** `backend_api.md` §3: "No auth required (primarily for testing — Admin-created users via `/api/users` is the main flow)." Design §15: "Ship self-serve sign-up against /api/auth/register for this demo/product context, but flag to backend if self-serve account creation is actually intended."  
**Decision:** Ship create-account form against `/api/auth/register`. Include a small helper text note on the form: "Account creation is open for this demo — in production, accounts are created by an Admin." Flag this as a product decision.  
**Backend team flag:** Is open self-serve account creation (including Admin/Teacher roles) intended to remain in production? This is a significant security surface.  
**Status:** Flagged

---

## D-08 — No "forgot password" UI
**Date:** 2026-08-12  
**Context:** No password reset endpoint exists in the API. Design §15: "No 'forgot password' flow exists in the API — omit rather than build a dead end."  
**Decision:** No "forgot password" link anywhere. If users need a password reset, they contact Admin who can update via `PUT /api/users/{id}`.  
**Status:** Confirmed

---

## D-09 — Admin dashboard metrics computed client-side
**Date:** 2026-08-12  
**Context:** No `/api/stats`, `/api/dashboard`, or aggregation endpoint. All list endpoints return unfiltered arrays.  
**Decision:** Fetch: `GET /api/classes` (count), `GET /api/subjects` (count), `GET /api/assignments` (count active), `GET /api/submissions` (count this week by filtering `createdAt`). This is 4 parallel fetches. At school data scale (dozens to low hundreds of records), this is fine. If performance becomes an issue, note it in known-issues.  
**Status:** Confirmed

---

## D-10 — File download via `fetch` + Blob URL
**Date:** 2026-08-12  
**Context:** `GET /api/submissions/{id}/file` requires `Authorization: Bearer <token>` header. A plain `<a href="/api/submissions/X/file" download>` tag cannot send this header — the browser makes the request without auth and gets a 401.  
**Decision:** Implement an `downloadFile(submissionId)` utility that: (1) calls `fetch` with auth header, (2) checks response is ok, (3) creates a Blob URL, (4) programmatically clicks a temporary `<a>` element to trigger download, (5) revokes the Blob URL. Shown as a "Download file" button, not a raw link.  
**Status:** Confirmed

---

## D-11 — Next.js project at `/frontend/roll-call/`
**Date:** 2026-08-12  
**Context:** The `/frontend/` directory already contains reference docs (`backend_api.md`, `roll-call-design-system-v2.md`, `rollcall-demo.html`). Scaffolding Next.js directly into `/frontend/` would place `package.json`, `app/`, etc. alongside these files, which is messy.  
**Decision:** Create Next.js project at `/frontend/roll-call/`. The `.context/` and `agent.md` files live at `/frontend/` root (per the spec requirement "at the frontend project root"), while the actual Next.js code lives in the sub-directory.  
**Status:** Confirmed

---

## D-12 — Teacher "My Teaching" screen shows TeacherSubjectClass rows read-only
**Date:** 2026-08-12  
**Context:** Design §14 nav: Teacher has "My teaching (their TeacherSubjectClass rows, read-only)." Only Admin can create/delete teacher assignments. Teacher can view their own via `GET /api/teacher-assignments/teacher/{teacherId}`.  
**Decision:** Implement as a simple table showing which Subject+Class combos they're assigned to. No create/delete UI. Useful for Teacher to see their own assignments and understand which combos they can create assignments for.  
**Status:** Confirmed
