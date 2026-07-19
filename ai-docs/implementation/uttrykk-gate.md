# Gating Uttrykk by theme instead of a separate preview deck

## My take, up front

Yes — this is a good change, for three reasons:

1. **It fixes a real bug in the current model.** `uttrykk-{level}-preview.json`
   entries use their own `up-*` ids and `category: "uttrykk-preview"`, which
   are disjoint from the real `u-*` / `category: "uttrykk"` entries in
   `uttrykk-{level}.json` (confirmed on disk — e.g. `up-a1-001` vs
   `u-a1-001`, same Norwegian sentence, different id/category). Progress a
   free user racks up on the preview deck today is **silently discarded** if
   they upgrade to Plus — `saveProgress()` keyed it under the preview id,
   which never appears in the full deck. Gating by theme instead means free
   users are always studying real entries from the real file, so upgrading
   mid-theme carries FSRS progress forward with zero migration work.
2. **It makes Uttrykk consistent with how every other content type is
   gated.** Vocabulary categories, Grammar topics, C-level categories, and
   Quiz categories are all "some of the N units are free, the rest show a
   Plus lock" — Uttrykk is currently the one outlier with a completely
   separate flat 10-item teaser file instead of unlocking real sub-units.
   Theme is the natural sub-unit (Phase 1–3 of `uttrykk-category.md` already
   built the theme model this reuses).
3. **It's more honest as a sample.** A learner studying 2–3 full themes with
   real spaced repetition gets a much better sense of the product than a
   static 10-card flat list with no theme structure, no due-date logic, no
   "study by topic" browsing.

The one thing worth flagging before committing: **a naive "top-N themes by
raw count" rule breaks badly at B2**, where `idioms` alone is 541/679 = 80%
of the deck (see data below). Free-theme selection has to be a curated
allow-list per level, not a formula — see "Choosing the free themes" below.

## Current state

- `[level]/[category]/+page.server.ts` gates the entire `uttrykk` category
  Plus-only for A1/A2/B1/B2 (`PLUS_CATEGORIES` has `a1/uttrykk`,
  `a2/uttrykk`, `b1/uttrykk`, and `b2/uttrykk` individually listed).
- Free users are instead routed to `uttrykk-{level}-preview.json` — a flat,
  hand-picked 10-entry teaser per level, no theme breakdown, own ids
  (`up-*`), own `category` (`"uttrykk-preview"`).
- `/learn/[level]` Section 2b ("💬 Uttrykk") already renders a real theme
  breakdown (pills like "Greetings (36)", "Idioms (27)") for **Plus users
  only** — when `uttrykkCategory.locked` is true, the whole section
  collapses to a single locked card linking to `/{level}/uttrykk-preview`
  instead of showing any theme pills at all.
- C has no `theme` field and no separate `uttrykk` gate — its uttrykk
  entries carry a real `CATEGORIES_BY_LEVEL.C` category slug and are merged
  into the matching `/c/{category}` vocab page at read time (Phase 4/7/8 of
  `uttrykk-category.md`). Gating is already per-category there: first 5 of
  37 C categories are free (`PLUS_CATEGORIES` = `CATEGORIES_BY_LEVEL.C.slice(5)`),
  same as any other C content. **C already does roughly what this doc asks
  for** — it just doesn't show a lock icon per pill (see below).

## What changes

Replace the "one flat preview file, whole deck locked" model with:
**for each level, 2–3 curated themes are fully free (real entries, real
FSRS); every other theme pill is visible but shows a lock icon and links to
`/plus`.** This applies to A1, A2, B1, B2 (the levels with a real `theme`
field) and, for consistency of _presentation_ only, C's per-category pills
in the same hub section (no gating-logic change needed there — see Phase 4).

### Choosing the free themes

Pulled directly from the tagged data on disk (`theme` counts per level, all
four Phase-2-complete files):

| Level | Deck size | Largest themes (excl. `general`)                                                |
| ----- | --------- | ------------------------------------------------------------------------------- |
| A1    | 119       | greetings 36 (30%), classroom 11, time-expressions 9, opinion-formulas 8        |
| A2    | 278       | idioms 27, opinion-formulas 24, time-expressions 20, directions 19              |
| B1    | 221       | discourse-markers 13, opinion-formulas 13, personal-growth 13, relationships 12 |
| B2    | 679       | **idioms 541 (80%)**, discourse-markers 60, work-career 12, opinion-formulas 10 |

Two disqualifying rules, both visible in this table:

