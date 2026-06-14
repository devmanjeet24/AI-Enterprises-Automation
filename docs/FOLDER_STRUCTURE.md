# Folder Structure

Complete directory layout for the AI Enterprise Automation Platform.

## Repository Root

```
AI-Enterprises-Automation/
├── README.md                 # Project overview and quick start
├── docs/                     # Project documentation
│   ├── QA_REPORT.md          # Submission readiness audit
│   ├── ENVIRONMENT_SETUP.md  # Environment variable reference
│   ├── LOCAL_DEVELOPMENT.md  # Dev workflow guide
│   ├── ARCHITECTURE.md       # System design overview
│   └── FOLDER_STRUCTURE.md   # This file
├── backend/                  # FastAPI API server
└── frontend/                 # Next.js web application
```

---

## Backend (`backend/`)

```
backend/
├── README.md                 # Backend setup and API reference
├── .env.example              # Environment template
├── .gitignore
├── pyproject.toml            # Python project config + dependencies
├── uv.lock                   # Locked dependency versions
├── alembic.ini               # Alembic migration config
│
├── alembic/                  # Database migrations
│   ├── env.py                # Migration runtime (loads app settings)
│   ├── README
│   ├── script.py.mako        # Migration template
│   └── versions/             # 24 migration files (chronological)
│
├── app/                      # Application source
│   ├── main.py               # FastAPI app factory, CORS, lifespan
│   ├── config.py             # Pydantic Settings (reads .env)
│   │
│   ├── api/                  # HTTP layer
│   │   ├── router.py         # Mounts /api/v1
│   │   ├── deps.py           # get_current_user, JWT validation
│   │   └── v1/
│   │       ├── router.py     # Aggregates all module routers
│   │       └── endpoints/    # One file per API module
│   │           ├── auth.py
│   │           ├── organizations.py
│   │           ├── users.py
│   │           ├── roles.py
│   │           ├── permissions.py
│   │           ├── departments.py
│   │           ├── teams.py
│   │           ├── documents.py
│   │           ├── knowledge.py
│   │           ├── employees.py
│   │           ├── agent_teams.py
│   │           ├── agent_tasks.py
│   │           ├── workflows.py
│   │           ├── research_projects.py
│   │           ├── browser_profiles.py
│   │           ├── browser_tasks.py
│   │           ├── conversations.py
│   │           ├── dashboard.py
│   │           └── health.py
│   │
│   ├── core/                 # Cross-cutting concerns
│   │   ├── security.py       # Password hashing, JWT create/decode
│   │   ├── authorization.py  # require_permission decorator
│   │   ├── permissions.py    # Permission slug catalog (42 slugs)
│   │   └── exception_handlers.py
│   │
│   ├── db/                   # Database infrastructure
│   │   ├── base.py           # SQLAlchemy declarative base
│   │   └── session.py        # Engine + SessionLocal
│   │
│   ├── models/               # SQLAlchemy ORM models (30+ tables)
│   │   ├── organization.py
│   │   ├── user.py
│   │   ├── role.py
│   │   ├── permission.py
│   │   ├── department.py
│   │   ├── team.py
│   │   ├── knowledge_document.py
│   │   ├── document_chunk.py
│   │   ├── ai_employee.py
│   │   ├── conversation.py
│   │   ├── agent_team.py
│   │   ├── workflow.py
│   │   ├── research_project.py
│   │   ├── browser_profile.py
│   │   └── ... (and junction/execution tables)
│   │
│   ├── schemas/              # Pydantic request/response models
│   │   └── (mirrors models, one schema file per domain)
│   │
│   └── services/             # Business logic layer
│       ├── auth_service.py
│       ├── organization_service.py
│       ├── document_service.py
│       ├── embedding_service.py
│       ├── rag_service.py
│       ├── employee_service.py
│       ├── agent_team_service.py
│       ├── workflow_service.py
│       ├── research_service.py
│       ├── browser_service.py
│       └── dashboard_service.py
│
└── tests/                    # Pytest suite (28 test modules)
    ├── conftest.py           # Fixtures (DB session, test client)
    ├── test_auth.py
    ├── test_authorization.py
    ├── test_users.py
    ├── test_roles.py
    ├── test_departments.py
    ├── test_teams.py
    ├── test_documents.py
    ├── test_employees.py
    ├── test_agent_teams.py
    ├── test_workflows.py
    ├── test_research_projects.py
    ├── test_browser_automation.py
    └── ... (and more)
```

