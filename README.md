# techNotes frontend

A complete React/TypeScript workspace for a service team, connected to the [techNotes API](https://github.com/AlexPrixman/techNotes). It replaces the original placeholder screens with working sign-in, service-note and staff-management workflows.

## Features

- Protected deep links, login, persistent session restoration, logout and expired-session handling.
- Notes list with search/status filters, ticket numbers, assignment and clear empty states.
- Create, edit, complete, reassign and delete notes. Employees only access their own work; Managers/Admins can manage the full queue.
- Staff creation, roles, password changes, active status and protected deletion.
- Explicit confirmations for destructive actions, loading/error feedback and retries.
- Responsive layouts, semantic forms, keyboard focus styles and a skip link.

## Stack and architecture

React 19, TypeScript, React Router 7, Vite 8, Vitest/React Testing Library and Playwright. Create React App and unused Font Awesome dependencies/assets have been removed. The production build type-checks the application first.

`AuthProvider` owns session state; `api.ts` centralizes cookie-aware requests and errors; `useResource` cancels obsolete loads; routed pages implement staff workflows. Authorization is enforced independently in the API, not just by hiding links. There are no browser-stored authentication tokens.

## Start both repositories

Requires Node.js 24 and MongoDB 8. Keep the repos in sibling directories:

```text
workspace/
  techNotes/
  technotes_frontend/
```

API terminal:

```sh
cd techNotes
npm ci
cp .env.example .env
# Optional: start local MongoDB with Docker
docker compose up -d mongo
npm run seed
npm run dev
```

Frontend terminal:

```sh
cd technotes_frontend
npm ci
npm run dev
```

Open `http://127.0.0.1:5173`. Development demo usernames: `admin`, `manager`, `employee`; password: `TechNotes123!`. The additive seed preserves existing accounts. If an account existed before seeding, use its existing password.

The Vite server proxies `/api` to `http://127.0.0.1:4000`. Change `API_PROXY_TARGET` for another backend port. For a directly hosted API, set `VITE_API_BASE_URL` to its URL and allow the frontend origin in the API's `CLIENT_ORIGINS`. Prefer a single-origin reverse proxy for reliable session cookies.

## Validation

```sh
npm test
npm run build
npm audit
# Install the browser once:
npx playwright install --with-deps chromium
npm run test:e2e
```

Unit/component tests cover API errors and cancellation, login/deep links, role navigation, note filtering, form payloads, logout and outages.

Playwright starts both a seeded **real API with isolated MongoDB** and the frontend. It verifies complete note/user lifecycles, login/session/logout, Employee/Manager restrictions, API error recovery and responsive overflow on desktop and mobile Chromium. It does not use an Atlas database or mock the application API, except one explicit outage/retry case.

By default Playwright locates `../techNotes` (also supports `../technotes-api`). For another path:

```sh
TECHNOTES_API_DIR=/absolute/path/to/techNotes npm run test:e2e
```

The API must have its dependencies installed. Ports 4001 and 4173 must be free; tests deliberately do not reuse existing servers. The first run downloads MongoDB 8.0.16. Failures retain a trace and screenshot under ignored test-output directories.

## Run the entire stack with Docker

From this repository, with the API at `../techNotes`:

```sh
docker compose up --build -d
docker compose run --rm api npm run seed
```

Open `http://localhost:8080`. `TECHNOTES_API_DIR` can override the API build context. This local stack uses HTTP-compatible development cookies; deployment behind HTTPS must use the production settings described in the API README. MongoDB is persisted in a named volume.

## Deploy

`npm run build` produces `dist/`. Use the Dockerfile/Nginx configuration to serve it and proxy `/api` to the API service. SPA routes fall back to `index.html`, so refreshing `/dash/notes` works. The supplied Docker stack demonstrates the complete routing contract. A static host requires an equivalent SPA fallback and a separately running API.

GitHub Actions installs both repositories, runs frontend unit tests, the production build, dependency audit and desktop/mobile end-to-end tests. `workflow_dispatch` accepts an API branch/ref when testing coordinated changes across repositories.

## Scope

This application manages service notes and staff accounts. It intentionally has no customer billing, payment handling, attachments or email password-reset service. Managers can reset staff passwords through account editing. These are product extensions, not prerequisites for the existing staff workflow.
