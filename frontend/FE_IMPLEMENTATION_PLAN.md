# IMPLEMENTATION_PLAN.md
## Role-based Assignment & Submission Management System — Frontend

**Stack:** Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS + shadcn/ui
**Target consumer:** AI coding agent (Google Antigravity). Follow phases sequentially. Each phase must build and run before moving to the next. Do not skip ahead.
**Backend ground truth:** This plan is built strictly against the attached backend `IMPLEMENTATION_PLAN.md` / `README.md`. Do not invent endpoints, fields, or business rules not documented there. The backend is already built, tested, and dockerized — treat its API contract as fixed.

---

## 0. Project Overview

Frontend for a role-based Assignment & Submission Management System (school/college). Three roles — Admin, Teacher, Student — each with a separate route group and dashboard. Consumes a JWT-authenticated ASP.NET Core 10 Web API running at (dev) `http://localhost:8080`.

**Backend API summary (from backend plan — do not modify, only consume):**
- Auth: `POST /api/auth/login`, `POST /api/auth/register`
- Users: `GET/POST /api/users`, `GET/PUT/DELETE /api/users/{id}` (Admin-only)
- Classes: `GET/POST /api/classes`, `GET/PUT/DELETE /api/classes/{id}` (soft-delete → 404 on GET after delete; duplicate name → 409)
- Subjects: same shape as Classes
- Teacher assignments (TeacherSubjectClass): `GET/POST /api/teacher-assignments`, `GET /api/teacher-assignments/teacher/{teacherId}`, `DELETE /api/teacher-assignments/{id}`
- Assignments: `GET/POST /api/assignments`, `GET/PUT/DELETE /api/assignments/{id}`, `PATCH /api/assignments/{id}/status`
- Submissions: `GET/POST /api/submissions`, `GET /api/submissions/mine`, `GET /api/assignments/{assignmentId}/submissions`, `GET /api/submissions/{id}`, `PATCH /api/submissions/{id}/grade`, `PATCH /api/submissions/{id}/status`, `GET /api/submissions/{id}/history`, `GET /api/submissions/{id}/file`
- JWT claims: `sub` (UserId), `email`, `role` (Admin/Teacher/Student), `classId` (Student only, nullable)
- No pagination/filtering on any list endpoint — the frontend must handle full-list rendering (client-side search/filter/sort only).
- No `/me` endpoint — current-user display data comes from decoding the JWT server-side, not from an API call.
- Submission responses return a relative download URL (`/api/submissions/{id}/file`), never a raw physical path.

---

## 1. Route Map & Access Control

```
/                           Public landing page (animated scroll flow, Framer Motion). CTA at
                            bottom: "Wanna use our portal?" → links to /login
/login                      Shared login form (email + password). On success, decodes role
                            from response and redirects to /admin, /teacher, or /student.

/admin/                     Admin dashboard (summary counts: users, classes, assignments, etc.)
/admin/users                User CRUD (list, create, edit, soft-delete)
/admin/classes              Class CRUD
/admin/subjects             Subject CRUD
/admin/teacher-assignments  TeacherSubjectClass CRUD (assign Teacher → Subject + Class)
/admin/assignments          View ALL assignments system-wide (read-heavy; can create on behalf
                            of a Teacher per Business Rule #9)
/admin/submissions          View ALL submissions system-wide (read-only oversight)

/teacher/                   Teacher dashboard (own assignments summary)
/teacher/assignments        List/create/edit/publish/close own Assignments
/teacher/assignments/[id]/submissions   Grade submissions for one assignment

/student/                   Student dashboard (own class's published assignments summary)
/student/assignments        Browse published assignments for own ClassId
/student/assignments/[id]   Assignment detail + submission form (create/edit until deadline)
/student/grades             My Grades/Feedback (submissions with Status=Graded)
```

### Route Protection
- **`middleware.ts`** at project root: reads the httpOnly auth cookie, decodes the JWT, checks the `role` claim against the requested path prefix (`/admin`, `/teacher`, `/student`). Redirects to `/login` if no valid token, or to the user's own role dashboard if the role doesn't match the path (e.g. a Student hitting `/admin/*`).
- **Layout-level backup guard**: each `app/admin/layout.tsx`, `app/teacher/layout.tsx`, `app/student/layout.tsx` re-checks auth server-side (defense in depth against token expiry between middleware and page render, and in case middleware is ever bypassed by a caching edge case).
- Unauthenticated visitor to `/` sees the public landing page — no redirect.

