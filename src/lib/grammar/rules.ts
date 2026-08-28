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
 *
 * `explanationNb` formatting (see ExplanationText.svelte + ai-docs/
 * implementation/grammar-explanation-update.md, "Problem A"):
 * - A blank line ("\n\n") starts a new paragraph.
 * - A line starting with "• " is a bullet item; consecutive bullet lines
 *   become one list. Not every rule needs this — plain single-paragraph
 *   strings still render fine as-is, so migrate rules opportunistically.
 * - "**text**" anywhere renders bold — use to label a term/pattern (e.g.
 *   a suffix), not for general emphasis.
 * - More than 2 blocks auto-collapses behind a "Vis mer" toggle, showing
 *   only the intro paragraph by default.
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
      'To hovedregler for plassering av «ikke»:\n\n' +
      '• **hovedsetninger** — «ikke» kommer ETTER verbet: "Jeg liker ikke vinteren."\n' +
      '• **leddsetninger** (etter «at», «fordi», «hvis» osv.) — «ikke» kommer FØR verbet: "Jeg vet at han ikke liker vinteren."'
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
      'To bruksområder for «det er …» kløvningssetninger:\n\n' +
      '• **med «at»/«å»** — flytter et leddsetnings-subjekt til slutten, med «det» som formelt forutgripende subjekt: "At du kan komme, er fint." → "Det er fint at du kan komme."\n' +
      '• **med «som»** — fronter et vanlig subjekt for å fremheve det: "Mange er bekymret." → "Det er mange som er bekymret." "Henrik fikk jobben." → "Det var Henrik som fikk jobben."'
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
      'I hovedsetninger med "det er ikke" er rekkefølgen alltid det → er → ikke → adjektiv/substantiv: "Det er ikke sant."\n\n' +
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
      'I norske hovedsetninger må det bøyde verbet alltid stå på ANDRE PLASS.\n\n' +
      'Når setningen begynner med et adverbial, bytter subjektet og verbet plass: "I går gikk jeg til butikken."\n\n' +
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
      'Modalverb (kan, vil, skal, må, bør, får) følges direkte av naken infinitiv (uten «å»): "Jeg kan hjelpe deg." IKKE "Jeg kan å hjelpe deg."\n\n' +
      'I leddsetninger kommer «ikke» foran modalverbet: "…at jeg ikke kan hjelpe deg."'
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
      'I leddsetninger innledet av konjunksjoner (at, fordi, hvis, når, selv om, …):\n\n' +
      '• **ingen inversjon** — subjektet kommer alltid før verbet\n' +
      '• **adverbplassering** — adverb som «ikke», «alltid», «aldri» plasseres mellom subjekt og verb: "Jeg vet at hun alltid spiser frokost."'
  },

  'relative-som': {
    id: 'relative-som',
    titleEn: 'Relative clauses with "som"',
    titleNb: 'Relativsetninger med "som"',
    explanationEn:
      '"som" introduces a relative clause and stands for the subject or object of the embedded ' +
      'sentence: "Mannen som bor her, er lege." "Boka som jeg leste, var god." When "som" is the ' +
      'SUBJECT of the embedded clause it is always required ("en venn som ikke kommer" — "som" ' +
      'stands for "vennen"). When "som" is instead the OBJECT, it becomes optional at this level ' +
      'and both versions are correct: "Boka som jeg leste, var god" = "Boka jeg leste, var god." ' +
      'A relative clause is subordinate, so adverbs like "ikke" come BEFORE the verb regardless of ' +
      'whether "som" is written out: "en venn som ikke kommer", "en bok jeg ikke har lest". For a ' +
      'PLACE noun, «der» can replace «som … [preposition]», avoiding a stranded preposition at the ' +
      'end of the clause — more typical of formal/written style: "byen der jeg bor" = "byen som ' +
      'jeg bor i". «Der» only works for places, never for people or things.',
    explanationNb:
      '«Som» innleder en relativsetning og står for subjektet eller objektet i den innfelte ' +
      'setningen: "Mannen som bor her, er lege." "Boka som jeg leste, var god."\n\n' +
      '• Når «som» er SUBJEKT i leddsetningen, er det alltid obligatorisk: "en venn som ikke kommer" ("som" står for "vennen").\n' +
      '• Når «som» i stedet er OBJEKT, blir det valgfritt på dette nivået, og begge versjoner er riktige: "Boka som jeg leste, var god" = "Boka jeg leste, var god."\n' +
      '• En relativsetning er en leddsetning, så adverb som «ikke» kommer FØR verbet uansett om «som» skrives ut eller ikke: "en venn som ikke kommer", "en bok jeg ikke har lest".\n' +
      '• Foran et STEDSSUBSTANTIV kan «der» erstatte «som … [preposisjon]» og unngå en etterhengt preposisjon til slutt i setningen — mer typisk for formelt/skriftlig språk: "byen der jeg bor" = "byen som jeg bor i". «Der» fungerer bare om steder, aldri om personer eller ting.'
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
      'følger samme plasseringsregel som «ikke»:\n\n' +
      '• **hovedsetninger** — kommer ETTER det bøyde verbet: "Jeg går aldri dit."\n' +
      '• **leddsetninger** (etter at, fordi, hvis, når, …) — kommer FØR verbet: "Jeg vet at han aldri går dit."\n\n' +
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
      '"Vi har alltid fri på fredagen." → "På fredagen har vi alltid fri." ' +
      'The mirror-image question is what happens at the OTHER end of the sentence, the sluttfelt, ' +
      'when several adverbials of different types stack up there instead of fronting: the default ' +
      'order is STED before TID before ÅRSAK: "Historien handler om noe som skjedde langt herfra ' +
      '(sted) for lenge siden (tid)." "Jeg ble ferdig med søknaden innen fristen (tid) fordi du ' +
      'hjalp meg (årsak)."',
    explanationNb:
      'Når du flytter et adverbial (tid, sted, måte) til BEGYNNELSEN av en norsk hovedsetning, ' +
      'må subjektet og verbet bytte plass for å holde verbet på andreplass (V2-regelen).\n\n' +
      '• **enkelt verbal**: "Jeg har mange slektninger i Sverige." → "I Sverige har jeg mange slektninger."\n' +
      '• **hjelpeverb + infinitiv**: "Det skal være konsert her i mai." → "I mai skal det være konsert her."\n' +
      '• **med setningsadverbial**: adverbialet flyttes, subjekt/verb inverterer, men setningsadverbialet ' +
      '(alltid, aldri, ofte …) blir alltid stående mellom subjekt og verb: ' +
      '"Vi har alltid fri på fredagen." → "På fredagen har vi alltid fri."\n\n' +
      'Det motsatte spørsmålet er hva som skjer i den ANDRE enden av setningen, sluttfeltet, når flere ' +
      'ulike adverbial hoper seg opp der i stedet for å fronte: standardrekkefølgen er STED før TID før ' +
      'ÅRSAK: "Historien handler om noe som skjedde langt herfra (sted) for lenge siden (tid)." ' +
      '"Jeg ble ferdig med søknaden innen fristen (tid) fordi du hjalp meg (årsak)."'
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
      'To hovedregler for korte svar:\n\n' +
      '• **ja/nei** — svar på et positivt ja/nei-spørsmål\n' +
      '• **jo** — svar bekreftende på et NEGATIVT spørsmål, aldri «ja»: "Liker du ikke kaffe?" → "Jo, det gjør jeg."\n\n' +
      'Korte svar gjentar det bøyde verbet (eller «det gjør/er»): "Kommer du?" → "Ja, det gjør jeg." "Er du norsk?" → "Ja, det er jeg."'
  },

  // ── Phase 2: Morphology topics ────────────────────────────────────────────

  'noun-articles': {
    id: 'noun-articles',
    titleEn: 'Noun articles (en / et / ei)',
    titleNb: 'Substantivartikler (en / et / ei)',
    explanationEn:
      'Norwegian nouns have three genders: masculine (en), neuter (et), and feminine (ei). ' +
      'The indefinite article matches the noun’s gender: en bil, et hus, ei jente. ' +
      'When a noun states what the SUBJECT is, was, or will become — profession, nationality, ' +
      'life stage, and similar identity categories — Norwegian drops the article entirely: ' +
      '"Han er lærer." (He is a teacher.) "Han er chilener." (He is Chilean.) "Da jeg var barn, ' +
      'bodde jeg i Peru." But when the same noun refers to a DIFFERENT person than the subject ' +
      '(an object, not an identity statement), the article comes back: "Jeg traff en lærer." ' +
      '"Jeg kjenner en chilener." "Når jeg møter et barn, får jeg lyst til å jobbe i barnehage."',
    explanationNb:
      'Norske substantiver har tre kjønn: hankjønn (en), intetkjønn (et) og hunkjønn (ei). Den ubestemte artikkelen samsvarer med substantivets kjønn: en bil, et hus, ei jente.\n\n' +
      'Når substantivet forteller hva SUBJEKTET *er, var* eller vil *bli* — yrke, nasjonalitet, ' +
      'livsfase og lignende identitetskategorier — bruker vi ingen artikkel: "Han er lærer." ' +
      '"Han er chilener." "Da jeg var barn, bodde jeg i Peru."\n\n' +
      'Men når substantivet forteller om en ANNEN person enn subjektet (et objekt, ikke et ' +
      'identitetsutsagn), kommer artikkelen tilbake: "Jeg traff en lærer." "Jeg kjenner en ' +
      'chilener." "Når jeg møter et barn, får jeg lyst til å jobbe i barnehage."'
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
      'Flertallsbøyning av substantiv følger flere mønstre:\n\n' +
      '• **-er** — de fleste substantiver: en bil → biler\n' +
      '• **-r** — substantiver som ender på -e: en klasse → klasser\n' +
      '• **uendret** — mange korte intetkjønnsord har samme form i entall og flertall: et år → tre år, et barn → tre barn\n' +
      '• **uregelmessig** — en mann → menn, et barn → barn, en fot → føtter'
  },

  'noun-possessives': {
    id: 'noun-possessives',
    titleEn: 'Noun possessives (genitive -s)',
    titleNb: 'Substantivets genitiv (-s)',
    explanationEn:
      'Norwegian genitive adds -s directly to the noun or name with NO apostrophe: ' +
      'Eriks bil, Annes jobb, barnets leker. ' +
      'An apostrophe before -s is an English habit — never use it in Norwegian: ' +
      'Erik’s → Eriks. The noun that follows a genitive -s is in the INDEFINITE form: ' +
      '"Petters jente" (not "Petters jenta"). But if an adjective comes between the genitive ' +
      'and the noun, that adjective takes the DEFINITE form: "Petters store jente" ' +
      '(not "Petters stor jente"). A genitive -s also expresses DURATION when attached to a ' +
      'time-measure word before a noun, meaning "an X-long Y" or "an X-long period of Y": ' +
      '"to ukers ferie" (a two-week vacation), "en times pause" (a one-hour break), "ti ' +
      'måneders permisjon" (ten months of leave). This still follows the same genitive -s rule ' +
      '— no apostrophe, the following noun stays indefinite.',
    explanationNb:
      'Norsk genitiv legger -s direkte til substantivet eller navnet UTEN apostrof: Eriks bil, Annes jobb, barnets leker.\n\n' +
      'Apostrof før -s er en engelsk vane — bruk den aldri på norsk: Erik’s → Eriks.\n\n' +
      'Substantivet etter genitiv-s står i UBESTEMT form: "Petters jente" (ikke "Petters jenta"). ' +
      'Men hvis det står et adjektiv imellom genitiven og substantivet, skal adjektivet stå i ' +
      'BESTEMT form: "Petters store jente" (ikke "Petters stor jente").\n\n' +
      'Genitiv-s kan også uttrykke VARIGHET når det legges til et tidsmåleord foran et ' +
      'substantiv, og betyr da "en X lang Y" eller "en periode på X med Y": "to ukers ferie" ' +
      '(ferie som varer i to uker), "en times pause" (en pause som varer i en time), "ti ' +
      'måneders permisjon" (permisjon som varer i ti måneder). Dette følger fortsatt samme ' +
      'genitiv-s-regel — ingen apostrof, og substantivet som følger står i ubestemt form.'
  },

  'adj-agreement': {
    id: 'adj-agreement',
    titleEn: 'Adjective agreement',
    titleNb: 'Adjektivbøyning',
    explanationEn:
      'Norwegian adjectives must agree with the noun they modify in gender and number. ' +
      'Indefinite singular: en stor bil, ei stor jente, et stort hus. ' +
      'Plural (all genders): store biler / store jenter / store hus. ' +
      'Note: liten is irregular — liten (en), lita (ei), lite (et), små (plural). ' +
      'Adjectives ending in -el, -er, or -en drop the -e- (and one consonant, if doubled) ' +
      'in the plural/definite form: gammel → gamle, vakker → vakre, sliten → slitne, ' +
      'sulten → sultne, diger → digre. «Sånn/sånt/sånne» and «slik/slikt/slike» ("such, ' +
      'that kind of") behave like adjectives and agree the same way — en-word: sånn/slik, ' +
      'et-word: sånt/slikt, plural: sånne/slike.',
    explanationNb:
      'Norske adjektiver må samsvare med substantivet de bøyer i kjønn og tall:\n\n' +
      '• **ubestemt entall** — en stor bil, ei stor jente, et stort hus\n' +
      '• **flertall (alle kjønn)** — store biler / store jenter / store hus\n\n' +
      'Merk: liten er uregelmessig — liten (en), lita (ei), lite (et), små (flertall).\n\n' +
      'Adjektiv som ender på -el, -er eller -en mister -e- (og én konsonant ved dobbeltkonsonant) ' +
      'i flertall/bestemt form: gammel → gamle, vakker → vakre, sliten → slitne, sulten → sultne, ' +
      'diger → digre.\n\n' +
      '«Sånn/sånt/sånne» og «slik/slikt/slike» ("sånn, den typen") oppfører seg som adjektiv og ' +
      'bøyes på samme måte: en-ord → sånn/slik, et-ord → sånt/slikt, flertall → sånne/slike.'
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
      'Når et substantiv står i bestemt form, får adjektivet svak (-e) ending OG krever den bestemte artikkelen den / det / de foran: den gamle mannen, det nye huset, de norske studentene.\n\n' +
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
      'gammel → eldre → eldst, liten → mindre → minst, tung → tyngre → tyngst ' +
      '(vowel shift, like ung → yngre → yngst). ' +
      'Use «enn» after comparatives: Oslo er større enn Bergen. When a superlative follows a ' +
      'definite-form noun with no separate article, it stays in the indefinite form: "Disse ' +
      'bøkene er best" (not "beste"). But with the article «de» before it, the definite form is ' +
      'required: "Disse bøkene er de beste" (not "de best"). ' +
      'A tricky irregular trio worth flagging: «lang» (adjective, physical/spatial length) compares ' +
      'lang → lengre → lengst ("Broren hennes er ti centimeter lengre enn henne" = her brother is ten ' +
      'centimeters taller than her); «langt» (adverb, distance/extent) compares the same way, langt → ' +
      'lengre → lengst ("Kan du stille deg litt lengre bak?" = can you stand a little further back?); but ' +
      '«lenge» (adverb, duration/time) has its own comparison, lenge → lenger → lengst ("Jeg vil ikke ' +
      'være her lenger" = I don\'t want to be here any longer). «Lengre» and «lenger» are NOT ' +
      'interchangeable — «lengre» covers physical length/distance (both the adjective and the ' +
      'distance-adverb), while «lenger» is reserved for TIME/duration.',
    explanationNb:
      'De fleste adjektiver danner komparativ med -ere og superlativ med -est: billig → billigere → billigst.\n\n' +
      'Noen er uregelmessige:\n' +
      '• god → bedre → best\n' +
      '• dårlig → verre → verst\n' +
      '• gammel → eldre → eldst\n' +
      '• liten → mindre → minst\n' +
      '• tung → tyngre → tyngst (vokalskifte, som ung → yngre → yngst)\n\n' +
      'Bruk «enn» etter komparativ: Oslo er større enn Bergen.\n\n' +
      'Når superlativet står etter et substantiv i bestemt form uten egen artikkel, brukes den ' +
      'ubestemte formen: "Disse bøkene er best" (ikke "beste"). Med artikkelen «de» foran ' +
      'superlativet kreves derimot den bestemte formen: "Disse bøkene er de beste" (ikke "de best").\n\n' +
      'Et lurt uregelmessig trekløver er verdt å nevne:\n' +
      '• **lang** (adjektiv, fysisk/romlig lengde) gradbøyes lang → lengre → lengst: «Broren hennes er ti centimeter lengre enn henne.»\n' +
      '• **langt** (adverb, avstand/utstrekning) gradbøyes på samme måte, langt → lengre → lengst: «Kan du stille deg litt lengre bak?»\n' +
      '• **lenge** (adverb, varighet/tid) har sin egen gradbøyning, lenge → lenger → lengst: «Jeg vil ikke være her lenger.»\n\n' +
      '«Lengre» og «lenger» er IKKE ombyttbare — «lengre» dekker fysisk lengde/avstand (både adjektivet og avstandsadverbet), mens «lenger» er forbeholdt TID/varighet.'
  },

  'adj-boying-c': {
    id: 'adj-boying-c',
    titleEn: 'Adjective comparison and agreement (advanced)',
    titleNb: 'Adjektiv: gradbøying og samsvarsbøying (avansert)',
    explanationEn:
      'Two trickier adjective patterns at this level, beyond the basic -ere/-est rules:\n\n' +
      '1) Adjectives ending in unstressed -en (våken, gedigen, åpen) drop the -en before any ' +
      'ending: comparative våken → våknere, superlative våknest / (bestemt) våkneste; ' +
      'weak/definite form gedigen → gedigne (like åpen → åpne).\n\n' +
      '2) Adjectives ending in -ig (or -lig, -som) take -st rather than -est in the superlative: ' +
      'døsig → døsigst → (bestemt) døsigste, hånlig → hånligst → hånligste.\n\n' +
      'Perfektum partisipp used as an adjective (utslitt, irritert, opprømt) generally forms ' +
      'comparison periphrastically with mer/mest rather than -ere/-est: mer utslitt, ' +
      'not utslittere.\n\n' +
      'As always, a definite noun phrase needs both the article (den/det/de) and the weak ' +
      '-e ending on the adjective, and a predicative adjective with no following noun ' +
      'takes no ending at all: Sjefen var olm (not olmt/olme).',
    explanationNb:
      'To vanskeligere adjektivmønstre på dette nivået, utover de vanlige -ere/-est-reglene:\n\n' +
      '1) Adjektiv som ender på trykklett -en (våken, gedigen, åpen) mister -en før enhver ' +
      'endelse: komparativ våken → våknere, superlativ våknest / (bestemt) våkneste; ' +
      'svak/bestemt form gedigen → gedigne (som åpen → åpne).\n\n' +
      '2) Adjektiv som ender på -ig (eller -lig, -som) får -st i stedet for -est i superlativ: ' +
      'døsig → døsigst → (bestemt) døsigste, hånlig → hånligst → hånligste.\n\n' +
      'Perfektum partisipp brukt som adjektiv (utslitt, irritert, opprømt) gradbøyes ' +
      'som regel med mer/mest, ikke -ere/-est: mer utslitt, ikke utslittere.\n\n' +
      'Husk ellers: en bestemt substantivfrase trenger både artikkelen (den/det/de) og svak ' +
      '-e-ending på adjektivet, mens et predikativt adjektiv uten substantiv etter seg ' +
      'ikke får noen endelse i det hele tatt: Sjefen var olm (ikke olmt/olme).'
  },

  'sterke-verb': {
    id: 'sterke-verb',
    titleEn: 'Strong verbs (irregular past tense)',
    titleNb: 'Sterke verb (uregelmessig fortid)',
    explanationEn:
      'Strong verbs change their stem vowel in the preteritum rather than adding -et/-te. ' +
      'They must be learned individually. ' +
      'Common examples: gå → gikk, komme → kom, se → så, ta → tok, få → fikk, gi → ga, være → var. ' +
      'The past participle (used with «har») has its own form: gått, kommet, sett, tatt, fått, gitt, vært. ' +
      "When a strong verb's past participle ends in -et and is used as an adjective before a noun, " +
      'it declines like an adjective ending in -en ("en gammel → den gamle"): drop -et and add ' +
      '-en (indefinite) or -ne (definite/plural) — "en brukket fot" → "den brukne foten", ' +
      '"en revet lapp" → "den revne lappen", "et sprukket speil" → "det sprukne speilet".',
    explanationNb:
      'Sterke verb endrer stammevokalen i preteritum i stedet for å legge til -et/-te. De må læres hver for seg.\n\n' +
      '• gå → gikk (gått)\n' +
      '• komme → kom (kommet)\n' +
      '• se → så (sett)\n' +
      '• ta → tok (tatt)\n' +
      '• få → fikk (fått)\n' +
      '• gi → ga (gitt)\n' +
      '• være → var (vært)\n\n' +
      'Formen i parentes er perfektum partisipp, brukt med «har».\n\n' +
      'Når perfektum partisipp av et sterkt verb ender på -et og brukes som adjektiv foran et ' +
      'substantiv, bøyes det som et adjektiv som ender på -en ("en gammel → den gamle"): dropp ' +
      '-et og legg til -en (ubestemt) eller -ne (bestemt/flertall) — "en brukket fot" → "den brukne ' +
      'foten", "en revet lapp" → "den revne lappen", "et sprukket speil" → "det sprukne speilet".'
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
      'Norske helsetninger følger disse mønstrene:\n\n' +
      '• **fortellende**: det bøyde verbet er alltid på ANDRE PLASS (V2)\n' +
      '• **ja/nei-spørsmål**: bytt om subjekt og verb — «Du snakker norsk.» → «Snakker du norsk?»\n' +
      '• **spørresetninger med spørreord**: spørreordet står på første plass, verbet på andre — «Hvor bor du?»\n' +
      '• **nektelse**: «ikke» kommer ETTER det bøyde verbet i helsetninger\n' +
      '• **det som formelt subjekt**: når et ubestemt subjekt følger verbet, brukes «det» som formelt subjekt — «Det bor en mann her.»'
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
      'For seasons and parts of the day: «i» + indefinite noun = the specific instance (i høst, i kveld); «om» + definite noun = habitual/general (om høsten, om kvelden). ' +
      'Holidays behave differently: «i» + DEFINITE noun (i julen, i påsken, i pinsen) can refer to the past, present, OR future — the tense of the verb decides which: "Hva skal du gjøre i julen?" (future), "Hva gjorde dere i påsken i fjor?" (past), "I pinsen pleier vi å dra på tur" (general/habitual).',
    explanationNb:
      'Norsk skiller mellom flere tidspreposisjoner avhengig av hva du uttrykker:\n\n' +
      '• **i** = varighet (hvor lenge): «Hun har bodd her i to år.» Brukes også med årstall, måneder og navngitte perioder: i 1989, i april, i ferien\n' +
      '• **for … siden** = et tidspunkt i fortida: «De kom for to uker siden.» Brukes alltid med preteritum\n' +
      '• **om** = et fremtidig tidspunkt: «De kommer om fem minutter.»\n' +
      '• **til** + bestemt årstid = den kommende årstiden: «Til sommeren skal vi flytte.»\n' +
      '• **på** = hvor lang tid noe tok å fullføre: «Han leste boka på to timer.» Med «ikke» markerer «på» i stedet forløpt tid uten at noe har skjedd: «Jeg har ikke sett henne på måneder.»\n\n' +
      'For årstider og deler av dagen: «i» + ubestemt substantiv = den konkrete forekomsten (i høst, i kveld); «om» + bestemt substantiv = vanlig/generell (om høsten, om kvelden).\n\n' +
      'Høytider oppfører seg annerledes: «i» + BESTEMT substantiv (i julen, i påsken, i pinsen) kan vise til fortid, nåtid ELLER framtid — det er verbets tidsform som avgjør: «Hva skal du gjøre i julen?» (framtid), «Hva gjorde dere i påsken i fjor?» (fortid), «I pinsen pleier vi å dra på tur» (generelt/vanemessig).'
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
      'Compound prepositions: ved siden av (next to), i nærheten av (near), i stedet for (instead of), på grunn av (because of), ved hjelp av (with the help of). ' +
      'Two more relative-position prepositions worth flagging: «ovenfor» = higher up than something, in a physical/spatial sense ("Dette bildet bør henge ovenfor det andre bildet" = this picture should hang above the other one); «overfor» = face-to-face with/opposite ("De stod overfor hverandre" = they stood facing each other) or, extended, regarding/toward a person ("Hennes følelser overfor foreldrene var sterke" = her feelings toward her parents were strong). The two are not interchangeable — «ovenfor» is purely about vertical position, «overfor» is about facing or being directed toward someone/something.',
    explanationNb:
      'For et fast romlig forhold — i, på, bak, foran, under, over — er valget det samme enten noe ' +
      'står i ro eller blir plassert: «Boka ligger på bordet.» «Katten ligger under stolen.»\n\n' +
      '• **i** = innenfor et lukket rom: i skapet, i skogen, i banken, i en butikk\n' +
      '• **på** = på overflaten eller et åpent område, og for de fleste arbeidsplasser: på bordet, på fjellet, på kontor, på skolen, på kafé\n' +
      '• **hos** = hos noen (man er der): «Jeg var hos legen.» (bevegelse til noen: «til» — «Jeg skal til legen.»)\n' +
      '• **ved** = like ved siden av: «De bor ved sjøen.»\n\n' +
      'Geografi: «i» for land, byer og regioner (i Japan, i Bergen, i Nord-Norge); «på» for øyer ' +
      '(på Mallorca, på Island) og norske landsdeler (på Vestlandet).\n\n' +
      'Relativ/sammenlignende plassering mellom to ting eller personer bruker «til venstre for», ' +
      '«til høyre for» og «mellom X og Y»: «Banken ligger til venstre for kirken.» «Butikken ' +
      'ligger mellom apoteket og biblioteket.» Dette følger samme mønster som de faste ' +
      'stedspreposisjonene over — samme valg enten noe står i ro eller blir plassert.\n\n' +
      'Tilhørighet og opprinnelse:\n' +
      '• **til** = tilhørighet til en person: «bilen til Frida»\n' +
      '• **i** = geografisk tilhørighet: «kongen i Norge»\n' +
      '• **på** = egenskap ved en ting: «fargen på bilen»\n' +
      '• **av** = laget av (materiale): «laget av tre»\n' +
      '• **fra** = kommer fra (opprinnelse): «fra hagen»\n\n' +
      'Sammensatte preposisjoner: ved siden av, i nærheten av, i stedet for, på grunn av, ved hjelp av.\n\n' +
      'To flere relative posisjonspreposisjoner er verdt å nevne:\n' +
      '• **ovenfor** = høyere oppe enn noe, i fysisk/romlig forstand: «Dette bildet bør henge ovenfor det andre bildet.»\n' +
      '• **overfor** = ansikt til ansikt med/rett imot: «De stod overfor hverandre.» Eller, utvidet: angående/rettet mot en person: «Hennes følelser overfor foreldrene var sterke.»\n\n' +
      'De to er IKKE ombyttbare — «ovenfor» handler bare om vertikal posisjon, mens «overfor» handler om å vende mot eller være rettet mot noen/noe.'
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
      'Presens perfektum = har/har ikke + perfektum partisipp: "Jeg har lest boka."\n\n' +
      '• **presens perfektum** — brukes om avsluttede handlinger i en åpen/uavsluttet tidsramme (i dag, denne uka, «noen gang/aldri», «hvor lenge har du…»)\n' +
      '• **preteritum** — brukes for et avsluttet tidspunkt i fortida, ofte med «i går» eller «for … siden»: "Jeg leste boka i går."\n\n' +
      'Nekting og aldri-svar: "Nei, jeg har ikke lest den." / "Nei, jeg har aldri lest den."'
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
      '«Derfor» og «fordi» uttrykker samme forhold, men med ulik grammatikk:\n\n' +
      '• **«derfor»** — innleder en ny hovedsetning som uttrykker en FØLGE, og utløser V2-inversjon som ethvert fundamentplassert adverbial: "Sofaen er for stor. Derfor vil hun selge den."\n' +
      '• **«fordi»** — innleder en leddsetning som uttrykker en ÅRSAK, med vanlig subjekt-før-verb-rekkefølge: "Hun vil selge sofaen fordi den er for stor."'
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
      '«mindre»/«færre» are the comparative mirror of «mer»/«flere». A related pair often ' +
      'confused: «litt» (adjective, a moderate/decent amount, positively toned — "Jeg har litt ' +
      'penger" = I have some money, a fair amount) vs. «lite» (adverb, "not much/almost none" — ' +
      '"Jeg har lite penger" = I have hardly any money); «lite» can also be an adjective, the ' +
      'neuter form of «liten» ("small": et lite hus). Quantifiers also change form when pointing ' +
      'at a SPECIFIC, already-known group vs. a general one: «noen/mange/flere/en del» + «av» + a ' +
      'noun in DEFINITE form picks out part of a known group ("mange av elevene i klassen" — many ' +
      'of THOSE specific students), while the same quantifier directly before an INDEFINITE ' +
      'plural noun states a general, non-specific quantity ("mange elever" — many students, in general).',
    explanationNb:
      'Bruk «mye»/«mer» med ikke-tellelige substantiv (mat, tid, plass, arbeid): "Jeg har mye å gjøre." Bruk «mange»/«flere» med tellelige substantiv i flertall (venner, oppgaver, stoler): "Jeg har mange venner." «Flere» betyr også "noen flere til" (Vi trenger flere stoler), mens «mer» betyr en større mengde av noe ikke-tellelig (Vi trenger mer plass).\n\n' +
      'Det samme tellelig/ikke-tellelig-skillet gjentar seg over hele skalaen:\n' +
      '• **få / lite** = lavmengde-motstykket til «mange»/«mye»\n' +
      '• **noen / noe** = tellelig (noen venner) mot ikke-tellelig (noe informasjon)\n' +
      '• **de fleste / det meste** = tellelig mot ikke-tellelig, på samme måte som mest/flest\n' +
      '• **mindre / færre** = komparativ-motstykket til «mer»/«flere»\n\n' +
      'Et beslektet par som ofte forveksles:\n' +
      '• **litt / lite** = «litt» (adjektiv) = en middels/grei mengde, positivt ladet: «Jeg har litt penger» (jeg har en del, nok). «Lite» (adverb) = nesten ingenting: «Jeg har lite penger» (jeg har nesten ingen penger igjen). «Lite» kan også være adjektiv — intetkjønnsform av «liten»: «et lite hus»\n' +
      '• **mengdeord + av + bestemt form** = peker på en spesifikk, kjent gruppe: «mange av elevene» (noen av DE elevene vi snakker om). Mengdeord + substantiv i ubestemt form = en generell mengde: «mange elever» (mange elever generelt, ikke en bestemt gruppe)'
  },

  'modalverb-preteritum': {
    id: 'modalverb-preteritum',
    titleEn: 'Modal verbs: meaning and preteritum forms',
    titleNb: 'Modalverb: betydning og preteritumsformer',
    explanationEn:
      'Modal verbs have irregular preteritum forms: kan→kunne, vil→ville, skal→skulle, må→måtte, ' +
      'bør→burde. Used as plain past tense ("Jeg måtte jobbe i går") and constantly in reported ' +
      'speech, where a present-tense modal statement or question shifts to its preteritum form: ' +
      '"Jeg må vente." → "Hun sa at hun måtte vente." "Skal jeg hjelpe?" → "Hun spurte om hun skulle ' +
      'hjelpe." ' +
      'The modals also differ sharply in MEANING: «må» = necessity ("vi er nødt til å …"), «skal» = ' +
      'a plan or arrangement ("vi har planlagt å …"), «vil» = a wish or desire ("vi ønsker å …"), ' +
      '«kan» = possibility or ability ("vi har muligheten til å …"), and «bør» = a recommendation ' +
      '("det er best for oss å …"). A common rule of thumb: use «vil» for things/situations and ' +
      '«skal» for people ("Situasjonen vil bli bedre." / "Hun skal reise om to år."). Note also that ' +
      'asking a person for something with «skal» sounds impolite ("Jeg skal få et skjema" → wrong); ' +
      'use «kan» instead: "Kan jeg få et skjema?"',
    explanationNb:
      'Modalverb har uregelmessige preteritumsformer:\n\n' +
      '• kan → kunne\n' +
      '• vil → ville\n' +
      '• skal → skulle\n' +
      '• må → måtte\n' +
      '• bør → burde\n\n' +
      'Brukes som vanlig fortid ("Jeg måtte jobbe i går") og svært ofte i referert tale, der en ' +
      'presens-modalytring skifter til preteritumsform: "Jeg må vente." → "Hun sa at hun ' +
      'måtte vente." "Skal jeg hjelpe?" → "Hun spurte om hun skulle hjelpe."\n\n' +
      'Modalverbene skiller seg også sterkt i BETYDNING:\n\n' +
      '• **må** = nødvendighet: «Vi er nødt til å lære norsk.»\n' +
      '• **skal** = en plan/avtale: «Vi har planlagt å lære norsk.»\n' +
      '• **vil** = et ønske: «Vi ønsker å lære norsk.»\n' +
      '• **kan** = mulighet/evne: «Vi har muligheten til å lære norsk.»\n' +
      '• **bør** = en anbefaling: «Det er best for oss å lære norsk.»\n\n' +
      'En hovedregel: bruk «vil» om ting/situasjoner og «skal» om personer: «Situasjonen vil bli ' +
      'bedre.» / «Hun skal reise om to år.» Merk også at det er uhøflig å be noen om noe med «skal» ' +
      '(«Jeg skal få et skjema» → feil); bruk «kan» i stedet: «Kan jeg få et skjema?»'
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
      'To par verb beskriver plassering:\n\n' +
      '• **sette/legge** — beskriver HANDLINGEN å plassere noe, og tar et objekt: "Han setter vasen på bordet." "Hun legger boka på bordet."\n' +
      '• **stå/ligge** — beskriver TILSTANDEN etterpå, og tar ikke objekt: "Vasen står på bordet." "Boka ligger på bordet."\n\n' +
      'Bruk sette/stå om stående objekter, legge/ligge om liggende objekter.'
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
      'Noen norske verb tar et refleksivt pronomen som endrer seg med subjektet:\n\n' +
      '• jeg gleder **meg**\n' +
      '• du gleder **deg**\n' +
      '• han/hun/de gleder **seg**\n' +
      '• vi gleder **oss**\n' +
      '• dere gleder **dere**\n\n' +
      'Samme mønster for grue seg og føle seg.'
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
      'To ulike tilstandstyper skiller «ha» og «være»:\n\n' +
      '• **ha** — symptomer/eie-lignende tilstander: «ha vondt i», «ha lyst på», «ha det bra»\n' +
      '• **være** — adjektiv-tilstander: «være syk», «være sulten», «være i dårlig humør»\n\n' +
      'Mange engelske "to be"-uttrykk tilsvarer norsk «ha»: "I have a headache" = "Jeg har vondt i hodet," ikke "Jeg er vondt."'
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
      'Norske subjektspronomen er jeg, du, han, hun, vi, dere og de. De erstatter et navngitt subjekt og må stemme med person og tall.\n\n' +
      '"Samira bor i Norge." → "Hun bor i Norge." "Boka og pennen ligger her." → "De ligger her."'
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
      'Regelrette verb får -r (eller -er etter konsonant) i presens, med ÉN form for alle personer: jeg/du/han/hun/vi/dere/de snakker.\n\n' +
      'I motsetning til engelsk finnes det ingen ekstra "-s" for tredje person entall, og ingen egen -ing-form.'
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
      'Etter et verb eller en preposisjon bytter subjektspronomen til objektsform:\n\n' +
      '• jeg → meg\n' +
      '• du → deg\n' +
      '• han → ham\n' +
      '• hun → henne\n' +
      '• vi → oss\n' +
      '• dere → dere\n' +
      '• de → dem\n\n' +
      '"Jeg liker deg." "Hun snakker med ham." Merk at dere er likt i begge former.'
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
      '«Og» og «men» binder sammen setninger på ulike måter:\n\n' +
      '• **«og»** — binder sammen to like eller supplerende ideer: "Hun bor i Oslo og jobber der."\n' +
      '• **«men»** — binder sammen en motsetning: "Hun bor i Oslo, men jobber i Bergen."\n\n' +
      'Ingen av dem endrer ordstillingen i setningene de binder sammen.'
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
      'Norsk bruker ulik adverbform for Å VÆRE et sted og Å BEVEGE SEG dit:\n\n' +
      '• **statisk** — inne, ute, hjemme: "Jeg er ute." "Vi er hjemme."\n' +
      '• **dynamisk** — inn, ut, hjem: "Jeg går ut." "Vi går hjem."'
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
      'Noen norske verb kombineres alltid med et refleksivt pronomen (meg, deg, seg, oss, dere, seg) som samsvarer med subjektets person: "Jeg legger meg klokka ti." "Hun liker seg på hotellet."\n\n' +
      'Det refleksive pronomenet samsvarer alltid med **subjektet**.'
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
      'Norsk skiller mellom tre mønstre for verb nummer to i en setning:\n\n' +
      '• **naken infinitiv** — rett etter et modalverb (kan, vil, skal, må), uten «å»: "Jeg vil lære norsk."\n' +
      '• **«å» + infinitiv** — etter verb som «like», «pleie», «prøve»: "Jeg liker å lære norsk."\n' +
      '• **fast preposisjon + «å»** — mange verb og adjektiv tar en bestemt preposisjon foran «å»: «bestemme seg for å», «ha lyst til å», «være ivrig etter å», «være opptatt med å» — mens andre tar «for å» for å uttrykke hensikt, og noen få tar ingen preposisjon i det hele tatt («jeg liker å», «det var umulig å»). Disse må læres per uttrykk.'
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
      'For å si "the X" legger norsk til en endelse på substantivet i stedet for å bruke et eget ord:\n\n' +
      '• en kopp → koppen\n' +
      '• ei uke → uka\n' +
      '• et eple → eplet\n\n' +
      'Endelsen følger substantivets kjønn, det samme kjønnet som den ubestemte artikkelen (en/ei/et).'
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
      'For å vise tilbake til noe som allerede er nevnt, bruker norsk den, det eller de — som samsvarer med det ORIGINALE substantivets kjønn/tall:\n\n' +
      '• **den** (en/ei-ord) — "Hvor er osten? Den er i kjøleskapet."\n' +
      '• **det** (et-ord) — "Hvor er brødet? Det er på bordet."\n' +
      '• **de** (flertall)'
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
      'Påpekende pronomen samsvarer med substantivet de peker på:\n\n' +
      '• **denne** (en/ei-ord, entall) — "Denne genseren er fin."\n' +
      '• **dette** (et-ord, entall) — "Dette skjerfet er på tilbud."\n' +
      '• **disse** (alle kjønn, flertall) — "Disse skoene passer."'
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
      'Imperativ er bare verbstammen — infinitiv uten den siste -en — uten subjekt og uten ending:\n\n' +
      '• "Du må huske stor bokstav." → "Husk stor bokstav!"\n' +
      '• "Dere må snakke norsk." → "Snakk norsk!"'
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
      'Possessiver samsvarer med det eide substantivets kjønn/tall:\n\n' +
      '• min/mi/mitt/mine\n' +
      '• din/di/ditt/dine\n' +
      '• vår/vårt/våre\n\n' +
      'I vanlig talespråk står possessivet normalt ETTER substantivet: "leiligheten min," ikke "min leilighet." hans, hennes og deres bøyes aldri.'
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
      'To hovedregler for sin/sitt/sine vs. hans/hennes:\n\n' +
      '• **sin/sitt/sine** — brukes når eieren ER setningens subjekt: "Bianca vasker leiligheten sin" (sin egen leilighet)\n' +
      '• **hans/hennes** — brukes når eieren er noen ANNEN: "Bianca sitter i bilen hennes" (en annens bil)\n\n' +
      'Unntak: når subjektet er SAMMENSATT ("Han og kundene"), kan ikke sin/sitt/sine lenger vise ' +
      'tilbake til bare én del av det, så hans/hennes/deres brukes i stedet: "Han og kundene hans ' +
      'liker å prate" (kundene hans), ikke "kundene sine".'
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
      'To hovedregler for korte bekreftende svar:\n\n' +
      '• **«ja»** — svar på et positivt spørsmål\n' +
      '• **«jo»** — svar bekreftende på et NEGATIVT spørsmål, eller motsi en negativ påstand, aldri «ja»: "Er du ikke sulten?" → "Jo, det er jeg." "Du liker ikke fisk." → "Jo, jeg liker fisk."'
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
      'Regelrette verb får -et, -te eller -a i preteritum: bodde, flyttet, lærte.\n\n' +
      'Noen svært vanlige verb er uregelmessige og må pugges:\n' +
      '• være → var\n' +
      '• ha → hadde\n' +
      '• gå → gikk\n' +
      '• komme → kom\n' +
      '• ta → tok\n' +
      '• si → sa'
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
      'To måter å uttrykke hensikt og årsak på:\n\n' +
      '• **«for å»** + infinitiv — uttrykker en HENSIKT: "Jeg går til byen for å handle."\n' +
      '• **«fordi»** + en hel setning med eget subjekt og verb — uttrykker en ÅRSAK: "Jeg går til byen fordi jeg trenger mat."'
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
      'Vær og mange allmenne utsagn trenger et formelt subjekt «det», uten noen egentlig referent — det kan aldri utelates:\n\n' +
      '• "Det regner."\n' +
      '• "Det blåser."\n' +
      '• "Det er kaldt i dag."'
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
      'the OBJECT instead: "Jeg vet ikke hva han sier." If the REPORTING verb (sier/sa, spør/spurte) ' +
      "is itself in preteritum, the reported clause's verb usually shifts back one step in " +
      'time too — presens → preteritum: "Alt er ok" + "Roger sier" → "Roger sier at alt er ok" ' +
      '(no shift, presens stays), but "Alt er ok" + "Roger sa" → "Roger sa at alt var ok" ' +
      "(shift, matching the preteritum reporting verb). The reported clause's tense mirrors " +
      'whether the ORIGINAL statement is still true/current (no shift needed) or is being ' +
      'reported purely as something said in the past (shift to match «sa»/«spurte»). Besides a full ' +
      '«at»/«om»-clause, Norwegian also marks that information is SECONDHAND (hearsay, not verified ' +
      'firsthand) with «ifølge X» (according to X) placed before the clause, or with the modal ' +
      'adverb «visstnok» inside it: "Ifølge far vil mor at vi skal male hytta" (according to father, ' +
      'mother wants...), "Mor vil visstnok at vi skal male hytta" (mother apparently wants...). ' +
      'Both can combine with an ordinary «at»-clause and behave like any other fronted adverbial or ' +
      'setningsadverbial for word order.',
    explanationNb:
      'Norsk skiller mellom flere typer referert tale, avhengig av hva som refereres:\n\n' +
      '• **påstand** → «at»: "Det er kaldt ute." → "Han sier at det er kaldt ute."\n' +
      '• **ja/nei-spørsmål** → «om»: "Skal du ut?" → "Han spør om hun skal ut."\n' +
      '• **spørreordspørsmål** → beholder sitt eget spørreord i stedet for «om»: "Hvor bor du?" → "Han spør hvor hun bor."\n\n' +
      'Når spørreordet (hvem, hva, hvilken X) selv er SUBJEKTET i den innfelte setningen, setter norsk inn «som» rett etter: "Jeg vet ikke hvem som kommer i dag." "Han lurte på hva som hadde skjedd." Det legges ikke til «som» når spørreordet i stedet er OBJEKTET: "Jeg vet ikke hva han sier."\n\n' +
      'Hvis SELVE GJENGIVELSESVERBET (sier/sa, spør/spurte) står i preteritum, flyttes vanligvis også tiden i den refererte setningen ett hakk bakover — presens → preteritum: "Alt er ok" + "Roger sier" → "Roger sier at alt er ok" (ingen forskyvning, presens forblir), men "Alt er ok" + "Roger sa" → "Roger sa at alt var ok" (forskyvning, samsvarer med preteritumsverbet). Tiden i den refererte setningen følger av om det opprinnelige utsagnet fortsatt gjelder/er aktuelt (ingen forskyvning nødvendig) eller om det bare refereres som noe som ble sagt i fortiden (forskyvning for å samsvare med «sa»/«spurte»).\n\n' +
      'Utenom en hel «at»/«om»-setning markerer norsk også at informasjonen er ANDREHÅNDS (hørt fra andre, ikke bekreftet selv) med «ifølge X» (ifølge noen) foran setningen, eller med det modale adverbet «visstnok» inne i den: "Ifølge far vil mor at vi skal male hytta" (ifølge det far sier, vil mor ...), "Mor vil visstnok at vi skal male hytta" (mor vil visstnok/antakelig ...). Begge kan kombineres med en vanlig «at»-setning og oppfører seg som ethvert annet fundamentplassert adverbial eller setningsadverbial i ordstillingen.'
  },

  'synes-tror': {
    id: 'synes-tror',
    titleEn: '«synes» vs. «tror»',
    titleNb: '«synes» og «tror»',
    explanationEn:
      '«Synes» gives an OPINION about something you can directly perceive or judge — taste, ' +
      'looks, quality: "Jeg synes kaka er god." «Tror» expresses a BELIEF or uncertainty about a ' +
      'fact: "Jeg tror hun kommer senere."\n\n' +
      'You cannot use «synes» about the FUTURE, since you cannot yet have an impression of ' +
      'something that hasn\'t happened — use «tror» instead: "Jeg tror det blir fint vær i morgen" ' +
      '(not «synes»). The one exception is when «synes» combines with «bør» to state an opinion ' +
      'about how the future SHOULD be: "Jeg synes det bør bli fint vær framover." «Tro på» (with ' +
      '«på») means to believe IN someone or something (faith/trust): "Jeg tror på Gud."',
    explanationNb:
      'To ulike betydninger av "think":\n\n' +
      '• **«synes»** — gir en MENING om noe du kan sanse eller vurdere direkte — smak, utseende, kvalitet: "Jeg synes kaka er god."\n' +
      '• **«tror»** — uttrykker TRO eller usikkerhet om et faktum: "Jeg tror hun kommer senere."\n\n' +
      'Vi kan IKKE bruke «synes» om FRAMTIDEN, for vi har ennå ikke noe inntrykk av noe som ikke har skjedd — bruk «tror» i stedet: "Jeg tror det blir fint vær i morgen" (ikke «synes»). Unntaket er når «synes» kombineres med «bør» for å uttrykke en mening om hvordan framtiden BØR bli: "Jeg synes det bør bli fint vær framover." «Tro på» (med «på») betyr å ha tillit til eller tro på noen/noe: "Jeg tror på Gud."'
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
      '«Halv» + et tall betyr halv time før timen: "halv åtte" = 7.30, ikke 8.30.\n\n' +
      '«Kvart over/på» og «N minutter over/på» fungerer på samme måte, forankret til nærmeste hele eller halve time.'
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
      'Ordenstall (tredje, sjuende, syttende) legger for det meste til -ende til grunntallet, med uregelmessige former for 1.–4. (første, andre, tredje, fjerde).\n\n' +
      'Datoer kombinerer dag-ordenstall + måned-ordenstall: "17.05." = "syttende i femte."'
  },

  'for-siden': {
    id: 'for-siden',
    titleEn: '«for … siden» (time ago)',
    titleNb: '«for … siden»',
    explanationEn:
      'To say how long ago something happened, Norwegian frames the duration with «for» … «siden»: ' +
      '"for to uker siden" (two weeks ago), "for en time siden" (an hour ago).',
    explanationNb:
      'For å si hvor lenge siden noe skjedde, rammer norsk inn tidsrommet med «for» … «siden»:\n\n' +
      '• "for to uker siden"\n' +
      '• "for en time siden"'
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
      'before the infinitive. A useful test for «skal» vs. «kommer til å»: can the subject plan ' +
      'or decide the outcome? If yes, use «skal» ("Jeg skal bygge hus" — I control this). If the ' +
      "outcome is a state or event beyond anyone's control — sales figures, the weather, how a " +
      'match turns out — use «kommer til å», even without a specific visible sign ("Denne boka ' +
      'kommer til å selge veldig mye" — no one can plan or decide book sales).',
    explanationNb:
      'Norsk har ingen egen framtidstid — flere uttrykk dekker det, hvert med sin egen komplementering:\n\n' +
      '• **skal** = plan/intensjon\n' +
      '• **vil** = spådom/vilje\n' +
      '• **kommer til å** = spådom basert på bevis\n' +
      '• faste uttrykk: «har tenkt å», «har lyst til å», «håper (at)», «vil helst/gjerne» — hver med sin egen preposisjon eller ingen foran infinitiv\n\n' +
      'En nyttig test for «skal» mot «kommer til å»: kan subjektet planlegge eller bestemme utfallet selv? Hvis ja, bruk «skal» ("Jeg skal bygge hus" — dette bestemmer jeg selv). Hvis utfallet er en tilstand eller hendelse ingen kan bestemme over — salgstall, været, hvordan en kamp går — bruk «kommer til å», selv uten et konkret synlig tegn ("Denne boka kommer til å selge veldig mye" — ingen kan planlegge eller bestemme bokas salg).'
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
      'Begge binder sammen to helsetninger uten å endre ordstillingen:\n\n' +
      '• **«for»** — uttrykker ÅRSAKEN, plassert i den andre setningen: "Hun kommer ikke i morgen, for hun har det travelt."\n' +
      '• **«så»** — uttrykker FØLGEN, også i den andre setningen: "Hun har det travelt, så hun kommer ikke i morgen."'
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
      'describes one specific occasion, use «da». «Da» also attaches directly to a noun phrase ' +
      'naming the specific occasion — «den gangen da», «den dagen da», «året da» — to point back at ' +
      'one particular past moment ("Husker du den gangen da vi dro til Danmark?").',
    explanationNb:
      'To hovedbruk av «da» og «når»:\n\n' +
      '• **«da»** — brukes om én avsluttet hendelse i fortiden: "Da jeg var femten, flyttet jeg til Norge."\n' +
      '• **«når»** — brukes om en gjentatt/vanemessig hendelse i fortiden, eller om noe i presens/framtid: "Når jeg var liten, lekte jeg ute hver dag." (gjentatt) "Ring meg når du får tid." (framtid)\n\n' +
      'Enkel test: hvis du kan sette inn «hver gang» og det fortsatt gir mening, bruk «når»; ' +
      'gjelder det én bestemt anledning, bruk «da».\n\n' +
      '«Da» kan også kobles direkte til et substantiv som navngir anledningen — «den gangen da», «den dagen da», «året da» — for å peke tilbake på étt bestemt tidspunkt i fortiden ("Husker du den gangen da vi dro til Danmark?").'
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
      'To hovedbruk av «hvis» og «om»:\n\n' +
      '• **«hvis»** — innleder en BETINGELSE: "Jeg kommer hvis jeg har tid."\n' +
      '• **«om»** — innleder en leddsetning som gjengir et JA/NEI-SPØRSMÅL: "Jeg vet ikke om jeg har tid."\n\n' +
      'De to ligner fordi begge ofte kan oversettes med engelsk "if", men bare «hvis» uttrykker en betingelse — «om» kommer alltid etter et verb som spør/vet/lurer på noe usikkert.'
  },

  'passiv-bli-s': {
    id: 'passiv-bli-s',
    titleEn: 'Passive voice: bli-passiv and s-passiv',
    titleNb: 'Passiv: bli-passiv og s-passiv',
    explanationEn:
      'Norwegian has three passive forms. «Bli-passiv» = bli (in the right tense) + perfektum ' +
      'partisipp: "Bildene blir delt på nettet." "Hun ble dømt." «S-passiv» adds -s directly to the ' +
      'infinitive stem, common with modals and in instructions: "Regningen må betales." "Hvor kan ' +
      'den bestilles?" Use passive when the ACTION matters more than who performs it — the original ' +
      'object becomes the new subject: "Noen plager ham." → "Han blir plaget."\n\n' +
      '«Være-passiv» = være (in the right tense) + perfektum partisipp, and describes a RESULTING ' +
      'STATE rather than the action itself: "Bilen er vasket" (it\'s clean now — the state) vs. ' +
      '"Bilen blir vasket" (someone is washing it right now — the action in progress). For verbs ' +
      'describing actions that last over time, «være» and «bli» mean almost the same thing: "Hun ' +
      'er/blir elsket for den hun er." For shorter actions the two differ more clearly. A related ' +
      'trap: some verbs have a perfektum partisipp that looks similar to, but is spelled ' +
      'differently from, an unrelated adjective with a similar meaning — «å åpne» (to open) has ' +
      'the participle «åpnet», used in the passive: "Vinduet er/blir åpnet" (the window is/gets ' +
      'opened — an action, done by someone). But there is also a separate adjective «åpen» ' +
      '(neuter «åpent», plural/definite «åpne»): "Vinduet er åpent" (the window is open — a ' +
      'plain description of its state, with no implied actor or action).',
    explanationNb:
      'Norsk har tre passivformer:\n\n' +
      '• **bli-passiv** — bli (i riktig tid) + perfektum partisipp: "Bildene blir delt på nettet." "Hun ble dømt."\n' +
      '• **s-passiv** — legger -s direkte til infinitivstammen, vanlig sammen med modalverb og i instruksjoner: "Regningen må betales." "Hvor kan den bestilles?"\n' +
      '• **være-passiv** — være (i riktig tid) + perfektum partisipp, og beskriver en TILSTAND (resultatet) i stedet for selve handlingen: "Bilen er vasket" (den er ren nå — tilstanden) mot "Bilen blir vasket" (noen vasker den akkurat nå — handlingen pågår). Ved verb som uttrykker handlinger som strekker seg over tid, betyr «være» og «bli» omtrent det samme: "Hun er/blir elsket for den hun er." Ved kortere handlinger skiller de to seg tydeligere.\n\n' +
      'En beslektet felle: noen verb har en perfektum partisipp som ligner på, men staves ' +
      'annerledes enn, et ubeslektet adjektiv med lignende betydning — «å åpne» har partisippet ' +
      '«åpnet», brukt i passiv: "Vinduet er/blir åpnet" (vinduet er/blir åpnet av noen — en ' +
      'handling). Men det finnes også et eget adjektiv «åpen» (intetkjønn «åpent», flertall/bestemt ' +
      '«åpne»): "Vinduet er åpent" (vinduet er åpent — en ren tilstandsbeskrivelse, uten noen ' +
      'underforstått aktør eller handling).\n\n' +
      'Bruk passiv når HANDLINGEN betyr mer enn hvem som utfører den — det opprinnelige ' +
      'objektet blir det nye subjektet: "Noen plager ham." → "Han blir plaget."'
  },

  'bade-og-verken-eller': {
    id: 'bade-og-verken-eller',
    titleEn: '«både … og» / «enten … eller» / «verken … eller»',
    titleNb: '«både … og», «enten … eller» og «verken … eller»',
    explanationEn:
      '«Både X og Y» means "both X and Y" — a positive pairing: "Jeg liker både fotball og ski." ' +
      '«Enten X eller Y» means "either X or Y" — one of two options, a choice: "Du må enten gå ' +
      'videre på skole eller forsøke å finne en jobb." ' +
      '«Verken X eller Y» means "neither X nor Y" — a negative pairing, and the verb stays ' +
      'affirmative (no extra «ikke» is added): "Jeg liker verken fotball eller ski." A related ' +
      'agreement pattern: «også» ("also/too") adds to a POSITIVE statement — "Jeg liker fotball. ' +
      'Jeg liker også ski." — but «også» cannot appear in a NEGATED clause to express the same ' +
      'agreement; the clause must switch to «(ikke) ... heller», placed at the end: "Jeg liker ' +
      'ikke fotball. Jeg liker ikke ski heller." (never "Jeg liker også ikke ski.")',
    explanationNb:
      'Tre måter å sammenstille to ledd på:\n\n' +
      '• **«både X og Y»** — positiv sammenstilling, begge deler: "Jeg liker både fotball og ski."\n' +
      '• **«enten X eller Y»** — det ene av to, et valg: "Du må enten gå ' +
      'videre på skole eller forsøke å finne en jobb."\n' +
      '• **«verken X eller Y»** — negativ sammenstilling, ingen av de to; verbet forblir bekreftende (ingen ekstra «ikke» legges til): "Jeg liker verken fotball eller ski."\n\n' +
      'Et beslektet mønster: «også» brukes for å legge til i en BEKREFTENDE setning — "Jeg liker fotball. Jeg liker også ski." — men «også» kan ikke stå i en NEKTENDE setning for å uttrykke det samme; da må man bytte til «(ikke) ... heller», plassert til slutt: "Jeg liker ikke fotball. Jeg liker ikke ski heller." (aldri "Jeg liker også ikke ski.")'
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
      'Mange norske adjektiver deler intetkjønnsformen (-t) med et adverb som brukes til å beskrive et verb:\n\n' +
      '• **adjektiv (samsvarende form)** — når du beskriver et substantiv/subjekt: "Jeg er sikker på det." "Maten var god."\n' +
      '• **adverb (-t-form)** — når du beskriver et VERB: "Det går sikkert bra." "Den smakte godt."'
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
      'Tre måter å uttrykke samme motsetning på, med ulik grammatikk:\n\n' +
      '• **«men»** — sideordner to helsetninger, ingen endring i ordstilling: "De savner familien, men de vil bli her."\n' +
      '• **«selv om»** — underordner innrømmelsesleddsetningen (vanlig leddsetningsordstilling, kan stå først eller sist): "Selv om de savner familien, vil de bli her."\n' +
      '• **«likevel»** — er et setningsadverb som fronter og utløser V2-inversjon som ethvert annet fundamentplassert adverbial: "De savner familien. Likevel vil de bli her."'
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
      'two main clauses with no inversion: "Jeg spiste, så gikk jeg en tur." A related pair for ' +
      'simultaneity (not sequence) follows the same subjunction-vs-adverb split: «mens» is a ' +
      'subjunction introducing a subordinate clause ("Mens jeg lagde middag, ringte telefonen"), ' +
      'while «samtidig» is a sentence adverb that triggers V2 inversion as a clause opener ("Jeg ' +
      'lagde middag. Samtidig ringte telefonen."). Note also that «etter» alone is a plain ' +
      'preposition taking a noun phrase ("etter jobben"), distinct from the subjunction «etter at», ' +
      'which always introduces a full clause with its own verb ("etter at jobben var ferdig").',
    explanationNb:
      'Alle tre rekkefølger to hendelser, men oppfører seg ulikt:\n\n' +
      '• **«etter at»** — er en subjunksjon som innleder en leddsetning (vanlig leddsetningsordstilling): "Etter at jeg hadde spist, gikk jeg en tur."\n' +
      '• **«etterpå»** — er et setningsadverb — som setningsåpner utløser det V2-inversjon: "Jeg spiste. Etterpå gikk jeg en tur."\n' +
      '• **«så»** — er en sideordningskonjunksjon som binder sammen to helsetninger uten inversjon: "Jeg spiste, så gikk jeg en tur."\n\n' +
      'Et beslektet par for samtidighet (ikke rekkefølge) følger samme subjunksjon-mot-adverb-mønster:\n\n' +
      '• **«mens»** — er en subjunksjon som innleder en leddsetning: "Mens jeg lagde middag, ringte telefonen."\n' +
      '• **«samtidig»** — er et setningsadverb som utløser V2-inversjon som setningsåpner: "Jeg lagde middag. Samtidig ringte telefonen."\n\n' +
      'Legg også merke til at «etter» alene er en vanlig preposisjon som tar en substantivfrase ("etter jobben"), til forskjell fra subjunksjonen «etter at», som alltid innleder en hel leddsetning med eget verb ("etter at jobben var ferdig").'
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
      'Flere setningstyper dropper den ubestemte artikkelen, med unntak og mønstre som gjentar seg:\n\n' +
      '• **yrker/nasjonaliteter** etter «være»/«bli» = ingen artikkel ("Hun er lærer"), men et adjektiv krever artikkel igjen ("Hun er en flink lærer")\n' +
      '• **ikke-tellelige substantiv** (mat, drikke, snø) = vanligvis ingen artikkel selv med adjektiv; med artikkel blir det en tellbar enhet\n' +
      '• **transportmiddel** etter «med» = ingen artikkel ("med fly"), gjeninnført av adjektiv\n' +
      '• **faste uttrykk** (gå på kino) = dropper også artikkelen, gjeninnført av adjektiv\n' +
      '• **noen verb** gjør artikkelen valgfri: "Jeg skal kjøpe (en) bil."'
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
      'Mange faste uttrykk bruker et substantiv i én bestemt form, og feil form endrer eller ødelegger uttrykket:\n\n' +
      '• ta hånd om\n' +
      '• stå til liv\n' +
      '• gå som fot i hose\n' +
      '• holde hodet over vannet\n' +
      '• få kalde føtter\n' +
      '• slå hånd av\n\n' +
      'Å produsere riktig form her betyr å kjenne igjen uttrykket, ikke bare å bruke den vanlige kjønns-/flertallsregelen.'
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
      'choosing the correct linking form and knowing which element comes first. Most compounds ' +
      'join with no linking element at all (vinterjakke, husleie, matpakke); many join with -s- ' +
      '(especially after words ending in -ing/-ning, or before another noun: bursdagsfest, ' +
      'prioriteringsliste); a smaller set instead joins with a linking -e-, mainly after short ' +
      'words naming a person or animal (barnebok, gutteskole, hundehus) — which linking form ' +
      'fits a given pair has to be learned case by case.',
    explanationNb:
      'Norsk bygger jevnlig presise sammensatte substantiv fra en beskrivende frase:\n\n' +
      '• «en stol for barn» → barnestol\n' +
      '• «miljøet på arbeidsplassen» → arbeidsmiljø\n' +
      '• «problemer med søvnen» → søvnproblemer\n' +
      '• «en person som gir råd» → rådgiver\n' +
      '• «frekvensen av selvmord» → selvmordsfrekvensen\n\n' +
      'Å lage riktig sammensetning krever å velge riktig bindeform og å vite hvilket ledd som kommer ' +
      'først. De fleste sammensetninger har INGEN bindeledd (vinterjakke, husleie, matpakke); mange ' +
      'får bindes- (særlig etter ord som ender på -ing/-ning, eller foran et nytt substantiv: ' +
      'bursdagsfest, prioriteringsliste); et mindre sett får i stedet en bindings-e, som regel etter ' +
      'korte ord som navngir en person eller et dyr (barnebok, gutteskole, hundehus) — hvilken ' +
      'bindeform som passer, må læres for hvert enkelt ordpar.'
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
      'Flere adjektivklasser tar aldri -ere/-est:\n\n' +
      '• **-isk**: praktisk\n' +
      '• **partisipper**: kjent, levende\n' +
      '• **-et/-ete, -en, noen -e, -iv, -ær**\n' +
      '• **lange/importerte adjektiv**: interessant, fleksibel'
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
      'Flere fargeadjektiv lånt fra substantiv bøyes aldri i kjønn, tall eller bestemthet: oransje, lilla, rosa, beige.\n\n' +
      '«en oransje bil», «et oransje hus», «de oransje bilene» — alltid samme form, i motsetning til opprinnelige fargeadjektiv (rød, blå, grønn).'
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
      'Partisipp brukt som adjektiv tar noen ganger uregelmessige predikativformer som ikke følger det vanlige -t/-e-mønsteret:\n\n' +
      '• «skvetten» → «Han er skvetten», ikke «skvett»\n' +
      '• «sunget» forblir «sunget» i predikativ\n' +
      '• «stjålet» tar en uregelmessig -et-form\n\n' +
      'Læres enkeltvis, ikke utledes fra en regel.'
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
      'Et predikativt adjektiv (etter være, bli, hete, se … ut) bøyes aldri i bestemt form. Med ubestemt subjekt bøyes predikativet i intetkjønn, ikke flertall: «Grønnsaker er sunt», ikke sunne — men bestemt subjekt gir vanlig samsvar igjen: «Grønnsakene er sunne».\n\n' +
      '**Unntak** (bøyes ikke):\n' +
      '• -et-partisipp av sterke verb: skrevet\n' +
      '• partisipp av svake verb/passiv: registrert\n' +
      '• sammensatte verbs partisipp: flislagt\n' +
      '• adjektiv i faste preposisjonsuttrykk: glad i, klar over, vant til'
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
      'Å velge mellom bar infinitiv (etter modale hjelpeverb, «pleier», «begynner») og bøyd presensform er en A1/A2-regel, men å bruke den riktig gjennom en lang setning med tre eller fire verbplasser samtidig er en reell presisjonsutfordring på nivå C.\n\n' +
      'Spørsmålene bruker de faktiske nivå C-verbene fra `draft/c/Norsk-for-deg/grammar25-39-verb.md` punkt 25–27 (kryssjekket mot `vocab-c.json`), ikke generiske A1-verb, slik at ordforrådet passer med resten av nivå-C-innholdet.'
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
      'Et sett med sjeldnere sterke verb utover den vanlige A2/B1-listen, med uregelmessige preteritum-/perfektumformer som må pugges:\n\n' +
      '• bry seg (brydde/brøt)\n' +
      '• briste (brast)\n' +
      '• by (bød)\n' +
      '• gale (gol/galte)\n' +
      '• sige (seg)\n' +
      '• fyke (føk/føyk)\n' +
      '• kvekke (kvakk)'
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
      'Å velge riktig mellom preteritum, perfektum og pluskvamperfektum i lengre setninger er en reell utfordring på dette nivået.\n\n' +
      'Særlig der et setningsadverbial (jo, faktisk, nettopp, ennå) eller et fronted tidsuttrykk tvinger fram en bestemt ordstilling rundt hjelpeverbet.'
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
      '«2. futurum» (skal + ha + perfektum partisipp) uttrykker en referert eller påstått tidligere handling som taleren ikke selv har bekreftet — en evidensiell konstruksjon typisk for nyhetsspråk.\n\n' +
      '«Tyvene skal ha brutt mange av reglene» (tyvene er ifølge kilder rapportert å ha brutt reglene).'
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
      'To former for uoppfylte planer og kontrafaktiske situasjoner:\n\n' +
      '• **1. kondisjonalis** (skulle + infinitiv) — uttrykker en uoppfylt plan i fortid: «Jeg skulle handle på Rema, men gjorde det ikke.»\n' +
      '• **2. kondisjonalis** (ville/kunne + ha + perfektum partisipp) — oftest kombinert med en pluskvamperfektum om-setning, uttrykker en kontrafaktisk situasjon: «Om jeg hadde vært rikere, ville jeg ha gjort mange ting annerledes.»'
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
      'something was successfully accomplished.\n\n' +
      'The fixed expression «å få med seg» has three distinct senses depending on the object: ' +
      'to CATCH/WITNESS an event ("Dagbladet fikk med seg filmpremieren" = was there to see it), ' +
      'to UNDERSTAND/GRASP information ("Elevene fikk med seg grammatikken" = understood it), ' +
      'and to BRING something ALONG physically ("De fikk med seg bøkene hjem" = took the books ' +
      'with them). Context (an event, information, or an object) signals which sense applies.',
    explanationNb:
      '«Få» dekker mange betydninger:\n\n' +
      '• **som hovedverb** — å motta ("Hun fikk lønn"), å skaffe seg ("De fikk barn"), å bli utsatt for ("Han fikk lungebetennelse"), å bli straffet, å være til salgs\n' +
      '• **«få» + infinitiv** (hjelpeverb) — uttrykker tvang/resignasjon, enkel framtid eller tillatelse\n' +
      '• **«få» + perfektum partisipp** (hjelpeverb) — uttrykker en framtidig avsluttet handling eller at noe ble gjennomført\n\n' +
      'Det faste uttrykket «å få med seg» har tre ulike betydninger avhengig av objektet: å FANGE OPP/OPPLEVE en hendelse ("Dagbladet fikk med seg filmpremieren" = var til stede og så den), å FORSTÅ/OPPFATTE informasjon ("Elevene fikk med seg grammatikken" = forstod den), og å TA MED SEG noe fysisk ("De fikk med seg bøkene hjem" = tok bøkene med seg). Konteksten (en hendelse, informasjon eller en gjenstand) avgjør hvilken betydning som gjelder.'
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
      'Når en hel leddsetning fyller setningens fundamentplass, kommer hovedsetningens verb likevel på andreplass.\n\n' +
      'Men den resulterende ordstillingen — og plasseringen av setningsadverbial som jo/faktisk/egentlig inne i hovedsetningen — snubler selv sterke innlærere: «Det handler om hva man egentlig mener man skal bygge opp skolen rundt.»'
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
      '«Så» har tre roller:\n\n' +
      '• **konjunksjon** — mellom to hovedsetninger uttrykker den følge uten endring i ordstilling\n' +
      '• **tidsadverb** — som innleder en ny hovedsetning ("Deretter …"), utløser den V2-inversjon\n' +
      '• **subjunksjon** — som innleder en leddsetning (≈ slik at), gjelder vanlig leddsetnings-ordstilling'
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
      'Å velge riktig blant de fem sideordningskonjunksjonene ut fra betydning:\n\n' +
      '• **og** = tillegg\n' +
      '• **eller** = alternativ\n' +
      '• **men** = kontrast\n' +
      '• **for** = årsak\n' +
      '• **så** = følge\n\n' +
      'Pluss kommaregelen: komma settes foran en sideordningskonjunksjon bare når den binder sammen to helsetninger, ikke to ord eller fraser.'
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
      '(adjektiv).\n\n' +
      'En ordfamilie har ofte et eget substantiv for **personen** som gjør noe, **prosessen**/' +
      'aktiviteten selv, og **resultatet**/produktet av den:\n' +
      '• en produsent (person) / en produksjon (prosess) / et produkt (resultat)\n' +
      '• en baker / en/ei baking / en bakst\n\n' +
      'Ikke alle verb har alle tre som egne ord — noen familiemedlemmer faller sammen, f.eks. ' +
      '«en/ei bygging» (prosess) mot «en/ei bygning» (selve bygget) — så riktig valg avhenger av ' +
      'setningens betydning, ikke et fast mønster.\n\n' +
      'Et beslektet mønster avleder et substantiv fra et sammensatt verb (partikkelverb):\n' +
      '• **-ing**: dele ut → utdeling\n' +
      '• **-else**: oppleve → opplevelse\n' +
      '• **-takelse/-tagelse** fra «ta»-verb: delta → deltakelse\n' +
      '• **-sigelse** fra «si»-verb: si opp → oppsigelse\n' +
      '• **-givelse** fra «gi»-verb: gi ut → utgivelse\n' +
      '• **null-avledningspar**: gå ut → en utgang, påstå → en påstand'
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
      'Å skrive om en aktiv setning til en passiv (eller omvendt) og samtidig bevare betydningen: «Han skifter dekk på bilen» → «Bilens dekk blir skiftet av ham.»\n\n' +
      'Dekker også det å gjøre en uformell setning om til en mer formell, nominalisert omskriving.'
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
      'Korrelativkonstruksjonen «jo + komparativ … desto/jo + komparativ» binder sammen to økende/minkende størrelser: «Jo mer hun spiser, jo tykkere blir hun.»\n\n' +
      'Begge setningsleddene bryter med vanlig V2 — verbet kommer rett etter jo/desto.'
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
      'En stor familie faste uttrykk bygget rundt kroppsdelsubstantiv med bestemte preposisjoner:\n\n' +
      '• kaste et blikk på\n' +
      '• ha en knapp på\n' +
      '• sette fast\n' +
      '• ta beina på nakken\n' +
      '• ha øyne i nakken\n' +
      '• gå med krum hals'
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
      'Avanserte, ofte idiomatiske preposisjonsvalg utover A2/B1s tids-/stedsregler — faste kollokasjoner med verb og substantiv som ikke følger et forutsigbart mønster:\n\n' +
      '• gå ut på\n' +
      '• sette pris på\n' +
      '• komme til bunns i\n' +
      '• sette i sving\n' +
      '• stå til ansvar for'
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
      'Å kjenne igjen hva et fast uttrykk faktisk betyr og matche det med riktig omskriving:\n\n' +
      '• **«Hun har fått kalde føtter»** — betyr at hun nøler med en beslutning, ikke bokstavelig kalde føtter\n' +
      '• **«Skinnet bedrar»** — betyr at det ytre lurer deg\n\n' +
      'Norske uttrykk kan ikke alltid oversettes direkte, og flere høres like ut som urelaterte uttrykk ' +
      '(«gå på skinner» vs. «skinnet bedrar»), så målet er presis gjenkjenning, ikke gjetning ut fra ' +
      'enkeltord. Del 1 dekker den første tredjedelen av uttrykkssettet.'
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
      'men uten et substantiv etter:\n\n' +
      '• «de unge»\n' +
      '• «de fattige»\n' +
      '• «den ansatte»\n\n' +
      'Entall «den»/«det» + adjektiv kan vise til én person eller en abstrakt egenskap avhengig av sammenhengen; flertall «de» + adjektiv viser alltid til en gruppe mennesker.'
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
      'Flere negative prefiks gjør et ord om til sin motsetning i stedet for et helt annet ord:\n\n' +
      '• **u-** = gift → ugift, lykke → ulykke, fornøyd → ufornøyd\n' +
      '• **mis-** = fornøyd → misfornøyd, lykkes → mislykkes, forstå → misforstå, trives → mistrives\n' +
      '• **van-** = blant annet i faste former som vanskjøtte\n\n' +
      'Hvilket prefiks som passer, avhenger av det enkelte ordet — dette er leksikalsk, ikke én universell regel, så det må sjekkes ord for ord.'
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
      'Norsk har mange subjunksjoner som hver innleder en leddsetning med en bestemt betydning:\n\n' +
      '• **da / når** = tid\n' +
      '• **fordi** = årsak\n' +
      '• **hvis / med mindre** = betingelse (inkl. negativ betingelse = «unless»)\n' +
      '• **selv om** = innrømmelse\n' +
      '• **for at** = hensikt, ulikt «fordi»\n' +
      '• **før / etter at** = rekkefølge\n' +
      '• **som** = relativ\n\n' +
      'Å velge riktig betyr å lese hele setningen for betydning først, og så velge subjunksjonen som passer — flere av disse kan se like ut ved første blikk, men uttrykker en helt ulik logisk sammenheng.'
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
      'same way from a perfektum partisipp: halvspist, nymalt, bløtkokt.\n\n' +
      'A separate construction uses «etter å ha» + perfektum partisipp to say that one action was ' +
      'completed before another: "Etter å ha spist, dro de til byen." (After eating, they went to ' +
      'town.) The clause introduced by «etter å ha» always shares its subject with the main ' +
      'clause, which typically follows in preteritum.',
    explanationNb:
      'Presens partisipp (verbstamme + -ende) kan erstatte en «mens»-setning for å beskrive måte: «Han løp hjem mens han skrek» → «Han løp skrikende hjem.» Det bøyes aldri.\n\n' +
      'Perfektum partisipp brukt som adjektiv (den ansatte, en forberedt presentasjon) **bøyes** i samsvar, som et vanlig adjektiv — ulikt bruken i perfektum tid (har ansatt), der det aldri bøyes.\n\n' +
      '• **-ete / -ede** = svakt verb med perfektum partisipp på -et: truet → de truede/truete\n' +
      '• **-ne** = sterkt eller uregelmessig -et-verb: stjålet → de stjålne\n\n' +
      'Noen faste sammensatte adjektiv er bygget på samme måte fra et perfektum partisipp: halvspist, nymalt, bløtkokt.\n\n' +
      'En egen konstruksjon bruker «etter å ha» + perfektum partisipp for å si at én handling var ' +
      'avsluttet før en annen: «Etter å ha spist, dro de til byen.» Leddet som innledes med «etter ' +
      'å ha», deler alltid subjekt med hovedsetningen, som vanligvis følger i preteritum.'
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
      'Et partikkelverb skrevet som to ord (løst sammensatt: «sette over») har vanligvis en bokstavelig betydning, mens de samme ordene skrevet som ett fast sammensatt ord ofte har en annen, idiomatisk betydning: «sette over kaffe» mot «oversette en bok». Trykket er også ulikt — muntlig trykk på partikkelen i den løse formen.\n\n' +
      'Noen partikkelverb danner også et fast sammensatt perfektum partisipp brukt som adjektiv: «påkjørt», «nedsatt», «utgått».'
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
      'Fire modalverb dekker ulike betydninger:\n\n' +
      '• **kan** — uttrykker evne eller tillatelse\n' +
      '• **skal** — uttrykker en plan/beslutning eller en instruks fra noen andre\n' +
      '• **vil** — uttrykker ønske eller en spådom\n' +
      '• **må** — uttrykker nødvendighet eller plikt\n\n' +
      'I sammenheng kan flere se ut til å passe, men bare ett stemmer med den faktiske betydningen ' +
      'som er ment — f.eks. er «Skal vi lage kake?» (forslag) noe annet enn «Vil du lage kake?» ' +
      '(spør om ønske) og «Kan du lage kake?» (spør om evne/vilje).'
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
      'Flere uttrykk dekker ulike grader av sikkerhet om at noe skal skje:\n\n' +
      '• **det er mulig at** = mulig\n' +
      '• **det er sannsynlig at / det er lite sannsynlig at** = sannsynlig/usannsynlig\n' +
      '• **det kommer til å** = spådom, ganske sikker\n' +
      '• **det kan hende at** = kan skje\n' +
      '• **jeg tror / jeg antar** = talerens egen usikre oppfatning\n\n' +
      'Å skrive om mellom dem betyr å beholde samme grad av sikkerhet, ikke bare bytte inn et hvilket som helst sannsynlighetsuttrykk.'
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
      'i stedet for å være ett enkelt tidspunkt:\n\n' +
      '• «Han må bli boende i Bergen» (fortsetter å bo)\n' +
      '• «De ble sittende og snakke sammen hele natta» (fortsatte å sitte og snakke)\n\n' +
      'Vanlig med verb som bo, sitte, ligge, stå — presens partisipp-formen bøyes aldri.'
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
      '«Få» + perfektum partisipp setter RESULTATET av en handling i fokus, særlig om den ble gjennomført:\n\n' +
      '• «Fikk du lest avisa i dag?»\n' +
      '• «Du må få levert artikkelen før fire.»\n\n' +
      'Ulikt vanlig perfektum (har lest) — «få» legger til en følelse av å ha klart å gjennomføre noe, ofte mot en hindring eller et tidspress.'
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
      'Alle fire kan oversettes med engelsk «think», men er ikke utskiftbare:\n\n' +
      '• **mene** = ha en uttalt holdning/mening: «Jeg mener at vi bør endre planen.»\n' +
      '• **synes** = ha et inntrykk eller en reaksjon, ofte om noe man har opplevd: «Jeg synes maten var god.»\n' +
      '• **tro** = tro eller gjette, med en viss usikkerhet om et faktum: «Jeg tror det blir sol i morgen.»\n' +
      '• **tenke** = fundere, ha noe i tankene, eller være i ferd med å si noe: «Hva tenker du på?» «Jeg tenkte å ringe deg i kveld.»'
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
      'really are, «nok» hedges an assumption ("I assume/guess"), «vel» has three related senses — ' +
      'pointing out something that seems obvious ("Dette forstår du vel?" = you understand this, ' +
      'right?), marking something as probable ("De greier vel å gå ti kilometer" = they probably ' +
      'manage), or seeking confirmation ("Du kommer vel på festen?" = you\'re coming, aren\'t you?) ' +
      '— «jo» signals shared knowledge between speaker and listener, «kanskje» and «sikkert» mark ' +
      'degrees of certainty, «visst» shifts meaning with position: in the normal midtfelt slot it ' +
      'marks something heard secondhand ("Han har visst giftet seg" = he has apparently gotten ' +
      'married), but placed first in the sentence it becomes emphatic, meaning "definitely!" ' +
      '("Visst har han giftet seg!"), and «neppe» marks something judged unlikely. These sit in the ' +
      'midtfelt like other setningsadverbial (except «visst» in its emphatic front-position use).',
    explanationNb:
      'Et lite sett adverb signaliserer hvor sikker taleren er, eller hva taleren antar at mottakeren allerede vet, uten å endre det bokstavelige innholdet i setningen:\n\n' +
      '• **faktisk** = markerer et faktum (ofte overraskende)\n' +
      '• **egentlig** = signaliserer en motsetning mellom det som er sagt og hvordan det egentlig er\n' +
      '• **nok** = avdemper en antakelse ("jeg antar/tror")\n' +
      '• **vel** = har tre nære betydninger: peker på noe som synes opplagt ("Dette forstår du vel?"), markerer det sannsynlige ("De greier vel å gå ti kilometer"), eller søker bekreftelse ("Du kommer vel på festen?")\n' +
      '• **jo** = signaliserer felles kunnskap mellom taler og mottaker\n' +
      '• **kanskje / sikkert** = markerer sikkerhetsgrad\n' +
      '• **visst** = i midtfeltet markerer «visst» noe hørt fra andre ("Han har visst giftet seg" = antakelig/trolig); først i setningen blir «visst» emfatisk og betyr «helt sikkert!» ("Visst har han giftet seg!")\n' +
      '• **neppe** = markerer at noe vurderes som usannsynlig\n\n' +
      'Disse står i midtfeltet som andre setningsadverbial (unntatt «visst» i den emfatiske bruken først i setningen).'
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
      'I et sammensatt substantiv styrer det siste leddet (hovedordet) kjønn og bøyning; tidligere ledd beskriver det bare.\n\n' +
      '• **bindings-s** settes inn etter ord som ender på -sjon, -else, -skap, -het, -dom, -tet, og de fleste ord som ender på -ing/-ning: permisjonsordning, forskningsartikkel\n' +
      '• **bindings-e** dukker opp etter mange korte ord, ofte om personer/dyr: barnebok, gutteskole\n' +
      '• **ingen binding** — ellers settes leddene rett sammen: familielivet\n\n' +
      'Adjektiv + substantiv skrevet som to ord beholder vanlig adjektivsamsvar og en bokstavelig betydning (en brun ost), mens de samme ordene smeltet sammen til étt sammensatt ord får en spesifikk betydning, og det adjektivliknende første leddet bøyes ikke lenger (en brunost, to brunoster).'
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
      'Når vi forteller i fortid, skiller vi mellom to tidsforhold til referansepunktet:\n\n' +
      '• **preteritum perfektum** («hadde» + perfektum partisipp) — markerer det som allerede hadde skjedd før referansepunktet\n' +
      '• **preteritum futurum** («skulle/ville» + infinitiv) — markerer det som fremdeles lå foran i tid fra det samme fortidige ståstedet: "Da de hadde funnet olje (før), ville politikerne beholde kontrollen (etter)."\n' +
      '• **preteritum futurum perfektum** (uoppfylt/hypotetisk variant, legger til «ha» + perfektum partisipp) — "Jeg skulle ha gjort dette for lenge siden" (men gjorde det ikke)'
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
      'klasserommet," "Det ble utlyst en ledig stilling."\n\n' +
      'Samme konstruksjon gjelder passive setninger med et ubestemt logisk subjekt: "Det snakkes mye ' +
      'om dette," "Det må gjøres noe."\n\n' +
      'En beslektet bruk er **utbrytingskonstruksjonen «Det er/var X som …»**, som flytter fram og ' +
      'framhever ett ledd: "Det var broren min som ringte" (ikke noen andre). «Som» er påkrevd når ' +
      'det framhevede leddet er subjekt, og sløyfes vanligvis ellers ("Det er deg jeg elsker"). Mønsteret ' +
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
      'til:\n\n' +
      '• "Er hun flink? — Ja, det er hun."\n' +
      '• "Jeg synes politikk er kjedelig, men det er ikke han."\n' +
      '• "Hun har mange planer, og det har jeg også."\n\n' +
      'Dette bryter med det vanlige den/det/de-kjønnssamsvaret, siden «det» her ikke samsvarer med et substantivs kjønn i det hele tatt.'
  },

  'spesial-kvantorer': {
    id: 'spesial-kvantorer',
    titleEn: 'ingen/alle/hel/hver/enhver/begge — specialized quantifier-pronouns',
    titleNb: 'ingen, alle, hel, hver, enhver, begge',
    explanationEn:
      '«Ingen»/«ikke noen» replace «ikke» + «noen» for countable nouns; «ingenting»/«ikke noe» for ' +
      'uncountable ones — but if another word splits «ikke» from «no(e/n)» (e.g. a two-part verb), ' +
      "the ingen-forms can't be used. «All/alt» go with uncountable nouns (agreeing in gender), " +
      '«alle» with plurals. «Hel/helt» go with countable singular indefinite nouns (agreeing in ' +
      'gender), «hele» with definite singular nouns — never with the den/det/de article. «Hver/hvert» ' +
      'go with countable singular nouns (agreeing in gender), always followed by indefinite form. ' +
      '«Enhver/ethvert» is a more formal, emphatic cousin of «hver/hvert» — it stresses "any single ' +
      'one, no exceptions" and shows up in rules, rights, and general statements: "Enhver borger ' +
      'har rett til …", "Ethvert menneske fortjener respekt." Like «hver/hvert», it agrees in gender ' +
      '(en/m/f-word → enhver, et-word → ethvert) and has no plural form. ' +
      '«Begge (to)» is for two specific people/things in definite form; «begge deler» for something ' +
      'general/uncountable or two different things; their negative counterparts are «ingen av dem» ' +
      'and «ingen av delene».',
    explanationNb:
      'Disse kvantor-pronomenene følger ulike samsvarsmønstre:\n\n' +
      '• **ingen / ikke noen** = for tellelige substantiv; **ingenting / ikke noe** = for utellelige. Hvis et annet ord skiller «ikke» fra «no(e/n)» (f.eks. et sammensatt verb), kan ikke ingen-formene brukes\n' +
      '• **all/alt** = til utellelige substantiv (samsvarer i kjønn); **alle** = til flertall\n' +
      '• **hel/helt** = til tellelige substantiv i ubestemt entall (samsvarer i kjønn); **hele** = til bestemt entall — aldri sammen med artikkelen den/det/de\n' +
      '• **hver/hvert** = til tellelige substantiv i entall (samsvarer i kjønn), alltid fulgt av ubestemt form\n' +
      '• **enhver/ethvert** = en mer formell, understrekende slektning av hver/hvert — betyr "enhver eneste, uten unntak" og brukes ofte i regler, rettigheter og generelle utsagn: «Enhver borger har rett til …», «Ethvert menneske fortjener respekt.» Samsvarer i kjønn (en/m/f-ord → enhver, et-ord → ethvert) og har ingen flertallsform\n' +
      '• **begge (to)** = om to bestemte personer/ting i bestemt form; **begge deler** = om noe generelt/utellelig eller to ulike ting. Negative motstykker: «ingen av dem» og «ingen av delene»'
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
      'åpnet vinduet for at han skulle få frisk luft"). The fixed expression «dermed basta!» ("and ' +
      'that settles it!") uses «dermed» to declare a matter closed, with no further discussion.',
    explanationNb:
      'Utover derfor/fordi bruker B2-tekster et fyldigere sett årsaksuttrykk:\n\n' +
      '• **subjunksjoner**: «siden» / «i og med at» / «ettersom» (årsak, nær synonymt med fordi) og «slik at» (følge)\n' +
      '• **adverb**: «dermed» ("som følge av dette") og «nemlig» (forklarer forrige setning, midtfeltplassering)\n' +
      '• **årsaksverb**: «føre til», «skyldes», «gjøre at», «føre med seg», «henge sammen med»\n' +
      '• **nominale uttrykk**: «grunn(en til)», «årsak(en til)», «følge(n)», ofte fulgt av at-setninger ("årsaken til at ...")\n' +
      '• **hensiktssetninger**: «for at», «slik at», «så» ("Hun åpnet vinduet for at han skulle få frisk luft")\n\n' +
      'Det faste uttrykket «dermed basta!» ("og dermed er saken avgjort!") bruker «dermed» for å erklære en sak avsluttet, uten videre diskusjon.'
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
      '«på den ene siden ... på den andre siden» ("on the one hand ... on the other hand"). Note ' +
      'that «enda» is more versatile than its subjunksjon use above: as an adverb it can also mean ' +
      '(1) "still" (fremdeles) — here it is interchangeable with «ennå»: "Bor du der ennå/enda?"; ' +
      '(2) "one more"/"in addition", placed before a numeral: "Kan jeg få enda en kopp?"; or (3) a ' +
      'higher degree, placed before a comparative: "en enda bedre jobb." «Ennå» only ever carries ' +
      'meaning (1) — it can never replace «enda» in the numeral, comparative, or subjunksjon uses.',
    explanationNb:
      'Utover selv om/likevel bruker B2-tekster et fyldigere sett motsetningsuttrykk:\n\n' +
      '• **subjunksjoner**: «enda» og «til tross for at» (begge nær synonymt med selv om)\n' +
      '• **adverb**: «til tross for det» / «ikke desto mindre», «imidlertid» / «derimot», «tvert imot», «ellers», «i motsetning til»\n' +
      '• **korrelatpar**: «på den ene siden ... på den andre siden»\n\n' +
      'Merk at «enda» er mer allsidig enn subjunksjonsbruken over. Som adverb kan «enda» også bety:\n\n' +
      '• **fremdeles**: her er «enda» og «ennå» synonyme — «Bor du der ennå/enda?»\n' +
      '• **i tillegg / én til**, foran et tallord — «Kan jeg få enda en kopp?»\n' +
      '• **høyere grad**, foran en komparativ — «en enda bedre jobb»\n\n' +
      '«Ennå» har bare betydningen fremdeles — det kan aldri erstatte «enda» foran tallord, komparativ eller som subjunksjon.'
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
      'forslag i nåtid, uten noen fortidsbetydning:\n\n' +
      '• "Kunne du hjelpe meg?" (mildere enn "Kan du...")\n' +
      '• "Det hadde vært fint om du kunne komme."\n' +
      '• "Jeg lurte på om det var mulig å..."\n' +
      '• "Du burde/skulle prøve en gang til."\n\n' +
      'Dette er en pragmatisk bruk av fortidsformen, ulikt `modalverb-preteritum`s ekte fortidsbetydning.'
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
      '«tenk om + preteritum/preteritum perfektum/presens» use the same tense logic. «Hvis» can be ' +
      'dropped with subject/verb inversion in a REAL, presens condition too, not just the ' +
      'counterfactual branches above: "Hvis du drar nå, kan jeg ikke hjelpe deg" → "Drar du nå, kan ' +
      'jeg ikke hjelpe deg." The main clause stays presens throughout, unlike the ville/skulle main ' +
      'clause used with the hypothetical and counterfactual branches.',
    explanationNb:
      'Betingelsessetninger gradbøyes etter hvor (u)virkelig betingelsen er:\n\n' +
      '• **reell framtidig mulighet** = presens gjennomgående: "Hvis jeg vinner i Lotto, reiser jeg jorda rundt."\n' +
      '• **usannsynlig nåtidig/framtidig hypotetisk tilfelle** = preteritum i hvis-setningen og ville/skulle + infinitiv i hovedsetningen: "Hvis jeg vant i Lotto, ville jeg reise jorda rundt."\n' +
      '• **uoppfylt fortidig tilfelle** = preteritum perfektum i hvis-setningen og ville (ha)/skulle (ha) + perfektum partisipp i hovedsetningen: "Hvis jeg hadde vunnet i Lotto, ville jeg (ha) reist jorda rundt" — «hvis» kan også sløyfes med inversjon: "Hadde jeg vunnet ..., ville jeg ..."\n\n' +
      'De beslæktede ønskeuttrykkene «skulle ønske (at) + preteritum/preteritum perfektum» og «tenk om + preteritum/preteritum perfektum/presens» følger samme tempuslogikk.\n\n' +
      '«Hvis» kan sløyfes med subjekt/verb-inversjon også i en REELL presens-betingelse, ikke bare i de kontrafaktiske variantene over: "Hvis du drar nå, kan jeg ikke hjelpe deg" → "Drar du nå, kan jeg ikke hjelpe deg." Hovedsetningen forblir presens gjennomgående, ulikt ville/skulle-hovedsetningen som brukes i de hypotetiske og kontrafaktiske variantene.'
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
      'describes a location/state or a movement toward that location. «Hjem» has a third, related ' +
      'form for movement AWAY from a place: «hjemmefra» ("from home"): "Jeg kjørte hjemmefra klokka ' +
      'åtte," "Han dro hjemmefra som sekstenåring." So the three-way pattern is dynamic-toward ' +
      '(hjem) / static (hjemme) / dynamic-away (hjemmefra) — the same «-fra» pattern also appears ' +
      'with other adverbs (ovenfra, nedenfra, utenfra, innenfra).\n\n' +
      'A related set of adverbs is static-only, marking relative position within a group or space ' +
      'rather than a place name: fremst/bakerst (front/back), øverst/nederst (top/bottom), ' +
      'innerst/ytterst (innermost/outermost). Unlike the pairs above, these have no matching ' +
      'dynamic form built on the same root — movement toward them is expressed with a verb + ' +
      'directional adverb instead: "Han satte seg bakerst" (static position) vs. "Han gikk bakover" ' +
      '(movement, different root). Compass-direction adverbs (nordover, sørover, østover, vestover) ' +
      'work the other way — they are dynamic-only, describing movement in a direction; the static ' +
      'equivalent uses a prepositional phrase instead of a matching adverb: "i nord," not a word ' +
      'ending in -over.',
    explanationNb:
      'Flere stedsadverb har to former: en statisk for å være et sted, og en dynamisk for å bevege ' +
      'seg mot det:\n\n' +
      '• **statisk** — hjemme, inne, ute, oppe, nede, borte, framme, der, her: "Jeg er hjemme." "Er du ute?"\n' +
      '• **dynamisk** — hjem, inn, ut, opp, ned, bort, fram, dit, hit: "Jeg skal hjem." "Jeg skal gå ut."\n\n' +
      'Valget avhenger av om verbet beskriver et sted/en tilstand eller en bevegelse mot stedet.\n\n' +
      '«Hjem» har i tillegg en tredje form for bevegelse VEKK fra et sted: «hjemmefra» ("fra hjemmet"):\n\n' +
      '• "Jeg kjørte hjemmefra klokka åtte."\n' +
      '• "Han dro hjemmefra som sekstenåring."\n\n' +
      'Mønsteret blir dermed tredelt: dynamisk-mot (hjem) / statisk (hjemme) / dynamisk-vekk (hjemmefra). ' +
      'Samme «-fra»-mønster finnes også hos andre adverb (ovenfra, nedenfra, utenfra, innenfra).\n\n' +
      'En beslektet gruppe adverb er rent statiske og markerer relativ posisjon i en gruppe eller et rom, ikke et stedsnavn: fremst/bakerst, øverst/nederst, innerst/ytterst. I motsetning til parene over har disse ingen tilsvarende dynamisk form med samme rot — bevegelse mot dem uttrykkes heller med verb + retningsadverb: «Han satte seg bakerst» (statisk posisjon) mot «Han gikk bakover» (bevegelse, annen rot). Kompassretningsadverb (nordover, sørover, østover, vestover) fungerer motsatt vei — de er rent dynamiske og beskriver bevegelse i en retning; den statiske motsvarigheten er en preposisjonsfrase, ikke et tilsvarende adverb: «i nord», ikke et ord som ender på -over.'
  },

  'man-en-upersonlig-pronomen': {
    id: 'man-en-upersonlig-pronomen',
    titleEn: 'Impersonal pronouns «man» and «en»',
    titleNb: 'Upersonlige pronomen «man» og «en»',
    explanationEn:
      'To speak about people in general, Norwegian uses «man» (subject position only) or «en» ' +
      '(subject or object position): "Man skal ikke tro alt man leser." "En kan ikke stole på alt en ' +
      'finner på nett" (en as subject), "Sola gir en ny energi" (en as object). Colloquial «du» or ' +
      '«folk» can be used the same way in informal register. «En» also has its own possessive/genitive ' +
      'form, «ens» ("one\'s"): "Det er fint når ens egne barn gjør det godt på skolen" ("It\'s nice when ' +
      'one\'s own children do well at school"). «Man» has no possessive form of its own — it borrows «ens».',
    explanationNb:
      'For å snakke om mennesker generelt bruker norsk «man» eller «en»:\n\n' +
      '• **man** — bare subjektsposisjon: "Man skal ikke tro alt man leser."\n' +
      '• **en** — subjekts- eller objektsposisjon: "En kan ikke stole på alt en finner på nett" (en som subjekt), "Sola gir en ny energi" (en som objekt)\n\n' +
      'Muntlig «du» eller «folk» kan brukes på samme måte i uformell stil.\n\n' +
      '«En» har også en egen eieform, «ens»: "Det er fint når ens egne barn gjør det godt på skolen." ' +
      '«Man» har ingen egen eieform — «ens» brukes også sammen med «man».'
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
      'To vanlige kommaregler:\n\n' +
      '• **komma ved leddsetning** — når en leddsetning er flyttet foran helsetningen (fundamentplassert), settes det komma rett etter den, før helsetningen fortsetter: "Selv om det regnet, gikk vi en tur." Når leddsetningen i stedet kommer etter helsetningen, trengs det ikke komma: "Vi gikk en tur selv om det regnet."\n' +
      '• **komma i oppramsing** — elementer i en liste skilles med komma, men IKKE foran det siste elementet når det bindes sammen med «og»/«eller»: "Hun kjøpte epler, bananer og pærer." — komma etter «epler» og «bananer», men ikke komma foran «og pærer».'
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
      'depending on what it modifies. Three more common clusters: «heldig» (adjective, describing ' +
      'a lucky PERSON or a fortunate SITUATION: "Jeg var heldig") vs. «flaks» (noun, the abstract ' +
      'force/event of luck itself, opposite «uflaks»: "Det var bare flaks") vs. «sjanse» (noun, an ' +
      'opportunity or possibility, not luck itself: "Jeg fikk en sjanse til å prøve"). «Forberedt» ' +
      '(adjective, a state: "Jeg er forberedt") vs. «å forberede seg» (reflexive verb, the act of ' +
      'getting ready: "Jeg må forberede meg til eksamen") vs. «å forbedre seg» (reflexive verb, a ' +
      'completely different meaning — to improve/get better at something, not to get ready: "Jeg ' +
      'må forbedre meg i matte") — easy to confuse since the words look alike. «Under» + a noun ' +
      'names a point or stretch WITHIN a period without focusing on its span ("under møtet" = at ' +
      'some point during the meeting) vs. «i løpet av» + a noun frames the WHOLE period as a span ' +
      'to be completed within ("i løpet av møtet" = over the course of/by the end of the meeting). ' +
      'One more polysemy case worth its own note: «å fatte» has a plain sense — "to understand/grasp" ' +
      '("Jeg fatter ikke hva som skjedde") — but it also appears in a cluster of fixed collocations ' +
      'where it means roughly "to form/take" an abstract thing: «å fatte en beslutning» (to make a ' +
      'decision), «å fatte et vedtak» (to pass/adopt a resolution), «å fatte håp» (to find hope), ' +
      '«å fatte mistanke» (to grow suspicious), «å fatte interesse for» (to take an interest in), and ' +
      'the imperative «Fatt mot!» (Take courage!). None of these substitute a different verb for ' +
      '«forstå» — they are a separate, fixed-collocation sense that has to be learned as a set. ' +
      'Two more everyday cases: «å kalle» has three distinct senses that only context separates — ' +
      '(1) "to call out/shout" ("Mamma kalte på oss fra vinduet"), (2) "to name/refer to someone ' +
      'as" ("Alle kaller henne tante Adele"), and (3) reflexively, "to call oneself" ("Han kaller ' +
      'seg Toto, men han heter Torstein"). And «å bli/være vant til» (adjective phrase, describing ' +
      'a STATE of having grown accustomed to something: "Hun blir vant til å bo der") vs. «å venne ' +
      'seg til» (reflexive verb, the PROCESS/ACT of getting used to something, often used in ' +
      'perfektum to mark that the adjustment is complete: "Hun har vennet seg til å bo der") — ' +
      'both describe the same underlying experience, but the adjective phrase frames it as an ' +
      'ongoing condition while the verb frames it as something you actively did. One more pair ' +
      'worth a careful look: «å bytte» = to give something away and get something back (mutual ' +
      'exchange), «å skifte» = to change/replace/alternate. The two are genuinely synonymous only ' +
      'when swapping TO THE SAME TYPE/KIND of thing (e.g. clothes: «Hun bytter/skifter ofte ' +
      'klær»). They are NOT interchangeable when the focus is on giving something away and ' +
      'receiving something DIFFERENT back in return — trading or bartering («Barna byttet ' +
      'steiner med hverandre», «man kan bytte varen man kjøper i butikken») — only «å bytte» ' +
      'works there, because the emphasis is on the reciprocal exchange itself, not on replacing ' +
      'one thing with another of the same kind. A final pair that trips learners up: «å miste» ' +
      'and «å tape» both roughly translate as "to lose," but for different kinds of loss. «Å ' +
      'miste» covers misplacing something ("å miste nøklene" = to lose one\'s keys), doing ' +
      'without/running out of something ("vi har ingen tid å miste" = we have no time to spare), ' +
      'missing a form of transport ("å miste bussen" = to miss the bus), and losing something ' +
      'abstract that was once yours — sight, hearing, hair, life, parents, hope, patience, an ' +
      'overview, courage. «Å tape», by contrast, is about suffering a defeat or a financial loss: ' +
      'losing money ("å tape penger på gambling"), losing a game/match/competition ("Liverpool ' +
      'tapte mot Manchester United"), or — in the fixed reflexive «å tape seg» — losing one\'s ' +
      "looks/attractiveness over time. The two are NOT interchangeable: you can't «tape nøklene» " +
      "(you misplace keys, you don't lose a contest with them) and you can't «miste en kamp» " +
      '(a match is lost by defeat, not by misplacing it). One last pair worth flagging: ' +
      '«samme» + a NOUN expresses sameness/identity ("De dro ut samme dag" = they left on the ' +
      'same day; "den samme dagen" with the definite article is equally common), while «like» + ' +
      'an ADJECTIVE or ADVERB expresses equal degree ("Hun er like vakker som før" = she is just ' +
      'as beautiful as before; "Det har snødd like mye i dag som i går" = it has snowed just as ' +
      'much today as yesterday). The two are not interchangeable: «samme» never combines directly ' +
      'with an adjective/adverb to mean "equally," and «like» never combines directly with a bare ' +
      'noun to mean "the same one" — «like dag» is not valid, and «samme vakker» is not valid. ' +
      'One final polysemous verb worth flagging: «å gjelde» has four distinct senses that ' +
      'share no single English translation. It can mean (1) to MATTER/be at stake ("Nå ' +
      'gjelder det å løpe fort!" = now it’s about running fast), (2) to CONCERN/be about ' +
      '("Det jeg skal fortelle, gjelder min far" = what I’m about to tell concerns my ' +
      'father), (3) to be VALID ("Denne billetten gjelder ikke" = this ticket isn’t valid), ' +
      'and (4) to COUNT/be included ("To av brikkene gjelder ikke" = two of the pieces don’t ' +
      'count). The senses are not interchangeable — a ticket that «ikke gjelder» is invalid, ' +
      'not “not at stake,” and a story that «gjelder» someone is about them, not valid for ' +
      'them — so the surrounding noun (billett, far, brikke) is the clue to which sense is meant.' +
      ' Getting these right means reading the whole sentence for ' +
      'meaning, not pattern-matching the surface word.',
    explanationNb:
      'Norsk har mange ordgrupper som oversettes likt til engelsk, men som har en reell ' +
      'betydningsforskjell på norsk, slik at bare étt av dem passer i en gitt sammenheng.\n\n' +
      '• **tid / time / gang**: «tid» = tid generelt, «time» = en klokketime, «gang» = en ' +
      'forekomst — «jeg har vært der mange ganger», ikke «mange tider»\n' +
      '• **alvorlig / seriøs**: «alvorlig» = streng/dyster i uttrykket, «seriøs» = oppriktig/ordentlig\n' +
      '• **ryke**: bokstavelig «avgi røyk», men også «å ryke» (et tau, en sene), «å falle gjennom» ' +
      '(en plan, en avtale), eller «å bli slått ut» (en konkurranse)\n' +
      '• **såpass**: étt ord, mange nyanser avhengig av hva det står til\n' +
      '• **heldig / flaks / sjanse**: «heldig» = adjektiv, beskriver en heldig PERSON eller en heldig SITUASJON («Jeg var heldig»); «flaks» = substantiv, selve hell-fenomenet, motsatt «uflaks» («Det var bare flaks»); «sjanse» = substantiv, en mulighet, ikke selve hellet («Jeg fikk en sjanse til å prøve»)\n' +
      '• **forberedt / å forberede seg / å forbedre seg**: «forberedt» = adjektiv, en tilstand («Jeg er forberedt»); «å forberede seg» = refleksivt verb, selve forberedelsen («Jeg må forberede meg til eksamen»); «å forbedre seg» = refleksivt verb, en helt annen betydning — å bli bedre på noe, ikke å gjøre seg klar («Jeg må forbedre meg i matte») — lett å forveksle siden ordene ligner\n' +
      '• **under / i løpet av**: «under» + substantiv peker på et tidspunkt eller en strekning INNENFOR en periode uten å fokusere på hele spennet («under møtet» = på et tidspunkt i løpet av møtet); «i løpet av» + substantiv rammer inn HELE perioden som et spenn som skal fylles/fullføres («i løpet av møtet» = i løpet av hele møtet, innen møtet er ferdig)\n' +
      '• **å fatte**: grunnbetydning = å forstå/skjønne («Jeg fatter ikke hva som skjedde»), men ordet brukes også i en gruppe faste uttrykk der det betyr «å ta/danne» noe abstrakt: «å fatte en beslutning» (å ta en bestemmelse), «å fatte et vedtak» (kommunestyret/styret vedtar noe), «å fatte håp» (å få håp), «å fatte mistanke» (å bli mistenksom), «å fatte interesse for» (å bli interessert i), og imperativen «Fatt mot!» (Vær modig!) — disse erstatter ikke «forstå»-betydningen, de er en egen, fast uttrykksgruppe som må læres samlet\n' +
      '• **å kalle**: tre betydninger — (1) å rope («Mamma kalte på oss fra vinduet»), (2) å gi navn/omtale noen som («Alle kaller henne tante Adele»), (3) refleksivt, å kalle seg noe («Han kaller seg Toto, men han heter Torstein»)\n' +
      '• **å bli/være vant til / å venne seg til**: «vant til» = adjektivuttrykk, en TILSTAND av å ha blitt vant til noe («Hun blir vant til å bo der»); «å venne seg til» = refleksivt verb, selve PROSESSEN med å bli vant til noe, ofte i perfektum for å vise at tilvenningen er fullført («Hun har vennet seg til å bo der») — begge beskriver samme opplevelse, men adjektivuttrykket rammer det inn som en tilstand, mens verbet rammer det inn som noe man aktivt gjorde\n' +
      '• **å bytte / å skifte**: «å bytte» = å gi fra seg noe og få noe tilbake (gjensidig utveksling); «å skifte» = å forandre/veksle. De to er kun synonyme når man bytter TIL NOE AV SAMME SLAG/TYPE (f.eks. klær: «Hun bytter/skifter ofte klær»). De er IKKE synonyme når fokuset ligger på å gi fra seg noe og få noe ANNET tilbake — bytte/bytting av varer («Barna byttet steiner med hverandre», «man kan bytte varen man kjøper i butikken») — der kan bare «å bytte» brukes, fordi vekten ligger på selve den gjensidige utvekslingen, ikke på å erstatte noe med noe av samme type\n' +
      '• **å miste / å tape**: begge oversettes ofte med «lose» på engelsk, men gjelder ulike typer tap. «Å miste» dekker å rote bort noe («å miste nøklene»), å unnvære/ikke ha nok av noe («vi har ingen tid å miste»), å komme for sent til et transportmiddel («å miste bussen»), og å miste noe abstrakt man en gang hadde — syn, hørsel, hår, liv, foreldre, håp, tålmodighet, oversikt, mot. «Å tape» handler derimot om å lide et nederlag eller et økonomisk tap: å tape penger («å tape penger på gambling»), å tape en kamp/konkurranse («Liverpool tapte mot Manchester United»), eller — i det faste refleksive uttrykket «å tape seg» — å miste utseendet/skjønnheten over tid. De to er IKKE synonyme: man kan ikke «tape nøklene» (man roter dem bort, man taper ikke en konkurranse med dem), og man kan ikke «miste en kamp» (en kamp tapes ved nederlag, ikke ved at man roter den bort)\n' +
      '• **samme / like**: «samme» + SUBSTANTIV uttrykker likhet/identitet («De dro ut samme dag» — «den samme dagen» med bestemt form er like vanlig); «like» + ADJEKTIV eller ADVERB uttrykker samme grad («Hun er like vakker som før», «Det har snødd like mye i dag som i går»). De to kan ikke byttes om: «samme» kombineres aldri direkte med et adjektiv/adverb for å uttrykke «like mye», og «like» kombineres aldri direkte med et bart substantiv for å uttrykke «den samme» — «like dag» er ikke gyldig, og «samme vakker» er ikke gyldig\n' +
      '• **å gjelde**: fire ulike betydninger som ikke deler noen felles engelsk oversettelse. Kan bety (1) å VÆRE VIKTIG/stå på spill («Nå gjelder det å løpe fort!»), (2) å HANDLE OM («Det jeg skal fortelle, gjelder min far»), (3) å VÆRE GYLDIG («Denne billetten gjelder ikke»), og (4) å TELLE MED/være inkludert («To av brikkene gjelder ikke»). Betydningene er ikke ombyttbare — en billett som «ikke gjelder» er ugyldig, ikke «som ikke står på spill», og noe som «gjelder» noen handler om dem, ikke er gyldig for dem — substantivet rundt (billett, far, brikke) avgjør hvilken betydning som er ment\n\n' +
      'Å treffe riktig krever å lese hele setningen for betydning, ikke å gjenkjenne overflateordet.'
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
      'Utover de bokstavelige tids-/stedsreglene tar mange vanlige B2-verb, -substantiv og -adjektiv en fast preposisjon som må læres per uttrykk, ikke utledes fra en generell regel:\n\n' +
      '• ta ansvar for\n' +
      '• ha inntrykk av\n' +
      '• være forberedt på\n' +
      '• komme på\n' +
      '• kjempe for\n' +
      '• sette pris på\n' +
      '• bestemme (seg) for/over\n' +
      '• stemme på\n\n' +
      'Disse står et hakk under de mer avanserte/sjeldnere idiomatiske preposisjonene i `preposisjoner-generelt-c` — høyfrekvente hverdagskollokasjoner snarere enn litterære eller fagspesifikke.'
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
      'gjenkjenning av den tiltenkte betydningen, ikke gjetning ut fra enkeltord.\n\n' +
      '• **«å få kalde føtter»** — betyr å bli nervøs for en beslutning, ikke bokstavelig kalde føtter\n' +
      '• **«ikke selge skinnet før bjørnen er skutt»** — betyr å ikke love noe før man er sikker.'
  },

  'transitiv-intransitiv-verb': {
    id: 'transitiv-intransitiv-verb',
    titleEn: 'Transitive vs. intransitive verb pairs',
    titleNb: 'Transitive og intransitive verbpar',
    explanationEn:
      'Norwegian has several verb pairs that look similar but differ in whether they take a ' +
      'direct object. The transitive verb (takes an object) is usually weak/regular in ' +
      'preteritum/perfektum; the intransitive verb (no object) is usually strong/irregular: ' +
      'a sette (satte, har satt) vs. a sitte (satt, har sittet); a legge (la, har lagt) vs. a ligge ' +
      '(la, har ligget); a henge - hengte/har hengt (transitive) vs. hang/har hengt ' +
      '(intransitive, same infinitive); a brenne - brente/har brent (transitive) vs. brant/har ' +
      'brent (intransitive); a senke (transitive, a senke noe) vs. a synke (intransitive).',
    explanationNb:
      'Norsk har flere verbpar som likner hverandre, men som er forskjellige i om de kan ta et ' +
      'objekt.\n\n' +
      '• **transitivt verb** (kan ta objekt) — ofte svak/regelrett bøyning: *å sette — satte — har ' +
      'satt* (Jeg satte glasset på bordet.)\n' +
      '• **intransitivt verb** (kan IKKE ta objekt) — ofte sterk/uregelrett bøyning: *å sitte — ' +
      'satt — har sittet* (Glasset sto på bordet. / Han satt på stolen.)\n\n' +
      'Flere par: *å legge/å ligge, å senke/å synke*. Noen verb (*å henge, å brenne*) har samme ' +
      'infinitiv, men to ulike bøyningsmønstre — svak bøyning når verbet er transitivt, sterk ' +
      'bøyning når det er intransitivt: *Jeg hengte jakka på knaggen* (transitivt) vs. *Jakka hang ' +
      'på knaggen* (intransitivt).'
  },

  's-verb': {
    id: 's-verb',
    titleEn: 'S-verbs (reciprocal/deponent)',
    titleNb: 'S-verb',
    explanationEn:
      'S-verbs end in -s in the infinitive and every finite form. Some express a reciprocal ' +
      'action (a motes = to meet each other, a sees = to see each other), and have no meaningful ' +
      'non-s counterpart with the same subject-plural sense. Others are deponent - the -s form ' +
      'is simply how the verb is used, with no separate non-s verb at all (a synes, a trives, a ' +
      'mislykkes). A few pairs exist where the -s form has a different meaning from the base ' +
      'verb (a finne = to find vs. a finnes = to exist).',
    explanationNb:
      'S-verb er verb som ender på -s i infinitiv og i alle bøyde former.\n\n' +
      '• **gjensidige s-verb** — uttrykker at to (eller flere) gjør noe med hverandre: *å møtes* ' +
      '(Vi møtes klokka fem.), *å sees* (Vi sees i morgen!), *å treffes*.\n' +
      '• **s-verb uten noe eget grunnverb** — finnes bare i s-form: *å synes* (Jeg synes det er ' +
      'fint.), *å trives* (Hun trives godt på jobben.), *å mislykkes*.\n' +
      '• **s-form med annen betydning enn grunnverbet** — *å finne* (å finne nøklene) vs. *å ' +
      'finnes* (Det finnes mange løsninger. — å eksistere).\n\n' +
      'S-verb bøyes vanligvis ikke i presens/preteritum på vanlig måte — formen holder seg lik i ' +
      'presens: *de møtes, de møttes* (ikke *møtesr*).'
  },

  'verbprefiks-be-an-mis': {
    id: 'verbprefiks-be-an-mis',
    titleEn: 'Verb-forming prefixes be-/an-/mis-',
    titleNb: 'Verbdannende forstavelser be-/an-/mis-',
    explanationEn:
      'Adding be-, an-, or mis- to a base verb changes its meaning and often its valency (whether ' +
      'it takes an object or a preposition). be- often makes an intransitive/prepositional verb ' +
      'transitive: a arbeide (med noe) -> a bearbeide noe; a klage (over noe) -> a beklage noe. an- ' +
      'often adds a directional/formal sense: a gi -> a angi; a tenne -> a antenne. mis- adds a ' +
      'sense of "wrongly/badly": a forsta -> a misforsta; a lykkes -> a mislykkes. The prefixed verb ' +
      'must be learned as its own word - its meaning is not always fully predictable from the ' +
      'base verb plus the prefix.',
    explanationNb:
      'Å legge til be-, an- eller mis- foran et grunnverb endrer betydningen, og ofte også om ' +
      'verbet tar objekt eller preposisjon.\n\n' +
      '• **be-** — gjør ofte et verb med preposisjon om til et verb med direkte objekt: *å klage ' +
      'over noe* → *å beklage noe*, *å låne (til noen)* → *å belåne noe*\n' +
      '• **an-** — gir ofte en retnings- eller formell betydning: *å gi* → *å angi*, *å tenne* → ' +
      '*å antenne*\n' +
      '• **mis-** — legger til betydningen «feil/dårlig»: *å forstå* → *å misforstå*, *å lykkes* → ' +
      '*å mislykkes*, *å tro* → *å mistro*\n\n' +
      'Betydningen av det avledede verbet må ofte læres som et eget ord — den er ikke alltid helt ' +
      'forutsigbar ut fra grunnverbet og forstavelsen alene.'
  },

  'adverb-setningsbinding': {
    id: 'adverb-setningsbinding',
    titleEn: 'Connective adverbs linking two sentences',
    titleNb: 'Adverb som binder setninger sammen',
    explanationEn:
      'Several adverbs link two sentences by expressing the logical relationship between them, ' +
      'and (being adverbs, not conjunctions) each triggers V2 inversion when it opens the second ' +
      'sentence: «så» (time — «Først spiste de middag. Så spiste de kake.»), «derfor» (årsak/grunn ' +
      '— «Han var syk. Derfor gikk han ikke på jobb.»), «likevel» (motsetning — «Han var syk. ' +
      'Likevel gikk han på jobb.»), «dessuten» (tillegg — «Hun følte seg kvalm. Dessuten hadde hun ' +
      'feber.»).',
    explanationNb:
      'Flere adverb binder to setninger sammen ved å uttrykke forholdet mellom dem. Siden dette er ' +
      'adverb (ikke konjunksjoner), utløser hvert av dem V2-inversjon når de åpner den andre ' +
      'setningen.\n\n' +
      '• **så** (tid) — *Først spiste de middag. Så spiste de kake.*\n' +
      '• **derfor** (årsak/grunn) — *Han var syk. Derfor gikk han ikke på jobb.*\n' +
      '• **likevel** (motsetning) — *Han var syk. Likevel gikk han på jobb.*\n' +
      '• **dessuten** (tillegg) — *Hun følte seg kvalm. Dessuten hadde hun feber.*\n\n' +
      'Legg merke til at verbet kommer før subjektet i den andre setningen, akkurat som ved andre ' +
      'fronterte adverbial.'
  },

  'determinativ-forsterkere': {
    id: 'determinativ-forsterkere',
    titleEn: 'Emphasizer determinatives (egen, selv, eneste)',
    titleNb: 'Forsterkende determinativer (egen, selv, eneste)',
    explanationEn:
      'Three determinatives add emphasis to a noun phrase, each with its own placement and ' +
      'agreement pattern.\n\n' +
      '• **egen/eget/egne** (own) — agrees with the noun\'s gender/number like a normal adjective ' +
      '(en-word → egen, et-word → eget, plural → egne), and normally follows a possessive instead ' +
      'of an indefinite article: "sin egen leilighet", "sitt eget hus", "sine egne regler".\n' +
      '• **selv** (invariant) — placed AFTER the word it emphasizes (a subject, object, or pronoun) ' +
      'to stress that someone did something without help or in person: "Hun gjorde det selv", ' +
      '"Statsministeren selv kom".\n' +
      '• **selve** (invariant) — placed BEFORE a definite-form noun to intensify it ("the very X", ' +
      '"X itself"): "selve huset", "selve kongen" — never "selv huset".\n' +
      '• **eneste** (invariant) — placed before a noun that must be in definite form with a definite ' +
      'article (den/det/de + noun-et/-en/-ene): "den eneste løsningen", "det eneste alternativet", ' +
      '"de eneste vennene" — never a bare indefinite noun after "eneste".',
    explanationNb:
      'Tre determinativer legger til forsterkning i en substantivfrase, hver med sitt eget ' +
      'plasserings- og bøyingsmønster.\n\n' +
      '• **egen/eget/egne** (eierskap, «min/sin egen») — bøyes etter substantivets kjønn/tall som et ' +
      'vanlig adjektiv (en-ord → egen, et-ord → eget, flertall → egne), og står vanligvis etter et ' +
      'possessiv i stedet for en ubestemt artikkel: «sin egen leilighet», «sitt eget hus», «sine ' +
      'egne regler».\n' +
      '• **selv** (bøyes ikke) — står ETTER ordet det forsterker (subjekt, objekt eller pronomen) for ' +
      'å understreke at noen gjorde noe uten hjelp eller personlig: «Hun gjorde det selv», ' +
      '«Statsministeren selv kom».\n' +
      '• **selve** (bøyes ikke) — står FORAN et substantiv i bestemt form for å forsterke det («selve ' +
      'X», «X selv/selveste X»): «selve huset», «selve kongen» — aldri «selv huset».\n' +
      '• **eneste** (bøyes ikke) — står foran et substantiv som må stå i bestemt form med bestemt ' +
      'artikkel (den/det/de + substantiv-et/-en/-ene): «den eneste løsningen», «det eneste ' +
      'alternativet», «de eneste vennene» — aldri et ubestemt substantiv etter «eneste».'
  },

  'adverb-gradboying': {
    id: 'adverb-gradboying',
    titleEn: 'Adverb comparison',
    titleNb: 'Adverbets gradbøyning',
    explanationEn:
      'Just like adjectives, many manner/frequency adverbs can be compared with -ere (comparative) ' +
      'and -est (superlative), following «enn» after the comparative exactly like adjectives: ' +
      'sakte → saktere (Han kjørte saktere enn før), fort → fortere → fortest, ofte → oftere → ' +
      'oftest, tidlig → tidligere → tidligst.\n\n' +
      'One common trio is irregular (suppletive, i.e. built from different word stems, like ' +
      'god→bedre→best): **gjerne** (gladly, positive) → **heller** (comparative — preferring one ' +
      'thing over another, used with «enn»: "Jeg vil heller ha te enn kaffe") → **helst** ' +
      '(superlative — what is preferred most of all, out of many options, no «enn»: "Jeg vil helst ' +
      'ha suppe"). Note this is a separate, irregular series — there is no "gjernere" or "gjernest".',
    explanationNb:
      'Akkurat som adjektiv kan mange måte-/hyppighetsadverb gradbøyes med -ere (komparativ) og ' +
      '-est (superlativ), og komparativen følges av «enn» akkurat som ved adjektiv.\n\n' +
      '• sakte → saktere — *Han kjørte saktere enn før.*\n' +
      '• fort → fortere → fortest\n' +
      '• ofte → oftere → oftest\n' +
      '• tidlig → tidligere → tidligst\n\n' +
      'Ett vanlig trekløver er uregelmessig (dannet av ulike ordstammer, som god→bedre→best):\n\n' +
      '• **gjerne** (positiv — gjerne/villig) → **heller** (komparativ — å foretrekke én ting fremfor ' +
      'en annen, brukes med «enn»: «Jeg vil heller ha te enn kaffe.») → **helst** (superlativ — det ' +
      'som foretrekkes mest av alt, blant flere alternativer, ingen «enn»: «Jeg vil helst ha ' +
      'suppe.»)\n\n' +
      'Legg merke til at dette er en egen, uregelmessig rekke — det finnes ikke «gjernere» eller ' +
      '«gjernest».'
  },

  'sammensatt-verbtid': {
    id: 'sammensatt-verbtid',
    titleEn: 'Naming tense in compound verb forms',
    titleNb: 'Sammensatt verbtid',
    explanationEn:
      'A compound (sammensatt) verb form has two parts: **verb 1** is the finite (bøyd) auxiliary ' +
      'verb — it carries the tense marking and is always in 2nd position in a statement — and ' +
      '**verb 2** is the non-finite main verb, either an infinitive or a perfektum partisipp, and ' +
      'never changes form regardless of subject. The combination of verb 1\'s tense and verb 2\'s ' +
      'form together name the whole verb phrase\'s **tempus** (tense):\n\n' +
      '• **presens perfektum**: har/har (presens) + perfektum partisipp — "har spist", "har reist"\n' +
      '• **preteritum perfektum**: hadde (preteritum) + perfektum partisipp — "hadde spist"\n' +
      '• **futurum**: skal/vil (presens) + infinitiv — "skal spise", "vil reise"\n' +
      '• **futurum i fortid**: skulle/ville (preteritum) + infinitiv — "skulle spise"\n\n' +
      'A quick test: verb 1 is the word that would change if you switched the whole sentence from ' +
      'presens to preteritum (har→hadde, skal→skulle); verb 2 stays exactly the same either way.',
    explanationNb:
      'En sammensatt verbform har to deler: **verb 1** er det bøyde (finitte) hjelpeverbet — det ' +
      'bærer tidsbøyningen og står alltid på plass 2 i en påstand — og **verb 2** er hovedverbet i ' +
      'ubøyd form, enten infinitiv eller perfektum partisipp, og forandrer seg aldri uansett ' +
      'subjekt. Sammen navngir verb 1s tid og verb 2s form hele verbfrasens **tempus**:\n\n' +
      '• **presens perfektum**: har (presens) + perfektum partisipp — «har spist», «har reist»\n' +
      '• **preteritum perfektum**: hadde (preteritum) + perfektum partisipp — «hadde spist»\n' +
      '• **futurum**: skal/vil (presens) + infinitiv — «skal spise», «vil reise»\n' +
      '• **futurum i fortid**: skulle/ville (preteritum) + infinitiv — «skulle spise»\n\n' +
      'En rask test: verb 1 er ordet som ville forandret seg om hele setningen ble flyttet fra ' +
      'presens til preteritum (har→hadde, skal→skulle); verb 2 er helt likt uansett.'
  },

  'setningsledd-identifikasjon': {
    id: 'setningsledd-identifikasjon',
    titleEn: 'Identifying sentence elements',
    titleNb: 'Setningsledd-identifikasjon',
    explanationEn:
      'A Norwegian sentence is built from **setningsledd** (sentence elements), each doing a ' +
      'distinct job:\n\n' +
      '• **subjekt** — who/what performs the action or is being described: "**Hun** løp."\n' +
      '• **verbal** — the verb(s): "Hun **løp**."\n' +
      '• **direkte objekt** — what/who receives the action directly: "Hun kjøpte **en bok**."\n' +
      '• **indirekte objekt** — who benefits/receives, alongside a direct object: "Hun ga **broren ' +
      'sin** en bok." (broren sin = indirekte objekt, en bok = direkte objekt)\n' +
      '• **predikativ** — describes or renames the subject (subjektspredikativ, after «være/bli/' +
      'virke»-type verbs: "Hun er **lege**.") or the object (objektspredikativ, after verbs like ' +
      '«kalle/gjøre/finne»: "De kalte ham **feig**."). Test: a predikativ could replace «være + X» ' +
      'about the subject/object; an objekt is a separate entity being acted on, not a description ' +
      'of it.\n' +
      '• **adverbial** — extra information (time/place/manner/cause): "Hun løp **fort** **i går**."\n' +
      '• **setningsadverbial** — a special adverbial commenting on the whole sentence (ikke/alltid/' +
      'nok/jo), placed right after the finite verb in a helsetning but before it in a leddsetning.' +
      '\n\n' +
      '**Building noun phrases (NP):** a single ledd (e.g. the subjekt) can itself be a phrase with ' +
      'a determinativ + adjektiv + substantiv, all agreeing in gender/number/definiteness: "**de ' +
      'to gamle kattene**" (plural, bestemt form, adjektiv in weak/plural form).\n\n' +
      '**Clause-function analysis:** a whole leddsetning (subordinate clause) can itself fill a ' +
      'setningsledd slot in the matrix clause — as subjekt ("**At hun kom for sent** irriterte ' +
      'ham."), objekt ("Han sa **at han var syk**."), or adverbial ("Han ringte **før han dro**.").' +
      '\n\n' +
      '**Field schema (setningsskjema):** a helsetning divides into forfelt (before the finite ' +
      'verb — usually subjekt or a fronted adverbial), verbal, midtfelt (subjekt if not fronted, ' +
      'setningsadverbial, objekt), and sluttfelt (longer adverbials, especially sted/tid/årsak in ' +
      'that order).',
    explanationNb:
      'En norsk setning er bygd opp av **setningsledd**, som hver har en bestemt jobb:\n\n' +
      '• **subjekt** — hvem/hva som utfører handlingen eller blir beskrevet: «**Hun** løp.»\n' +
      '• **verbal** — verbet/verbene: «Hun **løp**.»\n' +
      '• **direkte objekt** — hva/hvem som mottar handlingen direkte: «Hun kjøpte **en bok**.»\n' +
      '• **indirekte objekt** — hvem som mottar/får noe, ved siden av et direkte objekt: «Hun ga ' +
      '**broren sin** en bok.» (broren sin = indirekte objekt, en bok = direkte objekt)\n' +
      '• **predikativ** — beskriver eller omtaler subjektet (subjektspredikativ, etter «være/bli/' +
      'virke»-type verb: «Hun er **lege**.») eller objektet (objektspredikativ, etter verb som ' +
      '«kalle/gjøre/finne»: «De kalte ham **feig**.»). Test: en predikativ kan erstattes med «være ' +
      '+ X» om subjektet/objektet; et objekt er en egen størrelse som blir påvirket, ikke en ' +
      'beskrivelse av noe annet.\n' +
      '• **adverbial** — tilleggsinformasjon (tid/sted/måte/årsak): «Hun løp **fort** **i går**.»\n' +
      '• **setningsadverbial** — en særlig type adverbial som kommenterer hele setningen (ikke/' +
      'alltid/nok/jo), og står rett etter det finitte verbet i en helsetning, men før det i en ' +
      'leddsetning.\n\n' +
      '**Å bygge substantivfraser (NP):** ett enkelt ledd (f.eks. subjektet) kan selv være en frase ' +
      'med determinativ + adjektiv + substantiv, som alle samsvarer i kjønn/tall/bestemthet: «**de ' +
      'to gamle kattene**» (flertall, bestemt form, adjektivet i svak/flertallsform).\n\n' +
      '**Setningsleddanalyse av leddsetninger:** en hel leddsetning kan selv fylle en setningsledd-' +
      'plass i overordnet setning — som subjekt («**At hun kom for sent** irriterte ham.»), objekt ' +
      '(«Han sa **at han var syk**.»), eller adverbial («Han ringte **før han dro**.»).\n\n' +
      '**Setningsskjema:** en helsetning deles inn i forfelt (før det finitte verbet — vanligvis ' +
      'subjekt eller et fronted adverbial), verbal, midtfelt (subjekt hvis ikke fronted, ' +
      'setningsadverbial, objekt), og sluttfelt (lengre adverbialer, særlig sted/tid/årsak i den ' +
      'rekkefølgen).'
  }
};

export const GRAMMAR_RULE_LIST: GrammarRule[] = Object.values(GRAMMAR_RULES);
