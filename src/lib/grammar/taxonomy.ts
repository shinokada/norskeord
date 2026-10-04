// src/lib/grammar/taxonomy.ts
// Single source of truth for how grammar topics are organised: Parts >
// chapters > sections > topics, in learning order. See
// ai-docs/implementation/grammar-update.md (Phase 1) and
// ai-docs/discussions/grammar-mapping-v2.md for the reasoning and the
// per-topic evidence.
//
// Rules of this file:
//   - Every GrammarTopic appears exactly once as a *primary* topic.
//     Topics that also touch other sections are listed in ALSO_IN.
//   - No access info here. Free/locked comes from FREE_GRAMMAR_TOPICS in
//     $lib/config (one source of truth).
//   - Parts 1-3 mirror the structure of the reference grammar (section
//     numbers and titles). Part 4 holds topics that structure doesn't
//     cover. Explanation text is our own; only the structure is shared.
//   - `entry` is the recommended entry level taken from the reference's
//     level markers. Gating and practice still use each question's `cefr`.
//
// Phase 1b (done): `helsetninger` was split into `fortellende-setninger` (2.1) and
// `sporresetninger` (2.2), and the four `uttrykk-gjenkjenning-*` topics were merged
// into `uttrykk` (20.1). The GrammarTopic union and FREE_GRAMMAR_TOPICS were updated
// in the same change.

import type { GrammarTopic } from '$lib/types';

export type BookLevel = 'base' | 'B1' | 'B2';

export interface TaxonomySection {
  id: string; // '7.2'
  titleNb: string;
  titleEn: string; // short gloss for navigation
  entry: BookLevel;
  topics: GrammarTopic[]; // primary topics, in learning order
}

export interface TaxonomyChapter {
  no: number;
  slug: string;
  titleNb: string;
  titleEn: string;
  sections: TaxonomySection[];
}

export interface TaxonomyPart {
  no: 1 | 2 | 3 | 4;
  titleNb: string;
  titleEn: string;
  chapters: TaxonomyChapter[];
}

const s = (
  id: string,
  titleNb: string,
  titleEn: string,
  entry: BookLevel = 'base',
  topics: GrammarTopic[] = []
): TaxonomySection => ({ id, titleNb, titleEn, entry, topics });

const ch = (
  no: number,
  slug: string,
  titleNb: string,
  titleEn: string,
  sections: TaxonomySection[]
): TaxonomyChapter => ({ no, slug, titleNb, titleEn, sections });

