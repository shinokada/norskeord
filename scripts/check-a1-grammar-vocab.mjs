#!/usr/bin/env node
/**
 * check-a1-grammar-vocab.mjs
 *
 * Per ai-docs/implementation/a1-quiz-and-grammar.md ("Vocab verification
 * script" + Phase 3). Every A1 grammar question should contain at least one
 * real vocab-a1.json / uttrykk-a1.json headword, so the grammar content
 * stays anchored to vocabulary the learner is actually studying at that
 * level. Adapted from scripts/check-c-grammar-vocab.mjs — same matching
 * logic, pointed at the 26 A1 topic-touches instead of the 24 C topics.
 *
 * What it does:
 *   1. Loads src/lib/data/grammar.json, filters to the 26 A1 topic-touches
 *      (A1_TOPICS below — 19 new topics + 7 reused topics, cefr: 'A1' only,
 *      since the reused topics also carry A2/B1/etc. entries that aren't
 *      in scope here).
 *   2. Loads all `lemma` values from vocab-a1.json and uttrykk-a1.json.
 *   3. For each A1 question, concatenates its text fields and checks for at
 *      least one lemma match, using loose stemming (Norwegian inflection
 *      endings stripped, plus a fuzzy prefix fallback for syncopated forms).
 *   4. Prints every question with zero matches for manual review.
 *
 * This is a review aid, not a strict grammar checker. A1's vocabulary is
 * much smaller and more basic than C's idiom-heavy set, so expect a much
 * higher hit rate — this is more of a sanity check than the C-level triage
 * exercise.
 *
 * Usage:
 *   node scripts/check-a1-grammar-vocab.mjs                  # check all 26 A1 topic-touches
 *   node scripts/check-a1-grammar-vocab.mjs personlige-pronomen og-men
 *                                                             # check specific topic(s)
 *   node scripts/check-a1-grammar-vocab.mjs --strict          # exit 1 if any unmatched
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../src/lib/data');

const STRICT = process.argv.includes('--strict');
const topicFilter = process.argv.slice(2).filter((a) => !a.startsWith('--'));

// The 26 A1 topic-touches from ai-docs/implementation/a1-quiz-and-grammar.md,
// plus the 4 new topics from ai-docs/implementation/a1-update.md Phase 5:
// 19 + 4 = 23 new topics + 7 reused topics (which also carry non-A1 entries
// elsewhere in grammar.json — those are excluded below via the cefr === 'A1' filter).
const A1_TOPICS = new Set([
  // 19 new topics (a1-quiz-and-grammar.md)
  'personlige-pronomen',
  'presens-verb',
  'pronomen-objektsform',
  'og-men',
  'adverb-sted-hjem',
  'refleksive-uttrykk',
  'infinitiv-a1',
  'substantiv-bestemt-form',
  'pronomen-den-det-de',
  'denne-dette-disse',
  'imperativ',
  'possessiver-min-din',
  'refleksivt-possessiv-sin',
  'ja-jo',
  'preteritum-a1',
  'for-a-fordi',
  'vaer-det-subjekt',
  'indirekte-tale-at-om',
  'synes-tror',
  // 4 new topics (a1-update.md)
  'klokka-tid',
  'ordenstall-dato',
  'for-siden',
  // 7 reused topics (A1-cefr entries only)
  'helsetninger',
  'modal-verb-order',
  'noun-articles',
  'noun-plurals',
  'adj-agreement',
  'noun-possessives',
  'preposisjoner-tid',
  'preposisjoner-sted'
]);

// ── Load data ─────────────────────────────────────────────────────────────────

function loadJson(filename) {
  return JSON.parse(readFileSync(join(DATA_DIR, filename), 'utf8'));
}

const grammar = loadJson('grammar.json');
const vocabA1 = loadJson('vocab-a1.json');
const uttrykkA1 = loadJson('uttrykk-a1.json');

// Reused topics also carry A2/B1/etc. entries — restrict to cefr: 'A1' so
// this script only checks the entries this plan actually added.
const questions = grammar.filter((q) => A1_TOPICS.has(q.topic) && q.cefr === 'A1');
const targetQuestions =
  topicFilter.length > 0 ? questions.filter((q) => topicFilter.includes(q.topic)) : questions;

if (targetQuestions.length === 0) {
  console.log('No matching A1-topic questions found in grammar.json.');
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
// their infinitive ("ha", "gå", "ta"). Especially relevant here since
// preteritum-a1 questions are written in past tense on purpose. Maps
// inflected form -> infinitive.
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
  drev: 'drive'
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

// Build the lemma list once. Multi-word lemmas (uttrykk phrases) are kept as
// their word list — a phrase counts as matched only if every content word
// of the phrase appears somewhere in the question text.
const singleWordLemmas = new Set();
const phraseLemmas = [];

for (const entry of [...vocabA1, ...uttrykkA1]) {
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
  `🔍  Checking ${targetQuestions.length} A1 grammar question(s) against ${singleWordLemmas.size} single-word + ${phraseLemmas.length} phrase lemmas`
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
    console.log(`    ❌  ${q.id}: no vocab-a1.json/uttrykk-a1.json headword found`);
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
