#!/usr/bin/env node
/**
 * check-kommaregler-vocab.mjs
 *
 * Per ai-docs/implementation/punctuation.md, Phase 3 step 2. Vocab-match
 * check for the `kommaregler` grammar topic, adapted from
 * check-b2-grammar-vocab.mjs — same matching logic, but pooling
 * vocab-c.json/uttrykk-c.json as well since kommaregler spans both B2 and C
 * entries (no separate kommaregler-c topic).
 *
 * Usage:
 *   node scripts/check-kommaregler-vocab.mjs             # check all kommaregler questions
 *   node scripts/check-kommaregler-vocab.mjs --strict     # exit 1 if any unmatched
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../src/lib/data');

const STRICT = process.argv.includes('--strict');

function loadJson(filename) {
  return JSON.parse(readFileSync(join(DATA_DIR, filename), 'utf8'));
}

const grammar = loadJson('grammar.json');
const vocabB2 = loadJson('vocab-b2.json');
const uttrykkB2 = loadJson('uttrykk-b2.json');
const vocabC = loadJson('vocab-c.json');
const uttrykkC = loadJson('uttrykk-c.json');
const vocabA1 = loadJson('vocab-a1.json');
const uttrykkA1 = loadJson('uttrykk-a1.json');
const vocabA2 = loadJson('vocab-a2.json');
const uttrykkA2 = loadJson('uttrykk-a2.json');
const vocabB1 = loadJson('vocab-b1.json');
const uttrykkB1 = loadJson('uttrykk-b1.json');

const questions = grammar.filter((q) => q.topic === 'kommaregler');

if (questions.length === 0) {
  console.log('No kommaregler questions found in grammar.json.');
  process.exit(0);
}

const SUFFIXES = ['ene', 'ane', 'ere', 'est', 'este', 'er', 'en', 'et', 'a', 'e', 't', 's'];

const STOPWORDS = new Set([
  'å','og','i','på','til','av','om','for','med','seg','som','er','den','det','en','et','de','noe','noen'
]);

const IRREGULAR_VERB_FORMS = {
  hadde: 'ha', hatt: 'ha', gikk: 'gå', gått: 'gå', tok: 'ta', tatt: 'ta',
  satte: 'sette', satt: 'sette', var: 'være', vært: 'være', er: 'være',
  ga: 'gi', gav: 'gi', gitt: 'gi', la: 'legge', lagt: 'legge', fikk: 'få',
  fått: 'få', ble: 'bli', blitt: 'bli', sa: 'si', sagt: 'si', visste: 'vite',
  visst: 'vite', kom: 'komme', kommet: 'komme', sto: 'stå', stod: 'stå',
  stått: 'stå', slo: 'slå', slått: 'slå', gjorde: 'gjøre', gjort: 'gjøre',
  fant: 'finne', funnet: 'finne', holdt: 'holde', het: 'hete', løp: 'løpe',
  løpt: 'løpe', falt: 'falle', bar: 'bære', båret: 'bære', dro: 'dra',
  dratt: 'dra', så: 'se', sett: 'se', lot: 'la', bet: 'bite', drev: 'drive',
  kunne: 'kan', ville: 'vil', skulle: 'skal', måtte: 'må', burde: 'bør'
};

function irregularCandidate(word) {
  return IRREGULAR_VERB_FORMS[word] ?? null;
}

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

function wordMatchesLemma(word, lemma) {
  if (word === lemma) return true;
  if (stemCandidates(word).has(lemma)) return true;
  if (word.length >= 6 && lemma.length >= 6) {
    const prefixLen = Math.min(word.length, lemma.length) - 2;
    if (prefixLen >= 4 && word.slice(0, prefixLen) === lemma.slice(0, prefixLen)) return true;
  }
  return false;
}

const singleWordLemmas = new Set();
const phraseLemmas = [];

for (const entry of [
  ...vocabB2, ...uttrykkB2, ...vocabC, ...uttrykkC,
  ...vocabA1, ...uttrykkA1, ...vocabA2, ...uttrykkA2, ...vocabB1, ...uttrykkB1
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
  const fields = ['prompt', 'sentence', 'source', 'answer', 'explanation'];
  const parts = fields.map((f) => q[f]).filter(Boolean);
  for (const arrField of ['words', 'tokens', 'alternates', 'options']) {
    if (Array.isArray(q[arrField])) parts.push(...q[arrField]);
  }
  return parts.join(' ');
}

function extractWords(text) {
  return (text.toLowerCase().match(/[a-zæøåé]+/g) || []).filter((w) => w.length > 1);
}

function findMatch(text) {
  const words = extractWords(text);
  for (const w of words) {
    for (const cand of stemCandidates(w)) {
      if (singleWordLemmas.has(cand)) return cand;
    }
  }
  for (const w of words) {
    if (w.length < 6) continue;
    for (const lemma of singleWordLemmas) {
      if (lemma.length < 6) continue;
      if (wordMatchesLemma(w, lemma)) return lemma;
    }
  }
  for (const { lemma, parts } of phraseLemmas) {
    const allPresent = parts.every((p) =>
      words.some((w) => wordMatchesLemma(w, p) || stemCandidates(w).has(p))
    );
    if (allPresent) return lemma;
  }
  return null;
}

console.log('='.repeat(60));
console.log(
  `Checking ${questions.length} kommaregler question(s) against ${singleWordLemmas.size} single-word + ${phraseLemmas.length} phrase lemmas`
);
console.log('='.repeat(60));

let unmatchedCount = 0;
for (const q of questions) {
  const match = findMatch(questionText(q));
  if (!match) {
    unmatchedCount++;
    console.log(`  UNMATCHED  ${q.id} (${q.cefr}): "${questionText(q).slice(0, 140)}"`);
  }
}

console.log(`\n${'='.repeat(60)}`);
console.log(`Total: ${questions.length} question(s) checked, ${unmatchedCount} unmatched`);

if (STRICT && unmatchedCount > 0) {
  process.exit(1);
}
