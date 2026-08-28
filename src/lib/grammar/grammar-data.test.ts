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
import grammarA1 from '$lib/data/grammar-a1.json';
import grammarA2 from '$lib/data/grammar-a2.json';
import grammarB1 from '$lib/data/grammar-b1.json';
import grammarB2 from '$lib/data/grammar-b2.json';
import grammarC from '$lib/data/grammar-c.json';
import grammarTopicIndex from '$lib/data/grammar-topic-index.json';
import type { CEFRLevel, GrammarQuestion, GrammarTopic } from '$lib/types';
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

// Reconciliation guard for draft/b2/pa-niva/implementation/
// grammar-lazy-load-per-level.md: the derived per-level split files and the
// topic index (both generated from grammar.json by
// scripts/build-grammar-level-index.mjs) must always match the source of
// truth. A mismatch here means someone edited grammar.json without
// re-running `pnpm grammar:split` and committing the result — `pnpm build`
// regenerates them as a safety net at deploy time, but this test catches
// the stale commit in CI/PR review first.
describe('grammar split files <-> grammar.json reconciliation', () => {
  const splitByLevel: Record<CEFRLevel, GrammarQuestion[]> = {
    A1: grammarA1 as GrammarQuestion[],
    A2: grammarA2 as GrammarQuestion[],
    B1: grammarB1 as GrammarQuestion[],
    B2: grammarB2 as GrammarQuestion[],
    C: grammarC as GrammarQuestion[]
  };

  it('split files together contain exactly the same questions as grammar.json', () => {
    const splitIds = Object.values(splitByLevel)
      .flatMap((qs) => qs.map((q) => q.id))
      .sort();
    const sourceIds = questions.map((q) => q.id).sort();
    expect(splitIds).toEqual(sourceIds);
  });

  it('each split file contains only questions matching its own level', () => {
    for (const [level, qs] of Object.entries(splitByLevel) as [CEFRLevel, GrammarQuestion[]][]) {
      const wrongLevel = qs.filter((q) => q.cefr !== level).map((q) => q.id);
      expect(wrongLevel).toEqual([]);
    }
  });

  it('topic index counts match grammar.json per topic/level', () => {
    const index = grammarTopicIndex as Record<
      GrammarTopic,
      { levels: CEFRLevel[]; countsByLevel: Partial<Record<CEFRLevel, number>>; total: number }
    >;

    const expected = new Map<string, number>();
    for (const q of questions) {
      const key = `${q.topic}::${q.cefr}`;
      expected.set(key, (expected.get(key) ?? 0) + 1);
    }

    const actual = new Map<string, number>();
    for (const [topic, entry] of Object.entries(index)) {
      for (const [level, count] of Object.entries(entry.countsByLevel)) {
        actual.set(`${topic}::${level}`, count as number);
      }
    }

    expect(actual).toEqual(expected);
  });
});
