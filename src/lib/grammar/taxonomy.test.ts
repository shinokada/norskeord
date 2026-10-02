// src/lib/grammar/taxonomy.test.ts
// Integrity tests for the grammar taxonomy (Phase 1 of
// ai-docs/implementation/grammar-update.md). The taxonomy is the single
// source of truth for hierarchy and order, so these tests make sure no topic
// is orphaned, duplicated or mistyped, and that the derived lookups behave.

import { describe, it, expect } from 'vitest';
import grammarData from '$lib/data/grammar.json';
import type { GrammarQuestion, GrammarTopic } from '$lib/types';
import { GRAMMAR_RULES } from './rules';
import {
  GRAMMAR_TAXONOMY,
  ALSO_IN,
  adjacentTopics,
  chapterBySlug,
  orderedTopics,
  placementOf,
  sectionById,
  sectionsAlsoCovering,
  topicsAlsoIn
} from './taxonomy';

const questions = grammarData as GrammarQuestion[];

const allChapters = GRAMMAR_TAXONOMY.flatMap((p) => p.chapters);
const allSections = allChapters.flatMap((c) => c.sections);
const placedTopics = allSections.flatMap((s) => s.topics);

describe('taxonomy: topic coverage', () => {
  it('every GRAMMAR_RULES id appears exactly once as a primary topic', () => {
    const counts = new Map<string, number>();
    for (const t of placedTopics) counts.set(t, (counts.get(t) ?? 0) + 1);

    const missing = Object.keys(GRAMMAR_RULES).filter((id) => !counts.has(id));
    const duplicated = [...counts.entries()].filter(([, n]) => n > 1).map(([t]) => t);

    expect(missing).toEqual([]);
    expect(duplicated).toEqual([]);
  });

  it('every taxonomy topic has a GRAMMAR_RULES entry (no unknown ids)', () => {
    const unknown = placedTopics.filter((t) => !GRAMMAR_RULES[t]);
    expect(unknown).toEqual([]);
  });

  it('every topic used in grammar.json is in the taxonomy', () => {
    const placed = new Set<string>(placedTopics);
    const orphans = [...new Set(questions.map((q) => q.topic))].filter((t) => !placed.has(t));
    expect(orphans).toEqual([]);
  });

  it('every taxonomy topic has at least one question', () => {
    const used = new Set<string>(questions.map((q) => q.topic));
    const empty = placedTopics.filter((t) => !used.has(t));
    expect(empty).toEqual([]);
  });
});

describe('taxonomy: structure', () => {
  it('parts are numbered 1..4 in order', () => {
    expect(GRAMMAR_TAXONOMY.map((p) => p.no)).toEqual([1, 2, 3, 4]);
  });

  it('chapters are numbered consecutively 1..N across all parts', () => {
    expect(allChapters.map((c) => c.no)).toEqual(allChapters.map((_, i) => i + 1));
  });

  it('chapter slugs are unique and URL-safe', () => {
    const slugs = allChapters.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('section ids are unique and numbered <chapter>.<n> sequentially', () => {
    const ids = allSections.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);

    for (const chapter of allChapters) {
      expect(chapter.sections.map((s) => s.id)).toEqual(
        chapter.sections.map((_, i) => `${chapter.no}.${i + 1}`)
      );
    }
  });

  it('every section has titles and a valid entry level', () => {
    for (const s of allSections) {
      expect(s.titleNb.trim()).not.toBe('');
      expect(s.titleEn.trim()).not.toBe('');
      expect(['base', 'B1', 'B2']).toContain(s.entry);
    }
  });
});

describe('taxonomy: ALSO_IN cross-references', () => {
  it('only references topics that exist and sections that exist', () => {
    const placed = new Set<string>(placedTopics);
    const badTopics = Object.keys(ALSO_IN).filter((t) => !placed.has(t));
    expect(badTopics).toEqual([]);

    const badSections = Object.entries(ALSO_IN).flatMap(([topic, ids]) =>
      (ids ?? []).filter((id) => !sectionById(id)).map((id) => `${topic} -> ${id}`)
    );
    expect(badSections).toEqual([]);
  });

  it("never repeats the topic's own primary section or lists a section twice", () => {
    const problems: string[] = [];
    for (const [topic, ids] of Object.entries(ALSO_IN) as [GrammarTopic, string[]][]) {
      const own = placementOf(topic)?.section.id;
      if (own && ids.includes(own)) problems.push(`${topic} lists its own section ${own}`);
      if (new Set(ids).size !== ids.length) problems.push(`${topic} has duplicate entries`);
    }
    expect(problems).toEqual([]);
  });
});

describe('taxonomy: lookups', () => {
  it('orderedTopics returns every topic once, in taxonomy order', () => {
    const ordered = orderedTopics();
    expect(ordered).toEqual(placedTopics);
    expect(ordered.length).toBe(Object.keys(GRAMMAR_RULES).length);
  });

  it('orderedTopics returns a copy (mutating it does not affect the taxonomy)', () => {
    const a = orderedTopics();
    a.pop();
    expect(orderedTopics().length).toBe(placedTopics.length);
  });

  it('placementOf resolves part, chapter and section', () => {
    const p = placementOf('noun-plurals');
    expect(p?.section.id).toBe('7.2');
    expect(p?.chapter.slug).toBe('substantiv');
    expect(p?.part.no).toBe(2);
  });

  it('adjacentTopics walks the learning order and is null at the ends', () => {
    const ordered = orderedTopics();
    const first = ordered[0];
    const last = ordered[ordered.length - 1];

    expect(adjacentTopics(first).prev).toBeNull();
    expect(adjacentTopics(first).next).toBe(ordered[1]);
    expect(adjacentTopics(last).next).toBeNull();
    expect(adjacentTopics(last).prev).toBe(ordered[ordered.length - 2]);
    expect(adjacentTopics('not-a-topic' as GrammarTopic)).toEqual({ prev: null, next: null });
  });

  it('chapterBySlug and sectionById find known entries and return undefined otherwise', () => {
    expect(chapterBySlug('verb')?.no).toBe(11);
    expect(chapterBySlug('nope')).toBeUndefined();
    expect(sectionById('11.5')?.titleNb).toBe('Modale verb');
    expect(sectionById('99.9')).toBeUndefined();
  });

  it('sectionsAlsoCovering and topicsAlsoIn are consistent with ALSO_IN', () => {
    expect(sectionsAlsoCovering('imperativ').map((s) => s.id)).toEqual(['11.9']);
    expect(sectionsAlsoCovering('presens-verb')).toEqual([]);
    expect(topicsAlsoIn('11.9')).toContain('imperativ');
  });
});
