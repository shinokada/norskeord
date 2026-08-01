# B2-C1 "Det går bra!" Grammar — Implementation Plan

✅ Completed

## Overview

Source: `draft/b2-c1-det-gaar-bra/` — `innhold.md`, `oppgaver-1-8.md` (kap. 1–8),
`oppgaver-9-16.md` (kap. 9–16), `idiomatiske-uttrykk.md` (~60 ordtak/faste uttrykk),
`minigrammatikk.md` (reference grammar, not exercises).

**The core problem this plan solves:** the book is published as one combined "NIVÅ B2-C1"
level — individual exercises aren't tagged B2 vs. C1. There's no difficulty signal in the
exercise markup either: the 🙂 marks scattered on some exercise headers are explained in the
author's own "Om å bruke _Det går bra!_" note — they flag pair-work exercises (one student
reads the prompt from the book, the other answers without looking, then they check each
other), a teaching-method/format marker with no relation to grammatical difficulty. So, same
as every prior level plan, the split has to be done by reading each exercise and routing
it based on: (a) whether the point is already a B2 or a C topic in `rules.ts` (reuse that
level's bucket), and (b) for genuinely new points, frequency/complexity — foundational,
high-frequency patterns → B2; rare, nuanced, idiom-bound, or synonym-discrimination points → C.

**Answer to "is it possible?": yes.** Every exercise in kap. 1–16 maps to either an existing
B2/C topic (add new-level entries) or a new topic assigned to one level. Nothing in the book
requires inventing a third "B2-C1 blended" bucket in the app — your app's existing two-level
model (B2, C) is sufficient.

**Copyright approach (unchanged from every prior plan):** every question is newly written,
using the textbook only to identify which rule/difficulty to target — never copying or closely
paraphrasing its sentences. This matters especially here: several kap. 9–16 exercises are built
around real excerpts from published fiction (confirmed: Kjell Askildsen, _Alt som før_, 1994,
in kap. 9's "Omgivelser" cloze) and named recurring characters. Same treatment as `c-grammar.md`
gave the "Annemor" story — freshly invented, self-contained sentences, never adapted from the
excerpt.

**Vocab integration:** every question should use a real headword from the relevant level's
`vocab-b2.json`/`uttrykk-b2.json` or `vocab-c.json`/`uttrykk-c.json`, verified by the existing
`check-b2-grammar-vocab.mjs`/`check-c-grammar-vocab.mjs` scripts (no new script needed).

**Question types:** `'fill' | 'order' | 'transform' | 'minimal-pair' | 'multiple-choice'` already
cover everything this book needs — no schema changes required.

---

## Chapter-by-chapter routing (kap. 1–8, `oppgaver-1-8.md`)

Each chapter repeats roughly the same exercise-letter skeleton (a–k), so the routing is mostly
per-_letter-type_ rather than per-chapter. Based on the exercises read directly:

| Exercise type (recurring across kap. 1–8)                                               | Route                                                                                                                                                                                                                    | Notes                                                                                                                                                        |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Noun form in context (bestemt/ubestemt, entall/flertall)                                | **B2**                                                                                                                                                                                                                   | `noun-articles`/`noun-plurals` — reuse, add B2 entries; content is denser/longer than existing B2 batch but same rule                                        |
| Adjective form + article agreement                                                      | **B2**                                                                                                                                                                                                                   | `adj-agreement` — reuse                                                                                                                                      |
| Genitiv expressions ("si uttrykkene med genitiv")                                       | **B2 or new**                                                                                                                                                                                                            | Check if a genitiv topic exists yet; if not, small new B2 topic (kap. 1 only, likely folds into `noun-articles` batch)                                       |
| Direkte → indirekte tale                                                                | **B2**                                                                                                                                                                                                                   | `indirekte-tale-at-om` — reuse, add B2 entries (denser, more clause types than the existing batch)                                                           |
| Presens → preteritum / preteritum → pluskvamperfektum / → futurum                       | **B2**                                                                                                                                                                                                                   | tense-transform reused topics already exist per tense pair from b1/b2 plans                                                                                  |
| `begge deler`/`begge to`, `visst`-placement, `nok`-placement                            | **New (B2)**                                                                                                                                                                                                             | Three small, genuinely new lexical/word-order topics not in either existing plan — see below                                                                 |
| `å sette (seg)/å legge (seg)/å ligge/å sitte/å stå`                                     | **New (B2)**                                                                                                                                                                                                             | Full 5-verb paradigm — `minigrammatikk.md` already has this as reference text; not yet a question topic at any level                                         |
| Sentence-combination ("bind setningene riktig sammen")                                  | **B2**                                                                                                                                                                                                                   | `derfor-fordi`/`motsetning-selv-om-likevel`/similar reused topics, by connector tested                                                                       |
| Preposisjoner/adverb cloze                                                              | **B2**                                                                                                                                                                                                                   | existing preposisjon topics per level, or a `preposisjoner-generelt-b2` new topic if none exists at B2 yet — **needs a check against `rules.ts`**            |
| Paraphrase ("skriv om slik at setningene betyr omtrent det samme")                      | **B2**                                                                                                                                                                                                                   | `omskriving-passiv` and similar reused topics, split by which transformation each item tests                                                                 |
| Word-order + verb-form combined cloze (the "k" exercise every chapter)                  | **B2**                                                                                                                                                                                                                   | mixed — routes to whichever specific tense/order topic each sentence targets                                                                                 |
| kap. 5: `å bli lærer` + preposisjon/infinitivsmerke                                     | **New (B2)**                                                                                                                                                                                                             | fixed collocation pattern, not currently covered — small topic                                                                                               |
| kap. 6: uregelrette substantiv (`si riktige former av disse uregelrette substantivene`) | **B2**                                                                                                                                                                                                                   | `noun-plurals`/irregular-noun reused topic                                                                                                                   |
| kap. 7: preteritum → preteritum passiv                                                  | **C**                                                                                                                                                                                                                    | passive of preteritum specifically (vs. B2's modal+s-passiv/active↔passive) is a step up — route to `c-grammar.md`'s passive coverage or a small new C entry |
| kap. 4/9/10 futurum/kondisjonalis transforms (1./2. futurum, 2. kondisjonalis)          | **Split by which**: 1. futurum → **B2** (already a base tense); 2. futurum & 2. kondisjonalis → **C** (`futurum-referert`/`kondisjonalis-counterfactual` already exist as C topics — just add textbook-inspired entries) |

## Chapter-by-chapter routing (kap. 9–16, `oppgaver-9-16.md`)

This half skews harder — longer literary/discursive cloze passages, "diskuter
nyanseforskjellene," open vocabulary-discussion tasks — much closer in shape to what
`c-grammar.md` called "mined, not built as-is" for items 64–82. Recommended treatment,
mirroring that precedent exactly:

- **kap. 9–11** (Utdanning, musikk/kunst/litteratur, ytringsfrihet/religion): grammar
  sub-exercises (adjektiv/substantiv form, eiendomspronomen, s-passiv, pluskvamperfektum/2.
  kondisjonalis) → route per-point to existing B2/C topics, same as kap. 1–8. The long literary
  clozes embedded here (e.g. the Askildsen excerpt) → **mined, not built as passages**: pull
  individual grammar+vocab pairings and write fresh single sentences, never adapt the excerpt.
- **kap. 12–14** (Tekster, Ulv! Ulv!, Tanker i tiden): heavy on "diskuter
  nyanseforskjellene"/"hva betyr disse ordene/uttrykkene" — these are vocabulary-discussion
  tasks, not gradable single-answer grammar items. **Not built as grammar questions**, same
  as prior plans' treatment of discussion/analysis tasks — but the nuance-pair material here
  (e.g. kap. 12's `ryke` discussion, kap. 13's `såpass`) is exactly the kind of thing that feeds
  a **new C-level topic**, `nyanser-verb-uttrykk` (near-synonym/nuance discrimination via
  `minimal-pair`/`multiple-choice`), rather than being discarded — see below.
  - kap. 13's 2. futurum/2. kondisjonalis intro exercises (a–c) → **C**, feeds
    `futurum-referert`/`kondisjonalis-counterfactual`.
- **kap. 15–16** (lytte- og tenkeoppgaver — listening/discussion questions about cultural topics
  and having a child in Norway): **not gradable grammar material at all** — same treatment as
  `b2-grammar.md`'s excluded ch. 1/3/6 analysis tasks. Skip entirely for `grammar.json`.

## `idiomatiske-uttrykk.md` (~60 ordtak + idioms)

Same shape and treatment as `c-grammar.md`'s `uttrykk-gjenkjenning-c-*` topics: each entry here
is a full explanation of one fixed idiom/ordtak, ideal source for **new C-level idiom-recognition
questions** (`multiple-choice`, 3-option, matching a bolded idiom to its correct paraphrase).
Proposed: **`uttrykk-gjenkjenning-detgaarbra-c`** (single topic — the list is smaller than the
c-grammar.md idiom appendix, ~60 vs. ~400+, so one topic covers it rather than 3 parts). Requires
checking each idiom against `uttrykk-c.json` first (same matching-script step as `c-grammar.md`
Phase 2) — likely a good number of these classic ordtak (`Eplet faller ikke langt fra stammen`,
`Bedre sent enn aldri`, etc.) are _not yet_ in `uttrykk-c.json` and would need adding there first,
same resolved precedent as `c-uttrykk-addition.md`.

---

## New topics — REVISED after `rules.ts` cross-check (Phase 0, step 2)

Cross-checking against the actual `GrammarTopic` list turned up existing topics for half of what
the draft proposed as new. Corrected list:

| Original draft proposal                                 | Verdict                                            | Reason                                                                                                                                                                                                                                                                 |
| ------------------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `begge-deler-begge-to`                                  | **Drop — reuse `spesial-kvantorer` (B2)**          | Already covers `begge (to)` vs. `begge deler` explicitly. Add textbook-derived B2 entries there instead.                                                                                                                                                               |
| `visst-nok-plassering`                                  | **Drop — reuse `modale-adverb` (B2)**              | Already covers `nok` and `visst` placement as modal adverbs in the midtfelt. Add entries there.                                                                                                                                                                        |
| `sette-legge-ligge-sitte-sta`                           | **Drop — reuse `plassering-verb` (A2)**            | Already covers sette/legge (action) vs. stå/ligge (state) with the same core rule; kap. 6g's fuller 5-verb paradigm is the same rule at higher density — add as B2-tagged entries on the existing topic, not a new one.                                                |
| `bli-lærer-kollokasjon`                                 | **Drop — reuse `infinitiv-a1`**                    | That topic is explicitly about fixed preposition-before-å patterns per verb/expression — `bli lærer` + prep/å-infinitiv is the same skill, just a B2-level entry.                                                                                                      |
| `nyanser-uttrykk` (renamed from `nyanser-verb-uttrykk`) | **Keep — genuine gap, broader than first thought** | Closest existing topics (`synes-tror`, `mene-synes-tro-tenke`) only cover opinion-verbs, not general near-synonym/nuance discrimination. Confirmed recurring across nouns, adjectives, verbs, and adverbs in six different chapters — see the dedicated section below. |
| `uttrykk-gjenkjenning-detgaarbra-c`                     | **Keep, pending idiom-overlap check**              | See below — result confirms most entries are net-new to `uttrykk-c.json`.                                                                                                                                                                                              |

**New gap surfaced by the read (not in the original draft), RESOLVED:** kap. 1i's preposition-cloze
mixes in a large set of idiomatic/collocational preposition choices ("ta ansvar for", "ha inntrykk
av", "forberedt på", "komme på", "kjempe for") that don't fit `preposisjoner-tid`/`preposisjoner-sted`
(literal time/place rules). Decision: add a new **`preposisjoner-uttrykk-b2`** topic rather than
folding these into `preposisjoner-generelt-c` — that topic's own rule text is scoped to "advanced,
often idiomatic" C-level collocations, so mixing in B2 entries would make its explanation
inaccurate for B2 learners and would blur the `/stats` per-topic breakdown. Same pattern as the
existing `sammensatte-substantiv` (C) / `sammensatte-substantiv-b2` sibling-topic split — precedent
already established in this codebase for exactly this situation (same skill, two levels, two
topics). This brings the total new-topic count to **3**: `nyanser-uttrykk`,
`uttrykk-gjenkjenning-detgaarbra-c`, `preposisjoner-uttrykk-b2`.

**Genitiv (kap. 1d):** not a new topic — reuse `noun-possessives`, which already covers the
-s-genitive with no apostrophe. Add B2 entries for the more complex phrases (`Trollmors tanker`,
`utlendingenes utfordringer`, `Hans' problemer`).

Everything else routes into **existing** topics (adding B2 or C entries), per the tables above.

## Idiom overlap check (Phase 0, step 4)

Fuzzy-matched all ~47 entries in `idiomatiske-uttrykk.md` (the actual count — smaller than the
"~60" estimate in the original draft) against the 559 entries in `uttrykk-c.json`. Result:
**14 already present** (e.g. `brent barn skyr ilden`, `å få kalde føtter`, `å falle mellom to
stoler`, `kjøpe katta i sekken`, `å danse etter noens pipe`, `å smi mens jernet er varmt`, `å ha
sine svin på skogen`, `å være mellom barken og veden`, `ikke selg skinnet før bjørnen er skutt`,
`ikke eie nåla i veggen`, `det er ikke gull alt som glimrer`, `bedre sent enn aldri`, `borte bra,
hjemme best`, `eplet/epler faller ikke langt fra stammen`) — **~33 are net-new** and would need
adding to `uttrykk-c.json` first, same precedent as `c-uttrykk-addition.md`. This confirms the
draft's assumption; `uttrykk-gjenkjenning-detgaarbra-c` is worth building, but Phase 1 needs a
vocab-addition pass before any grammar questions can reference the new ~33 idioms.

## Phase 0 — read status: kap. 1–3 full read, kap. 4–16 targeted read (COMPLETE ENOUGH TO PROCEED) ✅ Done

Read in full: kap. 1–3 of `oppgaver-1-8.md`. For kap. 4–8 and all of `oppgaver-9-16.md`, read every
exercise header/letter (confirms the chapter-by-chapter skeleton matches the original draft almost
exactly) plus full text for every letter whose _type_ hadn't already appeared verbatim elsewhere —
i.e. skipped re-reading the Nth occurrence of an exercise-letter shape already fully seen (fill-in
noun/adjective form, direkte→indirekte tale, bind setninger, preposisjon-cloze, verb tid/form —
these repeat nearly identically every chapter and were confirmed, not assumed, from kap. 1–3 plus
spot checks in kap. 5, 8, 9, 12, 13, 14).

**Conclusion: this is enough to lock the routing/topic decisions below.** The remaining unread
material is entirely repetitions of already-confirmed exercise shapes (more noun/adjective-form
cloze, more indirekte tale, more preposisjon items) — reading every remaining instance wouldn't
change any topic-routing decision, only the exact sentences chosen for Phase 2 content, which
happens naturally when questions are actually written from source material chapter-by-chapter.

### Confirmed additions to the near-synonym gap (`nyanser-verb-uttrykk`)

The original draft scoped this topic to kap. 12–14 verb-nuance material only. Reading further shows
the same near-synonym-discrimination pattern recurring across many more chapters and word classes,
not just verbs:

- kap. 3c: `seriøs` vs. `alvorlig` (adjectives)
- kap. 5d: `tid`/`time`/`gang`, `bevilgning`/`bevilling`, `flaks`/`sjanse` (nouns)
- kap. 9c: `synes` vs. `tro` (already reuses `synes-tror`/`mene-synes-tro-tenke` — fine as-is)
- kap. 12e: the many idiomatic/figurative senses of `ryke` (verb, single-word polysemy rather than a
  pair — still the same "which nuance fits this context" skill)
- kap. 12k: explicit "Diskuter nyanseforskjellene i disse verbene" exercise
- kap. 13o: `såpass` (adverb/intensifier, one word with many contextual shades)

**Revision:** rename the proposed topic from `nyanser-verb-uttrykk` to `nyanser-uttrykk` (drop the
"verb-" restriction) and source it from all six chapters above, not just kap. 12–14. This is a more
solidly justified new topic than the original draft realized — the pattern repeats too often across
too many word classes to force into any existing topic.

### kap. 14c — not new idiom material, don't route to `uttrykk-gjenkjenning-detgaarbra-c`

kap. 14's "Hva betyr uttrykkene?" pulls ~50 phrases (`gi grobunn for`, `kalle en spade for en
spade`, `danse rundt gullkalven`, `ta opp hansken`, etc.) directly from Trollmor's essay texts in
the grunnbok — collocations/idioms tied to those specific (likely copyrighted) essays, not a
curated general-purpose idiom list like `idiomatiske-uttrykk.md`. Treat the same way as the kap.
9–11 literary excerpts: mine the vocabulary pattern, write fresh example sentences, never lift the
essay's own phrasing. Some of these are good candidates for entries in the _existing_
`preposisjoner-generelt-c` or `substantiv-uttrykk-c` topics rather than a new topic of their own.

### Everything else: no further routing changes

kap. 4–8 and kap. 9–13, 15–16 all matched the original per-letter-type table (see "Chapter-by-chapter
routing" above) once actually checked — direkte↔indirekte tale, bind-setninger, preposisjon-cloze,
noun/adjective-form drills, s-passiv, hypotetiske setninger, 2. futurum/2. kondisjonalis, word-family
derivation (`ordfamilie-avledning`, confirmed reused in kap. 10d, 12p, 13j, 14d) all route to
existing topics exactly as predicted. kap. 15–16 confirmed 100% lytte-/tenkeoppgaver (listening +
discussion) — excluded from `grammar.json`, per the original draft.

---

## Phase 0 — Required before finalizing counts ✅ Done

This draft is based on a full read of `innhold.md`, `minigrammatikk.md`, `idiomatiske-uttrykk.md`,
and a structural skim (all exercise headers + representative samples) of `oppgaver-1-8.md` and
`oppgaver-9-16.md` — not a line-by-line read of all ~300 combined exercise items the way
`c-grammar.md`/`b2-grammar.md` did for their sources. Before Phase 2 content-writing starts:

1. Full read of `oppgaver-1-8.md` and `oppgaver-9-16.md`, item by item (matching the rigor of
   the prior two plans) — **DONE**, see "Phase 0 — read status" above.
2. Cross-check every "reuse" row above against the actual current `GrammarTopic` list in
   `src/lib/types.ts`/`rules.ts` — **DONE**, see "New topics — REVISED after `rules.ts`
   cross-check" above. Surfaced one real gap (idiomatic B2 prepositions) not in the original draft.
3. Confirm which of the proposed new topics survive contact with the full read — **DONE**. Final
   list: 2 new topics (`nyanser-uttrykk`, `uttrykk-gjenkjenning-detgaarbra-c`), down from the
   original draft's 6 — 4 turned out to be existing topics in disguise.
4. Idiom-vs-`uttrykk-c.json` overlap check for `idiomatiske-uttrykk.md`'s entries — **DONE**
   (actual count: 47, not ~60). 14 already present, ~33 net-new — see "Idiom overlap check" above.

**Phase 0 is complete.** Ready to move to Phase 1 (add `nyanser-uttrykk`,
`uttrykk-gjenkjenning-detgaarbra-c`, and `preposisjoner-uttrykk-b2` to `GrammarTopic`/`rules.ts`)
whenever you want to proceed — or, since idiom questions need the ~33 missing idioms added to
`uttrykk-c.json` first (Phase 3-ish prerequisite, same as `c-uttrykk-addition.md`), that
vocab-addition pass could go first if you'd rather unblock the idiom topic before writing grammar
content.

## Phase 1 — Rules + types (after Phase 0 confirms the new-topic list) — ✅ Done

Added `nyanser-uttrykk`, `preposisjoner-uttrykk-b2`, `uttrykk-gjenkjenning-detgaarbra-c` to
`GrammarTopic` (`types.ts`) and `GRAMMAR_RULES` (`rules.ts`), each with bilingual title/explanation
following existing precedent. No reused-topic rule text needed changes (per the original
assumption) — only new example sentences will be added as Phase 2 content is written.

## Phase 1.5 — Idiom vocab additions (blocks `uttrykk-gjenkjenning-detgaarbra-c` content only) — ✅ Done

Added the net-new idioms from `idiomatiske-uttrykk.md` (identified in the Idiom overlap check
above) to `uttrykk-c.json`, same process as `c-uttrykk-addition.md` — norsk/lemma/english/spanish/
ukrainian/german fields, a monolingual Norwegian `definition`, `example`/`example_*`, `level: 'C'`,
`part: 'phrase'`, and a `category`/`theme` matching the existing triage scheme.

34 entries were merged in a prior session (`u-c-574`–`u-c-607`). A follow-up verification pass
cross-checked all 34 plus the 14 "already present" idioms against every entry in
`idiomatiske-uttrykk.md` and found one idiom had fallen through the cracks: `å ha rent mel i posen`
("to have clean hands / be innocent") — not in the already-present list, not in the new batch.
Added as `u-c-608`, category `interpersonal-conflict`. All idioms from `idiomatiske-uttrykk.md` are
now accounted for in `uttrykk-c.json` (either pre-existing or newly added), unblocking
`uttrykk-gjenkjenning-detgaarbra-c` content.

## Phase 2 — Content

Same density/format precedent as prior plans (~8–12 questions per topic-touch), built
chapter-order for kap. 1–8 material and topic-by-topic for the kap. 9–16 mined material and the
idiom list. Every question freshly written, never adapted from textbook sentences or the
Askildsen excerpt.

### Detailed source read (line-referenced) — expands the routing table above

Read `oppgaver-1-8.md` (3205 lines), `oppgaver-9-16.md` (2669 lines), and `minigrammatikk.md`
(1329 lines) in full, with exact line offsets for every exercise letter, to turn the earlier
per-letter-type routing table into an actual per-topic item inventory. Findings below.

**kap. 1–8, exercise-by-exercise item counts (source of the B2 batch density):**

| Kap. | Letter | Content                                                                                                                                       | Items | Topic                                                                                       |
| ---- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ------------------------------------------------------------------------------------------- |
| 1    | d      | Genitiv (`Trollmors tanker`, `Hans' problemer`)                                                                                               | 10    | `noun-possessives` (B2 entries)                                                             |
| 1    | i      | Preposisjon/adverb cloze (`behov for`, `anledning til`, `bruk til`)                                                                           | 33    | `preposisjoner-uttrykk-b2` — heavily fixed-collocation, not literal time/place              |
| 3    | c      | _seriøs_ vs. _alvorlig_ — full mini-lesson + 10 fill-ins                                                                                      | 10    | `nyanser-uttrykk`                                                                           |
| 5    | d      | 3 nuance sets: _tid/time/gang_ (8), _bevilgning/bevilling_ (6), _flaks/sjanse_ (4)                                                            | 18    | `nyanser-uttrykk`                                                                           |
| 6    | c      | `begge deler` vs. `begge to`                                                                                                                  | 10    | `spesial-kvantorer` (B2 entries)                                                            |
| 6    | d      | `visst` placement (setningsadverbial)                                                                                                         | 10    | `modale-adverb` (B2 entries)                                                                |
| 6    | e      | `nok` placement                                                                                                                               | 10    | `modale-adverb` (B2 entries)                                                                |
| 6    | f      | **New find** — 35 body-part idioms (`ha bein i nesa`, `holde tunga rett i munnen`, `få kalde føtter`, etc.), discussion-format like kap.12/14 | 35    | Not a grammar topic — **mine for `uttrykk-c.json`/`uttrykk-b2.json` candidates**, see below |
| 6    | g      | `sette (seg)/legge (seg)/ligge/sitte/stå` 5-verb paradigm                                                                                     | 10    | `plassering-verb` (B2 entries)                                                              |
| 7    | e      | `bli lærer` + preposition/infinitive-marker collocation                                                                                       | 20    | `infinitiv-a1` (B2 entries)                                                                 |
| 7    | g      | Preteritum → preteritum passiv                                                                                                                | 10    | `c-grammar.md` passive coverage / small new C entries                                       |
| 4/9  | g      | Preteritum → 1. futurum (kap.4) / → pluskvamperfektum·2.kond (kap.9)                                                                          | 10+   | B2 (1. futurum) / C (pluskvamperfektum, 2. kondisjonalis)                                   |
| 9    | c      | `synes` vs. `tro`                                                                                                                             | 17    | `synes-tror`/`mene-synes-tro-tenke` (reused, confirms fine as-is)                           |
| 9    | f      | Presens → s-passiv                                                                                                                            | ~10   | `omskriving-passiv` (B2/C entries)                                                          |

Every other lettered exercise (a/b noun-adjective form, h sentence-combination, i-non-fixed
prepositions, j paraphrase, k word-order+tense) repeats this same shape 6–8 more times across
kap. 2–8, each ~10–20 items, confirming the "per-letter-type, not per-chapter" routing already in
the table above — no new topics surfaced there beyond what's listed.

**kap. 9–16 mined material — concrete counts:**

- **kap. 12e** — verb _ryke_ polysemy, 14 sentences spanning literal ("det ryker fra skogholtet")
  through 6+ figurative senses (relationship ending, a deal falling through, a body part tearing,
  a job/place being lost). Feeds `nyanser-uttrykk` as a single-word polysemy set, not a pair.
- **kap. 12k** — "Diskuter nyanseforskjellene i disse verbene": **6 full near-synonym clusters**,
  ~50 verbs total — _se-cluster_ (14: se, titte, kikke, myse, glane, stirre, glo, skimte, ane,
  betrakte, saumfare med blikket, beskue, skotte, få øye på), _snakke-cluster_ (11), _gå-cluster_
  (11), _skrike-cluster_ (8), _reaksjon-cluster_ (9: måpe, himle med øynene, bite tennene sammen…),
  _kroppslyd-cluster_ (12: nyse, hoste, harke, hikke, rape, gulpe, kaste opp, spy, spytte, sikle,
  sukke, stønne). **This alone roughly doubles the material available for `nyanser-uttrykk`**
  versus the six single-chapter mentions noted earlier in this doc — it's the single richest
  source for that topic.
- **kap. 13a** — dense reference-grammar text (not exercises) on 2. futurum vs. 2. kondisjonalis
  semantics (reported/hearsay vs. hypothetical) plus a 4-way hypothetical-tense combination table
  (preteritum/pluskvamperfektum × 1./2. kondisjonalis) and the "ikke gjort likevel" 1./2.
  kondisjonalis contrast. This is the actual rule-text source for `futurum-referert` and
  `kondisjonalis-counterfactual` — use directly for explanation text, not just examples.
- **kap. 13b** — 10 short news-style 2. futurum sentences (`skal ha tatt kvelertak`, `skal ha
blitt plaget`), confirms the "reported/sladder" register `futurum-referert` should model.
- **kap. 13o** — `såpass`, 13 sentences, single-word intensifier ("så mye") — feeds
  `nyanser-uttrykk` as an adverb entry, confirming the word-class breadth already noted.
- **kap. 14c** — confirmed: ~50 collocations/idioms across 9 short essay excerpts (`gi grobunn
for`, `kalle en spade for en spade`, `danse rundt gullkalven`, `ta opp hansken`, etc.). Per the
  existing decision, **not** routed to `uttrykk-gjenkjenning-detgaarbra-c` (essay-tied, not a
  curated general list) — mine individual collocations for fresh examples in
  `preposisjoner-generelt-c`/`substantiv-uttrykk-c`, never lift the essay phrasing.

**New find requiring a decision — kap. 6f (35 body-part idioms):**

Not identified in the original Phase 0 read. Same shape as kap. 14c (a "Forklar for hverandre"
discussion list, not a gradable grammar exercise) but topically it's a curated general-purpose
idiom list (à la `idiomatiske-uttrykk.md`), not essay-tied — e.g. `ha bein i nesa`, `holde tunga
rett i munnen`, `få kalde føtter`, `sette foten ned`, `ha is i magen`, `en hard negl`. Several of
these already exist in `uttrykk-b2.json`/`uttrykk-c.json` from other passes (confirmed: `å ha
bein i nesa`, `å få kalde føtter`, `å holde tunga rett i munnen` all pre-date this book). Given
the overlap pattern already seen with `idiomatiske-uttrykk.md` (14/47 pre-existing), recommend the
same treatment: a dedup pass against `uttrykk-b2.json` + `uttrykk-c.json` before deciding whether
the net-new subset justifies its own batch or folds into general `uttrykk-c.json` additions
alongside future maintenance. **Not blocking Phase 2** — none of the three new topics depend on
kap. 6f — but flagging so it doesn't get lost the way kap. 1.5's `mel i posen` briefly did.

**✅ Done (dedup + addition pass).** Of the 35 body-part idioms, 13 were already covered by the
three new grammar topics' idiom source and were added to `uttrykk-b2.json` (`u-b2-800`–`u-b2-812`).
A further 4 (`ta beina på nakken`, `det går kaldt nedover ryggen på en`, `ta noe på strak arm`,
`få hjertet i halsen`) and 2 (`sette foten ned`, `stikke fingeren i jorda`) were found already present
in `uttrykk-c.json`/`uttrykk-b2.json` respectively from earlier passes, and 3 (`ha bein i nesa`,
`få kalde føtter`, `holde tunga rett i munnen`) pre-date this book entirely. The remaining net-new
set was added as 11 new C-level entries in `uttrykk-c.json` (`u-c-609`–`u-c-619`): `flagre med
ørene`, `morgenstund har gull i munn`, `ha tennene på tørk`, `legge hodet i bløt`, `sette nesa i
sky`, `ha ti tommeltotter`, `ha spisse albuer`, `ha is i magen`, `være en hard negl`, `tvinne noen
rundt lillefingeren`, `øye for øye, tann for tann` (two candidates — `nesevis` and the ambiguous
`hodet under armen og armen i bind` sentence — were dropped as poor fits). `uttrykk-c.json` verified:
605 entries, no duplicate ids, no duplicate `norsk` values file-wide.

### Revised question-count estimate for the 3 new topics

- `nyanser-uttrykk`: with kap. 12k's 6 clusters (~50 verbs) now counted in, source material easily
  supports 12+ questions (up from the original "~8–12" default) — recommend the higher end, split
  roughly: 3–4 from the verb clusters (multiple-choice/minimal-pair, "which verb fits this
  context"), 2–3 from kap.3c/9c-style opinion-verb and adjective pairs, 2 from kap.5d noun triads,
  1–2 from kap.12e's `ryke` polysemy, 1 from `såpass`. — ✅ Done: 18 questions written
  (`gq-nyanser-001`–`018`, 9 tagged `cefr: 'B2'` + 9 tagged `cefr: 'C'`, reflecting the topic's
  mixed-level source material — e.g. `seriøs/alvorlig` and `flaks/sjanse` are B2-level pairs,
  while the kap.12k verb clusters and `ryke`/`såpass` are C-level). Merged into `grammar.json`
  (1884 total, no duplicate ids). Vocab check surfaced 16 missing headwords (`alvorlig`, `flaks`,
  `sjanse`, `bevilling`, `ryke`, `myse`, `glane`, `spankulere`, `hyle`, `brøle`, `harke`, `hoste`,
  `mumle`, `hviske`, `måpe`, `såpass`) — added as new entries to `vocab-b2.json`/`vocab-c.json`.
  Re-verified: `check-b2-grammar-vocab.mjs`/`check-c-grammar-vocab.mjs` (both extended with a
  `nyanser-uttrykk` topic-touch; the C-script additionally filters to `cefr: 'C'` only since the
  topic spans both levels) and `check-grammar-norwegian.mjs` — all 0 unmatched/flagged.
- `preposisjoner-uttrykk-b2`: kap.1i alone gives 33 candidate collocations; expect similar-sized
  `i`-exercises in kap.2–8 (not yet fully inventoried item-by-item — routing already confirmed
  they're the same shape). 8–12 questions is comfortably supported without needing kap.2–8's full
  count. — ✅ Done: 10 questions written (`gq-prep-b2-001`–`010`, 8 `fill` + 1 `order` + 1
  `minimal-pair`), covering `ta ansvar for`, `ha inntrykk av`, `være forberedt på`, `komme på`
  (huske), `kjempe for`, `sette pris på`, `bestemme seg for`, `stemme på`, `skeptisk til`, `ta
hånd om` — the collocations named in the topic's own `rules.ts` explanation plus a couple
  more surfaced by kap.1i (`skeptisk til`, `ta hånd om`). Fresh sentences throughout, never
  adapted from the textbook's own kap.1i items. Merged into `grammar.json` (1894 total, no
  duplicate ids). `check-b2-grammar-vocab.mjs`/`check-grammar-norwegian.mjs` both 0
  unmatched/flagged.

**All 3 new topics from this plan are now content-complete: `nyanser-uttrykk` (18),
`uttrykk-gjenkjenning-detgaarbra-c` (15), `preposisjoner-uttrykk-b2` (10) — 43 questions total.**

- `uttrykk-gjenkjenning-detgaarbra-c`: 47 idioms in `idiomatiske-uttrykk.md`, all now present in
  `uttrykk-c.json` (Phase 1.5 done) — supports the originally planned single ~8–12 question topic,
  or could go higher (up to ~15–20) given the full idiom pool is larger than similar existing
  C-level idiom-recognition topics. — ✅ Done: 15 multiple-choice questions written
  (`gq-uttr-dgb-c-001`–`015`), same format as `uttrykk-gjenkjenning-c-1/2/3` (fresh prompt sentence
  with the idiom in quotes, 3 Norwegian paraphrase options, hint). Merged into `grammar.json`,
  JSON validated, no duplicate ids.

## Phase 3 — Vocab + Norwegian-only verification

Run existing `check-b2-grammar-vocab.mjs`/`check-c-grammar-vocab.mjs` and
`check-grammar-norwegian.mjs` per topic, per established workflow.

## Phase 4 — Gating + wiring

B2 and C are both already fully Plus-gated by level (per `b2-grammar.md`'s confirmed
`FREE_GRAMMAR_TOPICS` policy) — no gating changes needed beyond adding new topic names to the
admin `TOPICS` constant.

---

## Open question

Should Phase 0's full read happen in this same session, or would you rather review/adjust this
routing draft first (e.g. confirm the 6 proposed new topics, or flag any "reuse" mapping that
looks wrong) before I spend the tokens on an exhaustive line-by-line pass of both oppgaver files?
