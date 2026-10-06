import { describe, it, expect } from 'vitest';
import {
  bareLemma,
  buildReport,
  englishSegments,
  findIdenticalNorskGroups,
  findSameLemmaGroups,
  type Review,
  type SenseEntry
} from './sense-candidates';
import { bareLemma as quizBareLemma } from './quiz';

function entry(overrides: Partial<SenseEntry>): SenseEntry {
  return {
    id: 'w-000001',
    norsk: 'bank (en)',
    english: 'bank',
    level: 'A2',
    category: 'shopping',
    part: 'noun',
    ...overrides
  };
}

describe('bareLemma', () => {
  it('matches the quiz.ts implementation', () => {
    for (const s of [
      'fot (en)',
      'å gifte seg',
      'tann (en/ei)',
      'å håpe (et)',
      'bank (finansinstitusjon)',
      'gå'
    ]) {
      expect(bareLemma(s)).toBe(quizBareLemma(s));
    }
  });
});

describe('findIdenticalNorskGroups (tier 1)', () => {
  it('lists identical-norsk entries without a sense', () => {
    const a = entry({ id: 'w-000001' });
    const b = entry({ id: 'w-000002', english: 'bench' });
    expect(findIdenticalNorskGroups([a, b, entry({ id: 'w-000003', norsk: 'hus (et)' })])).toEqual([
      [a, b]
    ]);
  });

  it('is case- and whitespace-insensitive', () => {
    const a = entry({ id: 'w-000001', norsk: 'Bank (en)' });
    const b = entry({ id: 'w-000002', norsk: ' bank (en) ' });
    expect(findIdenticalNorskGroups([a, b])).toHaveLength(1);
  });

  it('drops a group once every member has a distinct sense', () => {
    const a = entry({ id: 'w-000001', sense: 'money' });
    const b = entry({ id: 'w-000002', sense: 'bench' });
    expect(findIdenticalNorskGroups([a, b])).toEqual([]);
  });

  it('keeps a group with a missing or duplicate sense', () => {
    expect(
      findIdenticalNorskGroups([
        entry({ id: 'w-000001', sense: 'money' }),
        entry({ id: 'w-000002' })
      ])
    ).toHaveLength(1);
    expect(
      findIdenticalNorskGroups([
        entry({ id: 'w-000001', sense: 'money' }),
        entry({ id: 'w-000002', sense: 'Money' })
      ])
    ).toHaveLength(1);
  });
});

describe('englishSegments (tier 2 helper)', () => {
  it('detects ; / and , and counts segments', () => {
    expect(englishSegments('bank; bench')).toEqual({ count: 2, sep: ';' });
    expect(englishSegments('bank / bench / sofa')).toEqual({ count: 3, sep: '/' });
    expect(englishSegments('to work, to function')).toEqual({ count: 2, sep: ',' });
  });

  it('prefers the strongest separator', () => {
    expect(englishSegments('a, b / c; d')?.sep).toBe(';');
  });

  it('ignores separators inside parentheses', () => {
    expect(englishSegments('bank (money, finance)')).toBeNull();
    expect(englishSegments('to leave (a place; a person)')).toBeNull();
  });

  it('returns null for a single segment or empty text', () => {
    expect(englishSegments('bank')).toBeNull();
    expect(englishSegments('')).toBeNull();
    expect(englishSegments('bank,')).toBeNull();
  });
});

