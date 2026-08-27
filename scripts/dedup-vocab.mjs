#!/usr/bin/env node
/**
 * dedup-vocab.mjs
 *
 * Removes within-file duplicate entries (same `norsk` value) from vocab/uttrykk JSON files.
 * When a duplicate exists in two categories, we KEEP the entry in the smaller category
 * (fewer total entries) and DELETE the one in the larger category.
 * If the counts are equal, keeps the first occurrence and logs a warning.
 *
 * Usage (from the scripts/ directory):
 *   node dedup-vocab.mjs [--dry-run]
 *   node scripts/dedup-vocab.mjs --dry-run
 *
 * With --dry-run it only prints what it would do without writing files.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../src/lib/data');
const DRY_RUN = process.argv.includes('--dry-run');

// Files to process (all vocab and uttrykk JSON files, excluding previews and backups)
const FILES = fs
  .readdirSync(DATA_DIR)
  .filter(
    (f) =>
      f.endsWith('.json') &&
      !f.endsWith('.bak') &&
      !f.includes('preview') &&
      (f.startsWith('vocab-') || f.startsWith('uttrykk-')) &&
      !f.includes('stats')
  );

let totalRemoved = 0;

for (const filename of FILES) {
  const filepath = path.join(DATA_DIR, filename);
  const raw = fs.readFileSync(filepath, 'utf-8');
  let entries;

  try {
    entries = JSON.parse(raw);
  } catch (e) {
    console.error(`  ✗ Failed to parse ${filename}: ${e.message}`);
    continue;
  }

  if (!Array.isArray(entries)) {
    console.log(`  – Skipping ${filename} (not an array)`);
    continue;
  }

  // Count entries per category in this file
  const categoryCount = {};
  for (const entry of entries) {
    const cat = entry.category ?? '__unknown__';
    categoryCount[cat] = (categoryCount[cat] ?? 0) + 1;
  }

  // Find duplicates: group indices by norsk value
  const norskToIndices = {};
  for (let i = 0; i < entries.length; i++) {
    const norsk = entries[i].norsk;
    if (!norsk) continue;
    if (!norskToIndices[norsk]) norskToIndices[norsk] = [];
    norskToIndices[norsk].push(i);
  }

  const indicesToRemove = new Set();

  for (const [norsk, indices] of Object.entries(norskToIndices)) {
    if (indices.length < 2) continue;

    // Sort: we want to KEEP the entry in the category with the FEWEST entries
    // i.e. remove entries in larger categories first
    const sorted = [...indices].sort((a, b) => {
      const catA = entries[a].category ?? '__unknown__';
      const catB = entries[b].category ?? '__unknown__';
      const countA = categoryCount[catA] ?? 0;
      const countB = categoryCount[catB] ?? 0;
      // ascending: smallest count first → we keep first, remove rest
      return countA - countB;
    });

    // Keep the first (smallest category), mark the rest for removal
    const [keep, ...remove] = sorted;
    const keepCat = entries[keep].category;
    const keepCount = categoryCount[keepCat] ?? 0;

    for (const idx of remove) {
      const removeCat = entries[idx].category;
      const removeCount = categoryCount[removeCat] ?? 0;
      if (DRY_RUN) {
        console.log(
          `  [${filename}] KEEP "${norsk}" in [${keepCat}] (${keepCount} entries), ` +
            `REMOVE from [${removeCat}] (${removeCount} entries)` +
            (keepCount === removeCount ? '  ⚠ EQUAL COUNTS – kept first occurrence' : '')
        );
      }
      indicesToRemove.add(idx);
    }
  }

  if (indicesToRemove.size === 0) {
    console.log(`  ✓ ${filename}: no duplicates found`);
    continue;
  }

  const cleaned = entries.filter((_, i) => !indicesToRemove.has(i));
  totalRemoved += indicesToRemove.size;

  console.log(
    `  → ${filename}: removed ${indicesToRemove.size} duplicate(s) (${entries.length} → ${cleaned.length} entries)`
  );

  if (!DRY_RUN) {
    // Write backup first
    fs.writeFileSync(filepath + '.bak2', raw, 'utf-8');
    fs.writeFileSync(filepath, JSON.stringify(cleaned, null, 2) + '\n', 'utf-8');
  }
}

console.log(
  `\n${DRY_RUN ? '[DRY RUN] Would remove' : 'Removed'} ${totalRemoved} duplicate entries across ${FILES.length} files.`
);
if (DRY_RUN) {
  console.log('Run without --dry-run to apply changes (backups saved as *.bak2).');
}
