# norske-flashcard

## 2.32.0

### Minor Changes

- - **New Features**
    - Updated homepage hero badge branding and localization (including a standalone product name label).
    - Refreshed the footer to be fully localized and data-driven, with updated “Learn” and “Resources” link structure.
  - **Bug Fixes**
    - Improved readability and light/dark contrast across many screens (charts, empty states, cards, search, grammar/quiz, and various page headings), plus small spacing tweaks for better legibility.
    - Updated the language switcher dropdown behavior for more consistent opening.
  - **Chores**
    - Updated the project’s package manager version.

## 2.31.0

### Minor Changes

- - **New Features**
    - Language switcher now shows abbreviated language codes instead of full names.
  - **Style**
    - Improved typography across the home page, login page, Plus billing interval toggle, learn pages, and feature cards.
    - Updated footer layout to a clearer grid structure with better text sizing.
    - Refined sidebar icon/hover colors and added consistent horizontal padding to page content.
  - **Documentation**
    - Added a “Mobile check” item to the Questions checklist.

## 2.30.0

### Minor Changes

- - **New Features**
    - Enhanced onboarding experience with new steps for user profile configuration and language preferences
    - Improved step progression and completion flow
  - **Improvements**
    - Simplified onboarding field requirements
    - Expanded multilingual support with localization updates across English, Spanish, Norwegian, and Ukrainian
  - **Documentation**
    - Updated onboarding testing guidance

## 2.29.0

### Minor Changes

- - **New Features**
    - Added Spanish and Ukrainian as supported languages
    - Introduced independent flashcard language preference setting
  - **Improvements**
    - Streamlined onboarding experience with reduced steps
    - Changed UI language selector from toggle to dropdown menu
    - Enhanced preferences page with new language configuration options
  - **Tests**
    - Updated e2e tests to reflect new UI language labels and behavior
  * Widens ui_language CHECK to accept es and uk
  * Adds flashcard_language column (NOT NULL DEFAULT 'english')
  * Renames card_direction values from no_en/en_no/def_no → l1_l2/l2_l1/def_l1
  * Drops native_language, other_languages, and country

## 2.28.0

### Minor Changes

- - **New Features**
    - Added Spanish and Ukrainian language support for both UI and flashcard translations
    - Improved language selector with dropdown interface for better language switching
  - **Bug Fixes**
    - Fixed flashcard language selection to properly display translations in chosen language
    - Corrected English language flag representation
  - **Documentation**
    - Added SEO optimization guidance and checklist
    - Documented multi-language implementation patterns and domain strategy
  - **Chores**
    - Updated homepage copy and marketing messaging
    - Added translation automation scripts
    - Refactored code structure for maintainability
    - Enhanced test coverage for language features

## 2.27.0

### Minor Changes

- - **New Features**
    - Added onboarding flow to collect account information including display name, native language, and study goals with progress tracking.
    - Added profile completion nudges throughout the app to guide users through initial setup.
  - **Refactor**
    - Changed "Target Level" terminology to "Current Level" for improved accuracy across the application.

## 2.26.2

### Patch Changes

- - fix: The initialized flag inside authStore prevents double-fetching — calling init() on a page where user already came from the server doesn't trigger an extra Supabase request. The store just populates itself once and stays valid for all subsequent client-side navigations.
  * **Bug Fixes**
    - Fixed an issue where user avatars would only display on certain routes after login. Avatars now appear correctly across all pages immediately after authentication.
  * **Documentation**
    - Added troubleshooting guide for authentication state handling on client-side navigation.

## 2.26.1

### Patch Changes

- - **Style**
    - Updated mobile navigation sidebar styling with improved visual distinction between active and inactive menu items.

## 2.26.0

### Minor Changes

- fix: plus button in Nav

  - **New Features**
    - Improved Plus plan detection for consistent visibility of Plus-exclusive features across page types, ensuring subscribers always see search functionality.
  - **Tests**
    - Strengthened end-to-end test coverage with explicit waits for improved reliability when testing Plus user scenarios.

