# make poetry. frontend

The frontend is the React application for `make poetry.`, an accessibility-first poetry composition and sharing project. See the repository [README](../../README.md) for authoritative full-stack setup, environment, database, CI, and deployment instructions. See [MASTER_PLAN.md](../../MASTER_PLAN.md) for future product ideas; roadmap items are not current features.

## Current capabilities

- JWT-backed registration, login, profile management, and protected routes
- Haiku and limerick editors with accessible syllable and rhyme guidance
- Authenticated, server-backed draft save, resume, update, discard, and publish flows
- A combined authenticated feed of published poems with filters, sorting, and pagination
- Poem, comment, and reply likes
- Comment and reply creation, editing, deletion, and accessible pending/error states
- A favorites collection with private/public privacy controls
- Keyboard-accessible dialogs, focus trapping/restoration, live status, alerts, and non-color cues
- Layered word lookup through the API with a versioned browser cache and local fallback

## Setup

Install all workspace dependencies from the repository root:

```bash
npm ci
```

The root `package-lock.json` is authoritative. Do not install from this directory to create another lockfile.

Create `apps/frontend/.env`:

```env
VITE_API_URL=http://localhost:3000
```

Only the API reads `WORDS_API_KEY`; never put that credential in a `VITE_` variable.

## Development

From the repository root:

```bash
npm run dev --workspace=poetry-app
```

To start both the frontend and API through Turborepo:

```bash
npm run dev
```

Vite uses port 5173 by default. The API origin must match `VITE_API_URL`, and the API's `CORS_ORIGIN` must allow the frontend origin.

## Tests and checks

Run one-shot frontend tests:

```bash
npm test --workspace=poetry-app -- --run
```

Run the interactive Vitest watcher:

```bash
npm test --workspace=poetry-app
```

Run coverage, lint, and the production build:

```bash
npm run test:coverage --workspace=poetry-app
npm run lint --workspace=poetry-app
npm run build --workspace=poetry-app
```

Frontend tests use jsdom and React Testing Library. Components using authentication or routing should use the shared helpers in `apps/frontend/tests/test-utils.jsx`.

## Accessibility

Accessibility is a product constraint. Preserve native semantics, accessible names and states, keyboard behavior, focus management, live/alert messaging, non-color equivalents, contrast, and usable loading/error states when changing the frontend.

## Deployment

The frontend builds to `apps/frontend/dist`. Set `VITE_API_URL` at build time and configure the static host to serve the SPA entry point for client-side routes. No frontend hosting-provider configuration is checked into this repository.
