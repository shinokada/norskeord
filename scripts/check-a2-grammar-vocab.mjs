#!/usr/bin/env node
/**
 * check-a2-grammar-vocab.mjs
 *
 * Per ai-docs/implementation/a2-quiz-and-grammar.md ("Vocab verification
 * script" + Phase 3). Every A2 grammar question added by that plan should
 * contain at least one real vocab-a2.json / uttrykk-a2.json headword (or,
 * failing that, a vocab-a1.json / uttrykk-a1.json one, since A2 content is
 * built on top of A1 vocabulary too), so the grammar content stays anchored
 * to vocabulary the learner is actually studying at that level. Adapted from
 * scripts/check-a1-grammar-vocab.mjs — same matching logic, pointed at the
 * 16 A2 topic-touches instead of the 26 A1 ones.
 *
 * What it does:
 *   1. Loads src/lib/data/grammar.json, filters to the 16 A2 topic-touches
 *      (A2_TOPICS below — 7 new topics + 9 reused topics), restricted to
 *      cefr: 'A2' only, since the reused topics also carry A1/B1/B2 entries
 *      that aren't in scope here.
 *   2. Loads all `lemma` values from vocab-a2.json + uttrykk-a2.json, and
 *      vocab-a1.json + uttrykk-a1.json as a fallback pool.
 *   3. For each A2 question, concatenates its text fields and checks for at
 *      least one lemma match, using loose stemming (Norwegian inflection
 *      endings stripped, plus a fuzzy prefix fallback for syncopated forms).
 *   4. Prints every question with zero matches for manual review.
 *
 * This is a review aid, not a strict grammar checker.
 *
 * Usage:
 *   node scripts/check-a2-grammar-vocab.mjs                  # check all 16 A2 topic-touches
 *   node scripts/check-a2-grammar-vocab.mjs derfor-fordi kvantorer
 *                                                             # check specific topic(s)
 *   node scripts/check-a2-grammar-vocab.mjs --strict          # exit 1 if any unmatched
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../src/lib/data');

const STRICT = process.argv.includes('--strict');
const topicFilter = process.argv.slice(2).filter((a) => !a.startsWith('--'));

// The 16 A2 topic-touches from ai-docs/implementation/a2-quiz-and-grammar.md:
// 7 new topics + 9 reused topics (which also carry non-A2 entries elsewhere
// in grammar.json — those are excluded below via the cefr === 'A2' filter).
const A2_TOPICS = new Set([
  // 7 new topics (4 original + 3 audit-driven)
  'presens-perfektum',
  'derfor-fordi',
  'kvantorer',
  'modalverb-preteritum',
  'plassering-verb',
  'refleksive-verb',
  'ha-vs-vaere',
  // 9 reused topics (A2-cefr entries only)
  'adj-definite',
  'subordinate-order',
  'indirekte-tale-at-om',
  'adj-comparison',
  'relative-som',
  'ikke-placement',
  'preposisjoner-tid',
  'preposisjoner-sted',
  'noun-plurals'
]);

// ── Load data ─────────────────────────────────────────────────────────────────

function loadJson(filename) {
  return JSON.parse(readFileSync(join(DATA_DIR, filename), 'utf8'));
}

const grammar = loadJson('grammar.json');
const vocabA2 = loadJson('vocab-a2.json');
const uttrykkA2 = loadJson('uttrykk-a2.json');
const vocabA1 = loadJson('vocab-a1.json');
const uttrykkA1 = loadJson('uttrykk-a1.json');

// Reused topics also carry A1/B1/B2/etc. entries — restrict to cefr: 'A2' so
// this script only checks the entries this plan actually added.
const questions = grammar.filter((q) => A2_TOPICS.has(q.topic) && q.cefr === 'A2');
const targetQuestions =
  topicFilter.length > 0 ? questions.filter((q) => topicFilter.includes(q.topic)) : questions;

if (targetQuestions.length === 0) {
  console.log('No matching A2-topic questions found in grammar.json.');
  console.log(
    topicFilter.length > 0
      ? `(Filter: ${topicFilter.join(', ')} — check the topic name matches types.ts exactly.)`
      : ''
  );
  process.exit(0);
}

// ── Lemma matching ──────────────────────────────────────────────────────────

// Norwegian inflection endings stripped when hunting for a lemma match.
// Longest first so e.g. "-ene" is tried before "-e".
const SUFFIXES = ['ene', 'ane', 'ere', 'est', 'este', 'er', 'en', 'et', 'a', 'e', 't', 's'];

const STOPWORDS = new Set([
  'å',
  'og',
  'i',
  'på',
  'til',
  'av',
  'om',
  'for',
  'med',
  'seg',
  'som',
  'er',
  'den',
  'det',
  'en',
  'et',
  'de',
  'noe',
  'noen'
]);

// Common Norwegian strong/irregular verbs: the suffix-stripping stemmer below
// can't reduce preterite/perfect forms like "hadde", "gikk", "tok" back to
// their infinitive ("ha", "gå", "ta"). Especially relevant for
// presens-perfektum and modalverb-preteritum, which are written in
// perfect/preterite tense on purpose. Maps inflected form -> infinitive.
const IRREGULAR_VERB_FORMS = {
  hadde: 'ha',
  hatt: 'ha',
  gikk: 'gå',
  gått: 'gå',
  tok: 'ta',
  tatt: 'ta',
  satte: 'sette',
  satt: 'sette',
  var: 'være',
  vært: 'være',
  er: 'være',
  ga: 'gi',
  gav: 'gi',
  gitt: 'gi',
  la: 'legge',
  lagt: 'legge',
  fikk: 'få',
  fått: 'få',
  ble: 'bli',
  blitt: 'bli',
  sa: 'si',
  sagt: 'si',
  visste: 'vite',
  visst: 'vite',
  kom: 'komme',
  kommet: 'komme',
  sto: 'stå',
  stod: 'stå',
  stått: 'stå',
  slo: 'slå',
  slått: 'slå',
  gjorde: 'gjøre',
  gjort: 'gjøre',
  fant: 'finne',
  funnet: 'finne',
  holdt: 'holde',
  het: 'hete',
  løp: 'løpe',
  løpt: 'løpe',
  falt: 'falle',
  bar: 'bære',
  båret: 'bære',
  dro: 'dra',
  dratt: 'dra',
  så: 'se',
  sett: 'se',
  lot: 'la',
  bet: 'bite',
  drev: 'drive',
  // Modal preteritum forms (modalverb-preteritum topic)
  kunne: 'kan',
  ville: 'vil',
  skulle: 'skal',
  måtte: 'må',
  burde: 'bør'
};

function irregularCandidate(word) {
  return IRREGULAR_VERB_FORMS[word] ?? null;
}

/** All suffix-stripped candidates of a word, up to two strips deep (handles double endings). */
function stemCandidates(word) {
  const level1 = new Set([word]);
  const irregular = irregularCandidate(word);
  if (irregular) level1.add(irregular);
  for (const suf of SUFFIXES) {
    if (word.endsWith(suf) && word.length - suf.length >= 3) {
      level1.add(word.slice(0, -suf.length));
    }
  }
  const all = new Set(level1);
  for (const w of level1) {
    for (const suf of SUFFIXES) {
      if (w.endsWith(suf) && w.length - suf.length >= 3) {
        all.add(w.slice(0, -suf.length));
      }
    }
  }
  return all;
}

