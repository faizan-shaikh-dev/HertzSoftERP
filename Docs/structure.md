# Suggested Project Structure

This is a proposed structure for a Next.js (App Router) frontend and Node/Express backend. Keep generated UI components in JSX, not TSX, unless the company explicitly changes this decision.

```text
hertzsoft-crm/
├── README.md
├── docs/
│   ├── context.md
│   ├── design.md
│   ├── structure.md
│   ├── database.md
│   ├── api.md
│   └── implementation-plan.md
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── login/
│   │   │   │   │   └── page.jsx
│   │   │   │   ├── forgot-password/
│   │   │   │   │   └── page.jsx
│   │   │   │   └── layout.jsx
│   │   │   ├── (dashboard)/
│   │   │   │   ├── dashboard/
│   │   │   │   │   └── page.jsx
│   │   │   │   ├── leads/
│   │   │   │   │   ├── [id]/
│   │   │   │   │   │   └── page.jsx
│   │   │   │   │   └── page.jsx
│   │   │   │   ├── pipeline/
│   │   │   │   │   └── page.jsx
│   │   │   │   ├── clients/
│   │   │   │   │   ├── [id]/
│   │   │   │   │   │   └── page.jsx
│   │   │   │   │   └── page.jsx
│   │   │   │   ├── tasks/
│   │   │   │   │   └── page.jsx
│   │   │   │   └── layout.jsx
│   │   │   ├── layout.jsx
│   │   │   ├── page.jsx
│   │   │   ├── providers.jsx
│   │   │   └── globals.css
│   │   ├── assets/
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   ├── NotificationContext.jsx
│   │   │   └── ThemeContext.jsx
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── layout/
│   │   │   ├── data-table/
│   │   │   └── feedback/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── leads/
│   │   │   ├── follow-ups/
│   │   │   ├── clients/
│   │   │   └── tasks/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── services/
│   │   │   ├── apiClient.js
│   │   │   ├── authService.js
│   │   │   ├── userService.js
│   │   │   ├── dashboardService.js
│   │   │   ├── leadService.js
│   │   │   ├── followUpService.js
│   │   │   ├── clientService.js
│   │   │   └── taskService.js
│   │   ├── utils/
│   │   └── styles/
│   ├── next.config.mjs
│   ├── jsconfig.json
│   ├── tailwind.config.js
│   ├── postcss.config.mjs
│   ├── .env.example
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── server.js
│   │   ├── config/
│   │   ├── routes/
│   │   ├── middleware/
│   │   │   ├── authenticate.js
│   │   │   ├── authorize.js
│   │   │   ├── validate.js
│   │   │   └── errorHandler.js
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── dashboard/
│   │   │   ├── leads/
│   │   │   ├── follow-ups/
│   │   │   ├── clients/
│   │   │   └── tasks/
│   │   ├── shared/
│   │   │   ├── database/
│   │   │   ├── logger/
│   │   │   └── errors/
│   │   └── jobs/
│   ├── migrations/
│   ├── tests/
│   ├── .env.example
│   └── package.json
├── database/
│   ├── database_schema.sql
│   └── seeds/
└── .gitignore
```

## Module pattern
Each backend module can contain:
```text
leads/
├── lead.routes.js
├── lead.controller.js
├── lead.service.js
├── lead.repository.js
├── lead.validation.js
└── lead.test.js
```

Use only the layers that add value. For a small module, a separate repository may be unnecessary. Do not put all business logic in routes/controllers.

## Frontend Context (Global State Management)
React Contexts live in `src/context/` to manage cross-cutting client state without prop drilling. Mount them inside `src/app/providers.jsx`:
- `AuthContext.jsx` — Authenticated user state, active role/permissions, token lifecycle, and `login`/`logout` actions.
- `NotificationContext.jsx` — Central toast and alert dispatch system (e.g., success messages, validation errors, and duplicate phone warnings).
- `ThemeContext.jsx` — UI preferences, sidebar collapsed states, and modal dialog managers.

## Centralized Services Pattern (API Calls in `src/services/`)
All backend HTTP calls are isolated in `src/services/` so that UI components and hooks never make raw `fetch` or `axios` calls directly:
- `apiClient.js` — Configured Axios or Fetch client with interceptors for baseURL (`NEXT_PUBLIC_API_URL`), bearer token attachment, 401 handling, and standardized error normalization.
- `authService.js` — `login()`, `logout()`, `getMe()`, `forgotPassword()`, `resetPassword()`
- `userService.js` — `getUsers()`, `createUser()`, `updateUser()`
- `dashboardService.js` — `getSummary()`
- `leadService.js` — `getLeads()`, `getLeadById()`, `createLead()`, `updateLead()`, `getPipeline()`, `convertToClient()`
- `followUpService.js` — `getFollowUps()`, `createFollowUp()`, `updateFollowUp()`
- `clientService.js` — `getClients()`, `getClientById()`, `createClient()`, `updateClient()`, `archiveClient()`, `getOnboarding()`, `updateOnboarding()`
- `taskService.js` — `getTasks()`, `createTask()`, `updateTask()`, `completeTask()`

## Frontend feature pattern
Feature logic, UI components, and domain hooks are modularized within `src/features/` and consumed by Next.js `app/` routes. Hooks consume API calls from `src/services/`:
```text
leads/
├── components/
│   ├── LeadTable.jsx
│   ├── LeadDrawer.jsx
│   ├── LeadFormModal.jsx
│   └── PipelineBoard.jsx
├── hooks/
│   └── useLeads.js           # Calls functions from src/services/leadService.js
├── leadValidation.js
└── index.js
```

## Environment variables
Frontend should contain only public configuration prefixed with `NEXT_PUBLIC_` (e.g. `NEXT_PUBLIC_API_URL=/api/v1`). Backend secrets belong only in backend environment configuration. Commit `.env.example`, never real `.env` files.

## Antigravity agent instructions
- Read `context.md`, `design.md`, `database.md`, and `implementation-plan.md` before coding.
- Inspect the existing repository before creating or overwriting files.
- Do not rewrite unrelated files.
- Use JSX, not TSX.
- Build Phase 1 only unless explicitly instructed otherwise.
- Add migrations and tests with schema/business-rule changes.
- Report files changed, commands run, tests passed/failed, and unresolved decisions.
