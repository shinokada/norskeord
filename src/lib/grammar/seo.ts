// src/lib/grammar/seo.ts
// Search-engine rules for /grammar/[topic] (ai-docs/implementation/grammar-update.md,
// Phase 6b).
//
// Indexable = the topic has free A1 content (decision #2: A1 grammar is free).
// Everything else stays out of the sitemap and gets `noindex` until the Plus
// teaser (6c) exists, so crawlers don't index a bare lock screen.
//
// Pure and side-effect free; the route load and the sitemap both call it.

import type { MetaProps } from 'runes-meta-tags';
import type { GrammarTopic } from '$lib/types';
import { isFreeGrammarTopic } from '$lib/access';
import { FREE_GRAMMAR_TOPICS } from '$lib/config';
import { GRAMMAR_RULES } from './rules';
import { plainSummary } from './summary';

export const META_DESCRIPTION_MAX = 155;

/** True when the topic has a rule and free A1 content, so its page may be indexed. */
export function isIndexableTopic(topic: GrammarTopic): boolean {
  return !!GRAMMAR_RULES[topic] && isFreeGrammarTopic(topic, 'A1');
}

/** Topics that belong in the sitemap. */
export function indexableTopics(): GrammarTopic[] {
  return (Object.keys(FREE_GRAMMAR_TOPICS) as GrammarTopic[]).filter(isIndexableTopic);
}

/**
 * Page-level meta for a topic, merged over the layout defaults by
 * `+layout.svelte` (same `pageMetaTags` convention as the blog and flashcard
 * routes). Null for an unknown topic. The canonical URL is already
 * path-only in the layout, so `?level=`, `?from=` and `?tab=` never create
 * duplicate canonicals.
 */
export function topicMetaTags(topic: GrammarTopic): MetaProps | null {
  const rule = GRAMMAR_RULES[topic];
  if (!rule) return null;

  const title = `${rule.titleNb} — Norwegian Grammar — Norskeord`;
  const description = plainSummary(rule.explanationNb, META_DESCRIPTION_MAX);

  const meta: MetaProps = {
    title,
    description,
    og: { title, description },
    twitter: { title, description }
  };
  if (!isIndexableTopic(topic)) {
    meta.robots = { index: false, follow: true };
  }
  return meta;
}
