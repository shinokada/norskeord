// src/lib/grammar/rules/konjunksjoner-og-subjunksjoner.ts
// Rules for chapter 16 · Konjunksjoner og subjunksjoner (Part 2). Order follows taxonomy.ts.
// Formatting of `explanationNb`: see the header comment in ./index.ts.
import type { GrammarRule } from '$lib/types';

export const KONJUNKSJONER_OG_SUBJUNKSJONER_RULES: Record<string, GrammarRule> = {
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
      'can superficially look interchangeable but express a completely different logical relation.\n\n' +
      'Two more categories complete the set: a RESULT clause uses «så + adjective/adverb + at» to ' +
      'say what consequence followed from a degree: "Hun var så trøtt at hun sovnet på bussen" ' +
      '(She was so tired that she fell asleep on the bus) — distinct from a pure cause clause with ' +
      '«fordi», since the leddsetning here states an effect of an intensity, not a reason. A ' +
      'COMPARISON clause uses «som» after words like «akkurat»/«nøyaktig», or after a verb ' +
      'describing an expectation/plan, to compare the actual situation to another one: "Det gikk ' +
      'som planlagt" (It went as planned), "Hun gjorde akkurat som han sa" (She did exactly as he ' +
      'said) — this «som» is a subjunction introducing a full clause of comparison, not the ' +
      'relative pronoun «som» that replaces a noun (see the separate `relative-som` topic).',
    explanationNb:
      'Norsk har mange subjunksjoner som hver innleder en leddsetning med en bestemt betydning:\n\n' +
      '• **da / når** = tid\n' +
      '• **fordi** = årsak\n' +
      '• **hvis / med mindre** = betingelse (inkl. negativ betingelse = «unless»)\n' +
      '• **selv om** = innrømmelse\n' +
      '• **for at** = hensikt, ulikt «fordi»\n' +
      '• **før / etter at** = rekkefølge\n' +
      '• **som** = relativ\n\n' +
      'Å velge riktig betyr å lese hele setningen for betydning først, og så velge subjunksjonen som passer — flere av disse kan se like ut ved første blikk, men uttrykker en helt ulik logisk sammenheng.\n\n' +
      'To kategorier til fullfører settet:\n\n' +
      '• **følge**: «så + adjektiv/adverb + at» uttrykker en konsekvens av en grad: «Hun var så trøtt at hun sovnet på bussen» — ulikt en ren årsakssetning med «fordi», siden leddsetningen her sier hva som fulgte AV graden, ikke hvorfor noe skjedde.\n' +
      '• **sammenlikning**: «som» etter «akkurat»/«nøyaktig», eller etter et verb som uttrykker en forventning/plan, sammenlikner den faktiske situasjonen med en annen: «Det gikk som planlagt», «Hun gjorde akkurat som han sa». Dette «som» er en subjunksjon som innleder en hel sammenlikningssetning — ikke det relative pronomenet «som» som erstatter et substantiv (se den egne `relative-som`-emnet).'
  }
};