export const GRAMMAR_TAXONOMY: TaxonomyPart[] = [
  {
    no: 1,
    titleNb: 'Setninger',
    titleEn: 'Sentences',
    chapters: [
      ch(1, 'setningsledd', 'Setningsledd', 'Sentence elements', [
        s('1.1', 'Verbal og subjekt', 'Verb and subject', 'base', [
          'subjekt-og-verbal',
          'sammensatt-verbtid',
          'setningsledd-identifikasjon'
        ]),
        s('1.2', 'Objekt', 'Object', 'base', ['objekt']),
        s('1.3', 'Predikativ', 'Predicative', 'base', ['predikativ']),
        s('1.4', 'Adverbial', 'Adverbial', 'base', ['adverbial']),
        s('1.5', 'Indirekte objekt', 'Indirect object', 'B1', ['indirekte-objekt']),
        s('1.6', 'Mer om predikativ', 'More on predicatives', 'B2', ['predikativ-agreement'])
      ]),
      ch(2, 'helsetninger', 'Helsetninger', 'Main clauses', [
        s('2.1', 'Fortellende setninger', 'Statements', 'base', ['fortellende-setninger']),
        s('2.2', 'Spørresetninger', 'Questions', 'base', ['sporresetninger']),
        s('2.3', 'Ordstillingen i helsetninger', 'Word order in main clauses', 'base', [
          'adverbial-fronting',
          'det-er-ikke',
          'ikke-placement',
          'v2-word-order',
          'leddsetning-som-fundament'
        ]),
        s('2.4', 'Imperativsetninger', 'Imperative sentences', 'base', ['imperativ'])
      ]),
      ch(3, 'svar', 'Svar', 'Answers', [
        s('3.1', 'Svarord', 'Answer words', 'base', ['ja-jo', 'svar-ja-jo-nei']),
        s('3.2', 'Svar med det', 'Answering with "det"', 'base', ['det-referanse'])
      ]),
      ch(4, 'leddsetninger', 'Leddsetninger', 'Subordinate clauses', [
        s('4.1', 'Hva er en leddsetning?', 'What is a subordinate clause?', 'base', [
          'leddsetning-grunnleggende'
        ]),
        s('4.2', 'Ordstillingen i leddsetninger', 'Word order in subordinate clauses', 'base', [
          'subordinate-order'
        ]),
        s('4.3', 'Adverbiale leddsetninger', 'Adverbial clauses', 'base', ['da-naar']),
        s('4.4', 'Leddsetninger med at og om', 'Clauses with "at" and "om"', 'base', [
          'hvis-om-betingelse'
        ]),
        s('4.5', 'Leddsetninger med spørreord', 'Clauses with question words'),
        s('4.6', 'Mer om ordstilling', 'More on word order', 'B1'),
        s('4.7', 'Indirekte tale', 'Reported speech', 'base', ['indirekte-tale-at-om']),
        s('4.8', 'Som-setninger', 'Relative clauses with "som"', 'base', ['relative-som'])
      ]),
      ch(5, 'det-setninger', 'Det-setninger', '"Det"-sentences', [
        s('5.1', 'Formelt subjekt', 'Formal subject', 'base', [
          'vaer-det-subjekt',
          'det-formelt-subjekt'
        ]),
        s('5.2', 'Utbryting', 'Clefting', 'base', ['det-sentence']),
        s('5.3', 'Det er + som-setning', '"Det er" + som-clause', 'B2')
      ]),
      ch(6, 'setningsfragmenter', 'Setningsfragmenter', 'Sentence fragments', [
        s('6.1', 'Faste uttrykk', 'Fixed expressions', 'base', ['setningsfragment-uttrykk'])
      ])
    ]
  },
  {
    no: 2,
    titleNb: 'Ord og ordklasser',
    titleEn: 'Words and word classes',
    chapters: [
      ch(7, 'substantiv', 'Substantiv', 'Nouns', [
        s('7.1', 'Kjønn', 'Gender', 'base', ['noun-articles']),
        s('7.2', 'Flertall', 'Plural', 'base', ['noun-plurals']),
        s('7.3', 'Bestemt form', 'Definite form', 'base', ['substantiv-bestemt-form']),
        s('7.4', 'Ubestemt artikkel', 'Indefinite article', 'base', ['ubestemt-artikkel-c']),
        s('7.5', 'Egennavn', 'Proper names', 'base', ['egennavn']),
        s('7.6', 'Genitiv', 'Genitive', 'base', ['noun-possessives']),
        s('7.7', 'Sammensatte substantiv', 'Compound nouns', 'base', [
          'sammensatte-substantiv',
          'sammensatte-substantiv-b2'
        ])
      ]),
      ch(8, 'pronomen', 'Pronomen', 'Pronouns', [
        s('8.1', 'Personlige pronomen', 'Personal pronouns', 'base', [
          'personlige-pronomen',
          'pronomen-den-det-de',
          'pronomen-objektsform'
        ]),
        s('8.2', 'Resiprokt pronomen', 'Reciprocal pronoun', 'base', ['resiprokt-pronomen']),
        s('8.3', 'Ubestemt pronomen', 'Indefinite pronoun', 'base', ['man-en-upersonlig-pronomen']),
        s('8.4', 'Mer om pronomen', 'More on pronouns', 'B2')
      ]),
      ch(9, 'adjektiv', 'Adjektiv', 'Adjectives', [
        s('9.1', 'Kjønn og tall', 'Gender and number', 'base', [
          'adj-agreement',
          'adj-farger-uboyelige'
        ]),
        s('9.2', 'Bestemt form', 'Definite form', 'base', ['adj-definite']),
        s('9.3', 'Komparativ og superlativ', 'Comparative and superlative', 'base', [
          'adj-comparison',
          'adj-boying-c',
          'adj-mer-mest'
        ]),
        s('9.4', 'Enkel eller dobbel bestemmelse?', 'Single or double determination?', 'B2', [
          'enkel-dobbel-bestemmelse'
        ]),
        s('9.5', 'Adjektiv brukt som substantiv', 'Adjectives used as nouns', 'base', [
          'substantivert-adjektiv'
        ]),
        s('9.6', 'Ordenstall', 'Ordinal numbers', 'base', ['ordenstall-dato'])
      ]),
      ch(10, 'bestemmerord', 'Bestemmerord', 'Determiners', [
        s('10.1', 'Pekeord', 'Demonstratives', 'base', ['denne-dette-disse']),
        s('10.2', 'Eiendomsord', 'Possessives', 'base', [
          'possessiver-min-din',
          'refleksivt-possessiv-sin',
          'determinativ-forsterkere'
        ]),
        s('10.3', 'Mengdeord', 'Numbers and quantity words', 'base', [
          'klokka-tid',
          'kvantorer',
          'spesial-kvantorer'
        ])
      ]),
      ch(11, 'verb', 'Verb', 'Verbs', [
        s('11.1', 'Bøyning av verb', 'Verb inflection', 'base', ['sterke-verb-c']),
        s('11.2', 'Infinitiv', 'Infinitive', 'base', ['infinitiv-a1', 'verbform-i-kontekst']),
        s('11.3', 'Presens', 'Present tense', 'base', ['presens-verb']),
        s('11.4', 'Presens futurum', 'Future with present tense', 'base', ['framtid-uttrykk']),
        s('11.5', 'Modale verb', 'Modal verbs', 'base', [
          'modal-verb-order',
          'modalverb-preteritum',
          'modalverb-betydning'
        ]),
        s('11.6', 'Presens perfektum', 'Present perfect', 'base', ['presens-perfektum']),
        s('11.7', 'Preteritum', 'Past tense', 'base', ['preteritum-a1', 'sterke-verb']),
        s('11.8', 'Mer om verb', 'More on verbs', 'B2', ['verbet-a-fa', 'fa-perfektum-partisipp']),
        s('11.9', 'Imperativ', 'Imperative'),
        s('11.10', 'Refleksive verb', 'Reflexive verbs', 'base', [
          'refleksive-uttrykk',
          'refleksive-verb'
        ]),
        s('11.11', 'S-verb', 'S-verbs', 'base', ['s-verb']),
        s('11.12', 'Ulike handlinger', 'Different kinds of actions', 'base', [
          'ha-vs-vaere',
          'plassering-verb',
          'transitiv-intransitiv-verb'
        ]),
        s('11.13', 'Passiv', 'Passive', 'B1', ['passiv-bli-s', 'omskriving-passiv']),
        s(
          '11.14',
          'Preteritum perfektum og preteritum futurum',
          'Past perfect and future in the past',
          'B1',
          ['preteritum-perfektum-og-futurum', 'perfektum-pluskvamperfektum']
        ),
        s('11.15', 'Perfektum infinitiv', 'Perfect infinitive', 'B2', ['futurum-referert']),
        s('11.16', 'Modal bruk av fortidsformene', 'Modal use of past forms', 'B2', [
          'hoflig-preteritum',
          'kondisjonalis-counterfactual'
        ])
      ]),
      ch(12, 'adverb', 'Adverb', 'Adverbs', [
        s('12.1', 'Tidsadverb', 'Adverbs of time', 'base', ['tidsadverb']),
        s('12.2', 'Stedsadverb', 'Adverbs of place', 'base', [
          'adverb-sted-hjem',
          'stedsadverb-statisk-dynamisk'
        ]),
        s('12.3', 'Måteadverb', 'Adverbs of manner', 'base', ['adjektiv-eller-adverb']),
        s('12.4', 'Komparativ og superlativ', 'Comparative and superlative adverbs', 'base', [
          'adverb-gradboying'
        ]),
        s('12.5', 'Tekstbindere', 'Text connectors', 'base', ['adverb-setningsbinding']),
        s('12.6', 'Gradsadverb', 'Adverbs of degree', 'base', ['jo-desto-komparativ']),
        s('12.7', 'Setningsadverb', 'Sentence adverbs', 'base', [
          'setningsadverbial',
          'modale-adverb'
        ])
      ]),
      ch(13, 'partisipper', 'Partisipper', 'Participles', [
        s('13.1', 'Perfektum partisipp', 'Past participle', 'base', ['partisipp-former']),
        s('13.2', 'Presens partisipp', 'Present participle', 'B1', ['bli-presens-partisipp']),
        s(
          '13.3',
          'Når bøyer vi perfektum partisipp?',
          'When to inflect the past participle',
          'B1',
          ['adj-partisipp-som-adjektiv']
        ),
        s('13.4', 'Substantivisk bruk av partisippene', 'Participles used as nouns', 'B2', [
          'substantivert-partisipp'
        ]),
        s('13.5', 'Sammensatte partisipper', 'Compound participles', 'B2', [
          'sammensatte-partisipper'
        ])
      ]),
      ch(14, 'preposisjoner', 'Preposisjoner', 'Prepositions', [
        s('14.1', 'Sted', 'Place', 'base', ['preposisjoner-sted']),
        s('14.2', 'Tid', 'Time', 'base', ['for-siden', 'preposisjoner-tid']),
        s('14.3', 'Tilhørighet og tilknytning', 'Belonging and connection', 'base', [
          'preposisjoner-tilhorighet'
        ]),
        s('14.4', 'Annen bruk av preposisjoner', 'Other uses of prepositions', 'base', [
          'preposisjoner-annen-bruk'
        ]),
        s('14.5', 'Sammensatte preposisjoner', 'Compound prepositions', 'base', [
          'sammensatte-preposisjoner'
        ]),
        s('14.6', 'Litt mer om preposisjoner', 'A little more on prepositions', 'B1', [
          'preposisjoner-av-for-med'
        ]),
        s('14.7', 'Faste uttrykk med preposisjon', 'Fixed expressions with prepositions', 'B1', [
          'preposisjoner-uttrykk-b2',
          'preposisjoner-kroppsdel-uttrykk'
        ]),
        s('14.8', 'Enda mer om preposisjoner', 'Even more on prepositions', 'B2', [
          'preposisjoner-generelt-c'
        ])
      ]),
      ch(15, 'interjeksjoner', 'Interjeksjoner', 'Interjections', [
        s('15.1', 'Hilseord', 'Greetings', 'base', ['hilseord']),
        s('15.2', 'Uttrykk for følelser', 'Expressing feelings', 'base', ['folelsesuttrykk']),
        s('15.3', 'Svarord', 'Answer words', 'base', ['svarord-nyanser'])
      ]),
      ch(16, 'konjunksjoner-og-subjunksjoner', 'Konjunksjoner og subjunksjoner', 'Conjunctions', [
        s('16.1', 'Konjunksjoner', 'Coordinating conjunctions', 'base', [
          'og-men',
          'bade-og-verken-eller',
          'koordinerende-konjunksjoner'
        ]),
        s('16.2', 'Subjunksjoner', 'Subordinating conjunctions', 'base', ['subjunksjon-oversikt'])
      ])
    ]
  },
  {
    no: 3,
    titleNb: 'Tekstsammenheng',
    titleEn: 'Text cohesion',
    chapters: [
      ch(17, 'sammenbinding-av-setninger', 'Sammenbinding av setninger', 'Linking sentences', [
        s('17.1', 'Tillegg', 'Addition', 'base', ['tillegg-setninger']),
        s('17.2', 'Motsetning', 'Contrast', 'base', ['motsetning-selv-om-likevel']),
        s('17.3', 'Tid', 'Time', 'base', ['tidssekvens-etter-at-etterpaa']),
        s('17.4', 'Årsak, følge og hensikt', 'Cause, result and purpose', 'base', [
          'for-a-fordi',
          'derfor-fordi',
          'for-sa-arsak-folge'
        ]),
        s('17.5', 'Betingelse', 'Condition', 'base', ['betingelse-hvis-dersom']),
        s('17.6', 'Mer om tillegg', 'More on addition', 'B2', ['i-tillegg-uttrykk']),
        s('17.7', 'Mer om motsetning', 'More on contrast', 'B2', ['kontrast-uttrykk']),
        s('17.8', 'Mer om tid', 'More on time', 'B2', ['tid-samtidighet-plutselig']),
        s('17.9', 'Mer om årsak', 'More on cause', 'B2', ['arsak-og-folge-uttrykk']),
        s('17.10', 'Mer om følge', 'More on result', 'B2', ['folge-uttrykk']),
        s('17.11', 'Mer om hensikt', 'More on purpose', 'B2'),
        s('17.12', 'Mer om betingelse', 'More on condition', 'B2', [
          'hypotetiske-betingelsessetninger'
        ]),
        s('17.13', 'Ord med flere funksjoner', 'Words with several functions', 'B2', ['ordet-sa'])
      ])
    ]
  },
  {
    no: 4,
    titleNb: 'Språk i bruk',
    titleEn: 'Language in use',
    chapters: [
      ch(18, 'ordlaging', 'Ordlaging', 'Word formation', [
        s('18.1', 'Avledning', 'Derivation', 'base', ['ordfamilie-avledning']),
        s('18.2', 'Prefiks', 'Prefixes', 'base', ['verbprefiks-be-an-mis', 'motsetning-prefiks']),
        s('18.3', 'Partikkelverb', 'Particle verbs', 'base', ['partikkelverb-los-fast'])
      ]),
      ch(19, 'ordbruk-og-nyanser', 'Ordbruk og nyanser', 'Word choice and nuance', [
        s('19.1', 'Nyanser mellom lignende ord', 'Nuance between similar words', 'base', [
          'nyanser-uttrykk'
        ]),
        s('19.2', 'Mene, synes, tro og tenke', 'Mene, synes, tro and tenke', 'base', [
          'synes-tror',
          'mene-synes-tro-tenke'
        ]),
        s('19.3', 'Å uttrykke sannsynlighet', 'Expressing probability', 'base', [
          'sannsynlighet-uttrykk'
        ])
      ]),
      ch(20, 'uttrykk-og-idiomer', 'Uttrykk og idiomer', 'Idioms and expressions', [
        s('20.1', 'Gjenkjenne faste uttrykk', 'Recognising fixed expressions', 'base', ['uttrykk']),
        s('20.2', 'Substantivformer i uttrykk', 'Noun forms in expressions', 'base', [
          'substantiv-uttrykk-c'
        ])
      ]),
      ch(21, 'skriving', 'Skriving', 'Writing', [
        s('21.1', 'Komma', 'Commas', 'base', ['kommaregler'])
      ])
    ]
  }
];