## 2.25.8

### Patch Changes

- - fix: the root cause was always that Nav.svelte relied solely on page.data.user which is null on prerendered pages. Now that it falls back to clientUser from the Supabase browser session, all prerendered pages will correctly show the avatar after onMount fires.
  * **Bug Fixes**
    - Improved client-side authentication synchronization for prerendered pages, ensuring the correct logged-in/logged-out UI across the navigation, account menu, visible email, Plus access indicators, and authenticated mobile/desktop sections.
    - Updated logout behavior and locale persistence so they rely on the effective current user state.
  * **Tests**
    - Refreshed the navigation authentication Playwright test for the authenticated blog route (whitespace-only adjustment).

## 2.25.7

### Patch Changes

- fix: src/routes/auth/sync/+page.svelte use window.location.href for full page reload

  - **Tests**
    - Refined authentication and navigation test suite to better validate user authentication workflows and navigation patterns across all routes.
  - **Chores**
    - Enhanced post-login synchronization and redirect handling for improved reliability.

## 2.25.6

### Patch Changes

- - **Bug Fixes**
    - Improved authentication synchronization to properly invalidate cached data before redirecting users to their destination, ensuring they receive the latest information immediately after login.
  - **Tests**
    - Added comprehensive end-to-end tests for navigation across multiple pages in authenticated sessions, verifying avatar visibility and proper UI behavior.

## 2.25.5

### Patch Changes

- - **Bug Fixes**
    - Improved error handling and logging for progress save/upsert and undo/delete operations.
  - **Improvements**
    - Updated login sync to use server-provided post-login destination logic.
    - Enhanced mobile navigation placement for login/logout.
    - Changed link preload behavior from hover to tap.
    - Removed legacy Norwegian hreflang/locale alternates; added redirects for `/nb/*` and adjusted sitemap alternates.
  - **Documentation**
    - Added a full migration guide for converting card progress lookup keys from `norsk` to `vocab_id`, including smoke-test and troubleshooting steps.

## 2.25.4

### Patch Changes

- - **Bug Fixes**
    - Improved card progress tracking consistency by ensuring the vocab ID is always required and properly enforced in the database.
  - **Documentation**
    - Extended migration guidance with additional post-testing steps and troubleshooting for the card progress update.

## 2.25.3

### Patch Changes

- - **Chores**
    - Migrated flashcard progress tracking system to use stable vocabulary identifiers, improving data integrity and consistency for long-term progress persistence.

## 2.25.2

### Patch Changes

- - **Bug Fixes**
    - Resolved login and avatar display inconsistencies across platform pages.
    - Fixed caching issues preventing proper authentication state reflection.
    - Corrected login requirement checks on learning level pages.
  - **Performance**
    - Optimized edge cache configuration for improved performance on both authenticated and anonymous user requests.

## 2.25.1

### Patch Changes

- - **Bug Fixes**
    - Fixed authentication state caching issue where newly logged-in users might see cached anonymous data on learning pages
    - Improved edge cache handling to ensure auth-dependent content displays correctly after login

## 2.25.0

### Minor Changes

- - **New Features**
    - Added admin pages for managing vocabulary and expressions with review tracking workflows.
    - Extended review system to track all content types across the platform.
    - Added Admin link to user navigation menu.
  - **Performance**
    - Optimized caching for category pages and personalized content delivery.
  - **User Interface**
    - Updated navigation level labels to use "Nivå A1," "Nivå A2," etc.
    - Enhanced admin panel with new vocabulary and expression management sections.

## 2.24.0

### Minor Changes

- - **New Features**
    - Added admin panel for managing blog posts with editing, publishing, and deletion capabilities
    - Added admin interface for managing grammar questions with full CRUD operations
    - Added review tracking system for blog posts and grammar questions
    - Added avatar dropdown menu with profile and progress links
  - **Bug Fixes**
    - Updated badge display on resources page
  - **Style**
    - Increased font sizes for main page headings
    - Adjusted layout spacing and styling

## 2.23.0

### Minor Changes

