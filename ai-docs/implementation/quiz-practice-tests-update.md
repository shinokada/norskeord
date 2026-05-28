# Quiz & Practice Tests: Free Tier Teaser

## Status: 🔲 Not started

---

## Overview

Currently both Quiz and Practice Tests are hard-gated behind Plus — free users are immediately redirected to `/plus` on `onMount`. This update opens a meaningful subset of each to free users as a conversion teaser:

- **Quiz:** top 3 categories per level are playable for free; the rest show 🔒 and redirect to `/plus`
- **Practice Tests:** Test 1 (per level × type) is open for free; Tests 2 and 3 show 🔒 and redirect to `/plus`

---

## Free tier rules

### Quiz free categories (first 3 in `CATEGORIES_BY_LEVEL` order, excluding uttrykk variants)

| Level | Free categories                      |
| ----- | ------------------------------------ |
| A1    | greetings, numbers, colors           |
| A2    | shopping, transport, clothing        |
| B1    | travel, environment, media           |
| B2    | politics, economics, social-issues   |
| C1    | philosophy, academic, formal-writing |
| C2    | literary, archaic, proverbs          |

Note: A1 and A2 are already fully free via flashcards, but the quiz still gates them uniformly at 3 for consistency.

### Practice Tests free access

Test 1 is open for all level × type combinations:

- A2: reading/1, writing/1, oral/1
- B1: reading/1, writing/1, oral/1

Tests 2 and above are Plus-only. This scales automatically as new tests are added.

---

## Files to change

### 1. `src/lib/types.ts`

Add a `FREE_QUIZ_CATEGORIES` constant and a helper `isFreeQuizCategory(level, category): boolean`.

```ts
/**
 * Top 3 categories per level available to free users in the Quiz.
 * Derived from the first 3 entries in CATEGORIES_BY_LEVEL (excluding uttrykk variants).
 */
export const FREE_QUIZ_CATEGORIES = new Set<string>([
  // A1
  'a1/greetings',
  'a1/numbers',
  'a1/colors',
  // A2
  'a2/shopping',
  'a2/transport',
  'a2/clothing',
  // B1
  'b1/travel',
  'b1/environment',
  'b1/media',
  // B2
  'b2/politics',
  'b2/economics',
  'b2/social-issues',
  // C1
  'c1/philosophy',
  'c1/academic',
  'c1/formal-writing',
  // C2
  'c2/literary',
  'c2/archaic',
  'c2/proverbs'
]);

export function isFreeQuizCategory(level: string, category: string): boolean {
  return FREE_QUIZ_CATEGORIES.has(`${level.toLowerCase()}/${category}`);
}
```

### 2. `src/routes/quiz/+page.svelte`

**Remove the hard Plus gate** in `onMount`:

```ts
// REMOVE:
if (!isPlus) {
  window.location.replace('/plus?ref=quiz-gate');
  return;
}
```

**Add a derived `isLockedCategory`** that returns true when the user is free and the selected category is not in `FREE_QUIZ_CATEGORIES`:

```ts
import { isFreeQuizCategory } from '$lib/types';

let isLockedCategory = $derived(
  !isPlus && selectedCategory !== '' && !isFreeQuizCategory(selectedLevel, selectedCategory)
);
```

**Update `availableCategories`** to annotate each category with a `locked` flag (similar to how nav mega-menus work), and exclude `uttrykk` and `uttrykk-preview` from the free picker since those are flashcard categories, not meaningful quiz categories:

```ts
let categoriesWithLock = $derived.by(() => {
  return availableCategories.map((cat) => ({
    cat,
    locked: !isPlus && !isFreeQuizCategory(selectedLevel, cat)
  }));
});
```

**Update the category `<select>`** to show 🔒 on locked options. Use an `onchange` handler that intercepts locked selections and redirects to `/plus?ref=quiz-category-lock`:

```svelte
<select
  id="quiz-category"
  bind:value={selectedCategory}
  onchange={(e) => {
    const val = (e.target as HTMLSelectElement).value;
    if (!isPlus && val !== '' && !isFreeQuizCategory(selectedLevel, val)) {
      selectedCategory = '';
      window.location.href = '/plus?ref=quiz-category-lock';
    }
  }}
>
  <option value="">All categories</option>
  {#each categoriesWithLock as { cat, locked } (cat)}
    <option value={cat}>{formatCategory(cat)}{locked ? ' 🔒' : ''}</option>
  {/each}
</select>
```

