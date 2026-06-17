import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { CATEGORIES_BY_LEVEL } from '$lib/config';
import { isPlusCategory, isFreeGrammarTopic } from '$lib/access';
import { topicLevels } from '$lib/vocab-helpers';
import grammarData from '$lib/data/grammar.json';
import stats from '$lib/data/stats.json';
import type { CEFRLevel, GrammarQuestion, GrammarTopic } from '$lib/types';
import { parsePosts, type RawPostModule, cefrLevels } from '$lib/blog';

export const prerender = false;

const VALID_LEVELS = new Set(['a1', 'a2', 'b1', 'b2']);

const CEFR_LABELS: Record<string, string> = {
  a1: 'Beginner',
  a2: 'Elementary',
  b1: 'Intermediate',
  b2: 'Upper Intermediate'
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

  // Grammar topics that include this CEFR level
  const questions = grammarData as GrammarQuestion[];

  // Build a set of topics that appear at this level
  const topicsAtLevel = new Set<GrammarTopic>();
  for (const q of questions) {
    const levels = q.levels && q.levels.length ? q.levels : [q.cefr];
    if (levels.includes(levelUpper)) {
      topicsAtLevel.add(q.topic);
    }
  }

  // Group ALL questions by topic (not filtered by level) so the count matches
  // what the user will actually practice on /grammar/[topic]
  const allTopicMap = new Map<GrammarTopic, GrammarQuestion[]>();
  for (const q of questions) {
    if (topicsAtLevel.has(q.topic)) {
      if (!allTopicMap.has(q.topic)) allTopicMap.set(q.topic, []);
      allTopicMap.get(q.topic)!.push(q);
    }
  }

  const grammarTopics = Array.from(allTopicMap.entries()).map(([topic, qs]) => ({
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
    blogPosts
    // user and plan come from the root layout — do NOT re-export here
  };
};
