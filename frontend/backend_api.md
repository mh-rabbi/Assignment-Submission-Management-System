# Backend API Reference
## Role-based Assignment & Submission Management System

**Base URL (local/dev):** `http://localhost:8080`
**Swagger:** `http://localhost:8080/swagger`
**Auth:** JWT Bearer token (`Authorization: Bearer <token>`)
**Content-Type:** `application/json` unless noted (submission create/update is `multipart/form-data`)

This doc is generated from the actual backend source (controllers, services, DTOs) and the post-bugfix behavior (Phase 10 fixes applied — see Known Behaviors section). It reflects real responses, not just the plan.

---

## 1. Auth & Roles

Three roles: `Admin`, `Teacher`, `Student` — single role per user, carried as JWT claims.

**JWT claims:**
| Claim | Notes |
|---|---|
| `sub` | User ID (Guid) |
| `email` | |
| `role` (via `ClaimTypes.Role`) | `Admin` \| `Teacher` \| `Student` |
| `classId` | Only present if `Role == Student` |

There is **no `/me` endpoint**. Decode the JWT client-side/server-side to get current-user info (email, role, classId). The JWT does **not** contain `Name` — only email is available without a separate `/api/users/{id}` call.

**Demo credentials:**
| Role | Email | Password |
|---|---|---|
| Admin | `admin@school.test` | `Admin@123` |
| Teacher 1 (Math+Physics, Grade 10) | `teacher1@school.test` | `Teacher@123` |
| Teacher 2 (English Grade 10, Math Grade 11) | `teacher2@school.test` | `Teacher@123` |
| Student 1 (Grade 10) | `student1@school.test` | `Student@123` |
| Student 2 (Grade 10) | `student2@school.test` | `Student@123` |
| Student 3 (Grade 11) | `student3@school.test` | `Student@123` |

---

## 2. Standard Error Shape

Every non-2xx response has this shape (from `ExceptionMiddleware`):

```json
{
  "statusCode": 400,
  "message": "Human readable message",
  "errors": ["optional array of field-level messages"] 
}
```
`errors` is `null` when there's just one message.

**Status code meaning (important — confirm exact mapping):**
| Code | Meaning | Example |
|---|---|---|
| 400 | Validation / business-rule violation | bad marks, past deadline, closed assignment |
| 401 | Not authenticated / bad credentials / missing-invalid-expired token | wrong password, no token |
| 403 | Authenticated but not authorized | Teacher viewing another Teacher's assignment |
| 404 | Not found (incl. soft-deleted Class/Subject, invalid GUID route) | `GET /api/classes/{deletedId}` |
| 409 | Conflict | duplicate Class/Subject name |
| 500 | Unhandled server error (should be rare post-fixes) | |

**Login specifically returns 401** for bad credentials AND for inactive/nonexistent users (not 403) — dedicated `InvalidCredentialsException`.

---

## 3. Auth Endpoints

### `POST /api/auth/login`
No auth required.

**Request:**
```json
{ "email": "admin@school.test", "password": "Admin@123" }
```

