// src/lib/grammar/start-path.test.ts
import { describe, it, expect } from 'vitest';
import grammarTopicIndex from '$lib/data/grammar-topic-index.json';
import idIndexJson from '$lib/data/grammar-id-index.json';
import { isFreeGrammarTopic } from '$lib/access';
import type { CardProgress, CEFRLevel, GrammarTopic } from '$lib/types';
import { placementOf } from './taxonomy';
import { GRAMMAR_RULES } from './rules';
import { START_HERE_A1, START_HERE_MIN_A1_QUESTIONS, startHere } from './start-path';

type TopicIndexEntry = { countsByLevel: Partial<Record<CEFRLevel, number>> };
const TOPIC_INDEX = grammarTopicIndex as Record<string, TopicIndexEntry>;
const ID_INDEX = idIndexJson as unknown as Record<string, [GrammarTopic, CEFRLevel]>;

/** Question ids of one topic at one level, from the build artifact. */
function idsOf(topic: GrammarTopic, level: CEFRLevel): string[] {
  return Object.entries(ID_INDEX)
    .filter(([, [t, l]]) => t === topic && l === level)
    .map(([id]) => id);
}

/** startHere() only reads the keys, so an empty object stands in for the value. */
function mapOf(ids: string[]): Record<string, CardProgress> {
  return Object.fromEntries(ids.map((id) => [id, {} as CardProgress]));
}

describe('START_HERE_A1 (integrity)', () => {
  it('has 5 to 8 topics, with no duplicates', () => {
    expect(START_HERE_A1.length).toBeGreaterThanOrEqual(5);
    expect(START_HERE_A1.length).toBeLessThanOrEqual(8);
    expect(new Set(START_HERE_A1).size).toBe(START_HERE_A1.length);
  });

  it('every topic is placed in the taxonomy and has a rule', () => {
    for (const topic of START_HERE_A1) {
      expect(placementOf(topic), `${topic} is not in the taxonomy`).toBeDefined();
      expect(GRAMMAR_RULES[topic], `${topic} has no rule`).toBeDefined();
    }
  });

  it('every topic is free at A1, so the path never leads to a paywall', () => {
    const locked = START_HERE_A1.filter((topic) => !isFreeGrammarTopic(topic, 'A1'));
    expect(locked).toEqual([]);
  });

  it('every topic has enough A1 questions to be completed', () => {
    const thin = START_HERE_A1.filter(
      (topic) => (TOPIC_INDEX[topic]?.countsByLevel.A1 ?? 0) < START_HERE_MIN_A1_QUESTIONS
    );
    expect(thin).toEqual([]);
  });
});

describe('startHere()', () => {
  it('marks the first step as next and the rest as todo for a new learner', () => {
    const { steps, done, complete } = startHere({});
    expect(steps.map((s) => s.topic)).toEqual([...START_HERE_A1]);
    expect(steps[0].state).toBe('next');
    expect(steps.slice(1).every((s) => s.state === 'todo')).toBe(true);
    expect(steps.every((s) => s.seen === 0)).toBe(true);
    expect(done).toBe(0);
    expect(complete).toBe(false);
  });

  it('links each step to the topic page scoped to A1', () => {
    const { steps } = startHere({});
    expect(steps[0].href).toBe(`/grammar/${START_HERE_A1[0]}?level=A1`);
  });

  it('uses the Norwegian rule title', () => {
    const { steps } = startHere({});
    expect(steps[0].title).toBe(GRAMMAR_RULES[START_HERE_A1[0]].titleNb);
  });

  it('counts practised A1 questions on the step but keeps it next until the target', () => {
    const ids = idsOf(START_HERE_A1[0], 'A1').slice(0, 3);
    const { steps } = startHere(mapOf(ids));
    expect(steps[0].seen).toBe(3);
    expect(steps[0].state).toBe('next');
    expect(steps[1].state).toBe('todo');
  });

  it('marks a step done at the target and moves next to the following step', () => {
    const ids = idsOf(START_HERE_A1[0], 'A1').slice(0, START_HERE_MIN_A1_QUESTIONS);
    const { steps, done } = startHere(mapOf(ids));
    expect(steps[0].state).toBe('done');
    expect(steps[1].state).toBe('next');
    expect(done).toBe(1);
  });

  it('caps seen at the target', () => {
    const ids = idsOf(START_HERE_A1[0], 'A1'); // may be more than the target
    const { steps } = startHere(mapOf(ids));
    expect(steps[0].seen).toBeLessThanOrEqual(START_HERE_MIN_A1_QUESTIONS);
  });

  it('keeps the first unfinished step as next even when a later one is done', () => {
    const later = idsOf(START_HERE_A1[2], 'A1').slice(0, START_HERE_MIN_A1_QUESTIONS);
    const { steps } = startHere(mapOf(later));
    expect(steps[0].state).toBe('next');
    expect(steps[2].state).toBe('done');
    expect(steps[1].state).toBe('todo');
  });

  it('ignores practice at other levels and on other topics', () => {
    const otherLevel = Object.entries(ID_INDEX)
      .filter(([, [t, l]]) => t === START_HERE_A1[0] && l !== 'A1')
      .map(([id]) => id);
    const offPath = Object.entries(ID_INDEX)
      .filter(([, [t, l]]) => l === 'A1' && !START_HERE_A1.includes(t))
      .map(([id]) => id)
      .slice(0, 20);
    const { steps, done } = startHere(mapOf([...otherLevel, ...offPath, 'gq-does-not-exist']));
    expect(steps.every((s) => s.seen === 0)).toBe(true);
    expect(done).toBe(0);
  });

  it('is complete, with no next step, when every step is done', () => {
    const all = START_HERE_A1.flatMap((topic) =>
      idsOf(topic, 'A1').slice(0, START_HERE_MIN_A1_QUESTIONS)
    );
    const { steps, done, complete } = startHere(mapOf(all));
    expect(steps.every((s) => s.state === 'done')).toBe(true);
    expect(done).toBe(START_HERE_A1.length);
    expect(complete).toBe(true);
  });
});
