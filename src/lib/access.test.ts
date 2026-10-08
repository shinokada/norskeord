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

  it('locks the former A2/B1 free samples: no free level beyond A1', () => {
    const segments = groupTopicLevelsByAccess('adj-comparison' as GrammarTopic, ['A2', 'B1']);
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

  it('produces two segments for ikke-placement: free at A1, locked at A2 and B1', () => {
    // The A1 questions moved here from helsetninger stay free; the former A2
    // free sample is Plus under the free-tier simplification.
    const levels: CEFRLevel[] = ['A1', 'A2', 'B1'];
    const segments = groupTopicLevelsByAccess('ikke-placement' as GrammarTopic, levels);
    expect(segments).toEqual([
      { access: 'free', levels: ['A1'] },
      { access: 'locked', levels: ['A2', 'B1'] }
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

describe('isFreeGrammarTopic — former teaser topics', () => {
  it('ikke-placement is free at A1 only', () => {
    // A1 added in Phase 1b: two A1 questions moved here from helsetninger and
    // must stay free (ai-docs/implementation/grammar-update.md).
    expect(isFreeGrammarTopic('ikke-placement' as GrammarTopic, 'A1')).toBe(true);
    expect(isFreeGrammarTopic('ikke-placement' as GrammarTopic, 'A2')).toBe(false);
    expect(isFreeGrammarTopic('ikke-placement' as GrammarTopic, 'B1')).toBe(false);
  });

  it('fortellende-setninger and sporresetninger (split from helsetninger) are free at A1', () => {
    expect(isFreeGrammarTopic('fortellende-setninger' as GrammarTopic, 'A1')).toBe(true);
    expect(isFreeGrammarTopic('sporresetninger' as GrammarTopic, 'A1')).toBe(true);
  });

  it('adj-comparison, ordfamilie-avledning and bade-og-verken-eller are Plus at every level', () => {
    for (const topic of ['adj-comparison', 'ordfamilie-avledning', 'bade-og-verken-eller']) {
      for (const level of ['A2', 'B1', 'C'] as CEFRLevel[]) {
        expect(isFreeGrammarTopic(topic as GrammarTopic, level), `${topic} ${level}`).toBe(false);
      }
    }
  });
});
