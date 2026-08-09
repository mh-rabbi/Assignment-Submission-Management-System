# IMPLEMENTATION_PLAN.md
## Role-based Assignment & Submission Management System — Backend

**Stack:** ASP.NET Core 10 Web API (C#) + PostgreSQL 16 + EF Core 10 + JWT Auth + Docker
**Target consumer:** AI coding agent (Google Antigravity). Follow phases sequentially. Each phase must build and run before moving to the next. Do not skip ahead.

---

## 0. Project Overview

Build the backend for a role-based Assignment & Submission Management System for a school/college.

**Roles:** Admin, Teacher, Student (single role per user, stored as enum on `Users`).

**Core flow:** Admin manages Users/Classes/Subjects and assigns Teachers to (Subject, Class) pairs. Teachers create Assignments for a (Subject, Class) they're assigned to, publish them, and grade Student Submissions. Students submit work (text + optional file) before a deadline, can edit until the deadline (edit history is kept), and view their grades/feedback.

---

## 1. Finalized Database Schema

> Design note: `Subject` is a standalone catalog entity — it does NOT have a direct `ClassId`. The only place a Teacher↔Subject↔Class relationship is defined is `TeacherSubjectClass`. This avoids a data-integrity conflict where `Subject.ClassId` and `TeacherSubjectClass.ClassId` could disagree. `Assignment` stores `SubjectId + ClassId + TeacherId` directly, but the service layer MUST validate that combination exists in `TeacherSubjectClass` before allowing creation.

### Entities

**Users**
| Column | Type | Notes |
|---|---|---|
| Id | Guid (PK) | |
| Name | varchar(150) | |
| Email | varchar(255) | **UNIQUE** |
| PasswordHash | varchar | BCrypt hash |
| Role | enum (Admin, Teacher, Student) | |
| ClassId | Guid? (FK → Classes) | **Nullable.** Only set when Role = Student. Enforce in app layer, not DB. |
| IsActive | bool | soft delete |
| CreatedAt / UpdatedAt | timestamptz | |

**Classes**
| Column | Type | Notes |
|---|---|---|
| Id | Guid (PK) | |
| Name | varchar(100) | e.g. "Grade 10" |
| IsActive | bool | soft delete |
| CreatedAt / UpdatedAt | timestamptz | |

**Subjects** *(standalone — no ClassId)*
| Column | Type | Notes |
|---|---|---|
| Id | Guid (PK) | |
| Name | varchar(100) | e.g. "Mathematics" |
| IsActive | bool | soft delete |
| CreatedAt / UpdatedAt | timestamptz | |

**TeacherSubjectClass** *(single source of truth for teaching assignments)*
| Column | Type | Notes |
|---|---|---|
| Id | Guid (PK) | |
| TeacherId | Guid (FK → Users) | Restrict delete |
| SubjectId | Guid (FK → Subjects) | Restrict delete |
| ClassId | Guid (FK → Classes) | Restrict delete |
| CreatedAt | timestamptz | |

**Constraint:** `UNIQUE (TeacherId, SubjectId, ClassId)`

**Assignments**
| Column | Type | Notes |
|---|---|---|
| Id | Guid (PK) | |
| Title | varchar(200) | |
| Description | text | |
| SubjectId | Guid (FK → Subjects) | Restrict |
| ClassId | Guid (FK → Classes) | Restrict |
| TeacherId | Guid (FK → Users) | Restrict. Must match an existing `TeacherSubjectClass(TeacherId, SubjectId, ClassId)` row — enforced in service layer |
| Deadline | timestamptz | |
| MaxMarks | int | |
| Status | enum (Draft, Published, Closed) | default Draft |
| AllowLateSubmission | bool | default false |
| CreatedAt / UpdatedAt | timestamptz | |

**Submissions**
| Column | Type | Notes |
|---|---|---|
| Id | Guid (PK) | |
| AssignmentId | Guid (FK → Assignments) | Restrict |
| StudentId | Guid (FK → Users) | Restrict |
| Content | text | |
| FilePath | varchar? | nullable, local disk path |
| SubmittedAt | timestamptz | updated on every edit |
| IsLate | bool | computed: `SubmittedAt > Assignment.Deadline` |
| Status | enum (Submitted, Graded) | |
| Marks | int? | nullable until graded |
| Feedback | text? | nullable until graded |
| CreatedAt / UpdatedAt | timestamptz | |

**Constraint:** `UNIQUE (AssignmentId, StudentId)` — one current submission row per student per assignment.

**SubmissionHistory**
| Column | Type | Notes |
|---|---|---|
| Id | Guid (PK) | |
| SubmissionId | Guid (FK → Submissions) | Cascade delete (history dies with submission) |
| Content | text | snapshot |
| FilePath | varchar? | snapshot |
| EditedAt | timestamptz | |

### Business Rules (enforced in Service layer, not DB)
1. Only `Role = Student` may have non-null `ClassId`.
2. Assignment creation: `(TeacherId, SubjectId, ClassId)` must exist in `TeacherSubjectClass`, otherwise 403.
3. Students can only view/submit to Assignments where `Assignment.ClassId == Student.ClassId` AND `Status == Published`.
4. On submission create/update: if `now > Deadline`:
   - If `Assignment.AllowLateSubmission == false` → reject (400).
   - If `true` → accept, set `IsLate = true`.
5. On submission create/update: if `Assignment.Status == Closed` → always reject regardless of deadline.
6. Every submission edit: snapshot the **previous** state into `SubmissionHistory` before overwriting `Submission`.
7. Grading (`Marks`/`Feedback`) settable only by the Teacher who owns the Assignment (or Admin). Sets `Status = Graded`.
8. `NotSubmitted` is never stored — it's the absence of a `Submission` row for a given (Assignment, Student).

---

## 2. Project Structure (single-project, 3-layer)

```
AssignmentSystem/
├── AssignmentSystem.sln
├── docker-compose.yml
├── docker-compose.override.yml
├── .env.example
├── README.md
├── AssignmentSystem.Api/
│   ├── Controllers/
│   │   ├── AuthController.cs
│   │   ├── UsersController.cs
│   │   ├── ClassesController.cs
│   │   ├── SubjectsController.cs
│   │   ├── TeacherAssignmentsController.cs   (TeacherSubjectClass mgmt)
│   │   ├── AssignmentsController.cs
│   │   └── SubmissionsController.cs
│   ├── Services/
│   │   ├── Interfaces/
│   │   │   ├── IAuthService.cs
│   │   │   ├── IUserService.cs
│   │   │   ├── IClassService.cs
│   │   │   ├── ISubjectService.cs
│   │   │   ├── ITeacherAssignmentService.cs
│   │   │   ├── IAssignmentService.cs
│   │   │   ├── ISubmissionService.cs
│   │   │   └── IFileStorageService.cs
│   │   ├── AuthService.cs
│   │   ├── UserService.cs
│   │   ├── ClassService.cs
│   │   ├── SubjectService.cs
│   │   ├── TeacherAssignmentService.cs
│   │   ├── AssignmentService.cs
│   │   ├── SubmissionService.cs
│   │   └── FileStorageService.cs
│   ├── Data/
│   │   ├── AppDbContext.cs
│   │   ├── Entities/
│   │   │   ├── User.cs
│   │   │   ├── ClassEntity.cs
│   │   │   ├── Subject.cs
│   │   │   ├── TeacherSubjectClass.cs
│   │   │   ├── Assignment.cs
│   │   │   ├── Submission.cs
│   │   │   └── SubmissionHistory.cs
│   │   ├── Configurations/            (IEntityTypeConfiguration<T> per entity)
│   │   ├── Migrations/                (auto-generated)
│   │   └── Seed/
│   │       └── DataSeeder.cs
│   ├── DTOs/
│   │   ├── Auth/ (LoginDto, RegisterDto, AuthResponseDto)
│   │   ├── Users/
│   │   ├── Classes/
│   │   ├── Subjects/
│   │   ├── Assignments/
│   │   └── Submissions/
│   ├── Middleware/
│   │   └── ExceptionMiddleware.cs
│   ├── Common/
│   │   ├── Enums/ (Role.cs, AssignmentStatus.cs, SubmissionStatus.cs)
│   │   ├── Constants/
│   │   └── Helpers/JwtHelper.cs
│   ├── Validators/                    (FluentValidation, one per DTO)
│   ├── wwwroot/uploads/                (gitignored, local file storage)
│   ├── Program.cs
│   ├── appsettings.json
│   ├── appsettings.Development.json
│   ├── Dockerfile
│   ├── .dockerignore
│   └── AssignmentSystem.Api.csproj
└── AssignmentSystem.Tests/
    ├── Services/
    │   ├── SubmissionServiceTests.cs
    │   ├── AssignmentServiceTests.cs
    │   └── AuthServiceTests.cs
    ├── Controllers/
    │   └── SubmissionsControllerTests.cs
    └── AssignmentSystem.Tests.csproj
```

### NestJS → ASP.NET Core Mental Model
| NestJS | ASP.NET Core |
|---|---|
| `@Module()` | Not needed — single project, DI registered in `Program.cs` |
| `@Injectable()` service | Plain class + interface, `builder.Services.AddScoped<IX, X>()` |
| `@Controller()` / `@Get()` | `[ApiController]` / `[HttpGet]` |
| `@UseGuards(JwtAuthGuard)` | `[Authorize]` |
| `@Roles('admin')` | `[Authorize(Roles = "Admin")]` |
| DTO + `class-validator` | DTO + FluentValidation |
| TypeORM `Repository<T>` | EF Core `DbSet<T>` on `AppDbContext`, injected directly into Services (**no repository abstraction layer** — confirmed decision) |
| `main.ts` | `Program.cs` (minimal hosting model) |
| `.env` + `ConfigService` | `appsettings.json` + `IConfiguration`, overridden by env vars in Docker |

---

## 3. NuGet Packages

**AssignmentSystem.Api.csproj**
```bash
dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL --version 10.0.3
dotnet add package Microsoft.EntityFrameworkCore.Design --version 10.0.0
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer --version 10.0.0
dotnet add package FluentValidation.AspNetCore
dotnet add package Swashbuckle.AspNetCore
dotnet add package BCrypt.Net-Next
dotnet add package Serilog.AspNetCore
dotnet add package Serilog.Sinks.Console
dotnet add package Serilog.Sinks.File
```

**AssignmentSystem.Tests.csproj**
```bash
dotnet add package xunit
dotnet add package xunit.runner.visualstudio
dotnet add package Microsoft.NET.Test.Sdk
dotnet add package Moq
dotnet add package Microsoft.EntityFrameworkCore.InMemory --version 10.0.0
dotnet add package Microsoft.AspNetCore.Mvc.Testing --version 10.0.0
dotnet add package FluentAssertions
```

---

## 4. Implementation Phases

Execute in order. Each phase must compile and run before starting the next.

### Phase 0 — Solution & Project Scaffolding
```bash
dotnet new sln -n AssignmentSystem
dotnet new webapi -n AssignmentSystem.Api -o AssignmentSystem.Api
dotnet new xunit -n AssignmentSystem.Tests -o AssignmentSystem.Tests
dotnet sln add AssignmentSystem.Api AssignmentSystem.Tests
dotnet add AssignmentSystem.Tests reference AssignmentSystem.Api
```
Create the folder structure from Section 2. Install all NuGet packages from Section 3. Configure Serilog (console + file sink) and Swagger (with JWT Bearer auth support in Swagger UI — `AddSecurityDefinition` + `AddSecurityRequirement`) in `Program.cs`. Create `.env.example` with: `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `JWT_SECRET`, `JWT_ISSUER`, `JWT_AUDIENCE`, `JWT_EXPIRY_MINUTES`.

### Phase 0.5 — Dockerization
Create multi-stage `Dockerfile` in `AssignmentSystem.Api/`:
- Stage 1: `mcr.microsoft.com/dotnet/sdk:10.0` → restore + build + publish
- Stage 2: `mcr.microsoft.com/dotnet/aspnet:10.0` → copy published output, expose port 8080

Create `docker-compose.yml` at solution root with two services:
- `postgres`: `postgres:16-alpine`, named volume for data persistence, healthcheck (`pg_isready`), env vars from `.env`
- `api`: build from `AssignmentSystem.Api/Dockerfile`, `depends_on: postgres (condition: service_healthy)`, env vars for connection string built from Postgres env vars, port mapping `8080:8080`, volume mount for `wwwroot/uploads` (persist uploaded files across container restarts)

Configure `appsettings.json` connection string to be overridable via `ConnectionStrings__DefaultConnection` env var (ASP.NET Core's double-underscore env var convention), so it resolves to `Host=postgres` inside Docker and `Host=localhost` for local `dotnet run`.

### Phase 1 — Database Layer
1. Define all 7 entity classes exactly per Section 1 schema (use `Guid` PKs, `DateTimeOffset` for timestamps).
2. Create `AppDbContext` with `DbSet<T>` for each entity.
3. Create `IEntityTypeConfiguration<T>` classes in `Data/Configurations/` for each entity — define:
   - `Users`: unique index on `Email`
   - `TeacherSubjectClass`: unique composite index on `(TeacherId, SubjectId, ClassId)`
   - `Submissions`: unique composite index on `(AssignmentId, StudentId)`
   - All FK relationships with `DeleteBehavior.Restrict`, except `SubmissionHistory → Submission` which uses `DeleteBehavior.Cascade`
   - Enum-to-string conversions for `Role`, `AssignmentStatus`, `SubmissionStatus` (readable in raw SQL, easier debugging than int enums)
4. In `Program.cs`, register `AppDbContext` with `UseNpgsql(connectionString)`.
5. Generate initial migration: `dotnet ef migrations add InitialCreate --project AssignmentSystem.Api`
6. In `Program.cs`, after `var app = builder.Build();`, add auto-migrate-on-startup logic:
   ```csharp
   using (var scope = app.Services.CreateScope())
   {
       var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
       db.Database.Migrate();
       await DataSeeder.SeedAsync(db); // idempotent — check if data exists first
   }
   ```
7. `DataSeeder.SeedAsync`: seed 1 Admin, 2 Teachers, 3 Students, 2 Classes, 3 Subjects, a few `TeacherSubjectClass` rows. Use fixed, documented demo credentials (see Phase 9).
8. Verify: `docker compose up --build` → API starts → tables exist → seed data present (check via `psql` or Swagger GET endpoints once Phase 3 exists).

### Phase 2 — Authentication & Authorization
1. `AuthController`: `POST /api/auth/register` (optional — Admin-only creation might be preferred, but include for testing), `POST /api/auth/login`.
2. `AuthService`: verify email/password (BCrypt.Verify), generate JWT with claims: `sub` (UserId), `email`, `role`, `classId` (if Student).
3. JWT config in `Program.cs`: `AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(...)` reading `JWT_SECRET`/`JWT_ISSUER`/`JWT_AUDIENCE` from config. Add `app.UseAuthentication()` + `app.UseAuthorization()` in correct order (before `UseAuthorization`, after `UseRouting`).
4. Test via Swagger: login as seeded Admin → copy token → authorize → hit a protected endpoint.

### Phase 3 — Admin Module
- `UsersController` (Admin-only `[Authorize(Roles = "Admin")]`): CRUD for Users, soft delete (`IsActive = false`, never hard delete).
- `ClassesController`: CRUD for Classes, soft delete.
- `SubjectsController`: CRUD for Subjects, soft delete.
- `TeacherAssignmentsController`: Admin assigns Teacher to (Subject, Class) — create/list/delete `TeacherSubjectClass` rows. Reject duplicate via the unique constraint (catch `DbUpdateException`, return 409).
- Admin-only endpoints to view ALL assignments and ALL submissions across the system (no ownership filter).

### Phase 4 — Teacher Module
- `AssignmentsController` (Teacher + Admin):
  - `POST /api/assignments`: validate `(TeacherId, SubjectId, ClassId)` exists in `TeacherSubjectClass` before insert. Default `Status = Draft`.
  - `PUT /api/assignments/{id}`: only the owning Teacher (or Admin) may edit.
  - `PATCH /api/assignments/{id}/status`: transition Draft→Published→Closed.
  - `DELETE /api/assignments/{id}`: only owning Teacher/Admin.
- `SubmissionsController` (Teacher view + grade):
  - `GET /api/assignments/{id}/submissions`: list all submissions for an assignment (Teacher must own it, or Admin).
  - `PATCH /api/submissions/{id}/grade`: set `Marks`, `Feedback`, `Status = Graded`. Owning Teacher or Admin only.
  - `PATCH /api/submissions/{id}/status`: manual status override.

### Phase 5 — Student Module
- `GET /api/assignments`: Student sees only `Published` assignments where `ClassId == Student.ClassId`.
- `GET /api/assignments/{id}`: same scoping + 403 if not their class.
- `POST /api/submissions`: create or update (upsert on unique `AssignmentId+StudentId`).
  - Before saving new content: if a `Submission` row already exists, copy its current state into `SubmissionHistory` first, then overwrite.
  - Enforce Deadline/AllowLateSubmission/Status=Closed rules from Section 1, Business Rule #4–5.
  - Compute `IsLate` server-side — never trust client input for this.
- `GET /api/submissions/mine`: Student views own submission status/marks/feedback for a given assignment.

### Phase 6 — File Upload
- `IFileStorageService` / `FileStorageService`: save `IFormFile` to `wwwroot/uploads/{assignmentId}/{studentId}/{guid}_{filename}`, validate extension whitelist (`.pdf, .docx, .doc, .zip, .png, .jpg, .jpeg`) and max size (e.g. 10MB).
- Wire into `POST /api/submissions` as `multipart/form-data` (Content as form field + optional File).
- Secure file serving: do NOT expose `wwwroot/uploads` as a static/anonymous folder. Instead, add `GET /api/submissions/{id}/file` controller action that checks authorization (owning Student, owning Teacher, or Admin) then returns `PhysicalFile(...)`.

### Phase 7 — Validation & Error Handling
- FluentValidation validator per DTO (required fields, string lengths, `Deadline` must be future date on create, `MaxMarks > 0`, `Marks <= Assignment.MaxMarks`, email format, password min length).
- Register validators in `Program.cs`, enable automatic validation pipeline.
- `ExceptionMiddleware`: catch unhandled exceptions, return consistent JSON error shape:
  ```json
  { "statusCode": 400, "message": "...", "errors": ["..."] }
  ```
- Serilog request logging middleware (`app.UseSerilogRequestLogging()`).

### Phase 8 — Testing
Priority business rules to cover with xUnit (using EF Core InMemory provider for service tests):
1. Late submission rejected when `AllowLateSubmission = false` and past deadline.
2. Late submission accepted + flagged when `AllowLateSubmission = true`.
3. Submission rejected when `Assignment.Status == Closed`, regardless of deadline.
4. `SubmissionHistory` row created on every edit.
5. Duplicate `(AssignmentId, StudentId)` submission throws/handled as update, not duplicate insert.
6. Student cannot view/submit to assignment outside their `ClassId`.
7. Teacher cannot create assignment for `(Subject, Class)` they're not assigned to via `TeacherSubjectClass`.
8. Teacher cannot grade/view submissions for another teacher's assignment.
9. JWT role claim correctly restricts `[Authorize(Roles = "...")]` endpoints (integration test via `WebApplicationFactory`).
10. Marks cannot exceed `Assignment.MaxMarks` (validator test).

### Phase 9 — Docs & Polish
- Swagger: XML doc comments on controllers/DTOs for descriptive Swagger UI, enable `IncludeXmlComments`.
- `README.md` must include: overview, tech stack, project structure, **`docker compose up --build`** as the one-command setup, demo credentials table, assumptions (esp. the Subject/TeacherSubjectClass normalization decision, single-role-per-user, local disk file storage), known limitations, how to run tests (`dotnet test`).
- Demo credentials (seeded in Phase 1) — document in README:
  ```
  Admin:   admin@school.test   / Admin@123
  Teacher: teacher1@school.test / Teacher@123
  Student: student1@school.test / Student@123
  ```
- Final check: fresh clone → `docker compose up --build` → migrations auto-apply → seed loads → Swagger reachable at `http://localhost:8080/swagger` → login works → no manual DB steps required.

---

## 5. Key Design Decisions & Assumptions (for README)

- **Single role per user** via enum, not separate role tables — simplifies JWT/RBAC.
- **Subject is a standalone catalog entity**; the Teacher↔Subject↔Class relationship lives only in `TeacherSubjectClass` to avoid data-integrity conflicts between two independent FK paths.
- **No repository abstraction layer** — EF Core's `DbContext`/`DbSet` already serves that role; Services inject `AppDbContext` directly.
- **Soft delete** (`IsActive`) on Users/Classes/Subjects to preserve academic history; hard `Restrict` FK behavior elsewhere to prevent orphaned records.
- **One current submission row per student per assignment**, with full edit history in `SubmissionHistory` for audit purposes.
- **Late submissions** are a per-assignment teacher decision (`AllowLateSubmission`), not a global rule.
- **File storage is local disk** (`wwwroot/uploads`, Docker volume-mounted) rather than cloud storage, to keep local setup dependency-free per the assessment brief.
- **Migrations auto-apply on container startup** for zero-friction evaluator setup.
