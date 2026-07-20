# Restructuring `/stats` around CEFR level

## Background

`/stats` (`src/routes/stats/+page.svelte`) currently organizes progress by
**content type first, level second**:

- Vocabulary section → its own A1–C accordion (`CategoryBarChart.svelte`) →
  category rows.
- Uttrykk section → its own, separate A1–C accordion
  (`UttrykkThemeChart.svelte`) → theme rows.
- Grammar section → a single flat accordion listing every `GRAMMAR_RULES`
  topic the user has touched, **not grouped by level at all**.

This produces three different organizing principles stacked on one page, two
redundant level accordions (Vocab's and Uttrykk's), and a Grammar list that
only grows over time — C alone already defines ~25 topics in
`src/lib/grammar/rules.ts` — with no level structure to keep it navigable.

Grouping is technically straightforward for all three content types because
every `CardProgress` row (vocab, uttrykk, and grammar alike) already carries a
`level: CEFRLevel` field — for grammar this comes from the practiced
question's `cefr` (see `GrammarQuestion.cefr` in `types.ts`). Grammar rows
just aren't grouped by it today.

## Goal

Make **CEFR level** the primary axis of the page, with Vocabulary / Uttrykk /
Grammar as sub-sections inside each level, instead of the reverse. Concretely:

- One set of level tabs (A1 · A2 · B1 · B2 · C), not per-type accordions.
- A combined summary strip above the tabs so the "big picture" (total seen,
  due today, streak, CEFR estimate) doesn't require picking a level first.
- Inside a level, three compact row-lists (📖 Vocab categories, 💬 Uttrykk
  themes, 📐 Grammar topics) — no further nested accordion, since one level's
  data is already short enough to show flat.
- Grammar topics that span levels (e.g. `relative-som` covers questions tagged
  both B2 and C) simply appear under each level their individual questions are
  tagged with — this falls out of the existing per-card `level` field, not a
  special case. Each `GrammarQuestion` has exactly one `cefr`; there is no
  multi-level tag to reconcile.

## Non-goals

- **No change to the underlying progress/FSRS data model.** `CardProgress`,
  `loadProgressMap`/`loadGrammarProgressMap`, and the Supabase sync paths are
  unchanged — this is a display/aggregation restructuring only.
- **No change to Plus gating.** Category breakdown (vocab) and theme
  breakdown (uttrykk) stay Plus-only, same as today; grammar topic detail
  gating (`plusOnly` on `GrammarQuestion`) is unaffected.
- **No change to the CEFR estimate algorithm** (`getCefrEstimate`) or the
  share-text feature — both move as-is into the new layout.
- **`GrammarQuestion.levels` removed as dead code.** It was documented as an
  optional multi-level tag but never populated in `grammar.json`. Two real
  readers existed — `questionLevels()` in `vocab-helpers.ts` and an inline
  copy of the same fallback in `routes/learn/[level]/+page.server.ts` (missed
  in the initial pass, caught by `pnpm check`) — both always fell through to
  `[q.cefr]` in practice since `levels` was never set. Both are now simplified
  to use `q.cefr` directly. `topicLevels()` (used by `/grammar`'s level pills,
  per the screenshot showing 5 pills at 339px) is unaffected — it already
  aggregates over `questionLevels()`.
- **Not a rewrite of `CategoryBarChart.svelte` / `UttrykkThemeChart.svelte`
  internals** — their per-item stat-building logic (seen/review/learning/
  relearning/due per row) is reused, just re-scoped to one level at a time
  instead of iterating all five levels internally.

## Proposed structure

```
┌─────────────────────────────────────────────┐
│ CEFR estimate banner (unchanged)             │
│ Activity chart (unchanged)                   │
│ Summary strip: Vocab seen · Uttrykk seen ·   │
│   Grammar practiced · Due today · Streak     │
├─────────────────────────────────────────────┤
│ [ A1 ] [ A2 ] [ B1 ] [ B2 ] [ C ]  ← tabs     │
│   (default: user's current cefrEstimate      │
│    level, falling back to A1)                │
├─────────────────────────────────────────────┤
│ 📖 Vocabulary — category rows (this level)   │
│ 💬 Uttrykk — theme rows (this level)         │
│ 📐 Grammar — topic rows (this level)         │
└─────────────────────────────────────────────┘
```

Each of the three blocks inside a level tab keeps its existing per-row visual
(stacked progress bar, seen/total, due badge) — only the grouping/entry point
changes, from "accordion per level, nested inside a content-type section" to
"flat row list, nested inside a content-type block, inside one level tab."

