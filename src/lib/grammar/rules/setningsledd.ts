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
