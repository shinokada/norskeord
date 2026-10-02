// src/lib/grammar/rules/verb.ts
// Rules for chapter 11 · Verb (Part 2). Order follows taxonomy.ts.
// Formatting of `explanationNb`: see the header comment in ./index.ts.
import type { GrammarRule } from '$lib/types';

export const VERB_RULES: Record<string, GrammarRule> = {
  'sterke-verb-c': {
    id: 'sterke-verb-c',
    titleEn: 'Rare strong verbs',
    titleNb: 'Sjeldne sterke verb',
    explanationEn:
      'A set of rarer strong verbs beyond the common A2/B1 list, with irregular ' +
      'preteritum/perfektum forms that must be memorized: bry seg (brydde/brøt), briste (brast), ' +
      'by (bød), gale (gol/galte), sige (seg), fyke (føk/føyk), kvekke (kvakk).',
    explanationNb:
      'Et sett med sjeldnere sterke verb utover den vanlige A2/B1-listen, med uregelmessige preteritum-/perfektumformer som må pugges:\n\n' +
      '• bry seg (brydde/brøt)\n' +
      '• briste (brast)\n' +
      '• by (bød)\n' +
      '• gale (gol/galte)\n' +
      '• sige (seg)\n' +
      '• fyke (føk/føyk)\n' +
      '• kvekke (kvakk)'
  },

  'infinitiv-a1': {
    id: 'infinitiv-a1',
    titleEn: 'The infinitive after modal verbs and «like å»',
    titleNb: 'Infinitiv etter modalverb og «like å»',
    explanationEn:
      'A second verb right after a modal verb (kan, vil, skal, må) stays in the bare infinitive, ' +
      'with no "å": "Jeg vil lære norsk." After verbs like «like», «pleie», «prøve», the ' +
      'infinitive instead needs «å»: "Jeg liker å lære norsk." Many verbs and adjectives instead ' +
      'take a fixed PREPOSITION before «å»: «bestemme seg for å», «ha lyst til å», «være ivrig ' +
      'etter å», «være opptatt med å» — while others take «for å» to express purpose, and a few ' +
      'take no preposition at all («jeg liker å», «det var umulig å»). These must be learned per ' +
      'expression, similar to how English varies ("decide to" vs. "look forward to -ing").',
    explanationNb:
      'Norsk skiller mellom tre mønstre for verb nummer to i en setning:\n\n' +
      '• **naken infinitiv** — rett etter et modalverb (kan, vil, skal, må), uten «å»: "Jeg vil lære norsk."\n' +
      '• **«å» + infinitiv** — etter verb som «like», «pleie», «prøve»: "Jeg liker å lære norsk."\n' +
      '• **fast preposisjon + «å»** — mange verb og adjektiv tar en bestemt preposisjon foran «å»: «bestemme seg for å», «ha lyst til å», «være ivrig etter å», «være opptatt med å» — mens andre tar «for å» for å uttrykke hensikt, og noen få tar ingen preposisjon i det hele tatt («jeg liker å», «det var umulig å»). Disse må læres per uttrykk.'
  },

  'verbform-i-kontekst': {
    id: 'verbform-i-kontekst',
    titleEn: 'Infinitive vs. presens across a sentence',
    titleNb: 'Infinitiv eller presens gjennom en setning',
    explanationEn:
      'Choosing between the bare infinitive (after modals, "pleier," "begynner") and the ' +
      'conjugated presens form is an A1/A2 rule, but applying it correctly across a long sentence ' +
      'with three or four verb slots at once is a genuine accuracy challenge at C level. ' +
      'Questions use the actual C-level verbs from `draft/c/Norsk-for-deg/grammar25-39-verb.md` items 25–27 ' +
      '(cross-checked against `vocab-c.json`), not generic A1 verbs, so the vocabulary load ' +
      'matches the rest of the C-level content.',
    explanationNb:
      'Å velge mellom bar infinitiv (etter modale hjelpeverb, «pleier», «begynner») og bøyd presensform er en A1/A2-regel, men å bruke den riktig gjennom en lang setning med tre eller fire verbplasser samtidig er en reell presisjonsutfordring på nivå C.\n\n' +
      'Spørsmålene bruker de faktiske nivå C-verbene fra `draft/c/Norsk-for-deg/grammar25-39-verb.md` punkt 25–27 (kryssjekket mot `vocab-c.json`), ikke generiske A1-verb, slik at ordforrådet passer med resten av nivå-C-innholdet.'
  },

  'presens-verb': {
    id: 'presens-verb',
    titleEn: 'Presens (present tense)',
    titleNb: 'Presens',
    explanationEn:
      'Regular verbs add -r (or -er after a consonant) in presens, with ONE form for every ' +
      'person: jeg/du/han/hun/vi/dere/de snakker. Unlike English, there is no extra "-s" for ' +
      'third person singular and no separate continuous form — "snakker" alone covers both ' +
      '"speaks" and "is speaking."',
    explanationNb:
      'Regelrette verb får -r (eller -er etter konsonant) i presens, med ÉN form for alle personer: jeg/du/han/hun/vi/dere/de snakker.\n\n' +
      'I motsetning til engelsk finnes det ingen ekstra "-s" for tredje person entall, og ingen egen -ing-form.'
  },

  'framtid-uttrykk': {
    id: 'framtid-uttrykk',
    titleEn: 'Expressing the future',
    titleNb: 'Å uttrykke framtid',
    explanationEn:
      'Norwegian has no single future tense — several expressions cover it, each with its own ' +
      'complementation: «skal» (plan/intention), «vil» (prediction/willingness), «kommer til å» ' +
      '(prediction based on evidence), and fixed expressions like «har tenkt å», «har lyst til å», ' +
      '«håper (at)», «vil helst/gjerne» — each requiring a specific preposition or none at all ' +
      'before the infinitive. A useful test for «skal» vs. «kommer til å»: can the subject plan ' +
      'or decide the outcome? If yes, use «skal» ("Jeg skal bygge hus" — I control this). If the ' +
      "outcome is a state or event beyond anyone's control — sales figures, the weather, how a " +
      'match turns out — use «kommer til å», even without a specific visible sign ("Denne boka ' +
      'kommer til å selge veldig mye" — no one can plan or decide book sales).',
    explanationNb:
      'Norsk har ingen egen framtidstid — flere uttrykk dekker det, hvert med sin egen komplementering:\n\n' +
      '• **skal** = plan/intensjon\n' +
      '• **vil** = spådom/vilje\n' +
      '• **kommer til å** = spådom basert på bevis\n' +
      '• faste uttrykk: «har tenkt å», «har lyst til å», «håper (at)», «vil helst/gjerne» — hver med sin egen preposisjon eller ingen foran infinitiv\n\n' +
      'En nyttig test for «skal» mot «kommer til å»: kan subjektet planlegge eller bestemme utfallet selv? Hvis ja, bruk «skal» ("Jeg skal bygge hus" — dette bestemmer jeg selv). Hvis utfallet er en tilstand eller hendelse ingen kan bestemme over — salgstall, været, hvordan en kamp går — bruk «kommer til å», selv uten et konkret synlig tegn ("Denne boka kommer til å selge veldig mye" — ingen kan planlegge eller bestemme bokas salg).'
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
      'Modalverb (kan, vil, skal, må, bør, får) følges direkte av naken infinitiv (uten «å»): "Jeg kan hjelpe deg." IKKE "Jeg kan å hjelpe deg."\n\n' +
      'I leddsetninger kommer «ikke» foran modalverbet: "…at jeg ikke kan hjelpe deg."'
  },

  'modalverb-preteritum': {
    id: 'modalverb-preteritum',
    titleEn: 'Modal verbs: meaning and preteritum forms',
    titleNb: 'Modalverb: betydning og preteritumsformer',
    explanationEn:
      'Modal verbs have irregular preteritum forms: kan→kunne, vil→ville, skal→skulle, må→måtte, ' +
      'bør→burde. Used as plain past tense ("Jeg måtte jobbe i går") and constantly in reported ' +
      'speech, where a present-tense modal statement or question shifts to its preteritum form: ' +
      '"Jeg må vente." → "Hun sa at hun måtte vente." "Skal jeg hjelpe?" → "Hun spurte om hun skulle ' +
      'hjelpe." ' +
      'The modals also differ sharply in MEANING: «må» = necessity ("vi er nødt til å …"), «skal» = ' +
      'a plan or arrangement ("vi har planlagt å …"), «vil» = a wish or desire ("vi ønsker å …"), ' +
      '«kan» = possibility or ability ("vi har muligheten til å …"), and «bør» = a recommendation ' +
      '("det er best for oss å …"). A common rule of thumb: use «vil» for things/situations and ' +
      '«skal» for people ("Situasjonen vil bli bedre." / "Hun skal reise om to år."). Note also that ' +
      'asking a person for something with «skal» sounds impolite ("Jeg skal få et skjema" → wrong); ' +
      'use «kan» instead: "Kan jeg få et skjema?"',
    explanationNb:
      'Modalverb har uregelmessige preteritumsformer:\n\n' +
      '• kan → kunne\n' +
      '• vil → ville\n' +
      '• skal → skulle\n' +
      '• må → måtte\n' +
      '• bør → burde\n\n' +
      'Brukes som vanlig fortid ("Jeg måtte jobbe i går") og svært ofte i referert tale, der en ' +
      'presens-modalytring skifter til preteritumsform: "Jeg må vente." → "Hun sa at hun ' +
      'måtte vente." "Skal jeg hjelpe?" → "Hun spurte om hun skulle hjelpe."\n\n' +
      'Modalverbene skiller seg også sterkt i BETYDNING:\n\n' +
      '• **må** = nødvendighet: «Vi er nødt til å lære norsk.»\n' +
      '• **skal** = en plan/avtale: «Vi har planlagt å lære norsk.»\n' +
      '• **vil** = et ønske: «Vi ønsker å lære norsk.»\n' +
      '• **kan** = mulighet/evne: «Vi har muligheten til å lære norsk.»\n' +
      '• **bør** = en anbefaling: «Det er best for oss å lære norsk.»\n\n' +
      'En hovedregel: bruk «vil» om ting/situasjoner og «skal» om personer: «Situasjonen vil bli ' +
      'bedre.» / «Hun skal reise om to år.» Merk også at det er uhøflig å be noen om noe med «skal» ' +
      '(«Jeg skal få et skjema» → feil); bruk «kan» i stedet: «Kan jeg få et skjema?»'
  },

  'modalverb-betydning': {
    id: 'modalverb-betydning',
    titleEn: 'Choosing the right modal verb',
    titleNb: 'Å velge riktig modalverb',
    explanationEn:
      '«Kan» expresses ability or permission, «skal» expresses a plan/decision or an instruction ' +
      'from someone else, «vil» expresses desire or a prediction, «må» expresses necessity or ' +
      'obligation. In context, several can superficially seem to fit, but only one matches the ' +
      'actual meaning intended — e.g. "Skal vi lage kake?" (proposal) is different from "Vil du ' +
      'lage kake?" (asking about desire) and "Kan du lage kake?" (asking about ability/willingness).\n\n' +
      'A fifth modal verb, «bør» (past tense «burde»), expresses a RECOMMENDATION or piece of advice ' +
      '— what would be wise or advisable — and is noticeably weaker than «må»: "Du bør sove mer" ' +
      '(you should sleep more, a recommendation) is softer than "Du må sove mer" (you have to/must ' +
      "sleep more, a real necessity, e.g. doctor's orders). «Bør» is also common with «synes» to give " +
      'a stated opinion about how things should be: "Jeg synes vi bør endre planen" (I think we ' +
      'should change the plan).',
    explanationNb:
      'Fire modalverb dekker ulike betydninger:\n\n' +
      '• **kan** — uttrykker evne eller tillatelse\n' +
      '• **skal** — uttrykker en plan/beslutning eller en instruks fra noen andre\n' +
      '• **vil** — uttrykker ønske eller en spådom\n' +
      '• **må** — uttrykker nødvendighet eller plikt\n\n' +
      'I sammenheng kan flere se ut til å passe, men bare ett stemmer med den faktiske betydningen ' +
      'som er ment — f.eks. er «Skal vi lage kake?» (forslag) noe annet enn «Vil du lage kake?» ' +
      '(spør om ønske) og «Kan du lage kake?» (spør om evne/vilje).\n\n' +
      'Et femte modalverb, **bør** (preteritum **burde**), uttrykker en ANBEFALING — noe som ville vært ' +
      'lurt eller rådelig — og er merkbart svakere enn **må**: «Du bør sove mer» (en anbefaling) er ' +
      'mildere enn «Du må sove mer» (en reell nødvendighet, f.eks. legens ordre). «Bør» brukes ofte ' +
      'sammen med «synes» for å uttrykke en mening om hvordan noe bør være: «Jeg synes vi bør endre ' +
      'planen».'
  },

  'presens-perfektum': {
    id: 'presens-perfektum',
    titleEn: 'Presens perfektum (present perfect)',
    titleNb: 'Presens perfektum',
    explanationEn:
      'Presens perfektum = har/har ikke + perfektum partisipp: "Jeg har lest boka." Use it for ' +
      'completed actions relevant to an open/unfinished time frame (today, this week, "ever/never", ' +
      '"how long have you…"). Use preteritum instead for a closed past moment, usually with "i går" ' +
      'or "for … siden": "Jeg leste boka i går." Negative and never-answers: "Nei, jeg har ikke ' +
      'lest den." / "Nei, jeg har aldri lest den."',
    explanationNb:
      'Presens perfektum = har/har ikke + perfektum partisipp: "Jeg har lest boka."\n\n' +
      '• **presens perfektum** — brukes om avsluttede handlinger i en åpen/uavsluttet tidsramme (i dag, denne uka, «noen gang/aldri», «hvor lenge har du…»)\n' +
      '• **preteritum** — brukes for et avsluttet tidspunkt i fortida, ofte med «i går» eller «for … siden»: "Jeg leste boka i går."\n\n' +
      'Nekting og aldri-svar: "Nei, jeg har ikke lest den." / "Nei, jeg har aldri lest den."'
  },

  'preteritum-a1': {
    id: 'preteritum-a1',
    titleEn: 'Preteritum (simple past) — introduction',
    titleNb: 'Preteritum — introduksjon',
    explanationEn:
      'Regular verbs add -et, -te, or -a in preteritum: bodde, flyttet, lærte. A handful of very ' +
      'common verbs are irregular and must simply be memorized: være→var, ha→hadde, gå→gikk, ' +
      'komme→kom, ta→tok, si→sa.',
    explanationNb:
      'Regelrette verb får -et, -te eller -a i preteritum: bodde, flyttet, lærte.\n\n' +
      'Noen svært vanlige verb er uregelmessige og må pugges:\n' +
      '• være → var\n' +
      '• ha → hadde\n' +
      '• gå → gikk\n' +
      '• komme → kom\n' +
      '• ta → tok\n' +
      '• si → sa'
  },

  'sterke-verb': {
    id: 'sterke-verb',
    titleEn: 'Strong verbs (irregular past tense)',
    titleNb: 'Sterke verb (uregelmessig fortid)',
    explanationEn:
      'Strong verbs change their stem vowel in the preteritum rather than adding -et/-te. ' +
      'They must be learned individually. ' +
      'Common examples: gå → gikk, komme → kom, se → så, ta → tok, få → fikk, gi → ga, være → var. ' +
      'The past participle (used with «har») has its own form: gått, kommet, sett, tatt, fått, gitt, vært. ' +
      "When a strong verb's past participle ends in -et and is used as an adjective before a noun, " +
      'it declines like an adjective ending in -en ("en gammel → den gamle"): drop -et and add ' +
      '-en (indefinite) or -ne (definite/plural) — "en brukket fot" → "den brukne foten", ' +
      '"en revet lapp" → "den revne lappen", "et sprukket speil" → "det sprukne speilet".',
    explanationNb:
      'Sterke verb endrer stammevokalen i preteritum i stedet for å legge til -et/-te. De må læres hver for seg.\n\n' +
      '• gå → gikk (gått)\n' +
      '• komme → kom (kommet)\n' +
      '• se → så (sett)\n' +
      '• ta → tok (tatt)\n' +
      '• få → fikk (fått)\n' +
      '• gi → ga (gitt)\n' +
      '• være → var (vært)\n\n' +
      'Formen i parentes er perfektum partisipp, brukt med «har».\n\n' +
      'Når perfektum partisipp av et sterkt verb ender på -et og brukes som adjektiv foran et ' +
      'substantiv, bøyes det som et adjektiv som ender på -en ("en gammel → den gamle"): dropp ' +
      '-et og legg til -en (ubestemt) eller -ne (bestemt/flertall) — "en brukket fot" → "den brukne ' +
      'foten", "en revet lapp" → "den revne lappen", "et sprukket speil" → "det sprukne speilet".'
  },

  'verbet-a-fa': {
    id: 'verbet-a-fa',
    titleEn: 'The verb «å få»',
    titleNb: 'Verbet «å få»',
    explanationEn:
      '«Få» covers many meanings: receiving (Hun fikk lønn), obtaining (De fikk barn), being ' +
      'subjected to (Han fikk lungebetennelse), being punished, being available for sale. As a ' +
      'hjelpeverb, «få + infinitiv» expresses obligation/resignation, simple future, or ' +
      'permission; «få + perfektum partisipp» expresses a future completed action or that ' +
      'something was successfully accomplished.\n\n' +
      'The fixed expression «å få med seg» has three distinct senses depending on the object: ' +
      'to CATCH/WITNESS an event ("Dagbladet fikk med seg filmpremieren" = was there to see it), ' +
      'to UNDERSTAND/GRASP information ("Elevene fikk med seg grammatikken" = understood it), ' +
      'and to BRING something ALONG physically ("De fikk med seg bøkene hjem" = took the books ' +
      'with them). Context (an event, information, or an object) signals which sense applies.',
    explanationNb:
      '«Få» dekker mange betydninger:\n\n' +
      '• **som hovedverb** — å motta ("Hun fikk lønn"), å skaffe seg ("De fikk barn"), å bli utsatt for ("Han fikk lungebetennelse"), å bli straffet, å være til salgs\n' +
      '• **«få» + infinitiv** (hjelpeverb) — uttrykker tvang/resignasjon, enkel framtid eller tillatelse\n' +
      '• **«få» + perfektum partisipp** (hjelpeverb) — uttrykker en framtidig avsluttet handling eller at noe ble gjennomført\n\n' +
      'Det faste uttrykket «å få med seg» har tre ulike betydninger avhengig av objektet: å FANGE OPP/OPPLEVE en hendelse ("Dagbladet fikk med seg filmpremieren" = var til stede og så den), å FORSTÅ/OPPFATTE informasjon ("Elevene fikk med seg grammatikken" = forstod den), og å TA MED SEG noe fysisk ("De fikk med seg bøkene hjem" = tok bøkene med seg). Konteksten (en hendelse, informasjon eller en gjenstand) avgjør hvilken betydning som gjelder.'
  },

  'fa-perfektum-partisipp': {
    id: 'fa-perfektum-partisipp',
    titleEn: '«få» + perfektum partisipp (resultative)',
    titleNb: '«få» + perfektum partisipp (resultat i fokus)',
    explanationEn:
      '«Få» + perfektum partisipp puts the RESULT of an action in focus, especially whether it got ' +
      'successfully completed: "Fikk du lest avisa i dag?" (Did you manage to read the paper?) ' +
      '"Du må få levert artikkelen før fire" (make sure it gets delivered). Different from plain ' +
      'perfektum (har lest) — «få» adds the sense of managing to get something done, often against ' +
      'some obstacle or time pressure.',
    explanationNb:
      '«Få» + perfektum partisipp setter RESULTATET av en handling i fokus, særlig om den ble gjennomført:\n\n' +
      '• «Fikk du lest avisa i dag?»\n' +
      '• «Du må få levert artikkelen før fire.»\n\n' +
      'Ulikt vanlig perfektum (har lest) — «få» legger til en følelse av å ha klart å gjennomføre noe, ofte mot en hindring eller et tidspress.'
  },

  'refleksive-uttrykk': {
    id: 'refleksive-uttrykk',
    titleEn: 'Reflexive verb expressions',
    titleNb: 'Refleksive uttrykk',
    explanationEn:
      'Some Norwegian verbs are always paired with a reflexive pronoun (meg, deg, seg, oss, ' +
      'dere, seg) that matches the subject\'s person: "Jeg legger meg klokka ti." "Hun liker seg ' +
      'på hotellet." The reflexive pronoun always matches the SUBJECT, never a different person.',
    explanationNb:
      'Noen norske verb kombineres alltid med et refleksivt pronomen (meg, deg, seg, oss, dere, seg) som samsvarer med subjektets person: "Jeg legger meg klokka ti." "Hun liker seg på hotellet."\n\n' +
      'Det refleksive pronomenet samsvarer alltid med **subjektet**.'
  },

  'refleksive-verb': {
    id: 'refleksive-verb',
    titleEn: 'Reflexive verbs: glede seg, grue seg, føle seg',
    titleNb: 'Refleksive verb: glede seg, grue seg, føle seg',
    explanationEn:
      'Some Norwegian verbs pair with a reflexive pronoun that changes with the subject: jeg gleder ' +
      'MEG, du gleder DEG, han/hun/de gleder SEG, vi gleder OSS, dere gleder DERE. Same pattern for ' +
      'grue seg (to dread) and føle seg (to feel).',
    explanationNb:
      'Noen norske verb tar et refleksivt pronomen som endrer seg med subjektet:\n\n' +
      '• jeg gleder **meg**\n' +
      '• du gleder **deg**\n' +
      '• han/hun/de gleder **seg**\n' +
      '• vi gleder **oss**\n' +
      '• dere gleder **dere**\n\n' +
      'Samme mønster for grue seg og føle seg.'
  },

  's-verb': {
    id: 's-verb',
    titleEn: 'S-verbs (reciprocal/deponent)',
    titleNb: 'S-verb',
    explanationEn:
      'S-verbs end in -s in the infinitive and every finite form. Some express a reciprocal ' +
      'action (a motes = to meet each other, a sees = to see each other), and have no meaningful ' +
      'non-s counterpart with the same subject-plural sense. Others are deponent - the -s form ' +
      'is simply how the verb is used, with no separate non-s verb at all (a synes, a trives, a ' +
      'mislykkes). A few pairs exist where the -s form has a different meaning from the base ' +
      'verb (a finne = to find vs. a finnes = to exist).',
    explanationNb:
      'S-verb er verb som ender på -s i infinitiv og i alle bøyde former.\n\n' +
      '• **gjensidige s-verb** — uttrykker at to (eller flere) gjør noe med hverandre: *å møtes* ' +
      '(Vi møtes klokka fem.), *å sees* (Vi sees i morgen!), *å treffes*.\n' +
      '• **s-verb uten noe eget grunnverb** — finnes bare i s-form: *å synes* (Jeg synes det er ' +
      'fint.), *å trives* (Hun trives godt på jobben.), *å mislykkes*.\n' +
      '• **s-form med annen betydning enn grunnverbet** — *å finne* (å finne nøklene) vs. *å ' +
      'finnes* (Det finnes mange løsninger. — å eksistere).\n\n' +
      'S-verb bøyes vanligvis ikke i presens/preteritum på vanlig måte — formen holder seg lik i ' +
      'presens: *de møtes, de møttes* (ikke *møtesr*).'
  },

  'ha-vs-vaere': {
    id: 'ha-vs-vaere',
    titleEn: '«ha» vs. «være» for states',
    titleNb: '«ha» og «være» for tilstander',
    explanationEn:
      'Norwegian uses «ha» (to have) for symptoms/possession-shaped states — «ha vondt i» (to have ' +
      'pain in), «ha lyst på» (to feel like), «ha det bra» (to be doing well) — and «være» (to be) ' +
      'for adjective-shaped states: «være syk», «være sulten», «være i dårlig humør». Many ' +
      'English "to be" phrases map to Norwegian «ha»: "I have a headache" = "Jeg har vondt i hodet," ' +
      'not "Jeg er vondt."',
    explanationNb:
      'To ulike tilstandstyper skiller «ha» og «være»:\n\n' +
      '• **ha** — symptomer/eie-lignende tilstander: «ha vondt i», «ha lyst på», «ha det bra»\n' +
      '• **være** — adjektiv-tilstander: «være syk», «være sulten», «være i dårlig humør»\n\n' +
      'Mange engelske "to be"-uttrykk tilsvarer norsk «ha»: "I have a headache" = "Jeg har vondt i hodet," ikke "Jeg er vondt."'
  },

  'plassering-verb': {
    id: 'plassering-verb',
    titleEn: 'Placement verbs: sette/legge vs. stå/ligge',
    titleNb: 'Plasseringsverb: sette/legge og stå/ligge',
    explanationEn:
      '"Sette" and "legge" describe the ACTION of placing something and take a direct object: ' +
      '"Han setter vasen på bordet." "Hun legger boka på bordet." "Stå" and "ligge" describe the ' +
      'resulting STATE afterwards and take no object: "Vasen står på bordet." "Boka ligger på ' +
      'bordet." Use sette/stå for upright objects, legge/ligge for flat ones.',
    explanationNb:
      'To par verb beskriver plassering:\n\n' +
      '• **sette/legge** — beskriver HANDLINGEN å plassere noe, og tar et objekt: "Han setter vasen på bordet." "Hun legger boka på bordet."\n' +
      '• **stå/ligge** — beskriver TILSTANDEN etterpå, og tar ikke objekt: "Vasen står på bordet." "Boka ligger på bordet."\n\n' +
      'Bruk sette/stå om stående objekter, legge/ligge om liggende objekter.'
  },

  'transitiv-intransitiv-verb': {
    id: 'transitiv-intransitiv-verb',
    titleEn: 'Transitive vs. intransitive verb pairs',
    titleNb: 'Transitive og intransitive verbpar',
    explanationEn:
      'Norwegian has several verb pairs that look similar but differ in whether they take a ' +
      'direct object. The transitive verb (takes an object) is usually weak/regular in ' +
      'preteritum/perfektum; the intransitive verb (no object) is usually strong/irregular: ' +
      'a sette (satte, har satt) vs. a sitte (satt, har sittet); a legge (la, har lagt) vs. a ligge ' +
      '(la, har ligget); a henge - hengte/har hengt (transitive) vs. hang/har hengt ' +
      '(intransitive, same infinitive); a brenne - brente/har brent (transitive) vs. brant/har ' +
      'brent (intransitive); a senke (transitive, a senke noe) vs. a synke (intransitive).',
    explanationNb:
      'Norsk har flere verbpar som likner hverandre, men som er forskjellige i om de kan ta et ' +
      'objekt.\n\n' +
      '• **transitivt verb** (kan ta objekt) — ofte svak/regelrett bøyning: *å sette — satte — har ' +
      'satt* (Jeg satte glasset på bordet.)\n' +
      '• **intransitivt verb** (kan IKKE ta objekt) — ofte sterk/uregelrett bøyning: *å sitte — ' +
      'satt — har sittet* (Glasset sto på bordet. / Han satt på stolen.)\n\n' +
      'Flere par: *å legge/å ligge, å senke/å synke*. Noen verb (*å henge, å brenne*) har samme ' +
      'infinitiv, men to ulike bøyningsmønstre — svak bøyning når verbet er transitivt, sterk ' +
      'bøyning når det er intransitivt: *Jeg hengte jakka på knaggen* (transitivt) vs. *Jakka hang ' +
      'på knaggen* (intransitivt).'
  },

  'passiv-bli-s': {
    id: 'passiv-bli-s',
    titleEn: 'Passive voice: bli-passiv and s-passiv',
    titleNb: 'Passiv: bli-passiv og s-passiv',
    explanationEn:
      'Norwegian has three passive forms. «Bli-passiv» = bli (in the right tense) + perfektum ' +
      'partisipp: "Bildene blir delt på nettet." "Hun ble dømt." «S-passiv» adds -s directly to the ' +
      'infinitive stem, common with modals and in instructions: "Regningen må betales." "Hvor kan ' +
      'den bestilles?" Use passive when the ACTION matters more than who performs it — the original ' +
      'object becomes the new subject: "Noen plager ham." → "Han blir plaget."\n\n' +
      '«Være-passiv» = være (in the right tense) + perfektum partisipp, and describes a RESULTING ' +
      'STATE rather than the action itself: "Bilen er vasket" (it\'s clean now — the state) vs. ' +
      '"Bilen blir vasket" (someone is washing it right now — the action in progress). For verbs ' +
      'describing actions that last over time, «være» and «bli» mean almost the same thing: "Hun ' +
      'er/blir elsket for den hun er." For shorter actions the two differ more clearly. A related ' +
      'trap: some verbs have a perfektum partisipp that looks similar to, but is spelled ' +
      'differently from, an unrelated adjective with a similar meaning — «å åpne» (to open) has ' +
      'the participle «åpnet», used in the passive: "Vinduet er/blir åpnet" (the window is/gets ' +
      'opened — an action, done by someone). But there is also a separate adjective «åpen» ' +
      '(neuter «åpent», plural/definite «åpne»): "Vinduet er åpent" (the window is open — a ' +
      'plain description of its state, with no implied actor or action).',
    explanationNb:
      'Norsk har tre passivformer:\n\n' +
      '• **bli-passiv** — bli (i riktig tid) + perfektum partisipp: "Bildene blir delt på nettet." "Hun ble dømt."\n' +
      '• **s-passiv** — legger -s direkte til infinitivstammen, vanlig sammen med modalverb og i instruksjoner: "Regningen må betales." "Hvor kan den bestilles?"\n' +
      '• **være-passiv** — være (i riktig tid) + perfektum partisipp, og beskriver en TILSTAND (resultatet) i stedet for selve handlingen: "Bilen er vasket" (den er ren nå — tilstanden) mot "Bilen blir vasket" (noen vasker den akkurat nå — handlingen pågår). Ved verb som uttrykker handlinger som strekker seg over tid, betyr «være» og «bli» omtrent det samme: "Hun er/blir elsket for den hun er." Ved kortere handlinger skiller de to seg tydeligere.\n\n' +
      'En beslektet felle: noen verb har en perfektum partisipp som ligner på, men staves ' +
      'annerledes enn, et ubeslektet adjektiv med lignende betydning — «å åpne» har partisippet ' +
      '«åpnet», brukt i passiv: "Vinduet er/blir åpnet" (vinduet er/blir åpnet av noen — en ' +
      'handling). Men det finnes også et eget adjektiv «åpen» (intetkjønn «åpent», flertall/bestemt ' +
      '«åpne»): "Vinduet er åpent" (vinduet er åpent — en ren tilstandsbeskrivelse, uten noen ' +
      'underforstått aktør eller handling).\n\n' +
      'Bruk passiv når HANDLINGEN betyr mer enn hvem som utfører den — det opprinnelige ' +
      'objektet blir det nye subjektet: "Noen plager ham." → "Han blir plaget."'
  },

  'omskriving-passiv': {
    id: 'omskriving-passiv',
    titleEn: 'Paraphrasing — passive voice',
    titleNb: 'Omskriving — passiv',
    explanationEn:
      'Rewriting an active sentence as a passive one (or vice versa) while preserving meaning: ' +
      '"Han skifter dekk på bilen" → "Bilens dekk blir skiftet av ham." Also covers turning a ' +
      'casual sentence into a more formal, nominalized paraphrase.',
    explanationNb:
      'Å skrive om en aktiv setning til en passiv (eller omvendt) og samtidig bevare betydningen: «Han skifter dekk på bilen» → «Bilens dekk blir skiftet av ham.»\n\n' +
      'Dekker også det å gjøre en uformell setning om til en mer formell, nominalisert omskriving.'
  },

  'preteritum-perfektum-og-futurum': {
    id: 'preteritum-perfektum-og-futurum',
    titleEn: 'Sequencing before/after a past reference point',
    titleNb: 'Preteritum perfektum og preteritum futurum',
    explanationEn:
      'When narrating in the past, «hadde» + perfektum partisipp (preteritum perfektum) marks what ' +
      'had already happened before the reference point, while «skulle/ville» + infinitiv (preteritum ' +
      'futurum) marks what was still to come from that same past vantage point: "Da de hadde funnet ' +
      'olje (before), ville politikerne beholde kontrollen (after)." The unrealized/hypothetical ' +
      'variant, preteritum futurum perfektum, adds «ha» + perfektum partisipp: "Jeg skulle ha gjort ' +
      'dette for lenge siden" (but didn\'t).',
    explanationNb:
      'Når vi forteller i fortid, skiller vi mellom to tidsforhold til referansepunktet:\n\n' +
      '• **preteritum perfektum** («hadde» + perfektum partisipp) — markerer det som allerede hadde skjedd før referansepunktet\n' +
      '• **preteritum futurum** («skulle/ville» + infinitiv) — markerer det som fremdeles lå foran i tid fra det samme fortidige ståstedet: "Da de hadde funnet olje (før), ville politikerne beholde kontrollen (etter)."\n' +
      '• **preteritum futurum perfektum** (uoppfylt/hypotetisk variant, legger til «ha» + perfektum partisipp) — "Jeg skulle ha gjort dette for lenge siden" (men gjorde det ikke)'
  },

  'perfektum-pluskvamperfektum': {
    id: 'perfektum-pluskvamperfektum',
    titleEn: 'Perfektum/pluskvamperfektum in context',
    titleNb: 'Perfektum/pluskvamperfektum i sammenheng',
    explanationEn:
      'Choosing correctly between preteritum, perfektum, and pluskvamperfektum in longer ' +
      'sentences, especially where a sentence adverbial (jo, faktisk, nettopp, ennå) or a fronted ' +
      'time expression forces a specific word order around the auxiliary verb.',
    explanationNb:
      'Å velge riktig mellom preteritum, perfektum og pluskvamperfektum i lengre setninger er en reell utfordring på dette nivået.\n\n' +
      'Særlig der et setningsadverbial (jo, faktisk, nettopp, ennå) eller et fronted tidsuttrykk tvinger fram en bestemt ordstilling rundt hjelpeverbet.'
  },

  'futurum-referert': {
    id: 'futurum-referert',
    titleEn: '2. futurum — reported/alleged action',
    titleNb: '2. futurum — referert/påstått handling',
    explanationEn:
      '"2. futurum" (skal + ha + perfektum partisipp) expresses a reported or alleged past action ' +
      "the speaker hasn't personally verified — an evidential construction typical of news " +
      'reporting: "Tyvene skal ha brutt mange av reglene" (The thieves are reported to have ' +
      'broken many rules).',
    explanationNb:
      '«2. futurum» (skal + ha + perfektum partisipp) uttrykker en referert eller påstått tidligere handling som taleren ikke selv har bekreftet — en evidensiell konstruksjon typisk for nyhetsspråk.\n\n' +
      '«Tyvene skal ha brutt mange av reglene» (tyvene er ifølge kilder rapportert å ha brutt reglene).'
  },

  'hoflig-preteritum': {
    id: 'hoflig-preteritum',
    titleEn: 'Preteritum for politeness and softened suggestions',
    titleNb: 'Preteritum for høflighet og avdempede forslag',
    explanationEn:
      'The preteritum of a modal or main verb can soften a request, wish, or suggestion in present ' +
      'time, without any past-time meaning: "Kunne du hjelpe meg?" (softer than "Kan du..."), "Det ' +
      'hadde vært fint om du kunne komme," "Jeg lurte på om det var mulig å...", "Du burde/skulle ' +
      'prøve en gang til." This is a pragmatic use of the past tense, distinct from `modalverb-' +
      "preteritum`'s genuine past-time meaning.",
    explanationNb:
      'Preteritum av et modalverb eller hovedverb kan avdempe en forespørsel, et ønske eller et ' +
      'forslag i nåtid, uten noen fortidsbetydning:\n\n' +
      '• "Kunne du hjelpe meg?" (mildere enn "Kan du...")\n' +
      '• "Det hadde vært fint om du kunne komme."\n' +
      '• "Jeg lurte på om det var mulig å..."\n' +
      '• "Du burde/skulle prøve en gang til."\n\n' +
      'Dette er en pragmatisk bruk av fortidsformen, ulikt `modalverb-preteritum`s ekte fortidsbetydning.'
  },

  'kondisjonalis-counterfactual': {
    id: 'kondisjonalis-counterfactual',
    titleEn: '1./2. kondisjonalis',
    titleNb: '1./2. kondisjonalis',
    explanationEn:
      '1. kondisjonalis (skulle + infinitiv) expresses an unfulfilled plan in the past ("Jeg ' +
      'skulle handle på Rema, men gjorde det ikke"). 2. kondisjonalis (ville/kunne + ha + ' +
      'perfektum partisipp), usually paired with a pluskvamperfektum om-clause, expresses a ' +
      'counterfactual: "Om jeg hadde vært rikere, ville jeg ha gjort mange ting annerledes."',
    explanationNb:
      'To former for uoppfylte planer og kontrafaktiske situasjoner:\n\n' +
      '• **1. kondisjonalis** (skulle + infinitiv) — uttrykker en uoppfylt plan i fortid: «Jeg skulle handle på Rema, men gjorde det ikke.»\n' +
      '• **2. kondisjonalis** (ville/kunne + ha + perfektum partisipp) — oftest kombinert med en pluskvamperfektum om-setning, uttrykker en kontrafaktisk situasjon: «Om jeg hadde vært rikere, ville jeg ha gjort mange ting annerledes.»'
  }
};
