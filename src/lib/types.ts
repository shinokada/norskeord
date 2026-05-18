import type { SVGAttributes } from 'svelte/elements';
import type { Card } from 'ts-fsrs';

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

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
    'basic-adjectives',
    'basic-verbs',
    'pronouns-and-questions',
    'feelings',
    'weather',
    'transportation',
    'household-items',
    'basic-places',
    'basic-clothes',
    'simple-actions',
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
    'health-basic',
    'weather',
    'time',
    'descriptive-adjectives',
    'cooking',
    'nature',
    'house-chores',
    'communication',
    'health-body-intermediate',
    'finance-banking',
    'body-health-expanded',
    'social-life',
    'technology-basic',
    'environment-basic',
    'money-numbers',
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
    'opinion-adjectives',
    'food-cooking-advanced',
    'housing-renting',
    'health-body-intermediate',
    'finance-banking',
    'dreams-ambitions',
    'opinions-arguments',
    'norwegian-society',
    'communication-skills',
    'housing-urban-life',
    'mental-wellbeing',
    'sports-fitness',
    'arts-culture',
    'economics-personal-finance',
    'environment-b1',
    'science-nature',
    'media-journalism-b1',
    'workplace',
    'relationships-family',
    'politics-civics',
    'language-learning',
    'health-system',
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
  C1: [
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
    'psychology-advanced'
  ],
  C2: [
    'literary',
    'archaic',
    'proverbs',
    'highly-formal',
    'technical',
    'nuanced-distinctions',
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
  'b1/opinion-adjectives',
  'b1/food-cooking-advanced',
  'b1/housing-renting',
  'b1/finance-banking',
  'b1/dreams-ambitions',
  'b1/opinions-arguments',
  'b1/communication-skills',
  'b1/housing-urban-life',
  'b1/mental-wellbeing',
  'b1/sports-fitness',
  'b1/arts-culture',
  'b1/economics-personal-finance',
  'b1/environment-b1',
  'b1/science-nature',
  'b1/media-journalism-b1',
  'b1/workplace',
  'b1/relationships-family',
  'b1/politics-civics',
  'b1/language-learning',
  'b1/health-system',
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
  // C1 — first 5 free; rest plus-only
  'c1/professional',
  'c1/abstract-concepts',
  'c1/politics-democracy',
  'c1/linguistics',
  'c1/media-journalism',
  'c1/architecture-design',
  'c1/diplomacy-international',
  'c1/finance-economics',
  'c1/medicine-healthcare',
  'c1/psychology-advanced',
  // C2 — first 4 free; rest plus-only
  'c2/technical',
  'c2/nuanced-distinctions',
  'c2/advanced-law-justice',
  'c2/neuroscience-cognition',
  'c2/climate-environment-policy',
  'c2/sociology-anthropology',
  'c2/advanced-business-strategy',
  'c2/existential-abstract'
]);

export function isPlusCategory(level: string, category: string): boolean {
  return PLUS_CATEGORIES.has(`${level.toLowerCase()}/${category}`);
}

export type FSRSRating = 'again' | 'hard' | 'good' | 'easy';

export interface CardProgress {
  fsrs: Card;
  seenCount: number;
  lastSeen: string; // ISO date string
  level: CEFRLevel;
  category: Category;
}

export interface VocabEntry {
  norsk: string;
  lemma?: string;
  english: string;
  example: string;
  example_english: string;
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
