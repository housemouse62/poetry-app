# REVIEW_GUARDRAILS.md

## Purpose

This project uses coding agents for implementation, but agent output is not assumed to be correct merely because tests pass or the agent reports success.

Before accepting substantial agent-generated work, verify intent as well as implementation.

## Required review questions

### 1. Did application code change only where intended?

Confirm that:

- no unrelated files were modified
- no existing user work was overwritten or discarded
- no unexpected dependencies, migrations, configuration changes, or architectural rewrites were introduced
- the size and location of the diff are proportional to the requested task

Always inspect:

```bash
git status
git diff --stat
```

and review the relevant diff before committing.

### 2. Are feature claims supported by the repository?

Do not accept documentation, summaries, or completion reports solely because the agent states that something exists.

Verify important claims against:

- implementation
- routes
- database schema
- tests
- configuration
- actual browser behavior where relevant

If repository evidence is unclear, describe the feature as uncertain rather than assuming it exists.

### 3. Was the accessibility-first principle preserved?

Accessibility is the primary product constraint.

Check that changes do not weaken:

- semantic HTML
- keyboard navigation
- visible focus
- focus management
- accessible names
- screen-reader announcements
- disclosure states
- non-color information
- error/loading/success feedback
- alternative sensory access

Passing automated tests does not replace manual accessibility review when the interaction materially changes.

### 4. Were secrets or sensitive values exposed?

Never accept changes that expose or commit:

- API keys
- passwords
- JWT secrets
- authentication tokens
- database credentials
- private environment values

Pay particular attention to:

- frontend environment variables
- logs
- documentation
- example configuration
- generated debugging output

## Additional review principles

### Tests are evidence, not proof

A green suite means the tested behavior passed. It does not prove:

- the requirements were interpreted correctly
- important cases were tested
- accessibility is correct
- authorization boundaries are complete
- UI behavior is acceptable
- unrelated behavior was not changed

### Review the agent's assumptions

For substantial work, ask the agent to state:

- assumptions it made
- product decisions it inferred
- behavior it intentionally preserved
- behavior it intentionally changed
- anything it could not verify

### Prefer independent review

After a substantial implementation, perform a separate review pass before committing.

Ask the reviewer to look specifically for:

- regressions
- scope expansion
- accessibility issues
- authorization/privacy issues
- data-loss risks
- race conditions
- stale-request behavior
- missing tests
- incorrect documentation
- unnecessary complexity

### Human acceptance remains required

The agent may investigate, implement, test, and review.

The human maintainer retains authority over:

- product intent
- accessibility priorities
- architectural direction
- acceptance of significant behavior changes
- commits and merges
