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

## Last Session Summary
Full backend project implementation completed per `IMPLEMENTATION_PLAN.md`:
- Completed Database Layer (EF Core 10, Npgsql, 7 Entities, Fluent Configurations, Initial Migration, Auto-Seeder with demo credentials).
- Completed JWT Authentication & Authorization with custom claims (`sub`, `email`, `role`, `classId`).
- Completed Admin Module (`UsersController`, `ClassesController`, `SubjectsController`, `TeacherAssignmentsController`).
- Completed Teacher Module (`AssignmentsController`, submission view & grading endpoints).
- Completed Student Module (assignment class/published scoping, submission create/update with `SubmissionHistory` snapshots, late submission rules).
- Completed File Storage Service & Secure File Serving endpoint (`GET /api/submissions/{id}/file`).
- Completed Validation (FluentValidation per DTO) & Error Handling (`ExceptionMiddleware` for standardized JSON error shape).
- Completed Unit Test suite (`AssignmentSystem.Tests`) with 13 xUnit tests covering all priority business rules. All 13 tests passing.
- Completed Documentation (`README.md`).

## Deviations From Plan
None. All entities, business rules, API routes, and architectural constraints were strictly followed.

## Known Issues / TODO
None. System is fully functional and ready for production/docker deployment.

## How to Verify Current State
1. Run `dotnet build` from `/home/mahmudul-rabbi/OnnorokomProjokti/backend` to verify compilation.
2. Run `dotnet test` from `/home/mahmudul-rabbi/OnnorokomProjokti/backend` to run all unit tests (13 passing).
3. Run `docker compose up --build` from `/home/mahmudul-rabbi/OnnorokomProjokti/backend` and open `http://localhost:8080/swagger`.
