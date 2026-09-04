# make poetry.

An accessibility-first, full-stack poetry composition and sharing application
for writing haikus and limericks.

The project treats accessibility as part of the creative experience: poetic
structure is communicated through text, live status, and non-color cues as
well as visual layout.

This README documents current repository behavior. Future product ideas such
as spoken/prosody-aware reading, haptics, native apps, widgets, and additional
poetry collections are roadmap work described in [MASTER_PLAN.md](MASTER_PLAN.md),
not current application features.

## Screenshots

![Make Poetry editor](apps/frontend/src/assets/make%20poetry%20screen%201.png)
![Make Poetry saved poems](apps/frontend/src/assets/make%20poetry%20screen%202.png)
![Make Poetry word details](apps/frontend/src/assets/make%20poetry%20screen%203.png)

## Features

### Accounts and authentication

- Register with a name, screenname, email, and password
- Log in with a JWT-backed session persisted by `AuthContext` in
  `localStorage`
- Update name, screenname, email, and password from the profile page
- Delete an account after confirming its email address
- Protect authenticated frontend routes and send bearer tokens to protected
  API endpoints

Registration and login are the unauthenticated API entry points. Poetry,
profile, word, favorite, comment, reply, and feed endpoints currently require
authentication.

### Haiku editor (`/haiku`)

- Three-line editor with 5–7–5 completion targets
- Per-line syllable count and progress feedback
- Save, resume, update, and discard authenticated server-backed drafts
- Publish completed poems, edit or delete published poems, and download them as
  PNG images with `html2canvas`
- Like and favorite saved poems
- Show or hide an example haiku

### Limerick editor (`/limerick`)

- Five-line editor with syllable targets of 7–10 for lines 1, 2, and 5 and
  5–8 for lines 3 and 4
- AABBA rhyme relationships represented with visual styling, accessible
  labels, and screen-reader text
- Save, resume, update, and discard authenticated server-backed drafts
- Publish completed poems, edit or delete published poems, and download them
- Like and favorite saved poems
- Show or hide an example limerick

The editor guides the AABBA structure but does not automatically verify that
the lines rhyme.

### Published poetry feed (`/poems`)

Authenticated users can browse a combined feed of published haikus and
limericks. The feed supports:

- filtering by poem type
- filtering to the past 24 hours, 3 days, or 7 days
- sorting by newest or most liked
- pagination
- loading, empty, error, and retry states
- liking/unliking poems
- adding/removing private favorites
- viewing and posting comments
- viewing and posting replies

“Published” describes poem visibility; the current feed is not anonymously
accessible because both the frontend route and API endpoint require a login.

### Ownership and publication

- New poems are unpublished by default.
- Owners can view all of their poems, including unpublished drafts.
- Published collection and per-user endpoints return published poems only.
- Direct reads of an unpublished poem are available only to its owner. Poem
  likes, favorites, and comment/reply reads and creation apply the same check.
- Poem authors can update and delete their work; the API also allows admins to
  delete poems.
- Comment and reply authors can edit their own content. Their delete endpoints
  also support the existing admin override.

Authorization is enforced by the API rather than relying on frontend controls.
The current comment-like and reply-like endpoints authenticate the caller and
check that the target exists, but do not independently re-check the parent
poem's publication visibility.

### Comments, replies, likes, and favorites

- The feed UI displays and creates comments and one level of replies for both
  poem types.
- Comments and replies are limited to 600 characters and reject blank content.
- The API and feed UI support creating, reading, editing, deleting, liking, and
  unliking comments and replies, subject to ownership rules.
- Poems can be liked once per user and unliked.
- Favorites support haiku and limerick targets and `private` or `public`
  privacy. The API can list a user's own favorites, list another user's public
  favorites, change privacy, and remove favorites.
- New favorites are private by default. The authenticated `/favorites` page
  lists the current user's favorites and provides private/public privacy
  controls and removal.

