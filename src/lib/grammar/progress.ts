// src/lib/grammar/progress.ts
// Derived grammar progress (ai-docs/implementation/grammar-update.md, Phase 3).
//
// Rolls the grammar progress map (keyed by question id, from
// loadGrammarProgressMap / loadGrammarProgressFromSupabase) up through the
// taxonomy: topic -> section -> chapter -> part. Every card's topic and level
// are resolved LIVE from its id (grammar/id-index.ts), never from the stored
// CardProgress.category/.level snapshot, which is stale for cards reviewed
// before the Phase 1b topic reorganisation. An id that no longer exists in
// grammar.json is dropped silently.
//
// Pure functions only (no I/O), so everything is unit-testable. Not to be
// confused with $lib/progress.ts (FSRS scheduling + persistence).

import type { CardProgress, CEFRLevel, GrammarTopic } from '$lib/types';
import { progressBucket } from '$lib/stats';
import grammarTopicIndex from '$lib/data/grammar-topic-index.json';
import { resolveGrammarQuestion } from './id-index';
import {
  GRAMMAR_TAXONOMY,
  type TaxonomyChapter,
  type TaxonomyPart,
  type TaxonomySection
} from './taxonomy';

// ── Level-estimate thresholds (decision: question-level, not book level) ────

/** Share of a level's questions that must be in the "review" (mastered) bucket. */
export const LEVEL_MASTERED_SHARE = 0.7;
/** Minimum number of seen questions at a level before it can count as reached. */
export const LEVEL_MIN_SEEN = 5;
/** Topics shown in weakSpots() by default. */
export const DEFAULT_WEAK_SPOT_COUNT = 5;

const LEVEL_ORDER: readonly CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C'];

// ── Types ───────────────────────────────────────────────────────────────────

/** Same buckets as StatRow in stats.ts; `review` is "mastered". */
export interface ProgressCounts {
  total: number;
  seen: number;
  review: number;
  learning: number;
  relearning: number;
  due: number;
}

export interface TopicProgress extends ProgressCounts {
  topic: GrammarTopic;
  /** Sum of FSRS lapses across this topic's seen cards. */
  lapses: number;
}

export interface SectionProgress extends ProgressCounts {
  section: TaxonomySection;
  topics: TopicProgress[];
}

export interface ChapterProgress extends ProgressCounts {
  chapter: TaxonomyChapter;
  sections: SectionProgress[];
}

export interface PartProgress extends ProgressCounts {
  part: TaxonomyPart;
  chapters: ChapterProgress[];
}

/** Seen / mastered / due / total per CEFR level, from each question's live level. */
export interface LevelProgress {
  total: number;
  seen: number;
  review: number;
  due: number;
}

export interface GrammarProgress {
  parts: PartProgress[];
  byTopic: Map<GrammarTopic, TopicProgress>;
  byLevel: Record<CEFRLevel, LevelProgress>;
  /** Roll-up over every topic. */
  overall: ProgressCounts;
}

export interface WeakSpot {
  topic: GrammarTopic;
  relearning: number;
  lapses: number;
  seen: number;
  /** Rule page for the topic. */
  href: string;
}

// ── Totals (from the build artifact, not by loading every question) ─────────

type TopicIndexEntry = {
  countsByLevel: Partial<Record<CEFRLevel, number>>;
  total: number;
};
const TOPIC_INDEX = grammarTopicIndex as Record<string, TopicIndexEntry>;

function emptyCounts(total = 0): ProgressCounts {
  return { total, seen: 0, review: 0, learning: 0, relearning: 0, due: 0 };
}

function addCounts(into: ProgressCounts, from: ProgressCounts): void {
  into.total += from.total;
  into.seen += from.seen;
  into.review += from.review;
  into.learning += from.learning;
  into.relearning += from.relearning;
  into.due += from.due;
}

function pickCounts(c: ProgressCounts): ProgressCounts {
  return {
    total: c.total,
    seen: c.seen,
    review: c.review,
    learning: c.learning,
    relearning: c.relearning,
    due: c.due
  };
}

// ── Roll-up ─────────────────────────────────────────────────────────────────

/**
 * Builds the full topic -> section -> chapter -> part roll-up from a grammar
 * progress map. `now` is injectable for tests.
 */
