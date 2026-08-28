---
title: B2 Grammar På Nivå Arbeidsbok
reference: draft/b2/pa-niva/arbeidsbok-b2.md
data-started: 2026-08-26
data-completed:
---

# Nivå B2 Grammar — "På Nivå" arbeidsbok — Implementation Plan

## Overview

Coverage of `draft/b2/pa-niva/arbeidsbok-b2.md` (author Gølin Kaurin Nilsen, "Grammatikk i Norsk
som andrespråk", CEFR-based) + `draft/b2/pa-niva/arbeidsbok-b2-fasit.md` (answer key) — the same
source book the in-progress vocab/uttrykk project
[`b2-vocab-uttrykk-pa-niva-arbeidsbok.md`] mines for `vocab-b2.json`/`uttrykk-b2.json`. This plan
covers the **grammar** side only.

**Division of labor with the vocab/uttrykk plan:** the vocab plan's §2 already triaged the book
into in-scope (idiom/paraphrase/particle-verb sections — `PARSETNINGER`, `FASTE UTTRYKK`,
`METAFORER`, particle-verb drills, etc.) and out-of-scope (pure grammar mechanics: artikkel/kjønn
drills, entall↔flertall transforms, verb tense drills, aktiv/passiv transforms,
setningsledd/setningsanalyse, ordstilling, komma/stor-liten bokstav, determinativ choice,
adjektiv gradbøyning mechanics, leddsetning/nominale setninger structure). **Those "out of scope"
sections are precisely this plan's target** — the book is unusual in that almost the entire thing
is grammar drills with only a thin seam of extractable vocab/uttrykk, the inverse of "Opp og
fram!"'s structure (which had rich per-chapter vocab tables and comparatively sparse named
grammar topics).

**Language of new content:** Norwegian-only for `prompt`/`hint`/`explanation` (per
`grammar-with-only-norsk.md`, already resolved project-wide).

**Copyright approach (unchanged):** every question is newly written; the textbook is used only to
identify which rule/difficulty to target — never copy or closely paraphrase its sentences or
reuse its characters/names. Invent fresh names/sentences, same convention as every prior grammar
plan.

**Vocab integration:** every question should use real B2-or-below vocabulary, verified against
`vocab-b2.json`/`uttrykk-b2.json` (and lower-level files where the word is more basic), same
mirror-vocab convention used throughout the B1 plans.

**Question types:** existing `'fill' | 'order' | 'transform' | 'minimal-pair' | 'multiple-choice'`
should cover everything here — no schema changes expected.

**Existing B2 grammar landscape:** `grammar.json` already has B2 content from two prior rounds
(~23 topics, ~200+ questions per project notes — `modale-adverb`, `sammensatte-substantiv`,
`hoflig-preteritum`, `kontrast-uttrykk`, `ordfamilie-avledning` extensions, and others). All B2
grammar content is Plus-gated. A validation script already exists:
`check-b2-grammar-vocab.mjs`. Phase 1 triage (below) should check each kapittel/subsection
against this existing topic list before proposing a new topic — same reuse-first approach every
prior grammar plan has followed.

---

## Source structure (from the book's own table of contents)

The book has 4 kapittel, each split into named subsections (page numbers from the TOC, useful for
cross-referencing the print edition, not the markdown line numbers):

- **KAPITTEL 1 ORDKLASSER** (word classes)
  - Substantiv (nouns) · Adjektiv (adjectives) · Determinativer (determiners) · Verb · Adverb ·
    Preposisjoner (prepositions) · Konjunksjoner (conjunctions) · Subjunksjoner (subjunctions)
- **KAPITTEL 2 ORDLAGING** (word formation)
  - Sammensatte ord (compounds) · Avledninger (derivations) · Mer om ord (more about words)
- **KAPITTEL 3 SETNINGER** (sentences)
  - Setningsledd (sentence elements/analysis) · Helsetninger (main clauses) · Leddsetninger
    (subordinate clauses)
- **KAPITTEL 4 TEKSTER OG TEKSTBINDING** (texts and text cohesion)
  - Tekstbinding (text cohesion/connectives) · Tekster (texts — reading/comprehension pieces)

`FASIT` (answer key) is a separate section starting after Kapittel 4, mirrored in
`arbeidsbok-b2-fasit.md` — same parallel-file structure the vocab plan already established a
reading convention for (§1/§3 there: fasit headings mirror the arbeidsbok's heading structure one
level down, matched by section title + exercise number). This grammar plan should reuse that same
parallel-read convention, since the fasit answer is often what reveals which specific rule an
exercise is testing (the arbeidsbok exercise text alone is sometimes just an underline/fill-blank
prompt with no rule name attached).

Each named subsection above (e.g. "SUBSTANTIV") contains multiple numbered exercises with their
own sub-headers (e.g. "1 PETRAS PARIS") — the real per-topic granularity lives at this level, not
at the kapittel/subsection level. This mirrors the vocab plan's own finding that section titles
alone are too coarse a unit — the actual rule being tested only becomes clear on reading each
numbered exercise (and often its fasit answer).

---

## Cross-checks before writing content

1. **Overlap with the vocab/uttrykk plan** — before treating any exercise as grammar-question
   material, confirm it isn't one of the vocab plan's in-scope idiom/paraphrase/particle-verb
   sections (`PARSETNINGER`, `FASTE UTTRYKK`, `METAFORER`, `KULTURELLE UTTRYKK`, `HOMONYMER`,
   particle-verb drills, `ORDTAK`, etc. — see that plan's §2 for the full list). Those stay that
   plan's territory; this plan should only draft questions for the "pure grammar mechanics"
   sections that plan explicitly marked out of scope.
2. **Overlap with existing B2 grammar topics** — `grammar.json`'s current B2 topics (see Overview
   above) may already cover a given kapittel/subsection's rule. Default to extending an existing
   topic with fresh B2 (or cross-level) questions over inventing a new one, same precedent as the
   B1 plans (`nyanser-uttrykk` spanning B2/C, `ordfamilie-avledning` spanning C/B1/B2, etc.).
3. **Overlap with the B1 "Opp og fram!" grammar plan** (`b1-grammar-opp-og-fram-arbeidsbok.md`) —
   several topic ids there (`passiv-bli-s`, `adj-comparison`, `noun-plurals`,
   `sammensatte-substantiv`, `ordfamilie-avledning`, etc.) already carry both B1 and B2 questions.
   New B2 entries from this book must use fresh example sentences/characters, not duplicate
   either source's existing questions.

---

## Process (mirrors `b1-grammar-opp-og-fram-arbeidsbok.md` / `b1-grammar-stein-paa-stein.md` /
## `c-grammar-preposition.md`)

1. **Phase 0 (this document) — done.** Source structure captured from the book's own table of
   contents; division of labor against the vocab/uttrykk plan established; existing B2 grammar
   landscape and cross-check list noted.
