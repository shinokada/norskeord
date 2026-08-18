import type { PageLoad } from './$types';
import grammarData from '$lib/data/grammar.json';
import type { CEFRLevel, GrammarQuestion, GrammarTopic } from '$lib/types';
import { groupTopicLevelsByAccess } from '$lib/access';
import { topicLevels } from '$lib/vocab-helpers';

export const ssr = false;

export const load: PageLoad = async () => {
  const questions = grammarData as GrammarQuestion[];

  // Group by topic, preserving first-seen order from grammar.json.
  const order: GrammarTopic[] = [];
  const byTopic: Partial<Record<GrammarTopic, GrammarQuestion[]>> = {};

  for (const q of questions) {
    if (byTopic[q.topic] === undefined) {
      byTopic[q.topic] = [];
      order.push(q.topic);
    }
    byTopic[q.topic]!.push(q);
  }

  // One entry per access *segment*, not per topic — a topic whose access
  // status changes across its levels (e.g. free at A1, Plus at A2/B1)
  // produces multiple segments, each with a fixed access state that never
  // needs to be recomputed against the active CEFR filter. See
  // ai-docs/implementation/grammar-fix.md and access.ts's
  // groupTopicLevelsByAccess docstring.
  const segments = order.flatMap((topic) => {
    const levels = topicLevels(byTopic[topic] ?? []) as CEFRLevel[];
    const topicSegments = groupTopicLevelsByAccess(topic, levels);
    return topicSegments.map((seg) => {
      const segQuestions = (byTopic[topic] ?? []).filter((q) => seg.levels.includes(q.cefr));
      // Per-level breakdown so the picker can show a count scoped to the
      // active CEFR filter (matching /learn/[level], which only ever counts
      // q.cefr === that level) instead of always summing every level in the
      // segment — a segment can span multiple levels (e.g. B1+B2 sharing the
      // same locked access) even though only one is selected.
      const countsByLevel: Partial<Record<CEFRLevel, number>> = {};
      for (const l of seg.levels) {
        countsByLevel[l] = segQuestions.filter((q) => q.cefr === l).length;
      }
      return {
        topic,
        access: seg.access,
        levels: seg.levels,
        total: segQuestions.length,
        countsByLevel
      };
    });
  });

  return {
    segments
  };
};
