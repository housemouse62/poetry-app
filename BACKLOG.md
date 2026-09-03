# Poetry App Backlog

This backlog reflects the current repository state only. It intentionally separates issues that are already evidenced in the codebase from product enhancements, architecture work, and future experimentation.

## Recommended near-term order

1. Modal/dialog focus restoration
2. Comment/reply edit-delete-like UI parity
3. Favorites UX parity
4. Draft/save flow for in-progress poems
5. Word-cache lifecycle/expiry policy
6. Git LFS automation for Codespaces
7. Bundle-size/code-splitting review

---

## Current correctness and accessibility issues

### 1) Modal/dialog focus restoration

Issue: The shared focus trap in [apps/frontend/src/utils/useFocusTrap.js](apps/frontend/src/utils/useFocusTrap.js) handles keyboard trapping and Escape, but does not restore focus to the triggering control on every close path. The dialog flows in [apps/frontend/src/components/PoetryLine.jsx](apps/frontend/src/components/PoetryLine.jsx), [apps/frontend/src/components/HaikuCard/HaikuCard.jsx](apps/frontend/src/components/HaikuCard/HaikuCard.jsx), and [apps/frontend/src/components/LimerickCard/LimerickCard.jsx](apps/frontend/src/components/LimerickCard/LimerickCard.jsx) show inconsistent focus restoration across close button, Escape, backdrop dismissal, and successful-action closes.

Done when:
- Every supported dialog close path restores focus to the control that opened the dialog, when appropriate.
- Escape, close button, backdrop click, and successful action closure are covered.
- The relevant dialog behavior is covered by frontend regression tests.

---

## Architecture and data quality

### 2) Word-cache lifecycle and expiry policy — completed

Issue: The repo already has two caching layers:
- browser localStorage cache in [apps/frontend/src/utils/wordCache.js](apps/frontend/src/utils/wordCache.js)
- server/database word table in [apps/api/prisma/schema.prisma](apps/api/prisma/schema.prisma) and [apps/api/src/word.js](apps/api/src/word.js)

Both layers now use lazy, source-specific expiration. PostgreSQL records when a
word was refreshed, and the browser cache uses a versioned envelope so old or
malformed entries fail closed.

Done when:
- The project documents the intended cache lifecycle for browser and server caches.
- Stale cache entries can be invalidated or refreshed without manual cleanup.
- The behavior is covered by a small test or contract check for cache refresh vs reuse.

---

## Product-completeness work

### 3) Comment/reply edit-delete-like UI parity

Issue: Backend routes already support comment/reply create, read, update, delete, like, and unlike across the API, but the frontend experience is incomplete. The current UI in [apps/frontend/src/components/CommentCard/CommentCard.jsx](apps/frontend/src/components/CommentCard/CommentCard.jsx) exposes read + reply creation and reply list toggling, but not the full user-facing edit/delete/like controls for comment/reply items.

Done when:
- Users can edit and delete their own comments and replies from the UI.
- Users can like and unlike comments and replies from the UI where the feature is exposed.
- Loading, disabled, and error states are accessible and consistent.
- Relevant UI tests cover edit/delete/like flows and disabled-state behavior.

### 4) Favorites UX parity

Issue: Favorites are implemented in the API and toggled from the card UIs, but the product experience is still partial. The current frontend exposes add/remove favorite toggles in [apps/frontend/src/components/PoemCard/PoemCard.jsx](apps/frontend/src/components/PoemCard/PoemCard.jsx), [apps/frontend/src/components/HaikuCard/HaikuCard.jsx](apps/frontend/src/components/HaikuCard/HaikuCard.jsx), and [apps/frontend/src/components/LimerickCard/LimerickCard.jsx](apps/frontend/src/components/LimerickCard/LimerickCard.jsx). There is no dedicated collection page or privacy UX flow surfaced in the app yet.

Done when:
- Users can view their favorites in a dedicated collection or profile section.
- Users understand which favorites are private vs public when relevant.
- Favorite add/remove remains accessible and consistent across poem cards.
- The feature is covered by the relevant UI and route-level behavior checks.

### 5) Draft/save flow for in-progress poems

Issue: The editor state exists in the haiku and limerick pages, but the repo does not show a draft-save or resume-in-progress feature. The old draft/save idea is not a current correctness issue, but it is a real product-completeness gap.

Done when:
- A user can save an in-progress poem and return to it later.
- The saved draft is specific to the signed-in user and restorable without data loss.
- The flow is keyboard and screen-reader friendly.
- Save/reload behavior is documented and covered by tests.

### 6) Bundle-size and code-splitting review

Issue: The frontend build passes, but Vite reports large chunk warnings during production build. This is not a broken build, but it is a tangible product-quality item for larger workflows and shipping performance.

