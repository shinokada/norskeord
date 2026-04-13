# norske-flashcard

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
