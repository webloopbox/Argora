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
- **Collaboration - two visibility modes:**
  - **Public debates:** any logged-in user can create a publicly visible debate. Anyone logged in can participate (arguments, votes); anonymous visitors can read but not contribute. Public debates are the content of the main dashboard.
  - **Private discussion groups:** members-only debate trees. Entry requires the user to be invited by the group owner **and** to accept the invitation themselves. Invitations are **system-internal**: the owner searches the registered user directory and sends an invite to that account (not by email). The invite stays pending until the invitee confirms it from their own panel; only then does it become a membership. Private groups live in a dedicated view, separate from the public dashboard.

## Development Guardrails

- **Architecture:**
  - Every API contract MUST be defined in `@brainstorm/core`. Never duplicate a DTO, enum, or interface between `apps/api` and `apps/web`.
  - The AI service must use a provider-agnostic Strategy Pattern to support multiple LLM vendors. Do not hard-code a single vendor in domain logic.
- **Data flow:** all data from the backend must be archived in PostgreSQL for later analysis.
- **UI/UX:** maintain strict visual coding - green for support, red for opposition. This mapping is load-bearing and must not be reused for other semantics.

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
