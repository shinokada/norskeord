// src/lib/grammar/grammar-data.test.ts
// Data-integrity regression guard: every `topic` value that appears in
// grammar.json must resolve to a GRAMMAR_RULES entry (used by
// /grammar/[topic]/+page.ts to 404 unknown topics, and by the topic detail
// page to render the rule explanation). Extended per
// ai-docs/implementation/b1-grammar.md Testing section to cover the 9 new
// B1 topics (framtid-uttrykk, for-sa-arsak-folge, da-naar,
// hvis-om-betingelse, passiv-bli-s, bade-og-verken-eller,
// adjektiv-eller-adverb, motsetning-selv-om-likevel,
// tidssekvens-etter-at-etterpaa) — this test covers all topics generically
// by iterating grammar.json rather than hand-listing them, so it never
// needs updating again for future levels.

import { describe, it, expect } from 'vitest';
import grammarData from '$lib/data/grammar.json';
import type { GrammarQuestion } from '$lib/types';
import { GRAMMAR_RULES } from './rules';

const questions = grammarData as GrammarQuestion[];

describe('grammar.json <-> GRAMMAR_RULES integrity', () => {
  it('every question topic resolves to a GRAMMAR_RULES entry', () => {
    const topicsWithoutRules = [...new Set(questions.map((q) => q.topic))].filter(
      (topic) => !GRAMMAR_RULES[topic]
    );
    expect(topicsWithoutRules).toEqual([]);
  });

  it('every GrammarRule id matches its own key in GRAMMAR_RULES', () => {
    const mismatched = Object.entries(GRAMMAR_RULES)
      .filter(([key, rule]) => rule.id !== key)
      .map(([key, rule]) => `${key} -> ${rule.id}`);
    expect(mismatched).toEqual([]);
  });
});
