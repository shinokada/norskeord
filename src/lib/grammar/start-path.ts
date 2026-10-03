// src/lib/grammar/start-path.ts
// The curated A1 «Start here» path on /grammar
// (ai-docs/implementation/grammar-update.md, Phase 8, open question 7).
//
// Book order starts with sentence-part terminology (subject, object,
// predicative), which is a poor first step for a beginner, and it shifts every
// time Content track B adds a topic to an early section. So the path is a
// curated list of topic ids in teaching order. start-path.test.ts keeps it
// honest: every id must exist in the taxonomy, be free at A1 and have enough A1
// questions, so a renamed, removed or locked topic fails a test instead of
// silently breaking the path.
//
// Pure functions only (no I/O), so everything is unit-testable.

import type { CardProgress, GrammarTopic } from '$lib/types';
import { resolveGrammarQuestion } from './id-index';
import { GRAMMAR_RULES } from './rules';

/**
 * The A1 path, in teaching order: who does things, the present tense, building
 * statements and questions, nouns and adjectives, then a second tense.
 * Keep it at 5-8 topics (the test enforces this).
 */
export const START_HERE_A1: readonly GrammarTopic[] = [
  'personlige-pronomen',
  'presens-verb',
  'fortellende-setninger',
  'sporresetninger',
  'noun-articles',
  'substantiv-bestemt-form',
  'adj-agreement',
  'preteritum-a1'
];

/**
 * A1 questions a topic needs before it can be a step. Also the number of
 * practised A1 questions that counts a step as done, so every step is
 * completable.
 */
export const START_HERE_MIN_A1_QUESTIONS = 8;

/** done: enough practised; next: the first step not done; todo: the rest. */
export type StartStepState = 'done' | 'next' | 'todo';

export interface StartStep {
  topic: GrammarTopic;
  /** Norwegian rule title (grammar content is Norwegian-only). */
  title: string;
  /** Distinct A1 questions practised, capped at `target`. */
  seen: number;
  /** Practised A1 questions that count the step as done. */
  target: number;
  state: StartStepState;
  /** The topic page scoped to A1, so Plus learners start at the right level. */
  href: string;
}

export interface StartHere {
  steps: StartStep[];
  /** Number of steps that are done. */
  done: number;
  /** True when every step is done (the page then hides the path). */
  complete: boolean;
}

/**
 * The path with the learner's progress. A step counts only A1 questions, from
 * each question's live level (grammar/id-index.ts), so practising a topic's
 * A2 questions does not complete its A1 step.
 */
export function startHere(grammarMap: Record<string, CardProgress>): StartHere {
  const onPath = new Set<GrammarTopic>(START_HERE_A1);
  const seenA1 = new Map<GrammarTopic, number>();

  for (const id of Object.keys(grammarMap)) {
    const resolved = resolveGrammarQuestion(id);
    if (!resolved || resolved.level !== 'A1' || !onPath.has(resolved.topic)) continue;
    seenA1.set(resolved.topic, (seenA1.get(resolved.topic) ?? 0) + 1);
  }

  const target = START_HERE_MIN_A1_QUESTIONS;
  let nextAssigned = false;
  const steps: StartStep[] = START_HERE_A1.map((topic) => {
    const seen = seenA1.get(topic) ?? 0;
    let state: StartStepState = 'todo';
    if (seen >= target) {
      state = 'done';
    } else if (!nextAssigned) {
      state = 'next';
      nextAssigned = true;
    }
    return {
      topic,
      title: GRAMMAR_RULES[topic]?.titleNb ?? topic,
      seen: Math.min(seen, target),
      target,
      state,
      href: `/grammar/${topic}?level=A1`
    };
  });

  const done = steps.filter((s) => s.state === 'done').length;
  return { steps, done, complete: done === steps.length };
}
