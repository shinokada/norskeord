// src/lib/cloze.ts
// Pure logic for the Sentences (typed cloze) quiz mode
// (ai-docs/implementation/cloze-quiz.md, Phase 1).
//
// The learner sees an example sentence with one word or phrase blanked, plus hints, and
// types the missing text. Nothing here touches the network, localStorage or Supabase:
// grading, the FSRS rating to write, question building and session selection are plain
// functions. The existing Words quiz (`quiz.ts`) is not changed; this file only imports
// helpers from it.

import type { VocabEntry, CardProgress, FlashcardLanguage, FSRSRating } from '$lib/types';
import { getTranslation, getExampleTranslation } from '$lib/vocab-helpers';
import { vocabKey } from '$lib/progress';
import { spaceSiblings } from '$lib/sibling-spacing';
import {
  bareLemma,
  isB1MonolingualEligible,
  isMonolingualLevel,
  isQuizable,
  siblingKey
} from '$lib/quiz';

// ── Data ─────────────────────────────────────────────────────────────────────────────────

/** One sidecar item (src/lib/data/cloze-<type>-<level>.json). `before + answer + after`
 *  is the entry's `example`. */
export interface ClozeItem {
  before: string;
  answer: string;
  after: string;
}

/** Sidecar items keyed by entry id. */
export type ClozeMap = Record<string, ClozeItem>;

export interface ClozeQuestion {
  type: 'cloze';
  entry: VocabEntry;
  /** Text before the blank, exactly as in the example (may end with a space). */
  before: string;
  /** The text to type: the form that is in the sentence, e.g. "selger". */
  answer: string;
  /** Text after the blank. */
  after: string;
  /** Dictionary forms of the word ("selge"); typing one is a right word in the wrong form. */
  baseForms: string[];
  /** Other spellings that are also correct, e.g. "kuen" for "kua" (see getAlternativeForms). */
  alternatives: string[];
  /** The definite form of the other gender, e.g. "beinen" for "beinet"; typing one is a right
   *  word in the wrong form, not a typo (see getWrongGenderForms). */
  wrongGenderForms: string[];
  /** Translation of the whole sentence in the learner's language. `null` at monolingual
   *  levels (B2, C, eligible B1), where the hint is the Norwegian `definition` only. */
  sentenceHint: string | null;
  /** The word's meaning: a translation, or the Norwegian `definition` when monolingual. */
  wordHint: string;
  /** True when `wordHint` is the Norwegian definition. */
  hintIsDefinition: boolean;
}

/**
 * Other correct spellings of the answer. Only feminine-type nouns have any: Bokmål accepts
 * the definite singular both as `-a` and as `-en` (kua / kuen, døra / døren, sola / solen).
 * `lemma` below is each dictionary form of the entry.
 *  - The sentence has the `-a` form: the `-en` form is also correct. Only a feminine noun can
 *    have a definite in `-a`, so no marker is needed.
 *  - The sentence has the `-en` form: the `-a` form is also correct, but only for an entry
 *    marked `ei` ("(en/ei)"), so a masculine noun never accepts `-a`.
 * The result never contains the answer itself.
 */
export function getAlternativeForms(
  entry: Pick<VocabEntry, 'norsk' | 'lemma' | 'part'>,
  answer: string
): string[] {
  if (entry.part !== 'noun') return [];
  const a = normalizeClozeText(answer);
  const hasEi = /\([^)]*\bei\b[^)]*\)\s*$/.test(entry.norsk);
  const out = new Set<string>();
  for (const form of getBaseForms(entry)) {
    const lemma = normalizeClozeText(form);
    // "stue" has the definites "stuen" and "stua"; "ku" has "kuen" and "kua".
    const endsInE = lemma.endsWith('e');
    const withEn = endsInE ? `${lemma}n` : `${lemma}en`;
    const withA = `${endsInE ? lemma.slice(0, -1) : lemma}a`;
    if (a === withA) out.add(withEn);
    else if (a === withEn && hasEi) out.add(withA);
  }
  out.delete(a);
  return [...out];
}

