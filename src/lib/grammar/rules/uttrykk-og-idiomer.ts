// src/lib/grammar/rules/uttrykk-og-idiomer.ts
// Rules for chapter 20 · Uttrykk og idiomer (Part 4). Order follows taxonomy.ts.
// Formatting of `explanationNb`: see the header comment in ./index.ts.
import type { GrammarRule } from '$lib/types';

export const UTTRYKK_OG_IDIOMER_RULES: Record<string, GrammarRule> = {
  // Merged from uttrykk-gjenkjenning-c-1/2/3 and -detgaarbra-c (all the same skill:
  // match an idiom to its paraphrase). Questions are practised in sets of ~25 via the
  // optional `set` field. Admission rule: only genuine fixed expressions, idioms and
  // proverbs; an item that illustrates a grammar rule belongs to that rule's topic.
  uttrykk: {
    id: 'uttrykk',
    titleEn: 'Idioms and fixed expressions',
    titleNb: 'Faste uttrykk og idiomer',
    explanationEn:
      'Recognising what a fixed idiom or proverb really means and matching it to the correct ' +
      'paraphrase. «Hun har fått kalde føtter» means she is getting nervous about a decision, ' +
      'not that her feet are literally cold; «skinnet bedrar» means appearances deceive. ' +
      'Norwegian idioms rarely translate word for word, and some sound alike but mean ' +
      'something different («gå på skinner» vs. «skinnet bedrar»), so the aim is to recognise ' +
      'the intended meaning, not to guess from single words. Questions come in sets of about 25.',
    explanationNb:
      'Å kjenne igjen hva et fast uttrykk eller ordtak faktisk betyr og matche det med riktig omskriving:\n\n' +
      '• **«Hun har fått kalde føtter»** — betyr at hun nøler med en beslutning, ikke bokstavelig kalde føtter\n' +
      '• **«Skinnet bedrar»** — betyr at det ytre lurer deg\n' +
      '• **«Ikke selge skinnet før bjørnen er skutt»** — betyr å ikke love noe før man er sikker\n\n' +
      'Norske uttrykk kan sjelden oversettes direkte, og noen høres like ut, men betyr noe helt annet ' +
      '(«gå på skinner» vs. «skinnet bedrar»). Målet er presis gjenkjenning av betydningen, ikke ' +
      'gjetning ut fra enkeltord. Spørsmålene kommer i sett på omtrent 25.'
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
  }
};