- **Never free: `general`.** It's the catch-all bucket for entries that
  didn't cleanly fit any topic (Phase 1's own definition) — often one of
  the _largest_ buckets (55/278 at A2, 60/221 at B1), but the worst possible
  first impression of the product, since it's not actually "a theme."
- **Never free if it would dominate the deck: B2's `idioms`.** At 80% of
  the deck, treating it as a normal "big theme, pick it first" candidate
  would give away nearly the whole B2 deck for free — the opposite of what
  this change is for. This is exactly why free-theme selection can't be a
  pure `sort by count, take top N` formula applied uniformly across levels;
  it needs a per-level judgment call, same as `UTTRYKK_OTHERS_THRESHOLD` and
  `VOCAB_INITIAL`/`UTTRYKK_INITIAL` were already judgment calls in
  `uttrykk-category.md`.

Recommended starting allow-list (target: roughly in line with each level's
existing _vocabulary_ free ratio, so Uttrykk doesn't feel oddly more or less
generous than the rest of that level — A1/A2 vocab is 100% free today, B1 is
~27% free, B2 is ~9% free):

| Level | Free themes                                                | Free entries | % of deck |
| ----- | ---------------------------------------------------------- | ------------ | --------- |
| A1    | `greetings`, `time-expressions`                            | 45 / 119     | 38%       |
| A2    | `idioms`, `opinion-formulas`                               | 51 / 278     | 18%       |
| B1    | `discourse-markers`, `opinion-formulas`, `personal-growth` | 39 / 221     | 18%       |
| B2    | `discourse-markers`, `work-career`                         | 72 / 679     | 11%       |

These are a starting judgment call, not a measured UX decision — same
caveat Phase 8 of `uttrykk-category.md` used for its pill-count constants.
Easy to retune later. `greetings` is deliberately kept for A1 despite being
30% of that deck on its own, because A1's vocab tier is already 100% free —
an A1 free user who can already study every vocab category for free but
hits a hard Plus wall on "hello/goodbye" phrases would be a confusing,
inconsistent experience.

### Config shape

New module, `src/lib/uttrykk-gating.ts` (mirrors the existing
`src/lib/uttrykk-c-stats.ts` pattern — a small dedicated module rather than
growing `config.ts`, since `config.ts`'s own header comment says it's "pure
constants... no runtime logic," and this is a hand-curated allow-list, not a
derived constant):

```ts
import type { UttrykkThemeLevel } from '$lib/config';

export const FREE_UTTRYKK_THEMES: Record<UttrykkThemeLevel, readonly string[]> = {
  A1: ['greetings', 'time-expressions'],
  A2: ['idioms', 'opinion-formulas'],
  B1: ['discourse-markers', 'opinion-formulas', 'personal-growth'],
  B2: ['discourse-markers', 'work-career']
};

export function isFreeUttrykkTheme(level: UttrykkThemeLevel, theme: string): boolean {
  return FREE_UTTRYKK_THEMES[level].includes(theme);
}
```

A unit test (or a one-off validation script, same spirit as
`check-uttrykk.mjs`) should assert every entry in `FREE_UTTRYKK_THEMES` is a
real member of `UTTRYKK_THEMES_BY_LEVEL[level]` from `config.ts`, so a typo'd
theme slug fails loudly instead of silently granting zero free themes.

## Non-goals

- **No change to C's gating model.** C's per-category free/Plus split
  (first 5 of 37) already does what this doc asks for; Phase 4 below is
  presentation-only (lock icons on the pills that are already hidden today).
