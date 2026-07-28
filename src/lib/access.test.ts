import { describe, it, expect } from 'vitest';
import { groupTopicLevelsByAccess, isFreeGrammarTopic } from './access';
import type { CEFRLevel, GrammarTopic } from './types';

describe('groupTopicLevelsByAccess', () => {
  it('returns a single free segment for a topic free at every level it has', () => {
    // 'ikke-placement' is free at A2 only, and only has A2/B1 content — so
    // to exercise the "fully free" case we use a topic free at every level
    // it spans. 'preposisjoner-sted' is free at A1 and has content there.
    const levels: CEFRLevel[] = ['A1'];
    const segments = groupTopicLevelsByAccess('preposisjoner-sted' as GrammarTopic, levels);
    expect(segments).toEqual([{ access: 'free', levels: ['A1'] }]);
  });

  it('returns a single locked segment for a topic with no free levels', () => {
    const levels: CEFRLevel[] = ['A2', 'B1'];
    const segments = groupTopicLevelsByAccess('v2-word-order' as GrammarTopic, levels);
    expect(segments).toEqual([{ access: 'locked', levels: ['A2', 'B1'] }]);
  });

  it('splits a topic free at A1 only, spanning A1/A2/B1, into two segments', () => {
    const levels: CEFRLevel[] = ['A1', 'A2', 'B1'];
    const segments = groupTopicLevelsByAccess('noun-plurals' as GrammarTopic, levels);
    expect(segments).toEqual([
      { access: 'free', levels: ['A1'] },
      { access: 'locked', levels: ['A2', 'B1'] }
    ]);
  });

  it('produces two segments for a topic free at A2 only, with no A1 content', () => {
    // 'ikke-placement' is free at A2, Plus at B1, and has no A1 content —
    // matches the new teaser-topic policy.
    const levels: CEFRLevel[] = ['A2', 'B1'];
    const segments = groupTopicLevelsByAccess('ikke-placement' as GrammarTopic, levels);
    expect(segments).toEqual([
      { access: 'free', levels: ['A2'] },
      { access: 'locked', levels: ['B1'] }
    ]);
  });

  it('starts a new segment whenever access status changes, not just at the front', () => {
    // og-men is free at A1, has no A2 content, and is locked at B1 — the
    // "gap" (missing A2) shouldn't affect segmenting, since the function
    // only looks at the levels list it's given, in order.
    const segments = groupTopicLevelsByAccess('og-men' as GrammarTopic, ['A1', 'B1']);
    expect(segments).toEqual([
      { access: 'free', levels: ['A1'] },
      { access: 'locked', levels: ['B1'] }
    ]);
  });

  it('merges consecutive same-access levels into one segment, not several', () => {
    // noun-plurals is free at A1, locked at A2 and B1 — the two locked
    // levels must merge into ONE segment, proving the function groups by
    // status change rather than emitting one segment per level.
    const segments = groupTopicLevelsByAccess(
      'noun-plurals' as GrammarTopic,
      ['A1', 'A2', 'B1'] as CEFRLevel[]
    );
    expect(segments).toHaveLength(2);
    expect(segments[1]).toEqual({ access: 'locked', levels: ['A2', 'B1'] });
  });
});

describe('isFreeGrammarTopic — new teaser topics', () => {
  it('ikke-placement is free at A2, locked at B1, and has no A1 entry', () => {
    expect(isFreeGrammarTopic('ikke-placement' as GrammarTopic, 'A2')).toBe(true);
    expect(isFreeGrammarTopic('ikke-placement' as GrammarTopic, 'B1')).toBe(false);
    expect(isFreeGrammarTopic('ikke-placement' as GrammarTopic, 'A1')).toBe(false);
  });

  it('adj-comparison is free at A2, locked at B1', () => {
    expect(isFreeGrammarTopic('adj-comparison' as GrammarTopic, 'A2')).toBe(true);
    expect(isFreeGrammarTopic('adj-comparison' as GrammarTopic, 'B1')).toBe(false);
  });

  it('ordfamilie-avledning is free at B1, locked at C', () => {
    expect(isFreeGrammarTopic('ordfamilie-avledning' as GrammarTopic, 'B1')).toBe(true);
    expect(isFreeGrammarTopic('ordfamilie-avledning' as GrammarTopic, 'C')).toBe(false);
  });

  it('bade-og-verken-eller is free at B1', () => {
    expect(isFreeGrammarTopic('bade-og-verken-eller' as GrammarTopic, 'B1')).toBe(true);
  });
});
