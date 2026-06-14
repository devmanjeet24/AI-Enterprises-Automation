# Environment Setup Guide

Complete reference for configuring the AI Enterprise Automation Platform for local development and production deployment.

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Python | 3.13+ | Backend runtime |
| uv | Latest | Python package manager |
| Node.js | 20+ | Frontend runtime |
| npm | Latest | Frontend package manager |
| PostgreSQL | 15+ | Primary database |
| Groq API key | — | LLM for RAG, chat, research |

### Optional

| Tool | Purpose |
|------|---------|
| Playwright browsers | Browser automation task execution |
| Neon account | Managed PostgreSQL (cloud) |

---

## Backend Environment Variables

Copy the template:

```bash
cp backend/.env.example backend/.env
```

### Required

| Variable | Example | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql://user:pass@localhost:5432/ai_automation` | PostgreSQL connection string. Neon URLs (`postgres://`) are auto-normalized. |
| `JWT_SECRET_KEY` | `openssl rand -hex 32` | Secret for signing JWT tokens. Use a long random string in production. |
| `GROQ_API_KEY` | `gsk_...` | API key from [console.groq.com](https://console.groq.com) |

### Application

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_NAME` | AI Enterprise Automation Platform | Display name |
| `APP_VERSION` | 0.1.0 | Version string |
| `ENVIRONMENT` | development | `development` or `production` |
| `DEBUG` | true | Enable debug mode (set `false` in production) |

### Server

| Variable | Default | Description |
|----------|---------|-------------|
| `HOST` | 0.0.0.0 | Bind address |
| `PORT` | 8000 | Listen port |

### API & CORS

| Variable | Default | Description |
|----------|---------|-------------|
| `API_V1_PREFIX` | /api/v1 | API route prefix |
| `CORS_ORIGINS` | http://localhost:3000,http://127.0.0.1:3000 | Comma-separated frontend origins allowed for cross-origin requests |

**Production example:**

```
CORS_ORIGINS=https://app.yourdomain.com,https://www.yourdomain.com
```

### Authentication

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_ALGORITHM` | HS256 | Signing algorithm |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | 60 | Token lifetime in minutes |

### Knowledge Base / RAG

| Variable | Default | Description |
|----------|---------|-------------|
| `UPLOAD_DIR` | uploads | Directory for uploaded PDF files |
| `MAX_UPLOAD_SIZE_MB` | 25 | Maximum upload size |
| `CHROMA_PERSIST_DIR` | chroma_data | ChromaDB vector store directory |
| `EMBEDDING_MODEL_NAME` | BAAI/bge-small-en-v1.5 | HuggingFace embedding model |
| `RETRIEVAL_TOP_K` | 5 | Number of chunks retrieved for RAG |
| `RETRIEVAL_MIN_SIMILARITY_SCORE` | 0.5 | Minimum similarity for retrieval |

### LLM (Groq)

| Variable | Default | Description |
|----------|---------|-------------|
| `GROQ_MODEL_NAME` | llama-3.3-70b-versatile | Model for RAG answers and AI chat |
| `GROQ_TEMPERATURE` | 0.2 | Response randomness |
| `GROQ_MAX_TOKENS` | 512 | Max tokens per response |

---

## Frontend Environment Variables

Copy the template:

```bash
cp frontend/.env.example frontend/.env.local
```

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_APP_URL` | http://localhost:3000 | Public URL of the frontend app |
| `NEXT_PUBLIC_API_URL` | http://localhost:8000 | Public URL of the backend API |

> **Important:** `NEXT_PUBLIC_*` variables are embedded at **build time**. Changing them in production requires rebuilding the frontend.

### VPS Production Example

```
NEXT_PUBLIC_APP_URL=http://YOUR_VPS_IP:20380
NEXT_PUBLIC_API_URL=http://YOUR_VPS_IP:20378
```

---

## Database Setup

### Option A: Local PostgreSQL

```bash
sudo apt install postgresql
sudo -u postgres createuser ai_user -P
sudo -u postgres createdb ai_automation -O ai_user
```

Set in `backend/.env`:

```
DATABASE_URL=postgresql://ai_user:password@localhost:5432/ai_automation
```

### Option B: Neon (Cloud)

1. Create a project at [neon.tech](https://neon.tech)
2. Copy the connection string
3. Paste into `DATABASE_URL` in `backend/.env`

### Run Migrations

```bash
cd backend
uv run alembic upgrade head
```

---

## Groq API Key

1. Sign up at [console.groq.com](https://console.groq.com)
2. Create an API key
3. Set `GROQ_API_KEY` in `backend/.env`

Required for: knowledge base RAG queries, AI employee chat, research project execution, agent task LLM steps.

---

## Playwright (Browser Automation)

```bash
cd backend
uv run playwright install
```

---

## Verification Checklist

| Step | Command | Expected |
|------|---------|----------|
| Backend health | `curl http://localhost:8000/health` | `{"status":"ok",...}` |
| DB health | `curl http://localhost:8000/api/v1/health/db` | `{"status":"ok"}` |
| Frontend | Open http://localhost:3000 | Landing page loads |
| Register | Create account at `/register` | Redirect to `/overview` |
| API docs | Open http://localhost:8000/docs | Swagger UI |

---

## Security Notes

- Never commit `.env` files (both are gitignored)
- Use strong `JWT_SECRET_KEY` in production (32+ random bytes)
- Set `DEBUG=false` in production
- Restrict `CORS_ORIGINS` to your actual frontend domain
- Use SSL/TLS in production (reverse proxy recommended)
