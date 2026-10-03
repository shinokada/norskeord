// src/lib/grammar/rules/interjeksjoner.ts
// Rules for chapter 15 · Interjeksjoner (Part 3). Order follows taxonomy.ts.
// Formatting of `explanationNb`: see the header comment in ./index.ts.
import type { GrammarRule } from '$lib/types';

export const INTERJEKSJONER_RULES: Record<string, GrammarRule> = {
  hilseord: {
    id: 'hilseord',
    titleEn: 'Greetings and polite expressions',
    titleNb: 'Hilsener og høflige uttrykk',
    explanationEn:
      'We use greetings and polite expressions when we meet someone, say goodbye or want to be ' +
      'polite. Meeting: hei, hallo, god morgen, god dag, god kveld. Leaving: ha det (bra), vi ses, ' +
      'god natt. Polite: takk, vær så god, unnskyld, hyggelig å møte deg. God morgen, god dag, god ' +
      'kveld and god natt match the time of day. "God dag" is correct but often sounds a little ' +
      'formal today. "God natt" is said when going to bed or saying goodbye in the evening, not ' +
      'when meeting someone. To "Hvordan går det?" we often answer "Bra, takk. Og du?" After ' +
      '"hei" we can use an exclamation mark or a comma: "Hei!" "Hei, Anna."',
    explanationNb:
      'Hilsener og høflige uttrykk bruker vi når vi møter noen, tar farvel eller er høflige.\n\n' +
      '• **Når vi møter noen:** hei, hallo, god morgen, god dag, god kveld: "Hei, Anna!" "God ' +
      'morgen!"\n' +
      '• **Når vi går:** ha det, ha det bra, vi ses, god natt: "Ha det bra!" "Vi ses i ' +
      'morgen!"\n' +
      '• **Når vi er høflige:** takk, vær så god, unnskyld, hyggelig å møte deg: "Takk for ' +
      'hjelpen!"\n\n' +
      '**God morgen, god dag, god kveld og god natt** passer til tiden på døgnet. «God dag» er ' +
      'korrekt, men høres ofte litt formelt ut i dag. «God natt» sier vi når vi skal legge oss ' +
      'eller ta farvel om kvelden, ikke når vi møter noen.\n\n' +
      '**Hvordan går det?** Vi svarer ofte: "Bra, takk. Og du?"\n\n' +
      'Etter «hei» kan vi bruke utropstegn eller komma: "Hei!" "Hei, Anna."'
  }
};
