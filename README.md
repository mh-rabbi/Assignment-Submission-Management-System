
# 📋 Roll Call — Role-based Assignment & Submission Management System

> A system of record for schools and colleges — Admins set up classes and teachers, Teachers publish assignments and grade work, Students submit before the deadline. Nothing gets lost, nothing gets faked.

🎥 **[Watch the full demo video here](https://youtu.be/wEc1OC5pQG4)**

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Demo Credentials](#-demo-credentials)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Backend Setup (Docker)](#2-backend-setup-docker)
  - [3. Frontend Setup](#3-frontend-setup)
- [Database](#-database)
- [Running Tests](#-running-tests)
- [API Documentation](#-api-documentation)
- [Assumptions](#-assumptions)
- [Known Limitations](#-known-limitations)
- [License](#-license)

---

## 🎯 Overview

**Roll Call** is a full-stack, role-based Assignment & Submission Management System built for school/college workflows:

- 👩‍💼 **Admin** manages Users, Classes, Subjects, and assigns Teachers to (Subject, Class) pairs
- 👨‍🏫 **Teacher** creates and publishes Assignments for classes they're assigned to teach, and grades Student Submissions
- 🎓 **Student** submits work (text + optional file) before the deadline, can edit until the deadline (full edit history kept), and views grades/feedback

The backend is a fully tested, dockerized **ASP.NET Core 10 Web API**, and the frontend is a **Next.js** app with a custom glassmorphism design system ("parchment & chalkboard" theme).

---

## 🔑 Demo Credentials

All accounts are seeded automatically on first backend startup.

| Role | Email | Password | Details |
|---|---|---|---|
| 👩‍💼 **Admin** | `admin@school.test` | `Admin@123` | Full system access |
| 👨‍🏫 **Teacher 1** | `teacher1@school.test` | `Teacher@123` | Teaches Math & Physics (Grade 10) |
| 👨‍🏫 **Teacher 2** | `teacher2@school.test` | `Teacher@123` | Teaches English (Grade 10) & Math (Grade 11) |
| 🎓 **Student 1** | `student1@school.test` | `Student@123` | Enrolled in Grade 10 |
| 🎓 **Student 2** | `student2@school.test` | `Student@123` | Enrolled in Grade 10 |
| 🎓 **Student 3** | `student3@school.test` | `Student@123` | Enrolled in Grade 11 |

---

## ✨ Features

- 🔐 **JWT authentication** with role-based access control (Admin / Teacher / Student)
- 🏫 **Class & Subject catalog management** with soft-delete and duplicate-name protection
- 🔗 **Teacher ↔ Subject ↔ Class assignment system** — the single source of truth for who teaches what
- 📝 **Assignment lifecycle**: Draft → Published → Closed
- 📤 **File-upload submissions** (`.pdf`, `.docx`, `.doc`, `.zip`, `.png`, `.jpg`, `.jpeg`, max 10MB) with secure authorized download
- ⏰ **Deadline enforcement** with optional teacher-controlled late submissions
- 📚 **Full submission edit history** — every edit is snapshotted, nothing is silently overwritten
- 🎯 **Grading workflow** with marks + feedback, capped to `MaxMarks`
- 🎨 **Polished, responsive UI** with light/dark mode, animated landing page, and role-aware dashboards
- 🐳 **One-command Dockerized backend** with auto-migration and auto-seeding

---

## 🛠 Tech Stack

### Backend
- ASP.NET Core 10 Web API (C#)
- PostgreSQL 16 + Entity Framework Core 10
- JWT Bearer Authentication
- FluentValidation
- Serilog (Console + File sinks)
- Swagger / OpenAPI
- xUnit + Moq + FluentAssertions
- Docker & Docker Compose

### Frontend
- Next.js 16 (App Router) + React 19 + TypeScript
- Vanilla CSS Custom Properties (60/30/10 themed design system, light/dark mode)
- Tabler Icons
- Typed `fetch`-based API client with centralized error handling

---

## 🗂 Project Structure

```
Assignment-Submission-Management-System/
├── backend/
│   ├── AssignmentSystem.Api/          # ASP.NET Core Web API
│   │   ├── Controllers/
│   │   ├── Services/
│   │   ├── Data/                      # EF Core DbContext, Entities, Migrations, Seed
│   │   ├── DTOs/
│   │   ├── Validators/
│   │   ├── Middleware/
│   │   └── Dockerfile
│   ├── AssignmentSystem.Tests/        # xUnit unit + integration tests
│   ├── docker-compose.yml
│   ├── .env.example
│   └── README.md
├── frontend/
│   ├── roll-call/                     # Next.js application
│   │   ├── src/
│   │   │   ├── app/                   # App Router pages (landing, auth, dashboard, etc.)
│   │   │   ├── components/
│   │   │   ├── lib/                   # API client, types, auth helpers
│   │   │   └── context/
│   │   └── next.config.ts             # Proxies /api/* → backend
│   ├── backend_api.md                 # API reference used to build the frontend
│   └── roll-call-design-system-v2.md  # Design system spec
└── README.md                          # You are here
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

- 🐳 [Docker](https://www.docker.com/products/docker-desktop/) & Docker Compose
- 🟢 [Node.js](https://nodejs.org/) v20.9+ and npm
- (Optional, for running backend tests locally without Docker) [.NET 10 SDK](https://dotnet.microsoft.com/download)

### 1. Clone the Repository

```bash
git clone https://github.com/mh-rabbi/Assignment-Submission-Management-System.git
cd Assignment-Submission-Management-System
```

### 2. Backend Setup (Docker)

```bash
cd backend
cp .env.example .env
```

Open `.env` and replace every `replace-with-*` placeholder with your own local values (Postgres credentials, a JWT secret of at least 32 characters, etc.).

Then build and run everything with one command:

```bash
docker compose up --build
```

This will:
- ✅ Spin up a PostgreSQL 16 container
- ✅ Build and run the ASP.NET Core API container
- ✅ **Automatically apply EF Core migrations**
- ✅ **Automatically seed demo data** (Admin, Teachers, Students, Classes, Subjects — see credentials above)

Once running:
- **API base URL:** `http://localhost:8080`
- **Swagger UI:** [http://localhost:8080/swagger](http://localhost:8080/swagger)
- **PostgreSQL:** `localhost:5432`

> 💡 No manual database setup or migration commands are required — everything runs automatically inside the container on startup.

### 3. Frontend Setup

In a **new terminal**, from the repo root:

```bash
cd frontend/roll-call
npm install
npm run dev
```

The frontend will be available at **[http://localhost:3000](http://localhost:3000)**.

> The frontend proxies all `/api/*` requests to `http://localhost:8080` (configured in `next.config.ts`), so make sure the backend is running first.

Now open [http://localhost:3000](http://localhost:3000), click **"Wanna join the system?"**, and sign in with any of the [demo credentials](#-demo-credentials) above. 🎉

---

## 🗄 Database

- **Engine:** PostgreSQL 16 (runs in Docker, port `5432`)
- **Migrations:** Applied automatically on API container startup via `db.Database.Migrate()`
- **Seeding:** Idempotent — runs automatically on startup, skips if data already exists
- **Manual inspection** (optional):
  ```bash
  docker exec -it backend-postgres-1 psql -U <your_postgres_user> -d <your_postgres_db>
  ```

No manual `dotnet ef database update` or SQL scripts are needed for a fresh setup.

---

## 🧪 Running Tests

### Backend (xUnit)

With the Docker backend running (integration tests hit the live API + database):

```bash
cd backend
dotnet test AssignmentSystem.slnx
```

This runs both service-level unit tests (EF Core InMemory provider) and full integration tests against the running API and PostgreSQL instance.

### Frontend

The frontend build can be verified with:

```bash
cd frontend/roll-call
npm run build
```

---

## 📘 API Documentation

- **Swagger / OpenAPI:** [http://localhost:8080/swagger](http://localhost:8080/swagger) (once the backend is running)
- A full hand-written API reference (endpoints, request/response shapes, business rules, and status-code behavior) is also available at [`frontend/backend_api.md`](frontend/backend_api.md)

---

## 📝 Assumptions

- **Single role per user**, stored as an enum — no separate role tables
- **Subject is a standalone catalog entity** — the Teacher ↔ Subject ↔ Class relationship lives *only* in the `TeacherSubjectClass` table, avoiding data-integrity conflicts between two independent FK paths
- **No repository abstraction layer** — EF Core's `DbContext`/`DbSet` is injected directly into services
- **Soft delete** on Users, Classes, and Subjects to preserve academic history; soft-deleted Classes/Subjects are fully hidden from read endpoints (404), not merely flagged inactive
- **One current submission row per student per assignment**, with complete edit history kept in a separate `SubmissionHistory` table
- **Late submissions** are a per-assignment teacher decision (`AllowLateSubmission`), not a global rule
- **File storage is local disk** (Docker volume-mounted), not cloud storage, to keep local evaluation dependency-free
- **Admin can create Assignments on behalf of any Teacher**, provided an explicit `TeacherId` in the request body
- **Frontend has no `/me` endpoint to call** — current-user display data is decoded from the JWT (email, role, classId); full `Name` comes from the login response itself

---

## ⚠️ Known Limitations

- 🚫 **No pagination or server-side filtering** on any list endpoint — the frontend performs client-side search/sort/pagination, which is fine at school-scale data but would need a backend API upgrade for very large datasets
- 🔓 **Self-serve registration** (`POST /api/auth/register`) allows open account creation, including Admin/Teacher roles — this is intended primarily for testing/demo purposes; production deployments should restrict user creation to the Admin-only `POST /api/users` flow
- 📁 **Local disk file storage** — uploaded submission files are not backed by cloud storage/CDN; they persist only via the Docker volume
- 🔑 **No password reset flow** — a password can only be changed by an Admin via `PUT /api/users/{id}`
- 📛 **No `/me` endpoint** — the JWT does not carry a user's `Name`, only `email`/`role`/`classId`
- 🗑️ **No DELETE endpoint for submissions** — submissions can only be created, edited (upsert), or status/grade-patched

---

## 📄 License

This project was built as part of an assessment submission. See repository for license details.

---

<p align="center">Built as a system of record, not a to-do app. 🎓</p>
