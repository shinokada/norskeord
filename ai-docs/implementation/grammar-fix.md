---
name: grammar-fix
description: Implementation plan — split grammar picker cards by access segment (level-scoped free/locked) instead of one ambiguous card per topic.
---

> **Status: ✅ Done.** Every section below has been implemented and verified against the current
> codebase (checked 2026-07-28). Section 6's audit was the one open item and is now resolved by
> `ai-docs/implementation/grammar-ux-update.md`, which also extended the `?level=` scoping in
> Section 5 to Plus users (originally free-users-only here) and fixed the `/learn/[level]` hub's
> card badges/counts to match a single level instead of a topic's full span. See that doc for the
> follow-on work. This file is kept as a historical record of the original design, not a live plan.

# Grammar picker: level-scoped cards (Option 4)

## Problem

A topic that spans multiple CEFR levels is free at some levels and Plus-gated at others (current
policy: A1 only, see `ai-docs/gating-rules.md`). Today the `/grammar` picker renders **one card
per topic**, and that card's free/locked state depends on whether a level filter is active:

- No filter → card shows free (topic is free at _some_ level: `freeAnyLevel`).
- Filtered to a locked level (e.g. B1) → the _same_ card flips to locked.

This is logically correct but reads as inconsistent/buggy to users, because the same card
appears to change its mind about whether it's free depending on an unrelated filter action.

## Goal

Make each picker card carry one fixed, unambiguous access state. A topic that has mixed access
across its levels renders as **multiple cards** — one per contiguous run of levels that share the
same free/locked status — so a card never needs to "know about" the active filter to decide what
it says.

## Non-goals (carried over from the "Resolved" decision in gating-rules.md — do not redo this work)

- **Not** splitting `GrammarTopic` into per-level topic keys (no `modal-verb-order-a1` /
  `-a2` / `-b1` as distinct topics/types).
- **Not** duplicating `GRAMMAR_RULES` explanation prose per level — title/explanation stay
  shared across a topic's cards.
- **Not** migrating `grammar_progress` rows — they still key on `topic` as today.
- Still exactly one URL per topic: `/grammar/[topic]`. Only the _picker_ gets multiple cards;
  the topic itself is not duplicated as a route.

## Design

### 1. New access-segment helper (`src/lib/access.ts`) ✅ Done

```ts
export type GrammarAccessSegment = {
  access: 'free' | 'locked';
  levels: CEFRLevel[];
};

/**
 * Splits a topic's levels into contiguous runs that share the same
 * free/locked status, in level order (A1 → C). Under the current A1-only
 * policy this yields at most 2 segments for a multi-level topic (a leading
 * free A1 run + a locked rest), but it's written generically so it still
 * holds if the policy later frees a non-contiguous level (e.g. A1 and C
 * free, A2/B1/B2 locked → 3 segments).
 */
export function groupTopicLevelsByAccess(
  topic: GrammarTopic,
  levels: CEFRLevel[]
): GrammarAccessSegment[] {
  const segments: GrammarAccessSegment[] = [];
  for (const level of levels) {
    const access = isFreeGrammarTopic(topic, level) ? 'free' : 'locked';
    const last = segments[segments.length - 1];
    if (last && last.access === access) {
      last.levels.push(level);
    } else {
      segments.push({ access, levels: [level] });
    }
  }
  return segments;
}
```

Unit tests to add (new or in an existing `access.test.ts`):

- Topic free at every level it has → 1 segment, `access: 'free'`.
- Topic with no free levels → 1 segment, `access: 'locked'`.
- Topic free at A1 only, spanning A1/A2/B1 → 2 segments: `{free, [A1]}`, `{locked, [A2, B1]}`.
- A constructed non-contiguous case (free A1 + free C, locked A2/B1/B2) → 3 segments, to prove
  the function doesn't assume "free levels always come first."

### 2. Picker load (`src/routes/grammar/+page.ts`) ✅ Done

