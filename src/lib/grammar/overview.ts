// src/lib/grammar/overview.ts
// View-model for /grammar and /grammar/chapter/[slug]
// (ai-docs/implementation/grammar-update.md, Phase 5).
//
// Combines three existing sources into the book-ordered map the pages render:
//   - taxonomy.ts                  Parts > chapters > sections > topics
//   - grammar-topic-index.json     per-topic levels and question counts
//   - $lib/access                  free / Plus state per (topic, level)
//
// Decisions it implements (see the doc):
//   #18  chapters and sections with no topic are hidden
//   #19  a CEFR level filter hides topics with no questions at that level
//        (book order is kept, counts are scoped to the level)
//   #20  access is a per-topic state; the page shows it inline
//
// Pure functions only, so everything is unit-testable.

import grammarTopicIndex from '$lib/data/grammar-topic-index.json';
import { freeGrammarQuestionIds, groupTopicLevelsByAccess, isFreeGrammarTopic } from '$lib/access';
import type { CEFRLevel, GrammarQuestion, GrammarTopic } from '$lib/types';
import { GRAMMAR_RULES } from './rules';
import { plainSummary } from './summary';
import {
  GRAMMAR_TAXONOMY,
  orderedTopics,
  placementOf,
  type TaxonomyChapter,
  type TaxonomyPart,
  type TaxonomySection
} from './taxonomy';

export const CEFR_ORDER: readonly CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C'];

type TopicIndexEntry = {
  levels: CEFRLevel[];
  countsByLevel: Partial<Record<CEFRLevel, number>>;
  total: number;
};
const TOPIC_INDEX = grammarTopicIndex as Record<string, TopicIndexEntry>;

/** free: everything shown is free; locked: all Plus; mixed: some levels free. */
export type AccessState = 'free' | 'mixed' | 'locked';

export interface TopicEntry {
  topic: GrammarTopic;
  /** Norwegian rule title (grammar content is Norwegian-only). */
  title: string;
  /** Plain-text preview of the rule, no markdown. */
  summary: string;
  /** Levels with questions (just the active level when filtering). */
  levels: CEFRLevel[];
  /** Question count (scoped to the active level when filtering). */
  total: number;
  access: AccessState;
  /** The subset of `levels` that is free. */
  freeLevels: CEFRLevel[];
}

export interface SectionEntry {
  section: TaxonomySection;
  topics: TopicEntry[];
}

export interface ChapterEntry {
  part: TaxonomyPart;
  chapter: TaxonomyChapter;
  /** Only sections that have at least one visible topic. */
  sections: SectionEntry[];
  /** Flat list of the visible topics, in book order. */
  topics: TopicEntry[];
  total: number;
  levels: CEFRLevel[];
  access: AccessState;
}

export interface PartEntry {
  part: TaxonomyPart;
  chapters: ChapterEntry[];
}

export interface SearchHit {
  entry: TopicEntry;
  part: TaxonomyPart;
  chapter: TaxonomyChapter;
  section: TaxonomySection;
}

const sortLevels = (levels: Iterable<CEFRLevel>): CEFRLevel[] => {
  const present = new Set(levels);
  return CEFR_ORDER.filter((l) => present.has(l));
};

function combineAccess(states: AccessState[]): AccessState {
  if (states.length > 0 && states.every((s) => s === 'free')) return 'free';
  if (states.length > 0 && states.every((s) => s === 'locked')) return 'locked';
  return 'mixed';
}

/**
 * One topic as the pages show it. With `level` set, the entry is scoped to
 * that level: counts, levels and access all describe just that level.
 * Returns null when the topic has no questions (at that level).
 */
export function topicEntry(topic: GrammarTopic, level: CEFRLevel | null = null): TopicEntry | null {
  const idx = TOPIC_INDEX[topic];
  if (!idx) return null;

  const total = level ? (idx.countsByLevel[level] ?? 0) : idx.total;
  if (total === 0) return null;

  const levels = level ? [level] : sortLevels(idx.levels);
  const freeLevels = levels.filter((l) => isFreeGrammarTopic(topic, l));
  const access: AccessState =
    freeLevels.length === levels.length ? 'free' : freeLevels.length === 0 ? 'locked' : 'mixed';

  const rule = GRAMMAR_RULES[topic];
  return {
    topic,
    title: rule ? rule.titleNb : topic,
    summary: rule ? plainSummary(rule.explanationNb) : '',
    levels,
    total,
    access,
    freeLevels
  };
}

