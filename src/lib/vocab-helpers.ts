// src/lib/vocab-helpers.ts
// Utility functions for VocabEntry and GrammarQuestion.
// Kept separate from types.ts so types.ts stays declaration-only.

import type { VocabEntry, FlashcardLanguage, GrammarQuestion, CEFRLevel } from '$lib/types';

// ── Vocab ────────────────────────────────────────────────────────────────────

/**
 * Returns the translation of a vocab entry in the given flashcard language,
 * falling back to English when the field is missing (e.g. B2/C entries that
 * haven't been translated yet).
 */
export function getTranslation(entry: VocabEntry, language: FlashcardLanguage): string {
  if (language === 'english') return entry.english;
  return entry[language] ?? entry.english;
}

export function getExampleTranslation(
  entry: VocabEntry,
  language: FlashcardLanguage
): string | undefined {
  if (language === 'english') return entry.example_english;
  return entry[`example_${language}` as keyof VocabEntry] as string | undefined;
}

// ── Grammar ──────────────────────────────────────────────────────────────────

const CEFR_ORDER: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C'];

/** The CEFR levels a question is tagged with — its `levels` array, or `[cefr]`. */
export function questionLevels(q: GrammarQuestion): CEFRLevel[] {
  return q.levels && q.levels.length ? q.levels : [q.cefr];
}

/**
 * The sorted, de-duplicated set of CEFR levels covered by a list of questions.
 * Used to show level badges on a topic card.
 */
export function topicLevels(questions: GrammarQuestion[]): CEFRLevel[] {
  const set = new Set<CEFRLevel>();
  for (const q of questions) for (const l of questionLevels(q)) set.add(l);
  return CEFR_ORDER.filter((l) => set.has(l));
}
