// src/lib/grammar/rules/svar.ts
// Rules for chapter 3 · Svar (Part 1). Order follows taxonomy.ts.
// Formatting of `explanationNb`: see the header comment in ./index.ts.
import type { GrammarRule } from '$lib/types';

export const SVAR_RULES: Record<string, GrammarRule> = {
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
  }
};
