// src/lib/grammar/rules/helsetninger.ts
// Rules for chapter 2 · Helsetninger (Part 1). Order follows taxonomy.ts.
// Formatting of `explanationNb`: see the header comment in ./index.ts.
import type { GrammarRule } from '$lib/types';

export const HELSETNINGER_RULES: Record<string, GrammarRule> = {
  'fortellende-setninger': {
    id: 'fortellende-setninger',
    titleEn: 'Statements (declarative sentences)',
    titleNb: 'Fortellende setninger',
    explanationEn:
      'A Norwegian statement has the finite verb in SECOND position (V2). In the simplest ' +
      'sentence the order is subject — verb — rest: «Jeg bor i Oslo.» If something else comes ' +
      'first, such as a time or place phrase, the verb still stays second and the subject moves ' +
      'behind it: «I morgen reiser vi til Bergen.» (not «I morgen vi reiser …»).',
    explanationNb:
      'En fortellende setning har det bøyde verbet på ANDRE PLASS (V2):\n\n' +
      '• **vanlig rekkefølge**: subjekt — verb — resten: «Jeg bor i Oslo.»\n' +
      '• **noe annet først**: verbet blir stående på andre plass, og subjektet kommer etter: «I morgen reiser vi til Bergen.»'
  },

  sporresetninger: {
    id: 'sporresetninger',
    titleEn: 'Questions (yes/no and question words)',
    titleNb: 'Spørresetninger',
    explanationEn:
      'Norwegian has two main question types. Yes/no questions start with the verb, so subject ' +
      'and verb swap places: «Du snakker norsk.» → «Snakker du norsk?» Questions with a ' +
      'question word put that word first and keep the finite verb in SECOND position: ' +
      '«Hvor bor du?», «Når skal du begynne på norskkurs?»',
    explanationNb:
      'Det er to hovedtyper spørresetninger:\n\n' +
      '• **ja/nei-spørsmål**: verbet kommer først — bytt om subjekt og verb: «Du snakker norsk.» → «Snakker du norsk?»\n' +
      '• **spørreord**: spørreordet står på første plass, og det bøyde verbet blir stående på andre plass: «Hvor bor du?»'
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

  'v2-word-order': {
    id: 'v2-word-order',
    titleEn: 'V2 rule (verb-second)',
    titleNb: 'V2-regelen (verb på andreplass)',
    explanationEn:
      'In Norwegian main clauses the finite verb must be the SECOND element. ' +
      'When the sentence starts with an adverbial, the subject and verb swap: ' +
      '"I går gikk jeg til butikken." (Yesterday I went to the store.) ' +
      'Compare English: subject stays first. Norwegian: verb stays second. ' +
      'This V2 inversion is NOT limited to adverbials — ANY element fronted for emphasis triggers ' +
      'the same swap: a fronted OBJECT ("Den boken har jeg lest" = THAT book, I have read), a ' +
      'fronted PREDICATIVE/COMPLEMENT ("Gladere har jeg aldri vært" = happier I have never been), ' +
      'or a whole fronted SUBORDINATE CLAUSE acting as a single adverbial ("Når jeg kommer hjem, ' +
      'spiser jeg middag" — the comma marks the end of the fronted clause, and the main clause ' +
      'still inverts: "spiser jeg", not "jeg spiser"). ' +
      'A common learner error is forgetting the inversion after ANY of these frontings and leaving ' +
      'the subject first (*"I går jeg gikk..."), or after a fronted clause (*"Når jeg kommer hjem, ' +
      'jeg spiser..."). Sentence adverbs like "aldri"/"alltid"/"ikke" still take their normal ' +
      'mid-field position AFTER the inverted subject: "Dette har jeg aldri sett før" (not ' +
      '"Dette har aldri jeg sett før").',
    explanationNb:
      'I norske hovedsetninger må det bøyde verbet alltid stå på ANDRE PLASS.\n\n' +
      'Når setningen begynner med et adverbial, bytter subjektet og verbet plass: "I går gikk jeg til butikken."\n\n' +
      'Sammenlign med engelsk: subjektet er alltid først. Norsk: verbet er alltid på andreplass.\n\n' +
      'Denne V2-inversjonen gjelder ikke bare adverbial — ETHVERT ledd som flyttes fremst for å ' +
      'fremheves, utløser samme ombytting: et fremflyttet **objekt** ("Den boken har jeg lest" = ' +
      'DEN boken har jeg lest), et fremflyttet **predikativ** ("Gladere har jeg aldri vært"), eller ' +
      'en hel fremflyttet **leddsetning** som fungerer som ett samlet adverbial ("Når jeg kommer ' +
      'hjem, spiser jeg middag" — kommaet markerer slutten på den fremflyttede leddsetningen, og ' +
      'helsetningen inverteres fortsatt: "spiser jeg", ikke "jeg spiser").\n\n' +
      'En vanlig feil er å glemme inversjonen etter noen av disse fremflyttingene og la subjektet ' +
      'stå først (*"I går jeg gikk..."), eller etter en fremflyttet leddsetning (*"Når jeg kommer ' +
      'hjem, jeg spiser..."). Setningsadverb som "aldri"/"alltid"/"ikke" behold sin vanlige ' +
      'plass midtfeltet ETTER det inverterte subjektet: "Dette har jeg aldri sett før" (ikke ' +
      '"Dette har aldri jeg sett før").'
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
  }
};