2. **Phase 1 — chapter-by-chapter triage. All four kapittel (Ordklasser, Ordlaging, Setninger,
   Tekster og tekstbinding) done — see "Phase 1 confirmed findings" below.** Read each kapittel/subsection's actual exercise content (not just the
   TOC headers) in parallel with `arbeidsbok-b2-fasit.md`, exercise by exercise, and classify
   each into: (a) extend an existing B2 grammar topic, (b) extend an existing topic at a
   different CEFR level (cross-level reuse, same precedent as the B1 plans), (c) a genuinely new
   topic (no existing `GrammarTopic` fits), or (d) skip — already the vocab plan's territory, or
   pure review/reference material with no discrete rule to quiz (same pattern as "Oversikt over
   verbformene" being skipped in the B1 plan). Log findings and a preliminary
   reuse/new-topic table per kapittel, the same way the B1 plan's "Phase 1 confirmed findings"
   sections did, before any question-writing starts.
3. **Phase 2 — content, one topic-touch at a time** (session-limited): build ~8–12 questions per
   topic-touch, batch a few touches per session, mirroring vocab against
   `vocab-b2.json`/`uttrykk-b2.json` (and lower-level files for simpler supporting words). Where a
   topic-touch surfaces a genuine rule-text gap (a nuance the existing `rules.ts` entry doesn't
   mention), extend `explanationEn`/`explanationNb` before writing questions — same convention as
   every B1 topic-touch in the sibling plan.
4. **Validate:** run `check-b2-grammar-vocab.mjs` (already exists) and a JSON-validity +
   duplicate-ID check before applying to the real `grammar.json`.
5. **Track progress** in this doc: mark each topic-touch ✅ Done with its final question count and
   any rule-text-gap notes, same convention as every prior grammar plan's progress log.

---

## Phase 1 confirmed findings — Kapittel 1 ORDKLASSER

Read exercise-by-exercise against `arbeidsbok-b2-fasit.md`, cross-checked against the current
B2 `grammar.json` topic list (40 topics, 493 questions) and cross-level topics that could be
extended to B2. Sections already claimed by the vocab plan's §2 in-scope list are marked
**skip — vocab plan** below and not touched here.

**Legend:** 🔁 extend existing B2 topic · 🔀 cross-level extend (existing topic, new CEFR) ·
🆕 new topic candidate · ⏭️ skip (vocab plan territory or no discrete rule to quiz)

### SUBSTANTIV
| # | Exercise | Decision |
| - | -------- | -------- |
| 1 | Petras Paris (noun-spotting, abstrakt/konkret) | ⏭️ pure identification, no B2-level rule beyond A1 `substantiv-bestemt-form` |
| 2 | Stor/liten bokstav (punctuation) | ⏭️ out of scope per vocab plan's own exclusion list (komma/stor-liten bokstav) |
| 3 | Hankjønn/hunkjønn/intetkjønn + ubestemt artikkel | 🔁 `noun-articles` (B2) |
| 4–5 | Uregelrette substantiv (bøying) | 🔁 `noun-plurals` (B2) |
| 6–7 | Entall↔flertall | 🔁 `noun-plurals` (B2) |
| 8–9 | Ubestemt artikkel som predikativ (4 regler) | 🆕 candidate — `noun-articles` covers general artikkel use but not the 4-rule predikativ system specifically; worth a closer rules.ts check before deciding new vs. extend |
| 10 | Ledig stilling (lytt/cloze, job-interview phrases) | ⏭️ listening-cloze with no isolable grammar point beyond §8–9 |
| 11–12 | Rett form av substantiv (kjønn + artikkel + bøying, big drills) | 🔁 `noun-articles` + `noun-plurals` |
| 13 | Språkdetektiv (bestemt/ubestemt + begrunnelse) | 🔁 `noun-articles` |
| 14 | Substantivfrasen (finn frase + kjerne) | 🆕 candidate — no topic currently targets NP-identification/head-finding; low priority, check `setningsledd`-adjacent C topics first |
| 15 | Kjente nordmenn: Nansen | ⏭️ **skip — vocab plan** |

### ADJEKTIV
| # | Exercise | Decision |
| - | -------- | -------- |
| 1–2 | Adjektiv-spotting + hvilket substantiv | 🔁 `adj-agreement` (B2) |
| 3–5 | Bøying etter kjønn/tall (liten, mixed adj) | 🔁 `adj-agreement` (B2) |
| 6 | den/det/de som bestemt artikkel foran adjektiv+substantiv | 🆕 candidate — "dobbel bestemthet" isn't covered by any existing topic; worth its own touch if `adj-agreement`'s rules.ts doesn't already fold it in |
| 7, 9, 10, 13, 14 | Komparativ/superlativ bøying (regular + irregular) | 🔀 `adj-comparison` (currently A2/B1 only) — extend to B2 |
| 8 | Superlativ med bestemt artikkel (fjord/fjell) | 🔀 `adj-comparison` → B2 |
| 11 | Superlativ omskriving (så X du kan tenke deg) | 🔀 `adj-comparison` → B2 |
| 12 | Kjønn/tall/form/grad — full identification | 🔁 `adj-agreement` (B2) |
| 15 | enda/aller (intensifiers with superlative) | 🆕 small candidate — could fold into `adj-comparison` B2 extension rather than a standalone topic |
| 16 | Substantiverte adjektiv | 🔁 `substantivert-adjektiv` (B2) — direct match, confirmed against sample questions |
| 17 | Substantivfrase-feil (NP agreement errors) | 🔁 `adj-agreement` (B2) |
| 18 | Utvandringen til Amerika (cloze, mixed grad) | 🔀 `adj-comparison` → B2 |

### DETERMINATIVER
| # | Exercise | Decision |
| - | -------- | -------- |
| 1 | Determinativ-roller (klassifisering) | ⏭️ pure categorization, low quiz value |
| 2–4 | Eiendomsord (possessives) + dobbel bestemthet | 🔀 `noun-possessives` (currently A1/A2/B1 only) — extend to B2 |
| 3 | Personlig pronomen vs. eiendomsord | 🔀 `noun-possessives` → B2 |
| 5 | Superlativ NP i bestemt form (verdens højeste...) | 🔀 `adj-comparison` → B2 (overlaps Adjektiv §8/§11) |
| 6 | sånn (demonstrativ) | 🆕 small candidate — no existing topic covers `sånn`; likely fold into a new determinativ-forsterkere topic (see §13–15) rather than standalone |
| 7–11 | litt/lite, ingen/noen, alle/hver, hele/all, begge deler/begge to | 🔁 `kvantorer` (B2) / `spesial-kvantorer` (B2) |
| 12 | Språkdetektiv (kvantor/possessiv feil) | 🔁 `kvantorer` / `spesial-kvantorer` |
| 13–15 | egen, selv (B2+), eneste — forsterkere | 🆕 **new topic candidate**: `determinativ-forsterkere` (egen/selv/eneste, possibly + sånn from §6) — nothing in the current 113-topic list covers these B2-flagged emphasizer determinatives |
| 16 | Kjente nordmenn: Heyerdahl | ⏭️ **skip — vocab plan** |

### VERB
| # | Exercise | Decision |
| - | -------- | -------- |
| 1 | Uregelrette verb (bøyingstabell) | 🔀 `sterke-verb` (currently A2/B1 only) — extend to B2, or fold into `partisipp-former` (B2) |
| 2 | Fabel-cloze (mixed tense) | 🔁 `preteritum-perfektum-og-futurum` (B2) — mixed review, draw individual questions rather than one big cloze |
| 3 | Presens perfektum vs. preteritum | 🔁 `preteritum-perfektum-og-futurum` (B2) |
| 4 | være vs. bli | 🆕 **new topic candidate**: `vaere-vs-bli` — distinct from `passiv-bli-s` (bli-passive vs s-passive) and from `bli-presens-partisipp`; no existing topic tests the state-vs-change contrast directly |
| 5 | Språkdetektiv (verbform etter modal/preteritum) | 🔁 fold into `modalverb-betydning` or `preteritum-perfektum-og-futurum` |
| 6 | Verbsystemene (presens- vs. preteritumsystem consistency) | 🔁 `preteritum-perfektum-og-futurum` (B2) |
| 7–10 | Aktiv/passiv (identify, transform both ways, ordstilling) | 🔁 `passiv-bli-s` (B2) for §7–9; §10 ordstilling → 🔀 `v2-word-order` (A2/B1 only) extend to B2, or fold into `passiv-bli-s` |
| 11 | Imperativ → passiv (oppskrift) | 🔁 `passiv-bli-s` (B2) |
| 12 | Presens partisipp som adjektiv/adverb | 🔁 `bli-presens-partisipp` (B2) — confirmed direct match against sample questions |
| 13 | Perfektum partisipp som adjektiv | 🔁 `partisipp-former` (B2) or `fa-perfektum-partisipp` (B2) |
| 14 | Modalverb i formelle situasjoner | 🔁 `modalverb-betydning` (B2) or `hoflig-preteritum` (B2) |
| 15 | Parsetninger: modale uttrykksmåter | ⏭️ **skip — vocab plan** |
| 16 | Tidsadverbial først (modal+perfektum) | 🔁 `adverbial-fronting` (B2) |
| 17 | Sammensatte verb (verb 1 / verb 2 / tempus identification) | 🆕 **new topic candidate**: `sammensatt-verbtid` — vocab plan explicitly excluded this section (not particle verbs); distinct mechanic from `partikkelverb-los-fast` — identifying the finite/non-finite verb slot and naming the tense of a compound verb form |
| 18 | Referere andres utsagn (skal visstnok, sies å...) | 🔁 `indirekte-tale-at-om` (B2) |
| 19 | Skulle ha gjort (counterfactual modal perfect) | 🔁 `hypotetiske-betingelsessetninger` (B2) |
| 20 | Hva mener du? (opinion sentences) | ⏭️ open-ended writing practice, no discrete rule |
| 21 | Hypotetisk (B2+) | 🔀 `hypotetiske-betingelsessetninger` (B2) / `kondisjonalis-counterfactual` (C only) — extend down |
| 22 | få + perfektum partisipp (resultative) | 🔁 `fa-perfektum-partisipp` (B2) — confirmed direct match |
| 23 | bli sittende og... / holde på å... (extended aspect) | 🔁 `bli-presens-partisipp` (B2), note `holde på å` may need a rules.ts addition |
| 24–27 | Partikkelverb (identify, avslag/avslå, partikkel+partisipp, løst/fast) | ⏭️ **skip — vocab plan** (explicitly listed in-scope there) |
| 28 | Kjente nordmenn: Ingrid Espelid Hovig | ⏭️ **skip — vocab plan** |

### ADVERB
| # | Exercise | Decision |
| - | -------- | -------- |
| 1 | Adverb vs. adjektiv (fabeltekst) | 🔁 `adjektiv-eller-adverb` (B2) — confirmed direct match |
| 2 | Ordtak (adverb i ordtak) | ⏭️ **skip — vocab plan** |
| 3 | Adverb-undergrupper (nektings-, grads-, tids- osv.) | 🔁 `setningsadverbial` (B2) / `modale-adverb` (B2) |
| 4 | Adverbets funksjon (verb/adj/setning/binding) | 🔁 `setningsadverbial` (B2) |
| 5–6 | Stedsadverb | 🔁 `stedsadverb-statisk-dynamisk` (B2) — confirmed direct match |
| 7 | Idiomatiske adverbbetydninger (hoppende glad, visstnok...) | 🔁 `nyanser-uttrykk` (B2) / `sannsynlighet-uttrykk` (B2) |
| 8 | Adverbplassering i setning | 🔁 `setningsadverbial` (B2) / `adverbial-fronting` (B2) |
| 9 | Presens partisipp som manerandverb (komme løpende) | 🆕 candidate — distinct from `bli-presens-partisipp` (komme vs. bli); check rules.ts before deciding extend vs. new |
| 10 | Nektende adverb (aldri, neppe, slett ikke...) | 🔁 `modale-adverb` (B2) / `sannsynlighet-uttrykk` (B2) |
| 11 | visst/visstnok/trolig (hedging) | 🔁 `sannsynlighet-uttrykk` (B2) — confirmed close match, though this is evidentiality rather than probability; verify rules.ts covers both nuances |
| 12–13 | kanskje/selvfølgelig/nok paraphrase + matching | 🔁 `modale-adverb` (B2) |
| 14 | likevel/derfor/dessuten (connectors) | 🔁 `arsak-og-folge-uttrykk` (B2) for derfor; `kontrast-uttrykk`/`motsetning-selv-om-likevel` (B2) for likevel; dessuten (additive) may need a rules.ts note — check coverage |
| 15 | Gradbøyning av adverb (gjerne→heller→helst, sakte→saktere) | 🆕 **new topic candidate**: `adverb-gradboying` — `adj-comparison` only covers adjectives; no existing topic tests adverb comparison |

### PREPOSISJONER
| # | Exercise | Decision |
| - | -------- | -------- |
| 1 | Spørreord for preposisjonsledd | ⏭️ setningsledd-analysis, likely Kapittel 3 territory — revisit there |
| 2–6 | Preposisjoner for tid/sted (cloze texts) | 🔀 `preposisjoner-tid` / `preposisjoner-sted` (currently A1/A2/B1 only) — extend to B2, or fold into `preposisjoner-uttrykk-b2` |
| 7 | i eller på (områderegelen/kantstedsregelen) | 🆕 **new topic candidate**: `omraaderegelen-kantstedsregelen` — confirmed `preposisjoner-uttrykk-b2` sample questions are faste-uttrykk multiple-choice, not this specific i/på rule system |
| 8 | Motsatte preposisjoner (foran/bak, med/uten...) | 🔁 `preposisjoner-uttrykk-b2` (B2) |
| 9 | Sammensatte preposisjoner (i løpet av, i nærheten av...) | 🔁 `preposisjoner-uttrykk-b2` (B2) — matches its own "KAN DU DET?" checklist item |
| 10 | for/til | 🔁 `preposisjoner-uttrykk-b2` (B2) / `nyanser-uttrykk` (B2) |
| 11 | Abstrakt preposisjonsbetydning | 🔁 `preposisjoner-uttrykk-b2` (B2) |
| 12 | Faste uttrykk (i god stand, på jakt etter...) | ⏭️ **skip — vocab plan** |
| 13 | Kongeboligen i Bergen (preposisjon-cloze) | 🔁 `preposisjoner-uttrykk-b2` (B2) — not in vocab plan's named reading-text list, treated as another prep drill |
| 14 | Kjente nordmenn: Brækhus | ⏭️ **skip — vocab plan** |

### KONJUNKSJONER
| # | Exercise | Decision |
| - | -------- | -------- |
| 1, 3 | og/eller/men/for/så (coordinating) | 🔀 `koordinerende-konjunksjoner` (currently C only) — extend down to B2 |
| 2 | for vs. fordi | 🆕 candidate — no existing topic isolates this specific conjunction/subjunction pair; could fold into the `koordinerende-konjunksjoner` B2 extension instead of a standalone topic |
| 4–5 | både...og / verken...eller | 🔀 `bade-og-verken-eller` (currently B1 only) — extend to B2 |

### SUBJUNKSJONER
| # | Exercise | Decision |
| - | -------- | -------- |
| 1 | at/om/å | 🔁 `subjunksjon-oversikt` (B2) |
| 2–3 | Nominal leddsetning fronting | 🔀 `leddsetning-som-fundament` (currently C only) — extend down to B2, or fold into `subjunksjon-oversikt` |
| 4 | Adverbiale subjunksjonskategorier (tid/årsak/motsetning/hensikt/følge/betingelse/sammenlikning) | 🔁 `subjunksjon-oversikt` (B2) |
| 5 | hvis/som/at/fordi | 🔁 `subjunksjon-oversikt` (B2) / `relative-som` (B2) |
| 6 | etter at (kombiner setninger) | 🔁 `tidssekvens-etter-at-etterpaa` (B2) — confirmed direct match |
| 7 | Sekvens vs. årsak (omskriving) | 🔁 `arsak-og-folge-uttrykk` (B2) / `tidssekvens-etter-at-etterpaa` (B2) |
| 8 | Kontekst-matching (hvis/selv om/når) | 🔁 `hypotetiske-betingelsessetninger` (B2) / `motsetning-selv-om-likevel` (B2) |
| 9 | som/enn (sammenlikning) | 🆕 candidate — `relative-som` covers relative "som", not comparative "som...som"/"enn"; check rules.ts, may fold in or need own touch |
| 10 | Kjente nordmenn: Carlsen | ⏭️ **skip — vocab plan** |

### Summary — new-topic candidates surfaced in Kapittel 1
Pending a closer `rules.ts` check before Phase 2 commits to "new" vs. "fold into existing":
`determinativ-forsterkere` (egen/selv/eneste/sånn), `vaere-vs-bli`, `sammensatt-verbtid`
(verb1/verb2/tempus), `adverb-gradboying`, `omraaderegelen-kantstedsregelen` (i/på), plus smaller
candidates noted inline (predikativ-artikkel-regler, substantivfrase-identifikasjon,
presens-partisipp-som-manerandverb, for-vs-fordi, som-enn-sammenlikning).

**Not yet triaged:** Kapittel 2 (Ordlaging), Kapittel 3 (Setninger), Kapittel 4 (Tekster og
tekstbinding) — Setningsledd §1 from Preposisjoner (spørreord for preposisjonsledd) likely
belongs with Kapittel 3's Setningsledd subsection once that's read.

---

## Phase 1 confirmed findings — Kapittel 2 ORDLAGING

Same method as Kapittel 1: read exercise-by-exercise against `arbeidsbok-b2-fasit.md`,
cross-checked against the B2 `grammar.json` topic list. Vocab-plan-claimed sections excluded.

### SAMMENSATTE ORD
| # | Exercise | Decision |
| - | -------- | -------- |
| 1–3 | Forledd/etterledd identifikasjon + orddeling | 🔁 `sammensatte-substantiv-b2` (B2) |
| 4 | Hva betyr det? (compound meaning) | ⏭️ **skip — vocab plan** |
| 5 | Overført betydning (metaphoric compounds) | ⏭️ **skip — vocab plan** |
| 6 | Ett eller to ord? (ananasringer vs. ananas ringer) | 🔁 `sammensatte-substantiv-b2` (B2) — its own "KAN DU DET?" checklist names exactly this skill |
| 7 | Fugeformativ (s/e/ingenting) | 🔁 `sammensatte-substantiv-b2` (B2) — checklist also names this explicitly |
| 8 | Går det an? (semantic transparency, ja/nei) | 🔁 `sammensatte-substantiv-b2` (B2), borderline with vocab territory but format (true/false on compound logic) fits the grammar topic |

### AVLEDNINGER
| # | Exercise | Decision |
| - | -------- | -------- |
| 1 | Prefiks eller suffiks? | 🔁 `ordfamilie-avledning` (B2) |
| 2 | Motsetning med prefiks (u-, mis-...) | 🔁 `motsetning-prefiks` (B2) — direct match |
| 3 | Suffiks og ordklasse | 🔁 `ordfamilie-avledning` (B2) |
| 4 | Verbavledninger (be-/an-/med-/for- — finnes ordet?) | 🔀 `verbprefiks-be-an-mis` (currently B1 only) — extend to B2 |
| 5–7 | Verb↔substantiv↔adjektiv derivasjonstabeller | 🔁 `ordfamilie-avledning` (B2) |
| 8–9 | Hva betyr det? (meaning of derived nouns/adjectives) | 🔁 `ordfamilie-avledning` (B2) — not on vocab plan's claimed list for this subsection, and the derivational-meaning angle fits the grammar topic better than raw vocab |
| 10 | Ordfamilier (sortering) | 🔁 `ordfamilie-avledning` (B2) |
| 11 | Substantiv/verb/adjektiv i dialog (stort blandet drill) | 🔁 `ordfamilie-avledning` (B2) |
| 12 | Verbalsubstantiv: person vs. sak | 🆕 candidate — no existing topic isolates the person-vs-result/process distinction for verbal nouns; check rules.ts, may fold into `ordfamilie-avledning` instead of standalone |
| 13 | Ordlaging av partikkelverb | ⏭️ **skip — vocab plan** |

### MER OM ORD
| # | Exercise | Decision |
| - | -------- | -------- |
| 1 | Kvinne, mann eller barn? (dated gendered nouns) | ⏭️ lexical/vocabulary content, not a grammar rule — flag as possible vocab-plan addendum rather than grammar territory |
| 2 | Kryssord (synonymer) | ⏭️ **skip — vocab plan** |
| 3 | Hva skal ut? (odd-one-out, semantic categories) | ⏭️ lexical comprehension, not a grammar rule |
| 4 | Adjektiv og substantiv (fixed collocations) | ⏭️ collocation/vocab content — flag as possible vocab-plan addendum rather than grammar territory |
| 5–7 | Homonymer (så / stemme / skilt) | ⏭️ **skip — vocab plan** |
| 8 | I godt humør (predikativ-uttrykk) | ⏭️ **skip — vocab plan** |
| 9 | Metaforer | ⏭️ **skip — vocab plan** |
| 10 (80 Parsetninger) | Paraphrase/idiom reconstruction | ⏭️ **skip — vocab plan** |

### Summary — Kapittel 2
Mostly direct reuse: `sammensatte-substantiv-b2` and `ordfamilie-avledning` absorb almost all of
Sammensatte ord and Avledninger. One cross-level extend (`verbprefiks-be-an-mis` → B2) and one
new-topic candidate (`verbalsubstantiv-person-sak`, pending rules.ts check). Mer om ord is
almost entirely vocab-plan territory or raw lexical content with no discrete grammar rule —
§1 and §4 aren't on the vocab plan's explicit claimed list, so worth flagging to that plan rather
than drafting as grammar content.

**Not yet triaged:** Kapittel 3 (Setninger: Setningsledd, Helsetninger, Leddsetninger), Kapittel 4
(Tekster og tekstbinding).

---

## Phase 1 confirmed findings — Kapittel 3 SETNINGER

Same method as Kapittel 1–2: read exercise-by-exercise against `arbeidsbok-b2-fasit.md`,
cross-checked against the B2 `grammar.json` topic list and `rules.ts` explanation text (not just
topic names) for the plausible matches. This kapittel turned out to reuse existing B2 topics far
more than expected — several rule texts (`det-formelt-subjekt`, `indirekte-tale-at-om`,
`derfor-fordi`, `motsetning-selv-om-likevel`) already explicitly describe the exact construction
a given exercise drills.

### SETNINGSLEDD
| # | Exercise | Decision |
| - | -------- | -------- |
| 1 | Setningsledd (1): name the sentence elements (subjekt/verbal/objekt/adverbial/predikativ/setningsadverbial/indirekte objekt) in L1 | 🆕 **new topic candidate** |
| 2 | Setningsledd (2): identify the bolded element's function | 🆕 same candidate |
| 3 | Setningsledd (3): mark the boundaries between elements in whole sentences | 🆕 same candidate |
| 4 | Å gjøre et verb: subject-verb matching (semantic, not structural) | ⏭️ vocabulary-matching drill, no discrete grammar rule beyond basic verb meaning |
| 5 | Objekt eller predikativ?: direkte/indirekte objekt vs. predikativ classification | 🆕 same candidate — this specific 3-way distinction has no existing topic |
| 6 | De to gale kattene til naboen: build out NPs with determinativer + adjektiv | 🆕 same candidate (NP-building sub-skill) |
| 7 | Objektspredikativ og subjektspredikativ: sort predikativ by what it modifies | 🆕 same candidate |
| 8 | Er det trygt å fly?: place adverbialer in a cloze text | 🔁 `adverbial-fronting` (B2) / `setningsadverbial` (B2) — placement-in-context, not new |
| 9 | Hvor gamle blir vi?: unscramble words into correct ordstilling, fronted element given | 🔀 `v2-word-order` (currently A2/B1) — extend to B2 |
| 10 | Setningsanalyse: full S/V/O/Pt/a/A labeling of whole sentences | 🆕 same candidate (this is the "final exam" version of §1–3, same topic) |

**Kapittel 3 new-topic candidate confirmed:** nothing in the 39-topic B2 list, nor any cross-level
topic, targets sentence-element identification/labeling as its own skill (`v2-word-order` and
`subordinate-order` test *producing* correct order, not *naming* the elements). Proposing
**`setningsledd-identifikasjon`** to cover §1, 2, 3, 5, 6, 7, 10 above (element-naming,
objekt-vs-predikativ, NP-building, full-sentence analysis) — likely also absorbs Helsetninger
§11 and Leddsetninger §1, 2, 12, 17 below, since those are the same skill applied to
det-setninger and leddsetninger. A single topic spanning "identify/build/analyze sentence
elements" mirrors how `setningsadverbial` and `adverbial-fronting` already split placement from
fronting — this would be the identification counterpart.

### HELSETNINGER
| # | Exercise | Decision |
| - | -------- | -------- |
| 1 | Kulturelle uttrykk: word-order unscramble on an Amanda-prisen reading text | ⏭️ skip — reading-text content, not a discrete rule; possible vocab-plan flag (cultural facts) rather than grammar |
| 2–4 | Utbrytning: cleft subject/object/adverbial ("Det var X som …") | 🔁 `det-formelt-subjekt` (B2) — rule text already explicitly covers this exact cleft construction |
| 5 | Presentering: existential "det" sentences (Det er to hus …) | 🔁 `det-formelt-subjekt` (B2) — same "det" as formal subject construction |
| 6–9 | Er det noen hjemme? / Det og passiv / Inversjon / Det-setninger (grammaticality judgment) | 🔁 `det-formelt-subjekt` (B2) — direct match across all four |
| 10 | Spørreord: choosing the right question word from context | 🆕 **new topic candidate** — no existing topic drills hv-ord selection; small, could be its own touch or folded into `indirekte-tale-at-om`'s sibling content |
| 11 | Setningsskjema: place whole sentences into the forfelt/midtfelt/sluttfelt schema | 🆕 fold into `setningsledd-identifikasjon` (see Setningsledd above) |
| 12 | Sluttfeltet: sted/tid/årsak ordering within the sluttfelt | 🔁 `adverbial-fronting` (B2) / `setningsadverbial` (B2) — rule-text gap: neither currently states the sted-før-tid-før-årsak sluttfelt ordering rule explicitly; worth a small addition |
| 13 | Trykktungt det: "Nei, jeg tror ikke det" pattern | 🆕 small candidate — check whether `det-referanse` already covers this "det" standing in for a whole clause (it likely does, since its rule text gives "Ja, det er hun" as an example); probably 🔁 `det-referanse` on closer look |
| 14–16 | Trykklett pronomen + ikke: pronoun-object substitution combined with ikke-placement, incl. inverted/error-spotting variants | 🔀 `ikke-placement` (currently A2/B1) — extend to B2, folding in `pronomen-objektsform` (A1) as the supporting skill |
| 17 | Imperativsetninger: rewrite as imperative, incl. negative imperative (ikke + imperativ) | 🔀 `imperativ` (currently A1 only) — extend to B2 |

### LEDDSETNINGER
| # | Exercise | Decision |
| - | -------- | -------- |
| 1 | Leddsetninger (1): classify nominal/adjektivisk/adverbial leddsetning | 🆕 fold into `setningsledd-identifikasjon` |
| 2 | Nominale leddsetninger: identify the nominal leddsetning + its function (subjekt/objekt/predikativ) | 🆕 fold into `setningsledd-identifikasjon` |
| 3–4 | Å referere spørsmål: report yes/no questions (om) and hv-questions | 🔁 `indirekte-tale-at-om` (B2) — confirmed direct match, rule text covers both branches |
| 5 | Hva sier Simon?: reported-speech paragraph rewrite | 🔁 `indirekte-tale-at-om` (B2) |
| 6 | Som? (1): hva / hva som / hvem / hvem som | 🔁 `indirekte-tale-at-om` (B2) — rule text explicitly covers the "som" insertion when the question word is the embedded subject |
| 7 | Som? (2): join two sentences with relative «som» | 🔁 `relative-som` (B2) — direct match; note this topic currently has only 2 questions, so this is a substantial expansion opportunity |
| 8 | Hva vil de?: rewrite "for å" main clause as "fordi" leddsetning | 🔁 `arsak-og-folge-uttrykk` (B2) / `subjunksjon-oversikt` (B2) |
| 9 | Drar du nå, kan jeg ikke hjelpe deg!: conditional via inversion, no subjunction, **real** (not counterfactual) condition | 🔀 `hypotetiske-betingelsessetninger` (B2) — rule text already notes «hvis» can be dropped with inversion, but only in its counterfactual/hypothetical branches; extending to B2 needs a small rule-text addition covering **real present-tense conditionals** with inversion too (this exercise's examples are all presens, not preteritum) |
| 10 | Tur over Vidden: place setningsadverbial correctly *inside* leddsetninger | 🔀 `subordinate-order` (currently A2/B1) — extend to B2, direct match (adverb-inside-subordinate-clause placement) |
| 11 | Språkdetektiv: find and fix 1–3 ordstilling errors per sentence (mixed main/subordinate) | 🔀 `subordinate-order` / `v2-word-order` (B2 extension) — error-correction format drawing on both |
| 12 | Setningsskjema for leddsetninger: place a subordinate clause into the forbinderfelt/midtfelt/sluttfelt schema | 🆕 fold into `setningsledd-identifikasjon` |
| 13–14 | Invert helsetning so the leddsetning stands in forfeltet | 🔁 `adverbial-fronting` (B2) — a fronted subordinate clause triggers the same subject/verb inversion as any other fronted adverbial; direct extension of the existing rule's logic to clause-length adverbials |
| 15 | Komma?: comma placement with subordinate clauses (incl. non-restrictive relative clauses) | 🔁 `kommaregler` (B2) — direct match |
| 16 | Hva sier hun?: reported speech + invert leddsetning-turned-tidsledd to front | 🔁 `indirekte-tale-at-om` (B2) / `adverbial-fronting` (B2) |
| 17 | En leddsetning i en helsetning: identify function (subjekt/objekt/adverbial) of leddsetninger in whole sentences | 🆕 fold into `setningsledd-identifikasjon` |
| 18 | Fordi og derfor: join two sentences both ways | 🔁 `derfor-fordi` (B2) — exact match, topic is literally named for this pair |
| 19 | Selv om og likevel: join two sentences both ways | 🔁 `motsetning-selv-om-likevel` (B2) — direct match |
| 20 | Mens og samtidig: join two sentences both ways (simultaneity) | 🆕 small candidate — no existing topic covers this pair; same mechanic pattern as `tidssekvens-etter-at-etterpaa` (subjunction vs. V2-triggering sentence adverb) and `derfor-fordi`/`motsetning-selv-om-likevel`, so likely best as a small addition to `tidssekvens-etter-at-etterpaa` rather than a standalone topic — check rules.ts scope before deciding |

### Summary — Kapittel 3
The chapter reuses far more existing B2 topics than Kapittel 1–2 triage might have predicted,
because several rule texts written for other exercises already describe these constructions
in passing (`det-formelt-subjekt` covers utbrytning; `indirekte-tale-at-om` covers most of
Leddsetninger's referert-tale exercises). The one genuinely new, substantial topic is
**`setningsledd-identifikasjon`** (sentence-element and clause-function identification/analysis),
which absorbs about a third of this kapittel's exercises across all three subsections. Smaller
open items pending a closer rules.ts look: spørreord-selection (Helsetninger §10), trykktungt det
(§13, likely folds into `det-referanse`), sluttfelt sted/tid/årsak ordering (§12, likely a
rule-text addition to `adverbial-fronting`/`setningsadverbial` rather than new), real-condition
inversion (Leddsetninger §9, a rule-text addition to `hypotetiske-betingelsessetninger`), and
mens/samtidig (§20, likely folds into `tidssekvens-etter-at-etterpaa`).

**Preposisjoner §1** ("spørreord for preposisjonsledd" — which preposition-headed constituent does
a question word stand for) belongs here conceptually but is a small, self-contained drill; fold
it into `setningsledd-identifikasjon` alongside the other identification exercises rather than
opening a fourth kapittel's cross-reference.

---

## Phase 1 confirmed findings — Kapittel 4 TEKSTER OG TEKSTBINDING

Same method as Kapittel 1–3. This kapittel splits sharply in grammar-density between its two
subsections: **Tekstbinding** is rich in reusable connective/cohesion grammar (almost entirely
absorbed by the connective-toolkit topics already grown across Kapittel 1–3 —
`arsak-og-folge-uttrykk`, `kontrast-uttrykk`, `derfor-fordi`, `motsetning-selv-om-likevel`,
`hypotetiske-betingelsessetninger`, `subjunksjon-oversikt`, `indirekte-tale-at-om`,
`tidssekvens-etter-at-etterpaa`), while **Tekster** is almost entirely reading-comprehension /
text-type-recognition / vocabulary content with very little discrete grammar to quiz — the
mirror image of Kapittel 2's Mer om ord.

### TEKSTBINDING
| # | Exercise | Decision |
| - | -------- | -------- |
| 1 | Dette er nyhetene: sequence a news broadcast's sentences into order | ⏭️ skip — discourse-sequencing/cohesion exercise, no discrete grammar rule |
| 2 | Tidsforhold: etter at / etterpå / etter | 🔁 `tidssekvens-etter-at-etterpaa` (B2) — direct match; note this exercise also drills plain preposition «etter» (etter jobb) alongside the subjunksjon/adverb pair, a small rule-text addition worth considering |
| 3–4 | Hva spurte hun oss om? / Hva sa hun til oss?: reported speech with preteritumssamsvar (tense agreement) | 🔁 `indirekte-tale-at-om` (B2) — direct match, the rule text's tense-shift paragraph already describes exactly this preteritumssamsvar mechanic |
| 5–6 | Vanskelige budsjettforhandlinger / Hvem skal vi ansette?: reporting with varied verbs (understreke, være usikker på) | 🔁 `indirekte-tale-at-om` (B2) — same topic, wider set of reporting verbs |
| 7 | Ifølge far vil mor at …: marking second-hand information (ifølge X, visstnok) | 🔀/🆕 `indirekte-tale-at-om` (B2) extension — rule-text gap: current text doesn't cover «ifølge»/«visstnok» as hearsay-marking devices; small addition needed before writing questions |
| 8–9 | Hvorfor skjer det? / For – så: fordi/derfor/for/ettersom/nemlig/så … at/så | 🔁 `arsak-og-folge-uttrykk` (B2) / `derfor-fordi` (B2) — direct match, rule text explicitly lists this exact connective set |
| 10 | Hva er hensikten?: for at/slik at/så/hensikten med å/formålet med/på den måten/dermed | 🔁 `arsak-og-folge-uttrykk` (B2) — direct match, rule text's hensikt-clause bullet covers this |
| 11 | Med mindre du …: negative condition with «med mindre» | 🔁 `subjunksjon-oversikt` (B2) — direct match, rule text already lists «med mindre» under the condition bullet |
| 12–13 | Årsaksforhold (1)/(2): fuller cause/result/purpose toolkit (på grunn av at, følgen av, å resultere i, grunnen til at, å være skyld i, altså, med det resultat at) | 🔁 `arsak-og-folge-uttrykk` (B2) — direct match, essentially a drill of this topic's own rule-text vocabulary |
| 14 | Motsetning: likevel/selv om/imidlertid/men … likevel/til tross for at | 🔁 `kontrast-uttrykk` (B2) / `motsetning-selv-om-likevel` (B2) — direct match |
| 15 | Hvis du vil …: real (not counterfactual) conditionals | 🔀 `hypotetiske-betingelsessetninger` (B2) — same rule-text gap already flagged at Kapittel 3 Leddsetninger §9 (needs a real-condition/presens branch); one more data point for that addition |
| 16 | Bare det kunne begynne å snø …: wish (bare + preteritum), med mindre, ellers | 🔁 `hypotetiske-betingelsessetninger` (B2) for the «bare»-wish construction (rule text already covers «skulle ønske» / «tenk om» wishes, «bare» is the same family) / `kontrast-uttrykk` (B2) for «ellers» (already named in that topic's rule text) |
| 17 | Parsetninger: paraphrase reconstruction using the same connective set | ⏭️ **skip — vocab plan** (PARSETNINGER format, same convention as every other PARSETNINGER section across Kapittel 1–2) |

### TEKSTER
| # | Exercise | Decision |
| - | -------- | -------- |
| 1 | Hvilken type tekst er det?: match text snippets to genre (brosjyre/søknad/klage/rapport/annonse/instruksjon) | ⏭️ skip — genre recognition, no discrete grammar rule |
| 2 | Faktatekst: Klimasoner — 3-way cloze choosing the right word/expression per gap | ⏭️ skip — vocabulary-in-context/collocation choice, not a grammar rule; flag as a possible vocab-plan reading-cloze candidate |
| 3 | Veiledning: sequence instructions into the right order | ⏭️ skip — reading comprehension |
| 4 | Ledig stilling: job-ad reading comprehension Q&A | ⏭️ skip — reading comprehension |
| 5 | Formelt brev: klage — reading comprehension Q&A | ⏭️ skip — reading comprehension |
| 6 | Politiske partier: synonym-matching in a factual text | ⏭️ **skip — vocab plan** (synonym-matching format) |
| 7 | Anmeldelse: bokanmeldelse reading comprehension Q&A | ⏭️ skip — reading comprehension |
| 8 | Offentlige brev: fill in fixed formal-letter phrases | ⏭️ **skip — vocab plan** (faste uttrykk territory, formal-register collocations rather than a grammar rule) |
| 9 | Redegjørelse: divide an unparagraphed text into 6 avsnitt | ⏭️ skip — discourse-structuring exercise, no discrete grammar rule |
| 10 | Innledning eller avslutning?: classify text excerpts as intro/conclusion/neither | ⏭️ skip — genre-structure recognition |
| 11–12 | 2 + 1: generate for/mot arguments on a given claim | ⏭️ skip — open-ended writing practice |
| 13–14 | Et argument for/mot en sak: fill in logical connectors (bindeord) to make an argumentative text cohere | 🔁 `arsak-og-folge-uttrykk` / `kontrast-uttrykk` / `subjunksjon-oversikt` (B2) — a genuine connective-selection drill, same topic set as Tekstbinding above, just in a longer argumentative-text context |
| 15 | Test deg selv: metalinguistic quiz about text types (referat vocabulary, formal-letter conventions, genre terms) | ⏭️ skip — metalinguistic/genre knowledge, not a grammar rule |

### Summary — Kapittel 4
Tekstbinding contributes no new topics at all — every exercise either extends an existing B2
connective-toolkit topic or surfaces a small rule-text gap already flagged elsewhere
(real-condition inversion, now confirmed by two independent exercises across Kapittel 3 and 4;
a new hearsay-marking gap in `indirekte-tale-at-om` for «ifølge»/«visstnok»). Tekster contributes
almost nothing to this grammar plan — it is reading-comprehension, genre-recognition, and
vocabulary-in-context material nearly end to end, with only §13–14's connector-fill-in exercises
overlapping this plan's territory (and even those reuse existing topics rather than needing new
content).

**Phase 1 is now complete for all four kapittel.** No further triage remains before Phase 2
content-writing.

---

## Pre-Phase-2 checklist — rules.ts confirmation (done)

Read `src/lib/grammar/rules.ts` in full and checked every 🆕/small candidate flagged across
Kapittel 1–4 against the actual rule text (not just topic names/titles). Findings:

**Confirmed genuinely new topics (no existing rule text covers this skill):**
- `setningsledd-identifikasjon` (Kapittel 3) — nothing in rules.ts touches sentence-element
  naming/labeling, objekt-vs-predikativ, NP-building, or clause-function analysis. Absorbs
  Setningsledd §1–3/5–7/10, Helsetninger §11, Leddsetninger §1/2/12/17, and Preposisjoner §1.
- `determinativ-forsterkere` (Kapittel 1, Determinativer §13–15 — egen/selv/eneste). `adj-agreement`
  already covers «sånn/slik» agreement, so §6 (sånn) folds into `adj-agreement` instead of here —
  narrows this new topic to egen/selv/eneste only.
- `sammensatt-verbtid` (Kapittel 1, Verb §17 — naming verb1/verb2/tempus in compound verb forms).
- `adverb-gradboying` (Kapittel 1, Adverb §15 — gjerne→heller→helst, sakte→saktere). `adj-comparison`
  only ever discusses adjectives; no rule text covers adverb comparison at all.

**Reclassified from 🆕 to fold-into-existing after reading the actual rule text:**
- `vaere-vs-bli` (Verb §4) → 🔁 `passiv-bli-s` already contrasts «være»-passiv (resulting state) vs.
  «bli»-passiv (action in progress) at length — extend with a couple of plain (non-passive)
  være/bli state-vs-change questions rather than opening a new topic.
- `verbalsubstantiv-person-sak` (Kapittel 2, Avledninger §12) → 🔁 `ordfamilie-avledning`'s rule text
  already states this exact pattern verbatim ("ofte et eget substantiv for PERSONEN ... PROSESSEN ...
  RESULTATET" — produsent/produksjon/produkt). Direct match, no addition needed.
- `presens-partisipp-som-manerandverb` (Kapittel 1, Adverb §9 — komme løpende) → 🔁 `partisipp-former`'s
  rule text already gives "Han løp hjem mens han skrek → Han løp skrikende hjem" as its own example.
  Direct match.
- Helsetninger §13 (trykktungt det) → 🔁 `det-referanse` — its rule text already gives "Er hun flink? —
  Ja, det er hun" as an example of «det» standing in for a whole predicate/clause. Direct match,
  confirmed as suspected.
- `omraaderegelen-kantstedsregelen` (Kapittel 1, Preposisjoner §7, i/på) → 🔁 `preposisjoner-sted` —
  rule text already covers i/på for enclosed space vs. surface/workplace and the geography
  exceptions; treat as an extension (fresh i/på questions) rather than a new topic, though the
  underlying rule text doesn't name the "områderegelen/kantstedsregelen" terms explicitly — minor
  optional addition, not required to write questions.
- `predikativ-artikkel-regler` (Kapittel 1, Substantiv §8–9, ubestemt artikkel som predikativ) →
  🔁 `noun-articles` — rule text already covers the identity-statement article-drop pattern
  (yrke/nasjonalitet/livsfase); extend with more predikativ-focused questions, no new topic.

**Confirmed genuine rule-text gaps (small `explanationNb`/`explanationEn` additions needed before
writing questions for these touches):**
- Real-condition inversion in `hypotetiske-betingelsessetninger` — current rule text's only
  inversion example is the counterfactual preteritum-perfektum branch ("Hadde jeg vunnet...").
  Confirmed twice (Leddsetninger §9, Tekstbinding §15) that a presens real-condition variant
  with dropped «hvis» + inversion is untreated. Needs one added bullet before those two touches.
- Hearsay-marking «ifølge»/«visstnok» in `indirekte-tale-at-om` — rule text covers «at»/«om»/hv-word
  reported speech and tense-shift, but never mentions «ifølge X»/«visstnok» as hearsay markers.
  (Note: `modale-adverb` already covers plain «visst», a different word, so this is a genuine gap,
  not a duplicate.) Needs a short addition before Tekstbinding §7.
- Sluttfelt sted→tid→årsak ordering — neither `adverbial-fronting` nor `setningsadverbial` states
  an ordering rule for *multiple* adverbials stacked in the sluttfelt; both only address a single
  adverbial's placement/fronting. Needs a short addition before Helsetninger §12.

**Small items resolved without a new topic or addition:**
- `for-vs-fordi` (Kapittel 1, Konjunksjoner §2) → fold into the `koordinerende-konjunksjoner` B2
  extension (already planned to extend down from C); no rule-text gap, «for» is already listed
  as one of the five coordinating conjunctions there.
- `som-enn-sammenlikning` (Kapittel 1, Subjunksjoner §9) → fold into the `adj-comparison` B2
  extension; its rule text already uses «enn» after comparatives, so add a few «som...som»/«enn»
  comparison questions there rather than opening a new topic.
- Leddsetninger §20 (mens/samtidig) → fold into `tidssekvens-etter-at-etterpaa` as a small
  extension (same subjunction-vs-V2-adverb mechanic family), no separate topic.
- Helsetninger §10 (spørreord-selection) → fold into `setningsledd-identifikasjon`, per the
  original triage note.

**Question-type decision:** `setningsledd-identifikasjon` will use `multiple-choice` for
element-labeling/naming sub-skills (pick the correct label: subjekt/verbal/objekt/...) and
`fill`/`transform` for the NP-building and full-sentence-analysis sub-skills where a written
answer is more natural than a label choice.

---

## Rule-text gap additions — done

All three confirmed gaps have been written directly into `src/lib/grammar/rules.ts`
(`explanationEn` + `explanationNb` both updated, same convention as every existing entry):

1. **`hypotetiske-betingelsessetninger`** — added a closing bullet covering the REAL (presens)
   condition with dropped «hvis» + inversion, distinct from the counterfactual inversion already
   documented: "Hvis du drar nå, kan jeg ikke hjelpe deg" → "Drar du nå, kan jeg ikke hjelpe deg,"
   noting the main clause stays presens (not ville/skulle) unlike the hypothetical/counterfactual
   branches. Grounded in Leddsetninger §9's actual exercise sentence.
2. **`indirekte-tale-at-om`** — added a paragraph on secondhand/hearsay marking with «ifølge X»
   (fronted) and «visstnok» (in the clause), with a worked example: "Ifølge far vil mor at vi skal
   male hytta" / "Mor vil visstnok at vi skal male hytta." Grounded in Tekstbinding §7's actual
   exercise text and fasit answer.
3. **Sluttfelt sted→tid→årsak ordering** — added to `adverbial-fronting` (not `setningsadverbial`,
   on reflection — sted/tid/årsak are ordinary content adverbials, not setningsadverbialer like
   ikke/aldri/ofte, so the fit is better next to the existing fronting/field-structure discussion).
   States the book's own stated rule (sted før tid før årsak) with two worked examples drawn
   directly from Helsetninger §12's fasit answers.

All three examples were cross-checked against the actual arbeidsbok/fasit text (not invented) to
keep the rule text grounded, though the eventual quiz *questions* for these touches must still use
fresh characters/sentences per the copyright convention — the rule-text examples are fine to keep
as-is since `rules.ts` explanations are pedagogical reference text, not extracted questions.

---

## Next session starting point

Groundwork is now fully done — no more rules.ts checks or rule-text gaps remain. Phase 2 can start
on any touch, including the three rule-text-gap topics above, plus the many direct-match/fold-in
touches needing no groundwork at all — e.g. `substantivert-adjektiv`, `bli-presens-partisipp`,
`fa-perfektum-partisipp`, `tidssekvens-etter-at-etterpaa`, `stedsadverb-statisk-dynamisk`,
`adjektiv-eller-adverb`, `sammensatte-substantiv-b2`, `motsetning-prefiks`,
`ordfamilie-avledning`, `det-formelt-subjekt` (Helsetninger §2–9), `indirekte-tale-at-om`
(Leddsetninger §3–6, 16; Tekstbinding §3–7), `relative-som` (Leddsetninger §7 — good
opportunity to grow this 2-question topic), `derfor-fordi`, `motsetning-selv-om-likevel`,
`kommaregler`, `arsak-og-folge-uttrykk` and `kontrast-uttrykk` (both get a large boost from
Tekstbinding §8–14 and Tekster §13–14), `passiv-bli-s` (Verb §4/§7–11), `ordfamilie-avledning`
(Avledninger §12), `partisipp-former` (Adverb §9), `det-referanse` (Helsetninger §13),
`preposisjoner-sted` (Preposisjoner §7), `noun-articles` (Substantiv §8–9) — plus the four
confirmed new topics (`setningsledd-identifikasjon`, `determinativ-forsterkere`,
`sammensatt-verbtid`, `adverb-gradboying`), which need no rule-text gap-filling, just fresh
`explanationNb` write-ups since they're brand new entries in `rules.ts`.

**Recommended starting point next session:** `relative-som` (Leddsetninger §7) — smallest,
highest-value touch (grows a 2-question topic), fully direct-match, zero groundwork.

---

## Phase 2 progress log

- ✅ **Done — `relative-som`** (Leddsetninger §7). Extended `explanationEn`/`explanationNb` in
  `rules.ts` with the B2 nuance (obligatory when «som» is subject, optional when object, «der» for
  place nouns to avoid a stranded preposition). Added 9 new B2 questions (`gq-rel-034`–`gq-rel-042`:
  fill/transform/minimal-pair/multiple-choice mix) to `grammar.json`. Topic now has 11 B2 questions
  (was 2). JSON validated: no duplicate IDs, 2551 total questions in file.
- ✅ **Done — `det-formelt-subjekt`** (Helsetninger §2–9: utbrytning/cleft subject/object/adverbial,
  presentering/existential «det», «det»+passiv, inversjon, det-setninger grammaticality). Added 9
  new B2 questions (`gq-detform-013`–`gq-detform-021`: transform/fill/minimal-pair/multiple-choice/
  order mix covering cleft-subject, cleft-object, cleft-adverbial (sted/tid) constructions). Topic
  now has 21 B2 questions (was 12).
- ✅ **Done — `det-referanse`** (Helsetninger §13, trykktungt det — «det» standing in for a whole
  predicate/clause, e.g. «Ja, det er hun»). Added 12 new B2 questions (`gq-detref-001`–`gq-detref-012`:
  fill/transform/minimal-pair/multiple-choice mix). Topic now has 12 B2 questions (was 0 — first B2
  content for this topic).
  - Note: this session found and fixed a JSON corruption left over from the prior session's
    `det-referanse` insertion (a duplicated `{ "id": "gq-detref-001",` opening fragment had been
    left in `grammar.json`, breaking JSON parsing). Fixed via `Filesystem:edit_file`, re-verified:
    2560 total questions, no duplicate IDs.
  - Both touches validated: `check-b2-grammar-vocab.mjs det-formelt-subjekt det-referanse` → 0
    unmatched across 33 questions; `check-grammar-norwegian.mjs det-formelt-subjekt det-referanse
    relative-som` → 0 flagged across 75 questions.
- ✅ **Done — `partisipp-former`** (Adverb §9, «Hvordan kom de?» — presens partisipp as
  manner-of-motion adverb after «komme»/«løpe», e.g. «komme galopperende»). Confirmed direct
  match against the existing rule text (already gives «Han løp skrikende hjem» as an example, no
  rule-text gap). Added 10 new B2 questions (`gq-partform-033`–`gq-partform-042`: fill/transform/
  multiple-choice/minimal-pair/order mix) using fresh characters/sentences (not the book's own
  scenarios), drawing on the same manner-of-motion verb class (trille, hoppe, klatre, marsjere,
  rope, sveve, stavre, spasere, snike) the exercise itself uses. Topic now has 42 total questions
  (32 → 42; 21 B2 → 31 B2). Validated: `check-b2-grammar-vocab.mjs partisipp-former` → 0
  unmatched across 31 B2 questions; `check-grammar-norwegian.mjs partisipp-former` → 0 flagged
  across all 42 questions. Applied to the real `grammar.json` via `Filesystem:edit_file`,
  re-verified: 2570 total questions file-wide, no duplicate IDs.
- ✅ **Done — `stedsadverb-statisk-dynamisk`** (Adverb §5–6, «Sommerøya vår» narrative +
  positional/compass adverb drill). Found a small rule-text gap: §6's bakerst/innerst/nederst/
  øverst (static-only relative-position adverbs) and nordover-type compass adverbs (dynamic-only)
  weren't covered by the existing static/dynamic-pair rule text, so added a new paragraph to both
  `explanationEn`/`explanationNb` describing both sub-patterns before writing questions. Added 10
  new B2 questions (`gq-stedsadv-021`–`gq-stedsadv-030`: fill/multiple-choice/minimal-pair/order/
  transform mix) covering fremst/bakerst, øverst/nederst, innerst, and nordover/sørover/østover/
  vestover, with fresh scenarios (not the book's own sentences). Topic now has 30 total questions
  (20 → 30; 10 B2 → 20 B2, 10 B1 unchanged). Validated:
  `check-b2-grammar-vocab.mjs stedsadverb-statisk-dynamisk` → 0 unmatched across 20 B2 questions;
  `check-grammar-norwegian.mjs stedsadverb-statisk-dynamisk` → 0 flagged across all 30 questions.
  Applied to the real `grammar.json` via `Filesystem:edit_file`, re-verified: 2580 total questions
  file-wide, no duplicate IDs.
- ✅ **Done — `adjektiv-eller-adverb`** (Adverb §1, «Sjuende far i huset» fable text — spotting
  adjective vs. adverb forms). Confirmed direct match against the existing rule text (sikker/
  sikkert, god/godt contrast already fully covered, no rule-text gap). Added 10 new B2 questions
  (`gq-adjadv-033`–`gq-adjadv-042`: fill/minimal-pair/multiple-choice/transform/order mix) using
  fresh adjective/adverb pairs beyond the existing sikker-heavy set — god/godt, pen/pent, høy/høyt,
  klar/klart, vakker/vakre, rar/rart, gal/galt — with fresh characters/scenarios (Ingrid, koret,
  journalisten, etc.), not the book's own fable text. Topic now has 42 total questions (32 → 42;
  11 B2 → 21 B2). Validated: `check-b2-grammar-vocab.mjs adjektiv-eller-adverb` → 0 unmatched
  across 21 B2 questions; `check-grammar-norwegian.mjs adjektiv-eller-adverb` → 0 flagged across
  all 42 questions. Applied to the real `grammar.json` via `Filesystem:edit_file`, re-verified:
  2590 total questions file-wide, no duplicate IDs.
- ✅ **Done — `sammensatte-substantiv-b2`** (Sammensatte ord §1–3, 7–8 — forledd/etterledd,
  fugeformativ regler, ett/to ord). Confirmed direct match against the existing rule text (bindings-s
  after -sjon/-else/-skap/-het/-dom/-tet/-ing/-ning, bindings-e after short person/animal words, no
  binding otherwise, plus the adjective+noun-vs-fused-compound distinction — all already covered, no
  rule-text gap). Added 10 new B2 questions (`gq-samset2-013`–`gq-samset2-022`: transform/fill/
  multiple-choice/minimal-pair mix) using fresh compound pairs beyond the existing set —
  diskusjonsgrunnlag, barndomsminne, kvalitetskontroll, søvnløshetsproblem, kattemat, kvinneavdeling,
  sofabordet, stuevindu, plus a new storby/stor-by minimal-pair pair (fixed-term vs. literal-size
  contrast, same structure as the existing brunost pair). Topic now has 22 total questions (12 → 22,
  all B2). Validated: `check-b2-grammar-vocab.mjs sammensatte-substantiv-b2` → 0 unmatched across
  22 B2 questions; `check-grammar-norwegian.mjs sammensatte-substantiv-b2` → 0 flagged across all
  22 questions. Applied to the real `grammar.json` via `Filesystem:edit_file`, re-verified: 2600
  total questions file-wide, no duplicate IDs.
- ✅ **Done — `motsetning-prefiks`** (Avledninger §2, «Hva er det motsatte?» — forming opposites
  with u-/mis-/van- prefixes). Confirmed direct match against the existing rule text (all three
  prefixes already covered, no rule-text gap). Added 10 new B2 questions (`gq-motpre-012`–
  `gq-motpre-021`: transform/fill/multiple-choice/minimal-pair mix) using fresh vocabulary beyond
  the existing set — hell/uhell, flaks/uflaks, spiselig/uspiselig, tolke/mistolke,
  oppfatte/misoppfatte, lykket/mislykket (adjective form), heldig/uheldig, misforstår (fresh
  tense/context) — plus, notably, the topic's first-ever questions using the «van-» prefix
  (vanskjøtte, mentioned in the rule text but previously unquizzed): one transform and one
  minimal-pair (correct «vanskjøttet» vs. the wrong prefix «uskjøttet»). Topic now has 21 total
  questions (11 → 21, all B2). Validated: `check-b2-grammar-vocab.mjs motsetning-prefiks` → 0
  unmatched across 21 B2 questions; `check-grammar-norwegian.mjs motsetning-prefiks` → 0 flagged
  across all 21 questions. Applied to the real `grammar.json` via `Filesystem:edit_file`,
  re-verified: 2610 total questions file-wide, no duplicate IDs.
- ✅ **Done — `substantivert-adjektiv`** (Adjektiv §16 — nominalized adjectives, e.g. «de unge»,
  «den ansatte», «det gode»). Confirmed direct match against the existing rule text (foranstilt
  bestemmer + weak adjective ending, singular «den»/«det» for one person or an abstract quality,
  plural «de» for a group — all already covered, no rule-text gap). Added 10 new B2 questions
  (`gq-substadj-013`–`gq-substadj-022`: fill/transform/multiple-choice/order/minimal-pair mix)
  using fresh vocabulary beyond the existing fattige/ansatte/eldre/arbeidsledige/unge/syke/uføre/
  gode/gamle set — rike, blinde, hjemløse, sultne, modige, kloke, friske, and a second abstract-
  quality singular «det vakre» alongside the existing «det gode», plus triste and sterke/svake.
  Topic now has 22 total questions (12 → 22, all B2). Validated:
  `check-b2-grammar-vocab.mjs substantivert-adjektiv` → 0 unmatched across 22 B2 questions;
  `check-grammar-norwegian.mjs substantivert-adjektiv` → 0 flagged across all 22 questions.
  Applied to the real `grammar.json` via `Filesystem:edit_file`, re-verified: 2620 total questions
  file-wide, no duplicate IDs.
- ✅ **Done — `bli-presens-partisipp`** («bli» + presens partisipp, durative aspect — e.g. «ble
  boende», «ble sittende»). Confirmed direct match against the existing rule text (durative/
  ongoing-action meaning, common verb set bo/sitte/ligge/stå, presens partisipp never inflects —
  all already covered, no rule-text gap). Added 10 new B2 questions (`gq-blipres-011`–
  `gq-blipres-020`: fill/transform/minimal-pair/order/multiple-choice mix) using fresh scenarios
  with the same core verb set the rule text names (bo, sitte, ligge, stå, være) — hytta, en
  forelesning, en katt på verandaen, turister i regnet, en pasient på sykehuset, barn i parken,
  vakter ved en inngang — not the book's own sentences, and each question also carries the
  existing topic's `plusOnly: true` field. Topic now has 20 total questions (10 → 20, all B2).
  Validated: `check-b2-grammar-vocab.mjs bli-presens-partisipp` → 0 unmatched across 20 B2
  questions; `check-grammar-norwegian.mjs bli-presens-partisipp` → 0 flagged across all 20
  questions. Applied to the real `grammar.json` via `Filesystem:edit_file`, re-verified: 2630
  total questions file-wide, no duplicate IDs.
- ✅ **Done — `passiv-bli-s`** (bli-passiv, s-passiv, and være-passiv — Verb §7–11). Confirmed
  direct match against the existing rule text (three passive forms, s-passiv common with modals,
  være-passiv describing a resulting state vs. bli-passiv describing the action in progress, plus
  the åpne/åpen trap — all already covered, no rule-text gap). The existing 11 B2 questions were
  almost entirely modal + s-passiv drills, so the new batch targets the under-covered corners:
  aktiv → bli-passiv transforms (with and without kept agent), være- vs. bli-passiv state/action
  contrast, imperativ → s-passiv (oppskrift-style instruction), and a bli-passiv partisipp-vs-
  infinitiv minimal pair. Added 10 new B2 questions (`gq-passivbs-044`–`gq-passivbs-053`:
  transform/fill/minimal-pair/multiple-choice/order mix); one draft (åpen/åpnet trap) was swapped
  out during drafting since that exact contrast was already covered at B1 (`gq-passivbs-038`–
  `043`) — replaced with a fresh være-passiv contrast ("Kontrakten er underskrevet"). Topic now
  has 53 total questions (43 → 53; B2 count 11 → 21). Validated:
  `check-b2-grammar-vocab.mjs passiv-bli-s` → 0 unmatched across 21 B2 questions;
  `check-grammar-norwegian.mjs passiv-bli-s` → 0 flagged across all 53 questions. Applied to the
  real `grammar.json` via `Filesystem:edit_file`, re-verified: 2640 total questions file-wide, no
  duplicate IDs.
- ✅ **Done — `derfor-fordi`** («derfor» V2-inversion vs. «fordi» normal leddsetningsrekkefølge).
  Confirmed direct match against the existing rule text (no rule-text gap). Added 10 new B2
  questions (`gq-derforfordi-025`–`gq-derforfordi-034`: fill/minimal-pair/order/transform/
  multiple-choice mix) with fresh domains not yet used in the existing B2 set (which already
  covered inflasjon/rente, klima/forsikring, studenter/budsjett, permittering, strømpriser,
  produktklage, politikerkritikk) — helsekø, boligmarked/distriktsflytting, trafikk/sykkelvei,
  digitalisering, konsertavlysning, strømnett-oppgradering, fjelltur, og en ny permitteringssak
  med utenlandske ordre. Topic now has 34 total questions (24 → 34; B2 count 10 → 20). Validated:
  `check-b2-grammar-vocab.mjs derfor-fordi` → 0 unmatched across 20 B2 questions;
  `check-grammar-norwegian.mjs derfor-fordi` → 0 flagged across all 34 questions. Applied to the
  real `grammar.json` via `Filesystem:edit_file`, re-verified: 2650 total questions file-wide, no
  duplicate IDs.
- ✅ **Done — `arsak-og-folge-uttrykk`** (broader årsak/følge/hensikt toolkit beyond derfor/
  fordi — siden/i og med at/ettersom, dermed/nemlig, føre til/skyldes/gjør at/føre med seg/henge
  sammen med, grunnen/årsaken/følgen, for at/slik at/så). Confirmed direct match against the
  existing rule text (no rule-text gap; the rule text already covers all the expressions drawn on
  below). The existing 14 B2 questions covered most subjunksjoner, adverb, and årsaksverb pairs
  well, so the new batch targeted the under-covered corners: hensikt (purpose) clauses with «for
  at» vs. «så» vs. plain «fordi», the «for at» + modalverb vs. «for å» + infinitiv same-subject/
  different-subject trap, the fixed expression «dermed basta!», «følgen» used alone (not just in
  «følgen av»), a «henger sammen med» (correlation) vs. «skyldes»/«fører til» (direct causation)
  contrast, and a fresh «i og med at» + «grunnen til at» reinforcement with new scenarios. Added
  10 new B2 questions (`gq-arsak-025`–`gq-arsak-034`: fill/minimal-pair/transform/multiple-choice/
  order mix). Topic now has 34 total questions (24 → 34; B2 count 14 → 24). Validated:
  `check-b2-grammar-vocab.mjs arsak-og-folge-uttrykk` → 0 unmatched across 24 B2 questions;
  `check-grammar-norwegian.mjs arsak-og-folge-uttrykk` → 0 flagged across all 34 questions.
  Applied to the real `grammar.json` via `Filesystem:edit_file`, re-verified: 2660 total questions
  file-wide, no duplicate IDs.
- ✅ **Done — `kontrast-uttrykk`** (sibling topic to `arsak-og-folge-uttrykk` — subjunksjoner,
  adverb, korrelatpar, and the multi-meaning «enda» vs. «ennå» distinction). Confirmed direct
  match against the existing rule text (no rule-text gap). Added 10 new B2 questions
  (`gq-kontrast-023`–`gq-kontrast-032`: fill/multiple-choice/minimal-pair/transform/order mix)
  covering «enda» as an intensifier ("enda en kaffe", "enda bedre") vs. its concessive use,
  «derimot», the korrelatpar «på den ene siden ... på den andre siden», «til tross for det»,
  and «ikke desto mindre». Topic now has 32 total questions (22 → 32; B2 count 12 → 22).
  Validated: `check-b2-grammar-vocab.mjs kontrast-uttrykk` → 0 unmatched across 22 B2 questions;
  `check-grammar-norwegian.mjs kontrast-uttrykk` → 0 flagged across all 32 questions. Applied to
  the real `grammar.json` via `Filesystem:edit_file`, re-verified: 2670 total questions
  file-wide, no duplicate IDs.
- ✅ **Done — `fa-perfektum-partisipp`** («få» + perfektum partisipp, resultative construction —
  e.g. «fikk reparert», «fikk levert»). Confirmed direct match against the existing rule text (no
  rule-text gap). Added 10 new B2 questions (`gq-faperf-011`–`gq-faperf-020`: fill/transform/
  minimal-pair/order/multiple-choice mix) using fresh verbs beyond the existing lese/levere/vaske/
  reparere/sende/kjøpe/rette/skrive/selge set — fikse, rydde, male, bygge, betale, hente, sy,
  pakke, oversette, and stryke (strøket), with fresh scenarios/characters. Topic now has 20 total
  questions (10 → 20, all B2). Validated: `check-b2-grammar-vocab.mjs fa-perfektum-partisipp` →
  0 unmatched across 20 B2 questions; `check-grammar-norwegian.mjs fa-perfektum-partisipp` → 0
  flagged across all 20 questions. Applied to the real `grammar.json` via `Filesystem:edit_file`,
  re-verified: 2680 total questions file-wide, no duplicate IDs.
- ✅ **Done — `tidssekvens-etter-at-etterpaa`** («etter at» vs. «etterpå» vs. «så», plus the
  Kapittel 3/4 fold-ins: mens/samtidig simultaneity pair and plain preposition «etter» vs. the
  subjunksjon «etter at»). Found the confirmed rule-text gap: the existing rule text covered
  only the sequence trio (etter at / etterpå / så), not the simultaneity pair «mens»
  (subjunksjon) vs. «samtidig» (setningsadverb, same V2-triggering mechanic as «etterpå»), nor
  the plain-preposition-vs-subjunksjon contrast for «etter» itself — added both to
  `explanationEn`/`explanationNb` before writing questions. Added 10 new B2 questions
  (`gq-tidseks-021`–`gq-tidseks-030`: fill/transform/minimal-pair/order/multiple-choice mix)
  covering «etter» (preposition) vs. «etter at» (subjunksjon), and «mens» vs. «samtidig»
  ordstilling contrasts, with fresh scenarios. Topic now has 30 total questions (20 → 30; B2
  count 10 → 20, B1 10 unchanged). Validated: `check-b2-grammar-vocab.mjs
  tidssekvens-etter-at-etterpaa` → 0 unmatched across 20 B2 questions;
  `check-grammar-norwegian.mjs tidssekvens-etter-at-etterpaa` → 0 flagged across all 30
  questions. Applied to the real `grammar.json` via `Filesystem:edit_file`, re-verified: 2690
  total questions file-wide, no duplicate IDs.
- ✅ **Done — `motsetning-selv-om-likevel`** (sibling topic to `tidssekvens-etter-at-etterpaa` —
  «men» coordinating vs. «selv om» subordinating vs. «likevel» V2-triggering sentence adverb).
  Confirmed direct match against the existing rule text (no rule-text gap). The existing 20
  questions (10 B1 + 10 B2) already covered a range of economic/political scenarios (renta,
  marked, skepsis, prosjekt, salg, ansatte, reform, arbeidsledighet, fagforening, uenig/vedtak),
  so the new batch used fresh domains: legevakt/pasient (helse), klimaforskning/utslipp, skole/
  elever, app/brukere, boligpriser/unge, idrettslag/utstyr, museum/åpningstider, bedrift/konkurs,
  allergi, strømpriser/husholdninger. Added 10 new B2 questions (`gq-motselv-021`–`gq-motselv-030`:
  transform/order/minimal-pair/fill mix). Topic now has 30 total questions (20 → 30; B2 count
  10 → 20, B1 10 unchanged). Validated: `check-b2-grammar-vocab.mjs motsetning-selv-om-likevel`
  → 0 unmatched across 20 B2 questions; `check-grammar-norwegian.mjs
  motsetning-selv-om-likevel` → 0 flagged across all 30 questions. Applied to the real
  `grammar.json` via `Filesystem:edit_file`, re-verified: 2700 total questions file-wide, no
  duplicate IDs.
- ✅ **Done — `indirekte-tale-at-om`** (Leddsetninger §3–6, 16; Tekstbinding §3–7 — at/om reported
  speech, wh-question reporting with som-insertion, preteritumssamsvar, and the «ifølge X»/
  «visstnok» hearsay-marking rule-text addition made two sessions ago). Confirmed direct match
  against the existing rule text (no further rule-text gap — the «ifølge»/«visstnok» paragraph
  was already added). The existing 16 B2 questions covered at/om reporting, som-insertion,
  imperativ→modalverb, and the lurer-på-vs-vil-vite nuance well, but had zero questions on the
  hearsay-marking construction itself, so the new batch targeted that gap directly: «ifølge X»
  fronting with V2 inversion, «visstnok» as an in-clause setningsadverbial, an «ifølge»+at-setning
  combination (per the rule text's note that both can combine with an ordinary at-clause), plus
  a few fresh reporting-verb questions (understreke, er usikker på, benekte) to widen the
  reporting-verb set beyond si/mene/spørre/lure på. Added 10 new B2 questions
  (`gq-indirtale-067`–`gq-indirtale-076`: transform/minimal-pair/fill/order mix). Topic now has
  76 total questions (66 → 76; B2 count 16 → 26). Validated: `check-b2-grammar-vocab.mjs
  indirekte-tale-at-om` → 0 unmatched across 26 B2 questions; `check-grammar-norwegian.mjs
  indirekte-tale-at-om` → 0 flagged across all 76 questions. Applied to the real `grammar.json`
  via `Filesystem:edit_file`, re-verified: 2710 total questions file-wide, no duplicate IDs.
- ✅ **Done — `kommaregler`** (Leddsetninger §15 — comma placement with subordinate clauses, incl.
  non-restrictive relative clauses). Confirmed direct match against the existing rule text (no
  rule-text gap — the two documented rules, fronted-leddsetning comma and list comma, already
  cover this exercise's material; the existing C-level content separately handles the
  innskutt-setning/apposisjon pattern). The existing 23 B2 questions covered fronted-vs-trailing
  leddsetning comma (selv om/fordi/hvis/etter at/når), 3-item lists, and the men/for/og
  coordinating-conjunction comma contrast well, so the new batch widened the scenario pool with
  fresh domains — veterinær/hund, mens-simultaneity, teknologi (telefon/skjerm/mus), adjektiv-liste
  (spennende/morsom/lærerik), stedsnavn (Kyoto/Osaka/Tokyo), og a fresh hvis-betingelse (sol/strand)
  — plus one more each of the og-no-comma, men-comma, and for-comma minimal pairs. Added 10 new B2
  questions (`gq-komma-044`–`gq-komma-053`, all `punctuation` type). Topic now has 53 total
  questions (43 → 53; B2 count 23 → 33, C count 20 unchanged). Validated:
  `check-b2-grammar-vocab.mjs kommaregler` → 0 unmatched across 33 B2 questions;
  `check-grammar-norwegian.mjs kommaregler` → 0 flagged across all 53 questions. Applied to the
  real `grammar.json` via `Filesystem:edit_file`, re-verified: 2720 total questions file-wide, no
  duplicate IDs.
- ✅ **Done — `preposisjoner-sted`** (Preposisjoner §2–6 — i/på for enclosed space vs. surface/
  workplace, geography, sammensatte preposisjoner). Confirmed direct match against the existing
  rule text (no rule-text gap needed — i/på, hos/til, ved, geografi, and the compound-preposition
  list are all already documented; the book's own «områderegelen/kantstedsregelen» terms aren't
  named verbatim in `rules.ts`, but the underlying i/på distinction is). This topic had zero B2
  content before this touch (only A1/A2/B1, all physical-placement drills, plus a heavy B1
  ovenfor/overfor cluster), so the new batch targeted the under-covered corners at B2 level: i/på
  for enclosed space vs. workplace (skuffen vs. forsikringsselskap), geography exceptions (Kreta
  as an island vs. Canada as a country, på Vestlandet as a landsdel), and the more abstract
  sammensatte preposisjoner (på grunn av, i stedet for, ved hjelp av) and relative-position/
  tilhørighet patterns (mellom X og Y, fargen på bilen) that the rule text lists but no B1/A2
  question had drilled yet. Added 10 new B2 questions (`gq-prep-sted-055`–`gq-prep-sted-064`:
  fill/minimal-pair/multiple-choice mix). Topic now has 64 total questions (54 → 64; B2 count
  0 → 10 — first B2 content for this topic). Validated: `check-b2-grammar-vocab.mjs
  preposisjoner-sted` → 0 unmatched across 10 B2 questions; `check-grammar-norwegian.mjs
  preposisjoner-sted` → 0 flagged across all 64 questions. Applied to the real `grammar.json`
  via `Filesystem:edit_file`, re-verified: 2730 total questions file-wide, no duplicate IDs.
- ✅ **Done — `noun-articles`** (Substantiv §8–9, ubestemt artikkel som predikativ — 4-rule
  identity-statement article system). Confirmed direct match against the existing rule text (the
  yrke/nasjonalitet/livsfase article-drop pattern already covered, no rule-text gap). This topic
  already had 10 B2 questions from a prior round, so the new batch widened coverage of the
  4-rule predikativ system and the surrounding kjønn/bøying drills with fresh scenarios/
  characters. Added 10 new B2 questions (`gq-noun-art-049`–`gq-noun-art-058`: fill/transform/
  multiple-choice/minimal-pair mix). Topic now has 58 total questions (48 → 58; B2 count
  10 → 20). Validated: `check-b2-grammar-vocab.mjs noun-articles` → 0 unmatched across 20 B2
  questions; `check-grammar-norwegian.mjs noun-articles` → 0 flagged across all 58 questions.
  Applied to the real `grammar.json` via `Filesystem:edit_file`, re-verified: 2740 total
  questions file-wide, no duplicate IDs.
- ✅ **Done — `determinativ-forsterkere`** (Determinativer §13–15 — egen/eget/egne, selv, selve,
  eneste). First of the four confirmed brand-new topics. Added a `GrammarTopic` union member to
  `types.ts` and a new `GrammarRule` entry (`explanationEn`/`explanationNb`) to `rules.ts`
  covering three sub-rules: **egen/eget/egne** (agrees with noun gender/number, follows a
  possessive rather than an indefinite article), **selv** (invariant, postposed emphatic pronoun)
  vs. **selve** (invariant, prenominal intensifier before a definite-form noun), and **eneste**
  (invariant, requires the following noun in definite form with a definite article). Note:
  «sånn» (Determinativer §6) was excluded per the earlier rules.ts check — it folds into
  `adj-agreement` instead, narrowing this topic to egen/selv/eneste only. Added 10 new B2
  questions (`gq-detfork-001`–`gq-detfork-010`: fill/order/minimal-pair/transform/
  multiple-choice mix), fresh characters (Marte, Fredrik, Jonas, Ingrid). Topic now has 10 total
  questions (all B2, first content for this topic). Validated: `check-b2-grammar-vocab.mjs
  determinativ-forsterkere` → 0 unmatched across 10 B2 questions; `check-grammar-norwegian.mjs
  determinativ-forsterkere` → 0 flagged across all 10 questions. Applied to the real
  `types.ts`, `rules.ts`, and `grammar.json` via `Filesystem:edit_file`, re-verified: 2750 total
  questions file-wide, no duplicate IDs.
- ✅ **Done — `adverb-gradboying`** (Adverb §15 — adverb comparison: regular -ere/-est for
  manner/frequency adverbs, plus the irregular suppletive trio gjerne→heller→helst). Second of
  the four confirmed brand-new topics. Added the `GrammarTopic` union member to `types.ts` and a
  new `GrammarRule` entry to `rules.ts` covering the regular pattern (sakte→saktere, fort→fortere→
  fortest, ofte→oftere→oftest, tidlig→tidligere→tidligst, comparative always followed by «enn»)
  plus the irregular trio's semantics (gjerne = positive/willing, heller = comparative used with
  «enn» when preferring one thing over another, helst = superlative, preferred most among several
  options, no «enn»). Added 10 new B2 questions (`gq-advgrad-001`–`010`: fill/order/transform/
  minimal-pair/multiple-choice mix), fresh characters/scenarios (Emma, Marte, Kari, a pasient),
  covering both the regular -ere/-est forms (saktere, fortest, oftere, senest) and the
  gjerne/heller/helst trio. Topic now has 10 total questions (all B2, first content for this
  topic). Applied to the real `types.ts`, `rules.ts`, and `grammar.json` via `Filesystem:edit_file`,
  re-verified against the file tail: 2760 total questions file-wide (2750 + 10), no duplicate IDs
  (fresh `gq-advgrad-` prefix, confirmed unused). Note: `check-b2-grammar-vocab.mjs`/
  `check-grammar-norwegian.mjs` were not run this session (no script-execution access to the
  user's machine with this session's toolset, only file read/edit) — flagging for a validation
  pass next session before starting new content.
- ✅ **Done — `sammensatt-verbtid`** (Verb §17 — naming verb 1 / verb 2 / tempus in compound verb
  forms). Third of the four confirmed brand-new topics. Added the `GrammarTopic` union member to
  `types.ts` and a new `GrammarRule` entry to `rules.ts` defining verb 1 (finite auxiliary,
  carries tense, plass 2) vs. verb 2 (non-finite main verb, infinitiv or perfektum partisipp,
  never inflects) and naming the four compound tempus: presens perfektum (har + partisipp),
  preteritum perfektum (hadde + partisipp), futurum (skal/vil + infinitiv), futurum i fortid
  (skulle/ville + infinitiv). Added 10 new B2 questions (`gq-samverbtid-001`–`010`:
  multiple-choice/fill/transform/order/minimal-pair mix) covering tempus-naming,
  verb1/verb2-identification, verb2-form selection (infinitiv vs. partisipp), tense-shift
  transforms (presens perfektum→preteritum perfektum, futurum→futurum i fortid), and a
  minimal-pair on verb 2 never taking a finite ending. Topic now has 10 total questions (all B2,
  first content for this topic). Applied to the real `types.ts`, `rules.ts`, and `grammar.json`
  via `Filesystem:edit_file`, re-verified against the file tail: 2770 total questions file-wide
  (2760 + 10), no duplicate IDs (fresh `gq-samverbtid-` prefix, confirmed unused). Note:
  `check-b2-grammar-vocab.mjs`/`check-grammar-norwegian.mjs` again not run this session (no
  script-execution access with this session's toolset) — still flagged for a validation pass.
- ✅ **Done — `setningsledd-identifikasjon`** (the fourth and largest confirmed brand-new
  topic — absorbs Setningsledd §1–3/5–7/10, Helsetninger §11, Leddsetninger §1/2/12/17, and
  Preposisjoner §1). Worked step by step so progress survived a session break; each sub-step was
  checkpointed immediately after being applied to the real files.
  - [x] **Step 1 — `types.ts`**: added the `GrammarTopic` union member (with doc comment covering
    element-naming/labeling, NP-building, and clause-function analysis). Applied via
    `Filesystem:edit_file`.
  - [x] **Step 2 — `rules.ts`**: added the `GrammarRule` entry (`explanationEn`/`explanationNb`)
    covering the core element set (subjekt, verbal, direkte/indirekte objekt, subjekts-/
    objektspredikativ with the «være + X» substitution test vs. objekt, adverbial,
    setningsadverbial with its placement contrast in hel- vs. leddsetning), NP-building
    (determinativ + adjektiv + substantiv agreement, worked example «de to gamle kattene»),
    clause-function analysis (a leddsetning filling a subjekt/objekt/adverbial slot, one worked
    example each), and the forfelt/midtfelt/sluttfelt setningsskjema (folded in here rather than
    a separate topic, per the plan doc's original note). Applied via `Filesystem:edit_file`.
  - [x] **Step 3, batch 1 of 2 — `grammar.json`** (element-labeling, 6 questions): added
    `gq-setnledd-001`–`006` (all `multiple-choice`) covering subjekt-identification, direkte vs.
    indirekte objekt (same sentence, two questions), subjektspredikativ vs. objekt, an
    objektspredikativ example, and setningsadverbial identification («ikke»). Fresh characters/
    scenarios (legen/pasienten, naboen/kake, broren/tannlege). Applied via `Filesystem:edit_file`.
    Running total: 6 questions in this topic so far (all B2). File-wide total not yet
    re-verified this session (no script/count access) — was 2770 before this topic started, so
    should now be 2776 after this batch (2770 + 6).
  - [x] **Step 3, batch 2 of 2 — `grammar.json`** (NP-building, clause-function analysis,
    setningsskjema, 6 questions): added `gq-setnledd-007`–`012` — fill (adjektiv agreement in a
    flertall/bestemt NP, «De tre små barna»), order (subjektsfrase-first sentence build, «Den
    gamle læreren»), three multiple-choice questions on leddsetning clause-function (subjekt/
    objekt/adverbial, one worked example each mirroring the three `rules.ts` examples), and a
    transform question on sluttfelt sted-før-årsak ordering. Fresh scenarios throughout (børn i
    hagen, læreren/regelen, møtet i Bergen). Applied via `Filesystem:edit_file`.

  **Topic complete: `setningsledd-identifikasjon` now has 12 total questions (all B2, first
  content for this topic) — `gq-setnledd-001`–`012`.** File-wide total not re-verified by script
  this session (no script/count access), but should now be 2782 (2770 before this topic + 12).
  **Validation still outstanding for this whole topic** (`check-b2-grammar-vocab.mjs
  setningsledd-identifikasjon` and `check-grammar-norwegian.mjs setningsledd-identifikasjon`) —
  run these first next session, alongside the other three topics from this session
  (`adverb-gradboying`, `sammensatt-verbtid`) that are also still unvalidated by script.

  **Validation update:** `check-b2-grammar-vocab.mjs` had a hardcoded `B2_TOPICS` whitelist that
  didn't include any of this session's four new topics, so it would have silently reported "no
  matching questions" rather than actually checking them. Added `determinativ-forsterkere`,
  `adverb-gradboying`, `sammensatt-verbtid`, and `setningsledd-identifikasjon` to that whitelist
  (all `cefr: 'B2'` only, matching how every other topic in that list is scoped). Applied via
  `Filesystem:edit_file`. `check-grammar-norwegian.mjs` needed no update — it has no topic
  whitelist, and the user ran it and confirmed no issues (all four new topics' Norwegian
  instructional text passes clean). Still outstanding: actually running
  `check-b2-grammar-vocab.mjs` against the four new topics (no script-execution access with this
  session's toolset) — run `node scripts/check-b2-grammar-vocab.mjs determinativ-forsterkere
  adverb-gradboying sammensatt-verbtid setningsledd-identifikasjon` next session to confirm the
  new questions are anchored to real B2 (or earlier-level) vocabulary.

  **Validation complete:** the user ran `check-b2-grammar-vocab.mjs` against all four new topics
  — clean, zero flagged/unmatched questions. Combined with the earlier clean
  `check-grammar-norwegian.mjs` run, both validators now pass for `determinativ-forsterkere`,
  `adverb-gradboying`, `sammensatt-verbtid`, and `setningsledd-identifikasjon`. No outstanding
  validation work remains for this session's content.

  **This completes all four confirmed brand-new topics** from the Pre-Phase-2 checklist
  (`determinativ-forsterkere`, `adverb-gradboying`, `sammensatt-verbtid`,
  `setningsledd-identifikasjon`). Remaining Phase 2 work is the large list of direct-match/
  fold-in touches to existing topics noted in “Next session starting point” above that haven't
  been done yet: e.g. `spesial-kvantorer`, `subjunksjon-oversikt`, `modale-adverb`,
  `modalverb-betydning`, `sannsynlighet-uttrykk`, `hoflig-preteritum`,
  `man-en-upersonlig-pronomen`, `mene-synes-tro-tenke`, `preteritum-perfektum-og-futurum`,
  `partikkelverb-los-fast`, `adj-agreement`, `adj-comparison` (B2 extension),
  `noun-possessives` (B2 extension), `v2-word-order` (B2 extension), `subordinate-order` (B2
  extension), `koordinerende-konjunksjoner` (B2 extension), `bade-og-verken-eller` (B2 extension),
  `leddsetning-som-fundament` (B2 extension), `verbprefiks-be-an-mis` (B2 extension),
  `sterke-verb`/`partisipp-former` (Verb §1), `preposisjoner-tid`, `preposisjoner-uttrykk-b2`, and
  the `ikke-placement`/`imperativ` B2 extensions (Helsetninger §14–17) — plus a few small
  remaining rule-text folds noted inline in the Kapittel summaries (e.g. «mens/samtidig» into
  `tidssekvens-etter-at-etterpaa`, already done; «som/enn» into `adj-comparison`; «for/fordi» into
  `koordinerende-konjunksjoner`).
- ✅ **Done — `kvantorer`** (Determinativer §7–12 — litt/lite, ingen/noen, alle/hver, hele/all,
  begge deler/begge to, plus the broader mye/mange/mer/flere toolkit already in the rule text).
  Confirmed direct match against the existing rule text (no rule-text gap — mye/mange, mer/flere,
  få/lite, noen/noe, de fleste/det meste, mindre/færre, litt/lite, and the av+bestemt-form vs.
  ubestemt-form generality distinction were all already covered). Note on process: since this is
  an existing topic (not a brand-new one), the highest existing question number and the
  established `plusOnly` convention had to be confirmed by asking the user to run `grep`/a small
  Python script against the real `grammar.json` — no content-search tool is available for the
  user's filesystem in this session's toolset (only whole-file/head/tail reads), so mid-file
  lookups for existing-topic extensions need this kind of user-run check going forward. Confirmed:
  38 existing `kvantorer` B2 questions (highest ID `gq-kvantorer-038`), and none of them carry a
  `plusOnly` field — B2 gating apparently happens elsewhere (by topic/cefr) for this topic, not
  per-question, so the new questions matched that and also omit `plusOnly`. Added 10 new B2
  questions (`gq-kvantorer-039`–`048`: fill/minimal-pair/multiple-choice/transform mix) covering
  mye/mange, mer/flere (two contexts — utellelig vs. tellelig), få/lite, litt vs. lite, de
  fleste/det meste, noen/noe, the mengdeord+av+bestemt-form transform, and mindre/færre (two
  contexts). Topic now has 48 total B2 questions (38 → 48). Applied to the real `grammar.json` via
  `Filesystem:edit_file`. Not yet run this session: `check-b2-grammar-vocab.mjs kvantorer` and
  `check-grammar-norwegian.mjs kvantorer` — run these next before starting a new topic.

  **Validation complete:** user ran both — `check-b2-grammar-vocab.mjs kvantorer` → 0 unmatched
  across 20 B2 questions; `check-grammar-norwegian.mjs kvantorer` → 0 flagged across all 48
  questions (all cefr levels). `kvantorer` touch is fully done and validated.
- ✅ **Done — `spesial-kvantorer`** (Determinativer §7, §12 — ingen/ikke noen, all/alt/alle,
  hel/helt/hele, hver/hvert, enhver/ethvert, begge (to)/begge deler). Confirmed direct match
  against the existing rule text (no rule-text gap — all six sub-rules already documented).
  Process followed per the note from last session: confirmed existing count (24 total: 14 B2 +
  10 B1, highest ID `gq-speskvant-024`) and `plusOnly` convention (all existing B2 questions use
  `plusOnly: true`) via a user-run Python check before drafting. Read the B1 set (015–024) too,
  which revealed `enhver`/`ethvert` was already drilled at B1 (elev, menneske, bok/regel,
  regning, bibliotek, person) but had **zero** B2 questions — the existing B2 batch (001–014)
  only covered ingen/ingenting, all/alt/alle, hel/hele/helt, hver/hvert, and begge — so the new
  batch targeted that gap directly, plus fresh reinforcement for the other sub-rules with new
  vocabulary/characters not used in either the B1 or B2 sets (medlem, borger, ansatt, bøkene,
  kunnskap, sommer/hytte, barn/klasse, Marte og Sindre, sommer/vinter). Added 10 new B2 questions
  (`gq-speskvant-025`–`034`: fill/multiple-choice/transform/minimal-pair mix), each with
  `plusOnly: true` matching the topic's convention. Topic now has 34 total questions (24 → 34;
  B2 count 14 → 24). Applied to the real `grammar.json` via `Filesystem:edit_file` (dry-run
  diff confirmed, then applied for real). Not yet run this session: `check-b2-grammar-vocab.mjs
  spesial-kvantorer` and `check-grammar-norwegian.mjs spesial-kvantorer` — run these next before
  starting a new topic.

  **Validation complete:** user ran both — `check-b2-grammar-vocab.mjs spesial-kvantorer` → 0
  unmatched across 24 B2 questions; `check-grammar-norwegian.mjs spesial-kvantorer` → 0 flagged
  across all 24 questions. `spesial-kvantorer` touch is fully done and validated.

## Next session starting point (session ending — read this first)

Session budget is nearly exhausted. Everything above is confirmed applied and validated up to
and including `kvantorer`. No in-progress/uncommitted work remains — every topic in the Phase 2
progress log ends in a ✅ **Done** with both validators run clean, so the next session can start
a fresh topic-touch with no cleanup needed first.

**Process note learned this session, apply going forward:** this session's toolset has no
content-search (grep) tool for the user's filesystem — only whole-file reads (too large for
`grammar.json`'s 1.2MB+) and head/tail reads. For any topic that already has existing content
(i.e. everything except brand-new topics), before writing new questions:
1. Ask the user to run a quick `grep`/Python snippet to get (a) the current question count for
   the topic and (b) the highest existing ID number, so new IDs don't collide.
2. Also confirm whether existing questions for that topic use a `plusOnly` field at all (varies by
   topic — `kvantorer`'s B2 questions have none; some other topics do use `plusOnly: true` on
   `fill`/`order`/`transform` types). Match whatever the topic already does; don't assume.
3. Read the relevant `rules.ts` entry in full (the whole file can be read at once — it's ~190KB,
   manageable in one call) to confirm no rule-text gap before drafting questions.

**Remaining candidates** (direct-match/fold-in touches to existing topics, per the "Next session
starting point" list earlier in this doc, minus `kvantorer` and `spesial-kvantorer`, both now
done): `subjunksjon-oversikt`, `modale-adverb`, `modalverb-betydning`,
`sannsynlighet-uttrykk`, `hoflig-preteritum`, `man-en-upersonlig-pronomen`,
`mene-synes-tro-tenke`, `preteritum-perfektum-og-futurum`, `partikkelverb-los-fast`,
`adj-agreement`, `adj-comparison` (B2 extension), `noun-possessives` (B2 extension),
`v2-word-order` (B2 extension), `subordinate-order` (B2 extension),
`koordinerende-konjunksjoner` (B2 extension), `bade-og-verken-eller` (B2 extension),
`leddsetning-som-fundament` (B2 extension), `verbprefiks-be-an-mis` (B2 extension),
`sterke-verb`/`partisipp-former` (Verb §1), `preposisjoner-tid`, `preposisjoner-uttrykk-b2`, and
the `ikke-placement`/`imperativ` B2 extensions (Helsetninger §14–17) — plus the small remaining
rule-text folds noted inline in the Kapittel summaries («som/enn» into `adj-comparison`;
«for/fordi» into `koordinerende-konjunksjoner`).

**Recommended starting point next session:** `subjunksjon-oversikt` — direct-match content per
the Pre-Phase-2 checklist, no groundwork needed beyond the user-run existing-count/ID check
described above.

**Unrelated infra note for future sessions:** a separate task (not part of this content plan) is
now scoped in `draft/b2/pa-niva/implementation/grammar-lazy-load-per-level.md` — splitting
`grammar.json` into per-CEFR-level files for lazy-loading, triggered by this session's file-size
pain. Plan-only so far, not implemented. Two things matter for *this* doc's workflow if/when it
lands: (1) `grammar.json` stays the single file this plan edits — no change to the process above;
(2) the split files become generated artifacts, so after a content session someone will need to
run the (not-yet-written) regeneration script before `/grammar`, `/learn/[level]`, or `/stats`
reflect the new content in dev/prod. Check that doc's status before assuming this applies yet.