/**
 * The definite singular of the wrong gender, for a noun whose answer is its definite form.
 * `bein (et)` with the answer `beinet`: `beinen` is one edit away, so without this it would be
 * graded a typo and counted correct, although en/et is exactly the mistake the quiz should
 * catch. Only entries marked with a single gender class give a result:
 *  - `(et)` and the answer is the neuter definite (`-et`, or `-t` after a lemma in `-e`):
 *    the common-gender definite (`-en`) is the wrong form;
 *  - `(en)` or `(en/ei)` and the answer is the `-en` definite: the neuter one (`-et`) is wrong.
 * An entry marked for both classes, or none, has no single wrong gender. The result never
 * contains the answer itself.
 */
export function getWrongGenderForms(
  entry: Pick<VocabEntry, 'norsk' | 'lemma' | 'part'>,
  answer: string
): string[] {
  if (entry.part !== 'noun') return [];
  const marker = /\(([^)]*)\)\s*$/.exec(entry.norsk);
  if (!marker) return [];
  const genders = new Set(
    marker[1]
      .toLowerCase()
      .split(/[\s/,]+/)
      .filter(Boolean)
  );
  const neuter = genders.has('et');
  const common = genders.has('en') || genders.has('ei');
  if (neuter === common) return [];
  const a = normalizeClozeText(answer);
  const out = new Set<string>();
  for (const form of getBaseForms(entry)) {
    const lemma = normalizeClozeText(form);
    const endsInE = lemma.endsWith('e');
    const neuterDefinite = endsInE ? `${lemma}t` : `${lemma}et`;
    const commonDefinite = endsInE ? `${lemma}n` : `${lemma}en`;
    if (neuter && a === neuterDefinite) out.add(commonDefinite);
    else if (common && a === commonDefinite) out.add(neuterDefinite);
  }
  out.delete(a);
  return [...out];
}

// ── Grading ──────────────────────────────────────────────────────────────────────────────

/**
 * The result of grading a typed answer. There is no "typo" outcome: the quiz asks for the exact
 * form that is in the sentence, so one wrong letter is wrong ("munten" for "munnen").
 *  - `correct`:   the exact form that is in the sentence, or an accepted alternative spelling.
 *  - `wrongForm`: the right word in its dictionary form ("selge" for "selger"), or a noun's
 *                 definite of the wrong gender ("beinen" for "beinet").
 *  - `wrong`:     anything else, including an empty answer.
 */
export type ClozeOutcome = 'correct' | 'wrongForm' | 'wrong';

/** Trim, collapse inner whitespace, lowercase, compose accents (NFC). Keeps æ, ø and å. */
export function normalizeClozeText(s: string): string {
  return s.normalize('NFC').trim().replace(/\s+/g, ' ').toLowerCase();
}

/** The dictionary forms of an entry: `bareLemma(norsk)` and `lemma`, de-duplicated. */
export function getBaseForms(entry: Pick<VocabEntry, 'norsk' | 'lemma'>): string[] {
  const forms = [bareLemma(entry.norsk), entry.lemma?.trim() ?? ''].filter((f) => f !== '');
  return [...new Set(forms)];
}

/**
 * Grade a typed answer. The checks run in this order, and the order matters:
 *  1. equals the sentence form or an accepted alternative spelling: `correct`;
 *  2. equals a base form or the wrong-gender definite: `wrongForm`;
 *  3. anything else: `wrong`.
 * Only the exact form counts: there is no typo rule, so "munten" for "munnen" is wrong.
 * The base-form and wrong-gender checks only decide how a wrong answer is described (and
 * that it is still rated `hard`, not `again`).
 */
export function gradeClozeAnswer(
  typed: string,
  answer: string,
  baseForms: readonly string[],
  alternatives: readonly string[] = [],
  wrongGenderForms: readonly string[] = []
): ClozeOutcome {
  const t = normalizeClozeText(typed);
  if (t === '') return 'wrong';
  const a = normalizeClozeText(answer);
  if (t === a) return 'correct';
  // Another correct spelling ("kuen" for "kua"): graded like the sentence form.
  if (alternatives.some((alt) => normalizeClozeText(alt) === t)) return 'correct';
  if (baseForms.some((b) => normalizeClozeText(b) === t)) return 'wrongForm';
  // The other gender's definite ("beinen" for "beinet") is a grammar error, not a typo.
  if (wrongGenderForms.some((w) => normalizeClozeText(w) === t)) return 'wrongForm';
  return 'wrong';
}

