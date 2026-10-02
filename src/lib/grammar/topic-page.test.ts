// src/lib/grammar/topic-page.test.ts
import { describe, expect, it } from 'vitest';
import type { CardProgress, GrammarTopic } from '$lib/types';
import {
  MAX_RELATED,
  defaultTab,
  parseTabParam,
  pickProgress,
  relatedTopics,
  topicNavModel
} from './topic-page';
import { orderedTopics } from './taxonomy';

const card = () => ({}) as CardProgress;

describe('parseTabParam', () => {
  it('accepts the two tabs and rejects everything else', () => {
    expect(parseTabParam('rule')).toBe('rule');
    expect(parseTabParam('practice')).toBe('practice');
    expect(parseTabParam('Practice')).toBeNull();
    expect(parseTabParam('')).toBeNull();
    expect(parseTabParam(null)).toBeNull();
    expect(parseTabParam(undefined)).toBeNull();
  });
});

describe('defaultTab', () => {
  it('opens practice only when cards are due', () => {
    expect(defaultTab(0)).toBe('rule');
    expect(defaultTab(1)).toBe('practice');
    expect(defaultTab(12)).toBe('practice');
  });
});

describe('pickProgress', () => {
  it('keeps only the requested ids that have progress', () => {
    const map = { a: card(), b: card(), c: card() };
    expect(Object.keys(pickProgress(['a', 'c', 'missing'], map)).sort()).toEqual(['a', 'c']);
  });

  it('returns an empty map for no ids', () => {
    expect(pickProgress([], { a: card() })).toEqual({});
  });
});

describe('topicNavModel', () => {
  it('returns null for a topic that is not in the taxonomy', () => {
    expect(topicNavModel('does-not-exist' as GrammarTopic)).toBeNull();
  });

  it('places a topic and links prev/next in book order', () => {
    const topics = orderedTopics();
    const first = topics[0];
    const model = topicNavModel(first);
    expect(model).not.toBeNull();
    expect(model!.prev).toBeNull();
    expect(model!.next?.topic).toBe(topics[1]);

    const last = topics[topics.length - 1];
    const lastModel = topicNavModel(last);
    expect(lastModel!.next).toBeNull();
    expect(lastModel!.prev?.topic).toBe(topics[topics.length - 2]);
  });

  it('exposes the breadcrumb levels for subjekt-og-verbal (section 1.1)', () => {
    const model = topicNavModel('subjekt-og-verbal');
    expect(model!.section.id).toBe('1.1');
    expect(model!.chapter.slug).toBe('setningsledd');
    expect(model!.part.no).toBe(1);
  });

  it('gives every link a Norwegian title', () => {
    const model = topicNavModel('subjekt-og-verbal')!;
    for (const link of [model.next, ...model.related]) {
      expect(link?.title.length).toBeGreaterThan(0);
    }
  });

  it('never repeats prev/next or the topic itself in related', () => {
    for (const topic of orderedTopics()) {
      const model = topicNavModel(topic)!;
      const seen = new Set<string>();
      for (const link of model.related) {
        expect(link.topic).not.toBe(topic);
        expect(link.topic).not.toBe(model.prev?.topic);
        expect(link.topic).not.toBe(model.next?.topic);
        expect(seen.has(link.topic)).toBe(false);
        seen.add(link.topic);
      }
      expect(model.related.length).toBeLessThanOrEqual(MAX_RELATED);
    }
  });
});

describe('relatedTopics', () => {
  it('lists section siblings first', () => {
    // Section 1.1: subjekt-og-verbal, sammensatt-verbtid, setningsledd-identifikasjon.
    const related = relatedTopics('subjekt-og-verbal').map((l) => l.topic);
    expect(related.slice(0, 2)).toEqual(['sammensatt-verbtid', 'setningsledd-identifikasjon']);
  });

  it('adds topics from the sections a topic also covers', () => {
    // ikke-placement also sits in 12.7 (setningsadverb).
    const related = relatedTopics('ikke-placement', [], 20).map((l) => l.topic);
    expect(related).toContain('adverbial-fronting');
    expect(related).toContain('setningsadverbial');
  });

  it('honours exclude and max', () => {
    const all = relatedTopics('subjekt-og-verbal', [], 20).map((l) => l.topic);
    const without = relatedTopics('subjekt-og-verbal', ['sammensatt-verbtid'], 20).map(
      (l) => l.topic
    );
    expect(all).toContain('sammensatt-verbtid');
    expect(without).not.toContain('sammensatt-verbtid');
    expect(relatedTopics('ikke-placement', [], 1)).toHaveLength(1);
  });

  it('returns nothing for an unplaced topic', () => {
    expect(relatedTopics('does-not-exist' as GrammarTopic)).toEqual([]);
  });
});
