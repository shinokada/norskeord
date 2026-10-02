// src/lib/grammar/rules/adjektiv.ts
// Rules for chapter 9 · Adjektiv (Part 2). Order follows taxonomy.ts.
// Formatting of `explanationNb`: see the header comment in ./index.ts.
import type { GrammarRule } from '$lib/types';

export const ADJEKTIV_RULES: Record<string, GrammarRule> = {
  'adj-agreement': {
    id: 'adj-agreement',
    titleEn: 'Adjective agreement',
    titleNb: 'Adjektivbøyning',
    explanationEn:
      'Norwegian adjectives must agree with the noun they modify in gender and number. ' +
      'Indefinite singular: en stor bil, ei stor jente, et stort hus. ' +
      'Plural (all genders): store biler / store jenter / store hus. ' +
      'Note: liten is irregular — liten (en), lita (ei), lite (et), små (plural). ' +
      'Adjectives ending in -el, -er, or -en drop the -e- (and one consonant, if doubled) ' +
      'in the plural/definite form: gammel → gamle, vakker → vakre, sliten → slitne, ' +
      'sulten → sultne, diger → digre. «Sånn/sånt/sånne» and «slik/slikt/slike» ("such, ' +
      'that kind of") behave like adjectives and agree the same way — en-word: sånn/slik, ' +
      'et-word: sånt/slikt, plural: sånne/slike.',
    explanationNb:
      'Norske adjektiver må samsvare med substantivet de bøyer i kjønn og tall:\n\n' +
      '• **ubestemt entall** — en stor bil, ei stor jente, et stort hus\n' +
      '• **flertall (alle kjønn)** — store biler / store jenter / store hus\n\n' +
      'Merk: liten er uregelmessig — liten (en), lita (ei), lite (et), små (flertall).\n\n' +
      'Adjektiv som ender på -el, -er eller -en mister -e- (og én konsonant ved dobbeltkonsonant) ' +
      'i flertall/bestemt form: gammel → gamle, vakker → vakre, sliten → slitne, sulten → sultne, ' +
      'diger → digre.\n\n' +
      '«Sånn/sånt/sånne» og «slik/slikt/slike» ("sånn, den typen") oppfører seg som adjektiv og ' +
      'bøyes på samme måte: en-ord → sånn/slik, et-ord → sånt/slikt, flertall → sånne/slike.'
  },

  'adj-farger-uboyelige': {
    id: 'adj-farger-uboyelige',
    titleEn: 'Invariable color adjectives',
    titleNb: 'Ubøyelige fargeadjektiv',
    explanationEn:
      'Several color adjectives borrowed from nouns never inflect for gender, number, or ' +
      'definiteness: oransje, lilla, rosa, beige. "en oransje bil," "et oransje hus," "de oransje ' +
      'bilene" — always the same form, unlike native color adjectives (rød, blå, grønn).',
    explanationNb:
      'Flere fargeadjektiv lånt fra substantiv bøyes aldri i kjønn, tall eller bestemthet: oransje, lilla, rosa, beige.\n\n' +
      '«en oransje bil», «et oransje hus», «de oransje bilene» — alltid samme form, i motsetning til opprinnelige fargeadjektiv (rød, blå, grønn).'
  },

  'adj-definite': {
    id: 'adj-definite',
    titleEn: 'Adjective in definite form',
    titleNb: 'Adjektiv i bestemt form',
    explanationEn:
      'When a noun is in the definite form, the adjective takes a weak (-e) ending AND ' +
      'requires the definite article den / det / de before it: ' +
      'den gamle mannen, det nye huset, de norske studentene. ' +
      'Never omit the article: *gamle mannen is wrong.',
    explanationNb:
      'Når et substantiv står i bestemt form, får adjektivet svak (-e) ending OG krever den bestemte artikkelen den / det / de foran: den gamle mannen, det nye huset, de norske studentene.\n\n' +
      'Utelat aldri artikkelen: *gamle mannen er feil.'
  },

  'adj-comparison': {
    id: 'adj-comparison',
    titleEn: 'Adjective comparison',
    titleNb: 'Adjektivets gradbøyning',
    explanationEn:
      'Most adjectives form the comparative with -ere and superlative with -est: ' +
      'billig → billigere → billigst. ' +
      'Some are irregular: god → bedre → best, dårlig → verre → verst, ' +
      'gammel → eldre → eldst, liten → mindre → minst, tung → tyngre → tyngst ' +
      '(vowel shift, like ung → yngre → yngst). ' +
      'Use «enn» after comparatives: Oslo er større enn Bergen. When a superlative follows a ' +
      'definite-form noun with no separate article, it stays in the indefinite form: "Disse ' +
      'bøkene er best" (not "beste"). But with the article «de» before it, the definite form is ' +
      'required: "Disse bøkene er de beste" (not "de best"). ' +
      'A tricky irregular trio worth flagging: «lang» (adjective, physical/spatial length) compares ' +
      'lang → lengre → lengst ("Broren hennes er ti centimeter lengre enn henne" = her brother is ten ' +
      'centimeters taller than her); «langt» (adverb, distance/extent) compares the same way, langt → ' +
      'lengre → lengst ("Kan du stille deg litt lengre bak?" = can you stand a little further back?); but ' +
      '«lenge» (adverb, duration/time) has its own comparison, lenge → lenger → lengst ("Jeg vil ikke ' +
      'være her lenger" = I don\'t want to be here any longer). «Lengre» and «lenger» are NOT ' +
      'interchangeable — «lengre» covers physical length/distance (both the adjective and the ' +
      'distance-adverb), while «lenger» is reserved for TIME/duration. ' +
      'Equality is expressed with «like» + adjective (base form) + «som» (never «enn»): "Emma er like flink som søsteren sin" (Emma is as good as her sister). The negated form follows the same pattern, «ikke like» or «ikke så» + adjective + «som»: "Denne bilen er ikke så dyr som den forrige" (This car is not as expensive as the previous one). «Enn» belongs with the comparative and can introduce either a single word/phrase or a full clause: "Oppgaven var vanskeligere enn jeg trodde" (The task was harder than I thought) — the verb in the clause after «enn» usually matches the main clause’s tense, and a pronoun after «enn» takes the object form: "Kollegaen hennes er dyktigere enn henne" (Her colleague is more skilled than her).',
    explanationNb:
      'De fleste adjektiver danner komparativ med -ere og superlativ med -est: billig → billigere → billigst.\n\n' +
      'Noen er uregelmessige:\n' +
      '• god → bedre → best\n' +
      '• dårlig → verre → verst\n' +
      '• gammel → eldre → eldst\n' +
      '• liten → mindre → minst\n' +
      '• tung → tyngre → tyngst (vokalskifte, som ung → yngre → yngst)\n\n' +
      'Bruk «enn» etter komparativ: Oslo er større enn Bergen.\n\n' +
      'Når superlativet står etter et substantiv i bestemt form uten egen artikkel, brukes den ' +
      'ubestemte formen: "Disse bøkene er best" (ikke "beste"). Med artikkelen «de» foran ' +
      'superlativet kreves derimot den bestemte formen: "Disse bøkene er de beste" (ikke "de best").\n\n' +
      'Et lurt uregelmessig trekløver er verdt å nevne:\n' +
      '• **lang** (adjektiv, fysisk/romlig lengde) gradbøyes lang → lengre → lengst: «Broren hennes er ti centimeter lengre enn henne.»\n' +
      '• **langt** (adverb, avstand/utstrekning) gradbøyes på samme måte, langt → lengre → lengst: «Kan du stille deg litt lengre bak?»\n' +
      '• **lenge** (adverb, varighet/tid) har sin egen gradbøyning, lenge → lenger → lengst: «Jeg vil ikke være her lenger.»\n\n' +
      '«Lengre» og «lenger» er IKKE ombyttbare — «lengre» dekker fysisk lengde/avstand (både adjektivet og avstandsadverbet), mens «lenger» er forbeholdt TID/varighet.\n\n' +
      'Likhet uttrykkes med «like» + adjektiv i grunnform + «som» (ikke «enn»): "Emma er like flink som søsteren sin." Den nektende formen bruker samme mønster: «ikke like» eller «ikke så» + adjektiv i grunnform + «som»: "Denne bilen er ikke så dyr som den forrige." «Enn» hører derimot til komparativ og kan innlede enten et enkelt ord/uttrykk eller en hel leddsetning: "Oppgaven var vanskeligere enn jeg trodde" — verbet i leddsetningen etter «enn» følger normalt samme tid som hovedsetningen, og et pronomen etter «enn» står i objektsform: "Kollegaen hennes er dyktigere enn henne."'
  },

  'adj-boying-c': {
    id: 'adj-boying-c',
    titleEn: 'Adjective comparison and agreement (advanced)',
    titleNb: 'Adjektiv: gradbøying og samsvarsbøying (avansert)',
    explanationEn:
      'Two trickier adjective patterns at this level, beyond the basic -ere/-est rules:\n\n' +
      '1) Adjectives ending in unstressed -en (våken, gedigen, åpen) drop the -en before any ' +
      'ending: comparative våken → våknere, superlative våknest / (bestemt) våkneste; ' +
      'weak/definite form gedigen → gedigne (like åpen → åpne).\n\n' +
      '2) Adjectives ending in -ig (or -lig, -som) take -st rather than -est in the superlative: ' +
      'døsig → døsigst → (bestemt) døsigste, hånlig → hånligst → hånligste.\n\n' +
      'Perfektum partisipp used as an adjective (utslitt, irritert, opprømt) generally forms ' +
      'comparison periphrastically with mer/mest rather than -ere/-est: mer utslitt, ' +
      'not utslittere.\n\n' +
      'As always, a definite noun phrase needs both the article (den/det/de) and the weak ' +
      '-e ending on the adjective, and a predicative adjective with no following noun ' +
      'takes no ending at all: Sjefen var olm (not olmt/olme).',
    explanationNb:
      'To vanskeligere adjektivmønstre på dette nivået, utover de vanlige -ere/-est-reglene:\n\n' +
      '1) Adjektiv som ender på trykklett -en (våken, gedigen, åpen) mister -en før enhver ' +
      'endelse: komparativ våken → våknere, superlativ våknest / (bestemt) våkneste; ' +
      'svak/bestemt form gedigen → gedigne (som åpen → åpne).\n\n' +
      '2) Adjektiv som ender på -ig (eller -lig, -som) får -st i stedet for -est i superlativ: ' +
      'døsig → døsigst → (bestemt) døsigste, hånlig → hånligst → hånligste.\n\n' +
      'Perfektum partisipp brukt som adjektiv (utslitt, irritert, opprømt) gradbøyes ' +
      'som regel med mer/mest, ikke -ere/-est: mer utslitt, ikke utslittere.\n\n' +
      'Husk ellers: en bestemt substantivfrase trenger både artikkelen (den/det/de) og svak ' +
      '-e-ending på adjektivet, mens et predikativt adjektiv uten substantiv etter seg ' +
      'ikke får noen endelse i det hele tatt: Sjefen var olm (ikke olmt/olme).'
  },

  'adj-mer-mest': {
    id: 'adj-mer-mest',
    titleEn: 'Adjectives compared with mer/mest',
    titleNb: 'Adjektiv som gradbøyes med mer/mest',
    explanationEn:
      'Several adjective classes never take -ere/-est: adjectives ending in -isk (praktisk), ' +
      'past/present participles (kjent, levende), adjectives ending in -et/-ete, -en, some -e, ' +
      '-iv, -ær, and most long/borrowed adjectives (interessant, fleksibel).',
    explanationNb:
      'Flere adjektivklasser tar aldri -ere/-est:\n\n' +
      '• **-isk**: praktisk\n' +
      '• **partisipper**: kjent, levende\n' +
      '• **-et/-ete, -en, noen -e, -iv, -ær**\n' +
      '• **lange/importerte adjektiv**: interessant, fleksibel'
  },

  'substantivert-adjektiv': {
    id: 'substantivert-adjektiv',
    titleEn: 'Nominalized adjectives (de unge, de fattige)',
    titleNb: 'Substantiverte adjektiv',
    explanationEn:
      'An adjective can stand alone as a noun referring to a group or type of people, using the ' +
      'same foranstilt bestemmer + weak adjective ending as normal definite noun phrases, but with ' +
      'no noun following: "de unge" (young people), "de fattige" (the poor), "den ansatte" (the ' +
      'employee). Singular "den"/"det" + adjective can refer to one person or an abstract quality ' +
      'depending on context; plural "de" + adjective always refers to a group of people.',
    explanationNb:
      'Et adjektiv kan stå alene som et substantiv og referere til en gruppe eller type mennesker, ' +
      'med samme foranstilte bestemmer + svak adjektivending som i vanlige bestemte substantivfraser, ' +
      'men uten et substantiv etter:\n\n' +
      '• «de unge»\n' +
      '• «de fattige»\n' +
      '• «den ansatte»\n\n' +
      'Entall «den»/«det» + adjektiv kan vise til én person eller en abstrakt egenskap avhengig av sammenhengen; flertall «de» + adjektiv viser alltid til en gruppe mennesker.'
  },

  'ordenstall-dato': {
    id: 'ordenstall-dato',
    titleEn: 'Ordinal numbers and dates',
    titleNb: 'Ordenstall og dato',
    explanationEn:
      'Ordinals (tredje, sjuende, syttende) mostly add -ende to the cardinal, with irregulars for ' +
      '1st–4th (første, andre, tredje, fjerde). Dates combine day-ordinal + month-ordinal: "17.05." ' +
      '= "syttende i femte", or day-ordinal + month name: "den 17. mai."',
    explanationNb:
      'Ordenstall (tredje, sjuende, syttende) legger for det meste til -ende til grunntallet, med uregelmessige former for 1.–4. (første, andre, tredje, fjerde).\n\n' +
      'Datoer kombinerer dag-ordenstall + måned-ordenstall: "17.05." = "syttende i femte."'
  }
};
