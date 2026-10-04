// src/lib/admin/topicGroups.test.ts
import { describe, it, expect } from 'vitest';
import { orderedTopics } from '$lib/grammar/taxonomy';
import { topicGroups } from './topicGroups';

describe('topicGroups', () => {
  const groups = topicGroups();

  it('lists exactly the taxonomy topics, once each, in book order', () => {
    expect(groups.flatMap((g) => g.topics)).toEqual(orderedTopics());
  });

  it('has no empty groups', () => {
    for (const g of groups) expect(g.topics.length, g.label).toBeGreaterThan(0);
  });

  it('keeps chapters in book order, with a unique label each', () => {
    const nos = groups.map((g) => g.no);
    expect(nos).toEqual([...nos].sort((a, b) => a - b));
    expect(new Set(groups.map((g) => g.label)).size).toBe(groups.length);
  });

  it('labels a group with its chapter number and Norwegian title', () => {
    for (const g of groups) expect(g.label.startsWith(`${g.no} · `), g.label).toBe(true);
  });
});
