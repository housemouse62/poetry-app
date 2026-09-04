# Poetry App Backlog

This file tracks current engineering work and near-term technical priorities.
For the broader product roadmap, accessibility vision, mobile strategy, spoken reading, haptics, widgets, public-domain poetry, growth, and monetization, see `MASTER_PLAN.md`.

## Current priority order

1. Docs truth pass
2. Bundle/code-splitting review
3. Request-helper cleanup
4. Reassess `CommentCard`
5. Draft lifecycle extraction later
6. Accessibility regression process
7. Spoken poem reading
8. Prosody/stress modeling
9. Haptic reading prototype
10. Following/personalized feeds
11. Mobile/App Store architecture review
12. Native configurable poetry widget

## Current engineering work

### Docs truth pass

Status: next

Verify README/setup, Railway deployment instructions, workspace commands, env vars, server-backed drafts, WordsAPI server-only configuration, CI/testing expectations, Codespaces notes, Git LFS notes, and current architecture against repository/runtime evidence.

### Bundle/code-splitting review

Status: queued

Investigate the current Vite chunk-size advisory. Identify major contributors and implement only low-risk, evidence-based splitting where justified.

### Request-helper cleanup

Status: queued

Inspect repeated authenticated fetch/JSON/error-handling patterns. Extract only clear duplication. Do not create a generic API framework.

### Reassess CommentCard

Status: queued

Review remaining complexity after `InteractionItem` extraction. Separate reply loading/creation only if it meaningfully simplifies the component.

### Draft lifecycle extraction

Status: deferred

Haiku and Limerick now share significant draft/save behavior, but the semantics are recent. Revisit after further stabilization.

### Git LFS / Codespaces automation

Status: deferred

Revisit if computer-only development changes and Codespaces/mobile development becomes important again.

### Feed scalability review

Status: future optimization

Review the current in-memory feed sorting/pagination only when measured data volume or performance evidence justifies it.

## Recently completed

- Modal/dialog focus restoration — PR #5 / `756b00b`
- Comment/reply interaction controls — PR #6 / `3a684d1`
- Favorites collection/privacy controls — PR #7 / `91aa9b5`
- Word-cache lifecycle and expiry policy — PR #8 / `4d209cc`
- Server-backed drafts — PR #9 / `80eb6d0`
- InteractionItem extraction — PR #12 / `562081b`
- Shared saved-poem-card shell — PR #13 / `f0f6fa0`

## Future engineering/product work

See `MASTER_PLAN.md` for:

- Accessibility regression process
- Spoken poem reading
- Prosody-aware reading
- Haptic reading
- “Feel the line” mode
- Accessible composition feedback
- Following and personalized feeds
- Public-domain poetry
- Mobile/App Store architecture
- Native home-screen widget
- Offline experience
- Production readiness
- Moderation/safety
- Discovery/growth
- Monetization

## Review guardrails

At review and commit checkpoints:

1. Did application code change only where intended?
2. Are feature and documentation claims supported by repository/runtime evidence?
3. Was accessibility-first behavior preserved?
4. Were secrets or sensitive values exposed?
