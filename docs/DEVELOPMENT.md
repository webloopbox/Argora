# Development guide

Everything needed to run, seed, test and debug Argora locally. For what the
project is and how the AI features work, see the [README](../README.md).

---

## Prerequisites

| Tool | Version | Notes |
| --- | --- | --- |
| Node.js | ≥ 22 | |
| pnpm | ≥ 10 | `npm i -g pnpm` |
| Docker Desktop | any current | runs PostgreSQL 16 with pgvector |

---

## First run

```bash
pnpm install

# defaults in .env.example work for local development
cp .env.example .env

# PostgreSQL on :5432, pgvector extension and the partial unique
# indexes are applied by db/init.sql on first container start
docker compose up -d

# api and web import the compiled dist/ of the shared package,
# so it has to be built before they start
pnpm --filter @brainstorm/core build

# two terminals
pnpm dev:api   # http://localhost:3000
pnpm dev:web   # http://localhost:5173
```

The API runs with `synchronize: true` outside production, so TypeORM creates
every table on first boot. No migration step.

> Editing `packages/core`? Run `pnpm --filter @brainstorm/core dev` in a third
> terminal - it watches and recompiles, otherwise the apps keep consuming the
> previous build.

---

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string. |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | yes | Token signing and lifetime. |
| `WEB_ORIGIN` | yes | CORS origin for the Vite dev server. |
| `PORT` | no | API port, defaults to 3000. |
| `IBM_CLOUD_API_KEY`, `WATSONX_PROJECT_ID`, `WATSONX_URL` | no | Enables the three watsonx.ai models and the Granite embedding provider. |
| `TOGETHER_API_KEY` | no | Enables the three together.ai serverless models. |
| `GEMINI_API_KEY` | no | Enables Gemini generation and the Gemini embedding provider. |
| `EMBEDDING_PROVIDER` | no | `watsonx` or `gemini`. Defaults to Gemini when both are configured. |
| `WATSONX_EMBEDDING_MODEL_ID` | no | Overrides the default `ibm/granite-embedding-278m-multilingual`. |
| `DUPLICATE_THRESHOLD` | no | Cosine cut-off for the duplicate gate. Defaults to `0.80`. |

The LLM registry instantiates whatever has credentials and skips the rest, so
an empty registry is a valid boot state: the app starts and the model picker is
empty. `LlmProvider` implementations for Claude and GPT exist in
`apps/api/src/ai/providers/` but are not wired into the registry - enabling them
is a code change, not a configuration change.

**Switching `EMBEDDING_PROVIDER` invalidates every stored embedding.** Vectors
from different models are not comparable. Re-embed the corpus afterwards:

```bash
node scripts/reembed-existing.mjs
```

---

## Commands

| Command | What it does |
| --- | --- |
| `pnpm dev:api` | API in watch mode |
| `pnpm dev:web` | Frontend (Vite dev server) |
| `pnpm build` | Build every workspace package |
| `pnpm --filter @brainstorm/core build` | Build only the shared contract package |
| `pnpm --filter @brainstorm/core dev` | Watch and recompile the shared package |
| `pnpm --filter ./apps/web lint` | ESLint over the frontend |
| `pnpm --filter ./apps/api lint` | ESLint + Prettier over the backend (auto-fixes) |
| `pnpm test:e2e` | Playwright suite, headless |
| `docker compose up -d` | Start PostgreSQL |
| `docker compose down -v` | Stop the database **and wipe its volume** |

---

## Seed data

Each script registers its own demo accounts and builds a complete debate,
including votes. They are idempotent on the account side: re-running logs in
instead of failing on a duplicate e-mail.

| Command | Content |
| --- | --- |
| `pnpm seed:demo` | Small debate shaped to trigger the duplicate dialog |
| `pnpm seed:seminar` | Private group with an invitation flow |
| `pnpm seed:ev` / `pnpm seed:ev:en` | Electric cars, Polish / English |
| `pnpm seed:nuclear:pl` | Nuclear energy, four levels deep |
| `pnpm seed:remote:pl` | Remote work |
| `pnpm seed:agi:en` | Large English debate on AGI |
| `pnpm seed:additional:en` | Extra English debates for the dashboard |

