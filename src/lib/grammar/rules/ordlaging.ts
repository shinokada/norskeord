// src/lib/grammar/rules/ordlaging.ts
// Rules for chapter 18 · Ordlaging (Part 4). Order follows taxonomy.ts.
// Formatting of `explanationNb`: see the header comment in ./index.ts.
import type { GrammarRule } from '$lib/types';

export const ORDLAGING_RULES: Record<string, GrammarRule> = {
  'ordfamilie-avledning': {
    id: 'ordfamilie-avledning',
    titleEn: 'Word-family derivation',
    titleNb: 'Avledning i ordfamilien',
    explanationEn:
      'Deriving the correct noun, verb, adjective, or adverb from a given word in the same word ' +
      'family, matching the required tense/form: from "trygg" (safe) → trygghet (noun); from ' +
      '"operere" (to operate) → operasjon (noun) — the same word-family skill applies at a ' +
      'harder level with "berømme" (to praise) → berømmelse (noun), berømt (adjective); from ' +
      '"slite" → slitasje (noun), sliten / slitsom (adjective). A word family often has a separate ' +
      'noun for the PERSON doing something, the PROCESS/activity itself, and the RESULT/product of ' +
      'it: "en produsent" (person) / "en produksjon" (process) / "et produkt" (result); "en baker" ' +
      '/ "en/ei baking" / "en bakst." Not every verb has all three as distinct words — some family ' +
      'members double up, e.g. "en/ei bygging" (process) vs. "en/ei bygning" (the physical ' +
      "building) — so picking the right one depends on the sentence's meaning, not a fixed pattern. " +
      'A related pattern derives a noun from a compound verb (particle verb): «-ing» (dele ut → ' +
      'utdeling), «-else» (oppleve → opplevelse), «-takelse/-tagelse» from «ta»-verbs (delta → ' +
      'deltakelse), «-sigelse» from «si»-verbs (si opp → oppsigelse), «-givelse» from «gi»-verbs (gi ' +
      'ut → utgivelse), and zero-derivation pairs (gå ut → en utgang, påstå → en påstand).',
    explanationNb:
      'Å avlede riktig substantiv, verb, adjektiv eller adverb fra et gitt ord i samme ordfamilie, ' +
      'tilpasset ønsket tid/form: fra «trygg» → trygghet (substantiv); fra «operere» → operasjon ' +
      '(substantiv) — samme ferdighet brukes på et vanskeligere nivå med «berømme» → berømmelse ' +
      '(substantiv), berømt (adjektiv); fra «slite» → slitasje (substantiv), sliten / slitsom ' +
      '(adjektiv).\n\n' +
      'En ordfamilie har ofte et eget substantiv for **personen** som gjør noe, **prosessen**/' +
      'aktiviteten selv, og **resultatet**/produktet av den:\n' +
      '• en produsent (person) / en produksjon (prosess) / et produkt (resultat)\n' +
      '• en baker / en/ei baking / en bakst\n\n' +
      'Ikke alle verb har alle tre som egne ord — noen familiemedlemmer faller sammen, f.eks. ' +
      '«en/ei bygging» (prosess) mot «en/ei bygning» (selve bygget) — så riktig valg avhenger av ' +
      'setningens betydning, ikke et fast mønster.\n\n' +
      'Et beslektet mønster avleder et substantiv fra et sammensatt verb (partikkelverb):\n' +
      '• **-ing**: dele ut → utdeling\n' +
      '• **-else**: oppleve → opplevelse\n' +
      '• **-takelse/-tagelse** fra «ta»-verb: delta → deltakelse\n' +
      '• **-sigelse** fra «si»-verb: si opp → oppsigelse\n' +
      '• **-givelse** fra «gi»-verb: gi ut → utgivelse\n' +
      '• **null-avledningspar**: gå ut → en utgang, påstå → en påstand'
  },

  'verbprefiks-be-an-mis': {
    id: 'verbprefiks-be-an-mis',
    titleEn: 'Verb-forming prefixes be-/an-/mis-',
    titleNb: 'Verbdannende forstavelser be-/an-/mis-',
    explanationEn:
      'Adding be-, an-, or mis- to a base verb changes its meaning and often its valency (whether ' +
      'it takes an object or a preposition). be- often makes an intransitive/prepositional verb ' +
      'transitive: a arbeide (med noe) -> a bearbeide noe; a klage (over noe) -> a beklage noe. an- ' +
      'often adds a directional/formal sense: a gi -> a angi; a tenne -> a antenne. mis- adds a ' +
      'sense of "wrongly/badly": a forsta -> a misforsta; a lykkes -> a mislykkes. The prefixed verb ' +
      'must be learned as its own word - its meaning is not always fully predictable from the ' +
      'base verb plus the prefix.',
    explanationNb:
      'Å legge til be-, an- eller mis- foran et grunnverb endrer betydningen, og ofte også om ' +
      'verbet tar objekt eller preposisjon.\n\n' +
      '• **be-** — gjør ofte et verb med preposisjon om til et verb med direkte objekt: *å klage ' +
      'over noe* → *å beklage noe*, *å låne (til noen)* → *å belåne noe*\n' +
      '• **an-** — gir ofte en retnings- eller formell betydning: *å gi* → *å angi*, *å tenne* → ' +
      '*å antenne*\n' +
      '• **mis-** — legger til betydningen «feil/dårlig»: *å forstå* → *å misforstå*, *å lykkes* → ' +
      '*å mislykkes*, *å tro* → *å mistro*\n\n' +
      'Betydningen av det avledede verbet må ofte læres som et eget ord — den er ikke alltid helt ' +
      'forutsigbar ut fra grunnverbet og forstavelsen alene.'
  },

  'motsetning-prefiks': {
    id: 'motsetning-prefiks',
    titleEn: 'Forming opposites with a negative prefix',
    titleNb: 'Å lage motsetninger med prefiks',
    explanationEn:
      'Several negative prefixes turn a word into its opposite instead of a different word ' +
      'entirely: «u-» (gift → ugift, lykke → ulykke, fornøyd → ufornøyd), «mis-» (fornøyd → ' +
      'misfornøyd, lykkes → mislykkes, forstå → misforstå, trives → mistrives), «van-» (vane → ' +
      'uvane, but also fixed forms like vanskjøtte). Which prefix fits depends on the specific ' +
      'word — this is lexical, not a single universal rule, so it must be checked word by word.',
    explanationNb:
      'Flere negative prefiks gjør et ord om til sin motsetning i stedet for et helt annet ord:\n\n' +
      '• **u-** = gift → ugift, lykke → ulykke, fornøyd → ufornøyd\n' +
      '• **mis-** = fornøyd → misfornøyd, lykkes → mislykkes, forstå → misforstå, trives → mistrives\n' +
      '• **van-** = blant annet i faste former som vanskjøtte\n\n' +
      'Hvilket prefiks som passer, avhenger av det enkelte ordet — dette er leksikalsk, ikke én universell regel, så det må sjekkes ord for ord.'
  },

  'partikkelverb-los-fast': {
    id: 'partikkelverb-los-fast',
    titleEn: 'Particle verbs — loose vs. fixed compound',
    titleNb: 'Partikkelverb — løst eller fast sammensatt',
    explanationEn:
      'A particle verb written as two words (løst sammensatt: "sette over") usually has a literal, ' +
      'compositional meaning, while the same words written as one fixed compound (fast sammensatt: ' +
      '"oversette") often has a different, idiomatic meaning: "sette over kaffe" (brew coffee) vs. ' +
      '"oversette en bok" (translate a book). The stress pattern differs too — spoken emphasis on ' +
      'the particle for the loose form. Some particle verbs also form a fixed compound perfektum ' +
      'partisipp used adjectivally: "påkjørt" (run over), "nedsatt" (reduced), "utgått" (expired).',
    explanationNb:
      'Et partikkelverb skrevet som to ord (løst sammensatt: «sette over») har vanligvis en bokstavelig betydning, mens de samme ordene skrevet som ett fast sammensatt ord ofte har en annen, idiomatisk betydning: «sette over kaffe» mot «oversette en bok». Trykket er også ulikt — muntlig trykk på partikkelen i den løse formen.\n\n' +
      'Noen partikkelverb danner også et fast sammensatt perfektum partisipp brukt som adjektiv: «påkjørt», «nedsatt», «utgått».'
  }
};
