// src/lib/grammar/rules/setningsfragmenter.ts
// Rules for chapter 6 · Setningsfragmenter (Part 1). Order follows taxonomy.ts.
// Formatting of `explanationNb`: see the header comment in ./index.ts.
import type { GrammarRule } from '$lib/types';

export const SETNINGSFRAGMENTER_RULES: Record<string, GrammarRule> = {
  'setningsfragment-uttrykk': {
    id: 'setningsfragment-uttrykk',
    titleEn: 'Fixed expressions: wishes and replies',
    titleNb: 'Faste uttrykk uten verb',
    explanationEn:
      'A sentence fragment is a short expression without a verb that can still be a complete ' +
      'message. Many fixed expressions are fragments. Wishes: God tur! God helg! God jul! God ' +
      'påske! God bedring! Lykke til! Smaklig måltid! Replies: Takk, i like måte! Ingen årsak! ' +
      'Selv takk! Choose the wish that fits: "God tur!" to someone travelling, "Lykke til!" before ' +
      'something difficult such as a test, "God bedring!" to someone who is ill, "Smaklig ' +
      'måltid!" before eating. "Takk, i like måte!" answers a wish and means "the same to you". ' +
      '"Ingen årsak!" answers thanks and means "no need to thank me"; "Selv takk!" answers thanks ' +
      'and means "I thank you too".',
    explanationNb:
      'Et setningsfragment er et kort uttrykk uten verb som likevel kan være en fullstendig ' +
      'beskjed. Mange faste uttrykk er setningsfragmenter.\n\n' +
      '• **Ønsker:** God tur! God helg! God jul! God påske! God bedring! Lykke til! Smaklig ' +
      'måltid!\n' +
      '• **Svar:** Takk, i like måte! Ingen årsak! Selv takk!\n\n' +
      '**Velg ønsket som passer:** «God tur!» sier vi til noen som skal reise. «Lykke til!» sier ' +
      'vi før noe vanskelig, for eksempel en prøve. «God bedring!» sier vi til noen som er ' +
      'syke. «Smaklig måltid!» sier vi før vi spiser.\n\n' +
      '**Svar på et ønske:** «Takk, i like måte!» betyr at jeg ønsker det samme til deg: "God ' +
      'helg!" – "Takk, i like måte!"\n\n' +
      '**Svar på takk:** «Ingen årsak!» betyr at du ikke trenger å takke. «Selv takk!» betyr at ' +
      'jeg også takker deg: "Takk for hjelpen!" – "Selv takk!"'
  }
};
