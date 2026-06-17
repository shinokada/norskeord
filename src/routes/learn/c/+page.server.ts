import type { PageServerLoad } from './$types';
import { CATEGORIES_BY_LEVEL } from '$lib/config';
import { isPlusCategory, isFreeGrammarTopic } from '$lib/access';
import { topicLevels } from '$lib/vocab-helpers';
import grammarData from '$lib/data/grammar.json';
import stats from '$lib/data/stats.json';
import type { CEFRLevel, GrammarQuestion, GrammarTopic } from '$lib/types';
import { parsePosts, type RawPostModule, cefrLevels } from '$lib/blog';

export const prerender = false;

export const load: PageServerLoad = async () => {
  const level = 'c';
  const levelUpper = 'C' as CEFRLevel;

  const categories = (CATEGORIES_BY_LEVEL[levelUpper] as readonly string[]).map((cat) => ({
    slug: cat,
    locked: isPlusCategory(levelUpper, cat)
  }));

  // Grammar topics that include C level
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

  // Blog posts for C level (max 3, newest first)
  const modules = import.meta.glob('/src/lib/posts/*.md', { eager: true }) as Record<
    string,
    RawPostModule
  >;
  const allPosts = parsePosts(modules);
  const blogPosts = allPosts.filter((p) => cefrLevels(p.cefr).includes(levelUpper)).slice(0, 3);

  return {
    level,
    levelUpper,
    cefrLabel: 'Mastery',
    categories,
    grammarTopics,
    levelStats,
    blogPosts
    // user and plan come from the root layout — do NOT re-export here
  };
};
