// src/lib/grammar/progress-view.ts
// View-model helpers for /my-progress/grammar (ai-docs/implementation/
// grammar-update.md, Phase 7). They reshape the roll-up from progress.ts for
// display; the counting itself stays in progress.ts.
//
// Pure functions only, so everything is unit-testable.

import type { TaxonomyChapter, TaxonomyPart } from './taxonomy';
import type {
  ChapterProgress,
  GrammarProgress,
  PartProgress,
  SectionProgress,
  TopicProgress
} from './progress';

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

/** A topic row that may be a locked teaser (free users, nothing free in it). */
export interface TopicView extends TopicProgress {
  locked: boolean;
}
export interface SectionView extends Omit<SectionProgress, 'topics'> {
  topics: TopicView[];
}
export interface ChapterView extends Omit<ChapterProgress, 'sections'> {
  sections: SectionView[];
  /** Every topic in the chapter is locked. */
  locked: boolean;
}
export interface PartView extends Omit<PartProgress, 'chapters'> {
  chapters: ChapterView[];
  /** Every chapter in the part is locked. */
  locked: boolean;
}

/**
 * Like visibleParts, but keeps topics that have questions yet nothing the user can
 * practise, as locked rows with zeroed progress and their full question count.
 * `scoped` is the roll-up the user sees (free users: built with the free policy as scope);
 * `full` is the unscoped roll-up, used only for which topics exist and their full totals.
 * Section, chapter and part counts stay the scoped ones, so locked topics never count.
 * A topic is locked when its scoped total is 0. For Plus, pass the same roll-up twice:
 * nothing is locked. Both roll-ups come from the same taxonomy, so they line up by index.
 */
export function visiblePartsWithLocked(scoped: GrammarProgress, full: GrammarProgress): PartView[] {
  const parts: PartView[] = [];
  scoped.parts.forEach((sp, pi) => {
    const chapters: ChapterView[] = [];
    sp.chapters.forEach((sc, ci) => {
      const sections: SectionView[] = [];
      sc.sections.forEach((ss, si) => {
        const fullSection = full.parts[pi].chapters[ci].sections[si];
        const topics: TopicView[] = fullSection.topics
          .filter((ft) => ft.total > 0)
          .map((ft) => {
            const own = scoped.byTopic.get(ft.topic);
            if (own && own.total > 0) return { ...own, locked: false };
            return {
              ...ft,
              seen: 0,
              review: 0,
              learning: 0,
              relearning: 0,
              due: 0,
              lapses: 0,
              locked: true
            };
          });
        if (topics.length > 0) sections.push({ ...ss, topics });
      });
      if (sections.length > 0) {
        const locked = sections.every((s) => s.topics.every((t) => t.locked));
        chapters.push({ ...sc, sections, locked });
      }
    });
    if (chapters.length > 0) {
      parts.push({ ...sp, chapters, locked: chapters.every((c) => c.locked) });
    }
  });
  return parts;
}

/** `part` as a whole percentage of `whole`, clamped to 0..100; 0 when `whole` is 0. */
export function percent(part: number, whole: number): number {
  if (whole <= 0 || part <= 0) return 0;
  return Math.min(100, Math.round((part / whole) * 100));
}
