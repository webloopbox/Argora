# Brainstorm

## Project Overview

**Brainstorm** is an interactive platform for conducting online debates with visual argument mapping. It uses AI to analyze, generate content, and visualize discussion flow.

## Technical Stack

- **Workspace:** `pnpm` monorepo.
- **Backend:** NestJS (`apps/api`).
- **Frontend:** React + TypeScript (`apps/web`).
- **Shared library:** `@brainstorm/core` (`packages/core`) - single source of truth for DTOs, Enums, and Interfaces.
- **Database:** PostgreSQL for archiving and analysis.

## Core Logic & Features

- **Debate structure:**
  - Users propose a central thesis.
  - Arguments are added as **Pro** - green tiles - or **Against** - red tiles.
  - Visualization is rendered as an interactive graph.
- **AI capabilities:**
  - **Multi-model generation:** real-time argument generation using models like GPT-4o, Claude, Grok, or Mistral.
  - **Summarization:** automated synthesis of complex argument trees or full debates.
  - **Lasso context extraction:** the user draws a freehand lasso polygon on the graph to select a subset of nodes. The system maps canvas coordinates to matching argument IDs, reconstructs the logical subgraph (preserving parent-child relations), and forwards it as a coherent context to the AI module. The AI produces an on-demand synthesis focused exclusively on the selected subgraph — not the full debate tree.
  - **Duplicate detection:** before a new argument is persisted, the AI compares its semantic meaning against existing arguments in the same debate. If a near-duplicate is detected the user is presented with a choice: (a) **merge** — cast a vote to raise the existing argument's weight, or (b) **add as nuance** — publish the new argument if it genuinely contributes something the existing one lacks. This prevents semantic spam and keeps every graph node informationally unique.
- **Argument weight & sentiment visualization:**
  - Argument weight = |Votes For| + |Votes Against| — absolute sum, not net score. Every reaction increases an argument's visibility in the graph regardless of direction; a controversial argument ranks higher than one that was ignored.
  - Each argument tile displays a small **sentiment badge** showing the dominant mood: green (For votes dominate), red (Against votes dominate), orange (votes are balanced — high controversy/polarization).
- **Collaboration - two visibility modes:**
  - **Public debates:** any logged-in user can create a publicly visible debate. Anyone logged in can participate (arguments, votes); anonymous visitors can read but not contribute. Public debates are the content of the main dashboard.
  - **Private discussion groups:** members-only debate trees. Entry requires the user to be invited by the group owner **and** to accept the invitation themselves. Invitations are **system-internal**: the owner searches the registered user directory and sends an invite to that account (not by email). The invite stays pending until the invitee confirms it from their own panel; only then does it become a membership. Private groups live in a dedicated view, separate from the public dashboard.

## Development Guardrails

- **Architecture:**
  - Every API contract MUST be defined in `@brainstorm/core`. Never duplicate a DTO, enum, or interface between `apps/api` and `apps/web`.
  - The AI service must use a provider-agnostic Strategy Pattern to support multiple LLM vendors. Do not hard-code a single vendor in domain logic.
- **Data flow:** all data from the backend must be archived in PostgreSQL for later analysis.
- **UI/UX:** maintain strict visual coding - green for support, red for opposition. This mapping is load-bearing and must not be reused for other semantics. **Orange is reserved exclusively for the "high controversy / balanced votes" sentiment badge state** — do not reuse it for any other UI meaning.
- **Duplicate detection is mandatory:** every new argument submission must pass through the AI semantic comparison step before being written to the database. The merge/nuance choice UI must be shown to the user before the argument is persisted; bypassing this gate is not allowed.
- **Lasso → subgraph mapping:** coordinate-to-node mapping is computed on the frontend (React Flow canvas coordinates). The resulting list of argument IDs is sent to the API, which reconstructs the subgraph and calls the AI synthesis endpoint. The lasso gesture must not trigger a full-debate summarization — only the selected subgraph is in scope.
- **Localization - Polish only.** The system's sole supported UI language is Polish. Every user-visible string across the product - buttons, labels, headings, toasts, validation errors, empty states, email templates, placeholder text - must be Polish and stay consistent across screens. Internal artefacts (source code, identifiers, commit messages, comments, README, CLAUDE.md files) stay in English; only the user-facing surface is translated. If a backend-authored error message is rendered verbatim to the user, treat it as user-facing and author it in Polish; otherwise translate at the UI boundary.

## Directory Map

```text
brainstorm-monorepo/
├── apps/
│   ├── web/                # React frontend
│   └── api/                # NestJS backend
├── packages/
│   └── core/               # Shared logic, DTOs, Enums, Types
│       ├── src/
│       │   ├── dto/        # Validation & Data Transfer Objects
│       │   ├── enums/      # Statuses & Types
│       │   └── types/      # Domain interfaces
│       └── package.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```