/** A chapter with its visible sections/topics, or null if nothing is visible. */
export function buildChapter(
  part: TaxonomyPart,
  chapter: TaxonomyChapter,
  level: CEFRLevel | null = null
): ChapterEntry | null {
  const sections: SectionEntry[] = [];
  for (const section of chapter.sections) {
    const topics = section.topics
      .map((t) => topicEntry(t, level))
      .filter((e): e is TopicEntry => e !== null);
    if (topics.length > 0) sections.push({ section, topics });
  }

  const topics = sections.flatMap((s) => s.topics);
  if (topics.length === 0) return null;

  return {
    part,
    chapter,
    sections,
    topics,
    total: topics.reduce((sum, t) => sum + t.total, 0),
    levels: sortLevels(topics.flatMap((t) => t.levels)),
    access: combineAccess(topics.map((t) => t.access))
  };
}

/** The whole map in book order, without empty chapters or parts. */
export function buildGrammarMap(level: CEFRLevel | null = null): PartEntry[] {
  return GRAMMAR_TAXONOMY.map((part) => ({
    part,
    chapters: part.chapters
      .map((chapter) => buildChapter(part, chapter, level))
      .filter((c): c is ChapterEntry => c !== null)
  })).filter((p) => p.chapters.length > 0);
}

/**
 * Topics whose title or explanation contains `query`, in book order, each with
 * its placement for a breadcrumb. Same matching as the old flat list.
 */
export function searchTopics(query: string, level: CEFRLevel | null = null): SearchHit[] {
  const term = query.trim().toLowerCase();
  if (!term) return [];

  const hits: SearchHit[] = [];
  for (const topic of orderedTopics()) {
    const rule = GRAMMAR_RULES[topic];
    const title = rule ? rule.titleNb : topic;
    const explanation = rule ? rule.explanationNb : '';
    if (!title.toLowerCase().includes(term) && !explanation.toLowerCase().includes(term)) continue;

    const entry = topicEntry(topic, level);
    const placement = placementOf(topic);
    if (!entry || !placement) continue;
    hits.push({ entry, ...placement });
  }
  return hits;
}

/**
 * Number of Plus-locked (topic, access) segments, optionally limited to one
 * level. Same count the old /grammar upsell banner used.
 */
export function countLockedSegments(level: CEFRLevel | null = null): number {
  let count = 0;
  for (const [topic, idx] of Object.entries(TOPIC_INDEX)) {
    for (const seg of groupTopicLevelsByAccess(topic as GrammarTopic, idx.levels)) {
      if (seg.access === 'locked' && (!level || seg.levels.includes(level))) count++;
    }
  }
  return count;
}

/** Where a topic card links. Fully locked topics send free users to /plus. */
export function topicHref(
  entry: TopicEntry,
  opts: { level: CEFRLevel | null; isPlus: boolean; from?: string | null }
): string {
  if (entry.access === 'locked' && !opts.isPlus) return '/plus?ref=grammar-topics';
  const base = `/grammar/${entry.topic}`;
  if (!opts.level) return base;
  return `${base}?level=${opts.level}${opts.from ? `&from=${opts.from}` : ''}`;
}

/** Where a chapter card links; the active level chip is carried along. */
export function chapterHref(slug: string, level: CEFRLevel | null = null): string {
  return level ? `/grammar/chapter/${slug}?level=${level}` : `/grammar/chapter/${slug}`;
}

// ── Chapter page (/grammar/chapter/[slug]) ────────────────────────────────────────────────────

/** `?level=` value (any case) to a CEFR level, or null when absent or invalid. */
export function parseLevelParam(raw: string | null | undefined): CEFRLevel | null {
  const upper = (raw ?? '').toUpperCase();
  return CEFR_ORDER.find((l) => l === upper) ?? null;
}

/**
 * The chapter with this slug as the page shows it, optionally scoped to one
 * level. Null when the slug is unknown, when the chapter has no topic yet
 * (hidden, decision #18), or when it has no questions at `level`.
 */
export function chapterEntryBySlug(
  slug: string,
  level: CEFRLevel | null = null
): ChapterEntry | null {
  for (const part of GRAMMAR_TAXONOMY) {
    const chapter = part.chapters.find((c) => c.slug === slug);
    if (chapter) return buildChapter(part, chapter, level);
  }
  return null;
}

/** Topics in the chapter that are not fully free (locked or mixed). */
export function countLockedTopics(entry: ChapterEntry): number {
  return entry.topics.filter((t) => t.access !== 'free').length;
}

/**
 * Questions a learner can practise when mixing a chapter's topics: only the
 * chapter's topics, and for free users only the free ones (same rule as the
 * single-topic page: non-plusOnly and free per (topic, level)).
 */
export function chapterPlayable(
  questions: GrammarQuestion[],
  topics: readonly string[],
  opts: { isPlus: boolean }
): GrammarQuestion[] {
  const inChapter = questions.filter((q) => topics.includes(q.topic));
  if (opts.isPlus) return inChapter;
  const free = freeGrammarQuestionIds(inChapter);
  return inChapter.filter((q) => free.has(q.id));
}