Done when:
- The bundle is reviewed for the largest chunks and the main performance risks are identified.
- A low-risk code-splitting or lazy-loading plan is implemented where justified.
- The build remains successful with no meaningful regression in loading behavior.

---

## Architecture and DX work

### 7) Git LFS automation for Codespaces

Issue: The devcontainer workflow is already live-validated in Codespaces and the repo has a working Node 24 + PostgreSQL + app startup path. The remaining setup improvement is to ensure Git LFS is available automatically in a fresh or rebuilt Codespace and keep the setup instructions accurate as the environment evolves.

Done when:
- Git LFS is available automatically in a fresh or rebuilt Codespace.
- The relevant setup documentation matches the actual environment requirements.
- The Codespaces startup path remains reproducible without manual shell fixes.

---

## Future optimization

### 8) Feed scalability review

Issue: The feed route in [apps/api/src/feed.js](apps/api/src/feed.js) fetches matching poems and then performs sorting and pagination in application memory. This is a valid future optimization concern for larger datasets, but it is not a current correctness bug in the current repository state.

Done when:
- A specific data-volume or performance bottleneck is identified.
- The workload and expected improvement are documented.
- A measured optimization is implemented and validated with before/after evidence.

This item remains future optimization, not a current production blocker.

---

## Future poetry forms

### 9) Sonnet support

Done when:
- A sonnet editor and save flow exist with validation and persistence.
- The app supports the correct poem structure and rendering expectations for the selected form.
- The feature is backed by tests and product-level accessibility checks.

### 10) Villanelle support

Done when:
- A villanelle editor supports the repeating-line structure and persistence model.
- The app exposes the correct rendering and validation behavior.
- The feature is covered by tests and accessibility checks.

### 11) Pantoum support

Done when:
- A pantoum editor supports repeated-line, line-order, and persistence semantics.
- The feature is implemented without breaking the existing haiku/limerick flow.
- The implementation is covered by tests and validation rules.

---

## Experimental and research ideas

### 12) SSML-based scansion / audio support

Issue: This is an experimental idea for future teaching and performance support, not a current product requirement.

Done when:
- A clear user-facing benefit is defined.
- The implementation is scoped to a specific feature and not a broad system replacement.
- The accessibility and privacy implications are reviewed before shipping.

### 13) Haptic rhythm feedback on mobile

Issue: This is a future mobile UX enhancement, not a current blocker.

Done when:
- The feature is scoped to a specific device capability and has a clear performance fallback.
- The interaction is documented as optional and non-blocking.
- The feature is reviewed against the app’s accessibility strategy.

### 14) Voice-to-meter composition

Issue: This is exploratory and likely sits after the core editor product is stable.

Done when:
- A validated user flow exists for voice capture and transcript-to-meter processing.
- The privacy and device limits are explicit.
- The feature has a clear fallback path when voice input is unavailable.

### 15) Following and curated feeds

Issue: The current app supports public poem feed filters and sorting, but no following graph or curated social feed exists yet.

Done when:
- The product scope and privacy model are explicitly defined.
- Follow relationships and feed assembly are supported by API and UI.
- The feature is reviewed for abuse, moderation, and feed performance.

---

## Notes on repository evidence

- Authentication and protected routes are already implemented in [apps/frontend/src/routes.jsx](apps/frontend/src/routes.jsx), [apps/frontend/src/components/ProtectedRoute.jsx](apps/frontend/src/components/ProtectedRoute.jsx), and [apps/frontend/src/context/AuthContext.jsx](apps/frontend/src/context/AuthContext.jsx).
- The public feed is implemented in [apps/api/src/feed.js](apps/api/src/feed.js) and [apps/frontend/src/pages/Poetry/Poetry.jsx](apps/frontend/src/pages/Poetry/Poetry.jsx).
- Comments and replies are implemented on the API side in [apps/api/src/haikuComment.js](apps/api/src/haikuComment.js), [apps/api/src/haikuReply.js](apps/api/src/haikuReply.js), [apps/api/src/limerickComment.js](apps/api/src/limerickComment.js), and [apps/api/src/limerickReply.js](apps/api/src/limerickReply.js).
- Favorites are implemented in [apps/api/src/favorite.js](apps/api/src/favorite.js) with privacy values in [apps/api/prisma/schema.prisma](apps/api/prisma/schema.prisma).
- Word lookups already use a layered pattern: browser cache, server database cache, WordsAPI lookup, and local syllable fallback.
- Accessibility work already exists, but focus restoration remains incomplete for several dialog paths.

This backlog is intentionally scoped to what the codebase currently supports, what is still missing, and what remains explicitly future-facing.
