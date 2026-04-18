# apps/web - Brainstorm frontend

React + TypeScript application. Consumes the backend through DTOs imported from `@brainstorm/core`.

## Landing surface

- **Main dashboard - public discussions feed.** The app's entry point. Lists all publicly created debates; any visitor (logged-in or anonymous) can open one. Logged-in users may participate fully - create debates, add Pro/Against arguments, vote. Anonymous visitors see the same content in read-only mode; the read-only state must be visually explicit (disabled action controls with a "sign in to participate" affordance), not silently no-op.
- **Private groups - dedicated view, not on the dashboard.** A separate route that lists the user's groups. Groups the user is a member of are openable. If the UI also surfaces groups the user is not a member of (e.g. for discoverability), those must render as visibly locked (lock icon / muted styling) with a hint that access requires an invitation from the group owner - do not hide them, and do not let the UI pretend they are openable and then fail on the API call. Membership status comes from the backend; never infer it client-side.
- **Inviting users to a group is a user search, not an email input.** The invite control in the group view must be a search over registered accounts that resolves to an internal user id. Do not offer an "invite by email" field or an invitation link - a user has to exist in the system before they can be invited.
- **Invitations are pending until the invitee accepts.** Sending an invite does not grant access - it creates a pending invitation on the invitee's side. The invitee has a personal panel (e.g. a notifications / invitations inbox) where they can **accept** or **decline**; only acceptance turns the invite into a membership. The group owner's view must reflect invite state honestly (pending / accepted / declined) and must not show an invited-but-not-yet-accepted user as a full member. A user with only a pending invite still sees the group as locked in the private-groups view.

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
