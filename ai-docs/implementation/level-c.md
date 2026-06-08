# Combining C1 and C2 into a single "C" level

## Decision summary

Merge C1 and C2 into a single **C** level end-to-end: one vocab file, one route,
one `CEFRLevel` value. No shim layer, no dual-level lookups.

Since there are no real Plus users yet, there is no meaningful Supabase data to
protect, making a clean migration the right call.

---

## Current state (what exists)

| Thing                  | C1                                                       | C2                                         |
| ---------------------- | -------------------------------------------------------- | ------------------------------------------ |
| Vocab JSON             | `vocab-c1.json` — 155 words, 15 categories               | `vocab-c2.json` — 145 words, 11 categories |
| `CATEGORIES_BY_LEVEL`  | 15 slugs                                                 | 11 slugs                                   |
| `PLUS_CATEGORIES`      | 10 plus-only, 5 free (prefix `c1/`)                      | 7 plus-only, 4 free (prefix `c2/`)         |
| `FREE_QUIZ_CATEGORIES` | 3 entries with prefix `c1/`                              | 3 entries with prefix `c2/`                |
| Routes                 | `/learn/c1`, `/c1/[category]`                            | `/learn/c2`, `/c2/[category]`              |
| Level color            | purple                                                   | pink                                       |
| `stats.json`           | `C1: { vocab: 155, total: 155 }`                         | `C2: { vocab: 145, total: 145 }`           |
| `grammar.json`         | 27 lines reference `"C1"` (some in `["B2","C1"]` arrays) | No `C2` references                         |

---

## Target state

