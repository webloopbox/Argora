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
│   └── web/          # React frontend (Vite, HeroUI, React Flow)
├── packages/
│   └── core/         # Shared DTOs, enums, types — single source of truth
├── docker-compose.yml
├── .env.example
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
| `docker compose up -d`                 | Start PostgreSQL                        |
| `docker compose down -v`               | Stop DB **and wipe data** (clean reset) |

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

---
