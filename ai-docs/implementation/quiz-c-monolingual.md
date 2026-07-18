# C-level and B2-level quiz: monolingual questions (no English)

## Background

`/quiz?level=C` built its multiple-choice options, fill-in-blank hints, and
type-answer prompts the same way every other level does — from `entry.english`
(and `entry.example_english` on the reveal screen). For A1–B2 that's the
point: the quiz is testing translation recall. At C ("Mastery"), the same
scaffolding undercuts what the level is supposed to represent — a C1/C2
learner shouldn't need an English gloss to recognize a C-level word, and a
real C1/C2 assessment wouldn't offer one.

`VocabEntry.definition` already exists — a monolingual Norwegian definition,
originally added for the flashcard side's "Definition → Norwegian" study
mode. Coverage: `vocab-c.json` has one for all 729 entries; `uttrykk-c.json`
has one for only ~355 of 559 (written before the monolingual quiz was on the
table).

## Decision

All three quiz question types (multiple-choice, fill-in-blank, type-answer)
go monolingual at C, using `definition` in place of `english` throughout.
The ~204 uttrykk-c entries without a `definition` are excluded from C
quizzes entirely (as both target and distractor) until backfilled, rather
than falling back to English just for those and reintroducing the
inconsistency this phase removes.

## Status: implemented ✅

- **`src/lib/quiz.ts`**:
  - New `isQuizable(entry)`: `true` for every entry except a C-level one
    with no `definition`.
  - `getDistractors()`: when the target entry is C-level, the comparison key
    switches from `.english` to `.definition`, and the candidate pool is
    restricted to entries that actually have a `definition` (regardless of
    their own level, to keep any cross-level padding safe).
  - `buildMCQuestion()`: at C, `prompt` stays `entry.norsk` (unchanged — the
    prompt was already just the Norwegian word) but both the correct option
    and all wrong options become `.definition` instead of `.english`.
  - `buildFillQuestion()`: the rare fallback path (used when the target word
    doesn't appear verbatim in its example sentence) becomes a Norwegian
    "Hvilket ord betyr: «definition»?" prompt at C, instead of the English
    "What is the Norwegian word for X?" every other level uses.
  - `buildTypeQuestion()`: `prompt` becomes `entry.definition` at C instead
    of `entry.english` — the user reads a Norwegian definition and types the
    Norwegian word it describes, rather than translating from English.
  - `buildQuizSession()`: filters its entry pool through `isQuizable` before
    building the due/new-card split, so a definition-less C entry can never
    become a question target.
  - The `?? entry.english` fallbacks inside the three builders are a
    type-safety net only (`definition` is an optional field) — not a real
    code path, since `buildQuizSession`'s `isQuizable` filter should already
    guarantee a C-level entry reaching them has one.
- **`src/routes/quiz/+page.svelte`**:
  - `quizEntries` (the picker's pool, used for the "N words available" hint
    and the Start-button disabled state) now also filters through
    `isQuizable`, so the count reflects what a session can actually draw
    from rather than a nominal total.
  - Fill-in-blank's hint line (shown while answering) uses `entry.definition`
    instead of `entry.english` when `entry.level === 'C'`.
  - The reveal screen's `example_english` line is hidden entirely for
    C-level entries (there's no Norwegian paraphrase-of-the-example field to
    show instead — the definition is for the _word_, not the example
    sentence).
  - The summary screen's per-question result list shows `definition` instead
    of `english` next to the Norwegian word for C-level entries.

## Not touched

- The flashcard side's existing monolingual mode is untouched — this only
  changes `/quiz`.

## Phase 10 — extend to B2 ✅ Done

**Status: implemented.**

Follow-up prompted by the same reasoning Phase 9 applied to C: B2
("Upper Intermediate") is advanced enough that an English translation option
works against the level's own point, and the data already supports it —
`vocab-b2.json` has a `definition` for 1744/1750 entries (6 missing, mostly
reflexive/phrasal verbs), `uttrykk-b2.json` for 416/679 (263 missing, a
similar-shaped gap to C's uttrykk deck).

Rather than duplicate the C-specific logic, `quiz.ts`'s three `entry.level
=== 'C'` checks became a single `MONOLINGUAL_LEVELS = new Set(['B2', 'C'])`
and an exported `isMonolingualLevel()` helper, used everywhere the old
inline check was (`getDistractors`, `buildMCQuestion`, `buildFillQuestion`,
`buildTypeQuestion`, `isQuizable`). `+page.svelte`'s three template-level
`.level === 'C'` checks (fill-hint text, reveal screen's `example_english`
line, summary list's translation line) were replaced with calls to the same
imported helper, so C and B2 share one code path rather than B2 growing a
parallel set of checks.

Same exclusion rule as C: the 263 uttrykk-b2 and 6 vocab-b2 entries without
a `definition` are excluded from B2 quizzes (via `isQuizable`) rather than
falling back to English for just those.

Unlike C, B2 has its own separate `uttrykk` category (not merged into vocab
categories the way C's is) — no hub-page or `/stats` changes were needed
here, since this phase only touches `/quiz`, and B2's Uttrykk category page
itself was already unaffected by this change (it's a flashcard route, not a
quiz one).

### Not touched (Phase 10)

- A1/A2/B1 stay translation-based — no request to change them, and their
  `definition` coverage hasn't been checked.
