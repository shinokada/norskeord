---
title: Due-only review (cross-category)
date: 2026-09-02
completed: false
---

# Due-only review — study just what's due, across categories

## Background

Studying today means opening one `/{level}/{category}` page at a time.
`VocabFlashcardPage.svelte` already has a `deckMode: 'all' | 'due'` and a
`buildDueDeck()` that filters a category's `entries` down to overdue +
capped-new cards — but it's locked: Plus users are always forced into
`'due'` on mount, free users are always forced into `'all'`, and either way
it only ever operates on the one category's `entries` prop. There is no way
today to pull "everything due right now" across categories or levels into
one session — the person has to know which categories have due cards (via
`/stats`) and click into each one individually, wading through known words
in free mode or losing the "all" browsing view in Plus mode.

`card_progress` (Supabase, Plus users) and the `progress-*` /
`grammar-*` localStorage keys (free/guest) already carry everything needed
to know what's due — `due`, `level`, `category`, `vocab_id` — so this is a
UI/aggregation problem, not a data-model problem.

## Decisions

- **Entry points**: a global "Study due" button (all levels), a per-level
  "Study due" button, and clickable due badges on the existing per-category
  rows in `LevelStatRows.svelte` (`/stats`). All three route into the same
  `/review` session — they only differ in query params.
- **Vocab vs. Uttrykk**: when arriving from the global or per-level entry
  points, the person picks at the start of the session (Vocabulary /
  Uttrykk / Both). Arriving from a per-category badge skips the picker —
  the category already implies the type.
- **Scope**: due-only means cards with an existing FSRS due date that has
  passed (`due <= now`). Never-studied ("new") cards are out of scope here
  — they have no progress row and no due date; new-card discovery stays in
  the existing per-category browsing flow (`'all'` mode / Plus's capped-new
  allowance inside a single category). Grammar is out of scope for v1 — see
  Open questions.

## Step 1 — Resolver endpoint: vocab_id → full entry

New `src/routes/api/review-entries/+server.ts` (POST, JSON body).

- **Input**: an array of `{ id: string; level: CEFRLevel; category: string }`
  — the caller already has these three fields on every `CardProgress`
  row/localStorage entry, so no guessing is needed server-side.
- **Behavior**: groups the requested ids by level, loads only the
  `vocab-{level}.json` / `uttrykk-{level}.json` / `uttrykk-c.json` files
  actually needed (same loader maps already in
  `src/routes/[level]/[category]/+page.server.ts` — reuse, don't
  reimplement), and for each id picks the right source file using the same
  classification the `/stats` page already relies on: `category ===
'uttrykk'` for A1–B2, `UTTRYKK_C_KEYS.has(id)` for C (from
  `$lib/uttrykk-c-stats`), vocab file otherwise.
- **Output**: a flat `VocabEntry[]`, order not guaranteed (the client
  shuffles/orders as needed).
- No new auth surface — this returns the same public vocab data every
  category page already serves, just addressed by id instead of by
  category.

## Step 2 — Client helper: progress map → due items

New function in `src/lib/progress.ts`, e.g. `getDueItems(progressMap,
opts?)`:

- Filters `Object.entries(progressMap)` to `due <= now`, optionally by
  `level` and/or by vocab-vs-uttrykk (same sentinel/`UTTRYKK_C_KEYS` split
  `/stats` already uses for `vocabCards`/`uttrykkCards` — factor that split
  out of `stats/+page.svelte` into this helper so both places share one
  implementation instead of two copies).
- Returns `{ id, level }[]` — the exact shape Step 1's endpoint expects as
  input (Step 1 shipped without needing `category`, see its progress-log
  note above).
- Works unchanged for both Plus (progress map already loaded via
  `loadProgressMapFromSupabase`) and free/guest (`loadProgressMap` from
  localStorage) — no new Supabase query type needed, both cases already
  load the full map elsewhere (`/stats` does this today), so `/review`
  reuses the same load.

## Step 3 — `/review` route

