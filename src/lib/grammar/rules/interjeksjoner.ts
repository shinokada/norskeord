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
  },

  folelsesuttrykk: {
    id: 'folelsesuttrykk',
    titleEn: 'Expressing feelings',
    titleNb: 'Uttrykk for følelser',
    explanationEn:
      'We use short expressions to show how we feel or react. Good news: Så bra! Så fint! ' +
      'Gratulerer med dagen! Hurra! Bad news: Så synd! Å nei! Det var leit å høre. Surprise: Oi! ' +
      'Pain, irritation or something unpleasant: Au! Uff! Huff! "Så + adjective" expresses that ' +
      'something is very much so, roughly like "Det er veldig fint!" When we react to a whole ' +
      'situation we use the neuter form: "Så fint!" "Så synd!" With a noun the adjective agrees ' +
      'with it: "Så fin kjole!" "Så pent hus!" An exclamation mark often follows.',
    explanationNb:
      'Vi bruker korte uttrykk for å vise hva vi føler eller hvordan vi reagerer.\n\n' +
      '• **Gode nyheter:** Så bra! Så fint! Gratulerer med dagen! Hurra!\n' +
      '• **Dårlige nyheter:** Så synd! Å nei! Det var leit å høre.\n' +
      '• **Overraskelse:** Oi!\n' +
      '• **Smerte, irritasjon eller noe ubehagelig:** Au! Uff! Huff!\n\n' +
      '**Så + adjektiv:** «Så fint!» uttrykker at noe er veldig fint, omtrent som "Det er veldig ' +
      'fint!" Når vi snakker om en hel situasjon, bruker vi intetkjønn: "Så fint!" "Så ' +
      'synd!"\n\n' +
      'Med et substantiv retter adjektivet seg etter substantivet: "Så fin kjole!" "Så pent ' +
      'hus!"\n\n' +
      'Etter uttrykkene bruker vi ofte utropstegn: "Så bra!" "Oi!"'
  }
};
