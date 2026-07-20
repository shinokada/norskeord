# Restructuring `uttrykk` into browsable groups (and shipping C's unused entries)

## Background

Every level's `uttrykk` category is a single flat bucket, gated as one Plus-only
route (`isPlusCategory` in `access.ts`, `[level]/[category]/+page.server.ts`).
Unlike every other category — which is a themed deck of a few dozen words — the
entry counts here are:

| Level | `uttrykk-xx.json` entries | Wired into a route?                                                    |
| ----- | ------------------------- | ---------------------------------------------------------------------- |
| A1    | 119                       | yes (`a1/uttrykk`)                                                     |
| A2    | 245                       | yes (`a2/uttrykk`)                                                     |
| B1    | ~large (uncounted here)   | yes (`b1/uttrykk`)                                                     |
| B2    | 679                       | yes (`b2/uttrykk`)                                                     |
| C     | 559                       | **no** — not in `CATEGORIES_BY_LEVEL.C`, no loader in `uttrykkLoaders` |

`VocabFlashcardPage.svelte` builds every session the same way regardless of
deck size: `getSessionLimit()` defaults to 20 cards, `buildDeck()` shuffles the
full `entries` array and slices to the limit. That works fine for a 20–40 card
themed category — a session covers all or most of the deck. For `b2/uttrykk`
it means each session is a random 3% skim of 679 cards, with no sub-structure,
no sense of progress, and no way to browse or study a specific theme or
chapter. That flat, undifferentiated pile is the core problem this doc solves.

Separately, `uttrykk-c.json`'s 559 entries used to sit completely unused — no
`CATEGORIES_BY_LEVEL.C` entry, no `uttrykkLoaders` key, nothing in
`PLUS_CATEGORIES` for it. Phase 4 below covers getting that content live — it
now ships as a read-time merge into the matching `c/{category}` vocab page,
keeping `uttrykk-c.json` as its own correctly-classified file. See Phase 4's
Status for what actually shipped, which differs from the plan this doc
originally laid out.

## Non-goals

- **No new gated categories or `PLUS_CATEGORIES` entries for A1–B2 uttrykk.**
  The gating model is per-category (`isPlusCategory(level, category)`), so
  splitting `uttrykk` into per-theme category slugs (`greetings-uttrykk`,
  `food-uttrykk`, ...) would multiply the badge count on the category picker
  (A1 alone would go from ~20 badges toward 35–40) and was already rejected in
  an earlier conversation. `uttrykk` stays exactly one route, one badge, one
  Plus gate per level, for A1–B2.
- **No change to the vocab/uttrykk classification rules** in
  `data-rules/vocab-and-uttrykk.md`. This is purely about grouping/display of
  entries that are already correctly classified as `uttrykk`.
- **Not a rewrite of `VocabFlashcardPage.svelte`'s FSRS/session logic.** Session
  building, due-card priority, and rating stay as-is; this only adds a
  browsing/filtering layer on top for large decks.

## Phase 1 — Decide the tagging taxonomy ✅ Done

Before touching data, settle what a "group" means for A1–B2 uttrykk. Two
candidate dimensions, not mutually exclusive:

- **`theme`** — semantic grouping (greetings, time expressions, idioms,
  proverbs, discourse markers...), consistent with how vocab categories are
  already themed.
- **`chapter`** — source grouping, where traceable (e.g. the textbook chapter
  ranges already used in the C-level pipeline, `83–90`, `91–95`, `96–103`).
  Likely only cleanly recoverable for C and any batch whose source is still
  known; A1/A2/B1/B2 entries may not have a clean source mapping anymore.

Recommendation: use `theme` as the primary field since it applies uniformly
across all levels and gives learners a browsable, meaningful grouping; treat
`chapter` as optional metadata only where the source is still known (mainly
useful for the C import in Phase 4, not required for A1–B2).

### Why `theme`/`chapter` are new fields, not reused `category`/`part`

Both `category` and `part` look like they could be recycled to carry this new
information instead of adding fields. They can't, for two different reasons:

