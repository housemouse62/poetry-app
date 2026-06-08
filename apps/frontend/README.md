# make poetry.

An accessible, full-stack poetry composition tool built to explore the intersection of traditional poetic forms and modern web technology.

---

## Screenshots

![Make Poetry Screen 1](src/assets/make%20poetry%20screen%201.png)
![Make Poetry Screen 2](src/assets/make%20poetry%20screen%202.png)
![Make Poetry Screen 3](src/assets/make%20poetry%20screen%203.png)

---

## Why This Exists

Poetry is inherently multisensory — rhythm, sound, pattern — but most digital writing tools flatten these dimensions into plain text. This app treats accessibility not as compliance, but as an opportunity to enhance the poetic experience through alternative sensory channels.

Currently focused on haiku and limerick composition with real-time syllable counting, pattern validation, and a full user account system. The long-term vision includes aural scansion (dynamic text-to-speech with metrical stress), haptic rhythm feedback for tactile meter awareness, and voice-to-meter dictation.

---

## Features

### Authentication
- Register with name, screenname, email, and password
- JWT-based login, stored in localStorage via `AuthContext`
- Profile management: update name, screenname, email, or password
- Account deletion with email confirmation

### Haiku (`/haiku`) — 5-7-5
- Three-line editor enforcing the 5-7-5 syllable pattern
- Real-time syllable counter and progress bar per line
- Save, edit, delete, and download haikus (PNG via html2canvas)
- Like and favorite individual haikus
- Publish toggle to share with other users
- Example haiku toggle for new users

### Limerick (`/limerick`) — AABBA
- Five-line editor with color-coded borders showing which lines rhyme
- Target syllable ranges: lines 1, 2, 5 (7–10), lines 3 and 4 (5–8)
- ARIA labels and screen-reader-only text describe the AABBA rhyme relationships
- Same save / edit / delete / download / like / favorite flow as haiku

### Syllable Counting

English syllable counting is notoriously hard for rule-based algorithms. The app uses a two-tier system:

