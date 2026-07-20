import type { GrammarRule } from '$lib/types';

/**
 * Grammar rule definitions for the Grammar feature.
 * These are stored as a TS module (not JSON) because they contain
 * bilingual prose explanations that don't belong in the Paraglide catalogue.
 */
export const GRAMMAR_RULES: Record<string, GrammarRule> = {
  'ikke-placement': {
    id: 'ikke-placement',
    titleEn: 'Placement of "ikke"',
    titleNb: 'Plassering av "ikke"',
    explanationEn:
      'In main clauses, "ikke" comes after the verb: "Jeg liker ikke vinteren." ' +
      'In subordinate clauses (after "at", "fordi", "hvis", etc.), "ikke" comes BEFORE the verb: ' +
      '"Jeg vet at han ikke liker vinteren."',
    explanationNb:
      'I hovedsetninger kommer "ikke" etter verbet: "Jeg liker ikke vinteren." ' +
      'I leddsetninger (etter "at", "fordi", "hvis" osv.) kommer "ikke" FØR verbet: ' +
      '"Jeg vet at han ikke liker vinteren."'
  },

  'det-sentence': {
    id: 'det-sentence',
    titleEn: '"Det"-sentences (cleft/extraposition)',
    titleNb: '"Det"-setninger (kløvningssetning)',
    explanationEn:
      'Norwegian can move a clausal subject to the end and start with "Det er … at/å …": ' +
      '"At du kan komme, er fint." → "Det er fint at du kan komme." ' +
      'The "det" is a formal/anticipatory subject.',
    explanationNb:
      'Norsk kan flytte et leddsetnings-subjekt til slutten og begynne med "Det er … at/å …": ' +
      '"At du kan komme, er fint." → "Det er fint at du kan komme." ' +
      '"Det" er et formelt forutgripende subjekt.'
  },

  'det-er-ikke': {
    id: 'det-er-ikke',
    titleEn: 'Word order: det / er / ikke',
    titleNb: 'Ordrekkefølge: det / er / ikke',
    explanationEn:
      'In main clauses with "det er ikke": the order is always det → er → ikke → adjective/noun. ' +
      '"Det er ikke sant." (It is not true.) ' +
      'Do not move "ikke" before "er" in a main clause.',
    explanationNb:
      'I hovedsetninger med "det er ikke" er rekkefølgen alltid det → er → ikke → adjektiv/substantiv. ' +
      '"Det er ikke sant." ' +
      'Ikke flytt "ikke" foran "er" i en hovedsetning.'
  },

  'v2-word-order': {
    id: 'v2-word-order',
    titleEn: 'V2 rule (verb-second)',
    titleNb: 'V2-regelen (verb på andreplass)',
    explanationEn:
      'In Norwegian main clauses the finite verb must be the SECOND element. ' +
      'When the sentence starts with an adverbial, the subject and verb swap: ' +
      '"I går gikk jeg til butikken." (Yesterday I went to the store.) ' +
      'Compare English: subject stays first. Norwegian: verb stays second.',
    explanationNb:
      'I norske hovedsetninger må det bøyde verbet alltid stå på ANDRE PLASS. ' +
      'Når setningen begynner med et adverbial, bytter subjektet og verbet plass: ' +
      '"I går gikk jeg til butikken." ' +
      'Sammenlign med engelsk: subjektet er alltid først. Norsk: verbet er alltid på andreplass.'
  },

  'modal-verb-order': {
    id: 'modal-verb-order',
    titleEn: 'Modal verb + infinitive order',
    titleNb: 'Modalverb + infinitiv-rekkefølge',
    explanationEn:
      'Modal verbs (kan, vil, skal, må, bør, får) are followed directly by the bare infinitive ' +
      '(no "å"): "Jeg kan hjelpe deg." NOT "Jeg kan å hjelpe deg." ' +
      'In subordinate clauses the modal still precedes the infinitive but "ikke" goes before the modal: ' +
      '"…at jeg ikke kan hjelpe deg."',
    explanationNb:
      'Modalverb (kan, vil, skal, må, bør, får) følges direkte av naken infinitiv (uten "å"): ' +
      '"Jeg kan hjelpe deg." IKKE "Jeg kan å hjelpe deg." ' +
      'I leddsetninger kommer "ikke" foran modalverbet: "…at jeg ikke kan hjelpe deg."'
  },

  'subordinate-order': {
    id: 'subordinate-order',
    titleEn: 'Subordinate clause word order',
    titleNb: 'Leddsetningers ordstilling',
    explanationEn:
      'In subordinate clauses introduced by conjunctions (at, fordi, hvis, når, selv om, …): ' +
      '1) No inversion — subject always precedes verb. ' +
      '2) Adverbs like "ikke", "alltid", "aldri" go between subject and verb. ' +
      '"Jeg vet at hun alltid spiser frokost." (I know that she always eats breakfast.)',
    explanationNb:
      'I leddsetninger innledet av konjunksjoner (at, fordi, hvis, når, selv om, …): ' +
      '1) Ingen inversjon — subjektet kommer alltid før verbet. ' +
      '2) Adverb som "ikke", "alltid", "aldri" plasseres mellom subjekt og verb. ' +
      '"Jeg vet at hun alltid spiser frokost."'
  },

  'relative-som': {
    id: 'relative-som',
    titleEn: 'Relative clauses with "som"',
    titleNb: 'Relativsetninger med "som"',
    explanationEn:
      '"som" introduces a relative clause and stands for the subject or object of the embedded ' +
      'sentence: "Mannen som bor her, er lege." When "som" is the object it can usually be ' +
      'dropped: "Boka (som) jeg leste, var god." A relative clause is subordinate, so adverbs ' +
      'like "ikke" come BEFORE the verb: "en venn som ikke kommer".',
    explanationNb:
      '"som" innleder en relativsetning og står for subjektet eller objektet i den innfelte ' +
      'setningen: "Mannen som bor her, er lege." Når "som" er objekt, kan det vanligvis sløyfes: ' +
      '"Boka (som) jeg leste, var god." En relativsetning er en leddsetning, så adverb som ' +
      '"ikke" kommer FØR verbet: "en venn som ikke kommer".'
  },

  setningsadverbial: {
    id: 'setningsadverbial',
    titleEn: 'Sentence adverbials (setningsadverbialer)',
    titleNb: 'Setningsadverbialer',
    explanationEn:
      'Sentence adverbials — ikke, aldri, alltid, heldigvis, dessverre, ofte, sjelden and similar — ' +
      'follow the same placement rule as «ikke»: ' +
      'In MAIN clauses they come AFTER the finite verb: "Jeg går aldri dit." ' +
      'In SUBORDINATE clauses (after at, fordi, hvis, når, …) they come BEFORE the verb: ' +
      '"Jeg vet at han aldri går dit." ' +
      'This is the same rule as for «ikke» — all setningsadverbialer behave identically.',
    explanationNb:
      'Setningsadverbialer — ikke, aldri, alltid, heldigvis, dessverre, ofte, sjelden og lignende — ' +
      'følger samme plasseringsregel som «ikke»: ' +
      'I HOVEDSETNINGER kommer de ETTER det bøyde verbet: "Jeg går aldri dit." ' +
      'I LEDDSETNINGER (etter at, fordi, hvis, når, …) kommer de FØR verbet: ' +
      '"Jeg vet at han aldri går dit." ' +
      'Dette er samme regel som for «ikke» — alle setningsadverbialer oppfører seg identisk.'
  },

  'adverbial-fronting': {
    id: 'adverbial-fronting',
    titleEn: 'Adverbial fronting (V2 inversion)',
    titleNb: 'Adverbialforflytning (V2-inversjon)',
    explanationEn:
      'When you move an adverbial (time, place, manner) to the FRONT of a Norwegian main clause, ' +
      'the subject and verb must swap to keep the verb in second position (V2 rule). ' +
      'Simple verb: "Jeg har mange slektninger i Sverige." → "I Sverige har jeg mange slektninger." ' +
      'Modal + infinitive: "Det skal være konsert her i mai." → "I mai skal det være konsert her." ' +
      'With a setningsadverbial: the adverbial fronts, subject/verb invert, but the sentential ' +
      'adverb (alltid, aldri, ofte …) stays between subject and verb as always: ' +
      '"Vi har alltid fri på fredagen." → "På fredagen har vi alltid fri."',
    explanationNb:
      'Når du flytter et adverbial (tid, sted, måte) til BEGYNNELSEN av en norsk hovedsetning, ' +
      'må subjektet og verbet bytte plass for å holde verbet på andreplass (V2-regelen). ' +
      'Enkelt verbal: "Jeg har mange slektninger i Sverige." → "I Sverige har jeg mange slektninger." ' +
      'Hjelpeverb + infinitiv: "Det skal være konsert her i mai." → "I mai skal det være konsert her." ' +
      'Med setningsadverbial: adverbialet flyttes, subjekt/verb inverterer, men setningsadverbialet ' +
      '(alltid, aldri, ofte …) blir alltid stående mellom subjekt og verb: ' +
      '"Vi har alltid fri på fredagen." → "På fredagen har vi alltid fri."'
  },

  'svar-ja-jo-nei': {
    id: 'svar-ja-jo-nei',
    titleEn: 'Short answers: ja / jo / nei',
    titleNb: 'Korte svar: ja / jo / nei',
    explanationEn:
      'Answer a positive yes/no question with "ja" or "nei". But answer a NEGATIVE question ' +
      'affirmatively with "jo", never "ja": "Liker du ikke kaffe?" → "Jo, det gjør jeg." ' +
      'Short answers echo the finite verb (or "det gjør/er"): "Kommer du?" → "Ja, det gjør jeg." ' +
      '"Er du norsk?" → "Ja, det er jeg."',
    explanationNb:
      'Svar på et positivt ja/nei-spørsmål med "ja" eller "nei". Men svar bekreftende på et ' +
      'NEGATIVT spørsmål med "jo", aldri "ja": "Liker du ikke kaffe?" → "Jo, det gjør jeg." ' +
      'Korte svar gjentar det bøyde verbet (eller "det gjør/er"): "Kommer du?" → "Ja, det gjør ' +
      'jeg." "Er du norsk?" → "Ja, det er jeg."'
  },

  // ── Phase 2: Morphology topics ────────────────────────────────────────────

  'noun-articles': {
    id: 'noun-articles',
    titleEn: 'Noun articles (en / et / ei)',
    titleNb: 'Substantivartikler (en / et / ei)',
    explanationEn:
      'Norwegian nouns have three genders: masculine (en), neuter (et), and feminine (ei). ' +
      'The indefinite article matches the noun’s gender: en bil, et hus, ei jente. ' +
      'After «være» or «jobbe som» with a profession, Norwegian drops the article entirely: ' +
      '"Han er lærer." (He is a teacher.)',
    explanationNb:
      'Norske substantiver har tre kjønn: hankjønn (en), intetkjønn (et) og hunkjønn (ei). ' +
      'Den ubestemte artikkelen samsvarer med substantivets kjønn: en bil, et hus, ei jente. ' +
      'Etter «være» eller «jobbe som» med et yrke brukes ingen artikkel: ' +
      '"Han er lærer."'
  },

  'noun-plurals': {
    id: 'noun-plurals',
    titleEn: 'Noun plurals',
    titleNb: 'Substantivets flertall',
    explanationEn:
      'Most Norwegian nouns add -er in the plural (en bil → biler). ' +
      'Nouns ending in -e add only -r (en klasse → klasser). ' +
      'Many short neuter nouns have identical singular and plural forms (et år → tre år, et barn → tre barn). ' +
      'Some are irregular: en mann → menn, et barn → barn, en fot → føtter.',
    explanationNb:
      'De fleste norske substantiver får -er i flertall (en bil → biler). ' +
      'Substantiver som ender på -e får bare -r (en klasse → klasser). ' +
      'Mange korte intetkjønnsord har samme form i entall og flertall (et år → tre år, et barn → tre barn). ' +
      'Noen er uregelmessige: en mann → menn, et barn → barn, en fot → føtter.'
  },

  'noun-possessives': {
    id: 'noun-possessives',
    titleEn: 'Noun possessives (genitive -s)',
    titleNb: 'Substantivets genitiv (-s)',
    explanationEn:
      'Norwegian genitive adds -s directly to the noun or name with NO apostrophe: ' +
      'Eriks bil, Annes jobb, barnets leker. ' +
      'An apostrophe before -s is an English habit — never use it in Norwegian: ' +
      'Erik’s → Eriks.',
    explanationNb:
      'Norsk genitiv legger -s direkte til substantivet eller navnet UTEN apostrof: ' +
      'Eriks bil, Annes jobb, barnets leker. ' +
      'Apostrof før -s er en engelsk vane — bruk den aldri på norsk: ' +
      'Erik’s → Eriks.'
  },

  'adj-agreement': {
    id: 'adj-agreement',
    titleEn: 'Adjective agreement',
    titleNb: 'Adjektivbøyning',
    explanationEn:
      'Norwegian adjectives must agree with the noun they modify in gender and number. ' +
      'Indefinite singular: en stor bil, ei stor jente, et stort hus. ' +
      'Plural (all genders): store biler / store jenter / store hus. ' +
      'Note: liten is irregular — liten (en), lita (ei), lite (et), små (plural).',
    explanationNb:
      'Norske adjektiver må samsvare med substantivet de bøyer i kjønn og tall. ' +
      'Ubestemt entall: en stor bil, ei stor jente, et stort hus. ' +
      'Flertall (alle kjønn): store biler / store jenter / store hus. ' +
      'Merk: liten er uregelmessig — liten (en), lita (ei), lite (et), små (flertall).'
  },

  'adj-definite': {
    id: 'adj-definite',
    titleEn: 'Adjective in definite form',
    titleNb: 'Adjektiv i bestemt form',
    explanationEn:
      'When a noun is in the definite form, the adjective takes a weak (-e) ending AND ' +
      'requires the definite article den / det / de before it: ' +
      'den gamle mannen, det nye huset, de norske studentene. ' +
      'Never omit the article: *gamle mannen is wrong.',
    explanationNb:
      'Når et substantiv står i bestemt form, får adjektivet svak (-e) ending OG ' +
      'krever den bestemte artikkelen den / det / de foran: ' +
      'den gamle mannen, det nye huset, de norske studentene. ' +
      'Utelat aldri artikkelen: *gamle mannen er feil.'
  },

  'adj-comparison': {
    id: 'adj-comparison',
    titleEn: 'Adjective comparison',
    titleNb: 'Adjektivets gradbøyning',
    explanationEn:
      'Most adjectives form the comparative with -ere and superlative with -est: ' +
      'billig → billigere → billigst. ' +
      'Some are irregular: god → bedre → best, dårlig → verre → verst, ' +
      'gammel → eldre → eldst, liten → mindre → minst. ' +
      'Use «enn» after comparatives: Oslo er større enn Bergen.',
    explanationNb:
      'De fleste adjektiver danner komparativ med -ere og superlativ med -est: ' +
      'billig → billigere → billigst. ' +
      'Noen er uregelmessige: god → bedre → best, dårlig → verre → verst, ' +
      'gammel → eldre → eldst, liten → mindre → minst. ' +
      'Bruk «enn» etter komparativ: Oslo er større enn Bergen.'
  },

  'sterke-verb': {
    id: 'sterke-verb',
    titleEn: 'Strong verbs (irregular past tense)',
    titleNb: 'Sterke verb (uregelmessig fortid)',
    explanationEn:
      'Strong verbs change their stem vowel in the preteritum rather than adding -et/-te. ' +
      'They must be learned individually. ' +
      'Common examples: gå → gikk, komme → kom, se → så, ta → tok, få → fikk, gi → ga, være → var. ' +
      'The past participle (used with «har») has its own form: gått, kommet, sett, tatt, fått, gitt, vært.',
    explanationNb:
      'Sterke verb endrer stammevokalen i preteritum i stedet for å legge til -et/-te. ' +
      'De må læres hver for seg. ' +
      'Vanlige eksempler: gå → gikk, komme → kom, se → så, ta → tok, få → fikk, gi → ga, være → var. ' +
      'Perfektum partisipp (brukt med «har») har sin egen form: gått, kommet, sett, tatt, fått, gitt, vært.'
  },

  helsetninger: {
    id: 'helsetninger',
    titleEn: 'Main clauses (helsetninger)',
    titleNb: 'Helsetninger',
    explanationEn:
      'Norwegian main clauses follow four key patterns. ' +
      '1) Declarative: finite verb is always the SECOND element (V2). ' +
      '2) Yes/no questions: swap subject and verb — «Du snakker norsk.» → «Snakker du norsk?» ' +
      '3) Wh-questions: question word takes position 1, verb stays 2nd — «Hvor bor du?» ' +
      '4) Negation: «ikke» comes AFTER the finite verb in main clauses. ' +
      '5) Presentational «det»: when an indefinite subject follows the verb, use «det» as a dummy subject — «Det bor en mann her.»',
    explanationNb:
      'Norske helsetninger følger fire mønstre. ' +
      '1) Fortellende: det bøyde verbet er alltid på ANDRE PLASS (V2). ' +
      '2) Ja/nei-spørsmål: bytt om subjekt og verb — «Du snakker norsk.» → «Snakker du norsk?» ' +
      '3) Spørresetninger med spørreord: spørreordet står på første plass, verbet på andre — «Hvor bor du?» ' +
      '4) Nektelse: «ikke» kommer ETTER det bøyde verbet i helsetninger. ' +
      '5) Det som formelt subjekt: når et ubestemt subjekt følger verbet, brukes «det» som formelt subjekt — «Det bor en mann her.»'
  },

  'preposisjoner-tid': {
    id: 'preposisjoner-tid',
    titleEn: 'Time prepositions (i, om, for–siden, på)',
    titleNb: 'Tidspreposisjoner (i, om, for–siden, på)',
    explanationEn:
      '«I» expresses duration (how long): «Hun har bodd her i to år.» It is also used with years, months, and named periods: i 1989, i april, i ferien. ' +
      '«For … siden» marks a past point in time (ago): «De kom for to uker siden.» Always used with preteritum. ' +
      '«Om» points to a future moment: «De kommer om fem minutter.» ' +
      '«Til» with a definite season means the upcoming season: «Til sommeren skal vi flytte.» ' +
      '«På» shows how long something TOOK to complete: «Han leste boka på to timer.» ' +
      'With «ikke», «på» marks elapsed time without an event: «Jeg har ikke sett henne på måneder.» ' +
      'For seasons and parts of the day: «i» + indefinite noun = the specific instance (i høst, i kveld); «om» + definite noun = habitual/general (om høsten, om kvelden).',
    explanationNb:
      '«I» uttrykker varighet (hvor lenge): «Hun har bodd her i to år.» Brukes også med årstall, måneder og navngitte perioder: i 1989, i april, i ferien. ' +
      '«For … siden» markerer et tidspunkt i fortida: «De kom for to uker siden.» Brukes alltid med preteritum. ' +
      '«Om» peker på et fremtidig tidspunkt: «De kommer om fem minutter.» ' +
      '«Til» foran bestemt årstid betyr den kommende årstiden: «Til sommeren skal vi flytte.» ' +
      '«På» viser hvor lang tid noe tok å fullføre: «Han leste boka på to timer.» ' +
      'Med «ikke» markerer «på» forløpt tid uten at noe har skjedd: «Jeg har ikke sett henne på måneder.» ' +
      'For årstider og deler av dagen: «i» + ubestemt substantiv = den konkrete forekomsten (i høst, i kveld); «om» + bestemt substantiv = vanlig/generell (om høsten, om kvelden).'
  },

  'preposisjoner-sted': {
    id: 'preposisjoner-sted',
    titleEn: 'Place & relation prepositions',
    titleNb: 'Stedspreposisjoner og relasjonspreposisjoner',
    explanationEn:
      '«I» = inside an enclosed space: i skapet, i skogen, i banken, i en butikk. ' +
      '«På» = on a surface or open area, and for most workplaces: på bordet, på fjellet, på kontor, på skolen, på kafé. ' +
      'Geography: «i» for countries, cities, and regions (i Japan, i Bergen, i Nord-Norge); «på» for islands (på Mallorca, på Island) and Norwegian districts (på Vestlandet). ' +
      "«Hos» = at someone's place/premises (being there): «Jeg var hos legen.» To go TO someone, use «til»: «Jeg skal til legen.» " +
      '«Ved» = right next to: «De bor ved sjøen.» ' +
      'Possession: «bilen til Frida» (belonging to a person → «til»); «kongen i Norge» (geographic → «i»); «fargen på bilen» (property of a thing → «på»). ' +
      '«Av» = made of (material): «laget av tre.» «Fra» = coming from (origin): «fra hagen.» ' +
      'Compound prepositions: ved siden av (next to), i nærheten av (near), i stedet for (instead of), på grunn av (because of), ved hjelp av (with the help of).',
    explanationNb:
      '«I» = innenfor et lukket rom: i skapet, i skogen, i banken, i en butikk. ' +
      '«På» = på overflaten eller et åpent område, og for de fleste arbeidsplasser: på bordet, på fjellet, på kontor, på skolen, på kafé. ' +
      'Geografi: «i» for land, byer og regioner (i Japan, i Bergen, i Nord-Norge); «på» for øyer (på Mallorca, på Island) og norske landsdeler (på Vestlandet). ' +
      '«Hos» = hos noen (man er der): «Jeg var hos legen.» For bevegelse til noen brukes «til»: «Jeg skal til legen.» ' +
      '«Ved» = like ved siden av: «De bor ved sjøen.» ' +
      'Tilhørighet: «bilen til Frida» (tilhører en person → «til»); «kongen i Norge» (geografisk → «i»); «fargen på bilen» (egenskap ved ting → «på»). ' +
      '«Av» = laget av (materiale): «laget av tre.» «Fra» = kommer fra (opprinnelse): «fra hagen.» ' +
      'Sammensatte preposisjoner: ved siden av, i nærheten av, i stedet for, på grunn av, ved hjelp av.'
  },

  // ── Nivå A1 topics (free) ──────────────────────────────────────────────────────────────────

  'personlige-pronomen': {
    id: 'personlige-pronomen',
    titleEn: 'Personal pronouns (subject form)',
    titleNb: 'Personlige pronomen (subjektsform)',
    explanationEn:
      'Norwegian subject pronouns are jeg (I), du (you, sg.), han (he), hun (she), vi (we), ' +
      'dere (you, pl.), and de (they). They replace a named subject and must match its person ' +
      'and number: "Samira bor i Norge." → "Hun bor i Norge." "Boka og pennen ligger her." → ' +
      '"De ligger her."',
    explanationNb:
      'Norske subjektspronomen er jeg, du, han, hun, vi, dere og de. De erstatter et navngitt ' +
      'subjekt og må stemme med person og tall: "Samira bor i Norge." → "Hun bor i Norge." ' +
      '"Boka og pennen ligger her." → "De ligger her."'
  },

  'presens-verb': {
    id: 'presens-verb',
    titleEn: 'Presens (present tense)',
    titleNb: 'Presens',
    explanationEn:
      'Regular verbs add -r (or -er after a consonant) in presens, with ONE form for every ' +
      'person: jeg/du/han/hun/vi/dere/de snakker. Unlike English, there is no extra "-s" for ' +
      'third person singular and no separate continuous form — "snakker" alone covers both ' +
      '"speaks" and "is speaking."',
    explanationNb:
      'Regelrette verb får -r (eller -er etter konsonant) i presens, med ÉN form for alle ' +
      'personer: jeg/du/han/hun/vi/dere/de snakker. I motsetning til engelsk finnes det ingen ' +
      'ekstra "-s" for tredje person entall, og ingen egen -ing-form.'
  },

  'pronomen-objektsform': {
    id: 'pronomen-objektsform',
    titleEn: 'Object pronouns',
    titleNb: 'Pronomen: objektsform',
    explanationEn:
      'After a verb or a preposition, subject pronouns switch to their object form: jeg→meg, ' +
      'du→deg, han→ham, hun→henne, vi→oss, dere→dere, de→dem. "Jeg liker deg." "Hun snakker med ' +
      'ham." Note that dere stays the same in both forms.',
    explanationNb:
      'Etter et verb eller en preposisjon bytter subjektspronomen til objektsform: jeg→meg, ' +
      'du→deg, han→ham, hun→henne, vi→oss, dere→dere, de→dem. "Jeg liker deg." "Hun snakker med ' +
      'ham." Merk at dere er likt i begge former.'
  },

  'og-men': {
    id: 'og-men',
    titleEn: '«og» vs. «men»',
    titleNb: '«og» og «men»',
    explanationEn:
      '«Og» joins two matching or additive ideas: "Hun bor i Oslo og jobber der." «Men» joins a ' +
      'contrasting idea instead: "Hun bor i Oslo, men jobber i Bergen." Neither word changes the ' +
      'word order of the clauses it joins.',
    explanationNb:
      '«Og» binder sammen to like eller supplerende ideer: "Hun bor i Oslo og jobber der." ' +
      '«Men» binder sammen en motsetning: "Hun bor i Oslo, men jobber i Bergen." Ingen av dem ' +
      'endrer ordstillingen i setningene de binder sammen.'
  },

  'adverb-sted-hjem': {
    id: 'adverb-sted-hjem',
    titleEn: 'Location vs. movement adverbs (inne/ute, inn/ut, hjem/hjemme)',
    titleNb: 'Stedsadverb: inne/ute, inn/ut, hjem/hjemme',
    explanationEn:
      'Norwegian uses a different adverb form for BEING somewhere than for MOVING there: "Jeg er ' +
      'ute" (I am outside) vs. "Jeg går ut" (I go/walk outside). The same pattern applies to ' +
      'inne/inn and hjemme/hjem: "Vi er hjemme" vs. "Vi går hjem."',
    explanationNb:
      'Norsk bruker ulik adverbform for Å VÆRE et sted og Å BEVEGE SEG dit: "Jeg er ute" mot ' +
      '"Jeg går ut." Samme mønster gjelder inne/inn og hjemme/hjem: "Vi er hjemme" mot "Vi går ' +
      'hjem."'
  },

  'refleksive-uttrykk': {
    id: 'refleksive-uttrykk',
    titleEn: 'Reflexive verb expressions',
    titleNb: 'Refleksive uttrykk',
    explanationEn:
      'Some Norwegian verbs are always paired with a reflexive pronoun (meg, deg, seg, oss, ' +
      'dere, seg) that matches the subject\'s person: "Jeg legger meg klokka ti." "Hun liker seg ' +
      'på hotellet." The reflexive pronoun always matches the SUBJECT, never a different person.',
    explanationNb:
      'Noen norske verb kombineres alltid med et refleksivt pronomen (meg, deg, seg, oss, dere, ' +
      'seg) som samsvarer med subjektets person: "Jeg legger meg klokka ti." "Hun liker seg på ' +
      'hotellet." Det refleksive pronomenet samsvarer alltid med SUBJEKTET.'
  },

  'infinitiv-a1': {
    id: 'infinitiv-a1',
    titleEn: 'The infinitive after modal verbs and «like å»',
    titleNb: 'Infinitiv etter modalverb og «like å»',
    explanationEn:
      'A second verb right after a modal verb (kan, vil, skal, må) stays in the bare infinitive, ' +
      'with no "å": "Jeg vil lære norsk." After verbs like «like», «pleie», «prøve», the ' +
      'infinitive instead needs «å»: "Jeg liker å lære norsk."',
    explanationNb:
      'Et andre verb rett etter et modalverb (kan, vil, skal, må) står i naken infinitiv, uten ' +
      '"å": "Jeg vil lære norsk." Etter verb som «like», «pleie», «prøve» trengs derimot «å»: ' +
      '"Jeg liker å lære norsk."'
  },

  'substantiv-bestemt-form': {
    id: 'substantiv-bestemt-form',
    titleEn: 'Definite noun form (singular)',
    titleNb: 'Substantiv i bestemt form (entall)',
    explanationEn:
      'To say "the X", Norwegian adds an ending to the noun instead of using a separate word: en ' +
      'kopp → koppen, ei uke → uka, et eple → eplet. The ending matches the noun\'s gender, the ' +
      'same gender as its indefinite article (en/ei/et).',
    explanationNb:
      'For å si "the X" legger norsk til en endelse på substantivet i stedet for å bruke et eget ' +
      'ord: en kopp → koppen, ei uke → uka, et eple → eplet. Endelsen følger substantivets kjønn, ' +
      'det samme kjønnet som den ubestemte artikkelen (en/ei/et).'
  },

  'pronomen-den-det-de': {
    id: 'pronomen-den-det-de',
    titleEn: '«den», «det», «de» referring back to a noun',
    titleNb: '«den», «det», «de» som viser tilbake til et substantiv',
    explanationEn:
      'To refer back to something already named, Norwegian uses den (en/ei-nouns), det ' +
      '(et-nouns), or de (plural) — matched to the ORIGINAL noun\'s gender/number: "Hvor er ' +
      'osten? Den er i kjøleskapet." "Hvor er brødet? Det er på bordet."',
    explanationNb:
      'For å vise tilbake til noe som allerede er nevnt, bruker norsk den (en/ei-ord), det ' +
      '(et-ord) eller de (flertall) — som samsvarer med det ORIGINALE substantivets kjønn/tall: ' +
      '"Hvor er osten? Den er i kjøleskapet." "Hvor er brødet? Det er på bordet."'
  },

  'denne-dette-disse': {
    id: 'denne-dette-disse',
    titleEn: '«denne», «dette», «disse» (this/these)',
    titleNb: '«denne», «dette», «disse»',
    explanationEn:
      'Demonstratives agree with the noun they point to: denne (en/ei-nouns, sg.), dette ' +
      '(et-nouns, sg.), disse (all genders, pl.). "Denne genseren er fin." "Dette skjerfet er på ' +
      'tilbud." "Disse skoene passer."',
    explanationNb:
      'Påpekende pronomen samsvarer med substantivet de peker på: denne (en/ei-ord, entall), ' +
      'dette (et-ord, entall), disse (alle kjønn, flertall). "Denne genseren er fin." "Dette ' +
      'skjerfet er på tilbud." "Disse skoene passer."'
  },

  imperativ: {
    id: 'imperativ',
    titleEn: 'The imperative',
    titleNb: 'Imperativ',
    explanationEn:
      'The imperative is just the verb stem — the infinitive minus its final -e — with no ' +
      'subject and no ending: "Du må huske stor bokstav." → "Husk stor bokstav!" "Dere må ' +
      'snakke norsk." → "Snakk norsk!"',
    explanationNb:
      'Imperativ er bare verbstammen — infinitiv uten den siste -en — uten subjekt og uten ' +
      'ending: "Du må huske stor bokstav." → "Husk stor bokstav!" "Dere må snakke norsk." → ' +
      '"Snakk norsk!"'
  },

  'possessiver-min-din': {
    id: 'possessiver-min-din',
    titleEn: 'Possessives (min, din, hans, hennes, vår, deres)',
    titleNb: 'Possessiver (eiendomsord)',
    explanationEn:
      'Possessives agree with the possessed noun\'s gender/number (min/mi/mitt/mine, ' +
      'din/di/ditt/dine, vår/vårt/våre) and, in everyday spoken Norwegian, normally FOLLOW the ' +
      'noun: "leiligheten min," not "min leilighet." hans, hennes, and deres never inflect.',
    explanationNb:
      'Possessiver samsvarer med det eide substantivets kjønn/tall (min/mi/mitt/mine, ' +
      'din/di/ditt/dine, vår/vårt/våre) og står i vanlig talespråk normalt ETTER substantivet: ' +
      '"leiligheten min," ikke "min leilighet." hans, hennes og deres bøyes aldri.'
  },

  'refleksivt-possessiv-sin': {
    id: 'refleksivt-possessiv-sin',
    titleEn: '«sin/sitt/sine» vs. «hans/hennes»',
    titleNb: '«sin/sitt/sine» og «hans/hennes»',
    explanationEn:
      'Use sin/sitt/sine when the possessor IS the sentence\'s subject: "Bianca vasker ' +
      'leiligheten sin" (her own apartment). Use hans/hennes when the possessor is someone ELSE: ' +
      '"Bianca sitter i bilen hennes" (someone else\'s car).',
    explanationNb:
      'Bruk sin/sitt/sine når eieren ER setningens subjekt: "Bianca vasker leiligheten sin" (sin ' +
      'egen leilighet). Bruk hans/hennes når eieren er noen ANNEN: "Bianca sitter i bilen ' +
      'hennes" (en annens bil).'
  },

  'ja-jo': {
    id: 'ja-jo',
    titleEn: '«ja» vs. «jo»',
    titleNb: '«ja» og «jo»',
    explanationEn:
      'Answer a positive question with «ja». Answer a NEGATIVE question, or contradict a ' +
      'negative statement, affirmatively with «jo», never «ja»: "Er du ikke sulten?" → "Jo, det ' +
      'er jeg." "Du liker ikke fisk." → "Jo, jeg liker fisk."',
    explanationNb:
      'Svar på et positivt spørsmål med «ja». Svar bekreftende på et NEGATIVT spørsmål, eller ' +
      'motsi en negativ påstand, med «jo», aldri «ja»: "Er du ikke sulten?" → "Jo, det er jeg." ' +
      '"Du liker ikke fisk." → "Jo, jeg liker fisk."'
  },

  'preteritum-a1': {
    id: 'preteritum-a1',
    titleEn: 'Preteritum (simple past) — introduction',
    titleNb: 'Preteritum — introduksjon',
    explanationEn:
      'Regular verbs add -et, -te, or -a in preteritum: bodde, flyttet, lærte. A handful of very ' +
      'common verbs are irregular and must simply be memorized: være→var, ha→hadde, gå→gikk, ' +
      'komme→kom, ta→tok, si→sa.',
    explanationNb:
      'Regelrette verb får -et, -te eller -a i preteritum: bodde, flyttet, lærte. Noen svært ' +
      'vanlige verb er uregelmessige og må pugges: være→var, ha→hadde, gå→gikk, komme→kom, ' +
      'ta→tok, si→sa.'
  },

  'for-a-fordi': {
    id: 'for-a-fordi',
    titleEn: '«for å» vs. «fordi»',
    titleNb: '«for å» og «fordi»',
    explanationEn:
      '«For å» + infinitive states a PURPOSE: "Jeg går til byen for å handle." «Fordi» + a full ' +
      'clause with its own subject and verb states a CAUSE: "Jeg går til byen fordi jeg trenger ' +
      'mat."',
    explanationNb:
      '«For å» + infinitiv uttrykker en HENSIKT: "Jeg går til byen for å handle." «Fordi» + en ' +
      'hel setning med eget subjekt og verb uttrykker en ÅRSAK: "Jeg går til byen fordi jeg ' +
      'trenger mat."'
  },

  'vaer-det-subjekt': {
    id: 'vaer-det-subjekt',
    titleEn: 'Impersonal «det» (weather, general statements)',
    titleNb: 'Upersonlig «det» (vær, allmenne utsagn)',
    explanationEn:
      'Weather expressions and many general statements need a dummy subject «det», with no ' +
      'real-world referent — it can never be dropped the way English sometimes drops "it": ' +
      '"Det regner." "Det blåser." "Det er kaldt i dag."',
    explanationNb:
      'Vær og mange allmenne utsagn trenger et formelt subjekt «det», uten noen egentlig ' +
      'referent — det kan aldri utelates: "Det regner." "Det blåser." "Det er kaldt i dag."'
  },

  'indirekte-tale-at-om': {
    id: 'indirekte-tale-at-om',
    titleEn: 'Reported speech: «at» vs. «om»',
    titleNb: 'Referert tale: «at» og «om»',
    explanationEn:
      'Report a STATEMENT with «at»: "Det er kaldt ute." → "Han sier at det er kaldt ute." ' +
      'Report a YES/NO QUESTION with «om»: "Skal du ut?" → "Han spør om hun skal ut." A ' +
      'wh-question keeps its own question word instead of «om»: "Hvor bor du?" → "Han spør hvor ' +
      'hun bor."',
    explanationNb:
      'Referer en PÅSTAND med «at»: "Det er kaldt ute." → "Han sier at det er kaldt ute." Referer ' +
      'et JA/NEI-SPØRSMÅL med «om»: "Skal du ut?" → "Han spør om hun skal ut." Et ' +
      'spørreordspørsmål beholder sitt eget spørreord i stedet for «om»: "Hvor bor du?" → "Han ' +
      'spør hvor hun bor."'
  },

  'synes-tror': {
    id: 'synes-tror',
    titleEn: '«synes» vs. «tror»',
    titleNb: '«synes» og «tror»',
    explanationEn:
      '«Synes» gives an OPINION about something you can directly perceive or judge — taste, ' +
      'looks, quality: "Jeg synes kaka er god." «Tror» expresses a BELIEF or uncertainty about a ' +
      'fact: "Jeg tror hun kommer senere."',
    explanationNb:
      '«Synes» gir en MENING om noe du kan sanse eller vurdere direkte — smak, utseende, ' +
      'kvalitet: "Jeg synes kaka er god." «Tror» uttrykker TRO eller usikkerhet om et faktum: ' +
      '"Jeg tror hun kommer senere."'
  },

  // ── Nivå C topics (Plus only) ──────────────────────────────────────────────────────────────

  'ubestemt-artikkel-c': {
    id: 'ubestemt-artikkel-c',
    titleEn: 'Indefinite article — advanced cases',
    titleNb: 'Ubestemt artikkel — avanserte tilfeller',
    explanationEn:
      'Professions/nationalities after «være»/«bli» drop the article ("Hun er lærer"), but an ' +
      'adjective forces it back in ("Hun er en flink lærer"). Uncountable nouns (mat, drikke, ' +
      'snø) normally take no article even with an adjective; adding one changes the meaning to a ' +
      'countable unit. Means of transport after «med» drops the article ("med fly"), restored by ' +
      'an adjective. Many fixed uttrykk (gå på kino) also drop the article, restored by an ' +
      'adjective. A few verbs make the article optional: "Jeg skal kjøpe (en) bil."',
    explanationNb:
      'Yrker/nasjonaliteter etter «være»/«bli» har ingen artikkel ("Hun er lærer"), men et ' +
      'adjektiv krever artikkel igjen ("Hun er en flink lærer"). Ikke-tellelige substantiv (mat, ' +
      'drikke, snø) har vanligvis ingen artikkel selv med adjektiv; med artikkel blir det en ' +
      'tellbar enhet. Transportmiddel etter «med» har ingen artikkel ("med fly"), gjeninnført av ' +
      'adjektiv. Mange faste uttrykk (gå på kino) dropper også artikkelen, gjeninnført av ' +
      'adjektiv. Noen verb gjør artikkelen valgfri: "Jeg skal kjøpe (en) bil."'
  },

  'substantiv-uttrykk-c': {
    id: 'substantiv-uttrykk-c',
    titleEn: 'Noun forms inside fixed idioms',
    titleNb: 'Substantivformer i faste uttrykk',
    explanationEn:
      'Many fixed idioms use a noun in one specific form only, and getting that form wrong ' +
      'changes or breaks the expression: "ta hånd om" (take care of), "stå til liv" (attempt to ' +
      'kill), "gå som fot i hose" (fit perfectly), "holde hodet over vannet" (stay afloat ' +
      'financially), "få kalde føtter", "slå hånd av" (disown). This means recognizing the idiom, ' +
      'not just applying the regular gender/plural rule.',
    explanationNb:
      'Mange faste uttrykk bruker et substantiv i én bestemt form, og feil form endrer eller ' +
      'ødelegger uttrykket: «ta hånd om», «stå til liv», «gå som fot i hose», «holde hodet over ' +
      'vannet», «få kalde føtter», «slå hånd av». Å produsere riktig form her betyr å kjenne igjen ' +
      'uttrykket, ikke bare å bruke den vanlige kjønns-/flertallsregelen.'
  },

  'sammensatte-substantiv': {
    id: 'sammensatte-substantiv',
    titleEn: 'Compound noun formation',
    titleNb: 'Å lage sammensatte substantiv',
    explanationEn:
      'Norwegian regularly builds precise compound nouns from a descriptive phrase: "problemer ' +
      'med søvnen" → søvnproblemer, "en person som gir råd" → rådgiver, "frekvensen av selvmord" ' +
      '→ selvmordsfrekvensen. Getting it right requires choosing the correct linking form (with ' +
      'or without -s-) and knowing which element comes first.',
    explanationNb:
      'Norsk bygger jevnlig presise sammensatte substantiv fra en beskrivende frase: «problemer ' +
      'med søvnen» → søvnproblemer, «en person som gir råd» → rådgiver, «frekvensen av selvmord» ' +
      '→ selvmordsfrekvensen. Å lage riktig sammensetning krever å velge riktig bindeform (med ' +
      'eller uten -s-) og å vite hvilket ledd som kommer først.'
  },

  'adj-mer-mest': {
    id: 'adj-mer-mest',
    titleEn: 'Adjectives compared with mer/mest',
    titleNb: 'Adjektiv som gradbøyes med mer/mest',
    explanationEn:
      'Several adjective classes never take -ere/-est: adjectives ending in -isk (praktisk), ' +
      'past/present participles (kjent, levende), adjectives ending in -et/-ete, -en, some -e, ' +
      '-iv, -ær, and most long/borrowed adjectives (interessant, fleksibel).',
    explanationNb:
      'Flere adjektivklasser tar aldri -ere/-est: adjektiv på -isk (praktisk), partisipper ' +
      '(kjent, levende), adjektiv på -et/-ete, -en, noen på -e, -iv, -ær, og de fleste ' +
      'lange/importerte adjektiv (interessant, fleksibel).'
  },

  'adj-farger-uboyelige': {
    id: 'adj-farger-uboyelige',
    titleEn: 'Invariable color adjectives',
    titleNb: 'Ubøyelige fargeadjektiv',
    explanationEn:
      'Several color adjectives borrowed from nouns never inflect for gender, number, or ' +
      'definiteness: oransje, lilla, rosa, beige. "en oransje bil," "et oransje hus," "de oransje ' +
      'bilene" — always the same form, unlike native color adjectives (rød, blå, grønn).',
    explanationNb:
      'Flere fargeadjektiv lånt fra substantiv bøyes aldri i kjønn, tall eller bestemthet: ' +
      'oransje, lilla, rosa, beige. «en oransje bil», «et oransje hus», «de oransje bilene» — ' +
      'alltid samme form, i motsetning til opprinnelige fargeadjektiv (rød, blå, grønn).'
  },

  'adj-partisipp-som-adjektiv': {
    id: 'adj-partisipp-som-adjektiv',
    titleEn: 'Participles as adjectives — irregular predikativ forms',
    titleNb: 'Partisipp som adjektiv — uregelmessig predikativform',
    explanationEn:
      "Participles used as adjectives sometimes take irregular predikativ forms that don't " +
      'follow the normal -t/-e pattern: "skvetten" (startled) → "Han er skvetten," not "skvett"; ' +
      '"sunget" stays "sunget" in predikativ; "stjålet" (stolen) takes an irregular -et form. ' +
      'Learned case by case, not derived from a rule.',
    explanationNb:
      'Partisipp brukt som adjektiv tar noen ganger uregelmessige predikativformer som ikke ' +
      'følger det vanlige -t/-e-mønsteret: «skvetten» → «Han er skvetten», ikke «skvett»; ' +
      '«sunget» forblir «sunget» i predikativ; «stjålet» tar en uregelmessig -et-form. Læres ' +
      'enkeltvis, ikke utledes fra en regel.'
  },

  'predikativ-agreement': {
    id: 'predikativ-agreement',
    titleEn: 'Predikativ adjective agreement',
    titleNb: 'Samsvarsbøyning av predikativ',
    explanationEn:
      'A predikativ adjective (after være, bli, hete, se … ut) never takes the definite -e ' +
      'ending. With an ubestemt subject, the predikativ goes in intetkjønn, not plural: ' +
      '"Grønnsaker er sunt," not sunne — but a definite subject restores normal agreement: ' +
      '"Grønnsakene er sunne." Exceptions stay unbent: strong-verb -et participles (skrevet), ' +
      'weak-verb/passive participles (registrert), compound-verb participles (flislagt), and ' +
      'adjectives in fixed prepositional phrases (glad i, klar over, vant til).',
    explanationNb:
      'Et predikativt adjektiv (etter være, bli, hete, se … ut) bøyes aldri i bestemt form. Med ' +
      'ubestemt subjekt bøyes predikativet i intetkjønn, ikke flertall: «Grønnsaker er sunt», ' +
      'ikke sunne — men bestemt subjekt gir vanlig samsvar igjen: «Grønnsakene er sunne». Unntak: ' +
      '-et-partisipp av sterke verb (skrevet), partisipp av svake verb/passiv (registrert), ' +
      'sammensatte verbs partisipp (flislagt), og adjektiv i faste preposisjonsuttrykk (glad i, ' +
      'klar over, vant til).'
  },

  'verbform-i-kontekst': {
    id: 'verbform-i-kontekst',
    titleEn: 'Infinitive vs. presens across a sentence',
    titleNb: 'Infinitiv eller presens gjennom en setning',
    explanationEn:
      'Choosing between the bare infinitive (after modals, "pleier," "begynner") and the ' +
      'conjugated presens form is an A1/A2 rule, but applying it correctly across a long sentence ' +
      'with three or four verb slots at once is a genuine accuracy challenge at C level. ' +
      'Questions use the actual C-level verbs from `draft/c/grammar/25-39-verb.md` items 25–27 ' +
      '(cross-checked against `vocab-c.json`), not generic A1 verbs, so the vocabulary load ' +
      'matches the rest of the C-level content.',
    explanationNb:
      'Å velge mellom bar infinitiv (etter modale hjelpeverb, «pleier», «begynner») og bøyd ' +
      'presensform er en A1/A2-regel, men å bruke den riktig gjennom en lang setning med tre eller ' +
      'fire verbplasser samtidig er en reell presisjonsutfordring på nivå C. Spørsmålene bruker de ' +
      'faktiske nivå C-verbene fra `draft/c/grammar/25-39-verb.md` punkt 25–27 (kryssjekket mot ' +
      '`vocab-c.json`), ikke generiske A1-verb, slik at ordforrådet passer med resten av ' +
      'nivå-C-innholdet.'
  },

  'sterke-verb-c': {
    id: 'sterke-verb-c',
    titleEn: 'Rare strong verbs',
    titleNb: 'Sjeldne sterke verb',
    explanationEn:
      'A set of rarer strong verbs beyond the common A2/B1 list, with irregular ' +
      'preteritum/perfektum forms that must be memorized: bry seg (brydde/brøt), briste (brast), ' +
      'by (bød), gale (gol/galte), sige (seg), fyke (føk/føyk), kvekke (kvakk).',
    explanationNb:
      'Et sett med sjeldnere sterke verb utover den vanlige A2/B1-listen, med uregelmessige ' +
      'preteritum-/perfektumformer som må pugges: bry seg (brydde/brøt), briste (brast), by ' +
      '(bød), gale (gol/galte), sige (seg), fyke (føk/føyk), kvekke (kvakk).'
  },

  'perfektum-pluskvamperfektum': {
    id: 'perfektum-pluskvamperfektum',
    titleEn: 'Perfektum/pluskvamperfektum in context',
    titleNb: 'Perfektum/pluskvamperfektum i sammenheng',
    explanationEn:
      'Choosing correctly between preteritum, perfektum, and pluskvamperfektum in longer ' +
      'sentences, especially where a sentence adverbial (jo, faktisk, nettopp, ennå) or a fronted ' +
      'time expression forces a specific word order around the auxiliary verb.',
    explanationNb:
      'Å velge riktig mellom preteritum, perfektum og pluskvamperfektum i lengre setninger, ' +
      'særlig der et setningsadverbial (jo, faktisk, nettopp, ennå) eller et fronted tidsuttrykk ' +
      'tvinger fram en bestemt ordstilling rundt hjelpeverbet.'
  },

  'futurum-referert': {
    id: 'futurum-referert',
    titleEn: '2. futurum — reported/alleged action',
    titleNb: '2. futurum — referert/påstått handling',
    explanationEn:
      '"2. futurum" (skal + ha + perfektum partisipp) expresses a reported or alleged past action ' +
      "the speaker hasn't personally verified — an evidential construction typical of news " +
      'reporting: "Tyvene skal ha brutt mange av reglene" (The thieves are reported to have ' +
      'broken many rules).',
    explanationNb:
      '«2. futurum» (skal + ha + perfektum partisipp) uttrykker en referert eller påstått ' +
      'tidligere handling som taleren ikke selv har bekreftet — en evidensiell konstruksjon ' +
      'typisk for nyhetsspråk: «Tyvene skal ha brutt mange av reglene».'
  },

  'kondisjonalis-counterfactual': {
    id: 'kondisjonalis-counterfactual',
    titleEn: '1./2. kondisjonalis',
    titleNb: '1./2. kondisjonalis',
    explanationEn:
      '1. kondisjonalis (skulle + infinitiv) expresses an unfulfilled plan in the past ("Jeg ' +
      'skulle handle på Rema, men gjorde det ikke"). 2. kondisjonalis (ville/kunne + ha + ' +
      'perfektum partisipp), usually paired with a pluskvamperfektum om-clause, expresses a ' +
      'counterfactual: "Om jeg hadde vært rikere, ville jeg ha gjort mange ting annerledes."',
    explanationNb:
      '1. kondisjonalis (skulle + infinitiv) uttrykker en uoppfylt plan i fortid («Jeg skulle ' +
      'handle på Rema, men gjorde det ikke»). 2. kondisjonalis (ville/kunne + ha + perfektum ' +
      'partisipp), oftest kombinert med en pluskvamperfektum om-setning, uttrykker en ' +
      'kontrafaktisk situasjon: «Om jeg hadde vært rikere, ville jeg ha gjort mange ting ' +
      'annerledes.»'
  },

  'verbet-a-fa': {
    id: 'verbet-a-fa',
    titleEn: 'The verb «å få»',
    titleNb: 'Verbet «å få»',
    explanationEn:
      '«Få» covers many meanings: receiving (Hun fikk lønn), obtaining (De fikk barn), being ' +
      'subjected to (Han fikk lungebetennelse), being punished, being available for sale. As a ' +
      'hjelpeverb, «få + infinitiv» expresses obligation/resignation, simple future, or ' +
      'permission; «få + perfektum partisipp» expresses a future completed action or that ' +
      'something was successfully accomplished.',
    explanationNb:
      '«Få» dekker mange betydninger: å motta (Hun fikk lønn), å skaffe seg (De fikk barn), å bli ' +
      'utsatt for (Han fikk lungebetennelse), å bli straffet, å være til salgs. Som hjelpeverb ' +
      'uttrykker «få + infinitiv» tvang/resignasjon, enkel framtid eller tillatelse; «få + ' +
      'perfektum partisipp» uttrykker en framtidig avsluttet handling eller at noe ble ' +
      'gjennomført.'
  },

  'leddsetning-som-fundament': {
    id: 'leddsetning-som-fundament',
    titleEn: 'A subordinate clause as the front field',
    titleNb: 'Leddsetning som setningens fundament',
    explanationEn:
      "When a whole subordinate clause fills the sentence's front field, the main clause verb " +
      'still comes second, but the resulting word order — and the placement of sentence ' +
      'adverbials like jo/faktisk/egentlig inside the main clause — trips up even strong ' +
      'learners: "Det handler om hva man egentlig mener man skal bygge opp skolen rundt."',
    explanationNb:
      'Når en hel leddsetning fyller setningens fundamentplass, kommer hovedsetningens verb ' +
      'likevel på andreplass, men den resulterende ordstillingen — og plasseringen av ' +
      'setningsadverbial som jo/faktisk/egentlig inne i hovedsetningen — snubler selv sterke ' +
      'innlærere: «Det handler om hva man egentlig mener man skal bygge opp skolen rundt.»'
  },

  'ordet-sa': {
    id: 'ordet-sa',
    titleEn: 'The word «så»',
    titleNb: 'Ordet «så»',
    explanationEn:
      '«Så» has three roles. As a KONJUNKSJON linking two main clauses, it expresses result with ' +
      'no word-order change. As a TIDSADVERB starting a new main clause ("Then …"), it triggers ' +
      'V2 inversion. As a SUBJUNKSJON introducing a leddsetning (≈ slik at), normal subordinate ' +
      'word order applies.',
    explanationNb:
      '«Så» har tre roller. Som KONJUNKSJON mellom to hovedsetninger uttrykker den følge uten ' +
      'endring i ordstilling. Som TIDSADVERB som innleder en ny hovedsetning ("Deretter …"), ' +
      'utløser den V2-inversjon. Som SUBJUNKSJON som innleder en leddsetning (≈ slik at), gjelder ' +
      'vanlig leddsetnings-ordstilling.'
  },

  'koordinerende-konjunksjoner': {
    id: 'koordinerende-konjunksjoner',
    titleEn: 'Coordinating conjunctions + comma rule',
    titleNb: 'Sideordningskonjunksjoner + kommaregel',
    explanationEn:
      'Choosing correctly among the five coordinating conjunctions (og, eller, men, for, så) ' +
      'based on meaning — addition, alternative, contrast, cause, result — plus the comma rule: ' +
      'a comma goes before a coordinating conjunction only when it joins two full main clauses, ' +
      'not two words or phrases.',
    explanationNb:
      'Å velge riktig blant de fem sideordningskonjunksjonene (og, eller, men, for, så) ut fra ' +
      'betydning — tillegg, alternativ, kontrast, årsak, følge — pluss kommaregelen: komma settes ' +
      'foran en sideordningskonjunksjon bare når den binder sammen to helsetninger, ikke to ord ' +
      'eller fraser.'
  },

  'ordfamilie-avledning': {
    id: 'ordfamilie-avledning',
    titleEn: 'Word-family derivation',
    titleNb: 'Avledning i ordfamilien',
    explanationEn:
      'Deriving the correct noun, verb, adjective, or adverb from a given word in the same word ' +
      'family, matching the required tense/form: from "berømme" (to praise) → berømmelse (noun), ' +
      'berømt (adjective); from "slite" → slitasje (noun), sliten / slitsom (adjective).',
    explanationNb:
      'Å avlede riktig substantiv, verb, adjektiv eller adverb fra et gitt ord i samme ordfamilie, ' +
      'tilpasset ønsket tid/form: fra «berømme» → berømmelse (substantiv), berømt (adjektiv); fra ' +
      '«slite» → slitasje (substantiv), sliten / slitsom (adjektiv).'
  },

  'omskriving-passiv': {
    id: 'omskriving-passiv',
    titleEn: 'Paraphrasing — passive voice',
    titleNb: 'Omskriving — passiv',
    explanationEn:
      'Rewriting an active sentence as a passive one (or vice versa) while preserving meaning: ' +
      '"Han skifter dekk på bilen" → "Bilens dekk blir skiftet av ham." Also covers turning a ' +
      'casual sentence into a more formal, nominalized paraphrase.',
    explanationNb:
      'Å skrive om en aktiv setning til en passiv (eller omvendt) og samtidig bevare betydningen: ' +
      '«Han skifter dekk på bilen» → «Bilens dekk blir skiftet av ham.» Dekker også det å gjøre en ' +
      'uformell setning om til en mer formell, nominalisert omskriving.'
  },

  'jo-desto-komparativ': {
    id: 'jo-desto-komparativ',
    titleEn: 'The jo…desto correlative comparative',
    titleNb: 'Korrelativkonstruksjonen jo … desto',
    explanationEn:
      'The correlative construction "jo + comparative … desto/jo + comparative" links two ' +
      'increasing/decreasing quantities: "Jo mer hun spiser, jo tykkere blir hun." Both clauses ' +
      'break normal V2 order — the verb comes directly after jo/desto.',
    explanationNb:
      'Korrelativkonstruksjonen «jo + komparativ … desto/jo + komparativ» binder sammen to ' +
      'økende/minkende størrelser: «Jo mer hun spiser, jo tykkere blir hun.» Begge setningsleddene ' +
      'bryter med vanlig V2 — verbet kommer rett etter jo/desto.'
  },

  'preposisjoner-kroppsdel-uttrykk': {
    id: 'preposisjoner-kroppsdel-uttrykk',
    titleEn: 'Body-part idioms with prepositions',
    titleNb: 'Kroppsdelsuttrykk med preposisjoner',
    explanationEn:
      'A large family of fixed idioms built around body-part nouns with specific prepositions: ' +
      '"kaste et blikk på" (glance at), "ha en knapp på" (favor), "sette fast" (corner someone), ' +
      '"ta beina på nakken" (flee), "ha øyne i nakken," "gå med krum hals" (submit reluctantly).',
    explanationNb:
      'En stor familie faste uttrykk bygget rundt kroppsdelsubstantiv med bestemte preposisjoner: ' +
      '«kaste et blikk på», «ha en knapp på», «sette fast», «ta beina på nakken», «ha øyne i ' +
      'nakken», «gå med krum hals».'
  },

  'preposisjoner-generelt-c': {
    id: 'preposisjoner-generelt-c',
    titleEn: 'Advanced idiomatic prepositions',
    titleNb: 'Avanserte idiomatiske preposisjoner',
    explanationEn:
      'Advanced, often idiomatic preposition choices beyond the A2/B1 time/place rules — fixed ' +
      'collocations with verbs and nouns that don\'t follow a predictable pattern: "gå ut på," ' +
      '"sette pris på," "komme til bunns i," "sette i sving," "stå til ansvar for."',
    explanationNb:
      'Avanserte, ofte idiomatiske preposisjonsvalg utover A2/B1s tids-/stedsregler — faste ' +
      'kollokasjoner med verb og substantiv som ikke følger et forutsigbart mønster: «gå ut på», ' +
      '«sette pris på», «komme til bunns i», «sette i sving», «stå til ansvar for».'
  },

  'uttrykk-gjenkjenning-c-1': {
    id: 'uttrykk-gjenkjenning-c-1',
    titleEn: 'Idiom recognition — part 1',
    titleNb: 'Gjenkjenning av faste uttrykk — del 1',
    explanationEn:
      'Recognizing what a fixed idiom actually means and matching it to the correct paraphrase: ' +
      '"Hun har fått kalde føtter" = she\'s getting cold feet (about a decision), not literally ' +
      'cold feet. "Skinnet bedrar" = appearances are deceiving. Norwegian idioms often don\'t ' +
      'translate literally, and several sound similar to unrelated ones ("gå på skinner" vs. ' +
      '"skinnet bedrar"), so the goal is precise recognition, not guessing from individual words. ' +
      'Part 1 covers the first third of the idiom set.',
    explanationNb:
      'Å kjenne igjen hva et fast uttrykk faktisk betyr og matche det med riktig omskriving: «Hun ' +
      'har fått kalde føtter» betyr at hun nøler med en beslutning, ikke bokstavelig kalde føtter. ' +
      '«Skinnet bedrar» betyr at det ytre lurer deg. Norske uttrykk kan ikke alltid oversettes ' +
      'direkte, og flere høres like ut som urelaterte uttrykk («gå på skinner» vs. «skinnet ' +
      'bedrar»), så målet er presis gjenkjenning, ikke gjetning ut fra enkeltord. Del 1 dekker ' +
      'den første tredjedelen av uttrykkssettet.'
  },

  'uttrykk-gjenkjenning-c-2': {
    id: 'uttrykk-gjenkjenning-c-2',
    titleEn: 'Idiom recognition — part 2',
    titleNb: 'Gjenkjenning av faste uttrykk — del 2',
    explanationEn:
      'Same skill as part 1 — matching a bolded fixed idiom to its correct paraphrase — covering ' +
      'the middle third of the idiom set.',
    explanationNb:
      'Samme ferdighet som del 1 — å matche et uthevet fast uttrykk med riktig omskriving — og ' +
      'dekker den midterste tredjedelen av uttrykkssettet.'
  },

  'uttrykk-gjenkjenning-c-3': {
    id: 'uttrykk-gjenkjenning-c-3',
    titleEn: 'Idiom recognition — part 3',
    titleNb: 'Gjenkjenning av faste uttrykk — del 3',
    explanationEn: 'Same skill as parts 1–2, covering the final third of the idiom set.',
    explanationNb: 'Samme ferdighet som del 1–2, og dekker den siste tredjedelen av uttrykkssettet.'
  }
};

export const GRAMMAR_RULE_LIST: GrammarRule[] = Object.values(GRAMMAR_RULES);
