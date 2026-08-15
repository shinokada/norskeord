---
title: B1 Grammar Opp og Fram Arbeidsbok
reference: draft/b1/opp-og-fram-arbeidsbok/content/opp-og-fram.md
data-started: 2026-08-14
data-completed: 
---

# Nivå B1 Grammar — "Opp og fram!" arbeidsbok — Implementation Plan

## Overview

Coverage of `draft/b1/opp-og-fram-arbeidsbok/content/opp-og-fram.md` (40 chapters, "Opp og
fram!" B1 arbeidsbok — the same source book the completed vocab/uttrykk project
[`b1-vocab-uttrykk-opp-og-fram-arbeidsbok.md`, ✅ done 2026-08-14] mined for
`vocab-b1.json`/`uttrykk-b1.json`). This plan covers the **grammar** side only — the
"Grammatikk, ord og uttrykk" sections of each chapter, not the "Vokabular" exercise sections
(those are vocab/uttrykk territory, already handled).

This is the **third B1 grammar source book**, alongside `b1-grammar-stein-paa-stein.md` (done)
and the original `b1-grammar.md`/`grammar-phase-2.md` line of work. `grammar.json` already has
**428 B1 questions across 41 topics** (verified 2026-08-14) — most of this plan will be a reuse
exercise like Stein på Stein was, adding more `cefr: 'B1'` entries to existing topic buckets
rather than inventing new ones. Cross-level topic reuse is an established pattern already in the
data (`ordfamilie-avledning` spans C/B1/B2, `nyanser-uttrykk` spans B2/C) — so reusing a
B2-tagged topic id for new B1-cefr questions here is consistent with precedent, not a new idea.

**Language of new content:** Norwegian-only for `prompt`/`hint`/`explanation` (per
`grammar-with-only-norsk.md`, already resolved project-wide).

**Copyright approach (unchanged):** every question is newly written; the textbook is used only to
identify which rule/difficulty to target — never copy or closely paraphrase its sentences or
reuse its characters (Adele, Melissa, Petter, Cindy, Birgitta, Elina, Heidi, Monica, Johanne,
Ismenia, Ernesto, Joseph, Reza, Peter, etc. — invent fresh names/sentences).

**Vocab integration:** every question should use real B1 vocabulary, verified against
`vocab-b1.json`/`uttrykk-b1.json` (now 2044/305 entries post-merge) the same way prior plans did.

**Question types:** existing `'fill' | 'order' | 'transform' | 'minimal-pair' | 'multiple-choice'`
should cover everything here — no schema changes expected.

---

## Source structure notes (for navigating the 500KB source file)

- Chapters 1–40 are listed twice: a compact table-of-contents block (bullet lists, lines ~22–649
  of the source) and then the real chapter bodies (from line ~721 on), each with a
  `## Grammatikk, ord og uttrykk` section followed by a `## Vokabular` section.
- **Only some early chapters (roughly 1–2) give each grammar topic its own `##` sub-header.**
  From chapter 3 onward, the "Grammatikk, ord og uttrykk" section is denser prose with topic
  names in `*italics*`/bold inline, not separate headers — so topic boundaries must be found by
  reading the section, not by scanning for `##`.
- `## Grammatikk, ord og uttrykk` section-start line numbers found this session (chapters 1–27,
  in order): 721, 971, 1193, 1396, 1620, 1851, 2062, 2260, 2508, 2703, 2930, 3105, 3306, 3516,
  3704, 3920, 4129, 4354, 4680, 4959, 5094, 5317, 5547, 5832, 6033, 6267, 6454. **Confirmed in
  Phase 1: chapters 28–40 genuinely have no `## Grammatikk, ord og uttrykk` section at all** —
  read ch. 30–32 directly and confirmed they go straight from the chapter heading into
  `## Vokabular`. Their lettered exercises (adjective bestemt form, possessive pronoun choice,
  verb conjugation drills) are pure review of already-covered grammar, not new named topics. This
  matches the book's own end-index, which has almost nothing attributed to chapters 30–40 (only
  27–29 contribute a few last items). **No further action needed on 28–40 — nothing to extract.**
- End-of-book reference appendices (lines ~7555–7923): irregular verb tables, verbs taking
  `å` + infinitive, irregular noun plurals, irregular adjective comparison, fast/løst sammensatte
  verb pairs. **Not a topic themselves** — useful as ground-truth data when writing questions for
  `sterke-verb`, `noun-plurals`, `adj-comparison`, etc., not something to build standalone
  questions from.