| Source | When used | Confidence indicator |
|---|---|---|
| [WordsAPI](https://www.wordsapi.com/) via RapidAPI | Fetched on spacebar press | Green — **verified** |
| `countSyllables()` regex fallback | API unavailable or word not cached | Yellow — **estimated** |

Words are cached in `localStorage` after the first fetch, so the API is only called once per unique word. A word flagging flow lets users report incorrect syllable counts directly from the editor.

### Word Flagging
- Flag button on each line opens a modal showing every word with its syllable count
- Click a word to enter a confirm/deny flow
- Flagged words are sent to the API for review
- Full focus-trap and keyboard navigation through all three modal steps

---

## Accessibility

- **ARIA live regions** announce syllable count changes as you type
- **Focus trapping** (`useFocusTrap` hook) keeps keyboard focus inside modals — Tab cycles, Escape dismisses, and focus returns to the trigger on close
- **`aria-expanded`** on all show/hide toggles communicates collapsed state to screen readers
- **`aria-pressed`** on like and favorite buttons communicates toggle state
- **`role="dialog"` + `aria-modal` + `aria-labelledby`** on every modal
- **`role="alert"`** on all error messages for immediate screen reader announcement
- **`role="status"`** on success messages (saved, complete) for polite announcements
- **Screen-reader-only text** (`sr-only`) explains the AABBA rhyme scheme in full prose
- **Decorative emoji** hidden from assistive technology via `aria-hidden`
- **Semantic HTML** throughout: `<main>`, `<nav>`, `<header>`, `<article>`, `<button>` rather than generic divs
- **`aria-describedby`** on the disabled save button explains why it's disabled before the form is complete

---

## Tech Stack

| Layer | Technology |
|---|---|
| Monorepo | Turborepo |
| Backend | Node.js, Express |
| Database | PostgreSQL, Prisma 7 |
| Auth | JWT, bcrypt |
| API security | Helmet, Morgan, express-validator, rate limiting, CORS |
| Frontend | React 19, Vite |
| Routing | React Router v7 |
| Syllable API | WordsAPI via RapidAPI |
| Image export | html2canvas |
| Word cache | localStorage |
| API tests | Vitest, Supertest |
| Frontend tests | Vitest, React Testing Library |
| Deploy — API | Railway |
| Deploy — frontend | Vercel |

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL (local instance for development and a separate one for tests)
- A [RapidAPI](https://rapidapi.com/) account with access to **WordsAPI** (free tier works)

### Install

From the monorepo root:

```bash
npm install
```

### Environment

**`apps/api/.env`**
```env
DATABASE_URL=your_postgres_connection_string
JWT_SECRET=your_jwt_secret
CORS_ORIGIN=http://localhost:5173
PORT=3000
RAPID_API_KEY=your_rapidapi_key
```

**`apps/frontend/.env`**
```env
VITE_API_URL=http://localhost:3000
VITE_WORDS_API_KEY=your_rapidapi_key
```

> The frontend works without a Words API key — syllable counting falls back to the local estimator, shown with a yellow confidence indicator.

### Run both apps

```bash
npm run dev
```

Turborepo starts both the API (port 3000) and frontend (port 5173) in parallel.

Or run them individually:

```bash
# API only
cd apps/api && npm run dev

# Frontend only
cd apps/frontend && npm run dev
```

---

## Testing

### API (integration tests)

The API has 180+ integration tests using Vitest and Supertest, run against a real local test database (not mocks).

```bash
cd apps/api
npm test
```

Test coverage spans all routes:

| File | Coverage |
|---|---|
| `user.test.js` | Register, login, profile update, account deletion |
| `haiku.test.js` | CRUD, likes, publish |
| `limerick.test.js` | CRUD, likes, publish |
| `haikuComment.test.js` | Comment create, read, delete |
| `limerickComment.test.js` | Comment create, read, delete |
| `haikuReply.test.js` | Reply create, read, delete |
| `limerickReply.test.js` | Reply create, read, delete |
| `favorite.test.js` | Add and remove favorites |
| `word.test.js` | Word lookup and flagging |

### Frontend (component tests)

```bash
cd apps/frontend
npm test               # run all tests
npm run test:watch     # watch mode
npm run coverage       # generate coverage report
```

---

## Project Structure

```
poetry-app/
├── apps/
│   ├── api/
│   │   ├── app.js                    # Express app setup (middleware, routes)
│   │   ├── src/
│   │   │   ├── user.js               # Auth routes (register, login, profile, delete)
│   │   │   ├── haiku.js              # Haiku CRUD + likes
│   │   │   ├── limerick.js           # Limerick CRUD + likes
│   │   │   ├── haikuComment.js       # Comments on haikus
│   │   │   ├── haikuReply.js         # Replies to haiku comments
│   │   │   ├── limerickComment.js    # Comments on limericks
│   │   │   ├── limerickReply.js      # Replies to limerick comments
│   │   │   ├── favorite.js           # Favorites (haiku + limerick)
│   │   │   └── word.js               # Word lookup and syllable flagging
│   │   ├── middleware/
│   │   │   ├── verifyToken.js        # JWT auth guard
│   │   │   ├── verifyAdmin.js        # Admin role guard
│   │   │   └── limiters.js           # Rate limiting configuration
│   │   ├── db/
│   │   │   └── prismaClient.js       # Prisma client singleton
│   │   └── tests/                    # 180+ integration tests
│   │
│   └── frontend/
│       └── src/
│           ├── main.jsx              # Entry point (React + Router + AuthProvider)
│           ├── routes.jsx            # Route definitions with ProtectedRoute wrapper
│           ├── context/
│           │   └── AuthContext.jsx   # JWT auth state, login/logout
│           ├── components/
│           │   ├── PoetryLine.jsx    # Textarea + syllable counter + flag modal flow
│           │   ├── ProtectedRoute.jsx
│           │   ├── haikuCard/        # Saved haiku display (edit, delete, download, like, favorite)
│           │   └── LimerickCard/     # Same for limericks
│           ├── pages/
│           │   ├── Home/             # Landing page
│           │   ├── Login/
│           │   ├── Register/
│           │   ├── Dashboard/        # Poem type selector
│           │   ├── Profile/          # Account management
│           │   ├── HaikuApp/         # Haiku editor
│           │   └── Limerick/         # Limerick editor
│           └── utils/
│               ├── syllableCounter.js   # Regex-based fallback estimator
│               ├── useWordData.js       # Hook: fetch word data from API or cache
│               ├── useFocusTrap.js      # Hook: keyboard focus management in modals
│               ├── wordCache.js         # localStorage word cache helpers
│               └── formatDate.js        # Date formatting
│
├── package.json                      # Workspace root
└── turbo.json                        # Turborepo pipeline config
```

---

## Development Approach

**Test-driven development.** The API was built test-first: routes are written alongside their integration tests, keeping the suite green through every refactor.

**Accessibility first.** ARIA patterns are used where semantic HTML isn't sufficient. All color-coded UI (rhyme scheme indicators, syllable status) has a non-visual alternative. Every interactive component is fully keyboard navigable.

**AI-assisted learning.** Built with Claude as a technical mentor — asking questions, exploring trade-offs, and debugging logic rather than generating code. This approach is slower but builds genuine understanding of React patterns, API design, testing strategies, and accessibility best practices.

---

## Known Limitations

- **Diphthong detection:** `countSyllables()` can't distinguish a true diphthong (e.g. "coin") from adjacent vowels that span a syllable boundary (e.g. "co-in" in "coincidence"). WordsAPI always returns the correct count.
- **Rhyme checking:** The app guides line length but doesn't verify that AABBA lines actually rhyme — that part's on you.
- **Comments and replies:** The API has full comment and reply support (with likes), but the UI doesn't surface them yet.

---

## License

MIT
