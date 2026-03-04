Poetry App
An accessible poetry composition tool built to explore the intersection of traditional poetic forms and modern assistive technology.
Why This Exists
Poetry is inherently multisensory - rhythm, sound, pattern - but most digital writing tools flatten these dimensions into plain text. This app treats accessibility not as compliance, but as an opportunity to enhance the poetic experience through alternative sensory channels.
Currently focused on haiku and limerick composition with real-time syllable counting and pattern validation. The long-term vision includes aural scansion (dynamic text-to-speech with metrical stress), haptic rhythm feedback for tactile meter awareness, and voice-to-meter dictation.
Current Status
Working:

Haiku and limerick writers with real-time syllable counting
Syllable validation using custom fallback algorithm + WordsAPI integration
Smart caching layer (localStorage) to minimize API calls
Poem persistence and viewing of saved work
Keyboard navigation and screen reader support

In Development:

Database migration for permanent, cross-user word cache
Enhanced ARIA patterns for rhyme scheme awareness
API error handling and offline graceful degradation

Planned:

Expanding poetic forms progressively: Adding sonnets, villanelles, and pantoums as the syllable-counting and pattern-validation architecture proves stable
SSML-based "aural scansion" engine (text-to-speech with dynamic metrical stress)
Haptic rhythm feedback for tactile meter awareness on mobile devices
Voice-to-meter composition with real-time syllable feedback
User authentication and persistent poem ownership
Social discovery features (following poets, curated feeds)

Tech Stack
Frontend: React 18, Vite, React Router
Testing: Vitest, React Testing Library (84% coverage)
API Integration: WordsAPI (syllable verification)
Data Persistence: localStorage (transitioning to database)
Accessibility: ARIA labels, semantic HTML, keyboard navigation
Development Approach
This project is built using Test-Driven Development from the ground up. Every component is tested before implementation, ensuring reliability and making refactoring safer as the architecture evolves.
Accessibility is a first-class concern, not an afterthought. The app uses ARIA patterns where semantic HTML isn't sufficient, implements screen-reader-only instructions for complex interactions, and uses color coding with non-visual alternatives (e.g., rhyme scheme indicators in limericks).
AI-assisted learning: I'm using Claude as a technical mentor throughout development - asking questions, exploring trade-offs, and debugging logic rather than generating code. This approach is slower but builds genuine understanding of React patterns, testing strategies, and accessibility best practices.
Key Implementation Decisions
Syllable Counting Architecture:
English syllable counting is notoriously difficult for rule-based algorithms. The app uses a two-tier approach:

Primary: WordsAPI for verified syllable counts
Fallback: Custom algorithm for offline mode or API failures
Caching layer: All API responses stored in localStorage (migrating to database for cross-user persistence)

This ensures the app remains functional even when the API is unavailable, while progressively improving accuracy as users encounter new words.
Rhyme Scheme Visualization:
Limericks use color-coding to indicate which lines should rhyme (AABBA pattern), but color alone isn't accessible. The implementation combines:

Visual color indicators for sighted users
ARIA labels describing the rhyme relationship for screen readers
Screen-reader-only text explaining the expected pattern

Running Locally
Prerequisites:

Node.js (v18 or higher recommended)
WordsAPI key (get one free at RapidAPI)

Setup:
bash# Clone the repository
git clone https://github.com/[your-username]/Poetry_App.git
cd Poetry_App

# Install dependencies

npm install

# Create environment file

# Add your WordsAPI key:

# VITE_WORDSAPI_KEY=your_key_here

cp .env.example .env

# Start development server

npm run dev
The app will open at http://localhost:5173
Testing
bash# Run all tests
npm test

# Run tests in watch mode

npm run test:watch

# Generate coverage report

npm run test:coverage

```

**Current test coverage: 84%** with near-complete coverage of critical paths:
- 100% coverage on data persistence (localStorage, caching)
- 95% coverage on API integration (WordsAPI)
- Comprehensive testing of user interactions, form validation, and accessibility features

## Project Structure
```

Poetry_App/
├── src/
│ ├── components/ # React components
│ ├── utils/ # Syllable counting, caching logic
│ ├── hooks/ # Custom React hooks
│ └── tests/ # Test files alongside components
├── public/
└── vite.config.js
