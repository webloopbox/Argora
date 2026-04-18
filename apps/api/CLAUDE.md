# apps/api - Brainstorm backend

NestJS application. Owns the database, the AI integrations, and every API contract (whose shapes are exported from `@brainstorm/core`).

## Rules specific to the backend

- **Contracts live in `@brainstorm/core`.** Every request/response DTO, every enum, and every shared interface must be imported from there. Do not define controller payload types locally - if something is missing, add it in `packages/core` first.
- **Validation:** use the DTOs from `@brainstorm/core` as the single source of truth for `class-validator` decorators where possible. If a DTO needs runtime validation that doesn't belong in a shared package, wrap it in an API-side schema rather than duplicating the shape.
- **AI service must use a Strategy Pattern.** One interface (e.g. `LlmProvider`) with concrete implementations per vendor (e.g. GPT-4o, Claude, Grok, Mistral). Domain/service code depends on the interface, never on a concrete vendor SDK. Adding a new vendor must not require touching callers.
- **Archiving is soft-delete, not hard-delete.** Every entity that represents debate data (theses, arguments, AI outputs, edits, groups, memberships) has an `archivedOn: Date | null` column. "Deleting" a row means setting `archivedOn = now()`, never `DELETE FROM`. Reason: all data must remain available for later analysis, and hard-deletes destroy the history we rely on. Concretely:
  - Default queries (list, read) MUST filter out rows where `archivedOn IS NOT NULL`. Centralize this in a repository helper / query scope so individual endpoints can't forget.
  - Analytics and admin paths may opt in to reading archived rows explicitly.
  - Cascading: archiving a parent (e.g. a debate) should archive its children in the same transaction, with the same timestamp, so the tree is consistent.
- **Groups and sharing are authorization boundaries.** Debate trees are restricted to group members; public read-only links are a separate, explicit code path. Every endpoint that returns debate data - even a single field - must enforce group membership. Do not add "shortcut" endpoints that skip this check because the data seems harmless.
