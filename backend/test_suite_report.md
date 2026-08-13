# Backend API Integration Test Suite Report

Run date: 2026-08-10  
API under test: `http://localhost:8080`  
Swagger/OpenAPI: `http://localhost:8080/swagger/v1/swagger.json` returned `200 OK`  
Docker status: `backend-api-1` up, `backend-postgres-1` up and healthy  
Test command: `dotnet test AssignmentSystem.slnx --no-restore --logger "trx;LogFileName=integration-results.trx"`

## Summary

- Total endpoints discovered: 36
- Total xUnit tests executed: 34
- Passed tests: 25
- Failed tests: 9
- Skipped xUnit tests: 0
- Result file: `AssignmentSystem.Tests/TestResults/integration-results.trx`
- Test data policy: all created records used a `qa-it-*` marker; PostgreSQL cleanup verification found 0 remaining `qa-it-*` users/classes/subjects/assignments after the run. Uploaded `qa-it-*` files were also removed from the API container volume.

## Endpoints Discovered

| Method | Path |
| --- | --- |
| GET | `/api/assignments` |
| POST | `/api/assignments` |
| GET | `/api/assignments/{id}` |
| PUT | `/api/assignments/{id}` |
| DELETE | `/api/assignments/{id}` |
| PATCH | `/api/assignments/{id}/status` |
| POST | `/api/auth/login` |
| POST | `/api/auth/register` |
| GET | `/api/classes` |
| POST | `/api/classes` |
| GET | `/api/classes/{id}` |
| PUT | `/api/classes/{id}` |
| DELETE | `/api/classes/{id}` |
| GET | `/api/subjects` |
| POST | `/api/subjects` |
| GET | `/api/subjects/{id}` |
| PUT | `/api/subjects/{id}` |
| DELETE | `/api/subjects/{id}` |
| GET | `/api/submissions` |
| POST | `/api/submissions` |
| GET | `/api/submissions/mine` |
| GET | `/api/assignments/{assignmentId}/submissions` |
| GET | `/api/submissions/{id}` |
| PATCH | `/api/submissions/{id}/grade` |
| PATCH | `/api/submissions/{id}/status` |
| GET | `/api/submissions/{id}/history` |
| GET | `/api/submissions/{id}/file` |
| GET | `/api/teacher-assignments` |
| POST | `/api/teacher-assignments` |
| GET | `/api/teacher-assignments/teacher/{teacherId}` |
| DELETE | `/api/teacher-assignments/{id}` |
| GET | `/api/users` |
| POST | `/api/users` |
| GET | `/api/users/{id}` |
| PUT | `/api/users/{id}` |
| DELETE | `/api/users/{id}` |

No pagination or filtering parameters are exposed in the OpenAPI spec or controllers, so pagination/filtering scenarios were documented as not applicable.

## Automated Suite Added

Created/updated only test artifacts:

- `AssignmentSystem.Tests/AssignmentSystem.Tests.csproj`: added direct `Npgsql` dependency for PostgreSQL verification.
- `AssignmentSystem.Tests/TestHelpers/ApiIntegrationFixture.cs`: shared HTTP client, auth, seed lookup, PostgreSQL checks, unique data generation, and cleanup.
- `AssignmentSystem.Tests/Integration/ApiContractTests.cs`
- `AssignmentSystem.Tests/Integration/AuthTests.cs`
- `AssignmentSystem.Tests/Integration/ClassSubjectUserTests.cs`
- `AssignmentSystem.Tests/Integration/TeacherAssignmentTests.cs`
- `AssignmentSystem.Tests/Integration/AssignmentTests.cs`
- `AssignmentSystem.Tests/Integration/SubmissionTests.cs`
- `AssignmentSystem.Tests/Integration/IntegrationTestCollection.cs`

Run next time with Docker available:

```bash
docker compose up -d
dotnet test AssignmentSystem.slnx
```

Optional overrides:

```bash
ASSIGNMENT_API_BASE_URL=http://localhost:8080 \
ASSIGNMENT_TEST_DB='Host=localhost;Port=5432;Database=<db-name>;Username=<db-user>;Password=<db-password>' \
dotnet test AssignmentSystem.slnx
```

## Coverage Performed

