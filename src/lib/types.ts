import type { SVGAttributes } from 'svelte/elements';
import type { Card } from 'ts-fsrs';
import { CATEGORIES_BY_LEVEL, LANGUAGES } from '$lib/config';

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C';

export type PartOfSpeech =
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'adverb'
  | 'pronoun'
  | 'numeral'
  | 'preposition'
  | 'conjunction'
  | 'interjection'
  | 'phrase';

export type Category = (typeof CATEGORIES_BY_LEVEL)[CEFRLevel][number];

export type FSRSRating = 'again' | 'hard' | 'good' | 'easy';

export interface CardProgress {
  fsrs: Card;
  seenCount: number;
  lastSeen: string; // ISO date string
  lastRating?: FSRSRating; // most recent rating
  level: CEFRLevel;
  category: Category;
}

export type Language = keyof typeof LANGUAGES;
export type FlashcardLanguage = Exclude<Language, 'norwegian'>;

export interface VocabEntry {
  id: string;
  lemma?: string;
  norsk: string;
  english: string;
  spanish?: string;
  ukrainian?: string;
  german?: string;
  example: string;
  example_english: string;
  example_spanish?: string;
  example_ukrainian?: string;
  example_german?: string;
  definition?: string; //monolingual Norwegian definition of the word (B1+)
  level: CEFRLevel;
  category: Category;
  part: PartOfSpeech;
  theme?: string; // uttrykk-only sub-grouping (see ai-docs/implementation/uttrykk-category.md)
}

type TitleType = {
  id?: string;
  title?: string;
};

type DescType = {
  id?: string;
  desc?: string;
};

export interface BaseProps extends SVGAttributes<SVGElement> {
  size?: string;
  role?: string;
  color?: string;
  variation?: 'solid' | 'outline' | 'mini' | 'micro';
  strokeWidth?: string;
}

export interface Props extends BaseProps {
  title?: TitleType;
  desc?: DescType;
  ariaLabel?: string;
}

// ── Norskprøven Practice ─────────────────────────────────────────────────────

/** Level for Norskprøven practice: A2 or B1 */
export type NorskprovenLevel = 'A2' | 'B1';

/** Test type */
export type NorskprovenTestType = 'reading' | 'writing' | 'oral';

// ── Reading ──────────────────────────────────────────────────────────────────

export interface ReadingOption {
  id: string; // 'a' | 'b' | 'c' | 'd'
  text: string;
}

export interface ReadingQuestion {
  id: string; // e.g. 'rq-001'
  prompt: string; // question text
  options: ReadingOption[];
  correctId: string; // matches one option.id
}

export interface ReadingPassage {
  id: string; // e.g. 'rp-a2-001'
  level: NorskprovenLevel;
  title: string; // passage title shown above the text
  text: string; // the Norwegian passage (1–5 short paragraphs)
  imageUrl?: string; // optional path to static/ asset
  questions: ReadingQuestion[];
}

// ── Writing ──────────────────────────────────────────────────────────────────

export interface WritingPrompt {
  id: string; // e.g. 'wp-a2-001'
  level: NorskprovenLevel;
  situation: string; // context sentence
  task: string; // the instruction
  wordCountMin: number;
  wordCountMax: number;
  modelAnswer: string; // full example answer
  modelNotes?: string; // optional explanation of what makes this answer good
}

// ── Oral ─────────────────────────────────────────────────────────────────────

export interface OralPrompt {
  id: string; // e.g. 'op-a2-001'
  level: NorskprovenLevel;
  scenario: string; // brief role-play setup or discussion topic
  questions: string[]; // 2–4 discussion questions the examiner may ask
  tips?: string; // preparation tip for the candidate
  modelAnswer?: string; // example of a good response, revealed after practice
  modelNotes?: string; // optional explanation of what makes this answer good
}

// ── Aggregated ───────────────────────────────────────────────────────────────

export interface NorskprovenData {
  reading: ReadingPassage[];
  writing: WritingPrompt[];
  oral: OralPrompt[];
}

// ── Grammar ──────────────────────────────────────────────────────────────────

