# Backend — AI Enterprise Automation Platform

FastAPI API server providing multi-tenant RBAC, knowledge management, AI employee orchestration, workflows, research, and browser automation.

## Prerequisites

- Python 3.13+
- [uv](https://docs.astral.sh/uv/) package manager
- PostgreSQL 15+ (local or Neon)
- Groq API key (for RAG and AI features)

## Setup

```bash
cd backend

# Install dependencies
uv sync

# Configure environment
cp .env.example .env
# Edit: DATABASE_URL, JWT_SECRET_KEY, GROQ_API_KEY

# Run migrations
uv run alembic upgrade head

# Start development server
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

API docs: http://localhost:8000/docs

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `JWT_SECRET_KEY` | Yes | — | JWT signing secret |
| `GROQ_API_KEY` | Yes | — | Groq LLM API key |
| `APP_NAME` | No | AI Enterprise Automation Platform | App title |
| `APP_VERSION` | No | 0.1.0 | Version string |
| `ENVIRONMENT` | No | development | Environment name |
| `DEBUG` | No | true | Debug mode |
| `HOST` | No | 0.0.0.0 | Bind host |
| `PORT` | No | 8000 | Bind port |
| `API_V1_PREFIX` | No | /api/v1 | API route prefix |
| `CORS_ORIGINS` | No | http://localhost:3000 | Comma-separated allowed origins |
| `JWT_ALGORITHM` | No | HS256 | JWT algorithm |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | No | 60 | Token TTL |
| `UPLOAD_DIR` | No | uploads | PDF upload directory |
| `MAX_UPLOAD_SIZE_MB` | No | 25 | Max upload size |
| `CHROMA_PERSIST_DIR` | No | chroma_data | ChromaDB storage path |
| `EMBEDDING_MODEL_NAME` | No | BAAI/bge-small-en-v1.5 | Embedding model |
| `RETRIEVAL_TOP_K` | No | 5 | RAG retrieval count |
| `RETRIEVAL_MIN_SIMILARITY_SCORE` | No | 0.5 | RAG similarity threshold |
| `GROQ_MODEL_NAME` | No | llama-3.3-70b-versatile | LLM model |
| `GROQ_TEMPERATURE` | No | 0.2 | LLM temperature |
| `GROQ_MAX_TOKENS` | No | 512 | LLM max tokens |

See `.env.example` for a copy-paste template.

## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI entry point
│   ├── config.py            # Pydantic settings
│   ├── api/
│   │   ├── deps.py          # JWT auth dependency
│   │   └── v1/
│   │       ├── router.py    # Route aggregator
│   │       └── endpoints/   # Per-module handlers
│   ├── core/                # Security, permissions, exceptions
│   ├── db/                  # SQLAlchemy session
│   ├── models/              # ORM models (30+ tables)
│   ├── schemas/             # Pydantic request/response
│   └── services/            # Business logic
├── alembic/                 # Database migrations (24 revisions)
├── tests/                   # Pytest suite (28 modules)
├── pyproject.toml
└── uv.lock
```

## API Modules

All routes are prefixed with `/api/v1`.

| Module | Prefix | Key operations |
|--------|--------|----------------|
| Auth | `/auth` | register, login, me |
| Organizations | `/organizations` | get/update org profile |
| Users | `/users` | list, update, role assignment |
| Roles | `/roles` | CRUD |
| Permissions | `/permissions` | CRUD + role grants |
| Departments | `/departments` | CRUD |
| Teams | `/teams` | CRUD |
| Documents | `/documents` | upload, process, chunk, embed, search |
| Knowledge | `/knowledge` | RAG query |
| Employees | `/employees` | CRUD, chat, knowledge/tools |
| Agent Teams | `/agent-teams` | CRUD, members, tasks |
| Agent Tasks | `/agent-tasks` | list, run |
| Workflows | `/workflows` | CRUD, run, executions |
| Research Projects | `/research-projects` | CRUD, run, reports, export |
| Browser Profiles | `/browser-profiles` | CRUD |
| Browser Tasks | `/browser-tasks` | CRUD, run, analytics |
| Dashboard | `/dashboard` | org overview counts |
| Conversations | `/conversations` | chat history |
| Health | `/health` | liveness + DB check |

## Database

```bash
# Apply all migrations
uv run alembic upgrade head

# Create a new migration
uv run alembic revision --autogenerate -m "description"

# Check current revision
uv run alembic current
```

Migrations live in `alembic/versions/`. New organizations also receive seeded roles and permissions at registration.

### Persistent Storage

| Path | Purpose |
|------|---------|
| `uploads/` | Uploaded PDF documents |
| `chroma_data/` | ChromaDB vector embeddings |

Ensure these directories are writable and backed up in production.

## Testing

```bash
uv run pytest              # Full suite (requires .env with DATABASE_URL)
uv run pytest -v tests/test_auth.py  # Single module
```

Tests use the live PostgreSQL database configured in `.env`. Use a dedicated test database for CI.

## Playwright (Browser Automation)

```bash
uv run playwright install
```

Required for executing browser automation tasks.

## Production Startup

```bash
# 1. Set production .env (DEBUG=false, strong JWT_SECRET_KEY)
# 2. Run migrations
uv run alembic upgrade head

# 3. Start with multiple workers
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## Health Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | API liveness |
| GET | `/api/v1/health` | Versioned health |
| GET | `/api/v1/health/db` | Database connectivity |