## Phase 1 — Data layer: per-level, per-type stat builders ✅ done

Implemented in `src/lib/stats.ts` (new file), with `src/lib/stats.test.ts`
covering all three:

- `vocabCategoryStatsForLevel(level, progressMap)` — reuses
  `CategoryBarChart`'s `buildStat`/`totalForCategory` logic, scoped to one
  level; excludes `'uttrykk'` and (for C) any card matching `UTTRYKK_C_KEYS`.
- `uttrykkThemeStatsForLevel(level, progressMap)` — reuses
  `UttrykkThemeChart`'s theme-lookup logic for A1–B2, and the C-level
  key-based category split (`uttrykkCCategoryCounts`) for C.
- `grammarTopicStatsForLevel(level, grammarMap, isNb)` — **new**: groups
  `GRAMMAR_RULES` by whether they have any `grammar.json` question at this
  level (precomputed once as `grammarTotalsByLevel`), so a topic with zero
  questions at a level (e.g. a C-only topic) never appears under another
  level's tab. C topics force the Norwegian title, matching the existing
  `forceNb` rule in `routes/grammar/[topic]/+page.svelte`.

All three return the same `StatRow` shape (`key, label, href, total, seen,
review, learning, relearning, due`) with `label` already display-formatted
(`removeHyphensAndCapitalize` applied for vocab/uttrykk; grammar titles are
already display text) — ready for Phase 2's shared component to render
identically regardless of content type.

**Verified against real `pnpm check` + `pnpm vitest run stats` output** (not
just assumed): this caught three real issues, now fixed —

1. `stats.test.ts` cast `row.key` against the wrong type for the `Set.has()`
   check (`GrammarTopic`, not `keyof typeof GRAMMAR_RULES`).
2. The `learn/[level]/+page.server.ts` grammar-topics-per-level query, which
   also read the now-removed `q.levels` (a second call site missed in the
   dead-code pass above) — switched to `q.cefr === levelUpper` directly.
3. `grammar/session.test.ts` had two `questionLevels`/`topicLevels` tests
   that exercised the removed multi-level tag — updated to single-`cefr`
   fixtures. Also surfaced that grammar.json has zero A1-level questions
   today (grammar content starts at A2), so `stats.test.ts`'s "has real data"
   checks now use A2, with a separate test asserting A1 is genuinely empty.

Please re-run `pnpm check` and `pnpm vitest run stats` (and `pnpm vitest run
grammar/session` for the session.test.ts changes) to confirm before Phase 2 —
I still don't have shell access here, so this is based on reasoning through
your pasted output, not a fresh run on my end.

Keep the top-level totals (`vocabSeen`, `uttrykkSeen`, `grammarSeen`,
`grammarDue`, etc.) exactly as-is for the summary strip — no change to those
derivations; they still come from `+page.svelte`'s existing `$derived`s.

## Phase 2 — Extract shared row-list component ✅ done

