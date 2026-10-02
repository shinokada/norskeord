/**
 * id-index.ts
 *
 * Live resolution of a grammar question id to its CURRENT topic and CEFR
 * level (ai-docs/implementation/grammar-update.md, Phase 3 prerequisite).
 *
 * `CardProgress.category` / `.level` for grammar (and the Plus
 * `grammar_progress.topic` / `.cefr` columns) are a snapshot taken at review
 * time. Phase 1b reorganised topics, so older rows still carry retired ids
 * such as `helsetninger` or `uttrykk-gjenkjenning-*`. FSRS state is keyed by
 * question id, which never changed, so resolving the id here fixes stats and
 * per-topic due filtering for localStorage and Supabase alike, with no data
 * migration. Same idea as `resolveEntry()` in content-lookup.ts for vocab.
 *
 * The data comes from grammar-id-index.json, generated from grammar.json by
 * scripts/build-grammar-level-index.mjs (`pnpm grammar:split`).
 *
 * Bundle note: ~3,000 ids. Import this module only from code that needs it
 * (stats.ts, the /review/grammar route, progress.ts callers that opt in).
 * Do NOT import it from progress.ts itself, which is bundled into nearly
 * every flashcard/quiz route.
 */

import type { CEFRLevel, GrammarTopic } from '$lib/types';
import idIndexJson from '$lib/data/grammar-id-index.json';

export interface ResolvedGrammarQuestion {
  topic: GrammarTopic;
  level: CEFRLevel;
}

const GRAMMAR_ID_INDEX: Map<string, ResolvedGrammarQuestion> = new Map(
  Object.entries(idIndexJson as unknown as Record<string, [GrammarTopic, CEFRLevel]>).map(
    ([id, [topic, level]]) => [id, { topic, level }]
  )
);

/**
 * Returns a question id's current topic and level, or undefined when the id
 * no longer exists in grammar.json (the question was deleted, not moved).
 * Callers should drop such ids silently, as the vocab/uttrykk code does.
 */
export function resolveGrammarQuestion(id: string): ResolvedGrammarQuestion | undefined {
  return GRAMMAR_ID_INDEX.get(id);
}
