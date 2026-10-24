# apps/api - Argora backend

NestJS 11 application. It owns the PostgreSQL schema, the LLM and embedding
integrations, and the server half of every API contract. The contract shapes
themselves live in [`@argora/core`](../../packages/core), so the frontend
cannot drift away from them.

For what Argora is and how its AI features work, see the
[root README](../../README.md). For running, seeding and debugging the stack
locally, see the [development guide](../../docs/DEVELOPMENT.md).

---

## Modules

| Path | Responsibility |
| --- | --- |
| `src/auth` | Registration, login, JWT strategy, the `@CurrentUser` decorator, optional-auth guard for public reads |
| `src/users` | Account records and the directory search that group invitations target |
| `src/debates` | Theses, visibility mode, and the immutable debate language |
| `src/arguments` | Graph nodes, weight and sentiment, thesis-relative stance (`effective-stance.ts`) |
| `src/votes` | Votes for and against, soft-archived so a retraction stays auditable |
| `src/groups` | Private groups, memberships, and invitations awaiting acceptance |
| `src/ai` | `LlmRegistry`, the per-vendor `LlmProvider` implementations, `EmbeddingService`, prompt builders |
| `src/stats` | Dashboard aggregates |
| `src/common` | `VisibilityGuard` and the soft-delete read helper |
| `src/database` | TypeORM connection and entity registration |

---

## Worth knowing before changing code here

- **Contracts belong to `@argora/core`.** A DTO declared locally is not a
  shortcut, it is the mechanism by which the two apps stop agreeing.
- **`VisibilityGuard` is the authorization check for every debate-scoped
  route**, the AI and vote routes included. It resolves the debate from
  `:debateId`, `:id`, `:argumentId` or the request body, then attaches the row
  as `req.debate`. Read it from there rather than loading the debate again, and
  never repeat the membership check inline.
- **Deleting means `archivedOn = now()`, never `DELETE FROM`.** Every table
  holding debate data carries the column, and reads go through `activeWhere`
  in `src/common/repository/soft-delete.ts`.
- **`synchronize` is enabled outside production**, and it drops any index
  missing from entity metadata on every boot. That is why the two partial
  unique indexes are declared as `@Index(..., { unique: true, where: ... })`
  on `Vote` and `GroupInvitation` instead of in SQL.
- **Vendors are pluggable and domain code stays vendor-agnostic.** Five
  `LlmProvider` implementations exist; `LlmRegistry` instantiates only those
  whose credentials are present, so an empty registry is a valid boot state
  in which the app runs with its AI features unavailable.
- **The duplicate threshold belongs to the embedding model**, not to the
  domain. Read it from `EmbeddingService.duplicateThreshold`; the per-vendor
  calibration differs enough that a copied constant fires the gate on every
  submission.
- **Exception messages are written in Polish** and reach the user verbatim.
  They do not pass through the frontend dictionary, so they do not follow the
  interface language switch.

`CLAUDE.md` in this folder carries the full set of backend rules together with
the measurements behind each one.

---

## Commands

Run from the repository root, where the workspace scripts live.

| Command | What it does |
| --- | --- |
| `pnpm dev:api` | Start in watch mode on `PORT` (default 3000) |
| `pnpm --filter ./apps/api build` | Compile to `dist/` |
| `pnpm --filter ./apps/api lint` | ESLint and Prettier, auto-fixing |
| `pnpm --filter ./apps/api start:prod` | Run the compiled output |

The shared package has to be built before the API starts (`pnpm build:core`),
because the API imports its compiled `dist/`.
