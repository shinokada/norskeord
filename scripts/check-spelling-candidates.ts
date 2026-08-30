#!/usr/bin/env tsx
/**
 * check-spelling-candidates.ts
 *
 * One-off variant of check-spelling.ts for draft/b2/pa-niva/data/candidates-raw.json.
 * That file has a different shape per `type` (paraphrase / faste-uttrykk /
 * particle-verb-*), not the production vocab-* / uttrykk-* schema, so it needs
 * its own field list instead of reusing check-spelling.ts directly.
 *
 * Checks: raw_term, sentenceA, sentenceB_filled, original_sentence,
 * corrected_sentence, base_verb, explanation, note, sentence, marked_word,
 * partikkelverb_raw, verb_raw, partisipp_forms (array) (whichever are present
 * per candidate). Uses the same nb Hunspell dictionary + allowlist as
 * check-spelling.ts so results stay consistent once these candidates land
 * in vocab-b2.json/uttrykk-b2.json.
 *
 * Usage:
 *   npx tsx scripts/check-spelling-candidates.ts
 *   npx tsx scripts/check-spelling-candidates.ts --strict   # exit 1 if anything flagged
 */

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
// @ts-expect-error — no bundled types for dictionary-nb / nspell
import dictionary from 'dictionary-nb';
// @ts-expect-error — no bundled types for nspell
import nspell from 'nspell';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CANDIDATES_PATH = join(__dirname, '../draft/b2/pa-niva/data/candidates-raw.json');
const ALLOWLIST_PATH = join(__dirname, 'spelling-allowlist.txt');

const FIELDS_TO_CHECK = [
  'raw_term',
  'sentenceA',
  'sentenceB_filled',
  'original_sentence',
  'corrected_sentence',
  'base_verb',
  'explanation',
  'note',
  'sentence',
  'marked_word',
  'partikkelverb_raw',
  'verb_raw'
];

// Array-valued fields (checked separately from FIELDS_TO_CHECK, which assumes strings).
const ARRAY_FIELDS_TO_CHECK = ['partisipp_forms'];

// Same marker-stripping as check-spelling.ts, plus underscore blanks and
// parenthetical alt-answers (e.g. "tenkt (å dra/reise)") which are source
// artifacts, not spelling data.
const MARKER_PATTERN = /\((en\/ei\/et|en\/ei|en\/et|en\/men|en|et|ei|b\.pl\.|pl\.|ubøy\.)\)/gi;

const STRICT = process.argv.includes('--strict');

function loadAllowlist(): Set<string> {
  if (!existsSync(ALLOWLIST_PATH)) return new Set();
  const lines = readFileSync(ALLOWLIST_PATH, 'utf8').split('\n');
  const words = new Set<string>();
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    words.add(trimmed.toLowerCase());
  }
  return words;
}

const allowlist = loadAllowlist();
const spell = nspell(dictionary);

function tokenize(text: string): string[] {
  const stripped = text.replace(MARKER_PATTERN, ' ');
  return stripped.match(/\p{L}+/gu) ?? [];
}

function isFlagged(word: string): boolean {
  if (word.length <= 1) return false;
  if (allowlist.has(word.toLowerCase())) return false;
  return !spell.correct(word);
}

type Occurrence = {
  section: string;
  type: string;
  index: number;
  field: string;
  word: string;
  context: string;
};

if (!existsSync(CANDIDATES_PATH)) {
  console.error(`❌  Not found: ${CANDIDATES_PATH}`);
  process.exit(1);
}

const candidates: Record<string, unknown>[] = JSON.parse(readFileSync(CANDIDATES_PATH, 'utf8'));

console.log('Norwegian spelling check — candidates-raw.json (nb Hunspell dictionary)');
console.log(`Allowlist: ${allowlist.size} word(s) loaded from ${ALLOWLIST_PATH.split('/').pop()}`);
console.log(`${candidates.length} candidate(s) to check`);
console.log(`${'─'.repeat(60)}`);

const occurrences: Occurrence[] = [];
const wordCounts = new Map<string, number>();

candidates.forEach((candidate, index) => {
  for (const field of FIELDS_TO_CHECK) {
    const val = candidate[field];
    if (typeof val !== 'string' || !val) continue;
    for (const word of tokenize(val)) {
      if (!isFlagged(word)) continue;
      occurrences.push({
        section: String(candidate.section ?? '(unknown section)'),
        type: String(candidate.type ?? '(unknown type)'),
        index,
        field,
        word,
        context: val
      });
      const key = word.toLowerCase();
      wordCounts.set(key, (wordCounts.get(key) ?? 0) + 1);
    }
  }

  for (const field of ARRAY_FIELDS_TO_CHECK) {
    const val = candidate[field];
    if (!Array.isArray(val)) continue;
    for (const item of val) {
      if (typeof item !== 'string' || !item) continue;
      for (const word of tokenize(item)) {
        if (!isFlagged(word)) continue;
        occurrences.push({
          section: String(candidate.section ?? '(unknown section)'),
          type: String(candidate.type ?? '(unknown type)'),
          index,
          field,
          word,
          context: item
        });
        const key = word.toLowerCase();
        wordCounts.set(key, (wordCounts.get(key) ?? 0) + 1);
      }
    }
  }
});

console.log(`\n📋  Flagged occurrences (${occurrences.length} total):\n`);

for (const occ of occurrences) {
  const suggestions = spell.suggest(occ.word).slice(0, 3);
  const hint = suggestions.length > 0 ? ` → suggest: ${suggestions.join(', ')}` : '';
  console.log(
    `  ⚠️   [#${occ.index}] ${occ.section} (${occ.type}) ${occ.field}: "${occ.word}"${hint}`
  );
  console.log(`       ${occ.context}`);
}

console.log(`\n${'═'.repeat(60)}`);
console.log(`📊  ${occurrences.length} occurrence(s), ${wordCounts.size} unique flagged word(s)`);

if (wordCounts.size > 0) {
  console.log(`\nUnique words by frequency (add real words to spelling-allowlist.txt):`);
  const sorted = [...wordCounts.entries()].sort((a, b) => b[1] - a[1]);
  for (const [word, count] of sorted) {
    console.log(`  ${String(count).padStart(3)}×  ${word}`);
  }
}

if (STRICT && occurrences.length > 0) {
  process.exit(1);
}
