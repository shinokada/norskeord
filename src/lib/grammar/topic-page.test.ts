// src/lib/grammar/topic-page.test.ts
import { describe, expect, it } from 'vitest';
import type { CardProgress, CEFRLevel, GrammarTopic } from '$lib/types';
import {
  MAX_RELATED,
  TEASER_MAX,
  countByLevel,
  defaultTab,
  lockedBreakdown,
  parseTabParam,
  pickProgress,
  relatedTopics,
  tabForKey,
  teaserText,
  topicNavModel
} from './topic-page';
import { GRAMMAR_RULES } from './rules';
import { orderedTopics } from './taxonomy';

const card = () => ({}) as CardProgress;

describe('tabForKey', () => {
  it('moves right and left, wrapping around', () => {
    expect(tabForKey('rule', 'ArrowRight')).toBe('practice');
    expect(tabForKey('practice', 'ArrowRight')).toBe('rule');
    expect(tabForKey('practice', 'ArrowLeft')).toBe('rule');
    expect(tabForKey('rule', 'ArrowLeft')).toBe('practice');
  });

  it('jumps to the first and last tab with Home and End', () => {
    expect(tabForKey('practice', 'Home')).toBe('rule');
    expect(tabForKey('rule', 'End')).toBe('practice');
  });

  it('ignores every other key, so Tab and typing still work', () => {
    for (const key of ['Tab', 'Enter', ' ', 'ArrowDown', 'ArrowUp', 'a']) {
      expect(tabForKey('rule', key), key).toBeNull();
    }
  });
});

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

const q = (id: string, cefr: CEFRLevel) => ({ id, cefr });

describe('countByLevel', () => {
  it('counts per level in A1-to-C order and skips empty levels', () => {
    const counts = countByLevel([q('1', 'B1'), q('2', 'A1'), q('3', 'B1'), q('4', 'C')]);
    expect(counts).toEqual([
      { level: 'A1', count: 1 },
      { level: 'B1', count: 2 },
      { level: 'C', count: 1 }
    ]);
  });

  it('returns an empty list for no questions', () => {
    expect(countByLevel([])).toEqual([]);
  });
});

describe('lockedBreakdown', () => {
  const questions = [q('a1', 'A1'), q('a2', 'A1'), q('b1', 'A2'), q('b2', 'B1'), q('b3', 'B1')];

  it('counts the questions that are not free, per level', () => {
    const result = lockedBreakdown(questions, new Set(['a1', 'a2']));
    expect(result.total).toBe(3);
    expect(result.levels).toEqual([
      { level: 'A2', count: 1 },
      { level: 'B1', count: 2 }
    ]);
  });

  it('is empty when everything is free', () => {
    expect(lockedBreakdown(questions, new Set(questions.map((x) => x.id)))).toEqual({
      total: 0,
      levels: []
    });
  });

  it('locks everything when nothing is free', () => {
    expect(lockedBreakdown(questions, new Set()).total).toBe(questions.length);
  });
});

describe('teaserText', () => {
  it('is empty without a rule', () => {
    expect(teaserText(undefined)).toBe('');
  });

  it('is plain text, not longer than the limit, for every rule', () => {
    for (const [id, rule] of Object.entries(GRAMMAR_RULES)) {
      const text = teaserText(rule);
      expect(text.length, id).toBeGreaterThan(0);
      expect(text.length, id).toBeLessThanOrEqual(TEASER_MAX + 1);
      expect(text, id).not.toContain('**');
    }
  });
});
