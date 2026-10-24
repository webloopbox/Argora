# apps/web - Argora frontend

React 19 and Vite. It renders a debate as an interactive
[React Flow](https://reactflow.dev) graph, owns the lasso gesture that selects
a subgraph for synthesis, and holds the bilingual interface dictionary.

For what Argora is and how its AI features work, see the
[root README](../../README.md). For running the stack locally, see the
[development guide](../../docs/DEVELOPMENT.md).

---

## Layout

| Path | Responsibility |
| --- | --- |
| `src/features/debates/graph` | The canvas: nodes, edges, layout, lasso overlay, vote controls, synthesis and duplicate dialogs |
| `src/features/debates` | Debate page and creation form |
| `src/features/dashboard` | Public debate list, filters, hero section |
| `src/features/groups` | Private groups and their member management |
| `src/features/invitations` | The invitee's own panel for accepting or declining |
| `src/features/auth` | Login and registration screens |
| `src/api` | One typed client per backend resource over a shared `http-client` |
| `src/app-config` | Auth, language and theme providers plus the private-route wrapper |
| `src/texts/ui.ts` | Every user-visible string, in both locales |
| `src/components`, `src/layout` | Shared primitives and the application shell |

---

## Worth knowing before changing code here

- **No user-visible string may be hard-coded in a component.** Add the key to
  the `UiDict` contract in `src/texts/ui.ts` and fill in Polish and English
  together; the contract is declared once and implemented per locale so a
  missing key fails to compile rather than silently falling back. Polish is the
  default, and the active locale is persisted under `brainstorm.lang`.
- **Green means support and red means opposition.** That mapping is
  load-bearing and must not be reused for other semantics. Orange is reserved
  for one state only: balanced votes, meaning high controversy.
- **Types come from `@argora/core`.** Do not restate a DTO or enum locally.
- **The lasso hit test runs here, on React Flow canvas coordinates.** The API
  receives argument ids only and resolves the subgraph itself, so the gesture
  must never trigger a whole-debate summarisation.
- **One domain constant is deliberately duplicated.** The controversy ratio
  `|for - against| / weight < 0.2` lives in `ArgumentsService` on the server
  and is mirrored in `VoteControls.tsx` for the optimistic update. The two
  copies have to move together.

`CLAUDE.md` in this folder carries the full set of frontend rules.

---

## Commands

Run from the repository root.

| Command | What it does |
| --- | --- |
| `pnpm dev:web` | Vite dev server on port 5173 |
| `pnpm --filter ./apps/web build` | Typecheck, then build to `dist/` |
| `pnpm --filter ./apps/web lint` | ESLint over the app |
| `pnpm --filter ./apps/web preview` | Serve the built output |

The dev server reads the API origin from `VITE_API_URL`, documented in
`apps/web/.env.example`, and expects the shared package to be built already.
