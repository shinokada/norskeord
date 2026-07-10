# Cross-Type Duplicates Report (vocab ↔ uttrykk)

Generated: 2026-07-10T09:45:35.304Z

Compares every vocab-xx.json lemma against every uttrykk-xx.json lemma,
across all levels — the check no existing dedup script performs.

## Summary

| Match type                                        | Count   | Likely action                                                                                           |
| ------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------- |
| Exact lemma match                                 | 0       | Same concept exists in both files — decide which one to keep, per the vocab-vs-uttrykk decision rule    |
| Prefix match (uttrykk built around a vocab lemma) | 544     | Usually fine (uttrykk entry is a longer formula containing the vocab word) — review for near-duplicates |
| **Total flagged**                                 | **544** |                                                                                                         |

---

## Exact Lemma Matches

These are the highest-confidence duplicates — the same lemma appears as
both a standalone vocab entry and a standalone uttrykk entry. For each,
apply the decision rule in `data-rules/vocab-and-uttrykk.md`: does it
function as a lexical item (→ keep vocab, remove uttrykk) or a fixed
chunk (→ keep uttrykk, remove vocab)?

_None_

---

## Prefix Matches (lower confidence — review before acting)

| Vocab ID                             | Vocab lemma     | Vocab part   | Uttrykk ID    | Uttrykk norsk                                              |
| ------------------------------------ | --------------- | ------------ | ------------- | ---------------------------------------------------------- |
| v-a1-greetings-003 (a1)              | takk            | interjection | u-a2-024 (a2) | Takk for i dag.                                            |
| v-a1-greetings-003 (a1)              | takk            | interjection | u-a2-025 (a2) | Takk for sist.                                             |
| v-a1-greetings-003 (a1)              | takk            | interjection | u-a2-026 (a2) | Takk for maten.                                            |
| v-a1-greetings-003 (a1)              | takk            | interjection | u-a2-047 (a2) | Takk for hjelpen.                                          |
| v-a1-greetings-003 (a1)              | takk            | interjection | u-a2-283 (a2) | takk for det                                               |
| v-a1-greetings-008 (a1)              | velkommen       | interjection | u-a1-067 (a1) | Velkommen tilbake. Takk for det.                           |
| v-a1-greetings-008 (a1)              | velkommen       | interjection | u-a2-010 (a2) | Velkommen. Takk skal du ha.                                |
| v-a1-numbers-003 (a1)                | tre             | numeral      | u-b1-218 (b1) | tre stykker                                                |
| v-a1-numbers-003 (a1)                | tre             | numeral      | u-b2-286 (b2) | tre i kraft                                                |
| v-a1-numbers-025 (a1)                | tusen           | numeral      | u-a1-065 (a1) | Tusen takk for hjelpen. Bare hyggelig.                     |
| v-a1-numbers-025 (a1)                | tusen           | numeral      | u-a1-122 (a1) | tusen takk                                                 |
| v-a1-home-005 (a1)                   | stue            | noun         | u-b2-254 (b2) | stue seg sammen                                            |
| v-a1-classroom-020 (a1)              | spørsmål        | noun         | u-b1-322 (b1) | spørsmål og svar                                           |
| v-a1-adjectives-004 (a1)             | gammel          | adjective    | u-c-036 (c)   | Gammel vane er vond å vende.                               |
| v-a1-adjectives-005 (a1)             | god             | adjective    | u-a1-056 (a1) | God morgen!                                                |
| v-a1-adjectives-005 (a1)             | god             | adjective    | u-a1-102 (a1) | god morgen                                                 |
| v-a1-adjectives-005 (a1)             | god             | adjective    | u-a1-103 (a1) | god helg                                                   |
| v-a1-adjectives-005 (a1)             | god             | adjective    | u-a1-104 (a1) | god kveld                                                  |
| v-a1-adjectives-005 (a1)             | god             | adjective    | u-a1-105 (a1) | god natt                                                   |
| v-a1-adjectives-005 (a1)             | god             | adjective    | u-a2-138 (a2) | god tur                                                    |
| v-a1-adjectives-005 (a1)             | god             | adjective    | u-a2-191 (a2) | god mat                                                    |
| v-a1-adjectives-005 (a1)             | god             | adjective    | u-a2-195 (a2) | God morgen.                                                |
| v-a1-adjectives-005 (a1)             | god             | adjective    | u-a2-243 (a2) | god plass                                                  |
| v-a1-adjectives-005 (a1)             | god             | adjective    | u-a2-267 (a2) | god service                                                |
| v-a1-adjectives-005 (a1)             | god             | adjective    | u-b1-103 (b1) | god helse                                                  |
| v-a1-adjectives-006 (a1)             | dårlig          | adjective    | u-a2-165 (a2) | dårlig humor                                               |
| v-a1-adjectives-006 (a1)             | dårlig          | adjective    | u-a2-166 (a2) | dårlig tid                                                 |
| v-a1-adjectives-006 (a1)             | dårlig          | adjective    | u-b1-029 (b1) | dårlig stemning                                            |
| v-a1-adjectives-014 (a1)             | høy             | adjective    | u-b2-124 (b2) | høy status                                                 |
| v-a1-adjectives-016 (a1)             | kort            | adjective    | u-b2-793 (b2) | kort sagt                                                  |
| v-a1-adjectives-018 (a1)             | lett            | adjective    | u-b2-685 (b2) | lett tilgjengelig                                          |
| v-a1-verbs-001 (a1)                  | være            | verb         | u-b1-247 (b1) | være borte                                                 |
| v-a1-verbs-001 (a1)                  | være            | verb         | u-b1-248 (b1) | være enige om                                              |
| v-a1-verbs-001 (a1)                  | være            | verb         | u-b1-249 (b1) | være fleksibel                                             |
| v-a1-verbs-001 (a1)                  | være            | verb         | u-b1-250 (b1) | være forberedt                                             |
| v-a1-verbs-001 (a1)                  | være            | verb         | u-b1-251 (b1) | være lei                                                   |
| v-a1-verbs-001 (a1)                  | være            | verb         | u-b1-252 (b1) | være motivert                                              |
| v-a1-verbs-001 (a1)                  | være            | verb         | u-b1-253 (b1) | være opptatt av                                            |
| v-a1-verbs-001 (a1)                  | være            | verb         | u-b1-254 (b1) | være politisk aktiv                                        |
| v-a1-verbs-001 (a1)                  | være            | verb         | u-b1-255 (b1) | være prinsippfast                                          |
| v-a1-verbs-001 (a1)                  | være            | verb         | u-b1-256 (b1) | være på utkikk etter                                       |
| v-a1-verbs-001 (a1)                  | være            | verb         | u-b1-257 (b1) | være redd for                                              |
| v-a1-verbs-001 (a1)                  | være            | verb         | u-b1-258 (b1) | være skilt                                                 |
| v-a1-verbs-001 (a1)                  | være            | verb         | u-b1-259 (b1) | være sta                                                   |
| v-a1-verbs-001 (a1)                  | være            | verb         | u-b1-260 (b1) | være stresset                                              |
| v-a1-verbs-001 (a1)                  | være            | verb         | u-b1-261 (b1) | være takknemlig                                            |
| v-a1-verbs-001 (a1)                  | være            | verb         | u-b1-262 (b1) | være uenig                                                 |
| v-a1-verbs-001 (a1)                  | være            | verb         | u-b2-302 (b2) | være bevisst på                                            |
| v-a1-verbs-001 (a1)                  | være            | verb         | u-b2-303 (b2) | være forbeholdt                                            |
| v-a1-verbs-001 (a1)                  | være            | verb         | u-b2-304 (b2) | være forgjeves                                             |
| v-a1-verbs-001 (a1)                  | være            | verb         | u-b2-305 (b2) | være i fare for                                            |
| v-a1-verbs-001 (a1)                  | være            | verb         | u-b2-306 (b2) | være innstilt på                                           |
| v-a1-verbs-001 (a1)                  | være            | verb         | u-b2-307 (b2) | være klar over                                             |
| v-a1-verbs-001 (a1)                  | være            | verb         | u-b2-308 (b2) | være nedfelt                                               |
| v-a1-verbs-001 (a1)                  | være            | verb         | u-b2-309 (b2) | være nødt til                                              |
| v-a1-verbs-001 (a1)                  | være            | verb         | u-b2-310 (b2) | være oppkalt etter                                         |
| v-a1-verbs-001 (a1)                  | være            | verb         | u-b2-311 (b2) | være opplyst om                                            |
| v-a1-verbs-001 (a1)                  | være            | verb         | u-b2-312 (b2) | være preget av                                             |
| v-a1-verbs-001 (a1)                  | være            | verb         | u-b2-313 (b2) | være på hils med                                           |
| v-a1-verbs-001 (a1)                  | være            | verb         | u-b2-314 (b2) | være rettet mot                                            |
| v-a1-verbs-001 (a1)                  | være            | verb         | u-b2-315 (b2) | være rustet                                                |
| v-a1-verbs-001 (a1)                  | være            | verb         | u-b2-316 (b2) | være skrudd sammen                                         |
| v-a1-verbs-001 (a1)                  | være            | verb         | u-b2-317 (b2) | være takknemlig for                                        |
| v-a1-verbs-001 (a1)                  | være            | verb         | u-b2-318 (b2) | være tilfelle                                              |
| v-a1-verbs-001 (a1)                  | være            | verb         | u-b2-319 (b2) | være tilfreds med                                          |
| v-a1-verbs-001 (a1)                  | være            | verb         | u-b2-320 (b2) | være utsatt                                                |
| v-a1-verbs-001 (a1)                  | være            | verb         | u-b2-559 (b2) | være i faresonen                                           |
| v-a1-verbs-001 (a1)                  | være            | verb         | u-b2-563 (b2) | være fastsatt av                                           |
| v-a1-verbs-001 (a1)                  | være            | verb         | u-b2-564 (b2) | være i stand til                                           |
| v-a1-verbs-001 (a1)                  | være            | verb         | u-b2-572 (b2) | være i ferd med                                            |
| v-a1-verbs-001 (a1)                  | være            | verb         | u-b2-580 (b2) | være likestilt                                             |
| v-a1-verbs-001 (a1)                  | være            | verb         | u-b2-581 (b2) | være avhengig av                                           |
| v-a1-verbs-001 (a1)                  | være            | verb         | u-b2-582 (b2) | være dannet                                                |
| v-a1-verbs-001 (a1)                  | være            | verb         | u-b2-583 (b2) | være på flukt                                              |
| v-a1-verbs-001 (a1)                  | være            | verb         | u-b2-584 (b2) | være på flyttefot                                          |
| v-a1-verbs-001 (a1)                  | være            | verb         | u-b2-587 (b2) | være tvunget                                               |
| v-a1-verbs-001 (a1)                  | være            | verb         | u-b2-588 (b2) | være oppvokst                                              |
| v-a1-verbs-001 (a1)                  | være            | verb         | u-b2-591 (b2) | være i tvil om                                             |
| v-a1-verbs-001 (a1)                  | være            | verb         | u-b2-592 (b2) | være stolt over                                            |
| v-a1-verbs-001 (a1)                  | være            | verb         | u-b2-611 (b2) | være hjemmeværende                                         |
| v-a1-verbs-001 (a1)                  | være            | verb         | u-b2-643 (b2) | være misfornøyd med                                        |
| v-a1-verbs-001 (a1)                  | være            | verb         | u-b2-675 (b2) | være ensom                                                 |
| v-a1-verbs-001 (a1)                  | være            | verb         | u-b2-677 (b2) | være mislykket                                             |
| v-a1-verbs-001 (a1)                  | være            | verb         | u-b2-683 (b2) | være innom                                                 |
| v-a1-verbs-001 (a1)                  | være            | verb         | u-b2-706 (b2) | være på vakt                                               |
| v-a1-verbs-001 (a1)                  | være            | verb         | u-b2-720 (b2) | være ute                                                   |
| v-a1-verbs-001 (a1)                  | være            | verb         | u-b2-723 (b2) | være ærlig                                                 |
| v-a1-verbs-001 (a1)                  | være            | verb         | u-b2-739 (b2) | være godt i gang                                           |
| v-a1-verbs-001 (a1)                  | være            | verb         | u-b2-748 (b2) | være truet                                                 |
| v-a1-verbs-001 (a1)                  | være            | verb         | u-b2-755 (b2) | være med på                                                |
| v-a1-verbs-004 (a1)                  | spise           | verb         | u-b1-132 (b1) | spise om kapp                                              |
| v-a1-verbs-004 (a1)                  | spise           | verb         | u-b1-208 (b1) | spise om kapp                                              |
| v-a1-verbs-006 (a1)                  | sove            | verb         | u-a2-149 (a2) | sove godt                                                  |
| v-a1-verbs-007 (a1)                  | snakke          | verb         | u-b2-240 (b2) | snakke ned nesen på                                        |
| v-a1-verbs-009 (a1)                  | høre            | verb         | u-b1-115 (b1) | høre hjemme                                                |
| v-a1-verbs-010 (a1)                  | komme           | verb         | u-a2-089 (a2) | komme an på                                                |
| v-a1-verbs-010 (a1)                  | komme           | verb         | u-b1-139 (b1) | komme i form                                               |
| v-a1-verbs-010 (a1)                  | komme           | verb         | u-b1-140 (b1) | komme i gang                                               |
| v-a1-verbs-010 (a1)                  | komme           | verb         | u-b1-141 (b1) | komme overens                                              |
| v-a1-verbs-010 (a1)                  | komme           | verb         | u-b1-142 (b1) | komme til bunns i                                          |
| v-a1-verbs-010 (a1)                  | komme           | verb         | u-b2-163 (b2) | komme i skade for                                          |
| v-a1-verbs-010 (a1)                  | komme           | verb         | u-b2-164 (b2) | komme noen til gode                                        |
| v-a1-verbs-010 (a1)                  | komme           | verb         | u-b2-165 (b2) | komme til orde                                             |
| v-a1-verbs-010 (a1)                  | komme           | verb         | u-b2-166 (b2) | komme til uttrykk                                          |
| v-a1-verbs-010 (a1)                  | komme           | verb         | u-b2-729 (b2) | komme til skade                                            |
| v-a1-verbs-013 (a1)                  | jobbe           | verb         | u-b2-156 (b2) | jobbe seg opp fra gulvet                                   |
| v-a1-verbs-013 (a1)                  | jobbe           | verb         | u-b2-605 (b2) | jobbe på seg sykdom                                        |
| v-a1-verbs-015 (a1)                  | vil             | verb         | u-a1-057 (a1) | Vil du ha mer mat? Neitakk, jeg er mett.                   |
| v-a1-verbs-015 (a1)                  | vil             | verb         | u-a1-066 (a1) | Vil du ha pose?,Ja takk. Nei takk.                         |
| v-a1-verbs-016 (a1)                  | kunne           | verb         | u-a2-108 (a2) | kunne hende                                                |
| v-a1-pronouns-and-questions-001 (a1) | jeg             | pronoun      | u-a1-052 (a1) | Jeg er så trøtt. Jeg vil sove.                             |
| v-a1-pronouns-and-questions-001 (a1) | jeg             | pronoun      | u-a1-053 (a1) | Jeg er sulten. Jeg vil ha mat.                             |
| v-a1-pronouns-and-questions-001 (a1) | jeg             | pronoun      | u-a1-054 (a1) | Jeg er tørst. Jeg vil ha melk.                             |
| v-a1-pronouns-and-questions-001 (a1) | jeg             | pronoun      | u-a1-058 (a1) | Jeg har lyst på kaffe. Den er snart ferdig.                |
| v-a1-pronouns-and-questions-001 (a1) | jeg             | pronoun      | u-a1-110 (a1) | jeg har det bra                                            |
| v-a1-pronouns-and-questions-001 (a1) | jeg             | pronoun      | u-a1-115 (a1) | Jeg kommer fra ...                                         |
| v-a1-pronouns-and-questions-001 (a1) | jeg             | pronoun      | u-a1-123 (a1) | Jeg heter ...                                              |
| v-a1-pronouns-and-questions-001 (a1) | jeg             | pronoun      | u-a1-125 (a1) | Jeg forstår ikke                                           |
| v-a1-pronouns-and-questions-001 (a1) | jeg             | pronoun      | u-a2-188 (a2) | Jeg vil gjerne ...                                         |
| v-a1-pronouns-and-questions-001 (a1) | jeg             | pronoun      | u-b2-155 (b2) | Jeg skal vedde på at                                       |
| v-a1-pronouns-and-questions-001 (a1) | jeg             | pronoun      | u-b2-621 (b2) | Jeg kan ikke tenke meg å ...                               |
| v-a1-pronouns-and-questions-008 (a1) | det             | pronoun      | u-a2-023 (a2) | Det kan du si.                                             |
| v-a1-pronouns-and-questions-008 (a1) | det             | pronoun      | u-a2-099 (a2) | det er bare å                                              |
| v-a1-pronouns-and-questions-008 (a1) | det             | pronoun      | u-a2-142 (a2) | det regner                                                 |
| v-a1-pronouns-and-questions-008 (a1) | det             | pronoun      | u-a2-143 (a2) | det snør                                                   |
| v-a1-pronouns-and-questions-008 (a1) | det             | pronoun      | u-a2-144 (a2) | det er sol                                                 |
| v-a1-pronouns-and-questions-008 (a1) | det             | pronoun      | u-a2-182 (a2) | Det er rart for meg                                        |
| v-a1-pronouns-and-questions-008 (a1) | det             | pronoun      | u-a2-198 (a2) | Det går fint.                                              |
| v-a1-pronouns-and-questions-008 (a1) | det             | pronoun      | u-b1-022 (b1) | Det gikk opp for meg                                       |
| v-a1-pronouns-and-questions-008 (a1) | det             | pronoun      | u-b1-023 (b1) | det har mye å si                                           |
| v-a1-pronouns-and-questions-008 (a1) | det             | pronoun      | u-b1-024 (b1) | Det nytter ikke                                            |
| v-a1-pronouns-and-questions-008 (a1) | det             | pronoun      | u-b1-113 (b1) | det holdt ikke                                             |
| v-a1-pronouns-and-questions-008 (a1) | det             | pronoun      | u-b1-213 (b1) | Det stemmer                                                |
| v-a1-pronouns-and-questions-008 (a1) | det             | pronoun      | u-b2-030 (b2) | Det er delte meninger om                                   |
| v-a1-pronouns-and-questions-008 (a1) | det             | pronoun      | u-b2-031 (b2) | Det er en balansegang                                      |
| v-a1-pronouns-and-questions-008 (a1) | det             | pronoun      | u-b2-032 (b2) | Det er en tankevekker                                      |
| v-a1-pronouns-and-questions-008 (a1) | det             | pronoun      | u-b2-033 (b2) | Det er god grunn til å                                     |
| v-a1-pronouns-and-questions-008 (a1) | det             | pronoun      | u-b2-034 (b2) | Det er ingen tvil om                                       |
| v-a1-pronouns-and-questions-008 (a1) | det             | pronoun      | u-b2-035 (b2) | Det er lov å drømme                                        |
| v-a1-pronouns-and-questions-008 (a1) | det             | pronoun      | u-b2-036 (b2) | det er på høy tid                                          |
| v-a1-pronouns-and-questions-008 (a1) | det             | pronoun      | u-b2-037 (b2) | Det er utenkelig                                           |
| v-a1-pronouns-and-questions-008 (a1) | det             | pronoun      | u-b2-038 (b2) | Det hadde vært noe!                                        |
| v-a1-pronouns-and-questions-008 (a1) | det             | pronoun      | u-b2-039 (b2) | Det hadde vært noe, det                                    |
| v-a1-pronouns-and-questions-008 (a1) | det             | pronoun      | u-b2-040 (b2) | det haster                                                 |
| v-a1-pronouns-and-questions-008 (a1) | det             | pronoun      | u-b2-041 (b2) | Det innebærer at                                           |
| v-a1-pronouns-and-questions-008 (a1) | det             | pronoun      | u-b2-042 (b2) | det kan hende                                              |
| v-a1-pronouns-and-questions-008 (a1) | det             | pronoun      | u-b2-043 (b2) | Det provoserer meg at                                      |
| v-a1-pronouns-and-questions-008 (a1) | det             | pronoun      | u-b2-044 (b2) | det skal ikke så mye til                                   |
| v-a1-pronouns-and-questions-008 (a1) | det             | pronoun      | u-b2-045 (b2) | det spørs                                                  |
| v-a1-pronouns-and-questions-008 (a1) | det             | pronoun      | u-b2-046 (b2) | det spørs hvor dypt det stikker                            |
| v-a1-pronouns-and-questions-008 (a1) | det             | pronoun      | u-b2-047 (b2) | det stikk motsatte                                         |
| v-a1-pronouns-and-questions-008 (a1) | det             | pronoun      | u-b2-048 (b2) | Det står respekt av                                        |
| v-a1-pronouns-and-questions-008 (a1) | det             | pronoun      | u-b2-049 (b2) | Det viste seg at                                           |
| v-a1-pronouns-and-questions-008 (a1) | det             | pronoun      | u-b2-534 (b2) | det er ikke alltid gull det som glimrer                    |
| v-a1-pronouns-and-questions-008 (a1) | det             | pronoun      | u-b2-615 (b2) | det gjelder                                                |
| v-a1-pronouns-and-questions-008 (a1) | det             | pronoun      | u-b2-653 (b2) | Det er din tur                                             |
| v-a1-pronouns-and-questions-008 (a1) | det             | pronoun      | u-b2-712 (b2) | det er synd at                                             |
| v-a1-pronouns-and-questions-008 (a1) | det             | pronoun      | u-b2-734 (b2) | Det er flaut                                               |
| v-a1-pronouns-and-questions-008 (a1) | det             | pronoun      | u-b2-741 (b2) | Det kan være                                               |
| v-a1-pronouns-and-questions-008 (a1) | det             | pronoun      | u-b2-758 (b2) | Det holder                                                 |
| v-a1-pronouns-and-questions-008 (a1) | det             | pronoun      | u-b2-767 (b2) | det er opp til x                                           |
| v-a1-pronouns-and-questions-008 (a1) | det             | pronoun      | u-b2-774 (b2) | det øvrige samfunnet                                       |
| v-a1-pronouns-and-questions-008 (a1) | det             | pronoun      | u-b2-777 (b2) | det vil si                                                 |
| v-a1-pronouns-and-questions-008 (a1) | det             | pronoun      | u-c-024 (c)   | Det er ingen skam å snu.                                   |
| v-a1-pronouns-and-questions-008 (a1) | det             | pronoun      | u-c-040 (c)   | Det er ikke gull alt som glimrer.                          |
| v-a1-pronouns-and-questions-008 (a1) | det             | pronoun      | u-c-042 (c)   | det fremgår av                                             |
| v-a1-pronouns-and-questions-008 (a1) | det             | pronoun      | u-c-057 (c)   | det er få mennesker forunt                                 |
| v-a1-pronouns-and-questions-008 (a1) | det             | pronoun      | u-c-107 (c)   | det går ham på nervene                                     |
| v-a1-pronouns-and-questions-008 (a1) | det             | pronoun      | u-c-186 (c)   | det går i ett                                              |
| v-a1-pronouns-and-questions-009 (a1) | hva             | pronoun      | u-a1-005 (a1) | Hva heter det på norsk? Det heter arabisk.                 |
| v-a1-pronouns-and-questions-009 (a1) | hva             | pronoun      | u-a1-006 (a1) | Hva heter du? Jeg heter Peter.                             |
| v-a1-pronouns-and-questions-009 (a1) | hva             | pronoun      | u-a1-012 (a1) | Hva betyr det?                                             |
| v-a1-pronouns-and-questions-009 (a1) | hva             | pronoun      | u-a1-014 (a1) | Hva gjør du? Jeg går på norskkurs.                         |
| v-a1-pronouns-and-questions-009 (a1) | hva             | pronoun      | u-a1-064 (a1) | Hva koster det? 99,90.                                     |
| v-a1-pronouns-and-questions-009 (a1) | hva             | pronoun      | u-a1-078 (a1) | Hva skal de feire? De skal feire 17. mai.                  |
| v-a1-pronouns-and-questions-009 (a1) | hva             | pronoun      | u-a1-111 (a1) | Hva heter du?                                              |
| v-a1-pronouns-and-questions-009 (a1) | hva             | pronoun      | u-a2-032 (a2) | Hva slags                                                  |
| v-a1-pronouns-and-questions-009 (a1) | hva             | pronoun      | u-b2-701 (b2) | Hva er i veien?                                            |
| v-a1-pronouns-and-questions-009 (a1) | hva             | pronoun      | u-b2-791 (b2) | hva angår                                                  |
| v-a1-pronouns-and-questions-010 (a1) | hvor            | adverb       | u-a1-001 (a1) | Hvor kommer du fra? Jeg kommer fra Bergen.                 |
| v-a1-pronouns-and-questions-010 (a1) | hvor            | adverb       | u-a1-002 (a1) | Hvor bor du? Jeg bor i Norge.                              |
| v-a1-pronouns-and-questions-010 (a1) | hvor            | adverb       | u-a1-062 (a1) | Hvor finner jeg sitron? Gå rett fram, og så til høyre.     |
| v-a1-pronouns-and-questions-010 (a1) | hvor            | adverb       | u-a1-063 (a1) | Hvor finner jeg olivenolje?Ved siden av ketchup og sennep. |
| v-a1-pronouns-and-questions-010 (a1) | hvor            | adverb       | u-a1-074 (a1) | Hvor stopper bussen? På den andre siden av gata.           |
| v-a1-pronouns-and-questions-010 (a1) | hvor            | adverb       | u-a1-075 (a1) | Hvor ofte går den? Hvert kvarter.                          |
| v-a1-pronouns-and-questions-010 (a1) | hvor            | adverb       | u-a1-076 (a1) | Hvor langt er det til sentrum? Tre kilometer.              |
| v-a1-pronouns-and-questions-010 (a1) | hvor            | adverb       | u-a1-077 (a1) | Hvor lang tid tar det? Det tar sju minutter med buss.      |
| v-a1-pronouns-and-questions-010 (a1) | hvor            | adverb       | u-a1-080 (a1) | Hvor stor er boligen? Den er på 68 kvm.                    |
| v-a1-pronouns-and-questions-010 (a1) | hvor            | adverb       | u-a1-114 (a1) | Hvor er du fra?                                            |
| v-a1-pronouns-and-questions-010 (a1) | hvor            | adverb       | u-a2-061 (a2) | Hvor ligger leiligheten?                                   |
| v-a1-pronouns-and-questions-010 (a1) | hvor            | adverb       | u-a2-127 (a2) | Hvor er ...?                                               |
| v-a1-pronouns-and-questions-010 (a1) | hvor            | adverb       | u-a2-223 (a2) | hvor langt                                                 |
| v-a1-pronouns-and-questions-010 (a1) | hvor            | adverb       | u-a2-227 (a2) | hvor lenge                                                 |
| v-a1-pronouns-and-questions-011 (a1) | hvem            | pronoun      | u-a1-003 (a1) | Hvem kommer fra Hellas? Sasha kommer fra Hellas.           |
| v-a1-pronouns-and-questions-012 (a1) | når             | adverb       | u-b1-075 (b1) | når det gjelder                                            |
| v-a1-pronouns-and-questions-012 (a1) | når             | adverb       | u-b1-163 (b1) | når det gjelder                                            |
| v-a1-pronouns-and-questions-012 (a1) | når             | adverb       | u-b2-191 (b2) | når det kommer til stykket                                 |
| v-a1-pronouns-and-questions-012 (a1) | når             | adverb       | u-b2-684 (b2) | når som helst                                              |
| v-a1-pronouns-and-questions-013 (a1) | hvorfor         | adverb       | u-a1-069 (a1) | Hvorfor ikke?                                              |
| v-a1-pronouns-and-questions-014 (a1) | hvordan         | adverb       | u-a1-013 (a1) | Hvordan går det? Fint. / Ganske bra, takk. / Sånn passe.   |
| v-a1-pronouns-and-questions-014 (a1) | hvordan         | adverb       | u-a1-071 (a1) | Hvordan blir været i morgen? Det blir regn. Det blir sol.  |
| v-a1-pronouns-and-questions-014 (a1) | hvordan         | adverb       | u-a1-072 (a1) | Hvordan lukter det? Det lukter godt.                       |
| v-a1-pronouns-and-questions-014 (a1) | hvordan         | adverb       | u-a1-073 (a1) | Hvordan ser katten ut? Den er brun og veldig søt.          |
| v-a1-pronouns-and-questions-014 (a1) | hvordan         | adverb       | u-a1-109 (a1) | hvordan har du det?                                        |
| v-a1-pronouns-and-questions-014 (a1) | hvordan         | adverb       | u-a2-128 (a2) | Hvordan kommer jeg til ...?                                |
| v-a1-pronouns-and-questions-015 (a1) | min             | pronoun      | u-b1-160 (b1) | min tur                                                    |
| v-a1-pronouns-and-questions-021 (a1) | deg             | pronoun      | u-a2-266 (a2) | deg selv                                                   |
| v-a1-pronouns-and-questions-023 (a1) | den             | pronoun      | u-a1-084 (a1) | den første                                                 |
| v-a1-pronouns-and-questions-023 (a1) | den             | pronoun      | u-a2-062 (a2) | Den ligger på venstre side.                                |
| v-a1-pronouns-and-questions-023 (a1) | den             | pronoun      | u-a2-064 (a2) | Den står mellom døra og skapet.                            |
| v-a1-pronouns-and-questions-023 (a1) | den             | pronoun      | u-b2-028 (b2) | Den som lever, får se                                      |
| v-a1-pronouns-and-questions-023 (a1) | den             | pronoun      | u-c-017 (c)   | Den som graver en grop for andre, faller selv i den.       |
| v-a1-pronouns-and-questions-023 (a1) | den             | pronoun      | u-c-020 (c)   | Den tidlig står opp, får mye gjort.                        |
| v-a1-pronouns-and-questions-023 (a1) | den             | pronoun      | u-c-027 (c)   | Den som tier, samtykker.                                   |
| v-a1-pronouns-and-questions-023 (a1) | den             | pronoun      | u-c-032 (c)   | Den som lever skjult, lever godt.                          |
| v-a1-pronouns-and-questions-025 (a1) | ingen           | pronoun      | u-c-019 (c)   | Ingen røyk uten ild.                                       |
| v-a1-feelings-003 (a1)               | redd            | adjective    | u-b1-173 (b1) | redd for                                                   |
| v-a1-feelings-014 (a1)               | stolt           | adjective    | u-b2-252 (b2) | stolt av                                                   |
| v-a1-feelings-018 (a1)               | frisk           | adjective    | u-b2-079 (b2) | frisk og rask                                              |
| v-a1-feelings-019 (a1)               | smile           | verb         | u-b2-239 (b2) | smile fra øre til øre                                      |
| v-a1-weather-001 (a1)                | sol             | noun         | u-a1-127 (a1) | sol og skyer                                               |
| v-a1-weather-009 (a1)                | vær             | noun         | u-a1-019 (a1) | Vær så god! Takk skal du ha. / Tusen takk.                 |
| v-a1-weather-009 (a1)                | vær             | noun         | u-a1-108 (a1) | vær så snill                                               |
| v-a1-weather-009 (a1)                | vær             | noun         | u-a2-194 (a2) | Vær så god.                                                |
| v-a1-weather-009 (a1)                | vær             | noun         | u-a2-292 (a2) | vær så god                                                 |
| v-a1-transportation-014 (a1)         | kjøre           | verb         | u-b2-159 (b2) | kjøre noe på dunken                                        |
| v-a1-transportation-015 (a1)         | reise           | verb         | u-b1-175 (b1) | reise kollektivt                                           |
| v-a1-transportation-015 (a1)         | reise           | verb         | u-b2-217 (b2) | reise tiltale mot                                          |
| v-a1-actions-002 (a1)                | sitte           | verb         | u-b2-230 (b2) | sitte på gjerdet                                           |
| v-a1-actions-003 (a1)                | stå             | verb         | u-a2-091 (a2) | stå til                                                    |
| v-a1-actions-003 (a1)                | stå             | verb         | u-b1-219 (b1) | stå fram som                                               |
| v-a1-actions-003 (a1)                | stå             | verb         | u-b1-220 (b1) | stå på spill                                               |
| v-a1-actions-003 (a1)                | stå             | verb         | u-b2-255 (b2) | stå ansvarlig for                                          |
| v-a1-actions-003 (a1)                | stå             | verb         | u-b2-256 (b2) | stå for                                                    |
| v-a1-actions-003 (a1)                | stå             | verb         | u-b2-590 (b2) | stå i fare for                                             |
| v-a1-actions-003 (a1)                | stå             | verb         | u-b2-636 (b2) | stå for noe                                                |
| v-a1-actions-003 (a1)                | stå             | verb         | u-b2-765 (b2) | stå bak                                                    |
| v-a1-actions-004 (a1)                | ligge           | verb         | u-b1-153 (b1) | ligge godt an                                              |
| v-a1-actions-006 (a1)                | kaste           | verb         | u-b1-134 (b1) | kaste bort tid                                             |
| v-a1-actions-008 (a1)                | bære            | verb         | u-b2-026 (b2) | bære galt av sted                                          |
| v-a1-actions-015 (a1)                | finne           | verb         | u-a2-109 (a2) | finne sted                                                 |
| v-a1-actions-015 (a1)                | finne           | verb         | u-b1-045 (b1) | finne tonen                                                |
| v-a1-actions-015 (a1)                | finne           | verb         | u-b2-600 (b2) | finne seg til rette                                        |
| v-a1-actions-015 (a1)                | finne           | verb         | u-b2-620 (b2) | finne et levebrød                                          |
| v-a1-actions-015 (a1)                | finne           | verb         | u-b2-624 (b2) | finne seg godt til rette                                   |
| v-a1-actions-017 (a1)                | betale          | verb         | u-b2-008 (b2) | betale prisen                                              |
| v-a1-actions-019 (a1)                | legge           | verb         | u-b1-147 (b1) | legge merke til                                            |
| v-a1-actions-019 (a1)                | legge           | verb         | u-b2-172 (b2) | legge vekt på                                              |
| v-a1-actions-019 (a1)                | legge           | verb         | u-b2-654 (b2) | legge seg opp penger                                       |
| v-a1-actions-019 (a1)                | legge           | verb         | u-b2-672 (b2) | legge forholdene til rette                                 |
| v-a1-actions-019 (a1)                | legge           | verb         | u-b2-733 (b2) | legge til rette                                            |
| v-a1-actions-019 (a1)                | legge           | verb         | u-b2-738 (b2) | legge om                                                   |
| v-a1-actions-019 (a1)                | legge           | verb         | u-b2-753 (b2) | legge hindringer i veien                                   |
| v-a1-actions-019 (a1)                | legge           | verb         | u-b2-760 (b2) | legge på is                                                |
| v-a1-adjectives-025 (a1)             | annenhver       | adjective    | u-b1-002 (b1) | annenhver uke                                              |
| v-a1-actions-022 (a1)                | å sette seg     | verb         | u-b2-455 (b2) | å sette seg godt til rette                                 |
| v-a1-actions-022 (a1)                | å sette seg     | verb         | u-c-074 (c)   | å sette seg på huk                                         |
| v-a2-shopping-015 (a2)               | kort            | noun         | u-b2-793 (b2) | kort sagt                                                  |
| v-a2-shopping-017 (a2)               | handle          | verb         | u-b1-101 (b1) | handle om                                                  |
| v-a2-hobbies-002 (a2)                | spille          | verb         | u-b2-245 (b2) | spille på følelser                                         |
| v-a2-directions-001 (a2)             | snu             | verb         | u-b2-759 (b2) | snu opp ned                                                |
| v-a2-health-005 (a2)                 | vondt           | adjective    | u-a2-145 (a2) | vondt i hodet                                              |
| v-a2-health-005 (a2)                 | vondt           | adjective    | u-a2-146 (a2) | vondt i magen                                              |
| v-a2-health-010 (a2)                 | legge seg       | verb         | u-b2-654 (b2) | legge seg opp penger                                       |
| v-a2-health-011 (a2)                 | hvile           | verb         | u-b2-123 (b2) | hvile på laurbærene                                        |
| v-a2-health-014 (a2)                 | føle seg        | verb         | u-b2-569 (b2) | føle seg utenfor                                           |
| v-a2-descriptive-adjectives-009 (a2) | mange           | adjective    | u-c-021 (c)   | Mange bekker små gjør en stor å.                           |
| v-a2-descriptive-adjectives-011 (a2) | nok             | adjective    | u-b2-186 (b2) | nok en gang                                                |
| v-a2-nature-005 (a2)                 | tre             | noun         | u-b1-218 (b1) | tre stykker                                                |
| v-a2-nature-005 (a2)                 | tre             | noun         | u-b2-286 (b2) | tre i kraft                                                |
| v-a2-nature-020 (a2)                 | stille          | adjective    | u-b2-249 (b2) | stille høye krav                                           |
| v-a2-nature-020 (a2)                 | stille          | adjective    | u-b2-250 (b2) | stille til ansvar                                          |
| v-a2-nature-020 (a2)                 | stille          | adjective    | u-b2-251 (b2) | stille til rådighet                                        |
| v-a2-nature-020 (a2)                 | stille          | adjective    | u-b2-608 (b2) | stille kritiske spørsmål                                   |
| v-a2-nature-020 (a2)                 | stille          | adjective    | u-b2-638 (b2) | stille til valg                                            |
| v-a2-communication-002 (a2)          | sende           | verb         | u-a2-153 (a2) | sende en e-post                                            |
| v-a2-technology-012 (a2)             | slå av          | verb         | u-b2-610 (b2) | slå av en prat                                             |
| v-a2-descriptive-adjectives-015 (a2) | all             | pronoun      | u-b2-001 (b2) | All ære til                                                |
| v-a2-descriptive-adjectives-018 (a2) | blant           | preposition  | u-a1-051 (a1) | blant annet                                                |
| v-a2-descriptive-adjectives-019 (a2) | bli             | verb         | u-b1-009 (b1) | bli borte                                                  |
| v-a2-descriptive-adjectives-019 (a2) | bli             | verb         | u-b1-010 (b1) | bli mobbet                                                 |
| v-a2-descriptive-adjectives-019 (a2) | bli             | verb         | u-b1-011 (b1) | bli skuffet                                                |
| v-a2-descriptive-adjectives-019 (a2) | bli             | verb         | u-b1-012 (b1) | bli slutt                                                  |
| v-a2-descriptive-adjectives-019 (a2) | bli             | verb         | u-b1-013 (b1) | bli straffet                                               |
| v-a2-descriptive-adjectives-019 (a2) | bli             | verb         | u-b1-014 (b1) | bli uvenner                                                |
| v-a2-descriptive-adjectives-019 (a2) | bli             | verb         | u-b1-015 (b1) | bli vant til                                               |
| v-a2-descriptive-adjectives-019 (a2) | bli             | verb         | u-b1-136 (b1) | bli kjent med                                              |
| v-a2-descriptive-adjectives-019 (a2) | bli             | verb         | u-b2-009 (b2) | bli bevisst på                                             |
| v-a2-descriptive-adjectives-019 (a2) | bli             | verb         | u-b2-010 (b2) | bli degradert                                              |
| v-a2-descriptive-adjectives-019 (a2) | bli             | verb         | u-b2-011 (b2) | bli hyllet for                                             |
| v-a2-descriptive-adjectives-019 (a2) | bli             | verb         | u-b2-012 (b2) | bli omdøpt                                                 |
| v-a2-descriptive-adjectives-019 (a2) | bli             | verb         | u-b2-013 (b2) | bli oppfordret til                                         |
| v-a2-descriptive-adjectives-019 (a2) | bli             | verb         | u-b2-014 (b2) | bli oppmuntret                                             |
| v-a2-descriptive-adjectives-019 (a2) | bli             | verb         | u-b2-015 (b2) | bli oppmuntret til                                         |
| v-a2-descriptive-adjectives-019 (a2) | bli             | verb         | u-b2-016 (b2) | bli pågrepet                                               |
| v-a2-descriptive-adjectives-019 (a2) | bli             | verb         | u-b2-017 (b2) | bli rammet av                                              |
| v-a2-descriptive-adjectives-019 (a2) | bli             | verb         | u-b2-018 (b2) | bli satt på benken                                         |
| v-a2-descriptive-adjectives-019 (a2) | bli             | verb         | u-b2-019 (b2) | bli siktet for                                             |
| v-a2-descriptive-adjectives-019 (a2) | bli             | verb         | u-b2-020 (b2) | bli tatt på senga                                          |
| v-a2-descriptive-adjectives-019 (a2) | bli             | verb         | u-b2-021 (b2) | bli utsatt for                                             |
| v-a2-descriptive-adjectives-019 (a2) | bli             | verb         | u-b2-022 (b2) | bli utvist                                                 |
| v-a2-descriptive-adjectives-019 (a2) | bli             | verb         | u-b2-573 (b2) | bli kvitt                                                  |
| v-a2-descriptive-adjectives-019 (a2) | bli             | verb         | u-b2-575 (b2) | bli klar over                                              |
| v-a2-descriptive-adjectives-019 (a2) | bli             | verb         | u-b2-622 (b2) | bli lei av                                                 |
| v-a2-descriptive-adjectives-019 (a2) | bli             | verb         | u-b2-697 (b2) | bli lurt                                                   |
| v-a2-technology-017 (a2)             | bruke           | verb         | u-a2-157 (a2) | bruke penger                                               |
| v-a2-communication-029 (a2)          | dette           | pronoun      | u-a2-028 (a2) | Dette er ...                                               |
| v-a2-transport-009 (a2)              | dra             | verb         | u-b2-743 (b2) | dra det for langt                                          |
| v-a2-shopping-024 (a2)               | ekstra          | adverb       | u-a2-169 (a2) | ekstra flott                                               |
| v-a2-time-025 (a2)                   | etter           | preposition  | u-a2-273 (a2) | etter en stund                                             |
| v-a2-time-025 (a2)                   | etter           | preposition  | u-b1-040 (b1) | etter hvert                                                |
| v-a2-time-025 (a2)                   | etter           | preposition  | u-b1-317 (b1) | etter min mening                                           |
| v-a2-body-020 (a2)                   | falle           | verb         | u-b1-041 (b1) | falle en inn                                               |
| v-a2-body-020 (a2)                   | falle           | verb         | u-b2-649 (b2) | falle for                                                  |
| v-a2-health-034 (a2)                 | føle            | verb         | u-b2-569 (b2) | føle seg utenfor                                           |
| v-a2-directions-022 (a2)             | følge           | verb         | u-b2-087 (b2) | følge noens eksempel                                       |
| v-a2-communication-038 (a2)          | for             | preposition  | u-a1-085 (a1) | for – siden                                                |
| v-a2-communication-038 (a2)          | for             | preposition  | u-a1-096 (a1) | for å                                                      |
| v-a2-communication-038 (a2)          | for             | preposition  | u-a1-121 (a1) | for eksempel                                               |
| v-a2-communication-038 (a2)          | for             | preposition  | u-a2-002 (a2) | for varmt/kaldt                                            |
| v-a2-communication-038 (a2)          | for             | preposition  | u-a2-045 (a2) | For en service!                                            |
| v-a2-communication-038 (a2)          | for             | preposition  | u-a2-133 (a2) | for lenge siden                                            |
| v-a2-communication-038 (a2)          | for             | preposition  | u-a2-180 (a2) | for ... siden                                              |
| v-a2-communication-038 (a2)          | for             | preposition  | u-a2-181 (a2) | for stor                                                   |
| v-a2-communication-038 (a2)          | for             | preposition  | u-a2-183 (a2) | For en dag!                                                |
| v-a2-communication-038 (a2)          | for             | preposition  | u-b1-047 (b1) | For noe tull!                                              |
| v-a2-communication-038 (a2)          | for             | preposition  | u-b1-048 (b1) | for – skyld                                                |
| v-a2-communication-038 (a2)          | for             | preposition  | u-b1-195 (b1) | for – skyld                                                |
| v-a2-communication-038 (a2)          | for             | preposition  | u-b2-068 (b2) | for sin tid                                                |
| v-a2-communication-038 (a2)          | for             | preposition  | u-b2-069 (b2) | for øvrig                                                  |
| v-a2-communication-038 (a2)          | for             | preposition  | u-b2-640 (b2) | for tida                                                   |
| v-a2-communication-038 (a2)          | for             | preposition  | u-b2-666 (b2) | for min del                                                |
| v-a2-communication-038 (a2)          | for             | preposition  | u-c-079 (c)   | for lengst                                                 |
| v-a2-directions-023 (a2)             | føre            | verb         | u-b2-639 (b2) | føre politikk                                              |
| v-a2-time-029 (a2)                   | først           | adverb       | u-b1-067 (b1) | først og fremst                                            |
| v-a2-time-030 (a2)                   | gang            | noun         | u-b2-088 (b2) | gang etter gang                                            |
| v-a2-directions-026 (a2)             | fra             | preposition  | u-b1-054 (b1) | fra hånd til munn                                          |
| v-a2-directions-026 (a2)             | fra             | preposition  | u-c-141 (c)   | fra sans og samling                                        |
| v-a2-directions-026 (a2)             | fra             | preposition  | u-c-160 (c)   | fra høyere hold                                            |
| v-a2-descriptive-adjectives-031 (a2) | fri             | adjective    | u-b1-056 (b1) | fri flyt                                                   |
| v-a2-weather-013 (a2)                | fryse           | verb         | u-b1-057 (b1) | fryse i hjel                                               |
| v-a2-house-chores-027 (a2)           | gjøre           | verb         | u-b1-077 (b1) | gjøre avtaler                                              |
| v-a2-house-chores-027 (a2)           | gjøre           | verb         | u-b1-078 (b1) | gjøre sitt                                                 |
| v-a2-house-chores-027 (a2)           | gjøre           | verb         | u-b2-092 (b2) | gjøre narr av                                              |
| v-a2-house-chores-027 (a2)           | gjøre           | verb         | u-b2-650 (b2) | gjøre inntrykk på                                          |
| v-a2-house-chores-027 (a2)           | gjøre           | verb         | u-b2-788 (b2) | gjøre opp for seg                                          |
| v-a2-body-024 (a2)                   | holde           | verb         | u-a2-095 (a2) | holde øye med                                              |
| v-a2-body-024 (a2)                   | holde           | verb         | u-a2-097 (a2) | holde seg fast                                             |
| v-a2-body-024 (a2)                   | holde           | verb         | u-a2-151 (a2) | holde kontakten                                            |
| v-a2-body-024 (a2)                   | holde           | verb         | u-b1-106 (b1) | holde mål                                                  |
| v-a2-body-024 (a2)                   | holde           | verb         | u-b1-107 (b1) | holde seg i form                                           |
| v-a2-body-024 (a2)                   | holde           | verb         | u-b1-108 (b1) | holde seg oppdatert                                        |
| v-a2-body-024 (a2)                   | holde           | verb         | u-b1-110 (b1) | holde tale                                                 |
| v-a2-body-024 (a2)                   | holde           | verb         | u-b1-112 (b1) | holde ved like                                             |
| v-a2-body-024 (a2)                   | holde           | verb         | u-b2-121 (b2) | holde kjeft                                                |
| v-a2-body-024 (a2)                   | holde           | verb         | u-b2-670 (b2) | holde (holdt)                                              |
| v-a2-body-024 (a2)                   | holde           | verb         | u-b2-693 (b2) | holde orden                                                |
| v-a2-communication-042 (a2)          | ikke            | adverb       | u-a2-276 (a2) | ikke så mye                                                |
| v-a2-communication-042 (a2)          | ikke            | adverb       | u-b1-130 (b1) | ikke bare bare                                             |
| v-a2-communication-042 (a2)          | ikke            | adverb       | u-b2-149 (b2) | ikke noe videre                                            |
| v-a2-communication-042 (a2)          | ikke            | adverb       | u-b2-150 (b2) | ikke noe å hige etter                                      |
| v-a2-communication-042 (a2)          | ikke            | adverb       | u-b2-151 (b2) | ikke nødvendigvis                                          |
| v-a2-communication-042 (a2)          | ikke            | adverb       | u-b2-722 (b2) | ikke noe som helst                                         |
| v-a2-communication-042 (a2)          | ikke            | adverb       | u-b2-730 (b2) | ikke la vente på seg                                       |
| v-a2-communication-042 (a2)          | ikke            | adverb       | u-b2-792 (b2) | ikke desto mindre                                          |
| v-a2-communication-042 (a2)          | ikke            | adverb       | u-c-076 (c)   | ikke rikke seg av flekken                                  |
| v-a2-communication-042 (a2)          | ikke            | adverb       | u-c-170 (c)   | ikke før                                                   |
| v-a2-social-life-052 (a2)            | kjenne          | verb         | u-b2-158 (b2) | kjenne terrenget                                           |
| v-a2-time-035 (a2)                   | hver            | pronoun      | u-b1-114 (b1) | hver enkelt                                                |
| v-a2-descriptive-adjectives-040 (a2) | hyggelig        | adjective    | u-a1-010 (a1) | Hyggelig å treffe deg. I like måte.                        |
| v-a2-descriptive-adjectives-040 (a2) | hyggelig        | adjective    | u-a1-016 (a1) | Hyggelig å snakke med deg. I like måte.                    |
| v-a2-descriptive-adjectives-040 (a2) | hyggelig        | adjective    | u-a1-112 (a1) | hyggelig å møte deg                                        |
| v-a2-descriptive-adjectives-041 (a2) | klok            | adjective    | u-c-165 (c)   | klok av skade                                              |
| v-a2-cooking-033 (a2)                | lage            | verb         | u-b2-170 (b2) | lage styr                                                  |
| v-a2-directions-035 (a2)             | langt           | adverb       | u-a2-224 (a2) | langt borte                                                |
| v-a2-directions-035 (a2)             | langt           | adverb       | u-b2-171 (b2) | langt lavere                                               |
| v-a2-directions-035 (a2)             | langt           | adverb       | u-b2-742 (b2) | langt fra                                                  |
| v-a2-directions-035 (a2)             | langt           | adverb       | u-b2-747 (b2) | langt på vei                                               |
| v-a2-directions-035 (a2)             | langt           | adverb       | u-c-111 (c)   | langt inne i granskauen                                    |
| v-a2-descriptive-adjectives-046 (a2) | litt            | adverb       | u-a1-020 (a1) | Litt kake? Ja takk. / Nei takk.                            |
| v-a2-descriptive-adjectives-046 (a2) | litt            | adverb       | u-a1-035 (a1) | litt etter/før klokka tolv                                 |
| v-a2-descriptive-adjectives-046 (a2) | litt            | adverb       | u-b2-175 (b2) | litt av en                                                 |
| v-a2-descriptive-adjectives-046 (a2) | litt            | adverb       | u-b2-695 (b2) | litt etter litt                                            |
| v-a2-social-life-069 (a2)            | liv             | noun         | u-b2-623 (b2) | liv og røre                                                |
| v-a2-sports-029 (a2)                 | løfte           | verb         | u-b2-668 (b2) | løfte vekter                                               |
| v-a2-communication-056 (a2)          | man             | pronoun      | u-b2-177 (b2) | Man skulle kanskje tro at                                  |
| v-a2-communication-056 (a2)          | man             | pronoun      | u-c-026 (c)   | Man skal ikke selge skinnet før bjørnen er skutt.          |
| v-a2-communication-056 (a2)          | man             | pronoun      | u-c-177 (c)   | man kan høre en knappenål falle                            |
| v-a2-communication-058 (a2)          | med             | preposition  | u-a2-001 (a2) | med andre ord                                              |
| v-a2-communication-058 (a2)          | med             | preposition  | u-a2-049 (a2) | med en gang                                                |
| v-a2-communication-058 (a2)          | med             | preposition  | u-a2-178 (a2) | med én gang                                                |
| v-a2-communication-058 (a2)          | med             | preposition  | u-b2-179 (b2) | med jevne mellomrom                                        |
| v-a2-communication-058 (a2)          | med             | preposition  | u-b2-180 (b2) | med tanke på                                               |
| v-a2-communication-058 (a2)          | med             | preposition  | u-b2-181 (b2) | med unntak av                                              |
| v-a2-communication-058 (a2)          | med             | preposition  | u-b2-782 (b2) | med hensyn til                                             |
| v-a2-communication-058 (a2)          | med             | preposition  | u-c-014 (c)   | med utgangspunkt i                                         |
| v-a2-communication-058 (a2)          | med             | preposition  | u-c-090 (c)   | med lua på snei                                            |
| v-a2-communication-058 (a2)          | med             | preposition  | u-c-139 (c)   | med strev og møye                                          |
| v-a2-communication-058 (a2)          | med             | preposition  | u-c-185 (c)   | med rubb og rake                                           |
| v-a2-communication-059 (a2)          | men             | conjunction  | u-b2-688 (b2) | Men den gang ei!                                           |
| v-a2-descriptive-adjectives-048 (a2) | mye             | adjective    | u-a1-024 (a1) | mye å gjøre                                                |
| v-a2-hobbies-027 (a2)                | nyte            | verb         | u-b1-162 (b1) | nyte livet                                                 |
| v-a2-hobbies-027 (a2)                | nyte            | verb         | u-b2-188 (b2) | nyte tilværelsen                                           |
| v-a2-hobbies-027 (a2)                | nyte            | verb         | u-b2-750 (b2) | nyte godt av                                               |
| v-a2-transport-014 (a2)              | offentlig       | adjective    | u-b2-192 (b2) | offentlig forvaltning                                      |
| v-a2-transport-014 (a2)              | offentlig       | adjective    | u-b2-193 (b2) | offentlig instans/en                                       |
| v-a2-transport-014 (a2)              | offentlig       | adjective    | u-b2-194 (b2) | offentlig sektor/en                                        |
| v-a2-descriptive-adjectives-060 (a2) | praktisk        | adjective    | u-b2-201 (b2) | praktisk talt                                              |
| v-a2-descriptive-adjectives-063 (a2) | rett            | adjective    | u-a1-126 (a1) | rett frem                                                  |
| v-a2-descriptive-adjectives-063 (a2) | rett            | adjective    | u-b1-176 (b1) | rett og slett                                              |
| v-a2-descriptive-adjectives-063 (a2) | rett            | adjective    | u-b1-177 (b1) | rett til                                                   |
| v-a2-descriptive-adjectives-063 (a2) | rett            | adjective    | u-b2-634 (b2) | rett som det er                                            |
| v-a2-descriptive-adjectives-064 (a2) | riktig          | adjective    | u-c-052 (c)   | riktig vanskelig                                           |
| v-a2-social-life-085 (a2)            | sammen          | adverb       | u-a2-251 (a2) | sammen med                                                 |
| v-a2-descriptive-adjectives-067 (a2) | selv            | pronoun      | u-a2-263 (a2) | selv om                                                    |
| v-a2-descriptive-adjectives-067 (a2) | selv            | pronoun      | u-c-189 (c)   | selv den skarpeste                                         |
| v-a2-house-chores-043 (a2)           | sette           | verb         | u-b1-185 (b1) | sette grenser                                              |
| v-a2-house-chores-043 (a2)           | sette           | verb         | u-b1-186 (b1) | sette pris på                                              |
| v-a2-house-chores-043 (a2)           | sette           | verb         | u-b2-222 (b2) | sette i sentrum                                            |
| v-a2-house-chores-043 (a2)           | sette           | verb         | u-b2-223 (b2) | sette ord på                                               |
| v-a2-house-chores-043 (a2)           | sette           | verb         | u-b2-225 (b2) | sette under press                                          |
| v-a2-house-chores-043 (a2)           | sette           | verb         | u-b2-226 (b2) | sette ut på anbud                                          |
| v-a2-communication-077 (a2)          | skulle          | verb         | u-a2-104 (a2) | skulle til å                                               |
| v-a2-communication-077 (a2)          | skulle          | verb         | u-b1-193 (b1) | skulle til                                                 |
| v-a2-weather-019 (a2)                | sol             | noun         | u-a1-127 (a1) | sol og skyer                                               |
| v-a2-communication-081 (a2)          | som             | pronoun      | u-b2-241 (b2) | som følge av                                               |
| v-a2-communication-081 (a2)          | som             | pronoun      | u-b2-242 (b2) | som regel                                                  |
| v-a2-communication-081 (a2)          | som             | pronoun      | u-b2-243 (b2) | som skapt for                                              |
| v-a2-communication-081 (a2)          | som             | pronoun      | u-b2-727 (b2) | som vi har igjen                                           |
| v-a2-communication-081 (a2)          | som             | pronoun      | u-b2-785 (b2) | som et resultat av                                         |
| v-a2-descriptive-adjectives-070 (a2) | sosial          | adjective    | u-b1-205 (b1) | sosial magnet                                              |
| v-a2-descriptive-adjectives-070 (a2) | sosial          | adjective    | u-b2-244 (b2) | sosial dumping                                             |
| v-a2-time-048 (a2)                   | starte          | verb         | u-b1-210 (b1) | starte for seg selv                                        |
| v-a2-time-048 (a2)                   | starte          | verb         | u-b1-211 (b1) | starte på nytt                                             |
| v-a2-house-chores-045 (a2)           | stue            | noun         | u-b2-254 (b2) | stue seg sammen                                            |
| v-a2-communication-086 (a2)          | synes           | verb         | u-a1-070 (a1) | Synes du det?                                              |
| v-a2-communication-086 (a2)          | synes           | verb         | u-b2-717 (b2) | synes å være                                               |
| v-a2-descriptive-adjectives-074 (a2) | sånn            | adjective    | u-a2-242 (a2) | sånn passe                                                 |
| v-a2-directions-049 (a2)             | til             | preposition  | u-a1-118 (a1) | til fots                                                   |
| v-a2-directions-049 (a2)             | til             | preposition  | u-a1-119 (a1) | til høyre                                                  |
| v-a2-directions-049 (a2)             | til             | preposition  | u-a1-120 (a1) | til venstre                                                |
| v-a2-directions-049 (a2)             | til             | preposition  | u-a2-079 (a2) | til huset                                                  |
| v-a2-directions-049 (a2)             | til             | preposition  | u-a2-254 (a2) | til sammen                                                 |
| v-a2-directions-049 (a2)             | til             | preposition  | u-a2-270 (a2) | til slutt                                                  |
| v-a2-directions-049 (a2)             | til             | preposition  | u-b1-102 (b1) | til havs                                                   |
| v-a2-directions-049 (a2)             | til             | preposition  | u-b1-236 (b1) | til havs                                                   |
| v-a2-directions-049 (a2)             | til             | preposition  | u-b2-272 (b2) | til alle tider                                             |
| v-a2-directions-049 (a2)             | til             | preposition  | u-b2-273 (b2) | til enhver tid                                             |
| v-a2-directions-049 (a2)             | til             | preposition  | u-b2-274 (b2) | til overs                                                  |
| v-a2-directions-049 (a2)             | til             | preposition  | u-b2-275 (b2) | til sammenligning                                          |
| v-a2-directions-049 (a2)             | til             | preposition  | u-b2-276 (b2) | til tider                                                  |
| v-a2-directions-049 (a2)             | til             | preposition  | u-b2-618 (b2) | til stede                                                  |
| v-a2-directions-049 (a2)             | til             | preposition  | u-b2-732 (b2) | til tross for våre advarsler                               |
| v-a2-directions-049 (a2)             | til             | preposition  | u-b2-735 (b2) | til tross for at                                           |
| v-a2-directions-049 (a2)             | til             | preposition  | u-b2-740 (b2) | til og med                                                 |
| v-a2-directions-049 (a2)             | til             | preposition  | u-b2-766 (b2) | til gjengjeld                                              |
| v-a2-directions-049 (a2)             | til             | preposition  | u-b2-769 (b2) | til en viss grad                                           |
| v-a2-directions-049 (a2)             | til             | preposition  | u-b2-786 (b2) | til syvende og sist                                        |
| v-a2-directions-049 (a2)             | til             | preposition  | u-b2-787 (b2) | til tross for                                              |
| v-a2-social-life-094 (a2)            | treffe          | verb         | u-a2-150 (a2) | treffe venner                                              |
| v-a2-social-life-094 (a2)            | treffe          | verb         | u-b2-287 (b2) | treffe rett i hjertet                                      |
| v-a2-social-life-094 (a2)            | treffe          | verb         | u-b2-288 (b2) | treffe spikeren på hodet                                   |
| v-a2-communication-094 (a2)          | uten            | preposition  | u-c-039 (c)   | Uten mat og drikke duger helten ikke.                      |
| v-a2-communication-094 (a2)          | uten            | preposition  | u-c-092 (c)   | uten nærmere overveielse (en)                              |
| v-a2-directions-054 (a2)             | ved             | preposition  | u-b2-293 (b2) | ved hjelp av                                               |
| v-a2-health-050 (a2)                 | vekt            | noun         | u-b2-297 (b2) | vekt på                                                    |
| v-a2-sports-035 (a2)                 | øvelse          | noun         | u-c-044 (c)   | Øvelse gjør mester.                                        |
| v-a2-descriptive-adjectives-084 (a2) | åpen            | adjective    | u-b1-221 (b1) | åpen søknad                                                |
| v-a2-communication-099 (a2)          | legge til       | verb         | u-b2-733 (b2) | legge til rette                                            |
| v-a2-transport-021 (a2)              | gå av           | verb         | u-b2-096 (b2) | gå av minne                                                |
| v-a2-social-life-107 (a2)            | klare seg       | verb         | u-b2-655 (b2) | klare seg selv                                             |
| v-b1-accommodation-019 (b1)          | henge           | verb         | u-b2-690 (b2) | henge seg opp i ting                                       |
| v-b1-arts-culture-022 (b1)           | skape           | verb         | u-b2-231 (b2) | skape motvekt til                                          |
| v-b1-communication-skills-029 (b1)   | ifølge          | preposition  | u-b2-609 (b2) | ifølge loven                                               |
| v-b1-communication-skills-048 (b1)   | tilby           | verb         | u-b2-279 (b2) | tilby tilbød, tilbudt                                      |
| v-b1-cooking-001 (b1)                | allergisk       | adjective    | u-a2-148 (a2) | allergisk mot                                              |
| v-b1-cooking-007 (b1)                | rett            | noun         | u-a1-126 (a1) | rett frem                                                  |
| v-b1-cooking-007 (b1)                | rett            | noun         | u-b1-176 (b1) | rett og slett                                              |
| v-b1-cooking-007 (b1)                | rett            | noun         | u-b1-177 (b1) | rett til                                                   |
| v-b1-cooking-007 (b1)                | rett            | noun         | u-b2-634 (b2) | rett som det er                                            |
| v-b1-cooking-024 (b1)                | bestille        | verb         | u-b1-005 (b1) | bestille time                                              |
| v-b1-education-038 (b1)              | vurdering       | noun         | u-b2-300 (b2) | vurdering for læring                                       |
| v-b1-education-039 (b1)              | bestå           | verb         | u-b2-576 (b2) | bestå eksamen                                              |
| v-b1-education-039 (b1)              | bestå           | verb         | u-b2-604 (b2) | bestå i                                                    |
| v-b1-environment-004 (b1)            | bærekraftig     | adjective    | u-b1-021 (b1) | bærekraftig utvikling                                      |
| v-b1-environment-026 (b1)            | bevare          | verb         | u-b2-797 (b2) | bevare naturen                                             |
| v-b1-environment-027 (b1)            | redusere        | verb         | u-b2-798 (b2) | redusere utslipp                                           |
| v-b1-expressing-opinions-012 (b1)    | ende            | noun         | u-c-034 (c)   | Ende god, alt godt.                                        |
| v-b1-expressing-opinions-014 (b1)    | enig            | adjective    | u-b1-032 (b1) | enig om                                                    |
| v-b1-expressing-opinions-048 (b1)    | skikkelig       | adjective    | u-b2-678 (b2) | skikkelig elendig                                          |
| v-b1-expressing-opinions-051 (b1)    | stadig          | adverb       | u-b2-246 (b2) | stadig vekk                                                |
| v-b1-expressing-opinions-065 (b1)    | velge           | verb         | u-b2-682 (b2) | velge og vrake                                             |
| v-b1-family-021 (b1)                 | støtte          | noun         | u-b2-799 (b2) | støtte hverandre                                           |
| v-b1-family-024 (b1)                 | vekke           | verb         | u-b2-295 (b2) | vekke oppmerksomhet                                        |
| v-b1-family-024 (b1)                 | vekke           | verb         | u-b2-296 (b2) | vekke oppsikt                                              |
| v-b1-family-024 (b1)                 | vekke           | verb         | u-b2-728 (b2) | vekke begeistring                                          |
| v-b1-finance-025 (b1)                | spare           | verb         | u-a2-155 (a2) | spare energi                                               |
| v-b1-finance-025 (b1)                | spare           | verb         | u-a2-156 (a2) | spare penger                                               |
| v-b1-health-002 (b1)                 | alvorlig        | adjective    | u-b1-001 (b1) | alvorlig talt                                              |
| v-b1-health-031 (b1)                 | smertestillende | adjective    | u-b1-204 (b1) | smertestillende tabletter                                  |
| v-b1-health-034 (b1)                 | spre            | verb         | u-b2-716 (b2) | spre gørr                                                  |
| v-b1-language-learning-004 (b1)      | begge           | pronoun      | u-b1-004 (b1) | begge deler                                                |
| v-b1-language-learning-017 (b1)      | ord             | noun         | u-c-030 (c)   | Ord er sølv, men taushet er gull.                          |
| v-b1-media-003 (b1)                  | digital         | adjective    | u-b2-050 (b2) | digital dømmekraft/en                                      |
| v-b1-mental-wellbeing-002 (b1)       | avhengig        | adjective    | u-a2-163 (a2) | avhengig av                                                |
| v-b1-mental-wellbeing-040 (b1)       | sårbar          | adjective    | u-b2-651 (b2) | sårbar livsfase                                            |
| v-b1-mental-wellbeing-044 (b1)       | trives          | verb         | u-a1-081 (a1) | Trives du her? Ja, jeg liker meg godt her.                 |
| v-b1-personal-growth-007 (b1)        | egen            | adjective    | u-b1-030 (b1) | egen hånd                                                  |
| v-b1-personal-growth-046 (b1)        | uavhengig       | adjective    | u-b2-291 (b2) | uavhengig av                                               |
| v-b1-politics-034 (b1)               | inngå           | verb         | u-b2-601 (b2) | inngå en kontrakt                                          |
| v-b1-politics-034 (b1)               | inngå           | verb         | u-b2-627 (b2) | inngå avtaler                                              |
| v-b1-relationships-008 (b1)          | ensomhet        | noun         | u-c-031 (c)   | Ensomhet er den vises selskap.                             |
| v-b1-relationships-025 (b1)          | såre            | verb         | u-b2-574 (b2) | såre noen                                                  |
| v-b1-relationships-030 (b1)          | kommunisere     | verb         | u-b2-790 (b2) | kommunisere effektivt                                      |
| v-b1-relationships-032 (b1)          | støtte          | verb         | u-b2-799 (b2) | støtte hverandre                                           |
| v-b1-society-081 (b1)                | stemme          | verb         | u-b2-711 (b2) | stemme overens med                                         |
| v-b1-traditions-018 (b1)             | jul             | noun         | u-a2-076 (a2) | jul og nyttår                                              |
| v-b1-traditions-027 (b1)             | tenne           | verb         | u-b1-234 (b1) | tenne bål                                                  |
| v-b1-travel-001 (b1)                 | borte           | adverb       | u-c-018 (c)   | Borte bra, hjemme best.                                    |
| v-b1-work-019 (b1)                   | fast            | adjective    | u-b1-042 (b1) | fast jobb                                                  |
| v-b1-work-041 (b1)                   | utvide          | verb         | u-b2-585 (b2) | utvide horisonten                                          |
| v-b1-personal-growth-061 (b1)        | få til          | verb         | u-b2-085 (b2) | få til å gå rundt                                          |
| v-b1-personal-growth-064 (b1)        | gi seg          | verb         | u-b2-617 (b2) | gi seg god tid                                             |
| v-b1-sustainability-028 (b1)         | kaste bort      | verb         | u-b1-134 (b1) | kaste bort tid                                             |
| v-b1-personal-growth-069 (b1)        | klare seg       | verb         | u-b2-655 (b2) | klare seg selv                                             |
| v-b2-abstract-nouns-055 (b2)         | minne           | noun         | u-b1-161 (b1) | minne om                                                   |
| v-b2-abstract-nouns-063 (b2)         | hell            | noun         | u-b2-704 (b2) | hell i uhell                                               |
| v-b2-academic-language-045 (b2)      | relativt        | adverb       | u-b2-641 (b2) | relativt høy grad                                          |
| v-b2-academic-language-051 (b2)      | tilnærmet       | adverb       | u-b2-281 (b2) | tilnærmet alle                                             |
| v-b2-advanced-adjectives-042 (b2)    | mangelfull      | adjective    | u-b2-746 (b2) | mangelfull dekning                                         |
| v-b2-advanced-verbs-014 (b2)         | havne           | verb         | u-b2-114 (b2) | havne på førsteplass                                       |
| v-b2-communication-048 (b2)          | omtale          | verb         | u-b2-196 (b2) | omtale som                                                 |
| v-b2-discourse-markers-004 (b2)      | forutsatt       | conjunction  | u-b2-778 (b2) | forutsatt at                                               |
| v-b2-discourse-markers-020 (b2)      | akkurat         | adverb       | u-a2-160 (a2) | akkurat nå                                                 |
| v-b2-education-043 (b2)              | rette           | verb         | u-b2-218 (b2) | rette søkelyset mot                                        |
| v-b2-emotions-038 (b2)               | skyld           | noun         | u-b1-194 (b1) | skyld i                                                    |
| v-b2-law-032 (b2)                    | grovt           | adverb       | u-b2-094 (b2) | grovt regnet                                               |
| v-b2-philosophy-007 (b2)             | sannhet         | noun         | u-c-028 (c)   | Sannhet og tro er ikke det samme.                          |
| v-b2-science-011 (b2)                | fossil          | noun         | u-b1-053 (b1) | fossil energi                                              |
| v-b2-social-issues-051 (b2)          | tilgang         | noun         | u-b2-280 (b2) | tilgang til                                                |
| v-b2-advanced-verbs-133 (b2)         | ta opp          | verb         | u-b2-756 (b2) | ta opp til behandling                                      |
| v-c-abstract-concepts-012 (c)        | uvurderlig      | adjective    | u-b2-725 (b2) | uvurderlig verdi                                           |
| v-c-character-temperament-023 (c)    | romslig         | adjective    | u-b2-219 (b2) | romslig økonomi                                            |
| v-c-character-temperament-024 (c)    | stø             | adjective    | u-c-084 (c)   | stø kurs (en)                                              |

---

_This report only flags candidates. No files are modified — review manually,
then delete the losing entry directly or add it to a migration list._