- - **New Features**
    - Added dark mode toggle in the navigation bar
    - Introduced mobile sidebar for improved navigation on smaller screens
  - **Bug Fixes & Improvements**
    - Updated navigation menu structure with separate "Help" and "Free resources" options
    - Improved responsive navigation behavior across device sizes

## 2.22.4

### Patch Changes

- - **Refactor**
    - Improved the verification widget on the login page for more reliable loading and token capture during authentication.
  - **Tests**
    - Strengthened end-to-end login tests by stubbing the verification widget and adding explicit timeouts for server checks.
    - Made quiz e2e test more deterministic by bounding quiz length and reset behavior.
    <!-- end of auto-generated comment: release notes by coderabbit.ai -->

## 2.22.3

### Patch Changes

- ## Bug Fixes
  - Enhanced CAPTCHA token handling during login to ensure proper verification collection
  - Improved error recovery with ability to retry CAPTCHA verification after failed attempts

## 2.22.2

### Patch Changes

- - **Bug Fixes**
    - Fixed Cloudflare Turnstile verification request handling to ensure consistent and reliable bot protection validation.

## 2.22.1

### Patch Changes

- - **Documentation**
    - New guide for verifying Supabase authentication through multiple methods
    - Updated login monitoring guide with clearer Turnstile behavior and verification steps
  - **Improvements**
    - Enhanced login flow with improved Turnstile token management and timeout handling
    - Navigation dropdowns automatically close when navigating or logging out

## 2.22.0

### Minor Changes

- - **New Features**
    - In-app browser detection banner prompting to open in Chrome.
    - Welcome-sequence email flow added with scheduled delivery and unsubscribe handling.
    - Cloudflare Turnstile invisible mode integrated on login.
    - Redirect logic refined to better respect auth state and valid saved paths.
  - **Documentation**
    - Added detailed login flow manual test guide.
    - Expanded questions doc and clarified admin branch recommendation.
  - **Tests**
    - New homepage redirect tests; improved blog filter DOM reactivity test.

## 2.21.0

### Minor Changes

- - **New Features**
    - Grammar stats now display all available grammar topics, including those not yet started, with enhanced visual distinction and "Not started" status labels for improved clarity.
  - **Documentation**
    - Updated domain configuration and improved formatting in Norwegian idiom article introductions.
  - **Chores**
    - Updated English and Norwegian translations with new "Not started" status message for grammar topics.

## 2.20.0

### Minor Changes

- - **New Features**
    - Added minimal-pair grammar exercises for more interactive question types
    - Expanded grammar curriculum with strong verbs, sentence structures, and preposition lessons
  - **Documentation**
    - Comprehensive admin panel implementation guide added
    - Updated grammar instruction materials and lesson structure
    - Blog post metadata and scheduling updates

## 2.19.0

### Minor Changes

- - **New Features**
    - Grammar topics can be filtered by search query and CEFR level with an active-filter summary and clear button
    - Grammar topics and level breakdowns are now clickable for direct navigation
  - **UI Improvements**
    - Enhanced back-navigation/layout on grammar topic pages
    - Added empty-state messaging when filters yield no results
    - Plus upsell banner only shows when no filters are active; filtered locked topics still display
    - Language toggle styling/placement updated for logged-in vs. guest and small vs. large screens

## 2.18.0

### Minor Changes

- - **New Features**
    - Grammar back-navigation that preserves level context
    - New question type: minimal-pair
    - Redesigned Plus billing interval selector with clearer visuals
    - Expanded Norwegian A2–B1 grammar content and new morphology topics (noun/adjective areas)
  - **Bug Fixes**
    - Improved answer normalization for apostrophes/quotes
    - More randomized mixed-level grammar session selection
  - **Changes**
    - Consolidated C1/C2 into a single C (Mastery) level across the app
    - UI state persistence for learning page sections
  - **Tests**
    - Added end-to-end grammar test coverage
  - **Chores**
    - Updated package manager pin to pnpm@11.5.2

## 2.17.0

### Minor Changes