export function buildGrammarProgress(
  grammarMap: Record<string, CardProgress>,
  now: Date = new Date()
): GrammarProgress {
  // 1. Topic + level counters from the live-resolved cards.
  const byTopic = new Map<GrammarTopic, TopicProgress>();
  const byLevel = Object.fromEntries(
    LEVEL_ORDER.map((l) => [l, { total: 0, seen: 0, review: 0, due: 0 }])
  ) as Record<CEFRLevel, LevelProgress>;

  for (const entry of Object.values(TOPIC_INDEX)) {
    for (const [level, count] of Object.entries(entry.countsByLevel) as [CEFRLevel, number][]) {
      byLevel[level].total += count;
    }
  }

  const topicRow = (topic: GrammarTopic): TopicProgress => {
    let row = byTopic.get(topic);
    if (!row) {
      row = { ...emptyCounts(TOPIC_INDEX[topic]?.total ?? 0), topic, lapses: 0 };
      byTopic.set(topic, row);
    }
    return row;
  };

  for (const [id, card] of Object.entries(grammarMap)) {
    const resolved = resolveGrammarQuestion(id);
    if (!resolved) continue; // question no longer exists

    const row = topicRow(resolved.topic);
    const bucket = progressBucket(card);
    row.seen++;
    row[bucket]++;
    row.lapses += card.fsrs.lapses ?? 0;
    const isDue = new Date(card.fsrs.due) <= now;
    if (isDue) row.due++;

    const lvl = byLevel[resolved.level];
    lvl.seen++;
    if (bucket === 'review') lvl.review++;
    if (isDue) lvl.due++;
  }

  // 2. Roll up through the taxonomy. Primary placement only (ALSO_IN never
  //    double-counts a topic).
  const overall = emptyCounts();
  const parts: PartProgress[] = GRAMMAR_TAXONOMY.map((part) => {
    const partCounts = emptyCounts();
    const chapters: ChapterProgress[] = part.chapters.map((chapter) => {
      const chapterCounts = emptyCounts();
      const sections: SectionProgress[] = chapter.sections.map((section) => {
        const sectionCounts = emptyCounts();
        const topics = section.topics.map((topic) => {
          const row = topicRow(topic);
          addCounts(sectionCounts, row);
          return row;
        });
        addCounts(chapterCounts, sectionCounts);
        return { section, topics, ...sectionCounts };
      });
      addCounts(partCounts, chapterCounts);
      return { chapter, sections, ...chapterCounts };
    });
    addCounts(overall, partCounts);
    return { part, chapters, ...partCounts };
  });

  return { parts, byTopic, byLevel, overall: pickCounts(overall) };
}

// ── Weak spots ──────────────────────────────────────────────────────────────

/**
 * Topics ranked by how much the learner struggles with them: cards currently
 * in "relearning" first, then total FSRS lapses, then topic id as a stable
 * tie-break. Topics with no relearning cards and no lapses are never listed.
 */
export function weakSpots(progress: GrammarProgress, n = DEFAULT_WEAK_SPOT_COUNT): WeakSpot[] {
  return [...progress.byTopic.values()]
    .filter((t) => t.relearning > 0 || t.lapses > 0)
    .sort(
      (a, b) => b.relearning - a.relearning || b.lapses - a.lapses || a.topic.localeCompare(b.topic)
    )
    .slice(0, Math.max(0, n))
    .map((t) => ({
      topic: t.topic,
      relearning: t.relearning,
      lapses: t.lapses,
      seen: t.seen,
      href: `/grammar/${t.topic}`
    }));
}

// ── Level estimate ──────────────────────────────────────────────────────────

/** True when a level meets both thresholds. */
export function isLevelReached(level: LevelProgress): boolean {
  if (level.total === 0) return false;
  return level.seen >= LEVEL_MIN_SEEN && level.review / level.total >= LEVEL_MASTERED_SHARE;
}

/**
 * Highest CEFR level reached, where every lower level is also reached.
 * Question-level, not book-level (grammar-update.md decision #12: the book's
 * level is only a recommended entry level). Null until A1 is reached.
 */
export function estimateGrammarLevel(byLevel: Record<CEFRLevel, LevelProgress>): CEFRLevel | null {
  let reached: CEFRLevel | null = null;
  for (const level of LEVEL_ORDER) {
    if (!isLevelReached(byLevel[level])) break;
    reached = level;
  }
  return reached;
}
