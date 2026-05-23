# Brainstorm

Interactive platform for online debates with visual argument mapping. Multi-model AI generates and analyses arguments; debates are rendered as interactive Pro/Against graphs.

**Stack:** pnpm monorepo · NestJS (`apps/api`) · React + Vite (`apps/web`) · PostgreSQL · `@brainstorm/core` shared DTOs/enums.

---

## Prerequisites

- **Node.js** ≥ 22
- **pnpm** ≥ 10 (`npm i -g pnpm`)
- **Docker Desktop** (for PostgreSQL)

---

## Quick start

```bash
# 1. Install all workspace dependencies
pnpm install

# 2. Create local env (defaults work for dev)
cp .env.example .env

# 3. Start PostgreSQL
docker compose up -d

# 4. Build the shared package (api/web import from its dist/)
pnpm --filter @brainstorm/core build

# 5. Run api + web in two terminals
pnpm dev:api   # http://localhost:3000
pnpm dev:web   # http://localhost:5173
```

That's it. The API auto-creates tables on first boot (`synchronize: true` in dev).

> Touching `packages/core` source? Run `pnpm --filter @brainstorm/core dev` in a third terminal — it watches and recompiles automatically.

---

## Project layout

```
brainstorm/
├── apps/
│   ├── api/          # NestJS backend (auth, debates, AI, groups)
│   ├── web/          # React frontend (Vite, HeroUI, React Flow)
│   └── e2e/          # Playwright E2E smoke tests
├── packages/
│   └── core/         # Shared DTOs, enums, types — single source of truth
├── docker-compose.yml
├── .env.example
├── .env.test         # E2E test environment (DATABASE_URL → brainstorm_test)
└── planning.md       # Implementation roadmap (10 batches)
```

---

## Useful commands

| Command                                | What it does                            |
| -------------------------------------- | --------------------------------------- |
| `pnpm install`                         | Install all workspace deps              |
| `pnpm dev:api`                         | Start API in watch mode                 |
| `pnpm dev:web`                         | Start frontend (Vite dev server)        |
| `pnpm build`                           | Build every package recursively         |
| `pnpm --filter @brainstorm/core build` | Build only the shared package           |
| `pnpm --filter @brainstorm/core dev`   | Watch + recompile shared package        |
| `pnpm test:e2e`                        | Run E2E tests (Playwright, headless)    |
| `docker compose up -d`                 | Start PostgreSQL                        |
| `docker compose down -v`               | Stop DB **and wipe data** (clean reset) |

---

## E2E tests (Playwright)

Four smoke specs cover: auth (register → logout → login), debate creation with arguments, AI duplicate-detection dialog (mocked), and group invitations.

### One-time setup

```bash
# 1. Make sure Postgres is running
docker compose up -d

# 2. Create the test database (inside the Docker container)
docker exec -it brainstorm-db psql -U brainstorm -c "CREATE DATABASE brainstorm_test;"

# 3. .env.test already exists at the repo root with sensible defaults — verify
#    DATABASE_URL points at brainstorm_test:
#    DATABASE_URL=postgres://brainstorm:brainstorm@localhost:5432/brainstorm_test

# 4. Install Playwright browsers (first time only)
pnpm --filter ./apps/e2e exec playwright install
```

> No migration step needed. The API runs with `synchronize: true` outside of production, so TypeORM creates all tables automatically when Playwright starts the API process against the test DB.

### Running

```bash
# Headless (default)
pnpm test:e2e

# With visible browser
pnpm --filter ./apps/e2e test:headed

# Interactive Playwright UI
pnpm --filter ./apps/e2e test:ui

# Open HTML report from the last run
pnpm --filter ./apps/e2e exec playwright show-report
```

Playwright auto-starts both `dev:api` and `dev:web` if they are not already running (`reuseExistingServer: true`). `global-setup` truncates all tables (`votes`, `arguments`, `debates`, `groups`, `group_memberships`, `group_invitations`, `users`) before each full run so every execution starts from a clean state.

---

## Verify the API works

```bash
# Register
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"a@b.pl","password":"haslo123","displayName":"Test"}'
# → {"accessToken":"eyJ..."}

# Use the token
curl http://localhost:3000/users/me \
  -H "Authorization: Bearer <accessToken from above>"
# → {"id":"...","email":"a@b.pl","displayName":"Test","createdAt":"..."}
```

---

## Inspect the database (DBeaver)

**New Database Connection → PostgreSQL**, then:

| Field    | Value        |
| -------- | ------------ |
| Host     | `localhost`  |
| Port     | `5432`       |
| Database | `brainstorm` |
| Username | `brainstorm` |
| Password | `brainstorm` |

Test Connection → if prompted, **Download** the PostgreSQL JDBC driver → Finish.

Tables live under `brainstorm → Schemas → public → Tables` (currently `users`; more arrive with later batches per `planning.md`).

---

## Troubleshooting

- **`ECONNREFUSED 127.0.0.1:5432`** — Docker Desktop isn't running, or `docker compose up -d` wasn't executed.
- **`Cannot find module '@brainstorm/core'`** — run `pnpm --filter @brainstorm/core build` (api/web consume the compiled `dist/`, not source).
- **API builds but emits nothing** — stale incremental cache. Delete `apps/api/tsconfig.build.tsbuildinfo` and rebuild.
- **Database in a weird state** — `docker compose down -v` wipes the volume; next `up -d` gives you a clean DB and the API will recreate tables.
- **E2E: `DATABASE_URL is not set`** — `.env.test` is missing or doesn't define `DATABASE_URL`. Recreate it from the example in the [E2E section](#e2e-tests-playwright).
- **E2E: `database "brainstorm_test" does not exist`** — run the `docker exec ... CREATE DATABASE brainstorm_test;` step from the one-time setup.
- **E2E: port 3000/5173 already in use** — Playwright reuses running servers by default; if they're stale, kill them or run `pnpm --filter ./apps/e2e exec playwright test` with `CI=1` to force a fresh start.

---
