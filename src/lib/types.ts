import type { SVGAttributes } from 'svelte/elements';
import type { Card } from 'ts-fsrs';

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C';

export type PartOfSpeech =
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'adverb'
  | 'pronoun'
  | 'preposition'
  | 'conjunction'
  | 'interjection'
  | 'phrase';

export const CATEGORIES_BY_LEVEL = {
  A1: [
    'greetings',
    'numbers',
    'colors',
    'family',
    'body',
    'food',
    'animals',
    'home',
    'days-months',
    'classroom',
    'adjectives',
    'verbs',
    'pronouns-and-questions',
    'feelings',
    'weather',
    'transportation',
    'household-items',
    'places',
    'clothes',
    'actions',
    'uttrykk',
    'uttrykk-preview'
  ],
  A2: [
    'shopping',
    'transport',
    'clothing',
    'hobbies',
    'directions',
    'occupations',
    'sports',
    'health',
    'weather',
    'time',
    'descriptive-adjectives',
    'cooking',
    'nature',
    'house-chores',
    'communication',
    'body',
    'social-life',
    'technology',
    'environment',
    'money',
    'uttrykk',
    'uttrykk-preview'
  ],
  B1: [
    'travel',
    'environment',
    'media',
    'culture',
    'technology',
    'relationships',
    'education',
    'work',
    'city-life',
    'traditions',
    'expressing-opinions',
    'cooking',
    'accommodation',
    'health',
    'finance',
    'personal-growth',
    'reasoning',
    'society',
    'communication-skills',
    'urban-life',
    'mental-wellbeing',
    'fitness',
    'arts-culture',
    'economics',
    'sustainability',
    'science-nature',
    'journalism',
    'workplace',
    'family',
    'politics',
    'language-learning',
    'healthcare',
    'uttrykk',
    'uttrykk-preview'
  ],
  B2: [
    'politics',
    'economics',
    'social-issues',
    'arts',
    'science',
    'emotions',
    'idioms',
    'history',
    'law',
    'literature',
    'advanced-adjectives',
    'philosophy',
    'medicine',
    'psychology',
    'business',
    'religion',
    'environment',
    'technology',
    'media',
    'education',
    'language',
    'argumentation',
    'abstract-nouns',
    'advanced-verbs',
    'geography',
    'culture',
    'global-issues',
    'academic-language',
    'discourse-markers',
    'work-career',
    'relationships',
    'communication',
    'uttrykk',
    'uttrykk-preview'
  ],
  C: [
    'philosophy',
    'academic',
    'formal-writing',
    'rhetoric',
    'complex-emotions',
    'professional',
    'abstract-concepts',
    'politics-democracy',
    'linguistics',
    'media-journalism',
    'architecture-design',
    'diplomacy-international',
    'finance-economics',
    'medicine-healthcare',
    'psychology-advanced',
    'literary',
    'archaic',
    'proverbs',
    'highly-formal',
    'technical',
    'advanced-law-justice',
    'neuroscience-cognition',
    'climate-environment-policy',
    'sociology-anthropology',
    'advanced-business-strategy',
    'existential-abstract'
  ]
} as const;

export type Category = (typeof CATEGORIES_BY_LEVEL)[CEFRLevel][number];

/**
 * Grammar topics available to free users. Everything else requires Plus.
 */
export const FREE_GRAMMAR_TOPICS = new Set<GrammarTopic>([
  'ikke-placement',
  'v2-word-order',
  'det-er-ikke',
  'modal-verb-order'
]);

export function isFreeGrammarTopic(topic: GrammarTopic): boolean {
  return FREE_GRAMMAR_TOPICS.has(topic);
}

/**
 * Categories that require a Plus subscription.
 * Free users can see these in the picker but cannot open them.
 * A1 and A2 are always fully free — not listed here.
 *
 * C1 free (first 5): philosophy, academic, formal-writing, rhetoric, complex-emotions
 * C2 free (first 4): literary, archaic, proverbs, highly-formal
 */
