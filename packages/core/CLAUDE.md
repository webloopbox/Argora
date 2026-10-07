# packages/core - `@argora/core`

Shared library. Single source of truth for every API contract: DTOs, enums, and domain interfaces.

## Rules specific to the shared library

- **No runtime dependencies on anything app-specific.** This package must be safely importable from both `apps/api` (Node/NestJS) and `apps/web` (browser/React). Do not import Node-only modules (`fs`, `path`, server-side SDKs) or browser-only modules (`window`, DOM) here.
- **Types and contracts only.** No business logic, no database code, no network calls. If something needs to _do_ work, it belongs in `apps/api` or `apps/web`. If it just describes shape, it belongs here.
- **`class-validator` decorators are allowed on DTOs** because both sides benefit from the same validation rules. Keep the decorators declarative - no side effects in validator functions.
- **A limit a DTO enforces is part of the contract, so it is declared here as a named constant** and exported next to that DTO (`ARGUMENT_MIN` and `ARGUMENT_MAX` beside `CreateArgumentDto`). The decorator, the client-side check in the form, and the validation message in `ui.ts` all read the same constant. A bare number repeated in a second file is the same defect as a duplicated DTO: the two drift, and the user meets a limit the message does not describe.
- **Organize by kind, not by feature:**
  - `src/dto/` - DTOs (request/response payloads with validation).
  - `src/enums/` - statuses, kinds, discriminators.
  - `src/types/` - pure domain interfaces (no decorators). Currently empty: the shapes the apps share are all response DTOs, so they live in `src/dto/` next to the request payloads they answer.
- **Every public symbol must be re-exported** from the package entry point (`src/index.ts` re-exports `./dto`, `./enums` and `./types`), so consumers import from `@argora/core` rather than from deep paths.
- **Both apps consume the built output, not the sources.** There is no path alias to `packages/core/src`, so a change here is invisible to `apps/api` and `apps/web` until the package is rebuilt. A type error that makes no sense against the code you are looking at is usually a stale `dist`.
- **Breaking changes hurt both apps at once.** When renaming or restructuring a shared type, update `apps/api` and `apps/web` in the same change.

## Things to fill in as conventions emerge

- Naming convention for DTOs: use `CreateDebateDto` suffix.
- Enums must be string enums (e.g. `Pro = 'pro'`), not numeric. String values land directly in Postgres columns and remain readable in raw queries and analytics without needing the application code to interpret them.
