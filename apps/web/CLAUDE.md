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

## Language (UI copy)

- **Polish only.** Every user-visible string in the app - navigation, buttons, labels, headings, empty states, toasts, form validation messages, tooltips, dialog copy, skeleton placeholders - must be in Polish. No mixing English and Polish strings in the same UI. Source-code identifiers, file names, commit messages and comments stay in English; translation is applied only at the rendering boundary.
- **Centralise reusable strings.** Strings that repeat (standard CTA labels, error toasts, validation messages, common empty states) live in `src/texts/` so rewording stays consistent. Inline strings are acceptable for one-off headings/body inside a single component, but never for actions or messages that appear in multiple places.

## Design bar

The product must read as a current, premium tool from the first frame. Hitting this bar is not optional polish - it is part of feature-complete.

- **Modern UI** Visual language tracks current product trends: generous whitespace, balanced type scale, subtle depth (soft shadows, layered surfaces) over heavy borders, consistently rounded interactive surfaces, dark-mode-aware palette. Treat HeroUI defaults as a floor, not a ceiling - tune spacing, type, and contrast until the screen feels contemporary.
- **Visual hierarchy is load-bearing.** One primary action per view (visually strongest); secondary actions quieter; destructive actions visibly distinct. A clear type scale (display / heading / body / caption) is used consistently. No two elements should compete for the same level of attention on the same screen.
- **Micro-interactions matter.** Hover, focus, press, and enter/exit transitions must be present and feel smooth - never abrupt state flips. Use `framer-motion` (already installed) for non-trivial transitions: list items animating in, panels sliding, state changes, dialog open/close. Keep motion under ~250ms and respect `prefers-reduced-motion`.
- **"Wow factor" is explicit.** First impression - landing on the public dashboard, opening a debate graph - must feel polished and prestigious: considered imagery or illustration where appropriate, elegant empty states (not bare "No data"), deliberate whitespace, crisp graph canvas background. Every new feature gets a first-impression review before being called done: would a decision-maker see this as a high-end product?
- **Accessibility is part of the bar, not a trade-off.** Focus states are visible and styled (never the browser default ring on top of a custom button), color contrast meets WCAG AA, every interactive element is keyboard-reachable. A "pretty" UI that breaks keyboard flow does not meet the design bar.
