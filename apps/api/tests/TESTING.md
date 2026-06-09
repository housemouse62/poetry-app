# API Testing Guide

Integration tests that run against a real local Postgres database. No mocking.

## Setup

1. Create a local database named `make_poetry_test`
2. Add `TEST_DATABASE_URL` to `apps/api/.env`:
   ```
   TEST_DATABASE_URL="postgresql://<your-user>@localhost/make_poetry_test"
   ```
3. Apply migrations to the test database:
   ```
   NODE_ENV=test npx prisma migrate deploy --schema=prisma/schema.prisma
   ```

## Running tests

```
cd apps/api
NODE_ENV=test npx vitest run
```

Test files run sequentially (configured in `vitest.config.js`) to prevent tests from interfering with each other.

---

## Test files

| File | Routes covered |
|------|----------------|
| `user.test.js` | POST /users/create, POST /users/login, PATCH /users/profile, DELETE /users |
| `haiku.test.js` | All /haiku routes |
| `limerick.test.js` | All /limerick routes |
| `haikuComment.test.js` | All /haikuComment routes |
| `limerickComment.test.js` | All /limerickComment routes |
| `haikuReply.test.js` | All /haikuReply routes |
| `limerickReply.test.js` | All /limerickReply routes |
| `favorite.test.js` | All /favorite routes |
| `word.test.js` | All /word routes |

---

## How the tests are structured

**Test users** — defined in `helpers.js`:
- `TEST_USER` (`test.author@poetry.com`) — the author/owner in authorization tests
- `TEST_OTHER_USER` (`test.other@poetry.com`) — used to verify non-owners can't do things
- `TEST_ADMIN_USER` (`test.admin@poetry.com`) — promoted to admin via Prisma in `beforeAll`, used to verify admin overrides

**Setup pattern** — each test file:
1. `beforeAll`: creates the three test users, logs them in, stores their tokens. Files that need existing data (comments need a poem, replies need a comment) also create that in `beforeAll`.
2. `afterAll`: calls `cleanup()` from `helpers.js`, which deletes all test data for those three emails in the correct order to satisfy foreign key constraints.
3. `beforeEach` (where needed): some files clean up the specific resource being tested (e.g., favorites) before each test to prevent unique constraint violations.

**Rate limiters** — the `authLimiter` in `src/user.js` and `createLimiter`/`globalLimiter` in `middleware/limiters.js` all skip when `NODE_ENV=test`. They work normally in production.

---

## What was fixed while writing these tests

**`PATCH /haiku/:id` and `PATCH /limerick/:id`** — the routes were always writing all fields, even ones not included in the request. `parseInt(undefined)` = `NaN`, which caused a 500 on partial updates (e.g., only changing the title). Fixed in `src/haiku.js` and `src/limerick.js` to only write provided fields.

**All like routes** — liking the same thing twice hit the `@@unique` constraint and returned 500. Fixed in all 6 like routes to return 409 instead.

---

## Reviewing the tests

### user.test.js (19 tests)
- `POST /users/create`: checks that `password` is never in the response, duplicate emails are rejected, and validation catches mismatched emails/passwords and weak passwords.
- `POST /users/login`: checks that both wrong-password and user-not-found return the same error (`"Invalid Credentials"`) — intentional, so you can't tell if an email is registered.
- `PATCH /users/profile`: checks that a new token is re-issued on profile update. If you ever stop doing that, this test will catch it.
- `DELETE /users`: verifies the user is actually gone by attempting to log in after deletion and expecting 404.

### haiku.test.js / limerick.test.js (29 tests each)
- `GET /`: only published poems should appear.
- `GET /mine`: all of the user's poems, including unpublished.
- `GET /:id`: owner can see their unpublished poem; other users get 403.
- `GET /user/:userID`: only published poems, even when viewed by the author themselves.
- `PATCH /:id` / `DELETE /:id`: author can; other user cannot (403); admin can delete anything.
- Like / unlike: basic 201/200, 404 for missing poem, 409 for duplicate like.

### haikuComment.test.js / limerickComment.test.js (21 tests each)
- A shared haiku/limerick is created once in `beforeAll` and all comment tests use it.
- PATCH and DELETE: author can; non-author gets 403; admin can delete.
- 409 for liking the same comment twice.

### haikuReply.test.js / limerickReply.test.js (21 tests each)
- A shared poem and comment are created in `beforeAll`. All reply tests use the same comment.
- Same authorization pattern: author can edit/delete, non-author cannot (403), admin can delete.
- 409 for liking the same reply twice.

### favorite.test.js (13 tests)
- `GET /mine`: returns all favorites regardless of privacy.
- `GET /:userID`: returns **only public** favorites. The test explicitly adds one public and one private, then verifies only the public one appears.
- `POST /:poemType/:poemID`: supports both `haiku` and `limerick` poem types.
- `PATCH /:poemType/:poemID`: updates privacy on an existing favorite. Tests both directions (private → public and public → private). Returns 404 if the favorite doesn't exist.
- `DELETE /:poemType/:poemID`: removes the favorite and returns it.
- A `beforeEach` clears favorites between tests to prevent the unique constraint (`userID + poemID + poemType`) from causing duplicate errors.

### word.test.js (10 tests)
- `POST /word`: the route is a find-or-create — returns 200 if the word already exists, 201 if it was new. The test verifies both behaviors.
- `GET /word/:word`: looks up a word by its string value. 404 if it doesn't exist.
- `PATCH /word/:word/flag`: toggles the `flagged` field. Tests both directions (false → true and true → false) to confirm it's actually toggling and not just setting.