Implemented in `src/lib/components/LevelStatRows.svelte` (new file). Takes
`rows: StatRow[]` (from `stats.ts`, Phase 1), a `levelColor` bg class for the
"review" bar segment (replaces the old per-row `levelColors[lg.level]` lookup
since this component only ever renders one level at a time), and an optional
`emptyMessage` for a level/type combo with zero rows (e.g. Grammar under A1 —
see Phase 1's finding that grammar content starts at A2).

Markup is copied from `CategoryBarChart.svelte`'s inner (`isOpen`) content —
row label, stacked progress bar (review/learning/relearning), seen/total,
due badge, legend — just without the accordion header/button/level-loop,
since the level tab (Phase 3) is now the only toggle. Visually identical
output to today's expanded category/theme rows, for any of the three content
types.

**Not yet wired into `/stats/+page.svelte`** — that's Phase 3, so
`CategoryBarChart.svelte` and `UttrykkThemeChart.svelte` still render the
page today. Also not yet run through `pnpm check` — please run it (and eyeball
the component, e.g. via a throwaway `{#each}` in a test route) before Phase 3
starts wiring it in, since a `.svelte` file's template errors don't always
surface the same way a `.ts` file's do.

## Phase 3 — Rebuild `/stats/+page.svelte` layout ✅ done

Rewrote `src/routes/stats/+page.svelte`. What changed vs. the plan as
written:

- **Summary strip**: 4 cards — Vocab seen, Uttrykk seen, Grammar practiced,
  combined Due today (`vocabDue + uttrykkDue + grammarDue`). Streak isn't
  repeated here since `ActivityChart` already shows it.
- **Level tabs**: inline `$state<CEFRLevel>('A1')` (no separate
  `LevelTabs.svelte` — didn't feel like it earned its own file for one
  `{#each}` over 5 buttons), equal-width `flex-1` row, active tab filled with
  that level's existing color (`levelColors[lvl]`), `role="tablist"`/`"tab"`/
  `aria-selected` for accessibility. Defaults to the level parsed out of
  `cefrEstimate` via the same regex `buildShareText` already used, falling
  back to A1; persisted to `localStorage` under `stats-active-level` and
  restored on mount.
- **Three blocks per active level**:
  - **Vocabulary**: free-tier summary card (seen/due/stacked bar — the same
    markup the old 5-card grid used, just for one level) always shows;
    `LevelStatRows` with `vocabCategoryStatsForLevel(activeLevel, progressMap)`
    below it, Plus-gated exactly as before (same upsell box for free users).
  - **Uttrykk**: identical shape, using `uttrykkThemeStatsForLevel` and the
    existing Uttrykk Plus-upsell copy.
  - **Grammar**: **not** Plus-gated (matches the original page — the old
    Grammar accordion had no `isPlus` check, only individual questions carry
    `plusOnly`). Only rendered when `grammarTopicStatsForLevel(activeLevel,
…).length > 0` — i.e. hidden entirely for a level with zero grammar
    topics (today, only A1 — see Phase 1) rather than shown with an empty-state
    message. This is a deliberate deviation from the plan's "preserve
    empty-state handling" bullet: that guidance was about a level having
    topics with no progress yet (which `LevelStatRows` already handles fine,
    each row just reads 0/total), not about a level having no topics to begin
    with. Showing a heading with nothing under it for A1 seemed worse than
    not showing the heading; **flag if you'd rather see an explicit "no
    grammar at this level yet" message instead**.
- **Removed, now dead code in the old file**: `grammarByTopic` derived,
  `GrammarTopicStat` interface, `grammarExpanded` state, `toggleGrammar()`,
  the `stats-grammar-expanded` localStorage key, and the `vocabByState`/
  `uttrykkByState`/`computeByState`/page-wide `grammarMastered` derived
  values (the old 4-stat-card grids per content type no longer exist, so
  their `review`/`learning`/`relearning` breakdown wasn't referenced by
  anything and would have failed `pnpm check` as unused).

**`CategoryBarChart.svelte` and `UttrykkThemeChart.svelte` are now orphaned**
— `/stats/+page.svelte` no longer imports either, so their internal
accordion state (`stats-category-expanded`, `stats-uttrykk-theme-expanded`
localStorage keys) is dead too. I didn't delete the files: I don't have a
working way to grep the codebase for other importers from here (the
Filesystem search tool returned no results even for filenames I know exist,
so I'm not trusting it), and deleting a component that turns out to be used
elsewhere would be a worse mistake than leaving two unused files around
short-term. **Can you confirm nothing else imports them (e.g. `grep -rn
"CategoryBarChart\|UttrykkThemeChart" src/`) so I can delete both in Phase
4?**

**Not yet run**: please run `pnpm check`, `pnpm vitest run stats`, and
eyeball the page in a browser (Free and Plus, a few different levels,
including one with existing progress) — a page-level rewrite this size is
exactly the kind of change where a template typo or a wrong prop name won't
necessarily show up as a type error.

## Phase 4 — Verify against existing behavior

- Confirm C-level uttrykk (`UTTRYKK_C_KEYS` split) still renders correctly
  under the C tab's Uttrykk block, linking to `/c/{category}` as it does today
  (no dedicated `/c/uttrykk` route — unchanged).
- Confirm the reset flow, share flow, and activity chart are unaffected
  (they read from `progressMap`/`grammarMap` directly, not from the
  restructured per-level views).
- Manual pass on mobile widths — already spot-checked against the existing
  `/grammar` 5-pill row at 339px (fits with room to spare); no scrollable
  fallback needed as long as labels stay short (see Phase 3).

## Open questions

- Should level tabs show all five levels always (roadmap view), or only
  levels the user has started, with the rest greyed out/disabled?
- Should the Grammar block within a level further group by grammar
  sub-domain (syntax vs. morphology vs. C-only idiom recognition), or is a
  flat topic list per level already short enough? (Likely yes, given C's ~25
  topics split across only 5 level tabs is much shorter than 25 in one flat
  list — revisit only if it's still too long in practice.)
  </content>
