# apps/web - Brainstorm frontend

React + TypeScript application. Consumes the backend through DTOs imported from `@brainstorm/core`.

## Rules specific to the frontend

- **Contracts come from `@brainstorm/core`.** Never re-declare a DTO, enum, or interface locally. If a shape is missing, add it in `packages/core` first and consume it here.
- **Visual coding is load-bearing.** Pro arguments are green, Against arguments are red. Do not repurpose these colors for unrelated UI states (errors, success toasts, etc.) - pick a different palette for those.
- **Graph rendering** is the core UX and is built on React Flow (`@xyflow/react`). When touching the argument graph, preserve accessibility (keyboard navigation, focus outlines) and layout determinism (same tree should render the same way across reloads). Keep all React Flow configuration (node types, edge types, layout logic) in a single wrapper module - do not scatter it across feature components.
- **Responsiveness is required, not optional.** The layout may simplify on smaller screens (e.g. collapsed panels, stacked views instead of side-by-side), but every user operation must remain reachable - nothing may be hidden or disabled based on screen size alone. The argument graph is the hardest part: on small screens consider a pan/zoom-only view with a slide-in panel for actions, rather than trying to fit the full desktop layout.
- **Provider-agnostic AI UI.** The UI must not assume a specific LLM vendor. Model choice is user-facing and dynamic - read available providers from the backend, do not hard-code.
- **Centralised error toasts via an HTTP interceptor.** Network errors and other API failures must be surfaced to the user through a single Axios (or fetch) interceptor - not scattered `catch` blocks calling toast individually. The interceptor reads the error status/message and dispatches a toast automatically, so feature code stays free of error-display logic. One-off overrides (e.g. silent background polling) must opt out explicitly, not be the default.

## Styling

- **Tailwind CSS** for utility-class styling.
- **HeroUI** (`@heroui/react`) for UI components - installed as an npm dependency, not copied into the workspace. Import components from `@heroui/react` directly; do not re-implement what HeroUI already provides.
- Pro/Against colors (green/red) must be defined as named tokens in `tailwind.config.ts` under `theme.extend.colors` (e.g. `pro` and `against`). Use them via utility classes (`bg-pro`, `text-against`, etc.) - never hardcode `green-500` or `red-500` directly in components.
