<p align="center">
  <img src="docs/assets/hero.svg" alt="Argora - an AI-assisted debate platform built on argumentation trees" width="100%">
</p>

<p align="center">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript&logoColor=white">
  <img alt="NestJS" src="https://img.shields.io/badge/NestJS-11-E0234E?style=flat-square&logo=nestjs&logoColor=white">
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black">
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-16%20%2B%20pgvector-4169E1?style=flat-square&logo=postgresql&logoColor=white">
  <img alt="MIT licence" src="https://img.shields.io/badge/licence-MIT-6E7681?style=flat-square">
</p>

<p align="center">
  <a href="https://youtu.be/Fgw38GYoWFg"><b>Video walkthrough</b></a> &nbsp;·&nbsp;
  <a href="#how-the-ai-works"><b>How the AI works</b></a> &nbsp;·&nbsp;
  <a href="#architecture"><b>Architecture</b></a> &nbsp;·&nbsp;
  <a href="#architecture-constraints"><b>Architecture constraints</b></a> &nbsp;·&nbsp;
  <a href="#run-it-locally"><b>Run it locally</b></a>
</p>

---

## The problem this solves

A comment thread is a **timeline**. It rewards whoever posts loudest and most often, it forgets what was already said, and after two hundred replies nobody can tell you what the disagreement actually is.

Argora replaces the timeline with a **tree**. Every claim attaches to the claim it answers, so the shape of the discussion carries meaning: a deep branch marks the real axis of conflict, a missing child marks an objection nobody answered. On top of that structure sit three AI capabilities: semantic de-duplication, region-scoped synthesis, and context-aware generation.

