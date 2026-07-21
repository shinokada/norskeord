# Nivå A1 Update — Remaining Quiz-File Content

## Overview

Follow-up to `ai-docs/implementation/a1-quiz-and-grammar.md`. That plan mined
`draft/a1/quiz/pa-vei.md` as _secondary_ source material for topics already being drafted from
`draft/a1/grammar/pa-vei.md` — it was never meant to guarantee 100% coverage of the quiz file on
its own. Auditing the result (see conversation) found a real gap: several quiz-file drills don't
map to any of the 26 existing A1 topic-touches and were correctly left out of `grammar.json`, but
some of that content is worth adding now.

**Finding on `vocab-a1.json` coverage (checked directly):** days of the week, months, and cardinal
numbers 0–19/20/30/40/50/100/1000 are **already fully present** (`days-months` and `numbers`
categories, 26 + 28 entries). No work needed there — `/quiz` already covers them.

**What's actually missing**, split by whether it's a _rule_ or a _word list_:

| Quiz-file content                                                | Ch. | Nature                                              | Destination                                                |
| ---------------------------------------------------------------- | --- | --------------------------------------------------- | ---------------------------------------------------------- |
| Telling time (kvart på, halv åtte, ti over halv seks)            | 3   | Rule (halv anchors to next hour; over/på placement) | new grammar topic                                          |
| Prepositions of place (i/på/bak/foran/under/over)                | 5   | Rule (same shape as existing `preposisjoner-tid`)   | new grammar topic                                          |
| Ordinal numbers + dates (tredje juni, 17.05. → syttende i femte) | 7   | Rule (ordinal formation + date phrasing pattern)    | new grammar topic                                          |
| «for … siden» (time-ago construction)                            | 8   | Rule (fixed pattern, parallel to `for-a-fordi`)     | new grammar topic                                          |
| Ordinal number words beyond første/andre (tredje…trettiende)     | 7   | Flat word list                                      | `vocab-a1.json` (`numbers`)                                |
| Bus/directions vocab (holdeplass, kilometer, minutt)             | 7   | Flat word list                                      | `vocab-a1.json` (`transportation`)                         |
| Housing/rent vocab (husleie, leie, eie, lån, spare)              | 7   | Flat word list                                      | `vocab-a1.json` (new `housing` category, or extend `home`) |

**Rationale for splitting:** a rule-governed pattern buried in a vocab flashcard loses the
explanation a learner actually needs (why "halv åtte" means 7:30, not 8:30). A flat word list
turned into a grammar topic bloats `/grammar` with a topic that teaches no rule. Matching the
existing precedent: `preposisjoner-tid` is already a grammar topic for a closed set of
prepositions used one way — `preposisjoner-sted` is the direct spatial counterpart.

**Vocab vs. uttrykk classification (per `data-rules/vocab-and-uttrykk.md`):** the split isn't
"vocab feeds quiz, uttrykk feeds grammar" — `/quiz`'s route loader (`src/routes/quiz/+page.ts`)
already pulls in every `uttrykk-{level}.json` alongside `vocab-{level}.json` for every level, and
`quiz.ts` is agnostic to which file an entry came from. The real split is **lexical unit-hood**:
a single word a learner inflects/conjugates/recombines → `vocab-a1.json`; a fixed multi-word chunk
with no single grammatical head, memorized as one piece → `uttrykk-a1.json`. Applied below.

**Checked `uttrykk-a1.json` directly and found more coverage than expected** — several quiz-file
ch. 7–8 items are _already_ present as uttrykk cards (theme `time-expressions`/`transportation`):
`for – siden` (u-a1-085, exactly the time-ago pattern), `Hvor lang tid tar det? Det tar sju
minutter med buss.`, `Hvor ofte går den? Hvert kvarter.`, `til fots`, `Hvor langt er det til
sentrum? Tre kilometer.`, `Hvor stopper bussen? På den andre siden av gata.`. So `/quiz` already
drills these — the gap for that content is purely on the `/grammar` side (the _rule_, not the
vocabulary), confirming the Part 1 topics below rather than duplicating Part 2 vocab work.