export const PLUS_CATEGORIES = new Set<string>([
  // B1 — plus-only (22)
  'b1/city-life',
  'b1/traditions',
  'b1/expressing-opinions',
  'b1/cooking',
  'b1/accommodation',
  'b1/finance',
  'b1/personal-growth',
  'b1/reasoning',
  'b1/communication-skills',
  'b1/urban-life',
  'b1/mental-wellbeing',
  'b1/fitness',
  'b1/arts-culture',
  'b1/economics',
  'b1/sustainability',
  'b1/science-nature',
  'b1/journalism',
  'b1/workplace',
  'b1/family',
  'b1/politics',
  'b1/language-learning',
  'b1/healthcare',
  // B2 — plus-only (28 vocab + full uttrykk)
  'b2/arts',
  'b2/emotions',
  'b2/idioms',
  'b2/history',
  'b2/law',
  'b2/literature',
  'b2/advanced-adjectives',
  'b2/philosophy',
  'b2/medicine',
  'b2/psychology',
  'b2/business',
  'b2/religion',
  'b2/environment',
  'b2/technology',
  'b2/media',
  'b2/education',
  'b2/language',
  'b2/argumentation',
  'b2/abstract-nouns',
  'b2/advanced-verbs',
  'b2/geography',
  'b2/culture',
  'b2/global-issues',
  'b2/academic-language',
  'b2/discourse-markers',
  'b2/work-career',
  'b2/relationships',
  'b2/communication',
  'b2/uttrykk',
  // uttrykk — full decks are Plus-only; preview is free
  'a1/uttrykk',
  'a2/uttrykk',
  'b1/uttrykk',
  // C — first 5 free; rest plus-only
  'c/professional',
  'c/abstract-concepts',
  'c/politics-democracy',
  'c/linguistics',
  'c/media-journalism',
  'c/architecture-design',
  'c/diplomacy-international',
  'c/finance-economics',
  'c/medicine-healthcare',
  'c/psychology-advanced',
  'c/technical',
  'c/advanced-law-justice',
  'c/neuroscience-cognition',
  'c/climate-environment-policy',
  'c/sociology-anthropology',
  'c/advanced-business-strategy',
  'c/existential-abstract'
]);

export function isPlusCategory(level: string, category: string): boolean {
  return PLUS_CATEGORIES.has(`${level.toLowerCase()}/${category}`);
}

/**
 * Top 3 categories per level available to free users in the Quiz.
 * Derived from the first 3 non-uttrykk entries in CATEGORIES_BY_LEVEL.
 */
export const FREE_QUIZ_CATEGORIES = new Set<string>([
  // A1
  'a1/greetings',
  'a1/numbers',
  'a1/colors',
  // A2
  'a2/shopping',
  'a2/transport',
  'a2/clothing',
  // B1
  'b1/travel',
  'b1/environment',
  'b1/media',
  // B2
  'b2/politics',
  'b2/economics',
  'b2/social-issues',
  // C
  'c/philosophy',
  'c/academic',
  'c/formal-writing'
]);

export function isFreeQuizCategory(level: string, category: string): boolean {
  return FREE_QUIZ_CATEGORIES.has(`${level.toLowerCase()}/${category}`);
}

/**
 * Practice test number 1 is always free; all higher numbers require Plus.
 * This scales automatically as new test sets are added.
 */
export function isFreeTest(test: number): boolean {
  return test === 1;
}

export type FSRSRating = 'again' | 'hard' | 'good' | 'easy';

export interface CardProgress {
  fsrs: Card;
  seenCount: number;
  lastSeen: string; // ISO date string
  lastRating?: FSRSRating; // most recent rating
  level: CEFRLevel;
  category: Category;
}

export interface VocabEntry {
  norsk: string;
  lemma?: string;
  english: string;
  example: string;
  example_english: string;
  definition?: string; // monolingual Norwegian definition of the word (B1+)
  level: CEFRLevel;
  category: Category;
  part: PartOfSpeech;
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
  | 'adj-comparison'; // comparative and superlative forms

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
  type: 'fill' | 'order' | 'transform' | 'minimal-pair';
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
  // --- shared ---
  answer: string; // primary correct answer (the blank span for fill; full sentence otherwise)
  alternates?: string[]; // other accepted forms
  hint?: string; // optional nudge shown after a wrong attempt
  plusOnly?: boolean; // gate advanced questions behind Plus
}

/**
 * How many grammar questions are free per topic (total, across all CEFR levels).
 * The first N non-plusOnly questions of each topic (in grammar.json file order)
 * are free; everything else requires Plus. Tune this single value to
 * widen/tighten the free tier.
 */
export const FREE_GRAMMAR_PER_TOPIC = 3;

/**
 * Given the full grammar question list, returns the set of question ids that are
 * free for guest/free users: within each topic, the first
 * FREE_GRAMMAR_PER_TOPIC non-plusOnly questions in file order.
 * plusOnly questions are never free.
 */
export function freeGrammarQuestionIds(questions: GrammarQuestion[]): Set<string> {
  const seenPerTopic: Record<string, number> = {};
  const free = new Set<string>();
  for (const q of questions) {
    if (q.plusOnly) continue;
    const seen = seenPerTopic[q.topic] ?? 0;
    if (seen < FREE_GRAMMAR_PER_TOPIC) {
      free.add(q.id);
      seenPerTopic[q.topic] = seen + 1;
    }
  }
  return free;
}

const CEFR_ORDER: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C'];

/** The CEFR levels a question is tagged with — its `levels` array, or `[cefr]`. */
export function questionLevels(q: GrammarQuestion): CEFRLevel[] {
  return q.levels && q.levels.length ? q.levels : [q.cefr];
}

/**
 * The sorted, de-duplicated set of CEFR levels covered by a list of questions
 * (across their `levels` tags). Used to show level badges on a topic card.
 */
export function topicLevels(questions: GrammarQuestion[]): CEFRLevel[] {
  const set = new Set<CEFRLevel>();
  for (const q of questions) for (const l of questionLevels(q)) set.add(l);
  return CEFR_ORDER.filter((l) => set.has(l));
}