New `src/routes/review/+page.svelte` (no `+page.server.ts` — everything
needed is client-side: progress map, the Step 1/2 helpers).

- Reads `?level=` (omitted = all levels) and `?type=vocab|uttrykk|both`
  from the URL.
- If `type` is missing: show a small picker ("Vocabulary · Uttrykk · Both")
  before building the deck — satisfies the "choose at session start"
  decision without a persistent setting to maintain. If `type` is present
  (per-category badge), skip straight to the deck.
- On mount (or after the picker choice): load the progress map →
  `getDueItems()` → POST to `/api/review-entries` → resolved `VocabEntry[]`.
- Renders the resolved entries through the **existing**
  `VocabFlashcardPage` component, unmodified — since the entries passed in
  are already the due set, `VocabFlashcardPage`'s own `deckMode` logic
  (forced `'due'` for Plus / forced `'all'` for free) both work correctly
  against a pre-filtered list without further changes: Plus's
  `buildDueDeck()` just reconfirms every passed-in entry as overdue (no
  new-card cap ever engages, since none of them are new), and free's
  `'all'` mode shuffles/caps the already-due-only list. Pass
  `level="Review"` (or similar), `sectionLabel` accordingly, and omit
  `prevCategory`/`nextCategory` (no meaningful adjacent category across a
  mixed session).
- Empty state ("Nothing due right now 🎉") with links back to `/stats` and
  `/learn`.

## Step 4 — Wire up the three entry points

- **4a. Global** — `/stats`: a "Study due" button near the existing `Due
today` summary-strip card → `/review` (no params). Only shown when
  `totalDueToday > 0`.
- **4b. Per-level** — `/stats`: near each level tab's summary card(s)
  (`activeVocabLevelStat.due` / `activeUttrykkLevelStat.due`), a "Study
  due" link → `/review?level={activeLevel}`. (Optional stretch: same CTA
  on `/learn/[level]` — flagged as a decision point below, since that page
  doesn't currently load progress data at all.)
