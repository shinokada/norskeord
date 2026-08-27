#!/usr/bin/env node
/**
 * dedup-pa-niva-b2.mjs
 *
 * Step 2 of the B2 På Nivå vocab/uttrykk plan (see
 * draft/b2/pa-niva/implementation/b2-vocab-uttrykk-pa-niva-arbeidsbok.md, §4).
 *
 * Dedups the 151 candidates in draft/b2/pa-niva/data/candidates-raw.json
 * against every vocab-*.json / uttrykk-*.json (all levels, incl. -preview)
 * plus norske_metaforiske_uttrykk_B1_B2.json — same universe and same
 * normalize()/near-duplicate heuristic as scripts/dedup-textbook-source.mjs
 * from the B1 project, for consistency.
 *
 * Unlike the B1 script (which parses raw markdown into a flat raw_term +
 * context shape), candidates-raw.json already has a `raw_term` field per
 * entry — except the 4 `particle-verb-correction` entries (§27), which have
 * `raw_term: null` because isolating the exact fast/løst verb pair from a
 * sentence-diff pair is a judgment call, not something to auto-extract.
 * Those 4 can't be matched by normalized-key lookup, so they're routed to
 * their own output file for manual review rather than silently skipped.
 *
 * This script does NOT write to any vocab-*.json / uttrykk-*.json file. It
 * only reads them plus candidates-raw.json, and writes candidate output
 * files for review.
 *
 * Usage (from repo root):
 *   node scripts/dedup-pa-niva-b2.mjs
 *   node scripts/dedup-pa-niva-b2.mjs --dry-run   (print summary only, no output files)
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '../src/lib/data');
const CANDIDATES_PATH = resolve(__dirname, '../draft/b2/pa-niva/data/candidates-raw.json');
const OUTPUT_DIR = resolve(__dirname, '../draft/b2/pa-niva/data');

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

// ---------------------------------------------------------------------------
// 1. Normalization (matching key only — never used for storage/display)
//    Identical to dedup-textbook-source.mjs, for consistency across projects.
// ---------------------------------------------------------------------------

function normalize(term) {
  if (!term) return '';
  let t = term;
  t = t.replace(/\*\*/g, '').replace(/\*/g, ''); // bold/italic markdown
  t = t.replace(/^\d+\.\s*/, ''); // leading list numbering ("24. ")
  t = t.replace(/\s*\([^)]*\)\s*$/g, ''); // trailing (...) tags, repeatable
  t = t.replace(/\s*\([^)]*\)\s*$/g, ''); // run twice for stacked "(m) (ureg.)" cases
  t = t.replace(/^å\s+/i, ''); // infinitive marker
  t = t.replace(/\s+/g, ' ').trim().toLowerCase();
  return t;
}

// ---------------------------------------------------------------------------
// 2. Load every vocab-*.json / uttrykk-*.json (all levels) → normalized match set
// ---------------------------------------------------------------------------

function loadExistingKeys() {
  const keysSet = new Set();
  const keysList = []; // ordered list, needed for the near-duplicate prefix scan
  const files = readdirSync(DATA_DIR).filter(
    (f) =>
      /^vocab-[a-z0-9]+\.json$/.test(f) ||
      /^uttrykk-[a-z0-9]+(-preview)?\.json$/.test(f) ||
      f === 'norske_metaforiske_uttrykk_B1_B2.json'
  );
  console.log(`Loading existing terms from ${files.length} files:`);
  for (const f of files) console.log(`  - ${f}`);
  console.log();
  for (const file of files) {
    const entries = JSON.parse(readFileSync(resolve(DATA_DIR, file), 'utf-8'));
    for (const e of entries) {
      for (const field of ['lemma', 'norsk']) {
        if (!e[field]) continue;
        const k = normalize(e[field]);
        if (!k || keysSet.has(k)) continue;
        keysSet.add(k);
        keysList.push(k);
      }
    }
  }
  return { keysSet, keysList };
}

// ---------------------------------------------------------------------------
// 3. Near-duplicate detection — identical heuristic to dedup-textbook-source.mjs
// ---------------------------------------------------------------------------

function wordCount(s) {
  return s.split(' ').filter(Boolean).length;
}

function findNearDuplicate(key, existingKeysList) {
  const keyWords = wordCount(key);
  for (const ek of existingKeysList) {
    if (key === ek) continue;
    const ekWords = wordCount(ek);
    let shorterWords, longer;
    if (key.startsWith(ek + ' ')) {
      shorterWords = ekWords;
      longer = key;
    } else if (ek.startsWith(key + ' ')) {
      shorterWords = keyWords;
      longer = ek;
    } else {
      continue;
    }
    if (shorterWords < 2) continue; // skip single-word roots — too generic
    const extraWords = wordCount(longer) - shorterWords;
    if (extraWords > 2) continue; // not a near-miss anymore, too different
    return ek;
  }
  return null;
}

