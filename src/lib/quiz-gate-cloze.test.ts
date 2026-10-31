// ai-docs/implementation/cloze-quiz.md, Phase 2: the plan gate for the Sentences mode.
// Runs against the real vocab, uttrykk and cloze sidecar files. Expectations come from
// the access policy and the generated counts, not from selectClozeEntries itself.

import { describe, it, expect } from 'vitest';
import vocabA1 from '$lib/data/vocab-a1.json';
import vocabA2 from '$lib/data/vocab-a2.json';
import vocabB1 from '$lib/data/vocab-b1.json';
import vocabB2 from '$lib/data/vocab-b2.json';
import vocabC from '$lib/data/vocab-c.json';
import uttrykkA1 from '$lib/data/uttrykk-a1.json';
import uttrykkA2 from '$lib/data/uttrykk-a2.json';
import uttrykkB1 from '$lib/data/uttrykk-b1.json';
import uttrykkB2 from '$lib/data/uttrykk-b2.json';
import uttrykkC from '$lib/data/uttrykk-c.json';
import clozeVocabA1 from '$lib/data/cloze-vocab-a1.json';
import clozeVocabA2 from '$lib/data/cloze-vocab-a2.json';
import clozeVocabB1 from '$lib/data/cloze-vocab-b1.json';
import clozeVocabB2 from '$lib/data/cloze-vocab-b2.json';
import clozeVocabC from '$lib/data/cloze-vocab-c.json';
import clozeUttrykkA1 from '$lib/data/cloze-uttrykk-a1.json';
import clozeUttrykkA2 from '$lib/data/cloze-uttrykk-a2.json';
import clozeUttrykkB1 from '$lib/data/cloze-uttrykk-b1.json';
import clozeUttrykkB2 from '$lib/data/cloze-uttrykk-b2.json';
import clozeUttrykkC from '$lib/data/cloze-uttrykk-c.json';
import clozeCountsJson from '$lib/data/cloze-counts.json';
import { isFreeQuizCategory, isPlusOnlyEntry } from '$lib/access';
import type { CEFRLevel, VocabEntry } from '$lib/types';
import {
  quizPoolSize,
  selectClozeEntries,
  type ClozeItemData,
  type ClozeSource,
  type QuizCategoryCount,
  type QuizEntryType,
  type QuizSource
} from './quiz-gate';

const asEntries = (x: unknown) => x as VocabEntry[];
const asItems = (x: unknown) => x as Record<string, ClozeItemData>;

const LEVELS: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C'];

const VOCAB: Record<CEFRLevel, VocabEntry[]> = {
  A1: asEntries(vocabA1),
  A2: asEntries(vocabA2),
  B1: asEntries(vocabB1),
  B2: asEntries(vocabB2),
  C: asEntries(vocabC)
};
const UTTRYKK: Record<CEFRLevel, VocabEntry[]> = {
  A1: asEntries(uttrykkA1),
  A2: asEntries(uttrykkA2),
  B1: asEntries(uttrykkB1),
  B2: asEntries(uttrykkB2),
  C: asEntries(uttrykkC)
};
const CLOZE_VOCAB: Record<CEFRLevel, Record<string, ClozeItemData>> = {
  A1: asItems(clozeVocabA1),
  A2: asItems(clozeVocabA2),
  B1: asItems(clozeVocabB1),
  B2: asItems(clozeVocabB2),
  C: asItems(clozeVocabC)
};
const CLOZE_UTTRYKK: Record<CEFRLevel, Record<string, ClozeItemData>> = {
  A1: asItems(clozeUttrykkA1),
  A2: asItems(clozeUttrykkA2),
  B1: asItems(clozeUttrykkB1),
  B2: asItems(clozeUttrykkB2),
  C: asItems(clozeUttrykkC)
};

const COUNTS = clozeCountsJson as unknown as QuizCategoryCount[];

