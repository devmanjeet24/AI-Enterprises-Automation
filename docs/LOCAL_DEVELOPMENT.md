# Local Development Guide

Step-by-step instructions for running the AI Enterprise Automation Platform on your machine.

## Prerequisites

Install before starting:

```bash
# Python 3.13 + uv
curl -LsSf https://astral.sh/uv/install.sh | sh

# Node.js 20+ (via nvm recommended)
nvm install 20

# PostgreSQL 15+
sudo apt install postgresql postgresql-contrib
```

See [ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md) for full environment variable reference.

---

## 1. Clone and Configure

```bash
git clone <repository-url>
cd AI-Enterprises-Automation
```

### Backend environment

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` — set at minimum:

```env
DATABASE_URL=postgresql://ai_user:yourpassword@localhost:5432/ai_automation
JWT_SECRET_KEY=<run: openssl rand -hex 32>
GROQ_API_KEY=gsk_your-groq-api-key
```

### Frontend environment

```bash
cp frontend/.env.example frontend/.env.local
```

Default values work for local dev:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 2. Database Setup

### Create local database

```bash
sudo -u postgres psql -c "CREATE USER ai_user WITH PASSWORD 'yourpassword';"
sudo -u postgres psql -c "CREATE DATABASE ai_automation OWNER ai_user;"
```

### Run migrations

```bash
cd backend
uv sync
uv run alembic upgrade head
```

Expected output: migrations applied through revision `h7c1d5e26f48`.

---

## 3. Start Backend

```bash
cd backend
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Verify:

```bash
curl http://localhost:8000/health
# {"status":"ok","environment":"development","version":"0.1.0"}

curl http://localhost:8000/api/v1/health/db
# {"status":"ok"}
```

API documentation: http://localhost:8000/docs

---

## 4. Start Frontend

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:3000

---

## 5. First Login

1. Open http://localhost:3000/register
2. Create an organization and admin account
3. You'll be redirected to `/overview`
4. Explore modules via the sidebar

The registration flow automatically:
- Creates your organization
- Seeds default roles (`admin`, `member`)
- Seeds 42 permissions
- Assigns admin role to your account

---

## 6. Optional: Playwright (Browser Automation)

```bash
cd backend
uv run playwright install
```

Required only if you plan to execute browser automation tasks.

---

## 7. Running Tests

### Backend

```bash
cd backend
uv run pytest
```

> Tests use the live database from `.env`. Use a dedicated test database to avoid polluting dev data.

### Frontend

```bash
cd frontend
npm run lint    # ESLint
npm run build   # Production build verification
```

---

## Development Workflow

### Adding a backend endpoint

1. Create/update service in `app/services/`
2. Add Pydantic schemas in `app/schemas/`
3. Create endpoint in `app/api/v1/endpoints/`
4. Register router in `app/api/v1/router.py`
5. Add tests in `tests/`
6. Create Alembic migration if schema changed: `uv run alembic revision --autogenerate -m "description"`

### Adding a frontend module

1. Create API service in `src/lib/api/`
2. Create React Query hook in `src/hooks/`
3. Build components in `src/components/{module}/`
4. Add page in `src/app/(dashboard)/{module}/page.tsx`
5. Add navigation entry in `src/config/dashboard.ts`
6. Add config in `src/config/{module}.ts`

### Hot reload

- **Backend:** `--reload` flag auto-restarts on file changes
- **Frontend:** `npm run dev` uses Next.js fast refresh

---

## Common Issues

| Problem | Solution |
|---------|----------|
| `DATABASE_URL` connection refused | Ensure PostgreSQL is running: `sudo systemctl start postgresql` |
| CORS errors in browser | Verify `CORS_ORIGINS` in `backend/.env` includes `http://localhost:3000` |
| `GROQ_API_KEY` errors on chat/RAG | Set a valid Groq API key in `backend/.env` |
| Frontend can't reach API | Check `NEXT_PUBLIC_API_URL` in `frontend/.env.local` |
| Migration errors | Run `uv run alembic current` to check state; ensure DB exists |
| ChromaDB permission errors | Ensure `chroma_data/` directory is writable |
| Large first startup | `sentence-transformers` downloads embedding model on first use (~130MB) |

---

## Port Reference

| Service | Port | URL |
|---------|------|-----|
| Frontend (dev) | 3000 | http://localhost:3000 |
| Backend (API) | 8000 | http://localhost:8000 |
| Backend (docs) | 8000 | http://localhost:8000/docs |
| PostgreSQL | 5432 | localhost:5432 |

---

## Stopping Services

```bash
# Backend/Frontend: Ctrl+C in terminal
```
