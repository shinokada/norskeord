import { describe, expect, it } from 'vitest';
import type { CardProgress } from './types';
import type { StatRow } from './stats';
import { filterProgressForPlan, freeStatRows, type ResolvedLocation } from './free-progress';
import { UTTRYKK_OTHERS_THEME } from './vocab-helpers';

const card = {} as CardProgress;

const locations: Record<string, ResolvedLocation> = {
  a1: { level: 'A1', category: 'animals', type: 'vocab' },
  a1u: { level: 'A1', category: 'greetings', type: 'uttrykk' },
  a2free: { level: 'A2', category: 'money', type: 'vocab' },
  a2locked: { level: 'A2', category: 'animals', type: 'vocab' },
  b2uttrykk: { level: 'B2', category: 'idioms', type: 'uttrykk' },
  cfree: { level: 'C', category: 'academic', type: 'vocab' },
  clocked: { level: 'C', category: 'philosophy', type: 'vocab' }
};

const map: Record<string, CardProgress> = {
  a1: card,
  a1u: card,
  a2free: card,
  a2locked: card,
  b2uttrykk: card,
  cfree: card,
  clocked: card,
  gone: card // does not resolve anywhere
};

const resolve = (id: string) => locations[id];

describe('filterProgressForPlan', () => {
  it('returns the same map for Plus', () => {
    expect(filterProgressForPlan(map, true, resolve)).toBe(map);
  });

  it('drops cards in locked categories for free users', () => {
    const keys = Object.keys(filterProgressForPlan(map, false, resolve)).sort();
    expect(keys).toEqual(['a1', 'a1u', 'a2free', 'cfree', 'gone']);
  });

  it('keeps ids that do not resolve, like the rest of the page does', () => {
    expect(filterProgressForPlan(map, false, resolve)).toHaveProperty('gone');
  });

  it('does not change the input map', () => {
    const before = Object.keys(map).length;
    filterProgressForPlan(map, false, resolve);
    expect(Object.keys(map)).toHaveLength(before);
  });
});

const row = (key: string): StatRow => ({
  key,
  label: key,
  href: `/${key}`,
  total: 0,
  seen: 0,
  review: 0,
  learning: 0,
  relearning: 0,
  due: 0
});
const keysOf = (rows: StatRow[]) => rows.map((r) => r.key);

describe('freeStatRows', () => {
  it('shows every row to Plus', () => {
    const rows = [row('money'), row('animals')];
    expect(freeStatRows(rows, 'A2', 'vocab', true)).toBe(rows);
  });

  it('shows every A1 row to free users, vocab and uttrykk', () => {
    const rows = [row('animals'), row('greetings'), row('whatever')];
    expect(keysOf(freeStatRows(rows, 'A1', 'vocab', false))).toEqual(keysOf(rows));
    expect(keysOf(freeStatRows(rows, 'A1', 'uttrykk', false))).toEqual(keysOf(rows));
  });

  it('shows only the free vocab categories above A1', () => {
    expect(
      keysOf(freeStatRows([row('money'), row('animals'), row('weather')], 'A2', 'vocab', false))
    ).toEqual(['money', 'weather']);
    expect(keysOf(freeStatRows([row('travel'), row('media')], 'B1', 'vocab', false))).toEqual([
      'travel'
    ]);
    expect(keysOf(freeStatRows([row('academic'), row('philosophy')], 'C', 'vocab', false))).toEqual(
      ['academic']
    );
  });

  it('shows no uttrykk rows at A2 to B2 to free users', () => {
    for (const level of ['A2', 'B1', 'B2'] as const) {
      expect(
        freeStatRows([row('idioms'), row(UTTRYKK_OTHERS_THEME)], level, 'uttrykk', false)
      ).toEqual([]);
    }
  });

  it('shows only free categories for C uttrykk, never the Others row', () => {
    const rows = [row('academic'), row('philosophy'), row(UTTRYKK_OTHERS_THEME)];
    expect(keysOf(freeStatRows(rows, 'C', 'uttrykk', false))).toEqual(['academic']);
  });
});
