# Poetry App — Punch List

Goal: get this app shareable.

---

## Quick Wins

- [x] Remove all `console.log` calls (HaikuApp.jsx, HaikuLine.jsx, WordFind.js, haikuStorage.js, limericksStorage.js)
- [ ] Add a `.env.example` file documenting `VITE_WORDS_API_KEY`
- [x] Deduplicate `syllableCounter.js` — move one shared copy to `src/utils/`, delete the two page-level copies

---

## Testing Gaps

- [x] Add tests for `src/pages/Limerick/syllableCounter.js` (resolves itself once deduplicated)
- [ ] Add tests for `LimerickLine.jsx` (HaikuLine is tested, LimerickLine is not)
- [ ] Extract the `confidence` calculation in `HaikuLine.jsx` to a pure function so it can be unit tested independently

---

## Architecture

- [ ] Fix Limerick completion check — `LimerickApp.jsx` calls `countSyllables()` on every render for all 5 lines; adopt the `onSyllableChange` callback pattern used in HaikuApp
- [ ] Add a TTL or cache version to the word cache — entries currently live in `localStorage` forever and can go stale silently
- [ ] Merge `haikuStorage.js` and `limericksStorage.js` into a single generic `poemStorage(type)` factory
- [ ] Consider a backend proxy for the WordsAPI key — `VITE_` prefix exposes it in the client bundle (low priority until public)

---

## Biggest Unlock

- [x] Bring `useWordData` (API-backed syllable counting) to the Limerick editor — it currently uses only the `countSyllables` fallback; all the infrastructure already exists

---

## Roadmap (post-shareable)

- [ ] Add more poetry forms — architecture is ready (sonnet, villanelle, pantoum)
- [ ] Database migration for persistent, cross-user word cache
- [ ] SSML-based aural scansion engine (text-to-speech with metrical stress)
- [ ] Haptic rhythm feedback on mobile
- [ ] Voice-to-meter composition
- [ ] User authentication + persistent poem ownership
- [ ] Social features (following poets, curated feeds)
