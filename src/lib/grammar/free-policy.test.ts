// src/lib/grammar/free-policy.test.ts
// Policy guard for the grammar free tier (Phase 1 of
// ai-docs/implementation/grammar-update.md, decision #2).
//
// Policy: every A1 grammar question is free; everything else is Plus, except
// four legacy "free sample" topics listed explicitly below. Free access is
// config-driven (FREE_GRAMMAR_TOPICS in $lib/config), so without this test a
// new A1 topic could be added to grammar.json and silently ship as Plus-only,
// or a Plus topic could be freed by accident.
//
// If you deliberately change the policy (e.g. drop the legacy samples), update
// LEGACY_FREE_SAMPLES here so the change stays visible in review.

import { describe, it, expect } from 'vitest';
import grammarData from '$lib/data/grammar.json';
import { FREE_GRAMMAR_TOPICS } from '$lib/config';
import type { CEFRLevel, GrammarQuestion, GrammarTopic } from '$lib/types';

const questions = grammarData as GrammarQuestion[];

/** Topics that are intentionally free at a non-A1 level (open question 8). */
const LEGACY_FREE_SAMPLES: Partial<Record<GrammarTopic, CEFRLevel[]>> = {
  'ikke-placement': ['A2'],
  'adj-comparison': ['A2'],
  'ordfamilie-avledning': ['B1'],
  'bade-og-verken-eller': ['B1']
};

function freeLevels(topic: GrammarTopic): CEFRLevel[] | 'all' | null {
  const entry = FREE_GRAMMAR_TOPICS[topic];
  if (!entry) return null;
  return entry === 'all' ? 'all' : [...entry];
}

describe('grammar free-tier policy', () => {
  it('every topic with A1 questions is free at A1', () => {
    const a1Topics = [...new Set(questions.filter((q) => q.cefr === 'A1').map((q) => q.topic))];
    const notFree = a1Topics.filter((topic) => {
      const levels = freeLevels(topic);
      return !(levels === 'all' || (levels !== null && levels.includes('A1')));
    });
    expect(notFree).toEqual([]);
  });

  it('no A1 question is plusOnly (it would be unreachable for free users)', () => {
    const gated = questions.filter((q) => q.cefr === 'A1' && q.plusOnly).map((q) => q.id);
    expect(gated).toEqual([]);
  });

  it('beyond A1, only the documented legacy samples are free', () => {
    const beyondA1: Partial<Record<GrammarTopic, CEFRLevel[]>> = {};
    for (const topic of Object.keys(FREE_GRAMMAR_TOPICS) as GrammarTopic[]) {
      const levels = freeLevels(topic);
      // 'all' frees every level, which is never intended under this policy.
      const extra =
        levels === 'all' ? (['A1', 'A2', 'B1', 'B2', 'C'] as CEFRLevel[]) : (levels ?? []);
      const nonA1 = extra.filter((l) => l !== 'A1');
      if (nonA1.length > 0) beyondA1[topic] = nonA1;
    }
    expect(beyondA1).toEqual(LEGACY_FREE_SAMPLES);
  });

  it('every FREE_GRAMMAR_TOPICS key is a topic that exists in grammar.json', () => {
    const used = new Set<string>(questions.map((q) => q.topic));
    const unknown = Object.keys(FREE_GRAMMAR_TOPICS).filter((t) => !used.has(t));
    expect(unknown).toEqual([]);
  });
});
