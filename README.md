# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Next Phases (Begin Feb 26, 2026)

Test 5 — Get non-existing word

getWordFromCache("goodbye") → returns {}

Test 7: Hook returns confidence level

Write test: cached result returns confidence: "verified", fallback returns confidence: "estimated"
Run test → fails
Add confidence property to return value
Test passes

Phase 3: Fallback
Test 8: Hook falls back to countSyllables on API error

Write test: mock API failure, verify countSyllables used
Run test → fails
Add fallback logic in catch block
Test passes

Phase 4: UI Indicators
Test 9: Show green indicator for verified syllables

Write test: render component with verified data, look for green indicator
Run test → fails
Add indicator UI based on confidence
Test passes

Test 10: Show yellow indicator for estimated syllables

Write test: render with estimated data, look for yellow indicator
Run test → fails
Update UI logic
Test passes
