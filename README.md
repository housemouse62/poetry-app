# Poetry App

An accessible poetry composition tool built to explore the intersection of traditional poetic forms and modern web technology.

---

## Screenshots

> _Add screenshots here_

---

## Why This Exists

Poetry is inherently multisensory — rhythm, sound, pattern — but most digital writing tools flatten these dimensions into plain text. This app treats accessibility not as compliance, but as an opportunity to enhance the poetic experience through alternative sensory channels.

Currently focused on haiku and limerick composition with real-time syllable counting and pattern validation. The long-term vision includes aural scansion (dynamic text-to-speech with metrical stress), haptic rhythm feedback for tactile meter awareness, and voice-to-meter dictation.

---

## Features

### Haiku (`/haiku`) — 5-7-5
- Three-line editor enforcing the 5-7-5 syllable pattern
- Real-time syllable counter and progress bar per line
- Save, view, and delete haikus — persisted to `localStorage`
- Download any saved haiku as a PNG image

### Limerick (`/limerick`) — AABBA
- Five-line editor with color-coded borders showing which lines rhyme
- ARIA labels and screen-reader-only text describe the rhyme relationships
- Same save / view / download / delete flow as haiku

### Syllable Counting

English syllable counting is notoriously hard for rule-based algorithms. The app uses a two-tier system:

| Source | When used | Confidence indicator |
|---|---|---|
| [WordsAPI](https://www.wordsapi.com/) via RapidAPI | Fetched on spacebar press | Green — **verified** |
| `countSyllables()` regex fallback | API unavailable or key missing | Yellow — **estimated** |

Words are cached in `localStorage` after the first fetch, so the API is only called once per unique word across the session.

### Accessibility

- ARIA live regions announce syllable counts as you type
- Keyboard focus is trapped inside the download confirmation modal (Escape to dismiss, Tab cycles within)
- Screen-reader-only text explains the AABBA rhyme scheme
- Decorative emoji are hidden from assistive technology via `aria-hidden`

---

## Current Status

**Working:**
- Haiku and limerick writers with real-time syllable counting
- Two-tier syllable validation: WordsAPI + custom fallback algorithm
- Smart caching layer (localStorage) to minimize API calls
- Poem persistence, viewing, and deletion
- Keyboard navigation and screen reader support
- PNG export via html2canvas

**In Development:**
- Database migration for permanent, cross-user word cache
- Enhanced ARIA patterns for rhyme scheme awareness
- Improved offline graceful degradation

**Planned:**
- Additional poetic forms: sonnets, villanelles, pantoums
- SSML-based "aural scansion" engine — text-to-speech with dynamic metrical stress
- Haptic rhythm feedback for tactile meter awareness on mobile
- Voice-to-meter composition with real-time syllable feedback
- User authentication and persistent poem ownership
- Social discovery (following poets, curated feeds)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router |
| Syllable API | WordsAPI via RapidAPI |
| Image export | html2canvas |
| Persistence | localStorage |
| Testing | Vitest, React Testing Library |
| Accessibility | ARIA labels, semantic HTML, keyboard navigation |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [RapidAPI](https://rapidapi.com/) account with access to **WordsAPI** (free tier works)

### Install

```bash
npm install
```

### Environment

Create a `.env` file at the project root:

```env
VITE_WORDS_API_KEY=your_rapidapi_key_here
```

> The app works without a key — syllable counting falls back to the local estimator, shown with a yellow confidence indicator.

### Run

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Testing

```bash
npm test               # run all tests
npm run test:watch     # watch mode
npm run coverage       # generate coverage report
```

Tests cover critical paths with a focus on:
- 100% on data persistence (localStorage, caching)
- ~95% on API integration and syllable counting logic
- Component rendering, user interactions, and accessibility features

---

## Project Structure

```
src/
├── routes.jsx                   # Route definitions: /, /haiku, /limerick
├── routes/root.jsx              # Dashboard component
├── utils/
│   └── wordCache.js             # localStorage cache helpers
└── pages/
    ├── HaikuApp/src/pages/
    │   ├── HaikuApp.jsx         # Main haiku editor
    │   ├── HaikuLine.jsx        # Per-line input, syllable counter, progress bar
    │   ├── WordFind.js          # useWordData hook — API fetch + cache
    │   ├── syllableCounter.js   # Regex-based fallback estimator
    │   └── haikuStorage.js      # save / get / delete haikus
    └── Limerick/
        ├── LimerickApp.jsx      # Main limerick editor
        ├── LimerickLine.jsx     # Per-line input with rhyme color coding
        ├── syllableCounter.js   # Same estimator (local copy)
        └── limericksStorage.js  # save / get / delete limericks
```

---

## Development Approach

**Test-driven development.** Every component is tested before or alongside implementation, keeping refactors safe as the architecture evolves.

**Accessibility first.** ARIA patterns are used where semantic HTML isn't sufficient, with non-visual alternatives provided for all color-coded UI (e.g., rhyme scheme indicators have both color borders and `aria-label` descriptions).

**AI-assisted learning.** Built with Claude as a technical mentor — asking questions, exploring trade-offs, and debugging logic rather than generating code. This approach is slower but builds genuine understanding of React patterns, testing strategies, and accessibility best practices.

---

## Known Limitations

- **Diphthong detection:** `countSyllables()` can't distinguish a true diphthong (e.g. "coin") from adjacent vowels that span a syllable boundary (e.g. "co-in" in "coincidence"). Affected words get a slightly off fallback count. WordsAPI always returns the correct count.
- **Rhyme checking:** The app guides line length but doesn't verify that AABBA lines actually rhyme — that part's on you.

---

## License

MIT