- The book's own master index — `## Oversikt over grammatikk, ord og uttrykk presentert i Opp og
  fram!` (line ~7923) — lists all ~110 named topics with their chapter number(s) in parentheses.
  This is the authoritative topic inventory and is reproduced in full below.

---

## Full topic inventory (from the book's own index, ch. in parens)

Adjektiv eller adverb (12) · Adjektiv kan stå alene (1) · Adjektiv på -el, -er og -en (2) ·
Adjektivbøyning (1) · Adverb som binder setninger sammen (13) · Aktuelt vokabular når det er glatt
på veien (23) · All, alt (10) · Alle, hele (10) · Annerledes – forskjellig (16) · Bakenfor – bak
(7) · Bestemt eller ubestemt form av substantivet? (3) · Både – og, enten – eller, verken – eller
(17) · Da – når (5) · De fleste og det meste (4) · Dermed (adverb) (9) · Dit – der, hit – her (9) ·
Enda – ennå (22) · Enhver – ethvert (7) · Et humør – en humor (6) · Etter å ha + perfektum
partisipp + preteritum (19) · Faktisk – egentlig (2) · Fire måter å bruke adverbet ellers på (3) ·
Flere og mer (4) · Forklaring til forkortelser i vokabularlistene (1) · Forskjell på/mellom (16) ·
Gammel, ung, ny, lett, tung, vanskelig (8) · Generelle tidsuttrykk (18) · Hel – helt (10) ·
Heldig – flaks – sjanse (27) · Heller (adverb) (5) · Hjem, hjemme, hjemmefra (22) · Hver dag –
hverdag – helligdag (6) · I hvert fall = iallfall = i alle fall = i det minste (10) · I kveld –
på/om kvelden (4) · Ingen – ikke noen, ingenting – ikke noe (4) · Innenfor – inne – innunder (7) ·
Lenger – lengre (1) · Liksom (adverb) (4) · Litt – lite (7) · Lydhermende ord (22) · Man – en/ens
(3) · Mange og mye (4) · Mengdeord + av + substantiv i bestemt form (10) · Mengdeord + substantiv
i ubestemt form (10) · Modale hjelpeverb (22) · Moro (adjektiv) (5) · Nemlig (adverb) (1) · Også –
ikke heller (22) · Opptil – inntil – oventil – nedentil – ovenfor – overfor (9) · Ord som
uttrykker mengde (19) · Oversikt over verbformene (1) · Oversikt over verbtidene (1) · Partisipper
av sterke verb på -et (8) · Passiv (15) · Perfektum med å være eller å ha (8) · Pluskvamperfektum
(18) · Preposisjonen utfor (3) · Preposisjoner (13) · Presens partisipp (12) · På jobb – på jobben
– i jobb (6) · Samme – like: å uttrykke likhet (11) · Sammensatte ord (5) · S-genitiv + adjektiv
og substantiv (8) · Sikker (adverb og adjektiv) (4) · Simpelthen (adverb) (6) · Skal – kommer til
å (4) · Stedsadverb (9) · Stoff, tøy/tøyer, klær, plagg (14) · Substantiv – verb – adjektiv (12) ·
Substantiv med og uten artikkel (2) · Substantiv på -el og -er (4) · Substantivbøyning, regelrett
(14) · Superlativ av adjektiv (10) · S-verb (20) · Såkalt (adjektiv) (20) · Sånn, sånt, sånne /
slik, slikt, slike (22) · Tid – gang – time (15) · Tidsuttrykk ved høytider (18) · To betydninger
av nesten (6) · To verb bundet sammen av og uttrykker samtidighet (2) · Transitive og intransitive
verb (12) · Tre betydninger av vel (adverb) (19) · Uansett (11) · Ulike ord for å snø, snøens
konsistens og skiføre (23) · Under – i løpet av (5) · Uttrykk for alder og ulike faser i livet
(25) · Uttrykk for hensikt (13) · Uttrykk med ordet nese (17) · Uttrykk med ordet side (27) ·
Uttrykk med substantivet ansvar (1) · Uttrykk med å ta (11) · Uttrykk som tar infinitiv (20) ·
Verb som begynner på an- (18) · Verb som begynner på be- (11) · Verb som begynner på mis- (27) ·
Verb som likner på hverandre (29) · Verb som uttrykker å se (29) · Visst (adverb) (16) · Å
bli/være vant til – å venne seg til (1) · Å bytte – å skifte (10) · Å fatte (27) · Å feste – å
feste seg ved noe – å få festet en merkelapp på seg (25) · Å finne (27) · Å få med seg – å få som
hjelpeverb (2) · Å glede seg til/over – å være glad (i) – det gleder meg – det er en glede (3) · Å
gå på bekostning av (11) · Å ha interesse – interessant – å interessere seg (25) · Å kalle (1) · Å
la som hjelpeverb (2) · Å miste – å tape (17) · Å synes – å tro (28) · Å uttrykke varighet (28) · Å
være enig i/med/om (5) · Å være forberedt på – å forberede seg – å tilberede – å forbedre seg (15)
· Å være lei seg – det er leit – å være lei av (6) · Å være opptatt med/av (10) · Å åpne (verb) –
åpen (adjektiv) (28)

---

## Preliminary classification (triage by topic name + chapter only — confirm against actual
## chapter prose before writing questions; this is a starting map, not a final decision)

### A. Skip — vocab/uttrykk territory, not grammar

Idiom/word-list items that belong in `vocab-b1.json`/`uttrykk-b1.json` (check first whether the
completed vocab project already captured them — many of these textbook idioms may already be in
production data from that pass): Uttrykk med substantivet *ansvar* (1) · Uttrykk med ordet *nese*
(17) · Uttrykk med ordet *side* (27) · Uttrykk med *å ta* (11) · Å gå på bekostning av (11) ·
Aktuelt vokabular når det er glatt på veien (23) · Ulike ord for å snø… (23) · Lydhermende ord
(22) · Uttrykk for alder og ulike faser i livet (25) · Stoff, tøy/tøyer, klær, plagg (14) ·
Forklaring til forkortelser i vokabularlistene (1, meta, not content).

### B. Skip — reference/overview only, not question-worthy as a standalone topic

Oversikt over verbformene (1) · Oversikt over verbtidene (1) — these are the book's own summary
tables; useful as background reading, not a discrete rule to quiz.

### C. Reuse — existing `GrammarTopic`, add B1-cefr questions

| Existing topic                           | Current B1 count           | Book topics that map to it                                                                                                                                         |
| ---------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `adjektiv-eller-adverb`                  | 11                         | Adjektiv eller adverb (12)                                                                                                                                         |
| `da-naar`                                | 10                         | Da – når (5)                                                                                                                                                       |
| `bade-og-verken-eller`                   | 12                         | Både – og, enten – eller, verken – eller (17)                                                                                                                      |
| `passiv-bli-s`                           | 12                         | Passiv (15)                                                                                                                                                        |
| `framtid-uttrykk`                        | 12                         | Skal – kommer til å (4)                                                                                                                                            |
| `adj-comparison`                         | 13                         | Superlativ av adjektiv (10) · Gammel/ung/ny/lett/tung/vanskelig irregular comparison (8)                                                                           |
| `adj-agreement`                          | 10                         | Adjektivbøyning (1)                                                                                                                                                |
| `noun-articles`                          | 10                         | Substantiv med og uten artikkel (2) · Bestemt/ubestemt substantiv (3)                                                                                              |
| `noun-plurals`                           | 12                         | Substantivbøyning, regelrett (14) · Substantiv på -el og -er (4)                                                                                                   |
| `noun-possessives`                       | 23                         | S-genitiv + adjektiv og substantiv (8)                                                                                                                             |
| `sterke-verb`                            | 6                          | Partisipper av sterke verb på -et (8)                                                                                                                              |
| `preposisjoner-sted`                     | 10                         | Bakenfor – bak (7) · Innenfor – inne – innunder (7) · Preposisjonen *utfor* (3) · Opptil/inntil/oventil/nedentil/ovenfor/overfor (9) · Preposisjoner (13, general) |
| `preposisjoner-tid`                      | 6                          | Under – i løpet av (5) · I kveld – på/om kvelden (4) · Generelle tidsuttrykk (18) · Tidsuttrykk ved høytider (18)                                                  |
| `kvantorer`                              | 10                         | Mange og mye (4) · Flere og mer (4) · De fleste og det meste (4) · Litt – lite (7) · Mengdeord + av/substantiv (10) · Ord som uttrykker mengde (19)                |
| `relative-som`                           | 10                         | (check ch. 12 substantiv–verb–adjektiv material for som-clause use)                                                                                                |
| `ordfamilie-avledning`                   | 26 (already spans C/B1/B2) | Substantiv – verb – adjektiv (12)                                                                                                                                  |
| `sammensatte-substantiv`                 | 9                          | Sammensatte ord (5)                                                                                                                                                |
| `indirekte-tale-at-om`                   | 20                         | (check ch. 2/5/6/22 reported-speech vocabulary exercises for grammar-worthy material)                                                                              |
| `modalverb-preteritum`                   | 8                          | Modale hjelpeverb (22)                                                                                                                                             |
| `infinitiv-a1`                           | 10                         | Uttrykk som tar infinitiv (20)                                                                                                                                     |
| `synes-tror` (A1, cross-level candidate) | 8 (A1 only so far)         | Å synes – å tro (28)                                                                                                                                               |

### D. Reuse — B2-tagged topic, add B1-cefr questions (precedent: `nyanser-uttrykk` already spans B2/C)

| Existing B2 topic                                                                   | Book topics that map to it                                                                                                                              |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `modale-adverb` (faktisk/egentlig/vel/visst/jo/nok already in scope)                | Faktisk – egentlig (2) · Tre betydninger av *vel* (19) · Visst (adverb) (16) · Liksom (adverb) (4) · Heller (adverb) (5) · Simpelthen (adverb) (6)      |
| `stedsadverb-statisk-dynamisk` (der/dit, her/hit, hjemme/hjem already in scope)     | Dit – der, hit – her (9) · Stedsadverb (9) · Hjem, hjemme, hjemmefra (22)                                                                               |
| `spesial-kvantorer` (ingen/ingenting, hel/helt/hele, all/alt/alle already in scope) | All, alt (10) · Alle, hele (10) · Hel – helt (10) · Ingen – ikke noen, ingenting – ikke noe (4) · Enhver – ethvert (7)                                  |
| `arsak-og-folge-uttrykk` (dermed, nemlig already in scope)                          | Dermed (adverb) (9) · Nemlig (adverb) (1) · Uttrykk for hensikt (13, "for at" overlap)                                                                  |
| `kontrast-uttrykk` (enda, uansett already in scope)                                 | Enda – ennå (22, check: this "enda" sense may be "even" or "not yet" — verify against `kontrast-uttrykk`'s exact meaning before reusing) · Uansett (11) |
| `man-en-upersonlig-pronomen`                                                        | Man – en/ens (3) — exact match                                                                                                                          |
| `nyanser-uttrykk` (already lists tid/time/gang as an example)                       | Tid – gang – time (15) — exact match · Annerledes – forskjellig (16) · Forskjell på/mellom (16)                                                         |
| `partisipp-former`                                                                  | Presens partisipp (12) · Etter å ha + perfektum partisipp + preteritum (19)                                                                             |
| `preteritum-perfektum-og-futurum`                                                   | Pluskvamperfektum (18) · Perfektum med å være eller å ha (8, check fit)                                                                                 |
| `verbet-a-fa` (currently C-only)                                                    | Å få med seg – å få som hjelpeverb (2)                                                                                                                  |

### E. Likely new topics (no existing `GrammarTopic` fits — confirm by reading chapter prose first)

| Candidate new topic               | Book source                                           | Notes                                                                                                                                           |
| --------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| S-verb construction               | S-verb (20)                                           | Reciprocal/deponent s-verbs (møtes, ses, høres) — distinct mechanic, no existing topic.                                                         |
| Transitivity pairs                | Transitive og intransitive verb (12)                  | Broader than A2's `plassering-verb` (sette/legge vs. stå/ligge) — general transitive/intransitive verb pairs.                                   |
| Verb+og+verb simultaneity         | To verb bundet sammen av og uttrykker samtidighet (2) | E.g. "han satt og leste" — no existing topic covers this construction.                                                                          |
| `la` as causative/auxiliary       | Å la som hjelpeverb (2)                               | Causative "la noen gjøre noe" / "la det skje" — distinct from modal auxiliaries already covered.                                                |
| Verb-forming prefixes             | Verb som begynner på an-/be-/mis- (18, 11, 27)        | Prefix productivity (an-, be-, mis-) changing verb meaning/valency — different from C's `motsetning-prefiks` (negative prefixes on adjectives). |
| sånn/slik demonstrative-adjective | Sånn, sånt, sånne / slik, slikt, slike (22)           | Agreement pattern for this adjective pair — check whether `adj-agreement` already covers it well enough to just extend, or needs its own topic. |
| Adjective-as-adverb spelling rule | Adjektiv på -el, -er og -en (2)                       | Consonant-drop spelling rule when these adjectives take endings — check if `adj-agreement` extension suffices instead of a new topic.           |
| Connective adverbs overview       | Adverb som binder setninger sammen (13)               | May turn out to be a rollup of several already-covered connectives rather than a new topic — read the actual text before deciding.              |

### F. Needs a closer read before any decision

Adjektiv kan stå alene (1) — could be the B1-level precursor to C's `substantivert-adjektiv`, or
something narrower; Et humør – en humor (6), Hver dag – hverdag – helligdag (6), På jobb – på
jobben – i jobb (6), Lenger – lengre (1), Sikker (4), Moro (5), Også – ikke heller (22), Å
bli/være vant til – å venne seg til (1), Å bytte – å skifte (10), Å fatte/Å finne (27), Å feste…
(25), Å glede seg til/over… (3), Å ha interesse… (25), Å kalle (1), Å miste – å tape (17), Å
uttrykke varighet (28), Å være enig i/med/om (5), Å være forberedt på… (15), Å være lei seg… (6),
Å være opptatt med/av (10), Å åpne – åpen (28), Såkalt (20), Verb som likner på hverandre (29), Verb
som uttrykker å se (29), Fire måter å bruke adverbet *ellers* på (3), Samme – like (11) — these
read as near-synonym/usage-nuance pairs. Likely candidates for the `nyanser-uttrykk` bucket (§D)
once actually read, but grouped here since the mapping isn't obvious from the name alone.

---

## Phase 1 confirmed findings (chapters 1–10, read in full)

All chapters 1–10 use `###`/`##` sub-headers inside `## Grammatikk, ord og uttrykk` matching the
book's own index almost exactly — triage in §C/D/E/F above is **confirmed correct** for these
chapters, no bucket reassignments needed. Notes:

- **Ch. 1 header typo**: the source's own sub-header reads `## Lengre – lengre` but the content is
  clearly the three-way *lang/lengre/lengst* (adj.) vs. *langt/lengre/lengst* (adv.) vs.
  *lenge/lenger/lengst* (adv.) irregular-comparison distinction — i.e. the index's "Lenger –
  lengre (1)" (§F, needs-a-closer-read). **Resolved**: this is a comparison-irregularity nuance
  best folded into `adj-comparison` alongside ch. 8's gammel/ung/ny set, not a standalone topic.
- **Ch. 6 confirmed all §F items → `nyanser-uttrykk`**: Å være lei seg/leit/lei av, Hver dag –
  hverdag – helligdag, På jobb – på jobben – i jobb, Et humør – en humor, Simpelthen (adverb), To
  betydninger av nesten — all read as clean near-synonym/usage-nuance pairs, exactly the
  `nyanser-uttrykk` pattern (which already lists tid/time/gang as its example).
- **Ch. 5 confirmed**: Da–når, Sammensatte ord, Moro (adjektiv) → `nyanser-uttrykk`, Heller (adverb)
  → `modale-adverb`, Under – i løpet av → new nuance pair (no existing topic — near-synonym
  preposition-phrase distinction; add to `nyanser-uttrykk` too, it already handles this shape),
  Å være enig i/med/om → `nyanser-uttrykk` (preposition-choice-changes-meaning pattern).
- **Ch. 3 confirmed**: Fire måter *ellers* → `modale-adverb`-style connective, Å glede seg
  til/over/... → `nyanser-uttrykk`, Preposisjonen *utfor* → `preposisjoner-sted`, Man – en/ens →
  `man-en-upersonlig-pronomen` (exact match), Bestemt/ubestemt substantiv → `noun-articles`.
- **Ch. 2, 4, 7, 8, 9, 10**: every sub-header read matches its §C/D bucket assignment exactly as
  drafted — no surprises. Ch. 9's Ovenfor/Overfor sub-items (mis-nested under `##` instead of
  `###` in the source, easy to miss on a header-only scan) are confirmed part of the
  Opptil–inntil–oventil–nedentil–ovenfor–overfor set → `preposisjoner-sted`.
- **No new §E topics found yet** in ch. 1–10 — all likely-new candidates (S-verb, transitivity
  pairs, verb+og+verb simultaneity, *la* causative, verb prefixes, sånn/slik, adj -el/-er/-en
  spelling, connective adverbs) come from ch. 11+, still to confirm.

**Chapters 1–10 triage is now final.** Remaining: confirm ch. 11–27 (28–40 already ruled out, see
Source structure notes above).

---

## Phase 1 confirmed findings (chapters 11–29, read in full)

**Correction to earlier session's claim**: chapters 28 and 29 **do** have `## Grammatikk, ord og
uttrykk` sections (confirmed by reading) — the "28–40 has no grammar section" note was wrong for
these two. Only **30–40 are confirmed empty** (ch. 30 checked directly: header goes straight to
`## Vokabular`, nothing between). Ch. 21 and 26 also have no grammar section (straight to
Vokabular) — consistent with the master index, which has no items numbered (21) or (26).

