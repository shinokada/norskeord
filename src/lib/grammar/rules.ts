import type { GrammarRule } from '$lib/types';

/**
 * Grammar rule definitions for the Grammar feature.
 * These are stored as a TS module (not JSON) because they contain
 * bilingual prose explanations that don't belong in the Paraglide catalogue.
 *
 * `titleEn`/`explanationEn` are unused at runtime everywhere (not just for
 * Nivå C) — grammar questions are Norwegian-only at every level as of
 * ai-docs/implementation/grammar-with-only-norsk.md. Kept only as a
 * possible future fallback; no schema change, smallest possible diff.
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
      'The "det" is a formal/anticipatory subject. The same pattern also fronts an ordinary ' +
      'subject for emphasis, with «som» instead of «at»: "Mange er bekymret." → "Det er mange ' +
      'som er bekymret." "Henrik fikk jobben." → "Det var Henrik som fikk jobben."',
    explanationNb:
      'Norsk kan flytte et leddsetnings-subjekt til slutten og begynne med "Det er … at/å …": ' +
      '"At du kan komme, er fint." → "Det er fint at du kan komme." ' +
      '"Det" er et formelt forutgripende subjekt. Samme mønster kan også fronte et vanlig subjekt ' +
      'for å fremheve det, med «som» i stedet for «at»: "Mange er bekymret." → "Det er mange som ' +
      'er bekymret." "Henrik fikk jobben." → "Det var Henrik som fikk jobben."'
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
      'sentence: "Mannen som bor her, er lege." "Boka som jeg leste, var god." When "som" is the ' +
      'object it can be dropped at a higher level ("Boka jeg leste, var god"), but at this level ' +
      'we always write "som" out. A relative clause is subordinate, so adverbs like "ikke" come ' +
      'BEFORE the verb: "en venn som ikke kommer".',
    explanationNb:
      '"som" innleder en relativsetning og står for subjektet eller objektet i den innfelte ' +
      'setningen: "Mannen som bor her, er lege." "Boka som jeg leste, var god." Når "som" er ' +
      'objekt, kan det på et høyere nivå sløyfes ("Boka jeg leste, var god"), men på dette nivået ' +
      'skriver vi alltid ut "som". En relativsetning er en leddsetning, så adverb som "ikke" ' +
      'kommer FØR verbet: "en venn som ikke kommer".'
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
      'For a fixed spatial relationship — i (inside), på (on/at), bak (behind), foran (in front of), ' +
      'under (under), over (above) — the choice stays the same whether something is standing still ' +
      'or being placed: "Boka ligger på bordet." "Katten ligger under stolen." ' +
      '«I» = inside an enclosed space: i skapet, i skogen, i banken, i en butikk. ' +
      '«På» = on a surface or open area, and for most workplaces: på bordet, på fjellet, på kontor, på skolen, på kafé. ' +
      'Geography: «i» for countries, cities, and regions (i Japan, i Bergen, i Nord-Norge); «på» for islands (på Mallorca, på Island) and Norwegian districts (på Vestlandet). ' +
      "«Hos» = at someone's place/premises (being there): «Jeg var hos legen.» To go TO someone, use «til»: «Jeg skal til legen.» " +
      '«Ved» = right next to: «De bor ved sjøen.» ' +
      'Relative/comparative position between two things or people uses «til venstre for» (to the ' +
      'left of), «til høyre for» (to the right of), and «mellom X og Y» (between X and Y): «Banken ' +
      'ligger til venstre for kirken.» «Butikken ligger mellom apoteket og biblioteket.» These ' +
      'behave like the fixed spatial prepositions above — same choice whether something is ' +
      'standing still or being placed. ' +
      'Possession: «bilen til Frida» (belonging to a person → «til»); «kongen i Norge» (geographic → «i»); «fargen på bilen» (property of a thing → «på»). ' +
      '«Av» = made of (material): «laget av tre.» «Fra» = coming from (origin): «fra hagen.» ' +
      'Compound prepositions: ved siden av (next to), i nærheten av (near), i stedet for (instead of), på grunn av (because of), ved hjelp av (with the help of).',
    explanationNb:
      'For et fast romlig forhold — i, på, bak, foran, under, over — er valget det samme enten noe ' +
      'står i ro eller blir plassert: «Boka ligger på bordet.» «Katten ligger under stolen.» ' +
      '«I» = innenfor et lukket rom: i skapet, i skogen, i banken, i en butikk. ' +
      '«På» = på overflaten eller et åpent område, og for de fleste arbeidsplasser: på bordet, på fjellet, på kontor, på skolen, på kafé. ' +
      'Geografi: «i» for land, byer og regioner (i Japan, i Bergen, i Nord-Norge); «på» for øyer (på Mallorca, på Island) og norske landsdeler (på Vestlandet). ' +
      '«Hos» = hos noen (man er der): «Jeg var hos legen.» For bevegelse til noen brukes «til»: «Jeg skal til legen.» ' +
      '«Ved» = like ved siden av: «De bor ved sjøen.» ' +
      'Relativ/sammenlignende plassering mellom to ting eller personer bruker «til venstre for», ' +
      '«til høyre for» og «mellom X og Y»: «Banken ligger til venstre for kirken.» «Butikken ' +
      'ligger mellom apoteket og biblioteket.» Dette følger samme mønster som de faste ' +
      'stedspreposisjonene over — samme valg enten noe står i ro eller blir plassert. ' +
      'Tilhørighet: «bilen til Frida» (tilhører en person → «til»); «kongen i Norge» (geografisk → «i»); «fargen på bilen» (egenskap ved ting → «på»). ' +
      '«Av» = laget av (materiale): «laget av tre.» «Fra» = kommer fra (opprinnelse): «fra hagen.» ' +
      'Sammensatte preposisjoner: ved siden av, i nærheten av, i stedet for, på grunn av, ved hjelp av.'
  },

  // ── Nivå A2 topics — see ai-docs/implementation/a2-quiz-and-grammar.md ─────────────────────────────

  'presens-perfektum': {
    id: 'presens-perfektum',
    titleEn: 'Presens perfektum (present perfect)',
    titleNb: 'Presens perfektum',
    explanationEn:
      'Presens perfektum = har/har ikke + perfektum partisipp: "Jeg har lest boka." Use it for ' +
      'completed actions relevant to an open/unfinished time frame (today, this week, "ever/never", ' +
      '"how long have you…"). Use preteritum instead for a closed past moment, usually with "i går" ' +
      'or "for … siden": "Jeg leste boka i går." Negative and never-answers: "Nei, jeg har ikke ' +
      'lest den." / "Nei, jeg har aldri lest den."',
    explanationNb:
      'Presens perfektum = har/har ikke + perfektum partisipp: "Jeg har lest boka." Brukes om ' +
      'avsluttede handlinger i en åpen/uavsluttet tidsramme (i dag, denne uka, "noen gang/aldri", ' +
      '"hvor lenge har du…"). Bruk preteritum for et avsluttet tidspunkt i fortida, ofte med "i går" ' +
      'eller "for … siden": "Jeg leste boka i går." Nekting og aldri-svar: "Nei, jeg har ikke lest ' +
      'den." / "Nei, jeg har aldri lest den."'
  },

  'derfor-fordi': {
    id: 'derfor-fordi',
    titleEn: '«derfor» vs. «fordi»',
    titleNb: '«derfor» og «fordi»',
    explanationEn:
      '«Derfor» ("therefore") starts a new main clause expressing a RESULT, and triggers V2 ' +
      'inversion like any fronted adverbial: "Sofaen er for stor. Derfor vil hun selge den." ' +
      '«Fordi» ("because") introduces a subordinate clause expressing a CAUSE, with normal ' +
      'subject-before-verb order: "Hun vil selge sofaen fordi den er for stor."',
    explanationNb:
      '«Derfor» innleder en ny hovedsetning som uttrykker en FØLGE, og utløser V2-inversjon som ' +
      'ethvert fundamentplassert adverbial: "Sofaen er for stor. Derfor vil hun selge den." «Fordi» ' +
      'innleder en leddsetning som uttrykker en ÅRSAK, med vanlig subjekt-før-verb-rekkefølge: "Hun ' +
      'vil selge sofaen fordi den er for stor."'
  },

  kvantorer: {
    id: 'kvantorer',
    titleEn: 'Quantifiers: mye/mange, mer/flere',
    titleNb: 'Kvantorer (mengdeord)',
    explanationEn:
      'Use «mye»/«mer» with uncountable nouns (mat, tid, plass, arbeid): "Jeg har mye å gjøre." Use ' +
      '«mange»/«flere» with countable plural nouns (venner, oppgaver, stoler): "Jeg har mange ' +
      'venner." «Flere» also means "several more" (Vi trenger flere stoler), while «mer» means ' +
      '"more" of an uncountable amount (Vi trenger mer plass). The same countable/uncountable ' +
      'split repeats across the whole scale: «få»/«lite» are the low-quantity mirror of ' +
      '«mange»/«mye»; «noen» (countable: noen venner) vs. «noe» (uncountable: noe informasjon); ' +
      '«de fleste» (countable) vs. «det meste» (uncountable) parallel mest/flest; ' +
      '«mindre»/«færre» are the comparative mirror of «mer»/«flere».',
    explanationNb:
      'Bruk «mye»/«mer» med ikke-tellelige substantiv (mat, tid, plass, arbeid): "Jeg har mye å ' +
      'gjøre." Bruk «mange»/«flere» med tellelige substantiv i flertall (venner, oppgaver, stoler): ' +
      '"Jeg har mange venner." «Flere» betyr også "noen flere til" (Vi trenger flere stoler), mens ' +
      '«mer» betyr en større mengde av noe ikke-tellelig (Vi trenger mer plass). Det samme ' +
      'tellelig/ikke-tellelig-skillet gjentar seg over hele skalaen: «få»/«lite» er ' +
      'lavmengde-motstykket til «mange»/«mye»; «noen» (tellelig: noen venner) mot «noe» ' +
      '(ikke-tellelig: noe informasjon); «de fleste» (tellelig) mot «det meste» (ikke-tellelig) ' +
      'på samme måte som mest/flest; «mindre»/«færre» er komparativ-motstykket til «mer»/«flere».'
  },

  'modalverb-preteritum': {
    id: 'modalverb-preteritum',
    titleEn: 'Modal verbs in preteritum',
    titleNb: 'Modalverb i preteritum',
    explanationEn:
      'Modal verbs have irregular preteritum forms: kan→kunne, vil→ville, skal→skulle, må→måtte, ' +
      'bør→burde. Used as plain past tense ("Jeg måtte jobbe i går") and constantly in reported ' +
      'speech, where a present-tense modal statement or question shifts to its preteritum form: ' +
      '"Jeg må vente." → "Hun sa at hun måtte vente." "Skal jeg hjelpe?" → "Hun spurte om hun skulle ' +
      'hjelpe."',
    explanationNb:
      'Modalverb har uregelmessige preteritumsformer: kan→kunne, vil→ville, skal→skulle, må→måtte, ' +
      'bør→burde. Brukes som vanlig fortid ("Jeg måtte jobbe i går") og svært ofte i referert tale, ' +
      'der en presens-modalytring skifter til preteritumsform: "Jeg må vente." → "Hun sa at hun ' +
      'måtte vente." "Skal jeg hjelpe?" → "Hun spurte om hun skulle hjelpe."'
  },

  'plassering-verb': {
    id: 'plassering-verb',
    titleEn: 'Placement verbs: sette/legge vs. stå/ligge',
    titleNb: 'Plasseringsverb: sette/legge og stå/ligge',
    explanationEn:
      '"Sette" and "legge" describe the ACTION of placing something and take a direct object: ' +
      '"Han setter vasen på bordet." "Hun legger boka på bordet." "Stå" and "ligge" describe the ' +
      'resulting STATE afterwards and take no object: "Vasen står på bordet." "Boka ligger på ' +
      'bordet." Use sette/stå for upright objects, legge/ligge for flat ones.',
    explanationNb:
      'Sette og legge beskriver HANDLINGEN å plassere noe, og tar et objekt: "Han setter vasen på ' +
      'bordet." "Hun legger boka på bordet." Stå og ligge beskriver TILSTANDEN etterpå, og tar ikke ' +
      'objekt: "Vasen står på bordet." "Boka ligger på bordet." Bruk sette/stå om stående objekter, ' +
      'legge/ligge om liggende objekter.'
  },

  'refleksive-verb': {
    id: 'refleksive-verb',
    titleEn: 'Reflexive verbs: glede seg, grue seg, føle seg',
    titleNb: 'Refleksive verb: glede seg, grue seg, føle seg',
    explanationEn:
      'Some Norwegian verbs pair with a reflexive pronoun that changes with the subject: jeg gleder ' +
      'MEG, du gleder DEG, han/hun/de gleder SEG, vi gleder OSS, dere gleder DERE. Same pattern for ' +
      'grue seg (to dread) and føle seg (to feel).',
    explanationNb:
      'Noen norske verb tar et refleksivt pronomen som endrer seg med subjektet: jeg gleder MEG, du ' +
      'gleder DEG, han/hun/de gleder SEG, vi gleder OSS, dere gleder DERE. Samme mønster for grue ' +
      'seg og føle seg.'
  },

  'ha-vs-vaere': {
    id: 'ha-vs-vaere',
    titleEn: '«ha» vs. «være» for states',
    titleNb: '«ha» og «være» for tilstander',
    explanationEn:
      'Norwegian uses «ha» (to have) for symptoms/possession-shaped states — «ha vondt i» (to have ' +
      'pain in), «ha lyst på» (to feel like), «ha det bra» (to be doing well) — and «være» (to be) ' +
      'for adjective-shaped states: «være syk», «være sulten», «være i dårlig humør». Many ' +
      'English "to be" phrases map to Norwegian «ha»: "I have a headache" = "Jeg har vondt i hodet," ' +
      'not "Jeg er vondt."',
    explanationNb:
      'Norsk bruker «ha» for symptomer/eie-lignende tilstander — «ha vondt i», «ha lyst på», «ha ' +
      'det bra» — og «være» for adjektiv-tilstander: «være syk», «være sulten», «være i dårlig ' +
      'humør».'
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
      'infinitive instead needs «å»: "Jeg liker å lære norsk." Many verbs and adjectives instead ' +
      'take a fixed PREPOSITION before «å»: «bestemme seg for å», «ha lyst til å», «være ivrig ' +
      'etter å», «være opptatt med å» — while others take «for å» to express purpose, and a few ' +
      'take no preposition at all («jeg liker å», «det var umulig å»). These must be learned per ' +
      'expression, similar to how English varies ("decide to" vs. "look forward to -ing").',
    explanationNb:
      'Et andre verb rett etter et modalverb (kan, vil, skal, må) står i naken infinitiv, uten ' +
      '"å": "Jeg vil lære norsk." Etter verb som «like», «pleie», «prøve» trengs derimot «å»: ' +
      '"Jeg liker å lære norsk." Mange verb og adjektiv tar i stedet en fast PREPOSISJON foran ' +
      '«å»: «bestemme seg for å», «ha lyst til å», «være ivrig etter å», «være opptatt med å» — ' +
      'mens andre tar «for å» for å uttrykke hensikt, og noen få tar ingen preposisjon i det hele ' +
      'tatt («jeg liker å», «det var umulig å»). Disse må læres per uttrykk.'
  },

  'substantiv-bestemt-form': {
    id: 'substantiv-bestemt-form',
    titleEn: 'Definite noun form (singular)',
    titleNb: 'Substantiv i bestemt form (entall)',
    explanationEn:
      'To say "the X", Norwegian adds an ending to the noun instead of using a separate word: en ' +
      "kopp → koppen, ei uke → uka, et eple → eplet. The ending matches the noun's gender, the " +
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
      "Possessives agree with the possessed noun's gender/number (min/mi/mitt/mine, " +
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
      '"Bianca sitter i bilen hennes" (someone else\'s car). Exception: when the subject is a ' +
      'COMPOUND ("Han og kundene"), sin/sitt/sine can no longer refer back to just one part of ' +
      'it, so hans/hennes/deres is used instead: "Han og kundene hans liker å prate" (his ' +
      'customers), not "kundene sine".',
    explanationNb:
      'Bruk sin/sitt/sine når eieren ER setningens subjekt: "Bianca vasker leiligheten sin" (sin ' +
      'egen leilighet). Bruk hans/hennes når eieren er noen ANNEN: "Bianca sitter i bilen ' +
      'hennes" (en annens bil). Unntak: når subjektet er SAMMENSATT ("Han og kundene"), kan ikke ' +
      'sin/sitt/sine lenger vise tilbake til bare én del av det, så hans/hennes/deres brukes i ' +
      'stedet: "Han og kundene hans liker å prate" (kundene hans), ikke "kundene sine".'
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
      'hun bor." When the question word (hvem, hva, hvilken X) is itself the SUBJECT of the ' +
      'embedded clause, Norwegian inserts «som» directly after it: "Jeg vet ikke hvem som kommer ' +
      'i dag." "Han lurte på hva som hadde skjedd." No «som» is added when the question word is ' +
      'the OBJECT instead: "Jeg vet ikke hva han sier."',
    explanationNb:
      'Referer en PÅSTAND med «at»: "Det er kaldt ute." → "Han sier at det er kaldt ute." Referer ' +
      'et JA/NEI-SPØRSMÅL med «om»: "Skal du ut?" → "Han spør om hun skal ut." Et ' +
      'spørreordspørsmål beholder sitt eget spørreord i stedet for «om»: "Hvor bor du?" → "Han ' +
      'spør hvor hun bor." Når spørreordet (hvem, hva, hvilken X) selv er SUBJEKTET i den innfelte ' +
      'setningen, setter norsk inn «som» rett etter: "Jeg vet ikke hvem som kommer i dag." "Han ' +
      'lurte på hva som hadde skjedd." Det legges ikke til «som» når spørreordet i stedet er ' +
      'OBJEKTET: "Jeg vet ikke hva han sier."'
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

  // ── Nivå A1 topics (free), pt. 2 ── see ai-docs/implementation/a1-update.md ─────────────────

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
  },

  // ── Nivå B1 topics — see ai-docs/implementation/b1-grammar.md ─────────────────────────────

  'framtid-uttrykk': {
    id: 'framtid-uttrykk',
    titleEn: 'Expressing the future',
    titleNb: 'Å uttrykke framtid',
    explanationEn:
      'Norwegian has no single future tense — several expressions cover it, each with its own ' +
      'complementation: «skal» (plan/intention), «vil» (prediction/willingness), «kommer til å» ' +
      '(prediction based on evidence), and fixed expressions like «har tenkt å», «har lyst til å», ' +
      '«håper (at)», «vil helst/gjerne» — each requiring a specific preposition or none at all ' +
      'before the infinitive.',
    explanationNb:
      'Norsk har ingen egen framtidstid — flere uttrykk dekker det, hvert med sin egen ' +
      'komplementering: «skal» (plan/intensjon), «vil» (spådom/vilje), «kommer til å» (spådom basert ' +
      'på bevis), og faste uttrykk som «har tenkt å», «har lyst til å», «håper (at)», «vil ' +
      'helst/gjerne» — hver med sin egen preposisjon eller ingen foran infinitiv.'
  },

  'for-sa-arsak-folge': {
    id: 'for-sa-arsak-folge',
    titleEn: '«for» vs. «så» (coordinating cause/result)',
    titleNb: '«for» og «så» (sideordning: årsak/følge)',
    explanationEn:
      'Both join two full main clauses with no change in word order. «For» states the CAUSE, ' +
      'placed in the second clause: "Hun kommer ikke i morgen, for hun har det travelt." «Så» ' +
      'states the RESULT, also in the second clause: "Hun har det travelt, så hun kommer ikke i ' +
      'morgen." Choosing correctly means identifying which clause is the cause and which is the ' +
      'result, then placing «for»/«så» before the one that is NOT the cause-first clause.',
    explanationNb:
      'Begge binder sammen to helsetninger uten å endre ordstillingen. «For» uttrykker ÅRSAKEN, ' +
      'plassert i den andre setningen: "Hun kommer ikke i morgen, for hun har det travelt." «Så» ' +
      'uttrykker FØLGEN, også i den andre setningen: "Hun har det travelt, så hun kommer ikke i ' +
      'morgen."'
  },

  'da-naar': {
    id: 'da-naar',
    titleEn: '«da» vs. «når»',
    titleNb: '«da» og «når»',
    explanationEn:
      'Use «da» for a SINGLE completed event in the past: "Da jeg var femten, flyttet jeg til ' +
      'Norge." Use «når» for a REPEATED/habitual past event, or for anything present or future: ' +
      '"Når jeg var liten, lekte jeg ute hver dag." (repeated) "Ring meg når du får tid." (future) ' +
      'A common test: if you can substitute "hver gang" and it still makes sense, use «når»; if it ' +
      'describes one specific occasion, use «da».',
    explanationNb:
      'Bruk «da» om én avsluttet hendelse i fortiden: "Da jeg var femten, flyttet jeg til Norge." ' +
      'Bruk «når» om en gjentatt/vanemessig hendelse i fortiden, eller om noe i presens/framtid: ' +
      '"Når jeg var liten, lekte jeg ute hver dag." (gjentatt) "Ring meg når du får tid." (framtid) ' +
      'Enkel test: hvis du kan sette inn "hver gang" og det fortsatt gir mening, bruk «når»; ' +
      'gjelder det én bestemt anledning, bruk «da».'
  },

  'hvis-om-betingelse': {
    id: 'hvis-om-betingelse',
    titleEn: '«hvis» vs. «om» (condition vs. embedded question)',
    titleNb: '«hvis» og «om» (betingelse og leddsetning)',
    explanationEn:
      '«Hvis» introduces a CONDITION ("if"): "Jeg kommer hvis jeg har tid." «Om» introduces an ' +
      'embedded YES/NO QUESTION ("whether"): "Jeg vet ikke om jeg har tid." The two look similar ' +
      'because both can often be translated "if" in English, but only «hvis» states a condition — ' +
      '«om» always follows a verb of asking/knowing/wondering about an uncertain fact.',
    explanationNb:
      '«Hvis» innleder en BETINGELSE: "Jeg kommer hvis jeg har tid." «Om» innleder en leddsetning ' +
      'som gjengir et JA/NEI-SPØRSMÅL: "Jeg vet ikke om jeg har tid." De to ligner fordi begge ofte ' +
      'kan oversettes med engelsk "if", men bare «hvis» uttrykker en betingelse — «om» kommer alltid ' +
      'etter et verb som spør/vet/lurer på noe usikkert.'
  },

  'passiv-bli-s': {
    id: 'passiv-bli-s',
    titleEn: 'Passive voice: bli-passiv and s-passiv',
    titleNb: 'Passiv: bli-passiv og s-passiv',
    explanationEn:
      'Norwegian has two passive forms. «Bli-passiv» = bli (in the right tense) + perfektum ' +
      'partisipp: "Bildene blir delt på nettet." "Hun ble dømt." «S-passiv» adds -s directly to the ' +
      'infinitive stem, common with modals and in instructions: "Regningen må betales." "Hvor kan ' +
      'den bestilles?" Use passive when the ACTION matters more than who performs it — the original ' +
      'object becomes the new subject: "Noen plager ham." → "Han blir plaget."',
    explanationNb:
      'Norsk har to passivformer. «Bli-passiv» = bli (i riktig tid) + perfektum partisipp: "Bildene ' +
      'blir delt på nettet." "Hun ble dømt." «S-passiv» legger -s direkte til infinitivstammen, ' +
      'vanlig sammen med modalverb og i instruksjoner: "Regningen må betales." "Hvor kan den ' +
      'bestilles?" Bruk passiv når HANDLINGEN betyr mer enn hvem som utfører den — det opprinnelige ' +
      'objektet blir det nye subjektet: "Noen plager ham." → "Han blir plaget."'
  },

  'bade-og-verken-eller': {
    id: 'bade-og-verken-eller',
    titleEn: '«både … og» / «verken … eller»',
    titleNb: '«både … og» og «verken … eller»',
    explanationEn:
      '«Både X og Y» means "both X and Y" — a positive pairing: "Jeg liker både fotball og ski." ' +
      '«Verken X eller Y» means "neither X nor Y" — a negative pairing, and the verb stays ' +
      'affirmative (no extra «ikke» is added): "Jeg liker verken fotball eller ski."',
    explanationNb:
      '«Både X og Y» uttrykker en positiv sammenstilling: "Jeg liker både fotball og ski." «Verken ' +
      'X eller Y» uttrykker en negativ sammenstilling, og verbet forblir bekreftende (ingen ekstra ' +
      '«ikke» legges til): "Jeg liker verken fotball eller ski."'
  },

  'adjektiv-eller-adverb': {
    id: 'adjektiv-eller-adverb',
    titleEn: 'Adjective or adverb? (sikker/sikkert, god/godt)',
    titleNb: 'Adjektiv eller adverb?',
    explanationEn:
      'Many Norwegian adjectives share their neuter (-t) form with an adverb used to modify a verb. ' +
      'Use the AGREEING adjective form when describing a noun/subject: "Jeg er sikker på det." ' +
      '(sikker agrees with "jeg", masculine/feminine.) Use the -t form when modifying a VERB: "Det ' +
      'går sikkert bra." Same pattern: "Maten var god" (adjective, describes maten) vs. "Den ' +
      'smakte godt" (adverb, modifies smakte).',
    explanationNb:
      'Mange norske adjektiver deler intetkjønnsformen (-t) med et adverb som brukes til å beskrive ' +
      'et verb. Bruk den SAMSVARENDE adjektivformen når du beskriver et substantiv/subjekt: "Jeg er ' +
      'sikker på det." Bruk -t-formen når du beskriver et VERB: "Det går sikkert bra." Samme ' +
      'mønster: "Maten var god" (adjektiv, beskriver maten) mot "Den smakte godt" (adverb, beskriver ' +
      'smakte).'
  },

  'motsetning-selv-om-likevel': {
    id: 'motsetning-selv-om-likevel',
    titleEn: '«men» vs. «selv om» vs. «likevel»',
    titleNb: '«men», «selv om» og «likevel»',
    explanationEn:
      'Three ways to express the same contrast, each with different grammar. «Men» coordinates two ' +
      'main clauses, no word-order change: "De savner familien, men de vil bli her." «Selv om» ' +
      'subordinates the concession clause (normal subordinate word order, can go first or second): ' +
      '"Selv om de savner familien, vil de bli her." «Likevel» is a sentence adverb that fronts and ' +
      'triggers V2 inversion like any other fronted adverbial: "De savner familien. Likevel vil de ' +
      'bli her."',
    explanationNb:
      'Tre måter å uttrykke samme motsetning på, med ulik grammatikk. «Men» sideordner to ' +
      'helsetninger, ingen endring i ordstilling: "De savner familien, men de vil bli her." «Selv ' +
      'om» underordner innrømmelsesleddsetningen (vanlig leddsetningsordstilling, kan stå først ' +
      'eller sist): "Selv om de savner familien, vil de bli her." «Likevel» er et setningsadverb som ' +
      'fronter og utløser V2-inversjon som ethvert annet fundamentplassert adverbial: "De savner ' +
      'familien. Likevel vil de bli her."'
  },

  'tidssekvens-etter-at-etterpaa': {
    id: 'tidssekvens-etter-at-etterpaa',
    titleEn: '«etter at» vs. «etterpå» vs. «så»',
    titleNb: '«etter at», «etterpå» og «så»',
    explanationEn:
      'All three sequence two events, but behave differently. «Etter at» is a subjunction ' +
      'introducing a subordinate clause (normal subordinate word order): "Etter at jeg hadde spist, ' +
      'gikk jeg en tur." «Etterpå» is a sentence adverb — as its own clause opener it triggers V2 ' +
      'inversion: "Jeg spiste. Etterpå gikk jeg en tur." «Så» is a coordinating conjunction joining ' +
      'two main clauses with no inversion: "Jeg spiste, så gikk jeg en tur."',
    explanationNb:
      'Alle tre rekkefølger to hendelser, men oppfører seg ulikt. «Etter at» er en subjunksjon som ' +
      'innleder en leddsetning (vanlig leddsetningsordstilling): "Etter at jeg hadde spist, gikk jeg ' +
      'en tur." «Etterpå» er et setningsadverb — som setningsåpner utløser det V2-inversjon: "Jeg ' +
      'spiste. Etterpå gikk jeg en tur." «Så» er en sideordningskonjunksjon som binder sammen to ' +
      'helsetninger uten inversjon: "Jeg spiste, så gikk jeg en tur."'
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
      'Norwegian regularly builds precise compound nouns from a descriptive phrase: "en stol for ' +
      'barn" → barnestol, "miljøet på arbeidsplassen" → arbeidsmiljø — the same skill applies at ' +
      'a harder level with "problemer med søvnen" → søvnproblemer, "en person som gir råd" → ' +
      'rådgiver, "frekvensen av selvmord" → selvmordsfrekvensen. Getting it right requires ' +
      'choosing the correct linking form (with or without -s-) and knowing which element comes ' +
      'first.',
    explanationNb:
      'Norsk bygger jevnlig presise sammensatte substantiv fra en beskrivende frase: «en stol for ' +
      'barn» → barnestol, «miljøet på arbeidsplassen» → arbeidsmiljø — samme ferdighet brukes på ' +
      'et vanskeligere nivå med «problemer med søvnen» → søvnproblemer, «en person som gir råd» ' +
      '→ rådgiver, «frekvensen av selvmord» → selvmordsfrekvensen. Å lage riktig sammensetning ' +
      'krever å velge riktig bindeform (med eller uten -s-) og å vite hvilket ledd som kommer ' +
      'først.'
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
      'Questions use the actual C-level verbs from `draft/c/Norsk-for-deg/grammar25-39-verb.md` items 25–27 ' +
      '(cross-checked against `vocab-c.json`), not generic A1 verbs, so the vocabulary load ' +
      'matches the rest of the C-level content.',
    explanationNb:
      'Å velge mellom bar infinitiv (etter modale hjelpeverb, «pleier», «begynner») og bøyd ' +
      'presensform er en A1/A2-regel, men å bruke den riktig gjennom en lang setning med tre eller ' +
      'fire verbplasser samtidig er en reell presisjonsutfordring på nivå C. Spørsmålene bruker de ' +
      'faktiske nivå C-verbene fra `draft/c/Norsk-for-deg/grammar25-39-verb.md` punkt 25–27 (kryssjekket mot ' +
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
      'family, matching the required tense/form: from "trygg" (safe) → trygghet (noun); from ' +
      '"operere" (to operate) → operasjon (noun) — the same word-family skill applies at a ' +
      'harder level with "berømme" (to praise) → berømmelse (noun), berømt (adjective); from ' +
      '"slite" → slitasje (noun), sliten / slitsom (adjective). A word family often has a separate ' +
      'noun for the PERSON doing something, the PROCESS/activity itself, and the RESULT/product of ' +
      'it: "en produsent" (person) / "en produksjon" (process) / "et produkt" (result); "en baker" ' +
      '/ "en/ei baking" / "en bakst." Not every verb has all three as distinct words — some family ' +
      'members double up, e.g. "en/ei bygging" (process) vs. "en/ei bygning" (the physical ' +
      "building) — so picking the right one depends on the sentence's meaning, not a fixed pattern. " +
      'A related pattern derives a noun from a compound verb (particle verb): «-ing» (dele ut → ' +
      'utdeling), «-else» (oppleve → opplevelse), «-takelse/-tagelse» from «ta»-verbs (delta → ' +
      'deltakelse), «-sigelse» from «si»-verbs (si opp → oppsigelse), «-givelse» from «gi»-verbs (gi ' +
      'ut → utgivelse), and zero-derivation pairs (gå ut → en utgang, påstå → en påstand).',
    explanationNb:
      'Å avlede riktig substantiv, verb, adjektiv eller adverb fra et gitt ord i samme ordfamilie, ' +
      'tilpasset ønsket tid/form: fra «trygg» → trygghet (substantiv); fra «operere» → operasjon ' +
      '(substantiv) — samme ferdighet brukes på et vanskeligere nivå med «berømme» → berømmelse ' +
      '(substantiv), berømt (adjektiv); fra «slite» → slitasje (substantiv), sliten / slitsom ' +
      '(adjektiv). En ordfamilie har ofte et eget substantiv for PERSONEN som gjør noe, PROSESSEN/ ' +
      'aktiviteten selv, og RESULTATET/produktet av den: «en produsent» (person) / «en produksjon» ' +
      '(prosess) / «et produkt» (resultat); «en baker» / «en/ei baking» / «en bakst». Ikke alle verb ' +
      'har alle tre som egne ord — noen familiemedlemmer faller sammen, f.eks. «en/ei bygging» ' +
      '(prosess) mot «en/ei bygning» (selve bygget) — så riktig valg avhenger av setningens ' +
      'betydning, ikke et fast mønster. Et beslektet mønster avleder et substantiv fra et sammensatt ' +
      'verb (partikkelverb): «-ing» (dele ut → utdeling), «-else» (oppleve → opplevelse), ' +
      '«-takelse/-tagelse» fra «ta»-verb (delta → deltakelse), «-sigelse» fra «si»-verb (si opp → ' +
      'oppsigelse), «-givelse» fra «gi»-verb (gi ut → utgivelse), og null-avledningspar (gå ut → en ' +
      'utgang, påstå → en påstand).'
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
  },

  // ── Nivå B2 topics (Plus only) — see ai-docs/implementation/b2-grammar.md ─────────────────

  'substantivert-adjektiv': {
    id: 'substantivert-adjektiv',
    titleEn: 'Nominalized adjectives (de unge, de fattige)',
    titleNb: 'Substantiverte adjektiv',
    explanationEn:
      'An adjective can stand alone as a noun referring to a group or type of people, using the ' +
      'same foranstilt bestemmer + weak adjective ending as normal definite noun phrases, but with ' +
      'no noun following: "de unge" (young people), "de fattige" (the poor), "den ansatte" (the ' +
      'employee). Singular "den"/"det" + adjective can refer to one person or an abstract quality ' +
      'depending on context; plural "de" + adjective always refers to a group of people.',
    explanationNb:
      'Et adjektiv kan stå alene som et substantiv og referere til en gruppe eller type mennesker, ' +
      'med samme foranstilte bestemmer + svak adjektivending som i vanlige bestemte substantivfraser, ' +
      'men uten et substantiv etter: «de unge», «de fattige», «den ansatte». Entall «den»/«det» + ' +
      'adjektiv kan vise til én person eller en abstrakt egenskap avhengig av sammenhengen; flertall ' +
      '«de» + adjektiv viser alltid til en gruppe mennesker.'
  },

  'motsetning-prefiks': {
    id: 'motsetning-prefiks',
    titleEn: 'Forming opposites with a negative prefix',
    titleNb: 'Å lage motsetninger med prefiks',
    explanationEn:
      'Several negative prefixes turn a word into its opposite instead of a different word ' +
      'entirely: «u-» (gift → ugift, lykke → ulykke, fornøyd → ufornøyd), «mis-» (fornøyd → ' +
      'misfornøyd, lykkes → mislykkes, forstå → misforstå, trives → mistrives), «van-» (vane → ' +
      'uvane, but also fixed forms like vanskjøtte). Which prefix fits depends on the specific ' +
      'word — this is lexical, not a single universal rule, so it must be checked word by word.',
    explanationNb:
      'Flere negative prefiks gjør et ord om til sin motsetning i stedet for et helt annet ord: ' +
      '«u-» (gift → ugift, lykke → ulykke, fornøyd → ufornøyd), «mis-» (fornøyd → misfornøyd, ' +
      'lykkes → mislykkes, forstå → misforstå, trives → mistrives), «van-» (blant annet i faste ' +
      'former som vanskjøtte). Hvilket prefiks som passer, avhenger av det enkelte ordet — dette er ' +
      'leksikalsk, ikke én universell regel, så det må sjekkes ord for ord.'
  },

  'subjunksjon-oversikt': {
    id: 'subjunksjon-oversikt',
    titleEn: 'Choosing among many subjunctions',
    titleNb: 'Å velge riktig subjunksjon',
    explanationEn:
      'Norwegian has many subjunctions that each introduce a leddsetning with a specific meaning: ' +
      '«da»/«når» (time), «fordi» (cause), «hvis»/«med mindre» (condition, incl. negative ' +
      'condition = "unless"), «selv om» (concession), «for at» (purpose, distinct from «fordi»), ' +
      '«før»/«etter at» (sequence), «som» (relative). Choosing correctly means reading the whole ' +
      'sentence for meaning first, then picking the subjunction that matches — several of these ' +
      'can superficially look interchangeable but express a completely different logical relation.',
    explanationNb:
      'Norsk har mange subjunksjoner som hver innleder en leddsetning med en bestemt betydning: ' +
      '«da»/«når» (tid), «fordi» (årsak), «hvis»/«med mindre» (betingelse, inkl. negativ betingelse ' +
      '= «unless»), «selv om» (innrømmelse), «for at» (hensikt, ulikt «fordi»), «før»/«etter at» ' +
      '(rekkefølge), «som» (relativ). Å velge riktig betyr å lese hele setningen for betydning ' +
      'først, og så velge subjunksjonen som passer — flere av disse kan se like ut ved første ' +
      'blikk, men uttrykker en helt ulik logisk sammenheng.'
  },

  'partisipp-former': {
    id: 'partisipp-former',
    titleEn: 'Presens partisipp and perfektum partisipp as adjective/adverbial',
    titleNb: 'Presens partisipp og perfektum partisipp som adjektiv/adverbial',
    explanationEn:
      'Presens partisipp (verb stem + -ende) can replace a «mens»-clause to describe manner: "Han ' +
      'løp hjem mens han skrek" → "Han løp skrikende hjem." It never inflects. Perfektum partisipp ' +
      'used adjectivally (den ansatte, en forberedt presentasjon) DOES inflect for agreement, like ' +
      'a normal adjective, unlike its use in perfektum tense (har ansatt) where it never inflects. ' +
      "When a weak verb's perfektum partisipp ends in -et, the plural/definite form usually adds " +
      '«-ete» or «-ede» (truet → de truede/truete), while a strong or irregular -et-verb instead ' +
      'takes «-ne» (stjålet → de stjålne). A handful of fixed sammensatte adjektiv are built the ' +
      'same way from a perfektum partisipp: halvspist, nymalt, bløtkokt.',
    explanationNb:
      'Presens partisipp (verbstamme + -ende) kan erstatte en «mens»-setning for å beskrive måte: ' +
      '«Han løp hjem mens han skrek» → «Han løp skrikende hjem.» Det bøyes aldri. Perfektum ' +
      'partisipp brukt som adjektiv (den ansatte, en forberedt presentasjon) BØYES i samsvar, som ' +
      'et vanlig adjektiv — ulikt bruken i perfektum tid (har ansatt), der det aldri bøyes. Når ' +
      'perfektum partisipp av et svakt verb ender på -et, får flertalls-/bestemt form vanligvis ' +
      '«-ete» eller «-ede» (truet → de truede/truete), mens et sterkt eller uregelmessig -et-verb i ' +
      'stedet tar «-ne» (stjålet → de stjålne). Noen faste sammensatte adjektiv er bygget på samme ' +
      'måte fra et perfektum partisipp: halvspist, nymalt, bløtkokt.'
  },

  'partikkelverb-los-fast': {
    id: 'partikkelverb-los-fast',
    titleEn: 'Particle verbs — loose vs. fixed compound',
    titleNb: 'Partikkelverb — løst eller fast sammensatt',
    explanationEn:
      'A particle verb written as two words (løst sammensatt: "sette over") usually has a literal, ' +
      'compositional meaning, while the same words written as one fixed compound (fast sammensatt: ' +
      '"oversette") often has a different, idiomatic meaning: "sette over kaffe" (brew coffee) vs. ' +
      '"oversette en bok" (translate a book). The stress pattern differs too — spoken emphasis on ' +
      'the particle for the loose form. Some particle verbs also form a fixed compound perfektum ' +
      'partisipp used adjectivally: "påkjørt" (run over), "nedsatt" (reduced), "utgått" (expired).',
    explanationNb:
      'Et partikkelverb skrevet som to ord (løst sammensatt: «sette over») har vanligvis en ' +
      'bokstavelig betydning, mens de samme ordene skrevet som ett fast sammensatt ord ofte har en ' +
      'annen, idiomatisk betydning: «sette over kaffe» mot «oversette en bok». Trykket er også ' +
      'ulikt — muntlig trykk på partikkelen i den løse formen. Noen partikkelverb danner også et ' +
      'fast sammensatt perfektum partisipp brukt som adjektiv: «påkjørt», «nedsatt», «utgått».'
  },

  'modalverb-betydning': {
    id: 'modalverb-betydning',
    titleEn: 'Choosing the right modal verb',
    titleNb: 'Å velge riktig modalverb',
    explanationEn:
      '«Kan» expresses ability or permission, «skal» expresses a plan/decision or an instruction ' +
      'from someone else, «vil» expresses desire or a prediction, «må» expresses necessity or ' +
      'obligation. In context, several can superficially seem to fit, but only one matches the ' +
      'actual meaning intended — e.g. "Skal vi lage kake?" (proposal) is different from "Vil du ' +
      'lage kake?" (asking about desire) and "Kan du lage kake?" (asking about ability/willingness).',
    explanationNb:
      '«Kan» uttrykker evne eller tillatelse, «skal» uttrykker en plan/beslutning eller en ' +
      'instruks fra noen andre, «vil» uttrykker ønske eller en spådom, «må» uttrykker nødvendighet ' +
      'eller plikt. I sammenheng kan flere se ut til å passe, men bare ett stemmer med den ' +
      'faktiske betydningen som er ment — f.eks. er «Skal vi lage kake?» (forslag) noe annet enn ' +
      '«Vil du lage kake?» (spør om ønske) og «Kan du lage kake?» (spør om evne/vilje).'
  },

  'sannsynlighet-uttrykk': {
    id: 'sannsynlighet-uttrykk',
    titleEn: 'Expressing probability',
    titleNb: 'Å uttrykke sannsynlighet',
    explanationEn:
      'Several expressions cover different degrees of certainty about something happening: «det er ' +
      'mulig at» (possible), «det er sannsynlig at» / «det er lite sannsynlig at» (likely/unlikely), ' +
      '«det kommer til å» (prediction, fairly confident), «det kan hende at» (might), «jeg tror»/«jeg ' +
      "antar» (I think/assume — speaker's own uncertain belief). Paraphrasing between them means " +
      'keeping the same degree of certainty, not just swapping in any probability phrase.',
    explanationNb:
      'Flere uttrykk dekker ulike grader av sikkerhet om at noe skal skje: «det er mulig at» ' +
      '(mulig), «det er sannsynlig at» / «det er lite sannsynlig at» (sannsynlig/usannsynlig), ' +
      '«det kommer til å» (spådom, ganske sikker), «det kan hende at» (kan skje), «jeg tror»/«jeg ' +
      'antar» (talerens egen usikre oppfatning). Å skrive om mellom dem betyr å beholde samme grad ' +
      'av sikkerhet, ikke bare bytte inn et hvilket som helst sannsynlighetsuttrykk.'
  },

  'bli-presens-partisipp': {
    id: 'bli-presens-partisipp',
    titleEn: '«bli» + presens partisipp (durative aspect)',
    titleNb: '«bli» + presens partisipp (utstrakt tid)',
    explanationEn:
      '«Bli» + presens partisipp emphasizes that an action or state stretches out over time, ' +
      'rather than being a single point: "Han må bli boende i Bergen" (stays living, ongoing), ' +
      '"De ble sittende og snakke sammen hele natta" (kept sitting and talking). Common with verbs ' +
      'like bo, sitte, ligge, stå — the presens partisipp form never inflects.',
    explanationNb:
      '«Bli» + presens partisipp understreker at en handling eller tilstand strekker seg over tid, ' +
      'i stedet for å være ett enkelt tidspunkt: «Han må bli boende i Bergen» (fortsetter å bo), ' +
      '«De ble sittende og snakke sammen hele natta» (fortsatte å sitte og snakke). Vanlig med verb ' +
      'som bo, sitte, ligge, stå — presens partisipp-formen bøyes aldri.'
  },

  'fa-perfektum-partisipp': {
    id: 'fa-perfektum-partisipp',
    titleEn: '«få» + perfektum partisipp (resultative)',
    titleNb: '«få» + perfektum partisipp (resultat i fokus)',
    explanationEn:
      '«Få» + perfektum partisipp puts the RESULT of an action in focus, especially whether it got ' +
      'successfully completed: "Fikk du lest avisa i dag?" (Did you manage to read the paper?) ' +
      '"Du må få levert artikkelen før fire" (make sure it gets delivered). Different from plain ' +
      'perfektum (har lest) — «få» adds the sense of managing to get something done, often against ' +
      'some obstacle or time pressure.',
    explanationNb:
      '«Få» + perfektum partisipp setter RESULTATET av en handling i fokus, særlig om den ble ' +
      'gjennomført: «Fikk du lest avisa i dag?» «Du må få levert artikkelen før fire.» Ulikt vanlig ' +
      'perfektum (har lest) — «få» legger til en følelse av å ha klart å gjennomføre noe, ofte mot ' +
      'en hindring eller et tidspress.'
  },

  'mene-synes-tro-tenke': {
    id: 'mene-synes-tro-tenke',
    titleEn: '«mene», «synes», «tro», «tenke»',
    titleNb: '«mene», «synes», «tro» og «tenke»',
    explanationEn:
      'All four can translate as English "think," but aren\'t interchangeable. «Mene» = hold a ' +
      'stated position/opinion: "Jeg mener at vi bør endre planen." «Synes» = have an impression or ' +
      'reaction, often about something experienced: "Jeg synes maten var god." «Tro» = believe or ' +
      'guess, with some uncertainty about a fact: "Jeg tror det blir sol i morgen." «Tenke» = ' +
      'ponder, have something in mind, or be about to say something: "Hva tenker du på?" "Jeg ' +
      'tenkte å ringe deg i kveld."',
    explanationNb:
      'Alle fire kan oversettes med engelsk «think», men er ikke utskiftbare. «Mene» = ha en uttalt ' +
      'holdning/mening: «Jeg mener at vi bør endre planen.» «Synes» = ha et inntrykk eller en ' +
      'reaksjon, ofte om noe man har opplevd: «Jeg synes maten var god.» «Tro» = tro eller gjette, ' +
      'med en viss usikkerhet om et faktum: «Jeg tror det blir sol i morgen.» «Tenke» = fundere, ha ' +
      'noe i tankene, eller være i ferd med å si noe: «Hva tenker du på?» «Jeg tenkte å ringe deg i ' +
      'kveld.»'
  },

  // ── Nivå B2 topics, round 2 (Plus only) — see ai-docs/implementation/b2-grammar-2.md ─────────

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

  'sammensatte-substantiv-b2': {
    id: 'sammensatte-substantiv-b2',
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
      'betydning (en brun ost), mens de samme ordene smeltet sammen til étt sammensatt ord får en ' +
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
    titleEn: '«Det» as formal/dummy subject, incl. cleft sentences',
    titleNb: '«Det» som formelt subjekt, inkl. utbryting med «det er/var … som»',
    explanationEn:
      "Norwegian sentences need a subject, and new or indefinite information usually shouldn't open " +
      'the sentence. «Det» fills the subject slot as an empty placeholder while the real (logical) ' +
      'subject — often indefinite — moves later in the sentence: "Det sitter noen elever i ' +
      'klasserommet," "Det ble utlyst en ledig stilling." The same construction applies to passive ' +
      'sentences with an indefinite logical subject: "Det snakkes mye om dette," "Det må gjøres ' +
      'noe." A related use is the cleft/emphasis construction «Det er/var X som …», which fronts and ' +
      'highlights one constituent: "Det var broren min som ringte" (not someone else). «Som» is ' +
      'required when the fronted element is the subject, and is usually dropped otherwise ("Det er ' +
      'deg jeg elsker"). The pattern is also common in spoken wh-questions: "Hvem var det som ' +
      'ringte?"',
    explanationNb:
      'Norske setninger trenger et subjekt, og ny eller ubestemt informasjon skal vanligvis ikke stå ' +
      'først i setningen. «Det» fyller subjektsplassen som en tom plassholder mens det virkelige ' +
      '(logiske) subjektet — ofte ubestemt — flyttes lenger ut i setningen: "Det sitter noen elever i ' +
      'klasserommet," "Det ble utlyst en ledig stilling." Samme konstruksjon gjelder passive ' +
      'setninger med et ubestemt logisk subjekt: "Det snakkes mye om dette," "Det må gjøres noe." En ' +
      'beslektet bruk er utbrytingskonstruksjonen «Det er/var X som …», som flytter fram og framhever ' +
      'ett ledd: "Det var broren min som ringte" (ikke noen andre). «Som» er påkrevd når det ' +
      'framhevede leddet er subjekt, og sløyfes vanligvis ellers ("Det er deg jeg elsker"). Mønsteret ' +
      'er også vanlig i muntlige hv-spørsmål: "Hvem var det som ringte?"'
  },

  'det-referanse': {
    id: 'det-referanse',
    titleEn: '«Det» referring back to a clause or predicate',
    titleNb: '«Det» som viser tilbake til en setning eller et predikat',
    explanationEn:
      'Beyond referring back to a specific neuter noun, «det» can point back to a whole clause, an ' +
      "adjective, or a previous verb phrase, regardless of the gender of what's being referred to: " +
      '"Er hun flink? — Ja, det er hun." "Jeg synes politikk er kjedelig, men det er ikke han." "Hun ' +
      'har mange planer, og det har jeg også." This cuts across the normal den/det/de gender-' +
      "agreement pattern, since «det» here isn't agreeing with a noun's gender at all.",
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
      "the ingen-forms can't be used. «All/alt» go with uncountable nouns (agreeing in gender), " +
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
      "preteritum`'s genuine past-time meaning.",
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
      '..." De beslæktede ønskeuttrykkene «skulle ønske (at) + preteritum/preteritum perfektum» og ' +
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
  },

  // ── Nivå B2/C topic — punctuation — see ai-docs/implementation/punctuation.md ─────────────────

  kommaregler: {
    id: 'kommaregler',
    titleEn: 'Comma rules (kommaregler)',
    titleNb: 'Kommaregler',
    explanationEn:
      'Two common comma rules. 1) Subordinate clause comma: when a subordinate clause is fronted ' +
      '(placed before the main clause), a comma goes right after it, before the main clause starts: ' +
      '"Selv om det regnet, gikk vi en tur." When the subordinate clause instead follows the main ' +
      'clause, no comma is needed: "Vi gikk en tur selv om det regnet." 2) List comma (oppramsing): ' +
      'items in a list are separated by commas, but NOT before the final item when it is joined by ' +
      '«og»/«eller»: "Hun kjøpte epler, bananer og pærer." — comma after «epler» and «bananer», but ' +
      'no comma before «og pærer».',
    explanationNb:
      'To vanlige kommaregler. 1) Komma ved leddsetning: når en leddsetning er flyttet foran ' +
      'helsetningen (fundamentplassert), settes det komma rett etter den, før helsetningen ' +
      'fortsetter: "Selv om det regnet, gikk vi en tur." Når leddsetningen i stedet kommer etter ' +
      'helsetningen, trengs det ikke komma: "Vi gikk en tur selv om det regnet." 2) Komma i ' +
      'oppramsing: elementer i en liste skilles med komma, men IKKE foran det siste elementet når ' +
      'det bindes sammen med «og»/«eller»: "Hun kjøpte epler, bananer og pærer." — komma etter ' +
      '«epler» og «bananer», men ikke komma foran «og pærer».'
  },

  // ── Nivå B2/C topics — "Det går bra!" (see ai-docs/implementation/b2-c-grammar.md) ──

  'nyanser-uttrykk': {
    id: 'nyanser-uttrykk',
    titleEn: 'Near-synonym discrimination',
    titleNb: 'Nyanseforskjeller mellom lignende ord',
    explanationEn:
      'Norwegian has many word groups that translate similarly into English but carry a real ' +
      'meaning difference in Norwegian, so only one fits a given context. Some pairs split by ' +
      'countability or register («tid» = time in general vs. «time» = a clock-hour vs. «gang» = an ' +
      'occurrence: «jeg har vært der mange ganger», not «mange tider»). Some are near-synonym ' +
      'adjectives with a tone difference («alvorlig» = stern/serious-looking vs. «seriøs» = ' +
      'sincere/professional). Some are single words with several unrelated senses that only context ' +
      'disambiguates («ryke»: literally «to smoke/emit smoke», but also «to snap» (a rope, a tendon), ' +
      '«to fall through» (a plan, a deal), or «to be knocked out» (a competition). An intensifying ' +
      'adverb like «såpass» («that much/so much») works the same way — one word, many shades ' +
      'depending on what it modifies. Getting these right means reading the whole sentence for ' +
      'meaning, not pattern-matching the surface word.',
    explanationNb:
      'Norsk har mange ordgrupper som oversettes likt til engelsk, men som har en reell ' +
      'betydningsforskjell på norsk, slik at bare étt av dem passer i en gitt sammenheng. Noen par ' +
      'skiller seg på tellelighet eller register («tid» = tid generelt mot «time» = en klokketime mot ' +
      '«gang» = en forekomst: «jeg har vært der mange ganger», ikke «mange tider»). Noen er ' +
      'nær-synonyme adjektiv med ulik tone («alvorlig» = streng/dyster i uttrykket mot «seriøs» = ' +
      'oppriktig/ordentlig). Noen er ett ord med flere urlånte betydninger som bare sammenhengen kan ' +
      'skille («ryke»: bokstavelig «avgi røyk», men også «å ryke» (et tau, en sene), «å falle ' +
      'gjennom» (en plan, en avtale), eller «å bli slått ut» (en konkurranse). Et forsterkende ' +
      'adverb som «såpass» fungerer på samme måte — étt ord, mange nyanser avhengig av hva det ' +
      'står til. Å treffe riktig krever å lese hele setningen for betydning, ikke å gjenkjenne ' +
      'overflateordet.'
  },

  'preposisjoner-uttrykk-b2': {
    id: 'preposisjoner-uttrykk-b2',
    titleEn: 'Idiomatic B2 preposition collocations',
    titleNb: 'Idiomatiske preposisjonsuttrykk på nivå B2',
    explanationEn:
      'Beyond the literal time/place rules, many common B2 verbs, nouns, and adjectives take a ' +
      'fixed preposition that has to be learned per expression, not derived from a general rule: ' +
      '«ta ansvar for», «ha inntrykk av», «være forberedt på», «komme på» (to remember), «kjempe ' +
      'for», «sette pris på», «bestemme (seg) for/over», «stemme på». These sit a notch below the ' +
      'more advanced/rarer idiomatic prepositions in `preposisjoner-generelt-c` — high-frequency ' +
      'everyday collocations rather than literary or specialist ones.',
    explanationNb:
      'Utover de bokstavelige tids-/stedsreglene tar mange vanlige B2-verb, -substantiv og ' +
      '-adjektiv en fast preposisjon som må læres per uttrykk, ikke utledes fra en generell regel: ' +
      '«ta ansvar for», «ha inntrykk av», «være forberedt på», «komme på», «kjempe for», «sette ' +
      'pris på», «bestemme (seg) for/over», «stemme på». Disse står et hakk under de mer avanserte/' +
      'sjeldnere idiomatiske preposisjonene i `preposisjoner-generelt-c` — høyfrekvente ' +
      'hverdagskollokasjoner snarere enn litterære eller fagspesifikke.'
  },

  'uttrykk-gjenkjenning-detgaarbra-c': {
    id: 'uttrykk-gjenkjenning-detgaarbra-c',
    titleEn: 'Idiom recognition — Det går bra!',
    titleNb: 'Gjenkjenning av faste uttrykk — Det går bra!',
    explanationEn:
      'Recognizing what a fixed idiom or ordtak actually means and matching it to the correct ' +
      'paraphrase — the same skill as `uttrykk-gjenkjenning-c-1/2/3`, drawn from a different, ' +
      'smaller idiom set. Norwegian idioms rarely translate literally, so the goal is precise ' +
      'recognition of the intended meaning, not guessing from individual words: «å få kalde ' +
      'føtter» means getting nervous about a decision, not literally cold feet; «ikke selge ' +
      'skinnet før bjørnen er skutt» means not promising something before it is certain.',
    explanationNb:
      'Å kjenne igjen hva et fast uttrykk eller ordtak faktisk betyr og matche det med riktig ' +
      'omskriving — samme ferdighet som `uttrykk-gjenkjenning-c-1/2/3`, hentet fra et annet, ' +
      'mindre uttrykkssett. Norske uttrykk kan sjelden oversettes direkte, så målet er presis ' +
      'gjenkjenning av den tiltenkte betydningen, ikke gjetning ut fra enkeltord: «å få kalde ' +
      'føtter» betyr å bli nervøs for en beslutning, ikke bokstavelig kalde føtter; «ikke selge ' +
      'skinnet før bjørnen er skutt» betyr å ikke love noe før man er sikker.'
  }
};

export const GRAMMAR_RULE_LIST: GrammarRule[] = Object.values(GRAMMAR_RULES);
