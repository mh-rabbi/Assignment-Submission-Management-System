# PROGRESS.md — Assignment Submission Management System Backend

## Phase Status
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

## Last Session Summary (2026-08-10)
Resolved all 9 failing integration tests from `test_suite_report.md` and applied security/validation improvements.

### Bugs Fixed:
1. **Invalid login (403 → 401)**: Created `InvalidCredentialsException`, thrown by `AuthService.LoginAsync` for invalid credentials and mapped to HTTP 401 Unauthorized in `ExceptionMiddleware`. `UnauthorizedAccessException` remains mapped to 403.
2. **Inactive user login (403 → 401)**: `AuthService.LoginAsync` uses the same `InvalidCredentialsException` → 401 flow when user is inactive or non-existent.
3. **Register student with nonexistent ClassId (500 → 400)**: `AuthService.RegisterAsync` validates `Classes.AnyAsync(c => c.Id == dto.ClassId.Value && c.IsActive)` for student registrations, throwing `ArgumentException` (400 BadRequest) if invalid or inactive.
4. **Duplicate Class names accepted (201 → 409)**: Added a unique index on `ClassEntity.Name` for `IsActive = true` in `ClassEntityConfiguration`. In `ClassService`, validated case-insensitive duplicates prior to insert/update, throwing `ConflictException` (409 Conflict), and caught `DbUpdateException` fallback.
5. **Duplicate Subject names accepted (201 → 409)**: Added a unique index on `Subject.Name` for `IsActive = true` in `SubjectConfiguration`. In `SubjectService`, validated case-insensitive duplicates prior to insert/update, throwing `ConflictException` (409 Conflict), and caught `DbUpdateException` fallback.
6. **Soft-deleted Classes hidden from GET (200 → 404)**: Filtered `IsActive == true` in `ClassService.GetAllAsync` and `GetByIdAsync`. Requests for soft-deleted classes return HTTP 404 NotFound.
7. **Soft-deleted Subjects hidden from GET (200 → 404)**: Filtered `IsActive == true` in `SubjectService.GetAllAsync` and `GetByIdAsync`. Requests for soft-deleted subjects return HTTP 404 NotFound.
8. **Admin creates assignment on behalf of teacher (403 → 201)**: Added optional `TeacherId` to `CreateAssignmentDto`. In `AssignmentsController.Create`, if caller is Teacher, caller's ID is used; if caller is Admin, `TeacherId` is required (400 if missing) and validated to belong to an active Teacher. `AssignmentService.CreateAsync` checks `(TeacherId, SubjectId, ClassId)` in `TeacherSubjectClass`. Updated Swagger XML docs on DTO and controller.
9. **Empty file upload rejected (200 → 400)**: Removed `file.Length > 0` check in `SubmissionService`, allowing `FileStorageService.SaveAsync` to execute and reject zero-byte files with HTTP 400 BadRequest.

### Additional Security & Validation Improvements:
- **Relative Download URLs**: `SubmissionDto` and `SubmissionHistoryDto` return relative download URL `/api/submissions/{id}/file` instead of physical server file paths.
- **Update DTO Validation**: Added `UpdateClassDtoValidator` and `UpdateSubjectDtoValidator` in `ClassSubjectValidators.cs` to return HTTP 400 BadRequest on empty update names.

### Key Architectural Design Decisions Applied:
- **#8**: Admin can create assignments for any teacher via explicit `TeacherId` in `CreateAssignmentDto`.
- **#6/#7**: Soft-deleted Classes/Subjects are hidden from all GET endpoints by default (`IsActive == true` filter).

### Files Changed:
- `backend/AssignmentSystem.Api/Common/Exceptions/InvalidCredentialsException.cs` (NEW)
- `backend/AssignmentSystem.Api/Common/Exceptions/ConflictException.cs` (NEW)
- `backend/AssignmentSystem.Api/Middleware/ExceptionMiddleware.cs`
- `backend/AssignmentSystem.Api/Services/AuthService.cs`
- `backend/AssignmentSystem.Api/Data/Configurations/ClassEntityConfiguration.cs`
- `backend/AssignmentSystem.Api/Data/Configurations/SubjectConfiguration.cs`
- `backend/AssignmentSystem.Api/Services/ClassService.cs`
- `backend/AssignmentSystem.Api/Services/SubjectService.cs`
- `backend/AssignmentSystem.Api/Validators/ClassSubjectValidators.cs`
- `backend/AssignmentSystem.Api/DTOs/Assignments/AssignmentDtos.cs`
- `backend/AssignmentSystem.Api/Controllers/AssignmentsController.cs`
- `backend/AssignmentSystem.Api/Services/AssignmentService.cs`
- `backend/AssignmentSystem.Api/Services/SubmissionService.cs`
- `backend/AssignmentSystem.Api/Program.cs`
- `backend/AssignmentSystem.Tests/Integration/AssignmentTests.cs`
- `backend/AssignmentSystem.Tests/Integration/SubmissionTests.cs`
- `backend/AssignmentSystem.Tests/Services/AuthServiceTests.cs`
- `/.context/PROGRESS.md`

## How to Verify Current State
1. Run `docker compose up -d --build` from `/home/mahmudul-rabbi/OnnorokomProjokti/backend`.
2. Run `dotnet test AssignmentSystem.slnx` from `/home/mahmudul-rabbi/OnnorokomProjokti/backend` to run the full test suite (34/34 passing).