/**
 * The FSRS rating an outcome writes to the shared flashcard schedule. Every outcome
 * writes one, because a typed answer is recall evidence: the Words quiz's
 * `fsrsRatingToWrite` is not used here and is not changed.
 */
export function clozeRatingToWrite(outcome: ClozeOutcome): FSRSRating {
  switch (outcome) {
    case 'correct':
      return 'good';
    case 'wrongForm':
      return 'hard';
    case 'wrong':
      return 'again';
  }
}

/** Whether the Sentences counts record the answer as correct: only the exact form (or an accepted spelling). */
export function clozeCountsAsCorrect(outcome: ClozeOutcome): boolean {
  return outcome === 'correct';
}

// ── Question ─────────────────────────────────────────────────────────────────────────────

/**
 * Build one cloze question.
 *
 * Hints follow the Words quiz: at a monolingual level (B2, C) or for a B1 entry eligible per
 * `isB1MonolingualEligible` (`monolingualOverride`), the only hint is the Norwegian
 * `definition`. Otherwise the hints are the sentence translation and the word's translation
 * in `language`. A missing sentence translation falls back to English, like `getTranslation`.
 * The base form is never shown: it would give an exact match away, and for an inflected
 * word it would turn the question into a grammar exercise.
 */
export function buildClozeQuestion(
  entry: VocabEntry,
  item: ClozeItem,
  language: FlashcardLanguage = 'english',
  monolingualOverride = false
): ClozeQuestion {
  const monolingual = isMonolingualLevel(entry.level) || monolingualOverride;
  const hintIsDefinition = monolingual && !!entry.definition;
  return {
    type: 'cloze',
    entry,
    before: item.before,
    answer: item.answer,
    after: item.after,
    baseForms: getBaseForms(entry),
    alternatives: getAlternativeForms(entry, item.answer),
    wrongGenderForms: getWrongGenderForms(entry, item.answer),
    sentenceHint: monolingual
      ? null
      : getExampleTranslation(entry, language) || entry.example_english || null,
    wordHint: hintIsDefinition ? entry.definition! : getTranslation(entry, language),
    hintIsDefinition
  };
}

// ── Session ──────────────────────────────────────────────────────────────────────────────

function shuffle<T>(arr: readonly T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Build a Sentences session of up to `count` questions.
 *
 * `entries` is the pool the server already gated for the plan; `clozeMap` holds the blank
 * for each entry. An entry is used only when it is quizable (`isQuizable`), has an item, and
 * the item still rebuilds its example (a stale item is skipped rather than shown wrong).
 *
 * Order, like `buildQuizSession`: due cards first, then new cards, then not-yet-due cards by
 * soonest due date, so a session is never short while eligible entries exist. Siblings (two
 * senses of one word) are kept apart. Progress is looked up by `vocabKey(entry)`.
 *
 * `rng` and `now` are parameters only so tests can make the result deterministic.
 */
export function buildClozeSession(
  entries: readonly VocabEntry[],
  clozeMap: ClozeMap,
  progressMap: Record<string, CardProgress>,
  count = 10,
  language: FlashcardLanguage = 'english',
  rng: () => number = Math.random,
  now: Date = new Date()
): ClozeQuestion[] {
  const categoryHasDefinitions = entries.some((e) => !!e.definition);

  const due: VocabEntry[] = [];
  const newCards: VocabEntry[] = [];
  const notYetDue: VocabEntry[] = [];
  for (const e of entries) {
    const item = clozeMap[e.id];
    if (!item || !isQuizable(e)) continue;
    if (item.before + item.answer + item.after !== e.example) continue;
    const p = progressMap[vocabKey(e)];
    if (!p) newCards.push(e);
    else if (new Date(p.fsrs.due) <= now) due.push(e);
    else notYetDue.push(e);
  }

  const dueTime = (e: VocabEntry) => new Date(progressMap[vocabKey(e)].fsrs.due).getTime();
  const soonestDue = [...notYetDue].sort((a, b) => dueTime(a) - dueTime(b));

  const pool = spaceSiblings(
    [...shuffle(due, rng), ...shuffle(newCards, rng), ...soonestDue].slice(0, count),
    siblingKey
  );

  return pool.map((entry) =>
    buildClozeQuestion(
      entry,
      clozeMap[entry.id],
      language,
      isB1MonolingualEligible(entry, categoryHasDefinitions)
    )
  );
}