- Authentication: registration, login, invalid credentials, missing token, invalid token, expired token, authorized requests.
- Authorization: Admin/Teacher/Student role access across users, assignments, teacher assignments, and submissions.
- CRUD: users, classes, subjects, teacher assignments, assignments. Submissions have create/read/patch operations but no DELETE endpoint.
- Validation: required fields, invalid email/password/role paths, invalid GUID routes, invalid status values, invalid marks, bad assignment dates, malformed JSON.
- File upload: valid PDF upload/download, invalid extension, empty file, oversized file, missing optional file.
- Database: PostgreSQL persistence verified for create/update/delete or soft-delete transitions on users/classes/subjects/teacher assignments/assignments/submissions/history.
- Relationships: student class assignment visibility, teacher-subject-class requirement, submission ownership, grade ownership, duplicate teacher assignment composite rule.

## Failed Tests And Bugs

### 1. Invalid login returns 403 instead of 401

- Test: `AuthTests.Login_WithInvalidCredentials_ShouldReturn401`
- Expected: `401 Unauthorized`
- Actual: `403 Forbidden`
- Impact: clients cannot distinguish bad credentials from an authenticated-but-forbidden request.
- Responsible code:
  - `AssignmentSystem.Api/Services/AuthService.cs:27` throws `UnauthorizedAccessException`.
  - `AssignmentSystem.Api/Middleware/ExceptionMiddleware.cs:46` maps all `UnauthorizedAccessException` to `403`.
- Recommended fix: introduce a dedicated authentication exception or return `Unauthorized()` from `AuthController.Login`; keep authorization failures as `403`.

### 2. Deleted/inactive user login returns 403 instead of 401

- Test: `ClassSubjectUserTests.Users_FullCrudValidationAuthAndPersistence_ShouldBehaveCorrectly`
- Expected: `401 Unauthorized`
- Actual: `403 Forbidden`
- Responsible code:
  - `AssignmentSystem.Api/Services/AuthService.cs:24` correctly filters inactive users.
  - `AssignmentSystem.Api/Middleware/ExceptionMiddleware.cs:46` incorrectly maps the resulting login failure to `403`.
- Recommended fix: same as bug 1.

### 3. Registering a student with a nonexistent class returns 500

- Test: `AuthTests.Register_StudentWithNonexistentClass_ShouldReturnValidationErrorNotServerError`
- Expected: `400 BadRequest` or `404 NotFound`
- Actual: `500 InternalServerError`
- Responsible code:
  - `AssignmentSystem.Api/Services/AuthService.cs:46` validates that `ClassId` is present for students but does not validate that it exists and is active.
  - `AssignmentSystem.Api/Services/AuthService.cs:64` lets the PostgreSQL FK violation surface as an unhandled `DbUpdateException`.
- Recommended fix: mirror `UserService.CreateAsync` by checking `Classes.AnyAsync(c => c.Id == dto.ClassId && c.IsActive)` before saving.

### 4. Duplicate class names are accepted

- Test: `ClassSubjectUserTests.Classes_CreateDuplicateName_ShouldReturnConflictOrValidationError`
- Expected: `400 BadRequest` or `409 Conflict`
- Actual: `201 Created`
- Responsible code:
  - `AssignmentSystem.Api/Services/ClassService.cs:39` creates without checking existing active class names.
  - `AssignmentSystem.Api/Data/Configurations/ClassEntityConfiguration.cs` has no unique index on `Name`.
- Recommended fix: enforce uniqueness in service validation and with a database unique index, likely scoped to active records or normalized name.

### 5. Duplicate subject names are accepted

- Test: `ClassSubjectUserTests.Subjects_CreateDuplicateName_ShouldReturnConflictOrValidationError`
- Expected: `400 BadRequest` or `409 Conflict`
- Actual: `201 Created`
- Responsible code:
  - `AssignmentSystem.Api/Services/SubjectService.cs:39` creates without checking existing active subject names.
  - `AssignmentSystem.Api/Data/Configurations/SubjectConfiguration.cs` has no unique index on `Name`.
- Recommended fix: enforce uniqueness in service validation and with a database unique index, likely on normalized active subject name.

### 6. Deleted classes remain readable

- Test: `ClassSubjectUserTests.Classes_FullCrudValidationDuplicateAndPersistence_ShouldBehaveCorrectly`
- Expected after DELETE: `GET /api/classes/{id}` returns `404`
- Actual: `200 OK` with `isActive=false`
- Responsible code:
  - `AssignmentSystem.Api/Services/ClassService.cs:72` soft-deletes by setting `IsActive=false`.
  - `AssignmentSystem.Api/Services/ClassService.cs:27` and `ClassService.cs:18` do not filter inactive classes.
- Recommended fix: either treat delete as soft-delete and hide inactive records in public reads, or document/rename the behavior and add explicit active/inactive semantics.

### 7. Deleted subjects remain readable

