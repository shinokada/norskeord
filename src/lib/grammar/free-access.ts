// src/lib/grammar/free-access.ts
// What a free user can practise in grammar, in numbers
// (ai-docs/implementation/free-tier-simplification.md, Phase 6).
//
// Everything here is derived from the policy (`isFreeGrammarTopic`, which reads
// FREE_GRAMMAR_TOPICS in config.ts) and the question counts in the topic index. Nothing
// restates the policy, so freeing another level later changes every total and row with one
// edit in config.ts. free-access.test.ts checks these numbers against the real questions.

import type { CEFRLevel, GrammarTopic } from '$lib/types';
import { isFreeGrammarTopic } from '$lib/access';
import grammarTopicIndex from '$lib/data/grammar-topic-index.json';

type TopicIndexEntry = {
  countsByLevel: Partial<Record<CEFRLevel, number>>;
  total: number;
};
const TOPIC_INDEX = grammarTopicIndex as Record<string, TopicIndexEntry>;

/** Number of questions in a topic that a free user can practise, across all levels. */
export function freeGrammarTotal(topic: GrammarTopic): number {
  const entry = TOPIC_INDEX[topic];
  if (!entry) return 0;
  return (Object.entries(entry.countsByLevel) as [CEFRLevel, number][]).reduce(
    (sum, [level, count]) => (isFreeGrammarTopic(topic, level) ? sum + count : sum),
    0
  );
}
