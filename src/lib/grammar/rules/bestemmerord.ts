// src/lib/grammar/rules/bestemmerord.ts
// Rules for chapter 10 · Bestemmerord (Part 2). Order follows taxonomy.ts.
// Formatting of `explanationNb`: see the header comment in ./index.ts.
import type { GrammarRule } from '$lib/types';

export const BESTEMMERORD_RULES: Record<string, GrammarRule> = {
  'denne-dette-disse': {
    id: 'denne-dette-disse',
    titleEn: '«denne», «dette», «disse» (this/these)',
    titleNb: '«denne», «dette», «disse»',
    explanationEn:
      'Demonstratives agree with the noun they point to: denne (en/ei-nouns, sg.), dette ' +
      '(et-nouns, sg.), disse (all genders, pl.). "Denne genseren er fin." "Dette skjerfet er på ' +
      'tilbud." "Disse skoene passer."',
    explanationNb:
      'Påpekende pronomen samsvarer med substantivet de peker på:\n\n' +
      '• **denne** (en/ei-ord, entall) — "Denne genseren er fin."\n' +
      '• **dette** (et-ord, entall) — "Dette skjerfet er på tilbud."\n' +
      '• **disse** (alle kjønn, flertall) — "Disse skoene passer."'
  },

  'possessiver-min-din': {
    id: 'possessiver-min-din',
    titleEn: 'Possessives (min, din, hans, hennes, vår, deres)',
    titleNb: 'Possessiver (eiendomsord)',
    explanationEn:
      "Possessives agree with the possessed noun's gender/number (min/mi/mitt/mine, " +
      'din/di/ditt/dine, vår/vårt/våre) and, in everyday spoken Norwegian, normally FOLLOW the ' +
      'noun: "leiligheten min," not "min leilighet." hans, hennes, and deres never inflect.',
    explanationNb:
      'Possessiver samsvarer med det eide substantivets kjønn/tall:\n\n' +
      '• min/mi/mitt/mine\n' +
      '• din/di/ditt/dine\n' +
      '• vår/vårt/våre\n\n' +
      'I vanlig talespråk står possessivet normalt ETTER substantivet: "leiligheten min," ikke "min leilighet." hans, hennes og deres bøyes aldri.'
  },

  'refleksivt-possessiv-sin': {
    id: 'refleksivt-possessiv-sin',
    titleEn: '«sin/sitt/sine» vs. «hans/hennes»',
    titleNb: '«sin/sitt/sine» og «hans/hennes»',
    explanationEn:
      'Use sin/sitt/sine when the possessor IS the sentence\'s subject: "Bianca vasker ' +
      'leiligheten sin" (her own apartment). Use hans/hennes when the possessor is someone ELSE: ' +
      '"Bianca sitter i bilen hennes" (someone else\'s car). Exception: when the subject is a ' +
      'COMPOUND ("Han og kundene"), sin/sitt/sine can no longer refer back to just one part of ' +
      'it, so hans/hennes/deres is used instead: "Han og kundene hans liker å prate" (his ' +
      'customers), not "kundene sine".',
    explanationNb:
      'To hovedregler for sin/sitt/sine vs. hans/hennes:\n\n' +
      '• **sin/sitt/sine** — brukes når eieren ER setningens subjekt: "Bianca vasker leiligheten sin" (sin egen leilighet)\n' +
      '• **hans/hennes** — brukes når eieren er noen ANNEN: "Bianca sitter i bilen hennes" (en annens bil)\n\n' +
      'Unntak: når subjektet er SAMMENSATT ("Han og kundene"), kan ikke sin/sitt/sine lenger vise ' +
      'tilbake til bare én del av det, så hans/hennes/deres brukes i stedet: "Han og kundene hans ' +
      'liker å prate" (kundene hans), ikke "kundene sine".'
  },

  'determinativ-forsterkere': {
    id: 'determinativ-forsterkere',
    titleEn: 'Emphasizer determinatives (egen, selv, eneste)',
    titleNb: 'Forsterkende determinativer (egen, selv, eneste)',
    explanationEn:
      'Three determinatives add emphasis to a noun phrase, each with its own placement and ' +
      'agreement pattern.\n\n' +
      "• **egen/eget/egne** (own) — agrees with the noun's gender/number like a normal adjective " +
      '(en-word → egen, et-word → eget, plural → egne), and normally follows a possessive instead ' +
      'of an indefinite article: "sin egen leilighet", "sitt eget hus", "sine egne regler".\n' +
      '• **selv** (invariant) — placed AFTER the word it emphasizes (a subject, object, or pronoun) ' +
      'to stress that someone did something without help or in person: "Hun gjorde det selv", ' +
      '"Statsministeren selv kom".\n' +
      '• **selve** (invariant) — placed BEFORE a definite-form noun to intensify it ("the very X", ' +
      '"X itself"): "selve huset", "selve kongen" — never "selv huset".\n' +
      '• **eneste** (invariant) — placed before a noun that must be in definite form with a definite ' +
      'article (den/det/de + noun-et/-en/-ene): "den eneste løsningen", "det eneste alternativet", ' +
      '"de eneste vennene" — never a bare indefinite noun after "eneste".',
    explanationNb:
      'Tre determinativer legger til forsterkning i en substantivfrase, hver med sitt eget ' +
      'plasserings- og bøyingsmønster.\n\n' +
      '• **egen/eget/egne** (eierskap, «min/sin egen») — bøyes etter substantivets kjønn/tall som et ' +
      'vanlig adjektiv (en-ord → egen, et-ord → eget, flertall → egne), og står vanligvis etter et ' +
      'possessiv i stedet for en ubestemt artikkel: «sin egen leilighet», «sitt eget hus», «sine ' +
      'egne regler».\n' +
      '• **selv** (bøyes ikke) — står ETTER ordet det forsterker (subjekt, objekt eller pronomen) for ' +
      'å understreke at noen gjorde noe uten hjelp eller personlig: «Hun gjorde det selv», ' +
      '«Statsministeren selv kom».\n' +
      '• **selve** (bøyes ikke) — står FORAN et substantiv i bestemt form for å forsterke det («selve ' +
      'X», «X selv/selveste X»): «selve huset», «selve kongen» — aldri «selv huset».\n' +
      '• **eneste** (bøyes ikke) — står foran et substantiv som må stå i bestemt form med bestemt ' +
      'artikkel (den/det/de + substantiv-et/-en/-ene): «den eneste løsningen», «det eneste ' +
      'alternativet», «de eneste vennene» — aldri et ubestemt substantiv etter «eneste».'
  },

  'klokka-tid': {
    id: 'klokka-tid',
    titleEn: 'Telling time',
    titleNb: 'Klokka',
    explanationEn:
      '«Halv» + a number means half past the PREVIOUS hour: "halv åtte" = 7:30, not 8:30. ' +
      '«Kvart over/på» and «N minutter over/på» work the same way, anchored to the nearest hour or ' +
      'half-hour: "ti på halv sju" = 6:20, "fem over halv seks" = 5:35.',
    explanationNb:
      '«Halv» + et tall betyr halv time før timen: "halv åtte" = 7.30, ikke 8.30.\n\n' +
      '«Kvart over/på» og «N minutter over/på» fungerer på samme måte, forankret til nærmeste hele eller halve time.'
  },

  kvantorer: {
    id: 'kvantorer',
    titleEn: 'Quantifiers: mye/mange, mer/flere',
    titleNb: 'Kvantorer (mengdeord)',
    explanationEn:
      'Use «mye»/«mer» with uncountable nouns (mat, tid, plass, arbeid): "Jeg har mye å gjøre." Use ' +
      '«mange»/«flere» with countable plural nouns (venner, oppgaver, stoler): "Jeg har mange ' +
      'venner." «Flere» also means "several more" (Vi trenger flere stoler), while «mer» means ' +
      '"more" of an uncountable amount (Vi trenger mer plass). The same countable/uncountable ' +
      'split repeats across the whole scale: «få»/«lite» are the low-quantity mirror of ' +
      '«mange»/«mye»; «noen» (countable: noen venner) vs. «noe» (uncountable: noe informasjon); ' +
      '«de fleste» (countable) vs. «det meste» (uncountable) parallel mest/flest; ' +
      '«mindre»/«færre» are the comparative mirror of «mer»/«flere». A related pair often ' +
      'confused: «litt» (adjective, a moderate/decent amount, positively toned — "Jeg har litt ' +
      'penger" = I have some money, a fair amount) vs. «lite» (adverb, "not much/almost none" — ' +
      '"Jeg har lite penger" = I have hardly any money); «lite» can also be an adjective, the ' +
      'neuter form of «liten» ("small": et lite hus). Quantifiers also change form when pointing ' +
      'at a SPECIFIC, already-known group vs. a general one: «noen/mange/flere/en del» + «av» + a ' +
      'noun in DEFINITE form picks out part of a known group ("mange av elevene i klassen" — many ' +
      'of THOSE specific students), while the same quantifier directly before an INDEFINITE ' +
      'plural noun states a general, non-specific quantity ("mange elever" — many students, in general).',
    explanationNb:
      'Bruk «mye»/«mer» med ikke-tellelige substantiv (mat, tid, plass, arbeid): "Jeg har mye å gjøre." Bruk «mange»/«flere» med tellelige substantiv i flertall (venner, oppgaver, stoler): "Jeg har mange venner." «Flere» betyr også "noen flere til" (Vi trenger flere stoler), mens «mer» betyr en større mengde av noe ikke-tellelig (Vi trenger mer plass).\n\n' +
      'Det samme tellelig/ikke-tellelig-skillet gjentar seg over hele skalaen:\n' +
      '• **få / lite** = lavmengde-motstykket til «mange»/«mye»\n' +
      '• **noen / noe** = tellelig (noen venner) mot ikke-tellelig (noe informasjon)\n' +
      '• **de fleste / det meste** = tellelig mot ikke-tellelig, på samme måte som mest/flest\n' +
      '• **mindre / færre** = komparativ-motstykket til «mer»/«flere»\n\n' +
      'Et beslektet par som ofte forveksles:\n' +
      '• **litt / lite** = «litt» (adjektiv) = en middels/grei mengde, positivt ladet: «Jeg har litt penger» (jeg har en del, nok). «Lite» (adverb) = nesten ingenting: «Jeg har lite penger» (jeg har nesten ingen penger igjen). «Lite» kan også være adjektiv — intetkjønnsform av «liten»: «et lite hus»\n' +
      '• **mengdeord + av + bestemt form** = peker på en spesifikk, kjent gruppe: «mange av elevene» (noen av DE elevene vi snakker om). Mengdeord + substantiv i ubestemt form = en generell mengde: «mange elever» (mange elever generelt, ikke en bestemt gruppe)'
  },

  'spesial-kvantorer': {
    id: 'spesial-kvantorer',
    titleEn: 'ingen/alle/hel/hver/enhver/begge — specialized quantifier-pronouns',
    titleNb: 'ingen, alle, hel, hver, enhver, begge',
    explanationEn:
      '«Ingen»/«ikke noen» replace «ikke» + «noen» for countable nouns; «ingenting»/«ikke noe» for ' +
      'uncountable ones — but if another word splits «ikke» from «no(e/n)» (e.g. a two-part verb), ' +
      "the ingen-forms can't be used. «All/alt» go with uncountable nouns (agreeing in gender), " +
      '«alle» with plurals. «Hel/helt» go with countable singular indefinite nouns (agreeing in ' +
      'gender), «hele» with definite singular nouns — never with the den/det/de article. «Hver/hvert» ' +
      'go with countable singular nouns (agreeing in gender), always followed by indefinite form. ' +
      '«Enhver/ethvert» is a more formal, emphatic cousin of «hver/hvert» — it stresses "any single ' +
      'one, no exceptions" and shows up in rules, rights, and general statements: "Enhver borger ' +
      'har rett til …", "Ethvert menneske fortjener respekt." Like «hver/hvert», it agrees in gender ' +
      '(en/m/f-word → enhver, et-word → ethvert) and has no plural form. ' +
      '«Begge (to)» is for two specific people/things in definite form; «begge deler» for something ' +
      'general/uncountable or two different things; their negative counterparts are «ingen av dem» ' +
      'and «ingen av delene».',
    explanationNb:
      'Disse kvantor-pronomenene følger ulike samsvarsmønstre:\n\n' +
      '• **ingen / ikke noen** = for tellelige substantiv; **ingenting / ikke noe** = for utellelige. Hvis et annet ord skiller «ikke» fra «no(e/n)» (f.eks. et sammensatt verb), kan ikke ingen-formene brukes\n' +
      '• **all/alt** = til utellelige substantiv (samsvarer i kjønn); **alle** = til flertall\n' +
      '• **hel/helt** = til tellelige substantiv i ubestemt entall (samsvarer i kjønn); **hele** = til bestemt entall — aldri sammen med artikkelen den/det/de\n' +
      '• **hver/hvert** = til tellelige substantiv i entall (samsvarer i kjønn), alltid fulgt av ubestemt form\n' +
      '• **enhver/ethvert** = en mer formell, understrekende slektning av hver/hvert — betyr "enhver eneste, uten unntak" og brukes ofte i regler, rettigheter og generelle utsagn: «Enhver borger har rett til …», «Ethvert menneske fortjener respekt.» Samsvarer i kjønn (en/m/f-ord → enhver, et-ord → ethvert) og har ingen flertallsform\n' +
      '• **begge (to)** = om to bestemte personer/ting i bestemt form; **begge deler** = om noe generelt/utellelig eller to ulike ting. Negative motstykker: «ingen av dem» og «ingen av delene»'
  }
};
