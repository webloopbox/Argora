# Argora

## Project Overview

**Argora** is an interactive platform for conducting online debates with visual argument mapping. It uses AI to analyze, generate content, and visualize discussion flow.

## Technical Stack

- **Workspace:** `pnpm` monorepo.
- **Backend:** NestJS (`apps/api`).
- **Frontend:** React + TypeScript (`apps/web`).
- **Shared library:** `@argora/core` (`packages/core`) - single source of truth for DTOs, Enums, and Interfaces.
- **Database:** PostgreSQL for archiving and analysis.

## Core Logic & Features

- **Debate structure:**
  - Users propose a central thesis.
  - Arguments are added as **Pro** - green tiles - or **Against** - red tiles.
  - Visualization is rendered as an interactive graph.
- **AI capabilities:**
  - **Multi-model generation:** real-time argument generation. The user picks the model from whatever `LlmRegistry` (`apps/api/src/ai/llm-registry.ts`) instantiated at boot from the credentials in `.env` - today that is watsonx.ai (three foundation models), together.ai (three serverless models) and Gemini. `LlmProvider` implementations for Claude and GPT exist in `apps/api/src/ai/providers/` but are not wired into the registry, so no configuration enables them without a code change.
  - **Summarization:** automated synthesis of complex argument trees or full debates.
  - **Lasso context extraction:** the user draws a freehand lasso polygon on the graph to select a subset of nodes. The system maps canvas coordinates to matching argument IDs and posts them to `POST /ai/synthesize`. The API intersects that list with the debate's own arguments, drops anything foreign, and hands the model one entry per selected node carrying the author, vote counts, weight, sentiment, thesis-relative stance and the parent's content, so parent-child relations survive without nesting. The AI produces an on-demand synthesis focused exclusively on the selected nodes - not the full debate tree.
  - **Duplicate detection:** before a new argument is persisted, the AI compares its semantic meaning against the active arguments of the same debate **and the same stored side**, excluding the node it replies to (a reply naturally echoes its parent's wording). Comparison is cosine similarity over embeddings, and a hit is anything at or above `DUPLICATE_THRESHOLD` (0.80, overridable from the environment). If a near-duplicate is detected the user is presented with a choice: (a) **merge** - cast a vote to raise the existing argument's weight, or (b) **add as nuance** - publish the new argument if it genuinely contributes something the existing one lacks. This prevents semantic spam and keeps every graph node informationally unique.
- **Argument weight & sentiment visualization:**
  - Argument weight = |Votes For| + |Votes Against| - absolute sum, not net score. Every reaction increases an argument's visibility in the graph regardless of direction; a controversial argument ranks higher than one that was ignored.
  - Each argument tile displays a small **sentiment badge** showing the dominant mood: green (For votes dominate), red (Against votes dominate), orange (votes are balanced - high controversy/polarization), neutral grey (no votes yet). The controversy state is entered when `|for - against| / weight < 0.2`. That ratio lives in `ArgumentsService` on the server and is mirrored in `VoteControls.tsx` for optimistic UI - the one deliberate duplication of a domain constant, and the two copies must move together.
- **Collaboration - two visibility modes:**
  - **Public debates:** any logged-in user can create a publicly visible debate. Anyone logged in can participate (arguments, votes); anonymous visitors can read but not contribute. Public debates are the content of the main dashboard.
  - **Private discussion groups:** members-only debate trees. Entry requires the user to be invited by the group owner **and** to accept the invitation themselves. Invitations are **system-internal**: the owner searches the registered user directory and sends an invite to that account (not by email). The invite stays pending until the invitee confirms it from their own panel; only then does it become a membership. Private groups live in a dedicated view, separate from the public dashboard.

## Development Guardrails

- **Architecture:**
  - Every API contract MUST be defined in `@argora/core`. Never duplicate a DTO, enum, or interface between `apps/api` and `apps/web`.
  - The AI service must use a provider-agnostic Strategy Pattern to support multiple LLM vendors. Do not hard-code a single vendor in domain logic.
- **Data flow:** all data from the backend must be archived in PostgreSQL for later analysis.
- **UI/UX:** maintain strict visual coding - green for support, red for opposition. This mapping is load-bearing and must not be reused for other semantics. **Orange is reserved exclusively for the "high controversy / balanced votes" sentiment badge state** - do not reuse it for any other UI meaning.
- **Duplicate detection is mandatory:** every new argument submission must pass through the AI semantic comparison step before being written to the database. The merge/nuance choice UI must be shown to the user before the argument is persisted; bypassing this gate is not allowed.
- **Lasso → subgraph mapping:** coordinate-to-node mapping is computed on the frontend (React Flow canvas coordinates). The resulting list of argument IDs is sent to the API, which resolves the subgraph and calls the AI synthesis endpoint. The lasso gesture must not trigger a full-debate summarization - only the selected subgraph is in scope. Whole-debate synthesis is a separate user action that reuses the same endpoint by passing every argument id, so there is one synthesis path and no second implementation.
- **Localization - bilingual UI (pl/en), Polish is the default.** Every user-visible string across the product - buttons, labels, headings, toasts, validation errors, empty states, placeholder text - lives in the single dictionary `apps/web/src/texts/ui.ts`, which declares the `UiDict` contract once and implements it independently for both locales. Never hard-code a user-visible literal in a component; add the key to `UiDict` and fill in BOTH locales, otherwise the other language silently breaks. The active locale is held by `LanguageProvider` / `useLanguage` (`apps/web/src/app-config/`), persisted in `localStorage` under `brainstorm.lang`, and defaults to `pl`. Internal artefacts (source code, identifiers, commit messages, comments, README, CLAUDE.md files) stay in English.
- **AI output language follows the debate, never the UI locale.** Every debate carries an immutable `language` (`DebateLanguage`, default `pl`) fixed at creation. `AiService` reads it from the `Debate` that `VisibilityGuard` attaches to the request - never from the request body, so a client cannot inject English premises into a Polish debate. Every prompt builder in `apps/api/src/ai/prompts/` therefore takes `lang` and MUST implement both languages; the `SynthesisCopy` record in `synthesis.prompt.ts` exists so that a missing variant is a compile error rather than a silent fallback. Reason this rule is load-bearing: a generated premise is persisted as a graph node, and a mixed-language tree breaks embedding-based duplicate detection, whose cosine threshold cannot match the same claim stated in two languages.
- **Every debate-scoped endpoint goes through `VisibilityGuard`**, including the AI ones and the vote routes. The guard resolves the debate id in three steps: route params (`:debateId` or `:id`), then `:argumentId` by loading that argument and reading its `debateId`, then the request body (`debateId`) for the AI endpoints that carry it there. It attaches the row as `req.debate` (`RequestWithDebate`). Read the debate from there instead of re-fetching it in the service, and never re-check membership inline - a second copy of the rule is how the two drift apart. The only endpoints outside the guard are those that name no single debate: the debate list (which takes a `groupId` and checks membership in `DebatesService`) and the dashboard stats.
- **Backend-authored messages** rendered verbatim to the user (NestJS exception messages) are user-facing and are authored in Polish. They are NOT routed through `ui.ts`, so they do not follow the locale switch - a known limitation: a user with the interface set to English still sees Polish API errors.

## Directory Map

```text
brainstorm-monorepo/
├── apps/
│   ├── web/                # React frontend
│   ├── api/                # NestJS backend
│   └── e2e/                # Playwright end-to-end tests
├── packages/
│   └── core/               # Shared logic, DTOs, Enums, Types
│       ├── src/
│       │   ├── dto/        # Validation & Data Transfer Objects, plus the
│       │   │               # shared limits those DTOs enforce
│       │   ├── enums/      # Statuses & Types
│       │   └── types/      # Domain interfaces (currently empty)
│       └── package.json
├── db/init.sql             # Schema, including the partial unique indexes
├── scripts/                # Seeding and evaluation scripts (Node, .mjs)
│   └── lib/                # Helpers every script shares: .env reader, HTTP
│                           # client, domain mirrors, synthesis prompt copy
├── pnpm-workspace.yaml
└── package.json
```
