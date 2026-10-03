// src/lib/grammar/overview.test.ts
// Phase 5 (grammar-update.md): book-ordered map, level filter, search, links.
// Expected numbers are derived from the data files, never hard-coded, so the
// tests keep holding as content is added.

import { describe, it, expect } from 'vitest';
import grammarData from '$lib/data/grammar.json';
import grammarTopicIndex from '$lib/data/grammar-topic-index.json';
import { isFreeGrammarTopic } from '$lib/access';
import type { CEFRLevel, GrammarQuestion, GrammarTopic } from '$lib/types';
import { GRAMMAR_RULES } from './rules';
import { GRAMMAR_TAXONOMY, orderedTopics, chapterBySlug } from './taxonomy';
import {
  buildChapter,
  buildGrammarMap,
  chapterEntryBySlug,
  chapterHref,
  chapterPlayable,
  countLockedSegments,
  countLockedTopics,
  parseLevelParam,
  searchTopics,
  topicEntry,
  topicHref
} from './overview';

type IndexEntry = { countsByLevel: Partial<Record<CEFRLevel, number>>; total: number };
const INDEX = grammarTopicIndex as Record<string, IndexEntry>;
const LEVELS: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C'];

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

describe('buildGrammarMap (no filter)', () => {
  const map = buildGrammarMap();
  const chapters = map.flatMap((p) => p.chapters);

  it('hides chapters and sections with no topic', () => {
    for (const c of chapters) {
      expect(c.topics.length, c.chapter.slug).toBeGreaterThan(0);
      for (const s of c.sections) expect(s.topics.length, s.section.id).toBeGreaterThan(0);
    }
    const withTopics = GRAMMAR_TAXONOMY.flatMap((p) => p.chapters).filter((c) =>
      c.sections.some((s) => s.topics.length > 0)
    );
    expect(chapters.map((c) => c.chapter.slug)).toEqual(withTopics.map((c) => c.slug));
  });

  it('keeps book order', () => {
    expect(chapters.map((c) => c.chapter.no)).toEqual(
      [...chapters.map((c) => c.chapter.no)].sort((a, b) => a - b)
    );
    expect(chapters.flatMap((c) => c.topics.map((t) => t.topic))).toEqual(orderedTopics());
  });

  it('counts every question exactly once', () => {
    const fromIndex = sum(Object.values(INDEX).map((e) => e.total));
    expect(sum(chapters.map((c) => c.total))).toBe(fromIndex);
  });

  it('gives each chapter its level range in CEFR order', () => {
    for (const c of chapters) {
      const idx = c.levels.map((l) => LEVELS.indexOf(l));
      expect(idx).toEqual([...idx].sort((a, b) => a - b));
      expect(c.levels.length).toBeGreaterThan(0);
    }
  });
});

describe('buildGrammarMap (level filter)', () => {
  it.each(LEVELS)('%s: only topics with questions at that level, counts scoped', (level) => {
    const topics = buildGrammarMap(level).flatMap((p) => p.chapters.flatMap((c) => c.topics));
    for (const t of topics) {
      expect(t.levels).toEqual([level]);
      expect(t.total).toBe(INDEX[t.topic].countsByLevel[level]);
      expect(t.total).toBeGreaterThan(0);
    }
    const expected = sum(Object.values(INDEX).map((e) => e.countsByLevel[level] ?? 0));
    expect(sum(topics.map((t) => t.total))).toBe(expected);
  });

  it('drops a chapter when none of its topics has questions at the level', () => {
    const slugsAtA1 = buildGrammarMap('A1').flatMap((p) => p.chapters.map((c) => c.chapter.slug));
    const slugsAll = buildGrammarMap().flatMap((p) => p.chapters.map((c) => c.chapter.slug));
    expect(slugsAtA1.length).toBeLessThan(slugsAll.length);
    expect(slugsAll).toEqual(expect.arrayContaining(slugsAtA1));
  });
});