**Block the Start button** when no category is selected and user is free (i.e. "all categories" would include locked ones). Show a prompt to pick a free category instead:

```ts
let canStartFree = $derived(
  isPlus || (selectedCategory !== '' && isFreeQuizCategory(selectedLevel, selectedCategory))
);
```

When `!canStartFree`, the Start button should be disabled with a helper note: _"Pick one of the free categories to start, or upgrade to Plus for full access."_

**Keep FSRS save behaviour unchanged.** Free users save to `localStorage` (no `userId`), which is already the existing path when `userId` is null.

### 3. `src/routes/norskproven/practice/+page.svelte`

**Remove the hard Plus gate** in `onMount`:

```ts
// REMOVE:
if (page.data.plan !== 'plus') {
  window.location.replace('/plus?ref=norskproven-gate');
}
```

**Update test pill rendering.** Add a `isFreeTest` helper — test number 1 is always free:

```ts
function isFreeTest(test: number): boolean {
  return test === 1;
}
```

Update the test pill anchor to redirect free users attempting Tests 2/3:

```svelte
{#each tests as test (test)}
  {@const locked = !isPlus && !isFreeTest(test)}
  <a
    href={locked
      ? '/plus?ref=practice-test-lock'
      : `/norskproven/practice/${test}/${type.key}/${level.toLowerCase()}`}
    class="rounded-lg border px-3 py-1 text-xs font-semibold transition-colors
      {locked
      ? 'cursor-not-allowed border-gray-300 text-gray-400 opacity-50 dark:border-gray-600 dark:text-gray-500'
      : color.pill}"
  >
    Test {test}{locked ? ' 🔒' : ''}
  </a>
{/each}
```

### 4. `src/routes/components/Nav.svelte`

Both Prepare dropdown items currently link to `/plus` for free users. Since the pages are now partially open, link directly — the pages themselves handle the gating:

```svelte
<!-- BEFORE -->
<DropdownItem href={isPlus ? '/quiz' : '/plus?ref=nav-quiz'}>
  {m.nav_quiz()}{isPlus ? '' : ' 🔒'}
</DropdownItem>
<DropdownItem href={isPlus ? '/norskproven/practice' : '/plus?ref=nav-practice-tests'}>
  {m.nav_practice_tests()}{isPlus ? '' : ' 🔒'}
</DropdownItem>

<!-- AFTER -->
<DropdownItem href="/quiz">
  {m.nav_quiz()}
</DropdownItem>
<DropdownItem href="/norskproven/practice">
  {m.nav_practice_tests()}
</DropdownItem>
```

---

## Practice test inner pages

The individual test routes (`/norskproven/practice/[test]/[type]/[level]`) also need checking. If they have their own Plus gate, Tests 2/3 need to remain gated while Test 1 becomes freely accessible.

Check: `src/routes/norskproven/practice/[test]/+layout.svelte` or the individual route files for any `onMount` redirect.

---

## Implementation order

1. `src/lib/types.ts` — add `FREE_QUIZ_CATEGORIES` + `isFreeQuizCategory`
2. `src/routes/quiz/+page.svelte` — remove hard gate, add category locking UI
3. `src/routes/norskproven/practice/+page.svelte` — remove hard gate, add test locking UI
4. Check & update inner practice test routes if gated
5. `src/routes/components/Nav.svelte` — remove lock from Prepare nav links

---

## Testing checklist

- [ ] Free user can open `/quiz`, see level and category pickers
- [ ] Free user can select a free category (e.g. B1 / travel) and run a full quiz session
- [ ] Free user selecting a locked category (e.g. B1 / city-life) is redirected to `/plus?ref=quiz-category-lock`
- [ ] Free user with no category selected sees the disabled Start button with helper text
- [ ] Plus user sees no locks anywhere in the quiz UI
- [ ] Free user can open `/norskproven/practice`, see all level/type cards
- [ ] Free user can click Test 1 for any level/type and land on the test
- [ ] Free user clicking any test other than Test 1 is redirected to `/plus?ref=practice-test-lock`
- [ ] Plus user sees no locks in practice test UI
- [ ] Nav Prepare dropdown links directly to `/quiz` and `/norskproven/practice` for all users
- [ ] Existing e2e Plus tests still pass