- - **New Features**
    - Per-level learning hubs A1–C (C now single “Mastery”) with vocab, grammar, quiz entry and blog previews
    - Homepage feature showcase and refreshed hero copy
  - **Changes**
    - Nav simplified to direct CEFR links; “Prepare” removed and “More” trimmed
    - Deck picker replaced by level summary cards
    - Norskprøven practice moved inline to /norskproven (legacy /practice consolidated)
    - Search UI gated to Plus users
    - C1/C2 consolidated into C sitewide (ordering, stats, sitemap, i18n updated)

## 2.16.1

### Patch Changes

- fix: vocab-a2 and uttrykk-a2

## 2.16.0

### Minor Changes

- - **New Features**
    - Added annual Plus subscription option with monthly/annual toggle on Plus page
    - Profile page now displays whether your subscription is billed monthly or annually
    - Annual Plus pricing updated to NOK 490/year
  - **Documentation**
    - Added billing management implementation documentation

## 2.15.0

### Minor Changes

- - **New Features**
    - Full-text search modal for Plus members with Ctrl/Cmd+K, keyboard navigation, highlighting, source/level filters, lazy loading, and a free-user upgrade prompt; search index prebuilt and served as a cached static asset.
  - **Brand Updates**
    - App and marketing text updated from “Norske Flashcard” to “Norskeord”.
  - **Content**
    - Added new vocabulary entries and refreshed one recording.
  - **Tests**
    - New end-to-end search tests and refinements to existing e2e flows.
  - **Docs / Chores**
    - Added implementation/service docs, build script, cache header, and updated ignore patterns.

## 2.14.1

### Patch Changes

- docs: plus page update

## 2.14.0

### Minor Changes

- - **New Features**
    - Added a new Grammar section under Prepare with interactive exercises (fill-in-the-blank, word ordering, sentence transformation).
    - Grammar progress now tracked separately in stats with practiced/due/mastered counts.
    - Plus-tier gating applied to select grammar topics.
  - **Documentation**
    - Added educational guides on Norwegian subordinate clauses, sentence adverbials, and related grammar topics.
    - Enhanced learning guides emphasizing active engagement with handwritten practice and auditory reinforcement.

## 2.13.0

### Minor Changes

- - **New Features**
    - Blog posts now display "Practice this vocabulary" section with links to related flashcard decks.
    - Added structured data markup (Schema.org) to flashcard decks and resource pages for improved search visibility.
  - **Improvements**
    - Switched to static Open Graph images for blog posts and decks for better performance and consistency.
    - Enhanced sitemap with multi-locale support (English, Norwegian Bokmål, and default).
  - **Documentation**
    - Updated SEO checklist to mark completed items including structured data implementation and keyword optimization.

## 2.12.0

### Minor Changes

- - **New Features**
    - Added site vocabulary statistics (per-level counts) and UI labels.
    - Bulk tools to generate, enrich and merge vocabulary/phrase datasets, including image-to-list extraction and AI-assisted field enrichment.
    - New scripts to add/remove and count entries programmatically.
  - **Bug Fixes**
    - Resolved many cross-level duplicate entries.
    - Normalized category formatting across datasets.
  - **Documentation**
    - Added workflow guide for managing and processing vocabulary data.
  - **Chores**
    - Added a stats generator and various maintenance utilities.

## 2.11.2

### Patch Changes

- fix: vocab-a2.json

## 2.11.1

### Patch Changes

- - **Bug Fixes**
    - Removed an incorrect entry from the phrase vocabulary database.
  - **Chores**
    - Updated publication schedules for multiple language learning posts.
    - Cleaned up draft content and development artifacts.
    - Enhanced script documentation and file path handling.

## 2.11.0

### Minor Changes

- - **New Features**
    - Added a Guide page with comprehensive help: smart scheduling, study button guidance, card state descriptions, flow tips, and a full FAQ.
  - **Localization / Documentation**
    - Guide content localized in English and Norwegian.
  - **Style**
    - Improved text alignment across practice (oral, reading, writing) and quiz pages; added dynamic quiz headings.
  - **Tests**
    - End-to-end login tests made more reliable by awaiting the authentication request; test results now show passing.

