// src/lib/grammar/rules/sammenbinding-av-setninger.ts
// Rules for chapter 17 · Sammenbinding av setninger (Part 3). Order follows taxonomy.ts.
// Formatting of `explanationNb`: see the header comment in ./index.ts.
import type { GrammarRule } from '$lib/types';

export const SAMMENBINDING_AV_SETNINGER_RULES: Record<string, GrammarRule> = {
  'tillegg-setninger': {
    id: 'tillegg-setninger',
    titleEn: 'Adding information: og, dessuten, også, heller ikke',
    titleNb: 'Tillegg: «og», «dessuten», «også» og «heller ikke»',
    explanationEn:
      'We use these words to add more information.\n\n' +
      '**og** joins two sentences: "Det regnet, og det var kaldt." After «og» the word order is normal.\n\n' +
      '**dessuten** means "in addition" and is used to add a new point: "Jeg må lage middag, og jeg ' +
      'må dessuten vaske tøy." When «dessuten» comes first in the sentence, the verb follows right ' +
      'after it: "Dessuten må jeg vaske tøy."\n\n' +
      '**også** is used in an affirmative sentence. It can stand after the verb: "Vi skal også til ' +
      'Roma." It can also stand last: "Vi trenger kaffe også."\n\n' +
      '**heller ikke** is used in a negated sentence: "Vi har ikke brød, og vi har heller ikke kaffe." ' +
      'We can also put «heller» last: "Vi har ikke kaffe heller."',
    explanationNb:
      'Vi kan bruke disse ordene når vi vil legge til mer informasjon.\n\n' +
      '• **og** binder sammen to setninger: «Det regnet, og det var kaldt.» Etter «og» har vi vanlig ' +
      'ordstilling.\n' +
      '• **dessuten** betyr «i tillegg» og brukes når vi legger til et nytt poeng: «Jeg må lage ' +
      'middag, og jeg må dessuten vaske tøy.» Står «dessuten» først i setningen, kommer verbet ' +
      'rett etter: «Dessuten må jeg vaske tøy.»\n' +
      '• **også** brukes i en bekreftende setning. Det kan stå etter verbet: «Vi skal også til ' +
      'Roma.» Det kan også stå sist: «Vi trenger kaffe også.»\n' +
      '• **heller ikke** brukes i en nektende setning: «Vi har ikke brød, og vi har heller ikke ' +
      'kaffe.» Vi kan også bruke «heller» sist: «Vi har ikke kaffe heller.»'
  },
  'motsetning-selv-om-likevel': {
    id: 'motsetning-selv-om-likevel',
    titleEn: '«men» vs. «selv om» vs. «likevel»',
    titleNb: '«men», «selv om» og «likevel»',
    explanationEn:
      'Three ways to express the same contrast, each with different grammar. «Men» coordinates two ' +
      'main clauses, no word-order change: "De savner familien, men de vil bli her." «Selv om» ' +
      'subordinates the concession clause (normal subordinate word order, can go first or second): ' +
      '"Selv om de savner familien, vil de bli her." «Likevel» is a sentence adverb that fronts and ' +
      'triggers V2 inversion like any other fronted adverbial: "De savner familien. Likevel vil de ' +
      'bli her."',
    explanationNb:
      'Tre måter å uttrykke samme motsetning på, med ulik grammatikk:\n\n' +
      '• **«men»** — sideordner to helsetninger, ingen endring i ordstilling: "De savner familien, men de vil bli her."\n' +
      '• **«selv om»** — underordner innrømmelsesleddsetningen (vanlig leddsetningsordstilling, kan stå først eller sist): "Selv om de savner familien, vil de bli her."\n' +
      '• **«likevel»** — er et setningsadverb som fronter og utløser V2-inversjon som ethvert annet fundamentplassert adverbial: "De savner familien. Likevel vil de bli her."'
  },

  'tidssekvens-etter-at-etterpaa': {
    id: 'tidssekvens-etter-at-etterpaa',
    titleEn: '«etter at» vs. «etterpå» vs. «så»',
    titleNb: '«etter at», «etterpå» og «så»',
    explanationEn:
      'All three sequence two events, but behave differently. «Etter at» is a subjunction ' +
      'introducing a subordinate clause (normal subordinate word order): "Etter at jeg hadde spist, ' +
      'gikk jeg en tur." «Etterpå» is a sentence adverb — as its own clause opener it triggers V2 ' +
      'inversion: "Jeg spiste. Etterpå gikk jeg en tur." «Så» is a coordinating conjunction joining ' +
      'two main clauses with no inversion: "Jeg spiste, så gikk jeg en tur." A related pair for ' +
      'simultaneity (not sequence) follows the same subjunction-vs-adverb split: «mens» is a ' +
      'subjunction introducing a subordinate clause ("Mens jeg lagde middag, ringte telefonen"), ' +
      'while «samtidig» is a sentence adverb that triggers V2 inversion as a clause opener ("Jeg ' +
      'lagde middag. Samtidig ringte telefonen."). Note also that «etter» alone is a plain ' +
      'preposition taking a noun phrase ("etter jobben"), distinct from the subjunction «etter at», ' +
      'which always introduces a full clause with its own verb ("etter at jobben var ferdig").',
    explanationNb:
      'Alle tre rekkefølger to hendelser, men oppfører seg ulikt:\n\n' +
      '• **«etter at»** — er en subjunksjon som innleder en leddsetning (vanlig leddsetningsordstilling): "Etter at jeg hadde spist, gikk jeg en tur."\n' +
      '• **«etterpå»** — er et setningsadverb — som setningsåpner utløser det V2-inversjon: "Jeg spiste. Etterpå gikk jeg en tur."\n' +
      '• **«så»** — er en sideordningskonjunksjon som binder sammen to helsetninger uten inversjon: "Jeg spiste, så gikk jeg en tur."\n\n' +
      'Et beslektet par for samtidighet (ikke rekkefølge) følger samme subjunksjon-mot-adverb-mønster:\n\n' +
      '• **«mens»** — er en subjunksjon som innleder en leddsetning: "Mens jeg lagde middag, ringte telefonen."\n' +
      '• **«samtidig»** — er et setningsadverb som utløser V2-inversjon som setningsåpner: "Jeg lagde middag. Samtidig ringte telefonen."\n\n' +
      'Legg også merke til at «etter» alene er en vanlig preposisjon som tar en substantivfrase ("etter jobben"), til forskjell fra subjunksjonen «etter at», som alltid innleder en hel leddsetning med eget verb ("etter at jobben var ferdig").'
  },

  'for-a-fordi': {
    id: 'for-a-fordi',
    titleEn: '«for å» vs. «fordi»',
    titleNb: '«for å» og «fordi»',
    explanationEn:
      '«For å» + infinitive states a PURPOSE: "Jeg går til byen for å handle." «Fordi» + a full ' +
      'clause with its own subject and verb states a CAUSE: "Jeg går til byen fordi jeg trenger ' +
      'mat."',
    explanationNb:
      'To måter å uttrykke hensikt og årsak på:\n\n' +
      '• **«for å»** + infinitiv — uttrykker en HENSIKT: "Jeg går til byen for å handle."\n' +
      '• **«fordi»** + en hel setning med eget subjekt og verb — uttrykker en ÅRSAK: "Jeg går til byen fordi jeg trenger mat."'
  },

  'derfor-fordi': {
    id: 'derfor-fordi',
    titleEn: '«derfor» vs. «fordi»',
    titleNb: '«derfor» og «fordi»',
    explanationEn:
      '«Derfor» ("therefore") starts a new main clause expressing a RESULT, and triggers V2 ' +
      'inversion like any fronted adverbial: "Sofaen er for stor. Derfor vil hun selge den." ' +
      '«Fordi» ("because") introduces a subordinate clause expressing a CAUSE, with normal ' +
      'subject-before-verb order: "Hun vil selge sofaen fordi den er for stor."',
    explanationNb:
      '«Derfor» og «fordi» uttrykker samme forhold, men med ulik grammatikk:\n\n' +
      '• **«derfor»** — innleder en ny hovedsetning som uttrykker en FØLGE, og utløser V2-inversjon som ethvert fundamentplassert adverbial: "Sofaen er for stor. Derfor vil hun selge den."\n' +
      '• **«fordi»** — innleder en leddsetning som uttrykker en ÅRSAK, med vanlig subjekt-før-verb-rekkefølge: "Hun vil selge sofaen fordi den er for stor."'
  },

  'for-sa-arsak-folge': {
    id: 'for-sa-arsak-folge',
    titleEn: '«for» vs. «så» (coordinating cause/result)',
    titleNb: '«for» og «så» (sideordning: årsak/følge)',
    explanationEn:
      'Both join two full main clauses with no change in word order. «For» states the CAUSE, ' +
      'placed in the second clause: "Hun kommer ikke i morgen, for hun har det travelt." «Så» ' +
      'states the RESULT, also in the second clause: "Hun har det travelt, så hun kommer ikke i ' +
      'morgen." Choosing correctly means identifying which clause is the cause and which is the ' +
      'result, then placing «for»/«så» before the one that is NOT the cause-first clause.',
    explanationNb:
      'Begge binder sammen to helsetninger uten å endre ordstillingen:\n\n' +
      '• **«for»** — uttrykker ÅRSAKEN, plassert i den andre setningen: "Hun kommer ikke i morgen, for hun har det travelt."\n' +
      '• **«så»** — uttrykker FØLGEN, også i den andre setningen: "Hun har det travelt, så hun kommer ikke i morgen."'
  },

  'kontrast-uttrykk': {
    id: 'kontrast-uttrykk',
    titleEn: 'A broader toolkit for contrast and concession',
    titleNb: 'Flere måter å uttrykke motsetning',
    explanationEn:
      'Beyond selv om/likevel, B2 texts draw on a fuller contrast toolkit: subjunksjons «enda» and ' +
      '«til tross for at» (both near-synonyms of selv om); adverbs «til tross for det»/«ikke desto ' +
      'mindre» ("nevertheless"), «imidlertid»/«derimot» ("however"), «tvert imot» ("on the ' +
      'contrary"), «ellers» ("otherwise"), «i motsetning til» ("unlike"); and the correlative pair ' +
      '«på den ene siden ... på den andre siden» ("on the one hand ... on the other hand"). Note ' +
      'that «enda» is more versatile than its subjunksjon use above: as an adverb it can also mean ' +
      '(1) "still" (fremdeles) — here it is interchangeable with «ennå»: "Bor du der ennå/enda?"; ' +
      '(2) "one more"/"in addition", placed before a numeral: "Kan jeg få enda en kopp?"; or (3) a ' +
      'higher degree, placed before a comparative: "en enda bedre jobb." «Ennå» only ever carries ' +
      'meaning (1) — it can never replace «enda» in the numeral, comparative, or subjunksjon uses.',
    explanationNb:
      'Utover selv om/likevel bruker B2-tekster et fyldigere sett motsetningsuttrykk:\n\n' +
      '• **subjunksjoner**: «enda» og «til tross for at» (begge nær synonymt med selv om)\n' +
      '• **adverb**: «til tross for det» / «ikke desto mindre», «imidlertid» / «derimot», «tvert imot», «ellers», «i motsetning til»\n' +
      '• **korrelatpar**: «på den ene siden ... på den andre siden»\n\n' +
      'Merk at «enda» er mer allsidig enn subjunksjonsbruken over. Som adverb kan «enda» også bety:\n\n' +
      '• **fremdeles**: her er «enda» og «ennå» synonyme — «Bor du der ennå/enda?»\n' +
      '• **i tillegg / én til**, foran et tallord — «Kan jeg få enda en kopp?»\n' +
      '• **høyere grad**, foran en komparativ — «en enda bedre jobb»\n\n' +
      '«Ennå» har bare betydningen fremdeles — det kan aldri erstatte «enda» foran tallord, komparativ eller som subjunksjon.'
  },

  'betingelse-hvis-dersom': {
    id: 'betingelse-hvis-dersom',
    titleEn: 'Conditions with hvis and dersom',
    titleNb: 'Betingelse: «hvis» og «dersom»',
    explanationEn:
      'We use «hvis» or «dersom» to express a condition for something to happen. «Dersom» means the ' +
      'same as «hvis» and is often used in slightly more formal language.\n\n' +
      '**The condition clause after the main clause:** "Jeg kommer hvis jeg får tid." "Han kommer ' +
      'dersom han ikke har feber." In the condition clause, «ikke» stands between the subject and the ' +
      'verb.\n\n' +
      '**The condition clause first:** the verb then comes first in the main clause: "Hvis du har ' +
      'feber, må du ikke gå på jobben."',
    explanationNb:
      'Vi bruker «hvis» eller «dersom» når vi uttrykker en betingelse for at noe skal skje. ' +
      '«Dersom» betyr det samme som «hvis» og brukes ofte i et litt mer formelt språk.\n\n' +
      '• **Leddsetningen etter hovedsetningen:** «Jeg kommer hvis jeg får tid.» «Han kommer dersom han ' +
      'ikke har feber.» I leddsetningen står «ikke» mellom subjektet og verbet.\n' +
      '• **Leddsetningen først:** Da kommer verbet først i hovedsetningen: «Hvis du har feber, må du ' +
      'ikke gå på jobben.»'
  },

  'arsak-og-folge-uttrykk': {
    id: 'arsak-og-folge-uttrykk',
    titleEn: 'A broader toolkit for cause, effect, and purpose',
    titleNb: 'Flere måter å uttrykke årsak, følge og hensikt',
    explanationEn:
      'Beyond derfor/fordi, B2 texts draw on a fuller causation toolkit: subjunksjons «siden»/«i og ' +
      'med at»/«ettersom» (cause, near-synonyms of fordi) and «slik at» (result); adverbs «dermed» ' +
      '("as a result of this") and «nemlig» (explains the previous sentence, mid-position); ' +
      'causative verbs «føre til», «skyldes», «gjøre at», «føre med seg», «henge sammen med»; nominal ' +
      'expressions «grunn(en til)», «årsak(en til)», «følge(n)», often followed by «at»-clauses ' +
      '("årsaken til at ..."); and hensikt (purpose) clauses with «for at», «slik at», «så» ("Hun ' +
      'åpnet vinduet for at han skulle få frisk luft"). The fixed expression «dermed basta!» ("and ' +
      'that settles it!") uses «dermed» to declare a matter closed, with no further discussion.',
    explanationNb:
      'Utover derfor/fordi bruker B2-tekster et fyldigere sett årsaksuttrykk:\n\n' +
      '• **subjunksjoner**: «siden» / «i og med at» / «ettersom» (årsak, nær synonymt med fordi) og «slik at» (følge)\n' +
      '• **adverb**: «dermed» ("som følge av dette") og «nemlig» (forklarer forrige setning, midtfeltplassering)\n' +
      '• **årsaksverb**: «føre til», «skyldes», «gjøre at», «føre med seg», «henge sammen med»\n' +
      '• **nominale uttrykk**: «grunn(en til)», «årsak(en til)», «følge(n)», ofte fulgt av at-setninger ("årsaken til at ...")\n' +
      '• **hensiktssetninger**: «for at», «slik at», «så» ("Hun åpnet vinduet for at han skulle få frisk luft")\n\n' +
      'Det faste uttrykket «dermed basta!» ("og dermed er saken avgjort!") bruker «dermed» for å erklære en sak avsluttet, uten videre diskusjon.'
  },

  'hypotetiske-betingelsessetninger': {
    id: 'hypotetiske-betingelsessetninger',
    titleEn: 'Hypothetical and counterfactual conditionals',
    titleNb: 'Hypotetiske betingelsessetninger',
    explanationEn:
      'Conditionals are graded by how (un)real the condition is. A real future possibility uses ' +
      'presens throughout: "Hvis jeg vinner i Lotto, reiser jeg jorda rundt." An unlikely present/' +
      'future hypothetical uses preteritum in the hvis-clause and ville/skulle + infinitiv in the ' +
      'main clause: "Hvis jeg vant i Lotto, ville jeg reise jorda rundt." An unrealized past ' +
      'counterfactual uses preteritum perfektum in the hvis-clause and ville (ha)/skulle (ha) + ' +
      'perfektum partisipp in the main clause: "Hvis jeg hadde vunnet i Lotto, ville jeg (ha) reist ' +
      'jorda rundt" — «hvis» can also be dropped with inversion: "Hadde jeg vunnet ..., ville jeg ..." ' +
      'The related wish constructions «skulle ønske (at) + preteritum/preteritum perfektum» and ' +
      '«tenk om + preteritum/preteritum perfektum/presens» use the same tense logic. «Hvis» can be ' +
      'dropped with subject/verb inversion in a REAL, presens condition too, not just the ' +
      'counterfactual branches above: "Hvis du drar nå, kan jeg ikke hjelpe deg" → "Drar du nå, kan ' +
      'jeg ikke hjelpe deg." The main clause stays presens throughout, unlike the ville/skulle main ' +
      'clause used with the hypothetical and counterfactual branches.',
    explanationNb:
      'Betingelsessetninger gradbøyes etter hvor (u)virkelig betingelsen er:\n\n' +
      '• **reell framtidig mulighet** = presens gjennomgående: "Hvis jeg vinner i Lotto, reiser jeg jorda rundt."\n' +
      '• **usannsynlig nåtidig/framtidig hypotetisk tilfelle** = preteritum i hvis-setningen og ville/skulle + infinitiv i hovedsetningen: "Hvis jeg vant i Lotto, ville jeg reise jorda rundt."\n' +
      '• **uoppfylt fortidig tilfelle** = preteritum perfektum i hvis-setningen og ville (ha)/skulle (ha) + perfektum partisipp i hovedsetningen: "Hvis jeg hadde vunnet i Lotto, ville jeg (ha) reist jorda rundt" — «hvis» kan også sløyfes med inversjon: "Hadde jeg vunnet ..., ville jeg ..."\n\n' +
      'De beslæktede ønskeuttrykkene «skulle ønske (at) + preteritum/preteritum perfektum» og «tenk om + preteritum/preteritum perfektum/presens» følger samme tempuslogikk.\n\n' +
      '«Hvis» kan sløyfes med subjekt/verb-inversjon også i en REELL presens-betingelse, ikke bare i de kontrafaktiske variantene over: "Hvis du drar nå, kan jeg ikke hjelpe deg" → "Drar du nå, kan jeg ikke hjelpe deg." Hovedsetningen forblir presens gjennomgående, ulikt ville/skulle-hovedsetningen som brukes i de hypotetiske og kontrafaktiske variantene.'
  },

  'ordet-sa': {
    id: 'ordet-sa',
    titleEn: 'The word «så»',
    titleNb: 'Ordet «så»',
    explanationEn:
      '«Så» has three roles. As a KONJUNKSJON linking two main clauses, it expresses result with ' +
      'no word-order change. As a TIDSADVERB starting a new main clause ("Then …"), it triggers ' +
      'V2 inversion. As a SUBJUNKSJON introducing a leddsetning (≈ slik at), normal subordinate ' +
      'word order applies.',
    explanationNb:
      '«Så» har tre roller:\n\n' +
      '• **konjunksjon** — mellom to hovedsetninger uttrykker den følge uten endring i ordstilling\n' +
      '• **tidsadverb** — som innleder en ny hovedsetning ("Deretter …"), utløser den V2-inversjon\n' +
      '• **subjunksjon** — som innleder en leddsetning (≈ slik at), gjelder vanlig leddsetnings-ordstilling'
  }
};