/**
 * Sections (other than the primary one) that a topic also touches. Used for
 * cross-links ("also see") and for showing a topic in related sections.
 */
export const ALSO_IN: Partial<Record<GrammarTopic, string[]>> = {
  'adj-boying-c': ['9.1'],
  'adj-partisipp-som-adjektiv': ['9.1'],
  'adjektiv-eller-adverb': ['9.1'],
  'adverbial-fronting': ['1.4'],
  'arsak-og-folge-uttrykk': ['17.10', '17.11'],
  'bade-og-verken-eller': ['17.1', '17.6'],
  'da-naar': ['17.3', '17.13'],
  'derfor-fordi': ['17.9'],
  'det-er-ikke': ['5.1', '12.7'],
  'det-formelt-subjekt': ['5.2'],
  'det-referanse': ['8.4'],
  'det-sentence': ['5.3'],
  'fa-perfektum-partisipp': ['13.1'],
  'for-a-fordi': ['4.3'],
  'for-sa-arsak-folge': ['16.1'],
  'futurum-referert': ['11.14'],
  'hvis-om-betingelse': ['4.3', '17.5', '17.12'],
  'hypotetiske-betingelsessetninger': ['11.16'],
  'ikke-placement': ['12.7'],
  imperativ: ['11.9'],
  'indirekte-tale-at-om': ['4.4', '4.5'],
  'infinitiv-a1': ['11.5'],
  'ja-jo': ['15.3'],
  'jo-desto-komparativ': ['9.3'],
  'kondisjonalis-counterfactual': ['11.15', '17.12'],
  'kontrast-uttrykk': ['17.2'],
  'leddsetning-som-fundament': ['4.6'],
  'mene-synes-tro-tenke': ['4.4', '4.6'],
  'modal-verb-order': ['2.3', '4.2'],
  'modalverb-preteritum': ['11.7'],
  'motsetning-selv-om-likevel': ['17.7'],
  'noun-articles': ['7.4'],
  'og-men': ['17.1'],
  'partisipp-former': ['13.2'],
  'perfektum-pluskvamperfektum': ['11.6'],
  'predikativ-agreement': ['1.3', '9.1'],
  'preposisjoner-kroppsdel-uttrykk': ['20.2'],
  'pronomen-den-det-de': ['8.4'],
  'sammensatt-verbtid': ['11.1'],
  'sannsynlighet-uttrykk': ['11.4', '12.7'],
  'setningsledd-identifikasjon': ['1.2', '1.3', '1.4', '1.5', '1.6'],
  'sterke-verb': ['11.1'],
  'sterke-verb-c': ['11.7'],
  'svar-ja-jo-nei': ['15.3'],
  'synes-tror': ['4.4', '4.6'],
  'tidssekvens-etter-at-etterpaa': ['17.8'],
  'verbet-a-fa': ['11.12'],
  'verbform-i-kontekst': ['11.3']
};

