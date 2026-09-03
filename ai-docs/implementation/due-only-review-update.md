---
title: Due-only review — fixes and grammar extension
date: 2026-09-03
---

# Due-only review — fixes and grammar extension

Follow-up to `ai-docs/implementation/due-only-review.md` (completed
2026-09-03). Three items, in the order requested: (1) "Shuffle & Restart"
appearing broken on `/review`, (2) uttrykk due badges over-fetching, (3)
whether to extend due-only review to Grammar. Investigation notes for all
three are in the chat that produced this doc; this file is the
implementation plan only.

## Fix 1 — "Shuffle & Restart" looks broken on `/review`

### Root cause

`VocabFlashcardPage.restart()` only re-filters the **`entries` prop it
was mounted with** — it never re-fetches anything. On an ordinary
`/{level}/{category}` page that's fine (`entries` is the whole category,
always much bigger than what's currently due). On `/review`, `entries`
**is already the fully-resolved due set** for the session's scope, fetched
once in `loadSession()`.

Original `buildDueDeck()` re-filters `entries` against the live
`progressMap` on every `restart()`. That means once a card is rated,
FSRS pushes its due date into the future, so it drops out of the next
`buildDueDeck()` call. Net effect: each `restart()` trends toward
**fewer** cards, not the same batch again — e.g. 5 due Shopping items,
rate all 5, hit Restart → 0 left, empty deck. That's not what "Shuffle &
Restart" should mean here.

### Design decision (confirmed in discussion)

Restart should reshuffle and redeal **the same fixed batch that was due
when `/review` was opened** — not shrink toward empty, and not fetch new
cards mid-visit. Concretely, for the three examples discussed:

- **Shopping, 5 due, session limit 10:** every restart reshuffles those
  same 5, indefinitely, for the rest of the visit.
- **All A2 due (62), session limit 10:** each restart deals the next
  10-card chunk of the 62 (not yet dealt this visit). After ~7 restarts
  you've seen all 62 once; the 8th restart reshuffles the full 62 and
  starts dealing from the top again. Full coverage before it loops —
  never random-with-early-repeats.
- **Whole A2 level (76):** identical mechanic against the bigger pool.

**Ratings still save real FSRS progress — but only the first time a card
is rated this visit.** A repeat encounter (the card comes back around
after the deck loops) is **practice-only**: same flip/rate/advance UI,
same rating buttons, but the rating is *not* persisted via
`saveProgress()`. This was a deliberate choice over letting every repeat
count as a real review — a second "Good" seen 90 seconds after the first
doesn't reflect genuine retention at a real spaced interval, and letting
it count would push the card's due date out on a false signal, inflate
`reps`/`seenCount` on `/stats`, and quietly undermine FSRS's scheduling.
Keeping the interaction visually identical (rather than a separate
"quiz yourself, no grading" mode) avoids the UI needing to explain
itself card-by-card.

### Implementation sketch

- `VocabFlashcardPage` (or `/review/+page.svelte`, whichever owns the
  session) tracks, per visit:
  - `shuffledEntries` — `entries` shuffled once, re-shuffled each time
    the deal pointer runs off the end.
  - `dealIndex` — how far into `shuffledEntries` the current chunk has
    reached; `restart()` deals the next `sessionLimit`-sized slice,
    wrapping (reshuffle + reset to 0) once exhausted.
  - `ratedThisVisit: Set<string>` — `vocabKey`s already persisted once
    this visit.
- `rate()`: if `vocabKey` is already in `ratedThisVisit`, skip the
  `saveProgress()` call (practice-only) but keep the rest of the flow
  (flip, advance, button feedback) unchanged; otherwise call
  `saveProgress()` as normal and add the key to the set.
- "Last: X" badge / interval preview keep reading straight from the real
  `progressMap`, so they always reflect the genuine last real rating —
  never show a stale or practice-only value.
- Completion screen message: since the deck now loops instead of ever
  truly emptying, drive the message off unseen-this-visit count rather
  than the live due timestamp:

  ```ts
  let sessionUnseenRemaining = $derived(
    entries.filter((e) => !ratedThisVisit.has(vocabKey(e))).length
  );
  ```

  ```svelte
  {#if deckMode === 'due'}
    {#if sessionUnseenRemaining > 0}
      <p>{sessionUnseenRemaining} more due — tap restart to keep going.</p>
    {:else}
      <p>All caught up — Shuffle &amp; Restart to keep practicing.</p>
    {/if}
  {/if}
  ```

- **Everywhere else `dueCount` (the app-wide `countDueToday()`) is used
  stays exactly as-is** — the free-user Plus upsell banner and the
  orange "N due" chip (shown in `deckMode === 'all'`) are deliberately
  app-wide nudges, not scoped to the current session; not in scope here.
- No new network calls anywhere in this fix — `entries` already holds
  the full due set for the session's scope (fetched once, uncapped, in
  `loadSession()`); everything above is local shuffling/bookkeeping.