Instead of one entry per topic, emit one entry per **segment**, with a per-segment question
count (not the topic's total):

```ts
const allSegments = order.flatMap((topic) => {
  const topicLevels_ = topicLevels(byTopic[topic] ?? []) as CEFRLevel[];
  const segments = groupTopicLevelsByAccess(topic, topicLevels_);
  return segments.map((seg) => ({
    topic,
    access: seg.access,
    levels: seg.levels,
    total: (byTopic[topic] ?? []).filter((q) => seg.levels.includes(q.cefr)).length
  }));
});

return { segments: allSegments };
```

`freeAnyLevel` goes away — it's superseded by having the free segment(s) exist at all.

### 3. Picker UI (`src/routes/grammar/+page.svelte`) ✅ Done

- Iterate `data.segments` instead of `data.topics`.
- Level-pill filtering becomes a plain `seg.levels.includes(selectedLevel)` check — no more
  reactive `isFreeForCurrentFilter()` — each segment already has a fixed `access`, so filtering
  can't change what a card says, only whether it's shown.
- Free/locked grouping: `segments.filter(s => s.access === 'free')` /
  `segments.filter(s => s.access === 'locked')`, same as today's two grids.
- Search matching stays keyed on `t.topic` (title/explanation lookup unchanged) but now applied
  per segment, so a search match can still show only the free segment of a topic if that's the
  one matching the active level filter.
- **Card disambiguation:** when a topic produces 2+ segments, both cards share the same title —
  add a one-line qualifier so they're distinguishable at a glance, e.g. under the CEFR badges:
  - Free segment: nothing extra needed — badges (`A1`) + no lock icon already say "free at A1."
  - Locked segment: keep the existing 🔒 badge, and change its badge levels to just that
    segment's levels (`A2` `B1`) instead of the topic's full level list, so it reads "Plus unlocks
    A2, B1" rather than repeating A1 next to a lock icon.

### 4. `TopicCard.svelte` ✅ Done

No prop shape change needed — it already takes `levels: CEFRLevel[]` and `total: number`; the
picker just needs to pass the segment's `levels`/`total` instead of the topic's. The locked-card
markup already inlined in `+page.svelte` (not using `TopicCard`) needs the same `levels`/`total`
swap.

### 5. Topic detail page — level-scoped locking (`/grammar/[topic]`) ✅ Done

This is the part that needs new logic, not just a picker re-render. Today `/grammar/[topic]`
computes `locked` topic-wide (`playable.length === 0` across _all_ levels the free user can see).
That's fine when a topic is either fully free or fully locked, but once the picker links to a
specific **locked segment** (e.g. "B1 only, Plus"), landing on `/grammar/modal-verb-order` would
currently show the topic's free A1 questions instead of a paywall — the opposite bug, from the
other direction.

Fix: pass the segment's levels through a `?level=` search param from the picker link, and make
the topic page level-aware:

- `+page.ts`: read `url.searchParams.get('level')` (repeat for multi-level segments, e.g.
  `?level=A2&level=B1`, or a comma-joined `?levels=A2,B1` — pick one convention and use it
  consistently with the existing `?from=` param already used for back-nav). Filter `questions`
  to the requested level(s) when present; otherwise keep today's "all levels" behavior for
  backward compatibility with existing bookmarks/links that don't carry the param.
- `+page.svelte`: when a level param is present, compute `locked` from
  `isFreeGrammarTopic(data.topic, level)` directly (for each requested level) rather than from
  `playable.length === 0`, so a free user who followed a locked-segment card is shown the paywall
  even though the topic has free content at a different, unrequested level.
- **Locked-segment card link:** decide up front whether the picker's locked-segment card should
  (a) link straight to `/plus?ref=grammar-topics`, matching how fully-locked topic cards already
  behave today, or (b) link to `/grammar/[topic]?level=B1` so the in-page paywall renders with
  topic-specific context. Recommend (a) for consistency with existing fully-locked cards and to
  avoid building a second paywall surface — but if a locked topic page is reachable some other
  way (bookmark, `/learn` hub deep link), it must still respect the level param per the point
  above, since the URL itself is now meaningful independent of how the user arrived.

### 6. Audit other entry points ✅ Done (via `ai-docs/implementation/grammar-ux-update.md`)

- `/learn/[level]` hub already links into `/grammar/[topic]?from=<level>` for back-nav (see
  `fromLevel` in the topic page). Check whether it should also start passing `?level=<level>` so
  a user arriving from the B1 hub sees the B1-scoped lock/session instead of the topic's
  "all levels combined" playable set. Not yet traced — verify before shipping.
- Any other internal links to `/grammar/[topic]` (dashboard, stats page, email templates) should
  be checked for the same reason: once the URL supports a level-scoped view, unscoped links to a
  mixed-access topic will keep showing the older "any free level" behavior, which may now look
  inconsistent with the new segmented picker.

### 7. Tests ✅ Done

- `e2e/grammar.test.ts`: picker card-count assertions will change (a multi-level topic now
  produces 2 cards instead of 1) — update fixtures/counts.
- Add a regression test for the exact bug reported: filter to B1 and assert the picker does
  **not** render a free/unlocked card for a topic whose B1 segment is locked, while unfiltered it
  still shows that topic's free A1 segment.
- Add a test that visiting `/grammar/[topic]?level=B1` (or the chosen param convention) as a free
  user shows the paywall even when the same topic has free A1 content.
- Unit tests for `groupTopicLevelsByAccess` per section 1.

### 8. Docs ✅ Done

Once shipped, update `ai-docs/gating-rules.md`'s "Picker level-filter bug (fixed)" section — the
mechanism it describes (reactive `isFreeForCurrentFilter()` re-evaluated against the active
filter) is superseded by this segment-card approach and should be rewritten to describe
`groupTopicLevelsByAccess` instead.

## Suggested build order

1. `groupTopicLevelsByAccess` + unit tests (pure logic, zero UI risk).
2. Picker (`+page.ts`, `+page.svelte`, locked-card markup) rendering segments — this alone fixes
   the reported inconsistency for the common case.
3. Level-scoped locking on `/grammar/[topic]` via the query param, wire picker locked-segment
   links to it (or confirm option (a) above and skip the wiring, keeping locked-segment cards
   linking straight to `/plus`).
4. Audit `/learn/[level]` and any other internal links per section 6.
5. Update e2e tests and `gating-rules.md`.