### Syllable counting and word flagging

Word data follows a layered fallback:

1. The browser checks its `localStorage` word cache.
2. The authenticated API checks PostgreSQL, then requests WordsAPI through
   RapidAPI using the server-side `WORDS_API_KEY`.
3. If external word data has no syllable result, the API uses the local
   rule-based `countSyllables()` estimator.
4. If the frontend request itself fails, the frontend also falls back to its
   local estimator and marks the result as estimated.

API-sourced database entries are refreshed lazily after 30 days, while
algorithm-sourced entries are refreshed after 24 hours. Browser entries use a
versioned cache and expire after 7 days for API data or 1 hour for algorithm
data. Transient frontend fallbacks are not persisted. `/word` responses expose
`word`, `source`, `flagged`, and `syllables.count` consistently, with syllable
lists and pronunciation included when available.

Users can open a keyboard-accessible modal from an editor line, inspect word
counts, and flag a stored word for review.

## Accessibility approach

Implemented patterns include:

- live regions for syllable and interaction status
- focus trapping and focus restoration for editor modals
- keyboard-operable native buttons and form controls
- `aria-expanded` and `aria-pressed` for disclosure and toggle state
- labelled modal dialogs and inline alert/status messaging
- screen-reader descriptions for limerick rhyme relationships
- non-color indicators alongside visual syllable and rhyme feedback
- semantic landmarks and headings across primary screens

Accessibility is an ongoing product constraint, not a claim that the current
application has completed a formal accessibility audit.

## Tech stack

| Layer              | Technology                                                  |
| ------------------ | ----------------------------------------------------------- |
| Monorepo           | npm workspaces, Turborepo 2                                 |
| Frontend           | React 19, React Router 7, Vite 7, plain CSS                 |
| API                | Node.js, Express 5                                          |
| Database           | PostgreSQL, Prisma 7 with `@prisma/adapter-pg`              |
| Authentication     | JWT, bcryptjs                                               |
| API middleware     | Helmet, Morgan, CORS, express-validator, express-rate-limit |
| External word data | WordsAPI via RapidAPI                                       |
| Image export       | html2canvas                                                 |
| Tests              | Vitest, Supertest, React Testing Library, jsdom             |

## Getting started

### Prerequisites

- Node.js 24 is recommended and is used by CI and Codespaces. Although the root
  package currently declares Node.js 18 or newer, the installed Vite 7 and
  Prisma 7 toolchain requires Node.js 20.19+ or 22.12+; Node.js 18 is not a
  viable development runtime for the current dependency set.
- npm 11 (the root package declares `npm@11.11.0`)
- PostgreSQL
- Optional: a RapidAPI key for WordsAPI. It is used only by the API; without
  one, syllable lookup falls back to the local estimator.

### Install

Install from the repository root. The root `package-lock.json` is authoritative
for the npm workspace, CI, Codespaces, and Railway builds:

```bash
npm ci
```

Use `npm install` when intentionally changing dependencies. Do not create or
maintain a separate `apps/api/package-lock.json`. A tracked
`apps/frontend/package-lock.json` exists historically, but workspace installs,
CI, Codespaces, and Railway use the root lockfile.

### Environment variables

