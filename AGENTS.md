# AGENTS.md

## Project

`make poetry.` is an accessibility-first, full-stack poetry composition and
sharing application. It is an npm-workspaces/Turborepo monorepo with:

- `apps/frontend`: React 19, React Router 7, Vite 7, plain CSS, Vitest, and
  React Testing Library
- `apps/api`: Node.js, Express 5, PostgreSQL, Prisma 7 with the `pg` adapter,
  JWT authentication, and Vitest/Supertest integration tests

Preserve established behavior unless the requested change requires altering
it. Make focused changes, follow existing patterns, and run tests proportional
to the affected behavior.

## Accessibility is a product constraint

Accessibility should shape component structure, interaction design, focus
management, keyboard behavior, status and error messaging, visual contrast,
non-color cues, semantic HTML, ARIA, and tests. Do not remove accessible names,
focus restoration/trapping, live announcements, keyboard access, or
screen-reader explanations without an equivalent or better replacement.

Prefer native HTML semantics. Add ARIA only where native semantics do not
express the required state or relationship. When a visual treatment conveys
syllable status or rhyme grouping, retain a non-visual equivalent.

## Commands

Run commands from the repository root unless a command changes directory.

```bash
npm install
npm run dev
npm run build
npm run lint

cd apps/frontend && npm test -- --run
cd apps/frontend && npm run test:coverage

cd apps/api && NODE_ENV=test npm test -- --run
```

There is no root `test` task. There are also no `test:watch` or `coverage`
scripts in the frontend package; `npm test` starts Vitest and may remain in
watch mode in an interactive terminal, so use `-- --run` for a one-shot check.

### API test database

API tests are integration tests against PostgreSQL, not mocked persistence.
Set `TEST_DATABASE_URL` in `apps/api/.env`, then apply migrations before the
first run:

```bash
cd apps/api
NODE_ENV=test npx prisma migrate deploy --schema=prisma/schema.prisma
NODE_ENV=test npm test -- --run
```

API test files run serially (`fileParallelism: false`) because they share the
test database. Rate limiters intentionally skip only when `NODE_ENV=test`.
Never point `TEST_DATABASE_URL` at development or production data.

Frontend tests use jsdom. Components that call `useAuth` should use the shared
helpers in `apps/frontend/tests/test-utils.jsx`; router-dependent components
also require router context. Prefer those helpers over duplicating provider
setup.

## Authentication and authorization

- The API signs JWTs with `JWT_SECRET`; clients send them as
  `Authorization: Bearer <token>`.
- The frontend persists the token and user in `localStorage` through
  `AuthContext`. `ProtectedRoute` improves navigation but is not a security
  boundary.
- Except for registration and login, current application routes require a
  verified token, including `/feed`, published-poem reads, words, favorites,
  comments, and replies.
- Enforce ownership and visibility in API handlers. Never rely on a hidden
  button or route guard for authorization.
- Unpublished poems may be read only by their owner. Poem likes, favorites,
  and comment/reply reads and creation also check this parent-poem visibility.
  Collection and per-user public views expose published poems only.
- Existing comment-like and reply-like routes are a narrower exception: they
  verify the token and target record but do not re-check parent-poem
  visibility. Do not assume parent authorization is uniform across nested
  routes; inspect the handler and tests before changing or documenting it.
- Poem authors may update their poems. Owners may delete their poems, and the
  existing delete routes also permit admins. Comment and reply authors may
  update their own content; existing delete routes permit the author or an
  admin.
- Do not broaden admin powers or expose private resources by analogy. Verify
  the specific route and its tests before changing authorization behavior.
- Login intentionally uses a generic invalid-credentials response. Do not add
  account-enumeration details.

## Poetry domain rules

- A haiku has a title and exactly three persisted lines. The editor considers
  it complete at 5, 7, and 5 syllables.
- A limerick has a title and exactly five persisted lines. The editor targets
  7–10 syllables for lines 1, 2, and 5 and 5–8 for lines 3 and 4.
- Limerick AABBA relationships are guidance conveyed visually and to assistive
  technology; the application does not verify that lines rhyme.
- Persisted poems include the syllable count for every line. Limericks also
  store rhyme metadata.
- New poems default to unpublished. Publication is an explicit user choice.
- The feed combines published haikus and limericks. It supports poem type and
  date filters, newest/most-liked sorting, deterministic tie-breaking, and
  pagination. Preserve its response shape unless all consumers and tests are
  updated together.
- Comments and replies are limited to 600 characters by current validation.
  Whitespace-only content is invalid. Feed comments and replies are returned
  oldest first with ID tie-breakers.
- Likes are unique per user and target. Favorites are polymorphic records
  keyed by user, poem ID, and poem type, with `private` or `public` privacy.

## Repository-specific constraints

- Keep haiku and limerick behavior aligned when a change applies to both;
  update both implementations and their corresponding tests.
- Preserve API response fields consumed by the frontend, including `_count`,
  current-user like arrays, `isFavorited`, and `poemType` in feed results.
- Treat paths and import casing as case-sensitive. Component directories use
  `HaikuCard`, `LimerickCard`, `PoemCard`, and `CommentCard` casing.
- Edit `apps/api/prisma/schema.prisma` for data-model changes and create a
  migration. Do not hand-edit `apps/api/generated/prisma`.
- Use `DATABASE_URL` for normal API operation and `TEST_DATABASE_URL` only
  under `NODE_ENV=test`. WordsAPI credentials belong server-side in
  `WORDS_API_KEY`; do not expose them through a `VITE_` variable.
- The word lookup is layered: PostgreSQL stores server results and the browser
  caches returned word data in `localStorage`; the local syllable estimator is
  the fallback.
- Keep network failure, empty, loading, pending, and retry states accessible.
  Prevent duplicate submissions while mutations are pending.
- Do not claim a deployment provider is configured without repository evidence.