Shared helpers live in `scripts/lib/`: the `.env` reader, the HTTP client with
its register-or-login step, mirrors of the domain rules (effective stance,
sentiment, cosine similarity) and the synthesis prompt copy used by the
evaluation scripts.

---

## Evaluation scripts

These were written to produce the measurements in the thesis and need vendor
credentials plus `DATABASE_URL`. They are read-mostly, but they do call paid
APIs.

```bash
node scripts/eval-duplicate-detection.mjs   # threshold sweep + lexical baseline
node scripts/eval-model-comparison.mjs      # generation and side classification
node scripts/eval-subgraph-synthesis.mjs    # synthesis coverage and attribution
node scripts/eval-latency-cost.mjs          # latency and billed tokens per model
node scripts/verify-requirements.mjs        # end-to-end requirement checks
```

Most of them cache model responses to a local file so an interrupted run
resumes without paying twice. `eval-latency-cost.mjs` deliberately does not -
timing a cached response would measure nothing.

---

## End-to-end tests

Four smoke specs cover registration and login, debate creation with arguments,
the duplicate-detection dialog, and group invitations.

### One-time setup

```bash
docker compose up -d

docker exec -it brainstorm-db \
  psql -U brainstorm -c "CREATE DATABASE brainstorm_test;"

# .env.test at the repo root must point DATABASE_URL at brainstorm_test:
# DATABASE_URL=postgres://brainstorm:brainstorm@localhost:5432/brainstorm_test

pnpm --filter ./apps/e2e exec playwright install
```

### Running

```bash
pnpm test:e2e                                    # headless
pnpm --filter ./apps/e2e test:headed             # visible browser
pnpm --filter ./apps/e2e test:ui                 # interactive runner
pnpm --filter ./apps/e2e exec playwright show-report
```

Playwright starts `dev:api` and `dev:web` itself unless they are already
running (`reuseExistingServer: true`). `global-setup` truncates every table in
the **test** database before a run.

> The suite writes to whatever `DATABASE_URL` in `.env.test` points at. Keep it
> on `brainstorm_test`; pointing it at the development database destroys seeded
> demo data.

---

## Checking the API by hand

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"a@b.pl","password":"haslo123","displayName":"Test"}'
# → {"accessToken":"eyJ..."}

curl http://localhost:3000/users/me -H "Authorization: Bearer <token>"
# → {"id":"...","email":"a@b.pl","displayName":"Test","createdAt":"..."}
```

Debate-scoped routes go through `VisibilityGuard`, so a private-group debate
returns 403 for a non-member and 404 for an id that does not exist or has been
archived.

---

## Inspecting the database

| Field | Value |
| --- | --- |
| Host | `localhost` |
| Port | `5432` |
| Database | `brainstorm` |
| User / password | `brainstorm` / `brainstorm` |

Nothing is ever hard-deleted. Rows carry `archived_on`, and every read path
filters on `archived_on IS NULL` through the `activeWhere` helper - so a table
that looks wrong in a client is usually showing archived rows too.

Embeddings are stored in `arguments.embedding` as `jsonb`. The pgvector
extension is enabled by `db/init.sql` ahead of the migration to a native
`vector` column.

---

## Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| `ECONNREFUSED 127.0.0.1:5432` | Docker Desktop is not running, or `docker compose up -d` was never executed. |
| `Cannot find module '@brainstorm/core'` | Build the shared package: `pnpm --filter @brainstorm/core build`. |
| API builds but emits nothing | Stale incremental cache: delete `apps/api/tsconfig.build.tsbuildinfo` and rebuild. |
| Model picker is empty | No vendor credentials in `.env`. The registry skips vendors whose keys are absent. |
| Duplicate detection never fires | No embedding provider configured, or existing rows have no vectors yet - run `scripts/reembed-existing.mjs`. |
| AI call returns 429 | Per-route throttle, or the vendor's own rate limit mapped to 429. Wait and retry. |
| Database in a strange state | `docker compose down -v` wipes the volume; the next `up -d` gives a clean database. This also deletes seeded demo data. |
| E2E: `DATABASE_URL is not set` | `.env.test` is missing or does not define it. |
| E2E: `database "brainstorm_test" does not exist` | Run the `CREATE DATABASE` step from the one-time setup. |
| E2E: port 3000 or 5173 in use | Playwright reuses running servers; kill stale ones or run with `CI=1` to force fresh processes. |
