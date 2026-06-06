# Search Feature — Implementation Plan

## Overview

A Plus-only full-text search across all vocabulary and expressions in
`src/lib/data`. The search index is **pre-computed at build time** into a single
JSON file, placed in `static/data/`, fetched lazily when a Plus user first opens
search, and queried entirely in the browser — no server round-trips, no Edge
function invocations.

---

## Data scope

| File pattern                            | Count                    | Searchable fields                                                       |
| --------------------------------------- | ------------------------ | ----------------------------------------------------------------------- |
| `vocab-*.json`                          | ~4,000 entries (growing) | `norsk`, `lemma`, `english`, `example`, `example_english`, `definition` |
| `uttrykk-*.json`                        | ~1,078 entries (growing) | `norsk`, `lemma`, `english`, `example`, `example_english`               |
| `norske_metaforiske_uttrykk_B1_B2.json` | ~60 entries              | same as uttrykk                                                         |

Grammar and Norskprøven entries have no clean `norsk`/`english` pairing and need
a different result card layout — excluded from v1, easy to add later.

**Target: ~10,000 entries** once C1/C2 and remaining categories are complete.

---

## Why build-time pre-computation

With ~10,000 entries the raw JSON approaches ~1.5 MB. Building the flat index
in the browser on every cold start means V8 parsing bundled JS object literals —
meaningfully slower than fetching a single compact JSON file.

Pre-computing at build time gives:

- One clean JSON fetch per session (faster JSON parse vs JS literal parse)
- Field-stripping and string pre-normalisation happen once at build, not per user
- A natural place to add heavier pre-processing later (phonetic keys, etc.)
  without touching browser code
- Zero Edge function invocations — the file is served as a static asset from
  Vercel's CDN

Sync risk (stale index) is eliminated by hooking the script into `ch` in
`package.json` (see below).

---

## Why static asset (not Vite dynamic import)

A Vite dynamic import also needs the file to exist at build time (Vite bundles
it into a code-split chunk), so `build-search-index.ts` is required either way.
The content-hash caching benefit of Vite chunking can be replicated with a single
`Cache-Control: immutable` header in `vercel.json`. The static asset approach is
simpler — no Vite import plumbing — and gives full control over caching headers.

**Serving:** `static/data/search-index.json` → available at `/data/search-index.json`  
**Caching:** `vercel.json` sets `Cache-Control: public, max-age=31536000, immutable`
on that path. The browser fetches it once per deployment and caches it
indefinitely. On the next deployment the content changes and the browser
re-fetches — acceptable for an index that only changes when vocab data changes.

---

## Route

A global search **modal** (Cmd/Ctrl+K) triggered from the Nav is recommended
over a dedicated `/search` page — it feels like a dictionary tool and avoids a
navigation step. A `/search` page can be added later for shareable deep-links.

---

## Architecture

### 1. Index builder script — `scripts/build-search-index.ts` ✅

Reads all non-preview vocab and uttrykk JSON files, maps them to `SearchEntry`,
and writes `static/data/search-index.json`.

Keep this **separate** from `generate-stats.mjs` — the two scripts have different
jobs (shaping a ~500 KB search artefact vs counting entries for the stats widget)
and different futures. Combining them would mix concerns and complicate adding
pre-processing later.

Key implementation details:

- IDs use a global counter (`before + i`) so they are stable across files
- `lemma` falls back to `norsk` when absent
- `mkdirSync({ recursive: true })` ensures `static/data/` exists on first run
- Output is compact JSON (no pretty-print) to minimise file size
- Prints a summary table (filename + entry count) matching the style of
  `generate-stats.mjs`

### 2. `package.json` scripts ✅

```json
"ch": "npx tsx scripts/build-search-index.ts && npx changeset && pnpm stats",
"search:index": "npx tsx scripts/build-search-index.ts"
```

`ch` runs the index builder first so the artefact is always fresh when cutting a
release. `search:index` provides a standalone command for local use and CI.

### 3. `vercel.json` ✅

```json
{
  "installCommand": "pnpm install",
  "buildCommand": "pnpm search:index && pnpm build",
  "crons": [...],
  "headers": [
    {
      "source": "/data/search-index.json",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    }
  ]
}
```

`buildCommand` ensures the index is regenerated on every Vercel deployment before
`vite build` runs. No separate Vercel project setting needed.

### 4. `.gitignore` ✅

`static/data/search-index.json` is added as a generated artefact. Running
`pnpm search:index` locally before `pnpm dev` or `pnpm test:e2e` is required
(see Testing section below).

### 5. Search index loader — `src/lib/search.ts` ✅

Exports the `SearchEntry` type and a lazy fetch helper with in-memory caching.
The browser fetches `/data/search-index.json` once per session; subsequent calls
return the cached array immediately.

```ts
export interface SearchEntry {
  id: string;
  norsk: string;
  lemma: string;
  english: string;
  example: string;
  example_english: string;
  definition?: string;
  level: string;
  category: string;
  part?: string;
  source: 'vocab' | 'uttrykk';
  href: string;
}

let cached: SearchEntry[] | null = null;

export async function loadSearchIndex(): Promise<SearchEntry[]> {
  if (cached) return cached;
  const res = await fetch('/data/search-index.json');
  if (!res.ok) throw new Error(`Failed to load search index: ${res.status}`);
  cached = await res.json();
  return cached!;
}
```

### 6. Search algorithm — `src/lib/searchUtils.ts` ✅