describe('findSameLemmaGroups (tier 3)', () => {
  const fly1 = entry({ id: 'w-000010', norsk: 'å fly', lemma: 'fly', part: 'verb' });
  const fly2 = entry({ id: 'w-000011', norsk: 'å fly av', lemma: 'fly', part: 'verb' });

  it('groups same lemma + part with different norsk', () => {
    expect(findSameLemmaGroups([fly1, fly2], {})).toEqual([[fly1, fly2]]);
  });

  it('does not mix parts (verb vs noun)', () => {
    const noun = entry({ id: 'w-000012', norsk: 'fly (et)', lemma: 'fly', part: 'noun' });
    expect(findSameLemmaGroups([fly1, noun], {})).toEqual([]);
  });

  it('excludes plural cards', () => {
    const bok = entry({ id: 'w-000020', norsk: 'bok (en)', lemma: 'bok' });
    const bøker = entry({ id: 'w-000021', norsk: 'bøker (pl.)', lemma: 'bok' });
    const bøkene = entry({ id: 'w-000022', norsk: 'bøkene (b.pl.)', lemma: 'bok' });
    expect(findSameLemmaGroups([bok, bøker, bøkene], {})).toEqual([]);
  });

  it('needs two distinct norsk (identical norsk is tier 1)', () => {
    const a = entry({ id: 'w-000030', norsk: 'kasse (en)' });
    const b = entry({ id: 'w-000031', norsk: 'kasse (en)' });
    expect(findSameLemmaGroups([a, b], {})).toEqual([]);
  });

  it('falls back to the bare norsk when lemma is missing', () => {
    const a = entry({ id: 'w-000040', norsk: 'å legge' });
    const b = entry({ id: 'w-000041', norsk: 'å legge', lemma: 'legge' });
    const c = entry({ id: 'w-000042', norsk: 'legge' });
    expect(findSameLemmaGroups([a, b, c], {})).toEqual([[a, b, c]]);
  });

  it('a keep decision removes the entry from the group', () => {
    const review: Review = { 'w-000011': 'keep' };
    expect(findSameLemmaGroups([fly1, fly2], review)).toEqual([]);
  });
});

describe('buildReport', () => {
  const multi = entry({
    id: 'w-000100',
    norsk: 'å legge',
    english: 'to lay; to go to bed',
    part: 'verb'
  });
  const plain = entry({ id: 'w-000101', norsk: 'hus (et)', english: 'house' });

  it('lists tier-2 entries and skips single-meaning ones', () => {
    const report = buildReport([multi, plain], {});
    expect(report.tier2.map((h) => h.entry.id)).toEqual(['w-000100']);
  });

  it('ranks tier 2 by segment count, then separator strength', () => {
    const three = entry({ id: 'w-000110', norsk: 'ord1 (et)', english: 'a, b, c' });
    const twoSemi = entry({ id: 'w-000111', norsk: 'ord2 (et)', english: 'a; b' });
    const twoComma = entry({ id: 'w-000112', norsk: 'ord3 (et)', english: 'a, b' });
    const ids = buildReport([twoComma, twoSemi, three], {}).tier2.map((h) => h.entry.id);
    expect(ids).toEqual(['w-000110', 'w-000111', 'w-000112']);
  });

  it('hides keep entries from tier 2 and queues split entries until they have a sense', () => {
    const review: Review = { 'w-000100': 'split' };
    expect(buildReport([multi], review).tier2).toEqual([]);
    expect(buildReport([multi], review).queued).toEqual([multi]);
    expect(buildReport([{ ...multi, sense: 'to lay' }], review).queued).toEqual([]);
    expect(buildReport([multi], { 'w-000100': 'keep' }).tier2).toEqual([]);
    expect(buildReport([multi], { 'w-000100': 'keep' }).queued).toEqual([]);
  });

  it('skips entries that already have a sense', () => {
    expect(buildReport([{ ...multi, sense: 'to lay' }], {}).tier2).toEqual([]);
  });

  it('never hides tier 1 by a review decision, and does not repeat tier-1 members in tier 2', () => {
    const a = entry({ id: 'w-000200', english: 'bank; bench' });
    const b = entry({ id: 'w-000201', english: 'bench' });
    const report = buildReport([a, b], { 'w-000200': 'keep', 'w-000201': 'keep' });
    expect(report.tier1).toEqual([[a, b]]);
    expect(report.tier2).toEqual([]);
  });

  it('reports review ids that no longer exist in the data', () => {
    expect(buildReport([plain], { 'w-999999': 'keep' }).unknownReviewIds).toEqual(['w-999999']);
  });
});
