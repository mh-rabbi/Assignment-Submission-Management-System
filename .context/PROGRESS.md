# PROGRESS.md — Assignment Submission Management System Backend

## Phase Status
- [x] Phase 0 — Solution & Project Scaffolding — DONE (2026-08-09)
- [x] Phase 0.5 — Dockerization — DONE (2026-08-09)
- [ ] Phase 1 — Database Layer — NOT STARTED
- [ ] Phase 2 — Authentication & Authorization — NOT STARTED
- [ ] Phase 3 — Admin Module — NOT STARTED
- [ ] Phase 4 — Teacher Module — NOT STARTED
- [ ] Phase 5 — Student Module — NOT STARTED
- [ ] Phase 6 — File Upload — NOT STARTED
- [ ] Phase 7 — Validation & Error Handling — NOT STARTED
- [ ] Phase 8 — Testing — NOT STARTED
- [ ] Phase 9 — Docs & Polish — NOT STARTED

## Last Session Summary
Scaffolded solution and projects (`AssignmentSystem.Api` and `AssignmentSystem.Tests`), created necessary project directory structure, installed requested NuGet packages. Configured Serilog and Swagger with JWT Bearer Auth in Program.cs. Configured Docker multi-stage build, docker-compose configuration, and `appsettings.json` override. The solution builds successfully.

## Deviations From Plan
Ran into an issue with the Swashbuckle version and `Microsoft.OpenApi.Models` not being found initially. Resolved by adding `Microsoft.OpenApi` directly and then using `Swashbuckle.AspNetCore` 6.6.2 package since the default .NET 10 template `Microsoft.AspNetCore.OpenApi` wasn't playing nice with the instructions to use Swashbuckle.

## Known Issues / TODO
Proceed to Phase 1 (Database Layer).

## How to Verify Current State
Run `dotnet build` in `/home/mahmudul-rabbi/OnnorokomProjokti/backend` to verify compilation.
