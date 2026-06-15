# AI Enterprise Automation Platform

A multi-tenant SaaS platform for building, managing, and orchestrating AI employees, knowledge bases, agent teams, workflows, research projects, and browser automation — with full RBAC, analytics, and organizational structure management.

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4, Redux Toolkit, TanStack Query |
| Backend | Python 3.13, FastAPI, SQLAlchemy, Alembic |
| Database | PostgreSQL |
| AI / RAG | Groq LLM, LangChain, ChromaDB, sentence-transformers |
| Automation | Playwright (browser tasks) |

## Repository Structure

```
AI-Enterprises-Automation/
├── backend/          # FastAPI API server
├── frontend/         # Next.js web application
├── docs/             # Guides, QA report, architecture
└── README.md         # This file
```

## Quick Start (Local Development)

See [docs/LOCAL_DEVELOPMENT.md](docs/LOCAL_DEVELOPMENT.md) for full instructions.

```bash
# Backend
cd backend && uv sync && cp .env.example .env
uv run alembic upgrade head
uv run uvicorn app.main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend && npm install && cp .env.example .env.local
npm run dev
```

Open http://localhost:3000 (frontend) and http://localhost:8000/docs (API docs).

## Documentation

| Document | Description |
|----------|-------------|
| [Environment Setup](docs/ENVIRONMENT_SETUP.md) | All environment variables and prerequisites |
| [Local Development](docs/LOCAL_DEVELOPMENT.md) | Step-by-step local dev workflow |
| [Architecture Overview](docs/ARCHITECTURE.md) | System design, data flow, auth model |
| [Folder Structure](docs/FOLDER_STRUCTURE.md) | Directory layout explained |
| [QA Report](docs/QA_REPORT.md) | Full module audit for submission readiness |
| [Backend README](backend/README.md) | API server setup and endpoints |
| [Frontend README](frontend/README.md) | Web app setup and module map |

## Modules

| Module | Frontend route | Backend API |
|--------|---------------|-------------|
| Auth | `/login`, `/register` | `/api/v1/auth` |
| Organization | `/settings/organization` | `/api/v1/organizations` |
| Users | `/settings/users` | `/api/v1/users` |
| Roles | `/settings/roles` | `/api/v1/roles` |
| Permissions | `/settings/permissions` | `/api/v1/permissions` |
| Departments | `/settings/departments` | `/api/v1/departments` |
| Teams | `/settings/teams` | `/api/v1/teams` |
| Knowledge Base | `/knowledge-base` | `/api/v1/documents`, `/api/v1/knowledge` |
| AI Employees | `/ai-employees` | `/api/v1/employees` |
| Agent Teams | `/agent-teams` | `/api/v1/agent-teams` |
| Workflows | `/workflows` | `/api/v1/workflows` |
| Research Hub | `/research-hub` | `/api/v1/research-projects` |
| Browser Automation | `/browser-automation` | `/api/v1/browser-profiles`, `/api/v1/browser-tasks` |
| Settings | `/settings` | Composite (IAM + org) |
| Analytics | `/analytics` | `/api/v1/dashboard` + module endpoints |

## Deployment

### Local Development

```bash
# Backend
cd backend && uv sync && cp .env.example .env
uv run alembic upgrade head
uv run uvicorn app.main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend && npm install && cp .env.example .env.local
npm run dev
```

### Frontend Build

```bash
cd frontend
npm install
cp .env.example .env.local   # set NEXT_PUBLIC_API_URL and NEXT_PUBLIC_APP_URL
npm run build
npm run start
```

`NEXT_PUBLIC_*` variables are embedded at build time. Rebuild after changing them.

### Backend Startup

```bash
cd backend
uv sync
cp .env.example .env           # set DATABASE_URL, JWT_SECRET_KEY, GROQ_API_KEY
uv run alembic upgrade head
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

Ensure `uploads/` and `chroma_data/` directories are writable. Set `DEBUG=false` and a strong `JWT_SECRET_KEY` in production.

### PM2 Deployment

Use PM2 to keep backend and frontend running on a VPS or server.

```bash
# Backend
cd backend
uv sync && uv run alembic upgrade head
pm2 start "uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4" --name ai-backend

# Frontend (build first; standalone output requires asset copy — handled by npm run build)
cd frontend
npm install && npm run build
PORT=20380 pm2 start npm --name ai-frontend -- start
```

Set `CORS_ORIGINS`, `NEXT_PUBLIC_API_URL`, and `NEXT_PUBLIC_APP_URL` to your production domain before building and starting. See [docs/ENVIRONMENT_SETUP.md](docs/ENVIRONMENT_SETUP.md) for the full variable reference.

## Health Checks

| Endpoint | Purpose |
|----------|---------|
| `GET /health` | API liveness |
| `GET /api/v1/health/db` | Database connectivity |

## License

Proprietary — AI Enterprises Automation.
