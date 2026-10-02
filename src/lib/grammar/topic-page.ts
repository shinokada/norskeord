// src/lib/grammar/topic-page.ts
// View-model helpers for /grammar/[topic] (ai-docs/implementation/grammar-update.md,
// Phase 6a: Regel/Øv layout, breadcrumb, prev/next and related topics).
//
// Pure functions only, so everything is unit-testable. Access (free / Plus) is
// not decided here; the page keeps using its existing per-question gating.

import type { CardProgress, GrammarTopic } from '$lib/types';
import { GRAMMAR_RULES } from './rules';
import {
  adjacentTopics,
  placementOf,
  sectionsAlsoCovering,
  topicsAlsoIn,
  type TaxonomyChapter,
  type TaxonomyPart,
  type TaxonomySection
} from './taxonomy';

// ── Regel / Øv tabs ────────────────────────────────────────────────────────────────────────────

export type TopicTab = 'rule' | 'practice';

/** `?tab=` value to a tab, or null when absent or invalid. */
export function parseTabParam(raw: string | null | undefined): TopicTab | null {
  return raw === 'rule' || raw === 'practice' ? raw : null;
}

/**
 * Which tab to open when the learner has not chosen one: returning learners
 * with due cards go straight to practice, everyone else starts with the rule.
 */
export function defaultTab(dueCount: number): TopicTab {
  return dueCount > 0 ? 'practice' : 'rule';
}

/** The entries of `map` whose key is in `ids` (a topic's slice of the progress map). */
export function pickProgress(
  ids: Iterable<string>,
  map: Record<string, CardProgress>
): Record<string, CardProgress> {
  const out: Record<string, CardProgress> = {};
  for (const id of ids) {
    if (map[id]) out[id] = map[id];
  }
  return out;
}

// ── Breadcrumb, prev/next, related ─────────────────────────────────────────────────────────────

export interface TopicLink {
  topic: GrammarTopic;
  /** Norwegian rule title (grammar content is Norwegian-only). */
  title: string;
}

export interface TopicNavModel {
  part: TaxonomyPart;
  chapter: TaxonomyChapter;
  section: TaxonomySection;
  /** Previous / next topic in book order (across chapters), null at either end. */
  prev: TopicLink | null;
  next: TopicLink | null;
  /** Other topics worth reading next to this one, without prev/next or duplicates. */
  related: TopicLink[];
}

export const MAX_RELATED = 4;

function linkFor(topic: GrammarTopic): TopicLink | null {
  const rule = GRAMMAR_RULES[topic];
  return rule ? { topic, title: rule.titleNb } : null;
}

/**
 * Related topics, most relevant first:
 *   1. siblings in the same section,
 *   2. topics in the sections this topic also covers (`ALSO_IN`),
 *   3. topics that list this topic's own section as an also-in.
 * The topic itself and `exclude` (prev/next, shown separately) are left out.
 */
export function relatedTopics(
  topic: GrammarTopic,
  exclude: readonly GrammarTopic[] = [],
  max = MAX_RELATED
): TopicLink[] {
  const placement = placementOf(topic);
  if (!placement) return [];

  const candidates: GrammarTopic[] = [
    ...placement.section.topics,
    ...sectionsAlsoCovering(topic).flatMap((s) => s.topics),
    ...topicsAlsoIn(placement.section.id)
  ];

  const skip = new Set<GrammarTopic>([topic, ...exclude]);
  const out: TopicLink[] = [];
  for (const candidate of candidates) {
    if (skip.has(candidate)) continue;
    skip.add(candidate);
    const link = linkFor(candidate);
    if (link) out.push(link);
    if (out.length >= max) break;
  }
  return out;
}

/** Everything the breadcrumb and the prev/next/related block render. Null for an unplaced topic. */
export function topicNavModel(topic: GrammarTopic): TopicNavModel | null {
  const placement = placementOf(topic);
  if (!placement) return null;

  const { prev, next } = adjacentTopics(topic);
  const exclude = [prev, next].filter((t): t is GrammarTopic => t !== null);

  return {
    ...placement,
    prev: prev ? linkFor(prev) : null,
    next: next ? linkFor(next) : null,
    related: relatedTopics(topic, exclude)
  };
}
