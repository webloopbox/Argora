# packages/core - `@brainstorm/core`

Shared library. Single source of truth for every API contract: DTOs, enums, and domain interfaces.

## Rules specific to the shared library

- **No runtime dependencies on anything app-specific.** This package must be safely importable from both `apps/api` (Node/NestJS) and `apps/web` (browser/React). Do not import Node-only modules (`fs`, `path`, server-side SDKs) or browser-only modules (`window`, DOM) here.
- **Types and contracts only.** No business logic, no database code, no network calls. If something needs to _do_ work, it belongs in `apps/api` or `apps/web`. If it just describes shape, it belongs here.
- **`class-validator` decorators are allowed on DTOs** because both sides benefit from the same validation rules. Keep the decorators declarative - no side effects in validator functions.
- **Organize by kind, not by feature:**
  - `src/dto/` - DTOs (request/response payloads with validation).
  - `src/enums/` - statuses, kinds, discriminators.
  - `src/types/` - pure domain interfaces (no decorators).
- **Every public symbol must be re-exported** from the package entry point (`src/index.ts` or per-folder `index.ts`), so consumers import from `@brainstorm/core` rather than from deep paths.
- **Breaking changes hurt both apps at once.** When renaming or restructuring a shared type, update `apps/api` and `apps/web` in the same change.

## Things to fill in as conventions emerge

- Naming convention for DTOs: use `CreateDebateDto` suffix.
- Enums must be string enums (e.g. `Pro = 'pro'`), not numeric. String values land directly in Postgres columns and remain readable in raw queries and analytics without needing the application code to interpret them.
