# Roll Call — Frontend Implementation Plan
**Agent document — source of truth for this frontend build. Keep updated as work progresses.**
*Last updated: 2026-08-12 | Status: All 9 Phases Complete (Build Verified & Tested against Live API)*

---

## 1. Tech Stack Decision

**Framework:** Next.js 15 (App Router) + TypeScript  
**Styling:** Vanilla CSS Custom Properties (no Tailwind, no CSS-in-JS)  
**Data Fetching:** `fetch` with a typed API client module (`@/lib/api.ts`); React `useState`/`useEffect` for client components; React Context (`AuthContext`) for auth state  
**Form Handling:** `FormData` for multipart submissions; controlled React state elsewhere — no external form library  
**State:** React Context (`AuthContext`) for current user/token; no global state library needed at this data scale  
**Icons:** `@tabler/icons-react` (outline-only SVG components — matches design spec's "Tabler-style outline" requirement)

**Justification:**  
You specified Next.js as your preference. Next.js 15 App Router is the right choice because:  
(1) File-system routing maps directly onto the route map in design §18 — `/app/page.tsx` is the landing page, `/app/dashboard/page.tsx` is the dashboard, no manual router config needed.  
(2) Server Components mean the shell HTML arrives pre-rendered, which matters for landing page LCP performance.  
(3) TypeScript means every API response shape is typed against `backend_api.md`'s DTOs — you catch mismatches at compile-time, not at runtime when a student can't submit.  
(4) Vanilla CSS Custom Properties is the only styling approach that lets us swap the entire 60/30/10 palette with a single `data-theme` attribute flip on `<html>` — exactly what the design system demands. Tailwind can't do this cleanly without JIT config hacks.

---

## 2. Phase-by-Phase Build Plan

### Phase 1 — Project Scaffold, Design Tokens, Theming, Layout Primitives [COMPLETED]
**Deliverables:**
- Next.js 15 + TypeScript project at `/frontend/roll-call/`
- `globals.css` with all CSS Custom Properties from design §1–3 (both light + dark palette, typography scale, glassmorphism utility classes)
- Google Fonts loaded: Fraunces, Inter, IBM Plex Mono
- `ThemeProvider` client component: reads `localStorage`/`prefers-color-scheme`, sets `data-theme` on `<html>`
- Reusable primitive components: `Button` (primary/ghost/danger/lg/sm variants), `GlassPanel` (standard/muted/app), `RoleStamp`, `StatusPill`
- Root layout (`/app/layout.tsx`) with `ThemeProvider`, `AuthProvider`, `ToastProvider` and fonts wired in
- `/lib/api.ts` — typed API client with base URL, auth header injection, standardized error handling

**API endpoints:** None  
**Design spec sections:** §1 (colors), §2 (typography), §3 (glassmorphism), §4 (theme toggle), §5 (layout system), §8 (component list)  
**Done definition:** `npm run build` produces zero errors/warnings; design tokens are CSS custom properties verifiable in DevTools; light/dark toggle persists across page refresh.

---

### Phase 2 — Landing Page [COMPLETED]
**Deliverables:**
- `/app/page.tsx` — full landing page matching `rollcall-demo.html` behavior adapted as proper React components
- All 7 sections from design §7: Nav, Hero, Problem, Roles, Flow, Rules, Stats band, Final CTA, Footer
- Roll-call rail (§6): tick positions from real `getBoundingClientRect()` scroll offsets (not evenly spaced), active tick fills `--moss`, keyboard navigable (`role="button"`, `tabindex="0"`, `aria-label`), replaced with 3px top progress bar below 1180px
- Scroll-reveal via `IntersectionObserver` (threshold 0.18, fires once per section)
- Hero entrance animation (staggered fade + translateY(16px), 700ms expo-out)
- Blob drift animation (60–90s, `prefers-reduced-motion` respected)
- Responsive at all 5 breakpoints from §11 (320px, 640px, 900px, 1024px, 1180px)
- Mobile hamburger nav with glass slide-down panel
- Theme toggle in nav
- All CTAs route to `/auth`

**API endpoints:** None  
**Design spec sections:** §6, §7, §9 (motion), §10 (a11y), §11 (responsive)  
**Done definition:** Visual matches `rollcall-demo.html` at desktop, tablet, and mobile; rail ticks land on real section scroll offsets (visibly uneven); top progress bar appears below 1180px; reduced-motion renders elements in final state immediately; rail ticks keyboard-reachable.

---

### Phase 3 — Auth Screens [COMPLETED]
**Deliverables:**
- `/app/auth/page.tsx` — tabbed Sign In / Create Account screen
- Glass card (440px wide), centered, one-blob parchment/chalkboard background
- **Sign In tab:** Email + Password (44px glass-muted inputs) → `POST /api/auth/login` → store `AuthResponseDto` in Context + localStorage → redirect to `/dashboard`
- **Create Account tab:** Name + Email + Password + Role segmented control (Badge/RoleStamp visual, 3-way: Admin/Teacher/Student) + Class dropdown (only rendered when Role=Student, populated from `GET /api/classes`)
- 401 error: inline banner above fields, `--stamp` tint at 10%, text: "That email or password isn't right." — never distinguishes which field was wrong
- 400 errors: per-field inline messages; general banner for non-field errors
- `AuthContext`: stores full `AuthResponseDto` (includes `name` field for sidebar display); decodes JWT for `role`/`classId`
- Next.js middleware / client route guard: unauthenticated requests to app routes redirect to `/auth`

**API endpoints:** `POST /api/auth/login`, `POST /api/auth/register`, `GET /api/classes`  
**Design spec sections:** §15 (auth screens), §8 (forms)  
**Done definition:** All three demo role credentials work and redirect to role-appropriate dashboard; bad credentials shows inline banner without page reload; Student role selection shows class dropdown; token + user data survive refresh.

---

### Phase 4 — App Shell [COMPLETED]
**Deliverables:**
- `/app/(app)/layout.tsx` — authenticated two-pane layout: fixed sidebar (240px) + main content area
- **Sidebar:** glass panel, full viewport height, role-filtered nav (items for inapplicable roles NOT rendered in DOM), active state = `--moss` text + 2px left border + glass-muted bg, icons from Tabler outline set
- **Bottom of sidebar:** `RoleStamp` badge (A / T / S) + user name (Inter 14px) + "Sign out" text link (clears context + localStorage + redirects to `/`)
- **Topbar:** page title (Fraunces Display M 24px) + theme toggle + avatar initial (first letter of name in glass-muted pill)
- **Mobile ≤900px:** sidebar collapses to fixed bottom tab bar (icons + labels, max 5 items for role)
- Nav items per role (from design §14):
  - Admin: Dashboard, Users, Classes, Subjects, Teacher Assignments, Assignments, Submissions
  - Teacher: Dashboard, My Assignments, Submissions, My Teaching
  - Student: Dashboard, Assignments, My Submissions

**API endpoints:** None (decoded from stored AuthResponseDto in context)  
**Design spec sections:** §13 (app-mode adjustments — blur 14px, 1 blob max, denser spacing), §14 (app shell)  
**Done definition:** Each role sees only its nav items; sidebar glass visible with paper texture behind; sign-out clears all stored state; mobile bottom tab bar at ≤900px; no app-mode Fraunces except page titles.

---

### Phase 5 — Admin Screens [COMPLETED]
**Deliverables:**
- `/dashboard` (Admin) — metric pills (total classes, subjects, active assignments, submissions this week — computed client-side from fetched arrays) + 5 most recent submissions table
- `/users` — data table (GET /api/users — includes inactive, shown with Active/Inactive badge), create/edit/deactivate modals
- `/classes` — table + create/edit modal (409 shown inline) + soft-delete confirmation dialog
- `/subjects` — same pattern as classes
- `/teacher-assignments` — Teacher × Subject × Class table; create modal with three dropdowns; empty state: "No teacher is assigned to any subject or class yet — assignments can't be created until this exists."
- `/assignments` (Admin) — all assignments, client-side status tabs (All / Draft / Published / Closed)
- `/submissions` (Admin) — all submissions, read-only oversight table

**API endpoints:** GET/POST/PUT/DELETE /api/users, /api/classes, /api/subjects, /api/teacher-assignments, GET /api/assignments (admin = all), GET /api/submissions (admin = all)  
**Design spec sections:** §16 (data table, modal, forms, toasts, empty states, loading skeletons), §17 Admin  
**Done definition:** All CRUD operations work against live API; 409 conflict surfaced inline (not as page error); soft-delete confirmation modal appears; data tables have client-side search + sort + pagination (20 rows default); inactive users shown with badge, not hidden.

---

### Phase 6 — Teacher Screens [COMPLETED]
**Deliverables:**
- `/dashboard` (Teacher) — metric pills scoped to own assignments (published count, ungraded submissions count — prominently, since this is the daily action trigger)
- `/assignments` (Teacher) — own assignments only, any status; "Create assignment" opens a modal with Subject/Class dropdowns constrained client-side to their TeacherSubjectClass rows so invalid combos can't even be selected
- `/assignments/:id` (Teacher) — assignment info + status lifecycle buttons (Draft → Published → Closed, styled as distinct buttons per state) + submissions table for that assignment
- `/submissions` (Teacher) — all submissions across their assignments, filterable by assignment; grading panel per row

**API endpoints:** GET/POST/PUT/PATCH/DELETE /api/assignments, GET /api/teacher-assignments/teacher/:teacherId, GET /api/assignments/:assignmentId/submissions, PATCH /api/submissions/:id/grade, PATCH /api/submissions/:id/status  
**Design spec sections:** §16 (grading panel), §17 Teacher  
**Done definition:** Create assignment form only allows valid Subject/Class combos; status buttons reflect actual state; grading panel saves and immediately updates badge to Graded.

---

### Phase 7 — Student Screens [COMPLETED]
**Deliverables:**
- `/dashboard` (Student) — "Due soon" list: published assignments in their class sorted by deadline ascending, with deadline countdown
- `/assignments` (Student) — published assignments for their class with derived UI status per row: **Not submitted** (no submission row in mine) / **Submitted** / **Late** (`isLate: true`) / **Graded** (`status: "Graded"`)
- `/assignments/:id` (Student) — full assignment brief + submit form (drag-and-drop FileUpload + Content textarea) OR, if already submitted, read view with "Edit submission" button (button disabled when assignment is Closed) + submission history accordion
- `/submissions` (Student, "My Submissions") — flat list of all own submissions across assignments, with marks + feedback where available

**API endpoints:** GET /api/assignments, GET /api/assignments/:id, POST /api/submissions (multipart/form-data), GET /api/submissions/mine, GET /api/submissions/:id/history, GET /api/submissions/:id/file  
**Design spec sections:** §16 (file upload spec, submission history, grading panel read view), §17 Student  
**Done definition:** Student only sees Published assignments in their class; derived status correct; drag-and-drop works; edit re-submits and history row appears; "Edit submission" button disabled (not hidden) when Closed; file download works via fetch + Blob URL.

---

### Phase 8 — Shared UI Patterns [COMPLETED]
**Deliverables:**
- `DataTable` — client-side search (filters all visible text columns), clickable column headers for sort (chevron indicator), pagination controls (20/50/100 rows per page)
- `Modal` — 560px glass panel, centered, `rgba(ink, 0.35)` flat scrim backdrop (not blurred — max 2 glass layers), focus trap, Esc to close, Cancel + primary verb button footer
- `Toast` — bottom-right, glass pill, 4s auto-dismiss, fact-stating copy ("Assignment published." not "Success!")
- `FileUpload` — glass-muted drag-and-drop dropzone, dashed border, shows accepted types (`.pdf .docx .doc .zip .png .jpg .jpeg`), max 10MB, file chip with remove (×). Zero-byte files submitted for server validation.
- `GradingPanel` — marks numeric input with `/ MaxMarks` suffix, client-side clamp to 0–MaxMarks before submit, feedback textarea, "Save grade" button
- `SubmissionHistory` — mono-styled vertical list, newest-first, per entry: timestamp (IBM Plex Mono) + content snapshot + file link if present
- `EmptyState` — glass-muted panel, context message + optional CTA
- `Skeleton` — flat glass-muted blocks (no shimmer — design spec explicitly says "no shimmer")

**Design spec sections:** §16 (all shared UI patterns)  
**Done definition:** Each pattern in use on at least one real screen; DataTable search + sort + pagination work client-side; Modal focus trap correct; Toast auto-dismisses after 4s.

---

### Phase 9 — Cross-Cutting Pass [COMPLETED]
**Deliverables:**
- **Accessibility:** 2px `--moss` focus outline on all interactive elements; `aria-pressed` on theme toggle; `aria-label` on icon-only buttons; semantic HTML (`<nav>`, `<main>`, `<section>`, `<button>` not `<div>`)
- **Responsive:** audit every screen at 320px / 640px / 900px / 1180px
- **Error states:** 400 → inline form errors; 401 → force sign-out + redirect to `/auth`; 403 → inline "not authorized"; 404 → not-found UI state
- **Reduced motion:** all animations behind `@media (prefers-reduced-motion: reduce)`
- **Backdrop-filter fallback:** solid-color fallback background before every `backdrop-filter` declaration
- **Production Build:** `npm run build` generates 15 static pages with 0 errors/warnings

**Design spec sections:** §10 (a11y), §11 (responsive)  
**Done definition:** `npm run build` succeeds completely; live API authentication verified against running ASP.NET Core backend.

---

## 3. Decision Log

| # | Decision | Reasoning | Status |
|---|---|---|---|
| D-01 | Auth stored in `localStorage` (full `AuthResponseDto`) | API returns `name` in login response but NOT in JWT claims. Storing full response gives display name for sidebar without Admin-only extra API call. Cleared on sign-out. | Confirmed |
| D-02 | Sign-in and Create Account as tabs on `/auth` | Design §15: "single route, tabbed." CTAs from landing both go to `/auth`. | Confirmed |
| D-03 | `POST /api/teacher-assignments` returns `200`, not `201` | `backend_api.md` §11 note 4. API client accepts any 2xx. | Confirmed |
| D-04 | `POST /api/submissions` returns `200`, not `201` | Same note. Treat any 2xx as success. | Confirmed |
| D-05 | Student "not submitted" status is UI-derived | Rule 8: absence of Submission row. Cross-reference `GET /api/submissions/mine` to derive per-assignment status. | Confirmed |
| D-06 | Teacher dropdowns constrained client-side | Design §17: "constrained client-side to combinations in their TeacherSubjectClass rows." Fetch `/api/teacher-assignments/teacher/{id}` and build allowed combos. | Confirmed |
| D-07 | Self-serve sign-up against `/api/auth/register` | For demo context. `backend_api.md` describes it as "primarily for testing." Flagged to backend team as product decision. | Flagged |
| D-08 | No "forgot password" UI | No API endpoint. Design §15 says "omit rather than build a dead end." | Confirmed |
| D-09 | Admin dashboard metrics computed client-side | No `/api/stats` endpoint exists. Counts derived by fetching relevant lists and counting. Correct for this data scale given no server-side pagination. | Confirmed |
| D-10 | File download via `fetch` + Blob URL (not plain `<a href>`) | Browser can't send `Authorization` header via plain anchor tag. `GET /api/submissions/{id}/file` requires auth — must fetch programmatically, create object URL, trigger download. | Confirmed |
| D-11 | Next.js project at `/frontend/roll-call/` | Keeps reference docs (`backend_api.md`, `roll-call-design-system-v2.md`, `rollcall-demo.html`) at `/frontend/` root undisturbed. | Confirmed |
| D-12 | Teacher "My Teaching" screen shows TeacherSubjectClass rows read-only | Design §14 nav includes "My teaching (their TeacherSubjectClass rows, read-only)." Implemented as a simple list, no CRUD (Teacher can't modify their own assignments via this endpoint — only Admin can). | Confirmed |

---

## 4. Phase Progress

| Phase | Status | Notes |
|---|---|---|
| 1 — Scaffold + tokens | ✅ DONE | Next.js 15 + TS + CSS Custom Properties |
| 2 — Landing page | ✅ DONE | Rail + 7 sections + animations + responsive |
| 3 — Auth screens | ✅ DONE | Sign in / Create account tabs + JWT storage |
| 4 — App shell | ✅ DONE | Sidebar + Topbar + MobileTabBar + role filter |
| 5 — Admin screens | ✅ DONE | Dashboard, Users, Classes, Subjects, TeacherAssignments, Assignments, Submissions |
| 6 — Teacher screens | ✅ DONE | Dashboard, My Assignments, Detail, Submissions + GradingPanel |
| 7 — Student screens | ✅ DONE | Dashboard, Assignments, Detail + Submit flow + FileUpload + History |
| 8 — Shared UI patterns | ✅ DONE | DataTable, Modal, Toast, FileUpload, GradingPanel, SubmissionHistory, EmptyState, Skeleton |
| 9 — Cross-cutting pass | ✅ DONE | A11y, responsive audit, 15 static routes compiled cleanly |
