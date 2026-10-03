// src/lib/grammar/progress-view.ts
// View-model helpers for /my-progress/grammar (ai-docs/implementation/
// grammar-update.md, Phase 7). They reshape the roll-up from progress.ts for
// display; the counting itself stays in progress.ts.
//
// Pure functions only, so everything is unit-testable.

import type { TaxonomyChapter, TaxonomyPart } from './taxonomy';
import type { ChapterProgress, GrammarProgress, PartProgress, SectionProgress } from './progress';

export interface ChapterDue {
  part: TaxonomyPart;
  chapter: TaxonomyChapter;
  due: number;
}

/**
 * Chapters that have cards due, in book order, each with its due count. Drives
 * the «Due by chapter» links (`/review/grammar?chapter=<slug>`).
 */
export function dueByChapter(progress: GrammarProgress): ChapterDue[] {
  const out: ChapterDue[] = [];
  for (const part of progress.parts) {
    for (const chapter of part.chapters) {
      if (chapter.due > 0)
        out.push({ part: part.part, chapter: chapter.chapter, due: chapter.due });
    }
  }
  return out;
}

/**
 * The roll-up without empty branches: topics with no questions, sections with
 * no topic, chapters with no section and parts with no chapter are dropped
 * (decision #18, as on /grammar). Counts are untouched, since an empty branch
 * adds nothing to them.
 */
export function visibleParts(progress: GrammarProgress): PartProgress[] {
  const parts: PartProgress[] = [];
  for (const part of progress.parts) {
    const chapters: ChapterProgress[] = [];
    for (const chapter of part.chapters) {
      const sections: SectionProgress[] = [];
      for (const section of chapter.sections) {
        const topics = section.topics.filter((t) => t.total > 0);
        if (topics.length > 0) sections.push({ ...section, topics });
      }
      if (sections.length > 0) chapters.push({ ...chapter, sections });
    }
    if (chapters.length > 0) parts.push({ ...part, chapters });
  }
  return parts;
}

/** `part` as a whole percentage of `whole`, clamped to 0..100; 0 when `whole` is 0. */
export function percent(part: number, whole: number): number {
  if (whole <= 0 || part <= 0) return 0;
  return Math.min(100, Math.round((part / whole) * 100));
}
