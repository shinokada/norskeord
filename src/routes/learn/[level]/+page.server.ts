import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { CATEGORIES_BY_LEVEL } from '$lib/config';
import { isPlusCategory, isFreeGrammarTopic } from '$lib/access';
import { topicLevels } from '$lib/vocab-helpers';
import { uttrykkCCategoryCounts } from '$lib/uttrykk-c-stats';
import { grammarLevelLoaders } from '$lib/grammar/level-loader';
import stats from '$lib/data/stats.json';
import type { CEFRLevel, GrammarQuestion, GrammarTopic, VocabEntry } from '$lib/types';
import { parsePosts, type RawPostModule, cefrLevels } from '$lib/blog';

export const prerender = false;

const VALID_LEVELS = new Set(['a1', 'a2', 'b1', 'b2', 'c']);

const CEFR_LABELS: Record<string, string> = {
  a1: 'Beginner',
  a2: 'Elementary',
  b1: 'Intermediate',
  b2: 'Upper Intermediate',
  c: 'Mastery'
};

// Phase 3b (ai-docs/implementation/uttrykk-category.md): per-theme breakdown
// for the Uttrykk hub card. A1–B2 only — C has no `theme` field (its
// uttrykk-c.json entries carry a real category slug instead and are merged
// into the Vocabulary section's own category pages, per Phase 4).
const uttrykkThemeLoaders: Partial<Record<CEFRLevel, () => Promise<{ default: VocabEntry[] }>>> = {
  A1: () => import('$lib/data/uttrykk-a1.json') as unknown as Promise<{ default: VocabEntry[] }>,
  A2: () => import('$lib/data/uttrykk-a2.json') as unknown as Promise<{ default: VocabEntry[] }>,
  B1: () => import('$lib/data/uttrykk-b1.json') as unknown as Promise<{ default: VocabEntry[] }>,
  B2: () => import('$lib/data/uttrykk-b2.json') as unknown as Promise<{ default: VocabEntry[] }>
};

export const load: PageServerLoad = async ({ params }) => {
  const level = params.level.toLowerCase();

  // Redirect old c1/c2 URLs to the combined /learn/c hub
  if (level === 'c1' || level === 'c2') {
    redirect(301, '/learn/c');
  }

  if (!VALID_LEVELS.has(level)) {
    throw error(404, `Unknown level: ${params.level}`);
  }

  const levelUpper = level.toUpperCase() as CEFRLevel;
  const categories = (CATEGORIES_BY_LEVEL[levelUpper] as readonly string[]).map((cat) => ({
    slug: cat,
    locked: isPlusCategory(levelUpper, cat)
  }));

  // Grammar topics that include this CEFR level — load only this level's
  // split file (src/lib/data/grammar-{level}.json), a derived artifact of
  // grammar.json built by scripts/build-grammar-level-index.mjs. See
  // draft/b2/pa-niva/implementation/grammar-lazy-load-per-level.md.
  const levelQuestions = (await grammarLevelLoaders[levelUpper]()).default;

  // Group this level's own questions by topic, so each card's badge/count
  // reflects only what's actually playable from this hub (see
  // ai-docs/implementation/grammar-ux-update.md Step 4). This used to
  // group every level's questions for a topic appearing here — e.g. a topic
  // spanning A2/B1/B2 showed all three badges even on the B2 hub, and its
  // count included A2/B1 questions the B2 link would never actually play
  // (fixed in Step 1: /grammar/[topic] now scopes to ?level= for everyone).
  // Every entry in levelQuestions is already this level (the split file is
  // pre-filtered), so no per-question cefr check is needed here anymore.
  const allTopicMap = new Map<GrammarTopic, GrammarQuestion[]>();
  for (const q of levelQuestions) {
    if (!allTopicMap.has(q.topic)) allTopicMap.set(q.topic, []);
    allTopicMap.get(q.topic)!.push(q);
  }

  // Level-scoped, not "free at any level" — a topic free only at A1 (e.g.
  // noun-plurals) must show as locked on the B1 hub even though it's a
  // "free" topic overall. Using the any-level check here previously let a
  // free user click through from e.g. /learn/b1 straight to a topic's B1
  // content page and silently see its (unrelated) free A1 questions instead
  // of a paywall. See ai-docs/implementation/grammar-fix.md §6.
  const grammarTopics = Array.from(allTopicMap.entries()).map(([topic, qs]) => ({
    topic,
    total: qs.length,
    levels: topicLevels(qs) as CEFRLevel[],
    free: isFreeGrammarTopic(topic, levelUpper)
  }));

  // Level stats
  type LevelStats = { vocab: number; uttrykk: number; total: number };
  const levelStats = (stats.byLevel as Record<string, LevelStats>)[levelUpper] ?? null;

  // Blog posts for this level (max 3, newest first)
  const modules = import.meta.glob('/src/lib/posts/*.md', { eager: true }) as Record<
    string,
    RawPostModule
  >;
  const allPosts = parsePosts(modules);
  const blogPosts = allPosts.filter((p) => cefrLevels(p.cefr).includes(levelUpper)).slice(0, 3);

  // Phase 3b: group this level's uttrykk deck by theme for the hub card.
  // Phase 8 (ai-docs/implementation/uttrykk-category.md): for C, there's no
  // `theme` field to group by, so its real category slugs (from
  // uttrykk-c.json, via uttrykk-c-stats.ts — the same source stats/+page.svelte
  // uses) serve as the theme-equivalent instead.
  const uttrykkThemeLoader = uttrykkThemeLoaders[levelUpper];
  let uttrykkThemes: { theme: string; count: number }[] = [];
  if (uttrykkThemeLoader) {
    const uttrykkData = await uttrykkThemeLoader();
    const counts = new Map<string, number>();
    for (const e of uttrykkData.default) {
      if (e.theme) counts.set(e.theme, (counts.get(e.theme) ?? 0) + 1);
    }
    uttrykkThemes = [...counts.entries()]
      .map(([theme, count]) => ({ theme, count }))
      .sort((a, b) => b.count - a.count);
  } else if (levelUpper === 'C') {
    uttrykkThemes = [...uttrykkCCategoryCounts().entries()]
      .map(([theme, count]) => ({ theme, count }))
      .sort((a, b) => b.count - a.count);
  }

  return {
    level,
    levelUpper,
    cefrLabel: CEFR_LABELS[level],
    categories,
    grammarTopics,
    levelStats,
    blogPosts,
    uttrykkThemes
    // user and plan come from the root layout — do NOT re-export here
  };
};
