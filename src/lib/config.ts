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
    'prepositions',
    'housing',
    'uttrykk'
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
    'home',
    'animals',
    'uttrykk'
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
    'animals',
    'uttrykk'
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
    'uttrykk'
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
    'existential-abstract',
    'nature-landscape',
    'sensory-sound',
    'physical-appearance',
    'everyday-objects',
    'character-temperament',
    'embodied-emotion',
    'manner-of-motion',
    'interpersonal-conflict',
    'intensifiers-degree',
    'gastronomy',
    'cultural-heritage'
  ]
} as const satisfies Record<CEFRLevel, readonly string[]>;

/**
 * Uttrykk theme taxonomy — see ai-docs/implementation/uttrykk-category.md,
 * Phase 1. This is the decided taxonomy for the `theme` field that Phase 2's
 * tagging pass writes into `uttrykk-{a1,a2,b1,b2}.json` entries. It never
 * touches `category` (which stays `"uttrykk"` for every entry — see the
 * Phase 1 "why not reuse `category`/`part`" rationale in the doc).
 *
 * C is intentionally excluded: Phase 4 folds C's uttrykk entries directly
 * into `vocab-c.json` using C's existing category slugs instead of a
 * separate `theme` field.
 */
export type UttrykkThemeLevel = Exclude<CEFRLevel, 'C'>;

export const UTTRYKK_THEME_LEVELS: readonly UttrykkThemeLevel[] = ['A1', 'A2', 'B1', 'B2'];

/**
 * Fixed fallback themes for uttrykk entries that don't genuinely fit a
 * topical category at their level — expected to cover the bulk of entries,
 * since fixed formulas/connectives/idioms with no topical subject matter are
 * what uttrykk is designed to capture. `discourse-markers` is already
 * precedented by B2's `CATEGORIES_BY_LEVEL` entry.
 */
export const UTTRYKK_FUNCTIONAL_THEMES = [
  'idioms',
  'proverbs',
  'discourse-markers',
  'time-expressions',
  'opinion-formulas',
  'necessity-formulas',
  'fixed-prepositional-phrases'
] as const;

/** Catch-all for entries that don't cleanly fit a topical or functional theme. */
export const UTTRYKK_CATCHALL_THEME = 'general' as const;

/**
 * Per-level set of allowed `theme` values: that level's real vocab category
 * slugs (minus `uttrykk` itself, which is a `category` value, not a theme)
 * plus the fixed functional themes plus the catch-all.
 * `Set` dedupes cases like B2, where `discourse-markers` is both a topical
 * category and a functional theme.
 *
 * Tagging precedence (Phase 1): topical fit from this level's own list
 * first, functional theme second, `general` only as a last resort.
 */
export const UTTRYKK_THEMES_BY_LEVEL: Record<UttrykkThemeLevel, readonly string[]> =
  UTTRYKK_THEME_LEVELS.reduce(
    (acc, level) => {
      // 'uttrykk-preview' is retired (ai-docs/implementation/uttrykk-gate.md
      // Phase 3) and no longer a real CATEGORIES_BY_LEVEL member, so only
      // 'uttrykk' itself needs excluding here.
      const topical = CATEGORIES_BY_LEVEL[level].filter((c) => c !== 'uttrykk');
      acc[level] = [...new Set([...topical, ...UTTRYKK_FUNCTIONAL_THEMES, UTTRYKK_CATCHALL_THEME])];
      return acc;
    },
    {} as Record<UttrykkThemeLevel, readonly string[]>
  );

