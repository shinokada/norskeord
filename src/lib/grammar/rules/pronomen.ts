// src/lib/grammar/rules/pronomen.ts
// Rules for chapter 8 · Pronomen (Part 2). Order follows taxonomy.ts.
// Formatting of `explanationNb`: see the header comment in ./index.ts.
import type { GrammarRule } from '$lib/types';

export const PRONOMEN_RULES: Record<string, GrammarRule> = {
  'personlige-pronomen': {
    id: 'personlige-pronomen',
    titleEn: 'Personal pronouns (subject form)',
    titleNb: 'Personlige pronomen (subjektsform)',
    explanationEn:
      'Norwegian subject pronouns are jeg (I), du (you, sg.), han (he), hun (she), vi (we), ' +
      'dere (you, pl.), and de (they). They replace a named subject and must match its person ' +
      'and number: "Samira bor i Norge." → "Hun bor i Norge." "Boka og pennen ligger her." → ' +
      '"De ligger her."',
    explanationNb:
      'Norske subjektspronomen er jeg, du, han, hun, vi, dere og de. De erstatter et navngitt subjekt og må stemme med person og tall.\n\n' +
      '"Samira bor i Norge." → "Hun bor i Norge." "Boka og pennen ligger her." → "De ligger her."'
  },

  'pronomen-den-det-de': {
    id: 'pronomen-den-det-de',
    titleEn: '«den», «det», «de» referring back to a noun',
    titleNb: '«den», «det», «de» som viser tilbake til et substantiv',
    explanationEn:
      'To refer back to something already named, Norwegian uses den (en/ei-nouns), det ' +
      '(et-nouns), or de (plural) — matched to the ORIGINAL noun\'s gender/number: "Hvor er ' +
      'osten? Den er i kjøleskapet." "Hvor er brødet? Det er på bordet."',
    explanationNb:
      'For å vise tilbake til noe som allerede er nevnt, bruker norsk den, det eller de — som samsvarer med det ORIGINALE substantivets kjønn/tall:\n\n' +
      '• **den** (en/ei-ord) — "Hvor er osten? Den er i kjøleskapet."\n' +
      '• **det** (et-ord) — "Hvor er brødet? Det er på bordet."\n' +
      '• **de** (flertall)'
  },

  'pronomen-objektsform': {
    id: 'pronomen-objektsform',
    titleEn: 'Object pronouns',
    titleNb: 'Pronomen: objektsform',
    explanationEn:
      'After a verb or a preposition, subject pronouns switch to their object form: jeg→meg, ' +
      'du→deg, han→ham, hun→henne, vi→oss, dere→dere, de→dem. "Jeg liker deg." "Hun snakker med ' +
      'ham." Note that dere stays the same in both forms.',
    explanationNb:
      'Etter et verb eller en preposisjon bytter subjektspronomen til objektsform:\n\n' +
      '• jeg → meg\n' +
      '• du → deg\n' +
      '• han → ham\n' +
      '• hun → henne\n' +
      '• vi → oss\n' +
      '• dere → dere\n' +
      '• de → dem\n\n' +
      '"Jeg liker deg." "Hun snakker med ham." Merk at dere er likt i begge former.'
  },

  'resiprokt-pronomen': {
    id: 'resiprokt-pronomen',
    titleEn: 'Each other: the reciprocal pronoun',
    titleNb: 'Hverandre',
    explanationEn:
      '"Hverandre" (each other) is used when two or more people do something with or to one ' +
      'another: "Anna hjelper Ola, og Ola hjelper Anna" = "De hjelper hverandre." The word never ' +
      'changes and always refers to more than one person. It stands as an object after the verb: ' +
      '"Vi kjenner hverandre." After a preposition it comes after the preposition: "De bor ved ' +
      'siden av hverandre." "Seg" is used when the subject does something to itself, also with a plural ' +
      'subject ("Han vasker seg." "De vasker seg" = each of them washes themselves), while "hverandre" ' +
      'is used when they do something to one another ("De vasker hverandre."). "De ser dem" ' +
      'means they see other people; "De ser hverandre" means two or more of them see one another. ' +
      '"Hverandre" can also be used about something that happens later: "Vi ser hverandre i ' +
      'morgen." Some verbs use -s instead: "De møtes" = "De møter hverandre."',
    explanationNb:
      '«Hverandre» brukes når to eller flere personer gjør noe med eller mot hverandre: «Anna ' +
      'hjelper Ola, og Ola hjelper Anna» = «De hjelper hverandre.» Ordet endrer seg ikke, og vi ' +
      'bruker det om flere enn én.\n\n' +
      '**Plass:** «Hverandre» står som objekt etter verbet: «Vi kjenner hverandre.» Etter en ' +
      'preposisjon står det også etter preposisjonen: «De bor ved siden av hverandre.»\n\n' +
      '**Hverandre eller seg?** «Seg» brukes når subjektet gjør noe med seg selv, også i flertall: ' +
      '«Han vasker seg.» «De vasker seg.» (hver for seg). «Hverandre» brukes når de gjør noe med ' +
      'hverandre: «De vasker hverandre.» (den ene vasker den andre).\n\n' +
      '**Hverandre eller dem?** «De ser dem» betyr at de ser andre personer. «De ser hverandre» ' +
      'betyr at de to eller flere ser på hverandre.\n\n' +
      '**Senere handling:** «Hverandre» kan også brukes om noe som skjer senere: «Vi ser ' +
      'hverandre i morgen.»\n\n' +
      'Noen verb bruker -s i stedet: «De møtes» = «De møter hverandre.»'
  },

  'man-en-upersonlig-pronomen': {
    id: 'man-en-upersonlig-pronomen',
    titleEn: 'Impersonal pronouns «man» and «en»',
    titleNb: 'Upersonlige pronomen «man» og «en»',
    explanationEn:
      'To speak about people in general, Norwegian uses «man» (subject position only) or «en» ' +
      '(subject or object position): "Man skal ikke tro alt man leser." "En kan ikke stole på alt en ' +
      'finner på nett" (en as subject), "Sola gir en ny energi" (en as object). Colloquial «du» or ' +
      '«folk» can be used the same way in informal register. «En» also has its own possessive/genitive ' +
      'form, «ens» ("one\'s"): "Det er fint når ens egne barn gjør det godt på skolen" ("It\'s nice when ' +
      'one\'s own children do well at school"). «Man» has no possessive form of its own — it borrows «ens».',
    explanationNb:
      'For å snakke om mennesker generelt bruker norsk «man» eller «en»:\n\n' +
      '• **man** — bare subjektsposisjon: "Man skal ikke tro alt man leser."\n' +
      '• **en** — subjekts- eller objektsposisjon: "En kan ikke stole på alt en finner på nett" (en som subjekt), "Sola gir en ny energi" (en som objekt)\n\n' +
      'Muntlig «du» eller «folk» kan brukes på samme måte i uformell stil.\n\n' +
      '«En» har også en egen eieform, «ens»: "Det er fint når ens egne barn gjør det godt på skolen." ' +
      '«Man» har ingen egen eieform — «ens» brukes også sammen med «man».'
  }
};
