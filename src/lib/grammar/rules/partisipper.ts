// src/lib/grammar/rules/partisipper.ts
// Rules for chapter 13 · Partisipper (Part 2). Order follows taxonomy.ts.
// Formatting of `explanationNb`: see the header comment in ./index.ts.
import type { GrammarRule } from '$lib/types';

export const PARTISIPPER_RULES: Record<string, GrammarRule> = {
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

  'substantivert-partisipp': {
    id: 'substantivert-partisipp',
    titleEn: 'Participles used as nouns',
    titleNb: 'Partisipp som substantiv',
    explanationEn:
      'A participle can stand alone as a noun and refer to people: "De streikende samlet seg foran ' +
      'Stortinget."\n\n' +
      '**Presens partisipp (-ende):** "de streikende", "de reisende", "de overlevende". It never ' +
      'inflects: "den streikende", "de streikende".\n\n' +
      '**Perfektum partisipp:** "de ansatte", "den savnede". A perfektum participle inflects like an ' +
      'adjective when it is used as a noun.\n\n' +
      '**Without an article:** in the plural the participle can stand without an article: "Hvor mange ' +
      'ansatte har dere?" "Det var mange reisende."',
    explanationNb:
      'Et partisipp kan stå alene som et substantiv og vise til personer: «De streikende samlet seg ' +
      'foran Stortinget.»\n\n' +
      '• **Presens partisipp (-ende):** «de streikende», «de reisende», «de overlevende». Det ' +
      'bøyes aldri: «den streikende», «de streikende».\n' +
      '• **Perfektum partisipp:** «de ansatte», «den savnede». Perfektum partisipp bøyes som et ' +
      'adjektiv når det brukes substantivisk.\n' +
      '• **Uten artikkel:** I flertall kan partisippet stå uten artikkel: «Hvor mange ansatte har ' +
      'dere?» «Det var mange reisende.»'
  },

  'sammensatte-partisipper': {
    id: 'sammensatte-partisipper',
    titleEn: 'Compound participles',
    titleNb: 'Sammensatte partisipper',
    explanationEn:
      'A participle can be part of a compound word: "hjemmelaget", "utsolgt", "kjempestressende", ' +
      '"enestående". We can always make new ones: "koronavaksinert", "selvgående", "aleneboende". ' +
      'Compound participles are written as one word.\n\n' +
      '**Perfektum partisipp after the verb:** the participle usually stays uninflected: "Støvlene var ' +
      'utsolgt." "Alle rettene er hjemmelaget." "Vinduene er nyvasket."\n\n' +
      '**Presens partisipp:** in compounds it never inflects: "en febernedsettende medisin", "noen ' +
      'arbeidskrevende oppgaver".\n\n' +
      '**New compounds:** we put a word and a participle together: "alene" + "boende" = "aleneboende".',
    explanationNb:
      'Et partisipp kan være en del av et sammensatt ord: «hjemmelaget», «utsolgt», ' +
      '«kjempestressende», «enestående». Vi kan stadig lage nye: «koronavaksinert», «selvgående», ' +
      '«aleneboende». Sammensatte partisipper skrives som ett ord.\n\n' +
      '• **Perfektum partisipp etter verbet:** Partisippet står vanligvis ubøyd: «Støvlene var ' +
      'utsolgt.» «Alle rettene er hjemmelaget.» «Vinduene er nyvasket.»\n' +
      '• **Presens partisipp:** I sammensetninger bøyes det aldri: «en febernedsettende medisin», ' +
      '«noen arbeidskrevende oppgaver».\n' +
      '• **Nye sammensetninger:** Vi setter sammen et ord og et partisipp: «alene» + «boende» = ' +
      '«aleneboende».'
  }
};