## 2.10.0

### Minor Changes

- - **New Features**
    - Login rebuilt as a form-driven flow with Cloudflare Turnstile and success UX (“Free · No credit card required”)
  - **Updates**
    - Vocabulary B1 categories reorganized for clearer taxonomy
    - Norskprøven: revised A2/B1 category sets and conditional Plus upsell for B1
    - Resources page redesigned with improved layout and external-link cards
    - Contact form now includes invisible honeypot for improved spam protection
  - **Documentation**
    - Added security and monitoring guidance (login, Turnstile, rate-limiting)

## 2.9.1

### Patch Changes

- fix: update c2 vocab

## 2.9.0

### Minor Changes

- - **New Features**
    - Profile preference: show example translations by default (syncs across devices)
    - Free-tier expansion: first 3 quiz categories per level and Practice Test 1 unlocked; locked items show a lock and upgrade flow
  - **UI Improvements**
    - Flashcard layout, labels, keyboard sizing, aria labels, and quiz/category selection refined; nav links reflect partial access
    - Plus comparison table updated
  - **Accessibility**
    - prefers-reduced-motion for flip animations
  - **Localization**
    - New i18n strings for profile prefs; updated Plus copy
  - **Tests**
    - Updated end-to-end coverage for quizzes, practice tests, and flashcard counter
  - **Data / Database**
    - B1 vocabulary category keys renamed; DB migration adds show-example profile column
  - **Documentation**
    - Updated docs and implementation plan for quiz/practice changes
  - **Chores**
    - Bumped package manager version

## 2.8.1

### Patch Changes

- style: Flashcard page update

## 2.8.0

### Minor Changes

- - **New Features**
    - Plus users now store and restore study progress in cloud (with migration from device storage) and can reset cloud progress across devices.
    - Audio planning docs added for a future AI-powered TTS option.
  - **Bug Fixes**
    - Reset flow UX improved: separate guest vs signed-in messages, disabling while resetting, and clearer in-progress labels.
    - Various quiz/flashcard flows made more robust with async persistence to avoid races.
  - **Documentation**
    - Multiple AI and implementation docs added/expanded; minor formatting and content updates to guides and examples.

## 2.7.2

### Patch Changes

- **New Features**
  - Added Previous/Next category navigation links and level badge display in vocab flashcards
- **Vocabulary Updates**
  - Reorganized A1/A2 category slugs and labels; broad renaming (removed many "basic"/"simple" prefixes)
  - Large content updates across A1, A2, B2, C1, C2 datasets; many entries removed, rewritten, or normalized
  - Added new draft flashcard/vocab entries
- **Translations**
  - Updated English and Norwegian message catalogs for category labels
- **Documentation**
  - Expanded implementation notes, prompts, and notification-email formatting
- **Other**
  - Simplified push reminder message; test fixtures adjusted

## 2.7.1

### Patch Changes

- fix: vocab-a1.json
  fix: notification-time helper comment

## 2.7.0

### Minor Changes

- - **New Features**
    - Added daily email reminders for Plus users sent at 19:00 UTC when study hasn't occurred that day.
    - Added email reminder toggle in profile settings with Plus-only access.
    - Extended unsubscribe functionality to support both lesson and reminder emails.
  - **Documentation**
    - Added comprehensive email reminder implementation guide.
    - Updated push notification documentation.
  - **Localization**
    - Added English and Norwegian translations for email reminder preferences.

## 2.6.0

### Minor Changes

- - **New Features**
    - Definition → Norwegian flashcard mode for vocabulary learners at B1+ levels
    - Norwegian learning blog posts on improving listening skills, speaking techniques, and study strategies
    - Oral practice content with 20 guided prompts and model answers (4-part series)
    - Monolingual Norwegian definitions for vocabulary entries
    - Study day streak tracking and push notification reminders for Plus members
  - **Localization**
    - Added translation keys for definition flashcard UI and profile preferences
  - **Updates**
    - Extended flashcard direction preferences to support definition mode

