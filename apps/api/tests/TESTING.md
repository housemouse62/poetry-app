# API Testing Guide

The API tests are Vitest/Supertest integration tests against a real PostgreSQL database. Persistence is not mocked.

## Prerequisites

Install workspace dependencies from the repository root using the authoritative root lockfile:

```bash
npm ci
```

Do not create a separate `apps/api/package-lock.json`.

Create a dedicated test database and set `TEST_DATABASE_URL` in `apps/api/.env`:

```env
TEST_DATABASE_URL=postgresql://user:password@localhost:5432/make_poetry_test
JWT_SECRET=test-only-secret
```

Never point `TEST_DATABASE_URL` at development or production data. The suite creates and deletes records.

Generate Prisma Client and apply the checked-in migrations before the first run and after schema changes:

```bash
cd apps/api
NODE_ENV=test npx prisma generate --schema=prisma/schema.prisma
NODE_ENV=test npx prisma migrate deploy --schema=prisma/schema.prisma
```

Prisma configuration selects `TEST_DATABASE_URL` when `NODE_ENV=test`; otherwise it uses `DATABASE_URL`.

## Running tests

From `apps/api`:

```bash
NODE_ENV=test npm test -- --run
```

Or from the repository root:

```bash
NODE_ENV=test npm test --workspace=api -- --run
```

API test files run serially because `apps/api/vitest.config.js` sets `fileParallelism: false` and all files share the test database. Authentication and creation rate limiters skip only under `NODE_ENV=test`.

## Coverage

The integration suite covers:

- registration, login, profile updates, and account deletion
- haiku and limerick validation, drafts, publication, CRUD, ownership, and likes
- comment and reply CRUD, authorization, visibility, likes, and ordering
- favorite creation, privacy changes, hydrated collections, and removal
- combined feed filtering, sorting, pagination, visibility, and deterministic ordering
- word lookup, cache refresh behavior, flagging, and syllable fallback

Shared users, authentication helpers, and cleanup live in `apps/api/tests/helpers.js`. Tests must preserve the generic invalid-credentials response and the route-specific authorization behavior documented in `AGENTS.md`.

## CI

The GitHub Actions workflow provisions PostgreSQL 16, sets `NODE_ENV=test`, applies migrations, and runs this suite after frontend lint, tests, build, and API syntax checks. CI installs dependencies once from the repository root with `npm ci`.