Four-pass scoring. No external library needed at ~10,000 entries (search
completes in <5 ms). Accepts an optional `SearchFilter` for source and level.

| Pass | Match type                                                  | Score |
| ---- | ----------------------------------------------------------- | ----- |
| 1    | Exact match on `lemma` or `english`                         | 10    |
| 2    | Prefix match on `lemma` or `english`                        | 8     |
| 3    | Substring match across all text fields                      | 5     |
| 4    | All query tokens appear somewhere (handles inflected forms) | 1     |

Results sorted by score descending, capped at **50**.

**`normalize()` detail:** strips combining diacritical marks via NFD decomposition,
but explicitly preserves `å` by excluding U+030A (combining ring above) from the
strip range. `å` decomposes to `a` + U+030A in NFD — a naive strip-all would
silently convert `å → a`, breaking Norwegian search. `ø` and `æ` do not
decompose and are unaffected.

**`hasInflection(entry)`** returns true when `norsk` ≠ `lemma`, used by the UI
to show the "matched: boken · lemma: bok" note.

### 7. UI — `src/lib/components/Search.svelte`

A modal component. Index loads once on first open and is kept in memory.

```
┌─────────────────────────────────────────────────────┐
│  🔍  søk etter ord eller uttrykk...                 │
├─────────────────────────────────────────────────────┤
│  Filters: [All] [Vocab] [Uttrykk]   [A1]…[C2]      │
├─────────────────────────────────────────────────────┤
│  hei                              A1 · greetings    │
│  English: hi                                        │
│  Hei! Hvordan går det?                              │
│  (matched: boken · lemma: bok)                      │
├─────────────────────────────────────────────────────┤
│  …more results                                      │
└─────────────────────────────────────────────────────┘
```

Key UX details:

- **Lazy load:** `loadSearchIndex()` on first open, spinner while loading
- **Debounce** input 150 ms
- **Keyboard nav:** ↑/↓ through results, Enter navigates to flashcard, Escape closes
- **Match highlight:** bold the matched substring so users see _why_ a result appeared
- **Inflected form:** show "matched: X · lemma: Y" when `norsk` ≠ `lemma`
- **Empty state:** "Ingen resultater for «X»" with a note to try the other language

### 8. Nav integration — `src/routes/components/Nav.svelte`

Add a search icon button, visible when `isPlus` is true (already in layout load).
For free users: show the icon with a small lock badge — clicking opens an upgrade
prompt. Better for conversion than hiding entirely.

---

## Testing

### Unit tests — `src/lib/searchUtils.test.ts`

Co-located with the source, using Vitest, following the pattern of `utils.test.ts`
and `quiz.test.ts`. Pure functions with no dependencies — straightforward to test.

Coverage:

**`normalize()`**

- Norwegian chars preserved: `å`, `ø`, `æ`
- Accents stripped: `é → e`, `ü → u`
- Case-folded, trimmed
- Empty string safe

**`search()`**

- Query shorter than 2 chars returns empty
- Exact match on `lemma` scores higher than prefix, prefix higher than substring
- English query matches `english` field
- Norwegian inflected form matched via token pass (e.g. `boken` matches lemma `bok`)
- Filter by `source` excludes other sources
- Filter by `level` excludes other levels
- Results capped at 50
- Results sorted by score descending
- Empty index returns empty array

**`hasInflection()`**

- Returns true when `norsk` ≠ `lemma`
- Returns false when equal

### E2E tests — `e2e/search.test.ts`

Uses `injectPlusPlan` from `helpers.ts` for Plus-gated assertions. Does **not**
re-test scoring logic — that belongs in unit tests.

Coverage:

- Free user sees search icon with lock badge
- Free user clicking icon sees upgrade prompt
- Plus user sees modal open (Cmd/Ctrl+K and icon click)
- Typing a query shows results
- Escape closes the modal
- Network request to `/data/search-index.json` is made on first open

**Local prerequisite:** `pnpm search:index` must be run before `pnpm test:e2e`
so the static asset exists. Consider updating the `test` script:

```json
"test": "pnpm search:index && npm run test:unit -- --run && npm run test:e2e"
```

---

## File plan

```
scripts/
  build-search-index.ts       ✅ generates static/data/search-index.json

static/
  data/
    search-index.json         ✅ generated artefact (gitignored)

src/
  lib/
    search.ts                 ✅ SearchEntry type + loadSearchIndex()
    searchUtils.ts            ✅ search(), normalize(), hasInflection()
    searchUtils.test.ts       ← new: unit tests
    components/
      Search.svelte           ← new: modal UI
  routes/
    components/
      Nav.svelte              ← edit: add search icon + modal trigger

e2e/
  search.test.ts              ← new: e2e tests

.gitignore                    ✅ static/data/search-index.json added
package.json                  ✅ search:index + updated ch script
vercel.json                   ✅ buildCommand + Cache-Control header
```

---

## Effort estimate

| Task                                          | Status  | Estimate      |
| --------------------------------------------- | ------- | ------------- |
| `build-search-index.ts` script                | ✅ done | 1 h           |
| `vercel.json` + `.gitignore` + `package.json` | ✅ done | 0.5 h         |
| `search.ts` + `searchUtils.ts`                | ✅ done | 1 h           |
| `searchUtils.test.ts` unit tests              | next    | 1 h           |
| `Search.svelte` modal                         | —       | 2–3 h         |
| Nav integration + Plus gate                   | —       | 1 h           |
| `e2e/search.test.ts`                          | —       | 1 h           |
| **Total**                                     |         | **7.5–9.5 h** |