## 2.5.0

### Minor Changes

- - **New Features**
    - Added scheduled blog post publishing automation
    - Introduced 30+ new Norwegian language learning blog posts covering grammar rules, vocabulary distinctions, phrases, and practical usage examples
  - **Documentation**
    - Updated blog planning guidelines with improved structure and author guidance
    - Enhanced blog post planning with topic grouping and publication strategies

## 2.4.0

### Minor Changes

- **New Features**
  - Dedicated blog with articles/guides grouped by CEFR level, badges, dates, back navigation; “Blog” added to nav and “Learn” nav label.
  - Support contact form available to all logged-in users (updated UI text and abuse-prevention notice).
- **Documentation**
  - Many new and draft articles, blog planning/implementation notes, Open Graph guidance, and a publishing checklist.
- **UI**
  - Category bar chart includes uttrykk totals correctly; flashcard action label added (“View my progress →”).
- **Tests**
  - New unit and end-to-end tests for blog parsing, index, and post pages.

## 2.3.5

### Patch Changes

- fix: bugs

## 2.3.4

### Patch Changes

- fix: add level to og image

## 2.3.3

### Patch Changes

- fix: meta image links

## 2.3.2

### Patch Changes

- 265f2e2: fix: Remove the prompt entirely (silent auto-update)
- vite.config.ts — registerType changed from 'prompt' to 'autoUpdate'
- +layout.svelte — removed the PwaUpdatePrompt import
- +layout.svelte — removed the <PwaUpdatePrompt /> component tag

## 2.3.1

### Patch Changes

- **Bug Fixes**
  - Fixed PWA update behavior to reliably reload the application after service worker updates, preventing the update prompt from reappearing unexpectedly.

## 2.3.0

### Minor Changes

- **New Features**
  - Added hreflang alternate links with x-default for improved multi-language SEO.
- **Improvements**
  - Moved vocabulary/category loading to server-side for better SSR and performance.
  - Enforced redirects and tighter access control for Plus-only and preview content.
- **Chores**
  - Updated package manager settings (pnpm specified) and Node engine requirement (Node 20+).
  - Added workspace/build configuration and Vercel deployment configuration.
  - Relaxed npm engine-strict enforcement.
- **Documentation**
  - Reorganized SEO notes into resolved items.

## 2.2.1

### Patch Changes

- **New Features**
  - Flashcard backs show a “Last” rating badge with labeled, styled ratings.
  - App version shown in footer and included with support reports.
  - “What’s unlocked at each level” section added to Plus page with level teasers.
- **Changes**
  - Progress is now scoped per-user, merged on login; anonymous progress cleared after sync and user-scoped progress cleared on logout.
  - In-session new-card cap increased from 15 to 20.
  - Removed email-lesson toggle and its row from the Free vs Plus comparison.
  - Home/hero text localized; locked categories collapse into a “+N with Plus” badge.
- **Security**
  - Migration tightens study-day upsert execution and removes an exposed view.

## 2.2.0

### Minor Changes

- feat: Session limit management now respects Plus membership and device syncing preferences.
- **New Features**
  - Session limit management now respects Plus membership and device syncing preferences.
  - Activity tracking enhanced for Plus subscribers with Supabase integration.
  - UI now clearly differentiates Plus-exclusive features (daily reminders, cross-device sync).
- **Bug Fixes**
  - Fixed PWA update refresh behavior to properly reload after service worker updates.
- **Documentation**
  - Added "Rating Flow" guide explaining card state transitions and rating mechanics.
  - Expanded vocabulary documentation.

## 2.1.0

### Minor Changes

- feat: email service and quiz features

## 2.0.0

### Major Changes

- feat:
- Added a Word/Phrase toggle to customize flashcard display; flashcards now show front/back content appropriate to the selected type and remember your preference.
  UI Changes:
- Offline-ready and update-available notifications replaced with dismissable toasts featuring clearer titles, icons, and simplified actions.
  Tests:
- End-to-end tests updated to validate card-type labels and persistence behavior.
  Breaking Change:
- Vocab entry data now requires example translations to be present (update imports/data accordingly).

## 1.6.9

### Patch Changes

- fix: Voice picker only shows language-appropriate voices (Norwegian), or is hidden entirely if none are installed
- fix: Pronounce button still fires on A04 via voices[0] fallback in doSpeak, using utterance.lang as a hint to the TTS engine — it may not sound great, but it won't silently fail

## 1.6.8

### Patch Changes

- fix: mobile right side cut

## 1.6.7

### Patch Changes

- fix: mobile sway, add w-full overflow-hidden

## 1.6.6

### Patch Changes

- fix: add lang ts to +layout

## 1.6.5

### Patch Changes

- fix: PWA sway right and left

## 1.6.4

### Patch Changes

- fix: app.html and app.css

## 1.6.3

### Patch Changes

- fix: overflow-x

## 1.6.2

### Patch Changes

- fix: horizontal move

## 1.6.1

### Patch Changes

- Style:
- Standardized indentation and whitespace across the project for consistent formatting.

Improvements:

- Flashcard pages now choose and display language-specific example phrases and their translations more reliably.

Bug Fixes:

- Improved robustness of random selection and link-opening behavior to prevent edge-case failures.

Accessibility:

- Minor icon/label adjustments to improve clarity and assistive technology accuracy.

## 1.6.0

### Minor Changes

- New Features:
- Expanded vocabulary for A1–B2 with ~4,900 new entries across many topics (cooking, adjectives, nature, chores, finance, medicine, business, religion, etc.).
- Added a Resources page with curated external learning links.
- Navigation updated to include a "More" dropdown containing About and Resources.

Documentation:

- Added a CEFR-aligned category expansion plan and adjective-priority guidance.
- Minor wording correction in multi-language docs.

Style:

- Adjusted heading capitalization and category badge spacing.

## 1.5.1

### Patch Changes

- fix: Redirects now only run on fresh page loads to prevent unexpected in-app navigation.
  fix: Invalid or malformed saved flashcard links are cleared to avoid failed redirects.
  fix: Auto-redirect behavior tightened so users aren’t sent to incorrect pages and stored bad paths are removed.

## 1.5.0

### Minor Changes

- feat: persistent button and page choices

## 1.4.0

### Minor Changes

- feat: new vocab, structure, etc

## 1.2.0

### Minor Changes

- feat: apply consistent UX improvements across all flashcard components
- Add card counter display (e.g., "3/7") to all flashcard variants
- Implement unified keyboard navigation: ←↑ previous, →↓ next, N for new card
- Fix history management to preserve forward navigation without truncation
- Add touch gesture support with swipe detection for mobile users
- Update button layouts with proper disabled states and visual feedback
- Separate navigation from card generation for clearer user experience
- Add context-aware help text (different for touch vs keyboard users)
- Maintain component-specific features (verb modes, explanation modes)

Components updated:

- FlashcardPage.svelte (Japanese with verb support)
- FlashcardPage.svelte (Norske basic version)
- FlashcardPageExtended.svelte (Norske with explanation mode)

Breaking: Arrow keys no longer flip cards (use space/enter instead)

## 1.1.1

### Patch Changes

- feat(FlashcardPage/FlashcardPageExtended): improve UX by making flashcard clickable to flip
- Removed "flip" button (←) for flipping card
- Made the flashcard clickable to flip using mouse or keyboard (Enter/Space)
- Added keyboard accessibility with role="button" and tabindex="0"
- Updated instructions to reflect new interaction pattern
- Preserved support for arrow key shortcuts: ← (flip), → (next), ↑ (previous), ↓ (forward)

## 1.0.1

### Patch Changes

- docs: update about page ([`b513f25939b26c5d0b9df730d831e307b40b1e4d`](https://github.com/shinokada/norskeord/commit/b513f25939b26c5d0b9df730d831e307b40b1e4d))
  chore: update dependencies
