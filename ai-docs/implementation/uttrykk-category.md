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

Separately, `uttrykk-c.json`'s 559 entries are sitting completely unused — no
`CATEGORIES_BY_LEVEL.C` entry, no `uttrykkLoaders` key, nothing in
`PLUS_CATEGORIES` for it. This doc also covers getting that content live.

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

## Phase 1 — Decide the tagging taxonomy

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
Phase 4 uses `part: "phrase"` to mark C-level uttrykk entries folded into
`vocab-c.json`. Overloading `part` to also carry a theme would conflate two
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

## Phase 2 — Tag pass

**Status:**

- **A1 (119 entries) — done.** `uttrykk-a1.json` has a reviewed `theme` on
  every entry (triage artifact:
  `ai-docs/implementation/uttrykk-theme-triage-a1.json`).
- **A2 (245 entries) — triage done, merge in progress.** Reviewed triage
  artifact is at `ai-docs/implementation/uttrykk-theme-triage-a2.json`
  (all entries resolved, zero low-confidence left unreviewed). The first
  merge attempt into `uttrykk-a2.json` was interrupted mid-write and left
  the file truncated/invalid; it's being rebuilt from
  `uttrykk-a2.json.bak` + the triage artifact via
  `scripts/merge-a2-theme.mjs` rather than patched in place.
- **B1, B2 — not started.**
- `VocabEntry.theme?: string` has been added to `types.ts` (step 4).
- `check-uttrykk.mjs` now errors on any full-file `uttrykk` entry missing
  `theme` (step 3b's validation requirement) — expect it to report errors
  for B1/B2 (and A2 until the rebuild above lands) until those levels are
  tagged.

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

## Phase 3 — UI: browsable sub-groups inside the single `uttrykk` route

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

## Phase 4 — Fold in the unused C-level uttrykk entries

**Status (in progress, resuming across sessions — see below):**

- Triage artifact: `ai-docs/implementation/uttrykk-c-category-triage.json`.
  Format per row: `{ id, norsk, definition, proposed_category, confidence }`,
  matched against `uttrykk-c.json` by `id`. `proposed_category` values are
  validated against the 37 `CATEGORIES_BY_LEVEL.C` slugs.
- **Triage complete: 559 / 559 entries** (`u-c-001` through `u-c-573`,
  accounting for gaps already absent from `uttrykk-c.json` — e.g.
  `u-c-088`, `u-c-102`, `u-c-106`, `u-c-113`, `u-c-115`, `u-c-118`,
  `u-c-120`, `u-c-123`, `u-c-137`, `u-c-140`, `u-c-152`, `u-c-157`,
  `u-c-158`, `u-c-182`, likely removed earlier as duplicates per
  `scripts/uttrykk_duplicate_report.txt`). Verified: zero duplicate ids,
  zero invalid category slugs, JSON parses cleanly. Classification of the
  final 69 entries (`u-c-505`–`u-c-573`) confirmed the triage file's ending
  is the true tail of `uttrykk-c.json` — `u-c-573` is the last entry in the
  source file.
- **Next step: write the merge script.** Triage is done; nothing left to
  classify. The remaining work in Phase 4 is entirely the merge step below.
- **No merge script exists yet for C.** `scripts/merge-uttrykk-theme.mjs`
  only handles `a1|a2|b1|b2` and writes a `theme` field into
  `uttrykk-{level}.json` — it does not apply to C, which instead needs its
  `proposed_category` folded into `vocab-c.json` as `category` (per step 2
  below, with `part: "phrase"`). A new script (e.g.
  `scripts/merge-uttrykk-c-category.mjs`) still needs to be written once
  triage is complete: read the triage file, cross-reference each
  `uttrykk-c.json` entry's full record (all language fields, `example`,
  etc.) by `id`, set `category` to the reviewed value and `part` to
  `"phrase"`, and append the results into `vocab-c.json` (append-only,
  matching step 2/3 below — don't touch existing `vocab-c.json` entries).
  This script does not exist yet — do not assume it does.
- **To resume:** triage is complete — no more classification needed. The
  next session should start directly on the merge script described below
  (`scripts/merge-uttrykk-c-category.mjs`): read the triage file, cross-
  reference each `uttrykk-c.json` entry's full record by `id`, set
  `category` to the reviewed value and `part` to `"phrase"`, and append the
  results into `vocab-c.json` (append-only — don't touch existing
  `vocab-c.json` entries). After running it, update `stats.json` C counts
  (step 4 below) and spot-check a handful of the `medium`-confidence rows
  before considering Phase 4 fully shipped.
- **Working process used during triage (kept here for reference):**
  classified and wrote in batches of ~20 entries, validating each batch
  (valid category slugs, no duplicate ids, JSON parses cleanly) before
  writing it to disk immediately — this kept the loss window small across
  the several sessions triage took to finish.

Unlike A1–B2, C's 37 categories are already thematic and C has no separate
`uttrykk` gating concept (`PLUS_CATEGORIES` for C is generated from
`CATEGORIES_BY_LEVEL.C.slice(5)`, i.e. per-category, not per-content-type). So
for C, don't add a `theme` field — instead map each of the 559
`uttrykk-c.json` entries directly onto an existing C category slug
(`proverbs`, `everyday-objects`, `cultural-heritage`, etc.), the same way
regular `vocab-c.json` entries are categorized.

1. Triage pass: assign each `uttrykk-c.json` entry a `category` from
   `CATEGORIES_BY_LEVEL.C` (reuse the `bucket`/triage-artifact pattern from
   `c-uttrykk-addition.md`).
2. Decide whether these become part of the existing per-category `vocab-c.json`
   loader (folded directly into that file, `part: "phrase"`) or stay in
   `uttrykk-c.json` with a new loader keyed by `c/{category}` that gets merged
   with the matching vocab category's entries at read time. Folding into
   `vocab-c.json` is simpler (one loader, no merge step) and is consistent
   with there being no C-level "uttrykk" concept — lean toward this unless a
   concrete reason to keep the files separate turns up during triage.
3. Wire it in: add the entries to `vocab-c.json` (or add the merge step), no
   `CATEGORIES_BY_LEVEL.C` changes needed since categories already exist, no
   `PLUS_CATEGORIES` changes needed (gating is automatic via the
   `.slice(5)` generation).
4. Update `stats.json` C counts once merged.

## Phase 5 — Stats page (`/stats`) parity with vocabulary categories

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
6. C-level needs no theme-lookup step here: Phase 4 folds C's uttrykk entries
   into `vocab-c.json` (or a per-category merge) using the exact same
   `category` values C already has, so C rows on `/stats` get natural
   per-category granularity for free. Phase 5 is A1–B2 only, matching Phases
   1–3's scope.

Depends on Phase 2 (themes must exist in the data first). Can ship with a
plain (non-deep-linked) row as soon as Phase 2 lands; deep-linking to a
pre-filtered theme session depends on Phase 3.

## Rollout order

Phase 4 (C) has no dependency on Phases 1–3 and can ship first or in parallel
— it's a pure data-mapping task with no new UI. Phases 1–3 (A1–B2 theming +
grouping UI) are the larger, sequential piece, and Phase 5 (`/stats` parity)
depends on Phase 2's data and benefits from Phase 3's UI for deep-linking.
Suggested order: Phase 4 first (unblocks unused content fastest), then Phases
1 → 2 → 3 for A1–B2, then Phase 5 once Phase 2's theme data exists (it can
land right after Phase 2, ahead of or alongside Phase 3, since it only reads
the `theme` field — full deep-linking waits on Phase 3).
