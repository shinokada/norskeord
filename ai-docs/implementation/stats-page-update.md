---
title: stats page update
date: 2026-08-01
completed: false
---

# Stats page update — accordion sections

## Background

`/stats` (`src/routes/stats/+page.svelte`) currently renders three full
content-type blocks — 📖 Vocabulary, 💬 Uttrykk, 📐 Grammar — stacked
vertically underneath the CEFR level tabs (A1–C). Each block always renders
in full for the active level:

- A compact summary card (seen/due counts + a stacked progress bar) — always
  short, one card.
- A `LevelStatRows` list (`src/lib/components/LevelStatRows.svelte`) — one
  row per vocab category / uttrykk theme / grammar topic at that level. This
  is the part that can run long (C level alone has ~25 grammar topics, per
  `stats-page-improvement.md`'s Phase 1 notes).

Because Grammar is always the third and last block, reaching it means
scrolling past both the Vocabulary and Uttrykk `LevelStatRows` lists first,
regardless of how long those happen to be for the active level.

Discussed two fixes: content-type sub-tabs (hides the other two entirely) vs.
accordion (collapsible per-section, all visible by default). Chosen:
**accordion** — it doesn't hide any progress by default, and lets Grammar (or
any section) be collapsed down to just its summary card without hiding the
other two.

## Goals

1. Let each of the three content-type blocks collapse independently, so
   scrolling to Grammar no longer requires scrolling past the full detail
   lists of Vocabulary and Uttrykk.
2. Never hide the at-a-glance numbers — only the detailed `LevelStatRows`
   list (and, where applicable, the Plus upsell box) collapses. The summary
   card/grid for each section stays visible whether that section is
   expanded or collapsed, so \"how am I doing in X\" never requires expanding
   anything.
3. Remember each section's open/closed state across visits, the same way
   `ACTIVE_LEVEL_KEY` already remembers the active level tab.
4. No regression on first visit: default state is fully expanded, identical
   to today's page.

## Non-goals

- **No change to the level tabs, the CEFR estimate, the activity chart, the
  summary strip, or the reset/share flows.** This is scoped to the three
  content-type blocks only.
- **No change to `stats.ts`'s per-level stat builders**
  (`vocabCategoryStatsForLevel`, `uttrykkThemeStatsForLevel`,
  `grammarTopicStatsForLevel`) or to `LevelStatRows.svelte`'s row rendering —
  this is purely about what wraps around them, not what they compute or
  render.
- **No per-level collapse state.** A section's open/closed state is global
  (one flag per content type), not tracked per CEFR level — switching from
  the A1 tab to the B1 tab keeps whatever collapse state each section was
  already in. (Flagged as an open question below in case that's not what you
  want.)
- **Not adding a collapse toggle to the Free-tier Plus-upsell boxes** for
  Vocabulary/Uttrykk. See Phase 3 for why.

## Proposed structure

```
📖 Vocabulary                                    [▼]
┌─────────────────────────────────────────────┐
│ A1 · 42 seen · 3 due today   [stacked bar]    │  ← always visible
└─────────────────────────────────────────────┘
  ⌄ (collapsed: nothing further shown)
  ⌃ (expanded: LevelStatRows list below, as today)

💬 Uttrykk                                       [▶]  ← collapsed example
┌─────────────────────────────────────────────┐
│ A1 · 12 seen · 1 due today   [stacked bar]    │  ← still visible, collapsed
└─────────────────────────────────────────────┘

📐 Grammar                                       [▼]
┌───────────┬───────────┬───────────┐
│ Practiced │    Due    │ Mastered  │  ← always visible (3-cell grid)
└───────────┴───────────┴───────────┘
  LevelStatRows list below (expanded)
```

## Phase 1 — Extract a shared `CollapsibleSection.svelte`

New file: `src/lib/components/CollapsibleSection.svelte`. Three call sites
(Vocabulary/Uttrykk/Grammar in `+page.svelte`) share the same header +
toggle + chevron markup, so — matching this codebase's existing pattern of
extracting shared pieces once they repeat 3× (`LevelStatRows.svelte` itself
was extracted this way, per `stats-page-improvement.md` Phase 2) — this
should be one component, not three copies of the same button markup.

Props (draft):

```ts
interface Props {
  icon: string; // '📖' | '💬' | '📐'
  title: string; // already-translated m.stats_vocabulary_heading() etc.
  open: boolean;
  onToggle: () => void;
  id: string; // for aria-controls / the content wrapper's id
}
```

