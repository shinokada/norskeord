import { describe, expect, it } from 'vitest';
import type { CardProgress } from '$lib/types';
import { buildGrammarProgress } from './progress';
import { dueByChapter, percent, visibleParts } from './progress-view';
import { GRAMMAR_TAXONOMY } from './taxonomy';

const NOW = new Date('2026-10-02T12:00:00Z');
const YESTERDAY = new Date('2026-10-01T12:00:00Z');
const TOMORROW = new Date('2026-10-03T12:00:00Z');

function card(due: Date): CardProgress {
  return {
    fsrs: {
      due: due.toISOString(),
      stability: 1,
      difficulty: 5,
      elapsed_days: 0,
      scheduled_days: 1,
      learning_steps: 0,
      reps: 1,
      lapses: 0,
      state: 2
    },
    seenCount: 1,
    lastSeen: YESTERDAY.toISOString(),
    level: 'A1',
    category: 'x'
  } as unknown as CardProgress;
}

// Real ids (resolved through grammar-id-index.json):
//   gq-perspron-001  personlige-pronomen   chapter 8  pronomen
//   gq-sporre-001    sporresetninger       chapter 2  helsetninger
//   gq-objekt-001    objekt                chapter 1  setningsledd

describe('dueByChapter', () => {
  it('is empty when nothing has been practised', () => {
    expect(dueByChapter(buildGrammarProgress({}, NOW))).toEqual([]);
  });

  it('lists chapters with due cards in book order, with their counts', () => {
    const progress = buildGrammarProgress(
      {
        'gq-perspron-001': card(YESTERDAY),
        'gq-sporre-001': card(YESTERDAY),
        'gq-objekt-001': card(TOMORROW) // seen but not due
      },
      NOW
    );
    expect(dueByChapter(progress).map((c) => [c.chapter.slug, c.due])).toEqual([
      ['helsetninger', 1],
      ['pronomen', 1]
    ]);
  });

  it('carries the part for each chapter', () => {
    const progress = buildGrammarProgress({ 'gq-perspron-001': card(YESTERDAY) }, NOW);
    const [entry] = dueByChapter(progress);
    expect(entry.part.no).toBe(2);
  });

  it('adds up to the overall due count', () => {
    const progress = buildGrammarProgress(
      { 'gq-perspron-001': card(YESTERDAY), 'gq-sporre-001': card(YESTERDAY) },
      NOW
    );
    const total = dueByChapter(progress).reduce((sum, c) => sum + c.due, 0);
    expect(total).toBe(progress.overall.due);
  });

  it('ignores ids that no longer exist', () => {
    const progress = buildGrammarProgress({ 'gq-does-not-exist': card(YESTERDAY) }, NOW);
    expect(dueByChapter(progress)).toEqual([]);
  });
});

describe('visibleParts', () => {
  const progress = buildGrammarProgress({}, NOW);
  const parts = visibleParts(progress);

  it('has no empty branch at any level', () => {
    expect(parts.length).toBeGreaterThan(0);
    for (const part of parts) {
      expect(part.chapters.length).toBeGreaterThan(0);
      for (const chapter of part.chapters) {
        expect(chapter.sections.length).toBeGreaterThan(0);
        for (const section of chapter.sections) {
          expect(section.topics.length).toBeGreaterThan(0);
          for (const topic of section.topics) expect(topic.total).toBeGreaterThan(0);
        }
      }
    }
  });

  it('hides chapters that have no topic yet and shows every chapter that has one', () => {
    const slugs = parts.flatMap((p) => p.chapters.map((c) => c.chapter.slug));
    expect(slugs).toContain('pronomen');

    // Derived from the taxonomy, so filling a chapter with its first topic (Content
    // track B) does not break this test.
    const chapters = GRAMMAR_TAXONOMY.flatMap((part) => part.chapters);
    for (const chapter of chapters) {
      const hasTopic = chapter.sections.some((s) => s.topics.length > 0);
      if (hasTopic) expect(slugs, chapter.slug).toContain(chapter.slug);
      else expect(slugs, chapter.slug).not.toContain(chapter.slug);
    }
  });

  it('keeps book order', () => {
    const numbers = parts.flatMap((p) => p.chapters.map((c) => c.chapter.no));
    expect(numbers).toEqual([...numbers].sort((a, b) => a - b));
  });

  it('does not change any count', () => {
    const total = parts.reduce((sum, p) => sum + p.total, 0);
    expect(total).toBe(progress.overall.total);
  });
});

describe('percent', () => {
  it('rounds to a whole percentage', () => {
    expect(percent(1, 3)).toBe(33);
    expect(percent(2, 3)).toBe(67);
    expect(percent(5, 10)).toBe(50);
  });

  it('is 0 when there is nothing to divide by or nothing done', () => {
    expect(percent(5, 0)).toBe(0);
    expect(percent(0, 10)).toBe(0);
    expect(percent(-1, 10)).toBe(0);
  });

  it('never goes above 100', () => {
    expect(percent(12, 10)).toBe(100);
    expect(percent(10, 10)).toBe(100);
  });
});
