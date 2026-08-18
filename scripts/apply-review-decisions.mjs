#!/usr/bin/env node
/**
 * apply-review-decisions.mjs
 *
 * Step 3 (review-file side) of the Opp og fram! arbeidsbok extraction plan.
 * See draft/b1/opp-og-fram-arbeidsbok/implementation/b1-vocab-uttrykk-opp-og-fram-arbeidsbok.md §9
 *
 * Applies the manual batch-review decisions (131 items, decided in 9 batches
 * of ~15, logged in §9 of the plan doc) to candidates-review-idiom-verbs.json:
 *
 *   - items decided "vocab"   -> appended to candidates-vocab.json
 *   - items decided "uttrykk" -> appended to candidates-uttrykk.json
 *   - item #125 (å løse seg opp) -> dropped (duplicate of an existing
 *     vocab-b1.json entry, surfaced via the §8 near-duplicate cross-check)
 *
 * DECISIONS is a plain array in the exact order the items appear in
 * candidates-review-idiom-verbs.json (131 entries, 1:1 by index) - this
 * mirrors the order they were reviewed in chat, batch by batch.
 *
 * Usage (from repo root):
 *   node scripts/apply-review-decisions.mjs
 *   node scripts/apply-review-decisions.mjs --dry-run
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, '../draft/b1/opp-og-fram-arbeidsbok/data');
const DRY_RUN = process.argv.includes('--dry-run');

function loadJSON(name) {
  return JSON.parse(readFileSync(resolve(OUT_DIR, name), 'utf-8'));
}

// ---------------------------------------------------------------------------
// Decisions, in file order (batches 1-9, items 1-131)
// ---------------------------------------------------------------------------
const DECISIONS = [
  // Batch 1 (1-15)
  'uttrykk',
  'vocab',
  'uttrykk',
  'uttrykk',
  'vocab',
  'vocab',
  'uttrykk',
  'vocab',
  'uttrykk',
  'uttrykk',
  'uttrykk',
  'uttrykk',
  'vocab',
  'uttrykk',
  'uttrykk',
  // Batch 2 (16-30)
  'uttrykk',
  'uttrykk',
  'uttrykk',
  'uttrykk',
  'vocab',
  'uttrykk',
  'uttrykk',
  'vocab',
  'uttrykk',
  'uttrykk',
  'vocab',
  'vocab',
  'uttrykk',
  'uttrykk',
  'uttrykk',
  // Batch 3 (31-45)
  'uttrykk',
  'uttrykk',
  'vocab',
  'uttrykk',
  'uttrykk',
  'uttrykk',
  'uttrykk',
  'uttrykk',
  'vocab',
  'vocab',
  'vocab',
  'uttrykk',
  'uttrykk',
  'uttrykk',
  'uttrykk',
  // Batch 4 (46-60)
  'vocab',
  'uttrykk',
  'vocab',
  'vocab',
  'vocab',
  'vocab',
  'uttrykk',
  'uttrykk',
  'vocab',
  'vocab',
  'vocab',
  'uttrykk',
  'uttrykk',
  'vocab',
  'uttrykk',
  // Batch 5 (61-75)
  'uttrykk',
  'uttrykk',
  'uttrykk',
  'vocab',
  'vocab',
  'vocab',
  'uttrykk',
  'vocab',
  'uttrykk',
  'vocab',
  'uttrykk',
  'vocab',
  'vocab',
  'uttrykk',
  'uttrykk',
  // Batch 6 (76-90)
  'uttrykk',
  'vocab',
  'uttrykk',
  'vocab',
  'vocab',
  'vocab',
  'vocab',
  'uttrykk',
  'uttrykk',
  'uttrykk',
  'vocab',
  'uttrykk',
  'uttrykk',
  'vocab',
  'vocab',
  // Batch 7 (91-105)
  'vocab',
  'uttrykk',
  'vocab',
  'vocab',
  'uttrykk',
  'uttrykk',
  'uttrykk',
  'uttrykk',
  'vocab',
  'uttrykk',
  'uttrykk',
  'vocab',
  'vocab',
  'uttrykk',
  'uttrykk',
  // Batch 8 (106-120)
  'vocab',
  'uttrykk',
  'vocab',
  'uttrykk',
  'uttrykk',
  'uttrykk',
  'vocab',
  'uttrykk',
  'uttrykk',
  'uttrykk',
  'uttrykk',
  'vocab',
  'uttrykk',
  'vocab',
  'vocab',
  // Batch 9 (121-131)
  'vocab',
  'uttrykk',
  'uttrykk',
  'uttrykk',
  'drop',
  'vocab',
  'uttrykk',
  'vocab',
  'vocab',
  'vocab',
  'vocab'
];

// ---------------------------------------------------------------------------
// Load + apply
// ---------------------------------------------------------------------------
const review = loadJSON('candidates-review-idiom-verbs.json');

if (review.length !== DECISIONS.length) {
  console.error(
    `FATAL: candidates-review-idiom-verbs.json has ${review.length} items, ` +
      `but DECISIONS has ${DECISIONS.length}. Refusing to apply - order/count must match exactly.`
  );
  process.exit(1);
}

const newVocab = [];
const newUttrykk = [];
const dropped = [];

review.forEach((item, i) => {
  const decision = DECISIONS[i];
  if (decision === 'vocab') newVocab.push(item);
  else if (decision === 'uttrykk') newUttrykk.push(item);
  else if (decision === 'drop') dropped.push(item);
  else {
    console.error(`FATAL: unknown decision "${decision}" at index ${i} (${item.raw_term})`);
    process.exit(1);
  }
});

const existingVocab = loadJSON('candidates-vocab.json');
const existingUttrykk = loadJSON('candidates-uttrykk.json');

const finalVocab = [...existingVocab, ...newVocab];
const finalUttrykk = [...existingUttrykk, ...newUttrykk];

// ---------------------------------------------------------------------------
// Report + write
// ---------------------------------------------------------------------------
console.log(`Review file total                : ${review.length}`);
console.log(`  -> vocab                        : ${newVocab.length}`);
console.log(`  -> uttrykk                      : ${newUttrykk.length}`);
console.log(
  `  -> dropped (duplicate)          : ${dropped.length} (${dropped.map((d) => d.raw_term).join(', ')})`
);
console.log(`candidates-vocab.json   : ${existingVocab.length} -> ${finalVocab.length}`);
console.log(`candidates-uttrykk.json : ${existingUttrykk.length} -> ${finalUttrykk.length}`);

if (DRY_RUN) {
  console.log('\n[DRY RUN] No output files written.');
  process.exit(0);
}

writeFileSync(
  resolve(OUT_DIR, 'candidates-vocab.json'),
  JSON.stringify(finalVocab, null, 2) + '\n',
  'utf-8'
);
writeFileSync(
  resolve(OUT_DIR, 'candidates-uttrykk.json'),
  JSON.stringify(finalUttrykk, null, 2) + '\n',
  'utf-8'
);
console.log(
  `\nWrote candidates-vocab.json (${finalVocab.length}) and candidates-uttrykk.json (${finalUttrykk.length})`
);
