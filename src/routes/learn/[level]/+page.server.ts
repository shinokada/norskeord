import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { CATEGORIES_BY_LEVEL, isPlusCategory, isFreeGrammarTopic, topicLevels } from '$lib/types';
import grammarData from '$lib/data/grammar.json';
import stats from '$lib/data/stats.json';
import type { CEFRLevel, GrammarQuestion, GrammarTopic } from '$lib/types';
import { parsePosts, type RawPostModule, cefrLevels } from '$lib/blog';

export const prerender = false;

const VALID_LEVELS = new Set(['a1', 'a2', 'b1', 'b2', 'c1', 'c2']);

const CEFR_LABELS: Record<string, string> = {
  a1: 'Beginner',
  a2: 'Elementary',
  b1: 'Intermediate',
  b2: 'Upper Intermediate',
  c1: 'Advanced',
  c2: 'Mastery'
};

export const load: PageServerLoad = async ({ params, locals }) => {
  const level = params.level.toLowerCase();

  if (!VALID_LEVELS.has(level)) {
    throw error(404, `Unknown level: ${params.level}`);
  }

  const levelUpper = level.toUpperCase() as CEFRLevel;
  const categories = (CATEGORIES_BY_LEVEL[levelUpper] as readonly string[]).map((cat) => ({
    slug: cat,
    locked: isPlusCategory(levelUpper, cat)
  }));

  // Grammar topics that include this CEFR level
  const questions = grammarData as GrammarQuestion[];
  const topicMap = new Map<GrammarTopic, GrammarQuestion[]>();
  for (const q of questions) {
    const levels = q.levels && q.levels.length ? q.levels : [q.cefr];
    if (levels.includes(levelUpper)) {
      if (!topicMap.has(q.topic)) topicMap.set(q.topic, []);
      topicMap.get(q.topic)!.push(q);
    }
  }

  const grammarTopics = Array.from(topicMap.entries()).map(([topic, qs]) => ({
    topic,
    total: qs.length,
    levels: topicLevels(qs) as CEFRLevel[],
    free: isFreeGrammarTopic(topic)
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

  return {
    level,
    levelUpper,
    cefrLabel: CEFR_LABELS[level],
    categories,
    grammarTopics,
    levelStats,
    blogPosts,
    user: locals.user,
    plan: locals.plan
  };
};