- Test: `ClassSubjectUserTests.Subjects_FullCrudValidationDuplicateAndPersistence_ShouldBehaveCorrectly`
- Expected after DELETE: `GET /api/subjects/{id}` returns `404`
- Actual: `200 OK` with `isActive=false`
- Responsible code:
  - `AssignmentSystem.Api/Services/SubjectService.cs:72` soft-deletes by setting `IsActive=false`.
  - `AssignmentSystem.Api/Services/SubjectService.cs:27` and `SubjectService.cs:18` do not filter inactive subjects.
- Recommended fix: same pattern as classes.

### 8. Admin is authorized by attribute to create assignments but service forbids it

- Test: `AssignmentTests.Assignments_CreateValidationAuthorizationAndConflictCases_ShouldBehaveCorrectly`
- Expected: `201 Created`
- Actual: `403 Forbidden`
- Responsible code:
  - `AssignmentSystem.Api/Controllers/AssignmentsController.cs:47` allows `Teacher,Admin`.
  - `AssignmentSystem.Api/Controllers/AssignmentsController.cs:50` passes the admin user id into `CreateAsync`.
  - `AssignmentSystem.Api/Services/AssignmentService.cs:87` treats the caller as the teacher and requires a `TeacherSubjectClass` row.
- Recommended fix: clarify the rule. If admins can create assignments, DTO/service must accept a teacher id or choose an owner. If admins cannot create, remove `Admin` from the POST authorization attribute and Swagger summary.

### 9. Empty uploaded file is silently accepted

- Test: `SubmissionTests.Submissions_EmptyUploadedFile_ShouldReturnBadRequest`
- Expected: `400 BadRequest`
- Actual: `200 OK`
- Responsible code:
  - `AssignmentSystem.Api/Services/SubmissionService.cs:108` only calls file validation when `file.Length > 0`.
  - `AssignmentSystem.Api/Services/FileStorageService.cs:19` has correct empty-file validation, but it is bypassed.
- Recommended fix: if `file != null`, always call `_fileStorage.SaveAsync`; let `FileStorageService` reject zero-byte uploads.

## HTTP Status Code Problems

- Invalid credentials and inactive-user login use `403` instead of `401`.
- Foreign-key registration failure leaks as `500`.
- Duplicate classes/subjects return `201` instead of a client error.
- Soft-deleted classes/subjects return `200` on GET after DELETE.
- Empty file upload returns `200` instead of `400`.

## CRUD Problems

- Class and subject DELETE is a soft-delete, but read endpoints still expose inactive records.
- Class and subject CREATE allow duplicates.
- Assignment CREATE has inconsistent Admin semantics between controller authorization and service business rules.
- Submission has no DELETE endpoint, so upload/delete lifecycle cannot be fully tested through the public API.

## Authentication And Authorization Problems

- Authentication failures are conflated with authorization failures by exception mapping.
- Role checks for protected endpoints otherwise behaved as expected for missing token, invalid token, expired token, and wrong role.
- Teacher isolation for teacher assignments, assignment visibility, and submission grading passed.

## Database Problems

- `AuthService.RegisterAsync` does not validate student `ClassId` before insert, causing a PostgreSQL FK exception and `500`.
- Missing unique indexes on class and subject names allow duplicate catalog rows.
- DB persistence for successful create/update/delete/soft-delete operations was verified with direct PostgreSQL queries.

## Validation Problems

- Registration does not validate referenced class existence.
- Empty uploaded files bypass file validation.
- Duplicate class/subject validation is missing.
- Update DTOs for class/subject have no validators; empty-name update currently leaves the existing value unchanged rather than returning a validation error.

## Security Concerns

- Incorrect `403` for bad credentials can complicate client auth flows and monitoring.
- Raw database errors appear in `500` responses for FK violations via the default exception path.
- Submission DTO responses expose server-side `FilePath`; this leaks internal container paths. Consider returning a download URL or attachment metadata instead.
- Uploaded files are accepted based on extension only; content-type or file signature validation is not enforced.

## Skipped Or Not Applicable Scenarios

- Pagination/filtering: skipped because no endpoint exposes query parameters or implementation support.
- Submission DELETE and file DELETE: skipped because no public endpoint exists.
- File download for deleted submission: skipped because submissions have no DELETE endpoint.

## Conclusion

The API is not fully working yet. The suite demonstrates many successful core flows, including seeded login, role-gated reads, teacher assignment lifecycle, assignment lifecycle, submission upload/edit/history/grade, expired-token rejection, and PostgreSQL persistence. It also exposes 9 concrete failures that should remain red in `dotnet test` until the backend behavior is corrected.