- **No change to Quiz gating.** `FREE_QUIZ_CATEGORIES` has no uttrykk
  entries today and quiz's uttrykk pool stays fully Plus-gated as a single
  unit — theme-level granularity in the quiz picker is a bigger UI change
  (a `?theme=` filter doesn't exist there) and isn't needed to ship this.
- **No change to `/stats`' "By Theme" breakdown.** `UttrykkThemeChart.svelte`
  stays Plus-only, same as `CategoryBarChart.svelte`'s "By Category" chart
  already is for free users even though some vocab categories are free to
  _study_. Detailed cross-theme/cross-category progress analytics stays a
  Plus perk; being able to review 2–3 free themes' due cards inside the
  flashcard flow itself is unaffected by this.
- **No `PLUS_CATEGORIES`/`CATEGORIES_BY_LEVEL` schema change.** `uttrykk`
  stays exactly one category/one route per level — this doc changes what
  happens _inside_ that route for a free user, not the category model
  itself (same Non-goal `uttrykk-category.md` already established, just
  reconfirmed here since this doc is the one changing the gating logic that
  Non-goal originally protected).

## Phase 1 — Gating logic in `[level]/[category]/+page.server.ts`

- Remove `a1/uttrykk`, `a2/uttrykk`, `b1/uttrykk`, `b2/uttrykk` from
  `PLUS_CATEGORIES` in `config.ts` — the blanket "redirect free users who
  hit a Plus-only category" check at the top of `load()` no longer applies
  to `uttrykk`; gating moves to theme granularity below.
- In the existing `uttrykkLoader` branch, after `groupByTheme()` resolves
  `selectedTheme`:
  - Free user, `selectedTheme` is a free theme for this level
    (`isFreeUttrykkTheme`) → proceed exactly as today, `entries` already
    correctly filtered to just that theme by `groupByTheme()`.
  - Free user, `selectedTheme` is `null` (no `?theme=` — "study all"),
    `UTTRYKK_OTHERS_THEME`, or any locked theme → `redirect(302,
'/plus?ref=uttrykk-theme-lock')`, mirroring the existing category-lock
    redirect pattern one line above it.
  - Plus user → unchanged, full deck or any theme, exactly as today.
- `themes` returned to the client should still be the **full** theme list
  (all themes, all counts) even for a free user's filtered response — the
  breadcrumb/label code in `+page.svelte` already expects to look up
  `data.themes.find(t => t.theme === data.selectedTheme)` for the count.

## Phase 2 — `/learn/[level]` hub: lock icons per theme pill

Section 2b's `{:else if uttrykkCategory}` branch (A1–B2) changes from
today's binary "whole section is one locked card, or whole section shows
every theme pill unlocked" to per-pill locking, same visual language
Section 3 (Grammar) already uses for its locked topic cards (dimmed
title/description + a small `🔒 Plus` badge in the corner) rather than
Section 2's pattern of just omitting locked items and showing one aggregate
badge — a per-pill lock reads better here because there are only 5–10 major
pills, not 20–30 like Vocabulary's category list.

- The section's outer `locked` branch (today: redirect straight to
  `/{level}/uttrykk-preview`) goes away — the section always renders its
  normal pill layout now, never collapses to a single teaser card.
- The "N fixed expressions" summary card at the top (today's "study
  everything" entry point) stays linking to `/{level}/uttrykk` for both
  free and Plus users — a free user landing there with no theme picked hits
  Phase 1's redirect to `/plus?ref=uttrykk-theme-lock`, which is the correct
  outcome (studying the _whole_ deck is still a Plus feature; only specific
  themes are free).
- Each theme pill (`visibleUttrykkMajorThemes`, plus the `Others` pill):
  - `isFreeUttrykkTheme(level, t.theme)` true, or user is Plus → unchanged,
    links to `/{level}/uttrykk?theme={t.theme}`.
  - Otherwise → same pill shape, dimmed, small `🔒` suffix, links to
    `/plus?ref=hub-uttrykk-theme` instead of the study URL. The `Others`
    pill is always in this locked state for free users (its constituent
    themes are all minor by definition, none are in any level's
    `FREE_UTTRYKK_THEMES`).
- `hiddenUttrykkMajorCount`/show-more behavior is unchanged — locked pills
  still count toward the same slice, same as Grammar's locked cards already
  count toward `hiddenGrammarCount` today.

## Phase 3 — Retire the old preview route

- `/{level}/uttrykk-preview` becomes a `redirect(301, '/{level}/uttrykk')`
  in `+page.server.ts` (both for free and Plus users — Plus already
  silently redirected internally to the full deck when hitting this URL, so
  this just makes that explicit and applies it to free users too).
- `uttrykkPreviewLoaders` and the `uttrykk-preview` branch in
  `[level]/[category]/+page.server.ts` are deleted once the redirect ships.
- `CATEGORIES_BY_LEVEL`'s `'uttrykk-preview'` entries (A1–B2) and every
  place that special-cases the string `'uttrykk-preview'` (prev/next nav's
  `visibleCats` filter, `/learn/[level]`'s `visibleCategories` filter) get
  cleaned up in the same pass — it's no longer a real category, just a
  legacy redirect target.
- **Leave the data files on disk** (`uttrykk-{level}-preview.json`) for now
  rather than deleting them — no code path needs them after this phase, but
  there's no urgency to remove them and it keeps this phase low-risk /
  easily reversible. Actual deletion can be a trivial follow-up once the
  redirect has been live for a while.

## Phase 4 — C: aggregate badge for presentation parity (✅ shipped)

**Status: implemented.** Decided against per-pill locking for C, in favor
of matching Vocabulary's existing `+N with Plus` aggregate-badge pattern —
see "Per-pill vs. aggregate badge" below for why C and A1–B2 deliberately
end up with _different_ presentations rather than a single pattern applied
uniformly.

**Verified the free ratio actually holds up, not just asserted it.** C's 5
free categories (`philosophy`, `academic`, `formal-writing`, `rhetoric`,
`complex-emotions`) contain, respectively, 0 / 5 / 9 / 23 / 33 of
`uttrykk-c.json`'s 559 entries — **70 total, 12.5% of the deck**. That lines
up well with the A1–B2 allow-list proposed above (11–38%, with B2 at 11%
being the closest comparison point) — C's existing per-category gating
already produces a comparable free slice of uttrykk content, it's just
measured in categories rather than themes. No change to the 5-free-category
split is needed; `philosophy` having zero uttrykk entries is a data gap, not
a bug — that pill just won't appear in the Uttrykk section (it still works
normally on the Vocabulary side).

Of the 32 C categories that carry any uttrykk content, only 4 are free
(`complex-emotions`, `rhetoric`, `formal-writing`, `academic`), leaving 28
locked. `/learn/[level]/+page.svelte`'s C branch now renders only the
unlocked pills (same `{#if !catLocked}` guard as before) followed by a
`+28 with Plus` badge — the same `lockedCount >= 3` / `quiz_plus_only_count`
pattern the Vocabulary section already uses one section up, just recomputed
over `data.uttrykkThemes` instead of `data.categories` (`?ref=hub-uttrykk-badge`
rather than `?ref=hub-vocab-badge`).

### Per-pill vs. aggregate badge — why C and A1–B2 differ

The original version of this phase (written before Phase 4 shipped)
proposed the _same_ per-pill dimmed-+-🔒 treatment Phase 2 uses for A1–B2.
After seeing C's section rendered live, switched to the aggregate-badge
pattern instead, and confirmed the reasoning holds for keeping Phase 2
different:

- **C: 32 candidate pills, 28 locked.** That's the same order of magnitude
  as Vocabulary's own category list (which already uses the aggregate
  pattern for the same reason) — individually rendering 28 dimmed, locked
  pills right below Vocabulary's own `+32 with Plus` badge would be visual
  clutter and would read as inconsistent with the section directly above it
  on the same page.
