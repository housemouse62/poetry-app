# Pre-Deployment Accessibility & Quality Audit

Issues are grouped by severity. Each entry includes the file, what's wrong, and why it matters.

---

## 🔴 Critical — Fix Before Deploying

`DONE 1.` `alert()` calls replace screen reader announcements in Login, Register, and Profile
**Files:** `apps/frontend/src/pages/Login/Login.jsx`, `Register/Register.jsx`, `Profile/Profile.jsx`

Every form success and error message currently uses `window.alert()`. Alert dialogs pull focus away from the page in a disruptive, inaccessible way and are blocked by some browsers/extensions. More importantly, they give no indication of _where_ the error is or how to fix it — screen reader users lose context entirely.

**Fix:** Replace each `alert()` with an inline `<p role="alert">` message rendered next to the form. Role `"alert"` causes screen readers to announce the message immediately without losing focus.

---

`DONE ` 2. Register form "Confirm Password" label reads "Password"
**File:** `apps/frontend/src/pages/Register/Register.jsx` — the last `<span>` in the form

The confirm-password field shows the floating label text "Password" instead of "Confirm Password". Sighted users can infer the difference from position, but screen reader users hear two identical fields in a row and have no way to distinguish them.

**Fix:** Change `<span>Password</span>` to `<span>Confirm Password</span>` on the confirmPassword field.

---

`DONE` 3. `<legend>` element used outside a `<fieldset>` in Profile
**File:** `apps/frontend/src/pages/Profile/Profile.jsx`

The update form uses a `<legend>` element directly inside a `<form>`, but `<legend>` only has meaning inside a `<fieldset>`. Browsers ignore it as a label; some will render it oddly. This is invalid HTML.

**Fix:** Replace `<legend>` with `<h2>` (or `<p>`) so the heading is both valid and meaningful.

---

`DONE` 4. Three unlabeled "Edit" buttons on Profile page

**File:** `apps/frontend/src/pages/Profile/Profile.jsx`

There are three buttons that all say "Edit" — one for name, one for email, one for screenname. Screen readers read these as "Edit button, Edit button, Edit button" with no context. Users navigating by button or form controls have no idea which field each button targets.

**Fix:** Add unique `aria-label` attributes: `"Edit name"`, `"Edit email"`, `"Edit screenname"`.

---

`DONE` 5. Rhyme-info `aria-label` props on `PoetryLine` are silently ignored

**File:** `apps/frontend/src/pages/Limerick/LimerickApp.jsx` + `apps/frontend/src/components/PoetryLine.jsx`

LimerickApp passes props like `aria-label="Line 1, rhymes with lines 2 and 5"` to each `PoetryLine`, intending to give screen reader users rhyme scheme context. However, `PoetryLine` never reads or forwards that prop — it generates its own `aria-label` on the textarea internally. Those rhyme descriptions are completely invisible to assistive technology.

**Fix:** Add a `rhymeInfo` prop to `PoetryLine` and append it to the textarea's `aria-label` (e.g., `"Line 1, 7 - 10 syllables, rhymes with lines 2 and 5"`). Update `LimerickApp` to pass `rhymeInfo` instead of `aria-label`.

**Bonus bug:** While fixing this, note that `LimerickApp` currently passes `aria-label="Line 4, rhymes with line 5"` — but Line 4 is a B rhyme that pairs with Line 3, not Line 5. The correct label should be `"rhymes with line 3"`.

---

`DONE` 6. Title textareas have no accessible label in Haiku and Limerick editors

**Files:** `apps/frontend/src/pages/HaikuApp/HaikuApp.jsx`, `apps/frontend/src/pages/Limerick/LimerickApp.jsx`

Both editors have a title `<textarea>` with only a `placeholder="Title"`. Placeholders disappear once you start typing and are not reliable accessible labels — screen readers often skip them or read them inconsistently. Users who navigate to the field after starting to type have no idea what it's for.

**Fix:** Add `aria-label="Haiku title"` / `"Limerick title"` to the respective textareas.

---

`DONE` 7. Modal close buttons labelled "X" with no accessible name

**File:** `apps/frontend/src/components/PoetryLine.jsx`

The flag modal and confirm-flag modal both have a close button with visible text `X`. Screen readers announce this as "X, button" — which is meaningless without visual context. Users navigating by button have no idea what this button closes.

**Fix:** Add `aria-label="Close flag dialog"` and `aria-label="Close confirm dialog"` to the respective close buttons.

---

## 🟡 Should Fix — Noticeably Better Accessibility

`DONE` 8. Like and Favorite buttons don't communicate their current state

