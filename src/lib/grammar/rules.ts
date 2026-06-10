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
  }
};

export const GRAMMAR_RULE_LIST: GrammarRule[] = Object.values(GRAMMAR_RULES);
