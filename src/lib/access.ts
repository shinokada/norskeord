// src/lib/access.ts
// Access-control predicates — determines what's free vs Plus-gated.
// All functions are pure and side-effect free.

import type { CEFRLevel, GrammarTopic, GrammarQuestion } from '$lib/types';
import { PLUS_CATEGORIES, FREE_QUIZ_CATEGORIES, FREE_GRAMMAR_TOPICS } from '$lib/config';

export function isPlusCategory(level: string, category: string): boolean {
  return PLUS_CATEGORIES.has(`${level.toLowerCase()}/${category}`);
}

export function isFreeQuizCategory(level: string, category: string): boolean {
  return FREE_QUIZ_CATEGORIES.has(`${level.toLowerCase()}/${category}`);
}

/**
 * Whether a grammar topic has any free content at all.
 *
 * - Called with just `topic` (e.g. by the /grammar picker, which groups by
 *   topic only): true if the topic is free at *any* CEFR level, so it's
 *   shown as a browsable "free" topic rather than fully Plus-locked.
 * - Called with `cefr` too (e.g. by the topic detail page, per question):
 *   true only if that specific level of the topic is free — this is what
 *   lets a topic be free at A2 but Plus-gated at B1, or vice versa.
 */
export function isFreeGrammarTopic(topic: GrammarTopic, cefr?: CEFRLevel): boolean {
  const entry = FREE_GRAMMAR_TOPICS[topic];
  if (!entry) return false;
  if (!cefr) return true; // topic has *some* free level
  return entry === 'all' || entry.includes(cefr);
}

export type GrammarAccessSegment = {
  access: 'free' | 'locked';
  levels: CEFRLevel[];
};

/**
 * Splits a topic's levels into contiguous runs that share the same
 * free/locked status, in level order (A1 → C). Used by the /grammar picker
 * (ai-docs/implementation/grammar-fix.md) so each card carries one fixed,
 * unambiguous access state instead of flipping between free/locked
 * depending on which CEFR filter pill is active.
 *
 * Under the current policy this yields at most 2 segments for a multi-level
 * topic (a leading free run + a locked rest), but it's written generically
 * so it still holds if the policy later frees a non-contiguous level (e.g.
 * A1 and C free, A2/B1/B2 locked → 3 segments).
 */
export function groupTopicLevelsByAccess(
  topic: GrammarTopic,
  levels: CEFRLevel[]
): GrammarAccessSegment[] {
  const segments: GrammarAccessSegment[] = [];
  for (const level of levels) {
    const access = isFreeGrammarTopic(topic, level) ? 'free' : 'locked';
    const last = segments[segments.length - 1];
    if (last && last.access === access) {
      last.levels.push(level);
    } else {
      segments.push({ access, levels: [level] });
    }
  }
  return segments;
}

/**
 * Practice test number 1 is always free; all higher numbers require Plus.
 */
export function isFreeTest(test: number): boolean {
  return test === 1;
}

/**
 * Given the full grammar question list, returns the set of question ids that
 * are free for guest/free users: every non-plusOnly question whose
 * (topic, cefr) pair is free per FREE_GRAMMAR_TOPICS. A topic is either fully
 * open or fully Plus-gated *at a given level* — no partial-preview cap within
 * a free level (see ai-docs/gating-rules.md).
 */
export function freeGrammarQuestionIds(questions: GrammarQuestion[]): Set<string> {
  const free = new Set<string>();
  for (const q of questions) {
    if (q.plusOnly) continue;
    if (isFreeGrammarTopic(q.topic, q.cefr)) free.add(q.id);
  }
  return free;
}