describe('topicEntry access', () => {
  it('noun-plurals: mixed unfiltered, free at A1, locked at B1', () => {
    const all = topicEntry('noun-plurals')!;
    expect(all.access).toBe('mixed');
    expect(all.freeLevels).toEqual(['A1']);
    expect(topicEntry('noun-plurals', 'A1')!.access).toBe('free');
    expect(topicEntry('noun-plurals', 'B1')!.access).toBe('locked');
  });

  it('returns null for a level the topic has no questions at', () => {
    expect(topicEntry('svar-ja-jo-nei', 'A1')).toBeNull(); // B2 only
  });

  it('has a plain-text summary and the Norwegian title', () => {
    const e = topicEntry('sporresetninger')!;
    expect(e.title).toBe(GRAMMAR_RULES['sporresetninger'].titleNb);
    expect(e.summary).not.toContain('**');
    expect(e.summary.length).toBeGreaterThan(0);
  });
});

describe('topic glosses', () => {
  it('every topic in the taxonomy has an English gloss that differs from the Norwegian title', () => {
    const bad = orderedTopics().filter((topic) => {
      const e = topicEntry(topic);
      if (!e) return false; // a topic with no questions is not shown anywhere
      return !e.titleEn || e.titleEn.toLowerCase() === e.title.trim().toLowerCase();
    });
    expect(bad).toEqual([]);
  });

  it('uses the rule\u2019s titleEn, trimmed', () => {
    const e = topicEntry('sporresetninger')!;
    expect(e.titleEn).toBe(GRAMMAR_RULES['sporresetninger'].titleEn.trim());
  });
});

describe('buildChapter', () => {
  it('returns null for a chapter with no topics (chapter 6 and 15 today)', () => {
    const empty = GRAMMAR_TAXONOMY.flatMap((p) =>
      p.chapters.filter((c) => c.sections.every((s) => s.topics.length === 0))
    );
    for (const c of empty) {
      const part = GRAMMAR_TAXONOMY.find((p) => p.chapters.includes(c))!;
      expect(buildChapter(part, c)).toBeNull();
    }
  });

  it('groups sections in book order for a real chapter', () => {
    const ch = chapterBySlug('helsetninger')!;
    const part = GRAMMAR_TAXONOMY.find((p) => p.chapters.includes(ch))!;
    const entry = buildChapter(part, ch)!;
    expect(entry.sections.map((s) => s.section.id)).toEqual(
      ch.sections.filter((s) => s.topics.length > 0).map((s) => s.id)
    );
  });
});

describe('searchTopics', () => {
  it('finds a topic by its title, with its placement, in the right chapter', () => {
    const title = GRAMMAR_RULES['sporresetninger'].titleNb;
    const hit = searchTopics(title).find((h) => h.entry.topic === 'sporresetninger')!;
    expect(hit).toBeDefined();
    expect(hit.chapter.slug).toBe('helsetninger');
    expect(hit.section.id).toBe('2.2');
  });

  it('respects the level filter', () => {
    const title = GRAMMAR_RULES['sporresetninger'].titleNb;
    // sporresetninger has A1/A2/B1 questions only.
    expect(searchTopics(title, 'C').some((h) => h.entry.topic === 'sporresetninger')).toBe(false);
    expect(searchTopics(title, 'A1').some((h) => h.entry.topic === 'sporresetninger')).toBe(true);
  });

  it('returns nothing for an empty or whitespace query', () => {
    expect(searchTopics('')).toEqual([]);
    expect(searchTopics('   ')).toEqual([]);
  });

  it('returns hits in book order', () => {
    const order = orderedTopics();
    const hits = searchTopics('er').map((h) => order.indexOf(h.entry.topic as GrammarTopic));
    expect(hits).toEqual([...hits].sort((a, b) => a - b));
  });
});

describe('countLockedSegments', () => {
  it('is positive overall and zero at A1 (every A1 topic is free at A1)', () => {
    expect(countLockedSegments()).toBeGreaterThan(0);
    expect(countLockedSegments('A1')).toBe(0);
  });
});

