// src/lib/admin/topicGroups.ts
// Grammar topics grouped by chapter, for the <optgroup>s in the admin topic
// selects. Built from the taxonomy, so a new topic lands in the right group
// without any list to maintain. Chapters with no topic yet are skipped, so the
// dropdown never shows an empty group.
//
// Pure function (no I/O), so it is unit-testable.

import type { GrammarTopic } from '$lib/types';
import { GRAMMAR_TAXONOMY } from '$lib/grammar/taxonomy';

export interface TopicGroup {
  /** Chapter number, e.g. 7. */
  no: number;
  /** Plain-text <optgroup> label, e.g. "7 · Substantiv". */
  label: string;
  /** The chapter's primary topics, in book order. */
  topics: GrammarTopic[];
}

export function topicGroups(): TopicGroup[] {
  return GRAMMAR_TAXONOMY.flatMap((part) =>
    part.chapters
      .map((chapter) => ({
        no: chapter.no,
        label: `${chapter.no} · ${chapter.titleNb}`,
        topics: chapter.sections.flatMap((s) => s.topics)
      }))
      .filter((group) => group.topics.length > 0)
  );
}
