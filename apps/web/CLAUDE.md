# apps/web - Argora frontend

React + TypeScript application. Consumes the backend through DTOs imported from `@argora/core`.

## Landing surface

- **Main dashboard - public discussions feed.** The app's entry point. Lists all publicly created debates; any visitor (logged-in or anonymous) can open one. Logged-in users may participate fully - create debates, add Pro/Against arguments, vote. Anonymous visitors see the same content in read-only mode; the read-only state must be visually explicit (disabled action controls with a "sign in to participate" affordance), not silently no-op.
- **Private groups - dedicated view, not on the dashboard.** A separate route that lists the user's groups. Groups the user is a member of are openable. If the UI also surfaces groups the user is not a member of (e.g. for discoverability), those must render as visibly locked (lock icon / muted styling) with a hint that access requires an invitation from the group owner - do not hide them, and do not let the UI pretend they are openable and then fail on the API call. Membership status comes from the backend; never infer it client-side.
- **Inviting users to a group is a user search, not an email input.** The invite control in the group view must be a search over registered accounts that resolves to an internal user id. Do not offer an "invite by email" field or an invitation link - a user has to exist in the system before they can be invited.
- **Invitations are pending until the invitee accepts.** Sending an invite does not grant access - it creates a pending invitation on the invitee's side. The invitee has a personal panel (e.g. a notifications / invitations inbox) where they can **accept** or **decline**; only acceptance turns the invite into a membership. The group owner's view must reflect invite state honestly (pending / accepted / declined) and must not show an invited-but-not-yet-accepted user as a full member. A user with only a pending invite still sees the group as locked in the private-groups view.

## Rules specific to the frontend

- **Contracts come from `@argora/core`.** Never re-declare a DTO, enum, or interface locally. If a shape is missing, add it in `packages/core` first and consume it here. This covers the numbers a contract enforces too: the argument length bounds are exported as `ARGUMENT_MIN` / `ARGUMENT_MAX` next to `CreateArgumentDto`, and both the form's client-side check and the validation copy in `ui.ts` interpolate them rather than restating a literal.
- **Visual coding is load-bearing.** Pro arguments are green, Against arguments are red. Do not repurpose these colors for unrelated UI states (errors, success toasts, etc.) - pick a different palette for those.
- **Graph rendering** is the core UX and is built on React Flow (`@xyflow/react`). When touching the argument graph, preserve accessibility (keyboard navigation, focus outlines) and layout determinism (same tree should render the same way across reloads). Keep all React Flow configuration (node types, edge types, layout logic) in a single wrapper module - do not scatter it across feature components.
- **Responsiveness is required, not optional.** The layout may simplify on smaller screens (e.g. collapsed panels, stacked views instead of side-by-side), but every user operation must remain reachable - nothing may be hidden or disabled based on screen size alone. The argument graph is the hardest part: on small screens consider a pan/zoom-only view with a slide-in panel for actions, rather than trying to fit the full desktop layout.
- **Provider-agnostic AI UI.** The UI must not assume a specific LLM vendor. Model choice is user-facing and dynamic - read available providers from the backend, do not hard-code.
- **The AI badge marks provenance, not a mode.** `isAiGenerated` on a submitted argument means the text in the field came from a model, not that the assist panel happened to be open. Keep it tied to a successful generation and reset it once the argument is sent, otherwise a hand-written argument gets badged as model output and a kept proposal loses its badge.
- **Both AI gates run before an argument is created, and neither may block it.** A submission goes through the duplicate check and then the side check; a failure of either is swallowed and the submission proceeds. Any new submission path has to go through the same two functions rather than calling `createArgument` directly - the nuance branch of the duplicate dialog is the reason `submitWithSideCheck` exists as a separate step.
- **Centralised error toasts via an HTTP interceptor.** Network errors and other API failures are surfaced through the single Axios response interceptor in `src/api/http-client.ts` - not scattered `catch` blocks calling toast individually. It prefers the server's own message, falls back to per-status copy from `ui.ts`, and stays silent on 401 because the redirect to login is the visible signal. A request opts out by setting `silent: true` on its config; that is the exception, never the default. Feature code may still catch an error to render it inline (a form field, a panel), but it must not raise a second toast for the same failure.

## Styling

- **Tailwind CSS** for utility-class styling.
- **HeroUI** (`@heroui/react`) for UI components - installed as an npm dependency, not copied into the workspace. Import components from `@heroui/react` directly; do not re-implement what HeroUI already provides.
- **Tailwind v4, configured in CSS, not in a config file.** There is no `tailwind.config.ts`; the plugin is wired in `vite.config.ts` and the design tokens live in an `@theme` block at the top of `src/index.css`. Pro/Against colors are the named scales `--color-pro-*` and `--color-against-*` defined there. Use them via utility classes (`bg-pro-50`, `text-against-700`, etc.) - never hardcode `green-500` or `red-500` directly in components.
- Dark mode is a class variant (`@custom-variant dark`), so every colored surface needs its `dark:` counterpart written out.

## Language (UI copy)

- **Bilingual pl/en, Polish is the default.** Every user-visible string - navigation, buttons, labels, headings, empty states, toasts, form validation messages, tooltips, dialog copy, skeleton placeholders - lives in `src/texts/ui.ts`, which declares the `UiDict` contract once and implements it separately for each locale. Never hard-code a user-visible literal in a component: add the key to `UiDict` and fill in BOTH locales, or the other language silently breaks. Source-code identifiers, file names, commit messages and comments stay in English.
- **Locale state** is held by `LanguageProvider` / `useLanguage` (`src/app-config/`), persisted in `localStorage` under `brainstorm.lang`, and defaults to `pl`. Read it with `useLanguage()` when a component needs to branch on language; do not read `localStorage` directly.
- **The interface locale is not the debate language.** A debate carries its own immutable `language` that drives AI output (see the root CLAUDE.md). Never pass the UI locale to an AI endpoint, and never assume a debate is in the language the reader is currently browsing in.
- **Backend error messages are Polish regardless of locale.** They come from NestJS exceptions and do not pass through `ui.ts`, so an English interface still surfaces Polish API errors. Known limitation; do not paper over it by hard-coding English copies of those messages in the client.

## Visual design

- **Surface style.** Generous whitespace, a consistent type scale, soft shadows and layered surfaces instead of heavy borders, rounded interactive surfaces, and a palette that works in both themes. HeroUI defaults are a starting point, not a constraint.
- **Visual hierarchy.** One primary action per view, secondary actions quieter, destructive actions visibly distinct. No two elements compete for the same level of attention on one screen.
- **Transitions, not flips.** Hover, focus, press and enter/exit states are animated. `framer-motion` handles the non-trivial ones: list items, sliding panels, dialogs. Durations stay in the 150-400 ms band the rest of the app already uses.
- **Empty states carry copy**, never a bare "No data" - and that copy is a key in `ui.ts` like every other string.
- **Accessibility is not a trade-off.** Focus states are visible and styled (never the browser default ring on top of a custom button), contrast meets WCAG AA, every interactive element is keyboard-reachable.
