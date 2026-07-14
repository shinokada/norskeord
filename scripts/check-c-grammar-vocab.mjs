#!/usr/bin/env node
/**
 * check-c-grammar-vocab.mjs
 *
 * Per ai-docs/implementation/c-grammar.md ("Vocab/uttrykk verification script" +
 * Phase 3). Every C-level grammar question must contain at least one real
 * vocab-c.json / uttrykk-c.json headword, so the grammar content stays
 * anchored to vocabulary the learner is actually studying at that level.
 *
 * What it does:
 *   1. Loads src/lib/data/grammar.json, filters to the 24 Nivå C topics
 *      (see C_TOPICS below — mirrors the GrammarTopic union in types.ts).
 *   2. Loads all `lemma` values from vocab-c.json and uttrykk-c.json.
 *   3. For each C-topic question, concatenates its text fields and checks
 *      for at least one lemma match, using loose stemming (Norwegian
 *      inflection endings stripped, plus a fuzzy prefix fallback for
 *      syncopated forms like "sjøstøvel" → "sjøstøvlene").
 *   4. Prints every question with zero matches for manual review.
 *
 * This is a review aid, not a strict grammar checker — it flags questions
 * for a human to look at before merging, per the plan ("Print any question
 * with zero matches for manual review before merging"). False positives
 * (a real match the stemmer missed) are expected occasionally; check by eye.
 *
 * Usage:
 *   node scripts/check-c-grammar-vocab.mjs                  # check all 24 C topics
 *   node scripts/check-c-grammar-vocab.mjs adj-farger-uboyelige adj-mer-mest
 *                                                             # check specific topic(s)
 *   node scripts/check-c-grammar-vocab.mjs --strict          # exit 1 if any unmatched
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../src/lib/data');

const STRICT = process.argv.includes('--strict');
const topicFilter = process.argv.slice(2).filter((a) => !a.startsWith('--'));

// Mirrors the 24 Nivå C topics in src/lib/types.ts GrammarTopic
// (see ai-docs/implementation/c-grammar.md).
const C_TOPICS = new Set([
  'ubestemt-artikkel-c',
  'substantiv-uttrykk-c',
  'sammensatte-substantiv',
  'adj-mer-mest',
  'adj-farger-uboyelige',
  'adj-partisipp-som-adjektiv',
  'predikativ-agreement',
  'verbform-i-kontekst',
  'sterke-verb-c',
  'perfektum-pluskvamperfektum',
  'futurum-referert',
  'kondisjonalis-counterfactual',
  'verbet-a-fa',
  'leddsetning-som-fundament',
  'ordet-sa',
  'koordinerende-konjunksjoner',
  'ordfamilie-avledning',
  'omskriving-passiv',
  'jo-desto-komparativ',
  'preposisjoner-kroppsdel-uttrykk',
  'preposisjoner-generelt-c',
  'uttrykk-gjenkjenning-c-1',
  'uttrykk-gjenkjenning-c-2',
  'uttrykk-gjenkjenning-c-3'
]);

// ── Load data ─────────────────────────────────────────────────────────────────

function loadJson(filename) {
  return JSON.parse(readFileSync(join(DATA_DIR, filename), 'utf8'));
}

const grammar = loadJson('grammar.json');
const vocabC = loadJson('vocab-c.json');
const uttrykkC = loadJson('uttrykk-c.json');

const questions = grammar.filter((q) => C_TOPICS.has(q.topic));
const targetQuestions =
  topicFilter.length > 0 ? questions.filter((q) => topicFilter.includes(q.topic)) : questions;

if (targetQuestions.length === 0) {
  console.log('No matching C-topic questions found in grammar.json.');
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

/** All suffix-stripped candidates of a word, up to two strips deep (handles double endings). */
function stemCandidates(word) {
  const level1 = new Set([word]);
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
  // Fuzzy prefix fallback for syncopated forms (e.g. "sjøstøvel" ~ "sjøstøvlene"),
  // only for reasonably long words to avoid false positives on short ones.
  if (word.length >= 6 && lemma.length >= 6) {
    const prefixLen = Math.min(word.length, lemma.length) - 2;
    if (prefixLen >= 4 && word.slice(0, prefixLen) === lemma.slice(0, prefixLen)) return true;
  }
  return false;
}

// Build the lemma list once. Multi-word lemmas (uttrykk phrases like
// "reflektere over") are kept as their word list — a phrase counts as
// matched only if every content word of the phrase appears somewhere
// in the question text.
const singleWordLemmas = new Set();
const phraseLemmas = [];

for (const entry of [...vocabC, ...uttrykkC]) {
  const lemma = (entry.lemma ?? '').toLowerCase().trim();
  if (!lemma) continue;
  const parts = lemma.split(/\s+/).filter((w) => !STOPWORDS.has(w) && w.length > 1);
  if (parts.length <= 1) {
    singleWordLemmas.add(lemma);
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
  return (text.toLowerCase().match(/[a-zæøå]+/g) || []).filter((w) => w.length > 1);
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
  `🔍  Checking ${targetQuestions.length} C-level grammar question(s) against ${singleWordLemmas.size} single-word + ${phraseLemmas.length} phrase lemmas`
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
    console.log(`    ❌  ${q.id}: no vocab-c.json/uttrykk-c.json headword found`);
    console.log(`        "${questionText(q).slice(0, 140)}${questionText(q).length > 140 ? '…' : ''}"`);
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
