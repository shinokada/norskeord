import { describe, expect, it } from 'vitest';
import type { GrammarTopic } from '$lib/types';
import { FREE_GRAMMAR_TOPICS } from '$lib/config';
import { GRAMMAR_RULES } from './rules';
import { META_DESCRIPTION_MAX, indexableTopics, isIndexableTopic, topicMetaTags } from './seo';

function freeAtA1(topic: GrammarTopic): boolean {
  const entry = FREE_GRAMMAR_TOPICS[topic];
  return !!entry && (entry === 'all' || entry.includes('A1'));
}

describe('isIndexableTopic', () => {
  it('is true for a topic that is free at A1', () => {
    expect(isIndexableTopic('subjekt-og-verbal')).toBe(true);
  });

  it('is false for a Plus-only topic', () => {
    expect(isIndexableTopic('uttrykk')).toBe(false);
  });

  it('is false for an unknown topic', () => {
    expect(isIndexableTopic('does-not-exist' as GrammarTopic)).toBe(false);
  });
});

describe('indexableTopics', () => {
  it('lists exactly the topics free at A1, each with a rule', () => {
    const expected = (Object.keys(FREE_GRAMMAR_TOPICS) as GrammarTopic[]).filter(
      (t) => freeAtA1(t) && GRAMMAR_RULES[t]
    );
    expect([...indexableTopics()].sort()).toEqual([...expected].sort());
  });

  it('has no duplicates', () => {
    const topics = indexableTopics();
    expect(new Set(topics).size).toBe(topics.length);
  });

  it('is not empty', () => {
    expect(indexableTopics().length).toBeGreaterThan(0);
  });
});

describe('topicMetaTags', () => {
  it('returns null for an unknown topic', () => {
    expect(topicMetaTags('does-not-exist' as GrammarTopic)).toBeNull();
  });

  it('builds title and description for an indexable topic, without robots', () => {
    const topic = 'subjekt-og-verbal' as GrammarTopic;
    const meta = topicMetaTags(topic);
    expect(meta).not.toBeNull();
    expect(meta!.title).toContain(GRAMMAR_RULES[topic].titleNb);
    expect(meta!.description).toBeTruthy();
    expect(meta!.description!.length).toBeLessThanOrEqual(META_DESCRIPTION_MAX + 1);
    expect(meta!.og?.title).toBe(meta!.title);
    expect(meta!.twitter?.description).toBe(meta!.description);
    expect(meta!.robots).toBeUndefined();
  });

  it('marks a non-indexable topic noindex', () => {
    const meta = topicMetaTags('uttrykk' as GrammarTopic);
    expect(meta).not.toBeNull();
    expect(meta!.robots).toEqual({ index: false, follow: true });
  });

  it('gives every indexable topic a non-empty description and no robots rule', () => {
    for (const topic of indexableTopics()) {
      const meta = topicMetaTags(topic);
      expect(meta?.description, topic).toBeTruthy();
      expect(meta?.robots, topic).toBeUndefined();
    }
  });
});
