#!/usr/bin/env node
/**
 * merge-b2-new.mjs
 *
 * Merges vocab-b2-new.json into vocab-b2.json:
 *   1. Assigns stable IDs to new entries (continuing from the highest existing ID
 *      per category, e.g. education was at 047 → new entries become 048, 049…)
 *   2. Inserts new entries immediately after the last existing entry of the same
 *      category, preserving the original category order in the file.
 *   3. Deduplicates on the `norsk` field (existing entries win).
 *   4. Categories in new file that don't exist in base are appended at the end.
 *
 * Usage (from repo root):
 *   node scripts/merge-b2-new.mjs
 *   node scripts/merge-b2-new.mjs --dry-run
 *
 * Options:
 *   --dry-run   Print a preview (counts + sample IDs) without writing.
 *   --base      Path to base file   (default: src/lib/data/vocab-b2.json)
 *   --new       Path to new file    (default: src/lib/data/vocab-b2-new.json)
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

const BASE_PATH = resolve(DATA_DIR, getArg('--base') ?? 'vocab-b2.json');
const NEW_PATH = resolve(DATA_DIR, getArg('--new') ?? 'vocab-b2-new.json');

// --- Load files -------------------------------------------------------------
console.log(`Base file : ${BASE_PATH}`);
console.log(`New file  : ${NEW_PATH}`);

const base = JSON.parse(readFileSync(BASE_PATH, 'utf-8'));
const incoming = JSON.parse(readFileSync(NEW_PATH, 'utf-8'));

console.log(`\nBase entries : ${base.length}`);
console.log(`New entries  : ${incoming.length}`);

// --- Build per-category max ID map from base --------------------------------
// ID format: v-b2-{category}-{NNN}  (zero-padded to 3 digits)
const maxIdByCategory = {};
for (const entry of base) {
  if (!entry.id) continue;
  const m = entry.id.match(/^v-b2-(.+)-(\d+)$/);
  if (!m) continue;
  const [, cat, numStr] = m;
  const num = parseInt(numStr, 10);
  if (!maxIdByCategory[cat] || num > maxIdByCategory[cat]) {
    maxIdByCategory[cat] = num;
  }
}

// Counter that increments as we assign IDs
const nextId = { ...maxIdByCategory };
const makeId = (category) => {
  nextId[category] = (nextId[category] ?? 0) + 1;
  return `v-b2-${category}-${String(nextId[category]).padStart(3, '0')}`;
};

// --- Deduplicate incoming against base --------------------------------------
const existingNorsk = new Set(base.map((e) => e.norsk));
const toAdd = [];
const skipped = [];

for (const entry of incoming) {
  if (existingNorsk.has(entry.norsk)) {
    skipped.push(entry.norsk);
    continue;
  }
  existingNorsk.add(entry.norsk);
  // Assign ID and ensure consistent field order
  const id = makeId(entry.category);
  toAdd.push({ id, ...entry });
}

// --- Group new entries by category -----------------------------------------
const newByCategory = {};
for (const entry of toAdd) {
  (newByCategory[entry.category] ??= []).push(entry);
}

// --- Build merged array: insert after last entry of same category -----------
// Walk base, track last index per category, then splice in new entries.

// First pass: find the last index of each category in base
const lastIndexOfCat = {};
for (let i = 0; i < base.length; i++) {
  lastIndexOfCat[base[i].category] = i;
}

// Second pass: build merged array maintaining order
const merged = [];
const insertedCategories = new Set();

for (let i = 0; i < base.length; i++) {
  merged.push(base[i]);
  const cat = base[i].category;
  // If this is the last occurrence of this category, append new entries for it
  if (lastIndexOfCat[cat] === i && newByCategory[cat]) {
    merged.push(...newByCategory[cat]);
    insertedCategories.add(cat);
  }
}

// Append entries whose category didn't exist in base
const newCategoriesAppended = [];
for (const [cat, entries] of Object.entries(newByCategory)) {
  if (!insertedCategories.has(cat)) {
    merged.push(...entries);
    newCategoriesAppended.push(cat);
  }
}

// --- Summary ----------------------------------------------------------------
const catCounts = {};
for (const e of merged) {
  catCounts[e.category] = (catCounts[e.category] ?? 0) + 1;
}

console.log(`\nAfter merge : ${merged.length} entries`);
console.log(`  Added     : ${toAdd.length}`);
console.log(`  Skipped   : ${skipped.length} duplicates`);

if (newCategoriesAppended.length) {
  console.log(`\nNew categories appended at end:`);
  for (const c of newCategoriesAppended) console.log(`  + ${c}`);
}

console.log(`\nCategory breakdown (final):`);
for (const [cat, count] of Object.entries(catCounts).sort()) {
  const added = newByCategory[cat]?.length ?? 0;
  const marker = added ? ` (+${added})` : '';
  console.log(`  v-b2-${cat.padEnd(26)} ${String(count).padStart(3)}${marker}`);
}

if (skipped.length) {
  console.log(`\nSkipped duplicates (${skipped.length}):`);
  for (const w of skipped.sort()) console.log(`  = ${JSON.stringify(w)}`);
}

// Sample of new IDs assigned
if (toAdd.length) {
  console.log(`\nSample IDs assigned (first 10 new entries):`);
  for (const e of toAdd.slice(0, 10)) {
    console.log(`  ${e.id}  "${e.norsk}"`);
  }
}

if (DRY_RUN) {
  console.log('\nDry run — no files written.');
  process.exit(0);
}

// --- Write ------------------------------------------------------------------
writeFileSync(BASE_PATH, JSON.stringify(merged, null, 2) + '\n', 'utf-8');
console.log(`\nDone. Written ${merged.length} entries to ${BASE_PATH}`);
