# make poetry. — Master Product & Engineering Plan

This document is the high-level roadmap for `make poetry.` It complements `BACKLOG.md`.

## Product principle

Accessibility comes first.

Every new feature, refactor, and platform expansion should preserve or improve:

- Keyboard-only operation
- Screen-reader support
- Predictable focus behavior
- Non-color cues
- High contrast and scalable typography
- Reduced-motion support
- Clear loading, pending, success, and error feedback
- Accessible touch targets
- User control over reading and presentation
- Privacy and unpublished-content protections

Product hierarchy:

1. Accessibility
2. Writing and reading experience
3. Community
4. Personalized discovery
5. Native/mobile and widgets
6. Growth and monetization

---

# Current engineering punch list

## 1. Shared saved-poem-card shell — completed
Status: completed and merged to `main` in PR #13 / commit `f0f6fa0`.

The shared shell preserves poem-specific behavior and keeps the abstraction small.

## 2. Docs truth pass
Status: current next item.

Verify documentation against the repository and deployed runtime.

Review:
- README/setup instructions
- Railway deployment configuration
- npm workspace/root commands
- Environment variables
- Server-backed draft behavior
- WordsAPI server-side-only key
- CI/testing expectations
- Current project architecture

Repository/runtime evidence should override stale documentation.

## 3. Bundle/code-splitting review
Investigate the existing Vite chunk-size advisory.

- Identify the largest contributors.
- Evaluate route-level lazy loading.
- Consider small, meaningful splits only.
- Do not optimize merely to silence the warning.
- Preserve accessibility and loading behavior.

## 4. Request-helper cleanup
Investigate repeated frontend request patterns.

Potential duplication:
- authenticated fetches
- JSON parsing
- common error handling
- mutation state handling

Extract only clear duplication. Do not create a giant generic API abstraction.

## 5. Reassess CommentCard
After extracting `InteractionItem`, inspect the remaining component.

Possible follow-up:
- separate reply loading/creation if it meaningfully simplifies the component

Do not refactor solely to reduce line count.

## 6. Draft lifecycle extraction
Deferred intentionally.

Haiku and Limerick now share significant draft/save behavior, but the semantics are recent and easy to destabilize. Revisit after the feature has remained stable longer.

## 7. Git LFS / Codespaces automation
Deferred while development is computer-first. Revisit if Codespaces/mobile development becomes important again.

---

# Accessibility-first foundation

## 8. Accessibility regression process
Create an explicit accessibility review checklist for pull requests.

Include:
- Keyboard-only path
- Focus movement/restoration
- Screen-reader names/states
- Live-region behavior
- Dialog semantics
- Non-color status cues
- Reduced motion
- Contrast
- Touch target sizing
- Error identification
- Pending/disabled states

Add automated accessibility testing where useful, while keeping manual keyboard and screen-reader testing.

---

# Accessible reading experience

## 9. Read poems aloud
Create an accessible spoken-reading experience.

Capabilities:
- Play
- Pause
- Stop
- Restart
- Adjustable speech rate
- Voice selection where platform APIs allow
- Read title, author, and poem
- Resume behavior
- Keyboard and screen-reader controls
- Current-line or current-word highlighting where feasible

The reading experience should understand poetry structure rather than behave as generic text-to-speech.

## 10. Prosody-aware reading
Build toward poetry-aware playback.

Model and use:
- Syllables
- Stressed syllables
- Unstressed syllables
- Line breaks
- Stanza breaks
- Punctuation
- Meter/rhythm where determinable
- Deliberate poetic pauses

Accuracy and uncertainty should be represented honestly.

## 11. Haptic poetry reading
Explore synchronized haptic feedback during spoken reading.

Primary concept:
- Haptic pulse on stressed syllables
- Optional weaker/different signal for unstressed syllables
- Stronger or distinct signal at line/stanza boundaries
- Synchronize audio, visual highlighting, and haptics

User controls should include:
- Haptics on/off
- Intensity when supported
- Stressed syllables only
- Rhythm/meter mode