export interface TopicPlacement {
  part: TaxonomyPart;
  chapter: TaxonomyChapter;
  section: TaxonomySection;
}

// ---------------------------------------------------------------------------
// Derived lookups (computed once at module load; never hand-written).
// ---------------------------------------------------------------------------

const placements = new Map<GrammarTopic, TopicPlacement>();
const sectionsById = new Map<string, TaxonomySection>();
const chaptersBySlug = new Map<string, TaxonomyChapter>();
const orderedTopicList: GrammarTopic[] = [];

for (const part of GRAMMAR_TAXONOMY) {
  for (const chapter of part.chapters) {
    chaptersBySlug.set(chapter.slug, chapter);
    for (const section of chapter.sections) {
      sectionsById.set(section.id, section);
      for (const topic of section.topics) {
        placements.set(topic, { part, chapter, section });
        orderedTopicList.push(topic);
      }
    }
  }
}

/** Where a topic lives (its primary Part, chapter and section). */
export function placementOf(topic: GrammarTopic): TopicPlacement | undefined {
  return placements.get(topic);
}

export function chapterBySlug(slug: string): TaxonomyChapter | undefined {
  return chaptersBySlug.get(slug);
}

export function sectionById(id: string): TaxonomySection | undefined {
  return sectionsById.get(id);
}

/** All topics in learning (book) order. Returns a copy. */
export function orderedTopics(): GrammarTopic[] {
  return [...orderedTopicList];
}

/** Previous and next topic in learning order (null at either end). */
export function adjacentTopics(topic: GrammarTopic): {
  prev: GrammarTopic | null;
  next: GrammarTopic | null;
} {
  const i = orderedTopicList.indexOf(topic);
  if (i === -1) return { prev: null, next: null };
  return {
    prev: i > 0 ? orderedTopicList[i - 1] : null,
    next: i < orderedTopicList.length - 1 ? orderedTopicList[i + 1] : null
  };
}

/** Extra sections a topic touches besides its primary one. */
export function sectionsAlsoCovering(topic: GrammarTopic): TaxonomySection[] {
  return (ALSO_IN[topic] ?? [])
    .map((id) => sectionsById.get(id))
    .filter((sec): sec is TaxonomySection => !!sec);
}

/** Topics that list this section as a cross-reference (not as primary). */
export function topicsAlsoIn(sectionId: string): GrammarTopic[] {
  return (Object.entries(ALSO_IN) as [GrammarTopic, string[]][])
    .filter(([, ids]) => ids.includes(sectionId))
    .map(([topic]) => topic);
}