- **4c. Per-category** — `LevelStatRows.svelte`: the existing due badge
  (`{row.due} due`) becomes its own link — `/review?level={level}&category=
{row.key}&type=...` — instead of only the whole row linking to the plain
  category page. Needs `stopPropagation`/a nested `<a>` (or restructure the
  row so the due badge isn't inside the outer anchor) so clicking the badge
  doesn't also navigate via the row's own link.

## Step 5 — Verify

- First-time due count matches: cross-check `/review`'s resolved deck size
  against `/stats`'s `Due today` / per-level `due` numbers for the same
  scope (global, a level, a category) before and after Step 4 wiring.
- Guest/free (no login), free with existing localStorage progress, and
  Plus (Supabase) — all three paths through Step 2/3.
- Rating inside `/review` updates `card_progress`/localStorage exactly like
  rating inside a normal category page (it's the same `rate()` /
  `saveProgress()` call inside `VocabFlashcardPage` — nothing new to test
  here beyond confirming the props wiring didn't break it).
- Empty states: zero due globally, zero due for a level, zero due for a
  single category badge.
- Mobile pass (touch swipe, picker screen layout at narrow width).
- `pnpm check` — flagging as before, I can't run this myself; needs a
  manual run.

## Open questions

- **Grammar due cards** — out of scope for v1 (`/review` only aggregates
  vocab/uttrykk). Grammar already has its own due count on `/stats`
  (`grammarDue`) but no aggregated cross-topic session either. Revisit
  together if this turns out to be wanted too — same Step 1/2 pattern
  would extend to `grammar_progress` + `GrammarQuestion` fairly directly.
- **`/learn/[level]` CTA (Step 4b stretch)** — that page currently has no
  client-side progress loading at all (it's a server-rendered hub). Adding
  a due count there means either a new client-side fetch on that page or
  accepting a slight delay/flash while it loads. Decide once Steps 1–4a/4c
  are in and it's clear whether the `/stats` entry points alone feel
  sufficient.

## Progress log

Update this section as work lands — mark each item **✅ Done** (with the
date) when it's finished, so this file stays the single source of truth for
where the feature stands.

- [x] Step 1 — `/api/review-entries` resolver endpoint — ✅ Done (2026-09-02). Implementation note: dropped `category` from the request shape (plan originally had `{id, level, category}`) — the endpoint just checks both the vocab and uttrykk file for a level and keeps whatever id matches, so `category` wasn't actually needed. Step 2's `getDueItems()` only needs to return `{id, level}` now.
- [x] Step 2 — `getDueItems()` helper in `progress.ts` — ✅ Done (2026-09-02). Added `getDueItems(progressMap, { level?, category?, type? })` right after `countDueToday()`. Ended up with a `category` option too (not just level/type) so `LevelStatRows.svelte`'s Step 4c badges can call it directly with a single category slug — useful since it was easy to add and keeps Step 4c from needing its own filtering logic. Reuses `UTTRYKK_C_KEYS` from `uttrykk-c-stats.ts` for the C vocab-vs-uttrykk split, same as `stats.ts` already does — no circular import (that module only imports the static `uttrykk-c.json`).
- [x] Step 3 — `/review` route + picker + empty state — ✅ Done (2026-09-02). `src/routes/review/+page.svelte`, no `+page.server.ts` (client-only: progress map → `getDueItems()` → `/api/review-entries`). Renders through the existing `VocabFlashcardPage` unmodified, per the plan — passing already-due entries works correctly against both its forced deck modes (Plus's `buildDueDeck()` just reconfirms every entry as overdue since none are new; free's `'all'` mode shuffles/caps the already-due-only list). One correction from the plan: the empty-state "browse" link points at `/` (home), not `/learn` — there's no `/learn` index route, only `/learn/[level]`; `/` is what the home page's own level cards link out from. UI strings (picker, loading, empty state) are hardcoded English for v1, matching the existing precedent of hardcoded guest-nudge copy inside `VocabFlashcardPage.svelte` itself — can be moved to `m.*` paraglide keys later if this sticks.
- [x] Step 4a — Global "Study due" button on `/stats` — ✅ Done (2026-09-02). Banner below the summary strip, shown when `totalDueToday > 0`, links to `/review` (no params → picker).
- [x] Step 4b — Per-level "Study due" button on `/stats` — ✅ Done (2026-09-02). Small link below the level tabs, shown when `activeVocabLevelStat.due + activeUttrykkLevelStat.due > 0` (deliberately excludes `grammarDueForActiveLevel` — the badge's count has to match what `/review` actually opens, and grammar is out of scope there). Links to `/review?level={activeLevel}` (no type → picker). Skipped the `/learn/[level]` stretch goal from the plan for now, per the Open questions note.
- [x] Step 4c — Clickable due badges in `LevelStatRows.svelte` — ✅ Done (2026-09-02). Restructured each row from one big `<a>` into a `<div>` with a full-row absolute-overlay link (default action, unchanged) plus the due badge as its own higher-z-index `<a>` when a `reviewType` prop is passed in — wired for the Vocab and Uttrykk `LevelStatRows` calls (`reviewType="vocab"`/`"uttrykk"`, plus `level={activeLevel}`); Grammar's call is untouched (no `reviewType`), so it keeps today's plain unclickable badge, matching the plan's "grammar out of scope for v1" decision. **Precision caveat surfaced while implementing** (not anticipated in the original plan): A1–B2 uttrykk rows are keyed by _theme_, but `CardProgress.category` only ever stores the literal `'uttrykk'` sentinel for those cards — `getDueItems()`'s `category` filter has nothing theme-shaped to match against. Those rows (and any "Others" row, which was never a real category/theme to begin with) fall back to a level+type-wide `/review` link instead of the exact theme; vocab rows and C's uttrykk rows (both use real category slugs) get the precise `&category=` scope. Documented inline in `reviewHref()`'s doc comment.
- [ ] Step 5 — Verification pass (guest/free/Plus, empty states, mobile, `pnpm check`)