- Ordinary `/{level}/{category}` pages get the same loop-and-practice-
  only behavior for free (same component) — flagging as a small
  behavior change beyond `/review` itself, not just a `/review`-only
  patch, in case that's not wanted there too.

### Explicitly not doing

Not adding a way for `Restart` to hit the network again to pick up cards
that become due _during_ the session (e.g. a very short FSRS interval
after an "Again" rating elsewhere, or a card in a different category
crossing its due time mid-session). `entries`/`shuffledEntries` are a
point-in-time snapshot from when `/review` mounted, refreshed only on a
full page reload. Rare enough edge case to skip.

## Fix 2 — Uttrykk due badge over-fetches (shows 10 instead of 1)

### Root cause

Confirmed exactly as scoped in `due-only-review.md`'s own Step 4c note.
Vocab rows and C's uttrykk rows are keyed by real category slugs that
match `CardProgress.category` — `getDueItems({ category })` scopes
precisely. A1–B2 uttrykk rows are keyed by **theme** (`greetings`,
`travel`, ...), but every A1–B2 uttrykk `CardProgress.category` is the
literal sentinel `'uttrykk'` — there's no theme on the progress row at
all. `LevelStatRows.reviewHref()` already knows this and _deliberately
omits_ `&category=` for these rows, falling back to a level+type-wide
link — which is why clicking a "1 due" A1–B2 uttrykk badge opens a
session scoped to every due uttrykk card at that level (capped at the
session limit, e.g. 10), not just the 1 in that theme.

### Fix — no schema change needed

The theme _is_ available — just not on `CardProgress`. It's on the
resolved `VocabEntry` itself: `uttrykk-{level}.json` entries already
carry both `category: "uttrykk"` (sentinel) and `theme: "greetings"`
(real grouping) — confirmed directly in `uttrykk-a1.json`. `VocabEntry`
already has `theme?: string` in `types.ts`. So the fix is a client-side
post-filter after resolving, no DB/migration/API-shape change:

1. **`LevelStatRows.svelte`** — `reviewHref()`: stop special-casing A1–B2
   uttrykk rows. Always include `&category={row.key}` when `reviewType`
   is set, regardless of level/type. (Simplifies the function — the
   `canScopeByCategory` branch and its comment can go away entirely.)

