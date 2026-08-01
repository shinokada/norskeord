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

  // Guardrail for ai-docs/implementation/grammar-explanation-update.md,
  // "Problem B": a `transform` question always expects the full rewritten
  // sentence as its answer (TransformQuestion.svelte's fixed header says
  // "Skriv om setningen"). A prompt starting with "Fyll inn" reads like
  // "just supply the missing word" and contradicts that header, which is
  // exactly what caused learners to type only the blank word instead of
  // the whole sentence. `fill`-type questions are unaffected — for those,
  // "Fyll inn" is correct (see FillQuestion.svelte).
  it('transform question prompts never start with "Fyll inn"', () => {
    const offenders = questions
      .filter((q) => q.type === 'transform' && q.prompt?.trim().startsWith('Fyll inn'))
      .map((q) => q.id);
    expect(offenders).toEqual([]);
  });
});