// ---------------------------------------------------------------------------
// 4. Run
// ---------------------------------------------------------------------------

const allCandidates = JSON.parse(readFileSync(CANDIDATES_PATH, 'utf-8'));
const { keysSet: existingKeys, keysList: existingKeysList } = loadExistingKeys();

// Split off candidates with no raw_term (only §27 particle-verb-correction) —
// these can't be matched by normalized-key lookup and need manual review.
const noTermCandidates = allCandidates.filter((c) => !c.raw_term);
const termCandidates = allCandidates.filter((c) => c.raw_term);

// De-dupe candidates against each other first (same term surfacing from more
// than one section), keeping the first occurrence.
const seenWithinCandidates = new Set();
const uniqueCandidates = [];
for (const c of termCandidates) {
  const key = normalize(c.raw_term);
  if (!key) continue;
  if (seenWithinCandidates.has(key)) continue;
  seenWithinCandidates.add(key);
  uniqueCandidates.push({ ...c, _key: key });
}

const newCandidates = [];
const duplicateCandidates = [];
const nearDuplicateCandidates = [];
for (const c of uniqueCandidates) {
  if (existingKeys.has(c._key)) {
    duplicateCandidates.push(c);
    continue;
  }
  const nearMatch = findNearDuplicate(c._key, existingKeysList);
  if (nearMatch) {
    nearDuplicateCandidates.push({ ...c, _matchedExisting: nearMatch });
  } else {
    newCandidates.push(c);
  }
}

// ---------------------------------------------------------------------------
// 5. Report + output
// ---------------------------------------------------------------------------

console.log(`Total candidates (raw)          : ${allCandidates.length}`);
console.log(`No raw_term (needs manual term) : ${noTermCandidates.length}`);
console.log(`With raw_term                   : ${termCandidates.length}`);
console.log(`Unique candidates (by norm key)  : ${uniqueCandidates.length}`);
console.log(`Already in vocab/uttrykk (dup)   : ${duplicateCandidates.length}`);
console.log(`Near-duplicate (needs review)    : ${nearDuplicateCandidates.length}`);
console.log(`New candidates                   : ${newCandidates.length}`);
console.log();

const bySection = {};
for (const c of newCandidates) {
  (bySection[c.section] ??= []).push(c.raw_term);
}
console.log('New candidates per section:');
for (const [section, terms] of Object.entries(bySection)) {
  console.log(`  ${section}: ${terms.length}`);
}

const byDupSection = {};
for (const c of duplicateCandidates) {
  (byDupSection[c.section] ??= []).push(c.raw_term);
}
console.log('\nDuplicate candidates per section:');
for (const [section, terms] of Object.entries(byDupSection)) {
  console.log(`  ${section}: ${terms.length}`);
}

if (DRY_RUN) {
  console.log('\n[DRY RUN] No output files written.');
  process.exit(0);
}

const strip = (c) => {
  const { _key, _matchedExisting, ...rest } = c;
  return rest;
};

writeFileSync(
  resolve(OUTPUT_DIR, 'candidates-new.json'),
  JSON.stringify(newCandidates.map(strip), null, 2) + '\n',
  'utf-8'
);
writeFileSync(
  resolve(OUTPUT_DIR, 'candidates-duplicate.json'),
  JSON.stringify(duplicateCandidates.map(strip), null, 2) + '\n',
  'utf-8'
);
writeFileSync(
  resolve(OUTPUT_DIR, 'candidates-near-duplicate.json'),
  JSON.stringify(
    nearDuplicateCandidates.map((c) => ({ ...strip(c), matchedExisting: c._matchedExisting })),
    null,
    2
  ) + '\n',
  'utf-8'
);
writeFileSync(
  resolve(OUTPUT_DIR, 'candidates-no-term.json'),
  JSON.stringify(noTermCandidates, null, 2) + '\n',
  'utf-8'
);

console.log(`\nWrote ${OUTPUT_DIR}/candidates-new.json (${newCandidates.length} entries)`);
console.log(
  `Wrote ${OUTPUT_DIR}/candidates-duplicate.json (${duplicateCandidates.length} entries)`
);
console.log(
  `Wrote ${OUTPUT_DIR}/candidates-near-duplicate.json (${nearDuplicateCandidates.length} entries)`
);
console.log(`Wrote ${OUTPUT_DIR}/candidates-no-term.json (${noTermCandidates.length} entries)`);
