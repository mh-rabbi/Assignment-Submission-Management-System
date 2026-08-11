# PROGRESS.md — Assignment Submission Management System

## Phase Status

### Backend (COMPLETE)
- [x] Phase 0 — Solution & Project Scaffolding — DONE (2026-08-09)
- [x] Phase 0.5 — Dockerization — DONE (2026-08-09)
- [x] Phase 1 — Database Layer — DONE (2026-08-09)
- [x] Phase 2 — Authentication & Authorization — DONE (2026-08-09)
- [x] Phase 3 — Admin Module — DONE (2026-08-09)
- [x] Phase 4 — Teacher Module — DONE (2026-08-09)
- [x] Phase 5 — Student Module — DONE (2026-08-09)
- [x] Phase 6 — File Upload — DONE (2026-08-09)
- [x] Phase 7 — Validation & Error Handling — DONE (2026-08-09)
- [x] Phase 8 — Testing — DONE (2026-08-09)
- [x] Phase 9 — Docs & Polish — DONE (2026-08-09)
- [x] Phase 10 — Integration Bug Fixes & Security/Validation Enhancements — DONE (2026-08-10)

### Frontend (COMPLETE)
- [x] Backend Verification — DONE (2026-08-11)
- [x] Phase 0 — Scaffolding — DONE (2026-08-11)
- [x] Phase 1 — Auth Foundation — DONE (2026-08-11)
- [x] Phase 2 — API Client & Shared UI — DONE (2026-08-11)
- [x] Phase 3 — Admin Module — DONE (2026-08-11)
- [x] Phase 4 — Teacher Module — DONE (2026-08-11)
- [x] Phase 5 — Student Module — DONE (2026-08-11)
- [x] Phase 6 — Landing Page — DONE (2026-08-11)
- [x] Phase 7 — Polish & Error States — DONE (2026-08-11)
- [x] Phase 8 — Testing — DONE (2026-08-11)
- [x] Phase 9 — Docs & Polish — DONE (2026-08-11)

---

## Backend Verification Findings (2026-08-11)

Cross-checked all backend DTOs and controllers against FE_IMPLEMENTATION_PLAN.md Section 0.

### ✅ Confirmed Matches

| Area | Verified |
|---|---|
| Auth routes | `POST /api/auth/login`, `POST /api/auth/register` ✅ |
| Users routes | `GET/POST /api/users`, `GET/PUT/DELETE /api/users/{id}` ✅ |
| Classes/Subjects | `GET/POST /api/classes`, `GET/PUT/DELETE /api/classes/{id}` ✅ (same for subjects) |
| Teacher-assignments | `GET/POST /api/teacher-assignments`, `GET /api/teacher-assignments/teacher/{teacherId}`, `DELETE /api/teacher-assignments/{id}` ✅ |
| Assignments | `GET/POST /api/assignments`, `GET/PUT/DELETE /api/assignments/{id}`, `PATCH /api/assignments/{id}/status` ✅ |
| Submissions | `GET/POST /api/submissions`, `GET /api/submissions/mine`, `GET /api/assignments/{assignmentId}/submissions`, `GET /api/submissions/{id}`, `PATCH /api/submissions/{id}/grade`, `PATCH /api/submissions/{id}/status`, `GET /api/submissions/{id}/history`, `GET /api/submissions/{id}/file` ✅ |
| Error shape | `{ statusCode, message, errors }` (camelCase) — `errors` is `null` when empty, not `[]` ✅ |
| 401 vs 403 | `InvalidCredentialsException` → 401, `UnauthorizedAccessException` → 403 ✅ |

### ⚠️ Discrepancies Found (FE Plan Updated)

1. **`AuthResponseDto` contains `Name` field** — The FE plan (Section 2.4) stated "JWT does not carry Name, only email/role/classId". In reality, `AuthResponseDto` includes `{ token, email, name, role, userId, classId, expiresAt }`. The login response itself carries `name`. However, note that the JWT claims still only contain `sub/email/role/classId` — the `name` is in the response body, not the token. So for server-decoded JWT, name still won't be available without the auth response. **Resolution:** Store `name` from the login response body alongside the cookie (e.g., in a separate non-httpOnly cookie or pass it down), so the navbar can show full name.
   - **File confirming:** `backend/AssignmentSystem.Api/DTOs/Auth/AuthResponseDto.cs` line 8

