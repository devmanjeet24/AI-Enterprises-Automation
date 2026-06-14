# Frontend — AI Enterprise Automation Platform

Next.js 16 web application for managing AI employees, knowledge bases, workflows, research, browser automation, and organizational settings.

## Prerequisites

- Node.js 20+
- npm
- Running backend API (default: http://localhost:8000)

## Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local

# Start development server
npm run dev
```

App: http://localhost:3000

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_APP_URL` | No | http://localhost:3000 | Frontend base URL |
| `NEXT_PUBLIC_API_URL` | No | http://localhost:8000 | Backend API base URL |

Set these at **build time** for production. Changes require a rebuild.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server with hot reload |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint check |

## Project Structure

```
frontend/src/
├── app/                    # Next.js App Router pages (38 routes)
│   ├── (site)/             # Public landing page
│   ├── (auth)/             # Login, register
│   └── (dashboard)/        # Authenticated app shell
├── components/             # UI components by module
├── config/                 # Navigation, module config
├── hooks/                  # React Query data hooks
├── lib/
│   ├── api/                # API client + per-module services
│   ├── auth/               # Session, permissions, validation
│   └── analytics/          # Analytics computation utilities
├── providers/              # Query provider, toast
├── store/                  # Redux (auth, app, UI slices)
└── middleware.ts           # Server-side auth redirects
```

## Module Map

| Module | Routes | API service | Hook |
|--------|--------|-------------|------|
| Auth | `/login`, `/register` | `lib/api/auth.ts` | Redux auth slice |
| Organization | `/settings/organization` | `lib/api/organizations.ts` | `use-settings.ts` |
| Users | `/settings/users`, `[id]` | `lib/api/users.ts` | `use-users.ts` |
| Roles | `/settings/roles`, `[id]` | `lib/api/roles.ts` | `use-roles.ts` |
| Permissions | `/settings/permissions`, `[id]` | `lib/api/permissions.ts` | `use-permissions.ts` |
| Departments | `/settings/departments`, `[id]` | `lib/api/departments.ts` | `use-departments.ts` |
| Teams | `/settings/teams`, `[id]` | `lib/api/teams.ts` | `use-teams.ts` |
| Knowledge Base | `/knowledge-base`, `[id]` | `lib/api/documents.ts`, `knowledge.ts` | `use-knowledge-base.ts` |
| AI Employees | `/ai-employees`, `[id]` | `lib/api/employees.ts` | `use-ai-employees.ts` |
| Agent Teams | `/agent-teams`, `[id]` | `lib/api/agent-teams.ts` | `use-agent-teams.ts` |
| Workflows | `/workflows`, `[id]` | `lib/api/workflows.ts` | `use-workflows.ts` |
| Research Hub | `/research-hub`, `[id]` | `lib/api/research-projects.ts` | `use-research-projects.ts` |
| Browser Automation | `/browser-automation`, profiles/tasks | `lib/api/browser-*.ts` | `use-browser-automation.ts` |
| Settings | `/settings` | `lib/api/dashboard.ts` | `use-dashboard-overview.ts` |
| Analytics | `/analytics/*` (9 pages) | Multiple + `lib/analytics/` | `use-*-analytics.ts` |

## Architecture Patterns

### Data Fetching

- **TanStack React Query** for server state (caching, retries, invalidation).
- **Redux Toolkit** for auth token, user session, and UI state.
- Shared `fetch` client in `lib/api/client.ts` with Bearer token injection.

### UI States

Every data-driven page implements:

1. **Loading** — skeleton components
2. **Error** — retry-capable error display
3. **Empty** — guided empty states on list views
4. **Access denied** — dedicated 403 screens (settings, research, browser, analytics)

### Auth Flow

1. Login/register → JWT stored in cookie + localStorage
2. `AuthBootstrap` hydrates Redux from storage on load
3. `AuthGuard` wraps dashboard layout (client-side)
4. `middleware.ts` enforces cookie check on protected routes (server-side)

### Permissions

Permission slugs defined in `lib/auth/permissions.ts`. UI gates create/edit/delete actions via `hasPermission()`. Backend enforces via JWT + role permissions.

## Navigation

- **Main sidebar:** `config/dashboard.ts` — Overview, AI Employees, Knowledge Base, Agent Teams, Workflows, Research Hub, Browser Automation, Analytics
- **Settings hub:** `config/settings.ts` — Organization, Users, Departments, Teams, Roles, Permissions
- **Analytics sub-nav:** `config/analytics.ts` — 9 analytics views

## Production Build

```bash
npm run build
npm run start
```

## Additional Docs

- [Auth integration guide](docs/auth-integration.md) — detailed auth flow with diagrams
- [QA Report](../docs/QA_REPORT.md) — full module audit