**Source quirk found**: the book's own index chapter-numbers become unreliable from ~ch. 20
on—content labelled with a given index number often actually appears 1–2 chapters later in the
body (e.g. index "Enda – ennå (22)" is actually in ch. 24's body; index "Uttrykk med ordet *side*
(27)" is actually in ch. 29's body; index "Å feste… (25)" is actually in ch. 27's body). Not a
fixed offset — varies by item. **Content presence (confirmed by reading), not the index number,
is what matters** for the mapping below.

### Confirmed topic-to-bucket mapping, ch. 11–29

- **Ch. 11**: Uttrykk med *å ta* → §A (vocab/idiom, check against `uttrykk-b1.json`). Verb *be-*
  prefix pairs → §E (joins ch. 18's *an-* and ch. 28's *mis-* prefix sets — confirmed as one
  coherent "verb-forming prefix" topic family, not three separate ones). Å gå på bekostning av →
  §A. Uansett → `kontrast-uttrykk` (confirmed, two clean senses: uten hensyn til / i alle
  tilfeller). Samme – like → `nyanser-uttrykk`.
- **Ch. 12**: Adjektiv eller adverb → `adjektiv-eller-adverb` (confirmed). Presens partisipp →
  `partisipp-former` (confirmed, adverb/adjektiv dual-use table). **Transitive/intransitive verb
  pairs → §E confirmed real** — rich table of sterk/svak-bøyning pairs (henge/brenne/sette-sitte/
  senke-synke), genuinely distinct mechanic, no existing topic fits. Substantiv–verb–adjektiv →
  `ordfamilie-avledning` (confirmed, detailed suffix table −lig/-isk/-som/-full/-løs/-fri/-el/-en/
  -ete/-ende/-et).
- **Ch. 13**: Preposisjoner (til/fra/av/i vs. på for steder, hos) → `preposisjoner-sted`
  (confirmed, plus a useful i/på-by-type rule set worth mining). Uttrykk for hensikt ("for å +
  infinitiv") → likely `infinitiv-a1` extension, simple enough not to need a new topic. **Adverb
  som binder setninger sammen → §E confirmed real** — så/derfor/likevel/dessuten taxonomy
  (tid/årsak/motsetning/tillegg), no existing topic covers this 4-way connective classification as
  a set (closest is `arsak-og-folge-uttrykk`, which only covers derfor/dermed/nemlig — this is
  broader).
- **Ch. 14**: Substantivbøyning regelrett → `noun-plurals` (confirmed, detailed -er/-el/one-
  syllable-n/-vju,-tor tables). Stoff/tøy/klær/plagg → partly `noun-plurals` (has a real declension
  table) partly vocab — keep in §C, note it's borderline.
- **Ch. 15**: Tid – gang – time → `nyanser-uttrykk` (confirmed, exact match, book already gives this
  as its own example). Passiv → `passiv-bli-s` (confirmed, full verb-tense passiv table + a
  genuine være/bli nuance for short vs. long-duration verbs — good B1 content). Å være forberedt
  på / å forberede seg / å tilberede / å forbedre seg → `nyanser-uttrykk`.
- **Ch. 16**: Visst (adverb) → `modale-adverb` (confirmed, two senses: setningsadverbial position =
  antakelig, sentence-initial = helt sikkert). Annerledes – forskjellig, Forskjell på/mellom →
  `nyanser-uttrykk`.
- **Ch. 17**: Både–og/enten–eller/verken–eller → `bade-og-verken-eller` (confirmed). Å miste – å
  tape → `nyanser-uttrykk` (confirmed, rich 3-sense contrast table). Uttrykk med *nese* → §A.
- **Ch. 18**: Pluskvamperfektum → `preteritum-perfektum-og-futurum` (confirmed, both
  sequence-of-past and hypothetical uses). Generelle tidsuttrykk + Tidsuttrykk ved høytider →
  `preposisjoner-tid` (confirmed, rich i-forfjor…i-overmorgen table plus for/om/i/på distinctions).
  Verb *an-* prefix → §E, same family as ch. 11/28 (see above).
- **Ch. 19**: Ord som uttrykker mengde → `spesial-kvantorer` (confirmed, all/ingen/noen/enhver/hver
  gender-agreement table). Etter å ha + perfektum partisipp + preteritum → `partisipp-former`
  (confirmed). Tre betydninger av *vel* → `modale-adverb` (confirmed).
- **Ch. 20**: **S-verb → §E confirmed real** — 16-item table of reciprocal/deponent s-verbs
  (møtes, sees, trives, synes, etc.) vs. their non-s counterparts; distinct mechanic, no existing
  topic. Såkalt (adjektiv) → small `nyanser-uttrykk` addition (not enough content alone for a
  topic). Uttrykk som tar infinitiv → `infinitiv-a1` (confirmed).
- **Ch. 22**: Hjem/hjemme/hjemmefra → `stedsadverb-statisk-dynamisk` (confirmed, exact fit).
  Sånn/sånt/sånne – slik/slikt/slike → §F resolved: this is an adjective-agreement pattern for a
  synonym pair, best as an `adj-agreement` extension rather than a new topic (the dual-word aspect
  is a vocab nuance, not a separate grammar mechanic).
- **Ch. 23**: Lydhermende ord, Aktuelt vokabular glatt vei, Ulike ord for å snø → all §A
  (confirmed pure vocab lists, no grammar rule attached). **Også – ikke heller → confirmed a real
  grammar rule** (også cannot appear in a negated clause; must switch to *heller*/*ikke…heller*) —
  no existing topic covers this negation-scope rule; small §E candidate, possibly foldable into
  `kontrast-uttrykk` or `bade-og-verken-eller`'s general connective-word family — decide in Phase 2.
- **Ch. 24**: Modale hjelpeverb → `modalverb-preteritum` (confirmed — note: this chapter's content
  is about modal *meaning* (må/skal/vil/kan/bør) more than preteritum forms specifically; still the
  best-fit existing bucket, extend rather than create new). Enda – ennå → `kontrast-uttrykk`
  **(cross-check #3 from earlier resolved: confirmed same "selv om/til tross for" sense the
  existing topic covers, alongside the "fremdeles" and "i tillegg" senses)**.
- **Ch. 25**: Uttrykk for alder og faser i livet → §A (vocab table, not grammar).
- **Ch. 27**: Å ha interesse/interessant/å interessere seg, Å finne, Å feste… → all §A/§F →
  `nyanser-uttrykk`-style but idiom-heavy; low priority, small additions only if room.
- **Ch. 28**: Å fatte (uttrykk) → §A/vocab-idiom. Verb *mis-* prefix → §E, joins the an-/be- prefix
  family. Heldig – flaks – sjanse → `nyanser-uttrykk`.
- **Ch. 29**: Uttrykk med ordet *side* → §A. Verb som uttrykker å se, Verb som likner på hverandre
  → §A (vocab lists with no attached grammar rule, despite superficially looking like grammar
  content).

**Chapters 1–29 triage is now final and confirmed by reading. 21, 26, 30–40 confirmed to have no
grammar content.** Phase 1 is complete — all 40 chapters accounted for.

### §E — confirmed new topics (ready for Phase 2)

1. **Transitive/intransitive verb pairs** (ch. 12) — sterk/svak bøyning pairs (henge, brenne,
   sette/sitte, senke/synke).
2. **S-verb** (ch. 20) — reciprocal/deponent s-verbs (møtes, sees, synes, trives, etc.).
3. **Verb-forming prefixes** (ch. 11 *be-*, ch. 18 *an-*, ch. 28 *mis-*) — one topic covering all
   three prefixes, not three separate topics.
4. **Connective adverbs** (ch. 13) — så/derfor/likevel/dessuten (tid/årsak/motsetning/tillegg).

Dropped from §E after reading (folded into existing topics instead): *la* causative (ch. 2, already
confirmed part of existing content, not flagged as new after re-read), verb+og+verb simultaneity
(ch. 2, small — fold into an existing topic in Phase 2 rather than standalone), sånn/slik (→
`adj-agreement` extension), adj -el/-er/-en spelling (ch. 2, small — fold into `adj-agreement`).

---

## Cross-checks before writing content

1. **Vocab/uttrykk overlap** — the completed vocab project already mined this same book's idioms
   into `uttrykk-b1.json`. Before treating any "Uttrykk med X" or "Å X – å Y" item as new grammar
   content, check it isn't just a `vocab-b1.json`/`uttrykk-b1.json` entry already covering the
   distinction via `definition`/`note` fields.
2. **Overlap with `b1-grammar-stein-paa-stein.md`** — that plan already added B1 content to many
   of the same topic ids (`da-naar`, `bade-og-verken-eller`, `passiv-bli-s`, `framtid-uttrykk`,
   `kvantorer`, `noun-plurals`, `adj-comparison`, `ordfamilie-avledning`, `sammensatte-substantiv`,
   etc.) — new entries from this book must use fresh example sentences/characters, not duplicate
   Stein på Stein's.
3. **`enda`/`ennå` fit with `kontrast-uttrykk`** — confirm the book's "Enda – ennå (22)" is the
   same "even/still" contrast sense the existing topic covers, not the unrelated "not yet" sense,
   before reusing.

---

## Process (mirrors `b1-grammar-stein-paa-stein.md` / `c-grammar-preposition.md`)

1. **Phase 0 (this document) — done.** Inventory extracted, preliminary triage drafted.
2. **Phase 1 — confirm triage.** Read each chapter's actual "Grammatikk, ord og uttrykk" prose
   (not just the index) to firm up §C/D/E/F decisions, and write any rule-text additions existing
   topics need (same pattern as Stein på Stein's 5 additions) before Phase 2 content starts.
3. **Phase 2 — content, one topic-touch at a time** (session-limited): build ~8–12 questions per
   topic-touch, batch a few touches per session, mirroring vocab against `vocab-b1.json`.
4. **Validate:** run `check-grammar-norwegian.mjs` and the B1 vocab-matching check before applying
   to the real `grammar.json`.
5. **Track progress** in this doc: mark each topic-touch ✅ Done with its final question count as
   it's completed, same convention as every prior grammar plan.

## Phase 2 progress log

**§E new topics — setup (types.ts + rules.ts) done for all 4:**
- `transitiv-intransitiv-verb`, `s-verb`, `verbprefiks-be-an-mis`, `adverb-setningsbinding` all
  have `GrammarTopic` entries in `src/lib/types.ts` and full bilingual `GrammarRule` entries in
  `src/lib/grammar/rules.ts`. Confirmed no gating changes needed (B1 default Plus-gating applies).

**§E new topics — questions:**
- ✅ **`transitiv-intransitiv-verb`** — Done. 12 questions (`gq-transintrans-001..012`) appended to
  `grammar.json`, covering sette/sitte, legge/ligge, henge, brenne, senke/synke. Mixed types (fill,
  transform, minimal-pair, order, multiple-choice). Verified against `vocab-b1.json`.
- ✅ **`s-verb`** — Done. 12 questions (`gq-sverb-001..012`) appended to `grammar.json`, covering
  møtes, sees/ses, synes/syntes, trives/trivdes, mislykkes/mislyktes, minnes. All verbs confirmed
  present in `vocab-a1.json`/`vocab-a2.json`/`vocab-b1.json` before writing (finnes/treffes were
  considered but dropped — not found in any vocab list, so skipped to stay consistent with the
  mirror-vocab convention).
- ✅ **`verbprefiks-be-an-mis`** — Done. 12 questions (`gq-verbprefiks-001..012`) appended to
  `grammar.json`, covering misforstå/forstå, lykkes/mislykkes, slutte/beslutte, gi/angi,
  sette/ansette. All base+prefixed pairs confirmed present in `vocab-a1.json`/`vocab-a2.json`/
  `vocab-b1.json` before writing (antenne/tenne pair dropped — "antenne" not found in any vocab
  list).
- ✅ **`adverb-setningsbinding`** — Done. 12 questions (`gq-setningsbinding-001..012`) appended to
  `grammar.json`, covering all four connectives (så/derfor/likevel/dessuten) with both
  meaning-selection (multiple-choice) and V2-inversion mechanics (order, minimal-pair), plus one
  nuance question contrasting «derfor» (adverb) vs «fordi» (conjunction). «Likevel» already well-
  established elsewhere in `grammar.json` (50+ prior uses), so no vocab-list check needed for that
  closed-class word; «så»/«derfor»/«dessuten» all confirmed present in vocab lists too.

**All 4 §E new topics are now complete.**

`grammar.json` total question count: **2106** (was 2058 at start of Phase 2; +12 transintrans, +12
s-verb, +12 verbprefiks, +12 setningsbinding). No duplicate IDs, JSON validity confirmed after
every batch.

**§C/D reuse touches:**
- ✅ **`adjektiv-eller-adverb`** — Done. +10 new B1 questions (`gq-adjadv-023..032`, since IDs
  001–011 were existing B1 and 012–022 existing B2 — topic now has 21 B1 + 11 B2 = 32 total).
  Covers fin/fint, varm(t), sterk(t), pen/pent, enkel/enkelt, kald(t) — including one question
  (`gq-adjadv-031`) illustrating the neuter-agreement nuance (vannet → kaldt) where the -t ending
  is agreement, not adverb formation, distinct from the true adverb cases. Mixed types (fill,
  minimal-pair, multiple-choice, order). All adjectives confirmed present in
  `vocab-a1.json`/`vocab-a2.json`/`vocab-b1.json`.

`grammar.json` running total: **2116**. No duplicate IDs, JSON validity confirmed.

- ✅ **`partisipp-former`** — Done. +11 new B1 questions (`gq-partform-022..032`). Ch. 12's presens
  partisipp table and perfektum-partisipp-as-adjective content were already fully covered by the
  topic's 21 existing B2 questions, so this touch focused on the one genuinely uncovered piece of
  book content: ch. 19's **«etter å ha» + perfektum partisipp** construction ("after having done
  X, ..."), which the existing rule text didn't mention. Added a short bilingual paragraph to both
  `explanationEn`/`explanationNb` in `rules.ts` documenting this construction (verified diff,
  applied) before writing questions. Questions mix transform/fill/order/multiple-choice/
  minimal-pair, covering kjøpe, betale, rydde, pakke, øve, møte, glemme, miste, lese, vaske — all
  confirmed present in `vocab-a1.json`/`vocab-a2.json`/`vocab-b1.json`. Fresh characters (Aksel,
  Sindre, Mia, Nora, Tobias, Frida), none from the book's cast. All entries tagged `plusOnly: true`
  for consistency with the topic's existing B2 entries (gating is unaffected either way —
  `partisipp-former` isn't in `FREE_GRAMMAR_TOPICS` so it's Plus-gated regardless of the flag).

`grammar.json` running total: **2127**. No duplicate IDs, JSON validity confirmed (32 total
questions in `partisipp-former`: 21 B2 + 11 B1).

- ✅ **`ordfamilie-avledning`** — Done. +10 new B1 questions (`gq-avled-113..122`), covering ch. 12's
  Substantiv–verb–adjektiv/partisipp derivation content, including perfektum-partisipp-as-adjective
  forms (bruke→brukt) not yet covered by the topic's existing entries. Convention followed: base
  word confirmed present in `vocab-a1.json`/`vocab-a2.json`/`vocab-b1.json` `lemma` field; derived
  form doesn't need separate vocab coverage. Mixed types (fill, minimal-pair). Topic now has 122
  total questions.

`grammar.json` running total: **2137**. No duplicate IDs, JSON validity confirmed.

- ✅ **`preposisjoner-sted`** — Done. +10 new B1 questions (`gq-prep-sted-035..044`), covering the
  compound-preposition set from ch. 3/7/9/13: bakenfor (vs. plain bak), innenfor (budget/limit
  sense), inne (i), innunder, utfor (off-the-road sense), opptil (quantity "up to"), inntil
  (physical "up against"), ovenfor (textual "above/earlier-mentioned") vs. overfor ("across
  from/opposite") contrast. Mixed types (fill, minimal-pair, order). These are closed-class
  function words, so the vocab check applied to the supporting content nouns instead (budsjett,
  bil, sofa, vei, prosent, vegg, stasjon, fjell, by, hus, snø, føre — all confirmed present in
  `vocab-a1.json`/`vocab-a2.json`/`vocab-b1.json`). Topic now has 44 total questions.

`grammar.json` running total: **2147**. No duplicate IDs, JSON validity confirmed.

- ✅ **`noun-plurals`** — Done. +12 new B1 questions (`gq-noun-pl-048..059`), covering ch. 14's
  regular-declension content: -er nouns for persons (arbeider→arbeidere) vs. non-person -er nouns
  that drop -e- in plural (teater→teatre, register→registre), -el nouns dropping -e- (møbel→møbler,
  muskel→muskler), -e neuter nouns with no short form in ubestemt flertall (hjerte→hjerter,
  yrke→yrker), one-syllable neuter nouns unchanged (hus), multi-syllable neuter nouns unchanged
  because the final element is itself a one-syllable word (spørsmål, tilbud, sykehus), and
  two-form neuter nouns (intervju/intervjuer). Mixed types (transform, fill, minimal-pair,
  multiple-choice, order). All nouns confirmed present in `vocab-a1.json`/`vocab-a2.json`/
  `vocab-b1.json`/`vocab-b2.json` (register and arbeider only found in `vocab-b2.json`; teater,
  orkester, tegner, tekniker checked — orkester/tegner/tekniker not found in any vocab list, so
  dropped). Topic now has 59 total questions (24 B1).

`grammar.json` running total: **2159**. No duplicate IDs, JSON validity confirmed.

- ✅ **`nyanser-uttrykk`** — Done (first batch). +12 new B1 questions (`gq-nyanser-019..030`),
  covering the richest near-synonym pairs confirmed during Phase 1: tid/gang/time (book's own
  canonical example), hverdag vs. helligdag (ch. 6), på jobb vs. i jobb (ch. 6), humør (godt/
  dårlig humør — the humor half of the pair dropped, not found in any vocab list), simpelthen
  (ch. 6, treated as a closed-class adverb exception like `modale-adverb`'s `likevel` — not in
  vocab lists either), nesten's two senses (ch. 6: «omtrent» vs. the softening/politeness use),
  lei/leit/lei av (ch. 6), enig i/med/om (ch. 5, all three prepositions), annerledes vs.
  forskjellig (ch. 16), forskjell på vs. forskjell mellom (ch. 16, synonymous), and miste vs. tape
  (ch. 17, two questions: rote bort a gjenstand vs. lide nederlag i en kamp). Mixed types (fill,
  minimal-pair, multiple-choice). Fresh characters (Sindre, Frida, Tobias, Nora, Aksel), none from
  the book's cast. All content words confirmed present in `vocab-a1.json`/`vocab-a2.json`/
  `vocab-b1.json` except the two closed-class adverbs noted above. Topic now has 30 total
  questions (12 B1, 9 B2, 9 C, 0 A1/A2). Remaining `nyanser-uttrykk` candidates for a future batch:
  heldig – flaks – sjanse (ch. 27/28), å være forberedt på / forberede seg / forbedre seg (ch. 15),
  visst's small addition (ch. 16, already partly covered by `modale-adverb`), såkalt (ch. 20),
  under – i løpet av (ch. 5), moro (ch. 5, adjective-vs-property nuance — word not in vocab lists),
  and the idiom-heavy å finne/å fatte/å feste (ch. 27, low priority).

`grammar.json` running total: **2171**. No duplicate IDs, JSON validity confirmed.

- ✅ **`passiv-bli-s`** — Done. +10 new B1 questions (`gq-passivbs-024..033`). Found genuinely new
  book content not previously covered: the book's own passive table (Passiv section) includes a
  third form, **være-passiv** (være + perfektum partisipp), alongside bli-passiv and s-passiv,
  with an explicit meaning contrast — være-passiv describes a resulting STATE ("Plenen er
  klippet" = it's done) while bli-passiv emphasizes the ACTION in progress ("Plenen blir
  klippet" = someone's doing it now). The prior rule text and all 23 existing questions only
  covered bli-passiv/s-passiv, so this was a real gap. Added a bilingual paragraph to
  `explanationEn`/`explanationNb` in `rules.ts` documenting være-passiv and the three-way
  contrast (verified diff, applied) before writing questions. New questions drill: presens
  state-vs-action minimal pairs (er vasket / blir vasket), preteritum state-vs-action (var
  ryddet / ble ryddet), perfektum (har vært bygget), pluskvamperfektum (hadde vært malt vs.
  hadde blitt malt), plus fill/transform/order/multiple-choice/minimal-pair variety. Vocab
  confirmed present in `vocab-a1.json`/`vocab-a2.json`/`vocab-b1.json` (vaske, bil, hus, male,
  rydde, leilighet, firma, nabo, middag, lage, flytte, lenge). Topic now has 33 total questions
  (22 B1, 11 B2).

`grammar.json` running total: **2181**. No duplicate IDs, JSON validity confirmed.

- ✅ **`modale-adverb`** — Done. +10 new B1 questions (`gq-modaladv-014..023`) — topic previously had
  13 questions, all B2, so this was the first B1 pass. Found two genuine content gaps while
  re-reading ch. 16 and 19: (1) **`vel`** has three related senses per the book's own table (ch.
  19) — pointing out something obvious, marking something as probable (close to `nok`), and
  seeking confirmation — but the prior rule and all 13 existing questions only tested the
  confirmation-seeking sense; (2) **`visst`** shifts meaning with sentence position (ch. 16): in
  the normal midtfelt slot it marks hearsay ("Han har visst giftet seg" = apparently), but placed
  first in the sentence (triggering V2) it becomes emphatic, meaning "definitely!" ("Visst har
  han giftet seg!") — the prior rule only covered the hearsay sense. Added both nuances as a
  bilingual paragraph update to `explanationEn`/`explanationNb` in `rules.ts` (verified diff,
  applied) before writing questions. New questions cover: `vel`-as-probable (fill, minimal-pair
  vs. `neppe`, contrast with `sikkert`), `vel`-as-obvious (fill, multiple-choice meaning-ID),
  `visst` position contrast (fill, order, minimal-pair, transform, multiple-choice meaning-ID).
  Vocab confirmed present in `vocab-a1.json`/`vocab-a2.json`/`vocab-b1.json` (trene, maraton,
  bestå, eksamen, semester, øve, flytte, kollega, karakter, skole, synge, sang, fest, lærer,
  elev). Topic now has 23 total questions (10 B1, 13 B2).

`grammar.json` running total: **2191**. No duplicate IDs, JSON validity confirmed.

- ✅ **`bade-og-verken-eller`** — Done. +10 new B1 questions (`gq-badeverken-013..022`) — topic
  previously had 12 questions covering only både–og and verken–eller. Re-reading ch. 17's own
  table showed it teaches all three connectors, including **enten – eller** ("one of the two"),
  which the prior rule and every existing question omitted entirely. Added a bilingual paragraph
  to `explanationEn`/`explanationNb` in `rules.ts` documenting «enten … eller» alongside the
  other two (verified diff, applied) before writing questions. New questions cover: basic
  enten/eller fill-ins, a three-way både/enten/verken discrimination (multiple-choice), V2 word
  order when «enten» opens the sentence (order, minimal-pair), and transform/order variety.
  Vocab confirmed present in `vocab-a1.json`/`vocab-a2.json`/`vocab-b1.json` (reise, bli, film,
  bok, jobb, bil, sofa, stue, lærer, snekker, kaffe, te, pizza). Fresh characters (Aksel, Nora),
  none from the book's cast. Topic now has 22 total questions.

`grammar.json` running total: **2201**. No duplicate IDs, JSON validity confirmed.

- ✅ **`preteritum-perfektum-og-futurum`** — Done. +10 new B1 questions (`gq-pretfutur-013..022`) —
  topic previously had 12 questions, all B2, so this was the first B1 pass. Re-read ch. 18's
  pluskvamperfektum section, which teaches exactly the two uses the rule already documents: (1)
  sequence-of-past ("etter at vi hadde sett filmen, gikk vi ut og spiste") and (2) hypothetical
  ("hvis jeg hadde vært deg, ville jeg ha jobbet hardere") — no rule-text gap found this time, so
  no `rules.ts` change was needed. Questions drill both uses with fresh characters (Tobias, Nora,
  Mia, Frida, Sindre, Aksel): fill/transform/order/multiple-choice/minimal-pair variety, including
  a minimal-pair contrasting pluskvamperfektum vs. plain preteritum/perfektum for the wrong
  reference point. Vocab confirmed present in `vocab-a1.json`/`vocab-a2.json`/`vocab-b1.json`
  (se, film, spise, jobbe, ringe, glemme, huske, nøkkel, vente, lese, skrive, sove, komme, reise,
  regn, kaffe, kald, middag, paraply). Topic now has 22 total questions (10 B1, 12 B2).

`grammar.json` running total: **2211**. No duplicate IDs, JSON validity confirmed.

- ✅ **`preposisjoner-tid`** — Done. +10 new B1 questions (`gq-prep-tid-029..038`) — topic already
  had 6 B1 questions covering for/om/i/på distinctions (added in an earlier session). Re-reading
  ch. 18's tidsuttrykk section surfaced a genuine rule-text gap: **holiday time expressions**
  (i julen, i påsken, i pinsen) use «i» + DEFINITE noun and can refer to past, present, OR future
  — unlike ordinary seasons/day-parts where «i» + indefinite = specific instance and «om» +
  definite = habitual. Added a bilingual paragraph to `rules.ts` documenting this (verified diff,
  applied) before writing questions. New questions cover: the holiday-tense ambiguity (fill,
  multiple-choice, minimal-pair, transform) using tense/context cues to disambiguate past vs.
  future vs. habitual, plus the extended tidsuttrykk vocabulary from ch. 18's table (i forfjor,
  i morges, i overmorgen, i forgårs) not previously drilled. Vocab confirmed present in
  `vocab-a1/a2/b1.json` (jul, påske, tur, klær, samle, få, ringe); «pinse» og «pleie» used as
  closed-class items (not in vocab lists, same convention as prior book-derived function words).
  Fresh characters (Frida, Aksel, Nora, Sindre, Tobias). Topic now has 38 total questions (16 B1).

`grammar.json` running total: **2221**. No duplicate IDs, JSON validity confirmed.

- ✅ **`spesial-kvantorer`** — Done. +10 new B1 questions (`gq-speskvant-015..024`) — topic
  previously had 14 questions, all B2, so this was the first B1 pass. Re-reading ch. 19's
  "ord som uttrykker mengde" table surfaced a genuine gap: the table includes **enhver/ethvert**,
  which the existing rule (covering ingen/alle/hel/hver/begge) never mentioned or tested. Added a
  bilingual paragraph to `rules.ts` explaining «enhver/ethvert» as a more formal, emphatic cousin
  of «hver/hvert», common in rules/rights/general statements, agreeing in gender with no plural
  form (verified diff, applied) before writing questions. New questions drill en/et-word gender
  agreement (fill, minimal-pair, multiple-choice) and the formal-register contrast with plain
  «hver» (minimal-pair), plus transform/order variety. Vocab confirmed present in
  `vocab-a1/a2/b1.json` (elev, menneske, bok, bibliotek, regel, regning, person, utdanning,
  unntak, høre, følge); «borger» from the book's own example sentence swapped for «person»
  (confirmed in vocab) to keep vocab coverage clean. Topic now has 24 total questions (10 B1,
  14 B2).

`grammar.json` running total: **2231**. No duplicate IDs, JSON validity confirmed.

- ✅ **`modalverb-preteritum`** — Done. +10 new B1 questions (`gq-modalpret-019..028`) — topic
  previously had 18 questions (10 A2, 8 B1). Re-reading ch. 10's modal-verb preteritum content
  confirmed the existing rule already covers the core forms (kan→kunne, vil→ville, må→måtte,
  skal→skulle); this batch focused on drilling the **meaning distinctions** each preteritum form
  carries in context (ability vs. polite past request, past necessity vs. hypothetical, past
  intention/prediction), which prior questions under-covered. Questions use fill/transform/order/
  multiple-choice/minimal-pair variety with fresh characters. Vocab confirmed present in
  `vocab-a1/a2/b1.json`; two words swapped for confirmed alternatives (gitar, flytting → not in
  vocab lists) before insertion. Topic now has 28 total questions (18 B1, 10 A2).

`grammar.json` running total: **2241**. No duplicate IDs, JSON validity confirmed.

- ✅ **`kontrast-uttrykk`** — Done. +10 new B1 questions (`gq-kontrast-013..022`) — topic previously
  had 12 questions, all B2, so this was the first B1 pass. Re-reading the book's dedicated
  "Enda – ennå (adv.)" section (ch. 24) surfaced a genuine gap: **`enda`** is far more polysemous
  than the existing rule's subjunksjon-only coverage — as an adverb it can also mean (1) "still"
  (fremdeles), where it's interchangeable with `ennå`; (2) "one more"/"in addition", before a
  numeral ("enda en gang"); and (3) a higher degree, before a comparative ("en enda bedre jobb").
  `Ennå` only ever carries meaning (1) — it can never replace `enda` in the numeral, comparative,
  or subjunksjon (til tross for at) uses. Added a bilingual paragraph to `explanationEn`/
  `explanationNb` in `rules.ts` documenting all four senses (verified diff, applied) before
  writing questions. New questions drill: meaning-ID across all four senses (multiple-choice),
  fill-ins where only `enda` (not `ennå`) is grammatical, the one context where both words work
  (fremdeles), transform (building `enda` + komparativ), and order (subjunksjon use). Vocab
  confirmed present in `vocab-a1/a2/b1.json` (kaffe, kake, øvelse, vanskelig, regn, trøtt, leilighet,
  stor). Topic now has 22 total questions (10 B1, 12 B2).

`grammar.json` running total: **2251**. No duplicate IDs, JSON validity confirmed.

- ✅ **`infinitiv-a1`** — Done. +10 new B1 questions (`gq-infa1-021..030`) — topic already had 10 B1
  questions from an earlier session covering `bestemme seg for å`, `glede seg til å`, `vant til å`,
  `unngå å`, `ivrig etter å`, `stolt av å`, and `for å` (hensikt). Re-reading ch. 20's "Uttrykk som
  tar infinitiv" list surfaced several expressions not yet drilled: **`ha lyst til å`**, **`har
  tenkt å`**/**`har planlagt å`** (no preposition — «å» follows directly), **`det er/blir` +
  adjektiv + `å`** (fint/hyggelig å — also no preposition), **`grunn til å`**, **`ferdig med å`**,
  and **`stå i fare for å`**. No `rules.ts` change was needed — the existing rule's three-pattern
  framework (naken infinitiv / «å» alone / fast preposisjon + «å») already covers these as
  instances, just needed the concrete vocabulary drilled. Questions cover fill/transform/order/
  multiple-choice/minimal-pair, including one question contrasting a no-preposition expression
  (`har tenkt å`) against three that require one. Vocab confirmed present in `vocab-a1/a2/b1.json`
  (reise, si opp, jobb, kjøpe, bil, sove, lenge, tvile, ferdig, studere, miste, nøkkel, flytte,
  fest). Topic now has 30 total questions (20 B1, 10 A1).

`grammar.json` running total: **2261**. No duplicate IDs, JSON validity confirmed.

- ✅ **`stedsadverb-statisk-dynamisk`** — Done. +10 new B1 questions (`gq-stedsadv-011..020`) —
  topic previously had 10 questions, all B2, so this was the first B1 pass. Re-reading ch. 22's
  content surfaced a genuine gap: the existing rule only covered the two-way static/dynamic pairs
  (hjemme/hjem, inne/inn, ute/ut, etc.), but «hjem» actually has a **third form for movement AWAY**
  from a place: «hjemmefra» ("from home"), following the same «-fra» pattern as ovenfra/nedenfra/
  utenfra/innenfra. Added a bilingual paragraph to `rules.ts` documenting the three-way pattern
  (dynamic-toward / static / dynamic-away — verified diff, applied) before writing questions. New
  questions focus mostly on the hjem/hjemme/hjemmefra three-way discrimination (fill, minimal-pair,
  transform, order, multiple-choice), plus two basic round-out fill questions for inne/inn and
  ute/ut at B1 level. Vocab confirmed present in `vocab-a1/a2/b1.json` (jakke, hage, studere,
  flytte, by, film, klokka). Topic now has 20 total questions (10 B1, 10 B2).

`grammar.json` running total: **2271**. No duplicate IDs, JSON validity confirmed.

- ✅ **`man-en-upersonlig-pronomen`** — Done. +10 new B1 questions (`gq-man-009..018`) — topic
  previously had 8 questions, all B2, so this was the first B1 pass. Chapter 3's «Man – en/ens»
  section is an exact-match source (see §D above). Re-reading it surfaced a genuine gap: «en» has
  its own possessive/genitive form, «ens» ("one's"), which the existing rule never mentioned —
  only the subject/object distinction between «man» and «en» was covered. Added a bilingual
  paragraph to `rules.ts` documenting «ens», including the subtlety that «ens» is NOT used
  alongside «man» as co-referential subject in the same clause (where the ordinary reflexive
  «sin/sitt/sine» applies instead) — verified diff, applied — before writing questions. New
  questions split roughly evenly: 4 round out the basic subject/object distinction at B1 level
  (fill, minimal-pair, multiple-choice, order), and 6 drill «ens» (fill, transform, order,
  multiple-choice) plus one minimal-pair specifically testing the «man ... sin» vs. «man ... ens»
  gotcha. Vocab confirmed present in `vocab-a1/a2/b1.json` (helse, familie, mening, grense, plan,
  vane, oppdragelse, side, egenskap, energi, kaffe). Topic now has 18 total questions (10 B1, 8 B2).

`grammar.json` running total: **2281**. No duplicate IDs, JSON validity confirmed.

- ✅ **`adj-comparison`** — Done. +10 new B1 questions (`gq-adj-064`, `gq-adj-085..093`) — topic
  previously had 27 questions (8 A2, 4 B1 from an earlier session, plus reused A2/B1 entries).
  Re-reading ch. 8's «Gammel, ung, ny, lett, tung, vanskelig» pairing and ch. 10's superlativ
  section surfaced two genuine gaps: (1) `tung` has an irregular comparative with a vowel shift
  (tung → tyngre → tyngst), the same pattern as `ung`, which the rule never listed; and (2) the
  predicative-position superlative rule was incomplete — without a separate article the
  superlative stays indefinite ("Disse bøkene er best", not "beste"), but WITH the article «de»
  the definite form is required ("de beste", not "de best"). Extended `rules.ts` with both —
  verified diff, applied — before writing questions. New questions cover: gammel/tung/ny/lett/
  vanskelig comparative-superlative forms (fill), plus 3 questions specifically drilling the
  best/beste/de-beste predicative nuance (2 minimal-pair, 1 multiple-choice). **Note:** hit an
  ID collision — the `gq-adj-XXX` numbering is shared across `adj-comparison` and `adj-agreement`,
  and 065–073 were already used by `adj-agreement`; renumbered the affected 9 questions to
  085–093 (verified against the true max across all `gq-adj-*` ids, which was 84). Vocab
  confirmed present in `vocab-a1/a2/b1.json` (bygning, sekk, koffert, telefon, oppgave, eple,
  butikk, prøve, fin, by). Topic now has 37 total questions (23 B1, 14 A2).

`grammar.json` running total: **2291**. No duplicate IDs, JSON validity confirmed.

- ✅ **`adj-agreement`** — Done. +10 new B1 questions (`gq-adj-094..103`) — topic previously had
  34 questions (10 B1 from an earlier session, plus A1/A2/B2 entries). Re-reading ch. 2's
  «Adjektiv på -el, -er og -en» section and ch. 22's «Sånn, sånt, sånne / slik, slikt, slike»
  section surfaced two genuine gaps the existing rule never covered: (1) the spelling pattern
  where -el/-er/-en adjectives drop the -e- (and a doubled consonant, where relevant) in
  plural/definite form (gammel → gamle, vakker → vakre, sliten → slitne, sulten → sultne,
  diger → digre); and (2) «sånn/sånt/sånne» and «slik/slikt/slike», which behave exactly like
  adjectives agreeing in gender/number ("such, that kind of"). Extended `rules.ts` with both —
  verified diff, applied — before writing questions. New questions split 5/5: 5 drill the
  -el/-er/-en spelling pattern (fill ×4, minimal-pair ×1), 5 drill sånn/slik agreement (fill ×3,
  minimal-pair ×1, multiple-choice ×1). Vocab confirmed present in `vocab-a1/a2/b1.json`
  (sliten, vakker, sulten, diger, hund, hus, hånd, bil, bursdag, tull, historie, klær). Topic now
  has 44 total questions (20 B1, 8 A1, 6 A2, 10 B2). **Reminder for future `adj-*` batches:** IDs
  under `gq-adj-*` are shared across `adj-comparison` and `adj-agreement` — the true max across
  BOTH topics is now **103**; always check across both before picking new IDs.

`grammar.json` running total: **2301**. No duplicate IDs, JSON validity confirmed.

- ✅ **`noun-articles`** — Done. +10 new B1 questions (`gq-noun-art-039..048`) — topic previously
  had 38 questions (10 B1 from an earlier session, plus A1/A2/B2 entries). Re-reading ch. 2's
  «Substantiv med og uten artikkel» and ch. 3's «Bestemt/ubestemt substantiv» sections surfaced a
  genuine gap the existing rule only partly covered: the broader **identity-statement pattern** —
  when a noun states what the SUBJECT itself is/was/will become (profession, nationality, life
  stage), Norwegian drops the article entirely ("Han er lærer", "Hun er nordmann", "Da jeg var
  barn"), but the SAME noun requires the article when it refers to a different person/object
  rather than the subject's own identity ("Jeg traff en lærer"). Extended `rules.ts` with this
  broader identity-vs-object framing (previously the rule only implied this narrowly) — verified
  diff, applied — before writing questions. New questions drill the identity/object contrast
  across profession, nationality, and life-stage nouns (fill ×4, minimal-pair ×4, multiple-choice
  ×1, order ×1). Vocab confirmed present in `vocab-a1/a2/b1.json` (nordmann, barn, lege,
  pensjonist, onkel, fisker, nabo, student, universitet, ungdom, skuespiller, reise); `Spania` is
  a proper noun and not expected in the vocab lists. Topic now has 48 total questions (20 B1, 10
  A2, 10 B2, 8 A1).

`grammar.json` running total: **2311**. No duplicate IDs, JSON validity confirmed.

- ✅ **`framtid-uttrykk`** — Done. +10 new B1 questions (`gq-framtid-013..022`) — topic previously
  had 12 questions, all B1, added by an earlier `b1-grammar-stein-paa-stein.md` session (see the
  doc's cross-check note flagging this topic as shared between the two source books). Re-reading
  Opp og fram ch. 4's «Skal + infinitiv – kommer til å» section confirmed the existing rule's
  «kommer til å = prediction based on evidence» framing was slightly narrower than the book's own:
  the book's actual test is CONTROLLABILITY — «skal» requires the subject to be able to plan or
  decide the outcome, while «kommer til å» covers any state/event no one controls (book sales,
  weather, a match result), even without a specific visible sign. Extended `rules.ts` with this
  controllability test alongside the existing evidence-based framing — verified diff, applied —
  before writing questions. New questions use fresh characters/sentences (not reused from Stein
  på Stein): 6 drill the skal/kommer-til-å controllability contrast (fill ×3, minimal-pair ×2,
  multiple-choice ×1, transform ×1 — covers building a house, book sales, a football match,
  travel bookings, a new shop opening, and weather), 1 order question (elever/eksamen), and
  3 round out the other expressions with new scenarios (`har tenkt å`—minimal-pair, `vil`—fill,
  `vil helst`—transform). Vocab confirmed present in `vocab-a1/a2/b1.json` (bygge, hus, plan,
  selge, bok, forfatter, vinne, kamp, vinter, billett, hotell, reise, ny, butikk, sentrum, avtale,
  klar, elev, eksamen, øve, søke, stilling, sikker, marked, hjemmefra, kontor). Topic now has 22
  total questions, all B1.

`grammar.json` running total: **2321**. No duplicate IDs, JSON validity confirmed.

- ✅ **`da-naar`** — Done. +10 new B1 questions (`gq-danaar-011..020`) — topic previously had
  10 questions, all B1, added by an earlier `b1-grammar-stein-paa-stein.md` session. Re-reading
  Opp og fram ch. 5's «Da – når» section surfaced a genuine gap: the existing rule covered the
  basic single-event-vs-repeated-event contrast but never mentioned that «da» attaches directly
  to a noun naming the specific occasion — «den gangen da», «den dagen da», «året da» — to point
  back at one particular past moment ("Husker du den gangen da vi dro til Danmark?"). Extended
  `rules.ts` with this noun+da pattern — verified diff, applied — before writing questions. New
  questions: 6 drill the noun+da pattern specifically (`den dagen da`, `året da`, `den gangen da`,
  `kvelden da`, `sommeren da`, `bursdagsfesten da` — fill ×2, minimal-pair ×2, transform ×2, order
  ×1, multiple-choice ×1 across those), and 1 rounds out the ordinary da/når contrast (a
  «pleide»-habit sentence where the triggering event itself is still one-time, so «da» applies
  despite the habitual continuation). Vocab confirmed present in `vocab-a1/a2/b1.json` (leilighet,
  eksamen, konsert, bursdag, skole, sykle, sommer, ferie, ulykke — note: `friminutt`, `skoletid`,
  and `landsby` from an earlier draft were NOT in the vocab lists and were dropped in favor of
  confirmed words). Topic now has 20 total questions, all B1.

`grammar.json` running total: **2331**. No duplicate IDs, JSON validity confirmed.

## Next session starting point

**Phase 1 is complete** (all 40 chapters read/accounted for). **All 4 §E new topics are now
complete** (transitiv-intransitiv-verb, s-verb, verbprefiks-be-an-mis, adverb-setningsbinding —
48 questions total), **`adjektiv-eller-adverb` is done** (+10 questions), **`partisipp-former`
is done** (+11 questions), **`ordfamilie-avledning` is done** (+10 questions),
**`preposisjoner-sted` is done** (+10 questions), **`noun-plurals` is done** (+12 questions),
**`nyanser-uttrykk` first batch is done** (+12 questions, more remain — see note above),
**`passiv-bli-s` is done** (+10 questions, including the newly-found være-passiv gap),
**`modale-adverb` is done** (+10 questions, including the newly-found `vel`/`visst` nuance gaps),
**`bade-og-verken-eller` is done** (+10 questions, including the newly-found `enten …
eller` gap), **`preteritum-perfektum-og-futurum` is done** (+10 questions, first B1 pass,
no rule-text gap found), **`preposisjoner-tid` is done** (+10 questions, including the
newly-found holiday-expression gap), and **`spesial-kvantorer` is done** (+10 questions,
first B1 pass, including the newly-found `enhver`/`ethvert` gap), **`modalverb-preteritum`
is done** (+10 questions, focused on meaning-distinction drilling since the existing rule already
covered the core forms), **`kontrast-uttrykk` is done** (+10 questions, first B1 pass,
including the newly-found `enda`'s four-sense polysemy vs. `ennå`'s single sense), and
**`infinitiv-a1` is done** (+10 questions, drilling new preposition-before-«å» expressions from
ch. 20, no rule-text gap found), and **`stedsadverb-statisk-dynamisk` is done** (+10 questions,
first B1 pass, including the newly-found `hjemmefra` dynamic-away gap), and
**`man-en-upersonlig-pronomen` is done** (+10 questions, first B1 pass, including the
newly-found `ens` possessive-form gap), and **`adj-comparison` is done** (+10 questions,
including the newly-found `tung`→`tyngre`→`tyngst` irregular gap and the best/beste/de-beste
predicative nuance gap; also fixed a `gq-adj-*` ID-numbering collision with `adj-agreement`),
and **`adj-agreement` is done** (+10 questions, including the newly-found -el/-er/-en spelling
pattern and sånn/slik agreement gaps), and **`noun-articles` is done** (+10 questions,
including the newly-found broader identity-vs-object statement pattern), and
**`framtid-uttrykk` is done** (+10 questions, including the newly-found controllability test
(«skal» = subject can plan/decide vs. «kommer til å» = no one controls it) refining the existing
evidence-based framing), and **`da-naar` is done** (+10 questions, including the newly-found
noun+da pattern — «den gangen da», «den dagen da», «året da»). Continuing **Phase 2** with the
remaining §C/D reuse touches, roughly in chapter order:

1. Remaining §C candidates not yet touched: `noun-possessives` (ch. 8 — start here next),
   `sterke-verb` (ch. 8), `kvantorer` (ch. 4/7/10/19),
   `relative-som` (ch. 12), `sammensatte-substantiv` (ch. 5), `indirekte-tale-at-om`
   (ch. 2/5/6/22), `synes-tror` (ch. 28, A1 cross-level). Remaining §D candidates:
   `arsak-og-folge-uttrykk`, `verbet-a-fa`, plus `nyanser-uttrykk`'s leftover candidates
   (listed above — interleave a small batch whenever convenient since it's a large bucket).
2. Decide også–ikke-heller's home (fold into `kontrast-uttrykk` or `bade-og-verken-eller`) when
   that topic-touch comes up.
3. Build ~8–12 questions per topic-touch, batch a few per session (mirror vocab against
   `vocab-b1.json`, fresh characters/sentences per the copyright approach above). Use the same
   workflow each time: read the topic's existing `rules.ts` entry for scope, grep `vocab-*.json`
   for candidate words via `lemma` field before writing, draft the fragment, `edit_file` with
   `dryRun: true` first to review the diff, then apply for real, then re-copy the file and run a
   Python JSON-validity + duplicate-ID check before moving on.
4. Before starting, re-check §A idiom candidates (å ta, nese, side, alder-faser, glatt vei,
   snø-ord) against `uttrykk-b1.json`/`vocab-b1.json` to confirm they're already covered — skip
   silently if so.
5. Update this doc's Phase 2 progress log after each topic-touch, same convention as the §E log
   above.