const SOURCES: QuizSource[] = LEVELS.flatMap((level) => [
  { level, type: 'vocab' as const, entries: VOCAB[level] },
  { level, type: 'uttrykk' as const, entries: UTTRYKK[level] }
]);
const CLOZE_SOURCES: ClozeSource[] = LEVELS.flatMap((level) => [
  { level, type: 'vocab' as const, items: CLOZE_VOCAB[level] },
  { level, type: 'uttrykk' as const, items: CLOZE_UTTRYKK[level] }
]);

const UTTRYKK_IDS = new Set(LEVELS.flatMap((l) => UTTRYKK[l].map((e) => e.id)));
const typeOf = (e: VocabEntry): QuizEntryType => (UTTRYKK_IDS.has(e.id) ? 'uttrykk' : 'vocab');

/** The policy, written independently of quiz-gate.ts. */
const allowedForFree = (e: VocabEntry) =>
  isFreeQuizCategory(e.level, e.category) && !isPlusOnlyEntry(e.level, e.category, typeOf(e));

function categoriesOf(level: CEFRLevel): (string | undefined)[] {
  return [undefined, ...new Set(COUNTS.filter((c) => c.level === level).map((c) => c.category))];
}

describe('selectClozeEntries: real data', () => {
  it('the fixtures are real data', () => {
    expect(COUNTS.length).toBeGreaterThan(20);
    for (const level of LEVELS) {
      expect(Object.keys(CLOZE_VOCAB[level]).length, level).toBeGreaterThan(0);
    }
  });

  it('quizPoolSize over cloze-counts.json equals the payload size for every level, category and plan', () => {
    const mismatches: string[] = [];
    for (const level of LEVELS) {
      for (const category of categoriesOf(level)) {
        for (const isPlus of [false, true]) {
          const size = quizPoolSize(COUNTS, level, category ?? '', isPlus);
          const real = selectClozeEntries(SOURCES, CLOZE_SOURCES, level, category, isPlus).entries
            .length;
          if (size !== real) {
            mismatches.push(
              `${level}|${category ?? '-'}|${isPlus ? 'plus' : 'free'}: ${size} vs ${real}`
            );
          }
        }
      }
    }
    expect(mismatches).toEqual([]);
  });

  it('returns exactly one item per entry, and the item rebuilds the example', () => {
    for (const level of LEVELS) {
      for (const isPlus of [false, true]) {
        const { entries, cloze } = selectClozeEntries(
          SOURCES,
          CLOZE_SOURCES,
          level,
          undefined,
          isPlus
        );
        expect(Object.keys(cloze).sort(), `${level} ${isPlus}`).toEqual(
          entries.map((e) => e.id).sort()
        );
        for (const e of entries) {
          const item = cloze[e.id];
          expect(item.before + item.answer + item.after, e.id).toBe(e.example);
        }
      }
    }
  });

  it('never gives a free caller a locked entry or item', () => {
    const leaks: string[] = [];
    for (const level of LEVELS) {
      for (const category of categoriesOf(level)) {
        const { entries, cloze } = selectClozeEntries(
          SOURCES,
          CLOZE_SOURCES,
          level,
          category,
          false
        );
        for (const e of entries) {
          if (!allowedForFree(e)) leaks.push(`${level}|${category ?? '-'}|${e.id}`);
        }
        const ids = new Set(entries.map((e) => e.id));
        for (const id of Object.keys(cloze)) {
          if (!ids.has(id)) leaks.push(`item without entry: ${id}`);
        }
      }
    }
    expect(leaks).toEqual([]);
  });

  it('gives a free caller no A2 to B2 uttrykk, and Plus does get them', () => {
    for (const level of ['A2', 'B1', 'B2'] as const) {
      const free = selectClozeEntries(SOURCES, CLOZE_SOURCES, level, undefined, false).entries;
      expect(
        free.filter((e) => UTTRYKK_IDS.has(e.id)),
        level
      ).toEqual([]);

      const plus = selectClozeEntries(SOURCES, CLOZE_SOURCES, level, undefined, true).entries;
      expect(plus.filter((e) => UTTRYKK_IDS.has(e.id)).length, level).toBeGreaterThan(0);
    }
  });

  it('gives a free caller nothing for a Plus-only category, and Plus something', () => {
    const locked = COUNTS.find(
      (c) =>
        c.level === 'B2' &&
        quizPoolSize(COUNTS, 'B2', c.category, false) === 0 &&
        quizPoolSize(COUNTS, 'B2', c.category, true) > 0
    );
    expect(locked).toBeDefined();
    if (!locked) return;
    expect(selectClozeEntries(SOURCES, CLOZE_SOURCES, 'B2', locked.category, false)).toEqual({
      entries: [],
      cloze: {}
    });
    expect(
      selectClozeEntries(SOURCES, CLOZE_SOURCES, 'B2', locked.category, true).entries.length
    ).toBeGreaterThan(0);
  });

  it('gives a free caller all of the A1 sidecar items', () => {
    const { entries } = selectClozeEntries(SOURCES, CLOZE_SOURCES, 'A1', undefined, false);
    const expected = Object.keys(CLOZE_VOCAB.A1).length + Object.keys(CLOZE_UTTRYKK.A1).length;
    expect(entries).toHaveLength(expected);
  });
});

