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
  }
};

export const GRAMMAR_RULE_LIST: GrammarRule[] = Object.values(GRAMMAR_RULES);