Long-term goal: allow a reader to feel poetic meter while hearing the poem.

## 12. “Feel the line” mode
Explore a mode that communicates a line's rhythmic stress pattern through haptics without requiring spoken words.

Potential uses:
- Accessibility
- Meter learning
- Poetry composition
- Rhythm comparison

---

# Accessible composition tools

## 13. Improve live syllable feedback
Enhance existing syllable assistance.

- Clear current vs target count
- Non-color over/under/exact indicators
- Screen-reader announcements that are useful but not noisy
- Preserve editing focus
- Explain uncertainty when counts are estimated

## 14. Spoken composition feedback
Optional audio assistance while composing.

Examples:
- Read current line
- Read full poem
- Announce syllable target reached
- Announce over/under target
- Pronunciation assistance

## 15. Haptic composition feedback
Optional haptic signals while composing.

Examples:
- Target syllable count reached
- Line exceeds target
- Stress/meter target reached
- Rhythm pattern preview

## 16. Rhyme, pronunciation, and meter assistance
Expand accessible writing assistance.

Potential features:
- Better rhyme suggestions
- Pronunciation help
- Stress analysis
- Meter analysis
- Accessible dictionary/word-data interface
- Clear confidence/source indicators

---

# Core poem creation

## 17. Maintain and expand poem forms
Current:
- Haiku
- Limerick

Future candidates:
- Sonnet
- Free verse
- Blank verse
- Villanelle
- Custom forms

Do not force formal-analysis tools onto free verse.

## 18. Continue draft/save polish
Maintain:
- Server-backed drafts
- Resume draft
- Edit published poem
- Publish validation
- Delete confirmation
- Unsaved-change protection
- Focus restoration
- Download/share

---

# Community and social reading

## 19. Public reading experience
Continue improving:
- Public feed
- Poem detail pages
- Likes
- Favorites
- Comments
- Replies
- Ownership controls
- Accessible interaction state
- Accessible pagination or feed loading

## 20. Following and profiles
Add:
- Poet profiles
- Follow/unfollow
- “People I follow” feed
- “Me + people I follow” feed
- Accessible follow state

## 21. Notifications
Potential notifications:
- New comment
- New reply
- New follower
- Favorite/like events where appropriate

Keep notifications optional and accessible.

---

# Personalized poetry feeds

## 22. Shared configurable feed model
Build a server-side feed model that can power web, mobile app, and widgets.

Candidate feeds:
- My poems
- My favorites
- People I follow
- Me + people I follow
- Popular poems
- Recent poems
- Public-domain poetry
- Curated collections
- Custom/mixed feed later

Privacy/publication rules must apply consistently across every surface.

---

# Public-domain poetry library

## 23. Curated public-domain collection
Create a separate collection of confirmed public-domain works.

Track:
- Author
- Work
- Source/provenance
- Publication information
- Public-domain basis
- Original formatting

Features:
- Search
- Filter by poet
- Filter by form
- Filter by period
- Filter by theme
- Accessible reading mode
- Spoken reading
- Prosody/haptic experience where feasible

Do not treat “free online” as equivalent to public domain.

---

# Mobile / standalone application

## 24. Mobile/App Store architecture review
Evaluate the path from the current React/Vite application to a standalone iOS/Android product.

Preferred path:
React/Vite web app → PWA improvements → Capacitor/native shell → iOS + Android → native-specific capabilities

Review:
- Authentication/session persistence
- Deep linking
- App lifecycle
- Safe-area handling
- Mobile keyboard behavior
- Native sharing
- Filesystem/photos
- Push notifications
- Offline drafts
- Native accessibility APIs
- Speech APIs
- Haptic APIs
- App Store / Play Store packaging requirements

Do not perform a native rewrite without a concrete product reason.

---

# Configurable home-screen poetry widget

## 25. Native poetry widget
Allow the user to choose what content each widget displays.

Initial feed choices:
- My favorites
- My poems
- Me + people I follow
- People I follow
- Popular poems
- Public-domain poetry

