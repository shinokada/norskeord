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
  },

  'svarord-nyanser': {
    id: 'svarord-nyanser',
    titleEn: 'Answer words: nuances',
    titleNb: 'Svarord: nyanser',
    explanationEn:
      'Answer words can say more than yes or no. Tone of voice and small words like «da» and ' +
      '«vel» change the meaning. «Tja» expresses uncertainty: "Kommer du i morgen?" → "Tja." ' +
      '«Nja» is a hesitant and fairly negative answer: "Likte du leiligheten?" → "Nja." «Ja da», ' +
      '«jo da» and «nei da» can sound reassuring. We like to give the answer the person asking ' +
      'hopes for: "Er du syk?" → "Nei da." When the answer is negative and not what the person ' +
      'asking hopes for, we usually do not use «da»: "Kommer du i morgen?" → "Nei, dessverre." ' +
      '«Ja vel» and «nei vel» show that we have understood a message or piece of information: ' +
      '"Jeg blir hjemme i dag." → "Ja vel." When the statement before is negative (for example ' +
      'with «ikke», «neppe» or «aldri»), we usually answer «nei vel»: "Det blir ikke noe møte i ' +
      'dag." → "Nei vel." «Å ja» and «å nei» are used in much the same way, but also show that ' +
      'we are pleased or disappointed. When we answer a negative statement, we use «nei» to ' +
      'agree and «jo» to contradict: "Dette er ikke så vanskelig." → "Nei, det er ganske lett." ' +
      '"Du rydder aldri på kjøkkenet!" → "Jo, det gjør jeg!"',
    explanationNb:
      'Svarord kan gi mer enn ja eller nei. Tonefall og småord som «da» og «vel» endrer ' +
      'betydningen.\n\n' +
      '• **«Tja»** uttrykker usikkerhet: "Kommer du i morgen?" → "Tja."\n' +
      '• **«Nja»** er et nølende og nokså negativt svar: "Likte du leiligheten?" → "Nja."\n' +
      '• **«Ja da», «jo da» og «nei da»** kan virke beroligende. Vi gir gjerne det svaret den som ' +
      'spør håper på: "Er du syk?" → "Nei da." Når svaret er negativt og ikke det den som spør ' +
      'håper på, bruker vi vanligvis ikke «da»: "Kommer du i morgen?" → "Nei, dessverre."\n' +
      '• **«Ja vel» og «nei vel»** viser at vi har forstått en beskjed eller opplysning: "Jeg ' +
      'blir hjemme i dag." → "Ja vel." Når utsagnet foran er negativt (for eksempel med «ikke», ' +
      '«neppe» eller «aldri»), svarer vi vanligvis «nei vel»: "Det blir ikke noe møte i dag." → ' +
      '"Nei vel."\n' +
      '• **«Å ja» og «å nei»** brukes omtrent på samme måte, men viser også at vi blir glade ' +
      'eller skuffet.\n' +
      '• **Enighet og uenighet:** Når vi svarer på et negativt utsagn, bruker vi «nei» når vi er ' +
      'enige og «jo» når vi motsier: "Dette er ikke så vanskelig." → "Nei, det er ganske ' +
      'lett." "Du rydder aldri på kjøkkenet!" → "Jo, det gjør jeg!"'
  }
};
