# Grammar Questions — Norwegian-Only Across All Levels

## Decision

Nivå C already went through this exact conversion
(`ai-docs/implementation/c-grammar-norsk-instruksjoner.md`, resolved 2026-07-15): question-level
`prompt`/`hint`/`explanation` text converted from English to Norwegian, and 5 learner-facing UI
spots hardcoded to always render `GrammarRule.titleNb`/`explanationNb` regardless of locale
(`forceNb`), instead of switching on `localeStore.current`.

**This plan extends that same decision to every other CEFR level (A1, A2, B1, B2).** Rationale,
per the discussion that led here: sentences at these levels are short (5–8 words), the learner
studying a grammar topic has already cleared the relevant vocab, and translating exercise
scaffolding into English only (out of 5 supported UI locales — EN, NB, ES, UK, DE) privileges
English-L1 learners while silently ignoring ES/UK/DE learners. Rather than build out full 5-language
i18n for exercise text (high pipeline cost for content that isn't doing much pedagogical work —
see the C-level precedent's own reasoning), the simpler and more consistent fix is: **grammar
questions are Norwegian-only, full stop, at every level.** No locale switching, no partial i18n.

After this plan, "Nivå C is hardcoded to Norwegian" stops being a C-specific carve-out and becomes
just "grammar questions are in Norwegian" — the `forceNb` naming and comments in the codebase
should be updated to reflect that once this lands (see UI section below).

## Scope

**In scope — question-level content (`src/lib/data/grammar.json`), all non-C topics:**

- `prompt` — the per-question instruction line
- `hint` — the nudge shown after a wrong attempt
- `explanation` — shown on reveal for `minimal-pair` and `multiple-choice` types

**Not touched (already Norwegian):** `sentence`, `tokens`, `source`, `answer`, `alternates`,
`options`, `optionA`, `optionB`, `words`.

**In scope — UI (5 learner-facing spots, same set the C-level doc already audited and fixed):**

1. `src/lib/components/grammar/TopicCard.svelte`
2. `src/routes/grammar/+page.svelte` (`topicMatches` search logic + the locked-teaser card block)
3. `src/routes/grammar/[topic]/+page.svelte` (the `<h1>` page title)
4. `src/lib/components/grammar/AnswerReveal.svelte` (the rule-reminder box shown after every question)
5. `src/routes/learn/[level]/+page.svelte` (the grammar section on level-hub pages)

All 5 currently branch on a C-specific `forceNb` (`levels.includes('C')` or `question.cefr === 'C'`).
This plan makes Norwegian unconditional in all 5 — i.e. delete the `isNb`/locale branch entirely
for `GrammarRule` rendering, since every level now behaves like C already does.

**Not in scope:**

- `GrammarRule.titleEn`/`explanationEn` fields in `rules.ts` — kept but unused, same "future
  fallback" decision already made for C. No schema change, no data loss, smallest possible diff.
- Vocab (`vocab-*.json`), uttrykk (`uttrykk-*.json`), quiz mode, blog, Norskprøven content — none
  of this touches translated flashcard content, only grammar exercise scaffolding text.
- Paraglide UI chrome strings (buttons, nav, "Grammar" page title, etc.) — those stay
  locale-translated as normal; this plan is only about `GrammarRule`/`GrammarQuestion` content.

## Current state (verified against the real files)

| CEFR              |               Topics | Questions | Status                                 |
| ----------------- | -------------------: | --------: | -------------------------------------- |
| C                 |                   24 |       425 | ✅ Already Norwegian-only (prior plan) |
| A1                |                   23 |       254 | ✅ Done                                |
| A2                |                   14 |       119 | ✅ Done                                |
| B1                |                   13 |        76 | ✅ Done                                |
| B2                |                    2 |        10 | ✅ Done                                |
| **Total (non-C)** | **42 unique topics** |   **459** |                                        |

Note: several topics span multiple CEFR levels (e.g. `preposisjoner-sted` has A1+A2+B1 entries in
one topic bucket, `noun-plurals` has A1+A2+B1). The progress tracker below tracks by **topic**, not
by level, since a topic's questions live together in `grammar.json` and get converted in one pass
regardless of which CEFR levels they span. 42 topics total (not 23+14+13+2=52) because of this overlap.

## How to execute (mirrors the C-level workflow exactly)

**Setup:** repo root `/Users/shinichiokada/Svelte/svelte-languages/norskeord`, Filesystem tool
access required. Find the next topic to convert: the first `⬜` in the Progress tracker below.

**Per-topic steps:**

1. Read the topic's questions straight from the real file with `Filesystem:read_text_file`, or
   copy to sandbox with `Filesystem:copy_file_user_to_claude` + a throwaway `node -e` filter —
   need the exact current strings before writing any edits.
2. Translate `prompt`/`hint`/`explanation` only. Follow the "Translation approach" section below.
3. Apply edits with `Filesystem:edit_file`. **Same two pitfalls as the C-level effort — read
   before editing:**
   - Several topics reuse the exact same `prompt` string across multiple questions (e.g. "Choose
     «om» or «i».” repeated with only the sentence changing), and some strings appear verbatim in
     _other_ topics too. Check whether `old_str` is unique in the whole file before submitting; if
     not, widen the match to include the adjacent `sentence`/`source`/`id` line.
   - `edit_file` applies a batch atomically — one mismatched quote character (« » vs ' ' vs " ")
     rolls back the _entire_ batch, not just the broken entry. After any batch call, re-fetch the
     topic from the real file and diff against intent before moving on. If a batch fails, recover
     with per-question edits anchored on that question's unique `"id": "gq-xxx-NNN",` line.
4. Validate: copy the file back to the sandbox (`/home/claude/norskeord-check/src/lib/data/grammar.json`
   or wherever this session's sandbox check copy lives), then:
   ```
   node -e "JSON.parse(require('fs').readFileSync('src/lib/data/grammar.json','utf8')); console.log('VALID JSON')"
   node scripts/check-grammar-norwegian.mjs <topic-1> <topic-2> ...
   ```
5. If the checker flags something, check the "Known false-positive fixes" note in the script
   before assuming it's a real miss — Norwegian/English homographs (`is`, `for`, `form`, `verb`)
   cause false flags on genuinely correct Norwegian.
6. Once clean, mark the topic `✅ Done` in the Progress tracker below.

## Translation approach

Same rules as the C-level conversion:

- Preserve exact grammatical reasoning — a hint explaining _why_ a form is required must carry
  the same reasoning in Norwegian, not a loose paraphrase.
- Use Norwegian grammatical terminology (presens, bestemt form, refleksivt pronomen, etc.) — A1/A2
  content currently avoids this in favor of plain English ("Choose «om» or «i».", "Fill in the
  correct form"), so this is a bigger stylistic shift here than it was for C, where English hints
  already borrowed Norwegian terms as loanwords. Keep A1/A2 phrasing simple and concrete even in
  Norwegian — short clauses, no jargon beyond what's needed (e.g. "Velg «om» eller «i»." not a
  denser grammatical construction).
- Keep «...» quoted Norwegian example fragments exactly as-is.
- Natural instructional Norwegian, not machine-translated English syntax.
- `multiple-choice`/`minimal-pair` `explanation` fields keep the same reveal-after-answer role.

## Verification script

Generalize `scripts/check-c-grammar-norwegian.mjs` → `scripts/check-grammar-norwegian.mjs`:

- Same English-tell word list and matching logic.
- Drop the `C_TOPICS` filter — check every topic in `grammar.json` (C is already clean, so it'll
  report 0 hits there and serve as a regression guard going forward too).
- Keep the same `--strict` flag and per-topic filter args.
- Carry over the known false-positive exclusions already found for C (`form`, `verb`) — likely to
  recur, especially `form`/`verb`/`er`/`til` given A1/A2 sentences are simpler and more likely to
  hit short homographs. Expect to tune `ENGLISH_TELLS` further during the A1/A2 pass; note new
  exclusions here as they're found, same as the C doc does.

Once the generalized script exists, retire `check-c-grammar-norwegian.mjs` (or leave as a thin
wrapper) to avoid two scripts doing the same job.

## UI changes (do this after content conversion is fully done, not before)

Doing the UI flip before all 42 topics are converted would show raw English `prompt`/`hint`
strings with no way to fall back — worse than the current mixed state. Sequence: finish all
content conversion first, verify with the script at `--strict`, _then_ flip the UI.

In each of the 5 files listed in Scope:

- Remove the `isNb`/`localeStore.current` branch for `GrammarRule` title/explanation rendering.
- Rename `forceNb` → something that no longer implies "special-cased for C" (e.g. just inline
  `rule.titleNb`/`rule.explanationNb` directly, no derived boolean needed once it's unconditional).
- Update the comments referencing "Nivå C is hardcoded to Norwegian... see
  c-grammar-norsk-instruksjoner.md" to instead reference this doc and state the rule applies to
  all levels.
- `rules.ts`: no data changes, but update the file-level comment (if any) noting `titleEn`/
  `explanationEn` are now unused everywhere, not just for C, kept only as a possible future fallback.

After the UI flip, spot-check `/grammar`, `/grammar/[topic]` for an A1 and A2 topic, and
`/learn/a1` locally to confirm Norwegian renders regardless of the locale switcher.

## Progress tracker ✅ Done

42 topics, 459 questions. Grouped by primary/lowest CEFR level for a sensible working order
(A1 first — largest single-level block and the topics from the most recent `a1-update.md` work
are freshest in context), but note several topics carry questions from more than one level (see
counts).

**A1-primary topics (23):**

1. `personlige-pronomen` (10) ✅
2. `presens-verb` (10) ✅
3. `pronomen-objektsform` (10) ✅
4. `og-men` (8) ✅
5. `adverb-sted-hjem` (8) ✅
6. `refleksive-uttrykk` (8) ✅
7. `infinitiv-a1` (10) ✅
8. `substantiv-bestemt-form` (10) ✅
9. `pronomen-den-det-de` (8) ✅
10. `denne-dette-disse` (10) ✅
11. `imperativ` (8) ✅
12. `possessiver-min-din` (10) ✅
13. `refleksivt-possessiv-sin` (10) ✅
14. `ja-jo` (6) ✅
15. `preteritum-a1` (12) ✅
16. `for-a-fordi` (8) ✅
17. `vaer-det-subjekt` (8) ✅
18. `indirekte-tale-at-om` (8) ✅
19. `synes-tror` (8) ✅
20. `klokka-tid` (10) ✅
21. `ordenstall-dato` (8) ✅
22. `for-siden` (6) ✅
23. `modal-verb-order` (15, spans A1/A2/B1) ✅

**Shared A1/A2/B1 topics (9):**

24. `noun-articles` (18, A1/A2) ✅
25. `noun-plurals` (20, A1/A2/B1) ✅
26. `noun-possessives` (12, A1/A2/B1) ✅
27. `adj-agreement` (14, A1/A2) ✅
28. `helsetninger` (26, A1/A2/B1) ✅
29. `preposisjoner-tid` (22, A1/A2/B1) ✅
30. `preposisjoner-sted` (28, A1/A2/B1) ✅

**A2/B1 topics (10):**

31. `ikke-placement` (12) ✅
32. `det-sentence` (10) ✅
33. `det-er-ikke` (8) ✅
34. `v2-word-order` (9) ✅
35. `subordinate-order` (7) ✅
36. `setningsadverbial` (12) ✅
37. `adverbial-fronting` (12) ✅
38. `adj-definite` (4) ✅
39. `adj-comparison` (10) ✅
40. `sterke-verb` (16) ✅

**B2-primary topics (2):**

41. `relative-som` (5) ✅
42. `svar-ja-jo-nei` (5) ✅

**Total: 459 questions across 42 topics. All ✅ Done.**

## Open questions to confirm before starting

- **Ordering:** the tracker above front-loads A1 since it's freshest and largest. Fine to reorder
  if a different priority makes more sense (e.g. B2 first since it's only 2 topics/10 questions —
  a fast win to prove the workflow before the big A1 batch).
- **`modal-verb-order`/shared topics:** these mix A1/A2/B1 questions in one topic bucket — the
  whole topic gets converted in one pass (can't easily do "just the A1 half"), so treat each shared
  topic as a single unit of work regardless of how many levels it touches.
- **Timeline:** this is a large multi-session effort (459 questions vs. C's 425 — comparable
  size), same as the C-level conversion was. No rush; work through the tracker topic by topic
  across sessions same as before.

---

## Phase 2 — Grammar UI chrome goes Norwegian-only too

**Status: ✅ Done (implemented 2026-07-23).**

### Decision

Phase 1 (above) made `GrammarRule`/`GrammarQuestion` _content_ Norwegian-only but deliberately left
Paraglide UI chrome (buttons, labels, progress text) locale-translated, on the theory that content
and chrome are separate concerns. Revisiting that: every printed Norwegian textbook from A1 to C2
uses Norwegian as the instructional language throughout — not just for the exercises but for the
rubrics around them ("Sett inn riktig verbform", "Skriv om setningen", etc.). Norskeord's Grammar
(and later Quiz) sections are drilling grammatical competence, not vocabulary, and a learner doing
a B1 word-order exercise can read "Skriv setningen i riktig rekkefolge" — leaving that one string
in English while the rest of the exercise is Norwegian is inconsistent for no pedagogical reason.

Flashcards are explicitly excluded from this reasoning: their whole mechanic is bilingual recall
(Norwegian ↔ definition/translation), so locale-appropriate chrome serves the feature directly.
Grammar and Quiz chrome does not serve a comparable purpose.

### Scope

**In scope — Norwegian-only, hardcoded (no `m.*()` call, no `localeStore` branch), text taken
directly from the existing `nb.json` values so no new translation work is needed:**

1. `OrderQuestion.svelte` — `grammar_order_prompt`, `grammar_order_words`,
   `grammar_input_placeholder`, `grammar_check`, `grammar_skip`
2. `FillQuestion.svelte` — `grammar_fill_prompt`, `grammar_input_placeholder`, `grammar_check`,
   `grammar_skip`
3. `TransformQuestion.svelte` — `grammar_transform_prompt`, `grammar_input_placeholder`,
   `grammar_check`, `grammar_skip`
4. `MultipleChoiceQuestion.svelte` — `grammar_multiple_choice_prompt`, `grammar_skip`
5. `MinimalPairQuestion.svelte` — the prompt line here ("Which sentence is correct?") is a
   **pre-existing bug**: it's hardcoded English, never wired to Paraglide at all, so it has never
   respected the locale switcher. Fold the fix into this phase — hardcode it in Norwegian
   ("Hvilken setning er riktig?") same as the other four components — rather than wiring it to a
   new message key that would only need to be un-wired again immediately after.
6. `AnswerReveal.svelte` — the chrome parts only (`grammar_correct`, `grammar_incorrect`,
   `grammar_correct_answer`, `grammar_you_wrote`, `grammar_rule_label`, `grammar_read_more`,
   `grammar_next`, `grammar_see_results`, `grammar_continue_hint`). `ruleTitle`/`ruleText` are
   already hardcoded to `rule.titleNb`/`explanationNb` from Phase 1 — no change needed there.
7. `GrammarSummary.svelte` — the "Session complete!" score screen: `grammar_session_done`,
   `grammar_score`, `grammar_due_soon`, `grammar_you_wrote`, `grammar_restart`,
   `grammar_restart_hint`. In scope because it's the direct continuation of the practice session,
   not app navigation.

**Stays locale-translated (i18n), unchanged:**

- `GrammarSession.svelte` progress header — `grammar_question_count` ("Question X of Y"),
  `grammar_correct_so_far` ("X correct so far"). This sits above the question card, functions like
  a stats readout, not exercise content.
- `routes/grammar/[topic]/+page.svelte` breadcrumbs ("← A1", "Grammar topics →") — app navigation
  chrome, same bucket as nav/footer elsewhere in the app.
- `grammar_empty` ("No questions available for this topic yet.", shown on the rare empty-topic
  edge case in place of the question card) — a system/error state rather than instructional
  content, closer to Plus-locked messaging than to a question prompt.
- All Plus/paywall copy, explicitly kept as-is per this decision: `grammar_plus_locked_title`,
  `grammar_plus_locked_desc`, `grammar_plus_cta`, `grammar_plus_topic`, `grammar_more_topics_plus`,
  `grammar_plus_upsell_text`. Conversion/marketing copy is a different job than pedagogy — a free
  user deciding whether to upgrade is making a purchasing decision, not practising Norwegian.
- Everything already locale-translated outside the Grammar feature (nav, footer, Quiz, flashcards,
  Norskprøven, blog, profile, etc.) — out of scope for this doc entirely.

**Resolved (2026-07-23):** both open questions confirmed — `GrammarSummary.svelte` is in scope
(Norwegian-only), `grammar_empty` stays i18n. Ready to implement.

### Implementation notes

- No message-catalogue changes needed — the Norwegian strings already exist in `nb.json` for every
  key above except the `MinimalPairQuestion.svelte` bug fix, which was never a message key at all.
  Leave `en.json`/`es.json`/`uk.json`/`de.json` entries in place, unused by Grammar, same "kept but
  unused" treatment as `titleEn`/`explanationEn` in Phase 1 — smallest diff, no risk of breaking
  another feature that might reference the same keys.
- Per-component: delete the `import * as m from '$lib/paraglide/messages'` line only if nothing
  else in that file still needs it (check remaining usages first — e.g. some components may keep
  using `m.*()` for the CEFR badge or other bits not in scope here).
- Spot-check after implementing: run through one full session (all 5 question types, both correct
  and incorrect answers, through to the summary screen) with the interface locale set to something
  other than `nb`, to confirm no English/Spanish/Ukrainian/German leaks through anywhere inside the
  question box.
