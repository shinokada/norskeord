// src/lib/config.ts
// Pure constants derived from the domain model.
// No runtime logic — safe to import anywhere including SSR and service workers.

import type { CEFRLevel } from '$lib/types';

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
} as const satisfies Record<CEFRLevel, readonly string[]>;

export const LANGUAGES = {
  norwegian: { name: 'Norwegian', flag: '🇳🇴', code: 'nb', abbr: 'NO' },
  english: { name: 'English', flag: '🇬🇧', code: 'en', abbr: 'EN' },
  spanish: { name: 'Spanish', flag: '🇪🇸', code: 'es', abbr: 'ES' },
  ukrainian: { name: 'Ukrainian', flag: '🇺🇦', code: 'uk', abbr: 'UK' }
} as const;

/**
 * LANGUAGES minus `norwegian` — the set of valid *flashcard* translation
 * languages. Norwegian is the language being learned, so it's only valid
 * as an *interface* language.
 */
export const FLASHCARD_LANGUAGES = Object.fromEntries(
  Object.entries(LANGUAGES).filter(([key]) => key !== 'norwegian')
) as Omit<typeof LANGUAGES, 'norwegian'>;

/** Reverse lookup — given a paraglide locale code, find its LANGUAGES entry. */
export function languageEntryForLocale(code: string) {
  return Object.entries(LANGUAGES).find(([, v]) => v.code === code);
}

/**
 * Categories that require a Plus subscription.
 * Free users can see these in the picker but cannot open them.
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

/**
 * Top 3 categories per level available to free users in the Quiz.
 */
export const FREE_QUIZ_CATEGORIES = new Set<string>([
  'a1/greetings',
  'a1/numbers',
  'a1/colors',
  'a2/shopping',
  'a2/transport',
  'a2/clothing',
  'b1/travel',
  'b1/environment',
  'b1/media',
  'b2/politics',
  'b2/economics',
  'b2/social-issues',
  'c/philosophy',
  'c/academic',
  'c/formal-writing'
]);

/**
 * Grammar topics available to free users. Everything else requires Plus.
 */
export const FREE_GRAMMAR_TOPICS = new Set<import('$lib/types').GrammarTopic>([
  'ikke-placement',
  'v2-word-order',
  'det-er-ikke',
  'modal-verb-order'
]);

/**
 * How many grammar questions are free per topic (total, across all CEFR levels).
 */
export const FREE_GRAMMAR_PER_TOPIC = 3;