describe('selectClozeEntries: dropping entries', () => {
  const a1 = VOCAB.A1.slice(0, 3);
  const sources: QuizSource[] = [{ level: 'A1', type: 'vocab', entries: a1 }];
  const itemFor = (e: VocabEntry): ClozeItemData => ({
    before: '',
    answer: e.example.slice(0, 3),
    after: e.example.slice(3)
  });

  it('keeps an entry with a valid item', () => {
    const clozeSources: ClozeSource[] = [
      { level: 'A1', type: 'vocab', items: { [a1[0].id]: itemFor(a1[0]) } }
    ];
    const out = selectClozeEntries(sources, clozeSources, 'A1', undefined, true);
    expect(out.entries.map((e) => e.id)).toEqual([a1[0].id]);
    expect(out.cloze[a1[0].id]).toEqual(itemFor(a1[0]));
  });

  it('drops an entry that has no item', () => {
    const clozeSources: ClozeSource[] = [
      { level: 'A1', type: 'vocab', items: { [a1[0].id]: itemFor(a1[0]) } }
    ];
    const out = selectClozeEntries(sources, clozeSources, 'A1', undefined, true);
    expect(out.entries.map((e) => e.id)).not.toContain(a1[1].id);
    expect(out.cloze[a1[1].id]).toBeUndefined();
  });

  it('drops an entry whose item no longer rebuilds its example', () => {
    const stale: ClozeItemData = { ...itemFor(a1[1]), after: itemFor(a1[1]).after + ' (edited)' };
    const clozeSources: ClozeSource[] = [
      {
        level: 'A1',
        type: 'vocab',
        items: { [a1[0].id]: itemFor(a1[0]), [a1[1].id]: stale }
      }
    ];
    const out = selectClozeEntries(sources, clozeSources, 'A1', undefined, true);
    expect(out.entries.map((e) => e.id)).toEqual([a1[0].id]);
    expect(Object.keys(out.cloze)).toEqual([a1[0].id]);
  });

  it('ignores sidecars of another level', () => {
    const clozeSources: ClozeSource[] = [
      { level: 'A2', type: 'vocab', items: { [a1[0].id]: itemFor(a1[0]) } }
    ];
    const out = selectClozeEntries(sources, clozeSources, 'A1', undefined, true);
    expect(out).toEqual({ entries: [], cloze: {} });
  });

  it('never mutates its inputs', () => {
    const items = { [a1[0].id]: itemFor(a1[0]) };
    const clozeSources: ClozeSource[] = [{ level: 'A1', type: 'vocab', items }];
    const before = JSON.stringify([sources, clozeSources]);
    selectClozeEntries(sources, clozeSources, 'A1', undefined, true);
    expect(JSON.stringify([sources, clozeSources])).toBe(before);
  });
});
