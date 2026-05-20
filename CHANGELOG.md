# norske-flashcard

## 2.3.0

### Minor Changes

- - **New Features**
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

- - **New Features**
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

- docs: update about page ([`b513f25939b26c5d0b9df730d831e307b40b1e4d`](https://github.com/shinokada/norske-flashcard/commit/b513f25939b26c5d0b9df730d831e307b40b1e4d))
  chore: update dependencies