describe('links', () => {
  const free = topicEntry('noun-plurals', 'A1')!;
  const locked = topicEntry('noun-plurals', 'B1')!;

  it('sends a free user to /plus for a fully locked topic, a Plus user into it', () => {
    expect(topicHref(locked, { level: 'B1', isPlus: false })).toBe('/plus?ref=grammar-topics');
    expect(topicHref(locked, { level: 'B1', isPlus: true })).toBe('/grammar/noun-plurals?level=B1');
  });

  it('links free and mixed topics straight to the topic page', () => {
    expect(topicHref(free, { level: null, isPlus: false })).toBe('/grammar/noun-plurals');
    expect(topicHref(topicEntry('noun-plurals')!, { level: null, isPlus: false })).toBe(
      '/grammar/noun-plurals'
    );
  });

  it('forwards ?level= and ?from=', () => {
    expect(topicHref(free, { level: 'A1', isPlus: false })).toBe('/grammar/noun-plurals?level=A1');
    expect(topicHref(free, { level: 'A1', isPlus: false, from: 'a1' })).toBe(
      '/grammar/noun-plurals?level=A1&from=a1'
    );
  });

  it('builds chapter links with the active level', () => {
    expect(chapterHref('substantiv')).toBe('/grammar/chapter/substantiv');
    expect(chapterHref('substantiv', 'B1')).toBe('/grammar/chapter/substantiv?level=B1');
  });
});

describe('parseLevelParam', () => {
  it('accepts any case and rejects everything else', () => {
    expect(parseLevelParam('b1')).toBe('B1');
    expect(parseLevelParam('C')).toBe('C');
    expect(parseLevelParam('c1')).toBeNull();
    expect(parseLevelParam('')).toBeNull();
    expect(parseLevelParam(null)).toBeNull();
    expect(parseLevelParam(undefined)).toBeNull();
  });
});

describe('chapterEntryBySlug', () => {
  it('returns the chapter in book order for a known slug', () => {
    const entry = chapterEntryBySlug('helsetninger')!;
    expect(entry.chapter.slug).toBe('helsetninger');
    expect(entry.topics.length).toBeGreaterThan(0);
  });

  it('returns null for an unknown slug', () => {
    expect(chapterEntryBySlug('no-such-chapter')).toBeNull();
  });

  it('returns null for a chapter with no topic yet (hidden, decision #18)', () => {
    const empty = GRAMMAR_TAXONOMY.flatMap((p) => p.chapters).filter((c) =>
      c.sections.every((s) => s.topics.length === 0)
    );
    for (const c of empty) expect(chapterEntryBySlug(c.slug), c.slug).toBeNull();
  });

  it('scopes to a level, and is null when the chapter has nothing at that level', () => {
    const scoped = chapterEntryBySlug('helsetninger', 'A1')!;
    expect(scoped.topics.every((t) => t.levels.length === 1 && t.levels[0] === 'A1')).toBe(true);
    const slugs = GRAMMAR_TAXONOMY.flatMap((p) => p.chapters.map((c) => c.slug));
    const nothingAtA1 = slugs.filter(
      (s) => chapterEntryBySlug(s) !== null && chapterEntryBySlug(s, 'A1') === null
    );
    expect(nothingAtA1.length).toBeGreaterThan(0);
  });
});

describe('countLockedTopics', () => {
  it('is zero for every chapter at A1 (every A1 topic is free at A1)', () => {
    for (const part of buildGrammarMap('A1')) {
      for (const c of part.chapters) expect(countLockedTopics(c), c.chapter.slug).toBe(0);
    }
  });

  it('counts locked and mixed topics unfiltered', () => {
    const total = buildGrammarMap().flatMap((p) => p.chapters);
    expect(total.some((c) => countLockedTopics(c) > 0)).toBe(true);
  });
});

describe('chapterPlayable', () => {
  const all = grammarData as GrammarQuestion[];
  const entry = chapterEntryBySlug('helsetninger')!;
  const topics = entry.topics.map((t) => t.topic);

  it('gives Plus every question of the chapter\u2019s topics and nothing else', () => {
    const plus = chapterPlayable(all, topics, { isPlus: true });
    expect(plus.length).toBe(sum(topics.map((t) => INDEX[t].total)));
    expect(plus.every((q) => topics.includes(q.topic))).toBe(true);
  });

  it('gives free users only free, non-plusOnly questions', () => {
    const free = chapterPlayable(all, topics, { isPlus: false });
    expect(free.length).toBeGreaterThan(0); // sporresetninger is free at A1
    expect(free.length).toBeLessThan(chapterPlayable(all, topics, { isPlus: true }).length);
    for (const q of free) {
      expect(q.plusOnly).toBeFalsy();
      expect(isFreeGrammarTopic(q.topic, q.cefr)).toBe(true);
    }
  });
});