**Response `200 OK`:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "email": "admin@school.test",
  "name": "System Admin",
  "role": "Admin",
  "userId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "classId": null,
  "expiresAt": "2026-08-12T15:30:00Z"
}
```
`classId` is only non-null for Student logins.

**Errors:** `401` invalid credentials or inactive/nonexistent user.

---

### `POST /api/auth/register`
No auth required (primarily for testing — Admin-created users via `/api/users` is the main flow).

**Request:**
```json
{
  "name": "New Student",
  "email": "new.student@school.test",
  "password": "Password123",
  "role": "Student",
  "classId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```
- `role`: `Admin` | `Teacher` | `Student`
- `classId`: **required** if `role == Student`, must be `null`/omitted otherwise (400 if provided for non-Student). Must reference an existing **active** Class or you get `400`.

**Response `201 Created`:** same shape as login response (`AuthResponseDto`).

**Errors:**
- `400` — duplicate email, missing/invalid ClassId for Student, ClassId set for non-Student, invalid role, weak password (<6 chars).

---

## 4. Users (Admin-only, `/api/users`)

All endpoints require `Authorize(Roles = "Admin")`.

### `GET /api/users`
**Response `200 OK`:**
```json
[
  {
    "id": "3fa85f64-...",
    "name": "Student One",
    "email": "student1@school.test",
    "role": "Student",
    "classId": "aaaa1111-...",
    "className": "Grade 10",
    "isActive": true,
    "createdAt": "2026-08-09T10:00:00Z"
  }
]
```
Returns ALL users including inactive ones (no `IsActive` filter on this list — unlike Classes/Subjects).

### `GET /api/users/{id}`
Same object shape as above. `404` if not found.

### `POST /api/users`
**Request:**
```json
{
  "name": "New Teacher",
  "email": "new.teacher@school.test",
  "password": "Password123",
  "role": "Teacher",
  "classId": null
}
```
**Response `201 Created`:** `UserDto` (see above shape).
**Errors:** `400` duplicate email / bad role / ClassId misuse / referenced Class not found or inactive.

### `PUT /api/users/{id}`
**Request (all fields optional, partial update):**
```json
{ "name": "Updated Name", "email": "updated@school.test", "password": "NewPass123", "classId": null }
```
**Response `200 OK`:** `UserDto`.
**Errors:** `404` not found, `400` email in use / ClassId invalid for role.

### `DELETE /api/users/{id}`
Soft delete (`IsActive = false`). **Response `204 No Content`.** `404` if not found.
Note: unlike Classes/Subjects, soft-deleted Users are still visible via `GET /api/users` and `GET /api/users/{id}` with `isActive: false` — only login is blocked (401).

---

## 5. Classes (`/api/classes`)

GET requires any authenticated role; POST/PUT/DELETE require Admin.

### `GET /api/classes`
**Response `200 OK`:** only `IsActive == true` records.
```json
[
  { "id": "aaaa1111-...", "name": "Grade 10", "isActive": true, "createdAt": "2026-08-09T10:00:00Z" }
]
```

### `GET /api/classes/{id}`
Same shape. **`404`** if the class is soft-deleted, doesn't exist, or the id is not a valid GUID.

### `POST /api/classes` (Admin)
```json
{ "name": "Grade 12" }
```
**Response `201 Created`:** `ClassDto`.
**Errors:** `400` empty name; **`409`** if an active class with that name already exists (case-insensitive).

### `PUT /api/classes/{id}` (Admin)
```json
{ "name": "Grade 12 - Updated" }
```
**Response `200 OK`:** `ClassDto`. `404` if not found/inactive. `409` on duplicate name.

### `DELETE /api/classes/{id}` (Admin)
Soft delete. **`204 No Content`.** After this, `GET /api/classes/{id}` returns `404`, and it disappears from `GET /api/classes` list.

---

## 6. Subjects (`/api/subjects`)

Identical shape/behavior to Classes.

- `GET /api/subjects` → `[{ "id", "name", "isActive", "createdAt" }]` (active only)
- `GET /api/subjects/{id}` → `404` if inactive/missing
- `POST /api/subjects` (Admin) → `{ "name": "Chemistry" }` → `201`, `409` on duplicate
- `PUT /api/subjects/{id}` (Admin) → `200`
- `DELETE /api/subjects/{id}` (Admin) → `204`, then hidden from GETs

---

## 7. Teacher-Subject-Class Assignments (`/api/teacher-assignments`)

This is the **only** place Teacher↔Subject↔Class relationships exist. A Teacher must have a row here before they can create an Assignment for that (Subject, Class) pair.

### `GET /api/teacher-assignments` (Admin only)
**Response `200 OK`:**
```json
[
  {
    "id": "tsc-guid",
    "teacherId": "teacher-guid",
    "teacherName": "Teacher One",
    "subjectId": "subject-guid",
    "subjectName": "Mathematics",
    "classId": "class-guid",
    "className": "Grade 10",
    "createdAt": "2026-08-09T10:00:00Z"
  }
]
```

### `GET /api/teacher-assignments/teacher/{teacherId}` (Admin, or the Teacher themself)
Same array shape, filtered to that teacher. **`403`** if a Teacher requests another teacher's id.

### `POST /api/teacher-assignments` (Admin)
```json
{ "teacherId": "teacher-guid", "subjectId": "subject-guid", "classId": "class-guid" }
```
**Response `200 OK`** (note: `200`, not `201`): single `TeacherAssignmentDto` object (shape above).
**Errors:** `400` — teacher not found/not active, user is not a Teacher role, subject/class not found/inactive, or duplicate `(TeacherId, SubjectId, ClassId)` combo.

### `DELETE /api/teacher-assignments/{id}` (Admin)
**`204 No Content`.** `404` if not found.

---

## 8. Assignments (`/api/assignments`)

Visibility differs by role — same endpoint, filtered server-side.

### `GET /api/assignments`
- **Admin:** all assignments.
- **Teacher:** only their own (`TeacherId == caller`), any status.
- **Student:** only `Status == Published` AND `ClassId == student.classId`.

**Response `200 OK`:**
```json
[
  {
    "id": "assignment-guid",
    "title": "Algebra Homework 1",
    "description": "Solve chapters 1-3",
    "subjectId": "subject-guid",
    "subjectName": "Mathematics",
    "classId": "class-guid",
    "className": "Grade 10",
    "teacherId": "teacher-guid",
    "teacherName": "Teacher One",
    "deadline": "2026-08-20T23:59:00Z",
    "maxMarks": 100,
    "status": "Draft",
    "allowLateSubmission": false,
    "createdAt": "2026-08-09T10:00:00Z",
    "updatedAt": "2026-08-09T10:00:00Z"
  }
]
```
`status` is one of `Draft` | `Published` | `Closed`.

### `GET /api/assignments/{id}`
Same object shape. **`403`** if a Student requests one outside their class or not-yet-published, or a Teacher requests another teacher's assignment. `404` if it doesn't exist.

### `POST /api/assignments` (Teacher or Admin)
**Request:**
```json
{
  "title": "Algebra Homework 1",
  "description": "Solve chapters 1-3",
  "subjectId": "subject-guid",
  "classId": "class-guid",
  "teacherId": null,
  "deadline": "2026-08-20T23:59:00Z",
  "maxMarks": 100,
  "allowLateSubmission": false
}
```
- If caller is **Teacher**: `teacherId` in body is ignored — caller's own id is used.
- If caller is **Admin**: `teacherId` is **required** (400 if missing) and must be an active user with `Role == Teacher`.
- Resolved `(teacherId, subjectId, classId)` must exist in `TeacherSubjectClass`, else **`403`**.
- `deadline` must be in the future (400 if past). `maxMarks` must be > 0.
- New assignment always starts at `Status = "Draft"`.

**Response `201 Created`:** `AssignmentDto` (shape above).

### `PUT /api/assignments/{id}` (owning Teacher or Admin)
Partial update — all fields optional:
```json
{ "title": "Updated Title", "maxMarks": 80, "deadline": "2026-08-25T23:59:00Z", "allowLateSubmission": true }
```
**Response `200 OK`:** `AssignmentDto`. `403` if not owner/admin. `400` if `maxMarks <= 0`.

### `PATCH /api/assignments/{id}/status` (owning Teacher or Admin)
```json
{ "status": "Published" }
```
Valid values: `Draft`, `Published`, `Closed`. **Response `200 OK`:** `AssignmentDto`. `400` on invalid status string.

### `DELETE /api/assignments/{id}` (owning Teacher or Admin)
**`204 No Content`.** Hard delete. `403` if not owner/admin.

---

## 9. Submissions

Routes are split across `/api/submissions` and `/api/assignments/{assignmentId}/submissions`.

### Submission object shape (`SubmissionDto`)
```json
{
  "id": "submission-guid",
  "assignmentId": "assignment-guid",
  "assignmentTitle": "Algebra Homework 1",
  "studentId": "student-guid",
  "studentName": "Student One",
  "content": "My answer text...",
  "filePath": "/api/submissions/{id}/file",
  "submittedAt": "2026-08-12T10:00:00Z",
  "isLate": false,
  "status": "Submitted",
  "marks": null,
  "feedback": null,
  "createdAt": "2026-08-12T10:00:00Z",
  "updatedAt": "2026-08-12T10:00:00Z"
}
```
- `filePath` is a **relative download URL** (`/api/submissions/{id}/file`), never a raw server path. `null` if no file attached.
- `status`: `Submitted` | `Graded`.
- `marks`/`feedback` are `null` until graded.

### `POST /api/submissions` (Student only) — **multipart/form-data**
Acts as create-or-update (upsert) keyed on `(AssignmentId, StudentId)`.

**Form fields:**
| Field | Type | Required |
|---|---|---|
| `AssignmentId` | Guid (string) | yes |
| `Content` | string | yes, unless `file` is present |
| `file` | binary | optional |

**Example (curl-style):**
```
POST /api/submissions
Content-Type: multipart/form-data
AssignmentId: assignment-guid
Content: "My answer"
file: answer.pdf
```

**Response `200 OK`:** `SubmissionDto` (note: `200`, not `201`, even on first create).

**Business rules enforced server-side:**
- Only Students may submit; must belong to the assignment's `ClassId`.
- Assignment must be `Published` (403 if `Draft`).
- If `Assignment.Status == Closed` → `400` regardless of deadline.
- If `now > Deadline` and `AllowLateSubmission == false` → `400`.
- If late but allowed → accepted, `isLate: true`.
- On edit (submission already exists): previous state is snapshotted to history, `SubmittedAt`/`IsLate` recomputed, old file deleted if replaced.
- File: allowed extensions `.pdf .docx .doc .zip .png .jpg .jpeg`, max 10MB, **validated even at 0 bytes** (empty file → `400`).

**Errors:** `400` missing content+file, closed assignment, past deadline, bad file; `403` wrong class / non-student caller / not-yet-published assignment.

### `GET /api/submissions/mine` (Student only)
**Response `200 OK`:** array of `SubmissionDto` — all of the caller's own submissions.

### `GET /api/assignments/{assignmentId}/submissions` (Teacher owning it, or Admin; Student sees only their own within it)
**Response `200 OK`:** array of `SubmissionDto`. `403` if Teacher doesn't own the assignment. `404` if assignment doesn't exist.

### `GET /api/submissions/{id}` (owning Student, owning Teacher, or Admin)
**Response `200 OK`:** single `SubmissionDto`. `403`/`404` otherwise.

### `GET /api/submissions` (Admin only)
**Response `200 OK`:** array of every `SubmissionDto` in the system (oversight view).

### `PATCH /api/submissions/{id}/grade` (owning Teacher or Admin)
```json
{ "marks": 85, "feedback": "Great work!" }
```
**Response `200 OK`:** `SubmissionDto` with `status: "Graded"`.
**Errors:** `400` if `marks < 0` or `marks > Assignment.MaxMarks`; `403` if caller isn't the owning teacher/admin; `404` if submission not found.

### `PATCH /api/submissions/{id}/status` (owning Teacher or Admin)
```json
{ "status": "Submitted" }
```
Valid values: `Submitted`, `Graded` (manual override). **Response `200 OK`:** `SubmissionDto`.

### `GET /api/submissions/{id}/history` (owning Student, owning Teacher, or Admin)
**Response `200 OK`:**
```json
[
  {
    "id": "history-row-guid",
    "content": "Previous answer text",
    "filePath": "/api/submissions/{submissionId}/file",
    "editedAt": "2026-08-11T09:00:00Z"
  }
]
```
Ordered newest-first. One row is added every time a submission is edited (snapshot of the *previous* state).

### `GET /api/submissions/{id}/file` (owning Student, owning Teacher, or Admin)
Returns the raw file as `application/octet-stream` with `Content-Disposition: attachment; filename=...`. **`404`** if no file was attached or the file is missing on disk.

---

## 10. Business Rules Cheat-Sheet (for frontend validation mirroring)

| Rule | Enforcement |
|---|---|
| Student `ClassId` only settable for Role=Student | 400 otherwise |
| Assignment `(Teacher, Subject, Class)` must exist in TeacherSubjectClass | 403 on create |
| Student sees only `Published` assignments in their own class | filtered server-side; 403 on direct GET of others |
| Late submission without `AllowLateSubmission` | 400 |
| `Assignment.Status == Closed` blocks submissions always | 400 |
| Every submission edit snapshots previous state | `SubmissionHistory` row |
| Grading restricted to owning Teacher or Admin | 403 |
| Soft-deleted Class/Subject → `404` on GET (not `200` with `isActive:false`) | Users behave differently — see §4 |
| Duplicate Class/Subject name (case-insensitive, active only) | 409 |
| Marks must be `0 <= marks <= Assignment.MaxMarks` | 400 |
| Empty (0-byte) file upload still validated | 400 |
| No pagination/filtering on any list endpoint | frontend must do client-side search/sort/paginate |

---

## 11. Notes for Frontend Implementation

1. **No `/me` endpoint** — decode JWT for `sub`/`email`/`role`/`classId`. Full `Name` requires a separate `GET /api/users/{id}` call (Admin-only) or is otherwise unavailable for non-admin callers about themselves.
2. **Content negotiation for submissions**: `POST /api/submissions` must be sent as `multipart/form-data`, not JSON, even when no file is attached (the endpoint does accept `application/json` per `[Consumes]` but form fields are simplest/most consistent — use multipart always).
3. **Status codes to design UI states around:** 400 (inline field/form errors), 401 (force logout → `/login`), 403 (inline "not authorized", no redirect), 404 (not-found state — relevant for soft-deleted Classes/Subjects), 409 (inline conflict on Class/Subject/TeacherAssignment forms).
4. **Creation status codes are inconsistent by design** — most `POST` returns `201 Created`, but `POST /api/teacher-assignments` and `POST /api/submissions` return `200 OK`. Don't hardcode `201` checks generically.
5. **`GET /api/users` and `GET /api/users/{id}` do not filter out inactive users** (unlike Classes/Subjects) — the frontend Admin Users list should show an active/inactive badge rather than expecting them to disappear.
6. **No DELETE endpoint for submissions** — submissions can only be created/edited (upsert) or status/grade-patched.