- One vocab file: `vocab-c.json` — 300 words, all `level: "C"`, 26 categories
- `CEFRLevel` = `'A1' | 'A2' | 'B1' | 'B2' | 'C'`
- Routes: `/learn/c` and `/c/[category]`
- Old `/c1/` and `/c2/` URLs redirect → 301 (handled inside existing dynamic route)
- `stats.json` → single `C` key
- `grammar.json` → `"C1"` replaced with `"C"` (including inside `["B2","C1"]` arrays)
- Single color: purple (was C1's color)

---

## Step-by-step implementation

### Step 1 — Merge vocab JSON files

Concatenate `vocab-c1.json` and `vocab-c2.json` into `vocab-c.json`, changing every
`"level": "C1"` and `"level": "C2"` to `"level": "C"`.

All other fields (`norsk`, `lemma`, `english`, `example`, `definition`, `category`,
`part`) stay exactly as-is. Category slugs are unique across C1 and C2 so there are
no collisions.

After merging, delete `vocab-c1.json` and `vocab-c2.json`.

---

### Step 2 — Update `src/lib/types.ts`

**2a. `CEFRLevel`**

```ts
// Before
export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

// After
export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C';
```

**2b. `CATEGORIES_BY_LEVEL`** — replace the `C1` and `C2` keys with a single `C` key
listing all 26 category slugs (C1's 15 first, then C2's 11):

```ts
C: [
  // former C1
  'philosophy', 'academic', 'formal-writing', 'rhetoric', 'complex-emotions',
  'professional', 'abstract-concepts', 'politics-democracy', 'linguistics',
  'media-journalism', 'architecture-design', 'diplomacy-international',
  'finance-economics', 'medicine-healthcare', 'psychology-advanced',
  // former C2
  'literary', 'archaic', 'proverbs', 'highly-formal', 'technical',
  'advanced-law-justice', 'neuroscience-cognition', 'climate-environment-policy',
  'sociology-anthropology', 'advanced-business-strategy', 'existential-abstract'
] as const,
```

**2c. `PLUS_CATEGORIES`** — replace all `c1/` and `c2/` prefixes with `c/`:

```ts
// Before
'c1/professional',
'c1/abstract-concepts',
// ...
'c2/technical',
'c2/advanced-law-justice',
// ...

// After
'c/professional',
'c/abstract-concepts',
// ...
'c/technical',
'c/advanced-law-justice',
// ...
```

The free categories (former `c1/philosophy`, `c1/academic`, etc. and
`c2/literary`, `c2/archaic`, etc.) are simply **not listed** in `PLUS_CATEGORIES`,
so they remain free — no change to that logic.

**2d. `FREE_QUIZ_CATEGORIES`** — replace `c1/` and `c2/` prefixes with `c/`:

```ts
// Before
'c1/philosophy', 'c1/academic', 'c1/formal-writing',
'c2/literary', 'c2/archaic', 'c2/proverbs',

// After
'c/philosophy', 'c/academic', 'c/formal-writing',
'c/literary', 'c/archaic', 'c/proverbs',
```

**2e. `CEFR_LABELS`** in `learn/[level]/+page.server.ts` — add entry for `c`:

```ts
c: 'Mastery';
```

(Remove `c1: 'Advanced'` and `c2: 'Mastery'`.)

---

### Step 3 — Update `src/lib/data/grammar.json`

There are 27 lines referencing `"C1"`. Two patterns exist:

**Pattern A** — `"cefr": "C1"` (standalone C1 questions):

```json
// Before
{ "cefr": "C1", "levels": ["C1"], ... }

// After
{ "cefr": "C", "levels": ["C"], ... }
```

**Pattern B** — `"levels": ["B2", "C1"]` (questions spanning B2 and C1):

```json
// Before
{ "cefr": "B2", "levels": ["B2", "C1"], ... }

// After
{ "cefr": "B2", "levels": ["B2", "C"], ... }
```

Note: `cefr` on Pattern B questions stays `"B2"` — it is the primary bucket for FSRS
progress. Only the `levels` display tag changes.

There are no `"C2"` references in `grammar.json`.

A simple find-and-replace works:

- `"C1"` → `"C"` globally in the file (safe because no other field contains the
  string `"C1"`)

---

### Step 4 — Update `src/lib/data/stats.json`

Replace the separate `C1` and `C2` keys with a combined `C` key:

```json
"C": {
  "vocab": 300,
  "uttrykk": 0,
  "total": 300
}
```

Remove the `C1` and `C2` keys. Also update `grandTotal` if it is computed from
level totals (155 + 145 = 300, same sum, so `grandTotal` is unchanged).

---

### Step 5 — New routes: `/learn/c` and `/c/[category]`

**5a. `src/routes/learn/c/+page.server.ts`** — static `c` segment, not `[level]`.

This is nearly identical to `learn/[level]/+page.server.ts` with these differences:

- `level = 'c'`, `levelUpper = 'C'` are hardcoded, not from params
- `VALID_LEVELS` check is not needed
- Grammar topic filter uses `levels.includes('C')` (also catches `["B2","C"]` questions)
- Stats reads `stats.byLevel['C']` (the merged key)
- Blog posts filter: `cefrLevels(p.cefr).includes('C')`

**5b. `src/routes/learn/c/+page.svelte`** — copy `learn/[level]/+page.svelte`.

Changes:

- Level color: use the purple palette (was C1's color)
- Category cards: no sub-level badge needed (all are just "C" now)
- Hub title: "C — Mastery"

**5c. `src/routes/c/[category]/+page.server.ts`** — static `c` segment.

Nearly identical to `[level]/[category]/+page.server.ts` with these differences:

- `level` is hardcoded as `'c'`, `levelUpper` as `'C'`
- Vocab loader loads `vocab-c.json` directly (no dynamic key lookup)
- Prev/Next navigation uses `CATEGORIES_BY_LEVEL['C']`
- Breadcrumb and hub link point to `/learn/c`
- OG image path: `/og/deck/c/${category}.png` (update OG image generation script too)

**5d. `src/routes/c/[category]/+page.svelte`** — copy `[level]/[category]/+page.svelte`.

The flashcard logic reads `VocabEntry.level` which is now `'C'` — FSRS progress is
stored and keyed correctly without any changes to `progress.ts`.

---

### Step 6 — Redirect old C1/C2 routes

Rather than creating four new redirect files, handle this inside the two existing
dynamic route server files. This keeps the redirect logic in one place each.

**In `src/routes/learn/[level]/+page.server.ts`**, add at the top of `load`:

```ts
if (level === 'c1' || level === 'c2') {
  redirect(301, '/learn/c');
}
```

**In `src/routes/[level]/[category]/+page.server.ts`**, add at the top of `load`:

```ts
if (level === 'c1' || level === 'c2') {
  redirect(301, `/c/${params.category}`);
}
```

SvelteKit will still match `/c1/philosophy` against the dynamic `[level]/[category]`
route (since there is no static `c1` route), and the redirect fires immediately.
The new static `/c/` route takes over from there.

---

### Step 7 — Update navigation and home page

Search `.svelte` files for any hardcoded level arrays or `c1`/`c2` references outside
the actual route files:

- Home page `+page.svelte` — level card grid: replace two C cards with one `c` card
  linking to `/learn/c`, color purple, label "C"
- `Nav.svelte` — any level dropdowns
- Any component with `const levels = ['a1','a2','b1','b2','c1','c2']`
  → `['a1','a2','b1','b2','c']`
- Level color maps — add `c: { heading: 'text-purple-700 ...', ... }`, remove `c1`/`c2`

---

### Step 8 — Update `sitemap.xml`

In `src/routes/sitemap.xml/+server.ts`, change the level entries:

```ts
// Before
['c1', CATEGORIES_BY_LEVEL['C1']],
['c2', CATEGORIES_BY_LEVEL['C2']],

// After
['c', CATEGORIES_BY_LEVEL['C']],
```

The PLUS filter `PLUS_CATEGORIES.has(`${level}/${cat}`)` now uses `c/` prefix,
matching the updated `PLUS_CATEGORIES` set.

---

### Step 9 — Update OG image generation

In `scripts/generate-og.mjs` (or equivalent), replace `c1`/`c2` level entries with
`c`. The OG images themselves can be regenerated — the script likely iterates
`CATEGORIES_BY_LEVEL`, so updating `types.ts` may be sufficient.

---

### Step 10 — Update search index

In `scripts/build-search-index.ts`, the script likely iterates over levels and
categories. Since it imports from `types.ts`, updating `CATEGORIES_BY_LEVEL` in
Step 2 should be sufficient. Verify the indexed URL paths use `/c/` not `/c1/`
or `/c2/`.

---

### Step 11 — Supabase migration

Even though there are no real Plus users yet, write and run the migration for
correctness:

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_merge_c1_c2_to_c.sql

UPDATE card_progress
SET level = 'C'
WHERE level IN ('C1', 'C2');

UPDATE grammar_progress
SET cefr = 'C'
WHERE cefr IN ('C1', 'C2');
```

This ensures the DB is consistent with the new type and any future test data
starts clean.

Also read `supabase/current-schema.sql` before writing the migration to confirm
column names and any CHECK constraints on `level`/`cefr` that would need updating.

---

### Step 12 — Update e2e tests

Search `e2e/` for any `/c1/` or `/c2/` paths and update to `/c/`. Also check
`flashcard.test.ts` and `quiz.test.ts` for level assertions.

---

## Files touched (summary)

| File                                            | Change                                                                        |
| ----------------------------------------------- | ----------------------------------------------------------------------------- |
| `src/lib/data/vocab-c1.json`                    | **Delete**                                                                    |
| `src/lib/data/vocab-c2.json`                    | **Delete**                                                                    |
| `src/lib/data/vocab-c.json`                     | **New** — merged, all `level: "C"`                                            |
| `src/lib/data/grammar.json`                     | Replace `"C1"` → `"C"` globally (27 occurrences)                              |
| `src/lib/data/stats.json`                       | Replace `C1`/`C2` keys with single `C` key                                    |
| `src/lib/types.ts`                              | `CEFRLevel`, `CATEGORIES_BY_LEVEL`, `PLUS_CATEGORIES`, `FREE_QUIZ_CATEGORIES` |
| `src/routes/learn/[level]/+page.server.ts`      | Add `c1`/`c2` → `/learn/c` redirect + remove `c1`/`c2` from `CEFR_LABELS`     |
| `src/routes/[level]/[category]/+page.server.ts` | Add `c1`/`c2` → `/c/[category]` redirect                                      |
| `src/routes/learn/c/+page.server.ts`            | **New** — combined C hub                                                      |
| `src/routes/learn/c/+page.svelte`               | **New** — adapted from `[level]/+page.svelte`                                 |
| `src/routes/c/[category]/+page.server.ts`       | **New** — serves `vocab-c.json`                                               |
| `src/routes/c/[category]/+page.svelte`          | **New** — adapted from `[level]/[category]/+page.svelte`                      |
| `src/routes/+page.svelte`                       | Replace C1/C2 level cards with single C card                                  |
| `src/routes/components/Nav.svelte`              | Update level references                                                       |
| `src/routes/sitemap.xml/+server.ts`             | Use `c/` paths                                                                |
| `scripts/build-search-index.ts`                 | Index C under `/c/`                                                           |
| `scripts/generate-og.mjs`                       | Generate OG images under `/og/deck/c/`                                        |
| `supabase/migrations/..._merge_c1_c2_to_c.sql`  | **New** — UPDATE level/cefr columns                                           |
| `e2e/*.test.ts`                                 | Update `/c1/` and `/c2/` paths to `/c/`                                       |

---

## What does NOT change

- `progress.ts` — no changes; FSRS logic is level-agnostic
- `quiz.ts` / `quiz.svelte` — category-level gating reads from `PLUS_CATEGORIES`
  and `FREE_QUIZ_CATEGORIES`, both updated in Step 2
- Grammar question `id` fields — stable, no FSRS key migration needed
- Norskprøven, blog, daily, my-profile, stats routes — unaffected
- `isPlusCategory()` / `isFreeQuizCategory()` function signatures — unchanged

---

## Recommended implementation order

1. **Step 1** — merge vocab JSON (data foundation, no code change)
2. **Step 2** — update `types.ts` (everything else depends on this)
3. **Step 3** — update `grammar.json` (simple find-and-replace)
4. **Step 4** — update `stats.json`
5. **Steps 5a/5c** — new server files (can be tested locally before UI)
6. **Steps 5b/5d** — new Svelte pages
7. **Step 6** — redirects in existing dynamic routes
8. **Step 7** — home page / nav UI
9. **Steps 8–10** — sitemap, OG images, search index
10. **Step 11** — Supabase migration
11. **Step 12** — e2e tests
