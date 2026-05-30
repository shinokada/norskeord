# Blog Search Box — Implementation Plan

## Context

The `/blog` page (`src/routes/blog/+page.svelte`) already has two interactive filter rows
(Level + Topic) added in the previous session. This plan adds a client-side search box that
works alongside those filters.

The page is fully prerendered (`export const prerender = true` in `+page.ts`), so search
must be client-side only — no server round-trips.

---

## Approach: simple substring search, no library needed

With ~50–80 posts, a plain `toLowerCase().includes()` match over `title + description` is
fast enough and has zero dependencies. Do **not** reach for Fuse.js or similar unless the
post count grows past a few hundred and users complain about fuzzy matching.

---

## Files to change

| File                           | Change                                             |
| ------------------------------ | -------------------------------------------------- |
| `src/routes/blog/+page.svelte` | Add search input + wire into filter logic          |
| `messages/en.json`             | Add `blog_search_placeholder`, `blog_search_clear` |
| `messages/nb.json`             | Same keys in Norwegian                             |

No changes needed to `+page.ts`, `$lib/blog.ts`, or any other file.

---

## Step 1 — Add i18n keys

### `messages/en.json` (append near the other `blog_*` keys at the bottom)

```json
"blog_search_placeholder": "Search articles…",
"blog_search_aria": "Search blog articles"
```

### `messages/nb.json`

```json
"blog_search_placeholder": "Søk i artikler…",
"blog_search_aria": "Søk i bloggartikler"
```

---

## Step 2 — Update `+page.svelte`

### 2a. Add state variable (alongside `selectedLevel` / `selectedTag`)

```ts
let searchQuery = $state('');
```

### 2b. Derive a trimmed, lowercased version for matching

```ts
const searchTerm = $derived(searchQuery.trim().toLowerCase());
```

### 2c. Update the `grouped` derived to include search filtering

Add a third condition inside the `.filter()` alongside `matchesLevel` and `matchesTag`:

```ts
const matchesSearch =
  !searchTerm ||
  post.title.toLowerCase().includes(searchTerm) ||
  (post.description ?? '').toLowerCase().includes(searchTerm);
```

Full updated `grouped` derived:

```ts
const grouped = $derived(
  cefrOrder
    .map((level) => ({
      level,
      posts: data.posts.filter((p) => {
        if (p.type === 'guide') return false;
        const matchesLevel = !selectedLevel || cefrLevels(p.cefr).includes(selectedLevel);
        const matchesTag = !selectedTag || (p.tags ?? []).includes(selectedTag);
        const matchesSearch =
          !searchTerm ||
          p.title.toLowerCase().includes(searchTerm) ||
          (p.description ?? '').toLowerCase().includes(searchTerm);
        return matchesLevel && matchesTag && matchesSearch && cefrLevels(p.cefr).includes(level);
      })
    }))
    .filter((g) => g.posts.length > 0)
);
```

### 2d. Update `clearFilters` to also reset search

```ts
function clearFilters() {
  selectedLevel = null;
  selectedTag = null;
  searchQuery = '';
}
```

### 2e. Update the active-filter condition to include search

```svelte
{#if selectedLevel || selectedTag || searchTerm}
```

### 2f. Add the search input to the filter panel

Place it **above** the Level row (it's the most prominent filter). Use the Flowbite `Input`
component which is already available in the project.

```svelte
<script>
  import { Input } from 'flowbite-svelte';
  // SearchOutline is available via flowbite-svelte-icons
  import { SearchOutline } from 'flowbite-svelte-icons';
</script>
```

Markup — add as the first item inside the `<!-- Filter panel -->` div, before the Level row:

```svelte
<!-- Search -->
<div class="relative">
  <Input
    bind:value={searchQuery}
    placeholder={m.blog_search_placeholder()}
    aria-label={m.blog_search_aria()}
    class="pl-9 text-sm"
  />
  <SearchOutline
    class="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500"
  />
</div>
```

> **Note:** If you prefer not to add an icon dependency, a plain `<input>` with Tailwind
> classes works fine too:
>
> ```svelte
> <input
>   bind:value={searchQuery}
>   placeholder={m.blog_search_placeholder()}
>   aria-label={m.blog_search_aria()}
>   type="search"
>   class="focus:border-primary-500 focus:ring-primary-500 w-full rounded-lg border border-gray-200 bg-white px-3
>          py-2 text-sm text-gray-900 placeholder-gray-400
>          focus:ring-1 focus:outline-none dark:border-gray-700 dark:bg-gray-800
>          dark:text-white dark:placeholder-gray-500"
> />
> ```

---

## Step 3 — Validate with autofixer

Before saving, run the full updated component through `svelte:svelte-autofixer` with
`desired_svelte_version: 5` to catch any rune or reactivity issues.

---

## What the finished filter panel looks like

```
[ Search articles…                    🔍 ]

Level   [ A1 ] [ A2 ] [●B1] [ B2 ] [ C1 ] [ C2 ]

Topic   [ adjectives ] [●grammar] [ verbs ] [ vocabulary ] …

        3 articles  ·  Clear filters
```

All three filters compose with AND logic. Guides are hidden whenever any filter is active.

---

## Out of scope for this plan

- Highlighting matched text in results — adds complexity, low value at this scale
- Searching tags — tags are already filterable via the Topic row
- URL-synced search state (`?q=...`) — nice for shareability but not needed yet; add later
  if users request it
