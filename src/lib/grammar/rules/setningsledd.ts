// src/lib/grammar/rules/setningsledd.ts
// Rules for chapter 1 · Setningsledd (Part 1). Order follows taxonomy.ts.
// Formatting of `explanationNb`: see the header comment in ./index.ts.
import type { GrammarRule } from '$lib/types';

export const SETNINGSLEDD_RULES: Record<string, GrammarRule> = {
  'sammensatt-verbtid': {
    id: 'sammensatt-verbtid',
    titleEn: 'Naming tense in compound verb forms',
    titleNb: 'Sammensatt verbtid',
    explanationEn:
      'A compound (sammensatt) verb form has two parts: **verb 1** is the finite (bøyd) auxiliary ' +
      'verb — it carries the tense marking and is always in 2nd position in a statement — and ' +
      '**verb 2** is the non-finite main verb, either an infinitive or a perfektum partisipp, and ' +
      "never changes form regardless of subject. The combination of verb 1's tense and verb 2's " +
      "form together name the whole verb phrase's **tempus** (tense):\n\n" +
      '• **presens perfektum**: har/har (presens) + perfektum partisipp — "har spist", "har reist"\n' +
      '• **preteritum perfektum**: hadde (preteritum) + perfektum partisipp — "hadde spist"\n' +
      '• **futurum**: skal/vil (presens) + infinitiv — "skal spise", "vil reise"\n' +
      '• **futurum i fortid**: skulle/ville (preteritum) + infinitiv — "skulle spise"\n\n' +
      'A quick test: verb 1 is the word that would change if you switched the whole sentence from ' +
      'presens to preteritum (har→hadde, skal→skulle); verb 2 stays exactly the same either way.',
    explanationNb:
      'En sammensatt verbform har to deler: **verb 1** er det bøyde (finitte) hjelpeverbet — det ' +
      'bærer tidsbøyningen og står alltid på plass 2 i en påstand — og **verb 2** er hovedverbet i ' +
      'ubøyd form, enten infinitiv eller perfektum partisipp, og forandrer seg aldri uansett ' +
      'subjekt. Sammen navngir verb 1s tid og verb 2s form hele verbfrasens **tempus**:\n\n' +
      '• **presens perfektum**: har (presens) + perfektum partisipp — «har spist», «har reist»\n' +
      '• **preteritum perfektum**: hadde (preteritum) + perfektum partisipp — «hadde spist»\n' +
      '• **futurum**: skal/vil (presens) + infinitiv — «skal spise», «vil reise»\n' +
      '• **futurum i fortid**: skulle/ville (preteritum) + infinitiv — «skulle spise»\n\n' +
      'En rask test: verb 1 er ordet som ville forandret seg om hele setningen ble flyttet fra ' +
      'presens til preteritum (har→hadde, skal→skulle); verb 2 er helt likt uansett.'
  },

  'setningsledd-identifikasjon': {
    id: 'setningsledd-identifikasjon',
    titleEn: 'Identifying sentence elements',
    titleNb: 'Setningsledd-identifikasjon',
    explanationEn:
      'A Norwegian sentence is built from **setningsledd** (sentence elements), each doing a ' +
      'distinct job:\n\n' +
      '• **subjekt** — who/what performs the action or is being described: "**Hun** løp."\n' +
      '• **verbal** — the verb(s): "Hun **løp**."\n' +
      '• **direkte objekt** — what/who receives the action directly: "Hun kjøpte **en bok**."\n' +
      '• **indirekte objekt** — who benefits/receives, alongside a direct object: "Hun ga **broren ' +
      'sin** en bok." (broren sin = indirekte objekt, en bok = direkte objekt)\n' +
      '• **predikativ** — describes or renames the subject (subjektspredikativ, after «være/bli/' +
      'virke»-type verbs: "Hun er **lege**.") or the object (objektspredikativ, after verbs like ' +
      '«kalle/gjøre/finne»: "De kalte ham **feig**."). Test: a predikativ could replace «være + X» ' +
      'about the subject/object; an objekt is a separate entity being acted on, not a description ' +
      'of it.\n' +
      '• **adverbial** — extra information (time/place/manner/cause): "Hun løp **fort** **i går**."\n' +
      '• **setningsadverbial** — a special adverbial commenting on the whole sentence (ikke/alltid/' +
      'nok/jo), placed right after the finite verb in a helsetning but before it in a leddsetning.' +
      '\n\n' +
      '**Building noun phrases (NP):** a single ledd (e.g. the subjekt) can itself be a phrase with ' +
      'a determinativ + adjektiv + substantiv, all agreeing in gender/number/definiteness: "**de ' +
      'to gamle kattene**" (plural, bestemt form, adjektiv in weak/plural form).\n\n' +
      '**Clause-function analysis:** a whole leddsetning (subordinate clause) can itself fill a ' +
      'setningsledd slot in the matrix clause — as subjekt ("**At hun kom for sent** irriterte ' +
      'ham."), objekt ("Han sa **at han var syk**."), or adverbial ("Han ringte **før han dro**.").' +
      '\n\n' +
      '**Field schema (setningsskjema):** a helsetning divides into forfelt (before the finite ' +
      'verb — usually subjekt or a fronted adverbial), verbal, midtfelt (subjekt if not fronted, ' +
      'setningsadverbial, objekt), and sluttfelt (longer adverbials, especially sted/tid/årsak in ' +
      'that order).',
    explanationNb:
      'En norsk setning er bygd opp av **setningsledd**, som hver har en bestemt jobb:\n\n' +
      '• **subjekt** — hvem/hva som utfører handlingen eller blir beskrevet: «**Hun** løp.»\n' +
      '• **verbal** — verbet/verbene: «Hun **løp**.»\n' +
      '• **direkte objekt** — hva/hvem som mottar handlingen direkte: «Hun kjøpte **en bok**.»\n' +
      '• **indirekte objekt** — hvem som mottar/får noe, ved siden av et direkte objekt: «Hun ga ' +
      '**broren sin** en bok.» (broren sin = indirekte objekt, en bok = direkte objekt)\n' +
      '• **predikativ** — beskriver eller omtaler subjektet (subjektspredikativ, etter «være/bli/' +
      'virke»-type verb: «Hun er **lege**.») eller objektet (objektspredikativ, etter verb som ' +
      '«kalle/gjøre/finne»: «De kalte ham **feig**.»). Test: en predikativ kan erstattes med «være ' +
      '+ X» om subjektet/objektet; et objekt er en egen størrelse som blir påvirket, ikke en ' +
      'beskrivelse av noe annet.\n' +
      '• **adverbial** — tilleggsinformasjon (tid/sted/måte/årsak): «Hun løp **fort** **i går**.»\n' +
      '• **setningsadverbial** — en særlig type adverbial som kommenterer hele setningen (ikke/' +
      'alltid/nok/jo), og står rett etter det finitte verbet i en helsetning, men før det i en ' +
      'leddsetning.\n\n' +
      '**Å bygge substantivfraser (NP):** ett enkelt ledd (f.eks. subjektet) kan selv være en frase ' +
      'med determinativ + adjektiv + substantiv, som alle samsvarer i kjønn/tall/bestemthet: «**de ' +
      'to gamle kattene**» (flertall, bestemt form, adjektivet i svak/flertallsform).\n\n' +
      '**Setningsleddanalyse av leddsetninger:** en hel leddsetning kan selv fylle en setningsledd-' +
      'plass i overordnet setning — som subjekt («**At hun kom for sent** irriterte ham.»), objekt ' +
      '(«Han sa **at han var syk**.»), eller adverbial («Han ringte **før han dro**.»).\n\n' +
      '**Setningsskjema:** en helsetning deles inn i forfelt (før det finitte verbet — vanligvis ' +
      'subjekt eller et fronted adverbial), verbal, midtfelt (subjekt hvis ikke fronted, ' +
      'setningsadverbial, objekt), og sluttfelt (lengre adverbialer, særlig sted/tid/årsak i den ' +
      'rekkefølgen).'
  },

  'subjekt-og-verbal': {
    id: 'subjekt-og-verbal',
    titleEn: 'Subject and verbal',
    titleNb: 'Subjekt og verbal',
    explanationEn:
      '**Subjekt (subject):** the person or thing that does something, or that the sentence is ' +
      'about. Find the subject by asking «hvem» or «hva» + the verb: «**Maria** bor i Oslo.» ' +
      '(Hvem bor i Oslo? Maria.) «**Bilen** står der.» (Hva står der? Bilen.)\n\n' +
      '**Verbal:** the verb or verbs in the sentence. The verbal says what the subject does, or ' +
      'what happens to the subject: «Maria **bor** i Oslo.» The verbal can consist of several ' +
      'words: «Maria **kan spise** fisk.»\n\n' +
      '**Position in a normal statement:** the subject comes first, and the verbal comes right ' +
      'after it: subject – verbal. «Jeg **spiser** frokost.» The first verb of the verbal is in ' +
      'position 2: «Jeg **kan** spise fisk.»\n\n' +
      '**The subject after the verbal:** in a question the verbal comes first and the subject ' +
      'comes after: «Spiser **du** frokost?» The same happens when something else comes first ' +
      'in the sentence: «I dag spiser **jeg** ute.»\n\n' +
      '**A subject is not an object:** the subject does the action: «**Læreren** hjelper Per.» ' +
      'The object is the person or thing the action is directed at: «Læreren hjelper **Per**.»',
    explanationNb:
      '**Subjekt:** Den eller det som gjør noe, eller som setningen handler om. Finn subjektet ved ' +
      'å spørre «hvem» eller «hva» + verbet: «**Maria** bor i Oslo.» (Hvem bor i Oslo? ' +
      'Maria.) «**Bilen** står der.» (Hva står der? Bilen.)\n\n' +
      '**Verbal:** Verbet eller verbene i setningen. Verbalet sier hva subjektet gjør, eller hva ' +
      'som skjer med subjektet: «Maria **bor** i Oslo.» Verbalet kan bestå av flere ord: ' +
      '«Maria **kan spise** fisk.»\n\n' +
      '**Plass i en vanlig påstand:** Subjektet står først, og verbalet kommer rett etter: ' +
      'subjekt – verbal. «Jeg **spiser** frokost.» Det første verbet i verbalet står på plass 2: ' +
      '«Jeg **kan** spise fisk.»\n\n' +
      '**Subjektet etter verbalet:** I et spørsmål kommer verbalet først, og subjektet kommer ' +
      'etter: «Spiser **du** frokost?» Det samme skjer når noe annet står først i setningen: ' +
      '«I dag spiser **jeg** ute.»\n\n' +
      '**Subjekt er ikke objekt:** Subjektet gjør handlingen: «**Læreren** hjelper Per.» ' +
      'Objektet er den eller det handlingen er rettet mot: «Læreren hjelper **Per**.»'
  },

  objekt: {
    id: 'objekt',
    titleEn: 'The object',
    titleNb: 'Objekt',
    explanationEn:
      '**Object (objekt):** the person or thing affected by the action of the verb. Find the object by ' +
      'asking «hva» or «hvem» + verb + subject: «Jeg spiser **et eple**.» (Hva spiser jeg? Et eple.)\n\n' +
      '**Position:** in a normal statement the object comes after the verb: subject – verb – object. ' +
      '«Vi ser **en film**.» When an adverbial comes first, the verb and the subject come before the ' +
      'object: «I går kjøpte jeg **en bil**.»\n\n' +
      '**An object is not an adverbial:** an adverbial tells, for example, where, when or how ' +
      'something happens: «Jeg spiser frokost **på kjøkkenet**.» Here «frokost» is the object, ' +
      'while «på kjøkkenet» is an adverbial.\n\n' +
      '**An object is not a predikativ:** after «være» and «bli» there is often a predikativ that ' +
      'describes the subject: «Hun er **lærer**.» An object refers to a person or thing that the ' +
      'action is directed at: «Hun møter **læreren**.»\n\n' +
      '**Object first:** the object can come first to emphasise it. The verb still stays in ' +
      'position 2, and the subject comes after the verb: «Filmen så vi i går.»\n\n' +
      'Not all verbs have an object: «Hun sover.» «Jeg løper.»',
    explanationNb:
      '**Objekt:** Det eller den som blir påvirket av verbhandlingen. Finn objektet ved å spørre ' +
      '«hva» eller «hvem» + verb + subjekt: «Jeg spiser **et eple**.» (Hva spiser jeg? Et eple.)\n\n' +
      '**Plass:** I en vanlig påstand står objektet etter verbet: subjekt – verb – objekt. ' +
      '«Vi ser **en film**.» Står et adverbial først, kommer verbet og subjektet foran objektet: ' +
      '«I går kjøpte jeg **en bil**.»\n\n' +
      '**Objekt er ikke adverbial:** Et adverbial sier for eksempel hvor, når eller hvordan noe ' +
      'skjer: «Jeg spiser frokost **på kjøkkenet**.» Her er «frokost» objektet, mens «på ' +
      'kjøkkenet» er et adverbial.\n\n' +
      '**Objekt er ikke predikativ:** Etter «være» og «bli» står det ofte et predikativ som ' +
      'beskriver subjektet: «Hun er **lærer**.» Et objekt viser til en person eller ting som ' +
      'handlingen er rettet mot: «Hun møter **læreren**.»\n\n' +
      '**Objektet først:** Objektet kan stå først for å fremheve det. Verbet står da fortsatt på ' +
      'plass 2, og subjektet kommer etter verbet: «Filmen så vi i går.»\n\n' +
      'Ikke alle verb har objekt: «Hun sover.» «Jeg løper.»'
  },

  predikativ: {
    id: 'predikativ',
    titleEn: 'The predicative',
    titleNb: 'Predikativ',
    explanationEn:
      '**Predikativ (predicative):** an element that describes or says something about the subject. ' +
      'The predikativ often comes after «være», «bli», «hete» and «virke», and after «se … ut»: ' +
      '«Hun er **lærer**.» «Huset er **stort**.» «Han heter **Ola**.»\n\n' +
      '**What can be a predikativ?** A noun («Hun er **lærer**.») or an adjective ' +
      '(«Suppen er **varm**.»).\n\n' +
      '**Position:** in a normal statement the predikativ comes after the verb: subject – verb – ' +
      'predikativ. «Maria er **glad**.» With «ikke», the predikativ comes after «ikke»: ' +
      '«Maria er ikke **glad**.»\n\n' +
      '**A predikativ is not an object:** with a noun, the predikativ refers to the same thing as the ' +
      'subject: «Hun er lærer.» (hun = lærer). An object refers to a person or thing that the ' +
      'action is directed at: «Hun møter læreren.»\n\n' +
      '**A predikativ is not an adverbial:** a predikativ describes the subject: «Hun er **glad**.» ' +
      'An adverbial tells, for example, where or when something happens: «Hun er **på jobb**.»',
    explanationNb:
      '**Predikativ:** Et ledd som beskriver eller sier noe om subjektet. Predikativet står ofte ' +
      'etter «være», «bli», «hete» og «virke», og etter «se … ut»: «Hun er **lærer**.» ' +
      '«Huset er **stort**.» «Han heter **Ola**.»\n\n' +
      '**Hva kan være predikativ?** Et substantiv («Hun er **lærer**.») eller et adjektiv ' +
      '(«Suppen er **varm**.»).\n\n' +
      '**Plass:** I en vanlig påstand står predikativet etter verbet: subjekt – verb – predikativ. ' +
      '«Maria er **glad**.» Med «ikke» står predikativet etter «ikke»: «Maria er ikke **glad**.»\n\n' +
      '**Predikativ er ikke objekt:** Med et substantiv viser predikativet til det samme som ' +
      'subjektet: «Hun er lærer.» (hun = lærer). Et objekt viser til en person eller ting som ' +
      'handlingen er rettet mot: «Hun møter læreren.»\n\n' +
      '**Predikativ er ikke adverbial:** Et predikativ beskriver subjektet: «Hun er **glad**.» Et ' +
      'adverbial sier for eksempel hvor eller når noe skjer: «Hun er **på jobb**.»'
  },

  adverbial: {
    id: 'adverbial',
    titleEn: 'The adverbial',
    titleNb: 'Adverbial',
    explanationEn:
      '**Adverbial:** an element that tells where, when, how or why something happens. An adverbial ' +
      'can be an adverb («her», «i dag», «fort») or a group with a preposition («i Oslo», ' +
      '«om morgenen», «med bussen»).\n\n' +
      '**Questions:** the adverbial answers questions such as «hvor», «når» and «hvordan»: ' +
      '«Jeg bor **i Oslo**.» (Hvor bor jeg? I Oslo.) «Vi spiser middag **klokka seks**.» ' +
      '(Når spiser vi middag?)\n\n' +
      '**Position:** in a normal statement the adverbial often comes last: «Vi spiser frokost ' +
      '**på kjøkkenet**.» A sentence can have several adverbials: «Jeg trener **i parken** ' +
      '**hver dag**.» The adverbial can also come first. The verb still stays in position 2: ' +
      '«**I morgen** reiser jeg.»\n\n' +
      '**An adverbial is not an object:** the object is the person or thing the action is directed ' +
      'at. The adverbial tells where, when or how something happens: «Hun leser en bok **på ' +
      'biblioteket**.» («En bok» is the object, «på biblioteket» is the adverbial.)\n\n' +
      '**An adverbial is not a predikativ:** a predikativ describes the subject: «Hun er **glad**.» ' +
      'An adverbial tells, for example, where, when or how something happens: «Hun er **hjemme**.»',
    explanationNb:
      '**Adverbial:** Et ledd som forteller hvor, når, hvordan eller hvorfor noe skjer. Et adverbial ' +
      'kan være et adverb («her», «i dag», «fort») eller en gruppe med preposisjon («i Oslo», ' +
      '«om morgenen», «med bussen»).\n\n' +
      '**Spørsmål:** Adverbialet svarer på spørsmål som «hvor», «når» og «hvordan»: ' +
      '«Jeg bor **i Oslo**.» (Hvor bor jeg? I Oslo.) «Vi spiser middag **klokka seks**.» ' +
      '(Når spiser vi middag?)\n\n' +
      '**Plass:** I en vanlig påstand står adverbialet ofte sist: «Vi spiser frokost **på ' +
      'kjøkkenet**.» En setning kan ha flere adverbialer: «Jeg trener **i parken** **hver dag**.» ' +
      'Adverbialet kan også stå først. Verbet står da fortsatt på plass 2: «**I morgen** reiser ' +
      'jeg.»\n\n' +
      '**Adverbial er ikke objekt:** Objektet er det eller den handlingen er rettet mot. ' +
      'Adverbialet sier hvor, når eller hvordan noe skjer: «Hun leser en bok **på biblioteket**.» ' +
      '(«En bok» er objektet, «på biblioteket» er adverbialet.)\n\n' +
      '**Adverbial er ikke predikativ:** Et predikativ beskriver subjektet: «Hun er **glad**.» Et ' +
      'adverbial sier for eksempel hvor, når eller hvordan noe skjer: «Hun er **hjemme**.»'
  },

  'indirekte-objekt': {
    id: 'indirekte-objekt',
    titleEn: 'The indirect object',
    titleNb: 'Indirekte objekt',
    explanationEn:
      '**Indirect object (indirekte objekt):** the person who receives, gets or benefits from the ' +
      'action. It comes together with a direct object: «Lars ga **Eva** en blomst.» («Eva» is the ' +
      'indirect object, «en blomst» is the direct object.)\n\n' +
      '**Position:** the indirect object comes before the direct object.\n\n' +
      '**Questions:** ask «hva» for the direct object (Hva ga Lars? En blomst.) and «hvem» for the ' +
      'indirect object (Hvem fikk blomsten? Eva.)\n\n' +
      '**With «til»:** we can move the recipient after the direct object and use «til»: «Lars ga en ' +
      'blomst til Eva.» Then the sentence no longer has an indirect object, but a phrase with «til».\n\n' +
      '**Pronouns:** the indirect object has the object form: «Han viste **meg** bildet.»\n\n' +
      '**Common verbs:** gi, sende, vise, kjøpe, fortelle, lære.\n\n' +
      '**Not all verbs:** many verbs have only one object: «Jeg ser en film.»',
    explanationNb:
      '**Indirekte objekt:** Den som får, mottar eller har nytte av handlingen. Det står sammen med ' +
      'et direkte objekt: «Lars ga **Eva** en blomst.» («Eva» er indirekte objekt, «en blomst» er ' +
      'direkte objekt.)\n\n' +
      '**Plass:** Det indirekte objektet står foran det direkte objektet.\n\n' +
      '**Spørsmål:** Spør «hva» for det direkte objektet (Hva ga Lars? En blomst.) og «hvem» for ' +
      'det indirekte (Hvem fikk blomsten? Eva.)\n\n' +
      '**Med «til»:** Vi kan flytte mottakeren etter det direkte objektet og bruke «til»: «Lars ga ' +
      'en blomst til Eva.» Da har setningen ikke lenger et indirekte objekt, men en frase med «til».\n\n' +
      '**Pronomen:** Det indirekte objektet har objektsform: «Han viste **meg** bildet.»\n\n' +
      '**Vanlige verb:** gi, sende, vise, kjøpe, fortelle, lære.\n\n' +
      '**Ikke alle verb:** Mange verb har bare ett objekt: «Jeg ser en film.»'
  },

  'predikativ-agreement': {
    id: 'predikativ-agreement',
    titleEn: 'Predikativ adjective agreement',
    titleNb: 'Samsvarsbøyning av predikativ',
    explanationEn:
      'A predikativ adjective (after være, bli, hete, se … ut) never takes the definite -e ' +
      'ending. With an ubestemt subject, the predikativ goes in intetkjønn, not plural: ' +
      '"Grønnsaker er sunt," not sunne — but a definite subject restores normal agreement: ' +
      '"Grønnsakene er sunne." Exceptions stay unbent: strong-verb -et participles (skrevet), ' +
      'weak-verb/passive participles (registrert), compound-verb participles (flislagt), and ' +
      'adjectives in fixed prepositional phrases (glad i, klar over, vant til).',
    explanationNb:
      'Et predikativt adjektiv (etter være, bli, hete, se … ut) bøyes aldri i bestemt form. Med ubestemt subjekt bøyes predikativet i intetkjønn, ikke flertall: «Grønnsaker er sunt», ikke sunne — men bestemt subjekt gir vanlig samsvar igjen: «Grønnsakene er sunne».\n\n' +
      '**Unntak** (bøyes ikke):\n' +
      '• -et-partisipp av sterke verb: skrevet\n' +
      '• partisipp av svake verb/passiv: registrert\n' +
      '• sammensatte verbs partisipp: flislagt\n' +
      '• adjektiv i faste preposisjonsuttrykk: glad i, klar over, vant til'
  }
};