Markup: a `<button>` heading (not a plain `<h2>`) with `aria-expanded={open}`
and `aria-controls=\"{id}-content\"`, an `<h2>`-styled label + icon, and a
chevron (▶/▼, or an inline SVG) that rotates via a Tailwind transition class.
The _always-visible_ summary card/grid is NOT part of this component — it's
rendered by the caller above the collapsible slot, so it's never hidden by
toggling. The component only wraps the collapsible part (a Svelte 5 snippet
prop, e.g. `children`), which in practice will be the `LevelStatRows` +
Plus-upsell-box combination each section already renders today.

## Phase 2 — Wire into `/stats/+page.svelte`

1. Add three `$state<boolean>` flags — `vocabOpen`, `uttrykkOpen`,
   `grammarOpen` — all defaulting to `true`.
2. Add three localStorage keys, following the exact pattern
   `ACTIVE_LEVEL_KEY` already uses:
   - `stats-section-vocab-open`
   - `stats-section-uttrykk-open`
   - `stats-section-grammar-open`
     Restored in the same `onMount` block that already restores
     `ACTIVE_LEVEL_KEY` (values stored as `'true'`/`'false'` strings; missing
     or invalid → default `true`, so a user who never touched a toggle keeps
     seeing everything expanded).
3. Add a `toggleSection(key: 'vocab' | 'uttrykk' | 'grammar')` helper that
   flips the relevant flag and persists it — mirrors `setActiveLevel`.
4. In the template, wrap each section as:
   - Vocabulary: keep the existing per-level summary card exactly as-is
     (outside/above the collapsible region), then wrap the
     `{#if isPlus}<LevelStatRows .../>{:else}<upsell box>{/if}` block inside
     `<CollapsibleSection open={vocabOpen} onToggle={() => toggleSection('vocab')} ...>`.
   - Uttrykk: identical shape to Vocabulary.
   - Grammar: keep the existing 3-cell practiced/due/mastered grid outside
     the collapsible region (always visible whenever
     `grammarRowsForActiveLevel.length > 0`, same conditional as today), and
     wrap only `<LevelStatRows rows={grammarRowsForActiveLevel} .../>` inside
     the collapsible region.

## Phase 3 — Scope the toggle to where it actually helps

For Free-tier users, Vocabulary and Uttrykk's collapsible content is the
small 3-line Plus-upsell box, not a `LevelStatRows` list — there's no
scrolling problem to solve there, and collapsing it would just hide a
conversion nudge for no benefit. So:

- **Vocabulary/Uttrykk**: only render the `CollapsibleSection` wrapper (with
  its toggle button) when `isPlus` is true. Free users keep seeing the
  upsell box exactly as today, with no collapse affordance.
- **Grammar**: always wrap in `CollapsibleSection` regardless of plan —
  grammar topic-level progress has never been Plus-gated (per
  `stats-page-improvement.md`'s Phase 3 notes), so every user can have a long
  Grammar `LevelStatRows` list and benefits from being able to collapse it.

## Phase 4 — Verify

- Confirm first-load behavior is pixel-for-pixel identical to today's page
  (all three sections expanded, no visual regression) for a fresh
  browser/localStorage.
- Confirm collapse state persists across a page reload, and survives
  switching the active level tab (per the Non-goals section, collapse state
  is global, not per-level — switching A1 → B1 shouldn't silently re-expand
  or re-collapse anything).
- Confirm the summary card (Vocab/Uttrykk) and the 3-cell grid (Grammar) stay
  visible and correct while their section is collapsed — this is the whole
  point of the accordion approach over sub-tabs, so worth explicitly
  clicking through and checking rather than assuming.
- Keyboard check: the header button should be focusable and toggle on
  Enter/Space (native `<button>` behavior — no custom key handling needed if
  it's a real `<button>`, not a `<div onclick>`).
- `pnpm check` and a manual pass in the browser (Free and Plus, a couple of
  levels, including one with existing progress and one empty level like A1's
  Grammar) — same caveat as the prior restructuring doc: I don't have a way
  to run these myself from here.

## Open questions — resolved

- **Global vs. per-level collapse state**: Global (as proposed in Phase 2).
  Matches the existing `ACTIVE_LEVEL_KEY` precedent, avoids multiplying
  state (3 sections × 5 levels = 15 flags vs. 3), and switching levels is
  already fast/common so losing per-level collapse memory shouldn't sting.
  `CollapsibleSection`'s `open` prop doesn't care where the boolean comes
  from, so this stays cheap to revisit later if user feedback specifically
  asks for per-level behavior.
- **\"Collapse all / expand all\" control**: Skip for v1. Three toggles is a
  low enough count that a global control only saves a couple of clicks, and
  it adds UI surface (placement, label, keeping a fourth flag in sync with
  the three individual ones) for marginal gain. No current use case in this
  doc needs collapsing all three at once. Revisit if usage data or user
  requests justify it.