/** True if `word` plausibly inflects from `lemma` — exact, stemmed, or fuzzy-prefix (syncope). */
function wordMatchesLemma(word, lemma) {
  if (word === lemma) return true;
  if (stemCandidates(word).has(lemma)) return true;
  // Fuzzy prefix fallback for syncopated forms, only for reasonably long
  // words to avoid false positives on short ones.
  if (word.length >= 6 && lemma.length >= 6) {
    const prefixLen = Math.min(word.length, lemma.length) - 2;
    if (prefixLen >= 4 && word.slice(0, prefixLen) === lemma.slice(0, prefixLen)) return true;
  }
  return false;
}

// Build the lemma list once. A2 + uttrykk-a2 first, then A1 + uttrykk-a1 as a
// fallback pool (A2 content leans on A1 vocabulary too). Multi-word lemmas
// (uttrykk phrases) are kept as their word list — a phrase counts as matched
// only if every content word of the phrase appears somewhere in the question
// text.
const singleWordLemmas = new Set();
const phraseLemmas = [];

for (const entry of [...vocabA2, ...uttrykkA2, ...vocabA1, ...uttrykkA1]) {
  const lemma = (entry.lemma ?? '').toLowerCase().trim();
  if (!lemma) continue;
  const parts = lemma
    .split(/\s+/)
    .map((w) => w.replace(/[.,!?;:'"()«»]/g, ''))
    .filter((w) => w && !STOPWORDS.has(w) && w.length > 1);
  if (parts.length <= 1) {
    singleWordLemmas.add(parts[0] ?? lemma);
  } else {
    phraseLemmas.push({ lemma, parts });
  }
}

function questionText(q) {
  const fields = ['prompt', 'sentence', 'source', 'answer', 'optionA', 'optionB', 'explanation'];
  const parts = fields.map((f) => q[f]).filter(Boolean);
  for (const arrField of ['words', 'tokens', 'alternates', 'options']) {
    if (Array.isArray(q[arrField])) parts.push(...q[arrField]);
  }
  return parts.join(' ');
}

function extractWords(text) {
  return (text.toLowerCase().match(/[a-zæøåé]+/g) || []).filter((w) => w.length > 1);
}

/** Returns the matching lemma (or null) for a question. */
function findMatch(text) {
  const words = extractWords(text);

  for (const w of words) {
    for (const cand of stemCandidates(w)) {
      if (singleWordLemmas.has(cand)) return cand;
    }
  }
  // Fuzzy prefix pass (single-word lemmas only, second pass so exact/stemmed matches win)
  for (const w of words) {
    if (w.length < 6) continue;
    for (const lemma of singleWordLemmas) {
      if (lemma.length < 6) continue;
      if (wordMatchesLemma(w, lemma)) return lemma;
    }
  }
  // Phrase lemmas: every content word of the phrase must appear (stemmed) in the text
  for (const { lemma, parts } of phraseLemmas) {
    const allPresent = parts.every((p) =>
      words.some((w) => wordMatchesLemma(w, p) || stemCandidates(w).has(p))
    );
    if (allPresent) return lemma;
  }
  return null;
}

// ── Run ───────────────────────────────────────────────────────────────────────

console.log(`${'═'.repeat(60)}`);
console.log(
  `🔍  Checking ${targetQuestions.length} A2 grammar question(s) against ${singleWordLemmas.size} single-word + ${phraseLemmas.length} phrase lemmas`
);
console.log(`${'═'.repeat(60)}`);

const byTopic = new Map();
for (const q of targetQuestions) {
  if (!byTopic.has(q.topic)) byTopic.set(q.topic, []);
  byTopic.get(q.topic).push(q);
}

let totalUnmatched = 0;

for (const [topic, qs] of byTopic) {
  const unmatched = [];
  for (const q of qs) {
    const match = findMatch(questionText(q));
    if (!match) unmatched.push(q);
  }

  const status = unmatched.length === 0 ? '✅' : '⚠️ ';
  console.log(`\n${status}  ${topic}  (${qs.length} question(s), ${unmatched.length} unmatched)`);

  for (const q of unmatched) {
    console.log(`    ❌  ${q.id}: no vocab-a2/a1.json / uttrykk-a2/a1.json headword found`);
    console.log(
      `        "${questionText(q).slice(0, 140)}${questionText(q).length > 140 ? '…' : ''}"`
    );
  }

  totalUnmatched += unmatched.length;
}

console.log(`\n${'═'.repeat(60)}`);
console.log(
  `📊  Total: ${targetQuestions.length} question(s) checked, ${totalUnmatched} unmatched (needs manual review)`
);

if (STRICT && totalUnmatched > 0) {
  process.exit(1);
}
