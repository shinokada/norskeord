import type { PageLoad } from './$types';
import grammarData from '$lib/data/grammar.json';
import type { CEFRLevel, GrammarQuestion, GrammarTopic } from '$lib/types';
import { isFreeGrammarTopic, topicLevels } from '$lib/types';

export const ssr = false;

export const load: PageLoad = async () => {
  const questions = grammarData as GrammarQuestion[];

  // Group by topic, preserving first-seen order from grammar.json.
  const order: GrammarTopic[] = [];
  const totals: Partial<Record<GrammarTopic, number>> = {};
  const byTopic: Partial<Record<GrammarTopic, GrammarQuestion[]>> = {};

  for (const q of questions) {
    if (totals[q.topic] === undefined) {
      totals[q.topic] = 0;
      byTopic[q.topic] = [];
      order.push(q.topic);
    }
    totals[q.topic]! += 1;
    byTopic[q.topic]!.push(q);
  }

  const allTopics = order.map((topic) => ({
    topic,
    total: totals[topic] ?? 0,
    levels: topicLevels(byTopic[topic] ?? []) as CEFRLevel[],
    free: isFreeGrammarTopic(topic)
  }));

  return {
    freeTopics: allTopics.filter((t) => t.free),
    lockedTopics: allTopics.filter((t) => !t.free)
  };
};
