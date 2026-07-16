# Nivå C Grammar — Converting Instructional Text to Norwegian

## How to continue this work in a new session

If you're picking this up fresh (new Claude session, context limit reached), here's the exact
workflow that's been used topic-by-topic so far — follow it as-is rather than improvising, since
the steps below exist because of mistakes already made and fixed live.

**Setup:**

- Repo root: `/Users/shinichiokada/Svelte/svelte-languages/norskeord` (needs Filesystem tool
  access added to the conversation if not already present).
- Find the next topic to convert: the first `⬜` in the "Progress tracker" section at the bottom
  of this doc.

**Per-topic steps:**

1. Read the topic's questions straight from the real file with `Filesystem:read_text_file` (or
   copy it to Claude's sandbox with `Filesystem:copy_file_user_to_claude` and filter with a
   throwaway `node -e` script) — either works, but you need to see the _exact_ current strings
   before writing any edits.
2. Translate `prompt`/`hint`/`explanation` only (never `sentence`/`tokens`/`source`/`answer`/
   `alternates`/`options`/`optionA`/`optionB`/`words` — those are already Norwegian). Follow the
   "Translation approach" section below exactly — preserve grammatical reasoning, don't
   paraphrase loosely.
3. Apply the edits directly to the real file with `Filesystem:edit_file`.
   **Critical pitfall — read this before editing:** several C-level topics reuse the exact same
   `prompt` string across multiple questions (e.g. "Choose the correct comparative form of
   «X»." repeated with only X changing), and some strings also appear verbatim in _other CEFR
   levels_ outside this doc's scope (this happened once: an edit meant for a C-level question
   landed on an A2 question instead because the old-string match wasn't unique in the file, and
   had to be caught and reverted). Before submitting an edit, check whether the `old_str` you're
   matching is unique in the whole file, not just within the topic. If it isn't, widen the match
   to include the adjacent `sentence`/`source`/`id` line so it's unambiguous.
   **Second critical pitfall:** `Filesystem:edit_file` takes a list of edits in one call and
   applies them atomically — if even _one_ `old_str` in the list fails to match (e.g. a
   transcription slip on a quote character, «» vs '' vs ""), the **entire batch is rolled back**,
   not just the broken entry (this happened on `ordet-sa`: a batch of ~20 edits failed on one
   mismatched quote style, and only a single edit applied earlier in a separate call survived).
   After any batch call, don't assume success from a lack of error — re-fetch the topic from the
   real file and diff it against what you intended before moving on. If a batch does fail, the
   safest recovery is per-question edits anchored on that question's unique `"id": "gq-xxx-NNN",`
   line (never fails to match, and can't accidentally land on a different question), rather than
   retrying the same large batch.
4. After editing, validate: copy the file back with `Filesystem:copy_file_user_to_claude`, `cp` it
   into the sandbox copy at `/home/claude/check/src/lib/data/grammar.json`, then run:
   ```
   node -e "JSON.parse(require('fs').readFileSync('src/lib/data/grammar.json','utf8')); console.log('VALID JSON')"
   node scripts/check-c-grammar-norwegian.mjs <topic-1> <topic-2> ... <all-topics-done-so-far>
   ```
   (The checker script needs to be copied into the sandbox once, from
   `scripts/check-c-grammar-norwegian.mjs`, the same way as the data file.)
5. If the checker flags something, don't assume it's a real miss — check the "Known
   false-positive fixes to `ENGLISH_TELLS`" note further down first; Norwegian/English homographs
   (`form`, `verb` so far) cause false flags on genuinely correct Norwegian.
6. Once clean, mark the topic `✅ Done` in the "Progress tracker" section of this same doc.

**Also relevant if UI/display work comes up again:** the "Amended"/"Follow-up"/"Cleanup" entries
under Decision below record a separate but related thread — making the _topic card and session UI_
(not just question content) respect Nivå C's Norwegian-only rule. That work is already done across
all 5 learner-facing spots found; no need to redo it, but worth knowing it exists if a screenshot
like "why is this still English" comes up again.

## Decision

All 24 Nivå C grammar topics (`ai-docs/implementation/c-grammar.md`) currently mix English
instructional text with Norwegian content: `prompt`/`hint`/`explanation` are English, while
`sentence`/`tokens`/`source`/`answer`/`options`/`optionA`/`optionB` are Norwegian. This mirrors
every other CEFR level in the app (A2–B2 grammar questions are English-instructed too), but for
Nivå C specifically it's the wrong call: C assumes near-native comprehension, the app serves 5 UI
locales (EN, NB, ES, UK, DE) and question-level text isn't translated per-locale today, so
English instructions quietly privilege English-L1 learners. Target-language (Norwegian)
instruction at C level is also just better pedagogy — full immersion, no L1 crutch.

**Resolved 2026-07-15:** convert retroactively, across all 24 existing topics (425 questions).
`GrammarRule` entries in `src/lib/grammar/rules.ts` (`titleEn`/`explanationEn`) are **not**
touched — they stay bilingual (`titleNb`/`explanationNb` already exist there and are unaffected;
`titleEn`/`explanationEn` are kept for any future English-UI fallback use elsewhere in the app).
This plan is scoped to `src/lib/data/grammar.json` question content only.

**Amended 2026-07-15 (later same day):** the topic-card UI (title + description shown when
browsing `/grammar`) also needs to respect the immersion decision above, not just the
question-level content. `TopicCard.svelte` was already correctly locale-aware
(`isNb ? titleNb : titleEn`), but that meant a C-level topic browsed in the EN locale still showed
English title/description — undermining the same reasoning that motivated this whole doc. Resolved:
for any topic whose `levels` includes `C`, always render `titleNb`/`explanationNb`, regardless of
the UI locale. Non-C topics are unaffected and continue to follow the locale switcher.

One related, pre-existing bug was fixed opportunistically: the locked/paywall teaser cards on
`/grammar` (shown to free users previewing Plus-gated topics) hardcoded `titleEn`/`explanationEn`
unconditionally, ignoring locale entirely — for _every_ CEFR level, not just C. That's now fixed
to follow the same rule as everywhere else: Norwegian for C topics, locale-aware for the rest.
This surfaced because C topics are all `plusOnly`, so they're the ones actually shown in that
teaser view for free users.

**Files touched by the amendment:**

- `src/lib/components/grammar/TopicCard.svelte` — added `forceNb = levels.includes('C')`
- `src/routes/grammar/+page.svelte` — search-match logic (`topicMatches`) and the locked-teaser
  card block, both updated to the same `forceNb` rule

**Cleanup 2026-07-15 (later still):** the display logic was rewritten so `forceNb` is checked
first and unconditionally selects `titleNb`/`explanationNb` for C topics, rather than being OR'd
together with the locale check (`isNb || forceNb`). Behavior is identical — this is a readability
fix, not a behavior change — but it makes the code honestly say what's true: C is hardcoded to
Norwegian, not "treated as if the locale were nb." Data in `rules.ts` is untouched; `titleEn`/
`explanationEn` remain on all 24 C-level entries as an unused-for-now fallback, per the original
"keep both fields" decision above.

**Follow-up 2026-07-16:** found via `/learn/c` screenshot that the `forceNb` fix above only
covered 2 of what turned out to be 5 places in the app that render `GrammarRule.titleEn`/
`explanationEn`. Audited every usage of `GRAMMAR_RULES` in the codebase and fixed the remaining
three:

- `src/routes/learn/[level]/+page.svelte` — the grammar section on level-hub pages (e.g.
  `/learn/c`). This one didn't even check locale before — hardcoded `titleEn`/`explanationEn`
  unconditionally for every level. Now: `forceNb` for C topics (via `t.levels.includes('C')`),
  locale-aware for everything else (a genuine bug fix beyond just the C-specific ask).
- `src/routes/grammar/[topic]/+page.svelte` — the `<h1>` page title shown above an actual
  question session. `forceNb` derived from `data.questions.some(q => q.cefr === 'C')` (this
  route's `load` doesn't expose `levels`, only `questions`, each of which carries its own `cefr`).
- `src/lib/components/grammar/AnswerReveal.svelte` — the "rule reminder" box shown after **every
  single question** during a session, arguably the highest-traffic spot of the five. `forceNb`
  derived from `question.cefr === 'C'` (the `GrammarQuestion` prop already carries `cefr`).

Also audited and confirmed **not** in scope, so left untouched:

- `src/lib/components/grammar/GrammarSummary.svelte` — doesn't receive or render `rule` at all.
- `src/lib/components/grammar/{Fill,Order,Transform,MinimalPair,MultipleChoice}Question.svelte`
  — only receive `question`, never `rule`.
- `src/routes/admin/grammar/+page.svelte` — internal content-management table; shows raw question
  fields (topic/cefr/type/answer) for editing, never `GRAMMAR_RULES` titles/descriptions at all.

All five learner-facing spots now agree: Nivå C is unconditionally Norwegian; every other level
continues to follow the EN/NB locale toggle (still English-only for ES/UK/DE, a pre-existing gap
outside this doc's scope).

## Scope

**Fields converted (question-level, `grammar.json`, C topics only):**

- `prompt` — the per-question instruction line
- `hint` — the nudge shown after a wrong attempt
- `explanation` — shown on reveal for `minimal-pair` and `multiple-choice` types

**Fields NOT touched (already Norwegian):** `sentence`, `tokens`, `source`, `answer`,
`alternates`, `options`, `optionA`, `optionB`, `words`.

**Not in scope:** any non-C topic (A2–B2 stay English-instructed, unchanged), `GrammarRule` in
`rules.ts` (stays bilingual, unchanged).

## Translation approach

- Preserve the exact grammatical reasoning — a hint explaining _why_ a form is required must
  carry the same reasoning in Norwegian, not a loose paraphrase or a shortened version.
- Norwegian grammatical terminology throughout (infinitiv, presens, perfektum, bestemt form,
  etc.) — these were already used inside the English hints as loanwords, so this is a smaller
  shift than it sounds for most questions.
- Keep «...» quoted Norwegian example fragments exactly as they are.
- Natural instructional Norwegian, not machine-translated English syntax — rewrite sentence
  structure where a literal translation would read awkwardly.
- `multiple-choice`/`minimal-pair` `explanation` fields keep the same reveal-after-answer role.

## Verification script

`scripts/check-c-grammar-norwegian.mjs` (new): loads `grammar.json`, filters to the 24 C topics,
scans `prompt`/`hint`/`explanation` for a set of common English closed-class/instructional words
(`the`, `choose`, `rewrite`, `which`, `because`, `sentence`, etc.) and flags any question where
one appears, for manual review. Same "review aid, not a strict checker" caveat as
`check-c-grammar-vocab.mjs` — a Norwegian sentence can legitimately contain false-positive
homographs (e.g. `is` = ice), so hits need eyeballing, not blind rejection.

Run after each topic, same cadence as the original Phase 2 build:

```
node scripts/check-c-grammar-norwegian.mjs                 # check all 24 C topics
node scripts/check-c-grammar-norwegian.mjs adj-mer-mest     # check one topic
```

**Known false-positive fixes to `ENGLISH_TELLS`:** two words were removed from the list after
flagging genuinely correct Norwegian text:

- `form` (topic 1, `adj-farger-uboyelige`) — Norwegian for "form/shape," used constantly in
  correct sentences like "Velg riktig form av «miserabel»."
- `verb` (topic 8, `leddsetning-som-fundament`) — identical spelling in Norwegian and English;
  unavoidable in grammar hints that name the finite verb (`verbet`, `verb (ønsker)`, etc.).

Both are exactly the kind of homograph the script's own comment already warns about (`is`, `for`,
`en`). If another topic surfaces a similar false positive, the fix is the same: confirm the
flagged sentence is genuinely correct Norwegian, then remove the word from `ENGLISH_TELLS`.

## Progress tracker

Same alphabetical order as the original Phase 2 build. 425 questions total across 24 topics —
this is a multi-pass effort, not a single sitting.

1. `adj-farger-uboyelige` (10) — ✅ Done
2. `adj-mer-mest` (10) — ✅ Done
3. `adj-partisipp-som-adjektiv` (9) — ✅ Done
4. `futurum-referert` (9) — ✅ Done
5. `jo-desto-komparativ` (9) — ✅ Done
6. `kondisjonalis-counterfactual` (9) — ✅ Done
7. `koordinerende-konjunksjoner` (10) — ✅ Done
8. `leddsetning-som-fundament` (10) — ✅ Done
9. `omskriving-passiv` (10) — ✅ Done
10. `ordet-sa` (10) — ✅ Done
11. `ordfamilie-avledning` (10) — ✅ Done
12. `perfektum-pluskvamperfektum` (10) — ✅ Done
13. `predikativ-agreement` (10) — ✅ Done
14. `preposisjoner-generelt-c` (10) — ✅ Done
15. `preposisjoner-kroppsdel-uttrykk` (10) — ✅ Done
16. `sammensatte-substantiv` (11) — ✅ Done
17. `sterke-verb-c` (12) — ✅ Done
18. `substantiv-uttrykk-c` (10) — ✅ Done
19. `ubestemt-artikkel-c` (10) — ✅ Done
20. `uttrykk-gjenkjenning-c-1` (37) — ✅ Done
21. `uttrykk-gjenkjenning-c-2` (83) — ✅ Done
22. `uttrykk-gjenkjenning-c-3` (89) — ✅ Done
23. `verbet-a-fa` (16) — ✅ Done
24. `verbform-i-kontekst` (11) — ✅ Done

**Total: 425 questions.**