---

## Part 1 — New grammar topics (4)

### Topic table

| Topic                | Source (ch.) | Notes                                                                                             | Q's |
| -------------------- | ------------ | ------------------------------------------------------------------------------------------------- | --- |
| `klokka-tid`         | 3            | Telling time: hel/halv + kvart på/over + N over/på halv, matched to digital times                 | 10  |
| `preposisjoner-sted` | 5            | i/på/bak/foran/under/over for static location (not movement — that's `adverb-sted-hjem`)          | 8   |
| `ordenstall-dato`    | 7            | Ordinal formation (tredje, sjuende, syttende) + date phrasing ("den 3. juni" / "tredje i sjette") | 8   |
| `for-siden`          | 8            | «for + duration + siden» = time elapsed since an event: "for to uker siden"                       | 6   |

**Subtotal: ~32 new questions across 4 new topics.**

`for-siden` reuses the existing `uttrykk-a1.json` card (`u-a1-085`, "for – siden") as its seed
example — no new vocab/uttrykk entry needed for this one, just the grammar-topic explanation and
practice questions the uttrykk card doesn't provide.

### Rule drafts (`src/lib/grammar/rules.ts`)

```typescript
'klokka-tid': {
  id: 'klokka-tid',
  titleEn: 'Telling time',
  titleNb: 'Klokka',
  explanationEn:
    '«Halv» + a number means half past the PREVIOUS hour: "halv åtte" = 7:30, not 8:30. ' +
    '«Kvart over/på» and «N minutter over/på» work the same way, anchored to the nearest hour or ' +
    'half-hour: "ti på halv sju" = 6:20, "fem over halv seks" = 5:35.',
  explanationNb:
    '«Halv» + et tall betyr halv time før timen: "halv åtte" = 7.30, ikke 8.30. «Kvart over/på» ' +
    'og «N minutter over/på» fungerer på samme måte, forankret til nærmeste hele eller halve time.'
},

'preposisjoner-sted': {
  id: 'preposisjoner-sted',
  titleEn: 'Prepositions of place',
  titleNb: 'Preposisjoner: sted',
  explanationEn:
    'i (inside), på (on/at), bak (behind), foran (in front of), under (under), over (above) each ' +
    'describe a fixed spatial relationship: "Boka ligger på bordet." "Katten ligger under stolen." ' +
    'These don\'t change with movement — compare `adverb-sted-hjem` for inn/ut/hjem.',
  explanationNb:
    'i, på, bak, foran, under, over beskriver et fast romlig forhold: "Boka ligger på bordet." ' +
    '"Katten ligger under stolen."'
},

'ordenstall-dato': {
  id: 'ordenstall-dato',
  titleEn: 'Ordinal numbers and dates',
  titleNb: 'Ordenstall og dato',
  explanationEn:
    'Ordinals (tredje, sjuende, syttende) mostly add -ende to the cardinal, with irregulars for ' +
    '1st–4th (første, andre, tredje, fjerde). Dates combine day-ordinal + month-ordinal: "17.05." ' +
    '= "syttende i femte", or day-ordinal + month name: "den 17. mai."',
  explanationNb:
    'Ordenstall (tredje, sjuende, syttende) legger for det meste til -ende til grunntallet, med ' +
    'uregelmessige former for 1.–4. (første, andre, tredje, fjerde). Datoer kombinerer ' +
    'dag-ordenstall + måned-ordenstall: "17.05." = "syttende i femte."'
},

'for-siden': {
  id: 'for-siden',
  titleEn: '«for … siden» (time ago)',
  titleNb: '«for … siden»',
  explanationEn:
    'To say how long ago something happened, Norwegian frames the duration with «for» … «siden»: ' +
    '"for to uker siden" (two weeks ago), "for en time siden" (an hour ago).',
  explanationNb:
    'For å si hvor lenge siden noe skjedde, rammer norsk inn tidsrommet med «for» … «siden»: ' +
    '"for to uker siden," "for en time siden."'
}
```

### Content plan (`src/lib/data/grammar.json`)

Same conventions as the original plan: IDs `gq-{short-topic}-00X`, A1 sentences 5–8 words,
vocabulary cross-checked against `vocab-a1.json`/`uttrykk-a1.json` (extended per Part 2 first, so
`klokka-tid` and `ordenstall-dato` can actually use the new number/time words). Type mix:
`klokka-tid` and `ordenstall-dato` lean `fill`/`transform` (digital time ↔ text time, date ↔
ordinal phrase); `preposisjoner-sted` leans `fill` with a static scene per item; `for-siden` leans
`transform` (present-tense event + elapsed time → "for X siden" sentence).

### Gating

Add all 4 to `FREE_GRAMMAR_TOPICS` in `config.ts`, consistent with the decision made for all other
A1 topics in Phase 4 of the original plan (A1 stays fully free/discoverable). `plusOnly: false` on
every new question, same as the rest of A1.

### Types / admin wiring

- Add 4 new entries to `GrammarTopic` in `src/lib/types.ts`.
- Add the same 4 to the admin `+page.svelte` `TOPICS` constant (same gap already flagged and
  worked around in the original A1 plan and in `c-grammar.md` — still worth fixing eventually, out
  of scope here).

---

## Part 2 — Vocab additions (`src/lib/data/vocab-a1.json`)

No schema changes — same `norsk`/`lemma`/`english`/`ukrainian`/`spanish`/`german`/`example`/
`example_*`/`level`/`category`/`part` shape as existing entries. `/quiz` picks these up
automatically at next build; no `quiz.ts` changes needed.

Every item below passes the `data-rules/vocab-and-uttrykk.md` decision rule's first question —
"does this function as a lexical item learners inflect/conjugate/recombine normally?" — so all of
it is `vocab`, not `uttrykk`. Checked each against both files directly; corrections from the first
draft of this plan are noted.

| Addition                                                             | Part          | Category               | Count |
| -------------------------------------------------------------------- | ------------- | ---------------------- | ----- |
| i, på, bak, foran, under, over                                       | `preposition` | new `prepositions`     | 6     |
| Ordinals tredje–trettiende (3rd–30th), reusing existing første/andre | `numeral`     | `numbers`              | ~15   |
| holdeplass                                                           | `noun`        | `transportation`       | 1     |
| kilometer, minutt, sentrum                                           | `noun`        | `transportation`       | 3     |
| husleie, lån                                                         | `noun`        | new `housing` category | 2     |
| leie, eie, spare                                                     | `verb`        | new `housing` category | 3     |

**Correction from the first draft:** `kilometer`, `minutt`, `meter`, `sentrum`, and `kvart` looked
like gaps but are already present — each shows up inside an existing `uttrykk-a1.json` sentence
card (see the coverage note above). Only `holdeplass` is a genuine gap in that group. Decision:
add `kilometer`/`minutt`/`sentrum` anyway as standalone `vocab` noun cards under `transportation`
so they're lemma-lookupable on their own, not just embedded in a fixed Q&A uttrykk sentence.
`meter` and `kvart` are left as-is (uttrykk-only) — not requested.

**Decision: new `prepositions` category.** `vocab-a1.json` has zero `preposition`-part entries
today (checked directly), so there's no existing category to fold into. `prepositions` matches the
naming pattern of other function-word-adjacent categories (`numbers`, `transportation`) and keeps
the 6 place prepositions together and easy to browse as a set.

**Decision: new `housing` category**, kept separate from `home` — `home` is furniture/rooms
vocabulary, `housing` is financial/tenancy vocabulary (husleie, lån, leie, eie, spare); different
enough semantically that a learner browsing by category would expect them apart.

Run a lemma-uniqueness check across categories after adding (no duplicate `lemma` values) rather
than writing a fresh verification script.

---

## Implementation phases

### Phase 1 — Types + rules ✅ Done

1. Add 4 new topics to `GrammarTopic` (`src/lib/types.ts`). ✅ (`preposisjoner-sted` already existed, so only `klokka-tid`, `ordenstall-dato`, `for-siden` were newly added.)
2. Add 4 new `GrammarRule` entries to `rules.ts` (drafted above). ✅ (plus extended `preposisjoner-sted`'s explanation to lead with the simple bak/foran/under/over set before the advanced hos/ved/av/compound material.)

### Phase 2 — Vocab additions ✅ Done

1. Add place prepositions (new `prepositions` category), ordinals, `holdeplass` +
   `kilometer`/`minutt`/`sentrum` (`transportation`), and housing vocab (new `housing` category)
   to `vocab-a1.json` (Part 2 table). `meter`/`kvart` stay uttrykk-only, per decision above. ✅
   (Added 34 entries total: 6 prepositions, 19 ordinals tredje–trettiende [expanded from the ~15
   estimate to include sekstende/syttende/attende/nittende, since "syttende" is used directly in
   the `ordenstall-dato` rule example], holdeplass + kilometer/minutt/sentrum, and 5 housing words.
   Ordinals use `part: 'adjective'` to match the existing første/andre precedent, not `numeral` as
   originally tabled. Also added `prepositions`/`housing` to `CATEGORIES_BY_LEVEL.A1` in
   `config.ts`. Lemma-uniqueness check passed — no duplicates introduced.)
2. Spot-check `/quiz` locally with `?level=a1` to confirm new entries surface. ✅ Confirmed via
   screenshot — Housing, Prepositions, and Transportation all appear correctly in the `/quiz?level=a1`
   category picker.

### Phase 3 — Grammar content ✅ Done

1. Wrote 32 questions across the 4 topics: `klokka-tid` (10), `preposisjoner-sted` A1 entries (8,
   inserted after the existing `gq-prep-sted-020`), `ordenstall-dato` (8), `for-siden` (6) — in
   chapter order, cross-checked against the updated `vocab-a1.json`.

### Phase 4 — Gating + wiring ✅ Done

1. Added the 4 topics to `FREE_GRAMMAR_TOPICS` in `config.ts`. ✅
2. Added the 4 topics to the admin `TOPICS` constant in `src/routes/admin/grammar/+page.svelte`. ✅
3. `/grammar` and `/grammar/[topic]` need no route changes — topic list is derived from
   `grammar.json` content. ✅ (confirmed, no route edits needed)

### Phase 5 — Testing ✅ Done

1. `scripts/check-a1-grammar-vocab.mjs` was updated with the 4 new topics added to its `A1_TOPICS`
   set (23 new + 7 reused topics). ✅
2. Ran the script against all 32 new questions: **0 unmatched** — every question has a real
   `vocab-a1.json`/`uttrykk-a1.json` headword. ✅
3. Verified `grammar.json` is valid JSON, 884 total questions, no duplicate `id`s, and topic counts
   match plan (klokka-tid: 10, ordenstall-dato: 8, for-siden: 6, preposisjoner-sted A1: 8). ✅
4. Verified `types.ts` `GrammarTopic` union includes all 4 topics correctly. ✅

**Plan complete.** All 5 phases done — 4 new grammar topics, 32 questions, 34 vocab entries, 2 new
categories (`prepositions`, `housing`), full gating + admin wiring, vocab validation passing clean.
Remaining manual step: spot-check `/grammar` locally (`klokka-tid`, `preposisjoner-sted`,
`ordenstall-dato`, `for-siden`) to confirm rendering, since this session had no dev server access.

---

## Decisions (resolved)

- **`housing` is a new vocab category**, not folded into `home` — `home` is furniture/rooms,
  `housing` is financial/tenancy vocabulary (husleie, lån, leie, eie, spare).
- **Place prepositions get a new `prepositions` category.** No precedent existed in
  `vocab-a1.json`; `prepositions` was chosen as the simplest, most discoverable option.
- **`kilometer`/`minutt`/`sentrum` are added as standalone vocab cards** under `transportation`,
  in addition to their existing `uttrykk-a1.json` sentence-card coverage. `meter`/`kvart` are left
  uttrykk-only (not requested).