> Built as the engineering artefact of an MSc thesis, and presented at the **IBM Innovation Project - Country Challenge 2026**. <br>A [video walkthrough](https://youtu.be/Fgw38GYoWFg) shows the running application end to end.

---

## See it

<p align="center">
  <img src="docs/assets/screens/00-argument-graph.webp" alt="Reading the thesis, lassoing one rebuttal chain and having a model summarise exactly those three arguments" width="100%">
</p>

<table>
<tr>
<td width="50%"><img src="docs/assets/screens/01-ai-draft.webp" alt="Drafting an argument with model assistance: picking a side, choosing a model, and the proposal typing itself into the field"></td>
<td width="50%"><img src="docs/assets/screens/02-duplicate-gate.webp" alt="Writing an argument that restates an existing one, and the gate catching it before it is saved: the two texts side by side, with the choice to merge or add as a nuance"></td>
</tr>
<tr>
<td><b>Drafting with a model.</b> Pick a side, pick a vendor, and the generated text lands in the field as a proposal - nothing is published until a person accepts it.</td>
<td><b>Duplicate gate.</b> A near-identical claim is caught before it is written - cosine 0.97 against the stored argument - and the author chooses what happens.</td>
</tr>
</table>

---

## How the AI works

### 1. Semantic de-duplication

Two people routinely submit the same claim in different words, and keyword matching cannot catch it: _"commuting eats hours of my week"_ and _"remote work gives people their time back"_ share no words and mean the same thing.

Every argument is embedded into a multilingual vector, and closeness is measured as the **cosine of the angle** between vectors - magnitude tracks text length, which is not meaning, so it is divided out.

<p align="center">
  <img src="docs/assets/cosine-similarity.svg" alt="Cosine similarity between two argument embeddings and the duplicate threshold that separates a restatement from a distinct claim" width="100%">
</p>

```ts
// apps/api/src/ai/embedding.service.ts
cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
```

The threshold is a property of the embedding model, not of the domain, so it travels with the provider instead of being one global constant. Measured on 924-994 pairs of distinct arguments that coexist in the same debate on the same side - known non-duplicates by construction - plus hand-written paraphrases of real arguments:

| embedding model                 | dims | non-duplicates (median / p99 / max) | threshold | submissions falsely flagged |
| ------------------------------- | ---- | ----------------------------------- | --------- | --------------------------- |
| `gemini-embedding-001`          | 3072 | 0.618 / 0.786 / 0.868               | **0.80**  | 6.0%                        |
| `multilingual-e5-small` (local) | 384  | 0.834 / 0.906 / 0.942               | **0.91**  | 4.6%                        |

Gemini keeps unrelated arguments near 0.62 and tops out at 0.87, leaving the whole 0.87-1.0 band for real duplicates; the small local model compresses them up to 0.94 and leaves far less room.

That last column, not the per-pair rate, is what sets each threshold: the gate takes the **maximum** over every candidate, so 0.6% of pairs at 0.91 becomes 4.6% of submissions. The two values are not interchangeable - Gemini's 0.80 under the local model flags **153 of 153** - so the default lives next to the provider choice and `DUPLICATE_THRESHOLD` only overrides it for sweeps.

The local model is what keeps the gate alive on a clone with an empty `.env`: it runs in-process through ONNX Runtime and needs no key. It separates less cleanly, though - its non-duplicates reach 0.942 where Gemini's stop at 0.868 - leaving a paraphrase far less room to land in. `scripts/eval-duplicate-detection.mjs` replays the labelled set and reports both.

<p align="center">
  <img src="docs/assets/duplicate-pipeline.svg" alt="Duplicate detection pipeline: submit, embed, narrow candidates, compare, human gate" width="100%">
</p>

Beyond the formula:

- **The comparison set is narrowed in SQL**, so the database returns only the rows that can match instead of the API fetching every argument and filtering them in JavaScript: same debate, same stored side, embedding present, and the parent excluded - a reply naturally echoes the wording of what it answers, so comparing against it would flag every rebuttal.
- **A dead embedding vendor must not block a user.** `EmbeddingService.embed` returns `null` on failure and the gate degrades to "no similarity found".
- **The gate never decides.** Above the threshold the user is shown both texts and picks: _merge_ casts a vote that raises the existing argument's weight, _nuance_ publishes anyway.
- **Embeddings are computed after the response.** The write path stays fast; the vector lands asynchronously.

### 2. Lasso context extraction

A whole-debate summary flattens every branch into one answer, and the question is often about a single branch.

<p align="center">
  <img src="docs/assets/lasso-synthesis.svg" alt="A freehand lasso maps canvas coordinates to argument ids, which the API resolves into an enriched subgraph" width="100%">
</p>

The hit test runs on the client against React Flow canvas coordinates; the API receives **ids only** and intersects them with the debate's own arguments, dropping anything foreign. Each selected node is handed to the model with its author, vote counts, weight, sentiment, parent text and thesis-relative stance - so the parent-child relations survive without nesting the prompt.

Whole-debate summarisation is the same endpoint with every id passed in. One synthesis path, no second implementation to drift.

### 3. Generation, and the stance problem

Generated text arrives as a **proposal in the textarea**, badged as model output only when it really came from a model, and that badge is cleared the moment the argument is sent. Before publishing, a second model call checks the argument against the side the author picked and offers a switch if they disagree - and when every provider fails, the submission proceeds rather than blocking.

<p align="center">
  <img src="docs/assets/effective-stance.svg" alt="Stored side is relative to the parent; thesis-relative stance is derived by flipping polarity on every against link" width="100%">
</p>

A node's stored `side` is relative to its **immediate parent**. Read it as a thesis label and an objection to an objection gets filed as opposition to the thesis - which would put speakers on the side they spent the whole thread arguing against. One helper walks the parent chain and flips polarity on every _against_ link; the synthesis prompt uses it and tells the model the resulting label is binding.

---

## Architecture

<p align="center">
  <img src="docs/assets/architecture.svg" alt="System architecture: React client, NestJS API, PostgreSQL, pluggable LLM and embedding layers" width="100%">
</p>

### Design decisions

| Decision                                                | Why it is this way                                                                                                                                                                                                                                             |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Contracts live in `@argora/core`**                    | Every DTO, enum and limit is declared once and imported by both sides. The argument length bounds are exported constants, so the form check, the server validator and the error copy cannot disagree.                                                          |
| **One `VisibilityGuard` for every debate-scoped route** | It resolves the debate from the route param, from an `:argumentId`, or from the request body, then attaches the row. Services read `req.debate` instead of re-fetching and re-checking - a second copy of an access rule is how two copies drift apart.        |
| **Provider-agnostic AI layer**                          | One `LlmProvider` interface, one class per vendor. The registry instantiates whatever the environment has credentials for, so an empty registry is a valid boot state and the AI features simply go quiet.                                                     |
| **Embeddings are a single active vendor**               | Vectors from different models are not comparable, so this is a process-wide choice rather than a per-request one. Switching means re-embedding the corpus, and there is a script for exactly that.                                                             |
| **Archive, never delete**                               | Every table carries `archivedOn`. Reads go through one `activeWhere` helper; archiving cascades to child rows inside one transaction. The full history stays queryable for analysis.                                                                           |
| **Two partial unique indexes**                          | "One pending invitation per pair" and "one active vote per pair" are conditional constraints. A TypeORM `@Unique` cannot carry a `WHERE` clause, so both are declared as partial unique `@Index` definitions on their entities and the database enforces them. |
| **Per-route rate limits**                               | Each AI route owns one named throttle bucket and explicitly skips the other three, because a shared guard otherwise applies the strictest limit everywhere.                                                                                                    |
| **Vendor errors never surface raw**                     | Every provider call funnels through one wrapper that maps throttling to 429 and anything else to 503, with a user-facing message instead of an SDK string.                                                                                                     |
| **The debate's language, not the reader's**             | A generated premise is persisted as a node, so it must match the tree it joins. Prompt builders take the debate's language and a missing variant is a compile error, not a silent fallback.                                                                    |

---

## Architecture constraints

<p align="center">
  <img src="docs/assets/ai-workflow.svg" alt="CLAUDE.md files as machine-readable constraints, the invariants they protect, and how changes are proven" width="100%">
</p>

Four `CLAUDE.md` files act as a machine-readable architecture document: the root one owns the domain rules and guardrails, and each workspace adds its own.

The one deliberate duplication in the codebase - a sentiment constant mirrored on the client for optimistic UI - is documented as deliberate, in both places.

---

## Run it locally

**Prerequisites:** Node ≥ 22, pnpm ≥ 10, Docker Desktop.

```bash
pnpm install
cp .env.example .env            # defaults work for local development
docker compose up -d            # PostgreSQL 16 + pgvector on :5432
pnpm --filter @argora/core build

pnpm dev:api                    # http://localhost:3000
pnpm dev:web                    # http://localhost:5173
```

Tables are created on first boot. AI features activate per vendor: add `IBM_CLOUD_API_KEY` + `WATSONX_PROJECT_ID` + `WATSONX_URL`, `TOGETHER_API_KEY`, or `GEMINI_API_KEY` to `.env` and the registry picks up whatever is present. With no keys at all the app still runs: the model picker is simply empty, while duplicate detection keeps working on the local embedding model, which needs no credentials.

```bash
pnpm seed:nuclear:pl            # a 4-level Polish debate
pnpm seed:agi:en                # a large English debate
pnpm test:e2e                   # Playwright smoke suite
```

Full setup, test-database preparation and troubleshooting: **[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)**.

---

## Repository layout

```text
apps/
  api/          NestJS: auth, debates, arguments, votes, groups, AI
  web/          React 19 + Vite: graph canvas, panels, i18n dictionary
  e2e/          Playwright smoke specs
packages/
  core/         DTOs, enums, limits - the contract both apps import
scripts/        Seeding + evaluation harness (plain Node, .mjs)
  lib/          Shared .env reader, HTTP client, domain mirrors, prompt copy
db/init.sql     pgvector extension (the partial unique indexes are
                declared on the entities)
docs/assets/    Diagrams and screenshots used by this README
```

---

## Roadmap

- **Richer relation language** beyond pro/against: _condition_, _example with a source_, _refinement of scope_.
- **Real-time collaboration** - several people shaping one graph live.
- **Retrieval-backed verification** of the factual claims made inside a debate.
- **pgvector-native search** - the extension is already enabled and embeddings move from `jsonb` to a `vector` column when the corpus outgrows in-process comparison.

---

Screenshots show the real interface with seeded demo data. Released under the [MIT licence](LICENSE).
