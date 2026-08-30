#!/usr/bin/env node
/**
 * build-grammar-level-index.mjs
 *
 * Derives per-level grammar question files and a lightweight topic index
 * from src/lib/data/grammar.json (the single source of truth).
 *
 * Writes:
 *   - src/lib/data/grammar-a1.json
 *   - src/lib/data/grammar-a2.json
 *   - src/lib/data/grammar-b1.json
 *   - src/lib/data/grammar-b2.json
 *   - src/lib/data/grammar-c.json
 *   - src/lib/data/grammar-topic-index.json
 *
 * Safety check: exits non-zero if the per-level split counts + index
 * counts don't reconcile back to grammar.json's total question count.
 *
 * Usage (from project root):
 *   pnpm grammar:split
 *   node scripts/build-grammar-level-index.mjs
 *
 * See draft/b2/pa-niva/implementation/grammar-lazy-load-per-level.md
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '../src/lib/data');
const SRC_FILE = resolve(DATA_DIR, 'grammar.json');

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C'];
const LEVEL_FILE = {
  A1: 'grammar-a1.json',
  A2: 'grammar-a2.json',
  B1: 'grammar-b1.json',
  B2: 'grammar-b2.json',
  C: 'grammar-c.json'
};
const TOPIC_INDEX_FILE = resolve(DATA_DIR, 'grammar-topic-index.json');

const raw = readFileSync(SRC_FILE, 'utf-8');
const questions = JSON.parse(raw);

if (!Array.isArray(questions)) {
  console.error(`grammar.json did not parse to an array (got ${typeof questions})`);
  process.exit(1);
}

// --- Split by level, preserving original order within each level ---
const byLevel = Object.fromEntries(LEVELS.map((lvl) => [lvl, []]));
const unknownLevelIds = [];

for (const q of questions) {
  const lvl = q.cefr;
  if (byLevel[lvl]) {
    byLevel[lvl].push(q);
  } else {
    unknownLevelIds.push({ id: q.id, cefr: lvl });
  }
}

if (unknownLevelIds.length > 0) {
  console.error(`Found ${unknownLevelIds.length} question(s) with an unrecognized cefr value:`);
  for (const u of unknownLevelIds.slice(0, 10)) {
    console.error(`  ${u.id}: ${JSON.stringify(u.cefr)}`);
  }
  process.exit(1);
}

// --- Build topic index: topic -> { levels, countsByLevel, total } ---
const topicMap = new Map();
for (const q of questions) {
  if (!topicMap.has(q.topic)) {
    topicMap.set(q.topic, { levels: new Set(), countsByLevel: {}, total: 0 });
  }
  const entry = topicMap.get(q.topic);
  entry.levels.add(q.cefr);
  entry.countsByLevel[q.cefr] = (entry.countsByLevel[q.cefr] ?? 0) + 1;
  entry.total += 1;
}

const topicIndex = {};
for (const [topic, entry] of topicMap.entries()) {
  topicIndex[topic] = {
    levels: LEVELS.filter((lvl) => entry.levels.has(lvl)),
    countsByLevel: entry.countsByLevel,
    total: entry.total
  };
}

// --- Safety check: split totals + index totals reconcile to source total ---
const sourceTotal = questions.length;
const splitTotal = LEVELS.reduce((sum, lvl) => sum + byLevel[lvl].length, 0);
const indexTotal = Object.values(topicIndex).reduce((sum, t) => sum + t.total, 0);

const errors = [];
if (splitTotal !== sourceTotal) {
  errors.push(`Split files total ${splitTotal} questions, source has ${sourceTotal}`);
}
if (indexTotal !== sourceTotal) {
  errors.push(`Topic index total ${indexTotal} questions, source has ${sourceTotal}`);
}
if (errors.length > 0) {
  console.error('Reconciliation check failed:');
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}

// --- Write output files ---
for (const lvl of LEVELS) {
  const outFile = resolve(DATA_DIR, LEVEL_FILE[lvl]);
  writeFileSync(outFile, JSON.stringify(byLevel[lvl], null, 2) + '\n', 'utf-8');
  console.log(`  ${LEVEL_FILE[lvl]}: ${byLevel[lvl].length} questions`);
}

writeFileSync(TOPIC_INDEX_FILE, JSON.stringify(topicIndex, null, 2) + '\n', 'utf-8');
console.log(`  grammar-topic-index.json: ${Object.keys(topicIndex).length} topics`);

console.log(
  `\n✅  Split ${sourceTotal} questions across ${LEVELS.length} level files, ` +
    `topic index reconciles (${indexTotal}/${sourceTotal}).`
);
