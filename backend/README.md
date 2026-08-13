# Role-based Assignment & Submission Management System — Backend

A role-based Assignment & Submission Management System Web API for schools/colleges built with **ASP.NET Core 10**, **PostgreSQL 16**, **EF Core 10**, **JWT Authentication**, and **Docker**.

---

## Tech Stack

- **Framework:** ASP.NET Core 10 Web API (C#)
- **Database:** PostgreSQL 16
- **ORM:** Entity Framework Core 10 (Npgsql)
- **Authentication:** JWT Bearer Token (Custom claims + Roles)
- **Validation:** FluentValidation
- **Logging:** Serilog (Console + Rolling File Sink)
- **Documentation:** Swagger / OpenAPI UI
- **Testing:** xUnit + Moq + FluentAssertions + EF Core InMemory
- **Containerization:** Docker & Docker Compose (Multi-stage build)

---

## One-Command Setup (Docker)

Create your local environment file first:

```bash
cp .env.example .env
```

Then edit `.env` and replace every `replace-with-*` value with your local credentials/secrets.

To build, apply migrations, seed demo data, and run the API and PostgreSQL database:

```bash
docker compose up --build
```

- **Swagger UI:** Accessible at [http://localhost:8080/swagger](http://localhost:8080/swagger)
- **Database:** PostgreSQL running on port `5432`

---

## Demo Credentials (Seeded on Startup)

| Role | Email | Password | Details |
|---|---|---|---|
| **Admin** | `admin@school.test` | `Admin@123` | Full access across system |
| **Teacher 1** | `teacher1@school.test` | `Teacher@123` | Teaches Math & Physics (Grade 10) |
| **Teacher 2** | `teacher2@school.test` | `Teacher@123` | Teaches English (Grade 10) & Math (Grade 11) |
| **Student 1** | `student1@school.test` | `Student@123` | Enrolled in Grade 10 |
| **Student 2** | `student2@school.test` | `Student@123` | Enrolled in Grade 10 |
| **Student 3** | `student3@school.test` | `Student@123` | Enrolled in Grade 11 |

---

## Project Structure

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
│   │   ├── TeacherAssignmentsController.cs
│   │   ├── AssignmentsController.cs
│   │   └── SubmissionsController.cs
│   ├── Services/
│   │   ├── Interfaces/
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
│   │   ├── Configurations/
│   │   ├── Migrations/
│   │   └── Seed/DataSeeder.cs
│   ├── DTOs/
│   ├── Middleware/ExceptionMiddleware.cs
│   ├── Common/
│   │   ├── Enums/
│   │   ├── Helpers/
│   ├── Validators/
│   ├── wwwroot/uploads/
│   ├── Program.cs
│   ├── appsettings.json
│   ├── Dockerfile
│   └── AssignmentSystem.Api.csproj
└── AssignmentSystem.Tests/
    ├── Services/
    │   ├── SubmissionServiceTests.cs
    │   ├── AssignmentServiceTests.cs
    │   └── AuthServiceTests.cs
    └── AssignmentSystem.Tests.csproj
```

---

## Running Tests

Tests read the same `.env` file used by local development. Make sure `JWT_SECRET`, `POSTGRES_DB`, `POSTGRES_USER`, and `POSTGRES_PASSWORD` are configured before running them.

Run unit tests via .NET CLI:

```bash
dotnet test
```

---

## Key Design Decisions & Assumptions

1. **Single role per user** via enum (`Admin`, `Teacher`, `Student`) stored on `Users` table.
2. **Standalone Subject Catalog:** `Subject` does NOT store `ClassId`. The `TeacherSubjectClass` table is the single source of truth for Teacher↔Subject↔Class relationships.
3. **No repository abstraction layer:** EF Core's `DbContext`/`DbSet` serves as the repository; services inject `AppDbContext` directly.
4. **Soft delete (`IsActive`)** on `Users`, `Classes`, and `Subjects` to maintain data integrity and history.
5. **Single current submission per student per assignment:** Upsert behavior with complete snapshot edit history maintained in `SubmissionHistory`.
6. **Late submissions & deadlines:** Teacher-controlled per assignment via `AllowLateSubmission`. Computing `IsLate` is strictly enforced server-side.
7. **Local disk file storage:** Files are stored in `wwwroot/uploads` and volume-mounted in Docker, served via secure authorized controller endpoint (`GET /api/submissions/{id}/file`).
8. **Automatic Database Migrations & Seeding:** `db.Database.Migrate()` and `DataSeeder.SeedAsync()` run automatically on app startup.
