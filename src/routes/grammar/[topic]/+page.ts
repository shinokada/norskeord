import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import grammarTopicIndex from '$lib/data/grammar-topic-index.json';
import type { CEFRLevel, GrammarQuestion, GrammarTopic } from '$lib/types';
import { freeGrammarQuestionIds } from '$lib/access';
import { GRAMMAR_RULES } from '$lib/grammar/rules';
import { loadGrammarLevels } from '$lib/grammar/level-loader';

export const ssr = false;

type GrammarTopicIndexEntry = {
  levels: CEFRLevel[];
  countsByLevel: Partial<Record<CEFRLevel, number>>;
  total: number;
};

export const load: PageLoad = async ({ params }) => {
  const topic = params.topic as GrammarTopic;

  // Unknown topic → 404.
  if (!GRAMMAR_RULES[topic]) {
    throw error(404, 'Grammar topic not found');
  }

  // Look up which levels this topic spans via the topic index (derived
  // artifact — scripts/build-grammar-level-index.mjs), then dynamically
  // import only those level files (usually 1–2 of 5) instead of the full
  // grammar.json. See
  // draft/b2/pa-niva/implementation/grammar-lazy-load-per-level.md.
  const index = grammarTopicIndex as Record<GrammarTopic, GrammarTopicIndexEntry>;
  const entry = index[topic];
  const levels = entry?.levels ?? [];

  const levelQuestions = await loadGrammarLevels(levels);
  const questions = levelQuestions.filter((q): q is GrammarQuestion => q.topic === topic);
  const freeIds = freeGrammarQuestionIds(questions);

  // The Plus gate is enforced in +page.svelte using page.data.plan (same
  // reasoning as /quiz — plan isn't reliable in load for e2e). Here we just
  // pass the full topic question set plus which ids are free.
  return {
    topic,
    questions,
    freeQuestionIds: [...freeIds]
  };
};