### Runtime Directories (gitignored)

| Path | Created by | Purpose |
|------|-----------|---------|
| `uploads/` | Document upload | Stored PDF files |
| `chroma_data/` | Embedding service | ChromaDB vector index |
| `.venv/` | `uv sync` | Python virtual environment |

---

## Frontend (`frontend/`)

```
frontend/
├── README.md                 # Frontend setup and module map
├── .env.example              # Environment template
├── .gitignore
├── package.json
├── package-lock.json
├── next.config.ts            # Next.js configuration
├── tsconfig.json
├── postcss.config.mjs
├── eslint.config.mjs
│
├── docs/
│   └── auth-integration.md   # Detailed auth flow documentation
│
├── public/                   # Static assets
│
└── src/
    ├── middleware.ts          # Server-side auth route protection
    │
    ├── app/                   # Next.js App Router (38 pages)
    │   ├── layout.tsx         # Root layout
    │   ├── providers.tsx      # Redux + Query + Auth providers
    │   ├── globals.css
    │   │
    │   ├── (site)/            # Public marketing
    │   │   ├── layout.tsx
    │   │   └── page.tsx       # / (landing)
    │   │
    │   ├── (auth)/            # Authentication
    │   │   ├── layout.tsx     # GuestGuard wrapper
    │   │   ├── login/page.tsx
    │   │   └── register/page.tsx
    │   │
    │   └── (dashboard)/       # Authenticated application
    │       ├── layout.tsx     # AuthGuard + DashboardShell
    │       ├── overview/page.tsx
    │       ├── knowledge-base/
    │       │   ├── page.tsx
    │       │   └── [id]/page.tsx
    │       ├── ai-employees/
    │       │   ├── page.tsx
    │       │   └── [id]/page.tsx
    │       ├── agent-teams/
    │       │   ├── page.tsx
    │       │   └── [id]/page.tsx
    │       ├── workflows/
    │       │   ├── page.tsx
    │       │   └── [id]/page.tsx
    │       ├── research-hub/
    │       │   ├── page.tsx
    │       │   └── [id]/page.tsx
    │       ├── browser-automation/
    │       │   ├── page.tsx
    │       │   ├── profiles/[id]/page.tsx
    │       │   └── tasks/[id]/page.tsx
    │       ├── analytics/     # 9 analytics sub-pages
    │       │   ├── page.tsx
    │       │   ├── organization/page.tsx
    │       │   ├── knowledge/page.tsx
    │       │   ├── ai-employees/page.tsx
    │       │   ├── agent-teams/page.tsx
    │       │   ├── workflows/page.tsx
    │       │   ├── research/page.tsx
    │       │   ├── browser-automation/page.tsx
    │       │   └── reports/page.tsx
    │       └── settings/      # IAM + org management
    │           ├── page.tsx
    │           ├── organization/page.tsx
    │           ├── users/
    │           │   ├── page.tsx
    │           │   └── [id]/page.tsx
    │           ├── departments/
    │           │   ├── page.tsx
    │           │   └── [id]/page.tsx
    │           ├── teams/
    │           │   ├── page.tsx
    │           │   └── [id]/page.tsx
    │           ├── roles/
    │           │   ├── page.tsx
    │           │   └── [id]/page.tsx
    │           └── permissions/
    │               ├── page.tsx
    │               └── [id]/page.tsx
    │
    ├── components/            # UI components organized by module
    │   ├── auth/              # Login, register, guards
    │   ├── dashboard/         # Shell, sidebar, overview
    │   ├── settings/          # IAM module components
    │   ├── knowledge-base/
    │   ├── ai-employees/
    │   ├── agent-teams/
    │   ├── workflows/
    │   ├── research-hub/
    │   ├── browser-automation/
    │   ├── analytics/
    │   └── ui/                # Shared primitives (button, card, etc.)
    │
    ├── config/                # Module configuration
    │   ├── site.ts            # App URL, API URL
    │   ├── dashboard.ts       # Main sidebar navigation
    │   ├── settings.ts        # Settings hub navigation
    │   ├── analytics.ts       # Analytics sub-navigation
    │   ├── users.ts
    │   ├── roles.ts
    │   ├── permissions.ts
    │   ├── teams.ts
    │   ├── knowledge-base.ts
    │   ├── ai-employees.ts
    │   ├── agent-teams.ts
    │   ├── workflows.ts
    │   ├── research-hub.ts
    │   └── browser-automation.ts
    │
    ├── hooks/                 # React Query data hooks
    │   ├── use-auth-token.ts
    │   ├── use-settings.ts
    │   ├── use-users.ts
    │   ├── use-roles.ts
    │   ├── use-permissions.ts
    │   ├── use-departments.ts
    │   ├── use-teams.ts
    │   ├── use-knowledge-base.ts
    │   ├── use-ai-employees.ts
    │   ├── use-agent-teams.ts
    │   ├── use-workflows.ts
    │   ├── use-research-projects.ts
    │   ├── use-browser-automation.ts
    │   ├── use-dashboard-overview.ts
    │   ├── use-analytics.ts
    │   └── use-*-analytics.ts  # Per-module analytics hooks
    │
    ├── lib/                   # Utilities and API layer
    │   ├── api/               # HTTP client + per-module services
    │   │   ├── client.ts      # Shared fetch wrapper
    │   │   ├── errors.ts      # Error message extraction
    │   │   ├── auth.ts
    │   │   ├── organizations.ts
    │   │   ├── users.ts
    │   │   ├── roles.ts
    │   │   ├── permissions.ts
    │   │   ├── departments.ts
    │   │   ├── teams.ts
    │   │   ├── documents.ts
    │   │   ├── knowledge.ts
    │   │   ├── employees.ts
    │   │   ├── agent-teams.ts
    │   │   ├── agent-tasks.ts
    │   │   ├── workflows.ts
    │   │   ├── research-projects.ts
    │   │   ├── browser-profiles.ts
    │   │   ├── browser-tasks.ts
    │   │   ├── conversations.ts
    │   │   └── dashboard.ts
    │   │
    │   ├── auth/              # Auth utilities
    │   │   ├── permissions.ts # Permission slug constants
    │   │   ├── session.ts
    │   │   ├── storage.ts
    │   │   ├── validation.ts
    │   │   └── constants.ts
    │   │
    │   ├── analytics/         # Analytics computation
    │   │   ├── fetch-optional.ts
    │   │   ├── query-keys.ts
    │   │   ├── types.ts
    │   │   ├── access.ts
    │   │   └── compute/       # Per-module aggregation logic
    │   │
    │   └── {module}/          # Per-module types, guards, access helpers
    │       ├── types.ts
    │       ├── guards.ts
    │       └── access.ts
    │
    ├── providers/             # React context providers
    │   └── query-provider.tsx
    │
    └── store/                 # Redux Toolkit
        ├── index.ts
        └── slices/
            ├── auth-slice.ts
            ├── app-slice.ts
            └── ui-slice.ts
```

---

## Naming Conventions

| Area | Convention | Example |
|------|-----------|---------|
| Backend endpoints | `{module}.py` in `endpoints/` | `employees.py` |
| Backend services | `{module}_service.py` | `employee_service.py` |
| Backend models | `{entity}.py` singular | `ai_employee.py` |
| Frontend pages | `page.tsx` in route folder | `ai-employees/page.tsx` |
| Frontend components | `{module}-page.tsx`, `{entity}-detail-page.tsx` | `ai-employees-page.tsx` |
| Frontend hooks | `use-{module}.ts` | `use-ai-employees.ts` |
| Frontend API | `{module}.ts` in `lib/api/` | `employees.ts` |
| Permission slugs | `{resource}:{action}` | `employees:write` |

## Key File Relationships

```
Frontend page.tsx
  → Component (e.g., ai-employees-page.tsx)
    → Hook (e.g., use-ai-employees.ts)
      → API service (e.g., lib/api/employees.ts)
        → client.ts (fetch + Bearer token)
          → Backend endpoint (e.g., employees.py)
            → Service (e.g., employee_service.py)
              → Model (e.g., ai_employee.py)
                → PostgreSQL
```