export const LANGUAGES = {
  norwegian: { name: 'Norwegian', flag: '🇳🇴', code: 'nb', abbr: 'NO' },
  english: { name: 'English', flag: '🇬🇧', code: 'en', abbr: 'EN' },
  spanish: { name: 'Spanish', flag: '🇪🇸', code: 'es', abbr: 'ES' },
  ukrainian: { name: 'Ukrainian', flag: '🇺🇦', code: 'uk', abbr: 'UK' },
  german: { name: 'German', flag: '🇩🇪', code: 'de', abbr: 'DE' }
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
  'b1/animals',
  // B2 — plus-only (28 vocab; uttrykk gated per-theme, see below)
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
  // Full uttrykk decks are gated per-theme, not per-category — see
  // src/lib/uttrykk-gating.ts / ai-docs/implementation/uttrykk-gate.md.
  // Free users can study FREE_UTTRYKK_THEMES in full; everything else
  // requires Plus, enforced in [level]/[category]/+page.server.ts rather
  // than here.
  // C — first 5 free; rest plus-only.
  // Generated from CATEGORIES_BY_LEVEL.C (instead of hand-listed) so newly
  // added C categories are automatically gated instead of silently leaking
  // through as free — see the manner-of-motion gating bug.
  ...CATEGORIES_BY_LEVEL.C.slice(5).map((cat) => `c/${cat}`)
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
 * Grammar topics available to free users, keyed by which CEFR level(s) of the
 * topic are free. A topic is either:
 *   - `'all'` — free at every level it has questions at, or
 *   - an explicit array of levels — free only at the listed levels; any other
 *     level the topic also has content at stays Plus-gated.
 *
 * This exists because a topic (e.g. `modal-verb-order`) can span multiple
 * CEFR levels (A1, A2, B1), and the old `Set<GrammarTopic>` gate couldn't
 * express "free at A1, Plus at A2/B1".
 *
 * **Current policy (see ai-docs/gating-rules.md): A1-only.** Free access is
 * scoped to `['A1']` for every topic that has A1 content — including topics
 * that also span A2/B1/B2/C, where only the A1 slice is free and the rest
 * stays Plus-gated. A1 is the onboarding tier, so its content stays free
 * even for multi-level topics. Topics with no A1 content at all (e.g. the
 * former "teaser" topics `ikke-placement`, `v2-word-order`, `det-er-ikke`,
 * which only ever had A2/B1 questions) are intentionally absent from this
 * map — anything not listed here requires Plus at every level.
 *
 * `isFreeGrammarTopic(topic, cefr?)` in `access.ts` reads this map. See that
 * file's docstring for how the picker (`/grammar`) and the topic detail page
 * (`/grammar/[topic]`) use it differently — the picker's free/locked badge
 * must be level-aware when a CEFR filter is active, or a topic free only at
 * A1 will still show as "free" while filtered to B1.
 */
export const FREE_GRAMMAR_TOPICS: Partial<
  Record<import('$lib/types').GrammarTopic, readonly import('$lib/types').CEFRLevel[] | 'all'>
> = {
  'modal-verb-order': ['A1'],
  // Nivå A1 topics (free) — see ai-docs/implementation/a1-quiz-and-grammar.md Phase 4.
  // 19 new topics:
  'personlige-pronomen': ['A1'],
  'presens-verb': ['A1'],
  'pronomen-objektsform': ['A1'],
  'og-men': ['A1'],
  'adverb-sted-hjem': ['A1'],
  'refleksive-uttrykk': ['A1'],
  'infinitiv-a1': ['A1'],
  'substantiv-bestemt-form': ['A1'],
  'pronomen-den-det-de': ['A1'],
  'denne-dette-disse': ['A1'],
  imperativ: ['A1'],
  'possessiver-min-din': ['A1'],
  'refleksivt-possessiv-sin': ['A1'],
  'ja-jo': ['A1'],
  'preteritum-a1': ['A1'],
  'for-a-fordi': ['A1'],
  'vaer-det-subjekt': ['A1'],
  'indirekte-tale-at-om': ['A1'],
  'synes-tror': ['A1'],
  // 6 reused topics (modal-verb-order already listed above) — added so the
  // new A1 entries in these topics are actually reachable via the /grammar
  // picker for free users (without this, the picker links straight to
  // /plus and free users never see the topic page at all). Their A2/B1
  // content stays Plus-gated under the A1-only policy above.
  'noun-articles': ['A1'],
  'noun-plurals': ['A1'],
  'adj-agreement': ['A1'],
  'noun-possessives': ['A1'],
  'preposisjoner-tid': ['A1'],
  helsetninger: ['A1'],
  // Nivå A1 topics, pt. 2 — see ai-docs/implementation/a1-update.md Phase 4.
  'klokka-tid': ['A1'],
  'preposisjoner-sted': ['A1'],
  'ordenstall-dato': ['A1'],
  'for-siden': ['A1'],
  // A2/B1 teaser topics — see ai-docs/implementation/grammar-fix.md
  // "Policy decision" and ai-docs/gating-rules.md. Two topics per level,
  // chosen for zero plusOnly questions at that level (so the whole level's
  // content is actually playable) and no overlap with an already-free level
  // of the same topic (so each is a genuinely new free topic, not just an
  // extension of one that's already free at A1). B2/C intentionally have no
  // entries here — every B2/C question is individually plusOnly regardless
  // of this map, so adding entries for them would be a no-op; see
  // gating-rules.md.
  'ikke-placement': ['A2'],
  'adj-comparison': ['A2'],
  'ordfamilie-avledning': ['B1'],
  'bade-og-verken-eller': ['B1']
};
