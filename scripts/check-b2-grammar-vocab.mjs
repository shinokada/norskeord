#!/usr/bin/env node
/**
 * check-b2-grammar-vocab.mjs
 *
 * Per ai-docs/implementation/b2-grammar.md ("Vocab verification script" +
 * Phase 3). Every B2 grammar question added by that plan should contain at
 * least one real vocab-b2.json / uttrykk-b2.json headword (or, failing
 * that, a vocab-a1/a2/b1.json / uttrykk-a1/a2/b1.json one, since B2 content
 * naturally reuses a lot of earlier-level vocabulary), so the grammar
 * content stays anchored to vocabulary the learner is actually studying at
 * that level. Adapted from scripts/check-b1-grammar-vocab.mjs — same
 * matching logic, pointed at the 23 B2 topic-touches instead of the 32 B1
 * ones.
 *
 * What it does:
 *   1. Loads src/lib/data/grammar.json, filters to the 23 B2 topic-touches
 *      (B2_TOPICS below — 10 new topics + 13 reused topics), restricted to
 *      cefr: 'B2' only, since the reused topics also carry A1/A2/B1/C
 *      entries that aren't in scope here.
 *   2. Loads all `lemma` values from vocab-b2.json + uttrykk-b2.json, and
 *      vocab-a1/a2/b1.json + their uttrykk files as a fallback pool.
 *   3. For each B2 question, concatenates its text fields and checks for at
 *      least one lemma match, using loose stemming (Norwegian inflection
 *      endings stripped, plus a fuzzy prefix fallback for syncopated forms).
 *   4. Prints every question with zero matches for manual review.
 *
 * This is a review aid, not a strict grammar checker.
 *
 * Usage:
 *   node scripts/check-b2-grammar-vocab.mjs                  # check all 23 B2 topic-touches
 *   node scripts/check-b2-grammar-vocab.mjs ordfamilie-avledning subjunksjon-oversikt
 *   node scripts/check-b2-grammar-vocab.mjs --strict          # exit 1 if any unmatched
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../src/lib/data');

const STRICT = process.argv.includes('--strict');
const topicFilter = process.argv.slice(2).filter((a) => !a.startsWith('--'));

// The 23 B2 topic-touches from ai-docs/implementation/b2-grammar.md:
// 10 new topics + 13 reused topics (which also carry non-B2 entries
// elsewhere in grammar.json — those are excluded below via the
// cefr === 'B2' filter).
const B2_TOPICS = new Set([
  // 10 new topics
  'substantivert-adjektiv',
  'motsetning-prefiks',
  'subjunksjon-oversikt',
  'partisipp-former',
  'partikkelverb-los-fast',
  'modalverb-betydning',
  'sannsynlighet-uttrykk',
  'bli-presens-partisipp',
  'fa-perfektum-partisipp',
  'mene-synes-tro-tenke',
  // 13 reused topics
  'noun-plurals',
  'adj-agreement',
  'kvantorer',
  'noun-articles',
  'ordfamilie-avledning',
  'setningsadverbial',
  'adverbial-fronting',
  'derfor-fordi',
  'motsetning-selv-om-likevel',
  'tidssekvens-etter-at-etterpaa',
  'adjektiv-eller-adverb',
  'passiv-bli-s',
  'indirekte-tale-at-om',
  // Round 2 (ai-docs/implementation/b2-grammar-2.md): 12 new topics + 3
  // reused topic-touches (partisipp-former/ordfamilie-avledning above already
  // in this set; partikkelverb-los-fast too).
  'modale-adverb',
  'sammensatte-substantiv-b2',
  'preteritum-perfektum-og-futurum',
  'det-formelt-subjekt',
  'det-referanse',
  'spesial-kvantorer',
  'arsak-og-folge-uttrykk',
  'kontrast-uttrykk',
  'hoflig-preteritum',
  'hypotetiske-betingelsessetninger',
  'stedsadverb-statisk-dynamisk',
  'man-en-upersonlig-pronomen',
  // ai-docs/implementation/b2-c1-grammar.md: 'nyanser-uttrykk' spans B2 + C
  // (filtered to cefr === 'B2' below, same as every other reused topic here);
  // 'preposisjoner-uttrykk-b2' is B2-only.
  'nyanser-uttrykk',
  'preposisjoner-uttrykk-b2'
]);

// ── Load data ─────────────────────────────────────────────────────────────────

function loadJson(filename) {
  return JSON.parse(readFileSync(join(DATA_DIR, filename), 'utf8'));
}

const grammar = loadJson('grammar.json');
const vocabB2 = loadJson('vocab-b2.json');
const uttrykkB2 = loadJson('uttrykk-b2.json');
const vocabA1 = loadJson('vocab-a1.json');
const uttrykkA1 = loadJson('uttrykk-a1.json');
const vocabA2 = loadJson('vocab-a2.json');
const uttrykkA2 = loadJson('uttrykk-a2.json');
const vocabB1 = loadJson('vocab-b1.json');
const uttrykkB1 = loadJson('uttrykk-b1.json');

// Reused topics also carry A1/A2/B1/C entries — restrict to cefr: 'B2' so
// this script only checks the entries this plan actually added.
const questions = grammar.filter((q) => B2_TOPICS.has(q.topic) && q.cefr === 'B2');
const targetQuestions =
  topicFilter.length > 0 ? questions.filter((q) => topicFilter.includes(q.topic)) : questions;

if (targetQuestions.length === 0) {
  console.log('No matching B2-topic questions found in grammar.json.');
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
// their infinitive ("ha", "gå", "ta"). Maps inflected form -> infinitive.
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
  if (word.length >= 6 && lemma.length >= 6) {
    const prefixLen = Math.min(word.length, lemma.length) - 2;
    if (prefixLen >= 4 && word.slice(0, prefixLen) === lemma.slice(0, prefixLen)) return true;
  }
  return false;
}

// Build the lemma list once. B2 + uttrykk-b2 first, then A1/A2/B1 + their
// uttrykk files as a fallback pool (B2 content leans on earlier-level
// vocabulary too). Multi-word lemmas (uttrykk phrases) are kept as their
// word list — a phrase counts as matched only if every content word of the
// phrase appears somewhere in the question text.
const singleWordLemmas = new Set();
const phraseLemmas = [];

for (const entry of [
  ...vocabB2,
  ...uttrykkB2,
  ...vocabA1,
  ...uttrykkA1,
  ...vocabA2,
  ...uttrykkA2,
  ...vocabB1,
  ...uttrykkB1
]) {
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
  `🔍  Checking ${targetQuestions.length} B2 grammar question(s) against ${singleWordLemmas.size} single-word + ${phraseLemmas.length} phrase lemmas`
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
    console.log(
      `    ❌  ${q.id}: no vocab-b2/a1/a2/b1.json / uttrykk-b2/a1/a2/b1.json headword found`
    );
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
