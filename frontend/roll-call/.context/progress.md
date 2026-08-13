# Roll Call Frontend — Progress Log

## Phase Status
- [x] Phase 1 — Scaffold + Design Tokens + Theming + Layout Primitives — DONE
- [x] Phase 2 — Landing Page — DONE
- [x] Phase 3 — Auth Screens — DONE
- [x] Phase 4 — App Shell — DONE
- [x] Phase 5 — Admin Screens — DONE
- [x] Phase 6 — Teacher Screens — DONE
- [x] Phase 7 — Student Screens — DONE
- [x] Phase 8 — Shared UI Patterns — DONE
- [x] Phase 9 — Cross-Cutting Pass — DONE

## Summary of Accomplishments
**Date: 2026-08-12**
- Scaffolded Next.js 15 App Router + TypeScript project at `frontend/roll-call/`.
- Created complete CSS custom property design system (`globals.css`) matching 60/30/10 light/dark parchment & chalkboard palette (`roll-call-design-system-v2.md`).
- Implemented `ThemeProvider`, `AuthContext`, `ToastProvider`, and typed API client (`lib/api.ts`).
- Built full marketing Landing Page with signature Roll-Call Rail scroll progress indicator, ambient drift blobs, scroll-reveal `IntersectionObserver`, and top progress bar fallback (<1180px).
- Built Tabbed Auth Screen (`/auth`) for Sign In and Create Account with role-segmented control and conditional student class dropdown.
- Built Authenticated App Shell (`/app/(app)/layout.tsx`) with 240px fixed glass sidebar, role-filtered navigation, topbar with page title and avatar initial, and mobile bottom tab bar (≤899px).
- Built Admin Screens: Dashboard (computed metric pills + recent submissions), Users Directory (CRUD + soft deactivate + inactive status badge), Classes (CRUD + soft delete confirmation + 409 conflict handling), Subjects (CRUD + 409 conflict handling), Teacher Assignments (3-dropdown create modal + explicit empty state), Assignments Oversight, Submissions Oversight.
- Built Teacher Screens: Dashboard (ungraded submission count alert + quick action queue), My Assignments (create assignment constrained to TeacherSubjectClass rows), Assignment Detail (Draft → Published → Closed status lifecycle buttons), Submissions + GradingPanel (marks clamp + feedback textarea).
- Built Student Screens: Dashboard (due-soon assignments), Assignments (derived status: Not submitted / Submitted / Late / Graded), Assignment Detail + Submit Flow (drag-and-drop FileUpload + Content textarea + edit submission mode + SubmissionHistory audit list), My Submissions.
- Built Shared UI Patterns: DataTable (client-side search/sort/pagination), Modal (560px glass, flat scrim backdrop, verb buttons), Toast system (4s auto-dismiss glass pill), FileUpload, GradingPanel, SubmissionHistory, EmptyState, Skeleton.
- Verified Next.js production build (`npm run build`) — 15 static routes compiled cleanly with 0 errors.
- Verified live API connectivity against ASP.NET Core Web API at `http://localhost:8080/api/auth/login`.

## How to Verify
```bash
cd /home/mahmudul-rabbi/OnnorokomProjokti/frontend/roll-call
npm run build   # Verifies production bundle
npm run dev     # Runs local development server at http://localhost:3000
```
