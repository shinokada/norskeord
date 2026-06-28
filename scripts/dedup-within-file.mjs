#!/usr/bin/env node
/**
 * dedup-within-file.mjs
 *
 * Removes within-file duplicate `norsk` entries from vocab-*.json files.
 *
 * STRATEGY: keep the entry whose category has MORE entries in the file.
 *   - If two entries share a norsk value in DIFFERENT categories, keep the
 *     one in the larger category (by entry count in that file).
 *   - If they are in the SAME category (exact duplicate), keep the one with
 *     the lower/earlier ID (i.e. the first occurrence).
 *   - Tiebreak (equal category sizes or same category): keep first occurrence
 *     by position in the file.
 *
 * Usage (from repo root):
 *   node scripts/dedup-within-file.mjs
 *   node scripts/dedup-within-file.mjs --dry-run
 *   node scripts/dedup-within-file.mjs --file vocab-b2.json
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { resolve, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '../src/lib/data');

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const getArg = (flag) => {
  const i = args.indexOf(flag);
  return i !== -1 && args[i + 1] ? args[i + 1] : null;
};

const singleFile = getArg('--file');
const files = singleFile
  ? [resolve(DATA_DIR, singleFile)]
  : readdirSync(DATA_DIR)
      .filter((f) => f.match(/^vocab-[a-z0-9]+\.json$/))
      .map((f) => resolve(DATA_DIR, f));

let grandTotal = 0;

for (const filePath of files) {
  const fileName = basename(filePath);
  const entries = JSON.parse(readFileSync(filePath, 'utf-8'));

  // Count entries per category
  const catCount = {};
  for (const e of entries) {
    catCount[e.category] = (catCount[e.category] ?? 0) + 1;
  }

  // Find duplicates: norsk (case-insensitive) → array of indices
  const norskIndex = {}; // norsk_lower → [index, ...]
  for (let i = 0; i < entries.length; i++) {
    const norskKey = entries[i].norsk?.trim().toLowerCase();
    if (!norskKey) continue;
    (norskIndex[norskKey] ??= []).push(i);
  }

  // Decide which indices to remove
  const toRemove = new Set();
  const decisions = [];

  for (const indices of Object.values(norskIndex)) {
    if (indices.length < 2) continue;

    // Sort indices by: (1) category size desc, (2) position asc (keep first/original)
    const scored = indices.map((i) => ({
      i,
      entry: entries[i],
      catSize: catCount[entries[i].category] ?? 0
    }));
    scored.sort((a, b) => b.catSize - a.catSize || a.i - b.i);

    // Keep the first after sorting; remove the rest
    const keep = scored[0];
    const remove = scored.slice(1);

    for (const r of remove) {
      toRemove.add(r.i);
      decisions.push({
        norsk: entries[r.i].norsk,
        keepId: keep.entry.id,
        keepCat: keep.entry.category,
        keepCatSize: keep.catSize,
        removeId: r.entry.id,
        removeCat: r.entry.category,
        removeCatSize: r.catSize
      });
    }
  }

  if (toRemove.size === 0) {
    console.log(`${fileName}: no duplicates found`);
    continue;
  }

  grandTotal += toRemove.size;
  console.log(`\n${fileName}: removing ${toRemove.size} duplicate(s)`);

  for (const d of decisions.sort((a, b) => a.norsk.localeCompare(b.norsk))) {
    const samecat = d.keepCat === d.removeCat ? ' [same-category]' : '';
    console.log(`  "${d.norsk}"${samecat}`);
    console.log(`    KEEP   ${d.keepId}  [${d.keepCat}] (${d.keepCatSize} entries in cat)`);
    console.log(`    REMOVE ${d.removeId}  [${d.removeCat}] (${d.removeCatSize} entries in cat)`);
  }

  if (!DRY_RUN) {
    const cleaned = entries.filter((_, i) => !toRemove.has(i));
    writeFileSync(filePath, JSON.stringify(cleaned, null, 2) + '\n', 'utf-8');
    console.log(`  → written (${entries.length} → ${cleaned.length} entries)`);
  }
}

console.log(`\n${DRY_RUN ? '[DRY RUN] ' : ''}Total removed: ${grandTotal} entries`);
if (DRY_RUN) console.log('No files written.');
