# API Tests

Integration tests that run against a real local database. No mocking — what passes here reflects actual behavior.

## Setup

You need a local Postgres database named `make_poetry_test` and the following in `apps/api/.env`:

```
TEST_DATABASE_URL="postgresql://<your-user>@localhost/make_poetry_test"
```

Make sure the test database has migrations applied:

```
NODE_ENV=test npx prisma migrate deploy --schema=prisma/schema.prisma
```

## Running tests

```
cd apps/api
NODE_ENV=test npx vitest run
```

## How the tests are structured

Each test file:
- Has a global `beforeEach` that deletes test data so every test starts clean
- Routes that require a logged-in user create a fresh user and log in inside their `beforeEach`, storing the token in a variable the tests can use

The rate limiter in `src/user.js` is configured to skip when `NODE_ENV=test`. It works normally in production.

## Reviewing the tests

### Step 1 — Run them

All tests should pass. If any fail, vitest shows expected vs received. Read the diff before changing anything.

### Step 2 — Review each group

**`POST /users/create` (6 tests)**

- The happy path checks that `password` is NOT in the response. Confirm you never want to return a password hash to the client.
- The "email already in use" test creates a user twice and expects 400 with `"Email already in use"`. This message is hardcoded in `src/user.js` — if you change it there, update the test too.
- The weak password test sends `"weak"`. Change it to whatever edge case concerns you most.

**`POST /users/login` (3 tests)**

- The happy path checks that a `token` exists and that `password` is NOT in the response.
- Both failure cases (wrong password, user not found) return 404 with `"Invalid Credentials"`. This is intentional — you don't want to reveal whether an email address is registered. Confirm that's your intent.

**`PATCH /users/profile` (8 tests)**

- Each test gets a fresh user and a real token via `beforeEach`. The token goes through `verifyToken` middleware just like production.
- The "updates name" test checks that a new token is returned. If you ever stop re-issuing tokens on profile updates, this test will catch it.
- The "wrong current password" test expects 404. That status code is set in `src/user.js` — agree with that choice?

### Step 3 — What is not tested (your call whether to add it)

- Creating a user without a `screenname`
- Updating email to one that already exists in the database — the route doesn't explicitly handle that Prisma unique constraint error
