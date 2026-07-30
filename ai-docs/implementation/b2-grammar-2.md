# Nivå B2 Grammar, Round 2 — Implementation Plan

## Overview

Coverage of three additional B2 source books, cross-checked against the 25 topic-touches already
built in `ai-docs/implementation/b2-grammar.md` (10 new topics + 13 reused-topic touches, plus the
2 pre-existing `relative-som`/`svar-ja-jo-nei` touches):

1. `draft/b2/her-paa-berget-arbeidsbok/content.md` (+ `innhold.md` for the table of contents) —
   "Her på berget", 12 chapters, section A "Vokabular og grammatikk" only.
2. `draft/b2/god-i-norsk-3-b2/arbeidsbok.md` — "God i norsk 3", grammar sections only (vocab/uttrykk
   sections skipped per instructions).
3. `draft/b2/god-i-norsk-3-b2/tekstbok.md` — a full "Minigrammatikk" reference chapter, useful for
   confirming rule details and finding a few additional testable points not spelled out as
   standalone exercises in the arbeidsbok.

Same method as every prior plan: reuse an existing topic bucket where a book is testing a point the
app already covers (add `cefr: 'B2'` entries), and add a new topic only where the grammar point
itself isn't covered by any existing topic (checked against the full `GrammarTopic` list, not just
the B2-tagged subset, since some of these points might already exist at another level and could be
reused-with-B2-entries instead of built fresh).

**Language of new content:** Norwegian-only from the start, per `grammar-with-only-norsk.md`,
identical to every prior plan. This applies to everything learner-facing: every `GrammarQuestion`
`prompt`/`hint`/`explanation`, all `options`/`optionA`/`optionB`, and the on-reveal rule box (which
renders `GrammarRule.titleNb`/`explanationNb` unconditionally, per Phase 2 of that doc). The rule
drafts below still populate `titleEn`/`explanationEn` because `GrammarRule` requires those fields —
but per the same doc's decision, they're kept-but-unused scaffolding only, not real bilingual
content; nothing renders them. Don't read "rule drafts include an EN version" as content being
bilingual — Phase 2 content-writing is Norwegian-only, full stop.

**Copyright approach (unchanged):** every question is newly written; the three source books are
used only to identify which rule/difficulty to target, never to copy or closely paraphrase
sentences. All three books reuse similar recurring names/situations (Stefan, Mina, Anders/Nora,
Trine, etc.) — invent fresh names/sentences as always.

**Vocab integration:** use real B2 vocabulary (`vocab-b2.json`/`uttrykk-b2.json`), verified the same
way as every prior plan via `scripts/check-b2-grammar-vocab.mjs`.

---

## Method note: why three books at once

All three sources turned out to overlap heavily with each other (they're covering the same B2
curriculum from different publishers), which is useful — where two or three books independently
treat something as its own named grammar point, that's a strong signal it's a genuine gap rather
than an idiosyncratic one-book emphasis. The topic list below flags which source(s) each new topic
came from for that reason.

---

## Scope decisions

### Topic granularity: 13 new topics + 3 reused topic-touches (16 topic-touches total)

**Genuinely new grammar points, not covered by any existing topic (checked against the full
`GrammarTopic` list, all levels):**