2. **`SubmissionDto.FilePath` is the relative download URL, not a physical path** — The DTO field is called `FilePath` but its value is mapped by `SubmissionService` to `/api/submissions/{id}/file` (a relative URL) when a file exists, or `null` when no file. The FE plan referred to it as "relative download URL". **Resolution:** In `types/api.ts`, name the field `filePath` and treat it as a nullable string that, when present, is a relative URL to hit for file download.
   - **File confirming:** `backend/AssignmentSystem.Api/Services/SubmissionService.cs` lines 255, 287

3. **`SubmissionHistoryDto.FilePath` follows same pattern** — `null` when no file, relative URL when file exists.
   - **File confirming:** `backend/AssignmentSystem.Api/Services/SubmissionService.cs` line 255

4. **`POST /api/submissions` returns `200 OK` not `201 Created`** — The controller returns `Ok(result)` not `CreatedAtAction(...)`. FE should not expect a 201 on submission create.
   - **File confirming:** `backend/AssignmentSystem.Api/Controllers/SubmissionsController.cs` line 70

5. **`POST /api/teacher-assignments` returns `200 OK` not `201 Created`** — Controller returns `Ok(item)` not `CreatedAtAction`.
   - **File confirming:** `backend/AssignmentSystem.Api/Controllers/TeacherAssignmentsController.cs` line 48

6. **`GET /api/assignments` is role-aware on the backend** — For Teacher callers, the backend already scopes to their own assignments. For Student callers, it already scopes to published assignments in their class. For Admin, it returns all. Frontend does NOT need to do client-side filtering by teacherId — just render the list as-is per role. However, local client-side search/sort still needed per plan.
   - **File confirming:** `backend/AssignmentSystem.Api/Controllers/AssignmentsController.cs` line 34

7. **`UserDto` includes `ClassName`** — The response DTO for users includes `{ id, name, email, role, classId, className, isActive, createdAt }`. The FE plan's types should include `className?: string | null`.
   - **File confirming:** `backend/AssignmentSystem.Api/DTOs/Users/UserDto.cs` line 10

8. **`ErrorResponse.Errors` is `null` when no errors, not empty array** — `Errors = errors.Count > 0 ? errors : null`. FE error handling must handle `errors` being null (not always an array).
   - **File confirming:** `backend/AssignmentSystem.Api/Middleware/ExceptionMiddleware.cs` line 89

---

## Last Session Summary (2026-08-11)
- Completed backend verification pass
- Found 8 discrepancies between FE plan assumptions and actual backend code
- Updated PROGRESS.md with findings
- Beginning Phase 0 (Scaffolding) of frontend

## Deviations From Plan
- FE plan assumed no `Name` in auth response; actual `AuthResponseDto` includes `name`. Resolution: use name from login response, store in readable cookie or context.
- FE plan said `SubmissionDto` returns relative download URL — correct, but the field is still called `filePath` in the DTO.

## Resolutions Applied

| Issue | Resolution |
|---|---|
| Name from auth response not available in JWT | ✅ On login, `name` from `AuthResponseDto` is stored in a separate non-httpOnly cookie (`user_info` as JSON `{name,email,role,userId,classId}`) alongside the httpOnly `auth_token`. Server layouts read `auth_token` for API calls; `user_info` is readable by JS so `CurrentUserProvider` can display the full name in the navbar. |
| `POST /api/submissions` must send multipart/form-data | ✅ The TanStack Query mutation in `useSubmissions.ts` builds a `FormData` object with `assignmentId` and `content` as form fields, and optionally appends the `file` as a Blob. No `Content-Type` header is set (browser auto-sets `multipart/form-data; boundary=...`). |

## Next.js 16 Breaking Changes (discovered from AGENTS.md)

| Change | Impact |
|---|---|
| `middleware.ts` deprecated → renamed to **`proxy.ts`** | Use `proxy.ts` at project root; export named `proxy` function (not `middleware` or default) |
| Proxy runtime is **Node.js** (not Edge) | `jose` JWT decode works fine; no edge-runtime restriction |
| `cookies()` is now **async** | All server code must `await cookies()` |

## How to Verify Current State
1. Run `docker compose up -d --build` from `/home/mahmudul-rabbi/OnnorokomProjokti/backend`.
2. Backend API at http://localhost:8080, Swagger at http://localhost:8080/swagger
3. Frontend: `cd frontend && npm run dev` → http://localhost:3000
