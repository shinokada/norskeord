#!/usr/bin/env node
/**
 * check-grammar-norwegian.mjs
 *
 * Per ai-docs/implementation/grammar-with-only-norsk.md (generalized from the
 * C-level-only ai-docs/implementation/c-grammar-norsk-instruksjoner.md /
 * check-c-grammar-norwegian.mjs). Every grammar question's instructional text
 * (prompt/hint/explanation), at every CEFR level, is being converted from
 * English to Norwegian. This script flags questions that still look English,
 * so the conversion can be tracked topic by topic across all levels.
 *
 * What it does:
 *   1. Loads src/lib/data/grammar.json (ALL topics, no C-only filter).
 *   2. Scans `prompt`, `hint`, and `explanation` for common English
 *      closed-class/instructional words.
 *   3. Prints every question with a hit, for manual review.
 *
 * This is a review aid, not a strict language detector — a correct Norwegian
 * sentence can contain false-positive homographs (e.g. "is" = ice, "for" is
 * a word in both languages). Hits need eyeballing, not blind rejection.
 *
 * Usage:
 *   node scripts/check-grammar-norwegian.mjs                     # check every topic
 *   node scripts/check-grammar-norwegian.mjs personlige-pronomen  # check specific topic(s)
 *   node scripts/check-grammar-norwegian.mjs --strict             # exit 1 if any hit
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../src/lib/data');

const STRICT = process.argv.includes('--strict');
const topicFilter = process.argv.slice(2).filter((a) => !a.startsWith('--'));

// Common English closed-class/instructional words that shouldn't appear in
// Norwegian prompt/hint/explanation text. Deliberately excludes words that
// are also valid Norwegian words (e.g. "is" = ice, "for" = for, "en" = a/one,
// "form"/"verb" = also Norwegian words) to keep false positives manageable.
// Carried over from the C-level checker's known false-positive exclusions.
const ENGLISH_TELLS = [
  'the',
  'this',
  'that',
  'these',
  'those',
  'choose',
  'rewrite',
  'using',
  'which',
  'what',
  'following',
  'because',
  'stays',
  'becomes',
  'remains',
  'though',
  'sentence',
  'correct',
  'wrong',
  'chain',
  'meaning',
  'complete',
  'select',
  'fill',
  'blank',
  'own',
  'even',
  'still',
  'never',
  'always',
  'right',
  'here',
  'after',
  'before',
  'while',
  'both',
  'only',
  'instead',
  'expresses',
  'expressing',
  'marks',
  'shows',
  'means',
  'needs',
  'stay',
  'must',
  'should',
  'would',
  'could',
  'replace',
  'subject',
  'pronoun',
  'plural',
  'singular'
];

const TELL_REGEX = new RegExp(`\\b(${ENGLISH_TELLS.join('|')})\\b`, 'i');

function loadJson(filename) {
  return JSON.parse(readFileSync(join(DATA_DIR, filename), 'utf8'));
}

const grammar = loadJson('grammar.json');
const targetQuestions =
  topicFilter.length > 0 ? grammar.filter((q) => topicFilter.includes(q.topic)) : grammar;

if (targetQuestions.length === 0) {
  console.log('No matching questions found in grammar.json.');
  process.exit(0);
}

function checkFields(q) {
  const hits = [];
  for (const field of ['prompt', 'hint', 'explanation']) {
    const val = q[field];
    if (typeof val === 'string' && TELL_REGEX.test(val)) {
      hits.push({ field, match: val.match(TELL_REGEX)[0], text: val });
    }
  }
  return hits;
}

console.log('═'.repeat(60));
console.log(
  `🔍  Checking ${targetQuestions.length} grammar question(s) for English instructional text`
);
console.log('═'.repeat(60));

const byTopic = new Map();
for (const q of targetQuestions) {
  if (!byTopic.has(q.topic)) byTopic.set(q.topic, []);
  byTopic.get(q.topic).push(q);
}

let totalHits = 0;

for (const [topic, qs] of byTopic) {
  const flagged = qs.map((q) => ({ q, hits: checkFields(q) })).filter((r) => r.hits.length > 0);

  const status = flagged.length === 0 ? '✅' : '⚠️ ';
  console.log(`\n${status}  ${topic}  (${qs.length} question(s), ${flagged.length} flagged)`);

  for (const { q, hits } of flagged) {
    for (const h of hits) {
      console.log(`    ❌  ${q.id} [${h.field}]: matched "${h.match}"`);
      console.log(`        "${h.text.slice(0, 140)}${h.text.length > 140 ? '…' : ''}"`);
    }
  }

  totalHits += flagged.length;
}

console.log(`\n${'═'.repeat(60)}`);
console.log(
  `📊  Total: ${targetQuestions.length} question(s) checked, ${totalHits} flagged (needs manual review)`
);

if (STRICT && totalHits > 0) {
  process.exit(1);
}