Create `apps/api/.env`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/make_poetry
TEST_DATABASE_URL=postgresql://user:password@localhost:5432/make_poetry_test
JWT_SECRET=replace_with_a_long_random_secret
CORS_ORIGIN=http://localhost:5173
PORT=3000
WORDS_API_KEY=your_optional_rapidapi_key
```

Create `apps/frontend/.env`:

```env
VITE_API_URL=http://localhost:3000
```

The RapidAPI credential is read by the API and should not be placed in a
`VITE_` variable, which would expose it to frontend code.

### Prepare the databases

Create separate development and test databases in your local PostgreSQL
instance. For the example URLs above:

```bash
createdb make_poetry
createdb make_poetry_test
```

Generate the Prisma client and apply checked-in migrations to the development
database:

```bash
cd apps/api
npx prisma generate --schema=prisma/schema.prisma
npx prisma migrate deploy --schema=prisma/schema.prisma
```

For API tests, use a separate database and apply the same migrations:

```bash
cd apps/api
NODE_ENV=test npx prisma migrate deploy --schema=prisma/schema.prisma
```

Never use a development or production database as `TEST_DATABASE_URL`; the
integration suite creates and deletes test records.

### Run the application

From the repository root, start both workspaces through Turborepo:

```bash
npm run dev
```

Or run one workspace from the repository root:

```bash
npm run dev --workspace=api
npm run dev --workspace=poetry-app
```

With the example environment above, the API listens on port 3000 and Vite
normally serves the frontend on port 5173.

### Codespaces and devcontainers

The checked-in devcontainer uses Node.js 24 and PostgreSQL 16. On creation,
`.devcontainer/setup-codespaces.sh`:

- installs the workspace from the root lockfile with `npm ci`
- creates `apps/api/.env` and `apps/frontend/.env` when needed
- creates the development and test databases
- generates a local JWT secret when one is absent
- applies Prisma migrations to both databases
- configures the frontend/API origins for Codespaces port forwarding

`WORDS_API_KEY` is left empty unless a developer supplies it. The post-start
script attempts to make ports 3000 and 5173 public when GitHub policy and
authentication permit it; failure is nonfatal.

Git LFS is not configured or installed by the current devcontainer, and the
repository has no tracked `.gitattributes` LFS rules. Git LFS automation is
deferred; a normal checkout does not currently require it.

## Tests and checks

### API integration tests

The API suite uses Vitest and Supertest against the PostgreSQL database named
by `TEST_DATABASE_URL`. Tests run serially to avoid shared-database conflicts,
and rate limiters skip only under `NODE_ENV=test`.

```bash
cd apps/api
NODE_ENV=test npx prisma migrate deploy --schema=prisma/schema.prisma
NODE_ENV=test npm test -- --run
```

Coverage includes users and authentication, haiku and limerick CRUD and likes,
comments, replies, favorites, the combined feed, word lookup/flagging, and the
syllable estimator.

### Frontend component tests

```bash
cd apps/frontend
npm test -- --run
npm run test:coverage
```

Frontend tests use Vitest, jsdom, React Testing Library, and shared helpers that
provide authentication and router context where needed. Run `npm test` without
`-- --run` when an interactive Vitest session is desired.

### Other checks

```bash
npm run lint
npm run build
```

The root package does not currently define a combined test command.

### Continuous integration

GitHub Actions runs on pushes and pull requests to `main` using Node.js 24 and
PostgreSQL 16. The workflow installs once from the monorepo root with `npm ci`
and the root `package-lock.json`, then:

1. lints the frontend
2. checks API JavaScript syntax
3. runs frontend tests
4. builds the frontend
5. applies Prisma migrations to the CI test database
6. runs the API integration suite

The API test runner disables file parallelism because test files share one
PostgreSQL database.

## Project structure

```text
poetry-app/
├── apps/
│   ├── api/
│   │   ├── app.js                    # Express middleware and route mounts
│   │   ├── db/prismaClient.js        # Environment-aware Prisma client
│   │   ├── middleware/               # Token/admin guards and rate limiters
│   │   ├── prisma/
│   │   │   ├── schema.prisma         # PostgreSQL data model
│   │   │   └── migrations/           # Checked-in schema migrations
│   │   ├── generated/prisma/         # Generated client; do not edit manually
│   │   ├── src/
│   │   │   ├── user.js               # Registration, login, profile, deletion
│   │   │   ├── haiku.js              # Haiku CRUD and poem likes
│   │   │   ├── limerick.js           # Limerick CRUD and poem likes
│   │   │   ├── feed.js               # Filtered, sorted, paginated poem feed
│   │   │   ├── haikuComment.js       # Haiku comments and comment likes
│   │   │   ├── limerickComment.js    # Limerick comments and comment likes
│   │   │   ├── haikuReply.js         # Haiku replies and reply likes
│   │   │   ├── limerickReply.js      # Limerick replies and reply likes
│   │   │   ├── favorite.js           # Polymorphic poem favorites
│   │   │   ├── word.js               # Word lookup, persistence, and flags
│   │   │   └── utils/                 # WordsAPI and syllable helpers
│   │   └── tests/                     # Supertest/PostgreSQL integration tests
│   └── frontend/
│       ├── src/
│       │   ├── components/
│       │   │   ├── PoetryLine.jsx     # Editor line, status, and word modal
│       │   │   ├── HaikuCard/         # Saved-haiku actions
│       │   │   ├── LimerickCard/      # Saved-limerick actions
│       │   │   ├── PoemCard/          # Feed poem and interactions
│       │   │   └── CommentCard/       # Feed comments and replies
│       │   ├── context/AuthContext.jsx
│       │   ├── pages/
│       │   │   ├── Home/              # Landing and navigation
│       │   │   ├── Login/             # Authentication form
│       │   │   ├── Register/          # Account creation
│       │   │   ├── Dashboard/         # Composition navigation
│       │   │   ├── Profile/           # Profile and account management
│       │   │   ├── Favorites/         # Favorite collection and privacy
│       │   │   ├── HaikuApp/          # Haiku editor
│       │   │   ├── Limerick/           # Limerick editor
│       │   │   └── Poetry/            # Published poetry feed
│       │   ├── routes.jsx             # Protected route definitions
│       │   └── utils/                  # Syllables, words, cache, focus, dates
│       └── tests/test-utils.jsx        # Shared render/provider helpers
├── AGENTS.md                           # Repository guidance for agents
├── BACKLOG.md                          # Current engineering backlog
├── MASTER_PLAN.md                      # Broader product roadmap
├── package-lock.json                   # Authoritative workspace lockfile
├── package.json                        # Workspace scripts and metadata
├── README.md                           # Project documentation
└── turbo.json                          # Turborepo task configuration
```

## Deployment

The current API deployment is configured in Railway's service settings rather
than a checked-in `railway.toml`, `railway.json`, or `Procfile`. Railway builds
from the monorepo root and uses the root `package-lock.json`.

### API

- Set the Railway service root/build context to the monorepo root.
- Install with `npm ci` from that root; do not add an
  `apps/api/package-lock.json`.
- Set `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `PORT`, and optionally
  `WORDS_API_KEY` in the runtime environment.
- Generate Prisma Client with
  `npm exec --workspace=api -- prisma generate --schema=prisma/schema.prisma`
  when required by the Railway build flow.
- Apply checked-in migrations with
  `npm exec --workspace=api -- prisma migrate deploy --schema=prisma/schema.prisma`.
- Start with the workspace-aware command `npm run start --workspace=api`.

### Frontend

- Set `VITE_API_URL` at build time to the deployed API origin.
- Build from the root with `npm run build`, or build only the frontend with
  `npm run build --workspace=poetry-app`.
- Publish `apps/frontend/dist` as a static site.
- Configure the host to serve the SPA entry point for client-side routes such
  as `/haiku`, `/limerick`, `/poems`, and `/profile`.

Set the API's `CORS_ORIGIN` to the deployed frontend origin.

## Known limitations

- Rule-based English syllable counting cannot resolve every pronunciation;
  external dictionary data is preferred when available.
- Limerick rhyme relationships are guidance only; rhyme is not automatically
  verified.
- The feed requires authentication even though it contains published poems.

## License

The frontend package includes an MIT license file. The API package currently
declares ISC in its package metadata; the monorepo does not yet have a single
root license file.
