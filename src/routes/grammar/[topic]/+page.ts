import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import grammarData from '$lib/data/grammar.json';
import type { GrammarQuestion, GrammarTopic } from '$lib/types';
import { freeGrammarQuestionIds } from '$lib/access';
import { GRAMMAR_RULES } from '$lib/grammar/rules';

export const ssr = false;

export const load: PageLoad = async ({ params }) => {
  const topic = params.topic as GrammarTopic;

  // Unknown topic → 404.
  if (!GRAMMAR_RULES[topic]) {
    throw error(404, 'Grammar topic not found');
  }

  const all = grammarData as GrammarQuestion[];
  const freeIds = freeGrammarQuestionIds(all);
  const questions = all.filter((q) => q.topic === topic);

  // The Plus gate is enforced in +page.svelte using page.data.plan (same
  // reasoning as /quiz — plan isn't reliable in load for e2e). Here we just
  // pass the full topic question set plus which ids are free.
  return {
    topic,
    questions,
    freeQuestionIds: [...freeIds]
  };
};