**Not `category`.** `category: Category` is a type generated from
`CATEGORIES_BY_LEVEL` and shared across files — `VocabEntry.category` and
`CardProgress.category` both use the same literal union regardless of which
JSON file an entry lives in. The functional fallback themes below (`idioms`,
`time-expressions`, `opinion-formulas`, ...) aren't in `CATEGORIES_BY_LEVEL`
for A1/A2/B1 at all, so writing them straight into `category` would either
fail to typecheck or force adding them to `CATEGORIES_BY_LEVEL` — recreating
the badge/route sprawl Non-goals already rejects. (Note: `uttrykk` routes
actually load their file wholesale via `uttrykkLoaders[key]`, unlike vocab's
shared-file-filtered-by-`category` pattern — so the file boundary alone means
there's no _routing_ reason `category` couldn't be repurposed for uttrykk
specifically. That's not the real blocker.)

The real blocker is `CardProgress`: `saveProgress()` copies `entry.category`
straight into `CardProgress.category`, and `CategoryBarChart.svelte` groups
by exactly that field to build `/stats` rows. Phase 1's whole pitch is
reusing topical category names when they genuinely fit (e.g. tagging an A1
uttrykk entry `theme: "greetings"` to match the real A1 vocab category). If
`category` held `"greetings"` directly instead of staying `"uttrykk"`, a
review of that uttrykk phrase and a review of a `vocab-a1.json` greetings
word become indistinguishable in `CardProgress` — both produce a
`category: "greetings"` row, silently inflating vocab progress stats with
uttrykk reviews (or double-counting the other way for Phase 5's per-theme
uttrykk bars). That's a data-integrity bug, not a style preference, and it
shows up precisely in the cases where topical reuse — the part of this
design that's actually useful — is working as intended. So `category` stays
`"uttrykk"` for every entry no matter what `theme` it gets; `theme` is purely
additive and never feeds routing, gating, or `CardProgress`/stats grouping.

**Not `part`.** `part: PartOfSpeech` is a closed grammatical tag (`noun |
verb | adjective | ... | phrase`) that already carries meaning for uttrykk —
every `uttrykk-c.json` entry uses `part: "phrase"`, same as every other
uttrykk file (see Phase 4's Status — these entries stay in `uttrykk-c.json`,
they were not folded into `vocab-c.json`). Overloading `part` to also carry a
theme would conflate two
unrelated axes (grammatical category vs. topic) into one field: any UI/filter
built around part-of-speech would start showing topic names mixed in with
`noun`/`verb`, and the `"phrase"` value itself — the one signal that marks an
entry as uttrykk-shaped — would be lost. `part` is also a fixed union in
`types.ts`, so recycling it means either abusing an existing literal or
extending `PartOfSpeech` with topic strings that have nothing to do with
parts of speech, corrupting the type for every non-uttrykk entry too.

Both `theme` and `chapter` are therefore new, additive fields (Phase 2 adds
them to `types.ts` as optional), not repurposed existing ones.

### Theme taxonomy: a hybrid, not a single source

`CATEGORIES_BY_LEVEL` (in `src/lib/config.ts`) is a good starting point but
only cleanly covers part of the uttrykk content, not all of it:

- **Where reuse works well:** a real chunk of uttrykk entries are genuinely
  topical and slot naturally into an existing category name for that level —
  a greeting formula like _god morgen_ fits `greetings`, a food-related idiom
  fits `food`, a weather expression fits `weather`. Notably, **B2 already has
  a `discourse-markers` category in `CATEGORIES_BY_LEVEL`** — one of the
  "new" functional buckets below turns out to already be precedented in the
  existing taxonomy.
- **Where reuse breaks down:** the actual core of what uttrykk is _for_ —
  fixed formulas, connectives, and idioms with no topical subject matter,
  e.g. _alt i alt_, _det vil si_, _forutsatt at_, _med utgangspunkt i_, _etter
  min mening_, _ta vare på_ (see the examples in
  `data-rules/vocab-and-uttrykk.md`). These aren't "about" food or travel or
  weather; forcing e.g. _det vil si_ ("that is to say") into a topical bucket
  like `communication` would be a stretch that hurts browsing accuracy rather
  than helping it.
- There's also a level-consistency problem: `CATEGORIES_BY_LEVEL` genuinely
  differs per level (A2 has `time`, B1 doesn't; A1 has `days-months` but no
  generic `time`), so a purely-reused taxonomy would give a different,
  incomplete vocabulary of topics at each level instead of one consistent
  `theme` field.

The taxonomy is therefore a **hybrid** with a strict precedence rule:

1. When tagging an entry's `theme`, first check
   `CATEGORIES_BY_LEVEL[level]` for that entry's level — if a topical fit is
   genuinely natural, use that exact slug (e.g. `theme: "greetings"`,
   `theme: "food"`, `theme: "weather"`). Reusing real category names where
   they fit means a "Greetings" chip inside the uttrykk view uses the same
   word a learner already recognizes from the vocab picker — no new
   vocabulary to learn for browsing.
2. For entries that don't fit any existing topic — expected to be a large
   share, since that's what uttrykk is designed to capture — fall back to a
   small fixed set of uttrykk-only functional themes:
   - `idioms`
   - `proverbs`
   - `discourse-markers` (already precedented by B2's `CATEGORIES_BY_LEVEL`
     entry)
   - `time-expressions`
   - `opinion-formulas`
3. Critically: this taxonomy only ever populates the new `theme` field, never
   the `category` field. `category` stays `"uttrykk"` for every entry
   regardless of which theme (topical or functional) it gets tagged with, so
   gating/routing is completely untouched — see Non-goals above. This is
   strictly additive: `isPlusCategory` never sees a new value to worry
   about.

If, after tagging, an entry still doesn't cleanly fit either the topical list
or the five functional themes above, use the catch-all `general` theme from
Phase 2 rather than forcing a bad fit — precision here matters more than
100% categorization.

### Implemented

The taxonomy above is codified in `src/lib/config.ts`:

- `UTTRYKK_FUNCTIONAL_THEMES` — the five fixed fallback themes.
- `UTTRYKK_CATCHALL_THEME` — `"general"`.
- `UTTRYKK_THEME_LEVELS` — `['A1', 'A2', 'B1', 'B2']` (C excluded, per Phase 4).
- `UTTRYKK_THEMES_BY_LEVEL` — per level, the precedence-1 topical slugs
  (derived from `CATEGORIES_BY_LEVEL[level]`, minus `uttrykk`/`uttrykk-preview`)
  unioned with the functional themes and the catch-all, deduped (handles B2
  where `discourse-markers` is both topical and functional).

This is the reference list Phase 2's classifier pass should validate
`proposed_theme` against — nothing in it touches `category` or `part`, per
the rationale above. No `VocabEntry`/`types.ts` changes yet; that's Phase 2.

## Phase 2 — Tag pass ✅ Done

**Status: done for all four levels (A1, A2, B1, B2).**

- **A1 (119 entries) — done.** Every entry has a reviewed `theme` (triage
  artifact: `ai-docs/implementation/uttrykk-theme-triage-a1.json`).
- **A2 (278 entries) — done.** The interrupted merge mentioned in an earlier
  version of this doc (truncated file, rebuild via `scripts/merge-a2-theme.mjs`)
  has since completed — every entry has a valid `theme`.
- **B1 (221 entries) — done.** Every entry has a valid `theme`.
- **B2 (679 entries) — done.** Every entry has a valid `theme` (skews heavily
  toward the `idioms` functional theme — 541/679 — which fits: B2's uttrykk
  are mostly non-topical idioms rather than themed vocabulary).
- Verified directly against data on disk: all four files parse cleanly, every
  entry's `theme` is non-empty and a member of that level's real
  `UTTRYKK_THEMES_BY_LEVEL[level]` set (topical slugs from
  `CATEGORIES_BY_LEVEL[level]` + the five functional themes + `general`), and
  there are no duplicate ids in any file.
- `VocabEntry.theme?: string` is in `types.ts` (step 4 below).
- `check-uttrykk.mjs` requires a non-empty `theme` on every full-file uttrykk
  entry (step 3's validation requirement) — should now pass `--strict` for
  all of A1/A2/B1/B2. Worth running once as an official check rather than
  relying on the ad-hoc validation above.

Add a `theme` field (and `chapter` where known) to every entry in
`uttrykk-a1.json`, `uttrykk-a2.json`, `uttrykk-b1.json`, `uttrykk-b2.json`.
Follow the same triage-then-commit pattern used in
`c-uttrykk-addition.md` / `vocab-uttrykk-reclassification-workflow.md`:

1. Run entries through an AI classifier pass against the Phase 1 theme list,
   output a review artifact (e.g. `ai-docs/implementation/uttrykk-theme-triage.json`)
   with `{ id, norsk, proposed_theme, confidence }` per entry rather than
   editing the production JSON directly.
2. Spot-check low-confidence assignments and anything that doesn't cleanly fit
   a theme (fall back to a catch-all `general` theme rather than forcing a
   bad fit).
3. Merge the reviewed `theme` values into the actual `uttrykk-xx.json` files.
   `category` stays `"uttrykk"` for every entry — `theme` is a new, additive
   field, not a replacement for `category` (which drives routing/gating).
4. Update `VocabEntry` in `types.ts` to add optional `theme?: string` (and
   `chapter?: string` if used).

Validation: extend `check-uttrykk.mjs` (or whichever validator currently
checks uttrykk files) to confirm every entry has a non-empty `theme` after
this phase, so nothing silently falls through to "untagged."

## Phase 3 — UI: browsable sub-groups inside the single `uttrykk` route ✅ Done

**Status: implemented and confirmed working.** (Revised after initial
user testing — see note below.)

- `[level]/[category]/+page.server.ts` groups the full uttrykk deck by
  `theme` (a `groupByTheme()` helper) and supports an optional `?theme=`
  query param that pre-filters `entries` server-side before they ever reach
  `VocabFlashcardPage` — an invalid/unknown theme value is ignored and the
  full deck is returned, rather than erroring. A special `?theme=others`
  value (see Phase 3b) matches any theme under `UTTRYKK_OTHERS_THRESHOLD`
  (`$lib/vocab-helpers`'s `partitionUttrykkThemes()`), so the hub's Others
  pill filters correctly without needing its own real theme slug.
- **Revised: no chip row on `/{level}/uttrykk` itself.** The original
  version of this phase put a full chip picker ("All", one chip per theme)
  directly above `VocabFlashcardPage` on the flashcard page — but
  `/learn/[level]` (Phase 3b) already renders the same picker one click
  earlier, so showing it again here was pure duplication and, for levels
  with many small themes, pushed the actual flashcard down several
  screens (reported directly against `/a1/uttrykk`, which has 20 theme
  chips before Phase 3b's Others bucketing). Replaced with a single-line
  breadcrumb, shown only when `?theme=` is active: "Studying: **X** (n) ·
  Study all", using the same `themeLabel()` i18n-key-with-fallback pattern.
  Nothing is shown at all for the default (no filter) case.
- **`VocabFlashcardPage.svelte` was not touched at all** — it still just
  receives an `entries` array and builds a session from it, so all FSRS,
  due-card, and undo logic is exactly as before. This is what makes the
  per-theme pre-filter possible without a rewrite: the server does the
  filtering, the component doesn't know the difference between "all" and
  "one theme."
- Per-theme due-count display (the "nice-to-have" in the original plan
  below) was **not** built — `progressMap` lives client-side inside
  `VocabFlashcardPage`, out of reach of the breadcrumb in the parent
  `+page.svelte`, so this would need `progressMap` lifted up or duplicated.
  Left for later if wanted.
- Confirmed via direct testing across A1, B1, and B2: pill counts on
  `/learn/[level]` match the underlying data exactly (verified against B2's
  breakdown: 541 + 60 + 12 + 10 + 8 + 8 + 6 + 6 + 5 + 5 + Others(18) = 679),
  `?theme=others` correctly buckets everything under
  `UTTRYKK_OTHERS_THRESHOLD`, and no stray "All" pill remains. Not yet
  separately re-confirmed since the Phase 3/3b revision: `/{level}/uttrykk-preview`
  shows no breadcrumb, and `/c/*` pages are unaffected — low-risk, since
  neither code path changed in the revision, but worth a final glance.
  `pnpm check` for type-consistency across the four return branches in
  `+page.server.ts` also still worth running once.

In `[level]/[category]/+page.server.ts` / `+page.svelte` /
`VocabFlashcardPage.svelte`, when `category === 'uttrykk'`:

- Show a theme breakdown (e.g. a simple chip/accordion list — "Greetings (14)",
  "Idioms (52)", "Proverbs (23)"...) above or instead of jumping straight into
  a shuffled 20-card session.
- Let the learner pick "Study all" (today's behavior, unchanged) or "Study
  [theme]" — the latter just pre-filters `entries` by `theme` before calling
  `buildDeck()`; no new route, no new gating check, same Plus lock as today.
- Track/display per-theme completion or due-count if feasible reusing the
  existing `progressMap`/`countDueToday` machinery — nice-to-have, not
  required for v1.
- Keep the existing "Study all / shuffle 20" path as the default for anyone
  who doesn't interact with the grouping UI, so this is additive, not a
  breaking change to current behavior.

`uttrykk-preview` (the free 10-item teaser) is unaffected — it stays a flat
preview list; grouping only matters once someone is looking at the full deck.

## Phase 3b — `/learn/[level]` hub parity ✅ Done

**Status: implemented and confirmed working.** (Revised after initial
user testing — see note below.)

- `learn/[level]/+page.server.ts` adds `uttrykkThemeLoaders` (A1–B2 only) and
  groups that level's `uttrykk-{level}.json` by `theme`, returning
  `uttrykkThemes: { theme: string; count: number }[]` (empty for C, same
  reasoning as Phase 3).
- `learn/[level]/+page.svelte` Section 2b: the total-count line ("119 fixed
  expressions") is itself the link to the full, unfiltered `/{level}/uttrykk`
  deck — this is deliberately kept even though there's no separate "All"
  pill (see next point), because Plus users are always in FSRS due-mode, and
  their daily due cards are scattered across whatever themes have cards due
  — a themes-only entry point would force clicking through every pill to
  clear one day's reviews.
- **Revised: `UTTRYKK_OTHERS_THRESHOLD` bucketing, no "All" pill.** Initial
  user testing on `/a1/uttrykk` showed the theme chips (surfaced there via
  Phase 3, since reverted) ballooning to 20 pills, many at count 1–2, plus a
  redundant "All" pill alongside the count line above. `$lib/vocab-helpers`
  now exports `partitionUttrykkThemes()`: themes with `count ≥
UTTRYKK_OTHERS_THRESHOLD` (5) get their own pill; everything below that is
  summed into one `Others (n)` pill linking to `?theme=others`, a pseudo-slug
  the server-side filter in `[level]/[category]/+page.server.ts` recognizes
  (matches any theme under the same threshold — both sides import the same
  helper, so they can't drift apart). No separate "All" pill — the count
  line above already covers that.
- Confirmed unaffected: C still renders nothing for Section 2b
  (`uttrykkCategory` stays `undefined` for C, exactly as before).
- Confirmed via screenshot on `/learn/b2`: major/Others pill counts match
  the source data exactly (see the Phase 3 status note above for the
  worked total). Also confirmed on `/learn/a1` and `/learn/b1` during the
  same testing pass.

`/learn/[level]` (`src/routes/learn/[level]/+page.server.ts` +
`+page.svelte`) is a separate surface from Phase 3's flashcard route and
wasn't in this doc's original scope, but it has the same asymmetry problem
Phase 3 solves, one level up: Section 2 ("📖 Vocabulary") renders one pill
per category from `data.categories` (plain `CATEGORIES_BY_LEVEL[level]`
slugs, no counts), but Section 2b ("💬 Uttrykk") is a single hardcoded card
linking to `/{level}/uttrykk`, showing only `levelStats.uttrykk` (a total
count) — no theme breakdown, because the server load never reads `theme` at
all today.

1. **Server load** (`+page.server.ts`): once Phase 2 has tagged a level,
   import that level's `uttrykk-{level}.json`, group by `theme`, and pass a
   `uttrykkThemes: { theme: string; count: number }[]` array to the page —
   same shape of work Phase 5 does for `/stats`, just grouped by count
   instead of by progress. `uttrykk-preview.json` stays out of this (it's
   the free teaser, unaffected per Phase 3).
2. **Template** (`+page.svelte`, Section 2b): replace the single card with
   a pill list in the same visual style as Section 2's Vocabulary pills,
   one per theme (e.g. "Greetings (14)", "Idioms (52)", "Proverbs (23)"),
   each linking to `/{level}/uttrykk?theme={theme}` — the same query-param
   convention Phase 5 uses, so Phase 3's "Study [theme]" pre-filter picks it
   up on load. Use a `themeLabel()` helper mirroring the existing
   `categoryLabel()` (i18n key first, `removeHyphensAndCapitalize` fallback).
3. **Locked (free-user) state**: still an open call for whoever implements
   this — either keep today's single "🔒 Plus" card as-is when locked (don't
   spend UI real estate previewing a breakdown of content the user can't
   open), or show the theme pills unlocked-looking but route every tap to
   `/plus?ref=hub-uttrykk-theme`. Default to the former (matches how the
   Vocabulary section already just omits locked categories entirely, rather
   than teasing them) unless there's a reason to prefer the latter.
4. **C-level needs no change here.** `uttrykkCategory` (`data.categories.find(c
=> c.slug === 'uttrykk')`) is already `undefined` for C, since `'uttrykk'`
   was never in `CATEGORIES_BY_LEVEL.C` — so Section 2b silently doesn't
   render on `/learn/c` today, which is correct: Phase 4's read-time merge
   means C's uttrykk content already surfaces through Section 2's regular
   category pills (e.g. "Proverbs" already links to a page with both vocab
   and merged-in uttrykk entries). Nothing to build for C on this page.

Depends on Phase 2, same as Phase 5 — can ship level-by-level as each level's
theme tagging lands, and pairs naturally with Phase 5 since both consume the
same `theme` field.

## Phase 4 — Ship the unused C-level uttrykk entries ✅ Done

**Status: shipped.**

- Triage artifact: `ai-docs/implementation/uttrykk-c-category-triage.json` —
  `{ id, norsk, definition, proposed_category, confidence }` per entry,
  matched against `uttrykk-c.json` by `id`. Triaged 559/559 entries against
  the 37 `CATEGORIES_BY_LEVEL.C` slugs (confidence breakdown: 158 high, 341
  medium, 60 low).
- `scripts/apply-uttrykk-c-triage.mjs` validates the triage file (id match,
  valid category slugs, no duplicate ids) and writes the reviewed `category`
  directly onto each `uttrykk-c.json` entry, replacing the placeholder
  `category: "uttrykk"`. `part` stays `"phrase"`; `uttrykk-c.json` is
  otherwise unchanged — still 559 entries, still its own file.
- **The plan originally written below (fold entries into `vocab-c.json` with
  `part: "phrase"`) was tried, then reverted.** It briefly ran against the
  production data — `vocab-c.json` grew to 1288 entries — before being
  caught: it silently reclassified 559 idioms/proverbs as vocab lemmas,
  contradicting both `data-rules/vocab-and-uttrykk.md` (which says
  `phrase`-part entries with no single grammatical head belong in
  `uttrykk-xx.json`, not `vocab-xx.json`) and this doc's own Non-goals
  (“no change to the vocab/uttrykk classification rules”). Both files were
  restored from their pre-merge `.bak`s (`vocab-c.json.bak` → 729 entries,
  `uttrykk-c.json.bak` → 559 entries) before the triage script above was run
  against the restored `uttrykk-c.json`.
- **What shipped instead is the alternative floated in step 2 below: keep
  `uttrykk-c.json` separate, merge in at read time.**
  `src/routes/[level]/[category]/+page.server.ts` has a `uttrykkCLoader` for
  `uttrykk-c.json`. In the regular vocab-category branch, when
  `level === 'c'`, it also loads `uttrykk-c.json`, filters by the same
  `category`, and concatenates the two arrays — so `/c/proverbs`,
  `/c/interpersonal-conflict`, etc. show vocab and uttrykk entries side by
  side, with no new route and no `CATEGORIES_BY_LEVEL`/`PLUS_CATEGORIES`
  changes (gating is still automatic via `.slice(5)`).
- Knock-on fixes needed because the entries moved back out of
  `vocab-c.json`:
  - `scripts/check-uttrykk.mjs` hardcoded valid `category` values to
    `"uttrykk"`/`"uttrykk-preview"` for every level — now has a
    `C_CATEGORIES` set (mirrors `CATEGORIES_BY_LEVEL.C`) and validates
    C-level files against that instead.
  - `src/routes/quiz/+page.ts` had loaders for `uttrykk-a1` through
    `uttrykk-b2` but no `uttrykk-c` — added, so the quiz distractor pool
    and `?category=` filter include C idioms again.
  - `scripts/build-search-index.ts`'s `FILES` list was missing
    `uttrykk-c.json` entirely (true even before this phase) — added;
    `href` is built straight from `category`, so search results now link
    correctly to the merged `c/{category}` pages.
  - `scripts/generate-stats.mjs` needed no fix — it already counted
    `vocab-c.json` and `uttrykk-c.json` as two independent files and summed
    them, so `stats.json`'s C total (729 + 559 = 1288) was correct
    throughout. Its optional `--detail` per-category CLI breakdown still
    only tallies vocab-sourced categories, so it undercounts C categories
    that have uttrykk entries — cosmetic, left as-is.

Unlike A1–B2, C's 37 categories are already thematic and C has no separate
`uttrykk` gating concept (`PLUS_CATEGORIES` for C is generated from
`CATEGORIES_BY_LEVEL.C.slice(5)`, i.e. per-category, not per-content-type). So
for C, there's no `theme` field — each of the 559 `uttrykk-c.json` entries
carries a real C category slug directly (`proverbs`, `everyday-objects`,
`cultural-heritage`, etc.), the same vocabulary `vocab-c.json`'s own
`category` values use, but the entries stay in their own file rather than
merging into vocab's.

1. Triage pass: assign each `uttrykk-c.json` entry a `category` from
   `CATEGORIES_BY_LEVEL.C` (reuse the `bucket`/triage-artifact pattern from
   `c-uttrykk-addition.md`). — **done**, see Status above.
2. ~~Decide whether these become part of the existing per-category
   `vocab-c.json` loader (folded directly into that file) or stay in
   `uttrykk-c.json` with a new loader keyed by `c/{category}` merged at read
   time.~~ **Decided: stay separate, merge at read time** — folding into
   `vocab-c.json` looked simpler but turned out to violate the vocab/uttrykk
   classification rule; see Status above for what actually happened.
3. Wire it in: `uttrykkCLoader` + the `c/{category}` merge in
   `+page.server.ts` (see Status). No `CATEGORIES_BY_LEVEL.C` changes, no
   `PLUS_CATEGORIES` changes.
4. `stats.json` C counts needed no update — already correct (see Status).

## Phase 5 — Stats page (`/stats`) parity with vocabulary categories ✅ Done

**Status: implemented.**

- `CategoryBarChart.svelte`'s per-level row builder now special-cases
  `category === 'uttrykk'` (A1–B2 only — C never reaches this branch since
  `'uttrykk'` isn't in `CATEGORIES_BY_LEVEL.C`) and expands it into one row
  per theme present in that level's `uttrykk-{level}.json`, sorted by theme
  size — the same granularity every other category row already has. A
  level with no theme data yet falls back to the old single lumped row
  instead of rendering nothing.
- `totalForTheme(level, theme)` is the theme-aware sibling of
  `totalForCategory()`: filters `uttrykkByLevel[level]` by `.theme` instead
  of returning the whole deck length.
- **Progress-card matching**: `CardProgress` only ever stores
  `category: "uttrykk"`, never the theme (see Phase 1's rationale for why
  `category` is never repurposed), so resolving a seen card's theme needs
  the _map key_ the card is stored under (`vocab_id`, falling back to
  `norsk` — same rule as `vocabKey()` in `progress.ts`), not just the
  `CardProgress` object. `allCards` (a plain `CardProgress[]`) loses that
  key, so the component's props changed from `allCards: CardProgress[]` to
  `progressMap: Record<string, CardProgress>` (its only caller,
  `stats/+page.svelte`, already had the map in scope — a one-line prop
  swap). `themeLookupFor(level)` builds an `id|norsk → theme` map fresh
  from the already-imported `uttrykkByLevel[level]` data; each seen
  `uttrykk` card is bucketed by looking up its map key in that lookup. A
  card whose entry no longer resolves (e.g. deleted/renamed since it was
  studied) is bucketed under the catch-all `general` theme rather than
  silently dropped from the level's totals — a small deviation from the
  literal doc text below, added so a level's seen/total header count can
  never regress just from expanding the row.
  No changes to `CardProgress`, `saveProgress`, or the Supabase schema —
  this is a display-time join, exactly as planned.
- **Row link target**: each theme row links to
  `/{level}/uttrykk?theme={theme}`, which Phase 3's `?theme=` pre-filter
  already understands — no separate deep-linking follow-up needed since
  Phase 3 shipped first.
- `stats/+page.svelte` needed no changes beyond passing `progressMap`
  instead of `allCards` — the free-user upsell block is unaffected, it
  already gates the whole chart (uttrykk included) behind Plus.
- C-level confirmed unaffected: `'uttrykk'` never appears in
  `CATEGORIES_BY_LEVEL.C`, so C's rows keep coming from its real category
  slugs exactly as before, with no theme-lookup step.

`/stats` (Plus users, via `CategoryBarChart.svelte`) currently renders one
progress row per `CATEGORIES_BY_LEVEL[level]` entry — every vocab category
gets its own bar with a seen/total count, a review/learning/relearning
breakdown, and a due-count badge. `uttrykk` is the one exception: it's
rendered as a single lumped row (`totalForCategory()` special-cases
`category === 'uttrykk'` to return the whole deck's length, and progress
cards are grouped only by `c.category === 'uttrykk'`, with no visibility into
which themes are being studied). This doc doesn't currently mention `/stats`
at all. Once Phases 1–3 land, that gap gets worse: every other row on the
page is one topic, while `uttrykk` silently bundles 5–10+ themes into one
bar — the exact per-topic progress view the rest of the page exists to show.

Bring `/stats` up to the same granularity as the rest of the picker:

1. In `CategoryBarChart.svelte`, for levels A1–B2, keep every non-uttrykk
   category exactly as `CATEGORIES_BY_LEVEL` lists it, but expand the single
   `uttrykk` slug into one row per theme present in that level's
   `uttrykk-xx.json` file (using the `theme` vocabulary decided in Phase 1 —
   topical slugs reused from `CATEGORIES_BY_LEVEL`, the five functional
   fallbacks, and `general`). `uttrykk-preview` stays hidden exactly as it
   is today.
2. `totalForCategory()` needs a theme-aware variant: instead of returning the
   full deck length for `category === 'uttrykk'`, filter
   `uttrykkByLevel[level]` by `.theme === theme` to get a per-theme total.
3. Progress-card matching is the trickier part: `CardProgress.category` only
   ever stores `"uttrykk"`, never the theme, so today's
   `catCards = allCards.filter(c => c.level === level && c.category === category)`
   can't distinguish theme rows directly. Build an `id → theme` (falling back
   to `norsk → theme` for legacy pre-id entries, mirroring `vocabKey()` in
   `progress.ts`) lookup from the already-imported `uttrykkByLevel[level]`
   data, then for each seen card whose `category === 'uttrykk'`, resolve its
   theme through that lookup before bucketing it into the matching theme row.
   No changes needed to `CardProgress`, `saveProgress`, or the Supabase
   schema — this is a display-time join, not a data-model change.
4. Row link target: today every row links to `/{level}/{category}` (e.g.
   `/b2/uttrykk`). Theme rows should link to that same `/{level}/uttrykk`
   route — there's still only one gated route per Non-goals — ideally passing
   the theme as a query param (e.g. `/b2/uttrykk?theme=idioms`) so Phase 3's
   "Study [theme]" pre-filter can pick it up on load. If Phase 3 hasn't
   landed a URL-addressable theme filter yet, ship Phase 5 linking to the
   plain uttrykk route instead and wire up deep-linking once Phase 3 supports
   it.
5. `stats/+page.svelte` itself needs no changes beyond what already flows
   through `CategoryBarChart` — it just passes `allCards` down and delegates
   all category/theme layout to that component. The free-user upsell block
   (`stats_plus_category_heading`) is unaffected since it already gates the
   whole per-category chart, uttrykk included, behind Plus.
6. C-level needs no theme-lookup step here: Phase 4 keeps C's uttrykk
   entries in `uttrykk-c.json`, tagged with the exact same `category`
   values `vocab-c.json` uses, merged in at read time — so C rows on
   `/stats` already get natural per-category granularity (via
   `CardProgress.category`, which stores the real category for these
   entries rather than a generic `"uttrykk"` placeholder) for free. Phase 5
   is A1–B2 only, matching Phases 1–3's scope.

Depends on Phase 2 (themes must exist in the data first). Can ship with a
plain (non-deep-linked) row as soon as Phase 2 lands; deep-linking to a
pre-filtered theme session depends on Phase 3.

## Phase 6 — `/stats` restructuring: dedicated Vocabulary / Uttrykk / Grammar sections ✅ Done

**Status: implemented.**

Follow-up to Phase 5. Phase 5 gave Uttrykk per-theme rows, but only inside
the existing Plus-only "By Category" chart — at the top level, `/stats`
still only had a single blended "By Level" section (vocab and uttrykk cards
summed together into one set of bars) sitting next to a separate Grammar
section, with no free-standing Vocabulary or Uttrykk section of their own.
Decided in conversation before implementation (see chat log): mirror the
Grammar pattern for both content types — three parallel sections in
Vocabulary → Uttrykk → Grammar order (matching the `/learn/[level]` hub's
Section ordering), each with its own summary stats and its own by-level
breakdown; retire the blended "By Level" section entirely; move the uttrykk
theme breakdown out of the shared "By Category" chart into the new Uttrykk
section; keep both sections' detailed breakdowns Plus-only, matching today's
"By Category" gating.

- `stats/+page.svelte`: `allCards` is split into `vocabCards`
  (`category !== 'uttrykk'`) and `uttrykkCards` (`category === 'uttrykk'`).
  This split is exact, not approximate — C-level uttrykk entries carry their
  real category (Phase 4's read-time merge), never the `'uttrykk'` sentinel,
  so they fall out naturally on the vocab side. A shared `buildLevelStats()`
  helper (extracted from the old blended `levelStats` derivation) computes
  seen/learning/review/relearning/due per level for whichever card array and
  levels list it's given — `vocabLevelStats` covers all five levels
  (A1–C, linking to `/learn/{level}`), `uttrykkLevelStats` covers only
  A1–B2 (linking to `/{level}/uttrykk`), since C never carries
  `category: 'uttrykk'`.
- Old blended top-level summary cards (seen/due/review/relearning over
  `allCards`) and the old blended "By Level" section are both removed
  outright (the "drop them" option from the pre-implementation discussion,
  not the "cut down to a small line" alternative) — each new section's own
  summary cards replace them with an exact, correctly-scoped count. The
  top-level `totalSeen`/`byState`/`dueToday` derived values are kept as-is
  since they're still used for the CEFR estimate and the share-text builder,
  both of which intentionally stay blended.
- **Vocabulary section**: heading, 4 summary cards (vocab-only), a
  `stats_by_level`-labelled by-level breakdown (the same stacked-bar card
  markup the old blended section used, unchanged apart from the input
  array), then a Plus-only `stats_by_category`-labelled breakdown rendering
  `CategoryBarChart.svelte`.
- **Uttrykk section**: same shape — heading, 4 summary cards (uttrykk-only),
  a by-level breakdown over just A1–B2, then a Plus-only
  `stats_by_theme`-labelled breakdown rendering the new
  `UttrykkThemeChart.svelte`.
- **`CategoryBarChart.svelte`** ("By Category", inside the Vocabulary
  section): the `category === 'uttrykk'` theme-expansion branch added in
  Phase 5 is removed. The category list is now filtered to exclude both
  `'uttrykk'` and `'uttrykk-preview'` unconditionally, and the per-level
  `flatMap` collapses back to a plain `.map()` since there's no more
  branching. `uttrykkByLevel`/`totalForTheme()`/`themeLookupFor()` and the
  `uttrykkA1..B2` JSON imports are all deleted from this file — that logic
  didn't disappear, it moved wholesale into the new component below.
- **New `src/lib/components/UttrykkThemeChart.svelte`**: the extracted
  Phase-5 theme-expansion logic, now living on its own instead of as a
  branch inside `CategoryBarChart`. Same accordion-by-level visual pattern
  (mini progress pill, expand/collapse, legend), but iterating
  `UTTRYKK_THEME_LEVELS` (A1–B2 only, from `config.ts`) and theme rows
  directly instead of category rows. Takes the same `progressMap` prop (not
  a plain `CardProgress[]`) for the same reason Phase 5 documented: resolving
  a seen `uttrykk` card back to its theme needs the map's key
  (`vocab_id`/`norsk`), which a plain array loses. Own localStorage
  expand/collapse key (`stats-uttrykk-theme-expanded`) so it doesn't fight
  with `CategoryBarChart`'s (`stats-category-expanded`) now that they're
  separate accordions on the same page.
- New i18n messages (added to all five locale files — en, nb, es, uk, de):
  `stats_vocabulary_heading`, `stats_uttrykk_heading` (following the site's
  existing convention of keeping "Uttrykk" untranslated with a parenthetical
  gloss, e.g. `quiz_category_uttrykk`'s "Uttrykk (Phrases)"/"Uttrykk
  (Frases)"/etc.), `stats_by_theme`, `stats_plus_theme_heading`,
  `stats_plus_theme_body`. The existing `stats_by_level` key is reused as
  the shared sub-heading inside both new sections rather than retired, since
  its meaning ("broken down by CEFR level") still applies exactly; it's just
  no longer a page-level `h2` on its own. `stats_by_category`/
  `stats_plus_category_*`/`stats_plus_upgrade` are reused unchanged for the
  Vocabulary section's Plus-only breakdown, same as before this phase.
- **Pre-existing `C1`/`C` key mismatch found and fixed**:
  `CategoryBarChart.svelte`'s `vocabByLevel` map had always been keyed
  `{ A1, A2, B1, B2, C1 }` (note `C1`, not `C`), while the component's own
  `levels` array and every caller iterate CEFR level `'C'`. Since
  `totalForCategory('C', category)` did `vocabByLevel['C'] ?? []`, C-level
  rows in the "By Category" chart had always shown a `total` of 0
  (`seen/0`) regardless of actual `vocab-c.json` counts. This predated
  Phase 6 and was orthogonal to the Uttrykk restructuring, so it wasn't
  touched in the first pass — fixed as a follow-up by renaming the map key
  from `C1` to `C`.

## Phase 7 — C-level parity in the Uttrykk section ✅ Done

**Status: implemented.**

Follow-up to Phase 6. After Phase 6 shipped, a screenshot comparison showed
an inconsistency: the Vocabulary section's "By Category" chart has a C row,
but the Uttrykk section's per-level breakdown and "By Theme" chart didn't —
C was silently excluded from both, even though `uttrykk-c.json` exists and
Plus users with C-level uttrykk progress had nowhere to see it broken out.
Root cause: C's uttrykk entries never carry `category: 'uttrykk'` (Phase 4
merges them into the matching `c/{category}` vocab page's real category
instead), so the simple `category === 'uttrykk'` filter every other level's
split relies on simply can't see them.

Requested fix: make C consistent with A1–B2 in the Uttrykk section, using
the existing `uttrykk-c.json` file rather than reintroducing a `theme` field
or a new `category: 'uttrykk'` sentinel for C (both would repeat the mistake
Phase 4's Status section already documents reverting).

- **New `src/lib/uttrykk-c-stats.ts`**: a small shared module (imported by
  `stats/+page.svelte`, `CategoryBarChart.svelte`, and
  `UttrykkThemeChart.svelte`) built around a display-time join, the same
  pattern Phase 5 established for A1–B2 themes. `UTTRYKK_C_KEYS` is a
  `Set<string>` of every `uttrykk-c.json` entry's `id` (falling back to
  `norsk`) — the same stable key `vocabKey()` in `progress.ts` uses for the
  progress map. A studied C-level card is uttrykk-sourced if and only if its
  progress-map key is in this set; `uttrykkCCategoryCounts()` gives the
  per-category entry counts used as C's "theme" totals.
- **`stats/+page.svelte`**: `vocabCards`/`uttrykkCards` changed from a plain
  `allCards.filter(...)` to filtering `Object.entries(progressMap)` so the
  map key is available for the `UTTRYKK_C_KEYS.has(key)` check. A C-level
  card now routes to `uttrykkCards` if its key is in `UTTRYKK_C_KEYS`,
  otherwise to `vocabCards` — mutually exclusive, so nothing is double
  counted between the two sections. `uttrykkLevelStats` now uses the full
  `levels` list (A1–C) instead of a hardcoded A1–B2 `UTTRYKK_LEVELS` const,
  which is deleted. The per-level breakdown's C card links to `/learn/c`
  instead of `/{level}/uttrykk`, since C has no single "browse all uttrykk"
  route to link to — its content is spread across the regular `c/{category}`
  pages.
- **`CategoryBarChart.svelte`**: `allCards` now excludes C-level cards whose
  key is in `UTTRYKK_C_KEYS`, mirroring the split above, so the Vocabulary
  section's C row only counts vocab-c.json-sourced progress — keeping it in
  sync with `vocabCards` on the page and preventing double-counting against
  the new Uttrykk section's C row.
- **`UttrykkThemeChart.svelte`**: the A1–B2 loop (`UTTRYKK_THEME_LEVELS`,
  unchanged) is now joined by a separately-computed `cLevelGroup`
  (`$derived.by`), since C's row needs different logic, not just a fifth
  iteration of the same one: its "themes" are `uttrykkCCategoryCounts()`'s
  real category slugs rather than a `theme` field lookup, and each row links
  to `/c/{category}` (the actual merged vocab+uttrykk page) instead of
  `/{level}/uttrykk?theme=`. The component's local `UttrykkThemeLevel` type
  alias (`'A1'|'A2'|'B1'|'B2'`) is removed in favor of using `CEFRLevel`
  directly throughout (expand/collapse state, `toggle()`, `defaults`), since
  the accordion now genuinely spans all five levels.
- **Naming note**: C's category slugs are being used as its "theme" purely
  for stats-display purposes here. `UTTRYKK_THEME_LEVELS` in `config.ts` (the
  type backing the actual `theme` _data field_ written into
  `uttrykk-{a1,a2,b1,b2}.json` by the Phase 1/2 tagging pipeline) is
  deliberately left untouched and still excludes `'C'` — C never gets a real
  `theme` field, since Phase 1 already decided its topical categories serve
  that purpose. Only the stats UI's display logic was extended to treat
  "real C category" as C's theme-equivalent; the data model itself didn't
  change.

## Phase 8 — `/learn/[level]` hub: C's Uttrykk section + show-more everywhere ✅ Done

**Status: implemented.**

Follow-up to Phase 3b/7, prompted by two questions after comparing the A2
and C hub pages: (1) A2's hub has an Uttrykk section (Phase 3b); C's hub had
none, for the same root-cause reason Phase 7 fixed on `/stats` — C's
`uttrykk-c.json` entries carry a real vocab category, never
`category: 'uttrykk'`, so the hub's `uttrykkCategory` lookup (which finds a
category literally named `'uttrykk'` in `CATEGORIES_BY_LEVEL`) is always
`undefined` for C. (2) Vocabulary and Uttrykk's pill rows have no cap, unlike
Grammar and the blog list, and run long at B1/B2/C (30+ vocab categories,
up to 37 at C).

Decisions from the pre-implementation discussion: for C's Uttrykk section,
pills with per-category counts of just the phrase-sourced entries, each
linking to the _same_ `/c/{category}` page the Vocabulary pill for that
category already links to — the "two entry points, one page" option, over
either an unclickable summary card or skipping the section outright. For
show-more, extend the existing Grammar/blog collapse pattern to Vocabulary
and Uttrykk, on every level (A1–C), not just C.

- **`+page.server.ts`**: `uttrykkThemes` (previously computed only for
  A1–B2, from each level's `theme` field) now also has a C branch, built
  from `uttrykkCCategoryCounts()` (the same `uttrykk-c-stats.ts` module
  Phase 7 added for `/stats`) instead of a `theme` lookup — giving C the
  same `{ theme, count }[]` shape the template already expects, where
  `theme` is actually a real `CATEGORIES_BY_LEVEL.C` slug.
- **`+page.svelte`**: the Uttrykk section's guard becomes
  `uttrykkCategory || (levelUpper === 'C' && uttrykkThemes.length > 0)`, with
  a new third template branch (`{:else}`, alongside the existing
  locked-preview and A1–B2 branches) for C: a plain-text expressions count
  (no clickable summary card, since there's no single C uttrykk deck to
  study as a whole) followed by category-count pills. Each pill's lock state
  is looked up from `data.categories` by matching slug, so a Plus-gated C
  category (e.g. `neuroscience-cognition`) is skipped here exactly as it is
  in the Vocabulary section above, rather than leaking a free preview of
  gated content through the back door.
- **Show-more**: new `VOCAB_INITIAL` (12) and `UTTRYKK_INITIAL` (8)
  constants, `vocabExpanded`/`uttrykkExpanded` state, and matching
  `visibleVocabCategories`/`hiddenVocabCount` and
  `visibleUttrykkMajorThemes`/`hiddenUttrykkMajorCount` (A1–B2's theme pills)
  and `visibleUttrykkCThemes`/`hiddenUttrykkCCount` (C's category pills)
  derived slices — same shape as the pre-existing `GRAMMAR_INITIAL`/
  `visibleGrammarTopics`/`hiddenGrammarCount` trio. The Uttrykk section
  reuses one `uttrykkExpanded` flag for both its A1–B2 and C branches, since
  only one branch ever renders per level. Both new flags are added to the
  page's `Snapshot` alongside `grammarExpanded`/`blogExpanded` so expand
  state survives back/forward navigation the same way.
- Counts (12 pills / 8 pills) are a starting judgment call, not a measured
  UX decision — easy to retune later if a level's pill row still feels too
  long or collapses too eagerly.

## Phase 9 — Virtual `/c/uttrykk` deck (no data/category changes) ✅ Done

**Status: implemented, pending `pnpm check`/manual verification.**

Follow-up to Phase 4/7/8, prompted by comparing C to A1–B2's `/{level}/uttrykk`
route. C has no single "study all uttrykk" deck — Phase 4's read-time merge
puts each of the 559 `uttrykk-c.json` entries on its matching `c/{category}`
vocab page instead, so idioms/proverbs only ever show up mixed into a
topical deck, never as their own drillable set.

**Decided in conversation before implementation:** don't revert or touch
Phase 4's merge, don't add a `theme` field to C, don't reclassify any
`uttrykk-c.json` entry's `category` back to a generic `"uttrykk"` sentinel —
all three were considered and rejected as reintroducing the exact
data-integrity problem Phase 4's Status section already documents
reverting once (folding phrase-part entries into a vocab-shaped bucket).
Instead, add a **virtual, read-only filter route** that pulls every
`uttrykk-c.json` entry regardless of category, purely at the routing layer:

- `uttrykk-c.json` and `vocab-c.json` are both completely untouched — no
  `category` reassignment, no new field, no `CATEGORIES_BY_LEVEL.C` entry.
  The Phase 4 merge (idioms appearing inside `c/{category}` pages) keeps
  working exactly as it does today; this is additive, not a replacement.
- New route `src/routes/c/uttrykk/+page.server.ts` (+ `+page.svelte`, reusing
  `VocabFlashcardPage.svelte` the same way every other `[level]/[category]`
  route does) loads `uttrykk-c.json` wholesale (mirrors the existing
  `uttrykkCLoader` already used by the Phase 4 merge — same data source, new
  consumer) and passes the full 559-entry array in, no `category` filtering,
  no `?theme=` param (C's categories already function as the fine-grained
  browse dimension via the existing `c/{category}` pages — this route is
  deliberately flat, matching what "study all" means on A1–B2's
  `/{level}/uttrykk` before any theme filter is applied).
- Gating: same Plus lock as every other C category (`.slice(5)` free-preview
  pattern) — reuse whatever gating check the existing `c/{category}` route
  uses rather than inventing a new one, since this is the same content,
  just a different grouping.
- Progress: no changes needed anywhere. `CardProgress` keys off `vocab_id`/
  `norsk` (`vocabKey()` in `progress.ts`), not the route a card was studied
  from, so a card reviewed via `/c/uttrykk` and the same card reviewed via
  `/c/{category}` are one FSRS record, not two. `UTTRYKK_C_KEYS` (Phase 7's
  `uttrykk-c-stats.ts`) already recognizes every one of these ids, so
  `/stats`' vocab/uttrykk split keeps working with zero changes to that
  module.

### Two link-target updates (cosmetic, not structural)

Both existing routes originally routed around the fact that no C-wide uttrykk
deck existed:

1. **`learn/c` (`src/routes/learn/[level]/+page.svelte`, Section 2b):** done.
   The Phase 8 C-branch previously rendered a plain-text expressions count
   (no link, since there was nothing to link to). It's now a link to
   `/c/uttrykk`, matching how A1–B2's total-count line already links to
   `/{level}/uttrykk` (Phase 3b). The per-category pills underneath are
   unchanged — still linking to `/c/{category}` each, so both entry points
   coexist.
2. **`stats/+page.svelte`'s C per-level summary card:** turned out to be a
   non-issue on inspection — the `/learn/c` link Phase 7 originally
   documented for this card no longer exists in the codebase. The
   stats-page-improvement.md Phase 3 tabs rewrite (done earlier, separately
   from this doc) replaced the old per-level linked-card list with the
   current tab UI, and the active-level Uttrykk summary block is now a
   plain, unlinked div. Nothing to change here. The `uttrykkThemeStatsForLevel()`
   per-category row breakdown in `stats.ts` (rendered via `LevelStatRows`)
   still correctly links each C row to `/c/{category}` — also untouched,
   also correct as-is.

No other files in Phase 5/6/7's stats split need touching — `vocabCards`/
`uttrykkCards`, `UTTRYKK_C_KEYS`, and `uttrykkCCategoryCounts()` are all
keyed off card identity, not route, so they're already correct for cards
studied via the new route.

### Non-goal

**Not** parity with A1–B2's `?theme=` query-param filtering. A1–B2 needed
`?theme=` because their single `uttrykk` bucket has no other internal
structure; C's internal structure is its 37 real categories, already
browsable via the existing `c/{category}` pages, so `/c/uttrykk` only needs
to answer "give me all of them, unfiltered" — the same thing A1–B2's route
answers before any theme filter is applied.

## Rollout order

Phase 4 (C) had no dependency on Phases 1–3 and shipped first, as a pure
data-mapping/read-time-merge task with no new route. Phases 1–3 (A1–B2
theming + grouping UI) are the larger, sequential piece still to do, and
Phase 3b (`/learn/[level]` hub parity) and Phase 5 (`/stats` parity) both
depend on Phase 2's `theme` data and can ship level-by-level alongside each
other once it exists. Suggested order for the remaining work: Phases
1 → 2 → 3 for A1–B2, then Phase 3b and Phase 5 together once Phase 2's theme
data exists for a level (both can land right after Phase 2, ahead of or
alongside Phase 3, since neither depends on Phase 3's UI — though Phase 3b's
link target and Phase 5's deep-linking both get more useful once Phase 3's
"Study [theme]" pre-filter exists).
