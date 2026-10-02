// src/lib/grammar/rules/substantiv.ts
// Rules for chapter 7 · Substantiv (Part 2). Order follows taxonomy.ts.
// Formatting of `explanationNb`: see the header comment in ./index.ts.
import type { GrammarRule } from '$lib/types';

export const SUBSTANTIV_RULES: Record<string, GrammarRule> = {
  'noun-articles': {
    id: 'noun-articles',
    titleEn: 'Noun articles (en / et / ei)',
    titleNb: 'Substantivartikler (en / et / ei)',
    explanationEn:
      'Norwegian nouns have three genders: masculine (en), neuter (et), and feminine (ei). ' +
      'The indefinite article matches the noun’s gender: en bil, et hus, ei jente. ' +
      'When a noun states what the SUBJECT is, was, or will become — profession, nationality, ' +
      'life stage, and similar identity categories — Norwegian drops the article entirely: ' +
      '"Han er lærer." (He is a teacher.) "Han er chilener." (He is Chilean.) "Da jeg var barn, ' +
      'bodde jeg i Peru." But when the same noun refers to a DIFFERENT person than the subject ' +
      '(an object, not an identity statement), the article comes back: "Jeg traff en lærer." ' +
      '"Jeg kjenner en chilener." "Når jeg møter et barn, får jeg lyst til å jobbe i barnehage."',
    explanationNb:
      'Norske substantiver har tre kjønn: hankjønn (en), intetkjønn (et) og hunkjønn (ei). Den ubestemte artikkelen samsvarer med substantivets kjønn: en bil, et hus, ei jente.\n\n' +
      'Når substantivet forteller hva SUBJEKTET *er, var* eller vil *bli* — yrke, nasjonalitet, ' +
      'livsfase og lignende identitetskategorier — bruker vi ingen artikkel: "Han er lærer." ' +
      '"Han er chilener." "Da jeg var barn, bodde jeg i Peru."\n\n' +
      'Men når substantivet forteller om en ANNEN person enn subjektet (et objekt, ikke et ' +
      'identitetsutsagn), kommer artikkelen tilbake: "Jeg traff en lærer." "Jeg kjenner en ' +
      'chilener." "Når jeg møter et barn, får jeg lyst til å jobbe i barnehage."'
  },

  'noun-plurals': {
    id: 'noun-plurals',
    titleEn: 'Noun plurals',
    titleNb: 'Substantivets flertall',
    explanationEn:
      'Most Norwegian nouns add -er in the plural (en bil → biler). ' +
      'Nouns ending in -e add only -r (en klasse → klasser). ' +
      'Many short neuter nouns have identical singular and plural forms (et år → tre år, et barn → tre barn). ' +
      'Some are irregular: en mann → menn, et barn → barn, en fot → føtter.',
    explanationNb:
      'Flertallsbøyning av substantiv følger flere mønstre:\n\n' +
      '• **-er** — de fleste substantiver: en bil → biler\n' +
      '• **-r** — substantiver som ender på -e: en klasse → klasser\n' +
      '• **uendret** — mange korte intetkjønnsord har samme form i entall og flertall: et år → tre år, et barn → tre barn\n' +
      '• **uregelmessig** — en mann → menn, et barn → barn, en fot → føtter'
  },

  'substantiv-bestemt-form': {
    id: 'substantiv-bestemt-form',
    titleEn: 'Definite noun form (singular)',
    titleNb: 'Substantiv i bestemt form (entall)',
    explanationEn:
      'To say "the X", Norwegian adds an ending to the noun instead of using a separate word: en ' +
      "kopp → koppen, ei uke → uka, et eple → eplet. The ending matches the noun's gender, the " +
      'same gender as its indefinite article (en/ei/et).',
    explanationNb:
      'For å si "the X" legger norsk til en endelse på substantivet i stedet for å bruke et eget ord:\n\n' +
      '• en kopp → koppen\n' +
      '• ei uke → uka\n' +
      '• et eple → eplet\n\n' +
      'Endelsen følger substantivets kjønn, det samme kjønnet som den ubestemte artikkelen (en/ei/et).'
  },

  'ubestemt-artikkel-c': {
    id: 'ubestemt-artikkel-c',
    titleEn: 'Indefinite article — advanced cases',
    titleNb: 'Ubestemt artikkel — avanserte tilfeller',
    explanationEn:
      'Professions/nationalities after «være»/«bli» drop the article ("Hun er lærer"), but an ' +
      'adjective forces it back in ("Hun er en flink lærer"). Uncountable nouns (mat, drikke, ' +
      'snø) normally take no article even with an adjective; adding one changes the meaning to a ' +
      'countable unit. Means of transport after «med» drops the article ("med fly"), restored by ' +
      'an adjective. Many fixed uttrykk (gå på kino) also drop the article, restored by an ' +
      'adjective. A few verbs make the article optional: "Jeg skal kjøpe (en) bil."',
    explanationNb:
      'Flere setningstyper dropper den ubestemte artikkelen, med unntak og mønstre som gjentar seg:\n\n' +
      '• **yrker/nasjonaliteter** etter «være»/«bli» = ingen artikkel ("Hun er lærer"), men et adjektiv krever artikkel igjen ("Hun er en flink lærer")\n' +
      '• **ikke-tellelige substantiv** (mat, drikke, snø) = vanligvis ingen artikkel selv med adjektiv; med artikkel blir det en tellbar enhet\n' +
      '• **transportmiddel** etter «med» = ingen artikkel ("med fly"), gjeninnført av adjektiv\n' +
      '• **faste uttrykk** (gå på kino) = dropper også artikkelen, gjeninnført av adjektiv\n' +
      '• **noen verb** gjør artikkelen valgfri: "Jeg skal kjøpe (en) bil."'
  },

  'noun-possessives': {
    id: 'noun-possessives',
    titleEn: 'Noun possessives (genitive -s)',
    titleNb: 'Substantivets genitiv (-s)',
    explanationEn:
      'Norwegian genitive adds -s directly to the noun or name with NO apostrophe: ' +
      'Eriks bil, Annes jobb, barnets leker. ' +
      'An apostrophe before -s is an English habit — never use it in Norwegian: ' +
      'Erik’s → Eriks. The noun that follows a genitive -s is in the INDEFINITE form: ' +
      '"Petters jente" (not "Petters jenta"). But if an adjective comes between the genitive ' +
      'and the noun, that adjective takes the DEFINITE form: "Petters store jente" ' +
      '(not "Petters stor jente"). A genitive -s also expresses DURATION when attached to a ' +
      'time-measure word before a noun, meaning "an X-long Y" or "an X-long period of Y": ' +
      '"to ukers ferie" (a two-week vacation), "en times pause" (a one-hour break), "ti ' +
      'måneders permisjon" (ten months of leave). This still follows the same genitive -s rule ' +
      '— no apostrophe, the following noun stays indefinite. ' +
      'POSSESSIVE PRONOUNS (eiendomsord) inflect for the gender/number of the noun they mark, ' +
      'like an adjective: min/mi/mitt/mine (my), din/di/ditt/dine (your, singular), ' +
      'sin/si/sitt/sine (his/her/its/their own — REFLEXIVE, see below), vår/vårt/våre (our), ' +
      'deres (your, plural). Third person also has non-reflexive hans (his), hennes (her), ' +
      "dens/dets (its, matching the noun's gender) and deres (their). " +
      'Two word orders are both correct: PRENOMINAL with an indefinite noun (min bil, hennes hus) ' +
      'or POSTPOSED with the noun in DEFINITE form (bilen min, huset hennes) — the postposed ' +
      'form is more common in everyday speech. ' +
      'The REFLEXIVE vs. NON-REFLEXIVE distinction is the trickiest part: sin/si/sitt/sine can ' +
      'ONLY refer back to the SUBJECT of the same clause — "Hun tar bilen sin" = she takes HER ' +
      'OWN car. If the possessor is someone OTHER than the subject, use hans/hennes/deres instead: ' +
      '"Hun tar bilen hennes" = she takes ANOTHER WOMAN\'S car. This mirrors the plural pattern ' +
      "already covered above (sine = the subject's own, deres = belonging to someone else).",
    explanationNb:
      'Norsk genitiv legger -s direkte til substantivet eller navnet UTEN apostrof: Eriks bil, Annes jobb, barnets leker.\n\n' +
      'Apostrof før -s er en engelsk vane — bruk den aldri på norsk: Erik’s → Eriks.\n\n' +
      'Substantivet etter genitiv-s står i UBESTEMT form: "Petters jente" (ikke "Petters jenta"). ' +
      'Men hvis det står et adjektiv imellom genitiven og substantivet, skal adjektivet stå i ' +
      'BESTEMT form: "Petters store jente" (ikke "Petters stor jente").\n\n' +
      'Genitiv-s kan også uttrykke VARIGHET når det legges til et tidsmåleord foran et ' +
      'substantiv, og betyr da "en X lang Y" eller "en periode på X med Y": "to ukers ferie" ' +
      '(ferie som varer i to uker), "en times pause" (en pause som varer i en time), "ti ' +
      'måneders permisjon" (permisjon som varer i ti måneder). Dette følger fortsatt samme ' +
      'genitiv-s-regel — ingen apostrof, og substantivet som følger står i ubestemt form.\n\n' +
      '**Eierpronomen (possessivpronomen)** bøyes etter kjønn/tall på substantivet, som et ' +
      'adjektiv: min/mi/mitt/mine (min), din/di/ditt/dine (din), sin/si/sitt/sine (sin — ' +
      '**REFLEKSIV**, se under), vår/vårt/våre (vår), deres (deres). Tredje person har ' +
      'i tillegg ikke-refleksivt hans, hennes, dens/dets (samsvarer med substantivets kjønn) ' +
      'og deres.\n\n' +
      'To ordstillinger er begge riktige: **foranstilt** med substantiv i ubestemt form ' +
      '(min bil, hennes hus), eller **etterstilt** med substantiv i BESTEMT form (bilen min, ' +
      'huset hennes) — den etterstilte formen er vanligst i dagligtale.\n\n' +
      'Det vanskeligste er skillet mellom **refleksivt og ikke-refleksivt**: sin/si/sitt/sine ' +
      'kan BARE vise tilbake til SUBJEKTET i samme setning — "Hun tar bilen sin" = hun tar sin ' +
      'EGEN bil. Hvis eieren er NOEN ANNEN enn subjektet, brukes hans/hennes/deres i stedet: ' +
      '"Hun tar bilen hennes" = hun tar EN ANNEN KVINNES bil. Dette er samme mønster som ' +
      'flertallskontrasten omtalt over (sine = subjektets egne, deres = tilhører noen andre).'
  },

  'sammensatte-substantiv': {
    id: 'sammensatte-substantiv',
    titleEn: 'Compound noun formation',
    titleNb: 'Å lage sammensatte substantiv',
    explanationEn:
      'Norwegian regularly builds precise compound nouns from a descriptive phrase: "en stol for ' +
      'barn" → barnestol, "miljøet på arbeidsplassen" → arbeidsmiljø — the same skill applies at ' +
      'a harder level with "problemer med søvnen" → søvnproblemer, "en person som gir råd" → ' +
      'rådgiver, "frekvensen av selvmord" → selvmordsfrekvensen. Getting it right requires ' +
      'choosing the correct linking form and knowing which element comes first. Most compounds ' +
      'join with no linking element at all (vinterjakke, husleie, matpakke); many join with -s- ' +
      '(especially after words ending in -ing/-ning, or before another noun: bursdagsfest, ' +
      'prioriteringsliste); a smaller set instead joins with a linking -e-, mainly after short ' +
      'words naming a person or animal (barnebok, gutteskole, hundehus) — which linking form ' +
      'fits a given pair has to be learned case by case.',
    explanationNb:
      'Norsk bygger jevnlig presise sammensatte substantiv fra en beskrivende frase:\n\n' +
      '• «en stol for barn» → barnestol\n' +
      '• «miljøet på arbeidsplassen» → arbeidsmiljø\n' +
      '• «problemer med søvnen» → søvnproblemer\n' +
      '• «en person som gir råd» → rådgiver\n' +
      '• «frekvensen av selvmord» → selvmordsfrekvensen\n\n' +
      'Å lage riktig sammensetning krever å velge riktig bindeform og å vite hvilket ledd som kommer ' +
      'først. De fleste sammensetninger har INGEN bindeledd (vinterjakke, husleie, matpakke); mange ' +
      'får bindes- (særlig etter ord som ender på -ing/-ning, eller foran et nytt substantiv: ' +
      'bursdagsfest, prioriteringsliste); et mindre sett får i stedet en bindings-e, som regel etter ' +
      'korte ord som navngir en person eller et dyr (barnebok, gutteskole, hundehus) — hvilken ' +
      'bindeform som passer, må læres for hvert enkelt ordpar.'
  },

  'sammensatte-substantiv-b2': {
    id: 'sammensatte-substantiv-b2',
    titleEn: 'Compound nouns and adjective+noun vs. fixed compounds',
    titleNb: 'Sammensatte substantiv',
    explanationEn:
      'In a compound noun, the last element (hovedordet) governs the gender and inflection; earlier ' +
      'elements only describe it. A linking «-s-» is inserted after words ending in -sjon, -else, ' +
      '-skap, -het, -dom, -tet, and most words ending in -ing/-ning (permisjonsordning, ' +
      'forskningsartikkel); a linking «-e-» appears after many short, often person/animal-referring ' +
      'words (barnebok, gutteskole); otherwise the elements simply join (familielivet). Separately, ' +
      'an adjective + noun written as two words keeps normal adjective agreement and a literal ' +
      'meaning (en brun ost), while the same words fused into one compound word narrow to a specific ' +
      'meaning and the adjective-like first element no longer inflects (en brunost, to brunoster).',
    explanationNb:
      'I et sammensatt substantiv styrer det siste leddet (hovedordet) kjønn og bøyning; tidligere ledd beskriver det bare.\n\n' +
      '• **bindings-s** settes inn etter ord som ender på -sjon, -else, -skap, -het, -dom, -tet, og de fleste ord som ender på -ing/-ning: permisjonsordning, forskningsartikkel\n' +
      '• **bindings-e** dukker opp etter mange korte ord, ofte om personer/dyr: barnebok, gutteskole\n' +
      '• **ingen binding** — ellers settes leddene rett sammen: familielivet\n\n' +
      'Adjektiv + substantiv skrevet som to ord beholder vanlig adjektivsamsvar og en bokstavelig betydning (en brun ost), mens de samme ordene smeltet sammen til étt sammensatt ord får en spesifikk betydning, og det adjektivliknende første leddet bøyes ikke lenger (en brunost, to brunoster).'
  }
};
