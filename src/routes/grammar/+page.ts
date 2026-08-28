import type { PageLoad } from './$types';
import grammarTopicIndex from '$lib/data/grammar-topic-index.json';
import type { CEFRLevel, GrammarTopic } from '$lib/types';
import { groupTopicLevelsByAccess } from '$lib/access';

export const ssr = false;

type GrammarTopicIndexEntry = {
  levels: CEFRLevel[];
  countsByLevel: Partial<Record<CEFRLevel, number>>;
  total: number;
};

export const load: PageLoad = async () => {
  // Sourced from grammar-topic-index.json, a derived artifact built by
  // scripts/build-grammar-level-index.mjs from grammar.json — this route
  // only ever needs per-topic levels/counts, never full question objects,
  // so no grammar question data is loaded here at all. See
  // draft/b2/pa-niva/implementation/grammar-lazy-load-per-level.md.
  const index = grammarTopicIndex as Record<GrammarTopic, GrammarTopicIndexEntry>;
  const order = Object.keys(index) as GrammarTopic[];

  // One entry per access *segment*, not per topic — a topic whose access
  // status changes across its levels (e.g. free at A1, Plus at A2/B1)
  // produces multiple segments, each with a fixed access state that never
  // needs to be recomputed against the active CEFR filter. See
  // ai-docs/implementation/grammar-fix.md and access.ts's
  // groupTopicLevelsByAccess docstring.
  const segments = order.flatMap((topic) => {
    const entry = index[topic];
    const topicSegments = groupTopicLevelsByAccess(topic, entry.levels);
    return topicSegments.map((seg) => {
      // Per-level breakdown so the picker can show a count scoped to the
      // active CEFR filter (matching /learn/[level], which only ever counts
      // q.cefr === that level) instead of always summing every level in the
      // segment — a segment can span multiple levels (e.g. B1+B2 sharing the
      // same locked access) even though only one is selected.
      const countsByLevel: Partial<Record<CEFRLevel, number>> = {};
      let total = 0;
      for (const l of seg.levels) {
        const count = entry.countsByLevel[l] ?? 0;
        countsByLevel[l] = count;
        total += count;
      }
      return {
        topic,
        access: seg.access,
        levels: seg.levels,
        total,
        countsByLevel
      };
    });
  });

  return {
    segments
  };
};
