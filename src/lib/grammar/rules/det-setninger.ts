// src/lib/grammar/rules/det-setninger.ts
// Rules for chapter 5 · Det-setninger (Part 1). Order follows taxonomy.ts.
// Formatting of `explanationNb`: see the header comment in ./index.ts.
import type { GrammarRule } from '$lib/types';

export const DET_SETNINGER_RULES: Record<string, GrammarRule> = {
  'vaer-det-subjekt': {
    id: 'vaer-det-subjekt',
    titleEn: 'Impersonal «det» (weather, general statements)',
    titleNb: 'Upersonlig «det» (vær, allmenne utsagn)',
    explanationEn:
      'Weather expressions and many general statements need a dummy subject «det», with no ' +
      'real-world referent — it can never be dropped the way English sometimes drops "it": ' +
      '"Det regner." "Det blåser." "Det er kaldt i dag."',
    explanationNb:
      'Vær og mange allmenne utsagn trenger et formelt subjekt «det», uten noen egentlig referent — det kan aldri utelates:\n\n' +
      '• "Det regner."\n' +
      '• "Det blåser."\n' +
      '• "Det er kaldt i dag."'
  },

  'det-formelt-subjekt': {
    id: 'det-formelt-subjekt',
    titleEn: '«Det» as formal/dummy subject, incl. cleft sentences',
    titleNb: '«Det» som formelt subjekt, inkl. utbryting med «det er/var … som»',
    explanationEn:
      "Norwegian sentences need a subject, and new or indefinite information usually shouldn't open " +
      'the sentence. «Det» fills the subject slot as an empty placeholder while the real (logical) ' +
      'subject — often indefinite — moves later in the sentence: "Det sitter noen elever i ' +
      'klasserommet," "Det ble utlyst en ledig stilling." The same construction applies to passive ' +
      'sentences with an indefinite logical subject: "Det snakkes mye om dette," "Det må gjøres ' +
      'noe." A related use is the cleft/emphasis construction «Det er/var X som …», which fronts and ' +
      'highlights one constituent: "Det var broren min som ringte" (not someone else). «Som» is ' +
      'required when the fronted element is the subject, and is usually dropped otherwise ("Det er ' +
      'deg jeg elsker"). The pattern is also common in spoken wh-questions: "Hvem var det som ' +
      'ringte?"',
    explanationNb:
      'Norske setninger trenger et subjekt, og ny eller ubestemt informasjon skal vanligvis ikke stå ' +
      'først i setningen. «Det» fyller subjektsplassen som en tom plassholder mens det virkelige ' +
      '(logiske) subjektet — ofte ubestemt — flyttes lenger ut i setningen: "Det sitter noen elever i ' +
      'klasserommet," "Det ble utlyst en ledig stilling."\n\n' +
      'Samme konstruksjon gjelder passive setninger med et ubestemt logisk subjekt: "Det snakkes mye ' +
      'om dette," "Det må gjøres noe."\n\n' +
      'En beslektet bruk er **utbrytingskonstruksjonen «Det er/var X som …»**, som flytter fram og ' +
      'framhever ett ledd: "Det var broren min som ringte" (ikke noen andre). «Som» er påkrevd når ' +
      'det framhevede leddet er subjekt, og sløyfes vanligvis ellers ("Det er deg jeg elsker"). Mønsteret ' +
      'er også vanlig i muntlige hv-spørsmål: "Hvem var det som ringte?"'
  },

  'det-sentence': {
    id: 'det-sentence',
    titleEn: '"Det"-sentences (cleft/extraposition)',
    titleNb: '"Det"-setninger (kløvningssetning)',
    explanationEn:
      'Norwegian can move a clausal subject to the end and start with "Det er … at/å …": ' +
      '"At du kan komme, er fint." → "Det er fint at du kan komme." ' +
      'The "det" is a formal/anticipatory subject. The same pattern also fronts an ordinary ' +
      'subject for emphasis, with «som» instead of «at»: "Mange er bekymret." → "Det er mange ' +
      'som er bekymret." "Henrik fikk jobben." → "Det var Henrik som fikk jobben."',
    explanationNb:
      'To bruksområder for «det er …» kløvningssetninger:\n\n' +
      '• **med «at»/«å»** — flytter et leddsetnings-subjekt til slutten, med «det» som formelt forutgripende subjekt: "At du kan komme, er fint." → "Det er fint at du kan komme."\n' +
      '• **med «som»** — fronter et vanlig subjekt for å fremheve det: "Mange er bekymret." → "Det er mange som er bekymret." "Henrik fikk jobben." → "Det var Henrik som fikk jobben."'
  }
};
