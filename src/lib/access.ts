// src/lib/access.ts
// Access-control predicates — determines what's free vs Plus-gated.
// All functions are pure and side-effect free.

import type { GrammarTopic, GrammarQuestion } from '$lib/types';
import {
  PLUS_CATEGORIES,
  FREE_QUIZ_CATEGORIES,
  FREE_GRAMMAR_TOPICS,
  FREE_GRAMMAR_PER_TOPIC
} from '$lib/config';

export function isPlusCategory(level: string, category: string): boolean {
  return PLUS_CATEGORIES.has(`${level.toLowerCase()}/${category}`);
}

export function isFreeQuizCategory(level: string, category: string): boolean {
  return FREE_QUIZ_CATEGORIES.has(`${level.toLowerCase()}/${category}`);
}

export function isFreeGrammarTopic(topic: GrammarTopic): boolean {
  return FREE_GRAMMAR_TOPICS.has(topic);
}

/**
 * Practice test number 1 is always free; all higher numbers require Plus.
 */
export function isFreeTest(test: number): boolean {
  return test === 1;
}

/**
 * Given the full grammar question list, returns the set of question ids that
 * are free for guest/free users: within each topic, the first
 * FREE_GRAMMAR_PER_TOPIC non-plusOnly questions in file order.
 */
export function freeGrammarQuestionIds(questions: GrammarQuestion[]): Set<string> {
  const seenPerTopic: Record<string, number> = {};
  const free = new Set<string>();
  for (const q of questions) {
    if (q.plusOnly) continue;
    const seen = seenPerTopic[q.topic] ?? 0;
    if (seen < FREE_GRAMMAR_PER_TOPIC) {
      free.add(q.id);
      seenPerTopic[q.topic] = seen + 1;
    }
  }
  return free;
}
