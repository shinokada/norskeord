import { describe, expect, it } from 'vitest';
import type { GrammarTopic } from '$lib/types';
import { GRAMMAR_TAXONOMY, chapterBySlug } from './taxonomy';
import { chapterScope, dueInScope } from './review-scope';

describe('chapterScope', () => {
  it('is null when there is no ?chapter= value', () => {
    expect(chapterScope(null)).toBeNull();
    expect(chapterScope(undefined)).toBeNull();
    expect(chapterScope('')).toBeNull();
  });

  it('is an empty set for an unknown slug, so a typo never reviews everything', () => {
    const scope = chapterScope('does-not-exist');
    expect(scope).not.toBeNull();
    expect(scope!.size).toBe(0);
  });

  it("holds the chapter's primary topics", () => {
    const scope = chapterScope('pronomen')!;
    expect(scope.has('personlige-pronomen')).toBe(true);
    expect(scope.has('pronomen-den-det-de')).toBe(true);
    expect(scope.has('noun-plurals')).toBe(false);
  });

  it('matches the taxonomy for every chapter', () => {
    for (const part of GRAMMAR_TAXONOMY) {
      for (const chapter of part.chapters) {
        const expected = chapterBySlug(chapter.slug)!.sections.flatMap((s) => s.topics);
        expect([...chapterScope(chapter.slug)!].sort()).toEqual([...expected].sort());
      }
    }
  });

  it('does not count an ALSO_IN topic in the other chapter', () => {
    // ikke-placement lives in 2.3 (helsetninger) and is only cross-listed in 12.7 (adverb).
    expect(chapterScope('helsetninger')!.has('ikke-placement')).toBe(true);
    expect(chapterScope('adverb')!.has('ikke-placement')).toBe(false);
  });
});

describe('dueInScope', () => {
  const items = [{ id: 'a' }, { id: 'b' }, { id: 'gone' }];
  const topics: Record<string, GrammarTopic> = {
    a: 'personlige-pronomen',
    b: 'noun-plurals'
  };
  const topicOf = (id: string) => topics[id];

  it('keeps everything when there is no scope', () => {
    expect(dueInScope(items, null, topicOf)).toEqual(items);
  });

  it('returns a copy, not the same array', () => {
    expect(dueInScope(items, null, topicOf)).not.toBe(items);
  });

  it('keeps only items whose topic is in scope', () => {
    const scope = new Set<GrammarTopic>(['personlige-pronomen']);
    expect(dueInScope(items, scope, topicOf)).toEqual([{ id: 'a' }]);
  });

  it('drops ids that no longer resolve when a scope is active', () => {
    const scope = new Set<GrammarTopic>(['personlige-pronomen', 'noun-plurals']);
    expect(dueInScope(items, scope, topicOf).map((i) => i.id)).toEqual(['a', 'b']);
  });

  it('returns nothing for an empty scope', () => {
    expect(dueInScope(items, new Set(), topicOf)).toEqual([]);
  });
});