- **A1–B2: ~5–9 major theme pills total, 2–3 free.** Small enough that
  every pill is individually readable at a glance — closer in scale to
  Grammar's ~10–20 topic cards, which already show locked items individually
  (dimmed title/description + `🔒 Plus` badge) rather than collapsing them.
  At that size, showing the real theme name (`Idioms 🔒`, `Proverbs 🔒`) is
  more useful than a vague count, since the name itself is part of what
  makes someone curious enough to tap `/plus` — the same reason Grammar
  shows real topic titles on its locked cards instead of hiding them behind
  a badge.

So the rule of thumb going forward: aggregate + hide once a list is
large (~15–20+ items) — Vocabulary, C's Uttrykk-via-category. Per-item lock
when the list is short enough to read at a glance — Grammar, A1–B2's major
theme pills. This isn't full visual consistency across the page, but it's
the same line the page already draws between Vocabulary and Grammar today;
Uttrykk's two presentations just each follow the side of that line their
own pill count puts them on. Phase 2 (below) is unchanged by this — it still
ships the per-pill lock treatment for A1–B2.

## Rollout order

Phase 1 (gating logic) must ship before Phase 2 (UI) goes live, or free
users would see unlocked-looking pills for themes the server still
blanket-rejects. Phase 3 (retiring the preview route) depends on Phase 1 +
2 being live and confirmed working, since it removes the fallback free
users are on today. Phase 4 (C pill parity) is independent of the other
three and can ship whenever — it's a pure display change with no gating
logic behind it.

## Open questions

1. **Final free-theme allow-list.** The table above is a reasoned starting
   point (matched to each level's existing vocab free ratio, avoiding
   `general` and B2's oversized `idioms`), not a final decision — worth a
   gut check against actual themes a beginner most wants to try before
   upgrading.
2. **`?ref=` tracking values.** Reused `hub-uttrykk-theme` and
   `uttrykk-theme-lock` above by analogy with the existing
   `hub-vocab-badge` / `category-lock` / `hub-grammar` convention — confirm
   these are the values you want showing up in Plus-page analytics.
3. **Should `Others` ever be partially free?** Right now `Others` is always
   locked for free users (Phase 1). An alternative: let a free user's
   _individual_ minor themes resolve as free if a future edit to
   `FREE_UTTRYKK_THEMES` includes one — today's recommended allow-list only
   contains major themes, so this doesn't come up yet, but the code should
   probably not assume "minor ⇒ locked" as a hard rule if that changes.
