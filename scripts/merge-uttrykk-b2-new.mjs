#!/usr/bin/env node
/**
 * merge-uttrykk-b2-new.mjs
 *
 * Merges uttrykk-b2-new.json into uttrykk-b2.json:
 *   1. Assigns stable IDs to new entries, continuing from the highest existing
 *      u-b2-NNN in the base file (e.g. base ends at u-b2-570 → new start at u-b2-571).
 *   2. Appends new entries after the last existing entry (single flat category).
 *   3. Deduplicates on the `norsk` field (existing entries win).
 *
 * Usage (from repo root):
 *   node scripts/merge-uttrykk-b2-new.mjs
 *   node scripts/merge-uttrykk-b2-new.mjs --dry-run
 *
 * Options:
 *   --dry-run   Print a preview without writing.
 *   --base      Path to base file   (default: src/lib/data/uttrykk-b2.json)
 *   --new       Path to new file    (default: src/lib/data/uttrykk-b2-new.json)
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '../src/lib/data');

// --- CLI args ---------------------------------------------------------------
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const getArg = (flag) => {
  const i = args.indexOf(flag);
  return i !== -1 && args[i + 1] ? args[i + 1] : null;
};

const BASE_PATH = resolve(DATA_DIR, getArg('--base') ?? 'uttrykk-b2.json');
const NEW_PATH = resolve(DATA_DIR, getArg('--new') ?? 'uttrykk-b2-new.json');

// --- Load files -------------------------------------------------------------
console.log(`Base file : ${BASE_PATH}`);
console.log(`New file  : ${NEW_PATH}`);

const base = JSON.parse(readFileSync(BASE_PATH, 'utf-8'));
const incoming = JSON.parse(readFileSync(NEW_PATH, 'utf-8'));

console.log(`\nBase entries : ${base.length}`);
console.log(`New entries  : ${incoming.length}`);

// --- Find highest existing ID -----------------------------------------------
// ID format: u-b2-NNN  (zero-padded to 3 digits)
let maxId = 0;
for (const entry of base) {
  if (!entry.id) continue;
  const m = entry.id.match(/^u-b2-(\d+)$/);
  if (m) {
    const n = parseInt(m[1], 10);
    if (n > maxId) maxId = n;
  }
}

console.log(`\nHighest existing ID : u-b2-${String(maxId).padStart(3, '0')}`);
console.log(`New entries will start at : u-b2-${String(maxId + 1).padStart(3, '0')}`);

// --- Deduplicate incoming against base --------------------------------------
const existingNorsk = new Set(base.map((e) => e.norsk));
const toAdd = [];
const skipped = [];
let counter = maxId;

for (const entry of incoming) {
  if (existingNorsk.has(entry.norsk)) {
    skipped.push(entry.norsk);
    continue;
  }
  existingNorsk.add(entry.norsk);
  counter++;
  const id = `u-b2-${String(counter).padStart(3, '0')}`;
  toAdd.push({ id, ...entry });
}

// --- Build merged array -----------------------------------------------------
const merged = [...base, ...toAdd];

// --- Summary ----------------------------------------------------------------
console.log(`\nAfter merge : ${merged.length} entries`);
console.log(`  Added     : ${toAdd.length}`);
console.log(`  Skipped   : ${skipped.length} duplicates`);

if (skipped.length) {
  console.log(`\nSkipped duplicates (${skipped.length}):`);
  for (const w of skipped.sort()) console.log(`  = ${JSON.stringify(w)}`);
}

if (toAdd.length) {
  console.log(`\nSample IDs assigned (first 10 new entries):`);
  for (const e of toAdd.slice(0, 10)) {
    console.log(`  ${e.id}  "${e.norsk}"`);
  }
  const last = toAdd[toAdd.length - 1];
  console.log(`  ...`);
  console.log(`  ${last.id}  "${last.norsk}"  (last)`);
}

if (DRY_RUN) {
  console.log('\nDry run — no files written.');
  process.exit(0);
}

// --- Write ------------------------------------------------------------------
writeFileSync(BASE_PATH, JSON.stringify(merged, null, 2) + '\n', 'utf-8');
console.log(`\nDone. Written ${merged.length} entries to ${BASE_PATH}`);