---

## 2. Auth & API Integration Strategy

### Token Handling
1. `app/api/auth/login/route.ts` — a Next.js Route Handler that proxies `POST /api/auth/login` to the backend. On success, it takes the returned JWT and sets it as an **httpOnly, secure, sameSite=lax cookie** (name: `auth_token`) on the response. The raw token is never sent to client-side JS.
2. All subsequent backend calls attach `Authorization: Bearer <token>` where `<token>` is read server-side via `next/headers` `cookies()`.
3. **Current user info**: no `/me` endpoint exists. Server Components/layouts decode the JWT payload directly (base64 decode, no verification needed client-side since the backend already validated it) to read `email`, `role`, `classId`. This is exposed to Client Components via a small server-rendered context provider (`<CurrentUserProvider user={...}>`) that passes the decoded (non-sensitive) claims down as props — the token itself never leaves the server.
4. **Known limitation (documented, not fixed)**: the JWT does not carry `Name`, only `email`/`role`/`classId`. The UI will display email in the navbar, not full name, unless a future backend change adds `name` to the JWT claims or a `/me` endpoint is added.
5. Logout: `app/api/auth/logout/route.ts` clears the cookie.

### Data Fetching
- **Server Components** handle initial page-load reads (dashboards, list pages): call `lib/api-client.ts` server-side, cookie attached automatically.
- **TanStack Query** (client components) handles anything interactive: forms with optimistic feedback, grading actions, status transitions (Publish/Close), submission create/edit, teacher-assignment create/delete. Query keys namespaced by resource (`['assignments']`, `['submissions', assignmentId]`, etc.); mutations invalidate the relevant keys on success.
- **`lib/api-client.ts`**: single typed fetch wrapper. Exposes typed functions per resource (`getAssignments()`, `createAssignment(dto)`, etc.) mirroring backend DTOs exactly. Used by both Server Components (imported directly) and TanStack Query hooks (wrapped in `useQuery`/`useMutation`). Centralizes error handling: parses the backend's consistent error shape `{ statusCode, message, errors }` (from `ExceptionMiddleware`) and throws a typed `ApiError`.
- **Current-user context**: React Context, populated server-side once per request (see above) — not Zustand, not TanStack Query (it's not server data, it's just decoded claims).

