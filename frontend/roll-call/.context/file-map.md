# Roll Call Frontend — File Map

*Complete directory map for the Roll Call frontend implementation.*

---

## Repository Root: `/home/mahmudul-rabbi/OnnorokomProjokti/`

```
frontend/
├── agent.md                          # Implementation plan — source of truth for this build
├── backend_api.md                    # API reference (read-only ground truth)
├── roll-call-design-system-v2.md     # Design system specification (read-only ground truth)
├── rollcall-demo.html               # Landing page reference build (read-only ground truth)
└── roll-call/                        # Next.js 15 project (the actual frontend implementation)
    ├── .context/                     # Session continuity folder
    │   ├── progress.md              # Build phase completion status
    │   ├── decisions.md             # Running decision log (D-01 to D-12)
    │   ├── known-issues.md          # Active & deferred issues
    │   └── file-map.md              # This file
    ├── public/                       # Static assets
    ├── src/
    │   ├── app/                      # Next.js App Router pages (15 routes)
    │   │   ├── layout.tsx           # Root layout: ThemeProvider, AuthProvider, ToastProvider, paper texture
    │   │   ├── page.tsx             # Landing page (7 sections + RollCallRail + scroll reveal)
    │   │   ├── globals.css          # All CSS custom properties + 60/30/10 light/dark tokens + glass utility classes
    │   │   ├── auth/
    │   │   │   └── page.tsx         # Sign in / Create account tabbed auth screen
    │   │   └── (app)/               # Route group: authenticated app shell
    │   │       ├── layout.tsx       # Authenticated layout: 240px Sidebar + Topbar + MobileTabBar + auth guard
    │   │       ├── dashboard/
    │   │       │   └── page.tsx     # Role-specific dashboard (Admin / Teacher / Student)
    │   │       ├── users/
    │   │       │   └── page.tsx     # Admin Users directory (list, create, edit, soft-deactivate)
    │   │       ├── classes/
    │   │       │   └── page.tsx     # Admin Classes management (list, create, edit, soft-delete modal)
    │   │       ├── subjects/
    │   │       │   └── page.tsx     # Admin Subjects management (list, create, edit, soft-delete)
    │   │       ├── teacher-assignments/
    │   │       │   └── page.tsx     # Admin Teacher-Subject-Class authorization rows (3-dropdown modal)
    │   │       ├── my-teaching/
    │   │       │   └── page.tsx     # Teacher read-only view of assigned subjects & classes
    │   │       ├── assignments/
    │   │       │   ├── page.tsx     # Role-aware assignments list (Admin all, Teacher own, Student published)
    │   │       │   └── [id]/
    │   │       │       └── page.tsx # Assignment detail, brief, lifecycle buttons, Student submit flow
    │   │       └── submissions/
    │   │           ├── page.tsx     # Submissions list (Admin oversight, Teacher queue, Student history)
    │   │           └── [id]/
    │   │               └── page.tsx # Submission detail, Teacher/Admin GradingPanel, audit history
    │   ├── components/
    │   │   ├── ThemeProvider.tsx    # Theme state & data-theme attribute switcher
    │   │   ├── ThemeToggle.tsx      # Sun/moon toggle button with overshoot animation
    │   │   ├── ui/                  # Shared UI primitives
    │   │   │   ├── Button.tsx       # Reusable button (primary, ghost, danger, lg, sm)
    │   │   │   ├── GlassPanel.tsx   # Glass container wrapper (standard, muted, app variants)
    │   │   │   ├── Badge.tsx        # RoleStamp (circular A/T/S badge) & StatusPill (Draft, Published, Closed, Graded, Late)
    │   │   │   ├── DataTable.tsx    # Client-side search, multi-column sort, and pagination
    │   │   │   ├── Modal.tsx        # 560px glass modal with flat scrim backdrop & Esc listener
    │   │   │   ├── Toast.tsx        # Toast notifications context & auto-dismissing pills
    │   │   │   ├── FileUpload.tsx   # Drag-and-drop dropzone with file chip & accepted type validation
    │   │   │   ├── GradingPanel.tsx # Marks input with / MaxMarks clamp & feedback textarea
    │   │   │   ├── SubmissionHistory.tsx # Mono-styled edit history list
    │   │   │   ├── EmptyState.tsx   # Empty state panel with optional CTA
    │   │   │   └── Skeleton.tsx     # Loading skeleton placeholder blocks (no shimmer)
    │   │   ├── landing/             # Landing page components
    │   │   │   ├── LandingNav.tsx   # Sticky glass nav with mobile panel
    │   │   │   ├── RollCallRail.tsx # Signature vertical scroll progress rail (desktop ≥1180px) & top progress bar (<1180px)
    │   │   │   ├── HeroSection.tsx  # Hero title, subhead, state machine mockup ledger card
    │   │   │   ├── ProblemSection.tsx # Entry 01 — why this exists
    │   │   │   ├── RolesSection.tsx # Entry 02 — three roles cards
    │   │   │   ├── FlowSection.tsx  # Entry 03 — assignment lifecycle flow
    │   │   │   ├── RulesSection.tsx # Entry 04 — system business rules
    │   │   │   ├── StatsSection.tsx # System properties stat pills
    │   │   │   ├── CtaSection.tsx   # Final CTA card
    │   │   │   └── Footer.tsx       # Footer brand statement
    │   │   └── shell/               # App shell components
    │   │       ├── Sidebar.tsx      # Fixed left 240px sidebar with role-filtered nav
    │   │       ├── Topbar.tsx       # Sticky topbar with page title (Fraunces 24px) & avatar initial
    │   │       └── MobileTabBar.tsx # Fixed bottom tab bar for viewports ≤899px
    │   ├── context/
    │   │   └── AuthContext.tsx      # Auth state provider: stores AuthResponseDto & handles 401 logout
    │   ├── lib/
    │   │   ├── api.ts              # Typed API client for all backend endpoints
    │   │   ├── auth.ts             # Auth localStorage & JWT decoding utilities
    │   │   └── types.ts            # TypeScript interfaces for all backend DTOs & requests
    │   └── middleware.ts            # Next.js middleware route proxy/guard
    ├── next.config.ts               # Proxy rewrite: /api/* → http://localhost:8080/api/*
    ├── tsconfig.json
    └── package.json
```