Potential features:
- Multiple widget configurations at once
- Small/medium/large layouts
- Periodic poem rotation
- Accessible typography
- Privacy-aware content
- Tap to deep-link directly to the poem
- Refresh/content preferences
- Hand off to spoken/haptic reading inside the app

This should be a genuinely native product feature, not merely a web shortcut.

---

# Native accessibility expansion

## 26. Native accessibility integration
On iOS/Android investigate:
- VoiceOver/TalkBack behavior
- Dynamic Type/font scaling
- Reduce Motion
- High-contrast preferences
- Native text-to-speech
- Haptic engine integration
- Accessible notifications
- Lock-screen audio controls where appropriate
- Background audio/session behavior
- Deep links from widgets and notifications
- Accessibility shortcuts where useful

---

# Offline experience

## 27. Offline drafts and reading
Potential capabilities:
- Create drafts offline
- Edit cached drafts
- Queue synchronization
- Clearly display sync status
- Conflict handling
- Cache favorites/public-domain poems
- Offline spoken reading where platform support permits

Avoid complicated offline architecture until there is demonstrated need.

---

# Performance

## 28. Performance review
As usage grows:
- Route/code splitting
- Feed rendering performance
- Image generation performance
- API query review
- Database indexes
- Cache strategy
- Payload size
- Mobile startup performance

Optimize from evidence, not assumptions.

---

# Production readiness

## 29. Reliability and operations
Before significant growth:
- Production monitoring
- Error reporting
- Database backups
- Restore/recovery procedure
- Rate limiting review
- Dependency/security updates
- Deployment documentation
- Operational runbooks

## 30. Account and privacy requirements
Add or verify:
- Account recovery
- Email verification if needed
- Privacy policy
- Terms
- Account deletion
- User-data deletion/export where appropriate
- Secure session handling
- Private/unpublished poem protection

---

# Moderation and safety

## 31. Community safety tools
Before broad public growth:
- Report poem
- Report comment/reply
- Report user
- Block user
- Mute user
- Spam controls
- Admin moderation tools
- Content-removal workflow
- Appeals/policy process as scale requires

Accessibility must apply to moderation tools too.

---

# Discovery and growth

## 32. Discovery
Potential features:
- Shareable poem URLs
- Social preview cards
- Search
- Poet profiles
- Following
- Curated collections
- Featured poets
- Public-domain discovery
- SEO for public poems where appropriate

## 33. App distribution
When product maturity justifies it:
- Apple App Store
- Google Play
- PWA/installable web experience
- Store screenshots/descriptions
- Accessibility information
- Deep-link website/app integration

---

# Monetization — later

## 34. Explore sustainable monetization
Only after learning what users value.

Possible paid features:
- Advanced writing tools
- Advanced prosody/meter analysis
- Additional customization
- Private collections
- Richer exports
- Creator tools

Do not paywall core accessibility.

Core access that should remain available includes:
- Keyboard accessibility
- Screen-reader support
- Readable typography
- Basic read-aloud
- Essential haptic accessibility support
- Core error/status accessibility

---

# Engineering review guardrails

At review and commit checkpoints, ask:

1. Did application code change only where intended?
2. Are feature and documentation claims supported by repository/runtime evidence?
3. Was accessibility-first behavior preserved?
4. Were secrets or sensitive values exposed?

Normal workflow:

Backlog item → branch → Codex investigates → human approves plan → Codex implements → tests → review guardrails → PR → CI → merge

---

# Near-term order

1. Docs truth pass
2. Bundle/code-splitting review
3. Request-helper cleanup
4. Reassess CommentCard
5. Draft lifecycle extraction later
6. Accessibility regression process
7. Spoken poem reading
8. Prosody/stress modeling
9. Haptic reading prototype
10. Following/personalized feeds
11. Mobile/App Store architecture review
12. Native configurable poetry widget

This ordering can change based on user feedback, technical discoveries, accessibility findings, and product validation.
