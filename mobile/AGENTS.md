# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.

# Project structure & conventions

Follow these when adding or refactoring code.

## Layers (dependencies point one way: screens → features → shared)

- `src/components/ui/` — generic, reusable design-system primitives (`Button`, `TextField`, `LabeledDivider`, `TextLink`, `icons/`). No feature or domain knowledge.
- `src/components/` — other shared app components (e.g. `brand-logo.tsx`, `themed-*`).
- `src/features/<feature>/` — feature-specific code:
  - `components/` — molecules/organisms composed from `ui/` atoms
  - `hooks/` — feature logic (e.g. `use-auth-form.ts`)
  - `<feature>-screen.tsx` — presentational composition only
  - `types.ts`
- Feature code may import from `src/components/**` and shared modules. Shared code must **not** import from `src/features/**`, and features must not import each other.

## Components

- One component per file; kebab-case filenames; named exports (route files use a default export).
- Keep components atomic and presentational. Put state, validation, and handlers in a `use-*` hook, not in the screen.
- Style from the design tokens in `src/constants/design.ts` (`Palette`, `Font`, `Radius`) — no hardcoded hex or font-family strings in components.
- No barrel files (`index.ts` re-exports); import directly. Use the `@/` path alias.

## Data & logic — the frontend only presents

- **No business/derivation logic in the app.** It renders API data; it does not compute it. Values like initials, `firstName`, relative times ("2h ago", "due in 2 days"), status labels, counts/aggregates, currency/number formatting, etc. are computed **on the backend** and returned as presentation-ready fields on the API Resource (Laravel `Str`/`Carbon` make this trivial).
- Exceptions that stay in the app: pure UI/theme concerns (mapping a status → design-token colors), layout, and ephemeral input state.
- If you feel the urge to write a helper that transforms API data into display text, add that field to the Resource instead.

## UI libraries

- `react-native-paper` is kept for Material/utility UI (dialogs, snackbars, menus, pickers). Build design-matched (custom-look) screens from the `src/components/ui/` primitives, not Paper.

## Cross-cutting folders

`src/config/` runtime config · `src/constants/` tokens & theme · `src/store/` Redux store — slices, typed hooks (`useAppDispatch`/`useAppSelector`); server cache stays in SWR · `src/providers/` provider composition · `src/services/` external integrations (platform-split with `.web.ts` where a native module has no web build) · `src/hooks/` shared hooks · `src/lib/` utilities · `src/types/` shared types.

## Routing (expo-router)

- Route groups: `src/app/(auth)/` (unauthenticated) and `src/app/(app)/` (authenticated tabs). Auth gating/redirects live in the root `src/app/_layout.tsx`, based on `useAuth().isSignedIn`.