2. **`/review/+page.svelte`** — `loadSession()`:
   - When fetching `dueItems`, drop `category` from the `getDueItems()`
     call for the A1–B2-uttrykk case specifically (progress rows can't
     match a theme there, so passing it would just silently return
     zero). Concretely: pass `category: categoryParam` to `getDueItems()`
     only when it's actually usable — vocab, or C-level uttrykk. For
     A1–B2 uttrykk, call `getDueItems({ level, type: 'uttrykk' })`
     (no category) so it fetches every due uttrykk id at that level, same
     as today.
   - After resolving via `POST /api/review-entries`, if `categoryParam`
     is set, filter the **resolved entries** (which do have real
     `category`/`theme` fields) down to the requested scope:
     ```ts
     if (categoryParam) {
       entries = entries.filter((e) => e.category === categoryParam || e.theme === categoryParam);
     }
     ```
     This one filter line correctly covers all three cases uniformly —
     vocab (`category` match), C uttrykk (`category` match), A1–B2
     uttrykk (`theme` match) — without the caller needing to know which
     case it's in.
   - `getDueItems()` itself is unchanged (its existing `category` option
     still works fine for vocab/C — just isn't called with a theme value
     it can't use).

3. Update the `getDueItems()` doc comment in `progress.ts` — it
   currently documents the "pass `type: 'uttrykk'` for C" caveat; add a
   line noting A1–B2 theme scoping now happens downstream in `/review`
   (post-resolve), not via this function's `category` option.

### Trade-off

For A1–B2 uttrykk, this fetches slightly more ids (`getDueItems`) and
resolves slightly more entries (`/api/review-entries`) than strictly
needed, then discards the ones outside the theme client-side. Given the
resolver already loads the whole `uttrykk-{level}.json` file for any
match in that level, and level-scoped due counts are small in practice,
this is cheap. Simplicity/correctness over the minor extra bytes.

### Verification

- Cross-check: an A1–B2 uttrykk theme row showing "N due" → clicking it
  → `/review` deck size equals N (currently it can be larger, capped at
  the session limit).
- Vocab and C-uttrykk rows unaffected (same code path, same result as
  today — verify no regression).
- `getDueItems()`'s own unit tests (`progress.test.ts`) should still pass
  unchanged, since its signature/behavior isn't changing.

## Fix 3 — Extend due-only review to Grammar

### Feasibility check (done)

Unlike uttrykk, Grammar doesn't have the theme/sentinel problem: each
`GrammarQuestion` already carries a real `topic: GrammarTopic` and
`cefr: CEFRLevel` directly (confirmed in `grammar-a1.json`), and
`saveGrammarProgress()` already stores `category: question.topic` /
`level: question.cefr` on the `CardProgress` row unchanged — i.e. Grammar
rows behave like **vocab** rows (precise category match), not like A1–B2
uttrykk rows. `grammar-{level}.json` files already exist per level
(`grammar-a1.json` … `grammar-c.json`), which is what a resolver endpoint
needs. So this is a fairly direct rerun of Steps 1–4 from
`due-only-review.md`, scoped to grammar.

### Proposed steps

**Step G1 — Resolver endpoint.** New `POST /api/review-grammar-entries`
(or extend the existing endpoint with a `kind: 'vocab' | 'grammar'`
discriminator — open question below), mirroring
`/api/review-entries/+server.ts`: input `{ id, cefr }[]`, loads
`grammar-{level}.json` per level requested, returns matched
`GrammarQuestion[]`.

**Step G2 — `getDueGrammarItems()` helper.** New function in
`progress.ts` alongside `getDueItems()`, operating on a grammar
`progressMap` (loaded via `loadGrammarProgressMap()` /
`loadGrammarProgressFromSupabase()`) instead of the vocab one. Same
`{ level?, category? }` shape — `category` here is a real `topic`, so
(unlike uttrykk) no post-resolve workaround is needed; it can filter
precisely at this stage, same as vocab.

**Step G3 — Grammar review route.** Either a `type=grammar` branch on the
existing `/review` route, or a separate `/review/grammar` route — open
question below, since `GrammarSession.svelte` takes a different prop
shape (`questions`, `rule`, `userId`) than `VocabFlashcardPage`
(`entries`, ...) and has its own internal due/new session-building
(`buildGrammarSession`) that would need to accept an already-resolved,
already-due `GrammarQuestion[]` the same way `VocabFlashcardPage`
accepts `entries` today (or be bypassed, rendering the resolved set
directly through the question-type components).

**Step G4 — Wire up entry points.** `LevelStatRows.svelte`'s Grammar
call currently passes no `reviewType`, so its due badges stay plain.
Add `reviewType="grammar"` there once G1–G3 exist; `reviewHref()` can
scope by `category={row.key}` immediately (real topic slug, same as
vocab — no Fix 2 workaround needed here).

### Open questions — need your input before writing a real plan for this one

- **One combined session type, or grammar kept separate?** Could a
  due-only session ever mix vocab/uttrykk _and_ grammar in one sitting
  (a true "everything due right now" button), or should grammar stay its
  own separate review flow, entered only from grammar-specific due
  badges/buttons? This affects whether Step G3 extends `/review` or
  becomes its own route.
- **Reuse `GrammarSession.svelte` or build a lighter renderer?**
  `GrammarSession` currently owns its own due/new deck-building
  internally (`buildGrammarSession`, capped/prioritized itself) — similar
  to how `VocabFlashcardPage` used to gate Plus into `'due'` mode
  internally before due-only review needed it to accept a pre-filtered
  `entries` list from outside. Does `GrammarSession` need a similar
  "accept a pre-resolved, already-due question list" mode, or is a
  simpler bypass enough here?
- Given this is explicitly the lowest-priority of the three and was
  called out as deferred in the original doc, do you want a fully fleshed
  step-by-step plan (mirroring Steps 1–4 of `due-only-review.md`) written
  now, or should this section stay at the current outline level until
  Fixes 1–2 are done and shipped?

## Progress log

_After each work session, update this log with a concise note of what changed and mark the item ✅ Done._

- [x] Fix 1 ✅ Done — `VocabFlashcardPage.svelte`: replaced `buildDueDeck`
      with `computeDuePool` (fixed due+new pool, computed once per fresh
      session) + `dealDueChunk` (deals `sessionLimit`-sized chunks,
      reshuffles & wraps on exhaustion). `restart()` now passes `isRestart`
      so it deals the next chunk instead of recomputing the pool. `rate()`
      skips `saveProgress()`/undo for cards already in `ratedThisVisit`
      (practice-only repeats), and adds the key after a real save.
      Completion message now uses `sessionUnseenRemaining` (pool minus
      rated-this-visit) instead of the app-wide `dueCount`, with a
      "keep practicing" message once the pool has looped. Verified with
      `svelte-autofixer` (no issues). Not yet manually tested in the app.
- [x] Fix 2 ✅ Done — `LevelStatRows.reviewHref()` now always includes
      `&category={row.key}` when `reviewType` is set (dropped the
      `canScopeByCategory` special-case; "Others" rows still excluded).
      `/review/+page.svelte`'s `loadSession()`: for A1–B2 uttrykk rows,
      omits `category` from the `getDueItems()` call (fetches the whole
      level+type instead, since `CardProgress.category` can't express a
      theme) and instead filters the *resolved* entries afterward by
      `e.category === categoryParam || e.theme === categoryParam` — a
      no-op refinement for vocab/C-uttrykk rows, the actual fix for A1–B2
      uttrykk. `getDueItems()`'s own logic is unchanged, only its doc
      comment (in `progress.ts`) now notes the theme case is handled
      downstream. Verified both changed files with `svelte-autofixer` (no
      issues). Not yet manually tested in the app.
- [ ] Fix 3 — pending answers to the open questions above