export type GrammarTopic =
  | 'ikke-placement' // ikke in main vs subordinate clauses
  | 'v2-word-order' // inversion after fronted adverbials
  | 'det-sentence' // At X er Y → Det er Y at X
  | 'det-er-ikke' // ordering det / er / ikke
  | 'modal-verb-order' // modal + infinitive position
  | 'subordinate-order' // general subordinate clause word order
  | 'relative-som' // relative clauses with «som» (B2–C1)
  | 'setningsadverbial' // sentence adverbial placement
  | 'adverbial-fronting' // fronting adverbials with V2 inversion
  | 'svar-ja-jo-nei' // short answers: ja / jo / nei (B2–C1)
  // Phase 2 — morphology topics (Plus only)
  | 'noun-articles' // en / et / ei · null article (professions, generics)
  | 'noun-plurals' // irregular and rule-based plural forms
  | 'noun-possessives' // Eriks / Annes — no apostrophe in Norwegian
  | 'adj-agreement' // adjective agreement: ubestemt sg → pl, bestemt form
  | 'adj-definite' // den/det/de + weak adjective form
  | 'adj-comparison' // comparative and superlative forms
  | 'sterke-verb' // strong verb preteritum and past participle forms
  | 'helsetninger' // main clause structure: declarative, questions, ikke, det-subject
  | 'preposisjoner-tid' // time prepositions: i, om, for–siden, på, til
  | 'preposisjoner-sted' // place & relation prepositions: i/på, geography, hos/ved/til/fra, av/fra, compounds
  // Nivå C topics (Plus only) — see ai-docs/implementation/c-grammar.md
  | 'ubestemt-artikkel-c' // indefinite article — professions+adjective, uncountables, transport, uttrykk, optional article
  | 'substantiv-uttrykk-c' // noun forms inside fixed idioms (ta hånd om, stå til liv, gå som fot i hose)
  | 'sammensatte-substantiv' // building compound nouns from a descriptive phrase
  | 'adj-mer-mest' // adjective classes that never take -ere/-est
  | 'adj-farger-uboyelige' // invariable color adjectives: oransje, lilla, rosa, beige
  | 'adj-partisipp-som-adjektiv' // irregular predikativ forms of participle-adjectives
  | 'predikativ-agreement' // predikativ non-agreement (intetkjønn with ubestemt subject) + exceptions
  | 'verbform-i-kontekst' // infinitiv/presens choice across multi-verb sentences
  | 'sterke-verb-c' // rare strong verbs beyond the common A2/B1 list
  | 'perfektum-pluskvamperfektum' // tense choice + word order with sentence adverbials
  | 'futurum-referert' // 2. futurum — evidential/reported «skal ha X»
  | 'kondisjonalis-counterfactual' // 1./2. kondisjonalis + om-setninger
  | 'verbet-a-fa' // meanings of «å få» + hjelpeverb uses
  | 'leddsetning-som-fundament' // subordinate clause filling the front field
  | 'ordet-sa' // så as konjunksjon / tidsadverb / subjunksjon
  | 'koordinerende-konjunksjoner' // og/eller/men/for/så choice + comma rule
  | 'ordfamilie-avledning' // deriving noun/verb/adjective/adverb within a word family
  | 'omskriving-passiv' // active↔passive, casual→formal nominalized paraphrase
  | 'jo-desto-komparativ' // jo + comparative … desto/jo + comparative correlative
  | 'preposisjoner-kroppsdel-uttrykk' // body-part idiom prepositions (hår, nakke, hals, øre)
  | 'preposisjoner-generelt-c' // general idiomatic preposition collocations
  | 'uttrykk-gjenkjenning-c-1' // idiom recognition, part 1 (items 83–89)
  | 'uttrykk-gjenkjenning-c-2' // idiom recognition, part 2 (items 90–96)
  | 'uttrykk-gjenkjenning-c-3'; // idiom recognition, part 3 (items 97–103)

export interface GrammarRule {
  id: GrammarTopic;
  titleEn: string;
  titleNb: string;
  explanationEn: string; // short rule shown on wrong answer
  explanationNb: string;
  blogSlug?: string; // link to related blog post
}

export interface GrammarQuestion {
  id: string; // stable key for FSRS, e.g. 'gq-ikke-001'
  topic: GrammarTopic;
  cefr: CEFRLevel; // PRIMARY level — drives the free-tier budget + FSRS progress bucket
  // Optional multi-level tag for display/filtering. A grammar point often spans
  // bands (e.g. ["B2","C1"]). Defaults to [cefr] when absent — see questionLevels().
  levels?: CEFRLevel[];
  type: 'fill' | 'order' | 'transform' | 'minimal-pair' | 'multiple-choice';
  // Per-question instruction shown above the stimulus, e.g.
  // "Embed in: «Jeg tror at …»" or "Translate into Norwegian:".
  // Lets transform/production items state the task that the generic type
  // label can't. Written in the learner's L1 (English) with NB fragments quoted.
  prompt?: string;
  // --- fill type ---
  sentence?: string; // e.g. "Jeg vet at han _____ frisk."  (___ = the blank)
  words?: string[]; // word bank to arrange in the blank, e.g. ["ikke", "er"]
  // --- order type ---
  tokens?: string[]; // word list shown as chips (reshuffled for display)
  // --- transform type ---
  source?: string; // sentence to rewrite, or an L1 sentence to translate
  // --- minimal-pair type ---
  optionA?: string; // first candidate sentence
  optionB?: string; // second candidate sentence
  explanation?: string; // shown on reveal: why the correct option is right
  // --- multiple-choice type ---
  // Exactly 3 options (per ai-docs/implementation/c-grammar.md Phase 1.5). `answer`
  // must equal one of these strings verbatim (grading matches on normalized text,
  // same as every other type) — there is no separate letter/index field.
  options?: string[];
  // --- shared ---
  answer: string; // primary correct answer (the blank span for fill; full sentence otherwise)
  alternates?: string[]; // other accepted forms
  hint?: string; // optional nudge shown after a wrong attempt
  plusOnly?: boolean; // gate advanced questions behind Plus
}