**Files:** `apps/frontend/src/components/haikuCard/haikuCard.jsx`, `apps/frontend/src/components/LimerickCard/LimerickCard.jsx`

The like (♡/❤️) and favorite (☆/⭐) buttons toggle on/off but don't use `aria-pressed` to communicate the current state to screen readers. A user hears "Like haiku: My Poem, button" both when it's liked and when it isn't — with no way to know which state they're in without clicking and hoping.

**Fix:** Add `aria-pressed={likeState}` / `aria-pressed={favoriteState}` to each toggle button. Also update `aria-label` dynamically: `"Like haiku: Title"` ↔ `"Unlike haiku: Title"`, and `"Add to favorites"` ↔ `"Remove from favorites"`.

---

`DONE` 9. Download modal backdrop doesn't close on click in Haiku/Limerick cards

**Files:** `apps/frontend/src/components/haikuCard/haikuCard.jsx`, `apps/frontend/src/components/LimerickCard/LimerickCard.jsx`

The flag modals in `PoetryLine` correctly close when a user clicks outside them (clicking the backdrop). The download confirmation modals in the cards don't — the backdrop `div` has no `onClick` handler. The Escape key works (via `useFocusTrap`), but click-outside is a well-established pattern users expect.

**Fix:** Add `onClick={() => { setShowDownloadModal(false); downloadTriggerRef.current?.focus(); }}` to the outer container div, and `onClick={(e) => e.stopPropagation()}` to the dialog div itself (same pattern as PoetryLine modals).

---

`DONE` 10. Dashboard poem links have no descriptive accessible name

**File:** `apps/frontend/src/pages/Dashboard/Dashboard.jsx`

The two `<Link>` elements wrapping the haiku and limerick cards don't have an `aria-label`. Screen readers announce link text by reading all text inside — so users hear "haiku 5 - 7 - 5, link" and "limerick playful rhymes, link". This is functional but not great; adding explicit labels makes navigation intent clear.

**Fix:** Add `aria-label="Open haiku editor"` and `aria-label="Open limerick editor"` to the two `<Link>` components.

---

## 🔵 Deployment Readiness — Not Accessibility, But Should Be Cleaned Up

`DONE` 11. `console.log` statements left in production API handlers

**Files:** `HaikuApp.jsx` (3 calls), `LimerickApp.jsx` (4 calls), `haikuCard.jsx` (1 call), `LimerickCard.jsx` (2 calls, including one that logs every render)

Debug logs that print API responses and card data on every interaction and every render. These expose internal data structure in the browser console, which is visible to any user who opens DevTools.

**Fix:** Remove all `console.log` and `console.error` calls from production API response handlers. The `LimerickCard` render-time log (`console.log("limerick", limerick)` at the top of the function) is especially worth removing first — it fires on every card render.

---

`DONE` 12. `autoComplete` attribute values are non-standard on password and screenname fields

**Files:** `Login.jsx`, `Register.jsx`, `Profile.jsx`

- `Login.jsx` uses `autoComplete="password"` — the correct HTML5 value is `"current-password"`
- `Register.jsx` uses `autoComplete="password"` for new password fields — should be `"new-password"`
- `Register.jsx` uses `autoComplete="screenname"` — not a valid token; should be `"username"`
- `Profile.jsx` uses `autoComplete="current-password"` for the new/confirm-new password fields — should be `"new-password"`

Invalid `autoComplete` values are ignored by browsers and password managers, meaning users don't get autofill suggestions. This also prevents password managers from correctly categorizing saved credentials.

---

`DONE` 13. Unused import in LimerickApp

**File:** `apps/frontend/src/pages/Limerick/LimerickApp.jsx`

`html2canvas` and `useRef` / `useEffect` are imported but never used in this file (the download feature lives in `LimerickCard`). Unused imports add to bundle size and create confusion about what the file actually does.

**Fix:** Remove `import html2canvas from "html2canvas"` and remove `useRef` and `useEffect` from the React import.

---

`DONE` 14. `useEffect` in `PoetryLine` is missing a dependency

**File:** `apps/frontend/src/components/PoetryLine.jsx` — line 60–62

```js
useEffect(() => {
  onSyllableChange?.(currentSyllables);
}, [currentSyllables]); // missing: onSyllableChange
```

`onSyllableChange` is used inside the effect but not listed as a dependency. React's exhaustive-deps rule would flag this. In practice it's unlikely to cause a bug since the callback is stable, but it's a correctness issue that could bite during refactors.

**Fix:** Add `onSyllableChange` to the dependency array.