| New topic                          | Source(s)                                                                                                                                            | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `modale-adverb`                    | HPB ch.1 ("Modale uttrykk"); GiN3 (adverb chapter, "Modale adverb")                                                                                  | The certainty/discourse-particle adverbs **faktisk, egentlig, nok, vel, jo**, extended with **kanskje, sikkert, visst, neppe, visstnok** from GiN3's fuller list. Distinct from `sannsynlighet-uttrykk` (which covers full *phrases* like "det er sannsynlig at"): this is single modal-particle placement and choice, e.g. distinguishing *vel* (expects agreement) from *jo* (shared knowledge) from *nok* (hedged assumption). Independently named as its own grammar point in **both** sources — strong signal.                                 |
| `sammensatte-substantiv`           | HPB ch.4 ("Sammensatte substantiv", "Adjektiv + substantiv"); GiN3 tekstbok ("Orddanning")                                                           | Compound noun formation: which element is the *hovedord* (governs gender/inflection), when to insert a linking **-s-** (after -sjon/-else/-skap/-het/-dom/-tet/-ing/-ning) vs **-e-** (short person/animal nouns) vs nothing, plus the adjacent adjective+noun vs. fixed-compound distinction (en brun ost / en brunost) where meaning narrows and the adjective stops inflecting.                                                                                                                                                                  |
| `preteritum-perfektum-og-futurum`  | HPB ch.5 ("Preteritum perfektum og preteritum futurum"); GiN3 tekstbok (full presens-/preteritumssystem table, incl. "preteritum futurum perfektum") | Narrating **before** and **after** a point in the past within the same passage: preteritum perfektum (**hadde** + perfektum partisipp) for what happened earlier, preteritum futurum (**skulle/ville** + infinitiv) for what was still to come from that past vantage point, and preteritum futurum perfektum (**skulle/ville ha** + perfektum partisipp) for the unrealized/hypothetical variant. A distinctly B2 narrative-sequencing skill, not just tense-form drilling.                                                                        |
| `det-formelt-subjekt`              | HPB ch.6 ("*Det* som formelt subjekt", "Verb – passiv i *det*-setninger"); GiN3 ("Det-setninger: presentering")                                      | **Det** as a contentless formal subject introducing new/indefinite information that would otherwise sound wrong sentence-initial: "Det sitter noen elever i klasserommet," "Det ble utlyst en stilling," "Det snakkes mye om dette." Includes the passive-specific case (formal subject + s-passiv/bli-passiv) as one construction family, since both sources treat it as the same underlying rule applied to passive vs. active.                                                                                                                   |
| `det-er-var-som-utbryting`         | HPB ch.6 ("*Det er/var + som*-setning"); GiN3 ("Som i setninger med utbryting")                                                                      | Cleft/emphasis construction: **Det er/var X som ...** to front and highlight one constituent ("Det var broren min som ringte," not "jeg"). Covers tense choice (er vs. var), the *som*-requirement when the fronted element is the subject, and the common spoken-question pattern ("Hvem var det som ...?").                                                                                                                                                                                                                                       |
| `det-referanse`                    | HPB ch.6 ("*Det* binder sammen setninger")                                                                                                           | Anaphoric **det** referring back not to a specific neuter noun but to a whole clause, an adjective, or a previous predicate ("Er hun flink? — Ja, det er hun." "Jeg synes X. — Det gjør jeg også."). A distinctly tricky B2 point since it cuts across normal den/det/de gender-agreement rules.                                                                                                                                                                                                                                                    |
| `spesial-kvantorer`                | HPB ch.8 ("Ingen og ingenting", "Alle – hel – hver", "Begge (to) – begge deler"); GiN3 (same set, "Hvilke mengdeord hvor?")                          | The specific quantifier-pronoun set not covered by the existing `kvantorer` topic (which handles mange/noen/flere plural determiners): **ingen/ikke noen** vs **ingenting/ikke noe** (tellelig/utellelig, and the "no insertion when a word splits ikke from no(e/n)" rule), **all/alt/alle** and **hel/helt/hele** and **hver/hvert** gender+countability agreement, and **begge (to)/begge deler** vs their negative counterparts **ingen av dem/ingen av delene**. Independently spelled out as multiple distinct grammar boxes in both sources. |
| `arsak-og-folge-uttrykk`           | HPB ch.10 ("Sammenbinding av setninger: årsak og følge", "Mer om årsak og følge"); GiN3 ("Årsak og virkning")                                        | Broader than the existing `derfor-fordi` reused topic (which pairs derfor↔fordi specifically): the fuller B2 causation toolkit — subjunksjons siden/i og med at/ettersom/slik at, adverbs dermed/nemlig, causative verbs føre til/skyldes/gjøre at/føre med seg/henge sammen med, nominal grunn/årsak/følge (+ "grunnen til at"/"på grunn av at"), and hensikt (purpose) clauses with for at/slik at/så.                                                                                                                                            |
| `kontrast-uttrykk`                 | HPB ch.10 ("Sammenbinding av setninger: motsetning"); GiN3 ("Motsetning")                                                                            | Broader than the existing `motsetning-selv-om-likevel` reused topic: the fuller contrast/concession toolkit — subjunksjons enda/til tross for at, adverbs til tross for det/ikke desto mindre/imidlertid/derimot/tvert imot/ellers/i motsetning til, and the correlative på den ene siden/på den andre siden.                                                                                                                                                                                                                                       |
| `hoflig-preteritum`                | HPB ch.11 ("Mer om verbformene"); GiN3 tekstbok ("Imperativ" — polite alternatives)                                                                  | Preteritum of a modal or main verb used for politeness/hedging rather than past time: "Kunne du hjelpe meg?", "Det hadde vært fint om...", "Jeg lurte på om...", "Du burde/skulle prøve...". Distinct from `modalverb-preteritum` (past-tense meaning) and `modalverb-betydning` (meaning choice among kan/skal/vil/må) — this is specifically the pragmatic softening use of the past tense in present-time requests/suggestions.                                                                                                                  |
| `hypotetiske-betingelsessetninger` | HPB ch.11 ("Tenkte tilfeller: hypotetiske utsagn"); GiN3 ("Hypotetiske setninger", "Ønsketenkning og uttrykk for risiko")                            | Counterfactual/hypothetical conditionals, graded by how (un)real the condition is: presens for a real future possibility, preteritum (+ ville/skulle) for an unlikely present/future, preteritum perfektum (+ ville ha) for an unrealized past — plus the related wish constructions **skulle ønske (at) + preteritum/preteritum perfektum** and **tenk om + preteritum/presens**. One of the richest genuinely-new B2 points in either book; independently given a full dedicated grammar box in both sources.                                     |
| `stedsadverb-statisk-dynamisk`     | GiN3 (adverb chapter, stedsadverb pairs); HPB ch.1 ("Adverb i superlativ" touches the same pair set)                                                 | The location-adverb pairs that distinguish being at a place vs. moving toward it: hjemme/hjem, inne/inn, ute/ut, oppe/opp, nede/ned, borte/bort, framme/fram, der/dit, her/hit. A classic, well-defined confusion point not covered by any existing topic.                                                                                                                                                                                                                                                                                          |
| `man-en-upersonlig-pronomen`       | GiN3 tekstbok ("Ubestemt pronomen")                                                                                                                  | Impersonal/generic reference: **man** (subject only) vs **en** (subject or object) vs colloquial **du**/**folk**, choosing correctly by grammatical role in the sentence.                                                                                                                                                                                                                                                                                                                                                                           |

**Reused topics (add `cefr: 'B2'` entries or extend `explanationNb`, no new topic needed):**

| Topic                    | Source(s)                                                                                                 | B2 addition                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------------ | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `partisipp-former`       | HPB ch.10 ("Partisipper"); GiN3 (perfektum partisipp declension)                                          | Add the specific declension nuance not yet in this topic's B2 entries: **-ete/-ede** for weak verbs ending in *-et* (truet → de truede/truete) vs **-ne** for strong/irregular *-et*-verbs (stjålet → de stjålne), plus fixed sammensatte adjektiv built from perfektum partisipp (halvspist, nymalt, bløtkokt). Needs a short `explanationNb` addition documenting the -ete/-ede vs -ne split (currently the rule text covers agreement generally but not this allomorphy).                                                                  |
| `ordfamilie-avledning`   | HPB ch.12 ("Substantiv av sammensatte verb"); GiN3 tekstbok ("Ordlaging med forstavelser eller endinger") | Add the compound-verb-to-noun derivation patterns not yet in this topic's entries: **-ing** (dele ut → utdeling), **-else** (oppleve → opplevelse), **-takelse/-tagelse** from **ta**-verbs (delta → deltakelse), **-sigelse** from **si**-verbs (si opp → oppsigelse), **-givelse** from **gi**-verbs (gi ut → utgivelse), and zero-derivation pairs (gå ut → en utgang, påstå → en påstand).                                                                                                                                                |
| `partikkelverb-los-fast` | HPB ch.12 ("Sammensatte verb", "Løst eller fast sammensatt verb?"); GiN3 (scattered examples)             | Both sources supply a much larger example set than the existing 12 B2 questions cover (skrive under/underskrive, sette i gang/igangsatt, legge fram/framlegge, gi ut/utgi, høre til/tilhøre, legge vekt på/vektlegge, ta del/delta, ta imot/motta, arbeide sammen/samarbeide, føre til/tilføre, stå opp/oppstå, sette ut/utsette, rette opp/opprette, dra opp/oppdra) — a modest additional batch (8-10 Qs) rounds out this topic with the concrete-vs-abstract-meaning-shift pattern the rule text already documents, using fresh sentences. |

**Not built as grammar questions (out of scope for this format, same treatment as every prior
plan's exclusions):**

- HPB ch.1 "Setningsledd" (identify subject/verbal/object/indirect object/predikativ/adverbial) —
  a labeling/identification task, not a rule with a single correct fill/transform/order answer;
  doesn't fit the schema cleanly and the underlying skill (recognizing word order slots) is already
  exercised indirectly by every word-order-sensitive topic in the app.
- HPB ch.7 "Pronomen" (den/det reference, subject/object pronoun forms), "Refleksiv form – seg",
  "Possessiver", "Refleksive possessiver" — foundational pronoun/possessive material that predates
  B2; not a gap in the app's B2 content specifically (these forms are either already covered at a
  lower level or are basic enough that B2 learners are assumed to have them). Flagging here rather
  than silently skipping in case a future audit finds they're genuinely missing at A2/B1 — if so,
  they belong in a lower-level plan, not this one.
- GiN3's "Bindeord" / "Mer om bindeord" essay-cohesion tables (kronologi, legge til, eksempler,
  sammenligning, vektlegging, konklusjon categories: for eksempel, i likhet med, kort fortalt, som
  et resultat av, etc.) — this is a text-organization/discourse-marker vocabulary list for essay
  writing, not a single-rule grammar point; the two sub-parts that genuinely are gradable grammar
  (årsak-virkning, motsetning) are already captured above as `arsak-og-folge-uttrykk` and
  `kontrast-uttrykk`. The remaining categories are closer to `uttrykk`/vocab content than grammar.
- GiN3 tekstbok "Kommaregler" — comma-placement rules are real and testable in principle, but don't
  fit any of the app's five question types (`fill`/`order`/`transform`/`minimal-pair`/
  `multiple-choice`) without a punctuation-specific answer format the schema doesn't support;
  flagging as a possible future schema extension rather than building it awkwardly into an existing
  type.
- GiN3 "Enig i – enig med – enige om" — a single fixed-preposition lexical pattern (one adjective,
  three prepositions), better suited to a vocab/uttrykk entry than a dedicated grammar topic; not
  built here, but worth a note for whoever next reviews `uttrykk-b2.json` gaps.
- GiN3 tekstbok's uregelrette-verb table, verb-bøyningsmønster table (-et/-et, -te/-t, -de/-d,
  -dde/-dd), and full pronoun/possessive/determinative reference tables — pure reference material
  duplicating what's already tested via existing lower-level topics; nothing new to build.
- HPB ch.1 "Setningsstruktur i helsetninger" / "Konjunksjoner" and GiN3's parallel V2-word-order and
  og/men/for/så/eller sections — basic clause structure and coordinating conjunctions, already
  covered by existing lower-level topics; confirmed not a B2-specific gap.
- HPB ch.2 "Subjunksjoner" (da/når, hvis/om) — same subjunction pairs already handled by existing
  B1 topics (`da-naar`, `hvis-om-betingelse`), reused via `subjunksjon-oversikt` at B2; not a new
  gap, just confirms the round-1 plan's coverage was correct.

**Total: 13 new topics + 3 reused topic-touches = 16 topic-touches.** At the same ~10-12
questions/touch density as round 1, this targets **~160-200 questions**, bringing B2's topic count
from 25 to 38.

---

## Rule text additions needed for reused topics (Phase 1, before Phase 2 content)

1. **`partisipp-former`** — add the -ete/-ede (weak verbs) vs -ne (strong/irregular verbs)
   declension split for perfektum partisipp used adjectivally, plus 2-3 sammensatte-adjektiv
   examples (halvspist, nymalt, bløtkokt), to both `explanationEn` and `explanationNb`.
2. **`ordfamilie-avledning`** — add the compound-verb-to-noun suffix family (-ing/-else/
   -takelse/-tagelse/-sigelse/-givelse/zero-derivation) as a documented sub-pattern, alongside the
   existing agent/process/result pattern from round 1.

No other reused topic needs a content addition.

---

## Rule drafts (`src/lib/grammar/rules.ts`) — 13 new topics

```typescript
'modale-adverb': {
  id: 'modale-adverb',
  titleEn: 'Modal adverbs (nok, vel, jo, faktisk, egentlig...)',
  titleNb: 'Modale adverb',
  explanationEn:
    'A small set of adverbs signal how certain the speaker is, or what they assume the listener ' +
    'already knows, without changing the literal content of the sentence: «faktisk» marks a fact ' +
    '(often a surprising one), «egentlig» signals a contrast between what was said and how things ' +
    'really are, «nok» hedges an assumption ("I assume/guess"), «vel» is used in questions where ' +
    'agreement is expected, «jo» signals shared knowledge between speaker and listener, «kanskje» ' +
    'and «sikkert» mark degrees of certainty, «visst» marks something heard secondhand, and ' +
    '«neppe» marks something judged unlikely. These sit in the midtfelt like other setningsadverbial.',
  explanationNb:
    'Et lite sett adverb signaliserer hvor sikker taleren er, eller hva taleren antar at ' +
    'mottakeren allerede vet, uten å endre det bokstavelige innholdet i setningen: «faktisk» ' +
    'markerer et faktum (ofte overraskende), «egentlig» signaliserer en motsetning mellom det som ' +
    'er sagt og hvordan det egentlig er, «nok» avdemper en antakelse ("jeg antar/tror"), «vel» ' +
    'brukes i spørsmål der vi forventer et bekreftende svar, «jo» signaliserer felles kunnskap ' +
    'mellom taler og mottaker, «kanskje» og «sikkert» markerer sikkerhetsgrad, «visst» markerer at ' +
    'noe er hørt fra andre, og «neppe» markerer at noe vurderes som usannsynlig. Disse står i ' +
    'midtfeltet som andre setningsadverbial.'
},

'sammensatte-substantiv': {
  id: 'sammensatte-substantiv',
  titleEn: 'Compound nouns and adjective+noun vs. fixed compounds',
  titleNb: 'Sammensatte substantiv',
  explanationEn:
    'In a compound noun, the last element (hovedordet) governs the gender and inflection; earlier ' +
    'elements only describe it. A linking «-s-» is inserted after words ending in -sjon, -else, ' +
    '-skap, -het, -dom, -tet, and most words ending in -ing/-ning (permisjonsordning, ' +
    'forskningsartikkel); a linking «-e-» appears after many short, often person/animal-referring ' +
    'words (barnebok, gutteskole); otherwise the elements simply join (familielivet). Separately, ' +
    'an adjective + noun written as two words keeps normal adjective agreement and a literal ' +
    'meaning (en brun ost), while the same words fused into one compound word narrow to a specific ' +
    'meaning and the adjective-like first element no longer inflects (en brunost, to brunoster).',
  explanationNb:
    'I et sammensatt substantiv styrer det siste leddet (hovedordet) kjønn og bøyning; ' +
    'tidligere ledd beskriver det bare. Det settes inn en bindings-«-s-» etter ord som ender på ' +
    '-sjon, -else, -skap, -het, -dom, -tet, og de fleste ord som ender på -ing/-ning ' +
    '(permisjonsordning, forskningsartikkel); en bindings-«-e-» dukker opp etter mange korte ord, ' +
    'ofte om personer/dyr (barnebok, gutteskole); ellers settes leddene rett sammen (familielivet). ' +
    'Adjektiv + substantiv skrevet som to ord beholder vanlig adjektivsamsvar og en bokstavelig ' +
    'betydning (en brun ost), mens de samme ordene smeltet sammen til ett sammensatt ord får en ' +
    'spesifikk betydning, og det adjektivliknende første leddet bøyes ikke lenger (en brunost, to ' +
    'brunoster).'
},

'preteritum-perfektum-og-futurum': {
  id: 'preteritum-perfektum-og-futurum',
  titleEn: 'Sequencing before/after a past reference point',
  titleNb: 'Preteritum perfektum og preteritum futurum',
  explanationEn:
    'When narrating in the past, «hadde» + perfektum partisipp (preteritum perfektum) marks what ' +
    'had already happened before the reference point, while «skulle/ville» + infinitiv (preteritum ' +
    'futurum) marks what was still to come from that same past vantage point: "Da de hadde funnet ' +
    'olje (before), ville politikerne beholde kontrollen (after)." The unrealized/hypothetical ' +
    'variant, preteritum futurum perfektum, adds «ha» + perfektum partisipp: "Jeg skulle ha gjort ' +
    'dette for lenge siden" (but didn\'t).',
  explanationNb:
    'Når vi forteller i fortid, markerer «hadde» + perfektum partisipp (preteritum perfektum) det ' +
    'som allerede hadde skjedd før referansepunktet, mens «skulle/ville» + infinitiv (preteritum ' +
    'futurum) markerer det som fremdeles lå foran i tid fra det samme fortidige ståstedet: "Da de ' +
    'hadde funnet olje (før), ville politikerne beholde kontrollen (etter)." Den ' +
    'uoppfylte/hypotetiske varianten, preteritum futurum perfektum, legger til «ha» + perfektum ' +
    'partisipp: "Jeg skulle ha gjort dette for lenge siden" (men gjorde det ikke).'
},

'det-formelt-subjekt': {
  id: 'det-formelt-subjekt',
  titleEn: '«Det» as formal/dummy subject',
  titleNb: '«Det» som formelt subjekt',
  explanationEn:
    'Norwegian sentences need a subject, and new or indefinite information usually shouldn\'t open ' +
    'the sentence. «Det» fills the subject slot as an empty placeholder while the real (logical) ' +
    'subject — often indefinite — moves later in the sentence: "Det sitter noen elever i ' +
    'klasserommet," "Det ble utlyst en ledig stilling." The same construction applies to passive ' +
    'sentences with an indefinite logical subject: "Det snakkes mye om dette," "Det må gjøres noe."',
  explanationNb:
    'Norske setninger trenger et subjekt, og ny eller ubestemt informasjon skal vanligvis ikke stå ' +
    'først i setningen. «Det» fyller subjektsplassen som en tom plassholder mens det virkelige ' +
    '(logiske) subjektet — ofte ubestemt — flyttes lenger ut i setningen: "Det sitter noen elever i ' +
    'klasserommet," "Det ble utlyst en ledig stilling." Samme konstruksjon gjelder passive ' +
    'setninger med et ubestemt logisk subjekt: "Det snakkes mye om dette," "Det må gjøres noe."'
},

'det-er-var-som-utbryting': {
  id: 'det-er-var-som-utbryting',
  titleEn: 'Cleft sentences: «Det er/var ... som»',
  titleNb: '«Det er/var ... som»-utbryting',
  explanationEn:
    'To highlight one constituent of a sentence, front it after «Det er» (presens) or «Det var» ' +
    '(preteritum), followed by «som» when the highlighted element is the subject: "Broren min ' +
    'ringte" → "Det var broren min som ringte" (not someone else). When another element than the ' +
    'subject is broken out, «som» is usually dropped: "Det er deg jeg elsker." The pattern is also ' +
    'common in spoken wh-questions: "Hvem var det som ringte?"',
  explanationNb:
    'For å framheve ett ledd i en setning, flytter vi det fram etter «Det er» (presens) eller «Det ' +
    'var» (preteritum), fulgt av «som» når det framhevede leddet er subjekt: "Broren min ringte" → ' +
    '"Det var broren min som ringte" (ikke noen andre). Når et annet ledd enn subjektet brytes ut, ' +
    'sløyfer vi vanligvis «som»: "Det er deg jeg elsker." Mønsteret er også vanlig i muntlige ' +
    'hv-spørsmål: "Hvem var det som ringte?"'
},

'det-referanse': {
  id: 'det-referanse',
  titleEn: '«Det» referring back to a clause or predicate',
  titleNb: '«Det» som viser tilbake til en setning eller et predikat',
  explanationEn:
    'Beyond referring back to a specific neuter noun, «det» can point back to a whole clause, an ' +
    'adjective, or a previous verb phrase, regardless of the gender of what\'s being referred to: ' +
    '"Er hun flink? — Ja, det er hun." "Jeg synes politikk er kjedelig, men det er ikke han." "Hun ' +
    'har mange planer, og det har jeg også." This cuts across the normal den/det/de gender-' +
    'agreement pattern, since «det» here isn\'t agreeing with a noun\'s gender at all.',
  explanationNb:
    'Utover å vise tilbake til et bestemt intetkjønnsord kan «det» vise tilbake til en hel ' +
    'setning, et adjektiv eller en tidligere verbalfrase, uavhengig av kjønnet til det det vises ' +
    'til: "Er hun flink? — Ja, det er hun." "Jeg synes politikk er kjedelig, men det er ikke han." ' +
    '"Hun har mange planer, og det har jeg også." Dette bryter med det vanlige den/det/de-' +
    'kjønnssamsvaret, siden «det» her ikke samsvarer med et substantivs kjønn i det hele tatt.'
},

'spesial-kvantorer': {
  id: 'spesial-kvantorer',
  titleEn: 'ingen/alle/hel/hver/begge — specialized quantifier-pronouns',
  titleNb: 'ingen, alle, hel, hver, begge',
  explanationEn:
    '«Ingen»/«ikke noen» replace «ikke» + «noen» for countable nouns; «ingenting»/«ikke noe» for ' +
    'uncountable ones — but if another word splits «ikke» from «no(e/n)» (e.g. a two-part verb), ' +
    'the ingen-forms can\'t be used. «All/alt» go with uncountable nouns (agreeing in gender), ' +
    '«alle» with plurals. «Hel/helt» go with countable singular indefinite nouns (agreeing in ' +
    'gender), «hele» with definite singular nouns — never with the den/det/de article. «Hver/hvert» ' +
    'go with countable singular nouns (agreeing in gender), always followed by indefinite form. ' +
    '«Begge (to)» is for two specific people/things in definite form; «begge deler» for something ' +
    'general/uncountable or two different things; their negative counterparts are «ingen av dem» ' +
    'and «ingen av delene».',
  explanationNb:
    '«Ingen»/«ikke noen» erstatter «ikke» + «noen» for tellelige substantiv; «ingenting»/«ikke noe» ' +
    'for utellelige — men hvis et annet ord skiller «ikke» fra «no(e/n)» (f.eks. et sammensatt ' +
    'verb), kan ikke ingen-formene brukes. «All/alt» står til utellelige substantiv (samsvarer i ' +
    'kjønn), «alle» til flertall. «Hel/helt» står til tellelige substantiv i ubestemt entall ' +
    '(samsvarer i kjønn), «hele» til bestemt entall — aldri sammen med artikkelen den/det/de. ' +
    '«Hver/hvert» står til tellelige substantiv i entall (samsvarer i kjønn), alltid fulgt av ' +
    'ubestemt form. «Begge (to)» brukes om to bestemte personer/ting i bestemt form; «begge deler» ' +
    'om noe generelt/utellelig eller to ulike ting; de negative motstykkene er «ingen av dem» og ' +
    '«ingen av delene».'
},

'arsak-og-folge-uttrykk': {
  id: 'arsak-og-folge-uttrykk',
  titleEn: 'A broader toolkit for cause, effect, and purpose',
  titleNb: 'Flere måter å uttrykke årsak, følge og hensikt',
  explanationEn:
    'Beyond derfor/fordi, B2 texts draw on a fuller causation toolkit: subjunksjons «siden»/«i og ' +
    'med at»/«ettersom» (cause, near-synonyms of fordi) and «slik at» (result); adverbs «dermed» ' +
    '("as a result of this") and «nemlig» (explains the previous sentence, mid-position); ' +
    'causative verbs «føre til», «skyldes», «gjøre at», «føre med seg», «henge sammen med»; nominal ' +
    'expressions «grunn(en til)», «årsak(en til)», «følge(n)», often followed by «at»-clauses ' +
    '("årsaken til at ..."); and hensikt (purpose) clauses with «for at», «slik at», «så» ("Hun ' +
    'åpnet vinduet for at han skulle få frisk luft").',
  explanationNb:
    'Utover derfor/fordi bruker B2-tekster et fyldigere sett årsaksuttrykk: subjunksjonene «siden»/' +
    '«i og med at»/«ettersom» (årsak, nær synonymt med fordi) og «slik at» (følge); adverbene ' +
    '«dermed» ("som følge av dette") og «nemlig» (forklarer forrige setning, midtfeltplassering); ' +
    'årsaksverb «føre til», «skyldes», «gjøre at», «føre med seg», «henge sammen med»; nominale ' +
    'uttrykk «grunn(en til)», «årsak(en til)», «følge(n)», ofte fulgt av at-setninger ("årsaken til ' +
    'at ..."); og hensiktssetninger med «for at», «slik at», «så» ("Hun åpnet vinduet for at han ' +
    'skulle få frisk luft").'
},

'kontrast-uttrykk': {
  id: 'kontrast-uttrykk',
  titleEn: 'A broader toolkit for contrast and concession',
  titleNb: 'Flere måter å uttrykke motsetning',
  explanationEn:
    'Beyond selv om/likevel, B2 texts draw on a fuller contrast toolkit: subjunksjons «enda» and ' +
    '«til tross for at» (both near-synonyms of selv om); adverbs «til tross for det»/«ikke desto ' +
    'mindre» ("nevertheless"), «imidlertid»/«derimot» ("however"), «tvert imot» ("on the ' +
    'contrary"), «ellers» ("otherwise"), «i motsetning til» ("unlike"); and the correlative pair ' +
    '«på den ene siden ... på den andre siden» ("on the one hand ... on the other hand").',
  explanationNb:
    'Utover selv om/likevel bruker B2-tekster et fyldigere sett motsetningsuttrykk: subjunksjonene ' +
    '«enda» og «til tross for at» (begge nær synonymt med selv om); adverbene «til tross for det»/' +
    '«ikke desto mindre», «imidlertid»/«derimot», «tvert imot», «ellers», «i motsetning til»; og ' +
    'korrelatparet «på den ene siden ... på den andre siden».'
},

'hoflig-preteritum': {
  id: 'hoflig-preteritum',
  titleEn: 'Preteritum for politeness and softened suggestions',
  titleNb: 'Preteritum for høflighet og avdempede forslag',
  explanationEn:
    'The preteritum of a modal or main verb can soften a request, wish, or suggestion in present ' +
    'time, without any past-time meaning: "Kunne du hjelpe meg?" (softer than "Kan du..."), "Det ' +
    'hadde vært fint om du kunne komme," "Jeg lurte på om det var mulig å...", "Du burde/skulle ' +
    'prøve en gang til." This is a pragmatic use of the past tense, distinct from `modalverb-' +
    'preteritum`\'s genuine past-time meaning.',
  explanationNb:
    'Preteritum av et modalverb eller hovedverb kan avdempe en forespørsel, et ønske eller et ' +
    'forslag i nåtid, uten noen fortidsbetydning: "Kunne du hjelpe meg?" (mildere enn "Kan du..."), ' +
    '"Det hadde vært fint om du kunne komme," "Jeg lurte på om det var mulig å...", "Du burde/' +
    'skulle prøve en gang til." Dette er en pragmatisk bruk av fortidsformen, ulikt `modalverb-' +
    'preteritum`s ekte fortidsbetydning.'
},

'hypotetiske-betingelsessetninger': {
  id: 'hypotetiske-betingelsessetninger',
  titleEn: 'Hypothetical and counterfactual conditionals',
  titleNb: 'Hypotetiske betingelsessetninger',
  explanationEn:
    'Conditionals are graded by how (un)real the condition is. A real future possibility uses ' +
    'presens throughout: "Hvis jeg vinner i Lotto, reiser jeg jorda rundt." An unlikely present/' +
    'future hypothetical uses preteritum in the hvis-clause and ville/skulle + infinitiv in the ' +
    'main clause: "Hvis jeg vant i Lotto, ville jeg reise jorda rundt." An unrealized past ' +
    'counterfactual uses preteritum perfektum in the hvis-clause and ville (ha)/skulle (ha) + ' +
    'perfektum partisipp in the main clause: "Hvis jeg hadde vunnet i Lotto, ville jeg (ha) reist ' +
    'jorda rundt" — «hvis» can also be dropped with inversion: "Hadde jeg vunnet ..., ville jeg ..." ' +
    'The related wish constructions «skulle ønske (at) + preteritum/preteritum perfektum» and ' +
    '«tenk om + preteritum/preteritum perfektum/presens» use the same tense logic.',
  explanationNb:
    'Betingelsessetninger gradbøyes etter hvor (u)virkelig betingelsen er. En reell framtidig ' +
    'mulighet bruker presens gjennomgående: "Hvis jeg vinner i Lotto, reiser jeg jorda rundt." Et ' +
    'usannsynlig nåtidig/framtidig hypotetisk tilfelle bruker preteritum i hvis-setningen og ville/' +
    'skulle + infinitiv i hovedsetningen: "Hvis jeg vant i Lotto, ville jeg reise jorda rundt." Et ' +
    'uoppfylt fortidig tilfelle bruker preteritum perfektum i hvis-setningen og ville (ha)/skulle ' +
    '(ha) + perfektum partisipp i hovedsetningen: "Hvis jeg hadde vunnet i Lotto, ville jeg (ha) ' +
    'reist jorda rundt" — «hvis» kan også sløyfes med inversjon: "Hadde jeg vunnet ..., ville jeg ' +
    '..." De beslektede ønskeuttrykkene «skulle ønske (at) + preteritum/preteritum perfektum» og ' +
    '«tenk om + preteritum/preteritum perfektum/presens» følger samme tempuslogikk.'
},

'stedsadverb-statisk-dynamisk': {
  id: 'stedsadverb-statisk-dynamisk',
  titleEn: 'Static vs. dynamic location adverbs',
  titleNb: 'Statiske og dynamiske stedsadverb',
  explanationEn:
    'Several location adverbs have two forms: a static one for being at a place, and a dynamic one ' +
    'for moving toward it: hjemme/hjem, inne/inn, ute/ut, oppe/opp, nede/ned, borte/bort, framme/' +
    'fram, der/dit, her/hit. "Jeg er hjemme" (static — I am at home) vs. "Jeg skal hjem" (dynamic — ' +
    'I\'m heading home); "Er du ute?" vs. "Jeg skal gå ut." The choice depends on whether the verb ' +
    'describes a location/state or a movement toward that location.',
  explanationNb:
    'Flere stedsadverb har to former: en statisk for å være et sted, og en dynamisk for å bevege ' +
    'seg mot det: hjemme/hjem, inne/inn, ute/ut, oppe/opp, nede/ned, borte/bort, framme/fram, der/' +
    'dit, her/hit. "Jeg er hjemme" (statisk) mot "Jeg skal hjem" (dynamisk); "Er du ute?" mot "Jeg ' +
    'skal gå ut." Valget avhenger av om verbet beskriver et sted/en tilstand eller en bevegelse mot ' +
    'stedet.'
},

'man-en-upersonlig-pronomen': {
  id: 'man-en-upersonlig-pronomen',
  titleEn: 'Impersonal pronouns «man» and «en»',
  titleNb: 'Upersonlige pronomen «man» og «en»',
  explanationEn:
    'To speak about people in general, Norwegian uses «man» (subject position only) or «en» ' +
    '(subject or object position): "Man skal ikke tro alt man leser." "En kan ikke stole på alt en ' +
    'finner på nett" (en as subject), "Sola gir en ny energi" (en as object). Colloquial «du» or ' +
    '«folk» can be used the same way in informal register.',
  explanationNb:
    'For å snakke om mennesker generelt bruker norsk «man» (bare subjektsposisjon) eller «en» ' +
    '(subjekts- eller objektsposisjon): "Man skal ikke tro alt man leser." "En kan ikke stole på alt ' +
    'en finner på nett" (en som subjekt), "Sola gir en ny energi" (en som objekt). Muntlig «du» ' +
    'eller «folk» kan brukes på samme måte i uformell stil.'
}
```

---

## Content plan (`src/lib/data/grammar.json`)

IDs: `gq-{short-topic}-00X`, fresh numbering for all 13 new topics, continuing existing numbering
for the 3 reused touches (`partisipp-former` next after `gq-partform-012`; `ordfamilie-avledning`
next after `gq-avled-068`; `partikkelverb-los-fast` next after `gq-partikkel-012`). Type mix per
topic, matching what the point actually tests: `fill`/`transform` for the construction-formation
topics (`preteritum-perfektum-og-futurum`, `hypotetiske-betingelsessetninger`, `det-formelt-
subjekt`), `order`/`transform` for `det-er-var-som-utbryting` (fronting requires reordering),
`minimal-pair` well suited to the paired-choice topics (`modale-adverb`, `stedsadverb-statisk-
dynamisk`, `spesial-kvantorer`, `hoflig-preteritum`), `fill` for the connector-toolkit topics
(`arsak-og-folge-uttrykk`, `kontrast-uttrykk`). Same B2 sentence register as round 1 — longer,
more abstract/academic subject matter, grounded in real `vocab-b2.json`/`uttrykk-b2.json`
headwords.

**Language, no exceptions:** `prompt`, `hint`, `explanation`, and every `options`/`optionA`/
`optionB` string are written in Norwegian only, same as every other B2/C topic already converted
under `grammar-with-only-norsk.md`. No English scaffolding anywhere in `grammar.json` for these 16
topic-touches.

---

## Vocab verification script

Reuse `scripts/check-b2-grammar-vocab.mjs` unchanged (same lemma-matching logic, same
vocab-b2/fallback-pool setup from round 1). Scope each run to the 16 topic-touches in this plan.
Also rerun `scripts/check-grammar-norwegian.mjs` on the same scope per `grammar-with-only-norsk.md`
— every new batch should pass both scripts before merging, exactly as in round 1.

---

## Plus gating

Unchanged from round 1: B2 has zero free grammar content by existing `FREE_GRAMMAR_TOPICS` policy
(`access.ts`/`config.ts`) — every B2 question is Plus-gated by CEFR level alone, regardless of
topic. **No `config.ts` changes needed.** Do not add any of the 13 new topics, or B2-level entries
for the 3 reused topics, to `FREE_GRAMMAR_TOPICS`.

---

## Implementation phases

Add "✅ Done" to an item when an item is implemented.

### Phase 1 — Rules + types ✅ Done

1. Add 13 new topics to `GrammarTopic` in `src/lib/types.ts`. ✅ Done (12 topics per the resolved
   merge of `det-er-var-som-utbryting` into `det-formelt-subjekt`; `sammensatte-substantiv` renamed
   to `sammensatte-substantiv-b2` to avoid the Nivå C ID collision.)
2. Add 13 new `GrammarRule` entries to `src/lib/grammar/rules.ts` (drafted above). ✅ Done (12
   entries; verified no duplicate keys, brace-balanced.)
3. Apply the 2 rule-text additions listed above (`partisipp-former`, `ordfamilie-avledning`). ✅ Done
4. Vocab gap audit against `vocab-b2.json`/`uttrykk-b2.json` for headwords likely needed by the new
   topics before writing content (e.g. permisjonsordning, forskningsartikkel, oljefunn, valgkamp,
   statsminister-adjacent words already covered in round 1 — spot-check rather than assume). ✅ Done
   — component vocab (stilling, regel, stemme, forskning, politikk, valg, artikkel, permisjon,
   statsminister) confirmed present in vocab-b1/b2.json; only "olje" missing (minor — Phase 2 can
   pick a different example compound instead of oljefunn).

### Phase 2 — Content, roughly following source-chapter order

1. `modale-adverb` (HPB ch.1 / GiN3) — ~10-12 questions. ✅ Done (12 questions: nok/vel/jo/faktisk/
   egentlig/kanskje/sikkert/visst/neppe; mix of minimal-pair, fill, multiple-choice, order,
   transform; vocab-match + Norwegian-only checks passed locally.)
2. `sammensatte-substantiv` (HPB ch.4 / GiN3) — ~10-12 questions. ✅ Done (12 questions on
   `sammensatte-substantiv-b2`: -s-/-e-/no-linking compound formation + adjective+noun vs. fixed
   compound, e.g. brun ost vs. brunost; vocab-match + Norwegian-only checks passed locally.)
3. `preteritum-perfektum-og-futurum` (HPB ch.5 / GiN3) — ~10 questions. ✅ Done (12 questions:
   preteritum perfektum, preteritum futurum, and unrealized preteritum futurum perfektum; mix of
   fill, transform, order, minimal-pair, multiple-choice; vocab-match + Norwegian-only checks
   passed locally.)
4. `det-formelt-subjekt` (HPB ch.6 / GiN3) — ~10 questions. ✅ Done (12 questions covering both
   the dummy-subject construction, incl. s-passiv/bli-passiv, and the «det er/var ... som» cleft,
   since the two merged into one topic per the resolved open question; mix of transform, fill,
   order, multiple-choice, minimal-pair; vocab-match + Norwegian-only checks passed locally.)
5. `det-er-var-som-utbryting` (HPB ch.6 / GiN3) — ~10 questions. Merged into `det-formelt-subjekt`
   above (see resolved open question) — not built as a separate topic.
6. `det-referanse` (HPB ch.6) — ~8-10 questions. ✅ Done (12 questions: anaphoric «det» referring
   back to an adjective, a whole verbal phrase, or an at-clause, contrasted with «den»/«han»/«hun»
   agreeing with a specific noun's gender; mix of fill, transform, minimal-pair, multiple-choice;
   vocab-match + Norwegian-only checks passed locally.)
7. `partisipp-former` B2 addition (declension nuance) — ~6-8 questions.
8. `spesial-kvantorer` (HPB ch.8 / GiN3) — ~12 questions (covers 4 sub-patterns).
9. `arsak-og-folge-uttrykk` (HPB ch.10 / GiN3) — ~12 questions.
10. `kontrast-uttrykk` (HPB ch.10 / GiN3) — ~10 questions.
11. `ordfamilie-avledning` B2 addition (compound-verb-to-noun suffixes) — ~10 questions.
12. `hoflig-preteritum` (HPB ch.11 / GiN3) — ~8-10 questions.
13. `hypotetiske-betingelsessetninger` (HPB ch.11 / GiN3) — ~12 questions (richest topic; covers 3
    reality grades + 2 wish constructions).
14. `partikkelverb-los-fast` B2 addition (larger example set) — ~8-10 questions.
15. `stedsadverb-statisk-dynamisk` (GiN3) — ~10 questions.
16. `man-en-upersonlig-pronomen` (GiN3) — ~8 questions.

For each: write content → run `check-b2-grammar-vocab.mjs <topic>` → run
`check-grammar-norwegian.mjs <topic>` → fix any flags → mark done.

### Phase 3 — Vocab verification (full-repo pass)

Run both scripts with no topic filter to confirm the whole B2 set (round 1 + round 2) is clean, the
same closing step as round 1's Phase 3.

### Phase 4 — Gating + wiring

1. Confirm `FREE_GRAMMAR_TOPICS`/`isFreeGrammarTopic` still gates all of B2 correctly with zero
   `config.ts` edits (should be automatic, per the Plus gating section above).
2. Add the 13 new topics to the admin `TOPICS` constant (`src/routes/admin/grammar/+page.svelte`).
3. Confirm `/grammar` (`+page.ts`) picks up the new topics automatically via
   `groupTopicLevelsByAccess`/`topicLevels` deriving from `grammar.json` — no route changes
   expected, but verify after Phase 2 content lands.

---

## Testing

- No new grading logic needed — same existing type-agnostic grading as every prior plan.
- Extend/confirm `src/lib/grammar/grammar-data.test.ts`'s topic-resolves-to-`GRAMMAR_RULES` check
  picks up the 13 new topics automatically once Phase 1 lands (it iterates all distinct `topic`
  values in `grammar.json`, so this should need no test-file changes — just confirm it still
  passes).

---

## Open questions for review before Phase 2 starts

- **RESOLVED — `det-formelt-subjekt` / `det-er-var-som-utbryting` / `det-referanse`:** 2 topics,
  not 3. `det-er-var-som-utbryting` merges into `det-formelt-subjekt` — both are the same "det +
  verb + logical-subject-later" word-order skill, cleft is just the variant with an obligatory
  `som`. `det-referanse` stays separate — anaphoric reference cutting across gender agreement is a
  genuinely different skill. Update Phase 1/2 above accordingly: 12 new topics (not 13), and the
  `det-formelt-subjekt` rule draft/content should cover both the dummy-subject and cleft
  constructions as one topic.
- **RESOLVED — `arsak-og-folge-uttrykk`/`kontrast-uttrykk` vs. extending the existing
  `derfor-fordi`/`motsetning-selv-om-likevel` reused topics directly:** keep them as separate new
  topics rather than stuffing a much wider connector set into the existing narrow two-way-contrast
  topics, for the same reason round 1's `subjunksjon-oversikt` was kept separate from the B1
  pair-topics. No change needed to the plan above.
- **RESOLVED — GiN3's "Kommaregler" section:** real, testable content the current question-type
  schema doesn't cleanly support — not built in this plan. Full implementation plan (schema
  change, grading changes, new `PunctuationQuestion.svelte`, content plan) now lives in
  `ai-docs/implementation/punctuation.md`, to be picked up separately from this doc.