### Error → UI Mapping
Map backend status codes consistently across the app (referencing backend Business Rules #10–14 and the bugfixes in its `PROGRESS.md`):
- `401` → force logout, redirect to `/login` (token invalid/expired, or bad login credentials shown inline on the login form)
- `403` → inline "not authorized" message, no redirect (e.g. Teacher viewing another Teacher's assignment)
- `404` → "not found" state (e.g. viewing a soft-deleted Class/Subject)
- `409` → inline conflict message on forms (duplicate Class/Subject name, duplicate TeacherSubjectClass)
- `400` with `errors[]` → map array to RHF field errors where field names match; otherwise show as a form-level alert

---

## 3. Form Handling & Validation

**React Hook Form + Zod**, one schema per DTO, colocated with its form component. Zod schemas mirror backend FluentValidation rules for instant client-side feedback (still authoritative server-side):

| Form | Key Zod rules (mirroring backend) |
|---|---|
| Login | email format, password required |
| Register (if exposed) | email format, password min length, `ClassId` required only when Role=Student |
| Class / Subject create-edit | `Name` required, non-empty after trim (backend rejects empty-name updates) |
| Assignment create-edit | `Title` required, `Deadline` must be a future date on create, `MaxMarks > 0` |
| Grading | `Marks` required, `0 <= Marks <= assignment.MaxMarks`, `Feedback` optional |
| Submission | `Content` required (unless file provided), file: extension whitelist (`.pdf,.docx,.doc,.zip,.png,.jpg,.jpeg`), max 10MB, validated even at 0 bytes |
| Teacher Assignment | `TeacherId`, `SubjectId`, `ClassId` all required selects |

All server error responses are still treated as authoritative — client validation only improves UX, never replaces the try/catch around API calls.

---

## 4. UI / Styling System

- **Tailwind CSS** + **shadcn/ui** (copy-in, not a black-box dependency — components live in `components/ui/` and are fully editable).
- **Dark mode**: `next-themes`, toggle in navbar, shadcn's CSS-variable-based theming.
- **Landing page**: Framer Motion scroll-triggered variants (`useScroll`, `useTransform`) illustrating the Admin → Teacher → Student flow (assign teacher → create assignment → student submits → teacher grades) as the user scrolls, ending in a CTA section with a "Wanna use our portal?" button → `/login`. Built responsive-first: stacked/simplified animation on mobile viewports (reduced motion where `prefers-reduced-motion` is set — accessibility default).
- **Shared components** (`components/shared/`): `DataTable` (client-side sort/search/pagination since backend has none), `StatusBadge` (Draft/Published/Closed, Submitted/Graded, colored), `EmptyState`, `ConfirmDialog` (for destructive actions like soft-delete), `FileDropzone` (react-dropzone wrapper), `DeadlineCountdown` (date-fns).
- **Toasts**: `sonner`, used for all mutation success/error feedback app-wide.

---

## 5. Project Structure

```
frontend/
├── middleware.ts
├── next.config.ts
├── tailwind.config.ts
├── .env.example                      # NEXT_PUBLIC_APP_URL, BACKEND_API_URL
├── README.md
├── app/
│   ├── layout.tsx                    # root layout, ThemeProvider, Toaster
│   ├── page.tsx                      # public landing page
│   ├── login/
│   │   └── page.tsx
│   ├── api/
│   │   └── auth/
│   │       ├── login/route.ts        # proxy → sets httpOnly cookie
│   │       └── logout/route.ts       # clears cookie
│   ├── admin/
│   │   ├── layout.tsx                # guard + CurrentUserProvider + AdminNav
│   │   ├── _components/              # AdminNav, AdminSidebar, etc.
│   │   ├── page.tsx                  # dashboard
│   │   ├── users/
│   │   │   ├── page.tsx
│   │   │   └── _components/UserForm.tsx
│   │   ├── classes/
│   │   ├── subjects/
│   │   ├── teacher-assignments/
│   │   ├── assignments/
│   │   └── submissions/
│   ├── teacher/
│   │   ├── layout.tsx
│   │   ├── _components/
│   │   ├── page.tsx
│   │   └── assignments/
│   │       ├── page.tsx
│   │       ├── _components/AssignmentForm.tsx
│   │       └── [id]/submissions/page.tsx
│   └── student/
│       ├── layout.tsx
│       ├── _components/
│       ├── page.tsx
│       ├── assignments/
│       │   ├── page.tsx
│       │   └── [id]/page.tsx         # detail + submission form
│       └── grades/page.tsx
├── components/
│   ├── ui/                           # shadcn primitives (button, input, dialog, table, ...)
│   └── shared/                       # DataTable, StatusBadge, EmptyState, ConfirmDialog,
│                                      # FileDropzone, DeadlineCountdown, CurrentUserProvider
├── lib/
│   ├── api-client.ts                 # typed fetch wrapper, one function per endpoint
│   ├── auth.ts                       # JWT decode helpers (server-only)
│   ├── query-client.ts               # TanStack Query provider setup
│   └── utils.ts                      # cn(), date formatting helpers
├── hooks/
│   ├── useAssignments.ts             # TanStack Query hooks
│   ├── useSubmissions.ts
│   ├── useUsers.ts
│   └── ...
├── types/
│   └── api.ts                        # types mirroring backend DTOs exactly
├── validators/
│   └── *.schema.ts                   # Zod schemas per form
└── tests/
    ├── components/
    └── hooks/
```

### NestJS → Next.js Mental Model (for orientation, since backend used a similar table)
| Backend concept | Frontend equivalent |
|---|---|
| Controller endpoint | `lib/api-client.ts` function |
| DTO | `types/api.ts` interface + Zod schema in `validators/` |
| `[Authorize(Roles=...)]` | `middleware.ts` + layout guard |
| Service layer business rule | Client-side Zod validation (mirror only — not authoritative) |
| `ExceptionMiddleware` JSON shape | `ApiError` class in `api-client.ts`, parsed uniformly |

---

## 6. Package List

```bash
# Core
npx create-next-app@latest frontend --typescript --tailwind --app --eslint

# UI
npx shadcn@latest init
npm install next-themes lucide-react sonner framer-motion

# Data & forms
npm install @tanstack/react-query @tanstack/react-query-devtools
npm install react-hook-form zod @hookform/resolvers
npm install date-fns
npm install react-dropzone
npm install jose          # JWT decode (server-side, edge-compatible for middleware)

# Testing
npm install -D vitest @vitejs/plugin-react jsdom
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

Note: `jose` is specified for JWT decoding instead of `jwt-decode` because it's Edge-runtime compatible — required since `middleware.ts` runs on the Edge runtime, and using one library for both middleware and server-side decode avoids inconsistency.

---

## 7. Implementation Phases

### Phase 0 — Scaffolding
```bash
npx create-next-app@latest frontend --typescript --tailwind --app --eslint --src-dir=false --import-alias "@/*"
```
Install all packages from Section 6. Configure `tailwind.config.ts`, initialize shadcn (`npx shadcn@latest init`), add base shadcn components needed early: `button, input, label, card, table, dialog, dropdown-menu, select, badge, form, sonner, avatar, skeleton`. Set up `.env.example` with `BACKEND_API_URL=http://localhost:8080`. Configure `next.config.ts` if the backend needs a rewrite/proxy for local dev CORS.

### Phase 1 — Auth Foundation
1. Build `lib/auth.ts`: `decodeToken(token): { sub, email, role, classId }` using `jose`.
2. Build `app/api/auth/login/route.ts` and `app/api/auth/logout/route.ts`.
3. Build `middleware.ts`: cookie read → decode → role/path match → redirect logic.
4. Build `components/shared/CurrentUserProvider.tsx` (React Context, populated server-side).
5. Build `/login` page: RHF + Zod form, calls the proxy route, redirects by role on success, shows inline error on 401.
6. Verify: log in as each seeded demo user (Admin/Teacher/Student from backend README), confirm correct redirect and that visiting a wrong-role route redirects away.

### Phase 2 — API Client & Shared UI
1. Build `types/api.ts` mirroring every backend DTO exactly (Users, Classes, Subjects, TeacherSubjectClass, Assignments, Submissions, SubmissionHistory) — cross-check field names/types against the backend `IMPLEMENTATION_PLAN.md` Section 1 schema.
2. Build `lib/api-client.ts`: one function per endpoint from the Section 0 endpoint list, typed request/response, `ApiError` class for the `{statusCode, message, errors}` shape.
3. Build `lib/query-client.ts` + wrap root layout in `QueryClientProvider`.
4. Build shared components: `DataTable`, `StatusBadge`, `EmptyState`, `ConfirmDialog`, `DeadlineCountdown`.
5. Verify: a throwaway test page can list Classes via a Server Component call to `api-client.ts`.

### Phase 3 — Admin Module
- Users: list (DataTable), create/edit (dialog + RHF/Zod form, Role-conditional ClassId field), soft-delete (ConfirmDialog).
- Classes / Subjects: CRUD, handle 409 duplicate-name inline, handle 404-after-delete by removing from list on refetch.
- Teacher Assignments: assign Teacher→Subject+Class (3 selects), list, delete; surface 409 on duplicate composite.
- Assignments (system-wide view): read-only DataTable across all teachers; support Admin-on-behalf-of-Teacher creation (`TeacherId` select required in the form per backend Business Rule #9).
- Submissions (system-wide view): read-only oversight DataTable.

### Phase 4 — Teacher Module
- My Assignments: list own assignments (filtered client-side or via query params if backend adds them later — for now, filter the full list by `TeacherId == currentUser.sub`), create (auto-fills `TeacherId` from JWT), edit, status transitions (Draft→Published→Closed as a dropdown/button group), delete.
- Assignment Submissions: per-assignment DataTable of submissions, grading form (Marks/Feedback), enforce `Marks <= MaxMarks` client-side.

### Phase 5 — Student Module
- Browse Assignments: published assignments where `ClassId == currentUser.classId` (backend already scopes this — frontend just renders).
- Assignment Detail + Submission Form: `FileDropzone` + text content, deadline countdown, disable submit past deadline unless `AllowLateSubmission`, show late-submission warning banner.
- My Grades: list own graded submissions with Marks/Feedback.
- Submission history view (optional detail expansion using `GET /api/submissions/{id}/history`).

### Phase 6 — Landing Page
- Framer Motion scroll-driven sections illustrating the Admin→Teacher→Student→grading flow.
- Responsive: simplified/reduced animation under a mobile breakpoint and under `prefers-reduced-motion`.
- Final CTA section → `/login` button ("Wanna use our portal?").

### Phase 7 — Polish & Error States
- Global loading skeletons (shadcn `Skeleton`) for all list/detail pages.
- Global error boundary (`app/error.tsx`, `app/admin/error.tsx`, etc.) and `not-found.tsx` for 404s.
- Consistent toast feedback (`sonner`) for every mutation.
- Accessibility pass: form labels, focus states, keyboard nav on DataTable/Dialog.

### Phase 8 — Testing
Vitest + React Testing Library coverage for:
1. `CurrentUserProvider` renders correct role-based nav.
2. `middleware.ts` redirect logic (unit-testable decode/match logic extracted into a pure function).
3. Assignment form: Zod validation blocks past-deadline submission.
4. Grading form: Zod validation blocks `Marks > MaxMarks`.
5. `DataTable` sort/search behavior.
6. `api-client.ts` `ApiError` parsing for each status code shape.

### Phase 9 — Docs & Polish
- `README.md`: overview, tech stack, `npm install && npm run dev` setup, env vars needed, demo credentials (reference backend's), known limitations (no `/me` endpoint → email-only display; no backend pagination → client-side only), how to run tests (`npm run test`).
- Final check: fresh clone → `npm install` → `.env.local` pointed at running backend → `npm run dev` → login with each seeded role → every route in Section 1 reachable and functional.

---

## 8. Agent Working Context (.context/PROGRESS.md)

Same convention as the backend build. Maintain `/.context/PROGRESS.md` in the frontend repo as the cross-session source of truth:

```markdown
## Phase Status
- [x] Phase 0 — Scaffolding — DONE (date)
- [ ] Phase 1 — Auth Foundation — IN PROGRESS
...

## Last Session Summary
<what was done, files touched, last command run>

## Deviations From Plan
<anything that diverged from this IMPLEMENTATION_PLAN.md and why>

## Known Issues / TODO
<blockers, unfinished edge cases, things to revisit>

## How to Verify Current State
<e.g. `npm run dev`, login as seeded users, check routes per Section 1>
```

Before starting any work, check if `/.context/PROGRESS.md` exists. If it does, read it fully and resume from where it left off rather than restarting or re-doing completed phases.

---

## 9. Key Design Decisions & Assumptions (for README)

- **Route groups per role** (`/admin`, `/teacher`, `/student`), not a single shared shell — cleaner auth guard scoping.
- **httpOnly cookie for JWT**, set via a Next.js Route Handler proxy — token never touches client-side JS.
- **No `/me` endpoint on the backend** — current-user display data (email/role/classId) is decoded from the JWT server-side; full `Name` is not available in the navbar unless a future backend change adds it to claims or exposes `/me`.
- **Mixed data-fetching**: Server Components for initial reads, TanStack Query for interactive/mutating flows.
- **React Context (not Zustand)** for current-user/UI state — TanStack Query already owns all server-state caching, so a separate global store would be redundant at this app's size.
- **React Hook Form + Zod**, mirroring backend FluentValidation rules for instant feedback; server validation remains authoritative.
- **Tailwind + shadcn/ui**, fully editable copy-in components, not a black-box UI library.
- **No backend pagination/filtering** — all list views fetch the full resource list and handle search/sort/pagination client-side in `DataTable`.
- **Framer Motion landing page** with `prefers-reduced-motion` support for accessibility.